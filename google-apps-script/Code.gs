// ══════════════════════════════════════════════════════════
// MediRent / Relife ERP — Google Apps Script Web App  (v7 — WhatsApp Cloud API)
// Sheet ID: 1va-_-hRrCaj7CyZSfdEoQeU1PBwn7Bh_PJlj9kaR--0
//
// SETUP STEPS:
//  1. Replace ALL existing code with this script
//  2. Change TOKEN below to your own secret (must match VITE_GSHEETS_TOKEN /
//     the token saved in Settings on the frontend)
//  3. Click Deploy → Manage deployments → Edit (pencil) → Deploy
//     - Execute as: Me
//     - Who has access: Anyone
//
// v7 CHANGES (vs v6):
//  - NEW ACTION `sendWhatsApp`: sends a rental agreement (or any message) to a
//    customer through the Meta WhatsApp Cloud API, server-side. The frontend
//    posts the agreement HTML; this script converts it to a PDF, uploads it to
//    Meta as media, and sends it as a WhatsApp document message.
//  - WHY SERVER-SIDE: the previous implementation called graph.facebook.com
//    straight from the browser with VITE_WHATSAPP_ACCESS_TOKEN, which put a
//    permanent Meta access token into the public JS bundle — anyone opening
//    DevTools could read it and send WhatsApp messages as the business. The
//    token now lives only in this script's Script Properties and never reaches
//    a browser. Configure it under Project Settings → Script Properties:
//        WHATSAPP_PHONE_NUMBER_ID   (from Meta → WhatsApp → API Setup)
//        WHATSAPP_ACCESS_TOKEN      (System User permanent token)
//        WHATSAPP_APP_SECRET        (optional — only if "Require app secret"
//                                    is enabled on the Meta app)
//        WHATSAPP_TEMPLATE_NAME     (optional — approved template used to
//                                    re-open a conversation past the 24h window)
//        WHATSAPP_TEMPLATE_LANG     (optional — defaults to en_US)
//  - NEW ACTION `whatsappStatus` (GET): reports whether the credentials above
//    are present, so Settings can show a real connection state. It never
//    returns the token itself.
//
// v6 CHANGES (vs v5):
//  - SECURITY FIX: doGet/doPost previously accepted requests from anyone who
//    had the Web App URL, with no authentication at all — since the URL is
//    shipped in the public frontend JS bundle, this meant any visitor could
//    dump, overwrite, or clearSheet() the entire database directly, bypassing
//    the app's login screen entirely. Every request now must include a
//    `token` that matches TOKEN below, or it's rejected with a 401-style
//    JSON error before any sheet is touched.
//  - This is a shared secret, not a true server-side secret (it still has to
//    ship to the browser for a client-only app to call this endpoint) — it
//    stops opportunistic scanners and anyone who doesn't have the frontend
//    source, but rotate it periodically and treat it like a password.
//
// v5 CHANGES (vs v4):
//  - All writes (upsert / bulkUpsert / delete / clearSheet) are now serialized
//    with LockService. v4 had no locking: concurrent requests (e.g. many file
//    chunks uploading in parallel) could race on getLastRow()/appendRow() and
//    silently drop or overwrite each other's rows — this is what corrupted
//    documents previewed on a different device than they were uploaded from.
//  - Header formatting (bold/resize) only runs when headers actually changed,
//    instead of on every single row write — that was needlessly holding the
//    new lock longer and slowing every save.
//  - getAll now accepts optional filterKey/filterValue query params so large,
//    ever-growing tabs (FileChunks) don't have to be read in full for every
//    request — keeps chunk downloads fast as the sheet grows.
// ══════════════════════════════════════════════════════════

const SPREADSHEET_ID = "1va-_-hRrCaj7CyZSfdEoQeU1PBwn7Bh_PJlj9kaR--0";
const TOKEN = "392284cd2d4b0ea7d53f74cba8cd2288d044898d586824f1"; // must match the frontend's token — rotate both together
const SHEET_NAMES = ["Customers", "Equipment", "Rentals", "Payments", "Returns", "Owners", "Documents", "Exchanges", "FileChunks", "Staff"];
const LOCK_WAIT_MS = 30000;

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


