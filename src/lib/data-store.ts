import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  customers as initialCustomers,
  equipment as initialEquipment,
  rentals as initialRentals,
  payments as initialPayments,
  returns as initialReturns,
} from "./mock-data";
import { syncRowToSheet, deleteRowFromSheet, isGSheetsEnabled, SHEETS, readSheetData, getPendingSyncs, cleanStalePendingSyncs, sheetsRequest, getDeletedRecords } from "./google-sheets";

// Helper to check for SSR
const isBrowser = typeof window !== "undefined";

// Clear local storage one-time if it hasn't been reset to empty mock-data yet
if (isBrowser && localStorage.getItem("medirent-db-cleared-v9") !== "true") {
  // BUG-DATA FIX: Preserve user accounts and sequential ID counters across resets.
  // Only wipe operational data — never wipe staff user accounts or counter keys.
  const _preservedStaffUsers = localStorage.getItem("medirent-staff-users");
  localStorage.removeItem("medirent-customers");
  localStorage.removeItem("medirent-equipment");
  localStorage.removeItem("medirent-rentals");
  localStorage.removeItem("medirent-payments");
  localStorage.removeItem("medirent-returns");
  localStorage.removeItem("medirent-documents");
  localStorage.removeItem("medirent-owners");
  localStorage.removeItem("medirent-exchanges");
  localStorage.removeItem("medirent-db-cleared-v8");
  // Restore staff users if they existed before the reset
  if (_preservedStaffUsers) {
    localStorage.setItem("medirent-staff-users", _preservedStaffUsers);
  }
  localStorage.setItem("medirent-db-cleared-v9", "true");
}

// ─── Pre-seed default admin account ─────────────────────────────────────────
// This ensures the app always has an admin account on any fresh device or
// deployment without requiring the user to go through the First-Run Setup screen.
// Password: Relife@806709  (SHA-256 pre-computed — never stored in plaintext)
if (isBrowser) {
  const existingStaff = localStorage.getItem("medirent-staff-users");
  let staffList: any[] = [];
  if (existingStaff) {
    try {
      staffList = JSON.parse(existingStaff);
      if (!Array.isArray(staffList)) staffList = [];
    } catch (_) { staffList = []; }
  }

  const defaultAdmin = {
    id: "1",
    name: "Relife Admin",
    email: "relifemedicaltechnologies.mys@gmail.com",
    // SHA-256 of "Relife@806709"
    passwordHash: "2d8b2a1ff89a8b02e74a88a7fba7304e1724aa45324dd82ce7da2f9d4d3b0cec",
    role: "Admin",
    firstAdmin: true,
  };

  const oldIdx = staffList.findIndex((u: any) => u.email === "g.avinash10005@gmail.com" || u.id === "1" || u.firstAdmin);
  if (oldIdx > -1) {
    staffList[oldIdx] = defaultAdmin;
  } else if (!staffList.some((u: any) => u.email.toLowerCase() === defaultAdmin.email)) {
    staffList.unshift(defaultAdmin);
  }

  localStorage.setItem("medirent-staff-users", JSON.stringify(staffList));
  localStorage.setItem("medirent-setup-done", "true");
}


// CALC-4 FIX: Auto-mark rentals as Overdue when past their end date and
// actually carrying unpaid rent (see the status-correction pass inside
// getRentals() below — moved there because it needs getRentalOutstandingBalance/
// getPaidForEquipment/cleanNum, which are declared later in this module via
// `const`/`function` and aren't safely callable yet from this top-level block
// that runs the instant the module is imported).

// ─── Date formatting helper ──────────────────────────────────────────────────
/**
 * Formats a date string (ISO, YYYY-MM-DD, or already DD-MM-YYYY) to DD-MM-YYYY.
 * Returns the original string if parsing fails.
 */
export function formatDateDDMMYYYY(dateStr: string | undefined | null): string {
  if (!dateStr) return "—";
  // Already in DD-MM-YYYY format
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) return dateStr;
  
  // If it's an ISO UTC timestamp (contains T), let's parse it using local Date to be timezone safe
  if (dateStr.includes("T")) {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    }
  }

  // Strip time portion (handles YYYY-MM-DD style strings)
  const cleaned = dateStr.split("T")[0];
  const parts = cleaned.split(/[-/]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      // YYYY-MM-DD or YYYY/MM/DD
      const [year, month, day] = parts;
      return `${day.padStart(2, "0")}-${month.padStart(2, "0")}-${year}`;
    }
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

/**
 * Returns a date formatted as YYYY-MM-DD in the local timezone.
 */
export function getLocalYYYYMMDD(dateInput: Date | string = new Date()): string {
  if (typeof dateInput === "string") {
    const trimmed = dateInput.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
    return trimmed.split("T")[0];
  }

  const year = dateInput.getFullYear();
  const month = String(dateInput.getMonth() + 1).padStart(2, "0");
  const day = String(dateInput.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Timezone-safe date parser for YYYY-MM-DD strings.
 * Using `new Date("2026-01-01")` parses as UTC midnight, which in IST (UTC+5:30)
 * becomes Dec 31, 2025 18:30 — causing off-by-one-day bugs.
 * This function uses the local Date constructor to avoid that.
 */
export function parseLocalDate(dateStr: string | undefined | null): Date {
  if (!dateStr) return new Date(NaN);
  
  // If it's an ISO timestamp (contains T), parse timezone-aware and return local midnight Date
  if (typeof dateStr === "string" && dateStr.includes("T")) {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }
  }

  const cleaned = (dateStr as string).split("T")[0].trim();
  const parts = cleaned.split(/[-/]/);
  if (parts.length === 3) {
    let y = parseInt(parts[0], 10);
    let m = parseInt(parts[1], 10) - 1; // 0-indexed
    let d = parseInt(parts[2], 10);
    
    // Support DD-MM-YYYY / DD/MM/YYYY format where year is at index 2
    if (parts[2].length === 4) {
      y = parseInt(parts[2], 10);
      d = parseInt(parts[0], 10);
    }
    
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      return new Date(y, m, d);
    }
  }
  return new Date(cleaned); // fallback
}

// ─── Equipment Display Labels ─────────────────────────────────
/**
 * ITEM-5 / ITEM-7: the single source of truth for how a piece of equipment is
 * named anywhere a human reads it - dropdowns, line items, agreements, receipts
 * and WhatsApp/SMS copy templates.
 *
 * Renders as `Name - Model (S/N: Serial)`, dropping any part that is missing so
 * a record without a model never produces `Name - undefined`.
 */
export function formatEquipmentLabel(src: {
  name?: string;
  category?: string;
  model?: string;
  serial?: string;
} | null | undefined): string {
  if (!src) return "Equipment";
  const name = String(src.name || src.category || "").trim();
  const model = String(src.model || "").trim();
  const serial = String(src.serial || "").trim();

  let label = name || "Equipment";
  // Skip a model that merely repeats the name (some legacy rows duplicate it).
  if (model && model.toLowerCase() !== name.toLowerCase()) {
    label += ` - ${model}`;
  }
  if (serial) {
    label += ` (S/N: ${serial})`;
  }
  return label;
}

/**
 * Resolves the equipment rows behind a rental (new `equipmentItems` array or the
 * legacy comma-separated `equipmentId`) and returns one display label each,
 * enriched with the model from the equipment master where the rental line item
 * does not carry one.
 */
export function getRentalEquipmentLabels(rental: any, equipmentList?: any[]): string[] {
  if (!rental) return [];
  const master = equipmentList || (isBrowser ? getEquipment() : []);
  const byId = new Map<string, any>(master.map((e: any) => [e.id, e]));

  const items: any[] =
    Array.isArray(rental.equipmentItems) && rental.equipmentItems.length > 0
      ? rental.equipmentItems
      : String(rental.equipmentId || "")
          .split(",")
          .map((id: string) => id.trim())
          .filter(Boolean)
          .map((id: string) => ({ equipmentId: id, serial: rental.serial }));

  if (items.length === 0) {
    // Nothing structured to go on - fall back to whatever the rental stored.
    const label = formatEquipmentLabel({
      name: rental.equipment,
      model: rental.model,
      serial: rental.serial,
    });
    return label === "Equipment" && !rental.equipment ? [] : [label];
  }

  return items.map((item: any) => {
    const eq = byId.get(item.equipmentId);
    return formatEquipmentLabel({
      // The line item wins where it has a value; the master fills the gaps
      // (older line items were saved before `model` was captured on them).
      name: item.equipment || item.name || eq?.name || eq?.category || rental.equipment,
      model: item.model || eq?.model,
      serial: item.serial || eq?.serial,
    });
  });
}

/** Convenience: all of a rental's equipment on one line, comma separated. */
export function getRentalEquipmentSummary(rental: any, equipmentList?: any[]): string {
  const labels = getRentalEquipmentLabels(rental, equipmentList);
  return labels.length > 0 ? labels.join(", ") : "Medical Equipment";
}

// ─── Equipment Categories ─────────────────────────────────────────────────────
export const EQUIPMENT_CATEGORIES = [
  "Oxygen Concentrator 5LP",
  "Oxygen Concentrator 10LPM",
  "Bipap Machine",
  "Auto CPAP Machine",
  "Surgical Cot With Mattress",
  "Foldable Wheel Chair",
  "Patient Monitor",
  "Syringe Pump",
  "Infusion Pump",
  "Nebulizer",
  "Patient Ventilator",
];

// ─── Sorting Helpers ────────────────────────────────────────────────────────
export function extractIdNumber(idStr: string | undefined | null): number {
  if (!idStr) return 0;
  const matches = idStr.match(/\d+/g);
  if (!matches) return 0;
  return parseInt(matches.join(""), 10);
}

export function sortLatestFirst(list: any[], dateField?: string): any[] {
  if (!Array.isArray(list)) return [];
  return [...list].sort((a, b) => {
    // 1. Highest numerical ID first (e.g. AGR-2026-0004 before AGR-2026-0001, RET-0010 before RET-0001)
    const idA = a?.id || a?.agreementId || a?.rentalId || "";
    const idB = b?.id || b?.agreementId || b?.rentalId || "";
    const numA = extractIdNumber(idA);
    const numB = extractIdNumber(idB);
    if (numA !== numB) {
      return numB - numA;
    }
    // 2. Date descending
    if (dateField && a?.[dateField] && b?.[dateField]) {
      const dateA = parseLocalDate(a[dateField]).getTime();
      const dateB = parseLocalDate(b[dateField]).getTime();
      if (!isNaN(dateA) && !isNaN(dateB) && dateA !== dateB) {
        return dateB - dateA;
      }
    }
    return (idB || "").localeCompare(idA || "");
  });
}

// ─── Agreement Number Auto-Generator ────────────────────────────────────────
/**
 * Returns the next sequential agreement number in AGR-YYYY-XXXX format.
 * Counter resets per calendar year and is persisted in localStorage.
 */
export function getNextAgreementNumber(): string {
  if (!isBrowser) return `AGR-${new Date().getFullYear()}-0001`;
  const year = new Date().getFullYear();
  const key = `medirent-agr-counter-${year}`;
  
  // Auto-align counter with the maximum ID in the database to prevent duplicate/stale counters
  const rentals = getRentals();
  const yearPrefix = `AGR-${year}-`;
  let maxIdNum = 0;
  
  rentals.forEach((r: any) => {
    if (r.id && r.id.startsWith(yearPrefix)) {
      const parts = r.id.split("-");
      const num = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(num) && num > maxIdNum) {
        maxIdNum = num;
      }
    }
  });

  const next = maxIdNum + 1;
  localStorage.setItem(key, next.toString());
  return `AGR-${year}-${String(next).padStart(4, "0")}`;
}

/** Returns the next agreement ID for display only — does NOT increment the counter.
 *  Use this in form initial state (useState), call getNextAgreementNumber() only on actual save.
 */
export function peekNextAgreementNumber(): string {
  if (!isBrowser) return `AGR-${new Date().getFullYear()}-0001`;
  const year = new Date().getFullYear();
  
  // Auto-align counter with the maximum ID in the database to prevent duplicate/stale counters
  const rentals = getRentals();
  const yearPrefix = `AGR-${year}-`;
  let maxIdNum = 0;
  
  rentals.forEach((r: any) => {
    if (r.id && r.id.startsWith(yearPrefix)) {
      const parts = r.id.split("-");
      const num = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(num) && num > maxIdNum) {
        maxIdNum = num;
      }
    }
  });

  return `AGR-${year}-${String(maxIdNum + 1).padStart(4, "0")}`;
}

// ─── Return Number Auto-Generator ──────────────────────────────────────────
export function getNextReturnNumber(): string {
  if (!isBrowser) return "RET-0001";
  const key = "medirent-ret-counter";
  // BUG-8 FIX: Auto-align counter with the max ID in the database.
  // After a Google Sheets pull that restores returns data, the counter
  // could be behind the actual max, causing duplicate IDs on the next save.
  const returns = getStorageItem<any[]>("medirent-returns", []);
  let maxIdNum = parseInt(localStorage.getItem(key) || "0", 10);
  returns.forEach((r: any) => {
    if (r.id && r.id.startsWith("RET-")) {
      const parts = r.id.split("-");
      const num = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(num) && num > maxIdNum) maxIdNum = num;
    }
  });
  const next = maxIdNum + 1;
  localStorage.setItem(key, next.toString());
  return `RET-${String(next).padStart(4, "0")}`;
}

export function peekNextReturnNumber(): string {
  if (!isBrowser) return "RET-0001";
  const key = "medirent-ret-counter";
  const returns = getStorageItem<any[]>("medirent-returns", []);
  let maxIdNum = parseInt(localStorage.getItem(key) || "0", 10);
  returns.forEach((r: any) => {
    if (r.id && r.id.startsWith("RET-")) {
      const parts = r.id.split("-");
      const num = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(num) && num > maxIdNum) maxIdNum = num;
    }
  });
  return `RET-${String(maxIdNum + 1).padStart(4, "0")}`;
}

// ─── Payment Number Auto-Generator ──────────────────────────────────────────
export function getNextPaymentNumber(): string {
  if (!isBrowser) return "PAY-0001";
  const key = "medirent-pay-counter";
  // BUG-8 FIX: Auto-align counter with the max ID in the database.
  const payments = getStorageItem<any[]>("medirent-payments", []);
  let maxIdNum = parseInt(localStorage.getItem(key) || "0", 10);
  payments.forEach((p: any) => {
    if (p.id && p.id.startsWith("PAY-")) {
      const parts = p.id.split("-");
      const num = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(num) && num > maxIdNum) maxIdNum = num;
    }
  });
  const next = maxIdNum + 1;
  localStorage.setItem(key, next.toString());
  return `PAY-${String(next).padStart(4, "0")}`;
}

export function peekNextPaymentNumber(): string {
  if (!isBrowser) return "PAY-0001";
  const key = "medirent-pay-counter";
  const payments = getStorageItem<any[]>("medirent-payments", []);
  let maxIdNum = parseInt(localStorage.getItem(key) || "0", 10);
  payments.forEach((p: any) => {
    if (p.id && p.id.startsWith("PAY-")) {
      const parts = p.id.split("-");
      const num = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(num) && num > maxIdNum) maxIdNum = num;
    }
  });
  return `PAY-${String(maxIdNum + 1).padStart(4, "0")}`;
}

// ─── Customer Number Auto-Generator ─────────────────────────────────────────
export function getNextCustomerNumber(): string {
  if (!isBrowser) return "CUS-0001";
  const key = "medirent-cus-counter";
  // BUG-3 FIX: Auto-align counter with the max ID in the database.
  // After a Google Sheets pull that restores customers, the counter
  // could be behind the actual max, causing duplicate IDs on the next save.
  const customers = getStorageItem<any[]>("medirent-customers", []);
  let maxIdNum = parseInt(localStorage.getItem(key) || "0", 10);
  customers.forEach((c: any) => {
    if (c.id && c.id.startsWith("CUS-")) {
      const parts = c.id.split("-");
      const num = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(num) && num > maxIdNum) maxIdNum = num;
    }
  });
  const next = maxIdNum + 1;
  localStorage.setItem(key, next.toString());
  return `CUS-${String(next).padStart(4, "0")}`;
}

export function peekNextCustomerNumber(): string {
  if (!isBrowser) return "CUS-0001";
  const key = "medirent-cus-counter";
  const customers = getStorageItem<any[]>("medirent-customers", []);
  let maxIdNum = parseInt(localStorage.getItem(key) || "0", 10);
  customers.forEach((c: any) => {
    if (c.id && c.id.startsWith("CUS-")) {
      const parts = c.id.split("-");
      const num = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(num) && num > maxIdNum) maxIdNum = num;
    }
  });
  return `CUS-${String(maxIdNum + 1).padStart(4, "0")}`;
}

