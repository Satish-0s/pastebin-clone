"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [content, setContent] = useState('');
  const [expiresIn, setExpiresIn] = useState('0'); // 0 = never
  const [viewLimit, setViewLimit] = useState(''); // empty = unlimited
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content) return;

    setLoading(true);
    try {
      const res = await fetch('/api/pastes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          ttl_seconds: expiresIn === '0' ? undefined : Number(expiresIn),
          max_views: viewLimit ? Number(viewLimit) : undefined,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create paste');
      }

      const data = await res.json();
      router.push(`/p/${data.id}`);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error creating paste');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8 max-w-2xl mx-auto flex flex-col gap-6">
      <h1 className="text-3xl font-bold">Pastebin Clone</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <textarea
          className="w-full h-64 p-4 border rounded-lg bg-background text-foreground resize-y font-mono"
          placeholder="Paste your content here..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />

        <div className="flex gap-4 flex-wrap">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Expiration</label>
            <select
              className="p-2 border rounded bg-background"
              value={expiresIn}
              onChange={(e) => setExpiresIn(e.target.value)}
            >
              <option value="0">Never</option>
              <option value="60">1 Minute</option>
              <option value="3600">1 Hour</option>
              <option value="86400">1 Day</option>
              <option value="604800">1 Week</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">View Limit (optional)</label>
            <input
              type="number"
              className="p-2 border rounded bg-background"
              placeholder="Unlimited"
              min="1"
              value={viewLimit}
              onChange={(e) => setViewLimit(e.target.value)}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 transition-colors"
        >
          {loading ? 'Creating...' : 'Create Paste'}
        </button>
      </form>
    </main>
  );
}
