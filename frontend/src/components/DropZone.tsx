import { useState } from 'react';

interface DropZoneProps {
  onImageDrop: (file: File, x: number, y: number) => void;
  children: React.ReactNode;
}

export const DropZone = ({ onImageDrop, children }: DropZoneProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    console.log('Drag enter');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set to false if leaving the main container
    if (e.currentTarget === e.target) {
      setIsDragging(false);
      console.log('Drag leave');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    console.log('DropZone: Drop event');
    console.log('Files:', e.dataTransfer.files);
    console.log('Items:', e.dataTransfer.items);

    const files = Array.from(e.dataTransfer.files);

    if (files.length === 0) {
      console.warn('No files in drop');
      return;
    }

    files.forEach((file) => {
      if (file.type.startsWith('image/')) {
        console.log('Image file found:', file.name);
        onImageDrop(file, e.clientX, e.clientY);
      }
    });
  };

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
      }}
    >
      {isDragging && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            border: '3px dashed #3b82f6',
            borderRadius: '8px',
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              backgroundColor: 'rgba(59, 130, 246, 0.9)',
              color: 'white',
              padding: '20px 40px',
              borderRadius: '8px',
              fontSize: '18px',
              fontWeight: 'bold',
            }}
          >
            Drop image here
          </div>
        </div>
      )}
      {children}
    </div>
  );
};
