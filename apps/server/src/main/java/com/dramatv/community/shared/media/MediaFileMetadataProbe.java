package com.dramatv.community.shared.media;

import java.awt.image.BufferedImage;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import javax.imageio.ImageIO;
import org.springframework.stereotype.Component;

@Component
public class MediaFileMetadataProbe {

    private static final Pattern DIMENSION_PATTERN = Pattern.compile("^(\\d+)x(\\d+)$");

    private final VideoMediaProcessingProperties processingProperties;

    public MediaFileMetadataProbe(VideoMediaProcessingProperties processingProperties) {
        this.processingProperties = processingProperties;
    }

    public MediaFileMetadata probe(String assetKind, Path sourcePath) {
        if (sourcePath == null || !Files.exists(sourcePath)) {
            return MediaFileMetadata.empty();
        }

        String normalizedAssetKind = assetKind == null ? "" : assetKind.trim().toLowerCase(Locale.ROOT);
        return switch (normalizedAssetKind) {
            case "image" -> probeImage(sourcePath);
            case "video" -> probeVideo(sourcePath);
            case "audio" -> probeAudio(sourcePath);
            default -> MediaFileMetadata.empty();
        };
    }

    private MediaFileMetadata probeImage(Path sourcePath) {
        try {
            BufferedImage image = ImageIO.read(sourcePath.toFile());
            if (image == null || image.getWidth() <= 0 || image.getHeight() <= 0) {
                return MediaFileMetadata.empty();
            }
            return new MediaFileMetadata(image.getWidth(), image.getHeight(), null);
        } catch (IOException ex) {
            return MediaFileMetadata.empty();
        }
    }

    private MediaFileMetadata probeVideo(Path sourcePath) {
        Integer[] dimensions = probeVideoDimensions(sourcePath);
        Integer durationMs = probeDurationMs(sourcePath);
        return new MediaFileMetadata(
                dimensions[0],
                dimensions[1],
                durationMs
        );
    }

    private MediaFileMetadata probeAudio(Path sourcePath) {
        return new MediaFileMetadata(null, null, probeDurationMs(sourcePath));
    }

    private Integer[] probeVideoDimensions(Path sourcePath) {
        List<String> command = List.of(
                processingProperties.resolveFfprobeCommand(),
                "-v",
                "error",
                "-select_streams",
                "v:0",
                "-show_entries",
                "stream=width,height",
                "-of",
                "csv=s=x:p=0",
                sourcePath.toString()
        );
        try {
            String output = runProcess(command);
            Matcher matcher = DIMENSION_PATTERN.matcher(output.trim());
            if (!matcher.matches()) {
                return new Integer[] { null, null };
            }
            return new Integer[] {
                    Integer.parseInt(matcher.group(1)),
                    Integer.parseInt(matcher.group(2))
            };
        } catch (IOException | InterruptedException | NumberFormatException ex) {
            return new Integer[] { null, null };
        }
    }

    private Integer probeDurationMs(Path sourcePath) {
        List<String> command = new ArrayList<>();
        command.add(processingProperties.resolveFfprobeCommand());
        command.add("-v");
        command.add("error");
        command.add("-show_entries");
        command.add("format=duration");
        command.add("-of");
        command.add("default=noprint_wrappers=1:nokey=1");
        command.add(sourcePath.toString());
        try {
            String output = runProcess(command).trim();
            if (output.isEmpty()) {
                return null;
            }
            double seconds = Double.parseDouble(output);
            if (seconds <= 0d) {
                return null;
            }
            return (int) Math.round(seconds * 1000d);
        } catch (IOException | InterruptedException | NumberFormatException ex) {
            return null;
        }
    }

    private String runProcess(List<String> command) throws IOException, InterruptedException {
        ProcessBuilder processBuilder = new ProcessBuilder(command);
        processBuilder.redirectErrorStream(true);
        Process process = processBuilder.start();
        byte[] outputBytes = process.getInputStream().readAllBytes();
        int exitCode = process.waitFor();
        String output = new String(outputBytes, StandardCharsets.UTF_8);
        if (exitCode != 0) {
            throw new IOException("metadata probe command failed with exit code " + exitCode + ": " + output.trim());
        }
        return output;
    }

    public record MediaFileMetadata(
            Integer width,
            Integer height,
            Integer durationMs
    ) {
        public static MediaFileMetadata empty() {
            return new MediaFileMetadata(null, null, null);
        }
    }
}
