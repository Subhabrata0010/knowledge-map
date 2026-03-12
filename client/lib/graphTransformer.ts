/**
 * Graph transformer
 * Converts API graph data to React Flow format
 */

import { Graph, Node, Edge, ReactFlowNode, ReactFlowEdge } from '@/types';
import { GRAPH_CONFIG } from '@/constants';

export class GraphTransformer {
  /**
   * Transform API graph to React Flow format
   */
  static transform(graph: Graph): {
    nodes: ReactFlowNode[];
    edges: ReactFlowEdge[];
  } {
    const nodes = this.transformNodes(graph.nodes);
    const edges = this.transformEdges(graph.edges);

    return { nodes, edges };
  }

  private static transformNodes(nodes: Node[]): ReactFlowNode[] {
    return nodes.map((node, index) => ({
      id: node.id,
      type: 'custom',
      position: { x: 0, y: 0 }, // Will be calculated by layout algorithm
      data: {
        label: node.name,
        nodeType: node.type,
        description: node.description,
        importance: node.importance,
        frequency: node.frequency,
        metadata: node.metadata, // Pass through metadata including sources
      },
      style: {
        backgroundColor: this.getNodeColor(node.type),
        color: '#ffffff',
        border: '2px solid rgba(255, 255, 255, 0.3)',
        borderRadius: `${GRAPH_CONFIG.nodeBorderRadius}px`,
        padding: '10px',
        width: GRAPH_CONFIG.nodeWidth,
        height: GRAPH_CONFIG.nodeHeight,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '14px',
        fontWeight: '500',
        opacity: node.importance ? 0.6 + node.importance * 0.4 : 1,
      },
    }));
  }

  private static transformEdges(edges: Edge[]): ReactFlowEdge[] {
    return edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: 'smoothstep',
      label: this.getEdgeLabel(edge.relation),
      animated: edge.weight > 0.7,
      style: {
        stroke: '#64748b',
        strokeWidth: GRAPH_CONFIG.edgeStrokeWidth,
        opacity: edge.weight,
      },
      markerEnd: {
        type: 'arrowclosed',
        width: 20,
        height: 20,
      },
    }));
  }

  private static getNodeColor(type: string): string {
    return GRAPH_CONFIG.nodeColors[type as keyof typeof GRAPH_CONFIG.nodeColors] || GRAPH_CONFIG.nodeColors.other;
  }

  private static getEdgeLabel(relation: string): string {
    const labels: Record<string, string> = {
      'built-on': 'built on',
      'related-to': 'related',
      'used-with': 'used with',
      'part-of': 'part of',
      'maintained-by': 'maintained by',
      'implements': 'implements',
      'extends': 'extends',
      'alternative-to': 'alternative',
    };

    return labels[relation] || relation;
  }
}
