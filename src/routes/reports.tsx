import { createFileRoute } from "@tanstack/react-router";
import { AppShell, StatusBadge } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { useState, useEffect, useMemo, useRef } from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer,
  Tooltip, XAxis, YAxis, PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  Download, FileSpreadsheet, FileText, FileType2, TrendingUp,
  ArrowUpRight, BarChart3, Users2, Building2, Package, Banknote,
  RefreshCw, AlertTriangle
} from "lucide-react";

import {
  getCustomers,
  getRentals,
  getPayments,
  getEquipment,
  downloadExcel,
  getReturns,
  getOwners,
  getExchanges,
  formatDateDDMMYYYY,
  useDatabaseTrigger,
  getLocalYYYYMMDD,
  parseLocalDate,
} from "@/lib/data-store";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Statements & Analytics — Relife" }] }),
  component: ReportsPage,
});

const CHART_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

const reportCards = [
  { title: "Rentals Statement", desc: "Detailed log of all rental agreement contracts", icon: FileText, color: "text-primary bg-primary/10 border-primary/20" },
  { title: "Exchanges Statement", desc: "Log of equipment exchange history", icon: RefreshCw, color: "text-warning-foreground bg-warning/10 border-warning/20" },
  { title: "Customers Statement", desc: "Customer profiles, details, and active statuses", icon: Users2, color: "text-accent bg-accent/10 border-accent/20" },
  { title: "Equipment Statement", desc: "Complete inventory listing and status statement", icon: Package, color: "text-primary bg-primary/10 border-primary/20" },
  { title: "Payments Statement", desc: "Payments received, transaction modes and status", icon: Banknote, color: "text-success bg-success/10 border-success/20" },
  { title: "Rent Dues Statement", desc: "Overdue rentals, unpaid balances and aging", icon: AlertTriangle, color: "text-destructive bg-destructive/10 border-destructive/20" },
  { title: "Return Statement", desc: "Returned equipment, damage charges and refunds", icon: FileType2, color: "text-warning-foreground bg-warning/10 border-warning/20" },
  { title: "Owner Statement", desc: "Owner-wise equipment counts and revenue shares", icon: Building2, color: "text-accent bg-accent/10 border-accent/20" },
];

const tooltipStyle = {
  background: "var(--color-popover)",
  border: "1px solid var(--color-border)",
  borderRadius: 14,
  boxShadow: "var(--shadow-elevated)",
  padding: "10px 14px",
  fontSize: 12,
  color: "var(--color-foreground)",
};

const DATE_TYPE_OPTIONS: Record<string, { label: string, value: string }[]> = {
  "Rentals Statement": [
    { label: "Agreement Start Date", value: "start" },
    { label: "Agreement End Date", value: "end" }
  ],
  "Exchanges Statement": [
    { label: "Exchange Date", value: "exchangeDate" }
  ],
  "Customers Statement": [
    { label: "All Records (No Date)", value: "none" }
  ],
  "Equipment Statement": [
    { label: "Purchase Date", value: "purchaseDate" }
  ],
  "Payments Statement": [
    { label: "Payment Date", value: "date" }
  ],
  "Rent Dues Statement": [
    { label: "Agreement Start Date", value: "start" }
  ],
  "Return Statement": [
    { label: "Return Date", value: "date" }
  ],
  "Owner Statement": [
    { label: "Agreement Date", value: "start" },
    { label: "Return Date", value: "returnDate" }
  ]
};

const getPresetDates = (preset: string) => {
  const today = new Date();
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
    case "last-30-days": {
      const priorDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      start = getLocalYYYYMMDD(priorDate);
      end = getLocalYYYYMMDD(today);
      break;
    }
    case "last-90-days": {
      const priorDate = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
      start = getLocalYYYYMMDD(priorDate);
      end = getLocalYYYYMMDD(today);
      break;
    }
    case "this-fy": {
      const currentYear = today.getFullYear();
      if (today.getMonth() >= 3) { // April to Dec
        start = `${currentYear}-04-01`;
        end = `${currentYear + 1}-03-31`;
      } else { // Jan to March
        start = `${currentYear - 1}-04-01`;
        end = `${currentYear}-03-31`;
      }
      break;
    }
    case "all-time":
    default:
      start = "";
      end = "";
      break;
  }
  return { start, end };
};

const isWithinDateRange = (dateStr: string | undefined | null, start: string, end: string) => {
  if (!dateStr || dateStr === "—") return false;
  let d: Date;
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
    const [day, month, year] = dateStr.split("-").map(Number);
    d = new Date(year, month - 1, day);
  } else {
    d = parseLocalDate(dateStr);
  }
  if (isNaN(d.getTime())) return false;
  
  if (start) {
    const startDate = parseLocalDate(start);
    if (d < startDate) return false;
  }
  if (end) {
    const endDate = parseLocalDate(end);
    // Add 1 day to endDate so it's inclusive of the end date
    endDate.setDate(endDate.getDate() + 1);
    if (d >= endDate) return false;
  }
  return true;
};

