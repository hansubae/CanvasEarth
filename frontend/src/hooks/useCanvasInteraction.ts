import { useCallback } from 'react';
import Konva from 'konva';
import { useCanvasStore } from '../stores/canvasStore';

interface UseCanvasInteractionProps {
  stageRef: React.RefObject<Konva.Stage>;
  minScale?: number;
  maxScale?: number;
  scaleBy?: number;
}

const DEFAULT_MIN_SCALE = 0.1;
const DEFAULT_MAX_SCALE = 5;
const DEFAULT_SCALE_BY = 1.05;

/**
 * Custom hook for handling canvas zoom and pan interactions
 *
 * Responsibilities:
 * - Mouse wheel zoom with pointer-based scaling
 * - Stage dragging (panning)
 * - Scale limits enforcement
 * - Canvas state management
 */
export const useCanvasInteraction = ({
  stageRef,
  minScale = DEFAULT_MIN_SCALE,
  maxScale = DEFAULT_MAX_SCALE,
  scaleBy = DEFAULT_SCALE_BY,
}: UseCanvasInteractionProps) => {
  const { canvasState, setCanvasState } = useCanvasStore();

  /**
   * Handle mouse wheel zoom
   * - Zooms towards/away from cursor position
   * - Respects min/max scale limits
   */
  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();

      const stage = stageRef.current;
      if (!stage) return;

      const oldScale = stage.scaleX();
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      // Calculate mouse position in canvas coordinates
      const mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
      };

      // Determine zoom direction
      const direction = e.evt.deltaY > 0 ? -1 : 1;

      // Calculate new scale with limits
      const newScale = Math.max(
        minScale,
        Math.min(maxScale, direction > 0 ? oldScale * scaleBy : oldScale / scaleBy)
      );

      // Calculate new position to keep mouse point stationary
      const newPos = {
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      };

      // Update canvas state
      setCanvasState({
        scale: newScale,
        x: newPos.x,
        y: newPos.y,
      });

      // Apply to stage
      stage.scale({ x: newScale, y: newScale });
      stage.position(newPos);
      stage.batchDraw();
    },
    [stageRef, minScale, maxScale, scaleBy, setCanvasState]
  );

  /**
   * Handle stage drag end (panning)
   * - Only updates state if dragging the stage itself, not objects
   */
  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      // Only update canvas state if dragging the stage itself, not objects
      if (e.target === stageRef.current) {
        setCanvasState({
          ...canvasState,
          x: e.target.x(),
          y: e.target.y(),
        });
      }
    },
    [stageRef, canvasState, setCanvasState]
  );

  return {
    canvasState,
    handleWheel,
    handleDragEnd,
  };
};
