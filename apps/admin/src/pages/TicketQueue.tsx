import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { useState } from 'react';

type TicketStatus = 'pending' | 'under_review' | 'resolved' | 'closed';

interface Ticket {
  _id: string;
  trackingId: string;
  email: string;
  category: string;
  description: string;
  status: TicketStatus;
  adminNote?: string;
  history?: Array<{ status: string; changedAt: string; note?: string }>;
  createdAt: string;
  updatedAt: string;
}

const STATUS_OPTIONS: TicketStatus[] = ['pending', 'under_review', 'resolved', 'closed'];

const STATUS_LABELS: Record<TicketStatus, string> = {
  pending: 'Pending',
  under_review: 'Under Review',
  resolved: 'Resolved',
  closed: 'Closed',
};

const STATUS_BADGE: Record<TicketStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  under_review: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-600',
};

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

const STATUS_TABS: { label: string; value: TicketStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Under Review', value: 'under_review' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'Closed', value: 'closed' },
];

export default function TicketQueue() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all');

  // Inline review state
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reviewStatus, setReviewStatus] = useState<TicketStatus>('under_review');
  const [note, setNote] = useState('');

  const queryParams = new URLSearchParams({ page: String(page) });
  if (statusFilter !== 'all') queryParams.set('status', statusFilter);

  const { data, isLoading, isError } = useQuery<{ tickets: Ticket[]; total: number; page: number; totalPages: number }>({
    queryKey: ['admin-tickets', page, statusFilter],
    queryFn: () =>
      api
        .get<{ tickets: Ticket[]; total: number; page: number; totalPages: number }>(`/admin/tickets?${queryParams}`)
        .then((r) => r.data as { tickets: Ticket[]; total: number; page: number; totalPages: number }),
    staleTime: 30_000,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status, adminNote }: { id: string; status: TicketStatus; adminNote?: string }) =>
      api.patch(`/admin/tickets/${id}`, { status, adminNote }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
      setSelectedId(null);
      setNote('');
    },
  });

  const tickets = data?.tickets ?? [];
  const selected = tickets.find((t) => t._id === selectedId);

  const handleTabChange = (val: TicketStatus | 'all') => {
    setStatusFilter(val);
    setPage(1);
    setSelectedId(null);
  };

  const openReview = (ticket: Ticket) => {
    setSelectedId(ticket._id);
    setReviewStatus(ticket.status === 'pending' ? 'under_review' : ticket.status);
    setNote(ticket.adminNote ?? '');
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Ticket Queue</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage and resolve support tickets</p>
      </div>

      {/* Status filter tabs */}
      <div role="tablist" aria-label="Filter tickets by status" className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            role="tab"
            aria-selected={statusFilter === tab.value}
            onClick={() => handleTabChange(tab.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:ring-2 focus:ring-indigo-500 focus:outline-none ${
              statusFilter === tab.value
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {isError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          Failed to load tickets. Please refresh.
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide">Tracking ID</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide">Category</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide">Submitted</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-gray-100 rounded animate-pulse w-24" />
                        </td>
                      ))}
                    </tr>
                  ))
                : tickets.length === 0
                ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-gray-400 text-sm">
                      No tickets found for this filter.
                    </td>
                  </tr>
                )
                : tickets.map((ticket) => (
                  <tr key={ticket._id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-800">
                      {ticket.trackingId}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{ticket.email}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{ticket.category}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[ticket.status]}`} aria-label={`Status: ${STATUS_LABELS[ticket.status]}`}>
                        {STATUS_LABELS[ticket.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{timeAgo(ticket.createdAt)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openReview(ticket)}
                        aria-label={`Review ticket ${ticket.trackingId}`}
                        className="text-indigo-600 hover:text-indigo-800 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none rounded px-1"
                      >
                        Review →
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Page {data.page} of {data.totalPages} · {data.total} total
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                aria-label="Previous page"
                className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                ← Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
                aria-label="Next page"
                className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Inline Review Panel */}
      {selected && (
        <div className="bg-white rounded-xl border border-indigo-200 p-5 space-y-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">
                Review: {selected.trackingId}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {selected.email} · {selected.category}
              </p>
            </div>
            <button
              onClick={() => setSelectedId(null)}
              aria-label="Close review panel"
              className="text-gray-400 hover:text-gray-600 text-xl leading-none focus:ring-2 focus:ring-indigo-500 focus:outline-none rounded"
            >
              ×
            </button>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-700 leading-relaxed max-h-32 overflow-y-auto">
            {selected.description}
          </div>

          {selected.adminNote && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs font-medium text-blue-700 mb-0.5">Previous admin note</p>
              <p className="text-xs text-blue-800 italic">{selected.adminNote}</p>
            </div>
          )}

          {/* Status dropdown + note */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <label className="text-xs font-medium text-gray-700 whitespace-nowrap">New status:</label>
              <select
                value={reviewStatus}
                onChange={(e) => setReviewStatus(e.target.value as TicketStatus)}
                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Admin note</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                placeholder="Add a note (visible to the user)..."
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() =>
                  updateMutation.mutate({
                    id: selected._id,
                    status: reviewStatus,
                    adminNote: note || undefined,
                  })
                }
                disabled={updateMutation.isPending}
                className="px-5 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-60"
              >
                {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
              </button>
              <button
                onClick={() => setSelectedId(null)}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>

            {updateMutation.isSuccess && (
              <p className="text-xs text-green-600 font-medium">✓ Status updated</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}