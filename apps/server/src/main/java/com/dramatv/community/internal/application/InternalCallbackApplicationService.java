package com.dramatv.community.internal.application;

import com.dramatv.community.internal.dto.request.AuditCallbackRequest;
import com.dramatv.community.internal.dto.request.MediaCallbackRequest;
import com.dramatv.community.internal.dto.request.WorkflowValidateCallbackRequest;
import com.dramatv.community.internal.dto.response.InternalCallbackResponse;
import com.dramatv.community.publish.persistence.PublishModerationPersistenceService;
import com.dramatv.community.shared.request.MdcBusinessContextScope;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.LinkedHashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;

@Service
public class InternalCallbackApplicationService {

    private static final Logger log = LoggerFactory.getLogger(InternalCallbackApplicationService.class);

    private final ObjectProvider<PublishModerationPersistenceService> publishModerationPersistenceServiceProvider;

    public InternalCallbackApplicationService(
            ObjectProvider<PublishModerationPersistenceService> publishModerationPersistenceServiceProvider
    ) {
        this.publishModerationPersistenceServiceProvider = publishModerationPersistenceServiceProvider;
    }

    public InternalCallbackResponse mediaCallback(MediaCallbackRequest request) {
        try (MdcBusinessContextScope ignored = MdcBusinessContextScope.open(mediaCallbackContext(request))) {
            PublishModerationPersistenceService moderationPersistenceService =
                    publishModerationPersistenceServiceProvider.getIfAvailable();
            String effectiveStatus = moderationPersistenceService == null
                    ? request.statusCode()
                    : moderationPersistenceService.applyMediaCallback(request);
            log.info(
                    "internal callback accepted: callbackType=media taskId={} targetType={} targetId={} requestStatus={} effectiveStatus={} hasResult={}",
                    request.taskId(),
                    request.targetType(),
                    request.targetId(),
                    request.statusCode(),
                    effectiveStatus,
                    request.result() != null
            );
            return accepted(request.taskId(), effectiveStatus);
        }
    }

    public InternalCallbackResponse workflowValidateCallback(WorkflowValidateCallbackRequest request) {
        try (MdcBusinessContextScope ignored = MdcBusinessContextScope.open(workflowValidateContext(request))) {
            log.info(
                    "internal callback accepted: callbackType=workflow_validate taskId={} draftId={} status={} warningCount={}",
                    request.taskId(),
                    request.workflowDraftId(),
                    request.statusCode(),
                    request.warnings() == null ? 0 : request.warnings().size()
            );
            return accepted(request.taskId(), request.statusCode());
        }
    }

    public InternalCallbackResponse auditCallback(AuditCallbackRequest request) {
        try (MdcBusinessContextScope ignored = MdcBusinessContextScope.open(auditCallbackContext(request))) {
            PublishModerationPersistenceService moderationPersistenceService =
                    publishModerationPersistenceServiceProvider.getIfAvailable();
            String effectiveStatus = moderationPersistenceService == null
                    ? request.statusCode()
                    : moderationPersistenceService.applyAuditCallback(request);
            log.info(
                    "internal callback accepted: callbackType=audit taskId={} targetType={} targetId={} requestStatus={} effectiveStatus={} riskTagCount={}",
                    request.taskId(),
                    request.targetType(),
                    request.targetId(),
                    request.statusCode(),
                    effectiveStatus,
                    request.riskTags() == null ? 0 : request.riskTags().size()
            );
            return accepted(request.taskId(), effectiveStatus);
        }
    }

    private InternalCallbackResponse accepted(String taskId, String statusCode) {
        return new InternalCallbackResponse(
                taskId,
                statusCode,
                OffsetDateTime.now(ZoneOffset.UTC).toString()
        );
    }

    private Map<String, String> mediaCallbackContext(MediaCallbackRequest request) {
        LinkedHashMap<String, String> context = new LinkedHashMap<>();
        context.put("taskId", request.taskId());
        context.put("targetType", request.targetType());
        context.put("targetId", request.targetId());
        return context;
    }

    private Map<String, String> auditCallbackContext(AuditCallbackRequest request) {
        LinkedHashMap<String, String> context = new LinkedHashMap<>();
        context.put("taskId", request.taskId());
        context.put("targetType", request.targetType());
        context.put("targetId", request.targetId());
        return context;
    }

    private Map<String, String> workflowValidateContext(WorkflowValidateCallbackRequest request) {
        LinkedHashMap<String, String> context = new LinkedHashMap<>();
        context.put("taskId", request.taskId());
        context.put("draftId", request.workflowDraftId());
        return context;
    }
}
