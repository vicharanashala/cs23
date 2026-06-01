import { Link, Outlet } from '@tanstack/react-router';

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
            <span className="font-semibold text-gray-900 text-base">Samagama FAQ Hub</span>
          </Link>

          {/* Right: Admin Portal */}
          <a
            href={import.meta.env.VITE_ADMIN_URL || 'http://localhost:5174'}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            Admin Portal
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
        <Outlet />
      </main>

      {/* Floating Chatbot Button — fixed bottom-right */}
      <button
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center text-xl transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
        title="Chat with AI Assistant"
        onClick={() => window.alert('AI Chatbot coming soon!')}
        aria-label="Open AI Chatbot"
      >
        💬
      </button>
    </div>
  );
}