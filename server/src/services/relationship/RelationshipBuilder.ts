/**
 * Relationship builder service
 * Orchestrates relationship discovery and scoring
 */

import { Entity, ScrapedContent, Edge } from '@/models';
import { CooccurrenceAnalyzer } from './CooccurrenceAnalyzer';
import { RelationshipScorer } from './RelationshipScorer';
import { config } from '@/config';
import { logger } from '@/utils/logger';
import { Normalizer } from '@/utils/normalizer';

export class RelationshipBuilder {
  private cooccurrenceAnalyzer: CooccurrenceAnalyzer;
  private scorer: RelationshipScorer;

  constructor() {
    this.cooccurrenceAnalyzer = new CooccurrenceAnalyzer();
    this.scorer = new RelationshipScorer();
  }

  /**
   * Build relationships between entities
   */
  buildRelationships(entities: Entity[], contents: ScrapedContent[]): Edge[] {
    logger.info(`Building relationships for ${entities.length} entities`);

    // Analyze co-occurrences at different levels
    const sentenceLevel = this.cooccurrenceAnalyzer.analyzeSentenceLevel(contents, entities);
    const paragraphLevel = this.cooccurrenceAnalyzer.analyzeParagraphLevel(contents, entities);

    // Merge co-occurrence scores
    const merged = this.mergeCooccurrences(sentenceLevel, paragraphLevel);

    // Score relationships
    const scored = this.scorer.scoreRelationships(merged);

    // Filter weak relationships
    const filtered = this.scorer.filterWeakRelationships(
      scored,
      config.extraction.minRelationshipWeight
    );

    logger.info(`Found ${filtered.length} relationships (after filtering)`);

    // Convert to edges
    const edges = filtered.map((rel) => ({
      id: `${Normalizer.generateId(rel.source)}-${Normalizer.generateId(rel.target)}`,
      source: Normalizer.generateId(rel.source),
      target: Normalizer.generateId(rel.target),
      relation: rel.relation,
      weight: rel.weight,
      metadata: {},
    }));

    return edges;
  }

  private mergeCooccurrences(
    sentenceLevel: any[],
    paragraphLevel: any[]
  ): any[] {
    const merged = new Map<string, any>();

    // Add sentence-level (higher weight)
    for (const item of sentenceLevel) {
      const key = `${item.entity1}::${item.entity2}`;
      merged.set(key, { ...item });
    }

    // Add paragraph-level (lower weight)
    for (const item of paragraphLevel) {
      const key = `${item.entity1}::${item.entity2}`;
      if (merged.has(key)) {
        // Combine scores
        const existing = merged.get(key)!;
        existing.score += item.score;
        existing.count += item.count;
      } else {
        merged.set(key, { ...item });
      }
    }

    return Array.from(merged.values());
  }
}
