/**
 * Input component
 */

'use client';

import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-400 mb-2">
          {label}
        </label>
      )}
      <input
        className={`w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg 
          text-white placeholder-gray-500 
          focus:ring-2 focus:ring-white/20 focus:border-white/20 
          transition-all duration-200
          ${error ? 'border-red-500 ring-2 ring-red-500/50' : ''} 
          ${className}`}
        {...props}
      />
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}
