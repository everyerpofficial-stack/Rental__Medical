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
  Smartphone, FileCheck2, AlertCircle, CheckCircle2, MessageCircle,
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
  getEquipment,
  useDatabaseTrigger,
  getNextPaymentNumber,
  getLocalYYYYMMDD,
  parseLocalDate,
  extractIdNumber,
  sortLatestFirst,
  formatDateDDMMYYYY,
  getAgreementBalance,
  formatEquipmentLabel,
  cleanNum,
} from "@/lib/data-store";
import { Combobox } from "@/components/ui/combobox";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";

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
  head: () => ({ meta: [{ title: "Payments — Relife" }] }),
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

/** ITEM-19: fast payment modes, shown as buttons rather than buried in a select. */
const PAYMENT_MODES = [
  { value: "UPI", label: "UPI", icon: Smartphone },
  { value: "Cash", label: "Cash", icon: Wallet },
  { value: "Bank", label: "Bank Transfer", icon: Building2 },
  { value: "Cheque", label: "Cheque", icon: FileCheck2 },
] as const;

/** Reference-field label per mode — a cheque number is not a UPI ref. */
const REF_LABEL: Record<string, string> = {
  UPI: "UPI Transaction ID",
  Cash: "Receipt / Voucher No.",
  Bank: "NEFT / IMPS Reference",
  Cheque: "Cheque Number",
};

function MoneyRow({
  label,
  value,
  tone = "default",
  strong = false,
}: {
  label: string;
  value: number;
  tone?: "default" | "due" | "paid";
  strong?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-[12px]">
      <span className={cn("text-muted-foreground", strong && "font-bold text-foreground")}>{label}</span>
      <span
        className={cn(
          "font-mono tabular-nums font-semibold",
          tone === "due" && "text-destructive",
          tone === "paid" && "text-emerald-600",
          strong && "text-[13.5px] font-black",
        )}
      >
        {value < 0 ? "-" : ""}₹{Math.abs(Math.round(value)).toLocaleString("en-IN")}
      </span>
    </div>
  );
}

