// Lightweight session ID — stored in localStorage, sent as X-Session-Id header.
// In a real auth flow this would be a JWT; here we use a random string.

const SESSION_KEY = 'faq_session_id';

export function getSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}