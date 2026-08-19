/**
 * useRealtimeSync.ts
 * Lightweight polling hook that keeps both Finance and Mobile stores
 * in sync with Google Sheets by periodically pulling fresh data.
 *
 * - `useRealtimeSync()` — call once in the root component; polls every 30 s
 *   while the tab is visible and sync is enabled in either store.
 * - `triggerManualSync(pull?)` — imperative helper pages can call to force
 *   an immediate pull (and optional push) outside the polling cycle.
 */

import { useEffect, useRef } from "react";
import { useStore } from "./store";
import { useMobileStore } from "./mobileStore";

/** Default polling interval in milliseconds */
const POLL_MS = 30_000;

/**
 * Attempt to pull (and optionally push) data for both stores.
 * Returns `true` if at least one store synced successfully.
 *
 * @param pullOnly  If `true`, only pull from sheets (skip push). Default `true`.
 */
export async function triggerManualSync(pullOnly = true): Promise<boolean> {
  const financeState = useStore.getState();
  const mobileState = useMobileStore.getState();

  const financeEnabled = financeState.sheetsConfig?.enabled && financeState.sheetsConfig?.url;
  const mobileEnabled = mobileState.sheetsConfig?.enabled && mobileState.sheetsConfig?.url;

  if (!financeEnabled && !mobileEnabled) return false;

  const results: boolean[] = [];

  // Finance store
  if (financeEnabled) {
    try {
      if (!pullOnly) await financeState.syncToSheets();
      const res = await financeState.loadFromSheets();
      results.push(res.ok);
    } catch {
      results.push(false);
    }
  }

  // Mobile store
  if (mobileEnabled) {
    try {
      if (!pullOnly) await mobileState.syncToSheets();
      const res = await mobileState.loadFromSheets();
      results.push(res.ok);
    } catch {
      results.push(false);
    }
  }

  return results.some(Boolean);
}

/**
 * React hook — call once in `<RootComponent>`.
 * Polls Google Sheets every 30 s while the document is visible and
 * at least one store has sync enabled.
 */
export function useRealtimeSync() {
  const financeConfig = useStore((s) => s.sheetsConfig);
  const mobileConfig = useMobileStore((s) => s.sheetsConfig);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const enabled =
    (financeConfig?.enabled && !!financeConfig?.url) ||
    (mobileConfig?.enabled && !!mobileConfig?.url);

  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      return;
    }

    // Immediately pull on mount / when sync is first enabled
    triggerManualSync(true).catch(() => {});

    const tick = () => {
      // Skip if tab is hidden — save bandwidth
      if (document.hidden) return;
      triggerManualSync(true).catch(() => {});
    };

    timerRef.current = setInterval(tick, POLL_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [enabled]);
}
