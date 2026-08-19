/**
 * useRealtimeSync.ts
 * Lightweight polling hook that keeps data in sync with Google Sheets by periodically pulling fresh data.
 *
 * - `useRealtimeSync()` — call once in the root component; polls every 30 s
 *   while the tab is visible and sync is enabled.
 * - `triggerManualSync(force?)` — imperative helper pages can call to force
 *   an immediate pull outside the polling cycle.
 */

import { useEffect, useRef } from "react";
import { syncFromSheetsToLocalStorage } from "./data-store";
import { isGSheetsEnabled } from "./google-sheets";

/** Default polling interval in milliseconds */
const POLL_MS = 30_000;

/**
 * Attempt to pull data from Google Sheets.
 * Returns `true` if sync is enabled and executed.
 *
 * @param force  If `true`, bypass rate limiting / cooldown. Default `false`.
 */
export async function triggerManualSync(force = false): Promise<boolean> {
  if (!isGSheetsEnabled()) return false;

  try {
    await syncFromSheetsToLocalStorage(force);
    return true;
  } catch {
    return false;
  }
}

/**
 * React hook — call once in `<RootComponent>`.
 * Polls Google Sheets every 30 s while the document is visible and
 * sync is enabled.
 */
export function useRealtimeSync() {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const enabled = isGSheetsEnabled();

  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      return;
    }

    // Immediately pull on mount / when sync is first enabled
    triggerManualSync(false).catch(() => {});

    const tick = () => {
      // Skip if tab is hidden — save bandwidth
      if (document.hidden) return;
      triggerManualSync(false).catch(() => {});
    };

    timerRef.current = setInterval(tick, POLL_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [enabled]);
}
