package com.dramatv.community.publish.persistence;

import com.fasterxml.jackson.databind.node.ObjectNode;
import java.time.OffsetDateTime;
import java.util.UUID;

public record PersistedPublishDraft(
        UUID id,
        String draftType,
        UUID authorId,
        UUID targetId,
        String titleDraft,
        ObjectNode payloadJson,
        String currentStep,
        String statusCode,
        int autosaveVersion,
        OffsetDateTime submittedAt
) {
}
