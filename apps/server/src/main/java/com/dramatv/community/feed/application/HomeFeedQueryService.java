package com.dramatv.community.feed.application;

import com.dramatv.community.feed.dto.response.FeaturedArchiveResponse;
import com.dramatv.community.feed.dto.response.FeaturedInventoryResponse;
import com.dramatv.community.feed.dto.response.HomeFeedResponse;
import com.dramatv.community.shared.error.ApiBusinessException;
import com.dramatv.community.shared.persistence.CommunityCatalogJdbcQueryService;
import java.util.Set;
import org.springframework.stereotype.Service;

@Service
public class HomeFeedQueryService {

    private static final Set<String> SUPPORTED_CHANNELS = Set.of("recommend", "hot");

    private final CommunityCatalogJdbcQueryService jdbcQueryService;
    private final FeaturedInventoryQueryService featuredInventoryQueryService;

    public HomeFeedQueryService(
            CommunityCatalogJdbcQueryService jdbcQueryService,
            FeaturedInventoryQueryService featuredInventoryQueryService
    ) {
        this.jdbcQueryService = jdbcQueryService;
        this.featuredInventoryQueryService = featuredInventoryQueryService;
    }

    public HomeFeedResponse loadHomeFeed(String cursor, String channel) {
        if (!SUPPORTED_CHANNELS.contains(channel)) {
            throw ApiBusinessException.badRequest("FEED_CHANNEL_INVALID", "unsupported channel");
        }

        return jdbcQueryService.loadHomeFeed(channel);
    }

    public FeaturedArchiveResponse loadFeaturedArchive(String sort) {
        return jdbcQueryService.loadFeaturedArchive(sort);
    }

    public FeaturedInventoryResponse loadFeaturedInventory(
            String filter,
            String sort,
            String query,
            String modelCategory,
            String contentCategory,
            String workflowType,
            Integer limit,
            String cursor
    ) {
        return featuredInventoryQueryService.loadInventory(
                filter,
                sort,
                query,
                modelCategory,
                contentCategory,
                workflowType,
                limit,
                cursor
        );
    }

    public FeaturedArchiveResponse loadLandingArchive() {
        return jdbcQueryService.loadLandingArchive();
    }
}
