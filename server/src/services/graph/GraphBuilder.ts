/**
 * Graph builder service
 * Constructs the final knowledge graph
 */

import { Graph, Node, Edge, Entity } from '@/models';
import { GraphMetrics } from './GraphMetrics';
import { LayoutEngine } from './LayoutEngine';
import { logger } from '@/utils/logger';
import { Normalizer } from '@/utils/normalizer';

export class GraphBuilder {
  private metrics: GraphMetrics;
  private layoutEngine: LayoutEngine;

  constructor() {
    this.metrics = new GraphMetrics();
    this.layoutEngine = new LayoutEngine();
  }

  /**
   * Build a complete knowledge graph
   */
  buildGraph(topic: string, entities: Entity[], edges: Edge[], sources: string[]): Graph {
    logger.info(`Building graph for topic: ${topic}`);

    // Convert entities to nodes
    const nodes = this.entitiesToNodes(entities);

    // Assign importance based on graph structure
    const nodesWithImportance = this.layoutEngine.assignImportance(nodes, edges);

    // Calculate metrics
    const metrics = this.metrics.calculate(nodesWithImportance, edges);

    const graph: Graph = {
      topic,
      nodes: nodesWithImportance,
      edges,
      metadata: {
        ...metrics,
        createdAt: new Date().toISOString(),
        sources,
        generationTimeMs: 0, // Will be set by pipeline
      },
    };

    logger.info(`Graph built: ${metrics.nodeCount} nodes, ${metrics.edgeCount} edges`);

    return graph;
  }

  private entitiesToNodes(entities: Entity[]): Node[] {
    return entities.map((entity) => ({
      id: Normalizer.generateId(entity.name),
      name: entity.name,
      type: entity.type,
      description: entity.contexts[0] || undefined,
      frequency: entity.frequency,
      importance: 0, // Will be calculated
      metadata: {
        sources: Array.from(entity.sources),
        cooccurrenceCount: entity.cooccurrences.size,
      },
    }));
  }
}
