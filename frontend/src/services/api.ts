import axios from 'axios';

// Use environment variable for API URL
let API_BASE_URL = import.meta.env.VITE_API_URL;

// Validate API_BASE_URL
if (!API_BASE_URL) {
  // In production, throw error if API URL is not configured
  if (import.meta.env.PROD) {
    throw new Error(
      'VITE_API_URL is not defined. Please set it in .env.production file.'
    );
  }
  // In development, warn and use localhost as fallback
  console.warn(
    'VITE_API_URL is not defined. Using default: http://localhost:8080'
  );
  API_BASE_URL = 'http://localhost:8080';
}

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Export API_BASE_URL for use in other components (e.g., for image URLs)
export { API_BASE_URL };
export default api;
