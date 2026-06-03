import { Link, Outlet } from '@tanstack/react-router';
import { ChatBot } from '../components/ChatBot';

export function AppShell() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Static Header — visible on all routes */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Left: Logo + Brand */}
          <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">FAQ</span>
            </div>
            <span className="font-semibold text-gray-900 text-base">CrowdFAQ</span>
          </Link>

          {/* Right: empty — admin portal is a separate app, not linked from main site */}
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