import { useRef, useEffect, useState, useCallback } from 'react';
import { Stage, Layer, Line } from 'react-konva';
import Konva from 'konva';
import { useQueryClient } from '@tanstack/react-query';
import { useCanvasStore } from '../stores/canvasStore';
import { CanvasObjectComponent } from './CanvasObject';
import { Toolbar } from './Toolbar';
import { YouTubeOverlay } from './YouTubeOverlay';
import { DropZone } from './DropZone';
import { TextEditor } from './TextEditor';
import { ViewportBounds, CanvasObject } from '../types';
import { useWebSocket } from '../hooks/useWebSocket';
import { useCanvasObjects, canvasQueryKeys } from '../hooks/useCanvasObjects';
import { useCanvasInteraction } from '../hooks/useCanvasInteraction';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useGridRenderer } from '../hooks/useGridRenderer';
import { useObjectOperations } from '../hooks/useObjectOperations';
import { useTextEditor } from '../hooks/useTextEditor';
import { useYouTubePlayer } from '../hooks/useYouTubePlayer';

const STAGE_WIDTH = window.innerWidth;
const STAGE_HEIGHT = window.innerHeight;
const MIN_SCALE = 0.1;
const MAX_SCALE = 5;
const GRID_SIZE = 50; // Grid cell size in pixels

