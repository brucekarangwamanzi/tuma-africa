/**
 * API Helper Utilities
 * Provides consistent API URL construction for mobile and desktop access
 */

/**
 * Gets the base URL for API requests
 * Automatically detects if running on localhost or network IP
 */
export const getApiBaseURL = (): string => {
  // If REACT_APP_API_URL is set, use it
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // If accessed from localhost, use localhost
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return '/api';
  }
  
  // If accessed from network IP, use the same IP for backend
  const hostname = window.location.hostname;
  const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
  return `${protocol}//${hostname}:5001/api`;
};

/**
 * Gets the base URL for file/image access (without /api)
 * Used for constructing image URLs
 */
export const getFileBaseURL = (): string => {
  // If accessed from localhost, use localhost
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:5001';
  }
  
  // If accessed from network IP, use the same IP for backend
  const hostname = window.location.hostname;
  const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
  return `${protocol}//${hostname}:5001`;
};

/**
 * Constructs a full image URL from a relative path
 * Handles both absolute URLs and relative paths
 */
export const getImageUrl = (imagePath: string): string => {
  if (!imagePath) return '';
  
  // If already a full URL (http/https), return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // If starts with /, it's a relative path from backend
  if (imagePath.startsWith('/')) {
    return `${getFileBaseURL()}${imagePath}`;
  }
  
  // Otherwise, assume it's a relative path
  return `${getFileBaseURL()}/${imagePath}`;
};

