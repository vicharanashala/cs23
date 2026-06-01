import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import api from '../lib/api';

interface Question {
  _id: string;
  title: string;
  description?: string;
  body?: string;
  category: string;
  status: 'pending' | 'public_community' | 'official_faq' | 'rejected';
  upvotes: number;
  upvotedBy?: string[];
  starRating?: number;
  tags?: string[];
  createdAt: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  return `${days}d ago`;
}

export default function QuestionQueue() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [tagsInputs, setTagsInputs] = useState<Record<string, string>>({});

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const { data, isLoading, isError } = useQuery<{ questions: Question[]; total: number; page: number; totalPages: number }>({
    queryKey: ['admin-questions', page],
    queryFn: () =>
      api
        .get<{ questions: Question[]; total: number; page: number; totalPages: number }>(
          `/admin/questions/pending?page=${page}`
        )
        .then((r) => r.data as { questions: Question[]; total: number; page: number; totalPages: number }),
    staleTime: 30_000,
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, tags }: { id: string; tags?: string[] }) =>
      api.patch(`/admin/questions/${id}/approve`, { tags }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-questions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
      showToast('✓ Question approved and made public');
    },
    onError: () => {
      showToast('✗ Failed to approve question');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/questions/${id}/reject`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-questions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
      showToast('✗ Question rejected');
    },
    onError: () => {
      showToast('✗ Failed to reject question');
    },
  });

  const questions = data?.questions ?? [];

  const handleApprove = (q: Question) => {
    const tagsValue = tagsInputs[q._id] ?? '';
    const tags = tagsValue
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    approveMutation.mutate({ id: q._id, tags: tags.length > 0 ? tags : undefined });
  };

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-gray-900 text-white text-sm rounded-xl shadow-lg flex items-center gap-2">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} aria-label="Dismiss notification" className="text-gray-400 hover:text-white text-lg leading-none">×</button>
        </div>
      )}

      <div>
        <h1 className="text-xl font-bold text-gray-900">Question Queue</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Moderate community-submitted questions before they go public
        </p>
      </div>

      {isError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          Failed to load questions. Please refresh.
        </div>
      )}

      {/* Cards grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : questions.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <span className="text-4xl">🎉</span>
          <p className="text-gray-500 text-sm mt-2">No pending questions to review.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {questions.map((q) => {
            const isExpanded = expandedId === q._id;
            const description = q.description || q.body || '';

            return (
              <div
                key={q._id}
                className="bg-white rounded-xl border border-gray-200 p-5 space-y-3 hover:shadow-md transition"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 leading-snug">
                      {q.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                        {q.category}
                      </span>
                      <span className="text-xs text-gray-400">{timeAgo(q.createdAt)}</span>
                      <span className="text-xs text-gray-300">·</span>
                      <span className="text-xs text-gray-400">👍 {q.upvotes}</span>
                      {q.starRating !== undefined && q.starRating > 0 && (
                        <>
                          <span className="text-gray-300">·</span>
                          <span className="text-xs text-yellow-600">★ {q.starRating.toFixed(1)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description */}
                {isExpanded && description && (
                  <div className="p-3 bg-gray-50 rounded-lg text-xs text-gray-700 leading-relaxed border border-gray-100">
                    {description.length > 300 ? description.slice(0, 300) + '…' : description}
                  </div>
                )}

                {/* Show/hide description */}
                {description && (
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : q._id)}
                    aria-expanded={isExpanded}
                    aria-label={isExpanded ? `Hide description for: ${q.title}` : `Show description for: ${q.title}`}
                    className="text-xs text-indigo-600 hover:underline focus:ring-2 focus:ring-indigo-500 focus:outline-none rounded"
                  >
                    {isExpanded ? '▲ Hide description' : '▼ Show description'}
                  </button>
                )}

                {/* Tags input */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Tags <span className="text-gray-400 font-normal">(comma-separated)</span>
                  </label>
                  <input
                    type="text"
                    value={tagsInputs[q._id] ?? ''}
                    onChange={(e) =>
                      setTagsInputs((prev) => ({ ...prev, [q._id]: e.target.value }))
                    }
                    placeholder="e.g. stipend, onboarding, coding"
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <p className="text-xs text-gray-400 mt-0.5 italic">AI tag suggestions coming soon</p>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handleApprove(q)}
                    disabled={approveMutation.isPending || rejectMutation.isPending}
                    aria-label={`Approve question: ${q.title}`}
                    className="flex-1 px-3 py-2 text-xs font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 transition disabled:opacity-60 focus:ring-2 focus:ring-green-400 focus:outline-none"
                  >
                    ✓ Approve & Make Public
                  </button>
                  <button
                    onClick={() => rejectMutation.mutate(q._id)}
                    disabled={approveMutation.isPending || rejectMutation.isPending}
                    aria-label={`Reject question: ${q.title}`}
                    className="px-3 py-2 text-xs font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition disabled:opacity-60 focus:ring-2 focus:ring-red-400 focus:outline-none"
                  >
                    ✗ Reject
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Page {data.page} of {data.totalPages} · {data.total} total
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40"
            >
              ← Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
              disabled={page === data.totalPages}
              className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}