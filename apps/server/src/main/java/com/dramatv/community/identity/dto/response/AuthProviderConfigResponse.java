package com.dramatv.community.identity.dto.response;

import java.util.List;

public record AuthProviderConfigResponse(
        String primaryProvider,
        List<LoginProvider> loginProviders
) {
    public record LoginProvider(
            String code,
            String displayName,
            String description,
            boolean enabled,
            String formType
    ) {
    }
}
