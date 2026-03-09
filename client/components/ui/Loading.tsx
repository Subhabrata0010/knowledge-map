/**
 * Loading component
 */

'use client';

import React from 'react';

export interface LoadingProps {
  message?: string;
  fullScreen?: boolean;
}

export function Loading({ message = 'Loading...', fullScreen = false }: LoadingProps) {
  const content = (
    <div className="flex flex-col items-center justify-center">
      <div className="relative w-16 h-16">
        <div className="absolute top-0 left-0 w-full h-full border-4 border-zinc-800 rounded-full"></div>
        <div className="absolute top-0 left-0 w-full h-full border-4 border-white rounded-full border-t-transparent animate-spin"></div>
      </div>
      <p className="mt-4 text-gray-400 font-medium">{message}</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: '#0a0a0a' }}>
        {content}
      </div>
    );
  }

  return content;
}
