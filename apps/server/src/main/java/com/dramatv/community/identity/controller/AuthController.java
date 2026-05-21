package com.dramatv.community.identity.controller;

import com.dramatv.community.identity.application.AuthApplicationService;
import com.dramatv.community.identity.dto.request.LoginRequest;
import com.dramatv.community.identity.dto.response.AuthProviderConfigResponse;
import com.dramatv.community.identity.dto.response.AuthSessionResponse;
import com.dramatv.community.identity.dto.response.LoginResponse;
import com.dramatv.community.shared.response.ApiResponse;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthApplicationService authApplicationService;

    public AuthController(AuthApplicationService authApplicationService) {
        this.authApplicationService = authApplicationService;
    }

    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.ok(authApplicationService.login(request));
    }

    @GetMapping("/providers")
    public ApiResponse<AuthProviderConfigResponse> providers() {
        return ApiResponse.ok(authApplicationService.getProviderConfig());
    }

    @PostMapping("/logout")
    public ApiResponse<Map<String, String>> logout(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader
    ) {
        authApplicationService.logout(authorizationHeader);
        return ApiResponse.ok(Map.of("status", "signed_out"));
    }

    @GetMapping("/me")
    public ApiResponse<AuthSessionResponse> currentUser() {
        return ApiResponse.ok(authApplicationService.currentUser());
    }
}
