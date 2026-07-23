import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { ApiError } from './api';

// AuthProvider registers itself here on mount. This lets the QueryClient
// (created once, outside the React tree) reach back into auth state
// without prop-drilling a callback through every query/mutation.
let sessionExpiredHandler: (() => void) | null = null;
export function registerSessionExpiredHandler(fn: () => void) {
  sessionExpiredHandler = fn;
}

function handleError(error: unknown) {
  if (error instanceof ApiError && error.isSessionExpired) {
    sessionExpiredHandler?.();
  }
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // don't retry auth failures or 4xx — retrying won't fix a bad token
        if (error instanceof ApiError && error.status < 500) return false;
        return failureCount < 2;
      },
      staleTime: 30_000,
    },
  },
  queryCache: new QueryCache({ onError: handleError }),
  mutationCache: new MutationCache({ onError: handleError }),
});
