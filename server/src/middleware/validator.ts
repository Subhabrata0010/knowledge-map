/**
 * Request validator middleware
 */

import { ValidationError } from '@/utils/errors';
import { Validator } from '@/utils/validators';

export interface GenerateMapRequest {
  topic: string;
}

export interface GetGraphRequest {
  topic: string;
}

export class RequestValidator {
  static validateGenerateMapRequest(body: any): GenerateMapRequest {
    if (!body) {
      throw new ValidationError('Request body is required');
    }

    if (!body.topic) {
      throw new ValidationError('Topic is required');
    }

    const topic = Validator.validateTopic(body.topic);

    return { topic };
  }

  static validateGetGraphRequest(pathParameters: any): GetGraphRequest {
    if (!pathParameters || !pathParameters.topic) {
      throw new ValidationError('Topic parameter is required');
    }

    const topic = Validator.validateTopic(pathParameters.topic);

    return { topic };
  }
}
