/**
 * Google Sheets Integration via Apps Script Web App
 *
 * Architecture:
 *  - A Google Apps Script "Web App" acts as a CORS-enabled proxy to the Google Sheet.
 *  - All reads/writes go through: POST/GET to the Apps Script URL.
 *  - localStorage is used as an offline cache; Sheets is the source of truth.
 *  - Writes are async (fire-and-forget) so the UI stays snappy.
 *
 * Sheet Structure (one tab per entity):
 *  Customers | Equipment | Rentals | Payments | Returns | Owners | Documents
 *
 * Each tab has a header row with field names, followed by data rows.
 */

import { toast } from "sonner";

const isBrowser = typeof window !== "undefined";

// ─── Config helpers ─────────────────────────────────────────────────────────

export function cleanGSheetsUrl(raw?: string | null): string {
  if (!raw) return "";
  let url = raw.trim();
  // Strip trailing slashes
  url = url.replace(/\/+$/, "");
  return url;
}

export function getDefaultGSheetsUrl(): string {
  return cleanGSheetsUrl(import.meta.env.VITE_GSHEETS_URL || "");
}

export function getDefaultGSheetsToken(): string {
  return (import.meta.env.VITE_GSHEETS_TOKEN || "").trim();
}

export function getGSheetsUrl(): string {
  if (!isBrowser) return "";
  const stored = cleanGSheetsUrl(localStorage.getItem("medirent-gsheets-url"));
  const envUrl = getDefaultGSheetsUrl();
  return stored || envUrl;
}

export function setGSheetsUrl(url: string) {
  if (!isBrowser) return;
  const cleaned = cleanGSheetsUrl(url);
  if (cleaned) {
    localStorage.setItem("medirent-gsheets-url", cleaned);
  } else {
    localStorage.removeItem("medirent-gsheets-url");
  }
}

export function isGSheetsEnabled(): boolean {
  const url = getGSheetsUrl();
  return !!url && url.startsWith("https://script.google.com/");
}

/** Shared-secret token sent with every Apps Script request. */
export function getGSheetsToken(): string {
  if (!isBrowser) return "";
  const stored = (localStorage.getItem("medirent-gsheets-token") || "").trim();
  const envToken = getDefaultGSheetsToken();
  return stored || envToken;
}

export function setGSheetsToken(token: string) {
  if (!isBrowser) return;
  const cleaned = token.trim();
  if (cleaned) {
    localStorage.setItem("medirent-gsheets-token", cleaned);
  } else {
    localStorage.removeItem("medirent-gsheets-token");
  }
}

// ─── Core request helper ─────────────────────────────────────────────────────

