import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import api from '../lib/api';
import { Button } from '../components/ui/Button';
import { Card, CardBody } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { ErrorBoundary } from '../components/ErrorBoundary';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Ticket {
  trackingId: string;
  email: string;
  category: string;
  description: string;
  status: 'pending' | 'under_review' | 'resolved' | 'closed';
  adminNote?: string;
  history?: Array<{ status: string; changedAt: string; note?: string }>;
  createdAt: string;
  updatedAt: string;
}

// ─── Relative Time ────────────────────────────────────────────────────────────

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;

  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Ticket['status'] }) {
  const map: Record<Ticket['status'], { variant: 'pending' | 'review' | 'resolved'; label: string }> = {
    pending:     { variant: 'pending',  label: 'Pending' },
    under_review:{ variant: 'review',   label: 'In Review' },
    resolved:    { variant: 'resolved', label: 'Resolved' },
    closed:      { variant: 'pending',  label: 'Closed' },
  };
  const { variant, label } = map[status] ?? { variant: 'pending', label: status };
  return <Badge variant={variant} aria-label={`Ticket status: ${label}`}>{label}</Badge>;
}

// ─── Timeline Item ────────────────────────────────────────────────────────────

function TimelineItem({ ticket }: { ticket: Ticket }) {
  const submittedAt = relativeTime(ticket.createdAt);
  const updated = ticket.updatedAt !== ticket.createdAt
    ? relativeTime(ticket.updatedAt)
    : null;

  return (
    <div className="flex items-start gap-3">
      <div className="flex flex-col items-center gap-1 mt-0.5">
        <div className="h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-green-100" />
        {updated && <div className="w-0.5 flex-1 bg-gray-200 min-h-[2rem]" />}
      </div>
      <div className="space-y-1 pb-3">
        <p className="text-xs text-gray-500">Submitted {submittedAt}</p>
        {updated && (
          <p className="text-xs text-gray-400">Last updated {updated}</p>
        )}
        {ticket.adminNote && (
          <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs font-medium text-gray-500 mb-0.5">Admin note</p>
            <p className="text-sm text-gray-700 italic">{ticket.adminNote}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Result Card ──────────────────────────────────────────────────────────────

function ResultCard({ ticket }: { ticket: Ticket }) {
  const navigate = useNavigate({ from: '/track' });
  const subject = ticket.description.length > 60
    ? ticket.description.slice(0, 60) + '…'
    : ticket.description;

  return (
    <Card className="max-w-md mx-auto border-gray-200">
      <CardBody className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
              Ticket ID
            </p>
            <code className="font-mono text-sm font-bold text-gray-900">
              {ticket.trackingId}
            </code>
          </div>
          <StatusBadge status={ticket.status} />
        </div>

        {/* Subject */}
        <div>
          <p className="text-xs font-medium text-gray-400 mb-0.5">Subject</p>
          <p className="text-sm text-gray-800 leading-snug">{subject}</p>
        </div>

        {/* Category */}
        <div>
          <p className="text-xs font-medium text-gray-400 mb-0.5">Category</p>
          <p className="text-sm text-gray-700">{ticket.category}</p>
        </div>

        {/* Timeline */}
        <TimelineItem ticket={ticket} />

        {/* Nav */}
        <div className="pt-2 border-t border-gray-100">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: '/submit' })}
          >
            Submit another question →
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TicketTracking() {
  return (
    <ErrorBoundary>
      <TicketTrackingInner />
    </ErrorBoundary>
  );
}

function TicketTrackingInner() {
  const [inputValue, setInputValue] = useState('');
  const [activeId, setActiveId] = useState('');

  // Read pre-fill from URL query param on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) {
      setInputValue(id);
      setActiveId(id.trim().toUpperCase());
    }
  }, []);

  const queryClient = useQueryClient();

  const {
    data: ticket,
    isLoading,
    isError,
    isFetching,
  } = useQuery({
    queryKey: ['ticket', activeId],
    queryFn: () =>
      api.get<Ticket>(`/tickets/${activeId}`).then((r) => r.data),
    enabled: activeId.length > 0,
    staleTime: 30_000,
    retry: false,
  });

  const handleFetch = () => {
    const trimmed = inputValue.trim().toUpperCase();
    if (!trimmed) return;
    queryClient.removeQueries({ queryKey: ['ticket', activeId] });
    setActiveId(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleFetch();
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 mb-0.5">
          Track Your Ticket
        </h1>
        <p className="text-sm text-gray-500">
          Enter your tracking ID to see the current status.
        </p>
      </div>

      {/* Input Section */}
      <Card className="border-gray-200">
        <CardBody className="space-y-3">
          <label
            htmlFor="tracking-id"
            className="block text-sm font-medium text-gray-700"
          >
            Ticket Tracking ID
          </label>
          <div className="flex gap-2">
            <input
              id="tracking-id"
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value.toUpperCase())}
              onKeyDown={handleKeyDown}
              placeholder="TKT-2026-XXXXXXXX"
              spellCheck={false}
              className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm font-mono text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Ticket Tracking ID"
            />
            <Button
              variant="primary"
              onClick={handleFetch}
              disabled={!inputValue.trim() || isFetching}
              className="flex-shrink-0"
            >
              {isFetching ? 'Fetching…' : 'Fetch Status'}
            </Button>
          </div>
          <p className="text-xs text-gray-400">
            Format: <code className="font-mono">TKT-2026-XXXXXXXX</code>
          </p>
        </CardBody>
      </Card>

      {/* Loading */}
      {isFetching && (
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      )}

      {/* Error */}
      {isError && !isLoading && (
        <Card className="border-red-200 bg-red-50">
          <CardBody className="text-center py-6">
            <p className="text-2xl mb-2">🔍</p>
            <p className="text-sm text-red-700 font-medium">
              Ticket not found.
            </p>
            <p className="text-xs text-red-500 mt-1">
              Please double-check your tracking ID and try again.
            </p>
          </CardBody>
        </Card>
      )}

      {/* Result */}
      {ticket && !isFetching && (
        <ResultCard ticket={ticket} />
      )}
    </div>
  );
}