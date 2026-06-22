package com.dramatv.community.shared.media;

import java.nio.file.Files;
import java.nio.file.Path;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "dramatv.media.processing")
public class VideoMediaProcessingProperties {

    private boolean workerEnabled = true;
    private long workerDelayMs = 2000L;
    private int batchSize = 2;
    private long compressionThresholdBytes = 6L * 1024L * 1024L;
    private long previewTargetMaxBytes = 16L * 1024L * 1024L;
    private int previewMaxHeight = 720;
    private int previewAudioBitrateKbps = 96;
    private int previewMinVideoBitrateKbps = 500;
    private int previewMaxVideoBitrateKbps = 2600;
    private long imageCoverThresholdBytes = 1024L * 1024L;
    private int imageCoverMaxWidth = 1600;
    private int imageCoverMaxHeight = 1600;
    private String ffmpegPath = "";
    private String ffprobePath = "";

    public boolean isWorkerEnabled() {
        return workerEnabled;
    }

    public void setWorkerEnabled(boolean workerEnabled) {
        this.workerEnabled = workerEnabled;
    }

    public long getWorkerDelayMs() {
        return workerDelayMs;
    }

    public void setWorkerDelayMs(long workerDelayMs) {
        this.workerDelayMs = workerDelayMs;
    }

    public int getBatchSize() {
        return batchSize;
    }

    public void setBatchSize(int batchSize) {
        this.batchSize = batchSize;
    }

    public long getCompressionThresholdBytes() {
        return compressionThresholdBytes;
    }

    public void setCompressionThresholdBytes(long compressionThresholdBytes) {
        this.compressionThresholdBytes = compressionThresholdBytes;
    }

    public long getPreviewTargetMaxBytes() {
        return previewTargetMaxBytes;
    }

    public void setPreviewTargetMaxBytes(long previewTargetMaxBytes) {
        this.previewTargetMaxBytes = previewTargetMaxBytes;
    }

    public int getPreviewMaxHeight() {
        return previewMaxHeight;
    }

    public void setPreviewMaxHeight(int previewMaxHeight) {
        this.previewMaxHeight = previewMaxHeight;
    }

    public int getPreviewAudioBitrateKbps() {
        return previewAudioBitrateKbps;
    }

    public void setPreviewAudioBitrateKbps(int previewAudioBitrateKbps) {
        this.previewAudioBitrateKbps = previewAudioBitrateKbps;
    }

    public int getPreviewMinVideoBitrateKbps() {
        return previewMinVideoBitrateKbps;
    }

    public void setPreviewMinVideoBitrateKbps(int previewMinVideoBitrateKbps) {
        this.previewMinVideoBitrateKbps = previewMinVideoBitrateKbps;
    }

    public int getPreviewMaxVideoBitrateKbps() {
        return previewMaxVideoBitrateKbps;
    }

    public void setPreviewMaxVideoBitrateKbps(int previewMaxVideoBitrateKbps) {
        this.previewMaxVideoBitrateKbps = previewMaxVideoBitrateKbps;
    }

    public long getImageCoverThresholdBytes() {
        return imageCoverThresholdBytes;
    }

    public void setImageCoverThresholdBytes(long imageCoverThresholdBytes) {
        this.imageCoverThresholdBytes = imageCoverThresholdBytes;
    }

    public int getImageCoverMaxWidth() {
        return imageCoverMaxWidth;
    }

    public void setImageCoverMaxWidth(int imageCoverMaxWidth) {
        this.imageCoverMaxWidth = imageCoverMaxWidth;
    }

    public int getImageCoverMaxHeight() {
        return imageCoverMaxHeight;
    }

    public void setImageCoverMaxHeight(int imageCoverMaxHeight) {
        this.imageCoverMaxHeight = imageCoverMaxHeight;
    }

    public String getFfmpegPath() {
        return ffmpegPath;
    }

    public void setFfmpegPath(String ffmpegPath) {
        this.ffmpegPath = ffmpegPath;
    }

    public String getFfprobePath() {
        return ffprobePath;
    }

    public void setFfprobePath(String ffprobePath) {
        this.ffprobePath = ffprobePath;
    }

    public String resolveFfmpegCommand() {
        return resolveCommand(ffmpegPath, "ffmpeg", "C:\\ffmpeg\\ffmpeg-8.0.1-essentials_build\\bin\\ffmpeg.exe");
    }

    public String resolveFfprobeCommand() {
        return resolveCommand(ffprobePath, "ffprobe", "C:\\ffmpeg\\ffprobe-8.0.1-essentials_build\\bin\\ffprobe.exe");
    }

    private String resolveCommand(String configuredPath, String fallbackCommand, String windowsDefaultPath) {
        if (configuredPath != null && !configuredPath.isBlank()) {
            return configuredPath.trim();
        }

        Path windowsDefault = Path.of(windowsDefaultPath);
        if (Files.exists(windowsDefault)) {
            return windowsDefault.toString();
        }

        return fallbackCommand;
    }
}