function getSS() {
  if (SPREADSHEET_ID && SPREADSHEET_ID.trim() !== "") {
    try {
      return SpreadsheetApp.openById(SPREADSHEET_ID);
    } catch (e) {
      // Fallback to active spreadsheet if openById fails
    }
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

function unauthorized() {
  return ContentService
    .createTextOutput(JSON.stringify({ error: "Unauthorized" }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─── GET handler ────────────────────────────────────────────────────────────

function doGet(e) {
  // Meta WhatsApp Cloud API Webhook Verification handler
  if (e && e.parameter && e.parameter["hub.mode"] === "subscribe") {
    if (e.parameter["hub.verify_token"] === TOKEN) {
      return ContentService.createTextOutput(e.parameter["hub.challenge"]);
    }
    return unauthorized();
  }

  if (e.parameter.token !== TOKEN) return unauthorized();

  const action = e.parameter.action;
  const sheet  = e.parameter.sheet;

  if (action === "ping") {
    const ss = getSS();
    return ContentService
      .createTextOutput(JSON.stringify({ status: "ok", sheetName: ss.getName(), version: "v7" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // ── WhatsApp readiness, for the Settings screen. Reports only whether the
  //    credentials exist, never their values. ──
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
        // Last four digits only — enough to confirm the right number is wired up.
        phoneNumberIdMasked: pid ? pid.replace(/.(?=.{4})/g, "*") : ""
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (action === "getAll" && sheet) {
    const ss = getSS();
    const sh = ss.getSheetByName(sheet);
    if (!sh || sh.getLastRow() < 2 || sh.getLastColumn() === 0) {
      return ContentService.createTextOutput(JSON.stringify({ data: [] })).setMimeType(ContentService.MimeType.JSON);
    }
    const data    = sh.getDataRange().getValues();
    const headers = data[0];
    var rows = data.slice(1).map(function(row) {
      var obj = {};
      headers.forEach(function(h, i) { obj[h] = row[i]; });
      return obj;
    });

    // Optional server-side filter (e.g. ?filterKey=fileId&filterValue=doc-123)
    // so callers don't have to download an entire ever-growing tab (like
    // FileChunks) just to find the handful of rows they actually need.
    const filterKey = e.parameter.filterKey;
    const filterValue = e.parameter.filterValue;
    if (filterKey && filterValue !== undefined) {
      rows = rows.filter(function(r) { return String(r[filterKey]) === String(filterValue); });
    }

    // Deduplicate Staff rows by email if reading Staff tab
    if (sheet === "Staff") {
      var seenEmails = {};
      var dedupedRows = [];
      rows.forEach(function(r) {
        var em = String(r.email || r.Email || "").toLowerCase().trim();
        if (em && !seenEmails[em]) {
          seenEmails[em] = true;
          dedupedRows.push(r);
        } else if (!em) {
          dedupedRows.push(r);
        }
      });
      rows = dedupedRows;
    }

    return ContentService
      .createTextOutput(JSON.stringify({ data: rows }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // ── Send OTP via GET (fixes CORS issue with POST from deployed Netlify/Vercel sites) ──
  if (action === "sendOtp") {
    var email = e.parameter.email;
    var otp   = e.parameter.otp;
    if (!email || !otp) {
      return ContentService.createTextOutput(JSON.stringify({ error: "Missing email or otp" })).setMimeType(ContentService.MimeType.JSON);
    }
    var plainBody = "Your Relife ERP login verification code is: " + otp +
      "\n\nThis code expires in 10 minutes. Do not share it with anyone.";
    var htmlBody =
      "<div style='font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px;'>" +
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
    const ss    = getSS();

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
  var idCol = -1;
  var emailCol = -1;
  for (var h = 0; h < headers.length; h++) {
    var hLower = String(headers[h]).trim().toLowerCase();
    if (hLower === "id") idCol = h;
    if (hLower === "email") emailCol = h;
  }
  var existingData = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, headers.length).getValues() : [];
  var idToRowIndex = {};
  existingData.forEach(function(r, i) {
    if (idCol !== -1 && r[idCol] !== undefined && String(r[idCol]).trim() !== "") {
      idToRowIndex[String(r[idCol]).trim()] = i;
    }
    if (sh.getName() === "Staff" && emailCol !== -1 && r[emailCol]) {
      idToRowIndex["email:" + String(r[emailCol]).toLowerCase().trim()] = i;
    }
  });
  var toAppend = [];
  rows.forEach(function(row) {
    var newRow = headers.map(function(h) {
      var val = row[h];
      if (val === undefined) return "";
      if (val !== null && typeof val === "object") return JSON.stringify(val);
      return val;
    });
    var rowId = (idCol !== -1 && row[headers[idCol]] !== undefined) ? String(row[headers[idCol]]).trim() : (row["id"] !== undefined ? String(row["id"]).trim() : null);
    var rowEmail = (sh.getName() === "Staff" && row["email"]) ? "email:" + String(row["email"]).toLowerCase().trim() : null;

    var matchedIdx = null;
    if (rowId && idToRowIndex.hasOwnProperty(rowId)) {
      matchedIdx = idToRowIndex[rowId];
    } else if (rowEmail && idToRowIndex.hasOwnProperty(rowEmail)) {
      matchedIdx = idToRowIndex[rowEmail];
    }

    if (matchedIdx !== null) {
      sh.getRange(matchedIdx + 2, 1, 1, headers.length).setValues([newRow]);
    } else {
      toAppend.push(newRow);
      if (rowId) idToRowIndex[rowId] = existingData.length + toAppend.length - 1;
      if (rowEmail) idToRowIndex[rowEmail] = existingData.length + toAppend.length - 1;
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
  var idCol = -1;
  var emailCol = -1;
  for (var h = 0; h < headers.length; h++) {
    var hLower = String(headers[h]).trim().toLowerCase();
    if (hLower === "id") idCol = h;
    if (hLower === "email") emailCol = h;
  }
  var newRow = headers.map(function(h) {
    var val = row[h];
    if (val === undefined) return "";
    if (val !== null && typeof val === "object") return JSON.stringify(val);
    return val;
  });
  var rowId = (idCol !== -1 && row[headers[idCol]] !== undefined) ? String(row[headers[idCol]]).trim() : (row["id"] !== undefined ? String(row["id"]).trim() : null);
  var rowEmail = (sh.getName() === "Staff" && row["email"]) ? String(row["email"]).toLowerCase().trim() : null;

  var existingData = sh.getLastRow() > 1 && sh.getLastColumn() > 0
    ? sh.getRange(2, 1, sh.getLastRow() - 1, headers.length).getValues() : [];
  var found = false;
  for (var i = 0; i < existingData.length; i++) {
    var cellId = idCol !== -1 ? String(existingData[i][idCol]).trim() : null;
    var cellEmail = (sh.getName() === "Staff" && emailCol !== -1) ? String(existingData[i][emailCol]).toLowerCase().trim() : null;
    if ((rowId && cellId === rowId) || (rowEmail && cellEmail === rowEmail)) {
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
  var emailCol = -1;
  for (var h = 0; h < headers.length; h++) {
    var hLower = String(headers[h]).trim().toLowerCase();
    if (hLower === "id") idCol = h;
    if (hLower === "email") emailCol = h;
  }
  var target = String(id).toLowerCase().trim();
  var data = sh.getRange(2, 1, sh.getLastRow() - 1, headers.length).getValues();
  for (var i = data.length - 1; i >= 0; i--) {
    var matchId = idCol !== -1 && String(data[i][idCol]).toLowerCase().trim() === target;
    var matchEmail = emailCol !== -1 && String(data[i][emailCol]).toLowerCase().trim() === target;
    if (matchId || matchEmail) {
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
  var digits = String(raw || "").replace(/\D/g, "");
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
        var matches = bodyText.match(/\{\{\s*(\d+)\s*\}\}/g) || [];
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
