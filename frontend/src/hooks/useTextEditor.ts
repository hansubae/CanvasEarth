import { useState, useEffect, useCallback } from 'react';
import { useCanvasStore } from '../stores/canvasStore';
import { useUpdateObject } from './useCanvasObjects';
import { ObjectType } from '../types';

interface TextEditorState {
  id: number;
  text: string;
  fontSize: number;
  fontWeight: string;
  textColor: string;
  canvasX: number;
  canvasY: number;
  width: number;
}

/**
 * Custom hook for managing text editing state and operations
 *
 * Responsibilities:
 * - Track text editing state
 * - Open/close text editor when selecting TEXT objects
 * - Save text changes to backend
 * - Cancel text editing
 * - Coordinate with object selection
 */
/**
 * Custom hook for managing text editing state and operations
 *
 * Note: This hook needs access to objects array to find the selected text object.
 * Objects should be passed as a parameter from the parent component.
 */
export const useTextEditor = (objects: any[] = []) => {
  const { selectedObjectId, setSelectedObjectId } = useCanvasStore();
  const [editingText, setEditingText] = useState<TextEditorState | null>(null);

  // React Query mutation
  const { mutateAsync: updateObject } = useUpdateObject();

  /**
   * Open text editor when a TEXT object is selected
   */
  useEffect(() => {
    if (selectedObjectId === null) {
      // Close text editor when deselecting
      setEditingText(null);
      return;
    }

    const selectedObject = objects.find((obj) => obj.id === selectedObjectId);

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

  /**
   * Save text changes and close editor
   */
  const handleTextSave = useCallback(
    async (
      text: string,
      fontSize: number,
      fontWeight: string,
      textColor: string,
      width: number,
      height: number
    ) => {
      if (!editingText) return;

      try {
        await updateObject({
          id: editingText.id,
          request: {
            contentUrl: text,
            fontSize,
            fontWeight,
            textColor,
            width,
            height,
          },
        });
        // Deselect to close the editor and prevent it from reopening
        setSelectedObjectId(null);
        setEditingText(null);
      } catch (error) {
        console.error('Failed to update text:', error);
        throw error;
      }
    },
    [editingText, updateObject, setSelectedObjectId]
  );

  /**
   * Cancel text editing and close editor
   */
  const handleTextCancel = useCallback(() => {
    // Deselect to close the editor
    setSelectedObjectId(null);
    setEditingText(null);
  }, [setSelectedObjectId]);

  return {
    editingText,
    handleTextSave,
    handleTextCancel,
  };
};
