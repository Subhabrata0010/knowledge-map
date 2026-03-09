/**
 * NLP processor using Compromise
 * Extracts named entities and important terms from text
 */

import nlp from 'compromise';
import { NamedEntity, NodeType } from '@/models';
import { logger } from '@/utils/logger';

export class NLPProcessor {
  /**
   * Extract named entities from text
   */
  extractEntities(text: string): NamedEntity[] {
    const doc = nlp(text);
    const entities: NamedEntity[] = [];

    // Extract organizations (companies, frameworks, tools)
    doc.organizations().forEach((org) => {
      entities.push({
        text: org.text(),
        type: 'organization',
        start: 0,
        end: 0,
      });
    });

    // Extract proper nouns (technologies, products)
    doc.match('#ProperNoun+').forEach((noun) => {
      const text = noun.text();
      // Filter out common words
      if (text.length > 2 && !this.isCommonWord(text)) {
        entities.push({
          text,
          type: 'proper_noun',
          start: 0,
          end: 0,
        });
      }
    });

    // Extract acronyms (often technologies)
    doc.acronyms().forEach((acronym) => {
      entities.push({
        text: acronym.text(),
        type: 'acronym',
        start: 0,
        end: 0,
      });
    });

    return entities;
  }

  /**
   * Extract technology-related terms using patterns
   */
  extractTechnologyTerms(text: string): string[] {
    const doc = nlp(text);
    const terms: Set<string> = new Set();

    // Patterns for technologies
    const patterns = [
      '#Noun (framework|library|platform|tool|language|database)',
      '(React|Vue|Angular|Next|Node|TypeScript|JavaScript|Python|Java|Go|Rust|AWS|Azure|GCP)',
      '#Acronym',
    ];

    patterns.forEach((pattern) => {
      doc.match(pattern).forEach((match) => {
        const text = match.text();
        if (text.length > 2) {
          terms.add(text);
        }
      });
    });

    return Array.from(terms);
  }

  /**
   * Extract sentences containing a specific entity (for context)
   */
  extractContext(text: string, entity: string): string[] {
    const doc = nlp(text);
    const sentences: string[] = [];

    doc.sentences().forEach((sentence) => {
      const sentenceText = sentence.text();
      if (sentenceText.toLowerCase().includes(entity.toLowerCase())) {
        sentences.push(sentenceText);
      }
    });

    return sentences.slice(0, 3); // Max 3 contexts per entity
  }

  private isCommonWord(word: string): boolean {
    const commonWords = new Set([
      'the',
      'The',
      'and',
      'And',
      'but',
      'But',
      'for',
      'For',
      'with',
      'With',
      'this',
      'This',
      'that',
      'That',
      'about',
      'About',
    ]);
    return commonWords.has(word);
  }
}
