package com.dramatv.community.admin.auth;

import com.dramatv.community.identity.application.CurrentUser;
import com.dramatv.community.identity.application.CurrentUserService;
import com.dramatv.community.shared.error.ApiBusinessException;
import java.util.Arrays;
import java.util.Locale;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
public class AdminAccessService {

    private static final Set<String> ADMIN_ROLES = Set.of("admin", "operator", "moderator");

    private final CurrentUserService currentUserService;

    public AdminAccessService(CurrentUserService currentUserService) {
        this.currentUserService = currentUserService;
    }

    public CurrentUser requireAdminUser() {
        return requireAnyRole(ADMIN_ROLES.toArray(String[]::new));
    }

    public CurrentUser requireAnyRole(String... allowedRoles) {
        CurrentUser currentUser = currentUserService.requireCurrentUser();
        String normalizedRole = normalizeRole(currentUser.roleCode());

        boolean allowed = Arrays.stream(allowedRoles)
                .map(this::normalizeRole)
                .anyMatch(normalizedRole::equals);

        if (!allowed) {
            throw ApiBusinessException.forbidden("ADMIN_FORBIDDEN", "admin access is required");
        }

        return currentUser;
    }

    public boolean isAdminRole(String roleCode) {
        return ADMIN_ROLES.contains(normalizeRole(roleCode));
    }

    private String normalizeRole(String roleCode) {
        return roleCode == null ? "" : roleCode.trim().toLowerCase(Locale.ROOT);
    }
}
