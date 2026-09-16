/**
 * WhatsApp Cloud API integration
 *
 * Architecture — why nothing here talks to graph.facebook.com directly:
 *   The previous implementation called Meta's Graph API from the browser using
 *   `import.meta.env.VITE_WHATSAPP_ACCESS_TOKEN`. Every `VITE_`-prefixed value is
 *   inlined into the public JS bundle at build time, so that permanent Meta token
 *   was readable by anyone who opened DevTools on the deployed site — enough to
 *   send WhatsApp messages as the business until the token was revoked.
 *
 *   Sends now go through the Google Apps Script web app (the same backend the
 *   database sync uses), which holds the credentials in Script Properties and
 *   never returns them. The browser posts a phone number, a message and — for
 *   the agreement — the printable HTML; the script converts that HTML to a PDF,
 *   uploads it to Meta as media, and sends it as a WhatsApp document.
 *
 * Delivery rules worth knowing (Meta's, not ours):
 *   - A free-form message only reaches a customer within 24 hours of THEIR last
 *     message to the business. Outside that window Meta rejects it (error
 *     131047) and only an approved template may be delivered. The Apps Script
 *     retries with WHATSAPP_TEMPLATE_NAME when one is configured.
 *   - When a send cannot go through, callers fall back to `openWhatsAppWeb`,
 *     which opens WhatsApp with the message pre-filled so the operator can send
 *     it by hand rather than losing the work.
 */

import { toast } from "sonner";

import { getGSheetsToken, getGSheetsUrl, isGSheetsEnabled } from "./google-sheets";
import {
  formatDateDDMMYYYY,
  getAgreementHtmlContent,
  getCompanySettings,
  getRentalEquipmentLabels,
} from "./data-store";

/** Numbers are stored as bare 10-digit locals throughout the ERP. */
export const WHATSAPP_DEFAULT_COUNTRY_CODE = "91";

export interface WhatsAppSendResult {
  ok: boolean;
  /** How Meta accepted it: "document", "text", "template" or "template+document". */
  mode?: string;
  messageId?: string;
  to?: string;
  error?: string;
}

export interface WhatsAppStatus {
  configured: boolean;
  hasPhoneNumberId: boolean;
  hasAccessToken: boolean;
  hasAppSecret: boolean;
  hasBusinessAccountId: boolean;
  templateName: string;
  phoneNumberIdMasked: string;
  apiVersion?: string;
  error?: string;
}

/** One approved (or pending) template as Meta reports it. */
export interface WhatsAppTemplate {
  name: string;
  status: string;
  language: string;
  category: string;
  /** "DOCUMENT", "TEXT", "IMAGE"… or "" when the template has no header. */
  headerFormat: string;
  /** Highest {{n}} placeholder in the body — the number of values Meta expects. */
  bodyParams: number;
  bodyText: string;
  usableForDocuments: boolean;
}

// ─── Phone helpers ───────────────────────────────────────────────────────────

