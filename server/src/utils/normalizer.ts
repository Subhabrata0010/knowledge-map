/**
 * String normalization utilities
 */

export class Normalizer {
  /**
   * Normalize a topic string to use as a cache key
   */
  static normalizeTopic(topic: string): string {
    return topic
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Normalize entity names for deduplication
   */
  static normalizeEntity(entity: string): string {
    return entity
      .trim()
      .toLowerCase()
      .replace(/[^\w\s.-]/g, '')
      .replace(/\s+/g, ' ');
  }

  /**
   * Generate a unique ID from a string
   */
  static generateId(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Extract domain from URL
   */
  static extractDomain(url: string): string {
    try {
      const parsed = new URL(url);
      return parsed.hostname;
    } catch {
      return '';
    }
  }
}
