package com.dramatv.community.admin.auth;

import com.dramatv.community.identity.dto.request.LoginRequest;
import com.dramatv.community.identity.dto.response.AuthSessionResponse;
import com.dramatv.community.identity.dto.response.LoginResponse;
import com.dramatv.community.shared.response.ApiResponse;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/auth")
public class AdminAuthController {

    private final AdminAuthApplicationService adminAuthApplicationService;

    public AdminAuthController(AdminAuthApplicationService adminAuthApplicationService) {
        this.adminAuthApplicationService = adminAuthApplicationService;
    }

    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.ok(adminAuthApplicationService.login(request));
    }

    @PostMapping("/logout")
    public ApiResponse<Map<String, String>> logout(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader
    ) {
        adminAuthApplicationService.logout(authorizationHeader);
        return ApiResponse.ok(Map.of("status", "signed_out"));
    }

    @GetMapping("/session")
    public ApiResponse<AuthSessionResponse> session() {
        return ApiResponse.ok(adminAuthApplicationService.currentSession());
    }
}
