package com.dramatv.community.admin.feedops.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record AdminFeedOpsPageUpdateRequest(
        @NotBlank String statusCode,
        @NotNull @Valid List<SlotConfig> slots
) {
    public record SlotConfig(
            @NotBlank String slotKey,
            @NotNull @Valid List<ItemRef> items
    ) {
    }

    public record ItemRef(
            @NotBlank String targetType,
            @NotBlank String targetId
    ) {
    }
}
