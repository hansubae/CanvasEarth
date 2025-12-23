import { useCallback } from 'react';
import Konva from 'konva';
import { useCreateObject, useUpdateObject, useDeleteObject } from './useCanvasObjects';
import { canvasApi } from '../services/canvasApi';
import { ObjectType, CreateObjectRequest } from '../types';

interface UseObjectOperationsParams {
  stageRef: React.RefObject<Konva.Stage>;
  dimensions: { width: number; height: number };
}

export const useObjectOperations = ({
  stageRef,
  dimensions,
}: UseObjectOperationsParams) => {
  const createObjectMutation = useCreateObject();
  const updateObjectMutation = useUpdateObject();
  const deleteObjectMutation = useDeleteObject();

  // Calculate center position in canvas coordinates
  const getCenterPosition = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return { x: 0, y: 0 };

    const scale = stage.scaleX();
    const stagePos = stage.position();

    const centerX = (-stagePos.x + dimensions.width / 2) / scale;
    const centerY = (-stagePos.y + dimensions.height / 2) / scale;

    return { x: centerX, y: centerY };
  }, [stageRef, dimensions]);

  // 1. Add text object at viewport center
  const handleAddText = useCallback(async () => {
    const center = getCenterPosition();

    const request: CreateObjectRequest = {
      objectType: ObjectType.TEXT,
      contentUrl: 'Click to edit text',
      positionX: center.x - 100,
      positionY: center.y - 25,
      width: 200,
      height: 50,
      zIndex: 0,
      userId: 1,
      fontSize: 16,
      fontWeight: 'normal',
      textColor: '#333333',
    };

    await createObjectMutation.mutateAsync(request);
  }, [getCenterPosition, createObjectMutation]);

  // 2. Add YouTube object with URL
  const handleAddYouTube = useCallback(async (youtubeUrl: string) => {
    const center = getCenterPosition();

    const request: CreateObjectRequest = {
      objectType: ObjectType.YOUTUBE,
      contentUrl: youtubeUrl,
      positionX: center.x - 280,
      positionY: center.y - 157.5,
      width: 560,
      height: 315,
      zIndex: 0,
      userId: 1,
    };

    await createObjectMutation.mutateAsync(request);
  }, [getCenterPosition, createObjectMutation]);

  // 3. Add image object with file upload
  const handleAddImage = useCallback(async (
    file: File,
    position?: { x: number; y: number }
  ) => {
    let posX: number, posY: number;

    if (position) {
      posX = position.x;
      posY = position.y;
    } else {
      // If no position specified, use center
      const center = getCenterPosition();
      posX = center.x - 150;
      posY = center.y - 150;
    }

    // Upload file to backend
    await canvasApi.uploadFile(
      file,
      ObjectType.IMAGE,
      posX,
      posY,
      300, // default width
      300, // default height
      0,   // zIndex
      1    // userId (hardcoded)
    );
  }, [getCenterPosition]);

  // 4. Update object position after drag
  const handleObjectDragEnd = useCallback(async (
    id: number,
    x: number,
    y: number
  ) => {
    await updateObjectMutation.mutateAsync({
      id,
      request: { positionX: x, positionY: y },
    });
  }, [updateObjectMutation]);

  // 5. Update object size after transform
  const handleObjectTransformEnd = useCallback(async (
    id: number,
    width: number,
    height: number
  ) => {
    await updateObjectMutation.mutateAsync({
      id,
      request: { width, height },
    });
  }, [updateObjectMutation]);

  // 6. Delete object
  const handleDeleteObject = useCallback(async (id: number) => {
    await deleteObjectMutation.mutateAsync(id);
  }, [deleteObjectMutation]);

  return {
    handleAddText,
    handleAddYouTube,
    handleAddImage,
    handleObjectDragEnd,
    handleObjectTransformEnd,
    handleDeleteObject,
  };
};
