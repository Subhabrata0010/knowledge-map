/**
 * Environment configuration
 */

export const config = {
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    dynamodb: {
      nodesTable: process.env.DYNAMODB_NODES_TABLE || 'knowledge-map-nodes',
      edgesTable: process.env.DYNAMODB_EDGES_TABLE || 'knowledge-map-edges',
      cacheTable: process.env.DYNAMODB_CACHE_TABLE || 'knowledge-map-cache',
      endpoint: process.env.DYNAMODB_ENDPOINT, // For local development
    },
    s3: {
      bucket: process.env.S3_BUCKET || 'knowledge-map-content',
    },
  },
  
  scraping: {
    maxSearchResults: parseInt(process.env.MAX_SEARCH_RESULTS || '15', 10),
    maxConcurrentScrapes: parseInt(process.env.MAX_CONCURRENT_SCRAPES || '10', 10),
    requestTimeout: parseInt(process.env.REQUEST_TIMEOUT || '5000', 10), // 5s - fail fast
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    retryAttempts: 1, // Single retry only
    retryDelay: 500,
  },
  
  extraction: {
    minTextLength: 500,
    maxTextLength: 50000,
    minEntityFrequency: 1, // Allow single occurrences
    maxEntities: parseInt(process.env.MAX_ENTITIES || '40', 10),
    minRelationshipWeight: 0.3,
  },
  
  cache: {
    ttlHours: parseInt(process.env.CACHE_TTL_HOURS || '24', 10),
    enableCache: process.env.ENABLE_CACHE !== 'false',
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableStructured: true,
  },
  
  pipeline: {
    minSuccessfulScrapes: 3,
    timeout: 25000, // 25 seconds (leave 5s buffer for Lambda timeout)
  },
};

export type Config = typeof config;