/** To E.164 digits without "+" — the only shape Meta and wa.me both accept. */
export function normalizeWhatsAppPhone(raw: unknown): string {
  const digits = String(raw ?? "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10) return WHATSAPP_DEFAULT_COUNTRY_CODE + digits;
  // 0XXXXXXXXXX — the trunk prefix people use when dialling domestically.
  if (digits.length === 11 && digits.startsWith("0")) {
    return WHATSAPP_DEFAULT_COUNTRY_CODE + digits.slice(1);
  }
  return digits;
}

/** Pull the best contact number off a rental, falling back to the customer record. */
export function resolveCustomerPhone(record: any, customersList: any[] = []): string {
  const customer =
    (record?.customerId && customersList.find((c: any) => c.id === record.customerId)) ||
    customersList.find(
      (c: any) => c.name && record?.customer && c.name.toLowerCase() === record.customer.toLowerCase(),
    );
  const raw =
    customer?.phone ||
    record?.phone ||
    record?.customerPhone ||
    customer?.altPhone ||
    customer?.contactNumber3 ||
    "";
  return String(raw);
}

/** wa.me deep link — the manual fallback when an automatic send is refused. */
export function whatsAppWebUrl(phone: unknown, message: string): string {
  const to = normalizeWhatsAppPhone(phone);
  const text = encodeURIComponent(message);
  return to ? `https://wa.me/${to}?text=${text}` : `https://wa.me/?text=${text}`;
}

export function openWhatsAppWeb(phone: unknown, message: string) {
  if (typeof window === "undefined") return;
  window.open(whatsAppWebUrl(phone, message), "_blank", "noopener,noreferrer");
}

// ─── Transport ───────────────────────────────────────────────────────────────

export interface WhatsAppSendOptions {
  to: unknown;
  /** Body text, or the document caption when `documentHtml` is supplied. */
  message: string;
  /** Printable HTML to deliver as a PDF attachment. */
  documentHtml?: string;
  filename?: string;
  /** Caption shown under the PDF; defaults to `message`. */
  caption?: string;
  /** Used to fill an approved template when the 24h window has closed. */
  customerName?: string;
  reference?: string;
  templateParams?: string[];
}

/**
 * POSTs to the Apps Script web app.
 *
 * Deliberately not `sheetsRequest`: that helper sets `keepalive: true`, and the
 * fetch spec caps a keepalive request body at 64 KB. A printable agreement runs
 * well past that once a captured signature is inlined as a data URI, and the
 * browser rejects the whole request rather than truncating it. Database writes
 * are small and want keepalive so they survive a tab close; a WhatsApp send is
 * a foreground action the operator is waiting on, so it does not.
 */
async function postToAppsScript(
  payload: Record<string, unknown>,
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  const url = getGSheetsUrl();
  if (!url) return { success: false, error: "No Apps Script URL configured" };

  try {
    const response = await fetch(url, {
      method: "POST",
      // text/plain keeps this a CORS "simple request", so Apps Script (which
      // cannot answer a preflight) is reachable from the browser.
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ token: getGSheetsToken(), ...payload }),
    });

    if (!response.ok) throw new Error(`HTTP error ${response.status}`);

    const text = await response.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      // Apps Script serves an HTML sign-in or error page when the deployment
      // is not shared publicly or the script threw before returning JSON.
      return {
        success: false,
        error: `Non-JSON response from Apps Script (likely an auth or deployment error): ${text.slice(0, 200)}`,
      };
    }

    if (data && data.error) return { success: false, error: String(data.error) };
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function sendWhatsAppMessage(
  options: WhatsAppSendOptions,
): Promise<WhatsAppSendResult> {
  const to = normalizeWhatsAppPhone(options.to);
  if (!to) {
    return { ok: false, error: "No WhatsApp number on file for this customer." };
  }
  if (!isGSheetsEnabled()) {
    return {
      ok: false,
      to,
      error:
        "WhatsApp sending needs the Google Apps Script backend. Configure it under Settings → Database Sync first.",
    };
  }

  const result = await postToAppsScript({
    action: "sendWhatsApp",
    to,
    message: options.message,
    caption: options.caption ?? options.message,
    documentHtml: options.documentHtml,
    filename: options.filename,
    customerName: options.customerName,
    reference: options.reference,
    templateParams: options.templateParams,
  });

  if (!result.success) {
    return { ok: false, to, error: result.error || "WhatsApp send failed." };
  }

  const data = (result.data ?? {}) as { status?: string; mode?: string; messageId?: string };
  if (data.status !== "ok") {
    return {
      ok: false,
      to,
      error:
        "The Apps Script backend did not recognise the sendWhatsApp action. Re-copy the script from Settings → Database Sync and redeploy it.",
    };
  }
  return { ok: true, to, mode: data.mode, messageId: data.messageId };
}

