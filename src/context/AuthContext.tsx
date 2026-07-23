import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { login as loginRequest } from '../lib/endpoints';
import { ApiError } from '../lib/api';
import { registerSessionExpiredHandler } from '../lib/queryClient';
import type { AuthUser } from '../types/auth';

interface AuthContextValue {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  sessionExpired: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  handleSessionExpired: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const expiryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearExpiryTimer = useCallback(() => {
    if (expiryTimer.current) {
      clearTimeout(expiryTimer.current);
      expiryTimer.current = null;
    }
  }, []);

  // Called by the data layer whenever a request comes back with a 401 —
  // clears the token and flips a flag the UI can use to show "session
  // expired" instead of silently bouncing to a blank login screen.
  const handleSessionExpired = useCallback(() => {
    clearExpiryTimer();
    setToken(null);
    setUser(null);
    setSessionExpired(true);
  }, [clearExpiryTimer]);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const res = await loginRequest({ email, password });
        setToken(res.accessToken);
        setUser(res.user);
        setSessionExpired(false);

        // Proactively expire the session client-side rather than waiting
        // for the next request to fail — expiresIn is in seconds, backed
        // off by 1s so we don't race a request that's already in flight
        // right at the boundary.
        clearExpiryTimer();
        expiryTimer.current = setTimeout(() => {
          handleSessionExpired();
        }, Math.max(res.expiresIn - 1, 0) * 1000);
      } catch (err) {
        if (err instanceof ApiError) {
          throw new Error(err.status === 401 || err.status === 400 ? 'Incorrect email or password.' : err.message);
        }
        throw err;
      }
    },
    [clearExpiryTimer, handleSessionExpired]
  );

  const logout = useCallback(() => {
    clearExpiryTimer();
    setToken(null);
    setUser(null);
    setSessionExpired(false);
  }, [clearExpiryTimer]);

  useEffect(() => {
    registerSessionExpiredHandler(handleSessionExpired);
  }, [handleSessionExpired]);

  useEffect(() => clearExpiryTimer, [clearExpiryTimer]);

  return (
    <AuthContext.Provider
      value={{ token, user, isAuthenticated: !!token, sessionExpired, login, logout, handleSessionExpired }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
