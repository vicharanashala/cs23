import { useState, useRef, useEffect } from 'react';
import api from '../lib/api';
import { Spinner } from './ui/Spinner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: { question: string; answer: string; score: number }[];
}

// ─── Casual response matcher ─────────────────────────────────────────────────

const CASUAL_PATTERNS: [RegExp, string][] = [
  [/^(hi|hello|hey|yo|sup|hiya|greetings)/i, "Hey there! 👋 How can I help you today?"],
  [/^(thanks|thank you|thx|ty)/i, "You're welcome! 😊"],
  [/^good morning/i, "Good morning! 🌤️ Hope you have a great day!"],
  [/^good evening/i, "Good evening! 🌆 Hope your day's going well!"],
  [/^(how are you|how('s| is) it going)/i, "I'm doing great, thanks for asking! 🎉 How can I help you?"],
  [/^(bye|goodbye|see you|take care)/i, "Bye! Take care! 👋"],
  [/^(cool|nice|awesome|amazing|great)/i, "😊 Glad you think so!"],
  [/^(what('s| is) your name|who are you)/i, "I'm the Samagama AI Assistant! 🤖 I'm here to help with anything about the internship program."],
  [/^(help|what can i ask|what do you do)/i, "You can ask me anything about the Samagama Internship! For example:\n• Application deadlines & eligibility\n• NOC requirements\n• Stipend details\n• Test & coding assessment info\n• Internship tasks & projects\n\nJust type your question and I'll find the answer for you! 🚀"],
];

function getCasualResponse(text: string): string | null {
  for (const [pattern, response] of CASUAL_PATTERNS) {
    if (pattern.test(text.trim())) return response;
  }
  return null;
}

// ─── Chat function ────────────────────────────────────────────────────────────

async function getChatResponse(message: string): Promise<{ answer: string; sources?: { question: string; answer: string; score: number }[] }> {
  // Try AI chat endpoint first (RAG)
  try {
    const res = await api.post<{ answer: string; context?: string[] }>('/search?q=' + encodeURIComponent(message) + '&mode=ai', {});
    return { answer: res.data.answer };
  } catch {
    // Fall back to chat endpoint
    const res = await api.post<{ answer: string }>('/chat', { message });
    return { answer: res.data.answer };
  }
}

// ─── ChatBot Component ─────────────────────────────────────────────────────────

export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    // Immediate casual response for greetings
    const casual = getCasualResponse(text);
    if (casual && !text.endsWith('?')) {
      const userMsg: Message = { role: 'user', content: text };
      setMessages(prev => [...prev, userMsg, { role: 'assistant', content: casual }]);
      setInput('');
      return;
    }

    const userMsg: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const { answer } = await getChatResponse(text);
      setMessages(prev => [...prev, { role: 'assistant', content: answer }]);
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: "Sorry, I'm having trouble answering that right now. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* ── Floating Toggle Button ── */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center text-xl transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 z-50"
          aria-label="Open AI Chatbot"
        >
          💬
        </button>
      )}

      {/* ── Chat Panel ── */}
      {isOpen && (
        <div
          className="fixed bottom-6 right-6 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200"
          style={{ height: '580px', maxHeight: 'calc(100vh - 8rem)' }}
        >
          {/* Header */}
          <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between flex-shrink-0 rounded-t-2xl">
            <div className="flex items-center gap-2">
              <span className="text-lg">🤖</span>
              <div>
                <div className="font-semibold text-sm">Samagama AI Assistant</div>
                <div className="text-xs text-blue-100 opacity-80">Chat or ask about the internship</div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-blue-200 transition-colors text-lg"
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && (
              <div className="text-center text-gray-400 text-sm mt-16">
                <div className="text-3xl mb-2">👋</div>
                <p>Hi! Say hi, ask a question, or just<br />chat — I'm here for both! 😊</p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-md'
                    : 'bg-gray-100 text-gray-800 rounded-bl-md'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Spinner size="sm" />
                    <span className="text-xs text-gray-500">Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 px-4 py-3 flex-shrink-0 rounded-b-2xl">
            <div className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Say hi or ask a question..."
                rows={1}
                className="flex-1 resize-none rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent max-h-24 overflow-y-auto"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl px-4 py-2 text-sm font-medium transition-colors flex-shrink-0"
              >
                Send
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1.5">Enter to send · Shift+Enter for new line</p>
          </div>
        </div>
      )}
    </>
  );
}