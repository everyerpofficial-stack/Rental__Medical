import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo, useCallback } from "react";
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
  Smartphone, FileCheck2, AlertCircle, CheckCircle2, MessageCircle, Calendar, Loader2, Package, Phone, User,
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
  getPaymentReceiptHtmlContent,
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
  getRentalEquipmentDetailedItems,
  cleanNum,
  getAgreementInitialPayments,
  getAgreementPayments,
  getReturns,
} from "@/lib/data-store";
import {
  normalizeWhatsAppPhone,
  openWhatsAppWeb,
  sendWhatsAppMessage,
} from "@/lib/whatsapp";
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
  "Equipment Refund": "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/25",
};

const typeColors: Record<string, string> = {
  Rent:               "bg-primary/8 text-primary border-primary/18",
  "Rent Payment":     "bg-primary/8 text-primary border-primary/18",
  Deposit:            "bg-accent/8 text-accent border-accent/18",
  "Security Deposit": "bg-accent/8 text-accent border-accent/18",
  Refund:             "bg-success/8 text-success border-success/18",
  "Additional Charges":"bg-warning/10 text-warning-foreground border-warning/22",
  "Delivery Charges": "bg-warning/10 text-warning-foreground border-warning/22",
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

  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);

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

  const buildReceiptMessage = () => {
    const rupee = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
    return [
      `*Payment Receipt — ${type}*`,
      `Customer: ${selectedCustomer?.name || "Customer"}`,
      `Agreement: ${agreement}`,
      `Date: ${formatDateDDMMYYYY(date)}`,
      discountAmount > 0 ? `Amount: ${rupee(grossAmount)}` : "",
      discountAmount > 0 ? `Discount: -${rupee(discountAmount)}` : "",
      `Paid: ${rupee(netAmount)} (${mode})`,
      txRef ? `Ref: ${txRef}` : "",
      remainingAfter > 0 ? `Balance remaining: ${rupee(remainingAfter)}` : "Balance cleared. Thank you!",
    ]
      .filter(Boolean)
      .join("\n");
  };

  /**
   * Delivers the receipt to the customer's WhatsApp as a PDF - the same
   * document the Print Receipt button renders - instead of only opening a
   * pre-filled draft the operator still has to send by hand.
   */
  const handleSendWhatsApp = async () => {
    if (!agreement) {
      toast.error("Select an agreement before sharing a receipt.");
      return;
    }
    if (isSendingWhatsApp) return;

    const message = buildReceiptMessage();
    const phone = selectedCustomer?.phone || "";

    if (!normalizeWhatsAppPhone(phone)) {
      // Nothing to send to automatically, but the operator can still forward
      // the text from their own WhatsApp.
      toast.error(`No phone number on file for ${selectedCustomer?.name || "this customer"}.`, {
        action: { label: "Send manually", onClick: () => openWhatsAppWeb(phone, message) },
      });
      return;
    }

    setIsSendingWhatsApp(true);
    try {
      const record = buildPaymentRecord(payment?.id || "PAY-TEMP");
      const toastId = toast.loading(`Sending receipt to ${record.customer} on WhatsApp…`);
      const result = await sendWhatsAppMessage({
        to: phone,
        message,
        documentHtml: getPaymentReceiptHtmlContent(record, record.customer, false),
        filename: `Receipt_${String(record.id).replace(/[^A-Za-z0-9._-]/g, "_")}.pdf`,
        customerName: record.customer,
        reference: agreement,
      });
      if (result.ok) {
        toast.success(`Receipt sent to ${record.customer} on WhatsApp.`, { id: toastId });
      } else {
        toast.error(result.error || "WhatsApp send failed.", {
          id: toastId,
          duration: 12000,
          action: { label: "Send manually", onClick: () => openWhatsAppWeb(phone, message) },
        });
      }
    } finally {
      setIsSendingWhatsApp(false);
    }
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
          <Button variant="outline" type="button" onClick={handleSendWhatsApp} disabled={isSendingWhatsApp}>
            {isSendingWhatsApp ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
            )}
            {isSendingWhatsApp ? "Sending…" : "Send on WhatsApp"}
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
  const isAdmin = typeof window !== "undefined" && localStorage.getItem("medirent-user-role") === "Admin";
  if (!isAdmin) return null;

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
        <DialogFooter className="gap-2 sm:gap-0">
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

function PrintReceiptDialog({ payment, triggerClassName = "h-7 w-7" }: { payment: Payment; triggerClassName?: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className={`${triggerClassName} text-muted-foreground hover:text-foreground`} title="Print Receipt">
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
            <div key={l} className="flex justify-between gap-3 text-[12px]">
              <span className="text-muted-foreground shrink-0">{l}</span>
              <span className="font-semibold text-right min-w-0 wrap-break-word">{v as string}</span>
            </div>
          ))}
          <div className="border-t border-border/50 pt-3 flex justify-between">
            <span className="font-bold text-[13px]">Amount Paid</span>
            <span className="font-display text-[18px] font-bold text-success">₹{payment.amount.toLocaleString("en-IN")}</span>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
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

