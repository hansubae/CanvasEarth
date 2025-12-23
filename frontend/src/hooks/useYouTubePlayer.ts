import { useState, useEffect, useCallback } from 'react';

interface PlayingVideo {
  id: string; // Unique ID for each playing instance
  objectId: number; // Reference to the canvas object
  videoId: string; // YouTube video ID
}

/**
 * Extract YouTube video ID from various URL formats
 * Supports regular videos and Shorts
 */
const extractYouTubeId = (url: string): string | null => {
  // Using non-capturing groups (?:...) to keep video ID at index 1
  const regExp =
    /^.*(?:youtu\.be\/|v\/|\/u\/\w\/|embed\/|shorts\/|watch\?v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[1] && match[1].length === 11 ? match[1] : null;
};

/**
 * Custom hook for managing YouTube video playback
 *
 * Responsibilities:
 * - Track playing videos (supports multiple simultaneous playback)
 * - Handle play video events from canvas objects
 * - Generate unique IDs for video instances
 * - Remove videos when closed
 */
export const useYouTubePlayer = () => {
  const [playingVideos, setPlayingVideos] = useState<PlayingVideo[]>([]);

  /**
   * Listen for YouTube video play events
   */
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
    return () =>
      window.removeEventListener('playYouTubeVideo', handlePlayVideo as EventListener);
  }, []);

  /**
   * Remove a playing video by ID
   */
  const removeVideo = useCallback((id: string) => {
    setPlayingVideos((prev) => prev.filter((video) => video.id !== id));
  }, []);

  return {
    playingVideos,
    removeVideo,
  };
};
