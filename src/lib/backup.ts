/**
 * backup.ts — ITEM-1: everyday data backup.
 *
 * The whole ERP lives in localStorage, which a browser can clear without
 * warning (storage pressure, "clear site data", a reinstalled profile). This
 * module makes a full snapshot cheap to take, easy to keep, and safe to
 * restore:
 *
 *   - `downloadBackupJSON()` / `downloadBackupCSV()` — manual, on demand.
 *   - `runDailyBackupCheck()` — once per calendar day, quietly keeps a snapshot
 *     in localStorage and reports whether today's download is still pending.
 *   - `restoreFromBackup()` — puts a snapshot back, after the caller has
 *     confirmed with the user.
 *
 * Deliberately *not* included: the base64 file blobs for KYC documents. Those
 * live in IndexedDB and routinely run to several MB each; folding them into a
 * localStorage-resident snapshot is the fastest way to hit the storage quota
 * and break the very thing this is meant to protect. Document *records* are
 * backed up, so a restore knows what existed and which customer it belonged to.
 */

import { toast } from "sonner";

/** Storage keys that make up a complete snapshot of the database. */
export const BACKUP_KEYS = [
  "medirent-customers",
  "medirent-equipment",
  "medirent-rentals",
  "medirent-payments",
  "medirent-returns",
  "medirent-owners",
  "medirent-documents",
  "medirent-exchanges",
  "medirent-income-expenses",
  "medirent-staff-users",
  "medirent-company-settings",
] as const;

/**
 * Counter keys — restoring these prevents a restored database from reissuing
 * IDs it has already handed out.
 *
 * The sequence counters are named `medirent-<entity>-counter`, some with a
 * suffix: `medirent-cus-counter`, `medirent-pay-counter`, `medirent-ret-counter`,
 * `medirent-own-counter`, `medirent-agr-counter-<year>`,
 * `medirent-exc-counter-<year>`, `medirent-eq-counter-<category-prefix>`.
 * Matching the shape rather than listing them keeps per-year and per-category
 * counters included automatically.
 */
const COUNTER_KEY_PATTERN = /^medirent-[a-z]+-counter(-.+)?$/;

const LAST_BACKUP_DATE_KEY = "medirent-last-backup-date";
const SNAPSHOT_KEY = "medirent-backup-snapshot";
const SNAPSHOT_HISTORY_KEY = "medirent-backup-history";

/** How many auto-snapshots to keep. Each is a full copy of the database, so
 *  this is a deliberate trade against the same 5–10 MB quota it protects. */
const MAX_HISTORY = 3;

export const BACKUP_FORMAT_VERSION = 1;

export interface BackupSnapshot {
  formatVersion: number;
  createdAt: string;
  /** Local calendar date (YYYY-MM-DD) the snapshot was taken on. */
  createdDate: string;
  appName: string;
  /** Row counts per entity — lets a restore dialog say what it is about to write. */
  counts: Record<string, number>;
  data: Record<string, unknown>;
}

const isBrowser = () => typeof window !== "undefined";

/** Local calendar date as YYYY-MM-DD (never UTC — a backup "day" is the
 *  operator's day, and in IST a UTC date rolls over at 5:30 AM). */
function localDate(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Every counter key currently in localStorage. */
function counterKeys(): string[] {
  if (!isBrowser()) return [];
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && COUNTER_KEY_PATTERN.test(key)) {
      keys.push(key);
    }
  }
  return keys;
}

function readJSON(key: string): unknown {
  const raw = localStorage.getItem(key);
  if (raw === null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    // A counter is a bare number string, not JSON — keep it as-is.
    return raw;
  }
}

/** Builds a full snapshot of the database from localStorage. */
export function createBackupSnapshot(): BackupSnapshot {
  const data: Record<string, unknown> = {};
  const counts: Record<string, number> = {};

  if (isBrowser()) {
    for (const key of BACKUP_KEYS) {
      const value = readJSON(key);
      if (value === null) continue;
      data[key] = value;
      if (Array.isArray(value)) {
        counts[key.replace("medirent-", "")] = value.length;
      }
    }
    // Counters travel with the data so a restored database keeps issuing new
    // IDs rather than colliding with ones already in the restored rows.
    for (const key of counterKeys()) {
      data[key] = readJSON(key);
    }
  }

  const now = new Date();
  return {
    formatVersion: BACKUP_FORMAT_VERSION,
    createdAt: now.toISOString(),
    createdDate: localDate(now),
    appName: "Relife ERP",
    counts,
    data,
  };
}

/** Total rows across all entities in a snapshot. */
export function snapshotRowCount(snapshot: BackupSnapshot): number {
  return Object.values(snapshot.counts || {}).reduce((sum, n) => sum + (Number(n) || 0), 0);
}

