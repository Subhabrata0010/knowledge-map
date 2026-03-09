/**
 * Graph API service
 */

import { apiClient } from './client';
import { GenerateMapResponse, GetGraphResponse, Graph } from '@/types';
import { API_ENDPOINTS } from '@/constants/api';

export class GraphApi {
  /**
   * Generate a new knowledge map
   */
  static async generateMap(topic: string): Promise<Graph> {
    const response = await apiClient.post<GenerateMapResponse>(
      API_ENDPOINTS.GENERATE_MAP,
      { topic }
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to generate map');
    }

    return response.data.data;
  }

  /**
   * Get an existing knowledge map
   */
  static async getGraph(topic: string): Promise<Graph> {
    const response = await apiClient.get<GetGraphResponse>(
      API_ENDPOINTS.GET_GRAPH(topic)
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Graph not found');
    }

    return response.data.data;
  }
}
