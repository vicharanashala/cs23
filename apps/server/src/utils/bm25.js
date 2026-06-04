/**
 * Simple BM25 ranking for FAQ search.
 * Fetches all matching FAQs and scores them in Node.js using BM25.
 *
 * Usage: searchFaqs(query, filter, { limit, skip }, Question)
 * The Question model is passed in explicitly to avoid module-loading edge cases.
 */

function tokenize(text) {
  return text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2);
}

function idf(term, docCount, docFreqs) {
  const df = docFreqs[term] || 0;
  return Math.log((docCount - df + 0.5) / (df + 0.5) + 1);
}

function bm25Scores(query, documents, docFields) {
  const queryTokens = tokenize(query);
  if (!queryTokens.length) return documents.map((_, i) => ({ idx: i, score: 0 }));

  const docFreqs = {};
  documents.forEach((doc) => {
    const tokens = tokenize(docFields(doc));
    new Set(tokens).forEach(t => { docFreqs[t] = (docFreqs[t] || 0) + 1; });
  });

  const N = documents.length;
  const avgLen = documents.reduce((s, doc) => s + tokenize(docFields(doc)).length, 0) / Math.max(N, 1);
  const k1 = 1.5, b = 0.75;

  return documents.map((doc, idx) => {
    const tokens = tokenize(docFields(doc));
    const docLen = tokens.length;
    const tfMap = {};
    tokens.forEach(t => { tfMap[t] = (tfMap[t] || 0) + 1; });

    let score = 0;
    for (const qToken of queryTokens) {
      const tf = tfMap[qToken] || 0;
      if (tf === 0) continue;
      const idfVal = idf(qToken, N, docFreqs);
      score += idfVal * (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * docLen / Math.max(avgLen, 1)));
    }
    return { idx, score };
  });
}

/**
 * @param {string} query - Search query string
 * @param {object} mongoFilter - MongoDB filter object
 * @param {{ limit?: number, skip?: number }} opts - Pagination options
 * @param {object} Question - The Question Mongoose model
 */
async function searchFaqs(query, mongoFilter, opts = {}, Question) {
  const { limit = 20, skip = 0 } = opts;
  const docs = await Question.find(mongoFilter).lean();
  const scores = bm25Scores(query, docs, d => `${d.title} ${d.description || ''} ${d.body || ''}`);

  const ranked = scores
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(skip, skip + limit)
    .map(x => ({ ...docs[x.idx], _bm25Score: x.score }));

  return {
    faqs: ranked,
    total: scores.filter(x => x.score > 0).length,
  };
}

module.exports = { searchFaqs, tokenize };