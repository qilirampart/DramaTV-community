package com.dramatv.community.workflow.application;

import com.dramatv.community.shared.persistence.CommunityCatalogJdbcQueryService;
import com.dramatv.community.video.dto.response.VideoSummaryResponse;
import com.dramatv.community.workflow.dto.response.WorkflowDetailResponse;
import com.dramatv.community.workflow.dto.response.WorkflowSummaryResponse;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class WorkflowQueryService {

    private final CommunityCatalogJdbcQueryService jdbcQueryService;

    public WorkflowQueryService(CommunityCatalogJdbcQueryService jdbcQueryService) {
        this.jdbcQueryService = jdbcQueryService;
    }

    public Optional<WorkflowDetailResponse> findDetail(String id) {
        return jdbcQueryService.findWorkflowDetail(id);
    }

    public List<VideoSummaryResponse> relatedVideos(String workflowId) {
        return jdbcQueryService.videosForWorkflow(workflowId);
    }

    public List<WorkflowSummaryResponse> summariesForAuthor(String creatorId) {
        return jdbcQueryService.workflowsForAuthor(creatorId);
    }
}
