/**
 * Content extractor using Mozilla Readability
 * Extracts the main article content from HTML
 */

import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import { logger } from '@/utils/logger';

export interface ExtractedContent {
  title: string;
  textContent: string;
  excerpt?: string;
  byline?: string;
  length: number;
}

export class ContentExtractor {
  /**
   * Extract readable content from HTML
   */
  extract(html: string, url: string): ExtractedContent | null {
    try {
      // Create a DOM from HTML
      const dom = new JSDOM(html, { url });
      const reader = new Readability(dom.window.document);
      
      // Parse the article
      const article = reader.parse();

      if (!article || !article.textContent) {
        logger.warn(`No content extracted from ${url}`);
        return null;
      }

      return {
        title: article.title || '',
        textContent: article.textContent,
        excerpt: article.excerpt,
        byline: article.byline,
        length: article.length || article.textContent.length,
      };
    } catch (error) {
      logger.error(`Content extraction failed for ${url}`, error);
      return null;
    }
  }

  /**
   * Clean and normalize extracted text
   */
  cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\n{3,}/g, '\n\n') // Max 2 consecutive newlines
      .trim();
  }
}
