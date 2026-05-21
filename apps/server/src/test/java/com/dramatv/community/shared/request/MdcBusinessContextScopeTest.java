package com.dramatv.community.shared.request;

import java.util.Map;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import static org.assertj.core.api.Assertions.assertThat;

class MdcBusinessContextScopeTest {

    @AfterEach
    void cleanup() {
        MDC.clear();
        RequestContextHolder.resetRequestAttributes();
    }

    @Test
    void pushesBusinessContextIntoRequestAttributesForLaterLogging() {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/reports");
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));

        try (MdcBusinessContextScope ignored = MdcBusinessContextScope.open(Map.of(
                "targetType", "prompt",
                "targetId", "prompt-123",
                "reportId", "report-456"
        ))) {
            assertThat(MDC.get("promptId")).isEqualTo("prompt-123");
            assertThat(MDC.get("reportId")).isEqualTo("report-456");
        }

        assertThat(RequestBusinessContextInterceptor.getRequestContext(request))
                .containsEntry("targetType", "prompt")
                .containsEntry("targetId", "prompt-123")
                .containsEntry("promptId", "prompt-123")
                .containsEntry("reportId", "report-456");
        assertThat(RequestBusinessContextInterceptor.getBizContext(request))
                .isEqualTo("promptId=prompt-123,reportId=report-456,targetType=prompt,targetId=prompt-123");
        assertThat(MDC.get("promptId")).isNull();
        assertThat(MDC.get("reportId")).isNull();
        assertThat(MDC.get("bizContext")).isNull();
    }

    @Test
    void nestedScopeKeepsOuterBusinessContextInMergedBizString() {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/comments");
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));

        try (MdcBusinessContextScope outer = MdcBusinessContextScope.open(Map.of(
                "targetType", "video",
                "targetId", "video-123"
        ))) {
            assertThat(MDC.get("bizContext"))
                    .isEqualTo("videoId=video-123,targetType=video,targetId=video-123");

            try (MdcBusinessContextScope inner = MdcBusinessContextScope.open(Map.of(
                    "commentId", "comment-456"
            ))) {
                assertThat(MDC.get("commentId")).isEqualTo("comment-456");
                assertThat(MDC.get("videoId")).isEqualTo("video-123");
                assertThat(MDC.get("bizContext"))
                        .isEqualTo("videoId=video-123,commentId=comment-456,targetType=video,targetId=video-123");
            }

            assertThat(MDC.get("commentId")).isNull();
            assertThat(MDC.get("bizContext"))
                    .isEqualTo("videoId=video-123,targetType=video,targetId=video-123");
        }

        assertThat(RequestBusinessContextInterceptor.getRequestContext(request))
                .containsEntry("targetType", "video")
                .containsEntry("targetId", "video-123")
                .containsEntry("videoId", "video-123")
                .containsEntry("commentId", "comment-456");
        assertThat(RequestBusinessContextInterceptor.getBizContext(request))
                .isEqualTo("videoId=video-123,commentId=comment-456,targetType=video,targetId=video-123");
        assertThat(MDC.get("videoId")).isNull();
        assertThat(MDC.get("commentId")).isNull();
        assertThat(MDC.get("bizContext")).isNull();
    }
}
