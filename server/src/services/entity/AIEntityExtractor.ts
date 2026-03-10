/**
 * FREE HuggingFace model entity extractor (like Perplexity)
 * Deploy on AWS Lambda/SageMaker - NO API COSTS
 * Models: Llama-3.2-3B, Mistral-7B, Phi-3, etc.
 */

import axios from 'axios';
import { ScrapedContent, Entity, NodeType } from '@/models';
import { config } from '@/config';
import { logger } from '@/utils/logger';
import { Normalizer } from '@/utils/normalizer';

interface HFEntityResponse {
  entities: Array<{
    name: string;
    type: string;
    importance: number;
    context: string;
  }>;
}

export class HuggingFaceExtractor {
  private endpointUrl: string;

  constructor() {
    if (!config.huggingface.endpointUrl && !config.huggingface.localMode) {
      throw new Error('HuggingFace endpoint not configured. Set HF_ENDPOINT_URL or HF_LOCAL_MODEL=true');
    }
    this.endpointUrl = config.huggingface.endpointUrl;
  }

  /**
   * Extract entities using HuggingFace model on AWS
   */
  async extractEntities(contents: ScrapedContent[]): Promise<Entity[]> {
    logger.info(`HF: Extracting entities from ${contents.length} sources`);

    // Combine and truncate content
    const combinedText = contents
      .map((c, i) => `[Source ${i + 1}: ${c.url}]\n${c.text}`)
      .join('\n\n---\n\n')
      .slice(0, 50000); // Keep under model context limit

    const prompt = `Extract ${config.extraction.maxEntities} key entities from this content as JSON.

Focus on: technologies, frameworks, libraries, languages, platforms, tools, concepts.

Return JSON:
{
  "entities": [
    {"name": "Entity Name", "type": "technology|framework|library|language|platform|tool|concept", "importance": 1-10, "context": "brief description"}
  ]
}

Content:
${combinedText}`;

    try {
      const startTime = Date.now();
      
      // Call SageMaker endpoint or local Lambda model
      const response = await axios.post(
        this.endpointUrl,
        {
          inputs: prompt,
          parameters: {
            max_new_tokens: config.huggingface.maxTokens,
            temperature: 0.3,
            return_full_text: false,
          },
        },
        {
          timeout: 10000, // 10s timeout
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const responseTime = Date.now() - startTime;
      logger.info(`HF: Response received in ${responseTime}ms`);

      // Parse model response
      const modelOutput = response.data.generated_text || response.data[0]?.generated_text || '';
      const hfResponse = this.parseModelResponse(modelOutput);

      // Convert to Entity objects
      const entities = this.convertToEntities(hfResponse, contents);

      logger.info(`HF: Extracted ${entities.length} entities`);
      return entities;
    } catch (error) {
      logger.error('HF extraction failed, falling back to local NLP', error);
      throw error;
    }
  }

  private parseModelResponse(text: string): HFEntityResponse {
    try {
      // Try to extract JSON from markdown code block if present
      const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      const jsonText = jsonMatch ? jsonMatch[1] : text;
      return JSON.parse(jsonText);
    } catch (error) {
      logger.error('Failed to parse AI response', { text, error });
      return { entities: [] };
    }
  }

  private convertToEntities(hfResponse: HFEntityResponse, contents: ScrapedContent[]): Entity[] {
    const entities: Entity[] = [];

    for (const hfEntity of hfResponse.entities) {
      const entityId = Normalizer.generateId(hfEntity.name);

      // Find which sources mention this entity
      const sources = new Set<string>();
      for (const content of contents) {
        if (content.text.toLowerCase().includes(hfEntity.name.toLowerCase())) {
          sources.add(content.url);
        }
      }

      entities.push({
        name: hfEntity.name,
        type: this.mapType(hfEntity.type),
        frequency: hfEntity.importance, // Use model importance as frequency
        cooccurrences: new Map(),
        contexts: [hfEntity.context],
        sources,
      });
    }

    return entities;
  }

  private mapType(hfType: string): NodeType {
    const lowerType = hfType.toLowerCase();
    const typeMap: Record<string, NodeType> = {
      technology: NodeType.TECHNOLOGY,
      framework: NodeType.FRAMEWORK,
      library: NodeType.LIBRARY,
      language: NodeType.LANGUAGE,
      platform: NodeType.PLATFORM,
      tool: NodeType.TOOL,
      concept: NodeType.CONCEPT,
      company: NodeType.COMPANY,
    };

    return typeMap[lowerType] || NodeType.CONCEPT;
  }
}
