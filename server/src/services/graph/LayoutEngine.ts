/**
 * Layout engine
 * Provides hints for graph visualization layout
 */

import { Node, Edge } from '@/models';

export interface LayoutHint {
  nodeId: string;
  centrality: number;
  cluster?: number;
}

export class LayoutEngine {
  /**
   * Calculate centrality scores for nodes
   * Higher centrality = more important node
   */
  calculateCentrality(nodes: Node[], edges: Edge[]): LayoutHint[] {
    const degrees: Record<string, number> = {};

    // Calculate degree for each node
    for (const node of nodes) {
      degrees[node.id] = 0;
    }

    for (const edge of edges) {
      degrees[edge.source]++;
      degrees[edge.target]++;
    }

    // Normalize to 0-1 range
    const maxDegree = Math.max(...Object.values(degrees), 1);

    return nodes.map((node) => ({
      nodeId: node.id,
      centrality: degrees[node.id] / maxDegree,
    }));
  }

  /**
   * Assign importance scores to nodes
   */
  assignImportance(nodes: Node[], edges: Edge[]): Node[] {
    const centrality = this.calculateCentrality(nodes, edges);
    const centralityMap = new Map(centrality.map((c) => [c.nodeId, c.centrality]));

    return nodes.map((node) => ({
      ...node,
      importance: centralityMap.get(node.id) || 0,
    }));
  }
}
