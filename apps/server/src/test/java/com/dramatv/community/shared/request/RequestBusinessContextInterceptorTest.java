package com.dramatv.community.shared.request;

import java.util.Map;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.web.servlet.HandlerMapping;

import static org.assertj.core.api.Assertions.assertThat;

class RequestBusinessContextInterceptorTest {

    private final RequestBusinessContextInterceptor interceptor = new RequestBusinessContextInterceptor();

    @AfterEach
    void clearMdc() {
        MDC.clear();
    }

    @Test
    void mapsGenericDraftRouteIdToDraftContext() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/video-drafts/draft-123/submit");
        request.setAttribute(HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE, "/api/video-drafts/{id}/submit");
        request.setAttribute(HandlerMapping.URI_TEMPLATE_VARIABLES_ATTRIBUTE, Map.of("id", "draft-123"));

        interceptor.preHandle(request, new MockHttpServletResponse(), new Object());

        assertThat(MDC.get("draftId")).isEqualTo("draft-123");
        assertThat(MDC.get("bizContext")).isEqualTo("draftId=draft-123");
        assertThat(RequestBusinessContextInterceptor.getRequestContext(request))
                .containsEntry("draftId", "draft-123");

        interceptor.afterCompletion(request, new MockHttpServletResponse(), new Object(), null);

        assertThat(MDC.get("draftId")).isNull();
        assertThat(MDC.get("bizContext")).isNull();
    }

    @Test
    void derivesWorkflowIdFromTargetRouteWithoutOverwritingCurrentUser() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest(
                "POST",
                "/api/admin/moderation/items/workflow/workflow-789/approve"
        );
        request.setAttribute(
                HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE,
                "/api/admin/moderation/items/{targetType}/{targetId}/approve"
        );
        request.setAttribute(
                HandlerMapping.URI_TEMPLATE_VARIABLES_ATTRIBUTE,
                Map.of("targetType", "workflow", "targetId", "workflow-789")
        );
        MDC.put("userId", "viewer-001");

        interceptor.preHandle(request, new MockHttpServletResponse(), new Object());

        assertThat(MDC.get("userId")).isEqualTo("viewer-001");
        assertThat(MDC.get("workflowId")).isEqualTo("workflow-789");
        assertThat(MDC.get("targetType")).isEqualTo("workflow");
        assertThat(MDC.get("targetId")).isEqualTo("workflow-789");
        assertThat(MDC.get("bizContext"))
                .isEqualTo("workflowId=workflow-789,targetType=workflow,targetId=workflow-789");

        interceptor.afterCompletion(request, new MockHttpServletResponse(), new Object(), null);

        assertThat(MDC.get("userId")).isEqualTo("viewer-001");
        assertThat(MDC.get("workflowId")).isNull();
        assertThat(MDC.get("bizContext")).isNull();
    }

    @Test
    void capturesBusinessIdsFromQueryParameters() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/publish/bootstrap");
        request.addParameter("draftId", "draft-query-456");
        request.addParameter("workflowId", "workflow-query-123");

        interceptor.preHandle(request, new MockHttpServletResponse(), new Object());

        assertThat(MDC.get("draftId")).isEqualTo("draft-query-456");
        assertThat(MDC.get("workflowId")).isEqualTo("workflow-query-123");
        assertThat(MDC.get("bizContext"))
                .isEqualTo("workflowId=workflow-query-123,draftId=draft-query-456");
    }
}
