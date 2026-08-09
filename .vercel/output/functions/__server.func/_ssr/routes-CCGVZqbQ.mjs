import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { H as parseLocalDate, I as getOwners, L as getPaidForEquipment, R as getPayments, T as getEquipment, V as getReturns, p as downloadExcel, st as useDatabaseTrigger, w as getDynamicKPIs, z as getRentals } from "./data-store-BXBhFJro.mjs";
import { c as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { Ct as CircleCheck, E as RotateCcw, It as Bell, P as Package, Ut as Activity, Z as Handshake, at as FileText, gt as CreditCard, j as Plus, m as TrendingUp, mt as Download, o as Users, q as IndianRupee, wt as CircleAlert, zt as ArrowUpRight } from "../_libs/lucide-react.mjs";
import { t as Button } from "./dialog-BHa0LWsH.mjs";
import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as CardContent, i as Card, o as CardHeader, s as CardTitle, t as AppShell } from "./AppShell-ABaTd-bJ.mjs";
import { i as TabsTrigger, n as TabsContent, r as TabsList, t as Tabs } from "./tabs-BoOa83d5.mjs";
import { a as YAxis, c as Line, i as LineChart, l as CartesianGrid, m as Tooltip, o as XAxis, p as ResponsiveContainer, r as BarChart, s as Area, t as AreaChart, u as Bar } from "../_libs/recharts+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-CCGVZqbQ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var kpiIcons = [
	FileText,
	Handshake,
	RotateCcw,
	Package,
	Package,
	IndianRupee,
	CircleAlert,
	CreditCard
];
var tooltipStyle = {
	background: "var(--color-popover)",
	border: "1px solid var(--color-border)",
	borderRadius: 10,
	fontSize: 12,
	boxShadow: "var(--shadow-elevated)",
	padding: "8px 12px",
	color: "var(--color-foreground)"
};
var activityTypes = [
	"All",
	"Rentals",
	"Payments",
	"Returns",
	"Alerts"
];
var activityTypeMap = {
	rental: "Rentals",
	payment: "Payments",
	return: "Returns",
	alert: "Alerts"
};
var activityIconMap = {
	payment: CircleCheck,
	rental: FileText,
	return: RotateCcw,
	alert: CircleAlert
};
var activityColorMap = {
	primary: "bg-primary/10 text-primary",
	success: "bg-success/10 text-success",
	accent: "bg-accent/10 text-accent",
	destructive: "bg-destructive/10 text-destructive"
};
var activityLabelColor = {
	primary: "bg-primary/10 text-primary",
	success: "bg-success/10 text-success",
	accent: "bg-accent/10 text-accent",
	destructive: "bg-destructive/10 text-destructive"
};
var getCurrentFY = () => {
	const today = /* @__PURE__ */ new Date();
	const year = today.getFullYear();
	if (today.getMonth() >= 3) return `FY ${year}-${String(year + 1).slice(-2)}`;
	else return `FY ${year - 1}-${String(year).slice(-2)}`;
};
function Dashboard() {
	useDatabaseTrigger();
	const [activeActivity, setActiveActivity] = (0, import_react.useState)("All");
	const kpis = getDynamicKPIs();
	const paymentsList = getPayments();
	const rentalsList = getRentals();
	const equipmentList = getEquipment();
	const returnsList = getReturns();
	const equipmentByOwner = getOwners().map((owner) => {
		const count = equipmentList.filter((e) => e.owner?.toLowerCase() === owner.name.toLowerCase()).length;
		return {
			name: owner.name,
			count
		};
	});
	const inHouseCount = equipmentList.filter((e) => !e.owner || e.owner.toLowerCase() === "medirent" || e.owner.toLowerCase() === "medirent healthcare").length;
	const ownerGraphData = [...inHouseCount > 0 ? [{
		name: "In-House",
		count: inHouseCount
	}] : [], ...equipmentByOwner.filter((o) => o.count > 0 && o.name.toLowerCase() !== "medirent" && o.name.toLowerCase() !== "medirent healthcare")];
	const oneWeekAgo = /* @__PURE__ */ new Date();
	oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
	const weeklyNewRentals = rentalsList.filter((r) => {
		const rDate = parseLocalDate(r.start);
		return !isNaN(rDate.getTime()) && rDate.getTime() >= oneWeekAgo.getTime();
	}).length;
	const weeklyReturns = returnsList.filter((ret) => {
		const retDate = parseLocalDate(ret.date);
		return !isNaN(retDate.getTime()) && retDate.getTime() >= oneWeekAgo.getTime();
	}).length;
	const maintenanceCount = equipmentList.filter((e) => e.status === "UnderMaintenance").length;
	const totalCollected = paymentsList.filter((p) => p.status === "Paid").reduce((sum, p) => sum + p.amount, 0);
	const today = /* @__PURE__ */ new Date();
	today.setHours(0, 0, 0, 0);
	const getStartDayOfMonth = (dateStr) => {
		const d = parseLocalDate(dateStr);
		if (isNaN(d.getTime())) return 1;
		return d.getDate();
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
		const start = parseLocalDate(rental.start);
		const grandTotalPaid = getPaidForEquipment(rental, eqId, paymentsList, true);
		let unpaidMonths = 0;
		let unpaidDays = 0;
		let outstanding = 0;
		let unpaidText = "";
		let rateText = "";
		let totalDue = 0;
		if (isMonthly) {
			const diffTime = Math.max(0, today.getTime() - start.getTime());
			const totalDaysElapsed = Math.ceil(diffTime / (1e3 * 60 * 60 * 24));
			totalDue = Math.floor(totalDaysElapsed / 30) * monthlyRent;
			outstanding = Math.max(0, totalDue - grandTotalPaid);
			unpaidMonths = monthlyRent > 0 ? Math.round(outstanding / monthlyRent) : 0;
			unpaidText = `${unpaidMonths}m`;
			rateText = `₹${monthlyRent.toLocaleString("en-IN")}/mo`;
		} else {
			const diffTime = Math.max(0, today.getTime() - start.getTime());
			totalDue = Math.ceil(diffTime / (1e3 * 60 * 60 * 24)) * dailyRate;
			outstanding = Math.max(0, totalDue - grandTotalPaid);
			unpaidDays = dailyRate > 0 ? Math.round(outstanding / dailyRate) : 0;
			unpaidMonths = 0;
			unpaidText = `${unpaidDays}d`;
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
	const activeRentals = rentalsList.filter((r) => {
		if (r.status === "Completed" || r.status === "Cancelled") return false;
		if (r.equipmentItems && r.equipmentItems.length > 0) {
			if (r.equipmentItems.every((item) => item.returned)) return false;
		}
		return true;
	});
	const dueItems = [];
	activeRentals.forEach((r) => {
		(r.equipmentItems || [{
			equipmentId: r.equipmentId,
			serial: r.serial,
			monthlyRent: Number(r.monthlyRent) || 0,
			deposit: Number(r.deposit) || 0,
			returned: false
		}]).forEach((eqItem) => {
			if (!eqItem.returned) dueItems.push({
				rental: r,
				equipmentId: eqItem.equipmentId,
				serial: eqItem.serial,
				monthlyRent: Number(eqItem.monthlyRent || eqItem.rentRate) || 0,
				deposit: Number(eqItem.deposit) || 0,
				start: r.start,
				id: `${r.id}-${eqItem.equipmentId}`
			});
		});
	});
	const due1To10List = dueItems.filter((item) => {
		const d = getStartDayOfMonth(item.start);
		return d >= 1 && d <= 10;
	});
	const due11To20List = dueItems.filter((item) => {
		const d = getStartDayOfMonth(item.start);
		return d >= 11 && d <= 20;
	});
	const due21To31List = dueItems.filter((item) => {
		const d = getStartDayOfMonth(item.start);
		return d >= 21 && d <= 31;
	});
	const totalPending = dueItems.reduce((sum, item) => sum + calcUnpaidDetailsForEquipment(item.rental, item.equipmentId).outstanding, 0);
	const totalTarget = totalCollected + totalPending;
	const collectionRate = totalTarget > 0 ? Math.round(totalCollected / totalTarget * 100) : 0;
	const formatLakhs = (val) => {
		return `₹${val.toLocaleString("en-IN")}`;
	};
	const months = [
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
	];
	const revenueData = months.map((m, idx) => {
		return {
			month: m,
			current: paymentsList.filter((p) => {
				if (p.status !== "Paid") return false;
				const pDate = parseLocalDate(p.date);
				return !isNaN(pDate.getTime()) && pDate.getMonth() === idx;
			}).reduce((sum, p) => sum + p.amount, 0),
			previous: 0
		};
	});
	const utilizationData = (equipmentList.length > 0 ? Array.from(new Set(equipmentList.map((e) => e.category))) : [
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
	]).map((cat) => {
		const catEquip = equipmentList.filter((e) => e.category === cat);
		const rentedCount = catEquip.filter((e) => e.status === "Rented" || e.status === "Active").length;
		return {
			name: cat,
			value: catEquip.length > 0 ? Math.round(rentedCount / catEquip.length * 100) : 0
		};
	});
	const collectionData = [
		"Mon",
		"Tue",
		"Wed",
		"Thu",
		"Fri",
		"Sat",
		"Sun"
	].map((day, idx) => {
		const dayPayments = paymentsList.filter((p) => {
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
	const pendingDuesData = [
		{
			label: "1–10 Days Due",
			amount: due1To10List.reduce((sum, item) => sum + calcUnpaidDetailsForEquipment(item.rental, item.equipmentId).outstanding, 0),
			count: due1To10List.filter((item) => calcUnpaidDetailsForEquipment(item.rental, item.equipmentId).outstanding > 0).length
		},
		{
			label: "11–20 Days Due",
			amount: due11To20List.reduce((sum, item) => sum + calcUnpaidDetailsForEquipment(item.rental, item.equipmentId).outstanding, 0),
			count: due11To20List.filter((item) => calcUnpaidDetailsForEquipment(item.rental, item.equipmentId).outstanding > 0).length
		},
		{
			label: "21–31 Days Due",
			amount: due21To31List.reduce((sum, item) => sum + calcUnpaidDetailsForEquipment(item.rental, item.equipmentId).outstanding, 0),
			count: due21To31List.filter((item) => calcUnpaidDetailsForEquipment(item.rental, item.equipmentId).outstanding > 0).length
		}
	];
	const rentalGrowthData = months.map((m, idx) => {
		return {
			month: m,
			newRentals: rentalsList.filter((r) => {
				const rDate = parseLocalDate(r.start);
				return !isNaN(rDate.getTime()) && rDate.getMonth() === idx;
			}).length,
			returns: returnsList.filter((ret) => {
				const retDate = parseLocalDate(ret.date);
				return !isNaN(retDate.getTime()) && retDate.getMonth() === idx;
			}).length
		};
	});
	const dynamicActivities = [];
	rentalsList.forEach((r) => {
		dynamicActivities.push({
			type: "rental",
			text: `New rental created for ${r.customer} — ${r.equipment}`,
			time: r.start,
			tone: "primary"
		});
	});
	paymentsList.forEach((p) => {
		dynamicActivities.push({
			type: "payment",
			text: `Payment of ₹${p.amount.toLocaleString("en-IN")} received via ${p.mode} from ${p.customer}`,
			time: p.date,
			tone: "success"
		});
	});
	returnsList.forEach((ret) => {
		dynamicActivities.push({
			type: "return",
			text: `${ret.equipment} returned by ${ret.customer}`,
			time: ret.date,
			tone: "accent"
		});
	});
	const filteredActivities = dynamicActivities.filter((a) => {
		if (activeActivity === "All") return true;
		return activityTypeMap[a.type] === activeActivity;
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "Dashboard",
		subtitle: "Overview of your medical equipment rental operations",
		actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
			variant: "outline",
			size: "sm",
			onClick: () => {
				downloadExcel("dashboard_kpis_export.xls", [
					"KPI Metric",
					"Value",
					"Description"
				], kpis.map((k) => [
					k.label,
					k.value,
					k.description || ""
				]), [
					200,
					110,
					300
				]);
				toast.success("Dashboard metrics report exported successfully.");
			},
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "mr-1.5 h-3.5 w-3.5" }), "Export"]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
			size: "sm",
			asChild: true,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
				to: "/rentals",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "mr-1.5 h-3.5 w-3.5" }), "New Rental"]
			})
		})] }),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
			defaultValue: "overview",
			className: "space-y-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
						value: "overview",
						children: "Overview"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
						value: "financial",
						children: "Financial"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
						value: "operations",
						children: "Operations"
					})
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
					value: "overview",
					className: "space-y-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4",
							children: kpis.map((k, i) => {
								const Icon = kpiIcons[i] ?? Users;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
									className: `relative overflow-hidden hover:shadow-[var(--shadow-elevated)] hover:-translate-y-0.5 animate-[fade-in_0.35s_ease-out_both] stagger-${Math.min(i + 1, 8)}`,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
										className: "p-3.5 sm:p-5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-start justify-between gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex-1 min-w-0",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground/65 leading-tight",
													children: k.label
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "mt-1.5 sm:mt-2 font-display text-[22px] sm:text-[26px] font-bold tracking-tight animate-count-up",
													children: k.value
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "metric-icon h-8 w-8 sm:h-10 sm:w-10 shrink-0",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "h-4 w-4 sm:h-4.5 sm:w-4.5 text-muted-foreground" })
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "mt-2.5 sm:mt-3.5 flex items-center text-[10px] sm:text-[11px] text-muted-foreground/75 font-medium leading-none",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "truncate",
												children: k.description
											})
										})]
									})
								}, k.label);
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-4 grid-cols-1 lg:grid-cols-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
								className: "lg:col-span-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, {
									className: "flex flex-row items-start justify-between border-b border-border/60 pb-3 mb-0",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Revenue Performance" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-0.5 text-[12px] text-muted-foreground",
										children: "Monthly rent collection vs previous year"
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-4 text-[11px] text-muted-foreground shrink-0",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "flex items-center gap-1.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-2 w-2 rounded-sm bg-primary" }), "Current"]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "flex items-center gap-1.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-2 w-2 rounded-sm bg-accent" }), "Previous"]
										})]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
									className: "pt-4",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
										width: "100%",
										height: 240,
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AreaChart, {
											data: revenueData,
											margin: {
												left: -10,
												right: 8,
												top: 8,
												bottom: 0
											},
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("defs", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("linearGradient", {
													id: "gCurrent",
													x1: "0",
													y1: "0",
													x2: "0",
													y2: "1",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
														offset: "0%",
														stopColor: "var(--color-primary)",
														stopOpacity: .3
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
														offset: "100%",
														stopColor: "var(--color-primary)",
														stopOpacity: 0
													})]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("linearGradient", {
													id: "gPrev",
													x1: "0",
													y1: "0",
													x2: "0",
													y2: "1",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
														offset: "0%",
														stopColor: "var(--color-accent)",
														stopOpacity: .2
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
														offset: "100%",
														stopColor: "var(--color-accent)",
														stopOpacity: 0
													})]
												})] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
													strokeDasharray: "3 3",
													stroke: "var(--color-border)",
													vertical: false,
													opacity: .5
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
													dataKey: "month",
													stroke: "var(--color-muted-foreground)",
													fontSize: 11,
													tickLine: false,
													axisLine: false
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
													stroke: "var(--color-muted-foreground)",
													fontSize: 11,
													tickLine: false,
													axisLine: false,
													tickFormatter: (v) => `₹${(v / 1e3).toFixed(0)}k`
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, {
													contentStyle: tooltipStyle,
													formatter: (v) => [`₹${v.toLocaleString("en-IN")}`, ""]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Area, {
													type: "monotone",
													dataKey: "current",
													stroke: "var(--color-primary)",
													strokeWidth: 2,
													fill: "url(#gCurrent)"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Area, {
													type: "monotone",
													dataKey: "previous",
													stroke: "var(--color-accent)",
													strokeWidth: 1.5,
													strokeDasharray: "5 4",
													fill: "url(#gPrev)"
												})
											]
										})
									})
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, {
								className: "border-b border-border/60 pb-3 mb-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Collection Rate" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[12px] text-muted-foreground",
									children: "December target progress"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
								className: "pt-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "relative flex items-center justify-center h-40",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
											className: "h-36 w-36 transform -rotate-90",
											viewBox: "0 0 100 100",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("defs", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("linearGradient", {
													id: "collectionGradient",
													x1: "0%",
													y1: "0%",
													x2: "100%",
													y2: "100%",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
														offset: "0%",
														stopColor: "var(--color-primary)"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
														offset: "100%",
														stopColor: "var(--color-primary-glow)"
													})]
												}) }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
													cx: "50",
													cy: "50",
													r: "40",
													stroke: "var(--color-muted)",
													strokeOpacity: "0.25",
													strokeWidth: "6",
													fill: "transparent"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
													cx: "50",
													cy: "50",
													r: "40",
													stroke: "url(#collectionGradient)",
													strokeWidth: "8",
													fill: "transparent",
													strokeDasharray: 251.2,
													strokeDashoffset: 251.2 - 251.2 * collectionRate / 100,
													strokeLinecap: "round",
													className: "transition-all duration-500 ease-in-out"
												})
											]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "pointer-events-none absolute inset-0 flex flex-col items-center justify-center",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "font-display text-3xl font-bold tracking-tight text-foreground",
												children: [collectionRate, "%"]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "mt-1 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/75",
												children: "Collected"
											})]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "mt-2 mb-4 text-center",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-[12px] text-muted-foreground",
											children: [
												"Progress: ",
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "font-semibold text-foreground",
													children: formatLakhs(totalCollected)
												}),
												" of ",
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "font-semibold text-muted-foreground",
													children: formatLakhs(totalTarget)
												})
											]
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-2 gap-2 text-center",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "rounded-lg bg-success/8 border border-success/18 p-3",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[11px] text-muted-foreground",
												children: "Collected"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-0.5 font-display text-[17px] font-bold text-success",
												children: formatLakhs(totalCollected)
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "rounded-lg bg-warning/10 border border-warning/22 p-3",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[11px] text-muted-foreground",
												children: "Pending"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-0.5 font-display text-[17px] font-bold text-warning-foreground",
												children: formatLakhs(totalPending)
											})]
										})]
									})
								]
							})] })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-4 grid-cols-1 lg:grid-cols-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
									className: "lg:col-span-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, {
										className: "border-b border-border/60 pb-3 mb-0",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Equipment Utilization" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[12px] text-muted-foreground",
											children: "Live utilization rate by category"
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
										className: "pt-4 space-y-4 max-h-[350px] overflow-y-auto pr-1",
										children: utilizationData.map((u, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: `animate-[fade-in_0.35s_ease-out_both] stagger-${Math.min(i + 1, 8)}`,
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "mb-1.5 flex items-center justify-between text-[12px]",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "font-medium text-foreground/80 truncate max-w-[170px]",
													title: u.name,
													children: u.name
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "font-bold tabular-nums text-foreground",
													children: [u.value, "%"]
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "relative h-1.5 overflow-hidden rounded-full bg-muted",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "h-full rounded-full bg-primary transition-all duration-700",
													style: { width: `${u.value}%` }
												})
											})]
										}, u.name))
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
									className: "lg:col-span-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, {
										className: "border-b border-border/60 pb-3 mb-0",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Equipment by Owner" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[12px] text-muted-foreground",
											children: "Inventory distribution across partners"
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
										className: "pt-4",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
											width: "100%",
											height: 260,
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(BarChart, {
												data: ownerGraphData,
												margin: {
													left: -22,
													right: 5,
													top: 10,
													bottom: 0
												},
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
														strokeDasharray: "3 3",
														stroke: "var(--color-border)",
														vertical: false,
														opacity: .5
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
														dataKey: "name",
														stroke: "var(--color-muted-foreground)",
														fontSize: 9,
														tickLine: false,
														axisLine: false,
														tickFormatter: (val) => val.length > 12 ? val.slice(0, 10) + ".." : val
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
														stroke: "var(--color-muted-foreground)",
														fontSize: 9,
														tickLine: false,
														axisLine: false,
														allowDecimals: false
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, {
														contentStyle: tooltipStyle,
														formatter: (v) => [`${v} Units`, "Equipment Count"]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
														dataKey: "count",
														fill: "var(--color-primary)",
														radius: [
															4,
															4,
															0,
															0
														]
													})
												]
											})
										})
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
									className: "lg:col-span-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, {
										className: "border-b border-border/60 pb-0 mb-0",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-between mb-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Recent Activity" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[12px] text-muted-foreground",
												children: "Live feed of operations"
											})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "flex items-center gap-1 text-[10px] font-bold text-success bg-success/10 border border-success/20 rounded-md px-2 py-0.5",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-1.5 w-1.5 rounded-full bg-success animate-[pulse-dot_2.5s_ease-in-out_infinite]" }), "LIVE"]
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "flex flex-wrap gap-1 pb-3",
											children: activityTypes.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												onClick: () => setActiveActivity(t),
												className: `rounded-md px-2.5 py-0.5 text-[11px] font-semibold transition-all ${t === activeActivity ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"}`,
												children: t
											}, t))
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
										className: "pt-2 space-y-0.5 max-h-[290px] overflow-y-auto pr-1",
										children: filteredActivities.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex flex-col items-center justify-center py-10 text-center",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Activity, { className: "h-8 w-8 text-muted-foreground/30 mb-2" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[12px] text-muted-foreground",
												children: "No activities in this category"
											})]
										}) : filteredActivities.map((a, i) => {
											const Icon = activityIconMap[a.type] ?? CircleCheck;
											return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex gap-2.5 rounded-lg p-2 transition-colors hover:bg-muted/40 animate-[fade-in_0.35s_ease-out_both]",
												style: { animationDelay: `${i * .05}s` },
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: `flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${activityColorMap[a.tone]}`,
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "h-3.5 w-3.5" })
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex-1 min-w-0",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "text-[12px] font-medium leading-snug text-foreground/90 truncate",
														children: a.text
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "mt-0.5 flex items-center gap-1.5",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "text-[10px] text-muted-foreground",
															children: a.time
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: `rounded px-1 py-px text-[9px] font-semibold ${activityLabelColor[a.tone]}`,
															children: activityTypeMap[a.type] ?? a.type
														})]
													})]
												})]
											}, i);
										})
									})]
								})
							]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
					value: "financial",
					className: "space-y-5",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-5 lg:grid-cols-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, {
								className: "border-b border-border/60 pb-3 mb-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Payment Collection — Last 7 Days" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[12px] text-muted-foreground",
									children: "Daily collected vs pending"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
								className: "pt-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
									width: "100%",
									height: 240,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(BarChart, {
										data: collectionData,
										barCategoryGap: "30%",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
												strokeDasharray: "3 3",
												stroke: "var(--color-border)",
												vertical: false,
												opacity: .5
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
												dataKey: "day",
												stroke: "var(--color-muted-foreground)",
												fontSize: 11,
												tickLine: false,
												axisLine: false
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
												stroke: "var(--color-muted-foreground)",
												fontSize: 11,
												tickLine: false,
												axisLine: false,
												tickFormatter: (v) => `₹${(v / 1e3).toFixed(0)}k`
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, {
												contentStyle: tooltipStyle,
												formatter: (v) => `₹${v.toLocaleString("en-IN")}`
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
												dataKey: "collected",
												fill: "var(--color-primary)",
												radius: [
													6,
													6,
													0,
													0
												],
												name: "Collected"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
												dataKey: "pending",
												fill: "var(--color-accent)",
												radius: [
													6,
													6,
													0,
													0
												],
												name: "Pending"
											})
										]
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-2 flex items-center justify-center gap-5 text-[11px] text-muted-foreground",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "flex items-center gap-1.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-2 w-3 rounded-sm bg-primary/80" }), "Collected"]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "flex items-center gap-1.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-2 w-3 rounded-sm bg-accent/80" }), "Pending"]
									})]
								})]
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, {
								className: "border-b border-border/60 pb-3 mb-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Pending Dues Breakdown" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[12px] text-muted-foreground",
									children: "Overdue bucket analysis"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
								className: "pt-4 space-y-3",
								children: [pendingDuesData.map((d, i) => {
									const maxAmt = Math.max(...pendingDuesData.map((x) => x.amount));
									const pct = maxAmt > 0 ? Math.round(d.amount / maxAmt * 100) : 0;
									return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: `animate-[fade-in_0.35s_ease-out_both] stagger-${i + 1}`,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-between text-[12px] mb-1",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-1.5",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bell, { className: `h-3 w-3 ${i >= 2 ? "text-destructive" : "text-muted-foreground"}` }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "font-medium",
														children: d.label
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "text-muted-foreground/60",
														children: [
															"(",
															d.count,
															")"
														]
													})
												]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "font-bold tabular-nums",
												children: ["₹", d.amount.toLocaleString("en-IN")]
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "relative h-1.5 overflow-hidden rounded-full bg-muted",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: `h-full rounded-full ${[
													"bg-primary",
													"bg-accent",
													"bg-warning-foreground"
												][i]} transition-all duration-700`,
												style: { width: `${pct}%` }
											})
										})]
									}, d.label);
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-3 rounded-lg border border-destructive/18 bg-destructive/5 p-3 text-[12px] text-destructive font-medium",
									children: [
										"Total Pending: ₹",
										pendingDuesData.reduce((s, d) => s + d.amount, 0).toLocaleString("en-IN"),
										" across ",
										pendingDuesData.reduce((s, d) => s + d.count, 0),
										" invoices"
									]
								})]
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
								className: "lg:col-span-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, {
									className: "border-b border-border/60 pb-3 mb-0 flex flex-row items-center justify-between space-y-0",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Pending Payments Aging Chart" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[12px] text-muted-foreground",
										children: "Outstanding amounts across overdue timeframes"
									})] })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
									className: "pt-4",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
										width: "100%",
										height: 240,
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(BarChart, {
											data: pendingDuesData,
											barCategoryGap: "45%",
											margin: {
												left: -10,
												right: 8,
												top: 8
											},
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
													strokeDasharray: "3 3",
													stroke: "var(--color-border)",
													vertical: false,
													opacity: .5
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
													dataKey: "label",
													stroke: "var(--color-muted-foreground)",
													fontSize: 11,
													tickLine: false,
													axisLine: false
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
													stroke: "var(--color-muted-foreground)",
													fontSize: 11,
													tickLine: false,
													axisLine: false,
													tickFormatter: (v) => `₹${(v / 1e3).toFixed(0)}k`
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, {
													contentStyle: tooltipStyle,
													formatter: (v) => [`₹${v.toLocaleString("en-IN")}`, "Pending Amount"]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
													dataKey: "amount",
													fill: "var(--color-accent)",
													radius: [
														6,
														6,
														0,
														0
													]
												})
											]
										})
									})
								})]
							})
						]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
					value: "operations",
					className: "space-y-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, {
						className: "border-b border-border/60 pb-3 mb-0 flex flex-row items-center justify-between space-y-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Rental Growth Chart" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-[12px] text-muted-foreground",
							children: ["Monthly new rentals vs returns — ", getCurrentFY()]
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-4 text-[11px] text-muted-foreground",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "flex items-center gap-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-2 w-3 rounded-sm bg-primary" }), "New Rentals"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "flex items-center gap-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-2 w-3 rounded-sm bg-accent" }), "Returns"]
							})]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
						className: "pt-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
							width: "100%",
							height: 260,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(LineChart, {
								data: rentalGrowthData,
								margin: {
									left: -10,
									right: 8,
									top: 8
								},
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
										strokeDasharray: "3 3",
										stroke: "var(--color-border)",
										vertical: false,
										opacity: .5
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
										dataKey: "month",
										stroke: "var(--color-muted-foreground)",
										fontSize: 11,
										tickLine: false,
										axisLine: false
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
										stroke: "var(--color-muted-foreground)",
										fontSize: 11,
										tickLine: false,
										axisLine: false
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, { contentStyle: tooltipStyle }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
										type: "monotone",
										dataKey: "newRentals",
										stroke: "var(--color-primary)",
										strokeWidth: 2,
										dot: {
											r: 3,
											fill: "var(--color-primary)",
											strokeWidth: 0
										},
										name: "New Rentals"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
										type: "monotone",
										dataKey: "returns",
										stroke: "var(--color-accent)",
										strokeWidth: 1.5,
										dot: {
											r: 2.5,
											fill: "var(--color-accent)",
											strokeWidth: 0
										},
										strokeDasharray: "5 4",
										name: "Returns"
									})
								]
							})
						})
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid gap-4 sm:grid-cols-3",
						children: [
							{
								icon: TrendingUp,
								label: "New Rentals",
								value: weeklyNewRentals.toString(),
								color: "text-primary",
								borderColor: "border-primary/20"
							},
							{
								icon: RotateCcw,
								label: "Returns",
								value: weeklyReturns.toString(),
								color: "text-accent",
								borderColor: "border-accent/20"
							},
							{
								icon: CircleAlert,
								label: "Maintenance",
								value: maintenanceCount.toString(),
								color: "text-warning-foreground",
								borderColor: "border-warning/25"
							}
						].map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: `rounded-xl border ${item.borderColor} bg-card p-6 transition-all hover:shadow-[var(--shadow-elevated)] hover:-translate-y-0.5`,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "metric-icon h-9 w-9 mb-4",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(item.icon, { className: `h-4 w-4 ${item.color}` })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[12px] text-muted-foreground",
									children: item.label
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 font-display text-[28px] font-bold tracking-tight",
									children: item.value
								})
							]
						}, item.label))
					})]
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4",
			children: [
				{
					label: "New Customer",
					desc: "Register a patient",
					icon: Users,
					to: "/customers"
				},
				{
					label: "New Rental",
					desc: "Create agreement",
					icon: FileText,
					to: "/rentals"
				},
				{
					label: "Receive Payment",
					desc: "Record collection",
					icon: CreditCard,
					to: "/payments"
				},
				{
					label: "Return Equipment",
					desc: "Process return",
					icon: RotateCcw,
					to: "/returns"
				}
			].map((a, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
				to: a.to,
				className: `group flex items-center gap-3 rounded-xl border border-border/60 bg-card p-4 transition-all duration-200 hover:border-primary/30 hover:shadow-[var(--shadow-elevated)] hover:-translate-y-0.5 animate-[fade-in_0.35s_ease-out_both] stagger-${Math.min(i + 1, 8)}`,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "metric-icon h-10 w-10 group-hover:bg-primary group-hover:border-primary group-hover:text-primary-foreground transition-all",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(a.icon, { className: "h-4.5 w-4.5 text-muted-foreground group-hover:text-primary-foreground transition-colors" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex-1 min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[13px] font-semibold text-foreground",
							children: a.label
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[11px] text-muted-foreground",
							children: a.desc
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpRight, { className: "h-4 w-4 text-muted-foreground/40 transition-all group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5" })
				]
			}, a.label))
		})]
	});
}
//#endregion
export { Dashboard as component };
