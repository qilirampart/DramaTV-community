package com.dramatv.community.publish.application;

import com.dramatv.community.shared.media.VideoMediaProcessingProperties;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class ImageMediaTaskScheduler {

    private final ImageMediaProcessingService imageMediaProcessingService;
    private final VideoMediaProcessingProperties processingProperties;

    public ImageMediaTaskScheduler(
            ImageMediaProcessingService imageMediaProcessingService,
            VideoMediaProcessingProperties processingProperties
    ) {
        this.imageMediaProcessingService = imageMediaProcessingService;
        this.processingProperties = processingProperties;
    }

    @Scheduled(fixedDelayString = "${dramatv.media.processing.worker-delay-ms:2000}")
    public void processQueuedImageMediaTasks() {
        if (!processingProperties.isWorkerEnabled()) {
            return;
        }
        imageMediaProcessingService.processAvailableTasks();
    }
}
