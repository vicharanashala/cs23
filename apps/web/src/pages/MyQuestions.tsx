import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { Card, CardBody } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { ErrorBoundary } from '../components/ErrorBoundary';

// ─── Types ────────────────────────────────────────────────────────────────────

type QuestionStatus = 'official_faq' | 'public_community' | 'pending' | 'rejected';

interface Question {
  _id: string;
  title: string;
  description: string;
  category: string;
  status: QuestionStatus;
  upvotes: number;
  createdAt: string;
}

interface MineResponse {
  submitted: Question[];
  upvotedQuestions: Question[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getSessionId(): string | null {
  return localStorage.getItem('faq_session_id');
}

function statusVariant(status: QuestionStatus): 'official' | 'community' | 'pending' | 'rejected' {
  switch (status) {
    case 'official_faq':    return 'official';
    case 'public_community': return 'community';
    case 'pending':         return 'pending';
    case 'rejected':        return 'rejected';
    default:                return 'pending';
  }
}

function statusLabel(status: QuestionStatus): string {
  switch (status) {
    case 'official_faq':     return 'Official FAQ';
    case 'public_community': return 'Community';
    case 'pending':          return 'Pending';
    case 'rejected':         return 'Rejected';
    default:                 return status;
  }
}

function categoryIcon(category: string): string {
  switch (category) {
    case 'Application Setup':        return '⚙️';
    case 'Test & Coding Assessment': return '💻';
    case 'Stipend & Offer Letters':  return '💰';
    case 'Internship Tasks':         return '📋';
    default:                         return '❓';
  }
}

// ─── Question Card ────────────────────────────────────────────────────────────

function QuestionCard({ question }: { question: Question }) {
  return (
    <Card className="dark:bg-dark-surface dark:border-dark-border hover:shadow-md transition-shadow">
      <CardBody className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold text-gray-900 dark:text-dark-text leading-snug line-clamp-2">
            {question.title}
          </h3>
          <span className="text-xl flex-shrink-0" title={question.category}>
            {categoryIcon(question.category)}
          </span>
        </div>

        <p className="text-sm text-gray-600 dark:text-dark-text/70 line-clamp-2">
          {question.description}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="community" className="text-xs">
            {question.category}
          </Badge>
          <Badge variant={statusVariant(question.status)} className="text-xs">
            {statusLabel(question.status)}
          </Badge>
          <span className="ml-auto flex items-center gap-1 text-sm text-gray-500 dark:text-dark-text/60">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M5 15l7-7 7 7" />
            </svg>
            {question.upvotes}
          </span>
        </div>
      </CardBody>
    </Card>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ message, icon }: { message: string; icon: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="text-5xl mb-4">{icon}</span>
      <p className="text-gray-500 dark:text-dark-text/60 text-base max-w-xs">{message}</p>
    </div>
  );
}

// ─── Content fetch hook ───────────────────────────────────────────────────────

function useMyQuestions() {
  return useQuery<MineResponse>({
    queryKey: ['my-questions'],
    queryFn: async () => {
      const sessionId = getSessionId();
      if (!sessionId) throw new Error('No session — please refresh the page');
      const { data } = await api.get('/faqs/mine', {
        headers: { 'X-Session-ID': sessionId },
      });
      return data;
    },
    enabled: !!getSessionId(),
  });
}

// ─── Tab: My Submissions ──────────────────────────────────────────────────────

function SubmissionsTab() {
  const { data, isLoading, isError, error } = useMyQuestions();

  if (isLoading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  if (isError)   return <p className="text-red-600 dark:text-red-400 text-center py-8">{(error as Error).message}</p>;

  const questions = data?.submitted ?? [];

  if (questions.length === 0) {
    return (
      <EmptyState
        icon="📝"
        message="You haven't submitted any questions yet. Head to the Submit page to ask your first question."
      />
    );
  }

  return (
    <div className="space-y-4">
      {questions.map((q) => <QuestionCard key={q._id} question={q} />)}
    </div>
  );
}

// ─── Tab: Questions I Upvoted ─────────────────────────────────────────────────

function UpvotedTab() {
  const { data, isLoading, isError, error } = useMyQuestions();

  if (isLoading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  if (isError)   return <p className="text-red-600 dark:text-red-400 text-center py-8">{(error as Error).message}</p>;

  const questions = data?.upvotedQuestions ?? [];

  if (questions.length === 0) {
    return (
      <EmptyState
        icon="⬆️"
        message="You haven't upvoted any questions yet. Browse community questions and upvote ones you find helpful."
      />
    );
  }

  return (
    <div className="space-y-4">
      {questions.map((q) => <QuestionCard key={q._id} question={q} />)}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = 'submitted' | 'upvoted';

export default function MyQuestions() {
  const [activeTab, setActiveTab] = useState<Tab>('submitted');
  const sessionId = getSessionId();

  return (
    <ErrorBoundary>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">
            My Questions
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-dark-text/70">
            Track your submissions and the community questions you've upvoted.
          </p>
        </div>

        {/* No session banner */}
        {!sessionId && (
          <div className="rounded-lg border border-yellow-200 dark:border-yellow-900/60 bg-yellow-50 dark:bg-yellow-900/20 px-4 py-3 text-sm text-yellow-800 dark:text-yellow-300">
            No session detected. Please allow localStorage access to track your questions.
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-dark-border">
          <nav className="flex gap-1" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('submitted')}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'submitted'
                  ? 'border-purple-600 text-purple-700 dark:border-purple-400 dark:text-purple-300'
                  : 'border-transparent text-gray-500 dark:text-dark-text/60 hover:text-gray-700 dark:hover:text-dark-text hover:border-gray-300 dark:hover:border-dark-border'
              }`}
            >
              My Submissions
            </button>
            <button
              onClick={() => setActiveTab('upvoted')}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'upvoted'
                  ? 'border-purple-600 text-purple-700 dark:border-purple-400 dark:text-purple-300'
                  : 'border-transparent text-gray-500 dark:text-dark-text/60 hover:text-gray-700 dark:hover:text-dark-text hover:border-gray-300 dark:hover:border-dark-border'
              }`}
            >
              Questions I Upvoted
            </button>
          </nav>
        </div>

        {/* Tab content */}
        <div>
          {activeTab === 'submitted' ? <SubmissionsTab /> : <UpvotedTab />}
        </div>
      </div>
    </ErrorBoundary>
  );
}