package com.canvasearth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CanvasObjectUpdateRequest {

    private Double positionX;

    private Double positionY;

    private Double width;

    private Double height;

    private Integer zIndex;

    private String contentUrl;
}
