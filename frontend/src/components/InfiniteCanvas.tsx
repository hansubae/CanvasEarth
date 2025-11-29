import { useRef, useEffect, useState } from 'react';
import { Stage, Layer } from 'react-konva';
import Konva from 'konva';
import { useCanvasStore } from '../stores/canvasStore';
import { CanvasObjectComponent } from './CanvasObject';
import { Toolbar } from './Toolbar';
import { YouTubeOverlay } from './YouTubeOverlay';
import { VideoOverlay } from './VideoOverlay';
import { DropZone } from './DropZone';
import { canvasApi } from '../services/canvasApi';
import { ViewportBounds, ObjectType, CreateObjectRequest } from '../types';

// Helper to extract YouTube video ID
const extractYouTubeId = (url: string): string | null => {
  const regExp =
    /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[7].length === 11 ? match[7] : null;
};

const STAGE_WIDTH = window.innerWidth;
const STAGE_HEIGHT = window.innerHeight;
const MIN_SCALE = 0.1;
const MAX_SCALE = 5;

export const InfiniteCanvas = () => {
  const stageRef = useRef<Konva.Stage>(null);
  const [dimensions, setDimensions] = useState({
    width: STAGE_WIDTH,
    height: STAGE_HEIGHT,
  });

  const [playingVideo, setPlayingVideo] = useState<{
    videoId: string;
    canvasX: number; // Canvas coordinates
    canvasY: number;
    width: number;
    height: number;
  } | null>(null);

  const [playingMP4Video, setPlayingMP4Video] = useState<{
    videoUrl: string;
    canvasX: number;
    canvasY: number;
    width: number;
    height: number;
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
    setCanvasState({
      ...canvasState,
      x: e.target.x(),
      y: e.target.y(),
    });
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

  // Handle video file
  const handleVideoFile = async (file: File, x?: number, y?: number) => {
    console.log('handleVideoFile called with:', file.name, { x, y });

    const stage = stageRef.current;
    if (!stage) {
      console.log('No stage in handleVideoFile');
      return;
    }

    const scale = stage.scaleX();
    const stagePos = stage.position();

    // Use provided position or center of viewport
    const posX = x !== undefined ? x : (-stagePos.x + dimensions.width / 2) / scale;
    const posY = y !== undefined ? y : (-stagePos.y + dimensions.height / 2) / scale;

    console.log('Video will be placed at:', { posX, posY });

    // Default video size (16:9 aspect ratio)
    const width = 560;
    const height = 315;

    try {
      const created = await canvasApi.uploadFile(
        file,
        ObjectType.VIDEO,
        posX - width / 2,
        posY - height / 2,
        width,
        height,
        objects.length,
        1 // TODO: Replace with actual user ID
      );
      console.log('Video object created successfully:', created.id);
      addObject(created);
    } catch (error) {
      console.error('Failed to upload video:', error);
      alert('Failed to upload video. Please try again.');
    }
  };

  // Handle video upload from toolbar
  const handleAddVideoFromToolbar = async (file: File) => {
    await handleVideoFile(file);
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
      contentUrl: 'Double click to edit text',
      positionX: centerX - 100,
      positionY: centerY - 25,
      width: 200,
      height: 50,
      zIndex: objects.length,
      userId: 1, // TODO: Replace with actual user ID
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

  // Handle text object updates
  useEffect(() => {
    const handleUpdateText = async (e: CustomEvent) => {
      const { id, text } = e.detail;
      try {
        const updated = await canvasApi.updateObject(id, {
          contentUrl: text,
        });
        updateObject(id, updated);
      } catch (error) {
        console.error('Failed to update text:', error);
      }
    };

    window.addEventListener('updateObjectText', handleUpdateText as EventListener);
    return () => window.removeEventListener('updateObjectText', handleUpdateText as EventListener);
  }, []);

  // Handle YouTube video play
  useEffect(() => {
    const handlePlayVideo = (e: CustomEvent) => {
      const { url, position, size } = e.detail;
      const videoId = extractYouTubeId(url);
      if (videoId) {
        // Store canvas coordinates - YouTubeOverlay will track stage position in real-time
        setPlayingVideo({
          videoId,
          canvasX: position.x,
          canvasY: position.y,
          width: size.width,
          height: size.height,
        });
      }
    };

    window.addEventListener('playYouTubeVideo', handlePlayVideo as EventListener);
    return () => window.removeEventListener('playYouTubeVideo', handlePlayVideo as EventListener);
  }, []);

  // Handle MP4 video play
  useEffect(() => {
    const handlePlayMP4Video = (e: CustomEvent) => {
      const { url, position, size } = e.detail;
      setPlayingMP4Video({
        videoUrl: url,
        canvasX: position.x,
        canvasY: position.y,
        width: size.width,
        height: size.height,
      });
    };

    window.addEventListener('playVideo', handlePlayMP4Video as EventListener);
    return () => window.removeEventListener('playVideo', handlePlayMP4Video as EventListener);
  }, []);

  return (
    <DropZone onImageDrop={handleImageDrop}>
      <div
        style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}
      >
        <Toolbar
        onAddText={handleAddText}
        onAddYouTube={handleAddYouTube}
        onAddImage={handleAddImageFromToolbar}
        onAddVideo={handleAddVideoFromToolbar}
        onDeleteSelected={handleDeleteSelected}
        hasSelection={selectedObjectId !== null}
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

      {playingVideo && (
        <YouTubeOverlay
          videoId={playingVideo.videoId}
          canvasX={playingVideo.canvasX}
          canvasY={playingVideo.canvasY}
          width={playingVideo.width}
          height={playingVideo.height}
          stageRef={stageRef}
          onClose={() => setPlayingVideo(null)}
        />
      )}

      {playingMP4Video && (
        <VideoOverlay
          videoUrl={playingMP4Video.videoUrl}
          canvasX={playingMP4Video.canvasX}
          canvasY={playingMP4Video.canvasY}
          width={playingMP4Video.width}
          height={playingMP4Video.height}
          stageRef={stageRef}
          onClose={() => setPlayingMP4Video(null)}
        />
      )}
      </div>
    </DropZone>
  );
};
