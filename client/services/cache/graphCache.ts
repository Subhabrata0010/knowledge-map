/**
 * Client-side graph caching
 */

import { Graph } from '@/types';

const CACHE_KEY_PREFIX = 'km_graph_';
const CACHE_DURATION = 3600000; // 1 hour in ms

interface CacheEntry {
  graph: Graph;
  timestamp: number;
}

export class GraphCache {
  /**
   * Save graph to localStorage
   */
  static save(topic: string, graph: Graph): void {
    try {
      const entry: CacheEntry = {
        graph,
        timestamp: Date.now(),
      };

      const key = this.getCacheKey(topic);
      localStorage.setItem(key, JSON.stringify(entry));
    } catch (error) {
      console.error('Failed to cache graph:', error);
    }
  }

  /**
   * Get graph from localStorage
   */
  static get(topic: string): Graph | null {
    try {
      const key = this.getCacheKey(topic);
      const cached = localStorage.getItem(key);

      if (!cached) {
        return null;
      }

      const entry: CacheEntry = JSON.parse(cached);

      // Check if expired
      if (Date.now() - entry.timestamp > CACHE_DURATION) {
        this.remove(topic);
        return null;
      }

      return entry.graph;
    } catch (error) {
      console.error('Failed to retrieve cached graph:', error);
      return null;
    }
  }

  /**
   * Remove cached graph
   */
  static remove(topic: string): void {
    try {
      const key = this.getCacheKey(topic);
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to remove cached graph:', error);
    }
  }

  /**
   * Clear all cached graphs
   */
  static clearAll(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith(CACHE_KEY_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  private static getCacheKey(topic: string): string {
    return `${CACHE_KEY_PREFIX}${topic.toLowerCase().replace(/\s+/g, '-')}`;
  }
}
