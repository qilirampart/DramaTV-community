package com.dramatv.community.admin.comments;

import com.dramatv.community.admin.comments.dto.request.AdminCommentTargetSettingsRequest;
import com.dramatv.community.admin.comments.dto.response.AdminCommentListResponse;
import com.dramatv.community.interaction.dto.response.ActionStateResponse;
import com.dramatv.community.interaction.dto.response.CommentTargetSettingsResponse;
import com.dramatv.community.shared.response.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/comments")
public class AdminCommentController {

    private final AdminCommentService adminCommentService;

    public AdminCommentController(AdminCommentService adminCommentService) {
        this.adminCommentService = adminCommentService;
    }

    @GetMapping
    public ApiResponse<AdminCommentListResponse> listComments(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String targetType,
            @RequestParam(required = false) Boolean reportedOnly
    ) {
        return ApiResponse.ok(adminCommentService.listComments(q, status, targetType, reportedOnly));
    }

    @PostMapping("/{commentId}/hide")
    public ApiResponse<ActionStateResponse> hideComment(@PathVariable String commentId) {
        return ApiResponse.ok(adminCommentService.hideComment(commentId));
    }

    @PostMapping("/{commentId}/restore")
    public ApiResponse<ActionStateResponse> restoreComment(@PathVariable String commentId) {
        return ApiResponse.ok(adminCommentService.restoreComment(commentId));
    }

    @DeleteMapping("/{commentId}")
    public ApiResponse<ActionStateResponse> deleteComment(@PathVariable String commentId) {
        return ApiResponse.ok(adminCommentService.deleteComment(commentId));
    }

    @PatchMapping("/targets/{targetType}/{targetId}/settings")
    public ApiResponse<CommentTargetSettingsResponse> updateTargetSettings(
            @PathVariable String targetType,
            @PathVariable String targetId,
            @Valid @RequestBody AdminCommentTargetSettingsRequest request
    ) {
        return ApiResponse.ok(adminCommentService.updateTargetSettings(
                targetType,
                targetId,
                Boolean.TRUE.equals(request.commentsEnabled())
        ));
    }
}
