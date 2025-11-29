import { useEffect, useRef, useState } from 'react';
import Konva from 'konva';

interface VideoOverlayProps {
  videoUrl: string;
  canvasX: number; // Canvas X coordinate
  canvasY: number; // Canvas Y coordinate
  width: number;
  height: number;
  stageRef: React.RefObject<Konva.Stage>;
  onClose: () => void;
}

export const VideoOverlay = ({
  videoUrl,
  canvasX,
  canvasY,
  width,
  height,
  stageRef,
  onClose,
}: VideoOverlayProps) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Update screen position in real-time by directly manipulating DOM
  // This avoids React re-render cycle and eliminates lag
  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    let animationFrameId: number;

    const updatePosition = () => {
      if (stageRef.current && overlay && !isFullscreen) {
        const stage = stageRef.current;
        const scale = stage.scaleX();
        const stagePos = stage.position();

        const screenX = canvasX * scale + stagePos.x;
        const screenY = canvasY * scale + stagePos.y;
        const screenWidth = width * scale;
        const screenHeight = height * scale;

        // Direct DOM manipulation - no React state, no re-render lag
        overlay.style.left = `${screenX}px`;
        overlay.style.top = `${screenY}px`;
        overlay.style.width = `${screenWidth}px`;
        overlay.style.height = `${screenHeight}px`;
      }

      animationFrameId = requestAnimationFrame(updatePosition);
    };

    animationFrameId = requestAnimationFrame(updatePosition);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [canvasX, canvasY, width, height, stageRef, isFullscreen]);

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Auto-play video when mounted
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(err => {
        console.error('Failed to auto-play video:', err);
      });
    }
  }, []);

  return (
    <>
      {/* Video Player - positioned at object location */}
      <div
        ref={overlayRef}
        style={{
          position: 'fixed',
          // left, top, width, height are set via direct DOM manipulation in useEffect
          left: 0,
          top: 0,
          width: 0,
          height: 0,
          zIndex: 1001,
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.8)',
          backgroundColor: '#000',
          // Remove transition to avoid lag
          ...(isFullscreen && {
            left: '50%',
            top: '50%',
            width: '80vw',
            height: '80vh',
            transform: 'translate(-50%, -50%)',
            transition: 'all 0.3s ease',
          }),
        }}
      >
        <video
          ref={videoRef}
          width="100%"
          height="100%"
          controls
          autoPlay
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
        >
          <source src={videoUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Control buttons */}
        <div
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            display: 'flex',
            gap: '8px',
            zIndex: 1002,
          }}
        >
          {/* Fullscreen toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '4px',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              border: 'none',
              color: 'white',
              fontSize: '16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? '⊡' : '⛶'}
          </button>

          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '4px',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              border: 'none',
              color: 'white',
              fontSize: '20px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Close"
          >
            ×
          </button>
        </div>
      </div>
    </>
  );
};
