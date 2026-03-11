/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { Graph, Node as GraphNode } from '@/types/graph';

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
  x?: number;
  y?: number;
  z?: number;
}

export function Graph3D({ graph, onNodeClick }: Graph3DProps) {
  const fgRef = useRef<any>(null);
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

  // Configure force simulation for better node distribution
  useEffect(() => {
    if (fgRef.current) {
      // Stronger forces for better spreading
      fgRef.current.d3Force('charge').strength(-300); // Increased repulsion
      fgRef.current.d3Force('link').distance(150); // Increased link distance
      fgRef.current.d3Force('center').strength(0.1); // Weak centering
      
      // Set initial camera position once
      setTimeout(() => {
        if (fgRef.current) {
          fgRef.current.cameraPosition(
            { x: 0, y: 0, z: 600 }, // Position camera away from center
            { x: 0, y: 0, z: 0 },   // Look at center
            1000                     // Transition duration
          );
        }
      }, 100);
    }
  }, []);

  // Handle node hover
  const handleNodeHover = useCallback((node: any) => {
    setHoverNode(node || null);
    
    if (node) {
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
    // Focus camera on clicked node with gentle zoom
    const distance = 250;
    if (fgRef.current) {
      fgRef.current.cameraPosition(
        { x: node.x, y: node.y, z: node.z + distance }, // Position camera in front of node
        { x: node.x, y: node.y, z: node.z },            // Look at the node
        1000                                             // Smooth transition
      );
    }
    
    // Call parent handler
    if (onNodeClick) {
      const originalNode = graph.nodes.find((n) => n.id === node.id);
      if (originalNode) onNodeClick(originalNode);
    }
  }, [graph.nodes, onNodeClick]);

  // Custom node appearance with text labels
  const nodeThreeObject = useCallback((node: any) => {
    // Dynamic imports for Three.js
    if (typeof window === 'undefined') return null;
    
    // eslint-disable-next-line @typescript-eslint/no-var-requires
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
    
    // Add text label using sprite
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (context) {
      canvas.width = 512;
      canvas.height = 128;
      
      context.fillStyle = '#ffffff';
      context.font = 'Bold 48px Arial';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      
      // Truncate long names
      const displayName = node.name.length > 20 ? node.name.substring(0, 20) + '...' : node.name;
      context.fillText(displayName, 256, 64);
      
      const texture = new THREE.CanvasTexture(canvas);
      const spriteMaterial = new THREE.SpriteMaterial({ 
        map: texture,
        transparent: true,
        opacity: 0.9
      });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.scale.set(100, 25, 1); // Scale to appropriate size
      sprite.position.set(0, node.size + 20, 0); // Position above node
      group.add(sprite);
    }
    
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
        warmupTicks={100}
        cooldownTicks={200}
        cooldownTime={3000}
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
        <div className="mb-1">🖱️ <span className="text-gray-400">Left-click + drag to rotate</span></div>
        <div className="mb-1">🔍 <span className="text-gray-400">Scroll to zoom</span></div>
        <div className="mb-1">⌨️ <span className="text-gray-400">Right-click + drag to pan</span></div>
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
