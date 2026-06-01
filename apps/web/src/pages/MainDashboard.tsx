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

// ─── Recommendation Lookup (3×3×3 = 27 combinations) ─────────────────────────
// Keys: focusArea (A/B/C) × phase (A/B/C) × urgency (A/B/C)

type FocusArea = 'A' | 'B' | 'C';
type Phase = 'A' | 'B' | 'C';
type Urgency = 'A' | 'B' | 'C';

const RECOMMENDATIONS: Record<FocusArea, Record<Phase, Record<Urgency, { priority: 'HIGH' | 'MEDIUM' | 'LOW'; actionScript: string }>>> = {
  A: {
    // Selection Process
    A: {
      // Applied
      A: { priority: 'HIGH', actionScript: 'Your selection-related issue needs immediate attention. Email internships@samagama.in with subject "URGENT: Selection Process Issue — Applied Stage". Include your registration email, application ID, and a brief description of the problem. Expect a response within 2 working hours.' },
      B: { priority: 'MEDIUM', actionScript: 'Your selection process concern has been noted. Please raise a ticket via the "Submit a New Question" form with details of the issue and any reference IDs you have. Our team reviews these within 1 working day.' },
      C: { priority: 'LOW', actionScript: 'For older selection process concerns, please raise a support ticket with all relevant details and reference IDs. Visit the "Track Ticket Status" page to check existing ticket resolution times.' },
    },
    B: {
      // In Progress
      A: { priority: 'HIGH', actionScript: 'An in-progress selection issue requires immediate escalation. Email internships@samagama.in with subject "URGENT: Selection Process — In Progress". Attach any screenshots, email confirmations, or communication you have received. Response expected within 2 working hours.' },
      B: { priority: 'MEDIUM', actionScript: 'Please raise a support ticket describing your in-progress selection issue in detail. Include any assessment links, deadline dates, and communication received. Our technical team will review within 1 working day.' },
      C: { priority: 'LOW', actionScript: 'Long-standing selection concerns should be documented in a support ticket with all reference materials. Check existing tickets at the Track page for resolution status.' },
    },
    C: {
      // Completed
      A: { priority: 'MEDIUM', actionScript: 'Completed selection concerns still need follow-up. Email internships@samagama.in with your final offer or confirmation details and describe the specific issue. We will review and respond within 2 working hours.' },
      B: { priority: 'LOW', actionScript: 'Please submit a ticket with details of your completed selection process concern. Include any offer letters, confirmation emails, or reference IDs. Our team will get back to you within 2 working days.' },
      C: { priority: 'LOW', actionScript: 'For completed selection matters that need revisiting, raise a formal support ticket with all relevant documentation. Visit the Track page for guidance on escalation paths.' },
    },
  },
  B: {
    // Onboarding & Documents
    A: {
      // Applied
      A: { priority: 'HIGH', actionScript: 'Onboarding document issues require immediate resolution. Email internships@samagama.in with subject "URGENT: Onboarding Document Issue" and attach copies of the documents you have submitted. Expect confirmation within 2 working hours.' },
      B: { priority: 'MEDIUM', actionScript: 'Please raise a support ticket describing your onboarding document submission. Include document types, submission dates, and any confirmation received. Team reviews within 1 working day.' },
      C: { priority: 'LOW', actionScript: 'Document-related onboarding concerns should be documented in a ticket. Ensure you attach any reference numbers or email confirmations you have received.' },
    },
    B: {
      // In Progress
      A: { priority: 'HIGH', actionScript: 'Active onboarding document issues need immediate escalation. Email internships@samagama.in with subject "URGENT: Onboarding In Progress — Document Issue". List all pending documents and your expected start date. Response within 2 working hours.' },
      B: { priority: 'MEDIUM', actionScript: 'Submit a ticket with details of which onboarding documents are pending or rejected. Our documentation team will provide guidance on the correct format and re-submission process within 1 working day.' },
      C: { priority: 'LOW', actionScript: 'Long-standing onboarding document issues should be formalised as a support ticket with all document reference IDs and submission history.' },
    },
    C: {
      // Completed
      A: { priority: 'MEDIUM', actionScript: 'Completed onboarding concerns can still be addressed. Email internships@samagama.in with your onboarding confirmation number and a description of the concern. We will review within 2 working hours.' },
      B: { priority: 'LOW', actionScript: 'Please raise a ticket if your onboarding completion has an outstanding concern. Include your confirmation number and a summary of the issue.' },
      C: { priority: 'LOW', actionScript: 'Resolved onboarding matters can be revisited via a formal support ticket. Please include all reference IDs and documentation for review.' },
    },
  },
  C: {
    // Internship Tasks
    A: {
      // Applied
      A: { priority: 'HIGH', actionScript: 'Task assignment issues need immediate attention if they are blocking your start. Email internships@samagama.in with subject "URGENT: Task Assignment Issue — Not Started". Include your internship start date and any communication about assigned tasks. Response within 2 working hours.' },
      B: { priority: 'MEDIUM', actionScript: 'Raise a support ticket describing your assigned tasks and any blockers you are facing. Include task IDs or names if available. Our internship coordination team will respond within 1 working day.' },
      C: { priority: 'LOW', actionScript: 'Task assignment concerns that have been ongoing should be formalised as a support ticket with details of all assigned and completed tasks.' },
    },
    B: {
      // In Progress
      A: { priority: 'HIGH', actionScript: 'Active task issues with imminent deadlines require immediate escalation. Email internships@samagama.in with subject "URGENT: Task Deadline Issue — In Progress". State the specific task, deadline, and nature of the problem. Expect a response within 2 working hours.' },
      B: { priority: 'MEDIUM', actionScript: 'Submit a ticket with details of the task you are working on, the specific blocker, and any deadline. Our task support team will advise on next steps within 1 working day.' },
      C: { priority: 'LOW', actionScript: 'Long-running task issues should be documented as a support ticket with task references and a summary of attempts made to resolve the issue.' },
    },
    C: {
      // Completed
      A: { priority: 'MEDIUM', actionScript: 'Post-completion task concerns can be escalated by emailing internships@samagama.in with your task completion proof and a description of the concern. Response expected within 2 working hours.' },
      B: { priority: 'LOW', actionScript: 'Please raise a ticket if a completed task has a pending payment, certificate, or feedback concern. Include task ID, completion date, and any correspondence.' },
      C: { priority: 'LOW', actionScript: 'Historical task completion concerns can be addressed via a formal support ticket. Please provide all task IDs, completion dates, and supporting documentation.' },
    },
  },
};