function triggerDownload(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Revoke on the next tick — revoking synchronously can cancel the download
  // in some browsers before it has started reading the blob.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Marks today as backed up, so the daily prompt stops asking. */
export function markBackedUpToday() {
  if (!isBrowser()) return;
  localStorage.setItem(LAST_BACKUP_DATE_KEY, localDate());
}

export function getLastBackupDate(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(LAST_BACKUP_DATE_KEY);
}

/** Downloads the full database as a single JSON file. */
export function downloadBackupJSON(): BackupSnapshot {
  const snapshot = createBackupSnapshot();
  const stamp = snapshot.createdDate;
  triggerDownload(
    `relife-erp-backup-${stamp}.json`,
    JSON.stringify(snapshot, null, 2),
    "application/json",
  );
  markBackedUpToday();
  return snapshot;
}

/** Escapes a value for CSV: quote it and double any embedded quotes. */
function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '""';
  const asText = typeof value === "object" ? JSON.stringify(value) : String(value);
  return `"${asText.replace(/"/g, '""')}"`;
}

/**
 * Renders one entity array as CSV. The column set is the union of every row's
 * keys, so a row that carries an extra field does not silently lose it.
 */
function toCSV(rows: unknown[]): string {
  if (!Array.isArray(rows) || rows.length === 0) return "";
  const columns: string[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    if (row && typeof row === "object") {
      for (const key of Object.keys(row as Record<string, unknown>)) {
        if (!seen.has(key)) {
          seen.add(key);
          columns.push(key);
        }
      }
    }
  }
  if (columns.length === 0) return "";

  const header = columns.map(csvCell).join(",");
  const body = rows
    .map((row) => columns.map((col) => csvCell((row as Record<string, unknown>)?.[col])).join(","))
    .join("\n");
  return `${header}\n${body}`;
}

/**
 * Downloads the database as CSV. Spreadsheets have no concept of multiple
 * tables in one .csv, so each entity is written as its own labelled block
 * separated by a blank line — readable in Excel and greppable by hand.
 */
export function downloadBackupCSV(): BackupSnapshot {
  const snapshot = createBackupSnapshot();
  const sections: string[] = [];

  for (const key of BACKUP_KEYS) {
    const value = snapshot.data[key];
    if (!Array.isArray(value) || value.length === 0) continue;
    const label = key.replace("medirent-", "").toUpperCase();
    sections.push(`### ${label} (${value.length} rows)\n${toCSV(value)}`);
  }

  const content =
    `# Relife ERP backup — ${snapshot.createdAt}\n\n` +
    (sections.length > 0 ? sections.join("\n\n") : "# No data to export");

  triggerDownload(
    `relife-erp-backup-${snapshot.createdDate}.csv`,
    content,
    "text/csv;charset=utf-8",
  );
  markBackedUpToday();
  return snapshot;
}

/** Reads the most recent auto-snapshot held in localStorage, if any. */
export function getStoredSnapshot(): BackupSnapshot | null {
  if (!isBrowser()) return null;
  const raw = localStorage.getItem(SNAPSHOT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as BackupSnapshot;
  } catch {
    return null;
  }
}

/** Dates of the auto-snapshots currently retained, newest first. */
export function getSnapshotHistory(): Array<{
  createdAt: string;
  createdDate: string;
  rows: number;
}> {
  if (!isBrowser()) return [];
  const raw = localStorage.getItem(SNAPSHOT_HISTORY_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Stores today's snapshot in localStorage.
 *
 * Returns false when the write fails — almost always a quota error, since a
 * snapshot is by definition about as large as the database it copies. That is
 * not fatal: the daily *prompt* still fires, so the operator is told to take a
 * real (downloaded) backup, which is the copy that actually survives the
 * browser being cleared.
 */
function storeSnapshot(snapshot: BackupSnapshot): boolean {
  if (!isBrowser()) return false;
  try {
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot));
    const history = getSnapshotHistory();
    const entry = {
      createdAt: snapshot.createdAt,
      createdDate: snapshot.createdDate,
      rows: snapshotRowCount(snapshot),
    };
    const next = [entry, ...history.filter((h) => h.createdDate !== entry.createdDate)].slice(
      0,
      MAX_HISTORY,
    );
    localStorage.setItem(SNAPSHOT_HISTORY_KEY, JSON.stringify(next));
    return true;
  } catch (err) {
    console.warn("[Backup] Could not store the daily snapshot (storage is likely full):", err);
    return false;
  }
}

export interface DailyBackupResult {
  /** True when no backup has been downloaded yet today. */
  downloadPending: boolean;
  /** True when a fresh in-browser snapshot was written on this call. */
  snapshotTaken: boolean;
  lastBackupDate: string | null;
  today: string;
}

/**
 * Called on app start. Takes an in-browser snapshot at most once per calendar
 * day and reports whether today's downloadable backup is still outstanding.
 */
