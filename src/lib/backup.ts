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
function escapeXml(str: unknown): string {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function cleanDate(val: unknown): string {
  if (val === null || val === undefined) return "";
  const s = String(val).trim();
  if (!s) return "";
  if (s.includes("T")) {
    const datePart = s.split("T")[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
      const [yyyy, mm, dd] = datePart.split("-");
      return `${dd}-${mm}-${yyyy}`;
    }
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [yyyy, mm, dd] = s.split("-");
    return `${dd}-${mm}-${yyyy}`;
  }
  return s;
}

function buildDocLink(doc: any, cust: any): { href?: string; text: string } {
  if (!doc) return { text: "N/A" };
  if (doc.url && (doc.url.startsWith("http://") || doc.url.startsWith("https://"))) {
    return { href: doc.url, text: "Open Document Link" };
  }
  if (doc.fileData && (doc.fileData.startsWith("http://") || doc.fileData.startsWith("https://"))) {
    return { href: doc.fileData, text: "Open Document Link" };
  }
  if (doc.type === "Location Tag") {
    let locText = doc.fileData || "";
    if (locText.startsWith("data:text/plain")) {
      try {
        const parts = locText.split(",");
        if (parts[0].includes("base64")) {
          locText = atob(parts[1]);
        } else {
          locText = decodeURIComponent(parts[1]);
        }
      } catch {}
    }
    const latMatch = locText.match(/Latitude:\s*(-?\d+\.\d+)/i) || locText.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
    const lngMatch = locText.match(/Longitude:\s*(-?\d+\.\d+)/i);
    let mapUrl = "";
    if (latMatch && lngMatch) {
      mapUrl = `https://www.google.com/maps/dir/?api=1&destination=${latMatch[1]},${lngMatch[1]}`;
    } else if (latMatch && latMatch[2]) {
      mapUrl = `https://www.google.com/maps/dir/?api=1&destination=${latMatch[1]},${latMatch[2]}`;
    } else {
      const addrMatch = locText.match(/Address:\s*(.+)/i);
      const cleanAddr = addrMatch ? addrMatch[1].trim() : (cust?.address || "");
      if (cleanAddr) {
        mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanAddr)}`;
      }
    }
    if (mapUrl) {
      return { href: mapUrl, text: "Google Maps Direction" };
    }
  }
  if (doc.fileData && doc.fileData.startsWith("data:")) {
    return { text: `Stored in ERP DB (${doc.size || 'Image/PDF Data'})` };
  }
  return { text: `Stored in ERP Database (ID: ${doc.id || 'Doc'})` };
}

export interface ExcelSheetDefinition {
  name: string;
  headers: string[];
  rows: (any)[][];
  colWidths?: number[];
}

export function generateMultiSheetExcel(filename: string, sheets: ExcelSheetDefinition[]) {
  if (!isBrowser()) return;
  const xlsName = filename.endsWith(".xls") ? filename : `${filename.replace(/\.[^/.]+$/, "")}.xls`;

  let worksheetsXml = "";

  sheets.forEach((sheet) => {
    const cleanSheetName = sheet.name.replace(/[:\\/?*\[\]]/g, "").slice(0, 31);
    
    let colsXml = "";
    if (sheet.colWidths && sheet.colWidths.length > 0) {
      sheet.colWidths.forEach((w) => {
        colsXml += `<Column ss:Width="${Number(w) || 120}"/>`;
      });
    }

    let headerRowsXml = "<Row>";
    sheet.headers.forEach((h) => {
      headerRowsXml += `<Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(h)}</Data></Cell>`;
    });
    headerRowsXml += "</Row>";

    let dataRowsXml = "";
    sheet.rows.forEach((row) => {
      dataRowsXml += "<Row>";
      row.forEach((rawCell) => {
        if (rawCell && typeof rawCell === "object" && rawCell.text !== undefined) {
          if (rawCell.href) {
            dataRowsXml += `<Cell ss:StyleID="Hyperlink" ss:HRef="${escapeXml(rawCell.href)}"><Data ss:Type="String">${escapeXml(rawCell.text)}</Data></Cell>`;
          } else {
            dataRowsXml += `<Cell ss:StyleID="Default"><Data ss:Type="String">${escapeXml(rawCell.text)}</Data></Cell>`;
          }
        } else {
          const val = rawCell === null || rawCell === undefined ? "" : String(rawCell);
          const isNum = typeof rawCell === "number";
          const isPhoneOrId = !isNum && (/^\+?\d{7,}$/.test(val.trim()) || /^[A-Z0-9]{3,}-[A-Z0-9-]+$/i.test(val.trim()));
          
          if (isPhoneOrId) {
            dataRowsXml += `<Cell ss:StyleID="StringText"><Data ss:Type="String">${escapeXml(val)}</Data></Cell>`;
          } else if (isNum) {
            dataRowsXml += `<Cell ss:StyleID="Default"><Data ss:Type="Number">${val}</Data></Cell>`;
          } else {
            dataRowsXml += `<Cell ss:StyleID="Default"><Data ss:Type="String">${escapeXml(val)}</Data></Cell>`;
          }
        }
      });
      dataRowsXml += "</Row>";
    });

    worksheetsXml += `
 <Worksheet ss:Name="${escapeXml(cleanSheetName)}">
  <Table>
   ${colsXml}
   ${headerRowsXml}
   ${dataRowsXml}
  </Table>
  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
   <DisplayGridlines/>
  </WorksheetOptions>
 </Worksheet>`;
  });

  const xmlContent = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Header">
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#1E3A8A" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
  </Style>
  <Style ss:ID="Default">
   <Font ss:FontName="Segoe UI" ss:Size="9.5" ss:Color="#334155"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="StringText">
   <NumberFormat ss:Format="@"/>
   <Font ss:FontName="Segoe UI" ss:Size="9.5" ss:Color="#334155"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="Hyperlink">
   <Font ss:FontName="Segoe UI" ss:Size="9.5" ss:Color="#2563EB" ss:Underline="Single"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
 </Styles>
 ${worksheetsXml}
</Workbook>`;

  triggerDownload(xlsName, xmlContent, "application/vnd.ms-excel;charset=utf-8");
}

export function downloadBackupExcel(): BackupSnapshot {
  const snapshot = createBackupSnapshot();
  const customers = (snapshot.data["medirent-customers"] || []) as any[];
  const equipment = (snapshot.data["medirent-equipment"] || []) as any[];
  const rentals = (snapshot.data["medirent-rentals"] || []) as any[];
  const payments = (snapshot.data["medirent-payments"] || []) as any[];
  const returnsList = (snapshot.data["medirent-returns"] || []) as any[];
  const owners = (snapshot.data["medirent-owners"] || []) as any[];
  const documents = (snapshot.data["medirent-documents"] || []) as any[];
  const exchanges = (snapshot.data["medirent-exchanges"] || []) as any[];
  const staffUsers = (snapshot.data["medirent-staff-users"] || []) as any[];

  const sheets: ExcelSheetDefinition[] = [
    {
      name: "Customers",
      headers: ["Customer ID", "Full Name", "Primary Phone", "Alt Phone", "Alt Phone 1", "Email", "City", "State", "Pincode", "Address", "Area", "Aadhaar Number", "PAN Number", "Status", "Notes"],
      colWidths: [100, 180, 140, 140, 140, 180, 110, 100, 90, 250, 130, 140, 130, 90, 200],
      rows: customers.map((c: any) => [
        c.id || "", c.name || "", c.phone || "", c.altPhone || "", c.contactNumber3 || "",
        c.email || "", c.city || "", c.state || "", c.pincode || "", c.address || "",
        c.area || "", c.aadhaar || "", c.pan || "", c.status || "Active", c.notes || ""
      ])
    },
    {
      name: "Equipment",
      headers: ["Equipment ID", "Equipment Name", "Model", "Serial Number", "Owner / Vendor", "Monthly Rent (₹)", "Daily Rent (₹)", "Deposit (₹)", "Status", "Purchase Date", "Purchase Cost (₹)"],
      colWidths: [110, 180, 150, 140, 150, 120, 120, 120, 100, 110, 120],
      rows: equipment.map((e: any) => [
        e.id || "", e.name || e.category || "", e.model || "", e.serial || "", e.ownerName || e.owner || "Own",
        Number(e.monthlyRent || e.rentRate) || 0, Number(e.dailyRent) || 0, Number(e.deposit) || 0,
        e.status || "Available", cleanDate(e.purchaseDate), Number(e.purchaseCost) || 0
      ])
    },
    {
      name: "Rental Agreements",
      headers: ["Agreement ID", "Customer ID", "Customer Name", "Consulting Hospital", "Referred By", "Rent Start Date", "Rent End Date", "Monthly Rent (₹)", "Deposit (₹)", "Equipment Items", "Serials", "Status", "Payment Mode", "Collected By", "Remarks"],
      colWidths: [130, 110, 180, 160, 150, 110, 110, 120, 120, 220, 160, 110, 110, 130, 200],
      rows: rentals.map((r: any) => {
        const items = Array.isArray(r.equipmentItems) && r.equipmentItems.length > 0
          ? r.equipmentItems.map((it: any) => `${it.name || "Equip"}${it.model ? " (" + it.model + ")" : ""}`).join(", ")
          : (r.equipment || "");
        const serials = Array.isArray(r.equipmentItems) && r.equipmentItems.length > 0
          ? r.equipmentItems.map((it: any) => it.serial || "N/A").join(", ")
          : (r.serial || "");
        return [
          r.id || "", r.customerId || "", r.customer || "", r.consultingHospital || "", r.referredBy || "",
          cleanDate(r.start), cleanDate(r.end), Number(r.monthlyRent) || 0, Number(r.deposit) || 0,
          items, serials, r.status || "Active", r.paymentMode || "Cash", r.paymentCollectedBy || "", r.remarks || r.notes || ""
        ];
      })
    },
    {
      name: "Payments",
      headers: ["Payment ID", "Agreement ID", "Customer Name", "Payment Type", "Amount Paid (₹)", "Discount (₹)", "Payment Mode", "Cash Paid (₹)", "Bank Paid (₹)", "Payment Date", "Collected By", "Status", "Remarks"],
      colWidths: [110, 130, 180, 120, 120, 110, 110, 110, 110, 110, 130, 90, 180],
      rows: payments.map((p: any) => [
        p.id || "", p.agreement || p.rentalId || "", p.customer || p.customerName || "", p.type || "Rent",
        Number(p.amount) || 0, Number(p.discount) || 0, p.mode || p.paymentMode || "Cash",
        Number(p.cashPaidAmount) || 0, Number(p.bankUpiPaidAmount) || 0, cleanDate(p.date || p.paymentDate),
        p.collectedBy || p.paymentCollectedBy || "", p.status || "Paid", p.remarks || p.notes || ""
      ])
    },
    {
      name: "Returns",
      headers: ["Return ID", "Agreement ID", "Customer Name", "Return Date", "Items Returned", "Damage Charges (₹)", "Return Discount (₹)", "Unpaid Accessories (₹)", "Deposit Refunded (₹)", "Status", "Payment Mode", "Collector Name", "Remarks"],
      colWidths: [110, 130, 180, 110, 200, 130, 130, 130, 130, 110, 110, 130, 180],
      rows: returnsList.map((ret: any) => [
        ret.id || "", ret.agreementId || ret.rentalId || "", ret.customerName || ret.customer || "", cleanDate(ret.returnDate || ret.date),
        Array.isArray(ret.items) ? ret.items.map((i: any) => i.name || i.equipmentId).join(", ") : (ret.equipment || ""),
        Number(ret.damageCharges) || 0, Number(ret.returnDiscount) || 0, Number(ret.unpaidAccessoriesCost) || 0,
        Number(ret.refundedDeposit) || 0, ret.settlementStatus || ret.status || "Completed", ret.paymentMode || "Cash",
        ret.collectorName || "", ret.remarks || ""
      ])
    },
    {
      name: "Owners",
      headers: ["Owner ID", "Company / Owner Name", "Contact Person", "Phone Number", "Email", "Address", "GST Number", "Bank Details"],
      colWidths: [100, 200, 160, 140, 180, 250, 140, 200],
      rows: owners.map((o: any) => [
        o.id || "", o.name || "", o.contactPerson || "", o.phone || "", o.email || "",
        o.address || "", o.gstin || o.gst || "", o.bankDetails || ""
      ])
    },
    {
      name: "KYC Documents",
      headers: ["Document ID", "Customer ID", "Customer Name", "Agreement ID", "Document Type", "File Name", "File Size", "Date Tagged / Uploaded", "Document Link / KYC Link"],
      colWidths: [120, 110, 180, 130, 140, 180, 100, 130, 260],
      rows: documents.map((d: any) => {
        const cust = customers.find((c: any) => c.id === d.customerId);
        return [
          d.id || "", d.customerId || "", cust?.name || d.customerName || "", d.rentalId || "",
          d.type || "Document", d.name || "", d.size || "", cleanDate(d.date), buildDocLink(d, cust)
        ];
      })
    },
    {
      name: "Exchanges",
      headers: ["Exchange ID", "Agreement ID", "Customer Name", "Original Equipment", "Replacement Equipment", "Exchange Date", "Reason", "Handled By"],
      colWidths: [110, 130, 180, 180, 180, 110, 200, 130],
      rows: exchanges.map((ex: any) => [
        ex.id || "", ex.rentalId || ex.agreementId || "", ex.customerName || ex.customer || "",
        ex.oldEquipmentName || ex.oldSerial || "", ex.newEquipmentName || ex.newSerial || "",
        cleanDate(ex.date), ex.reason || "", ex.handledBy || ""
      ])
    },
    {
      name: "Staff Users",
      headers: ["User ID", "Full Name", "Username / Phone", "Role", "Status", "Created Date"],
      colWidths: [100, 180, 140, 100, 90, 110],
      rows: staffUsers.map((s: any) => [
        s.id || "", s.name || "", s.username || s.phone || "", s.role || "Staff", s.status || "Active", cleanDate(s.createdAt)
      ])
    }
  ];

  generateMultiSheetExcel(`relife-erp-backup-${snapshot.createdDate}.xls`, sheets);
  markBackedUpToday();
  return snapshot;
}

export function downloadBackupCSV(): BackupSnapshot {
  return downloadBackupExcel();
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
