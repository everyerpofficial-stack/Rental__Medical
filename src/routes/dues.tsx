import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
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
  MessageCircle, Mail, Phone, Bell, AlertTriangle, Clock,
  IndianRupee, TrendingDown, Calendar, CreditCard, CheckCircle2, Search, FileSpreadsheet, Download,
} from "lucide-react";
import { getRentals, getCustomers, getPayments, savePayment, formatDateDDMMYYYY, useDatabaseTrigger, getPaidForEquipment, getEquipment, getNextPaymentNumber, getLocalYYYYMMDD, parseLocalDate, getReturns, extractIdNumber, sortLatestFirst, downloadExcel } from "@/lib/data-store";

export const Route = createFileRoute("/dues")({
  head: () => ({ meta: [{ title: "Rent Dues — MediRent" }] }),
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
  const eqItems = rental?.equipmentItems || [
    {
      equipmentId: rental.equipmentId,
      serial: rental.serial,
      monthlyRent: Number(rental.monthlyRent) || 0,
      returned: false
    }
  ];

  const activeEqItems = useMemo(() => eqItems.filter((it: any) => !it.returned), [eqItems]);

  const [open, setOpen] = useState(false);
  const [selectedEqIds, setSelectedEqIds] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      const activeIds = activeEqItems.map((it: any) => it.equipmentId);
      setSelectedEqIds(activeIds.length > 0 ? activeIds : [eqItems[0]?.equipmentId].filter(Boolean));
    }
  }, [open, rental, activeEqItems, eqItems]);

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

  const payAmount = Number(manualPayAmount) || 0;
  const isMultiItem = selectedEqIds.length > 1;

  useEffect(() => {
    if (open) {
      const totalOutstanding = selectedItemsDetails.outstanding;
      setManualPayAmount(totalOutstanding.toString());
      setPaymentDate(getLocalYYYYMMDD());
      const cAmt = Math.round(totalOutstanding / 2);
      setCashAmount(cAmt.toString());
      setBankAmount((totalOutstanding - cAmt).toString());
    }
  }, [open, selectedEqIds, selectedItemsDetails.outstanding]);

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
        const outstanding = details.outstanding;
        const cAmt = Math.round(outstanding / 2);
        next[eqId] = {
          amount: outstanding.toString(),
          mode: "Bank",
          cashAmount: cAmt.toString(),
          bankAmount: (outstanding - cAmt).toString(),
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

  const handlePay = () => {
    if (!paymentDate) {
      toast.error("Please select a payment date.");
      return;
    }
    if (selectedEqIds.length === 0) {
      toast.error("Please select at least one equipment item.");
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

      if (paymentMode === "Cash+Bank") {
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
            notes: `${eqName}: Rent Payment (Cash portion of ₹${totalAmt.toLocaleString("en-IN")})`,
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
            txRef,
            notes: `${eqName}: Rent Payment (Bank portion of ₹${totalAmt.toLocaleString("en-IN")})`,
            status: "Paid" as const,
          });
        }
      } else {
        if (totalAmt > 0) {
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
            notes: `${eqName}: Rent Payment`,
            status: "Paid" as const,
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
        className="h-7 px-3 text-[11px] font-bold gap-1 bg-success hover:bg-success/90 text-white animate-[pulse_3s_infinite]"
        onClick={() => setOpen(true)}
      >
        <CreditCard className="h-3 w-3" /> Pay
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[90vh] flex flex-col p-6">
          <DialogHeader className="pb-2 border-b border-border/40">
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" /> Record Rent Payment
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto pr-1 py-3 my-1 space-y-3.5 max-h-[58vh]">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Select Equipment</Label>
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
                    className="text-[10px] text-primary font-bold hover:underline"
                  >
                    {selectedEqIds.length === activeEqItems.length ? "Select Single" : "Select All"}
                  </button>
                )}
              </div>
              <div className={`space-y-1.5 overflow-y-auto pr-1 border rounded-lg p-1.5 bg-background/50 ${isMultiItem ? "max-h-80" : "max-h-36"}`}>
                {eqItems.map((item: any) => {
                  const details = calcUnpaidDetailsForEquipment(rental, item.equipmentId);
                  const isReturned = !!item.returned;
                  const isChecked = !isReturned && selectedEqIds.includes(item.equipmentId);
                  return (
                    <div
                      key={item.equipmentId}
                      className={`flex items-start gap-2 p-1.5 rounded-md border transition-all ${
                        isReturned
                          ? "opacity-60 bg-muted/20 border-transparent cursor-not-allowed"
                          : isChecked
                          ? "border-primary/20 bg-primary/5 cursor-pointer hover:bg-muted/30"
                          : "border-transparent cursor-pointer hover:bg-muted/30"
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
                      {!isReturned ? (
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="mt-0.5 rounded border-muted text-primary focus:ring-primary h-3.5 w-3.5 pointer-events-none"
                        />
                      ) : (
                        <div className="w-3.5 h-3.5 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between font-medium text-[12px] leading-tight">
                          <span className="flex items-center gap-1.5 min-w-0">
                            <span className={`truncate ${item.returned ? "line-through text-muted-foreground/50" : ""}`}>
                              {getEquipmentName(item.equipmentId)}
                            </span>
                            {item.returned && (
                              <span className="inline-flex items-center rounded-md bg-success/8 px-1.5 py-0.5 text-[9px] font-bold text-success border border-success/15 shrink-0">
                                Returned
                              </span>
                            )}
                          </span>
                          <span className={`font-mono font-bold shrink-0 ${details.outstanding > 0 ? "text-destructive" : "text-success"}`}>
                            ₹{details.outstanding.toLocaleString("en-IN")}
                          </span>
                        </div>
                        <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5 leading-tight">
                          <span>
                            {item.serial ? `#${item.serial} • ` : ""}{details.rateText} • {item.returned ? "Returned" : details.unpaidText}
                          </span>
                          <span>Paid: ₹{details.grandTotalPaid.toLocaleString("en-IN")}</span>
                        </div>

                        {isMultiItem && isChecked && itemPayments[item.equipmentId] && (
                          <div
                            className="mt-2 space-y-1.5 border-t border-border/40 pt-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="grid grid-cols-2 gap-1.5">
                              <div className="space-y-0.5">
                                <Label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Amount (₹)</Label>
                                <Input
                                  type="number"
                                  value={itemPayments[item.equipmentId].amount}
                                  onChange={(e) => handleItemAmountChange(item.equipmentId, e.target.value)}
                                  className="h-7 text-[11px] bg-background font-semibold"
                                />
                              </div>
                              <div className="space-y-0.5">
                                <Label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Method</Label>
                                <Select
                                  value={itemPayments[item.equipmentId].mode}
                                  onValueChange={(m) => handleItemModeChange(item.equipmentId, m)}
                                >
                                  <SelectTrigger className="h-7 text-[11px]"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {["Cash", "Bank", "Cash+Bank"].map((m) => (
                                      <SelectItem key={m} value={m}>{m}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            {itemPayments[item.equipmentId].mode === "Cash+Bank" && (
                              <div className="grid grid-cols-2 gap-1.5 rounded-lg border border-border bg-muted/20 p-1.5">
                                <div className="space-y-0.5">
                                  <Label className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Cash (₹)</Label>
                                  <Input
                                    type="number"
                                    value={itemPayments[item.equipmentId].cashAmount}
                                    onChange={(e) => handleItemCashChange(item.equipmentId, e.target.value)}
                                    className="h-7 text-[11px] font-semibold bg-emerald-50/20"
                                  />
                                </div>
                                <div className="space-y-0.5">
                                  <Label className="text-[9px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">Bank (₹)</Label>
                                  <Input
                                    type="number"
                                    value={itemPayments[item.equipmentId].bankAmount}
                                    onChange={(e) => handleItemBankChange(item.equipmentId, e.target.value)}
                                    className="h-7 text-[11px] font-semibold bg-blue-50/20"
                                  />
                                </div>
                              </div>
                            )}

                            {itemPayments[item.equipmentId].mode !== "Cash" && (
                              <Input
                                placeholder="Txn ref (optional)"
                                value={itemPayments[item.equipmentId].txRef}
                                onChange={(e) => updateItemPayment(item.equipmentId, { txRef: e.target.value })}
                                className="h-7 text-[11px]"
                              />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-muted/30 rounded-lg p-2.5 text-[11px] space-y-1">
              <div className="flex justify-between">
                <span className="font-bold text-foreground">{rental.customer}</span>
                <span className="font-mono text-primary font-semibold">{rental.id}</span>
              </div>
              
              <div className="border-t border-border/40 my-1 pt-1 space-y-1">
                <div className="flex justify-between text-muted-foreground">
                  <span>Selected Items:</span>
                  <span className="font-semibold text-foreground">
                    {selectedEqIds.length} of {activeEqItems.length || eqItems.length}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Unpaid Duration:</span>
                  <span className="font-bold text-destructive">{selectedItemsDetails.unpaidText}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Total Paid to Date:</span>
                  <span className="font-semibold text-success">₹{selectedItemsDetails.grandTotalPaid.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Remaining Balance:</span>
                  <span className={`font-bold ${selectedItemsDetails.outstanding > 0 ? "text-destructive" : "text-success"}`}>
                    ₹{selectedItemsDetails.outstanding.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>

            {hasPayableItems ? (
              <>
                {isMultiItem ? (
                  <>
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-2 text-[11px] text-muted-foreground">
                      Set the amount and payment method for each item above. Multiple items selected — enter them separately per item.
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Payment Date</Label>
                      <Input
                        type="date"
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                        className="h-8.5 text-[12px] bg-background"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Amount to Pay (₹)</Label>
                        <Input
                          type="number"
                          placeholder="e.g. 500"
                          value={manualPayAmount}
                          onChange={(e) => handleAmountChange(e.target.value)}
                          className="h-8.5 text-[12px] bg-background font-semibold text-foreground"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Payment Date</Label>
                        <Input
                          type="date"
                          value={paymentDate}
                          onChange={(e) => setPaymentDate(e.target.value)}
                          className="h-8.5 text-[12px] bg-background"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Payment Method</Label>
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
                        <SelectTrigger className="h-8.5 text-[12px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["Cash", "Bank", "Cash+Bank"].map((m) => (
                            <SelectItem key={m} value={m}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {paymentMode === "Cash+Bank" && (
                      <div className="grid grid-cols-2 gap-2 p-2 bg-muted/20 rounded-lg border border-border">
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Cash Amount (₹)</Label>
                          <Input
                            type="number"
                            placeholder="Cash portion"
                            className="h-8 text-[12px] font-semibold bg-emerald-50/20"
                            value={cashAmount}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCashAmount(val);
                              const cNum = Math.max(0, Number(val) || 0);
                              setBankAmount(Math.max(0, payAmount - cNum).toString());
                            }}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">Bank Amount (₹)</Label>
                          <Input
                            type="number"
                            placeholder="Bank portion"
                            className="h-8 text-[12px] font-semibold bg-blue-50/20"
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
                      <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Transaction Reference (Optional)</Label>
                      <Input
                        placeholder="UPI txn ID, cheque no, etc."
                        value={txRef}
                        onChange={(e) => setTxRef(e.target.value)}
                        className="h-8.5 text-[12px]"
                      />
                    </div>
                  </>
                )}

                <div className="rounded-lg border border-success/20 bg-success/5 p-2 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-muted-foreground">Total Payable</span>
                  <span className="font-display text-[18px] font-bold text-success">
                    ₹{(isMultiItem ? multiItemTotal : payAmount).toLocaleString("en-IN")}
                  </span>
                </div>
              </>
            ) : (
              <div className="rounded-lg border border-success/20 bg-success/5 p-2 text-center text-success font-semibold text-[12px]">
                All selected items have been returned and are fully paid!
              </div>
            )}
          </div>
          
          <DialogFooter className="pt-2 border-t border-border/40 mt-1">
            <DialogClose asChild>
              <Button variant="outline" type="button" size="sm">Cancel</Button>
            </DialogClose>
            {hasPayableItems && (
              <Button type="button" onClick={handlePay} size="sm" className="gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> Confirm Payment
              </Button>
            )}
          </DialogFooter>
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

  const getOrdinalSuffix = (day: number) => {
    if (day > 3 && day < 21) return `${day}th`;
    switch (day % 10) {
      case 1:  return `${day}st`;
      case 2:  return `${day}nd`;
      case 3:  return `${day}rd`;
      default: return `${day}th`;
    }
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

    return { unpaidMonths, unpaidDays, outstanding, unpaidText, rateText, isMonthly, totalDue, grandTotalPaid };
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

      return {
        rental: r,
        totalOutstanding,
        totalPaid,
        start: r.start,
        id: r.id
      };
    });
    return sortLatestFirst(mapped, "start");
  }, [activeRentals, paymentsList]);

  // Group by start day-of-month ranges
  const due1To10List  = dueRentals.filter((item) => { const d = getStartDayOfMonth(item.start); return d >= 1  && d <= 10; });
  const due11To20List = dueRentals.filter((item) => { const d = getStartDayOfMonth(item.start); return d >= 11 && d <= 20; });
  const due21To31List = dueRentals.filter((item) => { const d = getStartDayOfMonth(item.start); return d >= 21 && d <= 31; });

  const [searchQuery, setSearchQuery] = useState("");
  const customersList = useMemo(() => getCustomers(), [dbVersion]);

  // Returns every phone number on file for a customer (primary + alternates),
  // so the dues table can stack them instead of showing just one.
  const getCustomerPhones = (customerId: string): string[] => {
    const cust: any = customersList.find((c: any) => c.id === customerId);
    if (!cust) return [];
    return [cust.phone, cust.altPhone, cust.contactNumber3]
      .map((p) => String(p || "").trim())
      .filter(Boolean);
  };

  const filteredRentals = dueRentals.filter((item) => {
    const r = item.rental;
    const q = searchQuery.toLowerCase().trim();
    const customer = customersList.find((c: any) => c.id === r.customerId);

    const matchesSearch = !q ||
      r.id.toLowerCase().includes(q) ||
      r.customer.toLowerCase().includes(q) ||
      String(r.equipment || "").toLowerCase().includes(q) ||
      String(r.serial || "").toLowerCase().includes(q) ||
      (r.equipmentItems && r.equipmentItems.some((ei: any) => String(ei.serial || "").toLowerCase().includes(q))) ||
      (customer && (
        String(customer.phone || "").toLowerCase().includes(q) ||
        String(customer.altPhone || "").toLowerCase().includes(q) ||
        String(customer.contactNumber3 || "").toLowerCase().includes(q) ||
        String(customer.area || "").toLowerCase().includes(q) ||
        String(customer.address || "").toLowerCase().includes(q)
      ));

    if (!matchesSearch) return false;

    if (activeTab === "all") return true;
    const day = getStartDayOfMonth(item.start);
    if (activeTab === "1-10")  return day >= 1  && day <= 10;
    if (activeTab === "11-20") return day >= 11 && day <= 20;
    if (activeTab === "21-31") return day >= 21 && day <= 31;
    return true;
  });

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
      icon: AlertTriangle,
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
      "Agreement ID",
      "Equipment",
      "Serial Number",
      "Start Date",
      "Billing Cycle Day",
      "Due Bracket",
      "Rent Rate (₹)",
      "Remaining Due (₹)",
      "Status"
    ];

    const rows = listToExport.map((item) => {
      const r = item.rental;
      const cust = customersList.find((c: any) => c.id === r.customerId);
      const custPhone = cust?.phone || r.phone || "";
      const day = getStartDayOfMonth(item.start);
      let dueBracket = "1-10 Days (1st–10th)";
      if (day >= 11 && day <= 20) dueBracket = "11-20 Days (11th–20th)";
      if (day >= 21 && day <= 31) dueBracket = "21-31 Days (21st–31st)";

      const eqItems = r.equipmentItems || [
        {
          equipmentId: r.equipmentId,
          serial: r.serial,
          monthlyRent: Number(r.monthlyRent) || 0,
        }
      ];

      const eqNames = eqItems.map((ei: any) => getEquipmentName(ei.equipmentId)).join(", ");
      const serials = eqItems.map((ei: any) => ei.serial || "XXXX").join(", ");
      const rates = eqItems.map((ei: any) => {
        const isMonthly = Number(ei.monthlyRent) > 0;
        const rate = isMonthly ? Number(ei.monthlyRent) : Number(ei.dailyRent || ei.rentRate || 0);
        return `₹${rate.toLocaleString("en-IN")}/${isMonthly ? "mo" : "day"}`;
      }).join(", ");

      const startDateFormatted = formatDateDDMMYYYY(r.start);
      const billingDayText = `Every ${day}${day === 1 ? "st" : day === 2 ? "nd" : day === 3 ? "rd" : "th"}`;

      return [
        r.customer || "Unknown",
        custPhone,
        r.id,
        eqNames || r.equipment || "Equipment",
        serials || r.serial || "N/A",
        startDateFormatted,
        billingDayText,
        dueBracket,
        rates,
        `₹${item.totalOutstanding.toLocaleString("en-IN")}`,
        r.status || "Active",
      ];
    });

    const tabLabel = activeTab === "all" ? "1-10_11-20_21-31" : activeTab === "1-10" ? "1-10_Days" : activeTab === "11-20" ? "11-20_Days" : "21-31_Days";
    const filename = `rent_due_statement_${tabLabel}_${getLocalYYYYMMDD()}.xls`;

    downloadExcel(filename, headers, rows, [180, 120, 130, 220, 140, 110, 130, 160, 140, 130, 100]);
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
                  <TableHead>Customer</TableHead>
                  <TableHead>Agreement</TableHead>
                  <TableHead>Equipment</TableHead>
                  <TableHead>Billing Day</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Unpaid Duration</TableHead>
                  <TableHead className="text-right text-success">Total Paid Amount</TableHead>
                  <TableHead className="text-right text-destructive">Remaining Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right w-36">Actions</TableHead>
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
                      <TableCell>
                        <p className="font-semibold text-[13px]">{r.customer}</p>
                        <p className="text-[10px] font-mono text-muted-foreground/70">{r.customerId}</p>
                        {getCustomerPhones(r.customerId).length > 0 && (
                          <div className="mt-1 space-y-0.5">
                            {getCustomerPhones(r.customerId).map((p, idx) => (
                              <p key={idx} className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                <Phone className="h-2.5 w-2.5 shrink-0" /> {p}
                              </p>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-md bg-primary/8 border border-primary/18 px-2 py-0.5 font-mono text-[11px] font-bold text-primary">
                          {r.id}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1.5">
                          {eqItems.map((eqItem: any) => {
                            const isReturned = eqItem.returned;
                            return (
                              <div key={eqItem.equipmentId} className="flex items-center gap-1.5 text-[12.5px]">
                                <span className={isReturned ? "line-through text-muted-foreground/50" : "text-foreground/80 font-medium"}>
                                  {getEquipmentName(eqItem.equipmentId)}
                                </span>
                                {isReturned && (
                                  <span className="inline-flex items-center rounded-md bg-success/8 px-1.5 py-0.5 text-[10px] font-bold text-success border border-success/15 shrink-0">
                                    Returned
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-[12.5px] font-medium text-foreground">
                          Every {getOrdinalSuffix(getStartDayOfMonth(r.start))}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-[12px] font-mono text-muted-foreground">
                          {formatDateDDMMYYYY(r.start)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="space-y-1.5 text-right">
                          {eqItems.map((eqItem: any) => {
                            const { rateText } = calcUnpaidDetailsForEquipment(r, eqItem.equipmentId);
                            return (
                              <div key={eqItem.equipmentId} className={`text-[12px] font-semibold ${eqItem.returned ? "text-muted-foreground/40 line-through" : "text-muted-foreground"}`}>
                                {rateText}
                              </div>
                            );
                          })}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="space-y-1.5 text-right">
                          {eqItems.map((eqItem: any) => {
                            const { unpaidText } = calcUnpaidDetailsForEquipment(r, eqItem.equipmentId);
                            return (
                              <div key={eqItem.equipmentId} className={`text-[12px] font-bold ${eqItem.returned ? "text-muted-foreground/40" : "text-destructive"}`}>
                                {eqItem.returned ? "—" : unpaidText}
                              </div>
                            );
                          })}
                        </div>
                      </TableCell>
                       <TableCell className="text-right">
                        <div className="space-y-1.5 text-right">
                          {eqItems.map((eqItem: any) => {
                            const { grandTotalPaid } = calcUnpaidDetailsForEquipment(r, eqItem.equipmentId);
                            return (
                              <div key={eqItem.equipmentId} className={`text-[12px] font-semibold ${eqItem.returned ? "text-success/50" : "text-success"}`}>
                                ₹{grandTotalPaid.toLocaleString("en-IN")}
                              </div>
                            );
                          })}
                          {eqItems.length > 1 && (
                            <div className="border-t border-border/40 mt-1.5 pt-1.5 text-right">
                              <span className="text-[9px] font-semibold text-muted-foreground block uppercase leading-none">Total Paid</span>
                              <span className="text-[12px] font-extrabold text-success">
                                ₹{item.totalPaid.toLocaleString("en-IN")}
                              </span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="space-y-1.5 text-right">
                          {eqItems.map((eqItem: any) => {
                            const { outstanding } = calcUnpaidDetailsForEquipment(r, eqItem.equipmentId);
                            return (
                              <div
                                key={eqItem.equipmentId}
                                className={`text-[12px] font-bold ${
                                  eqItem.returned 
                                    ? "text-muted-foreground/40 font-normal" 
                                    : outstanding > 0 
                                      ? "text-destructive" 
                                      : "text-success"
                                }`}
                              >
                                {eqItem.returned ? "—" : `₹${outstanding.toLocaleString("en-IN")}`}
                              </div>
                            );
                          })}
                          {eqItems.length > 1 && (
                            <div className="border-t border-border/40 mt-1.5 pt-1.5 text-right">
                              <span className="text-[9px] font-semibold text-muted-foreground block uppercase leading-none">Total Due</span>
                              <span className={`text-[12.5px] font-extrabold ${item.totalOutstanding > 0 ? "text-destructive" : "text-success"}`}>
                                ₹{item.totalOutstanding.toLocaleString("en-IN")}
                              </span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell><StatusBadge status={r.status} /></TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 transition-opacity">
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
                    <TableCell colSpan={11} className="py-10 text-center text-[13px] text-muted-foreground">
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
