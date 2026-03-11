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
    requestTimeout: parseInt(process.env.REQUEST_TIMEOUT || '10000', 10), // 10s - more lenient timeout
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
    useHF: process.env.USE_HF_MODEL === 'true',
  },

  huggingface: {
    endpointUrl: process.env.HF_ENDPOINT_URL || '',
    modelName: process.env.HF_MODEL_NAME || 'meta-llama/Llama-3.2-3B-Instruct',
    localMode: process.env.HF_LOCAL_MODEL === 'true',
    modelPath: process.env.HF_MODEL_PATH || '/opt/ml/model',
    maxTokens: 2048,
  },

  preScraping: {
    enabled: process.env.ENABLE_PRE_SCRAPING === 'true',
    topics: (process.env.PRE_SCRAPE_TOPICS || '').split(',').map(t => t.trim()).filter(Boolean),
    intervalHours: parseFloat(process.env.PRE_SCRAPE_INTERVAL_HOURS || '24'),
    maxTopics: parseInt(process.env.PRE_SCRAPE_MAX_TOPICS || '20', 10),
    pagesPerTopic: parseInt(process.env.PRE_SCRAPE_PAGES_PER_TOPIC || '3', 10),
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
    minSuccessfulScrapes: 2, // Reduced to handle cases with limited available content
    timeout: 150000, // 150 seconds (leave buffer for Lambda timeout of 180s)
  },
};

export type Config = typeof config;
