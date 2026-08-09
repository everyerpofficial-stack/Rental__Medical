import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { AppShell, StatusBadge } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from "@/components/ui/dialog";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plus, Search, Download, Printer, IndianRupee, CreditCard, Wallet,
  Building2, Banknote, MoreHorizontal, Edit, Trash2, Receipt, History, ChevronRight,
} from "lucide-react";
import {
  getPayments,
  savePayment,
  deletePayment,
  getCustomers,
  getRentals,
  downloadFile,
  downloadExcel,
  printReceipt,
  getOwners,
  getEquipment,
  useDatabaseTrigger,
  getNextPaymentNumber,
  getLocalYYYYMMDD,
  parseLocalDate,
  extractIdNumber,
  sortLatestFirst,
} from "@/lib/data-store";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";

// Bug fix #7: Proper Payment interface instead of typeof payments[number] (was `any`)
export interface Payment {
  id: string;
  date: string;
  amount: number;
  type: "Rent" | "Deposit" | "Refund" | "Additional Charges";
  mode: string;
  status: "Paid" | "Pending" | "Failed";
  agreement: string;
  customerId: string;
  customer: string;
  owner?: string;
  notes?: string;
  [key: string]: unknown;
}

export const Route = createFileRoute("/payments")({
  head: () => ({ meta: [{ title: "Payments — MediRent" }] }),
  component: PaymentsPage,
});

const modeColors: Record<string, string> = {
  Bank:            "bg-primary/8 text-primary border-primary/18",
  UPI:             "bg-primary/8 text-primary border-primary/18",
  Cash:            "bg-success/8 text-success border-success/18",
  "Cash+Bank":     "bg-success/8 text-success border-success/18",
  NEFT:            "bg-accent/8 text-accent border-accent/18",
  IMPS:            "bg-accent/8 text-accent border-accent/18",
  Cheque:          "bg-warning/10 text-warning-foreground border-warning/22",
  "Bank Transfer": "bg-primary/8 text-primary border-primary/18",
  "Credit Card":   "bg-destructive/8 text-destructive border-destructive/18",
  "Debit Card":    "bg-muted text-muted-foreground border-border/60",
};

const typeColors: Record<string, string> = {
  Rent:               "bg-primary/8 text-primary border-primary/18",
  Deposit:            "bg-accent/8 text-accent border-accent/18",
  Refund:             "bg-success/8 text-success border-success/18",
  "Additional Charges":"bg-warning/10 text-warning-foreground border-warning/22",
};

const tooltipStyle = {
  background: "var(--color-popover)",
  border: "1px solid var(--color-border)",
  borderRadius: 10,
  boxShadow: "var(--shadow-elevated)",
  padding: "8px 12px",
  fontSize: 12,
  color: "var(--color-foreground)",
};

