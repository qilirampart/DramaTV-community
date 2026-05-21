package com.dramatv.community.shared.error;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.dramatv.community.shared.request.RequestBusinessContextInterceptor;
import java.util.Map;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.assertj.core.api.Assertions.assertThat;

class ApiExceptionHandlerTest {

    @AfterEach
    void cleanup() {
        MDC.clear();
    }

    @Test
    void businessErrorLogIncludesRequestBusinessContext() {
        Logger logger = (Logger) LoggerFactory.getLogger(ApiExceptionHandler.class);
        ListAppender<ILoggingEvent> appender = new ListAppender<>();
        appender.start();
        logger.addAppender(appender);

        try {
            ApiExceptionHandler handler = new ApiExceptionHandler();
            MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/reports");
            request.setAttribute(
                    RequestBusinessContextInterceptor.REQUEST_ATTRIBUTE_CONTEXT_MAP,
                    Map.of(
                            "targetType", "prompt",
                            "targetId", "prompt-123",
                            "promptId", "prompt-123"
                    )
            );
            request.setAttribute(
                    RequestBusinessContextInterceptor.REQUEST_ATTRIBUTE_BIZ_CONTEXT,
                    "promptId=prompt-123,targetType=prompt,targetId=prompt-123"
            );

            handler.handleBusiness(
                    new ApiBusinessException(HttpStatus.CONFLICT, "REPORT_DUPLICATE", "report already exists"),
                    request
            );

            assertThat(appender.list).hasSize(1);
            ILoggingEvent event = appender.list.get(0);
            assertThat(event.getFormattedMessage()).contains("code=REPORT_DUPLICATE");
            assertThat(event.getMDCPropertyMap())
                    .containsEntry("bizContext", "promptId=prompt-123,targetType=prompt,targetId=prompt-123")
                    .containsEntry("promptId", "prompt-123")
                    .containsEntry("targetType", "prompt")
                    .containsEntry("targetId", "prompt-123");
        } finally {
            logger.detachAppender(appender);
            appender.stop();
        }
    }
}