export const InfiniteCanvas = () => {
  const stageRef = useRef<Konva.Stage>(null);
  const [dimensions, setDimensions] = useState({
    width: STAGE_WIDTH,
    height: STAGE_HEIGHT,
  });

  const {
    selectedObjectId,
    setSelectedObjectId,
    isLoading,
    setIsLoading: _setIsLoading,
    showGrid,
    toggleGrid,
  } = useCanvasStore();

  const queryClient = useQueryClient();

  // Viewport bounds for fetching objects
  const [viewportBounds, setViewportBounds] = useState<ViewportBounds>({
    minX: 0,
    minY: 0,
    maxX: dimensions.width,
    maxY: dimensions.height,
  });

  // Fetch objects from React Query (Single Source of Truth)
  const { data: objects = [] } = useCanvasObjects(viewportBounds);

  // Custom hooks for separated concerns
  const { canvasState, handleWheel, handleDragEnd } = useCanvasInteraction({
    stageRef,
    minScale: MIN_SCALE,
    maxScale: MAX_SCALE,
  });

  const { gridLines } = useGridRenderer({
    stageRef,
    gridSize: GRID_SIZE,
    dimensions,
    enabled: showGrid,
  });

  const {
    handleAddText,
    handleAddYouTube,
    handleAddImage,
    handleObjectDragEnd,
    handleObjectTransformEnd,
    handleDeleteObject,
  } = useObjectOperations({
    stageRef,
    dimensions,
  });

  const { editingText, handleTextSave, handleTextCancel } = useTextEditor(objects);

  const { playingVideos, removeVideo } = useYouTubePlayer();

  // Debounce timer for viewport fetch
  const fetchTimerRef = useRef<number | null>(null);

  // WebSocket message handler - Updates React Query cache directly
  const handleWebSocketMessage = useCallback(
    (message: {
      type: 'CREATE' | 'UPDATE' | 'DELETE';
      object?: CanvasObject;
      objectId?: number;
    }) => {
      console.log('[InfiniteCanvas] Processing WebSocket message:', message);

      // Update React Query cache (Single Source of Truth)
      queryClient.setQueriesData<CanvasObject[]>(
        { queryKey: canvasQueryKeys.all },
        (old) => {
          if (!old) return old;

          if (message.type === 'CREATE' && message.object) {
            // Add new object if not already exists
            if (old.find((obj) => obj.id === message.object!.id)) {
              return old;
            }
            return [...old, message.object];
          }

          if (message.type === 'UPDATE' && message.object) {
            // Update existing object
            return old.map((obj) =>
              obj.id === message.object!.id ? message.object! : obj
            );
          }

          if (message.type === 'DELETE' && message.objectId) {
            // Remove deleted object
            return old.filter((obj) => obj.id !== message.objectId);
          }

          return old;
        }
      );

      // Deselect if deleted object was selected
      if (message.type === 'DELETE' && message.objectId === selectedObjectId) {
        setSelectedObjectId(null);
      }
    },
    [queryClient, selectedObjectId, setSelectedObjectId]
  );

  // Connect to WebSocket
  useWebSocket({
    onMessage: handleWebSocketMessage,
    enabled: true,
  });

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate and update viewport bounds
  const updateViewportBounds = useCallback(() => {
    if (!stageRef.current) return;

    const stage = stageRef.current;
    const scale = stage.scaleX();
    const x = stage.x();
    const y = stage.y();

    // Calculate viewport bounds in canvas coordinates
    const bounds: ViewportBounds = {
      minX: -x / scale,
      minY: -y / scale,
      maxX: (-x + dimensions.width) / scale,
      maxY: (-y + dimensions.height) / scale,
    };

    setViewportBounds(bounds);
  }, [dimensions.width, dimensions.height]);

  // Debounced viewport bounds update
  useEffect(() => {
    // Clear previous timer
    if (fetchTimerRef.current) {
      clearTimeout(fetchTimerRef.current);
    }

    // Set new timer (300ms debounce)
    fetchTimerRef.current = setTimeout(() => {
      updateViewportBounds();
    }, 300);

    // Cleanup on unmount or canvasState change
    return () => {
      if (fetchTimerRef.current) {
        clearTimeout(fetchTimerRef.current);
      }
    };
  }, [canvasState, updateViewportBounds]);


  // Handle object selection
  const handleObjectSelect = useCallback((id: number) => {
    setSelectedObjectId(id);
  }, [setSelectedObjectId]);

  // Deselect when clicking on empty space
  const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.target === stageRef.current) {
      setSelectedObjectId(null);
    }
  }, [setSelectedObjectId]);

  // Handle image drop from DropZone
  const handleImageDrop = useCallback(async (file: File, clientX: number, clientY: number) => {
    const stage = stageRef.current;
    if (!stage) return;

    const scale = stage.scaleX();
    const stagePos = stage.position();
    const dropX = (clientX - stagePos.x) / scale;
    const dropY = (clientY - stagePos.y) / scale;

    try {
      await handleAddImage(file, { x: dropX, y: dropY });
    } catch (error) {
      alert('Failed to upload image. Please try again.');
    }
  }, [handleAddImage]);

  // Handle adding YouTube object with prompt
  const handleAddYouTubeWithPrompt = useCallback(async () => {
    const youtubeUrl = prompt('Enter YouTube URL:');
    if (!youtubeUrl) return;

    try {
      await handleAddYouTube(youtubeUrl);
    } catch (error) {
      alert('Failed to create YouTube object. Please try again.');
    }
  }, [handleAddYouTube]);

  // Handle delete selected object
  const handleDeleteSelected = useCallback(async () => {
    if (selectedObjectId === null) return;

    try {
      await handleDeleteObject(selectedObjectId);
    } catch (error) {
      alert('Failed to delete object. Please try again.');
    }
  }, [selectedObjectId, handleDeleteObject]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onDelete: handleDeleteSelected,
    disabled: editingText !== null, // Disable when editing text
  });



  return (
    <DropZone onImageDrop={handleImageDrop}>
      <div
        style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}
      >
        <Toolbar
        onAddText={handleAddText}
        onAddYouTube={handleAddYouTubeWithPrompt}
        onAddImage={handleAddImage}
        onDeleteSelected={handleDeleteSelected}
        hasSelection={selectedObjectId !== null}
        showGrid={showGrid}
        onToggleGrid={toggleGrid}
      />
      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        draggable
        scaleX={canvasState.scale}
        scaleY={canvasState.scale}
        x={canvasState.x}
        y={canvasState.y}
        onWheel={handleWheel}
        onDragEnd={handleDragEnd}
        onClick={handleStageClick}
        onTap={handleStageClick}
      >
        {/* Grid Layer (Background) */}
        {showGrid && (
          <Layer listening={false}>
            {gridLines.map(({ key, ...lineProps }) => (
              <Line key={key} {...lineProps} />
            ))}
          </Layer>
        )}

        {/* Objects Layer */}
        <Layer>
          {objects.map((obj) => (
            <CanvasObjectComponent
              key={obj.id}
              object={obj}
              isSelected={obj.id === selectedObjectId}
              onSelect={() => handleObjectSelect(obj.id)}
              onDragEnd={(x, y) => handleObjectDragEnd(obj.id, x, y)}
              onTransformEnd={(w, h) => handleObjectTransformEnd(obj.id, w, h)}
            />
          ))}
        </Layer>
      </Stage>
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            background: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '4px',
          }}
        >
          Loading...
        </div>
      )}

      {playingVideos.map((video) => (
        <YouTubeOverlay
          key={video.id}
          videoId={video.videoId}
          objectId={video.objectId}
          stageRef={stageRef}
          onClose={() => removeVideo(video.id)}
        />
      ))}

      {editingText && (
        <TextEditor
          initialText={editingText.text}
          initialFontSize={editingText.fontSize}
          initialFontWeight={editingText.fontWeight}
          initialTextColor={editingText.textColor}
          canvasX={editingText.canvasX}
          canvasY={editingText.canvasY}
          objectWidth={editingText.width}
          stageRef={stageRef}
          onSave={handleTextSave}
          onCancel={handleTextCancel}
        />
      )}
      </div>
    </DropZone>
  );
};
