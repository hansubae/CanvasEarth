package com.canvasearth.repository;

import com.canvasearth.entity.CanvasObject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CanvasObjectRepository extends JpaRepository<CanvasObject, Long> {

    /**
     * Find all objects within the viewport bounds.
     * An object is visible if its bounding box intersects with the viewport.
     */
    @Query("SELECT o FROM CanvasObject o " +
           "WHERE o.positionX + o.width >= :minX " +
           "AND o.positionX <= :maxX " +
           "AND o.positionY + o.height >= :minY " +
           "AND o.positionY <= :maxY " +
           "ORDER BY o.zIndex ASC, o.createdAt ASC")
    List<CanvasObject> findObjectsInViewport(
            @Param("minX") Double minX,
            @Param("minY") Double minY,
            @Param("maxX") Double maxX,
            @Param("maxY") Double maxY
    );
}
