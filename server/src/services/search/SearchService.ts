/**
 * Search service orchestrator
 */

import { SearchResult } from '@/models';
import { DuckDuckGoSearcher } from './DuckDuckGoSearcher';
import { config } from '@/config';
import { logger } from '@/utils/logger';

export class SearchService {
  private searcher: DuckDuckGoSearcher;

  constructor() {
    this.searcher = new DuckDuckGoSearcher();
  }

  /**
   * Search for a topic and return relevant URLs
   */
  async searchTopic(topic: string): Promise<SearchResult[]> {
    logger.info(`Starting search for topic: ${topic}`);

    const maxResults = config.scraping.maxSearchResults;
    const results = await this.searcher.search(topic, maxResults);

    if (results.length === 0) {
      throw new Error(`No search results found for topic: ${topic}`);
    }

    return results;
  }
}
