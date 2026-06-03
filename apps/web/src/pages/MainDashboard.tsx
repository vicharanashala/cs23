import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import api from '../lib/api';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ErrorBoundary } from '../components/ErrorBoundary';

// ─── Trending Question ────────────────────────────────────────────────────────

function useTrendingQuestion() {
  return useQuery({
    queryKey: ['trending'],
    queryFn: () => api.get('/faqs/trending').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });
}

// ─── 3×3×3 Emergency Quiz ─────────────────────────────────────────────────────

type FocusArea = 'A' | 'B' | 'C';
type Phase = 'A' | 'B' | 'C';
type Urgency = 'A' | 'B' | 'C';

const RECOMMENDATIONS: Record<FocusArea, Record<Phase, Record<Urgency, { priority: 'HIGH' | 'MEDIUM' | 'LOW'; actionScript: string }>>> = {
  A: {
    A: { A: { priority: 'HIGH', actionScript: 'Your selection-related issue needs immediate attention. Raise an urgent ticket via the "Submit Ticket" form with subject "URGENT: Selection Process Issue — Applied Stage". Include your registration email, application ID, and a brief description of the problem. Expect a response within 2 working hours.' }, B: { priority: 'MEDIUM', actionScript: 'Your selection process concern has been noted. Please raise a ticket via the "Submit Ticket" form with details of the issue and any reference IDs you have. Our team reviews these within 1 working day.' }, C: { priority: 'LOW', actionScript: 'For older selection process concerns, please raise a support ticket with all relevant details and reference IDs. Visit the "Track Ticket" page to check existing ticket resolution times.' } },
    B: { A: { priority: 'HIGH', actionScript: 'An in-progress selection issue requires immediate escalation. Raise an urgent ticket via the "Submit Ticket" form with subject "URGENT: Selection Process — In Progress". Attach any screenshots, email confirmations, or communication you have received. Response expected within 2 working hours.' }, B: { priority: 'MEDIUM', actionScript: 'Please raise a support ticket describing your in-progress selection issue in detail. Include any assessment links, deadline dates, and communication received. Our technical team will review within 1 working day.' }, C: { priority: 'LOW', actionScript: 'Long-standing selection concerns should be documented in a support ticket with all reference materials. Check existing tickets at the Track page for resolution status.' } },
    C: { A: { priority: 'MEDIUM', actionScript: 'Completed selection concerns still need follow-up. Raise a support ticket with your final offer or confirmation details and describe the specific issue. Our team will review and respond within 2 working hours.' }, B: { priority: 'LOW', actionScript: 'Please submit a ticket with details of your completed selection process concern. Include any offer letters, confirmation emails, or reference IDs. Our team will get back to you within 2 working days.' }, C: { priority: 'LOW', actionScript: 'For completed selection matters that need revisiting, raise a formal support ticket with all relevant documentation. Visit the Track page for guidance on escalation paths.' } },
  },
  B: {
    A: { A: { priority: 'HIGH', actionScript: 'Onboarding document issues require immediate resolution. Raise an urgent ticket via the "Submit Ticket" form with subject "URGENT: Onboarding Document Issue" and describe the problem clearly. Expect confirmation within 2 working hours.' }, B: { priority: 'MEDIUM', actionScript: 'Please raise a support ticket describing your onboarding document submission. Include document types, submission dates, and any confirmation received. Team reviews within 1 working day.' }, C: { priority: 'LOW', actionScript: 'Document-related onboarding concerns should be documented in a ticket. Ensure you attach any reference numbers or email confirmations you have received.' } },
    B: { A: { priority: 'HIGH', actionScript: 'Active onboarding document issues need immediate escalation. Raise an urgent ticket via the "Submit Ticket" form with subject "URGENT: Onboarding In Progress — Document Issue". List all pending documents and your expected start date. Response within 2 working hours.' }, B: { priority: 'MEDIUM', actionScript: 'Submit a ticket with details of which onboarding documents are pending or rejected. Our documentation team will provide guidance on the correct format and re-submission process within 1 working day.' }, C: { priority: 'LOW', actionScript: 'Long-standing onboarding document issues should be formalised as a support ticket with all document reference IDs and submission history.' } },
    C: { A: { priority: 'MEDIUM', actionScript: 'Completed onboarding concerns can still be addressed. Raise a support ticket with your onboarding confirmation number and a description of the concern. Our team will review within 2 working hours.' }, B: { priority: 'LOW', actionScript: 'Please raise a ticket if your onboarding completion has an outstanding concern. Include your confirmation number and a summary of the issue.' }, C: { priority: 'LOW', actionScript: 'Resolved onboarding matters can be revisited via a formal support ticket. Please include all reference IDs and documentation for review.' } },
  },
  C: {
    A: { A: { priority: 'HIGH', actionScript: 'Task assignment issues need immediate attention if they are blocking your start. Raise an urgent ticket via the "Submit Ticket" form with subject "URGENT: Task Assignment Issue — Not Started". Include your start date and any communication about assigned tasks. Response within 2 working hours.' }, B: { priority: 'MEDIUM', actionScript: 'Raise a support ticket describing your assigned tasks and any blockers you are facing. Include task IDs or names if available. Our coordination team will respond within 1 working day.' }, C: { priority: 'LOW', actionScript: 'Task assignment concerns that have been ongoing should be formalised as a support ticket with details of all assigned and completed tasks.' } },
    B: { A: { priority: 'HIGH', actionScript: 'Active task issues with imminent deadlines require immediate escalation. Raise an urgent ticket via the "Submit Ticket" form with subject "URGENT: Task Deadline Issue — In Progress". State the specific task, deadline, and nature of the problem. Expect a response within 2 working hours.' }, B: { priority: 'MEDIUM', actionScript: 'Submit a ticket with details of the task you are working on, the specific blocker, and any deadline. Our task support team will advise on next steps within 1 working day.' }, C: { priority: 'LOW', actionScript: 'Long-running task issues should be documented as a support ticket with task references and a summary of attempts made to resolve the issue.' } },
    C: { A: { priority: 'MEDIUM', actionScript: 'Post-completion task concerns can be escalated by raising a support ticket with your task completion proof and a description of the concern. Our team will respond within 2 working hours.' }, B: { priority: 'LOW', actionScript: 'Please raise a ticket if a completed task has a pending payment, certificate, or feedback concern. Include task ID, completion date, and any correspondence.' }, C: { priority: 'LOW', actionScript: 'Historical task completion concerns can be addressed via a formal support ticket. Please provide all task IDs, completion dates, and supporting documentation.' } },
  },
};

