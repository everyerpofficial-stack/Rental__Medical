import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Plus, Search, Download, Printer, FileSpreadsheet, FileText, Trash2, Edit,
  TrendingUp, TrendingDown, Wallet, Calendar, Building2, Filter, ArrowUpRight, ArrowDownRight,
  PieChart as PieIcon, BarChart3
} from "lucide-react";
import {
  getIncomeExpenses,
  saveIncomeExpense,
  deleteIncomeExpense,
  getNextIncomeExpenseNumber,
  printIncomeExpensesPDF,
  downloadExcel,
  useDatabaseTrigger,
  formatDateDDMMYYYY,
  getLocalYYYYMMDD,
  IncomeExpenseItem,
} from "@/lib/data-store";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell
} from "recharts";

export const Route = createFileRoute("/expenses")({
  head: () => ({ meta: [{ title: "Income & Expense — Ledger Cash Flow" }] }),
  component: ExpensesPage,
});

const DEFAULT_ENTITIES = ["All Entities", "ReLife Medical Technologies", "ReLife Healthcare"];

const CATEGORIES_INCOME = [
  "Equipment Rentals",
  "Accessories & Spares Sales",
  "Device Maintenance",
  "Oxygen Cylinder Refills",
  "Security Deposit Forfeiture",
  "Other Medical Income",
];

const CATEGORIES_EXPENSE = [
  "Office & Warehouse Rent",
  "Biomedical Staff Salaries",
  "Equipment Restock & Parts",
  "Electricity & Utility",
  "Device Repairs & Service",
  "Travel & Delivery Conveyance",
  "Marketing & Operations",
  "Other Medical Expense",
];

const CHART_COLORS = ["#0284c7", "#16a34a", "#eab308", "#f97316", "#8b5cf6", "#ec4899", "#64748b"];

