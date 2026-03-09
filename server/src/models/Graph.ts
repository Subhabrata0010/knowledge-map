/**
 * Graph data structures and type definitions
 */

export interface Node {
  id: string;
  name: string;
  type: NodeType;
  description?: string;
  frequency?: number;
  importance?: number;
  metadata?: Record<string, any>;
}

export enum NodeType {
  TECHNOLOGY = 'technology',
  FRAMEWORK = 'framework',
  LIBRARY = 'library',
  LANGUAGE = 'language',
  CONCEPT = 'concept',
  COMPANY = 'company',
  TOOL = 'tool',
  PLATFORM = 'platform',
  STANDARD = 'standard',
  OTHER = 'other',
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  relation: RelationType;
  weight: number;
  metadata?: Record<string, any>;
}

export enum RelationType {
  BUILT_ON = 'built-on',
  RELATED_TO = 'related-to',
  USED_WITH = 'used-with',
  PART_OF = 'part-of',
  MAINTAINED_BY = 'maintained-by',
  IMPLEMENTS = 'implements',
  EXTENDS = 'extends',
  ALTERNATIVE_TO = 'alternative-to',
}

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

export interface GraphPosition {
  x: number;
  y: number;
}

export interface GraphLayout {
  nodePositions: Record<string, GraphPosition>;
}
