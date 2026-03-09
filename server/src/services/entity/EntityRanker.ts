/**
 * Entity ranker
 * Scores and ranks entities by importance
 */

import { Entity, EntityScore } from '@/models';
import { logger } from '@/utils/logger';

export class EntityRanker {
  /**
   * Rank entities by multiple factors
   */
  rankEntities(entities: Entity[]): EntityScore[] {
    const scored = entities.map((entity) => ({
      entity: entity.name,
      score: this.calculateScore(entity),
      reasons: this.explainScore(entity),
    }));

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    return scored;
  }

  /**
   * Calculate importance score for an entity
   */
  private calculateScore(entity: Entity): number {
    let score = 0;

    // Frequency score (0-40 points)
    score += Math.min(entity.frequency * 2, 40);

    // Co-occurrence score (0-30 points)
    const cooccurrenceCount = entity.cooccurrences.size;
    score += Math.min(cooccurrenceCount * 3, 30);

    // Source diversity score (0-20 points)
    score += Math.min(entity.sources.size * 5, 20);

    // Type bonus (0-10 points)
    const typeBonus = this.getTypeBonus(entity.type);
    score += typeBonus;

    return Math.round(score);
  }

  private getTypeBonus(type: string): number {
    const bonuses: Record<string, number> = {
      technology: 10,
      framework: 10,
      library: 8,
      language: 8,
      platform: 7,
      tool: 6,
      concept: 5,
      company: 3,
      other: 0,
    };

    return bonuses[type] || 0;
  }

  private explainScore(entity: Entity): string[] {
    const reasons: string[] = [];

    if (entity.frequency > 5) {
      reasons.push(`High frequency: ${entity.frequency}`);
    }

    if (entity.cooccurrences.size > 5) {
      reasons.push(`Many connections: ${entity.cooccurrences.size}`);
    }

    if (entity.sources.size > 2) {
      reasons.push(`Multiple sources: ${entity.sources.size}`);
    }

    return reasons;
  }

  /**
   * Filter entities to keep only the top N
   */
  filterTopEntities(scored: EntityScore[], maxEntities: number): EntityScore[] {
    return scored.slice(0, maxEntities);
  }
}
