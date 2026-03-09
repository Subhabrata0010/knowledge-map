/**
 * Node details panel
 */

'use client';

import React from 'react';
import { Node } from '@/types';

export interface NodeDetailsPanelProps {
  node: Node | null;
  onClose: () => void;
}

export function NodeDetailsPanel({ node, onClose }: NodeDetailsPanelProps) {
  if (!node) return null;

  return (
    <div className="absolute top-4 right-4 w-80 z-10">
      <div className="minimal-card rounded-lg p-6">
        <div className="flex justify-between items-start mb-6">
          <h3 className="text-xl font-semibold text-white">
            {node.name}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors p-1 rounded hover:bg-zinc-800"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1 uppercase">Type</p>
            <p className="text-base capitalize text-white">{node.type}</p>
          </div>

          {node.description && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2 uppercase">Description</p>
              <p className="text-sm text-gray-400 leading-relaxed">{node.description}</p>
            </div>
          )}

          {node.frequency && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1 uppercase">Mentions</p>
              <p className="text-2xl font-semibold text-white">{node.frequency}</p>
            </div>
          )}

          {node.importance && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-3 uppercase">Importance</p>
              <div className="flex items-center">
                <div className="flex-1 bg-zinc-900 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-white transition-all duration-500"
                    style={{ width: `${node.importance * 100}%` }}
                  />
                </div>
                <span className="ml-3 text-sm font-medium text-white">{Math.round(node.importance * 100)}%</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
