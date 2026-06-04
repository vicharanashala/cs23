import { useState, useRef, useEffect } from 'react';
import api from '../lib/api';
import { Spinner } from './ui/Spinner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
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

// ─── FAQ-based answer engine (no external RAG required) ─────────────────────
async function getChatResponse(message: string): Promise<{ answer: string }> {
  // 1. Try the RAG proxy endpoint first (if external service exists)
  try {
    const res = await api.post<{ answer: string }>('/search', { q: message, mode: 'ai' });
    if (res.data?.answer) return { answer: res.data.answer };
  } catch {
    // RAG service unavailable — fall through to local FAQ engine
  }

  // 2. Fallback: search MongoDB FAQ data directly and synthesize an answer
  try {
    const q = encodeURIComponent(message.trim());
    const [officialRes, communityRes] = await Promise.all([
      api.get(`/faqs?type=official&search=${q}&limit=5`),
      api.get(`/faqs?type=community&search=${q}&limit=5`),
    ]);

    const officialFaqs: any[] = officialRes.data?.faqs ?? [];
    const communityFaqs: any[] = communityRes.data?.faqs ?? [];
    const allFaqs = [...officialFaqs, ...communityFaqs];

    if (allFaqs.length === 0) {
      return {
        answer: `I couldn't find any FAQs matching "${message.trim()}". Try browsing different keywords, or submit a support ticket and our team will help you directly! 🎫`,
      };
    }

    // Build a friendly synthesized answer from top matches
    const top = allFaqs[0];
    let answer = `I found something that might help! 👇\n\n`;
    answer += `**${top.title}**\n`;
    if (top.description) answer += `${top.description}\n\n`;
    if (top.body) answer += `${top.body}\n\n`;
    if (top.category) answer += `_Category: ${top.category}_`;

    if (allFaqs.length > 1) {
      answer += `\n\n---\n\n**Other things I found:**\n`;
      allFaqs.slice(1, 3).forEach((faq: any, i: number) => {
        answer += `\n${i + 1}. ${faq.title}`;
        if (faq.description) answer += ` — ${faq.description.substring(0, 80)}${faq.description.length > 80 ? '...' : ''}`;
      });
    }

    answer += `\n\n_Want more details? Use the Browse & Search page for full results!_ 🔍`;

    return { answer };
  } catch {
    return {
      answer: `I'm having trouble answering that right now. Please try again or browse the FAQs directly! 🙏`,
    };
  }
}

// ─── ChatBot ─────────────────────────────────────────────────────────────────

export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { if (isOpen) setTimeout(() => inputRef.current?.focus(), 100); }, [isOpen]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const casual = getCasualResponse(text);
    if (casual && !text.endsWith('?')) {
      setMessages(prev => [...prev, { role: 'user', content: text }, { role: 'assistant', content: casual }]);
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
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble answering that right now. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Toggle */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center text-xl transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 z-50"
          aria-label="Open AI Chatbot"
        >
          💬
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-dark-surface rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200 dark:border-dark-border"
          style={{ height: '580px', maxHeight: 'calc(100vh - 8rem)' }}>

          {/* Header */}
          <div className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-3 flex items-center justify-between flex-shrink-0 rounded-t-2xl">
            <div className="flex items-center gap-2">
              <span className="text-lg">🤖</span>
              <div>
                <div className="font-semibold text-sm">Samagama AI Assistant</div>
                <div className="text-xs text-blue-100 opacity-80">Chat or ask about the internship</div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white hover:text-blue-200 transition-colors text-lg" aria-label="Close chat">✕</button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50 dark:bg-dark-bg">
            {messages.length === 0 && (
              <div className="text-center text-gray-400 dark:text-dark-muted text-sm mt-16">
                <div className="text-3xl mb-2">👋</div>
                <p>Say hi or ask anything!<br />I'm here for both casual chat and<br />internship questions. 😊</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-md'
                    : 'bg-white dark:bg-dark-surface text-gray-800 dark:text-dark-text border border-gray-100 dark:border-dark-border rounded-bl-md'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-dark-border rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Spinner size="sm" />
                    <span className="text-xs text-gray-500 dark:text-dark-muted">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 dark:border-dark-border px-4 py-3 flex-shrink-0 bg-white dark:bg-dark-surface rounded-b-2xl">
            <div className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Say hi or ask a question..."
                rows={1}
                className="flex-1 resize-none rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text placeholder-gray-400 dark:placeholder-dark-muted px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 max-h-24 overflow-y-auto"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl px-4 py-2 text-sm font-medium transition-colors flex-shrink-0"
              >
                Send
              </button>
            </div>
            <p className="text-xs text-gray-400 dark:text-dark-muted mt-1.5">Enter to send · Shift+Enter for new line</p>
          </div>
        </div>
      )}
    </>
  );
}