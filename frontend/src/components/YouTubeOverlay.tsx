import { useEffect, useRef, useState } from 'react';
import Konva from 'konva';

interface YouTubeOverlayProps {
  videoId: string;
  objectId: number; // Canvas object ID to track in real-time
  stageRef: React.RefObject<Konva.Stage>;
  onClose: () => void;
}

export const YouTubeOverlay = ({
  videoId,
  objectId,
  stageRef,
  onClose,
}: YouTubeOverlayProps) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Update screen position in real-time by directly manipulating DOM
  // This avoids React re-render cycle and eliminates lag
  // Tracks the actual Konva object node for real-time position/size updates
  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    let animationFrameId: number;

    const updatePosition = () => {
      if (stageRef.current && overlay && !isFullscreen) {
        const stage = stageRef.current;
        const scale = stage.scaleX();
        const stagePos = stage.position();

        // Find the actual Konva object node by searching all layers
        let targetNode: Konva.Group | null = null;
        const layers = stage.getLayers();

        for (const layer of layers) {
          // Find the Group node that matches our objectId
          // The node has a custom 'objectId' attribute we need to set in CanvasObject
          const found = layer.find((node) => {
            return node.attrs.objectId === objectId;
          })[0] as Konva.Group | undefined;

          if (found) {
            targetNode = found;
            break;
          }
        }

        if (targetNode) {
          // Get real-time position and size from the actual Konva node
          const canvasX = targetNode.x();
          const canvasY = targetNode.y();

          // During transform, scaleX/scaleY change but width/height don't
          // We need to consider both to get the actual size
          const nodeScaleX = targetNode.scaleX();
          const nodeScaleY = targetNode.scaleY();
          const width = targetNode.width() * nodeScaleX;
          const height = targetNode.height() * nodeScaleY;

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
      }

      animationFrameId = requestAnimationFrame(updatePosition);
    };

    animationFrameId = requestAnimationFrame(updatePosition);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [objectId, stageRef, isFullscreen]);

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
          pointerEvents: 'none', // Allow clicks to pass through to canvas
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
        <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ pointerEvents: 'auto' }} // Enable clicks on iframe
        />

        {/* Control buttons */}
        <div
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            display: 'flex',
            gap: '8px',
            zIndex: 1002,
            pointerEvents: 'auto', // Enable clicks on buttons
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
