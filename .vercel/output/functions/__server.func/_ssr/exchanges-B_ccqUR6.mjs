import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { $ as saveExchange, D as getLocalYYYYMMDD, E as getExchanges, H as parseLocalDate, M as getNextExchangeNumber, T as getEquipment, W as peekNextExchangeNumber, b as getCustomers, g as formatDateDDMMYYYY, it as sortLatestFirst, st as useDatabaseTrigger, z as getRentals } from "./data-store-BQmZefNN.mjs";
import { c as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { A as Printer, Ct as CircleCheck, D as RefreshCw, Nt as CalendarDays, j as Plus, p as TriangleAlert, ut as Eye, w as Search, xt as ClipboardList } from "../_libs/lucide-react.mjs";
import { a as DialogFooter, i as DialogContent, l as Input, n as Dialog, o as DialogHeader, r as DialogClose, s as DialogTitle, t as Button, u as Label } from "./dialog-BHa0LWsH.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Textarea } from "./textarea-DE2ysOZI.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-C2rs2HGz.mjs";
import { a as CardContent, h as StatusBadge, i as Card, o as CardHeader, s as CardTitle, t as AppShell } from "./AppShell-BtlnpavN.mjs";
import { a as TableHeader, i as TableHead, n as TableBody, o as TableRow, r as TableCell, t as Table } from "./table-DDeHIPcn.mjs";
import { t as Combobox } from "./combobox-B5tEY2ML.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/exchanges-B_ccqUR6.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ExchangesPage() {
	const dbVersion = useDatabaseTrigger();
	const [exchanges, setExchanges] = (0, import_react.useState)(() => getExchanges());
	const [rentals, setRentals] = (0, import_react.useState)(() => getRentals());
	const [equipmentList, setEquipmentList] = (0, import_react.useState)(() => getEquipment());
	const [searchQuery, setSearchQuery] = (0, import_react.useState)("");
	const [statusFilter, setStatusFilter] = (0, import_react.useState)("all");
	const [openCreate, setOpenCreate] = (0, import_react.useState)(false);
	const [selectedExchange, setSelectedExchange] = (0, import_react.useState)(null);
	const [completeExchange, setCompleteExchange] = (0, import_react.useState)(null);
	const [exchangeId, setExchangeId] = (0, import_react.useState)("");
	const [selectedAgreementId, setSelectedAgreementId] = (0, import_react.useState)("");
	const [customerName, setCustomerName] = (0, import_react.useState)("");
	const [customerId, setCustomerId] = (0, import_react.useState)("");
	const [agreementItems, setAgreementItems] = (0, import_react.useState)([]);
	const [currentEquipmentId, setCurrentEquipmentId] = (0, import_react.useState)("");
	const [currentEquipmentName, setCurrentEquipmentName] = (0, import_react.useState)("");
	const [currentEquipmentSerial, setCurrentEquipmentSerial] = (0, import_react.useState)("");
	const [newEquipmentId, setNewEquipmentId] = (0, import_react.useState)("");
	const [newEquipmentName, setNewEquipmentName] = (0, import_react.useState)("");
	const [newEquipmentSerial, setNewEquipmentSerial] = (0, import_react.useState)("");
	const [exchangeDate, setExchangeDate] = (0, import_react.useState)("");
	const [releaseCondition, setReleaseCondition] = (0, import_react.useState)("UnderMaintenance");
	const [reason, setReason] = (0, import_react.useState)("");
	const [exchangeStatus, setExchangeStatus] = (0, import_react.useState)("Completed");
	const [ownerName, setOwnerName] = (0, import_react.useState)("");
	const [sourcingStatus, setSourcingStatus] = (0, import_react.useState)("HaveInStock");
	const [isSubmitting, setIsSubmitting] = (0, import_react.useState)(false);
	const lastSelectedAgreementIdRef = (0, import_react.useRef)("");
	(0, import_react.useEffect)(() => {
		setExchanges(getExchanges());
		setRentals(getRentals());
		setEquipmentList(getEquipment());
	}, [dbVersion]);
	(0, import_react.useEffect)(() => {
		if (openCreate) {
			setEquipmentList(getEquipment());
			setRentals(getRentals());
		}
	}, [openCreate]);
	(0, import_react.useEffect)(() => {
		const agrId = new URLSearchParams(window.location.search).get("agreementId");
		if (agrId) {
			setSelectedAgreementId(agrId);
			setOpenCreate(true);
			window.history.replaceState({}, document.title, window.location.pathname);
		}
	}, []);
	(0, import_react.useEffect)(() => {
		const eqId = new URLSearchParams(window.location.search).get("equipmentId");
		if (eqId && agreementItems.some((i) => i.equipmentId === eqId)) setCurrentEquipmentId(eqId);
	}, [agreementItems]);
	(0, import_react.useEffect)(() => {
		const newEqId = new URLSearchParams(window.location.search).get("newEquipmentId");
		if (newEqId) setNewEquipmentId(newEqId);
	}, [openCreate]);
	const refreshData = () => {
		setExchanges(getExchanges());
		setRentals(getRentals());
		setEquipmentList(getEquipment());
	};
	(0, import_react.useEffect)(() => {
		if (openCreate) {
			setExchangeId(peekNextExchangeNumber());
			setExchangeDate(getLocalYYYYMMDD());
			setSelectedAgreementId("");
			setCustomerName("");
			setCustomerId("");
			setAgreementItems([]);
			setCurrentEquipmentId("");
			setCurrentEquipmentName("");
			setCurrentEquipmentSerial("");
			setNewEquipmentId("");
			setNewEquipmentName("");
			setNewEquipmentSerial("");
			setReleaseCondition("UnderMaintenance");
			setReason("");
			setExchangeStatus("Completed");
			setOwnerName("");
			setSourcingStatus("HaveInStock");
		}
	}, [openCreate]);
	(0, import_react.useEffect)(() => {
		if (selectedAgreementId !== lastSelectedAgreementIdRef.current) {
			lastSelectedAgreementIdRef.current = selectedAgreementId;
			if (selectedAgreementId) {
				const rental = rentals.find((r) => r.id === selectedAgreementId);
				if (rental) {
					setCustomerName(rental.customer);
					setCustomerId(rental.customerId);
					let items = [];
					if (rental.equipmentItems && rental.equipmentItems.length > 0) items = rental.equipmentItems.filter((item) => !item.returned);
					else if (rental.equipmentId) {
						const ids = rental.equipmentId.split(",").map((s) => s.trim()).filter(Boolean);
						const serials = (rental.serial || "").split(",").map((s) => s.trim()).filter(Boolean);
						const names = (rental.equipment || "").split(",").map((s) => s.trim()).filter(Boolean);
						items = ids.map((id, index) => ({
							equipmentId: id,
							serial: serials[index] || "Unknown",
							name: names[index] || rental.equipment || "Equipment"
						}));
					}
					setAgreementItems(items);
					if (items.length > 0) setCurrentEquipmentId(items[0].equipmentId);
					else {
						setCurrentEquipmentId("");
						setCurrentEquipmentName("");
						setCurrentEquipmentSerial("");
					}
				}
			} else {
				setCustomerName("");
				setCustomerId("");
				setAgreementItems([]);
				setCurrentEquipmentId("");
				setCurrentEquipmentName("");
				setCurrentEquipmentSerial("");
			}
		}
	}, [selectedAgreementId, rentals]);
	(0, import_react.useEffect)(() => {
		if (currentEquipmentId) {
			const item = agreementItems.find((i) => i.equipmentId === currentEquipmentId);
			if (item) {
				setCurrentEquipmentName(item.name || getEquipmentNameFromInventory(currentEquipmentId));
				setCurrentEquipmentSerial(item.serial);
			}
			const eq = equipmentList.find((e) => e.id === currentEquipmentId);
			if (eq && eq.owner) setOwnerName(eq.owner);
			else setOwnerName("");
		} else {
			setCurrentEquipmentName("");
			setCurrentEquipmentSerial("");
			setOwnerName("");
		}
	}, [
		currentEquipmentId,
		agreementItems,
		equipmentList
	]);
	(0, import_react.useEffect)(() => {
		if (newEquipmentId) {
			const eq = equipmentList.find((e) => e.id === newEquipmentId);
			if (eq) {
				setNewEquipmentName(eq.name);
				setNewEquipmentSerial(eq.serial || "");
			}
		} else {
			setNewEquipmentName("");
			setNewEquipmentSerial("");
		}
	}, [newEquipmentId, equipmentList]);
	(0, import_react.useEffect)(() => {
		if (sourcingStatus === "NeedFromOwner") setExchangeStatus("Pending");
	}, [sourcingStatus]);
	const getEquipmentNameFromInventory = (id) => {
		const eq = equipmentList.find((e) => e.id === id);
		return eq ? eq.name : "Unknown Equipment";
	};
	const availableEquipment = equipmentList.filter((e) => String(e.status || "").trim().toLowerCase() === "available");
	const handleSubmit = (e) => {
		e.preventDefault();
		if (isSubmitting) return;
		setIsSubmitting(true);
		if (!selectedAgreementId) {
			toast.error("Please select a rental agreement");
			setIsSubmitting(false);
			return;
		}
		const rental = rentals.find((r) => r.id === selectedAgreementId);
		if (rental && rental.start) {
			const startD = parseLocalDate(rental.start);
			const exchD = parseLocalDate(exchangeDate);
			if (!isNaN(startD.getTime()) && !isNaN(exchD.getTime()) && exchD < startD) {
				toast.error("Exchange date cannot be earlier than agreement start date.");
				setIsSubmitting(false);
				return;
			}
		}
		if (!currentEquipmentId) {
			toast.error("Agreement has no active equipment to exchange");
			setIsSubmitting(false);
			return;
		}
		if (exchangeStatus === "Completed" && !newEquipmentId) {
			toast.error("Please select a new replacement equipment");
			setIsSubmitting(false);
			return;
		}
		if (newEquipmentId === currentEquipmentId) {
			toast.error("Cannot exchange an item with itself");
			setIsSubmitting(false);
			return;
		}
		const finalExchangeId = getNextExchangeNumber();
		setExchangeId(finalExchangeId);
		saveExchange({
			id: finalExchangeId,
			agreementId: selectedAgreementId,
			customer: customerName,
			customerId,
			currentEquipment: currentEquipmentName,
			currentEquipmentId,
			currentEquipmentSerial,
			newEquipment: newEquipmentName,
			newEquipmentId,
			newEquipmentSerial,
			exchangeDate,
			releaseCondition,
			reason,
			ownerName: sourcingStatus === "HaveInStock" ? "" : ownerName,
			sourcingStatus,
			status: exchangeStatus
		});
		toast.success(`Exchange request ${finalExchangeId} saved successfully!`);
		setIsSubmitting(false);
		setOpenCreate(false);
		refreshData();
	};
	const totalSwaps = exchanges.length;
	const pendingSwaps = exchanges.filter((e) => e.status === "Pending").length;
	const completedSwaps = exchanges.filter((e) => e.status === "Completed").length;
	const currentMonth = (/* @__PURE__ */ new Date()).getMonth();
	const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
	const swapsThisMonth = exchanges.filter((e) => {
		const d = new Date(e.exchangeDate);
		return !isNaN(d.getTime()) && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
	}).length;
	const customers = (0, import_react.useMemo)(() => getCustomers(), [dbVersion]);
	const filteredExchanges = sortLatestFirst(exchanges.filter((e) => {
		const q = searchQuery.toLowerCase().trim();
		const customer = customers.find((c) => c.name.toLowerCase() === (e.customer || "").toLowerCase() || c.id === e.customerId);
		const matchesSearch = !q || (e.id || "").toLowerCase().includes(q) || (e.customer || "").toLowerCase().includes(q) || (e.agreementId || "").toLowerCase().includes(q) || String(e.currentEquipment || e.oldEquipment || "").toLowerCase().includes(q) || String(e.newEquipment || "").toLowerCase().includes(q) || String(e.currentEquipmentSerial || e.oldEquipmentSerial || "").toLowerCase().includes(q) || String(e.newEquipmentSerial || "").toLowerCase().includes(q) || customer && (String(customer.phone || "").toLowerCase().includes(q) || String(customer.altPhone || "").toLowerCase().includes(q) || String(customer.contactNumber3 || "").toLowerCase().includes(q));
		const matchesStatus = statusFilter === "all" || e.status === statusFilter;
		return matchesSearch && matchesStatus;
	}), "exchangeDate");
	const printExchangeSlip = (exc) => {
		if (!exc || typeof window === "undefined") return;
		const printWindow = window.open("", "_blank");
		if (!printWindow) {
			toast.error("Please allow popups to print the exchange slip.");
			return;
		}
		const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Exchange Slip ${exc.id}</title>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" rel="stylesheet">
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
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
      position: relative;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #3b82f6;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .logo-area h1 {
      font-family: 'Outfit', sans-serif;
      font-size: 26px;
      font-weight: 800;
      color: #1e3a8a;
      margin: 0;
    }
    .logo-area p {
      font-size: 11px;
      color: #64748b;
      margin: 4px 0 0 0;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .slip-title {
      text-align: right;
    }
    .slip-title h2 {
      font-size: 20px;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }
    .slip-title p {
      font-size: 13px;
      color: #64748b;
      margin: 6px 0 0 0;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 30px;
    }
    .meta-box h3 {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      margin: 0 0 8px 0;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 4px;
    }
    .meta-box p {
      font-size: 13.5px;
      font-weight: 600;
      color: #1e293b;
      margin: 4px 0;
    }
    .meta-box p span {
      font-weight: 400;
      color: #64748b;
    }
    .table-section {
      margin-bottom: 30px;
    }
    .table-section h3 {
      font-size: 12px;
      text-transform: uppercase;
      color: #64748b;
      margin: 0 0 12px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    th {
      background-color: #f8fafc;
      color: #475569;
      font-weight: 600;
      text-align: left;
      padding: 10px 12px;
      border-bottom: 1.5px solid #e2e8f0;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #f1f5f9;
      color: #334155;
    }
    .reason-box {
      background-color: #f8fafc;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 40px;
      border-left: 4px solid #3b82f6;
    }
    .reason-box h4 {
      font-size: 11px;
      text-transform: uppercase;
      color: #64748b;
      margin: 0 0 8px 0;
    }
    .reason-box p {
      font-size: 13px;
      margin: 0;
      color: #334155;
    }
    .footer {
      display: flex;
      justify-content: space-between;
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px dashed #e2e8f0;
    }
    .sig-block {
      text-align: center;
      width: 200px;
    }
    .sig-line {
      border-top: 1px solid #94a3b8;
      margin-top: 40px;
      padding-top: 6px;
      font-size: 11px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-area">
        <h1>Relife</h1>
        <p>Medical Technologies</p>
      </div>
      <div class="slip-title">
        <h2>Equipment Exchange Slip</h2>
        <p>ID: ${exc.id}</p>
      </div>
    </div>

    <div class="grid">
      <div class="meta-box">
        <h3>Agreement Details</h3>
        <p><span>Agreement No:</span> ${exc.agreementId}</p>
        <p><span>Customer Name:</span> ${exc.customer}</p>
      </div>
      <div class="meta-box">
        <h3>Exchange Info</h3>
        <p><span>Exchange Date:</span> ${formatDateDDMMYYYY(exc.exchangeDate)}</p>
        <p><span>Status:</span> ${exc.status}</p>
      </div>
    </div>

    <div class="table-section">
      <h3>Equipment Swapped</h3>
      <table>
        <thead>
          <tr>
            <th>Role</th>
            <th>Item Name</th>
            <th>Serial Number</th>
            <th>Status / Condition</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Returned (Old)</strong></td>
            <td>${exc.currentEquipment}</td>
            <td><code>${exc.currentEquipmentSerial}</code></td>
            <td>Released (${exc.releaseCondition === "UnderMaintance" || exc.releaseCondition === "UnderMaintenance" ? "Under Maintenance" : exc.releaseCondition === "Returned to Owner" ? "Returned to Owner" : "Available"})</td>
          </tr>
          <tr>
            <td><strong>Assigned (New)</strong></td>
            <td>${exc.newEquipment || "—"}</td>
            <td><code>${exc.newEquipmentSerial || "—"}</code></td>
            <td>${exc.status === "Completed" ? "Active (Rented)" : "Pending Assignment"}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="reason-box">
      <h4>Reason for Exchange</h4>
      <p>${exc.reason || "No reason provided."}</p>
    </div>

    <div class="footer">
      <div class="sig-block">
        <div class="sig-line">Customer Signature</div>
      </div>
      <div class="sig-block">
        <div class="sig-line">Authorized Signatory</div>
      </div>
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
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "Equipment Exchanges",
		subtitle: "Manage and process equipment exchange requests under rental agreements",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-3 sm:gap-4 sm:gap-5 md:grid-cols-4 mb-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						className: "border border-border/50 shadow-soft",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, {
							className: "flex flex-row items-center justify-between space-y-0 pb-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
								className: "text-[11px] font-bold uppercase tracking-wider text-muted-foreground",
								children: "Total Swaps"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "h-4 w-4 text-primary" })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-2xl font-bold tracking-tight text-foreground",
							children: totalSwaps
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[11px] text-muted-foreground mt-1",
							children: "Exchanges logged"
						})] })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						className: "border border-border/50 shadow-soft",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, {
							className: "flex flex-row items-center justify-between space-y-0 pb-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
								className: "text-[11px] font-bold uppercase tracking-wider text-muted-foreground",
								children: "Completed Swaps"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClipboardList, { className: "h-4 w-4 text-success" })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-2xl font-bold tracking-tight text-success",
							children: completedSwaps
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[11px] text-muted-foreground mt-1",
							children: "Swaps executed in inventory"
						})] })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						className: "border border-border/50 shadow-soft",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, {
							className: "flex flex-row items-center justify-between space-y-0 pb-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
								className: "text-[11px] font-bold uppercase tracking-wider text-muted-foreground",
								children: "Pending Requests"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "h-4 w-4 text-warning" })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-2xl font-bold tracking-tight text-warning",
							children: pendingSwaps
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[11px] text-muted-foreground mt-1",
							children: "Awaiting dispatch/swap"
						})] })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						className: "border border-border/50 shadow-soft",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, {
							className: "flex flex-row items-center justify-between space-y-0 pb-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
								className: "text-[11px] font-bold uppercase tracking-wider text-muted-foreground",
								children: "Swaps This Month"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarDays, { className: "h-4 w-4 text-blue-500" })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-2xl font-bold tracking-tight text-foreground",
							children: swapsThisMonth
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-[11px] text-muted-foreground mt-1",
							children: ["In ", (/* @__PURE__ */ new Date()).toLocaleString("en-IN", { month: "long" })]
						})] })]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:max-w-2xl",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								placeholder: "Search Exchange ID, Customer, Agreement...",
								value: searchQuery,
								onChange: (e) => setSearchQuery(e.target.value),
								className: "pl-9 h-10 border-border/50 text-[13px] rounded-lg focus-visible:ring-1 focus-visible:ring-primary/45 w-full"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
							value: statusFilter,
							onValueChange: setStatusFilter,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
								className: "w-full sm:w-[160px] h-10 border-border/50 text-[13px] rounded-lg",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Filter Status" })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, {
								className: "border border-border/60 bg-popover shadow-elevated rounded-lg",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "all",
										className: "text-[13px] cursor-pointer",
										children: "All Statuses"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "Completed",
										className: "text-[13px] cursor-pointer",
										children: "Completed"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "Pending",
										className: "text-[13px] cursor-pointer",
										children: "Pending"
									})
								]
							})]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						onClick: () => setOpenCreate(true),
						className: "h-10 px-4 bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 rounded-lg font-medium text-[13px] shadow-sm cursor-pointer border-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "h-4.5 w-4.5" }), " New Exchange Request"]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
					className: "border border-border/50 shadow-soft overflow-hidden",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, {
						className: "bg-muted/40",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, {
							className: "hover:bg-transparent border-b border-border/40",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
									className: "font-semibold text-muted-foreground/80 h-11 text-[12.5px]",
									children: "Exchange ID"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
									className: "font-semibold text-muted-foreground/80 h-11 text-[12.5px]",
									children: "Date"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
									className: "font-semibold text-muted-foreground/80 h-11 text-[12.5px]",
									children: "Agreement No"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
									className: "font-semibold text-muted-foreground/80 h-11 text-[12.5px]",
									children: "Customer"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
									className: "font-semibold text-muted-foreground/80 h-11 text-[12.5px]",
									children: "Returned Item (Serial)"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
									className: "font-semibold text-muted-foreground/80 h-11 text-[12.5px]",
									children: "New Item (Serial)"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
									className: "font-semibold text-muted-foreground/80 h-11 text-[12.5px]",
									children: "Reason"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
									className: "font-semibold text-muted-foreground/80 h-11 text-[12.5px]",
									children: "Status"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
									className: "font-semibold text-muted-foreground/80 h-11 text-[12.5px] text-right",
									children: "Actions"
								})
							]
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableBody, { children: filteredExchanges.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableRow, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
						colSpan: 9,
						className: "text-center py-10 text-muted-foreground text-[13px]",
						children: "No exchange requests found."
					}) }) : filteredExchanges.map((exc) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, {
						className: "hover:bg-muted/10 border-b border-border/40 transition-colors",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
								className: "font-semibold text-foreground text-[13px]",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: exc.id })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
								className: "text-[13px] text-slate-600",
								children: formatDateDDMMYYYY(exc.exchangeDate)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
								className: "text-[13px] font-medium text-primary",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: exc.agreementId })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
								className: "text-[13px] font-semibold text-slate-800",
								children: exc.customer
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, {
								className: "text-[13px] text-slate-600",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: exc.currentEquipment }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
									className: "text-[11px] text-muted-foreground",
									children: exc.currentEquipmentSerial
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
								className: "text-[13px] text-slate-600",
								children: exc.newEquipment ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: exc.newEquipment }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
									className: "text-[11px] text-muted-foreground",
									children: exc.newEquipmentSerial
								})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-muted-foreground italic text-[12px]",
									children: "Pending swap"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
								className: "text-[13px] text-slate-500 max-w-[200px] truncate",
								title: exc.reason,
								children: exc.reason
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
								className: "text-[13px]",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, { status: exc.status })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
								className: "text-right",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-end gap-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "ghost",
										size: "icon",
										className: "h-8 w-8 hover:bg-slate-100 rounded-md",
										onClick: () => setSelectedExchange(exc),
										title: "View Details",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { className: "h-4 w-4 text-slate-600" })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "ghost",
										size: "icon",
										className: "h-8 w-8 hover:bg-slate-100 rounded-md",
										onClick: () => printExchangeSlip(exc),
										title: "Print Exchange Slip",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Printer, { className: "h-4 w-4 text-slate-600" })
									})]
								})
							})
						]
					}, exc.id)) })] })
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: openCreate,
				onOpenChange: setOpenCreate,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
					className: "max-w-2xl bg-white border border-slate-100 rounded-[16px] sm:rounded-[20px] p-4 sm:p-6 shadow-[0_20px_50px_rgba(15,23,42,0.06)] max-h-[90vh] overflow-y-auto",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, {
						className: "border-b border-slate-100 pb-3",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, {
							className: "text-lg font-bold text-slate-900 flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "h-5 w-5 text-primary animate-[spin_3s_linear_infinite]" }), " Create Exchange Request"]
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit: handleSubmit,
						className: "space-y-4 pt-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-1 sm:grid-cols-2 gap-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										className: "text-[11px] font-bold uppercase tracking-wider text-slate-400",
										children: "Exchange ID (Auto)"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: exchangeId,
										disabled: true,
										className: "h-10 bg-slate-50 border-slate-200 text-slate-500 font-semibold text-[13px] rounded-lg"
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										className: "text-[11px] font-bold uppercase tracking-wider text-slate-400",
										children: "Exchange Date"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										type: "date",
										value: exchangeDate,
										onChange: (e) => setExchangeDate(e.target.value),
										required: true,
										className: "h-10 border-slate-200 text-slate-700 text-[13px] rounded-lg"
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-1 sm:grid-cols-2 gap-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										className: "text-[11px] font-bold uppercase tracking-wider text-slate-400",
										children: "Rental Agreement No"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Combobox, {
										options: rentals.filter((r) => r.status === "Active" || r.status === "Overdue").map((r) => {
											const cust = customers.find((c) => c.id === r.customerId || c.name && r.customer && c.name.toLowerCase() === r.customer.toLowerCase());
											const phone1 = r.phone || cust?.phone || "";
											const phones = [
												phone1,
												r.altPhone || cust?.altPhone || "",
												r.contactNumber3 || cust?.contactNumber3 || ""
											].filter(Boolean).join(" ");
											const displayPhone = phone1 ? ` · ${phone1}` : "";
											return {
												value: r.id,
												label: `${r.id} — ${r.customer}${displayPhone}`,
												searchTerms: `${r.customerId || ""} ${r.customer || ""} ${phones} ${r.equipment || ""} ${r.serial || ""}`
											};
										}),
										value: selectedAgreementId,
										onValueChange: setSelectedAgreementId,
										placeholder: "Select active rental...",
										searchPlaceholder: "Search agreement no, customer or contact number..."
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										className: "text-[11px] font-bold uppercase tracking-wider text-slate-400",
										children: "Customer"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: customerName || "No rental selected",
										disabled: true,
										className: "h-10 bg-slate-50 border-slate-200 text-slate-500 font-semibold text-[13px] rounded-lg"
									})]
								})]
							}),
							selectedAgreementId && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "p-4 bg-blue-50/50 border border-blue-100 rounded-xl space-y-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
										className: "text-[11px] font-bold uppercase tracking-wider text-blue-600",
										children: "Equipment Swap Details"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-1 sm:grid-cols-2 gap-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-1.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												className: "text-[11px] font-bold uppercase tracking-wider text-slate-500",
												children: "Current Equipment (To Return)"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
												value: currentEquipmentId,
												onValueChange: setCurrentEquipmentId,
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
													className: "h-10 border-slate-200 bg-white text-[13px] rounded-lg w-full",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Select item to return" })
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, {
													className: "border border-border/60 bg-popover shadow-elevated rounded-lg",
													children: agreementItems.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectItem, {
														value: item.equipmentId,
														children: [
															item.name || getEquipmentNameFromInventory(item.equipmentId),
															" ",
															item.serial ? `— ${item.serial}` : ""
														]
													}, item.equipmentId))
												})]
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-1.5",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
													className: "text-[11px] font-bold uppercase tracking-wider text-slate-500",
													children: "New Equipment (To Swap)"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Combobox, {
													options: availableEquipment.map((e) => ({
														value: e.id,
														label: e.serial ? `${e.name} — ${e.serial}` : e.name
													})),
													value: newEquipmentId,
													onValueChange: setNewEquipmentId,
													placeholder: "Select available item...",
													searchPlaceholder: "Search available inventory..."
												}),
												availableEquipment.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-[11px] text-destructive mt-1 font-medium",
													children: "No items available in inventory"
												})
											]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-1 sm:grid-cols-2 gap-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-1.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												className: "text-[11px] font-bold uppercase tracking-wider text-slate-500",
												children: "Returned Item Release Condition"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
												value: releaseCondition,
												onValueChange: (val) => setReleaseCondition(val),
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
													className: "h-10 border-slate-200 bg-white text-[13px] rounded-lg",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Select condition" })
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, {
													className: "border border-border/60 bg-popover shadow-elevated rounded-lg",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
														value: "UnderMaintenance",
														className: "text-[13px] cursor-pointer",
														children: "Under Maintenance"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
														value: "Available",
														className: "text-[13px] cursor-pointer",
														children: "Good"
													})]
												})]
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-1.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												className: "text-[11px] font-bold uppercase tracking-wider text-slate-500",
												children: "Exchange Action"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
												value: exchangeStatus,
												onValueChange: (val) => setExchangeStatus(val),
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
													className: "h-10 border-slate-200 bg-white text-[13px] rounded-lg disabled:opacity-80 disabled:bg-slate-50",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Select status" })
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, {
													className: "border border-border/60 bg-popover shadow-elevated rounded-lg",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
														value: "Completed",
														className: "text-[13px] cursor-pointer",
														children: "Completed (Execute Swap Immediately)"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
														value: "Pending",
														className: "text-[13px] cursor-pointer",
														children: "Pending (Log Request Only)"
													})]
												})]
											})]
										})]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									className: "text-[11px] font-bold uppercase tracking-wider text-slate-400",
									children: "Reason for Exchange"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
									placeholder: "Describe why this exchange is needed (e.g., compressor issue, low purity level, upgrading device model)...",
									value: reason,
									onChange: (e) => setReason(e.target.value),
									required: true,
									rows: 3,
									className: "border-slate-200 text-slate-700 text-[13px] rounded-lg resize-none focus-visible:ring-1 focus-visible:ring-primary/45"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
								className: "border-t border-slate-100 pt-4 flex gap-2 justify-end",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogClose, {
									asChild: true,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										type: "button",
										variant: "outline",
										className: "h-10 rounded-lg text-[13px] border-slate-200 hover:bg-slate-50 cursor-pointer",
										children: "Cancel"
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									type: "submit",
									className: "h-10 px-5 bg-primary text-primary-foreground hover:bg-primary/95 rounded-lg text-[13px] font-medium cursor-pointer border-0 shadow-sm",
									children: "Save Exchange"
								})]
							})
						]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: !!selectedExchange,
				onOpenChange: (open) => !open && setSelectedExchange(null),
				children: selectedExchange && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
					className: "max-w-xl bg-white border border-slate-100 rounded-[16px] sm:rounded-[20px] p-4 sm:p-6 shadow-[0_20px_50px_rgba(15,23,42,0.06)]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, {
						className: "border-b border-slate-100 pb-3",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, {
							className: "text-lg font-bold text-slate-900",
							children: ["Exchange Details — ", selectedExchange.id]
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-5 pt-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[10px] uppercase font-bold text-slate-400 tracking-wider",
										children: "Agreement No"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[13px] font-semibold text-primary mt-0.5",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: selectedExchange.agreementId })
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[10px] uppercase font-bold text-slate-400 tracking-wider",
										children: "Exchange Date"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[13px] font-semibold text-slate-700 mt-0.5",
										children: formatDateDDMMYYYY(selectedExchange.exchangeDate)
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[10px] uppercase font-bold text-slate-400 tracking-wider",
											children: "Customer"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[13px] font-semibold text-slate-800 mt-0.5",
											children: selectedExchange.customer
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[10px] uppercase font-bold text-slate-400 tracking-wider",
											children: "Status"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "mt-0.5",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, { status: selectedExchange.status })
										})]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
									className: "text-[11px] font-bold uppercase tracking-wider text-slate-400",
									children: "Equipment Info"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "border border-slate-100 rounded-xl overflow-hidden",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, {
										className: "bg-slate-50/50",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, {
											className: "hover:bg-transparent",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
													className: "font-semibold text-slate-500 h-9 text-[11px]",
													children: "Role"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
													className: "font-semibold text-slate-500 h-9 text-[11px]",
													children: "Equipment"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
													className: "font-semibold text-slate-500 h-9 text-[11px]",
													children: "Serial"
												})
											]
										})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableBody, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, {
										className: "hover:bg-transparent",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
												className: "font-semibold text-red-600 text-[12px] py-2.5",
												children: "Returned (Old)"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
												className: "text-[12px] text-slate-700 py-2.5",
												children: selectedExchange.currentEquipment
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
												className: "text-[12px] py-2.5",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: selectedExchange.currentEquipmentSerial })
											})
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, {
										className: "hover:bg-transparent",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
												className: "font-semibold text-success text-[12px] py-2.5",
												children: "Assigned (New)"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
												className: "text-[12px] text-slate-700 py-2.5",
												children: selectedExchange.newEquipment || "—"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
												className: "text-[12px] py-2.5",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: selectedExchange.newEquipmentSerial || "—" })
											})
										]
									})] })] })
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1 bg-blue-50/20 border border-blue-50/60 p-3 rounded-lg",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[10px] uppercase font-bold text-slate-400 tracking-wider",
									children: "Returned Device Status"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-[12.5px] font-medium text-slate-700",
									children: ["Released in inventory as ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", {
										className: "font-semibold text-slate-800",
										children: selectedExchange.releaseCondition === "UnderMaintance" || selectedExchange.releaseCondition === "UnderMaintenance" ? "Under Maintenance" : selectedExchange.releaseCondition === "Returned to Owner" ? "Returned to Owner" : "Available"
									})]
								})]
							}),
							(selectedExchange.ownerName || selectedExchange.sourcingStatus) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1 bg-amber-50/30 border border-amber-100/60 p-3 rounded-lg",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[10px] uppercase font-bold text-amber-600 tracking-wider",
										children: "Owner Exchange Info"
									}),
									selectedExchange.ownerName && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-[12.5px] font-medium text-slate-700",
										children: ["Owner: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: selectedExchange.ownerName })]
									}),
									selectedExchange.sourcingStatus && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-[12px] text-slate-600",
										children: ["Sourcing: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: selectedExchange.sourcingStatus === "NeedFromOwner" ? "🔄 Need to Collect from Owner First" : "✅ Gave from Our Stock Directly" })]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[10px] uppercase font-bold text-slate-400 tracking-wider",
									children: "Reason for Exchange"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[13px] bg-slate-50 p-3 rounded-xl border border-slate-100/60 text-slate-700 leading-normal",
									children: selectedExchange.reason || "No reason specified."
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
								className: "border-t border-slate-100 pt-4 flex gap-2 justify-end",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									variant: "outline",
									onClick: () => printExchangeSlip(selectedExchange),
									className: "h-10 rounded-lg text-[13px] border-slate-200 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Printer, { className: "h-4 w-4" }), " Print Exchange Slip"]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogClose, {
									asChild: true,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "outline",
										className: "h-10 rounded-lg text-[13px] border-slate-200 hover:bg-slate-50 cursor-pointer",
										children: "Close"
									})
								})]
							})
						]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CompleteExchangeDialog, {
				exchange: completeExchange,
				equipmentList,
				open: !!completeExchange,
				onOpenChange: (open) => !open && setCompleteExchange(null),
				onComplete: refreshData
			})
		]
	});
}
function CompleteExchangeDialog({ exchange, equipmentList, open, onOpenChange, onComplete }) {
	const [newEquipmentId, setNewEquipmentId] = (0, import_react.useState)("");
	const [newEquipmentName, setNewEquipmentName] = (0, import_react.useState)("");
	const [newEquipmentSerial, setNewEquipmentSerial] = (0, import_react.useState)("");
	const [isSubmitting, setIsSubmitting] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (newEquipmentId) {
			const eq = equipmentList.find((e) => e.id === newEquipmentId);
			if (eq) {
				setNewEquipmentName(eq.name);
				setNewEquipmentSerial(eq.serial || "");
			}
		} else {
			setNewEquipmentName("");
			setNewEquipmentSerial("");
		}
	}, [newEquipmentId, equipmentList]);
	const returnedItemCategory = (() => {
		if (!exchange || !equipmentList) return null;
		const eq = equipmentList.find((e) => e.id === exchange.currentEquipmentId);
		return eq ? eq.category : null;
	})();
	const availableEquipment = equipmentList.filter((e) => {
		const isAvailable = String(e.status || "").trim().toLowerCase() === "available";
		const matchesCategory = !returnedItemCategory || e.category === returnedItemCategory;
		return isAvailable && matchesCategory;
	});
	const handleConfirm = () => {
		if (!newEquipmentId) {
			toast.error("Please select a replacement equipment item.");
			return;
		}
		setIsSubmitting(true);
		saveExchange({
			...exchange,
			newEquipmentId,
			newEquipment: newEquipmentName,
			newEquipmentSerial,
			releaseCondition: exchange.releaseCondition || "UnderMaintenance",
			status: "Completed"
		});
		toast.success(`Exchange ${exchange.id} successfully completed!`);
		setIsSubmitting(false);
		onOpenChange(false);
		onComplete();
	};
	if (!exchange) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "max-w-md bg-white border border-slate-100 rounded-[16px] sm:rounded-[20px] p-4 sm:p-6 shadow-[0_20px_50px_rgba(15,23,42,0.06)]",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, {
					className: "border-b border-slate-100 pb-3",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, {
						className: "text-lg font-bold text-slate-900 flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "h-5 w-5 text-success" }), " Complete Exchange Request"]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-4 pt-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "bg-slate-50 p-4 rounded-xl space-y-2 text-[13px] text-slate-700",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Exchange ID:" }),
								" ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: exchange.id })
							] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Customer:" }),
								" ",
								exchange.customer,
								" (",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: exchange.agreementId }),
								")"
							] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Returned Item:" }),
								" ",
								exchange.currentEquipment,
								" (Sr: ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: exchange.currentEquipmentSerial }),
								")"
							] }),
							returnedItemCategory && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Category:" }),
								" ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-semibold text-primary",
									children: returnedItemCategory
								})
							] })
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								className: "text-[11px] font-bold uppercase tracking-wider text-slate-500",
								children: "Select Replacement Equipment (In-Stock)"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Combobox, {
								options: availableEquipment.map((e) => ({
									value: e.id,
									label: e.serial ? `${e.name} — ${e.serial}` : e.name
								})),
								value: newEquipmentId,
								onValueChange: setNewEquipmentId,
								placeholder: "Select available replacement item...",
								searchPlaceholder: "Search available inventory..."
							}),
							availableEquipment.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-[11px] text-destructive font-medium",
								children: [
									"No items available in this category (",
									returnedItemCategory || "N/A",
									")"
								]
							})
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
					className: "border-t border-slate-100 pt-4 flex gap-2 justify-end mt-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogClose, {
						asChild: true,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							className: "h-10 rounded-lg text-[13px]",
							children: "Cancel"
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						onClick: handleConfirm,
						disabled: isSubmitting || !newEquipmentId,
						className: "h-10 px-5 bg-success hover:bg-success/90 text-white rounded-lg text-[13px] font-semibold border-0",
						children: "Confirm & Complete"
					})]
				})
			]
		})
	});
}
//#endregion
export { ExchangesPage as component };
