package com.dramatv.community.integration;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.dramatv.community.admin.taxonomy.AdminTaxonomyService;
import com.dramatv.community.shared.error.ApiExceptionHandler;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AdminTaxonomyLoggingIntegrationTest extends ApiIntegrationTestSupport {

    @Test
    void updateTaxonomySuccessLogIncludesSectionBusinessContext() throws Exception {
        LoginSession operator = loginAsRandomUser("admin-taxonomy-log-success");
        promoteToRole(operator.userId(), "operator");

        LoginSession author = loginAsRandomUser("admin-taxonomy-log-author");
        String modelCategory = "taxonomy-log-model-" + UUID.randomUUID();
        insertPrompt(author.userId(), "Taxonomy logging prompt", "video", modelCategory, "taxonomy-log-content", "taxonomy-log-composition");

        Logger logger = (Logger) LoggerFactory.getLogger(AdminTaxonomyService.class);
        ListAppender<ILoggingEvent> appender = attachAppender(logger);

        try {
            mockMvc.perform(authorized(
                            MockMvcRequestBuilders.put("/api/admin/taxonomy")
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(objectMapper.writeValueAsString(Map.of(
                                            "sectionKey", "video-model",
                                            "categoryValue", modelCategory,
                                            "statusCode", "disabled",
                                            "sortOrder", 42,
                                            "exposureFlags", List.of("homepage", "publish"),
                                            "noteText", "Temporarily hidden from discovery surfaces."
                                    ))),
                            operator.accessToken()))
                    .andExpect(status().isOk());

            ILoggingEvent event = findEvent(appender, "admin taxonomy update success:");
            assertThat(event.getFormattedMessage())
                    .contains("operatorId=" + operator.userId())
                    .contains("sectionKey=video-model")
                    .contains("categoryValue=" + modelCategory)
                    .contains("statusCode=disabled")
                    .contains("sortOrder=42")
                    .contains("exposureFlagCount=2")
                    .contains("persistedCustomConfig=true")
                    .contains("hasNote=true");
            assertThat(event.getMDCPropertyMap())
                    .containsEntry("targetType", "taxonomy_section")
                    .containsEntry("targetId", "video-model:" + modelCategory)
                    .containsEntry("bizContext", "targetType=taxonomy_section,targetId=video-model:" + modelCategory);
        } finally {
            detachAppender(logger, appender);
        }
    }

    @Test
    void updateTaxonomyMissingItemErrorPreservesSectionBusinessContext() throws Exception {
        LoginSession operator = loginAsRandomUser("admin-taxonomy-log-error");
        promoteToRole(operator.userId(), "operator");

        String missingModelCategory = "missing-taxonomy-" + UUID.randomUUID();
        Logger errorLogger = (Logger) LoggerFactory.getLogger(ApiExceptionHandler.class);
        ListAppender<ILoggingEvent> errorAppender = attachAppender(errorLogger);

        try {
            MvcResult result = mockMvc.perform(authorized(
                            MockMvcRequestBuilders.put("/api/admin/taxonomy")
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(objectMapper.writeValueAsString(Map.of(
                                            "sectionKey", "video-model",
                                            "categoryValue", missingModelCategory,
                                            "statusCode", "enabled",
                                            "sortOrder", 1,
                                            "exposureFlags", List.of("homepage"),
                                            "noteText", "missing item"
                                    ))),
                            operator.accessToken()))
                    .andExpect(status().isNotFound())
                    .andReturn();

            assertThat(readBody(result).path("code").asText()).isEqualTo("ADMIN_TAXONOMY_ITEM_NOT_FOUND");

            ILoggingEvent event = findEvent(errorAppender, "code=ADMIN_TAXONOMY_ITEM_NOT_FOUND");
            assertThat(event.getMDCPropertyMap())
                    .containsEntry("targetType", "taxonomy_section")
                    .containsEntry("targetId", "video-model:" + missingModelCategory)
                    .containsEntry("bizContext", "targetType=taxonomy_section,targetId=video-model:" + missingModelCategory);
        } finally {
            detachAppender(errorLogger, errorAppender);
        }
    }

    @Test
    void bulkApplyTaxonomySuccessLogIncludesBatchBusinessContext() throws Exception {
        LoginSession operator = loginAsRandomUser("admin-taxonomy-bulk-log-success");
        promoteToRole(operator.userId(), "operator");

        LoginSession author = loginAsRandomUser("admin-taxonomy-bulk-log-author");
        String promptId = insertPrompt(
                author.userId(),
                "Taxonomy bulk logging prompt",
                "video",
                null,
                null,
                null
        );

        Logger logger = (Logger) LoggerFactory.getLogger(AdminTaxonomyService.class);
        ListAppender<ILoggingEvent> appender = attachAppender(logger);

        try {
            mockMvc.perform(authorized(
                            MockMvcRequestBuilders.post("/api/admin/taxonomy/prompts/bulk-apply")
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(objectMapper.writeValueAsString(Map.of(
                                            "modality", "video",
                                            "promptIds", List.of(promptId),
                                            "modelCategory", "seedance",
                                            "contentCategory", "animation",
                                            "modelUsageCategory", "multi-model"
                                    ))),
                            operator.accessToken()))
                    .andExpect(status().isOk());

            ILoggingEvent event = findEvent(appender, "admin taxonomy bulk apply success:");
            assertThat(event.getFormattedMessage())
                    .contains("operatorId=" + operator.userId())
                    .contains("modality=video")
                    .contains("promptCount=1")
                    .contains("modelCategory=seedance")
                    .contains("contentCategory=animation")
                    .contains("compositionCategory=multi-model");
            assertThat(event.getMDCPropertyMap())
                    .containsEntry("targetType", "taxonomy_prompt_batch")
                    .containsEntry("targetId", "video:1")
                    .containsEntry("bizContext", "targetType=taxonomy_prompt_batch,targetId=video:1");
        } finally {
            detachAppender(logger, appender);
        }
    }

    private void promoteToRole(String userId, String roleCode) {
        jdbcTemplate.update(
                "update users set role_code = ?, updated_at = now() where id = ?",
                roleCode,
                UUID.fromString(userId)
        );
    }

    private String insertPrompt(
            String authorId,
            String title,
            String modality,
            String modelCategory,
            String contentCategory,
            String compositionCategory
    ) {
        UUID promptId = UUID.randomUUID();
        jdbcTemplate.update("""
                insert into prompt_entries (
                    id, author_id, title, summary, modality, prompt_text, prompt_text_raw,
                    model_category, content_category, composition_category,
                    visibility, publish_status, published_at, created_at, updated_at
                )
                values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'public', 'published', now(), now(), now())
                """,
                promptId,
                UUID.fromString(authorId),
                title,
                title + " summary",
                modality,
                title + " prompt text",
                title + " prompt text",
                modelCategory,
                contentCategory,
                compositionCategory
        );
        return promptId.toString();
    }

    private ListAppender<ILoggingEvent> attachAppender(Logger logger) {
        ListAppender<ILoggingEvent> appender = new ListAppender<>();
        appender.start();
        logger.addAppender(appender);
        return appender;
    }

    private void detachAppender(Logger logger, ListAppender<ILoggingEvent> appender) {
        logger.detachAppender(appender);
        appender.stop();
    }

    private ILoggingEvent findEvent(ListAppender<ILoggingEvent> appender, String messageFragment) {
        return appender.list.stream()
                .filter(event -> event.getFormattedMessage().contains(messageFragment))
                .findFirst()
                .orElseThrow(() -> new AssertionError("missing log event containing: " + messageFragment));
    }
}
