/* eslint-disable @typescript-eslint/no-explicit-any */


import { Graph } from './graph';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

export interface GenerateMapRequest {
  topic: string;
}

export interface GenerateMapResponse extends ApiResponse<Graph> {}

export interface GetGraphResponse extends ApiResponse<Graph> {}