export { getAgreementInitialPayments, getAgreementPayments };

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

  const userRole = typeof window !== "undefined" ? localStorage.getItem("medirent-user-role") || "" : "";
  const isAdmin = userRole === "Admin";
  const isStaff = userRole === "Staff";
  const isAccountant = userRole === "Accountant";
  const canExport = !isStaff;
  const rentals = getRentals();
  const equipmentList = getEquipment();
  const payments = getPayments();
  const returns = getReturns();
  const rental = rentals.find((r) => {
    if (!r) return false;
    if (r.id === agreementId) return true;
    const cleanR = String(r.id || "").trim().toUpperCase().replace(/^AGR-/i, "");
    const cleanTarget = String(agreementId || "").trim().toUpperCase().replace(/^AGR-/i, "");
    return cleanR && cleanR === cleanTarget;
  });

  const rawPayments = getAgreementPayments(rental || agreementId, payments);
  const agreementPayments = rawPayments.filter((p) => {
    const s = String(p.status || "").trim().toLowerCase();
    return s !== "not paid" && s !== "cancelled" && s !== "failed";
  });
  const totalPaid = agreementPayments
    .filter((p) => String(p.status || "").toLowerCase() === "paid")
    .reduce((sum, p) => sum + p.amount, 0);

  const customerName = rental?.customer || agreementPayments[0]?.customer || "Unknown Customer";
  const customerId = rental?.customerId || agreementPayments[0]?.customerId || "";
  const customers = getCustomers();
  const custObj = (customerId ? customers.find(c => c.id === customerId) : undefined) || customers.find(c => c.name && c.name.toLowerCase() === customerName.toLowerCase());
  const custPhone = rental?.phone || custObj?.phone || "";
  const equipmentName = rental?.equipment || "—";
  const eqModelItems = rental ? getRentalEquipmentDetailedItems(rental, equipmentList, returns, true) : [];
  const modelStr = eqModelItems.map(it => it.model).filter(Boolean).join(", ") || (rental?.model && rental.model.toLowerCase() !== "standard" ? rental.model.trim() : "");
  const serialStr = eqModelItems.map(it => it.serial).filter(Boolean).join(", ") || (rental?.serial && rental.serial.toLowerCase() !== "standard" ? rental.serial.trim() : "");

  // Detailed string for Equipment + Model + Serial Numbers
  const detailedEqList = eqModelItems.length > 0
    ? eqModelItems.map(it => {
        const parts = [it.name];
        if (it.model && it.model.toLowerCase() !== "standard" && it.model.toLowerCase() !== it.name.toLowerCase()) {
          parts.push(`(${it.model})`);
        }
        if (it.serial && it.serial.toLowerCase() !== "standard") {
          parts.push(`· S/N: ${it.serial}`);
        }
        return parts.join(" ");
      })
    : [
        [
          equipmentName,
          modelStr ? `(${modelStr})` : "",
          serialStr ? `· S/N: ${serialStr}` : ""
        ].filter(Boolean).join(" ")
      ];
  const equipmentDetailedText = detailedEqList.join(", ") || equipmentName;

  const status = rental?.status || "Active";
  const monthlyRent = rental?.monthlyRent || 0;
  const deposit = cleanNum(rental?.deposit) ||
    cleanNum(rental?.depositPaidAmount) ||
    (agreementPayments.find((p) => /deposit|security/i.test(p.type))?.amount ?? 0);
  const rentalDate = rental?.start || (rental as any)?.startDate || "";

  // Return Date: Date or ongoing
  const isCompleted = status === "Completed";
  const retRecord = returns.find((ret: any) => {
    if (!ret) return false;
    if (ret.agreement === agreementId || (rental && ret.agreement === rental.id)) return true;
    const cleanRetAgr = String(ret.agreement || "").trim().toUpperCase().replace(/^AGR-/i, "");
    const cleanTarget = String(agreementId || "").trim().toUpperCase().replace(/^AGR-/i, "");
    return cleanRetAgr && cleanRetAgr === cleanTarget;
  });
  const returnDateRaw = rental?.returnedDate || rental?.returnDate || (rental as any)?.actualReturnDate || retRecord?.date || (isCompleted ? rental?.end : undefined);
  const returnDateDisplay = returnDateRaw ? formatDateDDMMYYYY(returnDateRaw) : "Ongoing";

  // Initial Rent Payment Status: Paid / Not Paid / Partial / Free of Cost
  const hasRentPayment = agreementPayments.some((p) => /rent/i.test(p.type) && String(p.status || "").toLowerCase() === "paid");
  const initialRentPaidAmt = cleanNum(rental?.rentPaidAmount);
  let rentPaymentStatus: "Paid" | "Not Paid" | "Partial" | "Free of Cost" = (rental?.rentalPaymentStatus as any) || (hasRentPayment ? "Paid" : "Not Paid");
  if (rentPaymentStatus === "Not Paid" && (hasRentPayment || (monthlyRent > 0 && initialRentPaidAmt >= monthlyRent))) {
    rentPaymentStatus = "Paid";
  } else if (rentPaymentStatus === "Not Paid" && initialRentPaidAmt > 0 && initialRentPaidAmt < monthlyRent) {
    rentPaymentStatus = "Partial";
  }

  // Security Deposit Payment Status: Paid / Not Paid / Partial / Free of Cost
  const hasDepositPayment = agreementPayments.some((p) => /deposit|security/i.test(p.type) && String(p.status || "").toLowerCase() === "paid");
  const initialDepPaidAmt = cleanNum(rental?.depositPaidAmount);
  let depositPaymentStatus: "Paid" | "Not Paid" | "Partial" | "Free of Cost" = (rental?.depositPaymentStatus as any) || (hasDepositPayment ? "Paid" : (deposit === 0 ? "Paid" : "Not Paid"));
  if (depositPaymentStatus === "Not Paid" && (hasDepositPayment || (deposit > 0 && initialDepPaidAmt >= deposit))) {
    depositPaymentStatus = "Paid";
  } else if (depositPaymentStatus === "Not Paid" && initialDepPaidAmt > 0 && initialDepPaidAmt < deposit) {
    depositPaymentStatus = "Partial";
  }

  // Additional Charges: amount & payment status
  const addItems = Array.isArray(rental?.additionalItems) ? rental.additionalItems : [];
  const selectedAddons = addItems.filter((i: any) => i && (i.selected || i.isCustom));

  let additionalChargesAmount = 0;
  let additionalPaymentStatus: "Paid" | "Not Paid" | "Partial" | "Free of Cost" = "Not Paid";

  if (selectedAddons.length > 0) {
    additionalChargesAmount = selectedAddons.reduce((sum: number, i: any) => sum + (i.status === "Free of Cost" ? 0 : cleanNum(i.amount)), 0);
    const paidCount = selectedAddons.filter((i: any) => i.status === "Paid").length;
    const focCount = selectedAddons.filter((i: any) => i.status === "Free of Cost").length;
    if (paidCount === selectedAddons.length && selectedAddons.length > 0) {
      additionalPaymentStatus = "Paid";
    } else if (focCount === selectedAddons.length && selectedAddons.length > 0) {
      additionalPaymentStatus = "Free of Cost";
    } else if (paidCount > 0) {
      additionalPaymentStatus = "Partial";
    } else {
      additionalPaymentStatus = "Not Paid";
    }
  } else {
    additionalChargesAmount = cleanNum(rental?.additionalCharges) + cleanNum(rental?.deliveryCharges) + cleanNum(rental?.installationCharges) + cleanNum(rental?.removalCharges);
    const addonPayments = agreementPayments.filter((p: any) =>
      /additional|delivery|setup|installation|removal/i.test(p.type) && String(p.status || "").toLowerCase() === "paid"
    );
    const addonPaidSum = addonPayments.reduce((s: number, p: any) => s + cleanNum(p.amount), 0);
    if (additionalChargesAmount === 0 && addonPaidSum > 0) {
      additionalChargesAmount = addonPaidSum;
    }
    if (addonPaidSum >= additionalChargesAmount && additionalChargesAmount > 0) {
      additionalPaymentStatus = "Paid";
    } else if (addonPaidSum > 0 && addonPaidSum < additionalChargesAmount) {
      additionalPaymentStatus = "Partial";
    } else if ((rental as any)?.additionalPaymentStatus) {
      additionalPaymentStatus = (rental as any).additionalPaymentStatus;
    } else if (additionalChargesAmount === 0) {
      additionalPaymentStatus = "Paid";
    } else {
      additionalPaymentStatus = "Not Paid";
    }
  }

  // Total Due calculation
  const balance = rental ? getAgreementBalance(rental, payments) : null;
  let totalDue = 0;
  if (retRecord && (retRecord.duePendingBalance !== undefined || retRecord.pendingBalance !== undefined)) {
    totalDue = retRecord.duePendingBalance !== undefined
      ? cleanNum(retRecord.duePendingBalance)
      : cleanNum(retRecord.pendingBalance) + cleanNum(retRecord.damageCharges) + cleanNum(retRecord.unpaidAccessoryTotal);
  } else if (balance) {
    totalDue = balance.totalDue;
  }

  const displayEquipments: { name: string; model?: string }[] = eqModelItems.length > 0
    ? eqModelItems.map(it => ({
        name: it.name || equipmentName || "Medical Equipment",
        model: (it.model && it.model.toLowerCase() !== "standard" && it.model.toLowerCase() !== it.name.toLowerCase()) ? it.model : undefined,
      }))
    : [{ name: equipmentName, model: modelStr || undefined }];

  const renderCardStatusBadge = (st: "Paid" | "Not Paid" | "Partial" | "Free of Cost") => {
    if (st === "Paid") {
      return (
        <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.5 rounded leading-none">
          Paid
        </span>
      );
    }
    if (st === "Partial") {
      return (
        <span className="inline-flex items-center text-[10px] font-bold text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-1.5 py-0.5 rounded leading-none">
          Partial
        </span>
      );
    }
    if (st === "Free of Cost") {
      return (
        <span className="inline-flex items-center text-[10px] font-bold text-blue-700 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-1.5 py-0.5 rounded leading-none">
          FOC
        </span>
      );
    }
    return (
      <span className="inline-flex items-center text-[10px] font-bold text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800 px-1.5 py-0.5 rounded leading-none">
        Not Paid
      </span>
    );
  };

  const handleExportStatement = () => {
    if (agreementPayments.length === 0) {
      toast.info(`No payment records found for ${agreementId} to export.`);
      return;
    }
    const headers = ["Receipt ID", "Date", "Equipment (Model & Serial)", "Payment Type", "Payment Mode", "Collected By", "Amount (₹)", "Status"];
    const rows = agreementPayments.map(p => {
      const pEquipments = getPaymentEquipmentDisplay(p, rentals, equipmentList);
      const eqStr = pEquipments
        .map(it => {
          const parts = [it.name];
          if (it.model) parts.push(`(${it.model})`);
          if ((it as any).serial) parts.push(`· S/N: ${(it as any).serial}`);
          return parts.join(" ");
        })
        .join(", ");
      return [
        p.id,
        p.date,
        eqStr,
        p.type,
        p.mode,
        (p.collectedBy as string) || "Admin",
        p.amount.toString(),
        p.status
      ];
    });
    downloadExcel(`payment_history_${agreementId}.xls`, headers, rows, [110, 110, 220, 120, 110, 120, 110, 100]);
    toast.success(`Payment statement for ${agreementId} exported successfully.`);
  };

  const handleExportStatementPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Popup blocked! Please allow popups to print.");
      return;
    }

    const tableRowsHtml = agreementPayments.length === 0
      ? `<tr><td colspan="8" style="text-align: center; border: 1px solid #cbd5e1; padding: 20px; color: #64748b;">No payments recorded for agreement ${agreementId} yet.</td></tr>`
      : agreementPayments.map(p => {
      const pEquipments = getPaymentEquipmentDisplay(p, rentals, equipmentList);
      const eqStr = pEquipments
        .map(it => {
          const parts = [it.name];
          if (it.model) parts.push(`(${it.model})`);
          if ((it as any).serial) parts.push(`· S/N: ${(it as any).serial}`);
          return parts.join(" ");
        })
        .join(", ");
      return `
      <tr>
        <td style="font-family: monospace; font-weight: bold; text-align: center; border: 1px solid #cbd5e1; padding: 8px; white-space: nowrap;">${p.id}</td>
        <td style="text-align: center; border: 1px solid #cbd5e1; padding: 8px; white-space: nowrap;">${formatDateDDMMYYYY(p.date)}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px;">${eqStr}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px; white-space: nowrap;">${p.type}</td>
        <td style="text-align: center; border: 1px solid #cbd5e1; padding: 8px; white-space: nowrap;">${p.mode}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px; white-space: nowrap;">${p.collectedBy || "Admin"}</td>
        <td style="text-align: right; font-weight: bold; border: 1px solid #cbd5e1; padding: 8px; white-space: nowrap;">₹${p.amount.toLocaleString("en-IN")}</td>
        <td style="text-align: center; border: 1px solid #cbd5e1; padding: 8px; white-space: nowrap;">
          <span style="display: inline-block; padding: 2px 6px; font-size: 10px; font-weight: bold; border-radius: 4px; border: 1px solid ${p.status === "Paid" ? "#bbf7d0; background-color: #f0fdf4; color: #15803d;" : "#fecaca; background-color: #fef2f2; color: #b91c1c;"}">
            ${p.status}
          </span>
        </td>
      </tr>
    `;
    }).join("");

    const rentPaidLabel = rentPaymentStatus === "Paid" ? "Initial rent paid" : (rentPaymentStatus === "Partial" ? "Initial rent partial" : "Initial rent not paid");
    const depPaidLabel = depositPaymentStatus === "Paid" ? "Paid" : (depositPaymentStatus === "Partial" ? "Partial" : "Not paid");
    const addPaidLabel = additionalPaymentStatus === "Paid" ? "Paid" : (additionalPaymentStatus === "Partial" ? "Partial" : "Not paid");

    const htmlContent = `
      <html>
      <head>
        <title>Payment Statement - ${agreementId}</title>
        <style>
          body { font-family: 'Segoe UI', system-ui, sans-serif; padding: 30px; color: #1e293b; }
          .header-title { font-size: 22px; font-weight: bold; color: #1e3a8a; text-align: center; padding: 15px; background-color: #f0f9ff; border: 1.5px solid #bae6fd; border-radius: 8px; margin-bottom: 20px; }
          .meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 25px; background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 13px; }
          .meta-item { display: flex; flex-direction: column; }
          .meta-label { font-weight: bold; color: #64748b; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.05em; }
          .meta-val { font-weight: 600; color: #0f172a; margin-top: 2px; font-size: 12.5px; }
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
          <div class="meta-item"><span class="meta-label">Rental Date</span><span class="meta-val">${rentalDate ? formatDateDDMMYYYY(rentalDate) : "—"}</span></div>
          <div class="meta-item"><span class="meta-label">Return Date</span><span class="meta-val" style="font-weight: 600; color: ${returnDateRaw ? '#0f172a' : '#2563eb'};">${returnDateDisplay}</span></div>

          <div class="meta-item"><span class="meta-label">Customer Name</span><span class="meta-val">${customerName}</span></div>
          <div class="meta-item"><span class="meta-label">Contact Number</span><span class="meta-val">${custPhone || "—"}</span></div>
          <div class="meta-item"><span class="meta-label">Agreement Status</span><span class="meta-val" style="font-weight: bold; color: ${status === 'Active' ? '#15803d' : '#2563eb'};">${status}</span></div>

          <div class="meta-item" style="grid-column: span 3;"><span class="meta-label">Equipment, Model & Sr. No's</span><span class="meta-val">${equipmentDetailedText}</span></div>

          <div class="meta-item">
            <span class="meta-label">Monthly Rent</span>
            <span class="meta-val">₹${monthlyRent.toLocaleString("en-IN")} <span style="font-size: 11px; font-weight: bold; color: ${rentPaymentStatus === 'Paid' ? '#15803d' : '#b91c1c'};">(${rentPaidLabel})</span></span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Security Deposit</span>
            <span class="meta-val">₹${deposit.toLocaleString("en-IN")} <span style="font-size: 11px; font-weight: bold; color: ${depositPaymentStatus === 'Paid' ? '#15803d' : '#b91c1c'};">(${depPaidLabel})</span></span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Additional Charge</span>
            <span class="meta-val">₹${additionalChargesAmount.toLocaleString("en-IN")} <span style="font-size: 11px; font-weight: bold; color: ${additionalPaymentStatus === 'Paid' ? '#15803d' : '#b91c1c'};">(${addPaidLabel})</span></span>
          </div>

          <div class="meta-item"><span class="meta-label">Total Collected</span><span class="meta-val" style="color: #15803d; font-weight: bold;">₹${totalPaid.toLocaleString("en-IN")}</span></div>
          <div class="meta-item"><span class="meta-label">Total Due</span><span class="meta-val" style="color: ${totalDue > 0 ? '#b91c1c' : '#15803d'}; font-weight: bold;">₹${totalDue.toLocaleString("en-IN")}</span></div>
          <div class="meta-item"><span class="meta-label">Total Receipts</span><span class="meta-val" style="color: #2563eb; font-weight: bold;">${agreementPayments.length}</span></div>
        </div>
        
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 120px; text-align: center; background-color: #3b82f6; color: white; border: 1px solid #cbd5e1; padding: 10px 8px;">Receipt ID</th>
              <th style="width: 100px; text-align: center; background-color: #3b82f6; color: white; border: 1px solid #cbd5e1; padding: 10px 8px;">Date</th>
              <th style="background-color: #3b82f6; color: white; border: 1px solid #cbd5e1; padding: 10px 8px;">Equipment</th>
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
              <td colspan="6" style="text-align: right; font-weight: bold; border: 1px solid #cbd5e1; padding: 8px;">Total Paid:</td>
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
      {/* Full-screen sheet on phones; centred modal with side margins from sm up.
          Flex column (not the base grid) so wide content can never stretch the
          dialog past the viewport, and only the body scrolls so the title bar
          and close button stay in view. */}
      <DialogContent
        className="flex flex-col gap-0 p-0 sm:p-0 overflow-hidden w-full max-w-none h-[100dvh] max-h-[100dvh] rounded-none border-0 sm:w-[calc(100%-2rem)] sm:max-w-3xl sm:h-auto sm:max-h-[90dvh] sm:rounded-xl sm:border lg:max-w-5xl xl:max-w-6xl focus:outline-none"
        // Focus the dialog itself rather than the first export button, which
        // otherwise opens with a focus ring after a tap on a card.
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          (e.currentTarget as HTMLElement | null)?.focus();
        }}
      >
        <DialogHeader className="shrink-0 space-y-0 text-left border-b border-border/60 bg-muted/20 px-4 py-3.5 pr-12 sm:px-5 sm:py-4 sm:pr-14">
          <div className="flex items-center gap-x-2 gap-y-1.5 flex-wrap">
            <DialogTitle className="text-[17px] sm:text-[18px] font-bold">Payment History</DialogTitle>
            <span className="font-mono text-[12px] sm:text-[13px] font-bold bg-primary/10 text-primary px-2 sm:px-2.5 py-0.5 rounded-md border border-primary/20 wrap-anywhere">
              {agreementId}
            </span>
            <StatusBadge status={status as any} />
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
          {/* Agreement details & statement exports */}
          <div className="px-4 py-3.5 sm:px-5 sm:py-4 border-b border-border/50 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0 space-y-1.5 text-[12px] text-muted-foreground md:flex md:flex-wrap md:items-center md:gap-x-4 md:gap-y-1.5 md:space-y-0">
              <div className="flex items-start gap-1.5 min-w-0">
                <User className="h-3.5 w-3.5 mt-px text-primary/70 shrink-0" />
                <span className="min-w-0 wrap-break-word">
                  Customer: <strong className="text-foreground font-semibold">{customerName}</strong>
                </span>
              </div>
              {custPhone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-primary/70 shrink-0" />
                  <a href={`tel:${custPhone}`} className="font-medium text-foreground/80 hover:underline hover:text-primary">{custPhone}</a>
                </div>
              )}
              <div className="flex items-start gap-1.5 min-w-0">
                <Package className="h-3.5 w-3.5 mt-px text-primary/70 shrink-0" />
                <span className="min-w-0 wrap-break-word">
                  Equipment: <strong className="text-foreground font-semibold">{equipmentName}</strong>
                  {modelStr && <span className="text-muted-foreground font-semibold ml-1">({modelStr})</span>}
                  {serialStr && <span className="text-muted-foreground font-mono text-[11px] ml-1.5">· S/N: {serialStr}</span>}
                </span>
              </div>
              {rentalDate && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-primary/70 shrink-0" />
                  <span>
                    Rental Date: <strong className="text-foreground font-semibold">{formatDateDDMMYYYY(rentalDate)}</strong>
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-primary/70 shrink-0" />
                <span>
                  Return Date: <strong className={`font-semibold ${returnDateRaw ? "text-foreground" : "text-primary"}`}>{returnDateDisplay}</strong>
                </span>
              </div>
            </div>
            <div className="flex w-full items-center gap-2 md:w-auto md:shrink-0">
              {canExport && (
                <Button size="sm" variant="outline" className="h-9 md:h-8 flex-1 md:flex-none text-[12px] gap-1.5" onClick={handleExportStatement}>
                  <Download className="h-3.5 w-3.5" /> Excel Statement
                </Button>
              )}
              <Button size="sm" variant="outline" className="h-9 md:h-8 flex-1 md:flex-none text-[12px] gap-1.5" onClick={handleExportStatementPDF}>
                <Printer className="h-3.5 w-3.5" /> PDF Statement
              </Button>
            </div>
          </div>

          {/* Financial Summary Cards */}
          <div className="px-4 py-3.5 sm:p-5 bg-muted/10 border-b border-border/50 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
            {/* 1. Total Collected */}
            <div className="bg-card p-3 rounded-lg border border-border/50 min-w-0 flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground leading-tight">Total Collected</p>
                <p className="text-[16px] sm:text-[18px] font-bold text-success mt-1 wrap-anywhere">₹{totalPaid.toLocaleString("en-IN")}</p>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Paid receipts</p>
            </div>

            {/* 2. Total Receipts */}
            <div className="bg-card p-3 rounded-lg border border-border/50 min-w-0 flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground leading-tight">Total Receipts</p>
                <p className="text-[16px] sm:text-[18px] font-bold text-primary mt-1">{agreementPayments.length}</p>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Transactions recorded</p>
            </div>

            {/* 3. Monthly Rent (Initial rent paid or not paid) */}
            <div className="bg-card p-3 rounded-lg border border-border/50 min-w-0 flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground leading-tight">Monthly Rent</p>
                <div className="flex items-baseline gap-1.5 flex-wrap mt-1">
                  <p className="text-[15px] sm:text-[16px] font-semibold text-foreground wrap-anywhere">₹{monthlyRent.toLocaleString("en-IN")}</p>
                  {renderCardStatusBadge(rentPaymentStatus)}
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                Initial rent: <strong className={rentPaymentStatus === "Paid" ? "text-emerald-600 dark:text-emerald-400" : (rentPaymentStatus === "Partial" ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400")}>{rentPaymentStatus}</strong>
              </p>
            </div>

            {/* 4. Security Deposit (paid or not paid) */}
            <div className="bg-card p-3 rounded-lg border border-border/50 min-w-0 flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground leading-tight">Security Deposit</p>
                <div className="flex items-baseline gap-1.5 flex-wrap mt-1">
                  <p className="text-[15px] sm:text-[16px] font-semibold text-foreground wrap-anywhere">₹{deposit.toLocaleString("en-IN")}</p>
                  {renderCardStatusBadge(depositPaymentStatus)}
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                Deposit: <strong className={depositPaymentStatus === "Paid" ? "text-emerald-600 dark:text-emerald-400" : (depositPaymentStatus === "Partial" ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400")}>{depositPaymentStatus}</strong>
              </p>
            </div>

            {/* 5. Additional Charges (paid or not paid) */}
            <div className="bg-card p-3 rounded-lg border border-border/50 min-w-0 flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground leading-tight">Additional Charges</p>
                <div className="flex items-baseline gap-1.5 flex-wrap mt-1">
                  <p className="text-[15px] sm:text-[16px] font-semibold text-foreground wrap-anywhere">₹{additionalChargesAmount.toLocaleString("en-IN")}</p>
                  {renderCardStatusBadge(additionalPaymentStatus)}
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1 truncate" title={selectedAddons.map((i: any) => i.name).join(", ")}>
                {selectedAddons.length > 0 ? selectedAddons.map((i: any) => i.name).join(", ") : `Charges: ${additionalPaymentStatus}`}
              </p>
            </div>

            {/* 6. Total Due */}
            <div className="bg-card p-3 rounded-lg border border-border/50 min-w-0 flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground leading-tight">Total Due</p>
                <p className={`text-[15px] sm:text-[16px] font-bold mt-1 wrap-anywhere ${totalDue > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                  ₹{totalDue.toLocaleString("en-IN")}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                {totalDue > 0 ? "Pending balance" : "All cleared"}
              </p>
            </div>
          </div>

          {/* History Table */}
          <div className="px-4 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-5">
          <h4 className="text-[13px] font-bold mb-3 flex items-center gap-2">
            <Receipt className="h-4 w-4 text-primary" />
            Payment Transactions ({agreementPayments.length})
          </h4>
          {agreementPayments.length === 0 ? (
            <div className="py-12 px-4 text-center text-muted-foreground text-[13px] border border-dashed border-border rounded-xl wrap-break-word">
              No payments recorded for agreement {agreementId} yet.
            </div>
          ) : (
            <div className="rounded-xl border border-border/60 overflow-hidden">
              <div className="hidden xl:block">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="whitespace-nowrap px-3">Receipt ID</TableHead>
                      <TableHead className="whitespace-nowrap px-3">Date</TableHead>
                      <TableHead className="whitespace-nowrap px-3 min-w-[200px]">Equipment</TableHead>
                      <TableHead className="whitespace-nowrap px-3">Type</TableHead>
                      <TableHead className="whitespace-nowrap px-3">Mode</TableHead>
                      <TableHead className="whitespace-nowrap px-3">Collected By</TableHead>
                      <TableHead className="whitespace-nowrap px-3 text-right">Amount</TableHead>
                      <TableHead className="whitespace-nowrap px-3 text-center">Status</TableHead>
                      <TableHead className="whitespace-nowrap px-3 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agreementPayments.map((p) => {
                      const pEquipments = getPaymentEquipmentDisplay(p, rentals, equipmentList);
                      return (
                        <TableRow key={p.id}>
                          <TableCell className="font-mono text-[12px] font-bold text-primary whitespace-nowrap px-3 py-2.5">{p.id}</TableCell>
                          <TableCell className="text-[12px] whitespace-nowrap px-3 py-2.5">{formatDateDDMMYYYY(p.date)}</TableCell>
                          <TableCell className="text-[12px] font-medium px-3 py-2.5">
                            <div className="space-y-1.5 min-w-[200px]">
                              {pEquipments.map((it, idx) => (
                                <div key={idx} className="leading-tight">
                                  <div className="flex items-center gap-1.5 font-semibold text-foreground text-[12px]">
                                    <Package className="h-3.5 w-3.5 text-primary shrink-0" />
                                    <span>{it.name}</span>
                                  </div>
                                  {it.model && (
                                    <span className="text-[11px] text-muted-foreground font-medium pl-5 block">
                                      Model: {it.model}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap px-3 py-2.5">
                            <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${typeColors[p.type] ?? "bg-muted text-muted-foreground border-border/50"}`}>
                              {p.type}
                            </span>
                          </TableCell>
                        <TableCell className="whitespace-nowrap px-3 py-2.5">
                          <span
                            className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${modeColors[p.mode] ?? "bg-muted text-muted-foreground border-border/50"}`}
                            title={p.notes || undefined}
                          >
                            {p.mode}
                          </span>
                        </TableCell>
                        <TableCell className="text-[12px] font-medium whitespace-nowrap px-3 py-2.5">{(p.collectedBy as string) || "Dr. Rao"}</TableCell>
                        <TableCell className="text-right whitespace-nowrap px-3 py-2.5">
                          <span className="font-bold text-[13px]">₹{p.amount.toLocaleString("en-IN")}</span>
                          {cleanNum(p.discount) > 0 && (
                            <span className="block text-[10.5px] font-semibold text-success mt-0.5">
                              Discount ₹{cleanNum(p.discount).toLocaleString("en-IN")}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center whitespace-nowrap px-3 py-2.5"><StatusBadge status={p.status} /></TableCell>
                        <TableCell className="text-right whitespace-nowrap px-3 py-2.5">
                          <div className="flex items-center justify-end gap-1">
                            <PrintReceiptDialog payment={p} />
                            {isAdmin && !String(p.id).startsWith("PAY-DEP-") && !String(p.id).startsWith("PAY-RENT-") && !String(p.id).startsWith("PAY-ADD-") && (
                              <DeletePaymentDialog payment={p} onDelete={onRefresh} trigger={
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              } />
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile / tablet card list */}
              <div className="xl:hidden divide-y divide-border/60">
                {agreementPayments.map((p) => {
                  const pEquipments = getPaymentEquipmentDisplay(p, rentals, equipmentList);
                  return (
                    <div key={p.id} className="px-3.5 py-3 sm:px-4 sm:py-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-mono text-[11.5px] font-bold text-primary wrap-anywhere">{p.id}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground/70 shrink-0" />
                            {formatDateDDMMYYYY(p.date)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="font-display text-[15px] font-bold whitespace-nowrap">₹{p.amount.toLocaleString("en-IN")}</span>
                          {cleanNum(p.discount) > 0 && (
                            <span className="-mt-1 text-[10.5px] font-semibold text-success whitespace-nowrap">
                              Discount ₹{cleanNum(p.discount).toLocaleString("en-IN")}
                            </span>
                          )}
                          <StatusBadge status={p.status} />
                        </div>
                      </div>
                      <div className="space-y-1 mt-2">
                        {pEquipments.map((it, idx) => (
                          <div key={idx} className="flex items-start gap-1.5 text-[12px] leading-snug">
                            <Package className="h-3.5 w-3.5 mt-px text-primary shrink-0" />
                            <span className="min-w-0 wrap-break-word">
                              <span className="font-semibold text-foreground">{it.name}</span>
                              {it.model && (
                                <span className="text-[11px] text-muted-foreground font-medium"> · Model: {it.model}</span>
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] text-muted-foreground">
                          <span className={`inline-flex items-center rounded px-1.5 py-0.5 font-semibold ${typeColors[p.type] ?? "bg-muted text-muted-foreground"}`}>{p.type}</span>
                          <span
                            className={`inline-flex items-center rounded px-1.5 py-0.5 font-semibold ${modeColors[p.mode] ?? "bg-muted text-muted-foreground"}`}
                            title={p.notes || undefined}
                          >
                            {p.mode}
                          </span>
                          <span className="min-w-0 wrap-break-word">by {(p.collectedBy as string) || "Dr. Rao"}</span>
                        </div>
                        <div className="flex shrink-0 items-center -mr-1.5">
                          <PrintReceiptDialog payment={p} triggerClassName="h-9 w-9" />
                          {isAdmin && !String(p.id).startsWith("PAY-DEP-") && !String(p.id).startsWith("PAY-RENT-") && !String(p.id).startsWith("PAY-ADD-") && (
                            <DeletePaymentDialog payment={p} onDelete={onRefresh} trigger={
                              <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            } />
                          )}
                        </div>
                      </div>
                      {p.notes && (
                        <p className="mt-1 text-[11px] text-muted-foreground italic wrap-break-word">
                          {p.notes}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Helper to extract only the model name from an equipment string or explicit model property */
const extractModelOnly = (eqStr: string, explicitModel?: string): string => {
  if (explicitModel && explicitModel.trim() && explicitModel.toLowerCase() !== "standard") {
    return explicitModel.trim();
  }
  if (!eqStr) return "—";

  // Strip serial info if appended (e.g. " - S/N: ...")
  let clean = eqStr.replace(/\s*-\s*S\/N:.*$/i, "").replace(/\s*S\/N:.*$/i, "").trim();

  if (clean.includes(",")) {
    return clean
      .split(",")
      .map((part) => extractModelOnly(part.trim()))
      .filter(Boolean)
      .join(", ");
  }

  // Remove common category prefixes to leave only the model name (e.g., "Oxygen Concentrator 5LP" -> "5LP")
  const categoryPrefixes = [
    "Oxygen Concentrator",
    "Auto CPAP Machine",
    "CPAP Machine",
    "Bipap Machine",
    "Bi-PAP Machine",
    "Surgical Cot With Mattress",
    "Surgical Cot",
    "Foldable Wheel Chair",
    "Wheel Chair",
    "Patient Monitor",
    "Syringe Pump",
    "Infusion Pump",
    "Patient Ventilator",
    "Ventilator",
  ];

  for (const cat of categoryPrefixes) {
    if (clean.toLowerCase().startsWith(cat.toLowerCase())) {
      const remainder = clean.slice(cat.length).replace(/^[\s\-\:]+/, "").trim();
      if (remainder) {
        return remainder;
      }
    }
  }

  return clean;
};

/** Get detailed equipment name and model information for an agreement row */
export interface AgreementEquipmentDisplay {
  name: string;
  model: string;
}

function getAgreementEquipmentModelInfo(g: any, rentalsList: any[], equipmentList: any[]): AgreementEquipmentDisplay[] {
  const rental = rentalsList.find((r) => r.id === (g.agreementId || g.agreement));
  if (!rental) {
    return [{ name: g.equipment || "—", model: "" }];
  }

  const items = getRentalEquipmentDetailedItems(rental, equipmentList, undefined, false);
  if (items.length > 0) {
    return items.map((it) => {
      let model = it.model ? String(it.model).trim() : "";
      if (model.toLowerCase() === "standard" || model.toLowerCase() === it.name.toLowerCase()) {
        model = "";
      }
      return {
        name: it.name || rental.equipment || "Equipment",
        model: model,
      };
    });
  }

  let model = rental.model ? String(rental.model).trim() : "";
  if (model.toLowerCase() === "standard" || model.toLowerCase() === String(rental.equipment || "").toLowerCase()) {
    model = "";
  }
  return [{
    name: rental.equipment || g.equipment || "—",
    model: model,
  }];
}

/**
 * Resolves the specific equipment item(s) that a payment was made for.
 * Handles single-item agreements, explicit payment.equipmentId, payment.notes mentions,
 * and exact amount matching against individual equipment rent/deposit rates.
 */
export function getPaymentEquipmentDisplay(
  payment: any,
  rentalsList: any[],
  equipmentList: any[]
): AgreementEquipmentDisplay[] {
  if (!payment) return [];

  const agreementId = payment.agreement || payment.agreementId || payment.rentalId;
  const rental = rentalsList.find((r) => r.id === agreementId);

  if (!rental) {
    const name = payment.equipment || "—";
    let model = payment.model ? String(payment.model).trim() : "";
    if (model.toLowerCase() === "standard" || model.toLowerCase() === String(name).toLowerCase()) {
      model = "";
    }
    return [{ name, model }];
  }

  const detailedItems = getRentalEquipmentDetailedItems(rental, equipmentList, undefined, false);
  if (detailedItems.length <= 1) {
    if (detailedItems.length === 1) {
      let model = detailedItems[0].model ? String(detailedItems[0].model).trim() : "";
      if (model.toLowerCase() === "standard" || model.toLowerCase() === detailedItems[0].name.toLowerCase()) {
        model = "";
      }
      return [{
        name: detailedItems[0].name || rental.equipment || "Equipment",
        model,
      }];
    }
    return [{ name: rental.equipment || payment.equipment || "—", model: "" }];
  }

  // Multi-item agreement: resolve which equipment this specific payment belongs to
  const cleanId = (s: any) => String(s || "").trim().toLowerCase();
  const cleanStr = (s: any) => String(s || "").toLowerCase();

  const pEqIds = payment.equipmentId
    ? String(payment.equipmentId).split(",").map(cleanId).filter(Boolean)
    : [];
  const notes = cleanStr(payment.notes);
  const pType = cleanStr(payment.type);
  const pAmt = cleanNum(payment.amount);

  // 1. Explicit equipmentId on payment that matches a specific item (or subset of items)
  if (pEqIds.length > 0 && pEqIds.length < detailedItems.length) {
    const matched = detailedItems.filter((it) => pEqIds.includes(cleanId(it.equipmentId)));
    if (matched.length > 0) {
      return matched.map((it) => {
        let model = it.model ? String(it.model).trim() : "";
        if (model.toLowerCase() === "standard" || model.toLowerCase() === it.name.toLowerCase()) {
          model = "";
        }
        return { name: it.name, model };
      });
    }
  }

  // 2. Check notes for equipment serial, model, ID, or specific name keyword
  const notesMatched = detailedItems.filter((it) => {
    const s = cleanId(it.serial);
    if (s && s.length >= 3 && notes.includes(s)) return true;
    const m = cleanId(it.model);
    if (m && m.length >= 3 && m !== "standard" && notes.includes(m)) return true;
    const id = cleanId(it.equipmentId);
    if (id && id.length >= 3 && notes.includes(id)) return true;

    const n = cleanStr(it.name);
    if (n.includes("cot") && (notes.includes("cot") || notes.includes("mattress") || notes.includes("bed") || notes.includes("surgical cot"))) return true;
    if (n.includes("concentrator") && (notes.includes("concentrator") || notes.includes("oxygen") || notes.includes("5lp") || notes.includes("10lp") || notes.includes("5 l") || notes.includes("10 l"))) return true;
    if (n.includes("bipap") && notes.includes("bipap")) return true;
    if (n.includes("cpap") && notes.includes("cpap")) return true;
    if ((n.includes("wheelchair") || n.includes("wheel chair")) && (notes.includes("wheelchair") || notes.includes("wheel chair"))) return true;
    if (n.includes("suction") && notes.includes("suction")) return true;
    if (n.includes("monitor") && notes.includes("monitor")) return true;
    if (n.includes("pump") && notes.includes("pump")) return true;

    return false;
  });

  if (notesMatched.length > 0 && notesMatched.length < detailedItems.length) {
    return notesMatched.map((it) => {
      let model = it.model ? String(it.model).trim() : "";
      if (model.toLowerCase() === "standard" || model.toLowerCase() === it.name.toLowerCase()) {
        model = "";
      }
      return { name: it.name, model };
    });
  }

  // 3. Match by payment amount & type against equipment item rates
  const rawItems: any[] = Array.isArray(rental.equipmentItems) ? rental.equipmentItems : [];

  if (pType.includes("deposit") || pType.includes("security")) {
    const matchedByDeposit = detailedItems.filter((it) => {
      const raw = rawItems.find((r: any) => cleanId(r.equipmentId) === cleanId(it.equipmentId));
      const dep = cleanNum(raw?.deposit ?? (it as any).deposit);
      return dep > 0 && dep === pAmt;
    });
    if (matchedByDeposit.length === 1) {
      const it = matchedByDeposit[0];
      let model = it.model ? String(it.model).trim() : "";
      if (model.toLowerCase() === "standard" || model.toLowerCase() === it.name.toLowerCase()) {
        model = "";
      }
      return [{ name: it.name, model }];
    }
  } else if (pType.includes("rent")) {
    const matchedByRent = detailedItems.filter((it) => {
      const raw = rawItems.find((r: any) => cleanId(r.equipmentId) === cleanId(it.equipmentId));
      const rRent = cleanNum(raw?.monthlyRent || raw?.rentRate || raw?.dailyRent || (it as any).monthlyRent);
      return rRent > 0 && rRent === pAmt;
    });
    if (matchedByRent.length === 1) {
      const it = matchedByRent[0];
      let model = it.model ? String(it.model).trim() : "";
      if (model.toLowerCase() === "standard" || model.toLowerCase() === it.name.toLowerCase()) {
        model = "";
      }
      return [{ name: it.name, model }];
    }
  }

  // 4. Default: Return all items for this agreement
  return detailedItems.map((it) => {
    let model = it.model ? String(it.model).trim() : "";
    if (model.toLowerCase() === "standard" || model.toLowerCase() === it.name.toLowerCase()) {
      model = "";
    }
    return {
      name: it.name || rental.equipment || "Equipment",
      model,
    };
  });
}

/** Get the equipment model(s) for an agreement row */
function getAgreementEquipmentModel(g: any, rentalsList: any[], equipmentList: any[]): string {
  const infos = getAgreementEquipmentModelInfo(g, rentalsList, equipmentList);
  const models = infos.map(i => i.model).filter(Boolean);
  if (models.length > 0) {
    return Array.from(new Set(models)).join(", ");
  }
  return extractModelOnly(g.equipment || "");
}

function CustomerPhoneDisplay({
  phone,
  altPhone,
  contactNumber3,
}: {
  phone?: any;
  altPhone?: any;
  contactNumber3?: any;
}) {
  const p1 = phone != null ? String(phone).trim() : "";
  const p2 = altPhone != null ? String(altPhone).trim() : "";
  const p3 = contactNumber3 != null ? String(contactNumber3).trim() : "";
  if (!p1 && !p2 && !p3) return null;

  return (
    <div className="space-y-0.5 mt-0.5 max-w-[200px]" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center flex-wrap gap-x-1.5 gap-y-0.5 text-[11px] text-muted-foreground">
        {p1 && (
          <span className="flex items-center gap-0.5 text-foreground/80">
            <Phone className="h-2.5 w-2.5 text-primary shrink-0" />
            <a href={`tel:${p1}`} className="hover:underline hover:text-primary" onClick={(e) => e.stopPropagation()}>
              {p1}
            </a>
          </span>
        )}
        {p2 && (
          <span className="flex items-center gap-0.5 text-[11px] text-foreground/80">
            {!p1 && <Phone className="h-2.5 w-2.5 text-primary shrink-0" />}
            <a href={`tel:${p2}`} className="hover:underline hover:text-primary" onClick={(e) => e.stopPropagation()}>
              {p2}
            </a>
          </span>
        )}
        {p3 && (
          <span className="flex items-center gap-0.5 text-[11px] text-foreground/80">
            {!p1 && !p2 && <Phone className="h-2.5 w-2.5 text-primary shrink-0" />}
            <a href={`tel:${p3}`} className="hover:underline hover:text-primary" onClick={(e) => e.stopPropagation()}>
              {p3}
            </a>
          </span>
        )}
      </div>
    </div>
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

  const userRole = typeof window !== "undefined" ? localStorage.getItem("medirent-user-role") || "" : "";
  const isStaff = userRole === "Staff";
  const isAccountant = userRole === "Accountant";
  const isAdmin = userRole === "Admin";
  const showKpiCards = !isStaff && !isAccountant;
  const canExport = !isStaff && !isAccountant;
  const canViewPaymentHistory = true;

  const refresh = () => setPayments(getPayments());

  useEffect(() => {
    setPayments(getPayments());
  }, [dbVersion]);

  const rentals = useMemo(() => getRentals(), [dbVersion]);
  const customers = useMemo(() => getCustomers(), [dbVersion]);
  const equipmentList = useMemo(() => getEquipment(), [dbVersion]);
  const rentalsList = rentals;

  // PERF: index rentals and customers by id/name once, rather than scanning both
  // arrays for every agreement or payment on every keystroke.
  const rentalsById = useMemo(() => new Map(rentals.map((r: any) => [r.id, r])), [rentals]);
  const customersById = useMemo(() => new Map(customers.map((c: any) => [c.id, c])), [customers]);
  const customersByName = useMemo(() => {
    const map = new Map<string, any>();
    for (const c of customers) {
      if (c && c.name != null) map.set(String(c.name).toLowerCase().trim(), c);
    }
    return map;
  }, [customers]);

  const resolveReceiptCustomerContacts = useCallback((p: Payment) => {
    const matchRental = rentalsById.get(p.agreement);
    const pCustName = p.customer != null ? String(p.customer).toLowerCase().trim() : "";
    const mCustName = matchRental?.customer != null ? String(matchRental.customer).toLowerCase().trim() : "";
    const cust =
      (p.customerId ? customersById.get(p.customerId) : undefined) ||
      (matchRental?.customerId ? customersById.get(matchRental.customerId) : undefined) ||
      (pCustName ? customersByName.get(pCustName) : undefined) ||
      (mCustName ? customersByName.get(mCustName) : undefined);

    const phone = (p as any).phone != null ? String((p as any).phone).trim() : (matchRental?.phone != null ? String(matchRental.phone).trim() : (cust?.phone != null ? String(cust.phone).trim() : ""));
    const altPhone = (p as any).altPhone != null ? String((p as any).altPhone).trim() : (matchRental?.altPhone != null ? String(matchRental.altPhone).trim() : (cust?.altPhone != null ? String(cust.altPhone).trim() : ""));
    const contactNumber3 = (p as any).contactNumber3 != null ? String((p as any).contactNumber3).trim() : (matchRental?.contactNumber3 != null ? String(matchRental.contactNumber3).trim() : (cust?.contactNumber3 != null ? String(cust.contactNumber3).trim() : ""));

    return { phone, altPhone, contactNumber3 };
  }, [rentalsById, customersById, customersByName]);

  // Group payments by Agreement ID
  const agreementMap = new Map<string, {
    agreementId: string;
    customerName: string;
    customerId: string;
    phone: string;
    altPhone: string;
    contactNumber3: string;
    equipment: string;
    rentStatus: string;
    monthlyRent: number;
    deposit: number;
    startDate: string;
    payments: Payment[];
  }>();

  // 1. Initialize with all rentals
  rentalsList.forEach((r) => {
    const rCustName = r.customer != null ? String(r.customer).toLowerCase().trim() : "";
    const cust = customersById.get(r.customerId) || (rCustName ? customersByName.get(rCustName) : undefined);
    const phone = r.phone != null ? String(r.phone).trim() : (cust?.phone != null ? String(cust.phone).trim() : "");
    const altPhone = r.altPhone != null ? String(r.altPhone).trim() : (cust?.altPhone != null ? String(cust.altPhone).trim() : "");
    const contactNumber3 = r.contactNumber3 != null ? String(r.contactNumber3).trim() : (cust?.contactNumber3 != null ? String(cust.contactNumber3).trim() : "");
    agreementMap.set(r.id, {
      agreementId: r.id,
      customerName: r.customer,
      customerId: r.customerId,
      phone,
      altPhone,
      contactNumber3,
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
    if (!p) return;
    const status = String(p.status || "").trim().toLowerCase();
    if (status === "not paid" || status === "cancelled" || status === "failed") return;
    const agrId = p.agreement || "No Agreement";
    let group = agreementMap.get(agrId);
    if (!group) {
      const matchRental = rentalsById.get(agrId);
      const pCustName = p.customer != null ? String(p.customer).toLowerCase().trim() : "";
      const cust =
        (p.customerId ? customersById.get(p.customerId) : undefined) ||
        (matchRental?.customerId ? customersById.get(matchRental.customerId) : undefined) ||
        (pCustName ? customersByName.get(pCustName) : undefined);
      const phone = (p as any).phone != null ? String((p as any).phone).trim() : (matchRental?.phone != null ? String(matchRental.phone).trim() : (cust?.phone != null ? String(cust.phone).trim() : ""));
      const altPhone = (p as any).altPhone != null ? String((p as any).altPhone).trim() : (matchRental?.altPhone != null ? String(matchRental.altPhone).trim() : (cust?.altPhone != null ? String(cust.altPhone).trim() : ""));
      const contactNumber3 = (p as any).contactNumber3 != null ? String((p as any).contactNumber3).trim() : (matchRental?.contactNumber3 != null ? String(matchRental.contactNumber3).trim() : (cust?.contactNumber3 != null ? String(cust.contactNumber3).trim() : ""));
      group = {
        agreementId: agrId,
        customerName: p.customer || "Unknown Customer",
        customerId: p.customerId || "",
        phone,
        altPhone,
        contactNumber3,
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

  // 3. Ensure initial payments (deposit, advance rent, additional charges) are represented in each agreement group
  rentalsList.forEach((r) => {
    const group = agreementMap.get(r.id);
    if (group) {
      const initPayments = getAgreementInitialPayments(r, group.payments);
      if (initPayments.length > 0) {
        group.payments.push(...initPayments);
      }
    }
  });

  // Calculate totals and latest date for each agreement group
  const agreementList = Array.from(agreementMap.values()).map((g) => {
    const paidPayments = g.payments.filter((p) => {
      const s = String(p.status || "").trim().toLowerCase();
      return s !== "not paid" && s !== "cancelled" && s !== "failed";
    });
    const totalCollected = paidPayments
      .filter((p) => String(p.status || "").toLowerCase() === "paid")
      .reduce((sum, p) => sum + p.amount, 0);
    const sortedPayments = sortLatestFirst(paidPayments, "date");
    const latestPayment = sortedPayments[0];

    return {
      ...g,
      payments: sortedPayments,
      totalCollected,
      paidCount: paidPayments.length,
      totalCount: sortedPayments.length,
      latestDate: latestPayment?.date || g.startDate || "",
      latestMode: latestPayment?.mode || "—",
    };
  });

  // Filter agreements by search & date range
  const filteredAgreements = (isStaff && !search.trim()) ? [] : agreementList.filter((g) => {
    const q = search.toLowerCase().trim();
    const rental = rentalsById.get(g.agreementId);
    const gCustName = g.customerName != null ? String(g.customerName).toLowerCase().trim() : "";
    const customer = customersById.get(g.customerId) || (rental ? customersById.get(rental.customerId) : undefined) || (gCustName ? customersByName.get(gCustName) : undefined);
    const formattedStartDate = g.startDate ? formatDateDDMMYYYY(g.startDate) : "";

    const matchesSearch = !q ||
      String(g.agreementId || "").toLowerCase().includes(q) ||
      String(g.customerName || "").toLowerCase().includes(q) ||
      String(g.equipment || "").toLowerCase().includes(q) ||
      String(g.latestMode || "").toLowerCase().includes(q) ||
      (g.startDate && String(g.startDate).toLowerCase().includes(q)) ||
      (formattedStartDate && formattedStartDate.toLowerCase().includes(q)) ||
      (rental && (
        String(rental.serial || "").toLowerCase().includes(q) ||
        String(rental.model || "").toLowerCase().includes(q) ||
        (Array.isArray(rental.equipmentItems) && rental.equipmentItems.some((it: any) => String(it.model || "").toLowerCase().includes(q) || String(it.name || "").toLowerCase().includes(q)))
      )) ||
      (customer && (
        String(customer.phone || "").toLowerCase().includes(q) ||
        String(customer.altPhone || "").toLowerCase().includes(q) ||
        String(customer.contactNumber3 || "").toLowerCase().includes(q)
      )) ||
      String(g.phone || "").toLowerCase().includes(q) ||
      String(g.altPhone || "").toLowerCase().includes(q) ||
      String(g.contactNumber3 || "").toLowerCase().includes(q);

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

  const filteredPayments = useMemo(() => {
    if (isStaff && (!search.trim() || !debouncedSearch.trim())) {
      return [];
    }
    return sortLatestFirst(payments.filter((p) => {
      if (!p) return false;
      const status = String(p.status || "").trim().toLowerCase();
      if (status === "not paid" || status === "cancelled" || status === "failed") return false;
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
    }), "date");
  }, [payments, search, debouncedSearch, isStaff, dateFilter, startDate, endDate, rentalsById, customersById]);

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
    .filter(p => p.status === "Paid" && p.mode !== "Cash" && p.mode !== "Equipment Refund")
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
        canExport ? (
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
        ) : undefined
      }
    >
      {/* Stat cards - hidden for Staff and Accountant */}
      {showKpiCards && (
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
      )}

      <div className="w-full">
        {/* Recent Payments table */}
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border/60 bg-muted/20 px-3 sm:px-5 py-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex items-center justify-between sm:justify-start gap-3">
                <CardTitle>Payments</CardTitle>
                {/* View Mode Toggle */}
                <div className="flex shrink-0 bg-muted/60 p-0.5 rounded-lg border border-border/50 text-[11px]">
                  <button
                    type="button"
                    className={`px-2.5 py-1.5 sm:py-1 rounded-md font-semibold whitespace-nowrap transition-colors ${viewMode === "by-agreement" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                    onClick={() => setViewMode("by-agreement")}
                  >
                    By Agreement
                  </button>
                  <button
                    type="button"
                    className={`px-2.5 py-1.5 sm:py-1 rounded-md font-semibold whitespace-nowrap transition-colors ${viewMode === "all-receipts" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                    onClick={() => setViewMode("all-receipts")}
                  >
                    All Receipts
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="h-9 sm:h-8 w-[136px] shrink-0 text-[12px] bg-card border-border/50 rounded-lg">
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
                  // Own full-width row below the search on phones so the two
                  // date pickers never spill past the card edge.
                  <div className="order-last flex w-full items-center gap-1.5 animate-[fade-in_0.2s_ease-out] sm:order-none sm:w-auto sm:shrink-0">
                    <Input
                      type="date"
                      className="h-9 sm:h-8 px-2 sm:px-3 text-[11px] min-w-0 flex-1 sm:flex-none sm:w-[130px] bg-card border-border/50 cursor-pointer"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                    <span className="text-[10px] text-muted-foreground shrink-0">to</span>
                    <Input
                      type="date"
                      className="h-9 sm:h-8 px-2 sm:px-3 text-[11px] min-w-0 flex-1 sm:flex-none sm:w-[130px] bg-card border-border/50 cursor-pointer"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                )}
                <div className="relative min-w-[120px] flex-1 sm:flex-none sm:w-56">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50" />
                  <Input
                    placeholder={isStaff ? "Search by customer name..." : "Search…"}
                    className="pl-9 h-9 sm:h-8 text-[12px] bg-card border-border/50"
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
              <div className="hidden xl:block [&_th]:px-3 [&_td]:px-3">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agreement ID & Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Equipment</TableHead>
                      <TableHead className="text-right">Total Collected</TableHead>
                      <TableHead className="text-center">Receipts</TableHead>
                      <TableHead>Latest Payment</TableHead>
                      <TableHead>Status</TableHead>
                      {canViewPaymentHistory && <TableHead className="w-24 text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAgreements.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={canViewPaymentHistory ? 8 : 7} className="py-12 text-center text-[13px] text-muted-foreground">
                          {isStaff && !search.trim() ? (
                            <div className="flex flex-col items-center justify-center gap-2 py-4">
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-1">
                                <Search className="h-5 w-5" />
                              </div>
                              <p className="text-[13.5px] font-semibold text-foreground">Search by customer name to view payments</p>
                              <p className="text-[12px] text-muted-foreground max-w-sm">Enter a customer's name in the search bar above to view their agreement and payment details.</p>
                            </div>
                          ) : (
                            "No agreements match your search."
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                    {filteredAgreements.map((g) => (
                      <TableRow
                        key={g.agreementId}
                        className={`group transition-colors ${canViewPaymentHistory ? "cursor-pointer hover:bg-muted/30" : ""}`}
                        onClick={() => {
                          if (canViewPaymentHistory) setSelectedHistoryAgreementId(g.agreementId);
                        }}
                      >
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-mono text-[12px] font-bold text-primary group-hover:underline">
                              {g.agreementId}
                            </span>
                            {g.startDate ? (
                              <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1 whitespace-nowrap">
                                <Calendar className="h-3 w-3 text-muted-foreground/70 shrink-0" />
                                {formatDateDDMMYYYY(g.startDate)}
                              </span>
                            ) : (
                              <span className="text-[11px] text-muted-foreground/50">—</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-semibold text-[13px] text-foreground">{g.customerName}</p>
                          <CustomerPhoneDisplay
                            phone={g.phone}
                            altPhone={g.altPhone}
                            contactNumber3={g.contactNumber3}
                          />
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const eqInfos = getAgreementEquipmentModelInfo(g, rentalsList, equipmentList);
                            return (
                              <div className="space-y-1 max-w-[210px]">
                                {eqInfos.map((info, idx) => (
                                  <div key={idx} className="leading-tight">
                                    <p className="text-[12.5px] font-semibold text-foreground/90 truncate" title={info.name}>
                                      {info.name}
                                    </p>
                                    {info.model ? (
                                      <p className="text-[11px] text-muted-foreground font-medium truncate flex items-center gap-1 mt-0.5" title={`Model: ${info.model}`}>
                                        <span className="text-[9.5px] uppercase font-bold text-muted-foreground/70">Model:</span>
                                        <span className="text-foreground/85 font-semibold">{info.model}</span>
                                      </p>
                                    ) : null}
                                  </div>
                                ))}
                              </div>
                            );
                          })()}
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
                        {canViewPaymentHistory && (
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
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile / tablet Agreement List */}
              <div className="xl:hidden divide-y divide-border/60">
                {filteredAgreements.length === 0 ? (
                  <div className="py-12 px-4 text-center text-[13px] text-muted-foreground">
                    {isStaff && !search.trim() ? (
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-1">
                          <Search className="h-5 w-5" />
                        </div>
                        <p className="text-[13.5px] font-semibold text-foreground">Search by customer name to view payments</p>
                        <p className="text-[12px] text-muted-foreground max-w-xs">Enter a customer's name in the search bar above to view payment details.</p>
                      </div>
                    ) : (
                      "No agreements match your search."
                    )}
                  </div>
                ) : (
                  filteredAgreements.map((g) => (
                    <div
                      key={g.agreementId}
                      className={`px-4 py-3.5 ${canViewPaymentHistory ? "cursor-pointer hover:bg-muted/20" : ""}`}
                      onClick={() => {
                        if (canViewPaymentHistory) setSelectedHistoryAgreementId(g.agreementId);
                      }}
                    >
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <div className="min-w-0">
                          <div className="flex items-center gap-x-2 gap-y-0.5 flex-wrap">
                            <span className="font-mono text-[11.5px] font-bold text-primary wrap-anywhere">{g.agreementId}</span>
                            {g.startDate && (
                              <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-0.5">
                                <Calendar className="h-3 w-3 text-muted-foreground/70 shrink-0" />
                                {formatDateDDMMYYYY(g.startDate)}
                              </span>
                            )}
                          </div>
                          <p className="font-semibold text-[13.5px] mt-0.5 wrap-break-word">{g.customerName}</p>
                          <CustomerPhoneDisplay
                            phone={g.phone}
                            altPhone={g.altPhone}
                            contactNumber3={g.contactNumber3}
                          />
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="font-display text-[15px] font-bold text-success whitespace-nowrap">₹{g.totalCollected.toLocaleString("en-IN")}</span>
                          <StatusBadge status={g.rentStatus as any} />
                        </div>
                      </div>
                      {(() => {
                        const eqInfos = getAgreementEquipmentModelInfo(g, rentalsList, equipmentList);
                        return (
                          <div className="mt-1.5 space-y-1">
                            {eqInfos.map((info, idx) => (
                              <div key={idx} className="flex items-start gap-1.5 text-[12px] leading-snug text-foreground/90">
                                <Package className="h-3.5 w-3.5 mt-px text-primary shrink-0" />
                                <span className="min-w-0 wrap-break-word">
                                  <span className="font-semibold">{info.name}</span>
                                  {info.model && (
                                    <span className="text-[11px] text-muted-foreground font-medium"> · {info.model}</span>
                                  )}
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                      <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-border/40 text-[11px]">
                        <span className="text-muted-foreground">{g.totalCount} Payment{g.totalCount === 1 ? "" : "s"}</span>
                        {canViewPaymentHistory && (
                          <Button size="sm" variant="ghost" className="h-8 -mr-1.5 px-1.5 text-[11.5px] font-semibold text-primary hover:bg-primary/10">
                            View Payment History <ChevronRight className="ml-0.5 h-3.5 w-3.5" />
                          </Button>
                        )}
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
              <div className="hidden xl:block [&_th]:px-3 [&_td]:px-3">
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
                        <TableCell colSpan={8} className="py-12 text-center text-[13px] text-muted-foreground">
                          {isStaff && !search.trim() ? (
                            <div className="flex flex-col items-center justify-center gap-2 py-4">
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-1">
                                <Search className="h-5 w-5" />
                              </div>
                              <p className="text-[13.5px] font-semibold text-foreground">Search by customer name to view payments</p>
                              <p className="text-[12px] text-muted-foreground max-w-sm">Enter a customer's name in the search bar above to view their payment receipts.</p>
                            </div>
                          ) : (
                            "No payments match your search."
                          )}
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
                          {(() => {
                            const contacts = resolveReceiptCustomerContacts(p);
                            return (
                              <CustomerPhoneDisplay
                                phone={contacts.phone}
                                altPhone={contacts.altPhone}
                                contactNumber3={contacts.contactNumber3}
                              />
                            );
                          })()}
                          {(() => {
                            const eqInfos = getPaymentEquipmentDisplay(p, rentals, equipmentList);
                            return (
                              <div className="space-y-0.5 mt-0.5">
                                {eqInfos.map((info, idx) => (
                                  <p key={idx} className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                                    <Package className="h-3 w-3 shrink-0 text-muted-foreground/70" />
                                    <span className="truncate text-foreground/85 font-medium">{info.name}</span>
                                    {info.model && <span className="text-muted-foreground/90 font-semibold">· {info.model}</span>}
                                  </p>
                                ))}
                              </div>
                            );
                          })()}
                          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                            {canViewPaymentHistory ? (
                              <button
                                type="button"
                                className="font-mono text-[10px] text-primary hover:underline font-bold text-left cursor-pointer"
                                onClick={() => setSelectedHistoryAgreementId(p.agreement)}
                              >
                                {p.agreement}
                              </button>
                            ) : (
                              <span className="font-mono text-[10px] text-muted-foreground font-semibold">
                                {p.agreement}
                              </span>
                            )}
                            {(() => {
                              const matchRental = rentals.find((r: any) => r.id === p.agreement);
                              const agrDate = matchRental?.start || (matchRental as any)?.startDate;
                              if (!agrDate) return null;
                              return (
                                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                  • <Calendar className="h-2.5 w-2.5 text-muted-foreground/60" /> {formatDateDDMMYYYY(agrDate)}
                                </span>
                              );
                            })()}
                          </div>
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
                            {isAdmin && (
                              <DeletePaymentDialog payment={p} onDelete={refresh} trigger={
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              } />
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile / tablet card list */}
              <div className="xl:hidden">
                {filteredPayments.length === 0 ? (
                  <div className="py-12 px-4 text-center text-[13px] text-muted-foreground">
                    {isStaff && !search.trim() ? (
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-1">
                          <Search className="h-5 w-5" />
                        </div>
                        <p className="text-[13.5px] font-semibold text-foreground">Search by customer name to view payments</p>
                        <p className="text-[12px] text-muted-foreground max-w-xs">Enter a customer's name in the search bar above to view payment receipts.</p>
                      </div>
                    ) : (
                      "No payments match your search."
                    )}
                  </div>
                ) : (
                  <div className="divide-y divide-border/60">
                    {filteredPayments.map((p) => {
                      const matchRental = rentals.find((r: any) => r.id === p.agreement);
                      const eqInfos = getPaymentEquipmentDisplay(p, rentals, equipmentList);
                      return (
                        <div key={p.id} className="px-4 py-3.5">
                          <div className="flex items-start justify-between gap-3 mb-1.5">
                            <div className="min-w-0">
                              <p className="font-mono text-[11px] font-bold text-primary wrap-anywhere">{p.id}</p>
                              <p className="font-semibold text-[13.5px] mt-0.5 wrap-break-word">{p.customer}</p>
                              {(() => {
                                const contacts = resolveReceiptCustomerContacts(p);
                                return (
                                  <CustomerPhoneDisplay
                                    phone={contacts.phone}
                                    altPhone={contacts.altPhone}
                                    contactNumber3={contacts.contactNumber3}
                                  />
                                );
                              })()}
                              <div className="space-y-1 mt-1.5">
                                {eqInfos.map((info, idx) => (
                                  <div key={idx} className="flex items-start gap-1.5 text-[12px] leading-snug text-foreground/90">
                                    <Package className="h-3.5 w-3.5 mt-px text-primary shrink-0" />
                                    <span className="min-w-0 wrap-break-word">
                                      <span className="font-semibold">{info.name}</span>
                                      {info.model && <span className="text-[11px] text-muted-foreground font-medium"> · {info.model}</span>}
                                    </span>
                                  </div>
                                ))}
                              </div>
                              <div className="flex items-center gap-1.5 flex-wrap mt-1">
                                {canViewPaymentHistory ? (
                                  <button
                                    type="button"
                                    className="font-mono text-[10.5px] text-primary hover:underline font-bold py-0.5"
                                    onClick={() => setSelectedHistoryAgreementId(p.agreement)}
                                  >
                                    {p.agreement}
                                  </button>
                                ) : (
                                  <span className="font-mono text-[10px] text-muted-foreground font-semibold">
                                    {p.agreement}
                                  </span>
                                )}
                                {(() => {
                                  const agrDate = matchRental?.start || (matchRental as any)?.startDate;
                                  if (!agrDate) return null;
                                  return (
                                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                      · <Calendar className="h-2.5 w-2.5 text-muted-foreground/60" /> {formatDateDDMMYYYY(agrDate)}
                                    </span>
                                  );
                                })()}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1 shrink-0">
                              <span className="font-display text-[15px] font-bold whitespace-nowrap">₹{p.amount.toLocaleString("en-IN")}</span>
                              <StatusBadge status={p.status} />
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                              <span className="whitespace-nowrap">{formatDateDDMMYYYY(p.date)}</span>
                              <span>·</span>
                              <span className={`inline-flex items-center rounded px-1.5 py-0.5 font-semibold ${modeColors[p.mode] ?? "bg-muted text-muted-foreground"}`}>{p.mode}</span>
                              <span>·</span>
                              <span>{p.type}</span>
                            </div>
                            <div className="flex shrink-0 items-center -mr-1.5">
                              <PrintReceiptDialog payment={p} triggerClassName="h-9 w-9" />
                              {isAdmin && (
                                <DeletePaymentDialog payment={p} onDelete={refresh} trigger={
                                  <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive">
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                } />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </Card>
      </div>

      {/* AGREEMENT PAYMENT HISTORY DIALOG */}
      {canViewPaymentHistory && (
        <AgreementPaymentHistoryModal
          agreementId={selectedHistoryAgreementId}
          open={!!selectedHistoryAgreementId}
          onOpenChange={(open) => {
            if (!open) setSelectedHistoryAgreementId(null);
          }}
          onRefresh={refresh}
        />
      )}
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
