/* eslint-disable react-hooks/set-state-in-effect */
/**
 * Graph visualization page
 */

'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GraphCanvas } from '@/components/graph';
import { NodeDetailsPanel, GraphStatsPanel } from '@/components/panels';
import { Loading, ErrorMessage, Button } from '@/components/ui';
import { useGraph, useNodeSelection, useGraphLayout } from '@/hooks';
import { GraphTransformer } from '@/lib';
import { ReactFlowNode, ReactFlowEdge } from '@/types';

interface PageProps {
  params: Promise<{ topic: string }>;
}

export default function GraphPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const topic = decodeURIComponent(resolvedParams.topic);
  const router = useRouter();

  const { graph, loading, error, refetch } = useGraph({ topic, autoFetch: true });
  const { selectedNodeId, selectNode, clearSelection } = useNodeSelection();
  const { applyLayout } = useGraphLayout();

  const [nodes, setNodes] = useState<ReactFlowNode[]>([]);
  const [edges, setEdges] = useState<ReactFlowEdge[]>([]);

  // Transform and layout graph data
  useEffect(() => {
    if (graph) {
      const { nodes: transformedNodes, edges: transformedEdges } = GraphTransformer.transform(graph);
      const layoutedNodes = applyLayout(transformedNodes, transformedEdges);
      
      setNodes(layoutedNodes);
      setEdges(transformedEdges);
    }
  }, [graph, applyLayout]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading message={`Generating knowledge map for "${topic}"...`} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
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
      <div className="min-h-screen flex items-center justify-center">
        <p>No graph data available</p>
      </div>
    );
  }

  const selectedNode = selectedNodeId
    ? graph.nodes.find((n) => n.id === selectedNodeId) || null
    : null;

  return (
    <div className="h-screen flex flex-col">
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

      {/* Graph Canvas */}
      <div className=" flex-1 relative">
        <GraphCanvas
          nodes={nodes}
          edges={edges}
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
