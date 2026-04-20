package com.dramatv.community.shared.config;

import com.dramatv.community.identity.application.CurrentUserFilter;
import com.dramatv.community.shared.response.ApiResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.intercept.AuthorizationFilter;
import static org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            ObjectMapper objectMapper,
            CurrentUserFilter currentUserFilter
    ) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .httpBasic(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .logout(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .addFilterBefore(currentUserFilter, AuthorizationFilter.class)
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint((request, response, ex) ->
                                writeAuthFailure(response, objectMapper, HttpServletResponse.SC_UNAUTHORIZED))
                        .accessDeniedHandler((request, response, ex) ->
                                writeAuthFailure(response, objectMapper, HttpServletResponse.SC_FORBIDDEN)))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(antMatcher(HttpMethod.OPTIONS, "/**")).permitAll()
                        .requestMatchers(antMatcher("/actuator/health"), antMatcher("/actuator/info")).permitAll()
                        .requestMatchers(antMatcher(HttpMethod.POST, "/api/auth/login")).permitAll()
                        .requestMatchers(antMatcher(HttpMethod.GET, "/api/feed/home")).permitAll()
                        .requestMatchers(antMatcher(HttpMethod.GET, "/api/discussions/home")).permitAll()
                        .requestMatchers(antMatcher(HttpMethod.GET, "/api/discussions/threads/*")).permitAll()
                        .requestMatchers(antMatcher(HttpMethod.GET, "/api/videos/*")).permitAll()
                        .requestMatchers(antMatcher(HttpMethod.GET, "/api/videos/*/related")).permitAll()
                        .requestMatchers(antMatcher(HttpMethod.GET, "/api/prompts")).permitAll()
                        .requestMatchers(antMatcher(HttpMethod.GET, "/api/prompts/*")).permitAll()
                        .requestMatchers(antMatcher(HttpMethod.GET, "/api/prompts/*/related")).permitAll()
                        .requestMatchers(antMatcher(HttpMethod.GET, "/api/workflows/*")).permitAll()
                        .requestMatchers(antMatcher(HttpMethod.GET, "/api/workflows/*/related-videos")).permitAll()
                        .requestMatchers(antMatcher(HttpMethod.GET, "/api/workflows/*/canvas-link")).permitAll()
                        .requestMatchers(antMatcher(HttpMethod.GET, "/api/creators/*")).permitAll()
                        .requestMatchers(antMatcher(HttpMethod.GET, "/api/creators/*/videos")).permitAll()
                        .requestMatchers(antMatcher(HttpMethod.GET, "/api/creators/*/workflows")).permitAll()
                        .requestMatchers(antMatcher(HttpMethod.GET, "/api/comments")).permitAll()
                        .requestMatchers(antMatcher(HttpMethod.GET, "/api/canvas-runtimes/*")).permitAll()
                        .requestMatchers(antMatcher(HttpMethod.GET, "/api/canvas-runtimes/*/snapshot")).permitAll()
                        .requestMatchers(antMatcher(HttpMethod.GET, "/api/canvas-copy-tasks/*")).permitAll()
                        .requestMatchers(antMatcher("/api/internal/**")).authenticated()
                        .requestMatchers(antMatcher("/api/auth/logout"), antMatcher("/api/auth/me")).authenticated()
                        .requestMatchers(antMatcher("/api/me/**")).authenticated()
                        .requestMatchers(antMatcher("/api/interactions/**")).authenticated()
                        .requestMatchers(antMatcher(HttpMethod.POST, "/api/comments")).authenticated()
                        .requestMatchers(antMatcher("/api/video-drafts/**")).authenticated()
                        .requestMatchers(antMatcher("/api/workflow-drafts/**")).authenticated()
                        .requestMatchers(antMatcher("/api/post-drafts/**")).authenticated()
                        .requestMatchers(antMatcher("/api/uploads/**")).authenticated()
                        .requestMatchers(antMatcher("/api/reports")).authenticated()
                        .requestMatchers(antMatcher(HttpMethod.POST, "/api/workflows/*/copy-to-canvas")).authenticated()
                        .requestMatchers(antMatcher(HttpMethod.POST, "/api/canvas-runtimes/*/visible-assets")).authenticated()
                        .anyRequest().permitAll());

        return http.build();
    }

    @Bean
    public FilterRegistrationBean<CurrentUserFilter> currentUserFilterRegistration(CurrentUserFilter currentUserFilter) {
        FilterRegistrationBean<CurrentUserFilter> registration = new FilterRegistrationBean<>(currentUserFilter);
        registration.setEnabled(false);
        return registration;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    private static void writeAuthFailure(
            HttpServletResponse response,
            ObjectMapper objectMapper,
            int status
    ) throws java.io.IOException {
        String code = status == HttpServletResponse.SC_FORBIDDEN ? "FORBIDDEN" : "AUTH_REQUIRED";
        String message = status == HttpServletResponse.SC_FORBIDDEN ? "forbidden" : "login is required";

        response.setStatus(status);
        response.setCharacterEncoding("UTF-8");
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getWriter(), ApiResponse.failure(code, message));
    }
}
