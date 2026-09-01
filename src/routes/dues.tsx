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
  IndianRupee, TrendingDown, Calendar, CreditCard, CheckCircle2, Search, FileSpreadsheet, Download, Clock, AlertCircle,
} from "lucide-react";
import { getRentals, getCustomers, getPayments, savePayment, saveRental, saveReturn, formatDateDDMMYYYY, formatDateDDMMYY, useDatabaseTrigger, getPaidForEquipment, getEquipment, getNextPaymentNumber, getLocalYYYYMMDD, parseLocalDate, getReturns, extractIdNumber, sortLatestFirst, downloadExcel, formatEquipmentLabel, cleanNum } from "@/lib/data-store";

function countCommencedCycles(startDateStr: string, endDate: Date): number {
  const start = parseLocalDate(startDateStr);
  if (isNaN(start.getTime())) return 1;
  if (endDate < start) return 0;

  const startYear = start.getFullYear();
  const startMonth = start.getMonth();
  const startDay = start.getDate();

  const endYear = endDate.getFullYear();
  const endMonth = endDate.getMonth();
  const endDay = endDate.getDate();

  let monthDiff = (endYear - startYear) * 12 + (endMonth - startMonth);
  if (endDay >= startDay) {
    return monthDiff + 1;
  } else {
    return monthDiff;
  }
}