// ─── Document Number Auto-Generator ─────────────────────────────────────────
export function getNextDocumentNumber(): string {
  if (!isBrowser) return "DOC-0001";
  return `DOC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

export function peekNextDocumentNumber(): string {
  if (!isBrowser) return "DOC-0001";
  return `peek-${Date.now()}`;
}

// ─── Owner Number Auto-Generator ────────────────────────────────────────────
export function getNextOwnerNumber(): string {
  if (!isBrowser) return "OWN-0001";
  const key = "medirent-own-counter";
  // BUG-4 FIX: Auto-align counter with the max ID in the database.
  // After a Google Sheets pull, the counter could be behind the actual max,
  // causing duplicate IDs on the next save.
  const owners = getStorageItem<any[]>("medirent-owners", []);
  let maxIdNum = parseInt(localStorage.getItem(key) || "0", 10);
  owners.forEach((o: any) => {
    if (o.id && o.id.startsWith("OWN-")) {
      const parts = o.id.split("-");
      const num = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(num) && num > maxIdNum) maxIdNum = num;
    }
  });
  const next = maxIdNum + 1;
  localStorage.setItem(key, next.toString());
  return `OWN-${String(next).padStart(4, "0")}`;
}

export function peekNextOwnerNumber(): string {
  if (!isBrowser) return "OWN-0001";
  const key = "medirent-own-counter";
  const owners = getStorageItem<any[]>("medirent-owners", []);
  let maxIdNum = parseInt(localStorage.getItem(key) || "0", 10);
  owners.forEach((o: any) => {
    if (o.id && o.id.startsWith("OWN-")) {
      const parts = o.id.split("-");
      const num = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(num) && num > maxIdNum) maxIdNum = num;
    }
  });
  return `OWN-${String(maxIdNum + 1).padStart(4, "0")}`;
}

// ─── Equipment Number Auto-Generator ────────────────────────────────────────
export function getNextEquipmentNumber(category: string): string {
  const prefix = (category || "EQ").substring(0, 3).toUpperCase().trim();
  if (!isBrowser) return `EQ-${prefix}-0001`;
  const key = `medirent-eq-counter-${prefix}`;
  let current = parseInt(localStorage.getItem(key) || "0", 10);
  try {
    const list = getStorageItem<any[]>("medirent-equipment", initialEquipment);
    list.forEach((eq: any) => {
      if (eq.id && typeof eq.id === "string" && eq.id.startsWith(`EQ-${prefix}-`)) {
        const numPart = parseInt(eq.id.replace(`EQ-${prefix}-`, ""), 10);
        if (!isNaN(numPart) && numPart > current) {
          current = numPart;
        }
      }
    });
  } catch (e) {
    // ignore
  }
  const next = current + 1;
  localStorage.setItem(key, next.toString());
  return `EQ-${prefix}-${String(next).padStart(4, "0")}`;
}

export function peekNextEquipmentNumber(category: string): string {
  const prefix = (category || "EQ").substring(0, 3).toUpperCase().trim();
  if (!isBrowser) return `EQ-${prefix}-0001`;
  const key = `medirent-eq-counter-${prefix}`;
  const current = parseInt(localStorage.getItem(key) || "0", 10);
  return `EQ-${prefix}-${String(current + 1).padStart(4, "0")}`;
}

// Generic LocalStorage helpers
function getStorageItem<T>(key: string, initialData: T): T {
  if (!isBrowser) return initialData;
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(initialData));
    return initialData;
  }
  try {
    return JSON.parse(data) as T;
  } catch {
    return initialData;
  }
}

function setStorageItem<T>(key: string, data: T): void {
  if (isBrowser) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      // QuotaExceededError — localStorage is full (5-10MB browser limit).
      // This typically happens when base64 images/documents accumulate.
      console.error(`[Storage] Failed to write key "${key}":`, e);
      const isQuota = e instanceof DOMException && (
        e.name === "QuotaExceededError" ||
        e.code === 22 ||    // Legacy Chrome/Safari code
        e.code === 1014     // Legacy Firefox code
      );
      if (isQuota) {
        toast.error(
          "Storage full! Unable to save. Please go to Settings → Export Data to back up, then clear old delivery photos/documents to free space.",
          { duration: 10000 }
        );
      }
      throw e; // Re-throw so callers know the write failed
    }
    if (key !== "medirent-last-write-time" && key !== "medirent-gsheets-url") {
      // BUG-1 FIX: notify so useDatabaseTrigger() on all pages reactively
      // refreshes without a reload. This also enables cross-tab sync via the
      // storage event listener.
      //
      // The timestamp is written synchronously and deliberately so:
      // syncFromSheetsToLocalStorage() reads it to decide whether a local write
      // beat an in-flight pull, and deferring it would open a window where a
      // sync could overwrite data that had just been saved.
      localStorage.setItem("medirent-last-write-time", Date.now().toString());

      // PERF: only the *notification* is coalesced (see below). A single user
      // action performs many writes, and firing the event on each one made
      // every subscribed page re-run getRentals() - which carries a self-healing
      // repair pass and a status-correction sweep - once per write. Batching
      // collapses that into one notification per action.
      scheduleDbUpdateNotification();
    }
  }
}

/**
 * PERF: coalesces `medirent-db-updated` notifications.
 *
 * saveReturn(), for instance, writes returns, rentals, equipment, payments and
 * customers in one go. Un-batched that is five full re-render cascades across
 * every open page for what the user experiences as one action, and each cascade
 * re-parses the whole database out of localStorage.
 */
let dbUpdateScheduled = false;
function scheduleDbUpdateNotification(): void {
  if (!isBrowser || dbUpdateScheduled) return;
  dbUpdateScheduled = true;

  const flush = () => {
    dbUpdateScheduled = false;
    window.dispatchEvent(new Event("medirent-db-updated"));
  };

  // A microtask keeps this within the same task as the save, so anything that
  // saves and then immediately reads still sees a notification promptly -
  // while still collapsing every write made during that one action.
  Promise.resolve().then(flush);
}

/**
 * Runs `fn` and emits at most one `medirent-db-updated` for everything it
 * writes. Use it around a multi-step operation whose intermediate states should
 * never reach the UI.
 */
export function batchDatabaseWrites<T>(fn: () => T): T {
  if (!isBrowser) return fn();
  const wasScheduled = dbUpdateScheduled;
  // Suppress scheduling for the duration, then notify once at the end.
  dbUpdateScheduled = true;
  try {
    return fn();
  } finally {
    dbUpdateScheduled = wasScheduled;
    scheduleDbUpdateNotification();
  }
}


export function calculateCustomerStatus(customer: any, rentalsList: any[]) {
  const customerRentals = rentalsList.filter((r: any) => r.customerId === customer.id);
  const hasOverdue = customerRentals.some((r: any) => r.status === "Overdue");
  const hasActive = customerRentals.some((r: any) => r.status === "Active");
  const hasCompleted = customerRentals.some((r: any) => r.status === "Completed");

  if (hasOverdue) return "Overdue";
  if (hasActive) return "Active";
  if (hasCompleted) return "Active";
  if (customer.aadhaar || customer.pan) return "Active";
  return "Pending";
}

export function getCustomers() {
  // Fast path: return cached result when nothing has been written since last call.
  if (isBrowser) {
    const stamp = _rentalsStamp();
    if (_customersCache && _customersCacheStamp === stamp) {
      return _customersCache;
    }
  }

  const list = getStorageItem("medirent-customers", initialCustomers);
  if (typeof window === "undefined") return sortLatestFirst(list);
  const rentalsList = getRentals();
  let changed = false;
  const updatedList = list.map((c: any) => {
    const activeRentalsCount = rentalsList.filter(
      (r: any) => r.customerId === c.id && (r.status === "Active" || r.status === "Overdue")
    ).length;
    
    const status = calculateCustomerStatus(c, rentalsList);
    if (c.rentals !== activeRentalsCount || c.status !== status) {
      c.rentals = activeRentalsCount;
      c.status = status;
      changed = true;
    }
    return c;
  });
  if (changed) {
    // BUG-7 FIX: Use localStorage.setItem directly to avoid dispatching medirent-db-updated
    // from a read/normalize path, which would cause an infinite render loop:
    // getCustomers() normalizes → dispatches event → re-render calls getCustomers() → loop.
    localStorage.setItem("medirent-customers", JSON.stringify(updatedList));
  }
  const result = sortLatestFirst(updatedList);
  if (isBrowser) {
    _customersCache = result;
    _customersCacheStamp = _rentalsStamp();
  }
  return result;
}

export function saveCustomer(customer: typeof initialCustomers[number]) {
  const list = getCustomers();
  const index = list.findIndex((c) => c.id === customer.id);
  if (index > -1) {
    list[index] = customer;
  } else {
    list.unshift(customer);
  }
  setStorageItem("medirent-customers", list);
  // Sync to Google Sheets (fire-and-forget)
  if (isGSheetsEnabled()) syncRowToSheet(SHEETS.CUSTOMERS, customer as Record<string, unknown>);
  return list;
}

export function deleteCustomer(id: string) {
  const list = getCustomers().filter((c) => c.id !== id);
  setStorageItem("medirent-customers", list);
  if (isGSheetsEnabled()) deleteRowFromSheet(SHEETS.CUSTOMERS, id);

  // Clean up associated ID Proof / customer documents
  try {
    const docs = getDocuments().filter((d) => d.customerId === id);
    docs.forEach((d) => deleteDocument(d.id));
  } catch (_e) {}

  return list;
}

// Equipment Data Store
const normalizeEquipmentStatus = (status: string): "Rented" | "Available" | "UnderMaintenance" => {
  const s = String(status || "").trim().toLowerCase();
  if (s === "rented" || s === "active") return "Rented";
  if (s === "available" || s === "inactive") return "Available";
  return "UnderMaintenance";
};

export function getEquipment() {
  // Fast path: return cached result when nothing has been written since last call.
  if (isBrowser) {
    const stamp = _rentalsStamp();
    if (_equipmentCache && _equipmentCacheStamp === stamp) {
      return _equipmentCache;
    }
  }

  const list = getStorageItem("medirent-equipment", initialEquipment);
  if (typeof window === "undefined") return sortLatestFirst(list, "purchaseDate");
  
  const rentalsList = getRentals();
  let changed = false;
  
  const normalizedList = list.map((item: any) => {
    // Check if this equipment item is currently in an active or overdue rental
    const isCurrentlyRented = rentalsList.some((r: any) => {
      if (r.status !== "Active" && r.status !== "Overdue") return false;
      
      // Check the items list first
      if (r.equipmentItems && r.equipmentItems.length > 0) {
        return r.equipmentItems.some((ei: any) => ei.equipmentId === item.id && !ei.returned);
      }
      
      // Fallback to legacy comma-separated IDs
      const ids = (r.equipmentId || "").split(",").map((s: string) => s.trim()).filter(Boolean);
      return ids.includes(item.id);
    });

    let targetStatus = item.status;
    if (isCurrentlyRented) {
      // Active rental always wins — equipment must show as Rented
      targetStatus = "Rented";
    } else if (item.status === "Rented") {
      // Was stored as Rented but no active rental found — release it to Available
      // (but NEVER auto-change UnderMaintenance or Returned to Owner — those are manual overrides)
      targetStatus = "Available";
    }
    // If stored status is "Available", "UnderMaintenance", or "Returned to Owner" and not actively rented,
    // keep it exactly as stored — do not run normalizeEquipmentStatus which could
    // accidentally convert a valid stored value.
    
    if (item.status !== targetStatus) {
      item.status = targetStatus;
      changed = true;
    }
    return item;
  });
  
  if (changed) {
    localStorage.setItem("medirent-equipment", JSON.stringify(normalizedList));
  }
  const result = sortLatestFirst(normalizedList, "purchaseDate");
  if (isBrowser) {
    _equipmentCache = result;
    _equipmentCacheStamp = _rentalsStamp();
  }
  return result;
}

export function saveEquipment(item: typeof initialEquipment[number]) {
  // Use raw storage read (not getEquipment) to avoid the rental-derived status
  // override loop — getEquipment() re-derives statuses which would fight the
  // explicit status we are trying to save here.
  if (!item.status) {
    item.status = "Available";
  }
  const list = getStorageItem("medirent-equipment", initialEquipment);
  const index = list.findIndex((e: any) => e.id === item.id);
  if (index > -1) {
    list[index] = item;
  } else {
    list.unshift(item);
  }
  setStorageItem("medirent-equipment", list);
  if (isGSheetsEnabled()) syncRowToSheet(SHEETS.EQUIPMENT, item as Record<string, unknown>);
  return list;
}

export function deleteEquipment(id: string) {
  const list = getStorageItem("medirent-equipment", initialEquipment).filter((e: any) => e.id !== id);
  setStorageItem("medirent-equipment", list);
  if (isGSheetsEnabled()) deleteRowFromSheet(SHEETS.EQUIPMENT, id);
  return list;
}

// Owners Data Store Interface
export interface OwnerItem {
  id: string;
  name: string;
  ownerName?: string;
  // agreementNumber and agreementDate removed — these belong on rentals, not owners
  inventorySeries: string;
  phone: string;
  email: string;
  address?: string;
  commissionRate: number;
  status: "Active" | "Inactive";
}

const initialOwners: OwnerItem[] = [
  {
    id: "OWN-0001",
    name: "ReLife",
    ownerName: "Deepak",
    inventorySeries: "",
    phone: "",
    email: "",
    commissionRate: 100,
    status: "Active",
  },
];

export function getOwners(): OwnerItem[] {
  const list = getStorageItem("medirent-owners", initialOwners);
  const eqList = getStorageItem("medirent-equipment", initialEquipment);
  
  let changed = false;
  const updatedList = list.map((o: OwnerItem) => {
    const ownerEquipment = eqList.filter((e: any) => e.owner?.toLowerCase() === o.name.toLowerCase());
    // BUG-OWN FIX: Also check legacy "Active" equipment status (matches getDynamicKPIs pattern)
    const hasActiveEquipment = ownerEquipment.some((e: any) => e.status === "Rented" || e.status === "Active");
    const correctStatus = hasActiveEquipment ? "Active" : "Inactive";
    
    if (o.status !== correctStatus) {
      o.status = correctStatus;
      changed = true;
    }
    return o;
  });
  
  if (changed) {
    // PERF FIX: Use localStorage.setItem directly here to avoid dispatching
    // medirent-db-updated event from a read/normalize path, which would cause
    // infinite render loops and scroll-to-top on every data write.
    localStorage.setItem("medirent-owners", JSON.stringify(updatedList));
  }
  return sortLatestFirst(updatedList) as OwnerItem[];
}

export function saveOwner(owner: OwnerItem) {
  const list = getOwners();
  const index = list.findIndex((o) => o.id === owner.id);
  if (index > -1) {
    list[index] = owner;
  } else {
    list.unshift(owner);
  }
  setStorageItem("medirent-owners", list);
  if (isGSheetsEnabled()) syncRowToSheet(SHEETS.OWNERS, owner as unknown as Record<string, unknown>);
  return list;
}

export function deleteOwner(id: string) {
  const list = getOwners().filter((o) => o.id !== id);
  setStorageItem("medirent-owners", list);
  if (isGSheetsEnabled()) deleteRowFromSheet(SHEETS.OWNERS, id);
  return list;
}

// Documents Data Store Interface
export interface DocumentItem {
  id: string;
  name: string;
  type: string;
  size: string;
  date: string;
  rentalId?: string;
  customerId?: string;
  fileData?: string; // base64 encoded file content for in-browser preview
}

// ─── IndexedDB Files Store Setup ────────────────────────────────────────────
const DB_NAME = "medirent-files-db";
const DB_VERSION = 1;
const STORE_NAME = "files";

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB not supported in this environment"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function setFileInIndexedDB(id: string, fileData: string): Promise<void> {
  if (typeof window === "undefined" || !window.indexedDB) return Promise.resolve();
  return getDB().then((db) => {
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(fileData, id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  });
}

export function getFileFromIndexedDB(id: string): Promise<string | undefined> {
  if (typeof window === "undefined" || !window.indexedDB) return Promise.resolve(undefined);
  return getDB().then((db) => {
    return new Promise<string | undefined>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }).catch(() => undefined);
}

export function deleteFileFromIndexedDB(id: string): Promise<void> {
  if (typeof window === "undefined" || !window.indexedDB) return Promise.resolve();
  return getDB().then((db) => {
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }).catch(() => {});
}

export async function getDocumentWithFile(doc: DocumentItem): Promise<DocumentItem> {
  if (doc.fileData) return doc;
  
  // Try loading from local IndexedDB first
  const localFileData = await getFileFromIndexedDB(doc.id);
  if (localFileData) {
    return { ...doc, fileData: localFileData };
  }
  
  // If not found locally and GSheets is enabled, download chunks
  if (isGSheetsEnabled()) {
    try {
      const remoteFileData = await downloadFileChunks(doc.id);
      if (remoteFileData) {
        // Cache it in IndexedDB so next loads are local and instant
        await setFileInIndexedDB(doc.id, remoteFileData);
        return { ...doc, fileData: remoteFileData };
      }
    } catch (e) {
      console.warn(`[GSheets] Failed to download file chunks for ${doc.id}:`, e);
    }
  }
  
  return { ...doc, fileData: "NOT_FOUND" };
}

const initialDocs: DocumentItem[] = [];

export function getDocuments(): DocumentItem[] {
  let list = getStorageItem("medirent-documents", initialDocs);
  
  // Self-healing migration to delete the user's test QR_Code file
  const testQrDoc = list.find(d => d.name === "QR_Code_741852.png");
  if (testQrDoc) {
    list = list.filter(d => d.name !== "QR_Code_741852.png");
    setStorageItem("medirent-documents", list);
    deleteFileFromIndexedDB(testQrDoc.id);
  }
  
  // Healing logic for broken document names/rentalIds from stale agreementId states
  // AND migration logic of fileData to IndexedDB
  let modified = false;
  
  list = list.map((doc) => {
    // If name is broken like Location_Tag_.txt or Location_Tag_undefined.txt or similar
    if (doc.type === "Location Tag" && (doc.name === "Location_Tag_.txt" || doc.name.includes("undefined") || !doc.rentalId)) {
      const rentals = getStorageItem<any[]>("medirent-rentals", []);
      const rental = rentals.find(r => r.customerId === doc.customerId);
      if (rental) {
        doc.rentalId = rental.id;
        doc.name = `Location_Tag_${rental.id}.txt`;
        modified = true;
      }
    }
    if (doc.type === "Delivery Photo" && (doc.name === "Delivery_Photo_.jpg" || doc.name.includes("undefined") || !doc.rentalId)) {
      const rentals = getStorageItem<any[]>("medirent-rentals", []);
      const rental = rentals.find(r => r.customerId === doc.customerId);
      if (rental) {
        doc.rentalId = rental.id;
        doc.name = `Delivery_Photo_${rental.id}.jpg`;
        modified = true;
      }
    }
    
    // Transparent IndexedDB migration: if doc has fileData stored in localStorage, migrate it!
    if (doc.fileData) {
      setFileInIndexedDB(doc.id, doc.fileData);
      delete doc.fileData; // remove from localStorage copy
      modified = true;
    }
    
    return doc;
  });
  
  if (modified) {
    localStorage.setItem("medirent-documents", JSON.stringify(list));
  }

  return sortLatestFirst(list, "date") as DocumentItem[];
}

const CHUNK_SIZE = 45000;

export async function uploadFileChunks(fileId: string, fileData: string): Promise<boolean> {
  if (!isGSheetsEnabled()) return false;
  const totalChunks = Math.ceil(fileData.length / CHUNK_SIZE);
  try {
    // Upload chunks one at a time (with retries) instead of firing them all
    // concurrently — bursts of parallel writes to the Apps Script endpoint were
    // silently dropping chunks, which corrupted the reassembled file on other
    // devices (file "found" but failed to open).
    for (let i = 0; i < totalChunks; i++) {
      const chunkData = fileData.substring(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      const chunkRow = {
        id: `${fileId}_chunk_${i}`,
        fileId,
        chunkIndex: i,
        totalChunks,
        chunkData,
      };

      let uploaded = false;
      for (let attempt = 0; attempt < 3 && !uploaded; attempt++) {
        const res = await sheetsRequest("upsert", { sheet: SHEETS.FILE_CHUNKS, row: chunkRow });
        uploaded = res.success;
      }
      if (!uploaded) {
        console.warn(`[GSheets] Failed to upload chunk ${i + 1}/${totalChunks} for ${fileId} after retries`);
        return false;
      }
    }
    return true;
  } catch (e) {
    console.warn(`[GSheets] Failed to upload file chunks for ${fileId}:`, e);
    return false;
  }
}

export async function downloadFileChunks(fileId: string): Promise<string | null> {
  if (!isGSheetsEnabled()) return null;
  const chunksData = await readSheetData(SHEETS.FILE_CHUNKS, { key: "fileId", value: fileId });
  if (!chunksData) return null;

  const fileChunks = (chunksData as any[])
    .filter((c) => c.fileId === fileId)
    .sort((a, b) => a.chunkIndex - b.chunkIndex);

  if (fileChunks.length === 0) return null;

  // Guard against partial uploads: if any chunk failed to sync, reassembling
  // what we have would silently produce a corrupted file (e.g. a PDF that
  // "loads" but fails to render). Treat incomplete sets as not found.
  const totalChunks = Number(fileChunks[0].totalChunks);
  if (!totalChunks || fileChunks.length !== totalChunks) {
    console.warn(`[GSheets] Incomplete file chunks for ${fileId}: got ${fileChunks.length}/${totalChunks || "?"}`);
    return null;
  }
  for (let i = 0; i < totalChunks; i++) {
    if (Number(fileChunks[i].chunkIndex) !== i) {
      console.warn(`[GSheets] Missing chunk ${i} for ${fileId}`);
      return null;
    }
  }

  return fileChunks.map((c) => c.chunkData).join("");
}

export async function deleteFileChunks(fileId: string) {
  if (!isGSheetsEnabled()) return;
  try {
    const chunks = await readSheetData(SHEETS.FILE_CHUNKS, { key: "fileId", value: fileId });
    if (chunks) {
      const fileChunks = (chunks as any[]).filter((c) => c.fileId === fileId);
      for (const chunk of fileChunks) {
        deleteRowFromSheet(SHEETS.FILE_CHUNKS, chunk.id);
      }
    }
  } catch (e) {
    console.warn(`[GSheets] Failed to delete file chunks for ${fileId}:`, e);
  }
}

export function saveDocument(doc: DocumentItem) {
  const list = getDocuments();
  const fileData = doc.fileData;
  const metadataDoc = { ...doc };
  
  if (fileData) {
    // Save heavy fileData to IndexedDB
    setFileInIndexedDB(doc.id, fileData);
    // Remove heavy fileData from localStorage copy
    delete metadataDoc.fileData;
  }
  
  const index = list.findIndex((d) => d.id === doc.id);
  if (index > -1) {
    list[index] = metadataDoc;
  } else {
    list.unshift(metadataDoc);
  }
  setStorageItem("medirent-documents", list);
  if (isGSheetsEnabled()) {
    syncRowToSheet(SHEETS.DOCUMENTS, metadataDoc as unknown as Record<string, unknown>);
    if (fileData) {
      uploadFileChunks(doc.id, fileData);
    }
  }
  return list;
}

/** Internal silent version — does NOT dispatch medirent-db-updated event.
 *  Use when auto-creating document records inside other save functions
 *  (saveRental, saveReturn) to avoid spurious re-renders. */
function saveDocumentSilent(doc: DocumentItem) {
  const list = getDocuments();
  const fileData = doc.fileData;
  const metadataDoc = { ...doc };

  // BUG-4 FIX: Also save fileData to IndexedDB (mirrors saveDocument logic).
  // Without this, auto-created Agreement/Receipt/Return docs had no fileData
  // because only metadata was stored — breaking any future preview attempt.
  if (fileData) {
    setFileInIndexedDB(doc.id, fileData);
    delete metadataDoc.fileData;
  }

  const index = list.findIndex((d) => d.id === doc.id);
  if (index > -1) {
    list[index] = metadataDoc;
  } else {
    list.unshift(metadataDoc);
  }
  localStorage.setItem("medirent-documents", JSON.stringify(list));
  if (isGSheetsEnabled()) syncRowToSheet(SHEETS.DOCUMENTS, metadataDoc as unknown as Record<string, unknown>);
  return list;
}

export function deleteDocument(id: string) {
  const list = getDocuments().filter((d) => d.id !== id);
  setStorageItem("medirent-documents", list);
  deleteFileFromIndexedDB(id);
  if (isGSheetsEnabled()) {
    deleteRowFromSheet(SHEETS.DOCUMENTS, id);
    deleteFileChunks(id);
  }
  return list;
}

// ─── Read-result caches ──────────────────────────────────────────────────────
// getRentals / getCustomers / getEquipment all run expensive repair+sort passes
// on every call. Between writes nothing changes, so we cache the last result and
// re-use it as long as `medirent-last-write-time` hasn't moved.
let _rentalsCache: any[] | null = null;
let _rentalsCacheStamp = "";
function _rentalsStamp() {
  return typeof window !== "undefined"
    ? (localStorage.getItem("medirent-last-write-time") ?? "")
    : "";
}
function _invalidateRentalsCache() {
  _rentalsCache = null;
  _rentalsCacheStamp = "";
  _customersCache = null;
  _customersCacheStamp = "";
  _equipmentCache = null;
  _equipmentCacheStamp = "";
}

let _customersCache: any[] | null = null;
let _customersCacheStamp = "";

let _equipmentCache: any[] | null = null;
let _equipmentCacheStamp = "";

// Rentals Data Store
export function getRentals() {
  // Fast path: return cached result when nothing has been written since last call.
  if (isBrowser) {
    const stamp = _rentalsStamp();
    if (_rentalsCache && _rentalsCacheStamp === stamp) {
      return _rentalsCache;
    }
  }

  const list = getStorageItem("medirent-rentals", initialRentals);
  if (typeof window === "undefined") return sortLatestFirst(list, "start");

  // Self-healing migration: check returns and mark items as returned
  let changed = false;
  const returnsList = getReturns();
  
  const healedList = list.map((r: any) => {
    let rentalChanged = false;
    let updatedItems = r.equipmentItems || [];
    
    if (updatedItems.length === 0 && r.equipmentId) {
      const ids = r.equipmentId.split(",").map((s: string) => s.trim()).filter(Boolean);
      const serials = (r.serial || "").split(",").map((s: string) => s.trim()).filter(Boolean);
      updatedItems = ids.map((id: string, idx: number) => ({
        equipmentId: id,
        serial: serials[idx] || "XXXX",
        monthlyRent: cleanNum(r.monthlyRent) / ids.length,
        deposit: cleanNum(r.deposit) / ids.length,
        returned: false
      }));
      rentalChanged = true;
    }
    
    const agreementReturns = returnsList.filter((ret: any) => ret.agreement === r.id);
    const allReturnedIds = new Set(agreementReturns.flatMap((ret: any) => ret.returnedEquipmentIds || []));
    
    const mappedItems = updatedItems.map((item: any) => {
      if (allReturnedIds.has(item.equipmentId) && !item.returned) {
        rentalChanged = true;
        return { ...item, returned: true };
      }
      return item;
    });
    
    if (rentalChanged) {
      changed = true;
      const allReturned = mappedItems.every((item: any) => item.returned);
      const activeItems = mappedItems.filter((item: any) => !item.returned);

      const newStatus = allReturned ? "Completed" : r.status;
      // When every item has been returned, keep the full item list as the
      // historical equipmentId/serial record instead of narrowing to "still
      // active" items — that set is empty once everything's returned, which
      // wiped the field to "" and made it look like the agreement's data had
      // been deleted on the Rentals list / customer history / reports.
      const displayItems = allReturned ? mappedItems : activeItems;
      const newEquipmentId = displayItems.map((item: any) => item.equipmentId).join(", ");
      const newSerial = displayItems.map((item: any) => item.serial).join(", ");

      return {
        ...r,
        status: newStatus,
        equipmentItems: mappedItems,
        equipmentId: newEquipmentId,
        serial: newSerial
      };
    }
    
    if (updatedItems.length > 0 && !r.equipmentItems) {
      changed = true;
      return {
        ...r,
        equipmentItems: updatedItems
      };
    }

    return r;
  });

  // Repair pass: rebuild equipmentId/serial/equipment/monthlyRent/deposit on
  // Completed rentals that were wiped to ""/0 by the returns-processing bug
  // above (now fixed) before this build. equipmentItems still has the real
  // data, so reconstruct the summary fields from it rather than leaving old
  // agreements looking like their data vanished.
  let eqMasterForRepair: any[] | null = null;
  const repairedList = healedList.map((r: any) => {
    const items = r.equipmentItems;
    const looksWiped = r.status === "Completed" && !r.equipmentId &&
      Array.isArray(items) && items.length > 0 && items.some((it: any) => it.equipmentId);
    if (!looksWiped) return r;

    // Read equipment straight from storage (not getEquipment()) — getEquipment()
    // itself calls getRentals(), and calling it from here would recurse back
    // into this repair pass infinitely (stack overflow) since the underlying
    // record hasn't been saved as "fixed" yet at this point in the pass.
    if (!eqMasterForRepair) eqMasterForRepair = getStorageItem("medirent-equipment", initialEquipment);
    const equipmentId = items.map((it: any) => it.equipmentId).filter(Boolean).join(", ");
    const serial = items.map((it: any) => it.serial).filter(Boolean).join(", ");
    const equipment = items
      .map((it: any) => it.name || eqMasterForRepair!.find((e: any) => e.id === it.equipmentId)?.name || "Unknown")
      .join(", ");
    const monthlyRent = cleanNum(r.monthlyRent) || items.reduce((sum: number, it: any) => sum + cleanNum(it.monthlyRent || it.dailyRent || it.rentRate), 0);
    const deposit = cleanNum(r.deposit) || items.reduce((sum: number, it: any) => sum + cleanNum(it.deposit), 0);

    changed = true;
    return { ...r, equipmentId, serial, equipment, monthlyRent, deposit };
  });

  // Status-correction pass: "Overdue" means there's a real unpaid balance —
  // not a nominal end date passing (most agreements here run ongoing
  // month-to-month with no formal renewal/end date at all, so gating on
  // that field left genuinely-unpaid rentals like these sitting labeled
  // "Active" for months). This also auto-clears a stale Overdue flag once
  // the balance is actually settled (previously nothing reset it back to
  // Active unless a payment happened to be saved with a matching
  // `agreement` id on it).
  const paymentsForStatus = getPayments();
  const statusCorrections: any[] = [];
  const statusCorrectedList = repairedList.map((r: any) => {
    if (r.status !== "Active" && r.status !== "Overdue") return r;

    const outstanding = getRentalOutstandingBalance(r, paymentsForStatus);
    const newStatus = outstanding > 0 ? "Overdue" : "Active";
    if (newStatus === r.status) return r;

    changed = true;
    const corrected = { ...r, status: newStatus };
    statusCorrections.push(corrected);
    return corrected;
  });

  // Push corrected statuses to Google Sheets (and register them as pending
  // upserts in the process) — without this, the corrected value only lives
  // in localStorage, and AppShell's sync-from-Sheets call (which fires
  // immediately on every page mount, then every 15s) pulls the OLD status
  // back down from the still-unchanged remote row and silently overwrites
  // this fix seconds after every page load, even after a hard refresh.
  if (statusCorrections.length > 0 && isGSheetsEnabled()) {
    statusCorrections.forEach((r) => syncRowToSheet(SHEETS.RENTALS, r as unknown as Record<string, unknown>));
  }

  const result = sortLatestFirst(changed ? statusCorrectedList : list, "start");

  if (changed) {
    localStorage.setItem("medirent-rentals", JSON.stringify(statusCorrectedList));
    // Stamp is now stale — update it so the next getRentals() call within this
    // same tick still gets the repaired list instead of re-running the pass.
    _rentalsCache = result;
    _rentalsCacheStamp = _rentalsStamp();
    return result;
  }

  // No changes — cache the sorted list for instant re-reads within this tick.
  _rentalsCache = result;
  _rentalsCacheStamp = _rentalsStamp();
  return result;
}

export function saveRental(rental: typeof initialRentals[number] & { equipmentItems?: any[] }) {
  const list = getRentals();
  const index = list.findIndex((r) => r.id === rental.id);
  if (index > -1) {
    const oldRental = list[index];
    if (oldRental.equipmentId) {
      const oldIds = oldRental.equipmentId.split(",").map((s: string) => s.trim()).filter(Boolean);
      const newIds = (rental.equipmentId || "").split(",").map((s: string) => s.trim()).filter(Boolean);
      oldIds.forEach((id: string) => {
        if (!newIds.includes(id)) {
          updateEquipmentStatus(id, "Available");
        }
      });
    }
    list[index] = rental;
  } else {
    list.unshift(rental);
  }
  setStorageItem("medirent-rentals", list);

  // Update associated equipment status to 'Rented'
  if ((rental.status === "Active" || rental.status === "Overdue" || rental.status === "Pending Approval") && rental.equipmentId) {
    rental.equipmentId.split(",").map((s: string) => s.trim()).filter(Boolean).forEach((id: string) => {
      updateEquipmentStatus(id, "Rented");
    });
  }

  // Update customer rentals counter
  updateCustomerRentalsCount(rental.customerId);

  // Sync owner status based on equipment availability
  const eqListForOwner = getEquipment();
  const affectedOwners = new Set<string>();
  (rental.equipmentId || "").split(",").map((s: string) => s.trim()).filter(Boolean).forEach((id: string) => {
    const eq = eqListForOwner.find((e) => e.id === id);
    if (eq?.owner) affectedOwners.add(eq.owner);
  });
  affectedOwners.forEach((ownerName) => updateOwnerStatusByEquipment(ownerName));

  // LINK-3 FIX: Only auto-create agreement document if it doesn't already exist
  const existingAgrDocs = getDocuments();
  if (!existingAgrDocs.some(d => d.id === `doc-agr-${rental.id}`)) {
    saveDocumentSilent({
      id: `doc-agr-${rental.id}`,
      name: `Agreement ${rental.id}.pdf`,
      type: "Agreement",
      size: "320 KB",
      date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      rentalId: rental.id,
      customerId: rental.customerId,
    });
  }

  // Sync to Google Sheets (fire-and-forget)
  if (isGSheetsEnabled()) syncRowToSheet(SHEETS.RENTALS, rental as unknown as Record<string, unknown>);

  return list;
}

export function cancelRental(id: string) {
  const list = getRentals();
  const index = list.findIndex((r) => r.id === id);
  if (index > -1) {
    const rental = list[index];
    // Bug fix #11: Was incorrectly set to "Completed" — should be "Cancelled"
    rental.status = "Cancelled";
    setStorageItem("medirent-rentals", list);

    // Release equipment back to 'Available'
    if (rental.equipmentId) {
      rental.equipmentId.split(",").map((s: string) => s.trim()).filter(Boolean).forEach((eqId: string) => {
        updateEquipmentStatus(eqId, "Available");
      });
    }
    
    // Update customer rentals counter
    updateCustomerRentalsCount(rental.customerId);

    // Sync owner status based on equipment availability
    const eqListCancel = getEquipment();
    const cancelOwners = new Set<string>();
    (rental.equipmentId || "").split(",").map((s: string) => s.trim()).filter(Boolean).forEach((id: string) => {
      const eq = eqListCancel.find((e) => e.id === id);
      if (eq?.owner) cancelOwners.add(eq.owner);
    });
    cancelOwners.forEach((ownerName) => updateOwnerStatusByEquipment(ownerName));

    // Sync cancellation to Google Sheets
    if (isGSheetsEnabled()) syncRowToSheet(SHEETS.RENTALS, rental as unknown as Record<string, unknown>);
  }
  return list;
}

export function approveRental(id: string) {
  const list = getRentals();
  const index = list.findIndex((r) => r.id === id);
  if (index > -1) {
    const rental = list[index];
    const outstanding = getRentalOutstandingBalance(rental, getPayments());
    rental.status = outstanding > 0 ? "Overdue" : "Active";
    setStorageItem("medirent-rentals", list);
    
    // Sync to Google Sheets (fire-and-forget)
    if (isGSheetsEnabled()) syncRowToSheet(SHEETS.RENTALS, rental as unknown as Record<string, unknown>);
    
    // Trigger update event
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("medirent-db-updated"));
    }
  }
}

// Payments Data Store
export function getPayments() {
  const list = getStorageItem("medirent-payments", initialPayments);
  return sortLatestFirst(list, "date");
}

export function savePayment(payment: typeof initialPayments[number]) {
  const list = getPayments();
  const index = list.findIndex((p) => p.id === payment.id);
  if (index > -1) {
    list[index] = payment;
  } else {
    list.unshift(payment);
  }
  setStorageItem("medirent-payments", list);

  // If this payment is for an active rental, update status if paid
  if (payment.agreement && payment.type === "Rent") {
    const rentalsList = getRentals();
    const rental = rentalsList.find((r) => r.id === payment.agreement);
    if (rental && rental.status === "Overdue" && payment.status === "Paid") {
      rental.status = "Active";
      // PERF FIX: Direct write to avoid extra medirent-db-updated event.
      localStorage.setItem("medirent-rentals", JSON.stringify(rentalsList));
    }
  }

  // LINK-3 FIX: Only auto-create document if it doesn't already exist (prevents duplicates on edit)
  const existingPayDocs = getDocuments();
  if (!existingPayDocs.some(d => d.id === `doc-pay-${payment.id}`)) {
    saveDocumentSilent({
      id: `doc-pay-${payment.id}`,
      name: `${payment.type === "Deposit" ? "Receipt" : "Invoice"} ${payment.id}.pdf`,
      type: payment.type === "Deposit" ? "Receipt" : "Invoice",
      size: "112 KB",
      date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      rentalId: payment.agreement,
      customerId: payment.customerId,
    });
  }

  // Sync to Google Sheets (fire-and-forget)
  if (isGSheetsEnabled()) syncRowToSheet(SHEETS.PAYMENTS, payment as unknown as Record<string, unknown>);

  return list;
}

export function deletePayment(id: string) {
  const allPayments = getPayments();
  const deletedPayment = allPayments.find(p => p.id === id);
  const list = allPayments.filter((p) => p.id !== id);
  setStorageItem("medirent-payments", list);
  // LINK-5 FIX: Keep customer rental count in sync after payment deletion
  if (deletedPayment?.customerId) {
    updateCustomerRentalsCount(deletedPayment.customerId);
  }
  if (isGSheetsEnabled()) deleteRowFromSheet(SHEETS.PAYMENTS, id);
  return list;
}

// Returns Data Store
export function getReturns() {
  const list = getStorageItem("medirent-returns", initialReturns);
  if (typeof window === "undefined") return sortLatestFirst(list, "date");

  const payments = getPayments();
  const healedList = list.map((ret: any) => {
    if (ret.refund < 0) {
      const totalCollectible = Math.abs(ret.refund);
      if (ret.duePaidAmount === undefined) {
        // Calculate paid from payments matching this return or agreement settlement
        const matchingPayments = payments.filter(
          (p: any) => p.agreement === ret.agreement && p.status === "Paid" && (p.notes || "").toLowerCase().includes("return")
        );
        const paidTotal = matchingPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
        const calcPaid = ret.duePaymentStatus === "Paid" ? totalCollectible : Math.min(totalCollectible, paidTotal);
        const calcPending = Math.max(0, totalCollectible - calcPaid);
        const calcStatus = calcPending <= 0 ? "Paid" : calcPaid > 0 ? "Partial" : "Not Paid";
        return {
          ...ret,
          duePaidAmount: calcPaid,
          duePendingBalance: calcPending,
          duePaymentStatus: calcStatus,
        };
      }
    }
    return ret;
  });

  return sortLatestFirst(healedList, "date");
}

export function saveReturn(ret: typeof initialReturns[number] & { returnedEquipmentIds?: string[] }) {
  const list = getReturns();
  // BUG-1 FIX: Upsert-safe — don't push duplicates on every save call
  const existingIdx = list.findIndex((r) => r.id === ret.id);
  if (existingIdx > -1) {
    list[existingIdx] = ret;
  } else {
    list.unshift(ret);
  }
  setStorageItem("medirent-returns", list);


  // Update corresponding rental status and release returned equipment
  const rentalsList = getRentals();
  const rentalIndex = rentalsList.findIndex((r) => r.id === ret.agreement);
  let newAgreementId = "";

  if (rentalIndex > -1) {
    const rental = rentalsList[rentalIndex];
    if (!ret.customerId && rental.customerId) {
      ret.customerId = rental.customerId;
      const listCopy = getReturns();
      const rIdx = listCopy.findIndex((r) => r.id === ret.id);
      if (rIdx > -1) {
        listCopy[rIdx].customerId = rental.customerId;
        setStorageItem("medirent-returns", listCopy);
      }
    }
    
    // Get the returned equipment IDs
    const returnedIds = ret.returnedEquipmentIds || (rental.equipmentId ? rental.equipmentId.split(",").map((s: string) => s.trim()).filter(Boolean) : []);
    
    // Update rental equipment items array
    if (rental.equipmentItems && rental.equipmentItems.length > 0) {
      const eqList = getEquipment();
      
      const returnedItems = rental.equipmentItems.filter((item: any) => returnedIds.includes(item.equipmentId));
      const remainingItems = rental.equipmentItems.filter((item: any) => !returnedIds.includes(item.equipmentId) && !item.returned);

      if (remainingItems.length > 0) {
        // --- SPLIT AGREEMENT GENERATION ---
        // 1. Generate new agreement ID
        newAgreementId = getNextAgreementNumber();

        // 2. Compute monthly rent and deposit split
        const totalRentalMonthlyRent = rental.equipmentItems.reduce((sum: number, it: any) => sum + cleanNum(it.monthlyRent || it.dailyRent || it.rentRate), 0);
        const remainingItemsRent = remainingItems.reduce((sum: number, it: any) => sum + cleanNum(it.monthlyRent || it.dailyRent || it.rentRate), 0);
        const returnedItemsRent = returnedItems.reduce((sum: number, it: any) => sum + cleanNum(it.monthlyRent || it.dailyRent || it.rentRate), 0);
        
        const totalRentalDeposit = rental.equipmentItems.reduce((sum: number, it: any) => sum + cleanNum(it.deposit), 0);
        const remainingItemsDeposit = remainingItems.reduce((sum: number, it: any) => sum + cleanNum(it.deposit), 0);
        const returnedItemsDeposit = returnedItems.reduce((sum: number, it: any) => sum + cleanNum(it.deposit), 0);

        // Apportion upfront paid amounts
        const originalRentPaid = cleanNum(rental.rentPaidAmount);
        const originalDepositPaid = cleanNum(rental.depositPaidAmount);

        const remainingRentPaidShare = Math.round(originalRentPaid * (totalRentalMonthlyRent > 0 ? (remainingItemsRent / totalRentalMonthlyRent) : 1));
        const returnedRentPaidShare = Math.max(0, originalRentPaid - remainingRentPaidShare);

        const remainingDepositPaidShare = Math.round(originalDepositPaid * (totalRentalDeposit > 0 ? (remainingItemsDeposit / totalRentalDeposit) : 1));
        const returnedDepositPaidShare = Math.max(0, originalDepositPaid - remainingDepositPaidShare);

        // 3. Create the new agreement for remaining items
        const newRental = {
          ...rental,
          id: newAgreementId,
          equipmentId: remainingItems.map((item: any) => item.equipmentId).join(", "),
          serial: remainingItems.map((item: any) => item.serial).join(", "),
          equipment: remainingItems.map((item: any) => eqList.find(e => e.id === item.equipmentId)?.name || "Unknown").join(", "),
          monthlyRent: remainingItemsRent,
          deposit: remainingItemsDeposit,
          equipmentItems: remainingItems.map((item: any) => ({ ...item, returned: false })),
          rentPaidAmount: remainingRentPaidShare,
          depositPaidAmount: remainingDepositPaidShare,
          status: rental.status === "Overdue" ? "Overdue" : "Active"
        };
        
        // Push the new rental into rentalsList
        rentalsList.unshift(newRental);

        // 4. Split payments:
        const paymentsList = getPayments();
        let paymentsChanged = false;
        
        const updatedPaymentsList = paymentsList.map((p: any) => {
          if (p.agreement !== rental.id) return p;
          
          if (p.equipmentId) {
            if (remainingItems.some((item: any) => item.equipmentId === p.equipmentId)) {
              paymentsChanged = true;
              return { ...p, agreement: newAgreementId };
            }
            return p;
          } else {
            paymentsChanged = true;
            const originalAmount = cleanNum(p.amount);
            const remainingShare = Math.round(originalAmount * (totalRentalMonthlyRent > 0 ? (remainingItemsRent / totalRentalMonthlyRent) : 1));
            const returnedShare = Math.max(0, originalAmount - remainingShare);
            
            if (remainingShare > 0) {
              const newPaymentId = getNextPaymentNumber();
              setTimeout(() => {
                const freshPayments = getPayments();
                const newPayment = {
                  ...p,
                  id: newPaymentId,
                  agreement: newAgreementId,
                  amount: remainingShare,
                  notes: `${p.notes || ''} (Apportioned share for remaining items in agreement ${newAgreementId})`
                };
                freshPayments.unshift(newPayment);
                setStorageItem("medirent-payments", freshPayments);
              }, 0);
            }
            
            return {
              ...p,
              amount: returnedShare,
              notes: `${p.notes || ''} (Apportioned share for returned items in agreement ${rental.id})`
            };
          }
        });

        if (paymentsChanged) {
          // PERF FIX: Use direct localStorage write for this internal payments redistribution
          // to avoid firing an extra medirent-db-updated event during saveReturn.
          localStorage.setItem("medirent-payments", JSON.stringify(updatedPaymentsList));
        }

        // 5. Update the original agreement to contain ONLY the returned items
        rental.equipmentItems = returnedItems.map((item: any) => ({ ...item, returned: true, returnedDate: ret.date }));
        rental.equipmentId = returnedItems.map((item: any) => item.equipmentId).join(", ");
        rental.serial = returnedItems.map((item: any) => item.serial).join(", ");
        rental.equipment = returnedItems.map((item: any) => eqList.find(e => e.id === item.equipmentId)?.name || "Unknown").join(", ");
        rental.monthlyRent = returnedItemsRent;
        rental.deposit = returnedItemsDeposit;
        rental.rentPaidAmount = returnedRentPaidShare;
        rental.depositPaidAmount = returnedDepositPaidShare;
        rental.status = "Completed";
        rental.end = ret.date;

      } else {
        // Normal case (all items returned). Keep equipmentId/serial/equipment/
        // monthlyRent/deposit as-is — they're the historical record of what this
        // completed agreement was for (shown on the customer's rental history,
        // the Rentals list/export, and reports). Wiping them to "" / 0 here used
        // to make that data vanish from every screen the moment a return was filed.
        rental.equipmentItems = rental.equipmentItems.map((item: any) => {
          if (returnedIds.includes(item.equipmentId)) {
            return { ...item, returned: true };
          }
          return item;
        });
        rental.status = "Completed";
        rental.end = ret.date;
      }
    } else {
      // Fallback for legacy rentals (no equipmentItems array to fall back on —
      // these top-level fields are the ONLY record of what was rented, so they
      // must be preserved, not wiped).
      rental.status = "Completed";
      rental.end = ret.date;
    }

    // Mark any selected "Not Paid" additional items as "Paid" since they are now settled in this return
    if (rental.additionalItems && Array.isArray(rental.additionalItems)) {
      rental.additionalItems = rental.additionalItems.map((item: any) => {
        if (item.selected && item.status === "Not Paid") {
          return { ...item, status: "Paid" };
        }
        return item;
      });
    }

    // PERF FIX: Use direct localStorage write for rentals update to avoid firing
    // an extra medirent-db-updated event. The main event comes from setStorageItem
    // on medirent-returns already dispatched at the start of saveReturn.
    localStorage.setItem("medirent-rentals", JSON.stringify(rentalsList));

    // Release the returned equipment back to 'Available' or 'UnderMaintenance' depending on return condition
    returnedIds.forEach((eqId: string) => {
      const eqStatus = (ret.condition === "UnderMaintenance" || ret.condition === "UnderMaintance") ? "UnderMaintenance" : "Available";
      updateEquipmentStatus(eqId, eqStatus);
    });

    // Update customer rentals count
    updateCustomerRentalsCount(rental.customerId);

    // Sync owner status based on returned equipment
    const eqListReturn = getEquipment();
    const returnOwners = new Set<string>();
    (ret.returnedEquipmentIds || []).forEach((id: string) => {
      const eq = eqListReturn.find((e) => e.id === id);
      if (eq?.owner) returnOwners.add(eq.owner);
    });
    returnOwners.forEach((ownerName) => updateOwnerStatusByEquipment(ownerName));
  }

  // LINK-3 FIX: Only auto-create return document if not already present
  const existingRetDocs = getDocuments();
  if (!existingRetDocs.some(d => d.id === `doc-ret-${ret.id}`)) {
    saveDocumentSilent({
      id: `doc-ret-${ret.id}`,
      name: `Return Receipt ${ret.id}.pdf`,
      type: "Receipt",
      size: "150 KB",
      date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      rentalId: ret.agreement,
      customerId: rentalsList.find(r => r.id === ret.agreement)?.customerId,
    });
  }

  // Sync to Google Sheets
  if (isGSheetsEnabled()) syncRowToSheet(SHEETS.RETURNS, ret as unknown as Record<string, unknown>);
  return { list, newAgreementId };
}

export function deleteReturn(id: string) {
  const list = getReturns().filter((r) => r.id !== id);
  setStorageItem("medirent-returns", list);
  if (isGSheetsEnabled()) deleteRowFromSheet(SHEETS.RETURNS, id);
  return list;
}

export function getCustomerDueBalance(customerId: string, customerName?: string): {
  totalDue: number;
  rentalDues: number;
  returnDues: number;
  unpaidReturns: any[];
  unpaidRentals: any[];
} {
  const returns = getReturns();
  const rentals = getRentals();

  const customerRentals = rentals.filter((r: any) =>
    (r.customerId && r.customerId === customerId) ||
    (r.customer && customerName && r.customer.toLowerCase() === customerName.toLowerCase())
  );
  const customerAgrIds = new Set(customerRentals.map((r: any) => r.id));

  const customerReturns = returns.filter((ret: any) => 
    (ret.customerId && ret.customerId === customerId) || 
    (ret.customer && customerName && ret.customer.toLowerCase() === customerName.toLowerCase()) ||
    (ret.agreement && customerAgrIds.has(ret.agreement))
  );

  const unpaidReturns = customerReturns.filter((ret: any) => {
    const pendingDue = ret.duePendingBalance !== undefined 
      ? Number(ret.duePendingBalance) || 0
      : (ret.refund < 0 ? Math.abs(ret.refund) - Number(ret.duePaidAmount || 0) : 0);
    return pendingDue > 0 || ret.duePaymentStatus === "Not Paid" || ret.duePaymentStatus === "Partial";
  });

  const returnDues = unpaidReturns.reduce((sum: number, ret: any) => {
    const pendingDue = ret.duePendingBalance !== undefined 
      ? Number(ret.duePendingBalance) || 0
      : (ret.refund < 0 ? Math.abs(ret.refund) - Number(ret.duePaidAmount || 0) : 0);
    return sum + Math.max(0, pendingDue);
  }, 0);

  return {
    totalDue: Math.round(returnDues),
    rentalDues: 0,
    returnDues: Math.round(returnDues),
    unpaidReturns,
    unpaidRentals: []
  };
}



// Helper methods to keep data consistent across entities
function updateEquipmentStatus(eqId: string, status: string) {
  // Use raw storage read to avoid the rental-derived override loop in getEquipment()
  const eqList = getStorageItem("medirent-equipment", initialEquipment);
  const eqIndex = eqList.findIndex((e: any) => e.id === eqId);
  if (eqIndex > -1) {
    eqList[eqIndex].status = status;
    setStorageItem("medirent-equipment", eqList);
    if (isGSheetsEnabled()) {
      syncRowToSheet(SHEETS.EQUIPMENT, eqList[eqIndex] as unknown as Record<string, unknown>);
    }
  }
}

function updateCustomerRentalsCount(custId: string) {
  const customersList = getCustomers();
  const rentalsList = getRentals();
  
  const custIndex = customersList.findIndex((c) => c.id === custId);
  if (custIndex > -1) {
    // BUG-2 FIX: Only count truly Active rentals (not Cancelled or Completed)
    const activeRentalsCount = rentalsList.filter(
      (r) => r.customerId === custId && (r.status === "Active" || r.status === "Overdue")
    ).length;
    
    customersList[custIndex].rentals = activeRentalsCount;
    customersList[custIndex].status = calculateCustomerStatus(customersList[custIndex], rentalsList);
    // PERF FIX: Use localStorage.setItem directly to avoid firing medirent-db-updated
    // from an internal consistency helper. The real event was already dispatched by the
    // primary save (saveRental/saveReturn) that called this function.
    localStorage.setItem("medirent-customers", JSON.stringify(customersList));
  }
}

function updateOwnerStatusByEquipment(ownerName?: string) {
  if (!ownerName) return;
  const ownersList = getOwners();
  const ownerIndex = ownersList.findIndex(
    (o) => o.name.toLowerCase() === ownerName.toLowerCase()
  );
  if (ownerIndex === -1) return;

  const eqList = getStorageItem("medirent-equipment", initialEquipment);
  const ownerEquipment = eqList.filter((e: any) => e.owner?.toLowerCase() === ownerName.toLowerCase());
  const hasActiveEquipment = ownerEquipment.some((e: any) => e.status === "Rented");

  const newStatus = hasActiveEquipment ? "Active" : "Inactive";
  if (ownersList[ownerIndex].status !== newStatus) {
    ownersList[ownerIndex].status = newStatus;
    // PERF FIX: Use localStorage.setItem directly to avoid firing medirent-db-updated
    // from this internal helper, preventing extra re-renders and scroll jumps.
    localStorage.setItem("medirent-owners", JSON.stringify(ownersList));
  }
}

/** Update all owners' statuses at once — call after bulk changes */
export function syncAllOwnerStatuses() {
  const owners = getOwners();
  owners.forEach((o) => updateOwnerStatusByEquipment(o.name));
}

// Dynamic KPI Calculator for Dashboard
export function getDynamicKPIs() {
  const custs = getCustomers();
  const rent = getRentals();
  const equip = getEquipment();
  const pay = getPayments();
  const rets = getReturns();

  const activeAgreements = rent.filter((r) => r.status === "Active" || r.status === "Overdue").length;
  const availableEquip = equip.filter((e) => e.status === "Available" || e.status === "Inactive").length;
  const rentedEquip = equip.filter((e) => e.status === "Rented" || e.status === "Active").length;

  const now = new Date();
  const curMonth = now.getMonth();
  const curYear = now.getFullYear();
  const prevMonth = curMonth === 0 ? 11 : curMonth - 1;
  const prevYear = curMonth === 0 ? curYear - 1 : curYear;

  // 1. Total Customers growth
  const prevCustsCount = custs.filter(c => {
    const customerRentals = rent.filter(r => r.customerId === c.id);
    if (customerRentals.length === 0) return false;
    const firstRentalTime = Math.min(...customerRentals.map(r => parseLocalDate(r.start).getTime()));
    const firstRentalDate = new Date(firstRentalTime);
    return !isNaN(firstRentalDate.getTime()) && 
      (firstRentalDate.getFullYear() < curYear || 
       (firstRentalDate.getFullYear() === curYear && firstRentalDate.getMonth() < curMonth));
  }).length;

  const curNewCusts = custs.length - prevCustsCount;
  let custsChange = "";
  let custsTrend = "up";
  if (custs.length === 0) {
    custsChange = "";
  } else if (prevCustsCount > 0) {
    const pct = (curNewCusts / prevCustsCount) * 100;
    custsChange = `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
    custsTrend = pct >= 0 ? "up" : "down";
  } else {
    custsChange = `+${custs.length * 100}%`;
    custsTrend = "up";
  }

  // 2. Active Rentals growth
  const prevActiveRentalsCount = rent.filter(r => {
    const rDate = parseLocalDate(r.start);
    if (isNaN(rDate.getTime())) return false;
    const isStartedBeforeThisMonth = rDate.getFullYear() < curYear || 
      (rDate.getFullYear() === curYear && rDate.getMonth() < curMonth);
    return isStartedBeforeThisMonth && r.status !== "Completed";
  }).length;

  let rentalsChange = "";
  let rentalsTrend = "up";
  if (activeAgreements === 0) {
    rentalsChange = "";
  } else if (prevActiveRentalsCount > 0) {
    const pct = ((activeAgreements - prevActiveRentalsCount) / prevActiveRentalsCount) * 100;
    rentalsChange = `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
    rentalsTrend = pct >= 0 ? "up" : "down";
  } else {
    rentalsChange = `+${activeAgreements * 100}%`;
    rentalsTrend = "up";
  }

  // 3. Returned This Month growth
  const curMonthReturns = rets.filter(r => {
    const d = parseLocalDate(r.date);
    return !isNaN(d.getTime()) && d.getMonth() === curMonth && d.getFullYear() === curYear;
  }).length;
  const prevMonthReturns = rets.filter(r => {
    const d = parseLocalDate(r.date);
    return !isNaN(d.getTime()) && d.getMonth() === prevMonth && d.getFullYear() === prevYear;
  }).length;

  let returnsChange = "";
  let returnsTrend = "up";
  if (curMonthReturns === 0) {
    returnsChange = "";
  } else if (prevMonthReturns > 0) {
    const pct = ((curMonthReturns - prevMonthReturns) / prevMonthReturns) * 100;
    returnsChange = `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
    returnsTrend = pct >= 0 ? "up" : "down";
  } else {
    returnsChange = `+${curMonthReturns * 100}%`;
    returnsTrend = "up";
  }

  // 4. Available Equipment availability rate
  let availableChange = "";
  let availableTrend = "up";
  if (equip.length > 0) {
    const rate = Math.round((availableEquip / equip.length) * 100);
    availableChange = `${rate}%`;
    availableTrend = rate >= 50 ? "up" : "down";
  }

  // 5. Rented Equipment utilization rate
  let rentedChange = "";
  let rentedTrend = "up";
  if (equip.length > 0) {
    const rate = Math.round((rentedEquip / equip.length) * 100);
    rentedChange = `${rate}%`;
    rentedTrend = rate >= 50 ? "up" : "down";
  }

  // 6. Monthly Revenue growth
  const currentMonthRevenue = pay
    .filter((p) => {
      if (p.status !== "Paid") return false;
      const d = parseLocalDate(p.date);
      return !isNaN(d.getTime()) && d.getMonth() === curMonth && d.getFullYear() === curYear;
    })
    .reduce((sum, p) => sum + p.amount, 0);

  const prevMonthRevenue = pay
    .filter((p) => {
      if (p.status !== "Paid") return false;
      const d = parseLocalDate(p.date);
      return !isNaN(d.getTime()) && d.getMonth() === prevMonth && d.getFullYear() === prevYear;
    })
    .reduce((sum, p) => sum + p.amount, 0);

  let revenueChange = "";
  let revenueTrend = "up";
  if (currentMonthRevenue === 0) {
    revenueChange = "";
  } else if (prevMonthRevenue > 0) {
    const pct = ((currentMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100;
    revenueChange = `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
    revenueTrend = pct >= 0 ? "up" : "down";
  } else {
    revenueChange = `+100%`;
    revenueTrend = "up";
  }

  // 7. Pending Payments growth
  // Real outstanding balance per rental (elapsed billing minus payments
  // actually recorded), not the `status === "Overdue"` label — that field
  // is only a nominal-end-date flag and misses rentals with real unpaid
  // rent that are still labeled "Active" (e.g. ongoing month-to-month
  // agreements with no formal end date), which is why this used to read
  // ₹0 while the Rent Dues page showed large outstanding balances.
  const rentalsForPending = rent.filter((r) => r.status !== "Completed" && r.status !== "Cancelled");
  const pendingBalances = rentalsForPending.map((r) => ({ r, outstanding: getRentalOutstandingBalance(r, pay) }));
  const pendingPaymentsAmount = pendingBalances.reduce((sum, x) => sum + x.outstanding, 0);
  const pendingInvoicesCount = pendingBalances.filter((x) => x.outstanding > 0).length;

  const prevPendingAmount = pendingBalances
    .filter((x) => {
      const rDate = parseLocalDate(x.r.start);
      return !isNaN(rDate.getTime()) && (rDate.getFullYear() < curYear || (rDate.getFullYear() === curYear && rDate.getMonth() < curMonth));
    })
    .reduce((sum, x) => sum + x.outstanding, 0);

  let pendingChange = "";
  let pendingTrend = "down";
  if (pendingPaymentsAmount === 0) {
    pendingChange = "";
  } else if (prevPendingAmount > 0) {
    const pct = ((pendingPaymentsAmount - prevPendingAmount) / prevPendingAmount) * 100;
    pendingChange = `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
    pendingTrend = pct >= 0 ? "up" : "down";
  } else {
    pendingChange = `+100%`;
    pendingTrend = "up";
  }

  // 8. Security Deposits growth
  const securityDepositsAmount = rent
    .filter((r) => r.status !== "Completed")
    .reduce((sum, r) => sum + r.deposit, 0);

  const prevSecurityDepositsAmount = rent
    .filter((r) => {
      const rDate = parseLocalDate(r.start);
      const isBeforeThisMonth = !isNaN(rDate.getTime()) && (rDate.getFullYear() < curYear || (rDate.getFullYear() === curYear && rDate.getMonth() < curMonth));
      return isBeforeThisMonth && r.status !== "Completed";
    })
    .reduce((sum, r) => sum + r.deposit, 0);

  let securityChange = "";
  let securityTrend = "up";
  if (securityDepositsAmount === 0) {
    securityChange = "";
  } else if (prevSecurityDepositsAmount > 0) {
    const pct = ((securityDepositsAmount - prevSecurityDepositsAmount) / prevSecurityDepositsAmount) * 100;
    securityChange = `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
    securityTrend = pct >= 0 ? "up" : "down";
  } else {
    securityChange = `+100%`;
    securityTrend = "up";
  }

  // 9. Agreements made this month
  const curMonthAgreements = rent.filter(r => {
    const rDate = parseLocalDate(r.start);
    return !isNaN(rDate.getTime()) && rDate.getMonth() === curMonth && rDate.getFullYear() === curYear;
  }).length;

  return [
    { label: "Active Rentals",                value: activeAgreements.toString(),   description: "Current active rental agreements" },
    { label: "Agreements Made This Month",    value: curMonthAgreements.toString(), description: "New rental agreements this month" },
    { label: "Agreements Closed This Month",  value: curMonthReturns.toString(),    description: "Equipment returns this month" },
    { label: "Available Equipment", value: availableEquip.toString(),     description: `${availableEquip} out of ${equip.length} units available` },
    { label: "Rented Equipment",    value: rentedEquip.toString(),        description: `${rentedEquip} out of ${equip.length} units rented` },
    { label: "Monthly Revenue",     value: `₹${currentMonthRevenue.toLocaleString("en-IN")}`, description: "Payments collected this month" },
    { label: "Pending Payments",    value: `₹${pendingPaymentsAmount.toLocaleString("en-IN")}`, description: `${pendingInvoicesCount} agreement(s) with dues pending` },
    { label: "Security Deposits",   value: `₹${securityDepositsAmount.toLocaleString("en-IN")}`, description: "Refundable deposits in escrow" },
  ];
}

/** Collect all localStorage data for bulk Google Sheets sync */
export function getAllDataForSync(): Record<string, unknown[]> {
  return {
    Customers: getCustomers() as unknown as unknown[],
    Equipment: getEquipment() as unknown as unknown[],
    Rentals: getRentals() as unknown as unknown[],
    Payments: getPayments() as unknown as unknown[],
    Returns: getReturns() as unknown as unknown[],
    Owners: getOwners() as unknown as unknown[],
    Documents: getDocuments() as unknown as unknown[],
    // BUG-SYNC FIX: Exchanges was missing — now included so "Sync All" pushes all entity types
    Exchanges: getExchanges() as unknown as unknown[],
    Staff: getStorageItem<unknown[]>("medirent-staff-users", []),
  };
}

// Company Settings (persisted in localStorage)
export interface CompanySettings {
  companyName: string;
  gstin: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  defaultDeposit: string;
  lateFeePerDay: string;
  defaultRentalPeriod: string;
  taxRate: string;
  refundPolicy: string;
}

const defaultCompanySettings: CompanySettings = {
  companyName: "MediRent Healthcare Pvt Ltd",
  gstin: "29ABCDE1234F1Z5",
  contactEmail: "hello@medirent.in",
  contactPhone: "+91 80 1234 5678",
  address: "No. 21, MG Road, Bengaluru 560001",
  defaultDeposit: "200",
  lateFeePerDay: "50",
  defaultRentalPeriod: "30",
  taxRate: "18",
  refundPolicy: "Full deposit refundable on undamaged equipment return within 7 days.",
};

export function getCompanySettings(): CompanySettings {
  return getStorageItem("medirent-company-settings", defaultCompanySettings);
}

export function saveCompanySettings(settings: CompanySettings) {
  setStorageItem("medirent-company-settings", settings);
  // Sync to Google Sheets so settings are preserved across devices/browsers
  if (isGSheetsEnabled()) {
    syncRowToSheet(SHEETS.SETTINGS, { id: "company-settings", ...settings } as unknown as Record<string, unknown>);
  }
}

// Helper to download a text file in browser
export function downloadFile(filename: string, content: string, mimeType: string = "text/plain") {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Delay revoking the object URL to allow the browser to initiate the download
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 100);
}

// Helper to download a styled Excel (.xls) file with bold headings and custom widths
export function downloadExcel(filename: string, headers: string[], rows: string[][], colWidths?: number[]) {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  
  const xlsName = filename.endsWith(".csv") ? filename.replace(".csv", ".xls") : (filename.endsWith(".xls") ? filename : filename + ".xls");

  let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Sheet1</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
<meta charset="UTF-8">
<style>
  th { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-weight: bold; background-color: #1e3a8a; color: #ffffff; border: 0.5pt solid #cbd5e1; text-align: left; padding: 6px; font-size: 10pt; }
  td { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; border: 0.5pt solid #cbd5e1; padding: 6px; font-size: 9.5pt; color: #334155; }
</style>
</head>
<body>
  <table>
    <thead>
      <tr>`;
  
  headers.forEach((h, i) => {
    const widthStyle = colWidths && colWidths[i] ? ` style="width: ${colWidths[i]}px;"` : "";
    html += `\n        <th${widthStyle}>${h}</th>`;
  });
  
  html += `
      </tr>
    </thead>
    <tbody>`;
  
  rows.forEach(row => {
    html += `\n      <tr>`;
    row.forEach(cell => {
      const safeCell = String(cell ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      html += `\n        <td>${safeCell}</td>`;
    });
    html += `\n      </tr>`;
  });
  
  html += `
    </tbody>
  </table>
</body>
</html>`;

  const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = xlsName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Bug Fix #20: downloadAgreementFile was imported in rentals.tsx and customers.tsx
 * but was never defined — causing a runtime crash on click.
 * This wraps printAgreement to open a print/save dialog for the agreement.
 */
export function downloadAgreementFile(rental: any) {
  printAgreement(rental);
}

export function getAgreementHtmlContent(rental: any, isPrintMode: boolean = false, isZoomedPreview: boolean = false): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  if (!rental) return "";

  // Helper to convert numbers to words (Indian numbering format)
  const convertNumberToWords = (amount: number): string => {
    if (amount <= 0 || isNaN(amount)) return "N/A";
    const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    
    function convert(n: number): string {
      if (n < 20) return ones[n];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + ones[n % 10] : "");
      if (n < 1000) return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " and " + convert(n % 100) : "");
      if (n < 100000) return convert(Math.floor(n / 1000)) + " Thousand" + (n % 1000 !== 0 ? " " + convert(n % 1000) : "");
      if (n < 10000000) return convert(Math.floor(n / 100000)) + " Lakh" + (n % 100000 !== 0 ? " " + convert(n % 100000) : "");
      return convert(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 !== 0 ? " " + convert(n % 10000000) : "");
    }
    
    return convert(amount) + " only";
  };

  // Helper to calculate dynamic duration
  const calculateDurationBetween = (startDateStr: string, endDateStr: string) => {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
      return "0 days";
    }

    const diffTime = end.getTime() - start.getTime();
    // Bug 11 fix: same-day counts as 1 day
    const totalDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    let months = end.getFullYear() - start.getFullYear();
    months = months * 12 + (end.getMonth() - start.getMonth());
    
    let days = end.getDate() - start.getDate();
    if (days < 0) {
      months--;
      const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
      days += prevMonth.getDate();
    }

    if (months > 0 && days > 0) {
      return `${months} month${months > 1 ? 's' : ''} and ${days} day${days > 1 ? 's' : ''}`;
    } else if (months > 0) {
      return `${months} month${months > 1 ? 's' : ''}`;
    } else {
      return `${totalDays} day${totalDays !== 1 ? 's' : ''}`;
    }
  };

  // Helper to calculate rent
  const calculateRentForDuration = (startDateStr: string, endDateStr: string, monthlyRent: number, dailyRent: number) => {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return 0;

    const diffTime = end.getTime() - start.getTime();
    // Bug 11 fix: same-day counts as 1 day
    const daysUsed = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    if (rental.equipmentItems && rental.equipmentItems.length > 0) {
      return rental.equipmentItems.reduce((sum: number, item: any) => {
        const isMonthly = cleanNum(item.monthlyRent) > 0;
        if (!isMonthly) {
          const dailyRate = cleanNum(item.dailyRent || item.rentRate);
          return sum + (daysUsed * dailyRate);
        } else {
          return sum + getReturnCalculatedRentPerItem(item.monthlyRent, daysUsed, startDateStr, endDateStr);
        }
      }, 0);
    }
    const isRentalMonthly = monthlyRent > 0;
    if (!isRentalMonthly) {
      return daysUsed * dailyRent;
    }
    return getReturnCalculatedRentPerItem(monthlyRent, daysUsed, startDateStr, endDateStr);
  };

  // Retrieve customer details from database
  const customers = getCustomers();
  const customerObj = customers.find(c => c.id === rental.customerId);

  const customerName = rental.customer || customerObj?.name || "Valued Customer";
  const customerAddress = customerObj?.address || "No address on file";
  const customerArea = customerObj?.area || "";
  const customerCity = customerObj?.city || "Mysore";
  const customerState = customerObj?.state || "Karnataka";
  const customerPincode = customerObj?.pincode || "";
  const customerPhone = customerObj?.phone || "N/A";
  const customerAltPhone = customerObj?.altPhone || "";
  const customerEmail = customerObj?.email || "N/A";

  const formattedStartDate = rental.start ? formatDateDDMMYYYY(rental.start) : "N/A";

  // Build Hired Equipment rows
  let finalEquipRows = "";
  if (rental.equipmentItems && rental.equipmentItems.length > 0) {
    const eqList = getEquipment();
    finalEquipRows = rental.equipmentItems.map((item: any) => {
      const eqObj = eqList.find(e => e.id === item.equipmentId);
      // ITEM-5/7: the line item is the record of what was actually hired on this
      // agreement, so it wins over the (mutable) equipment master; the master is
      // only the fallback for older line items saved before `model` was captured.
      const name = item.name || eqObj?.name || eqObj?.category || "Equipment";
      const model = item.model || eqObj?.model || "Standard";
      const serial = item.serial || eqObj?.serial || "XXXX";
      return `
         <tr>
          <td style="padding: 6px 10px; font-weight: bold;">${name}</td>
          <td style="padding: 6px 10px; text-align: center; font-weight: bold; color: ${item.returned ? '#dc2626' : '#059669'};">${item.returned ? 'NO (Returned)' : 'YES'}</td>
          <td style="padding: 6px 10px;">${model}</td>
          <td style="padding: 6px 10px; font-family: monospace;">${serial}</td>
          <td style="padding: 6px 10px;"></td>
          <td style="padding: 6px 10px;"></td>
        </tr>
      `;
    }).join('');
  } else {
    // Build Hired Equipment rows (only the ones they have taken) (fallback for legacy single equipment)
    const standardEquipments = [
      { name: "Oxygen Concentrator", key: "oxygen" },
      { name: "Bipap", key: "bipap" },
      { name: "Auto Cpap", key: "cpap" },
      { name: "Patient Monitor", key: "monitor" },
      { name: "Surgical Cot", key: "cot" },
      { name: "Wheel Chair", key: "chair" }
    ];

    const hiredEquipments = standardEquipments.filter(eq => 
      rental.equipment.toLowerCase().includes(eq.key)
    );

    if (hiredEquipments.length > 0) {
      finalEquipRows = hiredEquipments.map(eq => `
        <tr>
          <td style="padding: 6px 10px;">${eq.name}</td>
          <td style="padding: 6px 10px; text-align: center; font-weight: bold; color: #059669;">YES</td>
          <td style="padding: 6px 10px;">${rental.model || 'BMC-D'}</td>
          <td style="padding: 6px 10px; font-family: monospace;">${rental.serial || 'XXXX'}</td>
          <td style="padding: 6px 10px;"></td>
          <td style="padding: 6px 10px;"></td>
        </tr>
      `).join('');
    } else {
      // If it's a custom equipment name
      finalEquipRows = `
        <tr>
          <td style="padding: 6px 10px; font-weight: bold;">${rental.equipment}</td>
          <td style="padding: 6px 10px; text-align: center; font-weight: bold; color: #059669;">YES</td>
          <td style="padding: 6px 10px;">${rental.model || 'Standard'}</td>
          <td style="padding: 6px 10px; font-family: monospace;">${rental.serial || 'XXXX'}</td>
          <td style="padding: 6px 10px;"></td>
          <td style="padding: 6px 10px;"></td>
        </tr>
      `;
    }
  }

  // Calculate rent and deposit details
  const isMonthly = rental.monthlyRent > 0;
  const rentVal = isMonthly ? (rental.monthlyRent || 0) : (rental.dailyRent || 0);
  const rentLabel = isMonthly ? "Monthly Rent Rate" : "Daily Rent Rate";
  const rentWords = convertNumberToWords(rentVal);

  const depositVal = rental.deposit || 0;
  const depositWords = convertNumberToWords(depositVal);

  // Rent paid
  let rentPaid = 0;
  if (rental.rentalPaymentStatus === "Paid") {
    rentPaid = rentVal;
  } else if (rental.rentalPaymentStatus === "Partial") {
    rentPaid = Number(rental.rentPaidAmount) || 0;
  }

  // Deposit paid
  let upfrontDepositPaid = 0;
  if (rental.depositPaymentStatus === "Paid") {
    upfrontDepositPaid = depositVal;
  } else if (rental.depositPaymentStatus === "Partial") {
    upfrontDepositPaid = Number(rental.depositPaidAmount) || 0;
  }

  // Additional items
  const selectedAddons = (rental.additionalItems || []).filter((item: any) => item.selected);
  
  // Calculate totals
  let totalDue = depositVal + rentVal;
  let totalPaid = upfrontDepositPaid + rentPaid;

  selectedAddons.forEach((item: any) => {
    if (item.status !== "Free of Cost") {
      totalDue += Number(item.amount) || 0;
    }
    if (item.status === "Paid") {
      totalPaid += Number(item.amount) || 0;
    }
  });

  const balanceDue = totalDue - totalPaid;

  const totalDueWords = convertNumberToWords(totalDue);
  const totalPaidWords = convertNumberToWords(totalPaid);
  const balanceDueWords = convertNumberToWords(balanceDue);

  // Build the table rows HTML dynamically
  let tableRowsHtml = `
    <tr>
      <td style="font-weight: bold;">${rentLabel}</td>
      <td style="text-align: right;">Rs. ${rentVal.toLocaleString("en-IN")}</td>
      <td style="text-align: right;">Rs. ${rentPaid.toLocaleString("en-IN")}</td>
      <td>Status: <strong>${rental.rentalPaymentStatus || 'Not Paid'}</strong></td>
    </tr>
    <tr>
      <td style="font-weight: bold;">Security Deposit</td>
      <td style="text-align: right;">Rs. ${depositVal.toLocaleString("en-IN")}</td>
      <td style="text-align: right;">Rs. ${upfrontDepositPaid.toLocaleString("en-IN")}</td>
      <td>Status: <strong>${rental.depositPaymentStatus || 'Not Paid'}</strong></td>
    </tr>
  `;

  selectedAddons.forEach((item: any) => {
    const itemDue = item.status === "Free of Cost" ? 0 : item.amount;
    const itemPaid = item.status === "Paid" ? item.amount : 0;
    tableRowsHtml += `
      <tr>
        <td style="font-weight: bold;">${item.name}</td>
        <td style="text-align: right;">Rs. ${itemDue.toLocaleString("en-IN")}</td>
        <td style="text-align: right;">Rs. ${itemPaid.toLocaleString("en-IN")}</td>
        <td>Status: <strong>${item.status || 'Not Paid'}</strong></td>
      </tr>
    `;
  });

  tableRowsHtml += `
    <tr style="background-color: #f8fafc; font-weight: bold;">
      <td style="font-weight: bold;">Total Upfront Amount Due</td>
      <td style="text-align: right;">Rs. ${totalDue.toLocaleString("en-IN")}</td>
      <td colspan="2" style="font-weight: normal; font-size: 11px; color: #475569;">Rs. ${totalDueWords}</td>
    </tr>
    <tr style="background-color: #f0fdf4; font-weight: bold; color: #15803d;">
      <td style="font-weight: bold;">Total Amount Paid</td>
      <td colspan="2" style="text-align: right; padding-right: 35px;">Rs. ${totalPaid.toLocaleString("en-IN")}</td>
      <td style="font-weight: normal; font-size: 11px;">Rs. ${totalPaidWords}</td>
    </tr>
    <tr style="font-weight: bold; ${balanceDue > 0 ? 'background-color: #fef2f2; color: #b91c1c;' : 'background-color: #f0fdf4; color: #15803d;'}">
      <td style="font-weight: bold;">Remaining Balance Due</td>
      <td colspan="2" style="text-align: right; padding-right: 35px;">Rs. ${balanceDue.toLocaleString("en-IN")}</td>
      <td style="font-weight: normal; font-size: 11px;">${balanceDue > 0 ? 'Rs. ' + balanceDueWords : 'Fully Paid'}</td>
    </tr>
  `;

  // Calculate dynamic logs for page 3
  const paymentsList = getPayments().filter(p => p.agreement === rental.id && p.status === "Paid");
  let totalRentPaidWithoutDeposit = paymentsList
    .filter(p => p.type === "Rent" || p.type === "Rent Payment")
    .reduce((sum, p) => sum + p.amount, 0);
  
  if (totalRentPaidWithoutDeposit === 0 && (rental.rentalPaymentStatus === "Paid" || rental.rentalPaymentStatus === "Partial")) {
    totalRentPaidWithoutDeposit = rental.rentPaidAmount || rental.totalRent || rental.monthlyRent || 0;
  }

  let depositPaid = paymentsList
    .filter(p => p.type === "Deposit" || p.type === "Security Deposit")
    .reduce((sum, p) => sum + p.amount, 0);
  if (depositPaid === 0 && (rental.depositPaymentStatus === "Paid" || rental.depositPaymentStatus === "Partial")) {
    depositPaid = rental.depositPaidAmount || rental.deposit || 0;
  }

  const overallPaid = totalRentPaidWithoutDeposit + depositPaid;
  
  const todayStr = getLocalYYYYMMDD();
  const reportEndDate = rental.status === "Completed" ? (rental.end || todayStr) : todayStr;
  const actualDurationText = calculateDurationBetween(rental.start, reportEndDate);
  const totalRentToBePaid = calculateRentForDuration(rental.start, reportEndDate, rental.monthlyRent || 0, rental.dailyRent || 0);

  let dueFromCustomer = 0;
  let refundFromRelife = 0;
  if (overallPaid > totalRentToBePaid) {
    refundFromRelife = overallPaid - totalRentToBePaid;
  } else {
    dueFromCustomer = totalRentToBePaid - overallPaid;
  }

  // Format payments log table (side-by-side columns up to 72 payments)
  const leftRows: string[] = [];
  const rightRows: string[] = [];
  
  for (let i = 0; i <= 36; i++) {
    const leftPay = paymentsList[i];
    const rightPay = paymentsList[i + 37];
    
    leftRows.push(`
      <tr>
        <td style="border: 1px solid #1e293b; padding: 4px; text-align: center; font-size: 11px;">${i + 1}</td>
        <td style="border: 1px solid #1e293b; padding: 4px; text-align: right; font-size: 11px;">${leftPay ? '₹' + leftPay.amount.toLocaleString("en-IN") : ''}</td>
        <td style="border: 1px solid #1e293b; padding: 4px; text-align: center; font-size: 11px;">${leftPay ? new Date(leftPay.date).toLocaleDateString('en-IN') : ''}</td>
      </tr>
    `);
    
    rightRows.push(`
      <tr>
        <td style="border: 1px solid #1e293b; padding: 4px; text-align: center; font-size: 11px;">${i + 38}</td>
        <td style="border: 1px solid #1e293b; padding: 4px; text-align: right; font-size: 11px;">${rightPay ? '₹' + rightPay.amount.toLocaleString("en-IN") : ''}</td>
        <td style="border: 1px solid #1e293b; padding: 4px; text-align: center; font-size: 11px;">${rightPay ? new Date(rightPay.date).toLocaleDateString('en-IN') : ''}</td>
      </tr>
    `);
  }

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Agreement ${rental.id}</title>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 15mm;
    }
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      color: #1e293b;
      margin: 0;
      padding: 0;
      line-height: 1.4;
      font-size: 12.5px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      ${isZoomedPreview ? 'zoom: 0.65; max-width: 794px; margin: 20px auto; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); border: 1px solid #e2e8f0; padding: 40px !important;' : ''}
    }
    .page {
      width: 100%;
      box-sizing: border-box;
      position: relative;
    }
    .page-break {
      page-break-after: always;
      break-after: page;
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
      border: none;
      margin-bottom: 12px;
    }
    .header-logo {
      width: 130px;
      vertical-align: middle;
    }
    .header-text {
      text-align: right;
      vertical-align: middle;
    }
    .company-title {
      font-size: 28px;
      font-weight: 800;
      color: #ef4444;
      margin: 0;
      line-height: 1.1;
    }
    .company-subtitle {
      font-size: 11px;
      color: #2563eb;
      font-weight: 600;
      margin: 4px 0 0 0;
      line-height: 1.3;
    }
    .company-contact {
      font-size: 10.5px;
      color: #475569;
      margin: 3px 0 0 0;
      line-height: 1.3;
    }
    .blue-divider {
      border-bottom: 2.5px solid #2563eb;
      margin-bottom: 15px;
    }
    .meta-table {
      width: 100%;
      border-collapse: collapse;
      border: none;
      margin-bottom: 15px;
    }
    .doc-title {
      text-align: center;
      font-size: 15px;
      font-weight: 800;
      color: #ef4444;
      text-decoration: underline;
      margin-bottom: 15px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .section-title {
      font-size: 13px;
      font-weight: 800;
      color: #ef4444;
      text-decoration: underline;
      margin-top: 18px;
      margin-bottom: 8px;
      text-transform: uppercase;
    }
    .details-list {
      margin-bottom: 15px;
    }
    .details-row {
      margin-bottom: 4px;
    }
    .details-label {
      font-weight: 700;
      width: 150px;
      display: inline-block;
    }
    .details-value {
      display: inline-block;
    }
    .p-body {
      text-align: justify;
      text-justify: inter-word;
      margin-bottom: 12px;
      font-size: 12.5px;
      line-height: 1.45;
    }
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 15px;
    }
    table.data-table th, table.data-table td {
      border: 1px solid #1e293b;
      padding: 7px 10px;
      font-size: 12px;
      text-align: left;
    }
    table.data-table th {
      background-color: #f1f5f9;
      font-weight: 800;
    }
    .signature-container {
      display: flex;
      justify-content: space-between;
      margin-top: 40px;
      padding-top: 15px;
    }
    .sig-column {
      width: 45%;
      text-align: left;
    }
    .sig-column-right {
      width: 45%;
      text-align: right;
    }
    .sig-box {
      height: 60px;
      display: flex;
      align-items: flex-end;
      margin-bottom: 8px;
    }
    ol.terms-list {
      margin-left: 0;
      padding-left: 18px;
      font-size: 12px;
    }
    ol.terms-list li {
      margin-bottom: 6px;
      text-align: justify;
    }
  </style>