/**
 * ITEM-19: the Collect Payment module, rebuilt as a single-screen flow — pick
 * who and which agreement, see exactly what they owe, tap a payment mode, and
 * watch the remaining balance update before saving.
 *
 * ITEM-14 adds a discount field here so a negotiated reduction is recorded on
 * the payment rather than hidden inside a hand-adjusted amount.
 *
 * Two long-standing defects are fixed along the way:
 *   - getCustomers()/getRentals() ran in the render body, so every keystroke
 *     re-read and re-healed the whole database (getRentals() carries a repair
 *     pass and a Sheets status sync). That was the lag on this screen.
 *   - The auto-fill effect listed `rentals` — a fresh array on every render —
 *     among its dependencies, so it re-ran constantly and overwrote the amount
 *     the operator had just typed with the agreement's monthly rent.
 */
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
  const dbVersion = useDatabaseTrigger();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"Rent" | "Deposit" | "Refund" | "Additional Charges">(
    (payment?.type as "Rent" | "Deposit" | "Refund" | "Additional Charges") ?? "Rent",
  );
  const [date, setDate] = useState(payment?.date ?? getLocalYYYYMMDD());
  const [customerId, setCustomerId] = useState(payment?.customerId ?? "");
  const [agreement, setAgreement] = useState(payment?.agreement ?? "");
  const [amount, setAmount] = useState(payment?.amount?.toString() ?? "");
  const [mode, setMode] = useState((payment?.mode as string) ?? "UPI");
  const [txRef, setTxRef] = useState((payment?.txRef as string) ?? "");
  const [notes, setNotes] = useState((payment?.notes as string) ?? "");
  const [collectedBy, setCollectedBy] = useState((payment?.collectedBy as string) || "Admin");
  const [owner, setOwner] = useState((payment?.owner as string) || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ITEM-14: rental discount, entered either as a flat amount or a percentage.
  const [discountMode, setDiscountMode] = useState<"amount" | "percent">("amount");
  const [discount, setDiscount] = useState((payment?.discount as number | undefined)?.toString() ?? "");

  // Tracks whether the operator has edited the amount, so the auto-fill never
  // clobbers a figure they typed themselves.
  const [amountTouched, setAmountTouched] = useState(false);

  // PERF: read the database once per open / remote update, never in render.
  const customers = useMemo(() => (open ? getCustomers() : []), [open, dbVersion]);
  const rentals = useMemo(() => (open ? getRentals() : []), [open, dbVersion]);
  const paymentsList = useMemo(() => (open ? getPayments() : []), [open, dbVersion]);
  const equipmentList = useMemo(() => (open ? getEquipment() : []), [open, dbVersion]);

  // Reset dialog state when opened.
  useEffect(() => {
    if (open) {
      setIsSubmitting(false);
      setType((payment?.type as "Rent" | "Deposit" | "Refund" | "Additional Charges") ?? "Rent");
      setDate(payment?.date ?? getLocalYYYYMMDD());
      setCustomerId(payment?.customerId ?? "");
      setAgreement(payment?.agreement ?? "");
      setAmount(payment?.amount?.toString() ?? "");
      setMode((payment?.mode as string) ?? "UPI");
      setTxRef((payment?.txRef as string) ?? "");
      setNotes((payment?.notes as string) ?? "");
      setCollectedBy((payment?.collectedBy as string) || "Admin");
      setOwner((payment?.owner as string) ?? "");
      setDiscount((payment?.discount as number | undefined)?.toString() ?? "");
      setDiscountMode("amount");
      // An existing payment already carries the amount the user chose; a new
      // one should accept the auto-filled suggestion.
      setAmountTouched(Boolean(payment));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, payment?.id]);

  const selectedRental = useMemo(
    () => rentals.find((r) => r.id === agreement) || null,
    [rentals, agreement],
  );
  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === customerId) || null,
    [customers, customerId],
  );

  /** What this agreement still owes, split into rent / deposit / charges. */
  const balance = useMemo(
    () => getAgreementBalance(selectedRental, paymentsList),
    [selectedRental, paymentsList],
  );

  // Follow the agreement: adopt its customer and equipment owner. Keyed on the
  // agreement id alone — not on the `rentals` array — so it fires once per
  // selection instead of on every render.
  useEffect(() => {
    if (!agreement || !selectedRental) return;
    if (selectedRental.customerId) setCustomerId(selectedRental.customerId);

    const equipIds = String(selectedRental.equipmentId || "")
      .split(",")
      .map((s: string) => s.trim())
      .filter(Boolean);
    const ownerFound = equipIds
      .map((id: string) => equipmentList.find((e) => e.id === id))
      .find((eq: any) => eq?.owner);
    if (ownerFound?.owner) setOwner(ownerFound.owner);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agreement, selectedRental?.id]);

  // Suggest the outstanding amount for the chosen payment type, but only while
  // the operator has not typed their own figure.
  useEffect(() => {
    if (!selectedRental || amountTouched) return;
    const suggested =
      type === "Rent" ? balance.rentDue
      : type === "Deposit" ? balance.depositDue
      : type === "Additional Charges" ? balance.additionalDue
      : 0;
    setAmount(suggested > 0 ? String(suggested) : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, selectedRental?.id, balance.rentDue, balance.depositDue, balance.additionalDue, amountTouched]);

  // Drop an agreement that does not belong to the newly chosen customer.
  useEffect(() => {
    if (!customerId || !selectedRental) return;
    if (selectedRental.customerId && selectedRental.customerId !== customerId) {
      setAgreement("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId, selectedRental?.id]);

  const customerOptions = useMemo(
    () =>
      customers.map((c: any) => {
        const parts = [`${c.name} — ${c.id}`];
        if (c.phone) parts.push(`Ph: ${String(c.phone).trim()}`);
        if (c.altPhone) parts.push(`Alt: ${String(c.altPhone).trim()}`);
        return {
          value: c.id,
          label: parts.join(" | "),
          searchTerms: `${c.phone || ""} ${c.altPhone || ""} ${c.contactNumber3 || ""} ${c.area || ""}`,
        };
      }),
    [customers],
  );

  const agreementOptions = useMemo(() => {
    const seen = new Set<string>();
    return rentals
      .filter((r) => !customerId || r.customerId === customerId)
      .filter((r) => r.status !== "Cancelled")
      .filter((r) => {
        if (!r.id || seen.has(r.id)) return false;
        seen.add(r.id);
        return true;
      })
      .map((r) => {
        const openItems = Array.isArray(r.equipmentItems)
          ? r.equipmentItems.filter((it: any) => !it.returned)
          : [];
        const equipmentSummary = openItems.length > 0
          ? openItems
              .map((it: any) => {
                const eq = equipmentList.find((e) => e.id === it.equipmentId);
                return formatEquipmentLabel({
                  name: it.name || eq?.name || eq?.category,
                  model: it.model || eq?.model,
                  serial: it.serial || eq?.serial,
                });
              })
              .join(", ")
          : String(r.equipment || "");
        const due = getAgreementBalance(r, paymentsList).totalDue;
        const parts = [r.id, r.customer, equipmentSummary].filter(Boolean);
        if (due > 0) parts.push(`Due ₹${due.toLocaleString("en-IN")}`);
        return {
          value: r.id,
          label: parts.join(" · "),
          searchTerms: `${r.id} ${r.customer || ""} ${r.serial || ""} ${equipmentSummary}`,
        };
      });
  }, [rentals, customerId, equipmentList, paymentsList]);

  // ITEM-14: resolve the discount to rupees so amount and percent behave alike,
  // and never let it exceed what is being collected.
  const grossAmount = cleanNum(amount);
  const discountValue = cleanNum(discount);
  const discountAmount = Math.min(
    grossAmount,
    Math.max(
      0,
      discountMode === "percent"
        ? Math.round((grossAmount * Math.min(100, discountValue)) / 100)
        : discountValue,
    ),
  );
  const netAmount = Math.max(0, grossAmount - discountAmount);

  /** ITEM-19: what will still be owed once this payment is saved. */
  const dueForType =
    type === "Rent" ? balance.rentDue
    : type === "Deposit" ? balance.depositDue
    : type === "Additional Charges" ? balance.additionalDue
    : 0;
  const remainingAfter = Math.max(0, dueForType - netAmount - discountAmount);
  const overpayment = Math.max(0, netAmount + discountAmount - dueForType);

  const buildPaymentRecord = (id: string): Payment => ({
    id,
    date,
    customer: selectedCustomer?.name || "Unknown Customer",
    customerId,
    agreement,
    // The recorded amount is what actually changed hands; the discount is kept
    // beside it so a receipt can show both.
    amount: netAmount,
    grossAmount,
    discount: discountAmount,
    mode,
    type,
    txRef,
    notes,
    collectedBy,
    owner,
    status: "Paid" as const,
  });

  const handlePrintForm = () => {
    if (!agreement) {
      toast.error("Select an agreement before printing a receipt.");
      return;
    }
    const tempPayment = buildPaymentRecord(payment?.id || "PAY-TEMP");
    printReceipt(tempPayment, tempPayment.customer);
    toast.success("Receipt print preview opened.");
  };

  const handleShareWhatsApp = () => {
    if (!agreement) {
      toast.error("Select an agreement before sharing a receipt.");
      return;
    }
    const rupee = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
    const lines = [
      `*Payment Receipt — ${type}*`,
      `Customer: ${selectedCustomer?.name || "Customer"}`,
      `Agreement: ${agreement}`,
      `Date: ${formatDateDDMMYYYY(date)}`,
      discountAmount > 0 ? `Amount: ${rupee(grossAmount)}` : "",
      discountAmount > 0 ? `Discount: -${rupee(discountAmount)}` : "",
      `Paid: ${rupee(netAmount)} (${mode})`,
      txRef ? `Ref: ${txRef}` : "",
      remainingAfter > 0 ? `Balance remaining: ${rupee(remainingAfter)}` : "Balance cleared. Thank you!",
    ].filter(Boolean);

    const text = encodeURIComponent(lines.join("\n"));
    const phone = String(selectedCustomer?.phone || "").replace(/\D/g, "");
    const target = phone
      ? `https://wa.me/${phone.length === 10 ? `91${phone}` : phone}?text=${text}`
      : `https://wa.me/?text=${text}`;
    window.open(target, "_blank");
  };

  const handleSave = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    if (!agreement) {
      toast.error("Please select a related agreement.");
      setIsSubmitting(false);
      return;
    }
    if (grossAmount <= 0) {
      toast.error("Please enter a valid amount.");
      setIsSubmitting(false);
      return;
    }
    if (netAmount <= 0 && discountAmount <= 0) {
      toast.error("The amount after discount must be greater than zero.");
      setIsSubmitting(false);
      return;
    }
    if (!collectedBy.trim()) {
      toast.error("Collector name is required.");
      setIsSubmitting(false);
      return;
    }

    const id = payment?.id || getNextPaymentNumber();
    try {
      savePayment(buildPaymentRecord(id) as any);
    } catch (err) {
      console.error("[Payments] Failed to save payment:", err);
      toast.error("Could not save the payment. Storage may be full — export a backup from Settings and try again.");
      setIsSubmitting(false);
      return;
    }

    toast.success(
      payment
        ? "Payment details updated successfully."
        : `Collected ₹${netAmount.toLocaleString("en-IN")}${remainingAfter > 0 ? ` · ₹${remainingAfter.toLocaleString("en-IN")} still due` : " · balance cleared"}`,
    );
    setIsSubmitting(false);
    setOpen(false);
    if (onSave) onSave();
  };

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
        className="max-w-3xl max-h-[92vh] overflow-y-auto"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IndianRupee className="h-4 w-4 text-primary" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-5 lg:grid-cols-[1.25fr_1fr]">
          {/* ----------------------- Left: the form ------------------------ */}
          <div className="space-y-4">
            {/* Who, and which agreement */}
            <div className="space-y-3 rounded-xl border border-border/60 bg-muted/10 p-3.5">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Customer</Label>
                <Combobox
                  value={customerId}
                  onValueChange={setCustomerId}
                  options={customerOptions}
                  placeholder="Select customer"
                  searchPlaceholder="Search by name, ID or phone…"
                  emptyText="No customer found."
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Agreement</Label>
                <Combobox
                  value={agreement}
                  onValueChange={setAgreement}
                  options={agreementOptions}
                  placeholder="Select agreement"
                  searchPlaceholder="Search by agreement ID, customer or serial…"
                  emptyText="No agreement found."
                />
              </div>
            </div>

            {/* What is being collected */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Payment Type</Label>
                <Select value={type} onValueChange={(val) => { setType(val as typeof type); setAmountTouched(false); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Rent">Rent Payment</SelectItem>
                    <SelectItem value="Deposit">Deposit Payment</SelectItem>
                    <SelectItem value="Additional Charges">Additional Charges</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Field label="Payment Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>

            {/* ITEM-19: fast mode buttons instead of a dropdown */}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Payment Mode</Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {PAYMENT_MODES.map((m) => {
                  const Icon = m.icon;
                  const active = mode === m.value;
                  return (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setMode(m.value)}
                      aria-pressed={active}
                      className={cn(
                        "flex flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2.5 text-[11.5px] font-semibold transition-all",
                        active
                          ? "border-primary bg-primary/10 text-primary shadow-soft ring-1 ring-primary/15"
                          : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Amount (₹)</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  placeholder="e.g. 4500"
                  value={amount}
                  onChange={(e) => { setAmount(e.target.value); setAmountTouched(true); }}
                />
              </div>
              {/* ITEM-14: discount, as a flat amount or a percentage */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Rental Discount</Label>
                  <div className="flex overflow-hidden rounded-md border border-border">
                    {(["amount", "percent"] as const).map((dm) => (
                      <button
                        key={dm}
                        type="button"
                        onClick={() => setDiscountMode(dm)}
                        className={cn(
                          "px-2 py-0.5 text-[10px] font-bold transition-colors",
                          discountMode === dm
                            ? "bg-primary text-primary-foreground"
                            : "bg-background text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {dm === "amount" ? "₹" : "%"}
                      </button>
                    ))}
                  </div>
                </div>
                <Input
                  type="number"
                  inputMode="numeric"
                  placeholder={discountMode === "percent" ? "e.g. 10" : "e.g. 500"}
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label={REF_LABEL[mode] || "Transaction Reference"}
                placeholder={mode === "Cheque" ? "Cheque no." : "Reference no."}
                value={txRef}
                onChange={(e) => setTxRef(e.target.value)}
              />
              <Field
                label="Collected By *"
                placeholder="e.g. Dr. Rao"
                value={collectedBy}
                onChange={(e) => setCollectedBy(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Notes</Label>
              <Textarea
                placeholder="Additional notes…"
                className="resize-none min-h-[60px]"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          {/* ------------- Right: balance breakdown & live preview ---------- */}
          <div className="space-y-3">
            <div className="rounded-xl border border-border/60 bg-card p-4 shadow-soft">
              <div className="mb-3 flex items-center gap-2 border-b border-border/50 pb-2.5">
                <Receipt className="h-4 w-4 text-primary" />
                <span className="text-[12px] font-bold uppercase tracking-wider text-foreground">Outstanding Balance</span>
              </div>

              {!selectedRental ? (
                <p className="flex items-center gap-2 py-6 text-[12px] text-muted-foreground">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  Select an agreement to see what is owed.
                </p>
              ) : (
                <div className="space-y-2.5">
                  <div className="space-y-1.5">
                    <MoneyRow label="Rent charged to date" value={balance.rentCharged} />
                    <MoneyRow label="Rent received" value={balance.rentPaid} tone="paid" />
                    <MoneyRow label="Rent outstanding" value={balance.rentDue} tone={balance.rentDue > 0 ? "due" : "default"} />
                  </div>
                  <div className="space-y-1.5 border-t border-border/40 pt-2.5">
                    <MoneyRow label="Deposit agreed" value={balance.depositCharged} />
                    <MoneyRow label="Deposit received" value={balance.depositPaid} tone="paid" />
                    <MoneyRow label="Deposit outstanding" value={balance.depositDue} tone={balance.depositDue > 0 ? "due" : "default"} />
                  </div>
                  {balance.additionalDue > 0 && (
                    <div className="border-t border-border/40 pt-2.5">
                      <MoneyRow label="Unpaid charges" value={balance.additionalDue} tone="due" />
                    </div>
                  )}
                  <div className="border-t border-border/60 pt-2.5">
                    <MoneyRow label="Total outstanding" value={balance.totalDue} tone={balance.totalDue > 0 ? "due" : "paid"} strong />
                  </div>
                </div>
              )}
            </div>

            {/* ITEM-19: live preview of where this payment leaves the balance */}
            <div className="rounded-xl border border-primary/25 bg-primary/5 p-4">
              <div className="mb-2.5 flex items-center gap-2 border-b border-primary/15 pb-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span className="text-[12px] font-bold uppercase tracking-wider text-primary">This Payment</span>
              </div>
              <div className="space-y-1.5">
                <MoneyRow label="Amount" value={grossAmount} />
                {discountAmount > 0 && (
                  <MoneyRow
                    label={`Discount${discountMode === "percent" ? ` (${Math.min(100, discountValue)}%)` : ""}`}
                    value={-discountAmount}
                    tone="paid"
                  />
                )}
                <div className="border-t border-primary/15 pt-1.5">
                  <MoneyRow label="Collecting now" value={netAmount} strong />
                </div>
                <div className="border-t border-primary/15 pt-1.5">
                  {overpayment > 0 ? (
                    <MoneyRow label="Advance credit" value={overpayment} tone="paid" strong />
                  ) : (
                    <MoneyRow
                      label={`${type} balance after`}
                      value={remainingAfter}
                      tone={remainingAfter > 0 ? "due" : "paid"}
                      strong
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-wrap gap-2">
          <Button variant="outline" type="button" onClick={handlePrintForm}>
            <Printer className="mr-1.5 h-3.5 w-3.5" />Print Receipt
          </Button>
          <Button variant="outline" type="button" onClick={handleShareWhatsApp}>
            <MessageCircle className="mr-1.5 h-3.5 w-3.5" />Share
          </Button>
          <DialogClose asChild>
            <Button variant="outline" type="button">Cancel</Button>
          </DialogClose>
          <Button type="submit" onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Save Payment"}
          </Button>
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
            { l: "Date",      v: formatDateDDMMYYYY(payment.date) },
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

  const handleExportStatementPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Popup blocked! Please allow popups to print.");
      return;
    }

    const tableRowsHtml = agreementPayments.map(p => `
      <tr>
        <td style="font-family: monospace; font-weight: bold; text-align: center; border: 1px solid #cbd5e1; padding: 8px;">${p.id}</td>
        <td style="text-align: center; border: 1px solid #cbd5e1; padding: 8px;">${formatDateDDMMYYYY(p.date)}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px;">${p.type}</td>
        <td style="text-align: center; border: 1px solid #cbd5e1; padding: 8px;">${p.mode}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px;">${p.collectedBy || "Admin"}</td>
        <td style="text-align: right; font-weight: bold; border: 1px solid #cbd5e1; padding: 8px;">₹${p.amount.toLocaleString("en-IN")}</td>
        <td style="text-align: center; border: 1px solid #cbd5e1; padding: 8px;">
          <span style="display: inline-block; padding: 2px 6px; font-size: 10px; font-weight: bold; border-radius: 4px; border: 1px solid ${p.status === "Paid" ? "#bbf7d0; background-color: #f0fdf4; color: #15803d;" : "#fecaca; background-color: #fef2f2; color: #b91c1c;"}">
            ${p.status}
          </span>
        </td>
      </tr>
    `).join("");

    const htmlContent = `
      <html>
      <head>
        <title>Payment Statement - ${agreementId}</title>
        <style>
          body { font-family: 'Segoe UI', system-ui, sans-serif; padding: 30px; color: #1e293b; }
          .header-title { font-size: 22px; font-weight: bold; color: #1e3a8a; text-align: center; padding: 15px; background-color: #f0f9ff; border: 1.5px solid #bae6fd; border-radius: 8px; margin-bottom: 20px; }
          .meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 25px; background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 13px; }
          .meta-item { display: flex; flex-direction: column; }
          .meta-label { font-weight: bold; color: #64748b; font-size: 11px; text-transform: uppercase; tracking-wider: 0.05em; }
          .meta-val { font-weight: 600; color: #0f172a; margin-top: 2px; }
          .data-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          .data-table th { background-color: #3b82f6; color: white; padding: 10px 8px; font-size: 12px; font-weight: bold; border: 1px solid #cbd5e1; text-align: left; }
          .data-table td { padding: 10px 8px; font-size: 11.5px; border: 1px solid #e2e8f0; color: #334155; }
          .data-table tr:nth-child(even) { background-color: #f8fafc; }
          .totals-row { font-weight: bold; background-color: #f1f5f9 !important; }
          .totals-row td { border-top: 2px solid #94a3b8; font-size: 12.5px; color: #0f172a; border: 1px solid #cbd5e1; padding: 8px; }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header-title">Rental Agreement Payment Statement</div>
        <div class="meta-grid">
          <div class="meta-item"><span class="meta-label">Agreement ID</span><span class="meta-val" style="font-family: monospace; font-weight: bold;">${agreementId}</span></div>
          <div class="meta-item"><span class="meta-label">Customer Name</span><span class="meta-val">${customerName}</span></div>
          <div class="meta-item"><span class="meta-label">Equipment</span><span class="meta-val">${equipmentName}</span></div>
          <div class="meta-item"><span class="meta-label">Monthly Rent</span><span class="meta-val">₹${monthlyRent.toLocaleString("en-IN")}</span></div>
          <div class="meta-item"><span class="meta-label">Security Deposit</span><span class="meta-val">₹${deposit.toLocaleString("en-IN")}</span></div>
          <div class="meta-item"><span class="meta-label">Total Collected</span><span class="meta-val" style="color: #15803d; font-weight: bold;">₹${totalPaid.toLocaleString("en-IN")}</span></div>
        </div>
        
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 120px; text-align: center; background-color: #3b82f6; color: white; border: 1px solid #cbd5e1; padding: 10px 8px;">Receipt ID</th>
              <th style="width: 100px; text-align: center; background-color: #3b82f6; color: white; border: 1px solid #cbd5e1; padding: 10px 8px;">Date</th>
              <th style="background-color: #3b82f6; color: white; border: 1px solid #cbd5e1; padding: 10px 8px;">Payment Type</th>
              <th style="width: 120px; text-align: center; background-color: #3b82f6; color: white; border: 1px solid #cbd5e1; padding: 10px 8px;">Mode</th>
              <th style="background-color: #3b82f6; color: white; border: 1px solid #cbd5e1; padding: 10px 8px;">Collected By</th>
              <th style="width: 120px; text-align: right; background-color: #3b82f6; color: white; border: 1px solid #cbd5e1; padding: 10px 8px;">Amount</th>
              <th style="width: 100px; text-align: center; background-color: #3b82f6; color: white; border: 1px solid #cbd5e1; padding: 10px 8px;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
            <tr class="totals-row">
              <td colspan="5" style="text-align: right; font-weight: bold; border: 1px solid #cbd5e1; padding: 8px;">Total Paid:</td>
              <td style="text-align: right; color: #15803d; font-weight: bold; border: 1px solid #cbd5e1; padding: 8px;">₹${totalPaid.toLocaleString("en-IN")}</td>
              <td style="border: 1px solid #cbd5e1; padding: 8px;"></td>
            </tr>
          </tbody>
        </table>

        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
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
              <Button size="sm" variant="outline" className="h-8 text-[12px] gap-1.5" onClick={handleExportStatement}>
                <Download className="h-3.5 w-3.5" /> Excel Statement
              </Button>
              <Button size="sm" variant="outline" className="h-8 text-[12px] gap-1.5" onClick={handleExportStatementPDF}>
                <Printer className="h-3.5 w-3.5" /> PDF Statement
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
                      <TableCell className="text-[12px]">{formatDateDDMMYYYY(p.date)}</TableCell>
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
  // PERF: the field stays bound to `search` so typing is instant; the filter
  // below (which joins every payment against rentals and customers) runs off
  // the debounced copy.
  const debouncedSearch = useDebounce(search, 300);
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
  const rentalsList = useMemo(() => getRentals(), [dbVersion]);
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
  // PERF: index rentals and customers by id once, rather than scanning both
  // arrays for every payment on every keystroke.
  const rentalsById = useMemo(() => new Map(rentals.map((r: any) => [r.id, r])), [rentals]);
  const customersById = useMemo(() => new Map(customers.map((c: any) => [c.id, c])), [customers]);

  const filteredPayments = useMemo(() => sortLatestFirst(payments.filter((p) => {
    const q = debouncedSearch.toLowerCase().trim();
    const rental = rentalsById.get(p.agreement);
    const customer = customersById.get(p.customerId) || (rental ? customersById.get(rental.customerId) : undefined);

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
  }), "date"), [payments, debouncedSearch, dateFilter, startDate, endDate, rentalsById, customersById]);

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
                          <p className="text-[11px] text-foreground font-medium">{g.latestDate ? formatDateDDMMYYYY(g.latestDate) : "—"}</p>
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
                          <p className="text-[10px] text-muted-foreground">{formatDateDDMMYYYY(p.date)}</p>
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
                          <span>{formatDateDDMMYYYY(p.date)}</span>
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
