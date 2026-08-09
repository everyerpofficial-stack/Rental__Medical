import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { D as getLocalYYYYMMDD, H as parseLocalDate, L as getPaidForEquipment, P as getNextPaymentNumber, R as getPayments, T as getEquipment, V as getReturns, b as getCustomers, g as formatDateDDMMYYYY, it as sortLatestFirst, p as downloadExcel, st as useDatabaseTrigger, tt as savePayment, z as getRentals } from "./data-store-BXBhFJro.mjs";
import { c as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { B as Mail, Ct as CircleCheck, I as MessageCircle, It as Bell, M as Phone, Mt as Calendar, gt as CreditCard, ot as FileSpreadsheet, p as TriangleAlert, q as IndianRupee, w as Search } from "../_libs/lucide-react.mjs";
import { a as DialogFooter, i as DialogContent, l as Input, n as Dialog, o as DialogHeader, r as DialogClose, s as DialogTitle, t as Button, u as Label } from "./dialog-BHa0LWsH.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-C2rs2HGz.mjs";
import { a as CardContent, h as StatusBadge, i as Card, o as CardHeader, s as CardTitle, t as AppShell } from "./AppShell-ABaTd-bJ.mjs";
import { a as TableHeader, i as TableHead, n as TableBody, o as TableRow, r as TableCell, t as Table } from "./table-DDeHIPcn.mjs";
import { i as TabsTrigger, r as TabsList, t as Tabs } from "./tabs-BoOa83d5.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/dues-Bc8riBf1.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function PayDialog({ rental, paymentsList, eqInventory, calcUnpaidDetailsForEquipment, getEquipmentName, onPaid }) {
	const eqItems = rental?.equipmentItems || [{
		equipmentId: rental.equipmentId,
		serial: rental.serial,
		monthlyRent: Number(rental.monthlyRent) || 0,
		returned: false
	}];
	const activeEqItems = (0, import_react.useMemo)(() => eqItems.filter((it) => !it.returned), [eqItems]);
	const [open, setOpen] = (0, import_react.useState)(false);
	const [selectedEqIds, setSelectedEqIds] = (0, import_react.useState)([]);
	(0, import_react.useEffect)(() => {
		if (open) {
			const activeIds = activeEqItems.map((it) => it.equipmentId);
			setSelectedEqIds(activeIds.length > 0 ? activeIds : [eqItems[0]?.equipmentId].filter(Boolean));
		}
	}, [
		open,
		rental,
		activeEqItems,
		eqItems
	]);
	const selectedItemsDetails = (0, import_react.useMemo)(() => {
		let totalOutstanding = 0;
		let totalPaid = 0;
		let totalDue = 0;
		const unpaidParts = [];
		const rateParts = [];
		selectedEqIds.forEach((eqId) => {
			const details = calcUnpaidDetailsForEquipment(rental, eqId);
			totalOutstanding += details.outstanding;
			totalPaid += details.grandTotalPaid;
			totalDue += details.totalDue;
			const eqName = getEquipmentName(eqId);
			if (details.unpaidText && details.unpaidText !== "0d" && details.unpaidText !== "0m" && details.unpaidText !== "—") unpaidParts.push(`${eqName}: ${details.unpaidText}`);
			rateParts.push(`${eqName} (${details.rateText})`);
		});
		return {
			outstanding: totalOutstanding,
			grandTotalPaid: totalPaid,
			totalDue,
			unpaidText: unpaidParts.join(", ") || "—",
			rateText: rateParts.join(" | ") || "₹0"
		};
	}, [
		rental,
		selectedEqIds,
		calcUnpaidDetailsForEquipment
	]);
	const [manualPayAmount, setManualPayAmount] = (0, import_react.useState)("");
	const [paymentDate, setPaymentDate] = (0, import_react.useState)(() => getLocalYYYYMMDD());
	const [paymentMode, setPaymentMode] = (0, import_react.useState)("Bank");
	const [txRef, setTxRef] = (0, import_react.useState)("");
	const [cashAmount, setCashAmount] = (0, import_react.useState)("");
	const [bankAmount, setBankAmount] = (0, import_react.useState)("");
	const payAmount = Number(manualPayAmount) || 0;
	const isMultiItem = selectedEqIds.length > 1;
	(0, import_react.useEffect)(() => {
		if (open) {
			const totalOutstanding = selectedItemsDetails.outstanding;
			setManualPayAmount(totalOutstanding.toString());
			setPaymentDate(getLocalYYYYMMDD());
			const cAmt = Math.round(totalOutstanding / 2);
			setCashAmount(cAmt.toString());
			setBankAmount((totalOutstanding - cAmt).toString());
		}
	}, [
		open,
		selectedEqIds,
		selectedItemsDetails.outstanding
	]);
	const handleAmountChange = (val) => {
		setManualPayAmount(val);
		const num = Number(val) || 0;
		if (paymentMode === "Cash+Bank") {
			const cAmt = Math.round(num / 2);
			setCashAmount(cAmt.toString());
			setBankAmount((num - cAmt).toString());
		}
	};
	const [itemPayments, setItemPayments] = (0, import_react.useState)({});
	(0, import_react.useEffect)(() => {
		if (open) setItemPayments({});
	}, [open]);
	(0, import_react.useEffect)(() => {
		if (!open) return;
		setItemPayments((prev) => {
			const next = {};
			selectedEqIds.forEach((eqId) => {
				if (prev[eqId]) {
					next[eqId] = prev[eqId];
					return;
				}
				const outstanding = calcUnpaidDetailsForEquipment(rental, eqId).outstanding;
				const cAmt = Math.round(outstanding / 2);
				next[eqId] = {
					amount: outstanding.toString(),
					mode: "Bank",
					cashAmount: cAmt.toString(),
					bankAmount: (outstanding - cAmt).toString(),
					txRef: ""
				};
			});
			return next;
		});
	}, [open, selectedEqIds]);
	const updateItemPayment = (eqId, patch) => {
		setItemPayments((prev) => ({
			...prev,
			[eqId]: {
				...prev[eqId],
				...patch
			}
		}));
	};
	const handleItemAmountChange = (eqId, val) => {
		if (itemPayments[eqId]?.mode === "Cash+Bank") {
			const num = Number(val) || 0;
			const cAmt = Math.round(num / 2);
			updateItemPayment(eqId, {
				amount: val,
				cashAmount: cAmt.toString(),
				bankAmount: (num - cAmt).toString()
			});
		} else updateItemPayment(eqId, { amount: val });
	};
	const handleItemModeChange = (eqId, mode) => {
		const current = itemPayments[eqId];
		const amt = Number(current?.amount) || 0;
		if (mode === "Cash+Bank") {
			const cAmt = Math.round(amt / 2);
			updateItemPayment(eqId, {
				mode,
				cashAmount: cAmt.toString(),
				bankAmount: (amt - cAmt).toString()
			});
		} else updateItemPayment(eqId, { mode });
	};
	const handleItemCashChange = (eqId, val) => {
		const amt = Number(itemPayments[eqId]?.amount) || 0;
		const cNum = Math.max(0, Number(val) || 0);
		updateItemPayment(eqId, {
			cashAmount: val,
			bankAmount: Math.max(0, amt - cNum).toString()
		});
	};
	const handleItemBankChange = (eqId, val) => {
		const amt = Number(itemPayments[eqId]?.amount) || 0;
		const bNum = Math.max(0, Number(val) || 0);
		updateItemPayment(eqId, {
			bankAmount: val,
			cashAmount: Math.max(0, amt - bNum).toString()
		});
	};
	const multiItemTotal = selectedEqIds.reduce((sum, id) => sum + (Number(itemPayments[id]?.amount) || 0), 0);
	const handlePay = () => {
		if (!paymentDate) {
			toast.error("Please select a payment date.");
			return;
		}
		if (selectedEqIds.length === 0) {
			toast.error("Please select at least one equipment item.");
			return;
		}
		if (isMultiItem) {
			if (multiItemTotal <= 0) {
				toast.error("Please enter a valid payment amount for at least one item.");
				return;
			}
			selectedEqIds.forEach((eqId) => {
				const item = itemPayments[eqId];
				if (!item) return;
				const amt = Number(item.amount) || 0;
				if (amt <= 0) return;
				const eqName = getEquipmentName(eqId);
				if (item.mode === "Cash+Bank") {
					const cAmt = Number(item.cashAmount) || 0;
					const bAmt = Number(item.bankAmount) || 0;
					if (cAmt > 0) savePayment({
						id: getNextPaymentNumber(),
						date: paymentDate,
						customer: rental.customer,
						customerId: rental.customerId,
						agreement: rental.id,
						equipmentId: eqId,
						amount: cAmt,
						mode: "Cash",
						type: "Rent",
						notes: `${eqName}: Rent Payment (Cash portion of ₹${amt.toLocaleString("en-IN")})`,
						status: "Paid"
					});
					if (bAmt > 0) savePayment({
						id: getNextPaymentNumber(),
						date: paymentDate,
						customer: rental.customer,
						customerId: rental.customerId,
						agreement: rental.id,
						equipmentId: eqId,
						amount: bAmt,
						mode: "Bank",
						type: "Rent",
						txRef: item.txRef,
						notes: `${eqName}: Rent Payment (Bank portion of ₹${amt.toLocaleString("en-IN")})`,
						status: "Paid"
					});
				} else savePayment({
					id: getNextPaymentNumber(),
					date: paymentDate,
					customer: rental.customer,
					customerId: rental.customerId,
					agreement: rental.id,
					equipmentId: eqId,
					amount: amt,
					mode: item.mode,
					type: "Rent",
					txRef: item.txRef,
					notes: `${eqName}: Rent Payment`,
					status: "Paid"
				});
			});
			toast.success(`₹${multiItemTotal.toLocaleString("en-IN")} payment recorded for ${selectedEqIds.map((id) => getEquipmentName(id)).join(", ")} (${rental.id})`);
			setOpen(false);
			onPaid();
			return;
		}
		if (payAmount <= 0) {
			toast.error("Please enter a valid payment amount.");
			return;
		}
		const totalSelectedOutstanding = selectedItemsDetails.outstanding;
		const eqItemsRatios = selectedEqIds.map((eqId) => {
			const details = calcUnpaidDetailsForEquipment(rental, eqId);
			let ratio = 0;
			if (totalSelectedOutstanding > 0) ratio = details.outstanding / totalSelectedOutstanding;
			else ratio = 1 / selectedEqIds.length;
			return {
				eqId,
				ratio
			};
		});
		let cashRemaining = Number(cashAmount) || 0;
		let bankRemaining = Number(bankAmount) || 0;
		let payRemaining = payAmount;
		selectedEqIds.forEach((eqId, idx) => {
			const itemRatio = eqItemsRatios.find((r) => r.eqId === eqId)?.ratio || 0;
			let cAmt = 0;
			let bAmt = 0;
			let totalAmt = 0;
			if (idx === selectedEqIds.length - 1) {
				cAmt = cashRemaining;
				bAmt = bankRemaining;
				totalAmt = payRemaining;
			} else {
				if (paymentMode === "Cash+Bank") {
					cAmt = Math.round((Number(cashAmount) || 0) * itemRatio);
					bAmt = Math.round((Number(bankAmount) || 0) * itemRatio);
					totalAmt = cAmt + bAmt;
				} else totalAmt = Math.round(payAmount * itemRatio);
				cashRemaining -= cAmt;
				bankRemaining -= bAmt;
				payRemaining -= totalAmt;
			}
			const eqName = getEquipmentName(eqId);
			if (paymentMode === "Cash+Bank") {
				if (cAmt > 0) savePayment({
					id: getNextPaymentNumber(),
					date: paymentDate,
					customer: rental.customer,
					customerId: rental.customerId,
					agreement: rental.id,
					equipmentId: eqId,
					amount: cAmt,
					mode: "Cash",
					type: "Rent",
					notes: `${eqName}: Rent Payment (Cash portion of ₹${totalAmt.toLocaleString("en-IN")})`,
					status: "Paid"
				});
				if (bAmt > 0) savePayment({
					id: getNextPaymentNumber(),
					date: paymentDate,
					customer: rental.customer,
					customerId: rental.customerId,
					agreement: rental.id,
					equipmentId: eqId,
					amount: bAmt,
					mode: "Bank",
					type: "Rent",
					txRef,
					notes: `${eqName}: Rent Payment (Bank portion of ₹${totalAmt.toLocaleString("en-IN")})`,
					status: "Paid"
				});
			} else if (totalAmt > 0) savePayment({
				id: getNextPaymentNumber(),
				date: paymentDate,
				customer: rental.customer,
				customerId: rental.customerId,
				agreement: rental.id,
				equipmentId: eqId,
				amount: totalAmt,
				mode: paymentMode,
				type: "Rent",
				txRef,
				notes: `${eqName}: Rent Payment`,
				status: "Paid"
			});
		});
		toast.success(`₹${payAmount.toLocaleString("en-IN")} payment recorded for ${selectedEqIds.map((id) => getEquipmentName(id)).join(", ")} (${rental.id})`);
		setOpen(false);
		onPaid();
	};
	const hasPayableItems = selectedEqIds.some((eqId) => {
		const item = eqItems.find((it) => it.equipmentId === eqId);
		const details = calcUnpaidDetailsForEquipment(rental, eqId);
		return !item?.returned || details.outstanding > 0;
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
		size: "sm",
		className: "h-7 px-3 text-[11px] font-bold gap-1 bg-success hover:bg-success/90 text-white animate-[pulse_3s_infinite]",
		onClick: () => setOpen(true),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CreditCard, { className: "h-3 w-3" }), " Pay"]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange: setOpen,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "max-w-md max-h-[90vh] flex flex-col p-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, {
					className: "pb-2 border-b border-border/40",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CreditCard, { className: "h-4 w-4 text-primary" }), " Record Rent Payment"]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex-1 overflow-y-auto pr-1 py-3 my-1 space-y-3.5 max-h-[58vh]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between items-center",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									className: "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
									children: "Select Equipment"
								}), activeEqItems.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => {
										const activeIds = activeEqItems.map((it) => it.equipmentId);
										if (selectedEqIds.length === activeIds.length) setSelectedEqIds([activeIds[0]]);
										else setSelectedEqIds(activeIds);
									},
									className: "text-[10px] text-primary font-bold hover:underline",
									children: selectedEqIds.length === activeEqItems.length ? "Select Single" : "Select All"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: `space-y-1.5 overflow-y-auto pr-1 border rounded-lg p-1.5 bg-background/50 ${isMultiItem ? "max-h-80" : "max-h-36"}`,
								children: eqItems.map((item) => {
									const details = calcUnpaidDetailsForEquipment(rental, item.equipmentId);
									const isReturned = !!item.returned;
									const isChecked = !isReturned && selectedEqIds.includes(item.equipmentId);
									return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: `flex items-start gap-2 p-1.5 rounded-md border transition-all ${isReturned ? "opacity-60 bg-muted/20 border-transparent cursor-not-allowed" : isChecked ? "border-primary/20 bg-primary/5 cursor-pointer hover:bg-muted/30" : "border-transparent cursor-pointer hover:bg-muted/30"}`,
										onClick: () => {
											if (isReturned) return;
											setSelectedEqIds((prev) => prev.includes(item.equipmentId) ? prev.length > 1 ? prev.filter((id) => id !== item.equipmentId) : prev : [...prev, item.equipmentId]);
										},
										children: [!isReturned ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "checkbox",
											checked: isChecked,
											onChange: () => {},
											className: "mt-0.5 rounded border-muted text-primary focus:ring-primary h-3.5 w-3.5 pointer-events-none"
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-3.5 h-3.5 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex-1 min-w-0",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex justify-between font-medium text-[12px] leading-tight",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "flex items-center gap-1.5 min-w-0",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: `truncate ${item.returned ? "line-through text-muted-foreground/50" : ""}`,
															children: getEquipmentName(item.equipmentId)
														}), item.returned && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "inline-flex items-center rounded-md bg-success/8 px-1.5 py-0.5 text-[9px] font-bold text-success border border-success/15 shrink-0",
															children: "Returned"
														})]
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: `font-mono font-bold shrink-0 ${details.outstanding > 0 ? "text-destructive" : "text-success"}`,
														children: ["₹", details.outstanding.toLocaleString("en-IN")]
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex justify-between text-[10px] text-muted-foreground mt-0.5 leading-tight",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
														item.serial ? `#${item.serial} • ` : "",
														details.rateText,
														" • ",
														item.returned ? "Returned" : details.unpaidText
													] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Paid: ₹", details.grandTotalPaid.toLocaleString("en-IN")] })]
												}),
												isMultiItem && isChecked && itemPayments[item.equipmentId] && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "mt-2 space-y-1.5 border-t border-border/40 pt-2",
													onClick: (e) => e.stopPropagation(),
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "grid grid-cols-2 gap-1.5",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "space-y-0.5",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
																	className: "text-[9px] font-bold uppercase tracking-wider text-muted-foreground",
																	children: "Amount (₹)"
																}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																	type: "number",
																	value: itemPayments[item.equipmentId].amount,
																	onChange: (e) => handleItemAmountChange(item.equipmentId, e.target.value),
																	className: "h-7 text-[11px] bg-background font-semibold"
																})]
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "space-y-0.5",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
																	className: "text-[9px] font-bold uppercase tracking-wider text-muted-foreground",
																	children: "Method"
																}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
																	value: itemPayments[item.equipmentId].mode,
																	onValueChange: (m) => handleItemModeChange(item.equipmentId, m),
																	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
																		className: "h-7 text-[11px]",
																		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
																	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: [
																		"Cash",
																		"Bank",
																		"Cash+Bank"
																	].map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
																		value: m,
																		children: m
																	}, m)) })]
																})]
															})]
														}),
														itemPayments[item.equipmentId].mode === "Cash+Bank" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "grid grid-cols-2 gap-1.5 rounded-lg border border-border bg-muted/20 p-1.5",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "space-y-0.5",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
																	className: "text-[9px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400",
																	children: "Cash (₹)"
																}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																	type: "number",
																	value: itemPayments[item.equipmentId].cashAmount,
																	onChange: (e) => handleItemCashChange(item.equipmentId, e.target.value),
																	className: "h-7 text-[11px] font-semibold bg-emerald-50/20"
																})]
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "space-y-0.5",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
																	className: "text-[9px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400",
																	children: "Bank (₹)"
																}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																	type: "number",
																	value: itemPayments[item.equipmentId].bankAmount,
																	onChange: (e) => handleItemBankChange(item.equipmentId, e.target.value),
																	className: "h-7 text-[11px] font-semibold bg-blue-50/20"
																})]
															})]
														}),
														itemPayments[item.equipmentId].mode !== "Cash" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
															placeholder: "Txn ref (optional)",
															value: itemPayments[item.equipmentId].txRef,
															onChange: (e) => updateItemPayment(item.equipmentId, { txRef: e.target.value }),
															className: "h-7 text-[11px]"
														})
													]
												})
											]
										})]
									}, item.equipmentId);
								})
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "bg-muted/30 rounded-lg p-2.5 text-[11px] space-y-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-bold text-foreground",
									children: rental.customer
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-mono text-primary font-semibold",
									children: rental.id
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "border-t border-border/40 my-1 pt-1 space-y-1",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex justify-between text-muted-foreground",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Selected Items:" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "font-semibold text-foreground",
											children: [
												selectedEqIds.length,
												" of ",
												activeEqItems.length || eqItems.length
											]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex justify-between text-muted-foreground",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Unpaid Duration:" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-bold text-destructive",
											children: selectedItemsDetails.unpaidText
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex justify-between text-muted-foreground",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Total Paid to Date:" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "font-semibold text-success",
											children: ["₹", selectedItemsDetails.grandTotalPaid.toLocaleString("en-IN")]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex justify-between text-muted-foreground",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Remaining Balance:" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: `font-bold ${selectedItemsDetails.outstanding > 0 ? "text-destructive" : "text-success"}`,
											children: ["₹", selectedItemsDetails.outstanding.toLocaleString("en-IN")]
										})]
									})
								]
							})]
						}),
						hasPayableItems ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [isMultiItem ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "rounded-lg border border-primary/20 bg-primary/5 p-2 text-[11px] text-muted-foreground",
							children: "Set the amount and payment method for each item above. Multiple items selected — enter them separately per item."
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								className: "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
								children: "Payment Date"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								type: "date",
								value: paymentDate,
								onChange: (e) => setPaymentDate(e.target.value),
								className: "h-8.5 text-[12px] bg-background"
							})]
						})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-2 gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										className: "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
										children: "Amount to Pay (₹)"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										type: "number",
										placeholder: "e.g. 500",
										value: manualPayAmount,
										onChange: (e) => handleAmountChange(e.target.value),
										className: "h-8.5 text-[12px] bg-background font-semibold text-foreground"
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										className: "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
										children: "Payment Date"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										type: "date",
										value: paymentDate,
										onChange: (e) => setPaymentDate(e.target.value),
										className: "h-8.5 text-[12px] bg-background"
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									className: "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
									children: "Payment Method"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
									value: paymentMode,
									onValueChange: (m) => {
										setPaymentMode(m);
										if (m === "Cash+Bank") {
											const cAmt = Math.round(payAmount / 2);
											setCashAmount(cAmt.toString());
											setBankAmount((payAmount - cAmt).toString());
										}
									},
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
										className: "h-8.5 text-[12px]",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: [
										"Cash",
										"Bank",
										"Cash+Bank"
									].map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: m,
										children: m
									}, m)) })]
								})]
							}),
							paymentMode === "Cash+Bank" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-2 gap-2 p-2 bg-muted/20 rounded-lg border border-border",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										className: "text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400",
										children: "Cash Amount (₹)"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										type: "number",
										placeholder: "Cash portion",
										className: "h-8 text-[12px] font-semibold bg-emerald-50/20",
										value: cashAmount,
										onChange: (e) => {
											const val = e.target.value;
											setCashAmount(val);
											const cNum = Math.max(0, Number(val) || 0);
											setBankAmount(Math.max(0, payAmount - cNum).toString());
										}
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										className: "text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400",
										children: "Bank Amount (₹)"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										type: "number",
										placeholder: "Bank portion",
										className: "h-8 text-[12px] font-semibold bg-blue-50/20",
										value: bankAmount,
										onChange: (e) => {
											const val = e.target.value;
											setBankAmount(val);
											const bNum = Math.max(0, Number(val) || 0);
											setCashAmount(Math.max(0, payAmount - bNum).toString());
										}
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									className: "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
									children: "Transaction Reference (Optional)"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									placeholder: "UPI txn ID, cheque no, etc.",
									value: txRef,
									onChange: (e) => setTxRef(e.target.value),
									className: "h-8.5 text-[12px]"
								})]
							})
						] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-lg border border-success/20 bg-success/5 p-2 flex items-center justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[11px] font-semibold text-muted-foreground",
								children: "Total Payable"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "font-display text-[18px] font-bold text-success",
								children: ["₹", (isMultiItem ? multiItemTotal : payAmount).toLocaleString("en-IN")]
							})]
						})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "rounded-lg border border-success/20 bg-success/5 p-2 text-center text-success font-semibold text-[12px]",
							children: "All selected items have been returned and are fully paid!"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
					className: "pt-2 border-t border-border/40 mt-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogClose, {
						asChild: true,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							type: "button",
							size: "sm",
							children: "Cancel"
						})
					}), hasPayableItems && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						type: "button",
						onClick: handlePay,
						size: "sm",
						className: "gap-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "h-4 w-4" }), " Confirm Payment"]
					})]
				})
			]
		})
	})] });
}
function DuesPage() {
	const dbVersion = useDatabaseTrigger();
	const [activeTab, setActiveTab] = (0, import_react.useState)("all");
	const [refreshKey, setRefreshKey] = (0, import_react.useState)(0);
	const rentalsList = (0, import_react.useMemo)(() => getRentals(), [refreshKey, dbVersion]);
	const paymentsList = (0, import_react.useMemo)(() => getPayments(), [refreshKey, dbVersion]);
	const formatRupee = (val) => `₹${val.toLocaleString("en-IN")}`;
	const today = /* @__PURE__ */ new Date();
	today.setHours(0, 0, 0, 0);
	today.getMonth();
	today.getFullYear();
	today.getDate();
	const getStartDayOfMonth = (dateStr) => {
		const d = parseLocalDate(dateStr);
		if (isNaN(d.getTime())) return 1;
		return d.getDate();
	};
	const getOrdinalSuffix = (day) => {
		if (day > 3 && day < 21) return `${day}th`;
		switch (day % 10) {
			case 1: return `${day}st`;
			case 2: return `${day}nd`;
			case 3: return `${day}rd`;
			default: return `${day}th`;
		}
	};
	const [eqInventory] = (0, import_react.useState)(() => getEquipment());
	const getEquipmentName = (eqId) => {
		const eq = eqInventory.find((e) => e.id === eqId);
		return eq ? eq.name : eqId;
	};
	const calcUnpaidDetailsForEquipment = (rental, eqId) => {
		const originalStart = parseLocalDate(rental.start);
		if (isNaN(originalStart.getTime())) return {
			unpaidMonths: 0,
			unpaidDays: 0,
			outstanding: 0,
			unpaidText: "0 d",
			rateText: "₹0",
			isMonthly: false,
			totalDue: 0,
			grandTotalPaid: 0
		};
		const item = (rental.equipmentItems || []).find((it) => it.equipmentId === eqId);
		const monthlyRent = item ? Number(item.monthlyRent || item.rentRate) || 0 : 0;
		const dailyRate = (item ? Number(item.dailyRent) : 0) || rental.dailyRent || 0;
		const isMonthly = (item?.rentCycle || rental.rentCycle || (monthlyRent > 0 && dailyRate === 0 ? "Monthly" : "Daily")) === "Monthly";
		monthlyRent / 30;
		const start = parseLocalDate(rental.start);
		const grandTotalPaid = getPaidForEquipment(rental, eqId, paymentsList, true);
		let unpaidMonths = 0;
		let unpaidDays = 0;
		let outstanding = 0;
		let unpaidText = "";
		let rateText = "";
		let totalDue = 0;
		let billingEndDate = today;
		if (item?.returned) {
			const ret = getReturns().find((r) => r.agreement === rental.id && r.returnedEquipmentIds?.includes(eqId));
			if (ret?.date) {
				const parsedReturn = parseLocalDate(ret.date);
				if (!isNaN(parsedReturn.getTime())) billingEndDate = parsedReturn;
			}
		}
		if (isMonthly) {
			const diffTime = Math.max(0, billingEndDate.getTime() - start.getTime());
			const totalDaysElapsed = Math.ceil(diffTime / (1e3 * 60 * 60 * 24));
			totalDue = Math.floor(totalDaysElapsed / 30) * monthlyRent;
			outstanding = item?.returned ? 0 : Math.max(0, totalDue - grandTotalPaid);
			unpaidMonths = monthlyRent > 0 ? Math.round(outstanding / monthlyRent) : 0;
			unpaidText = item?.returned ? "—" : `${unpaidMonths}m`;
			rateText = `₹${monthlyRent.toLocaleString("en-IN")}/mo`;
		} else {
			const diffTime = Math.max(0, billingEndDate.getTime() - start.getTime());
			totalDue = Math.ceil(diffTime / (1e3 * 60 * 60 * 24)) * dailyRate;
			outstanding = item?.returned ? 0 : Math.max(0, totalDue - grandTotalPaid);
			unpaidDays = dailyRate > 0 ? Math.round(outstanding / dailyRate) : 0;
			unpaidMonths = 0;
			unpaidText = item?.returned ? "—" : `${unpaidDays}d`;
			rateText = `₹${dailyRate.toLocaleString("en-IN")}/day`;
		}
		return {
			unpaidMonths,
			unpaidDays,
			outstanding,
			unpaidText,
			rateText,
			isMonthly,
			totalDue,
			grandTotalPaid
		};
	};
	const activeRentals = (0, import_react.useMemo)(() => {
		return rentalsList.filter((r) => {
			if (r.status === "Completed" || r.status === "Cancelled") return false;
			const eqItems = r.equipmentItems || [{
				equipmentId: r.equipmentId,
				serial: r.serial,
				monthlyRent: Number(r.monthlyRent) || 0,
				deposit: Number(r.deposit) || 0,
				returned: false
			}];
			const hasUnreturned = eqItems.some((item) => !item.returned);
			const hasOutstandingDues = eqItems.some((item) => {
				const { outstanding } = calcUnpaidDetailsForEquipment(r, item.equipmentId);
				return outstanding > 0;
			});
			return hasUnreturned || hasOutstandingDues;
		});
	}, [rentalsList, paymentsList]);
	const dueRentals = (0, import_react.useMemo)(() => {
		return sortLatestFirst(activeRentals.map((r) => {
			const eqItems = r.equipmentItems || [{
				equipmentId: r.equipmentId,
				serial: r.serial,
				monthlyRent: Number(r.monthlyRent) || 0,
				deposit: Number(r.deposit) || 0,
				returned: false
			}];
			let totalOutstanding = 0;
			let totalPaid = 0;
			eqItems.forEach((eqItem) => {
				const { outstanding, grandTotalPaid } = calcUnpaidDetailsForEquipment(r, eqItem.equipmentId);
				totalOutstanding += outstanding;
				totalPaid += grandTotalPaid;
			});
			return {
				rental: r,
				totalOutstanding,
				totalPaid,
				start: r.start,
				id: r.id
			};
		}), "start");
	}, [activeRentals, paymentsList]);
	const due1To10List = dueRentals.filter((item) => {
		const d = getStartDayOfMonth(item.start);
		return d >= 1 && d <= 10;
	});
	const due11To20List = dueRentals.filter((item) => {
		const d = getStartDayOfMonth(item.start);
		return d >= 11 && d <= 20;
	});
	const due21To31List = dueRentals.filter((item) => {
		const d = getStartDayOfMonth(item.start);
		return d >= 21 && d <= 31;
	});
	const [searchQuery, setSearchQuery] = (0, import_react.useState)("");
	const customersList = (0, import_react.useMemo)(() => getCustomers(), [dbVersion]);
	const getCustomerPhones = (customerId) => {
		const cust = customersList.find((c) => c.id === customerId);
		if (!cust) return [];
		return [
			cust.phone,
			cust.altPhone,
			cust.contactNumber3
		].map((p) => String(p || "").trim()).filter(Boolean);
	};
	const filteredRentals = dueRentals.filter((item) => {
		const r = item.rental;
		const q = searchQuery.toLowerCase().trim();
		const customer = customersList.find((c) => c.id === r.customerId);
		if (!(!q || r.id.toLowerCase().includes(q) || r.customer.toLowerCase().includes(q) || String(r.equipment || "").toLowerCase().includes(q) || String(r.serial || "").toLowerCase().includes(q) || r.equipmentItems && r.equipmentItems.some((ei) => String(ei.serial || "").toLowerCase().includes(q)) || customer && (String(customer.phone || "").toLowerCase().includes(q) || String(customer.altPhone || "").toLowerCase().includes(q) || String(customer.contactNumber3 || "").toLowerCase().includes(q) || String(customer.area || "").toLowerCase().includes(q) || String(customer.address || "").toLowerCase().includes(q)))) return false;
		if (activeTab === "all") return true;
		const day = getStartDayOfMonth(item.start);
		if (activeTab === "1-10") return day >= 1 && day <= 10;
		if (activeTab === "11-20") return day >= 11 && day <= 20;
		if (activeTab === "21-31") return day >= 21 && day <= 31;
		return true;
	});
	const severityBuckets = [
		{
			l: "1–10 Days Due (1st–10th)",
			v: formatRupee(due1To10List.reduce((sum, item) => sum + item.totalOutstanding, 0)),
			n: `${due1To10List.filter((item) => item.totalOutstanding > 0).length} agreement(s) due`,
			icon: Calendar,
			iconColor: "text-primary"
		},
		{
			l: "11–20 Days Due (11th–20th)",
			v: formatRupee(due11To20List.reduce((sum, item) => sum + item.totalOutstanding, 0)),
			n: `${due11To20List.filter((item) => item.totalOutstanding > 0).length} agreement(s) due`,
			icon: IndianRupee,
			iconColor: "text-accent"
		},
		{
			l: "21–31 Days Due (21st–31st)",
			v: formatRupee(due21To31List.reduce((sum, item) => sum + item.totalOutstanding, 0)),
			n: `${due21To31List.filter((item) => item.totalOutstanding > 0).length} agreement(s) due`,
			icon: TriangleAlert,
			iconColor: "text-warning-foreground",
			alert: true
		}
	];
	const handleExportExcel = () => {
		const listToExport = filteredRentals.length > 0 ? filteredRentals : dueRentals;
		if (listToExport.length === 0) {
			toast.error("No rent due records available to export.");
			return;
		}
		const headers = [
			"Customer Name",
			"Phone Number",
			"Agreement ID",
			"Equipment",
			"Serial Number",
			"Start Date",
			"Billing Cycle Day",
			"Due Bracket",
			"Rent Rate (₹)",
			"Remaining Due (₹)",
			"Status"
		];
		const rows = listToExport.map((item) => {
			const r = item.rental;
			const custPhone = customersList.find((c) => c.id === r.customerId)?.phone || r.phone || "";
			const day = getStartDayOfMonth(item.start);
			let dueBracket = "1-10 Days (1st–10th)";
			if (day >= 11 && day <= 20) dueBracket = "11-20 Days (11th–20th)";
			if (day >= 21 && day <= 31) dueBracket = "21-31 Days (21st–31st)";
			const eqItems = r.equipmentItems || [{
				equipmentId: r.equipmentId,
				serial: r.serial,
				monthlyRent: Number(r.monthlyRent) || 0
			}];
			const eqNames = eqItems.map((ei) => getEquipmentName(ei.equipmentId)).join(", ");
			const serials = eqItems.map((ei) => ei.serial || "XXXX").join(", ");
			const rates = eqItems.map((ei) => {
				const isMonthly = Number(ei.monthlyRent) > 0;
				return `₹${(isMonthly ? Number(ei.monthlyRent) : Number(ei.dailyRent || ei.rentRate || 0)).toLocaleString("en-IN")}/${isMonthly ? "mo" : "day"}`;
			}).join(", ");
			const startDateFormatted = formatDateDDMMYYYY(r.start);
			const billingDayText = `Every ${day}${day === 1 ? "st" : day === 2 ? "nd" : day === 3 ? "rd" : "th"}`;
			return [
				r.customer || "Unknown",
				custPhone,
				r.id,
				eqNames || r.equipment || "Equipment",
				serials || r.serial || "N/A",
				startDateFormatted,
				billingDayText,
				dueBracket,
				rates,
				`₹${item.totalOutstanding.toLocaleString("en-IN")}`,
				r.status || "Active"
			];
		});
		const filename = `rent_due_statement_${activeTab === "all" ? "1-10_11-20_21-31" : activeTab === "1-10" ? "1-10_Days" : activeTab === "11-20" ? "11-20_Days" : "21-31_Days"}_${getLocalYYYYMMDD()}.xls`;
		downloadExcel(filename, headers, rows, [
			180,
			120,
			130,
			220,
			140,
			110,
			130,
			160,
			140,
			130,
			100
		]);
		toast.success(`Excel report "${filename}" generated & downloaded successfully!`);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "Rent Dues",
		subtitle: "Automated due tracking with outstanding balance calculations",
		actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				variant: "outline",
				size: "sm",
				className: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-300 font-bold gap-1.5",
				onClick: handleExportExcel,
				title: "Export Excel Report for Rent Dues (1-10, 11-20, 21-31)",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileSpreadsheet, { className: "h-3.5 w-3.5 text-emerald-600" }), "Export Excel Report"]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				size: "sm",
				onClick: () => {
					toast.success("Sending reminders to " + filteredRentals.length + " customer(s) via WhatsApp, SMS & Email.");
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bell, { className: "mr-1.5 h-3.5 w-3.5" }), "Send All Reminders"]
			})]
		}),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
			className: "mb-5 overflow-hidden",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
				className: "p-0",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-1 divide-y divide-border/60 sm:grid-cols-3 sm:divide-y-0 sm:divide-x",
					children: severityBuckets.map((s, i) => {
						const Icon = s.icon;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: `relative flex flex-col gap-1.5 p-4 transition-colors hover:bg-muted/30 animate-[fade-in_0.35s_ease-out_both] stagger-${i + 1}`,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: `h-4 w-4 ${s.iconColor}` }), s.alert && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "flex h-2 w-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute inline-flex h-2 w-2 animate-ping rounded-full bg-destructive opacity-60" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "relative inline-flex h-2 w-2 rounded-full bg-destructive" })]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground/60",
										children: s.l
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-display text-[18px] font-bold tracking-tight mt-0.5",
										children: s.v
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[11px] text-muted-foreground",
										children: s.n
									})
								] }),
								s.alert && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute bottom-0 inset-x-0 h-[2px] bg-destructive/40" })
							]
						}, s.l);
					})
				})
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
			className: "overflow-hidden",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, {
				className: "border-b border-border/60 bg-muted/20 px-4 py-3",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3 flex-1 max-w-md",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
								className: "shrink-0",
								children: "Pending Dues"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative flex-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									placeholder: "Search customer, phone, serial, agreement…",
									className: "pl-9 h-8 text-[12.5px] bg-card border-border/50 w-full",
									value: searchQuery,
									onChange: (e) => setSearchQuery(e.target.value)
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "hidden sm:flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tabs, {
								value: activeTab,
								onValueChange: setActiveTab,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, {
									className: "h-8",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
											value: "all",
											className: "text-[12px] h-7 px-3",
											children: "All"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
											value: "1-10",
											className: "text-[12px] h-7 px-3",
											children: "1–10 Days"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
											value: "11-20",
											className: "text-[12px] h-7 px-3",
											children: "11–20 Days"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
											value: "21-31",
											className: "text-[12px] h-7 px-3",
											children: "21–31 Days"
										})
									]
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "outline",
								size: "sm",
								className: "h-8 text-[12px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-300 gap-1.5",
								onClick: handleExportExcel,
								title: "Export Excel Statement",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileSpreadsheet, { className: "h-3.5 w-3.5 text-emerald-600" }), " Excel"]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex gap-1.5 overflow-x-auto pb-0.5 sm:hidden",
							children: [
								"all",
								"1-10",
								"11-20",
								"21-31"
							].map((tab) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setActiveTab(tab),
								className: `mobile-chip shrink-0 ${activeTab === tab ? "active" : ""}`,
								children: tab === "all" ? "All" : `${tab} Days`
							}, tab))
						})
					]
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
				className: "p-0",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "hidden sm:block overflow-x-auto",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Customer" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Agreement" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Equipment" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Billing Day" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Start Date" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
							className: "text-right",
							children: "Rate"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
							className: "text-right",
							children: "Unpaid Duration"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
							className: "text-right text-success",
							children: "Total Paid Amount"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
							className: "text-right text-destructive",
							children: "Remaining Balance"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Status" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
							className: "text-right w-36",
							children: "Actions"
						})
					] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableBody, { children: [filteredRentals.map((item) => {
						const r = item.rental;
						const eqItems = r.equipmentItems || [{
							equipmentId: r.equipmentId,
							serial: r.serial,
							monthlyRent: Number(r.monthlyRent) || 0,
							returned: false
						}];
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, {
							className: "group",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-semibold text-[13px]",
										children: r.customer
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[10px] font-mono text-muted-foreground/70",
										children: r.customerId
									}),
									getCustomerPhones(r.customerId).length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "mt-1 space-y-0.5",
										children: getCustomerPhones(r.customerId).map((p, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "flex items-center gap-1 text-[11px] text-muted-foreground",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, { className: "h-2.5 w-2.5 shrink-0" }),
												" ",
												p
											]
										}, idx))
									})
								] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "inline-flex items-center rounded-md bg-primary/8 border border-primary/18 px-2 py-0.5 font-mono text-[11px] font-bold text-primary",
									children: r.id
								}) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "space-y-1.5",
									children: eqItems.map((eqItem) => {
										const isReturned = eqItem.returned;
										return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-1.5 text-[12.5px]",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: isReturned ? "line-through text-muted-foreground/50" : "text-foreground/80 font-medium",
												children: getEquipmentName(eqItem.equipmentId)
											}), isReturned && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "inline-flex items-center rounded-md bg-success/8 px-1.5 py-0.5 text-[10px] font-bold text-success border border-success/15 shrink-0",
												children: "Returned"
											})]
										}, eqItem.equipmentId);
									})
								}) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-[12.5px] font-medium text-foreground",
									children: ["Every ", getOrdinalSuffix(getStartDayOfMonth(r.start))]
								}) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[12px] font-mono text-muted-foreground",
									children: formatDateDDMMYYYY(r.start)
								}) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
									className: "text-right",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "space-y-1.5 text-right",
										children: eqItems.map((eqItem) => {
											const { rateText } = calcUnpaidDetailsForEquipment(r, eqItem.equipmentId);
											return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: `text-[12px] font-semibold ${eqItem.returned ? "text-muted-foreground/40 line-through" : "text-muted-foreground"}`,
												children: rateText
											}, eqItem.equipmentId);
										})
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
									className: "text-right",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "space-y-1.5 text-right",
										children: eqItems.map((eqItem) => {
											const { unpaidText } = calcUnpaidDetailsForEquipment(r, eqItem.equipmentId);
											return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: `text-[12px] font-bold ${eqItem.returned ? "text-muted-foreground/40" : "text-destructive"}`,
												children: eqItem.returned ? "—" : unpaidText
											}, eqItem.equipmentId);
										})
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
									className: "text-right",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-1.5 text-right",
										children: [eqItems.map((eqItem) => {
											const { grandTotalPaid } = calcUnpaidDetailsForEquipment(r, eqItem.equipmentId);
											return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: `text-[12px] font-semibold ${eqItem.returned ? "text-success/50" : "text-success"}`,
												children: ["₹", grandTotalPaid.toLocaleString("en-IN")]
											}, eqItem.equipmentId);
										}), eqItems.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "border-t border-border/40 mt-1.5 pt-1.5 text-right",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-[9px] font-semibold text-muted-foreground block uppercase leading-none",
												children: "Total Paid"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "text-[12px] font-extrabold text-success",
												children: ["₹", item.totalPaid.toLocaleString("en-IN")]
											})]
										})]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
									className: "text-right",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-1.5 text-right",
										children: [eqItems.map((eqItem) => {
											const { outstanding } = calcUnpaidDetailsForEquipment(r, eqItem.equipmentId);
											return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: `text-[12px] font-bold ${eqItem.returned ? "text-muted-foreground/40 font-normal" : outstanding > 0 ? "text-destructive" : "text-success"}`,
												children: eqItem.returned ? "—" : `₹${outstanding.toLocaleString("en-IN")}`
											}, eqItem.equipmentId);
										}), eqItems.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "border-t border-border/40 mt-1.5 pt-1.5 text-right",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-[9px] font-semibold text-muted-foreground block uppercase leading-none",
												children: "Total Due"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: `text-[12.5px] font-extrabold ${item.totalOutstanding > 0 ? "text-destructive" : "text-success"}`,
												children: ["₹", item.totalOutstanding.toLocaleString("en-IN")]
											})]
										})]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, { status: r.status }) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
									className: "text-right",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-end gap-1 transition-opacity",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PayDialog, {
												rental: r,
												paymentsList,
												eqInventory,
												calcUnpaidDetailsForEquipment,
												getEquipmentName,
												onPaid: () => setRefreshKey((k) => k + 1)
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												variant: "ghost",
												size: "icon",
												className: "h-7 w-7 text-muted-foreground hover:text-success hover:bg-success/10",
												title: "WhatsApp",
												onClick: () => toast.success(`WhatsApp reminder sent to ${r.customer}`),
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { className: "h-3.5 w-3.5" })
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												variant: "ghost",
												size: "icon",
												className: "h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10",
												title: "SMS",
												onClick: () => toast.success(`SMS reminder sent to ${r.customer}`),
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, { className: "h-3.5 w-3.5" })
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												variant: "ghost",
												size: "icon",
												className: "h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10",
												title: "Email",
												onClick: () => toast.success(`Email reminder sent to ${r.customer}`),
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mail, { className: "h-3.5 w-3.5" })
											})
										]
									})
								})
							]
						}, item.id);
					}), filteredRentals.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableRow, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
						colSpan: 11,
						className: "py-10 text-center text-[13px] text-muted-foreground",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col items-center gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "h-8 w-8 text-success/50" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "No pending dues found matching this filter." }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[11px]",
									children: "All payments are up to date!"
								})
							]
						})
					}) })] })] })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "sm:hidden",
					children: filteredRentals.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "py-10 text-center text-[13px] text-muted-foreground",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "h-8 w-8 text-success/50 mx-auto mb-2" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "No pending dues." }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[11px] mt-1",
								children: "All payments are up to date!"
							})
						]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "divide-y divide-border/60",
						children: filteredRentals.map((item) => {
							const r = item.rental;
							const eqItems = r.equipmentItems || [{
								equipmentId: r.equipmentId,
								serial: r.serial,
								monthlyRent: Number(r.monthlyRent) || 0,
								returned: false
							}];
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "px-4 py-3.5 space-y-2.5",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-start justify-between gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "font-semibold text-[13.5px]",
												children: r.customer
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "inline-flex items-center rounded-md bg-primary/8 border border-primary/18 px-1.5 py-0.5 font-mono text-[11px] font-bold text-primary mt-0.5",
												children: r.id
											}),
											getCustomerPhones(r.customerId).length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "mt-1 space-y-0.5",
												children: getCustomerPhones(r.customerId).map((p, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
													className: "flex items-center gap-1 text-[11px] text-muted-foreground",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, { className: "h-2.5 w-2.5 shrink-0" }),
														" ",
														p
													]
												}, idx))
											})
										] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, { status: r.status })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "space-y-2 bg-muted/40 rounded-xl p-3",
										children: eqItems.map((eqItem) => {
											const { outstanding, unpaidText, grandTotalPaid } = calcUnpaidDetailsForEquipment(r, eqItem.equipmentId);
											return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "text-[12px] flex flex-col gap-0.5 border-b border-border/40 last:border-b-0 pb-2 last:pb-0 mb-2 last:mb-0",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center justify-between font-medium",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: eqItem.returned ? "line-through text-muted-foreground/60 font-medium" : "text-slate-800 font-semibold",
														children: getEquipmentName(eqItem.equipmentId)
													}), eqItem.returned ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "inline-flex items-center rounded bg-success/8 px-1.5 py-0.5 text-[9px] font-bold text-success border border-success/15 shrink-0",
														children: "Returned"
													}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "inline-flex items-center rounded bg-primary/8 px-1.5 py-0.5 text-[9px] font-bold text-primary border border-primary/15 shrink-0",
														children: "Active"
													})]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex justify-between text-[11.5px] text-muted-foreground mt-1",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Unpaid: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
															className: eqItem.returned ? "text-muted-foreground/50" : "text-destructive",
															children: eqItem.returned ? "—" : unpaidText
														})] }),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Paid: ", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", {
															className: eqItem.returned ? "text-success/50" : "text-success",
															children: ["₹", grandTotalPaid.toLocaleString("en-IN")]
														})] }),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Bal: ", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", {
															className: eqItem.returned ? outstanding > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground/40" : outstanding > 0 ? "text-destructive" : "text-success",
															children: ["₹", outstanding.toLocaleString("en-IN")]
														})] })
													]
												})]
											}, eqItem.equipmentId);
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex justify-between items-center text-[12.5px] pt-1 px-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-semibold text-slate-500",
											children: "Total Outstanding Balance:"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: `font-bold ${item.totalOutstanding > 0 ? "text-destructive" : "text-success"}`,
											children: ["₹", item.totalOutstanding.toLocaleString("en-IN")]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2 pt-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PayDialog, {
											rental: r,
											paymentsList,
											eqInventory,
											calcUnpaidDetailsForEquipment,
											getEquipmentName,
											onPaid: () => setRefreshKey((k) => k + 1)
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											variant: "outline",
											size: "sm",
											className: "h-7 text-[11px] px-2.5",
											onClick: () => toast.success(`WhatsApp reminder sent to ${r.customer}`),
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { className: "h-3.5 w-3.5" }), " Remind"]
										})]
									})
								]
							}, item.id);
						})
					})
				})]
			})]
		})]
	});
}
//#endregion
export { DuesPage as component };
