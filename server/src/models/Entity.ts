/**
 * Entity extraction types
 */

import { NodeType } from './Graph';

export interface Entity {
  name: string;
  type: NodeType;
  frequency: number;
  cooccurrences: Map<string, number>;
  contexts: string[];
  sources: Set<string>;
}

export interface EntityExtractionResult {
  entities: Entity[];
  rawText: string;
  sourceUrl: string;
}

export interface EntityScore {
  entity: string;
  score: number;
  reasons: string[];
}

export interface NamedEntity {
  text: string;
  type: string;
  start: number;
  end: number;
}
