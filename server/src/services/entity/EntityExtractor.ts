/**
 * Entity extraction service
 * Orchestrates NLP processing and entity ranking
 */

import { ScrapedContent, Entity, NodeType } from '@/models';
import { NLPProcessor } from './NLPProcessor';
import { EntityRanker } from './EntityRanker';
import { config } from '@/config';
import { logger } from '@/utils/logger';
import { Normalizer } from '@/utils/normalizer';

export class EntityExtractor {
  private nlpProcessor: NLPProcessor;
  private ranker: EntityRanker;

  constructor() {
    this.nlpProcessor = new NLPProcessor();
    this.ranker = new EntityRanker();
  }

  /**
   * Extract entities from scraped content
   */
  extractEntities(contents: ScrapedContent[]): Entity[] {
    logger.info(`Extracting entities from ${contents.length} sources`);

    // Collect all entities with their frequencies
    const entityMap = new Map<string, Entity>();

    for (const content of contents) {
      this.processContent(content, entityMap);
    }

    // Convert to array and filter by minimum frequency
    const entities = Array.from(entityMap.values()).filter(
      (entity) => entity.frequency >= config.extraction.minEntityFrequency
    );

    logger.info(`Found ${entities.length} entities (before ranking)`);

    // Rank entities
    const scored = this.ranker.rankEntities(entities);
    const topScored = this.ranker.filterTopEntities(scored, config.extraction.maxEntities);

    logger.info(`Kept top ${topScored.length} entities`);

    // Return entities directly - get from scored results
    const topEntities: Entity[] = topScored
      .map(scored => {
        const entityId = Normalizer.generateId(Normalizer.normalizeEntity(scored.entity));
        return entityMap.get(entityId);
      })
      .filter((entity): entity is Entity => entity !== undefined);

    if (topEntities.length === 0) {
      logger.error('Entity matching failed!', {
        topScoredCount: topScored.length,
        entityMapSize: entityMap.size,
        sampleScored: topScored.slice(0, 3).map(s => s.entity)
      });
    }

    logger.info(`Returning ${topEntities.length} entities to orchestrator`);
    return topEntities;
  }

  private processContent(content: ScrapedContent, entityMap: Map<string, Entity>): void {
    const { text, url } = content;

    // Extract named entities
    const namedEntities = this.nlpProcessor.extractEntities(text);

    // Extract technology terms
    const techTerms = this.nlpProcessor.extractTechnologyTerms(text);

    // Combine all entity texts
    const allEntityTexts = [
      ...namedEntities.map((e) => e.text),
      ...techTerms,
    ];

    // Process each entity
    for (const entityText of allEntityTexts) {
      const normalized = Normalizer.normalizeEntity(entityText);
      
      // More lenient filtering
      if (normalized.length < 2 || normalized.length > 60) {
        continue;
      }

      // Skip common stop words
      const commonWords = ['the', 'this', 'that', 'with', 'from', 'have', 'more', 'will', 'been', 'their'];
      if (commonWords.includes(normalized.toLowerCase())) {
        continue;
      }

      const entityId = Normalizer.generateId(normalized);

      if (!entityMap.has(entityId)) {
        entityMap.set(entityId, {
          name: entityText,
          type: this.inferType(entityText),
          frequency: 0,
          cooccurrences: new Map(),
          contexts: [],
          sources: new Set(),
        });
      }

      const entity = entityMap.get(entityId)!;
      entity.frequency++;
      entity.sources.add(url);

      // Add context
      if (entity.contexts.length < 3) {
        const contexts = this.nlpProcessor.extractContext(text, entityText);
        entity.contexts.push(...contexts.slice(0, 3 - entity.contexts.length));
      }
    }

    // Track co-occurrences
    this.trackCooccurrences(allEntityTexts, entityMap);
  }

  private trackCooccurrences(entities: string[], entityMap: Map<string, Entity>): void {
    // For each pair of entities in the same document
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const entity1Id = Normalizer.generateId(Normalizer.normalizeEntity(entities[i]));
        const entity2Id = Normalizer.generateId(Normalizer.normalizeEntity(entities[j]));

        const entity1 = entityMap.get(entity1Id);
        const entity2 = entityMap.get(entity2Id);

        if (entity1 && entity2 && entity1Id !== entity2Id) {
          // Increment co-occurrence count
          entity1.cooccurrences.set(
            entity2Id,
            (entity1.cooccurrences.get(entity2Id) || 0) + 1
          );
          entity2.cooccurrences.set(
            entity1Id,
            (entity2.cooccurrences.get(entity1Id) || 0) + 1
          );
        }
      }
    }
  }

  private inferType(entityText: string): NodeType {
    const lower = entityText.toLowerCase();

    // Technology keywords
    if (
      lower.includes('framework') ||
      lower.endsWith('js') ||
      lower.includes('react') ||
      lower.includes('vue') ||
      lower.includes('angular')
    ) {
      return NodeType.FRAMEWORK;
    }

    if (
      lower.includes('library') ||
      lower.includes('lib')
    ) {
      return NodeType.LIBRARY;
    }

    if (
      lower.includes('language') ||
      ['python', 'java', 'javascript', 'typescript', 'rust', 'go'].includes(lower)
    ) {
      return NodeType.LANGUAGE;
    }

    if (
      lower.includes('platform') ||
      ['aws', 'azure', 'gcp', 'vercel', 'netlify'].includes(lower)
    ) {
      return NodeType.PLATFORM;
    }

    // Default to technology
    return NodeType.TECHNOLOGY;
  }
}
