import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef, useMemo } from "react";
import { AppShell, StatusBadge } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { RefreshCw, Search, Plus, CalendarDays, ClipboardList, AlertTriangle, Printer, Eye, QrCode, CheckCircle2, ChevronRight, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { QrScannerModal } from "@/components/QrScannerModal";
import {
  getRentals,
  getCustomers,
  getEquipment,
  getExchanges,
  getNextExchangeNumber,
  peekNextExchangeNumber,
  saveExchange,
  formatDateDDMMYYYY,
  useDatabaseTrigger,
  getLocalYYYYMMDD,
  parseLocalDate,
  sortLatestFirst,
  extractIdNumber,
  formatEquipmentLabel,
} from "@/lib/data-store";

export const Route = createFileRoute("/exchanges")({
  head: () => ({ meta: [{ title: "Exchanges — Relife" }] }),
  component: ExchangesPage,
});

function ExchangesPage() {
  const dbVersion = useDatabaseTrigger();
  const [exchanges, setExchanges] = useState(() => getExchanges());
  const [rentals, setRentals] = useState(() => getRentals());
  const [equipmentList, setEquipmentList] = useState(() => getEquipment());
  const [customersList] = useState(() => getCustomers());
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Dialog States
  const [openCreate, setOpenCreate] = useState(false);
  const [selectedExchange, setSelectedExchange] = useState<any>(null);
  const [completeExchange, setCompleteExchange] = useState<any>(null);

  // Form States
  const [exchangeId, setExchangeId] = useState("");
  const [selectedAgreementId, setSelectedAgreementId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [agreementItems, setAgreementItems] = useState<any[]>([]);
  const [currentEquipmentId, setCurrentEquipmentId] = useState("");
  const [currentEquipmentName, setCurrentEquipmentName] = useState("");
  const [currentEquipmentSerial, setCurrentEquipmentSerial] = useState("");
  const [newEquipmentId, setNewEquipmentId] = useState("");
  const [newEquipmentName, setNewEquipmentName] = useState("");
  const [newEquipmentSerial, setNewEquipmentSerial] = useState("");
  const [exchangeDate, setExchangeDate] = useState("");
  const [releaseCondition, setReleaseCondition] = useState<"Available" | "UnderMaintenance" | "Returned to Owner">("Available");
  const [reason, setReason] = useState("");
  const [exchangeStatus, setExchangeStatus] = useState<"Pending" | "Completed">("Completed");
  const [ownerName, setOwnerName] = useState("");
  const [sourcingStatus, setSourcingStatus] = useState<"HaveInStock" | "NeedFromOwner">("HaveInStock");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const lastSelectedAgreementIdRef = useRef("");



  // Synchronize component state on data changes (replaces manual event listener)
  useEffect(() => {
    setExchanges(getExchanges());
    setRentals(getRentals());
    setEquipmentList(getEquipment());
  }, [dbVersion]);

  // Update lists when the create dialog opens to pull the latest inventory
  useEffect(() => {
    if (openCreate) {
      setEquipmentList(getEquipment());
      setRentals(getRentals());
    }
  }, [openCreate]);

  // H-6: the QR scanner deep-links in with agreementId + equipmentId, but these
  // three effects each re-read window.location.search — and the first one wiped
  // it via replaceState. Effects run in declaration order within a commit, so
  // the second and third always read an already-emptied query string and the
  // scanned equipment was never selected. (/returns handles the same deep link
  // correctly by reading everything in one effect before clearing.)
  //
  // Read the whole query string once, at mount, into state that survives the
  // URL being cleaned.
  const [deepLink] = useState(() => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    const agreementId = params.get("agreementId");
    if (!agreementId) return null;
    return {
      agreementId,
      equipmentId: params.get("equipmentId"),
      newEquipmentId: params.get("newEquipmentId"),
    };
  });

  useEffect(() => {
    if (typeof window === "undefined" || !deepLink) return;
    setSelectedAgreementId(deepLink.agreementId);
    setOpenCreate(true);
    if (deepLink.newEquipmentId) setNewEquipmentId(deepLink.newEquipmentId);
    // Clean query params so a refresh doesn't re-trigger this.
    window.history.replaceState({}, document.title, window.location.pathname);
  }, [deepLink]);

  // Deferred: the equipment list is only known once the agreement has resolved.
  useEffect(() => {
    const eqId = deepLink?.equipmentId;
    if (eqId && agreementItems.some((i) => i.equipmentId === eqId)) {
      setCurrentEquipmentId(eqId);
    }
  }, [agreementItems, deepLink]);



  const refreshData = () => {
    setExchanges(getExchanges());
    setRentals(getRentals());
    setEquipmentList(getEquipment());
  };

  useEffect(() => {
    if (openCreate) {
      setExchangeId(peekNextExchangeNumber());
      setExchangeDate(getLocalYYYYMMDD());
      setSelectedAgreementId("");
      setCustomerName("");
      setCustomerId("");
      setAgreementItems([]);
      setCurrentEquipmentId("");
      setCurrentEquipmentName("");
      setCurrentEquipmentSerial("");
      setNewEquipmentId("");
      setNewEquipmentName("");
      setNewEquipmentSerial("");
      setReleaseCondition("Available");
      setReason("");
      setExchangeStatus("Completed");
      setOwnerName("");
      setSourcingStatus("HaveInStock");
    }
  }, [openCreate]);

  // Handle rental agreement selection change
  useEffect(() => {
    if (selectedAgreementId !== lastSelectedAgreementIdRef.current) {
      lastSelectedAgreementIdRef.current = selectedAgreementId;
      if (selectedAgreementId) {
        const rental = rentals.find((r) => r.id === selectedAgreementId);
        if (rental) {
          setCustomerName(rental.customer);
          setCustomerId(rental.customerId);
          
          let items: any[] = [];
          if (rental.equipmentItems && rental.equipmentItems.length > 0) {
            items = rental.equipmentItems.filter((item: any) => !item.returned);
          } else if (rental.equipmentId) {
            // Fallback legacy support
            const ids = rental.equipmentId.split(",").map((s: string) => s.trim()).filter(Boolean);
            const serials = (rental.serial || "").split(",").map((s: string) => s.trim()).filter(Boolean);
            const names = (rental.equipment || "").split(",").map((s: string) => s.trim()).filter(Boolean);
            items = ids.map((id: string, index: number) => ({
              equipmentId: id,
              serial: serials[index] || "Unknown",
              name: names[index] || rental.equipment || "Equipment"
            }));
          }
          setAgreementItems(items);
          if (items.length > 0) {
            setCurrentEquipmentId(items[0].equipmentId);
          } else {
            setCurrentEquipmentId("");
            setCurrentEquipmentName("");
            setCurrentEquipmentSerial("");
          }
        }
      } else {
        setCustomerName("");
        setCustomerId("");
        setAgreementItems([]);
        setCurrentEquipmentId("");
        setCurrentEquipmentName("");
        setCurrentEquipmentSerial("");
      }
    }
  }, [selectedAgreementId, rentals]);

  // Handle current equipment selection change
  useEffect(() => {
    if (currentEquipmentId) {
      const item = agreementItems.find((i) => i.equipmentId === currentEquipmentId);
      if (item) {
        setCurrentEquipmentName(item.name || getEquipmentNameFromInventory(currentEquipmentId));
        setCurrentEquipmentSerial(item.serial);
      }
      const eq = equipmentList.find((e) => e.id === currentEquipmentId);
      if (eq && eq.owner) {
        setOwnerName(eq.owner);
      } else {
        setOwnerName("");
      }
    } else {
      setCurrentEquipmentName("");
      setCurrentEquipmentSerial("");
      setOwnerName("");
    }
  }, [currentEquipmentId, agreementItems, equipmentList]);

  // Handle new equipment selection change
  useEffect(() => {
    if (newEquipmentId) {
      const eq = equipmentList.find((e) => e.id === newEquipmentId);
      if (eq) {
        setNewEquipmentName(eq.name);
        setNewEquipmentSerial(eq.serial || "");
      }
    } else {
      setNewEquipmentName("");
      setNewEquipmentSerial("");
    }
  }, [newEquipmentId, equipmentList]);

  // Enforce: Cannot complete immediately if item needs to be sourced from owner first
  useEffect(() => {
    if (sourcingStatus === "NeedFromOwner") {
      setExchangeStatus("Pending");
    }
  }, [sourcingStatus]);

  const getEquipmentNameFromInventory = (id: string) => {
    const eq = equipmentList.find((e) => e.id === id);
    return eq ? eq.name : "Unknown Equipment";
  };

  const getCategoryOfEquipment = (id: string) => {
    const eq = equipmentList.find((e) => e.id === id);
    return eq ? eq.category : null;
  };

  // Filter available equipment in database (case-insensitive and trimmed)
  const availableEquipment = equipmentList.filter(
    (e) => String(e.status || "").trim().toLowerCase() === "available"
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    if (!selectedAgreementId) {
      toast.error("Please select a rental agreement");
      setIsSubmitting(false);
      return;
    }
    
    // Date validation
    const rental = rentals.find((r) => r.id === selectedAgreementId);
    if (rental && rental.start) {
      const startD = parseLocalDate(rental.start);
      const exchD = parseLocalDate(exchangeDate);
      if (!isNaN(startD.getTime()) && !isNaN(exchD.getTime()) && exchD < startD) {
        toast.error("Exchange date cannot be earlier than agreement start date.");
        setIsSubmitting(false);
        return;
      }
    }

    if (!currentEquipmentId) {
      toast.error("Agreement has no active equipment to exchange");
      setIsSubmitting(false);
      return;
    }
    if (exchangeStatus === "Completed" && !newEquipmentId) {
      toast.error("Please select a new replacement equipment");
      setIsSubmitting(false);
      return;
    }
    if (newEquipmentId === currentEquipmentId) {
      toast.error("Cannot exchange an item with itself");
      setIsSubmitting(false);
      return;
    }

    // Consume the exchange number counter only at save time for new exchanges
    const finalExchangeId = getNextExchangeNumber();
    setExchangeId(finalExchangeId);

    const payload: any = {
      id: finalExchangeId,
      agreementId: selectedAgreementId,
      customer: customerName,
      customerId,
      currentEquipment: currentEquipmentName,
      currentEquipmentId,
      currentEquipmentSerial,
      newEquipment: newEquipmentName,
      newEquipmentId,
      newEquipmentSerial,
      exchangeDate,
      releaseCondition,
      reason,
      ownerName: sourcingStatus === "HaveInStock" ? "" : ownerName,
      sourcingStatus,
      status: exchangeStatus,
    };

    try {
      saveExchange(payload);
    } catch (err) {
      // setStorageItem re-throws on QuotaExceededError; without this the throw
      // escaped with isSubmitting still true and the Save button stayed dead.
      toast.error("Could not save this exchange — nothing was recorded.", {
        description: err instanceof Error ? err.message : String(err),
        duration: 12000,
      });
      setIsSubmitting(false);
      return;
    }
    toast.success(`Exchange request ${finalExchangeId} saved successfully!`);
    setIsSubmitting(false);
    setOpenCreate(false);
    refreshData();
  };

  // KPI calculations
  const totalSwaps = exchanges.length;
  const pendingSwaps = exchanges.filter((e) => e.status === "Pending").length;
  const completedSwaps = exchanges.filter((e) => e.status === "Completed").length;

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const swapsThisMonth = exchanges.filter((e) => {
    // parseLocalDate, not `new Date`: the raw constructor reads a stored
    // DD-MM-YYYY value as MM-DD-YYYY and treats a bare YYYY-MM-DD as UTC
    // midnight, both of which mis-bucket exchanges around a month boundary.
    const d = parseLocalDate(e.exchangeDate);
    return !isNaN(d.getTime()) && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).length;

  const customers = useMemo(() => getCustomers(), [dbVersion]);

  const filteredExchanges = sortLatestFirst(
    exchanges.filter((e: any) => {
      const q = searchQuery.toLowerCase().trim();
      const customer = customers.find((c: any) => c.name.toLowerCase() === (e.customer || "").toLowerCase() || c.id === e.customerId);

      const matchesSearch = !q ||
        (e.id || "").toLowerCase().includes(q) ||
        (e.customer || "").toLowerCase().includes(q) ||
        (e.agreementId || "").toLowerCase().includes(q) ||
        String(e.currentEquipment || e.oldEquipment || "").toLowerCase().includes(q) ||
        String(e.newEquipment || "").toLowerCase().includes(q) ||
        String(e.currentEquipmentSerial || e.oldEquipmentSerial || "").toLowerCase().includes(q) ||
        String(e.newEquipmentSerial || "").toLowerCase().includes(q) ||
        (customer && (
          String(customer.phone || "").toLowerCase().includes(q) ||
          String(customer.altPhone || "").toLowerCase().includes(q) ||
          String(customer.contactNumber3 || "").toLowerCase().includes(q)
        ));
      
      const matchesStatus = statusFilter === "all" || e.status === statusFilter;

      return matchesSearch && matchesStatus;
    }),
    "exchangeDate"
  );

  const printExchangeSlip = (exc: any) => {
    if (!exc || typeof window === "undefined") return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow popups to print the exchange slip.");
      return;
    }

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Exchange Slip ${exc.id}</title>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      color: #1e293b;
      margin: 0;
      padding: 40px;
      line-height: 1.5;
      background-color: #ffffff;
    }
    .container {
      max-width: 650px;
      margin: 0 auto;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 40px;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
      position: relative;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #3b82f6;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .logo-area h1 {
      font-family: 'Outfit', sans-serif;
      font-size: 26px;
      font-weight: 800;
      color: #1e3a8a;
      margin: 0;
    }
    .logo-area p {
      font-size: 11px;
      color: #64748b;
      margin: 4px 0 0 0;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .slip-title {
      text-align: right;
    }
    .slip-title h2 {
      font-size: 20px;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }
    .slip-title p {
      font-size: 13px;
      color: #64748b;
      margin: 6px 0 0 0;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 30px;
    }
    .meta-box h3 {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      margin: 0 0 8px 0;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 4px;
    }
    .meta-box p {
      font-size: 13.5px;
      font-weight: 600;
      color: #1e293b;
      margin: 4px 0;
    }
    .meta-box p span {
      font-weight: 400;
      color: #64748b;
    }
    .table-section {
      margin-bottom: 30px;
    }
    .table-section h3 {
      font-size: 12px;
      text-transform: uppercase;
      color: #64748b;
      margin: 0 0 12px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    th {
      background-color: #f8fafc;
      color: #475569;
      font-weight: 600;
      text-align: left;
      padding: 10px 12px;
      border-bottom: 1.5px solid #e2e8f0;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #f1f5f9;
      color: #334155;
    }
    .reason-box {
      background-color: #f8fafc;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 40px;
      border-left: 4px solid #3b82f6;
    }
    .reason-box h4 {
      font-size: 11px;
      text-transform: uppercase;
      color: #64748b;
      margin: 0 0 8px 0;
    }
    .reason-box p {
      font-size: 13px;
      margin: 0;
      color: #334155;
    }
    .footer {
      display: flex;
      justify-content: space-between;
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px dashed #e2e8f0;
    }
    .sig-block {
      text-align: center;
      width: 200px;
    }
    .sig-line {
      border-top: 1px solid #94a3b8;
      margin-top: 40px;
      padding-top: 6px;
      font-size: 11px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-area">
        <h1>Relife</h1>
        <p>Medical Technologies</p>
      </div>
      <div class="slip-title">
        <h2>Equipment Exchange Slip</h2>
        <p>ID: ${exc.id}</p>
      </div>
    </div>

    <div class="grid">
      <div class="meta-box">
        <h3>Agreement Details</h3>
        <p><span>Agreement No:</span> ${exc.agreementId}</p>
        <p><span>Customer Name:</span> ${exc.customer}</p>
      </div>
      <div class="meta-box">
        <h3>Exchange Info</h3>
        <p><span>Exchange Date:</span> ${formatDateDDMMYYYY(exc.exchangeDate)}</p>
        <p><span>Status:</span> ${exc.status}</p>
      </div>
    </div>

    <div class="table-section">
      <h3>Equipment Swapped</h3>
      <table>
        <thead>
          <tr>
            <th>Role</th>
            <th>Item Name</th>
            <th>Serial Number</th>
            <th>Status / Condition</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Returned (Old)</strong></td>
            <td>${exc.currentEquipment}</td>
            <td><code>${exc.currentEquipmentSerial}</code></td>
            <td>Released (${
              exc.releaseCondition === "UnderMaintance" || exc.releaseCondition === "UnderMaintenance" 
                ? "Under Maintenance" 
                : (exc.releaseCondition === "Returned to Owner" ? "Returned to Owner" : "Available")
            })</td>
          </tr>
          <tr>
            <td><strong>Assigned (New)</strong></td>
            <td>${exc.newEquipment || "—"}</td>
            <td><code>${exc.newEquipmentSerial || "—"}</code></td>
            <td>${exc.status === "Completed" ? "Active (Rented)" : "Pending Assignment"}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="reason-box">
      <h4>Reason for Exchange</h4>
      <p>${exc.reason || "No reason provided."}</p>
    </div>

    <div class="footer">
      <div class="sig-block">
        <div class="sig-line">Customer Signature</div>
      </div>
      <div class="sig-block">
        <div class="sig-line">Authorized Signatory</div>
      </div>
    </div>
  </div>
  <script>
    window.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        window.print();
      }, 500);
    });
  </script>
</body>
</html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <AppShell title="Equipment Exchanges" subtitle="Manage and process equipment exchange requests under rental agreements">
      
      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:gap-5 md:grid-cols-4 mb-6">
        <Card className="border border-border/50 shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Total Swaps</CardTitle>
            <RefreshCw className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground">{totalSwaps}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Exchanges logged</p>
          </CardContent>
        </Card>
        
        <Card className="border border-border/50 shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Completed Swaps</CardTitle>
            <ClipboardList className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-success">{completedSwaps}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Swaps executed in inventory</p>
          </CardContent>
        </Card>

        <Card className="border border-border/50 shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Pending Requests</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-warning">{pendingSwaps}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Awaiting dispatch/swap</p>
          </CardContent>
        </Card>

        <Card className="border border-border/50 shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Swaps This Month</CardTitle>
            <CalendarDays className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground">{swapsThisMonth}</div>
            <p className="text-[11px] text-muted-foreground mt-1">In {new Date().toLocaleString("en-IN", { month: "long" })}</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Table & Filters ── */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
              <Input
                placeholder="Search Exchange ID, Customer, Agreement..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 border-border/50 text-[13px] rounded-lg focus-visible:ring-1 focus-visible:ring-primary/45 w-full"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[160px] h-10 border-border/50 text-[13px] rounded-lg">
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent className="border border-border/60 bg-popover shadow-elevated rounded-lg">
                <SelectItem value="all" className="text-[13px] cursor-pointer">All Statuses</SelectItem>
                <SelectItem value="Completed" className="text-[13px] cursor-pointer">Completed</SelectItem>
                <SelectItem value="Pending" className="text-[13px] cursor-pointer">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => setOpenCreate(true)} className="h-10 px-4 bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 rounded-lg font-medium text-[13px] shadow-sm cursor-pointer border-0">
            <Plus className="h-4.5 w-4.5" /> New Exchange Request
          </Button>
        </div>

        <Card className="border border-border/50 shadow-soft overflow-hidden">
          {/* Desktop Table — hidden on mobile */}
          <div className="hidden sm:block">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow className="hover:bg-transparent border-b border-border/40">
                  <TableHead className="font-semibold text-muted-foreground/80 h-11 text-[12.5px]">Exchange ID</TableHead>
                  <TableHead className="font-semibold text-muted-foreground/80 h-11 text-[12.5px]">Exchange Date</TableHead>
                  <TableHead className="font-semibold text-muted-foreground/80 h-11 text-[12.5px]">Customer</TableHead>
                  <TableHead className="font-semibold text-muted-foreground/80 h-11 text-[12.5px]">Rent Date</TableHead>
                  <TableHead className="font-semibold text-muted-foreground/80 h-11 text-[12.5px]">Returned Item</TableHead>
                  <TableHead className="font-semibold text-muted-foreground/80 h-11 text-[12.5px]">New Item</TableHead>
                  <TableHead className="font-semibold text-muted-foreground/80 h-11 text-[12.5px]">Reason</TableHead>
                  <TableHead className="font-semibold text-muted-foreground/80 h-11 text-[12.5px]">Status</TableHead>
                  <TableHead className="font-semibold text-muted-foreground/80 h-11 text-[12.5px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExchanges.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-10 text-muted-foreground text-[13px]">
                      No exchange requests found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredExchanges.map((exc) => {
                    const cust = customersList.find((c: any) => c.id === exc.customerId || c.name === exc.customer);
                    const contactNo = cust ? [cust.phone, cust.altPhone].filter(Boolean).join(" / ") : "";
                    const rental = rentals.find((r: any) => r.id === exc.agreementId);
                    const rentDate = rental?.start ? formatDateDDMMYYYY(rental.start) : "—";
                    const oldEq = equipmentList.find((e: any) => e.id === exc.currentEquipmentId);
                    const newEq = equipmentList.find((e: any) => e.id === exc.newEquipmentId);
                    return (
                      <TableRow key={exc.id} className="hover:bg-muted/10 border-b border-border/40 transition-colors">
                        {/* 1. Exchange ID */}
                        <TableCell className="font-semibold text-foreground text-[13px]"><code>{exc.id}</code></TableCell>
                        
                        {/* 2. Exchange Date */}
                        <TableCell className="text-[13px] text-slate-600 whitespace-nowrap">{formatDateDDMMYYYY(exc.exchangeDate)}</TableCell>
                        
                        {/* 3. Customer name with contact numbers */}
                        <TableCell className="text-[13px] font-semibold text-slate-800">
                          <div>{exc.customer}</div>
                          {contactNo && (
                            <div className="text-[11.5px] text-muted-foreground font-normal mt-0.5">{contactNo}</div>
                          )}
                          <div className="text-[9.5px] font-mono text-muted-foreground/60 mt-0.5">Agr: {exc.agreementId}</div>
                        </TableCell>
                        
                        {/* 4. Rent Date */}
                        <TableCell className="text-[13px] text-slate-600 whitespace-nowrap">{rentDate}</TableCell>
                        
                        {/* 5. Returned item(equipment, model & sl.no) */}
                        <TableCell className="text-[13px] text-slate-600 max-w-[220px] leading-tight">
                          {formatEquipmentLabel({
                            name: exc.currentEquipment,
                            model: oldEq?.model || "",
                            serial: exc.currentEquipmentSerial
                          })}
                        </TableCell>
                        
                        {/* 6. New Item (Equipment, Model & sl.no) */}
                        <TableCell className="text-[13px] text-slate-600 max-w-[220px] leading-tight">
                          {exc.newEquipment ? (
                            formatEquipmentLabel({
                              name: exc.newEquipment,
                              model: newEq?.model || "",
                              serial: exc.newEquipmentSerial
                            })
                          ) : (
                            <span className="text-muted-foreground italic text-[12px]">Pending swap</span>
                          )}
                        </TableCell>
                        
                        {/* 7. Reason */}
                        <TableCell className="text-[13px] text-slate-500 max-w-[150px] truncate" title={exc.reason}>{exc.reason}</TableCell>
                        
                        {/* 8. Status */}
                        <TableCell className="text-[13px]"><StatusBadge status={exc.status} /></TableCell>
                        
                        {/* 9. Actions */}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-slate-100 rounded-md"
                              onClick={() => setSelectedExchange(exc)}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4 text-slate-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-slate-100 rounded-md"
                              onClick={() => printExchangeSlip(exc)}
                              title="Print Exchange Slip"
                            >
                              <Printer className="h-4 w-4 text-slate-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card List — visible only on mobile */}
          <div className="sm:hidden">
            {filteredExchanges.length === 0 ? (
              <div className="py-12 text-center text-[13px] text-muted-foreground">
                No exchange requests found.
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {filteredExchanges.map((exc) => (
                  <div
                    key={exc.id}
                    className="flex items-center gap-3 px-4 py-3.5 active:bg-muted/40 transition-colors"
                    onClick={() => setSelectedExchange(exc)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-[13.5px] truncate">{exc.customer}</p>
                        <StatusBadge status={exc.status} />
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="info-row">
                          <RefreshCw className="h-3 w-3 shrink-0" />
                          <span className="truncate">{exc.currentEquipment}</span>
                          <ArrowRight className="h-3 w-3 shrink-0" />
                          <span className="truncate">{exc.newEquipment || "Pending swap"}</span>
                        </span>
                      </div>
                      <p className="text-[10.5px] font-mono text-muted-foreground/60 mt-0.5">{exc.id} · {formatDateDDMMYYYY(exc.exchangeDate)}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* ── CREATE DIALOG ── */}
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="max-w-2xl bg-white border border-slate-100 rounded-[16px] sm:rounded-[20px] p-4 sm:p-6 shadow-[0_20px_50px_rgba(15,23,42,0.06)] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b border-slate-100 pb-3">
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-primary animate-[spin_3s_linear_infinite]" /> Create Exchange Request
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Exchange ID (Auto)</Label>
                <Input value={exchangeId} disabled className="h-10 bg-slate-50 border-slate-200 text-slate-500 font-semibold text-[13px] rounded-lg" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Exchange Date</Label>
                <Input
                  type="date"
                  value={exchangeDate}
                  onChange={(e) => setExchangeDate(e.target.value)}
                  required
                  className="h-10 border-slate-200 text-slate-700 text-[13px] rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Rental Agreement No</Label>
                <Combobox
                  options={rentals
                    .filter((r) => r.status === "Active" || r.status === "Overdue")
                    .map((r) => {
                      const cust = customers.find(c => c.id === r.customerId || (c.name && r.customer && c.name.toLowerCase() === r.customer.toLowerCase()));
                      const phone1 = r.phone || cust?.phone || "";
                      const phone2 = r.altPhone || cust?.altPhone || "";
                      const phone3 = r.contactNumber3 || cust?.contactNumber3 || "";
                      const phones = [phone1, phone2, phone3].filter(Boolean).join(" ");
                      const displayPhone = phone1 ? ` · ${phone1}` : "";
                      return {
                        value: r.id,
                        label: `${r.customer}${displayPhone}`,
                        searchTerms: `${r.id} ${r.customerId || ""} ${r.customer || ""} ${phones} ${r.equipment || ""} ${r.serial || ""}`,
                      };
                    })}
                  value={selectedAgreementId}
                  onValueChange={setSelectedAgreementId}
                  placeholder="Select active rental..."
                  searchPlaceholder="Search agreement no, customer or contact number..."
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Customer</Label>
                <Input value={customerName || "No rental selected"} disabled className="h-10 bg-slate-50 border-slate-200 text-slate-500 font-semibold text-[13px] rounded-lg" />
              </div>
            </div>

            {selectedAgreementId && (
              <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl space-y-4">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-blue-600">Equipment Swap Details</h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Current Equipment (To Return)</Label>
                    <Combobox
                      options={agreementItems.map((item) => {
                        const masterEq = equipmentList.find(e => e.id === item.equipmentId);
                        const name = item.name || masterEq?.name || masterEq?.category || getEquipmentNameFromInventory(item.equipmentId);
                        const model = item.model || masterEq?.model || "";
                        const serial = item.serial || masterEq?.serial || "";
                        const label = formatEquipmentLabel({ name, model, serial });
                        return {
                          value: item.equipmentId,
                          label,
                          searchTerms: `${name} ${model} ${serial}`,
                        };
                      })}
                      value={currentEquipmentId}
                      onValueChange={setCurrentEquipmentId}
                      placeholder="Select item to return..."
                      searchPlaceholder="Search item by name, model, serial..."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">New Equipment (To Swap)</Label>
                    <Combobox
                      options={availableEquipment.map((e) => ({
                        value: e.id,
                        label: formatEquipmentLabel({ name: e.name || e.category, model: e.model, serial: e.serial }),
                        searchTerms: `${e.serial || ""} ${e.name || ""} ${e.category || ""} ${e.model || ""} ${e.owner || ""}`,
                      }))}
                      value={newEquipmentId}
                      onValueChange={setNewEquipmentId}
                      placeholder="Select available item..."
                      searchPlaceholder="Search available inventory..."
                    />
                    {availableEquipment.length === 0 && (
                      <p className="text-[11px] text-destructive mt-1 font-medium">No items available in inventory</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Returned Item Release Condition</Label>
                      <Select value={releaseCondition} onValueChange={(val: any) => setReleaseCondition(val)}>
                        <SelectTrigger className="h-10 border-slate-200 bg-white text-[13px] rounded-lg">
                          <SelectValue placeholder="Select condition" />
                        </SelectTrigger>
                        <SelectContent className="border border-border/60 bg-popover shadow-elevated rounded-lg">
                          <SelectItem value="UnderMaintenance" className="text-[13px] cursor-pointer">Under Maintenance</SelectItem>
                          <SelectItem value="Available" className="text-[13px] cursor-pointer">Good</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Exchange Action</Label>
                      <Select 
                        value={exchangeStatus} 
                        onValueChange={(val: any) => setExchangeStatus(val)}
                      >
                        <SelectTrigger className="h-10 border-slate-200 bg-white text-[13px] rounded-lg disabled:opacity-80 disabled:bg-slate-50">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent className="border border-border/60 bg-popover shadow-elevated rounded-lg">
                          <SelectItem value="Completed" className="text-[13px] cursor-pointer">
                            Completed (Execute Swap Immediately)
                          </SelectItem>
                          <SelectItem value="Pending" className="text-[13px] cursor-pointer">
                            Pending (Log Request Only)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Reason for Exchange</Label>
              <Textarea
                placeholder="Describe why this exchange is needed (e.g., compressor issue, low purity level, upgrading device model)..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                rows={3}
                className="border-slate-200 text-slate-700 text-[13px] rounded-lg resize-none focus-visible:ring-1 focus-visible:ring-primary/45"
              />
            </div>

            <DialogFooter className="border-t border-slate-100 pt-4 flex gap-2 justify-end">
              <DialogClose asChild>
                <Button type="button" variant="outline" className="h-10 rounded-lg text-[13px] border-slate-200 hover:bg-slate-50 cursor-pointer">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" className="h-10 px-5 bg-primary text-primary-foreground hover:bg-primary/95 rounded-lg text-[13px] font-medium cursor-pointer border-0 shadow-sm">
                Save Exchange
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── DETAILS VIEW DIALOG ── */}
      <Dialog open={!!selectedExchange} onOpenChange={(open) => !open && setSelectedExchange(null)}>
        {selectedExchange && (
          <DialogContent className="max-w-xl bg-white border border-slate-100 rounded-[16px] sm:rounded-[20px] p-4 sm:p-6 shadow-[0_20px_50px_rgba(15,23,42,0.06)]">
            <DialogHeader className="border-b border-slate-100 pb-3">
              <DialogTitle className="text-lg font-bold text-slate-900">
                Exchange Details — {selectedExchange.id}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-5 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Agreement No</p>
                  <p className="text-[13px] font-semibold text-primary mt-0.5"><code>{selectedExchange.agreementId}</code></p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Exchange Date</p>
                  <p className="text-[13px] font-semibold text-slate-700 mt-0.5">{formatDateDDMMYYYY(selectedExchange.exchangeDate)}</p>
                </div>
                <div className="mt-2">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Customer</p>
                  <p className="text-[13px] font-semibold text-slate-800 mt-0.5">{selectedExchange.customer}</p>
                </div>
                <div className="mt-2">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Status</p>
                  <div className="mt-0.5"><StatusBadge status={selectedExchange.status} /></div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Equipment Info</h4>
                <div className="border border-slate-100 rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50/50">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="font-semibold text-slate-500 h-9 text-[11px]">Role</TableHead>
                        <TableHead className="font-semibold text-slate-500 h-9 text-[11px]">Equipment</TableHead>
                        <TableHead className="font-semibold text-slate-500 h-9 text-[11px]">Serial</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="hover:bg-transparent">
                        <TableCell className="font-semibold text-red-600 text-[12px] py-2.5">Returned (Old)</TableCell>
                        <TableCell className="text-[12px] text-slate-700 py-2.5">{selectedExchange.currentEquipment}</TableCell>
                        <TableCell className="text-[12px] py-2.5"><code>{selectedExchange.currentEquipmentSerial}</code></TableCell>
                      </TableRow>
                      <TableRow className="hover:bg-transparent">
                        <TableCell className="font-semibold text-success text-[12px] py-2.5">Assigned (New)</TableCell>
                        <TableCell className="text-[12px] text-slate-700 py-2.5">{selectedExchange.newEquipment || "—"}</TableCell>
                        <TableCell className="text-[12px] py-2.5"><code>{selectedExchange.newEquipmentSerial || "—"}</code></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="space-y-1 bg-blue-50/20 border border-blue-50/60 p-3 rounded-lg">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Returned Device Status</p>
                <p className="text-[12.5px] font-medium text-slate-700">Released in inventory as <em className="font-semibold text-slate-800">{
                  selectedExchange.releaseCondition === "UnderMaintance" || selectedExchange.releaseCondition === "UnderMaintenance" 
                    ? "Under Maintenance" 
                    : (selectedExchange.releaseCondition === "Returned to Owner" ? "Returned to Owner" : "Available")
                }</em></p>
              </div>

              {(selectedExchange.ownerName || selectedExchange.sourcingStatus) && (
                <div className="space-y-1 bg-amber-50/30 border border-amber-100/60 p-3 rounded-lg">
                  <p className="text-[10px] uppercase font-bold text-amber-600 tracking-wider">Owner Exchange Info</p>
                  {selectedExchange.ownerName && (
                    <p className="text-[12.5px] font-medium text-slate-700">Owner: <strong>{selectedExchange.ownerName}</strong></p>
                  )}
                  {selectedExchange.sourcingStatus && (
                    <p className="text-[12px] text-slate-600">
                      Sourcing: <strong>{selectedExchange.sourcingStatus === "NeedFromOwner" ? "🔄 Need to Collect from Owner First" : "✅ Gave from Our Stock Directly"}</strong>
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-1">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Reason for Exchange</p>
                <p className="text-[13px] bg-slate-50 p-3 rounded-xl border border-slate-100/60 text-slate-700 leading-normal">{selectedExchange.reason || "No reason specified."}</p>
              </div>

              <DialogFooter className="border-t border-slate-100 pt-4 flex gap-2 justify-end">
                <Button variant="outline" onClick={() => printExchangeSlip(selectedExchange)} className="h-10 rounded-lg text-[13px] border-slate-200 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer">
                  <Printer className="h-4 w-4" /> Print Exchange Slip
                </Button>
                <DialogClose asChild>
                  <Button variant="outline" className="h-10 rounded-lg text-[13px] border-slate-200 hover:bg-slate-50 cursor-pointer">
                    Close
                  </Button>
                </DialogClose>
              </DialogFooter>
            </div>
          </DialogContent>
        )}
      </Dialog>
      
      <CompleteExchangeDialog
        exchange={completeExchange}
        equipmentList={equipmentList}
        open={!!completeExchange}
        onOpenChange={(open) => !open && setCompleteExchange(null)}
        onComplete={refreshData}
      />

    </AppShell>
  );
}

interface CompleteExchangeDialogProps {
  exchange: any;
  equipmentList: any[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

function CompleteExchangeDialog({
  exchange,
  equipmentList,
  open,
  onOpenChange,
  onComplete,
}: CompleteExchangeDialogProps) {
  const [newEquipmentId, setNewEquipmentId] = useState("");
  const [newEquipmentName, setNewEquipmentName] = useState("");
  const [newEquipmentSerial, setNewEquipmentSerial] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch name & serial when newEquipmentId changes
  useEffect(() => {
    if (newEquipmentId) {
      const eq = equipmentList.find((e) => e.id === newEquipmentId);
      if (eq) {
        setNewEquipmentName(eq.name);
        setNewEquipmentSerial(eq.serial || "");
      }
    } else {
      setNewEquipmentName("");
      setNewEquipmentSerial("");
    }
  }, [newEquipmentId, equipmentList]);

  // Determine category of the returned item to filter similar items
  const returnedItemCategory = (() => {
    if (!exchange || !equipmentList) return null;
    const eq = equipmentList.find((e) => e.id === exchange.currentEquipmentId);
    return eq ? eq.category : null;
  })();

  // Filter available equipment of the same category
  const availableEquipment = equipmentList.filter((e) => {
    const isAvailable = String(e.status || "").trim().toLowerCase() === "available";
    const matchesCategory = !returnedItemCategory || e.category === returnedItemCategory;
    return isAvailable && matchesCategory;
  });

  const handleConfirm = () => {
    if (!newEquipmentId) {
      toast.error("Please select a replacement equipment item.");
      return;
    }
    setIsSubmitting(true);

    const payload = {
      ...exchange,
      newEquipmentId,
      newEquipment: newEquipmentName,
      newEquipmentSerial,
      releaseCondition: exchange.releaseCondition || "UnderMaintenance",
      status: "Completed" as const,
    };

    saveExchange(payload);
    toast.success(`Exchange ${exchange.id} successfully completed!`);
    setIsSubmitting(false);
    onOpenChange(false);
    onComplete();
  };

  if (!exchange) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white border border-slate-100 rounded-[16px] sm:rounded-[20px] p-4 sm:p-6 shadow-[0_20px_50px_rgba(15,23,42,0.06)]">
        <DialogHeader className="border-b border-slate-100 pb-3">
          <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-success" /> Complete Exchange Request
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="bg-slate-50 p-4 rounded-xl space-y-2 text-[13px] text-slate-700">
            <p><strong>Exchange ID:</strong> <code>{exchange.id}</code></p>
            <p><strong>Customer:</strong> {exchange.customer} (<code>{exchange.agreementId}</code>)</p>
            <p><strong>Returned Item:</strong> {exchange.currentEquipment} (Sr: <code>{exchange.currentEquipmentSerial}</code>)</p>
            {returnedItemCategory && <p><strong>Category:</strong> <span className="font-semibold text-primary">{returnedItemCategory}</span></p>}
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Select Replacement Equipment (In-Stock)</Label>
            <Combobox
              options={availableEquipment.map((e) => ({
                value: e.id,
                label: e.serial ? `${e.name} — ${e.serial}` : e.name,
              }))}
              value={newEquipmentId}
              onValueChange={setNewEquipmentId}
              placeholder="Select available replacement item..."
              searchPlaceholder="Search available inventory..."
            />
            {availableEquipment.length === 0 && (
              <p className="text-[11px] text-destructive font-medium">No items available in this category ({returnedItemCategory || "N/A"})</p>
            )}
          </div>
        </div>

        <DialogFooter className="border-t border-slate-100 pt-4 flex gap-2 justify-end mt-4">
          <DialogClose asChild>
            <Button variant="outline" className="h-10 rounded-lg text-[13px]">Cancel</Button>
          </DialogClose>
          <Button onClick={handleConfirm} disabled={isSubmitting || !newEquipmentId} className="h-10 px-5 bg-success hover:bg-success/90 text-white rounded-lg text-[13px] font-semibold border-0">
            Confirm &amp; Complete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
