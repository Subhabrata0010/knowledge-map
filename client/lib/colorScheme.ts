/**
 * Color scheme utilities
 */

import { NodeType } from '@/types';
import { GRAPH_CONFIG } from '@/constants';

export function getNodeColor(type: NodeType): string {
  return GRAPH_CONFIG.nodeColors[type] || GRAPH_CONFIG.nodeColors.other;
}

export function getNodeBorderColor(type: NodeType): string {
  const color = getNodeColor(type);
  // Lighten the color for border
  return color;
}
