import { useEffect } from 'react';

interface UseKeyboardShortcutsProps {
  /**
   * Callback when Delete or Backspace key is pressed
   */
  onDelete?: () => void;

  /**
   * Callback when Ctrl/Cmd + C is pressed
   */
  onCopy?: () => void;

  /**
   * Callback when Ctrl/Cmd + V is pressed
   */
  onPaste?: () => void;

  /**
   * Callback when Escape key is pressed
   */
  onEscape?: () => void;

  /**
   * When true, keyboard shortcuts are disabled
   * Useful when editing text or in input fields
   */
  disabled?: boolean;
}

/**
 * Custom hook for handling keyboard shortcuts
 *
 * Responsibilities:
 * - Listen for keyboard events
 * - Execute callbacks based on key combinations
 * - Respect disabled state (e.g., during text editing)
 * - Cleanup event listeners on unmount
 *
 * Supported shortcuts:
 * - Delete/Backspace: Delete selected object
 * - Ctrl/Cmd + C: Copy selected object
 * - Ctrl/Cmd + V: Paste copied object
 * - Escape: Deselect or cancel current action
 */
export const useKeyboardShortcuts = ({
  onDelete,
  onCopy,
  onPaste,
  onEscape,
  disabled = false,
}: UseKeyboardShortcutsProps) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle shortcuts when disabled
      if (disabled) {
        return;
      }

      // Delete/Backspace - Delete selected object
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (onDelete) {
          e.preventDefault();
          onDelete();
        }
      }

      // Ctrl/Cmd + C - Copy
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        if (onCopy) {
          e.preventDefault();
          onCopy();
        }
      }

      // Ctrl/Cmd + V - Paste
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        if (onPaste) {
          e.preventDefault();
          onPaste();
        }
      }

      // Escape - Cancel/Deselect
      if (e.key === 'Escape') {
        if (onEscape) {
          e.preventDefault();
          onEscape();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [disabled, onDelete, onCopy, onPaste, onEscape]);
};
