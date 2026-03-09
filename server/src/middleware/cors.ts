/**
 * CORS middleware
 */

import { APIGatewayProxyResult } from './errorHandler';
import { getCorsHeaders } from './errorHandler';

export function handleOptionsRequest(): APIGatewayProxyResult {
  return {
    statusCode: 200,
    headers: getCorsHeaders(),
    body: '',
  };
}