</head>
<body>
  <!-- ════════════════ PAGE 1 ════════════════ -->
  <div class="page">
    <table class="header-table">
      <tr>
        <td class="header-logo">
          <img src="${origin}/images/logo.png" alt="Relife Logo" style="height: 65px; width: auto; object-fit: contain;" />
        </td>
        <td class="header-text">
          <h1 class="company-title">Relife Medical Technologies</h1>
          <p class="company-subtitle">Behind House No.MIG-15, Left to Prasanna Lingeshwara Temple,<br>Near Vijaya Bank Circle, Kuvempunagar, Mysore-570023.</p>
          <p class="company-contact">Mob No - 8660095261, 8951585261, 8123828442<br>GSTIN-29DCVPS6218E1ZX, Drug Licence No-KA-MY1-233278/79</p>
        </td>
      </tr>
    </table>
    
    <div class="blue-divider"></div>
    
    <table class="meta-table">
      <tr>
        <td style="font-weight: bold; font-size: 13px; color: #ef4444;">Agreement No: ${rental.id}</td>
        <td style="text-align: right; font-weight: bold; font-size: 13px; color: #ef4444;">Date: ${formattedStartDate}</td>
      </tr>
    </table>
    
    <div class="doc-title">EQUIPMENT RENTAL AGREEMENT</div>
    
    <p class="p-body">
      This Equipment Rental Agreement dated <strong>${formattedStartDate}</strong> between the Lessor of the first party <strong>"M/s Relife Medical Technologies, Mysore"</strong> and the Lessee of the second party
    </p>
    
    <div class="details-list">
      <div class="details-row"><span class="details-label">Customer Name:</span><span class="details-value">${customerName}</span></div>
      <div class="details-row"><span class="details-label">Customer Address:</span><span class="details-value">${customerAddress}, ${customerArea ? customerArea + ', ' : ''}${customerCity}, ${customerState} - ${customerPincode}</span></div>
      <div class="details-row"><span class="details-label">Mobile Numbers:</span><span class="details-value">${customerPhone}${customerAltPhone ? ', ' + customerAltPhone : ''}</span></div>
    </div>
    
    <p class="p-body">
      The lessor and the Lessee are collectively the parties in consideration of the mutual convenient are promises in this agreement the sufficiency of which the parties acknowledge the Lessor has rented the below equipment to Lessee. The Lessee has hired the equipment from the Lessor on the following terms and conditions.
    </p>
    
    <div class="section-title">EQUIPMENT DETAILS ARE AS FOLLOWS: -</div>
    <table class="data-table">
      <thead>
        <tr>
          <th>Equipment Name</th>
          <th style="text-align: center;">Hired</th>
          <th>Model</th>
          <th>M/C Sr.No</th>
          <th>Ref.No</th>
          <th>Ref.Date</th>
        </tr>
      </thead>
      <tbody>
        ${finalEquipRows}
      </tbody>
    </table>
    
    <div class="section-title">RENT AND DEPOSIT DETAILS: -</div>
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 220px;">Upfront Charge Details</th>
          <th style="width: 120px; text-align: right;">Amount Due</th>
          <th style="width: 120px; text-align: right;">Amount Paid</th>
          <th>Payment Status</th>
        </tr>
      </thead>
      <tbody>
        ${tableRowsHtml}
        <tr>
          <td style="font-weight: bold;">Payment Mode</td>
          <td colspan="3">
            ${totalPaid > 0 ? `
              ${rental.paymentMode || 'Cash'}
              ${rental.paymentMode === 'Cash+Bank' ? ` <strong>(Cash: Rs. ${(rental.cashPaidAmount || 0).toLocaleString("en-IN")}, Bank/UPI: Rs. ${(rental.bankUpiPaidAmount || 0).toLocaleString("en-IN")})</strong>` : ''}
              ${rental.paymentCollectedBy ? ' (Collected By: ' + rental.paymentCollectedBy + ')' : ''}
            ` : 'N/A'}
          </td>
        </tr>
        <tr>
          <td style="font-weight: bold; vertical-align: top;">Note:-</td>
          <td colspan="3">Extra payment is for one-time accessory or personal purchases, non-returnable and non-refundable.</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Remarks</td>
          <td colspan="3">${rental.remarks || 'N/A'}</td>
        </tr>
      </tbody>
    </table>
  </div>
  
  <div class="page-break"></div>
  
  <!-- ════════════════ PAGE 2 ════════════════ -->
  <div class="page">
    <div class="section-title" style="margin-top: 0;">HIRING TERMS & CONDITIONS: -</div>
    <ol class="terms-list" type="a">
      <li>The Lessor agrees to rent the above equipment to the Lessee, and the Lessee agrees to hire the above equipment from the Lessor in accordance with the terms set out in this agreement.</li>
      <li>This rental term commences from the date of rental agreement and will continue on a month-to-month or day-to-day basis until Lessor or the Lessee terminates this agreement.</li>
      <li>Lessee will have to carry out the machine from the Lessor office at the time of hiring and then Lessee must have to return the equipment to Lessor office on Lessee's own expense after completion of the term.</li>
      <li>Minimum one month rent will be applicable even if machine has returned early in between the rental term.</li>
      <li>Monthly rent should be paid from the Lessee on the term date for each month in advance based.</li>
      <li>First month rent will be taken in advance with the deposit amount.</li>
      <li>The Lessor will refund the deposit amount to Lessee at the end of the rental term.</li>
      <li>If the equipment is not returned or rent not paid from the Lessee, the Lessor has the fully authority to take legal action on Lessee.</li>
      <li>The equipment should be used under the supervision of a licensed physician.</li>
      <li>The Lessor shall not be responsible for any consequential loss directly or indirectly due to sudden cause of device fault / due to faulty operation.</li>
    </ol>
    
    <div class="section-title">REPAIR OF THE EQUIPMENT: -</div>
    <ol class="terms-list" type="a">
      <li>The Lessee must have to carry out the monthly preventive maintenance to keep the equipment in good working condition from the Lessee's own expense.</li>
      <li>The Lessee must have to bear their own expense if any fault/damage occurred due to mishandling of the equipment / due to power fluctuation in the house.</li>
      <li>The Lessor will not carry out any kind of service at Lessee's location / at patient location. The Lessee must have to bring the equipment for service/replacement purpose during the office hours only from 10am to 6pm except Sunday and holidays.</li>
      <li>The Lessee must have to keep one backup Oxygen cylinder / Ups for uninterrupted usage of the equipment on their own expense.</li>
      <li>Lessor shall not be able to provide service 24/7.</li>
    </ol>
    
    <div class="signature-container">
      <div class="sig-column">
        <span style="font-weight: bold; color: #ef4444; font-size: 13px;">For Relife Medical Technologies</span>
        <div class="sig-box">
          <img src="${origin}/images/logo.png" alt="Relife Logo" style="height: 38px; width: auto; object-fit: contain; transform: rotate(-5deg); opacity: 0.85;" />
        </div>
        <span style="font-weight: bold; color: #ef4444; font-size: 12px;">(Authorized Signatory)</span>
      </div>
      <div class="sig-column-right">
        <span style="font-weight: bold; font-size: 13px;">I agree to the above terms & conditions.</span>
        <div class="sig-box" style="justify-content: flex-end; align-items: flex-end; padding-bottom: 10px;">
          ${rental.signatureUrl ? `<img src="${rental.signatureUrl}" alt="Customer Signature" style="max-height: 50px; max-width: 150px; object-fit: contain;" />` : '<span style="border-bottom: 1px dotted #64748b; width: 150px; display: inline-block;"></span>'}
        </div>
        <span style="font-weight: bold; font-size: 12.5px;">Customer Name: ${customerName}</span><br>
        <span style="font-weight: bold; font-size: 11px; color: #64748b;">Customer Signature</span>
      </div>
    </div>
  </div>

  ${isPrintMode ? `
  <script>
    window.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        window.print();
      }, 500);
    });
  </script>
  ` : ''}
