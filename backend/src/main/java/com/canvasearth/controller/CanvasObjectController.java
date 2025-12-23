package com.canvasearth.controller;

import com.canvasearth.dto.CanvasObjectRequest;
import com.canvasearth.dto.CanvasObjectResponse;
import com.canvasearth.dto.CanvasObjectUpdateRequest;
import com.canvasearth.dto.FileUploadRequest;
import com.canvasearth.service.CanvasObjectService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/objects")
@RequiredArgsConstructor
@Tag(name = "Canvas Objects", description = "Canvas object management APIs")
public class CanvasObjectController {

    private static final String CANVAS_TOPIC = "/topic/canvas";

    private final CanvasObjectService canvasObjectService;
    private final SimpMessagingTemplate messagingTemplate;

    @GetMapping
    @Operation(summary = "Get objects in viewport",
               description = "Retrieve all canvas objects within the specified viewport bounds. If no parameters are provided, returns all objects.")
    public ResponseEntity<List<CanvasObjectResponse>> getObjectsInViewport(
            @Parameter(description = "Minimum X coordinate") @RequestParam(required = false) Double minX,
            @Parameter(description = "Minimum Y coordinate") @RequestParam(required = false) Double minY,
            @Parameter(description = "Maximum X coordinate") @RequestParam(required = false) Double maxX,
            @Parameter(description = "Maximum Y coordinate") @RequestParam(required = false) Double maxY) {

        List<CanvasObjectResponse> objects = canvasObjectService
                .getObjectsInViewport(minX, minY, maxX, maxY);

        return ResponseEntity.ok(objects);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get object by ID",
               description = "Retrieve a single canvas object by its ID")
    public ResponseEntity<CanvasObjectResponse> getObjectById(
            @Parameter(description = "Object ID") @PathVariable Long id) {

        CanvasObjectResponse object = canvasObjectService.getObjectById(id);
        return ResponseEntity.ok(object);
    }

    @PostMapping
    @Operation(summary = "Create object",
               description = "Create a new canvas object")
    public ResponseEntity<CanvasObjectResponse> createObject(
            @Valid @RequestBody CanvasObjectRequest request) {

        CanvasObjectResponse created = canvasObjectService.createObject(request);

        broadcastCreate(created);

        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update object",
               description = "Update position, size, or other properties of a canvas object")
    public ResponseEntity<CanvasObjectResponse> updateObject(
            @Parameter(description = "Object ID") @PathVariable Long id,
            @Valid @RequestBody CanvasObjectUpdateRequest request) {

        CanvasObjectResponse updated = canvasObjectService.updateObject(id, request);

        broadcastUpdate(updated);

        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete object",
               description = "Delete a canvas object by its ID")
    public ResponseEntity<Void> deleteObject(
            @Parameter(description = "Object ID") @PathVariable Long id) {

        canvasObjectService.deleteObject(id);

        broadcastDelete(id);

        return ResponseEntity.noContent().build();
    }

    @PostMapping("/upload")
    @Operation(summary = "Upload file",
               description = "Upload image or video file and create canvas object")
    public ResponseEntity<CanvasObjectResponse> uploadFile(
            @RequestParam("file") MultipartFile file,
            @Valid @ModelAttribute FileUploadRequest request) throws IOException {

        CanvasObjectResponse created = canvasObjectService.uploadFile(
                file,
                request.getObjectType(),
                request.getPositionX(),
                request.getPositionY(),
                request.getWidth(),
                request.getHeight(),
                request.getZIndex(),
                request.getUserId());

        broadcastCreate(created);

        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // Helper methods for WebSocket broadcasting
    private void broadcastCreate(CanvasObjectResponse object) {
        broadcastChange("CREATE", object, null);
    }

    private void broadcastUpdate(CanvasObjectResponse object) {
        broadcastChange("UPDATE", object, null);
    }

    private void broadcastDelete(Long objectId) {
        broadcastChange("DELETE", null, objectId);
    }

    private void broadcastChange(String type, CanvasObjectResponse object, Long objectId) {
        Map<String, Object> message = new HashMap<>();
        message.put("type", type);

        if (object != null) {
            message.put("object", object);
        }
        if (objectId != null) {
            message.put("objectId", objectId);
        }

        messagingTemplate.convertAndSend(CANVAS_TOPIC, message);
    }
}