const PHASE_OPTIONS: [Phase, string, string][] = [
  ['A', 'Applied', 'I have applied but not started yet'],
  ['B', 'In Progress', 'I am actively working through this'],
  ['C', 'Completed', 'I have finished this stage'],
];

const FOCUS_OPTIONS: [FocusArea, string, string][] = [
  ['A', 'The Selection Process', 'Applications, interviews, offers, rejections'],
  ['B', 'Onboarding & Documents', 'Offer letters, agreements, profile verification'],
  ['C', 'Internship Tasks', 'Assigned work, deadlines, submissions'],
];

const URGENCY_OPTIONS: [Urgency, string, string][] = [
  ['A', 'Just happened now', 'Right now, urgent'],
  ['B', '1–3 working days', 'Recently, needs attention soon'],
  ['C', '4+ working days', 'Ongoing issue'],
];

function QuizButton({ focus, phase, urgency, onSelect, back }: {
  focus?: FocusArea; phase?: Phase; urgency?: Urgency;
  onSelect: (v: FocusArea | Phase | Urgency) => void;
  back?: () => void;
}) {
  const options = focus === undefined ? FOCUS_OPTIONS
    : phase === undefined ? PHASE_OPTIONS
    : URGENCY_OPTIONS;

  const setFn = focus === undefined ? (v: FocusArea) => onSelect(v)
    : phase === undefined ? (v: Phase) => onSelect(v)
    : (v: Urgency) => onSelect(v);

  const labels = focus === undefined ? { step: 'What area are you facing a problem with?', backFn: undefined }
    : phase === undefined ? { step: 'Which specific phase are you currently in?', backFn: back }
    : { step: 'How long have you been facing this issue?', backFn: back };

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-gray-800 dark:text-dark-text">{labels.step}</p>
      {options.map(([val, label, desc]) => (
        <button
          key={val}
          onClick={() => setFn(val)}
          className="w-full text-left p-4 rounded-xl border border-gray-200 dark:border-dark-border hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
        >
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold text-sm flex items-center justify-center">{val}</span>
            <div>
              <p className="font-medium text-gray-900 dark:text-dark-text text-sm">{label}</p>
              <p className="text-xs text-gray-500 dark:text-dark-muted">{desc}</p>
            </div>
          </div>
        </button>
      ))}
      {labels.backFn && (
        <button onClick={labels.backFn} className="text-sm text-gray-500 dark:text-dark-muted hover:text-gray-700 dark:hover:text-dark-text underline">
          ← Back
        </button>
      )}
    </div>
  );
}