</body>
</html>
  `;

  return htmlContent;
}

export function printAgreement(rental: any) {
  if (!rental || typeof window === "undefined") return;
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to print/download the agreement.");
    return;
  }
  const htmlContent = getAgreementHtmlContent(rental, true);
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}

export function printReceipt(payment: any, customerName?: string) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  if (!payment || typeof window === "undefined") return;
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to print/download the receipt.");
    return;
  }

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Receipt ${payment.id}</title>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      color: #1e293b;
      margin: 0;
      padding: 40px;
      line-height: 1.5;
      background-color: #ffffff;
    }
    .container {
      max-width: 650px;
      margin: 0 auto;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 40px;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05);
      position: relative;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #10b981;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .logo-area h1 {
      font-family: 'Outfit', sans-serif;
      font-size: 26px;
      font-weight: 800;
      color: #065f46;
      margin: 0;
      letter-spacing: -0.02em;
    }
    .logo-area p {
      font-size: 11px;
      color: #64748b;
      margin: 4px 0 0 0;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .doc-type {
      text-align: right;
    }
    .doc-type h2 {
      font-family: 'Outfit', sans-serif;
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }
    .doc-type p {
      font-size: 12px;
      font-family: monospace;
      color: #10b981;
      margin: 4px 0 0 0;
      font-weight: bold;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 30px;
      font-size: 13.5px;
    }
    .info-label {
      color: #64748b;
    }
    .info-value {
      font-weight: 600;
      color: #0f172a;
      text-align: right;
    }
    .receipt-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #f1f5f9;
    }
    .receipt-row:last-child {
      border-bottom: none;
    }
    .total-box {
      background-color: #ecfdf5;
      border: 1px solid #d1fae5;
      border-radius: 12px;
      padding: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 20px;
      margin-bottom: 30px;
    }
    .total-label {
      font-weight: 700;
      color: #065f46;
      font-size: 14px;
      text-transform: uppercase;
    }
    .total-amount {
      font-family: 'Outfit', sans-serif;
      font-size: 24px;
      font-weight: 800;
      color: #047857;
    }
    .status-badge {
      display: inline-block;
      background-color: #d1fae5;
      color: #065f46;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      padding: 4px 10px;
      border-radius: 9999px;
      letter-spacing: 0.05em;
    }
    .footer-note {
      text-align: center;
      font-size: 12px;
      color: #64748b;
      margin-top: 40px;
      border-top: 1px dashed #e2e8f0;
      padding-top: 20px;
    }
    .no-print-btn {
      display: block;
      width: max-content;
      margin: 20px auto 0 auto;
      padding: 10px 20px;
      background-color: #10b981;
      color: white;
      border: none;
      border-radius: 8px;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 6px -1px rgb(16 185 129 / 0.2);
      transition: background-color 0.2s;
    }
    .no-print-btn:hover {
      background-color: #059669;
    }
    @media print {
      body {
        padding: 0;
        background-color: transparent;
      }
      .container {
        border: none;
        box-shadow: none;
        padding: 0;
      }
      .no-print-btn {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-area" style="display: flex; flex-direction: column; align-items: flex-start;">
        <img src="${origin}/images/logo.png" alt="Relife Medical Technologies" style="height: 48px; width: auto; object-fit: contain;" />
      </div>
      <div class="doc-type">
        <h2>PAYMENT RECEIPT</h2>
        <p class="font-mono">${payment.id}</p>
      </div>
    </div>

    <div class="info-grid">
      <div style="grid-column: span 2; background-color: #f8fafc; border-radius: 12px; padding: 16px; margin-bottom: 10px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="font-size: 12px; color: #64748b; font-weight: 700; text-transform: uppercase;">Billed To</span>
          <span style="font-size: 12px; color: #64748b; font-weight: 700; text-transform: uppercase;">Transaction Info</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <div>
            <p style="margin: 0; font-weight: 700; font-size: 15px;">${customerName || payment.customer || "Valued Customer"}</p>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b; font-family: monospace;">ID: ${payment.customerId || "N/A"}</p>
          </div>
          <div style="text-align: right;">
            <p style="margin: 0; font-size: 13px;"><strong>Date:</strong> ${payment.date}</p>
            <p style="margin: 4px 0 0 0; font-size: 13px;"><strong>Agreement:</strong> <span style="font-family: monospace; color: #0284c7; font-weight: bold;">${payment.agreement || "N/A"}</span></p>
          </div>
        </div>
      </div>
    </div>

    <div style="margin-bottom: 20px;">
      <div class="receipt-row">
        <span class="info-label">Payment Category / Type</span>
        <span class="info-value">${payment.type}</span>
      </div>
      <div class="receipt-row">
        <span class="info-label">Payment Mode</span>
        <span class="info-value">${payment.mode}</span>
      </div>
      <div class="receipt-row">
        <span class="info-label">Reference Number (Tx Ref)</span>
        <span class="info-value font-mono">${payment.txRef || "N/A"}</span>
      </div>
      ${cleanNum((payment as any).discount) > 0 ? `
      <div class="receipt-row">
        <span class="info-label">Gross Amount</span>
        <span class="info-value">Rs. ${cleanNum((payment as any).grossAmount || cleanNum(payment.amount) + cleanNum((payment as any).discount)).toLocaleString("en-IN")}</span>
      </div>
      <div class="receipt-row">
        <span class="info-label">Rental Discount</span>
        <span class="info-value" style="color: #16a34a;">- Rs. ${cleanNum((payment as any).discount).toLocaleString("en-IN")}</span>
      </div>` : ""}
      <div class="receipt-row">
        <span class="info-label">Transaction Status</span>
        <span class="info-value"><span class="status-badge">SUCCESSFUL</span></span>
      </div>
    </div>

    <div class="total-box">
      <span class="total-label">Total Amount Paid</span>
      <span class="total-amount">₹${payment.amount?.toLocaleString("en-IN") || "0"}</span>
    </div>

    <div class="footer-note">
      <p style="margin: 0; font-weight: 600; color: #475569;">Thank you for your business!</p>
      <p style="margin: 4px 0 0 0; font-size: 11px;">This is a digitally generated e-receipt. No physical signature is required.</p>
    </div>
  </div>

  <script>
    window.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        window.print();
      }, 500);
    });
  </script>
</body>
</html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}

export function getReturnReceiptHtmlContent(ret: any, isPrintMode: boolean = false, isZoomedPreview: boolean = false): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  if (!ret) return "";

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Return Agreement ${ret.id}</title>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 15mm;
    }
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      color: #1e293b;
      margin: 0;
      padding: 0;
      line-height: 1.45;
      font-size: 12.5px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      ${isZoomedPreview ? 'zoom: 0.65; max-width: 794px; margin: 20px auto; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); border: 1px solid #e2e8f0; padding: 40px !important;' : ''}
    }
    .page {
      width: 100%;
      box-sizing: border-box;
      position: relative;
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
      border: none;
      margin-bottom: 12px;
    }
    .header-logo {
      width: 130px;
      vertical-align: middle;
    }
    .header-text {
      text-align: right;
      vertical-align: middle;
    }
    .company-title {
      font-size: 28px;
      font-weight: 800;
      color: #ef4444;
      margin: 0;
      line-height: 1.1;
    }
    .company-subtitle {
      font-size: 11px;
      color: #2563eb;
      font-weight: 600;
      margin: 4px 0 0 0;
      line-height: 1.3;
    }
    .company-contact {
      font-size: 10.5px;
      color: #475569;
      margin: 3px 0 0 0;
      line-height: 1.3;
    }
    .blue-divider {
      border-bottom: 2.5px solid #2563eb;
      margin-bottom: 15px;
    }
    .meta-table {
      width: 100%;
      border-collapse: collapse;
      border: none;
      margin-bottom: 15px;
    }
    .doc-title {
      text-align: center;
      font-size: 15px;
      font-weight: 800;
      color: #ef4444;
      text-decoration: underline;
      margin-bottom: 15px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .section-title {
      font-size: 13px;
      font-weight: 800;
      color: #ef4444;
      text-decoration: underline;
      margin-top: 18px;
      margin-bottom: 8px;
      text-transform: uppercase;
    }
    .details-list {
      margin-bottom: 15px;
    }
    .details-row {
      margin-bottom: 4px;
    }
    .details-label {
      font-weight: 700;
      width: 150px;
      display: inline-block;
    }
    .details-value {
      display: inline-block;
    }
    .p-body {
      text-align: justify;
      text-justify: inter-word;
      margin-bottom: 12px;
      font-size: 12.5px;
      line-height: 1.45;
    }
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 15px;
    }
    table.data-table th, table.data-table td {
      border: 1px solid #1e293b;
      padding: 7px 10px;
      font-size: 12px;
      text-align: left;
    }
    table.data-table th {
      background-color: #f1f5f9;
      font-weight: 800;
    }
    .signature-container {
      display: flex;
      justify-content: space-between;
      margin-top: 40px;
      padding-top: 15px;
    }
    .sig-column {
      width: 45%;
      text-align: left;
    }
    .sig-column-right {
      width: 45%;
      text-align: right;
    }
    .sig-box {
      height: 60px;
      display: flex;
      align-items: flex-end;
      margin-bottom: 8px;
    }
  </style>
</head>
<body>
  <div class="page">
    <table class="header-table">
      <tr>
        <td class="header-logo">
          <img src="/images/logo.png" alt="Relife Logo" style="height: 65px; width: auto; object-fit: contain;" />
        </td>
        <td class="header-text">
          <h1 class="company-title">Relife Medical Technologies</h1>
          <p class="company-subtitle">Behind House No.MIG-15, Left to Prasanna Lingeshwara Temple,<br>Near Vijaya Bank Circle, Kuvempunagar, Mysore-570023.</p>
          <p class="company-contact">Mob No - 8660095261, 8951585261, 8123828442<br>GSTIN-29DCVPS6218E1ZX, Drug Licence No-KA-MY1-233278/79</p>
        </td>
      </tr>
    </table>
    
    <div class="blue-divider"></div>
    
    <table class="meta-table">
      <tr>
        <td style="font-weight: bold; font-size: 13px; color: #ef4444;">Return ID: ${ret.id}</td>
        <td style="text-align: right; font-weight: bold; font-size: 13px; color: #ef4444;">Date: ${ret.date}</td>
      </tr>
    </table>
    
    <div class="doc-title">EQUIPMENT RETURN & SETTLEMENT AGREEMENT</div>
    
    <p class="p-body">
      This Return Settlement Agreement confirms that the equipment detailed below has been returned by the Lessee to the Lessor <strong>"M/s Relife Medical Technologies, Mysore"</strong>, in the condition stated, and the financial reconciliation has been completed as follows:
    </p>
    
    <div class="details-list">
      <div class="details-row"><span class="details-label">Customer Name:</span><span class="details-value">${ret.customer}</span></div>
      <div class="details-row"><span class="details-label">Agreement ID:</span><span class="details-value">${ret.agreement}</span></div>
      ${ret.collectedBy ? `<div class="details-row"><span class="details-label">Return Collected By:</span><span class="details-value">${ret.collectedBy}</span></div>` : ''}
    </div>
    
    <div class="section-title">RETURNED EQUIPMENT DETAILS: -</div>
    <table class="data-table">
      <thead>
        <tr>
          <th>Equipment Name</th>
          <th style="width: 150px; text-align: center;">Returned Condition</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="font-weight: bold;">${ret.equipment}</td>
          <td style="text-align: center; font-weight: bold; color: ${ret.condition?.toLowerCase()?.includes('maint') ? '#d97706' : '#16a34a'};">${ret.condition || 'Good'}</td>
        </tr>
      </tbody>
    </table>
    
    <div class="section-title">FINANCIAL RECONCILIATION LEDGER: -</div>
    <table class="data-table">
      <thead>
        <tr>
          <th>Ledger Item Description</th>
          <th style="width: 150px; text-align: right;">Amount Details</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Original Security Deposit Paid (Credit)</td>
          <td style="text-align: right; font-weight: 600; color: #16a34a;">+ Rs. ${ret.deposit?.toLocaleString("en-IN") || "0"}</td>
        </tr>
        ${ret.finalRent > 0 ? `
        <tr>
          <td>Adjusted Pro-Rata Rent Charges (Debit)</td>
          <td style="text-align: right; color: #dc2626;">− Rs. ${ret.finalRent?.toLocaleString("en-IN") || "0"}</td>
        </tr>
        ` : ""}
        ${ret.unpaidAccessoryTotal > 0 ? `
        <tr>
          <td>Deductions: Unpaid Accessories / Additional Items (Debit)</td>
          <td style="text-align: right; color: #dc2626;">− Rs. ${ret.unpaidAccessoryTotal?.toLocaleString("en-IN") || "0"}</td>
        </tr>
        ` : ""}
        ${ret.damageCharges > 0 ? `
        <tr>
          <td>Deductions: Damage Assessment Charges (Debit)</td>
          <td style="text-align: right; color: #dc2626;">− Rs. ${ret.damageCharges?.toLocaleString("en-IN") || "0"}</td>
        </tr>
        ` : ""}
        ${ret.pendingBalance > 0 ? `
        <tr>
          <td>Deductions: Overdue / Outstanding Balance (Debit)</td>
          <td style="text-align: right; color: #dc2626;">− Rs. ${ret.pendingBalance?.toLocaleString("en-IN") || "0"}</td>
        </tr>
        ` : ""}
        ${ret.discount > 0 ? `
        <tr>
          <td>Reconciliation Discount Offset (Credit)</td>
          <td style="text-align: right; font-weight: 600; color: #16a34a;">+ Rs. ${ret.discount?.toLocaleString("en-IN") || "0"}</td>
        </tr>
        ` : ""}
        
        <tr style="font-weight: bold; ${ret.refund >= 0 ? 'background-color: #f0fdf4; color: #15803d;' : 'background-color: #fef2f2; color: #b91c1c;'}">
          <td style="font-weight: bold;">
            ${ret.refund >= 0 ? "NET REFUND PAYABLE TO LESSEE" : "NET OUTSTANDING DUES PAYABLE TO LESSOR"}
          </td>
          <td style="text-align: right; font-weight: 800; font-size: 13.5px;">
            Rs. ${Math.abs(ret.refund || 0).toLocaleString("en-IN")}
          </td>
        </tr>
        <tr style="font-weight: bold; ${ret.refund >= 0 ? 'background-color: #f0fdf4; color: #15803d;' : (ret.duePaymentStatus === 'Not Paid' ? 'background-color: #fef2f2; color: #b91c1c;' : 'background-color: #f0fdf4; color: #15803d;')}">
          <td colspan="2" style="text-align: center; padding: 10px; border: 1.5px solid ${ret.refund >= 0 ? '#16a34a' : (ret.duePaymentStatus === 'Not Paid' ? '#dc2626' : '#16a34a')}; font-size: 13px;">
            ${ret.refund >= 0 
              ? `✓ STATUS: RETURNED SUCCESSFULLY & REFUNDED TOTAL AMOUNT OF Rs. ${Math.abs(ret.refund || 0).toLocaleString("en-IN")}`
              : (ret.duePaymentStatus === "Not Paid" 
                  ? `⚠️ STATUS: RETURNED — UNPAID PENDING DUE OF Rs. ${Math.abs(ret.refund || 0).toLocaleString("en-IN")}`
                  : `✓ STATUS: RETURNED SUCCESSFULLY & PAID TOTAL AMOUNT OF Rs. ${Math.abs(ret.refund || 0).toLocaleString("en-IN")}${ret.duePaymentMode ? ` (${ret.duePaymentMode.toUpperCase()})` : ''}`
                )
            }
          </td>
        </tr>
      </tbody>
    </table>

    <p class="p-body" style="font-size: 11px; color: #64748b; margin-top: 15px;">
      *Note: By signing below, both parties acknowledge and agree that the equipment has been returned and received in the stated condition, and that all financial claims and balances under this agreement are fully reconciled and settled.
    </p>
    
    <div class="signature-container">
      <div class="sig-column">
        <div class="sig-box">
          <span style="border-bottom: 1.5px solid #1e293b; width: 180px; display: inline-block;"></span>
        </div>
        <span style="font-weight: bold; font-size: 12px; color: #0f172a;">Signature of the Lessee (Customer)</span>
      </div>
      <div class="sig-column-right">
        <div class="sig-box" style="justify-content: flex-end;">
          <span style="border-bottom: 1.5px solid #1e293b; width: 180px; display: inline-block;"></span>
        </div>
        <span style="font-weight: bold; font-size: 12px; color: #0f172a;">For M/s Relife Medical Technologies</span>
      </div>
    </div>
  </div>

  ${isPrintMode ? `
  <script>
    window.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        window.print();
      }, 500);
    });
  </script>
  ` : ''}
</body>
</html>
  `;

  return htmlContent;
}