function ReportsPage() {
  const dbVersion = useDatabaseTrigger();
  const [activeStatement, setActiveStatement] = useState<string>("Rentals Statement");
  const [dateType, setDateType] = useState<string>("start");
  const [preset, setPreset] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [selectedOwnerFilter, setSelectedOwnerFilter] = useState<string>("all-owners");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all-categories");
  
  const getOwnerStatementRowCalc = (item: any) => {
    const eq = equipmentList.find(e => e.id === item.equipmentId);
    const perDayAmount = eq ? (eq.ownerDailyRate || 0) : 0;

    if (!item.start || item.start === "—") {
      return {
        daysUsed: 0,
        perDayAmount,
        rowTotal: 0,
        dateTaken: "—",
        retDate: "—",
        periodSelected: "—"
      };
    }

    const rentalStart = parseLocalDate(item.start);
    if (isNaN(rentalStart.getTime())) {
      return {
        daysUsed: 0,
        perDayAmount,
        rowTotal: 0,
        dateTaken: "—",
        retDate: "—",
        periodSelected: "—"
      };
    }

    const isReturned = item.returnDate && item.returnDate !== "—";
    const rentalEnd = isReturned ? parseLocalDate(item.returnDate) : new Date();

    const periodStart = startDate ? parseLocalDate(startDate) : null;
    const periodEnd = endDate ? parseLocalDate(endDate) : null;

    const calcStart = (periodStart && rentalStart < periodStart) ? periodStart : rentalStart;
    
    let rawCalcEnd = rentalEnd;
    if (!isReturned && periodEnd) {
      const today = new Date();
      rawCalcEnd = periodEnd < today ? periodEnd : today;
    }
    const calcEnd = (periodEnd && rawCalcEnd > periodEnd) ? periodEnd : rawCalcEnd;

    const dStart = new Date(calcStart.getFullYear(), calcStart.getMonth(), calcStart.getDate());
    const dEnd = new Date(calcEnd.getFullYear(), calcEnd.getMonth(), calcEnd.getDate());

    let daysUsed = 0;
    if (dStart <= dEnd) {
      const diffTime = dEnd.getTime() - dStart.getTime();
      daysUsed = Math.round(diffTime / (1000 * 60 * 60 * 24));
      if (daysUsed === 0 && dStart.getTime() === dEnd.getTime()) {
        daysUsed = 1;
      } else if (daysUsed < 0) {
        daysUsed = 0;
      }
    }

    const dateTaken = formatDateDDMMYYYY(item.start);
    const retDate = isReturned ? formatDateDDMMYYYY(item.returnDate) : "Not return";

    const startStr = formatDateDDMMYYYY(getLocalYYYYMMDD(dStart));
    
    let endStr = "Not return";
    if (isReturned) {
      endStr = formatDateDDMMYYYY(item.returnDate);
      if (periodEnd && parseLocalDate(item.returnDate) > periodEnd) {
        endStr = formatDateDDMMYYYY(getLocalYYYYMMDD(dEnd));
      }
    } else {
      if (periodEnd) {
        const today = new Date();
        if (periodEnd < today) {
          endStr = formatDateDDMMYYYY(getLocalYYYYMMDD(dEnd));
        } else {
          endStr = "Not return";
        }
      }
    }

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

  const calculateDaysUsed = (itemStart: string, itemReturnDate: string) => {
    return getOwnerStatementRowCalc({ start: itemStart, returnDate: itemReturnDate }).daysUsed;
  };
  
  const viewerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const options = DATE_TYPE_OPTIONS[activeStatement];
    if (options && options.length > 0) {
      setDateType(options[0].value);
    } else {
      setDateType("none");
    }
    setSelectedOwnerFilter("all-owners");
    setSelectedCategoryFilter("all-categories");
  }, [activeStatement]);

  // PERF FIX: these were bare getX() calls in the render body, so every
  // re-render (every keystroke in search/date filters, every db-updated
  // event) re-ran getRentals()/getCustomers()'s repair + Sheets-sync passes
  // for all 7 datasets. Memoize on dbVersion like the other list pages do.
  const customersList = useMemo(() => getCustomers(), [dbVersion]);
  const rentalsList = useMemo(() => getRentals(), [dbVersion]);
  const paymentsList = useMemo(() => getPayments(), [dbVersion]);
  const equipmentList = useMemo(() => getEquipment(), [dbVersion]);
  const returnsList = useMemo(() => getReturns(), [dbVersion]);
  const exchangesList = useMemo(() => getExchanges(), [dbVersion]);
  const ownersList = useMemo(() => getOwners(), [dbVersion]);

  // Dynamic Top Customers calculation from actual database records
  const dynamicTopCustomers = customersList
    .map((c) => {
      const rentalsCount = rentalsList.filter((r) => r.customerId === c.id).length;
      const revenueSum = paymentsList
        .filter((p) => p.customerId === c.id && p.status === "Paid")
        .reduce((sum, p) => sum + p.amount, 0);
      return {
        id: c.id,
        name: c.name,
        rentals: rentalsCount,
        revenue: revenueSum,
        status: c.status,
      };
    })
    .filter((c) => c.rentals > 0 || c.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const ownerOptions = useMemo(() => {
    return Array.from(new Set(ownersList.map(o => o.name).filter(Boolean)));
  }, [ownersList]);

  const categoryOptions = useMemo(() => {
    return Array.from(new Set(equipmentList.map(eq => eq.category).filter(Boolean))).sort();
  }, [equipmentList]);

  const handlePresetChange = (val: string) => {
    setPreset(val);
    if (val !== "custom") {
      const { start, end } = getPresetDates(val);
      setStartDate(start);
      setEndDate(end);
    }
  };

  const filteredData = useMemo(() => {
    let list: any[] = [];
    
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
      case "Rent Dues Statement": {
        const activeRentals = rentalsList.filter(r => r.status !== "Completed" && r.status !== "Cancelled");
        list = activeRentals.map(r => {
          const start = parseLocalDate(r.start);
          const monthlyRent = r.monthlyRent || 0;
          const dailyRate = r.dailyRent || 0;
          const isMonthly = monthlyRent > 0;
          
          const paidPayments = paymentsList.filter(
            (p) => p.agreement === r.id && p.status === "Paid" && (p.type === "Rent" || p.type === "Rent Payment")
          );
          const totalPaid = paidPayments.reduce((sum, p) => sum + p.amount, 0);
          const initialPaid = (r.rentalPaymentStatus === "Paid" || r.rentalPaymentStatus === "Partial") 
            ? (Number(r.rentPaidAmount) || Number(r.totalRent) || Number(monthlyRent) || 0) 
            : 0;
          const grandTotalPaid = totalPaid + initialPaid;
          
          const today = new Date();
          today.setHours(0,0,0,0);
          
          let totalDue = 0;
          if (!isNaN(start.getTime())) {
            if (isMonthly) {
              let monthsElapsed = (today.getFullYear() - start.getFullYear()) * 12 + (today.getMonth() - start.getMonth());
              let daysExtra = today.getDate() - start.getDate();
              if (daysExtra < 0) {
                monthsElapsed = Math.max(0, monthsElapsed - 1);
                const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
                daysExtra += prevMonth.getDate();
              }
              const totalMonthsCharged = daysExtra > 5 ? (monthsElapsed + 1) : monthsElapsed;
              totalDue = totalMonthsCharged * monthlyRent;
            } else {
              const diffTime = Math.max(0, today.getTime() - start.getTime());
              const daysElapsed = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              totalDue = daysElapsed * dailyRate;
            }
          }
          const remainingDue = Math.max(0, totalDue - grandTotalPaid);
          return {
            ...r,
            grandTotalPaid,
            remainingDue,
            rentDisplay: isMonthly ? `₹${monthlyRent}/mo` : `₹${dailyRate}/day`,
          };
        }).filter(item => item.remainingDue > 0);
        break;
      }
      case "Return Statement":
        list = returnsList;
        break;
      case "Owner Statement": {
        const rows: any[] = [];
        equipmentList.forEach(item => {
          const itemRentals = rentalsList.filter((r: any) => {
            if (r.equipmentItems && r.equipmentItems.length > 0) {
              return r.equipmentItems.some((ei: any) => ei.equipmentId === item.id);
            }
            const ids = (r.equipmentId || "").split(",").map((s: string) => s.trim()).filter(Boolean);
            return ids.includes(item.id);
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
          } else {
            itemRentals.forEach((r, idx) => {
              const ownerName = item.owner || "In-House";
              const serial = item.serial || "No Serial";
              const model = item.model || "Standard";
              const agreementId = r.id;
              const agreementDate = r.start;
              
              const returnRecord = returnsList.find(ret => 
                ret.agreement === r.id && 
                (ret.returnedEquipmentIds ? ret.returnedEquipmentIds.includes(item.id) : true)
              );
              
              const returnDate = returnRecord ? returnRecord.date : (r.status === "Completed" ? (r.end || r.start) : "—");
              
              let isItemReturned = false;
              if (r.equipmentItems && r.equipmentItems.length > 0) {
                const foundItem = r.equipmentItems.find((ei: any) => ei.equipmentId === item.id);
                if (foundItem) {
                  isItemReturned = foundItem.returned;
                }
              } else {
                isItemReturned = r.status === "Completed";
              }
              
              const status = isItemReturned ? "IN" : "OUT";
              
              let givenAgainTo = "—";
              if (idx < itemRentals.length - 1) {
                const nextRental = itemRentals[idx + 1];
                givenAgainTo = `${nextRental.customer} & ${nextRental.id}`;
              }
              
              const refundVal = returnRecord ? returnRecord.refund : "";
              
              const paymentsForAgreement = paymentsList.filter(p => p.agreement === r.id && p.status === "Paid" && (p.type === "Rent" || p.type === "Rent Payment"));
              const totalRentPaid = paymentsForAgreement.reduce((sum, p) => sum + p.amount, 0);
              
              let rentPaidForItem = totalRentPaid;
              if (r.equipmentItems && r.equipmentItems.length > 1) {
                const itemMonthlyRent = r.equipmentItems.find((ei: any) => ei.equipmentId === item.id)?.monthlyRent || 0;
                const totalMonthlyRent = r.equipmentItems.reduce((sum: number, ei: any) => sum + (ei.monthlyRent || 0), 0);
                if (totalMonthlyRent > 0) {
                  rentPaidForItem = Math.round(totalRentPaid * (itemMonthlyRent / totalMonthlyRent));
                }
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
          }
        });
        list = rows;
        break;
      }
      default:
        break;
    }

    // Date filtering
    let dateFiltered = list;
    if (dateType && dateType !== "none" && (startDate || endDate)) {
      if (activeStatement === "Owner Statement") {
        const pStart = startDate ? parseLocalDate(startDate) : null;
        const pEnd = endDate ? parseLocalDate(endDate) : null;

        dateFiltered = list.filter(item => {
          if (!item.start || item.start === "—") {
            return false;
          }
          const rStart = parseLocalDate(item.start);
          if (isNaN(rStart.getTime())) return false;
          
          const isReturned = item.returnDate && item.returnDate !== "—";
          const rEnd = isReturned ? parseLocalDate(item.returnDate) : new Date();

          if (pEnd) {
            const pEndCap = new Date(pEnd.getFullYear(), pEnd.getMonth(), pEnd.getDate(), 23, 59, 59);
            if (rStart > pEndCap) return false;
          }
          if (pStart) {
            const pStartCap = new Date(pStart.getFullYear(), pStart.getMonth(), pStart.getDate(), 0, 0, 0);
            if (rEnd < pStartCap) return false;
          }
          return true;
        });
      } else {
        dateFiltered = list.filter(item => {
          let dateVal = item[dateType];
          return isWithinDateRange(dateVal, startDate, endDate);
        });
      }
    }

    // Owner filtering (specific to Owner Statement)
    if (activeStatement === "Owner Statement" && selectedOwnerFilter !== "all-owners") {
      dateFiltered = dateFiltered.filter(item => item.owner.toLowerCase() === selectedOwnerFilter.toLowerCase());
    }

    // Category filtering (specific to Owner Statement)
    if (activeStatement === "Owner Statement" && selectedCategoryFilter !== "all-categories") {
      dateFiltered = dateFiltered.filter(item => item.category && item.category.toLowerCase() === selectedCategoryFilter.toLowerCase());
    }

    // Search query filtering
    let queryFiltered = dateFiltered;
    if (search.trim()) {
      const q = search.toLowerCase();
      queryFiltered = dateFiltered.filter(item => {
        return Object.entries(item).some(([key, val]) => {
          if (val === null || val === undefined) return false;
          if (typeof val === "object") return false;
          return String(val).toLowerCase().includes(q);
        });
      });
    }

    return queryFiltered;
  }, [activeStatement, dateType, startDate, endDate, search, selectedOwnerFilter, selectedCategoryFilter, paymentsList, rentalsList, exchangesList, customersList, equipmentList, returnsList]);

  const handleExportStatement = (format: "Excel" | "PDF" | "CSV") => {
    if (filteredData.length === 0) {
      toast.info("No data available to export.");
      return;
    }

    if (activeStatement === "Owner Statement") {
      const ownerName = selectedOwnerFilter !== "all-owners" ? selectedOwnerFilter : "All Owners";
      const categories = Array.from(new Set(filteredData.map(d => d.category).filter(Boolean)));
      const category = categories.length === 1 ? categories[0] : (categories.length > 1 ? "Multiple Categories" : "—");
      const fromDate = startDate ? formatDateDDMMYYYY(startDate) : (filteredData.length > 0 ? formatDateDDMMYYYY(filteredData.map(d => d.start).sort()[0]) : "—");
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
          model: item.model || "—",
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
        // Generate styled Excel statement file
        const xlsName = `Owner_Wise_Monthly_Rental_Statement_${ownerName.replace(/\s+/g, "_")}.xls`;
        
        const dataRowsHtml = calculatedRows.map(r => `
          <tr>
            <td style="text-align: center; border: 0.5pt solid #cbd5e1;">${r.srNo}</td>
            <td style="border: 0.5pt solid #cbd5e1;">${r.owner}</td>
            <td style="border: 0.5pt solid #cbd5e1;">${r.category}</td>
            <td style="text-align: center; border: 0.5pt solid #cbd5e1;">${r.model && r.model !== "Standard" && r.model !== "—" ? `${r.model} - ` : ""}${r.serial}</td>
            <td style="text-align: center; border: 0.5pt solid #cbd5e1;">${r.dateTaken}</td>
            <td style="text-align: center; border: 0.5pt solid #cbd5e1;">${r.periodSelected}</td>
            <td style="text-align: center; border: 0.5pt solid #cbd5e1;">${r.retDate}</td>
            <td style="text-align: center; border: 0.5pt solid #cbd5e1;">${r.daysUsed}</td>
            <td style="text-align: right; border: 0.5pt solid #cbd5e1;">${r.perDayAmount}</td>
            <td style="text-align: right; border: 0.5pt solid #cbd5e1; font-weight: bold;">${r.rowTotal}</td>
          </tr>
        `).join("");

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
      ${dataRowsHtml}
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
        setTimeout(() => { URL.revokeObjectURL(url); }, 100);
        toast.success(`Owner Statement exported successfully.`);
      } else if (format === "PDF") {
        toast.info("Generating PDF statement print dialog...");
        const printWindow = window.open("", "_blank");
        if (!printWindow) {
          toast.error("Popup blocked! Please allow popups to print.");
          return;
        }

        const tableRowsHtml = calculatedRows.map(r => `
          <tr>
            <td style="text-align: center;">${r.srNo}</td>
            <td>${r.owner}</td>
            <td>${r.category}</td>
            <td style="text-align: center;">${r.model && r.model !== "Standard" && r.model !== "—" ? `<div style="font-size: 8.5px; color: #64748b; line-height: 1; margin-bottom: 2px;">${r.model}</div>` : ""}<span style="font-family: monospace; font-size: 11px; font-weight: bold;">${r.serial}</span></td>
            <td style="text-align: center;">${r.dateTaken}</td>
            <td style="text-align: center;">${r.periodSelected}</td>
            <td style="text-align: center;">${r.retDate}</td>
            <td style="text-align: center;">${r.daysUsed}</td>
            <td style="text-align: right;">₹${r.perDayAmount.toLocaleString("en-IN")}</td>
            <td style="text-align: right; font-weight: bold;">₹${r.rowTotal.toLocaleString("en-IN")}</td>
          </tr>
        `).join("");

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
                ${tableRowsHtml}
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
            </script>
          </body>
          </html>
        `;
        printWindow.document.write(htmlContent);
        printWindow.document.close();
      }
      return;
    }

    let headers: string[] = [];
    let rows: string[][] = [];
    let title = activeStatement.replace(/\s+/g, "_");

    switch (activeStatement) {
      case "Rentals Statement":
        headers = ["Agreement ID", "Customer Name", "Equipment", "Serial", "Start Date", "End Date", "Monthly Rent", "Deposit", "Status"];
        rows = filteredData.map(r => [
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
        headers = ["Exchange ID", "Date", "Customer Name", "Agreement ID", "Old Equipment", "Old Serial", "New Equipment", "New Serial", "Reason"];
        rows = filteredData.map(e => [
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
        headers = ["Customer ID", "Name", "Phone", "Email", "Status", "Active Rentals", "City", "State"];
        rows = filteredData.map(c => [
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
        headers = ["Equipment ID", "Category", "Serial", "Model", "Manufacturer", "Owner", "Status", "Purchase Date", "Daily Rate to Owner"];
        rows = filteredData.map(e => [
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
        headers = ["Payment ID", "Date", "Customer Name", "Agreement ID", "Amount", "Type", "Mode", "Reference", "Status"];
        rows = filteredData.map(p => [
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
        headers = ["Agreement ID", "Customer Name", "Equipment", "Start Date", "Rent Rate", "Total Paid", "Remaining Due", "Status"];
        rows = filteredData.map(r => [
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
        headers = ["Return ID", "Return Date", "Agreement ID", "Customer Name", "Returned Equipment", "Condition", "Deposit Refunded", "Damage Charges", "Final Rent", "Net Refund"];
        rows = filteredData.map(ret => [
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
        headers = ["Owner", "M/c Sl.No", "Agreement ID", "Agreement Date", "Return Date", "Model", "Customer Name", "Given Again To", "Refund", "Pay", "Status", "Remarks"];
        rows = filteredData.map(item => [
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
      
      const rowsHtml = rows.map(r => `
        <tr>
          ${r.map(cell => `<td>${cell || "—"}</td>`).join("")}
        </tr>
      `).join("");

      const headersHtml = headers.map(h => `<th>${h}</th>`).join("");

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
            <p>Generated on ${new Date().toLocaleDateString("en-IN")} ${startDate || endDate ? `· Filtered: ${formatDateDDMMYYYY(startDate)} to ${formatDateDDMMYYYY(endDate)}` : ''}</p>
          </div>
          <table>
            <thead>
              <tr>${headersHtml}</tr>
            </thead>
            <tbody>
              ${rowsHtml || '<tr><td colspan="' + headers.length + '" style="text-align:center;">No records.</td></tr>'}
            </tbody>
          </table>
          <div class="footer">
            Relife ERP System · Statements
          </div>
          <script>
            window.addEventListener('DOMContentLoaded', () => {
              setTimeout(() => { window.print(); }, 500);
            });
          </script>
        </body>
        </html>
      `;
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    }
  };

  const handleCardClick = (title: string) => {
    setActiveStatement(title);
    setTimeout(() => {
      viewerRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const renderTableHeader = () => {
    switch (activeStatement) {
      case "Rentals Statement":
        return (
          <TableRow>
            <TableHead className="sticky left-0 z-20 bg-muted">Agreement ID</TableHead>
            <TableHead>Customer Name</TableHead>
            <TableHead>Equipment</TableHead>
            <TableHead>Serial</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead className="text-right">Monthly Rent</TableHead>
            <TableHead className="text-right">Deposit</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        );
      case "Exchanges Statement":
        return (
          <TableRow>
            <TableHead className="sticky left-0 z-20 bg-muted">Exchange ID</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Customer Name</TableHead>
            <TableHead>Agreement ID</TableHead>
            <TableHead>Old Equipment</TableHead>
            <TableHead>Old Serial</TableHead>
            <TableHead>New Equipment</TableHead>
            <TableHead>New Serial</TableHead>
            <TableHead>Reason</TableHead>
          </TableRow>
        );
      case "Customers Statement":
        return (
          <TableRow>
            <TableHead className="sticky left-0 z-20 bg-muted">Customer ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-center">Active Rentals</TableHead>
            <TableHead>City</TableHead>
            <TableHead>State</TableHead>
          </TableRow>
        );
      case "Equipment Statement":
        return (
          <TableRow>
            <TableHead className="sticky left-0 z-20 bg-muted">Equipment ID</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Serial</TableHead>
            <TableHead>Model</TableHead>
            <TableHead>Manufacturer</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Purchase Date</TableHead>
            <TableHead className="text-right">Daily Rate to Owner</TableHead>
          </TableRow>
        );
      case "Payments Statement":
        return (
          <TableRow>
            <TableHead className="sticky left-0 z-20 bg-muted">Payment ID</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Agreement</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Mode</TableHead>
            <TableHead>Reference</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        );
      case "Rent Dues Statement":
        return (
          <TableRow>
            <TableHead className="sticky left-0 z-20 bg-muted">Agreement ID</TableHead>
            <TableHead>Customer Name</TableHead>
            <TableHead>Equipment</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead className="text-right">Rent Rate</TableHead>
            <TableHead className="text-right">Total Paid</TableHead>
            <TableHead className="text-right text-destructive">Remaining Due</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        );
      case "Return Statement":
        return (
          <TableRow>
            <TableHead className="sticky left-0 z-20 bg-muted">Return ID</TableHead>
            <TableHead>Return Date</TableHead>
            <TableHead>Agreement ID</TableHead>
            <TableHead>Customer Name</TableHead>
            <TableHead>Returned Equipment</TableHead>
            <TableHead>Condition</TableHead>
            <TableHead className="text-right">Deposit</TableHead>
            <TableHead className="text-right">Damage Charges</TableHead>
            <TableHead className="text-right">Final Rent</TableHead>
            <TableHead className="text-right">Net Refund</TableHead>
          </TableRow>
        );
      case "Owner Statement":
        return (
          <TableRow>
            <TableHead className="w-12 text-center sticky left-0 z-20 bg-muted">Sr. No.</TableHead>
            <TableHead>Owner Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-center">Machine / Serial No.</TableHead>
            <TableHead className="text-center">Date Taken</TableHead>
            <TableHead>Period Selected</TableHead>
            <TableHead className="text-center">Return Date</TableHead>
            <TableHead className="text-center">Days Used</TableHead>
            <TableHead className="text-right">Per Day Amount</TableHead>
            <TableHead className="text-right">Total Amount</TableHead>
          </TableRow>
        );
      default:
        return null;
    }
  };

  const renderTableRows = (data: any[]) => {
    if (data.length === 0) {
      const colCount = activeStatement === "Owner Statement" ? 10 : activeStatement === "Exchanges Statement" ? 9 : 8;
      return (
        <TableRow>
          <TableCell colSpan={colCount} className="py-12 text-center text-[13px] text-muted-foreground">
            No matching statement records found.
          </TableCell>
        </TableRow>
      );
    }

    const rows = data.map((item, index) => {
      switch (activeStatement) {
        case "Rentals Statement":
          return (
            <TableRow key={item.id || index}>
              <TableCell className="sticky left-0 z-10 bg-card group-hover/row:bg-muted/50 font-mono font-bold text-primary">{item.id}</TableCell>
              <TableCell className="font-semibold">{item.customer}</TableCell>
              <TableCell>{item.equipment}</TableCell>
              <TableCell className="font-mono">{item.serial}</TableCell>
              <TableCell>{formatDateDDMMYYYY(item.start)}</TableCell>
              <TableCell>{formatDateDDMMYYYY(item.end)}</TableCell>
              <TableCell className="text-right font-semibold">₹{item.monthlyRent?.toLocaleString("en-IN")}/mo</TableCell>
              <TableCell className="text-right">₹{item.deposit?.toLocaleString("en-IN")}</TableCell>
              <TableCell>
                <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold border ${
                  item.status === "Active" ? "bg-success/10 text-success border-success/20" :
                  item.status === "Overdue" ? "bg-destructive/10 text-destructive border-destructive/20" :
                  "bg-muted text-muted-foreground border-border/50"
                }`}>
                  {item.status}
                </span>
              </TableCell>
            </TableRow>
          );
        case "Exchanges Statement":
          return (
            <TableRow key={item.id || index}>
              <TableCell className="sticky left-0 z-10 bg-card group-hover/row:bg-muted/50 font-mono font-bold text-primary">{item.id}</TableCell>
              <TableCell>{formatDateDDMMYYYY(item.exchangeDate || item.date)}</TableCell>
              <TableCell className="font-semibold">{item.customer}</TableCell>
              <TableCell className="font-mono">{item.agreementId}</TableCell>
              <TableCell>{item.currentEquipment}</TableCell>
              <TableCell className="font-mono text-muted-foreground">{item.currentEquipmentSerial}</TableCell>
              <TableCell>{item.newEquipment}</TableCell>
              <TableCell className="font-mono font-semibold">{item.newEquipmentSerial}</TableCell>
              <TableCell>{item.reason || "—"}</TableCell>
            </TableRow>
          );
        case "Customers Statement":
          return (
            <TableRow key={item.id || index}>
              <TableCell className="sticky left-0 z-10 bg-card group-hover/row:bg-muted/50 font-mono text-muted-foreground">{item.id}</TableCell>
              <TableCell className="font-semibold">{item.name}</TableCell>
              <TableCell>{item.phone}</TableCell>
              <TableCell>{item.email || "—"}</TableCell>
              <TableCell>
                <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold border ${
                  item.status === "Active" ? "bg-success/10 text-success border-success/20" :
                  item.status === "Overdue" ? "bg-destructive/10 text-destructive border-destructive/20" :
                  "bg-muted text-muted-foreground border-border/50"
                }`}>
                  {item.status}
                </span>
              </TableCell>
              <TableCell className="text-center">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-primary/10 text-primary text-[11px] font-bold">
                  {item.rentals || 0}
                </span>
              </TableCell>
              <TableCell>{item.city}</TableCell>
              <TableCell>{item.state}</TableCell>
            </TableRow>
          );
        case "Equipment Statement":
          return (
            <TableRow key={item.id || index}>
              <TableCell className="sticky left-0 z-10 bg-card group-hover/row:bg-muted/50 font-mono text-muted-foreground">{item.id}</TableCell>
              <TableCell className="font-semibold">{item.category}</TableCell>
              <TableCell className="font-mono font-bold">{item.serial}</TableCell>
              <TableCell>{item.model}</TableCell>
              <TableCell>{item.manufacturer}</TableCell>
              <TableCell>{item.owner}</TableCell>
              <TableCell>
                <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold border ${
                  item.status === "Available" ? "bg-success/10 text-success border-success/20" :
                  item.status === "Rented" ? "bg-primary/10 text-primary border-primary/20" :
                  "bg-warning/10 text-warning-foreground border-warning/20"
                }`}>
                  {item.status}
                </span>
              </TableCell>
              <TableCell>{formatDateDDMMYYYY(item.purchaseDate)}</TableCell>
              <TableCell className="text-right">₹{(item.ownerDailyRate || 0).toLocaleString("en-IN")}</TableCell>
            </TableRow>
          );
        case "Payments Statement":
          return (
            <TableRow key={item.id || index}>
              <TableCell className="sticky left-0 z-10 bg-card group-hover/row:bg-muted/50 font-mono font-bold text-primary">{item.id}</TableCell>
              <TableCell>{formatDateDDMMYYYY(item.date)}</TableCell>
              <TableCell className="font-semibold">{item.customer}</TableCell>
              <TableCell className="font-mono">{item.agreement}</TableCell>
              <TableCell className="text-right font-semibold">₹{item.amount?.toLocaleString("en-IN")}</TableCell>
              <TableCell>{item.type}</TableCell>
              <TableCell>{item.mode}</TableCell>
              <TableCell className="font-mono text-muted-foreground">{item.txRef || "—"}</TableCell>
              <TableCell>
                <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold border ${
                  item.status === "Paid" ? "bg-success/10 text-success border-success/20" :
                  "bg-destructive/10 text-destructive border-destructive/20"
                }`}>
                  {item.status}
                </span>
              </TableCell>
            </TableRow>
          );
        case "Rent Dues Statement":
          return (
            <TableRow key={item.id || index}>
              <TableCell className="sticky left-0 z-10 bg-card group-hover/row:bg-muted/50 font-mono font-bold text-primary">{item.id}</TableCell>
              <TableCell className="font-semibold">{item.customer}</TableCell>
              <TableCell>{item.equipment}</TableCell>
              <TableCell>{formatDateDDMMYYYY(item.start)}</TableCell>
              <TableCell className="text-right">{item.rentDisplay}</TableCell>
              <TableCell className="text-right">₹{item.grandTotalPaid?.toLocaleString("en-IN")}</TableCell>
              <TableCell className="text-right font-bold text-destructive">₹{item.remainingDue?.toLocaleString("en-IN")}</TableCell>
              <TableCell>
                <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold border ${
                  item.status === "Overdue" ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-primary/10 text-primary border-primary/20"
                }`}>
                  {item.status}
                </span>
              </TableCell>
            </TableRow>
          );
        case "Return Statement":
          return (
            <TableRow key={item.id || index}>
              <TableCell className="sticky left-0 z-10 bg-card group-hover/row:bg-muted/50 font-mono font-bold text-primary">{item.id}</TableCell>
              <TableCell>{formatDateDDMMYYYY(item.date)}</TableCell>
              <TableCell className="font-mono">{item.agreement}</TableCell>
              <TableCell className="font-semibold">{item.customer}</TableCell>
              <TableCell>{item.equipment}</TableCell>
              <TableCell>{item.condition}</TableCell>
              <TableCell className="text-right">₹{item.deposit?.toLocaleString("en-IN")}</TableCell>
              <TableCell className="text-right text-destructive">₹{item.damageCharges?.toLocaleString("en-IN")}</TableCell>
              <TableCell className="text-right">₹{item.finalRent?.toLocaleString("en-IN")}</TableCell>
              <TableCell className="text-right font-bold text-success">₹{item.refund?.toLocaleString("en-IN")}</TableCell>
            </TableRow>
          );
        case "Owner Statement": {
          const calc = getOwnerStatementRowCalc(item);

          return (
            <TableRow key={index}>
              <TableCell className="sticky left-0 z-10 bg-card group-hover/row:bg-muted/50 text-center font-medium text-muted-foreground">{index + 1}</TableCell>
              <TableCell className="font-semibold text-slate-800">{item.owner || "—"}</TableCell>
              <TableCell>{item.category || "—"}</TableCell>
              <TableCell className="text-center font-semibold">
                {item.model && item.model !== "Standard" && item.model !== "—" && (
                  <span className="text-[11px] text-muted-foreground block font-sans leading-none mb-0.5">{item.model}</span>
                )}
                <span className="font-mono text-[12.5px]">{item.serial || "—"}</span>
              </TableCell>
              <TableCell className="text-center font-mono text-muted-foreground">{calc.dateTaken}</TableCell>
              <TableCell className="text-[12px]">{calc.periodSelected}</TableCell>
              <TableCell className="text-center font-mono">
                <span className={calc.retDate === "Not return" ? "text-destructive font-semibold" : "text-slate-600"}>
                  {calc.retDate}
                </span>
              </TableCell>
              <TableCell className="text-center font-semibold">{calc.daysUsed}</TableCell>
              <TableCell className="text-right font-medium">₹{calc.perDayAmount.toLocaleString("en-IN")}</TableCell>
              <TableCell className="text-right font-bold text-slate-900">₹{calc.rowTotal.toLocaleString("en-IN")}</TableCell>
            </TableRow>
          );
        }
        default:
          return null;
      }
    });

    if (activeStatement === "Owner Statement") {
      let totalDays = 0;
      let grandTotal = 0;
      data.forEach(item => {
        const calc = getOwnerStatementRowCalc(item);
        totalDays += calc.daysUsed;
        grandTotal += calc.rowTotal;
      });

      rows.push(
        <TableRow key="totals-summary" className="font-bold bg-muted/15 border-t-2 border-slate-200">
          <TableCell colSpan={6} className="border-none bg-transparent"></TableCell>
          <TableCell className="text-right font-bold text-slate-700">Total Days:</TableCell>
          <TableCell className="text-center font-bold text-slate-950">{totalDays}</TableCell>
          <TableCell className="text-right font-bold text-slate-700">Grand Total:</TableCell>
          <TableCell className="text-right font-bold text-primary">₹{grandTotal.toLocaleString("en-IN")}</TableCell>
        </TableRow>
      );
    }

    return rows;
  };

  // Mobile card fallback for the Statement Viewer table — mirrors renderTableRows
  // but renders each record as a `.mobile-card-item` instead of a `<TableRow>`.
  const renderMobileCards = (data: any[]) => {
    if (data.length === 0) {
      return (
        <div className="py-12 text-center text-[13px] text-muted-foreground">
          No matching statement records found.
        </div>
      );
    }

    const cards = data.map((item, index) => {
      switch (activeStatement) {
        case "Rentals Statement":
          return (
            <div key={item.id || index} className="mobile-card-item">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[13px] truncate">{item.customer}</p>
                <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{item.id}</p>
                <div className="mt-1.5 space-y-0.5">
                  <div className="info-row">{item.equipment} · <span className="font-mono">{item.serial}</span></div>
                  <div className="info-row">{formatDateDDMMYYYY(item.start)} → {formatDateDDMMYYYY(item.end)}</div>
                  <div className="info-row">Deposit: ₹{item.deposit?.toLocaleString("en-IN")}</div>
                </div>
              </div>
              <div className="shrink-0 flex flex-col items-end gap-1.5">
                <p className="font-semibold text-[13px]">
                  ₹{item.monthlyRent?.toLocaleString("en-IN")}<span className="text-[10px] font-normal text-muted-foreground">/mo</span>
                </p>
                <StatusBadge status={item.status} />
              </div>
            </div>
          );
        case "Exchanges Statement":
          return (
            <div key={item.id || index} className="mobile-card-item">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[13px] truncate">{item.customer}</p>
                <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{item.id} · {item.agreementId}</p>
                <div className="mt-1.5 space-y-0.5">
                  <div className="info-row">Old: {item.currentEquipment} ({item.currentEquipmentSerial})</div>
                  <div className="info-row">New: {item.newEquipment} ({item.newEquipmentSerial})</div>
                  <div className="info-row">Reason: {item.reason || "—"}</div>
                </div>
              </div>
              <p className="shrink-0 text-right text-[12px] text-muted-foreground">
                {formatDateDDMMYYYY(item.exchangeDate || item.date)}
              </p>
            </div>
          );
        case "Customers Statement":
          return (
            <div key={item.id || index} className="mobile-card-item">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[13px] truncate">{item.name}</p>
                <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{item.id}</p>
                <div className="mt-1.5 space-y-0.5">
                  <div className="info-row">{item.phone}{item.email ? ` · ${item.email}` : ""}</div>
                  <div className="info-row">{item.city}{item.state ? `, ${item.state}` : ""}</div>
                  <div className="info-row">Active Rentals: {item.rentals || 0}</div>
                </div>
              </div>
              <div className="shrink-0">
                <StatusBadge status={item.status} />
              </div>
            </div>
          );
        case "Equipment Statement":
          return (
            <div key={item.id || index} className="mobile-card-item">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[13px] truncate">{item.category}</p>
                <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{item.id} · {item.serial}</p>
                <div className="mt-1.5 space-y-0.5">
                  <div className="info-row">{item.model} · {item.manufacturer}</div>
                  <div className="info-row">Owner: {item.owner}</div>
                  <div className="info-row">Purchased: {formatDateDDMMYYYY(item.purchaseDate)}</div>
                  <div className="info-row">Daily Rate: ₹{(item.ownerDailyRate || 0).toLocaleString("en-IN")}</div>
                </div>
              </div>
              <div className="shrink-0">
                <StatusBadge status={item.status} />
              </div>
            </div>
          );
        case "Payments Statement":
          return (
            <div key={item.id || index} className="mobile-card-item">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[13px] truncate">{item.customer}</p>
                <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{item.id} · {formatDateDDMMYYYY(item.date)}</p>
                <div className="mt-1.5 space-y-0.5">
                  <div className="info-row">Agreement: {item.agreement}</div>
                  <div className="info-row">{item.type} · {item.mode}</div>
                  <div className="info-row">Ref: {item.txRef || "—"}</div>
                </div>
              </div>
              <div className="shrink-0 flex flex-col items-end gap-1.5">
                <p className="font-semibold text-[13px]">₹{item.amount?.toLocaleString("en-IN")}</p>
                <StatusBadge status={item.status} />
              </div>
            </div>
          );
        case "Rent Dues Statement":
          return (
            <div key={item.id || index} className="mobile-card-item">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[13px] truncate">{item.customer}</p>
                <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{item.id}</p>
                <div className="mt-1.5 space-y-0.5">
                  <div className="info-row">{item.equipment}</div>
                  <div className="info-row">Start: {formatDateDDMMYYYY(item.start)}</div>
                  <div className="info-row">Rate: {item.rentDisplay} · Paid: ₹{item.grandTotalPaid?.toLocaleString("en-IN")}</div>
                </div>
              </div>
              <div className="shrink-0 flex flex-col items-end gap-1.5">
                <p className="font-bold text-[13px] text-destructive">₹{item.remainingDue?.toLocaleString("en-IN")}</p>
                <StatusBadge status={item.status} />
              </div>
            </div>
          );
        case "Return Statement":
          return (
            <div key={item.id || index} className="mobile-card-item">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[13px] truncate">{item.customer}</p>
                <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{item.id} · {formatDateDDMMYYYY(item.date)}</p>
                <div className="mt-1.5 space-y-0.5">
                  <div className="info-row">{item.equipment} · {item.condition}</div>
                  <div className="info-row">Agreement: {item.agreement}</div>
                  <div className="info-row">Deposit ₹{item.deposit?.toLocaleString("en-IN")} · Damage ₹{item.damageCharges?.toLocaleString("en-IN")}</div>
                  <div className="info-row">Final Rent: ₹{item.finalRent?.toLocaleString("en-IN")}</div>
                </div>
              </div>
              <p className="shrink-0 text-right font-bold text-[13px] text-success">
                ₹{item.refund?.toLocaleString("en-IN")}
              </p>
            </div>
          );
        case "Owner Statement": {
          const calc = getOwnerStatementRowCalc(item);
          return (
            <div key={index} className="mobile-card-item">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[13px] truncate">{item.owner || "—"}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{item.category || "—"}</p>
                <div className="mt-1.5 space-y-0.5">
                  <div className="info-row">
                    {item.model && item.model !== "Standard" && item.model !== "—" ? `${item.model} · ` : ""}
                    <span className="font-mono">{item.serial || "—"}</span>
                  </div>
                  <div className="info-row">Taken: {calc.dateTaken} · {calc.periodSelected}</div>
                  <div className="info-row">
                    Returned: <span className={calc.retDate === "Not return" ? "text-destructive font-semibold" : ""}>{calc.retDate}</span> · {calc.daysUsed} days
                  </div>
                  <div className="info-row">Per Day: ₹{calc.perDayAmount.toLocaleString("en-IN")}</div>
                </div>
              </div>
              <p className="shrink-0 text-right font-bold text-[13px] text-primary">
                ₹{calc.rowTotal.toLocaleString("en-IN")}
              </p>
            </div>
          );
        }
        default:
          return null;
      }
    });

    if (activeStatement === "Owner Statement") {
      let totalDays = 0;
      let grandTotal = 0;
      data.forEach(item => {
        const calc = getOwnerStatementRowCalc(item);
        totalDays += calc.daysUsed;
        grandTotal += calc.rowTotal;
      });

      cards.push(
        <div key="totals-summary" className="mobile-card-item bg-muted/15 border-slate-200">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold text-slate-700">Total Days: {totalDays}</p>
          </div>
          <p className="shrink-0 text-right font-bold text-[13px] text-primary">
            Grand Total: ₹{grandTotal.toLocaleString("en-IN")}
          </p>
        </div>
      );
    }

    return cards;
  };

  // Dynamic FY calculations based on current date
  const getFYList = () => {
    const list = [];
    const today = new Date();
    let currentStartYear = today.getFullYear();
    if (today.getMonth() < 3) {
      currentStartYear--; // Jan-Mar belongs to previous FY
    }
    for (let i = 0; i < 4; i++) {
      const startYear = currentStartYear - i;
      const endYearSuffix = String(startYear + 1).slice(-2);
      list.push({
        value: `fy${String(startYear).slice(-2)}-${endYearSuffix}`,
        label: `FY 20${String(startYear).slice(-2)} - ${endYearSuffix}`,
        startYear: startYear,
        endYear: startYear + 1,
      });
    }
    return list;
  };

  const fyList = getFYList();
  const [selectedFY, setSelectedFY] = useState(() => fyList[0].value);

  // Dynamic Revenue calculations for chart
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const dynamicRevenueData = months.map((month, idx) => {
    const activeFY = fyList.find(f => f.value === selectedFY) || fyList[0];
    const paymentYear = idx < 3 ? activeFY.endYear : activeFY.startYear;

    const monthPayments = paymentsList.filter((p) => {
      if (p.status !== "Paid") return false;
      try {
        const pDate = parseLocalDate(p.date);
        if (!isNaN(pDate.getTime())) {
          return pDate.getMonth() === idx && pDate.getFullYear() === paymentYear;
        }
      } catch {
        // ignore
      }
      return false;
    });
    const totalRev = monthPayments.reduce((sum, p) => sum + p.amount, 0);
    return {
      month,
      current: totalRev,
    };
  });

  const DEFAULT_CATEGORIES = [
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
    "Patient Ventilator",
  ];

  const categories = Array.from(new Set([
    ...DEFAULT_CATEGORIES,
    ...equipmentList.map((e) => e.category)
  ]));

  const dynamicUtilizationData = categories.map((cat) => {
    const catEquip = equipmentList.filter(
      (e) => e.category.toLowerCase() === cat.toLowerCase()
    );
    if (catEquip.length === 0) return { name: cat, value: 0 };
    const total = catEquip.length;
    const rented = catEquip.filter((e) => e.status === "Rented" || e.status === "Active").length;
    const rate = Math.round((rented / total) * 100);
    return { name: cat, value: rate };
  });

  const totalRented = equipmentList.filter((e) => e.status === "Rented" || e.status === "Active").length;
  const dynamicEquipmentMix = categories.map((cat) => {
    const count = equipmentList.filter(
      (e) => e.category.toLowerCase() === cat.toLowerCase() && (totalRented > 0 ? (e.status === "Rented" || e.status === "Active") : true)
    ).length;
    return { name: cat, value: count };
  }).sort((a, b) => b.value - a.value);

  return (
    <AppShell
      title="Statements & Analytics"
      subtitle="Filter, view, and export business statements"
      actions={
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExportStatement("PDF")}
          >
            <FileText className="mr-1.5 h-3.5 w-3.5" />
            PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExportStatement("Excel")}
          >
            <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" />
            Excel
          </Button>
          <Button
            size="sm"
            onClick={() => handleExportStatement("CSV")}
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Export CSV
          </Button>
        </>
      }
    >
      {/* Chart row */}
      <div className="grid gap-5 lg:grid-cols-3 mb-5">
        {/* Revenue chart */}
        <Card className="lg:col-span-2 overflow-hidden">
          <CardHeader className="border-b border-border/60 pb-3 mb-0">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Annual Revenue Report</CardTitle>
                <p className="mt-0.5 text-[12px] text-muted-foreground">
                  {(fyList.find(f => f.value === selectedFY)?.label || "FY Monthly")} monthly performance
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Select value={selectedFY} onValueChange={setSelectedFY}>
                  <SelectTrigger className="h-8 w-[140px] text-[12px]">
                    <SelectValue placeholder="Select Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {fyList.map((fy) => (
                      <SelectItem key={fy.value} value={fy.value}>
                        {fy.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dynamicRevenueData} margin={{ left: -10, right: 10, top: 10 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} opacity={0.6} />
                <XAxis dataKey="month" fontSize={11} stroke="var(--color-muted-foreground)" tickLine={false} axisLine={false} />
                <YAxis fontSize={11} stroke="var(--color-muted-foreground)" tickLine={false} axisLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, "Revenue"]} />
                <Area type="monotone" dataKey="current" stroke="var(--color-primary)" strokeWidth={2.5} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie chart */}
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border/60 pb-3 mb-0">
            <CardTitle>Equipment Mix</CardTitle>
            <p className="mt-0.5 text-[12px] text-muted-foreground">Rental share by category</p>
          </CardHeader>
          <CardContent className="pt-4">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dynamicEquipmentMix.slice(0, 5)}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={58}
                  outerRadius={90}
                  paddingAngle={3}
                  strokeWidth={0}
                >
                  {dynamicEquipmentMix.slice(0, 5).map((_: any, i: number) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Grid: Utilization + Customer Revenue Report */}
      <div className="grid gap-5 lg:grid-cols-3 mb-5">
        {/* Utilization bar chart */}
        <Card className="lg:col-span-2 overflow-hidden">
          <CardHeader className="border-b border-border/60 pb-3 mb-0">
            <CardTitle>Equipment Utilization by Category</CardTitle>
            <p className="mt-0.5 text-[12px] text-muted-foreground">Live utilization rates across all equipment types</p>
          </CardHeader>
          <CardContent className="pt-4">
            {/* Horizontally-scrollable on narrow screens so category ticks don't compress into an unreadable smear */}
            <div className="overflow-x-auto">
              <div style={{ minWidth: `${Math.max(dynamicUtilizationData.length * 60, 300)}px` }}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dynamicUtilizationData} barCategoryGap="35%">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} opacity={0.6} />
                    <XAxis
                      dataKey="name"
                      fontSize={11}
                      stroke="var(--color-muted-foreground)"
                      tickLine={false}
                      axisLine={false}
                      interval={0}
                      angle={-12}
                      textAnchor="end"
                      height={56}
                    />
                    <YAxis fontSize={11} stroke="var(--color-muted-foreground)" tickLine={false} axisLine={false} unit="%" />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(v: number) => [`${v}%`, "Utilization"]}
                    />
                    <Bar dataKey="value" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Customers list */}
        <Card className="overflow-hidden flex flex-col justify-between">
          <CardHeader className="border-b border-border/60 bg-muted/20 px-5 py-4 flex flex-row items-center gap-3">
            <div className="metric-icon h-9 w-9 shrink-0 bg-accent/10 text-accent border-accent/20">
              <Users2 className="h-4.5 w-4.5" />
            </div>
            <div>
              <CardTitle>Top Customers</CardTitle>
              <p className="text-[12px] text-muted-foreground mt-0.5">Highest billing accounts</p>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-grow">
            {/* Desktop Table — hidden on mobile */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-5">Customer</TableHead>
                    <TableHead className="text-center">Rentals</TableHead>
                    <TableHead className="text-right pr-5">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dynamicTopCustomers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="py-12 text-center text-[13px] text-muted-foreground">
                        No billing history found.
                      </TableCell>
                    </TableRow>
                  )}
                  {dynamicTopCustomers.map((cust) => (
                    <TableRow key={cust.id} className="group">
                      <TableCell className="pl-5">
                        <div>
                          <p className="font-semibold text-[13px] truncate">{cust.name}</p>
                          <p className="text-[10px] font-mono text-muted-foreground">{cust.id}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-primary/10 text-primary text-[11px] font-bold">
                          {cust.rentals}
                        </span>
                      </TableCell>
                      <TableCell className="text-right pr-5 font-semibold text-[13px] text-success">
                        ₹{cust.revenue.toLocaleString("en-IN")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile List — visible only on mobile */}
            <div className="md:hidden">
              {dynamicTopCustomers.length === 0 ? (
                <div className="py-12 text-center text-[13px] text-muted-foreground">
                  No billing history found.
                </div>
              ) : (
                <div className="divide-y divide-border/60">
                  {dynamicTopCustomers.map((cust) => (
                    <div key={cust.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-[13px] truncate">{cust.name}</p>
                        <p className="text-[10px] font-mono text-muted-foreground">
                          {cust.id} · {cust.rentals} rental{cust.rentals !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <p className="shrink-0 text-right font-semibold text-[13px] text-success">
                        ₹{cust.revenue.toLocaleString("en-IN")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report cards grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 mb-6">
        {reportCards.map((r, i) => {
          const isActive = activeStatement === r.title;
          return (
            <Card
              key={r.title}
              className={`group cursor-pointer hover:border-primary/40 hover:shadow-[var(--shadow-elevated)] transition-all duration-200 ${
                isActive ? "border-primary ring-2 ring-primary/10 shadow-md" : ""
              }`}
              onClick={() => handleCardClick(r.title)}
            >
              <CardContent className="flex items-center gap-3 p-4">
                <div className={`metric-icon h-9 w-9 shrink-0 border border-transparent ${r.color}`}>
                  <r.icon className="h-4.5 w-4.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[13px] truncate">{r.title}</p>
                  <p className="text-[10.5px] text-muted-foreground truncate mt-0.5">{r.desc}</p>
                </div>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className="shrink-0 text-[11px] font-semibold transition-colors gap-0.5 h-7 px-1.5"
                >
                  {isActive ? "Viewing" : "View"}
                  <ArrowUpRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Dynamic Statement Viewer Section */}
      <div ref={viewerRef} className="scroll-mt-6">
        <Card className="overflow-hidden border border-border/80 shadow-soft">
          <CardHeader className="border-b border-border bg-muted/15 px-5 py-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-primary" />
                  {activeStatement} Viewer
                </CardTitle>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  Showing {filteredData.length} records matching filters
                </p>
              </div>

              {/* Filters Toolbar — scrolls as one row on mobile, wraps normally from md: up */}
              <div className="flex flex-nowrap items-center gap-3 overflow-x-auto pb-1 -mx-1 px-1 md:flex-wrap md:overflow-visible md:pb-0 md:mx-0 md:px-0">
                {/* Search */}
                <div className="relative min-w-[150px] flex-1 shrink-0 sm:flex-initial">
                  <Input
                    placeholder="Search statement records..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-8.5 text-[12px] px-3 py-1 bg-background"
                  />
                </div>

                {/* Owner filter dropdown (Specific to Owner Statement) */}
                {activeStatement === "Owner Statement" && (
                  <Select value={selectedOwnerFilter} onValueChange={setSelectedOwnerFilter}>
                    <SelectTrigger className="h-8.5 w-[200px] text-[12px] bg-background shrink-0">
                      <SelectValue placeholder="All Owners" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-owners">All Owners</SelectItem>
                      {ownerOptions.map(name => {
                        const ow = ownersList.find((x: any) => x.name?.toLowerCase() === name.toLowerCase() || x.ownerName?.toLowerCase() === name.toLowerCase() || x.id === name);
                        const personName = ow?.ownerName && ow.ownerName.trim() !== "" && ow.ownerName.trim().toLowerCase() !== name.toLowerCase() ? ow.ownerName.trim() : "";
                        return (
                          <SelectItem key={name} value={name}>
                            {name}{personName ? ` (${personName})` : ""}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                )}

                {/* Category filter dropdown (Specific to Owner Statement) */}
                {activeStatement === "Owner Statement" && (
                  <Select value={selectedCategoryFilter} onValueChange={setSelectedCategoryFilter}>
                    <SelectTrigger className="h-8.5 w-[160px] text-[12px] bg-background shrink-0">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent className="border border-border/60 bg-popover shadow-elevated rounded-lg">
                      <SelectItem value="all-categories" className="text-[12px] cursor-pointer">All Categories</SelectItem>
                      {categoryOptions.map(cat => (
                        <SelectItem key={cat} value={cat} className="text-[12px] cursor-pointer">{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* Date Type selection */}
                {DATE_TYPE_OPTIONS[activeStatement] && DATE_TYPE_OPTIONS[activeStatement][0].value !== "none" && (
                  <Select value={dateType} onValueChange={setDateType}>
                    <SelectTrigger className="h-8.5 w-[150px] text-[12px] bg-background shrink-0">
                      <SelectValue placeholder="Date Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {DATE_TYPE_OPTIONS[activeStatement].map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* Date Preset Filter */}
                {dateType !== "none" && (
                  <Select value={preset} onValueChange={handlePresetChange}>
                    <SelectTrigger className="h-8.5 w-[140px] text-[12px] bg-background shrink-0">
                      <SelectValue placeholder="Date Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="this-month">This Month</SelectItem>
                      <SelectItem value="last-month">Last Month</SelectItem>
                      <SelectItem value="this-quarter">This Quarter</SelectItem>
                      <SelectItem value="last-30-days">Last 30 Days</SelectItem>
                      <SelectItem value="last-90-days">Last 90 Days</SelectItem>
                      <SelectItem value="this-fy">This Financial Year</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                )}

                {/* Date range inputs */}
                {dateType !== "none" && (preset !== "all" || startDate || endDate) && (
                  <div className="flex items-center gap-1.5 rounded-lg border border-border bg-background p-1 h-auto shrink-0">
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        setPreset("custom");
                      }}
                      className="h-9 w-[130px] text-[11px] px-1.5 py-0 border-transparent bg-transparent shadow-none focus-visible:ring-0 cursor-pointer"
                    />
                    <span className="text-[9px] text-muted-foreground font-bold px-0.5 shrink-0">TO</span>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        setPreset("custom");
                      }}
                      className="h-9 w-[130px] text-[11px] px-1.5 py-0 border-transparent bg-transparent shadow-none focus-visible:ring-0 cursor-pointer"
                    />
                  </div>
                )}

                {/* Action exports */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8.5 text-[11.5px]"
                    onClick={() => handleExportStatement("PDF")}
                  >
                    <FileText className="mr-1 h-3.5 w-3.5" /> PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8.5 text-[11.5px]"
                    onClick={() => handleExportStatement("Excel")}
                  >
                    <FileSpreadsheet className="mr-1 h-3.5 w-3.5" /> Excel
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 max-h-none md:max-h-[500px] overflow-y-auto">
            {/* Desktop table — hidden on mobile */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/10 sticky top-0 z-10">
                  {renderTableHeader()}
                </TableHeader>
                <TableBody>
                  {renderTableRows(filteredData)}
                </TableBody>
              </Table>
            </div>

            {/* Mobile card list — visible only on mobile */}
            <div className="md:hidden space-y-2 p-3">
              {renderMobileCards(filteredData)}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
