package com.dramatv.community.shared.request;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import java.util.Map;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.assertj.core.api.Assertions.assertThat;

class AccessLogFilterTest {

    @Test
    void accessLogRestoresBusinessContextIntoMdc() throws Exception {
        Logger logger = (Logger) LoggerFactory.getLogger("com.dramatv.community.access");
        ListAppender<ILoggingEvent> appender = new ListAppender<>();
        appender.start();
        logger.addAppender(appender);

        try {
        AccessLogFilter filter = new AccessLogFilter(new RequestClientIpResolver());
            MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/admin/reports/report-123");
            request.setRemoteAddr("127.0.0.1");
            request.setAttribute(
                    RequestBusinessContextInterceptor.REQUEST_ATTRIBUTE_CONTEXT_MAP,
                    Map.of("reportId", "report-123")
            );
            request.setAttribute(
                    RequestBusinessContextInterceptor.REQUEST_ATTRIBUTE_BIZ_CONTEXT,
                    "reportId=report-123"
            );

            MockHttpServletResponse response = new MockHttpServletResponse();
            FilterChain chain = (servletRequest, servletResponse) -> ((MockHttpServletResponse) servletResponse).setStatus(204);

            filter.doFilter(request, response, chain);

            assertThat(appender.list).hasSize(1);
            ILoggingEvent event = appender.list.get(0);
            assertThat(event.getFormattedMessage())
                    .contains("method=GET")
                    .contains("path=/api/admin/reports/report-123")
                    .contains("status=204");
            assertThat(event.getMDCPropertyMap())
                    .containsEntry("bizContext", "reportId=report-123")
                    .containsEntry("reportId", "report-123");
            assertThat(MDC.get("bizContext")).isNull();
            assertThat(MDC.get("reportId")).isNull();
        } finally {
            logger.detachAppender(appender);
            appender.stop();
            MDC.clear();
        }
    }
}