export function printReturnReceipt(ret: any) {
  if (!ret || typeof window === "undefined") return;
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to print/download the receipt.");
    return;
  }
  const htmlContent = getReturnReceiptHtmlContent(ret, true);
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}

export function getDocumentPreviewUrl(doc: DocumentItem): string {
  if (doc.fileData && doc.fileData !== "PDF" && doc.fileData.startsWith("data:")) {
    return doc.fileData;
  }

  // Check if this is a dynamic system agreement or return receipt
  const isAgreement = doc.type === "Agreement" || (doc.name.toLowerCase().includes("agreement") && !doc.name.toLowerCase().includes("return"));
  const isReturn = doc.type === "Return" || doc.name.toLowerCase().includes("return");

  if (isAgreement) {
    let rentalId = doc.rentalId;
    if (!rentalId) {
      const match = doc.name.match(/AGR-\d{4}-\d{4}/i);
      if (match) rentalId = match[0].toUpperCase();
    }
    const rental = getRentals().find(r => r.id === rentalId);
    if (rental) {
      const htmlContent = getAgreementHtmlContent(rental, false, true);
      return "data:text/html;charset=utf-8," + encodeURIComponent(htmlContent);
    }
  } else if (isReturn) {
    // BUG-5 FIX: Previous code only stripped "doc-" leaving "ret-RET-YYYY-NNNN"
    // which never matched any stored return. Strip the full "doc-ret-" prefix instead.
    // Also fixed the name regex — returns use RET-YYYY-NNNN (4+4 digits), not 4+4 from exchanges.
    const returns = getReturns();
    let cleanRetId = "";

    // 1. Try stripping the full "doc-ret-" prefix from the doc ID
    if (doc.id.startsWith("doc-ret-")) {
      cleanRetId = doc.id.replace("doc-ret-", "").toUpperCase();
    }

    // 2. Try extracting RET-YYYY-NNNN from the document name
    if (!cleanRetId) {
      const match = doc.name.match(/RET-\d{4}-\d{4}/i);
      if (match) cleanRetId = match[0].toUpperCase();
    }

    // 3. Fallback: use raw doc.id (covers edge cases)
    if (!cleanRetId) {
      cleanRetId = doc.id;
    }

    const ret = returns.find(r =>
      r.id === cleanRetId ||
      r.id === doc.id ||
      r.id.toUpperCase() === cleanRetId.toUpperCase()
    );
    if (ret) {
      const htmlContent = getReturnReceiptHtmlContent(ret, false, true);
      return "data:text/html;charset=utf-8," + encodeURIComponent(htmlContent);
    }
  }

  const docTypeLabel = doc.type || "Document";
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${doc.name} - Verification Sheet</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      margin: 0;
      padding: 30px;
      background-color: #f8fafc;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      box-sizing: border-box;
    }
    .card {
      width: 100%;
      max-width: 450px;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 30px;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
      text-align: center;
    }
    .logo {
      font-size: 28px;
      margin-bottom: 10px;
    }
    h2 {
      margin: 0;
      font-size: 20px;
      color: #0f172a;
    }
    .doc-name {
      font-family: monospace;
      font-size: 13px;
      color: #64748b;
      margin: 4px 0 20px 0;
      word-break: break-all;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      background-color: #d1fae5;
      color: #065f46;
      font-size: 10px;
      font-weight: bold;
      text-transform: uppercase;
      border-radius: 9999px;
      margin-bottom: 24px;
    }
    .details {
      text-align: left;
      border-top: 1px solid #f1f5f9;
      padding-top: 20px;
      margin-bottom: 24px;
    }
    .row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
      font-size: 13px;
    }
    .label {
      color: #64748b;
    }
    .value {
      font-weight: 600;
      color: #334155;
    }
    .footer {
      font-size: 11px;
      color: #94a3b8;
      border-top: 1px solid #f1f5f9;
      padding-top: 15px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">🔒</div>
    <h2>Document Archive</h2>
    <div class="doc-name">${doc.name}</div>
    <span class="badge">SECURELY ARCHIVED</span>
    
    <div class="details">
      <div class="row">
        <span class="label">Document ID</span>
        <span class="value" style="font-family: monospace;">${doc.id}</span>
      </div>
      <div class="row">
        <span class="label">Category</span>
        <span class="value">${docTypeLabel}</span>
      </div>
      <div class="row">
        <span class="label">Uploaded On</span>
        <span class="value">${doc.date}</span>
      </div>
      <div class="row">
        <span class="label">File Size</span>
        <span class="value">${doc.size || "150 KB"}</span>
      </div>
    </div>
    
    <div class="footer">
      MediRent Secure Document Vault
    </div>
  </div>
</body>
</html>
  `;
  return "data:text/html;charset=utf-8," + encodeURIComponent(htmlContent);
}

// Helper to convert base64 data URL to Blob
export function dataURLtoBlob(dataurl: string): Blob {
  const parts = dataurl.split(',');
  const mimeMatch = parts[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : '';
  const bstr = atob(parts[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

// Helper to download a base64 file safely using object URL
export function downloadBase64File(fileData: string, filename: string) {
  if (typeof window === "undefined" || !fileData) return;
  try {
    const blob = dataURLtoBlob(fileData);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 100);
  } catch (e) {
    console.error("Failed to download base64 file", e);
  }
}

// Universal Print Document Router for general uploads / previews.
// Returns false when the caller uploaded a real file (KYC, delivery photo,
// signed agreement, etc.) whose bytes genuinely aren't available anywhere —
// neither this device's IndexedDB nor the Google Sheets FileChunks backup —
// so the UI can say so instead of silently handing back a fake placeholder.
export async function printDocumentFile(doc: DocumentItem): Promise<boolean> {
  let fileData = doc.fileData;
  const isRealUploadType = doc.type !== "Agreement" && !doc.id.startsWith("doc-ret-") && !doc.id.startsWith("doc-pay-");

  if ((!fileData || fileData === "NOT_FOUND") && isRealUploadType) {
    fileData = await getFileFromIndexedDB(doc.id);
    // Not on this device — check the Google Sheets backup before giving up,
    // so downloads work on any device, not just the one that uploaded it.
    if (!fileData && isGSheetsEnabled()) {
      const remoteFileData = await downloadFileChunks(doc.id);
      if (remoteFileData) {
        fileData = remoteFileData;
        setFileInIndexedDB(doc.id, remoteFileData); // cache locally for next time
      }
    }
  }

  if (fileData && fileData !== "PDF" && fileData.startsWith("data:")) {
    downloadBase64File(fileData, doc.name);
    return true;
  }

  if (doc.type === "Agreement") {
    const rentals = getRentals();
    const rental = rentals.find(r => r.id === doc.rentalId || doc.id.endsWith(r.id) || doc.id.includes(r.id));
    if (rental) {
      printAgreement(rental);
      return true;
    }
  } else if (doc.type === "Invoice" || doc.type === "Receipt") {
    if (doc.id.startsWith("doc-ret-")) {
      const returns = getReturns();
      const retId = doc.id.replace("doc-ret-", "");
      const ret = returns.find(r => r.id === retId || doc.id.includes(r.id));
      if (ret) {
        printReturnReceipt(ret);
        return true;
      }
    }

    const payments = getPayments();
    const payId = doc.id.replace("doc-pay-", "");
    const payment = payments.find(p => p.id === payId || doc.id.includes(p.id));
    if (payment) {
      const customers = getCustomers();
      const customer = customers.find(c => c.id === payment.customerId);
      printReceipt(payment, customer?.name);
      return true;
    }
  }

  // A real uploaded file with no data anywhere has nothing to download —
  // don't hand back a fake "securely archived" placeholder for it.
  if (isRealUploadType) {
    return false;
  }

  // Fallback: If no real data and not system printable, download the generated verification sheet
  if (typeof window !== "undefined") {
    const previewUrl = getDocumentPreviewUrl(doc);
    const link = document.createElement("a");
    link.href = previewUrl;
    link.download = doc.name.endsWith(".html") ? doc.name : `${doc.name}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  return true;
}

