package com.dramatv.community.integration;

import com.fasterxml.jackson.databind.JsonNode;
import java.sql.PreparedStatement;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AdminTaxonomyApiIntegrationTest extends ApiIntegrationTestSupport {

    @Test
    void taxonomyReturnsLivePromptCategorySummaryAndSections() throws Exception {
        LoginSession admin = loginAsRandomUser("admin-taxonomy");
        promoteToRole(admin.userId(), "operator");

        LoginSession author = loginAsRandomUser("admin-taxonomy-author");
        insertPrompt(author.userId(), "Taxonomy image prompt", "image", "gpt-image-2", "real-person", "single-model");
        insertPrompt(author.userId(), "Taxonomy video prompt", "video", "seedance", "animation", "wide-shot");
        insertPrompt(author.userId(), "Taxonomy pending prompt", "image", null, "prop", null);

        MvcResult result = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/admin/taxonomy")
                                .accept(MediaType.APPLICATION_JSON),
                        admin.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode body = readBody(result);
        assertThat(body.path("code").asText()).isEqualTo("OK");
        assertThat(body.at("/data/summary/totalPrompts").asInt()).isGreaterThanOrEqualTo(3);
        assertThat(body.at("/data/summary/fullyCategorizedPrompts").asInt()).isGreaterThanOrEqualTo(2);
        assertThat(body.at("/data/summary/needsAttentionPrompts").asInt()).isGreaterThanOrEqualTo(1);
        assertThat(body.at("/data/summary/imageModelCategories").asInt()).isGreaterThanOrEqualTo(1);
        assertThat(body.at("/data/summary/videoModelCategories").asInt()).isGreaterThanOrEqualTo(1);
        assertThat(body.at("/data/summary/contentCategories").asInt()).isGreaterThanOrEqualTo(3);
        assertThat(body.at("/data/summary/compositionCategories").asInt()).isGreaterThanOrEqualTo(2);
        assertThat(body.at("/data/sections").size()).isEqualTo(4);
        assertThat(body.at("/data/sections/0/key").asText()).isEqualTo("image-model");
        assertThat(body.at("/data/sections/1/key").asText()).isEqualTo("video-model");
        JsonNode imageItem = findItem(body.at("/data/sections/0/items"), "gpt-image-2");
        JsonNode videoItem = findItem(body.at("/data/sections/1/items"), "seedance");
        assertThat(imageItem.isMissingNode()).isFalse();
        assertThat(videoItem.isMissingNode()).isFalse();
        assertThat(imageItem.at("/governance/statusCode").asText()).isEqualTo("enabled");
        assertThat(imageItem.at("/governance/sortOrder").asInt()).isEqualTo(1000);
        assertThat(imageItem.at("/governance/hasCustomConfig").asBoolean()).isFalse();
    }

    @Test
    void taxonomyUpdatePersistsGovernanceConfigAndReadback() throws Exception {
        LoginSession admin = loginAsRandomUser("admin-taxonomy-write");
        promoteToRole(admin.userId(), "operator");

        LoginSession author = loginAsRandomUser("admin-taxonomy-write-author");
        String modelCategory = "taxonomy-live-write-model";
        insertPrompt(author.userId(), "Taxonomy write prompt", "video", modelCategory, "taxonomy-live-write-content", "taxonomy-live-write-composition");

        MvcResult updateResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.put("/api/admin/taxonomy")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(Map.of(
                                        "sectionKey", "video-model",
                                        "categoryValue", modelCategory,
                                        "statusCode", "disabled",
                                        "sortOrder", 12,
                                        "exposureFlags", List.of("homepage", "publish"),
                                        "noteText", "Temporarily hidden from discovery surfaces."
                                ))),
                        admin.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode updateBody = readBody(updateResult);
        assertThat(updateBody.path("code").asText()).isEqualTo("OK");
        assertThat(updateBody.at("/data/value").asText()).isEqualTo(modelCategory);
        assertThat(updateBody.at("/data/governance/statusCode").asText()).isEqualTo("disabled");
        assertThat(updateBody.at("/data/governance/sortOrder").asInt()).isEqualTo(12);
        assertThat(updateBody.at("/data/governance/exposureFlags/0").asText()).isEqualTo("homepage");
        assertThat(updateBody.at("/data/governance/exposureFlags/1").asText()).isEqualTo("publish");
        assertThat(updateBody.at("/data/governance/noteText").asText()).isEqualTo("Temporarily hidden from discovery surfaces.");
        assertThat(updateBody.at("/data/governance/hasCustomConfig").asBoolean()).isTrue();
        assertThat(updateBody.at("/data/governance/updatedByDisplayName").asText()).isNotBlank();
        assertThat(updateBody.at("/data/governance/updatedAt").asText()).isNotBlank();

        MvcResult readResult = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/admin/taxonomy")
                                .accept(MediaType.APPLICATION_JSON),
                        admin.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode readBody = readBody(readResult);
        JsonNode updatedItem = findItem(readBody.at("/data/sections/1/items"), modelCategory);
        assertThat(updatedItem.isMissingNode()).isFalse();
        assertThat(updatedItem.at("/governance/statusCode").asText()).isEqualTo("disabled");
        assertThat(updatedItem.at("/governance/sortOrder").asInt()).isEqualTo(12);
        assertThat(updatedItem.at("/governance/exposureFlags/0").asText()).isEqualTo("homepage");
        assertThat(updatedItem.at("/governance/exposureFlags/1").asText()).isEqualTo("publish");
        assertThat(updatedItem.at("/governance/noteText").asText()).isEqualTo("Temporarily hidden from discovery surfaces.");
        assertThat(updatedItem.at("/governance/hasCustomConfig").asBoolean()).isTrue();
    }

    @Test
    void taxonomyPromptListSupportsRealFilters() throws Exception {
        LoginSession admin = loginAsRandomUser("admin-taxonomy-prompt-list");
        promoteToRole(admin.userId(), "operator");

        LoginSession author = loginAsRandomUser("admin-taxonomy-prompt-list-author");
        insertPrompt(
                author.userId(),
                "Taxonomy prompt list image",
                "image",
                "gpt-image-2",
                "real-person",
                "single-model",
                List.of("editorial", "portrait")
        );
        insertPrompt(
                author.userId(),
                "Taxonomy prompt list video",
                "video",
                null,
                "animation",
                null,
                List.of("campaign", "video-prompt")
        );

        MvcResult result = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.get("/api/admin/taxonomy/prompts")
                                .queryParam("q", "Taxonomy prompt list video")
                                .queryParam("modality", "video")
                                .queryParam("needsAttention", "true")
                                .accept(MediaType.APPLICATION_JSON),
                        admin.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode body = readBody(result);
        assertThat(body.path("code").asText()).isEqualTo("OK");
        assertThat(body.at("/data/summary/totalItems").asInt()).isEqualTo(1);
        assertThat(body.at("/data/summary/needsAttentionItems").asInt()).isEqualTo(1);
        assertThat(body.at("/data/summary/imageItems").asInt()).isEqualTo(0);
        assertThat(body.at("/data/summary/videoItems").asInt()).isEqualTo(1);
        assertThat(body.at("/data/items").size()).isEqualTo(1);
        JsonNode item = body.at("/data/items/0");
        assertThat(item.path("title").asText()).isEqualTo("Taxonomy prompt list video");
        assertThat(item.path("modality").asText()).isEqualTo("video");
        assertThat(item.path("needsAttention").asBoolean()).isTrue();
        assertThat(item.at("/tagNames/0").asText()).isEqualTo("campaign");
        assertThat(item.at("/tagNames/1").asText()).isEqualTo("video-prompt");
    }

    @Test
    void taxonomyBulkApplyUpdatesCategoriesAndPreservesNonTaxonomyTags() throws Exception {
        LoginSession admin = loginAsRandomUser("admin-taxonomy-bulk-apply");
        promoteToRole(admin.userId(), "operator");

        LoginSession author = loginAsRandomUser("admin-taxonomy-bulk-apply-author");
        String promptId = insertPrompt(
                author.userId(),
                "Taxonomy bulk image prompt",
                "image",
                null,
                null,
                null,
                List.of("youmind", "editorial", "legacy-label")
        );

        MvcResult result = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/admin/taxonomy/prompts/bulk-apply")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(Map.of(
                                        "modality", "image",
                                        "promptIds", List.of(promptId),
                                        "modelCategory", "nanobanana",
                                        "contentCategory", "scene",
                                        "compositionCategory", "multi-model"
                                ))),
                        admin.accessToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode body = readBody(result);
        assertThat(body.path("code").asText()).isEqualTo("OK");
        assertThat(body.at("/data/modality").asText()).isEqualTo("image");
        assertThat(body.at("/data/updatedCount").asInt()).isEqualTo(1);
        assertThat(body.at("/data/modelCategory").asText()).isEqualTo("nanobanana");
        assertThat(body.at("/data/contentCategory").asText()).isEqualTo("scene");
        assertThat(body.at("/data/compositionCategory").asText()).isEqualTo("multi-model");
        assertThat(body.at("/data/promptIds/0").asText()).isEqualTo(promptId);

        Map<String, Object> row = jdbcTemplate.queryForMap("""
                select model_category, content_category, composition_category, tag_names
                from prompt_entries
                where id = ?
                """,
                UUID.fromString(promptId)
        );

        assertThat(row.get("model_category")).isEqualTo("nanobanana");
        assertThat(row.get("content_category")).isEqualTo("scene");
        assertThat(row.get("composition_category")).isEqualTo("multi-model");
        assertThat(row.get("tag_names"))
                .isInstanceOfAny(String[].class, java.sql.Array.class);

        List<String> tagNames = jdbcTemplate.query("""
                        select unnest(tag_names)
                        from prompt_entries
                        where id = ?
                        """,
                (resultSet, rowNum) -> resultSet.getString(1),
                UUID.fromString(promptId)
        );
        assertThat(tagNames)
                .contains("youmind", "editorial", "legacy-label", "image-prompt", "nanobanana", "scene", "multi-model")
                .doesNotContain("video-prompt");
    }

    @Test
    void taxonomyBulkApplyRejectsModalityMismatch() throws Exception {
        LoginSession admin = loginAsRandomUser("admin-taxonomy-bulk-mismatch");
        promoteToRole(admin.userId(), "operator");

        LoginSession author = loginAsRandomUser("admin-taxonomy-bulk-mismatch-author");
        String videoPromptId = insertPrompt(
                author.userId(),
                "Taxonomy bulk mismatch video",
                "video",
                "seedance",
                "animation",
                "single-model",
                List.of("campaign")
        );

        MvcResult result = mockMvc.perform(authorized(
                        MockMvcRequestBuilders.post("/api/admin/taxonomy/prompts/bulk-apply")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(Map.of(
                                        "modality", "image",
                                        "promptIds", List.of(videoPromptId),
                                        "modelCategory", "gpt-image-2",
                                        "contentCategory", "scene",
                                        "compositionCategory", "single-model"
                                ))),
                        admin.accessToken()))
                .andExpect(status().isBadRequest())
                .andReturn();

        assertThat(readBody(result).path("code").asText()).isEqualTo("ADMIN_TAXONOMY_MODALITY_MISMATCH");
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
        return insertPrompt(authorId, title, modality, modelCategory, contentCategory, compositionCategory, List.of());
    }

    private String insertPrompt(
            String authorId,
            String title,
            String modality,
            String modelCategory,
            String contentCategory,
            String compositionCategory,
            List<String> tagNames
    ) {
        UUID promptId = UUID.randomUUID();
        jdbcTemplate.update(connection -> {
            PreparedStatement statement = connection.prepareStatement("""
                    insert into prompt_entries (
                        id, author_id, title, summary, modality, prompt_text, prompt_text_raw,
                        model_category, content_category, composition_category, tag_names,
                        visibility, publish_status, published_at, created_at, updated_at
                    )
                    values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'public', 'published', now(), now(), now())
                    """);
            statement.setObject(1, promptId);
            statement.setObject(2, UUID.fromString(authorId));
            statement.setString(3, title);
            statement.setString(4, title + " summary");
            statement.setString(5, modality);
            statement.setString(6, title + " prompt text");
            statement.setString(7, title + " prompt text");
            statement.setString(8, modelCategory);
            statement.setString(9, contentCategory);
            statement.setString(10, compositionCategory);
            statement.setArray(11, connection.createArrayOf("text", tagNames.toArray(String[]::new)));
            return statement;
        });
        return promptId.toString();
    }

    private JsonNode findItem(JsonNode items, String value) {
        if (!items.isArray()) {
            return objectMapper.getNodeFactory().missingNode();
        }

        for (JsonNode item : items) {
            if (value.equals(item.path("value").asText())) {
                return item;
            }
        }
        return objectMapper.getNodeFactory().missingNode();
    }
}
