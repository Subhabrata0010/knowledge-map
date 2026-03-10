/* eslint-disable react-hooks/set-state-in-effect */
/**
 * Graph visualization page - 3D Interactive View
 */

'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Graph3D } from '@/components/graph';
import { NodeDetailsPanel, GraphStatsPanel } from '@/components/panels';
import { Loading, ErrorMessage, Button } from '@/components/ui';
import { useGraph, useNodeSelection } from '@/hooks';
import { Node as GraphNode } from '@/types/graph';

interface PageProps {
  params: Promise<{ topic: string }>;
}

export default function GraphPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const topic = decodeURIComponent(resolvedParams.topic);
  const router = useRouter();

  const { graph, loading, error, refetch } = useGraph({ topic, autoFetch: true });
  const { selectedNodeId, selectNode, clearSelection } = useNodeSelection();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loading message={`Generating knowledge map for "${topic}"...`} />
        <div className="text-gray-500 text-sm mt-6">
          This may take up to 30 seconds for first-time generation
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-black">
        <div className="max-w-md w-full">
          <ErrorMessage
            title="Failed to Load Graph"
            message={error.message}
            onRetry={refetch}
          />
          <div className="mt-4 text-center">
            <Button onClick={() => router.push('/')} variant="outline">
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!graph) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <p className="text-gray-400">No graph data available</p>
      </div>
    );
  }

  const selectedNode = selectedNodeId
    ? graph.nodes.find((n) => n.id === selectedNodeId) || null
    : null;

  return (
    <div className="h-screen flex flex-col bg-black">
      {/* Header */}
      <div className="minimal-card border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">
              {topic}
            </h1>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-4">
              <span>{graph.metadata.nodeCount} nodes</span>
              <span>·</span>
              <span>{graph.metadata.edgeCount} connections</span>
              <span>·</span>
              <span className="text-emerald-400">3D Interactive</span>
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              onClick={refetch} 
              variant="outline" 
              size="sm"
              className="minimal-card text-gray-300 hover:text-white"
            >
              Refresh
            </Button>
            <Button 
              onClick={() => router.push('/')} 
              variant="outline" 
              size="sm"
              className="minimal-card text-gray-300 hover:text-white"
            >
              New Search
            </Button>
          </div>
        </div>
      </div>

      {/* 3D Graph Canvas */}
      <div className="flex-1 relative">
        <Graph3D
          graph={graph}
          onNodeClick={selectNode}
        />

        {/* Overlays */}
        <GraphStatsPanel metadata={graph.metadata} />
        {selectedNode && (
          <NodeDetailsPanel node={selectedNode} onClose={clearSelection} />
        )}
      </div>
    </div>
  );
}
