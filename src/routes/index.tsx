import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell, StatusBadge } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
  BarChart, Bar, RadialBarChart, RadialBar, PolarAngleAxis, LineChart, Line,
} from "recharts";
import {
  Users, Package, FileText, IndianRupee, ArrowUpRight, ArrowDownRight,
  Plus, Download, TrendingUp, AlertCircle, CheckCircle2, RotateCcw, CreditCard,
  Bell, Activity, Handshake,
} from "lucide-react";
import {
  getDynamicKPIs,
  getPayments,
  getRentals,
  getEquipment,
  getReturns,
  getOwners,
  downloadFile,
  downloadExcel,
  useDatabaseTrigger,
  parseLocalDate,
  getPaidForEquipment,
  formatDateDDMMYYYY,
} from "@/lib/data-store";
import { toast } from "sonner";

export const Route = createFileRoute("/")(
  {
    head: () => ({ meta: [{ title: "Dashboard — Relife ERP" }] }),
    component: Dashboard,
  },
);

const kpiIcons = [FileText, Handshake, RotateCcw, Package, Package, IndianRupee, AlertCircle, CreditCard];

const tooltipStyle = {
  background: "var(--color-popover)",
  border: "1px solid var(--color-border)",
  borderRadius: 10,
  fontSize: 12,
  boxShadow: "var(--shadow-elevated)",
  padding: "8px 12px",
  color: "var(--color-foreground)",
};

const activityTypes = ["All", "Rentals", "Payments", "Returns", "Alerts"] as const;
const activityTypeMap: Record<string, string> = {
  rental: "Rentals", payment: "Payments", return: "Returns", alert: "Alerts",
};

const activityIconMap: Record<string, typeof CheckCircle2> = {
  payment: CheckCircle2,
  rental: FileText,
  return: RotateCcw,
  alert: AlertCircle,
};

const activityColorMap: Record<string, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  accent: "bg-accent/10 text-accent",
  destructive: "bg-destructive/10 text-destructive",
};

const activityLabelColor: Record<string, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  accent: "bg-accent/10 text-accent",
  destructive: "bg-destructive/10 text-destructive",
};

const getCurrentFY = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  if (today.getMonth() >= 3) {
    return `FY ${year}-${String(year + 1).slice(-2)}`;
  } else {
    return `FY ${year - 1}-${String(year).slice(-2)}`;
  }
};

