/**
 * Relationship scorer
 * Calculates strength and type of relationships
 */

import { RelationType } from '@/models';
import { CooccurrenceScore } from './CooccurrenceAnalyzer';
import { logger } from '@/utils/logger';

export interface ScoredRelationship {
  source: string;
  target: string;
  relation: RelationType;
  weight: number;
}

export class RelationshipScorer {
  /**
   * Score relationships and determine types
   */
  scoreRelationships(cooccurrences: CooccurrenceScore[]): ScoredRelationship[] {
    logger.info(`Scoring ${cooccurrences.length} potential relationships`);

    const relationships: ScoredRelationship[] = [];

    for (const cooccurrence of cooccurrences) {
      // Normalize weight to 0-1 range
      const weight = this.normalizeWeight(cooccurrence.score, cooccurrence.count);

      // Infer relationship type
      const relation = this.inferRelationType(cooccurrence.entity1, cooccurrence.entity2);

      relationships.push({
        source: cooccurrence.entity1,
        target: cooccurrence.entity2,
        relation,
        weight,
      });
    }

    return relationships;
  }

  private normalizeWeight(score: number, count: number): number {
    // Weight based on both score and count
    // More occurrences = stronger relationship
    const baseWeight = Math.min(score / 10, 1); // Normalize score
    const countBonus = Math.min(count / 5, 0.2); // Up to +0.2 for frequent co-occurrence

    return Math.min(baseWeight + countBonus, 1);
  }

  private inferRelationType(entity1: string, entity2: string): RelationType {
    const lower1 = entity1.toLowerCase();
    const lower2 = entity2.toLowerCase();

    // Built-on relationships (e.g., "Next.js" built on "React")
    if (this.isBuiltOnPattern(lower1, lower2)) {
      return RelationType.BUILT_ON;
    }

    // Used-with relationships (e.g., "TypeScript" used with "Node.js")
    if (this.isUsedWithPattern(lower1, lower2)) {
      return RelationType.USED_WITH;
    }

    // Part-of relationships
    if (this.isPartOfPattern(lower1, lower2)) {
      return RelationType.PART_OF;
    }

    // Default: related-to
    return RelationType.RELATED_TO;
  }

  private isBuiltOnPattern(entity1: string, entity2: string): boolean {
    const builtOnPairs = [
      ['next', 'react'],
      ['remix', 'react'],
      ['gatsby', 'react'],
      ['nuxt', 'vue'],
      ['typescript', 'javascript'],
    ];

    return builtOnPairs.some(
      ([base, foundation]) =>
        (entity1.includes(base) && entity2.includes(foundation)) ||
        (entity2.includes(base) && entity1.includes(foundation))
    );
  }

  private isUsedWithPattern(entity1: string, entity2: string): boolean {
    // Technologies often used together
    return (
      (entity1.includes('typescript') && entity2.includes('node')) ||
      (entity2.includes('typescript') && entity1.includes('node')) ||
      (entity1.includes('react') && entity2.includes('redux')) ||
      (entity2.includes('react') && entity1.includes('redux'))
    );
  }

  private isPartOfPattern(entity1: string, entity2: string): boolean {
    return (
      entity1.includes(entity2) ||
      entity2.includes(entity1)
    );
  }

  /**
   * Filter weak relationships
   */
  filterWeakRelationships(
    relationships: ScoredRelationship[],
    minWeight: number
  ): ScoredRelationship[] {
    return relationships.filter((rel) => rel.weight >= minWeight);
  }
}
