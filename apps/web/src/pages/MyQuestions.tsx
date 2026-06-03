import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { getSessionId } from '../lib/session';
import { Card, CardBody } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { ReputationBadge } from '../components/ReputationBadge';
import { ErrorBoundary } from '../components/ErrorBoundary';

// ─── Types ────────────────────────────────────────────────────────────────────

type QuestionStatus = 'pending' | 'public_community' | 'official_faq' | 'rejected';

interface Question {
  _id: string;
  title: string;
  description: string;
  category: string;
  status: QuestionStatus;
  upvotes: number;
  isOfficialFAQ: boolean;
  createdAt: string;
}

interface MineResponse {
  submitted: Question[];
  upvotedQuestions: Question[];
}

// ─── Point values ─────────────────────────────────────────────────────────────

const POINTS = {
  submitQuestion:   5,
  getUpvote:       10,
  questionPromoted: 50,
} as const;

// ─── Badge tier definition ────────────────────────────────────────────────────

export type BadgeTier = 'beginner' | 'intermediate' | 'advanced' | 'champion';

interface BadgeDef {
  tier: BadgeTier;
  emoji: string;
  label: string;
  check: (stats: UserStats) => boolean;
}

interface UserStats {
  submittedCount: number;
  totalUpvotes: number;
  promotedCount: number;
}

