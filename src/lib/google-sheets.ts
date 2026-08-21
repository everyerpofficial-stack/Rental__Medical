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

export function getGSheetsUrl(): string {
  if (!isBrowser) return "";
  // Priority: localStorage (user-saved) → build-time env var → empty (forces user to configure)
  // ⚠️  No hardcoded fallback URL — the URL must be configured explicitly to protect the database.
  //     A literal here ships to every visitor in the client bundle and grants full
  //     read/write/delete access to the spreadsheet. Configure via Settings → Database
  //     or VITE_GSHEETS_URL instead.
  return localStorage.getItem("medirent-gsheets-url") || import.meta.env.VITE_GSHEETS_URL || "";
}

export function setGSheetsUrl(url: string) {
  if (isBrowser) localStorage.setItem("medirent-gsheets-url", url);
}

export function isGSheetsEnabled(): boolean {
  const url = getGSheetsUrl();
  return !!url && url.startsWith("https://script.google.com/");
}

/** Shared-secret token sent with every Apps Script request. The Apps Script
 *  rejects requests whose token doesn't match its own TOKEN constant.
 *  This doesn't make the endpoint fully private (it still ships to the
 *  browser bundle like the URL above), but it blocks opportunistic/automated
 *  access to a leaked or scanned Apps Script URL. Rotate it by changing the
 *  TOKEN constant in Code.gs and re-saving it here (or via Settings). */
export function getGSheetsToken(): string {
  if (!isBrowser) return "";
  return localStorage.getItem("medirent-gsheets-token") || import.meta.env.VITE_GSHEETS_TOKEN || "";
}

export function setGSheetsToken(token: string) {
  if (isBrowser) localStorage.setItem("medirent-gsheets-token", token);
}

// ─── Core request helper ─────────────────────────────────────────────────────

export async function sheetsRequest(
  action: string,
  payload?: Record<string, unknown>
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  const url = getGSheetsUrl();
  if (!url) return { success: false, error: "No Apps Script URL configured" };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action, token: getGSheetsToken(), ...payload }),
      keepalive: true,
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      // Apps Script answers with an HTML page — not JSON — when the deployment
      // isn't shared publicly, when the script threw, or when Google serves a
      // sign-in interstitial. Treating that as success made syncRowToSheet drop
      // the pending-write guard for a row that was never written, so the next
      // pull silently replaced the local record with the stale remote one.
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
    return { 
      success: false, 
      error: err instanceof Error ? err.message : String(err)
    };
  }
}

