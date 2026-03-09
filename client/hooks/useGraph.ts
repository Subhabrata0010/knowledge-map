/**
 * Custom hook for fetching and managing graph data
 */

'use client';

import { useState, useEffect } from 'react';
import { Graph } from '@/types';
import { GraphApi } from '@/services/api';
import { GraphCache } from '@/services/cache';

export interface UseGraphOptions {
  topic: string;
  autoFetch?: boolean;
  useCache?: boolean;
}

export interface UseGraphResult {
  graph: Graph | null;
  loading: boolean;
  error: Error | null;
  generateMap: () => Promise<void>;
  refetch: () => Promise<void>;
}

export function useGraph(options: UseGraphOptions): UseGraphResult {
  const { topic, autoFetch = false, useCache = true } = options;
  
  const [graph, setGraph] = useState<Graph | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const generateMap = async () => {
    if (!topic) return;

    setLoading(true);
    setError(null);

    try {
      // Check cache first
      if (useCache) {
        const cached = GraphCache.get(topic);
        if (cached) {
          setGraph(cached);
          setLoading(false);
          return;
        }
      }

      // Generate new map
      const newGraph = await GraphApi.generateMap(topic);
      setGraph(newGraph);

      // Cache the result
      if (useCache) {
        GraphCache.save(topic, newGraph);
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const refetch = async () => {
    if (!topic) return;

    setLoading(true);
    setError(null);

    try {
      const fetchedGraph = await GraphApi.getGraph(topic);
      setGraph(fetchedGraph);

      if (useCache) {
        GraphCache.save(topic, fetchedGraph);
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch && topic) {
      generateMap();
    }
  }, [topic, autoFetch]);

  return {
    graph,
    loading,
    error,
    generateMap,
    refetch,
  };
}
