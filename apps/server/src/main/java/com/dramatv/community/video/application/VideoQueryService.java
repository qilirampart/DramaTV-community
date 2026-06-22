package com.dramatv.community.video.application;

import com.dramatv.community.shared.persistence.CommunityCatalogJdbcQueryService;
import com.dramatv.community.video.dto.response.VideoDetailResponse;
import com.dramatv.community.video.dto.response.VideoSummaryResponse;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class VideoQueryService {

    private final CommunityCatalogJdbcQueryService jdbcQueryService;

    public VideoQueryService(CommunityCatalogJdbcQueryService jdbcQueryService) {
        this.jdbcQueryService = jdbcQueryService;
    }

    public Optional<VideoDetailResponse> findDetail(String id) {
        return jdbcQueryService.findVideoDetail(id);
    }

    public List<VideoSummaryResponse> relatedVideos(String id) {
        return jdbcQueryService.relatedVideos(id);
    }

    public List<VideoSummaryResponse> summariesForAuthor(String creatorId) {
        return jdbcQueryService.videosForAuthor(creatorId);
    }

    public List<VideoSummaryResponse> summariesForAuthor(String creatorId, int limit, int offset) {
        return jdbcQueryService.videosForAuthor(creatorId, limit, offset);
    }
}
