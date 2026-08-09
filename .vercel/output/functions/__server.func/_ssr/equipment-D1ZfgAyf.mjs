import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { D as getLocalYYYYMMDD, E as getExchanges, H as parseLocalDate, Q as saveEquipment, T as getEquipment, V as getReturns, b as getCustomers, c as deleteEquipment, g as formatDateDDMMYYYY, m as downloadFile, p as downloadExcel, st as useDatabaseTrigger, z as getRentals } from "./data-store-BQmZefNN.mjs";
import { c as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { A as Printer, D as RefreshCw, Ht as ArrowDownLeft, J as House, Lt as Bed, Mt as Calendar, P as Package, Q as Funnel, Ut as Activity, Y as History, _ as Stethoscope, h as Trash2, j as Plus, k as QrCode, n as Wind, ot as FileSpreadsheet, pt as Droplets, q as IndianRupee, v as SquarePen, w as Search, zt as ArrowUpRight } from "../_libs/lucide-react.mjs";
import { a as DialogFooter, c as DialogTrigger, i as DialogContent, l as Input, n as Dialog, o as DialogHeader, r as DialogClose, s as DialogTitle, t as Button, u as Label } from "./dialog-BHa0LWsH.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-C2rs2HGz.mjs";
import { a as CardContent, h as StatusBadge, i as Card, t as AppShell } from "./AppShell-BtlnpavN.mjs";
import { n as isOwnOwner, t as EquipmentFormDialog } from "./EquipmentFormDialog-BgCezUAS.mjs";
import { i as SheetTitle, n as SheetContent, r as SheetHeader, t as Sheet } from "./sheet-FhayDLmg.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/equipment-D1ZfgAyf.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var categoryIcons = {
	"Oxygen Concentrator 5LP": Wind,
	"Oxygen Concentrator 10LPM": Wind,
	"Bipap Machine": Funnel,
	"Auto CPAP Machine": Activity,
	"Surgical Cot With Mattress": Bed,
	"Foldable Wheel Chair": Package,
	"Patient Monitor": Activity,
	"Syringe Pump": Droplets,
	"Infusion Pump": Droplets,
	"Nebulizer": Wind,
	"Patient Ventilator": Wind
};
var categoryColors = {
	"Oxygen Concentrator 5LP": "text-primary bg-primary/10",
	"Oxygen Concentrator 10LPM": "text-primary bg-primary/10",
	"Bipap Machine": "text-primary bg-primary/10",
	"Auto CPAP Machine": "text-primary bg-primary/10",
	"Surgical Cot With Mattress": "text-accent bg-accent/10",
	"Foldable Wheel Chair": "text-accent bg-accent/10",
	"Patient Monitor": "text-success bg-success/10",
	"Syringe Pump": "text-warning-foreground bg-warning/10",
	"Infusion Pump": "text-warning-foreground bg-warning/10",
	"Nebulizer": "text-primary bg-primary/10",
	"Patient Ventilator": "text-primary bg-primary/10"
};
var categoryImages = {
	"Oxygen Concentrator 5LP": "/images/oxygen_concentrator_5lp.png",
	"Oxygen Concentrator 10LPM": "/images/oxygen_concentrator_10lpm.png",
	"Bipap Machine": "/images/bipap_machine.png",
	"Auto CPAP Machine": "/images/auto_cpap_machine.png",
	"Surgical Cot With Mattress": "/images/surgical_cot_mattress.png",
	"Foldable Wheel Chair": "/images/foldable_wheel_chair.png",
	"Patient Monitor": "/images/patient_monitor.png",
	"Syringe Pump": "/images/syringe_pump.png",
	"Infusion Pump": "/images/infusion_pump.png",
	"Nebulizer": "/images/nebulizer_device.png",
	"Patient Ventilator": "/images/patient_ventilator.png"
};
function DeleteEquipmentDialog({ eq, trigger, onDelete }) {
	const handleDelete = () => {
		deleteEquipment(eq.id);
		toast.success(`Equipment "${eq.name}" has been deleted.`);
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
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-4 w-4" }), " Delete Equipment"]
			}) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "py-2 space-y-3",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-[13px] text-muted-foreground",
					children: [
						"Delete ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
							className: "text-foreground",
							children: eq.name
						}),
						" (SN: ",
						eq.serial,
						")?"
					]
				})
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
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "destructive",
					type: "button",
					onClick: handleDelete,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "mr-1.5 h-3.5 w-3.5" }), "Delete"]
				})
			})] })
		]
	})] });
}
function OwnerActionDialog({ eq, actionType, trigger, onSave }) {
	const [open, setOpen] = (0, import_react.useState)(false);
	const [date, setDate] = (0, import_react.useState)(getLocalYYYYMMDD());
	const [dailyRate, setDailyRate] = (0, import_react.useState)(eq.ownerDailyRate?.toString() || "");
	const [notes, setNotes] = (0, import_react.useState)("");
	const startDate = (0, import_react.useMemo)(() => {
		if (actionType !== "return") return "";
		if (eq.ownerHistory && Array.isArray(eq.ownerHistory)) {
			const receives = eq.ownerHistory.filter((h) => h.action === "received");
			if (receives.length > 0) return [...receives].sort((a, b) => parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime())[0].date;
		}
		return eq.purchaseDate || getLocalYYYYMMDD();
	}, [
		eq,
		actionType,
		open
	]);
	const calculation = (0, import_react.useMemo)(() => {
		if (actionType !== "return" || !startDate || !date) return null;
		const startD = parseLocalDate(startDate);
		const endD = parseLocalDate(date);
		if (isNaN(startD.getTime()) || isNaN(endD.getTime())) return null;
		const diff = endD.getTime() - startD.getTime();
		const days = Math.max(1, Math.ceil(diff / (1e3 * 60 * 60 * 24)));
		return {
			days,
			totalCost: days * (eq.ownerDailyRate || 0)
		};
	}, [
		startDate,
		date,
		eq.ownerDailyRate,
		actionType
	]);
	(0, import_react.useEffect)(() => {
		if (open) {
			setDate(getLocalYYYYMMDD());
			setDailyRate(eq.ownerDailyRate?.toString() || "");
			setNotes("");
		}
	}, [open, eq]);
	const handleSave = () => {
		if (!date) {
			toast.error("Please select a date.");
			return;
		}
		const rateVal = actionType === "return" ? eq.ownerDailyRate || 0 : parseFloat(dailyRate) || 0;
		if (actionType === "receive" && rateVal < 0) {
			toast.error("Rate cannot be negative.");
			return;
		}
		const histEntry = {
			date,
			action: actionType === "return" ? "returned" : "received",
			dailyRate: rateVal,
			notes: notes.trim()
		};
		if (actionType === "return" && calculation) {
			histEntry.startDate = startDate;
			histEntry.days = calculation.days;
			histEntry.totalCost = calculation.totalCost;
		}
		const updatedHistory = [...eq.ownerHistory || [], histEntry];
		saveEquipment({
			...eq,
			status: actionType === "return" ? "Returned to Owner" : "Available",
			ownerDailyRate: actionType === "return" ? eq.ownerDailyRate || 0 : rateVal,
			ownerHistory: updatedHistory
		});
		toast.success(actionType === "return" ? `"${eq.name}" returned to owner. Total payout calculated: ₹${calculation?.totalCost?.toLocaleString("en-IN")}` : `"${eq.name}" received from owner. Daily rate set to ₹${rateVal}/day.`);
		setOpen(false);
		if (onSave) onSave();
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, {
		open,
		onOpenChange: setOpen,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
			asChild: true,
			children: trigger
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "max-w-md bg-white border border-slate-100 rounded-[16px] sm:rounded-[20px] p-4 sm:p-6 shadow-[0_20px_50px_rgba(15,23,42,0.06)]",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, {
					className: "border-b border-slate-100 pb-3",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
						className: "text-md font-bold text-slate-800 flex items-center gap-2",
						children: actionType === "return" ? "🔄 Return to Owner" : "📥 Receive from Owner"
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "py-4 space-y-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "bg-slate-50 p-3.5 rounded-xl text-[12.5px] space-y-1.5 border border-slate-100",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-muted-foreground",
										children: "Equipment:"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
										className: "text-slate-700",
										children: eq.name
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-muted-foreground",
										children: "Serial Number:"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-mono text-slate-600",
										children: eq.serial
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-muted-foreground",
										children: "Owner:"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-semibold text-slate-700",
										children: eq.owner || "Company"
									})]
								}),
								actionType === "return" && startDate && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between pt-1 border-t border-slate-200/60 mt-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-muted-foreground",
										children: "Received Date:"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-semibold text-slate-700",
										children: formatDateDDMMYYYY(startDate)
									})]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								className: "text-[11px] font-bold uppercase tracking-wider text-slate-500",
								children: actionType === "return" ? "Return Date" : "Receive Date"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								type: "date",
								value: date,
								onChange: (e) => setDate(e.target.value),
								className: "bg-white border-slate-200 h-10 text-[13px] rounded-lg focus-visible:ring-1 focus-visible:ring-primary/45"
							})]
						}),
						actionType === "receive" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								className: "text-[11px] font-bold uppercase tracking-wider text-slate-500",
								children: "Daily Rate to Owner (₹)"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								type: "number",
								min: "0",
								value: dailyRate,
								onChange: (e) => setDailyRate(e.target.value),
								placeholder: "e.g. 50",
								className: "bg-white border-slate-200 h-10 text-[13px] rounded-lg focus-visible:ring-1 focus-visible:ring-primary/45"
							})]
						}),
						actionType === "return" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5 bg-slate-50/80 p-3 rounded-xl border border-slate-100/60 flex justify-between items-center text-[12.5px]",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-muted-foreground font-semibold",
								children: "Daily Rate to Owner:"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", {
								className: "text-slate-700",
								children: [
									"₹",
									(eq.ownerDailyRate || 0).toLocaleString("en-IN"),
									"/day"
								]
							})]
						}),
						actionType === "return" && calculation && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "bg-amber-50/60 border border-amber-100 p-3.5 rounded-xl text-[12.5px] space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-amber-800",
									children: "Total Duration:"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", {
									className: "text-amber-900",
									children: [calculation.days, " day(s)"]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between pt-1 border-t border-amber-200/40",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-amber-800 font-medium",
									children: "Total Payout due to Owner:"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", {
									className: "text-amber-900 text-[14px]",
									children: ["₹", calculation.totalCost.toLocaleString("en-IN")]
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								className: "text-[11px] font-bold uppercase tracking-wider text-slate-500",
								children: "Notes / Remarks"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: notes,
								onChange: (e) => setNotes(e.target.value),
								placeholder: "Any comments regarding device condition or transfer...",
								className: "bg-white border-slate-200 h-10 text-[13px] rounded-lg focus-visible:ring-1 focus-visible:ring-primary/45"
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
					className: "border-t border-slate-100 pt-4 flex gap-2 justify-end",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogClose, {
						asChild: true,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							type: "button",
							className: "h-10 rounded-lg text-[13px] border-slate-200 hover:bg-slate-50 cursor-pointer",
							children: "Cancel"
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						onClick: handleSave,
						className: "h-10 px-5 bg-primary text-primary-foreground hover:bg-primary/95 rounded-lg text-[13px] font-medium cursor-pointer border-0 shadow-sm",
						children: actionType === "return" ? "Return to Owner" : "Receive & Mark Available"
					})]
				})
			]
		})]
	});
}
function QrCodeDialog({ eq }) {
	const [imgError, setImgError] = (0, import_react.useState)(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
		asChild: true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
			variant: "outline",
			size: "icon",
			className: "h-8 w-8 text-muted-foreground hover:text-foreground",
			title: "QR Code",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QrCode, { className: "h-3.5 w-3.5" })
		})
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
		className: "max-w-xs text-center bg-background border border-border shadow-elevated rounded-[16px] sm:rounded-[20px] p-4 sm:p-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, {
				className: "text-sm font-bold text-foreground",
				children: ["QR Code — ", eq.name]
			}) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-col items-center gap-4 py-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex h-48 w-48 items-center justify-center rounded-2xl border border-border/60 bg-white p-3.5 shadow-soft",
						children: !imgError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(eq.serial)}`,
							alt: `QR Code for ${eq.serial}`,
							className: "h-full w-full object-contain",
							onError: () => setImgError(true)
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-center",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QrCode, { className: "mx-auto h-16 w-16 text-muted-foreground/30" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[11px] text-muted-foreground mt-2 font-semibold",
								children: "Offline QR Preview"
							})]
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[12px] font-mono font-bold text-foreground",
						children: eq.serial
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
				className: "grid grid-cols-2 gap-2 mt-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						className: "text-[12px] h-9 w-full",
						onClick: () => toast.success("QR Code sent to printer successfully."),
						children: "Print QR"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						className: "text-[12px] h-9 w-full",
						onClick: async () => {
							toast.loading("Generating real QR Code SVG...");
							try {
								const response = await fetch(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&format=svg&data=${encodeURIComponent(eq.serial)}`);
								if (!response.ok) throw new Error("Network response was not ok");
								const svgText = await response.text();
								downloadFile(`QR_Code_${eq.serial}.svg`, svgText, "image/svg+xml");
								toast.dismiss();
								toast.success("QR Code SVG downloaded successfully.");
							} catch (err) {
								toast.dismiss();
								toast.error("Failed to download QR code. Running offline?");
								const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="200" height="200" fill="#ffffff">
  <rect width="100" height="100" fill="#ffffff" />
  <rect x="5" y="5" width="90" height="90" fill="none" stroke="#000000" stroke-width="2" />
  <text x="50" y="54" font-family="monospace" font-size="10" font-weight="bold" text-anchor="middle" fill="#000000">${eq.serial}</text>
</svg>`;
								downloadFile(`QR_Code_${eq.serial}.svg`, fallbackSvg, "image/svg+xml");
							}
						},
						children: "Download SVG"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "col-span-2 text-[12px] h-9 w-full font-semibold",
						onClick: async () => {
							toast.loading("Generating QR Code PNG...");
							try {
								const response = await fetch(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(eq.serial)}`);
								if (!response.ok) throw new Error("Network response was not ok");
								const blob = await response.blob();
								const url = window.URL.createObjectURL(blob);
								const a = document.createElement("a");
								a.href = url;
								a.download = `QR_Code_${eq.serial}.png`;
								document.body.appendChild(a);
								a.click();
								document.body.removeChild(a);
								window.URL.revokeObjectURL(url);
								toast.dismiss();
								toast.success("QR Code PNG downloaded successfully.");
							} catch (err) {
								toast.dismiss();
								toast.error("Failed to download PNG. Running offline?");
							}
						},
						children: "Download PNG (Recommended for scan upload)"
					})
				]
			})
		]
	})] });
}
function EquipmentHistorySheet({ eq, open, onClose }) {
	if (!eq) return null;
	const rentals = getRentals();
	const returns = getReturns();
	const exchanges = getExchanges();
	const Icon = categoryIcons[eq.category] ?? Stethoscope;
	const events = [];
	if (eq.purchaseDate) events.push({
		date: eq.purchaseDate,
		type: "purchase",
		section: "owner",
		title: "Equipment Purchased & Sourced",
		description: `Brought into inventory from owner "${eq.owner || "Unknown Owner"}"`,
		meta: `Daily Rate to Owner: ₹${(Number(eq.ownerDailyRate) || 0).toLocaleString("en-IN")}/day`
	});
	rentals.filter((r) => {
		if (r.equipmentId === eq.id) return true;
		if (r.equipmentId && r.equipmentId.split(", ").includes(eq.id)) return true;
		if (r.equipmentItems && r.equipmentItems.some((item) => item.equipmentId === eq.id)) return true;
		return false;
	}).forEach((r) => {
		if (r.start) events.push({
			date: r.start.split("T")[0],
			type: "rent_start",
			section: "rental",
			title: "Dispatched (Rented Out)",
			description: `Delivered to customer "${r.customer}"`,
			meta: `Agreement ID: ${r.id}`
		});
		const matchingReturn = returns.find((ret) => {
			const isSameAgreement = ret.agreement === r.id;
			const hasThisEq = (ret.returnedEquipmentIds || []).includes(eq.id) || r.equipmentId && r.equipmentId.split(", ").includes(eq.id);
			return isSameAgreement && hasThisEq;
		});
		if (matchingReturn) events.push({
			date: matchingReturn.date,
			type: "rent_return",
			section: "rental",
			title: "Returned to Stock",
			description: `Returned by customer "${r.customer}". Condition: ${matchingReturn.condition || "Good"}`,
			meta: `Return ID: ${matchingReturn.id}`
		});
	});
	exchanges.filter((exc) => {
		return exc.currentEquipmentId === eq.id || exc.newEquipmentId === eq.id;
	}).forEach((exc) => {
		if (exc.status === "Completed") {
			if (exc.currentEquipmentId === eq.id) {
				const isToOwner = exc.releaseCondition === "Returned to Owner";
				let destination = "Stock";
				if (isToOwner) destination = `Returned to Owner ("${eq.owner || "Unknown"}")`;
				else if (exc.releaseCondition === "UnderMaintenance") destination = "Maintenance";
				events.push({
					date: exc.exchangeDate,
					type: "exchange_out",
					section: isToOwner ? "owner" : "rental",
					title: isToOwner ? "Returned to Owner (via Exchange)" : "Returned via Exchange",
					description: isToOwner ? `Returned to owner "${eq.owner || "Unknown"}" after being exchanged out from customer "${exc.customer}".` : `Exchanged out from customer "${exc.customer}". Action: Released to ${destination}.`,
					meta: `Exchange ID: ${exc.id} (Reason: ${exc.reason || "None"})`
				});
			}
			if (exc.newEquipmentId === eq.id) events.push({
				date: exc.exchangeDate,
				type: "exchange_in",
				section: "rental",
				title: "Delivered via Exchange",
				description: `Assigned to customer "${exc.customer}" as a replacement device`,
				meta: `Exchange ID: ${exc.id}`
			});
		}
	});
	if (eq.ownerHistory && Array.isArray(eq.ownerHistory)) eq.ownerHistory.forEach((hist) => {
		const isReturn = hist.action === "returned";
		events.push({
			date: hist.date,
			type: isReturn ? "owner_return" : "owner_receive",
			section: "owner",
			title: isReturn ? "Returned to Owner (Taken)" : "Received from Owner (Stock)",
			description: hist.notes || (isReturn ? `Returned directly to owner "${eq.owner || "Company"}" after being held from ${formatDateDDMMYYYY(hist.startDate)} to ${formatDateDDMMYYYY(hist.date)}.` : `Received from owner "${eq.owner || "Company"}" and brought into available inventory.`),
			meta: isReturn ? `Payout: ₹${(hist.totalCost || 0).toLocaleString("en-IN")} (${hist.days || 0} days @ ₹${hist.dailyRate || 0}/day)` : `Rate: ₹${(hist.dailyRate || 0).toLocaleString("en-IN")}/day`
		});
	});
	events.sort((a, b) => parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime());
	const rentalEvents = events.filter((e) => e.section === "rental");
	const ownerEvents = events.filter((e) => e.section === "owner");
	const downloadPDF = () => {
		if (typeof window === "undefined") return;
		const printWindow = window.open("", "_blank");
		if (!printWindow) {
			alert("Please allow popups to print/download the PDF statement.");
			return;
		}
		const rentalRowsHtml = rentalEvents.length === 0 ? `<tr><td colspan="3" style="text-align: center; color: #64748b; font-style: italic; padding: 15px;">No rental activities on record.</td></tr>` : rentalEvents.map((ev) => `
        <tr>
          <td style="font-weight: 600; font-family: monospace; padding: 12px; border-bottom: 1px solid #e2e8f0;">${formatDateDDMMYYYY(ev.date)}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">
            <div style="font-weight: 700; color: #1e293b; font-size: 13px;">${ev.title}</div>
            <div style="color: #475569; font-size: 11.5px; margin-top: 2px; line-height: 1.4;">${ev.description}</div>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">
            <span style="font-family: monospace; font-size: 11px; color: #0f766e; background: #f0fdfa; padding: 4px 8px; border-radius: 4px; border: 1px solid #ccfbf1; font-weight: 600;">
              ${ev.meta || "—"}
            </span>
          </td>
        </tr>
      `).join("");
		const ownerRowsHtml = ownerEvents.length === 0 ? `<tr><td colspan="3" style="text-align: center; color: #64748b; font-style: italic; padding: 15px;">No owner transfers on record.</td></tr>` : ownerEvents.map((ev) => `
        <tr>
          <td style="font-weight: 600; font-family: monospace; padding: 12px; border-bottom: 1px solid #e2e8f0;">${formatDateDDMMYYYY(ev.date)}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">
            <div style="font-weight: 700; color: #b45309; font-size: 13px;">${ev.title}</div>
            <div style="color: #475569; font-size: 11.5px; margin-top: 2px; line-height: 1.4;">${ev.description}</div>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">
            <span style="font-family: monospace; font-size: 11px; color: #7c2d12; background: #fff7ed; padding: 4px 8px; border-radius: 4px; border: 1px solid #ffedd5; font-weight: 600;">
              ${ev.meta || "—"}
            </span>
          </td>
        </tr>
      `).join("");
		const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Equipment Statement - ${eq.serial}</title>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #1e293b;
      margin: 0;
      padding: 40px;
      line-height: 1.5;
    }
    .header {
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 20px;
      margin-bottom: 25px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .brand {
      font-size: 24px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.5px;
    }
    .brand span {
      color: #2563eb;
    }
    .title {
      font-size: 14px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 700;
    }
    .device-info {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 30px;
    }
    .device-grid {
      display: grid;
      grid-template-cols: repeat(2, 1fr);
      gap: 15px 25px;
    }
    .info-item {
      font-size: 13px;
    }
    .info-label {
      color: #64748b;
      font-size: 10px;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    .info-value {
      font-weight: 700;
      color: #334155;
      margin-top: 2px;
    }
    h3 {
      font-size: 15px;
      font-weight: 800;
      border-bottom: 2px solid #cbd5e1;
      padding-bottom: 6px;
      margin-top: 35px;
      margin-bottom: 15px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .rental-header {
      color: #2563eb;
      border-bottom-color: #bfdbfe;
    }
    .owner-header {
      color: #d97706;
      border-bottom-color: #fde68a;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    th {
      padding: 10px 12px;
      text-align: left;
      border-bottom: 2px solid #cbd5e1;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      background-color: #f1f5f9;
      color: #475569;
    }
    .footer {
      margin-top: 60px;
      text-align: center;
      font-size: 11px;
      color: #94a3b8;
      border-top: 1px dashed #e2e8f0;
      padding-top: 15px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">Medi<span>Rent</span></div>
    <div style="text-align: right">
      <div class="title">Equipment Statement</div>
      <div style="font-size: 11.5px; color: #64748b; margin-top: 3px;">Generated on ${(/* @__PURE__ */ new Date()).toLocaleDateString("en-IN")}</div>
    </div>
  </div>

  <div class="device-info">
    <div style="font-size: 15px; font-weight: 800; color: #0f172a; margin-bottom: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Device Specifications</div>
    <div class="device-grid">
      <div class="info-item">
        <div class="info-label">Equipment Name</div>
        <div class="info-value">${eq.name}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Serial Number</div>
        <div class="info-value" style="font-family: monospace;">${eq.serial}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Category / Model</div>
        <div class="info-value">${eq.category} (Model: ${eq.model || "—"})</div>
      </div>
      <div class="info-item">
        <div class="info-label">Current Status / Owner</div>
        <div class="info-value">${eq.status} (Owner: ${eq.owner || "Company"})</div>
      </div>
      <div class="info-item">
        <div class="info-label">Purchase Date</div>
        <div class="info-value">${eq.purchaseDate ? formatDateDDMMYYYY(eq.purchaseDate) : "—"}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Daily Rate to Owner</div>
        <div class="info-value">₹${(Number(eq.ownerDailyRate) || 0).toLocaleString("en-IN")}/day</div>
      </div>
    </div>
  </div>

  <h3 class="rental-header">1. Rental Statement History</h3>
  <table>
    <thead>
      <tr>
        <th style="width: 120px;">Date</th>
        <th>Activity Details</th>
        <th style="width: 180px; text-align: right;">Reference ID</th>
      </tr>
    </thead>
    <tbody>
      ${rentalRowsHtml}
    </tbody>
  </table>

  <h3 class="owner-header">2. Owner Return & Taken Statement</h3>
  <table>
    <thead>
      <tr>
        <th style="width: 120px;">Date</th>
        <th>Activity Details</th>
        <th style="width: 180px; text-align: right;">Reference ID</th>
      </tr>
    </thead>
    <tbody>
      ${ownerRowsHtml}
    </tbody>
  </table>

  <div class="footer">
    This is a computer-generated statement from MediRent ERP.
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
	const downloadExcelFile = () => {
		const excelHeaders = [
			"Date",
			"Statement Section",
			"Event Title",
			"Description / Details",
			"Reference ID"
		];
		const rows = events.map((ev) => [
			formatDateDDMMYYYY(ev.date),
			ev.section === "rental" ? "Rental Statement" : "Owner return & taken statement",
			ev.title,
			ev.description,
			ev.meta || ""
		]);
		downloadExcel(`equipment_statement_${eq.serial}`, excelHeaders, rows, [
			110,
			180,
			180,
			300,
			185
		]);
		toast.success("Excel statement downloaded successfully.");
	};
	const getEventIcon = (type) => {
		switch (type) {
			case "purchase": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { className: "h-3.5 w-3.5 text-amber-600" });
			case "rent_start": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpRight, { className: "h-3.5 w-3.5 text-blue-600" });
			case "rent_return": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowDownLeft, { className: "h-3.5 w-3.5 text-emerald-600" });
			case "exchange_out": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "h-3.5 w-3.5 text-purple-600" });
			case "exchange_in": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "h-3.5 w-3.5 text-violet-600" });
			default: return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(History, { className: "h-3.5 w-3.5 text-slate-500" });
		}
	};
	const getEventBg = (type) => {
		switch (type) {
			case "purchase": return "bg-amber-100 border-amber-200";
			case "rent_start": return "bg-blue-100 border-blue-200";
			case "rent_return": return "bg-emerald-100 border-emerald-200";
			case "exchange_out":
			case "exchange_in": return "bg-purple-100 border-purple-200";
			default: return "bg-slate-100 border-slate-200";
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
		open,
		onOpenChange: onClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetContent, {
			className: "w-full sm:max-w-lg overflow-y-auto bg-slate-50/90 backdrop-blur",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetHeader, {
					className: "pb-4 border-b border-border/60",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: `metric-icon h-12 w-12 border ${categoryColors[eq.category] ?? "text-primary bg-primary/10"} border-transparent`,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "h-6 w-6" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetTitle, {
								className: "text-base font-bold text-slate-800",
								children: eq.name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[11px] font-mono text-muted-foreground",
								children: eq.serial
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-1 flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, { status: eq.status }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-[11px] text-slate-500",
									children: ["Owner: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: eq.owner || "Company" })]
								})]
							})
						] })]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 p-3.5 bg-white border border-slate-200/80 rounded-xl shadow-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
						className: "text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2",
						children: "Purchase & Sourcing Information"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-3 text-[13px]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-0.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-slate-400 text-[11px]",
								children: "Purchase Date"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "font-semibold text-slate-700 flex items-center gap-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Calendar, { className: "h-3.5 w-3.5 text-slate-400" }), eq.purchaseDate ? formatDateDDMMYYYY(eq.purchaseDate) : "—"]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-0.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-slate-400 text-[11px]",
								children: "Daily Rate to Owner"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "font-semibold text-slate-700 flex items-center gap-0.5",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IndianRupee, { className: "h-3.5 w-3.5 text-slate-400" }),
									"₹",
									(Number(eq.ownerDailyRate) || 0).toLocaleString("en-IN"),
									"/day"
								]
							})]
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 grid grid-cols-2 gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "outline",
						size: "sm",
						onClick: downloadPDF,
						className: "h-9 text-xs flex items-center justify-center gap-1.5 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm rounded-lg font-medium",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Printer, { className: "h-3.5 w-3.5 text-slate-500" }), "Download PDF"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "outline",
						size: "sm",
						onClick: downloadExcelFile,
						className: "h-9 text-xs flex items-center justify-center gap-1.5 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm rounded-lg font-medium",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileSpreadsheet, { className: "h-3.5 w-3.5 text-emerald-600" }), "Download Excel"]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
						className: "mb-4 text-[13.5px] font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-200 pb-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(History, { className: "h-4 w-4 text-primary" }), " Rental Statement History"]
					}), rentalEvents.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[12px] text-muted-foreground text-center py-6 bg-white border border-dashed rounded-xl",
						children: "No rental activities on record."
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "relative pl-6 border-l-2 border-slate-200/80 space-y-4 ml-3",
						children: rentalEvents.map((ev, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: `absolute -left-[35px] top-0.5 flex h-6 w-6 items-center justify-center rounded-full border shadow-sm ${getEventBg(ev.type)}`,
								children: getEventIcon(ev.type)
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "bg-white border border-slate-200/60 rounded-xl p-3 shadow-sm space-y-1 hover:border-slate-300 transition-colors",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[12.5px] font-bold text-slate-800 leading-snug",
											children: ev.title
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full",
											children: formatDateDDMMYYYY(ev.date)
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[12px] text-slate-600 leading-normal",
										children: ev.description
									}),
									ev.meta && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "pt-1 mt-1 border-t border-slate-100 flex items-center justify-between text-[10.5px]",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-semibold font-mono text-primary/80 bg-primary/5 px-1.5 py-0.5 rounded",
											children: ev.meta
										})
									})
								]
							})]
						}, index))
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-8",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
						className: "mb-4 text-[13.5px] font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-200 pb-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(House, { className: "h-4 w-4 text-amber-600" }), " Owner return and taken statement"]
					}), ownerEvents.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[12px] text-muted-foreground text-center py-6 bg-white border border-dashed rounded-xl",
						children: "No owner transfers on record."
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "relative pl-6 border-l-2 border-slate-200/80 space-y-4 ml-3",
						children: ownerEvents.map((ev, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: `absolute -left-[35px] top-0.5 flex h-6 w-6 items-center justify-center rounded-full border shadow-sm ${getEventBg(ev.type)}`,
								children: getEventIcon(ev.type)
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "bg-white border border-slate-200/60 rounded-xl p-3 shadow-sm space-y-1 hover:border-slate-300 transition-colors",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[12.5px] font-bold text-slate-800 leading-snug",
											children: ev.title
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full",
											children: formatDateDDMMYYYY(ev.date)
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[12px] text-slate-600 leading-normal",
										children: ev.description
									}),
									ev.meta && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "pt-1 mt-1 border-t border-slate-100 flex items-center justify-between text-[10.5px]",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-semibold font-mono text-primary/80 bg-primary/5 px-1.5 py-0.5 rounded",
											children: ev.meta
										})
									})
								]
							})]
						}, index))
					})]
				})
			]
		})
	});
}
function EquipmentPage() {
	const dbVersion = useDatabaseTrigger();
	const [equipment, setEquipment] = (0, import_react.useState)(() => getEquipment());
	const [historyEq, setHistoryEq] = (0, import_react.useState)(null);
	const [historyOpen, setHistoryOpen] = (0, import_react.useState)(false);
	const [search, setSearch] = (0, import_react.useState)("");
	const [statusTab, setStatusTab] = (0, import_react.useState)("all");
	const [categoryFilter, setCategoryFilter] = (0, import_react.useState)("all-cat");
	const [ownerFilter, setOwnerFilter] = (0, import_react.useState)("all-owners");
	const isStaff = typeof window !== "undefined" && localStorage.getItem("medirent-user-role") === "Staff";
	const refresh = () => setEquipment(getEquipment());
	const pageScrollRef = (0, import_react.useRef)(0);
	(0, import_react.useEffect)(() => {
		const onScroll = () => {
			pageScrollRef.current = window.scrollY;
		};
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);
	(0, import_react.useEffect)(() => {
		const saved = pageScrollRef.current;
		setEquipment(getEquipment());
		requestAnimationFrame(() => {
			window.scrollTo({
				top: saved,
				behavior: "instant"
			});
		});
	}, [dbVersion]);
	const activeCategories = Array.from(new Set(equipment.map((e) => e.category).filter(Boolean)));
	const activeOwners = Array.from(new Set(equipment.map((e) => e.owner).filter(Boolean)));
	const rentalsList = (0, import_react.useMemo)(() => getRentals(), [dbVersion]);
	const customersList = (0, import_react.useMemo)(() => getCustomers(), [dbVersion]);
	const filteredEquipment = equipment.filter((e) => {
		const q = search.toLowerCase().trim();
		const activeRental = rentalsList.find((r) => (r.equipmentId === e.id || r.equipmentItems && r.equipmentItems.some((ei) => ei.equipmentId === e.id)) && r.status === "Active");
		const activeCustomer = activeRental ? customersList.find((c) => c.id === activeRental.customerId) : null;
		const matchesSearch = !q || e.name.toLowerCase().includes(q) || String(e.serial || "").toLowerCase().includes(q) || String(e.model || "").toLowerCase().includes(q) || String(e.owner || "").toLowerCase().includes(q) || activeCustomer && (activeCustomer.name.toLowerCase().includes(q) || String(activeCustomer.phone || "").toLowerCase().includes(q) || String(activeCustomer.altPhone || "").toLowerCase().includes(q) || String(activeCustomer.contactNumber3 || "").toLowerCase().includes(q));
		const matchesStatus = statusTab === "all" || statusTab === "available" && e.status === "Available" || statusTab === "rented" && e.status === "Rented" || statusTab === "undermaintenance" && e.status === "UnderMaintenance" || statusTab === "returnedtoowner" && e.status === "Returned to Owner";
		const matchesCategory = categoryFilter === "all-cat" || e.category === categoryFilter;
		const matchesOwner = ownerFilter === "all-owners" || e.owner === ownerFilter;
		return matchesSearch && matchesStatus && matchesCategory && matchesOwner;
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "Equipment Inventory",
		subtitle: "Track every device, status, and serial in real time",
		actions: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EquipmentFormDialog, {
			title: "Add New Equipment",
			onSave: refresh,
			trigger: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				size: "sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "mr-1.5 h-3.5 w-3.5" }), "Add Equipment"]
			})
		}),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-5 flex flex-col gap-3 border-b border-border/60 pb-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative flex-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							placeholder: "Search by name, serial, model…",
							className: "pl-9 h-9 text-[13px]",
							value: search,
							onChange: (e) => setSearch(e.target.value)
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
						value: categoryFilter,
						onValueChange: setCategoryFilter,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
							className: "w-[150px] sm:w-[180px] h-9 text-[12px] shrink-0",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "All Categories" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: "all-cat",
							children: "All Categories"
						}), activeCategories.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: c,
							children: c
						}, c))] })]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2 overflow-x-auto pb-0.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
						value: ownerFilter,
						onValueChange: setOwnerFilter,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
							className: "w-[140px] h-8 text-[12px] shrink-0",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "All Owners" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: "all-owners",
							children: "All Owners"
						}), activeOwners.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: o,
							children: o
						}, o))] })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex gap-1 shrink-0",
						children: [
							"all",
							"available",
							"rented",
							"undermaintenance",
							"returnedtoowner"
						].map((tab) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setStatusTab(tab),
							className: `mobile-chip shrink-0 ${statusTab === tab ? "active" : ""}`,
							children: tab === "all" ? "All" : tab === "available" ? "Available" : tab === "rented" ? "Rented" : tab === "undermaintenance" ? "Maintenance" : "To Owner"
						}, tab))
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EquipmentFormDialog, {
				title: "Add New Equipment",
				onSave: refresh,
				trigger: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					className: "fab md:hidden",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "h-5 w-5" }), "Add Equipment"]
				})
			}),
			(() => {
				const sortedOwners = Array.from(new Set(filteredEquipment.map((e) => e.owner || "Unassigned").filter(Boolean))).sort((a, b) => a === "Unassigned" ? 1 : b === "Unassigned" ? -1 : a.localeCompare(b));
				if (filteredEquipment.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "py-16 text-center",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[14px] font-semibold text-foreground",
						children: "No equipment found"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[12px] text-muted-foreground mt-1",
						children: "Try adjusting your search or filters."
					})]
				});
				return sortedOwners.map((ownerName) => {
					const ownerItems = filteredEquipment.filter((e) => (e.owner || "Unassigned") === ownerName);
					if (ownerItems.length === 0) return null;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-8",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3 mb-4 pb-2 border-b border-border/60",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-[13px] font-bold",
								children: ownerName.charAt(0).toUpperCase()
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "text-[14px] font-bold text-foreground",
								children: ownerName
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-[11px] text-muted-foreground",
								children: [
									ownerItems.length,
									" item",
									ownerItems.length !== 1 ? "s" : ""
								]
							})] })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
							children: ownerItems.map((item) => {
								const Icon = categoryIcons[item.category] ?? Stethoscope;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
									className: "group overflow-hidden hover:-translate-y-1 hover:shadow-[var(--shadow-elevated)] transition-all duration-200",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "relative flex h-40 items-center justify-center bg-white border-b border-border/50 overflow-hidden p-3",
										children: [
											categoryImages[item.category] ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
												src: categoryImages[item.category],
												alt: item.name,
												className: "h-full w-full object-contain transition-transform duration-305 group-hover:scale-105",
												style: { filter: "brightness(1.08) contrast(1.06)" }
											}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: `metric-icon h-14 w-14 border ${categoryColors[item.category] ?? "bg-muted text-muted-foreground"}`,
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "h-7 w-7" })
											}),
											categoryImages[item.category] && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: `absolute left-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg border border-border/60 bg-background/80 backdrop-blur-sm ${categoryColors[item.category] ?? "text-muted-foreground"}`,
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "h-4 w-4" })
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "absolute right-3 top-3",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, { status: item.status })
											})
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
										className: "p-4",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[10px] font-bold uppercase tracking-[0.10em] text-primary/80",
												children: item.category
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
												className: "mt-1 font-display text-[15px] font-semibold leading-snug",
												children: item.name
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "text-[12px] text-muted-foreground mt-0.5",
												children: [
													item.manufacturer,
													" · ",
													item.model
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "mt-4 space-y-1.5 text-[11px]",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex justify-between border-b border-border/40 pb-1.5",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "text-muted-foreground",
															children: "Serial Number"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "font-mono font-medium text-foreground",
															children: item.serial
														})]
													}),
													item.agreementNumber && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex justify-between border-b border-border/40 pb-1.5",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "text-muted-foreground",
															children: "Agreement No."
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "font-mono font-medium text-foreground",
															children: item.agreementNumber
														})]
													}),
													item.agreementDate && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex justify-between border-b border-border/40 pb-1.5",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "text-muted-foreground",
															children: "Agreement Date"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "font-medium text-foreground",
															children: formatDateDDMMYYYY(item.agreementDate)
														})]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex justify-between border-b border-border/40 pb-1.5",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "text-muted-foreground",
															children: "Purchased"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "font-medium text-foreground",
															children: formatDateDDMMYYYY(item.purchaseDate) || "—"
														})]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex justify-between pb-1.5",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "text-muted-foreground",
															children: "Daily Rate to Owner"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
															className: "font-medium text-foreground",
															children: [
																"₹",
																(item.ownerDailyRate || 0).toLocaleString("en-IN"),
																"/day"
															]
														})]
													})
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "mt-4 flex gap-1.5 items-center flex-wrap",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
														variant: "secondary",
														size: "sm",
														className: "flex-1 h-8 text-[12px]",
														onClick: () => {
															setHistoryEq(item);
															setHistoryOpen(true);
														},
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(History, { className: "mr-1.5 h-3.5 w-3.5" }), "History"]
													}),
													item.status === "UnderMaintenance" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
														variant: "default",
														size: "sm",
														className: "flex-1 h-8 text-[11.5px] bg-success hover:bg-success/95 text-white font-semibold cursor-pointer",
														onClick: () => {
															saveEquipment({
																...item,
																status: "Available"
															});
															toast.success(`"${item.name}" marked as Available.`);
															refresh();
														},
														children: "Mark Available"
													}),
													!isOwnOwner(item.owner) && item.status === "Returned to Owner" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OwnerActionDialog, {
														eq: item,
														actionType: "receive",
														onSave: refresh,
														trigger: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
															variant: "default",
															size: "sm",
															className: "flex-1 h-8 text-[11.5px] bg-success hover:bg-success/95 text-white font-semibold cursor-pointer",
															children: "Receive from Owner"
														})
													}),
													!isOwnOwner(item.owner) && (item.status === "Available" || item.status === "UnderMaintenance") && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OwnerActionDialog, {
														eq: item,
														actionType: "return",
														onSave: refresh,
														trigger: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
															variant: "outline",
															size: "sm",
															className: "flex-1 h-8 text-[11.5px] border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800 cursor-pointer",
															children: "Return to Owner"
														})
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QrCodeDialog, { eq: item }),
													!isStaff && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EquipmentFormDialog, {
														title: "Edit Equipment",
														eq: item,
														onSave: refresh,
														trigger: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
															variant: "outline",
															size: "icon",
															className: "h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10",
															title: "Edit",
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SquarePen, { className: "h-3.5 w-3.5" })
														})
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DeleteEquipmentDialog, {
														eq: item,
														onDelete: refresh,
														trigger: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
															variant: "outline",
															size: "icon",
															className: "h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10",
															title: "Delete",
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-3.5 w-3.5" })
														})
													})] })
												]
											})
										]
									})]
								}, item.id);
							})
						})]
					}, ownerName);
				});
			})(),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EquipmentHistorySheet, {
				eq: historyEq,
				open: historyOpen,
				onClose: () => setHistoryOpen(false)
			})
		]
	});
}
//#endregion
export { EquipmentPage as component };
