/**
 * Global constants
 */

export const GRAPH_CONFIG = {
  // Node styling
  nodeWidth: 200,
  nodeHeight: 80,
  nodeBorderRadius: 8,
  
  // Edge styling
  edgeStrokeWidth: 2,
  
  // Layout
  layoutSpacing: 250,
  
  // Node colors by type
  nodeColors: {
    technology: '#6366f1',
    framework: '#8b5cf6',
    library: '#3b82f6',
    tool: '#06b6d4',
    concept: '#10b981',
    person: '#f59e0b',
    organization: '#ef4444',
    other: '#64748b',
  },
};

export const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  timeout: 30000,
};
