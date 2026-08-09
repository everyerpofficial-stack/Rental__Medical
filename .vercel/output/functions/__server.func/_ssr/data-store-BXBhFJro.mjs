import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/data-store-BXBhFJro.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
Array.from({ length: 12 }).map((_, i) => ({
	month: [
		"Jan",
		"Feb",
		"Mar",
		"Apr",
		"May",
		"Jun",
		"Jul",
		"Aug",
		"Sep",
		"Oct",
		"Nov",
		"Dec"
	][i],
	current: 32e4 + Math.round(Math.sin(i / 2) * 9e4) + i * 22e3,
	previous: 28e4 + Math.round(Math.cos(i / 2) * 6e4) + i * 16e3
}));
Array.from({ length: 12 }).map((_, i) => ({
	month: [
		"Jan",
		"Feb",
		"Mar",
		"Apr",
		"May",
		"Jun",
		"Jul",
		"Aug",
		"Sep",
		"Oct",
		"Nov",
		"Dec"
	][i],
	newRentals: 180 + Math.round(Math.sin(i / 2.5) * 40) + i * 8,
	returns: 140 + Math.round(Math.cos(i / 2.5) * 30) + i * 5
}));
Array.from({ length: 7 }).map((_, i) => ({
	day: [
		"Mon",
		"Tue",
		"Wed",
		"Thu",
		"Fri",
		"Sat",
		"Sun"
	][i],
	collected: 4e4 + i * 7e3 + Math.round(Math.sin(i) * 12e3),
	pending: 1e4 + i * 2e3 + Math.round(Math.cos(i) * 5e3)
}));
var customers = [];
var equipment = [];
var rentals = [];
var payments = [];
var returns = [];
/**
* Google Sheets Integration via Apps Script Web App
*
* Architecture:
*  - A Google Apps Script "Web App" acts as a CORS-enabled proxy to the Google Sheet.
*  - All reads/writes go through: POST/GET to the Apps Script URL.
*  - localStorage is used as an offline cache; Sheets is the source of truth.
*  - Writes are async (fire-and-forget) so the UI stays snappy.
*
* Sheet Structure (one tab per entity):
*  Customers | Equipment | Rentals | Payments | Returns | Owners | Documents
*
* Each tab has a header row with field names, followed by data rows.
*/
var isBrowser$1 = typeof window !== "undefined";
function getGSheetsUrl() {
	if (!isBrowser$1) return "";
	return localStorage.getItem("medirent-gsheets-url") || "https://script.google.com/macros/s/AKfycbwGtMZHfNnAoEsbRIUsNZVmOTotRmChnaXsxPbEqih05-YitjF3skHYQdxcxAYR5KPGFA/exec";
}
function setGSheetsUrl(url) {
	if (isBrowser$1) localStorage.setItem("medirent-gsheets-url", url);
}
function isGSheetsEnabled() {
	const url = getGSheetsUrl();
	return !!url && url.startsWith("https://script.google.com/");
}
async function sheetsRequest(action, payload) {
	const url = getGSheetsUrl();
	if (!url) return {
		success: false,
		error: "No Apps Script URL configured"
	};
	try {
		const response = await fetch(url, {
			method: "POST",
			headers: { "Content-Type": "text/plain;charset=utf-8" },
			body: JSON.stringify({
				action,
				...payload
			}),
			keepalive: true
		});
		if (!response.ok) throw new Error(`HTTP error ${response.status}`);
		const text = await response.text();
		let data;
		try {
			data = JSON.parse(text);
		} catch (e) {
			return {
				success: true,
				data: text
			};
		}
		if (data && data.error) return {
			success: false,
			error: data.error
		};
		return {
			success: true,
			data
		};
	} catch (err) {
		console.warn("[GSheets] Request failed:", err);
		return {
			success: false,
			error: err instanceof Error ? err.message : String(err)
		};
	}
}
/** For reads we need a GET with callback (JSONP-style via Apps Script doGet) */
async function sheetsGet(sheet, filter) {
	const url = getGSheetsUrl();
	if (!url) return {
		success: false,
		error: "No Apps Script URL configured"
	};
	try {
		let getUrl = `${url}?action=getAll&sheet=${encodeURIComponent(sheet)}`;
		if (filter) getUrl += `&filterKey=${encodeURIComponent(filter.key)}&filterValue=${encodeURIComponent(filter.value)}`;
		const response = await fetch(getUrl, { method: "GET" });
		if (!response.ok) throw new Error(`HTTP ${response.status}`);
		return {
			success: true,
			data: (await response.json()).data || []
		};
	} catch (err) {
		console.warn("[GSheets] GET failed:", err);
		return {
			success: false,
			error: String(err)
		};
	}
}
/** Test connectivity to the Apps Script Web App */
async function testConnection() {
	const url = getGSheetsUrl();
	if (!url) return {
		ok: false,
		message: "No URL configured"
	};
	if (!url.startsWith("https://script.google.com/")) return {
		ok: false,
		message: "URL must start with https://script.google.com/"
	};
	try {
		const testUrl = `${url}?action=ping`;
		const response = await fetch(testUrl, { method: "GET" });
		if (!response.ok) throw new Error(`HTTP ${response.status}`);
		const json = await response.json();
		if (json.status === "ok") return {
			ok: true,
			message: `Connected! Sheet: "${json.sheetName || "Unknown"}"`
		};
		throw new Error(json.error || "Unknown error");
	} catch (err) {
		return {
			ok: false,
			message: `Connection failed: ${String(err)}`
		};
	}
}
function getPendingSyncs() {
	if (!isBrowser$1) return [];
	try {
		return JSON.parse(localStorage.getItem("medirent-pending-syncs") || "[]");
	} catch {
		return [];
	}
}
function setPendingSyncs(syncs) {
	if (isBrowser$1) localStorage.setItem("medirent-pending-syncs", JSON.stringify(syncs));
}
function addPendingSync(type, sheet, id, data) {
	const filtered = getPendingSyncs().filter((s) => !(s.sheet === sheet && s.id === id));
	filtered.push({
		type,
		sheet,
		id,
		data,
		timestamp: Date.now()
	});
	setPendingSyncs(filtered);
}
function removePendingSync(sheet, id) {
	setPendingSyncs(getPendingSyncs().filter((s) => !(s.sheet === sheet && s.id === id)));
}
function cleanStalePendingSyncs() {
	const syncs = getPendingSyncs();
	const now = Date.now();
	setPendingSyncs(syncs.filter((s) => now - s.timestamp < 12e4));
}
/** Write a single row upsert (insert or update by id field) */
function syncRowToSheet(sheet, row) {
	if (!row || !row.id) return;
	const id = String(row.id);
	addPendingSync("upsert", sheet, id, row);
	let cleanRow = row;
	if (row && row.fileData) {
		const { fileData, ...rest } = row;
		cleanRow = rest;
	}
	sheetsRequest("upsert", {
		sheet,
		row: cleanRow
	}).then((res) => {
		if (res.success) removePendingSync(sheet, id);
	}).catch((err) => {
		console.warn(`[GSheets] Upsert sync failed for ${sheet}/${id}:`, err);
	});
}
/** Delete a row from a sheet by id */
function deleteRowFromSheet(sheet, id) {
	addPendingSync("delete", sheet, id);
	sheetsRequest("delete", {
		sheet,
		id
	}).then((res) => {
		if (res.success) removePendingSync(sheet, id);
	}).catch((err) => {
		console.warn(`[GSheets] Delete sync failed for ${sheet}/${id}:`, err);
	});
}
/** Bulk push all localStorage data to Sheets */
async function syncAllToSheets(allData) {
	const url = getGSheetsUrl();
	if (!url) return {
		success: false,
		sheetsWritten: [],
		errors: ["No URL configured"]
	};
	const sheetsWritten = [];
	const errors = [];
	const cleanedData = { ...allData };
	for (const sheetName of Object.keys(cleanedData)) cleanedData[sheetName] = cleanedData[sheetName].map((row) => {
		if (row && row.fileData) {
			const { fileData, ...rest } = row;
			return rest;
		}
		return row;
	});
	for (const [sheet, rows] of Object.entries(cleanedData)) try {
		const response = await fetch(url, {
			method: "POST",
			headers: { "Content-Type": "text/plain;charset=utf-8" },
			body: JSON.stringify({
				action: "bulkUpsert",
				sheet,
				rows
			})
		});
		if (!response.ok) throw new Error(`HTTP error ${response.status}`);
		const text = await response.text();
		let data;
		try {
			data = JSON.parse(text);
		} catch (e) {}
		if (data && data.error) throw new Error(data.error);
		sheetsWritten.push(sheet);
	} catch (err) {
		errors.push(`${sheet}: ${err instanceof Error ? err.message : String(err)}`);
	}
	return {
		success: errors.length === 0,
		sheetsWritten,
		errors
	};
}
/** Read all rows from a specific sheet tab, optionally filtered server-side
*  by an exact key/value match (avoids downloading an entire ever-growing
*  tab — e.g. FileChunks — just to find rows for one id). */
async function readSheetData(sheet, filter) {
	const result = await sheetsGet(sheet, filter);
	if (!result.success) {
		console.warn(`[GSheets] Failed to read sheet data for ${sheet}:`, result.error);
		return null;
	}
	return (result.data || []).map((row) => {
		const parsedRow = { ...row };
		for (const key of Object.keys(parsedRow)) {
			const val = parsedRow[key];
			if (typeof val === "string") {
				const trimmed = val.trim();
				if (trimmed.startsWith("[") && trimmed.endsWith("]") || trimmed.startsWith("{") && trimmed.endsWith("}")) try {
					parsedRow[key] = JSON.parse(trimmed);
				} catch (e) {}
			}
		}
		return parsedRow;
	});
}
var SHEETS = {
	CUSTOMERS: "Customers",
	EQUIPMENT: "Equipment",
	RENTALS: "Rentals",
	PAYMENTS: "Payments",
	RETURNS: "Returns",
	OWNERS: "Owners",
	DOCUMENTS: "Documents",
	EXCHANGES: "Exchanges",
	FILE_CHUNKS: "FileChunks",
	STAFF: "Staff",
	SETTINGS: "Settings"
};
/** Send OTP verification code to a user's email via GET (avoids CORS redirect issue with POST) */
async function sendOtpEmail(email, otp) {
	const url = getGSheetsUrl();
	if (!url) return {
		success: false,
		error: "No Apps Script URL configured"
	};
	try {
		const getUrl = `${url}?action=sendOtp&email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp)}`;
		const response = await fetch(getUrl, { method: "GET" });
		if (!response.ok) throw new Error(`HTTP error ${response.status}`);
		const text = await response.text();
		let data;
		try {
			data = JSON.parse(text);
		} catch {
			return { success: true };
		}
		if (data && data.error) return {
			success: false,
			error: data.error
		};
		return { success: true };
	} catch (err) {
		console.warn("[GSheets] sendOtpEmail failed:", err);
		return {
			success: false,
			error: err instanceof Error ? err.message : String(err)
		};
	}
}
/** Clear all data rows in a sheet (keeping headers) */
async function clearSheetInGSheets(sheet) {
	const res = await sheetsRequest("clearSheet", { sheet });
	return {
		success: res.success,
		error: res.error
	};
}
var data_store_exports = /* @__PURE__ */ __exportAll({
	EQUIPMENT_CATEGORIES: () => EQUIPMENT_CATEGORIES,
	PRICING_TABLE: () => PRICING_TABLE,
	approveRental: () => approveRental,
	calculateCustomerStatus: () => calculateCustomerStatus,
	cancelRental: () => cancelRental,
	cleanNum: () => cleanNum,
	dataURLtoBlob: () => dataURLtoBlob,
	deleteCustomer: () => deleteCustomer,
	deleteDocument: () => deleteDocument,
	deleteEquipment: () => deleteEquipment,
	deleteFileChunks: () => deleteFileChunks,
	deleteFileFromIndexedDB: () => deleteFileFromIndexedDB,
	deleteOwner: () => deleteOwner,
	deletePayment: () => deletePayment,
	downloadAgreementFile: () => downloadAgreementFile,
	downloadBase64File: () => downloadBase64File,
	downloadExcel: () => downloadExcel,
	downloadFile: () => downloadFile,
	downloadFileChunks: () => downloadFileChunks,
	extractIdNumber: () => extractIdNumber,
	formatDateDDMMYYYY: () => formatDateDDMMYYYY,
	getAgreementHtmlContent: () => getAgreementHtmlContent,
	getAllDataForSync: () => getAllDataForSync,
	getCompanySettings: () => getCompanySettings,
	getCustomerDueBalance: () => getCustomerDueBalance,
	getCustomers: () => getCustomers,
	getDocumentPreviewUrl: () => getDocumentPreviewUrl,
	getDocumentWithFile: () => getDocumentWithFile,
	getDocuments: () => getDocuments,
	getDynamicKPIs: () => getDynamicKPIs,
	getEquipment: () => getEquipment,
	getExchanges: () => getExchanges,
	getFileFromIndexedDB: () => getFileFromIndexedDB,
	getLocalYYYYMMDD: () => getLocalYYYYMMDD,
	getNextAgreementNumber: () => getNextAgreementNumber,
	getNextCustomerNumber: () => getNextCustomerNumber,
	getNextDocumentNumber: () => getNextDocumentNumber,
	getNextEquipmentNumber: () => getNextEquipmentNumber,
	getNextExchangeNumber: () => getNextExchangeNumber,
	getNextOwnerNumber: () => getNextOwnerNumber,
	getNextPaymentNumber: () => getNextPaymentNumber,
	getNextReturnNumber: () => getNextReturnNumber,
	getOwners: () => getOwners,
	getPaidForEquipment: () => getPaidForEquipment,
	getPayments: () => getPayments,
	getPricingTableRate: () => getPricingTableRate,
	getRentals: () => getRentals,
	getReturnCalculatedRentPerItem: () => getReturnCalculatedRentPerItem,
	getReturnReceiptHtmlContent: () => getReturnReceiptHtmlContent,
	getReturns: () => getReturns,
	parseLocalDate: () => parseLocalDate,
	peekNextAgreementNumber: () => peekNextAgreementNumber,
	peekNextExchangeNumber: () => peekNextExchangeNumber,
	peekNextReturnNumber: () => peekNextReturnNumber,
	printAgreement: () => printAgreement,
	printDocumentFile: () => printDocumentFile,
	printReceipt: () => printReceipt,
	printReturnReceipt: () => printReturnReceipt,
	saveCompanySettings: () => saveCompanySettings,
	saveCustomer: () => saveCustomer,
	saveDocument: () => saveDocument,
	saveEquipment: () => saveEquipment,
	saveExchange: () => saveExchange,
	saveOwner: () => saveOwner,
	savePayment: () => savePayment,
	saveRental: () => saveRental,
	saveReturn: () => saveReturn,
	setFileInIndexedDB: () => setFileInIndexedDB,
	sortLatestFirst: () => sortLatestFirst,
	syncFromSheetsToLocalStorage: () => syncFromSheetsToLocalStorage,
	syncMissingFileChunks: () => syncMissingFileChunks,
	uploadFileChunks: () => uploadFileChunks,
	useDatabaseTrigger: () => useDatabaseTrigger
});
var isBrowser = typeof window !== "undefined";
if (isBrowser && localStorage.getItem("medirent-db-cleared-v9") !== "true") {
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
	if (_preservedStaffUsers) localStorage.setItem("medirent-staff-users", _preservedStaffUsers);
	localStorage.setItem("medirent-db-cleared-v9", "true");
}
if (isBrowser) {
	const existingStaff = localStorage.getItem("medirent-staff-users");
	let staffList = [];
	if (existingStaff) try {
		staffList = JSON.parse(existingStaff);
		if (!Array.isArray(staffList)) staffList = [];
	} catch (_) {
		staffList = [];
	}
	const defaultAdmin = {
		id: "1",
		name: "Relife Admin",
		email: "relifemedicaltechnologies.mys@gmail.com",
		passwordHash: "2d8b2a1ff89a8b02e74a88a7fba7304e1724aa45324dd82ce7da2f9d4d3b0cec",
		role: "Admin",
		firstAdmin: true
	};
	const oldIdx = staffList.findIndex((u) => u.email === "g.avinash10005@gmail.com" || u.id === "1" || u.firstAdmin);
	if (oldIdx > -1) staffList[oldIdx] = defaultAdmin;
	else if (!staffList.some((u) => u.email.toLowerCase() === defaultAdmin.email)) staffList.unshift(defaultAdmin);
	localStorage.setItem("medirent-staff-users", JSON.stringify(staffList));
	localStorage.setItem("medirent-setup-done", "true");
}
if (isBrowser) try {
	const _rawRentals = localStorage.getItem("medirent-rentals");
	if (_rawRentals) {
		const _rentals = JSON.parse(_rawRentals);
		const _today = /* @__PURE__ */ new Date();
		_today.setHours(0, 0, 0, 0);
		let _changed = false;
		_rentals.forEach((r) => {
			if (r.status === "Active" && r.end) {
				const _end = new Date(r.end);
				_end.setHours(0, 0, 0, 0);
				if (!isNaN(_end.getTime()) && _end < _today) {
					r.status = "Overdue";
					_changed = true;
				}
			}
		});
		if (_changed) localStorage.setItem("medirent-rentals", JSON.stringify(_rentals));
	}
} catch (_e) {}
/**
* Formats a date string (ISO, YYYY-MM-DD, or already DD-MM-YYYY) to DD-MM-YYYY.
* Returns the original string if parsing fails.
*/
function formatDateDDMMYYYY(dateStr) {
	if (!dateStr) return "—";
	if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) return dateStr;
	if (dateStr.includes("T")) {
		const d = new Date(dateStr);
		if (!isNaN(d.getTime())) return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
	}
	const parts = dateStr.split("T")[0].split(/[-/]/);
	if (parts.length === 3) {
		if (parts[0].length === 4) {
			const [year, month, day] = parts;
			return `${day.padStart(2, "0")}-${month.padStart(2, "0")}-${year}`;
		}
	}
	const d = new Date(dateStr);
	if (isNaN(d.getTime())) return dateStr;
	return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
}
/**
* Returns a date formatted as YYYY-MM-DD in the local timezone.
*/
function getLocalYYYYMMDD(dateInput = /* @__PURE__ */ new Date()) {
	if (typeof dateInput === "string") {
		const trimmed = dateInput.trim();
		if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
		const d = new Date(trimmed);
		if (!isNaN(d.getTime())) return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
		return trimmed.split("T")[0];
	}
	return `${dateInput.getFullYear()}-${String(dateInput.getMonth() + 1).padStart(2, "0")}-${String(dateInput.getDate()).padStart(2, "0")}`;
}
/**
* Timezone-safe date parser for YYYY-MM-DD strings.
* Using `new Date("2026-01-01")` parses as UTC midnight, which in IST (UTC+5:30)
* becomes Dec 31, 2025 18:30 — causing off-by-one-day bugs.
* This function uses the local Date constructor to avoid that.
*/
function parseLocalDate(dateStr) {
	if (!dateStr) return /* @__PURE__ */ new Date(NaN);
	if (typeof dateStr === "string" && dateStr.includes("T")) {
		const d = new Date(dateStr);
		if (!isNaN(d.getTime())) return new Date(d.getFullYear(), d.getMonth(), d.getDate());
	}
	const cleaned = dateStr.split("T")[0].trim();
	const parts = cleaned.split(/[-/]/);
	if (parts.length === 3) {
		let y = parseInt(parts[0], 10);
		let m = parseInt(parts[1], 10) - 1;
		let d = parseInt(parts[2], 10);
		if (parts[2].length === 4) {
			y = parseInt(parts[2], 10);
			d = parseInt(parts[0], 10);
		}
		if (!isNaN(y) && !isNaN(m) && !isNaN(d)) return new Date(y, m, d);
	}
	return new Date(cleaned);
}
var EQUIPMENT_CATEGORIES = [
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
	"Patient Ventilator"
];
function extractIdNumber(idStr) {
	if (!idStr) return 0;
	const matches = idStr.match(/\d+/g);
	if (!matches) return 0;
	return parseInt(matches.join(""), 10);
}
function sortLatestFirst(list, dateField) {
	if (!Array.isArray(list)) return [];
	return [...list].sort((a, b) => {
		const idA = a?.id || a?.agreementId || a?.rentalId || "";
		const idB = b?.id || b?.agreementId || b?.rentalId || "";
		const numA = extractIdNumber(idA);
		const numB = extractIdNumber(idB);
		if (numA !== numB) return numB - numA;
		if (dateField && a?.[dateField] && b?.[dateField]) {
			const dateA = parseLocalDate(a[dateField]).getTime();
			const dateB = parseLocalDate(b[dateField]).getTime();
			if (!isNaN(dateA) && !isNaN(dateB) && dateA !== dateB) return dateB - dateA;
		}
		return (idB || "").localeCompare(idA || "");
	});
}
/**
* Returns the next sequential agreement number in AGR-YYYY-XXXX format.
* Counter resets per calendar year and is persisted in localStorage.
*/
function getNextAgreementNumber() {
	if (!isBrowser) return `AGR-${(/* @__PURE__ */ new Date()).getFullYear()}-0001`;
	const year = (/* @__PURE__ */ new Date()).getFullYear();
	const key = `medirent-agr-counter-${year}`;
	const rentals = getRentals();
	const yearPrefix = `AGR-${year}-`;
	let maxIdNum = 0;
	rentals.forEach((r) => {
		if (r.id && r.id.startsWith(yearPrefix)) {
			const parts = r.id.split("-");
			const num = parseInt(parts[parts.length - 1], 10);
			if (!isNaN(num) && num > maxIdNum) maxIdNum = num;
		}
	});
	const next = maxIdNum + 1;
	localStorage.setItem(key, next.toString());
	return `AGR-${year}-${String(next).padStart(4, "0")}`;
}
/** Returns the next agreement ID for display only — does NOT increment the counter.
*  Use this in form initial state (useState), call getNextAgreementNumber() only on actual save.
*/
function peekNextAgreementNumber() {
	if (!isBrowser) return `AGR-${(/* @__PURE__ */ new Date()).getFullYear()}-0001`;
	const year = (/* @__PURE__ */ new Date()).getFullYear();
	const rentals = getRentals();
	const yearPrefix = `AGR-${year}-`;
	let maxIdNum = 0;
	rentals.forEach((r) => {
		if (r.id && r.id.startsWith(yearPrefix)) {
			const parts = r.id.split("-");
			const num = parseInt(parts[parts.length - 1], 10);
			if (!isNaN(num) && num > maxIdNum) maxIdNum = num;
		}
	});
	return `AGR-${year}-${String(maxIdNum + 1).padStart(4, "0")}`;
}
function getNextReturnNumber() {
	if (!isBrowser) return "RET-0001";
	const key = "medirent-ret-counter";
	const returns = getStorageItem("medirent-returns", []);
	let maxIdNum = parseInt(localStorage.getItem(key) || "0", 10);
	returns.forEach((r) => {
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
function peekNextReturnNumber() {
	if (!isBrowser) return "RET-0001";
	const key = "medirent-ret-counter";
	const returns = getStorageItem("medirent-returns", []);
	let maxIdNum = parseInt(localStorage.getItem(key) || "0", 10);
	returns.forEach((r) => {
		if (r.id && r.id.startsWith("RET-")) {
			const parts = r.id.split("-");
			const num = parseInt(parts[parts.length - 1], 10);
			if (!isNaN(num) && num > maxIdNum) maxIdNum = num;
		}
	});
	return `RET-${String(maxIdNum + 1).padStart(4, "0")}`;
}
function getNextPaymentNumber() {
	if (!isBrowser) return "PAY-0001";
	const key = "medirent-pay-counter";
	const payments = getStorageItem("medirent-payments", []);
	let maxIdNum = parseInt(localStorage.getItem(key) || "0", 10);
	payments.forEach((p) => {
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
function getNextCustomerNumber() {
	if (!isBrowser) return "CUS-0001";
	const key = "medirent-cus-counter";
	const customers = getStorageItem("medirent-customers", []);
	let maxIdNum = parseInt(localStorage.getItem(key) || "0", 10);
	customers.forEach((c) => {
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
function getNextDocumentNumber() {
	if (!isBrowser) return "DOC-0001";
	return `DOC-${Date.now()}-${Math.floor(Math.random() * 1e3)}`;
}
function getNextOwnerNumber() {
	if (!isBrowser) return "OWN-0001";
	const key = "medirent-own-counter";
	const owners = getStorageItem("medirent-owners", []);
	let maxIdNum = parseInt(localStorage.getItem(key) || "0", 10);
	owners.forEach((o) => {
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
function getNextEquipmentNumber(category) {
	const prefix = (category || "EQ").substring(0, 3).toUpperCase().trim();
	if (!isBrowser) return `EQ-${prefix}-0001`;
	const key = `medirent-eq-counter-${prefix}`;
	const next = parseInt(localStorage.getItem(key) || "0", 10) + 1;
	localStorage.setItem(key, next.toString());
	return `EQ-${prefix}-${String(next).padStart(4, "0")}`;
}
function getStorageItem(key, initialData) {
	if (!isBrowser) return initialData;
	const data = localStorage.getItem(key);
	if (!data) {
		localStorage.setItem(key, JSON.stringify(initialData));
		return initialData;
	}
	try {
		return JSON.parse(data);
	} catch {
		return initialData;
	}
}
function setStorageItem(key, data) {
	if (isBrowser) {
		localStorage.setItem(key, JSON.stringify(data));
		if (key !== "medirent-last-write-time" && key !== "medirent-gsheets-url") {
			localStorage.setItem("medirent-last-write-time", Date.now().toString());
			window.dispatchEvent(new Event("medirent-db-updated"));
		}
	}
}
function calculateCustomerStatus(customer, rentalsList) {
	const customerRentals = rentalsList.filter((r) => r.customerId === customer.id);
	const hasOverdue = customerRentals.some((r) => r.status === "Overdue");
	const hasActive = customerRentals.some((r) => r.status === "Active");
	const hasCompleted = customerRentals.some((r) => r.status === "Completed");
	if (hasOverdue) return "Overdue";
	if (hasActive) return "Active";
	if (hasCompleted) return "Active";
	if (customer.aadhaar || customer.pan) return "Active";
	return "Pending";
}
function getCustomers() {
	const list = getStorageItem("medirent-customers", customers);
	if (typeof window === "undefined") return sortLatestFirst(list);
	const rentalsList = getRentals();
	let changed = false;
	const updatedList = list.map((c) => {
		const activeRentalsCount = rentalsList.filter((r) => r.customerId === c.id && (r.status === "Active" || r.status === "Overdue")).length;
		const status = calculateCustomerStatus(c, rentalsList);
		if (c.rentals !== activeRentalsCount || c.status !== status) {
			c.rentals = activeRentalsCount;
			c.status = status;
			changed = true;
		}
		return c;
	});
	if (changed) localStorage.setItem("medirent-customers", JSON.stringify(updatedList));
	return sortLatestFirst(updatedList);
}
function saveCustomer(customer) {
	const list = getCustomers();
	const index = list.findIndex((c) => c.id === customer.id);
	if (index > -1) list[index] = customer;
	else list.unshift(customer);
	setStorageItem("medirent-customers", list);
	if (isGSheetsEnabled()) syncRowToSheet(SHEETS.CUSTOMERS, customer);
	return list;
}
function deleteCustomer(id) {
	const list = getCustomers().filter((c) => c.id !== id);
	setStorageItem("medirent-customers", list);
	if (isGSheetsEnabled()) deleteRowFromSheet(SHEETS.CUSTOMERS, id);
	return list;
}
function getEquipment() {
	const list = getStorageItem("medirent-equipment", equipment);
	if (typeof window === "undefined") return sortLatestFirst(list, "purchaseDate");
	const rentalsList = getRentals();
	let changed = false;
	const normalizedList = list.map((item) => {
		const isCurrentlyRented = rentalsList.some((r) => {
			if (r.status !== "Active" && r.status !== "Overdue") return false;
			if (r.equipmentItems && r.equipmentItems.length > 0) return r.equipmentItems.some((ei) => ei.equipmentId === item.id && !ei.returned);
			return (r.equipmentId || "").split(",").map((s) => s.trim()).filter(Boolean).includes(item.id);
		});
		let targetStatus = item.status;
		if (isCurrentlyRented) targetStatus = "Rented";
		else if (item.status === "Rented") targetStatus = "Available";
		if (item.status !== targetStatus) {
			item.status = targetStatus;
			changed = true;
		}
		return item;
	});
	if (changed) localStorage.setItem("medirent-equipment", JSON.stringify(normalizedList));
	return sortLatestFirst(normalizedList, "purchaseDate");
}
function saveEquipment(item) {
	if (!item.status) item.status = "Available";
	const list = getStorageItem("medirent-equipment", equipment);
	const index = list.findIndex((e) => e.id === item.id);
	if (index > -1) list[index] = item;
	else list.unshift(item);
	setStorageItem("medirent-equipment", list);
	if (isGSheetsEnabled()) syncRowToSheet(SHEETS.EQUIPMENT, item);
	return list;
}
function deleteEquipment(id) {
	const list = getStorageItem("medirent-equipment", equipment).filter((e) => e.id !== id);
	setStorageItem("medirent-equipment", list);
	if (isGSheetsEnabled()) deleteRowFromSheet(SHEETS.EQUIPMENT, id);
	return list;
}
var initialOwners = [];
function getOwners() {
	const list = getStorageItem("medirent-owners", initialOwners);
	const eqList = getStorageItem("medirent-equipment", equipment);
	let changed = false;
	const updatedList = list.map((o) => {
		const correctStatus = eqList.filter((e) => e.owner?.toLowerCase() === o.name.toLowerCase()).some((e) => e.status === "Rented") ? "Active" : "Inactive";
		if (o.status !== correctStatus) {
			o.status = correctStatus;
			changed = true;
		}
		return o;
	});
	if (changed) localStorage.setItem("medirent-owners", JSON.stringify(updatedList));
	return sortLatestFirst(updatedList);
}
function saveOwner(owner) {
	const list = getOwners();
	const index = list.findIndex((o) => o.id === owner.id);
	if (index > -1) list[index] = owner;
	else list.unshift(owner);
	setStorageItem("medirent-owners", list);
	if (isGSheetsEnabled()) syncRowToSheet(SHEETS.OWNERS, owner);
	return list;
}
function deleteOwner(id) {
	const list = getOwners().filter((o) => o.id !== id);
	setStorageItem("medirent-owners", list);
	if (isGSheetsEnabled()) deleteRowFromSheet(SHEETS.OWNERS, id);
	return list;
}
var DB_NAME = "medirent-files-db";
var DB_VERSION = 1;
var STORE_NAME = "files";
function getDB() {
	return new Promise((resolve, reject) => {
		if (typeof window === "undefined" || !window.indexedDB) {
			reject(/* @__PURE__ */ new Error("IndexedDB not supported in this environment"));
			return;
		}
		const request = indexedDB.open(DB_NAME, DB_VERSION);
		request.onupgradeneeded = (e) => {
			const db = request.result;
			if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
		};
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}
function setFileInIndexedDB(id, fileData) {
	if (typeof window === "undefined" || !window.indexedDB) return Promise.resolve();
	return getDB().then((db) => {
		return new Promise((resolve, reject) => {
			const request = db.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME).put(fileData, id);
			request.onsuccess = () => resolve();
			request.onerror = () => reject(request.error);
		});
	});
}
function getFileFromIndexedDB(id) {
	if (typeof window === "undefined" || !window.indexedDB) return Promise.resolve(void 0);
	return getDB().then((db) => {
		return new Promise((resolve, reject) => {
			const request = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(id);
			request.onsuccess = () => resolve(request.result);
			request.onerror = () => reject(request.error);
		});
	}).catch(() => void 0);
}
function deleteFileFromIndexedDB(id) {
	if (typeof window === "undefined" || !window.indexedDB) return Promise.resolve();
	return getDB().then((db) => {
		return new Promise((resolve, reject) => {
			const request = db.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME).delete(id);
			request.onsuccess = () => resolve();
			request.onerror = () => reject(request.error);
		});
	}).catch(() => {});
}
async function getDocumentWithFile(doc) {
	if (doc.fileData) return doc;
	const localFileData = await getFileFromIndexedDB(doc.id);
	if (localFileData) return {
		...doc,
		fileData: localFileData
	};
	if (isGSheetsEnabled()) try {
		const remoteFileData = await downloadFileChunks(doc.id);
		if (remoteFileData) {
			await setFileInIndexedDB(doc.id, remoteFileData);
			return {
				...doc,
				fileData: remoteFileData
			};
		}
	} catch (e) {
		console.warn(`[GSheets] Failed to download file chunks for ${doc.id}:`, e);
	}
	return {
		...doc,
		fileData: "NOT_FOUND"
	};
}
var initialDocs = [];
function getDocuments() {
	let list = getStorageItem("medirent-documents", initialDocs);
	const testQrDoc = list.find((d) => d.name === "QR_Code_741852.png");
	if (testQrDoc) {
		list = list.filter((d) => d.name !== "QR_Code_741852.png");
		setStorageItem("medirent-documents", list);
		deleteFileFromIndexedDB(testQrDoc.id);
	}
	let modified = false;
	list = list.map((doc) => {
		if (doc.type === "Location Tag" && (doc.name === "Location_Tag_.txt" || doc.name.includes("undefined") || !doc.rentalId)) {
			const rental = getStorageItem("medirent-rentals", []).find((r) => r.customerId === doc.customerId);
			if (rental) {
				doc.rentalId = rental.id;
				doc.name = `Location_Tag_${rental.id}.txt`;
				modified = true;
			}
		}
		if (doc.type === "Delivery Photo" && (doc.name === "Delivery_Photo_.jpg" || doc.name.includes("undefined") || !doc.rentalId)) {
			const rental = getStorageItem("medirent-rentals", []).find((r) => r.customerId === doc.customerId);
			if (rental) {
				doc.rentalId = rental.id;
				doc.name = `Delivery_Photo_${rental.id}.jpg`;
				modified = true;
			}
		}
		if (doc.fileData) {
			setFileInIndexedDB(doc.id, doc.fileData);
			delete doc.fileData;
			modified = true;
		}
		return doc;
	});
	if (modified) localStorage.setItem("medirent-documents", JSON.stringify(list));
	return sortLatestFirst(list, "date");
}
var CHUNK_SIZE = 45e3;
async function uploadFileChunks(fileId, fileData) {
	if (!isGSheetsEnabled()) return false;
	const totalChunks = Math.ceil(fileData.length / CHUNK_SIZE);
	try {
		for (let i = 0; i < totalChunks; i++) {
			const chunkData = fileData.substring(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
			const chunkRow = {
				id: `${fileId}_chunk_${i}`,
				fileId,
				chunkIndex: i,
				totalChunks,
				chunkData
			};
			let uploaded = false;
			for (let attempt = 0; attempt < 3 && !uploaded; attempt++) uploaded = (await sheetsRequest("upsert", {
				sheet: SHEETS.FILE_CHUNKS,
				row: chunkRow
			})).success;
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
async function downloadFileChunks(fileId) {
	if (!isGSheetsEnabled()) return null;
	const chunksData = await readSheetData(SHEETS.FILE_CHUNKS, {
		key: "fileId",
		value: fileId
	});
	if (!chunksData) return null;
	const fileChunks = chunksData.filter((c) => c.fileId === fileId).sort((a, b) => a.chunkIndex - b.chunkIndex);
	if (fileChunks.length === 0) return null;
	const totalChunks = Number(fileChunks[0].totalChunks);
	if (!totalChunks || fileChunks.length !== totalChunks) {
		console.warn(`[GSheets] Incomplete file chunks for ${fileId}: got ${fileChunks.length}/${totalChunks || "?"}`);
		return null;
	}
	for (let i = 0; i < totalChunks; i++) if (Number(fileChunks[i].chunkIndex) !== i) {
		console.warn(`[GSheets] Missing chunk ${i} for ${fileId}`);
		return null;
	}
	return fileChunks.map((c) => c.chunkData).join("");
}
async function deleteFileChunks(fileId) {
	if (!isGSheetsEnabled()) return;
	try {
		const chunks = await readSheetData(SHEETS.FILE_CHUNKS, {
			key: "fileId",
			value: fileId
		});
		if (chunks) {
			const fileChunks = chunks.filter((c) => c.fileId === fileId);
			for (const chunk of fileChunks) deleteRowFromSheet(SHEETS.FILE_CHUNKS, chunk.id);
		}
	} catch (e) {
		console.warn(`[GSheets] Failed to delete file chunks for ${fileId}:`, e);
	}
}
function saveDocument(doc) {
	const list = getDocuments();
	const fileData = doc.fileData;
	const metadataDoc = { ...doc };
	if (fileData) {
		setFileInIndexedDB(doc.id, fileData);
		delete metadataDoc.fileData;
	}
	const index = list.findIndex((d) => d.id === doc.id);
	if (index > -1) list[index] = metadataDoc;
	else list.unshift(metadataDoc);
	setStorageItem("medirent-documents", list);
	if (isGSheetsEnabled()) {
		syncRowToSheet(SHEETS.DOCUMENTS, metadataDoc);
		if (fileData) uploadFileChunks(doc.id, fileData);
	}
	return list;
}
/** Internal silent version — does NOT dispatch medirent-db-updated event.
*  Use when auto-creating document records inside other save functions
*  (saveRental, saveReturn) to avoid spurious re-renders. */
function saveDocumentSilent(doc) {
	const list = getDocuments();
	const fileData = doc.fileData;
	const metadataDoc = { ...doc };
	if (fileData) {
		setFileInIndexedDB(doc.id, fileData);
		delete metadataDoc.fileData;
	}
	const index = list.findIndex((d) => d.id === doc.id);
	if (index > -1) list[index] = metadataDoc;
	else list.unshift(metadataDoc);
	localStorage.setItem("medirent-documents", JSON.stringify(list));
	if (isGSheetsEnabled()) syncRowToSheet(SHEETS.DOCUMENTS, metadataDoc);
	return list;
}
function deleteDocument(id) {
	const list = getDocuments().filter((d) => d.id !== id);
	setStorageItem("medirent-documents", list);
	deleteFileFromIndexedDB(id);
	if (isGSheetsEnabled()) {
		deleteRowFromSheet(SHEETS.DOCUMENTS, id);
		deleteFileChunks(id);
	}
	return list;
}
function getRentals() {
	const list = getStorageItem("medirent-rentals", rentals);
	if (typeof window === "undefined") return sortLatestFirst(list, "start");
	let changed = false;
	const returnsList = getReturns();
	const healedList = list.map((r) => {
		let rentalChanged = false;
		let updatedItems = r.equipmentItems || [];
		if (updatedItems.length === 0 && r.equipmentId) {
			const ids = r.equipmentId.split(",").map((s) => s.trim()).filter(Boolean);
			const serials = (r.serial || "").split(",").map((s) => s.trim()).filter(Boolean);
			updatedItems = ids.map((id, idx) => ({
				equipmentId: id,
				serial: serials[idx] || "XXXX",
				monthlyRent: cleanNum(r.monthlyRent) / ids.length,
				deposit: cleanNum(r.deposit) / ids.length,
				returned: false
			}));
			rentalChanged = true;
		}
		const agreementReturns = returnsList.filter((ret) => ret.agreement === r.id);
		const allReturnedIds = new Set(agreementReturns.flatMap((ret) => ret.returnedEquipmentIds || []));
		const mappedItems = updatedItems.map((item) => {
			if (allReturnedIds.has(item.equipmentId) && !item.returned) {
				rentalChanged = true;
				return {
					...item,
					returned: true
				};
			}
			return item;
		});
		if (rentalChanged) {
			changed = true;
			const allReturned = mappedItems.every((item) => item.returned);
			const activeItems = mappedItems.filter((item) => !item.returned);
			const newStatus = allReturned ? "Completed" : r.status;
			const newEquipmentId = activeItems.map((item) => item.equipmentId).join(", ");
			const newSerial = activeItems.map((item) => item.serial).join(", ");
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
	if (changed) {
		localStorage.setItem("medirent-rentals", JSON.stringify(healedList));
		return sortLatestFirst(healedList, "start");
	}
	return sortLatestFirst(list, "start");
}
function saveRental(rental) {
	const list = getRentals();
	const index = list.findIndex((r) => r.id === rental.id);
	if (index > -1) {
		const oldRental = list[index];
		if (oldRental.equipmentId) {
			const oldIds = oldRental.equipmentId.split(",").map((s) => s.trim()).filter(Boolean);
			const newIds = (rental.equipmentId || "").split(",").map((s) => s.trim()).filter(Boolean);
			oldIds.forEach((id) => {
				if (!newIds.includes(id)) updateEquipmentStatus(id, "Available");
			});
		}
		list[index] = rental;
	} else list.unshift(rental);
	setStorageItem("medirent-rentals", list);
	if ((rental.status === "Active" || rental.status === "Overdue" || rental.status === "Pending Approval") && rental.equipmentId) rental.equipmentId.split(",").map((s) => s.trim()).filter(Boolean).forEach((id) => {
		updateEquipmentStatus(id, "Rented");
	});
	updateCustomerRentalsCount(rental.customerId);
	const eqListForOwner = getEquipment();
	const affectedOwners = /* @__PURE__ */ new Set();
	(rental.equipmentId || "").split(",").map((s) => s.trim()).filter(Boolean).forEach((id) => {
		const eq = eqListForOwner.find((e) => e.id === id);
		if (eq?.owner) affectedOwners.add(eq.owner);
	});
	affectedOwners.forEach((ownerName) => updateOwnerStatusByEquipment(ownerName));
	if (!getDocuments().some((d) => d.id === `doc-agr-${rental.id}`)) saveDocumentSilent({
		id: `doc-agr-${rental.id}`,
		name: `Agreement ${rental.id}.pdf`,
		type: "Agreement",
		size: "320 KB",
		date: (/* @__PURE__ */ new Date()).toLocaleDateString("en-IN", {
			day: "2-digit",
			month: "short",
			year: "numeric"
		}),
		rentalId: rental.id,
		customerId: rental.customerId
	});
	if (isGSheetsEnabled()) syncRowToSheet(SHEETS.RENTALS, rental);
	return list;
}
function cancelRental(id) {
	const list = getRentals();
	const index = list.findIndex((r) => r.id === id);
	if (index > -1) {
		const rental = list[index];
		rental.status = "Cancelled";
		setStorageItem("medirent-rentals", list);
		if (rental.equipmentId) rental.equipmentId.split(",").map((s) => s.trim()).filter(Boolean).forEach((eqId) => {
			updateEquipmentStatus(eqId, "Available");
		});
		updateCustomerRentalsCount(rental.customerId);
		const eqListCancel = getEquipment();
		const cancelOwners = /* @__PURE__ */ new Set();
		(rental.equipmentId || "").split(",").map((s) => s.trim()).filter(Boolean).forEach((id) => {
			const eq = eqListCancel.find((e) => e.id === id);
			if (eq?.owner) cancelOwners.add(eq.owner);
		});
		cancelOwners.forEach((ownerName) => updateOwnerStatusByEquipment(ownerName));
		if (isGSheetsEnabled()) syncRowToSheet(SHEETS.RENTALS, rental);
	}
	return list;
}
function approveRental(id) {
	const list = getRentals();
	const index = list.findIndex((r) => r.id === id);
	if (index > -1) {
		const rental = list[index];
		const today = /* @__PURE__ */ new Date();
		today.setHours(0, 0, 0, 0);
		const end = rental.end ? new Date(rental.end) : null;
		if (end && !isNaN(end.getTime()) && end < today) rental.status = "Overdue";
		else rental.status = "Active";
		setStorageItem("medirent-rentals", list);
		if (isGSheetsEnabled()) syncRowToSheet(SHEETS.RENTALS, rental);
		if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("medirent-db-updated"));
	}
}
function getPayments() {
	return sortLatestFirst(getStorageItem("medirent-payments", payments), "date");
}
function savePayment(payment) {
	const list = getPayments();
	const index = list.findIndex((p) => p.id === payment.id);
	if (index > -1) list[index] = payment;
	else list.unshift(payment);
	setStorageItem("medirent-payments", list);
	if (payment.agreement && payment.type === "Rent") {
		const rentalsList = getRentals();
		const rental = rentalsList.find((r) => r.id === payment.agreement);
		if (rental && rental.status === "Overdue" && payment.status === "Paid") {
			rental.status = "Active";
			localStorage.setItem("medirent-rentals", JSON.stringify(rentalsList));
		}
	}
	if (!getDocuments().some((d) => d.id === `doc-pay-${payment.id}`)) saveDocumentSilent({
		id: `doc-pay-${payment.id}`,
		name: `${payment.type === "Deposit" ? "Receipt" : "Invoice"} ${payment.id}.pdf`,
		type: payment.type === "Deposit" ? "Receipt" : "Invoice",
		size: "112 KB",
		date: (/* @__PURE__ */ new Date()).toLocaleDateString("en-IN", {
			day: "2-digit",
			month: "short",
			year: "numeric"
		}),
		rentalId: payment.agreement,
		customerId: payment.customerId
	});
	if (isGSheetsEnabled()) syncRowToSheet(SHEETS.PAYMENTS, payment);
	return list;
}
function deletePayment(id) {
	const allPayments = getPayments();
	const deletedPayment = allPayments.find((p) => p.id === id);
	const list = allPayments.filter((p) => p.id !== id);
	setStorageItem("medirent-payments", list);
	if (deletedPayment?.customerId) updateCustomerRentalsCount(deletedPayment.customerId);
	if (isGSheetsEnabled()) deleteRowFromSheet(SHEETS.PAYMENTS, id);
	return list;
}
function getReturns() {
	const list = getStorageItem("medirent-returns", returns);
	if (typeof window === "undefined") return sortLatestFirst(list, "date");
	const payments = getPayments();
	return sortLatestFirst(list.map((ret) => {
		if (ret.refund < 0) {
			const totalCollectible = Math.abs(ret.refund);
			if (ret.duePaidAmount === void 0) {
				const paidTotal = payments.filter((p) => p.agreement === ret.agreement && p.status === "Paid" && (p.notes || "").toLowerCase().includes("return")).reduce((sum, p) => sum + (p.amount || 0), 0);
				const calcPaid = ret.duePaymentStatus === "Paid" ? totalCollectible : Math.min(totalCollectible, paidTotal);
				const calcPending = Math.max(0, totalCollectible - calcPaid);
				const calcStatus = calcPending <= 0 ? "Paid" : calcPaid > 0 ? "Partial" : "Not Paid";
				return {
					...ret,
					duePaidAmount: calcPaid,
					duePendingBalance: calcPending,
					duePaymentStatus: calcStatus
				};
			}
		}
		return ret;
	}), "date");
}
function saveReturn(ret) {
	const list = getReturns();
	const existingIdx = list.findIndex((r) => r.id === ret.id);
	if (existingIdx > -1) list[existingIdx] = ret;
	else list.unshift(ret);
	setStorageItem("medirent-returns", list);
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
		const returnedIds = ret.returnedEquipmentIds || (rental.equipmentId ? rental.equipmentId.split(",").map((s) => s.trim()).filter(Boolean) : []);
		if (rental.equipmentItems && rental.equipmentItems.length > 0) {
			const eqList = getEquipment();
			const returnedItems = rental.equipmentItems.filter((item) => returnedIds.includes(item.equipmentId));
			const remainingItems = rental.equipmentItems.filter((item) => !returnedIds.includes(item.equipmentId) && !item.returned);
			if (remainingItems.length > 0) {
				newAgreementId = getNextAgreementNumber();
				const totalRentalMonthlyRent = rental.equipmentItems.reduce((sum, it) => sum + cleanNum(it.monthlyRent || it.dailyRent || it.rentRate), 0);
				const remainingItemsRent = remainingItems.reduce((sum, it) => sum + cleanNum(it.monthlyRent || it.dailyRent || it.rentRate), 0);
				const returnedItemsRent = returnedItems.reduce((sum, it) => sum + cleanNum(it.monthlyRent || it.dailyRent || it.rentRate), 0);
				const totalRentalDeposit = rental.equipmentItems.reduce((sum, it) => sum + cleanNum(it.deposit), 0);
				const remainingItemsDeposit = remainingItems.reduce((sum, it) => sum + cleanNum(it.deposit), 0);
				const returnedItemsDeposit = returnedItems.reduce((sum, it) => sum + cleanNum(it.deposit), 0);
				const originalRentPaid = cleanNum(rental.rentPaidAmount);
				const originalDepositPaid = cleanNum(rental.depositPaidAmount);
				const remainingRentPaidShare = Math.round(originalRentPaid * (totalRentalMonthlyRent > 0 ? remainingItemsRent / totalRentalMonthlyRent : 1));
				const returnedRentPaidShare = Math.max(0, originalRentPaid - remainingRentPaidShare);
				const remainingDepositPaidShare = Math.round(originalDepositPaid * (totalRentalDeposit > 0 ? remainingItemsDeposit / totalRentalDeposit : 1));
				const returnedDepositPaidShare = Math.max(0, originalDepositPaid - remainingDepositPaidShare);
				const newRental = {
					...rental,
					id: newAgreementId,
					equipmentId: remainingItems.map((item) => item.equipmentId).join(", "),
					serial: remainingItems.map((item) => item.serial).join(", "),
					equipment: remainingItems.map((item) => eqList.find((e) => e.id === item.equipmentId)?.name || "Unknown").join(", "),
					monthlyRent: remainingItemsRent,
					deposit: remainingItemsDeposit,
					equipmentItems: remainingItems.map((item) => ({
						...item,
						returned: false
					})),
					rentPaidAmount: remainingRentPaidShare,
					depositPaidAmount: remainingDepositPaidShare,
					status: rental.status === "Overdue" ? "Overdue" : "Active"
				};
				rentalsList.unshift(newRental);
				const paymentsList = getPayments();
				let paymentsChanged = false;
				const updatedPaymentsList = paymentsList.map((p) => {
					if (p.agreement !== rental.id) return p;
					if (p.equipmentId) {
						if (remainingItems.some((item) => item.equipmentId === p.equipmentId)) {
							paymentsChanged = true;
							return {
								...p,
								agreement: newAgreementId
							};
						}
						return p;
					} else {
						paymentsChanged = true;
						const originalAmount = cleanNum(p.amount);
						const remainingShare = Math.round(originalAmount * (totalRentalMonthlyRent > 0 ? remainingItemsRent / totalRentalMonthlyRent : 1));
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
									notes: `${p.notes || ""} (Apportioned share for remaining items in agreement ${newAgreementId})`
								};
								freshPayments.unshift(newPayment);
								setStorageItem("medirent-payments", freshPayments);
							}, 0);
						}
						return {
							...p,
							amount: returnedShare,
							notes: `${p.notes || ""} (Apportioned share for returned items in agreement ${rental.id})`
						};
					}
				});
				if (paymentsChanged) localStorage.setItem("medirent-payments", JSON.stringify(updatedPaymentsList));
				rental.equipmentItems = returnedItems.map((item) => ({
					...item,
					returned: true
				}));
				rental.equipmentId = returnedItems.map((item) => item.equipmentId).join(", ");
				rental.serial = returnedItems.map((item) => item.serial).join(", ");
				rental.equipment = returnedItems.map((item) => eqList.find((e) => e.id === item.equipmentId)?.name || "Unknown").join(", ");
				rental.monthlyRent = returnedItemsRent;
				rental.deposit = returnedItemsDeposit;
				rental.rentPaidAmount = returnedRentPaidShare;
				rental.depositPaidAmount = returnedDepositPaidShare;
				rental.status = "Completed";
				rental.end = ret.date;
			} else {
				rental.equipmentItems = rental.equipmentItems.map((item) => {
					if (returnedIds.includes(item.equipmentId)) return {
						...item,
						returned: true
					};
					return item;
				});
				rental.status = "Completed";
				rental.end = ret.date;
				rental.equipmentId = "";
				rental.serial = "";
				rental.equipment = "";
				rental.monthlyRent = 0;
				rental.deposit = 0;
			}
		} else {
			rental.status = "Completed";
			rental.end = ret.date;
			rental.equipmentId = "";
			rental.equipment = "";
			rental.serial = "";
			rental.monthlyRent = 0;
			rental.deposit = 0;
		}
		if (rental.additionalItems && Array.isArray(rental.additionalItems)) rental.additionalItems = rental.additionalItems.map((item) => {
			if (item.selected && item.status === "Not Paid") return {
				...item,
				status: "Paid"
			};
			return item;
		});
		localStorage.setItem("medirent-rentals", JSON.stringify(rentalsList));
		returnedIds.forEach((eqId) => {
			updateEquipmentStatus(eqId, ret.condition === "UnderMaintenance" || ret.condition === "UnderMaintance" ? "UnderMaintenance" : "Available");
		});
		updateCustomerRentalsCount(rental.customerId);
		const eqListReturn = getEquipment();
		const returnOwners = /* @__PURE__ */ new Set();
		(ret.returnedEquipmentIds || []).forEach((id) => {
			const eq = eqListReturn.find((e) => e.id === id);
			if (eq?.owner) returnOwners.add(eq.owner);
		});
		returnOwners.forEach((ownerName) => updateOwnerStatusByEquipment(ownerName));
	}
	if (!getDocuments().some((d) => d.id === `doc-ret-${ret.id}`)) saveDocumentSilent({
		id: `doc-ret-${ret.id}`,
		name: `Return Receipt ${ret.id}.pdf`,
		type: "Receipt",
		size: "150 KB",
		date: (/* @__PURE__ */ new Date()).toLocaleDateString("en-IN", {
			day: "2-digit",
			month: "short",
			year: "numeric"
		}),
		rentalId: ret.agreement,
		customerId: rentalsList.find((r) => r.id === ret.agreement)?.customerId
	});
	if (isGSheetsEnabled()) syncRowToSheet(SHEETS.RETURNS, ret);
	return {
		list,
		newAgreementId
	};
}
function getCustomerDueBalance(customerId, customerName) {
	const returns = getReturns();
	const customerRentals = getRentals().filter((r) => r.customerId && r.customerId === customerId || r.customer && customerName && r.customer.toLowerCase() === customerName.toLowerCase());
	const customerAgrIds = new Set(customerRentals.map((r) => r.id));
	const unpaidReturns = returns.filter((ret) => ret.customerId && ret.customerId === customerId || ret.customer && customerName && ret.customer.toLowerCase() === customerName.toLowerCase() || ret.agreement && customerAgrIds.has(ret.agreement)).filter((ret) => {
		return (ret.duePendingBalance !== void 0 ? Number(ret.duePendingBalance) || 0 : ret.refund < 0 ? Math.abs(ret.refund) - Number(ret.duePaidAmount || 0) : 0) > 0 || ret.duePaymentStatus === "Not Paid" || ret.duePaymentStatus === "Partial";
	});
	const returnDues = unpaidReturns.reduce((sum, ret) => {
		const pendingDue = ret.duePendingBalance !== void 0 ? Number(ret.duePendingBalance) || 0 : ret.refund < 0 ? Math.abs(ret.refund) - Number(ret.duePaidAmount || 0) : 0;
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
function updateEquipmentStatus(eqId, status) {
	const eqList = getStorageItem("medirent-equipment", equipment);
	const eqIndex = eqList.findIndex((e) => e.id === eqId);
	if (eqIndex > -1) {
		eqList[eqIndex].status = status;
		setStorageItem("medirent-equipment", eqList);
		if (isGSheetsEnabled()) syncRowToSheet(SHEETS.EQUIPMENT, eqList[eqIndex]);
	}
}
function updateCustomerRentalsCount(custId) {
	const customersList = getCustomers();
	const rentalsList = getRentals();
	const custIndex = customersList.findIndex((c) => c.id === custId);
	if (custIndex > -1) {
		const activeRentalsCount = rentalsList.filter((r) => r.customerId === custId && (r.status === "Active" || r.status === "Overdue")).length;
		customersList[custIndex].rentals = activeRentalsCount;
		customersList[custIndex].status = calculateCustomerStatus(customersList[custIndex], rentalsList);
		localStorage.setItem("medirent-customers", JSON.stringify(customersList));
	}
}
function updateOwnerStatusByEquipment(ownerName) {
	if (!ownerName) return;
	const ownersList = getOwners();
	const ownerIndex = ownersList.findIndex((o) => o.name.toLowerCase() === ownerName.toLowerCase());
	if (ownerIndex === -1) return;
	const newStatus = getStorageItem("medirent-equipment", equipment).filter((e) => e.owner?.toLowerCase() === ownerName.toLowerCase()).some((e) => e.status === "Rented") ? "Active" : "Inactive";
	if (ownersList[ownerIndex].status !== newStatus) {
		ownersList[ownerIndex].status = newStatus;
		localStorage.setItem("medirent-owners", JSON.stringify(ownersList));
	}
}
function getDynamicKPIs() {
	const custs = getCustomers();
	const rent = getRentals();
	const equip = getEquipment();
	const pay = getPayments();
	const rets = getReturns();
	const activeAgreements = rent.filter((r) => r.status === "Active" || r.status === "Overdue").length;
	const availableEquip = equip.filter((e) => e.status === "Available" || e.status === "Inactive").length;
	const rentedEquip = equip.filter((e) => e.status === "Rented" || e.status === "Active").length;
	const now = /* @__PURE__ */ new Date();
	const curMonth = now.getMonth();
	const curYear = now.getFullYear();
	const prevMonth = curMonth === 0 ? 11 : curMonth - 1;
	const prevYear = curMonth === 0 ? curYear - 1 : curYear;
	const prevCustsCount = custs.filter((c) => {
		const customerRentals = rent.filter((r) => r.customerId === c.id);
		if (customerRentals.length === 0) return false;
		const firstRentalTime = Math.min(...customerRentals.map((r) => parseLocalDate(r.start).getTime()));
		const firstRentalDate = new Date(firstRentalTime);
		return !isNaN(firstRentalDate.getTime()) && (firstRentalDate.getFullYear() < curYear || firstRentalDate.getFullYear() === curYear && firstRentalDate.getMonth() < curMonth);
	}).length;
	const curNewCusts = custs.length - prevCustsCount;
	if (custs.length === 0) {} else if (prevCustsCount > 0) `${(curNewCusts / prevCustsCount * 100).toFixed(1)}`;
	else custs.length * 100;
	const prevActiveRentalsCount = rent.filter((r) => {
		const rDate = parseLocalDate(r.start);
		if (isNaN(rDate.getTime())) return false;
		return (rDate.getFullYear() < curYear || rDate.getFullYear() === curYear && rDate.getMonth() < curMonth) && r.status !== "Completed";
	}).length;
	if (activeAgreements === 0) {} else if (prevActiveRentalsCount > 0) `${((activeAgreements - prevActiveRentalsCount) / prevActiveRentalsCount * 100).toFixed(1)}`;
	else activeAgreements * 100;
	const curMonthReturns = rets.filter((r) => {
		const d = parseLocalDate(r.date);
		return !isNaN(d.getTime()) && d.getMonth() === curMonth && d.getFullYear() === curYear;
	}).length;
	const prevMonthReturns = rets.filter((r) => {
		const d = parseLocalDate(r.date);
		return !isNaN(d.getTime()) && d.getMonth() === prevMonth && d.getFullYear() === prevYear;
	}).length;
	if (curMonthReturns === 0) {} else if (prevMonthReturns > 0) `${((curMonthReturns - prevMonthReturns) / prevMonthReturns * 100).toFixed(1)}`;
	else curMonthReturns * 100;
	if (equip.length > 0) `${Math.round(availableEquip / equip.length * 100)}`;
	if (equip.length > 0) `${Math.round(rentedEquip / equip.length * 100)}`;
	const currentMonthRevenue = pay.filter((p) => {
		if (p.status !== "Paid") return false;
		const d = parseLocalDate(p.date);
		return !isNaN(d.getTime()) && d.getMonth() === curMonth && d.getFullYear() === curYear;
	}).reduce((sum, p) => sum + p.amount, 0);
	const prevMonthRevenue = pay.filter((p) => {
		if (p.status !== "Paid") return false;
		const d = parseLocalDate(p.date);
		return !isNaN(d.getTime()) && d.getMonth() === prevMonth && d.getFullYear() === prevYear;
	}).reduce((sum, p) => sum + p.amount, 0);
	if (currentMonthRevenue === 0) {} else if (prevMonthRevenue > 0) `${((currentMonthRevenue - prevMonthRevenue) / prevMonthRevenue * 100).toFixed(1)}`;
	const pendingPaymentsAmount = rent.filter((r) => r.status === "Overdue").reduce((sum, r) => sum + r.monthlyRent, 0);
	const prevPendingAmount = rent.filter((r) => {
		if (r.status !== "Overdue") return false;
		const rDate = parseLocalDate(r.start);
		return !isNaN(rDate.getTime()) && (rDate.getFullYear() < curYear || rDate.getFullYear() === curYear && rDate.getMonth() < curMonth);
	}).reduce((sum, r) => sum + r.monthlyRent, 0);
	if (pendingPaymentsAmount === 0) {} else if (prevPendingAmount > 0) `${((pendingPaymentsAmount - prevPendingAmount) / prevPendingAmount * 100).toFixed(1)}`;
	const securityDepositsAmount = rent.filter((r) => r.status !== "Completed").reduce((sum, r) => sum + r.deposit, 0);
	const prevSecurityDepositsAmount = rent.filter((r) => {
		const rDate = parseLocalDate(r.start);
		return !isNaN(rDate.getTime()) && (rDate.getFullYear() < curYear || rDate.getFullYear() === curYear && rDate.getMonth() < curMonth) && r.status !== "Completed";
	}).reduce((sum, r) => sum + r.deposit, 0);
	if (securityDepositsAmount === 0) {} else if (prevSecurityDepositsAmount > 0) `${((securityDepositsAmount - prevSecurityDepositsAmount) / prevSecurityDepositsAmount * 100).toFixed(1)}`;
	const curMonthAgreements = rent.filter((r) => {
		const rDate = parseLocalDate(r.start);
		return !isNaN(rDate.getTime()) && rDate.getMonth() === curMonth && rDate.getFullYear() === curYear;
	}).length;
	return [
		{
			label: "Active Rentals",
			value: activeAgreements.toString(),
			description: "Current active rental agreements"
		},
		{
			label: "Agreements Made This Month",
			value: curMonthAgreements.toString(),
			description: "New rental agreements this month"
		},
		{
			label: "Agreements Closed This Month",
			value: curMonthReturns.toString(),
			description: "Equipment returns this month"
		},
		{
			label: "Available Equipment",
			value: availableEquip.toString(),
			description: `${availableEquip} out of ${equip.length} units available`
		},
		{
			label: "Rented Equipment",
			value: rentedEquip.toString(),
			description: `${rentedEquip} out of ${equip.length} units rented`
		},
		{
			label: "Monthly Revenue",
			value: `₹${currentMonthRevenue.toLocaleString("en-IN")}`,
			description: "Payments collected this month"
		},
		{
			label: "Pending Payments",
			value: `₹${pendingPaymentsAmount.toLocaleString("en-IN")}`,
			description: `${rent.filter((r) => r.status === "Overdue").length} overdue invoices pending`
		},
		{
			label: "Security Deposits",
			value: `₹${securityDepositsAmount.toLocaleString("en-IN")}`,
			description: "Refundable deposits in escrow"
		}
	];
}
/** Collect all localStorage data for bulk Google Sheets sync */
function getAllDataForSync() {
	return {
		Customers: getCustomers(),
		Equipment: getEquipment(),
		Rentals: getRentals(),
		Payments: getPayments(),
		Returns: getReturns(),
		Owners: getOwners(),
		Documents: getDocuments(),
		Exchanges: getExchanges(),
		Staff: getStorageItem("medirent-staff-users", [])
	};
}
var defaultCompanySettings = {
	companyName: "MediRent Healthcare Pvt Ltd",
	gstin: "29ABCDE1234F1Z5",
	contactEmail: "hello@medirent.in",
	contactPhone: "+91 80 1234 5678",
	address: "No. 21, MG Road, Bengaluru 560001",
	defaultDeposit: "200",
	lateFeePerDay: "50",
	defaultRentalPeriod: "30",
	taxRate: "18",
	refundPolicy: "Full deposit refundable on undamaged equipment return within 7 days."
};
function getCompanySettings() {
	return getStorageItem("medirent-company-settings", defaultCompanySettings);
}
function saveCompanySettings(settings) {
	setStorageItem("medirent-company-settings", settings);
	if (isGSheetsEnabled()) syncRowToSheet(SHEETS.SETTINGS, {
		id: "company-settings",
		...settings
	});
}
function downloadFile(filename, content, mimeType = "text/plain") {
	if (typeof window === "undefined" || typeof document === "undefined") return;
	const blob = new Blob([content], { type: mimeType });
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
}
function downloadExcel(filename, headers, rows, colWidths) {
	if (typeof window === "undefined" || typeof document === "undefined") return;
	const xlsName = filename.endsWith(".csv") ? filename.replace(".csv", ".xls") : filename.endsWith(".xls") ? filename : filename + ".xls";
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
	rows.forEach((row) => {
		html += `\n      <tr>`;
		row.forEach((cell) => {
			const safeCell = String(cell ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
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
function downloadAgreementFile(rental) {
	printAgreement(rental);
}
function getAgreementHtmlContent(rental, isPrintMode = false, isZoomedPreview = false) {
	const origin = typeof window !== "undefined" ? window.location.origin : "";
	if (!rental) return "";
	const convertNumberToWords = (amount) => {
		if (amount <= 0 || isNaN(amount)) return "N/A";
		const ones = [
			"",
			"One",
			"Two",
			"Three",
			"Four",
			"Five",
			"Six",
			"Seven",
			"Eight",
			"Nine",
			"Ten",
			"Eleven",
			"Twelve",
			"Thirteen",
			"Fourteen",
			"Fifteen",
			"Sixteen",
			"Seventeen",
			"Eighteen",
			"Nineteen"
		];
		const tens = [
			"",
			"",
			"Twenty",
			"Thirty",
			"Forty",
			"Fifty",
			"Sixty",
			"Seventy",
			"Eighty",
			"Ninety"
		];
		function convert(n) {
			if (n < 20) return ones[n];
			if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + ones[n % 10] : "");
			if (n < 1e3) return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " and " + convert(n % 100) : "");
			if (n < 1e5) return convert(Math.floor(n / 1e3)) + " Thousand" + (n % 1e3 !== 0 ? " " + convert(n % 1e3) : "");
			if (n < 1e7) return convert(Math.floor(n / 1e5)) + " Lakh" + (n % 1e5 !== 0 ? " " + convert(n % 1e5) : "");
			return convert(Math.floor(n / 1e7)) + " Crore" + (n % 1e7 !== 0 ? " " + convert(n % 1e7) : "");
		}
		return convert(amount) + " only";
	};
	const calculateDurationBetween = (startDateStr, endDateStr) => {
		const start = new Date(startDateStr);
		const end = new Date(endDateStr);
		if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return "0 days";
		const diffTime = end.getTime() - start.getTime();
		const totalDays = Math.max(1, Math.ceil(diffTime / (1e3 * 60 * 60 * 24)));
		let months = end.getFullYear() - start.getFullYear();
		months = months * 12 + (end.getMonth() - start.getMonth());
		let days = end.getDate() - start.getDate();
		if (days < 0) {
			months--;
			const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
			days += prevMonth.getDate();
		}
		if (months > 0 && days > 0) return `${months} month${months > 1 ? "s" : ""} and ${days} day${days > 1 ? "s" : ""}`;
		else if (months > 0) return `${months} month${months > 1 ? "s" : ""}`;
		else return `${totalDays} day${totalDays !== 1 ? "s" : ""}`;
	};
	const calculateRentForDuration = (startDateStr, endDateStr, monthlyRent, dailyRent) => {
		const start = new Date(startDateStr);
		const end = new Date(endDateStr);
		if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return 0;
		const diffTime = end.getTime() - start.getTime();
		const daysUsed = Math.max(1, Math.ceil(diffTime / (1e3 * 60 * 60 * 24)));
		if (rental.equipmentItems && rental.equipmentItems.length > 0) return rental.equipmentItems.reduce((sum, item) => {
			if (!(cleanNum(item.monthlyRent) > 0)) return sum + daysUsed * cleanNum(item.dailyRent || item.rentRate);
			else return sum + getReturnCalculatedRentPerItem(item.monthlyRent, daysUsed, startDateStr, endDateStr);
		}, 0);
		if (!(monthlyRent > 0)) return daysUsed * dailyRent;
		return getReturnCalculatedRentPerItem(monthlyRent, daysUsed, startDateStr, endDateStr);
	};
	const customerObj = getCustomers().find((c) => c.id === rental.customerId);
	const customerName = rental.customer || customerObj?.name || "Valued Customer";
	const customerAddress = customerObj?.address || "No address on file";
	const customerArea = customerObj?.area || "";
	const customerCity = customerObj?.city || "Mysore";
	const customerState = customerObj?.state || "Karnataka";
	const customerPincode = customerObj?.pincode || "";
	const customerPhone = customerObj?.phone || "N/A";
	const customerAltPhone = customerObj?.altPhone || "";
	customerObj?.email;
	const formattedStartDate = rental.start ? formatDateDDMMYYYY(rental.start) : "N/A";
	let finalEquipRows = "";
	if (rental.equipmentItems && rental.equipmentItems.length > 0) {
		const eqList = getEquipment();
		finalEquipRows = rental.equipmentItems.map((item) => {
			const eqObj = eqList.find((e) => e.id === item.equipmentId);
			const name = eqObj?.name || item.name || "Equipment";
			const model = eqObj?.model || "Standard";
			const serial = item.serial || eqObj?.serial || "XXXX";
			return `
         <tr>
          <td style="padding: 6px 10px; font-weight: bold;">${name}</td>
          <td style="padding: 6px 10px; text-align: center; font-weight: bold; color: ${item.returned ? "#dc2626" : "#059669"};">${item.returned ? "NO (Returned)" : "YES"}</td>
          <td style="padding: 6px 10px;">${model}</td>
          <td style="padding: 6px 10px; font-family: monospace;">${serial}</td>
          <td style="padding: 6px 10px;"></td>
          <td style="padding: 6px 10px;"></td>
        </tr>
      `;
		}).join("");
	} else {
		const hiredEquipments = [
			{
				name: "Oxygen Concentrator",
				key: "oxygen"
			},
			{
				name: "Bipap",
				key: "bipap"
			},
			{
				name: "Auto Cpap",
				key: "cpap"
			},
			{
				name: "Patient Monitor",
				key: "monitor"
			},
			{
				name: "Surgical Cot",
				key: "cot"
			},
			{
				name: "Wheel Chair",
				key: "chair"
			}
		].filter((eq) => rental.equipment.toLowerCase().includes(eq.key));
		if (hiredEquipments.length > 0) finalEquipRows = hiredEquipments.map((eq) => `
        <tr>
          <td style="padding: 6px 10px;">${eq.name}</td>
          <td style="padding: 6px 10px; text-align: center; font-weight: bold; color: #059669;">YES</td>
          <td style="padding: 6px 10px;">${rental.model || "BMC-D"}</td>
          <td style="padding: 6px 10px; font-family: monospace;">${rental.serial || "XXXX"}</td>
          <td style="padding: 6px 10px;"></td>
          <td style="padding: 6px 10px;"></td>
        </tr>
      `).join("");
		else finalEquipRows = `
        <tr>
          <td style="padding: 6px 10px; font-weight: bold;">${rental.equipment}</td>
          <td style="padding: 6px 10px; text-align: center; font-weight: bold; color: #059669;">YES</td>
          <td style="padding: 6px 10px;">${rental.model || "Standard"}</td>
          <td style="padding: 6px 10px; font-family: monospace;">${rental.serial || "XXXX"}</td>
          <td style="padding: 6px 10px;"></td>
          <td style="padding: 6px 10px;"></td>
        </tr>
      `;
	}
	const isMonthly = rental.monthlyRent > 0;
	const rentVal = isMonthly ? rental.monthlyRent || 0 : rental.dailyRent || 0;
	const rentLabel = isMonthly ? "Monthly Rent Rate" : "Daily Rent Rate";
	convertNumberToWords(rentVal);
	const depositVal = rental.deposit || 0;
	convertNumberToWords(depositVal);
	let rentPaid = 0;
	if (rental.rentalPaymentStatus === "Paid") rentPaid = rentVal;
	else if (rental.rentalPaymentStatus === "Partial") rentPaid = Number(rental.rentPaidAmount) || 0;
	let upfrontDepositPaid = 0;
	if (rental.depositPaymentStatus === "Paid") upfrontDepositPaid = depositVal;
	else if (rental.depositPaymentStatus === "Partial") upfrontDepositPaid = Number(rental.depositPaidAmount) || 0;
	const selectedAddons = (rental.additionalItems || []).filter((item) => item.selected);
	let totalDue = depositVal + rentVal;
	let totalPaid = upfrontDepositPaid + rentPaid;
	selectedAddons.forEach((item) => {
		if (item.status !== "Free of Cost") totalDue += Number(item.amount) || 0;
		if (item.status === "Paid") totalPaid += Number(item.amount) || 0;
	});
	const balanceDue = totalDue - totalPaid;
	const totalDueWords = convertNumberToWords(totalDue);
	const totalPaidWords = convertNumberToWords(totalPaid);
	const balanceDueWords = convertNumberToWords(balanceDue);
	let tableRowsHtml = `
    <tr>
      <td style="font-weight: bold;">${rentLabel}</td>
      <td style="text-align: right;">Rs. ${rentVal.toLocaleString("en-IN")}</td>
      <td style="text-align: right;">Rs. ${rentPaid.toLocaleString("en-IN")}</td>
      <td>Status: <strong>${rental.rentalPaymentStatus || "Not Paid"}</strong></td>
    </tr>
    <tr>
      <td style="font-weight: bold;">Security Deposit</td>
      <td style="text-align: right;">Rs. ${depositVal.toLocaleString("en-IN")}</td>
      <td style="text-align: right;">Rs. ${upfrontDepositPaid.toLocaleString("en-IN")}</td>
      <td>Status: <strong>${rental.depositPaymentStatus || "Not Paid"}</strong></td>
    </tr>
  `;
	selectedAddons.forEach((item) => {
		const itemDue = item.status === "Free of Cost" ? 0 : item.amount;
		const itemPaid = item.status === "Paid" ? item.amount : 0;
		tableRowsHtml += `
      <tr>
        <td style="font-weight: bold;">${item.name}</td>
        <td style="text-align: right;">Rs. ${itemDue.toLocaleString("en-IN")}</td>
        <td style="text-align: right;">Rs. ${itemPaid.toLocaleString("en-IN")}</td>
        <td>Status: <strong>${item.status || "Not Paid"}</strong></td>
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
    <tr style="font-weight: bold; ${balanceDue > 0 ? "background-color: #fef2f2; color: #b91c1c;" : "background-color: #f0fdf4; color: #15803d;"}">
      <td style="font-weight: bold;">Remaining Balance Due</td>
      <td colspan="2" style="text-align: right; padding-right: 35px;">Rs. ${balanceDue.toLocaleString("en-IN")}</td>
      <td style="font-weight: normal; font-size: 11px;">${balanceDue > 0 ? "Rs. " + balanceDueWords : "Fully Paid"}</td>
    </tr>
  `;
	const paymentsList = getPayments().filter((p) => p.agreement === rental.id && p.status === "Paid");
	let totalRentPaidWithoutDeposit = paymentsList.filter((p) => p.type === "Rent" || p.type === "Rent Payment").reduce((sum, p) => sum + p.amount, 0);
	if (totalRentPaidWithoutDeposit === 0 && (rental.rentalPaymentStatus === "Paid" || rental.rentalPaymentStatus === "Partial")) totalRentPaidWithoutDeposit = rental.rentPaidAmount || rental.totalRent || rental.monthlyRent || 0;
	let depositPaid = paymentsList.filter((p) => p.type === "Deposit" || p.type === "Security Deposit").reduce((sum, p) => sum + p.amount, 0);
	if (depositPaid === 0 && (rental.depositPaymentStatus === "Paid" || rental.depositPaymentStatus === "Partial")) depositPaid = rental.depositPaidAmount || rental.deposit || 0;
	const overallPaid = totalRentPaidWithoutDeposit + depositPaid;
	const todayStr = getLocalYYYYMMDD();
	const reportEndDate = rental.status === "Completed" ? rental.end || todayStr : todayStr;
	calculateDurationBetween(rental.start, reportEndDate);
	const totalRentToBePaid = calculateRentForDuration(rental.start, reportEndDate, rental.monthlyRent || 0, rental.dailyRent || 0);
	if (overallPaid > totalRentToBePaid) overallPaid - totalRentToBePaid;
	else totalRentToBePaid - overallPaid;
	const leftRows = [];
	const rightRows = [];
	for (let i = 0; i <= 36; i++) {
		const leftPay = paymentsList[i];
		const rightPay = paymentsList[i + 37];
		leftRows.push(`
      <tr>
        <td style="border: 1px solid #1e293b; padding: 4px; text-align: center; font-size: 11px;">${i + 1}</td>
        <td style="border: 1px solid #1e293b; padding: 4px; text-align: right; font-size: 11px;">${leftPay ? "₹" + leftPay.amount.toLocaleString("en-IN") : ""}</td>
        <td style="border: 1px solid #1e293b; padding: 4px; text-align: center; font-size: 11px;">${leftPay ? new Date(leftPay.date).toLocaleDateString("en-IN") : ""}</td>
      </tr>
    `);
		rightRows.push(`
      <tr>
        <td style="border: 1px solid #1e293b; padding: 4px; text-align: center; font-size: 11px;">${i + 38}</td>
        <td style="border: 1px solid #1e293b; padding: 4px; text-align: right; font-size: 11px;">${rightPay ? "₹" + rightPay.amount.toLocaleString("en-IN") : ""}</td>
        <td style="border: 1px solid #1e293b; padding: 4px; text-align: center; font-size: 11px;">${rightPay ? new Date(rightPay.date).toLocaleDateString("en-IN") : ""}</td>
      </tr>
    `);
	}
	return `
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
      ${isZoomedPreview ? "zoom: 0.65; max-width: 794px; margin: 20px auto; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); border: 1px solid #e2e8f0; padding: 40px !important;" : ""}
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
      <div class="details-row"><span class="details-label">Customer Address:</span><span class="details-value">${customerAddress}, ${customerArea ? customerArea + ", " : ""}${customerCity}, ${customerState} - ${customerPincode}</span></div>
      <div class="details-row"><span class="details-label">Mobile Numbers:</span><span class="details-value">${customerPhone}${customerAltPhone ? ", " + customerAltPhone : ""}</span></div>
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
              ${rental.paymentMode || "Cash"}
              ${rental.paymentMode === "Cash+Bank" ? ` <strong>(Cash: Rs. ${(rental.cashPaidAmount || 0).toLocaleString("en-IN")}, Bank/UPI: Rs. ${(rental.bankUpiPaidAmount || 0).toLocaleString("en-IN")})</strong>` : ""}
              ${rental.paymentCollectedBy ? " (Collected By: " + rental.paymentCollectedBy + ")" : ""}
            ` : "N/A"}
          </td>
        </tr>
        <tr>
          <td style="font-weight: bold; vertical-align: top;">Note:-</td>
          <td colspan="3">Extra payment is for one-time accessory or personal purchases, non-returnable and non-refundable.</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Remarks</td>
          <td colspan="3">${rental.remarks || "N/A"}</td>
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
          ${rental.signatureUrl ? `<img src="${rental.signatureUrl}" alt="Customer Signature" style="max-height: 50px; max-width: 150px; object-fit: contain;" />` : "<span style=\"border-bottom: 1px dotted #64748b; width: 150px; display: inline-block;\"></span>"}
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
  <\/script>
  ` : ""}
</body>
</html>
  `;
}
function printAgreement(rental) {
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
function printReceipt(payment, customerName) {
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
  <\/script>
</body>
</html>
  `;
	printWindow.document.write(htmlContent);
	printWindow.document.close();
}
function getReturnReceiptHtmlContent(ret, isPrintMode = false, isZoomedPreview = false) {
	typeof window !== "undefined" && window.location.origin;
	if (!ret) return "";
	return `
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
      ${isZoomedPreview ? "zoom: 0.65; max-width: 794px; margin: 20px auto; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); border: 1px solid #e2e8f0; padding: 40px !important;" : ""}
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
      ${ret.collectedBy ? `<div class="details-row"><span class="details-label">Return Collected By:</span><span class="details-value">${ret.collectedBy}</span></div>` : ""}
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
          <td style="text-align: center; font-weight: bold; color: ${ret.condition?.toLowerCase()?.includes("maint") ? "#d97706" : "#16a34a"};">${ret.condition || "Good"}</td>
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
        
        <tr style="font-weight: bold; ${ret.refund >= 0 ? "background-color: #f0fdf4; color: #15803d;" : "background-color: #fef2f2; color: #b91c1c;"}">
          <td style="font-weight: bold;">
            ${ret.refund >= 0 ? "NET REFUND PAYABLE TO LESSEE" : "NET OUTSTANDING DUES PAYABLE TO LESSOR"}
          </td>
          <td style="text-align: right; font-weight: 800; font-size: 13.5px;">
            Rs. ${Math.abs(ret.refund || 0).toLocaleString("en-IN")}
          </td>
        </tr>
        <tr style="font-weight: bold; ${ret.refund >= 0 ? "background-color: #f0fdf4; color: #15803d;" : ret.duePaymentStatus === "Not Paid" ? "background-color: #fef2f2; color: #b91c1c;" : "background-color: #f0fdf4; color: #15803d;"}">
          <td colspan="2" style="text-align: center; padding: 10px; border: 1.5px solid ${ret.refund >= 0 ? "#16a34a" : ret.duePaymentStatus === "Not Paid" ? "#dc2626" : "#16a34a"}; font-size: 13px;">
            ${ret.refund >= 0 ? `✓ STATUS: RETURNED SUCCESSFULLY & REFUNDED TOTAL AMOUNT OF Rs. ${Math.abs(ret.refund || 0).toLocaleString("en-IN")}` : ret.duePaymentStatus === "Not Paid" ? `⚠️ STATUS: RETURNED — UNPAID PENDING DUE OF Rs. ${Math.abs(ret.refund || 0).toLocaleString("en-IN")}` : `✓ STATUS: RETURNED SUCCESSFULLY & PAID TOTAL AMOUNT OF Rs. ${Math.abs(ret.refund || 0).toLocaleString("en-IN")}${ret.duePaymentMode ? ` (${ret.duePaymentMode.toUpperCase()})` : ""}`}
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
  <\/script>
  ` : ""}
</body>
</html>
  `;
}
function printReturnReceipt(ret) {
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
function getDocumentPreviewUrl(doc) {
	if (doc.fileData && doc.fileData !== "PDF" && doc.fileData.startsWith("data:")) return doc.fileData;
	const isAgreement = doc.type === "Agreement" || doc.name.toLowerCase().includes("agreement") && !doc.name.toLowerCase().includes("return");
	const isReturn = doc.type === "Return" || doc.name.toLowerCase().includes("return");
	if (isAgreement) {
		let rentalId = doc.rentalId;
		if (!rentalId) {
			const match = doc.name.match(/AGR-\d{4}-\d{4}/i);
			if (match) rentalId = match[0].toUpperCase();
		}
		const rental = getRentals().find((r) => r.id === rentalId);
		if (rental) {
			const htmlContent = getAgreementHtmlContent(rental, false, true);
			return "data:text/html;charset=utf-8," + encodeURIComponent(htmlContent);
		}
	} else if (isReturn) {
		const returns = getReturns();
		let cleanRetId = "";
		if (doc.id.startsWith("doc-ret-")) cleanRetId = doc.id.replace("doc-ret-", "").toUpperCase();
		if (!cleanRetId) {
			const match = doc.name.match(/RET-\d{4}-\d{4}/i);
			if (match) cleanRetId = match[0].toUpperCase();
		}
		if (!cleanRetId) cleanRetId = doc.id;
		const ret = returns.find((r) => r.id === cleanRetId || r.id === doc.id || r.id.toUpperCase() === cleanRetId.toUpperCase());
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
function dataURLtoBlob(dataurl) {
	const parts = dataurl.split(",");
	const mimeMatch = parts[0].match(/:(.*?);/);
	const mime = mimeMatch ? mimeMatch[1] : "";
	const bstr = atob(parts[1]);
	let n = bstr.length;
	const u8arr = new Uint8Array(n);
	while (n--) u8arr[n] = bstr.charCodeAt(n);
	return new Blob([u8arr], { type: mime });
}
function downloadBase64File(fileData, filename) {
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
async function printDocumentFile(doc) {
	let fileData = doc.fileData;
	const isRealUploadType = doc.type !== "Agreement" && !doc.id.startsWith("doc-ret-") && !doc.id.startsWith("doc-pay-");
	if ((!fileData || fileData === "NOT_FOUND") && isRealUploadType) {
		fileData = await getFileFromIndexedDB(doc.id);
		if (!fileData && isGSheetsEnabled()) {
			const remoteFileData = await downloadFileChunks(doc.id);
			if (remoteFileData) {
				fileData = remoteFileData;
				setFileInIndexedDB(doc.id, remoteFileData);
			}
		}
	}
	if (fileData && fileData !== "PDF" && fileData.startsWith("data:")) {
		downloadBase64File(fileData, doc.name);
		return true;
	}
	if (doc.type === "Agreement") {
		const rental = getRentals().find((r) => r.id === doc.rentalId || doc.id.endsWith(r.id) || doc.id.includes(r.id));
		if (rental) {
			printAgreement(rental);
			return true;
		}
	} else if (doc.type === "Invoice" || doc.type === "Receipt") {
		if (doc.id.startsWith("doc-ret-")) {
			const returns = getReturns();
			const retId = doc.id.replace("doc-ret-", "");
			const ret = returns.find((r) => r.id === retId || doc.id.includes(r.id));
			if (ret) {
				printReturnReceipt(ret);
				return true;
			}
		}
		const payments = getPayments();
		const payId = doc.id.replace("doc-pay-", "");
		const payment = payments.find((p) => p.id === payId || doc.id.includes(p.id));
		if (payment) {
			printReceipt(payment, getCustomers().find((c) => c.id === payment.customerId)?.name);
			return true;
		}
	}
	if (isRealUploadType) return false;
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
async function syncMissingFileChunks(onProgress) {
	const result = {
		checked: 0,
		uploaded: 0,
		alreadySynced: 0,
		failed: 0
	};
	if (!isGSheetsEnabled()) return result;
	const docs = getDocuments();
	for (const doc of docs) {
		const localFileData = await getFileFromIndexedDB(doc.id);
		if (!localFileData) continue;
		result.checked++;
		onProgress?.(result.checked, docs.length);
		if (await downloadFileChunks(doc.id)) {
			result.alreadySynced++;
			continue;
		}
		if (await uploadFileChunks(doc.id, localFileData)) result.uploaded++;
		else result.failed++;
	}
	return result;
}
/** Sync all entity tabs from Google Sheets and update localStorage */
async function syncFromSheetsToLocalStorage(force = false) {
	if (!isGSheetsEnabled()) return;
	const syncStartTime = Date.now();
	if (!force) {
		const lastWrite = localStorage.getItem("medirent-last-write-time");
		if (lastWrite) {
			const timeSinceWrite = Date.now() - parseInt(lastWrite, 10);
			if (timeSinceWrite < 3e4) {
				console.log(`[GSheets] Auto-sync skipped to prevent race condition (last write was ${timeSinceWrite}ms ago)`);
				return;
			}
		}
	}
	cleanStalePendingSyncs();
	const pendingSyncs = getPendingSyncs();
	const fetchPromises = [
		{
			key: "medirent-customers",
			sheet: SHEETS.CUSTOMERS
		},
		{
			key: "medirent-equipment",
			sheet: SHEETS.EQUIPMENT
		},
		{
			key: "medirent-rentals",
			sheet: SHEETS.RENTALS
		},
		{
			key: "medirent-payments",
			sheet: SHEETS.PAYMENTS
		},
		{
			key: "medirent-returns",
			sheet: SHEETS.RETURNS
		},
		{
			key: "medirent-owners",
			sheet: SHEETS.OWNERS
		},
		{
			key: "medirent-documents",
			sheet: SHEETS.DOCUMENTS
		},
		{
			key: "medirent-exchanges",
			sheet: SHEETS.EXCHANGES
		},
		{
			key: "medirent-staff-users",
			sheet: SHEETS.STAFF
		},
		{
			key: "medirent-company-settings",
			sheet: SHEETS.SETTINGS
		}
	].map(async (entity) => {
		try {
			return {
				entity,
				data: await readSheetData(entity.sheet),
				error: null
			};
		} catch (e) {
			return {
				entity,
				data: null,
				error: e
			};
		}
	});
	const results = await Promise.all(fetchPromises);
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
			const localStaff = getStorageItem("medirent-staff-users", []);
			if ((!data || data.length === 0) && localStaff.length > 0) {
				console.log(`[GSheets] Staff sheet is empty, uploading local staff accounts...`);
				localStaff.forEach((u) => {
					syncRowToSheet(SHEETS.STAFF, u);
				});
				continue;
			}
		}
		if (data) {
			let mergedData = [...data];
			const pending = pendingSyncs.filter((s) => s.sheet === entity.sheet);
			const deletedIds = new Set(pending.filter((p) => p.type === "delete").map((p) => p.id));
			if (deletedIds.size > 0) mergedData = mergedData.filter((item) => !deletedIds.has(item.id));
			pending.filter((p) => p.type === "upsert").forEach((p) => {
				if (!p.data) return;
				const idx = mergedData.findIndex((item) => item.id === p.id);
				if (idx > -1) mergedData[idx] = p.data;
				else mergedData.unshift(p.data);
			});
			if (entity.key === "medirent-company-settings") {
				const settingsRow = mergedData.find((item) => item.id === "company-settings");
				if (settingsRow) {
					const { id, ...settingsOnly } = settingsRow;
					const localSettings = getStorageItem("medirent-company-settings", {});
					const merged = Object.keys(settingsOnly).length > 0 ? {
						...localSettings,
						...settingsOnly
					} : localSettings;
					localStorage.setItem(entity.key, JSON.stringify(merged));
					updatedAny = true;
				}
				continue;
			} else if (entity.key === "medirent-documents") {
				const localDocs = getStorageItem("medirent-documents", []);
				const mergedDocs = mergedData.map((item) => {
					const localDoc = localDocs.find((ld) => ld.id === item.id);
					if (localDoc && localDoc.fileData) return {
						...item,
						fileData: localDoc.fileData
					};
					return item;
				});
				localStorage.setItem(entity.key, JSON.stringify(mergedDocs));
			} else localStorage.setItem(entity.key, JSON.stringify(mergedData));
			updatedAny = true;
		}
	}
	if (updatedAny && typeof window !== "undefined") window.dispatchEvent(new Event("medirent-db-updated"));
}
var PRICING_TABLE = {
	1e3: [
		500,
		1e3,
		1e3,
		1e3
	],
	1500: [
		500,
		1e3,
		1500,
		1500
	],
	2e3: [
		1e3,
		1500,
		2e3,
		2e3
	],
	2500: [
		1e3,
		1500,
		2e3,
		2500
	],
	2800: [
		1e3,
		1500,
		2e3,
		2800
	],
	3e3: [
		1e3,
		1500,
		2e3,
		3e3
	],
	3500: [
		1e3,
		1500,
		2e3,
		3500
	],
	4e3: [
		1500,
		2e3,
		2500,
		4e3
	],
	4500: [
		1500,
		2e3,
		3e3,
		4500
	],
	5e3: [
		2e3,
		3e3,
		4e3,
		5e3
	],
	5500: [
		2e3,
		3e3,
		4e3,
		5500
	],
	6e3: [
		2e3,
		3e3,
		4e3,
		6e3
	],
	6500: [
		2e3,
		3e3,
		4e3,
		6500
	],
	7e3: [
		2500,
		3500,
		4500,
		7e3
	],
	7500: [
		2500,
		3500,
		5e3,
		7500
	],
	8e3: [
		2500,
		4e3,
		5e3,
		8e3
	],
	9e3: [
		3e3,
		4500,
		6e3,
		9e3
	],
	9500: [
		3500,
		5e3,
		7e3,
		9500
	],
	1e4: [
		3500,
		5e3,
		7e3,
		1e4
	],
	11e3: [
		3500,
		5500,
		7500,
		11e3
	],
	12e3: [
		4e3,
		6e3,
		8e3,
		12e3
	],
	13e3: [
		4500,
		7500,
		9e3,
		13e3
	],
	15e3: [
		6500,
		7500,
		10500,
		15e3
	],
	16e3: [
		5500,
		8500,
		10500,
		16e3
	]
};
var cleanNum = (val) => {
	if (typeof val === "number") return isNaN(val) ? 0 : val;
	if (!val) return 0;
	const cleaned = String(val).replace(/[^\d.-]/g, "");
	const num = parseFloat(cleaned);
	return isNaN(num) ? 0 : num;
};
function getPricingTableRate(monthlyRent, days) {
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
function getReturnCalculatedRentPerItem(monthlyRent, daysUsed, startDateStr, endDateStr) {
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
	if (months === 0) return getPricingTableRate(cleanMonthlyRent, days);
	const baseRent = months * cleanMonthlyRent;
	if (days <= 5) return baseRent;
	else if (days <= 20) {
		const dailyRent = cleanMonthlyRent / 30;
		return Math.round(baseRent + days * dailyRent);
	} else return baseRent + cleanMonthlyRent;
}
function getPaidForEquipment(rental, equipmentId, paymentsList, excludeInitial = false) {
	if (!rental) return 0;
	const items = rental.equipmentItems || [{
		equipmentId: rental.equipmentId,
		serial: rental.serial,
		monthlyRent: cleanNum(rental.monthlyRent),
		deposit: cleanNum(rental.deposit),
		returned: false
	}];
	const currentItem = items.find((it) => it.equipmentId === equipmentId);
	if (!currentItem) return 0;
	const currentItemRent = cleanNum(currentItem.monthlyRent || currentItem.dailyRent || currentItem.rentRate);
	const totalRentalMonthlyRent = items.reduce((sum, it) => sum + cleanNum(it.monthlyRent || it.dailyRent || it.rentRate), 0);
	const shareRatio = totalRentalMonthlyRent > 0 ? currentItemRent / totalRentalMonthlyRent : 1;
	const directPaid = paymentsList.filter((p) => p.agreement === rental.id && p.equipmentId === equipmentId && p.status === "Paid" && (p.type === "Rent" || p.type === "Rent Payment")).reduce((sum, p) => sum + cleanNum(p.amount), 0);
	const totalShared = paymentsList.filter((p) => p.agreement === rental.id && !p.equipmentId && p.status === "Paid" && (p.type === "Rent" || p.type === "Rent Payment")).reduce((sum, p) => sum + cleanNum(p.amount), 0) + (!excludeInitial && (rental.rentalPaymentStatus === "Paid" || rental.rentalPaymentStatus === "Partial") ? Number(rental.rentPaidAmount) || Number(rental.totalRent) || Number(rental.monthlyRent) || 0 : 0);
	return directPaid + Math.round(totalShared * shareRatio);
}
var initialExchanges = [];
function getExchanges() {
	return sortLatestFirst(getStorageItem("medirent-exchanges", initialExchanges), "exchangeDate");
}
function getNextExchangeNumber() {
	if (!isBrowser) return `EXC-${(/* @__PURE__ */ new Date()).getFullYear()}-0001`;
	const year = (/* @__PURE__ */ new Date()).getFullYear();
	const key = `medirent-exc-counter-${year}`;
	const next = parseInt(localStorage.getItem(key) || "0", 10) + 1;
	localStorage.setItem(key, next.toString());
	return `EXC-${year}-${String(next).padStart(4, "0")}`;
}
/** Returns the next exchange ID for display only — does NOT increment the counter.
*  Use this in form initial state (useState), call getNextExchangeNumber() only on actual save.
*/
function peekNextExchangeNumber() {
	if (!isBrowser) return `EXC-${(/* @__PURE__ */ new Date()).getFullYear()}-0001`;
	const year = (/* @__PURE__ */ new Date()).getFullYear();
	const key = `medirent-exc-counter-${year}`;
	const current = parseInt(localStorage.getItem(key) || "0", 10);
	return `EXC-${year}-${String(current + 1).padStart(4, "0")}`;
}
function saveExchange(exc) {
	const list = getExchanges();
	const index = list.findIndex((e) => e.id === exc.id);
	if (index > -1) list[index] = exc;
	else list.unshift(exc);
	setStorageItem("medirent-exchanges", list);
	if (exc.status === "Completed") {
		const rentals = getRentals();
		const rIndex = rentals.findIndex((r) => r.id === exc.agreementId);
		if (rIndex > -1) {
			const rental = rentals[rIndex];
			if (rental.equipmentItems && rental.equipmentItems.length > 0) {
				rental.equipmentItems = rental.equipmentItems.map((item) => {
					if (item.equipmentId === exc.currentEquipmentId) return {
						...item,
						equipmentId: exc.newEquipmentId,
						serial: exc.newEquipmentSerial
					};
					return item;
				});
				const activeItems = rental.equipmentItems.filter((item) => !item.returned);
				rental.equipmentId = activeItems.map((item) => item.equipmentId).join(", ");
				rental.serial = activeItems.map((item) => item.serial).join(", ");
				const eqList = getEquipment();
				rental.equipment = activeItems.map((item) => eqList.find((e) => e.id === item.equipmentId)?.name || "Unknown").join(", ");
			} else {
				rental.equipmentId = exc.newEquipmentId;
				rental.serial = exc.newEquipmentSerial;
				rental.equipment = exc.newEquipment;
			}
			setStorageItem("medirent-rentals", rentals);
			if (isGSheetsEnabled()) syncRowToSheet(SHEETS.RENTALS, rental);
		}
		updateEquipmentStatus(exc.currentEquipmentId, exc.releaseCondition || "UnderMaintenance");
		updateEquipmentStatus(exc.newEquipmentId, "Rented");
		const eqList = getEquipment();
		const affectedOwners = /* @__PURE__ */ new Set();
		const currentEq = eqList.find((e) => e.id === exc.currentEquipmentId);
		const newEq = eqList.find((e) => e.id === exc.newEquipmentId);
		if (currentEq?.owner) affectedOwners.add(currentEq.owner);
		if (newEq?.owner) affectedOwners.add(newEq.owner);
		affectedOwners.forEach((ownerName) => updateOwnerStatusByEquipment(ownerName));
		if (!getDocuments().some((d) => d.id === `doc-exc-${exc.id}`)) saveDocument({
			id: `doc-exc-${exc.id}`,
			name: `Exchange Slip ${exc.id}.pdf`,
			type: "Exchange Slip",
			size: "180 KB",
			date: new Date(exc.exchangeDate).toLocaleDateString("en-IN", {
				day: "2-digit",
				month: "short",
				year: "numeric"
			}),
			rentalId: exc.agreementId,
			customerId: exc.customerId
		});
	}
	if (isGSheetsEnabled()) syncRowToSheet(SHEETS.EXCHANGES, exc);
	return list;
}
function useDatabaseTrigger() {
	const [version, setVersion] = (0, import_react.useState)(0);
	(0, import_react.useEffect)(() => {
		if (typeof window === "undefined") return;
		const handleUpdate = () => {
			setVersion((v) => v + 1);
		};
		window.addEventListener("medirent-db-updated", handleUpdate);
		return () => window.removeEventListener("medirent-db-updated", handleUpdate);
	}, []);
	return version;
}
//#endregion
export { saveExchange as $, getNextDocumentNumber as A, getReturnCalculatedRentPerItem as B, getDocuments as C, getLocalYYYYMMDD as D, getExchanges as E, getNextReturnNumber as F, peekNextReturnNumber as G, parseLocalDate as H, getOwners as I, printReturnReceipt as J, printDocumentFile as K, getPaidForEquipment as L, getNextExchangeNumber as M, getNextOwnerNumber as N, getNextAgreementNumber as O, getNextPaymentNumber as P, saveEquipment as Q, getPayments as R, getDocumentWithFile as S, getEquipment as T, peekNextAgreementNumber as U, getReturns as V, peekNextExchangeNumber as W, saveCustomer as X, saveCompanySettings as Y, saveDocument as Z, getAllDataForSync as _, testConnection as _t, data_store_exports as a, syncFromSheetsToLocalStorage as at, getCustomers as b, deleteEquipment as c, SHEETS as ct, downloadAgreementFile as d, getGSheetsUrl as dt, saveOwner as et, downloadBase64File as f, isGSheetsEnabled as ft, formatDateDDMMYYYY as g, syncRowToSheet as gt, extractIdNumber as h, syncAllToSheets as ht, cleanNum as i, sortLatestFirst as it, getNextEquipmentNumber as j, getNextCustomerNumber as k, deleteOwner as l, clearSheetInGSheets as lt, downloadFile as m, setGSheetsUrl as mt, approveRental as n, saveRental as nt, deleteCustomer as o, syncMissingFileChunks as ot, downloadExcel as p, sendOtpEmail as pt, printReceipt as q, cancelRental as r, saveReturn as rt, deleteDocument as s, useDatabaseTrigger as st, EQUIPMENT_CATEGORIES as t, savePayment as tt, deletePayment as u, deleteRowFromSheet as ut, getCompanySettings as v, getDynamicKPIs as w, getDocumentPreviewUrl as x, getCustomerDueBalance as y, getRentals as z };
