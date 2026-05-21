package com.dramatv.community.admin.auditlogs;

import com.dramatv.community.admin.auditlogs.dto.response.AdminAuditLogDetailResponse;
import com.dramatv.community.admin.auditlogs.dto.response.AdminAuditLogListResponse;
import com.dramatv.community.shared.response.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/audit-logs")
public class AdminAuditLogController {

    private final AdminAuditLogService adminAuditLogService;

    public AdminAuditLogController(AdminAuditLogService adminAuditLogService) {
        this.adminAuditLogService = adminAuditLogService;
    }

    @GetMapping
    public ApiResponse<AdminAuditLogListResponse> listLogs(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String module,
            @RequestParam(required = false) String result,
            @RequestParam(required = false) String risk
    ) {
        return ApiResponse.ok(adminAuditLogService.listLogs(q, module, result, risk));
    }

    @GetMapping("/{logId}")
    public ApiResponse<AdminAuditLogDetailResponse> getLog(@PathVariable String logId) {
        return ApiResponse.ok(adminAuditLogService.getLog(logId));
    }
}
