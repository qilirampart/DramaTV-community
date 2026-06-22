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
        Taxonomy taxonomy,
        Source source,
        Author author,
        String coverUrl,
        String posterUrl,
        String previewUrl,
        String sourceUrl,
        List<String> tagNames,
        List<ExampleAsset> examples,
        CommentPolicy commentPolicy,
        Stats stats,
        ViewerActions viewerActions
) {
    public record Taxonomy(
            String modelCategory,
            String contentCategory,
            String compositionCategory
    ) {
    }

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
            String role,
            String assetKind,
            String url,
            String fileName,
            String mimeType,
            Long sizeBytes,
            Integer width,
            Integer height,
            Integer durationMs
    ) {
    }

    public record CommentPolicy(
            boolean commentingEnabled,
            boolean canManageComments
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