/** For reads we need a GET with callback (JSONP-style via Apps Script doGet) */
async function sheetsGet(
  sheet: string,
  filter?: { key: string; value: string }
): Promise<{ success: boolean; data?: unknown[]; error?: string }> {
  const url = getGSheetsUrl();
  if (!url) return { success: false, error: "No Apps Script URL configured" };

  try {
    let getUrl = `${url}?action=getAll&sheet=${encodeURIComponent(sheet)}&token=${encodeURIComponent(getGSheetsToken())}`;
    if (filter) {
      getUrl += `&filterKey=${encodeURIComponent(filter.key)}&filterValue=${encodeURIComponent(filter.value)}`;
    }
    const response = await fetch(getUrl, { method: "GET" });
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
export async function testConnection(): Promise<{
  ok: boolean;
  message: string;
}> {
  const url = getGSheetsUrl();
  if (!url) return { ok: false, message: "No URL configured" };
  if (!url.startsWith("https://script.google.com/")) {
    return { ok: false, message: "URL must start with https://script.google.com/" };
  }

  try {
    const testUrl = `${url}?action=ping&token=${encodeURIComponent(getGSheetsToken())}`;
    const response = await fetch(testUrl, { method: "GET" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json = await response.json();
    if (json.status === "ok") {
      return { ok: true, message: `Connected! Sheet: "${json.sheetName || "Unknown"}"` };
    }
    throw new Error(json.error || "Unknown error");
  } catch (err) {
    return { ok: false, message: `Connection failed: ${String(err)}` };
  }
}

interface PendingSync {
  type: "upsert" | "delete";
  sheet: string;
  id: string;
  data?: any;
  timestamp: number;
  /** How many times this write has been re-issued by cleanStalePendingSyncs.
   *  Capped so a permanently-failing write stops being re-POSTed forever. */
  attempts?: number;
}

/** Give up on a pending write after this many retries and tell the user, rather
 *  than re-POSTing it on every 15s sync cycle for the lifetime of the tab. */
const MAX_SYNC_ATTEMPTS = 5;

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

export function getPendingSyncs(): PendingSync[] {
  if (!isBrowser) return [];
  try {
    return JSON.parse(localStorage.getItem("medirent-pending-syncs") || "[]");
  } catch {
    return [];
  }
}

function setPendingSyncs(syncs: PendingSync[]) {
  if (isBrowser) {
    localStorage.setItem("medirent-pending-syncs", JSON.stringify(syncs));
  }
}

export function addPendingSync(
  type: "upsert" | "delete",
  sheet: string,
  id: string,
  data?: any,
  attempts?: number
) {
  const syncs = getPendingSyncs();
  const filtered = syncs.filter((s) => !(s.sheet === sheet && s.id === id));
  filtered.push({
    type,
    sheet,
    id,
    data,
    timestamp: Date.now(),
    // Carry the retry count forward when this entry is a re-issue, so the
    // ceiling in cleanStalePendingSyncs is actually reachable.
    attempts: attempts ?? 0,
  });
  setPendingSyncs(filtered);
}

export function removePendingSync(sheet: string, id: string) {
  const syncs = getPendingSyncs();
  const filtered = syncs.filter((s) => !(s.sheet === sheet && s.id === id));
  setPendingSyncs(filtered);
}

export function cleanStalePendingSyncs() {
  const syncs = getPendingSyncs();
  const now = Date.now();
  const stale = syncs.filter((s) => now - s.timestamp >= 120000); // 2 minutes timeout
  const fresh = syncs.filter((s) => now - s.timestamp < 120000);
  setPendingSyncs(fresh);

  // Retry stale pending writes instead of just dropping protection for them.
  // If we silently forgot an unconfirmed change (e.g. the write to Sheets
  // failed or the deployment URL/spreadsheet was misconfigured), the next
  // background pull would overwrite the local value with the old remote row —
  // e.g. an approved rental flipping back to "Pending Approval" over and over.
  // Re-issuing the write re-registers a fresh pending entry, so local state
  // stays protected until the write actually confirms.
  //
  // The retry is bounded: a write that can never succeed (revoked token, bad
  // deployment URL, sustained rate limiting) used to be re-POSTed on every sync
  // cycle forever, which is itself a way to exhaust the Apps Script quota.
  const retryable = stale.filter((s) => (s.attempts ?? 0) < MAX_SYNC_ATTEMPTS);
  const exhausted = stale.filter((s) => (s.attempts ?? 0) >= MAX_SYNC_ATTEMPTS);

  if (exhausted.length > 0) {
    console.error(
      `[GSheets] Giving up on ${exhausted.length} write(s) after ${MAX_SYNC_ATTEMPTS} attempts:`,
      exhausted
    );
    toast.error(
      `${exhausted.length} change${exhausted.length === 1 ? "" : "s"} could not be saved to Google Sheets. ` +
        `They are still on this device — check Settings → Database and re-sync.`,
      { duration: 12000 }
    );
  }

  for (const s of retryable) {
    const nextAttempt = (s.attempts ?? 0) + 1;
    if (s.type === "upsert" && s.data) {
      syncRowToSheet(s.sheet, s.data, nextAttempt);
    } else if (s.type === "delete") {
      deleteRowFromSheet(s.sheet, s.id, nextAttempt);
    }
  }
}

/** Write a single row upsert (insert or update by id field).
 *  `attempts` is set only by cleanStalePendingSyncs when re-issuing a stuck
 *  write, so the retry ceiling survives the re-registration. */
export function syncRowToSheet(sheet: string, row: Record<string, unknown>, attempts = 0) {
  if (!row || !row.id) return;
  const id = String(row.id);

  // Clear any tombstone if an item with this ID is intentionally saved
  clearDeletedRecord(sheet, id);

  // Track this locally as a pending upsert
  addPendingSync("upsert", sheet, id, row, attempts);

  // Fire and forget – don't block UI
  let cleanRow = row;
  if (row && row.fileData) {
    const { fileData, ...rest } = row;
    cleanRow = rest;
  }
  sheetsRequest("upsert", { sheet, row: cleanRow })
    .then((res) => {
      if (res.success) {
        removePendingSync(sheet, id);
      }
    })
    .catch((err) => {
      console.warn(`[GSheets] Upsert sync failed for ${sheet}/${id}:`, err);
    });
}

/** Delete a row from a sheet by id */
export function deleteRowFromSheet(sheet: string, id: string, attempts = 0) {
  if (!id) return;
  const strId = String(id);

  // Record tombstone persistently so background sync never restores it
  recordDeletedId(sheet, strId);

  // Track this locally as a pending delete
  addPendingSync("delete", sheet, strId, undefined, attempts);

  sheetsRequest("delete", { sheet, id: strId })
    .then((res) => {
      if (res.success) {
        removePendingSync(sheet, strId);
      }
    })
    .catch((err) => {
      console.warn(`[GSheets] Delete sync failed for ${sheet}/${strId}:`, err);
    });
}

/** Bulk push all localStorage data to Sheets */
export async function syncAllToSheets(
  allData: Record<string, unknown[]>
): Promise<{ success: boolean; sheetsWritten: string[]; errors: string[] }> {
  const url = getGSheetsUrl();
  if (!url) return { success: false, sheetsWritten: [], errors: ["No URL configured"] };

  const sheetsWritten: string[] = [];
  const errors: string[] = [];

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
      // For bulk sync we use a direct POST with all rows
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "bulkUpsert", sheet, rows, token: getGSheetsToken() }),
      });
      
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
  INCOME_EXPENSES: "IncomeExpenses",
} as const;

/** Send OTP verification code to a user's email via GET (avoids CORS redirect issue with POST) */
export async function sendOtpEmail(email: string, otp: string): Promise<{ success: boolean; error?: string }> {
  const url = getGSheetsUrl();
  if (!url) return { success: false, error: "No Apps Script URL configured" };

  try {
    const getUrl = `${url}?action=sendOtp&email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp)}&token=${encodeURIComponent(getGSheetsToken())}`;
    const response = await fetch(getUrl, { method: "GET" });

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
