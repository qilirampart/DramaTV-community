package com.dramatv.community.prompt.controller;

import com.dramatv.community.prompt.application.PromptQueryService;
import com.dramatv.community.prompt.dto.response.PromptDetailResponse;
import com.dramatv.community.prompt.dto.response.PromptSummaryResponse;
import com.dramatv.community.shared.response.ApiResponse;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/prompts")
public class PromptQueryController {

    private final PromptQueryService promptQueryService;

    public PromptQueryController(PromptQueryService promptQueryService) {
        this.promptQueryService = promptQueryService;
    }

    @GetMapping
    public ApiResponse<List<PromptSummaryResponse>> list(
            @RequestParam(defaultValue = "all") String modality,
            @RequestParam(defaultValue = "latest") String sort,
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) Integer offset
    ) {
        return ApiResponse.ok(promptQueryService.listPublished(modality, sort, limit, offset));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PromptDetailResponse>> detail(@PathVariable String id) {
        return promptQueryService.findDetail(id)
                .map(response -> ResponseEntity.ok(ApiResponse.ok(response)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.failure("PROMPT_NOT_FOUND", "prompt not found")));
    }

    @GetMapping("/{id}/related")
    public ApiResponse<List<PromptSummaryResponse>> related(@PathVariable String id) {
        return ApiResponse.ok(promptQueryService.relatedPrompts(id));
    }
}
