package com.dramatv.community.internal.application;

import com.dramatv.community.internal.dto.request.AuditCallbackRequest;
import com.dramatv.community.internal.dto.request.MediaCallbackRequest;
import com.dramatv.community.internal.dto.request.WorkflowValidateCallbackRequest;
import com.dramatv.community.internal.dto.response.InternalCallbackResponse;
import com.dramatv.community.publish.persistence.PublishModerationPersistenceService;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;

@Service
public class InternalCallbackApplicationService {

    private final ObjectProvider<PublishModerationPersistenceService> publishModerationPersistenceServiceProvider;

    public InternalCallbackApplicationService(
            ObjectProvider<PublishModerationPersistenceService> publishModerationPersistenceServiceProvider
    ) {
        this.publishModerationPersistenceServiceProvider = publishModerationPersistenceServiceProvider;
    }

    public InternalCallbackResponse mediaCallback(MediaCallbackRequest request) {
        return accepted(request.taskId(), request.statusCode());
    }

    public InternalCallbackResponse workflowValidateCallback(WorkflowValidateCallbackRequest request) {
        return accepted(request.taskId(), request.statusCode());
    }

    public InternalCallbackResponse auditCallback(AuditCallbackRequest request) {
        PublishModerationPersistenceService moderationPersistenceService =
                publishModerationPersistenceServiceProvider.getIfAvailable();
        String effectiveStatus = moderationPersistenceService == null
                ? request.statusCode()
                : moderationPersistenceService.applyAuditCallback(request);
        return accepted(request.taskId(), effectiveStatus);
    }

    private InternalCallbackResponse accepted(String taskId, String statusCode) {
        return new InternalCallbackResponse(
                taskId,
                statusCode,
                OffsetDateTime.now(ZoneOffset.UTC).toString()
        );
    }
}
