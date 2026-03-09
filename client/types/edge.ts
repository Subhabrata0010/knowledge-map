/* eslint-disable @typescript-eslint/no-explicit-any */


import { Edge as GraphEdge } from './graph';

export interface ReactFlowEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  label?: string;
  animated?: boolean;
  style?: Record<string, any>;
  markerEnd?: {
    type: string;
    width?: number;
    height?: number;
  };
}
