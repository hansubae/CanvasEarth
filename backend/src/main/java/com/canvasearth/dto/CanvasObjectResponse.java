package com.canvasearth.dto;

import com.canvasearth.entity.CanvasObject;
import com.canvasearth.entity.ObjectType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CanvasObjectResponse {

    private Long id;
    private ObjectType objectType;
    private String contentUrl;
    private Double positionX;
    private Double positionY;
    private Double width;
    private Double height;
    private Integer zIndex;
    private Long userId;
    private String username;
    private LocalDateTime createdAt;

    public static CanvasObjectResponse fromEntity(CanvasObject object) {
        return CanvasObjectResponse.builder()
                .id(object.getId())
                .objectType(object.getObjectType())
                .contentUrl(object.getContentUrl())
                .positionX(object.getPositionX())
                .positionY(object.getPositionY())
                .width(object.getWidth())
                .height(object.getHeight())
                .zIndex(object.getZIndex())
                .userId(object.getUser() != null ? object.getUser().getId() : null)
                .username(object.getUser() != null ? object.getUser().getUsername() : null)
                .createdAt(object.getCreatedAt())
                .build();
    }
}
