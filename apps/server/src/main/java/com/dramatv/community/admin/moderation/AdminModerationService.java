package com.dramatv.community.admin.moderation;

import com.dramatv.community.admin.auditlogs.AdminAuditLogService;
import com.dramatv.community.admin.auth.AdminAccessService;
import com.dramatv.community.admin.moderation.dto.response.AdminModerationActionResponse;
import com.dramatv.community.admin.moderation.dto.response.AdminModerationItemDetailResponse;
import com.dramatv.community.admin.moderation.dto.response.AdminModerationListResponse;
import com.dramatv.community.identity.application.CurrentUser;
import com.dramatv.community.shared.media.JdbcMediaUrlResolver;
import com.dramatv.community.shared.request.MdcBusinessContextScope;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.sql.Array;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminModerationService {

    private static final Logger log = LoggerFactory.getLogger(AdminModerationService.class);
    private static final String[] MANAGE_ROLES = {"admin", "moderator"};
    private static final int DEFAULT_PAGE = 1;
    private static final int DEFAULT_PAGE_SIZE = 15;
    private static final int MAX_PAGE_SIZE = 100;

    private static final String FILTERED_ROWS_CTE = """
            with moderation_rows as (
                select
                    audit.target_type,
                    audit.target_id,
                    audit.status_code,
                    audit.risk_level,
                    audit.reason_code,
                    audit.operator_id as reviewer_id,
                    coalesce(
                        cast(audit.detail_json ->> 'adminDecisionAt' as timestamptz),
                        audit.created_at
                    ) as operated_at,
                    audit.created_at as submitted_at,
                    creator.id as author_id,
                    creator.display_name as author_display_name,
                    reviewer.display_name as reviewer_display_name,
                    coalesce(video.title, workflow.title, prompt.title, thread.title, '已删除内容') as title,
                    coalesce(video.summary, workflow.summary, prompt.summary, thread.excerpt_text, '') as summary_text,
                    coalesce(prompt.prompt_text, thread.content_text, '') as content_text,
                    prompt.modality as prompt_modality,
                    coalesce(video.tag_names, workflow.tag_names, prompt.tag_names, thread.tag_names, '{}'::text[]) as tag_names,
                    coalesce(
                        video.published_at,
                        workflow.published_at,
                        prompt.published_at,
                        thread.published_at,
                        audit.created_at
                    ) as content_published_at,
                    video_cover.storage_provider as video_cover_storage_provider,
                    video_cover.bucket_name as video_cover_bucket_name,
                    video_cover.object_key as video_cover_url,
                    video_poster.storage_provider as video_poster_storage_provider,
                    video_poster.bucket_name as video_poster_bucket_name,
                    video_poster.object_key as video_poster_url,
                    video_preview.storage_provider as video_preview_storage_provider,
                    video_preview.bucket_name as video_preview_bucket_name,
                    video_preview.object_key as video_preview_url,
                    video_source.storage_provider as video_source_storage_provider,
                    video_source.bucket_name as video_source_bucket_name,
                    video_source.object_key as video_source_url,
                    workflow_cover.storage_provider as workflow_cover_storage_provider,
                    workflow_cover.bucket_name as workflow_cover_bucket_name,
                    workflow_cover.object_key as workflow_cover_url,
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
                    prompt_preview_example.asset_kind as prompt_preview_example_asset_kind,
                    prompt_example.storage_provider as prompt_example_storage_provider,
                    prompt_example.bucket_name as prompt_example_bucket_name,
                    prompt_example.object_key as prompt_example_url,
                    prompt_example.asset_kind as prompt_example_asset_kind,
                    audit.detail_json
                from audit_records audit
                left join videos video
                    on audit.target_type = 'video'
                   and video.id = audit.target_id
                left join workflows workflow
                    on audit.target_type = 'workflow'
                   and workflow.id = audit.target_id
                left join prompt_entries prompt
                    on audit.target_type = 'prompt'
                   and prompt.id = audit.target_id
                left join discussion_threads thread
                    on audit.target_type = 'post'
                   and thread.id = audit.target_id
                left join users creator
                    on creator.id = coalesce(video.author_id, workflow.author_id, prompt.author_id, thread.author_id)
                left join users reviewer
                    on reviewer.id = audit.operator_id
                left join media_assets video_cover
                    on video_cover.id = video.cover_asset_id
                left join media_assets video_poster
                    on video_poster.id = video.poster_asset_id
                left join media_assets video_preview
                    on video_preview.id = video.preview_asset_id
                left join media_assets video_source
                    on video_source.id = video.source_asset_id
                left join media_assets workflow_cover
                    on workflow_cover.id = workflow.cover_asset_id
                left join media_assets prompt_cover
                    on prompt_cover.id = prompt.cover_asset_id
                left join media_assets prompt_primary_example
                    on prompt_primary_example.id = prompt.primary_example_asset_id
                left join media_assets prompt_preview_example
                    on prompt_preview_example.id = (
                        select link.media_asset_id
                        from prompt_example_links link
                        where link.prompt_id = prompt.id
                          and link.role_code = 'preview'
                        order by link.sort_order asc, link.created_at asc
                        limit 1
                    )
                left join media_assets prompt_example
                    on prompt_example.id = (
                        select link.media_asset_id
                        from prompt_example_links link
                        where link.prompt_id = prompt.id
                          and link.role_code = 'example'
                        order by link.sort_order asc, link.created_at asc
                        limit 1
                    )
                where audit.audit_type = 'publish_review'
                  and (
                        cast(? as varchar) is null
                        or creator.username ilike ?
                        or creator.display_name ilike ?
                        or coalesce(video.title, workflow.title, prompt.title, thread.title, '') ilike ?
                    )
                  and (
                        cast(? as varchar) is null
                        or (
                            cast(? as varchar) = 'image_prompt'
                            and audit.target_type = 'prompt'
                            and coalesce(prompt.modality, '') = 'image'
                        )
                        or (
                            cast(? as varchar) = 'video_prompt'
                            and audit.target_type = 'prompt'
                            and coalesce(prompt.modality, '') = 'video'
                        )
                        or (
                            cast(? as varchar) not in ('image_prompt', 'video_prompt')
                            and audit.target_type = cast(? as varchar)
                        )
                    )
                  and (cast(? as varchar) is null or audit.status_code = cast(? as varchar))
            )
            """;

    private static final String SUMMARY_SQL = FILTERED_ROWS_CTE + """
            select
                count(*) filter (where status_code in ('pending_review', 'in_review')) as pending_items,
                count(*) filter (where risk_level = 'high') as high_risk_items,
                count(*) filter (
                    where status_code in ('approved', 'rejected', 'taken_down')
                      and operated_at >= date_trunc('day', now())
                ) as processed_today,
                count(*) filter (where status_code = 'taken_down') as offline_items
            from moderation_rows
            """;

    private static final String ITEMS_SQL = FILTERED_ROWS_CTE + """
            select
                target_type,
                target_id,
                title,
                author_id,
                author_display_name,
                tag_names,
                submitted_at,
                status_code,
                risk_level,
                reason_code,
                reviewer_id,
                reviewer_display_name,
                summary_text,
                content_text,
                video_cover_storage_provider,
                video_cover_bucket_name,
                video_cover_url,
                video_poster_storage_provider,
                video_poster_bucket_name,
                video_poster_url,
                video_preview_storage_provider,
                video_preview_bucket_name,
                video_preview_url,
                video_source_storage_provider,
                video_source_bucket_name,
                video_source_url,
                workflow_cover_storage_provider,
                workflow_cover_bucket_name,
                workflow_cover_url,
                prompt_cover_storage_provider,
                prompt_cover_bucket_name,
                prompt_cover_url,
                prompt_cover_asset_kind,
                prompt_primary_example_storage_provider,
                prompt_primary_example_bucket_name,
                prompt_primary_example_url,
                prompt_primary_example_asset_kind,
                prompt_preview_example_storage_provider,
                prompt_preview_example_bucket_name,
                prompt_preview_example_url,
                prompt_preview_example_asset_kind,
                prompt_example_storage_provider,
                prompt_example_bucket_name,
                prompt_example_url,
                prompt_example_asset_kind,
                prompt_modality,
                detail_json
            from moderation_rows
            order by
                case
                    when status_code in ('pending_review', 'in_review') then 0
                    when status_code = 'taken_down' then 1
                    else 2
                end,
                submitted_at desc,
                target_id desc
            limit ?
            offset ?
            """;

    private static final String COUNT_SQL = FILTERED_ROWS_CTE + """
            select count(*) from moderation_rows
            """;

    private static final String DETAIL_SQL = FILTERED_ROWS_CTE + """
            select
                target_type,
                target_id,
                title,
                author_id,
                author_display_name,
                tag_names,
                submitted_at,
                status_code,
                risk_level,
                reason_code,
                reviewer_id,
                reviewer_display_name,
                summary_text,
                content_text,
                video_cover_storage_provider,
                video_cover_bucket_name,
                video_cover_url,
                video_poster_storage_provider,
                video_poster_bucket_name,
                video_poster_url,
                video_preview_storage_provider,
                video_preview_bucket_name,
                video_preview_url,
                video_source_storage_provider,
                video_source_bucket_name,
                video_source_url,
                workflow_cover_storage_provider,
                workflow_cover_bucket_name,
                workflow_cover_url,
                prompt_cover_storage_provider,
                prompt_cover_bucket_name,
                prompt_cover_url,
                prompt_cover_asset_kind,
                prompt_primary_example_storage_provider,
                prompt_primary_example_bucket_name,
                prompt_primary_example_url,
                prompt_primary_example_asset_kind,
                prompt_preview_example_storage_provider,
                prompt_preview_example_bucket_name,
                prompt_preview_example_url,
                prompt_preview_example_asset_kind,
                prompt_example_storage_provider,
                prompt_example_bucket_name,
                prompt_example_url,
                prompt_example_asset_kind,
                prompt_modality,
                detail_json
            from moderation_rows
            where target_type = ?
              and target_id = ?
            limit 1
            """;

    private final JdbcTemplate jdbcTemplate;
    private final AdminAccessService adminAccessService;
    private final AdminAuditLogService adminAuditLogService;
    private final JdbcMediaUrlResolver jdbcMediaUrlResolver;
    private final ObjectMapper objectMapper;

    public AdminModerationService(
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

    public AdminModerationListResponse listItems(String query, String targetType, String status, Integer page, Integer pageSize) {
        adminAccessService.requireAnyRole(MANAGE_ROLES);

        String normalizedQuery = normalizeQuery(query);
        String likeQuery = normalizedQuery == null ? null : "%" + normalizedQuery + "%";
        String normalizedTargetType = normalizeTargetType(targetType);
        String normalizedStatus = normalizeStatus(status);
        int safePage = normalizePage(page);
        int safePageSize = normalizePageSize(pageSize);
        long totalItems = jdbcTemplate.queryForObject(
                COUNT_SQL,
                Long.class,
                normalizedQuery,
                likeQuery,
                likeQuery,
                likeQuery,
                normalizedTargetType,
                normalizedTargetType,
                normalizedTargetType,
                normalizedTargetType,
                normalizedTargetType,
                normalizedStatus,
                normalizedStatus
        );
        int totalPages = totalItems == 0 ? 1 : (int) Math.ceil((double) totalItems / safePageSize);
        int effectivePage = Math.min(safePage, totalPages);
        int offset = (effectivePage - 1) * safePageSize;

        AdminModerationListResponse.Summary summary = jdbcTemplate.queryForObject(
                SUMMARY_SQL,
                (resultSet, rowNum) -> new AdminModerationListResponse.Summary(
                        resultSet.getLong("pending_items"),
                        resultSet.getLong("high_risk_items"),
                        resultSet.getLong("processed_today"),
                        resultSet.getLong("offline_items")
                ),
                normalizedQuery,
                likeQuery,
                likeQuery,
                likeQuery,
                normalizedTargetType,
                normalizedTargetType,
                normalizedTargetType,
                normalizedTargetType,
                normalizedTargetType,
                normalizedStatus,
                normalizedStatus
        );

        List<AdminModerationListResponse.Item> items = jdbcTemplate.query(
                ITEMS_SQL,
                (resultSet, rowNum) -> mapListItem(resultSet),
                normalizedQuery,
                likeQuery,
                likeQuery,
                likeQuery,
                normalizedTargetType,
                normalizedTargetType,
                normalizedTargetType,
                normalizedTargetType,
                normalizedTargetType,
                normalizedStatus,
                normalizedStatus,
                safePageSize,
                offset
        );

        return new AdminModerationListResponse(
                summary == null ? new AdminModerationListResponse.Summary(0, 0, 0, 0) : summary,
                new AdminModerationListResponse.Pagination(
                        effectivePage,
                        safePageSize,
                        totalItems,
                        totalPages,
                        effectivePage > 1,
                        effectivePage < totalPages
                ),
                items
        );
    }

    private int normalizePage(Integer page) {
        if (page == null || page < 1) {
            return DEFAULT_PAGE;
        }
        return page;
    }

    private int normalizePageSize(Integer pageSize) {
        if (pageSize == null || pageSize < 1) {
            return DEFAULT_PAGE_SIZE;
        }
        return Math.min(pageSize, MAX_PAGE_SIZE);
    }

    public AdminModerationItemDetailResponse getItem(String targetType, String targetId) {
        adminAccessService.requireAnyRole(MANAGE_ROLES);

        ManagedTarget target = requireManagedTarget(targetType, targetId);
        AdminModerationItemDetailResponse detail = jdbcTemplate.query(
                DETAIL_SQL,
                resultSet -> resultSet.next() ? mapDetailItem(resultSet) : null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                target.targetType(),
                target.targetId()
        );

        if (detail == null) {
            throw new IllegalArgumentException("ADMIN_MODERATION_ITEM_NOT_FOUND");
        }

        return detail;
    }

    @Transactional
    public AdminModerationActionResponse approve(String targetType, String targetId, String note) {
        return applyDecision("approve", targetType, targetId, "approved", "published", note);
    }

    @Transactional
    public AdminModerationActionResponse reject(String targetType, String targetId, String note) {
        return applyDecision("reject", targetType, targetId, "rejected", "rejected", note);
    }

    @Transactional
    public AdminModerationActionResponse offline(String targetType, String targetId, String note) {
        return applyDecision("offline", targetType, targetId, "taken_down", "taken_down", note);
    }

    @Transactional
    public AdminModerationActionResponse restore(String targetType, String targetId, String note) {
        return applyDecision("restore", targetType, targetId, "approved", "published", note);
    }

    private AdminModerationActionResponse applyDecision(
            String action,
            String targetType,
            String targetId,
            String auditStatus,
            String publishStatus,
            String note
    ) {
        CurrentUser operator = adminAccessService.requireAnyRole(MANAGE_ROLES);
        ManagedTarget target = requireManagedTarget(targetType, targetId);
        try (MdcBusinessContextScope ignored = MdcBusinessContextScope.open(moderationContext(target))) {
            String previousPublishStatus = loadPublishStatus(target);
            String previousAuditStatus = loadLatestAuditStatus(target);

            applyPublishStatus(target, publishStatus);
            updateAuditRecord(target, operator.id(), auditStatus, note);
            syncFeedItems(target, publishStatus);
            syncCreatorAndWorkflowCounters(target);
            log.info(
                    "admin moderation action success: action={} operatorId={} targetType={} targetId={} authorId={} workflowId={} previousPublishStatus={} nextPublishStatus={} previousAuditStatus={} nextAuditStatus={} hasNote={}",
                    action,
                    operator.id(),
                    target.targetType(),
                    target.targetId(),
                    target.authorId(),
                    target.workflowId(),
                    previousPublishStatus,
                    publishStatus,
                    previousAuditStatus,
                    auditStatus,
                    note != null && !note.isBlank()
            );
            adminAuditLogService.recordSuccessfulOperation(
                    operator,
                    "moderation",
                    "内容审核",
                    action,
                    resolveActionLabel(action),
                    target.targetType(),
                    target.targetId().toString(),
                    target.targetType() + " " + target.targetId(),
                    "approve".equals(action) || "restore".equals(action) ? "normal" : "sensitive",
                    mergeAuditNote(action, note),
                    "/api/admin/moderation/items/" + target.targetType() + "/" + target.targetId() + "/" + action,
                    "POST",
                    "publishStatus=%s,previousPublishStatus=%s,previousAuditStatus=%s,nextAuditStatus=%s".formatted(
                            publishStatus,
                            previousPublishStatus,
                            previousAuditStatus,
                            auditStatus
                    )
            );

            return new AdminModerationActionResponse(action, target.targetType(), target.targetId().toString(), auditStatus);
        }
    }

    private String loadPublishStatus(ManagedTarget target) {
        return switch (target.targetType()) {
            case "video" -> jdbcTemplate.query(
                    "select publish_status from videos where id = ? and deleted_at is null",
                    resultSet -> resultSet.next() ? resultSet.getString("publish_status") : null,
                    target.targetId()
            );
            case "workflow" -> jdbcTemplate.query(
                    "select publish_status from workflows where id = ? and deleted_at is null",
                    resultSet -> resultSet.next() ? resultSet.getString("publish_status") : null,
                    target.targetId()
            );
            case "prompt" -> jdbcTemplate.query(
                    "select publish_status from prompt_entries where id = ? and deleted_at is null",
                    resultSet -> resultSet.next() ? resultSet.getString("publish_status") : null,
                    target.targetId()
            );
            case "post" -> jdbcTemplate.query(
                    "select publish_status from discussion_threads where id = ? and deleted_at is null",
                    resultSet -> resultSet.next() ? resultSet.getString("publish_status") : null,
                    target.targetId()
            );
            default -> null;
        };
    }

    private String loadLatestAuditStatus(ManagedTarget target) {
        return jdbcTemplate.query("""
                select status_code
                from audit_records
                where audit_type = 'publish_review'
                  and target_type = ?
                  and target_id = ?
                order by created_at desc
                limit 1
                """,
                resultSet -> resultSet.next() ? resultSet.getString("status_code") : null,
                target.targetType(),
                target.targetId()
        );
    }

    private void applyPublishStatus(ManagedTarget target, String publishStatus) {
        if ("video".equals(target.targetType())) {
            jdbcTemplate.update("""
                    update videos
                    set publish_status = ?,
                        published_at = case when ? = 'published' then coalesce(published_at, now()) else published_at end,
                        updated_at = now()
                    where id = ? and deleted_at is null
                    """,
                    publishStatus,
                    publishStatus,
                    target.targetId()
            );
            return;
        }

        if ("workflow".equals(target.targetType())) {
            jdbcTemplate.update("""
                    update workflows
                    set publish_status = ?,
                        published_at = case when ? = 'published' then coalesce(published_at, now()) else published_at end,
                        updated_at = now()
                    where id = ? and deleted_at is null
                    """,
                    publishStatus,
                    publishStatus,
                    target.targetId()
            );
            return;
        }

        if ("prompt".equals(target.targetType())) {
            jdbcTemplate.update("""
                    update prompt_entries
                    set publish_status = ?,
                        published_at = case when ? = 'published' then coalesce(published_at, now()) else published_at end,
                        updated_at = now()
                    where id = ? and deleted_at is null
                    """,
                    publishStatus,
                    publishStatus,
                    target.targetId()
            );
            return;
        }

        jdbcTemplate.update("""
                update discussion_threads
                set publish_status = ?,
                    published_at = case when ? = 'published' then coalesce(published_at, now()) else published_at end,
                    updated_at = now()
                where id = ? and deleted_at is null
                """,
                publishStatus,
                publishStatus,
                target.targetId()
        );
    }

    private void updateAuditRecord(ManagedTarget target, UUID operatorId, String auditStatus, String note) {
        ObjectNode detailJson = loadLatestAuditDetail(target.targetType(), target.targetId());
        detailJson.put("adminDecisionAt", OffsetDateTime.now().toString());
        detailJson.put("adminDecisionStatus", auditStatus);
        if (note != null && !note.isBlank()) {
            detailJson.put("adminDecisionNote", note.trim());
        }

        int updatedRows = jdbcTemplate.update("""
                with latest as (
                    select id
                    from audit_records
                    where audit_type = 'publish_review'
                      and target_type = ?
                      and target_id = ?
                    order by created_at desc
                    limit 1
                )
                update audit_records
                set status_code = ?,
                    operator_type = 'admin',
                    operator_id = ?,
                    detail_json = cast(? as jsonb)
                where id in (select id from latest)
                """,
                target.targetType(),
                target.targetId(),
                auditStatus,
                operatorId,
                detailJson.toString()
        );

        if (updatedRows > 0) {
            return;
        }

        jdbcTemplate.update("""
                insert into audit_records (
                    id, target_type, target_id, audit_type, status_code, risk_level, reason_code,
                    operator_type, operator_id, detail_json, created_at
                )
                values (?, ?, ?, 'publish_review', ?, ?, null, 'admin', ?, cast(? as jsonb), now())
                """,
                UUID.randomUUID(),
                target.targetType(),
                target.targetId(),
                auditStatus,
                defaultRiskLevel(auditStatus),
                operatorId,
                detailJson.toString()
        );
    }

    private String defaultRiskLevel(String auditStatus) {
        if ("taken_down".equals(auditStatus) || "rejected".equals(auditStatus)) {
            return "high";
        }
        return "low";
    }

    private ObjectNode loadLatestAuditDetail(String targetType, UUID targetId) {
        String raw = jdbcTemplate.query("""
                select detail_json::text
                from audit_records
                where audit_type = 'publish_review'
                  and target_type = ?
                  and target_id = ?
                order by created_at desc
                limit 1
                """,
                resultSet -> resultSet.next() ? resultSet.getString(1) : null,
                targetType,
                targetId
        );
        if (raw == null || raw.isBlank()) {
            return objectMapper.createObjectNode();
        }

        try {
            JsonNode parsed = objectMapper.readTree(raw);
            return parsed instanceof ObjectNode objectNode ? objectNode.deepCopy() : objectMapper.createObjectNode();
        } catch (Exception ex) {
            return objectMapper.createObjectNode();
        }
    }

    private void syncFeedItems(ManagedTarget target, String publishStatus) {
        if ("published".equals(publishStatus)) {
            jdbcTemplate.update("""
                    update feed_items
                    set status_code = 'active',
                        updated_at = now()
                    where target_type = ? and target_id = ?
                    """,
                    target.targetType(),
                    target.targetId()
            );
            return;
        }

        jdbcTemplate.update("""
                update feed_items
                set status_code = 'inactive',
                    updated_at = now()
                where target_type = ? and target_id = ?
                """,
                target.targetType(),
                target.targetId()
        );
    }

    private void syncCreatorAndWorkflowCounters(ManagedTarget target) {
        if (target.authorId() != null) {
            jdbcTemplate.update("""
                    update creator_profiles
                    set video_count = (
                            (
                                select count(*) from videos
                                where author_id = ? and publish_status = 'published' and deleted_at is null
                            ) + (
                                select count(*) from prompt_entries
                                where author_id = ? and publish_status = 'published' and deleted_at is null
                            )
                        ),
                        workflow_count = (
                            select count(*) from workflows
                            where author_id = ? and publish_status = 'published' and deleted_at is null
                        ),
                        updated_at = now()
                    where user_id = ?
                    """,
                    target.authorId(),
                    target.authorId(),
                    target.authorId(),
                    target.authorId()
            );
        }

        if ("video".equals(target.targetType()) && target.workflowId() != null) {
            jdbcTemplate.update("""
                    update workflows
                    set video_bind_count = (
                            select count(*) from videos
                            where workflow_id = ? and publish_status = 'published' and deleted_at is null
                        ),
                        updated_at = now()
                    where id = ?
                    """,
                    target.workflowId(),
                    target.workflowId()
            );
        }
    }

    private ManagedTarget requireManagedTarget(String targetType, String targetId) {
        String normalizedTargetType = normalizeTargetType(targetType);
        if (normalizedTargetType == null) {
            throw new IllegalArgumentException("ADMIN_MODERATION_FILTER_INVALID");
        }

        UUID parsedTargetId;
        try {
            parsedTargetId = UUID.fromString(targetId);
        } catch (Exception ex) {
            throw new IllegalArgumentException("ADMIN_MODERATION_ITEM_NOT_FOUND");
        }

        ManagedTarget target = switch (normalizedTargetType) {
            case "video" -> jdbcTemplate.query("""
                    select author_id, workflow_id
                    from videos
                    where id = ? and deleted_at is null
                    """,
                    resultSet -> resultSet.next()
                            ? new ManagedTarget(
                                    "video",
                                    parsedTargetId,
                                    resultSet.getObject("author_id", UUID.class),
                                    resultSet.getObject("workflow_id", UUID.class)
                            )
                            : null,
                    parsedTargetId
            );
            case "workflow" -> jdbcTemplate.query("""
                    select author_id
                    from workflows
                    where id = ? and deleted_at is null
                    """,
                    resultSet -> resultSet.next()
                            ? new ManagedTarget("workflow", parsedTargetId, resultSet.getObject("author_id", UUID.class), null)
                            : null,
                    parsedTargetId
            );
            case "prompt" -> jdbcTemplate.query("""
                    select author_id
                    from prompt_entries
                    where id = ? and deleted_at is null
                    """,
                    resultSet -> resultSet.next()
                            ? new ManagedTarget("prompt", parsedTargetId, resultSet.getObject("author_id", UUID.class), null)
                            : null,
                    parsedTargetId
            );
            case "post" -> jdbcTemplate.query("""
                    select author_id
                    from discussion_threads
                    where id = ? and deleted_at is null
                    """,
                    resultSet -> resultSet.next()
                            ? new ManagedTarget("post", parsedTargetId, resultSet.getObject("author_id", UUID.class), null)
                            : null,
                    parsedTargetId
            );
            default -> null;
        };

        if (target == null) {
            throw new IllegalArgumentException("ADMIN_MODERATION_ITEM_NOT_FOUND");
        }

        return target;
    }

    private AdminModerationListResponse.Item mapListItem(ResultSet resultSet) throws SQLException {
        String targetType = resultSet.getString("target_type");
        return new AdminModerationListResponse.Item(
                targetType,
                resultSet.getObject("target_id", UUID.class).toString(),
                resultSet.getString("title"),
                nullableUuidText(resultSet, "author_id"),
                resultSet.getString("author_display_name"),
                readTextArray(resultSet, "tag_names"),
                resultSet.getObject("submitted_at", OffsetDateTime.class),
                resultSet.getString("status_code"),
                nullableText(resultSet, "risk_level"),
                nullableUuidText(resultSet, "reviewer_id"),
                nullableText(resultSet, "reviewer_display_name"),
                nullableText(resultSet, "summary_text"),
                buildListMedia(resultSet, targetType),
                buildModelTags(resultSet)
        );
    }

    private AdminModerationItemDetailResponse mapDetailItem(ResultSet resultSet) throws SQLException {
        String targetType = resultSet.getString("target_type");
        List<String> modelTags = buildModelTags(resultSet);
        JsonNode detailJson = parseJson(nullableText(resultSet, "detail_json"));
        return new AdminModerationItemDetailResponse(
                targetType,
                resultSet.getObject("target_id", UUID.class).toString(),
                resultSet.getString("title"),
                nullableUuidText(resultSet, "author_id"),
                resultSet.getString("author_display_name"),
                readTextArray(resultSet, "tag_names"),
                resultSet.getObject("submitted_at", OffsetDateTime.class),
                resultSet.getString("status_code"),
                nullableText(resultSet, "risk_level"),
                nullableUuidText(resultSet, "reviewer_id"),
                nullableText(resultSet, "reviewer_display_name"),
                nullableText(resultSet, "summary_text"),
                nullableText(resultSet, "content_text"),
                buildDetailMedia(resultSet, targetType),
                modelTags,
                buildRiskSignals(resultSet, detailJson)
        );
    }

    private List<String> buildModelTags(ResultSet resultSet) throws SQLException {
        String promptModality = nullableText(resultSet, "prompt_modality");
        JsonNode detailJson = parseJson(nullableText(resultSet, "detail_json"));
        List<String> modelTags = new ArrayList<>();
        if (promptModality != null) {
            modelTags.add("video".equals(promptModality) ? "视频提示词" : "图片提示词");
        }
        if (detailJson != null && detailJson.hasNonNull("submitMode")) {
            modelTags.add(detailJson.get("submitMode").asText());
        }
        return List.copyOf(modelTags);
    }

    private AdminModerationListResponse.Media buildListMedia(ResultSet resultSet, String targetType) throws SQLException {
        MediaValues mediaValues = resolveMediaValues(resultSet, targetType);
        return new AdminModerationListResponse.Media(
                mediaValues.coverUrl(),
                mediaValues.posterUrl(),
                mediaValues.previewUrl(),
                mediaValues.sourceUrl()
        );
    }

    private AdminModerationItemDetailResponse.Media buildDetailMedia(ResultSet resultSet, String targetType) throws SQLException {
        MediaValues mediaValues = resolveMediaValues(resultSet, targetType);
        return new AdminModerationItemDetailResponse.Media(
                mediaValues.coverUrl(),
                mediaValues.posterUrl(),
                mediaValues.previewUrl(),
                mediaValues.sourceUrl()
        );
    }

    private MediaValues resolveMediaValues(ResultSet resultSet, String targetType) throws SQLException {
        if ("video".equals(targetType)) {
            return new MediaValues(
                    resolveVideoCoverUrl(resultSet),
                    resolveVideoPosterUrl(resultSet),
                    resolveVideoPreviewUrl(resultSet),
                    resolveVideoSourceUrl(resultSet)
            );
        }

        if ("workflow".equals(targetType)) {
            String coverUrl = resolveMediaUrl(resultSet, "workflow_cover_url");
            return new MediaValues(coverUrl, coverUrl, null, null);
        }

        if ("prompt".equals(targetType)) {
            return new MediaValues(
                    resolvePromptCoverUrl(resultSet),
                    resolvePromptPosterUrl(resultSet),
                    resolvePromptPreviewUrl(resultSet),
                    resolvePromptSourceUrl(resultSet)
            );
        }

        return new MediaValues(null, null, null, null);
    }

    private String resolveMediaUrl(ResultSet resultSet, String columnName) throws SQLException {
        return jdbcMediaUrlResolver.resolve(resultSet, columnName);
    }

    private String resolveFirstAvailableMediaUrl(ResultSet resultSet, String... columnNames) throws SQLException {
        for (String columnName : columnNames) {
            String storedReference = jdbcMediaUrlResolver.nullableTextIfPresent(resultSet, columnName);
            if (storedReference == null) {
                continue;
            }

            String resolvedUrl = jdbcMediaUrlResolver.resolve(resultSet, columnName);
            if (resolvedUrl != null && !resolvedUrl.isBlank()) {
                return resolvedUrl;
            }
        }

        return null;
    }

    private String resolveVideoCoverUrl(ResultSet resultSet) throws SQLException {
        String coverUrl = resolveFirstAvailableMediaUrl(resultSet, "video_cover_url");
        if (coverUrl != null && !coverUrl.isBlank()) {
            return coverUrl;
        }

        String posterUrl = resolveFirstAvailableMediaUrl(resultSet, "video_poster_url");
        return posterUrl != null && !posterUrl.isBlank() ? posterUrl : null;
    }

    private String resolveVideoPosterUrl(ResultSet resultSet) throws SQLException {
        String posterUrl = resolveFirstAvailableMediaUrl(resultSet, "video_poster_url");
        if (posterUrl != null && !posterUrl.isBlank()) {
            return posterUrl;
        }

        return resolveFirstAvailableMediaUrl(resultSet, "video_cover_url");
    }

    private String resolveVideoPreviewUrl(ResultSet resultSet) throws SQLException {
        return resolveFirstAvailableMediaUrl(resultSet, "video_preview_url");
    }

    private String resolveVideoSourceUrl(ResultSet resultSet) throws SQLException {
        return resolveFirstAvailableMediaUrl(resultSet, "video_source_url");
    }

    private String resolvePromptCoverUrl(ResultSet resultSet) throws SQLException {
        String coverUrl = resolveImageMediaUrl(resultSet, "prompt_cover_url", "prompt_cover_asset_kind");
        if (coverUrl != null) {
            return coverUrl;
        }

        String primaryExampleUrl = resolveImageMediaUrl(resultSet, "prompt_primary_example_url", "prompt_primary_example_asset_kind");
        if (primaryExampleUrl != null) {
            return primaryExampleUrl;
        }

        return resolveImageMediaUrl(resultSet, "prompt_example_url", "prompt_example_asset_kind");
    }

    private String resolvePromptPosterUrl(ResultSet resultSet) throws SQLException {
        return resolvePromptCoverUrl(resultSet);
    }

    private String resolvePromptPreviewUrl(ResultSet resultSet) throws SQLException {
        String previewUrl = resolveVideoMediaUrl(resultSet, "prompt_preview_example_url", "prompt_preview_example_asset_kind");
        if (previewUrl != null) {
            return previewUrl;
        }

        String primaryExampleUrl = resolveVideoMediaUrl(resultSet, "prompt_primary_example_url", "prompt_primary_example_asset_kind");
        if (primaryExampleUrl != null) {
            return primaryExampleUrl;
        }

        return resolveVideoMediaUrl(resultSet, "prompt_example_url", "prompt_example_asset_kind");
    }

    private String resolvePromptSourceUrl(ResultSet resultSet) throws SQLException {
        String sourceUrl = resolveVideoMediaUrl(resultSet, "prompt_primary_example_url", "prompt_primary_example_asset_kind");
        if (sourceUrl != null) {
            return sourceUrl;
        }

        String exampleSourceUrl = resolveMediaUrl(resultSet, "prompt_example_url");
        return exampleSourceUrl != null && !exampleSourceUrl.isBlank() ? exampleSourceUrl : null;
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

    private record MediaValues(
            String coverUrl,
            String posterUrl,
            String previewUrl,
            String sourceUrl
    ) {
    }

    private List<AdminModerationItemDetailResponse.RiskSignal> buildRiskSignals(ResultSet resultSet, JsonNode detailJson) throws SQLException {
        List<AdminModerationItemDetailResponse.RiskSignal> signals = new ArrayList<>();
        String riskLevel = nullableText(resultSet, "risk_level");
        String reasonCode = nullableText(resultSet, "reason_code");

        if (reasonCode != null) {
            String tone = riskLevel == null ? "medium" : riskLevel;
            signals.add(new AdminModerationItemDetailResponse.RiskSignal(
                    humanizeCode(reasonCode),
                    tone,
                    "审核记录命中原因码：" + reasonCode
            ));
        }

        if (detailJson != null && detailJson.has("riskTags") && detailJson.get("riskTags").isArray()) {
            ArrayNode tags = (ArrayNode) detailJson.get("riskTags");
            tags.forEach(tag -> {
                String value = tag.asText();
                if (value != null && !value.isBlank()) {
                    String tone = riskLevel == null ? "medium" : riskLevel;
                    signals.add(new AdminModerationItemDetailResponse.RiskSignal(
                            humanizeCode(value),
                            tone,
                            "风控标签：" + value
                    ));
                }
            });
        }

        if (signals.isEmpty()) {
            signals.add(new AdminModerationItemDetailResponse.RiskSignal(
                    "当前未命中额外风控信号",
                    riskLevel == null ? "low" : riskLevel,
                    "当前仅保留基础审核状态。"
            ));
        }

        return List.copyOf(signals);
    }

    private List<String> readTextArray(ResultSet resultSet, String columnName) throws SQLException {
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

    private JsonNode parseJson(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return objectMapper.readTree(value);
        } catch (Exception ex) {
            return null;
        }
    }

    private String normalizeQuery(String query) {
        if (query == null) {
            return null;
        }
        String normalized = query.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private String normalizeTargetType(String targetType) {
        if (targetType == null || targetType.isBlank()) {
            return null;
        }
        String normalized = targetType.trim().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "video", "prompt", "workflow", "post", "image_prompt", "video_prompt" -> normalized;
            default -> throw new IllegalArgumentException("ADMIN_MODERATION_FILTER_INVALID");
        };
    }

    private String normalizeStatus(String status) {
        if (status == null || status.isBlank()) {
            return null;
        }
        String normalized = status.trim().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "pending_review", "in_review", "approved", "rejected", "taken_down" -> normalized;
            default -> throw new IllegalArgumentException("ADMIN_MODERATION_FILTER_INVALID");
        };
    }

    private String nullableText(ResultSet resultSet, String columnName) throws SQLException {
        String value = resultSet.getString(columnName);
        return value == null || value.isBlank() ? null : value;
    }

    private String nullableUuidText(ResultSet resultSet, String columnName) throws SQLException {
        UUID value = (UUID) resultSet.getObject(columnName);
        return value == null ? null : value.toString();
    }

    private String humanizeCode(String code) {
        return code.toLowerCase(Locale.ROOT).replace('_', ' ');
    }

    private String resolveActionLabel(String action) {
        return switch (action) {
            case "approve" -> "审核通过";
            case "reject" -> "审核驳回";
            case "offline" -> "下线";
            case "restore" -> "恢复";
            default -> action;
        };
    }

    private String mergeAuditNote(String action, String note) {
        String defaultNote = switch (action) {
            case "approve" -> "审核已通过";
            case "reject" -> "审核已驳回";
            case "offline" -> "内容已下线";
            case "restore" -> "内容已恢复";
            default -> "审核状态已更新";
        };

        if (note == null || note.isBlank()) {
            return defaultNote;
        }
        return defaultNote + "：" + note.trim();
    }

    private LinkedHashMap<String, String> moderationContext(ManagedTarget target) {
        LinkedHashMap<String, String> context = new LinkedHashMap<>();
        context.put("targetType", target.targetType());
        context.put("targetId", target.targetId().toString());
        return context;
    }

    private record ManagedTarget(
            String targetType,
            UUID targetId,
            UUID authorId,
            UUID workflowId
    ) {
    }
}
