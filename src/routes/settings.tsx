import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState, useEffect, useMemo, useRef } from "react";
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
  Lock, Trash2, UserPlus, Download, Upload, FileSpreadsheet, HardDriveDownload, HardDriveUpload, Calculator,
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
  formatDateDDMMYYYY,
  getLocalYYYYMMDD,
  parseLocalDate,
  deduplicateStaffUsers,
} from "@/lib/data-store";
import {
  getBusinessName,
  getWhatsAppStatus,
  getWhatsAppTemplates,
  normalizeWhatsAppPhone,
  sendWhatsAppMessage,
  type WhatsAppStatus,
  type WhatsAppTemplate,
} from "@/lib/whatsapp";
import {
  createBackupSnapshot,
  downloadBackupJSON,
  downloadBackupCSV,
  getLastBackupDate,
  getStoredSnapshot,
  getSnapshotHistory,
  parseBackupFile,
  restoreFromBackup,
  snapshotRowCount,
  type BackupSnapshot,
} from "@/lib/backup";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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

// ─── WhatsApp Tab ────────────────────────────────────────────────────────────

/**
 * WhatsApp is configured in the Apps Script project, not here.
 *
 * The access token is the credential that lets anyone send messages as this
 * business, so it deliberately has no input field on this page: anything the
 * website can read, a visitor can read too. This screen only reports whether
 * the backend has the credentials and lets an admin prove it end to end with a
 * test message.
 */
