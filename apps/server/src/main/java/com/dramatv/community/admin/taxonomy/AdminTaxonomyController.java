package com.dramatv.community.admin.taxonomy;

import com.dramatv.community.admin.taxonomy.dto.request.AdminTaxonomyUpdateRequest;
import com.dramatv.community.admin.taxonomy.dto.request.AdminTaxonomyBulkApplyRequest;
import com.dramatv.community.admin.taxonomy.dto.response.AdminTaxonomyBulkApplyResponse;
import com.dramatv.community.admin.taxonomy.dto.response.AdminTaxonomyPromptListResponse;
import com.dramatv.community.admin.taxonomy.dto.response.AdminTaxonomyResponse;
import com.dramatv.community.shared.response.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/taxonomy")
public class AdminTaxonomyController {

    private final AdminTaxonomyService adminTaxonomyService;

    public AdminTaxonomyController(AdminTaxonomyService adminTaxonomyService) {
        this.adminTaxonomyService = adminTaxonomyService;
    }

    @GetMapping
    public ApiResponse<AdminTaxonomyResponse> getTaxonomy() {
        return ApiResponse.ok(adminTaxonomyService.getTaxonomy());
    }

    @GetMapping("/prompts")
    public ApiResponse<AdminTaxonomyPromptListResponse> listPrompts(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String modality,
            @RequestParam(required = false) String needsAttention,
            @RequestParam(required = false) String modelCategory,
            @RequestParam(required = false) String contentCategory,
            @RequestParam(required = false) String compositionCategory
    ) {
        return ApiResponse.ok(adminTaxonomyService.listPrompts(
                q,
                modality,
                needsAttention,
                modelCategory,
                contentCategory,
                compositionCategory
        ));
    }

    @PutMapping
    public ApiResponse<AdminTaxonomyResponse.Item> updateTaxonomy(
            @Valid @RequestBody AdminTaxonomyUpdateRequest request
    ) {
        return ApiResponse.ok(adminTaxonomyService.updateTaxonomy(request));
    }

    @PostMapping("/prompts/bulk-apply")
    public ApiResponse<AdminTaxonomyBulkApplyResponse> bulkApplyTaxonomy(
            @Valid @RequestBody AdminTaxonomyBulkApplyRequest request
    ) {
        return ApiResponse.ok(adminTaxonomyService.bulkApplyTaxonomy(request));
    }
}
