import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

interface TopQuery {
  query: string;
  count: number;
  avgResults: number;
  lastSearched: string;
}

interface ZeroResultQuery {
  query: string;
  count: number;
}

interface VolumePoint {
  date: string;
  count: number;
}

type Period = '7d' | '30d' | '90d';

const PERIOD_OPTIONS: { label: string; value: Period }[] = [
  { label: '7 days', value: '7d' },
  { label: '30 days', value: '30d' },
  { label: '90 days', value: '90d' },
];

function UnicodeBarChart({ data }: { data: VolumePoint[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-gray-400 italic">No volume data available.</p>;
  }
  const max = Math.max(...data.map(d => d.count), 1);
  const last14 = data.slice(-14);

  return (
    <div className="space-y-1">
      <div className="flex items-end gap-1 h-32">
        {last14.map((point) => {
          const height = Math.round((point.count / max) * 100);
          return (
            <div
              key={point.date}
              className="flex-1 flex flex-col items-center justify-end group relative"
              title={`${point.date}: ${point.count} search${point.count !== 1 ? 'es' : ''}`}
            >
              <div
                className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                style={{ height: `${Math.max(height, 2)}%` }}
              />
              {/* Tooltip */}
              <div className="absolute bottom-full mb-1 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                {point.date}: {point.count}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-1">
        {last14.map((point, i) => (
          <div
            key={point.date}
            className="flex-1 text-center"
          >
            {i % 2 === 0 && (
              <span className="text-xs text-gray-400">
                {point.date.slice(5)}
              </span>
            )}
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-400 text-right">Last 14 days</p>
    </div>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function SkeletonRows({ n }: { n: number }) {
  return (
    <>
      {Array.from({ length: n }).map((_, i) => (
        <tr key={i}>
          <td colSpan={99}>
            <div className="h-5 bg-gray-100 rounded animate-pulse mb-1" />
          </td>
        </tr>
      ))}
    </>
  );
}

export default function SearchAnalytics() {
  const [period, setPeriod] = useState<Period>('30d');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-search-analytics', period],
    queryFn: () =>
      api
        .get<{ topQueries: TopQuery[]; zeroResultQueries: ZeroResultQuery[]; volumeOverTime: VolumePoint[] }>(
          `/admin/search-analytics?period=${period}`
        )
        .then(r => r.data),
    staleTime: 60_000,
  });

  const topQueries = data?.topQueries ?? [];
  const zeroResults = data?.zeroResultQueries ?? [];
  const volume = data?.volumeOverTime ?? [];
  const totalSearches = volume.reduce((s, v) => s + v.count, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Search Analytics</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Understand what users are searching for and where content is missing
        </p>
      </div>

      {/* Period filter */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600 font-medium">Period:</span>
        <div role="group" className="flex gap-1 bg-gray-100 dark:bg-dark-bg p-1 rounded-lg">
          {PERIOD_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              aria-pressed={period === opt.value}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors focus:ring-2 focus:ring-indigo-500 focus:outline-none ${
                period === opt.value
                  ? 'bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text shadow-sm'
                  : 'text-gray-500 dark:text-dark-text/60 hover:text-gray-700 dark:hover:text-dark-text'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {isError && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
          Failed to load search analytics. Please refresh.
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-dark-surface rounded-xl border border-gray-200 dark:border-dark-border p-4">
          <p className="text-xs font-medium text-gray-500 dark:text-dark-text/50 mb-1">Total Searches</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-dark-text">
            {isLoading ? '…' : totalSearches.toLocaleString()}
          </p>
          <p className="text-xs text-gray-400 dark:text-dark-text/40 mt-0.5">in selected period</p>
        </div>
        <div className="bg-white dark:bg-dark-surface rounded-xl border border-gray-200 dark:border-dark-border p-4">
          <p className="text-xs font-medium text-gray-500 dark:text-dark-text/50 mb-1">Unique Queries</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-dark-text">
            {isLoading ? '…' : topQueries.length}
          </p>
          <p className="text-xs text-gray-400 dark:text-dark-text/40 mt-0.5">top queries tracked</p>
        </div>
        <div className="bg-white dark:bg-dark-surface rounded-xl border border-gray-200 dark:border-dark-border p-4">
          <p className="text-xs font-medium text-gray-500 dark:text-dark-text/50 mb-1">Zero Results</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-dark-text">
            {isLoading ? '…' : zeroResults.length}
          </p>
          <p className="text-xs text-gray-400 dark:text-dark-text/40 mt-0.5">queries with no matches</p>
        </div>
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-100 dark:bg-dark-surface rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* ── Section 1: Top Searches ── */}
      {topQueries.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-dark-text">
              🔎 Top Searches
            </h2>
            <span className="text-xs text-gray-400 dark:text-dark-text/40">({topQueries.length})</span>
          </div>
          <div className="bg-white dark:bg-dark-surface rounded-xl border border-gray-200 dark:border-dark-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-dark-bg border-b border-gray-200 dark:border-dark-border">
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-dark-text/60 text-xs uppercase tracking-wide w-8">#</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-dark-text/60 text-xs uppercase tracking-wide">Query</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-dark-text/60 text-xs uppercase tracking-wide">Searches</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-dark-text/60 text-xs uppercase tracking-wide">Avg Results</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-dark-text/60 text-xs uppercase tracking-wide">Last Searched</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-dark-border">
                {topQueries.map((q, i) => (
                  <tr key={q.query} className="hover:bg-gray-50 dark:hover:bg-dark-bg transition">
                    <td className="px-4 py-3 text-gray-300 dark:text-dark-text/30 text-xs">{i + 1}</td>
                    <td className="px-4 py-3">
                      <code className="text-sm text-gray-800 dark:text-dark-text font-mono">{q.query}</code>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-semibold text-gray-900 dark:text-dark-text">{q.count}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-xs ${q.avgResults === 0 ? 'text-red-500' : 'text-gray-500 dark:text-dark-text/60'}`}>
                        {q.avgResults}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 dark:text-dark-text/40">
                      {formatDate(q.lastSearched)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Section 2: Zero Result Queries ── */}
      {zeroResults.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-dark-text">
              ⚠️ Zero Result Queries
            </h2>
            <span className="text-xs text-gray-400 dark:text-dark-text/40">({zeroResults.length})</span>
            <span className="text-xs text-gray-400 dark:text-dark-text/40 ml-1">— content gaps to fill</span>
          </div>
          <div className="bg-white dark:bg-dark-surface rounded-xl border border-gray-200 dark:border-dark-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-dark-bg border-b border-gray-200 dark:border-dark-border">
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-dark-text/60 text-xs uppercase tracking-wide">Query</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-dark-text/60 text-xs uppercase tracking-wide">Searches</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-dark-border">
                {zeroResults.map((q) => (
                  <tr key={q.query} className="hover:bg-gray-50 dark:hover:bg-dark-bg transition">
                    <td className="px-4 py-3">
                      <code className="text-sm text-red-600 dark:text-red-400 font-mono">{q.query}</code>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-xs text-gray-400 dark:text-dark-text/40">{q.count} searches</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 dark:text-dark-text/40 italic">
            These {zeroResults.length} search{zeroResults.length !== 1 ? 'es' : ''} returned no results.
            Consider creating FAQ content to address these topics.
          </p>
        </div>
      )}

      {/* ── Section 3: Search Volume ── */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-dark-text">
          📈 Search Volume
        </h2>
        <div className="bg-white dark:bg-dark-surface rounded-xl border border-gray-200 dark:border-dark-border p-4">
          <UnicodeBarChart data={volume} />
        </div>
      </div>

      {/* Empty state */}
      {!isLoading && topQueries.length === 0 && zeroResults.length === 0 && (
        <div className="bg-white dark:bg-dark-surface rounded-xl border border-gray-200 dark:border-dark-border p-10 text-center">
          <span className="text-4xl">📊</span>
          <p className="text-gray-500 dark:text-dark-text/60 text-sm mt-2">No search data available yet.</p>
          <p className="text-gray-400 dark:text-dark-text/40 text-xs mt-1">
            Search analytics will appear once users start searching.
          </p>
        </div>
      )}
    </div>
  );
}