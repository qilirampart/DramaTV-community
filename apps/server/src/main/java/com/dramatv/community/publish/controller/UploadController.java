package com.dramatv.community.publish.controller;

import com.dramatv.community.publish.application.UploadApplicationService;
import com.dramatv.community.publish.dto.request.UploadPolicyRequest;
import com.dramatv.community.publish.dto.response.UploadAssetResponse;
import com.dramatv.community.publish.dto.response.UploadPolicyResponse;
import com.dramatv.community.shared.error.ApiBusinessException;
import com.dramatv.community.shared.response.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.io.IOException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import static org.springframework.http.HttpHeaders.CONTENT_TYPE;
import static org.springframework.http.MediaType.ALL_VALUE;

@RestController
@RequestMapping("/api/uploads")
public class UploadController {

    private final UploadApplicationService uploadApplicationService;

    public UploadController(UploadApplicationService uploadApplicationService) {
        this.uploadApplicationService = uploadApplicationService;
    }

    @PostMapping("/video-policy")
    public ResponseEntity<ApiResponse<UploadPolicyResponse>> videoPolicy(
            @Valid @RequestBody UploadPolicyRequest request
    ) {
        return buildResponse(() -> uploadApplicationService.createVideoPolicy(request));
    }

    @PostMapping("/image-policy")
    public ResponseEntity<ApiResponse<UploadPolicyResponse>> imagePolicy(
            @Valid @RequestBody UploadPolicyRequest request
    ) {
        return buildResponse(() -> uploadApplicationService.createImagePolicy(request));
    }

    @PutMapping(value = "/assets/{assetId}/binary", consumes = ALL_VALUE)
    public ResponseEntity<ApiResponse<UploadAssetResponse>> uploadBinary(
            @PathVariable String assetId,
            @RequestHeader(value = CONTENT_TYPE, required = false) String contentType,
            HttpServletRequest request
    ) {
        try {
            return ResponseEntity.ok(
                    ApiResponse.ok(uploadApplicationService.uploadBinary(assetId, contentType, request.getInputStream()))
            );
        } catch (IOException ex) {
            throw ApiBusinessException.internalError("UPLOAD_STREAM_READ_FAILED", "upload stream could not be read");
        }
    }

    private <T> ResponseEntity<ApiResponse<T>> buildResponse(UploadSupplier<T> supplier) {
        return ResponseEntity.ok(ApiResponse.ok(supplier.get()));
    }

    @FunctionalInterface
    private interface UploadSupplier<T> {
        T get();
    }
}
