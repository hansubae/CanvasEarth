package com.canvasearth.dto;

import com.canvasearth.entity.ObjectType;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CanvasObjectRequest {

    @NotNull(message = "Object type is required")
    private ObjectType objectType;

    private String contentUrl;

    @NotNull(message = "Position X is required")
    private Double positionX;

    @NotNull(message = "Position Y is required")
    private Double positionY;

    @NotNull(message = "Width is required")
    private Double width;

    @NotNull(message = "Height is required")
    private Double height;

    private Integer zIndex;

    private Long userId;

    // Text styling properties
    private Integer fontSize;
    private String fontWeight;
    private String textColor;
}
