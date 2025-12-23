package com.canvasearth.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for canvas object update requests.
 * All fields are optional (for partial updates), but validated when provided.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CanvasObjectUpdateRequest {

    /**
     * X coordinate position on the canvas
     * Range: -1,000,000 to 1,000,000
     */
    @Min(value = -1000000, message = "Position X out of bounds (min: -1,000,000)")
    @Max(value = 1000000, message = "Position X out of bounds (max: 1,000,000)")
    private Double positionX;

    /**
     * Y coordinate position on the canvas
     * Range: -1,000,000 to 1,000,000
     */
    @Min(value = -1000000, message = "Position Y out of bounds (min: -1,000,000)")
    @Max(value = 1000000, message = "Position Y out of bounds (max: 1,000,000)")
    private Double positionY;

    /**
     * Width of the object in pixels
     * Must be positive
     */
    @Positive(message = "Width must be positive")
    private Double width;

    /**
     * Height of the object in pixels
     * Must be positive
     */
    @Positive(message = "Height must be positive")
    private Double height;

    /**
     * Z-index for layering
     * Must be non-negative
     */
    @Min(value = 0, message = "Z-index cannot be negative")
    private Integer zIndex;

    /**
     * Content URL (for images, videos)
     */
    private String contentUrl;

    /**
     * Font size in pixels
     * Range: 8 to 128
     */
    @Min(value = 8, message = "Font size too small (min: 8px)")
    @Max(value = 128, message = "Font size too large (max: 128px)")
    private Integer fontSize;

    /**
     * Font weight: "normal" or "bold"
     */
    @Pattern(regexp = "^(normal|bold)$", message = "Font weight must be 'normal' or 'bold'")
    private String fontWeight;

    /**
     * Text color in hex format (#RRGGBB)
     */
    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Text color must be in hex format (#RRGGBB)")
    private String textColor;
}
