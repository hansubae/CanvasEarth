import { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Line } from 'react-konva';
import Konva from 'konva';
import { useCanvasStore } from '../stores/canvasStore';
import { CanvasObjectComponent } from './CanvasObject';
import { Toolbar } from './Toolbar';
import { YouTubeOverlay } from './YouTubeOverlay';
import { DropZone } from './DropZone';
import { TextEditor } from './TextEditor';
import { canvasApi } from '../services/canvasApi';
import { ViewportBounds, ObjectType, CreateObjectRequest } from '../types';

// Helper to extract YouTube video ID (supports regular videos and Shorts)
const extractYouTubeId = (url: string): string | null => {
  // Support for various YouTube URL formats including Shorts
  // Using non-capturing groups (?:...) to keep video ID at index 1
  const regExp =
    /^.*(?:youtu\.be\/|v\/|\/u\/\w\/|embed\/|shorts\/|watch\?v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[1] && match[1].length === 11 ? match[1] : null;
};

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

  const [playingVideos, setPlayingVideos] = useState<Array<{
    id: string; // Unique ID for each playing instance
    objectId: number; // Reference to the canvas object
    videoId: string;
  }>>([]);

  const [editingText, setEditingText] = useState<{
    id: number;
    text: string;
    fontSize: number;
    fontWeight: string;
    textColor: string;
    canvasX: number; // Canvas coordinates
    canvasY: number;
    width: number; // Object width in canvas coordinates
  } | null>(null);

  const {
    canvasState,
    setCanvasState,
    objects,
    setObjects,
    updateObject,
    addObject,
    selectedObjectId,
    setSelectedObjectId,
    isLoading,
    setIsLoading,
    showGrid,
    toggleGrid,
  } = useCanvasStore();

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

  // Fetch objects in viewport
  const fetchObjectsInViewport = async () => {
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

    try {
      setIsLoading(true);
      const fetchedObjects = await canvasApi.getObjectsInViewport(bounds);
      setObjects(fetchedObjects);
    } catch (error) {
      console.error('Failed to fetch objects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch and viewport change handler
  useEffect(() => {
    fetchObjectsInViewport();
  }, [canvasState]);

  // Handle zoom with mouse wheel
  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();

    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const scaleBy = 1.05;
    const newScale = Math.max(
      MIN_SCALE,
      Math.min(MAX_SCALE, direction > 0 ? oldScale * scaleBy : oldScale / scaleBy)
    );

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    setCanvasState({
      scale: newScale,
      x: newPos.x,
      y: newPos.y,
    });

    stage.scale({ x: newScale, y: newScale });
    stage.position(newPos);
    stage.batchDraw();
  };

  // Handle stage drag (panning)
  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    // Only update canvas state if dragging the stage itself, not objects
    if (e.target === stageRef.current) {
      setCanvasState({
        ...canvasState,
        x: e.target.x(),
        y: e.target.y(),
      });
    }
  };

  // Handle object drag
  const handleObjectDragEnd = async (id: number, x: number, y: number) => {
    try {
      const updated = await canvasApi.updateObject(id, {
        positionX: x,
        positionY: y,
      });
      updateObject(id, updated);
    } catch (error) {
      console.error('Failed to update object position:', error);
    }
  };

  // Handle object transform (resize)
  const handleObjectTransformEnd = async (
    id: number,
    width: number,
    height: number
  ) => {
    try {
      const updated = await canvasApi.updateObject(id, {
        width,
        height,
      });
      updateObject(id, updated);
    } catch (error) {
      console.error('Failed to update object size:', error);
    }
  };

  // Handle object selection
  const handleObjectSelect = (id: number) => {
    setSelectedObjectId(id);
  };

  // Deselect when clicking on empty space
  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.target === stageRef.current) {
      setSelectedObjectId(null);
    }
  };

  // Helper function to handle image file
  const handleImageFile = async (file: File, x?: number, y?: number) => {
    console.log('handleImageFile called with:', file.name, { x, y });

    const stage = stageRef.current;
    if (!stage) {
      console.log('No stage in handleImageFile');
      return;
    }

    const scale = stage.scaleX();
    const stagePos = stage.position();

    // Use provided position or center of viewport
    const posX = x !== undefined ? x : (-stagePos.x + dimensions.width / 2) / scale;
    const posY = y !== undefined ? y : (-stagePos.y + dimensions.height / 2) / scale;

    console.log('Image will be placed at:', { posX, posY });

    // Create image to get dimensions
    const img = new Image();
    const imageUrl = URL.createObjectURL(file);

    img.onload = async () => {
      console.log('Image loaded, original size:', img.width, 'x', img.height);

      // Limit max size to prevent huge images
      const maxDimension = 800;
      let width = img.width;
      let height = img.height;

      if (width > maxDimension || height > maxDimension) {
        const ratio = Math.min(maxDimension / width, maxDimension / height);
        width = width * ratio;
        height = height * ratio;
        console.log('Image resized to:', width, 'x', height);
      }

      try {
        const created = await canvasApi.uploadFile(
          file,
          ObjectType.IMAGE,
          posX - width / 2,
          posY - height / 2,
          width,
          height,
          objects.length,
          1 // TODO: Replace with actual user ID
        );
        console.log('Image object created successfully:', created.id);
        addObject(created);
      } catch (error) {
        console.error('Failed to upload image:', error);
        alert('Failed to upload image. Please try again.');
      } finally {
        URL.revokeObjectURL(imageUrl);
      }
    };

    img.onerror = (err) => {
      console.error('Image load error:', err);
      alert('Failed to load image file.');
      URL.revokeObjectURL(imageUrl);
    };

    img.src = imageUrl;
  };

  // Handle image drop from DropZone
  const handleImageDrop = async (file: File, clientX: number, clientY: number) => {
    console.log('handleImageDrop called');
    const stage = stageRef.current;
    if (!stage) return;

    const scale = stage.scaleX();
    const stagePos = stage.position();
    const dropX = (clientX - stagePos.x) / scale;
    const dropY = (clientY - stagePos.y) / scale;

    await handleImageFile(file, dropX, dropY);
  };

  // Handle image upload from toolbar
  const handleAddImageFromToolbar = async (file: File) => {
    await handleImageFile(file);
  };

  // Handle adding text object
  const handleAddText = async () => {
    const stage = stageRef.current;
    if (!stage) return;

    const scale = stage.scaleX();
    const stagePos = stage.position();

    // Place in center of current viewport
    const centerX = (-stagePos.x + dimensions.width / 2) / scale;
    const centerY = (-stagePos.y + dimensions.height / 2) / scale;

    const request: CreateObjectRequest = {
      objectType: ObjectType.TEXT,
      contentUrl: 'Click to edit text',
      positionX: centerX - 100,
      positionY: centerY - 25,
      width: 200,
      height: 50,
      zIndex: objects.length,
      userId: 1, // TODO: Replace with actual user ID
      fontSize: 16,
      fontWeight: 'normal',
      textColor: '#333333',
    };

    try {
      const created = await canvasApi.createObject(request);
      addObject(created);
    } catch (error) {
      console.error('Failed to create text object:', error);
    }
  };

  // Handle adding YouTube object
  const handleAddYouTube = async () => {
    const youtubeUrl = prompt('Enter YouTube URL:');
    if (!youtubeUrl) return;

    const stage = stageRef.current;
    if (!stage) return;

    const scale = stage.scaleX();
    const stagePos = stage.position();

    // Place in center of current viewport
    const centerX = (-stagePos.x + dimensions.width / 2) / scale;
    const centerY = (-stagePos.y + dimensions.height / 2) / scale;

    const request: CreateObjectRequest = {
      objectType: ObjectType.YOUTUBE,
      contentUrl: youtubeUrl,
      positionX: centerX - 280,
      positionY: centerY - 157.5,
      width: 560,
      height: 315,
      zIndex: objects.length,
      userId: 1, // TODO: Replace with actual user ID
    };

    try {
      const created = await canvasApi.createObject(request);
      addObject(created);
    } catch (error) {
      console.error('Failed to create YouTube object:', error);
    }
  };

  // Handle delete selected object
  const handleDeleteSelected = async () => {
    if (selectedObjectId === null) return;

    try {
      await canvasApi.deleteObject(selectedObjectId);
      useCanvasStore.getState().removeObject(selectedObjectId);
      setSelectedObjectId(null);
    } catch (error) {
      console.error('Failed to delete object:', error);
    }
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedObjectId !== null) {
          e.preventDefault();
          handleDeleteSelected();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedObjectId]);

  // Show text editor when a text object is selected
  useEffect(() => {
    if (selectedObjectId === null) {
      // Close text editor when deselecting
      setEditingText(null);
      return;
    }

    const selectedObject = objects.find(obj => obj.id === selectedObjectId);

    // Only open editor for TEXT objects
    if (selectedObject && selectedObject.objectType === ObjectType.TEXT) {
      setEditingText({
        id: selectedObject.id,
        text: selectedObject.contentUrl,
        fontSize: selectedObject.fontSize || 16,
        fontWeight: selectedObject.fontWeight || 'normal',
        textColor: selectedObject.textColor || '#333333',
        canvasX: selectedObject.positionX,
        canvasY: selectedObject.positionY,
        width: selectedObject.width,
      });
    } else {
      // Close editor if non-text object is selected
      setEditingText(null);
    }
  }, [selectedObjectId, objects]);

  // Remove a playing video by ID
  const removeVideo = (id: string) => {
    setPlayingVideos((prev) => prev.filter((video) => video.id !== id));
  };

  // Handle text editor save
  const handleTextSave = async (text: string, fontSize: number, fontWeight: string, textColor: string) => {
    if (!editingText) return;

    try {
      const updated = await canvasApi.updateObject(editingText.id, {
        contentUrl: text,
        fontSize,
        fontWeight,
        textColor,
      });
      updateObject(editingText.id, updated);
      // Deselect to close the editor and prevent it from reopening
      setSelectedObjectId(null);
      setEditingText(null);
    } catch (error) {
      console.error('Failed to update text:', error);
      alert('Failed to save text. Please try again.');
    }
  };

  // Handle text editor cancel
  const handleTextCancel = () => {
    // Deselect to close the editor
    setSelectedObjectId(null);
    setEditingText(null);
  };

  // Handle YouTube video play
  useEffect(() => {
    const handlePlayVideo = (e: CustomEvent) => {
      const { objectId, url } = e.detail;
      const videoId = extractYouTubeId(url);
      if (videoId) {
        // Generate unique ID for this playing instance
        const uniqueId = `${videoId}-${Date.now()}-${Math.random()}`;

        // Add to playing videos array - allows multiple videos to play simultaneously
        setPlayingVideos((prev) => [
          ...prev,
          {
            id: uniqueId,
            objectId,
            videoId,
          },
        ]);
      }
    };

    window.addEventListener('playYouTubeVideo', handlePlayVideo as EventListener);
    return () => window.removeEventListener('playYouTubeVideo', handlePlayVideo as EventListener);
  }, []);

  // Generate grid lines
  const generateGridLines = () => {
    if (!stageRef.current) return [];

    const stage = stageRef.current;
    const scale = stage.scaleX();
    const stagePos = stage.position();

    // Calculate viewport bounds in canvas coordinates
    const startX = Math.floor((-stagePos.x / scale) / GRID_SIZE) * GRID_SIZE;
    const endX = Math.ceil((-stagePos.x / scale + dimensions.width / scale) / GRID_SIZE) * GRID_SIZE;
    const startY = Math.floor((-stagePos.y / scale) / GRID_SIZE) * GRID_SIZE;
    const endY = Math.ceil((-stagePos.y / scale + dimensions.height / scale) / GRID_SIZE) * GRID_SIZE;

    const lines = [];

    // Vertical lines
    for (let x = startX; x <= endX; x += GRID_SIZE) {
      lines.push(
        <Line
          key={`v-${x}`}
          points={[x, startY, x, endY]}
          stroke="#e0e0e0"
          strokeWidth={1 / scale}
          listening={false}
        />
      );
    }

    // Horizontal lines
    for (let y = startY; y <= endY; y += GRID_SIZE) {
      lines.push(
        <Line
          key={`h-${y}`}
          points={[startX, y, endX, y]}
          stroke="#e0e0e0"
          strokeWidth={1 / scale}
          listening={false}
        />
      );
    }

    return lines;
  };


  return (
    <DropZone onImageDrop={handleImageDrop}>
      <div
        style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}
      >
        <Toolbar
        onAddText={handleAddText}
        onAddYouTube={handleAddYouTube}
        onAddImage={handleAddImageFromToolbar}
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
            {generateGridLines()}
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
