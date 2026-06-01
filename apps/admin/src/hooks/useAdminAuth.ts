import { useCallback } from 'react';

const TOKEN_KEY = 'admin_token';

export function useAdminAuth() {
  const token = localStorage.getItem(TOKEN_KEY);
  const isAuthenticated = !!token;

  const login = useCallback((newToken: string) => {
    localStorage.setItem(TOKEN_KEY, newToken);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    window.location.href = '/login';
  }, []);

  return { token, isAuthenticated, login, logout };
}