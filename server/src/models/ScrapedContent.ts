/**
 * Scraped content types
 */

export interface ScrapedContent {
  url: string;
  title: string;
  text: string;
  html?: string;
  author?: string;
  publishedDate?: string;
  excerpt?: string;
  wordCount: number;
  success: boolean;
  error?: string;
}

export interface ScrapeResult {
  successful: ScrapedContent[];
  failed: FailedScrape[];
}

export interface FailedScrape {
  url: string;
  error: string;
  statusCode?: number;
}