/** Whether the server has WhatsApp credentials. Used by the Settings screen. */
export async function getWhatsAppStatus(): Promise<WhatsAppStatus> {
  const empty: WhatsAppStatus = {
    configured: false,
    hasPhoneNumberId: false,
    hasAccessToken: false,
    hasAppSecret: false,
    hasBusinessAccountId: false,
    templateName: "",
    phoneNumberIdMasked: "",
  };

  const url = getGSheetsUrl();
  if (!url) return { ...empty, error: "No Apps Script URL configured." };

  try {
    const response = await fetch(
      `${url}?action=whatsappStatus&token=${encodeURIComponent(getGSheetsToken())}`,
      { method: "GET" },
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json = await response.json();
    if (json.error) return { ...empty, error: String(json.error) };
    // An older deployment answers "Unknown action" rather than these fields.
    if (typeof json.configured !== "boolean") {
      return {
        ...empty,
        error:
          "This Apps Script deployment predates WhatsApp support. Re-copy the script from the Database Sync tab and redeploy it.",
      };
    }
    return { ...empty, ...json };
  } catch (err) {
    return { ...empty, error: err instanceof Error ? err.message : String(err) };
  }
}

// ─── Message templates ───────────────────────────────────────────────────────

/**
 * Reads the message templates back from Meta.
 *
 * A template send is rejected when the values sent do not match the template's
 * own shape, so this exists to make that shape visible in Settings rather than
 * something to be remembered or guessed at.
 */
export async function getWhatsAppTemplates(): Promise<{
  templates: WhatsAppTemplate[];
  selected: string;
  error?: string;
}> {
  const url = getGSheetsUrl();
  if (!url) return { templates: [], selected: "", error: "No Apps Script URL configured." };

  try {
    const response = await fetch(
      `${url}?action=whatsappTemplates&token=${encodeURIComponent(getGSheetsToken())}`,
      { method: "GET" },
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json = await response.json();
    if (json.error) return { templates: [], selected: "", error: String(json.error) };
    if (!Array.isArray(json.templates)) {
      return {
        templates: [],
        selected: "",
        error:
          "This Apps Script deployment is older than the template listing. Re-copy the script from Database Sync and deploy a new version.",
      };
    }
    return { templates: json.templates as WhatsAppTemplate[], selected: json.selected || "" };
  } catch (err) {
    return {
      templates: [],
      selected: "",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

const rupee = (n: unknown) => `₹${Math.round(Number(n) || 0).toLocaleString("en-IN")}`;

/**
 * The company profile ships with a placeholder name, but the printed agreement
 * letterhead is hard-coded to Relife — so fall back to that rather than signing
 * a WhatsApp message with a business name that appears nowhere on the document.
 */
export function getBusinessName(): string {
  const configured = getCompanySettings()?.companyName?.trim();
  if (!configured || configured === "MediRent Healthcare Pvt Ltd") {
    return "Relife Medical Technologies";
  }
  return configured;
}

/**
 * `withAttachment` must be false for the wa.me fallback: a pre-filled draft
 * carries text only, so the automatic wording would promise the customer a PDF
 * that is not there.
 */
export function buildRentalAgreementMessage(rental: any, withAttachment = true): string {
  const business = getBusinessName();
  const start = rental?.start ? formatDateDDMMYYYY(rental.start) : "—";
  const end = rental?.end ? formatDateDDMMYYYY(rental.end) : "Ongoing";

  const rent =
    rental?.rentRate ||
    (Number(rental?.monthlyRent) > 0
      ? `${rupee(rental.monthlyRent)}/month`
      : Number(rental?.dailyRent) > 0
        ? `${rupee(rental.dailyRent)}/day`
        : "—");

  const equipmentLabels = getRentalEquipmentLabels(rental);
  const equipment = equipmentLabels.length
    ? equipmentLabels.join(", ")
    : rental?.equipment || "Medical Equipment";

  return [
    `*Rental Agreement — ${business}*`,
    "",
    withAttachment
      ? `Dear ${rental?.customer || "Customer"}, your signed rental agreement is attached as a PDF.`
      : `Dear ${rental?.customer || "Customer"}, here are the details of your rental agreement.`,
    "",
    `📄 Agreement No: ${rental?.id ?? "—"}`,
    `📦 Equipment: ${equipment}`,
    `🗓️ Start Date: ${start}`,
    `🗓️ End Date: ${end}`,
    `💰 Rent: ${rent}`,
    `💵 Security Deposit: ${rupee(rental?.deposit)}`,
    "",
    withAttachment
      ? `Please keep this document for your records. Call us any time you need support with the equipment.`
      : `Call us any time you need support with the equipment, or a copy of the signed agreement.`,
    "",
    `— ${business}`,
  ].join("\n");
}

export function buildDueReminderMessage(params: {
  customer: string;
  agreement?: string;
  amount: number;
  dueDate?: string;
  equipment?: string;
}): string {
  const business = getBusinessName();
  return [
    `*Rent Reminder — ${business}*`,
    "",
    `Dear ${params.customer || "Customer"}, this is a gentle reminder about the rent due on your equipment rental.`,
    "",
    params.agreement ? `📄 Agreement No: ${params.agreement}` : "",
    params.equipment ? `📦 Equipment: ${params.equipment}` : "",
    `💰 Amount Due: ${rupee(params.amount)}`,
    params.dueDate ? `🗓️ Due Date: ${formatDateDDMMYYYY(params.dueDate)}` : "",
    "",
    `Kindly arrange the payment at your convenience. Please ignore this message if you have already paid.`,
    "",
    `— ${business}`,
  ]
    .filter((line) => line !== "")
    .join("\n");
}

// ─── High-level actions (these own their own toasts) ─────────────────────────

/** Turn a failed send into a recoverable one: offer the manual WhatsApp draft. */
function toastFailureWithFallback(
  toastId: string | number,
  phone: unknown,
  message: string,
  error: string,
) {
  // The toast is transient and Meta's refusals are the hard part of setting this
  // up, so keep the reason in the console where it can still be read afterwards.
  console.error("[WhatsApp] Send failed:", error, { to: normalizeWhatsAppPhone(phone) });
  toast.error(error, {
    id: toastId,
    duration: 20000,
    action: {
      label: "Send manually",
      onClick: () => openWhatsAppWeb(phone, message),
    },
  });
}

/**
 * Sends the rental agreement PDF to the customer's WhatsApp in one click.
 * `customersList` is where the phone number comes from when the rental record
 * doesn't carry one itself.
 */
export async function sendRentalAgreementOnWhatsApp(
  rental: any,
  customersList: any[] = [],
): Promise<WhatsAppSendResult> {
  if (!rental) return { ok: false, error: "No agreement selected." };

  const phone = resolveCustomerPhone(rental, customersList);
  const message = buildRentalAgreementMessage(rental);

  if (!normalizeWhatsAppPhone(phone)) {
    toast.error(`No phone number on file for ${rental.customer || "this customer"}.`, {
      description: "Add a mobile number to the customer record, then send the agreement again.",
    });
    return { ok: false, error: "No phone number on file." };
  }

  const toastId = toast.loading(
    `Sending agreement ${rental.id} to ${rental.customer || "customer"} on WhatsApp…`,
  );

  // Built in the browser so the PDF matches the on-screen preview exactly,
  // including the captured signature and thumbprint data URIs. Print mode is
  // off deliberately: it only injects an auto-window.print() script, which is
  // dead weight in a payload that is already large and never runs anyway.
  const documentHtml = getAgreementHtmlContent(rental, false);

  const result = await sendWhatsAppMessage({
    to: phone,
    message,
    documentHtml,
    filename: `Agreement_${String(rental.id || "Rental").replace(/[^A-Za-z0-9._-]/g, "_")}.pdf`,
    customerName: rental.customer,
    reference: String(rental.id ?? ""),
  });

  if (result.ok) {
    toast.success(`Agreement ${rental.id} sent to ${rental.customer || "customer"} on WhatsApp.`, {
      id: toastId,
      description: `Delivered to +${result.to} as a PDF attachment.`,
    });
  } else {
    // Meta refused the send; the operator can still forward the details by hand,
    // but only as text - so drop the "attached as a PDF" promise.
    toastFailureWithFallback(
      toastId,
      phone,
      buildRentalAgreementMessage(rental, false),
      result.error || "WhatsApp send failed.",
    );
  }
  return result;
}

/** Text-only send (reminders, receipts, pickup notices) with the same fallback. */
export async function sendWhatsAppTextWithFeedback(params: {
  to: unknown;
  message: string;
  customerName?: string;
  reference?: string;
  pendingLabel?: string;
  successLabel?: string;
}): Promise<WhatsAppSendResult> {
  if (!normalizeWhatsAppPhone(params.to)) {
    toast.error(`No phone number on file for ${params.customerName || "this customer"}.`);
    return { ok: false, error: "No phone number on file." };
  }

  const toastId = toast.loading(
    params.pendingLabel || `Sending WhatsApp message to ${params.customerName || "customer"}…`,
  );

  const result = await sendWhatsAppMessage({
    to: params.to,
    message: params.message,
    customerName: params.customerName,
    reference: params.reference,
  });

  if (result.ok) {
    toast.success(
      params.successLabel || `WhatsApp message sent to ${params.customerName || "customer"}.`,
      { id: toastId },
    );
  } else {
    toastFailureWithFallback(
      toastId,
      params.to,
      params.message,
      result.error || "WhatsApp send failed.",
    );
  }
  return result;
}
