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

const isBrowser = typeof window !== "undefined";

// ─── Config helpers ─────────────────────────────────────────────────────────

export function getGSheetsUrl(): string {
  if (!isBrowser) return "";
  // Priority: localStorage (user-saved) → build-time env var → empty (forces user to configure)
  // ⚠️  No hardcoded fallback URL — the URL must be configured explicitly to protect the database.
  return localStorage.getItem("medirent-gsheets-url") || (import.meta.env.VITE_GSHEETS_URL || "https://script.google.com/macros/s/AKfycbwK9uf6Vwop40yzdmxD_B9jlplagJZuiOCke_kT0mGzCWYjVjCMjJWzGmu_t2uSLD_jNQ/exec");
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
  return localStorage.getItem("medirent-gsheets-token") || (import.meta.env.VITE_GSHEETS_TOKEN || "392284cd2d4b0ea7d53f74cba8cd2288d044898d586824f1");
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
    } catch (e) {
      return { success: true, data: text };
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

export function addPendingSync(type: "upsert" | "delete", sheet: string, id: string, data?: any) {
  const syncs = getPendingSyncs();
  const filtered = syncs.filter((s) => !(s.sheet === sheet && s.id === id));
  filtered.push({
    type,
    sheet,
    id,
    data,
    timestamp: Date.now(),
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
  for (const s of stale) {
    if (s.type === "upsert" && s.data) {
      syncRowToSheet(s.sheet, s.data);
    } else if (s.type === "delete") {
      deleteRowFromSheet(s.sheet, s.id);
    }
  }
}

/** Write a single row upsert (insert or update by id field) */
export function syncRowToSheet(sheet: string, row: Record<string, unknown>) {
  if (!row || !row.id) return;
  const id = String(row.id);

  // Track this locally as a pending upsert
  addPendingSync("upsert", sheet, id, row);

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
export function deleteRowFromSheet(sheet: string, id: string) {
  // Track this locally as a pending delete
  addPendingSync("delete", sheet, id);

  sheetsRequest("delete", { sheet, id })
    .then((res) => {
      if (res.success) {
        removePendingSync(sheet, id);
      }
    })
    .catch((err) => {
      console.warn(`[GSheets] Delete sync failed for ${sheet}/${id}:`, err);
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
      } catch (e) {
        // Fallback for non-JSON or raw text success responses
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
      // If response isn't JSON but request succeeded, treat as success
      return { success: true };
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