/** Push any locally-held document files that never made it to the Google
 *  Sheets FileChunks backup (upload failed at the time, or GSheets wasn't
 *  connected yet). Run from the device that originally has the file — that's
 *  the only place the actual bytes exist — to make it downloadable/previewable
 *  from every other device from then on. */
export async function syncMissingFileChunks(
  onProgress?: (checked: number, total: number) => void
): Promise<{ checked: number; uploaded: number; alreadySynced: number; failed: number }> {
  const result = { checked: 0, uploaded: 0, alreadySynced: 0, failed: 0 };
  if (!isGSheetsEnabled()) return result;

  const docs = getDocuments();
  for (const doc of docs) {
    const localFileData = await getFileFromIndexedDB(doc.id);
    if (!localFileData) continue; // nothing on this device to push for this doc

    result.checked++;
    onProgress?.(result.checked, docs.length);

    const remote = await downloadFileChunks(doc.id);
    if (remote) {
      result.alreadySynced++;
      continue;
    }

    const uploaded = await uploadFileChunks(doc.id, localFileData);
    if (uploaded) {
      result.uploaded++;
    } else {
      result.failed++;
    }
  }

  return result;
}

// Print Annual Performance Report
export function printReport(reportData: {
  date: string;
  totalCustomers: number;
  activeRentals: number;
  availableStock: number;
  totalRevenue: number;
  monthlyRevenue: { month: string; current: number }[];
  utilization: { name: string; value: number }[];
}) {
  if (typeof window === "undefined") return;
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to print/download the report.");
    return;
  }

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Annual Performance Report</title>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      color: #1e293b;
      margin: 0;
      padding: 40px;
      line-height: 1.5;
      background-color: #ffffff;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 40px;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #3b82f6;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .logo {
      font-family: 'Outfit', sans-serif;
      font-size: 26px;
      font-weight: 800;
      color: #1e3a8a;
      margin: 0;
    }
    .doc-title {
      text-align: right;
    }
    .doc-title h2 {
      font-family: 'Outfit', sans-serif;
      font-size: 20px;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }
    .doc-title p {
      font-size: 12px;
      color: #64748b;
      margin: 4px 0 0 0;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 30px;
    }
    .kpi-card {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px;
      text-align: center;
    }
    .kpi-value {
      font-family: 'Outfit', sans-serif;
      font-size: 20px;
      font-weight: 700;
      color: #1e3a8a;
      margin-top: 4px;
    }
    .kpi-label {
      font-size: 11px;
      color: #64748b;
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.05em;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-bottom: 30px;
    }
    .section-title {
      font-family: 'Outfit', sans-serif;
      font-size: 14px;
      font-weight: 700;
      text-transform: uppercase;
      color: #475569;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 8px;
      margin-bottom: 12px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th {
      background-color: #f1f5f9;
      color: #475569;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      text-align: left;
      padding: 8px 12px;
      border: 1px solid #e2e8f0;
    }
    td {
      padding: 10px 12px;
      font-size: 13px;
      border: 1px solid #e2e8f0;
      color: #334155;
    }
    .text-right {
      text-align: right;
    }
    .no-print-btn {
      display: block;
      width: max-content;
      margin: 20px auto 0 auto;
      padding: 10px 20px;
      background-color: #2563eb;
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 6px -1px rgb(37 99 235 / 0.2);
    }
    @media print {
      body {
        padding: 0;
      }
      .container {
        border: none;
        box-shadow: none;
        padding: 0;
      }
      .no-print-btn {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">
        <img src="${origin}/images/logo.png" alt="Relife Logo" style="height: 36px; width: auto; object-fit: contain;" />
      </div>
      <div class="doc-title">
        <h2>Performance Report</h2>
        <p>${(() => {
          const d = new Date();
          const y = d.getFullYear();
          const fyString = d.getMonth() >= 3 ? `FY ${y}-${String(y+1).slice(-2)}` : `FY ${y-1}-${String(y).slice(-2)}`;
          return fyString;
        })()} | Generated: ${reportData.date}</p>
      </div>
    </div>
    
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Registered Customers</div>
        <div class="kpi-value">${reportData.totalCustomers}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Active Rentals</div>
        <div class="kpi-value">${reportData.activeRentals}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">In-Stock Equipment</div>
        <div class="kpi-value">${reportData.availableStock}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Total Collections</div>
        <div class="kpi-value">₹${reportData.totalRevenue.toLocaleString("en-IN")}</div>
      </div>
    </div>
    
    <div class="grid">
      <div>
        <div class="section-title">Revenue Breakdown</div>
        <table>
          <thead>
            <tr>
              <th>Month</th>
              <th class="text-right">Collection</th>
            </tr>
          </thead>
          <tbody>
            ${reportData.monthlyRevenue.map(m => `
              <tr>
                <td>${m.month}</td>
                <td class="text-right">₹${m.current.toLocaleString("en-IN")}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
      <div>
        <div class="section-title">Equipment Utilization Mix</div>
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th class="text-right">Utilization Rate</th>
            </tr>
          </thead>
          <tbody>
            ${reportData.utilization.map(u => `
              <tr>
                <td>${u.name}</td>
                <td class="text-right">${u.value}%</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  </div>
  <script>
    window.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        window.print();
      }, 500);
    });
  </script>
</body>
</html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}

