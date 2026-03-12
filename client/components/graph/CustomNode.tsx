/**
 * Custom node component for React Flow
 */

'use client';

import React from 'react';
import { Handle, Position } from 'reactflow';

export interface CustomNodeProps {
  data: {
    label: string;
    nodeType: string;
    description?: string;
    importance?: number;
    frequency?: number;
    metadata?: {
      sources?: string[];
      contexts?: string[];
      [key: string]: any;
    };
  };
  selected?: boolean;
}

export function CustomNode({ data, selected }: CustomNodeProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const importance = data.importance || 0.5;

  return (
    <div className="relative">
      <Handle 
        type="target" 
        position={Position.Top}
        style={{ background: '#52525b', border: 'none', width: '8px', height: '8px' }}
      />
      
      {/* Card container - FIXED for expanded state */}
      <div
        className={`minimal-card rounded-lg transition-all duration-200 cursor-pointer ${
          selected ? 'border-white' : ''
        } ${isExpanded ? 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-96' : 'relative'}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Backdrop when expanded */}
        {isExpanded && (
          <div 
            className="fixed inset-0 bg-black/50 -z-10"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(false);
            }}
          />
        )}

        <div className={`${isExpanded ? 'p-6' : 'px-4 py-3'}`}>
          {/* Title */}
          <div className={`font-semibold text-white ${isExpanded ? 'text-lg mb-3' : 'text-sm text-center'}`}>
            {data.label}
          </div>

          {/* Type badge */}
          <div className={`inline-block px-2 py-1 rounded text-xs bg-zinc-800 text-gray-400 border border-zinc-700 ${isExpanded ? 'mb-4' : ''}`}>
            {data.nodeType}
          </div>

          {/* Description - only when expanded */}
          {isExpanded && data.description && (
            <div className="text-sm text-gray-300 mt-3 leading-relaxed max-h-48 overflow-y-auto">
              {data.description}
            </div>
          )}

          {/* Source Links - only when expanded */}
          {isExpanded && data.metadata?.sources && data.metadata.sources.length > 0 && (
            <div className="mt-4">
              <div className="text-xs font-medium text-gray-500 mb-2 uppercase">Sources</div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {data.metadata.sources.slice(0, 5).map((source: string, idx: number) => (
                  <a
                    key={idx}
                    href={source}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="block text-xs text-blue-400 hover:text-blue-300 truncate"
                    title={source}
                  >
                    {new URL(source).hostname}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          {isExpanded && (
            <div className="flex gap-4 mt-4 pt-4 border-t border-zinc-800">
              {data.frequency && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500">Mentions:</span>
                  <span className="text-white font-medium">{data.frequency}</span>
                </div>
              )}
              {data.importance && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500">Score:</span>
                  <span className="text-white font-medium">{Math.round(importance * 100)}%</span>
                </div>
              )}
            </div>
          )}

          {/* Close button when expanded */}
          {isExpanded && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(false);
              }}
              className="absolute top-4 right-4 text-gray-500 hover:text-white"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <Handle 
        type="source" 
        position={Position.Bottom}
        style={{ background: '#52525b', border: 'none', width: '8px', height: '8px' }}
      />
    </div>
  );
}
