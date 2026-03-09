/**
 * Scraper service orchestrator
 * Fetches and extracts content from web pages
 */

import { ScrapedContent, ScrapeResult } from '@/models';
import { HTMLFetcher } from './HTMLFetcher';
import { ContentExtractor } from './ContentExtractor';
import { config } from '@/config';
import { logger } from '@/utils/logger';
import { parallelMap } from '@/utils/parallel';
import { Validator } from '@/utils/validators';

export class ScraperService {
  private fetcher: HTMLFetcher;
  private extractor: ContentExtractor;

  constructor() {
    this.fetcher = new HTMLFetcher();
    this.extractor = new ContentExtractor();
  }

  /**
   * Scrape multiple URLs in parallel
   */
  async scrapeUrls(urls: string[]): Promise<ScrapeResult> {
    logger.info(`Starting to scrape ${urls.length} URLs`);

    // Validate URLs
    const validUrls = urls.filter((url) => Validator.validateUrl(url));
    logger.info(`Validated ${validUrls.length}/${urls.length} URLs`);

    // Scrape in parallel with concurrency limit
    const results = await parallelMap(
      validUrls,
      (url) => this.scrapeSingleUrl(url),
      {
        concurrency: config.scraping.maxConcurrentScrapes,
        continueOnError: true,
      }
    );

    // Separate successful and failed scrapes
    const successful = results.filter((r) => r.success) as ScrapedContent[];
    const failed = results
      .filter((r) => !r.success)
      .map((r) => ({
        url: r.url,
        error: r.error || 'Unknown error',
      }));

    logger.info(`Scraping complete: ${successful.length} successful, ${failed.length} failed`);

    return { successful, failed };
  }

  /**
   * Scrape a single URL
   */
  private async scrapeSingleUrl(url: string): Promise<ScrapedContent> {
    try {
      // Fetch HTML
      const html = await this.fetcher.fetch(url);

      // Extract content
      const extracted = this.extractor.extract(html, url);

      if (!extracted || !extracted.textContent) {
        return {
          url,
          title: '',
          text: '',
          wordCount: 0,
          success: false,
          error: 'No content extracted',
        };
      }

      // Clean text
      const cleanedText = this.extractor.cleanText(extracted.textContent);

      // Validate minimum length
      if (cleanedText.length < config.extraction.minTextLength) {
        return {
          url,
          title: extracted.title,
          text: cleanedText,
          wordCount: this.countWords(cleanedText),
          success: false,
          error: `Text too short: ${cleanedText.length} chars`,
        };
      }

      // Truncate if too long
      const finalText =
        cleanedText.length > config.extraction.maxTextLength
          ? cleanedText.substring(0, config.extraction.maxTextLength)
          : cleanedText;

      return {
        url,
        title: extracted.title,
        text: finalText,
        excerpt: extracted.excerpt,
        author: extracted.byline,
        wordCount: this.countWords(finalText),
        success: true,
      };
    } catch (error: any) {
      logger.warn(`Scraping failed for ${url}: ${error.message}`);
      return {
        url,
        title: '',
        text: '',
        wordCount: 0,
        success: false,
        error: error.message,
      };
    }
  }

  private countWords(text: string): number {
    return text.split(/\s+/).filter((word) => word.length > 0).length;
  }
}