const BADGE_DEFS: BadgeDef[] = [
  { tier: 'beginner',    emoji: '🌱', label: 'First Question',  check: (s) => s.submittedCount >= 1 },
  { tier: 'intermediate',emoji: '⭐', label: 'Rising Star',     check: (s) => s.totalUpvotes >= 3  },
  { tier: 'advanced',    emoji: '🔥', label: 'Top Contributor', check: (s) => s.totalUpvotes >= 5  },
  { tier: 'champion',    emoji: '🏆', label: 'Champion',        check: (s) => s.promotedCount >= 1 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function computeReputation(submitted: Question[], upvotedQuestions: Question[]): number {
  const submitPoints  = submitted.length * POINTS.submitQuestion;
  const upvotePoints  = upvotedQuestions.reduce((sum, q) => sum + q.upvotes, 0) * POINTS.getUpvote;
  const promotedCount = submitted.filter((q) => q.status === 'official_faq').length;
  const promotePoints = promotedCount * POINTS.questionPromoted;
  return submitPoints + upvotePoints + promotePoints;
}

function computeStats(submitted: Question[], upvotedQuestions: Question[]): UserStats {
  const promotedCount = submitted.filter((q) => q.status === 'official_faq').length;
  return {
    submittedCount: submitted.length,
    totalUpvotes:   upvotedQuestions.reduce((sum, q) => sum + q.upvotes, 0),
    promotedCount,
  };
}

function relativeTime(dateStr: string): string {
  const diff  = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hrs   = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hrs  < 24) return `${hrs}h ago`;
  return `${days}d ago`;
}

function statusVariant(status: QuestionStatus): 'pending' | 'official' | 'community' | 'rejected' {
  const map: Record<QuestionStatus, ReturnType<typeof statusVariant>> = {
    pending:          'pending',
    public_community: 'community',
    official_faq:     'official',
    rejected:         'rejected',
  };
  return map[status] ?? 'pending';
}

function statusLabel(status: QuestionStatus): string {
  const map: Record<QuestionStatus, string> = {
    pending:          'Pending',
    public_community: 'Community',
    official_faq:     'Official FAQ',
    rejected:         'Rejected',
  };
  return map[status] ?? status;
}

function categoryIcon(cat: string): string {
  const map: Record<string, string> = {
    'Application Setup':        '⚙️',
    'Test & Coding Assessment': '💻',
    'Stipend & Offer Letters':  '💰',
    'Internship Tasks':         '📋',
  };
  return map[cat] ?? '❓';
}

// ─── Reputation Header ────────────────────────────────────────────────────────

function ReputationHeader({ reputation, stats }: { reputation: number; stats: UserStats }) {
  const earnedBadges = BADGE_DEFS.filter((b) => b.check(stats));

  return (
    <Card className="border-gray-200 dark:border-dark-border bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-dark-surface dark:to-dark-surface mb-6">
      <CardBody className="space-y-4">
        {/* Reputation score */}
        <div className="flex items-center gap-3">
          <span className="text-3xl">🎯</span>
          <div>
            <p className="text-sm text-gray-500 dark:text-dark-muted font-medium">Your Reputation</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-dark-text">
              {reputation.toLocaleString()} <span className="text-base font-normal text-gray-400">points</span>
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-dark-muted">
          <span>📝 <strong className="text-gray-900 dark:text-dark-text">{stats.submittedCount}</strong> submitted</span>
          <span>👍 <strong className="text-gray-900 dark:text-dark-text">{stats.totalUpvotes}</strong> upvotes received</span>
          <span>🏆 <strong className="text-gray-900 dark:text-dark-text">{stats.promotedCount}</strong> promoted</span>
        </div>

        {/* Earned badges */}
        {earnedBadges.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-400 font-medium">Badges earned:</span>
            {BADGE_DEFS.map((b) => (
              <ReputationBadge key={b.tier} badge={b.tier} earned={b.check(stats)} />
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-400 font-medium">All badges:</span>
            {BADGE_DEFS.map((b) => (
              <ReputationBadge key={b.tier} badge={b.tier} earned={false} />
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

// ─── Question Row ─────────────────────────────────────────────────────────────

function QuestionRow({ question }: { question: Question }) {
  return (
    <div className="flex items-start gap-3 py-4 border-b border-gray-100 dark:border-dark-border last:border-0">
      {/* Upvotes */}
      <div className="flex flex-col items-center min-w-[2.5rem]">
        <span className="text-base font-bold text-gray-700 dark:text-dark-text">{question.upvotes}</span>
        <span className="text-xs text-gray-400">votes</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="text-sm font-medium text-gray-900 dark:text-dark-text leading-snug line-clamp-2">
            {question.title}
          </p>
          <Badge variant={statusVariant(question.status)} className="flex-shrink-0">
            {statusLabel(question.status)}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-dark-muted">
          <span title={question.category}>{categoryIcon(question.category)}</span>
          <span>{question.category}</span>
          <span>·</span>
          <span>{relativeTime(question.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

function Section({ title, emoji, questions }: { title: string; emoji: string; questions: Question[] }) {
  if (questions.length === 0) return null;
  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-500 dark:text-dark-muted uppercase tracking-wide mb-2">
        {emoji} {title} <span className="text-gray-400">({questions.length})</span>
      </h2>
      <Card className="divide-y divide-gray-100 dark:divide-dark-border">
        <CardBody className="p-0 px-5">
          {questions.map((q) => <QuestionRow key={q._id} question={q} />)}
        </CardBody>
      </Card>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <Card className="border-gray-200 dark:border-dark-border">
      <CardBody className="text-center py-12 space-y-3">
        <p className="text-4xl">📝</p>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text">No questions yet</h2>
        <p className="text-sm text-gray-500 dark:text-dark-muted max-w-xs mx-auto">
          Submit your first question to start earning reputation points and unlock badges.
        </p>
      </CardBody>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MyQuestions() {
  return (
    <ErrorBoundary>
      <MyQuestionsInner />
    </ErrorBoundary>
  );
}

function MyQuestionsInner() {
  const sessionId = getSessionId();

  const { data, isLoading, isError } = useQuery<MineResponse>({
    queryKey: ['my-questions'],
    queryFn: () => api.get('/faqs/mine', { params: { sessionId } }).then((r) => r.data),
    staleTime: 30_000,
  });

  const submitted        = data?.submitted        ?? [];
  const upvotedQuestions = data?.upvotedQuestions ?? [];
  const reputation       = computeReputation(submitted, upvotedQuestions);
  const stats            = computeStats(submitted, upvotedQuestions);

  const hasSubmitted = submitted.length > 0;
  const hasUpvoted   = upvotedQuestions.length > 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-dark-text mb-0.5">My Questions</h1>
        <p className="text-sm text-gray-500 dark:text-dark-muted">
          Track your contributions and reputation.
        </p>
      </div>

      {/* No session banner */}
      {!sessionId && (
        <div className="rounded-lg border border-yellow-200 dark:border-yellow-900/60 bg-yellow-50 dark:bg-yellow-900/20 px-4 py-3 text-sm text-yellow-800 dark:text-yellow-300">
          No session detected. Please allow localStorage access to track your questions.
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      )}

      {/* Error */}
      {isError && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
          <CardBody>
            <p className="text-sm text-red-700 dark:text-red-300">
              Failed to load your questions. Make sure the server is running.
            </p>
          </CardBody>
        </Card>
      )}

      {/* Content */}
      {!isLoading && !isError && (
        <>
          <ReputationHeader reputation={reputation} stats={stats} />

          {!hasSubmitted && !hasUpvoted ? (
            <EmptyState />
          ) : (
            <div className="space-y-8">
              <Section title="Your Questions"      emoji="📝" questions={submitted} />
              <Section title="Questions You Upvoted" emoji="👍" questions={upvotedQuestions} />
            </div>
          )}
        </>
      )}
    </div>
  );
}