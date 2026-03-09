/**
 * Co-occurrence analyzer
 * Analyzes how often entities appear together
 */

import { Entity, ScrapedContent } from '@/models';
import { logger } from '@/utils/logger';
import { Normalizer } from '@/utils/normalizer';

export interface CooccurrenceScore {
  entity1: string;
  entity2: string;
  score: number;
  count: number;
}

export class CooccurrenceAnalyzer {
  /**
   * Analyze sentence-level co-occurrences
   * Entities in the same sentence have stronger relationships
   */
  analyzeSentenceLevel(contents: ScrapedContent[], entities: Entity[]): CooccurrenceScore[] {
    logger.info('Analyzing sentence-level co-occurrences');

    const entityNames = new Set(entities.map((e) => Normalizer.normalizeEntity(e.name)));
    const scores = new Map<string, CooccurrenceScore>();

    for (const content of contents) {
      const sentences = this.splitIntoSentences(content.text);

      for (const sentence of sentences) {
        const foundEntities = this.findEntitiesInText(sentence, entityNames);

        // Create pairs
        for (let i = 0; i < foundEntities.length; i++) {
          for (let j = i + 1; j < foundEntities.length; j++) {
            const pair = this.createPairKey(foundEntities[i], foundEntities[j]);

            if (!scores.has(pair)) {
              scores.set(pair, {
                entity1: foundEntities[i],
                entity2: foundEntities[j],
                score: 0,
                count: 0,
              });
            }

            const pairScore = scores.get(pair)!;
            pairScore.count++;
            // Sentence-level co-occurrence gets higher weight
            pairScore.score += 1.0;
          }
        }
      }
    }

    return Array.from(scores.values());
  }

  /**
   * Analyze paragraph-level co-occurrences
   */
  analyzeParagraphLevel(contents: ScrapedContent[], entities: Entity[]): CooccurrenceScore[] {
    logger.info('Analyzing paragraph-level co-occurrences');

    const entityNames = new Set(entities.map((e) => Normalizer.normalizeEntity(e.name)));
    const scores = new Map<string, CooccurrenceScore>();

    for (const content of contents) {
      const paragraphs = this.splitIntoParagraphs(content.text);

      for (const paragraph of paragraphs) {
        const foundEntities = this.findEntitiesInText(paragraph, entityNames);

        for (let i = 0; i < foundEntities.length; i++) {
          for (let j = i + 1; j < foundEntities.length; j++) {
            const pair = this.createPairKey(foundEntities[i], foundEntities[j]);

            if (!scores.has(pair)) {
              scores.set(pair, {
                entity1: foundEntities[i],
                entity2: foundEntities[j],
                score: 0,
                count: 0,
              });
            }

            const pairScore = scores.get(pair)!;
            pairScore.count++;
            // Paragraph-level gets lower weight
            pairScore.score += 0.5;
          }
        }
      }
    }

    return Array.from(scores.values());
  }

  private splitIntoSentences(text: string): string[] {
    return text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  }

  private splitIntoParagraphs(text: string): string[] {
    return text.split(/\n\n+/).filter((p) => p.trim().length > 0);
  }

  private findEntitiesInText(text: string, entityNames: Set<string>): string[] {
    const found: string[] = [];
    const lowerText = text.toLowerCase();

    for (const entityName of entityNames) {
      if (lowerText.includes(entityName.toLowerCase())) {
        found.push(entityName);
      }
    }

    return found;
  }

  private createPairKey(entity1: string, entity2: string): string {
    // Ensure consistent ordering
    return entity1 < entity2 ? `${entity1}::${entity2}` : `${entity2}::${entity1}`;
  }
}
