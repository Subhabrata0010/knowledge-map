/* eslint-disable @typescript-eslint/no-explicit-any */


import { ReactFlowNode } from '@/types';
import { GRAPH_CONFIG } from '@/constants';

export class LayoutAlgorithm {
  static applyLayout(nodes: ReactFlowNode[], edges: any[]): ReactFlowNode[] {
    return this.hubAndSpokeLayout(nodes, edges);
  }

  // Hub and spoke layout - center most important node, radiate others
  private static hubAndSpokeLayout(nodes: ReactFlowNode[], edges: any[]): ReactFlowNode[] {
    if (nodes.length === 0) return [];
    if (nodes.length === 1) return [{ ...nodes[0], position: { x: 0, y: 0 } }];

    // Find hub (most important/connected node)
    const nodeConnections = new Map<string, number>();
    edges.forEach((edge: any) => {
      nodeConnections.set(edge.source, (nodeConnections.get(edge.source) || 0) + 1);
      nodeConnections.set(edge.target, (nodeConnections.get(edge.target) || 0) + 1);
    });

    const sortedNodes = [...nodes].sort((a, b) => {
      const connectionsA = nodeConnections.get(a.id) || 0;
      const connectionsB = nodeConnections.get(b.id) || 0;
      const importanceA = a.data.importance || 0;
      const importanceB = b.data.importance || 0;
      return (connectionsB + importanceB * 10) - (connectionsA + importanceA * 10);
    });

    const hub = sortedNodes[0];
    const spokes = sortedNodes.slice(1);

    // Position hub at center
    const positioned: ReactFlowNode[] = [
      { ...hub, position: { x: 0, y: 0 } }
    ];

    // Calculate spoke positions in concentric circles
    const innerSpokes = spokes.slice(0, 6);
    const outerSpokes = spokes.slice(6);

    // Inner ring
    const innerRadius = 300;
    innerSpokes.forEach((node, index) => {
      const angle = (index / innerSpokes.length) * 2 * Math.PI - Math.PI / 2;
      positioned.push({
        ...node,
        position: {
          x: innerRadius * Math.cos(angle),
          y: innerRadius * Math.sin(angle)
        }
      });
    });

    // Outer ring
    const outerRadius = 550;
    outerSpokes.forEach((node, index) => {
      const angle = (index / Math.max(outerSpokes.length, 1)) * 2 * Math.PI - Math.PI / 2;
      positioned.push({
        ...node,
        position: {
          x: outerRadius * Math.cos(angle),
          y: outerRadius * Math.sin(angle)
        }
      });
    });

    return positioned;
  }

  private static circularLayout(nodes: ReactFlowNode[]): ReactFlowNode[] {
    const radius = Math.max(300, nodes.length * 30);
    const angleStep = (2 * Math.PI) / nodes.length;

    return nodes.map((node, index) => {
      const angle = index * angleStep;
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);

      return {
        ...node,
        position: { x, y },
      };
    });
  }

  static hierarchicalLayout(
    nodes: ReactFlowNode[],
    edges: any[]
  ): ReactFlowNode[] {
    // Group nodes by importance
    const sortedNodes = [...nodes].sort(
      (a, b) => (b.data.importance || 0) - (a.data.importance || 0)
    );

    const levels = this.groupIntoLevels(sortedNodes, 3);
    const levelHeight = 200;

    let positionedNodes: ReactFlowNode[] = [];

    levels.forEach((levelNodes, levelIndex) => {
      const y = levelIndex * levelHeight;
      const levelWidth = levelNodes.length * GRAPH_CONFIG.layoutSpacing;

      levelNodes.forEach((node, nodeIndex) => {
        const x = nodeIndex * GRAPH_CONFIG.layoutSpacing - levelWidth / 2;
        positionedNodes.push({
          ...node,
          position: { x, y },
        });
      });
    });

    return positionedNodes;
  }

  private static groupIntoLevels(
    nodes: ReactFlowNode[],
    levelCount: number
  ): ReactFlowNode[][] {
    const levels: ReactFlowNode[][] = Array(levelCount)
      .fill(null)
      .map(() => []);
    const nodesPerLevel = Math.ceil(nodes.length / levelCount);

    nodes.forEach((node, index) => {
      const levelIndex = Math.floor(index / nodesPerLevel);
      levels[Math.min(levelIndex, levelCount - 1)].push(node);
    });

    return levels;
  }
}
