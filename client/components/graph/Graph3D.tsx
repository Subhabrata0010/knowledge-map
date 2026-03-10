/**
 * 3D Interactive Knowledge Graph - Atom-like Hub & Spoke Model
 * Features:
 * - Omnidirectional rotation and navigation
 * - Physics-based layout with central hub
 * - Interactive hover and click
 * - Smooth camera controls
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Graph, Node as GraphNode, Edge as GraphEdge } from '@/types/graph';

// Dynamic import to avoid SSR issues with Three.js
const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="text-gray-400">Loading 3D graph...</div>
    </div>
  ),
});

interface Graph3DProps {
  graph: Graph;
  onNodeClick?: (node: GraphNode) => void;
}

interface ForceGraphNode {
  id: string;
  name: string;
  type: string;
  color: string;
  size: number;
  importance: number;
}

interface ForceGraphEdge {
  source: string;
  target: string;
  strength: number;
}

export function Graph3D({ graph, onNodeClick }: Graph3DProps) {
  const fgRef = useRef<any>();
  const [highlightNodes, setHighlightNodes] = useState(new Set());
  const [highlightLinks, setHighlightLinks] = useState(new Set());
  const [hoverNode, setHoverNode] = useState<any>(null);

  // Transform graph data for 3D visualization
  const graphData = {
    nodes: graph.nodes.map((node) => ({
      id: node.id,
      name: node.name,
      type: node.type,
      color: getNodeColor(node.type),
      size: Math.max(5, (node.importance || 10) * 2), // Scale importance to size
      importance: node.importance || 10,
    })),
    links: graph.edges.map((edge) => ({
      source: edge.source,
      target: edge.target,
      strength: edge.weight || 1,
    })),
  };

  // Configure force simulation for atom-like layout
  useEffect(() => {
    if (fgRef.current) {
      // Center force - creates hub effect
      fgRef.current.d3Force('center', null);
      fgRef.current.d3Force('charge').strength(-120);
      fgRef.current.d3Force('link').distance(100);
      
      // Auto-rotate camera for dynamic feel
      let angle = 0;
      const rotateSpeed = 0.0005;
      
      const animate = () => {
        if (fgRef.current && !hoverNode) {
          angle += rotateSpeed;
          const distance = 800;
          const x = distance * Math.sin(angle);
          const z = distance * Math.cos(angle);
          
          fgRef.current.cameraPosition(
            { x, y: 100, z },
            { x: 0, y: 0, z: 0 },
            1000
          );
        }
      };

      const intervalId = setInterval(animate, 50);
      return () => clearInterval(intervalId);
    }
  }, [hoverNode]);

  // Handle node hover
  const handleNodeHover = useCallback((node: any) => {
    setHighlightNodes(new Set(node ? [node.id] : []));
    setHoverNode(node || null);
    
    if (node) {
      // Highlight connected links
      const connectedLinks = graphData.links.filter(
        (link: any) => link.source.id === node.id || link.target.id === node.id
      );
      setHighlightLinks(new Set(connectedLinks));
    } else {
      setHighlightLinks(new Set());
    }
  }, [graphData.links]);

  // Handle node click
  const handleNodeClick = useCallback((node: any) => {
    // Focus camera on clicked node
    const distance = 300;
    if (fgRef.current) {
      fgRef.current.cameraPosition(
        { x: node.x + distance * 0.5, y: node.y + distance * 0.5, z: node.z + distance },
        node,
        1500
      );
    }
    
    // Call parent handler
    if (onNodeClick) {
      const originalNode = graph.nodes.find((n) => n.id === node.id);
      if (originalNode) onNodeClick(originalNode);
    }
  }, [graph.nodes, onNodeClick]);

  // Custom node appearance
  const nodeThreeObject = useCallback((node: ForceGraphNode) => {
    // Dynamic imports for Three.js
    if (typeof window === 'undefined') return null;
    
    const THREE = require('three');
    
    // Create glowing sphere for each node
    const group = new THREE.Group();
    
    // Main sphere
    const geometry = new THREE.SphereGeometry(node.size, 16, 16);
    const material = new THREE.MeshPhongMaterial({
      color: node.color,
      emissive: node.color,
      emissiveIntensity: 0.3,
      shininess: 100,
    });
    const mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);
    
    // Glow effect (larger transparent sphere)
    const glowGeometry = new THREE.SphereGeometry(node.size * 1.5, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: node.color,
      transparent: true,
      opacity: 0.2,
    });
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    group.add(glowMesh);
    
    return group;
  }, []);

  return (
    <div className="w-full h-full relative">
      <ForceGraph3D
        ref={fgRef}
        graphData={graphData}
        nodeLabel="name"
        nodeVal="size"
        nodeRelSize={4}
        nodeOpacity={0.95}
        nodeResolution={16}
        linkWidth={(link: any) => 
          highlightLinks.has(link) ? 3 : 1
        }
        linkOpacity={0.3}
        linkDirectionalParticles={4}
        linkDirectionalParticleWidth={(link: any) =>
          highlightLinks.has(link) ? 2 : 0
        }
        linkColor={(link: any) =>
          highlightLinks.has(link) ? '#60a5fa' : '#4b5563'
        }
        onNodeHover={handleNodeHover}
        onNodeClick={handleNodeClick}
        nodeThreeObject={nodeThreeObject}
        enableNodeDrag={true}
        enableNavigationControls={true}
        showNavInfo={false}
        backgroundColor="#000000"
      />
      
      {/* Hover tooltip */}
      {hoverNode && (
        <div 
          className="absolute top-4 left-4 minimal-card rounded-lg p-4 max-w-xs z-10"
          style={{ pointerEvents: 'none' }}
        >
          <h3 className="text-white font-semibold text-lg mb-1">
            {hoverNode.name}
          </h3>
          <p className="text-gray-400 text-sm capitalize">
            {hoverNode.type}
          </p>
          <div className="mt-2 text-xs text-gray-500">
            Importance: {hoverNode.importance.toFixed(1)}
          </div>
        </div>
      )}
      
      {/* Controls hint */}
      <div className="absolute bottom-4 right-4 minimal-card rounded-lg p-3 text-xs text-gray-500">
        <div className="mb-1">🖱️ <span className="text-gray-400">Drag to rotate</span></div>
        <div className="mb-1">🔍 <span className="text-gray-400">Scroll to zoom</span></div>
        <div>👆 <span className="text-gray-400">Click node for details</span></div>
      </div>
    </div>
  );
}

// Color mapping for different node types
function getNodeColor(type: string): string {
  const colorMap: Record<string, string> = {
    technology: '#3b82f6', // blue
    tool: '#10b981',       // green
    concept: '#8b5cf6',    // purple
    framework: '#f59e0b',  // amber
    language: '#ef4444',   // red
    platform: '#06b6d4',   // cyan
    library: '#ec4899',    // pink
    protocol: '#84cc16',   // lime
  };
  
  return colorMap[type.toLowerCase()] || '#6b7280'; // gray as default
}
