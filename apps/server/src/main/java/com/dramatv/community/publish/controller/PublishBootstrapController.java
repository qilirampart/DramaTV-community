package com.dramatv.community.publish.controller;

import com.dramatv.community.publish.application.PublishBootstrapQueryService;
import com.dramatv.community.publish.dto.response.PostComposerBootstrapResponse;
import com.dramatv.community.publish.dto.response.PublishPageBootstrapResponse;
import com.dramatv.community.shared.response.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class PublishBootstrapController {

    private final PublishBootstrapQueryService publishBootstrapQueryService;

    public PublishBootstrapController(PublishBootstrapQueryService publishBootstrapQueryService) {
        this.publishBootstrapQueryService = publishBootstrapQueryService;
    }

    @GetMapping("/api/publish/bootstrap")
    public ApiResponse<PublishPageBootstrapResponse> publishBootstrap(
            @RequestParam(required = false) String videoDraftId,
            @RequestParam(required = false) String workflowDraftId
    ) {
        return ApiResponse.ok(publishBootstrapQueryService.loadPublishPageBootstrap(videoDraftId, workflowDraftId));
    }

    @GetMapping("/api/discussions/composer-bootstrap")
    public ApiResponse<PostComposerBootstrapResponse> discussionComposerBootstrap(
            @RequestParam(required = false) String postDraftId
    ) {
        return ApiResponse.ok(publishBootstrapQueryService.loadPostComposerBootstrap(postDraftId));
    }
}
