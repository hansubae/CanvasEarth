package com.canvasearth.controller;

import com.canvasearth.dto.CanvasObjectRequest;
import com.canvasearth.dto.CanvasObjectResponse;
import com.canvasearth.dto.CanvasObjectUpdateRequest;
import com.canvasearth.service.CanvasObjectService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/objects")
@RequiredArgsConstructor
@Tag(name = "Canvas Objects", description = "Canvas object management APIs")
public class CanvasObjectController {

    private final CanvasObjectService canvasObjectService;

    @GetMapping
    @Operation(summary = "Get objects in viewport",
               description = "Retrieve all canvas objects within the specified viewport bounds")
    public ResponseEntity<List<CanvasObjectResponse>> getObjectsInViewport(
            @Parameter(description = "Minimum X coordinate") @RequestParam Double minX,
            @Parameter(description = "Minimum Y coordinate") @RequestParam Double minY,
            @Parameter(description = "Maximum X coordinate") @RequestParam Double maxX,
            @Parameter(description = "Maximum Y coordinate") @RequestParam Double maxY) {

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
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update object",
               description = "Update position, size, or other properties of a canvas object")
    public ResponseEntity<CanvasObjectResponse> updateObject(
            @Parameter(description = "Object ID") @PathVariable Long id,
            @RequestBody CanvasObjectUpdateRequest request) {

        CanvasObjectResponse updated = canvasObjectService.updateObject(id, request);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete object",
               description = "Delete a canvas object by its ID")
    public ResponseEntity<Void> deleteObject(
            @Parameter(description = "Object ID") @PathVariable Long id) {

        canvasObjectService.deleteObject(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/upload")
    @Operation(summary = "Upload file",
               description = "Upload image or video file and create canvas object")
    public ResponseEntity<CanvasObjectResponse> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("objectType") String objectType,
            @RequestParam("positionX") Double positionX,
            @RequestParam("positionY") Double positionY,
            @RequestParam("width") Double width,
            @RequestParam("height") Double height,
            @RequestParam("zIndex") Integer zIndex,
            @RequestParam("userId") Long userId) throws IOException {

        CanvasObjectResponse created = canvasObjectService.uploadFile(
                file, objectType, positionX, positionY, width, height, zIndex, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
}
