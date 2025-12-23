package com.canvasearth.validator;

import com.canvasearth.exception.InvalidFileException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.util.Arrays;
import java.util.List;

@Component
public class FileValidator {

    @Value("${canvas.upload.image.max-size}")
    private long imageMaxSize;

    @Value("${canvas.upload.image.allowed-types}")
    private String imageAllowedTypes;

    @Value("${canvas.upload.video.max-size}")
    private long videoMaxSize;

    @Value("${canvas.upload.video.allowed-types}")
    private String videoAllowedTypes;

    public void validateImageFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new InvalidFileException("파일이 비어있습니다");
        }

        // 파일 크기 검증
        if (file.getSize() > imageMaxSize) {
            throw new InvalidFileException(
                String.format("이미지 파일 크기는 %dMB를 초과할 수 없습니다", imageMaxSize / 1024 / 1024)
            );
        }

        // 파일 확장자 검증
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || !isValidImageExtension(originalFilename)) {
            throw new InvalidFileException(
                String.format("허용되지 않는 이미지 형식입니다. 허용 형식: %s", imageAllowedTypes)
            );
        }

        // MIME 타입 검증
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new InvalidFileException("이미지 파일만 업로드 가능합니다");
        }
    }

    public void validateVideoFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new InvalidFileException("파일이 비어있습니다");
        }

        // 파일 크기 검증
        if (file.getSize() > videoMaxSize) {
            throw new InvalidFileException(
                String.format("비디오 파일 크기는 %dMB를 초과할 수 없습니다", videoMaxSize / 1024 / 1024)
            );
        }

        // 파일 확장자 검증
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || !isValidVideoExtension(originalFilename)) {
            throw new InvalidFileException(
                String.format("허용되지 않는 비디오 형식입니다. 허용 형식: %s", videoAllowedTypes)
            );
        }

        // MIME 타입 검증
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("video/")) {
            throw new InvalidFileException("비디오 파일만 업로드 가능합니다");
        }
    }

    private boolean isValidImageExtension(String filename) {
        String extension = getFileExtension(filename);
        List<String> allowedExtensions = Arrays.asList(imageAllowedTypes.split(","));
        return allowedExtensions.contains(extension.toLowerCase());
    }

    private boolean isValidVideoExtension(String filename) {
        String extension = getFileExtension(filename);
        List<String> allowedExtensions = Arrays.asList(videoAllowedTypes.split(","));
        return allowedExtensions.contains(extension.toLowerCase());
    }

    private String getFileExtension(String filename) {
        int lastDotIndex = filename.lastIndexOf('.');
        if (lastDotIndex == -1 || lastDotIndex == filename.length() - 1) {
            return "";
        }
        return filename.substring(lastDotIndex + 1);
    }
}