function CollectPaymentDialog({
  title = "Collect Payment",
  payment,
  trigger,
  onSave,
}: {
  title?: string;
  payment?: Payment;
  trigger?: React.ReactNode;
  onSave?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"Rent" | "Deposit" | "Refund" | "Additional Charges">(
    (payment?.type as "Rent" | "Deposit" | "Refund" | "Additional Charges") ?? "Rent"
  );
  const [date, setDate] = useState(payment?.date ?? getLocalYYYYMMDD());
  const [customerId, setCustomerId] = useState(payment?.customerId ?? "");
  const [agreement, setAgreement] = useState(payment?.agreement ?? "");
  const [amount, setAmount] = useState(payment?.amount?.toString() ?? "");
  const [mode, setMode] = useState((payment?.mode as string) ?? "Bank");
  const [txRef, setTxRef] = useState((payment?.txRef as string) ?? "");
  const [notes, setNotes] = useState((payment?.notes as string) ?? "");
  const [collectedBy, setCollectedBy] = useState((payment?.collectedBy as string) || "Admin");
  const [owner, setOwner] = useState((payment?.owner as string) || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const customers = getCustomers();
  const rentals = getRentals();

  // Reset dialog state when opened
  useEffect(() => {
    if (open) {
      setType((payment?.type as "Rent" | "Deposit" | "Refund" | "Additional Charges") ?? "Rent");
      setDate(payment?.date ?? getLocalYYYYMMDD());
      setCustomerId(payment?.customerId ?? "");
      setAgreement(payment?.agreement ?? "");
      setAmount(payment?.amount?.toString() ?? "");
      setMode((payment?.mode as string) ?? "Bank");
      setTxRef((payment?.txRef as string) ?? "");
      setNotes((payment?.notes as string) ?? "");
      setCollectedBy((payment?.collectedBy as string) ?? "Dr. Rao");
      setOwner((payment?.owner as string) ?? "");
    }
  }, [open, payment]);

  // Auto-detect customer and owner when agreement changes
  useEffect(() => {
    if (agreement) {
      const selectedRental = rentals.find((r) => r.id === agreement);
      if (selectedRental) {
        if (selectedRental.customerId) {
          setCustomerId(selectedRental.customerId);
        }
        
        // Auto-fill amount based on rental
        if (type === "Rent") {
          setAmount(selectedRental.monthlyRent.toString());
        } else if (type === "Deposit") {
          setAmount(selectedRental.deposit.toString());
        }

        // CALC-2 FIX: Handle multi-equipment rentals (comma-separated IDs)
        const allEquipIds = (selectedRental.equipmentId || "")
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean);
        const allEquipment = getEquipment();
        const ownerFound = allEquipIds
          .map((id: string) => allEquipment.find((e) => e.id === id))
          .find((eq: any) => eq?.owner);
        if (ownerFound?.owner) {
          setOwner(ownerFound.owner);
        }
      }
    }
  }, [agreement, rentals, type]);

  // If customerId changes, clear selected agreement if it does not belong to the selected customer
  useEffect(() => {
    if (customerId) {
      const selectedRental = rentals.find((r) => r.id === agreement);
      if (selectedRental && selectedRental.customerId !== customerId) {
        setAgreement("");
      }
    }
  }, [customerId, rentals, agreement]);

  const handlePrintForm = () => {
    const selectedCustomer = customers.find((c) => c.id === customerId);
    const tempPayment = {
      id: payment?.id || `PAY-TEMP`,
      date,
      customer: selectedCustomer?.name || "Unknown Customer",
      customerId,
      agreement,
      amount: parseFloat(amount) || 0,
      mode,
      type,
      txRef,
      collectedBy,
      owner,
      status: "Paid",
    };
    printReceipt(tempPayment, tempPayment.customer);
    toast.success("Receipt print preview opened.");
  };

  const handleSave = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount.");
      setIsSubmitting(false);
      return;
    }
    if (!agreement) {
      toast.error("Please select a related agreement.");
      setIsSubmitting(false);
      return;
    }
    if (!collectedBy.trim()) {
      toast.error("Collector name is required.");
      setIsSubmitting(false);
      return;
    }

    const id = payment?.id || getNextPaymentNumber();
    const selectedCustomer = customers.find((c) => c.id === customerId);

    const newPayment: Payment = {
      id,
      date,
      customer: selectedCustomer?.name || "Unknown Customer",
      customerId,
      agreement,
      amount: parseFloat(amount) || 0,
      mode,
      type,
      txRef,
      notes,
      collectedBy,
      owner,
      status: "Paid" as const,
    };

    savePayment(newPayment as any);
    toast.success(payment ? "Payment details updated successfully." : "Payment collection recorded successfully.");
    setIsSubmitting(false);
    setOpen(false);
    if (onSave) onSave();
  };

  const owners = getOwners();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? trigger : (
          <Button size="sm">
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Collect Payment
          </Button>
        )}
      </DialogTrigger>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Payment Type</Label>
            <Select value={type} onValueChange={(val) => setType(val as "Rent" | "Deposit" | "Refund" | "Additional Charges")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Rent">Rent Payment</SelectItem>
                <SelectItem value="Deposit">Deposit Payment</SelectItem>
                <SelectItem value="Additional Charges">Additional Charges</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Field label="Payment Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />

          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Customer</Label>
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Agreement Number</Label>
            <Select value={agreement} onValueChange={setAgreement}>
              <SelectTrigger><SelectValue placeholder="Select agreement" /></SelectTrigger>
              <SelectContent>
                {rentals
                  .filter((r) => !customerId || r.customerId === customerId)
                  .map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.id} — {r.customer}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <Field label="Amount (₹)" placeholder="e.g. 4500" value={amount} onChange={(e) => setAmount(e.target.value)} />

          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Payment Mode</Label>
            <Select value={mode} onValueChange={setMode}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="Bank">Bank</SelectItem>
                <SelectItem value="Cash+Bank">Cash+Bank</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Field
            label="Collected By *"
            placeholder="e.g. Dr. Rao"
            value={collectedBy}
            onChange={(e) => setCollectedBy(e.target.value)}
          />
          <Field label="Transaction Reference" placeholder="UPI / NEFT ref no." value={txRef} onChange={(e) => setTxRef(e.target.value)} className="sm:col-span-2" />
          <div className="sm:col-span-2 space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Notes</Label>
            <Textarea placeholder="Additional notes…" className="resize-none min-h-[70px]" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter className="flex-wrap gap-2">
          <Button variant="outline" type="button" onClick={handlePrintForm}><Receipt className="mr-1.5 h-3.5 w-3.5" />Print Receipt</Button>
          <DialogClose asChild>
            <Button variant="outline" type="button">Cancel</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button type="button" onClick={handleSave}>Save Payment</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeletePaymentDialog({ payment, trigger, onDelete }: { payment: Payment; trigger: React.ReactNode; onDelete?: () => void }) {
  const handleDelete = () => {
    deletePayment(payment.id);
    toast.success(`Payment transaction ${payment.id} successfully deleted.`);
    if (onDelete) onDelete();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-destructive flex items-center gap-2">
            <Trash2 className="h-4 w-4" /> Delete Payment
          </DialogTitle>
        </DialogHeader>
        <div className="py-2 space-y-3">
          <p className="text-[13px] text-muted-foreground">
            Delete payment <strong className="text-foreground font-mono">{payment.id}</strong> of ₹{payment.amount.toLocaleString("en-IN")}?
          </p>
          <div className="rounded-lg border border-destructive/18 bg-destructive/5 p-3 text-[12px] text-destructive">
            Deleting a payment will affect the customer's outstanding balance.
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" type="button">Cancel</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button variant="destructive" type="button" onClick={handleDelete}><Trash2 className="mr-1.5 h-3.5 w-3.5" />Delete</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PrintReceiptDialog({ payment }: { payment: Payment }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" title="Print Receipt">
          <Printer className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Payment Receipt</DialogTitle>
        </DialogHeader>
        <div className="py-2 rounded-xl border border-border/60 bg-muted/20 p-5 space-y-3 text-sm">
          <div className="text-center border-b border-border/50 pb-3">
            <p className="font-display text-[16px] font-bold">MediRent Healthcare</p>
            <p className="text-[12px] text-muted-foreground">Payment Receipt</p>
            <p className="font-mono text-[11px] font-bold text-primary mt-1">{payment.id}</p>
          </div>
          {[
            { l: "Date",      v: payment.date },
            { l: "Customer",  v: payment.customer },
            { l: "Agreement", v: payment.agreement },
            { l: "Type",      v: payment.type },
            { l: "Mode",      v: payment.mode },
            { l: "Tx Ref",    v: (payment.txRef as string) || "—" },
            { l: "Collected By", v: (payment.collectedBy as string) || "Dr. Rao" },
          ].map(({ l, v }) => (
            <div key={l} className="flex justify-between text-[12px]">
              <span className="text-muted-foreground">{l}</span>
              <span className="font-semibold">{v as string}</span>
            </div>
          ))}
          <div className="border-t border-border/50 pt-3 flex justify-between">
            <span className="font-bold text-[13px]">Amount Paid</span>
            <span className="font-display text-[18px] font-bold text-success">₹{payment.amount.toLocaleString("en-IN")}</span>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                printReceipt(payment);
                toast.success(`Receipt PDF for ${payment.id} generated successfully.`);
              }}
            >
              Download PDF
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button
              className="flex-1"
              onClick={() => {
                printReceipt(payment);
                toast.success(`Receipt sent to printer.`);
              }}
            >
              <Printer className="mr-1.5 h-3.5 w-3.5" />Print
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AgreementPaymentHistoryModal({
  agreementId,
  open,
  onOpenChange,
  onRefresh,
}: {
  agreementId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh?: () => void;
}) {
  if (!agreementId) return null;

  const rentals = getRentals();
  const payments = getPayments();
  const rental = rentals.find((r) => r.id === agreementId);

  const agreementPayments = sortLatestFirst(payments.filter((p) => p.agreement === agreementId), "date");
  const totalPaid = agreementPayments
    .filter((p) => p.status === "Paid")
    .reduce((sum, p) => sum + p.amount, 0);

  const customerName = rental?.customer || agreementPayments[0]?.customer || "Unknown Customer";
  const equipmentName = rental?.equipment || "—";
  const status = rental?.status || "Active";
  const monthlyRent = rental?.monthlyRent || 0;
  const deposit = rental?.deposit || 0;

  const handleExportStatement = () => {
    const headers = ["Receipt ID", "Date", "Payment Type", "Payment Mode", "Collected By", "Amount (₹)", "Status"];
    const rows = agreementPayments.map(p => [
      p.id,
      p.date,
      p.type,
      p.mode,
      (p.collectedBy as string) || "Dr. Rao",
      p.amount.toString(),
      p.status
    ]);
    downloadExcel(`payment_history_${agreementId}.xls`, headers, rows, [110, 110, 120, 110, 120, 110, 100]);
    toast.success(`Payment statement for ${agreementId} exported successfully.`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="p-5 border-b border-border/60 bg-muted/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <DialogTitle className="text-[18px] font-bold">Payment History</DialogTitle>
                <span className="font-mono text-[13px] font-bold bg-primary/10 text-primary px-2.5 py-0.5 rounded-md border border-primary/20">
                  {agreementId}
                </span>
                <StatusBadge status={status as any} />
              </div>
              <p className="text-[12px] text-muted-foreground mt-1 flex items-center gap-2">
                <span>Customer: <strong className="text-foreground font-semibold">{customerName}</strong></span>
                <span>•</span>
                <span>Equipment: <strong className="text-foreground font-semibold">{equipmentName}</strong></span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="h-8 text-[12px]" onClick={handleExportStatement}>
                <Download className="mr-1.5 h-3.5 w-3.5" /> Export Statement
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Financial Summary Cards */}
        <div className="p-5 bg-muted/10 border-b border-border/50 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-card p-3 rounded-lg border border-border/50">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Collected</p>
            <p className="text-[18px] font-bold text-success mt-0.5">₹{totalPaid.toLocaleString("en-IN")}</p>
          </div>
          <div className="bg-card p-3 rounded-lg border border-border/50">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Receipts</p>
            <p className="text-[18px] font-bold text-primary mt-0.5">{agreementPayments.length}</p>
          </div>
          <div className="bg-card p-3 rounded-lg border border-border/50">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Monthly Rent</p>
            <p className="text-[16px] font-semibold text-foreground mt-0.5">₹{monthlyRent.toLocaleString("en-IN")}</p>
          </div>
          <div className="bg-card p-3 rounded-lg border border-border/50">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Security Deposit</p>
            <p className="text-[16px] font-semibold text-foreground mt-0.5">₹{deposit.toLocaleString("en-IN")}</p>
          </div>
        </div>

        {/* History Table */}
        <div className="p-5">
          <h4 className="text-[13px] font-bold mb-3 flex items-center gap-2">
            <Receipt className="h-4 w-4 text-primary" />
            Payment Transactions ({agreementPayments.length})
          </h4>
          {agreementPayments.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-[13px] border border-dashed border-border rounded-xl">
              No payments recorded for agreement {agreementId} yet.
            </div>
          ) : (
            <div className="rounded-xl border border-border/60 overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead>Receipt ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Collected By</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agreementPayments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-[12px] font-bold text-primary">{p.id}</TableCell>
                      <TableCell className="text-[12px]">{p.date}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${typeColors[p.type] ?? "bg-muted text-muted-foreground border-border/50"}`}>
                          {p.type}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${modeColors[p.mode] ?? "bg-muted text-muted-foreground border-border/50"}`}>
                          {p.mode}
                        </span>
                      </TableCell>
                      <TableCell className="text-[12px] font-medium">{(p.collectedBy as string) || "Dr. Rao"}</TableCell>
                      <TableCell className="text-right font-bold text-[13px]">₹{p.amount.toLocaleString("en-IN")}</TableCell>
                      <TableCell><StatusBadge status={p.status} /></TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <PrintReceiptDialog payment={p} />
                          <DeletePaymentDialog payment={p} onDelete={onRefresh} trigger={
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          } />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PaymentsPage() {
  const dbVersion = useDatabaseTrigger();
  const [payments, setPayments] = useState(() => getPayments());
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [viewMode, setViewMode] = useState<"by-agreement" | "all-receipts">("by-agreement");
  const [selectedHistoryAgreementId, setSelectedHistoryAgreementId] = useState<string | null>(null);

  const isStaff = typeof window !== "undefined" && localStorage.getItem("medirent-user-role") === "Staff";

  const refresh = () => setPayments(getPayments());

  useEffect(() => {
    setPayments(getPayments());
  }, [dbVersion]);

  // Group payments by Agreement ID
  const rentalsList = getRentals();
  const agreementMap = new Map<string, {
    agreementId: string;
    customerName: string;
    customerId: string;
    equipment: string;
    rentStatus: string;
    monthlyRent: number;
    deposit: number;
    startDate: string;
    payments: Payment[];
  }>();

  // 1. Initialize with all rentals
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
      payments: [],
    });
  });

  // 2. Add payments to respective agreement group (create group if orphaned)
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
        payments: [],
      };
      agreementMap.set(agrId, group);
    }
    group.payments.push(p);
  });

  // Calculate totals and latest date for each agreement group
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
      latestMode: latestPayment?.mode || "—",
    };
  });

  const rentals = useMemo(() => getRentals(), [dbVersion]);
  const customers = useMemo(() => getCustomers(), [dbVersion]);

  // Filter agreements by search & date range
  const filteredAgreements = agreementList.filter((g) => {
    const q = search.toLowerCase().trim();
    const rental = rentals.find((r: any) => r.id === g.agreementId);
    const customer = customers.find((c: any) => c.id === g.customerId || (rental && c.id === rental.customerId));

    const matchesSearch = !q ||
      g.agreementId.toLowerCase().includes(q) ||
      g.customerName.toLowerCase().includes(q) ||
      g.equipment.toLowerCase().includes(q) ||
      g.latestMode.toLowerCase().includes(q) ||
      (rental && String(rental.serial || "").toLowerCase().includes(q)) ||
      (customer && (
        String(customer.phone || "").toLowerCase().includes(q) ||
        String(customer.altPhone || "").toLowerCase().includes(q) ||
        String(customer.contactNumber3 || "").toLowerCase().includes(q)
      ));

    if (!matchesSearch) return false;

    if (dateFilter === "all") return true;

    const matchesDate = g.payments.some((p) => {
      const pDate = parseLocalDate(p.date);
      if (isNaN(pDate.getTime())) return false;
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      if (dateFilter === "this-month") {
        return pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear;
      } else if (dateFilter === "last-month") {
        let targetMonth = currentMonth - 1;
        let targetYear = currentYear;
        if (targetMonth < 0) { targetMonth = 11; targetYear -= 1; }
        return pDate.getMonth() === targetMonth && pDate.getFullYear() === targetYear;
      } else if (dateFilter === "custom") {
        if (startDate) {
          const start = parseLocalDate(startDate);
          if (pDate < start) return false;
        }
        if (endDate) {
          const end = parseLocalDate(endDate);
          if (pDate > end) return false;
        }
        return true;
      }
      return true;
    });

    return matchesDate || g.payments.length === 0;
  }).sort((a, b) => {
    const numA = extractIdNumber(a.agreementId);
    const numB = extractIdNumber(b.agreementId);
    if (numA !== numB) return numB - numA;
    return (b.latestDate || "").localeCompare(a.latestDate || "");
  });

  // Flat individual receipt filtering (for "all-receipts" view)
  const filteredPayments = sortLatestFirst(payments.filter((p) => {
    const q = search.toLowerCase().trim();
    const rental = rentals.find((r: any) => r.id === p.agreement);
    const customer = customers.find((c: any) => c.id === p.customerId || (rental && c.id === rental.customerId));

    const matchesSearch = !q ||
      p.id.toLowerCase().includes(q) ||
      p.customer.toLowerCase().includes(q) ||
      p.agreement.toLowerCase().includes(q) ||
      p.mode.toLowerCase().includes(q) ||
      (p.owner && p.owner.toLowerCase().includes(q)) ||
      (rental && String(rental.serial || "").toLowerCase().includes(q)) ||
      (customer && (
        String(customer.phone || "").toLowerCase().includes(q) ||
        String(customer.altPhone || "").toLowerCase().includes(q) ||
        String(customer.contactNumber3 || "").toLowerCase().includes(q)
      ));

    if (!matchesSearch) return false;
    if (dateFilter === "all") return true;

    const pDate = parseLocalDate(p.date);
    if (isNaN(pDate.getTime())) return false;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    if (dateFilter === "this-month") {
      return pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear;
    } else if (dateFilter === "last-month") {
      let targetMonth = currentMonth - 1;
      let targetYear = currentYear;
      if (targetMonth < 0) { targetMonth = 11; targetYear -= 1; }
      return pDate.getMonth() === targetMonth && pDate.getFullYear() === targetYear;
    } else if (dateFilter === "custom") {
      if (startDate) {
        const start = parseLocalDate(startDate);
        if (pDate < start) return false;
      }
      if (endDate) {
        const end = parseLocalDate(endDate);
        if (pDate > end) return false;
      }
      return true;
    }
    return true;
  }), "date");

  // Calculate dynamic stats
  const todayStr = getLocalYYYYMMDD();
  const todayCollection = (dateFilter === "all" ? payments : filteredPayments)
    .filter(p => p.status === "Paid" && p.date === todayStr)
    .reduce((sum, p) => sum + p.amount, 0);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const thisMonthCollection = (dateFilter === "all" ? payments : filteredPayments)
    .filter(p => {
      if (p.status !== "Paid") return false;
      const pDate = parseLocalDate(p.date);
      return !isNaN(pDate.getTime()) && pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear;
    })
    .reduce((sum, p) => sum + p.amount, 0);

  const cashCollection = (dateFilter === "all" ? payments : filteredPayments)
    .filter(p => p.status === "Paid" && p.mode === "Cash")
    .reduce((sum, p) => sum + p.amount, 0);

  const bankCollection = (dateFilter === "all" ? payments : filteredPayments)
    .filter(p => p.status === "Paid" && p.mode !== "Cash")
    .reduce((sum, p) => sum + p.amount, 0);

  const formatValue = (val: number) => `₹${val.toLocaleString("en-IN")}`;

  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const collectionData = days.map((day, idx) => {
    const dayPayments = payments.filter(p => {
      const pDate = parseLocalDate(p.date);
      if (isNaN(pDate.getTime())) return false;
      const dayNum = pDate.getDay();
      const mappedIdx = dayNum === 0 ? 6 : dayNum - 1;
      return mappedIdx === idx;
    });
    const collected = dayPayments.filter(p => p.status === "Paid").reduce((sum, p) => sum + p.amount, 0);
    const pending = dayPayments.filter(p => p.status === "Pending" || p.status === "Partial").reduce((sum, p) => sum + p.amount, 0);
    return { day, collected, pending };
  });

  return (
    <AppShell
      title="Payments"
      subtitle="Collect rent, deposits, additional charges and track collections"
      actions={
        <Button
          variant="outline"
          size="sm"
            onClick={() => {
              const headers = ["Payment ID", "Date", "Customer", "Agreement", "Amount", "Mode", "Type", "Reference", "Status", "Collected By"];
              const rows = payments.map(p => [
                p.id,
                p.date,
                p.customer,
                p.agreement,
                p.amount.toString(),
                p.mode,
                p.type,
                (p.txRef as string) || "",
                p.status,
                (p.collectedBy as string) || "Dr. Rao"
              ]);
              downloadExcel("payments_export.xls", headers, rows, [110, 110, 200, 110, 110, 100, 100, 150, 100, 120]);
              toast.success("Payments log exported successfully.");
            }}
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Export
          </Button>
      }
    >
      {/* Stat cards */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {[
          { l: "Today's Collection", v: formatValue(todayCollection), icon: IndianRupee, color: "text-primary" },
          { l: "This Month",         v: formatValue(thisMonthCollection),  icon: Wallet,      color: "text-primary/80" },
          { l: "Cash",               v: formatValue(cashCollection),  icon: Banknote,    color: "text-accent" },
          { l: "Bank Transfers",     v: formatValue(bankCollection),   icon: Building2,   color: "text-success" },
        ].map((s, i) => (
          <Card key={s.l} className={`hover:shadow-[var(--shadow-elevated)] hover:-translate-y-0.5 transition-all animate-[fade-in_0.35s_ease-out_both] stagger-${i + 1}`}>
            <CardContent className="p-3.5 sm:p-5">
              <div className="metric-icon h-8 w-8 sm:h-9 sm:w-9 mb-2.5">
                <s.icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${s.color}`} />
              </div>
              <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground/65 leading-tight">{s.l}</p>
              <p className={`mt-1 font-display text-[18px] sm:text-[22px] font-bold ${s.color}`}>{s.v}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="w-full">
        {/* Recent Payments table */}
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border/60 bg-muted/20 px-5 py-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <CardTitle>Payments</CardTitle>
                {/* View Mode Toggle */}
                <div className="flex bg-muted/60 p-0.5 rounded-lg border border-border/50 text-[11px]">
                  <button
                    type="button"
                    className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${viewMode === "by-agreement" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                    onClick={() => setViewMode("by-agreement")}
                  >
                    By Agreement
                  </button>
                  <button
                    type="button"
                    className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${viewMode === "all-receipts" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                    onClick={() => setViewMode("all-receipts")}
                  >
                    All Receipts
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="h-8 w-[120px] text-[12px] bg-card border-border/50 rounded-lg">
                    <SelectValue placeholder="All Payments" />
                  </SelectTrigger>
                  <SelectContent className="border border-border/60 bg-popover shadow-elevated rounded-lg">
                    <SelectItem value="all" className="text-[12px] cursor-pointer">All Payments</SelectItem>
                    <SelectItem value="this-month" className="text-[12px] cursor-pointer">This Month</SelectItem>
                    <SelectItem value="last-month" className="text-[12px] cursor-pointer">Last Month</SelectItem>
                    <SelectItem value="custom" className="text-[12px] cursor-pointer">Custom Range...</SelectItem>
                  </SelectContent>
                </Select>
                {dateFilter === "custom" && (
                  <div className="flex items-center gap-1.5 animate-[fade-in_0.2s_ease-out] shrink-0">
                    <Input
                      type="date"
                      className="h-8 text-[11px] w-[130px] bg-card border-border/50 cursor-pointer"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                    <span className="text-[10px] text-muted-foreground">to</span>
                    <Input
                      type="date"
                      className="h-8 text-[11px] w-[130px] bg-card border-border/50 cursor-pointer"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                )}
                <div className="relative w-40 sm:w-48">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50" />
                  <Input
                    placeholder="Search…"
                    className="pl-9 h-8 text-[12px] bg-card border-border/50"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardHeader>

          {/* VIEW MODE 1: BY AGREEMENT */}
          {viewMode === "by-agreement" && (
            <>
              {/* Desktop Agreement Table */}
              <div className="hidden sm:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agreement ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Equipment</TableHead>
                      <TableHead className="text-right">Total Collected</TableHead>
                      <TableHead className="text-center">Receipts</TableHead>
                      <TableHead>Latest Payment</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-24 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAgreements.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="py-10 text-center text-[13px] text-muted-foreground">
                          No agreements match your search.
                        </TableCell>
                      </TableRow>
                    )}
                    {filteredAgreements.map((g) => (
                      <TableRow
                        key={g.agreementId}
                        className="group cursor-pointer hover:bg-muted/30 transition-colors"
                        onClick={() => setSelectedHistoryAgreementId(g.agreementId)}
                      >
                        <TableCell>
                          <span className="font-mono text-[12px] font-bold text-primary group-hover:underline flex items-center gap-1">
                            {g.agreementId}
                          </span>
                        </TableCell>
                        <TableCell>
                          <p className="font-semibold text-[13px] text-foreground">{g.customerName}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-[12px] font-medium text-foreground/80 truncate max-w-[180px]" title={g.equipment}>
                            {g.equipment}
                          </p>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-display text-[14px] font-bold text-success">
                            ₹{g.totalCollected.toLocaleString("en-IN")}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center gap-1 bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full text-[11px] font-bold">
                            <Receipt className="h-3 w-3" />
                            {g.totalCount}
                          </span>
                        </TableCell>
                        <TableCell>
                          <p className="text-[11px] text-foreground font-medium">{g.latestDate || "—"}</p>
                          {g.latestMode !== "—" && (
                            <span className={`inline-flex items-center rounded px-1.5 py-0.2 text-[10px] font-semibold mt-0.5 ${modeColors[g.latestMode] ?? "bg-muted text-muted-foreground"}`}>
                              {g.latestMode}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={g.rentStatus as any} />
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-[11px] text-primary hover:bg-primary/10 px-2 font-semibold"
                            onClick={() => setSelectedHistoryAgreementId(g.agreementId)}
                          >
                            <History className="mr-1 h-3.5 w-3.5" /> History
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Agreement List */}
              <div className="sm:hidden divide-y divide-border/60">
                {filteredAgreements.length === 0 ? (
                  <div className="py-10 text-center text-[13px] text-muted-foreground">No agreements match your search.</div>
                ) : (
                  filteredAgreements.map((g) => (
                    <div
                      key={g.agreementId}
                      className="px-4 py-3.5 cursor-pointer hover:bg-muted/20"
                      onClick={() => setSelectedHistoryAgreementId(g.agreementId)}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <span className="font-mono text-[11px] font-bold text-primary">{g.agreementId}</span>
                          <p className="font-semibold text-[13.5px] mt-0.5">{g.customerName}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="font-display text-[15px] font-bold text-success">₹{g.totalCollected.toLocaleString("en-IN")}</span>
                          <StatusBadge status={g.rentStatus as any} />
                        </div>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">{g.equipment}</p>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/40 text-[11px]">
                        <span className="text-muted-foreground">{g.totalCount} Payment{g.totalCount === 1 ? "" : "s"}</span>
                        <Button size="sm" variant="ghost" className="h-6 text-[11px] text-primary p-0">
                          View Payment History <ChevronRight className="ml-1 h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {/* VIEW MODE 2: ALL RECEIPTS */}
          {viewMode === "all-receipts" && (
            <>
              {/* Desktop Receipts Table */}
              <div className="hidden sm:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Receipt</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Mode</TableHead>
                      <TableHead>Collected By</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-24 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="py-10 text-center text-[13px] text-muted-foreground">
                          No payments match your search.
                        </TableCell>
                      </TableRow>
                    )}
                    {filteredPayments.map((p) => (
                      <TableRow key={p.id} className="group">
                        <TableCell>
                          <p className="font-mono text-[11px] font-bold text-primary">{p.id}</p>
                          <p className="text-[10px] text-muted-foreground">{p.date}</p>
                        </TableCell>
                        <TableCell>
                          <p className="font-semibold text-[13px]">{p.customer}</p>
                          <button
                            type="button"
                            className="font-mono text-[10px] text-primary hover:underline font-bold text-left cursor-pointer"
                            onClick={() => setSelectedHistoryAgreementId(p.agreement)}
                          >
                            {p.agreement}
                          </button>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${typeColors[p.type] ?? "bg-muted text-muted-foreground border-border/50"}`}>
                            {p.type}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${modeColors[p.mode] ?? "bg-muted text-muted-foreground border-border/50"}`}>
                            {p.mode}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-[13px] font-semibold text-foreground/80">{(p.collectedBy as string) || "Dr. Rao"}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-display text-[14px] font-bold">₹{p.amount.toLocaleString("en-IN")}</span>
                        </TableCell>
                        <TableCell><StatusBadge status={p.status} /></TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <PrintReceiptDialog payment={p} />
                            <DeletePaymentDialog payment={p} onDelete={refresh} trigger={
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            } />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile card list */}
              <div className="sm:hidden">
                {filteredPayments.length === 0 ? (
                  <div className="py-10 text-center text-[13px] text-muted-foreground">No payments match your search.</div>
                ) : (
                  <div className="divide-y divide-border/60">
                    {filteredPayments.map((p) => (
                      <div key={p.id} className="px-4 py-3.5">
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div>
                            <p className="font-mono text-[11px] font-bold text-primary">{p.id}</p>
                            <p className="font-semibold text-[13.5px] mt-0.5">{p.customer}</p>
                            <button
                              type="button"
                              className="font-mono text-[10px] text-primary hover:underline font-bold"
                              onClick={() => setSelectedHistoryAgreementId(p.agreement)}
                            >
                              {p.agreement}
                            </button>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="font-display text-[15px] font-bold">₹{p.amount.toLocaleString("en-IN")}</span>
                            <StatusBadge status={p.status} />
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          <span>{p.date}</span>
                          <span>·</span>
                          <span className={`inline-flex items-center rounded px-1.5 py-0.5 font-semibold ${modeColors[p.mode] ?? "bg-muted text-muted-foreground"}`}>{p.mode}</span>
                          <span>·</span>
                          <span>{p.type}</span>
                        </div>
                        <div className="mt-2 flex justify-end">
                          <PrintReceiptDialog payment={p} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </Card>
      </div>

      {/* AGREEMENT PAYMENT HISTORY DIALOG */}
      <AgreementPaymentHistoryModal
        agreementId={selectedHistoryAgreementId}
        open={!!selectedHistoryAgreementId}
        onOpenChange={(open) => {
          if (!open) setSelectedHistoryAgreementId(null);
        }}
        onRefresh={refresh}
      />
    </AppShell>
  );
}

function Field({ label, placeholder, type = "text", className, value, onChange }: {
  label: string; placeholder?: string; type?: string; className?: string; value?: string; onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</Label>
      <Input type={type} placeholder={placeholder} value={value} onChange={onChange} />
    </div>
  );
}
