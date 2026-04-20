package com.dramatv.community.feed.application;

import com.dramatv.community.feed.dto.response.HomeFeedResponse;
import com.dramatv.community.shared.error.ApiBusinessException;
import com.dramatv.community.shared.persistence.CommunityCatalogJdbcQueryService;
import java.util.Set;
import org.springframework.stereotype.Service;

@Service
public class HomeFeedQueryService {

    private static final Set<String> SUPPORTED_CHANNELS = Set.of("recommend", "hot");

    private final CommunityCatalogJdbcQueryService jdbcQueryService;

    public HomeFeedQueryService(CommunityCatalogJdbcQueryService jdbcQueryService) {
        this.jdbcQueryService = jdbcQueryService;
    }

    public HomeFeedResponse loadHomeFeed(String cursor, String channel) {
        if (!SUPPORTED_CHANNELS.contains(channel)) {
            throw ApiBusinessException.badRequest("FEED_CHANNEL_INVALID", "unsupported channel");
        }

        return jdbcQueryService.loadHomeFeed(channel);
    }
}
