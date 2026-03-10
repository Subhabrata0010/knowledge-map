/**
 * Pipeline orchestrator
 * Coordinates the entire knowledge map generation process
 */

import { Graph, ScrapedContent } from '@/models';
import { SearchService } from '../search';
import { ScraperService } from '../scraper';
import { EntityExtractor } from '../entity';
import { RelationshipBuilder } from '../relationship';
import { GraphBuilder } from '../graph';
import { nodeRepository, edgeRepository, cacheRepository } from '@/db/repositories';
import { popularityTracker } from '@/services/tracking/PopularityTracker';
import { config } from '@/config';
import { logger } from '@/utils/logger';
import { Normalizer } from '@/utils/normalizer';
import { PipelineStateManager, PipelineStage } from './PipelineState';
import { TimeoutError } from '@/utils/errors';

export class PipelineOrchestrator {
  private searchService: SearchService;
  private scraperService: ScraperService;
  private entityExtractor: EntityExtractor;
  private relationshipBuilder: RelationshipBuilder;
  private graphBuilder: GraphBuilder;

  constructor() {
    this.searchService = new SearchService();
    this.scraperService = new ScraperService();
    this.entityExtractor = new EntityExtractor();
    this.relationshipBuilder = new RelationshipBuilder();
    this.graphBuilder = new GraphBuilder();
  }

  /**
   * Execute the full pipeline for generating a knowledge map
   */
  async generateKnowledgeMap(topic: string): Promise<Graph> {
    const stateManager = new PipelineStateManager(topic);
    const startTime = Date.now();

    try {
      logger.info(`Starting pipeline for topic: ${topic}`);

      // Track popularity (non-blocking)
      popularityTracker.trackSearch(topic).catch(err => 
        logger.debug('Failed to track popularity:', err)
      );

      // Check cache first
      const topicKey = Normalizer.normalizeTopic(topic);
      if (config.cache.enableCache) {
        const cached = await cacheRepository.getGraph(topicKey);
        if (cached) {
          logger.info(`Returned cached graph for: ${topic}`);
          return cached;
        }
      }

      // Step 1: Search for relevant URLs
      stateManager.updateStage(PipelineStage.SEARCHING, 10);
      const searchResults = await this.searchService.searchTopic(topic);
      stateManager.updateData({ searchResults: searchResults.length });
      logger.info(`Found ${searchResults.length} search results`);

      // Step 2: Scrape content from URLs
      stateManager.updateStage(PipelineStage.SCRAPING, 30);
      const urls = searchResults.map((r) => r.url);
      const scrapeResult = await this.scraperService.scrapeUrls(urls);
      stateManager.updateData({ scrapedPages: scrapeResult.successful.length });

      // Validate minimum successful scrapes
      if (scrapeResult.successful.length < config.pipeline.minSuccessfulScrapes) {
        throw new Error(
          `Insufficient content: only ${scrapeResult.successful.length} pages scraped successfully`
        );
      }

      logger.info(`Scraped ${scrapeResult.successful.length} pages successfully`);

      // Step 3: Extract entities
      stateManager.updateStage(PipelineStage.EXTRACTING_ENTITIES, 50);
      const entities = this.entityExtractor.extractEntities(scrapeResult.successful);
      stateManager.updateData({ entities: entities.length });

      if (entities.length === 0) {
        throw new Error('No entities extracted from content');
      }

      logger.info(`Extracted ${entities.length} entities`);

      // Step 4: Build relationships
      stateManager.updateStage(PipelineStage.BUILDING_RELATIONSHIPS, 70);
      const edges = this.relationshipBuilder.buildRelationships(
        entities,
        scrapeResult.successful
      );
      stateManager.updateData({ relationships: edges.length });

      logger.info(`Built ${edges.length} relationships`);

      // Step 5: Build graph
      stateManager.updateStage(PipelineStage.BUILDING_GRAPH, 85);
      const sources = scrapeResult.successful.map((s: ScrapedContent) => s.url);
      const graph = this.graphBuilder.buildGraph(topic, entities, edges, sources);

      // Set generation time
      graph.metadata.generationTimeMs = Date.now() - startTime;

      // Step 6: Store in database
      stateManager.updateStage(PipelineStage.STORING, 95);
      await Promise.all([
        nodeRepository.saveNodes(topicKey, graph.nodes),
        edgeRepository.saveEdges(topicKey, graph.edges),
        config.cache.enableCache && cacheRepository.saveGraph(topicKey, graph),
      ]);

      stateManager.updateStage(PipelineStage.COMPLETED, 100);

      logger.info(
        `Pipeline completed for ${topic} in ${graph.metadata.generationTimeMs}ms`
      );

      return graph;
    } catch (error) {
      const elapsed = Date.now() - startTime;
      logger.error(`Pipeline failed for ${topic} after ${elapsed}ms`, error);
      stateManager.setError((error as Error).message);
      throw error;
    }
  }

  /**
   * Retrieve an existing knowledge map
   */
  async getKnowledgeMap(topic: string): Promise<Graph | null> {
    const topicKey = Normalizer.normalizeTopic(topic);

    // Try cache first
    if (config.cache.enableCache) {
      const cached = await cacheRepository.getGraph(topicKey);
      if (cached) {
        logger.info(`Cache hit for topic: ${topic}`);
        return cached;
      }
    }

    // Fetch from database
    const [nodes, edges] = await Promise.all([
      nodeRepository.getNodesByTopic(topicKey),
      edgeRepository.getEdgesByTopic(topicKey),
    ]);

    if (nodes.length === 0) {
      return null;
    }

    const graph: Graph = {
      topic,
      nodes,
      edges,
      metadata: {
        nodeCount: nodes.length,
        edgeCount: edges.length,
        avgDegree: edges.length / nodes.length,
        components: 1,
        createdAt: new Date().toISOString(),
        sources: [],
        generationTimeMs: 0,
      },
    };

    return graph;
  }
}
