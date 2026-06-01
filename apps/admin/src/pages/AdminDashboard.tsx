import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

interface NotificationCount {
  pendingTickets: number;
  pendingQuestions: number;
}

interface PendingQuestion {
  _id: string;
  title: string;
  description?: string;
  category: string;
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

export default function AdminDashboard() {
  const { data: counts, isLoading: countsLoading } = useQuery<NotificationCount>({
    queryKey: ['admin-notifications'],
    queryFn: () => api.get('/admin/notifications/count').then((r) => r.data as NotificationCount),
    staleTime: 30_000,
  });

  const { data: officialData, isLoading: officialLoading } = useQuery({
    queryKey: ['official-faqs-count'],
    queryFn: () =>
      api
        .get<{ total: number }>('/faqs?type=official&limit=0')
        .then((r) => r.data.total),
    staleTime: 60_000,
  });

  const { data: recentQuestions, isLoading: questionsLoading } = useQuery<{ questions: PendingQuestion[] }>({
    queryKey: ['admin-recent-questions'],
    queryFn: () =>
      api
        .get<{ questions: PendingQuestion[] }>('/admin/questions/pending?page=1&limit=5')
        .then((r) => r.data as { questions: PendingQuestion[] }),
    staleTime: 30_000,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Overview of pending and recent activity</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Pending Tickets"
          value={counts?.pendingTickets ?? 0}
          icon="🎫"
          loading={countsLoading}
          href="/tickets"
          highlight={(counts?.pendingTickets ?? 0) > 0}
        />
        <StatCard
          label="Pending Questions"
          value={counts?.pendingQuestions ?? 0}
          icon="❓"
          loading={countsLoading}
          href="/questions"
          highlight={(counts?.pendingQuestions ?? 0) > 0}
        />
        <StatCard
          label="Official FAQs"
          value={officialData ?? '—'}
          icon="✅"
          loading={officialLoading}
          href="/"
        />
        <StatCard
          label="Content Gaps"
          value="—"
          icon="🔍"
          loading={false}
          href="/gaps"
        />
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <QuickLink to="/tickets" label="Review Tickets →" desc="Approve or reject support requests" />
        <QuickLink to="/questions" label="Review Questions →" desc="Moderate community-submitted FAQs" />
        <QuickLink to="/gaps" label="View Content Gaps →" desc="Find topics with missing or poor answers" />
      </div>

      {/* Recent pending questions */}
      {questionsLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">Newest Pending Questions</h2>
            <a href="/questions" className="text-xs text-indigo-600 hover:underline">
              View all →
            </a>
          </div>
          {recentQuestions?.questions && recentQuestions.questions.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {recentQuestions.questions.map((q) => (
                <div key={q._id} className="px-4 py-3 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 leading-snug truncate">
                      {q.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400">{q.category}</span>
                      <span className="text-gray-300">·</span>
                      <span className="text-xs text-gray-400">{timeAgo(q.createdAt)}</span>
                    </div>
                  </div>
                  <a
                    href="/questions"
                    className="flex-shrink-0 text-xs text-indigo-600 hover:underline self-center"
                  >
                    Review →
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-8 text-center text-sm text-gray-400">
              No pending questions. 🎉
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  loading,
  href,
  highlight,
}: {
  label: string;
  value: string | number;
  icon: string;
  loading: boolean;
  href: string;
  highlight?: boolean;
}) {
  return (
    <a
      href={href}
      className={`bg-white rounded-xl border p-4 hover:shadow-md hover:border-indigo-200 transition group ${
        highlight ? 'border-red-200 bg-red-50/30' : 'border-gray-200'
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
          {loading ? (
            <div className="h-7 w-12 bg-gray-100 rounded animate-pulse" />
          ) : (
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          )}
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-xs text-indigo-600 mt-3 group-hover:underline">View details →</p>
    </a>
  );
}

function QuickLink({
  to,
  label,
  desc,
}: {
  to: string;
  label: string;
  desc: string;
}) {
  return (
    <a
      href={to}
      className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm hover:border-indigo-200 transition block"
    >
      <p className="text-sm font-medium text-gray-900 mb-0.5">{label}</p>
      <p className="text-xs text-gray-500">{desc}</p>
    </a>
  );
}