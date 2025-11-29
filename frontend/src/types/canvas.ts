// Canvas object types matching backend ObjectType enum
export enum ObjectType {
  IMAGE = 'IMAGE',
  TEXT = 'TEXT',
  YOUTUBE = 'YOUTUBE',
  VIDEO = 'VIDEO',
}

// Canvas object interface matching backend DTO
export interface CanvasObject {
  id: number;
  objectType: ObjectType;
  contentUrl: string;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  zIndex: number;
  userId: number;
  createdAt: string;
}

// Request DTO for creating new objects
export interface CreateObjectRequest {
  objectType: ObjectType;
  contentUrl: string;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  zIndex: number;
  userId: number;
}

// Request DTO for updating objects
export interface UpdateObjectRequest {
  positionX?: number;
  positionY?: number;
  width?: number;
  height?: number;
  zIndex?: number;
  contentUrl?: string;
}

// Viewport bounds for fetching visible objects
export interface ViewportBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

// Canvas state for stage (Konva Stage)
export interface CanvasState {
  scale: number;
  x: number;
  y: number;
}