/** Sync all entity tabs from Google Sheets and update localStorage */
export async function syncFromSheetsToLocalStorage(force = false) {
  if (!isGSheetsEnabled()) return;
  
  const syncStartTime = Date.now();
  
  if (!force) {
    const lastWrite = localStorage.getItem("medirent-last-write-time");
    if (lastWrite) {
      const timeSinceWrite = Date.now() - parseInt(lastWrite, 10);
      // BUG-1 FIX: Increased from 8s to 30s — GSheets upserts can take up to 10s,
      // so we need a wider buffer to prevent a pull from overwriting a pending write.
      if (timeSinceWrite < 30000) { // 30 seconds buffer
        console.log(`[GSheets] Auto-sync skipped to prevent race condition (last write was ${timeSinceWrite}ms ago)`);
        return;
      }
    }
  }
  
  // Clean up any stale sync entries (older than 2 minutes)
  cleanStalePendingSyncs();
  const pendingSyncs = getPendingSyncs();
  
  const entities = [
    { key: "medirent-customers", sheet: SHEETS.CUSTOMERS },
    { key: "medirent-equipment", sheet: SHEETS.EQUIPMENT },
    { key: "medirent-rentals", sheet: SHEETS.RENTALS },
    { key: "medirent-payments", sheet: SHEETS.PAYMENTS },
    { key: "medirent-returns", sheet: SHEETS.RETURNS },
    { key: "medirent-owners", sheet: SHEETS.OWNERS },
    { key: "medirent-documents", sheet: SHEETS.DOCUMENTS },
    { key: "medirent-exchanges", sheet: SHEETS.EXCHANGES },
    { key: "medirent-staff-users", sheet: SHEETS.STAFF },
    { key: "medirent-company-settings", sheet: SHEETS.SETTINGS },
  ];

  // Fetch all sheets in parallel to drastically improve loading speed from ~20s to ~2s
  const fetchPromises = entities.map(async (entity) => {
    try {
      const data = await readSheetData(entity.sheet);
      return { entity, data, error: null };
    } catch (e) {
      return { entity, data: null, error: e };
    }
  });

  const results = await Promise.all(fetchPromises);

  // Abort sync if a local write occurred after we started syncing to avoid overwriting newer local state
  const lastWriteAfter = localStorage.getItem("medirent-last-write-time");
  if (lastWriteAfter && parseInt(lastWriteAfter, 10) > syncStartTime) {
    console.log(`[GSheets] Aborting sync write because a local write occurred during fetch`);
    return;
  }

  let updatedAny = false;
  for (const { entity, data, error } of results) {
    if (error) {
      console.warn(`[GSheets] Sync failed for ${entity.sheet}:`, error);
      continue;
    }

    if (entity.key === "medirent-staff-users") {
      const localStaff = getStorageItem<any[]>("medirent-staff-users", []);
      // If sheet returns no users but local storage has users, push local users up to sheets
      if ((!data || data.length === 0) && localStaff.length > 0) {
        console.log(`[GSheets] Staff sheet is empty, uploading local staff accounts...`);
        localStaff.forEach((u) => {
          syncRowToSheet(SHEETS.STAFF, u);
        });
        continue;
      }
    }

    if (data) {
      let mergedData = [...(data as any[])];
      const pending = pendingSyncs.filter((s) => s.sheet === entity.sheet);
      const deletedRecords = getDeletedRecords().filter((r) => r.sheet === entity.sheet);

      // 1. Handle pending and persistent tombstones
      const deletedIds = new Set([
        ...pending.filter((p) => p.type === "delete").map((p) => String(p.id)),
        ...deletedRecords.map((r) => String(r.id)),
      ]);

      if (deletedIds.size > 0) {
        // If Google Sheets still returned items that were deleted locally, purge them from remote as well
        const survivingDeleted = mergedData.filter((item) => deletedIds.has(String(item.id)));
        if (survivingDeleted.length > 0 && isGSheetsEnabled()) {
          console.log(`[GSheets] Purging ${survivingDeleted.length} surviving deleted item(s) from ${entity.sheet}`);
          survivingDeleted.forEach((item) => {
            deleteRowFromSheet(entity.sheet, String(item.id));
          });
        }
        mergedData = mergedData.filter((item) => !deletedIds.has(String(item.id)));
      }
      
      // 2. Handle pending upserts
      const pendingUpserts = pending.filter((p) => p.type === "upsert");
      pendingUpserts.forEach((p) => {
        if (!p.data) return;
        const idx = mergedData.findIndex((item) => item.id === p.id);
        if (idx > -1) {
          mergedData[idx] = p.data;
        } else {
          mergedData.unshift(p.data); // Insert new item at the top of the array
        }
      });

      // Safety guard: a successful-but-empty remote response (missing tab, blank
      // spreadsheet, wrong sheet ID, transient read glitch) must never be treated
      // as "everything was deleted". Only explicit deletes (handled above via
      // pendingSyncs) are allowed to remove records — otherwise keep local data.
      if (entity.key !== "medirent-company-settings") {
        const localExisting = getStorageItem<any[]>(entity.key, []);
        if (mergedData.length === 0 && localExisting.length > 0) {
          console.warn(
            `[GSheets] Sync skipped for ${entity.sheet}: remote returned 0 rows but local has ${localExisting.length} record(s). Preserving local data instead of wiping it.`
          );
          continue;
        }
      }

      if (entity.key === "medirent-company-settings") {
        // Settings are stored as a single row with id="company-settings"
        // Restore as a plain object, not as an array
        const settingsRow = (mergedData as any[]).find((item: any) => item.id === "company-settings");
        if (settingsRow) {
          const { id, ...settingsOnly } = settingsRow;
          const localSettings = getStorageItem("medirent-company-settings", {});
          // Merge: remote settings take precedence, but don't wipe local if remote is empty
          const merged = Object.keys(settingsOnly).length > 0 ? { ...localSettings, ...settingsOnly } : localSettings;
          localStorage.setItem(entity.key, JSON.stringify(merged));
          updatedAny = true;
        }
        continue;
      } else if (entity.key === "medirent-documents") {
        const localDocs = getStorageItem<any[]>("medirent-documents", []);
        const mergedDocs = mergedData.map((item: any) => {
          const localDoc = localDocs.find((ld) => ld.id === item.id);
          if (localDoc && localDoc.fileData) {
            return { ...item, fileData: localDoc.fileData };
          }
          return item;
        });
        localStorage.setItem(entity.key, JSON.stringify(mergedDocs));
      } else {
        localStorage.setItem(entity.key, JSON.stringify(mergedData));
      }
      updatedAny = true;
    }
  }

  if (updatedAny && typeof window !== "undefined") {
    // The sync wrote directly to localStorage without going through setStorageItem,
    // so the last-write-time stamp wasn't bumped and the read caches are now stale.
    // Explicitly bust them before firing the update event so any handler that
    // immediately calls getRentals/getCustomers/getEquipment gets fresh data.
    _invalidateRentalsCache();
    window.dispatchEvent(new Event("medirent-db-updated"));
  }
}

// Predefined pricing table mapping for the first 31 days.
export const PRICING_TABLE: Record<number, [number, number, number, number]> = {
  1000: [500, 1000, 1000, 1000],
  1500: [500, 1000, 1500, 1500],
  2000: [1000, 1500, 2000, 2000],
  2500: [1000, 1500, 2000, 2500],
  2800: [1000, 1500, 2000, 2800],
  3000: [1000, 1500, 2000, 3000],
  3500: [1000, 1500, 2000, 3500],
  4000: [1500, 2000, 2500, 4000],
  4500: [1500, 2000, 3000, 4500],
  5000: [2000, 3000, 4000, 5000],
  5500: [2000, 3000, 4000, 5500],
  6000: [2000, 3000, 4000, 6000],
  6500: [2000, 3000, 4000, 6500],
  7000: [2500, 3500, 4500, 7000],
  7500: [2500, 3500, 5000, 7500],
  8000: [2500, 4000, 5000, 8000],
  9000: [3000, 4500, 6000, 9000],
  9500: [3500, 5000, 7000, 9500],
  10000: [3500, 5000, 7000, 10000],
  11000: [3500, 5500, 7500, 11000],
  12000: [4000, 6000, 8000, 12000],
  13000: [4500, 7500, 9000, 13000],
  15000: [6500, 7500, 10500, 15000],
  16000: [5500, 8500, 10500, 16000]
};

