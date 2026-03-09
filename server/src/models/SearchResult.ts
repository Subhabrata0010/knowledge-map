/**
 * Search result types
 */

export interface SearchResult {
  title: string;
  url: string;
  snippet?: string;
  rank: number;
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  totalResults: number;
  timestamp: string;
}
