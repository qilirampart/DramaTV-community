package com.dramatv.community.publish.application;

import com.dramatv.community.creator.application.CreatorQueryService;
import com.dramatv.community.discussion.application.DiscussionQueryService;
import com.dramatv.community.identity.application.CurrentUser;
import com.dramatv.community.identity.application.CurrentUserService;
import com.dramatv.community.publish.dto.response.PostComposerBootstrapResponse;
import com.dramatv.community.publish.dto.response.PostDraftResponse;
import com.dramatv.community.publish.dto.response.PublishPageBootstrapResponse;
import com.dramatv.community.publish.dto.response.VideoDraftResponse;
import com.dramatv.community.publish.dto.response.WorkflowDraftResponse;
import com.dramatv.community.shared.error.ApiBusinessException;
import org.springframework.stereotype.Service;

@Service
public class PublishBootstrapQueryService {

    private final CurrentUserService currentUserService;
    private final VideoDraftApplicationService videoDraftApplicationService;
    private final WorkflowDraftApplicationService workflowDraftApplicationService;
    private final PostDraftApplicationService postDraftApplicationService;
    private final CreatorQueryService creatorQueryService;
    private final DiscussionQueryService discussionQueryService;

    public PublishBootstrapQueryService(
            CurrentUserService currentUserService,
            VideoDraftApplicationService videoDraftApplicationService,
            WorkflowDraftApplicationService workflowDraftApplicationService,
            PostDraftApplicationService postDraftApplicationService,
            CreatorQueryService creatorQueryService,
            DiscussionQueryService discussionQueryService
    ) {
        this.currentUserService = currentUserService;
        this.videoDraftApplicationService = videoDraftApplicationService;
        this.workflowDraftApplicationService = workflowDraftApplicationService;
        this.postDraftApplicationService = postDraftApplicationService;
        this.creatorQueryService = creatorQueryService;
        this.discussionQueryService = discussionQueryService;
    }

    public PublishPageBootstrapResponse loadPublishPageBootstrap(String videoDraftId, String workflowDraftId) {
        CurrentUser currentUser = currentUserService.requireCurrentUser();
        VideoDraftResponse videoDraft = loadVideoDraft(videoDraftId);
        WorkflowDraftResponse workflowDraft = loadWorkflowDraft(workflowDraftId);

        return new PublishPageBootstrapResponse(
                new PublishPageBootstrapResponse.CurrentUser(
                        currentUser.id().toString(),
                        currentUser.displayName(),
                        currentUser.roleCode()
                ),
                videoDraft,
                workflowDraft,
                creatorQueryService.listWorkflows(currentUser.id().toString(), null).items()
        );
    }

    public PostComposerBootstrapResponse loadPostComposerBootstrap(String postDraftId) {
        CurrentUser currentUser = currentUserService.requireCurrentUser();
        PostDraftResponse postDraft = loadPostDraft(postDraftId);
        var discussionHome = discussionQueryService.loadHome(null);

        return new PostComposerBootstrapResponse(
                new PostComposerBootstrapResponse.CurrentUser(
                        currentUser.id().toString(),
                        currentUser.displayName(),
                        currentUser.roleCode()
                ),
                postDraft,
                discussionHome.channels()
        );
    }

    private VideoDraftResponse loadVideoDraft(String draftId) {
        if (draftId == null || draftId.isBlank()) {
            return videoDraftApplicationService.createDraft();
        }

        return videoDraftApplicationService.findDraft(draftId.trim())
                .orElseThrow(() -> ApiBusinessException.notFound("VIDEO_DRAFT_NOT_FOUND", "video draft not found"));
    }

    private WorkflowDraftResponse loadWorkflowDraft(String draftId) {
        if (draftId == null || draftId.isBlank()) {
            return workflowDraftApplicationService.createDraft();
        }

        return workflowDraftApplicationService.findDraft(draftId.trim())
                .orElseThrow(() -> ApiBusinessException.notFound("WORKFLOW_DRAFT_NOT_FOUND", "workflow draft not found"));
    }

    private PostDraftResponse loadPostDraft(String draftId) {
        if (draftId == null || draftId.isBlank()) {
            return postDraftApplicationService.createDraft();
        }

        return postDraftApplicationService.findDraft(draftId.trim())
                .orElseThrow(() -> ApiBusinessException.notFound("POST_DRAFT_NOT_FOUND", "post draft not found"));
    }
}
