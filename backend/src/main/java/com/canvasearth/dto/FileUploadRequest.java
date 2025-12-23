package com.canvasearth.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for file upload request parameters.
 * Groups multiple parameters into a single object to improve readability and maintainability.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FileUploadRequest {

    /**
     * Object type (IMAGE or VIDEO)
     */
    @NotNull(message = "Object type is required")
    private String objectType;

    /**
     * X coordinate position on the canvas
     */
    @NotNull(message = "Position X is required")
    private Double positionX;

    /**
     * Y coordinate position on the canvas
     */
    @NotNull(message = "Position Y is required")
    private Double positionY;

    /**
     * Width of the object in pixels
     */
    @NotNull(message = "Width is required")
    @Positive(message = "Width must be positive")
    private Double width;

    /**
     * Height of the object in pixels
     */
    @NotNull(message = "Height is required")
    @Positive(message = "Height must be positive")
    private Double height;

    /**
     * Z-index for layering (optional, defaults to 0)
     */
    private Integer zIndex;

    /**
     * User ID (optional)
     */
    private Long userId;
}