function isInitialRentPaidHelper(r: any, paymentsList: any[]): boolean {
  if (!r) return false;
  if (r.rentalPaymentStatus === "Paid" || Number(r.rentPaidAmount || 0) > 0) return true;
  const payments = paymentsList.filter((p: any) => p.agreementId === r.id);
  return payments.some(
    (p: any) =>
      p.paymentType === "Initial Rent" || String(p.notes || "").toLowerCase().includes("initial")
  );
}

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
  triggerClassName = "h-7 px-3 text-[11px]",
}: {
  rental: any;
  paymentsList: any[];
  eqInventory: any[];
  calcUnpaidDetailsForEquipment: (rental: any, eqId: string) => any;
  getEquipmentName: (eqId: string) => string;
  onPaid: () => void;
  triggerClassName?: string;
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

  interface ItemPaymentState {
    amount: string;
    discount?: string;
    discountType?: "one-time" | "permanent";
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
          discount: "",
          discountType: "one-time",
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

  const handleItemDiscountChange = (eqId: string, val: string) => {
    updateItemPayment(eqId, { discount: val });
  };

  const handleItemDiscountTypeChange = (eqId: string, type: "one-time" | "permanent") => {
    updateItemPayment(eqId, { discountType: type });
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

      // Group items by payment mode to save consolidated payment per mode
      const itemsToPay = selectedEqIds
        .map((eqId) => ({ eqId, state: itemPayments[eqId] }))
        .filter((it) => it.state && (Number(it.state.amount) > 0 || Number(it.state.discount) > 0));

      // Update permanent discounts in rental DB if any item has a permanent discount
      const permDiscountItems = itemsToPay.filter(
        (it) => it.state.discountType === "permanent" && (Number(it.state.discount) || 0) > 0
      );
      if (permDiscountItems.length > 0) {
        const rentalsList = getRentals();
        const rIdx = rentalsList.findIndex((r) => r.id === rental.id);
        if (rIdx > -1) {
          const uRental = { ...rentalsList[rIdx] };
          uRental.equipmentItems = (uRental.equipmentItems || []).map((item: any) => {
            const match = permDiscountItems.find((p) => p.eqId === item.equipmentId);
            if (match) {
              const dVal = Number(match.state.discount) || 0;
              const isMonthlyItem = item.rentCycle === "Monthly";
              if (isMonthlyItem) {
                item.monthlyRent = Math.max(0, (Number(item.monthlyRent) || 0) - dVal);
              } else {
                item.dailyRent = Math.max(0, (Number(item.dailyRent) || 0) - dVal);
              }
            }
            return item;
          });
          uRental.monthlyRent = uRental.equipmentItems.reduce((sum: number, it: any) => sum + (Number(it.monthlyRent) || 0), 0);
          uRental.dailyRent = uRental.equipmentItems.reduce((sum: number, it: any) => sum + (Number(it.dailyRent) || 0), 0);
          saveRental(uRental);
        }
      }

      const standardItems = itemsToPay.filter((it) => it.state.mode !== "Cash+Bank");
      const splitItems = itemsToPay.filter((it) => it.state.mode === "Cash+Bank");

      const modes = Array.from(new Set(standardItems.map((it) => it.state.mode)));
      modes.forEach((mode) => {
        const modeItems = standardItems.filter((it) => it.state.mode === mode);
        const totalModeAmt = modeItems.reduce((sum, it) => sum + (Number(it.state.amount) || 0), 0);
        const totalModeDisc = modeItems.reduce((sum, it) => sum + (Number(it.state.discount) || 0), 0);
        const eqNames = modeItems.map((it) => getEquipmentName(it.eqId)).join(", ");
        const eqIds = modeItems.map((it) => it.eqId).join(",");
        const txRefs = Array.from(new Set(modeItems.map((it) => it.state.txRef).filter(Boolean))).join(", ");

        savePayment({
          id: getNextPaymentNumber(),
          date: paymentDate,
          customer: rental.customer,
          customerId: rental.customerId,
          agreement: rental.id,
          equipmentId: eqIds,
          amount: totalModeAmt,
          mode: mode as any,
          type: "Rent" as const,
          txRef: txRefs,
          notes: `${eqNames}: Rent Payment${totalModeDisc > 0 ? ` [Discount of ₹${totalModeDisc} applied]` : ""}`,
          status: "Paid" as const,
          discount: totalModeDisc,
        });
      });

      splitItems.forEach((it) => {
        const amt = Number(it.state.amount) || 0;
        const itemDisc = Number(it.state.discount) || 0;
        const cAmt = Number(it.state.cashAmount) || 0;
        const bAmt = Number(it.state.bankAmount) || 0;
        const eqName = getEquipmentName(it.eqId);

        if (cAmt > 0) {
          savePayment({
            id: getNextPaymentNumber(),
            date: paymentDate,
            customer: rental.customer,
            customerId: rental.customerId,
            agreement: rental.id,
            equipmentId: it.eqId,
            amount: cAmt,
            mode: "Cash",
            type: "Rent" as const,
            notes: `${eqName}: Rent Payment (Cash portion of ₹${amt.toLocaleString("en-IN")})${itemDisc > 0 ? ` [Discount of ₹${itemDisc} applied]` : ""}`,
            status: "Paid" as const,
            discount: itemDisc,
          });
        }
        if (bAmt > 0) {
          savePayment({
            id: getNextPaymentNumber(),
            date: paymentDate,
            customer: rental.customer,
            customerId: rental.customerId,
            agreement: rental.id,
            equipmentId: it.eqId,
            amount: bAmt,
            mode: "Bank",
            type: "Rent" as const,
            txRef: it.state.txRef,
            notes: `${eqName}: Rent Payment (Bank portion of ₹${amt.toLocaleString("en-IN")})${itemDisc > 0 ? ` [Discount of ₹${itemDisc} applied]` : ""}`,
            status: "Paid" as const,
            discount: cAmt > 0 ? 0 : itemDisc,
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
        className={`${triggerClassName} font-bold gap-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs`}
        onClick={() => setOpen(true)}
      >
        <CreditCard className="h-3.5 w-3.5" /> Pay
      </Button>

            <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl lg:max-w-5xl w-[95vw] p-0 gap-0 border-border/60 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
          {/* Header Bar */}
          <div className="py-3 px-3 sm:px-5 border-b border-border/40 bg-gradient-to-r from-muted/30 via-background to-muted/20 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold shrink-0 border border-emerald-500/20">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground leading-snug">{rental.customer}</h3>
                <div className="text-[12px] text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-4 gap-y-0.5">
                  {customerInfo.phone && (
                    <span className="flex items-center gap-1 font-medium">
                      Contact: <span className="text-foreground/90 font-bold">{customerInfo.phone}</span>
                    </span>
                  )}
                  <span className="flex items-center gap-1.5 font-medium text-foreground/90">
                    <Calendar className="h-3.5 w-3.5 text-primary shrink-0" /> Rent Date: <span className="font-bold text-foreground font-mono bg-primary/10 px-2 py-0.5 rounded border border-primary/20">{formatDateDDMMYYYY(rental.start || rental.startDate || rental.rentStartDate || rental.agreementDate || rental.date)}</span>
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs font-medium">
              <div className="px-3.5 py-1.5 rounded-xl bg-background border border-border/60 text-right shadow-2xs">
                <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider block leading-tight">Total Due</span>
                <span className={`font-mono font-bold text-[15px] ${selectedItemsDetails.outstanding > 0 ? "text-destructive" : "text-emerald-600"}`}>
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

                  <div className="space-y-2">
                    {eqItems.map((item: any) => {
                      const details = calcUnpaidDetailsForEquipment(rental, item.equipmentId);
                      const isReturned = !!item.returned;
                      const isChecked = !isReturned && selectedEqIds.includes(item.equipmentId);

                      // Find last payment details for this equipment (sorted latest first)
                      const cleanAgrId = (val: any) => String(val || "").trim().toUpperCase().replace(/^AGR-/i, "");
                      const rAgrId = cleanAgrId(rental.id || rental.agreementNumber || rental.agreementId);

                      const itemPrevPayments = (paymentsList || []).filter((p: any) => {
                        const pAgrId = cleanAgrId(p.agreement || p.agreementId || p.rentalId);
                        if (!pAgrId || pAgrId !== rAgrId) return false;
                        if (p.status === "Cancelled" || p.status === "Void") return false;
                        
                        if (eqItems.length === 1) return true;
                        
                        if (!p.equipmentId) {
                          if (p.notes && eqItems.some((it: any) => it.serial && String(p.notes).toLowerCase().includes(String(it.serial).toLowerCase()))) {
                            return item.serial && String(p.notes).toLowerCase().includes(String(item.serial).toLowerCase());
                          }
                          return true;
                        }
                        
                        const eqIds = String(p.equipmentId).split(",").map(s => s.trim().toLowerCase());
                        const targetEqId = String(item.equipmentId || "").trim().toLowerCase();
                        const targetSerial = String(item.serial || "").trim().toLowerCase();
                        
                        if (eqIds.includes(targetEqId)) return true;
                        if (targetSerial && eqIds.includes(targetSerial)) return true;
                        
                        if (p.notes) {
                          const notesLower = String(p.notes).toLowerCase();
                          if (targetSerial && notesLower.includes(targetSerial)) return true;
                          if (targetEqId && notesLower.includes(targetEqId)) return true;
                        }
                        
                        return false;
                      });

                      const sortedPrevPayments = [...itemPrevPayments].sort((a: any, b: any) => {
                        const tA = new Date(a.date).getTime() || 0;
                        const tB = new Date(b.date).getTime() || 0;
                        if (tB !== tA) return tB - tA;
                        return String(b.id || "").localeCompare(String(a.id || ""), undefined, { numeric: true });
                      });

                      let lastPayment = sortedPrevPayments.length > 0 ? sortedPrevPayments[0] : null;

                      if (!lastPayment && (rental.rentalPaymentStatus === "Paid" || rental.rentalPaymentStatus === "Partial" || cleanNum(rental.rentPaidAmount) > 0)) {
                        const initAmt = cleanNum(rental.rentPaidAmount) || cleanNum(rental.monthlyRent);
                        if (initAmt > 0) {
                          lastPayment = {
                            amount: initAmt,
                            date: rental.start || rental.createdAt || rental.date,
                            mode: rental.paymentMode || rental.rentPaymentMode || "Advance",
                          };
                        }
                      }

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

                              <div className="flex flex-wrap items-center gap-2 text-[11.5px] mt-1.5">
                                {item.serial && (
                                  <span className="font-mono bg-background px-2 py-0.5 rounded border border-border/70 text-[11px] text-foreground font-semibold">
                                    S/N: {item.serial}
                                  </span>
                                )}
                                <span className="font-semibold text-foreground/90">{details.rateText}</span>
                                <span className="text-muted-foreground">•</span>
                                <span className="font-medium text-muted-foreground">{item.returned ? "Returned" : details.unpaidText}</span>
                                <span className="text-muted-foreground">•</span>
                                <span className="text-emerald-600 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 text-[11px]">Paid: ₹{details.grandTotalPaid.toLocaleString("en-IN")}</span>
                              </div>

                              {/* Last Payment Details */}
                              <div className="mt-2 flex items-center">
                                {lastPayment ? (
                                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-700 dark:text-blue-400 bg-blue-50/90 dark:bg-blue-950/50 px-2.5 py-1 rounded-md border border-blue-200/80 dark:border-blue-800/60 shadow-2xs">
                                    <Clock className="h-3.5 w-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
                                    Last Payment: <strong>₹{(cleanNum(lastPayment.amount) || 0).toLocaleString("en-IN")}</strong> on {formatDateDDMMYYYY(lastPayment.date)} ({lastPayment.mode || "Cash"})
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 text-[10.5px] font-medium text-muted-foreground/80 bg-muted/40 px-2.5 py-0.5 rounded-md border border-border/40">
                                    <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                                    Last Payment: None recorded
                                  </span>
                                )}
                              </div>

                              {isMultiItem && isChecked && itemPayments[item.equipmentId] && (
                                <div
                                  className="mt-3 pt-3 border-t border-border/40 space-y-2.5"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                                    <div className="sm:col-span-4 space-y-1">
                                      <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Amount (₹)</Label>
                                      <Input
                                        type="number"
                                        value={itemPayments[item.equipmentId].amount}
                                        onChange={(e) => handleItemAmountChange(item.equipmentId, e.target.value)}
                                        className="h-8 text-[12px] bg-background font-semibold"
                                      />
                                    </div>
                                    <div className="sm:col-span-5 space-y-1">
                                      <div className="flex items-center justify-between">
                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Discount (₹)</Label>
                                        <div className="flex gap-0.5 bg-muted/60 p-0.5 rounded border border-border/50">
                                          <button
                                            type="button"
                                            onClick={() => handleItemDiscountTypeChange(item.equipmentId, "one-time")}
                                            className={`px-1.5 py-1.5 text-[11px] font-bold rounded transition-all ${
                                              (itemPayments[item.equipmentId].discountType || "one-time") === "one-time"
                                                ? "bg-emerald-600 text-white shadow-xs"
                                                : "text-muted-foreground hover:text-foreground"
                                            }`}
                                          >
                                            One-Time
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleItemDiscountTypeChange(item.equipmentId, "permanent")}
                                            className={`px-1.5 py-1.5 text-[11px] font-bold rounded transition-all ${
                                              itemPayments[item.equipmentId].discountType === "permanent"
                                                ? "bg-emerald-600 text-white shadow-xs"
                                                : "text-muted-foreground hover:text-foreground"
                                            }`}
                                          >
                                            Perm
                                          </button>
                                        </div>
                                      </div>
                                      <Input
                                        type="number"
                                        placeholder="0"
                                        value={itemPayments[item.equipmentId].discount || ""}
                                        onChange={(e) => handleItemDiscountChange(item.equipmentId, e.target.value)}
                                        className="h-8 text-[12px] bg-background font-semibold border-emerald-500/30"
                                      />
                                    </div>
                                    <div className="sm:col-span-3 space-y-1">
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
                                      className={`flex-1 py-1.5 px-1 rounded text-[11px] font-bold border transition-all text-center leading-tight ${
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
                                      className={`flex-1 py-1.5 px-1 rounded text-[11px] font-bold border transition-all text-center leading-tight ${
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

// ─── Pay Return Due Dialog ───────────────────────────────────────────────────
function PayReturnDueDialog({
  ret,
  onPaid,
  triggerClassName = "h-7 px-3 text-[11px]",
}: {
  ret: any;
  onPaid: () => void;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const totalCollectible = Math.abs(ret.refund || 0);
  const existingPaid = ret.duePaidAmount !== undefined 
    ? ret.duePaidAmount 
    : (ret.duePaymentStatus === "Paid" ? totalCollectible : 0);
  const currentPending = ret.duePendingBalance !== undefined 
    ? ret.duePendingBalance 
    : Math.max(0, totalCollectible - existingPaid);

  const prevOpenRef = useRef(false);
  const [payAmount, setPayAmount] = useState(currentPending.toString());
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [paymentDate, setPaymentDate] = useState(() => getLocalYYYYMMDD());
  const [txRef, setTxRef] = useState("");
  const [cashAmount, setCashAmount] = useState("");
  const [bankAmount, setBankAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open && !prevOpenRef.current) {
      setIsSubmitting(false);
      const pending = ret.duePendingBalance !== undefined 
        ? ret.duePendingBalance 
        : Math.max(0, totalCollectible - (ret.duePaidAmount !== undefined ? ret.duePaidAmount : (ret.duePaymentStatus === "Paid" ? totalCollectible : 0)));
      setPayAmount(pending.toString());
      setPaymentMode("Cash");
      setPaymentDate(getLocalYYYYMMDD());
      setTxRef("");
      const cAmt = Math.round(pending / 2);
      setCashAmount(cAmt.toString());
      setBankAmount((pending - cAmt).toString());
    }
    prevOpenRef.current = open;
  }, [open, ret, totalCollectible]);

  const handlePayDue = () => {
    const amt = Number(payAmount) || 0;
    if (amt <= 0) {
      toast.error("Please enter a valid payment amount.");
      return;
    }
    setIsSubmitting(true);
    
    if (paymentMode === "Cash+Bank") {
      let cAmt = Number(cashAmount) || 0;
      let bAmt = Number(bankAmount) || 0;
      if (cAmt + bAmt !== amt) {
        bAmt = Math.max(0, amt - cAmt);
      }
      if (cAmt > 0) {
        savePayment({
          id: getNextPaymentNumber(),
          date: paymentDate,
          customer: ret.customer,
          customerId: ret.customerId || "",
          agreement: ret.agreement,
          amount: cAmt,
          mode: "Cash",
          type: "Rent" as const,
          notes: `Return Due Settlement (Cash portion) for Return ${ret.id} (${ret.equipment})`,
          status: "Paid" as const,
        });
      }
      if (bAmt > 0) {
        savePayment({
          id: getNextPaymentNumber(),
          date: paymentDate,
          customer: ret.customer,
          customerId: ret.customerId || "",
          agreement: ret.agreement,
          amount: bAmt,
          mode: "Bank",
          type: "Rent" as const,
          txRef,
          notes: `Return Due Settlement (Bank portion) for Return ${ret.id} (${ret.equipment})`,
          status: "Paid" as const,
        });
      }
    } else {
      savePayment({
        id: getNextPaymentNumber(),
        date: paymentDate,
        customer: ret.customer,
        customerId: ret.customerId || "",
        agreement: ret.agreement,
        amount: amt,
        mode: paymentMode as any,
        type: "Rent" as const,
        txRef,
        notes: `Return Due Settlement for Return ${ret.id} (${ret.equipment})`,
        status: "Paid" as const,
      });
    }

    const newTotalPaid = existingPaid + amt;
    const newRemainingPending = Math.max(0, totalCollectible - newTotalPaid);
    const newStatus = newRemainingPending <= 0 ? "Paid" : "Partial";

    const updatedReturn = {
      ...ret,
      duePaymentStatus: newStatus,
      duePaymentMode: paymentMode,
      dueTxRef: txRef,
      duePaidAmount: newTotalPaid,
      duePendingBalance: newRemainingPending,
      status: newRemainingPending <= 0 ? "Completed" : ret.status,
    };
    saveReturn(updatedReturn);

    toast.success(`₹${amt.toLocaleString("en-IN")} payment recorded for Return ${ret.id}! Remaining due: ₹${newRemainingPending.toLocaleString("en-IN")}.`);
    setIsSubmitting(false);
    setOpen(false);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("medirent-db-updated"));
    }
    onPaid();
  };

  return (
    <>
      <Button
        size="sm"
        className={`${triggerClassName} font-bold gap-1 bg-amber-600 hover:bg-amber-700 text-white shadow-xs`}
        onClick={() => setOpen(true)}
      >
        <CreditCard className="h-3.5 w-3.5" /> Pay Due
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg w-[95vw] p-0 border-border/60 shadow-2xl overflow-hidden">
          <div className="py-3 px-3 sm:px-5 border-b border-border/40 bg-gradient-to-r from-amber-500/10 via-background to-amber-500/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shrink-0 border border-amber-500/20">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground leading-snug">{ret.customer}</h3>
                <p className="text-[11.5px] text-muted-foreground mt-0.5 font-mono">
                  Return Due ({ret.id}) — Agr: {ret.agreement}
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold text-amber-800 dark:text-amber-300 tracking-wider">Equipment Returned</p>
                <p className="text-[12.5px] font-bold text-foreground mt-0.5">{ret.equipment}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Pending Due</p>
                <p className="text-base font-mono font-bold text-amber-600 dark:text-amber-400">
                  ₹{currentPending.toLocaleString("en-IN")}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Amount to Collect (₹)</Label>
                <Input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="h-9 text-[13px] font-bold bg-background"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Payment Date</Label>
                  <Input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="h-9 text-[12px] bg-background"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Payment Mode</Label>
                  <Select value={paymentMode} onValueChange={setPaymentMode}>
                    <SelectTrigger className="h-9 text-[12px] bg-background"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["Cash", "Bank", "Cash+Bank"].map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {paymentMode === "Cash+Bank" && (
                <div className="grid grid-cols-2 gap-2 p-2 bg-background rounded-lg border border-border">
                  <div className="space-y-0.5">
                    <Label className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Cash (₹)</Label>
                    <Input
                      type="number"
                      className="h-7 text-[11px] font-semibold bg-emerald-50/20"
                      value={cashAmount}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCashAmount(val);
                        const cNum = Math.max(0, Number(val) || 0);
                        setBankAmount(Math.max(0, (Number(payAmount) || 0) - cNum).toString());
                      }}
                    />
                  </div>
                  <div className="space-y-0.5">
                    <Label className="text-[9px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">Bank (₹)</Label>
                    <Input
                      type="number"
                      className="h-7 text-[11px] font-semibold bg-blue-50/20"
                      value={bankAmount}
                      onChange={(e) => {
                        const val = e.target.value;
                        setBankAmount(val);
                        const bNum = Math.max(0, Number(val) || 0);
                        setCashAmount(Math.max(0, (Number(payAmount) || 0) - bNum).toString());
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Txn Reference (Optional)</Label>
                <Input
                  placeholder="UPI txn ID, cheque no, etc."
                  value={txRef}
                  onChange={(e) => setTxRef(e.target.value)}
                  className="h-8 text-[12px] bg-background"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-border/40">
              <DialogClose asChild className="flex-1">
                <Button variant="outline" type="button" className="h-9 text-[12px] font-semibold">Cancel</Button>
              </DialogClose>
              <Button
                type="button"
                onClick={handlePayDue}
                disabled={isSubmitting}
                className="flex-1 h-9 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[12px] gap-1.5 shadow-sm disabled:opacity-60"
              >
                <CheckCircle2 className="h-4 w-4" /> {isSubmitting ? "Processing..." : "Confirm Return Due Payment"}
              </Button>
            </div>
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
  const returnsList = useMemo(() => getReturns(), [dbVersion]);

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
        rate: 0,
        duePerDay: 0,
        daysTillToday: 0,
        dueTillToday: 0,
        balanceAsOfToday: 0
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

    // Count paid amount from payment records using getPaidForEquipment helper, including initial advance payment
    const grandTotalPaid = getPaidForEquipment(rental, eqId, paymentsList, false);

    let unpaidMonths = 0;
    let unpaidDays = 0;
    let outstanding = 0;
    let unpaidText = "";
    let rateText = "";
    let totalDue = 0;

    // Check if the item has been returned, and find its return date and pending return due
    let billingEndDate = today;
    let returnDueOutstanding = 0;
    if (item?.returned) {
      const returns = getReturns();
      const ret = returns.find(
        (r: any) => r.agreement === rental.id && (r.returnedEquipmentIds?.includes(eqId) || (!r.returnedEquipmentIds && rental.equipmentItems?.length === 1))
      );
      if (ret) {
        if (ret.date) {
          const parsedReturn = parseLocalDate(ret.date);
          if (!isNaN(parsedReturn.getTime())) {
            billingEndDate = parsedReturn;
          }
        }
        if (ret.refund < 0) {
          const totalCollectible = Math.abs(ret.refund);
          const paidAmt = ret.duePaidAmount !== undefined 
            ? ret.duePaidAmount 
            : (ret.duePaymentStatus === "Paid" ? totalCollectible : 0);
          const pendingDue = ret.duePendingBalance !== undefined 
            ? ret.duePendingBalance 
            : Math.max(0, totalCollectible - paidAmt);
          if (pendingDue > 0 && ret.duePaymentStatus !== "Paid") {
            returnDueOutstanding = pendingDue;
          }
        }
      }
    }

    if (isMonthly) {
      const cyclesCommenced = countCommencedCycles(rental.start, billingEndDate);
      totalDue = cyclesCommenced * monthlyRent;
      
      outstanding = item?.returned ? returnDueOutstanding : Math.max(0, totalDue - grandTotalPaid);
      unpaidMonths = monthlyRent > 0 ? Math.round(outstanding / monthlyRent) : 0;
      unpaidText = item?.returned ? (returnDueOutstanding > 0 ? "Return Due" : "—") : (outstanding <= 0 ? "0m" : `${unpaidMonths}m`);
      rateText = `₹${monthlyRent.toLocaleString("en-IN")}/mo`;
    } else {
      // Daily billing: calculate purely by days elapsed
      const diffTime = Math.max(0, billingEndDate.getTime() - start.getTime());
      const daysElapsed = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      totalDue = daysElapsed * dailyRate;
      
      outstanding = item?.returned ? returnDueOutstanding : Math.max(0, totalDue - grandTotalPaid);
      unpaidDays = dailyRate > 0 ? Math.round(outstanding / dailyRate) : 0;
      unpaidMonths = 0;
      unpaidText = item?.returned ? (returnDueOutstanding > 0 ? "Return Due" : "—") : `${unpaidDays}d`;
      rateText = `₹${dailyRate.toLocaleString("en-IN")}/day`;
    }

    const rate = isMonthly ? monthlyRent : dailyRate;
    const duePerDay = item?.returned ? 0 : (isMonthly ? Math.round(monthlyRent / 30) : dailyRate);

    // Calculate days elapsed in current cycle and daily due accumulated till today
    let daysTillToday = 0;
    let dueTillToday = 0;

    if (!item?.returned) {
      if (isMonthly) {
        const startDay = start.getDate();
        let cYear = today.getFullYear();
        let cMonth = today.getMonth();
        if (today.getDate() < startDay) {
          cMonth -= 1;
          if (cMonth < 0) {
            cMonth = 11;
            cYear -= 1;
          }
        }
        const maxDays = new Date(cYear, cMonth + 1, 0).getDate();
        const actualDay = Math.min(startDay, maxDays);
        const cycleStart = new Date(cYear, cMonth, actualDay);
        const diffMs = Math.max(0, today.getTime() - cycleStart.getTime());
        daysTillToday = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const dailyRentRate = monthlyRent / 30;
        dueTillToday = Math.round(daysTillToday * dailyRentRate);
      } else {
        const diffMs = Math.max(0, today.getTime() - start.getTime());
        daysTillToday = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        dueTillToday = daysTillToday * dailyRate;
      }
    }

    let balanceAsOfToday = outstanding;
    if (!item?.returned && isMonthly) {
      const cyclesCommenced = countCommencedCycles(rental.start, billingEndDate);
      const completedDue = Math.max(0, cyclesCommenced - 1) * monthlyRent;
      const totalDueAsOfToday = completedDue + dueTillToday;
      balanceAsOfToday = Math.max(0, totalDueAsOfToday - grandTotalPaid);
    }

    return { unpaidMonths, unpaidDays, outstanding, unpaidText, rateText, isMonthly, totalDue, grandTotalPaid, rate, duePerDay, daysTillToday, dueTillToday, balanceAsOfToday };
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

  const cleanEqName = (str: string) => {
    if (!str) return "";
    return str.replace(/\s*-\s*S\/N:.*$/i, "").replace(/\s*S\/N:.*$/i, "").trim();
  };

  const getReturnEquipmentLabel = (ret: any): string[] => {
    const ids: string[] = Array.isArray(ret.returnedEquipmentIds) ? ret.returnedEquipmentIds : [];
    if (ids.length > 0) {
      const labels = ids
        .map((id) => {
          const eq = equipmentById.get(id) || eqInventory.find((e: any) => e.id === id);
          if (!eq) return "";
          return cleanEqName(formatEquipmentLabel(eq, false));
        })
        .filter(Boolean);
      if (labels.length > 0) return labels;
    }

    const rental = rentalsList.find((r: any) => r.id === ret.agreement);
    if (rental) {
      const eqItems = rental.equipmentItems || [];
      if (eqItems.length > 0) {
        const labels = eqItems
          .map((ei: any) => {
            const eq = equipmentById.get(ei.equipmentId);
            const name = ei.name || ei.equipment || getEquipmentName(ei.equipmentId);
            const model = ei.model || eq?.model || (eqItems.length === 1 ? rental.model : undefined);
            return cleanEqName(formatEquipmentLabel({ name, model, serial: "" }, false));
          })
          .filter(Boolean);
        if (labels.length > 0) return labels;
      } else if (rental.equipmentId || rental.equipment) {
        const eq = equipmentById.get(rental.equipmentId);
        const name = rental.equipment || getEquipmentName(rental.equipmentId);
        const model = rental.model || eq?.model;
        const formatted = cleanEqName(formatEquipmentLabel({ name, model, serial: "" }, false));
        if (formatted) return [formatted];
      }
    }

    const rawEqStr = ret.equipment || "";
    if (rawEqStr) {
      const matchEq = eqInventory.find((e: any) => e.name && rawEqStr.toLowerCase().includes(e.name.toLowerCase()));
      if (matchEq && matchEq.model && !rawEqStr.toLowerCase().includes(matchEq.model.toLowerCase())) {
        return [cleanEqName(formatEquipmentLabel({ name: rawEqStr, model: matchEq.model, serial: "" }, false))];
      }
    }

    return [cleanEqName(rawEqStr || "Equipment")];
  };

  // ─── Calculate Return Dues ──────────────────────────────────────────────────
  const pendingReturnDues = useMemo(() => {
    const seen = new Set<string>();
    const unique = returnsList.filter((ret: any) => {
      if (!ret?.id || seen.has(ret.id)) return false;
      seen.add(ret.id);
      return true;
    });

    return unique.filter((ret: any) => {
      if (ret.refund >= 0) return false;
      const totalDue = Math.abs(ret.refund);
      const paidAmt = ret.duePaidAmount !== undefined 
        ? ret.duePaidAmount 
        : (ret.duePaymentStatus === "Paid" ? totalDue : 0);
      const pendingDue = ret.duePendingBalance !== undefined 
        ? ret.duePendingBalance 
        : Math.max(0, totalDue - paidAmt);
      const status = ret.duePaymentStatus === "Paid" || pendingDue <= 0
        ? "Paid"
        : (paidAmt > 0 ? "Partial" : "Not Paid");
      return status !== "Paid" && pendingDue > 0;
    }).map((ret: any) => {
      const totalDue = Math.abs(ret.refund);
      const paidAmt = ret.duePaidAmount !== undefined 
        ? ret.duePaidAmount 
        : (ret.duePaymentStatus === "Paid" ? totalDue : 0);
      const pendingDue = ret.duePendingBalance !== undefined 
        ? ret.duePendingBalance 
        : Math.max(0, totalDue - paidAmt);
      const status = ret.duePaymentStatus === "Paid" || pendingDue <= 0
        ? "Paid"
        : (paidAmt > 0 ? "Partial" : "Not Paid");

      const eqLabels = getReturnEquipmentLabel(ret);
      const rental = rentalsList.find((r: any) => r.id === ret.agreement);
      const rentDateStr = rental?.start || ret.date || "";
      let rentRateText = "—";

      if (rental) {
        const ids: string[] = Array.isArray(ret.returnedEquipmentIds) ? ret.returnedEquipmentIds : [];
        const allEqItems = rental.equipmentItems || [];
        const targetEqItems = ids.length > 0
          ? allEqItems.filter((ei: any) => ids.includes(ei.equipmentId))
          : (allEqItems.length === 1 ? allEqItems : allEqItems);

        if (targetEqItems.length > 0) {
          const monthlySum = targetEqItems.reduce((acc: number, ei: any) => acc + (Number(ei.monthlyRent || ei.rentRate) || 0), 0);
          const dailySum = targetEqItems.reduce((acc: number, ei: any) => acc + (Number(ei.dailyRent) || 0), 0);
          if (monthlySum > 0) rentRateText = `₹${monthlySum.toLocaleString("en-IN")}/mo`;
          else if (dailySum > 0) rentRateText = `₹${dailySum.toLocaleString("en-IN")}/day`;
        }
        if (rentRateText === "—" && rental.monthlyRent && allEqItems.length <= 1) {
          rentRateText = `₹${Number(rental.monthlyRent).toLocaleString("en-IN")}/mo`;
        }
      }

      return {
        isReturnDue: true as const,
        returnObj: ret,
        id: ret.id,
        agreementId: ret.agreement,
        customer: ret.customer,
        customerId: ret.customerId || "",
        equipmentLabels: eqLabels,
        equipment: eqLabels.join(", "),
        date: ret.date,
        rentDate: rentDateStr,
        rentRateText,
        deposit: Number(ret.deposit || 0),
        totalDue,
        totalPaid: paidAmt,
        totalOutstanding: pendingDue,
        status,
        start: rentDateStr || ret.date,
      };
    });
  }, [returnsList, rentalsList, equipmentById, eqInventory]);

  // Combine Active Rent Dues + Return Dues
  const combinedDues = useMemo(() => {
    const activeRows = dueRentals.map((d) => ({
      isReturnDue: false as const,
      rental: d.rental,
      totalOutstanding: d.totalOutstanding,
      totalPaid: d.totalPaid,
      start: d.start,
      id: d.id,
      openItems: d.openItems,
      customer: d.rental.customer,
      customerId: d.rental.customerId,
    }));

    const returnRows = pendingReturnDues.map((r) => ({
      isReturnDue: true as const,
      returnObj: r.returnObj,
      totalOutstanding: r.totalOutstanding,
      totalPaid: r.totalPaid,
      start: r.start,
      id: r.id,
      agreementId: r.agreementId,
      customer: r.customer,
      customerId: r.customerId,
      equipmentLabels: r.equipmentLabels,
      equipment: r.equipment,
      date: r.date,
      rentDate: r.rentDate,
      rentRateText: r.rentRateText,
      deposit: r.deposit,
      totalDue: r.totalDue,
      status: r.status,
    }));

    return [...activeRows, ...returnRows].sort((a, b) => {
      if (a.totalOutstanding !== b.totalOutstanding) return b.totalOutstanding - a.totalOutstanding;
      return extractIdNumber(b.id) - extractIdNumber(a.id);
    });
  }, [dueRentals, pendingReturnDues]);

  // Group by start day-of-month ranges for active rent dues
  const due1To10List  = dueRentals.filter((item) => { const d = getStartDayOfMonth(item.start); return d >= 1  && d <= 10; });
  const due11To20List = dueRentals.filter((item) => { const d = getStartDayOfMonth(item.start); return d >= 11 && d <= 20; });
  const due21To31List = dueRentals.filter((item) => { const d = getStartDayOfMonth(item.start); return d >= 21 && d <= 31; });

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const customersList = useMemo(() => getCustomers(), [dbVersion]);
  const customersById = useMemo(
    () => new Map<string, any>(customersList.map((c: any) => [c.id, c])),
    [customersList]
  );

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

    const wordStartsWith = (text: unknown, token: string) => {
      if (!text) return false;
      return String(text)
        .toLowerCase()
        .split(/[\s,./\()-]+/)
        .filter(Boolean)
        .some((w) => w.startsWith(token));
    };

    return combinedDues.filter((item) => {
      const customer = customersById.get(item.customerId);

      const matchesSearch = !q || tokens.every((token) => {
        const tokenDigits = token.replace(/\D/g, "");

        if (wordStartsWith(item.customer, token)) return true;

        const idLower = String(item.id || "").toLowerCase();
        if (idLower.startsWith(token) || (tokenDigits.length >= 2 && idLower.includes(tokenDigits))) return true;

        if (item.isReturnDue) {
          const agrLower = String(item.agreementId || "").toLowerCase();
          if (agrLower.startsWith(token) || (tokenDigits.length >= 2 && agrLower.includes(tokenDigits))) return true;
          if (wordStartsWith(item.equipment, token)) return true;
        } else {
          const r = item.rental;
          if (String(r.serial || "").toLowerCase().includes(token)) return true;
          if (Array.isArray(r.equipmentItems) && r.equipmentItems.some((ei: any) => String(ei.serial || "").toLowerCase().includes(token))) return true;
          if (wordStartsWith(r.equipment, token)) return true;
        }

        if (customer) {
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
      if (activeTab === "returns") return item.isReturnDue;

      const day = getStartDayOfMonth(item.start);
      if (activeTab === "1-10")  return day >= 1  && day <= 10;
      if (activeTab === "11-20") return day >= 11 && day <= 20;
      if (activeTab === "21-31") return day >= 21 && day <= 31;
      return true;
    });
  }, [combinedDues, debouncedSearch, activeTab, customersById]);

  const severityBuckets = [
    {
      l: "Return Dues (Pending)",
      v: formatRupee(pendingReturnDues.reduce((sum, item) => sum + item.totalOutstanding, 0)),
      n: `${pendingReturnDues.length} return agreement(s) due`,
      icon: AlertCircle,
      iconColor: "text-amber-600 dark:text-amber-400",
      alert: pendingReturnDues.length > 0,
    },
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

  const getPaymentDueStatus = (r: any, totalOutstanding: number) => {
    if (!r?.start) return "Paid";
    const startDate = parseLocalDate(r.start);
    if (isNaN(startDate.getTime())) return "Paid";

    const dayOfMonth = startDate.getDate();
    const eqItems = r.equipmentItems || [
      {
        equipmentId: r.equipmentId,
        monthlyRent: Number(r.monthlyRent) || 0,
        dailyRent: Number(r.dailyRent) || 0,
        returned: false
      }
    ];

    const activeMonthlyItems = eqItems.filter(
      (it: any) => !it.returned && Number(it.monthlyRent || it.rentRate) > 0
    );
    const totalMonthlyRent = activeMonthlyItems.reduce(
      (sum: number, it: any) => sum + (Number(it.monthlyRent || it.rentRate) || 0),
      0
    );

    const now = new Date();
    const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const currentYear = todayDate.getFullYear();
    const currentMonth = todayDate.getMonth();

    const maxDayThisMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const cycleDayThisMonth = Math.min(dayOfMonth, maxDayThisMonth);
    const currentCycleDate = new Date(currentYear, currentMonth, cycleDayThisMonth);

    const nextMonth = currentMonth + 1;
    const nextMonthYear = nextMonth > 11 ? currentYear + 1 : currentYear;
    const nextMonthNormalized = nextMonth % 12;
    const maxDayNextMonth = new Date(nextMonthYear, nextMonthNormalized + 1, 0).getDate();
    const cycleDayNextMonth = Math.min(dayOfMonth, maxDayNextMonth);
    const nextCycleDate = new Date(nextMonthYear, nextMonthNormalized, cycleDayNextMonth);

    const formatShortDate = (d: Date) => {
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yy = String(d.getFullYear()).slice(-2);
      return `${dd}-${mm}-${yy}`;
    };

    const currentCycleStr = formatShortDate(currentCycleDate);
    const nextCycleStr = formatShortDate(nextCycleDate);

    if (totalMonthlyRent <= 0) {
      return `${totalOutstanding}/- due`;
    }

    const m1 = Math.max(0, (currentCycleDate.getFullYear() - startDate.getFullYear()) * 12 + (currentCycleDate.getMonth() - startDate.getMonth()));
    const m2 = m1 + 1;

    let totalPaid = 0;
    eqItems.forEach((ei: any) => {
      totalPaid += getPaidForEquipment(r, ei.equipmentId, paymentsList, false);
    });

    const currentBilled = m1 * totalMonthlyRent;
    const nextBilled = m2 * totalMonthlyRent;

    const currentDue = Math.max(0, currentBilled - totalPaid);
    const nextDue = Math.max(0, nextBilled - totalPaid);

    const initialPaid = isInitialRentPaidHelper(r, paymentsList);
    const monthsPaid = totalMonthlyRent > 0 ? Math.floor(totalPaid / totalMonthlyRent) : 0;

    if (initialPaid) {
      if (nextDue <= 0) {
        const paidUntilDate = new Date(startDate.getFullYear(), startDate.getMonth() + monthsPaid, startDate.getDate());
        return `Paid upto ${formatShortDate(paidUntilDate)}`;
      }
      return `${nextDue}/- due upto ${nextCycleStr} 'or'\n${currentDue}/- due upto ${currentCycleStr}`;
    } else {
      if (currentDue <= 0) {
        const paidUntilDate = new Date(startDate.getFullYear(), startDate.getMonth() + monthsPaid, startDate.getDate());
        return `Paid upto ${formatShortDate(paidUntilDate)}`;
      }
      return `${currentDue}/- due upto ${currentCycleStr}`;
    }
  };

  const handleExportExcel = () => {
    const listToExport = filteredRentals.length > 0 ? filteredRentals : combinedDues;
    if (listToExport.length === 0) {
      toast.error("No rent due records available to export.");
      return;
    }

    // Note Point 6: Exclude agreements generated in the current month (less than 1 month completed)
    const isCurrentMonthAgreement = (dateStr: string) => {
      if (!dateStr) return false;
      const d = parseLocalDate(dateStr);
      if (isNaN(d.getTime())) return false;
      const now = new Date();
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    };

    const eligibleList = listToExport.filter((item) => {
      const startDate = item.start || (item as any).rentDate || (item as any).date;
      return !isCurrentMonthAgreement(startDate);
    });

    if (eligibleList.length === 0) {
      toast.error("No rent due records eligible for export (excluding agreements created this month).");
      return;
    }

    // Sort by Rent Date in ASCENDING order (oldest on top, newest at bottom)
    eligibleList.sort((a, b) => {
      const dateA = parseLocalDate(a.start || (a as any).rentDate || (a as any).date).getTime() || 0;
      const dateB = parseLocalDate(b.start || (b as any).rentDate || (b as any).date).getTime() || 0;
      return dateA - dateB;
    });

    const isInitialRentPaid = (r: any) => isInitialRentPaidHelper(r, paymentsList);

    let periodText = "All Pending Dues";
    if (activeTab === "1-10") periodText = "1st to 10th";
    else if (activeTab === "11-20") periodText = "11th to 20th";
    else if (activeTab === "21-31") periodText = "21st to 31st";
    else if (activeTab === "returns") periodText = "Return Dues";

    const now = new Date();
    const fullMonthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const monthYearStr = `${fullMonthNames[now.getMonth()]}-${now.getFullYear()}`;
    const subtitleText = `Statement generated for the month of ${monthYearStr} in the period of ${periodText}`;

    const headers = [
      "Sl.No",
      "Customer Name",
      "Equipment",
      "Rent Date",
      "Rent (₹)",
      "Deposit (₹)",
      "Pending Duration",
      "Payment Due status",
      "Remaining Due (₹)",
      "Remarks"
    ];

    const rows: any[] = [];
    let slNo = 1;

    eligibleList.forEach((item) => {
      // Operator notes column should be empty for manual entry
      const remarkText = "";

      if (item.isReturnDue) {
        const cust = customersList.find(
          (c: any) =>
            c.id === item.customerId ||
            (c.name && item.customer && c.name.toLowerCase() === item.customer.toLowerCase())
        );
        const p1 = cust?.phone || "";
        const p2 = cust?.altPhone || "";
        const p3 = cust?.contactNumber3 || "";
        const phoneList = [p1, p2, p3].map((p) => String(p || "").trim()).filter(Boolean);
        const uniquePhones = Array.from(new Set(phoneList)).join("\n");
        const custName = item.customer || cust?.name || "Unknown";
        const custCell = uniquePhones ? `${custName}\n${uniquePhones}` : custName;

        const rawEq = item.equipment || "Equipment";
        const eqText = rawEq.replace(/\s*-\s*.*$/i, "").trim();

        // Rent Date column must show the original Rent Start Date!
        const rentStartDateRaw = item.start || (item as any).rental?.start || item.rentDate || "";
        const rentDateFormatted = rentStartDateRaw ? formatDateDDMMYYYY(rentStartDateRaw) : "";

        // Pending Duration column shows Returned on\nDD-MM-YYYY
        const retDateRaw = item.date || item.returnObj?.date || item.rentDate || "";
        const retDateFormatted = retDateRaw ? formatDateDDMMYYYY(retDateRaw) : "";
        const returnDurationCell = retDateFormatted ? `Returned on\n${retDateFormatted}` : "Return Due";

        rows.push([
          slNo++,
          custCell,
          eqText,
          rentDateFormatted,
          item.rentRateText ? `<b>${item.rentRateText}</b>` : "—",
          item.deposit || 0,
          returnDurationCell,
          `₹${item.totalDue.toLocaleString("en-IN")} (Final Settlement)`,
          `<b>${item.totalOutstanding || 0}</b>`,
          remarkText
        ]);
        return;
      }
      const r = item.rental;
      const cust = customersList.find((c: any) => c.id === r.customerId);

      const p1 = r.phone || cust?.phone || "";
      const p2 = r.altPhone || cust?.altPhone || "";
      const p3 = r.contactNumber3 || cust?.contactNumber3 || "";
      const phoneList = [p1, p2, p3].map((p) => String(p || "").trim()).filter(Boolean);
      const uniquePhones = Array.from(new Set(phoneList)).join("\n");
      const custName = r.customer || cust?.name || "Unknown";
      const custCell = uniquePhones ? `${custName}\n${uniquePhones}` : custName;

      const eqItems = r.equipmentItems || [
        {
          equipmentId: r.equipmentId,
          serial: r.serial,
          monthlyRent: Number(r.monthlyRent) || 0,
          deposit: Number(r.deposit) || 0,
          returned: false
        }
      ];

      const initialPaid = isInitialRentPaid(r);
      const hasReturnedItem = eqItems.some((it: any) => it.returned);

      let totalPaid = 0;
      eqItems.forEach((ei: any) => {
        totalPaid += getPaidForEquipment(r, ei.equipmentId, paymentsList, false);
      });

      // Single line if all equipment items are ONGOING (none returned)
      if (!hasReturnedItem) {
        const eqLines: string[] = [];
        let combinedMonthlyRent = 0;
        let combinedDailyRent = 0;
        let combinedDeposit = 0;

        eqItems.forEach((ei: any) => {
          const eq = equipmentById.get(ei.equipmentId);
          const eqName = ei.name || ei.equipment || getEquipmentName(ei.equipmentId) || eq?.name || "Equipment";
          eqLines.push(eqName);

          const mRent = Number(ei.monthlyRent || ei.rentRate || 0);
          const dRent = Number(ei.dailyRent) || 0;
          combinedMonthlyRent += mRent;
          combinedDailyRent += dRent;
          combinedDeposit += Number(ei.deposit || 0);
        });

        if (combinedDeposit === 0) combinedDeposit = Number(r.deposit || 0);

        const isMonthlyCombined = combinedMonthlyRent > 0;
        const rateVal = isMonthlyCombined ? combinedMonthlyRent : combinedDailyRent;

        const monthsPaid = rateVal > 0 ? Math.floor(totalPaid / rateVal) : 0;

        let initialStatusText = "";
        if (initialPaid && monthsPaid >= 2) {
          const extraMonths = monthsPaid - 1;
          const word = `${extraMonths} month`;
          initialStatusText = `(initial rent paid)\nthen ${word} rent also paid`;
        } else if (initialPaid) {
          initialStatusText = "(initial rent paid)";
        } else if (!initialPaid && monthsPaid >= 1) {
          const word = `${monthsPaid} month`;
          initialStatusText = `(initial rent not paid)\nthen ${word} rent paid`;
        } else {
          initialStatusText = "(initial rent not paid)";
        }

        const rateCell = `<b>₹${rateVal.toLocaleString("en-IN")}/${isMonthlyCombined ? "mo" : "day"}</b>\n${initialStatusText}`;
        const eqCell = eqLines.join("\n");
        const rentDateCell = formatDateDDMMYYYY(r.start);

        const startDate = parseLocalDate(r.start);
        const dayOfMonth = startDate.getDate();
        const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const currentYear = todayDate.getFullYear();
        const currentMonth = todayDate.getMonth();

        const maxDayThisMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const cycleDayThisMonth = Math.min(dayOfMonth, maxDayThisMonth);
        const currentCycleDate = new Date(currentYear, currentMonth, cycleDayThisMonth);

        const nextMonth = currentMonth + 1;
        const nextMonthYear = nextMonth > 11 ? currentYear + 1 : currentYear;
        const nextMonthNormalized = nextMonth % 12;
        const maxDayNextMonth = new Date(nextMonthYear, nextMonthNormalized + 1, 0).getDate();
        const cycleDayNextMonth = Math.min(dayOfMonth, maxDayNextMonth);
        const nextCycleDate = new Date(nextMonthYear, nextMonthNormalized, cycleDayNextMonth);

        const formatDateDDMMYY = (d: Date) => {
          const dd = String(d.getDate()).padStart(2, "0");
          const mm = String(d.getMonth() + 1).padStart(2, "0");
          const yy = String(d.getFullYear()).slice(-2);
          return `${dd}-${mm}-${yy}`;
        };

        const currentCycleStr = formatDateDDMMYY(currentCycleDate);
        const nextCycleStr = formatDateDDMMYY(nextCycleDate);

        const m1 = Math.max(0, (currentCycleDate.getFullYear() - startDate.getFullYear()) * 12 + (currentCycleDate.getMonth() - startDate.getMonth()));
        const m2 = m1 + 1;

        let pendingDurationCell = "0";
        let paymentDueStatusCell = "Paid";
        let remainingDueCell: any = 0;

        if (initialPaid) {
          const nextBilled = m2 * rateVal;
          const currentBilled = m1 * rateVal;
          const nextDue = Math.max(0, nextBilled - totalPaid);
          const currentDue = Math.max(0, currentBilled - totalPaid);

          if (totalPaid >= nextBilled) {
            pendingDurationCell = "0";
            const paidUntilDate = new Date(startDate.getFullYear(), startDate.getMonth() + monthsPaid, startDate.getDate());
            paymentDueStatusCell = `Paid upto ${formatDateDDMMYY(paidUntilDate)}`;
            remainingDueCell = 0;
          } else {
            const durationMonths = rateVal > 0 ? Math.round(nextDue / rateVal) : 0;
            pendingDurationCell = `${durationMonths}m`;
            paymentDueStatusCell = `${nextDue}/- due upto ${nextCycleStr} 'or'\n${currentDue}/- due upto ${currentCycleStr}`;
            remainingDueCell = nextDue;
          }
        } else {
          const currentBilled = m1 * rateVal;
          const currentDue = Math.max(0, currentBilled - totalPaid);

          if (totalPaid >= currentBilled) {
            pendingDurationCell = "0";
            const paidUntilDate = new Date(startDate.getFullYear(), startDate.getMonth() + monthsPaid, startDate.getDate());
            paymentDueStatusCell = `Paid upto ${formatDateDDMMYY(paidUntilDate)}`;
            remainingDueCell = 0;
          } else {
            const durationMonths = rateVal > 0 ? Math.round(currentDue / rateVal) : 0;
            pendingDurationCell = `${durationMonths}m`;
            paymentDueStatusCell = `${currentDue}/- due upto ${currentCycleStr}`;
            remainingDueCell = currentDue;
          }
        }

        rows.push([
          slNo++,
          custCell,
          eqCell,
          rentDateCell,
          rateCell,
          combinedDeposit,
          pendingDurationCell,
          paymentDueStatusCell,
          `<b>${remainingDueCell}</b>`,
          remarkText
        ]);
      } else {
        // Separate lines if partial returned
        eqItems.forEach((ei: any) => {
          const eq = equipmentById.get(ei.equipmentId);
          const eqName = ei.name || ei.equipment || getEquipmentName(ei.equipmentId) || eq?.name || "Equipment";
          const isMonthly = Number(ei.monthlyRent || ei.rentRate || 0) > 0;
          const rateVal = isMonthly ? Number(ei.monthlyRent || ei.rentRate || 0) : Number(ei.dailyRent || 0);

          const itemTotalPaid = getPaidForEquipment(r, ei.equipmentId, paymentsList, false);
          const monthsPaid = rateVal > 0 ? Math.floor(itemTotalPaid / rateVal) : 0;
          let initialStatusText = "";
          if (initialPaid && monthsPaid >= 2) {
            const extraMonths = monthsPaid - 1;
            const word = `${extraMonths} month`;
            initialStatusText = `(initial rent paid)\nthen ${word} rent also paid`;
          } else if (initialPaid) {
            initialStatusText = "(initial rent paid)";
          } else if (!initialPaid && monthsPaid >= 1) {
            const word = `${monthsPaid} month`;
            initialStatusText = `(initial rent not paid)\nthen ${word} rent paid`;
          } else {
            initialStatusText = "(initial rent not paid)";
          }
          const rateCell = `<b>₹${rateVal.toLocaleString("en-IN")}/${isMonthly ? "mo" : "day"}</b>\n${initialStatusText}`;
          const depVal = Number(ei.deposit) || (eqItems.length === 1 ? Number(r.deposit) : 0) || 0;
          const itemStartDate = ei.startDate || r.start;

          if (ei.returned) {
            const { outstanding } = calcUnpaidDetailsForEquipment(r, ei.equipmentId);
            let retDateRaw = ei.returnedDate || ei.returnDate || r.end;
            const retDateFormatted = retDateRaw ? formatDateDDMMYYYY(retDateRaw) : "";
            const returnDurationCell = retDateFormatted ? `Returned on\n${retDateFormatted}` : "Return Due";

            rows.push([
              slNo++,
              custCell,
              eqName,
              formatDateDDMMYYYY(itemStartDate),
              rateCell,
              depVal,
              returnDurationCell,
              `₹${outstanding.toLocaleString("en-IN")} (Final Settlement)`,
              `<b>${outstanding || 0}</b>`,
              remarkText
            ]);
          } else {
            const { outstanding } = calcUnpaidDetailsForEquipment(r, ei.equipmentId);
            const outstandingVal = outstanding || 0;
            let pendingDurationCell = "0m";
            let paymentDueStatusCell = "Paid";
            let remainingDueCell: any = 0;

            if (outstandingVal <= 0) {
              pendingDurationCell = "0m";
              paymentDueStatusCell = "Paid";
              remainingDueCell = 0;
            } else {
              const durationMonths = rateVal > 0 ? Math.round(outstandingVal / rateVal) : 0;
              pendingDurationCell = `${durationMonths}m`;
              const rawStatus = getPaymentDueStatus(r, outstandingVal);
              paymentDueStatusCell = rawStatus || `${outstandingVal.toLocaleString("en-IN")}/- due`;
              remainingDueCell = outstandingVal;
            }

            rows.push([
              slNo++,
              custCell,
              eqName,
              formatDateDDMMYYYY(itemStartDate),
              rateCell,
              depVal,
              pendingDurationCell,
              paymentDueStatusCell,
              `<b>${remainingDueCell}</b>`,
              remarkText
            ]);
          }
        });
      }
    });

    const tabLabel = activeTab === "all" ? "All_Dues" : activeTab === "returns" ? "Return_Dues" : `${activeTab}_Days`;
    const filename = `rent_due_statement_${tabLabel}_${getLocalYYYYMMDD()}.xls`;

    const colWidths = [60, 220, 360, 110, 120, 100, 130, 240, 130, 250];

    downloadExcel(filename, headers, rows, colWidths, {
      company: "Relife Medical Technologies - Mysore",
      subtitle: subtitleText
    });
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
            aria-label="Export Excel Report"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
            <span className="hidden md:inline">Export Excel Report</span>
          </Button>
          <Button
            size="sm"
            onClick={() => {
              toast.success("Sending reminders to " + filteredRentals.length + " customer(s) via WhatsApp, SMS & Email.");
            }}
            title="Send All Reminders"
            aria-label="Send All Reminders"
          >
            <Bell className="h-3.5 w-3.5 md:mr-1.5" />
            <span className="hidden md:inline">Send All Reminders</span>
          </Button>
        </div>
      }
    >
      {/* Severity metric bar */}
      <Card className="mb-5 overflow-hidden">
        <CardContent className="p-0">
          <div className="grid grid-cols-1 divide-y divide-border/60 sm:grid-cols-2 lg:grid-cols-4 sm:divide-y-0 sm:divide-x">
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
                  <TabsTrigger value="all" className="text-[12px] h-7 px-3">All ({combinedDues.length})</TabsTrigger>
                  <TabsTrigger value="returns" className="text-[12px] h-7 px-3 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold data-[state=active]:bg-amber-600 data-[state=active]:text-white">
                    Return Dues ({pendingReturnDues.length})
                  </TabsTrigger>
                  <TabsTrigger value="1-10" className="text-[12px] h-7 px-3">1–10 Days ({due1To10List.length})</TabsTrigger>
                  <TabsTrigger value="11-20" className="text-[12px] h-7 px-3">11–20 Days ({due11To20List.length})</TabsTrigger>
                  <TabsTrigger value="21-31" className="text-[12px] h-7 px-3">21–31 Days ({due21To31List.length})</TabsTrigger>
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
              {["all", "returns", "1-10", "11-20", "21-31"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`mobile-chip shrink-0 ${activeTab === tab ? "active" : ""}`}
                >
                  {tab === "all"
                    ? `All (${combinedDues.length})`
                    : tab === "returns"
                    ? `Return Dues (${pendingReturnDues.length})`
                    : tab === "1-10"
                    ? `1–10 Days (${due1To10List.length})`
                    : tab === "11-20"
                    ? `11–20 Days (${due11To20List.length})`
                    : `21–31 Days (${due21To31List.length})`}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Desktop table — hidden on mobile */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {/* Rent due history layout to match spreadsheet exactly */}
                  <TableHead className="px-2.5 py-2 text-[10.5px] w-[180px]">Customer</TableHead>
                  <TableHead className="px-2.5 py-2 text-[10.5px]">Equipment</TableHead>
                  <TableHead className="px-2 py-2 text-[10.5px] w-[100px]">Rent Date</TableHead>
                  <TableHead className="px-2 py-2 text-[10.5px] text-right w-[110px]">Rent Amount</TableHead>
                  <TableHead className="px-2 py-2 text-[10.5px] text-right w-[110px]">Deposit</TableHead>
                  <TableHead className="px-2 py-2 text-[10.5px] w-[100px]">Return Date</TableHead>
                  <TableHead className="px-2 py-2 text-[10.5px] text-right w-[110px]">Unpaid Duration</TableHead>
                  <TableHead className="px-2 py-2 text-[10.5px] text-right text-success w-[110px]">Total Paid</TableHead>
                  <TableHead className="px-2 py-2 text-[10.5px] text-right text-destructive w-[110px]">Remaining Balance</TableHead>
                  <TableHead className="px-2 py-2 text-[10.5px] w-[90px]">Status</TableHead>
                  <TableHead className="px-2 py-2 text-[10.5px] text-right w-28">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRentals.map((item) => {
                  if (item.isReturnDue) {
                    const ret = item.returnObj;
                    return (
                      <TableRow key={`ret-${item.id}`} className="group bg-amber-500/5 hover:bg-amber-500/10 transition-colors">
                        {/* 1. Customer name with contact numbers & Agreement ID */}
                        <TableCell className="px-2.5 py-2">
                          <p className="font-semibold text-[12px] leading-tight text-foreground">{item.customer}</p>
                          {getCustomerPhones(item.customerId).length > 0 && (
                            <div className="mt-0.5 space-y-0.5">
                              {getCustomerPhones(item.customerId).map((p, idx) => (
                                <p key={idx} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                  <Phone className="h-2.5 w-2.5 shrink-0" /> {p}
                                </p>
                              ))}
                            </div>
                          )}
                          <div className="mt-1 font-mono text-[9.5px] text-muted-foreground">Agr: {item.agreementId}</div>
                        </TableCell>

                        {/* 2. Equipment name */}
                        <TableCell className="px-2.5 py-2">
                          <div className="space-y-1 text-[11.5px] font-medium text-foreground">
                            {(item.equipmentLabels || [item.equipment]).map((lbl: string, idx: number) => (
                              <div key={idx}>{lbl}</div>
                            ))}
                          </div>
                        </TableCell>

                        {/* 3. Rent / Start Date */}
                        <TableCell className="px-2 py-2 whitespace-nowrap">
                          <span className="text-[11.5px] font-semibold text-muted-foreground whitespace-nowrap">
                            {item.rentDate ? formatDateDDMMYY(item.rentDate) : (item.date ? formatDateDDMMYY(item.date) : "—")}
                          </span>
                        </TableCell>

                        {/* 4. Rent Rate Amount */}
                        <TableCell className="px-2 py-2 text-right">
                          <div className="text-[11.5px] font-semibold text-foreground">
                            {item.rentRateText || "—"}
                          </div>
                        </TableCell>

                        {/* 5. Deposit */}
                        <TableCell className="px-2 py-2 text-right">
                          <div className="text-[11.5px] font-semibold text-muted-foreground">
                            ₹{item.deposit.toLocaleString("en-IN")}
                          </div>
                        </TableCell>

                        {/* 6. Return Date */}
                        <TableCell className="px-2 py-2 whitespace-nowrap">
                          <span className="text-[11.5px] font-semibold text-muted-foreground whitespace-nowrap">
                            {item.date ? formatDateDDMMYY(item.date) : "Returned"}
                          </span>
                        </TableCell>

                        {/* 7. Unpaid Duration / Final Settlement Amount */}
                        <TableCell className="px-2 py-2 text-right">
                          <div className="text-[11.5px] font-bold text-amber-700 dark:text-amber-400">
                            ₹{item.totalDue.toLocaleString("en-IN")}
                          </div>
                          <span className="text-[9px] text-muted-foreground block">Final Settlement</span>
                        </TableCell>

                        {/* 8. Total Paid Amount */}
                        <TableCell className="px-2 py-2 text-right">
                          <div className="text-[11.5px] font-extrabold text-success text-right">
                            ₹{item.totalPaid.toLocaleString("en-IN")}
                          </div>
                        </TableCell>

                        {/* 9. Remaining Balance */}
                        <TableCell className="px-2 py-2 text-right">
                          <div className="text-[11.5px] font-extrabold text-right text-amber-600 dark:text-amber-400">
                            ₹{item.totalOutstanding.toLocaleString("en-IN")}
                          </div>
                        </TableCell>

                        {/* 10. Status */}
                        <TableCell className="px-2 py-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 whitespace-nowrap">
                            Return Due ({item.status})
                          </span>
                        </TableCell>

                        {/* 11. Actions */}
                        <TableCell className="px-2 py-2 text-right">
                          <div className="flex items-center justify-end gap-0.5">
                            <PayReturnDueDialog
                              ret={ret}
                              onPaid={() => setRefreshKey((k) => k + 1)}
                            />
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-success hover:bg-success/10" title="WhatsApp" onClick={() => toast.success(`WhatsApp reminder sent to ${item.customer}`)}>
                              <MessageCircle className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10" title="SMS" onClick={() => toast.success(`SMS reminder sent to ${item.customer}`)}>
                              <Phone className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  }

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
                      {/* 1. Customer name with contact numbers */}
                      <TableCell className="px-2.5 py-2">
                        <p className="font-semibold text-[12px] leading-tight">{r.customer}</p>
                        {getCustomerPhones(r.customerId).length > 0 && (
                          <div className="mt-0.5 space-y-0.5">
                            {getCustomerPhones(r.customerId).map((p, idx) => (
                              <p key={idx} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                <Phone className="h-2.5 w-2.5 shrink-0" /> {p}
                              </p>
                            ))}
                          </div>
                        )}
                        <div className="mt-1 font-mono text-[9.5px] text-muted-foreground">Agr: {r.id}</div>
                      </TableCell>

                      {/* 3. Equipment name with model */}
                      <TableCell className="px-2.5 py-2">
                        <div className="space-y-1">
                          {eqItems.map((eqItem: any) => {
                            const isReturned = eqItem.returned;
                            const itemEqName = (() => {
                              if (eqItem.label) return eqItem.label.replace(/\s*-\s*S\/N:.*$/i, "").replace(/\s*S\/N:.*$/i, "").trim();
                              const name = eqItem.name || eqItem.equipment || getEquipmentName(eqItem.equipmentId);
                              const model = eqItem.model || equipmentById.get(eqItem.equipmentId)?.model || (eqItems.length === 1 ? r.model : undefined);
                              return formatEquipmentLabel({ name, model, serial: "" }, false);
                            })();

                            return (
                              <div key={eqItem.equipmentId} className="flex items-center gap-1 text-[11.5px]">
                                <span className={isReturned ? "line-through text-muted-foreground/50" : "text-foreground/80 font-medium"}>
                                  {itemEqName}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </TableCell>

                      {/* 4. Rent Date */}
                      <TableCell className="px-2 py-2 whitespace-nowrap">
                        <span className="text-[11.5px] font-semibold text-muted-foreground whitespace-nowrap">
                          {formatDateDDMMYY(r.start)}
                        </span>
                      </TableCell>
                      {(() => {
                        const hasReturnedItem = eqItems.some((it: any) => it.returned);

                        if (!hasReturnedItem && eqItems.length > 1) {
                          const combinedMonthlyRent = eqItems.reduce((sum: number, it: any) => sum + (Number(it.monthlyRent || it.rentRate) || 0), 0);
                          const combinedDailyRent = eqItems.reduce((sum: number, it: any) => sum + (Number(it.dailyRent) || 0), 0);
                          const isMonthlyCombined = combinedMonthlyRent > 0;
                          const combinedRateText = isMonthlyCombined
                            ? `₹${combinedMonthlyRent.toLocaleString("en-IN")}/mo`
                            : `₹${combinedDailyRent.toLocaleString("en-IN")}/day`;

                          const combinedDeposit = eqItems.reduce((sum: number, it: any) => sum + (Number(it.deposit) || 0), 0) || Number(r.deposit) || 0;

                          const sampleDetails = calcUnpaidDetailsForEquipment(r, eqItems[0].equipmentId);

                          return (
                            <>
                              {/* 5. Rent amount */}
                              <TableCell className="px-2 py-2 text-right">
                                <div className="text-[11.5px] font-semibold text-muted-foreground">
                                  {combinedRateText}
                                </div>
                              </TableCell>
                              {/* 6. Deposit */}
                              <TableCell className="px-2 py-2 text-right">
                                <div className="text-[11.5px] font-semibold text-muted-foreground">
                                  ₹{combinedDeposit.toLocaleString("en-IN")}
                                </div>
                              </TableCell>
                              {/* 6.5 Return Date */}
                              <TableCell className="px-2 py-2 whitespace-nowrap">
                                <span className="text-[11px] font-semibold text-muted-foreground whitespace-nowrap font-sans">
                                  Ongoing
                                </span>
                              </TableCell>
                              {/* 7. Unpaid Duration */}
                              <TableCell className="px-2 py-2 text-right">
                                <div className="text-[11.5px] font-medium text-muted-foreground">
                                  {sampleDetails.unpaidText}
                                </div>
                              </TableCell>
                              {/* 8. Total Paid Amount */}
                              <TableCell className="px-2 py-2 text-right">
                                <div className="text-[11.5px] font-extrabold text-success text-right">
                                  ₹{item.totalPaid.toLocaleString("en-IN")}
                                </div>
                              </TableCell>
                              {/* 9. Remaining Balance */}
                              <TableCell className="px-2 py-2 text-right">
                                <div className={`text-[11.5px] font-extrabold text-right ${item.totalOutstanding > 0 ? "text-destructive" : "text-success"}`}>
                                  ₹{item.totalOutstanding.toLocaleString("en-IN")}
                                </div>
                                {(() => {
                                  let combinedAsOfToday = 0;
                                  eqItems.forEach((it: any) => {
                                    const details = calcUnpaidDetailsForEquipment(r, it.equipmentId);
                                    combinedAsOfToday += details.balanceAsOfToday;
                                  });
                                  return (
                                    <div className="text-[10.5px] font-medium text-muted-foreground text-right mt-0.5 whitespace-nowrap">
                                      Today: ₹{combinedAsOfToday.toLocaleString("en-IN")}
                                    </div>
                                  );
                                })()}
                              </TableCell>
                            </>
                          );
                        }

                        return (
                          <>
                            {/* 5. Rent amount */}
                            <TableCell className="px-2 py-2 text-right">
                              <div className="space-y-1 text-right">
                                {eqItems.map((eqItem: any) => {
                                  const { rateText } = calcUnpaidDetailsForEquipment(r, eqItem.equipmentId);
                                  return (
                                    <div key={eqItem.equipmentId} className={eqItem.returned ? "line-through text-muted-foreground/60 text-[11.5px] font-medium" : "text-[11.5px] font-semibold text-muted-foreground"}>
                                      {rateText}
                                    </div>
                                  );
                                })}
                              </div>
                            </TableCell>
                            {/* 6. Deposit */}
                            <TableCell className="px-2 py-2 text-right">
                              <div className="space-y-1 text-right">
                                {eqItems.map((eqItem: any) => {
                                  const depVal = Number(eqItem.deposit) || (eqItems.length === 1 ? Number(r.deposit) : 0) || 0;
                                  return (
                                    <div key={eqItem.equipmentId} className={eqItem.returned ? "line-through text-muted-foreground/60 text-[11.5px] font-medium" : "text-[11.5px] font-semibold text-muted-foreground"}>
                                      ₹{depVal.toLocaleString("en-IN")}
                                    </div>
                                  );
                                })}
                              </div>
                            </TableCell>
                            {/* 6.5 Return Date */}
                            <TableCell className="px-2 py-2 whitespace-nowrap">
                              <div className="space-y-1">
                                {eqItems.map((eqItem: any, idx: number) => {
                                  const isReturned = eqItem.returned;
                                  let retDateRaw = eqItem.returnedDate || eqItem.returnDate;
                                  if (!retDateRaw && isReturned) {
                                    const ret = returnsList.find(
                                      (retItem: any) => retItem.agreement === r.id && retItem.returnedEquipmentIds?.includes(eqItem.equipmentId)
                                    );
                                    retDateRaw = ret?.date || r.end;
                                  }
                                  return (
                                    <div key={eqItem.equipmentId || idx} className="text-[11.5px] whitespace-nowrap">
                                      {isReturned ? (
                                        <span className="font-semibold text-muted-foreground/70">
                                          {retDateRaw ? formatDateDDMMYY(retDateRaw) : (r.end ? formatDateDDMMYY(r.end) : "Returned")}
                                        </span>
                                      ) : (
                                        <span className="font-semibold text-muted-foreground font-sans">
                                          Ongoing
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </TableCell>
                            {/* 7. Unpaid Duration */}
                            <TableCell className="px-2 py-2 text-right">
                              <div className="space-y-1 text-right">
                                {eqItems.map((eqItem: any) => {
                                  const { unpaidText } = calcUnpaidDetailsForEquipment(r, eqItem.equipmentId);
                                  return (
                                    <div key={eqItem.equipmentId} className={`text-[11.5px] font-medium ${eqItem.returned ? "text-muted-foreground/40" : "text-muted-foreground"}`}>
                                      {eqItem.returned ? "—" : unpaidText}
                                    </div>
                                  );
                                })}
                              </div>
                            </TableCell>
                            {/* 8. Total Paid Amount */}
                            <TableCell className="px-2 py-2 text-right">
                              <div className="space-y-1 text-right">
                                {eqItems.map((eqItem: any) => {
                                  const { grandTotalPaid } = calcUnpaidDetailsForEquipment(r, eqItem.equipmentId);
                                  return (
                                    <div key={eqItem.equipmentId} className={`text-[11.5px] text-right ${eqItem.returned ? "line-through text-muted-foreground/60 font-medium" : "font-extrabold text-success"}`}>
                                      ₹{grandTotalPaid.toLocaleString("en-IN")}
                                    </div>
                                  );
                                })}
                              </div>
                            </TableCell>
                            {/* 9. Remaining Balance */}
                            <TableCell className="px-2 py-2 text-right">
                              <div className="space-y-1 text-right">
                                {eqItems.map((eqItem: any) => {
                                  const { outstanding, balanceAsOfToday } = calcUnpaidDetailsForEquipment(r, eqItem.equipmentId);
                                  return (
                                    <div key={eqItem.equipmentId} className="text-right">
                                      <div className={`text-[11.5px] font-extrabold text-right ${eqItem.returned ? (outstanding > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground/40") : (outstanding > 0 ? "text-destructive" : "text-success")}`}>
                                        ₹{outstanding.toLocaleString("en-IN")}
                                      </div>
                                      {!eqItem.returned && (
                                        <div className="text-[10.5px] font-medium text-muted-foreground text-right mt-0.5 whitespace-nowrap">
                                          Today: ₹{balanceAsOfToday.toLocaleString("en-IN")}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </TableCell>
                          </>
                        );
                      })()}
                      {/* 10. Status */}
                      <TableCell className="px-2 py-2"><StatusBadge status={r.status} /></TableCell>
                      {/* 11. Actions */}
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
          <div className="md:hidden">
            {filteredRentals.length === 0 ? (
              <div className="py-10 text-center text-[13px] text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 text-success/50 mx-auto mb-2" />
                <p>No pending dues.</p>
                <p className="text-[11px] mt-1">All payments are up to date!</p>
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {filteredRentals.map((item) => {
                  if (item.isReturnDue) {
                    const ret = item.returnObj;
                    return (
                      <div key={`ret-${item.id}`} className="px-4 py-3.5 space-y-2.5 bg-amber-500/5 border-b border-border/60">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-[13.5px]">{item.customer}</p>
                            <span className="inline-flex items-center rounded-md bg-primary/8 border border-primary/18 px-1.5 py-0.5 font-mono text-[11px] font-bold text-primary mt-0.5">{item.agreementId}</span>
                            {getCustomerPhones(item.customerId).length > 0 && (
                              <div className="mt-1 space-y-0.5">
                                {getCustomerPhones(item.customerId).map((p, idx) => (
                                  <p key={idx} className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                    <Phone className="h-2.5 w-2.5 shrink-0" /> {p}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                            Return Due
                          </span>
                        </div>
                        
                        <div className="space-y-1.5 bg-amber-500/10 rounded-xl p-3 border border-amber-500/20">
                          <div className="flex items-center justify-between font-semibold text-[12.5px]">
                            <span>{item.equipment}</span>
                            <span className="text-amber-700 dark:text-amber-300 font-bold">₹{item.totalDue.toLocaleString("en-IN")}</span>
                          </div>
                          <div className="flex justify-between text-[11.5px] text-muted-foreground">
                            <span>Return Date: <strong className="text-foreground font-mono">{item.date ? formatDateDDMMYY(item.date) : "Returned"}</strong></span>
                            <span>Paid: <strong className="text-success font-bold">₹{item.totalPaid.toLocaleString("en-IN")}</strong></span>
                            <span>Due: <strong className="text-amber-600 dark:text-amber-400 font-bold">₹{item.totalOutstanding.toLocaleString("en-IN")}</strong></span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <PayReturnDueDialog
                            ret={ret}
                            onPaid={() => setRefreshKey((k) => k + 1)}
                            triggerClassName="h-10 px-3 text-[11px] flex-1"
                          />
                          <Button variant="outline" size="sm" className="h-10 text-[11px] px-2.5" onClick={() => toast.success(`WhatsApp reminder sent to ${item.customer}`)}>
                            <MessageCircle className="h-3.5 w-3.5" /> Remind
                          </Button>
                        </div>
                      </div>
                    );
                  }

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
                          const { outstanding, unpaidText, grandTotalPaid, balanceAsOfToday } = calcUnpaidDetailsForEquipment(r, eqItem.equipmentId);
                          return (
                            <div key={eqItem.equipmentId} className="text-[12px] flex flex-col gap-0.5 border-b border-border/40 last:border-b-0 pb-2 last:pb-0 mb-2 last:mb-0">
                              <div className="flex items-center justify-between font-medium">
                                <span className={eqItem.returned ? "line-through text-muted-foreground/60 font-medium" : "text-slate-800 font-semibold"}>
                                  {(() => {
                                    if (eqItem.label) return eqItem.label.replace(/\s*-\s*S\/N:.*$/i, "").replace(/\s*S\/N:.*$/i, "").trim();
                                    const name = eqItem.name || eqItem.equipment || getEquipmentName(eqItem.equipmentId);
                                    const model = eqItem.model || equipmentById.get(eqItem.equipmentId)?.model || (eqItems.length === 1 ? r.model : undefined);
                                    return formatEquipmentLabel({ name, model, serial: "" }, false);
                                  })()}
                                </span>
                                {eqItem.returned ? null : (
                                  <span className="inline-flex items-center rounded bg-primary/8 px-1.5 py-0.5 text-[9px] font-bold text-primary border border-primary/15 shrink-0">Active</span>
                                )}
                              </div>
                              <div className="flex justify-between text-[11.5px] text-muted-foreground mt-1">
                                <span>Unpaid: <strong className={eqItem.returned ? "text-muted-foreground/50" : "text-muted-foreground font-medium"}>{eqItem.returned ? (outstanding > 0 ? "Return Due" : "—") : unpaidText}</strong></span>
                                <span>Paid: <strong className={eqItem.returned ? "line-through text-muted-foreground/60 font-medium" : "text-success"}>₹{grandTotalPaid.toLocaleString("en-IN")}</strong></span>
                                <span>Bal: <strong className={eqItem.returned ? (outstanding > 0 ? "text-amber-600 dark:text-amber-400 font-bold" : "text-muted-foreground/50") : (outstanding > 0 ? "text-destructive" : "text-success")}>₹{outstanding.toLocaleString("en-IN")}</strong> {!eqItem.returned && <span className="text-[10px] text-muted-foreground font-medium ml-1">(Today: ₹{balanceAsOfToday.toLocaleString("en-IN")})</span>}</span>
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
                          triggerClassName="h-10 px-3 text-[11px]"
                        />
                        <Button variant="outline" size="sm" className="h-10 text-[11px] px-2.5" onClick={() => toast.success(`WhatsApp reminder sent to ${r.customer}`)}>
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