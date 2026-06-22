package com.dramatv.community.shared.media;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.nio.charset.StandardCharsets;
import org.springframework.http.HttpMethod;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@RestController
public class MediaProxyController {

    private static final String MEDIA_PREFIX = "/media/";

    private final MediaProxyService mediaProxyService;

    public MediaProxyController(MediaProxyService mediaProxyService) {
        this.mediaProxyService = mediaProxyService;
    }

    @RequestMapping(value = "/media/**", method = {RequestMethod.GET, RequestMethod.HEAD})
    public void serve(HttpServletRequest request, HttpServletResponse response) {
        String objectKey = extractObjectKey(request);
        mediaProxyService.writeToResponse(
                objectKey,
                HttpMethod.valueOf(request.getMethod()),
                request.getHeader("Range"),
                request.getHeader("If-None-Match"),
                request.getHeader("If-Modified-Since"),
                response
        );
    }

    private String extractObjectKey(HttpServletRequest request) {
        String requestUri = request.getRequestURI();
        String contextPath = request.getContextPath();
        String path = contextPath == null || contextPath.isBlank() || !requestUri.startsWith(contextPath)
                ? requestUri
                : requestUri.substring(contextPath.length());

        if (!path.startsWith(MEDIA_PREFIX) || path.length() <= MEDIA_PREFIX.length()) {
            throw new ResponseStatusException(NOT_FOUND);
        }

        String rawObjectKey = path.substring(MEDIA_PREFIX.length());
        return java.net.URLDecoder.decode(rawObjectKey, StandardCharsets.UTF_8);
    }
}
