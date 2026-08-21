import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect, useRef } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { AppShell, StatusBadge } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

import {
  MessageCircle, Mail, Phone, Bell,
  IndianRupee, TrendingDown, Calendar, CreditCard, CheckCircle2, Search, FileSpreadsheet, Download,
} from "lucide-react";
import { getRentals, getCustomers, getPayments, savePayment, saveRental, formatDateDDMMYYYY, useDatabaseTrigger, getPaidForEquipment, getEquipment, getNextPaymentNumber, getLocalYYYYMMDD, parseLocalDate, getReturns, extractIdNumber, sortLatestFirst, downloadExcel, formatEquipmentLabel } from "@/lib/data-store";

export const Route = createFileRoute("/dues")({
  head: () => ({ meta: [{ title: "Rent Dues — Relife" }] }),
  component: DuesPage,
});

// ─── Pay Dialog ──────────────────────────────────────────────────────────────
// ─── Pay Dialog ──────────────────────────────────────────────────────────────
function PayDialog({
  rental,
  paymentsList,
  eqInventory,
  calcUnpaidDetailsForEquipment,
  getEquipmentName,
  onPaid,
}: {
  rental: any;
  paymentsList: any[];
  eqInventory: any[];
  calcUnpaidDetailsForEquipment: (rental: any, eqId: string) => any;
  getEquipmentName: (eqId: string) => string;
  onPaid: () => void;
}) {
  const eqItems = useMemo(() => rental?.equipmentItems || [
    {
      equipmentId: rental?.equipmentId,
      serial: rental?.serial,
      monthlyRent: Number(rental?.monthlyRent) || 0,
      returned: false
    }
  ], [rental?.equipmentItems, rental?.equipmentId, rental?.serial, rental?.monthlyRent]);

  const activeEqItems = useMemo(() => eqItems.filter((it: any) => !it.returned), [eqItems]);

  const [open, setOpen] = useState(false);
  const [selectedEqIds, setSelectedEqIds] = useState<string[]>([]);
  const prevOpenRef = useRef(false);

  // Initialize selected items ONLY when the dialog is opened (open transitions from false to true)
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      const activeIds = activeEqItems.map((it: any) => it.equipmentId);
      setSelectedEqIds(activeIds.length > 0 ? activeIds : [eqItems[0]?.equipmentId].filter(Boolean));
    }
    prevOpenRef.current = open;
  }, [open, activeEqItems, eqItems]);

  const selectedItemsDetails = useMemo(() => {
    let totalOutstanding = 0;
    let totalPaid = 0;
    let totalDue = 0;
    const unpaidParts: string[] = [];
    const rateParts: string[] = [];

    selectedEqIds.forEach((eqId) => {
      const details = calcUnpaidDetailsForEquipment(rental, eqId);
      totalOutstanding += details.outstanding;
      totalPaid += details.grandTotalPaid;
      totalDue += details.totalDue;
      
      const eqName = getEquipmentName(eqId);
      if (details.unpaidText && details.unpaidText !== "0d" && details.unpaidText !== "0m" && details.unpaidText !== "—") {
        unpaidParts.push(`${eqName}: ${details.unpaidText}`);
      }
      rateParts.push(`${eqName} (${details.rateText})`);
    });

    return {
      outstanding: totalOutstanding,
      grandTotalPaid: totalPaid,
      totalDue,
      unpaidText: unpaidParts.join(", ") || "—",
      rateText: rateParts.join(" | ") || "₹0",
    };
  }, [rental, selectedEqIds, calcUnpaidDetailsForEquipment]);

  const [manualPayAmount, setManualPayAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(() => getLocalYYYYMMDD());
  const [paymentMode, setPaymentMode] = useState("Bank");
  const [txRef, setTxRef] = useState("");
  const [cashAmount, setCashAmount] = useState("");
  const [bankAmount, setBankAmount] = useState("");

  const [applyDiscount, setApplyDiscount] = useState(false);
  const [discountType, setDiscountType] = useState<"one-time" | "permanent">("one-time");
  const [discountVal, setDiscountVal] = useState("");

    const payAmount = Number(manualPayAmount) || 0;
  const isMultiItem = selectedEqIds.length > 1;

  const customerInfo = useMemo(() => {
    const custs = getCustomers();
    const c = custs.find((c: any) => c.id === rental.customerId || (c.name && rental.customer && c.name.toLowerCase() === rental.customer.toLowerCase()));
    const p1 = rental.phone || c?.phone || "";
    const p2 = rental.altPhone || c?.altPhone || "";
    const p3 = rental.contactNumber3 || c?.contactNumber3 || "";
    const phones = [p1, p2, p3].filter(Boolean).join(", ");
    return {
      id: rental.customerId || c?.id || "",
      phone: phones || "No phone registered",
    };
  }, [rental]);

  const selectedItemRate = useMemo(() => {
    if (selectedEqIds.length === 1) {
      const details = calcUnpaidDetailsForEquipment(rental, selectedEqIds[0]);
      return details.rate || details.outstanding;
    }
    return 0;
  }, [rental, selectedEqIds, calcUnpaidDetailsForEquipment]);

  const handleDiscountChange = (val: string, apply = applyDiscount) => {
    setDiscountVal(val);
    if (apply && selectedEqIds.length === 1) {
      const disc = Number(val) || 0;
      const newPayAmount = Math.max(0, selectedItemRate - disc);
      setManualPayAmount(newPayAmount.toString());
      if (paymentMode === "Cash+Bank") {
        const cAmt = Math.round(newPayAmount / 2);
        setCashAmount(cAmt.toString());
        setBankAmount((newPayAmount - cAmt).toString());
      }
    }
  };

  const handleApplyDiscountToggle = (checked: boolean) => {
    setApplyDiscount(checked);
    if (checked) {
      handleDiscountChange(discountVal, true);
    } else {
      setManualPayAmount(selectedItemRate.toString());
      if (paymentMode === "Cash+Bank") {
        const cAmt = Math.round(selectedItemRate / 2);
        setCashAmount(cAmt.toString());
        setBankAmount((selectedItemRate - cAmt).toString());
      }
    }
  };

  useEffect(() => {
    if (open) {
      let defaultTotal = 0;
      selectedEqIds.forEach((eqId) => {
        const details = calcUnpaidDetailsForEquipment(rental, eqId);
        defaultTotal += details.rate || details.outstanding;
      });
      setManualPayAmount(defaultTotal.toString());
      setPaymentDate(getLocalYYYYMMDD());
      const cAmt = Math.round(defaultTotal / 2);
      setCashAmount(cAmt.toString());
      setBankAmount((defaultTotal - cAmt).toString());

      setApplyDiscount(false);
      setDiscountType("one-time");
      setDiscountVal("");
    }
  }, [open, selectedEqIds]);

  const handleAmountChange = (val: string) => {
    setManualPayAmount(val);
    const num = Number(val) || 0;
    if (paymentMode === "Cash+Bank") {
      const cAmt = Math.round(num / 2);
      setCashAmount(cAmt.toString());
      setBankAmount((num - cAmt).toString());
    }
  };

  // ─── Per-item amount + payment method (used when 2+ equipment items are selected) ───
  interface ItemPaymentState {
    amount: string;
    mode: "Cash" | "Bank" | "Cash+Bank";
    cashAmount: string;
    bankAmount: string;
    txRef: string;
  }
  const [itemPayments, setItemPayments] = useState<Record<string, ItemPaymentState>>({});

  // Fresh payment session: wipe any leftover entries from a previous open.
  useEffect(() => {
    if (open) setItemPayments({});
  }, [open]);

  // Keep one entry per currently-selected item; default new ones to that
  // item's outstanding balance, and preserve amounts already typed in for
  // items that remain selected.
  useEffect(() => {
    if (!open) return;
    setItemPayments((prev) => {
      const next: Record<string, ItemPaymentState> = {};
      selectedEqIds.forEach((eqId) => {
        if (prev[eqId]) {
          next[eqId] = prev[eqId];
          return;
        }
        const details = calcUnpaidDetailsForEquipment(rental, eqId);
        const defaultAmt = details.rate || details.outstanding;
        const cAmt = Math.round(defaultAmt / 2);
        next[eqId] = {
          amount: defaultAmt.toString(),
          mode: "Bank",
          cashAmount: cAmt.toString(),
          bankAmount: (defaultAmt - cAmt).toString(),
          txRef: "",
        };
      });
      return next;
    });
  }, [open, selectedEqIds]);

  const updateItemPayment = (eqId: string, patch: Partial<ItemPaymentState>) => {
    setItemPayments((prev) => ({ ...prev, [eqId]: { ...prev[eqId], ...patch } }));
  };

  const handleItemAmountChange = (eqId: string, val: string) => {
    const current = itemPayments[eqId];
    if (current?.mode === "Cash+Bank") {
      const num = Number(val) || 0;
      const cAmt = Math.round(num / 2);
      updateItemPayment(eqId, { amount: val, cashAmount: cAmt.toString(), bankAmount: (num - cAmt).toString() });
    } else {
      updateItemPayment(eqId, { amount: val });
    }
  };

  const handleItemModeChange = (eqId: string, mode: string) => {
    const current = itemPayments[eqId];
    const amt = Number(current?.amount) || 0;
    if (mode === "Cash+Bank") {
      const cAmt = Math.round(amt / 2);
      updateItemPayment(eqId, { mode: mode as ItemPaymentState["mode"], cashAmount: cAmt.toString(), bankAmount: (amt - cAmt).toString() });
    } else {
      updateItemPayment(eqId, { mode: mode as ItemPaymentState["mode"] });
    }
  };

  const handleItemCashChange = (eqId: string, val: string) => {
    const amt = Number(itemPayments[eqId]?.amount) || 0;
    const cNum = Math.max(0, Number(val) || 0);
    updateItemPayment(eqId, { cashAmount: val, bankAmount: Math.max(0, amt - cNum).toString() });
  };

  const handleItemBankChange = (eqId: string, val: string) => {
    const amt = Number(itemPayments[eqId]?.amount) || 0;
    const bNum = Math.max(0, Number(val) || 0);
    updateItemPayment(eqId, { bankAmount: val, cashAmount: Math.max(0, amt - bNum).toString() });
  };

  const multiItemTotal = selectedEqIds.reduce((sum, id) => sum + (Number(itemPayments[id]?.amount) || 0), 0);

  // H-4: guards money handling in this dialog.
  //
  //  - `isPaying` stops a double-click recording the payment twice. Each pass
  //    called getNextPaymentNumber(), so both writes got distinct IDs and
  //    nothing de-duplicated them — the customer's ledger simply showed the
  //    payment twice.
  //  - Cash+Bank splits were never checked against the amount being collected,
  //    so ₹5,000 cash + ₹5,000 bank against a ₹5,000 line recorded ₹10,000, and
  //    in the single-payment path the success toast reported `payAmount` while
  //    the rows written totalled cash + bank.
  //  - Negative entries passed the `> 0` total check but were then silently
  //    dropped by the per-item loop, so the toast could name an amount that was
  //    never saved.
  const [isPaying, setIsPaying] = useState(false);

  const validatePayment = (): string | null => {
    if (isMultiItem) {
      for (const eqId of selectedEqIds) {
        const item = itemPayments[eqId];
        if (!item) continue;
        const amt = Number(item.amount) || 0;
        if (amt < 0) return `Payment amount for ${getEquipmentName(eqId)} cannot be negative.`;
        if (item.mode === "Cash+Bank" && amt > 0) {
          const split = (Number(item.cashAmount) || 0) + (Number(item.bankAmount) || 0);
          if (split !== amt) {
            return `${getEquipmentName(eqId)}: Cash + Bank must add up to ₹${amt.toLocaleString("en-IN")} — currently ₹${split.toLocaleString("en-IN")}.`;
          }
        }
      }
      return null;
    }

    if (payAmount < 0) return "Payment amount cannot be negative.";
    if (paymentMode === "Cash+Bank" && payAmount > 0) {
      const split = (Number(cashAmount) || 0) + (Number(bankAmount) || 0);
      if (split !== payAmount) {
        return `Cash + Bank must add up to ₹${payAmount.toLocaleString("en-IN")} — currently ₹${split.toLocaleString("en-IN")}.`;
      }
    }
    return null;
  };

  const handlePay = () => {
    if (isPaying) return;
    setIsPaying(true);
    try {
      runPay();
    } catch (err) {
      toast.error("Could not record this payment — nothing was saved.", {
        description: err instanceof Error ? err.message : String(err),
        duration: 12000,
      });
    } finally {
      setIsPaying(false);
    }
  };

  const runPay = () => {
    if (!paymentDate) {
      toast.error("Please select a payment date.");
      return;
    }
    if (selectedEqIds.length === 0) {
      toast.error("Please select at least one equipment item.");
      return;
    }

    const validationError = validatePayment();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    if (isMultiItem) {
      if (multiItemTotal <= 0) {
        toast.error("Please enter a valid payment amount for at least one item.");
        return;
      }

      selectedEqIds.forEach((eqId) => {
        const item = itemPayments[eqId];
        if (!item) return;
        const amt = Number(item.amount) || 0;
        if (amt <= 0) return;
        const eqName = getEquipmentName(eqId);

        if (item.mode === "Cash+Bank") {
          const cAmt = Number(item.cashAmount) || 0;
          const bAmt = Number(item.bankAmount) || 0;
          if (cAmt > 0) {
            savePayment({
              id: getNextPaymentNumber(),
              date: paymentDate,
              customer: rental.customer,
              customerId: rental.customerId,
              agreement: rental.id,
              equipmentId: eqId,
              amount: cAmt,
              mode: "Cash",
              type: "Rent" as const,
              notes: `${eqName}: Rent Payment (Cash portion of ₹${amt.toLocaleString("en-IN")})`,
              status: "Paid" as const,
            });
          }
          if (bAmt > 0) {
            savePayment({
              id: getNextPaymentNumber(),
              date: paymentDate,
              customer: rental.customer,
              customerId: rental.customerId,
              agreement: rental.id,
              equipmentId: eqId,
              amount: bAmt,
              mode: "Bank",
              type: "Rent" as const,
              txRef: item.txRef,
              notes: `${eqName}: Rent Payment (Bank portion of ₹${amt.toLocaleString("en-IN")})`,
              status: "Paid" as const,
            });
          }
        } else {
          savePayment({
            id: getNextPaymentNumber(),
            date: paymentDate,
            customer: rental.customer,
            customerId: rental.customerId,
            agreement: rental.id,
            equipmentId: eqId,
            amount: amt,
            mode: item.mode as any,
            type: "Rent" as const,
            txRef: item.txRef,
            notes: `${eqName}: Rent Payment`,
            status: "Paid" as const,
          });
        }
      });

      toast.success(
        `₹${multiItemTotal.toLocaleString("en-IN")} payment recorded for ${selectedEqIds.map((id) => getEquipmentName(id)).join(", ")} (${rental.id})`
      );
      setOpen(false);
      onPaid();
      return;
    }

    if (payAmount <= 0) {
      toast.error("Please enter a valid payment amount.");
      return;
    }

    const isSingleEqSelected = selectedEqIds.length === 1;
    const finalDiscount = (applyDiscount && isSingleEqSelected) ? (Number(discountVal) || 0) : 0;

    // Apply permanent/continuous discount: update rent rate in the database
    if (finalDiscount > 0 && discountType === "permanent" && isSingleEqSelected) {
      const eqId = selectedEqIds[0];
      const rentalsList = getRentals();
      const rIdx = rentalsList.findIndex((r) => r.id === rental.id);
      if (rIdx > -1) {
        const uRental = { ...rentalsList[rIdx] };
        uRental.equipmentItems = (uRental.equipmentItems || []).map((item: any) => {
          if (item.equipmentId === eqId) {
            const isMonthlyItem = item.rentCycle === "Monthly";
            if (isMonthlyItem) {
              item.monthlyRent = Math.max(0, (Number(item.monthlyRent) || 0) - finalDiscount);
            } else {
              item.dailyRent = Math.max(0, (Number(item.dailyRent) || 0) - finalDiscount);
            }
          }
          return item;
        });

        if (uRental.equipmentId === eqId) {
          const isMonthlyRental = (uRental as any).rentCycle === "Monthly" || (Number(uRental.monthlyRent) > 0 && Number(uRental.dailyRent) === 0);
          if (isMonthlyRental) {
            uRental.monthlyRent = Math.max(0, (Number(uRental.monthlyRent) || 0) - finalDiscount);
          } else {
            uRental.dailyRent = Math.max(0, (Number(uRental.dailyRent) || 0) - finalDiscount);
          }
        }

        uRental.monthlyRent = uRental.equipmentItems.reduce((sum: number, it: any) => sum + (Number(it.monthlyRent) || 0), 0);
        uRental.dailyRent = uRental.equipmentItems.reduce((sum: number, it: any) => sum + (Number(it.dailyRent) || 0), 0);

        saveRental(uRental);
      }
    }

    const totalSelectedOutstanding = selectedItemsDetails.outstanding;

    // Calculate allocation ratios
    const eqItemsRatios = selectedEqIds.map((eqId) => {
      const details = calcUnpaidDetailsForEquipment(rental, eqId);
      let ratio = 0;
      if (totalSelectedOutstanding > 0) {
        ratio = details.outstanding / totalSelectedOutstanding;
      } else {
        ratio = 1 / selectedEqIds.length;
      }
      return { eqId, ratio };
    });

    let cashRemaining = Number(cashAmount) || 0;
    let bankRemaining = Number(bankAmount) || 0;
    let payRemaining = payAmount;

    let discountRecorded = false;

    selectedEqIds.forEach((eqId, idx) => {
      const itemRatio = eqItemsRatios.find(r => r.eqId === eqId)?.ratio || 0;
      let cAmt = 0;
      let bAmt = 0;
      let totalAmt = 0;

      if (idx === selectedEqIds.length - 1) {
        cAmt = cashRemaining;
        bAmt = bankRemaining;
        totalAmt = payRemaining;
      } else {
        if (paymentMode === "Cash+Bank") {
          cAmt = Math.round((Number(cashAmount) || 0) * itemRatio);
          bAmt = Math.round((Number(bankAmount) || 0) * itemRatio);
          totalAmt = cAmt + bAmt;
        } else {
          totalAmt = Math.round(payAmount * itemRatio);
        }
        cashRemaining -= cAmt;
        bankRemaining -= bAmt;
        payRemaining -= totalAmt;
      }

      const eqName = getEquipmentName(eqId);
      const isOneTimeDisc = applyDiscount && discountType === "one-time";

      if (paymentMode === "Cash+Bank") {
        if (cAmt > 0) {
          const discToSave = (isOneTimeDisc && !discountRecorded) ? finalDiscount : 0;
          if (discToSave > 0) discountRecorded = true;
          savePayment({
            id: getNextPaymentNumber(),
            date: paymentDate,
            customer: rental.customer,
            customerId: rental.customerId,
            agreement: rental.id,
            equipmentId: eqId,
            amount: cAmt,
            mode: "Cash",
            type: "Rent" as const,
            notes: `${eqName}: Rent Payment (Cash portion of ₹${totalAmt.toLocaleString("en-IN")})${discToSave > 0 ? ` [Discount of ₹${discToSave} applied]` : ""}`,
            status: "Paid" as const,
            discount: discToSave,
          });
        }
        if (bAmt > 0) {
          const discToSave = (isOneTimeDisc && !discountRecorded) ? finalDiscount : 0;
          if (discToSave > 0) discountRecorded = true;
          savePayment({
            id: getNextPaymentNumber(),
            date: paymentDate,
            customer: rental.customer,
            customerId: rental.customerId,
            agreement: rental.id,
            equipmentId: eqId,
            amount: bAmt,
            mode: "Bank",
            type: "Rent" as const,
            txRef,
            notes: `${eqName}: Rent Payment (Bank portion of ₹${totalAmt.toLocaleString("en-IN")})${discToSave > 0 ? ` [Discount of ₹${discToSave} applied]` : ""}`,
            status: "Paid" as const,
            discount: discToSave,
          });
        }
      } else {
        if (totalAmt > 0) {
          const discToSave = (isOneTimeDisc && !discountRecorded) ? finalDiscount : 0;
          if (discToSave > 0) discountRecorded = true;
          savePayment({
            id: getNextPaymentNumber(),
            date: paymentDate,
            customer: rental.customer,
            customerId: rental.customerId,
            agreement: rental.id,
            equipmentId: eqId,
            amount: totalAmt,
            mode: paymentMode as any,
            type: "Rent" as const,
            txRef,
            notes: `${eqName}: Rent Payment${discToSave > 0 ? ` [Discount of ₹${discToSave} applied]` : ""}`,
            status: "Paid" as const,
            discount: discToSave,
          });
        }
      }
    });

    toast.success(
      `₹${payAmount.toLocaleString("en-IN")} payment recorded for ${selectedEqIds.map(id => getEquipmentName(id)).join(", ")} (${rental.id})`
    );
    setOpen(false);
    onPaid();
  };

  const hasPayableItems = selectedEqIds.some(eqId => {
    const item = eqItems.find((it: any) => it.equipmentId === eqId);
    const details = calcUnpaidDetailsForEquipment(rental, eqId);
    return !item?.returned || details.outstanding > 0;
  });

  return (
    <>
      <Button
        size="sm"
        className="h-7 px-3 text-[11px] font-bold gap-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
        onClick={() => setOpen(true)}
      >
        <CreditCard className="h-3.5 w-3.5" /> Pay
      </Button>

            <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl p-0 gap-0 border-border/60 shadow-2xl overflow-hidden flex flex-col max-h-[95vh] md:max-h-[90vh]">
          {/* Header Bar */}
          <div className="py-2.5 px-4 border-b border-border/40 bg-gradient-to-r from-muted/30 via-background to-muted/20 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold shrink-0 border border-emerald-500/20">
                <CreditCard className="h-4.5 w-4.5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-[14px] font-bold text-foreground leading-tight">{rental.customer}</h3>
                  <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-primary/10 text-primary border border-primary/20">
                    {rental.id}
                  </span>
                </div>
                <div className="text-[10.5px] text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  {customerInfo.id && (
                    <span className="font-medium bg-muted/60 px-1.5 py-0.2 rounded text-foreground/80">
                      ID: {customerInfo.id}
                    </span>
                  )}
                  {customerInfo.phone && (
                    <span className="flex items-center gap-1 font-medium">
                      • Contact: <span className="text-foreground/80 font-bold">{customerInfo.phone}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs font-medium">
              <div className="px-2.5 py-1 rounded-lg bg-muted/40 border border-border/40 text-right">
                <span className="text-[9px] text-muted-foreground uppercase font-semibold block leading-tight">Total Due</span>
                <span className={`font-mono font-bold text-[13px] ${selectedItemsDetails.outstanding > 0 ? "text-destructive" : "text-emerald-600"}`}>
                  ₹{selectedItemsDetails.outstanding.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>
          
          <div className="p-4 overflow-y-auto flex-1">
                        {hasPayableItems ? (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Left Column: Equipment Items List */}
                <div className="md:col-span-7 space-y-2">
                  <div className="flex justify-between items-center pb-0.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      Select Equipment ({selectedEqIds.length} of {activeEqItems.length || eqItems.length})
                    </Label>
                    {activeEqItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const activeIds = activeEqItems.map((it: any) => it.equipmentId);
                          if (selectedEqIds.length === activeIds.length) {
                            setSelectedEqIds([activeIds[0]]);
                          } else {
                            setSelectedEqIds(activeIds);
                          }
                        }}
                        className="text-[10.5px] text-primary font-bold hover:underline"
                      >
                        {selectedEqIds.length === activeEqItems.length ? "Select Single" : "Select All Items"}
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                    {eqItems.map((item: any) => {
                      const details = calcUnpaidDetailsForEquipment(rental, item.equipmentId);
                      const isReturned = !!item.returned;
                      const isChecked = !isReturned && selectedEqIds.includes(item.equipmentId);
                      return (
                        <div
                          key={item.equipmentId}
                          className={`p-3.5 rounded-xl border transition-all ${
                            isReturned
                              ? "opacity-60 bg-muted/20 border-border/30 cursor-not-allowed"
                              : isChecked
                              ? "border-emerald-500/30 bg-emerald-500/5 shadow-xs"
                              : "border-border/60 bg-card hover:border-border cursor-pointer"
                          }`}
                          onClick={() => {
                            if (isReturned) return;
                            setSelectedEqIds(prev => 
                              prev.includes(item.equipmentId)
                                ? (prev.length > 1 ? prev.filter(id => id !== item.equipmentId) : prev)
                                : [...prev, item.equipmentId]
                            );
                          }}
                        >
                          <div className="flex items-start gap-3">
                            {!isReturned ? (
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}}
                                className="mt-1 rounded border-muted text-emerald-600 focus:ring-emerald-500 h-4 w-4 pointer-events-none shrink-0"
                              />
                            ) : (
                              <div className="w-4 h-4 shrink-0 mt-1" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className={`font-bold text-[13px] truncate ${item.returned ? "line-through text-muted-foreground" : "text-foreground"}`}>
                                  {getEquipmentName(item.equipmentId)}
                                </span>
                                <span className={`font-mono font-bold text-sm shrink-0 ${details.outstanding > 0 ? "text-destructive" : "text-emerald-600"}`}>
                                  ₹{details.outstanding.toLocaleString("en-IN")}
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground mt-1">
                                {item.serial && (
                                  <span className="font-mono bg-muted/50 px-1.5 py-0.5 rounded text-[10px] text-foreground font-medium">
                                    S/N: {item.serial}
                                  </span>
                                )}
                                <span>{details.rateText}</span>
                                <span>•</span>
                                <span>{item.returned ? "Returned" : details.unpaidText}</span>
                                <span>•</span>
                                <span className="text-emerald-600 font-medium">Paid: ₹{details.grandTotalPaid.toLocaleString("en-IN")}</span>
                              </div>

                              {isMultiItem && isChecked && itemPayments[item.equipmentId] && (
                                <div
                                  className="mt-3 pt-3 border-t border-border/40 space-y-2"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                      <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Amount (₹)</Label>
                                      <Input
                                        type="number"
                                        value={itemPayments[item.equipmentId].amount}
                                        onChange={(e) => handleItemAmountChange(item.equipmentId, e.target.value)}
                                        className="h-8 text-[12px] bg-background font-semibold"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Method</Label>
                                      <Select
                                        value={itemPayments[item.equipmentId].mode}
                                        onValueChange={(m) => handleItemModeChange(item.equipmentId, m)}
                                      >
                                        <SelectTrigger className="h-8 text-[12px]"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                          {["Cash", "Bank", "Cash+Bank"].map((m) => (
                                            <SelectItem key={m} value={m}>{m}</SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>

                                  {itemPayments[item.equipmentId].mode === "Cash+Bank" && (
                                    <div className="grid grid-cols-2 gap-2 p-2 rounded-lg border border-border/50 bg-muted/20">
                                      <div className="space-y-1">
                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Cash (₹)</Label>
                                        <Input
                                          type="number"
                                          value={itemPayments[item.equipmentId].cashAmount}
                                          onChange={(e) => handleItemCashChange(item.equipmentId, e.target.value)}
                                          className="h-8 text-[12px] font-semibold bg-emerald-50/20"
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">Bank (₹)</Label>
                                        <Input
                                          type="number"
                                          value={itemPayments[item.equipmentId].bankAmount}
                                          onChange={(e) => handleItemBankChange(item.equipmentId, e.target.value)}
                                          className="h-8 text-[12px] font-semibold bg-blue-50/20"
                                        />
                                      </div>
                                    </div>
                                  )}

                                  {itemPayments[item.equipmentId].mode !== "Cash" && (
                                    <Input
                                      placeholder="Txn ref (optional)"
                                      value={itemPayments[item.equipmentId].txRef}
                                      onChange={(e) => updateItemPayment(item.equipmentId, { txRef: e.target.value })}
                                      className="h-8 text-[12px]"
                                    />
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                                {/* Right Column: Payment Details & Summary Sidebar */}
                <div className="md:col-span-5 flex flex-col justify-between h-full">
                  <div className="space-y-2.5 bg-muted/15 border border-border/50 p-3 rounded-xl">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-primary">Payment Details</h4>

                    {!isMultiItem && (
                      <>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Amount to Pay (₹)</Label>
                          <Input
                            type="number"
                            placeholder="e.g. 500"
                            value={manualPayAmount}
                            onChange={(e) => handleAmountChange(e.target.value)}
                            className="h-8 text-[12px] font-bold bg-background text-foreground"
                          />
                        </div>

                        {selectedEqIds.length === 1 && (
                          <div className="p-2.5 rounded-lg border border-dashed border-primary/20 bg-primary/5 space-y-1.5 my-1">
                            <div className="flex items-center gap-2">
                              <input
                                id="apply-discount-checkbox"
                                type="checkbox"
                                checked={applyDiscount}
                                onChange={(e) => handleApplyDiscountToggle(e.target.checked)}
                                className="rounded border-muted text-primary focus:ring-primary h-3.5 w-3.5 shrink-0"
                              />
                              <Label htmlFor="apply-discount-checkbox" className="text-[11px] font-bold text-slate-700 dark:text-slate-200 cursor-pointer">
                                Apply Discount
                              </Label>
                            </div>

                            {applyDiscount && (
                              <div className="grid grid-cols-2 gap-2 pt-0.5 animate-[fade-in_0.2s_ease-out] transition-all">
                                <div className="space-y-0.5">
                                  <Label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Type</Label>
                                  <div className="flex gap-1">
                                    <button
                                      type="button"
                                      onClick={() => setDiscountType("one-time")}
                                      className={`flex-1 py-0.5 px-1 rounded text-[9.5px] font-bold border transition-all text-center leading-tight ${
                                        discountType === "one-time"
                                          ? "bg-primary text-primary-foreground border-primary shadow-xs"
                                          : "bg-background text-muted-foreground border-border hover:bg-muted/40"
                                      }`}
                                    >
                                      One-Time
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setDiscountType("permanent")}
                                      className={`flex-1 py-0.5 px-1 rounded text-[9.5px] font-bold border transition-all text-center leading-tight ${
                                        discountType === "permanent"
                                          ? "bg-primary text-primary-foreground border-primary shadow-xs"
                                          : "bg-background text-muted-foreground border-border hover:bg-muted/40"
                                      }`}
                                    >
                                      Perm
                                    </button>
                                  </div>
                                </div>

                                <div className="space-y-0.5">
                                  <Label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Amount (₹)</Label>
                                  <Input
                                    type="number"
                                    placeholder="e.g. 500"
                                    value={discountVal}
                                    onChange={(e) => handleDiscountChange(e.target.value)}
                                    className="h-7 text-[11px] bg-background font-semibold"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Payment Date</Label>
                        <Input
                          type="date"
                          value={paymentDate}
                          onChange={(e) => setPaymentDate(e.target.value)}
                          className="h-8 text-[11px] bg-background"
                        />
                      </div>

                      {!isMultiItem ? (
                        <div className="space-y-1">
                          <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Method</Label>
                          <Select
                            value={paymentMode}
                            onValueChange={(m) => {
                              setPaymentMode(m);
                              if (m === "Cash+Bank") {
                                const cAmt = Math.round(payAmount / 2);
                                setCashAmount(cAmt.toString());
                                setBankAmount((payAmount - cAmt).toString());
                              }
                            }}
                          >
                            <SelectTrigger className="h-8 text-[11px] bg-background"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {["Cash", "Bank", "Cash+Bank"].map((m) => (
                                <SelectItem key={m} value={m}>{m}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Method</Label>
                          <div className="h-8 flex items-center bg-muted/40 px-2 rounded-md text-[10px] font-medium border border-border/40 text-muted-foreground">
                            Managed below
                          </div>
                        </div>
                      )}
                    </div>

                    {!isMultiItem && (
                      <>
                        {paymentMode === "Cash+Bank" && (
                          <div className="grid grid-cols-2 gap-2 p-1.5 bg-background rounded-lg border border-border">
                            <div className="space-y-0.5">
                              <Label className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Cash (₹)</Label>
                              <Input
                                type="number"
                                placeholder="Cash"
                                className="h-7 text-[11px] font-semibold bg-emerald-50/20"
                                value={cashAmount}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setCashAmount(val);
                                  const cNum = Math.max(0, Number(val) || 0);
                                  setBankAmount(Math.max(0, payAmount - cNum).toString());
                                }}
                              />
                            </div>
                            <div className="space-y-0.5">
                              <Label className="text-[9px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">Bank (₹)</Label>
                              <Input
                                type="number"
                                placeholder="Bank"
                                className="h-7 text-[11px] font-semibold bg-blue-50/20"
                                value={bankAmount}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setBankAmount(val);
                                  const bNum = Math.max(0, Number(val) || 0);
                                  setCashAmount(Math.max(0, payAmount - bNum).toString());
                                }}
                              />
                            </div>
                          </div>
                        )}

                        <div className="space-y-1">
                          <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Txn Reference (Optional)</Label>
                          <Input
                            placeholder="UPI txn ID, cheque no, etc."
                            value={txRef}
                            onChange={(e) => setTxRef(e.target.value)}
                            className="h-8 text-[11px] bg-background"
                          />
                        </div>
                      </>
                    )}

                    {/* Total Payable Banner */}
                    <div className="p-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 flex items-center justify-between shadow-xs mt-1.5">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Payable</span>
                      <span className="text-lg font-bold font-mono text-emerald-600">
                        ₹{(isMultiItem ? multiItemTotal : payAmount).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 shrink-0">
                    <DialogClose asChild className="flex-1">
                      <Button variant="outline" type="button" className="h-8.5 text-[11px] font-semibold">Cancel</Button>
                    </DialogClose>
                    <Button
                      type="button"
                      onClick={handlePay}
                      disabled={isPaying}
                      className="flex-2 h-8.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] gap-1 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> {isPaying ? "Recording…" : "Confirm Payment"}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center space-y-3">
                <div className="h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <p className="text-sm font-bold text-foreground">All items have been returned & fully paid!</p>
                <DialogClose asChild>
                  <Button variant="outline" size="sm">Close</Button>
                </DialogClose>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function DuesPage() {
  const dbVersion = useDatabaseTrigger();
  const [activeTab, setActiveTab] = useState("all");
  const [refreshKey, setRefreshKey] = useState(0);
  // Re-read from localStorage whenever refreshKey or dbVersion changes (after payments recorded)
  const rentalsList = useMemo(() => getRentals(), [refreshKey, dbVersion]);
  const paymentsList = useMemo(() => getPayments(), [refreshKey, dbVersion]);

  const formatRupee = (val: number) => `₹${val.toLocaleString("en-IN")}`;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayMonth = today.getMonth();
  const todayYear = today.getFullYear();
  const todayDate = today.getDate();

  // Returns the day of the month for the given date.
  const getStartDayOfMonth = (dateStr: string) => {
    const d = parseLocalDate(dateStr);
    if (isNaN(d.getTime())) return 1;
    return d.getDate();
  };



  // Check if a rental has received a Rent payment in the current month
  const hasPaidThisMonth = (rentalId: string) => {
    return paymentsList.some((p) => {
      if (p.agreement !== rentalId) return false;
      if (p.status !== "Paid") return false;
      if (p.type !== "Rent" && p.type !== "Rent Payment") return false;
      const pDate = parseLocalDate(p.date);
      return !isNaN(pDate.getTime()) &&
        pDate.getMonth() === todayMonth &&
        pDate.getFullYear() === todayYear;
    });
  };

  const [eqInventory] = useState(() => getEquipment());
  // PERF/ITEM-17: one map lookup per row instead of scanning the inventory.
  const equipmentById = useMemo(
    () => new Map<string, any>(eqInventory.map((e: any) => [e.id, e])),
    [eqInventory]
  );
  const getEquipmentName = (eqId: string) => {
    const eq = eqInventory.find((e) => e.id === eqId);
    return eq ? eq.name : eqId;
  };

  // ─── Calculate unpaid duration and outstanding balance ─────────────────────
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
        grandTotalPaid: 0,
        rate: 0
      };
    }

    const eqItems = rental.equipmentItems || [];
    const item = eqItems.find((it: any) => it.equipmentId === eqId);
    
    // Rates
    const monthlyRent = item ? (Number(item.monthlyRent || item.rentRate) || 0) : 0;
    const dailyRate = (item ? Number(item.dailyRent) : 0) || rental.dailyRent || 0;
    const itemCycle = item?.rentCycle || (rental as any).rentCycle || (monthlyRent > 0 && dailyRate === 0 ? "Monthly" : "Daily");
    const isMonthly = itemCycle === "Monthly";

    const dailyRent = monthlyRent / 30;
    const start = parseLocalDate(rental.start);

    // Count paid amount from payment records using getPaidForEquipment helper, excluding initial advance payment
    const grandTotalPaid = getPaidForEquipment(rental, eqId, paymentsList, true);

    let unpaidMonths = 0;
    let unpaidDays = 0;
    let outstanding = 0;
    let unpaidText = "";
    let rateText = "";
    let totalDue = 0;

    // Check if the item has been returned, and find its return date
    let billingEndDate = today;
    if (item?.returned) {
      const returns = getReturns();
      const ret = returns.find(
        (r: any) => r.agreement === rental.id && r.returnedEquipmentIds?.includes(eqId)
      );
      if (ret?.date) {
        const parsedReturn = parseLocalDate(ret.date);
        if (!isNaN(parsedReturn.getTime())) {
          billingEndDate = parsedReturn;
        }
      }
    }

    if (isMonthly) {
      const diffTime = Math.max(0, billingEndDate.getTime() - start.getTime());
      const totalDaysElapsed = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Monthly billing: calculate only complete months elapsed
      const monthsElapsed = Math.floor(totalDaysElapsed / 30);
      totalDue = monthsElapsed * monthlyRent;
      
      outstanding = item?.returned ? 0 : Math.max(0, totalDue - grandTotalPaid);
      unpaidMonths = monthlyRent > 0 ? Math.round(outstanding / monthlyRent) : 0;
      unpaidText = item?.returned ? "—" : `${unpaidMonths}m`;
      rateText = `₹${monthlyRent.toLocaleString("en-IN")}/mo`;
    } else {
      // Daily billing: calculate purely by days elapsed
      const diffTime = Math.max(0, billingEndDate.getTime() - start.getTime());
      const daysElapsed = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      totalDue = daysElapsed * dailyRate;
      
      outstanding = item?.returned ? 0 : Math.max(0, totalDue - grandTotalPaid);
      unpaidDays = dailyRate > 0 ? Math.round(outstanding / dailyRate) : 0;
      unpaidMonths = 0;
      unpaidText = item?.returned ? "—" : `${unpaidDays}d`;
      rateText = `₹${dailyRate.toLocaleString("en-IN")}/day`;
    }

    const rate = isMonthly ? monthlyRent : dailyRate;

    return { unpaidMonths, unpaidDays, outstanding, unpaidText, rateText, isMonthly, totalDue, grandTotalPaid, rate };
  };

  // Filter out completed/cancelled rentals, and agreements where everything is returned AND fully paid
  const activeRentals = useMemo(() => {
    return rentalsList.filter((r) => {
      if (r.status === "Completed" || r.status === "Cancelled") return false;
      
      const eqItems = r.equipmentItems || [
        {
          equipmentId: r.equipmentId,
          serial: r.serial,
          monthlyRent: Number(r.monthlyRent) || 0,
          deposit: Number(r.deposit) || 0,
          returned: false
        }
      ];
      
      const hasUnreturned = eqItems.some((item: any) => !item.returned);
      const hasOutstandingDues = eqItems.some((item: any) => {
        const { outstanding } = calcUnpaidDetailsForEquipment(r, item.equipmentId);
        return outstanding > 0;
      });

      return hasUnreturned || hasOutstandingDues;
    });
  }, [rentalsList, paymentsList]);

  // Group by rental agreement (one row per rental)
  const dueRentals = useMemo(() => {
    const mapped = activeRentals.map((r) => {
      const eqItems = r.equipmentItems || [
        {
          equipmentId: r.equipmentId,
          serial: r.serial,
          monthlyRent: Number(r.monthlyRent) || 0,
          deposit: Number(r.deposit) || 0,
          returned: false
        }
      ];
      
      let totalOutstanding = 0;
      let totalPaid = 0;
      eqItems.forEach((eqItem: any) => {
        const { outstanding, grandTotalPaid } = calcUnpaidDetailsForEquipment(r, eqItem.equipmentId);
        totalOutstanding += outstanding;
        totalPaid += grandTotalPaid;
      });

      // Equipment still out, for the breakdown column.
      const openItems = eqItems.filter((it: any) => !it.returned);

      return {
        rental: r,
        totalOutstanding,
        totalPaid,
        start: r.start,
        id: r.id,
        openItems,
      };
    });

    // Sort by largest outstanding balance first, then by agreement ID.
    return [...mapped].sort((a, b) => {
      if (a.totalOutstanding !== b.totalOutstanding) return b.totalOutstanding - a.totalOutstanding;
      return extractIdNumber(b.id) - extractIdNumber(a.id);
    });
  }, [activeRentals, paymentsList]);

  // Group by start day-of-month ranges
  const due1To10List  = dueRentals.filter((item) => { const d = getStartDayOfMonth(item.start); return d >= 1  && d <= 10; });
  const due11To20List = dueRentals.filter((item) => { const d = getStartDayOfMonth(item.start); return d >= 11 && d <= 20; });
  const due21To31List = dueRentals.filter((item) => { const d = getStartDayOfMonth(item.start); return d >= 21 && d <= 31; });

  const [searchQuery, setSearchQuery] = useState("");
  // PERF: the field stays bound to searchQuery so typing is instant; the filter
  // below runs off the debounced copy.
  const debouncedSearch = useDebounce(searchQuery, 300);
  const customersList = useMemo(() => getCustomers(), [dbVersion]);
  // PERF: one lookup per row instead of a linear scan of every customer.
  const customersById = useMemo(
    () => new Map<string, any>(customersList.map((c: any) => [c.id, c])),
    [customersList]
  );

  // Returns every phone number on file for a customer (primary + alternates),
  // so the dues table can stack them instead of showing just one.
  const getCustomerPhones = (customerId: string): string[] => {
    const cust: any = customersList.find((c: any) => c.id === customerId);
    if (!cust) return [];
    return [cust.phone, cust.altPhone, cust.contactNumber3]
      .map((p) => String(p || "").trim())
      .filter(Boolean);
  };

  const filteredRentals = useMemo(() => {
    const q = debouncedSearch.toLowerCase().trim();
    const tokens = q.split(/\s+/).filter(Boolean);

    /** True when any whole word in `text` starts with `token`. */
    const wordStartsWith = (text: unknown, token: string) => {
      if (!text) return false;
      return String(text)
        .toLowerCase()
        .split(/[\s,./\()-]+/)
        .filter(Boolean)
        .some((w) => w.startsWith(token));
    };

    return dueRentals.filter((item) => {
      const r = item.rental;
      const customer = customersById.get(r.customerId);

      // ITEM-8 FIX: every field was matched with a bare `.includes()`, so
      // searching a customer name also hit any address, area or equipment name
      // that happened to contain those letters - typing "ram" returned rows for
      // "Ramanagara" (an area) and "Ram Nagar" (an address) alongside the actual
      // customer. Names and places now match on word prefix, ids on prefix, and
      // phone numbers only against digits, so a name search returns customers.
      const matchesSearch = !q || tokens.every((token) => {
        const tokenDigits = token.replace(/\D/g, "");

        // Customer name - word prefix ("srini" finds "Srinivas", not "Nagasrini")
        if (wordStartsWith(r.customer, token)) return true;

        // Agreement id, either whole or just the numeric part
        const idLower = String(r.id || "").toLowerCase();
        if (idLower.startsWith(token) || (tokenDigits.length >= 2 && idLower.includes(tokenDigits))) return true;

        // Serial numbers identify a unit exactly - substring is right here
        if (String(r.serial || "").toLowerCase().includes(token)) return true;
        if (Array.isArray(r.equipmentItems) && r.equipmentItems.some((ei: any) => String(ei.serial || "").toLowerCase().includes(token))) return true;

        // Equipment name - word prefix, not substring
        if (wordStartsWith(r.equipment, token)) return true;

        if (customer) {
          // Phones: compare digits to digits so "98" never matches a street name
          if (tokenDigits.length >= 3) {
            const phones = [customer.phone, customer.altPhone, customer.contactNumber3];
            if (phones.some((ph: any) => String(ph || "").replace(/\D/g, "").includes(tokenDigits))) return true;
          }
          if (wordStartsWith(customer.area, token)) return true;
          if (wordStartsWith(customer.address, token)) return true;
        }

        return false;
      });

      if (!matchesSearch) return false;

      if (activeTab === "all") return true;
      const day = getStartDayOfMonth(item.start);
      if (activeTab === "1-10")  return day >= 1  && day <= 10;
      if (activeTab === "11-20") return day >= 11 && day <= 20;
      if (activeTab === "21-31") return day >= 21 && day <= 31;
      return true;
    });
  }, [dueRentals, debouncedSearch, activeTab, customersById]);

  const severityBuckets = [
    {
      l: "1–10 Days Due (1st–10th)",
      v: formatRupee(due1To10List.reduce((sum, item) => sum + item.totalOutstanding, 0)),
      n: `${due1To10List.filter(item => item.totalOutstanding > 0).length} agreement(s) due`,
      icon: Calendar,
      iconColor: "text-primary",
    },
    {
      l: "11–20 Days Due (11th–20th)",
      v: formatRupee(due11To20List.reduce((sum, item) => sum + item.totalOutstanding, 0)),
      n: `${due11To20List.filter(item => item.totalOutstanding > 0).length} agreement(s) due`,
      icon: IndianRupee,
      iconColor: "text-accent",
    },
    {
      l: "21–31 Days Due (21st–31st)",
      v: formatRupee(due21To31List.reduce((sum, item) => sum + item.totalOutstanding, 0)),
      n: `${due21To31List.filter(item => item.totalOutstanding > 0).length} agreement(s) due`,
      icon: Calendar,
      iconColor: "text-warning-foreground",
      alert: true,
    },
  ];

  const handleExportExcel = () => {
    const listToExport = filteredRentals.length > 0 ? filteredRentals : dueRentals;
    if (listToExport.length === 0) {
      toast.error("No rent due records available to export.");
      return;
    }

        const headers = [
      "Customer Name",
      "Phone Number",
      "Equipment",
      "Deposit Amount (₹)",
      "Start Date",
      "Rent Rate (₹)",
      "Pending Months",
      "Total Paid Amount (₹)",
      "Remaining Due (₹)"
    ];

    const rows = listToExport.map((item) => {
      const r = item.rental;
      const cust = customersList.find((c: any) => c.id === r.customerId);

      // Show all phone numbers down by down
      const p1 = r.phone || cust?.phone || "";
      const p2 = r.altPhone || cust?.altPhone || "";
      const p3 = r.contactNumber3 || cust?.contactNumber3 || "";
      const phoneList = [p1, p2, p3].map((p) => String(p || "").trim()).filter(Boolean);
      const allPhones = Array.from(new Set(phoneList)).join("\n");

      const eqItems = r.equipmentItems || [
        {
          equipmentId: r.equipmentId,
          serial: r.serial,
          monthlyRent: Number(r.monthlyRent) || 0,
          deposit: Number(r.deposit) || 0,
        }
      ];

      // Equipment Name + Model Number down by down
      const eqNames = eqItems.map((ei: any) => {
        const eq = equipmentById.get(ei.equipmentId);
        const name = ei.name || getEquipmentName(ei.equipmentId);
        const model = ei.model || eq?.model || "";
        return model && model.toLowerCase() !== name.toLowerCase() ? `${name} - ${model}` : name;
      }).join("\n");

      const depositVal = eqItems.reduce((sum: number, ei: any) => sum + (Number(ei.deposit) || 0), 0) || Number(r.deposit) || 0;
      const startDateFormatted = formatDateDDMMYYYY(r.start);

      const rates = eqItems.map((ei: any) => {
        const isMonthly = Number(ei.monthlyRent) > 0;
        const rate = isMonthly ? Number(ei.monthlyRent) : Number(ei.dailyRent || ei.rentRate || 0);
        return `₹${rate.toLocaleString("en-IN")}/${isMonthly ? "mo" : "day"}`;
      }).join("\n");

      const pendingDurations = eqItems.map((ei: any) => {
        const { unpaidText } = calcUnpaidDetailsForEquipment(r, ei.equipmentId);
        return unpaidText;
      }).filter((t: string) => t && t !== "—").join("\n");

      return [
        r.customer || "Unknown",
        allPhones || "—",
        eqNames || r.equipment || "Equipment",
        depositVal,
        startDateFormatted,
        rates,
        pendingDurations || "0m",
        item.totalPaid,
        item.totalOutstanding
      ];
    });

    const tabLabel = activeTab === "all" ? "1-10_11-20_21-31" : activeTab === "1-10" ? "1-10_Days" : activeTab === "11-20" ? "11-20_Days" : "21-31_Days";
    const filename = `rent_due_statement_${tabLabel}_${getLocalYYYYMMDD()}.xls`;

    downloadExcel(filename, headers, rows, [180, 220, 260, 130, 110, 140, 130, 140, 140]);
    toast.success(`Excel report "${filename}" generated & downloaded successfully!`);
  };

  return (
    <AppShell
      title="Rent Dues"
      subtitle="Automated due tracking with outstanding balance calculations"
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-300 font-bold gap-1.5"
            onClick={handleExportExcel}
            title="Export Excel Report for Rent Dues (1-10, 11-20, 21-31)"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
            Export Excel Report
          </Button>
          <Button size="sm" onClick={() => {
            toast.success("Sending reminders to " + filteredRentals.length + " customer(s) via WhatsApp, SMS & Email.");
          }}>
            <Bell className="mr-1.5 h-3.5 w-3.5" />
            Send All Reminders
          </Button>
        </div>
      }
    >
      {/* Severity metric bar */}
      <Card className="mb-5 overflow-hidden">
        <CardContent className="p-0">
          <div className="grid grid-cols-1 divide-y divide-border/60 sm:grid-cols-3 sm:divide-y-0 sm:divide-x">
            {severityBuckets.map((s, i) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.l}
                  className={`relative flex flex-col gap-1.5 p-4 transition-colors hover:bg-muted/30 animate-[fade-in_0.35s_ease-out_both] stagger-${i + 1}`}
                >
                  <div className="flex items-center justify-between">
                    <Icon className={`h-4 w-4 ${s.iconColor}`} />
                    {s.alert && (
                      <span className="flex h-2 w-2">
                        <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-destructive opacity-60" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground/60">{s.l}</p>
                    <p className="font-display text-[18px] font-bold tracking-tight mt-0.5">{s.v}</p>
                    <p className="text-[11px] text-muted-foreground">{s.n}</p>
                  </div>
                  {s.alert && <div className="absolute bottom-0 inset-x-0 h-[2px] bg-destructive/40" />}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/60 bg-muted/20 px-4 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 flex-1 max-w-md">
              <CardTitle className="shrink-0">Pending Dues</CardTitle>
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
                <Input
                  placeholder="Search customer, phone, serial, agreement…"
                  className="pl-9 h-8 text-[12.5px] bg-card border-border/50 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            {/* Desktop tabs & Export button */}
            <div className="hidden sm:flex items-center gap-2">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="h-8">
                  <TabsTrigger value="all"      className="text-[12px] h-7 px-3">All</TabsTrigger>
                  <TabsTrigger value="1-10"     className="text-[12px] h-7 px-3">1–10 Days</TabsTrigger>
                  <TabsTrigger value="11-20"    className="text-[12px] h-7 px-3">11–20 Days</TabsTrigger>
                  <TabsTrigger value="21-31"    className="text-[12px] h-7 px-3">21–31 Days</TabsTrigger>
                </TabsList>
              </Tabs>

              <Button
                variant="outline"
                size="sm"
                className="h-8 text-[12px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-300 gap-1.5"
                onClick={handleExportExcel}
                title="Export Excel Statement"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" /> Excel
              </Button>
            </div>
            {/* Mobile chips */}
            <div className="flex gap-1.5 overflow-x-auto pb-0.5 sm:hidden">
              {["all", "1-10", "11-20", "21-31"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`mobile-chip shrink-0 ${activeTab === tab ? "active" : ""}`}
                >
                  {tab === "all" ? "All" : `${tab} Days`}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Desktop table — hidden on mobile */}
          <div className="hidden sm:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-2.5 py-2 text-[10.5px]">Customer</TableHead>
                  <TableHead className="px-2 py-2 text-[10.5px]">Agreement</TableHead>
                  <TableHead className="px-2.5 py-2 text-[10.5px]">Equipment</TableHead>

                  <TableHead className="px-2 py-2 text-[10.5px]">Start Date</TableHead>
                  <TableHead className="px-2 py-2 text-[10.5px] text-right">Rate</TableHead>
                  <TableHead className="px-2 py-2 text-[10.5px] text-right">Unpaid Duration</TableHead>
                  <TableHead className="px-2 py-2 text-[10.5px] text-right text-success">Total Paid Amount</TableHead>
                  <TableHead className="px-2 py-2 text-[10.5px] text-right text-destructive">Remaining Balance</TableHead>
                  <TableHead className="px-2 py-2 text-[10.5px]">Status</TableHead>
                  <TableHead className="px-2 py-2 text-[10.5px] text-right w-28">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRentals.map((item) => {
                  const r = item.rental;
                  const eqItems = r.equipmentItems || [
                    {
                      equipmentId: r.equipmentId,
                      serial: r.serial,
                      monthlyRent: Number(r.monthlyRent) || 0,
                      returned: false
                    }
                  ];
                  return (
                    <TableRow key={item.id} className="group">
                      <TableCell className="px-2.5 py-2">
                        <p className="font-semibold text-[12px] leading-tight">{r.customer}</p>
                        <p className="text-[9.5px] font-mono text-muted-foreground/70">{r.customerId}</p>
                        {getCustomerPhones(r.customerId).length > 0 && (
                          <div className="mt-0.5 space-y-0.5">
                            {getCustomerPhones(r.customerId).map((p, idx) => (
                              <p key={idx} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                <Phone className="h-2.5 w-2.5 shrink-0" /> {p}
                              </p>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="px-2 py-2">
                        <span className="inline-flex items-center rounded-md bg-primary/8 border border-primary/18 px-1.5 py-0.5 font-mono text-[10.5px] font-bold text-primary">
                          {r.id}
                        </span>
                      </TableCell>
                      <TableCell className="px-2.5 py-2">
                        <div className="space-y-1">
                          {eqItems.map((eqItem: any) => {
                            const isReturned = eqItem.returned;
                            return (
                              <div key={eqItem.equipmentId} className="flex items-center gap-1 text-[11.5px]">
                                <span className={isReturned ? "line-through text-muted-foreground/50" : "text-foreground/80 font-medium"}>
                                  {/* ITEM-17/ITEM-7: name, model and serial, so the
                                      row says which physical unit is on rent. */}
                                                                    {formatEquipmentLabel({
                                    name: eqItem.name || getEquipmentName(eqItem.equipmentId),
                                    model: eqItem.model || equipmentById.get(eqItem.equipmentId)?.model,
                                    serial: "",
                                  })}
                                </span>
                                {isReturned && (() => {
                                  const retDateRaw = eqItem.returnedDate || eqItem.returnDate || r.end;
                                  const formattedRetDate = retDateRaw ? formatDateDDMMYYYY(retDateRaw) : "";
                                  return (
                                    <span className="inline-flex items-center rounded-md bg-success/8 px-1 py-0.2 text-[9.5px] font-bold text-success border border-success/15 shrink-0">
                                      Returned {formattedRetDate ? `on ${formattedRetDate}` : ""}
                                    </span>
                                  );
                                })()}
                              </div>
                            );
                          })}
                        </div>
                      </TableCell>
                      <TableCell className="px-2 py-2">
                        <span className="text-[11px] font-mono text-muted-foreground">
                          {formatDateDDMMYYYY(r.start)}
                        </span>
                      </TableCell>
                      <TableCell className="px-2 py-2 text-right">
                        <div className="space-y-1 text-right">
                          {eqItems.map((eqItem: any) => {
                            const { rateText } = calcUnpaidDetailsForEquipment(r, eqItem.equipmentId);
                            return (
                              <div key={eqItem.equipmentId} className={`text-[11.5px] font-semibold ${eqItem.returned ? "text-muted-foreground/40 line-through" : "text-muted-foreground"}`}>
                                {rateText}
                              </div>
                            );
                          })}
                        </div>
                      </TableCell>
                      <TableCell className="px-2 py-2 text-right">
                        <div className="space-y-1 text-right">
                          {eqItems.map((eqItem: any) => {
                            const { unpaidText } = calcUnpaidDetailsForEquipment(r, eqItem.equipmentId);
                            return (
                              <div key={eqItem.equipmentId} className={`text-[11.5px] font-bold ${eqItem.returned ? "text-muted-foreground/40" : "text-destructive"}`}>
                                {eqItem.returned ? "—" : unpaidText}
                              </div>
                            );
                          })}
                        </div>
                      </TableCell>
                                            <TableCell className="px-2 py-2 text-right">
                        <div className="text-[11.5px] font-extrabold text-success text-right">
                          ₹{item.totalPaid.toLocaleString("en-IN")}
                        </div>
                      </TableCell>
                      <TableCell className="px-2 py-2 text-right">
                        <div className={`text-[11.5px] font-extrabold text-right ${item.totalOutstanding > 0 ? "text-destructive" : "text-success"}`}>
                          ₹{item.totalOutstanding.toLocaleString("en-IN")}
                        </div>
                      </TableCell>
                      <TableCell className="px-2 py-2"><StatusBadge status={r.status} /></TableCell>
                      <TableCell className="px-2 py-2 text-right">
                        <div className="flex items-center justify-end gap-0.5 transition-opacity">
                          <PayDialog
                            rental={r}
                            paymentsList={paymentsList}
                            eqInventory={eqInventory}
                            calcUnpaidDetailsForEquipment={calcUnpaidDetailsForEquipment}
                            getEquipmentName={getEquipmentName}
                            onPaid={() => setRefreshKey((k) => k + 1)}
                          />
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-success hover:bg-success/10" title="WhatsApp" onClick={() => toast.success(`WhatsApp reminder sent to ${r.customer}`)}>
                            <MessageCircle className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10" title="SMS" onClick={() => toast.success(`SMS reminder sent to ${r.customer}`)}>
                            <Phone className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10" title="Email" onClick={() => toast.success(`Email reminder sent to ${r.customer}`)}>
                            <Mail className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredRentals.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="py-10 text-center text-[13px] text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <CheckCircle2 className="h-8 w-8 text-success/50" />
                        <p>No pending dues found matching this filter.</p>
                        <p className="text-[11px]">All payments are up to date!</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile card list */}
          <div className="sm:hidden">
            {filteredRentals.length === 0 ? (
              <div className="py-10 text-center text-[13px] text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 text-success/50 mx-auto mb-2" />
                <p>No pending dues.</p>
                <p className="text-[11px] mt-1">All payments are up to date!</p>
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {filteredRentals.map((item) => {
                  const r = item.rental;
                  const eqItems = r.equipmentItems || [
                    {
                      equipmentId: r.equipmentId,
                      serial: r.serial,
                      monthlyRent: Number(r.monthlyRent) || 0,
                      returned: false
                    }
                  ];
                  return (
                    <div key={item.id} className="px-4 py-3.5 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-[13.5px]">{r.customer}</p>
                          <span className="inline-flex items-center rounded-md bg-primary/8 border border-primary/18 px-1.5 py-0.5 font-mono text-[11px] font-bold text-primary mt-0.5">{r.id}</span>
                          {getCustomerPhones(r.customerId).length > 0 && (
                            <div className="mt-1 space-y-0.5">
                              {getCustomerPhones(r.customerId).map((p, idx) => (
                                <p key={idx} className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                  <Phone className="h-2.5 w-2.5 shrink-0" /> {p}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                        <StatusBadge status={r.status} />
                      </div>
                      
                      <div className="space-y-2 bg-muted/40 rounded-xl p-3">
                        {eqItems.map((eqItem: any) => {
                          const { outstanding, unpaidText, grandTotalPaid } = calcUnpaidDetailsForEquipment(r, eqItem.equipmentId);
                          return (
                            <div key={eqItem.equipmentId} className="text-[12px] flex flex-col gap-0.5 border-b border-border/40 last:border-b-0 pb-2 last:pb-0 mb-2 last:mb-0">
                              <div className="flex items-center justify-between font-medium">
                                <span className={eqItem.returned ? "line-through text-muted-foreground/60 font-medium" : "text-slate-800 font-semibold"}>
                                  {getEquipmentName(eqItem.equipmentId)}
                                </span>
                                {eqItem.returned ? (
                                  <span className="inline-flex items-center rounded bg-success/8 px-1.5 py-0.5 text-[9px] font-bold text-success border border-success/15 shrink-0">Returned</span>
                                ) : (
                                  <span className="inline-flex items-center rounded bg-primary/8 px-1.5 py-0.5 text-[9px] font-bold text-primary border border-primary/15 shrink-0">Active</span>
                                )}
                              </div>
                              <div className="flex justify-between text-[11.5px] text-muted-foreground mt-1">
                                <span>Unpaid: <strong className={eqItem.returned ? "text-muted-foreground/50" : "text-destructive"}>{eqItem.returned ? "—" : unpaidText}</strong></span>
                                <span>Paid: <strong className={eqItem.returned ? "text-success/50" : "text-success"}>₹{grandTotalPaid.toLocaleString("en-IN")}</strong></span>
                                <span>Bal: <strong className={
                                  eqItem.returned 
                                    ? outstanding > 0 
                                      ? "text-amber-600 dark:text-amber-400" 
                                      : "text-muted-foreground/40"
                                    : outstanding > 0 
                                      ? "text-destructive" 
                                      : "text-success"
                                }>₹{outstanding.toLocaleString("en-IN")}</strong></span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex justify-between items-center text-[12.5px] pt-1 px-1">
                        <span className="font-semibold text-slate-500">Total Outstanding Balance:</span>
                        <span className={`font-bold ${item.totalOutstanding > 0 ? "text-destructive" : "text-success"}`}>
                          ₹{item.totalOutstanding.toLocaleString("en-IN")}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <PayDialog
                          rental={r}
                          paymentsList={paymentsList}
                          eqInventory={eqInventory}
                          calcUnpaidDetailsForEquipment={calcUnpaidDetailsForEquipment}
                          getEquipmentName={getEquipmentName}
                          onPaid={() => setRefreshKey((k) => k + 1)}
                        />
                        <Button variant="outline" size="sm" className="h-7 text-[11px] px-2.5" onClick={() => toast.success(`WhatsApp reminder sent to ${r.customer}`)}>
                          <MessageCircle className="h-3.5 w-3.5" /> Remind
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}