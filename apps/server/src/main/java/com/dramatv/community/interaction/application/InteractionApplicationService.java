package com.dramatv.community.interaction.application;

import com.dramatv.community.interaction.dto.request.CreateCommentRequest;
import com.dramatv.community.interaction.dto.request.FollowRequest;
import com.dramatv.community.interaction.dto.request.TargetActionRequest;
import com.dramatv.community.interaction.dto.response.ActionStateResponse;
import com.dramatv.community.interaction.dto.response.CommentResponse;
import com.dramatv.community.interaction.persistence.InteractionJdbcPersistenceService;
import com.dramatv.community.shared.response.CursorPageResponse;
import org.springframework.stereotype.Service;

@Service
public class InteractionApplicationService {

    private final InteractionJdbcPersistenceService jdbcPersistenceService;

    public InteractionApplicationService(InteractionJdbcPersistenceService jdbcPersistenceService) {
        this.jdbcPersistenceService = jdbcPersistenceService;
    }

    public CursorPageResponse<CommentResponse> listComments(String targetType, String targetId, String cursor) {
        return jdbcPersistenceService.listComments(targetType, targetId, cursor);
    }

    public CommentResponse createComment(CreateCommentRequest request) {
        return jdbcPersistenceService.createComment(request);
    }

    public ActionStateResponse like(TargetActionRequest request, boolean active) {
        return jdbcPersistenceService.like(request, active);
    }

    public ActionStateResponse favorite(TargetActionRequest request, boolean active) {
        return jdbcPersistenceService.favorite(request, active);
    }

    public ActionStateResponse follow(FollowRequest request, boolean active) {
        return jdbcPersistenceService.follow(request, active);
    }
}
