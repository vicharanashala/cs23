import React from 'react';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">FAQ</span>
            </div>
            <h1 className="text-lg font-semibold text-gray-900">FAQ Central Hub</h1>
          </div>
          <a
            href="/admin"
            className="text-sm text-brand-600 hover:text-brand-700 font-medium"
          >
            Admin Portal
          </a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="text-center py-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome to FAQ Central Hub
          </h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Find answers, submit tickets, and track your internship queries — all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-6 py-3 bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600 transition">
              Browse & Search FAQs
            </button>
            <button className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition">
              Submit a Ticket
            </button>
            <button className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition">
              Track my Ticket
            </button>
          </div>
        </div>
      </main>

      {/* Floating Chatbot Button */}
      <button
        className="fixed bottom-6 right-6 w-14 h-14 bg-brand-500 hover:bg-brand-600 text-white rounded-full shadow-lg flex items-center justify-center text-2xl transition"
        title="Chat with us"
        onClick={() => window.open('https://samagama.in/chatbot', '_blank')}
      >
        💬
      </button>
    </div>
  );
}

export default App;