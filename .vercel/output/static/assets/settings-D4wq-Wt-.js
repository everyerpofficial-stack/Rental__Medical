import{Y as e,_ as t,_t as n,at as r,ct as i,dt as a,ft as o,gt as s,ht as c,lt as l,mt as u,ot as d,ut as f,v as p,vt as m,xt as h}from"./data-store-Bd0U8wgt.js";import{O as g,S as _,a as v,i as y,o as b,s as x,t as S,y as C}from"./AppShell-CxqGAjnv.js";import{t as w}from"./building-2-CNNmFobL.js";import{t as T}from"./circle-check-dEO5QcXs.js";import{t as E}from"./circle-x-mDVj_9_5.js";import{t as ee}from"./copy-DmBFfsW_.js";import{t as te}from"./trash-2-KNMleR3-.js";import{G as D,H as O,W as k,_ as A,a as j,at as M,b as N,ft as P,g as F,h as I,i as L,it as R,n as z,nt as B,ot as V,r as H,t as U,v as ne,x as re,y as ie}from"./index-DEbkWMZA.js";import{a as ae,i as W,n as oe,o as G,r as K,t as se}from"./table-DBQUShjg.js";var ce=M(`cloud-download`,[[`path`,{d:`M12 13v8l-4-4`,key:`1f5nwf`}],[`path`,{d:`m12 21 4-4`,key:`1lfcce`}],[`path`,{d:`M4.393 15.269A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.436 8.284`,key:`ui1hmy`}]]),q=M(`cloud-upload`,[[`path`,{d:`M12 13v8`,key:`1l5pq0`}],[`path`,{d:`M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242`,key:`1pljnt`}],[`path`,{d:`m8 17 4-4 4 4`,key:`1quai1`}]]),J=M(`database`,[[`ellipse`,{cx:`12`,cy:`5`,rx:`9`,ry:`3`,key:`msslwz`}],[`path`,{d:`M3 5V19A9 3 0 0 0 21 19V5`,key:`1wlel7`}],[`path`,{d:`M3 12A9 3 0 0 0 21 12`,key:`mv7ke4`}]]),Y=M(`link-2`,[[`path`,{d:`M9 17H7A5 5 0 0 1 7 7h2`,key:`8i5ue5`}],[`path`,{d:`M15 7h2a5 5 0 1 1 0 10h-2`,key:`1b9ql8`}],[`line`,{x1:`8`,x2:`16`,y1:`12`,y2:`12`,key:`1jonct`}]]),X=M(`shield`,[[`path`,{d:`M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z`,key:`oel41y`}]]),le=M(`user-plus`,[[`path`,{d:`M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2`,key:`1yyitq`}],[`circle`,{cx:`9`,cy:`7`,r:`4`,key:`nufk8`}],[`line`,{x1:`19`,x2:`19`,y1:`8`,y2:`14`,key:`1bvyxn`}],[`line`,{x1:`22`,x2:`16`,y1:`11`,y2:`11`,key:`1shjgl`}]]),Z=h(m()),Q=P();function ue(){let[e,s]=(0,Z.useState)(a()),[f,p]=(0,Z.useState)(`idle`),[m,h]=(0,Z.useState)(``),[S,w]=(0,Z.useState)(!1),[A,j]=(0,Z.useState)(null),[M,N]=(0,Z.useState)(!1),[P,F]=(0,Z.useState)(null),[I,L]=(0,Z.useState)(null),[z,B]=(0,Z.useState)(!1),H=`1f5mJV8P90ID2-BiyeZZvtBF0Q3JjvyElbfI4omxkJRw`,U=`// ══════════════════════════════════════════════════════════
// MediRent / Relife ERP — Google Apps Script Web App  (v3 — FileChunks + HTML OTP)
// Sheet ID: ${H}
//
// SETUP STEPS:
//  1. Open your Google Sheet: https://docs.google.com/spreadsheets/d/${H}
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
}`;return(0,Q.jsxs)(`div`,{className:`space-y-5`,children:[(0,Q.jsxs)(y,{children:[(0,Q.jsx)(b,{className:`border-b border-border/60 bg-muted/20 px-6 py-4`,children:(0,Q.jsxs)(`div`,{className:`flex items-center gap-3`,children:[(0,Q.jsx)(`div`,{className:`metric-icon h-9 w-9 bg-success/10 text-success border-success/20`,children:(0,Q.jsx)(J,{className:`h-4.5 w-4.5`})}),(0,Q.jsxs)(`div`,{children:[(0,Q.jsx)(x,{children:`Google Sheets Database`}),(0,Q.jsxs)(`p`,{className:`text-[12px] text-muted-foreground mt-0.5`,children:[`Connected to Sheet ID: `,(0,Q.jsx)(`span`,{className:`font-mono text-primary`,children:H})]})]})]})}),(0,Q.jsxs)(v,{className:`p-6 space-y-5`,children:[(0,Q.jsxs)(`div`,{className:`rounded-xl border border-border/60 bg-muted/10 p-4 space-y-3`,children:[(0,Q.jsx)(`p`,{className:`text-[12px] font-bold uppercase tracking-wider text-muted-foreground`,children:`Setup Guide`}),(0,Q.jsx)(`ol`,{className:`space-y-2 text-[13px]`,children:[(0,Q.jsxs)(Q.Fragment,{children:[`Open your `,(0,Q.jsxs)(`a`,{href:`https://docs.google.com/spreadsheets/d/${H}`,target:`_blank`,rel:`noreferrer`,className:`text-primary underline inline-flex items-center gap-1`,children:[`Google Sheet `,(0,Q.jsx)(g,{className:`h-3 w-3`})]})]}),`Click Extensions → Apps Script`,`Replace all code with the script below, then click Save (Ctrl+S)`,`Click Deploy → New Deployment → Web App → Execute as: Me → Access: Anyone`,`Copy the Web App URL and paste it below`,`Click Save URL, then Test Connection, then Sync All Data`].map((e,t)=>(0,Q.jsxs)(`li`,{className:`flex items-start gap-2.5`,children:[(0,Q.jsx)(`span`,{className:`flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold mt-0.5`,children:t+1}),(0,Q.jsx)(`span`,{className:`text-muted-foreground leading-relaxed`,children:e})]},t))})]}),(0,Q.jsxs)(`div`,{children:[(0,Q.jsxs)(`div`,{className:`flex items-center justify-between mb-2`,children:[(0,Q.jsx)(O,{className:`text-[11px] font-semibold uppercase tracking-wider text-muted-foreground`,children:`Apps Script Code (Copy → Paste into Script Editor)`}),(0,Q.jsxs)(D,{variant:`outline`,size:`sm`,className:`h-7 text-[12px]`,onClick:()=>{navigator.clipboard.writeText(U).then(()=>{V.success(`Apps Script code copied to clipboard!`)})},children:[(0,Q.jsx)(ee,{className:`h-3 w-3 mr-1.5`}),` Copy Code`]})]}),(0,Q.jsx)(`div`,{className:`relative rounded-xl border border-border bg-muted/30 overflow-hidden`,children:(0,Q.jsxs)(`pre`,{className:`text-[10px] font-mono text-muted-foreground p-4 overflow-x-auto max-h-[200px] overflow-y-auto leading-relaxed`,children:[U.substring(0,500),`...`]})})]}),(0,Q.jsxs)(`div`,{className:`space-y-2`,children:[(0,Q.jsx)(O,{className:`text-[11px] font-semibold uppercase tracking-wider text-muted-foreground`,children:`Apps Script Web App URL`}),(0,Q.jsxs)(`div`,{className:`flex gap-2`,children:[(0,Q.jsxs)(`div`,{className:`relative flex-1`,children:[(0,Q.jsx)(Y,{className:`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60`}),(0,Q.jsx)(k,{value:e,onChange:e=>s(e.target.value),placeholder:`https://script.google.com/macros/s/.../exec`,className:`pl-9 h-10 text-[13px] font-mono`})]}),(0,Q.jsxs)(D,{onClick:()=>{if(e&&!e.startsWith(`https://script.google.com/`)){V.error(`URL must start with https://script.google.com/`);return}u(e),V.success(e?`Apps Script URL saved successfully.`:`Google Sheets integration disabled.`),p(`idle`),h(``),j(null)},className:`h-10 shrink-0`,children:[(0,Q.jsx)(R,{className:`h-4 w-4 mr-1.5`}),` Save URL`]})]}),e&&!e.startsWith(`https://script.google.com/`)&&(0,Q.jsxs)(`p`,{className:`text-[12px] text-destructive flex items-center gap-1.5 mt-1`,children:[(0,Q.jsx)(C,{className:`h-3 w-3`}),` URL must start with https://script.google.com/`]}),(0,Q.jsxs)(`div`,{className:`rounded-lg border border-blue-200/50 bg-blue-50/40 p-3 text-[12px] text-blue-800 space-y-1.5 mt-1`,children:[(0,Q.jsxs)(`p`,{className:`font-semibold flex items-center gap-1.5 text-blue-900`,children:[(0,Q.jsx)(X,{className:`h-3.5 w-3.5 text-blue-600`}),` Make Connection Permanent`]}),(0,Q.jsxs)(`p`,{className:`text-blue-700/90 leading-relaxed`,children:[`To prevent database disconnection when browser storage is cleared, set the`,(0,Q.jsx)(`code`,{className:`font-mono bg-blue-100/60 px-1 py-0.5 rounded text-[11px] font-semibold text-blue-900 mx-0.5`,children:`VITE_GSHEETS_URL`}),`environment variable in Netlify/Vercel settings or in your local `,(0,Q.jsx)(`code`,{className:`font-mono bg-blue-100/60 px-1 py-0.5 rounded text-[11px] font-semibold text-blue-900`,children:`.env`}),` file.`]})]})]}),(0,Q.jsxs)(`div`,{className:`flex flex-wrap gap-3 border-t border-border/50 pt-4`,children:[(0,Q.jsxs)(D,{variant:`outline`,onClick:async()=>{if(!e){V.error(`Please enter and save the Apps Script URL first.`);return}p(`testing`),h(`Testing connection...`);let t=await n();p(t.ok?`ok`:`error`),h(t.message),t.ok?V.success(`Connection successful!`):V.error(`Connection failed: `+t.message)},disabled:f===`testing`||!e,className:`h-9 text-[13px]`,children:[f===`testing`?(0,Q.jsx)(_,{className:`h-3.5 w-3.5 mr-1.5 animate-spin`}):f===`ok`?(0,Q.jsx)(T,{className:`h-3.5 w-3.5 mr-1.5 text-success`}):f===`error`?(0,Q.jsx)(E,{className:`h-3.5 w-3.5 mr-1.5 text-destructive`}):(0,Q.jsx)(Y,{className:`h-3.5 w-3.5 mr-1.5`}),`Test Connection`]}),(0,Q.jsxs)(D,{onClick:async()=>{if(!o()){V.error(`Please configure and test the Apps Script URL first.`);return}w(!0),j(null),V.info(`Syncing all data to Google Sheets...`);try{let e=await c(t());j(e),e.success?V.success(`All data synced! ${e.sheetsWritten.length} sheets updated.`):V.warning(`Sync partially complete. ${e.errors.length} errors occurred.`)}catch(e){V.error(`Sync failed: `+String(e))}finally{w(!1)}},disabled:S||z||!o(),className:`h-9 text-[13px]`,children:[S?(0,Q.jsx)(_,{className:`h-3.5 w-3.5 mr-1.5 animate-spin`}):(0,Q.jsx)(q,{className:`h-3.5 w-3.5 mr-1.5`}),S?`Syncing...`:`Sync All Data to Sheets`]}),(0,Q.jsxs)(D,{variant:`outline`,onClick:async()=>{if(!o()){V.error(`Please configure and test the Apps Script URL first.`);return}if(window.confirm(`Are you sure you want to pull all data from Google Sheets? This will OVERWRITE your browser's local data with the data from Google Sheets.`)){B(!0),V.info(`Pulling all data from Google Sheets...`);try{await r(!0),V.success(`All data successfully pulled from Google Sheets!`),setTimeout(()=>{window.location.reload()},1500)}catch(e){V.error(`Failed to pull data: `+String(e))}finally{B(!1)}}},disabled:S||z||!o(),className:`h-9 text-[13px]`,children:[z?(0,Q.jsx)(_,{className:`h-3.5 w-3.5 mr-1.5 animate-spin`}):(0,Q.jsx)(ce,{className:`h-3.5 w-3.5 mr-1.5`}),z?`Pulling...`:`Pull Data from Sheets`]}),(0,Q.jsxs)(D,{variant:`outline`,onClick:async()=>{if(!o()){V.error(`Please configure and test the Apps Script URL first.`);return}N(!0),L(null),F(null),V.info(`Checking this device's documents for files missing from Google Sheets...`);try{let e=await d((e,t)=>F({checked:e,total:t}));L(e),e.checked===0?V.info(`No document files found on this device to check.`):e.failed>0?V.warning(`Uploaded ${e.uploaded} missing file(s); ${e.failed} failed — retry later.`):e.uploaded>0?V.success(`Uploaded ${e.uploaded} file(s) that were missing from Google Sheets. They're now downloadable on every device.`):V.success(`All of this device's document files are already backed up to Google Sheets.`)}catch(e){V.error(`File sync failed: `+String(e))}finally{N(!1),F(null)}},disabled:M||S||z||!o(),className:`h-9 text-[13px]`,title:`Push document files stored on this device that never made it to Google Sheets, so they become downloadable/previewable on every device`,children:[M?(0,Q.jsx)(_,{className:`h-3.5 w-3.5 mr-1.5 animate-spin`}):(0,Q.jsx)(q,{className:`h-3.5 w-3.5 mr-1.5`}),M?P?`Checking ${P.checked}/${P.total}...`:`Checking...`:`Sync Missing Files`]})]}),m&&(0,Q.jsxs)(`div`,{className:`rounded-lg px-4 py-2.5 text-[12px] flex items-center gap-2 border ${f===`ok`?`bg-success/10 text-success border-success/20`:f===`error`?`bg-destructive/10 text-destructive border-destructive/20`:`bg-muted text-muted-foreground border-border/50`}`,children:[f===`ok`?(0,Q.jsx)(T,{className:`h-3.5 w-3.5 shrink-0`}):(0,Q.jsx)(E,{className:`h-3.5 w-3.5 shrink-0`}),m]}),A&&(0,Q.jsxs)(`div`,{className:`rounded-lg border border-border/60 bg-muted/10 p-3 text-[12px] space-y-1`,children:[(0,Q.jsx)(`p`,{className:`font-semibold text-foreground`,children:`Sync Result:`}),A.sheetsWritten.length>0&&(0,Q.jsxs)(`p`,{className:`text-success flex items-center gap-1.5`,children:[(0,Q.jsx)(T,{className:`h-3 w-3`}),`Synced: `,A.sheetsWritten.join(`, `)]}),A.errors.map((e,t)=>(0,Q.jsxs)(`p`,{className:`text-destructive flex items-center gap-1.5`,children:[(0,Q.jsx)(E,{className:`h-3 w-3`}),` `,e]},t))]}),I&&(0,Q.jsxs)(`div`,{className:`rounded-lg border border-border/60 bg-muted/10 p-3 text-[12px] space-y-1`,children:[(0,Q.jsx)(`p`,{className:`font-semibold text-foreground`,children:`Missing File Sync Result:`}),(0,Q.jsxs)(`p`,{className:`text-muted-foreground`,children:[`Checked `,I.checked,` file(s) stored on this device.`]}),I.uploaded>0&&(0,Q.jsxs)(`p`,{className:`text-success flex items-center gap-1.5`,children:[(0,Q.jsx)(T,{className:`h-3 w-3`}),` Uploaded `,I.uploaded,` missing file(s) to Google Sheets`]}),I.alreadySynced>0&&(0,Q.jsxs)(`p`,{className:`text-muted-foreground flex items-center gap-1.5`,children:[(0,Q.jsx)(T,{className:`h-3 w-3`}),` `,I.alreadySynced,` already backed up`]}),I.failed>0&&(0,Q.jsxs)(`p`,{className:`text-destructive flex items-center gap-1.5`,children:[(0,Q.jsx)(E,{className:`h-3 w-3`}),` `,I.failed,` failed to upload — retry later`]})]}),(0,Q.jsxs)(`div`,{className:`flex items-center gap-2 text-[12px]`,children:[(0,Q.jsx)(`span`,{className:`text-muted-foreground`,children:`Integration Status:`}),(0,Q.jsxs)(`span`,{className:`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-semibold border text-[11px] ${o()?`bg-success/10 text-success border-success/20`:`bg-muted text-muted-foreground border-border/50`}`,children:[(0,Q.jsx)(`span`,{className:`h-1.5 w-1.5 rounded-full bg-current ${o()?`animate-pulse`:`opacity-40`}`}),o()?`Active — Auto-syncing writes to Sheets`:`Inactive — Save a URL to enable`]})]})]})]}),typeof window<`u`&&localStorage.getItem(`medirent-user-role`)===`Admin`?(0,Q.jsxs)(y,{className:`border-destructive/30 bg-destructive/5 mt-6`,children:[(0,Q.jsx)(b,{className:`border-b border-destructive/10 px-6 py-4`,children:(0,Q.jsxs)(`div`,{className:`flex items-center gap-3`,children:[(0,Q.jsx)(`div`,{className:`metric-icon h-9 w-9 shrink-0 bg-destructive/10 text-destructive border-destructive/20`,children:(0,Q.jsx)(te,{className:`h-4.5 w-4.5 text-destructive`})}),(0,Q.jsxs)(`div`,{children:[(0,Q.jsx)(x,{className:`text-destructive`,children:`Danger Zone — Reset Database`}),(0,Q.jsx)(`p`,{className:`text-[12px] text-muted-foreground mt-0.5`,children:`Permanently purge all data from the database.`})]})]})}),(0,Q.jsxs)(v,{className:`p-6 space-y-4`,children:[(0,Q.jsx)(`p`,{className:`text-[12px] text-muted-foreground leading-normal`,children:`This will permanently delete all records (Customers, Equipment, Rentals, Payments, Returns, Owners, Documents) from your local browser. If Google Sheets is connected, you can also choose to clear all rows in the connected spreadsheets.`}),(0,Q.jsxs)(D,{variant:`destructive`,onClick:async()=>{if(window.confirm(`WARNING: This will permanently delete all records (Customers, Equipment, Rentals, Payments, Returns, Owners, Documents, Exchanges) from your local browser database. This action is IRREVERSIBLE.

Are you sure you want to proceed?`)){if(o()&&window.confirm(`Your Google Sheets database is connected. Do you also want to clear all data rows in Google Sheets? (Keeping sheet headers intact)`)){V.info(`Clearing cloud Google Sheets database...`);try{let e=[i.CUSTOMERS,i.EQUIPMENT,i.RENTALS,i.PAYMENTS,i.RETURNS,i.OWNERS,i.DOCUMENTS,i.EXCHANGES];for(let t of e){let e=await l(t);if(!e.success)throw Error(`Failed to clear sheet ${t}: ${e.error}`)}V.success(`Google Sheets database cleared successfully!`)}catch(e){let t=String(e);if(console.warn(`[GSheets] Clear failed:`,e),!window.confirm(`Failed to clear Google Sheets: ${t}\n\nThis usually happens because your deployed Google Apps Script does not support the new clear action. To fix this, copy the updated Apps Script code from the section above, paste it in Extensions → Apps Script, and click Deploy → New Deployment.\n\nDo you want to clear your local database anyway?`))return}}localStorage.removeItem(`medirent-customers`),localStorage.removeItem(`medirent-equipment`),localStorage.removeItem(`medirent-rentals`),localStorage.removeItem(`medirent-payments`),localStorage.removeItem(`medirent-returns`),localStorage.removeItem(`medirent-owners`),localStorage.removeItem(`medirent-documents`),localStorage.removeItem(`medirent-exchanges`),V.success(`Local database cleared successfully! Reloading...`),setTimeout(()=>{window.location.reload()},1500)}},className:`w-full sm:w-auto h-10 gap-1.5`,children:[(0,Q.jsx)(C,{className:`h-4 w-4`}),`Delete All Database Data`]})]})]}):(0,Q.jsx)(y,{className:`border-border/30 mt-6`,children:(0,Q.jsx)(v,{className:`p-6`,children:(0,Q.jsxs)(`p`,{className:`text-[12px] text-muted-foreground flex items-center gap-2`,children:[(0,Q.jsx)(X,{className:`h-4 w-4 text-primary shrink-0`}),`Database reset operations are restricted to Administrator accounts only.`]})})})]})}function de(){let[t,n]=(0,Z.useState)(p()),r=e=>t=>{n(n=>({...n,[e]:t.target.value}))};return(0,Q.jsxs)(y,{children:[(0,Q.jsx)(b,{className:`border-b border-border/60 bg-muted/20 px-6 py-4`,children:(0,Q.jsxs)(`div`,{className:`flex items-center gap-3`,children:[(0,Q.jsx)(`div`,{className:`metric-icon h-9 w-9 bg-primary/10 text-primary border-primary/20`,children:(0,Q.jsx)(w,{className:`h-4.5 w-4.5`})}),(0,Q.jsxs)(`div`,{children:[(0,Q.jsx)(x,{children:`Company Details`}),(0,Q.jsx)(`p`,{className:`text-[12px] text-muted-foreground mt-0.5`,children:`Your business identity & contact info`})]})]})}),(0,Q.jsxs)(v,{className:`p-6 grid gap-5 sm:grid-cols-2`,children:[(0,Q.jsx)($,{label:`Company Name`,value:t.companyName,onChange:r(`companyName`)}),(0,Q.jsx)($,{label:`GSTIN`,value:t.gstin,onChange:r(`gstin`)}),(0,Q.jsx)($,{label:`Contact Email`,value:t.contactEmail,onChange:r(`contactEmail`),type:`email`}),(0,Q.jsx)($,{label:`Contact Phone`,value:t.contactPhone,onChange:r(`contactPhone`)}),(0,Q.jsx)(`div`,{className:`sm:col-span-2`,children:(0,Q.jsx)($,{label:`Address`,value:t.address,onChange:r(`address`)})}),(0,Q.jsxs)(`div`,{className:`sm:col-span-2 space-y-1.5`,children:[(0,Q.jsx)(O,{className:`text-[11px] font-semibold uppercase tracking-wider text-muted-foreground`,children:`Logo Upload`}),(0,Q.jsx)(k,{type:`file`,className:`h-10 text-[13px] file:text-[13px]`})]}),(0,Q.jsxs)(`div`,{className:`sm:col-span-2 flex items-center justify-between border-t border-border/50 pt-5`,children:[(0,Q.jsx)(`p`,{className:`text-[12px] text-muted-foreground`,children:`Changes are saved to local storage and persist across refreshes.`}),(0,Q.jsxs)(`div`,{className:`flex gap-2`,children:[(0,Q.jsx)(D,{variant:`outline`,type:`button`,onClick:()=>{n(p()),V.info(`Company settings edits discarded.`)},children:`Cancel`}),(0,Q.jsxs)(D,{type:`button`,onClick:()=>{e(t),V.success(`Company settings saved successfully.`)},children:[(0,Q.jsx)(R,{className:`mr-2 h-4 w-4`}),`Save Changes`]})]})]})]})]})}function fe(){let[e,t]=(0,Z.useState)(()=>{if(typeof window<`u`){let e=localStorage.getItem(`medirent-staff-users`);if(e)try{return JSON.parse(e)}catch(e){console.error(e)}let t=[{id:`1`,name:`Relife Admin`,email:`relifemedicaltechnologies.mys@gmail.com`,passwordHash:`2d8b2a1ff89a8b02e74a88a7fba7304e1724aa45324dd82ce7da2f9d4d3b0cec`,role:`Admin`,firstAdmin:!0}];return localStorage.setItem(`medirent-staff-users`,JSON.stringify(t)),t}return[]}),[n,r]=(0,Z.useState)(``),[a,c]=(0,Z.useState)(``),[l,u]=(0,Z.useState)(``),[d,p]=(0,Z.useState)(`Staff`),[m,h]=(0,Z.useState)(!1),g=async f=>{if(f.preventDefault(),!n.trim()){V.error(`Please enter a name`);return}if(!a.trim()||!a.includes(`@`)){V.error(`Please enter a valid email address`);return}if(l.length<8){V.error(`Password must be at least 8 characters long`);return}if(!/[A-Z]/.test(l)){V.error(`Password must contain at least one uppercase letter`);return}if(!/[0-9]/.test(l)){V.error(`Password must contain at least one number`);return}if(!/[^A-Za-z0-9]/.test(l)){V.error(`Password must contain at least one special character (e.g. @, #, !)`);return}if(e.some(e=>e.email.toLowerCase()===a.toLowerCase().trim())){V.error(`A user with this email already exists`);return}let m=new TextEncoder().encode(l),g=await crypto.subtle.digest(`SHA-256`,m),_=Array.from(new Uint8Array(g)).map(e=>e.toString(16).padStart(2,`0`)).join(``),v={id:Date.now().toString(),name:n.trim(),email:a.toLowerCase().trim(),passwordHash:_,role:d},y=[...e,v];t(y),localStorage.setItem(`medirent-staff-users`,JSON.stringify(y)),o()&&s(i.STAFF,v),V.success(`Staff user added successfully.`),r(``),c(``),u(``),p(`Staff`),h(!1)},_=(n,r)=>{if(r){V.error(`The primary administrator account cannot be deleted.`);return}let a=e.filter(e=>e.id!==n);t(a),localStorage.setItem(`medirent-staff-users`,JSON.stringify(a)),o()&&f(i.STAFF,n),V.success(`Staff user deleted successfully.`)},S=(typeof window<`u`?localStorage.getItem(`medirent-user-role`):null)===`Admin`,C=e=>{switch(e){case`Admin`:return`bg-indigo-50 text-indigo-700 border-indigo-200/50 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800/40`;default:return`bg-emerald-50 text-emerald-700 border-emerald-200/50 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40`}};return(0,Q.jsxs)(y,{children:[(0,Q.jsxs)(b,{className:`border-b border-border/60 bg-muted/20 px-6 py-4 flex flex-row items-center justify-between gap-4`,children:[(0,Q.jsxs)(`div`,{className:`flex items-center gap-3`,children:[(0,Q.jsx)(`div`,{className:`metric-icon h-9 w-9 bg-primary/10 text-primary border-primary/20`,children:(0,Q.jsx)(B,{className:`h-4.5 w-4.5`})}),(0,Q.jsxs)(`div`,{children:[(0,Q.jsx)(x,{children:`User Login Credentials`}),(0,Q.jsx)(`p`,{className:`text-[12px] text-muted-foreground mt-0.5`,children:`Manage staff login emails, passwords, and access roles`})]})]}),(0,Q.jsxs)(I,{open:m,onOpenChange:h,children:[(0,Q.jsx)(re,{asChild:!0,children:(0,Q.jsxs)(D,{size:`sm`,className:`h-9 text-[12px] gap-1.5 shadow-sm`,children:[(0,Q.jsx)(le,{className:`h-4 w-4`}),` Add Staff User`]})}),(0,Q.jsx)(A,{className:`sm:max-w-[420px]`,children:(0,Q.jsxs)(`form`,{onSubmit:g,className:`space-y-4`,children:[(0,Q.jsx)(ie,{children:(0,Q.jsx)(N,{children:`Add Staff User`})}),(0,Q.jsxs)(`div`,{className:`space-y-3.5 py-2`,children:[(0,Q.jsxs)(`div`,{className:`space-y-1.5`,children:[(0,Q.jsx)(O,{htmlFor:`name`,className:`text-[11px] font-bold uppercase tracking-[0.05em] text-muted-foreground`,children:`Full Name`}),(0,Q.jsx)(k,{id:`name`,value:n,onChange:e=>r(e.target.value),placeholder:`e.g. John Doe`,required:!0,className:`h-10 text-[13px]`})]}),(0,Q.jsxs)(`div`,{className:`space-y-1.5`,children:[(0,Q.jsx)(O,{htmlFor:`email`,className:`text-[11px] font-bold uppercase tracking-[0.05em] text-muted-foreground`,children:`Email Address`}),(0,Q.jsx)(k,{id:`email`,type:`email`,value:a,onChange:e=>c(e.target.value),placeholder:`e.g. john@medirent.com`,required:!0,className:`h-10 text-[13px]`})]}),(0,Q.jsxs)(`div`,{className:`space-y-1.5`,children:[(0,Q.jsx)(O,{htmlFor:`password`,className:`text-[11px] font-bold uppercase tracking-[0.05em] text-muted-foreground`,children:`Login Password`}),(0,Q.jsx)(k,{id:`password`,type:`password`,value:l,onChange:e=>u(e.target.value),placeholder:`Min 8 chars, uppercase, number, symbol`,required:!0,className:`h-10 text-[13px]`})]}),(0,Q.jsxs)(`div`,{className:`space-y-1.5`,children:[(0,Q.jsx)(O,{htmlFor:`role`,className:`text-[11px] font-bold uppercase tracking-[0.05em] text-muted-foreground`,children:`Role`}),(0,Q.jsxs)(U,{value:d,onValueChange:e=>p(e),children:[(0,Q.jsx)(L,{id:`role`,className:`h-10 text-[13px] bg-background border border-input`,children:(0,Q.jsx)(j,{placeholder:`Select a role`})}),(0,Q.jsxs)(z,{children:[(0,Q.jsx)(H,{value:`Admin`,className:`text-[13px]`,children:`Admin (Full Access)`}),(0,Q.jsx)(H,{value:`Staff`,className:`text-[13px]`,children:`Staff User`})]})]})]})]}),(0,Q.jsxs)(ne,{className:`gap-2 pt-2 border-t border-border/50`,children:[(0,Q.jsx)(F,{asChild:!0,children:(0,Q.jsx)(D,{type:`button`,variant:`outline`,className:`h-9 text-[13px]`,children:`Cancel`})}),(0,Q.jsx)(D,{type:`submit`,className:`h-9 text-[13px]`,children:`Create Account`})]})]})})]})]}),(0,Q.jsx)(v,{className:`p-0`,children:(0,Q.jsx)(`div`,{className:`overflow-x-auto`,children:(0,Q.jsxs)(se,{children:[(0,Q.jsx)(ae,{className:`bg-muted/10`,children:(0,Q.jsxs)(G,{children:[(0,Q.jsx)(W,{className:`w-[200px] text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3`,children:`Name`}),(0,Q.jsx)(W,{className:`text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3`,children:`Email`}),(0,Q.jsx)(W,{className:`w-[140px] text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3`,children:`Role`}),(0,Q.jsx)(W,{className:`w-[100px] text-right text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3 pr-6`,children:`Action`})]})}),(0,Q.jsx)(oe,{children:e.map(e=>(0,Q.jsxs)(G,{className:`hover:bg-muted/5 transition-colors`,children:[(0,Q.jsx)(K,{className:`font-semibold text-[13px] py-3.5`,children:e.name}),(0,Q.jsx)(K,{className:`text-[13px] text-muted-foreground py-3.5`,children:e.email}),(0,Q.jsx)(K,{className:`py-3.5`,children:(0,Q.jsx)(`span`,{className:`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${C(e.role)}`,children:e.role})}),(0,Q.jsx)(K,{className:`text-right py-3.5 pr-6`,children:S&&(0,Q.jsx)(D,{variant:`ghost`,size:`icon`,disabled:!!e.firstAdmin,onClick:()=>_(e.id,!!e.firstAdmin),className:`h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10`,title:e.firstAdmin?`Primary admin cannot be deleted`:`Delete User`,children:(0,Q.jsx)(te,{className:`h-4 w-4`})})})]},e.id))})]})})})]})}function pe(){let e=typeof window<`u`&&localStorage.getItem(`medirent-user-role`)===`Staff`,[t,n]=(0,Z.useState)(`company`);return e?(0,Q.jsx)(S,{title:`Access Denied`,subtitle:`You do not have permission to view settings.`,children:(0,Q.jsx)(`div`,{className:`max-w-4xl mx-auto py-12 text-center`,children:(0,Q.jsx)(`p`,{className:`text-muted-foreground bg-destructive/10 text-destructive border border-destructive/20 rounded-lg p-4 font-semibold inline-block`,children:`Access Denied: Settings are only accessible by Administrators.`})})}):(0,Q.jsx)(S,{title:`Settings`,subtitle:`Manage your company details, user login credentials, and database sync settings`,children:(0,Q.jsxs)(`div`,{className:`max-w-6xl mx-auto flex flex-col lg:flex-row gap-6 pb-10`,children:[(0,Q.jsx)(`div`,{className:`w-full lg:w-[260px] shrink-0 space-y-1.5`,children:[{id:`company`,label:`Company Profile`,desc:`Business identity & details`,icon:w},{id:`credentials`,label:`User Credentials`,desc:`Staff accounts & access`,icon:B},{id:`database`,label:`Database Sync`,desc:`Google Sheets connection`,icon:J}].map(e=>{let r=e.icon,i=t===e.id;return(0,Q.jsxs)(`button`,{type:`button`,onClick:()=>n(e.id),className:`w-full flex items-center gap-3.5 px-4.5 py-3.5 rounded-xl border text-left transition-all duration-200 ${i?`bg-primary text-primary-foreground border-primary shadow-[var(--shadow-soft)]`:`bg-card hover:bg-muted/40 border-border/60 text-muted-foreground hover:text-foreground`}`,children:[(0,Q.jsx)(r,{className:`h-4.5 w-4.5 shrink-0 ${i?`text-primary-foreground`:`text-primary`}`}),(0,Q.jsxs)(`div`,{className:`min-w-0`,children:[(0,Q.jsx)(`p`,{className:`text-[13px] font-bold tracking-tight`,children:e.label}),(0,Q.jsx)(`p`,{className:`text-[10px] truncate mt-0.5 ${i?`text-primary-foreground/75`:`text-muted-foreground/80`}`,children:e.desc})]})]},e.id)})}),(0,Q.jsxs)(`div`,{className:`flex-1 min-w-0`,children:[(0,Q.jsx)(`div`,{className:t===`company`?`block animate-[fade-in_0.3s_ease-out]`:`hidden`,children:(0,Q.jsx)(de,{})}),(0,Q.jsx)(`div`,{className:t===`credentials`?`block animate-[fade-in_0.3s_ease-out]`:`hidden`,children:(0,Q.jsx)(fe,{})}),(0,Q.jsx)(`div`,{className:t===`database`?`block animate-[fade-in_0.3s_ease-out]`:`hidden`,children:(0,Q.jsx)(ue,{})})]})]})})}function me({children:e}){return(0,Q.jsx)(O,{className:`text-[11px] font-semibold uppercase tracking-wider text-muted-foreground`,children:e})}function $({label:e,value:t,onChange:n,type:r=`text`,className:i}){return(0,Q.jsxs)(`div`,{className:`space-y-1.5 ${i??``}`,children:[(0,Q.jsx)(me,{children:e}),(0,Q.jsx)(k,{type:r,value:t,onChange:n,className:`h-10 text-[13px]`})]})}export{pe as component};