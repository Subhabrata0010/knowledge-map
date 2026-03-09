/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Graph canvas component using React Flow
 */

'use client';

import React, { useCallback, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { ReactFlowNode, ReactFlowEdge } from '@/types';
import { CustomNode } from './CustomNode';

export interface GraphCanvasProps {
  nodes: ReactFlowNode[];
  edges: ReactFlowEdge[];
  onNodeClick?: (nodeId: string) => void;
}

export function GraphCanvas({ nodes: initialNodes, edges: initialEdges, onNodeClick }: GraphCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: any) => {
      if (onNodeClick) {
        onNodeClick(node.id);
      }
    },
    [onNodeClick]
  );

  const nodeTypes = useMemo(() => ({ custom: CustomNode }), []);

  return (
    <div className="w-full h-full" style={{ background: '#0a0a0a' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.3}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        defaultEdgeOptions={{
          style: { 
            stroke: '#3f3f46',
            strokeWidth: 1.5
          },
          animated: false
        }}
      >
        <Background 
          color="#27272a"
          gap={16}
          size={1}
          style={{ background: '#0a0a0a' }}
        />
        <Controls 
          style={{
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '8px'
          }}
        />
        <MiniMap
          nodeColor={() => '#52525b'}
          maskColor="#0a0a0a"
          style={{
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '8px'
          }}
          nodeStrokeWidth={0}
          zoomable
          pannable
        />
      </ReactFlow>
    </div>
  );
}
