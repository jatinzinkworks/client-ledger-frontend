import { IDLE_CHECK_INTERVAL_MS, IDLE_TIMEOUT_MS, isIdle } from '@cl/schemas';
import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';

/**
 * Calls `onIdle` once after `timeoutMs` without activity while `enabled`. Returns the function
 * to call on each touch. Timers stop in the background, so it also checks on returning to the app.
 */
export function useIdleTimeout(onIdle: () => void, enabled: boolean, timeoutMs: number = IDLE_TIMEOUT_MS): () => void {
  const lastActivity = useRef(Date.now());
  const onIdleRef = useRef(onIdle);
  useEffect(() => {
    onIdleRef.current = onIdle;
  });

  useEffect(() => {
    if (!enabled) return;
    lastActivity.current = Date.now();
    let fired = false;
    const check = () => {
      if (fired || !isIdle(lastActivity.current, Date.now(), timeoutMs)) return;
      fired = true;
      onIdleRef.current();
    };
    const timer = setInterval(check, IDLE_CHECK_INTERVAL_MS);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') check();
    });
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, [enabled, timeoutMs]);

  return useCallback(() => {
    lastActivity.current = Date.now();
  }, []);
}
