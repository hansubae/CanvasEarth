import { useMemo } from 'react';
import Konva from 'konva';

interface UseGridRendererProps {
  /**
   * Reference to the Konva Stage
   */
  stageRef: React.RefObject<Konva.Stage>;

  /**
   * Grid cell size in pixels
   */
  gridSize?: number;

  /**
   * Grid line color
   */
  gridColor?: string;

  /**
   * Viewport dimensions
   */
  dimensions: {
    width: number;
    height: number;
  };

  /**
   * Whether grid is enabled
   */
  enabled: boolean;
}

const DEFAULT_GRID_SIZE = 50;
const DEFAULT_GRID_COLOR = '#e0e0e0';

/**
 * Custom hook for generating grid lines for canvas background
 *
 * Responsibilities:
 * - Calculate visible grid lines based on viewport
 * - Generate vertical and horizontal lines
 * - Scale line width inversely with zoom level
 * - Optimize by only rendering visible grid area
 *
 * Performance:
 * - Uses useMemo to avoid regenerating on every render
 * - Only calculates grid lines within viewport bounds
 * - Scales line width to maintain visual consistency at all zoom levels
 */
export const useGridRenderer = ({
  stageRef,
  gridSize = DEFAULT_GRID_SIZE,
  gridColor = DEFAULT_GRID_COLOR,
  dimensions,
  enabled,
}: UseGridRendererProps) => {
  const gridLines = useMemo(() => {
    if (!enabled || !stageRef.current) {
      return [];
    }

    const stage = stageRef.current;
    const scale = stage.scaleX();
    const stagePos = stage.position();

    // Calculate viewport bounds in canvas coordinates
    const startX = Math.floor((-stagePos.x / scale) / gridSize) * gridSize;
    const endX = Math.ceil((-stagePos.x / scale + dimensions.width / scale) / gridSize) * gridSize;
    const startY = Math.floor((-stagePos.y / scale) / gridSize) * gridSize;
    const endY = Math.ceil((-stagePos.y / scale + dimensions.height / scale) / gridSize) * gridSize;

    const lines = [];

    // Generate vertical lines
    for (let x = startX; x <= endX; x += gridSize) {
      lines.push({
        key: `v-${x}`,
        points: [x, startY, x, endY],
        stroke: gridColor,
        strokeWidth: 1 / scale,
        listening: false,
      });
    }

    // Generate horizontal lines
    for (let y = startY; y <= endY; y += gridSize) {
      lines.push({
        key: `h-${y}`,
        points: [startX, y, endX, y],
        stroke: gridColor,
        strokeWidth: 1 / scale,
        listening: false,
      });
    }

    return lines;
  }, [stageRef, gridSize, gridColor, dimensions, enabled]);

  return { gridLines };
};
