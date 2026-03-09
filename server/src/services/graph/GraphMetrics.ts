/**
 * Graph metrics calculator
 * Calculates statistics about the graph
 */

import { Graph, Node, Edge } from '@/models';

export class GraphMetrics {
  /**
   * Calculate graph metrics
   */
  calculate(nodes: Node[], edges: Edge[]): {
    nodeCount: number;
    edgeCount: number;
    avgDegree: number;
    components: number;
  } {
    const nodeCount = nodes.length;
    const edgeCount = edges.length;

    // Calculate average degree
    const degrees: Record<string, number> = {};
    for (const edge of edges) {
      degrees[edge.source] = (degrees[edge.source] || 0) + 1;
      degrees[edge.target] = (degrees[edge.target] || 0) + 1;
    }

    const totalDegree = Object.values(degrees).reduce((sum, deg) => sum + deg, 0);
    const avgDegree = nodeCount > 0 ? totalDegree / nodeCount : 0;

    // Calculate connected components (simplified)
    const components = this.countComponents(nodes, edges);

    return {
      nodeCount,
      edgeCount,
      avgDegree: Math.round(avgDegree * 100) / 100,
      components,
    };
  }

  private countComponents(nodes: Node[], edges: Edge[]): number {
    const visited = new Set<string>();
    let components = 0;

    const adjacency = this.buildAdjacencyList(nodes, edges);

    for (const node of nodes) {
      if (!visited.has(node.id)) {
        this.dfs(node.id, adjacency, visited);
        components++;
      }
    }

    return components;
  }

  private buildAdjacencyList(nodes: Node[], edges: Edge[]): Map<string, string[]> {
    const adjacency = new Map<string, string[]>();

    for (const node of nodes) {
      adjacency.set(node.id, []);
    }

    for (const edge of edges) {
      adjacency.get(edge.source)?.push(edge.target);
      adjacency.get(edge.target)?.push(edge.source);
    }

    return adjacency;
  }

  private dfs(nodeId: string, adjacency: Map<string, string[]>, visited: Set<string>): void {
    visited.add(nodeId);
    const neighbors = adjacency.get(nodeId) || [];

    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        this.dfs(neighbor, adjacency, visited);
      }
    }
  }
}
