/**
 * Graph statistics panel
 */

'use client';

import React from 'react';
import { GraphMetadata } from '@/types';

export interface GraphStatsPanelProps {
  metadata: GraphMetadata;
}

export function GraphStatsPanel({ metadata }: GraphStatsPanelProps) {
  return (
    <div className="absolute top-4 left-4 w-64 z-10">
      <div className="minimal-card rounded-lg p-5">
        <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wide">
          Graph Stats
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Nodes</span>
            <span className="font-medium text-white">{metadata.nodeCount}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Edges</span>
            <span className="font-medium text-white">{metadata.edgeCount}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Avg Degree</span>
            <span className="font-medium text-white">{metadata.avgDegree.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Components</span>
            <span className="font-medium text-white">{metadata.components}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Generation</span>
            <span className="font-medium text-white">{(metadata.generationTimeMs / 1000).toFixed(1)}s</span>
          </div>
        </div>
      </div>
    </div>
  );
}
