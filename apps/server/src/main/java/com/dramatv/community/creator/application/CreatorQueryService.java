package com.dramatv.community.creator.application;

import com.dramatv.community.creator.dto.response.CreatorProfileResponse;
import com.dramatv.community.shared.persistence.CommunityCatalogJdbcQueryService;
import com.dramatv.community.shared.response.CursorPageResponse;
import com.dramatv.community.video.application.VideoQueryService;
import com.dramatv.community.video.dto.response.VideoSummaryResponse;
import com.dramatv.community.workflow.application.WorkflowQueryService;
import com.dramatv.community.workflow.dto.response.WorkflowSummaryResponse;
import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class CreatorQueryService {

    private final VideoQueryService videoQueryService;
    private final WorkflowQueryService workflowQueryService;
    private final CommunityCatalogJdbcQueryService jdbcQueryService;

    public CreatorQueryService(
            VideoQueryService videoQueryService,
            WorkflowQueryService workflowQueryService,
            CommunityCatalogJdbcQueryService jdbcQueryService
    ) {
        this.videoQueryService = videoQueryService;
        this.workflowQueryService = workflowQueryService;
        this.jdbcQueryService = jdbcQueryService;
    }

    public Optional<CreatorProfileResponse> findCreator(String id) {
        return jdbcQueryService.findCreator(id);
    }

    public CursorPageResponse<VideoSummaryResponse> listVideos(String creatorId, String cursor, String sort) {
        return new CursorPageResponse<>(videoQueryService.summariesForAuthor(creatorId), null, false);
    }

    public CursorPageResponse<WorkflowSummaryResponse> listWorkflows(String creatorId, String cursor, String sort) {
        return new CursorPageResponse<>(workflowQueryService.summariesForAuthor(creatorId), null, false);
    }
}
