/**
 * Custom hook for managing graph layout
 */

'use client';

import { useState, useCallback } from 'react';
import { ReactFlowNode, ReactFlowEdge } from '@/types';
import { LayoutAlgorithm } from '@/lib';

export type LayoutType = 'circular' | 'hierarchical';

export interface UseGraphLayoutResult {
  layoutType: LayoutType;
  setLayoutType: (type: LayoutType) => void;
  applyLayout: (nodes: ReactFlowNode[], edges: ReactFlowEdge[]) => ReactFlowNode[];
}

export function useGraphLayout(): UseGraphLayoutResult {
  const [layoutType, setLayoutType] = useState<LayoutType>('circular');

  const applyLayout = useCallback(
    (nodes: ReactFlowNode[], edges: ReactFlowEdge[]): ReactFlowNode[] => {
      if (layoutType === 'hierarchical') {
        return LayoutAlgorithm.hierarchicalLayout(nodes, edges);
      }
      return LayoutAlgorithm.applyLayout(nodes, edges);
    },
    [layoutType]
  );

  return {
    layoutType,
    setLayoutType,
    applyLayout,
  };
}
