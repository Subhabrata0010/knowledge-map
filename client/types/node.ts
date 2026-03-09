/**
 * React Flow node type
 */

import { Node as GraphNode } from './graph';

export interface ReactFlowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    nodeType: string;
    description?: string;
    importance?: number;
    frequency?: number;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  style?: Record<string, any>;
}
