/**
 * Home page - Search interface
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SearchBar } from '@/components/search';
import { Loading, ErrorMessage } from '@/components/ui';
import { useGraph } from '@/hooks';

export default function Home() {
  const router = useRouter();
  const [searchTopic, setSearchTopic] = useState('');
  const { loading, error, generateMap } = useGraph({ topic: searchTopic });

  const handleSearch = async (topic: string) => {
    setSearchTopic(topic);
    try {
      await generateMap();
      // Navigate to graph page
      router.push(`/graph/${encodeURIComponent(topic)}`);
    } catch (err) {
      // Error will be displayed by ErrorMessage component
      console.error('Search failed:', err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Floating Nav */}
      <nav className="fixed top-8 left-1/2 transform -translate-x-1/2 z-50">
        <div className="minimal-card rounded-full px-6 py-3 flex items-center gap-6">
          <a href="/" className="text-sm text-gray-400 hover:text-white transition-colors">
            Home
          </a>
          <div className="w-1 h-1 bg-gray-600 rounded-full" />
          <a href="https://github.com" target="_blank" rel="noopener" className="text-sm text-gray-400 hover:text-white transition-colors">
            GitHub
          </a>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="max-w-4xl w-full text-center">
          {/* Hero Section */}
          <div className="mb-12">
            <div className="mb-6 flex justify-center">
              <div className="text-6xl">🗺️</div>
            </div>
            <h1 className="text-6xl font-bold text-white mb-6">
              Internet Knowledge Map
            </h1>
            <p className="text-xl text-gray-400 mb-3">
              Transform any topic into an interactive knowledge graph
            </p>
            <p className="text-gray-500 text-sm">
              Built from real web content using AI-powered entity extraction
            </p>
          </div>

          {/* Search Section */}
          <div className="mb-8">
            <SearchBar onSearch={handleSearch} loading={loading} />
          </div>

          {/* Loading State */}
          {loading && (
            <div className="mt-8 minimal-card rounded-xl p-8 max-w-md mx-auto">
              <Loading message="Generating knowledge map..." />
              <p className="text-sm text-gray-500 mt-4">
                This may take 8-12 seconds
              </p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="mt-8">
              <ErrorMessage
                message={error.message}
                onRetry={() => handleSearch(searchTopic)}
              />
            </div>
          )}

          {/* Example Topics */}
          {!loading && !error && (
            <div className="mt-12">
              <p className="text-sm text-gray-500 mb-6">Try these examples:</p>
              <div className="flex flex-wrap justify-center gap-3">
                {['AI Agents', 'WebAssembly', 'Edge Computing', 'Quantum Computing', 'Rust Programming'].map(
                  (example) => (
                    <button
                      key={example}
                      onClick={() => handleSearch(example)}
                      className="px-5 py-2 minimal-card rounded-lg text-sm text-gray-300 hover:text-white hover:border-gray-600 transition-all"
                    >
                      {example}
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          {/* Features */}
          <div className="mt-20 grid md:grid-cols-3 gap-6 text-left">
            <div className="minimal-card rounded-xl p-6">
              <h3 className="font-semibold text-lg mb-3 text-white">
                📊 Visual Discovery
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Interactive graphs show relationships between technologies, tools, and concepts
              </p>
            </div>
            <div className="minimal-card rounded-xl p-6">
              <h3 className="font-semibold text-lg mb-3 text-white">
                🔍 Real Web Data
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Content extracted from actual articles, documentation, and research papers
              </p>
            </div>
            <div className="minimal-card rounded-xl p-6">
              <h3 className="font-semibold text-lg mb-3 text-white">
                ⚡ Fast & Free
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Serverless architecture optimized for AWS free tier with sub-10s generation
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
