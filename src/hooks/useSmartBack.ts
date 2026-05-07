import { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface UseSmartBackOptions {
  /** Fallback path when there's no history to go back to (direct URL access / refresh). */
  fallback?: string;
}

/**
 * Smart back navigation that:
 *   1. Tries `navigate(-1)` if the user has navigated from another in-app page (history.length > 1
 *      AND the location.key is not the initial 'default' marker react-router assigns to the first
 *      page in a session).
 *   2. Falls back to the provided `fallback` path otherwise (direct URL / refresh / new tab).
 *
 * This guarantees a consistent "back to where I came from" experience throughout the app,
 * regardless of the entry point.
 */
export function useSmartBack(options: UseSmartBackOptions = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const fallback = options.fallback ?? '/';

  const goBack = useCallback(() => {
    // location.key === 'default' means this is the first entry in the SPA history → no real "back"
    const hasHistory = location.key !== 'default' && window.history.length > 1;
    if (hasHistory) {
      navigate(-1);
    } else {
      navigate(fallback);
    }
  }, [navigate, location.key, fallback]);

  return goBack;
}
