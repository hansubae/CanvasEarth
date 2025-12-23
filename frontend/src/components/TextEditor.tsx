import { useState, useEffect, useRef } from 'react';
import Konva from 'konva';

interface TextEditorProps {
  initialText: string;
  initialFontSize?: number;
  initialFontWeight?: string;
  initialTextColor?: string;
  canvasX: number; // Canvas X coordinate
  canvasY: number; // Canvas Y coordinate
  objectWidth: number; // Width of the text object
  stageRef: React.RefObject<Konva.Stage>;
  onSave: (text: string, fontSize: number, fontWeight: string, textColor: string, width: number, height: number) => void;
  onCancel: () => void;
}

export const TextEditor = ({
  initialText,
  initialFontSize = 16,
  initialFontWeight = 'normal',
  initialTextColor = '#333333',
  canvasX,
  canvasY,
  objectWidth,
  stageRef,
  onSave,
  onCancel,
}: TextEditorProps) => {
  const [text, setText] = useState(initialText);
  const [fontSize, setFontSize] = useState(initialFontSize);
  const [fontWeight, setFontWeight] = useState(initialFontWeight);
  const [textColor, setTextColor] = useState(initialTextColor);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Focus textarea on mount
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, []);

  // Update screen position in real-time by directly manipulating DOM
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    let animationFrameId: number | null = null;
    let isMounted = true; // Track component mount state
    const editorMargin = 20; // Space between text object and editor

    const updatePosition = () => {
      // Stop if component is unmounted
      if (!isMounted) return;

      if (stageRef.current && editor) {
        const stage = stageRef.current;
        const scale = stage.scaleX();
        const stagePos = stage.position();

        const screenX = canvasX * scale + stagePos.x;
        const screenY = canvasY * scale + stagePos.y;
        const scaledWidth = objectWidth * scale;

        const editorWidth = editor.offsetWidth || 320; // Default width
        const editorHeight = editor.offsetHeight || 400; // Approximate height

        // Try to position to the right first
        let editorX = screenX + scaledWidth + editorMargin;
        let editorY = screenY;

        // Check if editor goes off screen on the right
        if (editorX + editorWidth > window.innerWidth) {
          // Try positioning to the left instead
          editorX = screenX - editorWidth - editorMargin;

          // If still off screen on the left, clamp to screen
          if (editorX < 0) {
            editorX = Math.max(10, Math.min(window.innerWidth - editorWidth - 10, screenX));
          }
        }

        // Check if editor goes off screen on the bottom
        if (editorY + editorHeight > window.innerHeight) {
          editorY = Math.max(10, window.innerHeight - editorHeight - 10);
        }

        // Check if editor goes off screen on the top
        if (editorY < 0) {
          editorY = 10;
        }

        // Direct DOM manipulation - no React state, no re-render lag
        editor.style.left = `${editorX}px`;
        editor.style.top = `${editorY}px`;
      }

      // Schedule next frame only if still mounted
      if (isMounted) {
        animationFrameId = requestAnimationFrame(updatePosition);
      }
    };

    animationFrameId = requestAnimationFrame(updatePosition);

    return () => {
      // Set unmount flag to stop recursive calls
      isMounted = false;

      // Cancel any pending animation frame
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    };
  }, [canvasX, canvasY, objectWidth, stageRef]);

  const handleSave = () => {
    if (text.trim()) {
      // Create temporary canvas to measure text dimensions
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (ctx) {
        // Set font to match the text style
        ctx.font = `${fontWeight} ${fontSize}px Arial, sans-serif`;

        // Split text by newlines
        const lines = text.split('\n');

        // Measure each line and find the widest
        let maxWidth = 0;
        for (const line of lines) {
          const metrics = ctx.measureText(line);
          maxWidth = Math.max(maxWidth, metrics.width);
        }

        // Calculate dimensions with padding
        const padding = 20;
        const lineHeight = fontSize * 1.4; // Line height multiplier
        const newWidth = Math.max(200, maxWidth + padding * 2); // Minimum 200px
        const newHeight = Math.max(50, lines.length * lineHeight + padding * 2); // Minimum 50px

        onSave(text, fontSize, fontWeight, textColor, newWidth, newHeight);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    } else if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    }
  };

  return (
    <div
      ref={editorRef}
      style={{
        position: 'fixed',
        // left and top are set via direct DOM manipulation in useEffect
        left: 0,
        top: 0,
        width: '320px',
        minWidth: '320px',
        zIndex: 10000,
        backgroundColor: 'white',
        border: '2px solid #4F46E5',
        borderRadius: '8px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Text Input */}
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        style={{
          width: '100%',
          minHeight: '80px',
          padding: '8px',
          fontSize: `${fontSize}px`,
          fontWeight: fontWeight,
          color: textColor,
          border: '1px solid #D1D5DB',
          borderRadius: '4px',
          resize: 'vertical',
          fontFamily: 'inherit',
        }}
        placeholder="Enter text..."
      />

      {/* Font Controls */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        {/* Font Size */}
        <div style={{ flex: '1', minWidth: '120px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>
            Font Size
          </label>
          <select
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            style={{
              width: '100%',
              padding: '6px',
              border: '1px solid #D1D5DB',
              borderRadius: '4px',
              fontSize: '14px',
            }}
          >
            <option value={12}>12px</option>
            <option value={14}>14px</option>
            <option value={16}>16px</option>
            <option value={18}>18px</option>
            <option value={20}>20px</option>
            <option value={24}>24px</option>
            <option value={28}>28px</option>
            <option value={32}>32px</option>
            <option value={36}>36px</option>
            <option value={48}>48px</option>
            <option value={64}>64px</option>
          </select>
        </div>

        {/* Font Weight */}
        <div style={{ flex: '1', minWidth: '120px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>
            Font Weight
          </label>
          <select
            value={fontWeight}
            onChange={(e) => setFontWeight(e.target.value)}
            style={{
              width: '100%',
              padding: '6px',
              border: '1px solid #D1D5DB',
              borderRadius: '4px',
              fontSize: '14px',
            }}
          >
            <option value="normal">Normal</option>
            <option value="bold">Bold</option>
          </select>
        </div>

        {/* Text Color */}
        <div style={{ flex: '1', minWidth: '120px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>
            Text Color
          </label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="color"
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
              style={{
                width: '40px',
                height: '32px',
                border: '1px solid #D1D5DB',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            />
            <input
              type="text"
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
              style={{
                flex: 1,
                padding: '6px',
                border: '1px solid #D1D5DB',
                borderRadius: '4px',
                fontSize: '14px',
                fontFamily: 'monospace',
              }}
              placeholder="#000000"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
        <button
          onClick={onCancel}
          style={{
            padding: '8px 16px',
            backgroundColor: '#F3F4F6',
            color: '#374151',
            border: 'none',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#E5E7EB')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#F3F4F6')}
        >
          Cancel (Esc)
        </button>
        <button
          onClick={handleSave}
          style={{
            padding: '8px 16px',
            backgroundColor: '#4F46E5',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#4338CA')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#4F46E5')}
        >
          Save (Ctrl+Enter)
        </button>
      </div>

      {/* Hint */}
      <div style={{ fontSize: '11px', color: '#9CA3AF', textAlign: 'center' }}>
        Tip: Use Ctrl+Enter to save quickly
      </div>
    </div>
  );
};
