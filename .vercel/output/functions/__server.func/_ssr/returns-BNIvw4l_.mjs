import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { B as getReturnCalculatedRentPerItem, D as getLocalYYYYMMDD, F as getNextReturnNumber, G as peekNextReturnNumber, H as parseLocalDate, I as getOwners, J as printReturnReceipt, L as getPaidForEquipment, P as getNextPaymentNumber, R as getPayments, T as getEquipment, V as getReturns, b as getCustomers, g as formatDateDDMMYYYY, i as cleanNum, it as sortLatestFirst, rt as saveReturn, st as useDatabaseTrigger, tt as savePayment, z as getRentals } from "./data-store-BXBhFJro.mjs";
import { c as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { Ct as CircleCheck, E as RotateCcw, I as MessageCircle, Mt as Calendar, O as Receipt, P as Package, St as CircleX, Ut as Activity, Y as History, _t as Copy, bt as Clock, c as User, gt as CreditCard, kt as Check, w as Search, wt as CircleAlert, x as ShieldCheck, y as SlidersVertical } from "../_libs/lucide-react.mjs";
import { a as DialogFooter, i as DialogContent, l as Input, n as Dialog, o as DialogHeader, r as DialogClose, s as DialogTitle, t as Button, u as Label } from "./dialog-BHa0LWsH.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Textarea } from "./textarea-DE2ysOZI.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-C2rs2HGz.mjs";
import { a as CardContent, h as StatusBadge, i as Card, o as CardHeader, s as CardTitle, t as AppShell } from "./AppShell-ABaTd-bJ.mjs";
import { a as TableHeader, i as TableHead, n as TableBody, o as TableRow, r as TableCell, t as Table } from "./table-DDeHIPcn.mjs";
import { t as Combobox } from "./combobox-DmZUdRIE.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/returns-BNIvw4l_.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function generateWhatsAppPickupMessage(params) {
	const name = params.customerName ? String(params.customerName) : "Customer";
	let formattedRentDate = "";
	if (params.rentDate) {
		const rentDateStr = String(params.rentDate);
		const d = parseLocalDate(rentDateStr);
		if (!isNaN(d.getTime())) formattedRentDate = `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getFullYear()).slice(-2)}`;
		else formattedRentDate = rentDateStr;
	}
	const line1 = formattedRentDate ? `${name} / ${formattedRentDate}` : name;
	const phoneList = [];
	if (params.phone != null && String(params.phone).trim() !== "") phoneList.push(String(params.phone).trim());
	if (params.altPhone != null && String(params.altPhone).trim() !== "") phoneList.push(String(params.altPhone).trim());
	const line2 = phoneList.join(" & ") || "N/A";
	const serialStr = params.serial != null ? String(params.serial) : "";
	const modelStr = params.model != null ? String(params.model) : "";
	const eqStr = params.equipment != null ? String(params.equipment) : "";
	const equipParts = [];
	if (serialStr && serialStr !== "XXXX") equipParts.push(serialStr);
	else if (modelStr && modelStr !== "Standard") equipParts.push(modelStr);
	if (equipParts.length === 0 && eqStr) equipParts.push(eqStr);
	const line3 = equipParts.join(" - ") || eqStr || "Equipment";
	const addrStr = params.address != null ? String(params.address).trim() : "";
	const areaStr = params.area != null ? String(params.area).trim() : "";
	const locAddrStr = params.locationAddress != null ? String(params.locationAddress).trim() : "";
	const addressParts = [];
	if (addrStr && addrStr !== "No address provided") addressParts.push(addrStr);
	if (areaStr && !addressParts.some((p) => p.toLowerCase().includes(areaStr.toLowerCase()))) addressParts.push(areaStr);
	const line4 = addressParts.join(", ") || (locAddrStr.startsWith("http") ? "" : locAddrStr) || areaStr || addrStr || "Customer Location";
	let mapLink = "";
	if (locAddrStr.startsWith("http://") || locAddrStr.startsWith("https://")) mapLink = locAddrStr;
	else if (addrStr.startsWith("http://") || addrStr.startsWith("https://")) mapLink = addrStr;
	else if (params.latitude && params.longitude && (Number(params.latitude) !== 0 || Number(params.longitude) !== 0)) mapLink = `https://www.google.com/maps?q=${params.latitude},${params.longitude}`;
	else {
		const queryParts = [];
		if (addrStr && addrStr !== "No address provided") queryParts.push(addrStr);
		if (areaStr && !queryParts.some((q) => q.toLowerCase().includes(areaStr.toLowerCase()))) queryParts.push(areaStr);
		const searchQuery = queryParts.join(", ") || areaStr || addrStr || "Mysore";
		mapLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchQuery)}`;
	}
	const line5 = mapLink;
	let line6 = "";
	if (params.collectAmount && params.collectAmount > 0) line6 = `Collect ${params.collectAmount}`;
	else if (params.refundAmount && params.refundAmount > 0) line6 = `Refund ${params.refundAmount}`;
	else line6 = `Collect 0`;
	return [
		line1,
		line2,
		line3,
		line4,
		line5,
		line6
	].filter(Boolean).join("\n");
}
function WhatsAppReturnMessageModal({ ret, rental, customer }) {
	const [open, setOpen] = (0, import_react.useState)(false);
	const [editedMsg, setEditedMsg] = (0, import_react.useState)("");
	const customerName = ret?.customer || rental?.customer || customer?.name || "Customer";
	const rentDate = rental?.start || ret?.date || "";
	const phone = customer?.phone || rental?.phone || "";
	const altPhone = customer?.altPhone || rental?.altPhone || "";
	const equipment = ret?.equipment || rental?.equipment || "Equipment";
	const serial = rental?.serial || ret?.serial || "";
	const model = rental?.model || "";
	const area = customer?.area || rental?.area || "";
	const address = customer?.address || rental?.address || "";
	const locationAddress = rental?.locationAddress || customer?.locationAddress || "";
	const latitude = rental?.latitude;
	const longitude = rental?.longitude;
	const pending = ret?.duePendingBalance !== void 0 ? ret.duePendingBalance : ret ? ret.refund < 0 ? Math.abs(ret.refund) : 0 : 0;
	const formattedMsg = (0, import_react.useMemo)(() => {
		return generateWhatsAppPickupMessage({
			customerName,
			rentDate,
			phone,
			altPhone,
			equipment,
			serial,
			model,
			area,
			address,
			locationAddress,
			latitude,
			longitude,
			collectAmount: pending > 0 ? pending : ret?.refund < 0 ? Math.abs(ret.refund) : 0,
			refundAmount: ret?.refund > 0 ? ret.refund : 0
		});
	}, [
		customerName,
		rentDate,
		phone,
		altPhone,
		equipment,
		serial,
		model,
		area,
		address,
		locationAddress,
		latitude,
		longitude,
		pending,
		ret
	]);
	(0, import_react.useEffect)(() => {
		if (open) setEditedMsg(formattedMsg);
	}, [open, formattedMsg]);
	const handleCopy = () => {
		navigator.clipboard.writeText(editedMsg || formattedMsg);
		toast.success("WhatsApp pickup message copied to clipboard!");
	};
	const handleSendWhatsApp = () => {
		const cleanPhone = String(phone || "").replace(/\D/g, "");
		const text = encodeURIComponent(editedMsg || formattedMsg);
		const targetUrl = cleanPhone ? `https://wa.me/91${cleanPhone}?text=${text}` : `https://wa.me/?text=${text}`;
		window.open(targetUrl, "_blank");
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
		variant: "outline",
		size: "sm",
		className: "h-7 px-2 text-[11px] font-bold text-emerald-700 bg-emerald-50/70 hover:bg-emerald-100 border-emerald-300 gap-1.5",
		onClick: () => setOpen(true),
		title: "WhatsApp Pickup Message",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { className: "h-3.5 w-3.5 text-emerald-600" }), " WhatsApp"]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange: setOpen,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "max-w-md",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, {
					className: "flex items-center gap-2 text-emerald-700 font-bold",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { className: "h-4.5 w-4.5" }), " WhatsApp Pickup Message"]
				}) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-3 py-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11.5px] text-muted-foreground",
						children: "Auto-generated formatted message for WhatsApp collection & pickup:"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
						value: editedMsg,
						onChange: (e) => setEditedMsg(e.target.value),
						rows: 7,
						className: "font-mono text-[12.5px] bg-muted/20 border-emerald-300 dark:border-emerald-900 focus-visible:ring-emerald-500 leading-relaxed font-semibold"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
					className: "flex-row items-center justify-between sm:justify-between gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						type: "button",
						variant: "outline",
						size: "sm",
						onClick: handleCopy,
						className: "gap-1.5 font-bold text-[12px]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "h-3.5 w-3.5 text-primary" }), " Copy Text"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						type: "button",
						size: "sm",
						onClick: handleSendWhatsApp,
						className: "bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 text-[12px]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { className: "h-3.5 w-3.5" }), " Send WhatsApp"]
					})]
				})
			]
		})
	})] });
}
function formatRentalDuration(startStr, endStr, rentCycle = "Monthly") {
	const start = parseLocalDate(startStr);
	const end = parseLocalDate(endStr);
	if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return "0 Days";
	const diffTime = end.getTime() - start.getTime();
	const totalDays = Math.max(1, Math.ceil(diffTime / (1e3 * 60 * 60 * 24)));
	if (rentCycle && rentCycle.toLowerCase() === "daily") return `${totalDays} Day${totalDays > 1 ? "s" : ""}`;
	let months = end.getFullYear() - start.getFullYear();
	months = months * 12 + (end.getMonth() - start.getMonth());
	let days = end.getDate() - start.getDate();
	if (days < 0) {
		months--;
		const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
		days += prevMonth.getDate();
	}
	if (months === 0) return `${totalDays} Day${totalDays > 1 ? "s" : ""}`;
	if (days === 0) return `${months} Month${months > 1 ? "s" : ""}`;
	return `${months} Month${months > 1 ? "s" : ""} ${days} Day${days > 1 ? "s" : ""}`;
}
function PayReturnDueDialog({ ret, onSave }) {
	const [open, setOpen] = (0, import_react.useState)(false);
	const totalCollectible = Math.abs(ret.refund || 0);
	const existingPaid = ret.duePaidAmount !== void 0 ? ret.duePaidAmount : ret.duePaymentStatus === "Paid" ? totalCollectible : 0;
	const currentPending = ret.duePendingBalance !== void 0 ? ret.duePendingBalance : Math.max(0, totalCollectible - existingPaid);
	const [payAmount, setPayAmount] = (0, import_react.useState)(currentPending.toString());
	const [paymentMode, setPaymentMode] = (0, import_react.useState)("Cash");
	const [paymentDate, setPaymentDate] = (0, import_react.useState)(() => getLocalYYYYMMDD());
	const [txRef, setTxRef] = (0, import_react.useState)("");
	const [cashAmount, setCashAmount] = (0, import_react.useState)("");
	const [bankAmount, setBankAmount] = (0, import_react.useState)("");
	const [isSubmitting, setIsSubmitting] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (open) {
			const pending = ret.duePendingBalance !== void 0 ? ret.duePendingBalance : Math.max(0, totalCollectible - (ret.duePaidAmount !== void 0 ? ret.duePaidAmount : ret.duePaymentStatus === "Paid" ? totalCollectible : 0));
			setPayAmount(pending.toString());
			setPaymentMode("Cash");
			setPaymentDate(getLocalYYYYMMDD());
			setTxRef("");
			const cAmt = Math.round(pending / 2);
			setCashAmount(cAmt.toString());
			setBankAmount((pending - cAmt).toString());
		}
	}, [
		open,
		ret,
		totalCollectible
	]);
	const handlePayDue = () => {
		const amt = Number(payAmount) || 0;
		if (amt <= 0) {
			toast.error("Please enter a valid payment amount.");
			return;
		}
		setIsSubmitting(true);
		if (paymentMode === "Cash+Bank") {
			let cAmt = Number(cashAmount) || 0;
			let bAmt = Number(bankAmount) || 0;
			if (cAmt + bAmt !== amt) bAmt = Math.max(0, amt - cAmt);
			if (cAmt > 0) savePayment({
				id: getNextPaymentNumber(),
				date: paymentDate,
				customer: ret.customer,
				customerId: ret.customerId || "",
				agreement: ret.agreement,
				amount: cAmt,
				mode: "Cash",
				type: "Rent",
				notes: `Return Due Settlement (Cash portion) for Return ${ret.id} (${ret.equipment})`,
				status: "Paid"
			});
			if (bAmt > 0) savePayment({
				id: getNextPaymentNumber(),
				date: paymentDate,
				customer: ret.customer,
				customerId: ret.customerId || "",
				agreement: ret.agreement,
				amount: bAmt,
				mode: "Bank",
				type: "Rent",
				txRef,
				notes: `Return Due Settlement (Bank portion) for Return ${ret.id} (${ret.equipment})`,
				status: "Paid"
			});
		} else savePayment({
			id: getNextPaymentNumber(),
			date: paymentDate,
			customer: ret.customer,
			customerId: ret.customerId || "",
			agreement: ret.agreement,
			amount: amt,
			mode: paymentMode,
			type: "Rent",
			txRef,
			notes: `Return Due Settlement for Return ${ret.id} (${ret.equipment})`,
			status: "Paid"
		});
		const newTotalPaid = existingPaid + amt;
		const newRemainingPending = Math.max(0, totalCollectible - newTotalPaid);
		const newStatus = newRemainingPending <= 0 ? "Paid" : "Partial";
		saveReturn({
			...ret,
			duePaymentStatus: newStatus,
			duePaymentMode: paymentMode,
			dueTxRef: txRef,
			duePaidAmount: newTotalPaid,
			duePendingBalance: newRemainingPending,
			status: newRemainingPending <= 0 ? "Completed" : ret.status
		});
		toast.success(`₹${amt.toLocaleString("en-IN")} payment recorded for Return ${ret.id}! Remaining due: ₹${newRemainingPending.toLocaleString("en-IN")}.`);
		setIsSubmitting(false);
		setOpen(false);
		if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("medirent-db-updated"));
		onSave();
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
		variant: "outline",
		size: "sm",
		className: "h-7 px-2 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-300 gap-1",
		onClick: () => setOpen(true),
		title: "Pay Due Amount",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CreditCard, { className: "h-3 w-3" }), " Pay Due"]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange: setOpen,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "max-w-md",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, {
					className: "flex items-center gap-2 text-emerald-700",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CreditCard, { className: "h-4 w-4" }), " Settle Return Due Payment"]
				}) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-4 py-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-xl border border-amber-200 bg-amber-50/50 p-3 text-[12.5px] space-y-1",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between font-bold text-foreground",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Return ID: ", ret.id] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-mono text-primary",
										children: ret.agreement
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-muted-foreground",
									children: ["Customer: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: ret.customer })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-muted-foreground",
									children: ["Equipment: ", ret.equipment]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "border-t border-amber-200/60 pt-1.5 flex justify-between font-bold text-rose-700 text-[13.5px]",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Outstanding Return Due:" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["₹", currentPending.toLocaleString("en-IN")] })]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-2 gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									className: "text-[11px] font-bold uppercase tracking-wider text-muted-foreground",
									children: "Amount Collected (₹)"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									type: "number",
									value: payAmount,
									onChange: (e) => setPayAmount(e.target.value),
									className: "h-9 font-bold text-foreground"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									className: "text-[11px] font-bold uppercase tracking-wider text-muted-foreground",
									children: "Payment Date"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									type: "date",
									value: paymentDate,
									onChange: (e) => setPaymentDate(e.target.value),
									className: "h-9"
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								className: "text-[11px] font-bold uppercase tracking-wider text-muted-foreground",
								children: "Payment Mode"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
								value: paymentMode,
								onValueChange: setPaymentMode,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
									className: "h-9 text-[13px] bg-background",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "Cash",
										children: "Cash"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "Bank",
										children: "Bank"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "Cash+Bank",
										children: "Cash + Bank"
									})
								] })]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								className: "text-[11px] font-bold uppercase tracking-wider text-muted-foreground",
								children: "Txn / Ref No. (Optional)"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								placeholder: "UPI ref, cheque no, bank ref",
								value: txRef,
								onChange: (e) => setTxRef(e.target.value),
								className: "h-9 text-[13px]"
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogClose, {
					asChild: true,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						type: "button",
						children: "Cancel"
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					type: "button",
					className: "bg-emerald-600 hover:bg-emerald-700 text-white font-bold",
					onClick: handlePayDue,
					disabled: isSubmitting,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "mr-1.5 h-3.5 w-3.5" }), " Record & Mark Paid"]
				})] })
			]
		})
	})] });
}
function ReturnsPage() {
	const dbVersion = useDatabaseTrigger();
	const [rentals, setRentals] = (0, import_react.useState)(() => getRentals());
	const [mockReturns, setMockReturns] = (0, import_react.useState)(() => getReturns());
	const customers = (0, import_react.useMemo)(() => getCustomers(), [dbVersion]);
	const owners = (0, import_react.useMemo)(() => getOwners(), [dbVersion]);
	const [selectedAgreement, setSelectedAgreement] = (0, import_react.useState)("");
	const [returnDate, setReturnDate] = (0, import_react.useState)("");
	const [condition, setCondition] = (0, import_react.useState)("");
	const [damageCharges, setDamageCharges] = (0, import_react.useState)("0");
	const [finalRent, setFinalRent] = (0, import_react.useState)("0");
	const [pendingBalance, setPendingBalance] = (0, import_react.useState)("0");
	const [totalPaidAmount, setTotalPaidAmount] = (0, import_react.useState)("0");
	const [notes, setNotes] = (0, import_react.useState)("");
	const [collectedBy, setCollectedBy] = (0, import_react.useState)(() => {
		return typeof window !== "undefined" ? localStorage.getItem("medirent-user-name") || "" : "";
	});
	const [submitted, setSubmitted] = (0, import_react.useState)(false);
	const [isSubmitting, setIsSubmitting] = (0, import_react.useState)(false);
	const [selectedEquipmentIds, setSelectedEquipmentIds] = (0, import_react.useState)([]);
	const [discount, setDiscount] = (0, import_react.useState)("0");
	const [duePaymentStatus, setDuePaymentStatus] = (0, import_react.useState)("Paid");
	const [duePaymentMode, setDuePaymentMode] = (0, import_react.useState)("Cash");
	const [dueTxRef, setDueTxRef] = (0, import_react.useState)("");
	const [duePaidAmount, setDuePaidAmount] = (0, import_react.useState)("");
	const [dueCashAmount, setDueCashAmount] = (0, import_react.useState)("");
	const [dueBankAmount, setDueBankAmount] = (0, import_react.useState)("");
	const lastSelectedAgreementRef = (0, import_react.useRef)("");
	const [historySearch, setHistorySearch] = (0, import_react.useState)("");
	const isStaff = typeof window !== "undefined" && localStorage.getItem("medirent-user-role") === "Staff";
	(0, import_react.useEffect)(() => {
		const params = new URLSearchParams(window.location.search);
		const agrId = params.get("agreementId");
		const eqId = params.get("equipmentId");
		if (agrId) {
			setSelectedAgreement(agrId);
			if (eqId) setSelectedEquipmentIds([eqId]);
			window.history.replaceState({}, document.title, window.location.pathname);
		}
	}, []);
	const scrollYRef = (0, import_react.useRef)(0);
	(0, import_react.useEffect)(() => {
		const onScroll = () => {
			scrollYRef.current = window.scrollY;
		};
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);
	(0, import_react.useEffect)(() => {
		const saved = scrollYRef.current;
		setRentals(getRentals());
		setMockReturns(getReturns());
		requestAnimationFrame(() => {
			window.scrollTo({
				top: saved,
				behavior: "instant"
			});
		});
	}, [dbVersion]);
	const refresh = () => {
		setRentals(getRentals());
		setMockReturns(getReturns());
	};
	const selectedRental = rentals.find((r) => r.id === selectedAgreement);
	const selectedCustomer = (0, import_react.useMemo)(() => {
		if (!selectedRental) return null;
		return customers.find((c) => c.id === selectedRental.customerId);
	}, [selectedRental, customers]);
	const eqInventory = (0, import_react.useMemo)(() => getEquipment(), [dbVersion]);
	const [historyOwnerFilter, setHistoryOwnerFilter] = (0, import_react.useState)("all-owners");
	const [historyCategoryFilter, setHistoryCategoryFilter] = (0, import_react.useState)("all-categories");
	const activeOwners = Array.from(new Set(eqInventory.map((e) => e.owner).filter(Boolean)));
	const activeCategories = Array.from(new Set(eqInventory.map((e) => e.category).filter(Boolean)));
	const getReturnOwnerAndCategory = (ret) => {
		const eqIds = ret.returnedEquipmentIds || [];
		if (eqIds.length > 0) {
			const firstEq = eqInventory.find((e) => e.id === eqIds[0]);
			if (firstEq) return {
				owner: owners.find((o) => o.name.toLowerCase() === firstEq.owner?.toLowerCase())?.ownerName || firstEq.owner || "In-House",
				category: firstEq.category || "Other"
			};
		}
		const rental = rentals.find((r) => r.id === ret.agreement);
		if (rental) {
			const eq = eqInventory.find((e) => e.id === rental.equipmentId);
			if (eq) return {
				owner: owners.find((o) => o.name.toLowerCase() === eq.owner?.toLowerCase())?.ownerName || eq.owner || "In-House",
				category: eq.category || "Other"
			};
		}
		return {
			owner: "Unknown",
			category: "Unknown"
		};
	};
	const filteredReturns = sortLatestFirst(mockReturns.filter((ret) => {
		const info = getReturnOwnerAndCategory(ret);
		const matchesOwner = historyOwnerFilter === "all-owners" || info.owner === historyOwnerFilter;
		const matchesCategory = historyCategoryFilter === "all-categories" || info.category === historyCategoryFilter;
		const rental = rentals.find((r) => r.id === ret.agreement);
		const customer = customers.find((c) => c.name.toLowerCase() === ret.customer.toLowerCase() || rental && c.id === rental.customerId);
		const searchLower = historySearch.toLowerCase().trim();
		const matchesSearch = !historySearch || ret.id.toLowerCase().includes(searchLower) || ret.customer.toLowerCase().includes(searchLower) || ret.equipment.toLowerCase().includes(searchLower) || ret.agreement.toLowerCase().includes(searchLower) || rental && String(rental.serial || "").toLowerCase().includes(searchLower) || customer && (String(customer.phone || "").toLowerCase().includes(searchLower) || String(customer.altPhone || "").toLowerCase().includes(searchLower) || String(customer.contactNumber3 || "").toLowerCase().includes(searchLower));
		return matchesOwner && matchesCategory && matchesSearch;
	}), "date");
	const getEquipmentName = (eqId) => {
		const eq = eqInventory.find((e) => e.id === eqId);
		return eq ? eq.name : "Unknown Equipment";
	};
	const rentalEquipments = selectedRental ? selectedRental.equipmentItems || [{
		equipmentId: selectedRental.equipmentId,
		serial: selectedRental.serial,
		monthlyRent: cleanNum(selectedRental.monthlyRent),
		deposit: cleanNum(selectedRental.deposit),
		returned: false
	}] : [];
	const agreementPayments = (0, import_react.useMemo)(() => {
		if (!selectedRental) return [];
		return getPayments().filter((p) => p.agreement === selectedRental.id && p.status === "Paid");
	}, [selectedRental, dbVersion]);
	(0, import_react.useEffect)(() => {
		if (selectedAgreement !== lastSelectedAgreementRef.current) {
			lastSelectedAgreementRef.current = selectedAgreement;
			if (selectedRental) {
				setReturnDate(getLocalYYYYMMDD());
				setDamageCharges("0");
				setCondition("Good");
				setDuePaymentStatus("Paid");
				setDuePaymentMode("Cash");
				setDueTxRef("");
				setCollectedBy(typeof window !== "undefined" ? localStorage.getItem("medirent-user-name") || "" : "");
				setSelectedEquipmentIds(rentalEquipments.filter((item) => !item.returned).map((item) => item.equipmentId));
			} else {
				setReturnDate("");
				setFinalRent("");
				setDamageCharges("");
				setPendingBalance("");
				setTotalPaidAmount("");
				setSelectedEquipmentIds([]);
				setCollectedBy("");
				setDuePaymentStatus("Paid");
				setDuePaymentMode("Cash");
				setDueTxRef("");
			}
		}
	}, [selectedAgreement, selectedRental]);
	(0, import_react.useEffect)(() => {
		if (selectedRental && returnDate) {
			const start = parseLocalDate(selectedRental.start);
			const actualEnd = parseLocalDate(returnDate);
			if (!isNaN(start.getTime()) && !isNaN(actualEnd.getTime())) {
				if (actualEnd < start) {
					setFinalRent("0");
					setPendingBalance("0");
					setTotalPaidAmount("0");
					return;
				}
				const diffTimeUsed = actualEnd.getTime() - start.getTime();
				const daysUsed = Math.max(1, Math.ceil(diffTimeUsed / (1e3 * 60 * 60 * 24)));
				const returningItems = rentalEquipments.filter((item) => selectedEquipmentIds.includes(item.equipmentId) && !item.returned);
				const calculatedFinalRent = returningItems.reduce((sum, item) => {
					if (!(cleanNum(item.monthlyRent) > 0)) return sum + daysUsed * cleanNum(item.dailyRent || item.rentRate);
					else return sum + getReturnCalculatedRentPerItem(cleanNum(item.monthlyRent), daysUsed, selectedRental.start, returnDate);
				}, 0);
				const rentPaidForReturningItems = returningItems.reduce((sum, item) => {
					return sum + getPaidForEquipment(selectedRental, item.equipmentId, getPayments());
				}, 0);
				const calculatedPendingBalance = Math.max(0, calculatedFinalRent - rentPaidForReturningItems);
				setFinalRent(calculatedFinalRent.toString());
				setPendingBalance(calculatedPendingBalance.toString());
				setTotalPaidAmount(rentPaidForReturningItems.toString());
			}
		}
	}, [
		selectedRental,
		returnDate,
		selectedEquipmentIds,
		dbVersion
	]);
	const returningItems = rentalEquipments.filter((item) => selectedEquipmentIds.includes(item.equipmentId) && !item.returned);
	const returnedNames = returningItems.map((item) => getEquipment().find((e) => e.id === item.equipmentId)?.name || item.equipmentId).join(", ") || selectedRental?.equipment || "Unknown Equipment";
	const totalRentalDeposit = rentalEquipments.reduce((sum, item) => sum + cleanNum(item.deposit), 0);
	const returningItemsDeposit = returningItems.reduce((sum, item) => sum + cleanNum(item.deposit), 0);
	const depositRatio = totalRentalDeposit > 0 ? returningItemsDeposit / totalRentalDeposit : 1;
	const deposit = selectedRental && selectedRental.depositPaidAmount !== void 0 ? Math.round(cleanNum(selectedRental.depositPaidAmount) * depositRatio) : returningItemsDeposit;
	const dmg = cleanNum(damageCharges);
	const disc = cleanNum(discount);
	const pend = cleanNum(pendingBalance);
	const fRent = cleanNum(finalRent);
	const unpaidItems = selectedRental && selectedRental.additionalItems ? selectedRental.additionalItems.filter((item) => item.selected && item.status === "Not Paid") : [];
	const unpaidAccessoryTotal = unpaidItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
	const paidAmt = cleanNum(totalPaidAmount);
	let netRefund = deposit - dmg - pend + disc - unpaidAccessoryTotal;
	if (fRent < paidAmt) netRefund = deposit + (paidAmt - fRent) - dmg - pend + disc - unpaidAccessoryTotal;
	const isDateInvalid = selectedRental && returnDate ? parseLocalDate(returnDate) < parseLocalDate(selectedRental.start) : false;
	const handleProcessReturn = () => {
		if (isSubmitting) return;
		setIsSubmitting(true);
		if (!selectedAgreement || !returnDate || !condition) {
			toast.error("Please fill in Agreement, Return Date, and Condition before processing.");
			setIsSubmitting(false);
			return;
		}
		if (isDateInvalid) {
			toast.error("Return date cannot be earlier than the rental start date.");
			setIsSubmitting(false);
			return;
		}
		if (selectedEquipmentIds.length === 0) {
			toast.error("Please select at least one equipment item to return.");
			setIsSubmitting(false);
			return;
		}
		const outstandingPayable = Math.max(0, -netRefund);
		let actualPaidAmount = 0;
		if (outstandingPayable > 0) if (duePaymentStatus === "Paid") actualPaidAmount = outstandingPayable;
		else if (duePaymentStatus === "Partial") {
			const inputPaid = cleanNum(duePaidAmount);
			actualPaidAmount = Math.min(outstandingPayable, Math.max(0, inputPaid));
		} else actualPaidAmount = 0;
		const remainingPendingDue = Math.max(0, outstandingPayable - actualPaidAmount);
		const saveResult = saveReturn({
			id: getNextReturnNumber(),
			date: returnDate,
			agreement: selectedAgreement,
			customer: selectedRental?.customer || "Unknown",
			customerId: selectedRental?.customerId || "",
			equipment: returnedNames || "Unknown Equipment",
			condition,
			deposit,
			damageCharges: dmg,
			discount: disc,
			finalRent: fRent,
			pendingBalance: pend,
			refund: netRefund,
			status: "Pending Approval",
			returnedEquipmentIds: selectedEquipmentIds,
			unpaidAccessoryTotal,
			collectedBy,
			duePaymentStatus: outstandingPayable > 0 ? actualPaidAmount >= outstandingPayable ? "Paid" : actualPaidAmount > 0 ? "Partial" : "Not Paid" : "Paid",
			duePaymentMode: outstandingPayable > 0 && actualPaidAmount > 0 ? duePaymentMode : void 0,
			dueTxRef: outstandingPayable > 0 && actualPaidAmount > 0 ? dueTxRef : void 0,
			duePaidAmount: actualPaidAmount,
			duePendingBalance: remainingPendingDue
		});
		if (outstandingPayable > 0) {
			if (actualPaidAmount > 0) if (duePaymentMode === "Cash+Bank") {
				let cashAmt = cleanNum(dueCashAmount);
				let bankAmt = cleanNum(dueBankAmount);
				if (cashAmt + bankAmt !== actualPaidAmount) bankAmt = Math.max(0, actualPaidAmount - cashAmt);
				if (cashAmt > 0) savePayment({
					id: getNextPaymentNumber(),
					date: returnDate,
					customer: selectedRental?.customer || "Unknown Customer",
					customerId: selectedRental?.customerId || "",
					agreement: selectedAgreement,
					amount: cashAmt,
					mode: "Cash",
					type: "Rent",
					notes: `Return settlement (Cash portion of ₹${actualPaidAmount.toLocaleString("en-IN")} payment on return of: ${returnedNames})`,
					status: "Paid"
				});
				if (bankAmt > 0) savePayment({
					id: getNextPaymentNumber(),
					date: returnDate,
					customer: selectedRental?.customer || "Unknown Customer",
					customerId: selectedRental?.customerId || "",
					agreement: selectedAgreement,
					amount: bankAmt,
					mode: "Bank",
					type: "Rent",
					txRef: dueTxRef,
					notes: `Return settlement (Bank portion of ₹${actualPaidAmount.toLocaleString("en-IN")} payment on return of: ${returnedNames})`,
					status: "Paid"
				});
			} else savePayment({
				id: getNextPaymentNumber(),
				date: returnDate,
				customer: selectedRental?.customer || "Unknown Customer",
				customerId: selectedRental?.customerId || "",
				agreement: selectedAgreement,
				amount: actualPaidAmount,
				mode: duePaymentMode,
				type: "Rent",
				txRef: dueTxRef,
				notes: `Return settlement (${duePaymentStatus === "Partial" ? "Partial Payment" : "Full Payment"} on return of: ${returnedNames})`,
				status: "Paid"
			});
			if (remainingPendingDue > 0) savePayment({
				id: getNextPaymentNumber(),
				date: returnDate,
				customer: selectedRental?.customer || "Unknown Customer",
				customerId: selectedRental?.customerId || "",
				agreement: selectedAgreement,
				amount: remainingPendingDue,
				mode: duePaymentMode === "Cash+Bank" ? "Bank" : duePaymentMode,
				type: "Rent",
				notes: `Outstanding remaining pending due balance on return of: ${returnedNames}. (Total Due: ₹${outstandingPayable}, Paid: ₹${actualPaidAmount}, Pending: ₹${remainingPendingDue})`,
				status: "Not Paid"
			});
		}
		const formattedTotalDues = outstandingPayable.toLocaleString("en-IN");
		const formattedPaid = actualPaidAmount.toLocaleString("en-IN");
		const formattedPending = remainingPendingDue.toLocaleString("en-IN");
		const formattedRefund = Math.abs(netRefund).toLocaleString("en-IN");
		if (saveResult && saveResult.newAgreementId) if (outstandingPayable > 0) if (actualPaidAmount >= outstandingPayable) toast.success(`Return processed! Received full payment of ₹${formattedPaid} via ${duePaymentMode}. Remaining items split into new agreement ${saveResult.newAgreementId}.`);
		else if (actualPaidAmount > 0) toast.success(`Return processed! Received partial payment of ₹${formattedPaid} (${duePaymentMode}). Remaining pending due of ₹${formattedPending} recorded in Rent Dues.`);
		else toast.warning(`Return processed! Unpaid due of ₹${formattedTotalDues} recorded in Rent Dues. Remaining items split into new agreement ${saveResult.newAgreementId}.`);
		else if (netRefund > 0) toast.success(`Return processed successfully! Refunded total amount: ₹${formattedRefund}. Remaining items split into new agreement ${saveResult.newAgreementId}.`);
		else toast.success(`Return processed successfully! Remaining items split into new agreement ${saveResult.newAgreementId}.`);
		else if (outstandingPayable > 0) if (actualPaidAmount >= outstandingPayable) toast.success(`Return processed! Received full payment of ₹${formattedPaid} (${duePaymentMode}) for ${selectedRental?.customer || "customer"}.`);
		else if (actualPaidAmount > 0) toast.success(`Return processed! Received partial payment of ₹${formattedPaid} (${duePaymentMode}). Pending balance of ₹${formattedPending} recorded.`);
		else toast.warning(`Return processed! Unpaid due of ₹${formattedTotalDues} recorded as pending for ${selectedRental?.customer || "customer"}.`);
		else if (netRefund > 0) toast.success(`Return processed successfully! Refunded total amount: ₹${formattedRefund} for ${selectedRental?.customer || "customer"}.`);
		else toast.success(`Return processed successfully for ${selectedRental?.customer || "customer"}!`);
		setSubmitted(true);
		setIsSubmitting(false);
		refresh();
		setSelectedAgreement("");
		setCollectedBy(typeof window !== "undefined" ? localStorage.getItem("medirent-user-name") || "" : "");
	};
	const handleGenerateReceipt = () => {
		if (!selectedAgreement || !selectedRental) {
			toast.error("Please select an agreement first.");
			return;
		}
		if (isDateInvalid) {
			toast.error("Return date cannot be earlier than the rental start date.");
			return;
		}
		if (selectedEquipmentIds.length === 0) {
			toast.error("Please select at least one equipment item to return.");
			return;
		}
		const returnedNames = returningItems.map((item) => getEquipmentName(item.equipmentId)).join(", ");
		printReturnReceipt({
			id: peekNextReturnNumber(),
			date: returnDate || getLocalYYYYMMDD(),
			agreement: selectedAgreement,
			customer: selectedRental.customer || "Unknown",
			equipment: returnedNames || "Unknown Equipment",
			condition: condition || "Good",
			deposit,
			damageCharges: dmg,
			finalRent: fRent,
			pendingBalance: pend,
			refund: netRefund,
			status: "Pending Approval",
			unpaidAccessoryTotal,
			collectedBy
		});
		toast.success(`Receipt print preview opened for ${selectedRental.customer}`);
	};
	mockReturns.filter((r) => r.status === "Pending Approval").length;
	mockReturns.filter((r) => r.status === "Completed" || r.status === "Approved").length;
	const getCustomerInitials = (name) => {
		if (!name) return "CR";
		return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		title: "Equipment Returns",
		subtitle: "Process returns, audit dues & reconcile security deposits",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-6 max-w-7xl mx-auto",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
				className: "overflow-hidden shadow-card border-border/50 relative bg-gradient-to-b from-card to-card/95",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
					className: "p-6 space-y-6.5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-5 sm:grid-cols-2 lg:grid-cols-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "lg:col-span-2 space-y-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldLabel, { children: "Rental Agreement Number" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Combobox, {
										value: selectedAgreement,
										onValueChange: setSelectedAgreement,
										placeholder: "Type or select rental agreement...",
										searchPlaceholder: "Search agreement id, customer name, contact number...",
										emptyText: "No matching rentals found.",
										options: rentals.filter((r) => r.status !== "Completed" && r.status !== "Cancelled").map((r) => {
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
												label: `${r.id} — ${r.customer}${displayPhone} (${r.status})`,
												searchTerms: `${r.customerId || ""} ${r.customer || ""} ${phones} ${r.equipment || ""} ${r.serial || ""}`
											};
										})
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-1.5",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldLabel, { children: "Actual Return Date" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "relative",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												type: "date",
												className: `h-10 text-[13px] pl-9 ${isDateInvalid ? "border-destructive focus-visible:ring-destructive" : ""}`,
												value: returnDate,
												onChange: (e) => setReturnDate(e.target.value)
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Calendar, { className: "absolute left-3 top-3 h-4 w-4 text-muted-foreground/60" })]
										}),
										isDateInvalid && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-[11px] text-destructive font-medium mt-1 animate-[fade-in_0.2s_ease-out]",
											children: [
												"Cannot be earlier than start date (",
												selectedRental?.start ? formatDateDDMMYYYY(selectedRental.start) : "",
												")"
											]
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldLabel, { children: "Condition Assessment" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-2 gap-1.5 bg-muted/40 p-1.5 rounded-lg border border-border/30 h-10",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											onClick: () => setCondition("Good"),
											disabled: !selectedAgreement,
											className: `flex items-center justify-center gap-1.5 rounded-md text-[11.5px] font-bold transition-all disabled:opacity-40 ${condition === "Good" ? "bg-background text-emerald-600 shadow-soft border border-emerald-500/10" : "text-muted-foreground hover:text-foreground"}`,
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "h-3.5 w-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Good" })]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											onClick: () => setCondition("UnderMaintenance"),
											disabled: !selectedAgreement,
											className: `flex items-center justify-center gap-1.5 rounded-md text-[11.5px] font-bold transition-all disabled:opacity-40 ${condition === "UnderMaintenance" ? "bg-background text-amber-600 shadow-soft border border-amber-500/10" : "text-muted-foreground hover:text-foreground"}`,
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Activity, { className: "h-3.5 w-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Service" })]
										})]
									})]
								})
							]
						}),
						selectedRental && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-5 lg:grid-cols-3 items-start animate-[slide-up_0.3s_ease-out]",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "lg:col-span-2 space-y-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "rounded-xl border border-border/40 bg-muted/5 p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-3.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "h-12 w-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-soft shrink-0",
											children: getCustomerInitials(selectedRental.customer)
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h4", {
												className: "text-[14px] font-bold text-foreground leading-tight flex items-center gap-2",
												children: [selectedRental.customer, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, { status: selectedRental.status })]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "text-[11.5px] text-muted-foreground mt-0.5",
												children: [
													"Agreement ID: ",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "font-mono font-bold text-foreground/80",
														children: selectedRental.id
													}),
													" · Contact: ",
													selectedCustomer?.phone || "No phone registered"
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "text-[11px] text-muted-foreground",
												children: [
													"Period: ",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "font-semibold text-foreground/70",
														children: formatDateDDMMYYYY(selectedRental.start)
													}),
													" to ",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "font-semibold text-foreground/70",
														children: returnDate ? formatDateDDMMYYYY(returnDate) : selectedRental.end ? formatDateDDMMYYYY(selectedRental.end) : "Ongoing"
													})
												]
											})
										] })]
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-3.5 border border-border/60 bg-muted/10 p-4.5 rounded-xl",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											className: "text-[11.5px] font-bold uppercase tracking-wider text-muted-foreground",
											children: "Select Equipment to Return"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full",
											children: [
												selectedEquipmentIds.length,
												" of ",
												rentalEquipments.filter((it) => !it.returned).length || rentalEquipments.length,
												" Selected"
											]
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "grid sm:grid-cols-2 lg:grid-cols-3 gap-3",
										children: rentalEquipments.map((item) => {
											const isReturned = item.returned;
											const eqName = getEquipmentName(item.equipmentId);
											const isChecked = !isReturned && selectedEquipmentIds.includes(item.equipmentId);
											const eqItem = eqInventory.find((e) => e.id === item.equipmentId);
											const modelNo = eqItem?.model || "Not Set";
											const ownerName = owners.find((o) => o.name.toLowerCase() === eqItem?.owner?.toLowerCase())?.ownerName || eqItem?.owner || "Not Set";
											const isMonthly = cleanNum(item.monthlyRent) > 0;
											const rentRate = isMonthly ? cleanNum(item.monthlyRent) : cleanNum(item.dailyRent || item.rentRate);
											const rentCycleLabel = isMonthly ? "mo" : "day";
											const isRentPaid = selectedRental.rentalPaymentStatus === "Paid";
											const rentPaidText = selectedRental.rentalPaymentStatus || "Not Paid";
											const isDepositPaid = selectedRental.depositPaymentStatus === "Paid";
											const depositPaidText = selectedRental.depositPaymentStatus || "Not Paid";
											return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												onClick: () => {
													if (isReturned) return;
													if (selectedEquipmentIds.includes(item.equipmentId)) setSelectedEquipmentIds(selectedEquipmentIds.filter((id) => id !== item.equipmentId));
													else setSelectedEquipmentIds([...selectedEquipmentIds, item.equipmentId]);
												},
												className: `group flex items-start gap-3 p-3.5 rounded-xl border text-[12px] transition-all cursor-pointer relative overflow-hidden select-none ${isReturned ? "bg-muted/15 border-border/30 opacity-55 cursor-not-allowed" : isChecked ? "bg-primary/5 border-primary/50 shadow-soft ring-1 ring-primary/10" : "bg-background border-border hover:border-primary/40 hover:shadow-soft"}`,
												children: [
													!isReturned && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: `h-4.5 w-4.5 rounded-md border flex items-center justify-center mt-0.5 shrink-0 transition-all ${isChecked ? "bg-primary border-primary text-primary-foreground" : "border-border bg-background group-hover:border-primary/50"}`,
														children: isChecked && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-3 w-3 stroke-[3]" })
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex-1 min-w-0 space-y-1",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: `block font-bold text-[12.5px] tracking-tight leading-tight ${isReturned ? "text-muted-foreground line-through" : "text-foreground"}`,
																children: eqName
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-muted-foreground mt-1",
																children: [
																	/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																		className: "font-medium text-muted-foreground",
																		children: "Serial: "
																	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																		className: "font-mono font-bold text-foreground/80",
																		children: item.serial || "Not Set"
																	})] }),
																	/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																		className: "font-medium text-muted-foreground",
																		children: "Model: "
																	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																		className: "font-semibold text-foreground/80",
																		children: modelNo
																	})] }),
																	/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																		className: "col-span-2",
																		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																			className: "font-medium text-muted-foreground",
																			children: "Owner: "
																		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																			className: "font-semibold text-foreground/80",
																			children: ownerName
																		})]
																	})
																]
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "mt-2.5 pt-2 border-t border-border/40 space-y-1 text-[11px]",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																	className: "flex justify-between items-center",
																	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																		className: "text-muted-foreground",
																		children: ["Rent: ", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																			className: "font-bold text-foreground/80",
																			children: [
																				"₹",
																				rentRate.toLocaleString("en-IN"),
																				"/",
																				rentCycleLabel
																			]
																		})]
																	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																		className: `px-1.5 py-0.2 rounded-[4px] text-[9.5px] font-black ${isRentPaid ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"}`,
																		children: rentPaidText
																	})]
																}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																	className: "flex justify-between items-center",
																	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																		className: "text-muted-foreground",
																		children: ["Deposit: ", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																			className: "font-bold text-foreground/80",
																			children: ["₹", cleanNum(item.deposit).toLocaleString("en-IN")]
																		})]
																	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																		className: `px-1.5 py-0.2 rounded-[4px] text-[9.5px] font-black ${isDepositPaid ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"}`,
																		children: depositPaidText
																	})]
																})]
															})
														]
													}),
													isReturned && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "absolute top-1.5 right-1.5 text-[9px] font-bold text-muted-foreground bg-muted border border-border/30 px-1.5 py-0.5 rounded",
														children: "Returned"
													})
												]
											}, item.equipmentId);
										})
									})]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
								className: "border border-border/50 bg-card/65 shadow-soft backdrop-blur-xs flex flex-col h-full overflow-hidden max-h-[385px] lg:mt-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, {
									className: "p-4 border-b border-border/40 pb-3 flex flex-row items-center gap-2 shrink-0",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Receipt, { className: "h-4 w-4 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
										className: "text-[13.5px] font-bold text-foreground",
										children: "Payment Ledger"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[10px] text-muted-foreground mt-0.5",
										children: "Agreement transactions list"
									})] })]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
									className: "p-0 flex-1 overflow-y-auto min-h-[180px]",
									children: agreementPayments.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "py-16 text-center text-muted-foreground text-[12px] px-4",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Receipt, { className: "h-6 w-6 mx-auto text-muted-foreground/20 mb-2" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "font-bold text-foreground/75",
												children: "No payments found"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[10.5px] text-muted-foreground/60 mt-0.5",
												children: "No logged transactions found for this agreement."
											})
										]
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "divide-y divide-border/40",
										children: agreementPayments.map((p) => {
											const isDeposit = p.type?.toLowerCase().includes("deposit");
											return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "p-3 text-[12px] hover:bg-muted/10 transition-colors flex items-start justify-between gap-3",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "space-y-1 min-w-0",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "flex items-center gap-1.5",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: `px-1.5 py-0.2 rounded-[4px] text-[9.5px] font-black tracking-tight ${isDeposit ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`,
																children: p.type || "Rent"
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "font-mono text-[10.5px] font-bold text-muted-foreground/70",
																children: p.id
															})]
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
															className: "text-[11px] text-muted-foreground/90 truncate font-medium",
															children: p.notes || "Rent payment"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "flex items-center gap-2 text-[10.5px] text-muted-foreground/60 mt-1",
															children: [
																/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: formatDateDDMMYYYY(p.date) }),
																/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "·" }),
																/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Mode: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
																	className: "text-foreground/70 font-semibold",
																	children: p.mode
																})] }),
																p.txRef && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "·" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																	className: "truncate max-w-[80px] font-mono",
																	children: ["Ref: ", p.txRef]
																})] })
															]
														})
													]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "font-extrabold text-foreground text-[12.5px] whitespace-nowrap shrink-0",
													children: ["₹", cleanNum(p.amount).toLocaleString("en-IN")]
												})]
											}, p.id);
										})
									})
								})]
							})]
						}),
						selectedRental && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SlidersVertical, { className: "h-4 w-4 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									className: "text-[12px] font-bold uppercase tracking-wider text-muted-foreground",
									children: "Adjustment Controls"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4 bg-muted/20 p-4.5 rounded-xl border border-border/40",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-1.5 bg-background rounded-lg p-3.5 border border-border flex flex-col justify-between",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldLabel, { children: "Total Rental Duration" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-[13.5px] font-bold text-foreground h-9 flex items-center",
											children: selectedRental ? formatRentalDuration(selectedRental.start, returnDate, rentalEquipments[0]?.rentCycle) : "0 Days"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-1.5 bg-background rounded-lg p-3.5 border border-border",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldLabel, { children: "Total Rent Payable" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "relative mt-1",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "absolute left-3 top-2 text-[12px] font-bold text-muted-foreground",
												children: "₹"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												placeholder: "0.00",
												className: "h-8 pl-7 text-[13px] font-semibold border-border focus-visible:ring-primary/20",
												value: finalRent,
												onChange: (e) => {
													const val = e.target.value;
													setFinalRent(val);
													const fRentNum = cleanNum(val);
													const paidNum = cleanNum(totalPaidAmount);
													setPendingBalance(Math.max(0, fRentNum - paidNum).toString());
												}
											})]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-1.5 bg-background rounded-lg p-3.5 border border-border",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldLabel, { children: "Total Rent Paid" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "relative mt-1",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "absolute left-3 top-2 text-[12px] font-bold text-muted-foreground",
												children: "₹"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												placeholder: "0.00",
												className: "h-8 pl-7 text-[13px] font-semibold border-border focus-visible:ring-primary/20",
												value: totalPaidAmount,
												onChange: (e) => {
													const val = e.target.value;
													setTotalPaidAmount(val);
													const fRentNum = cleanNum(finalRent);
													const paidNum = cleanNum(val);
													setPendingBalance(Math.max(0, fRentNum - paidNum).toString());
												}
											})]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-1.5 bg-background rounded-lg p-3.5 border border-border",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldLabel, { children: "Outstanding Rent Due" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "relative mt-1",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "absolute left-3 top-2 text-[12px] font-bold text-muted-foreground",
												children: "₹"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												placeholder: "0.00",
												className: `h-8 pl-7 text-[13px] font-semibold ${cleanNum(pendingBalance) > 0 ? "text-rose-600 bg-rose-50/20 border-rose-200" : "text-foreground"}`,
												value: pendingBalance,
												onChange: (e) => setPendingBalance(e.target.value)
											})]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-1.5 bg-background rounded-lg p-3.5 border border-border",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldLabel, { children: "Damage Charges" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "relative mt-1",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "absolute left-3 top-2 text-[12px] font-bold text-muted-foreground",
												children: "₹"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												placeholder: "0.00",
												className: "h-8 pl-7 text-[13px] font-semibold text-rose-600 bg-rose-50/20 border-rose-200 focus-visible:ring-rose-500",
												value: damageCharges,
												onChange: (e) => setDamageCharges(e.target.value)
											})]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-1.5 bg-background rounded-lg p-3.5 border border-border",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldLabel, { children: "Return Discount" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "relative mt-1",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "absolute left-3 top-2 text-[12px] font-bold text-muted-foreground",
												children: "₹"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												placeholder: "0.00",
												className: "h-8 pl-7 text-[13px] font-semibold text-emerald-600 bg-emerald-50/20 border-emerald-200 focus-visible:ring-emerald-500",
												value: discount,
												onChange: (e) => setDiscount(e.target.value)
											})]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-1.5 bg-background rounded-lg p-3.5 border border-border flex flex-col justify-between min-h-[64px]",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldLabel, { children: "Unpaid Accessories" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-[11.5px] font-semibold text-foreground leading-tight mt-1",
											children: unpaidItems.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "max-h-[36px] overflow-y-auto space-y-0.5",
												children: unpaidItems.map((item, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex justify-between text-rose-600 text-[10px]",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "truncate max-w-[110px]",
														children: item.name
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["₹", cleanNum(item.amount)] })]
												}, idx))
											}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-muted-foreground",
												children: "₹0"
											})
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-1.5 bg-background rounded-lg p-3.5 border border-border flex flex-col justify-between",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldLabel, { children: "Security Deposit" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "text-[14px] font-bold text-blue-600 h-9 flex items-center",
											children: ["₹", deposit.toLocaleString("en-IN")]
										})]
									})
								]
							})]
						}),
						selectedRental ? (() => {
							const remainingRentDues = Math.max(0, fRent - paidAmt);
							const rentOverpaid = Math.max(0, paidAmt - fRent);
							const dmgCharges = cleanNum(damageCharges);
							const unpaidAccessoriesTotal = unpaidAccessoryTotal;
							const totalDueVal = Math.max(0, remainingRentDues + dmgCharges + unpaidAccessoriesTotal);
							const returnDiscountVal = cleanNum(discount);
							const afterDiscountTotalDueVal = Math.max(0, totalDueVal - returnDiscountVal);
							const totalDepositVal = deposit;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-xl border border-border/60 bg-muted/5 overflow-hidden",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2.5 px-5 py-3.5 border-b border-border/60 bg-muted/20",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "metric-icon h-7 w-7 shrink-0 bg-primary/10 text-primary border-primary/20",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Receipt, { className: "h-4 w-4" })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[12px] font-bold uppercase tracking-wider text-foreground",
											children: "Reconciliation Ledger Details"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "p-0",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, {
											className: "bg-muted/10",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
													className: "font-bold text-[11px] text-muted-foreground uppercase pl-6",
													children: "Ledger Line Item"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
													className: "font-bold text-[11px] text-muted-foreground uppercase",
													children: "Calculation Details"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
													className: "text-right font-bold text-[11px] text-muted-foreground uppercase pr-6",
													children: "Amount (₹)"
												})
											] })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableBody, { children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, {
												className: "hover:bg-muted/5 transition-colors",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
														className: "font-semibold text-[13px] text-foreground pl-6",
														children: "Total Due"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, {
														className: "text-[11.5px] text-muted-foreground",
														children: [
															"Remaining Rent Dues (₹",
															remainingRentDues.toLocaleString("en-IN"),
															")",
															dmgCharges > 0 && ` + Damage Charges (₹${dmgCharges.toLocaleString("en-IN")})`,
															unpaidAccessoriesTotal > 0 && ` + Unpaid Accessories (₹${unpaidAccessoriesTotal.toLocaleString("en-IN")})`
														]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, {
														className: "text-right font-bold text-[13px] pr-6",
														children: ["₹", totalDueVal.toLocaleString("en-IN")]
													})
												]
											}),
											rentOverpaid > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, {
												className: "hover:bg-muted/5 transition-colors bg-blue-50/10",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
														className: "font-semibold text-[13px] text-blue-700 pl-6",
														children: "Rent Advance Credit"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, {
														className: "text-[11.5px] text-blue-600",
														children: [
															"Customer paid ₹",
															rentOverpaid.toLocaleString("en-IN"),
															" more than rent due — credited against deposit"
														]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, {
														className: "text-right font-bold text-blue-600 text-[13px] pr-6",
														children: ["+ ₹", rentOverpaid.toLocaleString("en-IN")]
													})
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, {
												className: "hover:bg-muted/5 transition-colors",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
														className: "font-semibold text-[13px] text-foreground pl-6",
														children: "Return Discount"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
														className: "text-[11.5px] text-muted-foreground",
														children: "Discount applied on return"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, {
														className: "text-right font-bold text-emerald-600 text-[13px] pr-6",
														children: ["- ₹", returnDiscountVal.toLocaleString("en-IN")]
													})
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, {
												className: "hover:bg-muted/5 transition-colors bg-muted/5 font-semibold",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
														className: "text-[13px] text-foreground font-bold pl-6",
														children: "After Discount Total Due"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
														className: "text-[11.5px] text-muted-foreground",
														children: "Total Due - Return Discount"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, {
														className: "text-right font-bold text-[13px] pr-6",
														children: ["₹", afterDiscountTotalDueVal.toLocaleString("en-IN")]
													})
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, {
												className: "hover:bg-muted/5 transition-colors",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
														className: "font-semibold text-[13px] text-foreground pl-6",
														children: "Security Deposit Offset"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
														className: "text-[11.5px] text-muted-foreground",
														children: "Total security deposit paid under agreement"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, {
														className: "text-right font-bold text-blue-600 text-[13px] pr-6",
														children: ["₹", totalDepositVal.toLocaleString("en-IN")]
													})
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, {
												className: `font-black text-[13.5px] ${netRefund >= 0 ? "bg-emerald-50/20 text-emerald-700" : "bg-rose-50/20 text-rose-700"}`,
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
														className: "py-3.5 pl-6 font-bold",
														children: "Final Settlement"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
														className: "text-[11.5px] font-medium",
														children: netRefund >= 0 ? "Security Deposit Offset - After Discount Total Due (Refundable to Customer)" : "After Discount Total Due - Security Deposit Offset (Collect from Customer)"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
														className: "text-right py-3.5 pr-6",
														children: netRefund >= 0 ? `₹${Math.abs(netRefund).toLocaleString("en-IN")} (Refundable)` : `₹${Math.abs(netRefund).toLocaleString("en-IN")} (Collect Dues)`
													})
												]
											})
										] })] })
									}),
									netRefund < 0 && (() => {
										const totalDueAmt = Math.abs(netRefund);
										const currentPaidVal = duePaymentStatus === "Paid" ? totalDueAmt : duePaymentStatus === "Partial" ? Math.min(totalDueAmt, Math.max(0, cleanNum(duePaidAmount))) : 0;
										const remainingDueVal = Math.max(0, totalDueAmt - currentPaidVal);
										return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "m-4 rounded-xl border border-amber-500/30 bg-amber-50/20 dark:bg-amber-950/20 p-4 space-y-4",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center justify-between flex-wrap gap-2 border-b border-amber-500/20 pb-2.5",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center gap-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CreditCard, { className: "h-4 w-4 text-amber-600 dark:text-amber-400" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "text-[12.5px] font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wide",
														children: [
															"Due Amount Payment Settlement (Total Collectible: ₹",
															totalDueAmt.toLocaleString("en-IN"),
															")"
														]
													})]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center gap-2",
													children: [duePaymentStatus === "Partial" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "text-[11px] font-bold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 px-2.5 py-0.5 rounded-full",
														children: ["Pending Due: ₹", remainingDueVal.toLocaleString("en-IN")]
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-700 px-2.5 py-0.5 rounded-full",
														children: "Settlement Options"
													})]
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "space-y-4",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "space-y-1.5",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
															className: "text-[11px] font-bold uppercase tracking-wider text-muted-foreground",
															children: "Due Payment Status"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "grid grid-cols-3 gap-1.5 bg-background p-1.5 rounded-lg border border-border h-11",
															children: [
																/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
																	type: "button",
																	onClick: () => {
																		setDuePaymentStatus("Paid");
																		setDuePaidAmount(totalDueAmt.toString());
																		setDueCashAmount(Math.round(totalDueAmt / 2).toString());
																		setDueBankAmount((totalDueAmt - Math.round(totalDueAmt / 2)).toString());
																	},
																	className: `flex items-center justify-center gap-1.5 rounded-md text-[12px] font-bold transition-all ${duePaymentStatus === "Paid" ? "bg-emerald-600 text-white shadow-xs" : "text-muted-foreground hover:text-foreground"}`,
																	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "h-3.5 w-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Full Payment" })]
																}),
																/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
																	type: "button",
																	onClick: () => {
																		setDuePaymentStatus("Partial");
																		const defaultPartial = Math.round(totalDueAmt / 2);
																		setDuePaidAmount(defaultPartial.toString());
																		setDueCashAmount(Math.round(defaultPartial / 2).toString());
																		setDueBankAmount((defaultPartial - Math.round(defaultPartial / 2)).toString());
																	},
																	className: `flex items-center justify-center gap-1.5 rounded-md text-[12px] font-bold transition-all ${duePaymentStatus === "Partial" ? "bg-amber-600 text-white shadow-xs" : "text-muted-foreground hover:text-foreground"}`,
																	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "h-3.5 w-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Partial Payment" })]
																}),
																/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
																	type: "button",
																	onClick: () => setDuePaymentStatus("Not Paid"),
																	className: `flex items-center justify-center gap-1.5 rounded-md text-[12px] font-bold transition-all ${duePaymentStatus === "Not Paid" ? "bg-rose-600 text-white shadow-xs" : "text-muted-foreground hover:text-foreground"}`,
																	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleX, { className: "h-3.5 w-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Not Paid (Due)" })]
																})
															]
														})]
													}),
													duePaymentStatus !== "Not Paid" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 items-end",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "space-y-1.5",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
																	className: "text-[11px] font-bold uppercase tracking-wider text-muted-foreground",
																	children: "Payment Mode"
																}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
																	value: duePaymentMode,
																	onValueChange: (mode) => {
																		setDuePaymentMode(mode);
																		if (mode === "Cash+Bank") {
																			const cAmt = Math.round(currentPaidVal / 2);
																			setDueCashAmount(cAmt.toString());
																			setDueBankAmount((currentPaidVal - cAmt).toString());
																		}
																	},
																	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
																		className: "h-10 text-[13px] bg-background font-medium",
																		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Select mode" })
																	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
																		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
																			value: "Cash",
																			children: "Cash"
																		}),
																		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
																			value: "Bank",
																			children: "Bank"
																		}),
																		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
																			value: "Cash+Bank",
																			children: "Cash + Bank"
																		})
																	] })]
																})]
															}),
															duePaymentStatus === "Partial" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "space-y-1.5",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
																	className: "text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400",
																	children: "Payment Amount Received (₹)"
																}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																	type: "number",
																	placeholder: `Max ₹${totalDueAmt}`,
																	className: "h-10 text-[13px] font-bold bg-background text-foreground border-amber-300 dark:border-amber-700",
																	value: duePaidAmount,
																	onChange: (e) => {
																		const val = e.target.value;
																		setDuePaidAmount(val);
																		const nVal = Math.min(totalDueAmt, Math.max(0, cleanNum(val)));
																		if (duePaymentMode === "Cash+Bank") {
																			const cAmt = Math.round(nVal / 2);
																			setDueCashAmount(cAmt.toString());
																			setDueBankAmount((nVal - cAmt).toString());
																		}
																	}
																})]
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "space-y-1.5",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
																	className: "text-[11px] font-bold uppercase tracking-wider text-muted-foreground",
																	children: "Txn / Ref No. (Optional)"
																}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																	placeholder: "e.g. UPI Ref / Bank Txn ID",
																	className: "h-10 text-[13px] bg-background",
																	value: dueTxRef,
																	onChange: (e) => setDueTxRef(e.target.value)
																})]
															}),
															duePaymentMode === "Cash+Bank" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "sm:col-span-2 lg:col-span-3 grid grid-cols-2 gap-3 p-3 bg-background rounded-lg border border-border mt-1",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																	className: "space-y-1.5",
																	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
																		className: "text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400",
																		children: "Cash Amount (₹)"
																	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																		type: "number",
																		placeholder: "Cash part",
																		className: "h-9 text-[13px] font-semibold bg-emerald-50/20 border-emerald-300 dark:border-emerald-800",
																		value: dueCashAmount,
																		onChange: (e) => {
																			const cVal = e.target.value;
																			setDueCashAmount(cVal);
																			const cNum = Math.max(0, cleanNum(cVal));
																			setDueBankAmount(Math.max(0, currentPaidVal - cNum).toString());
																		}
																	})]
																}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																	className: "space-y-1.5",
																	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
																		className: "text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400",
																		children: "Bank Amount (₹)"
																	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																		type: "number",
																		placeholder: "Bank part",
																		className: "h-9 text-[13px] font-semibold bg-blue-50/20 border-blue-300 dark:border-blue-800",
																		value: dueBankAmount,
																		onChange: (e) => {
																			const bVal = e.target.value;
																			setDueBankAmount(bVal);
																			const bNum = Math.max(0, cleanNum(bVal));
																			setDueCashAmount(Math.max(0, currentPaidVal - bNum).toString());
																		}
																	})]
																})]
															})
														]
													}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "p-3 rounded-lg bg-rose-100/60 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-[11.5px] flex items-center gap-2",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, { className: "h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
															"Full due amount of ",
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: ["₹", totalDueAmt.toLocaleString("en-IN")] }),
															" will be recorded as an ",
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Unpaid Pending Due" }),
															" in Rent Dues & Payments Ledger."
														] })]
													}),
													duePaymentStatus === "Partial" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "p-3 rounded-lg bg-amber-100/40 dark:bg-amber-900/20 border border-amber-300/60 dark:border-amber-800/60 flex items-center justify-between text-[12px] flex-wrap gap-2",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "flex items-center gap-2 font-medium text-amber-900 dark:text-amber-200",
															children: [
																/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Total Dues: ", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: ["₹", totalDueAmt.toLocaleString("en-IN")] })] }),
																/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "·" }),
																/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																	className: "text-emerald-700 dark:text-emerald-400",
																	children: ["Received Now: ", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: ["₹", currentPaidVal.toLocaleString("en-IN")] })]
																})
															]
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
															className: "font-bold text-rose-700 dark:text-rose-300 bg-background px-2.5 py-1 rounded border border-rose-200 dark:border-rose-900",
															children: ["Remaining Pending Due: ₹", remainingDueVal.toLocaleString("en-IN")]
														})]
													})
												]
											})]
										});
									})()
								]
							});
						})() : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-xl border border-dashed border-border/80 p-8 text-center text-muted-foreground text-[12.5px] flex-1 flex flex-col items-center justify-center bg-muted/5 min-h-[160px]",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { className: "h-8 w-8 text-muted-foreground/30 mb-2" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-semibold text-foreground/75",
									children: "No agreement selected"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-muted-foreground text-[11px] mt-0.5",
									children: "Select a rental agreement above to generate calculations & pro-rata details."
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-5 sm:grid-cols-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldLabel, { children: "Return Collected By" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "relative",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										placeholder: "Enter collector's name",
										className: "h-10 text-[13px] pl-9",
										value: collectedBy,
										onChange: (e) => setCollectedBy(e.target.value)
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, { className: "absolute left-3 top-3 h-4 w-4 text-muted-foreground/60" })]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "sm:col-span-2 space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldLabel, { children: "Audit & Inspection Remarks" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
									placeholder: "Describe condition details, listing of accessories returned, audit adjustments details...",
									className: "min-h-[75px] resize-none text-[13px] focus-visible:ring-primary/20",
									value: notes,
									onChange: (e) => setNotes(e.target.value)
								})]
							})]
						}),
						selectedRental && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-xl border border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/20 p-4 space-y-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between flex-wrap gap-2 border-b border-emerald-500/20 pb-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { className: "h-4 w-4 text-emerald-600 dark:text-emerald-400" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[12.5px] font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wide",
										children: "WhatsApp Pickup / Collection Message Preview"
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										type: "button",
										variant: "outline",
										size: "sm",
										onClick: () => {
											const msg = generateWhatsAppPickupMessage({
												customerName: selectedRental.customer,
												rentDate: selectedRental.start,
												phone: selectedCustomer?.phone || selectedRental?.phone,
												altPhone: selectedCustomer?.altPhone || selectedRental?.altPhone,
												equipment: returnedNames || selectedRental.equipment,
												serial: selectedRental.serial,
												model: selectedRental.model,
												area: selectedCustomer?.area || selectedRental?.area,
												address: selectedCustomer?.address || selectedRental?.address,
												locationAddress: selectedRental?.locationAddress || selectedCustomer?.locationAddress,
												latitude: selectedRental?.latitude,
												longitude: selectedRental?.longitude,
												collectAmount: netRefund < 0 ? Math.abs(netRefund) : 0,
												refundAmount: netRefund > 0 ? netRefund : 0
											});
											navigator.clipboard.writeText(msg);
											toast.success("WhatsApp pickup message copied to clipboard!");
										},
										className: "h-7 px-2.5 text-[11.5px] font-bold gap-1.5 border-emerald-300",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "h-3.5 w-3.5 text-primary" }), " Copy Message"]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										type: "button",
										size: "sm",
										onClick: () => {
											const msg = generateWhatsAppPickupMessage({
												customerName: selectedRental.customer,
												rentDate: selectedRental.start,
												phone: selectedCustomer?.phone || selectedRental?.phone,
												altPhone: selectedCustomer?.altPhone || selectedRental?.altPhone,
												equipment: returnedNames || selectedRental.equipment,
												serial: selectedRental.serial,
												model: selectedRental.model,
												area: selectedCustomer?.area || selectedRental?.area,
												address: selectedCustomer?.address || selectedRental?.address,
												locationAddress: selectedRental?.locationAddress || selectedCustomer?.locationAddress,
												latitude: selectedRental?.latitude,
												longitude: selectedRental?.longitude,
												collectAmount: netRefund < 0 ? Math.abs(netRefund) : 0,
												refundAmount: netRefund > 0 ? netRefund : 0
											});
											const cleanPhone = (selectedCustomer?.phone || selectedRental?.phone || "").replace(/\D/g, "");
											const text = encodeURIComponent(msg);
											const targetUrl = cleanPhone ? `https://wa.me/91${cleanPhone}?text=${text}` : `https://wa.me/?text=${text}`;
											window.open(targetUrl, "_blank");
										},
										className: "h-7 px-2.5 text-[11.5px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { className: "h-3.5 w-3.5" }), " Send to WhatsApp"]
									})]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
								readOnly: true,
								rows: 6,
								value: generateWhatsAppPickupMessage({
									customerName: selectedRental.customer,
									rentDate: selectedRental.start,
									phone: selectedCustomer?.phone || selectedRental?.phone,
									altPhone: selectedCustomer?.altPhone || selectedRental?.altPhone,
									equipment: returnedNames || selectedRental.equipment,
									serial: selectedRental.serial,
									model: selectedRental.model,
									area: selectedCustomer?.area || selectedRental?.area,
									address: selectedCustomer?.address || selectedRental?.address,
									locationAddress: selectedRental?.locationAddress || selectedCustomer?.locationAddress,
									latitude: selectedRental?.latitude,
									longitude: selectedRental?.longitude,
									collectAmount: netRefund < 0 ? Math.abs(netRefund) : 0,
									refundAmount: netRefund > 0 ? netRefund : 0
								}),
								className: "font-mono text-[12.5px] bg-background border-emerald-300 dark:border-emerald-800 leading-relaxed font-semibold cursor-text text-foreground"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between border-t border-border/50 pt-5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-[11.5px] text-muted-foreground flex items-center gap-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "h-4 w-4 text-emerald-600" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Processing automatically sets returning serials to Available / Maintenance." })]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex gap-2.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									variant: "outline",
									type: "button",
									onClick: handleGenerateReceipt,
									disabled: !selectedAgreement,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Receipt, { className: "mr-1.5 h-4 w-4 text-muted-foreground" }), "Print Receipt"]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									type: "button",
									onClick: handleProcessReturn,
									disabled: !selectedAgreement || isSubmitting,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "mr-1.5 h-4 w-4" }), isSubmitting ? "Processing..." : "Process Return"]
								})]
							})]
						})
					]
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "shadow-card border-border/50 overflow-hidden",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, {
					className: "border-b border-border/50 bg-muted/15 px-6 py-4.5",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between flex-wrap gap-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "metric-icon h-9 w-9 bg-accent/10 text-accent border-accent/20 rounded-lg",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(History, { className: "h-4.5 w-4.5" })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
								className: "text-[15px] font-bold",
								children: "Return Ledger History"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[12px] text-muted-foreground mt-0.5",
								children: "Audit log of all equipment returns processed"
							})] })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "relative w-full sm:w-[220px]",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										placeholder: "Search returns...",
										value: historySearch,
										onChange: (e) => setHistorySearch(e.target.value),
										className: "h-8.5 pl-8.5 text-[12px]"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground/60" })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
									value: historyOwnerFilter,
									onValueChange: setHistoryOwnerFilter,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
										className: "w-[140px] h-8.5 text-[11.5px] bg-background",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Owner" })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "all-owners",
										children: "All Owners"
									}), activeOwners.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: o,
										children: o
									}, o))] })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
									value: historyCategoryFilter,
									onValueChange: setHistoryCategoryFilter,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
										className: "w-[150px] h-8.5 text-[11.5px] bg-background",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Category" })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "all-categories",
										children: "All Categories"
									}), activeCategories.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: c,
										children: c
									}, c))] })]
								})
							]
						})]
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
					className: "p-0",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "overflow-x-auto",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, {
							className: "bg-muted/10",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
									className: "w-[110px]",
									children: "Return ID"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
									className: "w-[100px]",
									children: "Date"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
									className: "w-[180px]",
									children: "Customer"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Equipment & Sourcing" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
									className: "w-[110px]",
									children: "Condition"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
									className: "text-right w-[110px]",
									children: "Deposit Offset"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
									className: "text-right w-[110px]",
									children: "Damages/Dues"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
									className: "text-right w-[110px]",
									children: "Final Settlement"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
									className: "w-[120px] text-center",
									children: "Status"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
									className: "w-[120px] text-right pr-6",
									children: "Action"
								})
							]
						}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableBody, { children: filteredReturns.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableRow, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, {
							colSpan: 10,
							className: "py-14 text-center text-muted-foreground text-[13px]",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "h-8 w-8 mx-auto text-muted-foreground/30 mb-2" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-semibold text-foreground/75",
									children: "No return records match filters"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[11px] text-muted-foreground mt-0.5",
									children: "Try widening search criteria or selecting another tab."
								})
							]
						}) }) : filteredReturns.map((ret) => {
							const info = getReturnOwnerAndCategory(ret);
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, {
								className: "group hover:bg-muted/15 transition-colors",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
										className: "font-mono text-[11.5px] font-black text-primary",
										children: ret.id
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
										className: "text-[11.5px] text-muted-foreground",
										children: formatDateDDMMYYYY(ret.date)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "font-semibold text-[13px] text-foreground",
										children: ret.customer
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "text-[10px] text-muted-foreground font-mono mt-0.5",
										children: ["Agr: ", ret.agreement]
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, {
										className: "text-[12.5px] text-foreground/80",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "font-semibold text-[13px]",
											children: ret.equipment
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-[10.5px] text-muted-foreground mt-0.5 flex flex-wrap gap-x-1.5",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Owner: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
													className: "text-foreground/70 font-medium",
													children: info.owner
												})] }),
												info.category && info.category !== ret.equipment && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "·" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Cat: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
													className: "text-foreground/70 font-medium",
													children: info.category
												})] })] }),
												ret.collectedBy && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "·" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Coll. By: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
													className: "text-foreground/70 font-medium",
													children: ret.collectedBy
												})] })] })
											]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: `inline-flex items-center rounded-md px-2 py-0.5 text-[10.5px] font-bold border ${(() => {
											const c = (ret.condition || "").toLowerCase();
											if (c.includes("good") || c.includes("available")) return "bg-emerald-50 text-emerald-700 border-emerald-200/50";
											else if (c.includes("maint") || c.includes("fair")) return "bg-amber-50 text-amber-700 border-amber-200/50";
											return "bg-rose-50 text-rose-700 border-rose-200/50";
										})()}`,
										children: ret.condition
									}) }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, {
										className: "text-right font-semibold text-[13px]",
										children: ["₹", (ret.deposit || 0).toLocaleString("en-IN")]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, {
										className: "text-right text-[12px] space-y-0.5",
										children: [
											ret.damageCharges > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "text-rose-600 font-semibold",
												children: ["Dmg: ₹", ret.damageCharges.toLocaleString("en-IN")]
											}),
											ret.pendingBalance > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "text-amber-600 font-semibold",
												children: ["Dues: ₹", ret.pendingBalance.toLocaleString("en-IN")]
											}),
											ret.unpaidAccessoryTotal > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "text-amber-500 font-semibold",
												children: ["Acc: ₹", ret.unpaidAccessoryTotal.toLocaleString("en-IN")]
											}),
											ret.damageCharges === 0 && ret.pendingBalance === 0 && (ret.unpaidAccessoryTotal || 0) === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-muted-foreground",
												children: "—"
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
										className: "text-right font-bold text-[12.5px] whitespace-nowrap",
										children: ret.refund >= 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "text-emerald-600 font-bold",
											children: [
												"₹",
												Math.abs(ret.refund).toLocaleString("en-IN"),
												" (Refund)"
											]
										}) : (() => {
											const totalDue = Math.abs(ret.refund);
											const paidAmt = ret.duePaidAmount !== void 0 ? ret.duePaidAmount : ret.duePaymentStatus === "Paid" ? totalDue : 0;
											const pendingDue = ret.duePendingBalance !== void 0 ? ret.duePendingBalance : Math.max(0, totalDue - paidAmt);
											const status = ret.duePaymentStatus === "Paid" || pendingDue <= 0 ? "Paid" : paidAmt > 0 ? "Partial" : "Not Paid";
											if (status === "Paid") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "text-emerald-600 font-bold",
												children: ["₹", totalDue.toLocaleString("en-IN")]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "inline-flex items-center rounded-md px-1.5 py-0.2 text-[9.5px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-200 mt-0.5",
												children: "Paid"
											})] });
											if (status === "Partial") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
													className: "text-amber-600 font-extrabold",
													children: [
														"₹",
														pendingDue.toLocaleString("en-IN"),
														" (Pending)"
													]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
													className: "text-[10px] text-emerald-600 font-semibold mt-0.5",
													children: [
														"Paid ₹",
														paidAmt.toLocaleString("en-IN"),
														" of ₹",
														totalDue.toLocaleString("en-IN")
													]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "inline-flex items-center rounded-md px-1.5 py-0.2 text-[9.5px] font-bold border bg-amber-50 text-amber-700 border-amber-200 mt-0.5",
													children: "Partial Paid"
												})
											] });
											return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "text-rose-600 font-bold",
												children: [
													"₹",
													totalDue.toLocaleString("en-IN"),
													" (Collect)"
												]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "inline-flex items-center rounded-md px-1.5 py-0.2 text-[9.5px] font-bold border bg-rose-50 text-rose-700 border-rose-200 mt-0.5",
												children: "Not Paid"
											})] });
										})()
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
										className: "text-center",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: `inline-flex items-center rounded-md px-2.5 py-0.5 text-[10.5px] font-bold border ${ret.status === "Pending Approval" ? "bg-warning/10 text-warning border-warning/25 animate-pulse" : "bg-emerald-50 text-emerald-700 border-emerald-200/50"}`,
											children: ret.status || "Completed"
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
										className: "text-right pr-6",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-end gap-1.5",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WhatsAppReturnMessageModal, {
													ret,
													rental: rentals.find((r) => r.id === ret.agreement),
													customer: customers.find((c) => c.name === ret.customer || c.id === rentals.find((r) => r.id === ret.agreement)?.customerId)
												}),
												ret.refund < 0 && ret.duePaymentStatus !== "Paid" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PayReturnDueDialog, {
													ret,
													onSave: refresh
												}),
												!isStaff && ret.status === "Pending Approval" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
													variant: "outline",
													size: "sm",
													className: "h-7 px-2 text-[11.5px] font-bold text-emerald-600 border-emerald-500/20 bg-emerald-50/10 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-500/40",
													onClick: () => {
														saveReturn({
															...ret,
															status: "Completed"
														});
														setMockReturns(getReturns());
														toast.success(`Return ${ret.id} approved successfully!`);
														if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("medirent-db-updated"));
													},
													children: "Approve"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
													variant: "ghost",
													size: "icon",
													className: "h-7 w-7 text-muted-foreground hover:text-foreground",
													onClick: () => {
														printReturnReceipt(ret);
														toast.success(`Receipt printed for ${ret.customer}`);
													},
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Receipt, { className: "h-4 w-4" })
												})
											]
										})
									})
								]
							}, ret.id);
						}) })] })
					})
				})]
			})]
		})
	});
}
function FieldLabel({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
		className: "text-[11.5px] font-bold uppercase tracking-wider text-muted-foreground",
		children
	});
}
//#endregion
export { ReturnsPage as component };