function Quiz() {
  const [focus, setFocus] = useState<FocusArea | null>(null);
  const [phase, setPhase] = useState<Phase | null>(null);
  const [urgency, setUrgency] = useState<Urgency | null>(null);

  const reset = () => { setFocus(null); setPhase(null); setUrgency(null); };

  const recommendation = focus && phase && urgency ? RECOMMENDATIONS[focus][phase][urgency] : null;
  const step = focus === null ? 1 : phase === null ? 2 : urgency === null ? 3 : 4;

  return (
    <div className="space-y-4">
      {step < 4 && (
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-dark-muted mb-2">
          <span className="font-medium text-blue-600 dark:text-blue-400">Step {step} of 3</span>
          <span className="flex gap-1">
            {[1, 2, 3].map(s => (
              <span key={s} className={`w-2 h-2 rounded-full ${s <= step ? 'bg-blue-500 dark:bg-blue-400' : 'bg-gray-300 dark:bg-dark-border'}`} />
            ))}
          </span>
        </div>
      )}

      {step === 1 && <QuizButton onSelect={(v) => setFocus(v as FocusArea)} />}
      {step === 2 && <QuizButton focus={focus!} onSelect={(v) => setPhase(v as Phase)} back={() => setFocus(null)} />}
      {step === 3 && <QuizButton focus={focus!} phase={phase!} onSelect={(v) => setUrgency(v as Urgency)} back={() => setPhase(null)} />}

      {step === 4 && recommendation && (
        <div className="space-y-4">
          <div className={`rounded-xl p-4 border ${
            recommendation.priority === 'HIGH' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            : recommendation.priority === 'MEDIUM' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
            : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
          }`}>
            <Badge variant={recommendation.priority === 'HIGH' ? 'rejected' : recommendation.priority === 'MEDIUM' ? 'review' : 'resolved'}>
              {recommendation.priority} PRIORITY
            </Badge>
            <p className="text-sm text-gray-700 dark:text-dark-muted mt-2 leading-relaxed">{recommendation.actionScript}</p>
          </div>
          <Button variant="secondary" size="sm" onClick={reset}>Reset Quiz</Button>
        </div>
      )}
    </div>
  );
}

// ─── Trending Widget ──────────────────────────────────────────────────────────

