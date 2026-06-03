import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import api from '../lib/api';
import { useDebounce } from '../hooks/useDebounce';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardBody } from '../components/ui/Card';
import { Accordion } from '../components/ui/Accordion';
import { Spinner } from '../components/ui/Spinner';
import { ErrorBoundary } from '../components/ErrorBoundary';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Faq {
  _id: string;
  title: string;
  description?: string;
  body?: string;
  category: string;
  status: string;
  isOfficialFAQ?: boolean;
  upvotes: number;
  upvotedBy?: string[];
  starRating?: number;
  ratingCount?: number;
  mediaUrls?: string[];
  tags?: string[];
  createdAt: string;
}

interface KeywordResult {
  question: string;
  answer: string;
  score: number;
}

type SearchMode = 'keyword' | 'ai';

// ─── Session ID ────────────────────────────────────────────────────────────────

function getSessionId(): string {
  let id = localStorage.getItem('faq_session_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('faq_session_id', id);
  }
  return id;
}

// ─── Categories ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  'Application Setup',
  'Test & Coding Assessment',
  'Stipend & Offer Letters',
  'Internship Tasks',
] as const;
type Category = (typeof CATEGORIES)[number] | '';

// ─── API: MongoDB FAQ fetch ────────────────────────────────────────────────────

function fetchFaqs(params: {
  type: 'official' | 'community';
  category: string;
  search: string;
  page: number;
}) {
  const query = new URLSearchParams();
  query.set('type', params.type);
  query.set('page', String(params.page));
  if (params.category) query.set('category', params.category);
  if (params.search) query.set('search', params.search);
  return api
    .get<{ faqs: Faq[]; total: number; page: number; totalPages: number }>(`/faqs?${query}`)
    .then((r) => r.data);
}

// ─── Star Rating ───────────────────────────────────────────────────────────────

function StarRatingDisplay({ value, count }: { value: number; count?: number }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-yellow-400 text-sm">
        {'★'.repeat(Math.round(value))}
        {'☆'.repeat(5 - Math.round(value))}
      </span>
      {count !== undefined && count > 0 && (
        <span className="text-xs text-gray-400">({count})</span>
      )}
    </div>
  );
}

// ─── AI Answer Panel ───────────────────────────────────────────────────────────

