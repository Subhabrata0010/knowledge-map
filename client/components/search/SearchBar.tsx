/**
 * Search bar component
 */

'use client';

import React, { useState } from 'react';
import { Input } from '../ui';
import { Button } from '../ui';

export interface SearchBarProps {
  onSearch: (topic: string) => void;
  loading?: boolean;
  placeholder?: string;
}

export function SearchBar({
  onSearch,
  loading = false,
  placeholder = 'Enter a topic (e.g., AI Agents, WebAssembly)...',
}: SearchBarProps) {
  const [topic, setTopic] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim()) {
      onSearch(topic.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl">
      <div className="flex gap-3">
        <div className="flex-1">
          <Input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={placeholder}
            disabled={loading}
          />
        </div>
        <Button type="submit" loading={loading} disabled={!topic.trim()}>
          Generate Map
        </Button>
      </div>
    </form>
  );
}
