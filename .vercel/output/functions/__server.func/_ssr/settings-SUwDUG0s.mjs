import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { Y as saveCompanySettings, _ as getAllDataForSync, _t as testConnection, at as syncFromSheetsToLocalStorage, ct as SHEETS, dt as getGSheetsUrl, ft as isGSheetsEnabled, gt as syncRowToSheet, ht as syncAllToSheets, lt as clearSheetInGSheets, mt as setGSheetsUrl, ot as syncMissingFileChunks, ut as deleteRowFromSheet, v as getCompanySettings } from "./data-store-BXBhFJro.mjs";
import { c as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { Ct as CircleCheck, D as RefreshCw, Ft as Building2, H as Lock, St as CircleX, W as Link2, _t as Copy, b as Shield, dt as ExternalLink, h as Trash2, ht as Database, kt as Check, p as TriangleAlert, u as UserPlus, vt as CloudUpload, yt as CloudDownload } from "../_libs/lucide-react.mjs";
import { a as DialogFooter, c as DialogTrigger, i as DialogContent, l as Input, n as Dialog, o as DialogHeader, r as DialogClose, s as DialogTitle, t as Button, u as Label } from "./dialog-BHa0LWsH.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-C2rs2HGz.mjs";
import { a as CardContent, i as Card, o as CardHeader, s as CardTitle, t as AppShell } from "./AppShell-ABaTd-bJ.mjs";
import { a as TableHeader, i as TableHead, n as TableBody, o as TableRow, r as TableCell, t as Table } from "./table-DDeHIPcn.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/settings-SUwDUG0s.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function DatabaseSettingsTab() {
	const [sheetsUrl, setSheetsUrl] = (0, import_react.useState)(getGSheetsUrl());
	const [testStatus, setTestStatus] = (0, import_react.useState)("idle");
	const [testMessage, setTestMessage] = (0, import_react.useState)("");
	const [isSyncing, setIsSyncing] = (0, import_react.useState)(false);
	const [syncResult, setSyncResult] = (0, import_react.useState)(null);
	const [isSyncingFiles, setIsSyncingFiles] = (0, import_react.useState)(false);
	const [fileSyncProgress, setFileSyncProgress] = (0, import_react.useState)(null);
	const [fileSyncResult, setFileSyncResult] = (0, import_react.useState)(null);
	const [isPulling, setIsPulling] = (0, import_react.useState)(false);
	const SHEET_ID = "1f5mJV8P90ID2-BiyeZZvtBF0Q3JjvyElbfI4omxkJRw";
	const appsScriptCode = `// ══════════════════════════════════════════════════════════
// MediRent / Relife ERP — Google Apps Script Web App  (v3 — FileChunks + HTML OTP)
// Sheet ID: ${SHEET_ID}
//
// SETUP STEPS:
//  1. Open your Google Sheet: https://docs.google.com/spreadsheets/d/${SHEET_ID}
//  2. Click Extensions → Apps Script
//  3. Replace ALL existing code with this script
//  4. Click Deploy → New Deployment → Web App
//     - Execute as: Me
//     - Who has access: Anyone
//  5. Click Deploy → copy the Web App URL
//  6. Paste the URL into the field above and click Test Connection
// ══════════════════════════════════════════════════════════

// BUG-9 FIX (v3): Added "FileChunks" — required for cross-device PDF/image sync.
// Without this, file chunk upserts silently failed because the sheet wasn't tracked.
const SHEET_NAMES = ["Customers", "Equipment", "Rentals", "Payments", "Returns", "Owners", "Documents", "Exchanges", "FileChunks", "Staff"];

// ─── GET handler ────────────────────────────────────────────────────────────

function doGet(e) {
  const action = e.parameter.action;
  const sheet  = e.parameter.sheet;

  if (action === "ping") {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    return ContentService
      .createTextOutput(JSON.stringify({ status: "ok", sheetName: ss.getName(), version: "v3" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (action === "getAll" && sheet) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = ss.getSheetByName(sheet);
    // BUG-FIX: Guard getLastColumn() === 0 to avoid Invalid range crash on empty sheets
    if (!sh || sh.getLastRow() < 2 || sh.getLastColumn() === 0) {
      return ContentService.createTextOutput(JSON.stringify({ data: [] })).setMimeType(ContentService.MimeType.JSON);
    }
    const data    = sh.getDataRange().getValues();
    const headers = data[0];
    const rows    = data.slice(1).map(function(row) {
      var obj = {};
      headers.forEach(function(h, i) { obj[h] = row[i]; });
      return obj;
    });
    return ContentService
      .createTextOutput(JSON.stringify({ data: rows }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // ── Send OTP via GET (avoids CORS redirect issue with POST from deployed sites) ──
  if (action === "sendOtp") {
    var email = e.parameter.email;
    var otp   = e.parameter.otp;
    if (!email || !otp) {
      return ContentService.createTextOutput(JSON.stringify({ error: "Missing email or otp" })).setMimeType(ContentService.MimeType.JSON);
    }
    var plainBody = "Your Relife ERP login verification code is: " + otp +
      "\\n\\nThis code expires in 10 minutes. Do not share it with anyone.";
    var htmlBody = "<div style='font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px;'>" +
      "<h2 style='color:#1e3a8a;margin-top:0;'>Relife ERP — Login Verification</h2>" +
      "<p style='color:#475569;'>Your one-time login verification code is:</p>" +
      "<div style='background:#f8fafc;border:2px dashed #1e3a8a;border-radius:8px;padding:16px 24px;text-align:center;margin:16px 0;'>" +
      "<span style='font-size:36px;font-weight:bold;letter-spacing:0.35em;color:#1e3a8a;'>" + otp + "</span>" +
      "</div>" +
      "<p style='color:#64748b;font-size:13px;'>This code <strong>expires in 10 minutes</strong>. Do not share it with anyone.</p>" +
      "<hr style='border:none;border-top:1px solid #e2e8f0;margin:16px 0;'>" +
      "<p style='color:#94a3b8;font-size:12px;'>Relife Medical Equipment Rental ERP | Automated security message</p>" +
      "</div>";
    MailApp.sendEmail({ to: email, subject: "Relife ERP — Verification Code: " + otp, body: plainBody, htmlBody: htmlBody });
    return ContentService
      .createTextOutput(JSON.stringify({ status: "ok" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ error: "Unknown action" }))
    .setMimeType(ContentService.MimeType.JSON);
}


// ─── POST handler ───────────────────────────────────────────────────────────

function doPost(e) {
  try {
    const body   = JSON.parse(e.postData.contents);
    const action = body.action;
    const sheet  = body.sheet;
    const row    = body.row;
    const rows   = body.rows;
    const id     = body.id;
    const email  = body.email;
    const otp    = body.otp;
    const ss     = SpreadsheetApp.getActiveSpreadsheet();

    function getOrCreateSheet(name) {
      var sh = ss.getSheetByName(name);
      if (!sh) sh = ss.insertSheet(name);
      return sh;
    }

    // ── Send OTP email ───────────────────────────────────────────────────────
    if (action === "sendOtp" && email && otp) {
      var plainBody = "Your Relife ERP login verification code is: " + otp +
        "\\n\\nThis code expires in 10 minutes. Do not share it with anyone.";
      var htmlBody = "<div style='font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px;'>" +
        "<h2 style='color:#1e3a8a;margin-top:0;'>Relife ERP — Login Verification</h2>" +
        "<p style='color:#475569;'>Your one-time login verification code is:</p>" +
        "<div style='background:#f8fafc;border:2px dashed #1e3a8a;border-radius:8px;padding:16px 24px;text-align:center;margin:16px 0;'>" +
        "<span style='font-size:36px;font-weight:bold;letter-spacing:0.35em;color:#1e3a8a;'>" + otp + "</span>" +
        "</div>" +
        "<p style='color:#64748b;font-size:13px;'>This code <strong>expires in 10 minutes</strong>. Do not share it with anyone.</p>" +
        "<hr style='border:none;border-top:1px solid #e2e8f0;margin:16px 0;'>" +
        "<p style='color:#94a3b8;font-size:12px;'>Relife Medical Equipment Rental ERP | Automated security message</p>" +
        "</div>";
      MailApp.sendEmail({
        to: email,
        subject: "Relife ERP — Verification Code: " + otp,
        body: plainBody,
        htmlBody: htmlBody
      });
      return ContentService
        .createTextOutput(JSON.stringify({ status: "ok" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ── Single row upsert ────────────────────────────────────────────────────
    if (action === "upsert" && sheet && row) {
      const sh = getOrCreateSheet(sheet);
      upsertRow(sh, row);
      applyHeaderFormat(sh);   // BUG-FIX: formatting only once, not inside upsertRow
      return ContentService.createTextOutput(JSON.stringify({ status: "ok" })).setMimeType(ContentService.MimeType.JSON);
    }

    // ── Bulk upsert (REWRITTEN — was O(n²), now O(n)) ───────────────────────
    if (action === "bulkUpsert" && sheet && rows) {
      const sh = getOrCreateSheet(sheet);
      bulkUpsertRows(sh, rows);   // BUG-FIX: single efficient batch write
      return ContentService.createTextOutput(JSON.stringify({ status: "ok", count: rows.length })).setMimeType(ContentService.MimeType.JSON);
    }

    // ── Delete a single row ─────────────────────────────────────────────────
    if (action === "delete" && sheet && id) {
      const sh = ss.getSheetByName(sheet);
      if (sh) deleteRow(sh, id);
      return ContentService.createTextOutput(JSON.stringify({ status: "ok" })).setMimeType(ContentService.MimeType.JSON);
    }

    // ── Clear all data rows (keep headers) ──────────────────────────────────
    if (action === "clearSheet" && sheet) {
      const sh = ss.getSheetByName(sheet);
      // BUG-FIX: Guard getLastColumn() === 0 to avoid crash on sheets with no columns
      if (sh && sh.getLastRow() > 1 && sh.getLastColumn() > 0) {
        sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).clearContent();
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "ok" })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ error: "Unknown action" })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: String(err) })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ─── Efficient batch upsert (fixes O(n²) bug in v1) ────────────────────────
// Reads the sheet ONCE, builds a complete data map, then writes everything
// in a single setValues() call — massively faster for large datasets.

function bulkUpsertRows(sh, rows) {
  if (!rows || rows.length === 0) return;

  // 1. Collect the union of all field keys from all rows
  var allKeys = [];
  rows.forEach(function(r) {
    Object.keys(r).forEach(function(k) {
      if (allKeys.indexOf(k) === -1) allKeys.push(k);
    });
  });

  // 2. Get or create headers row
  var headers;
  if (sh.getLastRow() === 0 || sh.getLastColumn() === 0) {
    sh.appendRow(allKeys);
    headers = allKeys.slice();
  } else {
    headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
    // Add any new keys as new header columns
    var newKeys = allKeys.filter(function(k) { return headers.indexOf(k) === -1; });
    newKeys.forEach(function(k) {
      headers.push(k);
      sh.getRange(1, headers.length).setValue(k);
    });
  }

  // 3. Read all existing data rows ONCE into a map: id → rowIndex (1-based, row 2+)
  var idCol = headers.indexOf("id");
  var existingData = sh.getLastRow() > 1
    ? sh.getRange(2, 1, sh.getLastRow() - 1, headers.length).getValues()
    : [];

  var idToRowIndex = {};  // id string → 0-based index in existingData
  if (idCol !== -1) {
    existingData.forEach(function(r, i) {
      idToRowIndex[String(r[idCol])] = i;
    });
  }

  // 4. Apply each incoming row as an update or append
  var toAppend = [];
  rows.forEach(function(row) {
    var newRow = headers.map(function(h) {
      var val = row[h];
      if (val === undefined) return "";
      if (val !== null && typeof val === "object") return JSON.stringify(val);
      return val;
    });

    var rowId = idCol !== -1 ? String(row["id"]) : null;
    if (rowId && idToRowIndex.hasOwnProperty(rowId)) {
      // Update in-place — write directly to the existing row
      var sheetRowNum = idToRowIndex[rowId] + 2;  // +2 because row 1 is header
      sh.getRange(sheetRowNum, 1, 1, headers.length).setValues([newRow]);
    } else {
      toAppend.push(newRow);
    }
  });

  // 5. Append all new rows in one batch (much faster than row-by-row appendRow)
  if (toAppend.length > 0) {
    sh.getRange(sh.getLastRow() + 1, 1, toAppend.length, headers.length).setValues(toAppend);
  }

  // 6. Format headers ONCE after all data is written
  applyHeaderFormat(sh);
}

// ─── Single row upsert (for incremental syncs) ──────────────────────────────

function upsertRow(sh, row) {
  var keys    = Object.keys(row);
  var headers = [];

  if (sh.getLastRow() === 0 || sh.getLastColumn() === 0) {
    sh.appendRow(keys);
    headers = keys;
  } else {
    headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
    var newKeys = keys.filter(function(k) { return headers.indexOf(k) === -1; });
    newKeys.forEach(function(k) {
      headers.push(k);
      sh.getRange(1, headers.length).setValue(k);
    });
  }

  var idCol = headers.indexOf("id");
  var newRow = headers.map(function(h) {
    var val = row[h];
    if (val === undefined) return "";
    if (val !== null && typeof val === "object") return JSON.stringify(val);
    return val;
  });

  if (idCol === -1) {
    sh.appendRow(newRow);
    return;
  }

  var rowId = String(row["id"]);
  // BUG-FIX v1: getLastColumn guard
  var existingData = sh.getLastRow() > 1 && sh.getLastColumn() > 0
    ? sh.getRange(2, 1, sh.getLastRow() - 1, headers.length).getValues()
    : [];

  var found = false;
  for (var i = 0; i < existingData.length; i++) {
    if (String(existingData[i][idCol]) === rowId) {
      sh.getRange(i + 2, 1, 1, headers.length).setValues([newRow]);
      found = true;
      break;
    }
  }
  if (!found) {
    sh.appendRow(newRow);
  }
}

// ─── Delete a row by id ──────────────────────────────────────────────────────

function deleteRow(sh, id) {
  // BUG-FIX: Guard getLastColumn() === 0
  if (sh.getLastRow() < 2 || sh.getLastColumn() === 0) return;
  var headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  var idCol   = headers.indexOf("id");
  if (idCol === -1) return;
  var data = sh.getRange(2, 1, sh.getLastRow() - 1, headers.length).getValues();
  for (var i = 0; i < data.length; i++) {
    if (String(data[i][idCol]) === String(id)) {
      sh.deleteRow(i + 2);
      break;
    }
  }
}

// ─── Header formatting (extracted — runs ONCE, not per-row) ─────────────────
// BUG-FIX: In v1 this ran inside upsertRow, meaning 100 rows = 100 format ops.

function applyHeaderFormat(sh) {
  try {
    var lastCol = sh.getLastColumn();
    if (lastCol <= 0) return;
    var headerRange = sh.getRange(1, 1, 1, lastCol);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#1e3a8a");
    headerRange.setFontColor("#ffffff");
    sh.setFrozenRows(1);
    sh.autoResizeColumns(1, lastCol);
    for (var c = 1; c <= lastCol; c++) {
      var w = sh.getColumnWidth(c);
      sh.setColumnWidth(c, Math.max(120, w + 20));
    }
  } catch (err) {
    // Ignore formatting errors — data is more important than style
  }
}`;
	const handleSaveUrl = () => {
		if (sheetsUrl && !sheetsUrl.startsWith("https://script.google.com/")) {
			toast.error("URL must start with https://script.google.com/");
			return;
		}
		setGSheetsUrl(sheetsUrl);
		toast.success(sheetsUrl ? "Apps Script URL saved successfully." : "Google Sheets integration disabled.");
		setTestStatus("idle");
		setTestMessage("");
		setSyncResult(null);
	};
	const handleTestConnection = async () => {
		if (!sheetsUrl) {
			toast.error("Please enter and save the Apps Script URL first.");
			return;
		}
		setTestStatus("testing");
		setTestMessage("Testing connection...");
		const result = await testConnection();
		setTestStatus(result.ok ? "ok" : "error");
		setTestMessage(result.message);
		if (result.ok) toast.success("Connection successful!");
		else toast.error("Connection failed: " + result.message);
	};
	const handleSyncAll = async () => {
		if (!isGSheetsEnabled()) {
			toast.error("Please configure and test the Apps Script URL first.");
			return;
		}
		setIsSyncing(true);
		setSyncResult(null);
		toast.info("Syncing all data to Google Sheets...");
		try {
			const result = await syncAllToSheets(getAllDataForSync());
			setSyncResult(result);
			if (result.success) toast.success(`All data synced! ${result.sheetsWritten.length} sheets updated.`);
			else toast.warning(`Sync partially complete. ${result.errors.length} errors occurred.`);
		} catch (err) {
			toast.error("Sync failed: " + String(err));
		} finally {
			setIsSyncing(false);
		}
	};
	const handleSyncMissingFiles = async () => {
		if (!isGSheetsEnabled()) {
			toast.error("Please configure and test the Apps Script URL first.");
			return;
		}
		setIsSyncingFiles(true);
		setFileSyncResult(null);
		setFileSyncProgress(null);
		toast.info("Checking this device's documents for files missing from Google Sheets...");
		try {
			const result = await syncMissingFileChunks((checked, total) => setFileSyncProgress({
				checked,
				total
			}));
			setFileSyncResult(result);
			if (result.checked === 0) toast.info("No document files found on this device to check.");
			else if (result.failed > 0) toast.warning(`Uploaded ${result.uploaded} missing file(s); ${result.failed} failed — retry later.`);
			else if (result.uploaded > 0) toast.success(`Uploaded ${result.uploaded} file(s) that were missing from Google Sheets. They're now downloadable on every device.`);
			else toast.success("All of this device's document files are already backed up to Google Sheets.");
		} catch (err) {
			toast.error("File sync failed: " + String(err));
		} finally {
			setIsSyncingFiles(false);
			setFileSyncProgress(null);
		}
	};
	const handlePullAll = async () => {
		if (!isGSheetsEnabled()) {
			toast.error("Please configure and test the Apps Script URL first.");
			return;
		}
		if (!window.confirm("Are you sure you want to pull all data from Google Sheets? This will OVERWRITE your browser's local data with the data from Google Sheets.")) return;
		setIsPulling(true);
		toast.info("Pulling all data from Google Sheets...");
		try {
			await syncFromSheetsToLocalStorage(true);
			toast.success("All data successfully pulled from Google Sheets!");
			setTimeout(() => {
				window.location.reload();
			}, 1500);
		} catch (err) {
			toast.error("Failed to pull data: " + String(err));
		} finally {
			setIsPulling(false);
		}
	};
	const handleClearAllDatabase = async () => {
		if (!window.confirm("WARNING: This will permanently delete all records (Customers, Equipment, Rentals, Payments, Returns, Owners, Documents, Exchanges) from your local browser database. This action is IRREVERSIBLE.\n\nAre you sure you want to proceed?")) return;
		if (isGSheetsEnabled()) {
			if (window.confirm("Your Google Sheets database is connected. Do you also want to clear all data rows in Google Sheets? (Keeping sheet headers intact)")) {
				toast.info("Clearing cloud Google Sheets database...");
				try {
					const sheetsToClear = [
						SHEETS.CUSTOMERS,
						SHEETS.EQUIPMENT,
						SHEETS.RENTALS,
						SHEETS.PAYMENTS,
						SHEETS.RETURNS,
						SHEETS.OWNERS,
						SHEETS.DOCUMENTS,
						SHEETS.EXCHANGES
					];
					for (const s of sheetsToClear) {
						const res = await clearSheetInGSheets(s);
						if (!res.success) throw new Error(`Failed to clear sheet ${s}: ${res.error}`);
					}
					toast.success("Google Sheets database cleared successfully!");
				} catch (e) {
					const errMsg = String(e);
					console.warn("[GSheets] Clear failed:", e);
					if (!window.confirm(`Failed to clear Google Sheets: ${errMsg}\n\nThis usually happens because your deployed Google Apps Script does not support the new clear action. To fix this, copy the updated Apps Script code from the section above, paste it in Extensions → Apps Script, and click Deploy → New Deployment.\n\nDo you want to clear your local database anyway?`)) return;
				}
			}
		}
		localStorage.removeItem("medirent-customers");
		localStorage.removeItem("medirent-equipment");
		localStorage.removeItem("medirent-rentals");
		localStorage.removeItem("medirent-payments");
		localStorage.removeItem("medirent-returns");
		localStorage.removeItem("medirent-owners");
		localStorage.removeItem("medirent-documents");
		localStorage.removeItem("medirent-exchanges");
		toast.success("Local database cleared successfully! Reloading...");
		setTimeout(() => {
			window.location.reload();
		}, 1500);
	};
	const copyScript = () => {
		navigator.clipboard.writeText(appsScriptCode).then(() => {
			toast.success("Apps Script code copied to clipboard!");
		});
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, {
			className: "border-b border-border/60 bg-muted/20 px-6 py-4",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "metric-icon h-9 w-9 bg-success/10 text-success border-success/20",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Database, { className: "h-4.5 w-4.5" })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Google Sheets Database" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-[12px] text-muted-foreground mt-0.5",
					children: ["Connected to Sheet ID: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-mono text-primary",
						children: SHEET_ID
					})]
				})] })]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
			className: "p-6 space-y-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-xl border border-border/60 bg-muted/10 p-4 space-y-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[12px] font-bold uppercase tracking-wider text-muted-foreground",
						children: "Setup Guide"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
						className: "space-y-2 text-[13px]",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: ["Open your ", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
								href: `https://docs.google.com/spreadsheets/d/${SHEET_ID}`,
								target: "_blank",
								rel: "noreferrer",
								className: "text-primary underline inline-flex items-center gap-1",
								children: ["Google Sheet ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { className: "h-3 w-3" })]
							})] }),
							"Click Extensions → Apps Script",
							"Replace all code with the script below, then click Save (Ctrl+S)",
							"Click Deploy → New Deployment → Web App → Execute as: Me → Access: Anyone",
							"Copy the Web App URL and paste it below",
							"Click Save URL, then Test Connection, then Sync All Data"
						].map((step, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex items-start gap-2.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold mt-0.5",
								children: i + 1
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-muted-foreground leading-relaxed",
								children: step
							})]
						}, i))
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between mb-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						className: "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
						children: "Apps Script Code (Copy → Paste into Script Editor)"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "outline",
						size: "sm",
						className: "h-7 text-[12px]",
						onClick: copyScript,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "h-3 w-3 mr-1.5" }), " Copy Code"]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "relative rounded-xl border border-border bg-muted/30 overflow-hidden",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("pre", {
						className: "text-[10px] font-mono text-muted-foreground p-4 overflow-x-auto max-h-[200px] overflow-y-auto leading-relaxed",
						children: [appsScriptCode.substring(0, 500), "..."]
					})
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							className: "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
							children: "Apps Script Web App URL"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative flex-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link2, { className: "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: sheetsUrl,
									onChange: (e) => setSheetsUrl(e.target.value),
									placeholder: "https://script.google.com/macros/s/.../exec",
									className: "pl-9 h-10 text-[13px] font-mono"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								onClick: handleSaveUrl,
								className: "h-10 shrink-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-4 w-4 mr-1.5" }), " Save URL"]
							})]
						}),
						sheetsUrl && !sheetsUrl.startsWith("https://script.google.com/") && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-[12px] text-destructive flex items-center gap-1.5 mt-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "h-3 w-3" }), " URL must start with https://script.google.com/"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-lg border border-blue-200/50 bg-blue-50/40 p-3 text-[12px] text-blue-800 space-y-1.5 mt-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "font-semibold flex items-center gap-1.5 text-blue-900",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shield, { className: "h-3.5 w-3.5 text-blue-600" }), " Make Connection Permanent"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-blue-700/90 leading-relaxed",
								children: [
									"To prevent database disconnection when browser storage is cleared, set the",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
										className: "font-mono bg-blue-100/60 px-1 py-0.5 rounded text-[11px] font-semibold text-blue-900 mx-0.5",
										children: "VITE_GSHEETS_URL"
									}),
									"environment variable in Netlify/Vercel settings or in your local ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
										className: "font-mono bg-blue-100/60 px-1 py-0.5 rounded text-[11px] font-semibold text-blue-900",
										children: ".env"
									}),
									" file."
								]
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap gap-3 border-t border-border/50 pt-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "outline",
							onClick: handleTestConnection,
							disabled: testStatus === "testing" || !sheetsUrl,
							className: "h-9 text-[13px]",
							children: [testStatus === "testing" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "h-3.5 w-3.5 mr-1.5 animate-spin" }) : testStatus === "ok" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "h-3.5 w-3.5 mr-1.5 text-success" }) : testStatus === "error" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleX, { className: "h-3.5 w-3.5 mr-1.5 text-destructive" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link2, { className: "h-3.5 w-3.5 mr-1.5" }), "Test Connection"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							onClick: handleSyncAll,
							disabled: isSyncing || isPulling || !isGSheetsEnabled(),
							className: "h-9 text-[13px]",
							children: [isSyncing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "h-3.5 w-3.5 mr-1.5 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CloudUpload, { className: "h-3.5 w-3.5 mr-1.5" }), isSyncing ? "Syncing..." : "Sync All Data to Sheets"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "outline",
							onClick: handlePullAll,
							disabled: isSyncing || isPulling || !isGSheetsEnabled(),
							className: "h-9 text-[13px]",
							children: [isPulling ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "h-3.5 w-3.5 mr-1.5 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CloudDownload, { className: "h-3.5 w-3.5 mr-1.5" }), isPulling ? "Pulling..." : "Pull Data from Sheets"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "outline",
							onClick: handleSyncMissingFiles,
							disabled: isSyncingFiles || isSyncing || isPulling || !isGSheetsEnabled(),
							className: "h-9 text-[13px]",
							title: "Push document files stored on this device that never made it to Google Sheets, so they become downloadable/previewable on every device",
							children: [isSyncingFiles ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "h-3.5 w-3.5 mr-1.5 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CloudUpload, { className: "h-3.5 w-3.5 mr-1.5" }), isSyncingFiles ? fileSyncProgress ? `Checking ${fileSyncProgress.checked}/${fileSyncProgress.total}...` : "Checking..." : "Sync Missing Files"]
						})
					]
				}),
				testMessage && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: `rounded-lg px-4 py-2.5 text-[12px] flex items-center gap-2 border ${testStatus === "ok" ? "bg-success/10 text-success border-success/20" : testStatus === "error" ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-muted text-muted-foreground border-border/50"}`,
					children: [testStatus === "ok" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "h-3.5 w-3.5 shrink-0" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleX, { className: "h-3.5 w-3.5 shrink-0" }), testMessage]
				}),
				syncResult && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-lg border border-border/60 bg-muted/10 p-3 text-[12px] space-y-1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-semibold text-foreground",
							children: "Sync Result:"
						}),
						syncResult.sheetsWritten.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-success flex items-center gap-1.5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "h-3 w-3" }),
								"Synced: ",
								syncResult.sheetsWritten.join(", ")
							]
						}),
						syncResult.errors.map((e, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-destructive flex items-center gap-1.5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleX, { className: "h-3 w-3" }),
								" ",
								e
							]
						}, i))
					]
				}),
				fileSyncResult && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-lg border border-border/60 bg-muted/10 p-3 text-[12px] space-y-1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-semibold text-foreground",
							children: "Missing File Sync Result:"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-muted-foreground",
							children: [
								"Checked ",
								fileSyncResult.checked,
								" file(s) stored on this device."
							]
						}),
						fileSyncResult.uploaded > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-success flex items-center gap-1.5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "h-3 w-3" }),
								" Uploaded ",
								fileSyncResult.uploaded,
								" missing file(s) to Google Sheets"
							]
						}),
						fileSyncResult.alreadySynced > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-muted-foreground flex items-center gap-1.5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "h-3 w-3" }),
								" ",
								fileSyncResult.alreadySynced,
								" already backed up"
							]
						}),
						fileSyncResult.failed > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-destructive flex items-center gap-1.5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleX, { className: "h-3 w-3" }),
								" ",
								fileSyncResult.failed,
								" failed to upload — retry later"
							]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2 text-[12px]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-muted-foreground",
						children: "Integration Status:"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: `inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-semibold border text-[11px] ${isGSheetsEnabled() ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground border-border/50"}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `h-1.5 w-1.5 rounded-full bg-current ${isGSheetsEnabled() ? "animate-pulse" : "opacity-40"}` }), isGSheetsEnabled() ? "Active — Auto-syncing writes to Sheets" : "Inactive — Save a URL to enable"]
					})]
				})
			]
		})] }), typeof window !== "undefined" && localStorage.getItem("medirent-user-role") === "Admin" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
			className: "border-destructive/30 bg-destructive/5 mt-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, {
				className: "border-b border-destructive/10 px-6 py-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "metric-icon h-9 w-9 shrink-0 bg-destructive/10 text-destructive border-destructive/20",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-4.5 w-4.5 text-destructive" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
						className: "text-destructive",
						children: "Danger Zone — Reset Database"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[12px] text-muted-foreground mt-0.5",
						children: "Permanently purge all data from the database."
					})] })]
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
				className: "p-6 space-y-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[12px] text-muted-foreground leading-normal",
					children: "This will permanently delete all records (Customers, Equipment, Rentals, Payments, Returns, Owners, Documents) from your local browser. If Google Sheets is connected, you can also choose to clear all rows in the connected spreadsheets."
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "destructive",
					onClick: handleClearAllDatabase,
					className: "w-full sm:w-auto h-10 gap-1.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "h-4 w-4" }), "Delete All Database Data"]
				})]
			})]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
			className: "border-border/30 mt-6",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
				className: "p-6",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-[12px] text-muted-foreground flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shield, { className: "h-4 w-4 text-primary shrink-0" }), "Database reset operations are restricted to Administrator accounts only."]
				})
			})
		})]
	});
}
function CompanySettingsTab() {
	const [settings, setSettings] = (0, import_react.useState)(getCompanySettings());
	const update = (key) => (e) => {
		setSettings((prev) => ({
			...prev,
			[key]: e.target.value
		}));
	};
	const handleSave = () => {
		saveCompanySettings(settings);
		toast.success("Company settings saved successfully.");
	};
	const handleCancel = () => {
		setSettings(getCompanySettings());
		toast.info("Company settings edits discarded.");
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, {
		className: "border-b border-border/60 bg-muted/20 px-6 py-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "metric-icon h-9 w-9 bg-primary/10 text-primary border-primary/20",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building2, { className: "h-4.5 w-4.5" })
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Company Details" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[12px] text-muted-foreground mt-0.5",
				children: "Your business identity & contact info"
			})] })]
		})
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
		className: "p-6 grid gap-5 sm:grid-cols-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ControlledField, {
				label: "Company Name",
				value: settings.companyName,
				onChange: update("companyName")
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ControlledField, {
				label: "GSTIN",
				value: settings.gstin,
				onChange: update("gstin")
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ControlledField, {
				label: "Contact Email",
				value: settings.contactEmail,
				onChange: update("contactEmail"),
				type: "email"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ControlledField, {
				label: "Contact Phone",
				value: settings.contactPhone,
				onChange: update("contactPhone")
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "sm:col-span-2",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ControlledField, {
					label: "Address",
					value: settings.address,
					onChange: update("address")
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "sm:col-span-2 space-y-1.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
					className: "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
					children: "Logo Upload"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					type: "file",
					className: "h-10 text-[13px] file:text-[13px]"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "sm:col-span-2 flex items-center justify-between border-t border-border/50 pt-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[12px] text-muted-foreground",
					children: "Changes are saved to local storage and persist across refreshes."
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						type: "button",
						onClick: handleCancel,
						children: "Cancel"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						type: "button",
						onClick: handleSave,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "mr-2 h-4 w-4" }), "Save Changes"]
					})]
				})]
			})
		]
	})] });
}
function UserLoginCredentials() {
	const [staffUsers, setStaffUsers] = (0, import_react.useState)(() => {
		if (typeof window !== "undefined") {
			const saved = localStorage.getItem("medirent-staff-users");
			if (saved) try {
				return JSON.parse(saved);
			} catch (e) {
				console.error(e);
			}
			const defaultList = [{
				id: "1",
				name: "Relife Admin",
				email: "relifemedicaltechnologies.mys@gmail.com",
				passwordHash: "2d8b2a1ff89a8b02e74a88a7fba7304e1724aa45324dd82ce7da2f9d4d3b0cec",
				role: "Admin",
				firstAdmin: true
			}];
			localStorage.setItem("medirent-staff-users", JSON.stringify(defaultList));
			return defaultList;
		}
		return [];
	});
	const [newName, setNewName] = (0, import_react.useState)("");
	const [newEmail, setNewEmail] = (0, import_react.useState)("");
	const [newPassword, setNewPassword] = (0, import_react.useState)("");
	const [newRole, setNewRole] = (0, import_react.useState)("Staff");
	const [isOpen, setIsOpen] = (0, import_react.useState)(false);
	const handleAddUser = async (e) => {
		e.preventDefault();
		if (!newName.trim()) {
			toast.error("Please enter a name");
			return;
		}
		if (!newEmail.trim() || !newEmail.includes("@")) {
			toast.error("Please enter a valid email address");
			return;
		}
		if (newPassword.length < 8) {
			toast.error("Password must be at least 8 characters long");
			return;
		}
		if (!/[A-Z]/.test(newPassword)) {
			toast.error("Password must contain at least one uppercase letter");
			return;
		}
		if (!/[0-9]/.test(newPassword)) {
			toast.error("Password must contain at least one number");
			return;
		}
		if (!/[^A-Za-z0-9]/.test(newPassword)) {
			toast.error("Password must contain at least one special character (e.g. @, #, !)");
			return;
		}
		if (staffUsers.some((u) => u.email.toLowerCase() === newEmail.toLowerCase().trim())) {
			toast.error("A user with this email already exists");
			return;
		}
		const encoded = new TextEncoder().encode(newPassword);
		const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
		const passwordHash = Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
		const newUser = {
			id: Date.now().toString(),
			name: newName.trim(),
			email: newEmail.toLowerCase().trim(),
			passwordHash,
			role: newRole
		};
		const updatedList = [...staffUsers, newUser];
		setStaffUsers(updatedList);
		localStorage.setItem("medirent-staff-users", JSON.stringify(updatedList));
		if (isGSheetsEnabled()) syncRowToSheet(SHEETS.STAFF, newUser);
		toast.success("Staff user added successfully.");
		setNewName("");
		setNewEmail("");
		setNewPassword("");
		setNewRole("Staff");
		setIsOpen(false);
	};
	const handleDeleteUser = (id, isFirstAdmin) => {
		if (isFirstAdmin) {
			toast.error("The primary administrator account cannot be deleted.");
			return;
		}
		const updatedList = staffUsers.filter((u) => u.id !== id);
		setStaffUsers(updatedList);
		localStorage.setItem("medirent-staff-users", JSON.stringify(updatedList));
		if (isGSheetsEnabled()) deleteRowFromSheet(SHEETS.STAFF, id);
		toast.success("Staff user deleted successfully.");
	};
	const isCurrentUserAdmin = (typeof window !== "undefined" ? localStorage.getItem("medirent-user-role") : null) === "Admin";
	const getRoleBadgeClass = (role) => {
		switch (role) {
			case "Admin": return "bg-indigo-50 text-indigo-700 border-indigo-200/50 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800/40";
			default: return "bg-emerald-50 text-emerald-700 border-emerald-200/50 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40";
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, {
		className: "border-b border-border/60 bg-muted/20 px-6 py-4 flex flex-row items-center justify-between gap-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "metric-icon h-9 w-9 bg-primary/10 text-primary border-primary/20",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "h-4.5 w-4.5" })
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "User Login Credentials" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[12px] text-muted-foreground mt-0.5",
				children: "Manage staff login emails, passwords, and access roles"
			})] })]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, {
			open: isOpen,
			onOpenChange: setIsOpen,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
				asChild: true,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					size: "sm",
					className: "h-9 text-[12px] gap-1.5 shadow-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserPlus, { className: "h-4 w-4" }), " Add Staff User"]
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogContent, {
				className: "sm:max-w-[420px]",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					onSubmit: handleAddUser,
					className: "space-y-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Add Staff User" }) }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-3.5 py-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										htmlFor: "name",
										className: "text-[11px] font-bold uppercase tracking-[0.05em] text-muted-foreground",
										children: "Full Name"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										id: "name",
										value: newName,
										onChange: (e) => setNewName(e.target.value),
										placeholder: "e.g. John Doe",
										required: true,
										className: "h-10 text-[13px]"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										htmlFor: "email",
										className: "text-[11px] font-bold uppercase tracking-[0.05em] text-muted-foreground",
										children: "Email Address"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										id: "email",
										type: "email",
										value: newEmail,
										onChange: (e) => setNewEmail(e.target.value),
										placeholder: "e.g. john@medirent.com",
										required: true,
										className: "h-10 text-[13px]"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										htmlFor: "password",
										className: "text-[11px] font-bold uppercase tracking-[0.05em] text-muted-foreground",
										children: "Login Password"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										id: "password",
										type: "password",
										value: newPassword,
										onChange: (e) => setNewPassword(e.target.value),
										placeholder: "Min 8 chars, uppercase, number, symbol",
										required: true,
										className: "h-10 text-[13px]"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										htmlFor: "role",
										className: "text-[11px] font-bold uppercase tracking-[0.05em] text-muted-foreground",
										children: "Role"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
										value: newRole,
										onValueChange: (val) => setNewRole(val),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
											id: "role",
											className: "h-10 text-[13px] bg-background border border-input",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Select a role" })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: "Admin",
											className: "text-[13px]",
											children: "Admin (Full Access)"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: "Staff",
											className: "text-[13px]",
											children: "Staff User"
										})] })]
									})]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
							className: "gap-2 pt-2 border-t border-border/50",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogClose, {
								asChild: true,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									type: "button",
									variant: "outline",
									className: "h-9 text-[13px]",
									children: "Cancel"
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "submit",
								className: "h-9 text-[13px]",
								children: "Create Account"
							})]
						})
					]
				})
			})]
		})]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
		className: "p-0",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "overflow-x-auto",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, {
				className: "bg-muted/10",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
						className: "w-[200px] text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3",
						children: "Name"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
						className: "text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3",
						children: "Email"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
						className: "w-[140px] text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3",
						children: "Role"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
						className: "w-[100px] text-right text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3 pr-6",
						children: "Action"
					})
				] })
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableBody, { children: staffUsers.map((user) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, {
				className: "hover:bg-muted/5 transition-colors",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
						className: "font-semibold text-[13px] py-3.5",
						children: user.name
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
						className: "text-[13px] text-muted-foreground py-3.5",
						children: user.email
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
						className: "py-3.5",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: `inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${getRoleBadgeClass(user.role)}`,
							children: user.role
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
						className: "text-right py-3.5 pr-6",
						children: isCurrentUserAdmin && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							size: "icon",
							disabled: !!user.firstAdmin,
							onClick: () => handleDeleteUser(user.id, !!user.firstAdmin),
							className: "h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10",
							title: !!user.firstAdmin ? "Primary admin cannot be deleted" : "Delete User",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-4 w-4" })
						})
					})
				]
			}, user.id)) })] })
		})
	})] });
}
function SettingsPage() {
	const isStaff = typeof window !== "undefined" && localStorage.getItem("medirent-user-role") === "Staff";
	const [activeSection, setActiveSection] = (0, import_react.useState)("company");
	if (isStaff) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		title: "Access Denied",
		subtitle: "You do not have permission to view settings.",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "max-w-4xl mx-auto py-12 text-center",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-muted-foreground bg-destructive/10 text-destructive border border-destructive/20 rounded-lg p-4 font-semibold inline-block",
				children: "Access Denied: Settings are only accessible by Administrators."
			})
		})
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		title: "Settings",
		subtitle: "Manage your company details, user login credentials, and database sync settings",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-6xl mx-auto flex flex-col lg:flex-row gap-6 pb-10",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "w-full lg:w-[260px] shrink-0 space-y-1.5",
				children: [
					{
						id: "company",
						label: "Company Profile",
						desc: "Business identity & details",
						icon: Building2
					},
					{
						id: "credentials",
						label: "User Credentials",
						desc: "Staff accounts & access",
						icon: Lock
					},
					{
						id: "database",
						label: "Database Sync",
						desc: "Google Sheets connection",
						icon: Database
					}
				].map((item) => {
					const Icon = item.icon;
					const isActive = activeSection === item.id;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => setActiveSection(item.id),
						className: `w-full flex items-center gap-3.5 px-4.5 py-3.5 rounded-xl border text-left transition-all duration-200 ${isActive ? "bg-primary text-primary-foreground border-primary shadow-[var(--shadow-soft)]" : "bg-card hover:bg-muted/40 border-border/60 text-muted-foreground hover:text-foreground"}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: `h-4.5 w-4.5 shrink-0 ${isActive ? "text-primary-foreground" : "text-primary"}` }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[13px] font-bold tracking-tight",
								children: item.label
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: `text-[10px] truncate mt-0.5 ${isActive ? "text-primary-foreground/75" : "text-muted-foreground/80"}`,
								children: item.desc
							})]
						})]
					}, item.id);
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex-1 min-w-0",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: activeSection === "company" ? "block animate-[fade-in_0.3s_ease-out]" : "hidden",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CompanySettingsTab, {})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: activeSection === "credentials" ? "block animate-[fade-in_0.3s_ease-out]" : "hidden",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserLoginCredentials, {})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: activeSection === "database" ? "block animate-[fade-in_0.3s_ease-out]" : "hidden",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DatabaseSettingsTab, {})
					})
				]
			})]
		})
	});
}
function FieldLabel({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
		className: "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
		children
	});
}
function ControlledField({ label, value, onChange, type = "text", className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `space-y-1.5 ${className ?? ""}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldLabel, { children: label }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
			type,
			value,
			onChange,
			className: "h-10 text-[13px]"
		})]
	});
}
//#endregion
export { SettingsPage as component };
