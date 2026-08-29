// ══════════════════════════════════════════════════════════
// MediRent / Relife ERP — Google Apps Script Web App  (v6 — Shared-Secret Auth)
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
      .createTextOutput(JSON.stringify({ status: "ok", sheetName: ss.getName(), version: "v6" }))
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
  var idCol = headers.indexOf("id");
  if (idCol === -1) return;
  var data = sh.getRange(2, 1, sh.getLastRow() - 1, headers.length).getValues();
  for (var i = 0; i < data.length; i++) {
    if (String(data[i][idCol]) === String(id)) { sh.deleteRow(i + 2); break; }
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
