import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import api from '../lib/api';
import { useDebounce } from '../hooks/useDebounce';
import { Button } from '../components/ui/Button';
import { Card, CardBody } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { ErrorBoundary } from '../components/ErrorBoundary';

// ─── Schema ───────────────────────────────────────────────────────────────────

const CATEGORIES = [
  'Application Setup',
  'Test & Coding Assessment',
  'Stipend & Offer Letters',
  'Internship Tasks',
] as const;

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
  category: z.enum(CATEGORIES, {
    errorMap: () => ({ message: 'Please select a category' }),
  }),
  description: z
    .string()
    .min(20, 'Please describe your issue in at least 20 characters'),
});

type FormValues = z.infer<typeof schema>;

// ─── Types ────────────────────────────────────────────────────────────────────

interface SimilarMatch {
  _id: string;
  title: string;
  status: string;
  upvotes: number;
  description?: string;
}

// ─── Duplicate Panel ──────────────────────────────────────────────────────────

interface DuplicatePanelProps {
  matches: SimilarMatch[];
  onDismiss: () => void;
  onResolve: () => void;
}

function DuplicatePanel({ matches, onDismiss, onResolve }: DuplicatePanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <Card className="border-indigo-200 bg-indigo-50">
      <CardBody className="space-y-3">
        <div className="flex items-start gap-2">
          <span className="text-lg flex-shrink-0">⚡</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-indigo-900 mb-1">
              Is this your issue? We found an existing solution:
            </p>
            <div className="space-y-2 mt-3">
              {matches.map((match) => (
                <div
                  key={match._id}
                  className="bg-white rounded-lg border border-indigo-100 p-3 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-gray-900 leading-snug">
                      {match.title}
                    </p>
                    <Badge
                      variant={
                        match.status === 'official_faq' ? 'official' : 'community'
                      }
                      className="flex-shrink-0"
                    >
                      {match.status === 'official_faq' ? 'Official' : 'Community'}
                    </Badge>
                  </div>

                  {expandedId === match._id && match.description && (
                    <p className="text-xs text-gray-600 leading-relaxed border-t border-indigo-100 pt-2">
                      {match.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setExpandedId((prev) =>
                          prev === match._id ? null : match._id
                        )
                      }
                      className="text-xs text-indigo-600 hover:underline"
                    >
                      {expandedId === match._id ? 'Hide' : 'Show'} answer
                    </button>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-xs text-gray-400">{match.upvotes} upvotes</span>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={onResolve}
                      className="text-xs"
                      aria-label="Accept this answer as resolved"
                    >
                      ✓ Yes, this helps!
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={onDismiss}
                      className="text-xs"
                      aria-label="Reject this answer and continue submitting"
                    >
                      ✗ No, continue submitting
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

// ─── Success State ────────────────────────────────────────────────────────────

function SuccessState({ trackingId }: { trackingId: string }) {
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate({ from: '/submit' });

  const copy = () => {
    navigator.clipboard.writeText(trackingId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="text-center py-10 space-y-5">
      <div className="text-5xl">✅</div>
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">
          Ticket Submitted!
        </h2>
        <p className="text-gray-500 text-sm">
          Your support ticket has been received.
        </p>
      </div>

      <Card className="max-w-sm mx-auto border-green-200 bg-green-50">
        <CardBody className="space-y-3">
          <p className="text-xs font-medium text-green-700 uppercase tracking-wide">
            Your Ticket ID
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 font-mono text-sm font-semibold text-gray-900 bg-white px-3 py-2 rounded border border-green-200">
              {trackingId}
            </code>
            <Button
              variant="secondary"
              size="sm"
              onClick={copy}
              className="flex-shrink-0"
            >
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
        </CardBody>
      </Card>

      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate({ to: '/track' })}
        >
          Check status later → Track Ticket
        </Button>
      </div>
    </div>
  );
}

// ─── Resolved State ───────────────────────────────────────────────────────────

function ResolvedState() {
  const navigate = useNavigate({ from: '/submit' });
  return (
    <div className="text-center py-10 space-y-4">
      <div className="text-5xl">🎉</div>
      <h2 className="text-xl font-bold text-gray-900">Glad we could help!</h2>
      <p className="text-gray-500 text-sm">
        The existing answer resolved your query. No ticket needed.
      </p>
      <div className="flex justify-center gap-3">
        <Button variant="secondary" size="sm" onClick={() => navigate({ to: '/browse' })}>
          Browse more FAQs
        </Button>
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/' })}>
          Back to Home
        </Button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SubmitTicket() {
  return (
    <ErrorBoundary>
      <SubmitTicketInner />
    </ErrorBoundary>
  );
}

function SubmitTicketInner() {
  const [duplicateDismissed, setDuplicateDismissed] = useState(false);
  const [resolved, setResolved] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
  });

  const description = watch('description', '');
  const debouncedDescription = useDebounce(description, 400);

  // ── Duplicate Blocker Query ───────────────────────────────────────────────
  // Trigger when debounced description >= 10 chars
  const duplicateQuery =
    debouncedDescription.length >= 10
      ? debouncedDescription.slice(0, 80)
      : null;

  const {
    data: similarMatches,
    isFetching: duplicateFetching,
  } = useQuery({
    queryKey: ['similar-questions', duplicateQuery],
    queryFn: () =>
      api
        .get<{ results: SimilarMatch[] }>(
          `/faqs/search/similar?title=${encodeURIComponent(duplicateQuery!)}`
        )
        .then((r) => r.data.results ?? []),
    enabled: duplicateQuery !== null,
    staleTime: 30_000,
    retry: false,
  });

  const showDuplicatePanel =
    !duplicateDismissed &&
    !resolved &&
    (similarMatches?.length ?? 0) > 0 &&
    !duplicateFetching;

  // ── Submit Mutation ───────────────────────────────────────────────────────
  const submitMutation = useMutation({
    mutationFn: (data: FormValues) =>
      api.post<{ trackingId: string }>('/tickets', data),
    onSuccess: (response) => {
      // axios response: response.data is the parsed JSON body { trackingId, ... }
      const trackingId = response.data?.trackingId ?? '';
      setSubmittedTrackingId(trackingId);
      setIsSubmitted(true);
    },
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedTrackingId, setSubmittedTrackingId] = useState('');

  // Reset submitted state on route change
  useEffect(() => {
    setIsSubmitted(false);
    setSubmittedTrackingId('');
    setDuplicateDismissed(false);
    setResolved(false);
  }, []);

  const onSubmit = (data: FormValues) => {
    if (showDuplicatePanel) return; // blocked
    submitMutation.mutate(data);
  };

  if (resolved) return <ResolvedState />;
  if (isSubmitted) return <SuccessState trackingId={submittedTrackingId} />;

  return (
    <div className="max-w-lg mx-auto space-y-5">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 mb-0.5">
          Submit a Support Ticket
        </h1>
        <p className="text-sm text-gray-500">
          Have a unique issue? Describe it below and our team will get back to
          you.
        </p>
      </div>

      {/* Error Banner */}
      {submitMutation.isError && (
        <Card className="border-red-200 bg-red-50">
          <CardBody>
            <p className="text-sm text-red-700">
              {submitMutation.error?.message ?? 'Submission failed. Please try again.'}
            </p>
          </CardBody>
        </Card>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="space-y-5"
      >
        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Email address <span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            {...register('email')}
            aria-invalid={!!errors.email}
            className={`w-full px-3 py-2 rounded-lg border text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.email ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'
            }`}
            placeholder="your@email.com"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        {/* Category */}
        <fieldset>
          <legend className="block text-sm font-medium text-gray-700 mb-2">
            Category <span className="text-red-500">*</span>
          </legend>
          <div className="space-y-2">
            {CATEGORIES.map((cat) => (
              <label
                key={cat}
                className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors hover:bg-gray-50 has-[:checked]:border-blue-400 has-[:checked]:bg-blue-50 has-[:checked:bg-blue-50]:border-blue-300"
              >
                <input
                  type="radio"
                  value={cat}
                  {...register('category')}
                  className="accent-blue-600"
                />
                <span className="text-sm text-gray-700">{cat}</span>
              </label>
            ))}
          </div>
          {errors.category && (
            <p className="mt-1 text-sm text-red-600">
              {errors.category.message}
            </p>
          )}
        </fieldset>

        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            rows={5}
            {...register('description')}
            aria-invalid={!!errors.description}
            placeholder="Describe your issue in detail (minimum 20 characters)..."
            className={`w-full px-3 py-2 rounded-lg border text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
              errors.description
                ? 'border-red-400 bg-red-50'
                : 'border-gray-300 bg-white'
            }`}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">
              {errors.description.message}
            </p>
          )}
          {description.length > 0 && description.length < 20 && !errors.description && (
            <p className="mt-1 text-xs text-gray-400">
              {description.length}/20 characters
            </p>
          )}
        </div>

        {/* Duplicate Blocker Panel */}
        {duplicateFetching && (
          <Card className="border-indigo-200 bg-indigo-50">
            <CardBody className="flex items-center gap-3">
              <span className="text-indigo-400 animate-spin">⏳</span>
              <p className="text-sm text-indigo-600">
                Checking for similar questions...
              </p>
            </CardBody>
          </Card>
        )}

        {showDuplicatePanel && (
          <DuplicatePanel
            matches={similarMatches!}
            onDismiss={() => setDuplicateDismissed(true)}
            onResolve={() => setResolved(true)}
          />
        )}

        {/* Submit */}
        <div className="flex justify-end pt-1">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={submitMutation.isPending}
            disabled={
              submitMutation.isPending ||
              (showDuplicatePanel && !duplicateDismissed)
            }
          >
            {showDuplicatePanel ? 'Resolve duplicate first' : 'Submit Ticket'}
          </Button>
        </div>
      </form>
    </div>
  );
}