function TrendingWidget() {
  const { data, isLoading } = useTrendingQuestion();
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-6">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-dark-text mb-3">🔥 Trending Today</h3>
      {isLoading ? (
        <div className="animate-pulse space-y-2">
          <div className="h-12 bg-gray-200 dark:bg-dark-border rounded-lg" />
        </div>
      ) : data ? (
        <div
          role="button" tabIndex={0}
          onClick={() => setExpanded(v => !v)}
          onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setExpanded(v => !v)}
          aria-expanded={expanded}
          className="cursor-pointer rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface hover:border-blue-200 dark:hover:border-blue-700 hover:shadow-md transition-all focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
          <div className="p-4">
            <p className="text-sm font-medium text-gray-900 dark:text-dark-text">{data.title || (data as unknown as { question?: { title: string } })?.question?.title}</p>
            {expanded && (
              <p className="mt-2 text-sm text-gray-600 dark:text-dark-muted">{data.description || (data as unknown as { question?: { description: string } })?.question?.description}</p>
            )}
            <p className="mt-1 text-xs text-gray-400 dark:text-dark-muted">Click to {expanded ? 'collapse' : 'expand'}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ─── Nav Card ─────────────────────────────────────────────────────────────────

function NavCard({ icon, title, description, to, isActive }: { icon: string; title: string; description: string; to: string; isActive?: boolean }) {
  const navigate = useNavigate({ from: '/' });
  return (
    <div
      role="button" tabIndex={0}
      onClick={() => navigate({ to })}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && navigate({ to })}
      aria-label={`${title} — ${description}`}
      className={`cursor-pointer rounded-xl border transition-all focus:ring-2 focus:ring-blue-500 focus:outline-none ${isActive ? 'ring-2 ring-blue-500 border-blue-400 dark:border-blue-600' : 'border-transparent hover:border-blue-200 dark:hover:border-dark-border hover:shadow-md'}`}
    >
      <Card className="h-full border-0 shadow-none dark:bg-dark-surface">
        <CardBody className="flex flex-col items-center text-center gap-3 py-8">
          <span className="text-3xl" aria-hidden="true">{icon}</span>
          <div>
            <p className="font-semibold text-gray-900 dark:text-dark-text text-sm">{title}</p>
            <p className="text-xs text-gray-500 dark:text-dark-muted mt-1">{description}</p>
          </div>
          {isActive && <Badge variant="official">Current</Badge>}
        </CardBody>
      </Card>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function MainDashboard() {
  const [quizOpen, setQuizOpen] = useState(false);

  return (
    <ErrorBoundary>
      <div className="space-y-8">
        {/* Welcome */}
        <div className="text-center py-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text mb-2">
            Welcome to the Samagama Internship Support Center
          </h1>
          <p className="text-gray-500 dark:text-dark-muted text-sm max-w-lg mx-auto">
            Find answers instantly, submit support tickets, or track existing requests.
          </p>
        </div>

        {!quizOpen && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <NavCard icon="🔍" title="Browse & Search FAQs" description="Search official and community questions" to="/browse" />
              <NavCard icon="📝" title="Submit a New Question" description="Have a unique issue? Open a support ticket" to="/submit" />
              <NavCard icon="📦" title="Track Ticket Status" description="Check the progress of your existing tickets" to="/track" />
            </div>
            <TrendingWidget />
          </>
        )}

        {/* Emergency Quiz */}
        <Card>
          <button
            className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-dark-border transition-colors rounded-xl"
            onClick={() => setQuizOpen(v => !v)}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">🚨</span>
              <span className="font-semibold text-gray-900 dark:text-dark-text text-sm">
                Need Urgent Help? Take our 3-Step Emergency Diagnostic Quiz
              </span>
            </div>
            <span className={`text-gray-400 dark:text-dark-muted transition-transform ${quizOpen ? 'rotate-180' : ''}`}>▼</span>
          </button>
          {quizOpen && (
            <div className="px-5 pb-5 border-t border-gray-100 dark:border-dark-border pt-4">
              <Quiz />
            </div>
          )}
        </Card>
      </div>
    </ErrorBoundary>
  );
}