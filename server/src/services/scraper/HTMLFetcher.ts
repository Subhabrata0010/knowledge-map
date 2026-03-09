/**
 * HTML fetcher with timeout and retry logic
 */

import axios, { AxiosError } from 'axios';
import { config } from '@/config';
import { logger } from '@/utils/logger';
import { retry } from '@/utils/retry';

export class HTMLFetcher {
  private userAgent = config.scraping.userAgent;
  private timeout = config.scraping.requestTimeout;

  /**
   * Fetch HTML content from a URL
   */
  async fetch(url: string): Promise<string> {
    try {
      const html = await retry(
        () => this.performFetch(url),
        { maxAttempts: 1, delayMs: 300 }, // Single attempt, fail fast
        `Fetch ${url}`
      );

      return html;
    } catch (error) {
      const axiosError = error as AxiosError;
      logger.warn(`Failed to fetch ${url}`, {
        status: axiosError.response?.status,
        error: axiosError.message,
      });
      throw error;
    }
  }

  private async performFetch(url: string): Promise<string> {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': this.userAgent,
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate',
      },
      timeout: this.timeout,
      maxRedirects: 3,
      validateStatus: (status) => status >= 200 && status < 300,
      decompress: true,
    });

    return response.data;
  }
}
