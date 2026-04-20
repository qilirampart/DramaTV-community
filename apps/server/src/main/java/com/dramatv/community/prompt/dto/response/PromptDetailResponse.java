package com.dramatv.community.prompt.dto.response;

import java.util.List;

public record PromptDetailResponse(
        String id,
        String title,
        String summary,
        String modality,
        String promptText,
        String promptTextZh,
        String promptTextEn,
        String promptTextRaw,
        Source source,
        Author author,
        String coverUrl,
        List<String> tagNames,
        List<ExampleAsset> examples,
        Stats stats,
        ViewerActions viewerActions
) {
    public record Source(
            String sourcePlatform,
            String sourceCampaign,
            String sourceItemId,
            String sourceUrl,
            String modelName
    ) {
    }

    public record Author(
            String id,
            String displayName,
            String avatarUrl
    ) {
    }

    public record ExampleAsset(
            String id,
            String assetKind,
            String url,
            String mimeType,
            Integer width,
            Integer height,
            Integer durationMs
    ) {
    }

    public record Stats(
            long likeCount,
            long favoriteCount,
            long commentCount,
            long exampleCount
    ) {
    }

    public record ViewerActions(
            boolean liked,
            boolean favorited,
            boolean followedAuthor
    ) {
    }
}
