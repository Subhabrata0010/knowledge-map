/**
 * Graph visualization constants
 */

export const GRAPH_CONFIG = {
  // Canvas
  defaultZoom: 1,
  minZoom: 0.5,
  maxZoom: 2,
  
  // Node styling
  nodeWidth: 150,
  nodeHeight: 60,
  nodeBorderRadius: 8,
  
  // Edge styling
  edgeStrokeWidth: 2,
  
  // Layout
  layoutSpacing: 150,
  
  // Colors by node type
  nodeColors: {
    technology: '#3B82F6',   // Blue
    framework: '#10B981',    // Green
    library: '#8B5CF6',      // Purple
    language: '#F59E0B',     // Orange
    concept: '#EC4899',      // Pink
    company: '#6366F1',      // Indigo
    tool: '#14B8A6',         // Teal
    platform: '#F97316',     // Orange
    standard: '#84CC16',     // Lime
    other: '#6B7280',        // Gray
  },
};