function ExpensesPage() {
  const dbVersion = useDatabaseTrigger();
  const [entries, setEntries] = useState<IncomeExpenseItem[]>([]);
  const [selectedEntity, setSelectedEntity] = useState("All Entities");
  const [dateScope, setDateScope] = useState<"all" | "today" | "this-month" | "next-month" | "custom">("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "Income" | "Expense">("all");

  // Modal states
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<IncomeExpenseItem | null>(null);

  const refreshData = () => {
    setEntries(getIncomeExpenses());
  };

  useEffect(() => {
    refreshData();
  }, [dbVersion]);

  // Available unique entities from database + default
  const entityOptions = useMemo(() => {
    const fromData = Array.from(new Set(entries.map((e) => e.entity).filter(Boolean)));
    const combined = Array.from(new Set([...DEFAULT_ENTITIES, ...fromData]));
    return combined;
  }, [entries]);

  // Date scope calculation
  const filteredByScope = useMemo(() => {
    const todayStr = getLocalYYYYMMDD(new Date());
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    return entries.filter((e) => {
      // 1. Entity Filter
      if (selectedEntity !== "All Entities" && e.entity.toLowerCase() !== selectedEntity.toLowerCase()) {
        return false;
      }

      // 2. Type Filter
      if (typeFilter !== "all" && e.type !== typeFilter) {
        return false;
      }

      // 3. Search Query
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches =
          e.id.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q) ||
          e.entity.toLowerCase().includes(q) ||
          (e.description || "").toLowerCase().includes(q) ||
          (e.referenceNo || "").toLowerCase().includes(q);
        if (!matches) return false;
      }

      // 4. Date Scope
      if (!e.date) return dateScope === "all";
      const entryDate = new Date(e.date);

      if (dateScope === "today") {
        return e.date === todayStr;
      } else if (dateScope === "this-month") {
        return entryDate.getFullYear() === currentYear && entryDate.getMonth() === currentMonth;
      } else if (dateScope === "next-month") {
        const nextM = (currentMonth + 1) % 12;
        const nextY = nextM === 0 ? currentYear + 1 : currentYear;
        return entryDate.getFullYear() === nextY && entryDate.getMonth() === nextM;
      } else if (dateScope === "custom") {
        if (customFrom && e.date < customFrom) return false;
        if (customTo && e.date > customTo) return false;
        return true;
      }

      return true;
    });
  }, [entries, selectedEntity, dateScope, customFrom, customTo, search, typeFilter]);

  // Financial KPIs
  const totalIncome = useMemo(() => {
    return filteredByScope
      .filter((e) => e.type === "Income")
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [filteredByScope]);

  const totalExpenses = useMemo(() => {
    return filteredByScope
      .filter((e) => e.type === "Expense")
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [filteredByScope]);

  const netBalance = totalIncome - totalExpenses;

  // Year to Date Cash Flow
  const ytdNetCash = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return entries
      .filter((e) => {
        if (selectedEntity !== "All Entities" && e.entity.toLowerCase() !== selectedEntity.toLowerCase()) return false;
        if (!e.date) return false;
        const d = new Date(e.date);
        return d.getFullYear() === currentYear;
      })
      .reduce((acc, e) => acc + (e.type === "Income" ? Number(e.amount) || 0 : -(Number(e.amount) || 0)), 0);
  }, [entries, selectedEntity]);

  // Recharts Monthly Trend
  const monthlyChartData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentYear = new Date().getFullYear();

    const dataMap = months.map((m) => ({ month: m, Income: 0, Expense: 0 }));

    entries.forEach((e) => {
      if (selectedEntity !== "All Entities" && e.entity.toLowerCase() !== selectedEntity.toLowerCase()) return;
      if (!e.date) return;
      const d = new Date(e.date);
      if (d.getFullYear() === currentYear) {
        const mIdx = d.getMonth();
        if (e.type === "Income") {
          dataMap[mIdx].Income += Number(e.amount) || 0;
        } else {
          dataMap[mIdx].Expense += Number(e.amount) || 0;
        }
      }
    });

    return dataMap;
  }, [entries, selectedEntity]);

  // Recharts Category Pie Chart Data
  const categoryChartData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredByScope.forEach((e) => {
      const key = `${e.category} (${e.type})`;
      map[key] = (map[key] || 0) + (Number(e.amount) || 0);
    });

    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filteredByScope]);

  // Export PDF Handler
  const handleExportPDF = () => {
    if (filteredByScope.length === 0) {
      toast.info("No transaction entries available in current scope to export.");
      return;
    }
    const scopeLabel =
      dateScope === "all"
        ? "All Time Data"
        : dateScope === "today"
        ? "Today's Ledger"
        : dateScope === "this-month"
        ? "This Month"
        : dateScope === "next-month"
        ? "Next Month"
        : `Custom Range (${customFrom || "Start"} to ${customTo || "End"})`;

    printIncomeExpensesPDF(filteredByScope, selectedEntity, scopeLabel);
    toast.success(`Generating PDF statement for ${selectedEntity}...`);
  };

  // Export Excel Handler
  const handleExportExcel = () => {
    if (filteredByScope.length === 0) {
      toast.info("No transaction entries available in current scope to export.");
      return;
    }

    const headers = [
      "Tx ID",
      "Date",
      "Entity",
      "Type",
      "Category",
      "Amount (Rs)",
      "Payment Mode",
      "Ref Number",
      "Description",
    ];

    const rows = filteredByScope.map((e) => [
      e.id,
      formatDateDDMMYYYY(e.date),
      e.entity,
      e.type,
      e.category,
      (e.type === "Income" ? e.amount : -e.amount).toString(),
      e.paymentMode,
      e.referenceNo || "",
      e.description || "",
    ]);

    const filename = `Ledger_Cash_Flow_${selectedEntity.replace(/\s+/g, "_")}.xls`;
    downloadExcel(filename, headers, rows, [110, 110, 150, 100, 180, 120, 120, 140, 250]);
    toast.success(`Ledger report exported to Excel successfully.`);
  };

  return (
    <AppShell
      title="Ledger Cash Flow"
      subtitle={`${selectedEntity} · Income & Expense Audit Console`}
      actions={
        <div className="flex items-center gap-2 flex-wrap">
          {/* Entity Selector */}
          <Select value={selectedEntity} onValueChange={setSelectedEntity}>
            <SelectTrigger className="w-[180px] h-9 text-[12.5px] bg-background font-medium border-slate-200">
              <Building2 className="h-3.5 w-3.5 mr-1.5 text-primary shrink-0" />
              <SelectValue placeholder="Select Business" />
            </SelectTrigger>
            <SelectContent>
              {entityOptions.map((entity) => (
                <SelectItem key={entity} value={entity} className="text-[12.5px]">
                  {entity}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Export PDF Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
            className="h-9 text-[12px] font-semibold border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm"
          >
            <FileText className="mr-1.5 h-3.5 w-3.5 text-destructive" />
            Export PDF
          </Button>

          {/* Export Excel Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            className="h-9 text-[12px] font-semibold border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm"
          >
            <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5 text-success" />
            Export Excel
          </Button>

          {/* Add Income / Expense Button */}
          <Button
            size="sm"
            className="h-9 text-[12px] font-semibold shadow-sm"
            onClick={() => {
              setEditingItem(null);
              setFormOpen(true);
            }}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add Income / Expense
          </Button>
        </div>
      }
    >
      {/* Date Scope Filter Strip */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 bg-muted/40 p-2.5 rounded-xl border border-border/50">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mr-1 flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-primary" /> Date Scope:
          </span>
          <Button
            variant={dateScope === "all" ? "default" : "ghost"}
            size="sm"
            className="h-7 text-[12px] rounded-lg px-3"
            onClick={() => setDateScope("all")}
          >
            All Time
          </Button>
          <Button
            variant={dateScope === "today" ? "default" : "ghost"}
            size="sm"
            className="h-7 text-[12px] rounded-lg px-3"
            onClick={() => setDateScope("today")}
          >
            Today
          </Button>
          <Button
            variant={dateScope === "this-month" ? "default" : "ghost"}
            size="sm"
            className="h-7 text-[12px] rounded-lg px-3"
            onClick={() => setDateScope("this-month")}
          >
            This Month
          </Button>
          <Button
            variant={dateScope === "next-month" ? "default" : "ghost"}
            size="sm"
            className="h-7 text-[12px] rounded-lg px-3"
            onClick={() => setDateScope("next-month")}
          >
            Next Month
          </Button>
          <Button
            variant={dateScope === "custom" ? "default" : "ghost"}
            size="sm"
            className="h-7 text-[12px] rounded-lg px-3"
            onClick={() => setDateScope("custom")}
          >
            Custom Range
          </Button>
        </div>

        {dateScope === "custom" && (
          <div className="flex items-center gap-2">
            <Input
              type="date"
              className="h-7 text-[11px] w-[130px]"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
            />
            <span className="text-[12px] text-muted-foreground">to</span>
            <Input
              type="date"
              className="h-7 text-[11px] w-[130px]"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
            />
          </div>
        )}

        <div className="text-[11.5px] font-medium text-muted-foreground">
          Showing data for: <strong className="text-foreground">{selectedEntity}</strong>
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {/* Total Income */}
        <Card className="relative overflow-hidden hover:shadow-[var(--shadow-elevated)] transition-all">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground/75">
                  Total Income
                </p>
                <p className="mt-2 font-display text-[26px] font-bold tracking-tight text-success">
                  ₹{totalIncome.toLocaleString("en-IN")}
                </p>
              </div>
              <div className="h-10 w-10 shrink-0 rounded-xl bg-success/10 text-success flex items-center justify-center">
                <ArrowUpRight className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-2 text-[11.5px] text-muted-foreground">Period cash inflow</p>
          </CardContent>
          <div className="absolute inset-x-0 bottom-0 h-[2.5px] bg-success" />
        </Card>

        {/* Total Expenses */}
        <Card className="relative overflow-hidden hover:shadow-[var(--shadow-elevated)] transition-all">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground/75">
                  Total Expenses
                </p>
                <p className="mt-2 font-display text-[26px] font-bold tracking-tight text-destructive">
                  ₹{totalExpenses.toLocaleString("en-IN")}
                </p>
              </div>
              <div className="h-10 w-10 shrink-0 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center">
                <ArrowDownRight className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-2 text-[11.5px] text-muted-foreground">Period cash outflow</p>
          </CardContent>
          <div className="absolute inset-x-0 bottom-0 h-[2.5px] bg-destructive" />
        </Card>

        {/* Net Balance */}
        <Card className="relative overflow-hidden hover:shadow-[var(--shadow-elevated)] transition-all">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground/75">
                  Net Balance
                </p>
                <p className={`mt-2 font-display text-[26px] font-bold tracking-tight ${
                  netBalance >= 0 ? "text-primary" : "text-destructive"
                }`}>
                  {netBalance >= 0 ? "+" : ""}₹{netBalance.toLocaleString("en-IN")}
                </p>
              </div>
              <div className="h-10 w-10 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Wallet className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-2 text-[11.5px] text-muted-foreground">Inflow – Outflow</p>
          </CardContent>
          <div className="absolute inset-x-0 bottom-0 h-[2.5px] bg-primary" />
        </Card>

        {/* YTD Net Cash */}
        <Card className="relative overflow-hidden hover:shadow-[var(--shadow-elevated)] transition-all">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground/75">
                  YTD Net Cash
                </p>
                <p className="mt-2 font-display text-[26px] font-bold tracking-tight text-accent">
                  {ytdNetCash >= 0 ? "+" : ""}₹{ytdNetCash.toLocaleString("en-IN")}
                </p>
              </div>
              <div className="h-10 w-10 shrink-0 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-2 text-[11.5px] text-muted-foreground">Net total for year {new Date().getFullYear()}</p>
          </CardContent>
          <div className="absolute inset-x-0 bottom-0 h-[2.5px] bg-accent" />
        </Card>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Monthly Trend Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-[14px] font-bold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" /> Monthly Income vs Expense
            </CardTitle>
            <span className="text-[11px] text-muted-foreground font-normal">Full Year ({new Date().getFullYear()})</span>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} tickFormatter={(val) => `₹${val / 1000}k`} />
                  <Tooltip formatter={(val: any) => [`₹${Number(val).toLocaleString("en-IN")}`, ""]} />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                  <Bar dataKey="Income" fill="#16a34a" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Expense" fill="#dc2626" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown Donut */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-[14px] font-bold flex items-center gap-2">
              <PieIcon className="h-4 w-4 text-primary" /> Breakdown By Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full flex items-center justify-center">
              {categoryChartData.length === 0 ? (
                <p className="text-[12.5px] text-muted-foreground text-center">No category data for selected range</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: any) => [`₹${Number(val).toLocaleString("en-IN")}`, "Amount"]} />
                    <Legend wrapperStyle={{ fontSize: 10, paddingTop: 5 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Log Table Card */}
      <Card>
        <CardHeader className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 border-b border-border/60">
          <div className="flex items-center gap-3 flex-wrap flex-1 min-w-[260px]">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search category, ref no, remarks..."
                className="pl-9 h-9 text-[12.5px]"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Select value={typeFilter} onValueChange={(val: any) => setTypeFilter(val)}>
              <SelectTrigger className="w-[140px] h-9 text-[12px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Income">Income (+)</SelectItem>
                <SelectItem value="Expense">Expense (-)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="text-[12px] font-semibold text-muted-foreground">
            {filteredByScope.length} transaction entries
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-[100px]">Date</TableHead>
                <TableHead>Business Entity</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Amount (₹)</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Ref No.</TableHead>
                <TableHead className="min-w-[200px]">Remarks / Description</TableHead>
                <TableHead className="w-[80px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredByScope.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-12 text-center text-muted-foreground text-[13px]">
                    No income or expense entries match your filter.
                  </TableCell>
                </TableRow>
              ) : (
                filteredByScope.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/40">
                    <TableCell className="font-medium text-[12.5px] whitespace-nowrap">
                      {formatDateDDMMYYYY(item.date)}
                    </TableCell>
                    <TableCell className="font-semibold text-[13px] text-foreground">
                      {item.entity}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold ${
                        item.type === "Income"
                          ? "bg-success/15 text-success border border-success/30"
                          : "bg-destructive/15 text-destructive border border-destructive/30"
                      }`}>
                        {item.type}
                      </span>
                    </TableCell>
                    <TableCell className="text-[12.5px] font-medium text-foreground">
                      {item.category}
                    </TableCell>
                    <TableCell className={`text-right font-mono font-bold text-[13px] whitespace-nowrap ${
                      item.type === "Income" ? "text-success" : "text-destructive"
                    }`}>
                      {item.type === "Income" ? "+" : "-"}₹{Number(item.amount).toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell className="text-[12px] text-muted-foreground">
                      {item.paymentMode}
                    </TableCell>
                    <TableCell className="text-[11.5px] font-mono text-muted-foreground">
                      {item.referenceNo || "—"}
                    </TableCell>
                    <TableCell className="text-[12px] text-muted-foreground leading-snug">
                      {item.description || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-primary"
                          onClick={() => {
                            setEditingItem(item);
                            setFormOpen(true);
                          }}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => {
                            deleteIncomeExpense(item.id);
                            toast.success(`Entry "${item.category}" deleted.`);
                            refreshData();
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add / Edit Transaction Form Dialog */}
      <IncomeExpenseFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        initialItem={editingItem}
        defaultEntity={selectedEntity === "All Entities" ? "ReLife Medical Technologies" : selectedEntity}
        onSave={refreshData}
      />
    </AppShell>
  );
}

// ─── Modal Form Component ───────────────────────────────────────────────────
function IncomeExpenseFormDialog({
  open,
  onClose,
  initialItem,
  defaultEntity,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  initialItem: IncomeExpenseItem | null;
  defaultEntity: string;
  onSave: () => void;
}) {
  const [entity, setEntity] = useState(defaultEntity);
  const [type, setType] = useState<"Income" | "Expense">("Income");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("Bank Transfer");
  const [date, setDate] = useState(getLocalYYYYMMDD(new Date()));
  const [referenceNo, setReferenceNo] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (initialItem) {
      setEntity(initialItem.entity);
      setType(initialItem.type);
      setCategory(initialItem.category);
      setAmount(initialItem.amount.toString());
      setPaymentMode(initialItem.paymentMode);
      setDate(initialItem.date);
      setReferenceNo(initialItem.referenceNo || "");
      setDescription(initialItem.description || "");
    } else {
      setEntity(defaultEntity);
      setType("Income");
      setCategory(CATEGORIES_INCOME[0]);
      setAmount("");
      setPaymentMode("Bank Transfer");
      setDate(getLocalYYYYMMDD(new Date()));
      setReferenceNo("");
      setDescription("");
    }
  }, [initialItem, open, defaultEntity]);

  // Guards a double-submit: without it a second click created a second entry
  // with a fresh getNextIncomeExpenseNumber() id, and nothing de-duplicated them.
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    const numAmt = parseFloat(amount);
    if (isNaN(numAmt) || numAmt <= 0) {
      toast.error("Please enter a valid amount greater than 0");
      return;
    }
    if (!category.trim()) {
      toast.error("Please select or enter a category");
      return;
    }

    const newItem: IncomeExpenseItem = {
      id: initialItem?.id || getNextIncomeExpenseNumber(),
      date,
      entity,
      type,
      category: category.trim(),
      amount: numAmt,
      paymentMode,
      referenceNo: referenceNo.trim() || undefined,
      description: description.trim() || undefined,
    };

    if (isSaving) return;
    setIsSaving(true);
    try {
      saveIncomeExpense(newItem);
    } catch (err) {
      // setStorageItem re-throws on QuotaExceededError. Without this the throw
      // escaped the handler, no toast fired, and the dialog just sat there.
      toast.error("Could not save this entry — nothing was recorded.", {
        description: err instanceof Error ? err.message : String(err),
        duration: 12000,
      });
      return;
    } finally {
      setIsSaving(false);
    }
    toast.success(`${type} entry of ₹${numAmt.toLocaleString("en-IN")} saved for ${entity}!`);
    onSave();
    onClose();
  };

  const categories = type === "Income" ? CATEGORIES_INCOME : CATEGORIES_EXPENSE;

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[16px] font-bold flex items-center gap-2">
            {initialItem ? <Edit className="h-4 w-4 text-primary" /> : <Plus className="h-4 w-4 text-primary" />}
            {initialItem ? "Edit Transaction Entry" : "Record Income / Expense"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Business Entity */}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Business Entity / Account
            </Label>
            <Select value={entity} onValueChange={setEntity}>
              <SelectTrigger className="h-10 text-[13px]">
                <SelectValue placeholder="Select Business" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ReLife Medical Technologies">ReLife Medical Technologies</SelectItem>
                <SelectItem value="ReLife Healthcare">ReLife Healthcare</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Type Switcher */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={type === "Income" ? "default" : "outline"}
              className={`h-10 text-[13px] font-semibold ${
                type === "Income" ? "bg-success hover:bg-success/90 text-white" : ""
              }`}
              onClick={() => {
                setType("Income");
                setCategory(CATEGORIES_INCOME[0]);
              }}
            >
              + Income (Cash In)
            </Button>
            <Button
              type="button"
              variant={type === "Expense" ? "default" : "outline"}
              className={`h-10 text-[13px] font-semibold ${
                type === "Expense" ? "bg-destructive hover:bg-destructive/90 text-white" : ""
              }`}
              onClick={() => {
                setType("Expense");
                setCategory(CATEGORIES_EXPENSE[0]);
              }}
            >
              - Expense (Cash Out)
            </Button>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Category
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-10 text-[13px]">
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c} value={c} className="text-[13px]">
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Amount (₹)
              </Label>
              <Input
                type="number"
                placeholder="e.g. 15000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-10 text-[13px] font-bold"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Transaction Date
              </Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-10 text-[13px]"
                required
              />
            </div>
          </div>

          {/* Payment Mode & Ref No */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Payment Mode
              </Label>
              <Select value={paymentMode} onValueChange={setPaymentMode}>
                <SelectTrigger className="h-10 text-[13px]">
                  <SelectValue placeholder="Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="UPI">UPI / GPay / PhonePe</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer (NEFT/RTGS)</SelectItem>
                  <SelectItem value="Cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Reference / Tx ID
              </Label>
              <Input
                type="text"
                placeholder="e.g. UPI/10923/JF"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                className="h-10 text-[13px]"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Remarks / Description
            </Label>
            <Textarea
              placeholder="Notes or transaction details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[60px] text-[13px] resize-none"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {initialItem ? "Save Changes" : "Save Transaction"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
