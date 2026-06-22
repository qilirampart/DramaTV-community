package com.dramatv.community.admin.feedops;

import com.dramatv.community.admin.auditlogs.AdminAuditLogService;
import com.dramatv.community.admin.auth.AdminAccessService;
import com.dramatv.community.admin.feedops.dto.request.AdminFeedOpsPageUpdateRequest;
import com.dramatv.community.admin.feedops.dto.response.AdminFeedOpsCandidateListResponse;
import com.dramatv.community.admin.feedops.dto.response.AdminFeedOpsPageResponse;
import com.dramatv.community.identity.application.CurrentUser;
import com.dramatv.community.shared.error.ApiBusinessException;
import com.dramatv.community.shared.media.JdbcMediaUrlResolver;
import com.dramatv.community.shared.request.MdcBusinessContextScope;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminFeedOpsService {

    private static final Logger log = LoggerFactory.getLogger(AdminFeedOpsService.class);
    private static final String[] MANAGE_ROLES = {"admin", "operator"};
    private static final int PAGE_FALLBACK_QUERY_LIMIT = 48;
    private static final int DEFAULT_CANDIDATE_PAGE = 1;
    private static final int DEFAULT_CANDIDATE_PAGE_SIZE = 15;
    private static final int MAX_CANDIDATE_PAGE_SIZE = 60;
    private static final TypeReference<List<StoredItemRef>> STORED_ITEM_TYPE = new TypeReference<>() {
    };

    private static final String LOAD_SLOT_CONFIGS_SQL = """
            select
                config.slot_key,
                config.status_code,
                config.items_json::text as items_json_text,
                config.updated_at,
                config.published_at,
                updater.display_name as updated_by_display_name
            from admin_feed_slot_configs config
            left join users updater
                on updater.id = config.updated_by
            where config.page_key = ?
            """;

    private static final String UPSERT_SLOT_CONFIG_SQL = """
            insert into admin_feed_slot_configs (
                page_key,
                slot_key,
                status_code,
                items_json,
                updated_by,
                published_at
            )
            values (?, ?, ?, cast(? as jsonb), ?, ?)
            on conflict (page_key, slot_key) do update
            set status_code = excluded.status_code,
                items_json = excluded.items_json,
                updated_by = excluded.updated_by,
                published_at = excluded.published_at,
                updated_at = now()
            """;

    private static final String PROMPT_CANDIDATE_SQL = """
            select
                'prompt' as target_type,
                prompt.id as target_id,
                'prompt' as content_kind,
                case
                    when prompt.modality = 'image' then '图片提示词'
                    else '视频提示词'
                end as item_type_label,
                null::text as target_slug,
                prompt.title,
                author.id as author_id,
                author.display_name as author_display_name,
                coalesce(author_avatar_asset.object_key, author.avatar_url) as author_avatar_url,
                author_avatar_asset.storage_provider as author_avatar_storage_provider,
                author_avatar_asset.bucket_name as author_avatar_bucket_name,
                prompt.modality as prompt_modality,
                null::text as channel_slug,
                null::text as channel_title,
                prompt.summary as summary_text,
                coalesce(prompt.published_at, prompt.created_at) as published_at,
                prompt_cover.storage_provider as prompt_cover_storage_provider,
                prompt_cover.bucket_name as prompt_cover_bucket_name,
                prompt_cover.object_key as prompt_cover_url,
                prompt_cover.asset_kind as prompt_cover_asset_kind,
                prompt_primary_example.storage_provider as prompt_primary_example_storage_provider,
                prompt_primary_example.bucket_name as prompt_primary_example_bucket_name,
                prompt_primary_example.object_key as prompt_primary_example_url,
                prompt_primary_example.asset_kind as prompt_primary_example_asset_kind,
                prompt_preview_example.storage_provider as prompt_preview_example_storage_provider,
                prompt_preview_example.bucket_name as prompt_preview_example_bucket_name,
                prompt_preview_example.object_key as prompt_preview_example_url,
                prompt_preview_example.asset_kind as prompt_preview_example_asset_kind
            from prompt_entries prompt
            join users author on author.id = prompt.author_id
            left join media_assets author_avatar_asset on author_avatar_asset.id = author.avatar_asset_id
            left join media_assets prompt_cover on prompt_cover.id = prompt.cover_asset_id
            left join media_assets prompt_primary_example on prompt_primary_example.id = prompt.primary_example_asset_id
            left join media_assets prompt_preview_example on prompt_preview_example.id = (
                select link.media_asset_id
                from prompt_example_links link
                where link.prompt_id = prompt.id
                  and link.role_code = 'preview'
                order by link.sort_order asc, link.created_at asc
                limit 1
            )
            where prompt.publish_status = 'published'
              and prompt.deleted_at is null
            """;

    private static final String WORKFLOW_CANDIDATE_SQL = """
            select
                'workflow' as target_type,
                workflow.id as target_id,
                'workflow_work' as content_kind,
                '工作流' as item_type_label,
                null::text as target_slug,
                workflow.title,
                author.id as author_id,
                author.display_name as author_display_name,
                coalesce(author_avatar_asset.object_key, author.avatar_url) as author_avatar_url,
                author_avatar_asset.storage_provider as author_avatar_storage_provider,
                author_avatar_asset.bucket_name as author_avatar_bucket_name,
                null::text as prompt_modality,
                null::text as channel_slug,
                null::text as channel_title,
                coalesce(workflow.summary, workflow.scenario_text) as summary_text,
                coalesce(workflow.published_at, workflow.created_at) as published_at,
                workflow_cover.storage_provider as workflow_cover_storage_provider,
                workflow_cover.bucket_name as workflow_cover_bucket_name,
                workflow_cover.object_key as workflow_cover_url
            from workflows workflow
            join users author on author.id = workflow.author_id
            left join media_assets author_avatar_asset on author_avatar_asset.id = author.avatar_asset_id
            left join media_assets workflow_cover on workflow_cover.id = workflow.cover_asset_id
            where workflow.publish_status = 'published'
              and workflow.deleted_at is null
            """;

    private static final String POST_CANDIDATE_SQL = """
            select
                'post' as target_type,
                thread.id as target_id,
                'post' as content_kind,
                '帖子' as item_type_label,
                thread.slug as target_slug,
                thread.title,
                author.id as author_id,
                author.display_name as author_display_name,
                coalesce(author_avatar_asset.object_key, author.avatar_url) as author_avatar_url,
                author_avatar_asset.storage_provider as author_avatar_storage_provider,
                author_avatar_asset.bucket_name as author_avatar_bucket_name,
                null::text as prompt_modality,
                channel.slug as channel_slug,
                channel.title as channel_title,
                thread.excerpt_text as summary_text,
                coalesce(thread.last_activity_at, thread.published_at, thread.created_at) as published_at
            from discussion_threads thread
            join users author on author.id = thread.author_id
            left join media_assets author_avatar_asset on author_avatar_asset.id = author.avatar_asset_id
            join discussion_channels channel on channel.id = thread.channel_id
            where thread.publish_status = 'published'
              and thread.deleted_at is null
              and channel.status_code = 'active'
            """;

    private static final String CHANNEL_CANDIDATE_SQL = """
            select
                'channel' as target_type,
                channel.id as target_id,
                'discussion_channel' as content_kind,
                '讨论频道' as item_type_label,
                null::text as target_slug,
                channel.title,
                null::uuid as author_id,
                '频道运营' as author_display_name,
                null::text as author_avatar_url,
                null::text as author_avatar_storage_provider,
                null::text as author_avatar_bucket_name,
                null::text as prompt_modality,
                channel.slug as channel_slug,
                channel.title as channel_title,
                channel.description_text as summary_text,
                channel.updated_at as published_at
            from discussion_channels channel
            where channel.status_code = 'active'
            """;

    private static final String PROMPT_SNAPSHOT_SQL = """
            select
                'prompt' as target_type,
                prompt.id as target_id,
                'prompt' as content_kind,
                case
                    when prompt.modality = 'image' then '图片提示词'
                    else '视频提示词'
                end as item_type_label,
                null::text as target_slug,
                prompt.title,
                author.id as author_id,
                author.display_name as author_display_name,
                coalesce(author_avatar_asset.object_key, author.avatar_url) as author_avatar_url,
                author_avatar_asset.storage_provider as author_avatar_storage_provider,
                author_avatar_asset.bucket_name as author_avatar_bucket_name,
                prompt.modality as prompt_modality,
                null::text as channel_slug,
                null::text as channel_title,
                prompt.summary as summary_text,
                coalesce(prompt.published_at, prompt.created_at) as published_at,
                prompt_cover.storage_provider as prompt_cover_storage_provider,
                prompt_cover.bucket_name as prompt_cover_bucket_name,
                prompt_cover.object_key as prompt_cover_url,
                prompt_cover.asset_kind as prompt_cover_asset_kind,
                prompt_primary_example.storage_provider as prompt_primary_example_storage_provider,
                prompt_primary_example.bucket_name as prompt_primary_example_bucket_name,
                prompt_primary_example.object_key as prompt_primary_example_url,
                prompt_primary_example.asset_kind as prompt_primary_example_asset_kind,
                prompt_preview_example.storage_provider as prompt_preview_example_storage_provider,
                prompt_preview_example.bucket_name as prompt_preview_example_bucket_name,
                prompt_preview_example.object_key as prompt_preview_example_url,
                prompt_preview_example.asset_kind as prompt_preview_example_asset_kind
            from prompt_entries prompt
            join users author on author.id = prompt.author_id
            left join media_assets author_avatar_asset on author_avatar_asset.id = author.avatar_asset_id
            left join media_assets prompt_cover on prompt_cover.id = prompt.cover_asset_id
            left join media_assets prompt_primary_example on prompt_primary_example.id = prompt.primary_example_asset_id
            left join media_assets prompt_preview_example on prompt_preview_example.id = (
                select link.media_asset_id
                from prompt_example_links link
                where link.prompt_id = prompt.id
                  and link.role_code = 'preview'
                order by link.sort_order asc, link.created_at asc
                limit 1
            )
            where prompt.id = ?
              and prompt.publish_status = 'published'
              and prompt.deleted_at is null
            limit 1
            """;

    private static final String WORKFLOW_SNAPSHOT_SQL = """
            select
                'workflow' as target_type,
                workflow.id as target_id,
                'workflow_work' as content_kind,
                '工作流' as item_type_label,
                null::text as target_slug,
                workflow.title,
                author.id as author_id,
                author.display_name as author_display_name,
                coalesce(author_avatar_asset.object_key, author.avatar_url) as author_avatar_url,
                author_avatar_asset.storage_provider as author_avatar_storage_provider,
                author_avatar_asset.bucket_name as author_avatar_bucket_name,
                null::text as prompt_modality,
                null::text as channel_slug,
                null::text as channel_title,
                coalesce(workflow.summary, workflow.scenario_text) as summary_text,
                coalesce(workflow.published_at, workflow.created_at) as published_at,
                workflow_cover.storage_provider as workflow_cover_storage_provider,
                workflow_cover.bucket_name as workflow_cover_bucket_name,
                workflow_cover.object_key as workflow_cover_url
            from workflows workflow
            join users author on author.id = workflow.author_id
            left join media_assets author_avatar_asset on author_avatar_asset.id = author.avatar_asset_id
            left join media_assets workflow_cover on workflow_cover.id = workflow.cover_asset_id
            where workflow.id = ?
              and workflow.publish_status = 'published'
              and workflow.deleted_at is null
            limit 1
            """;

    private static final String POST_SNAPSHOT_SQL = """
            select
                'post' as target_type,
                thread.id as target_id,
                'post' as content_kind,
                '帖子' as item_type_label,
                thread.slug as target_slug,
                thread.title,
                author.id as author_id,
                author.display_name as author_display_name,
                coalesce(author_avatar_asset.object_key, author.avatar_url) as author_avatar_url,
                author_avatar_asset.storage_provider as author_avatar_storage_provider,
                author_avatar_asset.bucket_name as author_avatar_bucket_name,
                null::text as prompt_modality,
                channel.slug as channel_slug,
                channel.title as channel_title,
                thread.excerpt_text as summary_text,
                coalesce(thread.last_activity_at, thread.published_at, thread.created_at) as published_at
            from discussion_threads thread
            join users author on author.id = thread.author_id
            left join media_assets author_avatar_asset on author_avatar_asset.id = author.avatar_asset_id
            join discussion_channels channel on channel.id = thread.channel_id
            where thread.id = ?
              and thread.publish_status = 'published'
              and thread.deleted_at is null
              and channel.status_code = 'active'
            limit 1
            """;

    private static final String CHANNEL_SNAPSHOT_SQL = """
            select
                'channel' as target_type,
                channel.id as target_id,
                'discussion_channel' as content_kind,
                '讨论频道' as item_type_label,
                null::text as target_slug,
                channel.title,
                null::uuid as author_id,
                '频道运营' as author_display_name,
                null::text as author_avatar_url,
                null::text as author_avatar_storage_provider,
                null::text as author_avatar_bucket_name,
                null::text as prompt_modality,
                channel.slug as channel_slug,
                channel.title as channel_title,
                channel.description_text as summary_text,
                channel.updated_at as published_at
            from discussion_channels channel
            where channel.id = ?
              and channel.status_code = 'active'
            limit 1
            """;

    private static final int DISCUSSION_CHANNEL_THREAD_LIMIT = 8;

    private static final FeedOpsPageDefinition HOME_PAGE = new FeedOpsPageDefinition(
            "home",
            "首页运营",
            List.of(
                    new SlotDefinition("home-hero", "首页轮播", "对应首页首屏 6 个滚动视频位，只允许挂载 prompt / workflow。", 6, List.of("prompt", "workflow")),
                    new SlotDefinition("recommended-primary", "为你推荐", "对应首页唯一一组“为你推荐”4 卡内容，只允许挂载 prompt / workflow。", 4, List.of("prompt", "workflow")),
                    new SlotDefinition("canvas", "精选画布", "对应首页“精选画布”分区 4 卡内容，只允许挂载 prompt / workflow。", 4, List.of("prompt", "workflow")),
                    new SlotDefinition("commercial", "电视广告", "对应首页“电视广告”分区 4 卡内容，只允许挂载 prompt / workflow。", 4, List.of("prompt", "workflow")),
                    new SlotDefinition("animation", "动画", "对应首页“动画”分区 4 卡内容，只允许挂载 prompt / workflow。", 4, List.of("prompt", "workflow")),
                    new SlotDefinition("narrative", "叙事短片", "对应首页“叙事短片”分区 4 卡内容，只允许挂载 prompt / workflow。", 4, List.of("prompt", "workflow")),
                    new SlotDefinition("mv", "MV", "对应首页“MV”分区 4 卡内容，只允许挂载 prompt / workflow。", 4, List.of("prompt", "workflow")),
                    new SlotDefinition("creative", "创意", "对应首页“创意”分区 4 卡内容，只允许挂载 prompt / workflow。", 4, List.of("prompt", "workflow"))
            ),
            List.of("prompt", "workflow")
    );

    private static final FeedOpsPageDefinition FEATURED_PAGE = new FeedOpsPageDefinition(
            "featured",
            "精选运营",
            List.of(
                    new SlotDefinition("featured-all", "全部首屏", "对应精选页默认“全部”tab 首屏不滚动可见的前 12 条内容，可混排 prompt / workflow。", 12, List.of("prompt", "workflow")),
                    new SlotDefinition("featured-workflow", "工作流 tab", "对应精选页“工作流”tab 首屏不滚动可见的前 12 条内容，只允许挂载 workflow。", 12, List.of("workflow")),
                    new SlotDefinition("featured-video-prompt", "视频提示词 tab", "对应精选页“视频提示词”tab 首屏不滚动可见的前 12 条内容，只允许挂载 prompt。", 12, List.of("prompt")),
                    new SlotDefinition("featured-image-prompt", "图片提示词 tab", "对应精选页“图片提示词”tab 首屏不滚动可见的前 12 条内容，只允许挂载 prompt。", 12, List.of("prompt")),
                    new SlotDefinition("featured-activity", "活动 tab", "对应精选页“活动”tab 首屏内容，只允许挂载 prompt / workflow，帖子不进入公共精选。", 12, List.of("prompt", "workflow"))
            ),
            List.of("prompt", "workflow")
    );
    private static final String FEATURED_HOT_PAGE_KEY = "featured-hot";

    private static final FeedOpsPageDefinition LANDING_PAGE = new FeedOpsPageDefinition(
            "landing",
            "落地页运营",
            List.of(
                    new SlotDefinition(
                            "landing-archive-grid",
                            "精选档案",
                            "对应社区根首页 / 的“精选档案”区域，控制首屏 12 张资源卡片顺序，只允许挂载 prompt / workflow。",
                            12,
                            List.of("prompt", "workflow")
                    )
            ),
            List.of("prompt", "workflow")
    );

    private final JdbcTemplate jdbcTemplate;
    private final AdminAccessService adminAccessService;
    private final AdminAuditLogService adminAuditLogService;
    private final JdbcMediaUrlResolver jdbcMediaUrlResolver;
    private final ObjectMapper objectMapper;

    public AdminFeedOpsService(
            JdbcTemplate jdbcTemplate,
            AdminAccessService adminAccessService,
            AdminAuditLogService adminAuditLogService,
            JdbcMediaUrlResolver jdbcMediaUrlResolver,
            ObjectMapper objectMapper
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.adminAccessService = adminAccessService;
        this.adminAuditLogService = adminAuditLogService;
        this.jdbcMediaUrlResolver = jdbcMediaUrlResolver;
        this.objectMapper = objectMapper;
    }

    public AdminFeedOpsPageResponse getHomeConfig() {
        adminAccessService.requireAnyRole(MANAGE_ROLES);
        return loadPageConfig(HOME_PAGE);
    }

    public AdminFeedOpsCandidateListResponse getHomeCandidates(
            String slotKey,
            String keyword,
            String promptFilter,
            Integer page,
            Integer pageSize
    ) {
        adminAccessService.requireAnyRole(MANAGE_ROLES);
        return loadCandidatePage(HOME_PAGE, slotKey, keyword, promptFilter, page, pageSize);
    }

    public AdminFeedOpsPageResponse getFeaturedConfig() {
        return getFeaturedConfig(null);
    }

    public AdminFeedOpsPageResponse getFeaturedConfig(String sort) {
        adminAccessService.requireAnyRole(MANAGE_ROLES);
        return loadPageConfig(resolveFeaturedPageDefinition(sort));
    }

    public AdminFeedOpsCandidateListResponse getFeaturedCandidates(
            String slotKey,
            String keyword,
            String promptFilter,
            Integer page,
            Integer pageSize
    ) {
        adminAccessService.requireAnyRole(MANAGE_ROLES);
        return loadCandidatePage(FEATURED_PAGE, slotKey, keyword, promptFilter, page, pageSize);
    }

    public AdminFeedOpsPageResponse getLandingConfig() {
        adminAccessService.requireAnyRole(MANAGE_ROLES);
        return loadPageConfig(LANDING_PAGE);
    }

    public AdminFeedOpsCandidateListResponse getLandingCandidates(
            String slotKey,
            String keyword,
            String promptFilter,
            Integer page,
            Integer pageSize
    ) {
        adminAccessService.requireAnyRole(MANAGE_ROLES);
        return loadCandidatePage(LANDING_PAGE, slotKey, keyword, promptFilter, page, pageSize);
    }

    public AdminFeedOpsPageResponse getDiscussionsConfig() {
        adminAccessService.requireAnyRole(MANAGE_ROLES);
        return loadPageConfig(buildDiscussionsPageDefinition());
    }

    public AdminFeedOpsCandidateListResponse getDiscussionCandidates(
            String slotKey,
            String keyword,
            String promptFilter,
            Integer page,
            Integer pageSize
    ) {
        adminAccessService.requireAnyRole(MANAGE_ROLES);
        return loadCandidatePage(buildDiscussionsPageDefinition(), slotKey, keyword, promptFilter, page, pageSize);
    }

    @Transactional
    public AdminFeedOpsPageResponse updateHomeConfig(AdminFeedOpsPageUpdateRequest request) {
        return updatePageConfig(HOME_PAGE, request);
    }

    @Transactional
    public AdminFeedOpsPageResponse updateFeaturedConfig(AdminFeedOpsPageUpdateRequest request) {
        return updateFeaturedConfig(request, null);
    }

    @Transactional
    public AdminFeedOpsPageResponse updateFeaturedConfig(AdminFeedOpsPageUpdateRequest request, String sort) {
        return updatePageConfig(resolveFeaturedPageDefinition(sort), request);
    }

    @Transactional
    public AdminFeedOpsPageResponse updateLandingConfig(AdminFeedOpsPageUpdateRequest request) {
        return updatePageConfig(LANDING_PAGE, request);
    }

    @Transactional
    public AdminFeedOpsPageResponse updateDiscussionsConfig(AdminFeedOpsPageUpdateRequest request) {
        return updatePageConfig(buildDiscussionsPageDefinition(), request);
    }

    private AdminFeedOpsPageResponse updatePageConfig(
            FeedOpsPageDefinition pageDefinition,
            AdminFeedOpsPageUpdateRequest request
    ) {
        CurrentUser operator = adminAccessService.requireAnyRole(MANAGE_ROLES);
        try (MdcBusinessContextScope ignored = MdcBusinessContextScope.open(feedOpsPageContext(pageDefinition.pageKey()))) {
            String statusCode = normalizeStatusCode(request.statusCode());
            Map<String, List<StoredItemRef>> slotPayloads = normalizeSlotPayloads(pageDefinition, request.slots());
            OffsetDateTime publishedAt = "published".equals(statusCode) ? OffsetDateTime.now() : null;
            int configuredItemCount = slotPayloads.values().stream()
                    .mapToInt(List::size)
                    .sum();

            for (SlotDefinition definition : pageDefinition.slots()) {
                List<StoredItemRef> items = slotPayloads.getOrDefault(definition.key(), List.of());
                validateSlotItems(definition, items);
                upsertSlotConfig(pageDefinition.pageKey(), definition.key(), statusCode, items, operator.id(), publishedAt);
            }

            AdminFeedOpsPageResponse response = loadPageConfig(pageDefinition);
            log.info(
                    "admin feed ops update success: operatorId={} pageKey={} statusCode={} configuredSlotCount={} configuredItemCount={} published={}",
                    operator.id(),
                    pageDefinition.pageKey(),
                    statusCode,
                    slotPayloads.size(),
                    configuredItemCount,
                    "published".equals(statusCode)
            );
            adminAuditLogService.recordSuccessfulOperation(
                    operator,
                    "feed_ops",
                    "运营编排",
                    "update_page",
                    "保存运营配置",
                    "feed_ops_page",
                    pageDefinition.pageKey(),
                    pageDefinition.pageLabel(),
                    "sensitive",
                    "运营配置已保存",
                    "/api/admin/feed-ops/" + pageDefinition.pageKey(),
                    "PUT",
                    "statusCode=%s,slotCount=%s".formatted(statusCode, slotPayloads.size())
            );
            return response;
        }
    }

    private Map<String, String> feedOpsPageContext(String pageKey) {
        return Map.of(
                "targetType", "feed_ops_page",
                "targetId", pageKey
        );
    }

    private AdminFeedOpsPageResponse loadPageConfig(FeedOpsPageDefinition pageDefinition) {
        Map<String, SlotConfigRow> configRows = loadSlotConfigRows(pageDefinition.pageKey());
        List<AdminFeedOpsPageResponse.ContentItem> pageFallbackPool = loadFallbackCandidatePool(pageDefinition);
        Map<String, List<AdminFeedOpsPageResponse.ContentItem>> fallbackSlotItems = buildFallbackSlotItems(pageDefinition, pageFallbackPool);
        List<AdminFeedOpsPageResponse.Slot> slots = new ArrayList<>();
        int configuredItemCount = 0;

        for (SlotDefinition definition : pageDefinition.slots()) {
            SlotConfigRow row = configRows.get(definition.key());
            List<StoredItemRef> refs = row == null
                    ? List.of()
                    : readStoredItemRefs(row.itemsJsonText()).stream()
                            .filter(ref -> definition.allowedTargetTypes().contains(ref.targetType()))
                            .toList();
            if (refs.size() > definition.maxItems()) {
                refs = List.copyOf(refs.subList(0, definition.maxItems()));
            }
            List<AdminFeedOpsPageResponse.ContentItem> items = refs.stream()
                    .map(this::resolveStoredItem)
                    .toList();
            List<AdminFeedOpsPageResponse.ContentItem> fallbackItems = fallbackSlotItems.getOrDefault(definition.key(), List.of());
            configuredItemCount += items.size();
            slots.add(new AdminFeedOpsPageResponse.Slot(
                    definition.key(),
                    definition.title(),
                    definition.description(),
                    definition.maxItems(),
                    definition.allowedTargetTypes(),
                    items,
                    fallbackItems
            ));
        }
        SlotConfigRow latestConfigRow = configRows.values()
                .stream()
                .filter(row -> row.updatedAt() != null)
                .max((left, right) -> left.updatedAt().compareTo(right.updatedAt()))
                .orElse(null);

        String statusCode = resolvePageStatus(pageDefinition, configRows);
        OffsetDateTime updatedAt = latestConfigRow == null ? null : latestConfigRow.updatedAt();
        String updatedByDisplayName = latestConfigRow == null ? null : latestConfigRow.updatedByDisplayName();
        OffsetDateTime publishedAt = configRows.values()
                .stream()
                .map(SlotConfigRow::publishedAt)
                .filter(value -> value != null)
                .max(OffsetDateTime::compareTo)
                .orElse(null);

        return new AdminFeedOpsPageResponse(
                new AdminFeedOpsPageResponse.Summary(
                        pageDefinition.pageKey(),
                        statusCode,
                        updatedAt,
                        updatedByDisplayName,
                        publishedAt,
                        configuredItemCount,
                        countCandidatePool(pageDefinition)
                ),
                List.copyOf(slots),
                List.of()
        );
    }

    private List<AdminFeedOpsPageResponse.ContentItem> loadFallbackCandidatePool(FeedOpsPageDefinition pageDefinition) {
        List<AdminFeedOpsPageResponse.ContentItem> items = new ArrayList<>();
        for (String candidateType : pageDefinition.candidateTargetTypes()) {
            items.addAll(loadCandidatesForType(candidateType, null, CandidatePromptFilter.ALL, null, PAGE_FALLBACK_QUERY_LIMIT, 0));
        }
        return dedupeAndSortItems(items).stream()
                .limit(PAGE_FALLBACK_QUERY_LIMIT)
                .toList();
    }

    private List<AdminFeedOpsPageResponse.ContentItem> dedupeAndSortItems(List<AdminFeedOpsPageResponse.ContentItem> items) {
        return items.stream()
                .collect(Collectors.toMap(
                        item -> item.targetType() + ":" + item.targetId(),
                        item -> item,
                        (left, right) -> left,
                        LinkedHashMap::new
                ))
                .values()
                .stream()
                .sorted((left, right) -> compareItems(right, left))
                .toList();
    }

    private AdminFeedOpsCandidateListResponse loadCandidatePage(
            FeedOpsPageDefinition pageDefinition,
            String slotKey,
            String keyword,
            String promptFilter,
            Integer page,
            Integer pageSize
    ) {
        SlotDefinition slotDefinition = requireSlotDefinition(pageDefinition, slotKey);
        CandidatePromptFilter normalizedPromptFilter = normalizeCandidatePromptFilter(promptFilter);
        CandidatePageRequest normalizedRequest = normalizeCandidatePageRequest(page, pageSize);
        String normalizedKeyword = normalizeKeyword(keyword);
        String scopedDiscussionChannelSlug = "discussions".equals(pageDefinition.pageKey())
                ? discussionSlotChannelSlug(slotDefinition.key())
                : null;
        List<String> queryTargetTypes = resolveQueryTargetTypes(slotDefinition, normalizedPromptFilter);

        int totalCandidateItems = countCandidatePool(pageDefinition);
        int totalItems = 0;
        for (String targetType : queryTargetTypes) {
            totalItems += countCandidatesForType(targetType, normalizedKeyword, normalizedPromptFilter, scopedDiscussionChannelSlug);
        }

        int totalPages = Math.max(1, (int) Math.ceil(totalItems / (double) normalizedRequest.pageSize()));
        int safePage = Math.min(Math.max(normalizedRequest.page(), 1), totalPages);
        int offset = totalItems == 0 ? 0 : (safePage - 1) * normalizedRequest.pageSize();
        List<AdminFeedOpsPageResponse.ContentItem> pageItems = totalItems == 0
                ? List.of()
                : loadCandidatePageItems(queryTargetTypes, normalizedKeyword, normalizedPromptFilter, scopedDiscussionChannelSlug, normalizedRequest.pageSize(), offset);

        return new AdminFeedOpsCandidateListResponse(
                new AdminFeedOpsCandidateListResponse.Summary(
                        pageDefinition.pageKey(),
                        slotDefinition.key(),
                        totalCandidateItems,
                        totalItems
                ),
                new AdminFeedOpsCandidateListResponse.Pagination(
                        safePage,
                        normalizedRequest.pageSize(),
                        totalItems,
                        totalPages,
                        safePage > 1,
                        safePage < totalPages
                ),
                pageItems
        );
    }

    private List<String> resolveQueryTargetTypes(
            SlotDefinition slotDefinition,
            CandidatePromptFilter promptFilter
    ) {
        return List.copyOf(new LinkedHashSet<>(slotDefinition.allowedTargetTypes()));
    }

    private int countCandidatePool(FeedOpsPageDefinition pageDefinition) {
        int total = 0;
        for (String targetType : pageDefinition.candidateTargetTypes()) {
            total += countCandidatesForType(targetType, null, CandidatePromptFilter.ALL, null);
        }
        return total;
    }

    private int countCandidatesForType(
            String targetType,
            String keyword,
            CandidatePromptFilter promptFilter,
            String discussionChannelSlug
    ) {
        String sql = "select count(*) from (" + buildCandidateSelectSql(targetType, keyword, promptFilter, discussionChannelSlug, false) + ") candidates";
        Integer count = jdbcTemplate.query(
                connection -> {
                    PreparedStatement statement = connection.prepareStatement(sql);
                    bindCandidateQueryParameters(statement, targetType, keyword, promptFilter, discussionChannelSlug, null, null);
                    return statement;
                },
                resultSet -> resultSet.next() ? resultSet.getInt(1) : 0
        );
        return count == null ? 0 : count;
    }

    private List<AdminFeedOpsPageResponse.ContentItem> loadCandidatePageItems(
            List<String> targetTypes,
            String keyword,
            CandidatePromptFilter promptFilter,
            String discussionChannelSlug,
            int pageSize,
            int offset
    ) {
        int fetchLimit = Math.max(pageSize + offset, pageSize);
        List<AdminFeedOpsPageResponse.ContentItem> candidateItems = new ArrayList<>();

        for (String targetType : targetTypes) {
            candidateItems.addAll(loadCandidatesForType(
                    targetType,
                    keyword,
                    promptFilter,
                    discussionChannelSlug,
                    fetchLimit,
                    0
            ));
        }

        List<AdminFeedOpsPageResponse.ContentItem> sortedItems = dedupeAndSortItems(candidateItems);
        if (offset >= sortedItems.size()) {
            return List.of();
        }

        int endIndex = Math.min(offset + pageSize, sortedItems.size());
        return List.copyOf(sortedItems.subList(offset, endIndex));
    }

    private List<AdminFeedOpsPageResponse.ContentItem> loadCandidatesForType(
            String targetType,
            String keyword,
            CandidatePromptFilter promptFilter,
            String discussionChannelSlug,
            Integer limit,
            Integer offset
    ) {
        String sql = buildCandidateSelectSql(targetType, keyword, promptFilter, discussionChannelSlug, true);
        return jdbcTemplate.query(
                connection -> {
                    PreparedStatement statement = connection.prepareStatement(sql);
                    bindCandidateQueryParameters(statement, targetType, keyword, promptFilter, discussionChannelSlug, limit, offset);
                    return statement;
                },
                (resultSet, rowNum) -> mapContentItem(resultSet, true)
        );
    }

    private String buildCandidateSelectSql(
            String targetType,
            String keyword,
            CandidatePromptFilter promptFilter,
            String discussionChannelSlug,
            boolean includePaging
    ) {
        StringBuilder sql = new StringBuilder(candidateSql(targetType));
        appendCandidateFilters(sql, targetType, keyword, promptFilter, discussionChannelSlug);
        sql.append(orderByClause(targetType));
        if (includePaging) {
            sql.append(" limit ? offset ?");
        }
        return sql.toString();
    }

    private void appendCandidateFilters(
            StringBuilder sql,
            String targetType,
            String keyword,
            CandidatePromptFilter promptFilter,
            String discussionChannelSlug
    ) {
        CandidatePromptFilter effectivePromptFilter = promptFilter == null ? CandidatePromptFilter.ALL : promptFilter;

        if ("prompt".equals(targetType) && effectivePromptFilter != CandidatePromptFilter.ALL) {
            sql.append(" and prompt.modality = ?");
        }

        if ("post".equals(targetType) && discussionChannelSlug != null) {
            sql.append(" and channel.slug = ?");
        }

        if (keyword != null && !keyword.isBlank()) {
            switch (targetType) {
                case "prompt" -> sql.append("""
                         and lower(concat_ws(' ',
                             coalesce(prompt.title, ''),
                             coalesce(author.display_name, ''),
                             coalesce(prompt.summary, '')
                         )) like ?
                        """);
                case "workflow" -> sql.append("""
                         and lower(concat_ws(' ',
                             coalesce(workflow.title, ''),
                             coalesce(author.display_name, ''),
                             coalesce(workflow.summary, ''),
                             coalesce(workflow.scenario_text, '')
                         )) like ?
                        """);
                case "post" -> sql.append("""
                         and lower(concat_ws(' ',
                             coalesce(thread.title, ''),
                             coalesce(author.display_name, ''),
                             coalesce(channel.title, ''),
                             coalesce(thread.excerpt_text, '')
                         )) like ?
                        """);
                case "channel" -> sql.append("""
                         and lower(concat_ws(' ',
                             coalesce(channel.title, ''),
                             coalesce(channel.description_text, '')
                         )) like ?
                        """);
                default -> throw ApiBusinessException.internalError("ADMIN_FEED_OPS_TARGET_INVALID", "feed ops candidate target type is invalid");
            }
        }
    }

    private void bindCandidateQueryParameters(
            PreparedStatement statement,
            String targetType,
            String keyword,
            CandidatePromptFilter promptFilter,
            String discussionChannelSlug,
            Integer limit,
            Integer offset
    ) throws SQLException {
        int parameterIndex = 1;
        CandidatePromptFilter effectivePromptFilter = promptFilter == null ? CandidatePromptFilter.ALL : promptFilter;

        if ("prompt".equals(targetType) && effectivePromptFilter != CandidatePromptFilter.ALL) {
            statement.setString(parameterIndex++, effectivePromptFilter == CandidatePromptFilter.VIDEO ? "video" : "image");
        }

        if ("post".equals(targetType) && discussionChannelSlug != null) {
            statement.setString(parameterIndex++, discussionChannelSlug);
        }

        if (keyword != null && !keyword.isBlank()) {
            statement.setString(parameterIndex++, "%" + keyword + "%");
        }

        if (limit != null && offset != null) {
            statement.setInt(parameterIndex++, limit);
            statement.setInt(parameterIndex, offset);
        }
    }

    private String orderByClause(String targetType) {
        return switch (targetType) {
            case "prompt" -> " order by coalesce(prompt.published_at, prompt.created_at) desc nulls last, prompt.title asc";
            case "workflow" -> " order by coalesce(workflow.published_at, workflow.created_at) desc nulls last, workflow.title asc";
            case "post" -> " order by coalesce(thread.last_activity_at, thread.published_at, thread.created_at) desc nulls last, thread.title asc";
            case "channel" -> " order by channel.sort_order asc, channel.created_at asc";
            default -> throw ApiBusinessException.internalError("ADMIN_FEED_OPS_TARGET_INVALID", "feed ops candidate target type is invalid");
        };
    }

    private String normalizeKeyword(String keyword) {
        String normalized = defaultString(keyword).trim().toLowerCase(Locale.ROOT);
        return normalized.isBlank() ? null : normalized;
    }

    private CandidatePromptFilter normalizeCandidatePromptFilter(String promptFilter) {
        String normalized = defaultString(promptFilter).trim().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "", "all" -> CandidatePromptFilter.ALL;
            case "image" -> CandidatePromptFilter.IMAGE;
            case "video" -> CandidatePromptFilter.VIDEO;
            default -> throw ApiBusinessException.badRequest("ADMIN_FEED_OPS_PROMPT_FILTER_INVALID", "feed ops prompt filter is invalid");
        };
    }

    private CandidatePageRequest normalizeCandidatePageRequest(Integer page, Integer pageSize) {
        int normalizedPage = page == null || page < 1 ? DEFAULT_CANDIDATE_PAGE : page;
        int normalizedPageSize = pageSize == null || pageSize < 1 ? DEFAULT_CANDIDATE_PAGE_SIZE : pageSize;
        normalizedPageSize = Math.min(normalizedPageSize, MAX_CANDIDATE_PAGE_SIZE);
        return new CandidatePageRequest(normalizedPage, normalizedPageSize);
    }

    private Map<String, List<AdminFeedOpsPageResponse.ContentItem>> buildFallbackSlotItems(
            FeedOpsPageDefinition pageDefinition,
            List<AdminFeedOpsPageResponse.ContentItem> candidatePool
    ) {
        return switch (pageDefinition.pageKey()) {
            case "home" -> buildHomeFallbackSlotItems(candidatePool);
            case "featured", FEATURED_HOT_PAGE_KEY -> buildFeaturedFallbackSlotItems(candidatePool);
            case "landing" -> buildLandingFallbackSlotItems(candidatePool);
            case "discussions" -> buildDiscussionFallbackSlotItems(candidatePool, pageDefinition.slots());
            default -> Map.of();
        };
    }

    private Map<String, List<AdminFeedOpsPageResponse.ContentItem>> buildHomeFallbackSlotItems(
            List<AdminFeedOpsPageResponse.ContentItem> candidatePool
    ) {
        List<AdminFeedOpsPageResponse.ContentItem> prompts = candidatePool.stream()
                .filter(item -> "prompt".equals(item.targetType()))
                .toList();
        List<AdminFeedOpsPageResponse.ContentItem> workflows = candidatePool.stream()
                .filter(item -> "workflow".equals(item.targetType()))
                .toList();
        List<AdminFeedOpsPageResponse.ContentItem> videoPrompts = prompts.stream()
                .filter(this::hasVideoCapability)
                .toList();
        Set<String> videoPromptKeys = videoPrompts.stream()
                .map(this::contentItemKey)
                .collect(Collectors.toCollection(LinkedHashSet::new));
        List<AdminFeedOpsPageResponse.ContentItem> imagePrompts = prompts.stream()
                .filter(item -> !videoPromptKeys.contains(contentItemKey(item)))
                .toList();
        List<AdminFeedOpsPageResponse.ContentItem> fallbackPool = new ArrayList<>();
        fallbackPool.addAll(videoPrompts);
        fallbackPool.addAll(imagePrompts);
        fallbackPool.addAll(workflows);

        Set<String> heroTaken = new LinkedHashSet<>();
        Set<String> shelfTaken = new LinkedHashSet<>();

        Map<String, List<AdminFeedOpsPageResponse.ContentItem>> slots = new LinkedHashMap<>();
        slots.put("home-hero", takeUniqueContentItems(joinLists(videoPrompts, prompts, workflows), 6, heroTaken));
        slots.put(
                "recommended-primary",
                fillUniqueContentItems(takeUniqueContentItems(videoPrompts, 4, shelfTaken), fallbackPool, 4, shelfTaken)
        );
        slots.put(
                "canvas",
                fillUniqueContentItems(takeUniqueContentItems(videoPrompts, 4, shelfTaken), fallbackPool, 4, shelfTaken)
        );
        slots.put("commercial", takeUniqueContentItems(fallbackPool, 4, shelfTaken));
        slots.put("animation", takeUniqueContentItems(fallbackPool, 4, shelfTaken));
        slots.put("narrative", takeUniqueContentItems(fallbackPool, 4, shelfTaken));
        slots.put("mv", takeUniqueContentItems(fallbackPool, 4, shelfTaken));
        slots.put("creative", takeUniqueContentItems(fallbackPool, 4, shelfTaken));
        return Map.copyOf(slots);
    }

    private Map<String, List<AdminFeedOpsPageResponse.ContentItem>> buildFeaturedFallbackSlotItems(
            List<AdminFeedOpsPageResponse.ContentItem> candidatePool
    ) {
        List<AdminFeedOpsPageResponse.ContentItem> prompts = candidatePool.stream()
                .filter(item -> "prompt".equals(item.targetType()))
                .toList();
        List<AdminFeedOpsPageResponse.ContentItem> workflows = candidatePool.stream()
                .filter(item -> "workflow".equals(item.targetType()))
                .toList();

        Map<String, List<AdminFeedOpsPageResponse.ContentItem>> slots = new LinkedHashMap<>();
        slots.put("featured-all", List.copyOf(candidatePool.stream().limit(12).toList()));
        slots.put("featured-workflow", List.copyOf(workflows.stream().limit(12).toList()));
        slots.put(
                "featured-video-prompt",
                List.copyOf(prompts.stream().filter(item -> "video".equalsIgnoreCase(item.promptModality())).limit(12).toList())
        );
        slots.put(
                "featured-image-prompt",
                List.copyOf(prompts.stream().filter(item -> !"video".equalsIgnoreCase(item.promptModality())).limit(12).toList())
        );
        slots.put("featured-activity", List.of());
        return Map.copyOf(slots);
    }

    private Map<String, List<AdminFeedOpsPageResponse.ContentItem>> buildLandingFallbackSlotItems(
            List<AdminFeedOpsPageResponse.ContentItem> candidatePool
    ) {
        return Map.of(
                "landing-archive-grid",
                List.copyOf(candidatePool.stream().limit(12).toList())
        );
    }

    private Map<String, List<AdminFeedOpsPageResponse.ContentItem>> buildDiscussionFallbackSlotItems(
            List<AdminFeedOpsPageResponse.ContentItem> candidatePool,
            List<SlotDefinition> slots
    ) {
        List<AdminFeedOpsPageResponse.ContentItem> channels = candidatePool.stream()
                .filter(item -> "channel".equals(item.targetType()))
                .toList();
        List<AdminFeedOpsPageResponse.ContentItem> posts = candidatePool.stream()
                .filter(item -> "post".equals(item.targetType()))
                .toList();

        Map<String, List<AdminFeedOpsPageResponse.ContentItem>> fallback = new LinkedHashMap<>();
        for (SlotDefinition slot : slots) {
            if ("discussion-channel-order".equals(slot.key())) {
                fallback.put(slot.key(), List.copyOf(channels.stream().limit(slot.maxItems()).toList()));
                continue;
            }

            String channelSlug = discussionSlotChannelSlug(slot.key());
            List<AdminFeedOpsPageResponse.ContentItem> scopedPosts = posts.stream()
                    .filter(item -> channelSlug == null || channelSlug.equals(item.channelSlug()))
                    .limit(slot.maxItems())
                    .toList();
            fallback.put(slot.key(), List.copyOf(scopedPosts));
        }
        return Map.copyOf(fallback);
    }

    @SafeVarargs
    private List<AdminFeedOpsPageResponse.ContentItem> joinLists(List<AdminFeedOpsPageResponse.ContentItem>... lists) {
        List<AdminFeedOpsPageResponse.ContentItem> joined = new ArrayList<>();
        for (List<AdminFeedOpsPageResponse.ContentItem> list : lists) {
            joined.addAll(list);
        }
        return List.copyOf(joined);
    }

    private List<AdminFeedOpsPageResponse.ContentItem> takeUniqueContentItems(
            List<AdminFeedOpsPageResponse.ContentItem> items,
            int count,
            Set<String> taken
    ) {
        List<AdminFeedOpsPageResponse.ContentItem> picked = new ArrayList<>();
        for (AdminFeedOpsPageResponse.ContentItem item : items) {
            String key = contentItemKey(item);
            if (!taken.add(key)) {
                continue;
            }
            picked.add(item);
            if (picked.size() >= count) {
                break;
            }
        }
        return List.copyOf(picked);
    }

    private List<AdminFeedOpsPageResponse.ContentItem> fillUniqueContentItems(
            List<AdminFeedOpsPageResponse.ContentItem> seedItems,
            List<AdminFeedOpsPageResponse.ContentItem> fallbackPool,
            int count,
            Set<String> taken
    ) {
        List<AdminFeedOpsPageResponse.ContentItem> next = new ArrayList<>(seedItems);
        if (next.size() >= count) {
            return List.copyOf(next.subList(0, count));
        }

        next.addAll(takeUniqueContentItems(fallbackPool, count - next.size(), taken));
        return List.copyOf(next.subList(0, Math.min(next.size(), count)));
    }

    private boolean hasVideoCapability(AdminFeedOpsPageResponse.ContentItem item) {
        if ("video".equalsIgnoreCase(item.promptModality())) {
            return true;
        }

        String mediaUrl = defaultString(item.previewUrl());
        if (mediaUrl.isBlank()) {
            mediaUrl = defaultString(item.sourceUrl());
        }

        return mediaUrl.matches("(?i).+\\.(mp4|mov|webm|m3u8)(\\?.*)?$")
                || !defaultString(item.previewUrl()).isBlank()
                || !defaultString(item.posterUrl()).isBlank()
                || !defaultString(item.coverUrl()).isBlank();
    }

    private String contentItemKey(AdminFeedOpsPageResponse.ContentItem item) {
        return contentItemKey(item.targetType(), item.targetId());
    }

    private String contentItemKey(String targetType, String targetId) {
        return defaultString(targetType) + ":" + defaultString(targetId);
    }

    private FeedOpsPageDefinition buildDiscussionsPageDefinition() {
        List<SlotDefinition> slots = new ArrayList<>();
        slots.add(new SlotDefinition(
                "discussion-channel-order",
                "话题栏目顺序",
                "对应讨论区左侧话题栏目导航，显式控制频道展示顺序。",
                8,
                List.of("channel")
        ));
        slots.add(new SlotDefinition(
                "discussion-all-thread-stream",
                "全部帖子顺序",
                "对应“全部”视图前 8 条帖子顺序；未配置满时继续按系统排序补齐。",
                DISCUSSION_CHANNEL_THREAD_LIMIT,
                List.of("post")
        ));

        for (DiscussionChannelRef channel : loadActiveDiscussionChannels()) {
            slots.add(new SlotDefinition(
                    discussionChannelSlotKey(channel.slug()),
                    "%s帖子顺序".formatted(channel.title()),
                    "对应“%s”栏目进入后的前 8 条帖子顺序；后台配置优先于系统排序。".formatted(channel.title()),
                    DISCUSSION_CHANNEL_THREAD_LIMIT,
                    List.of("post")
            ));
        }

        return new FeedOpsPageDefinition(
                "discussions",
                "讨论运营",
                List.copyOf(slots),
                List.of("channel", "post")
        );
    }

    private List<DiscussionChannelRef> loadActiveDiscussionChannels() {
        return jdbcTemplate.query("""
                select slug, title
                from discussion_channels
                where status_code = 'active'
                order by sort_order asc, created_at asc
                """, (resultSet, rowNum) -> new DiscussionChannelRef(
                resultSet.getString("slug"),
                resultSet.getString("title")
        ));
    }

    public Map<String, List<String>> loadPublishedDiscussionOrdering() {
        FeedOpsPageDefinition pageDefinition = buildDiscussionsPageDefinition();
        Map<String, SlotConfigRow> configRows = loadSlotConfigRows(pageDefinition.pageKey());
        Map<String, List<String>> ordering = new LinkedHashMap<>();
        for (SlotDefinition definition : pageDefinition.slots()) {
            SlotConfigRow row = configRows.get(definition.key());
            if (row == null || !"published".equals(row.statusCode())) {
                continue;
            }
            List<String> orderedIds = readStoredItemRefs(row.itemsJsonText()).stream()
                    .map(StoredItemRef::targetId)
                    .filter(value -> value != null && !value.isBlank())
                    .toList();
            ordering.put(definition.key(), orderedIds);
        }
        return Map.copyOf(ordering);
    }

    public Map<String, List<AdminFeedOpsPageResponse.ContentItem>> loadPublishedHomeSlotItems() {
        Map<String, SlotConfigRow> configRows = loadSlotConfigRows(HOME_PAGE.pageKey());
        Map<String, List<AdminFeedOpsPageResponse.ContentItem>> slotItems = new LinkedHashMap<>();

        for (SlotDefinition definition : HOME_PAGE.slots()) {
            SlotConfigRow row = configRows.get(definition.key());
            if (row == null || !"published".equals(row.statusCode())) {
                continue;
            }

            List<AdminFeedOpsPageResponse.ContentItem> items = readStoredItemRefs(row.itemsJsonText()).stream()
                    .filter(ref -> definition.allowedTargetTypes().contains(ref.targetType()))
                    .map(this::resolveStoredItem)
                    .filter(AdminFeedOpsPageResponse.ContentItem::available)
                    .limit(definition.maxItems())
                    .toList();

            if (!items.isEmpty()) {
                slotItems.put(definition.key(), items);
            }
        }

        return Map.copyOf(slotItems);
    }

    public Map<String, List<AdminFeedOpsPageResponse.ContentItem>> loadPublishedFeaturedSlotItems() {
        return loadPublishedFeaturedSlotItems(null);
    }

    public Map<String, List<AdminFeedOpsPageResponse.ContentItem>> loadPublishedFeaturedSlotItems(String sort) {
        FeedOpsPageDefinition pageDefinition = resolveFeaturedPageDefinition(sort);
        Map<String, SlotConfigRow> configRows = loadSlotConfigRows(pageDefinition.pageKey());
        Map<String, List<AdminFeedOpsPageResponse.ContentItem>> slotItems = new LinkedHashMap<>();

        for (SlotDefinition definition : pageDefinition.slots()) {
            SlotConfigRow row = configRows.get(definition.key());
            if (row == null || !"published".equals(row.statusCode())) {
                continue;
            }

            List<AdminFeedOpsPageResponse.ContentItem> items = readStoredItemRefs(row.itemsJsonText()).stream()
                    .filter(ref -> definition.allowedTargetTypes().contains(ref.targetType()))
                    .map(this::resolveStoredItem)
                    .filter(AdminFeedOpsPageResponse.ContentItem::available)
                    .limit(definition.maxItems())
                    .toList();

            if (!items.isEmpty()) {
                slotItems.put(definition.key(), items);
            }
        }

        return Map.copyOf(slotItems);
    }

    private FeedOpsPageDefinition resolveFeaturedPageDefinition(String sort) {
        String normalizedSort = normalizeFeaturedSort(sort);
        if ("hot".equals(normalizedSort)) {
            return new FeedOpsPageDefinition(
                    FEATURED_HOT_PAGE_KEY,
                    FEATURED_PAGE.pageLabel(),
                    FEATURED_PAGE.slots(),
                    FEATURED_PAGE.candidateTargetTypes()
            );
        }
        return FEATURED_PAGE;
    }

    private String normalizeFeaturedSort(String sort) {
        return "hot".equalsIgnoreCase(safeTrim(sort)) ? "hot" : "latest";
    }

    public Map<String, List<AdminFeedOpsPageResponse.ContentItem>> loadPublishedLandingSlotItems() {
        Map<String, SlotConfigRow> configRows = loadSlotConfigRows(LANDING_PAGE.pageKey());
        Map<String, List<AdminFeedOpsPageResponse.ContentItem>> slotItems = new LinkedHashMap<>();

        for (SlotDefinition definition : LANDING_PAGE.slots()) {
            SlotConfigRow row = configRows.get(definition.key());
            if (row == null || !"published".equals(row.statusCode())) {
                continue;
            }

            List<AdminFeedOpsPageResponse.ContentItem> items = readStoredItemRefs(row.itemsJsonText()).stream()
                    .map(this::resolveStoredItem)
                    .filter(AdminFeedOpsPageResponse.ContentItem::available)
                    .limit(definition.maxItems())
                    .toList();

            if (!items.isEmpty()) {
                slotItems.put(definition.key(), items);
            }
        }

        return Map.copyOf(slotItems);
    }

    public static String discussionChannelSlotKey(String channelSlug) {
        return "discussion-channel-" + channelSlug + "-thread-stream";
    }

    private String discussionSlotChannelSlug(String slotKey) {
        String prefix = "discussion-channel-";
        String suffix = "-thread-stream";
        if (slotKey == null || !slotKey.startsWith(prefix) || !slotKey.endsWith(suffix)) {
            return null;
        }

        return slotKey.substring(prefix.length(), slotKey.length() - suffix.length());
    }

    private int compareItems(AdminFeedOpsPageResponse.ContentItem left, AdminFeedOpsPageResponse.ContentItem right) {
        OffsetDateTime leftPublishedAt = left.publishedAt();
        OffsetDateTime rightPublishedAt = right.publishedAt();
        if (leftPublishedAt != null && rightPublishedAt != null) {
            int compare = leftPublishedAt.compareTo(rightPublishedAt);
            if (compare != 0) {
                return compare;
            }
        } else if (leftPublishedAt != null) {
            return 1;
        } else if (rightPublishedAt != null) {
            return -1;
        }
        return defaultString(left.title()).compareToIgnoreCase(defaultString(right.title()));
    }

    private String candidateSql(String targetType) {
        return switch (targetType) {
            case "prompt" -> PROMPT_CANDIDATE_SQL;
            case "workflow" -> WORKFLOW_CANDIDATE_SQL;
            case "post" -> POST_CANDIDATE_SQL;
            case "channel" -> CHANNEL_CANDIDATE_SQL;
            default -> throw ApiBusinessException.internalError("ADMIN_FEED_OPS_TARGET_INVALID", "feed ops candidate target type is invalid");
        };
    }

    private Map<String, SlotConfigRow> loadSlotConfigRows(String pageKey) {
        Map<String, SlotConfigRow> rows = new LinkedHashMap<>();
        jdbcTemplate.query(
                LOAD_SLOT_CONFIGS_SQL,
                resultSet -> {
                    SlotConfigRow row = new SlotConfigRow(
                            resultSet.getString("slot_key"),
                            resultSet.getString("status_code"),
                            resultSet.getString("items_json_text"),
                            resultSet.getObject("updated_at", OffsetDateTime.class),
                            resultSet.getObject("published_at", OffsetDateTime.class),
                            nullableText(resultSet, "updated_by_display_name")
                    );
                    rows.put(row.slotKey(), row);
                },
                pageKey
        );
        return rows;
    }

    private AdminFeedOpsPageResponse.ContentItem resolveStoredItem(StoredItemRef ref) {
        AdminFeedOpsPageResponse.ContentItem snapshot = loadPublishedSnapshot(ref.targetType(), ref.targetId());
        if (snapshot != null) {
            return snapshot;
        }

        return new AdminFeedOpsPageResponse.ContentItem(
                ref.targetType(),
                ref.targetId(),
                defaultContentKind(ref.targetType()),
                defaultTypeLabel(ref.targetType()),
                null,
                "目标内容已失效或已下线",
                "请移除该挂载项",
                null,
                null,
                null,
                "该运营挂载引用的目标内容已经不可用。",
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                false
        );
    }

    private Map<String, List<StoredItemRef>> normalizeSlotPayloads(
            FeedOpsPageDefinition pageDefinition,
            List<AdminFeedOpsPageUpdateRequest.SlotConfig> slots
    ) {
        if (slots == null) {
            throw ApiBusinessException.badRequest("ADMIN_FEED_OPS_PAYLOAD_INVALID", "feed ops payload is invalid");
        }

        Map<String, List<StoredItemRef>> payloads = new LinkedHashMap<>();
        for (AdminFeedOpsPageUpdateRequest.SlotConfig slot : slots) {
            SlotDefinition definition = requireSlotDefinition(pageDefinition, slot.slotKey());
            if (payloads.containsKey(definition.key())) {
                throw ApiBusinessException.badRequest(
                        "ADMIN_FEED_OPS_SLOT_DUPLICATED",
                        "feed ops slot is duplicated"
                );
            }

            List<StoredItemRef> items = new ArrayList<>();
            if (slot.items() != null) {
                for (AdminFeedOpsPageUpdateRequest.ItemRef item : slot.items()) {
                    items.add(normalizeStoredItemRef(item));
                }
            }
            payloads.put(definition.key(), List.copyOf(items));
        }

        return Map.copyOf(payloads);
    }

    private StoredItemRef normalizeStoredItemRef(AdminFeedOpsPageUpdateRequest.ItemRef item) {
        if (item == null) {
            throw ApiBusinessException.badRequest("ADMIN_FEED_OPS_ITEM_INVALID", "feed ops item is invalid");
        }

        String targetType = normalizeTargetType(item.targetType());
        String targetId = normalizeTargetId(item.targetId());
        return new StoredItemRef(targetType, targetId);
    }

    private void validateSlotItems(SlotDefinition definition, List<StoredItemRef> items) {
        if (items.size() > definition.maxItems()) {
            throw ApiBusinessException.badRequest(
                    "ADMIN_FEED_OPS_SLOT_OVERFLOW",
                    "feed ops slot item count exceeds limit"
            );
        }

        Set<String> uniqueKeys = new LinkedHashSet<>();
        for (StoredItemRef item : items) {
            if (!definition.allowedTargetTypes().contains(item.targetType())) {
                throw ApiBusinessException.badRequest(
                        "ADMIN_FEED_OPS_TARGET_UNSUPPORTED",
                        "feed ops target type is invalid for slot"
                );
            }

            String dedupeKey = item.targetType() + ":" + item.targetId();
            if (!uniqueKeys.add(dedupeKey)) {
                throw ApiBusinessException.badRequest(
                        "ADMIN_FEED_OPS_TARGET_DUPLICATED",
                        "feed ops target is duplicated"
                );
            }

            if (loadPublishedSnapshot(item.targetType(), item.targetId()) == null) {
                throw ApiBusinessException.notFound(
                        "ADMIN_FEED_OPS_TARGET_NOT_FOUND",
                        "feed ops target not found"
                );
            }
        }
    }

    private void upsertSlotConfig(
            String pageKey,
            String slotKey,
            String statusCode,
            List<StoredItemRef> items,
            UUID operatorId,
            OffsetDateTime publishedAt
    ) {
        String itemsJson = writeStoredItemRefs(items);
        jdbcTemplate.update(connection -> {
            PreparedStatement statement = connection.prepareStatement(UPSERT_SLOT_CONFIG_SQL);
            statement.setString(1, pageKey);
            statement.setString(2, slotKey);
            statement.setString(3, statusCode);
            statement.setString(4, itemsJson);
            statement.setObject(5, operatorId);
            statement.setObject(6, publishedAt);
            return statement;
        });
    }

    private String writeStoredItemRefs(List<StoredItemRef> items) {
        try {
            return objectMapper.writeValueAsString(items);
        } catch (JsonProcessingException ex) {
            throw ApiBusinessException.internalError(
                    "ADMIN_FEED_OPS_SERIALIZE_FAILED",
                    "feed ops config serialization failed"
            );
        }
    }

    private List<StoredItemRef> readStoredItemRefs(String itemsJsonText) {
        if (itemsJsonText == null || itemsJsonText.isBlank()) {
            return List.of();
        }

        try {
            List<StoredItemRef> items = objectMapper.readValue(itemsJsonText, STORED_ITEM_TYPE);
            return items == null ? List.of() : List.copyOf(items);
        } catch (IOException ex) {
            throw ApiBusinessException.internalError(
                    "ADMIN_FEED_OPS_CONFIG_INVALID",
                    "feed ops config is invalid"
            );
        }
    }

    private String resolvePageStatus(
            FeedOpsPageDefinition pageDefinition,
            Map<String, SlotConfigRow> configRows
    ) {
        if (configRows.size() == pageDefinition.slots().size()
                && configRows.values().stream().allMatch(row -> "published".equals(row.statusCode()))) {
            return "published";
        }
        return "draft";
    }

    private String normalizeStatusCode(String statusCode) {
        if (statusCode == null) {
            throw ApiBusinessException.badRequest("ADMIN_FEED_OPS_STATUS_INVALID", "feed ops status is invalid");
        }

        String normalized = statusCode.trim().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "draft", "published" -> normalized;
            default -> throw ApiBusinessException.badRequest(
                    "ADMIN_FEED_OPS_STATUS_INVALID",
                    "feed ops status is invalid"
            );
        };
    }

    private SlotDefinition requireSlotDefinition(
            FeedOpsPageDefinition pageDefinition,
            String slotKey
    ) {
        if (slotKey == null) {
            throw ApiBusinessException.badRequest("ADMIN_FEED_OPS_SLOT_INVALID", "feed ops slot is invalid");
        }

        SlotDefinition definition = pageDefinition.slotLookup().get(slotKey.trim());
        if (definition == null) {
            throw ApiBusinessException.badRequest("ADMIN_FEED_OPS_SLOT_INVALID", "feed ops slot is invalid");
        }
        return definition;
    }

    private String normalizeTargetType(String targetType) {
        if (targetType == null) {
            throw ApiBusinessException.badRequest("ADMIN_FEED_OPS_TARGET_INVALID", "feed ops target type is invalid");
        }

        String normalized = targetType.trim().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "prompt", "workflow", "post", "channel" -> normalized;
            default -> throw ApiBusinessException.badRequest(
                    "ADMIN_FEED_OPS_TARGET_INVALID",
                    "feed ops target type is invalid"
            );
        };
    }

    private String normalizeTargetId(String targetId) {
        if (targetId == null) {
            throw ApiBusinessException.badRequest("ADMIN_FEED_OPS_TARGET_ID_INVALID", "feed ops target id is invalid");
        }

        String normalized = targetId.trim();
        try {
            return UUID.fromString(normalized).toString();
        } catch (IllegalArgumentException ex) {
            throw ApiBusinessException.badRequest(
                    "ADMIN_FEED_OPS_TARGET_ID_INVALID",
                    "feed ops target id is invalid"
            );
        }
    }

    private AdminFeedOpsPageResponse.ContentItem loadPublishedSnapshot(String targetType, String targetId) {
        UUID parsedTargetId = UUID.fromString(targetId);
        String sql = switch (targetType) {
            case "prompt" -> PROMPT_SNAPSHOT_SQL;
            case "workflow" -> WORKFLOW_SNAPSHOT_SQL;
            case "post" -> POST_SNAPSHOT_SQL;
            case "channel" -> CHANNEL_SNAPSHOT_SQL;
            default -> null;
        };

        if (sql == null) {
            return null;
        }

        return jdbcTemplate.query(
                sql,
                resultSet -> resultSet.next() ? mapContentItem(resultSet, true) : null,
                parsedTargetId
        );
    }

    private AdminFeedOpsPageResponse.ContentItem mapContentItem(ResultSet resultSet, boolean available) throws SQLException {
        UUID targetId = resultSet.getObject("target_id", UUID.class);
        UUID authorId = resultSet.getObject("author_id", UUID.class);
        String targetType = resultSet.getString("target_type");
        String coverUrl = null;
        String posterUrl = null;
        String previewUrl = null;
        String sourceUrl = null;

        if ("prompt".equals(targetType)) {
            coverUrl = resolvePromptCoverUrl(resultSet);
            posterUrl = resolvePromptPosterUrl(resultSet);
            previewUrl = resolvePromptPreviewUrl(resultSet);
            sourceUrl = resolvePromptSourceUrl(resultSet);
        } else if ("workflow".equals(targetType)) {
            coverUrl = resolveWorkflowCoverUrl(resultSet);
        }

        return new AdminFeedOpsPageResponse.ContentItem(
                targetType,
                targetId == null ? null : targetId.toString(),
                resultSet.getString("content_kind"),
                resultSet.getString("item_type_label"),
                nullableText(resultSet, "target_slug"),
                resultSet.getString("title"),
                resultSet.getString("author_display_name"),
                nullableText(resultSet, "prompt_modality"),
                nullableText(resultSet, "channel_slug"),
                nullableText(resultSet, "channel_title"),
                nullableText(resultSet, "summary_text"),
                resultSet.getObject("published_at", OffsetDateTime.class),
                coverUrl,
                posterUrl,
                previewUrl,
                sourceUrl,
                authorId == null ? null : authorId.toString(),
                resolveMediaUrl(resultSet, "author_avatar_url"),
                available
        );
    }

    private String resolveWorkflowCoverUrl(ResultSet resultSet) throws SQLException {
        return resolveMediaUrl(resultSet, "workflow_cover_url");
    }

    private String resolvePromptCoverUrl(ResultSet resultSet) throws SQLException {
        String coverUrl = resolveImageMediaUrl(resultSet, "prompt_cover_url", "prompt_cover_asset_kind");
        return coverUrl != null
                ? coverUrl
                : resolveImageMediaUrl(resultSet, "prompt_primary_example_url", "prompt_primary_example_asset_kind");
    }

    private String resolvePromptPosterUrl(ResultSet resultSet) throws SQLException {
        return resolvePromptCoverUrl(resultSet);
    }

    private String resolvePromptPreviewUrl(ResultSet resultSet) throws SQLException {
        return resolveVideoMediaUrl(resultSet, "prompt_preview_example_url", "prompt_preview_example_asset_kind");
    }

    private String resolvePromptSourceUrl(ResultSet resultSet) throws SQLException {
        return resolveVideoMediaUrl(resultSet, "prompt_primary_example_url", "prompt_primary_example_asset_kind");
    }

    private String resolveMediaUrl(ResultSet resultSet, String columnName) throws SQLException {
        return jdbcMediaUrlResolver.resolve(resultSet, columnName);
    }

    private String resolveImageMediaUrl(ResultSet resultSet, String columnName, String assetKindColumn) throws SQLException {
        return "image".equalsIgnoreCase(resultSet.getString(assetKindColumn))
                ? resolveMediaUrl(resultSet, columnName)
                : null;
    }

    private String resolveVideoMediaUrl(ResultSet resultSet, String columnName, String assetKindColumn) throws SQLException {
        return "video".equalsIgnoreCase(resultSet.getString(assetKindColumn))
                ? resolveMediaUrl(resultSet, columnName)
                : null;
    }

    private String defaultContentKind(String targetType) {
        return switch (targetType) {
            case "workflow" -> "workflow_work";
            case "post" -> "post";
            case "channel" -> "discussion_channel";
            default -> "prompt";
        };
    }

    private String defaultTypeLabel(String targetType) {
        return switch (targetType) {
            case "workflow" -> "工作流";
            case "post" -> "帖子";
            case "channel" -> "讨论频道";
            default -> "提示词";
        };
    }

    private String defaultItemType(String targetType) {
        return switch (targetType) {
            case "workflow" -> "workflow";
            case "post" -> "post";
            case "channel" -> "post";
            default -> "prompt";
        };
    }

    private String nullableText(ResultSet resultSet, String columnName) throws SQLException {
        String value = resultSet.getString(columnName);
        return value == null || value.isBlank() ? null : value;
    }

    private String defaultString(String value) {
        return value == null ? "" : value;
    }

    private String safeTrim(String value) {
        return value == null ? "" : value.trim();
    }

    private record FeedOpsPageDefinition(
            String pageKey,
            String pageLabel,
            List<SlotDefinition> slots,
            List<String> candidateTargetTypes
    ) {
        private Map<String, SlotDefinition> slotLookup() {
            Map<String, SlotDefinition> lookup = new LinkedHashMap<>();
            for (SlotDefinition definition : slots) {
                lookup.put(definition.key(), definition);
            }
            return Map.copyOf(lookup);
        }
    }

    private record SlotDefinition(
            String key,
            String title,
            String description,
            int maxItems,
            List<String> allowedTargetTypes
    ) {
    }

    private record SlotConfigRow(
            String slotKey,
            String statusCode,
            String itemsJsonText,
            OffsetDateTime updatedAt,
            OffsetDateTime publishedAt,
            String updatedByDisplayName
    ) {
    }

    record StoredItemRef(
            String targetType,
            String targetId
    ) {
    }

    private record DiscussionChannelRef(
            String slug,
            String title
    ) {
    }

    private enum CandidatePromptFilter {
        ALL,
        IMAGE,
        VIDEO
    }

    private record CandidatePageRequest(
            int page,
            int pageSize
    ) {
    }
}
