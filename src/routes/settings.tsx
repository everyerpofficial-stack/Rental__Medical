import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Building2, CreditCard, Shield, Bell, Check, Users, Wallet, MessageSquare, Mail, Phone, BarChart3,
  Database, Link2, CheckCircle2, XCircle, RefreshCw, AlertTriangle, Copy, ExternalLink, CloudUpload, CloudDownload,
  Lock, Trash2, UserPlus,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  getCompanySettings,
  saveCompanySettings,
  CompanySettings,
  getAllDataForSync,
  syncFromSheetsToLocalStorage,
  syncMissingFileChunks,
} from "@/lib/data-store";
import {
  getGSheetsUrl,
  setGSheetsUrl,
  getGSheetsToken,
  setGSheetsToken,
  testConnection,
  syncAllToSheets,
  isGSheetsEnabled,
  clearSheetInGSheets,
  SHEETS,
  syncRowToSheet,
  deleteRowFromSheet,
} from "@/lib/google-sheets";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — Relife" }] }),
  component: SettingsPage,
});

const roleIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "Admin": Shield,
  "Staff": Users,
};

// ─── Database / Google Sheets Tab ────────────────────────────────────────────

function DatabaseSettingsTab() {
  const [sheetsUrl, setSheetsUrl] = useState(getGSheetsUrl());
  const [sheetsToken, setSheetsToken] = useState(getGSheetsToken());
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "ok" | "error">("idle");
  const [testMessage, setTestMessage] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ sheetsWritten: string[]; errors: string[] } | null>(null);
  const [isSyncingFiles, setIsSyncingFiles] = useState(false);
  const [fileSyncProgress, setFileSyncProgress] = useState<{ checked: number; total: number } | null>(null);
  const [fileSyncResult, setFileSyncResult] = useState<{ checked: number; uploaded: number; alreadySynced: number; failed: number } | null>(null);
  const [isPulling, setIsPulling] = useState(false);

  const SHEET_ID = "1f5mJV8P90ID2-BiyeZZvtBF0Q3JjvyElbfI4omxkJRw";

  const appsScriptCode = `// ══════════════════════════════════════════════════════════
// MediRent / Relife ERP — Google Apps Script Web App  (v6 — Shared-Secret Auth)
// Sheet ID: ${SHEET_ID}
//
// SETUP STEPS:
//  1. Open your Google Sheet: https://docs.google.com/spreadsheets/d/${SHEET_ID}
//  2. Click Extensions → Apps Script
//  3. Replace ALL existing code with this script
//  4. (Recommended) Change TOKEN below to your own secret, and paste the same
//     value into the "Shared Secret Token" field below before saving.
//  5. Click Deploy → New Deployment → Web App
//     - Execute as: Me
//     - Who has access: Anyone
//  6. Click Deploy → copy the Web App URL
//  7. Paste the URL (and token) into the fields above and click Test Connection
// ══════════════════════════════════════════════════════════

// SECURITY: every request must include a token matching TOKEN below, or it's
// rejected before touching any sheet. Without this, anyone who has the Web
// App URL (it ships in the public frontend bundle) could read/write/delete
// the entire database with no login at all.
const TOKEN = "${sheetsToken || "CHANGE_ME_TO_A_LONG_RANDOM_SECRET"}";

// BUG-9 FIX (v3): Added "FileChunks" — required for cross-device PDF/image sync.
// Without this, file chunk upserts silently failed because the sheet wasn't tracked.
const SHEET_NAMES = ["Customers", "Equipment", "Rentals", "Payments", "Returns", "Owners", "Documents", "Exchanges", "FileChunks", "Staff"];

function unauthorized() {
  return ContentService
    .createTextOutput(JSON.stringify({ error: "Unauthorized" }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─── GET handler ────────────────────────────────────────────────────────────

function doGet(e) {
  if (e.parameter.token !== TOKEN) return unauthorized();

  const action = e.parameter.action;
  const sheet  = e.parameter.sheet;

  if (action === "ping") {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    return ContentService
      .createTextOutput(JSON.stringify({ status: "ok", sheetName: ss.getName(), version: "v6" }))
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
  const body = JSON.parse(e.postData.contents);
  if (body.token !== TOKEN) return unauthorized();

  const action = body.action;

  // ── Send OTP email (no lock needed — doesn't touch a sheet) ─────────────
  if (action === "sendOtp" && body.email && body.otp) {
    var otp = body.otp;
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
    MailApp.sendEmail({ to: body.email, subject: "Relife ERP — Verification Code: " + otp, body: plainBody, htmlBody: htmlBody });
    return ContentService
      .createTextOutput(JSON.stringify({ status: "ok" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Every write path below mutates a sheet via a read-then-write sequence
  // (find row by id, then overwrite or append). Apps Script runs concurrent
  // requests as separate executions, so without a lock two requests can both
  // read "row not found yet" and both append — one silently clobbers the
  // other. The lock forces writes to happen one at a time.
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(LOCK_WAIT_MS);
  } catch (lockErr) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: "Server busy, please retry" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  try {
    const sheet = body.sheet;
    const row   = body.row;
    const rows  = body.rows;
    const id    = body.id;
    const ss    = SpreadsheetApp.getActiveSpreadsheet();

    function getOrCreateSheet(name) {
      var sh = ss.getSheetByName(name);
      if (!sh) sh = ss.insertSheet(name);
      return sh;
    }

    if (action === "upsert" && sheet && row) {
      const sh = getOrCreateSheet(sheet);
      const headersChanged = upsertRow(sh, row);
      if (headersChanged) applyHeaderFormat(sh);
      return ContentService.createTextOutput(JSON.stringify({ status: "ok" })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "bulkUpsert" && sheet && rows) {
      const sh = getOrCreateSheet(sheet);
      bulkUpsertRows(sh, rows);
      return ContentService.createTextOutput(JSON.stringify({ status: "ok", count: rows.length })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "delete" && sheet && id) {
      const sh = ss.getSheetByName(sheet);
      if (sh) deleteRow(sh, id);
      return ContentService.createTextOutput(JSON.stringify({ status: "ok" })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "clearSheet" && sheet) {
      const sh = ss.getSheetByName(sheet);
      if (sh && sh.getLastRow() > 1 && sh.getLastColumn() > 0) {
        sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).clearContent();
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "ok" })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ error: "Unknown action" })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: String(err) })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// ─── Bulk upsert ────────────────────────────────────────────────────────────

function bulkUpsertRows(sh, rows) {
  if (!rows || rows.length === 0) return;
  var allKeys = [];
  rows.forEach(function(r) {
    Object.keys(r).forEach(function(k) {
      if (allKeys.indexOf(k) === -1) allKeys.push(k);
    });
  });
  var headers;
  var headersChanged = false;
  if (sh.getLastRow() === 0 || sh.getLastColumn() === 0) {
    sh.appendRow(allKeys);
    headers = allKeys.slice();
    headersChanged = true;
  } else {
    headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
    var newKeys = allKeys.filter(function(k) { return headers.indexOf(k) === -1; });
    if (newKeys.length > 0) {
      newKeys.forEach(function(k) { headers.push(k); sh.getRange(1, headers.length).setValue(k); });
      headersChanged = true;
    }
  }
  var idCol = headers.indexOf("id");
  var existingData = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, headers.length).getValues() : [];
  var idToRowIndex = {};
  if (idCol !== -1) {
    existingData.forEach(function(r, i) { idToRowIndex[String(r[idCol])] = i; });
  }
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
      sh.getRange(idToRowIndex[rowId] + 2, 1, 1, headers.length).setValues([newRow]);
    } else {
      toAppend.push(newRow);
    }
  });
  if (toAppend.length > 0) {
    sh.getRange(sh.getLastRow() + 1, 1, toAppend.length, headers.length).setValues(toAppend);
  }
  if (headersChanged) applyHeaderFormat(sh);
}

// ─── Single row upsert ──────────────────────────────────────────────────────
// Returns true if the header row was created or extended (so the caller
// knows whether it's worth re-running the (relatively expensive) formatting).

function upsertRow(sh, row) {
  var keys = Object.keys(row);
  var headers = [];
  var headersChanged = false;
  if (sh.getLastRow() === 0 || sh.getLastColumn() === 0) {
    sh.appendRow(keys);
    headers = keys;
    headersChanged = true;
  } else {
    headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
    var newKeys = keys.filter(function(k) { return headers.indexOf(k) === -1; });
    if (newKeys.length > 0) {
      newKeys.forEach(function(k) { headers.push(k); sh.getRange(1, headers.length).setValue(k); });
      headersChanged = true;
    }
  }
  var idCol = headers.indexOf("id");
  var newRow = headers.map(function(h) {
    var val = row[h];
    if (val === undefined) return "";
    if (val !== null && typeof val === "object") return JSON.stringify(val);
    return val;
  });
  if (idCol === -1) { sh.appendRow(newRow); return headersChanged; }
  var rowId = String(row["id"]);
  var existingData = sh.getLastRow() > 1 && sh.getLastColumn() > 0
    ? sh.getRange(2, 1, sh.getLastRow() - 1, headers.length).getValues() : [];
  var found = false;
  for (var i = 0; i < existingData.length; i++) {
    if (String(existingData[i][idCol]) === rowId) {
      sh.getRange(i + 2, 1, 1, headers.length).setValues([newRow]);
      found = true;
      break;
    }
  }
  if (!found) { sh.appendRow(newRow); }
  return headersChanged;
}

// ─── Delete row ─────────────────────────────────────────────────────────────

function deleteRow(sh, id) {
  if (sh.getLastRow() < 2 || sh.getLastColumn() === 0) return;
  var headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  var idCol = -1;
  var targetId = String(id).trim();
  for (var h = 0; h < headers.length; h++) {
    var hName = String(headers[h] || "").trim().toLowerCase();
    if (hName === "id" || hName === "fileid") {
      idCol = h;
      break;
    }
  }
  if (idCol === -1) return;
  var data = sh.getRange(2, 1, sh.getLastRow() - 1, headers.length).getValues();
  for (var i = data.length - 1; i >= 0; i--) {
    if (String(data[i][idCol]).trim() === targetId) {
      sh.deleteRow(i + 2);
    }
  }
}

// ─── Header formatting ───────────────────────────────────────────────────────

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
      sh.setColumnWidth(c, Math.max(120, sh.getColumnWidth(c) + 20));
    }
  } catch (err) {}
}`;

  const handleSaveUrl = () => {
    if (sheetsUrl && !sheetsUrl.startsWith("https://script.google.com/")) {
      toast.error("URL must start with https://script.google.com/");
      return;
    }
    setGSheetsUrl(sheetsUrl);
    setGSheetsToken(sheetsToken);
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
    if (result.ok) {
      toast.success("Connection successful!");
    } else {
      toast.error("Connection failed: " + result.message);
    }
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
      const allData = getAllDataForSync();
      const result = await syncAllToSheets(allData);
      setSyncResult(result);
      if (result.success) {
        toast.success(`All data synced! ${result.sheetsWritten.length} sheets updated.`);
      } else {
        toast.warning(`Sync partially complete. ${result.errors.length} errors occurred.`);
      }
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
      const result = await syncMissingFileChunks((checked, total) => setFileSyncProgress({ checked, total }));
      setFileSyncResult(result);
      if (result.checked === 0) {
        toast.info("No document files found on this device to check.");
      } else if (result.failed > 0) {
        toast.warning(`Uploaded ${result.uploaded} missing file(s); ${result.failed} failed — retry later.`);
      } else if (result.uploaded > 0) {
        toast.success(`Uploaded ${result.uploaded} file(s) that were missing from Google Sheets. They're now downloadable on every device.`);
      } else {
        toast.success("All of this device's document files are already backed up to Google Sheets.");
      }
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
    const confirmPull = window.confirm(
      "Are you sure you want to pull all data from Google Sheets? This will OVERWRITE your browser's local data with the data from Google Sheets."
    );
    if (!confirmPull) return;

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
    const doubleCheck = window.confirm(
      "WARNING: This will permanently delete all records (Customers, Equipment, Rentals, Payments, Returns, Owners, Documents, Exchanges) from your local browser database. This action is IRREVERSIBLE.\n\nAre you sure you want to proceed?"
    );
    if (!doubleCheck) return;

    if (isGSheetsEnabled()) {
      const clearGSheets = window.confirm(
        "Your Google Sheets database is connected. Do you also want to clear all data rows in Google Sheets? (Keeping sheet headers intact)"
      );
      if (clearGSheets) {
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
            SHEETS.EXCHANGES,
          ];
          for (const s of sheetsToClear) {
            const res = await clearSheetInGSheets(s);
            if (!res.success) {
              throw new Error(`Failed to clear sheet ${s}: ${res.error}`);
            }
          }
          toast.success("Google Sheets database cleared successfully!");
        } catch (e) {
          const errMsg = String(e);
          console.warn("[GSheets] Clear failed:", e);
          const proceedAnyway = window.confirm(
            `Failed to clear Google Sheets: ${errMsg}\n\nThis usually happens because your deployed Google Apps Script does not support the new clear action. To fix this, copy the updated Apps Script code from the section above, paste it in Extensions → Apps Script, and click Deploy → New Deployment.\n\nDo you want to clear your local database anyway?`
          );
          if (!proceedAnyway) return;
        }
      }
    }

    // Clear local storage keys
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

  return (
    <div className="space-y-5">
      {/* Setup Guide */}
      <Card>
        <CardHeader className="border-b border-border/60 bg-muted/20 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="metric-icon h-9 w-9 bg-success/10 text-success border-success/20">
              <Database className="h-4.5 w-4.5" />
            </div>
            <div>
              <CardTitle>Google Sheets Database</CardTitle>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                Connected to Sheet ID: <span className="font-mono text-primary">{SHEET_ID}</span>
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-5">
          {/* Step-by-step guide */}
          <div className="rounded-xl border border-border/60 bg-muted/10 p-4 space-y-3">
            <p className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">Setup Guide</p>
            <ol className="space-y-2 text-[13px]">
              {[
                <>Open your <a href={`https://docs.google.com/spreadsheets/d/${SHEET_ID}`} target="_blank" rel="noreferrer" className="text-primary underline inline-flex items-center gap-1">Google Sheet <ExternalLink className="h-3 w-3" /></a></>,
                "Click Extensions → Apps Script",
                "Replace all code with the script below, then click Save (Ctrl+S)",
                "Click Deploy → New Deployment → Web App → Execute as: Me → Access: Anyone",
                "Copy the Web App URL and paste it below, along with the same Shared Secret Token from the script",
                "Click Save, then Test Connection, then Sync All Data",
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold mt-0.5">{i + 1}</span>
                  <span className="text-muted-foreground leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Apps Script Code */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Apps Script Code (Copy → Paste into Script Editor)
              </Label>
              <Button variant="outline" size="sm" className="h-7 text-[12px] self-start sm:self-auto" onClick={copyScript}>
                <Copy className="h-3 w-3 mr-1.5" /> Copy Code
              </Button>
            </div>
            <div className="relative rounded-xl border border-border bg-muted/30 overflow-hidden">
              <pre className="text-[10px] font-mono text-muted-foreground p-4 overflow-x-auto max-h-[200px] overflow-y-auto leading-relaxed">
                {appsScriptCode.substring(0, 500)}...
              </pre>
            </div>
          </div>

          {/* URL Input */}
          <div className="space-y-2">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Apps Script Web App URL
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Link2 className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
                <Input
                  value={sheetsUrl}
                  onChange={(e) => setSheetsUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="pl-9 h-10 text-[13px] font-mono"
                />
              </div>
              <Button onClick={handleSaveUrl} className="h-10 shrink-0">
                <Check className="h-4 w-4 mr-1.5" /> Save URL
              </Button>
            </div>
            {sheetsUrl && !sheetsUrl.startsWith("https://script.google.com/") && (
              <p className="text-[12px] text-destructive flex items-center gap-1.5 mt-1">
                <AlertTriangle className="h-3 w-3" /> URL must start with https://script.google.com/
              </p>
            )}
          </div>

          {/* Token Input */}
          <div className="space-y-2">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Shared Secret Token
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
                <Input
                  value={sheetsToken}
                  onChange={(e) => setSheetsToken(e.target.value)}
                  placeholder="Must match the TOKEN constant in your Apps Script"
                  className="pl-9 h-10 text-[13px] font-mono"
                />
              </div>
              <Button onClick={handleSaveUrl} className="h-10 shrink-0">
                <Check className="h-4 w-4 mr-1.5" /> Save
              </Button>
            </div>
            <div className="rounded-lg border border-amber-200/50 bg-amber-50/40 p-3 text-[12px] text-amber-800 space-y-1.5 mt-1">
              <p className="font-semibold flex items-center gap-1.5 text-amber-900">
                <Shield className="h-3.5 w-3.5 text-amber-600" /> Why this matters
              </p>
              <p className="text-amber-700/90 leading-relaxed">
                The Apps Script Web App URL above is public — it ships inside this app's JavaScript bundle, so anyone
                who inspects it can find it. Without a matching token, the script would accept read/write/delete
                requests from anyone with that URL, with no login required. Every request now includes this token,
                and the script rejects anything that doesn't match — keep it out of screenshots and shared docs, and
                rotate it (change it here <em>and</em> in the deployed script's TOKEN constant) if it's ever exposed.
              </p>
            </div>
            <div className="rounded-lg border border-blue-200/50 bg-blue-50/40 p-3 text-[12px] text-blue-800 space-y-1.5 mt-1">
              <p className="font-semibold flex items-center gap-1.5 text-blue-900">
                <Shield className="h-3.5 w-3.5 text-blue-600" /> Make Connection Permanent
              </p>
              <p className="text-blue-700/90 leading-relaxed">
                To prevent database disconnection when browser storage is cleared, set the
                <code className="font-mono bg-blue-100/60 px-1 py-0.5 rounded text-[11px] font-semibold text-blue-900 mx-0.5">VITE_GSHEETS_URL</code>
                and <code className="font-mono bg-blue-100/60 px-1 py-0.5 rounded text-[11px] font-semibold text-blue-900 mx-0.5">VITE_GSHEETS_TOKEN</code>
                environment variables in your Vercel project settings or in your local <code className="font-mono bg-blue-100/60 px-1 py-0.5 rounded text-[11px] font-semibold text-blue-900">.env</code> file.
              </p>
            </div>
          </div>

          {/* Test + Sync */}
          <div className="flex flex-wrap gap-3 border-t border-border/50 pt-4">
            <Button
              variant="outline"
              onClick={handleTestConnection}
              disabled={testStatus === "testing" || !sheetsUrl}
              className="h-9 text-[13px]"
            >
              {testStatus === "testing" ? (
                <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : testStatus === "ok" ? (
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-success" />
              ) : testStatus === "error" ? (
                <XCircle className="h-3.5 w-3.5 mr-1.5 text-destructive" />
              ) : (
                <Link2 className="h-3.5 w-3.5 mr-1.5" />
              )}
              Test Connection
            </Button>

            <Button
              onClick={handleSyncAll}
              disabled={isSyncing || isPulling || !isGSheetsEnabled()}
              className="h-9 text-[13px]"
            >
              {isSyncing ? (
                <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <CloudUpload className="h-3.5 w-3.5 mr-1.5" />
              )}
              {isSyncing ? "Syncing..." : "Sync All Data to Sheets"}
            </Button>

            <Button
              variant="outline"
              onClick={handlePullAll}
              disabled={isSyncing || isPulling || !isGSheetsEnabled()}
              className="h-9 text-[13px]"
            >
              {isPulling ? (
                <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <CloudDownload className="h-3.5 w-3.5 mr-1.5" />
              )}
              {isPulling ? "Pulling..." : "Pull Data from Sheets"}
            </Button>

            <Button
              variant="outline"
              onClick={handleSyncMissingFiles}
              disabled={isSyncingFiles || isSyncing || isPulling || !isGSheetsEnabled()}
              className="h-9 text-[13px]"
              title="Push document files stored on this device that never made it to Google Sheets, so they become downloadable/previewable on every device"
            >
              {isSyncingFiles ? (
                <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <CloudUpload className="h-3.5 w-3.5 mr-1.5" />
              )}
              {isSyncingFiles
                ? fileSyncProgress
                  ? `Checking ${fileSyncProgress.checked}/${fileSyncProgress.total}...`
                  : "Checking..."
                : "Sync Missing Files"}
            </Button>
          </div>

          {/* Connection status message */}
          {testMessage && (
            <div className={`rounded-lg px-4 py-2.5 text-[12px] flex items-center gap-2 border ${
              testStatus === "ok"
                ? "bg-success/10 text-success border-success/20"
                : testStatus === "error"
                ? "bg-destructive/10 text-destructive border-destructive/20"
                : "bg-muted text-muted-foreground border-border/50"
            }`}>
              {testStatus === "ok" ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> : <XCircle className="h-3.5 w-3.5 shrink-0" />}
              {testMessage}
            </div>
          )}

          {/* Sync result */}
          {syncResult && (
            <div className="rounded-lg border border-border/60 bg-muted/10 p-3 text-[12px] space-y-1">
              <p className="font-semibold text-foreground">Sync Result:</p>
              {syncResult.sheetsWritten.length > 0 && (
                <p className="text-success flex items-center gap-1.5">
                  <CheckCircle2 className="h-3 w-3" />
                  Synced: {syncResult.sheetsWritten.join(", ")}
                </p>
              )}
              {syncResult.errors.map((e, i) => (
                <p key={i} className="text-destructive flex items-center gap-1.5">
                  <XCircle className="h-3 w-3" /> {e}
                </p>
              ))}
            </div>
          )}

          {/* File sync result */}
          {fileSyncResult && (
            <div className="rounded-lg border border-border/60 bg-muted/10 p-3 text-[12px] space-y-1">
              <p className="font-semibold text-foreground">Missing File Sync Result:</p>
              <p className="text-muted-foreground">Checked {fileSyncResult.checked} file(s) stored on this device.</p>
              {fileSyncResult.uploaded > 0 && (
                <p className="text-success flex items-center gap-1.5">
                  <CheckCircle2 className="h-3 w-3" /> Uploaded {fileSyncResult.uploaded} missing file(s) to Google Sheets
                </p>
              )}
              {fileSyncResult.alreadySynced > 0 && (
                <p className="text-muted-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="h-3 w-3" /> {fileSyncResult.alreadySynced} already backed up
                </p>
              )}
              {fileSyncResult.failed > 0 && (
                <p className="text-destructive flex items-center gap-1.5">
                  <XCircle className="h-3 w-3" /> {fileSyncResult.failed} failed to upload — retry later
                </p>
              )}
            </div>
          )}

          {/* Status pill */}
          <div className="flex items-center gap-2 text-[12px]">
            <span className="text-muted-foreground">Integration Status:</span>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-semibold border text-[11px] ${
              isGSheetsEnabled()
                ? "bg-success/10 text-success border-success/20"
                : "bg-muted text-muted-foreground border-border/50"
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full bg-current ${isGSheetsEnabled() ? "animate-pulse" : "opacity-40"}`} />
              {isGSheetsEnabled() ? "Active — Auto-syncing writes to Sheets" : "Inactive — Save a URL to enable"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone — Admin Only */}
      {typeof window !== "undefined" && localStorage.getItem("medirent-user-role") === "Admin" ? (
        <Card className="border-destructive/30 bg-destructive/5 mt-6">
          <CardHeader className="border-b border-destructive/10 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="metric-icon h-9 w-9 shrink-0 bg-destructive/10 text-destructive border-destructive/20">
                <Trash2 className="h-4.5 w-4.5 text-destructive" />
              </div>
              <div>
                <CardTitle className="text-destructive">Danger Zone — Reset Database</CardTitle>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  Permanently purge all data from the database.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <p className="text-[12px] text-muted-foreground leading-normal">
              This will permanently delete all records (Customers, Equipment, Rentals, Payments, Returns, Owners, Documents) from your local browser.
              If Google Sheets is connected, you can also choose to clear all rows in the connected spreadsheets.
            </p>

            <Button
              variant="destructive"
              onClick={handleClearAllDatabase}
              className="w-full sm:w-auto h-10 gap-1.5"
            >
              <AlertTriangle className="h-4 w-4" />
              Delete All Database Data
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/30 mt-6">
          <CardContent className="p-6">
            <p className="text-[12px] text-muted-foreground flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary shrink-0" />
              Database reset operations are restricted to Administrator accounts only.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Company Settings Tab ────────────────────────────────────────────────────

function CompanySettingsTab() {
  const [settings, setSettings] = useState<CompanySettings>(getCompanySettings());

  const update = (key: keyof CompanySettings) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSettings((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleSave = () => {
    saveCompanySettings(settings);
    toast.success("Company settings saved successfully.");
  };

  const handleCancel = () => {
    setSettings(getCompanySettings());
    toast.info("Company settings edits discarded.");
  };

  return (
    <Card>
      <CardHeader className="border-b border-border/60 bg-muted/20 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="metric-icon h-9 w-9 bg-primary/10 text-primary border-primary/20">
            <Building2 className="h-4.5 w-4.5" />
          </div>
          <div>
            <CardTitle>Company Details</CardTitle>
            <p className="text-[12px] text-muted-foreground mt-0.5">Your business identity & contact info</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 grid gap-5 sm:grid-cols-2">
        <ControlledField label="Company Name" value={settings.companyName} onChange={update("companyName")} />
        <ControlledField label="GSTIN" value={settings.gstin} onChange={update("gstin")} />
        <ControlledField label="Contact Email" value={settings.contactEmail} onChange={update("contactEmail")} type="email" />
        <ControlledField label="Contact Phone" value={settings.contactPhone} onChange={update("contactPhone")} />
        <div className="sm:col-span-2">
          <ControlledField label="Address" value={settings.address} onChange={update("address")} />
        </div>
        <div className="sm:col-span-2 space-y-1.5">
          <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Logo Upload</Label>
          <Input type="file" className="h-10 text-[13px] file:text-[13px]" />
        </div>
        <div className="sm:col-span-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-border/50 pt-5">
          <p className="text-[12px] text-muted-foreground">Changes are saved to local storage and persist across refreshes.</p>
          <div className="flex gap-2">
            <Button variant="outline" type="button" onClick={handleCancel}>Cancel</Button>
            <Button type="button" onClick={handleSave}>
              <Check className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}



// ─── User Login Credentials ──────────────────────────────────────────────────

interface StaffUser {
  id: string;
  name: string;
  email: string;
  password?: string;       // legacy plaintext (old users)
  passwordHash?: string;   // SHA-256 hash (new users)
  role: "Admin" | "Staff";
}

function UserLoginCredentials() {
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("medirent-staff-users");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error(e);
        }
      }
      // BUG-SEC FIX: Never store plaintext password here.
      // The hashed password is created the first time the admin logs in (see __root.tsx).
      const defaultList: (StaffUser & { firstAdmin?: boolean })[] = [
        {
          id: "1",
          name: "Relife Admin",
          email: "relifemedicaltechnologies.mys@gmail.com",
          passwordHash: "2d8b2a1ff89a8b02e74a88a7fba7304e1724aa45324dd82ce7da2f9d4d3b0cec",
          role: "Admin",
          firstAdmin: true,
        }
      ];
      localStorage.setItem("medirent-staff-users", JSON.stringify(defaultList));
      return defaultList;
    }
    return [];
  });

  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"Admin" | "Staff">("Staff");
  const [isOpen, setIsOpen] = useState(false);

  const handleAddUser = async (e: React.FormEvent) => {
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

    const exists = staffUsers.some(u => u.email.toLowerCase() === newEmail.toLowerCase().trim());
    if (exists) {
      toast.error("A user with this email already exists");
      return;
    }

    // Hash the password using SHA-256 (same as login verification)
    const encoded = new TextEncoder().encode(newPassword);
    const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const passwordHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    const newUser: StaffUser = {
      id: Date.now().toString(),
      name: newName.trim(),
      email: newEmail.toLowerCase().trim(),
      passwordHash,
      role: newRole,
    };

    const updatedList = [...staffUsers, newUser];
    setStaffUsers(updatedList);
    localStorage.setItem("medirent-staff-users", JSON.stringify(updatedList));
    if (isGSheetsEnabled()) {
      syncRowToSheet(SHEETS.STAFF, newUser as unknown as Record<string, unknown>);
    }
    toast.success("Staff user added successfully.");
    
    setNewName("");
    setNewEmail("");
    setNewPassword("");
    setNewRole("Staff");
    setIsOpen(false);
  };

  const handleDeleteUser = (id: string, isFirstAdmin: boolean) => {
    if (isFirstAdmin) {
      toast.error("The primary administrator account cannot be deleted.");
      return;
    }

    const updatedList = staffUsers.filter(u => u.id !== id);
    setStaffUsers(updatedList);
    localStorage.setItem("medirent-staff-users", JSON.stringify(updatedList));
    if (isGSheetsEnabled()) {
      deleteRowFromSheet(SHEETS.STAFF, id);
    }
    toast.success("Staff user deleted successfully.");
  };

  // Current logged-in user's role (for UI guards)
  const currentUserRole = typeof window !== "undefined" ? localStorage.getItem("medirent-user-role") : null;
  const isCurrentUserAdmin = currentUserRole === "Admin";

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case "Admin":
        return "bg-indigo-50 text-indigo-700 border-indigo-200/50 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800/40";
      default:
        return "bg-emerald-50 text-emerald-700 border-emerald-200/50 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40";
    }
  };

  return (
    <Card>
      <CardHeader className="border-b border-border/60 bg-muted/20 px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="metric-icon h-9 w-9 bg-primary/10 text-primary border-primary/20">
            <Lock className="h-4.5 w-4.5" />
          </div>
          <div>
            <CardTitle>User Login Credentials</CardTitle>
            <p className="text-[12px] text-muted-foreground mt-0.5">Manage staff login emails, passwords, and access roles</p>
          </div>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-9 text-[12px] gap-1.5 shadow-sm">
              <UserPlus className="h-4 w-4" /> Add Staff User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[420px]">
            <form onSubmit={handleAddUser} className="space-y-4">
              <DialogHeader>
                <DialogTitle>Add Staff User</DialogTitle>
              </DialogHeader>
              <div className="space-y-3.5 py-2">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-[11px] font-bold uppercase tracking-[0.05em] text-muted-foreground">Full Name</Label>
                  <Input id="name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. John Doe" required className="h-10 text-[13px]" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-[11px] font-bold uppercase tracking-[0.05em] text-muted-foreground">Email Address</Label>
                  <Input id="email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="e.g. john@medirent.com" required className="h-10 text-[13px]" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-[11px] font-bold uppercase tracking-[0.05em] text-muted-foreground">Login Password</Label>
                  <Input id="password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 8 chars, uppercase, number, symbol" required className="h-10 text-[13px]" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="role" className="text-[11px] font-bold uppercase tracking-[0.05em] text-muted-foreground">Role</Label>
                  <Select value={newRole} onValueChange={(val: any) => setNewRole(val)}>
                    <SelectTrigger id="role" className="h-10 text-[13px] bg-background border border-input">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Admin" className="text-[13px]">Admin (Full Access)</SelectItem>
                      <SelectItem value="Staff" className="text-[13px]">Staff User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter className="gap-2 pt-2 border-t border-border/50">
                <DialogClose asChild>
                  <Button type="button" variant="outline" className="h-9 text-[13px]">Cancel</Button>
                </DialogClose>
                <Button type="submit" className="h-9 text-[13px]">Create Account</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Desktop Table — hidden on mobile */}
        <div className="hidden sm:block overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow>
                <TableHead className="w-[200px] text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3">Name</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3">Email</TableHead>
                <TableHead className="w-[140px] text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3">Role</TableHead>
                <TableHead className="w-[100px] text-right text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3 pr-6">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staffUsers.map((user) => (
                <TableRow key={user.id} className="hover:bg-muted/5 transition-colors">
                  <TableCell className="font-semibold text-[13px] py-3.5">{user.name}</TableCell>
                  <TableCell className="text-[13px] text-muted-foreground py-3.5">{user.email}</TableCell>
                  <TableCell className="py-3.5">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${getRoleBadgeClass(user.role)}`}>
                      {user.role}
                    </span>
                  </TableCell>
                  <TableCell className="text-right py-3.5 pr-6">
                    {isCurrentUserAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={!!(user as any).firstAdmin}
                        onClick={() => handleDeleteUser(user.id, !!(user as any).firstAdmin)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        title={!!(user as any).firstAdmin ? "Primary admin cannot be deleted" : "Delete User"}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Card List — visible only on mobile */}
        <div className="sm:hidden">
          {staffUsers.length === 0 ? (
            <div className="py-12 text-center text-[13px] text-muted-foreground">No staff users yet.</div>
          ) : (
            <div className="divide-y divide-border/60">
              {staffUsers.map((user) => (
                <div key={user.id} className="flex items-center gap-3 px-4 py-3.5">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback className="text-[12px] font-bold">
                      {user.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[13.5px] truncate">{user.name}</p>
                    <p className="info-row truncate">{user.email}</p>
                  </div>
                  <span className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${getRoleBadgeClass(user.role)}`}>
                    {user.role}
                  </span>
                  {isCurrentUserAdmin && (
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={!!(user as any).firstAdmin}
                      onClick={() => handleDeleteUser(user.id, !!(user as any).firstAdmin)}
                      className="h-11 w-11 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      title={!!(user as any).firstAdmin ? "Primary admin cannot be deleted" : "Delete User"}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Settings Page ───────────────────────────────────────────────────────

function SettingsPage() {
  const isStaff = typeof window !== "undefined" && localStorage.getItem("medirent-user-role") === "Staff";
  const [activeSection, setActiveSection] = useState<"company" | "credentials" | "database">("company");

  if (isStaff) {
    return (
      <AppShell title="Access Denied" subtitle="You do not have permission to view settings.">
        <div className="max-w-4xl mx-auto py-12 text-center">
          <p className="text-muted-foreground bg-destructive/10 text-destructive border border-destructive/20 rounded-lg p-4 font-semibold inline-block">
            Access Denied: Settings are only accessible by Administrators.
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Settings" subtitle="Manage your company details, user login credentials, and database sync settings">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-6 pb-10">
        {/* Settings Navigation Sidebar */}
        <div className="w-full lg:w-[260px] shrink-0 space-y-1.5">
          {[
            {
              id: "company",
              label: "Company Profile",
              desc: "Business identity & details",
              icon: Building2,
            },
            {
              id: "credentials",
              label: "User Credentials",
              desc: "Staff accounts & access",
              icon: Lock,
            },
            {
              id: "database",
              label: "Database Sync",
              desc: "Google Sheets connection",
              icon: Database,
            },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSection(item.id as any)}
                className={`w-full flex items-center gap-3.5 px-4.5 py-3.5 rounded-xl border text-left transition-all duration-200 ${
                  isActive
                    ? "bg-primary text-primary-foreground border-primary shadow-[var(--shadow-soft)]"
                    : "bg-card hover:bg-muted/40 border-border/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? "text-primary-foreground" : "text-primary"}`} />
                <div className="min-w-0">
                  <p className="text-[13px] font-bold tracking-tight">{item.label}</p>
                  <p className={`text-[10px] truncate mt-0.5 ${isActive ? "text-primary-foreground/75" : "text-muted-foreground/80"}`}>
                    {item.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Content Pane */}
        <div className="flex-1 min-w-0">
          <div className={activeSection === "company" ? "block animate-[fade-in_0.3s_ease-out]" : "hidden"}>
            <CompanySettingsTab />
          </div>
          <div className={activeSection === "credentials" ? "block animate-[fade-in_0.3s_ease-out]" : "hidden"}>
            <UserLoginCredentials />
          </div>
          <div className={activeSection === "database" ? "block animate-[fade-in_0.3s_ease-out]" : "hidden"}>
            <DatabaseSettingsTab />
          </div>
        </div>
      </div>
    </AppShell>
  );
}

// ─── Shared Field components ───────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </Label>
  );
}

function ControlledField({
  label,
  value,
  onChange,
  type = "text",
  className,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <FieldLabel>{label}</FieldLabel>
      <Input type={type} value={value} onChange={onChange} className="h-10 text-[13px]" />
    </div>
  );
}
