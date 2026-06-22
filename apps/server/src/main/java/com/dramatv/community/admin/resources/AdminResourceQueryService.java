package com.dramatv.community.admin.resources;

import com.dramatv.community.admin.auth.AdminAccessService;
import com.dramatv.community.admin.resources.dto.response.AdminResourceDetailResponse;
import com.dramatv.community.admin.resources.dto.response.AdminResourceListResponse;
import com.dramatv.community.shared.media.JdbcMediaUrlResolver;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import java.sql.Array;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class AdminResourceQueryService {

    private static final String[] READ_ROLES = {"admin", "moderator"};
    private static final int DEFAULT_PAGE = 1;
    private static final int DEFAULT_PAGE_SIZE = 15;
    private static final int MAX_PAGE_SIZE = 100;

    private static final String FILTERED_ROWS_CTE = """
            with base_content as (
                select
                    'video' as target_type,
                    video.id as target_id,
                    video.author_id,
                    video.workflow_id,
                    null::varchar as binding_target_type,
                    null::uuid as binding_target_id,
                    null::varchar as channel_title,
                    video.title,
                    coalesce(video.summary, '') as summary_text,
                    coalesce(video.summary, '') as content_text,
                    video.tag_names,
                    video.publish_status,
                    null::varchar as prompt_modality,
                    coalesce(video.published_at, video.created_at) as published_at,
                    coalesce(video.published_at, video.updated_at, video.created_at) as sort_at,
                    video.cover_asset_id as primary_cover_asset_id,
                    video.poster_asset_id as primary_poster_asset_id,
                    video.preview_asset_id as primary_preview_asset_id,
                    video.source_asset_id as primary_source_asset_id,
                    null::uuid as workflow_cover_asset_id,
                    null::uuid as prompt_cover_asset_id,
                    null::uuid as prompt_primary_example_asset_id
                from videos video
                where video.deleted_at is null
                  and video.publish_status in ('published', 'rejected', 'taken_down')

                union all

                select
                    'workflow' as target_type,
                    workflow.id as target_id,
                    workflow.author_id,
                    null::uuid as workflow_id,
                    null::varchar as binding_target_type,
                    null::uuid as binding_target_id,
                    null::varchar as channel_title,
                    workflow.title,
                    coalesce(workflow.summary, '') as summary_text,
                    coalesce(workflow.summary, '') as content_text,
                    workflow.tag_names,
                    workflow.publish_status,
                    null::varchar as prompt_modality,
                    coalesce(workflow.published_at, workflow.created_at) as published_at,
                    coalesce(workflow.published_at, workflow.updated_at, workflow.created_at) as sort_at,
                    null::uuid as primary_cover_asset_id,
                    null::uuid as primary_poster_asset_id,
                    null::uuid as primary_preview_asset_id,
                    null::uuid as primary_source_asset_id,
                    workflow.cover_asset_id as workflow_cover_asset_id,
                    null::uuid as prompt_cover_asset_id,
                    null::uuid as prompt_primary_example_asset_id
                from workflows workflow
                where workflow.deleted_at is null
                  and workflow.publish_status in ('published', 'rejected', 'taken_down')

                union all

                select
                    'prompt' as target_type,
                    prompt.id as target_id,
                    prompt.author_id,
                    null::uuid as workflow_id,
                    null::varchar as binding_target_type,
                    null::uuid as binding_target_id,
                    null::varchar as channel_title,
                    prompt.title,
                    coalesce(prompt.summary, '') as summary_text,
                    coalesce(prompt.prompt_text_raw, prompt.prompt_text, prompt.summary, '') as content_text,
                    prompt.tag_names,
                    prompt.publish_status,
                    prompt.modality as prompt_modality,
                    coalesce(prompt.published_at, prompt.created_at) as published_at,
                    coalesce(prompt.published_at, prompt.updated_at, prompt.created_at) as sort_at,
                    null::uuid as primary_cover_asset_id,
                    null::uuid as primary_poster_asset_id,
                    null::uuid as primary_preview_asset_id,
                    null::uuid as primary_source_asset_id,
                    null::uuid as workflow_cover_asset_id,
                    prompt.cover_asset_id as prompt_cover_asset_id,
                    prompt.primary_example_asset_id as prompt_primary_example_asset_id
                from prompt_entries prompt
                where prompt.deleted_at is null
                  and prompt.publish_status in ('published', 'rejected', 'taken_down')

                union all

                select
                    'post' as target_type,
                    thread.id as target_id,
                    thread.author_id,
                    null::uuid as workflow_id,
                    thread.binding_target_type,
                    thread.binding_target_id,
                    channel.title as channel_title,
                    thread.title,
                    coalesce(thread.excerpt_text, '') as summary_text,
                    thread.content_text,
                    thread.tag_names,
                    thread.publish_status,
                    null::varchar as prompt_modality,
                    coalesce(thread.published_at, thread.created_at) as published_at,
                    coalesce(thread.published_at, thread.last_activity_at, thread.updated_at, thread.created_at) as sort_at,
                    null::uuid as primary_cover_asset_id,
                    null::uuid as primary_poster_asset_id,
                    null::uuid as primary_preview_asset_id,
                    null::uuid as primary_source_asset_id,
                    null::uuid as workflow_cover_asset_id,
                    null::uuid as prompt_cover_asset_id,
                    null::uuid as prompt_primary_example_asset_id
                from discussion_threads thread
                join discussion_channels channel
                  on channel.id = thread.channel_id
                where thread.deleted_at is null
                  and thread.publish_status in ('published', 'rejected', 'taken_down')
            ),
            resource_rows as (
                select
                    content.target_type,
                    content.target_id,
                    content.author_id,
                    content.workflow_id,
                    content.binding_target_type,
                    content.binding_target_id,
                    content.channel_title,
                    content.title,
                    content.summary_text,
                    content.content_text,
                    content.tag_names,
                    content.publish_status,
                    content.prompt_modality,
                    content.published_at,
                    content.sort_at,
                    creator.username as author_username,
                    creator.display_name as author_display_name,
                    audit.status_code as latest_audit_status_code,
                    audit.risk_level,
                    audit.reason_code,
                    audit.operator_id as reviewer_id,
                    reviewer.display_name as reviewer_display_name,
                    coalesce(cast(audit.detail_json ->> 'adminDecisionAt' as timestamptz), audit.created_at) as reviewed_at,
                    audit.detail_json,
                    primary_cover.storage_provider as primary_cover_storage_provider,
                    primary_cover.bucket_name as primary_cover_bucket_name,
                    primary_cover.object_key as primary_cover_url,
                    primary_poster.storage_provider as primary_poster_storage_provider,
                    primary_poster.bucket_name as primary_poster_bucket_name,
                    primary_poster.object_key as primary_poster_url,
                    primary_preview.storage_provider as primary_preview_storage_provider,
                    primary_preview.bucket_name as primary_preview_bucket_name,
                    primary_preview.object_key as primary_preview_url,
                    primary_source.storage_provider as primary_source_storage_provider,
                    primary_source.bucket_name as primary_source_bucket_name,
                    primary_source.object_key as primary_source_url,
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
                    bound_video_cover.storage_provider as bound_video_cover_storage_provider,
                    bound_video_cover.bucket_name as bound_video_cover_bucket_name,
                    bound_video_cover.object_key as bound_video_cover_url,
                    bound_video_poster.storage_provider as bound_video_poster_storage_provider,
                    bound_video_poster.bucket_name as bound_video_poster_bucket_name,
                    bound_video_poster.object_key as bound_video_poster_url,
                    bound_video_preview.storage_provider as bound_video_preview_storage_provider,
                    bound_video_preview.bucket_name as bound_video_preview_bucket_name,
                    bound_video_preview.object_key as bound_video_preview_url,
                    bound_video_source.storage_provider as bound_video_source_storage_provider,
                    bound_video_source.bucket_name as bound_video_source_bucket_name,
                    bound_video_source.object_key as bound_video_source_url,
                    bound_workflow_cover.storage_provider as bound_workflow_cover_storage_provider,
                    bound_workflow_cover.bucket_name as bound_workflow_cover_bucket_name,
                    bound_workflow_cover.object_key as bound_workflow_cover_url,
                    bound_prompt_cover.storage_provider as bound_prompt_cover_storage_provider,
                    bound_prompt_cover.bucket_name as bound_prompt_cover_bucket_name,
                    bound_prompt_cover.object_key as bound_prompt_cover_url,
                    bound_prompt_cover.asset_kind as bound_prompt_cover_asset_kind,
                    bound_prompt_primary_example.storage_provider as bound_prompt_primary_example_storage_provider,
                    bound_prompt_primary_example.bucket_name as bound_prompt_primary_example_bucket_name,
                    bound_prompt_primary_example.object_key as bound_prompt_primary_example_url,
                    bound_prompt_primary_example.asset_kind as bound_prompt_primary_example_asset_kind,
                    bound_prompt_preview_example.storage_provider as bound_prompt_preview_example_storage_provider,
                    bound_prompt_preview_example.bucket_name as bound_prompt_preview_example_bucket_name,
                    bound_prompt_preview_example.object_key as bound_prompt_preview_example_url,
                    bound_prompt_preview_example.asset_kind as bound_prompt_preview_example_asset_kind,
                    bound_prompt_example.storage_provider as bound_prompt_example_storage_provider,
                    bound_prompt_example.bucket_name as bound_prompt_example_bucket_name,
                    bound_prompt_example.object_key as bound_prompt_example_url,
                    bound_prompt_example.asset_kind as bound_prompt_example_asset_kind
                from base_content content
                left join users creator
                  on creator.id = content.author_id
                left join lateral (
                    select
                        audit_record.status_code,
                        audit_record.risk_level,
                        audit_record.reason_code,
                        audit_record.operator_id,
                        audit_record.created_at,
                        audit_record.detail_json
                    from audit_records audit_record
                    where audit_record.audit_type = 'publish_review'
                      and audit_record.target_type = content.target_type
                      and audit_record.target_id = content.target_id
                    order by audit_record.created_at desc
                    limit 1
                ) audit on true
                left join users reviewer
                  on reviewer.id = audit.operator_id
                left join media_assets primary_cover
                  on primary_cover.id = content.primary_cover_asset_id
                left join media_assets primary_poster
                  on primary_poster.id = content.primary_poster_asset_id
                left join media_assets primary_preview
                  on primary_preview.id = content.primary_preview_asset_id
                left join media_assets primary_source
                  on primary_source.id = content.primary_source_asset_id
                left join media_assets workflow_cover
                  on workflow_cover.id = content.workflow_cover_asset_id
                left join media_assets prompt_cover
                  on prompt_cover.id = content.prompt_cover_asset_id
                left join media_assets prompt_primary_example
                  on prompt_primary_example.id = content.prompt_primary_example_asset_id
                left join media_assets prompt_preview_example
                  on prompt_preview_example.id = (
                      select link.media_asset_id
                      from prompt_example_links link
                      where link.prompt_id = case when content.target_type = 'prompt' then content.target_id else null end
                        and link.role_code = 'preview'
                      order by link.sort_order asc, link.created_at asc
                      limit 1
                  )
                left join media_assets prompt_example
                  on prompt_example.id = (
                      select link.media_asset_id
                      from prompt_example_links link
                      where link.prompt_id = case when content.target_type = 'prompt' then content.target_id else null end
                        and link.role_code = 'example'
                      order by link.sort_order asc, link.created_at asc
                      limit 1
                  )
                left join videos bound_video
                  on content.target_type = 'post'
                 and content.binding_target_type = 'video'
                 and bound_video.id = content.binding_target_id
                left join media_assets bound_video_cover
                  on bound_video_cover.id = bound_video.cover_asset_id
                left join media_assets bound_video_poster
                  on bound_video_poster.id = bound_video.poster_asset_id
                left join media_assets bound_video_preview
                  on bound_video_preview.id = bound_video.preview_asset_id
                left join media_assets bound_video_source
                  on bound_video_source.id = bound_video.source_asset_id
                left join workflows bound_workflow
                  on content.target_type = 'post'
                 and content.binding_target_type = 'workflow'
                 and bound_workflow.id = content.binding_target_id
                left join media_assets bound_workflow_cover
                  on bound_workflow_cover.id = bound_workflow.cover_asset_id
                left join prompt_entries bound_prompt
                  on content.target_type = 'post'
                 and content.binding_target_type = 'prompt'
                 and bound_prompt.id = content.binding_target_id
                left join media_assets bound_prompt_cover
                  on bound_prompt_cover.id = bound_prompt.cover_asset_id
                left join media_assets bound_prompt_primary_example
                  on bound_prompt_primary_example.id = bound_prompt.primary_example_asset_id
                left join media_assets bound_prompt_preview_example
                  on bound_prompt_preview_example.id = (
                      select link.media_asset_id
                      from prompt_example_links link
                      where link.prompt_id = case
                              when content.target_type = 'post' and content.binding_target_type = 'prompt'
                                  then content.binding_target_id
                              else null
                          end
                        and link.role_code = 'preview'
                      order by link.sort_order asc, link.created_at asc
                      limit 1
                  )
                left join media_assets bound_prompt_example
                  on bound_prompt_example.id = (
                      select link.media_asset_id
                      from prompt_example_links link
                      where link.prompt_id = case
                              when content.target_type = 'post' and content.binding_target_type = 'prompt'
                                  then content.binding_target_id
                              else null
                          end
                        and link.role_code = 'example'
                      order by link.sort_order asc, link.created_at asc
                      limit 1
                  )
            ),
            filtered_rows as (
                select
                    resource_rows.*,
                    case
                        when resource_rows.publish_status = 'taken_down' then 'taken_down'
                        when resource_rows.publish_status = 'rejected' then 'rejected'
                        when resource_rows.latest_audit_status_code in ('pending_review', 'in_review') then resource_rows.latest_audit_status_code
                        else 'published'
                    end as governance_status_code
                from resource_rows
                where (
                        cast(? as varchar) is null
                        or resource_rows.author_username ilike ?
                        or resource_rows.author_display_name ilike ?
                        or coalesce(resource_rows.title, '') ilike ?
                    )
                  and (
                        cast(? as varchar) is null
                        or (
                            cast(? as varchar) = 'image_prompt'
                            and resource_rows.target_type = 'prompt'
                            and coalesce(resource_rows.prompt_modality, '') = 'image'
                        )
                        or (
                            cast(? as varchar) = 'video_prompt'
                            and resource_rows.target_type = 'prompt'
                            and coalesce(resource_rows.prompt_modality, '') = 'video'
                        )
                        or (
                            cast(? as varchar) not in ('image_prompt', 'video_prompt')
                            and resource_rows.target_type = cast(? as varchar)
                        )
                    )
                  and (
                        cast(? as varchar) is null
                        or (
                            case
                                when resource_rows.publish_status = 'taken_down' then 'taken_down'
                                when resource_rows.publish_status = 'rejected' then 'rejected'
                                when resource_rows.latest_audit_status_code in ('pending_review', 'in_review') then resource_rows.latest_audit_status_code
                                else 'published'
                            end
                        ) = cast(? as varchar)
                    )
            )
            """;

    private static final String SUMMARY_SQL = FILTERED_ROWS_CTE + """
            select
                count(*) as total_items,
                count(*) filter (where governance_status_code = 'published') as published_items,
                count(*) filter (where governance_status_code in ('pending_review', 'in_review')) as pending_items,
                count(*) filter (where governance_status_code = 'taken_down') as offline_items,
                count(*) filter (where governance_status_code = 'rejected') as rejected_items
            from filtered_rows
            """;

    private static final String COUNT_SQL = FILTERED_ROWS_CTE + """
            select count(*)
            from filtered_rows
            """;

    private static final String ITEMS_SQL = FILTERED_ROWS_CTE + """
            select
                target_type,
                target_id,
                title,
                author_id,
                author_display_name,
                tag_names,
                published_at,
                reviewed_at,
                publish_status,
                governance_status_code,
                latest_audit_status_code,
                risk_level,
                reason_code,
                reviewer_id,
                reviewer_display_name,
                summary_text,
                content_text,
                channel_title,
                binding_target_type,
                binding_target_id,
                prompt_modality,
                detail_json,
                primary_cover_storage_provider,
                primary_cover_bucket_name,
                primary_cover_url,
                primary_poster_storage_provider,
                primary_poster_bucket_name,
                primary_poster_url,
                primary_preview_storage_provider,
                primary_preview_bucket_name,
                primary_preview_url,
                primary_source_storage_provider,
                primary_source_bucket_name,
                primary_source_url,
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
                bound_video_cover_storage_provider,
                bound_video_cover_bucket_name,
                bound_video_cover_url,
                bound_video_poster_storage_provider,
                bound_video_poster_bucket_name,
                bound_video_poster_url,
                bound_video_preview_storage_provider,
                bound_video_preview_bucket_name,
                bound_video_preview_url,
                bound_video_source_storage_provider,
                bound_video_source_bucket_name,
                bound_video_source_url,
                bound_workflow_cover_storage_provider,
                bound_workflow_cover_bucket_name,
                bound_workflow_cover_url,
                bound_prompt_cover_storage_provider,
                bound_prompt_cover_bucket_name,
                bound_prompt_cover_url,
                bound_prompt_cover_asset_kind,
                bound_prompt_primary_example_storage_provider,
                bound_prompt_primary_example_bucket_name,
                bound_prompt_primary_example_url,
                bound_prompt_primary_example_asset_kind,
                bound_prompt_preview_example_storage_provider,
                bound_prompt_preview_example_bucket_name,
                bound_prompt_preview_example_url,
                bound_prompt_preview_example_asset_kind,
                bound_prompt_example_storage_provider,
                bound_prompt_example_bucket_name,
                bound_prompt_example_url,
                bound_prompt_example_asset_kind
            from filtered_rows
            order by
                case
                    when governance_status_code in ('pending_review', 'in_review') then 0
                    when governance_status_code = 'published' then 1
                    when governance_status_code = 'taken_down' then 2
                    else 3
                end,
                sort_at desc,
                target_id desc
            limit ?
            offset ?
            """;

    private static final String DETAIL_SQL = FILTERED_ROWS_CTE + """
            select
                target_type,
                target_id,
                title,
                author_id,
                author_display_name,
                tag_names,
                published_at,
                reviewed_at,
                publish_status,
                governance_status_code,
                latest_audit_status_code,
                risk_level,
                reason_code,
                reviewer_id,
                reviewer_display_name,
                summary_text,
                content_text,
                channel_title,
                binding_target_type,
                binding_target_id,
                prompt_modality,
                detail_json,
                primary_cover_storage_provider,
                primary_cover_bucket_name,
                primary_cover_url,
                primary_poster_storage_provider,
                primary_poster_bucket_name,
                primary_poster_url,
                primary_preview_storage_provider,
                primary_preview_bucket_name,
                primary_preview_url,
                primary_source_storage_provider,
                primary_source_bucket_name,
                primary_source_url,
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
                bound_video_cover_storage_provider,
                bound_video_cover_bucket_name,
                bound_video_cover_url,
                bound_video_poster_storage_provider,
                bound_video_poster_bucket_name,
                bound_video_poster_url,
                bound_video_preview_storage_provider,
                bound_video_preview_bucket_name,
                bound_video_preview_url,
                bound_video_source_storage_provider,
                bound_video_source_bucket_name,
                bound_video_source_url,
                bound_workflow_cover_storage_provider,
                bound_workflow_cover_bucket_name,
                bound_workflow_cover_url,
                bound_prompt_cover_storage_provider,
                bound_prompt_cover_bucket_name,
                bound_prompt_cover_url,
                bound_prompt_cover_asset_kind,
                bound_prompt_primary_example_storage_provider,
                bound_prompt_primary_example_bucket_name,
                bound_prompt_primary_example_url,
                bound_prompt_primary_example_asset_kind,
                bound_prompt_preview_example_storage_provider,
                bound_prompt_preview_example_bucket_name,
                bound_prompt_preview_example_url,
                bound_prompt_preview_example_asset_kind,
                bound_prompt_example_storage_provider,
                bound_prompt_example_bucket_name,
                bound_prompt_example_url,
                bound_prompt_example_asset_kind
            from filtered_rows
            where target_type = ?
              and target_id = ?
            limit 1
            """;

    private final JdbcTemplate jdbcTemplate;
    private final AdminAccessService adminAccessService;
    private final JdbcMediaUrlResolver jdbcMediaUrlResolver;
    private final ObjectMapper objectMapper;

    public AdminResourceQueryService(
            JdbcTemplate jdbcTemplate,
            AdminAccessService adminAccessService,
            JdbcMediaUrlResolver jdbcMediaUrlResolver,
            ObjectMapper objectMapper
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.adminAccessService = adminAccessService;
        this.jdbcMediaUrlResolver = jdbcMediaUrlResolver;
        this.objectMapper = objectMapper;
    }

    public AdminResourceListResponse listResources(String query, String targetType, String status, Integer page, Integer pageSize) {
        adminAccessService.requireAnyRole(READ_ROLES);

        String normalizedQuery = normalizeQuery(query);
        String likeQuery = normalizedQuery == null ? null : "%" + normalizedQuery + "%";
        String normalizedTargetType = normalizeTargetType(targetType);
        String normalizedStatus = normalizeStatus(status);
        int safePage = normalizePage(page);
        int safePageSize = normalizePageSize(pageSize);

        long totalItems = queryMatchedCount(normalizedQuery, likeQuery, normalizedTargetType, normalizedStatus);
        int totalPages = totalItems == 0 ? 1 : (int) Math.ceil((double) totalItems / safePageSize);
        int effectivePage = Math.min(safePage, totalPages);
        int offset = (effectivePage - 1) * safePageSize;

        AdminResourceListResponse.Summary summary = jdbcTemplate.queryForObject(
                SUMMARY_SQL,
                (resultSet, rowNum) -> new AdminResourceListResponse.Summary(
                        resultSet.getLong("total_items"),
                        resultSet.getLong("published_items"),
                        resultSet.getLong("pending_items"),
                        resultSet.getLong("offline_items"),
                        resultSet.getLong("rejected_items")
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

        List<AdminResourceListResponse.Item> items = jdbcTemplate.query(
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

        return new AdminResourceListResponse(
                summary == null ? new AdminResourceListResponse.Summary(0, 0, 0, 0, 0) : summary,
                new AdminResourceListResponse.Pagination(
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

    public AdminResourceDetailResponse getResource(String targetType, String targetId) {
        adminAccessService.requireAnyRole(READ_ROLES);

        String normalizedTargetType = normalizeConcreteTargetType(targetType);
        UUID parsedTargetId = parseTargetId(targetId);
        AdminResourceDetailResponse detail = jdbcTemplate.query(
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
                normalizedTargetType,
                parsedTargetId
        );

        if (detail == null) {
            throw new IllegalArgumentException("ADMIN_RESOURCE_NOT_FOUND");
        }

        return detail;
    }

    private long queryMatchedCount(String normalizedQuery, String likeQuery, String normalizedTargetType, String normalizedStatus) {
        Long count = jdbcTemplate.queryForObject(
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
        return count == null ? 0L : count;
    }

    private AdminResourceListResponse.Item mapListItem(ResultSet resultSet) throws SQLException {
        String targetType = resultSet.getString("target_type");
        return new AdminResourceListResponse.Item(
                targetType,
                resultSet.getObject("target_id", UUID.class).toString(),
                resultSet.getString("title"),
                nullableUuidText(resultSet, "author_id"),
                resultSet.getString("author_display_name"),
                readTextArray(resultSet, "tag_names"),
                resultSet.getObject("published_at", OffsetDateTime.class),
                resultSet.getObject("reviewed_at", OffsetDateTime.class),
                resultSet.getString("publish_status"),
                resultSet.getString("governance_status_code"),
                nullableText(resultSet, "latest_audit_status_code"),
                nullableText(resultSet, "risk_level"),
                nullableUuidText(resultSet, "reviewer_id"),
                nullableText(resultSet, "reviewer_display_name"),
                nullableText(resultSet, "summary_text"),
                nullableText(resultSet, "channel_title"),
                nullableText(resultSet, "binding_target_type"),
                nullableUuidText(resultSet, "binding_target_id"),
                nullableText(resultSet, "prompt_modality"),
                buildListMedia(resultSet, targetType),
                buildModelTags(resultSet)
        );
    }

    private AdminResourceDetailResponse mapDetailItem(ResultSet resultSet) throws SQLException {
        String targetType = resultSet.getString("target_type");
        JsonNode detailJson = parseJson(nullableText(resultSet, "detail_json"));
        return new AdminResourceDetailResponse(
                targetType,
                resultSet.getObject("target_id", UUID.class).toString(),
                resultSet.getString("title"),
                nullableUuidText(resultSet, "author_id"),
                resultSet.getString("author_display_name"),
                readTextArray(resultSet, "tag_names"),
                resultSet.getObject("published_at", OffsetDateTime.class),
                resultSet.getObject("reviewed_at", OffsetDateTime.class),
                resultSet.getString("publish_status"),
                resultSet.getString("governance_status_code"),
                nullableText(resultSet, "latest_audit_status_code"),
                nullableText(resultSet, "risk_level"),
                nullableUuidText(resultSet, "reviewer_id"),
                nullableText(resultSet, "reviewer_display_name"),
                nullableText(resultSet, "summary_text"),
                nullableText(resultSet, "content_text"),
                nullableText(resultSet, "channel_title"),
                nullableText(resultSet, "binding_target_type"),
                nullableUuidText(resultSet, "binding_target_id"),
                nullableText(resultSet, "prompt_modality"),
                buildDetailMedia(resultSet, targetType),
                buildModelTags(resultSet),
                buildRiskSignals(resultSet, detailJson)
        );
    }

    private AdminResourceListResponse.Media buildListMedia(ResultSet resultSet, String targetType) throws SQLException {
        MediaValues mediaValues = resolveMediaValues(resultSet, targetType);
        return new AdminResourceListResponse.Media(
                mediaValues.coverUrl(),
                mediaValues.posterUrl(),
                mediaValues.previewUrl(),
                mediaValues.sourceUrl()
        );
    }

    private AdminResourceDetailResponse.Media buildDetailMedia(ResultSet resultSet, String targetType) throws SQLException {
        MediaValues mediaValues = resolveMediaValues(resultSet, targetType);
        return new AdminResourceDetailResponse.Media(
                mediaValues.coverUrl(),
                mediaValues.posterUrl(),
                mediaValues.previewUrl(),
                mediaValues.sourceUrl()
        );
    }

    private MediaValues resolveMediaValues(ResultSet resultSet, String targetType) throws SQLException {
        if ("video".equals(targetType)) {
            return new MediaValues(
                    resolveVideoCoverUrl(resultSet, "primary_cover_url", "primary_poster_url"),
                    resolveVideoPosterUrl(resultSet, "primary_poster_url", "primary_cover_url"),
                    resolveFirstAvailableMediaUrl(resultSet, "primary_preview_url"),
                    resolveFirstAvailableMediaUrl(resultSet, "primary_source_url")
            );
        }

        if ("workflow".equals(targetType)) {
            String coverUrl = resolveMediaUrl(resultSet, "workflow_cover_url");
            return new MediaValues(coverUrl, coverUrl, null, null);
        }

        if ("prompt".equals(targetType)) {
            return new MediaValues(
                    resolvePromptCoverUrl(resultSet, "", false),
                    resolvePromptCoverUrl(resultSet, "", false),
                    resolvePromptPreviewUrl(resultSet, "", false),
                    resolvePromptSourceUrl(resultSet, "", false)
            );
        }

        if ("post".equals(targetType)) {
            String bindingTargetType = nullableText(resultSet, "binding_target_type");
            if ("video".equals(bindingTargetType)) {
                return new MediaValues(
                        resolveVideoCoverUrl(resultSet, "bound_video_cover_url", "bound_video_poster_url"),
                        resolveVideoPosterUrl(resultSet, "bound_video_poster_url", "bound_video_cover_url"),
                        resolveFirstAvailableMediaUrl(resultSet, "bound_video_preview_url"),
                        resolveFirstAvailableMediaUrl(resultSet, "bound_video_source_url")
                );
            }
            if ("workflow".equals(bindingTargetType)) {
                String coverUrl = resolveMediaUrl(resultSet, "bound_workflow_cover_url");
                return new MediaValues(coverUrl, coverUrl, null, null);
            }
            if ("prompt".equals(bindingTargetType)) {
                return new MediaValues(
                        resolvePromptCoverUrl(resultSet, "bound_", true),
                        resolvePromptCoverUrl(resultSet, "bound_", true),
                        resolvePromptPreviewUrl(resultSet, "bound_", true),
                        resolvePromptSourceUrl(resultSet, "bound_", true)
                );
            }
        }

        return new MediaValues(null, null, null, null);
    }

    private String resolveVideoCoverUrl(ResultSet resultSet, String coverColumn, String posterColumn) throws SQLException {
        String coverUrl = resolveFirstAvailableMediaUrl(resultSet, coverColumn);
        if (coverUrl != null && !coverUrl.isBlank()) {
            return coverUrl;
        }
        String posterUrl = resolveFirstAvailableMediaUrl(resultSet, posterColumn);
        return posterUrl != null && !posterUrl.isBlank() ? posterUrl : null;
    }

    private String resolveVideoPosterUrl(ResultSet resultSet, String posterColumn, String coverColumn) throws SQLException {
        String posterUrl = resolveFirstAvailableMediaUrl(resultSet, posterColumn);
        if (posterUrl != null && !posterUrl.isBlank()) {
            return posterUrl;
        }
        return resolveFirstAvailableMediaUrl(resultSet, coverColumn);
    }

    private String resolvePromptCoverUrl(ResultSet resultSet, String prefix, boolean boundPrompt) throws SQLException {
        String coverUrl = resolveImageMediaUrl(resultSet, prefix + "prompt_cover_url", prefix + "prompt_cover_asset_kind");
        if (coverUrl != null) {
            return coverUrl;
        }

        String primaryExampleUrl = resolveImageMediaUrl(
                resultSet,
                prefix + "prompt_primary_example_url",
                prefix + "prompt_primary_example_asset_kind"
        );
        if (primaryExampleUrl != null) {
            return primaryExampleUrl;
        }

        return resolveImageMediaUrl(resultSet, prefix + "prompt_example_url", prefix + "prompt_example_asset_kind");
    }

    private String resolvePromptPreviewUrl(ResultSet resultSet, String prefix, boolean boundPrompt) throws SQLException {
        String previewUrl = resolveVideoMediaUrl(
                resultSet,
                prefix + "prompt_preview_example_url",
                prefix + "prompt_preview_example_asset_kind"
        );
        if (previewUrl != null) {
            return previewUrl;
        }

        String primaryExampleUrl = resolveVideoMediaUrl(
                resultSet,
                prefix + "prompt_primary_example_url",
                prefix + "prompt_primary_example_asset_kind"
        );
        if (primaryExampleUrl != null) {
            return primaryExampleUrl;
        }

        return resolveVideoMediaUrl(resultSet, prefix + "prompt_example_url", prefix + "prompt_example_asset_kind");
    }

    private String resolvePromptSourceUrl(ResultSet resultSet, String prefix, boolean boundPrompt) throws SQLException {
        String sourceUrl = resolveVideoMediaUrl(
                resultSet,
                prefix + "prompt_primary_example_url",
                prefix + "prompt_primary_example_asset_kind"
        );
        if (sourceUrl != null) {
            return sourceUrl;
        }

        String exampleSourceUrl = resolveMediaUrl(resultSet, prefix + "prompt_example_url");
        return exampleSourceUrl != null && !exampleSourceUrl.isBlank() ? exampleSourceUrl : null;
    }

    private List<String> buildModelTags(ResultSet resultSet) throws SQLException {
        String promptModality = nullableText(resultSet, "prompt_modality");
        List<String> modelTags = new ArrayList<>();
        if (promptModality != null) {
            modelTags.add("video".equals(promptModality) ? "视频提示词" : "图片提示词");
        }
        return List.copyOf(modelTags);
    }

    private List<AdminResourceDetailResponse.RiskSignal> buildRiskSignals(ResultSet resultSet, JsonNode detailJson) throws SQLException {
        List<AdminResourceDetailResponse.RiskSignal> signals = new ArrayList<>();
        String riskLevel = nullableText(resultSet, "risk_level");
        String reasonCode = nullableText(resultSet, "reason_code");

        if (reasonCode != null) {
            String tone = riskLevel == null ? "medium" : riskLevel;
            signals.add(new AdminResourceDetailResponse.RiskSignal(
                    humanizeCode(reasonCode),
                    tone,
                    "资源治理命中原因码：" + reasonCode
            ));
        }

        if (detailJson != null && detailJson.has("riskTags") && detailJson.get("riskTags").isArray()) {
            ArrayNode tags = (ArrayNode) detailJson.get("riskTags");
            tags.forEach(tag -> {
                String value = tag.asText();
                if (value != null && !value.isBlank()) {
                    String tone = riskLevel == null ? "medium" : riskLevel;
                    signals.add(new AdminResourceDetailResponse.RiskSignal(
                            humanizeCode(value),
                            tone,
                            "风控标签：" + value
                    ));
                }
            });
        }

        if (signals.isEmpty()) {
            signals.add(new AdminResourceDetailResponse.RiskSignal(
                    "当前未命中额外风控信号",
                    riskLevel == null ? "low" : riskLevel,
                    "当前仅展示基础发布状态和最近一次治理记录。"
            ));
        }

        return List.copyOf(signals);
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

    private UUID parseTargetId(String targetId) {
        try {
            return UUID.fromString(targetId);
        } catch (Exception ex) {
            throw new IllegalArgumentException("ADMIN_RESOURCE_NOT_FOUND");
        }
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
            default -> throw new IllegalArgumentException("ADMIN_RESOURCE_FILTER_INVALID");
        };
    }

    private String normalizeConcreteTargetType(String targetType) {
        String normalized = normalizeTargetType(targetType);
        if (normalized == null || "image_prompt".equals(normalized) || "video_prompt".equals(normalized)) {
            throw new IllegalArgumentException("ADMIN_RESOURCE_NOT_FOUND");
        }
        return normalized;
    }

    private String normalizeStatus(String status) {
        if (status == null || status.isBlank()) {
            return null;
        }
        String normalized = status.trim().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "published", "pending_review", "in_review", "rejected", "taken_down" -> normalized;
            default -> throw new IllegalArgumentException("ADMIN_RESOURCE_FILTER_INVALID");
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

    private record MediaValues(
            String coverUrl,
            String posterUrl,
            String previewUrl,
            String sourceUrl
    ) {
    }
}