function AiAnswer({ query }: { query: string }) {
  const [answer, setAnswer] = useState<string | null>(null);
  const [context, setContext] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const prevQueryRef = useRef<string>('');

  useEffect(() => {
    if (!query) return;
    if (query === prevQueryRef.current) return;
    prevQueryRef.current = query;
    setAnswer(null);
    setContext([]);
    setError(null);

    setIsLoading(true);
    api.post<{ answer: string; context?: string[] }>('/chat', { message: query })
      .then(res => {
        setAnswer(res.data.answer);
        setContext(res.data.context || []);
        setError(null);
      })
      .catch(() => setError('Failed to get AI response. Please try again.'))
      .finally(() => setIsLoading(false));
  }, [query]);

  if (!query) {
    return (
      <div className="text-center py-10 text-gray-400">
        <div className="text-4xl mb-3">🔍</div>
        <p className="text-sm">Ask a question above to get an AI-powered answer<br />with sources from the Samagama FAQ knowledge base.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 py-8 px-4">
        <Spinner size="sm" />
        <span className="text-sm text-gray-500">Searching knowledge base and generating answer...</span>
      </div>
    );
  }

  if (error || (!answer && !isLoading)) {
    return (
      <div className="text-center py-8 text-red-500 text-sm">
        ⚠️ {error || 'Something went wrong. Please try again.'}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* AI Answer */}
      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm">🤖</span>
          <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">AI Answer</span>
        </div>
        <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{answer}</p>
      </div>

      {/* Source citations */}
      {context.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Sources ({context.length})
          </p>
          <div className="space-y-2">
            {context.map((doc, i) => {
              // Extract question from document (format: "Question:\n...")
              const qMatch = doc.match(/Question:\n(.+?)\n\nAnswer:/s);
              const question = qMatch ? qMatch[1] : doc.substring(0, 100);
              return (
                <div key={i} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="text-xs font-medium text-gray-700 mb-0.5">📄 {question}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Keyword Search Results ─────────────────────────────────────────────────────

function KeywordResults({ query }: { query: string }) {
  const [selectedCategory, setSelectedCategory] = useState<Category>('');
  const [page, setPage] = useState(1);
  const debouncedQuery = useDebounce(query, 300);
  const sessionId = getSessionId();

  const { data: officialData, isLoading: officialLoading } = useQuery({
    queryKey: ['official-faqs', { search: debouncedQuery, category: selectedCategory, page }],
    queryFn: () => fetchFaqs({ type: 'official', category: selectedCategory, search: debouncedQuery, page }),
    enabled: !!debouncedQuery,
    staleTime: 30_000,
  });

  const { data: communityData, isLoading: communityLoading } = useQuery({
    queryKey: ['community-faqs', { search: debouncedQuery, page }],
    queryFn: () => fetchFaqs({ type: 'community', category: selectedCategory, search: debouncedQuery, page }),
    enabled: !!debouncedQuery,
    staleTime: 30_000,
  });

  const officialFaqs = officialData?.faqs ?? [];
  const communityFaqs = communityData?.faqs ?? [];
  const isLoading = officialLoading || communityLoading;
  const hasResults = officialFaqs.length > 0 || communityFaqs.length > 0;
  const total = (officialData?.total ?? 0) + (communityData?.total ?? 0);

  const queryClient = useQueryClient();

  if (!query) {
    return (
      <div className="text-center py-10 text-gray-400">
        <div className="text-4xl mb-3">🔤</div>
        <p className="text-sm">Type in the search box to find<br />matching FAQs from our knowledge base.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 py-8">
        <Spinner size="sm" />
        <span className="text-sm text-gray-500">Searching...</span>
      </div>
    );
  }

  if (!hasResults) {
    return (
      <div className="text-center py-10 text-gray-400">
        <div className="text-4xl mb-3">😕</div>
        <p className="text-sm font-medium text-gray-600 mb-1">No results for "{query}"</p>
        <p className="text-xs">Try different keywords or switch to AI Search for smarter answers.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500">
        {total} result{total !== 1 ? 's' : ''} found
      </p>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2">
        {['', ...CATEGORIES].map(cat => (
          <button
            key={cat}
            onClick={() => { setSelectedCategory(cat as Category); setPage(1); }}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat || 'All Categories'}
          </button>
        ))}
      </div>

      {/* Official FAQs */}
      {officialFaqs.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            ✅ Official FAQs ({officialData?.total ?? 0})
          </p>
          <div className="space-y-2">
            {officialFaqs.map(faq => (
              <OfficialFaqItem key={faq._id} faq={faq} />
            ))}
          </div>
        </div>
      )}

      {/* Community Questions */}
      {communityFaqs.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            💬 Community Questions ({communityData?.total ?? 0})
          </p>
          <div className="space-y-3">
            {communityFaqs.map(faq => {
              const upvoted = faq.upvotedBy?.includes(sessionId) ?? false;
              return (
                <CommunityFaqItem key={faq._id} faq={faq} upvoted={upvoted} sessionId={sessionId} />
              );
            })}
          </div>
        </div>
      )}

      {/* Pagination */}
      {total > 10 && (
        <div className="flex gap-2 pt-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            ← Previous
          </Button>
          <span className="text-xs text-gray-500 py-1">Page {page}</span>
          <Button
            variant="secondary"
            size="sm"
            disabled={(officialData?.totalPages ?? 1) <= page && (communityData?.totalPages ?? 1) <= page}
            onClick={() => setPage(p => p + 1)}
          >
            Next →
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Official FAQ Item (Accordion) ───────────────────────────────────────────

function OfficialFaqItem({ faq }: { faq: Faq }) {
  const body = faq.description || faq.body || '';

  return (
    <Accordion
      items={[{
        id: faq._id,
        title: faq.title,
        body: (
          <div className="space-y-3">
            <p className="text-gray-700 text-sm leading-relaxed">{body}</p>
            {faq.starRating !== undefined && faq.starRating > 0 && (
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs text-gray-500">Avg rating:</span>
                <StarRatingDisplay value={faq.starRating} count={faq.ratingCount} />
              </div>
            )}
            {faq.tags && faq.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {faq.tags.map(tag => (
                  <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{tag}</span>
                ))}
              </div>
            )}
          </div>
        ),
      }]}
    />
  );
}

// ─── Community FAQ Item ────────────────────────────────────────────────────────

function CommunityFaqItem({ faq, upvoted, sessionId }: { faq: Faq; upvoted: boolean; sessionId: string }) {
  const queryClient = useQueryClient();

  const upvoteMutation = useMutation({
    mutationFn: () => api.post(`/faqs/${faq._id}/upvote`, { sessionId }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['community-faqs'] });
    },
  });

  const handleUpvote = () => {
    if (!upvoted && !upvoteMutation.isPending) {
      upvoteMutation.mutate();
    }
  };

  const upvoteCount = upvoteMutation.isSuccess && upvoteMutation.data?.data?.upvotes !== undefined
    ? upvoteMutation.data.data.upvotes
    : faq.upvotes;

  return (
    <Card className={`hover:shadow-md transition-all ${upvoted ? 'border-indigo-200 bg-indigo-50/30' : ''}`}>
      <CardBody className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-gray-900 leading-snug flex-1">{faq.title}</p>
          {faq.category && (
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full flex-shrink-0">{faq.category}</span>
          )}
        </div>

        {faq.description && (
          <p className="text-xs text-gray-600 leading-relaxed">{faq.description}</p>
        )}

        <div className="flex items-center gap-3 pt-1">
          {/* Upvote Button */}
          <button
            onClick={handleUpvote}
            disabled={upvoted || upvoteMutation.isPending}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all focus:ring-2 focus:ring-indigo-400 focus:outline-none ${
              upvoted
                ? 'bg-indigo-100 text-indigo-700 cursor-default'
                : 'bg-gray-100 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
            }`}
            title={upvoted ? 'You found this helpful' : 'Mark as helpful'}
          >
            <span>{upvoted ? '✅' : '👍'}</span>
            <span>{upvoteCount}</span>
            <span className="hidden sm:inline">{upvoted ? 'Helpful' : 'Found helpful'}</span>
          </button>

          {upvoted && (
            <span className="text-xs text-indigo-600 font-medium">Thank you for your feedback!</span>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

// ─── Empty State ───────────────────────────────────────────────────────────────

function EmptyState({ onNavigate }: { onNavigate: (path: string) => void }) {
  return (
    <div className="text-center py-12 space-y-3">
      <span className="text-4xl">🔭</span>
      <p className="text-gray-500 text-sm">No results found.</p>
      <Button variant="primary" size="sm" onClick={() => onNavigate('/submit')}>
        Submit a Question
      </Button>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function BrowseSearch() {
  return (
    <ErrorBoundary>
      <BrowseSearchInner />
    </ErrorBoundary>
  );
}

function BrowseSearchInner() {
  const [query, setQuery] = useState('');
  const [searchMode, setSearchMode] = useState<SearchMode>('keyword');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const navigate = useNavigate({ from: '/browse' });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedQuery(query);
  };

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 mb-0.5">Search FAQs</h1>
        <p className="text-sm text-gray-500">Find answers from verified content or get AI-powered explanations</p>
      </div>

      {/* ── Google-style Search Bar ── */}
      <form onSubmit={handleSearch} className="relative">
        <div className="flex items-center gap-0 bg-white border border-gray-300 rounded-2xl shadow-sm hover:shadow-md transition-shadow focus-within:shadow-md focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200">
          <span className="pl-4 text-gray-400 text-lg">🔍</span>
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search questions about the internship program..."
            className="flex-1 px-3 py-3.5 text-gray-900 placeholder-gray-400 focus:outline-none rounded-2xl bg-transparent"
            autoFocus
          />
          <button
            type="submit"
            className="m-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors"
          >
            Search
          </button>
        </div>
      </form>

      {/* ── Mode Tabs ── */}
      <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl w-fit">
        <button
          onClick={() => { setSearchMode('keyword'); if (query) setSubmittedQuery(query); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all focus:ring-2 focus:ring-indigo-500 focus:outline-none ${
            searchMode === 'keyword'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          🔤 <span>Keyword Search</span>
        </button>
        <button
          onClick={() => { setSearchMode('ai'); if (query) setSubmittedQuery(query); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all focus:ring-2 focus:ring-indigo-500 focus:outline-none ${
            searchMode === 'ai'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          🤖 <span>AI Search</span>
        </button>
      </div>

      {/* ── Results Area ── */}
      <div>
        {searchMode === 'keyword' ? (
          <KeywordResults query={submittedQuery} />
        ) : (
          <AiAnswer query={submittedQuery} />
        )}
      </div>
    </div>
  );
}