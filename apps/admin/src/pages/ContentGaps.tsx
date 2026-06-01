import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

interface ContentGap {
  type: 'zero_results' | 'poor_rating';
  searchTerm?: string;
  question?: {
    _id: string;
    title: string;
    status: string;
    starRating?: number;
  };
  count?: number;
}

const DAY_OPTIONS = [
  { label: '7 days', value: 7 },
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
];

function StarDisplay({ rating }: { rating: number }) {
  return (
    <span className="text-yellow-500 text-sm">
      {'★'.repeat(Math.round(rating))}
      {'☆'.repeat(5 - Math.round(rating))}
      <span className="text-gray-400 text-xs ml-1">({rating.toFixed(1)})</span>
    </span>
  );
}

export default function ContentGaps() {
  const [days, setDays] = useState(30);

  const { data, isLoading, isError } = useQuery<{ gaps: ContentGap[]; total: number }>({
    queryKey: ['admin-content-gaps', days],
    queryFn: () =>
      api
        .get<{ gaps: ContentGap[]; total: number }>(`/admin/content-gaps?days=${days}`)
        .then((r) => r.data as { gaps: ContentGap[]; total: number }),
    staleTime: 60_000,
  });

  const gaps = data?.gaps ?? [];
  const zeroResults = gaps.filter((g: ContentGap) => g.type === 'zero_results');
  const poorRatings = gaps.filter((g: ContentGap) => g.type === 'poor_rating');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Content Gaps</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Innovation C — identify topics with missing or poorly-rated answers
        </p>
      </div>

      {/* Days filter */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600 font-medium" id="days-filter-label">Analysis window:</span>
        <div role="group" aria-labelledby="days-filter-label" className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {DAY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDays(opt.value)}
              aria-pressed={days === opt.value}
              aria-label={`Show content gaps from the last ${opt.label}`}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors focus:ring-2 focus:ring-indigo-500 focus:outline-none ${
                days === opt.value
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {isError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          Failed to load content gaps. Please refresh.
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-medium text-gray-500 mb-1">Zero-result searches</p>
          <p className="text-2xl font-bold text-gray-900">{isLoading ? '…' : zeroResults.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">Searches that returned no FAQ matches</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-medium text-gray-500 mb-1">Poorly rated content</p>
          <p className="text-2xl font-bold text-gray-900">{isLoading ? '…' : poorRatings.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">Questions rated below 3 stars</p>
        </div>
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && gaps.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <span className="text-4xl">🎉</span>
          <p className="text-gray-500 text-sm mt-2">No content gaps found!</p>
          <p className="text-gray-400 text-xs mt-1">All searched topics have adequate coverage.</p>
        </div>
      )}

      {/* Section A — Zero-Result Searches */}
      {zeroResults.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-gray-700">
              🔍 Zero-Result Searches
            </h2>
            <span className="text-xs text-gray-400">({zeroResults.length})</span>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide w-8">
                    ✓
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide">
                    Search Term
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide">
                    Count
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {zeroResults
                  .slice()
                  .sort((a, b) => (b.count ?? 0) - (a.count ?? 0))
                  .map((gap: ContentGap, i: number) => (
                    <tr key={i} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          readOnly
                          className="w-4 h-4 accent-indigo-600 rounded"
                          aria-label={`Mark "${gap.searchTerm}" for content creation`}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <code className="text-sm text-gray-800 font-mono">{gap.searchTerm}</code>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-xs text-gray-400">{gap.count} searches</span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 italic">
            {zeroResults.length} topic{zeroResults.length !== 1 ? 's' : ''} need new FAQ articles.
            Check items above as you address them.
          </p>
        </div>
      )}

      {/* Section B — Poorly Rated Content */}
      {poorRatings.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-gray-700">
              ⭐ Poorly Rated Questions
            </h2>
            <span className="text-xs text-gray-400">({poorRatings.length})</span>
            <span className="text-xs text-gray-400 ml-1">— Content improvement priority checklist</span>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide w-8">
                    ✓
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide">
                    Question
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide">
                    Category
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide">
                    Avg Rating
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {poorRatings.map((gap: ContentGap, i: number) => (
                  <tr key={i} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        readOnly
                        className="w-4 h-4 accent-indigo-600 rounded"
                        aria-label={`Mark "${gap.question?.title}" for improvement`}
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800 max-w-xs truncate">
                      {gap.question?.title ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                        {gap.question?.status ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {gap.question?.starRating !== undefined ? (
                        <StarDisplay rating={gap.question.starRating} />
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 italic">
            These questions have ratings below 3 stars. Prioritise improving their answers.
          </p>
        </div>
      )}
    </div>
  );
}