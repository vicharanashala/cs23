import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import api from '../lib/api';
import { useDebounce } from '../hooks/useDebounce';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardBody } from '../components/ui/Card';
import { Accordion } from '../components/ui/Accordion';
import { ErrorBoundary } from '../components/ErrorBoundary';

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Session ID ───────────────────────────────────────────────────────────────

function getSessionId(): string {
  let id = localStorage.getItem('faq_session_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('faq_session_id', id);
  }
  return id;
}

// ─── API Functions ────────────────────────────────────────────────────────────

const CATEGORIES = [
  'Application Setup',
  'Test & Coding Assessment',
  'Stipend & Offer Letters',
  'Internship Tasks',
] as const;
type Category = (typeof CATEGORIES)[number] | '';

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

function fetchTrending() {
  return api.get<Faq>('/faqs/trending').then((r) => r.data);
}

// ─── Star Rating ──────────────────────────────────────────────────────────────

function StarRatingInput({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (stars: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex gap-1" role="group" aria-label="Rate this question">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !disabled && onChange(star)}
          disabled={disabled}
          aria-label={`Rate ${star} star${star === 1 ? '' : 's'}`}
          className={`text-lg transition-colors focus:ring-2 focus:ring-indigo-500 focus:outline-none rounded ${disabled ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
        >
          <span className={star <= value ? 'text-yellow-400' : 'text-gray-300'}>★</span>
        </button>
      ))}
    </div>
  );
}

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

// ─── SearchBar ────────────────────────────────────────────────────────────────

function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label htmlFor="faq-search" className="block text-xs font-medium text-gray-600 mb-1.5">
        Search
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <span className="text-gray-400 text-sm">🔍</span>
        </div>
        <input
          id="faq-search"
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search FAQs..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </div>
  );
}

// ─── CategoryFilter ───────────────────────────────────────────────────────────

function CategoryFilter({
  active,
  onChange,
}: {
  active: Category;
  onChange: (cat: Category) => void;
}) {
  const all: Category = '';
  const options: { value: Category; label: string }[] = [
    { value: all, label: 'All' },
    ...CATEGORIES.map((c) => ({ value: c, label: c })),
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide" role="list">
      {options.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          aria-pressed={active === value}
          aria-label={`Filter by ${label || 'All categories'}`}
          className={`
            flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors focus:ring-2 focus:ring-indigo-500 focus:outline-none
            ${active === value
              ? 'bg-indigo-600 text-white'
              : 'bg-white border border-gray-300 text-gray-600 hover:border-indigo-400 hover:text-indigo-600'
            }
          `}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// ─── Trending Banner ──────────────────────────────────────────────────────────

function TrendingBanner() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['trending'],
    queryFn: fetchTrending,
    staleTime: 5 * 60 * 1000,
  });

  if (isError || isLoading) return null;

  const title = data?.title || (data as unknown as { question?: { title: string } })?.question?.title;

  if (!title) return null;

  return (
    <Card className="bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200" aria-label={`Trending FAQ: ${title}`}>
      <CardBody className="flex items-center gap-3 py-3">
        <span className="text-lg" aria-hidden="true">🔥</span>
        <p className="text-sm font-medium text-gray-800">
          Trending: <span className="text-orange-700">{title}</span>
        </p>
      </CardBody>
    </Card>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function FaqSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-20 bg-gray-100 rounded-lg" />
      ))}
    </div>
  );
}

// ─── Official FAQ Item (Accordion) ───────────────────────────────────────────

function OfficialFaqItem({ faq }: { faq: Faq }) {
  const body = faq.description || faq.body || '';

  return (
    <Accordion
      items={[
        {
          id: faq._id,
          title: faq.title,
          body: (
            <div className="space-y-3">
              <p className="text-gray-700 text-sm leading-relaxed">{body}</p>
              {faq.mediaUrls && faq.mediaUrls.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {faq.mediaUrls.map((url, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={i}
                      src={url}
                      alt={`Media ${i + 1}`}
                      className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                      loading="lazy"
                    />
                  ))}
                </div>
              )}
              {faq.starRating !== undefined && faq.starRating > 0 && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs text-gray-500">Avg rating:</span>
                  <StarRatingDisplay value={faq.starRating} count={faq.ratingCount} />
                </div>
              )}
              {faq.tags && faq.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {faq.tags.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ),
        },
      ]}
    />
  );
}

// ─── Community FAQ Card ───────────────────────────────────────────────────────

function CommunityFaqCard({ faq }: { faq: Faq }) {
  const queryClient = useQueryClient();
  const sessionId = getSessionId();
  const upvoted = faq.upvotedBy?.includes(sessionId) ?? false;
  const nearPromotion = faq.upvotes >= 12 && faq.status !== 'official_faq';

  const upvoteMutation = useMutation({
    mutationFn: () => api.post<{ upvotes: number; promoted: boolean }>(`/faqs/${faq._id}/upvote`, { sessionId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-faqs'] });
    },
  });

  const ratingMutation = useMutation({
    mutationFn: (stars: number) => api.post(`/faqs/${faq._id}/rate`, { sessionId, stars }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-faqs'] });
    },
  });

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardBody className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-gray-900 leading-snug">{faq.title}</p>
          {nearPromotion && (
            <Badge variant="community" className="flex-shrink-0">
              Promoted soon
            </Badge>
          )}
        </div>

        {/* Upvote */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => !upvoted && upvoteMutation.mutate()}
            disabled={upvoted || upvoteMutation.isPending}
            aria-label={`Upvote this question, currently ${faq.upvotes} upvotes`}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
              ${upvoted
                ? 'bg-indigo-100 text-indigo-700 cursor-default'
                : 'bg-gray-100 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
              }
            `}
          >
            <span aria-hidden="true">👍</span>
            <span>{upvoteMutation.isSuccess && upvoteMutation.data?.data?.upvotes !== undefined
              ? upvoteMutation.data.data.upvotes
              : faq.upvotes}</span>
          </button>
          {upvoted && <span className="text-xs text-indigo-600">Upvoted</span>}
        </div>

        {/* Star rating */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Rate:</span>
          <StarRatingInput
            value={0}
            onChange={(stars) => ratingMutation.mutate(stars)}
            disabled={ratingMutation.isPending}
          />
          {faq.starRating !== undefined && faq.starRating > 0 && (
            <StarRatingDisplay value={faq.starRating} count={faq.ratingCount} />
          )}
        </div>
      </CardBody>
    </Card>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  const navigate = useNavigate({ from: '/browse' });
  return (
    <div className="text-center py-12 space-y-3">
      <span className="text-4xl">🔭</span>
      <p className="text-gray-500 text-sm">No FAQs found. Be the first to submit one!</p>
      <Button variant="primary" size="sm" onClick={() => navigate({ to: '/submit' })}>
        Submit a Question
      </Button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BrowseSearch() {
  return (
    <ErrorBoundary>
    <BrowseSearchInner />
    </ErrorBoundary>
  );
}

function BrowseSearchInner() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<Category>('');
  const [mobileTab, setMobileTab] = useState<'official' | 'community'>('official');

  const debouncedSearch = useDebounce(search, 300);

  // Re-fetch when search or category changes — reset page
  const {
    data: officialData,
    isLoading: officialLoading,
    isError: officialError,
  } = useQuery({
    queryKey: ['official-faqs', { type: 'official', category, search: debouncedSearch, page: 1 }],
    queryFn: () => fetchFaqs({ type: 'official', category, search: debouncedSearch, page: 1 }),
    staleTime: 30_000,
  });

  const {
    data: communityData,
    isLoading: communityLoading,
    isError: communityError,
  } = useQuery({
    queryKey: ['community-faqs', { type: 'community', category, search: debouncedSearch, page: 1 }],
    queryFn: () => fetchFaqs({ type: 'community', category, search: debouncedSearch, page: 1 }),
    staleTime: 30_000,
  });

  const officialFaqs = officialData?.faqs ?? [];
  const communityFaqs = communityData?.faqs ?? [];

  const hasResults = officialFaqs.length > 0 || communityFaqs.length > 0;

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 mb-0.5">Browse & Search FAQs</h1>
        <p className="text-sm text-gray-500">Find answers or explore verified content</p>
      </div>

      {/* Search Bar */}
      <SearchBar value={search} onChange={(v) => { setSearch(v); }} />

      {/* Category Filter */}
      <CategoryFilter active={category} onChange={setCategory} />

      {/* Trending Banner */}
      <TrendingBanner />

      {/* Loading skeleton at top */}
      {(officialLoading || communityLoading) && <FaqSkeleton />}

      {/* Error state */}
      {(officialError || communityError) && (
        <Card className="border-red-200 bg-red-50">
          <CardBody className="text-center py-6">
            <p className="text-red-600 text-sm">Failed to load FAQs. Please try refreshing.</p>
          </CardBody>
        </Card>
      )}

      {/* Empty state */}
      {!officialLoading && !communityLoading && !hasResults && <EmptyState />}

      {/* Mobile Tabs */}
      <div role="tablist" aria-label="FAQ category selection" className="flex sm:hidden border-b border-gray-200">
        {(['official', 'community'] as const).map((tab) => (
          <button
            key={tab}
            id={`tab-${tab}`}
            role="tab"
            aria-selected={mobileTab === tab}
            aria-controls={`${tab}-panel`}
            onClick={() => setMobileTab(tab)}
            className={`flex-1 py-2.5 text-sm font-medium border-b-2 transition-colors focus:ring-2 focus:ring-indigo-500 focus:outline-none ${
              mobileTab === tab
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'official' ? '✅ Official FAQs' : '💬 Community'}
          </button>
        ))}
      </div>

      {/* Two-Column Desktop Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT — Official FAQs */}
        <div role="tabpanel" id="official-panel" aria-labelledby="tab-official">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span aria-hidden="true">✅</span> Official FAQs <span className="text-gray-400 font-normal">({officialData?.total ?? 0})</span>
          </h2>
          {(mobileTab === 'official' || !hasResults) && (
            officialLoading ? <FaqSkeleton /> :
            officialFaqs.length === 0 && !officialLoading ? (
              <p className="text-sm text-gray-400 py-8 text-center">No official FAQs here yet.</p>
            ) : (
              <div className="space-y-2">
                {officialFaqs.map((faq) => (
                  <OfficialFaqItem key={faq._id} faq={faq} />
                ))}
              </div>
            )
          )}
        </div>

        {/* RIGHT — Community Questions */}
        <div role="tabpanel" id="community-panel" aria-labelledby="tab-community">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span aria-hidden="true">💬</span> User-Asked Questions <span className="text-gray-400 font-normal">({communityData?.total ?? 0})</span>
          </h2>
          {(mobileTab === 'community' || !hasResults) && (
            communityLoading ? <FaqSkeleton /> :
            communityFaqs.length === 0 && !communityLoading ? (
              <p className="text-sm text-gray-400 py-8 text-center">No community questions yet.</p>
            ) : (
              <div className="space-y-3">
                {communityFaqs.map((faq) => (
                  <CommunityFaqCard key={faq._id} faq={faq} />
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}