// ─── Quiz ─────────────────────────────────────────────────────────────────────

type QuizFocus = FocusArea | null;
type QuizPhase = Phase | null;

const FOCUS_OPTIONS = [
  { value: 'A' as FocusArea, label: 'The Selection Process', description: 'Applications, interviews, offers, rejections' },
  { value: 'B' as FocusArea, label: 'Onboarding & Documents', description: 'Offer letters, agreements, profile verification' },
  { value: 'C' as FocusArea, label: 'Internship Tasks', description: 'Assigned work, deadlines, submissions' },
];

const URGENCY_OPTIONS = [
  { value: 'A' as Urgency, label: 'Just happened now', description: 'Right now, urgent' },
  { value: 'B' as Urgency, label: '1–3 working days', description: 'Recently, needs attention soon' },
  { value: 'C' as Urgency, label: '4+ working days', description: 'Ongoing issue' },
];

function Quiz() {
  const [focus, setFocus] = useState<QuizFocus>(null);
  const [phase, setPhase] = useState<QuizPhase>(null);
  const [urgency, setUrgency] = useState<Urgency | null>(null);

  const currentStep = focus === null ? 1 : phase === null ? 2 : urgency === null ? 3 : 4;

  const reset = () => {
    setFocus(null);
    setPhase(null);
    setUrgency(null);
  };

  const recommendation = focus && phase && urgency ? RECOMMENDATIONS[focus][phase][urgency] : null;

  return (
    <div className="space-y-4">
      {currentStep < 4 && (
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <span className="font-medium text-blue-600">Step {currentStep} of 3</span>
          <span className="flex gap-1">
            {[1, 2, 3].map((s) => (
              <span
                key={s}
                className={`w-2 h-2 rounded-full ${s <= currentStep ? 'bg-blue-500' : 'bg-gray-300'}`}
              />
            ))}
          </span>
        </div>
      )}

      {currentStep === 1 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-800">What area are you facing a problem with?</p>
          {FOCUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFocus(opt.value)}
              className="w-full text-left p-4 rounded-xl border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm flex items-center justify-center group-hover:bg-blue-200">
                  {opt.value}
                </span>
                <div>
                  <p className="font-medium text-gray-900 text-sm">{opt.label}</p>
                  <p className="text-xs text-gray-500">{opt.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {currentStep === 2 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-800">Which specific phase are you currently in?</p>
          <button
            onClick={() => setPhase('A')}
            className="w-full text-left p-4 rounded-xl border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all group"
          >
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm flex items-center justify-center">A</span>
              <div>
                <p className="font-medium text-gray-900 text-sm">Applied</p>
                <p className="text-xs text-gray-500">I have applied but not started yet</p>
              </div>
            </div>
          </button>
          <button
            onClick={() => setPhase('B')}
            className="w-full text-left p-4 rounded-xl border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all group"
          >
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm flex items-center justify-center">B</span>
              <div>
                <p className="font-medium text-gray-900 text-sm">In Progress</p>
                <p className="text-xs text-gray-500">I am actively working through this</p>
              </div>
            </div>
          </button>
          <button
            onClick={() => setPhase('C')}
            className="w-full text-left p-4 rounded-xl border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all group"
          >
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm flex items-center justify-center">C</span>
              <div>
                <p className="font-medium text-gray-900 text-sm">Completed</p>
                <p className="text-xs text-gray-500">I have finished this stage</p>
              </div>
            </div>
          </button>
          <button onClick={() => setFocus(null)} className="text-sm text-gray-500 hover:text-gray-700 underline">
            ← Back
          </button>
        </div>
      )}

      {currentStep === 3 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-800">How long have you been facing this issue?</p>
          {URGENCY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setUrgency(opt.value)}
              className="w-full text-left p-4 rounded-xl border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm flex items-center justify-center">{opt.value}</span>
                <div>
                  <p className="font-medium text-gray-900 text-sm">{opt.label}</p>
                  <p className="text-xs text-gray-500">{opt.description}</p>
                </div>
              </div>
            </button>
          ))}
          <button onClick={() => setPhase(null)} className="text-sm text-gray-500 hover:text-gray-700 underline">
            ← Back
          </button>
        </div>
      )}

      {currentStep === 4 && recommendation && (
        <div className="space-y-4">
          <div
            className={`rounded-xl p-4 border ${
              recommendation.priority === 'HIGH'
                ? 'bg-red-50 border-red-200'
                : recommendation.priority === 'MEDIUM'
                ? 'bg-yellow-50 border-yellow-200'
                : 'bg-blue-50 border-blue-200'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={recommendation.priority === 'HIGH' ? 'pending' : 'review'}>
                {recommendation.priority} PRIORITY
              </Badge>
            </div>
            <p className="text-sm text-gray-700">{recommendation.actionScript}</p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" size="sm" onClick={reset}>
              Reset Quiz
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Trending Widget ──────────────────────────────────────────────────────────

function TrendingWidget() {
  const { data, isLoading, isError } = useTrendingQuestion();
  const [expanded, setExpanded] = useState(false);

  if (isError) return null;

  return (
    <div className="mt-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">🔥 Trending Today</h3>
      {isLoading ? (
        <div className="animate-pulse space-y-2">
          <div className="h-12 bg-gray-200 rounded-lg" />
        </div>
      ) : data ? (
        <div
          role="button"
          tabIndex={0}
          onClick={() => setExpanded((v) => !v)}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-label={`Trending FAQ: ${data.title || data.question?.title} — click to ${expanded ? 'collapse' : 'expand'}`}
          className="cursor-pointer rounded-xl border border-gray-200 bg-white hover:border-blue-200 hover:shadow-md transition-all focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
          <div className="p-4">
            <p className="text-sm font-medium text-gray-900">{data.title || data.question?.title}</p>
            {expanded && (
              <p className="mt-2 text-sm text-gray-600">
                {data.description || data.question?.description}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-400">Click to {expanded ? 'collapse' : 'expand'}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ─── Navigation Cards ─────────────────────────────────────────────────────────

interface NavCardProps {
  icon: string;
  title: string;
  description: string;
  to: string;
  isActive?: boolean;
}

function NavCard({ icon, title, description, to, isActive }: NavCardProps) {
  const navigate = useNavigate({ from: '/' });

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate({ to })}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && navigate({ to })}
      aria-label={`${title} — ${description}`}
      className={`cursor-pointer rounded-xl border transition-all focus:ring-2 focus:ring-blue-500 focus:outline-none ${isActive ? 'ring-2 ring-blue-500 border-blue-400' : 'border-transparent hover:border-blue-200 hover:shadow-md'}`}
    >
      <Card className="h-full border-0 shadow-none">
        <CardBody className="flex flex-col items-center text-center gap-3 py-8">
          <span className="text-3xl" aria-hidden="true">{icon}</span>
          <div>
            <p className="font-semibold text-gray-900 text-sm">{title}</p>
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          </div>
          {isActive && (
            <Badge variant="official">Current</Badge>
          )}
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
      {/* Welcome Section */}
      <div className="text-center py-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome to the Samagama Internship Support Center
        </h1>
        <p className="text-gray-500 text-sm max-w-lg mx-auto">
          We are here to help you navigate your internship journey smoothly. Find answers,
          submit questions, or track existing tickets below.
        </p>
      </div>

      {/* Emergency Diagnostic Quiz — collapsed shows nav cards */}
      {!quizOpen && (
        <>
          {/* Three Navigation Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <NavCard
              icon="🔍"
              title="Browse & Search FAQs"
              description="Search official and community questions"
              to="/browse"
            />
            <NavCard
              icon="📝"
              title="Submit a New Question"
              description="Have a unique issue? Open a support ticket"
              to="/submit"
              isActive
            />
            <NavCard
              icon="📦"
              title="Track Ticket Status"
              description="Check the progress of your existing tickets"
              to="/track"
            />
          </div>

          {/* Trending Widget */}
          <TrendingWidget />
        </>
      )}

      {/* Emergency Diagnostic Quiz */}
      <Card>
        <button
          className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors rounded-xl"
          onClick={() => setQuizOpen((v) => !v)}
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">🚨</span>
            <span className="font-semibold text-gray-900 text-sm">
              Need Urgent Help? Take our 3-Step Emergency Diagnostic Quiz
            </span>
          </div>
          <span
            className={`text-gray-400 transition-transform ${quizOpen ? 'rotate-180' : ''}`}
          >
            ▼
          </span>
        </button>

        {quizOpen && (
          <div className="px-5 pb-5 border-t border-gray-100 pt-4">
            <Quiz />
          </div>
        )}
      </Card>


    </div>
    </ErrorBoundary>
  );
}