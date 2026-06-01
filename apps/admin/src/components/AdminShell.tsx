import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { useAdminAuth } from '../hooks/useAdminAuth';

interface NotificationCount {
  pendingTickets: number;
  pendingQuestions: number;
}

const navLinks = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/tickets', label: 'Ticket Queue', icon: '🎫', badgeKey: 'pendingTickets' as const },
  { to: '/questions', label: 'Question Queue', icon: '❓', badgeKey: 'pendingQuestions' as const },
  { to: '/gaps', label: 'Content Gaps', icon: '🔍' },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { logout } = useAdminAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: counts } = useQuery<NotificationCount>({
    queryKey: ['admin-notifications'],
    queryFn: () => api.get<NotificationCount>('/admin/notifications/count').then((r) => r.data),
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  const totalBadge = (counts?.pendingTickets ?? 0) + (counts?.pendingQuestions ?? 0);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar backdrop (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-30 w-56 bg-gray-900 flex flex-col
          transform transition-transform duration-200 ease-in-out
          lg:relative lg:translate-x-0 lg:z-auto
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Brand */}
        <div className="px-4 py-5 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xs">S</span>
            </div>
            <div>
              <p className="text-white font-semibold text-sm leading-tight">CrowdFAQ</p>
              <p className="text-gray-400 text-xs">Admin Portal</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navLinks.map(({ to, label, icon, badgeKey }) => {
            const badgeCount = badgeKey ? counts?.[badgeKey] : 0;
            return (
              <a
                key={to}
                href={to}
                className="flex items-center justify-between px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <span className="flex items-center gap-2">
                  <span aria-hidden="true">{icon}</span>
                  <span>{label}</span>
                </span>
                {badgeCount !== undefined && badgeCount > 0 && (
                  <span
                    className="min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full"
                    aria-label={`${badgeCount} pending`}
                  >
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </span>
                )}
              </a>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-gray-700">
          <button
            onClick={logout}
            aria-label="Log out of admin portal"
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition text-sm"
          >
            <span aria-hidden="true">🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="lg:hidden text-gray-500 hover:text-gray-700 p-1"
            aria-label="Toggle sidebar"
          >
            <span className="text-xl">☰</span>
          </button>

          <h2 className="text-sm font-medium text-gray-700 hidden lg:block">
            {navLinks.find((l) => window.location.pathname === l.to)?.label ?? 'Admin Portal'}
          </h2>

          {totalBadge > 0 && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 border border-red-200 rounded-full text-red-700 font-medium">
                🔴 {totalBadge} pending
              </span>
            </div>
          )}
        </header>

        {/* Page content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}