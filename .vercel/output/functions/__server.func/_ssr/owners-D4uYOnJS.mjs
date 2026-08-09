import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { H as parseLocalDate, I as getOwners, N as getNextOwnerNumber, R as getPayments, T as getEquipment, V as getReturns, et as saveOwner, g as formatDateDDMMYYYY, l as deleteOwner, p as downloadExcel, st as useDatabaseTrigger, z as getRentals } from "./data-store-BQmZefNN.mjs";
import { c as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { A as Printer, B as Mail, M as Phone, P as Package, Ut as Activity, Z as Handshake, at as FileText, dt as ExternalLink, h as Trash2, j as Plus, mt as Download, v as SquarePen, w as Search, x as ShieldCheck, z as MapPin } from "../_libs/lucide-react.mjs";
import { a as DialogFooter, c as DialogTrigger, i as DialogContent, l as Input, n as Dialog, o as DialogHeader, r as DialogClose, s as DialogTitle, t as Button, u as Label } from "./dialog-BHa0LWsH.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Textarea } from "./textarea-DE2ysOZI.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-C2rs2HGz.mjs";
import { a as CardContent, h as StatusBadge, i as Card, t as AppShell } from "./AppShell-BtlnpavN.mjs";
import { a as TableHeader, i as TableHead, n as TableBody, o as TableRow, r as TableCell, t as Table } from "./table-DDeHIPcn.mjs";
import { i as TabsTrigger, n as TabsContent, r as TabsList, t as Tabs } from "./tabs-BoOa83d5.mjs";
import { i as SheetTitle, n as SheetContent, r as SheetHeader, t as Sheet } from "./sheet-FhayDLmg.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/owners-D4uYOnJS.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function OwnerFormDialog({ title, owner, trigger, onSave }) {
	const [open, setOpen] = (0, import_react.useState)(false);
	const [name, setName] = (0, import_react.useState)(owner?.name || "");
	const [ownerName, setOwnerName] = (0, import_react.useState)(owner?.ownerName || "");
	const [inventorySeries, setInventorySeries] = (0, import_react.useState)(owner?.inventorySeries || "");
	const [phone, setPhone] = (0, import_react.useState)(owner?.phone || "");
	const [email, setEmail] = (0, import_react.useState)(owner?.email || "");
	const [address, setAddress] = (0, import_react.useState)(owner?.address || "");
	const [commissionRate, setCommissionRate] = (0, import_react.useState)(owner?.commissionRate?.toString() || "100");
	(0, import_react.useEffect)(() => {
		if (open && owner) {
			setName(owner.name);
			setOwnerName(owner.ownerName || "");
			setInventorySeries(owner.inventorySeries);
			setPhone(owner.phone);
			setEmail(owner.email);
			setAddress(owner.address || "");
			setCommissionRate(owner.commissionRate.toString());
		}
	}, [open, owner]);
	const handleSave = () => {
		if (!name) {
			toast.error("Organization Name is required.");
			return;
		}
		if (!ownerName) {
			toast.error("Owner Name is required.");
			return;
		}
		if (phone.trim()) {
			const isValidPhone = (p) => {
				return p.replace(/\D/g, "").length === 10;
			};
			if (!isValidPhone(phone)) {
				toast.error("Contact Phone Number must be exactly 10 digits.");
				return;
			}
		}
		const id = owner?.id || getNextOwnerNumber();
		const currentStatus = owner?.status || "Active";
		saveOwner({
			id,
			name,
			ownerName,
			inventorySeries: inventorySeries || "",
			phone,
			email,
			address,
			commissionRate: parseFloat(commissionRate) || 100,
			status: currentStatus
		});
		toast.success(owner ? `Owner "${name}" details updated successfully.` : "New equipment owner registered successfully.");
		if (onSave) onSave();
		setOpen(false);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, {
		open,
		onOpenChange: setOpen,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
			asChild: true,
			children: trigger
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "max-w-2xl max-h-[90vh] overflow-y-auto",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, {
					className: "flex items-center gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Handshake, { className: "h-5 w-5 text-primary" }),
						" ",
						title
					]
				}) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-4 py-2 sm:grid-cols-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Organization Name *",
							placeholder: "e.g. Zenith Medtech Solutions",
							value: name,
							onChange: (e) => setName(e.target.value)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Owner Name *",
							placeholder: "e.g. Dr. Amit Vyas",
							value: ownerName,
							onChange: (e) => setOwnerName(e.target.value)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Contact Phone",
							placeholder: "10-digit phone number",
							value: phone,
							onChange: (e) => {
								const digits = e.target.value.replace(/\D/g, "");
								if (digits.length > 10) if (digits.startsWith("91")) setPhone(digits.slice(-10));
								else if (digits.startsWith("0")) setPhone(digits.slice(-10));
								else setPhone(digits.slice(0, 10));
								else setPhone(digits);
							},
							maxLength: 14
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Contact Email",
							placeholder: "e.g. partner@zenith.com",
							type: "email",
							value: email,
							onChange: (e) => setEmail(e.target.value),
							className: "sm:col-span-2"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "sm:col-span-2 space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								className: "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
								children: "Office / Billing Address"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
								placeholder: "Full business address...",
								value: address,
								onChange: (e) => setAddress(e.target.value),
								className: "min-h-[70px] resize-none text-[13px]"
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "outline",
					type: "button",
					onClick: () => setOpen(false),
					children: "Cancel"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					onClick: handleSave,
					children: "Save Owner"
				})] })
			]
		})]
	});
}
function DeleteOwnerDialog({ owner, trigger, onDelete }) {
	const handleDelete = () => {
		deleteOwner(owner.id);
		toast.success(`Owner "${owner.name}" has been deleted.`);
		if (onDelete) onDelete();
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
		asChild: true,
		children: trigger
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
		className: "max-w-md",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, {
				className: "text-destructive flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-4 w-4" }), " Delete Owner Partner"]
			}) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "py-2 space-y-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-[13px] text-muted-foreground",
					children: [
						"Are you sure you want to delete ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
							className: "text-foreground",
							children: owner.name
						}),
						"?"
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[12px] text-amber-600 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 p-2.5 rounded-lg leading-relaxed font-medium",
					children: "Warning: This does not delete any associated equipment, but the equipment items will no longer be linked to an active partner record."
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogClose, {
				asChild: true,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "outline",
					type: "button",
					children: "Cancel"
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogClose, {
				asChild: true,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "destructive",
					type: "button",
					onClick: handleDelete,
					children: "Delete"
				})
			})] })
		]
	})] });
}
function OwnerDetailsSheet({ owner, open, onClose }) {
	const [stmtFromDate, setStmtFromDate] = (0, import_react.useState)("");
	const [stmtToDate, setStmtToDate] = (0, import_react.useState)("");
	const [stmtPerDayRate, setStmtPerDayRate] = (0, import_react.useState)("100");
	const [stmtCategory, setStmtCategory] = (0, import_react.useState)("all");
	if (!owner) return null;
	const equipment = getEquipment();
	const rentals = getRentals();
	const allReturns = getReturns();
	const ownedEquipment = equipment.filter((e) => e.owner?.toLowerCase() === owner.name.toLowerCase());
	const buildStatement = () => {
		const perDayRate = parseFloat(stmtPerDayRate) || 0;
		const rows = [];
		ownedEquipment.forEach((eq) => {
			if (stmtCategory !== "all" && eq.category !== stmtCategory) return;
			const eqRentals = rentals.filter((r) => {
				if (r.equipmentItems && r.equipmentItems.length > 0) return r.equipmentItems.some((ei) => ei.equipmentId === eq.id);
				return (r.equipmentId || "").split(",").map((s) => s.trim()).includes(eq.id);
			});
			if (eqRentals.length === 0) return;
			const sorted = [...eqRentals].sort((a, b) => {
				return parseLocalDate(a.start || "").getTime() - parseLocalDate(b.start || "").getTime();
			});
			let periodParts = [];
			let totalDays = 0;
			let totalAmount = 0;
			sorted.forEach((r) => {
				const start = parseLocalDate(r.start);
				if (isNaN(start.getTime())) return;
				if (stmtFromDate && start < parseLocalDate(stmtFromDate)) return;
				if (stmtToDate && start > parseLocalDate(stmtToDate)) return;
				const retRecord = allReturns.find((ret) => ret.agreement === r.id && (ret.returnedEquipmentIds || []).includes(eq.id));
				const endDateStr = retRecord?.date || retRecord?.returnDate || null;
				const endDate = endDateStr ? parseLocalDate(endDateStr) : /* @__PURE__ */ new Date();
				const isReturned = !!retRecord || r.status === "Completed";
				const diffMs = endDate.getTime() - start.getTime();
				const days = Math.max(1, Math.ceil(diffMs / (1e3 * 60 * 60 * 24)));
				const amount = days * perDayRate;
				periodParts.push(days.toString());
				totalDays += days;
				totalAmount += amount;
				rows.push({
					eqSerial: eq.serial,
					eqCategory: eq.category,
					customerName: r.customer || "Unknown",
					agreementId: r.id,
					dateTaken: r.start,
					periodFrom: r.start,
					periodTo: endDateStr || null,
					returnDate: isReturned ? endDateStr || r.end || "—" : "Not Returned",
					daysLabel: periodParts.join(" + "),
					totalDaysUpToNow: totalDays,
					perDayRate,
					totalAmount,
					isLatest: true
				});
			});
		});
		return rows;
	};
	const stmtRows = buildStatement();
	const uniqueCategories = Array.from(new Set(ownedEquipment.map((e) => e.category).filter(Boolean)));
	const handleDownloadStatement = () => {
		if (!owner) return;
		const allEquipment = getEquipment();
		const allRentals = getRentals();
		const allReturns = getReturns();
		const allPayments = getPayments();
		const ownedEquip = allEquipment.filter((e) => e.owner?.toLowerCase() === owner.name.toLowerCase());
		const ownedIds = new Set(ownedEquip.map((e) => e.id));
		const ownedMap = new Map(ownedEquip.map((e) => [e.id, e]));
		const txLog = [];
		allRentals.forEach((r) => {
			let itemsList = r.equipmentItems || [];
			if (itemsList.length === 0 && r.equipmentId) {
				const ids = r.equipmentId.split(",").map((s) => s.trim()).filter(Boolean);
				const serials = (r.serial || "").split(",").map((s) => s.trim()).filter(Boolean);
				itemsList = ids.map((id, idx) => ({
					equipmentId: id,
					serial: serials[idx] || "XXXX",
					returned: r.status === "Completed"
				}));
			}
			itemsList.forEach((item) => {
				if (ownedIds.has(item.equipmentId)) txLog.push({
					rental: r,
					equipmentId: item.equipmentId,
					serial: item.serial,
					returned: item.returned
				});
			});
		});
		txLog.sort((a, b) => {
			return parseLocalDate(a.rental.startDate || a.rental.start || "").getTime() - parseLocalDate(b.rental.startDate || b.rental.start || "").getTime();
		});
		const cleanDate = (dateStr) => {
			if (!dateStr || dateStr === "—" || dateStr === "-") return "";
			return dateStr.split("T")[0];
		};
		const headers = [
			"M/c Sl.No",
			"Agr. No",
			"Agr. Date",
			"Return Date",
			"Model",
			"Customer Name",
			"Given Again To",
			"Refund",
			"Pay",
			"Status",
			"Remarks"
		];
		const rows = txLog.map((tx) => {
			const eq = ownedMap.get(tx.equipmentId);
			const retRecord = allReturns.find((ret) => ret.agreement === tx.rental.id && (ret.returnedEquipmentIds || []).includes(tx.equipmentId));
			const returnDate = cleanDate(retRecord?.date || retRecord?.returnDate || (tx.returned ? tx.rental.endDate || tx.rental.end || "" : ""));
			const sameEqTx = txLog.filter((t) => t.equipmentId === tx.equipmentId);
			const curIdx = sameEqTx.findIndex((t) => t.rental.id === tx.rental.id);
			let givenAgainTo = "";
			if (curIdx !== -1 && curIdx + 1 < sameEqTx.length) {
				const nextTx = sameEqTx[curIdx + 1];
				givenAgainTo = `${nextTx.rental.customer || nextTx.rental.customerName || ""} (${nextTx.rental.id})`;
			}
			const refund = retRecord?.refundAmount || retRecord?.refund || "";
			const totalPaid = allPayments.filter((p) => p.agreement === tx.rental.id && p.status === "Paid").reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
			const payVal = totalPaid > 0 ? totalPaid.toString() : "";
			const statusVal = tx.returned ? "IN" : "OUT";
			const remarks = retRecord?.remarks || tx.rental.remarks || "";
			return [
				eq?.serial || tx.serial || "",
				tx.rental.id,
				cleanDate(tx.rental.startDate || tx.rental.start || ""),
				returnDate,
				eq?.category || eq?.name || "",
				tx.rental.customer || tx.rental.customerName || "",
				givenAgainTo,
				refund ? `Rs. ${Number(refund).toLocaleString("en-IN")}` : "",
				payVal ? `Rs. ${Number(payVal).toLocaleString("en-IN")}` : "",
				statusVal,
				remarks
			];
		});
		downloadExcel(`${owner.name.replace(/\s+/g, "_")}_statement.xls`, headers, rows, [
			110,
			150,
			110,
			110,
			180,
			180,
			220,
			100,
			100,
			80,
			200
		]);
		toast.success("Statement downloaded successfully!");
	};
	const handlePrintStatement = () => {
		if (!owner) return;
		const allEquipment = getEquipment();
		const allRentals = getRentals();
		const allReturns = getReturns();
		const allPayments = getPayments();
		const ownedEquip = allEquipment.filter((e) => e.owner?.toLowerCase() === owner.name.toLowerCase());
		const ownedIds = new Set(ownedEquip.map((e) => e.id));
		const ownedMap = new Map(ownedEquip.map((e) => [e.id, e]));
		const txLog = [];
		allRentals.forEach((r) => {
			let itemsList = r.equipmentItems || [];
			if (itemsList.length === 0 && r.equipmentId) {
				const ids = r.equipmentId.split(",").map((s) => s.trim()).filter(Boolean);
				const serials = (r.serial || "").split(",").map((s) => s.trim()).filter(Boolean);
				itemsList = ids.map((id, idx) => ({
					equipmentId: id,
					serial: serials[idx] || "XXXX",
					returned: r.status === "Completed"
				}));
			}
			itemsList.forEach((item) => {
				if (ownedIds.has(item.equipmentId)) txLog.push({
					rental: r,
					equipmentId: item.equipmentId,
					serial: item.serial,
					returned: item.returned
				});
			});
		});
		txLog.sort((a, b) => {
			return parseLocalDate(a.rental.startDate || a.rental.start || "").getTime() - parseLocalDate(b.rental.startDate || b.rental.start || "").getTime();
		});
		const printWindow = window.open("", "_blank");
		if (!printWindow) {
			toast.error("Popup blocked! Please allow popups to print statements.");
			return;
		}
		const rowsHtml = txLog.map((tx) => {
			const eq = ownedMap.get(tx.equipmentId);
			const retRecord = allReturns.find((ret) => ret.agreement === tx.rental.id && (ret.returnedEquipmentIds || []).includes(tx.equipmentId));
			const returnDate = retRecord?.date || retRecord?.returnDate || (tx.returned ? tx.rental.endDate || tx.rental.end || "—" : "—");
			const sameEqTx = txLog.filter((t) => t.equipmentId === tx.equipmentId);
			const curIdx = sameEqTx.findIndex((t) => t.rental.id === tx.rental.id);
			let givenAgainTo = "";
			if (curIdx !== -1 && curIdx + 1 < sameEqTx.length) {
				const nextTx = sameEqTx[curIdx + 1];
				givenAgainTo = `${nextTx.rental.customer || nextTx.rental.customerName || ""} & ${nextTx.rental.id}`;
			}
			const refund = retRecord?.refundAmount || retRecord?.refund || "";
			const totalPaid = allPayments.filter((p) => p.agreement === tx.rental.id && p.status === "Paid").reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
			const payVal = totalPaid > 0 ? `₹${totalPaid.toLocaleString("en-IN")}` : "—";
			const statusVal = tx.returned ? "IN" : "OUT";
			const remarks = retRecord?.remarks || tx.rental.remarks || "—";
			return `
        <tr>
          <td>${eq?.serial || tx.serial || "—"}</td>
          <td>${tx.rental.id}</td>
          <td>${tx.rental.startDate || tx.rental.start || "—"}</td>
          <td>${returnDate}</td>
          <td>${eq?.category || eq?.name || "—"}</td>
          <td>${tx.rental.customer || tx.rental.customerName || "—"}</td>
          <td>${givenAgainTo || "—"}</td>
          <td>${refund ? `₹${Number(refund).toLocaleString("en-IN")}` : "—"}</td>
          <td>${payVal}</td>
          <td class="status-${statusVal.toLowerCase()}">${statusVal}</td>
          <td>${remarks}</td>
        </tr>
      `;
		}).join("");
		const htmlContent = `
<html>
<head>
  <title>Owner Statement - ${owner.name}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; padding: 30px; color: #1e293b; }
    .header { margin-bottom: 30px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; }
    .header h1 { margin: 0; font-size: 24px; color: #0f172a; }
    .header p { margin: 5px 0 0 0; font-size: 14px; color: #64748b; }
    .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 30px; font-size: 13px; }
    .info-item span { font-weight: 600; color: #475569; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
    th { background-color: #f1f5f9; font-weight: bold; color: #334155; text-transform: uppercase; font-size: 9px; letter-spacing: 0.5px; }
    tr:nth-child(even) { background-color: #f8fafc; }
    .status-in { color: #16a34a; font-weight: bold; }
    .status-out { color: #d97706; font-weight: bold; }
    .footer { margin-top: 50px; font-size: 11px; text-align: center; color: #94a3b8; }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Owner Transaction Statement</h1>
    <p>Partner: ${owner.name}</p>
  </div>
  <div class="info-grid">
    <div class="info-item"><span>Owner Contact Name:</span> ${owner.ownerName || "—"}</div>
    <div class="info-item"><span>Phone:</span> ${owner.phone}</div>
    <div class="info-item"><span>Email:</span> ${owner.email}</div>
    <div class="info-item"><span>Commission Rate:</span> ${owner.commissionRate}%</div>
  </div>
  <table>
    <thead>
      <tr>
        <th>M/c Sl.No</th>
        <th>Agr.</th>
        <th>Agr. Date</th>
        <th>Return Date</th>
        <th>Model</th>
        <th>Customer Name</th>
        <th>Given Again To</th>
        <th>Refund</th>
        <th>Pay</th>
        <th>Status</th>
        <th>Remarks</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml || "<tr><td colspan=\"11\" style=\"text-align:center;padding:20px;\">No rental transactions found for this owner's equipment.</td></tr>"}
    </tbody>
  </table>
  <div class="footer">
    Generated on ${(/* @__PURE__ */ new Date()).toLocaleDateString("en-IN")} · Relife ERP System
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
		open,
		onOpenChange: onClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetContent, {
			className: "w-full sm:max-w-2xl overflow-y-auto",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetHeader, {
				className: "pb-4 border-b border-border/60",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "metric-icon h-12 w-12 border bg-primary/10 text-primary border-transparent",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Handshake, { className: "h-6 w-6" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetTitle, {
							className: "text-lg font-bold",
							children: owner.name
						}),
						owner.ownerName && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-[13px] font-medium text-foreground mt-0.5",
							children: ["Owner: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-semibold text-primary",
								children: owner.ownerName
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[11px] font-mono text-muted-foreground mt-0.5",
							children: owner.id
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-1.5",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: `inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold border ${owner.status === "Active" ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground border-border/50"}`,
								children: owner.status
							})
						})
					] })]
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
				defaultValue: "details",
				className: "mt-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, {
						className: "w-full",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
							value: "details",
							className: "flex-1",
							children: "Details & Inventory"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
							value: "statement",
							className: "flex-1",
							children: "Monthly Rental Statement"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
						value: "details",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-2.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "outline",
								size: "sm",
								className: "flex-1 h-9 text-[12px] font-semibold border-primary/20 text-primary hover:bg-primary/5 flex items-center justify-center gap-1.5",
								onClick: handlePrintStatement,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Printer, { className: "h-4 w-4" }), " Print Statement"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "outline",
								size: "sm",
								className: "flex-1 h-9 text-[12px] font-semibold border-success/20 text-success hover:bg-success/5 flex items-center justify-center gap-1.5",
								onClick: handleDownloadStatement,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "h-4 w-4" }), " Download Statement"]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 space-y-6",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "text-[12px] font-bold uppercase tracking-wider text-muted-foreground",
									children: "Contact Information"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-1.5 text-[13px]",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-2 text-muted-foreground",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, { className: "h-3.5 w-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-foreground",
												children: owner.phone || "No phone added"
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-2 text-muted-foreground",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mail, { className: "h-3.5 w-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-foreground",
												children: owner.email || "No email added"
											})]
										}),
										owner.address && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-start gap-2 text-muted-foreground",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "h-3.5 w-3.5 mt-0.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-foreground",
												children: owner.address
											})]
										})
									]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex items-center justify-between border-b border-border/60 pb-2",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
										className: "text-[14px] font-bold",
										children: [
											"Owned Inventory (",
											ownedEquipment.length,
											")"
										]
									})
								}), ownedEquipment.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[12px] text-muted-foreground text-center py-8 bg-muted/10 rounded-xl border border-dashed border-border/60",
									children: "No inventory assigned to this owner yet. Add equipment in the inventory page and choose this owner to map."
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "space-y-2.5",
									children: ownedEquipment.map((eq) => {
										const activeRental = rentals.find((r) => r.equipmentId === eq.id && r.status !== "Completed");
										return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "rounded-xl border border-border/60 p-3 bg-card hover:bg-muted/10 transition-colors flex flex-col gap-1.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-start justify-between",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-[13px] font-bold text-foreground leading-snug",
													children: eq.name
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
													className: "text-[11px] text-muted-foreground mt-0.5",
													children: [
														eq.category,
														" · SN: ",
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "font-mono font-semibold",
															children: eq.serial
														})
													]
												})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, { status: eq.status })]
											}), activeRental && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "mt-1 pt-1.5 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground bg-primary/5 p-1.5 rounded",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "flex items-center gap-1.5 text-primary font-medium",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "h-3 w-3" }), " Active Rental"]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "font-medium text-foreground",
													children: [
														activeRental.customer,
														" (",
														activeRental.id,
														")"
													]
												})]
											})]
										}, eq.id);
									})
								})]
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
						value: "statement",
						className: "pt-4 space-y-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-xl border border-border/60 bg-muted/10 p-4 space-y-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[11px] font-bold uppercase tracking-wider text-muted-foreground",
								children: "Statement Filters"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-3 sm:grid-cols-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											className: "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground",
											children: "Category"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
											value: stmtCategory,
											onChange: (e) => setStmtCategory(e.target.value),
											className: "w-full h-9 rounded-md border border-border/60 bg-background px-3 text-[13px] focus:outline-none focus:ring-1 focus:ring-primary/40",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "all",
												children: "All Categories"
											}), uniqueCategories.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: c,
												children: c
											}, c))]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											className: "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground",
											children: "Per Day Rate (₹)"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											type: "number",
											placeholder: "e.g. 100",
											value: stmtPerDayRate,
											onChange: (e) => setStmtPerDayRate(e.target.value),
											className: "h-9 text-[13px]"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											className: "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground",
											children: "From Date"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											type: "date",
											value: stmtFromDate,
											onChange: (e) => setStmtFromDate(e.target.value),
											className: "h-9 text-[13px]"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											className: "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground",
											children: "To Date"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											type: "date",
											value: stmtToDate,
											onChange: (e) => setStmtToDate(e.target.value),
											className: "h-9 text-[13px]"
										})]
									})
								]
							})]
						}), stmtRows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[12px] text-muted-foreground text-center py-10 border border-dashed border-border/60 rounded-xl bg-muted/10",
							children: "No rental activity found for this owner's equipment with the selected filters."
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-xl border border-border/60 overflow-hidden",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "px-4 py-2.5 bg-muted/20 border-b border-border/50",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-[11px] font-bold uppercase tracking-wider text-muted-foreground",
									children: [
										owner.name,
										" — Monthly Rental Statement",
										stmtFromDate && stmtToDate ? ` (${stmtFromDate} to ${stmtToDate})` : ""
									]
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "overflow-x-auto",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
									className: "w-full text-[11.5px]",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
											className: "bg-muted/30 border-b border-border/50",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
													className: "px-3 py-2 text-left font-semibold text-muted-foreground",
													children: "Sr."
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
													className: "px-3 py-2 text-left font-semibold text-muted-foreground",
													children: "Owner"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
													className: "px-3 py-2 text-left font-semibold text-muted-foreground",
													children: "Category"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
													className: "px-3 py-2 text-left font-semibold text-muted-foreground",
													children: "Machine / S.No"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
													className: "px-3 py-2 text-left font-semibold text-muted-foreground",
													children: "Customer"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
													className: "px-3 py-2 text-left font-semibold text-muted-foreground",
													children: "Date Taken"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
													className: "px-3 py-2 text-left font-semibold text-muted-foreground",
													children: "Return Date"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
													className: "px-3 py-2 text-right font-semibold text-muted-foreground",
													children: "Days Used"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
													className: "px-3 py-2 text-right font-semibold text-muted-foreground",
													children: "Per Day (₹)"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
													className: "px-3 py-2 text-right font-semibold text-muted-foreground",
													children: "Total (₹)"
												})
											] })
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
											className: "divide-y divide-border/30",
											children: stmtRows.map((row, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
												className: "hover:bg-muted/10",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
														className: "px-3 py-2 font-mono text-muted-foreground",
														children: idx + 1
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
														className: "px-3 py-2 font-semibold",
														children: owner.name
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
														className: "px-3 py-2 text-muted-foreground",
														children: row.eqCategory
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
														className: "px-3 py-2 font-mono text-[11px]",
														children: row.eqSerial
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
														className: "px-3 py-2",
														children: row.customerName
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
														className: "px-3 py-2 text-muted-foreground",
														children: row.dateTaken ? formatDateDDMMYYYY(row.dateTaken) : "—"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
														className: "px-3 py-2",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: row.returnDate === "Not Returned" ? "text-warning-foreground font-semibold" : "text-muted-foreground",
															children: row.returnDate === "Not Returned" ? "Not Returned" : formatDateDDMMYYYY(row.returnDate)
														})
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
														className: "px-3 py-2 text-right font-bold text-foreground",
														children: row.daysLabel
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
														className: "px-3 py-2 text-right text-muted-foreground",
														children: row.perDayRate
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
														className: "px-3 py-2 text-right font-bold text-primary",
														children: ["₹", row.totalAmount.toLocaleString("en-IN")]
													})
												]
											}, idx))
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("tfoot", {
											className: "bg-muted/20 border-t border-border/50 font-bold",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
													colSpan: 7,
													className: "px-3 py-2.5 text-right text-[12px]",
													children: "Grand Total"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
													className: "px-3 py-2.5 text-right text-[12px]",
													children: [stmtRows[stmtRows.length - 1]?.totalDaysUpToNow || 0, " days"]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { className: "px-3 py-2.5" }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
													className: "px-3 py-2.5 text-right text-[13px] text-primary",
													children: ["₹", stmtRows.reduce((s, r) => s + r.totalAmount, 0).toLocaleString("en-IN")]
												})
											] })
										})
									]
								})
							})]
						})]
					})
				]
			})]
		})
	});
}
function OwnersPage() {
	const dbVersion = useDatabaseTrigger();
	const [owners, setOwners] = (0, import_react.useState)([]);
	const [equipment, setEquipment] = (0, import_react.useState)([]);
	const [search, setSearch] = (0, import_react.useState)("");
	const [statusTab, setStatusTab] = (0, import_react.useState)("all");
	const [selectedOwner, setSelectedOwner] = (0, import_react.useState)(null);
	const [detailsOpen, setDetailsOpen] = (0, import_react.useState)(false);
	const isStaff = typeof window !== "undefined" && localStorage.getItem("medirent-user-role") === "Staff";
	const refreshData = () => {
		setOwners(getOwners());
		setEquipment(getEquipment());
	};
	(0, import_react.useEffect)(() => {
		refreshData();
	}, [dbVersion]);
	const filteredOwners = owners.filter((o) => {
		const q = search.toLowerCase();
		const matchesSearch = !q || o.name.toLowerCase().includes(q) || (o.ownerName || "").toLowerCase().includes(q) || o.phone.toLowerCase().includes(q);
		const matchesStatus = statusTab === "all" || o.status.toLowerCase() === statusTab.toLowerCase();
		return matchesSearch && matchesStatus;
	});
	const totalOwners = owners.length;
	const activeOwnersCount = owners.filter((o) => o.status === "Active").length;
	const partnerOwnedCount = equipment.filter((e) => e.owner && e.owner.toLowerCase() !== "medirent" && e.owner.toLowerCase() !== "medirent healthcare").length;
	const partnerRentedCount = equipment.filter((e) => e.owner && e.owner.toLowerCase() !== "medirent" && e.owner.toLowerCase() !== "medirent healthcare" && (e.status === "Rented" || e.status === "Active")).length;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "Equipment Owners",
		subtitle: "Manage partner contracts, commissions, and owned inventories",
		actions: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OwnerFormDialog, {
			title: "Add New Owner",
			onSave: refreshData,
			trigger: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				size: "sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "mr-1.5 h-3.5 w-3.5" }), "Add Owner"]
			})
		}),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 mb-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						className: "relative overflow-hidden hover:shadow-[var(--shadow-elevated)] hover:-translate-y-0.5 transition-all",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
							className: "p-5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-start justify-between gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground/65",
									children: "Total Owners"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-2 font-display text-[26px] font-bold tracking-tight",
									children: totalOwners
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "metric-icon h-10 w-10 shrink-0",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Handshake, { className: "h-4.5 w-4.5 text-muted-foreground" })
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-3 text-[12px] text-muted-foreground/70",
								children: [
									activeOwnersCount,
									" Active / ",
									totalOwners - activeOwnersCount,
									" Inactive agreements"
								]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-x-0 bottom-0 h-[2px] bg-primary/50" })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						className: "relative overflow-hidden hover:shadow-[var(--shadow-elevated)] hover:-translate-y-0.5 transition-all",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
							className: "p-5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-start justify-between gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground/65",
									children: "Active Owners"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-2 font-display text-[26px] font-bold tracking-tight text-success",
									children: activeOwnersCount
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "metric-icon h-10 w-10 shrink-0",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "h-4.5 w-4.5 text-success" })
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-3 text-[12px] text-muted-foreground/70",
								children: [
									"Live active agreements (",
									totalOwners - activeOwnersCount,
									" inactive)"
								]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-x-0 bottom-0 h-[2px] bg-success/50" })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						className: "relative overflow-hidden hover:shadow-[var(--shadow-elevated)] hover:-translate-y-0.5 transition-all",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
							className: "p-5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-start justify-between gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground/65",
									children: "Partner Inventory"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-2 font-display text-[26px] font-bold tracking-tight text-primary",
									children: [
										partnerOwnedCount,
										" ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[14px] text-muted-foreground font-normal",
											children: "items"
										})
									]
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "metric-icon h-10 w-10 shrink-0",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { className: "h-4.5 w-4.5 text-primary" })
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-3 text-[12px] text-muted-foreground/70",
								children: "Devices supplied by partners"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-x-0 bottom-0 h-[2px] bg-primary/50" })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						className: "relative overflow-hidden hover:shadow-[var(--shadow-elevated)] hover:-translate-y-0.5 transition-all",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
							className: "p-5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-start justify-between gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground/65",
									children: "Rented Units"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-2 font-display text-[26px] font-bold tracking-tight text-warning-foreground",
									children: [
										partnerRentedCount,
										" ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[14px] text-muted-foreground font-normal",
											children: "items"
										})
									]
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "metric-icon h-10 w-10 shrink-0",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Activity, { className: "h-4.5 w-4.5 text-warning-foreground" })
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-3 text-[12px] text-muted-foreground/70",
								children: "Partner devices currently rented"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-x-0 bottom-0 h-[2px] bg-warning/50" })]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-5 flex flex-wrap items-center gap-3 border-b border-border/60 pb-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative flex-1 min-w-[240px]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						placeholder: "Search by owner name or agreement number…",
						className: "pl-9 h-9 text-[13px]",
						value: search,
						onChange: (e) => setSearch(e.target.value)
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
					value: statusTab,
					onValueChange: setStatusTab,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
						className: "w-[150px] h-9 text-[12px]",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "All Status" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: "all",
							children: "All Status"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: "active",
							children: "Active"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: "inactive",
							children: "Inactive"
						})
					] })]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
				className: "overflow-hidden",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
					className: "p-0",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Owner Details" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Contact Info" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
							className: "text-right",
							children: "Owned Items"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Status" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
							className: "w-[120px] text-right",
							children: "Actions"
						})
					] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableBody, { children: filteredOwners.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableRow, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
						colSpan: 7,
						className: "py-12 text-center text-muted-foreground text-[13px]",
						children: "No equipment owners match your search filter."
					}) }) : filteredOwners.map((owner) => {
						const ownedCount = equipment.filter((e) => e.owner?.toLowerCase() === owner.name.toLowerCase()).length;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, {
							className: "group",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-bold text-[14px] text-foreground",
										children: owner.name
									}),
									owner.ownerName && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-[12px] text-muted-foreground mt-0.5",
										children: ["Owner: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-medium text-foreground/80",
											children: owner.ownerName
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[11px] font-mono text-muted-foreground/60 mt-0.5",
										children: owner.id
									})
								] }) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "text-[12px] space-y-0.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-foreground",
										children: owner.phone
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-muted-foreground font-mono",
										children: owner.email
									})]
								}) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
									className: "text-right",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										variant: "ghost",
										size: "sm",
										className: "h-7 text-[12px] font-semibold px-2 hover:bg-primary/10 hover:text-primary rounded-md",
										onClick: () => {
											setSelectedOwner(owner);
											setDetailsOpen(true);
										},
										children: [
											ownedCount,
											" items",
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { className: "h-3 w-3 ml-1" })
										]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: `inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${owner.status === "Active" ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground border-border/50"}`,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `h-1.5 w-1.5 rounded-full bg-current ${owner.status === "Active" ? "animate-[pulse-dot_2.5s_ease-in-out_infinite]" : "opacity-50"}` }), owner.status]
								}) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
									className: "text-right",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "flex items-center justify-end gap-1.5",
										children: !isStaff && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OwnerFormDialog, {
											title: "Edit Owner Details",
											owner,
											onSave: refreshData,
											trigger: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												variant: "outline",
												size: "icon",
												className: "h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10",
												title: "Edit",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SquarePen, { className: "h-3.5 w-3.5" })
											})
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DeleteOwnerDialog, {
											owner,
											onDelete: refreshData,
											trigger: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												variant: "outline",
												size: "icon",
												className: "h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10",
												title: "Delete",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-3.5 w-3.5" })
											})
										})] })
									})
								})
							]
						}, owner.id);
					}) })] })
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OwnerDetailsSheet, {
				owner: selectedOwner,
				open: detailsOpen,
				onClose: () => setDetailsOpen(false)
			})
		]
	});
}
function Field({ label, placeholder, type = "text", className, value, onChange, maxLength }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `space-y-1.5 ${className ?? ""}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
			className: "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
			type,
			placeholder,
			value,
			onChange,
			maxLength,
			className: "h-10 text-[13px]"
		})]
	});
}
//#endregion
export { OwnersPage as component };
