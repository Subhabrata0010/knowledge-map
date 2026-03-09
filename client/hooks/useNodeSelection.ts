/**
 * Custom hook for managing node selection
 */

'use client';

import { useState, useCallback } from 'react';

export interface UseNodeSelectionResult {
  selectedNodeId: string | null;
  selectNode: (nodeId: string | null) => void;
  clearSelection: () => void;
}

export function useNodeSelection(): UseNodeSelectionResult {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const selectNode = useCallback((nodeId: string | null) => {
    setSelectedNodeId(nodeId);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  return {
    selectedNodeId,
    selectNode,
    clearSelection,
  };
}
