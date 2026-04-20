package com.dramatv.community.publish.application;

import com.dramatv.community.publish.dto.request.CreateReportRequest;
import com.dramatv.community.publish.dto.response.ReportResponse;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class ReportApplicationService {

    public ReportResponse createReport(CreateReportRequest request) {
        return new ReportResponse(
                "report-" + UUID.randomUUID(),
                request.targetType(),
                request.targetId(),
                request.reasonCode(),
                "queued"
        );
    }
}
