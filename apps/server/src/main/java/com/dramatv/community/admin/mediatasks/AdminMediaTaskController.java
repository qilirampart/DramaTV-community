package com.dramatv.community.admin.mediatasks;

import com.dramatv.community.admin.mediatasks.dto.response.AdminMediaTaskActionResponse;
import com.dramatv.community.admin.mediatasks.dto.response.AdminMediaTaskDetailResponse;
import com.dramatv.community.admin.mediatasks.dto.response.AdminMediaTaskListResponse;
import com.dramatv.community.shared.response.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/media-tasks")
public class AdminMediaTaskController {

    private final AdminMediaTaskService adminMediaTaskService;

    public AdminMediaTaskController(AdminMediaTaskService adminMediaTaskService) {
        this.adminMediaTaskService = adminMediaTaskService;
    }

    @GetMapping
    public ApiResponse<AdminMediaTaskListResponse> listTasks(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String targetType
    ) {
        return ApiResponse.ok(adminMediaTaskService.listTasks(q, status, targetType));
    }

    @GetMapping("/{taskId}")
    public ApiResponse<AdminMediaTaskDetailResponse> getTask(@PathVariable String taskId) {
        return ApiResponse.ok(adminMediaTaskService.getTask(taskId));
    }

    @PostMapping("/{taskId}/retry")
    public ApiResponse<AdminMediaTaskActionResponse> retryTask(@PathVariable String taskId) {
        return ApiResponse.ok(adminMediaTaskService.retryTask(taskId));
    }
}
