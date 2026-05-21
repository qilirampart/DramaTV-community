package com.dramatv.community.publish.application;

import com.dramatv.community.shared.media.VideoMediaProcessingProperties;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class VideoMediaTaskScheduler {

    private final VideoMediaProcessingService videoMediaProcessingService;
    private final VideoMediaProcessingProperties processingProperties;

    public VideoMediaTaskScheduler(
            VideoMediaProcessingService videoMediaProcessingService,
            VideoMediaProcessingProperties processingProperties
    ) {
        this.videoMediaProcessingService = videoMediaProcessingService;
        this.processingProperties = processingProperties;
    }

    @Scheduled(fixedDelayString = "${dramatv.media.processing.worker-delay-ms:2000}")
    public void processQueuedVideoMediaTasks() {
        if (!processingProperties.isWorkerEnabled()) {
            return;
        }
        videoMediaProcessingService.processAvailableTasks();
    }
}
