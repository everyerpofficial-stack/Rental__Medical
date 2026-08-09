import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { D as getLocalYYYYMMDD, E as getExchanges, H as parseLocalDate, I as getOwners, R as getPayments, T as getEquipment, V as getReturns, b as getCustomers, g as formatDateDDMMYYYY, p as downloadExcel, st as useDatabaseTrigger, z as getRentals } from "./data-store-BXBhFJro.mjs";
import { c as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { D as RefreshCw, Ft as Building2, P as Package, Rt as Banknote, at as FileText, it as FileTypeCorner, mt as Download, ot as FileSpreadsheet, p as TriangleAlert, s as UsersRound, zt as ArrowUpRight } from "../_libs/lucide-react.mjs";
import { l as Input, t as Button } from "./dialog-BHa0LWsH.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-C2rs2HGz.mjs";
import { a as CardContent, i as Card, o as CardHeader, s as CardTitle, t as AppShell } from "./AppShell-ABaTd-bJ.mjs";
import { a as TableHeader, i as TableHead, n as TableBody, o as TableRow, r as TableCell, t as Table } from "./table-DDeHIPcn.mjs";
import { a as YAxis, d as Pie, f as Cell, h as Legend, l as CartesianGrid, m as Tooltip, n as PieChart, o as XAxis, p as ResponsiveContainer, r as BarChart, s as Area, t as AreaChart, u as Bar } from "../_libs/recharts+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/reports-KKFzZigL.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var CHART_COLORS = [
	"var(--color-chart-1)",
	"var(--color-chart-2)",
	"var(--color-chart-3)",
	"var(--color-chart-4)",
	"var(--color-chart-5)"
];
var reportCards = [
	{
		title: "Rentals Statement",
		desc: "Detailed log of all rental agreement contracts",
		icon: FileText,
		color: "text-primary bg-primary/10 border-primary/20"
	},
	{
		title: "Exchanges Statement",
		desc: "Log of equipment exchange history",
		icon: RefreshCw,
		color: "text-warning-foreground bg-warning/10 border-warning/20"
	},
	{
		title: "Customers Statement",
		desc: "Customer profiles, details, and active statuses",
		icon: UsersRound,
		color: "text-accent bg-accent/10 border-accent/20"
	},
	{
		title: "Equipment Statement",
		desc: "Complete inventory listing and status statement",
		icon: Package,
		color: "text-primary bg-primary/10 border-primary/20"
	},
	{
		title: "Payments Statement",
		desc: "Payments received, transaction modes and status",
		icon: Banknote,
		color: "text-success bg-success/10 border-success/20"
	},
	{
		title: "Rent Dues Statement",
		desc: "Overdue rentals, unpaid balances and aging",
		icon: TriangleAlert,
		color: "text-destructive bg-destructive/10 border-destructive/20"
	},
	{
		title: "Return Statement",
		desc: "Returned equipment, damage charges and refunds",
		icon: FileTypeCorner,
		color: "text-warning-foreground bg-warning/10 border-warning/20"
	},
	{
		title: "Owner Statement",
		desc: "Owner-wise equipment counts and revenue shares",
		icon: Building2,
		color: "text-accent bg-accent/10 border-accent/20"
	}
];
var tooltipStyle = {
	background: "var(--color-popover)",
	border: "1px solid var(--color-border)",
	borderRadius: 14,
	boxShadow: "var(--shadow-elevated)",
	padding: "10px 14px",
	fontSize: 12,
	color: "var(--color-foreground)"
};
var DATE_TYPE_OPTIONS = {
	"Rentals Statement": [{
		label: "Agreement Start Date",
		value: "start"
	}, {
		label: "Agreement End Date",
		value: "end"
	}],
	"Exchanges Statement": [{
		label: "Exchange Date",
		value: "exchangeDate"
	}],
	"Customers Statement": [{
		label: "All Records (No Date)",
		value: "none"
	}],
	"Equipment Statement": [{
		label: "Purchase Date",
		value: "purchaseDate"
	}],
	"Payments Statement": [{
		label: "Payment Date",
		value: "date"
	}],
	"Rent Dues Statement": [{
		label: "Agreement Start Date",
		value: "start"
	}],
	"Return Statement": [{
		label: "Return Date",
		value: "date"
	}],
	"Owner Statement": [{
		label: "Agreement Date",
		value: "start"
	}, {
		label: "Return Date",
		value: "returnDate"
	}]
};
var getPresetDates = (preset) => {
	const today = /* @__PURE__ */ new Date();
	let start = "";
	let end = "";
	switch (preset) {
		case "this-month": {
			const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
			const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
			start = getLocalYYYYMMDD(firstDay);
			end = getLocalYYYYMMDD(lastDay);
			break;
		}
		case "last-month": {
			const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
			const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
			start = getLocalYYYYMMDD(firstDay);
			end = getLocalYYYYMMDD(lastDay);
			break;
		}
		case "this-quarter": {
			const quarter = Math.floor(today.getMonth() / 3);
			const firstDay = new Date(today.getFullYear(), quarter * 3, 1);
			const lastDay = new Date(today.getFullYear(), (quarter + 1) * 3, 0);
			start = getLocalYYYYMMDD(firstDay);
			end = getLocalYYYYMMDD(lastDay);
			break;
		}
		case "last-30-days":
			start = getLocalYYYYMMDD(/* @__PURE__ */ new Date(today.getTime() - 720 * 60 * 60 * 1e3));
			end = getLocalYYYYMMDD(today);
			break;
		case "last-90-days":
			start = getLocalYYYYMMDD(/* @__PURE__ */ new Date(today.getTime() - 2160 * 60 * 60 * 1e3));
			end = getLocalYYYYMMDD(today);
			break;
		case "this-fy": {
			const currentYear = today.getFullYear();
			if (today.getMonth() >= 3) {
				start = `${currentYear}-04-01`;
				end = `${currentYear + 1}-03-31`;
			} else {
				start = `${currentYear - 1}-04-01`;
				end = `${currentYear}-03-31`;
			}
			break;
		}
		default:
			start = "";
			end = "";
			break;
	}
	return {
		start,
		end
	};
};
var isWithinDateRange = (dateStr, start, end) => {
	if (!dateStr || dateStr === "—") return false;
	let d;
	if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
		const [day, month, year] = dateStr.split("-").map(Number);
		d = new Date(year, month - 1, day);
	} else d = parseLocalDate(dateStr);
	if (isNaN(d.getTime())) return false;
	if (start) {
		const startDate = parseLocalDate(start);
		if (d < startDate) return false;
	}
	if (end) {
		const endDate = parseLocalDate(end);
		endDate.setDate(endDate.getDate() + 1);
		if (d >= endDate) return false;
	}
	return true;
};
function ReportsPage() {
	useDatabaseTrigger();
	const [activeStatement, setActiveStatement] = (0, import_react.useState)("Rentals Statement");
	const [dateType, setDateType] = (0, import_react.useState)("start");
	const [preset, setPreset] = (0, import_react.useState)("all");
	const [startDate, setStartDate] = (0, import_react.useState)("");
	const [endDate, setEndDate] = (0, import_react.useState)("");
	const [search, setSearch] = (0, import_react.useState)("");
	const [selectedOwnerFilter, setSelectedOwnerFilter] = (0, import_react.useState)("all-owners");
	const [selectedCategoryFilter, setSelectedCategoryFilter] = (0, import_react.useState)("all-categories");
	const getOwnerStatementRowCalc = (item) => {
		const eq = equipmentList.find((e) => e.id === item.equipmentId);
		const perDayAmount = eq ? eq.ownerDailyRate || 0 : 0;
		if (!item.start || item.start === "—") return {
			daysUsed: 0,
			perDayAmount,
			rowTotal: 0,
			dateTaken: "—",
			retDate: "—",
			periodSelected: "—"
		};
		const rentalStart = parseLocalDate(item.start);
		if (isNaN(rentalStart.getTime())) return {
			daysUsed: 0,
			perDayAmount,
			rowTotal: 0,
			dateTaken: "—",
			retDate: "—",
			periodSelected: "—"
		};
		const isReturned = item.returnDate && item.returnDate !== "—";
		const rentalEnd = isReturned ? parseLocalDate(item.returnDate) : /* @__PURE__ */ new Date();
		const periodStart = startDate ? parseLocalDate(startDate) : null;
		const periodEnd = endDate ? parseLocalDate(endDate) : null;
		const calcStart = periodStart && rentalStart < periodStart ? periodStart : rentalStart;
		let rawCalcEnd = rentalEnd;
		if (!isReturned && periodEnd) {
			const today = /* @__PURE__ */ new Date();
			rawCalcEnd = periodEnd < today ? periodEnd : today;
		}
		const calcEnd = periodEnd && rawCalcEnd > periodEnd ? periodEnd : rawCalcEnd;
		const dStart = new Date(calcStart.getFullYear(), calcStart.getMonth(), calcStart.getDate());
		const dEnd = new Date(calcEnd.getFullYear(), calcEnd.getMonth(), calcEnd.getDate());
		let daysUsed = 0;
		if (dStart <= dEnd) {
			const diffTime = dEnd.getTime() - dStart.getTime();
			daysUsed = Math.round(diffTime / (1e3 * 60 * 60 * 24));
			if (daysUsed === 0 && dStart.getTime() === dEnd.getTime()) daysUsed = 1;
			else if (daysUsed < 0) daysUsed = 0;
		}
		const dateTaken = formatDateDDMMYYYY(item.start);
		const retDate = isReturned ? formatDateDDMMYYYY(item.returnDate) : "Not return";
		const startStr = formatDateDDMMYYYY(getLocalYYYYMMDD(dStart));
		let endStr = "Not return";
		if (isReturned) {
			endStr = formatDateDDMMYYYY(item.returnDate);
			if (periodEnd && parseLocalDate(item.returnDate) > periodEnd) endStr = formatDateDDMMYYYY(getLocalYYYYMMDD(dEnd));
		} else if (periodEnd) if (periodEnd < /* @__PURE__ */ new Date()) endStr = formatDateDDMMYYYY(getLocalYYYYMMDD(dEnd));
		else endStr = "Not return";
		const periodSelected = `${startStr} To ${endStr}`;
		const rowTotal = daysUsed * perDayAmount;
		return {
			daysUsed,
			perDayAmount,
			rowTotal,
			dateTaken,
			retDate,
			periodSelected
		};
	};
	const viewerRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		const options = DATE_TYPE_OPTIONS[activeStatement];
		if (options && options.length > 0) setDateType(options[0].value);
		else setDateType("none");
		setSelectedOwnerFilter("all-owners");
		setSelectedCategoryFilter("all-categories");
	}, [activeStatement]);
	const customersList = getCustomers();
	const rentalsList = getRentals();
	const paymentsList = getPayments();
	const equipmentList = getEquipment();
	const returnsList = getReturns();
	const exchangesList = getExchanges();
	const ownersList = getOwners();
	const dynamicTopCustomers = customersList.map((c) => {
		const rentalsCount = rentalsList.filter((r) => r.customerId === c.id).length;
		const revenueSum = paymentsList.filter((p) => p.customerId === c.id && p.status === "Paid").reduce((sum, p) => sum + p.amount, 0);
		return {
			id: c.id,
			name: c.name,
			rentals: rentalsCount,
			revenue: revenueSum,
			status: c.status
		};
	}).filter((c) => c.rentals > 0 || c.revenue > 0).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
	const ownerOptions = (0, import_react.useMemo)(() => {
		return Array.from(new Set(ownersList.map((o) => o.name).filter(Boolean)));
	}, [ownersList]);
	const categoryOptions = (0, import_react.useMemo)(() => {
		return Array.from(new Set(equipmentList.map((eq) => eq.category).filter(Boolean))).sort();
	}, [equipmentList]);
	const handlePresetChange = (val) => {
		setPreset(val);
		if (val !== "custom") {
			const { start, end } = getPresetDates(val);
			setStartDate(start);
			setEndDate(end);
		}
	};
	const filteredData = (0, import_react.useMemo)(() => {
		let list = [];
		switch (activeStatement) {
			case "Rentals Statement":
				list = rentalsList;
				break;
			case "Exchanges Statement":
				list = exchangesList;
				break;
			case "Customers Statement":
				list = customersList;
				break;
			case "Equipment Statement":
				list = equipmentList;
				break;
			case "Payments Statement":
				list = paymentsList;
				break;
			case "Rent Dues Statement":
				list = rentalsList.filter((r) => r.status !== "Completed" && r.status !== "Cancelled").map((r) => {
					const start = parseLocalDate(r.start);
					const monthlyRent = r.monthlyRent || 0;
					const dailyRate = r.dailyRent || 0;
					const isMonthly = monthlyRent > 0;
					const grandTotalPaid = paymentsList.filter((p) => p.agreement === r.id && p.status === "Paid" && (p.type === "Rent" || p.type === "Rent Payment")).reduce((sum, p) => sum + p.amount, 0) + (r.rentalPaymentStatus === "Paid" || r.rentalPaymentStatus === "Partial" ? Number(r.rentPaidAmount) || Number(r.totalRent) || Number(monthlyRent) || 0 : 0);
					const today = /* @__PURE__ */ new Date();
					today.setHours(0, 0, 0, 0);
					let totalDue = 0;
					if (!isNaN(start.getTime())) if (isMonthly) {
						let monthsElapsed = (today.getFullYear() - start.getFullYear()) * 12 + (today.getMonth() - start.getMonth());
						let daysExtra = today.getDate() - start.getDate();
						if (daysExtra < 0) {
							monthsElapsed = Math.max(0, monthsElapsed - 1);
							const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
							daysExtra += prevMonth.getDate();
						}
						totalDue = (daysExtra > 5 ? monthsElapsed + 1 : monthsElapsed) * monthlyRent;
					} else {
						const diffTime = Math.max(0, today.getTime() - start.getTime());
						totalDue = Math.ceil(diffTime / (1e3 * 60 * 60 * 24)) * dailyRate;
					}
					const remainingDue = Math.max(0, totalDue - grandTotalPaid);
					return {
						...r,
						grandTotalPaid,
						remainingDue,
						rentDisplay: isMonthly ? `₹${monthlyRent}/mo` : `₹${dailyRate}/day`
					};
				}).filter((item) => item.remainingDue > 0);
				break;
			case "Return Statement":
				list = returnsList;
				break;
			case "Owner Statement": {
				const rows = [];
				equipmentList.forEach((item) => {
					const itemRentals = rentalsList.filter((r) => {
						if (r.equipmentItems && r.equipmentItems.length > 0) return r.equipmentItems.some((ei) => ei.equipmentId === item.id);
						return (r.equipmentId || "").split(",").map((s) => s.trim()).filter(Boolean).includes(item.id);
					});
					itemRentals.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
					if (itemRentals.length === 0) {
						const ownerName = item.owner || "In-House";
						const serial = item.serial || "No Serial";
						const model = item.model || "Standard";
						const status = item.status === "UnderMaintenance" ? "Under Maintenance" : "IN";
						rows.push({
							owner: ownerName,
							serial,
							agreementId: "—",
							start: "—",
							returnDate: "—",
							model,
							customer: "—",
							givenAgainTo: "—",
							refund: "",
							pay: "",
							status,
							remarks: "Available in inventory",
							equipmentId: item.id,
							category: item.category
						});
					} else itemRentals.forEach((r, idx) => {
						const ownerName = item.owner || "In-House";
						const serial = item.serial || "No Serial";
						const model = item.model || "Standard";
						const agreementId = r.id;
						const agreementDate = r.start;
						const returnRecord = returnsList.find((ret) => ret.agreement === r.id && (ret.returnedEquipmentIds ? ret.returnedEquipmentIds.includes(item.id) : true));
						const returnDate = returnRecord ? returnRecord.date : r.status === "Completed" ? r.end || r.start : "—";
						let isItemReturned = false;
						if (r.equipmentItems && r.equipmentItems.length > 0) {
							const foundItem = r.equipmentItems.find((ei) => ei.equipmentId === item.id);
							if (foundItem) isItemReturned = foundItem.returned;
						} else isItemReturned = r.status === "Completed";
						const status = isItemReturned ? "IN" : "OUT";
						let givenAgainTo = "—";
						if (idx < itemRentals.length - 1) {
							const nextRental = itemRentals[idx + 1];
							givenAgainTo = `${nextRental.customer} & ${nextRental.id}`;
						}
						const refundVal = returnRecord ? returnRecord.refund : "";
						const totalRentPaid = paymentsList.filter((p) => p.agreement === r.id && p.status === "Paid" && (p.type === "Rent" || p.type === "Rent Payment")).reduce((sum, p) => sum + p.amount, 0);
						let rentPaidForItem = totalRentPaid;
						if (r.equipmentItems && r.equipmentItems.length > 1) {
							const itemMonthlyRent = r.equipmentItems.find((ei) => ei.equipmentId === item.id)?.monthlyRent || 0;
							const totalMonthlyRent = r.equipmentItems.reduce((sum, ei) => sum + (ei.monthlyRent || 0), 0);
							if (totalMonthlyRent > 0) rentPaidForItem = Math.round(totalRentPaid * (itemMonthlyRent / totalMonthlyRent));
						}
						const remarks = r.remarks || "";
						rows.push({
							owner: ownerName,
							serial,
							agreementId,
							start: agreementDate,
							returnDate,
							model,
							customer: r.customer,
							givenAgainTo,
							refund: refundVal,
							pay: rentPaidForItem,
							status,
							remarks,
							equipmentId: item.id,
							category: item.category
						});
					});
				});
				list = rows;
				break;
			}
			default: break;
		}
		let dateFiltered = list;
		if (dateType && dateType !== "none" && (startDate || endDate)) if (activeStatement === "Owner Statement") {
			const pStart = startDate ? parseLocalDate(startDate) : null;
			const pEnd = endDate ? parseLocalDate(endDate) : null;
			dateFiltered = list.filter((item) => {
				if (!item.start || item.start === "—") return false;
				const rStart = parseLocalDate(item.start);
				if (isNaN(rStart.getTime())) return false;
				const rEnd = item.returnDate && item.returnDate !== "—" ? parseLocalDate(item.returnDate) : /* @__PURE__ */ new Date();
				if (pEnd) {
					if (rStart > new Date(pEnd.getFullYear(), pEnd.getMonth(), pEnd.getDate(), 23, 59, 59)) return false;
				}
				if (pStart) {
					if (rEnd < new Date(pStart.getFullYear(), pStart.getMonth(), pStart.getDate(), 0, 0, 0)) return false;
				}
				return true;
			});
		} else dateFiltered = list.filter((item) => {
			let dateVal = item[dateType];
			return isWithinDateRange(dateVal, startDate, endDate);
		});
		if (activeStatement === "Owner Statement" && selectedOwnerFilter !== "all-owners") dateFiltered = dateFiltered.filter((item) => item.owner.toLowerCase() === selectedOwnerFilter.toLowerCase());
		if (activeStatement === "Owner Statement" && selectedCategoryFilter !== "all-categories") dateFiltered = dateFiltered.filter((item) => item.category && item.category.toLowerCase() === selectedCategoryFilter.toLowerCase());
		let queryFiltered = dateFiltered;
		if (search.trim()) {
			const q = search.toLowerCase();
			queryFiltered = dateFiltered.filter((item) => {
				return Object.entries(item).some(([key, val]) => {
					if (val === null || val === void 0) return false;
					if (typeof val === "object") return false;
					return String(val).toLowerCase().includes(q);
				});
			});
		}
		return queryFiltered;
	}, [
		activeStatement,
		dateType,
		startDate,
		endDate,
		search,
		selectedOwnerFilter,
		selectedCategoryFilter,
		paymentsList,
		rentalsList,
		exchangesList,
		customersList,
		equipmentList,
		returnsList
	]);
	const handleExportStatement = (format) => {
		if (filteredData.length === 0) {
			toast.info("No data available to export.");
			return;
		}
		if (activeStatement === "Owner Statement") {
			const ownerName = selectedOwnerFilter !== "all-owners" ? selectedOwnerFilter : "All Owners";
			const categories = Array.from(new Set(filteredData.map((d) => d.category).filter(Boolean)));
			const category = categories.length === 1 ? categories[0] : categories.length > 1 ? "Multiple Categories" : "—";
			const fromDate = startDate ? formatDateDDMMYYYY(startDate) : filteredData.length > 0 ? formatDateDDMMYYYY(filteredData.map((d) => d.start).sort()[0]) : "—";
			const toDate = endDate ? formatDateDDMMYYYY(endDate) : "Ongoing";
			let totalDays = 0;
			let grandTotal = 0;
			let totalPerDay = 0;
			let perDayCount = 0;
			const calculatedRows = filteredData.map((item, index) => {
				const calc = getOwnerStatementRowCalc(item);
				totalDays += calc.daysUsed;
				grandTotal += calc.rowTotal;
				totalPerDay += calc.perDayAmount;
				perDayCount++;
				return {
					srNo: index + 1,
					owner: item.owner || "—",
					category: item.category || "—",
					serial: item.serial || "—",
					dateTaken: calc.dateTaken,
					periodSelected: calc.periodSelected,
					retDate: calc.retDate,
					daysUsed: calc.daysUsed,
					perDayAmount: calc.perDayAmount,
					rowTotal: calc.rowTotal
				};
			});
			const avgPerDayRental = perDayCount > 0 ? Math.round(totalPerDay / perDayCount) : 100;
			if (format === "Excel" || format === "CSV") {
				const xlsName = `Owner_Wise_Monthly_Rental_Statement_${ownerName.replace(/\s+/g, "_")}.xls`;
				const htmlContent = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Sheet1</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
<meta charset="UTF-8">
<style>
  th { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-weight: bold; background-color: #3b82f6; color: #ffffff; border: 0.5pt solid #cbd5e1; text-align: left; padding: 8px; font-size: 10pt; }
  td { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; border: 0.5pt solid #cbd5e1; padding: 8px; font-size: 9.5pt; color: #334155; }
</style>
</head>
<body>
  <table>
    <tr>
      <td colspan="10" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 14pt; font-weight: bold; background-color: #e2efda; text-align: center; border: 0.5pt solid #cbd5e1; padding: 10px;">Owner Wise Monthly Rental Statement</td>
    </tr>
    <tr>
      <td style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 10pt; font-weight: bold; background-color: #f2f2f2; border: 0.5pt solid #cbd5e1; padding: 6px;">Owner</td>
      <td style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 10pt; border: 0.5pt solid #cbd5e1; padding: 6px;">${ownerName}</td>
      <td style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 10pt; font-weight: bold; background-color: #f2f2f2; border: 0.5pt solid #cbd5e1; padding: 6px;">Category</td>
      <td style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 10pt; border: 0.5pt solid #cbd5e1; padding: 6px;">${category}</td>
      <td style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 10pt; font-weight: bold; background-color: #f2f2f2; border: 0.5pt solid #cbd5e1; padding: 6px;">From Date</td>
      <td style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 10pt; border: 0.5pt solid #cbd5e1; padding: 6px;">${fromDate} To Date</td>
      <td style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 10pt; border: 0.5pt solid #cbd5e1; padding: 6px;">${toDate}</td>
      <td style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 10pt; font-weight: bold; background-color: #f2f2f2; border: 0.5pt solid #cbd5e1; padding: 6px;">Per Day Rental</td>
      <td style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 10pt; border: 0.5pt solid #cbd5e1; padding: 6px;" colspan="2">${avgPerDayRental}</td>
    </tr>
    <tr>
      <td colspan="4" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 9.5pt; color: #64748b; font-style: italic; border: 0.5pt solid #cbd5e1; padding: 6px;">Rental Asset Audit Ledger</td>
      <td colspan="6" style="border: 0.5pt solid #cbd5e1; padding: 6px;"></td>
    </tr>
    <tr><td colspan="10" style="border: none; height: 10px;"></td></tr>
    <thead>
      <tr>
        <th style="width: 50px;">Sr. No.</th>
        <th style="width: 120px;">Owner Name</th>
        <th style="width: 150px;">Category</th>
        <th style="width: 120px;">Machine / Serial No.</th>
        <th style="width: 100px;">Date Taken</th>
        <th style="width: 180px;">Period Selected</th>
        <th style="width: 100px;">Return Date</th>
        <th style="width: 80px; text-align: center;">Days Used</th>
        <th style="width: 100px; text-align: right;">Per Day Amount</th>
        <th style="width: 120px; text-align: right;">Total Amount</th>
      </tr>
    </thead>
    <tbody>
      ${calculatedRows.map((r) => `
          <tr>
            <td style="text-align: center; border: 0.5pt solid #cbd5e1;">${r.srNo}</td>
            <td style="border: 0.5pt solid #cbd5e1;">${r.owner}</td>
            <td style="border: 0.5pt solid #cbd5e1;">${r.category}</td>
            <td style="text-align: center; border: 0.5pt solid #cbd5e1;">${r.serial}</td>
            <td style="text-align: center; border: 0.5pt solid #cbd5e1;">${r.dateTaken}</td>
            <td style="text-align: center; border: 0.5pt solid #cbd5e1;">${r.periodSelected}</td>
            <td style="text-align: center; border: 0.5pt solid #cbd5e1;">${r.retDate}</td>
            <td style="text-align: center; border: 0.5pt solid #cbd5e1;">${r.daysUsed}</td>
            <td style="text-align: right; border: 0.5pt solid #cbd5e1;">${r.perDayAmount}</td>
            <td style="text-align: right; border: 0.5pt solid #cbd5e1; font-weight: bold;">${r.rowTotal}</td>
          </tr>
        `).join("")}
      <tr>
        <td colspan="6" style="border: none;"></td>
        <td style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-weight: bold; background-color: #f2f2f2; border: 0.5pt solid #cbd5e1; padding: 8px; font-size: 10pt; text-align: right;">Total Days</td>
        <td style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-weight: bold; border: 0.5pt solid #cbd5e1; padding: 8px; font-size: 10pt; text-align: center;">${totalDays}</td>
        <td style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-weight: bold; background-color: #f2f2f2; border: 0.5pt solid #cbd5e1; padding: 8px; font-size: 10pt; text-align: right;">Grand Total</td>
        <td style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-weight: bold; border: 0.5pt solid #cbd5e1; padding: 8px; font-size: 10pt; text-align: right; color: #1e3a8a;">Rs. ${grandTotal.toLocaleString("en-IN")}</td>
      </tr>
    </tbody>
  </table>
</body>
</html>`;
				const blob = new Blob([htmlContent], { type: "application/vnd.ms-excel;charset=utf-8;" });
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
				toast.success(`Owner Statement exported successfully.`);
			} else if (format === "PDF") {
				toast.info("Generating PDF statement print dialog...");
				const printWindow = window.open("", "_blank");
				if (!printWindow) {
					toast.error("Popup blocked! Please allow popups to print.");
					return;
				}
				const htmlContent = `
          <html>
          <head>
            <title>Owner Wise Monthly Rental Statement</title>
            <style>
              body { font-family: 'Segoe UI', system-ui, sans-serif; padding: 20px; color: #1e293b; }
              .header-title { font-size: 20px; font-weight: bold; color: #1e3a8a; text-align: center; padding: 15px; background-color: #f0fdf4; border: 1.5px solid #bbf7d0; border-radius: 8px; margin-bottom: 20px; }
              .meta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 25px; background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 13px; }
              .meta-item { display: flex; flex-direction: column; }
              .meta-label { font-weight: bold; color: #64748b; font-size: 11px; text-transform: uppercase; tracking-wider: 0.05em; }
              .meta-val { font-weight: 600; color: #0f172a; margin-top: 2px; }
              .data-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
              .data-table th { background-color: #3b82f6; color: white; padding: 10px 8px; font-size: 12px; font-weight: bold; border: 1px solid #cbd5e1; text-align: left; }
              .data-table td { padding: 10px 8px; font-size: 11.5px; border: 1px solid #e2e8f0; color: #334155; }
              .data-table tr:nth-child(even) { background-color: #f8fafc; }
              .totals-row { font-weight: bold; background-color: #f1f5f9 !important; }
              .totals-row td { border-top: 2px solid #94a3b8; font-size: 12.5px; color: #0f172a; }
              @media print {
                body { padding: 0; }
              }
            </style>
          </head>
          <body>
            <div class="header-title">Owner Wise Monthly Rental Statement</div>
            <div class="meta-grid">
              <div class="meta-item"><span class="meta-label">Owner</span><span class="meta-val">${ownerName}</span></div>
              <div class="meta-item"><span class="meta-label">Category</span><span class="meta-val">${category}</span></div>
              <div class="meta-item"><span class="meta-label">Period</span><span class="meta-val">${fromDate} To ${toDate}</span></div>
              <div class="meta-item"><span class="meta-label">Avg Per Day Rental</span><span class="meta-val">₹${avgPerDayRental}</span></div>
            </div>
            
            <table class="data-table">
              <thead>
                <tr>
                  <th style="width: 40px; text-align: center;">Sr. No.</th>
                  <th>Owner Name</th>
                  <th>Category</th>
                  <th style="text-align: center;">Machine / Serial No.</th>
                  <th style="text-align: center;">Date Taken</th>
                  <th>Period Selected</th>
                  <th style="text-align: center;">Return Date</th>
                  <th style="text-align: center; width: 70px;">Days Used</th>
                  <th style="text-align: right; width: 100px;">Per Day Amount</th>
                  <th style="text-align: right; width: 110px;">Total Amount</th>
                </tr>
              </thead>
              <tbody>
                ${calculatedRows.map((r) => `
          <tr>
            <td style="text-align: center;">${r.srNo}</td>
            <td>${r.owner}</td>
            <td>${r.category}</td>
            <td style="text-align: center;">${r.serial}</td>
            <td style="text-align: center;">${r.dateTaken}</td>
            <td style="text-align: center;">${r.periodSelected}</td>
            <td style="text-align: center;">${r.retDate}</td>
            <td style="text-align: center;">${r.daysUsed}</td>
            <td style="text-align: right;">₹${r.perDayAmount.toLocaleString("en-IN")}</td>
            <td style="text-align: right; font-weight: bold;">₹${r.rowTotal.toLocaleString("en-IN")}</td>
          </tr>
        `).join("")}
                <tr class="totals-row">
                  <td colspan="6" style="border: none; background: transparent;"></td>
                  <td style="text-align: right;">Total Days:</td>
                  <td style="text-align: center;">${totalDays}</td>
                  <td style="text-align: right;">Grand Total:</td>
                  <td style="text-align: right;">₹${grandTotal.toLocaleString("en-IN")}</td>
                </tr>
              </tbody>
            </table>
            
            <script>
              window.onload = function() {
                window.print();
                window.onafterprint = function() { window.close(); };
              }
            <\/script>
          </body>
          </html>
        `;
				printWindow.document.write(htmlContent);
				printWindow.document.close();
			}
			return;
		}
		let headers = [];
		let rows = [];
		let title = activeStatement.replace(/\s+/g, "_");
		switch (activeStatement) {
			case "Rentals Statement":
				headers = [
					"Agreement ID",
					"Customer Name",
					"Equipment",
					"Serial",
					"Start Date",
					"End Date",
					"Monthly Rent",
					"Deposit",
					"Status"
				];
				rows = filteredData.map((r) => [
					r.id,
					r.customer,
					r.equipment,
					r.serial,
					formatDateDDMMYYYY(r.start),
					formatDateDDMMYYYY(r.end),
					r.monthlyRent.toString(),
					r.deposit.toString(),
					r.status
				]);
				break;
			case "Exchanges Statement":
				headers = [
					"Exchange ID",
					"Date",
					"Customer Name",
					"Agreement ID",
					"Old Equipment",
					"Old Serial",
					"New Equipment",
					"New Serial",
					"Reason"
				];
				rows = filteredData.map((e) => [
					e.id,
					formatDateDDMMYYYY(e.exchangeDate || e.date),
					e.customer,
					e.agreementId,
					e.currentEquipment,
					e.currentEquipmentSerial,
					e.newEquipment,
					e.newEquipmentSerial,
					e.reason || ""
				]);
				break;
			case "Customers Statement":
				headers = [
					"Customer ID",
					"Name",
					"Phone",
					"Email",
					"Status",
					"Active Rentals",
					"City",
					"State"
				];
				rows = filteredData.map((c) => [
					c.id,
					c.name,
					c.phone,
					c.email || "",
					c.status,
					(c.rentals || 0).toString(),
					c.city,
					c.state
				]);
				break;
			case "Equipment Statement":
				headers = [
					"Equipment ID",
					"Category",
					"Serial",
					"Model",
					"Manufacturer",
					"Owner",
					"Status",
					"Purchase Date",
					"Daily Rate to Owner"
				];
				rows = filteredData.map((e) => [
					e.id,
					e.category,
					e.serial,
					e.model,
					e.manufacturer,
					e.owner,
					e.status,
					formatDateDDMMYYYY(e.purchaseDate),
					(e.ownerDailyRate || 0).toString()
				]);
				break;
			case "Payments Statement":
				headers = [
					"Payment ID",
					"Date",
					"Customer Name",
					"Agreement ID",
					"Amount",
					"Type",
					"Mode",
					"Reference",
					"Status"
				];
				rows = filteredData.map((p) => [
					p.id,
					formatDateDDMMYYYY(p.date),
					p.customer,
					p.agreement,
					p.amount.toString(),
					p.type,
					p.mode,
					p.txRef || "",
					p.status
				]);
				break;
			case "Rent Dues Statement":
				headers = [
					"Agreement ID",
					"Customer Name",
					"Equipment",
					"Start Date",
					"Rent Rate",
					"Total Paid",
					"Remaining Due",
					"Status"
				];
				rows = filteredData.map((r) => [
					r.id,
					r.customer,
					r.equipment,
					formatDateDDMMYYYY(r.start),
					r.rentDisplay,
					r.grandTotalPaid.toString(),
					r.remainingDue.toString(),
					r.status
				]);
				break;
			case "Return Statement":
				headers = [
					"Return ID",
					"Return Date",
					"Agreement ID",
					"Customer Name",
					"Returned Equipment",
					"Condition",
					"Deposit Refunded",
					"Damage Charges",
					"Final Rent",
					"Net Refund"
				];
				rows = filteredData.map((ret) => [
					ret.id,
					formatDateDDMMYYYY(ret.date),
					ret.agreement,
					ret.customer,
					ret.equipment,
					ret.condition,
					(ret.deposit || 0).toString(),
					(ret.damageCharges || 0).toString(),
					(ret.finalRent || 0).toString(),
					(ret.refund || 0).toString()
				]);
				break;
			case "Owner Statement":
				headers = [
					"Owner",
					"M/c Sl.No",
					"Agreement ID",
					"Agreement Date",
					"Return Date",
					"Model",
					"Customer Name",
					"Given Again To",
					"Refund",
					"Pay",
					"Status",
					"Remarks"
				];
				rows = filteredData.map((item) => [
					item.owner,
					item.serial,
					item.agreementId,
					formatDateDDMMYYYY(item.start),
					formatDateDDMMYYYY(item.returnDate),
					item.model,
					item.customer,
					item.givenAgainTo,
					item.refund !== "" ? item.refund.toString() : "",
					item.pay !== "" ? item.pay.toString() : "",
					item.status,
					item.remarks || ""
				]);
				break;
			default:
				toast.error("Invalid statement type.");
				return;
		}
		if (format === "Excel" || format === "CSV") {
			downloadExcel(`${title}_Export`, headers, rows);
			toast.success(`${activeStatement} exported successfully.`);
		} else if (format === "PDF") {
			toast.info("Generating PDF statement print dialog...");
			const printWindow = window.open("", "_blank");
			if (!printWindow) {
				toast.error("Popup blocked! Please allow popups to print.");
				return;
			}
			const rowsHtml = rows.map((r) => `
        <tr>
          ${r.map((cell) => `<td>${cell || "—"}</td>`).join("")}
        </tr>
      `).join("");
			const headersHtml = headers.map((h) => `<th>${h}</th>`).join("");
			const htmlContent = `
        <html>
        <head>
          <title>${activeStatement}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 25px; color: #1e293b; }
            .header { margin-bottom: 25px; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; }
            .header h1 { margin: 0; font-size: 20px; color: #0f172a; }
            .header p { margin: 5px 0 0 0; font-size: 13px; color: #64748b; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 10px; }
            th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
            th { background-color: #f1f5f9; font-weight: bold; color: #334155; text-transform: uppercase; font-size: 8.5px; }
            tr:nth-child(even) { background-color: #f8fafc; }
            .footer { margin-top: 40px; font-size: 10px; text-align: center; color: #94a3b8; }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${activeStatement}</h1>
            <p>Generated on ${(/* @__PURE__ */ new Date()).toLocaleDateString("en-IN")} ${startDate || endDate ? `· Filtered: ${formatDateDDMMYYYY(startDate)} to ${formatDateDDMMYYYY(endDate)}` : ""}</p>
          </div>
          <table>
            <thead>
              <tr>${headersHtml}</tr>
            </thead>
            <tbody>
              ${rowsHtml || "<tr><td colspan=\"" + headers.length + "\" style=\"text-align:center;\">No records.</td></tr>"}
            </tbody>
          </table>
          <div class="footer">
            Relife ERP System · Statements
          </div>
          <script>
            window.addEventListener('DOMContentLoaded', () => {
              setTimeout(() => { window.print(); }, 500);
            });
          <\/script>
        </body>
        </html>
      `;
			printWindow.document.write(htmlContent);
			printWindow.document.close();
		}
	};
	const handleCardClick = (title) => {
		setActiveStatement(title);
		setTimeout(() => {
			viewerRef.current?.scrollIntoView({ behavior: "smooth" });
		}, 100);
	};
	const renderTableHeader = () => {
		switch (activeStatement) {
			case "Rentals Statement": return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Agreement ID" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Customer Name" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Equipment" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Serial" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Start Date" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "End Date" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
					className: "text-right",
					children: "Monthly Rent"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
					className: "text-right",
					children: "Deposit"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Status" })
			] });
			case "Exchanges Statement": return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Exchange ID" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Date" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Customer Name" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Agreement ID" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Old Equipment" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Old Serial" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "New Equipment" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "New Serial" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Reason" })
			] });
			case "Customers Statement": return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Customer ID" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Name" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Phone" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Email" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Status" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
					className: "text-center",
					children: "Active Rentals"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "City" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "State" })
			] });
			case "Equipment Statement": return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Equipment ID" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Category" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Serial" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Model" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Manufacturer" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Owner" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Status" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Purchase Date" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
					className: "text-right",
					children: "Daily Rate to Owner"
				})
			] });
			case "Payments Statement": return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Payment ID" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Date" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Customer" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Agreement" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
					className: "text-right",
					children: "Amount"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Type" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Mode" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Reference" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Status" })
			] });
			case "Rent Dues Statement": return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Agreement ID" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Customer Name" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Equipment" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Start Date" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
					className: "text-right",
					children: "Rent Rate"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
					className: "text-right",
					children: "Total Paid"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
					className: "text-right text-destructive",
					children: "Remaining Due"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Status" })
			] });
			case "Return Statement": return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Return ID" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Return Date" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Agreement ID" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Customer Name" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Returned Equipment" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Condition" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
					className: "text-right",
					children: "Deposit"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
					className: "text-right",
					children: "Damage Charges"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
					className: "text-right",
					children: "Final Rent"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
					className: "text-right",
					children: "Net Refund"
				})
			] });
			case "Owner Statement": return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
					className: "w-12 text-center",
					children: "Sr. No."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Owner Name" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Category" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
					className: "text-center",
					children: "Machine / Serial No."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
					className: "text-center",
					children: "Date Taken"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Period Selected" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
					className: "text-center",
					children: "Return Date"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
					className: "text-center",
					children: "Days Used"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
					className: "text-right",
					children: "Per Day Amount"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
					className: "text-right",
					children: "Total Amount"
				})
			] });
			default: return null;
		}
	};
	const renderTableRows = (data) => {
		if (data.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableRow, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
			colSpan: activeStatement === "Owner Statement" ? 10 : activeStatement === "Exchanges Statement" ? 9 : 8,
			className: "py-12 text-center text-[13px] text-muted-foreground",
			children: "No matching statement records found."
		}) });
		const rows = data.map((item, index) => {
			switch (activeStatement) {
				case "Rentals Statement": return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
						className: "font-mono font-bold text-primary",
						children: item.id
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
						className: "font-semibold",
						children: item.customer
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: item.equipment }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
						className: "font-mono",
						children: item.serial
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: formatDateDDMMYYYY(item.start) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: formatDateDDMMYYYY(item.end) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, {
						className: "text-right font-semibold",
						children: [
							"₹",
							item.monthlyRent?.toLocaleString("en-IN"),
							"/mo"
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, {
						className: "text-right",
						children: ["₹", item.deposit?.toLocaleString("en-IN")]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: `inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold border ${item.status === "Active" ? "bg-success/10 text-success border-success/20" : item.status === "Overdue" ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-muted text-muted-foreground border-border/50"}`,
						children: item.status
					}) })
				] }, item.id || index);
				case "Exchanges Statement": return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
						className: "font-mono font-bold text-primary",
						children: item.id
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: formatDateDDMMYYYY(item.exchangeDate || item.date) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
						className: "font-semibold",
						children: item.customer
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
						className: "font-mono",
						children: item.agreementId
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: item.currentEquipment }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
						className: "font-mono text-muted-foreground",
						children: item.currentEquipmentSerial
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: item.newEquipment }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
						className: "font-mono font-semibold",
						children: item.newEquipmentSerial
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: item.reason || "—" })
				] }, item.id || index);
				case "Customers Statement": return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
						className: "font-mono text-muted-foreground",
						children: item.id
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
						className: "font-semibold",
						children: item.name
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: item.phone }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: item.email || "—" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: `inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold border ${item.status === "Active" ? "bg-success/10 text-success border-success/20" : item.status === "Overdue" ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-muted text-muted-foreground border-border/50"}`,
						children: item.status
					}) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
						className: "text-center",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "inline-flex h-5 w-5 items-center justify-center rounded-md bg-primary/10 text-primary text-[11px] font-bold",
							children: item.rentals || 0
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: item.city }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: item.state })
				] }, item.id || index);
				case "Equipment Statement": return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
						className: "font-mono text-muted-foreground",
						children: item.id
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
						className: "font-semibold",
						children: item.category
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
						className: "font-mono font-bold",
						children: item.serial
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: item.model }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: item.manufacturer }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: item.owner }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: `inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold border ${item.status === "Available" ? "bg-success/10 text-success border-success/20" : item.status === "Rented" ? "bg-primary/10 text-primary border-primary/20" : "bg-warning/10 text-warning-foreground border-warning/20"}`,
						children: item.status
					}) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: formatDateDDMMYYYY(item.purchaseDate) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, {
						className: "text-right",
						children: ["₹", (item.ownerDailyRate || 0).toLocaleString("en-IN")]
					})
				] }, item.id || index);
				case "Payments Statement": return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
						className: "font-mono font-bold text-primary",
						children: item.id
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: formatDateDDMMYYYY(item.date) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
						className: "font-semibold",
						children: item.customer
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
						className: "font-mono",
						children: item.agreement
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, {
						className: "text-right font-semibold",
						children: ["₹", item.amount?.toLocaleString("en-IN")]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: item.type }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: item.mode }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
						className: "font-mono text-muted-foreground",
						children: item.txRef || "—"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: `inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold border ${item.status === "Paid" ? "bg-success/10 text-success border-success/20" : "bg-destructive/10 text-destructive border-destructive/20"}`,
						children: item.status
					}) })
				] }, item.id || index);
				case "Rent Dues Statement": return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
						className: "font-mono font-bold text-primary",
						children: item.id
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
						className: "font-semibold",
						children: item.customer
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: item.equipment }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: formatDateDDMMYYYY(item.start) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
						className: "text-right",
						children: item.rentDisplay
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, {
						className: "text-right",
						children: ["₹", item.grandTotalPaid?.toLocaleString("en-IN")]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, {
						className: "text-right font-bold text-destructive",
						children: ["₹", item.remainingDue?.toLocaleString("en-IN")]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: `inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold border ${item.status === "Overdue" ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-primary/10 text-primary border-primary/20"}`,
						children: item.status
					}) })
				] }, item.id || index);
				case "Return Statement": return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
						className: "font-mono font-bold text-primary",
						children: item.id
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: formatDateDDMMYYYY(item.date) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
						className: "font-mono",
						children: item.agreement
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
						className: "font-semibold",
						children: item.customer
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: item.equipment }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: item.condition }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, {
						className: "text-right",
						children: ["₹", item.deposit?.toLocaleString("en-IN")]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, {
						className: "text-right text-destructive",
						children: ["₹", item.damageCharges?.toLocaleString("en-IN")]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, {
						className: "text-right",
						children: ["₹", item.finalRent?.toLocaleString("en-IN")]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, {
						className: "text-right font-bold text-success",
						children: ["₹", item.refund?.toLocaleString("en-IN")]
					})
				] }, item.id || index);
				case "Owner Statement": {
					const calc = getOwnerStatementRowCalc(item);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
							className: "text-center font-medium text-muted-foreground",
							children: index + 1
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
							className: "font-semibold text-slate-800",
							children: item.owner || "—"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: item.category || "—" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
							className: "text-center font-mono font-semibold",
							children: item.serial || "—"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
							className: "text-center font-mono text-muted-foreground",
							children: calc.dateTaken
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
							className: "text-[12px]",
							children: calc.periodSelected
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
							className: "text-center font-mono",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: calc.retDate === "Not return" ? "text-destructive font-semibold" : "text-slate-600",
								children: calc.retDate
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
							className: "text-center font-semibold",
							children: calc.daysUsed
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, {
							className: "text-right font-medium",
							children: ["₹", calc.perDayAmount.toLocaleString("en-IN")]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, {
							className: "text-right font-bold text-slate-900",
							children: ["₹", calc.rowTotal.toLocaleString("en-IN")]
						})
					] }, index);
				}
				default: return null;
			}
		});
		if (activeStatement === "Owner Statement") {
			let totalDays = 0;
			let grandTotal = 0;
			data.forEach((item) => {
				const calc = getOwnerStatementRowCalc(item);
				totalDays += calc.daysUsed;
				grandTotal += calc.rowTotal;
			});
			rows.push(/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, {
				className: "font-bold bg-muted/15 border-t-2 border-slate-200",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
						colSpan: 6,
						className: "border-none bg-transparent"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
						className: "text-right font-bold text-slate-700",
						children: "Total Days:"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
						className: "text-center font-bold text-slate-950",
						children: totalDays
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
						className: "text-right font-bold text-slate-700",
						children: "Grand Total:"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, {
						className: "text-right font-bold text-primary",
						children: ["₹", grandTotal.toLocaleString("en-IN")]
					})
				]
			}, "totals-summary"));
		}
		return rows;
	};
	const getFYList = () => {
		const list = [];
		const today = /* @__PURE__ */ new Date();
		let currentStartYear = today.getFullYear();
		if (today.getMonth() < 3) currentStartYear--;
		for (let i = 0; i < 4; i++) {
			const startYear = currentStartYear - i;
			const endYearSuffix = String(startYear + 1).slice(-2);
			list.push({
				value: `fy${String(startYear).slice(-2)}-${endYearSuffix}`,
				label: `FY 20${String(startYear).slice(-2)} - ${endYearSuffix}`,
				startYear,
				endYear: startYear + 1
			});
		}
		return list;
	};
	const fyList = getFYList();
	const [selectedFY, setSelectedFY] = (0, import_react.useState)(() => fyList[0].value);
	const dynamicRevenueData = [
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
	].map((month, idx) => {
		const activeFY = fyList.find((f) => f.value === selectedFY) || fyList[0];
		const paymentYear = idx < 3 ? activeFY.endYear : activeFY.startYear;
		return {
			month,
			current: paymentsList.filter((p) => {
				if (p.status !== "Paid") return false;
				try {
					const pDate = parseLocalDate(p.date);
					if (!isNaN(pDate.getTime())) return pDate.getMonth() === idx && pDate.getFullYear() === paymentYear;
				} catch {}
				return false;
			}).reduce((sum, p) => sum + p.amount, 0)
		};
	});
	const categories = Array.from(new Set([...[
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
	], ...equipmentList.map((e) => e.category)]));
	const dynamicUtilizationData = categories.map((cat) => {
		const catEquip = equipmentList.filter((e) => e.category.toLowerCase() === cat.toLowerCase());
		if (catEquip.length === 0) return {
			name: cat,
			value: 0
		};
		const total = catEquip.length;
		const rented = catEquip.filter((e) => e.status === "Rented" || e.status === "Active").length;
		return {
			name: cat,
			value: Math.round(rented / total * 100)
		};
	});
	const totalRented = equipmentList.filter((e) => e.status === "Rented" || e.status === "Active").length;
	const dynamicEquipmentMix = categories.map((cat) => {
		return {
			name: cat,
			value: equipmentList.filter((e) => e.category.toLowerCase() === cat.toLowerCase() && (totalRented > 0 ? e.status === "Rented" || e.status === "Active" : true)).length
		};
	}).sort((a, b) => b.value - a.value);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "Statements & Analytics",
		subtitle: "Filter, view, and export business statements",
		actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				variant: "outline",
				size: "sm",
				onClick: () => handleExportStatement("PDF"),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "mr-1.5 h-3.5 w-3.5" }), "PDF"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				variant: "outline",
				size: "sm",
				onClick: () => handleExportStatement("Excel"),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileSpreadsheet, { className: "mr-1.5 h-3.5 w-3.5" }), "Excel"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				size: "sm",
				onClick: () => handleExportStatement("CSV"),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "mr-1.5 h-3.5 w-3.5" }), "Export CSV"]
			})
		] }),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-5 lg:grid-cols-3 mb-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
					className: "lg:col-span-2 overflow-hidden",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, {
						className: "border-b border-border/60 pb-3 mb-0",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Annual Revenue Report" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-0.5 text-[12px] text-muted-foreground",
								children: [fyList.find((f) => f.value === selectedFY)?.label || "FY Monthly", " monthly performance"]
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex flex-wrap items-center gap-2",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
									value: selectedFY,
									onValueChange: setSelectedFY,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
										className: "h-8 w-[140px] text-[12px]",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Select Year" })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: fyList.map((fy) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: fy.value,
										children: fy.label
									}, fy.value)) })]
								})
							})]
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
						className: "pt-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
							width: "100%",
							height: 300,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AreaChart, {
								data: dynamicRevenueData,
								margin: {
									left: -10,
									right: 10,
									top: 10
								},
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("defs", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("linearGradient", {
										id: "rev",
										x1: "0",
										y1: "0",
										x2: "0",
										y2: "1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
											offset: "0%",
											stopColor: "var(--color-primary)",
											stopOpacity: .35
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
											offset: "100%",
											stopColor: "var(--color-primary)",
											stopOpacity: 0
										})]
									}) }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
										strokeDasharray: "3 3",
										stroke: "var(--color-border)",
										vertical: false,
										opacity: .6
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
										dataKey: "month",
										fontSize: 11,
										stroke: "var(--color-muted-foreground)",
										tickLine: false,
										axisLine: false
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
										fontSize: 11,
										stroke: "var(--color-muted-foreground)",
										tickLine: false,
										axisLine: false,
										tickFormatter: (v) => `₹${(v / 1e3).toFixed(0)}k`
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, {
										contentStyle: tooltipStyle,
										formatter: (v) => [`₹${v.toLocaleString("en-IN")}`, "Revenue"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Area, {
										type: "monotone",
										dataKey: "current",
										stroke: "var(--color-primary)",
										strokeWidth: 2.5,
										fill: "url(#rev)"
									})
								]
							})
						})
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
					className: "overflow-hidden",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, {
						className: "border-b border-border/60 pb-3 mb-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Equipment Mix" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-0.5 text-[12px] text-muted-foreground",
							children: "Rental share by category"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
						className: "pt-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
							width: "100%",
							height: 300,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PieChart, { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pie, {
									data: dynamicEquipmentMix.slice(0, 5),
									dataKey: "value",
									nameKey: "name",
									innerRadius: 58,
									outerRadius: 90,
									paddingAngle: 3,
									strokeWidth: 0,
									children: dynamicEquipmentMix.slice(0, 5).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cell, { fill: CHART_COLORS[i % CHART_COLORS.length] }, i))
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, { contentStyle: tooltipStyle }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Legend, { wrapperStyle: {
									fontSize: 11,
									paddingTop: 8
								} })
							] })
						})
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-5 lg:grid-cols-3 mb-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
					className: "lg:col-span-2 overflow-hidden",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, {
						className: "border-b border-border/60 pb-3 mb-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Equipment Utilization by Category" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-0.5 text-[12px] text-muted-foreground",
							children: "Live utilization rates across all equipment types"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
						className: "pt-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
							width: "100%",
							height: 300,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(BarChart, {
								data: dynamicUtilizationData,
								barCategoryGap: "35%",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
										strokeDasharray: "3 3",
										stroke: "var(--color-border)",
										vertical: false,
										opacity: .6
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
										dataKey: "name",
										fontSize: 11,
										stroke: "var(--color-muted-foreground)",
										tickLine: false,
										axisLine: false,
										interval: 0,
										angle: -12,
										textAnchor: "end",
										height: 56
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
										fontSize: 11,
										stroke: "var(--color-muted-foreground)",
										tickLine: false,
										axisLine: false,
										unit: "%"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, {
										contentStyle: tooltipStyle,
										formatter: (v) => [`${v}%`, "Utilization"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
										dataKey: "value",
										fill: "var(--color-primary)",
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
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
					className: "overflow-hidden flex flex-col justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, {
						className: "border-b border-border/60 bg-muted/20 px-5 py-4 flex flex-row items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "metric-icon h-9 w-9 shrink-0 bg-accent/10 text-accent border-accent/20",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UsersRound, { className: "h-4.5 w-4.5" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Top Customers" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[12px] text-muted-foreground mt-0.5",
							children: "Highest billing accounts"
						})] })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
						className: "p-0 flex-grow",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
								className: "pl-5",
								children: "Customer"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
								className: "text-center",
								children: "Rentals"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
								className: "text-right pr-5",
								children: "Revenue"
							})
						] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableBody, { children: [dynamicTopCustomers.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableRow, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
							colSpan: 3,
							className: "py-12 text-center text-[13px] text-muted-foreground",
							children: "No billing history found."
						}) }), dynamicTopCustomers.map((cust) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, {
							className: "group",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
									className: "pl-5",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-semibold text-[13px] truncate",
										children: cust.name
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[10px] font-mono text-muted-foreground",
										children: cust.id
									})] })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
									className: "text-center",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "inline-flex h-5 w-5 items-center justify-center rounded-md bg-primary/10 text-primary text-[11px] font-bold",
										children: cust.rentals
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, {
									className: "text-right pr-5 font-semibold text-[13px] text-success",
									children: ["₹", cust.revenue.toLocaleString("en-IN")]
								})
							]
						}, cust.id))] })] })
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 mb-6",
				children: reportCards.map((r, i) => {
					const isActive = activeStatement === r.title;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
						className: `group cursor-pointer hover:border-primary/40 hover:shadow-[var(--shadow-elevated)] transition-all duration-200 ${isActive ? "border-primary ring-2 ring-primary/10 shadow-md" : ""}`,
						onClick: () => handleCardClick(r.title),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
							className: "flex items-center gap-3 p-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: `metric-icon h-9 w-9 shrink-0 border border-transparent ${r.color}`,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(r.icon, { className: "h-4.5 w-4.5" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex-1 min-w-0",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-semibold text-[13px] truncate",
										children: r.title
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[10.5px] text-muted-foreground truncate mt-0.5",
										children: r.desc
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									variant: isActive ? "default" : "ghost",
									size: "sm",
									className: "shrink-0 text-[11px] font-semibold transition-colors gap-0.5 h-7 px-1.5",
									children: [isActive ? "Viewing" : "View", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpRight, { className: "h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" })]
								})
							]
						})
					}, r.title);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				ref: viewerRef,
				className: "scroll-mt-6",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
					className: "overflow-hidden border border-border/80 shadow-soft",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, {
						className: "border-b border-border bg-muted/15 px-5 py-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-4 md:flex-row md:items-center md:justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardTitle, {
								className: "flex items-center gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "inline-block h-2 w-2 rounded-full bg-primary" }),
									activeStatement,
									" Viewer"
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-[12px] text-muted-foreground mt-0.5",
								children: [
									"Showing ",
									filteredData.length,
									" records matching filters"
								]
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap items-center gap-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "relative min-w-[150px] flex-1 sm:flex-initial",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											placeholder: "Search statement records...",
											value: search,
											onChange: (e) => setSearch(e.target.value),
											className: "h-8.5 text-[12px] px-3 py-1 bg-background"
										})
									}),
									activeStatement === "Owner Statement" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
										value: selectedOwnerFilter,
										onValueChange: setSelectedOwnerFilter,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
											className: "h-8.5 w-[150px] text-[12px] bg-background",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "All Owners" })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: "all-owners",
											children: "All Owners"
										}), ownerOptions.map((name) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: name,
											children: name
										}, name))] })]
									}),
									activeStatement === "Owner Statement" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
										value: selectedCategoryFilter,
										onValueChange: setSelectedCategoryFilter,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
											className: "h-8.5 w-[160px] text-[12px] bg-background",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "All Categories" })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, {
											className: "border border-border/60 bg-popover shadow-elevated rounded-lg",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: "all-categories",
												className: "text-[12px] cursor-pointer",
												children: "All Categories"
											}), categoryOptions.map((cat) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: cat,
												className: "text-[12px] cursor-pointer",
												children: cat
											}, cat))]
										})]
									}),
									DATE_TYPE_OPTIONS[activeStatement] && DATE_TYPE_OPTIONS[activeStatement][0].value !== "none" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
										value: dateType,
										onValueChange: setDateType,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
											className: "h-8.5 w-[150px] text-[12px] bg-background",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Date Type" })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: DATE_TYPE_OPTIONS[activeStatement].map((opt) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: opt.value,
											children: opt.label
										}, opt.value)) })]
									}),
									dateType !== "none" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
										value: preset,
										onValueChange: handlePresetChange,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
											className: "h-8.5 w-[140px] text-[12px] bg-background",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Date Filter" })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: "all",
												children: "All Time"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: "this-month",
												children: "This Month"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: "last-month",
												children: "Last Month"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: "this-quarter",
												children: "This Quarter"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: "last-30-days",
												children: "Last 30 Days"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: "last-90-days",
												children: "Last 90 Days"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: "this-fy",
												children: "This Financial Year"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: "custom",
												children: "Custom Range"
											})
										] })]
									}),
									dateType !== "none" && (preset !== "all" || startDate || endDate) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-1.5 rounded-lg border border-border bg-background p-1 h-8.5 shrink-0",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												type: "date",
												value: startDate,
												onChange: (e) => {
													setStartDate(e.target.value);
													setPreset("custom");
												},
												className: "h-6.5 w-[130px] text-[11px] px-1.5 py-0 border-transparent bg-transparent shadow-none focus-visible:ring-0 cursor-pointer"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-[9px] text-muted-foreground font-bold px-0.5 shrink-0",
												children: "TO"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												type: "date",
												value: endDate,
												onChange: (e) => {
													setEndDate(e.target.value);
													setPreset("custom");
												},
												className: "h-6.5 w-[130px] text-[11px] px-1.5 py-0 border-transparent bg-transparent shadow-none focus-visible:ring-0 cursor-pointer"
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-1.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											variant: "outline",
											size: "sm",
											className: "h-8.5 text-[11.5px]",
											onClick: () => handleExportStatement("PDF"),
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "mr-1 h-3.5 w-3.5" }), " PDF"]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											variant: "outline",
											size: "sm",
											className: "h-8.5 text-[11.5px]",
											onClick: () => handleExportStatement("Excel"),
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileSpreadsheet, { className: "mr-1 h-3.5 w-3.5" }), " Excel"]
										})]
									})
								]
							})]
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
						className: "p-0 overflow-x-auto max-h-[500px] overflow-y-auto",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, {
							className: "bg-muted/10 sticky top-0 z-10",
							children: renderTableHeader()
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableBody, { children: renderTableRows(filteredData) })] })
					})]
				})
			})
		]
	});
}
//#endregion
export { ReportsPage as component };