export const cleanNum = (val: any): number => {
  if (typeof val === "number") return isNaN(val) ? 0 : val;
  if (!val) return 0;
  const cleaned = String(val).replace(/[^\d.-]/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

export function getPricingTableRate(monthlyRent: number, days: number): number {
  const cleanMonthlyRent = cleanNum(monthlyRent);
  const cleanDays = cleanNum(days);
  let rates = PRICING_TABLE[cleanMonthlyRent];
  if (!rates) {
    const keys = Object.keys(PRICING_TABLE).map(Number).sort((a, b) => a - b);
    let bestKey = keys[0];
    let minDiff = Math.abs(keys[0] - cleanMonthlyRent);
    for (const key of keys) {
      const diff = Math.abs(key - cleanMonthlyRent);
      if (diff < minDiff) {
        minDiff = diff;
        bestKey = key;
      }
    }
    rates = PRICING_TABLE[bestKey];
  }
  
  if (cleanDays <= 5) return rates[0];
  if (cleanDays <= 10) return rates[1];
  if (cleanDays <= 15) return rates[2];
  return rates[3];
}

export function getReturnCalculatedRentPerItem(
  monthlyRent: number, 
  daysUsed: number, 
  startDateStr?: string, 
  endDateStr?: string
): number {
  const cleanMonthlyRent = cleanNum(monthlyRent);
  const cleanDaysUsed = cleanNum(daysUsed);
  if (cleanDaysUsed <= 0 || cleanMonthlyRent <= 0) return 0;
  
  let months = 0;
  let days = cleanDaysUsed;
  let hasValidDates = false;

  if (startDateStr && endDateStr) {
    const start = parseLocalDate(startDateStr);
    const end = parseLocalDate(endDateStr);
    if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start <= end) {
      months = end.getFullYear() - start.getFullYear();
      months = months * 12 + (end.getMonth() - start.getMonth());
      days = end.getDate() - start.getDate();
      if (days < 0) {
        months--;
        const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
        days += prevMonth.getDate();
      }
      hasValidDates = true;
    }
  }

  if (!hasValidDates) {
    months = Math.floor(cleanDaysUsed / 30);
    days = cleanDaysUsed % 30;
  }

  // 1. If inside the first month (i.e. months === 0)
  if (months === 0) {
    // Return according to the first-month pricing table slabs
    return getPricingTableRate(cleanMonthlyRent, days);
  }

  // 2. If after the first month (i.e. months >= 1)
  const baseRent = months * cleanMonthlyRent;
  
  if (days <= 5) {
    // 5 days grace period
    return baseRent;
  } else if (days <= 20) {
    // Up to 20 days, calculated day-wise
    const dailyRent = cleanMonthlyRent / 30;
    return Math.round(baseRent + (days * dailyRent));
  } else {
    // 21st day onwards, calculate the full month's rent
    return baseRent + cleanMonthlyRent;
  }
}

export function getRentPaidForAgreement(agreementId: string, monthlyRent: any, rentalPaymentStatus?: string): number {
  if (typeof window === "undefined") return 0;
  const rentals = getRentals();
  const rental = rentals.find(r => r.id === agreementId);

  const paymentsList = getPayments();
  const rentPayments = paymentsList.filter(
    (p: any) => p.agreement === agreementId && (p.type === "Rent" || p.type === "Rent Payment") && p.status === "Paid"
  );
  const totalRentPayments = rentPayments.reduce((sum, p) => sum + cleanNum(p.amount), 0);

  let initialPaid = 0;
  if (totalRentPayments === 0 && rental) {
    if (rental.rentalPaymentStatus === "Paid") {
      initialPaid = cleanNum(rental.rentPaidAmount || rental.monthlyRent || monthlyRent);
    } else if (rental.rentalPaymentStatus === "Partial") {
      initialPaid = cleanNum(rental.rentPaidAmount);
    }
  } else if (totalRentPayments === 0 && !rental) {
    if (rentalPaymentStatus === "Paid") {
      initialPaid = cleanNum(monthlyRent);
    }
  }
  return totalRentPayments + initialPaid;
}

export function getPaidForEquipment(rental: any, equipmentId: string, paymentsList: any[], excludeInitial = false): number {
  if (!rental) return 0;
  
  const items = rental.equipmentItems || [
    {
      equipmentId: rental.equipmentId,
      serial: rental.serial,
      monthlyRent: cleanNum(rental.monthlyRent),
      deposit: cleanNum(rental.deposit),
      returned: false
    }
  ];
  
  const currentItem = items.find((it: any) => it.equipmentId === equipmentId);
  if (!currentItem) return 0;

  const currentItemRent = cleanNum(currentItem.monthlyRent || currentItem.dailyRent || currentItem.rentRate);
  const totalRentalMonthlyRent = items.reduce((sum: number, it: any) => sum + cleanNum(it.monthlyRent || it.dailyRent || it.rentRate), 0);
  const shareRatio = totalRentalMonthlyRent > 0 ? (currentItemRent / totalRentalMonthlyRent) : (1 / Math.max(1, items.length));

  // 1. Direct payments for this specific equipment ID or notes mentioning this equipment
  const directPaid = paymentsList
    .filter((p) => p.agreement === rental.id && p.status === "Paid" && (p.type === "Rent" || p.type === "Rent Payment"))
    .filter((p) => p.equipmentId === equipmentId || (p.notes && currentItem.serial && String(p.notes).toLowerCase().includes(String(currentItem.serial).toLowerCase())))
    .reduce((sum, p) => sum + cleanNum(p.amount), 0);

  // 2. Shared/Agreement-level payments (not matching this item nor any other item's serial / equipmentId)
  const sharedPaymentsPaid = paymentsList
    .filter((p) => p.agreement === rental.id && p.status === "Paid" && (p.type === "Rent" || p.type === "Rent Payment"))
    .filter((p) => {
      if (p.equipmentId) return false;
      if (p.notes) {
        return !items.some((it: any) => it.serial && String(p.notes).toLowerCase().includes(String(it.serial).toLowerCase()));
      }
      return true;
    })
    .reduce((sum, p) => sum + cleanNum(p.amount), 0);
  
  // 3. Initial advance collected when the agreement was created. It lives on the
  //    rental record rather than as a Payment row, so it has to be added in
  //    separately - but only where no Payment row already accounts for it.
  const hasRecordedPayments = paymentsList.some((p) => p.agreement === rental.id && p.status === "Paid" && (p.type === "Rent" || p.type === "Rent Payment"));

  // ITEM-10 FIX: how much upfront rent this agreement can actually evidence.
  //
  //  - `rental.totalRent` used to sit in this fallback chain. It is the rent
  //    *charged* over the term, not money received, so any agreement with a
  //    blank rentPaidAmount reported its entire term's rent as already paid and
  //    the return settlement showed nothing owing.
  //  - A "Partial" agreement with no rentPaidAmount recorded evidences nothing
  //    collected; it previously fell through to a full `monthlyRent`, again
  //    erasing a genuine due. Only a "Paid" agreement implies the first cycle.
  const initialTotal = (() => {
    if (excludeInitial) return 0;
    const status = rental.rentalPaymentStatus;
    if (status !== "Paid" && status !== "Partial") return 0;
    const recorded = cleanNum(rental.rentPaidAmount);
    if (recorded > 0) return recorded;
    return status === "Paid" ? cleanNum(rental.monthlyRent) : 0;
  })();

  // A Payment row tagged to this item, or an untagged agreement-level payment,
  // already represents that money - adding the upfront amount too would count
  // the same rupees twice.
  const isInitialAlreadyBooked =
    hasRecordedPayments &&
    (sharedPaymentsPaid > 0 ||
      paymentsList.some((p) => p.agreement === rental.id && p.equipmentId === equipmentId));

  const initialPaid = isInitialAlreadyBooked ? 0 : Math.round(initialTotal * shareRatio);

  const totalShared = sharedPaymentsPaid;

  return directPaid + Math.round(totalShared * shareRatio) + initialPaid;
}

/** Real outstanding rent across all unreturned equipment items on a rental,
 *  from elapsed billing cycles minus payments actually recorded against it —
 *  the same methodology the Rent Dues page and Dashboard financial tab use.
 *  This is the source of truth for "is this rental actually overdue", as
 *  opposed to the stored status label, which a nominal end date alone can
 *  flip without regard to whether rent is actually unpaid. */
export function getRentalOutstandingBalance(rental: any, paymentsList: any[]): number {
  if (!rental) return 0;
  const start = parseLocalDate(rental.start);
  if (isNaN(start.getTime())) return 0;

  const eqItems = rental.equipmentItems || [
    {
      equipmentId: rental.equipmentId,
      serial: rental.serial,
      monthlyRent: cleanNum(rental.monthlyRent),
      dailyRent: cleanNum((rental as any).dailyRent),
      returned: false
    }
  ];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysElapsed = Math.ceil(Math.max(0, today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  return eqItems.reduce((total: number, item: any) => {
    if (item.returned) return total;
    const monthlyRent = cleanNum(item.monthlyRent || item.rentRate);
    const dailyRate = cleanNum(item.dailyRent) || cleanNum((rental as any).dailyRent);
    const isMonthly = (item.rentCycle || (rental as any).rentCycle)
      ? (item.rentCycle || (rental as any).rentCycle) === "Monthly"
      : (monthlyRent > 0 && dailyRate === 0);
    const totalDue = isMonthly ? Math.floor(daysElapsed / 30) * monthlyRent : daysElapsed * dailyRate;
    const paid = getPaidForEquipment(rental, item.equipmentId, paymentsList, true);
    return total + Math.max(0, totalDue - paid);
  }, 0);
}

export interface AgreementBalance {
  /** Rent that has fallen due from elapsed billing cycles, across unreturned items. */
  rentCharged: number;
  /** Rent actually recorded as received against this agreement. */
  rentPaid: number;
  /** Rent still owed (never negative). */
  rentDue: number;
  /** Security deposit agreed across unreturned items. */
  depositCharged: number;
  depositPaid: number;
  depositDue: number;
  /** Charges added to the agreement and still marked unpaid. */
  additionalDue: number;
  /** Everything still owed on this agreement. */
  totalDue: number;
}

/**
 * ITEM-19: one breakdown of what an agreement still owes, so the Collect
 * Payment screen can show the operator what they are collecting against instead
 * of asking them to work it out. Uses the same elapsed-cycle methodology as
 * getRentalOutstandingBalance so the figures agree with the Rent Dues page.
 */
export function getAgreementBalance(rental: any, paymentsList?: any[]): AgreementBalance {
  const empty: AgreementBalance = {
    rentCharged: 0, rentPaid: 0, rentDue: 0,
    depositCharged: 0, depositPaid: 0, depositDue: 0,
    additionalDue: 0, totalDue: 0,
  };
  if (!rental) return empty;

  const payments = paymentsList || (isBrowser ? getPayments() : []);
  const start = parseLocalDate(rental.start);

  const items = Array.isArray(rental.equipmentItems) && rental.equipmentItems.length > 0
    ? rental.equipmentItems
    : [{
        equipmentId: rental.equipmentId,
        serial: rental.serial,
        monthlyRent: cleanNum(rental.monthlyRent),
        dailyRent: cleanNum(rental.dailyRent),
        deposit: cleanNum(rental.deposit),
        returned: false,
      }];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysElapsed = isNaN(start.getTime())
    ? 0
    : Math.ceil(Math.max(0, today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  let rentCharged = 0;
  let rentPaid = 0;
  let depositCharged = 0;

  for (const item of items) {
    if (item.returned) continue;
    const monthlyRent = cleanNum(item.monthlyRent || item.rentRate);
    const dailyRate = cleanNum(item.dailyRent) || cleanNum(rental.dailyRent);
    // Honour the recorded cycle; fall back to the old inference only for line
    // items written before rentCycle was persisted on them.
    const cycle = item.rentCycle || rental.rentCycle;
    const isMonthly = cycle ? cycle === "Monthly" : (monthlyRent > 0 && dailyRate === 0);

    rentCharged += isMonthly
      ? Math.floor(daysElapsed / 30) * monthlyRent
      : daysElapsed * dailyRate;
    rentPaid += getPaidForEquipment(rental, item.equipmentId, payments, true);
    depositCharged += cleanNum(item.deposit);
  }

  // The upfront rent taken at signing is stored on the rental, not as a Payment
  // row, so add it in where no Payment row already represents it.
  const hasRentPayments = payments.some(
    (p: any) => p.agreement === rental.id && p.status === "Paid" && (p.type === "Rent" || p.type === "Rent Payment")
  );
  if (!hasRentPayments) {
    rentPaid += cleanNum(rental.rentPaidAmount);
  }

  const depositPaid = payments
    .filter((p: any) => p.agreement === rental.id && p.status === "Paid" && p.type === "Deposit")
    .reduce((sum: number, p: any) => sum + cleanNum(p.amount), 0) + cleanNum(rental.depositPaidAmount);

  const additionalDue = Array.isArray(rental.additionalItems)
    ? rental.additionalItems
        .filter((it: any) => it.selected && it.status === "Not Paid")
        .reduce((sum: number, it: any) => sum + cleanNum(it.amount), 0)
    : 0;

  const rentDue = Math.max(0, Math.round(rentCharged - rentPaid));
  const depositDue = Math.max(0, Math.round(depositCharged - depositPaid));

  return {
    rentCharged: Math.round(rentCharged),
    rentPaid: Math.round(rentPaid),
    rentDue,
    depositCharged: Math.round(depositCharged),
    depositPaid: Math.round(depositPaid),
    depositDue,
    additionalDue: Math.round(additionalDue),
    totalDue: rentDue + depositDue + Math.round(additionalDue),
  };
}

// ─── Exchanges Data Store ───────────────────────────────────────────────────

export interface ExchangeItem {
  id: string;
  agreementId: string;
  customer: string;
  customerId: string;
  currentEquipment: string;
  currentEquipmentId: string;
  currentEquipmentSerial: string;
  newEquipment: string;
  newEquipmentId: string;
  newEquipmentSerial: string;
  exchangeDate: string;
  releaseCondition: "Available" | "UnderMaintenance" | "Returned to Owner";
  reason: string;
  status: "Pending" | "Completed";
}

const initialExchanges: ExchangeItem[] = [];

export function getExchanges(): ExchangeItem[] {
  const list = getStorageItem("medirent-exchanges", initialExchanges);
  if (typeof window === "undefined") return sortLatestFirst(list, "exchangeDate") as ExchangeItem[];
  return sortLatestFirst(list, "exchangeDate") as ExchangeItem[];
}

export function getNextExchangeNumber(): string {
  if (!isBrowser) return `EXC-${new Date().getFullYear()}-0001`;
  const year = new Date().getFullYear();
  const key = `medirent-exc-counter-${year}`;
  // BUG-EXC FIX: Auto-align counter with the maximum ID in the database to prevent
  // duplicate/stale counters after a Google Sheets pull that restores exchanges data.
  const exchanges = getStorageItem<any[]>("medirent-exchanges", []);
  const yearPrefix = `EXC-${year}-`;
  let maxIdNum = parseInt(localStorage.getItem(key) || "0", 10);
  exchanges.forEach((e: any) => {
    if (e.id && e.id.startsWith(yearPrefix)) {
      const parts = e.id.split("-");
      const num = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(num) && num > maxIdNum) maxIdNum = num;
    }
  });
  const next = maxIdNum + 1;
  localStorage.setItem(key, next.toString());
  return `EXC-${year}-${String(next).padStart(4, "0")}`;
}

/** Returns the next exchange ID for display only — does NOT increment the counter.
 *  Use this in form initial state (useState), call getNextExchangeNumber() only on actual save.
 */
export function peekNextExchangeNumber(): string {
  if (!isBrowser) return `EXC-${new Date().getFullYear()}-0001`;
  const year = new Date().getFullYear();
  const key = `medirent-exc-counter-${year}`;
  // Auto-align peek with max existing ID (mirrors getNextExchangeNumber)
  const exchanges = getStorageItem<any[]>("medirent-exchanges", []);
  const yearPrefix = `EXC-${year}-`;
  let maxIdNum = parseInt(localStorage.getItem(key) || "0", 10);
  exchanges.forEach((e: any) => {
    if (e.id && e.id.startsWith(yearPrefix)) {
      const parts = e.id.split("-");
      const num = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(num) && num > maxIdNum) maxIdNum = num;
    }
  });
  return `EXC-${year}-${String(maxIdNum + 1).padStart(4, "0")}`;
}

export function saveExchange(exc: ExchangeItem) {
  const list = getExchanges();
  const index = list.findIndex((e) => e.id === exc.id);
  if (index > -1) {
    list[index] = exc;
  } else {
    list.unshift(exc);
  }
  setStorageItem("medirent-exchanges", list);

  // If status is Completed, execute the equipment swap in the rental agreement and inventory
  if (exc.status === "Completed") {
    // 1. Update Rental Agreement
    const rentals = getRentals();
    const rIndex = rentals.findIndex((r: any) => r.id === exc.agreementId);
    if (rIndex > -1) {
      const rental = rentals[rIndex];
      
      // Update equipmentItems list if present
      if (rental.equipmentItems && rental.equipmentItems.length > 0) {
        rental.equipmentItems = rental.equipmentItems.map((item: any) => {
          if (item.equipmentId === exc.currentEquipmentId) {
            return {
              ...item,
              equipmentId: exc.newEquipmentId,
              serial: exc.newEquipmentSerial,
              // Keep original monthly rent, deposit, etc.
            };
          }
          return item;
        });

        // Update active comma-separated fields for backward compatibility
        const activeItems = rental.equipmentItems.filter((item: any) => !item.returned);
        rental.equipmentId = activeItems.map((item: any) => item.equipmentId).join(", ");
        rental.serial = activeItems.map((item: any) => item.serial).join(", ");

        const eqList = getEquipment();
        rental.equipment = activeItems.map((item: any) => eqList.find(e => e.id === item.equipmentId)?.name || "Unknown").join(", ");
      } else {
        // Fallback for legacy rentals without equipmentItems
        rental.equipmentId = exc.newEquipmentId;
        rental.serial = exc.newEquipmentSerial;
        rental.equipment = exc.newEquipment;
      }

      setStorageItem("medirent-rentals", rentals);
      if (isGSheetsEnabled()) syncRowToSheet(SHEETS.RENTALS, rental as unknown as Record<string, unknown>);
    }

    updateEquipmentStatus(exc.currentEquipmentId, exc.releaseCondition || "UnderMaintenance");

    // 3. Mark the new equipment item as Rented
    updateEquipmentStatus(exc.newEquipmentId, "Rented");

    // 4. Sync owner status based on equipment swap
    const eqList = getEquipment();
    const affectedOwners = new Set<string>();
    const currentEq = eqList.find(e => e.id === exc.currentEquipmentId);
    const newEq = eqList.find(e => e.id === exc.newEquipmentId);
    if (currentEq?.owner) affectedOwners.add(currentEq.owner);
    if (newEq?.owner) affectedOwners.add(newEq.owner);
    affectedOwners.forEach((ownerName) => updateOwnerStatusByEquipment(ownerName));

    // 5. Auto-create a document for the exchange
    // BUG-EXC-DOC FIX: Use direct localStorage write instead of saveDocument() to avoid
    // dispatching medirent-db-updated event mid-save (matches saveRental/saveReturn pattern).
    const existingDocs = getDocuments();
    if (!existingDocs.some(d => d.id === `doc-exc-${exc.id}`)) {
      const excDoc: DocumentItem = {
        id: `doc-exc-${exc.id}`,
        name: `Exchange Slip ${exc.id}.pdf`,
        type: "Exchange Slip",
        size: "180 KB",
        date: new Date(exc.exchangeDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
        rentalId: exc.agreementId,
        customerId: exc.customerId,
      };
      const docList = getDocuments();
      docList.unshift(excDoc);
      localStorage.setItem("medirent-documents", JSON.stringify(docList));
      if (isGSheetsEnabled()) syncRowToSheet(SHEETS.DOCUMENTS, excDoc as unknown as Record<string, unknown>);
    }
  }

  if (isGSheetsEnabled()) syncRowToSheet(SHEETS.EXCHANGES, exc as unknown as Record<string, unknown>);
  return list;
}

export function deleteExchange(id: string) {
  const list = getExchanges().filter((e) => e.id !== id);
  setStorageItem("medirent-exchanges", list);
  if (isGSheetsEnabled()) deleteRowFromSheet(SHEETS.EXCHANGES, id);
  return list;
}

export function useDatabaseTrigger() {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleUpdate = () => {
      setVersion((v) => v + 1);
    };
    window.addEventListener("medirent-db-updated", handleUpdate);
    return () => window.removeEventListener("medirent-db-updated", handleUpdate);
  }, []);
  return version;
}

// ─── Income / Expense Ledger Data Store ─────────────────────────────────────
export interface IncomeExpenseItem {
  id: string;
  date: string; // YYYY-MM-DD
  entity: string; // "Jain Finance", "Jain Mobile", "MediRent Healthcare", etc.
  type: "Income" | "Expense";
  category: string;
  amount: number;
  paymentMode: string;
  referenceNo?: string;
  description?: string;
}

const initialIncomeExpenses: IncomeExpenseItem[] = [
  {
    id: "EXP-1001",
    date: getLocalYYYYMMDD(new Date()),
    entity: "ReLife Medical Technologies",
    type: "Income",
    category: "Equipment Rentals",
    amount: 45000,
    paymentMode: "Bank Transfer",
    referenceNo: "HDFC982341",
    description: "Monthly rental income collections for medical equipment",
  },
  {
    id: "EXP-1002",
    date: getLocalYYYYMMDD(new Date()),
    entity: "ReLife Medical Technologies",
    type: "Income",
    category: "Accessories & Spares",
    amount: 15000,
    paymentMode: "UPI",
    referenceNo: "UPI/6548921/RL",
    description: "Sales of oxygen masks, tubes, and accessories",
  },
  {
    id: "EXP-1003",
    date: getLocalYYYYMMDD(new Date()),
    entity: "ReLife Medical Technologies",
    type: "Expense",
    category: "Office & Warehouse Rent",
    amount: 12000,
    paymentMode: "Bank Transfer",
    referenceNo: "NEFT449812",
    description: "Monthly lease for medical store & equipment warehouse",
  },
  {
    id: "EXP-1004",
    date: getLocalYYYYMMDD(new Date(Date.now() - 86400000 * 2)),
    entity: "ReLife Medical Technologies",
    type: "Expense",
    category: "Biomedical Staff Salaries",
    amount: 25000,
    paymentMode: "Bank Transfer",
    referenceNo: "SAL-2026-08",
    description: "Monthly salary disbursement for biomedical tech & delivery team",
  },
  {
    id: "EXP-1005",
    date: getLocalYYYYMMDD(new Date()),
    entity: "ReLife Medical Technologies",
    type: "Income",
    category: "Device Maintenance",
    amount: 18500,
    paymentMode: "Cash",
    referenceNo: "CS-8891",
    description: "Oxygen concentrator service and repair charges",
  },
  {
    id: "EXP-1006",
    date: getLocalYYYYMMDD(new Date(Date.now() - 86400000 * 3)),
    entity: "ReLife Medical Technologies",
    type: "Expense",
    category: "Equipment Restock & Parts",
    amount: 32000,
    paymentMode: "Bank Transfer",
    referenceNo: "PO-99120",
    description: "Purchase of medical equipment spare parts and filters",
  },
];

export function getIncomeExpenses(): IncomeExpenseItem[] {
  if (!isBrowser) return initialIncomeExpenses;
  const stored = localStorage.getItem("medirent-income-expenses");
  if (!stored) {
    localStorage.setItem("medirent-income-expenses", JSON.stringify(initialIncomeExpenses));
    return initialIncomeExpenses;
  }
  try {
    const list = JSON.parse(stored);
    if (!Array.isArray(list)) return initialIncomeExpenses;

    const cleaned = list.filter((e: any) => 
      !e.entity || (!e.entity.includes("Jain Finance") && !e.entity.includes("Jain Mobile"))
    );
    if (cleaned.length !== list.length) {
      setStorageItem("medirent-income-expenses", cleaned);
    }
    return cleaned.length > 0 ? cleaned : initialIncomeExpenses;
  } catch (_) {
    return initialIncomeExpenses;
  }
}

export function saveIncomeExpense(entry: IncomeExpenseItem): IncomeExpenseItem[] {
  const list = getIncomeExpenses();
  const index = list.findIndex((e) => e.id === entry.id);
  if (index > -1) {
    list[index] = entry;
  } else {
    list.unshift(entry);
  }
  setStorageItem("medirent-income-expenses", list);
  return list;
}

export function deleteIncomeExpense(id: string): IncomeExpenseItem[] {
  const list = getIncomeExpenses().filter((e) => e.id !== id);
  setStorageItem("medirent-income-expenses", list);
  return list;
}

export function getNextIncomeExpenseNumber(): string {
  const list = getIncomeExpenses();
  let maxId = 1000;
  list.forEach((item) => {
    const num = extractIdNumber(item.id);
    if (num > maxId) maxId = num;
  });
  return `EXP-${maxId + 1}`;
}

export function printIncomeExpensesPDF(
  entries: IncomeExpenseItem[],
  entityName: string = "All Entities",
  dateScopeLabel: string = "All Time"
) {
  if (!isBrowser) return;

  const totalIncome = entries
    .filter((e) => e.type === "Income")
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const totalExpenses = entries
    .filter((e) => e.type === "Expense")
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const netBalance = totalIncome - totalExpenses;

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Popup blocked! Please allow popups to export the PDF report.");
    return;
  }

  const tableRowsHtml = entries
    .map(
      (item, idx) => `
    <tr>
      <td style="text-align: center;">${idx + 1}</td>
      <td style="text-align: center;">${formatDateDDMMYYYY(item.date)}</td>
      <td><strong>${item.entity}</strong></td>
      <td>
        <span class="type-badge type-${item.type.toLowerCase()}">${item.type}</span>
      </td>
      <td>${item.category}</td>
      <td style="text-align: right; font-weight: bold; color: ${
        item.type === "Income" ? "#16a34a" : "#dc2626"
      };">
        ${item.type === "Income" ? "+" : "-"} ₹${Number(item.amount).toLocaleString("en-IN")}
      </td>
      <td style="text-align: center;">${item.paymentMode}</td>
      <td style="text-align: center;">${item.referenceNo || "—"}</td>
      <td>${item.description || "—"}</td>
    </tr>
  `
    )
    .join("");

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Ledger Cash Flow Statement - ${entityName}</title>
      <style>
        body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; padding: 25px; color: #0f172a; line-height: 1.5; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0284c7; padding-bottom: 15px; margin-bottom: 20px; }
        .brand { font-size: 22px; font-weight: 800; color: #0369a1; letter-spacing: -0.5px; }
        .brand span { font-size: 13px; font-weight: 500; color: #64748b; margin-left: 8px; }
        .report-meta { text-align: right; font-size: 11px; color: #64748b; }
        
        .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 25px; }
        .kpi-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
        .kpi-title { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; }
        .kpi-val { font-size: 18px; font-weight: 800; margin-top: 4px; }
        .val-income { color: #16a34a; }
        .val-expense { color: #dc2626; }
        .val-balance { color: #0284c7; }

        table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 11px; }
        th { background-color: #0284c7; color: #ffffff; font-weight: 700; text-align: left; padding: 8px 10px; border: 1px solid #0284c7; text-transform: uppercase; font-size: 9.5px; letter-spacing: 0.5px; }
        td { padding: 8px 10px; border: 1px solid #e2e8f0; color: #334155; }
        tr:nth-child(even) { background-color: #f8fafc; }
        
        .type-badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: 700; }
        .type-income { background-color: #dcfce7; color: #15803d; }
        .type-expense { background-color: #fee2e2; color: #b91c1c; }

        .totals-row { background-color: #f1f5f9 !important; font-weight: 800; font-size: 12px; }
        .totals-row td { border-top: 2px solid #94a3b8; }

        .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 15px; font-size: 10px; text-align: center; color: #94a3b8; }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="brand">${entityName} <span>Ledger Cash Flow</span></div>
          <div style="font-size: 12px; color: #475569; margin-top: 4px;">Income & Expense Audit Report · ${dateScopeLabel}</div>
        </div>
        <div class="report-meta">
          <div>Generated: ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
          <div>Total Transactions: ${entries.length}</div>
        </div>
      </div>

      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-title">Total Cash Inflow</div>
          <div class="kpi-val val-income">₹${totalIncome.toLocaleString("en-IN")}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-title">Total Cash Outflow</div>
          <div class="kpi-val val-expense">₹${totalExpenses.toLocaleString("en-IN")}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-title">Net Cash Flow</div>
          <div class="kpi-val val-balance" style="color: ${netBalance >= 0 ? "#16a34a" : "#dc2626"};">
            ${netBalance >= 0 ? "+" : ""}₹${netBalance.toLocaleString("en-IN")}
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-title">Entity Scope</div>
          <div class="kpi-val" style="font-size: 15px; color: #334155;">${entityName}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 35px; text-align: center;">#</th>
            <th style="width: 80px; text-align: center;">Date</th>
            <th style="width: 110px;">Entity</th>
            <th style="width: 70px;">Type</th>
            <th style="width: 140px;">Category</th>
            <th style="width: 100px; text-align: right;">Amount</th>
            <th style="width: 90px; text-align: center;">Mode</th>
            <th style="width: 100px; text-align: center;">Ref No.</th>
            <th>Description / Remarks</th>
          </tr>
        </thead>
        <tbody>
          ${tableRowsHtml || '<tr><td colspan="9" style="text-align:center; padding: 20px;">No transaction entries found for this scope.</td></tr>'}
          <tr class="totals-row">
            <td colspan="5" style="text-align: right;">Total Summary (${dateScopeLabel}):</td>
            <td style="text-align: right; color: ${netBalance >= 0 ? "#16a34a" : "#dc2626"};">
              ₹${netBalance.toLocaleString("en-IN")}
            </td>
            <td colspan="3"></td>
          </tr>
        </tbody>
      </table>

      <div class="footer">
        Computer Generated Statement · ${entityName} Financial Records · Relife ERP
      </div>

      <script>
        window.addEventListener('DOMContentLoaded', () => {
          setTimeout(() => {
            window.print();
            window.onafterprint = function() { window.close(); };
          }, 400);
        });
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}





