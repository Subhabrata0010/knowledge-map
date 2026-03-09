/**
 * Footer component
 */

'use client';

import React from 'react';

export function Footer() {
  return (
    <footer className="minimal-card border-t py-6 mt-auto">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} Internet Knowledge Map
          </p>
          <p className="text-gray-600 text-xs mt-1">
            Built with Next.js & AWS Lambda
          </p>
        </div>
      </div>
    </footer>
  );
}
