package com.dramatv.community.publish.application;

import com.dramatv.community.identity.application.CurrentUser;
import com.dramatv.community.identity.application.CurrentUserService;
import com.dramatv.community.publish.dto.request.CreateReportRequest;
import com.dramatv.community.publish.dto.response.ReportResponse;
import com.dramatv.community.shared.error.ApiBusinessException;
import com.dramatv.community.shared.request.MdcBusinessContextScope;
import com.dramatv.community.shared.security.ActionRateLimiter;
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
public class ReportApplicationService {

    private static final Logger log = LoggerFactory.getLogger(ReportApplicationService.class);
    private static final Set<String> SUPPORTED_TARGET_TYPES = Set.of("video", "workflow", "prompt", "post");
    private static final Set<String> SUPPORTED_REASON_CODES = Set.of(
            "pornographic",
            "political",
            "spam",
            "abuse",
            "copyright",
            "misleading",
            "other"
    );

    private final JdbcTemplate jdbcTemplate;
    private final CurrentUserService currentUserService;
    private final ActionRateLimiter actionRateLimiter;

    public ReportApplicationService(
            JdbcTemplate jdbcTemplate,
            CurrentUserService currentUserService,
            ActionRateLimiter actionRateLimiter
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.currentUserService = currentUserService;
        this.actionRateLimiter = actionRateLimiter;
    }

    @Transactional
    public ReportResponse createReport(CreateReportRequest request) {
        CurrentUser currentUser = currentUserService.requireCurrentUser();
        actionRateLimiter.checkReport(currentUser.id(), currentUser.roleCode());
        String targetType = normalizeTargetType(request.targetType());
        UUID targetId = parseUuid(request.targetId());
        String reasonCode = normalizeReasonCode(request.reasonCode());
        String descriptionText = normalizeDescriptionText(request.descriptionText());

        try (MdcBusinessContextScope ignored = MdcBusinessContextScope.open(Map.of(
                "targetType", targetType,
                "targetId", targetId.toString()
        ))) {
            validateTargetExists(targetType, targetId);
            ensureNoOpenDuplicate(currentUser.id(), targetType, targetId);

            UUID reportId = UUID.randomUUID();
            try (MdcBusinessContextScope reportContext = MdcBusinessContextScope.open(Map.of(
                    "reportId", reportId.toString(),
                    "targetType", targetType,
                    "targetId", targetId.toString()
            ))) {
                jdbcTemplate.update("""
                        insert into report_tickets (
                            id,
                            reporter_id,
                            target_type,
                            target_id,
                            reason_code,
                            description_text,
                            status_code,
                            created_at,
                            updated_at
                        )
                        values (?, ?, ?, ?, ?, ?, 'pending', now(), now())
                        """,
                        reportId,
                        currentUser.id(),
                        targetType,
                        targetId,
                        reasonCode,
                        descriptionText
                );

                log.info(
                        "report created: reporterId={} reportId={} targetType={} targetId={} reasonCode={} hasDescription={}",
                        currentUser.id(),
                        reportId,
                        targetType,
                        targetId,
                        reasonCode,
                        descriptionText != null
                );

                return new ReportResponse(
                        reportId.toString(),
                        targetType,
                        targetId.toString(),
                        reasonCode,
                        "pending"
                );
            }
        }
    }

    private void ensureNoOpenDuplicate(UUID reporterId, String targetType, UUID targetId) {
        Boolean exists = jdbcTemplate.queryForObject("""
                        select exists(
                            select 1
                            from report_tickets
                            where reporter_id = ?
                              and target_type = ?
                              and target_id = ?
                              and status_code in ('pending', 'processing')
                        )
                        """,
                Boolean.class,
                reporterId,
                targetType,
                targetId
        );

        if (Boolean.TRUE.equals(exists)) {
            log.warn(
                    "report create rejected: duplicate open ticket, reporterId={} targetType={} targetId={}",
                    reporterId,
                    targetType,
                    targetId
            );
            throw ApiBusinessException.conflict("REPORT_DUPLICATE", "report already exists");
        }
    }

    private void validateTargetExists(String targetType, UUID targetId) {
        String tableName = switch (targetType) {
            case "video" -> "videos";
            case "workflow" -> "workflows";
            case "prompt" -> "prompt_entries";
            case "post" -> "discussion_threads";
            default -> throw ApiBusinessException.badRequest("REPORT_TARGET_TYPE_INVALID", "report target type is invalid");
        };

        Boolean exists = jdbcTemplate.queryForObject(
                "select exists(select 1 from " + tableName + " where id = ? and deleted_at is null)",
                Boolean.class,
                targetId
        );
        if (!Boolean.TRUE.equals(exists)) {
            log.warn(
                    "report create rejected: target not found, targetType={} targetId={}",
                    targetType,
                    targetId
            );
            throw ApiBusinessException.notFound("REPORT_TARGET_NOT_FOUND", "report target does not exist");
        }
    }

    private String normalizeTargetType(String value) {
        String normalized = normalizeCodeText(value);
        if (normalized == null || !SUPPORTED_TARGET_TYPES.contains(normalized)) {
            throw ApiBusinessException.badRequest("REPORT_TARGET_TYPE_INVALID", "report target type is invalid");
        }
        return normalized;
    }

    private String normalizeReasonCode(String value) {
        String normalized = normalizeCodeText(value);
        if (normalized == null || !SUPPORTED_REASON_CODES.contains(normalized)) {
            throw ApiBusinessException.badRequest("REPORT_REASON_INVALID", "report reason is invalid");
        }
        return normalized;
    }

    private UUID parseUuid(String value) {
        String normalized = normalizeOptionalText(value);
        if (normalized == null) {
            throw ApiBusinessException.badRequest("REPORT_TARGET_ID_INVALID", "report target id is invalid");
        }

        try {
            return UUID.fromString(normalized);
        } catch (IllegalArgumentException exception) {
            throw ApiBusinessException.badRequest("REPORT_TARGET_ID_INVALID", "report target id is invalid");
        }
    }

    private String normalizeOptionalText(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private String normalizeCodeText(String value) {
        String normalized = normalizeOptionalText(value);
        return normalized == null ? null : normalized.toLowerCase(Locale.ROOT);
    }

    private String normalizeDescriptionText(String value) {
        String normalized = normalizeOptionalText(value);
        return normalized == null ? null : normalized;
    }
}
