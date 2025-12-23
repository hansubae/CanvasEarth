import api from './api';
import {
  CanvasObject,
  CreateObjectRequest,
  UpdateObjectRequest,
  ViewportBounds,
} from '../types';

export const canvasApi = {
  // Get objects within viewport
  getObjectsInViewport: async (
    bounds: ViewportBounds
  ): Promise<CanvasObject[]> => {
    const response = await api.get<CanvasObject[]>('/objects', {
      params: {
        minX: bounds.minX,
        minY: bounds.minY,
        maxX: bounds.maxX,
        maxY: bounds.maxY,
      },
    });
    return response.data;
  },

  // Get single object by ID
  getObjectById: async (id: number): Promise<CanvasObject> => {
    const response = await api.get<CanvasObject>(`/objects/${id}`);
    return response.data;
  },

  // Create new object
  createObject: async (
    request: CreateObjectRequest
  ): Promise<CanvasObject> => {
    const response = await api.post<CanvasObject>('/objects', request);
    return response.data;
  },

  // Update object
  updateObject: async (
    id: number,
    request: UpdateObjectRequest
  ): Promise<CanvasObject> => {
    const response = await api.put<CanvasObject>(`/objects/${id}`, request);
    return response.data;
  },

  // Delete object
  deleteObject: async (id: number): Promise<void> => {
    await api.delete(`/objects/${id}`);
  },

  // Upload file (image or video)
  uploadFile: async (
    file: File,
    objectType: string,
    positionX: number,
    positionY: number,
    width: number,
    height: number,
    zIndex: number,
    userId: number
  ): Promise<CanvasObject> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('objectType', objectType);
    formData.append('positionX', positionX.toString());
    formData.append('positionY', positionY.toString());
    formData.append('width', width.toString());
    formData.append('height', height.toString());
    formData.append('zIndex', zIndex.toString());
    formData.append('userId', userId.toString());

    // Override Content-Type header for multipart/form-data
    const response = await api.post<CanvasObject>('/objects/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
