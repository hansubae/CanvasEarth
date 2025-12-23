import { create } from 'zustand';
import { CanvasState } from '../types';

/**
 * Canvas UI State Store
 *
 * IMPORTANT: This store manages ONLY UI state.
 * Canvas objects are managed by React Query (useCanvasObjects hook).
 *
 * Responsibilities:
 * - Canvas viewport state (zoom, pan)
 * - Object selection state
 * - UI preferences (grid visibility)
 * - Loading indicators
 *
 * NOT responsible for:
 * - Canvas objects data (use React Query instead)
 * - Server state synchronization (use React Query instead)
 */
interface CanvasStore {
  // Canvas state (zoom, pan)
  canvasState: CanvasState;
  setCanvasState: (state: CanvasState) => void;

  // Selected object ID (UI state only)
  selectedObjectId: number | null;
  setSelectedObjectId: (id: number | null) => void;

  // Loading state (UI feedback)
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // Grid display preference
  showGrid: boolean;
  toggleGrid: () => void;
}

const INITIAL_CANVAS_STATE: CanvasState = {
  scale: 1,
  x: 0,
  y: 0,
};

export const useCanvasStore = create<CanvasStore>((set) => ({
  // Canvas viewport state
  canvasState: INITIAL_CANVAS_STATE,
  setCanvasState: (state) => set({ canvasState: state }),

  // Object selection (UI state only)
  selectedObjectId: null,
  setSelectedObjectId: (id) => set({ selectedObjectId: id }),

  // Loading indicator
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),

  // Grid visibility
  showGrid: true,
  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
}));
