import { create } from 'zustand';
import { CanvasObject, CanvasState } from '../types';

interface CanvasStore {
  // Canvas state (zoom, pan)
  canvasState: CanvasState;
  setCanvasState: (state: CanvasState) => void;

  // Canvas objects
  objects: CanvasObject[];
  setObjects: (objects: CanvasObject[]) => void;
  addObject: (object: CanvasObject) => void;
  updateObject: (id: number, updates: Partial<CanvasObject>) => void;
  removeObject: (id: number) => void;

  // Selected object
  selectedObjectId: number | null;
  setSelectedObjectId: (id: number | null) => void;

  // Loading state
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // Grid display
  showGrid: boolean;
  toggleGrid: () => void;
}

const INITIAL_CANVAS_STATE: CanvasState = {
  scale: 1,
  x: 0,
  y: 0,
};

export const useCanvasStore = create<CanvasStore>((set) => ({
  canvasState: INITIAL_CANVAS_STATE,
  setCanvasState: (state) => set({ canvasState: state }),

  objects: [],
  setObjects: (objects) => set({ objects }),
  addObject: (object) =>
    set((state) => ({ objects: [...state.objects, object] })),
  updateObject: (id, updates) =>
    set((state) => ({
      objects: state.objects.map((obj) =>
        obj.id === id ? { ...obj, ...updates } : obj
      ),
    })),
  removeObject: (id) =>
    set((state) => ({
      objects: state.objects.filter((obj) => obj.id !== id),
      selectedObjectId: state.selectedObjectId === id ? null : state.selectedObjectId,
    })),

  selectedObjectId: null,
  setSelectedObjectId: (id) => set({ selectedObjectId: id }),

  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),

  showGrid: true,
  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
}));
