package com.dramatv.community.creator.application;

import com.dramatv.community.creator.dto.response.CreatorProfileResponse;
import com.dramatv.community.creator.dto.response.CreatorWorkSummaryResponse;
import com.dramatv.community.discussion.application.DiscussionQueryService;
import com.dramatv.community.discussion.dto.response.DiscussionHomeResponse;
import com.dramatv.community.prompt.application.PromptQueryService;
import com.dramatv.community.prompt.dto.response.PromptSummaryResponse;
import com.dramatv.community.shared.persistence.CommunityCatalogJdbcQueryService;
import com.dramatv.community.shared.response.CursorPageResponse;
import com.dramatv.community.video.application.VideoQueryService;
import com.dramatv.community.video.dto.response.VideoSummaryResponse;
import com.dramatv.community.workflow.application.WorkflowQueryService;
import com.dramatv.community.workflow.dto.response.WorkflowSummaryResponse;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class CreatorQueryService {

    private static final int CREATOR_PAGE_DEFAULT_LIMIT = 24;
    private static final String LEGACY_OFFSET_CURSOR_PREFIX = "offset:";
    private static final String OPAQUE_OFFSET_CURSOR_PREFIX = "creator-offset:";

    private final VideoQueryService videoQueryService;
    private final PromptQueryService promptQueryService;
    private final WorkflowQueryService workflowQueryService;
    private final DiscussionQueryService discussionQueryService;
    private final CommunityCatalogJdbcQueryService jdbcQueryService;

    public CreatorQueryService(
            VideoQueryService videoQueryService,
            PromptQueryService promptQueryService,
            WorkflowQueryService workflowQueryService,
            DiscussionQueryService discussionQueryService,
            CommunityCatalogJdbcQueryService jdbcQueryService
    ) {
        this.videoQueryService = videoQueryService;
        this.promptQueryService = promptQueryService;
        this.workflowQueryService = workflowQueryService;
        this.discussionQueryService = discussionQueryService;
        this.jdbcQueryService = jdbcQueryService;
    }

    public Optional<CreatorProfileResponse> findCreator(String id) {
        return jdbcQueryService.findCreator(id);
    }

    public CursorPageResponse<VideoSummaryResponse> listVideos(String creatorId, String cursor) {
        int offset = parseOffset(cursor);
        return paginate(videoQueryService.summariesForAuthor(creatorId, CREATOR_PAGE_DEFAULT_LIMIT + 1, offset), offset);
    }

    public CursorPageResponse<CreatorWorkSummaryResponse> listWorks(String creatorId, String cursor) {
        int offset = parseOffset(cursor);
        return paginate(jdbcQueryService.worksForAuthor(creatorId, CREATOR_PAGE_DEFAULT_LIMIT + 1, offset), offset);
    }

    public CursorPageResponse<PromptSummaryResponse> listPrompts(String creatorId, String cursor) {
        int offset = parseOffset(cursor);
        return paginate(promptQueryService.summariesForAuthor(creatorId, CREATOR_PAGE_DEFAULT_LIMIT + 1, offset), offset);
    }

    public CursorPageResponse<WorkflowSummaryResponse> listWorkflows(String creatorId, String cursor) {
        int offset = parseOffset(cursor);
        return paginate(workflowQueryService.summariesForAuthor(creatorId, CREATOR_PAGE_DEFAULT_LIMIT + 1, offset), offset);
    }

    public CursorPageResponse<DiscussionHomeResponse.ThreadCard> listPosts(String creatorId, String cursor) {
        int offset = parseOffset(cursor);
        return paginate(discussionQueryService.listThreadsForAuthor(creatorId, CREATOR_PAGE_DEFAULT_LIMIT + 1, offset), offset);
    }

    private <T> CursorPageResponse<T> paginate(List<T> items, int offset) {
        if (items.size() <= CREATOR_PAGE_DEFAULT_LIMIT) {
            return new CursorPageResponse<>(items, null, false);
        }

        return new CursorPageResponse<>(
                items.subList(0, CREATOR_PAGE_DEFAULT_LIMIT),
                buildOffsetCursor(offset + CREATOR_PAGE_DEFAULT_LIMIT),
                true
        );
    }

    private int parseOffset(String cursor) {
        if (cursor == null || cursor.isBlank()) {
            return 0;
        }

        String normalizedCursor = cursor.trim();
        if (normalizedCursor.startsWith(LEGACY_OFFSET_CURSOR_PREFIX)) {
            return parseNonNegativeOffset(normalizedCursor.substring(LEGACY_OFFSET_CURSOR_PREFIX.length()));
        }

        try {
            String decodedCursor = new String(Base64.getUrlDecoder().decode(normalizedCursor), StandardCharsets.UTF_8);
            if (!decodedCursor.startsWith(OPAQUE_OFFSET_CURSOR_PREFIX)) {
                return 0;
            }
            return parseNonNegativeOffset(decodedCursor.substring(OPAQUE_OFFSET_CURSOR_PREFIX.length()));
        } catch (IllegalArgumentException ignored) {
            return 0;
        }
    }

    private String buildOffsetCursor(int offset) {
        String payload = OPAQUE_OFFSET_CURSOR_PREFIX + Math.max(offset, 0);
        return Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(payload.getBytes(StandardCharsets.UTF_8));
    }

    private int parseNonNegativeOffset(String rawOffset) {
        try {
            int offset = Integer.parseInt(rawOffset);
            return Math.max(offset, 0);
        } catch (NumberFormatException ignored) {
            return 0;
        }
    }
}
