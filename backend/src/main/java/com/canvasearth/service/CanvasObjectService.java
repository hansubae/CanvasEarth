package com.canvasearth.service;

import com.canvasearth.dto.CanvasObjectRequest;
import com.canvasearth.dto.CanvasObjectResponse;
import com.canvasearth.dto.CanvasObjectUpdateRequest;
import com.canvasearth.entity.CanvasObject;
import com.canvasearth.entity.ObjectType;
import com.canvasearth.entity.User;
import com.canvasearth.repository.CanvasObjectRepository;
import com.canvasearth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CanvasObjectService {

    private final CanvasObjectRepository canvasObjectRepository;
    private final UserRepository userRepository;

    /**
     * Get all objects within the viewport bounds
     */
    public List<CanvasObjectResponse> getObjectsInViewport(
            Double minX, Double minY, Double maxX, Double maxY) {

        List<CanvasObject> objects = canvasObjectRepository
                .findObjectsInViewport(minX, minY, maxX, maxY);

        return objects.stream()
                .map(CanvasObjectResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Create a new canvas object
     */
    @Transactional
    public CanvasObjectResponse createObject(CanvasObjectRequest request) {
        User user = null;
        if (request.getUserId() != null) {
            user = userRepository.findById(request.getUserId())
                    .orElse(null);
        }

        CanvasObject object = CanvasObject.builder()
                .objectType(request.getObjectType())
                .contentUrl(request.getContentUrl())
                .positionX(request.getPositionX())
                .positionY(request.getPositionY())
                .width(request.getWidth())
                .height(request.getHeight())
                .zIndex(request.getZIndex() != null ? request.getZIndex() : 0)
                .fontSize(request.getFontSize())
                .fontWeight(request.getFontWeight())
                .textColor(request.getTextColor())
                .user(user)
                .build();

        CanvasObject saved = canvasObjectRepository.save(object);
        return CanvasObjectResponse.fromEntity(saved);
    }

    /**
     * Update an existing canvas object
     */
    @Transactional
    public CanvasObjectResponse updateObject(Long id, CanvasObjectUpdateRequest request) {
        CanvasObject object = canvasObjectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Object not found with id: " + id));

        if (request.getPositionX() != null) {
            object.setPositionX(request.getPositionX());
        }
        if (request.getPositionY() != null) {
            object.setPositionY(request.getPositionY());
        }
        if (request.getWidth() != null) {
            object.setWidth(request.getWidth());
        }
        if (request.getHeight() != null) {
            object.setHeight(request.getHeight());
        }
        if (request.getZIndex() != null) {
            object.setZIndex(request.getZIndex());
        }
        if (request.getContentUrl() != null) {
            object.setContentUrl(request.getContentUrl());
        }
        if (request.getFontSize() != null) {
            object.setFontSize(request.getFontSize());
        }
        if (request.getFontWeight() != null) {
            object.setFontWeight(request.getFontWeight());
        }
        if (request.getTextColor() != null) {
            object.setTextColor(request.getTextColor());
        }

        CanvasObject updated = canvasObjectRepository.save(object);
        return CanvasObjectResponse.fromEntity(updated);
    }

    /**
     * Delete a canvas object
     */
    @Transactional
    public void deleteObject(Long id) {
        if (!canvasObjectRepository.existsById(id)) {
            throw new RuntimeException("Object not found with id: " + id);
        }
        canvasObjectRepository.deleteById(id);
    }

    /**
     * Get a single object by ID
     */
    public CanvasObjectResponse getObjectById(Long id) {
        CanvasObject object = canvasObjectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Object not found with id: " + id));
        return CanvasObjectResponse.fromEntity(object);
    }

    /**
     * Upload file and create canvas object
     */
    @Transactional
    public CanvasObjectResponse uploadFile(
            MultipartFile file,
            String objectType,
            Double positionX,
            Double positionY,
            Double width,
            Double height,
            Integer zIndex,
            Long userId) throws IOException {

        // Create upload directory if it doesn't exist
        Path uploadDir = Paths.get("uploads");
        if (!Files.exists(uploadDir)) {
            Files.createDirectories(uploadDir);
        }

        // Generate unique filename
        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String filename = UUID.randomUUID().toString() + extension;
        Path filePath = uploadDir.resolve(filename);

        // Save file to disk
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        // Create URL for accessing the file
        String fileUrl = "/uploads/" + filename;

        // Get user if exists
        User user = null;
        if (userId != null) {
            user = userRepository.findById(userId).orElse(null);
        }

        // Create canvas object
        CanvasObject object = CanvasObject.builder()
                .objectType(ObjectType.valueOf(objectType))
                .contentUrl(fileUrl)
                .positionX(positionX)
                .positionY(positionY)
                .width(width)
                .height(height)
                .zIndex(zIndex != null ? zIndex : 0)
                .user(user)
                .build();

        CanvasObject saved = canvasObjectRepository.save(object);
        return CanvasObjectResponse.fromEntity(saved);
    }
}