function WhatsAppSettingsTab() {
  const [status, setStatus] = useState<WhatsAppStatus | null>(null);
  const [checking, setChecking] = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const [testing, setTesting] = useState(false);
  const [templates, setTemplates] = useState<WhatsAppTemplate[] | null>(null);
  const [templateError, setTemplateError] = useState("");
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  const loadTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const result = await getWhatsAppTemplates();
      setTemplates(result.templates);
      setTemplateError(result.error || "");
    } finally {
      setLoadingTemplates(false);
    }
  };

  const refreshStatus = async () => {
    setChecking(true);
    try {
      setStatus(await getWhatsAppStatus());
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    void refreshStatus();
    // Checked once when the tab mounts; the button re-runs it on demand.
  }, []);

  const handleTestSend = async () => {
    const normalized = normalizeWhatsAppPhone(testPhone);
    if (!normalized) {
      toast.error("Enter a 10-digit mobile number to send the test to.");
      return;
    }
    setTesting(true);
    const toastId = toast.loading(`Sending a test WhatsApp message to +${normalized}…`);
    try {
      const result = await sendWhatsAppMessage({
        to: normalized,
        message:
          `Test message from ${getBusinessName()} ERP. ` +
          `If you can read this, WhatsApp sending is working correctly.`,
        customerName: "Test",
      });
      if (result.ok) {
        toast.success(`Test message delivered to +${result.to}.`, { id: toastId });
      } else {
        toast.error(result.error || "Test send failed.", { id: toastId, duration: 15000 });
      }
    } finally {
      setTesting(false);
    }
  };

  const scriptProperties = [
    {
      key: "WHATSAPP_PHONE_NUMBER_ID",
      required: true,
      hint: "Meta → WhatsApp → API Setup → the Phone number ID (a long number, not the phone number itself).",
      present: status?.hasPhoneNumberId,
    },
    {
      key: "WHATSAPP_ACCESS_TOKEN",
      required: true,
      hint: "A permanent System User token from Meta Business Settings. The temporary 24-hour test token works, but stops after a day.",
      present: status?.hasAccessToken,
    },
    {
      key: "WHATSAPP_APP_SECRET",
      required: false,
      hint: "Only needed when the Meta app has \"Require app secret\" switched on.",
      present: status?.hasAppSecret,
    },
    {
      key: "WHATSAPP_BUSINESS_ACCOUNT_ID",
      required: false,
      hint: "WhatsApp Manager → Account tools → Business account ID. Only needed to list your templates below.",
      present: status?.hasBusinessAccountId,
    },
    {
      key: "WHATSAPP_TEMPLATE_NAME",
      required: false,
      hint: "An approved message template. Without one, a customer who has never messaged the business cannot be sent anything (see below).",
      present: !!status?.templateName,
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600">
            <MessageSquare className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0">
            <CardTitle>WhatsApp Sending</CardTitle>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              Delivers rental agreements, receipts and rent reminders straight to the customer's WhatsApp
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Connection state */}
          <div
            className={`rounded-xl border p-4 ${
              status?.configured
                ? "border-emerald-300 bg-emerald-50/60 dark:border-emerald-900/50 dark:bg-emerald-950/25"
                : "border-amber-300 bg-amber-50/60 dark:border-amber-900/50 dark:bg-amber-950/25"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                {status?.configured ? (
                  <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-emerald-600" />
                ) : (
                  <AlertTriangle className="h-4.5 w-4.5 shrink-0 text-amber-600" />
                )}
                <div className="min-w-0">
                  <p className="text-[13px] font-bold">
                    {status === null
                      ? "Checking…"
                      : status.configured
                        ? "WhatsApp is connected"
                        : "WhatsApp is not configured yet"}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 break-words">
                    {status?.error
                      ? status.error
                      : status?.configured
                        ? `Sending from phone number ID ${status.phoneNumberIdMasked} via Graph API ${status.apiVersion}.`
                        : "Add the credentials below to the Apps Script project, then re-check."}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={refreshStatus} disabled={checking}>
                <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${checking ? "animate-spin" : ""}`} />
                {checking ? "Checking…" : "Re-check"}
              </Button>
            </div>
          </div>

          {/* Where the credentials live */}
          <div className="space-y-2.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Script Properties (set these in the Apps Script editor)
            </Label>
            <p className="text-[11.5px] text-muted-foreground leading-relaxed">
              Open the Apps Script project → <strong>Project Settings</strong> (gear icon) →{" "}
              <strong>Script properties</strong> → <strong>Add script property</strong>. These stay on Google's
              servers; they are never sent to this website, which is exactly why there is no field for them here.
            </p>
            <div className="rounded-xl border border-border/60 divide-y divide-border/60 overflow-hidden">
              {scriptProperties.map((prop) => (
                <div key={prop.key} className="flex items-start gap-3 p-3">
                  <div className="mt-0.5 shrink-0">
                    {prop.present ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : prop.required ? (
                      <XCircle className="h-4 w-4 text-destructive" />
                    ) : (
                      <XCircle className="h-4 w-4 text-muted-foreground/40" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <code className="text-[11.5px] font-bold break-all">{prop.key}</code>
                      <span
                        className={`text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          prop.required
                            ? "bg-destructive/10 text-destructive"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {prop.required ? "Required" : "Optional"}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{prop.hint}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    title={`Copy ${prop.key}`}
                    onClick={() => {
                      navigator.clipboard.writeText(prop.key);
                      toast.success(`Copied ${prop.key}`);
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* The rule that surprises everyone */}
          <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 dark:border-blue-900/50 dark:bg-blue-950/25">
            <p className="flex items-center gap-2 text-[12.5px] font-bold text-blue-900 dark:text-blue-300">
              <AlertTriangle className="h-4 w-4 shrink-0" /> WhatsApp's 24-hour rule
            </p>
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-blue-900/85 dark:text-blue-200/85">
              Meta only delivers a freely-written message to someone who has messaged the business within the
              last 24 hours. A brand-new customer has not, so the send is refused (error 131047) unless it uses
              an <strong>approved message template</strong>. Create one under Meta → WhatsApp Manager → Message
              Templates with a <strong>Document header</strong>, wait for approval, then put its name in{" "}
              <code className="text-[11px] font-bold">WHATSAPP_TEMPLATE_NAME</code>. Sends then fall back to
              that template automatically, with the agreement PDF attached. Until then, a refused send still
              offers "Send manually", which opens WhatsApp with the message ready to go.
            </p>
          </div>

          {/* Which templates exist, and what shape are they */}
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Approved message templates
              </Label>
              <Button variant="outline" size="sm" onClick={loadTemplates} disabled={loadingTemplates}>
                <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loadingTemplates ? "animate-spin" : ""}`} />
                {loadingTemplates ? "Loading…" : templates ? "Reload" : "Load templates"}
              </Button>
            </div>

            {templateError && (
              <p className="rounded-lg border border-amber-300 bg-amber-50/60 px-3 py-2 text-[11.5px] text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/25 dark:text-amber-200">
                {templateError}
              </p>
            )}

            {templates && templates.length === 0 && !templateError && (
              <p className="text-[11.5px] text-muted-foreground">
                No templates on this WhatsApp Business Account yet.
              </p>
            )}

            {templates && templates.length > 0 && (
              <div className="rounded-xl border border-border/60 divide-y divide-border/60 overflow-hidden">
                {templates.map((t) => (
                  <div key={`${t.name}-${t.language}`} className="p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <code className="text-[11.5px] font-bold break-all">{t.name}</code>
                      <span
                        className={`text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          t.status === "APPROVED"
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                            : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                        }`}
                      >
                        {t.status}
                      </span>
                      <span className="text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        {t.headerFormat || "No header"}
                      </span>
                      <span className="text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        {t.bodyParams} {t.bodyParams === 1 ? "variable" : "variables"}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 ml-auto shrink-0"
                        title={`Copy ${t.name}`}
                        onClick={() => {
                          navigator.clipboard.writeText(t.name);
                          toast.success(`Copied ${t.name}`);
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    {t.bodyText && (
                      <p className="mt-1.5 text-[11px] text-muted-foreground leading-snug break-words">
                        {t.bodyText}
                      </p>
                    )}
                    {/* The agreement send needs a document header; anything else
                        delivers the template text with no PDF attached. */}
                    {!t.usableForDocuments && (
                      <p className="mt-1.5 text-[10.5px] text-amber-700 dark:text-amber-400">
                        {t.status !== "APPROVED"
                          ? "Not approved yet, so it cannot be used."
                          : "No document header — this template would send text without the agreement PDF."}
                      </p>
                    )}
                    {t.usableForDocuments && t.bodyParams !== 2 && (
                      <p className="mt-1.5 text-[10.5px] text-amber-700 dark:text-amber-400">
                        Expects {t.bodyParams} variable(s); the agreement send supplies 2 (customer name, then
                        agreement number). Tell your developer to match this count.
                      </p>
                    )}
                    {t.usableForDocuments && t.bodyParams === 2 && (
                      <p className="mt-1.5 text-[10.5px] text-emerald-700 dark:text-emerald-400">
                        Ready to use — put this name in WHATSAPP_TEMPLATE_NAME.
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Prove it works */}
          <div className="space-y-2.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Send a test message
            </Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="10-digit mobile number"
                inputMode="numeric"
                className="h-10 text-[13px] flex-1"
              />
              <Button onClick={handleTestSend} disabled={testing || !status?.configured} className="h-10">
                <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
                {testing ? "Sending…" : "Send Test"}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Use your own number. Message that number from WhatsApp first so the 24-hour window is open,
              otherwise the test will be refused even when everything is configured correctly.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — Relife" }] }),
  // H-14: a real route guard, so /settings cannot be reached by typing the URL.
  // The nav item was hidden for Staff but the route itself rendered — and this
  // page carries the Reset Database panel.
  //
  // This is a UI guard, not a security boundary: the role lives in localStorage
  // and anyone with devtools can change it. Enforcing it properly requires the
  // Apps Script to validate a signed session token on every data request.
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem("medirent-user-role") !== "Admin") {
      throw redirect({ to: "/rentals" });
    }
  },
  component: SettingsPage,
});

const roleIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "Admin": Shield,
  "Staff": Users,
  "Accountant": Calculator,
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
// MediRent / Relife ERP — Google Apps Script Web App  (v7 — WhatsApp Cloud API)
// Sheet ID: ${SHEET_ID}
//
// SETUP STEPS:
//  1. Open your Google Sheet: https://docs.google.com/spreadsheets/d/${SHEET_ID}
//  2. Click Extensions → Apps Script
//  3. Replace ALL existing code with this script
//  4. (Recommended) Change TOKEN below to your own secret, and paste the same
//     value into the "Shared Secret Token" field below before saving.
//  5. FIRST TIME ONLY: Deploy → New Deployment → Web App
//     UPDATING an existing deployment: Deploy → Manage deployments → pencil
//     (Edit) → Version: "New version" → Deploy. This keeps the SAME Web App
//     URL, so nothing in the ERP needs changing. A New Deployment would mint a
//     different URL and leave the old one serving the old code.
//     - Execute as: Me
//     - Who has access: Anyone
//  6. Click Deploy → copy the Web App URL
//  7. Paste the URL (and token) into the fields above and click Test Connection
//  8. FOR WHATSAPP: in the Apps Script editor open Project Settings (gear icon)
//     -> Script Properties -> Add script property, and add:
//        WHATSAPP_PHONE_NUMBER_ID = the Phone number ID from Meta > WhatsApp > API Setup
//        WHATSAPP_ACCESS_TOKEN    = a permanent System User access token
//     Keep these here, never in the website - anything in the frontend is
//     public. Redeploy after adding them.
// ══════════════════════════════════════════════════════════

// SECURITY: every request must include a token matching TOKEN below, or it's
// rejected before touching any sheet. Without this, anyone who has the Web
// App URL (it ships in the public frontend bundle) could read/write/delete
// the entire database with no login at all.
const TOKEN = "${sheetsToken || "CHANGE_ME_TO_A_LONG_RANDOM_SECRET"}";

// BUG-9 FIX (v3): Added "FileChunks" — required for cross-device PDF/image sync.
// Without this, file chunk upserts silently failed because the sheet wasn't tracked.
const SHEET_NAMES = ["Customers", "Equipment", "Rentals", "Payments", "Returns", "Owners", "Documents", "Exchanges", "FileChunks", "Staff"];

// ─── WhatsApp Cloud API config ──────────────────────────────────────────────
// Leave these blank and set them under Project Settings → Script Properties
// instead; Script Properties win over the constants below. Either way the
// values stay inside this script and are never sent to a browser.
const WHATSAPP_PHONE_NUMBER_ID = "";  // e.g. "123456789012345"
const WHATSAPP_ACCESS_TOKEN    = "";  // System User permanent token (starts with EAA...)
const WHATSAPP_APP_SECRET      = "";  // only needed if the Meta app requires appsecret_proof
const WHATSAPP_BUSINESS_ACCOUNT_ID = ""; // WhatsApp Manager > Account tools > Business account ID
const WHATSAPP_TEMPLATE_NAME   = "";  // approved template, used when the 24h window has closed
const WHATSAPP_TEMPLATE_LANG   = "en_US";
const WHATSAPP_API_VERSION     = "v21.0";
const WHATSAPP_DEFAULT_CC      = "91"; // country code prefixed to bare 10-digit Indian numbers

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
      .createTextOutput(JSON.stringify({ status: "ok", sheetName: ss.getName(), version: "v7" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // WhatsApp readiness, for the Settings screen. Reports only whether the
  // credentials exist, never their values.
  if (action === "whatsappTemplates") {
    return ContentService
      .createTextOutput(JSON.stringify(waListTemplates()))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (action === "whatsappStatus") {
    var waCfg = waConfig();
    var pid = waCfg.phoneNumberId;
    return ContentService
      .createTextOutput(JSON.stringify({
        configured: !!(pid && waCfg.accessToken),
        hasPhoneNumberId: !!pid,
        hasAccessToken: !!waCfg.accessToken,
        hasAppSecret: !!waCfg.appSecret,
        hasBusinessAccountId: !!waCfg.businessAccountId,
        templateName: waCfg.templateName || "",
        apiVersion: waCfg.apiVersion,
        phoneNumberIdMasked: pid ? pid.replace(/.(?=.{4})/g, "*") : ""
      }))
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

  // Handled before the lock below: a WhatsApp send touches no sheet and makes
  // two external HTTP calls to Meta that can take several seconds. Holding the
  // script lock across them would stall every concurrent database write.
  if (action === "sendWhatsApp") {
    try {
      return ContentService
        .createTextOutput(JSON.stringify(handleWhatsAppSend(body)))
        .setMimeType(ContentService.MimeType.JSON);
    } catch (waErr) {
      return ContentService
        .createTextOutput(JSON.stringify({ error: String(waErr && waErr.message ? waErr.message : waErr) }))
        .setMimeType(ContentService.MimeType.JSON);
    }
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
}

// ─── WhatsApp Cloud API ─────────────────────────────────────────────────────
//
// Flow for "send the rental agreement":
//   1. The frontend POSTs { action:"sendWhatsApp", to, message, documentHtml }.
//   2. documentHtml is the same printable agreement markup the PDF/Download
//      button renders, so what the customer receives on WhatsApp is the very
//      document the office prints.
//   3. Utilities converts that HTML to a real PDF, which is uploaded to Meta's
//      /media endpoint and then sent as a document message with the summary
//      text as its caption.
//
// Meta only accepts free-form messages within 24 hours of the customer last
// messaging the business (error 131047). For a brand-new customer that window
// is always closed, so when WHATSAPP_TEMPLATE_NAME is configured the send is
// retried once as an approved template carrying the same PDF in its header.

function waConfig() {
  var props = {};
  try {
    props = PropertiesService.getScriptProperties().getProperties() || {};
  } catch (err) {
    props = {};
  }
  function pick(key, fallback) {
    var v = props[key];
    if (v === undefined || v === null || String(v).trim() === "") return fallback;
    return String(v).trim();
  }
  return {
    phoneNumberId: pick("WHATSAPP_PHONE_NUMBER_ID", WHATSAPP_PHONE_NUMBER_ID),
    accessToken:   pick("WHATSAPP_ACCESS_TOKEN", WHATSAPP_ACCESS_TOKEN),
    appSecret:     pick("WHATSAPP_APP_SECRET", WHATSAPP_APP_SECRET),
    businessAccountId: pick("WHATSAPP_BUSINESS_ACCOUNT_ID", WHATSAPP_BUSINESS_ACCOUNT_ID),
    templateName:  pick("WHATSAPP_TEMPLATE_NAME", WHATSAPP_TEMPLATE_NAME),
    templateLang:  pick("WHATSAPP_TEMPLATE_LANG", WHATSAPP_TEMPLATE_LANG) || "en_US",
    apiVersion:    pick("WHATSAPP_API_VERSION", WHATSAPP_API_VERSION) || "v21.0",
    defaultCc:     pick("WHATSAPP_DEFAULT_CC", WHATSAPP_DEFAULT_CC) || "91"
  };
}

/** Bare 10-digit numbers are stored without a country code throughout the ERP;
 *  Meta requires full international format with no "+" or separators. */
function waNormalizePhone(raw, defaultCc) {
  var digits = String(raw || "").replace(/\\D/g, "");
  if (!digits) return "";
  if (digits.length === 10) return defaultCc + digits;
  // 0XXXXXXXXXX — the trunk prefix used when dialling domestically
  if (digits.length === 11 && digits.charAt(0) === "0") return defaultCc + digits.slice(1);
  return digits;
}

/** Meta apps with "Require app secret" enabled reject calls that do not prove
 *  the caller also holds the app secret, not just the token. */
function waAppSecretProof(token, appSecret) {
  if (!appSecret) return "";
  var sig = Utilities.computeHmacSha256Signature(token, appSecret);
  return sig.map(function (b) {
    return ("0" + (b & 0xff).toString(16)).slice(-2);
  }).join("");
}

function waUrl(cfg, path) {
  var url = "https://graph.facebook.com/" + cfg.apiVersion + "/" + path;
  var proof = waAppSecretProof(cfg.accessToken, cfg.appSecret);
  return proof ? url + "?appsecret_proof=" + proof : url;
}

function waParse(response) {
  var text = response.getContentText();
  try {
    return JSON.parse(text);
  } catch (err) {
    return { error: { message: "Non-JSON response from Meta: " + text.slice(0, 300) } };
  }
}

/** HTML to PDF to Meta media id. Returns { id, filename } or throws. */
function waUploadPdf(cfg, html, filename) {
  var safeName = String(filename || "Agreement.pdf").replace(/[^A-Za-z0-9._-]/g, "_");
  if (safeName.slice(-4).toLowerCase() !== ".pdf") safeName += ".pdf";

  var pdf = Utilities.newBlob(html, MimeType.HTML, safeName).getAs(MimeType.PDF).setName(safeName);

  var res = UrlFetchApp.fetch(waUrl(cfg, cfg.phoneNumberId + "/media"), {
    method: "post",
    headers: { Authorization: "Bearer " + cfg.accessToken },
    // A Blob in the payload makes UrlFetchApp send multipart/form-data, which
    // is the only format this endpoint accepts.
    payload: {
      messaging_product: "whatsapp",
      type: "application/pdf",
      file: pdf
    },
    muteHttpExceptions: true
  });

  var json = waParse(res);
  if (res.getResponseCode() >= 300 || json.error || !json.id) {
    throw new Error("Media upload failed: " + ((json.error && json.error.message) || res.getContentText().slice(0, 300)));
  }
  return { id: json.id, filename: safeName };
}

function waPostMessage(cfg, payload) {
  var res = UrlFetchApp.fetch(waUrl(cfg, cfg.phoneNumberId + "/messages"), {
    method: "post",
    contentType: "application/json",
    headers: { Authorization: "Bearer " + cfg.accessToken },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
  return { code: res.getResponseCode(), json: waParse(res) };
}

/** Meta re-engagement errors: the customer has not messaged us in 24h, so only
 *  an approved template may be delivered. */
function waIsOutsideWindow(json) {
  var err = json && json.error;
  if (!err) return false;
  if (err.code === 131047 || err.code === 131051 || err.code === 470) return true;
  return /24 hours|re-?engagement|outside.*window/i.test(String(err.message || ""));
}

function waBuildTemplatePayload(cfg, to, media, params) {
  var components = [];
  if (media && media.id) {
    components.push({
      type: "header",
      parameters: [{ type: "document", document: { id: media.id, filename: media.filename } }]
    });
  }
  var list = [];
  for (var i = 0; i < (params || []).length; i++) {
    var raw = params[i];
    list.push({ type: "text", text: String(raw === undefined || raw === null ? "" : raw) });
  }
  if (list.length) components.push({ type: "body", parameters: list });

  return {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: to,
    type: "template",
    template: {
      name: cfg.templateName,
      language: { code: cfg.templateLang },
      components: components
    }
  };
}

function handleWhatsAppSend(body) {
  var cfg = waConfig();

  if (!cfg.phoneNumberId || !cfg.accessToken) {
    return { error: "WhatsApp is not configured on the server. Add WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN under Project Settings, Script Properties, in the Apps Script editor." };
  }

  var to = waNormalizePhone(body.to, cfg.defaultCc);
  if (!to) return { error: "No WhatsApp number on file for this customer." };

  // Meta limits: 4096 chars for a text body, 1024 for a document caption.
  var message = String(body.message || "").slice(0, 4096);
  var caption = String(body.caption || body.message || "").slice(0, 1024);

  var media = null;
  if (body.documentHtml) {
    try {
      media = waUploadPdf(cfg, String(body.documentHtml), body.filename);
    } catch (err) {
      return { error: String(err.message || err) };
    }
  }

  var payload = media
    ? {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: to,
        type: "document",
        document: { id: media.id, filename: media.filename, caption: caption }
      }
    : {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: to,
        type: "text",
        text: { preview_url: false, body: message }
      };

  var sent = waPostMessage(cfg, payload);

  // Conversation closed? Re-send the identical PDF inside an approved template,
  // which Meta allows at any time.
  if ((sent.code >= 300 || sent.json.error) && waIsOutsideWindow(sent.json) && cfg.templateName) {
    var params = body.templateParams && body.templateParams.length
      ? body.templateParams
      : [body.customerName || "Customer", body.reference || ""];
    var retry = waPostMessage(cfg, waBuildTemplatePayload(cfg, to, media, params));
    if (retry.code < 300 && !retry.json.error) {
      return {
        status: "ok",
        mode: media ? "template+document" : "template",
        to: to,
        messageId: retry.json.messages && retry.json.messages[0] && retry.json.messages[0].id
      };
    }
    return { error: waErrorText(retry.json, to) };
  }

  if (sent.code >= 300 || sent.json.error) {
    return { error: waErrorText(sent.json, to) };
  }

  return {
    status: "ok",
    mode: media ? "document" : "text",
    to: to,
    messageId: sent.json.messages && sent.json.messages[0] && sent.json.messages[0].id
  };
}

/** Meta raw errors are opaque to an office operator; translate the ones that
 *  actually come up into an instruction they can act on. */
function waErrorText(json, to) {
  var err = (json && json.error) || {};
  var msg = String(err.message || "WhatsApp send failed");
  if (waIsOutsideWindow(json)) {
    return "WhatsApp will not deliver to " + to + " because this customer has not messaged the business in the last 24 hours. " +
           "Set WHATSAPP_TEMPLATE_NAME in Script Properties to an approved template to send anyway, or ask the customer to send any message first.";
  }
  if (err.code === 190) {
    return "The WhatsApp access token has expired or been revoked. Generate a new permanent System User token in Meta Business Settings and update WHATSAPP_ACCESS_TOKEN.";
  }
  if (err.code === 131026) {
    return to + " is not a valid WhatsApp number, or that account cannot receive messages from this business.";
  }
  if (err.code === 100 && /phone.number/i.test(msg)) {
    return "WHATSAPP_PHONE_NUMBER_ID is wrong. Copy the Phone number ID (not the phone number) from Meta, WhatsApp, API Setup.";
  }
  if (err.code === 133010 || err.code === 133016) {
    return "The business phone number is not registered for the Cloud API yet. Complete registration in Meta, WhatsApp, API Setup.";
  }
  return msg + (err.code ? " (Meta error " + err.code + ")" : "");
}


/**
 * Lists the approved templates on the WhatsApp Business Account.
 *
 * A template send fails outright when the parameters the code sends do not
 * match the template's own shape, and Meta's error for that ("132000") says
 * nothing about what the right shape was. Reading the templates back means the
 * Settings screen can show which ones exist, whether each carries a document
 * header, and how many body variables it expects - so the name in
 * WHATSAPP_TEMPLATE_NAME can be chosen from fact rather than from memory.
 */
function waListTemplates() {
  var cfg = waConfig();
  if (!cfg.accessToken) {
    return { error: "WHATSAPP_ACCESS_TOKEN is not set in Script Properties." };
  }
  if (!cfg.businessAccountId) {
    return { error: "WHATSAPP_BUSINESS_ACCOUNT_ID is not set in Script Properties. Copy it from Meta > WhatsApp Manager > Account tools > Business account ID." };
  }

  var url = waUrl(cfg, cfg.businessAccountId + "/message_templates");
  url += (url.indexOf("?") === -1 ? "?" : "&") + "fields=name,status,language,category,components&limit=100";

  var res = UrlFetchApp.fetch(url, {
    method: "get",
    headers: { Authorization: "Bearer " + cfg.accessToken },
    muteHttpExceptions: true
  });

  var json = waParse(res);
  if (res.getResponseCode() >= 300 || json.error) {
    return { error: waErrorText(json, cfg.businessAccountId) };
  }

  var templates = (json.data || []).map(function (t) {
    var headerFormat = "";
    var bodyParams = 0;
    var bodyText = "";

    (t.components || []).forEach(function (c) {
      var type = String(c.type || "").toUpperCase();
      if (type === "HEADER") {
        headerFormat = String(c.format || "TEXT").toUpperCase();
      } else if (type === "BODY") {
        bodyText = String(c.text || "");
        // Meta numbers placeholders {{1}}, {{2}}, ... so the highest index is
        // the count Meta expects, even if one is repeated or skipped.
        var matches = bodyText.match(/\\{\\{\\s*(\\d+)\\s*\\}\\}/g) || [];
        matches.forEach(function (m) {
          var n = parseInt(m.replace(/[^0-9]/g, ""), 10);
          if (n > bodyParams) bodyParams = n;
        });
      }
    });

    return {
      name: t.name,
      status: t.status,
      language: t.language,
      category: t.category,
      headerFormat: headerFormat,
      bodyParams: bodyParams,
      bodyText: bodyText.slice(0, 300),
      // What this integration needs: an approved template whose header carries
      // the PDF and whose body takes customer name + agreement number.
      usableForDocuments: t.status === "APPROVED" && headerFormat === "DOCUMENT"
    };
  });

  return { status: "ok", templates: templates, selected: cfg.templateName || "" };
}
`;

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
            `Failed to clear Google Sheets: ${errMsg}\n\nThis usually happens because your deployed Google Apps Script does not support the new clear action. To fix this, copy the updated Apps Script code from the section above, paste it in Extensions → Apps Script, and click Deploy → Manage deployments → pencil (Edit) → Version: New version → Deploy.\n\nDo you want to clear your local database anyway?`
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
        <CardHeader className="border-b border-border/60 bg-muted/20 px-3 sm:px-6 py-3 sm:py-4">
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
        <CardContent className="p-3 sm:p-6 space-y-5">
          {/* Step-by-step guide */}
          <div className="rounded-xl border border-border/60 bg-muted/10 p-4 space-y-3">
            <p className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">Setup Guide</p>
            <ol className="space-y-2 text-[13px]">
              {[
                <>Open your <a href={`https://docs.google.com/spreadsheets/d/${SHEET_ID}`} target="_blank" rel="noreferrer" className="text-primary underline inline-flex items-center gap-1">Google Sheet <ExternalLink className="h-3 w-3" /></a></>,
                "Click Extensions → Apps Script",
                "Replace all code with the script below, then click Save (Ctrl+S)",
                "First time: Deploy → New Deployment → Web App → Execute as: Me → Access: Anyone",
                "Updating later: Deploy → Manage deployments → pencil (Edit) → Version: New version → Deploy — this keeps the same URL. Saving the code alone does NOT update the live app.",
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
              <Button variant="outline" size="sm" className="h-9 text-[12px] self-start sm:self-auto" onClick={copyScript}>
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
          <div className="flex flex-col gap-3 border-t border-border/50 pt-4 md:flex-row md:flex-wrap">
            <Button
              variant="outline"
              onClick={handleTestConnection}
              disabled={testStatus === "testing" || !sheetsUrl}
              className="h-10 w-full text-[13px] md:h-9 md:w-auto"
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
              className="h-10 w-full text-[13px] md:h-9 md:w-auto"
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
              className="h-10 w-full text-[13px] md:h-9 md:w-auto"
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
              className="h-10 w-full text-[13px] md:h-9 md:w-auto"
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
          <CardHeader className="border-b border-destructive/10 px-3 sm:px-6 py-3 sm:py-4">
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
          <CardContent className="p-3 sm:p-6 space-y-4">
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
          <CardContent className="p-3 sm:p-6">
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
      <CardHeader className="border-b border-border/60 bg-muted/20 px-3 sm:px-6 py-3 sm:py-4">
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
      <CardContent className="p-3 sm:p-6 grid gap-5 sm:grid-cols-2">
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
  role: "Admin" | "Staff" | "Accountant";
}

function UserLoginCredentials() {
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("medirent-staff-users");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const clean = deduplicateStaffUsers(parsed);
            if (clean.length !== parsed.length) {
              localStorage.setItem("medirent-staff-users", JSON.stringify(clean));
            }
            return clean;
          }
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

  // Re-sync and deduplicate if background sync or another tab updates staff users
  useEffect(() => {
    const reloadStaff = () => {
      const saved = localStorage.getItem("medirent-staff-users");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const clean = deduplicateStaffUsers(parsed);
            setStaffUsers(clean);
          }
        } catch (e) {
          console.error(e);
        }
      }
    };

    window.addEventListener("medirent-db-updated", reloadStaff);
    window.addEventListener("storage", reloadStaff);
    return () => {
      window.removeEventListener("medirent-db-updated", reloadStaff);
      window.removeEventListener("storage", reloadStaff);
    };
  }, []);

  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"Admin" | "Staff" | "Accountant">("Staff");
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

    const updatedList = deduplicateStaffUsers([...staffUsers, newUser]);
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

  const handleDeleteUser = (id: string, isFirstAdmin: boolean, userEmail?: string) => {
    if (isFirstAdmin) {
      toast.error("The primary administrator account cannot be deleted.");
      return;
    }

    const cleanEmail = String(userEmail || "").toLowerCase().trim();
    const updatedList = staffUsers.filter(u => u.id !== id && (cleanEmail ? u.email.toLowerCase().trim() !== cleanEmail : true));
    setStaffUsers(updatedList);
    localStorage.setItem("medirent-staff-users", JSON.stringify(updatedList));
    if (isGSheetsEnabled()) {
      deleteRowFromSheet(SHEETS.STAFF, id);
      if (cleanEmail) {
        deleteRowFromSheet(SHEETS.STAFF, cleanEmail);
      }
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
      case "Accountant":
        return "bg-sky-50 text-sky-700 border-sky-200/50 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800/40";
      default:
        return "bg-emerald-50 text-emerald-700 border-emerald-200/50 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40";
    }
  };

  return (
    <Card>
      <CardHeader className="border-b border-border/60 bg-muted/20 px-3 sm:px-6 py-3 sm:py-4">
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
                      <SelectItem value="Accountant" className="text-[13px]">Accountant</SelectItem>
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
              {deduplicateStaffUsers(staffUsers).map((user) => (
                <TableRow key={user.id || user.email} className="hover:bg-muted/5 transition-colors">
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
                        onClick={() => handleDeleteUser(user.id, !!(user as any).firstAdmin, user.email)}
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
          {deduplicateStaffUsers(staffUsers).length === 0 ? (
            <div className="py-12 text-center text-[13px] text-muted-foreground">No staff users yet.</div>
          ) : (
            <div className="divide-y divide-border/60">
              {deduplicateStaffUsers(staffUsers).map((user) => (
                <div key={user.id || user.email} className="flex items-center gap-3 px-4 py-3.5">
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
                      onClick={() => handleDeleteUser(user.id, !!(user as any).firstAdmin, user.email)}
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

/**
 * ITEM-1: Backup & Restore.
 *
 * All ERP data lives in this browser's localStorage, so a cleared profile or a
 * "clear site data" wipes it with no warning and no recovery. This pane makes
 * taking a real, off-device copy a one-click habit, shows how stale the last
 * one is, and provides a guarded path back in.
 */
function BackupSettingsTab() {
  const [lastBackupDate, setLastBackupDate] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<BackupSnapshot | null>(null);
  const [history, setHistory] = useState<Array<{ createdAt: string; createdDate: string; rows: number }>>([]);
  const [isWorking, setIsWorking] = useState(false);

  // Restore flow: the file is parsed and summarised first, and only written
  // once the user has confirmed against that summary.
  const [pendingRestore, setPendingRestore] = useState<BackupSnapshot | null>(null);
  const [pendingFileName, setPendingFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshStatus = () => {
    setLastBackupDate(getLastBackupDate());
    setSnapshot(getStoredSnapshot());
    setHistory(getSnapshotHistory());
  };

  useEffect(() => {
    refreshStatus();
  }, []);

  const today = getLocalYYYYMMDD();
  const isBackedUpToday = lastBackupDate === today;
  const daysSinceBackup = (() => {
    if (!lastBackupDate) return null;
    const then = parseLocalDate(lastBackupDate);
    if (isNaN(then.getTime())) return null;
    const now = parseLocalDate(today);
    return Math.max(0, Math.round((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24)));
  })();

  const liveCounts = useMemo(() => createBackupSnapshot().counts, []);
  const totalRows = Object.values(liveCounts).reduce((sum, n) => sum + n, 0);

  const handleDownload = (format: "json" | "csv") => {
    setIsWorking(true);
    try {
      const result = format === "json" ? downloadBackupJSON() : downloadBackupCSV();
      toast.success(
        `Backup downloaded — ${snapshotRowCount(result).toLocaleString("en-IN")} records saved as ${format.toUpperCase()}.`,
      );
      refreshStatus();
    } catch (err) {
      console.error("[Backup] Download failed:", err);
      toast.error("Could not create the backup file. Please try again.");
    } finally {
      setIsWorking(false);
    }
  };

  const handleFilePicked = async (file: File | undefined) => {
    if (!file) return;
    let text: string;
    try {
      text = await file.text();
    } catch {
      toast.error("Could not read that file.");
      return;
    }
    const parsed = parseBackupFile(text);
    if (!parsed.ok) {
      toast.error(parsed.error);
      return;
    }
    // Stage it — the confirmation dialog does the writing.
    setPendingRestore(parsed.snapshot);
    setPendingFileName(file.name);
  };

  const handleConfirmRestore = () => {
    if (!pendingRestore) return;
    setIsWorking(true);
    const result = restoreFromBackup(pendingRestore);
    setIsWorking(false);

    if (!result.ok) {
      toast.error(result.error || "The restore failed.");
      return;
    }
    setPendingRestore(null);
    setPendingFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    refreshStatus();
    toast.success(
      `Restored ${(result.restoredKeys?.length ?? 0)} data sets from the backup. Reloading…`,
      { duration: 2500 },
    );
    // A full reload is the honest way to re-seed every page's state from the
    // restored storage; the in-app db-updated event only refreshes mounted views.
    setTimeout(() => window.location.reload(), 1200);
  };

  return (
    <>
      <Card>
        <CardHeader className="border-b border-border/60 bg-muted/20 px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center gap-3">
            <div className="metric-icon h-9 w-9 bg-primary/10 border-primary/20">
              <HardDriveDownload className="h-4.5 w-4.5 text-primary" />
            </div>
            <div>
              <CardTitle>Data Backup</CardTitle>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                Download a complete copy of your database
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-3 sm:p-6 space-y-5">
          {/* Daily backup status */}
          <div
            className={`rounded-xl border p-4 ${
              isBackedUpToday
                ? "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/50 dark:bg-emerald-950/25"
                : "border-amber-200 bg-amber-50/60 dark:border-amber-900/50 dark:bg-amber-950/25"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                {isBackedUpToday ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
                )}
                <div>
                  <p
                    className={`text-[13px] font-bold ${
                      isBackedUpToday
                        ? "text-emerald-800 dark:text-emerald-300"
                        : "text-amber-800 dark:text-amber-300"
                    }`}
                  >
                    {isBackedUpToday ? "Today's backup is downloaded" : "Daily Backup Ready"}
                  </p>
                  <p className="text-[12px] text-muted-foreground mt-0.5">
                    {lastBackupDate
                      ? `Last downloaded on ${formatDateDDMMYYYY(lastBackupDate)}${
                          daysSinceBackup && daysSinceBackup > 0
                            ? ` — ${daysSinceBackup} day${daysSinceBackup === 1 ? "" : "s"} ago`
                            : ""
                        }`
                      : "No backup has ever been downloaded from this device."}
                  </p>
                  {snapshot && (
                    <p className="text-[11px] text-muted-foreground/80 mt-1">
                      An in-browser snapshot from {formatDateDDMMYYYY(snapshot.createdDate)} is held on this
                      device ({snapshotRowCount(snapshot).toLocaleString("en-IN")} records). It protects against
                      accidental edits — not against the browser being cleared, which is what the download is for.
                    </p>
                  )}
                </div>
              </div>
              {!isBackedUpToday && (
                <Button size="sm" onClick={() => handleDownload("json")} disabled={isWorking}>
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  Download Today's Backup
                </Button>
              )}
            </div>
          </div>

          {/* What is in a backup */}
          <div className="rounded-xl border border-border/60 bg-muted/10 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
              Included in a backup — {totalRows.toLocaleString("en-IN")} records
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {Object.entries(liveCounts).map(([label, count]) => (
                <div
                  key={label}
                  className="rounded-lg border border-border/50 bg-background px-3 py-2"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground truncate">
                    {label.replace(/-/g, " ")}
                  </p>
                  <p className="text-[15px] font-black tabular-nums text-foreground">
                    {count.toLocaleString("en-IN")}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground mt-3">
              Uploaded KYC and document <em>files</em> are not included — they are stored separately and are
              far too large to fit in a single backup file. Their records (name, type, customer) are backed up.
            </p>
          </div>

          {/* Manual download */}
          <div className="flex flex-wrap gap-2.5">
            <Button onClick={() => handleDownload("json")} disabled={isWorking}>
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Download Full Data Backup (.JSON)
            </Button>
            <Button variant="outline" onClick={() => handleDownload("csv")} disabled={isWorking}>
              <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" />
              Download as .CSV
            </Button>
          </div>
          <p className="text-[11.5px] text-muted-foreground">
            The <strong>.JSON</strong> file is the one to keep — it is the only format that can be restored below.
            The <strong>.XLS Excel Workbook</strong> includes section-wise sheet tabs (Customers, Equipment, Rentals, Payments, Returns, Owners, Documents, etc.) with custom column widths and document links.
          </p>

          {history.length > 0 && (
            <div className="border-t border-border/50 pt-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Recent automatic snapshots
              </p>
              <div className="space-y-1.5">
                {history.map((h) => (
                  <div
                    key={h.createdDate}
                    className="flex items-center justify-between rounded-lg border border-border/50 bg-background px-3 py-2 text-[12px]"
                  >
                    <span className="font-medium text-foreground">{formatDateDDMMYYYY(h.createdDate)}</span>
                    <span className="text-muted-foreground tabular-nums">
                      {h.rows.toLocaleString("en-IN")} records
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Restore */}
      <Card className="mt-6 border-amber-300/50">
        <CardHeader className="border-b border-amber-200/40 bg-amber-50/40 px-3 sm:px-6 py-3 sm:py-4 dark:bg-amber-950/20">
          <div className="flex items-center gap-3">
            <div className="metric-icon h-9 w-9 bg-amber-100 border-amber-200 dark:bg-amber-950/40 dark:border-amber-900">
              <HardDriveUpload className="h-4.5 w-4.5 text-amber-700 dark:text-amber-400" />
            </div>
            <div>
              <CardTitle>Restore From Backup</CardTitle>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                Replace the current data with a previously downloaded .JSON backup
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 space-y-4">
          <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3.5 dark:border-amber-900/50 dark:bg-amber-950/25">
            <p className="flex items-start gap-2 text-[12px] text-amber-800 dark:text-amber-300">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                Restoring <strong>overwrites</strong> customers, agreements, payments, returns and settings on
                this device with whatever the backup file contains. A safety copy of the current data is kept
                automatically, but the safest order is to download a fresh backup first.
              </span>
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => handleFilePicked(e.target.files?.[0])}
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isWorking}
          >
            <Upload className="mr-1.5 h-3.5 w-3.5" />
            Choose Backup File…
          </Button>
        </CardContent>
      </Card>

      {/* Confirmation — shows exactly what is about to be written */}
      <AlertDialog
        open={!!pendingRestore}
        onOpenChange={(open) => {
          if (!open) {
            setPendingRestore(null);
            setPendingFileName("");
            if (fileInputRef.current) fileInputRef.current.value = "";
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore this backup?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p className="text-[13px]">
                  This will replace the data on this device with the contents of{" "}
                  <strong className="font-mono">{pendingFileName}</strong>.
                </p>
                {pendingRestore && (
                  <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                      Backup taken {formatDateDDMMYYYY(pendingRestore.createdDate)}
                    </p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                      {Object.entries(pendingRestore.counts || {}).map(([label, count]) => (
                        <div key={label} className="flex justify-between text-[12px]">
                          <span className="text-muted-foreground capitalize">{label.replace(/-/g, " ")}</span>
                          <span className="font-semibold tabular-nums text-foreground">
                            {Number(count).toLocaleString("en-IN")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <p className="text-[12px] text-amber-700 dark:text-amber-400">
                  The current data will be kept as a safety copy, and the page will reload once the restore
                  finishes.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isWorking}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRestore} disabled={isWorking}>
              {isWorking ? "Restoring…" : "Restore & Overwrite"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function SettingsPage() {
  // H-14: allow-list, not deny-list. Gating on `role === "Staff"` meant a
  // missing or unexpected role value — a cleared key, a row typed by hand into
  // the Staff sheet — opened Settings, including the Danger Zone.
  const isAdmin = typeof window !== "undefined" && localStorage.getItem("medirent-user-role") === "Admin";
  const [activeSection, setActiveSection] = useState<"company" | "credentials" | "database" | "whatsapp" | "backup">("company");

  if (!isAdmin) {
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
    <AppShell title="Settings" subtitle="Manage your company details, user login credentials, database sync and data backups">
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
            {
              id: "whatsapp",
              label: "WhatsApp",
              desc: "Send agreements & reminders",
              icon: MessageSquare,
            },
            {
              // ITEM-1: backup lives alongside sync but is a separate concern -
              // Sheets sync is for sharing between devices, this is for surviving
              // a cleared browser.
              id: "backup",
              label: "Backup & Restore",
              desc: "Download and restore your data",
              icon: HardDriveDownload,
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
          <div className={activeSection === "whatsapp" ? "block animate-[fade-in_0.3s_ease-out]" : "hidden"}>
            <WhatsAppSettingsTab />
          </div>
          <div className={activeSection === "backup" ? "block animate-[fade-in_0.3s_ease-out]" : "hidden"}>
            <BackupSettingsTab />
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