/**
 * Simple keyword-bank categorizer for support ticket auto-tagging.
 *
 * Given a text string (concatenated title + description), scores each
 * category by counting how many keyword-bank terms appear in the tokens.
 *
 * Returns the highest-scoring category name, or null if:
 *   - Top score is 0 (no confident match), or
 *   - Top two scores are tied
 */

const KEYWORD_BANKS = {
  'Application Setup': [
    'profile', 'resume', 'upload', 'registration',
    'account', 'login', 'apply', 'form',
  ],
  'Test & Coding Assessment': [
    'test', 'assessment', 'browser', 'locked',
    'code', 'github', 'link', 'session', 'interview',
  ],
  'Stipend & Offer Letters': [
    'stipend', 'offer', 'letter', 'payment',
    'certificate', 'salary', 'sign', 'document',
  ],
  'Internship Tasks': [
    'task', 'project', 'submission', 'roadmap',
    'deadline', 'mentor', 'review', 'pr',
  ],
};

/**
 * @param {string} text — title + description concatenated
 * @returns {string|null} — category name or null if no confident match
 */
function categorize(text) {
  if (!text || typeof text !== 'string') return null;

  // Lowercase and tokenize on whitespace / punctuation
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  /** @type {Record<string, number>} */
  const scores = {};

  for (const [category, keywords] of Object.entries(KEYWORD_BANKS)) {
    let score = 0;
    for (const keyword of keywords) {
      if (tokens.includes(keyword)) {
        score += 1;
      }
    }
    scores[category] = score;
  }

  // Sort categories by score descending
  const ranked = Object.entries(scores).sort(([, a], [, b]) => b - a);
  const [topCategory, topScore] = ranked[0];
  const [, secondScore] = ranked[1] ?? [null, 0];

  // No confident match: top score is 0
  if (topScore === 0) return null;

  // Tie between top two: return null
  if (topScore === secondScore) return null;

  return topCategory;
}

module.exports = { categorize };