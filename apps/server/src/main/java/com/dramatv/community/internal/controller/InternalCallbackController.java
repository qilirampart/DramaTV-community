package com.dramatv.community.internal.controller;

import com.dramatv.community.internal.application.InternalCallbackApplicationService;
import com.dramatv.community.internal.dto.request.AuditCallbackRequest;
import com.dramatv.community.internal.dto.request.MediaCallbackRequest;
import com.dramatv.community.internal.dto.request.WorkflowValidateCallbackRequest;
import com.dramatv.community.internal.dto.response.InternalCallbackResponse;
import com.dramatv.community.shared.response.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/internal")
public class InternalCallbackController {

    private final InternalCallbackApplicationService internalCallbackApplicationService;

    public InternalCallbackController(InternalCallbackApplicationService internalCallbackApplicationService) {
        this.internalCallbackApplicationService = internalCallbackApplicationService;
    }

    @PostMapping("/media-callback")
    public ApiResponse<InternalCallbackResponse> mediaCallback(
            @Valid @RequestBody MediaCallbackRequest request
    ) {
        return ApiResponse.ok(internalCallbackApplicationService.mediaCallback(request));
    }

    @PostMapping("/workflow-validate-callback")
    public ApiResponse<InternalCallbackResponse> workflowValidateCallback(
            @Valid @RequestBody WorkflowValidateCallbackRequest request
    ) {
        return ApiResponse.ok(internalCallbackApplicationService.workflowValidateCallback(request));
    }

    @PostMapping("/audit-callback")
    public ApiResponse<InternalCallbackResponse> auditCallback(
            @Valid @RequestBody AuditCallbackRequest request
    ) {
        return ApiResponse.ok(internalCallbackApplicationService.auditCallback(request));
    }
}
