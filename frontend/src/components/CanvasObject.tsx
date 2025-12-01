import { useRef, useEffect, useState } from 'react';
import { Image, Text, Transformer, Group, Rect } from 'react-konva';
import useImage from 'use-image';
import { CanvasObject as CanvasObjectType, ObjectType } from '../types';
import Konva from 'konva';

interface CanvasObjectProps {
  object: CanvasObjectType;
  isSelected: boolean;
  onSelect: () => void;
  onDragEnd: (x: number, y: number) => void;
  onTransformEnd: (width: number, height: number) => void;
  onDoubleClick?: () => void;
}

// Image component wrapper with image loading
const ImageObject = ({ url, width, height }: { url: string; width: number; height: number }) => {
  const [image] = useImage(url);
  return <Image image={image} width={width} height={height} />;
};

// Text component for text objects
const TextObject = ({
  text,
  width,
  height,
  isEditing,
  onTextChange,
  fontSize = 16,
  fontWeight = 'normal',
  textColor = '#333',
}: {
  text: string;
  width: number;
  height: number;
  isEditing: boolean;
  onTextChange?: (text: string) => void;
  fontSize?: number;
  fontWeight?: string;
  textColor?: string;
}) => {
  if (isEditing && onTextChange) {
    // In edit mode - show HTML input (handled by parent)
    return null;
  }

  return (
    <Text
      text={text}
      fontSize={fontSize}
      fontStyle={fontWeight}
      width={width}
      height={height}
      align="left"
      verticalAlign="top"
      padding={10}
      fill={textColor}
    />
  );
};

// Extract YouTube video ID from URL (supports regular videos and Shorts)
const extractYouTubeId = (url: string): string | null => {
  // Support for various YouTube URL formats including Shorts
  // Using non-capturing groups (?:...) to keep video ID at index 1
  const regExp =
    /^.*(?:youtu\.be\/|v\/|\/u\/\w\/|embed\/|shorts\/|watch\?v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[1] && match[1].length === 11 ? match[1] : null;
};

// YouTube embed component with thumbnail
const YouTubeObject = ({ url, width, height }: { url: string; width: number; height: number }) => {
  const videoId = extractYouTubeId(url);
  const thumbnailUrl = videoId
    ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
    : '';

  const [thumbnail] = useImage(thumbnailUrl);

  return (
    <Group>
      <Rect width={width} height={height} fill="#000" cornerRadius={8} />
      {thumbnail ? (
        <Image image={thumbnail} width={width} height={height} cornerRadius={8} />
      ) : (
        <Text
          text="▶ YouTube Video"
          fontSize={20}
          fill="#fff"
          width={width}
          height={height}
          align="center"
          verticalAlign="middle"
        />
      )}
      {/* Play button overlay */}
      <Group x={width / 2 - 30} y={height / 2 - 20}>
        <Rect
          width={60}
          height={40}
          fill="red"
          cornerRadius={5}
          opacity={0.8}
        />
        <Text
          text="▶"
          fontSize={24}
          fill="#fff"
          width={60}
          height={40}
          align="center"
          verticalAlign="middle"
        />
      </Group>
    </Group>
  );
};

export const CanvasObjectComponent = ({
  object,
  isSelected,
  onSelect,
  onDragEnd,
  onTransformEnd,
  onDoubleClick,
}: CanvasObjectProps) => {
  const shapeRef = useRef<Konva.Group>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (isSelected && !isDragging && transformerRef.current && shapeRef.current) {
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected, isDragging]);

  const handleDragStart = (e: Konva.KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true; // Stop event propagation to stage
    setIsDragging(true);
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true; // Stop event propagation to stage
    setIsDragging(false);
    onDragEnd(e.target.x(), e.target.y());
  };

  const handleTransformEnd = () => {
    if (shapeRef.current) {
      const node = shapeRef.current;
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();

      // Reset scale
      node.scaleX(1);
      node.scaleY(1);

      const newWidth = Math.max(5, node.width() * scaleX);
      const newHeight = Math.max(5, node.height() * scaleY);

      onTransformEnd(newWidth, newHeight);
    }
  };

  const handleDoubleClick = () => {
    if (object.objectType === ObjectType.YOUTUBE) {
      // Play YouTube video in overlay
      window.dispatchEvent(new CustomEvent('playYouTubeVideo', {
        detail: {
          url: object.contentUrl,
          position: { x: object.positionX, y: object.positionY },
          size: { width: object.width, height: object.height }
        }
      }));
    }
    // Text editing is now handled by selection (single click) in InfiniteCanvas
  };

  const renderContent = () => {
    switch (object.objectType) {
      case ObjectType.IMAGE:
        return (
          <ImageObject
            url={object.contentUrl}
            width={object.width}
            height={object.height}
          />
        );
      case ObjectType.TEXT:
        return (
          <TextObject
            text={object.contentUrl}
            width={object.width}
            height={object.height}
            isEditing={isEditing}
            fontSize={object.fontSize}
            fontWeight={object.fontWeight}
            textColor={object.textColor}
          />
        );
      case ObjectType.YOUTUBE:
        return (
          <YouTubeObject
            url={object.contentUrl}
            width={object.width}
            height={object.height}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Group
        ref={shapeRef}
        x={object.positionX}
        y={object.positionY}
        width={object.width}
        height={object.height}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
        onDblClick={handleDoubleClick}
        onDblTap={handleDoubleClick}
      >
        {renderContent()}
      </Group>
      {isSelected && !isDragging && (
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            // Limit minimum size
            if (newBox.width < 5 || newBox.height < 5) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </>
  );
};
