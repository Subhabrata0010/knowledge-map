/**
 * API constants
 */

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const API_ENDPOINTS = {
  GENERATE_MAP: `${API_URL}/generate-map`,
  GET_GRAPH: (topic: string) => `${API_URL}/graph/${encodeURIComponent(topic)}`,
};

export const API_TIMEOUT = 30000; // 30 seconds
