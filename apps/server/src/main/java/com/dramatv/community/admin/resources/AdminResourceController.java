package com.dramatv.community.admin.resources;

import com.dramatv.community.admin.resources.dto.response.AdminResourceDetailResponse;
import com.dramatv.community.admin.resources.dto.response.AdminResourceListResponse;
import com.dramatv.community.shared.response.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/resources")
public class AdminResourceController {

    private final AdminResourceQueryService adminResourceQueryService;

    public AdminResourceController(AdminResourceQueryService adminResourceQueryService) {
        this.adminResourceQueryService = adminResourceQueryService;
    }

    @GetMapping
    public ApiResponse<AdminResourceListResponse> listResources(
            @RequestParam(value = "q", required = false) String q,
            @RequestParam(value = "targetType", required = false) String targetType,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "page", defaultValue = "1") Integer page,
            @RequestParam(value = "pageSize", defaultValue = "15") Integer pageSize
    ) {
        return ApiResponse.ok(adminResourceQueryService.listResources(q, targetType, status, page, pageSize));
    }

    @GetMapping("/{targetType}/{targetId}")
    public ApiResponse<AdminResourceDetailResponse> getResource(
            @PathVariable("targetType") String targetType,
            @PathVariable("targetId") String targetId
    ) {
        return ApiResponse.ok(adminResourceQueryService.getResource(targetType, targetId));
    }
}
