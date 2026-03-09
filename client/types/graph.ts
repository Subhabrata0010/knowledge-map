/* eslint-disable @typescript-eslint/no-explicit-any */


export interface Node {
  id: string;
  name: string;
  type: NodeType;
  description?: string;
  frequency?: number;
  importance?: number;
  metadata?: Record<string, any>;
}

export type NodeType =
  | 'technology'
  | 'framework'
  | 'library'
  | 'language'
  | 'concept'
  | 'company'
  | 'tool'
  | 'platform'
  | 'standard'
  | 'other';

export interface Edge {
  id: string;
  source: string;
  target: string;
  relation: RelationType;
  weight: number;
  metadata?: Record<string, any>;
}

export type RelationType =
  | 'built-on'
  | 'related-to'
  | 'used-with'
  | 'part-of'
  | 'maintained-by'
  | 'implements'
  | 'extends'
  | 'alternative-to';

export interface Graph {
  topic: string;
  nodes: Node[];
  edges: Edge[];
  metadata: GraphMetadata;
}

export interface GraphMetadata {
  nodeCount: number;
  edgeCount: number;
  avgDegree: number;
  components: number;
  createdAt: string;
  sources: string[];
  generationTimeMs: number;
}
