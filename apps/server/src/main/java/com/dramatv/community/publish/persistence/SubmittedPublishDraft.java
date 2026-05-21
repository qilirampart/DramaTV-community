package com.dramatv.community.publish.persistence;

import java.util.List;

public record SubmittedPublishDraft(
        PersistedPublishDraft draft,
        List<String> taskIds
) {
}
