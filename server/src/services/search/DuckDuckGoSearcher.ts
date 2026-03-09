/**
 * DuckDuckGo search scraper
 * Scrapes DuckDuckGo HTML search results (no API key required)
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { SearchResult } from '@/models';
import { logger } from '@/utils/logger';
import { config } from '@/config';
import { retry } from '@/utils/retry';

export class DuckDuckGoSearcher {
  private baseUrl = 'https://html.duckduckgo.com/html/';
  private userAgent = config.scraping.userAgent;

  /**
   * Search DuckDuckGo and return a list of URLs
   */
  async search(query: string, maxResults: number = 15): Promise<SearchResult[]> {
    logger.info(`Searching DuckDuckGo for: ${query}`);

    try {
      const results = await retry(
        () => this.performSearch(query, maxResults),
        { maxAttempts: 3 },
        'DuckDuckGo search'
      );

      logger.info(`Found ${results.length} results for: ${query}`);
      return results;
    } catch (error) {
      logger.error('DuckDuckGo search failed', error, { query });
      throw error;
    }
  }

  private async performSearch(query: string, maxResults: number): Promise<SearchResult[]> {
    const response = await axios.post(
      this.baseUrl,
      new URLSearchParams({
        q: query,
        b: '',
        kl: 'us-en',
      }),
      {
        headers: {
          'User-Agent': this.userAgent,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: config.scraping.requestTimeout,
      }
    );

    const html = response.data;
    const $ = cheerio.load(html);
    const results: SearchResult[] = [];

    // Parse search results
    $('.result').each((index, element) => {
      if (results.length >= maxResults) return false;

      const $result = $(element);
      const $link = $result.find('.result__a');
      const $snippet = $result.find('.result__snippet');

      const title = $link.text().trim();
      const url = $link.attr('href');
      const snippet = $snippet.text().trim();

      if (url && title) {
        // DuckDuckGo sometimes uses redirect URLs, extract the actual URL
        const actualUrl = this.extractActualUrl(url);
        
        if (actualUrl && this.isValidUrl(actualUrl)) {
          results.push({
            title,
            url: actualUrl,
            snippet,
            rank: results.length + 1,
          });
        }
      }
    });

    return results;
  }

  private extractActualUrl(url: string): string {
    try {
      // DuckDuckGo redirect format: //duckduckgo.com/l/?uddg=https%3A%2F%2F...
      if (url.includes('uddg=')) {
        const match = url.match(/uddg=([^&]+)/);
        if (match) {
          return decodeURIComponent(match[1]);
        }
      }
      return url;
    } catch {
      return url;
    }
  }

  private isValidUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }
}