export async function sheetsRequest(
  action: string,
  payload?: Record<string, unknown>,
  timeoutMs?: number
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  let url = getGSheetsUrl();
  if (!url) return { success: false, error: "No Apps Script URL configured" };

  // A hung Apps Script call must not stall the write queue forever.
  const controller = timeoutMs && typeof AbortController !== "undefined" ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

  try {
    let response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action, token: getGSheetsToken(), ...payload }),
      signal: controller?.signal,
      credentials: "omit",
    });

    // Auto-fallback: if a custom URL stored in localStorage returned 404,
    // but the system has a valid default URL from env, automatically switch and recover.
    if (response.status === 404 && isBrowser) {
      const stored = cleanGSheetsUrl(localStorage.getItem("medirent-gsheets-url"));
      const defUrl = getDefaultGSheetsUrl();
      if (stored && defUrl && stored !== defUrl) {
        console.warn(`[GSheets] Stored URL (${stored}) returned 404. Falling back to default URL (${defUrl}).`);
        const fallbackRes = await fetch(defUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ action, token: getGSheetsToken(), ...payload }),
          signal: controller?.signal,
          credentials: "omit",
        });
        if (fallbackRes.ok) {
          localStorage.removeItem("medirent-gsheets-url");
          response = fallbackRes;
          url = defUrl;
        }
      }
    }

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`HTTP error 404 (Google returned 404. Check that 'Who has access' is set to 'Anyone' in Apps Script deployment)`);
      }
      throw new Error(`HTTP error ${response.status}`);
    }

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return {
        success: false,
        error: `Non-JSON response from Apps Script (likely an auth or deployment error): ${text.slice(0, 200)}`,
      };
    }

    if (data && data.error) {
      return { success: false, error: data.error };
    }

    return { success: true, data };
  } catch (err) {
    console.warn("[GSheets] Request failed:", err);
    if (controller?.signal.aborted) {
      return { success: false, error: `Request timed out after ${Math.round((timeoutMs || 0) / 1000)}s` };
    }
    return { 
      success: false, 
      error: err instanceof Error ? err.message : String(err)
    };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** For reads we need a GET with callback (JSONP-style via Apps Script doGet) */
async function sheetsGet(
  sheet: string,
  filter?: { key: string; value: string }
): Promise<{ success: boolean; data?: unknown[]; error?: string }> {
  let url = getGSheetsUrl();
  if (!url) return { success: false, error: "No Apps Script URL configured" };

  try {
    let getUrl = `${url}?action=getAll&sheet=${encodeURIComponent(sheet)}&token=${encodeURIComponent(getGSheetsToken())}`;
    if (filter) {
      getUrl += `&filterKey=${encodeURIComponent(filter.key)}&filterValue=${encodeURIComponent(filter.value)}`;
    }
    let response = await fetch(getUrl, { method: "GET", credentials: "omit" });

    // Auto-fallback on 404
    if (response.status === 404 && isBrowser) {
      const stored = cleanGSheetsUrl(localStorage.getItem("medirent-gsheets-url"));
      const defUrl = getDefaultGSheetsUrl();
      if (stored && defUrl && stored !== defUrl) {
        let fallbackUrl = `${defUrl}?action=getAll&sheet=${encodeURIComponent(sheet)}&token=${encodeURIComponent(getGSheetsToken())}`;
        if (filter) {
          fallbackUrl += `&filterKey=${encodeURIComponent(filter.key)}&filterValue=${encodeURIComponent(filter.value)}`;
        }
        const fallbackRes = await fetch(fallbackUrl, { method: "GET", credentials: "omit" });
        if (fallbackRes.ok) {
          localStorage.removeItem("medirent-gsheets-url");
          response = fallbackRes;
        }
      }
    }

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json = await response.json();
    return { success: true, data: json.data || [] };
  } catch (err) {
    console.warn("[GSheets] GET failed:", err);
    return { success: false, error: String(err) };
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

/** Test connectivity to the Apps Script Web App */
export async function testConnection(
  urlOverride?: string,
  tokenOverride?: string
): Promise<{
  ok: boolean;
  message: string;
}> {
  const url = cleanGSheetsUrl(urlOverride) || getGSheetsUrl();
  const token = (tokenOverride !== undefined ? tokenOverride.trim() : getGSheetsToken());
  if (!url) return { ok: false, message: "No URL configured" };
  if (!url.startsWith("https://script.google.com/")) {
    return { ok: false, message: "URL must start with https://script.google.com/" };
  }

  try {
    let testUrl = `${url}?action=ping&token=${encodeURIComponent(token)}`;
    let response = await fetch(testUrl, { method: "GET", credentials: "omit" });
    if (!response.ok) {
      if (response.status === 404) {
        return { ok: false, message: `HTTP 404: Google cannot reach this Web App (${url}). Ensure that under Deploy → Manage deployments in Apps Script: 'Who has access' is set to 'Anyone' and 'Execute as' is set to 'Me'.` };
      }
      throw new Error(`HTTP ${response.status}`);
    }
    const json = await response.json();
    if (json.status === "ok") {
      return { ok: true, message: `Connected! Sheet: "${json.sheetName || "Unknown"}" (version: ${json.version || "legacy"})` };
    }
    throw new Error(json.error || "Unknown error");
  } catch (err) {
    return { ok: false, message: `Connection failed: ${String(err)}` };
  }
}

export interface PendingSync {
  type: "upsert" | "delete";
  sheet: string;
  id: string;
  data?: any;
  /** When the latest local change for this row was queued. */
  timestamp: number;
  /** Unique per local change. A confirmation only clears the entry if the rev
   *  still matches, so an edit made while an older write was in flight is not
   *  mistakenly marked as saved. */
  rev?: string;
  /** Failed send attempts for this exact change (drives the backoff). */
  attempts?: number;
  /** Epoch ms before which this entry should not be re-sent. */
  nextRetryAt?: number;
  /** Last error from Apps Script / the network, shown to the user. */
  lastError?: string;
}

/** After this many failed attempts the user is warned (writes keep retrying). */
const WARN_AFTER_ATTEMPTS = 3;
/** Backoff between retries of the same change. The last value repeats forever —
 *  an unconfirmed write is NEVER dropped, because dropping it lets the next
 *  background pull overwrite the local record with the stale remote copy. */
const RETRY_DELAYS_MS = [10_000, 20_000, 45_000, 90_000, 180_000, 300_000, 600_000];
/** Rows sent in one bulkUpsert call. Apps Script serialises writes behind a
 *  script lock anyway, so one batched call beats N concurrent ones that queue
 *  on the lock and time out ("Server busy, please retry"). */
const BATCH_MAX_ROWS = 25;
const BATCH_MAX_CHARS = 400_000;
const WRITE_TIMEOUT_MS = 90_000;
const PENDING_KEY = "medirent-pending-syncs";

export interface DeletedRecord {
  sheet: string;
  id: string;
  timestamp: number;
}

export function getDeletedRecords(): DeletedRecord[] {
  if (!isBrowser) return [];
  try {
    const list = JSON.parse(localStorage.getItem("medirent-deleted-records") || "[]");
    const now = Date.now();
    // Keep tombstones for 30 days to avoid stale remote resurrection
    const fresh = list.filter((r: DeletedRecord) => now - r.timestamp < 30 * 24 * 60 * 60 * 1000);
    if (fresh.length !== list.length) {
      localStorage.setItem("medirent-deleted-records", JSON.stringify(fresh));
    }
    return fresh;
  } catch {
    return [];
  }
}

export function recordDeletedId(sheet: string, id: string) {
  if (!isBrowser || !id) return;
  const records = getDeletedRecords();
  const strId = String(id);
  const filtered = records.filter((r) => !(r.sheet === sheet && String(r.id) === strId));
  filtered.push({
    sheet,
    id: strId,
    timestamp: Date.now(),
  });
  localStorage.setItem("medirent-deleted-records", JSON.stringify(filtered));
}

export function isRecordDeleted(sheet: string, id: string): boolean {
  if (!isBrowser || !id) return false;
  const records = getDeletedRecords();
  const strId = String(id);
  return records.some((r) => r.sheet === sheet && String(r.id) === strId);
}

export function clearDeletedRecord(sheet: string, id: string) {
  if (!isBrowser || !id) return;
  const records = getDeletedRecords();
  const strId = String(id);
  const filtered = records.filter((r) => !(r.sheet === sheet && String(r.id) === strId));
  localStorage.setItem("medirent-deleted-records", JSON.stringify(filtered));
}

// ─── Durable write queue ────────────────────────────────────────────────────
//
// Every local change is first recorded in `medirent-pending-syncs` and only
// removed once Apps Script confirms it. While an entry exists, the background
// pull (syncFromSheetsToLocalStorage) overlays it on top of the remote rows,
// so an unsaved payment/return can never be wiped by a pull.
//
// A single worker drains the queue one request at a time, batching fresh
// upserts for the same tab into one bulkUpsert call. Failed changes back off
// and are retried individually (so one bad row can't block a whole batch),
// and they are retried forever — never silently dropped.

/** If localStorage is full we keep the queue in memory so the current tab can
 *  still deliver the writes; the user is warned not to close the tab. */
let memoryPending: PendingSync[] | null = null;
let lastStorageWarnAt = 0;
let lastFailureWarnAt = 0;

function newRev(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function changeToken(s: PendingSync): string {
  return s.rev ?? `t${s.timestamp}`;
}

function sameChange(a: PendingSync, b: PendingSync): boolean {
  return a.sheet === b.sheet && String(a.id) === String(b.id) && changeToken(a) === changeToken(b);
}

export function getPendingSyncs(): PendingSync[] {
  if (!isBrowser) return [];
  if (memoryPending) return memoryPending;
  try {
    const list = JSON.parse(localStorage.getItem(PENDING_KEY) || "[]");
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function setPendingSyncs(syncs: PendingSync[]) {
  if (!isBrowser) return;
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify(syncs));
    memoryPending = null;
  } catch (e) {
    // Never let a full localStorage throw out of a save (it would roll back
    // the user's payment/return transaction). Keep the queue in memory.
    memoryPending = syncs;
    console.error("[GSheets] Could not persist pending writes to localStorage:", e);
    if (Date.now() - lastStorageWarnAt > 5 * 60_000) {
      lastStorageWarnAt = Date.now();
      toast.warning(
        "Device storage is full. Unsaved changes are being sent to Google Sheets — keep this tab open until the sync badge shows all saved.",
        { duration: 12000 }
      );
    }
  }
  emitSyncStatus();
}

export function addPendingSync(
  type: "upsert" | "delete",
  sheet: string,
  id: string,
  data?: any,
  attempts?: number
) {
  const strId = String(id);
  const syncs = getPendingSyncs();
  const filtered = syncs.filter((s) => !(s.sheet === sheet && String(s.id) === strId));
  filtered.push({
    type,
    sheet,
    id: strId,
    data,
    timestamp: Date.now(),
    rev: newRev(),
    attempts: attempts ?? 0,
  });
  setPendingSyncs(filtered);
}

export function removePendingSync(sheet: string, id: string) {
  const strId = String(id);
  const syncs = getPendingSyncs();
  const filtered = syncs.filter((s) => !(s.sheet === sheet && String(s.id) === strId));
  if (filtered.length !== syncs.length) setPendingSyncs(filtered);
}

/** Remove only the exact changes that were confirmed (a newer edit to the same
 *  row made while the request was in flight stays queued). */
function clearConfirmed(confirmed: PendingSync[]) {
  const syncs = getPendingSyncs();
  const filtered = syncs.filter((s) => !confirmed.some((c) => sameChange(s, c)));
  if (filtered.length !== syncs.length) setPendingSyncs(filtered);
}

function markFailed(failed: PendingSync[], error: string) {
  const now = Date.now();
  const syncs = getPendingSyncs().map((s) => {
    if (!failed.some((f) => sameChange(s, f))) return s;
    const attempts = (s.attempts ?? 0) + 1;
    const delay = RETRY_DELAYS_MS[Math.min(attempts - 1, RETRY_DELAYS_MS.length - 1)];
    return { ...s, attempts, lastError: error, nextRetryAt: now + delay };
  });
  setPendingSyncs(syncs);

  const stuck = syncs.filter((s) => (s.attempts ?? 0) >= WARN_AFTER_ATTEMPTS);
  if (stuck.length > 0 && now - lastFailureWarnAt > 5 * 60_000) {
    lastFailureWarnAt = now;
    console.error(`[GSheets] ${stuck.length} write(s) still not confirmed. Last error:`, error, stuck);
    toast.warning(
      `${stuck.length} change${stuck.length === 1 ? " is" : "s are"} not yet saved to Google Sheets. ` +
        `${stuck.length === 1 ? "It is" : "They are"} safe on this device and will keep retrying automatically. Last error: ${error.slice(0, 140)}`,
      { duration: 12000 }
    );
  }
}

function stripFileData(row: any) {
  if (row && row.fileData) {
    const { fileData, ...rest } = row;
    return rest;
  }
  return row;
}

function approxSize(row: unknown): number {
  try {
    return JSON.stringify(row ?? null).length;
  } catch {
    return 10_000;
  }
}

// ── Sync status (for the header badge) ──

export interface SyncStatus {
  pending: number;
  failing: number;
  syncing: boolean;
  lastError?: string;
}

let flushing = false;
let flushAgain = false;
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let retryTimerAt = 0;

export function getSyncStatus(): SyncStatus {
  const syncs = getPendingSyncs();
  const failingList = syncs.filter((s) => (s.attempts ?? 0) > 0);
  const latestErr = failingList.reduce<PendingSync | null>(
    (acc, s) => (!acc || s.timestamp > acc.timestamp ? s : acc),
    null
  );
  return {
    pending: syncs.length,
    failing: failingList.length,
    syncing: flushing,
    lastError: latestErr?.lastError,
  };
}

let emitScheduled = false;
function emitSyncStatus() {
  if (!isBrowser || emitScheduled) return;
  // Coalesced: bulk operations queue hundreds of rows in one tick.
  emitScheduled = true;
  setTimeout(() => {
    emitScheduled = false;
    try {
      window.dispatchEvent(new CustomEvent("medirent-sync-status", { detail: getSyncStatus() }));
    } catch {
      /* ignore */
    }
  }, 50);
}

// ── Worker ──

function scheduleFlush(delayMs = 400) {
  if (!isBrowser || !isGSheetsEnabled()) return;
  if (flushing) {
    flushAgain = true;
    return;
  }
  if (flushTimer !== null) return;
  // Small debounce so the 6-10 rows written by one save (e.g. a return) are
  // coalesced into a batch instead of racing each other on the script lock.
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flushPendingSyncs();
  }, delayMs);
}

/** Arm a timer for the earliest backed-off entry so retries happen even when
 *  the 15s background pull keeps being skipped because the user is busy. */
function scheduleRetryTimer() {
  if (!isBrowser) return;
  const next = getPendingSyncs()
    .map((s) => s.nextRetryAt ?? 0)
    .filter((t) => t > 0)
    .sort((a, b) => a - b)[0];
  if (!next) return;
  if (retryTimer !== null && retryTimerAt <= next) return;
  if (retryTimer !== null) clearTimeout(retryTimer);
  retryTimerAt = next;
  retryTimer = setTimeout(() => {
    retryTimer = null;
    retryTimerAt = 0;
    scheduleFlush(0);
  }, Math.max(0, next - Date.now()) + 50);
}

function pickNextBatch(now: number): PendingSync[] | null {
  let syncs = getPendingSyncs();

  // An upsert without a row can never be sent — drop it rather than loop.
  const invalid = syncs.filter((s) => s.type === "upsert" && !s.data);
  if (invalid.length > 0) {
    syncs = syncs.filter((s) => !invalid.includes(s));
    setPendingSyncs(syncs);
  }

  const due = syncs
    .filter((s) => !s.nextRetryAt || s.nextRetryAt <= now)
    .sort((a, b) => a.timestamp - b.timestamp);
  if (due.length === 0) return null;

  const first = due[0];
  // Deletes and previously-failed changes go one at a time, so a single row
  // the sheet rejects (e.g. a cell over 50,000 chars) can't block the rest.
  if (first.type === "delete" || (first.attempts ?? 0) > 0) return [first];

  const batch = [first];
  let chars = approxSize(first.data);
  for (const s of due.slice(1)) {
    if (batch.length >= BATCH_MAX_ROWS) break;
    if (s.type !== "upsert" || s.sheet !== first.sheet || (s.attempts ?? 0) > 0) continue;
    const size = approxSize(s.data);
    if (chars + size > BATCH_MAX_CHARS) break;
    batch.push(s);
    chars += size;
  }
  return batch;
}

async function sendBatch(batch: PendingSync[]) {
  const first = batch[0];
  let res: { success: boolean; error?: string };
  try {
    if (first.type === "delete") {
      res = await sheetsRequest("delete", { sheet: first.sheet, id: first.id }, WRITE_TIMEOUT_MS);
    } else if (batch.length === 1) {
      res = await sheetsRequest("upsert", { sheet: first.sheet, row: stripFileData(first.data) }, WRITE_TIMEOUT_MS);
    } else {
      res = await sheetsRequest(
        "bulkUpsert",
        { sheet: first.sheet, rows: batch.map((b) => stripFileData(b.data)) },
        WRITE_TIMEOUT_MS
      );
    }
  } catch (err) {
    res = { success: false, error: err instanceof Error ? err.message : String(err) };
  }

  if (res.success) {
    clearConfirmed(batch);
  } else {
    console.warn(`[GSheets] Write failed for ${batch.length} row(s) in ${first.sheet}:`, res.error);
    markFailed(batch, res.error || "Unknown error");
  }
}

/** Drain the pending-write queue (one request at a time). Safe to call often. */
export async function flushPendingSyncs(): Promise<void> {
  if (!isBrowser || !isGSheetsEnabled()) return;
  if (flushing) {
    flushAgain = true;
    return;
  }
  flushing = true;
  emitSyncStatus();
  try {
    for (let guard = 0; guard < 1000; guard++) {
      if (typeof navigator !== "undefined" && navigator.onLine === false) break;
      const batch = pickNextBatch(Date.now());
      if (!batch) break;
      await sendBatch(batch);
    }
  } finally {
    flushing = false;
    emitSyncStatus();
    if (flushAgain) {
      flushAgain = false;
      scheduleFlush(0);
    }
    scheduleRetryTimer();
  }
}

/** Manual "retry now": ignore backoff and push everything still pending. */
export async function retryPendingSyncsNow(): Promise<SyncStatus> {
  const syncs = getPendingSyncs();
  if (syncs.some((s) => s.nextRetryAt)) {
    setPendingSyncs(syncs.map((s) => ({ ...s, nextRetryAt: undefined })));
  }
  await flushPendingSyncs();
  // If a flush was already running, wait for it to pick up the reset entries.
  for (let i = 0; i < 600 && flushing; i++) {
    await new Promise((r) => setTimeout(r, 100));
  }
  return getSyncStatus();
}

/** Called by every background pull. Pending writes are never discarded any
 *  more (that is what erased unsaved payments/returns) — this just makes sure
 *  the queue is draining. Name kept for compatibility with existing callers. */
export function cleanStalePendingSyncs() {
  scheduleFlush(0);
}

/** Queue a row upsert (insert or update by id field). Returns immediately; the
 *  write is delivered by the queue worker and retried until confirmed.
 *  `attempts` is accepted for backwards compatibility. */
export function syncRowToSheet(sheet: string, row: Record<string, unknown>, attempts = 0) {
  if (!row || !row.id) return;
  const id = String(row.id);

  // Clear any tombstone if an item with this ID is intentionally saved
  clearDeletedRecord(sheet, id);

  // Durable record first — this is what protects the row from being
  // overwritten by a background pull until Sheets confirms it.
  addPendingSync("upsert", sheet, id, row, attempts);
  scheduleFlush();
}

/** Queue a row delete by id */
export function deleteRowFromSheet(sheet: string, id: string, attempts = 0) {
  if (!id) return;
  const strId = String(id);

  // Record tombstone persistently so background sync never restores it
  recordDeletedId(sheet, strId);

  addPendingSync("delete", sheet, strId, undefined, attempts);
  scheduleFlush();
}

if (isBrowser) {
  // Resume as soon as the connection comes back, and pick up anything left
  // over from a previous session (tab closed before the write confirmed).
  window.addEventListener("online", () => scheduleFlush(0));
  setTimeout(() => scheduleFlush(0), 3000);
}

/** Bulk push all localStorage data to Sheets */
export async function syncAllToSheets(
  allData: Record<string, unknown[]>
): Promise<{ success: boolean; sheetsWritten: string[]; errors: string[] }> {
  let url = getGSheetsUrl();
  if (!url) return { success: false, sheetsWritten: [], errors: ["No URL configured"] };

  const sheetsWritten: string[] = [];
  const errors: string[] = [];

  // Snapshot the queue: a full push writes every local row, so any upsert that
  // was pending for a tab that pushes successfully is now confirmed.
  const pendingSnapshot = getPendingSyncs().filter((s) => s.type === "upsert");

  const cleanedData = { ...allData };
  for (const sheetName of Object.keys(cleanedData)) {
    cleanedData[sheetName] = cleanedData[sheetName].map((row: any) => {
      if (row && row.fileData) {
        const { fileData, ...rest } = row;
        return rest;
      }
      return row;
    });
  }

  for (const [sheet, rows] of Object.entries(cleanedData)) {
    try {
      let response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "bulkUpsert", sheet, rows, token: getGSheetsToken() }),
        credentials: "omit",
      });
      
      if (response.status === 404 && isBrowser) {
        const stored = cleanGSheetsUrl(localStorage.getItem("medirent-gsheets-url"));
        const defUrl = getDefaultGSheetsUrl();
        if (stored && defUrl && stored !== defUrl) {
          const fallbackRes = await fetch(defUrl, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({ action: "bulkUpsert", sheet, rows, token: getGSheetsToken() }),
            credentials: "omit",
          });
          if (fallbackRes.ok) {
            localStorage.removeItem("medirent-gsheets-url");
            response = fallbackRes;
            url = defUrl;
          }
        }
      }

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        // An HTML body here means the request never reached the script (auth
        // interstitial, deployment error). Counting it as written would report
        // a successful bulk sync that wrote nothing.
        throw new Error(
          `Non-JSON response from Apps Script (likely an auth or deployment error): ${text.slice(0, 200)}`
        );
      }

      if (data && data.error) {
        throw new Error(data.error);
      }

      sheetsWritten.push(sheet);
      clearConfirmed(pendingSnapshot.filter((s) => s.sheet === sheet));
    } catch (err) {
      errors.push(`${sheet}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return { success: errors.length === 0, sheetsWritten, errors };
}

/** Read all rows from a specific sheet tab, optionally filtered server-side
 *  by an exact key/value match (avoids downloading an entire ever-growing
 *  tab — e.g. FileChunks — just to find rows for one id). */
export async function readSheetData(
  sheet: string,
  filter?: { key: string; value: string }
): Promise<unknown[] | null> {
  const result = await sheetsGet(sheet, filter);
  if (!result.success) {
    console.warn(`[GSheets] Failed to read sheet data for ${sheet}:`, result.error);
    return null;
  }
  const data = result.data || [];
  
  // Parse any stringified JSON arrays or objects back to normal JS entities
  return data.map((row: any) => {
    const parsedRow = { ...row };
    for (const key of Object.keys(parsedRow)) {
      const val = parsedRow[key];
      if (typeof val === "string") {
        const trimmed = val.trim();
        if ((trimmed.startsWith("[") && trimmed.endsWith("]")) || (trimmed.startsWith("{") && trimmed.endsWith("}"))) {
          try {
            parsedRow[key] = JSON.parse(trimmed);
          } catch (e) {
            // Keep original string if JSON parsing fails
          }
        }
      }
    }
    return parsedRow;
  });
}

// ─── Sheet names (match the Apps Script tab names) ──────────────────────────

export const SHEETS = {
  CUSTOMERS: "Customers",
  EQUIPMENT: "Equipment",
  RENTALS: "Rentals",
  PAYMENTS: "Payments",
  RETURNS: "Returns",
  OWNERS: "Owners",
  DOCUMENTS: "Documents",
  EXCHANGES: "Exchanges",
  FILE_CHUNKS: "FileChunks",
  STAFF: "Staff",
  SETTINGS: "Settings",
} as const;

/** Send OTP verification code to a user's email via GET (avoids CORS redirect issue with POST) */
export async function sendOtpEmail(email: string, otp: string): Promise<{ success: boolean; error?: string }> {
  const url = getGSheetsUrl();
  if (!url) return { success: false, error: "No Apps Script URL configured" };

  try {
    const getUrl = `${url}?action=sendOtp&email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp)}&token=${encodeURIComponent(getGSheetsToken())}`;
    const response = await fetch(getUrl, { method: "GET", credentials: "omit" });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const text = await response.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      // Reporting success here advanced the user to the OTP step to wait for a
      // code that was never sent — an HTML body means the script did not run.
      return {
        success: false,
        error: `Non-JSON response from Apps Script (likely an auth or deployment error): ${text.slice(0, 200)}`,
      };
    }

    if (data && data.error) {
      return { success: false, error: data.error };
    }

    return { success: true };
  } catch (err) {
    console.warn("[GSheets] sendOtpEmail failed:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}


/** Clear all data rows in a sheet (keeping headers) */
export async function clearSheetInGSheets(sheet: string): Promise<{ success: boolean; error?: string }> {
  const res = await sheetsRequest("clearSheet", { sheet });
  return { success: res.success, error: res.error };
}