export function runDailyBackupCheck(): DailyBackupResult {
  const today = localDate();
  const lastBackupDate = getLastBackupDate();

  if (!isBrowser()) {
    return { downloadPending: false, snapshotTaken: false, lastBackupDate, today };
  }

  const stored = getStoredSnapshot();
  let snapshotTaken = false;
  if (!stored || stored.createdDate !== today) {
    snapshotTaken = storeSnapshot(createBackupSnapshot());
  }

  return {
    downloadPending: lastBackupDate !== today,
    snapshotTaken,
    lastBackupDate,
    today,
  };
}

export interface RestoreResult {
  ok: boolean;
  error?: string;
  restoredKeys?: string[];
  counts?: Record<string, number>;
}

/** Validates that a parsed object really is one of our snapshots. */
export function parseBackupFile(
  text: string,
): { ok: true; snapshot: BackupSnapshot } | { ok: false; error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return {
      ok: false,
      error: "That file is not valid JSON. Please choose a backup file created by this app.",
    };
  }

  if (!parsed || typeof parsed !== "object") {
    return { ok: false, error: "That file does not contain a backup." };
  }

  const candidate = parsed as Partial<BackupSnapshot>;
  if (!candidate.data || typeof candidate.data !== "object") {
    return {
      ok: false,
      error: "That file is missing its `data` section, so it is not a Relife ERP backup.",
    };
  }

  // Refuse a snapshot whose keys are all unknown to us — restoring it would
  // write nothing useful while reporting success.
  const knownKeys = Object.keys(candidate.data).filter(
    (k) => (BACKUP_KEYS as readonly string[]).includes(k) || COUNTER_KEY_PATTERN.test(k),
  );
  if (knownKeys.length === 0) {
    return { ok: false, error: "That backup contains no recognisable Relife ERP data." };
  }

  if (candidate.formatVersion && Number(candidate.formatVersion) > BACKUP_FORMAT_VERSION) {
    return {
      ok: false,
      error: `That backup was made by a newer version of the app (format v${candidate.formatVersion}). Update this device before restoring it.`,
    };
  }

  return { ok: true, snapshot: candidate as BackupSnapshot };
}

/**
 * Overwrites the database with a snapshot.
 *
 * The caller MUST have confirmed with the user first — this is destructive and
 * replaces every entity present in the snapshot. A safety copy of the current
 * state is written first so an accidental restore can itself be undone.
 */
export function restoreFromBackup(snapshot: BackupSnapshot): RestoreResult {
  if (!isBrowser()) return { ok: false, error: "Restore is only available in the browser." };

  // Safety net: keep what we are about to overwrite.
  try {
    localStorage.setItem("medirent-backup-pre-restore", JSON.stringify(createBackupSnapshot()));
  } catch (err) {
    console.warn("[Backup] Could not save a pre-restore safety copy:", err);
  }

  const restoredKeys: string[] = [];
  try {
    for (const [key, value] of Object.entries(snapshot.data)) {
      const isKnown =
        (BACKUP_KEYS as readonly string[]).includes(key) || COUNTER_KEY_PATTERN.test(key);
      if (!isKnown) continue;
      localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
      restoredKeys.push(key);
    }
  } catch (err) {
    console.error("[Backup] Restore failed partway through:", err);
    return {
      ok: false,
      error:
        "The restore failed partway through, most likely because storage is full. " +
        "The previous data was saved under `medirent-backup-pre-restore` and can be recovered.",
      restoredKeys,
    };
  }

  // Let every open page rebuild from the restored data.
  localStorage.setItem("medirent-last-write-time", Date.now().toString());
  window.dispatchEvent(new Event("medirent-db-updated"));

  return { ok: true, restoredKeys, counts: snapshot.counts };
}

/** Reads a File the user picked and restores from it. Confirmation is the caller's job. */
export async function restoreFromFile(file: File): Promise<RestoreResult> {
  let text: string;
  try {
    text = await file.text();
  } catch {
    return { ok: false, error: "Could not read that file." };
  }

  const parsed = parseBackupFile(text);
  if (!parsed.ok) return { ok: false, error: parsed.error };

  return restoreFromBackup(parsed.snapshot);
}

/**
 * Downloads the in-browser snapshot taken earlier today, rather than a fresh
 * one — used by the "Daily Backup Ready" prompt so what the operator saves is
 * exactly the state that was snapshotted.
 */
export function downloadStoredSnapshot(): boolean {
  const snapshot = getStoredSnapshot();
  if (!snapshot) {
    toast.error("No daily snapshot is available yet.");
    return false;
  }
  triggerDownload(
    `relife-erp-backup-${snapshot.createdDate}.json`,
    JSON.stringify(snapshot, null, 2),
    "application/json",
  );
  markBackedUpToday();
  return true;
}
