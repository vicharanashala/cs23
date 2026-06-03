import { Link, Outlet } from '@tanstack/react-router';
import { ChatBot } from '../components/ChatBot';
import { useTheme } from '../contexts/ThemeContext';

export function AppShell() {
  const { theme, toggle } = useTheme();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg flex flex-col transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-dark-surface border-b border-gray-200 dark:border-dark-border shadow-sm sticky top-0 z-50 transition-colors">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Left: Logo + Brand */}
          <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">FAQ</span>
            </div>
            <span className="font-semibold text-gray-900 dark:text-dark-text text-base">CrowdFAQ</span>
          </Link>

          {/* Right: Nav links + Theme toggle */}
          <div className="flex items-center gap-4">
            <nav className="flex items-center gap-4">
              {[
                { to: '/', label: 'Home' },
                { to: '/browse', label: 'Browse' },
                { to: '/submit', label: 'Submit' },
                { to: '/track', label: 'Track' },
                { to: '/my-questions', label: 'My Questions' },
              ].map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className="text-sm text-gray-600 dark:text-dark-muted hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
                >
                  {label}
                </Link>
              ))}
            </nav>

            {/* Dark mode toggle */}
            <button
              onClick={toggle}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              className="w-9 h-9 rounded-full bg-gray-100 dark:bg-dark-border hover:bg-gray-200 dark:hover:bg-dark-muted flex items-center justify-center text-base transition-all focus:ring-2 focus:ring-blue-400 focus:outline-none"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
        <Outlet />
      </main>

      <ChatBot />
    </div>
  );
}