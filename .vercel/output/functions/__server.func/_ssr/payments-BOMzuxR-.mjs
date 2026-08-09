import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { D as getLocalYYYYMMDD, H as parseLocalDate, R as getPayments, b as getCustomers, h as extractIdNumber, it as sortLatestFirst, p as downloadExcel, q as printReceipt, st as useDatabaseTrigger, u as deletePayment, z as getRentals } from "./data-store-BQmZefNN.mjs";
import { c as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { A as Printer, Dt as ChevronRight, Ft as Building2, O as Receipt, Rt as Banknote, Y as History, a as Wallet, h as Trash2, mt as Download, q as IndianRupee, w as Search } from "../_libs/lucide-react.mjs";
import { a as DialogFooter, c as DialogTrigger, i as DialogContent, l as Input, n as Dialog, o as DialogHeader, r as DialogClose, s as DialogTitle, t as Button } from "./dialog-BHa0LWsH.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-C2rs2HGz.mjs";
import { a as CardContent, h as StatusBadge, i as Card, o as CardHeader, s as CardTitle, t as AppShell } from "./AppShell-BtlnpavN.mjs";
import { a as TableHeader, i as TableHead, n as TableBody, o as TableRow, r as TableCell, t as Table } from "./table-DDeHIPcn.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/payments-BOMzuxR-.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var modeColors = {
	Bank: "bg-primary/8 text-primary border-primary/18",
	UPI: "bg-primary/8 text-primary border-primary/18",
	Cash: "bg-success/8 text-success border-success/18",
	"Cash+Bank": "bg-success/8 text-success border-success/18",
	NEFT: "bg-accent/8 text-accent border-accent/18",
	IMPS: "bg-accent/8 text-accent border-accent/18",
	Cheque: "bg-warning/10 text-warning-foreground border-warning/22",
	"Bank Transfer": "bg-primary/8 text-primary border-primary/18",
	"Credit Card": "bg-destructive/8 text-destructive border-destructive/18",
	"Debit Card": "bg-muted text-muted-foreground border-border/60"
};
var typeColors = {
	Rent: "bg-primary/8 text-primary border-primary/18",
	Deposit: "bg-accent/8 text-accent border-accent/18",
	Refund: "bg-success/8 text-success border-success/18",
	"Additional Charges": "bg-warning/10 text-warning-foreground border-warning/22"
};
function DeletePaymentDialog({ payment, trigger, onDelete }) {
	const handleDelete = () => {
		deletePayment(payment.id);
		toast.success(`Payment transaction ${payment.id} successfully deleted.`);
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
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-4 w-4" }), " Delete Payment"]
			}) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "py-2 space-y-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-[13px] text-muted-foreground",
					children: [
						"Delete payment ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
							className: "text-foreground font-mono",
							children: payment.id
						}),
						" of ₹",
						payment.amount.toLocaleString("en-IN"),
						"?"
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "rounded-lg border border-destructive/18 bg-destructive/5 p-3 text-[12px] text-destructive",
					children: "Deleting a payment will affect the customer's outstanding balance."
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
function PrintReceiptDialog({ payment }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
		asChild: true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
			variant: "ghost",
			size: "icon",
			className: "h-7 w-7 text-muted-foreground hover:text-foreground",
			title: "Print Receipt",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Printer, { className: "h-3.5 w-3.5" })
		})
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
		className: "max-w-sm",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Payment Receipt" }) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "py-2 rounded-xl border border-border/60 bg-muted/20 p-5 space-y-3 text-sm",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "text-center border-b border-border/50 pb-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-display text-[16px] font-bold",
								children: "MediRent Healthcare"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[12px] text-muted-foreground",
								children: "Payment Receipt"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-mono text-[11px] font-bold text-primary mt-1",
								children: payment.id
							})
						]
					}),
					[
						{
							l: "Date",
							v: payment.date
						},
						{
							l: "Customer",
							v: payment.customer
						},
						{
							l: "Agreement",
							v: payment.agreement
						},
						{
							l: "Type",
							v: payment.type
						},
						{
							l: "Mode",
							v: payment.mode
						},
						{
							l: "Tx Ref",
							v: payment.txRef || "—"
						},
						{
							l: "Collected By",
							v: payment.collectedBy || "Dr. Rao"
						}
					].map(({ l, v }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex justify-between text-[12px]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-muted-foreground",
							children: l
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-semibold",
							children: v
						})]
					}, l)),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "border-t border-border/50 pt-3 flex justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-bold text-[13px]",
							children: "Amount Paid"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "font-display text-[18px] font-bold text-success",
							children: ["₹", payment.amount.toLocaleString("en-IN")]
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogClose, {
				asChild: true,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "outline",
					className: "flex-1",
					onClick: () => {
						printReceipt(payment);
						toast.success(`Receipt PDF for ${payment.id} generated successfully.`);
					},
					children: "Download PDF"
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogClose, {
				asChild: true,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					className: "flex-1",
					onClick: () => {
						printReceipt(payment);
						toast.success(`Receipt sent to printer.`);
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Printer, { className: "mr-1.5 h-3.5 w-3.5" }), "Print"]
				})
			})] })
		]
	})] });
}
function AgreementPaymentHistoryModal({ agreementId, open, onOpenChange, onRefresh }) {
	if (!agreementId) return null;
	const rentals = getRentals();
	const payments = getPayments();
	const rental = rentals.find((r) => r.id === agreementId);
	const agreementPayments = sortLatestFirst(payments.filter((p) => p.agreement === agreementId), "date");
	const totalPaid = agreementPayments.filter((p) => p.status === "Paid").reduce((sum, p) => sum + p.amount, 0);
	const customerName = rental?.customer || agreementPayments[0]?.customer || "Unknown Customer";
	const equipmentName = rental?.equipment || "—";
	const status = rental?.status || "Active";
	const monthlyRent = rental?.monthlyRent || 0;
	const deposit = rental?.deposit || 0;
	const handleExportStatement = () => {
		const headers = [
			"Receipt ID",
			"Date",
			"Payment Type",
			"Payment Mode",
			"Collected By",
			"Amount (₹)",
			"Status"
		];
		const rows = agreementPayments.map((p) => [
			p.id,
			p.date,
			p.type,
			p.mode,
			p.collectedBy || "Dr. Rao",
			p.amount.toString(),
			p.status
		]);
		downloadExcel(`payment_history_${agreementId}.xls`, headers, rows, [
			110,
			110,
			120,
			110,
			120,
			110,
			100
		]);
		toast.success(`Payment statement for ${agreementId} exported successfully.`);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, {
					className: "p-5 border-b border-border/60 bg-muted/20",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col sm:flex-row sm:items-center justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
									className: "text-[18px] font-bold",
									children: "Payment History"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-mono text-[13px] font-bold bg-primary/10 text-primary px-2.5 py-0.5 rounded-md border border-primary/20",
									children: agreementId
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, { status })
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-[12px] text-muted-foreground mt-1 flex items-center gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Customer: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
									className: "text-foreground font-semibold",
									children: customerName
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "•" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Equipment: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
									className: "text-foreground font-semibold",
									children: equipmentName
								})] })
							]
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex items-center gap-2",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								size: "sm",
								variant: "outline",
								className: "h-8 text-[12px]",
								onClick: handleExportStatement,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "mr-1.5 h-3.5 w-3.5" }), " Export Statement"]
							})
						})]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "p-5 bg-muted/10 border-b border-border/50 grid grid-cols-2 sm:grid-cols-4 gap-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "bg-card p-3 rounded-lg border border-border/50",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[10px] font-bold uppercase tracking-wider text-muted-foreground",
								children: "Total Collected"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-[18px] font-bold text-success mt-0.5",
								children: ["₹", totalPaid.toLocaleString("en-IN")]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "bg-card p-3 rounded-lg border border-border/50",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[10px] font-bold uppercase tracking-wider text-muted-foreground",
								children: "Total Receipts"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[18px] font-bold text-primary mt-0.5",
								children: agreementPayments.length
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "bg-card p-3 rounded-lg border border-border/50",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[10px] font-bold uppercase tracking-wider text-muted-foreground",
								children: "Monthly Rent"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-[16px] font-semibold text-foreground mt-0.5",
								children: ["₹", monthlyRent.toLocaleString("en-IN")]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "bg-card p-3 rounded-lg border border-border/50",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[10px] font-bold uppercase tracking-wider text-muted-foreground",
								children: "Security Deposit"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-[16px] font-semibold text-foreground mt-0.5",
								children: ["₹", deposit.toLocaleString("en-IN")]
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "p-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h4", {
						className: "text-[13px] font-bold mb-3 flex items-center gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Receipt, { className: "h-4 w-4 text-primary" }),
							"Payment Transactions (",
							agreementPayments.length,
							")"
						]
					}), agreementPayments.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "py-12 text-center text-muted-foreground text-[13px] border border-dashed border-border rounded-xl",
						children: [
							"No payments recorded for agreement ",
							agreementId,
							" yet."
						]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "rounded-xl border border-border/60 overflow-hidden",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, {
							className: "bg-muted/40",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Receipt ID" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Date" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Type" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Mode" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Collected By" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
									className: "text-right",
									children: "Amount"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Status" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
									className: "text-right",
									children: "Actions"
								})
							] })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableBody, { children: agreementPayments.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
								className: "font-mono text-[12px] font-bold text-primary",
								children: p.id
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
								className: "text-[12px]",
								children: p.date
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: `inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${typeColors[p.type] ?? "bg-muted text-muted-foreground border-border/50"}`,
								children: p.type
							}) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: `inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${modeColors[p.mode] ?? "bg-muted text-muted-foreground border-border/50"}`,
								children: p.mode
							}) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
								className: "text-[12px] font-medium",
								children: p.collectedBy || "Dr. Rao"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, {
								className: "text-right font-bold text-[13px]",
								children: ["₹", p.amount.toLocaleString("en-IN")]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, { status: p.status }) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
								className: "text-right",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-end gap-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PrintReceiptDialog, { payment: p }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DeletePaymentDialog, {
										payment: p,
										onDelete: onRefresh,
										trigger: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											variant: "ghost",
											size: "icon",
											className: "h-7 w-7 text-muted-foreground hover:text-destructive",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-3.5 w-3.5" })
										})
									})]
								})
							})
						] }, p.id)) })] })
					})]
				})
			]
		})
	});
}
function PaymentsPage() {
	const dbVersion = useDatabaseTrigger();
	const [payments, setPayments] = (0, import_react.useState)(() => getPayments());
	const [search, setSearch] = (0, import_react.useState)("");
	const [dateFilter, setDateFilter] = (0, import_react.useState)("all");
	const [startDate, setStartDate] = (0, import_react.useState)("");
	const [endDate, setEndDate] = (0, import_react.useState)("");
	const [viewMode, setViewMode] = (0, import_react.useState)("by-agreement");
	const [selectedHistoryAgreementId, setSelectedHistoryAgreementId] = (0, import_react.useState)(null);
	typeof window !== "undefined" && localStorage.getItem("medirent-user-role");
	const refresh = () => setPayments(getPayments());
	(0, import_react.useEffect)(() => {
		setPayments(getPayments());
	}, [dbVersion]);
	const rentalsList = getRentals();
	const agreementMap = /* @__PURE__ */ new Map();
	rentalsList.forEach((r) => {
		agreementMap.set(r.id, {
			agreementId: r.id,
			customerName: r.customer,
			customerId: r.customerId,
			equipment: r.equipment,
			rentStatus: r.status,
			monthlyRent: r.monthlyRent || 0,
			deposit: r.deposit || 0,
			startDate: r.start || "",
			payments: []
		});
	});
	payments.forEach((p) => {
		const agrId = p.agreement || "No Agreement";
		let group = agreementMap.get(agrId);
		if (!group) {
			group = {
				agreementId: agrId,
				customerName: p.customer || "Unknown Customer",
				customerId: p.customerId || "",
				equipment: "—",
				rentStatus: "Active",
				monthlyRent: 0,
				deposit: 0,
				startDate: p.date,
				payments: []
			};
			agreementMap.set(agrId, group);
		}
		group.payments.push(p);
	});
	const agreementList = Array.from(agreementMap.values()).map((g) => {
		const paidPayments = g.payments.filter((p) => p.status === "Paid");
		const totalCollected = paidPayments.reduce((sum, p) => sum + p.amount, 0);
		const sortedPayments = [...g.payments].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
		const latestPayment = sortedPayments[0];
		return {
			...g,
			payments: sortedPayments,
			totalCollected,
			paidCount: paidPayments.length,
			totalCount: g.payments.length,
			latestDate: latestPayment?.date || g.startDate || "",
			latestMode: latestPayment?.mode || "—"
		};
	});
	const rentals = (0, import_react.useMemo)(() => getRentals(), [dbVersion]);
	const customers = (0, import_react.useMemo)(() => getCustomers(), [dbVersion]);
	const filteredAgreements = agreementList.filter((g) => {
		const q = search.toLowerCase().trim();
		const rental = rentals.find((r) => r.id === g.agreementId);
		const customer = customers.find((c) => c.id === g.customerId || rental && c.id === rental.customerId);
		if (!(!q || g.agreementId.toLowerCase().includes(q) || g.customerName.toLowerCase().includes(q) || g.equipment.toLowerCase().includes(q) || g.latestMode.toLowerCase().includes(q) || rental && String(rental.serial || "").toLowerCase().includes(q) || customer && (String(customer.phone || "").toLowerCase().includes(q) || String(customer.altPhone || "").toLowerCase().includes(q) || String(customer.contactNumber3 || "").toLowerCase().includes(q)))) return false;
		if (dateFilter === "all") return true;
		return g.payments.some((p) => {
			const pDate = parseLocalDate(p.date);
			if (isNaN(pDate.getTime())) return false;
			const now = /* @__PURE__ */ new Date();
			const currentMonth = now.getMonth();
			const currentYear = now.getFullYear();
			if (dateFilter === "this-month") return pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear;
			else if (dateFilter === "last-month") {
				let targetMonth = currentMonth - 1;
				let targetYear = currentYear;
				if (targetMonth < 0) {
					targetMonth = 11;
					targetYear -= 1;
				}
				return pDate.getMonth() === targetMonth && pDate.getFullYear() === targetYear;
			} else if (dateFilter === "custom") {
				if (startDate) {
					if (pDate < parseLocalDate(startDate)) return false;
				}
				if (endDate) {
					if (pDate > parseLocalDate(endDate)) return false;
				}
				return true;
			}
			return true;
		}) || g.payments.length === 0;
	}).sort((a, b) => {
		const numA = extractIdNumber(a.agreementId);
		const numB = extractIdNumber(b.agreementId);
		if (numA !== numB) return numB - numA;
		return (b.latestDate || "").localeCompare(a.latestDate || "");
	});
	const filteredPayments = sortLatestFirst(payments.filter((p) => {
		const q = search.toLowerCase().trim();
		const rental = rentals.find((r) => r.id === p.agreement);
		const customer = customers.find((c) => c.id === p.customerId || rental && c.id === rental.customerId);
		if (!(!q || p.id.toLowerCase().includes(q) || p.customer.toLowerCase().includes(q) || p.agreement.toLowerCase().includes(q) || p.mode.toLowerCase().includes(q) || p.owner && p.owner.toLowerCase().includes(q) || rental && String(rental.serial || "").toLowerCase().includes(q) || customer && (String(customer.phone || "").toLowerCase().includes(q) || String(customer.altPhone || "").toLowerCase().includes(q) || String(customer.contactNumber3 || "").toLowerCase().includes(q)))) return false;
		if (dateFilter === "all") return true;
		const pDate = parseLocalDate(p.date);
		if (isNaN(pDate.getTime())) return false;
		const now = /* @__PURE__ */ new Date();
		const currentMonth = now.getMonth();
		const currentYear = now.getFullYear();
		if (dateFilter === "this-month") return pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear;
		else if (dateFilter === "last-month") {
			let targetMonth = currentMonth - 1;
			let targetYear = currentYear;
			if (targetMonth < 0) {
				targetMonth = 11;
				targetYear -= 1;
			}
			return pDate.getMonth() === targetMonth && pDate.getFullYear() === targetYear;
		} else if (dateFilter === "custom") {
			if (startDate) {
				if (pDate < parseLocalDate(startDate)) return false;
			}
			if (endDate) {
				if (pDate > parseLocalDate(endDate)) return false;
			}
			return true;
		}
		return true;
	}), "date");
	const todayStr = getLocalYYYYMMDD();
	const todayCollection = (dateFilter === "all" ? payments : filteredPayments).filter((p) => p.status === "Paid" && p.date === todayStr).reduce((sum, p) => sum + p.amount, 0);
	const currentMonth = (/* @__PURE__ */ new Date()).getMonth();
	const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
	const thisMonthCollection = (dateFilter === "all" ? payments : filteredPayments).filter((p) => {
		if (p.status !== "Paid") return false;
		const pDate = parseLocalDate(p.date);
		return !isNaN(pDate.getTime()) && pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear;
	}).reduce((sum, p) => sum + p.amount, 0);
	const cashCollection = (dateFilter === "all" ? payments : filteredPayments).filter((p) => p.status === "Paid" && p.mode === "Cash").reduce((sum, p) => sum + p.amount, 0);
	const bankCollection = (dateFilter === "all" ? payments : filteredPayments).filter((p) => p.status === "Paid" && p.mode !== "Cash").reduce((sum, p) => sum + p.amount, 0);
	const formatValue = (val) => `₹${val.toLocaleString("en-IN")}`;
	[
		"Mon",
		"Tue",
		"Wed",
		"Thu",
		"Fri",
		"Sat",
		"Sun"
	].map((day, idx) => {
		const dayPayments = payments.filter((p) => {
			const pDate = parseLocalDate(p.date);
			if (isNaN(pDate.getTime())) return false;
			const dayNum = pDate.getDay();
			return (dayNum === 0 ? 6 : dayNum - 1) === idx;
		});
		return {
			day,
			collected: dayPayments.filter((p) => p.status === "Paid").reduce((sum, p) => sum + p.amount, 0),
			pending: dayPayments.filter((p) => p.status === "Pending" || p.status === "Partial").reduce((sum, p) => sum + p.amount, 0)
		};
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "Payments",
		subtitle: "Collect rent, deposits, additional charges and track collections",
		actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
			variant: "outline",
			size: "sm",
			onClick: () => {
				downloadExcel("payments_export.xls", [
					"Payment ID",
					"Date",
					"Customer",
					"Agreement",
					"Amount",
					"Mode",
					"Type",
					"Reference",
					"Status",
					"Collected By"
				], payments.map((p) => [
					p.id,
					p.date,
					p.customer,
					p.agreement,
					p.amount.toString(),
					p.mode,
					p.type,
					p.txRef || "",
					p.status,
					p.collectedBy || "Dr. Rao"
				]), [
					110,
					110,
					200,
					110,
					110,
					100,
					100,
					150,
					100,
					120
				]);
				toast.success("Payments log exported successfully.");
			},
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "mr-1.5 h-3.5 w-3.5" }), "Export"]
		}),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mb-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4",
				children: [
					{
						l: "Today's Collection",
						v: formatValue(todayCollection),
						icon: IndianRupee,
						color: "text-primary"
					},
					{
						l: "This Month",
						v: formatValue(thisMonthCollection),
						icon: Wallet,
						color: "text-primary/80"
					},
					{
						l: "Cash",
						v: formatValue(cashCollection),
						icon: Banknote,
						color: "text-accent"
					},
					{
						l: "Bank Transfers",
						v: formatValue(bankCollection),
						icon: Building2,
						color: "text-success"
					}
				].map((s, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
					className: `hover:shadow-[var(--shadow-elevated)] hover:-translate-y-0.5 transition-all animate-[fade-in_0.35s_ease-out_both] stagger-${i + 1}`,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
						className: "p-3.5 sm:p-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "metric-icon h-8 w-8 sm:h-9 sm:w-9 mb-2.5",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(s.icon, { className: `h-3.5 w-3.5 sm:h-4 sm:w-4 ${s.color}` })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground/65 leading-tight",
								children: s.l
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: `mt-1 font-display text-[18px] sm:text-[22px] font-bold ${s.color}`,
								children: s.v
							})
						]
					})
				}, s.l))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "w-full",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
					className: "overflow-hidden",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, {
							className: "border-b border-border/60 bg-muted/20 px-5 py-3",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-col sm:flex-row sm:items-center justify-between gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Payments" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex bg-muted/60 p-0.5 rounded-lg border border-border/50 text-[11px]",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											className: `px-2.5 py-1 rounded-md font-semibold transition-colors ${viewMode === "by-agreement" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`,
											onClick: () => setViewMode("by-agreement"),
											children: "By Agreement"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											className: `px-2.5 py-1 rounded-md font-semibold transition-colors ${viewMode === "all-receipts" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`,
											onClick: () => setViewMode("all-receipts"),
											children: "All Receipts"
										})]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
											value: dateFilter,
											onValueChange: setDateFilter,
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
												className: "h-8 w-[120px] text-[12px] bg-card border-border/50 rounded-lg",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "All Payments" })
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, {
												className: "border border-border/60 bg-popover shadow-elevated rounded-lg",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
														value: "all",
														className: "text-[12px] cursor-pointer",
														children: "All Payments"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
														value: "this-month",
														className: "text-[12px] cursor-pointer",
														children: "This Month"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
														value: "last-month",
														className: "text-[12px] cursor-pointer",
														children: "Last Month"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
														value: "custom",
														className: "text-[12px] cursor-pointer",
														children: "Custom Range..."
													})
												]
											})]
										}),
										dateFilter === "custom" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-1.5 animate-[fade-in_0.2s_ease-out] shrink-0",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													type: "date",
													className: "h-8 text-[11px] w-[130px] bg-card border-border/50 cursor-pointer",
													value: startDate,
													onChange: (e) => setStartDate(e.target.value)
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-[10px] text-muted-foreground",
													children: "to"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													type: "date",
													className: "h-8 text-[11px] w-[130px] bg-card border-border/50 cursor-pointer",
													value: endDate,
													onChange: (e) => setEndDate(e.target.value)
												})
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "relative w-40 sm:w-48",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												placeholder: "Search…",
												className: "pl-9 h-8 text-[12px] bg-card border-border/50",
												value: search,
												onChange: (e) => setSearch(e.target.value)
											})]
										})
									]
								})]
							})
						}),
						viewMode === "by-agreement" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "hidden sm:block",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Agreement ID" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Customer" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Equipment" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
									className: "text-right",
									children: "Total Collected"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
									className: "text-center",
									children: "Receipts"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Latest Payment" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Status" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
									className: "w-24 text-right",
									children: "Actions"
								})
							] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableBody, { children: [filteredAgreements.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableRow, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
								colSpan: 8,
								className: "py-10 text-center text-[13px] text-muted-foreground",
								children: "No agreements match your search."
							}) }), filteredAgreements.map((g) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, {
								className: "group cursor-pointer hover:bg-muted/30 transition-colors",
								onClick: () => setSelectedHistoryAgreementId(g.agreementId),
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-mono text-[12px] font-bold text-primary group-hover:underline flex items-center gap-1",
										children: g.agreementId
									}) }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-semibold text-[13px] text-foreground",
										children: g.customerName
									}) }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[12px] font-medium text-foreground/80 truncate max-w-[180px]",
										title: g.equipment,
										children: g.equipment
									}) }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
										className: "text-right",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "font-display text-[14px] font-bold text-success",
											children: ["₹", g.totalCollected.toLocaleString("en-IN")]
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
										className: "text-center",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "inline-flex items-center gap-1 bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full text-[11px] font-bold",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Receipt, { className: "h-3 w-3" }), g.totalCount]
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[11px] text-foreground font-medium",
										children: g.latestDate || "—"
									}), g.latestMode !== "—" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: `inline-flex items-center rounded px-1.5 py-0.2 text-[10px] font-semibold mt-0.5 ${modeColors[g.latestMode] ?? "bg-muted text-muted-foreground"}`,
										children: g.latestMode
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, { status: g.rentStatus }) }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
										className: "text-right",
										onClick: (e) => e.stopPropagation(),
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											variant: "ghost",
											size: "sm",
											className: "h-7 text-[11px] text-primary hover:bg-primary/10 px-2 font-semibold",
											onClick: () => setSelectedHistoryAgreementId(g.agreementId),
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(History, { className: "mr-1 h-3.5 w-3.5" }), " History"]
										})
									})
								]
							}, g.agreementId))] })] })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "sm:hidden divide-y divide-border/60",
							children: filteredAgreements.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "py-10 text-center text-[13px] text-muted-foreground",
								children: "No agreements match your search."
							}) : filteredAgreements.map((g) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "px-4 py-3.5 cursor-pointer hover:bg-muted/20",
								onClick: () => setSelectedHistoryAgreementId(g.agreementId),
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-start justify-between gap-2 mb-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-mono text-[11px] font-bold text-primary",
											children: g.agreementId
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "font-semibold text-[13.5px] mt-0.5",
											children: g.customerName
										})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex flex-col items-end gap-1",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "font-display text-[15px] font-bold text-success",
												children: ["₹", g.totalCollected.toLocaleString("en-IN")]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, { status: g.rentStatus })]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[11px] text-muted-foreground truncate",
										children: g.equipment
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between mt-2 pt-2 border-t border-border/40 text-[11px]",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "text-muted-foreground",
											children: [
												g.totalCount,
												" Payment",
												g.totalCount === 1 ? "" : "s"
											]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											size: "sm",
											variant: "ghost",
											className: "h-6 text-[11px] text-primary p-0",
											children: ["View Payment History ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "ml-1 h-3 w-3" })]
										})]
									})
								]
							}, g.agreementId))
						})] }),
						viewMode === "all-receipts" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "hidden sm:block",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Receipt" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Customer" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Type" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Mode" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Collected By" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
									className: "text-right",
									children: "Amount"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Status" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
									className: "w-24 text-right",
									children: "Actions"
								})
							] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableBody, { children: [filteredPayments.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableRow, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
								colSpan: 8,
								className: "py-10 text-center text-[13px] text-muted-foreground",
								children: "No payments match your search."
							}) }), filteredPayments.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, {
								className: "group",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-mono text-[11px] font-bold text-primary",
										children: p.id
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[10px] text-muted-foreground",
										children: p.date
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-semibold text-[13px]",
										children: p.customer
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "font-mono text-[10px] text-primary hover:underline font-bold text-left cursor-pointer",
										onClick: () => setSelectedHistoryAgreementId(p.agreement),
										children: p.agreement
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: `inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${typeColors[p.type] ?? "bg-muted text-muted-foreground border-border/50"}`,
										children: p.type
									}) }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: `inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${modeColors[p.mode] ?? "bg-muted text-muted-foreground border-border/50"}`,
										children: p.mode
									}) }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[13px] font-semibold text-foreground/80",
										children: p.collectedBy || "Dr. Rao"
									}) }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
										className: "text-right",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "font-display text-[14px] font-bold",
											children: ["₹", p.amount.toLocaleString("en-IN")]
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, { status: p.status }) }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
										className: "text-right",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-end gap-1",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PrintReceiptDialog, { payment: p }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DeletePaymentDialog, {
												payment: p,
												onDelete: refresh,
												trigger: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
													variant: "ghost",
													size: "icon",
													className: "h-7 w-7 text-muted-foreground hover:text-destructive",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-3.5 w-3.5" })
												})
											})]
										})
									})
								]
							}, p.id))] })] })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "sm:hidden",
							children: filteredPayments.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "py-10 text-center text-[13px] text-muted-foreground",
								children: "No payments match your search."
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "divide-y divide-border/60",
								children: filteredPayments.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "px-4 py-3.5",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-start justify-between gap-2 mb-1.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "font-mono text-[11px] font-bold text-primary",
													children: p.id
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "font-semibold text-[13.5px] mt-0.5",
													children: p.customer
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													type: "button",
													className: "font-mono text-[10px] text-primary hover:underline font-bold",
													onClick: () => setSelectedHistoryAgreementId(p.agreement),
													children: p.agreement
												})
											] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex flex-col items-end gap-1",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "font-display text-[15px] font-bold",
													children: ["₹", p.amount.toLocaleString("en-IN")]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, { status: p.status })]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-2 text-[11px] text-muted-foreground",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: p.date }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "·" }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: `inline-flex items-center rounded px-1.5 py-0.5 font-semibold ${modeColors[p.mode] ?? "bg-muted text-muted-foreground"}`,
													children: p.mode
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "·" }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: p.type })
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "mt-2 flex justify-end",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PrintReceiptDialog, { payment: p })
										})
									]
								}, p.id))
							})
						})] })
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AgreementPaymentHistoryModal, {
				agreementId: selectedHistoryAgreementId,
				open: !!selectedHistoryAgreementId,
				onOpenChange: (open) => {
					if (!open) setSelectedHistoryAgreementId(null);
				},
				onRefresh: refresh
			})
		]
	});
}
//#endregion
export { PaymentsPage as component };