function Dashboard() {
  const dbVersion = useDatabaseTrigger();
  const [activeActivity, setActiveActivity] = useState<string>("All");
  // PERF FIX: these all fan out into getRentals()/getCustomers(), which carry
  // self-healing repair passes and (when corrections are found) live Google
  // Sheets sync calls. Calling them bare in the render body re-ran that full
  // chain on every re-render — including every 15s auto-sync tick and every
  // db write anywhere in the app — which is what made the Dashboard (the
  // landing page) feel slow to open. Memoize on dbVersion so it only
  // recomputes when the underlying data actually changed.
  const kpis = useMemo(() => getDynamicKPIs(), [dbVersion]);
  const paymentsList = useMemo(() => getPayments(), [dbVersion]);
  const rentalsList = useMemo(() => getRentals(), [dbVersion]);
  const equipmentList = useMemo(() => getEquipment(), [dbVersion]);
  const returnsList = useMemo(() => getReturns(), [dbVersion]);
  const ownersList = useMemo(() => getOwners(), [dbVersion]);

  // Calculate equipment counts per owner
  const equipmentByOwner = ownersList.map((owner) => {
    const count = equipmentList.filter(
      (e) => e.owner?.toLowerCase() === owner.name.toLowerCase()
    ).length;
    return {
      name: owner.name,
      count: count,
    };
  });

  const inHouseCount = equipmentList.filter(
    (e) => !e.owner || e.owner.toLowerCase() === "medirent" || e.owner.toLowerCase() === "medirent healthcare"
  ).length;

  const ownerGraphData = [
    // Bug fix #13: Only include In-House if there are items; filter zero-count owners
    ...(inHouseCount > 0 ? [{ name: "In-House", count: inHouseCount }] : []),
    ...equipmentByOwner.filter(
      (o) => o.count > 0 && o.name.toLowerCase() !== "medirent" && o.name.toLowerCase() !== "medirent healthcare"
    ),
  ];

  // Dynamic weekly/maintenance metrics
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const weeklyNewRentals = rentalsList.filter(r => {
    const rDate = parseLocalDate(r.start);
    return !isNaN(rDate.getTime()) && rDate.getTime() >= oneWeekAgo.getTime();
  }).length;

  const weeklyReturns = returnsList.filter(ret => {
    const retDate = parseLocalDate(ret.date);
    return !isNaN(retDate.getTime()) && retDate.getTime() >= oneWeekAgo.getTime();
  }).length;

  const maintenanceCount = equipmentList.filter(e => e.status === "UnderMaintenance").length;

  // Total Paid
  const totalCollected = paymentsList
    .filter(p => p.status === "Paid")
    .reduce((sum, p) => sum + p.amount, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getStartDayOfMonth = (dateStr: string) => {
    const d = parseLocalDate(dateStr);
    if (isNaN(d.getTime())) return 1;
    return d.getDate();
  };

  const calcUnpaidDetailsForEquipment = (rental: any, eqId: string) => {
    const originalStart = parseLocalDate(rental.start);
    if (isNaN(originalStart.getTime())) {
      return { 
        unpaidMonths: 0, 
        unpaidDays: 0, 
        outstanding: 0, 
        unpaidText: "0 d", 
        rateText: "₹0",
        isMonthly: false,
        totalDue: 0,
        grandTotalPaid: 0
      };
    }

    const eqItems = rental.equipmentItems || [];
    const item = eqItems.find((it: any) => it.equipmentId === eqId);
    
    // Rates
    const monthlyRent = item ? (Number(item.monthlyRent || item.rentRate) || 0) : 0;
    const dailyRate = (item ? Number(item.dailyRent) : 0) || rental.dailyRent || 0;
    const itemCycle = item?.rentCycle || (rental as any).rentCycle || (monthlyRent > 0 && dailyRate === 0 ? "Monthly" : "Daily");
    const isMonthly = itemCycle === "Monthly";

    const start = parseLocalDate(rental.start);

    // Count paid amount from payment records using getPaidForEquipment helper, excluding initial advance payment
    const grandTotalPaid = getPaidForEquipment(rental, eqId, paymentsList, true);

    let unpaidMonths = 0;
    let unpaidDays = 0;
    let outstanding = 0;
    let unpaidText = "";
    let rateText = "";
    let totalDue = 0;

    if (isMonthly) {
      const diffTime = Math.max(0, today.getTime() - start.getTime());
      const totalDaysElapsed = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Monthly billing: calculate only complete months elapsed
      const monthsElapsed = Math.floor(totalDaysElapsed / 30);
      totalDue = monthsElapsed * monthlyRent;
      
      outstanding = Math.max(0, totalDue - grandTotalPaid);
      unpaidMonths = monthlyRent > 0 ? Math.round(outstanding / monthlyRent) : 0;
      unpaidText = `${unpaidMonths}m`;
      rateText = `₹${monthlyRent.toLocaleString("en-IN")}/mo`;
    } else {
      // Daily billing: calculate purely by days elapsed
      const diffTime = Math.max(0, today.getTime() - start.getTime());
      const daysElapsed = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      totalDue = daysElapsed * dailyRate;
      
      outstanding = Math.max(0, totalDue - grandTotalPaid);
      unpaidDays = dailyRate > 0 ? Math.round(outstanding / dailyRate) : 0;
      unpaidMonths = 0;
      unpaidText = `${unpaidDays}d`;
      rateText = `₹${dailyRate.toLocaleString("en-IN")}/day`;
    }

    return { unpaidMonths, unpaidDays, outstanding, unpaidText, rateText, isMonthly, totalDue, grandTotalPaid };
  };

  // Filter out completed/cancelled/returned rentals
  const activeRentals = rentalsList.filter((r) => {
    if (r.status === "Completed" || r.status === "Cancelled") return false;
    if (r.equipmentItems && r.equipmentItems.length > 0) {
      const allReturned = r.equipmentItems.every((item: any) => item.returned);
      if (allReturned) return false;
    }
    return true;
  });

  // Map to individual equipment items that are NOT returned
  const dueItems: any[] = [];
  activeRentals.forEach((r) => {
    const eqItems = r.equipmentItems || [
      {
        equipmentId: r.equipmentId,
        serial: r.serial,
        monthlyRent: Number(r.monthlyRent) || 0,
        deposit: Number(r.deposit) || 0,
        returned: false
      }
    ];
    
    eqItems.forEach((eqItem: any) => {
      if (!eqItem.returned) {
        dueItems.push({
          rental: r,
          equipmentId: eqItem.equipmentId,
          serial: eqItem.serial,
          monthlyRent: Number(eqItem.monthlyRent || eqItem.rentRate) || 0,
          deposit: Number(eqItem.deposit) || 0,
          start: r.start,
          id: `${r.id}-${eqItem.equipmentId}`
        });
      }
    });
  });

  const due1To10List  = dueItems.filter((item) => { const d = getStartDayOfMonth(item.start); return d >= 1  && d <= 10; });
  const due11To20List = dueItems.filter((item) => { const d = getStartDayOfMonth(item.start); return d >= 11 && d <= 20; });
  const due21To31List = dueItems.filter((item) => { const d = getStartDayOfMonth(item.start); return d >= 21 && d <= 31; });

  // Total Pending Rent
  const totalPending = dueItems.reduce((sum, item) => sum + calcUnpaidDetailsForEquipment(item.rental, item.equipmentId).outstanding, 0);

  // Total Target = Collected + Pending
  const totalTarget = totalCollected + totalPending;

  // Rate - no fallback to 87%
  const collectionRate = totalTarget > 0 ? Math.round((totalCollected / totalTarget) * 100) : 0;

  // Helper formatting values as standard currency numbers
  const formatLakhs = (val: number) => {
    return `₹${val.toLocaleString("en-IN")}`;
  };

  // 1. Dynamic revenueData
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const revenueData = months.map((m, idx) => {
    const monthlyPayments = paymentsList.filter(p => {
      if (p.status !== "Paid") return false;
      const pDate = parseLocalDate(p.date);
      return !isNaN(pDate.getTime()) && pDate.getMonth() === idx;
    });
    const currentMonthSum = monthlyPayments.reduce((sum, p) => sum + p.amount, 0);
    return {
      month: m,
      current: currentMonthSum,
      previous: 0,
    };
  });

  // 2. Dynamic utilizationData
  const defaultCategories = [
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
  const activeCategories = equipmentList.length > 0 
    ? Array.from(new Set(equipmentList.map(e => e.category)))
    : defaultCategories;
  const utilizationData = activeCategories.map(cat => {
    const catEquip = equipmentList.filter(e => e.category === cat);
    const rentedCount = catEquip.filter(e => e.status === "Rented" || e.status === "Active").length;
    const rate = catEquip.length > 0 ? Math.round((rentedCount / catEquip.length) * 100) : 0;
    return { name: cat, value: rate };
  });

  // 3. Dynamic collectionData (last 7 days - Mon-Sun)
  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const collectionData = days.map((day, idx) => {
    const dayPayments = paymentsList.filter(p => {
      const pDate = parseLocalDate(p.date);
      if (isNaN(pDate.getTime())) return false;
      const dayNum = pDate.getDay();
      const mappedIdx = dayNum === 0 ? 6 : dayNum - 1; // Mon=0... Sun=6
      return mappedIdx === idx;
    });
    const collected = dayPayments.filter(p => p.status === "Paid").reduce((sum, p) => sum + p.amount, 0);
    const pending = dayPayments.filter(p => p.status === "Pending" || p.status === "Partial").reduce((sum, p) => sum + p.amount, 0);
    return { day, collected, pending };
  });

  // 4. Dynamic pendingDuesData
  const pendingDuesData = [
    { 
      label: "1–10 Days Due", 
      amount: due1To10List.reduce((sum, item) => sum + calcUnpaidDetailsForEquipment(item.rental, item.equipmentId).outstanding, 0), 
      count: due1To10List.filter(item => calcUnpaidDetailsForEquipment(item.rental, item.equipmentId).outstanding > 0).length 
    },
    { 
      label: "11–20 Days Due", 
      amount: due11To20List.reduce((sum, item) => sum + calcUnpaidDetailsForEquipment(item.rental, item.equipmentId).outstanding, 0), 
      count: due11To20List.filter(item => calcUnpaidDetailsForEquipment(item.rental, item.equipmentId).outstanding > 0).length 
    },
    { 
      label: "21–31 Days Due", 
      amount: due21To31List.reduce((sum, item) => sum + calcUnpaidDetailsForEquipment(item.rental, item.equipmentId).outstanding, 0), 
      count: due21To31List.filter(item => calcUnpaidDetailsForEquipment(item.rental, item.equipmentId).outstanding > 0).length 
    },
  ];

  // 5. Dynamic rentalGrowthData
  const rentalGrowthData = months.map((m, idx) => {
    const newRentalsCount = rentalsList.filter(r => {
      const rDate = parseLocalDate(r.start);
      return !isNaN(rDate.getTime()) && rDate.getMonth() === idx;
    }).length;
    const returnsCount = returnsList.filter(ret => {
      const retDate = parseLocalDate(ret.date);
      return !isNaN(retDate.getTime()) && retDate.getMonth() === idx;
    }).length;
    return { month: m, newRentals: newRentalsCount, returns: returnsCount };
  });

  // 6. Dynamic activities
  const dynamicActivities: any[] = [];
  rentalsList.forEach(r => {
    dynamicActivities.push({
      type: "rental",
      text: `New rental created for ${r.customer} — ${r.equipment}`,
      time: r.start,
      tone: "primary"
    });
  });
  paymentsList.forEach(p => {
    dynamicActivities.push({
      type: "payment",
      text: `Payment of ₹${p.amount.toLocaleString("en-IN")} received via ${p.mode} from ${p.customer}`,
      time: p.date,
      tone: "success"
    });
  });
  returnsList.forEach(ret => {
    dynamicActivities.push({
      type: "return",
      text: `${ret.equipment} returned by ${ret.customer}`,
      time: ret.date,
      tone: "accent"
    });
  });
  
  // Sort activities newest first
  dynamicActivities.sort((a, b) => {
    const timeA = parseLocalDate(a.time).getTime();
    const timeB = parseLocalDate(b.time).getTime();
    return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
  });
  
  const filteredActivities = dynamicActivities.filter((a) => {
    if (activeActivity === "All") return true;
    return activityTypeMap[a.type] === activeActivity;
  });

  return (
    <AppShell
      title="Dashboard"
      subtitle="Overview of your medical equipment rental operations"
      actions={
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const headers = ["KPI Metric", "Value", "Description"];
              const rows = kpis.map(k => [k.label, k.value, k.description || ""]);
              downloadExcel("dashboard_kpis_export.xls", headers, rows, [200, 110, 300]);
              toast.success("Dashboard metrics report exported successfully.");
            }}
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Export
          </Button>
          <Button size="sm" asChild>
            <Link to="/rentals">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              New Rental
            </Link>
          </Button>
        </>
      }
    >
      <Tabs defaultValue="overview" className="space-y-5">
        <div className="overflow-x-auto">
          <TabsList className="flex-nowrap">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="operations">Operations</TabsTrigger>
          </TabsList>
        </div>

        {/* ── Overview Tab ── */}
        <TabsContent value="overview" className="space-y-5">
          {/* KPI Grid */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {kpis.map((k, i) => {
              const Icon = kpiIcons[i] ?? Users;
              return (
                <Card
                  key={k.label}
                  className={`relative overflow-hidden hover:shadow-[var(--shadow-elevated)] hover:-translate-y-0.5 animate-[fade-in_0.35s_ease-out_both] stagger-${Math.min(i + 1, 8)}`}
                >
                  <CardContent className="p-3.5 sm:p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground/65 leading-tight">
                          {k.label}
                        </p>
                        <p className="mt-1.5 sm:mt-2 font-display text-[22px] sm:text-[26px] font-bold tracking-tight animate-count-up">
                          {k.value}
                        </p>
                      </div>
                      {/* Unified icon — no per-card named colors */}
                      <div className="metric-icon h-8 w-8 sm:h-10 sm:w-10 shrink-0">
                        <Icon className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="mt-2.5 sm:mt-3.5 flex items-center text-[10px] sm:text-[11px] text-muted-foreground/75 font-medium leading-none">
                      <span className="truncate">{k.description}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Charts row */}
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
            {/* Revenue Chart */}
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-start justify-between border-b border-border/60 pb-3 mb-0">
                <div>
                  <CardTitle>Revenue Performance</CardTitle>
                  <p className="mt-0.5 text-[12px] text-muted-foreground">Monthly rent collection vs previous year</p>
                </div>
                <div className="flex items-center gap-4 text-[11px] text-muted-foreground shrink-0">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-sm bg-primary" />
                    Current
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-sm bg-accent" />
                    Previous
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={revenueData} margin={{ left: -10, right: 8, top: 8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gCurrent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.30} />
                        <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gPrev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.20} />
                        <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} opacity={0.5} />
                    <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, ""]} />
                    <Area type="monotone" dataKey="current"  stroke="var(--color-primary)" strokeWidth={2} fill="url(#gCurrent)" />
                    <Area type="monotone" dataKey="previous" stroke="var(--color-accent)"  strokeWidth={1.5} strokeDasharray="5 4" fill="url(#gPrev)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Collection Rate */}
            <Card>
              <CardHeader className="border-b border-border/60 pb-3 mb-0">
                <CardTitle>Collection Rate</CardTitle>
                <p className="text-[12px] text-muted-foreground">December target progress</p>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="relative flex items-center justify-center h-40">
                  {/* SVG progress ring */}
                  <svg className="h-36 w-36 transform -rotate-90" viewBox="0 0 100 100">
                    <defs>
                      <linearGradient id="collectionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--color-primary)" />
                        <stop offset="100%" stopColor="var(--color-primary-glow)" />
                      </linearGradient>
                    </defs>
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="var(--color-muted)"
                      strokeOpacity="0.25"
                      strokeWidth="6"
                      fill="transparent"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="url(#collectionGradient)"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={251.2}
                      strokeDashoffset={251.2 - (251.2 * collectionRate) / 100}
                      strokeLinecap="round"
                      className="transition-all duration-500 ease-in-out"
                    />
                  </svg>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-display text-3xl font-bold tracking-tight text-foreground">{collectionRate}%</span>
                    <span className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/75">Collected</span>
                  </div>
                </div>
                
                <div className="mt-2 mb-4 text-center">
                  <p className="text-[12px] text-muted-foreground">
                    Progress: <span className="font-semibold text-foreground">{formatLakhs(totalCollected)}</span> of <span className="font-semibold text-muted-foreground">{formatLakhs(totalTarget)}</span>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="rounded-lg bg-success/8 border border-success/18 p-3">
                    <p className="text-[11px] text-muted-foreground">Collected</p>
                    <p className="mt-0.5 font-display text-[17px] font-bold text-success">{formatLakhs(totalCollected)}</p>
                  </div>
                  <div className="rounded-lg bg-warning/10 border border-warning/22 p-3">
                    <p className="text-[11px] text-muted-foreground">Pending</p>
                    <p className="mt-0.5 font-display text-[17px] font-bold text-warning-foreground">{formatLakhs(totalPending)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bottom row — Utilization + Owner Graph + Activity */}
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
            {/* Equipment Utilization */}
            <Card className="lg:col-span-1">
              <CardHeader className="border-b border-border/60 pb-3 mb-0">
                <CardTitle>Equipment Utilization</CardTitle>
                <p className="text-[12px] text-muted-foreground">Live utilization rate by category</p>
              </CardHeader>
              <CardContent className="pt-4 space-y-4 max-h-[350px] overflow-y-auto pr-1">
                {utilizationData.map((u, i) => (
                  <div key={u.name} className={`animate-[fade-in_0.35s_ease-out_both] stagger-${Math.min(i + 1, 8)}`}>
                    <div className="mb-1.5 flex items-center justify-between text-[12px]">
                      <span className="font-medium text-foreground/80 truncate max-w-[170px]" title={u.name}>{u.name}</span>
                      <span className="font-bold tabular-nums text-foreground">{u.value}%</span>
                    </div>
                    <div className="relative h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-700"
                        style={{ width: `${u.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Owner Inventory Distribution Graph */}
            <Card className="lg:col-span-1">
              <CardHeader className="border-b border-border/60 pb-3 mb-0">
                <CardTitle>Equipment by Owner</CardTitle>
                <p className="text-[12px] text-muted-foreground">Inventory distribution across partners</p>
              </CardHeader>
              <CardContent className="pt-4">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={ownerGraphData} margin={{ left: -22, right: 5, top: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} opacity={0.5} />
                    <XAxis 
                      dataKey="name" 
                      stroke="var(--color-muted-foreground)" 
                      fontSize={9} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(val) => val.length > 12 ? val.slice(0, 10) + '..' : val}
                    />
                    <YAxis stroke="var(--color-muted-foreground)" fontSize={9} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v} Units`, "Equipment Count"]} />
                    <Bar dataKey="count" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Activity Feed */}
            <Card className="lg:col-span-1">
              <CardHeader className="border-b border-border/60 pb-0 mb-0">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <CardTitle>Recent Activity</CardTitle>
                    <p className="text-[12px] text-muted-foreground">Live feed of operations</p>
                  </div>
                  <span className="flex items-center gap-1 text-[10px] font-bold text-success bg-success/10 border border-success/20 rounded-md px-2 py-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-success animate-[pulse-dot_2.5s_ease-in-out_infinite]" />
                    LIVE
                  </span>
                </div>
                {/* Type filter */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-3">
                  {activityTypes.map((t) => (
                    <button
                      key={t}
                      onClick={() => setActiveActivity(t)}
                      className={`mobile-chip shrink-0 ${t === activeActivity ? "active" : ""}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="pt-2 space-y-0.5 max-h-[290px] overflow-y-auto pr-1">
                {filteredActivities.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <Activity className="h-8 w-8 text-muted-foreground/30 mb-2" />
                    <p className="text-[12px] text-muted-foreground">No activities in this category</p>
                  </div>
                ) : filteredActivities.map((a, i) => {
                  const Icon = activityIconMap[a.type] ?? CheckCircle2;
                  return (
                    <div
                      key={i}
                      className="flex gap-2.5 rounded-lg p-2 transition-colors hover:bg-muted/40 animate-[fade-in_0.35s_ease-out_both]"
                      style={{ animationDelay: `${i * 0.05}s` }}
                    >
                      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${activityColorMap[a.tone]}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium leading-snug text-foreground/90 truncate">{a.text}</p>
                        <div className="mt-0.5 flex items-center gap-1.5">
                          <span className="text-[10px] text-muted-foreground">{formatDateDDMMYYYY(a.time)}</span>
                          <span className={`rounded px-1 py-px text-[9px] font-semibold ${activityLabelColor[a.tone]}`}>
                            {activityTypeMap[a.type] ?? a.type}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Financial Tab ── */}
        <TabsContent value="financial" className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-2">
            {/* Collection Chart */}
            <Card>
              <CardHeader className="border-b border-border/60 pb-3 mb-0">
                <CardTitle>Payment Collection — Last 7 Days</CardTitle>
                <p className="text-[12px] text-muted-foreground">Daily collected vs pending</p>
              </CardHeader>
              <CardContent className="pt-4">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={collectionData} barCategoryGap="30%">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} opacity={0.5} />
                    <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `₹${v.toLocaleString("en-IN")}`} />
                    <Bar dataKey="collected" fill="var(--color-primary)" radius={[6, 6, 0, 0]} name="Collected" />
                    <Bar dataKey="pending"   fill="var(--color-accent)"  radius={[6, 6, 0, 0]} name="Pending" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-2 flex items-center justify-center gap-5 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1.5"><span className="h-2 w-3 rounded-sm bg-primary/80" />Collected</span>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-3 rounded-sm bg-accent/80" />Pending</span>
                </div>
              </CardContent>
            </Card>

            {/* Pending Dues Breakdown */}
            <Card>
              <CardHeader className="border-b border-border/60 pb-3 mb-0">
                <CardTitle>Pending Dues Breakdown</CardTitle>
                <p className="text-[12px] text-muted-foreground">Overdue bucket analysis</p>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                {pendingDuesData.map((d, i) => {
                  const maxAmt = Math.max(...pendingDuesData.map((x) => x.amount));
                  const pct = maxAmt > 0 ? Math.round((d.amount / maxAmt) * 100) : 0;
                  const trackColors = [
                    "bg-primary",
                    "bg-accent",
                    "bg-warning-foreground",
                  ];
                  return (
                    <div key={d.label} className={`animate-[fade-in_0.35s_ease-out_both] stagger-${i + 1}`}>
                      <div className="flex items-center justify-between text-[12px] mb-1">
                        <div className="flex items-center gap-1.5">
                          <Bell className={`h-3 w-3 ${i >= 2 ? "text-destructive" : "text-muted-foreground"}`} />
                          <span className="font-medium">{d.label}</span>
                          <span className="text-muted-foreground/60">({d.count})</span>
                        </div>
                        <span className="font-bold tabular-nums">₹{d.amount.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="relative h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full ${trackColors[i]} transition-all duration-700`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                <div className="mt-3 rounded-lg border border-destructive/18 bg-destructive/5 p-3 text-[12px] text-destructive font-medium">
                  Total Pending: ₹{pendingDuesData.reduce((s, d) => s + d.amount, 0).toLocaleString("en-IN")} across {pendingDuesData.reduce((s, d) => s + d.count, 0)} invoices
                </div>
              </CardContent>
            </Card>

            {/* Pending Payments Aging Chart */}
            <Card className="lg:col-span-2">
              <CardHeader className="border-b border-border/60 pb-3 mb-0 flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>Pending Payments Aging Chart</CardTitle>
                  <p className="text-[12px] text-muted-foreground">Outstanding amounts across overdue timeframes</p>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={pendingDuesData} barCategoryGap="45%" margin={{ left: -10, right: 8, top: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} opacity={0.5} />
                    <XAxis dataKey="label" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, "Pending Amount"]} />
                    <Bar dataKey="amount" fill="var(--color-accent)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Operations Tab ── */}
        <TabsContent value="operations" className="space-y-5">
          {/* Rental Growth Chart */}
          <Card>
            <CardHeader className="border-b border-border/60 pb-3 mb-0 flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Rental Growth Chart</CardTitle>
                <p className="text-[12px] text-muted-foreground">Monthly new rentals vs returns — {getCurrentFY()}</p>
              </div>
              <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="h-2 w-3 rounded-sm bg-primary" />New Rentals</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-3 rounded-sm bg-accent" />Returns</span>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={rentalGrowthData} margin={{ left: -10, right: 8, top: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} opacity={0.5} />
                  <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="newRentals" stroke="var(--color-primary)" strokeWidth={2} dot={{ r: 3, fill: "var(--color-primary)", strokeWidth: 0 }} name="New Rentals" />
                  <Line type="monotone" dataKey="returns"    stroke="var(--color-accent)"  strokeWidth={1.5} dot={{ r: 2.5, fill: "var(--color-accent)", strokeWidth: 0 }} strokeDasharray="5 4" name="Returns" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Quick metric cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { icon: TrendingUp,  label: "New Rentals",       value: weeklyNewRentals.toString(), color: "text-primary",           borderColor: "border-primary/20" },
              { icon: RotateCcw,  label: "Returns",           value: weeklyReturns.toString(), color: "text-accent",            borderColor: "border-accent/20" },
              { icon: AlertCircle, label: "Maintenance",       value: maintenanceCount.toString(), color: "text-warning-foreground", borderColor: "border-warning/25" },
            ].map((item) => (
              <div
                key={item.label}
                className={`rounded-xl border ${item.borderColor} bg-card p-4 sm:p-6 transition-all hover:shadow-[var(--shadow-elevated)] hover:-translate-y-0.5`}
              >
                <div className="metric-icon h-9 w-9 mb-4">
                  <item.icon className={`h-4 w-4 ${item.color}`} />
                </div>
                <p className="text-[12px] text-muted-foreground">{item.label}</p>
                <p className="mt-1 font-display text-[28px] font-bold tracking-tight">{item.value}</p>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Quick Actions strip */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "New Customer",     desc: "Register a patient",   icon: Users,      to: "/customers" },
          { label: "New Rental",       desc: "Create agreement",     icon: FileText,   to: "/rentals" },
          { label: "Receive Payment",  desc: "Record collection",    icon: CreditCard, to: "/payments" },
          { label: "Return Equipment", desc: "Process return",       icon: RotateCcw,  to: "/returns" },
        ].map((a, i) => (
          <Link
            key={a.label}
            to={a.to}
            className={`group flex items-center gap-3 rounded-xl border border-border/60 bg-card p-4 transition-all duration-200 hover:border-primary/30 hover:shadow-[var(--shadow-elevated)] hover:-translate-y-0.5 animate-[fade-in_0.35s_ease-out_both] stagger-${Math.min(i + 1, 8)}`}
          >
            <div className="metric-icon h-10 w-10 group-hover:bg-primary group-hover:border-primary group-hover:text-primary-foreground transition-all">
              <a.icon className="h-4.5 w-4.5 text-muted-foreground group-hover:text-primary-foreground transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-foreground">{a.label}</p>
              <p className="text-[11px] text-muted-foreground">{a.desc}</p>
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground/40 transition-all group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
