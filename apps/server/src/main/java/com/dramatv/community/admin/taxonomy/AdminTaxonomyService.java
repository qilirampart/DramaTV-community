package com.dramatv.community.admin.taxonomy;

import com.dramatv.community.admin.auditlogs.AdminAuditLogService;
import com.dramatv.community.admin.auth.AdminAccessService;
import com.dramatv.community.admin.taxonomy.dto.request.AdminTaxonomyBulkApplyRequest;
import com.dramatv.community.admin.taxonomy.dto.request.AdminTaxonomyCreateRequest;
import com.dramatv.community.admin.taxonomy.dto.request.AdminTaxonomyPromptRebindRequest;
import com.dramatv.community.admin.taxonomy.dto.request.AdminTaxonomyUpdateRequest;
import com.dramatv.community.admin.taxonomy.dto.response.AdminTaxonomyBulkApplyResponse;
import com.dramatv.community.admin.taxonomy.dto.response.AdminTaxonomyCategoryDeleteResponse;
import com.dramatv.community.admin.taxonomy.dto.response.AdminTaxonomyPromptListResponse;
import com.dramatv.community.admin.taxonomy.dto.response.AdminTaxonomyPromptRebindResponse;
import com.dramatv.community.admin.taxonomy.dto.response.AdminTaxonomyResponse;
import com.dramatv.community.identity.application.CurrentUser;
import com.dramatv.community.shared.error.ApiBusinessException;
import com.dramatv.community.shared.request.MdcBusinessContextScope;
import java.sql.Array;
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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminTaxonomyService {

    private static final Logger log = LoggerFactory.getLogger(AdminTaxonomyService.class);
    private static final String[] MANAGE_ROLES = {"admin", "operator"};
    private static final int DEFAULT_SORT_ORDER = 1000;
    private static final int DEFAULT_PROMPT_LIST_LIMIT = 80;
    private static final int DEFAULT_PROMPT_PAGE = 1;
    private static final List<String> EXPOSURE_FLAG_ORDER = List.of("homepage", "featured", "publish");
    private static final Set<String> EXPOSURE_FLAGS = Set.copyOf(EXPOSURE_FLAG_ORDER);
    private static final Set<String> SUPPORTED_PROMPT_MODALITIES = Set.of("image", "video");
    private static final AdminTaxonomyResponse.Governance DEFAULT_GOVERNANCE = new AdminTaxonomyResponse.Governance(
            false,
            "enabled",
            DEFAULT_SORT_ORDER,
            List.of(),
            null,
            null,
            null
    );
    private static final List<CategoryDefinition> IMAGE_MODEL_STANDARD_CATEGORIES = List.of(
            new CategoryDefinition("gpt-image-2", "gpt-image-2"),
            new CategoryDefinition("nanobanana", "nanobanana"),
            new CategoryDefinition("midjourney", "midjourney"),
            new CategoryDefinition("other-image-model", "其他模型")
    );
    private static final List<CategoryDefinition> VIDEO_MODEL_STANDARD_CATEGORIES = List.of(
            new CategoryDefinition("seedance", "seedance"),
            new CategoryDefinition("kling", "kling"),
            new CategoryDefinition("happyhorse", "happyhorse"),
            new CategoryDefinition("wan", "wan"),
            new CategoryDefinition("other-video-model", "其他模型")
    );
    private static final List<CategoryDefinition> IMAGE_CONTENT_STANDARD_CATEGORIES = List.of(
            new CategoryDefinition("real-person", "真人"),
            new CategoryDefinition("animation", "动画"),
            new CategoryDefinition("scene", "场景"),
            new CategoryDefinition("prop", "道具"),
            new CategoryDefinition("other", "其他")
    );
    private static final List<CategoryDefinition> VIDEO_CONTENT_STANDARD_CATEGORIES = List.of(
            new CategoryDefinition("real-person", "真人"),
            new CategoryDefinition("animation", "动画"),
            new CategoryDefinition("other", "其他")
    );
    private static final List<CategoryDefinition> VIDEO_MODEL_USAGE_STANDARD_CATEGORIES = List.of(
            new CategoryDefinition("single-model", "单模型"),
            new CategoryDefinition("multi-model", "模型组合")
    );

    private static final List<SectionDefinition> SECTION_DEFINITIONS = List.of(
            new SectionDefinition("image-model", "图片模型", "读取 prompt_entries.model_category（仅 image 模态）", "image", IMAGE_MODEL_STANDARD_CATEGORIES),
            new SectionDefinition("video-model", "视频模型", "读取 prompt_entries.model_category（仅 video 模态）", "video", VIDEO_MODEL_STANDARD_CATEGORIES),
            new SectionDefinition("image-content-category", "图片内容分类", "读取 prompt_entries.content_category（仅 image 模态）", "image", IMAGE_CONTENT_STANDARD_CATEGORIES),
            new SectionDefinition("video-content-category", "视频内容分类", "读取 prompt_entries.content_category（仅 video 模态）", "video", VIDEO_CONTENT_STANDARD_CATEGORIES),
            new SectionDefinition("video-model-usage", "视频模型使用方式", "读取 prompt_entries.composition_category（仅 video 模态）", "video", VIDEO_MODEL_USAGE_STANDARD_CATEGORIES)
    );

    private static final Map<String, SectionDefinition> SECTION_LOOKUP = buildSectionLookup();

    private static final String SUMMARY_SQL = """
            with active_prompts as (
                select
                    modality,
                    nullif(btrim(model_category), '') as model_category,
                    nullif(btrim(content_category), '') as content_category,
                    nullif(btrim(composition_category), '') as composition_category
                from prompt_entries
                where deleted_at is null
            )
            select
                count(*) as total_prompts,
                count(*) filter (
                    where model_category is not null
                      and content_category is not null
                      and (
                        modality = 'image'
                        or (modality = 'video' and composition_category is not null)
                      )
                ) as fully_categorized_prompts,
                count(*) filter (
                    where model_category is null
                       or content_category is null
                       or (modality = 'video' and composition_category is null)
                ) as needs_attention_prompts,
                count(distinct model_category) filter (
                    where modality = 'image'
                      and model_category is not null
                ) as image_model_categories,
                count(distinct model_category) filter (
                    where modality = 'video'
                      and model_category is not null
                ) as video_model_categories,
                count(distinct content_category) filter (
                    where modality = 'image'
                      and content_category is not null
                ) as image_content_categories,
                count(distinct content_category) filter (
                    where modality = 'video'
                      and content_category is not null
                ) as video_content_categories,
                count(distinct composition_category) filter (
                    where modality = 'video'
                      and composition_category is not null
                ) as video_model_usage_categories
            from active_prompts
            """;

    private static final String TAXONOMY_AGGREGATES_CTE = """
            with active_prompts as (
                select
                    author_id,
                    modality,
                    title,
                    coalesce(published_at, created_at) as sort_at,
                    nullif(btrim(model_category), '') as model_category,
                    nullif(btrim(content_category), '') as content_category,
                    nullif(btrim(composition_category), '') as composition_category
                from prompt_entries
                where deleted_at is null
            ),
            taxonomy_items as (
                select
                    'image-model' as section_key,
                    model_category as category_value,
                    modality,
                    author_id,
                    title,
                    sort_at
                from active_prompts
                where modality = 'image'
                  and model_category is not null

                union all

                select
                    'video-model' as section_key,
                    model_category as category_value,
                    modality,
                    author_id,
                    title,
                    sort_at
                from active_prompts
                where modality = 'video'
                  and model_category is not null

                union all

                select
                    'image-content-category' as section_key,
                    content_category as category_value,
                    modality,
                    author_id,
                    title,
                    sort_at
                from active_prompts
                where modality = 'image'
                  and content_category is not null

                union all

                select
                    'video-content-category' as section_key,
                    content_category as category_value,
                    modality,
                    author_id,
                    title,
                    sort_at
                from active_prompts
                where modality = 'video'
                  and content_category is not null

                union all

                select
                    'video-model-usage' as section_key,
                    composition_category as category_value,
                    modality,
                    author_id,
                    title,
                    sort_at
                from active_prompts
                where modality = 'video'
                  and composition_category is not null
            ),
            ranked_items as (
                select
                    section_key,
                    category_value,
                    modality,
                    author_id,
                    title,
                    sort_at,
                    row_number() over (
                        partition by section_key, category_value
                        order by sort_at desc, title asc
                    ) as sample_rank
                from taxonomy_items
            ),
            aggregated_items as (
                select
                    section_key,
                    category_value,
                    count(*) as prompt_count,
                    count(distinct author_id) as author_count,
                    max(sort_at) as latest_published_at,
                    case
                        when count(distinct modality) = 1 then min(modality)
                        else 'mixed'
                    end as modality_scope,
                    array_remove(
                        array_agg(
                            case
                                when sample_rank <= 3 then title
                                else null
                            end
                            order by sample_rank
                        ),
                        null
                    ) as sample_titles
                from ranked_items
                group by section_key, category_value
            ),
            configured_items as (
                select
                    config.section_key,
                    config.category_value,
                    0::bigint as prompt_count,
                    0::bigint as author_count,
                    null::timestamptz as latest_published_at,
                    case
                        when config.section_key in ('image-model', 'image-content-category') then 'image'
                        else 'video'
                    end as modality_scope,
                    '{}'::text[] as sample_titles
                from admin_taxonomy_configs config
                where not exists(
                    select 1
                    from aggregated_items aggregated
                    where aggregated.section_key = config.section_key
                      and aggregated.category_value = config.category_value
                )
            ),
            final_items as (
                select * from aggregated_items
                union all
                select * from configured_items
            )
            """;

    private static final String ITEM_SELECT_SQL = """
            select
                aggregated.section_key,
                aggregated.category_value,
                aggregated.prompt_count,
                aggregated.author_count,
                aggregated.latest_published_at,
                aggregated.modality_scope,
                aggregated.sample_titles,
                coalesce(config.status_code, 'enabled') as governance_status_code,
                coalesce(config.sort_order, 1000) as governance_sort_order,
                coalesce(config.exposure_flags, '{}'::text[]) as governance_exposure_flags,
                config.note_text as governance_note_text,
                updater.display_name as governance_updated_by_display_name,
                config.updated_at as governance_updated_at,
                (config.section_key is not null) as governance_has_custom_config
            from final_items aggregated
            left join admin_taxonomy_configs config
                on config.section_key = aggregated.section_key
               and config.category_value = aggregated.category_value
            left join users updater
                on updater.id = config.updated_by
            """;

    private static final String ITEMS_SQL = TAXONOMY_AGGREGATES_CTE + ITEM_SELECT_SQL + """
            order by
                case aggregated.section_key
                    when 'image-model' then 0
                    when 'video-model' then 1
                    when 'image-content-category' then 2
                    when 'video-content-category' then 3
                    else 4
                end,
                case
                    when coalesce(config.status_code, 'enabled') = 'enabled' then 0
                    else 1
                end,
                coalesce(config.sort_order, 1000) asc,
                aggregated.prompt_count desc,
                aggregated.latest_published_at desc nulls last,
                aggregated.category_value asc
            """;

    private static final String ITEM_SQL = TAXONOMY_AGGREGATES_CTE + ITEM_SELECT_SQL + """
            where aggregated.section_key = ?
              and aggregated.category_value = ?
            limit 1
            """;

    private static final String ITEM_EXISTS_SQL = TAXONOMY_AGGREGATES_CTE + """
            select exists(
                select 1
                from final_items
                where section_key = ?
                  and category_value = ?
            )
            """;

    private static final String UPSERT_CONFIG_SQL = """
            insert into admin_taxonomy_configs (
                section_key,
                category_value,
                status_code,
                sort_order,
                exposure_flags,
                note_text,
                updated_by
            )
            values (?, ?, ?, ?, ?, ?, ?)
            on conflict (section_key, category_value) do update
            set status_code = excluded.status_code,
                sort_order = excluded.sort_order,
                exposure_flags = excluded.exposure_flags,
                note_text = excluded.note_text,
                updated_by = excluded.updated_by,
                updated_at = now()
            """;

    private static final String DELETE_CONFIG_SQL = """
            delete from admin_taxonomy_configs
            where section_key = ?
              and category_value = ?
            """;

    private static final String FILTERED_PROMPT_ROWS_CTE = """
            with prompt_rows as (
                select
                    prompt.id,
                    prompt.title,
                    prompt.modality,
                    prompt.author_id,
                    author.display_name as author_display_name,
                    nullif(btrim(prompt.model_category), '') as model_category,
                    nullif(btrim(prompt.content_category), '') as content_category,
                    nullif(btrim(prompt.composition_category), '') as composition_category,
                    prompt.tag_names,
                    coalesce(prompt.published_at, prompt.updated_at) as published_at,
                    (
                        nullif(btrim(prompt.model_category), '') is null
                        or nullif(btrim(prompt.content_category), '') is null
                        or (
                            prompt.modality = 'video'
                            and nullif(btrim(prompt.composition_category), '') is null
                        )
                    ) as needs_attention
                from prompt_entries prompt
                join users author on author.id = prompt.author_id
                where prompt.deleted_at is null
                  and prompt.publish_status = 'published'
                  and (
                        cast(? as varchar) is null
                        or prompt.title ilike ?
                        or author.display_name ilike ?
                        or coalesce(prompt.model_category, '') ilike ?
                        or coalesce(prompt.content_category, '') ilike ?
                        or coalesce(prompt.composition_category, '') ilike ?
                    )
                  and (cast(? as varchar) is null or prompt.modality = cast(? as varchar))
                  and (
                        cast(? as varchar) is null
                        or (
                            cast(? as varchar) = 'true'
                            and (
                                nullif(btrim(prompt.model_category), '') is null
                                or nullif(btrim(prompt.content_category), '') is null
                                or (
                                    prompt.modality = 'video'
                                    and nullif(btrim(prompt.composition_category), '') is null
                                )
                            )
                        )
                        or (
                            cast(? as varchar) = 'false'
                            and nullif(btrim(prompt.model_category), '') is not null
                            and nullif(btrim(prompt.content_category), '') is not null
                            and (
                                prompt.modality = 'image'
                                or nullif(btrim(prompt.composition_category), '') is not null
                            )
                        )
                    )
                  and (cast(? as varchar) is null or nullif(btrim(prompt.model_category), '') = cast(? as varchar))
                  and (cast(? as varchar) is null or nullif(btrim(prompt.content_category), '') = cast(? as varchar))
                  and (cast(? as varchar) is null or nullif(btrim(prompt.composition_category), '') = cast(? as varchar))
            )
            """;

    private static final String COUNT_PROMPT_ROWS_SQL = FILTERED_PROMPT_ROWS_CTE + """
            select count(*) from prompt_rows
            """;

    private static final String PROMPT_SUMMARY_SQL = FILTERED_PROMPT_ROWS_CTE + """
            select
                count(*) as total_items,
                count(*) filter (where needs_attention) as needs_attention_items,
                count(*) filter (where modality = 'image') as image_items,
                count(*) filter (where modality = 'video') as video_items
            from prompt_rows
            """;

    private static final String PROMPT_LIST_SQL = FILTERED_PROMPT_ROWS_CTE + """
            select
                id,
                title,
                modality,
                author_id,
                author_display_name,
                model_category,
                content_category,
                composition_category,
                tag_names,
                published_at,
                needs_attention
            from prompt_rows
            order by
                case when needs_attention then 0 else 1 end,
                published_at desc,
                id desc
            offset ?
            limit ?
            """;

    private static final String PROMPT_BULK_LOAD_SQL = """
            select
                prompt.id,
                prompt.modality,
                prompt.author_id,
                prompt.title,
                nullif(btrim(prompt.model_category), '') as model_category,
                nullif(btrim(prompt.content_category), '') as content_category,
                nullif(btrim(prompt.composition_category), '') as composition_category,
                prompt.tag_names
            from prompt_entries prompt
            where prompt.deleted_at is null
              and prompt.publish_status = 'published'
              and prompt.id = any (cast(? as uuid[]))
            """;

    private static final String UPDATE_PROMPT_TAXONOMY_SQL = """
            update prompt_entries
            set model_category = ?,
                content_category = ?,
                composition_category = ?,
                tag_names = ?,
                updated_at = now()
            where id = ?
              and deleted_at is null
              and publish_status = 'published'
            """;

    private static final String COUNT_PROMPTS_USING_CATEGORY_SQL = """
            select count(*)
            from prompt_entries
            where deleted_at is null
              and publish_status = 'published'
              and (
                    (? = 'image-model' and modality = 'image' and nullif(btrim(model_category), '') = ?)
                 or (? = 'video-model' and modality = 'video' and nullif(btrim(model_category), '') = ?)
                 or (? = 'image-content-category' and modality = 'image' and nullif(btrim(content_category), '') = ?)
                 or (? = 'video-content-category' and modality = 'video' and nullif(btrim(content_category), '') = ?)
                 or (? = 'video-model-usage' and modality = 'video' and nullif(btrim(composition_category), '') = ?)
              )
            """;

    private final JdbcTemplate jdbcTemplate;
    private final AdminAccessService adminAccessService;
    private final AdminAuditLogService adminAuditLogService;

    public AdminTaxonomyService(
            JdbcTemplate jdbcTemplate,
            AdminAccessService adminAccessService,
            AdminAuditLogService adminAuditLogService
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.adminAccessService = adminAccessService;
        this.adminAuditLogService = adminAuditLogService;
    }

    public AdminTaxonomyResponse getTaxonomy() {
        adminAccessService.requireAnyRole(MANAGE_ROLES);

        AdminTaxonomyResponse.Summary summary = jdbcTemplate.queryForObject(
                SUMMARY_SQL,
                (resultSet, rowNum) -> new AdminTaxonomyResponse.Summary(
                        resultSet.getLong("total_prompts"),
                        resultSet.getLong("fully_categorized_prompts"),
                        resultSet.getLong("needs_attention_prompts"),
                        resultSet.getLong("image_model_categories"),
                        resultSet.getLong("video_model_categories"),
                        resultSet.getLong("image_content_categories"),
                        resultSet.getLong("video_content_categories"),
                        resultSet.getLong("video_model_usage_categories")
                )
        );

        Map<String, SectionAccumulator> sections = new LinkedHashMap<>();
        for (SectionDefinition definition : SECTION_DEFINITIONS) {
            sections.put(definition.key(), new SectionAccumulator(definition));
        }

        jdbcTemplate.query(
                ITEMS_SQL,
                resultSet -> {
                    String sectionKey = resultSet.getString("section_key");
                    SectionAccumulator section = sections.get(sectionKey);
                    if (section == null) {
                        return;
                    }

                    section.addItem(mapItem(resultSet));
                }
        );

        List<AdminTaxonomyResponse.Section> responseSections = sections.values()
                .stream()
                .map(SectionAccumulator::toResponse)
                .toList();

        return new AdminTaxonomyResponse(
                summary == null
                        ? new AdminTaxonomyResponse.Summary(0, 0, 0, 0, 0, 0, 0, 0)
                        : summary,
                responseSections
        );
    }

    @Transactional
    public AdminTaxonomyResponse.Item createCategory(AdminTaxonomyCreateRequest request) {
        CurrentUser operator = adminAccessService.requireAnyRole(MANAGE_ROLES);
        SectionDefinition section = requireSectionDefinition(request.sectionKey());
        String categoryValue = normalizeCategoryValue(request.categoryValue());

        try (MdcBusinessContextScope ignored = MdcBusinessContextScope.open(taxonomyContext(section.key(), categoryValue))) {
            if (taxonomyItemExists(section.key(), categoryValue)) {
                throw ApiBusinessException.badRequest("ADMIN_TAXONOMY_CATEGORY_EXISTS", "taxonomy category already exists");
            }

            upsertConfig(section.key(), categoryValue, "enabled", DEFAULT_SORT_ORDER, List.of(), null, operator.id());
            AdminTaxonomyResponse.Item createdItem = loadTaxonomyItem(section.key(), categoryValue);
            if (createdItem == null) {
                throw ApiBusinessException.internalError("ADMIN_TAXONOMY_ITEM_REFRESH_FAILED", "taxonomy item refresh failed");
            }

            adminAuditLogService.recordSuccessfulOperation(
                    operator,
                    "taxonomy",
                    "分类治理",
                    "create_taxonomy_category",
                    "新增分类",
                    "taxonomy",
                    section.key() + ":" + categoryValue,
                    categoryValue,
                    "sensitive",
                    "分类已创建",
                    "/api/admin/taxonomy/categories",
                    "POST",
                    "sectionKey=%s".formatted(section.key())
            );
            return createdItem;
        }
    }

    public AdminTaxonomyPromptListResponse listPrompts(
            String query,
            String modality,
            String needsAttention,
            String modelCategory,
            String contentCategory,
            String compositionCategory,
            Integer page,
            Integer pageSize
    ) {
        adminAccessService.requireAnyRole(MANAGE_ROLES);

        String normalizedQuery = normalizeQuery(query);
        String likeQuery = normalizedQuery == null ? null : "%" + normalizedQuery + "%";
        String normalizedModality = normalizePromptModality(modality);
        String normalizedNeedsAttention = normalizeBooleanFilter(needsAttention, "ADMIN_TAXONOMY_NEEDS_ATTENTION_INVALID");
        String normalizedModelCategory = normalizeModelCategory(normalizedModality, modelCategory);
        String normalizedContentCategory = normalizeContentCategory(normalizedModality, contentCategory);
        String normalizedCompositionCategory = normalizeCompositionCategory(normalizedModality, compositionCategory);
        int resolvedPageSize = normalizePromptPageSize(pageSize);
        int resolvedPage = normalizePromptPage(page);
        long totalItems = jdbcTemplate.queryForObject(
                COUNT_PROMPT_ROWS_SQL,
                Long.class,
                normalizedQuery,
                likeQuery,
                likeQuery,
                likeQuery,
                likeQuery,
                likeQuery,
                normalizedModality,
                normalizedModality,
                normalizedNeedsAttention,
                normalizedNeedsAttention,
                normalizedNeedsAttention,
                normalizedModelCategory,
                normalizedModelCategory,
                normalizedContentCategory,
                normalizedContentCategory,
                normalizedCompositionCategory,
                normalizedCompositionCategory
        );
        int totalPages = Math.max(1, (int) Math.ceil((double) totalItems / resolvedPageSize));
        int safePage = Math.min(resolvedPage, totalPages);
        int offset = (safePage - 1) * resolvedPageSize;

        AdminTaxonomyPromptListResponse.Summary summary = jdbcTemplate.queryForObject(
                PROMPT_SUMMARY_SQL,
                (resultSet, rowNum) -> new AdminTaxonomyPromptListResponse.Summary(
                        resultSet.getLong("total_items"),
                        resultSet.getLong("needs_attention_items"),
                        resultSet.getLong("image_items"),
                        resultSet.getLong("video_items")
                ),
                normalizedQuery,
                likeQuery,
                likeQuery,
                likeQuery,
                likeQuery,
                likeQuery,
                normalizedModality,
                normalizedModality,
                normalizedNeedsAttention,
                normalizedNeedsAttention,
                normalizedNeedsAttention,
                normalizedModelCategory,
                normalizedModelCategory,
                normalizedContentCategory,
                normalizedContentCategory,
                normalizedCompositionCategory,
                normalizedCompositionCategory
        );

        List<AdminTaxonomyPromptListResponse.Item> items = jdbcTemplate.query(
                PROMPT_LIST_SQL,
                (resultSet, rowNum) -> new AdminTaxonomyPromptListResponse.Item(
                        resultSet.getObject("id", UUID.class).toString(),
                        resultSet.getString("title"),
                        resultSet.getString("modality"),
                        resultSet.getObject("author_id", UUID.class).toString(),
                        resultSet.getString("author_display_name"),
                        readNullableText(resultSet, "model_category"),
                        readNullableText(resultSet, "content_category"),
                        readNullableText(resultSet, "composition_category"),
                        resultSet.getBoolean("needs_attention"),
                        resultSet.getObject("published_at", OffsetDateTime.class),
                        readStringList(resultSet, "tag_names")
                ),
                normalizedQuery,
                likeQuery,
                likeQuery,
                likeQuery,
                likeQuery,
                likeQuery,
                normalizedModality,
                normalizedModality,
                normalizedNeedsAttention,
                normalizedNeedsAttention,
                normalizedNeedsAttention,
                normalizedModelCategory,
                normalizedModelCategory,
                normalizedContentCategory,
                normalizedContentCategory,
                normalizedCompositionCategory,
                normalizedCompositionCategory,
                offset,
                resolvedPageSize
        );

        return new AdminTaxonomyPromptListResponse(
                summary == null ? new AdminTaxonomyPromptListResponse.Summary(0, 0, 0, 0) : summary,
                new AdminTaxonomyPromptListResponse.Pagination(
                        safePage,
                        resolvedPageSize,
                        totalItems,
                        totalPages,
                        safePage > 1,
                        safePage < totalPages
                ),
                items
        );
    }

    @Transactional
    public AdminTaxonomyResponse.Item updateTaxonomy(AdminTaxonomyUpdateRequest request) {
        CurrentUser operator = adminAccessService.requireAnyRole(MANAGE_ROLES);
        SectionDefinition section = requireSectionDefinition(request.sectionKey());
        String categoryValue = normalizeCategoryValue(request.categoryValue());
        String statusCode = normalizeStatusCode(request.statusCode());
        int sortOrder = normalizeSortOrder(request.sortOrder());
        List<String> exposureFlags = normalizeExposureFlags(request.exposureFlags());
        String noteText = normalizeNoteText(request.noteText());

        try (MdcBusinessContextScope ignored = MdcBusinessContextScope.open(taxonomyContext(section.key(), categoryValue))) {
            if (!taxonomyItemExists(section.key(), categoryValue)) {
                log.warn(
                        "admin taxonomy update rejected: operatorId={} sectionKey={} categoryValue={} reason=item_not_found",
                        operator.id(),
                        section.key(),
                        categoryValue
                );
                throw ApiBusinessException.notFound("ADMIN_TAXONOMY_ITEM_NOT_FOUND", "taxonomy item not found");
            }

            boolean persistedCustomConfig = shouldPersistCustomConfig(statusCode, sortOrder, exposureFlags, noteText);
            if (persistedCustomConfig) {
                upsertConfig(section.key(), categoryValue, statusCode, sortOrder, exposureFlags, noteText, operator.id());
            } else {
                jdbcTemplate.update(DELETE_CONFIG_SQL, section.key(), categoryValue);
            }

            AdminTaxonomyResponse.Item updatedItem = loadTaxonomyItem(section.key(), categoryValue);
            if (updatedItem == null) {
                log.warn(
                        "admin taxonomy update rejected: operatorId={} sectionKey={} categoryValue={} reason=refresh_failed",
                        operator.id(),
                        section.key(),
                        categoryValue
                );
                throw ApiBusinessException.internalError(
                        "ADMIN_TAXONOMY_ITEM_REFRESH_FAILED",
                        "taxonomy item refresh failed"
                );
            }

            log.info(
                    "admin taxonomy update success: operatorId={} sectionKey={} categoryValue={} statusCode={} sortOrder={} exposureFlagCount={} persistedCustomConfig={} hasNote={}",
                    operator.id(),
                    section.key(),
                    categoryValue,
                    statusCode,
                    sortOrder,
                    exposureFlags.size(),
                    persistedCustomConfig,
                    noteText != null && !noteText.isBlank()
            );

            adminAuditLogService.recordSuccessfulOperation(
                    operator,
                    "taxonomy",
                    "分类治理",
                    "update_taxonomy",
                    "保存分类治理",
                    "taxonomy",
                    section.key() + ":" + categoryValue,
                    categoryValue,
                    "sensitive",
                    "分类治理配置已保存",
                    "/api/admin/taxonomy",
                    "PUT",
                    "sectionKey=%s,statusCode=%s,sortOrder=%s".formatted(section.key(), statusCode, sortOrder)
            );

            return updatedItem;
        }
    }

    @Transactional
    public AdminTaxonomyBulkApplyResponse bulkApplyTaxonomy(AdminTaxonomyBulkApplyRequest request) {
        CurrentUser operator = adminAccessService.requireAnyRole(MANAGE_ROLES);
        String modality = normalizePromptModality(request.modality());
        if (modality == null) {
            throw ApiBusinessException.badRequest("ADMIN_TAXONOMY_MODALITY_INVALID", "taxonomy modality is invalid");
        }

        List<UUID> promptIds = normalizePromptIds(request.promptIds());
        String modelCategory = requireBulkModelCategory(modality, request.modelCategory());
        String contentCategory = requireBulkContentCategory(modality, request.contentCategory());
        String rawModelUsageCategory = request.modelUsageCategory() != null
                ? request.modelUsageCategory()
                : request.compositionCategory();
        String compositionCategory = requireBulkCompositionCategory(modality, rawModelUsageCategory);

        try (MdcBusinessContextScope ignored = MdcBusinessContextScope.open(Map.of(
                "targetType", "taxonomy_prompt_batch",
                "targetId", modality + ":" + promptIds.size()
        ))) {
            List<PromptBulkTarget> targets = loadBulkTargets(promptIds);
            if (targets.size() != promptIds.size()) {
                throw ApiBusinessException.notFound("ADMIN_TAXONOMY_PROMPT_NOT_FOUND", "taxonomy prompt item not found");
            }

            for (PromptBulkTarget target : targets) {
                if (!modality.equals(target.modality())) {
                    throw ApiBusinessException.badRequest(
                            "ADMIN_TAXONOMY_MODALITY_MISMATCH",
                            "taxonomy prompt modality does not match batch request"
                    );
                }
            }

            for (PromptBulkTarget target : targets) {
                List<String> normalizedTagNames = mergePromptTaxonomyTags(
                        target.tagNames(),
                        target.modelCategory(),
                        target.contentCategory(),
                        target.modelUsageCategory(),
                        modality,
                        modelCategory,
                        contentCategory,
                        compositionCategory
                );
                jdbcTemplate.update(connection -> {
                    PreparedStatement statement = connection.prepareStatement(UPDATE_PROMPT_TAXONOMY_SQL);
                    statement.setString(1, modelCategory);
                    statement.setString(2, contentCategory);
                    statement.setString(3, compositionCategory);
                    statement.setArray(4, connection.createArrayOf("text", normalizedTagNames.toArray(String[]::new)));
                    statement.setObject(5, target.promptId());
                    return statement;
                });
            }

            log.info(
                    "admin taxonomy bulk apply success: operatorId={} modality={} promptCount={} modelCategory={} contentCategory={} compositionCategory={}",
                    operator.id(),
                    modality,
                    targets.size(),
                    modelCategory,
                    contentCategory,
                    compositionCategory
            );

            adminAuditLogService.recordSuccessfulOperation(
                    operator,
                    "taxonomy",
                    "分类治理",
                    "bulk_apply_prompt_taxonomy",
                    "批量修正提示词分类",
                    "prompt_batch",
                    modality + ":" + promptIds.size(),
                    "提示词批量分类修正",
                    "sensitive",
                    "提示词 taxonomy 批量修正已保存",
                    "/api/admin/taxonomy/prompts/bulk-apply",
                    "POST",
                    "modality=%s,promptCount=%s,modelCategory=%s,contentCategory=%s,compositionCategory=%s".formatted(
                            modality,
                            targets.size(),
                            modelCategory,
                            contentCategory,
                            compositionCategory
                    )
            );

            return new AdminTaxonomyBulkApplyResponse(
                    modality,
                    targets.size(),
                    modelCategory,
                    contentCategory,
                    compositionCategory,
                    compositionCategory,
                    promptIds.stream().map(UUID::toString).toList()
            );
        }
    }

    @Transactional
    public AdminTaxonomyPromptRebindResponse rebindPrompts(AdminTaxonomyPromptRebindRequest request) {
        CurrentUser operator = adminAccessService.requireAnyRole(MANAGE_ROLES);
        SectionDefinition section = requireSectionDefinition(request.sectionKey());
        String categoryValue = normalizeCategoryValue(request.categoryValue());
        List<UUID> promptIds = normalizePromptIds(request.promptIds());

        try (MdcBusinessContextScope ignored = MdcBusinessContextScope.open(Map.of(
                "targetType", "taxonomy_prompt_rebind",
                "targetId", section.key() + ":" + promptIds.size()
        ))) {
            if (!taxonomyItemExists(section.key(), categoryValue)) {
                throw ApiBusinessException.notFound("ADMIN_TAXONOMY_ITEM_NOT_FOUND", "taxonomy item not found");
            }

            List<PromptBulkTarget> targets = loadBulkTargets(promptIds);
            if (targets.size() != promptIds.size()) {
                throw ApiBusinessException.notFound("ADMIN_TAXONOMY_PROMPT_NOT_FOUND", "taxonomy prompt item not found");
            }

            for (PromptBulkTarget target : targets) {
                PromptTaxonomyValue taxonomyValue = resolveRebindTaxonomyValue(section.key(), categoryValue, target);
                List<String> normalizedTagNames = mergePromptTaxonomyTags(
                        target.tagNames(),
                        target.modelCategory(),
                        target.contentCategory(),
                        target.modelUsageCategory(),
                        target.modality(),
                        taxonomyValue.modelCategory(),
                        taxonomyValue.contentCategory(),
                        taxonomyValue.modelUsageCategory()
                );
                jdbcTemplate.update(connection -> {
                    PreparedStatement statement = connection.prepareStatement(UPDATE_PROMPT_TAXONOMY_SQL);
                    statement.setString(1, taxonomyValue.modelCategory());
                    statement.setString(2, taxonomyValue.contentCategory());
                    statement.setString(3, taxonomyValue.modelUsageCategory());
                    statement.setArray(4, connection.createArrayOf("text", normalizedTagNames.toArray(String[]::new)));
                    statement.setObject(5, target.promptId());
                    return statement;
                });
            }

            adminAuditLogService.recordSuccessfulOperation(
                    operator,
                    "taxonomy",
                    "分类治理",
                    "rebind_prompt_taxonomy",
                    "重绑提示词分类",
                    "prompt_batch",
                    section.key() + ":" + promptIds.size(),
                    categoryValue,
                    "sensitive",
                    "提示词分类已重绑",
                    "/api/admin/taxonomy/prompts/rebind",
                    "POST",
                    "sectionKey=%s,promptCount=%s".formatted(section.key(), promptIds.size())
            );

            return new AdminTaxonomyPromptRebindResponse(
                    section.key(),
                    categoryValue,
                    promptIds.size(),
                    promptIds.stream().map(UUID::toString).toList()
            );
        }
    }

    @Transactional
    public AdminTaxonomyCategoryDeleteResponse deleteCategory(String sectionKey, String categoryValue) {
        CurrentUser operator = adminAccessService.requireAnyRole(MANAGE_ROLES);
        SectionDefinition section = requireSectionDefinition(sectionKey);
        String normalizedCategoryValue = normalizeCategoryValue(categoryValue);

        try (MdcBusinessContextScope ignored = MdcBusinessContextScope.open(taxonomyContext(section.key(), normalizedCategoryValue))) {
            if (isStandardCategory(section.key(), normalizedCategoryValue)) {
                throw ApiBusinessException.badRequest(
                        "ADMIN_TAXONOMY_CATEGORY_PROTECTED",
                        "builtin taxonomy category cannot be deleted"
                );
            }
            long inUseCount = countPromptsUsingCategory(section.key(), normalizedCategoryValue);
            if (inUseCount > 0) {
                throw ApiBusinessException.badRequest("ADMIN_TAXONOMY_CATEGORY_IN_USE", "taxonomy category is still used by prompts");
            }

            int deletedCount = jdbcTemplate.update(DELETE_CONFIG_SQL, section.key(), normalizedCategoryValue);
            if (deletedCount == 0) {
                throw ApiBusinessException.notFound("ADMIN_TAXONOMY_ITEM_NOT_FOUND", "taxonomy item not found");
            }

            adminAuditLogService.recordSuccessfulOperation(
                    operator,
                    "taxonomy",
                    "分类治理",
                    "delete_taxonomy_category",
                    "删除分类",
                    "taxonomy",
                    section.key() + ":" + normalizedCategoryValue,
                    normalizedCategoryValue,
                    "sensitive",
                    "分类已删除",
                    "/api/admin/taxonomy/categories/" + section.key() + "/" + normalizedCategoryValue,
                    "DELETE",
                    "sectionKey=%s".formatted(section.key())
            );

            return new AdminTaxonomyCategoryDeleteResponse(section.key(), normalizedCategoryValue, true);
        }
    }

    private Map<String, String> taxonomyContext(String sectionKey, String categoryValue) {
        return Map.of(
                "targetType", "taxonomy_section",
                "targetId", sectionKey + ":" + categoryValue
        );
    }

    private AdminTaxonomyResponse.Item mapItem(ResultSet resultSet) throws SQLException {
        String sectionKey = resultSet.getString("section_key");
        String categoryValue = resultSet.getString("category_value");
        return new AdminTaxonomyResponse.Item(
                categoryValue,
                resolveCategoryLabel(sectionKey, categoryValue),
                resultSet.getString("modality_scope"),
                resultSet.getLong("prompt_count"),
                resultSet.getLong("author_count"),
                resultSet.getObject("latest_published_at", OffsetDateTime.class),
                readStringList(resultSet, "sample_titles"),
                new AdminTaxonomyResponse.Governance(
                        resultSet.getBoolean("governance_has_custom_config"),
                        resultSet.getString("governance_status_code"),
                        resultSet.getInt("governance_sort_order"),
                        readStringList(resultSet, "governance_exposure_flags"),
                        readNullableText(resultSet, "governance_note_text"),
                        readNullableText(resultSet, "governance_updated_by_display_name"),
                        resultSet.getObject("governance_updated_at", OffsetDateTime.class)
                )
        );
    }

    private List<String> readStringList(ResultSet resultSet, String columnName) throws SQLException {
        Array array = resultSet.getArray(columnName);
        if (array == null) {
            return List.of();
        }

        Object raw = array.getArray();
        if (!(raw instanceof Object[] values)) {
            return List.of();
        }

        List<String> items = new ArrayList<>();
        for (Object value : values) {
            if (value instanceof String text && !text.isBlank()) {
                items.add(text);
            }
        }
        return List.copyOf(items);
    }

    private String readNullableText(ResultSet resultSet, String columnName) throws SQLException {
        String value = resultSet.getString(columnName);
        return value == null || value.isBlank() ? null : value;
    }

    private SectionDefinition requireSectionDefinition(String sectionKey) {
        if (sectionKey == null) {
            throw ApiBusinessException.badRequest("ADMIN_TAXONOMY_SECTION_INVALID", "taxonomy section is invalid");
        }

        SectionDefinition definition = SECTION_LOOKUP.get(sectionKey.trim());
        if (definition == null) {
            throw ApiBusinessException.badRequest("ADMIN_TAXONOMY_SECTION_INVALID", "taxonomy section is invalid");
        }
        return definition;
    }

    private String normalizeQuery(String query) {
        if (query == null) {
            return null;
        }

        String normalized = query.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private String normalizeCategoryValue(String categoryValue) {
        if (categoryValue == null) {
            throw ApiBusinessException.badRequest("ADMIN_TAXONOMY_VALUE_INVALID", "taxonomy category value is invalid");
        }

        String normalized = categoryValue.trim();
        if (normalized.isEmpty()) {
            throw ApiBusinessException.badRequest("ADMIN_TAXONOMY_VALUE_INVALID", "taxonomy category value is invalid");
        }
        return normalized;
    }

    private String normalizeStatusCode(String statusCode) {
        if (statusCode == null) {
            throw ApiBusinessException.badRequest("ADMIN_TAXONOMY_STATUS_INVALID", "taxonomy status is invalid");
        }

        String normalized = statusCode.trim().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "enabled", "disabled" -> normalized;
            default -> throw ApiBusinessException.badRequest(
                    "ADMIN_TAXONOMY_STATUS_INVALID",
                    "taxonomy status is invalid"
            );
        };
    }

    private String normalizePromptModality(String modality) {
        if (modality == null || modality.isBlank()) {
            return null;
        }

        String normalized = modality.trim().toLowerCase(Locale.ROOT);
        if (!SUPPORTED_PROMPT_MODALITIES.contains(normalized)) {
            throw ApiBusinessException.badRequest("ADMIN_TAXONOMY_MODALITY_INVALID", "taxonomy modality is invalid");
        }
        return normalized;
    }

    private String normalizeBooleanFilter(String value, String code) {
        if (value == null || value.isBlank()) {
            return null;
        }

        String normalized = value.trim().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "true", "false" -> normalized;
            default -> throw ApiBusinessException.badRequest(code, "taxonomy filter is invalid");
        };
    }

    private String normalizeModelCategory(String modality, String category) {
        if (category == null || category.isBlank()) {
            return null;
        }
        String normalized = category.trim();
        return normalized;
    }

    private String normalizeContentCategory(String modality, String category) {
        if (category == null || category.isBlank()) {
            return null;
        }
        String normalized = category.trim();
        return normalized;
    }

    private String normalizeCompositionCategory(String modality, String category) {
        if (category == null || category.isBlank()) {
            return null;
        }
        if (!"video".equals(modality) && modality != null) {
            throw ApiBusinessException.badRequest(
                    "ADMIN_TAXONOMY_MODEL_USAGE_CATEGORY_NOT_ALLOWED",
                    "taxonomy model usage category is only available for video prompts"
            );
        }
        return category.trim();
    }

    private int normalizeSortOrder(Integer sortOrder) {
        if (sortOrder == null || sortOrder < 0 || sortOrder > 9999) {
            throw ApiBusinessException.badRequest("ADMIN_TAXONOMY_SORT_INVALID", "taxonomy sort order is invalid");
        }
        return sortOrder;
    }

    private List<UUID> normalizePromptIds(List<String> promptIds) {
        List<UUID> normalized = new ArrayList<>();
        Set<UUID> uniqueIds = new LinkedHashSet<>();
        for (String rawPromptId : promptIds) {
            String candidate = rawPromptId == null ? "" : rawPromptId.trim();
            if (candidate.isEmpty()) {
                continue;
            }
            try {
                uniqueIds.add(UUID.fromString(candidate));
            } catch (Exception ex) {
                throw ApiBusinessException.badRequest("ADMIN_TAXONOMY_PROMPT_ID_INVALID", "taxonomy prompt id is invalid");
            }
        }

        normalized.addAll(uniqueIds);
        if (normalized.isEmpty()) {
            throw ApiBusinessException.badRequest("ADMIN_TAXONOMY_PROMPT_ID_INVALID", "taxonomy prompt id is invalid");
        }
        return List.copyOf(normalized);
    }

    private String requireBulkModelCategory(String modality, String modelCategory) {
        String normalized = normalizeModelCategory(modality, modelCategory);
        if (normalized == null) {
            throw ApiBusinessException.badRequest("ADMIN_TAXONOMY_MODEL_CATEGORY_REQUIRED", "taxonomy model category is required");
        }
        return normalized;
    }

    private String requireBulkContentCategory(String modality, String contentCategory) {
        String normalized = normalizeContentCategory(modality, contentCategory);
        if (normalized == null) {
            throw ApiBusinessException.badRequest("ADMIN_TAXONOMY_CONTENT_CATEGORY_REQUIRED", "taxonomy content category is required");
        }
        return normalized;
    }

    private String requireBulkCompositionCategory(String modality, String compositionCategory) {
        String normalized = normalizeCompositionCategory(modality, compositionCategory);
        if ("video".equals(modality) && normalized == null) {
            throw ApiBusinessException.badRequest(
                    "ADMIN_TAXONOMY_MODEL_USAGE_CATEGORY_REQUIRED",
                    "taxonomy model usage category is required"
            );
        }
        return normalized;
    }

    private int normalizePromptPage(Integer page) {
        if (page == null || page < 1) {
            return DEFAULT_PROMPT_PAGE;
        }
        return page;
    }

    private int normalizePromptPageSize(Integer pageSize) {
        if (pageSize == null || pageSize < 1) {
            return DEFAULT_PROMPT_LIST_LIMIT;
        }
        return Math.min(pageSize, DEFAULT_PROMPT_LIST_LIMIT);
    }

    private List<String> normalizeExposureFlags(List<String> exposureFlags) {
        if (exposureFlags == null || exposureFlags.isEmpty()) {
            return List.of();
        }

        Set<String> uniqueFlags = new LinkedHashSet<>();
        for (String rawFlag : exposureFlags) {
            if (rawFlag == null) {
                continue;
            }

            String normalized = rawFlag.trim().toLowerCase(Locale.ROOT);
            if (normalized.isEmpty()) {
                continue;
            }

            if (!EXPOSURE_FLAGS.contains(normalized)) {
                throw ApiBusinessException.badRequest(
                        "ADMIN_TAXONOMY_EXPOSURE_INVALID",
                        "taxonomy exposure flag is invalid"
                );
            }

            uniqueFlags.add(normalized);
        }

        List<String> orderedFlags = new ArrayList<>();
        for (String flag : EXPOSURE_FLAG_ORDER) {
            if (uniqueFlags.contains(flag)) {
                orderedFlags.add(flag);
            }
        }
        return List.copyOf(orderedFlags);
    }

    private List<PromptBulkTarget> loadBulkTargets(List<UUID> promptIds) {
        return jdbcTemplate.query(connection -> {
            PreparedStatement statement = connection.prepareStatement(PROMPT_BULK_LOAD_SQL);
            statement.setArray(1, connection.createArrayOf("uuid", promptIds.toArray(UUID[]::new)));
            return statement;
        }, (resultSet, rowNum) -> new PromptBulkTarget(
                resultSet.getObject("id", UUID.class),
                resultSet.getString("modality"),
                resultSet.getObject("author_id", UUID.class),
                resultSet.getString("title"),
                readNullableText(resultSet, "model_category"),
                readNullableText(resultSet, "content_category"),
                readNullableText(resultSet, "composition_category"),
                readStringList(resultSet, "tag_names")
        ));
    }

    private boolean taxonomyConfigExists(String sectionKey, String categoryValue) {
        Boolean exists = jdbcTemplate.queryForObject(
                """
                        select exists(
                            select 1
                            from admin_taxonomy_configs
                            where section_key = ?
                              and category_value = ?
                        )
                        """,
                Boolean.class,
                sectionKey,
                categoryValue
        );
        return Boolean.TRUE.equals(exists);
    }

    private long countPromptsUsingCategory(String sectionKey, String categoryValue) {
        Long count = jdbcTemplate.queryForObject(
                COUNT_PROMPTS_USING_CATEGORY_SQL,
                Long.class,
                sectionKey,
                categoryValue,
                sectionKey,
                categoryValue,
                sectionKey,
                categoryValue,
                sectionKey,
                categoryValue,
                sectionKey,
                categoryValue
        );
        return count == null ? 0L : count;
    }

    private PromptTaxonomyValue resolveRebindTaxonomyValue(String sectionKey, String categoryValue, PromptBulkTarget target) {
        String modality = target.modality();
        return switch (sectionKey) {
            case "image-model" -> {
                if (!"image".equals(modality)) {
                    throw ApiBusinessException.badRequest("ADMIN_TAXONOMY_MODALITY_MISMATCH", "taxonomy prompt modality does not match category section");
                }
                yield new PromptTaxonomyValue(categoryValue, target.contentCategory(), null);
            }
            case "video-model" -> {
                if (!"video".equals(modality)) {
                    throw ApiBusinessException.badRequest("ADMIN_TAXONOMY_MODALITY_MISMATCH", "taxonomy prompt modality does not match category section");
                }
                yield new PromptTaxonomyValue(categoryValue, target.contentCategory(), target.modelUsageCategory());
            }
            case "image-content-category" -> {
                if (!"image".equals(modality)) {
                    throw ApiBusinessException.badRequest("ADMIN_TAXONOMY_MODALITY_MISMATCH", "taxonomy prompt modality does not match category section");
                }
                yield new PromptTaxonomyValue(target.modelCategory(), categoryValue, null);
            }
            case "video-content-category" -> {
                if (!"video".equals(modality)) {
                    throw ApiBusinessException.badRequest("ADMIN_TAXONOMY_MODALITY_MISMATCH", "taxonomy prompt modality does not match category section");
                }
                yield new PromptTaxonomyValue(target.modelCategory(), categoryValue, target.modelUsageCategory());
            }
            case "video-model-usage" -> {
                if (!"video".equals(modality)) {
                    throw ApiBusinessException.badRequest("ADMIN_TAXONOMY_MODALITY_MISMATCH", "taxonomy prompt modality does not match category section");
                }
                yield new PromptTaxonomyValue(target.modelCategory(), target.contentCategory(), categoryValue);
            }
            default -> throw ApiBusinessException.badRequest("ADMIN_TAXONOMY_SECTION_INVALID", "taxonomy section is invalid");
        };
    }

    private List<String> buildPromptTaxonomyTags(
            String modality,
            String modelCategory,
            String contentCategory,
            String compositionCategory
    ) {
        List<String> tags = new ArrayList<>();
        tags.add("image".equals(modality) ? "image-prompt" : "video-prompt");
        tags.add(modelCategory);
        tags.add(contentCategory);
        if ("video".equals(modality)) {
            tags.add(compositionCategory);
        }
        return tags.stream()
                .filter(value -> value != null && !value.isBlank())
                .distinct()
                .toList();
    }

    private List<String> mergePromptTaxonomyTags(
            List<String> existingTagNames,
            String currentModelCategory,
            String currentContentCategory,
            String currentCompositionCategory,
            String nextModality,
            String nextModelCategory,
            String nextContentCategory,
            String nextCompositionCategory
    ) {
        Set<String> taxonomyTokensToRemove = buildReservedPromptTaxonomyTokens(
                currentModelCategory,
                currentContentCategory,
                currentCompositionCategory
        );
        LinkedHashSet<String> mergedTags = new LinkedHashSet<>();
        for (String existingTag : existingTagNames) {
            if (existingTag == null) {
                continue;
            }

            String normalized = existingTag.trim();
            if (normalized.isEmpty()) {
                continue;
            }
            if (taxonomyTokensToRemove.contains(normalized)) {
                continue;
            }
            mergedTags.add(normalized);
        }

        mergedTags.addAll(buildPromptTaxonomyTags(
                nextModality,
                nextModelCategory,
                nextContentCategory,
                nextCompositionCategory
        ));
        return List.copyOf(mergedTags);
    }

    private Set<String> buildReservedPromptTaxonomyTokens(
            String currentModelCategory,
            String currentContentCategory,
            String currentCompositionCategory
    ) {
        LinkedHashSet<String> reserved = new LinkedHashSet<>();
        reserved.add("image-prompt");
        reserved.add("video-prompt");
        reserved.add("single-model");
        reserved.add("multi-model");
        if (currentModelCategory != null && !currentModelCategory.isBlank()) {
            reserved.add(currentModelCategory.trim());
        }
        if (currentContentCategory != null && !currentContentCategory.isBlank()) {
            reserved.add(currentContentCategory.trim());
        }
        if (currentCompositionCategory != null && !currentCompositionCategory.isBlank()) {
            reserved.add(currentCompositionCategory.trim());
        }
        return Set.copyOf(reserved);
    }

    private String resolveCategoryLabel(String sectionKey, String categoryValue) {
        SectionDefinition definition = SECTION_LOOKUP.get(sectionKey);
        return definition == null ? categoryValue : definition.resolveLabel(categoryValue);
    }

    private boolean isStandardCategory(String sectionKey, String categoryValue) {
        SectionDefinition definition = SECTION_LOOKUP.get(sectionKey);
        return definition != null && definition.hasStandardCategory(categoryValue);
    }

    private AdminTaxonomyResponse.Item buildStandardTaxonomyItem(String sectionKey, String categoryValue) {
        SectionDefinition definition = SECTION_LOOKUP.get(sectionKey);
        if (definition == null || !definition.hasStandardCategory(categoryValue)) {
            return null;
        }
        return definition.buildDefaultItem(categoryValue);
    }

    private String normalizeNoteText(String noteText) {
        if (noteText == null) {
            return null;
        }

        String normalized = noteText.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private boolean taxonomyItemExists(String sectionKey, String categoryValue) {
        if (isStandardCategory(sectionKey, categoryValue)) {
            return true;
        }
        Boolean exists = jdbcTemplate.queryForObject(
                ITEM_EXISTS_SQL,
                Boolean.class,
                sectionKey,
                categoryValue
        );
        return Boolean.TRUE.equals(exists);
    }

    private boolean shouldPersistCustomConfig(
            String statusCode,
            int sortOrder,
            List<String> exposureFlags,
            String noteText
    ) {
        return !"enabled".equals(statusCode)
                || sortOrder != DEFAULT_SORT_ORDER
                || !exposureFlags.isEmpty()
                || noteText != null;
    }

    private void upsertConfig(
            String sectionKey,
            String categoryValue,
            String statusCode,
            int sortOrder,
            List<String> exposureFlags,
            String noteText,
            UUID operatorId
    ) {
        jdbcTemplate.update(connection -> {
            PreparedStatement statement = connection.prepareStatement(UPSERT_CONFIG_SQL);
            statement.setString(1, sectionKey);
            statement.setString(2, categoryValue);
            statement.setString(3, statusCode);
            statement.setInt(4, sortOrder);
            statement.setArray(5, connection.createArrayOf("text", exposureFlags.toArray(String[]::new)));
            statement.setString(6, noteText);
            statement.setObject(7, operatorId);
            return statement;
        });
    }

    private AdminTaxonomyResponse.Item loadTaxonomyItem(String sectionKey, String categoryValue) {
        AdminTaxonomyResponse.Item item = jdbcTemplate.query(
                ITEM_SQL,
                resultSet -> resultSet.next() ? mapItem(resultSet) : null,
                sectionKey,
                categoryValue
        );
        if (item != null) {
            return item;
        }
        return buildStandardTaxonomyItem(sectionKey, categoryValue);
    }

    private static Map<String, SectionDefinition> buildSectionLookup() {
        Map<String, SectionDefinition> lookup = new LinkedHashMap<>();
        for (SectionDefinition definition : SECTION_DEFINITIONS) {
            lookup.put(definition.key(), definition);
        }
        return Map.copyOf(lookup);
    }

    private record SectionDefinition(
            String key,
            String label,
            String description,
            String modalityScope,
            List<CategoryDefinition> standardCategories
    ) {
        private boolean hasStandardCategory(String categoryValue) {
            return standardCategories.stream().anyMatch(item -> item.value().equals(categoryValue));
        }

        private String resolveLabel(String categoryValue) {
            for (CategoryDefinition item : standardCategories) {
                if (item.value().equals(categoryValue)) {
                    return item.label();
                }
            }
            return categoryValue;
        }

        private AdminTaxonomyResponse.Item buildDefaultItem(String categoryValue) {
            return new AdminTaxonomyResponse.Item(
                    categoryValue,
                    resolveLabel(categoryValue),
                    modalityScope,
                    0,
                    0,
                    null,
                    List.of(),
                    DEFAULT_GOVERNANCE
            );
        }
    }

    private record CategoryDefinition(
            String value,
            String label
    ) {
    }

    private static final class SectionAccumulator {

        private final SectionDefinition definition;
        private final LinkedHashMap<String, AdminTaxonomyResponse.Item> items = new LinkedHashMap<>();

        private SectionAccumulator(SectionDefinition definition) {
            this.definition = definition;
            for (CategoryDefinition standardCategory : definition.standardCategories()) {
                items.put(standardCategory.value(), definition.buildDefaultItem(standardCategory.value()));
            }
        }

        private void addItem(AdminTaxonomyResponse.Item item) {
            items.put(item.value(), item);
        }

        private AdminTaxonomyResponse.Section toResponse() {
            List<AdminTaxonomyResponse.Item> responseItems = List.copyOf(items.values());
            return new AdminTaxonomyResponse.Section(
                    definition.key(),
                    definition.label(),
                    definition.description(),
                    responseItems.stream().mapToLong(AdminTaxonomyResponse.Item::promptCount).sum(),
                    responseItems.size(),
                    responseItems
            );
        }
    }

    private record PromptBulkTarget(
            UUID promptId,
            String modality,
            UUID authorId,
            String title,
            String modelCategory,
            String contentCategory,
            String modelUsageCategory,
            List<String> tagNames
    ) {
    }

    private record PromptTaxonomyValue(
            String modelCategory,
            String contentCategory,
            String modelUsageCategory
    ) {
    }
}
