import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo, useRef } from "react";
import { AppShell, StatusBadge } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/ui/combobox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  RotateCcw, 
  Receipt, 
  CheckCircle2, 
  AlertCircle, 
  Package, 
  ArrowRight, 
  History, 
  QrCode,
  Search,
  User,
  MapPin,
  Calendar,
  Check,
  Activity,
  TrendingUp,
  Sliders,
  ShieldCheck,
  CreditCard,
  XCircle,
  AlertTriangle,
  Clock,
  MessageCircle,
  Copy,
  Send,
  MoreVertical
} from "lucide-react";
import { toast } from "sonner";
import { QrScannerModal } from "@/components/QrScannerModal";
import {
  getRentals,
  getReturns,
  saveReturn,
  getEquipment,
  savePayment,
  downloadFile,
  printReturnReceipt,
  formatDateDDMMYYYY,
  formatDateDDMMYY,
  getReturnCalculatedRentPerItem,
  cleanNum,
  getRentPaidForAgreement,
  getPaidForEquipment,
  getPayments,
  getPricingTableRate,
  useDatabaseTrigger,
  getNextReturnNumber,
  peekNextReturnNumber,
  getNextPaymentNumber,
  getLocalYYYYMMDD,
  parseLocalDate,
  getCustomers,
  getOwners,
  sortLatestFirst,
  extractIdNumber,
  formatEquipmentLabel,
} from "@/lib/data-store";
import { reportError } from "@/lib/error-reporting";
import { useDebounce } from "@/hooks/use-debounce";
import { numericInputGuard } from "@/lib/utils";

function extractMapLink(locationAddress?: string, address?: string, latitude?: any, longitude?: any, rental?: any, customer?: any): string {
  const lat = Number(latitude || rental?.latitude || customer?.latitude) || 0;
  const lng = Number(longitude || rental?.longitude || customer?.longitude) || 0;
  if (lat !== 0 || lng !== 0) {
    return `https://www.google.com/maps?q=${lat},${lng}`;
  }

  const extractUrl = (str?: string): string | null => {
    if (!str) return null;
    const urlMatch = str.match(/https?:\/\/[^\s]+/i);
    return urlMatch ? urlMatch[0] : null;
  };

  const extractCoords = (str?: string): string | null => {
    if (!str) return null;
    const coordMatch = str.match(/([-\d.]+)\s*,\s*([-\d.]+)/);
    if (coordMatch) {
      const cLat = Number(coordMatch[1]);
      const cLng = Number(coordMatch[2]);
      if (!isNaN(cLat) && !isNaN(cLng) && (cLat !== 0 || cLng !== 0)) {
        return `https://www.google.com/maps?q=${cLat},${cLng}`;
      }
    }
    return null;
  };

  const targets = [
    locationAddress,
    rental?.locationAddress,
    customer?.locationAddress,
    address,
    rental?.address,
    customer?.address,
    rental?.mapUrl,
    rental?.googleMapsUrl,
    rental?.mapLink,
  ];

  for (const t of targets) {
    if (t && typeof t === "string") {
      const url = extractUrl(t);
      if (url) return url;
    }
  }

  for (const t of targets) {
    if (t && typeof t === "string") {
      const mapFromCoord = extractCoords(t);
      if (mapFromCoord) return mapFromCoord;
    }
  }

  if (typeof window !== "undefined") {
    try {
      const docs = JSON.parse(localStorage.getItem("medirent-documents") || "[]");
      const agreementId = rental?.id || rental?.agreementNumber || rental?.agreementId;
      const customerId = rental?.customerId || customer?.id;
      
      const locDoc = docs.find((d: any) => {
        const isLoc = d.category === "Location Tagged" || d.category === "Location" || d.name?.toLowerCase().includes("location");
        if (!isLoc) return false;
        if (agreementId && (d.agreementId === agreementId || d.rentalId === agreementId)) return true;
        if (customerId && d.customerId === customerId) return true;
        return false;
      });

      if (locDoc) {
        const fileData = locDoc.fileData || "";
        const url = extractUrl(fileData);
        if (url) return url;
        const coords = extractCoords(fileData);
        if (coords) return coords;

        if (fileData.includes("base64,")) {
          const b64 = fileData.split("base64,")[1];
          const decoded = atob(b64);
          const decUrl = extractUrl(decoded);
          if (decUrl) return decUrl;
          const decCoords = extractCoords(decoded);
          if (decCoords) return decCoords;
        }
      }
    } catch {
      // ignore
    }
  }

  return "";
}

function generateWhatsAppPickupMessage(params: {
  customerName?: any;
  rentDate?: any;
  phone?: any;
  altPhone?: any;
  equipment?: any;
  serial?: any;
  model?: any;
  area?: any;
  address?: any;
  locationAddress?: any;
  latitude?: any;
  longitude?: any;
  collectAmount?: number;
  refundAmount?: number;
  rental?: any;
  customer?: any;
  /** ITEM-5: the exact equipment being picked up. When supplied, the model is
   *  resolved from these unit ids instead of guessing from a category name. */
  equipmentIds?: string[];
}) {
  const name = params.customerName ? String(params.customerName) : "Customer";
  
  // Format rent date as DD-MM-YY
  let formattedRentDate = "";
  if (params.rentDate) {
    const rentDateStr = String(params.rentDate);
    const d = parseLocalDate(rentDateStr);
    if (!isNaN(d.getTime())) {
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yy = String(d.getFullYear()).slice(-2);
      formattedRentDate = `${dd}-${mm}-${yy}`;
    } else {
      formattedRentDate = rentDateStr;
    }
  }

  // Line 1: Name / Date
  const line1 = formattedRentDate ? `${name} / ${formattedRentDate}` : name;

  // Line 2: Phones
  const phoneList: string[] = [];
  if (params.phone != null && String(params.phone).trim() !== "") {
    phoneList.push(String(params.phone).trim());
  }
  if (params.altPhone != null && String(params.altPhone).trim() !== "") {
    phoneList.push(String(params.altPhone).trim());
  }
  const line2 = phoneList.join(" & ") || "N/A";

  // Line 3: Model Number ONLY (never display raw serial numbers)
  //
  // ITEM-5 FIX: this used to resolve the model by matching `params.equipment`
  // (a category name, and on multi-item rentals a comma-joined list of them)
  // against the equipment master. Every unit in a category shares that name, so
  // `allEq.find(...)` returned whichever unit happened to be stored first and
  // printed *its* model - the wrong model. It also compared the serial against
  // `e.id`, which could match an unrelated record outright.
  //
  // Equipment ids are the only unambiguous handle on a physical unit, so the
  // model is now resolved from the ids of the units actually being picked up,
  // and name matching survives only as a last-resort fallback.
  const modelStr = params.model != null ? String(params.model).trim() : "";
  const serialStr = params.serial != null ? String(params.serial).trim() : "";
  const eqStr = params.equipment != null ? String(params.equipment).trim() : "";

  const allEq = getEquipment();
  const eqById = new Map<string, any>(allEq.map((e: any) => [e.id, e]));
  const isUsableModel = (m: unknown) => {
    const v = String(m || "").trim();
    return v !== "" && v.toLowerCase() !== "standard";
  };

  const rentalItems: any[] = Array.isArray(params.rental?.equipmentItems)
    ? params.rental.equipmentItems
    : [];

  // Narrowest set of units we can justify: an explicit selection, else the ids
  // recorded on the return, else the items still out on the rental.
  let targetItems: any[] = [];
  if (params.equipmentIds && params.equipmentIds.length > 0) {
    const wanted = new Set(params.equipmentIds);
    targetItems = rentalItems.filter((it: any) => wanted.has(it.equipmentId));
    if (targetItems.length === 0) {
      targetItems = params.equipmentIds.map((id) => ({ equipmentId: id }));
    }
  } else if (rentalItems.length > 0) {
    const unreturned = rentalItems.filter((it: any) => !it.returned);
    targetItems = unreturned.length > 0 ? unreturned : rentalItems;
  }

  const modelsFromItems = targetItems
    .map((item: any) => {
      const eq = eqById.get(item.equipmentId);
      // The line item recorded at signing time wins over the mutable master.
      if (isUsableModel(item.model)) return String(item.model).trim();
      if (isUsableModel(eq?.model)) return String(eq.model).trim();
      // No model on record for this unit - name it so the line is not empty.
      return String(eq?.name || item.name || "").trim();
    })
    .filter(Boolean);

  let foundModel = Array.from(new Set(modelsFromItems)).join(", ");
  let foundName = "";

  if (!foundModel) {
    // Legacy single-equipment rentals carry no equipmentItems at all. Match on
    // the serial only (unique per unit); a bare category name cannot identify
    // a unit, so it is used for the name fallback, never for the model.
    const bySerial = serialStr
      ? allEq.find((e: any) => String(e.serial || "").trim().toLowerCase() === serialStr.toLowerCase())
      : undefined;
    if (bySerial) {
      if (isUsableModel(bySerial.model)) foundModel = String(bySerial.model).trim();
      if (bySerial.name) foundName = String(bySerial.name).trim();
    } else if (eqStr) {
      const byName = allEq.find((e: any) => String(e.name || "").trim().toLowerCase() === eqStr.toLowerCase());
      if (byName?.name) foundName = String(byName.name).trim();
    }
  }

  let line3 = "";
  if (foundModel) {
    line3 = foundModel;
  } else if (modelStr && modelStr.toLowerCase() !== "standard" && modelStr !== serialStr) {
    line3 = modelStr;
  } else if (foundName) {
    line3 = foundName;
  } else if (eqStr && eqStr !== serialStr) {
    line3 = eqStr;
  } else {
    line3 = "Medical Equipment";
  }

  // Line 4: "Return at Area Name"
  const areaStr = params.area != null ? String(params.area).trim() : "";
  const addrStr = params.address != null ? String(params.address).trim() : "";

  let displayArea = areaStr;
  if (!displayArea && addrStr && addrStr !== "No address provided" && !addrStr.startsWith("http")) {
    const parts = addrStr.split(",").map(s => s.trim()).filter(Boolean);
    if (parts.length > 1) {
      displayArea = parts[parts.length - 1];
    } else {
      displayArea = addrStr;
    }
  }
  const rawArea = displayArea || "Customer Location";
  const line4 = rawArea.toLowerCase().startsWith("return at") ? rawArea : `Return at ${rawArea}`;

  // Line 5: Map location link (extracted from latitude/longitude, locationAddress, address, or tagged documents)
  const mapLink = extractMapLink(params.locationAddress, params.address, params.latitude, params.longitude, params.rental, params.customer);
  const line5 = mapLink;

  // Line 6: Collect Amount or Refund Amount
  let line6 = "";
  if (params.collectAmount && params.collectAmount > 0) {
    line6 = `Collect ${params.collectAmount}`;
  } else if (params.refundAmount && params.refundAmount > 0) {
    line6 = `Refund ${params.refundAmount}`;
  } else {
    line6 = `Collect 0`;
  }

  return [line1, line2, line3, line4, line5, line6].filter(Boolean).join("\n");
}

function WhatsAppReturnMessageModal({
  ret,
  rental,
  customer,
  hideTrigger,
  controlledOpen,
  onControlledOpenChange,
}: {
  ret?: any;
  rental?: any;
  customer?: any;
  hideTrigger?: boolean;
  controlledOpen?: boolean;
  onControlledOpenChange?: (open: boolean) => void;
}) {
  const [openState, setOpenState] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : openState;
  const setOpen = (value: boolean) => {
    setOpenState(value);
    onControlledOpenChange?.(value);
  };
  const [editedMsg, setEditedMsg] = useState("");

  const customerName = ret?.customer || rental?.customer || customer?.name || "Customer";
  const rentDate = rental?.start || ret?.date || "";
  const phone = customer?.phone || rental?.phone || "";
  const altPhone = customer?.altPhone || rental?.altPhone || "";
  const equipment = ret?.equipment || rental?.equipment || "Equipment";
  const serial = rental?.serial || ret?.serial || "";
  const model = rental?.model || "";
  const area = customer?.area || rental?.area || "";
  const address = customer?.address || rental?.address || "";
  const locationAddress = rental?.locationAddress || customer?.locationAddress || "";
  const latitude = rental?.latitude;
  const longitude = rental?.longitude;

  const pending = ret?.duePendingBalance !== undefined
    ? ret.duePendingBalance
    : (ret ? (ret.refund < 0 ? Math.abs(ret.refund) : 0) : 0);

  const formattedMsg = useMemo(() => {
    return generateWhatsAppPickupMessage({
      customerName,
      rentDate,
      phone,
      altPhone,
      equipment,
      serial,
      model,
      area,
      address,
      locationAddress,
      latitude,
      longitude,
      collectAmount: pending > 0 ? pending : (ret?.refund < 0 ? Math.abs(ret.refund) : 0),
      refundAmount: ret?.refund > 0 ? ret.refund : 0,
      rental,
      customer,
      // ITEM-5: a processed return records exactly which units went back.
      equipmentIds: ret?.returnedEquipmentIds,
    });
  }, [customerName, rentDate, phone, altPhone, equipment, serial, model, area, address, locationAddress, latitude, longitude, pending, ret, rental, customer]);

  useEffect(() => {
    if (open) {
      setEditedMsg(formattedMsg);
    }
  }, [open, formattedMsg]);

  const handleCopy = () => {
    navigator.clipboard.writeText(editedMsg || formattedMsg);
    toast.success("WhatsApp pickup message copied to clipboard!");
  };

  const handleSendWhatsApp = () => {
    const cleanPhone = String(phone || "").replace(/\D/g, "");
    const text = encodeURIComponent(editedMsg || formattedMsg);
    const targetUrl = cleanPhone 
      ? `https://wa.me/91${cleanPhone}?text=${text}` 
      : `https://wa.me/?text=${text}`;
    window.open(targetUrl, "_blank");
  };

  return (
    <>
      {!hideTrigger && (
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2 text-[11px] font-bold text-emerald-700 bg-emerald-50/70 hover:bg-emerald-100 border-emerald-300 gap-1.5"
          onClick={() => setOpen(true)}
          title="WhatsApp Pickup Message"
        >
          <MessageCircle className="h-3.5 w-3.5 text-emerald-600" /> WhatsApp
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-700 font-bold">
              <MessageCircle className="h-4.5 w-4.5" /> WhatsApp Pickup Message
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <p className="text-[11.5px] text-muted-foreground">
              Auto-generated formatted message for WhatsApp collection & pickup:
            </p>

            <Textarea
              value={editedMsg}
              onChange={(e) => setEditedMsg(e.target.value)}
              rows={7}
              className="font-mono text-[12.5px] bg-muted/20 border-emerald-300 dark:border-emerald-900 focus-visible:ring-emerald-500 leading-relaxed font-semibold"
            />
          </div>

          <DialogFooter className="flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="gap-1.5 font-bold text-[12px]"
            >
              <Copy className="h-3.5 w-3.5 text-primary" /> Copy Text
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleSendWhatsApp}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 text-[12px]"
            >
              <MessageCircle className="h-3.5 w-3.5" /> Send WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function getItemRentBreakdown(monthlyRent: number, daysUsed: number) {
  const cleanMonthlyRent = cleanNum(monthlyRent);
  const cleanDaysUsed = cleanNum(daysUsed);
  if (cleanDaysUsed <= 0 || cleanMonthlyRent <= 0) {
    return { totalRent: 0, description: "0 days", gracePeriodApplied: false, graceDays: 0 };
  }

  const dailyRent = cleanMonthlyRent / 30;
  const totalRent = Math.round(cleanDaysUsed * dailyRent);
  const desc = `${cleanDaysUsed} days (Calculated day-wise at ₹${Math.round(dailyRent)}/day)`;

  return {
    totalRent,
    description: desc,
    gracePeriodApplied: false,
    graceDays: 0
  };
}

function formatRentalDuration(startStr: string, endStr: string, rentCycle: string = "Monthly") {
  const start = parseLocalDate(startStr);
  const end = parseLocalDate(endStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
    return "0 Days";
  }
  const diffTime = end.getTime() - start.getTime();
  const totalDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  if (rentCycle && rentCycle.toLowerCase() === "daily") {
    return `${totalDays} Day${totalDays > 1 ? "s" : ""}`;
  }

  // Calculate calendar months & remaining days
  let months = end.getFullYear() - start.getFullYear();
  months = months * 12 + (end.getMonth() - start.getMonth());
  
  let days = end.getDate() - start.getDate();
  if (days < 0) {
    months--;
    const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
    days += prevMonth.getDate();
  }

  if (months === 0) {
    return `${totalDays} Day${totalDays > 1 ? "s" : ""}`;
  }
  if (days === 0) {
    return `${months} Month${months > 1 ? "s" : ""}`;
  }
  return `${months} Month${months > 1 ? "s" : ""} ${days} Day${days > 1 ? "s" : ""}`;
}


function PayReturnDueDialog({
  ret,
  onSave,
  hideTrigger,
  controlledOpen,
  onControlledOpenChange,
}: {
  ret: any;
  onSave: () => void;
  hideTrigger?: boolean;
  controlledOpen?: boolean;
  onControlledOpenChange?: (open: boolean) => void;
}) {
  const [openState, setOpenState] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : openState;
  const setOpen = (value: boolean) => {
    setOpenState(value);
    onControlledOpenChange?.(value);
  };
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

  const enteredAmount = Math.max(0, Number(payAmount) || 0);
  const liveRemaining = Math.max(0, currentPending - enteredAmount);

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
    onSave();
  };

  return (
    <>
      {!hideTrigger && (
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-300 gap-1"
          onClick={() => setOpen(true)}
          title="Pay Due Amount"
        >
          <CreditCard className="h-3 w-3" /> Pay Due
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-700">
              <CreditCard className="h-4 w-4" /> Settle Return Due Payment
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3 text-[12.5px] space-y-1.5">
              <div className="flex justify-between font-bold text-foreground">
                <span>Return ID: {ret.id}</span>
                <span className="font-mono text-primary">{ret.agreement}</span>
              </div>
              <p className="text-muted-foreground">Customer: <strong>{ret.customer}</strong></p>
              <p className="text-muted-foreground">Equipment: {ret.equipment}</p>
              <div className="border-t border-amber-200/60 pt-2 space-y-1">
                <div className="flex justify-between font-bold text-rose-700 text-[13.5px]">
                  <span>Outstanding Return Due:</span>
                  <span>₹{currentPending.toLocaleString("en-IN")}</span>
                </div>
                {enteredAmount > 0 && liveRemaining > 0 && (
                  <div className="flex justify-between font-bold text-amber-800 text-[12.5px] bg-amber-100/70 px-2 py-1 rounded border border-amber-200/80">
                    <span>Remaining Due Balance:</span>
                    <span>₹{liveRemaining.toLocaleString("en-IN")}</span>
                  </div>
                )}
                {enteredAmount >= currentPending && currentPending > 0 && (
                  <div className="flex justify-between font-bold text-emerald-800 text-[12.5px] bg-emerald-100/70 px-2 py-1 rounded border border-emerald-200/80">
                    <span>Remaining Due Balance:</span>
                    <span>₹0 (Fully Settled)</span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Amount Collected (₹)</Label>
                <Input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="h-10 font-bold text-foreground"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Payment Date</Label>
                <Input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="h-10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Payment Mode</Label>
              <Select value={paymentMode} onValueChange={setPaymentMode}>
                <SelectTrigger className="h-9 text-[13px] bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Bank">Bank</SelectItem>
                  <SelectItem value="Cash+Bank">Cash + Bank</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Txn / Ref No. (Optional)</Label>
              <Input
                placeholder="UPI ref, cheque no, bank ref"
                value={txRef}
                onChange={(e) => setTxRef(e.target.value)}
                className="h-9 text-[13px]"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button">Cancel</Button>
            </DialogClose>
            <Button type="button" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold" onClick={handlePayDue} disabled={isSubmitting}>
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
              {enteredAmount >= currentPending || currentPending === 0
                ? "Record & Mark Fully Paid"
                : `Record Partial Payment (₹${enteredAmount.toLocaleString("en-IN")})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Compact single-line Final Settlement summary for the mobile return card —
// mirrors the same status logic used in the desktop table's "Final Settlement" column.
function getReturnSettlementDisplay(ret: any): { text: string; className: string } {
  if (ret.refund >= 0) {
    return {
      text: `₹${Math.abs(ret.refund).toLocaleString("en-IN")} (Refund)`,
      className: "text-emerald-600",
    };
  }
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

  if (status === "Paid") {
    return { text: `₹${totalDue.toLocaleString("en-IN")} (Paid)`, className: "text-emerald-600" };
  }
  if (status === "Partial") {
    return { text: `₹${pendingDue.toLocaleString("en-IN")} (Pending)`, className: "text-amber-600" };
  }
  return { text: `₹${totalDue.toLocaleString("en-IN")} (Collect)`, className: "text-rose-600" };
}

export const Route = createFileRoute("/returns")({
  head: () => ({ meta: [{ title: "Returns — Relife" }] }),
  component: ReturnsPage,
});


/** Rows rendered per page in the return history before "Load more". */
const RETURNS_PAGE_SIZE = 50;

function ReturnsPage() {
  const dbVersion = useDatabaseTrigger();
  const [rentals, setRentals] = useState(() => getRentals());
  const [mockReturns, setMockReturns] = useState(() => getReturns());
  const customers = useMemo(() => getCustomers(), [dbVersion]);
  const owners = useMemo(() => getOwners(), [dbVersion]);
  const [selectedAgreement, setSelectedAgreement] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [condition, setCondition] = useState("");
  const [damageCharges, setDamageCharges] = useState("0");
  const [finalRent, setFinalRent] = useState("0");
  const [pendingBalance, setPendingBalance] = useState("0");
  const [totalPaidAmount, setTotalPaidAmount] = useState("0");
  const [notes, setNotes] = useState("");
  const [collectedBy, setCollectedBy] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Track selected equipment items for return
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<string[]>([]);
  const [discount, setDiscount] = useState("0");
  const [duePaymentStatus, setDuePaymentStatus] = useState<"Paid" | "Partial" | "Not Paid">("Paid");
  const [duePaymentMode, setDuePaymentMode] = useState<string>("Cash");
  const [dueTxRef, setDueTxRef] = useState<string>("");
  const [duePaidAmount, setDuePaidAmount] = useState<string>("");
  const [dueCashAmount, setDueCashAmount] = useState<string>("");
  const [dueBankAmount, setDueBankAmount] = useState<string>("");
  const lastSelectedAgreementRef = useRef("");
  // H-5: the equipment id the QR scanner deep-linked in, held until the
  // agreement-change effect has had its say. Consumed once — a manual agreement
  // change afterwards still selects every unreturned item, as before.
  const scannedEquipmentRef = useRef<string | null>(null);

  const [historySearch, setHistorySearch] = useState("");
  // PERF: the field stays bound to historySearch so typing is instant; the
  // history filter (which joins each return against rentals and customers)
  // runs off the debounced copy.
  const debouncedHistorySearch = useDebounce(historySearch, 300);

  // Mobile-only: tracks which return row's WhatsApp / Pay Due dialog is open,
  // opened from the mobile card's kebab menu (dialogs are rendered once, outside the row loop).
  const [mobileWaReturn, setMobileWaReturn] = useState<any>(null);
  const [mobilePayDueReturn, setMobilePayDueReturn] = useState<any>(null);

  const isStaff = typeof window !== "undefined" && localStorage.getItem("medirent-user-role") === "Staff";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const agrId = params.get("agreementId");
    const eqId = params.get("equipmentId");
    if (agrId) {
      setSelectedAgreement(agrId);
      if (eqId) {
        // Setting selectedAgreement above triggers the agreement-change effect,
        // which used to overwrite this narrow selection with every unreturned
        // item on the agreement — so scanning one machine pre-ticked all of
        // them, and an operator who did not notice marked equipment returned
        // that was still with the customer. Stash it and let that effect honour
        // it instead.
        scannedEquipmentRef.current = eqId;
        setSelectedEquipmentIds([eqId]);
      }
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Scroll position preservation — prevent page jumping to top after dbVersion re-renders
  const scrollYRef = useRef(0);
  useEffect(() => {
    const onScroll = () => { scrollYRef.current = window.scrollY; };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const saved = scrollYRef.current;
    setRentals(getRentals());
    setMockReturns(getReturns());
    // Restore scroll position after React re-renders the updated list
    requestAnimationFrame(() => { window.scrollTo({ top: saved, behavior: "instant" as ScrollBehavior }); });
  }, [dbVersion]);

  const refresh = () => {
    setRentals(getRentals());
    setMockReturns(getReturns());
  };

  const selectedRental = rentals.find((r) => r.id === selectedAgreement);
  const selectedCustomer = useMemo(() => {
    if (!selectedRental) return null;
    return customers.find(
      (c) => c.id === selectedRental.customerId || (c.name && selectedRental.customer && c.name.toLowerCase() === selectedRental.customer.toLowerCase())
    );
  }, [selectedRental, customers]);
  // PERF FIX: Memoize equipment inventory — previously called getEquipment() on every render
  // which internally reads all rentals and equipment from localStorage on each cycle.
  const eqInventory = useMemo(() => getEquipment(), [dbVersion]);

  // Filters for Return History
  const [historyOwnerFilter, setHistoryOwnerFilter] = useState("all-owners");
  const [historyCategoryFilter, setHistoryCategoryFilter] = useState("all-categories");

  const activeOwners = Array.from(new Set(eqInventory.map((e) => e.owner).filter(Boolean)));
  const activeCategories = Array.from(new Set(eqInventory.map((e) => e.category).filter(Boolean)));

  const getReturnOwnerAndCategory = (ret: typeof mockReturns[number]) => {
    const eqIds = ret.returnedEquipmentIds || [];
    if (eqIds.length > 0) {
      const firstEq = eqInventory.find(e => e.id === eqIds[0]);
      if (firstEq) {
        const ownerObj = owners.find(o => o.name.toLowerCase() === firstEq.owner?.toLowerCase());
        return {
          owner: ownerObj?.ownerName || firstEq.owner || "In-House",
          category: firstEq.category || "Other"
        };
      }
    }
    const rental = rentals.find(r => r.id === ret.agreement);
    if (rental) {
      const eq = eqInventory.find(e => e.id === rental.equipmentId);
      if (eq) {
        const ownerObj = owners.find(o => o.name.toLowerCase() === eq.owner?.toLowerCase());
        return {
          owner: ownerObj?.ownerName || eq.owner || "In-House",
          category: eq.category || "Other"
        };
      }
    }
    return { owner: "Unknown", category: "Unknown" };
  };

  // ITEM-9: belt-and-braces - never render the same return record twice even if
  // storage or a Google Sheets pull hands us a repeated id.
  const uniqueReturns = useMemo(() => {
    const seen = new Set<string>();
    return mockReturns.filter((ret: any) => {
      if (!ret?.id || seen.has(ret.id)) return false;
      seen.add(ret.id);
      return true;
    });
  }, [mockReturns]);

  // PERF: index rentals/customers once instead of scanning both arrays for
  // every return on every keystroke.
  const rentalsById = useMemo(() => new Map<string, any>(rentals.map((r: any) => [r.id, r])), [rentals]);
  const customersByName = useMemo(() => {
    const map = new Map<string, any>();
    for (const c of customers) {
      const key = String(c.name || "").toLowerCase();
      if (key && !map.has(key)) map.set(key, c);
    }
    return map;
  }, [customers]);
  const customersById = useMemo(() => new Map<string, any>(customers.map((c: any) => [c.id, c])), [customers]);

  const filteredReturns = useMemo(() => sortLatestFirst(
    uniqueReturns.filter((ret) => {
      const info = getReturnOwnerAndCategory(ret);
      const matchesOwner = historyOwnerFilter === "all-owners" || info.owner === historyOwnerFilter;
      const matchesCategory = historyCategoryFilter === "all-categories" || info.category === historyCategoryFilter;
      
      const rental = rentalsById.get(ret.agreement);
      const customer =
        customersByName.get(String(ret.customer || "").toLowerCase()) ||
        (rental ? customersById.get(rental.customerId) : undefined);

      // Search query filter
      const searchLower = debouncedHistorySearch.toLowerCase().trim();
      const matchesSearch = !searchLower || 
        // H-3: every one of these had to be String()-wrapped like the guarded
        // lines below. A return row whose customer / equipment / agreement cell
        // is absent — edited by hand in the spreadsheet, or written by an older
        // build — threw TypeError here on the first keystroke, inside a useMemo
        // that runs during render, taking the whole Returns route down.
        String(ret.id || "").toLowerCase().includes(searchLower) ||
        String(ret.customer || "").toLowerCase().includes(searchLower) ||
        String(ret.equipment || "").toLowerCase().includes(searchLower) ||
        String(ret.agreement || "").toLowerCase().includes(searchLower) ||
        (rental && String(rental.serial || "").toLowerCase().includes(searchLower)) ||
        (customer && (
          String(customer.phone || "").toLowerCase().includes(searchLower) ||
          String(customer.altPhone || "").toLowerCase().includes(searchLower) ||
          String(customer.contactNumber3 || "").toLowerCase().includes(searchLower)
        ));

      return matchesOwner && matchesCategory && matchesSearch;
    }),
    "date"
  ), [uniqueReturns, historyOwnerFilter, historyCategoryFilter, debouncedHistorySearch, rentalsById, customersByName, customersById, eqInventory, owners]);

  // PERF: mount a page of history rows at a time.
  const [historyVisibleCount, setHistoryVisibleCount] = useState(RETURNS_PAGE_SIZE);
  useEffect(() => {
    setHistoryVisibleCount(RETURNS_PAGE_SIZE);
  }, [debouncedHistorySearch, historyOwnerFilter, historyCategoryFilter]);
  const visibleReturns = useMemo(
    () => filteredReturns.slice(0, historyVisibleCount),
    [filteredReturns, historyVisibleCount]
  );
  const hasMoreReturns = filteredReturns.length > historyVisibleCount;
  
  // ITEM-9 FIX: the picker labelled every option `Customer - Phone - Rent Date`,
  // with no agreement id. A customer with more than one open agreement - which
  // any partial return produces, since processing one splits the remainder onto
  // a fresh agreement - therefore rendered two or more visually identical rows.
  // Label each option with its own agreement id and equipment, and key the list
  // by id so a repeated record can never contribute two entries.
  const agreementOptions = useMemo(() => {
    const seen = new Set<string>();
    return rentals
      .filter((r) => r.status !== "Completed" && r.status !== "Cancelled")
      .filter((r) => {
        if (!r.id || seen.has(r.id)) return false;
        seen.add(r.id);
        return true;
      })
      .map((r) => {
        const cust = customers.find(
          (c) => c.id === r.customerId || (c.name && r.customer && c.name.toLowerCase() === r.customer.toLowerCase())
        );
        const phone1 = r.phone || cust?.phone || "";
        const phone2 = r.altPhone || cust?.altPhone || "";
        const phone3 = r.contactNumber3 || cust?.contactNumber3 || "";
        const phones = [phone1, phone2, phone3].filter(Boolean).join(" ");
        const rentDateStr = r.start ? formatDateDDMMYYYY(r.start) : "";

        // Only the equipment still out on this agreement - that is what a
        // return is actually about, and it is what tells two split agreements
        // for the same customer apart at a glance.
        const openItems = Array.isArray(r.equipmentItems)
          ? r.equipmentItems.filter((it: any) => !it.returned)
          : [];
        const equipmentSummary = openItems.length > 0
          ? openItems
              .map((it: any) => {
                const eq = eqInventory.find((e) => e.id === it.equipmentId);
                return formatEquipmentLabel({
                  name: it.name || eq?.name || eq?.category,
                  model: it.model || eq?.model,
                  serial: it.serial || eq?.serial,
                });
              })
              .join(", ")
          : (r.equipment || "");

        const parts = [
          r.customer,
          rentDateStr ? `Rent Date: ${rentDateStr}` : "",
          phone1,
        ].filter(Boolean);

        return {
          value: r.id,
          label: parts.join(" - "),
          searchTerms: `${r.id} ${r.customerId || ""} ${r.customer || ""} ${phones} ${r.equipment || ""} ${r.serial || ""} ${rentDateStr} ${equipmentSummary}`,
        };
      });
  }, [rentals, customers, eqInventory]);

  const getEquipmentName = (eqId: string) => {
    const eq = eqInventory.find((e) => e.id === eqId);
    return eq ? eq.name : "Unknown Equipment";
  };

  // ITEM-9 FIX: one card per physical unit. equipmentItems can carry the same
  // equipmentId twice - a legacy `equipmentId` string like "EQ-1, EQ-1" expands
  // to two entries during the getRentals() migration, and re-adding an item to
  // an existing agreement appends rather than replaces. Both rendered duplicate
  // checkboxes under the same React key. Collapse by equipmentId, preferring the
  // entry that is still out over one already marked returned.
  const rentalEquipments = useMemo(() => {
    if (!selectedRental) return [];
    const raw: any[] = selectedRental.equipmentItems && selectedRental.equipmentItems.length > 0
      ? selectedRental.equipmentItems
      : [
          {
            equipmentId: selectedRental.equipmentId,
            serial: selectedRental.serial,
            monthlyRent: cleanNum(selectedRental.monthlyRent),
            deposit: cleanNum(selectedRental.deposit),
            returned: false,
          },
        ];

    const byId = new Map<string, any>();
    for (const item of raw) {
      const key = String(item?.equipmentId || "").trim();
      if (!key) continue;
      const existing = byId.get(key);
      if (!existing) {
        byId.set(key, item);
      } else if (existing.returned && !item.returned) {
        byId.set(key, item);
      }
    }
    return Array.from(byId.values());
  }, [selectedRental]);

  const agreementPayments = useMemo(() => {
    if (!selectedRental) return [];
    return getPayments().filter(p => p.agreement === selectedRental.id && p.status === "Paid");
  }, [selectedRental, dbVersion]);

  useEffect(() => {
    if (selectedAgreement !== lastSelectedAgreementRef.current) {
      lastSelectedAgreementRef.current = selectedAgreement;
      if (selectedRental) {
        setReturnDate(getLocalYYYYMMDD());
        setDamageCharges("0");
        setCondition("Good");
        setDuePaymentStatus("Paid");
        setDuePaymentMode("Cash");
        setDueTxRef("");
        setCollectedBy("");
        
        const activeIds = rentalEquipments
          .filter((item: any) => !item.returned)
          .map((item: any) => item.equipmentId);
        // H-5: a QR scan names one specific machine — respect it.
        const scanned = scannedEquipmentRef.current;
        setSelectedEquipmentIds(
          scanned && activeIds.includes(scanned) ? [scanned] : activeIds
        );
        scannedEquipmentRef.current = null;
      } else {
        setReturnDate("");
        setFinalRent("");
        setDamageCharges("");
        setPendingBalance("");
        setTotalPaidAmount("");
        setSelectedEquipmentIds([]);
        setCollectedBy("");
        setDuePaymentStatus("Paid");
        setDuePaymentMode("Cash");
        setDueTxRef("");
      }
    }
  }, [selectedAgreement, selectedRental]);

  useEffect(() => {
    if (selectedRental && returnDate) {
      const start = parseLocalDate(selectedRental.start);
      const actualEnd = parseLocalDate(returnDate);

      if (!isNaN(start.getTime()) && !isNaN(actualEnd.getTime())) {
        if (actualEnd < start) {
          setFinalRent("0");
          setPendingBalance("0");
          setTotalPaidAmount("0");
          return;
        }

        const diffTimeUsed = actualEnd.getTime() - start.getTime();
        // Bug 11 fix: same-day rental counts as 1 day (not 0)
        const daysUsed = Math.max(1, Math.ceil(diffTimeUsed / (1000 * 60 * 60 * 24)));

        const returningItems = rentalEquipments.filter((item: any) => selectedEquipmentIds.includes(item.equipmentId) && !item.returned);

        const calculatedFinalRent = returningItems.reduce((sum: number, item: any) => {
          // ITEM-10 FIX: bill on the cycle the agreement was actually written on.
          // This used to infer the cycle from `monthlyRent > 0`; agreements saved
          // through the edit form carry BOTH a monthlyRent and a dailyRent, so a
          // daily rental was silently billed at the monthly slab rate (and vice
          // versa once rentCycle was lost). The explicit field wins, with the old
          // inference kept only for line items written before it existed.
          const monthlyRent = cleanNum(item.monthlyRent);
          const dailyRate = cleanNum(item.dailyRent || item.rentRate);
          const cycle = item.rentCycle || (selectedRental as any).rentCycle;
          const isMonthly = cycle ? cycle === "Monthly" : (monthlyRent > 0 && dailyRate === 0);

          // Per-item start date where one exists (an item swapped in mid-term by
          // an exchange starts billing from the swap, not from the agreement).
          const itemStart = item.startDate || item.start || selectedRental.start;
          const itemStartDate = parseLocalDate(itemStart);
          const itemDaysUsed = !isNaN(itemStartDate.getTime()) && itemStartDate <= actualEnd
            ? Math.max(1, Math.ceil((actualEnd.getTime() - itemStartDate.getTime()) / (1000 * 60 * 60 * 24)))
            : daysUsed;

          if (!isMonthly) {
            return sum + (itemDaysUsed * dailyRate);
          }
          return sum + getReturnCalculatedRentPerItem(monthlyRent, itemDaysUsed, itemStart, returnDate);
        }, 0);

        const rentPaidForReturningItems = returningItems.reduce((sum: number, item: any) => {
          return sum + getPaidForEquipment(selectedRental, item.equipmentId, getPayments());
        }, 0);

        const calculatedPendingBalance = Math.max(0, calculatedFinalRent - rentPaidForReturningItems);

        setFinalRent(calculatedFinalRent.toString());
        setPendingBalance(calculatedPendingBalance.toString());
        setTotalPaidAmount(rentPaidForReturningItems.toString());
      }
    }
  }, [selectedRental, returnDate, selectedEquipmentIds, dbVersion]);

  const returningItems = rentalEquipments.filter((item: any) => selectedEquipmentIds.includes(item.equipmentId) && !item.returned);
  const returnedNames = returningItems
    .map((item: any) => getEquipment().find((e) => e.id === item.equipmentId)?.name || item.equipmentId)
    .join(", ") || selectedRental?.equipment || "Unknown Equipment";

  const allItems = selectedRental?.equipmentItems || rentalEquipments;
  const totalAllItemsDeposit = allItems.reduce((sum: number, item: any) => sum + cleanNum(item.deposit), 0) || cleanNum(selectedRental?.deposit);
  const returningItemsDeposit = returningItems.reduce((sum: number, item: any) => sum + cleanNum(item.deposit), 0);

  let deposit = returningItemsDeposit;
  if (selectedRental && (selectedRental as any).depositPaidAmount !== undefined && (selectedRental as any).depositPaidAmount !== null) {
    const paidDep = cleanNum((selectedRental as any).depositPaidAmount);
    const isFullyPaid = selectedRental.depositPaymentStatus === "Paid" || paidDep >= totalAllItemsDeposit;

    if (isFullyPaid) {
      deposit = returningItemsDeposit;
    } else if (totalAllItemsDeposit > 0) {
      const ratio = returningItemsDeposit / totalAllItemsDeposit;
      deposit = Math.min(returningItemsDeposit, Math.round(paidDep * ratio));
    }
  }

  const dmg = cleanNum(damageCharges);
  const disc = cleanNum(discount);
  const pend = cleanNum(pendingBalance);
  const fRent = cleanNum(finalRent);

  const unpaidItems = selectedRental && selectedRental.additionalItems 
    ? (selectedRental.additionalItems as any[]).filter(
        (item) => item.selected && item.status === "Not Paid"
      )
    : [];
  const unpaidAccessoryTotal = unpaidItems.reduce(
    (sum: number, item: any) => sum + (Number(item.amount) || 0),
    0
  );

  const paidAmt = cleanNum(totalPaidAmount);

  // ITEM-10 FIX: the settlement is now derived once, here, in the same steps the
  // Reconciliation Ledger displays. Previously the ledger computed
  // `max(0, totalDue - discount)` while the recorded `netRefund` used a separate
  // `deposit - dmg - pend + disc - accessories` expression, so the two disagreed:
  //   * a discount larger than the amount owed turned into a cash refund the
  //     ledger never showed (a discount can only reduce a due, never create a
  //     refund), and
  //   * the number printed on the receipt and saved to the return record was not
  //     the number the operator had just read off the screen.
  //
  //   Rent still owed  = rent charged for the returning items - rent already paid
  //   Rent overpaid    = the reverse, credited back against the deposit
  //   Total due        = rent owed + damage + unpaid accessories
  //   Discount         = applied to that due, capped at it
  //   Settlement       = deposit held + rent overpaid - due remaining
  //                      (positive = refund to customer, negative = collect)
  const remainingRentDues = Math.max(0, fRent - paidAmt);
  const rentOverpaid = Math.max(0, paidAmt - fRent);
  const totalDueBeforeDiscount = remainingRentDues + dmg + unpaidAccessoryTotal;
  const effectiveDiscount = Math.min(Math.max(0, disc), totalDueBeforeDiscount);
  const afterDiscountTotalDue = totalDueBeforeDiscount - effectiveDiscount;
  const netRefund = deposit + rentOverpaid - afterDiscountTotalDue;

  // Lower bound: a return cannot predate the agreement it settles.
  const isDateBeforeStart = selectedRental && returnDate
    ? parseLocalDate(returnDate) < parseLocalDate(selectedRental.start)
    : false;
  // Upper bound: only the lower bound was checked, so a return dated years
  // ahead was accepted — it set rental.end to that date and drove
  // getReturnCalculatedRentPerItem to bill the whole intervening period.
  const isDateInFuture = returnDate
    ? parseLocalDate(returnDate) > parseLocalDate(getLocalYYYYMMDD())
    : false;
  const isDateInvalid = isDateBeforeStart || isDateInFuture;
  const dateInvalidReason = isDateBeforeStart
    ? "Return date cannot be earlier than the rental start date."
    : isDateInFuture
      ? "Return date cannot be in the future."
      : "";

  // H-2: setStorageItem re-throws on QuotaExceededError so callers can react.
  // Without a guard the throw escaped this handler with isSubmitting still true,
  // and the Process Return button — disabled on that flag — stayed dead until a
  // page reload. The same failure was already diagnosed and fixed in
  // customers.tsx; this is the same remedy.
  //
  // The work is kept in its own function rather than wrapped in a try block
  // in place: this body is ~180 statements, and putting all of them inside a
  // try made every one a throw point in TypeScript's control-flow graph, which
  // blew the compiler's memory budget. A separate function is its own flow
  // scope, so the checker stays fast.
  const handleProcessReturn = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      runProcessReturn();
    } catch (err) {
      reportError(err, { action: "handleProcessReturn", agreement: selectedAgreement });
      toast.error("Could not save this return — nothing was charged.", {
        description: err instanceof Error ? err.message : String(err),
        duration: 12000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const runProcessReturn = () => {
    if (!selectedAgreement || !returnDate || !condition) {
      toast.error("Please fill in Agreement, Return Date, and Condition before processing.");
      setIsSubmitting(false);
      return;
    }

    if (isDateInvalid) {
      toast.error(dateInvalidReason);
      return;
    }

    if (selectedEquipmentIds.length === 0) {
      toast.error("Please select at least one equipment item to return.");
      setIsSubmitting(false);
      return;
    }

    const outstandingPayable = Math.max(0, -netRefund);

    let actualPaidAmount = 0;
    if (outstandingPayable > 0) {
      if (duePaymentStatus === "Paid") {
        actualPaidAmount = outstandingPayable;
      } else if (duePaymentStatus === "Partial") {
        const inputPaid = cleanNum(duePaidAmount);
        actualPaidAmount = Math.min(outstandingPayable, Math.max(0, inputPaid));
      } else {
        actualPaidAmount = 0;
      }
    }
    const remainingPendingDue = Math.max(0, outstandingPayable - actualPaidAmount);

    const newReturn = {
      id: getNextReturnNumber(),
      date: returnDate,
      agreement: selectedAgreement,
      customer: selectedRental?.customer || "Unknown",
      customerId: selectedRental?.customerId || "",
      equipment: returnedNames || "Unknown Equipment",
      condition: condition,
      deposit: deposit,
      damageCharges: dmg,
      // ITEM-10: record the discount that was actually applied, capped at the
      // amount owed - not the raw figure typed in.
      discount: effectiveDiscount,
      finalRent: fRent,
      pendingBalance: pend,
      refund: netRefund,
      status: "Pending Approval",
      returnedEquipmentIds: selectedEquipmentIds,
      unpaidAccessoryTotal: unpaidAccessoryTotal,
      collectedBy: collectedBy,
      duePaymentStatus: outstandingPayable > 0 ? (actualPaidAmount >= outstandingPayable ? "Paid" : actualPaidAmount > 0 ? "Partial" : "Not Paid") : "Paid",
      duePaymentMode: outstandingPayable > 0 && actualPaidAmount > 0 ? duePaymentMode : undefined,
      dueTxRef: outstandingPayable > 0 && actualPaidAmount > 0 ? dueTxRef : undefined,
      duePaidAmount: actualPaidAmount,
      duePendingBalance: remainingPendingDue,
    };

    const saveResult = saveReturn(newReturn) as any;

    if (outstandingPayable > 0) {
      if (actualPaidAmount > 0) {
        if (duePaymentMode === "Cash+Bank") {
          let cashAmt = cleanNum(dueCashAmount);
          let bankAmt = cleanNum(dueBankAmount);
          if (cashAmt + bankAmt !== actualPaidAmount) {
            bankAmt = Math.max(0, actualPaidAmount - cashAmt);
          }
          const settlementEqId = returningItems.length === 1 ? returningItems[0].equipmentId : undefined;
          if (cashAmt > 0) {
            savePayment({
              id: getNextPaymentNumber(),
              date: returnDate,
              customer: selectedRental?.customer || "Unknown Customer",
              customerId: selectedRental?.customerId || "",
              agreement: selectedAgreement,
              equipmentId: settlementEqId,
              amount: cashAmt,
              mode: "Cash",
              type: "Rent" as const,
              notes: `Return settlement (Cash portion of ₹${actualPaidAmount.toLocaleString("en-IN")} payment on return of: ${returnedNames})`,
              status: "Paid" as const,
            });
          }
          if (bankAmt > 0) {
            savePayment({
              id: getNextPaymentNumber(),
              date: returnDate,
              customer: selectedRental?.customer || "Unknown Customer",
              customerId: selectedRental?.customerId || "",
              agreement: selectedAgreement,
              equipmentId: settlementEqId,
              amount: bankAmt,
              mode: "Bank",
              type: "Rent" as const,
              txRef: dueTxRef,
              notes: `Return settlement (Bank portion of ₹${actualPaidAmount.toLocaleString("en-IN")} payment on return of: ${returnedNames})`,
              status: "Paid" as const,
            });
          }
        } else {
          const settlementEqId = returningItems.length === 1 ? returningItems[0].equipmentId : undefined;
          savePayment({
            id: getNextPaymentNumber(),
            date: returnDate,
            customer: selectedRental?.customer || "Unknown Customer",
            customerId: selectedRental?.customerId || "",
            agreement: selectedAgreement,
            equipmentId: settlementEqId,
            amount: actualPaidAmount,
            mode: duePaymentMode as any,
            type: "Rent" as const,
            txRef: dueTxRef,
            notes: `Return settlement (${duePaymentStatus === "Partial" ? "Partial Payment" : "Full Payment"} on return of: ${returnedNames})`,
            status: "Paid" as const,
          });
        }
      }

      if (remainingPendingDue > 0) {
        savePayment({
          id: getNextPaymentNumber(),
          date: returnDate,
          customer: selectedRental?.customer || "Unknown Customer",
          customerId: selectedRental?.customerId || "",
          agreement: selectedAgreement,
          amount: remainingPendingDue,
          mode: (duePaymentMode === "Cash+Bank" ? "Bank" : duePaymentMode) as any,
          type: "Rent" as const,
          notes: `Outstanding remaining pending due balance on return of: ${returnedNames}. (Total Due: ₹${outstandingPayable}, Paid: ₹${actualPaidAmount}, Pending: ₹${remainingPendingDue})`,
          status: "Not Paid" as const,
        });
      }
    }

    // Inform user of successful return and amount settled
    const formattedTotalDues = outstandingPayable.toLocaleString("en-IN");
    const formattedPaid = actualPaidAmount.toLocaleString("en-IN");
    const formattedPending = remainingPendingDue.toLocaleString("en-IN");
    const formattedRefund = Math.abs(netRefund).toLocaleString("en-IN");

    if (saveResult && saveResult.newAgreementId) {
      if (outstandingPayable > 0) {
        if (actualPaidAmount >= outstandingPayable) {
          toast.success(`Return processed! Received full payment of ₹${formattedPaid} via ${duePaymentMode}. Remaining items split into new agreement ${saveResult.newAgreementId}.`);
        } else if (actualPaidAmount > 0) {
          toast.success(`Return processed! Received partial payment of ₹${formattedPaid} (${duePaymentMode}). Remaining pending due of ₹${formattedPending} recorded in Rent Dues.`);
        } else {
          toast.warning(`Return processed! Unpaid due of ₹${formattedTotalDues} recorded in Rent Dues. Remaining items split into new agreement ${saveResult.newAgreementId}.`);
        }
      } else if (netRefund > 0) {
        toast.success(`Return processed successfully! Refunded total amount: ₹${formattedRefund}. Remaining items split into new agreement ${saveResult.newAgreementId}.`);
      } else {
        toast.success(`Return processed successfully! Remaining items split into new agreement ${saveResult.newAgreementId}.`);
      }
    } else {
      if (outstandingPayable > 0) {
        if (actualPaidAmount >= outstandingPayable) {
          toast.success(`Return processed! Received full payment of ₹${formattedPaid} (${duePaymentMode}) for ${selectedRental?.customer || "customer"}.`);
        } else if (actualPaidAmount > 0) {
          toast.success(`Return processed! Received partial payment of ₹${formattedPaid} (${duePaymentMode}). Pending balance of ₹${formattedPending} recorded.`);
        } else {
          toast.warning(`Return processed! Unpaid due of ₹${formattedTotalDues} recorded as pending for ${selectedRental?.customer || "customer"}.`);
        }
      } else if (netRefund > 0) {
        toast.success(`Return processed successfully! Refunded total amount: ₹${formattedRefund} for ${selectedRental?.customer || "customer"}.`);
      } else {
        toast.success(`Return processed successfully for ${selectedRental?.customer || "customer"}!`);
      }
    }
    setSubmitted(true);
    refresh();
    setSelectedAgreement("");
    setCollectedBy(typeof window !== "undefined" ? (localStorage.getItem("medirent-user-name") || "") : "");
  };

  const handleGenerateReceipt = () => {
    if (!selectedAgreement || !selectedRental) {
      toast.error("Please select an agreement first.");
      return;
    }
    if (isDateInvalid) {
      toast.error(dateInvalidReason);
      return;
    }
    if (selectedEquipmentIds.length === 0) {
      toast.error("Please select at least one equipment item to return.");
      return;
    }
    const returnedNames = returningItems.map((item: any) => getEquipmentName(item.equipmentId)).join(", ");
    const tempReturn = {
      id: peekNextReturnNumber(),
      date: returnDate || getLocalYYYYMMDD(),
      agreement: selectedAgreement,
      customer: selectedRental.customer || "Unknown",
      equipment: returnedNames || "Unknown Equipment",
      condition: condition || "Good",
      deposit: deposit,
      damageCharges: dmg,
      // ITEM-10: the preview receipt omitted the discount entirely, so it
      // printed a different settlement from the one on screen.
      discount: effectiveDiscount,
      finalRent: fRent,
      pendingBalance: pend,
      refund: netRefund,
      status: "Pending Approval",
      returnedEquipmentIds: selectedEquipmentIds,
      unpaidAccessoryTotal: unpaidAccessoryTotal,
      collectedBy: collectedBy,
    };
    printReturnReceipt(tempReturn);
    toast.success(`Receipt print preview opened for ${selectedRental.customer}`);
  };

  // Metric aggregates for top cards
  const pendingApprovalsCount = mockReturns.filter(r => r.status === "Pending Approval").length;
  const approvedReturnsCount = mockReturns.filter(r => r.status === "Completed" || r.status === "Approved").length;
  
  const getCustomerInitials = (name: string) => {
    if (!name) return "CR";
    return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
  };

  return (
    <AppShell title="Equipment Returns" subtitle="Process returns, audit dues & reconcile security deposits">
      <div className="space-y-6 max-w-7xl mx-auto">
        

        {/* Refund Processing Card */}
        <Card className="overflow-hidden shadow-card border-border/50 relative bg-gradient-to-b from-card to-card/95">

          
          <CardContent className="p-6 space-y-6.5">
            
            {/* Input Row 1: Pick Agreement, return date, and equipment condition */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div className="lg:col-span-2 space-y-1.5">
                <FieldLabel>Rental Agreement Number</FieldLabel>
                <Combobox
                  value={selectedAgreement}
                  onValueChange={setSelectedAgreement}
                  placeholder="Type or select rental agreement..."
                  searchPlaceholder="Search agreement id, customer name, contact number..."
                  emptyText="No matching rentals found."
                  options={agreementOptions}
                />
              </div>

              <div className="space-y-1.5">
                <FieldLabel>Actual Return Date</FieldLabel>
                <div className="relative">
                  <Input
                    type="date"
                    className={`h-10 text-[13px] pl-9 ${isDateInvalid ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                  />
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/60" />
                </div>
                {isDateInvalid && (
                  <p className="text-[11px] text-destructive font-medium mt-1 animate-[fade-in_0.2s_ease-out]">
                    Cannot be earlier than start date ({selectedRental?.start ? formatDateDDMMYYYY(selectedRental.start) : ""})
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <FieldLabel>Condition Assessment</FieldLabel>
                <div className="grid grid-cols-2 gap-1.5 bg-muted/40 p-1.5 rounded-lg border border-border/30 h-10">
                  <button
                    type="button"
                    onClick={() => setCondition("Good")}
                    disabled={!selectedAgreement}
                    className={`flex items-center justify-center gap-1.5 rounded-md text-[11.5px] font-bold transition-all disabled:opacity-40 ${condition === "Good" ? "bg-background text-emerald-600 shadow-soft border border-emerald-500/10" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Good</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCondition("UnderMaintenance")}
                    disabled={!selectedAgreement}
                    className={`flex items-center justify-center gap-1.5 rounded-md text-[11.5px] font-bold transition-all disabled:opacity-40 ${condition === "UnderMaintenance" ? "bg-background text-amber-600 shadow-soft border border-amber-500/10" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    <Activity className="h-3.5 w-3.5" />
                    <span>Service</span>
                  </button>
                </div>
              </div>
            </div>

                        {/* Slide-in Agreement Customer Profile Summary & Checklist with Payment History */}
            {selectedRental && (
              <div className="grid gap-5 lg:grid-cols-12 items-start animate-[slide-up_0.3s_ease-out]">
                {/* Left Column: Customer details, Equipment check, Adjustments, Calculations (col-span-7) */}
                <div className="lg:col-span-7 space-y-4">
                  {/* Compact Customer Info Row */}
                  <div className="rounded-xl border border-border/40 bg-muted/15 py-2 px-3 flex flex-wrap items-center justify-between gap-3 text-[11.5px] text-muted-foreground font-semibold">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">{selectedRental.customer}</span>
                      <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-primary/10 text-primary border border-primary/20">{selectedRental.id}</span>
                      <StatusBadge status={selectedRental.status} />
                    </div>
                    {(() => {
                      const p1 = selectedCustomer?.phone || (selectedRental as any)?.phone || "";
                      const p2 = selectedCustomer?.altPhone || (selectedRental as any)?.altPhone || "";
                      const p3 = selectedCustomer?.contactNumber3 || (selectedRental as any)?.contactNumber3 || "";
                      const phones = [p1, p2, p3].filter(Boolean).join(", ");
                      const custAddr = selectedCustomer?.address || (selectedRental as any)?.address || "";
                      const custArea = selectedCustomer?.area || (selectedRental as any)?.area || "";
                      const custCity = selectedCustomer?.city || (selectedRental as any)?.city || "";
                      const custState = selectedCustomer?.state || (selectedRental as any)?.state || "";
                      const custPincode = selectedCustomer?.pincode || (selectedRental as any)?.pincode || "";

                      const addrParts = [custAddr, custArea, custCity, custState].filter(Boolean);
                      let addr = addrParts.join(", ");
                      if (custPincode) {
                        addr = addr ? `${addr} - ${custPincode}` : custPincode;
                      }
                      return (
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                          {phones && <span>Contact: <span className="text-foreground/80 font-bold">{phones}</span></span>}
                          {addr && <span>Address: <span className="text-foreground/80 font-medium">{addr}</span></span>}
                          <span>Start: <span className="text-foreground/80 font-bold">{formatDateDDMMYYYY(selectedRental.start)}</span> to <span className="text-foreground/80 font-bold">{returnDate ? formatDateDDMMYYYY(returnDate) : "—"}</span></span>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Select Equipment Checklist Grid */}
                  <div className="space-y-2 border border-border/60 bg-muted/10 p-3.5 rounded-xl">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Select Equipment to Return
                      </Label>
                      <span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
                        {selectedEquipmentIds.length} of {rentalEquipments.filter((it: any) => !it.returned).length || rentalEquipments.length} Selected
                      </span>
                    </div>
                    
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {rentalEquipments.map((item: any) => {
                        const isReturned = item.returned;
                        const eqName = getEquipmentName(item.equipmentId);
                        const isChecked = !isReturned && selectedEquipmentIds.includes(item.equipmentId);

                        const eqItem = eqInventory.find(e => e.id === item.equipmentId);
                        const modelNo = eqItem?.model || "Not Set";
                        const ownerObj = owners.find(o => o.name.toLowerCase() === eqItem?.owner?.toLowerCase());
                        const ownerName = ownerObj?.ownerName || eqItem?.owner || "Not Set";
                        const isMonthly = cleanNum(item.monthlyRent) > 0;
                        const rentRate = isMonthly ? cleanNum(item.monthlyRent) : cleanNum(item.dailyRent || item.rentRate);
                        const rentCycleLabel = isMonthly ? "mo" : "day";
                        const isRentPaid = selectedRental.rentalPaymentStatus === "Paid";
                        const rentPaidText = selectedRental.rentalPaymentStatus || "Not Paid";
                        const isDepositPaid = selectedRental.depositPaymentStatus === "Paid";
                        const depositPaidText = selectedRental.depositPaymentStatus || "Not Paid";

                        return (
                          <div 
                            key={item.equipmentId} 
                            onClick={() => {
                              if (isReturned) return;
                              if (selectedEquipmentIds.includes(item.equipmentId)) {
                                setSelectedEquipmentIds(selectedEquipmentIds.filter(id => id !== item.equipmentId));
                              } else {
                                setSelectedEquipmentIds([...selectedEquipmentIds, item.equipmentId]);
                              }
                            }}
                            className={`group flex items-start gap-2.5 p-3 rounded-xl border text-[11px] transition-all cursor-pointer relative overflow-hidden select-none ${
                              isReturned 
                                ? "bg-muted/15 border-border/30 opacity-55 cursor-not-allowed" 
                                : isChecked
                                  ? "bg-primary/5 border-primary/50 shadow-soft ring-1 ring-primary/10"
                                  : "bg-background border-border hover:border-primary/40 hover:shadow-soft"
                            }`}
                          >
                            {!isReturned && (
                              <div className={`h-4 w-4 rounded border flex items-center justify-center mt-0.5 shrink-0 transition-all ${
                                isChecked 
                                  ? "bg-primary border-primary text-primary-foreground" 
                                  : "border-border bg-background group-hover:border-primary/50"
                              }`}>
                                {isChecked && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                              </div>
                            )}

                            <div className="flex-1 min-w-0 space-y-0.5">
                              <span className={`block font-bold text-[11.5px] truncate ${isReturned ? "text-muted-foreground line-through" : "text-foreground"}`}>
                                {eqName}
                              </span>
                              
                              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                                <div className="flex items-center justify-between gap-1 overflow-hidden">
                                  <span>Serial:</span>
                                  <span className="font-mono font-bold text-foreground/90 truncate">{item.serial || "Not Set"}</span>
                                </div>
                                <div className="flex items-center justify-between gap-1 overflow-hidden">
                                  <span>Model:</span>
                                  <span className="font-semibold text-foreground/90 truncate">{modelNo}</span>
                                </div>
                              </div>

                              <div className="mt-1.5 pt-1.5 border-t border-border/40 space-y-0.5 text-[9.5px]">
                                <div className="flex justify-between items-center">
                                  <span>Rent: <span className="font-bold text-foreground/80">₹{rentRate.toLocaleString("en-IN")}/{rentCycleLabel}</span></span>
                                  <span className={`px-1 rounded-[3px] text-[8.5px] font-black ${isRentPaid ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"}`}>
                                    {rentPaidText}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span>Deposit: <span className="font-bold text-foreground/80">₹{cleanNum(item.deposit).toLocaleString("en-IN")}</span></span>
                                  <span className={`px-1 rounded-[3px] text-[8.5px] font-black ${isDepositPaid ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"}`}>
                                    {depositPaidText}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {isReturned && (() => {
                              const retRecord = mockReturns.find(r => 
                                (r.returnedEquipmentIds && r.returnedEquipmentIds.includes(item.equipmentId)) ||
                                (r.agreement === selectedRental.id)
                              );
                              const retDateRaw = item.returnedDate || item.returnDate || retRecord?.date || selectedRental.end;
                              const formattedRetDate = retDateRaw ? formatDateDDMMYYYY(retDateRaw) : "";
                              return (
                                <span className="absolute top-1 right-1 text-[8.5px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1 py-0.2 rounded">
                                  Returned {formattedRetDate ? `on ${formattedRetDate}` : ""}
                                </span>
                              );
                            })()}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Adjustment Controls */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Sliders className="h-3.5 w-3.5 text-primary" />
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Adjustment Controls
                      </Label>
                    </div>
                    
                    <div className="grid gap-2.5 grid-cols-2 sm:grid-cols-4 bg-muted/20 p-3 rounded-xl border border-border/40">
                      {/* Duration */}
                      <div className="bg-background rounded-lg p-2.5 border border-border flex flex-col justify-between h-[68px]">
                        <div className="h-6 flex items-center">
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground leading-tight">Duration</Label>
                        </div>
                        <div className="text-[11.5px] font-bold text-foreground h-7 flex items-center px-2 bg-muted/30 rounded border border-border/50 truncate">
                          {selectedRental ? formatRentalDuration(selectedRental.start, returnDate, rentalEquipments[0]?.rentCycle) : "0 Days"}
                        </div>
                      </div>

                      {/* Total Rent Payable */}
                      <div className="bg-background rounded-lg p-2.5 border border-border flex flex-col justify-between h-[68px]">
                        <div className="h-6 flex items-center">
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground leading-tight">Total Rent Payable</Label>
                        </div>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1.5 text-[11px] font-bold text-muted-foreground">₹</span>
                          <Input
                            placeholder="0.00"
                            className="h-9 pl-6 pr-1 text-[11px] font-semibold border-border focus-visible:ring-primary/20"
                            value={finalRent}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFinalRent(val);
                              const fRentNum = cleanNum(val);
                              const paidNum = cleanNum(totalPaidAmount);
                              setPendingBalance(Math.max(0, fRentNum - paidNum).toString());
                            }}
                          />
                        </div>
                      </div>

                      {/* Total Rent Paid */}
                      <div className="bg-background rounded-lg p-2.5 border border-border flex flex-col justify-between h-[68px]">
                        <div className="h-6 flex items-center">
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground leading-tight">Total Rent Paid</Label>
                        </div>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1.5 text-[11px] font-bold text-muted-foreground">₹</span>
                          <Input
                            placeholder="0.00"
                            className="h-9 pl-6 pr-1 text-[11px] font-semibold border-border focus-visible:ring-primary/20"
                            value={totalPaidAmount}
                            onChange={(e) => {
                              const val = e.target.value;
                              setTotalPaidAmount(val);
                              const fRentNum = cleanNum(finalRent);
                              const paidNum = cleanNum(val);
                              setPendingBalance(Math.max(0, fRentNum - paidNum).toString());
                            }}
                          />
                        </div>
                      </div>

                      {/* Outstanding Rent Due */}
                      <div className="bg-background rounded-lg p-2.5 border border-border flex flex-col justify-between h-[68px]">
                        <div className="h-6 flex items-center">
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground leading-tight">Outstanding Rent Due</Label>
                        </div>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1.5 text-[11px] font-bold text-muted-foreground">₹</span>
                          <Input
                            placeholder="0.00"
                            className={`h-9 pl-6 pr-1 text-[11px] font-semibold ${cleanNum(pendingBalance) > 0 ? "text-rose-600 bg-rose-50/20 border-rose-200" : "text-foreground"}`}
                            value={pendingBalance}
                            onChange={(e) => setPendingBalance(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Damage Charges */}
                      <div className="bg-background rounded-lg p-2.5 border border-border flex flex-col justify-between h-[68px]">
                        <div className="h-6 flex items-center">
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground leading-tight">Damage Charges</Label>
                        </div>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1.5 text-[11px] font-bold text-muted-foreground">₹</span>
                          <Input
                            placeholder="0.00"
                            className="h-9 pl-6 pr-1 text-[11px] font-semibold text-rose-600 bg-rose-50/20 border-rose-200 focus-visible:ring-rose-500"
                            value={damageCharges}
                            onChange={(e) => setDamageCharges(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Return Discount */}
                      <div className="bg-background rounded-lg p-2.5 border border-border flex flex-col justify-between h-[68px]">
                        <div className="h-6 flex items-center">
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground leading-tight">Return Discount</Label>
                        </div>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1.5 text-[11px] font-bold text-muted-foreground">₹</span>
                          <Input
                            placeholder="0.00"
                            className="h-9 pl-6 pr-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50/20 border-emerald-200 focus-visible:ring-emerald-500"
                            value={discount}
                            onChange={(e) => setDiscount(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Unpaid Accessories */}
                      <div className="bg-background rounded-lg p-2.5 border border-border flex flex-col justify-between h-[68px]">
                        <div className="h-6 flex items-center">
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground leading-tight">Unpaid Accessories</Label>
                        </div>
                        <div className="h-7 flex items-center px-2 bg-muted/30 rounded border border-border/50 overflow-hidden">
                          {unpaidItems.length > 0 ? (
                            <div className="w-full max-h-7 overflow-y-auto space-y-0.5">
                              {unpaidItems.map((item: any, idx: number) => (
                                <div key={idx} className="flex justify-between text-rose-600 text-[9px] font-semibold">
                                  <span className="truncate max-w-[70px]">{item.name}</span>
                                  <span>₹{cleanNum(item.amount)}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[11px] font-semibold text-muted-foreground">₹0</span>
                          )}
                        </div>
                      </div>

                      {/* Security Deposit */}
                      <div className="bg-background rounded-lg p-2.5 border border-border flex flex-col justify-between h-[68px]">
                        <div className="h-6 flex items-center">
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground leading-tight">Security Deposit</Label>
                        </div>
                        <div className="text-[11.5px] font-bold text-blue-600 h-7 flex items-center px-2 bg-blue-50/20 rounded border border-blue-200/60 truncate">
                          ₹{deposit.toLocaleString("en-IN")}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Reconciliation Ledger Details */}
                  {(() => {
                    const dmgCharges = dmg;
                    const unpaidAccessoriesTotal = unpaidAccessoryTotal;
                    const totalDueVal = totalDueBeforeDiscount;
                    const returnDiscountVal = effectiveDiscount;
                    const afterDiscountTotalDueVal = afterDiscountTotalDue;
                    const totalDepositVal = deposit;

                    return (
                      <div className="rounded-xl border border-border/60 bg-muted/5 overflow-hidden">
                        <div className="flex items-center gap-2.5 px-3.5 py-2 border-b border-border/60 bg-muted/20">
                          <Receipt className="h-3.5 w-3.5 text-primary" />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-foreground">
                            Reconciliation Ledger Details
                          </span>
                        </div>
                        
                        <div className="p-0 hidden md:block overflow-x-auto">
                          <Table>
                            <TableHeader className="bg-muted/10">
                              <TableRow className="h-8">
                                <TableHead className="font-bold text-[10px] text-muted-foreground uppercase pl-4 py-1">Ledger Line Item</TableHead>
                                <TableHead className="font-bold text-[10px] text-muted-foreground uppercase py-1">Calculation Details</TableHead>
                                <TableHead className="text-right font-bold text-[10px] text-muted-foreground uppercase pr-4 py-1">Amount (₹)</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              <TableRow className="hover:bg-muted/5 transition-colors h-8">
                                <TableCell className="font-semibold text-[11.5px] text-foreground pl-4 py-1">Total Due</TableCell>
                                <TableCell className="text-[10.5px] text-muted-foreground py-1">
                                  Remaining Rent Dues (₹{remainingRentDues.toLocaleString("en-IN")}) 
                                  {dmgCharges > 0 && ` + Damage (₹${dmgCharges})`}
                                  {unpaidAccessoriesTotal > 0 && ` + Accessories (₹${unpaidAccessoriesTotal})`}
                                </TableCell>
                                <TableCell className="text-right font-bold text-[11.5px] pr-4 py-1">
                                  ₹{totalDueVal.toLocaleString("en-IN")}
                                </TableCell>
                              </TableRow>

                              {rentOverpaid > 0 && (
                                <TableRow className="hover:bg-muted/5 transition-colors bg-blue-50/10 h-8">
                                  <TableCell className="font-semibold text-[11.5px] text-blue-700 pl-4 py-1">Advance Credit</TableCell>
                                  <TableCell className="text-[10.5px] text-blue-600 py-1">Customer paid ₹{rentOverpaid} extra</TableCell>
                                  <TableCell className="text-right font-bold text-blue-600 text-[11.5px] pr-4 py-1">
                                    + ₹{rentOverpaid.toLocaleString("en-IN")}
                                  </TableCell>
                                </TableRow>
                              )}

                              <TableRow className="hover:bg-muted/5 transition-colors h-8">
                                <TableCell className="font-semibold text-[11.5px] text-foreground pl-4 py-1">Return Discount</TableCell>
                                <TableCell className="text-[10.5px] text-muted-foreground py-1">Discount applied on return</TableCell>
                                <TableCell className="text-right font-bold text-emerald-600 text-[11.5px] pr-4 py-1">
                                  - ₹{returnDiscountVal.toLocaleString("en-IN")}
                                </TableCell>
                              </TableRow>

                              <TableRow className="hover:bg-muted/5 transition-colors bg-muted/5 font-semibold h-8">
                                <TableCell className="text-[11.5px] text-foreground font-bold pl-4 py-1">After Discount Due</TableCell>
                                <TableCell className="text-[10.5px] text-muted-foreground py-1">Total Due - Return Discount</TableCell>
                                <TableCell className="text-right font-bold text-[11.5px] pr-4 py-1">
                                  ₹{afterDiscountTotalDueVal.toLocaleString("en-IN")}
                                </TableCell>
                              </TableRow>

                              <TableRow className="hover:bg-muted/5 transition-colors h-8">
                                <TableCell className="font-semibold text-[11.5px] text-foreground pl-4 py-1">Deposit Offset</TableCell>
                                <TableCell className="text-[10.5px] text-muted-foreground py-1">Security deposit paid</TableCell>
                                <TableCell className="text-right font-bold text-blue-600 text-[11.5px] pr-4 py-1">
                                  ₹{totalDepositVal.toLocaleString("en-IN")}
                                </TableCell>
                              </TableRow>

                              <TableRow className={`font-black text-[12px] h-9 ${netRefund >= 0 ? "bg-emerald-50/20 text-emerald-700 border-t border-emerald-500/20" : "bg-rose-50/20 text-rose-700 border-t border-rose-500/20"}`}>
                                <TableCell className="py-2 pl-4 font-bold">Final Settlement</TableCell>
                                <TableCell className="text-[10.5px] font-medium py-2">
                                  {netRefund >= 0 ? "Refundable to Customer" : "Collect from Customer"}
                                </TableCell>
                                <TableCell className="text-right py-2 pr-4 font-extrabold">
                                  {netRefund >= 0 
                                    ? `₹${Math.abs(netRefund).toLocaleString("en-IN")} (Refund)` 
                                    : `₹${Math.abs(netRefund).toLocaleString("en-IN")} (Collect)`
                                  }
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>

                        {/* Mobile Card List — visible only on mobile */}
                        <div className="md:hidden divide-y divide-border/60">
                          <div className="flex items-start justify-between gap-3 px-3.5 py-3">
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-[11.5px] text-foreground">Total Due</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">
                                Remaining Rent Dues (₹{remainingRentDues.toLocaleString("en-IN")})
                                {dmgCharges > 0 && ` + Damage (₹${dmgCharges})`}
                                {unpaidAccessoriesTotal > 0 && ` + Accessories (₹${unpaidAccessoriesTotal})`}
                              </p>
                            </div>
                            <p className="text-right font-bold text-[11.5px] shrink-0">
                              ₹{totalDueVal.toLocaleString("en-IN")}
                            </p>
                          </div>

                          {rentOverpaid > 0 && (
                            <div className="flex items-start justify-between gap-3 px-3.5 py-3 bg-blue-50/10">
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-[11.5px] text-blue-700">Advance Credit</p>
                                <p className="text-[10px] text-blue-600 mt-0.5">Customer paid ₹{rentOverpaid} extra</p>
                              </div>
                              <p className="text-right font-bold text-blue-600 text-[11.5px] shrink-0">
                                + ₹{rentOverpaid.toLocaleString("en-IN")}
                              </p>
                            </div>
                          )}

                          <div className="flex items-start justify-between gap-3 px-3.5 py-3">
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-[11.5px] text-foreground">Return Discount</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">Discount applied on return</p>
                            </div>
                            <p className="text-right font-bold text-emerald-600 text-[11.5px] shrink-0">
                              - ₹{returnDiscountVal.toLocaleString("en-IN")}
                            </p>
                          </div>

                          <div className="flex items-start justify-between gap-3 px-3.5 py-3 bg-muted/5">
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-[11.5px] text-foreground">After Discount Due</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">Total Due - Return Discount</p>
                            </div>
                            <p className="text-right font-bold text-[11.5px] shrink-0">
                              ₹{afterDiscountTotalDueVal.toLocaleString("en-IN")}
                            </p>
                          </div>

                          <div className="flex items-start justify-between gap-3 px-3.5 py-3">
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-[11.5px] text-foreground">Deposit Offset</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">Security deposit paid</p>
                            </div>
                            <p className="text-right font-bold text-blue-600 text-[11.5px] shrink-0">
                              ₹{totalDepositVal.toLocaleString("en-IN")}
                            </p>
                          </div>

                          <div className={`flex items-start justify-between gap-3 px-3.5 py-3.5 font-black ${netRefund >= 0 ? "bg-emerald-50/20 text-emerald-700 border-t border-emerald-500/20" : "bg-rose-50/20 text-rose-700 border-t border-rose-500/20"}`}>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-[12.5px]">Final Settlement</p>
                              <p className="text-[10px] font-medium mt-0.5">
                                {netRefund >= 0 ? "Refundable to Customer" : "Collect from Customer"}
                              </p>
                            </div>
                            <p className="text-right font-extrabold text-[12.5px] shrink-0">
                              {netRefund >= 0
                                ? `₹${Math.abs(netRefund).toLocaleString("en-IN")} (Refund)`
                                : `₹${Math.abs(netRefund).toLocaleString("en-IN")} (Collect)`
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Due Amount Payment Settlement Option */}
                  {netRefund < 0 && (() => {
                    const totalDueAmt = Math.abs(netRefund);
                    const currentPaidVal = duePaymentStatus === "Paid" 
                      ? totalDueAmt 
                      : duePaymentStatus === "Partial" 
                      ? Math.min(totalDueAmt, Math.max(0, cleanNum(duePaidAmount))) 
                      : 0;
                    const remainingDueVal = Math.max(0, totalDueAmt - currentPaidVal);

                    return (
                      <div className="rounded-xl border border-amber-500/20 bg-amber-50/10 dark:bg-amber-950/10 p-3.5 space-y-2.5">
                        <div className="flex items-center justify-between flex-wrap gap-1.5 border-b border-amber-500/20 pb-1.5">
                          <span className="text-[11px] font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wide flex items-center gap-1">
                            <CreditCard className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                            Settlement (Collectible: ₹{totalDueAmt.toLocaleString("en-IN")})
                          </span>
                          {duePaymentStatus === "Partial" && (
                            <span className="text-[9.5px] font-bold text-rose-700 dark:text-rose-300 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                              Pending: ₹{remainingDueVal}
                            </span>
                          )}
                        </div>

                        <div className="space-y-2">
                          <div className="space-y-1">
                            <Label className="text-[9.5px] font-semibold uppercase tracking-wider text-muted-foreground">Due Payment Status</Label>
                            <div className="grid grid-cols-3 gap-1 bg-background p-1 rounded-lg border border-border h-10">
                              <button
                                type="button"
                                onClick={() => {
                                  setDuePaymentStatus("Paid");
                                  setDuePaidAmount(totalDueAmt.toString());
                                  setDueCashAmount(Math.round(totalDueAmt / 2).toString());
                                  setDueBankAmount((totalDueAmt - Math.round(totalDueAmt / 2)).toString());
                                }}
                                className={`flex items-center justify-center rounded text-[10px] font-bold transition-all ${
                                  duePaymentStatus === "Paid" ? "bg-emerald-600 text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
                                }`}
                              >
                                Full Paid
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setDuePaymentStatus("Partial");
                                  const defaultPartial = Math.round(totalDueAmt / 2);
                                  setDuePaidAmount(defaultPartial.toString());
                                  setDueCashAmount(Math.round(defaultPartial / 2).toString());
                                  setDueBankAmount((defaultPartial - Math.round(defaultPartial / 2)).toString());
                                }}
                                className={`flex items-center justify-center rounded text-[10px] font-bold transition-all ${
                                  duePaymentStatus === "Partial" ? "bg-amber-600 text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
                                }`}
                              >
                                Partial
                              </button>

                              <button
                                type="button"
                                onClick={() => setDuePaymentStatus("Not Paid")}
                                className={`flex items-center justify-center rounded text-[10px] font-bold transition-all ${
                                  duePaymentStatus === "Not Paid" ? "bg-rose-600 text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
                                }`}
                              >
                                Not Paid
                              </button>
                            </div>
                          </div>

                          {duePaymentStatus !== "Not Paid" ? (
                            <div className="space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <Label className="text-[9.5px] font-semibold uppercase tracking-wider text-muted-foreground">Mode</Label>
                                  <Select 
                                    value={duePaymentMode} 
                                    onValueChange={(mode) => {
                                      setDuePaymentMode(mode);
                                      if (mode === "Cash+Bank") {
                                        const cAmt = Math.round(currentPaidVal / 2);
                                        setDueCashAmount(cAmt.toString());
                                        setDueBankAmount((currentPaidVal - cAmt).toString());
                                      }
                                    }}
                                  >
                                    <SelectTrigger className="h-8 text-[11px] bg-background font-medium"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Cash">Cash</SelectItem>
                                      <SelectItem value="Bank">Bank</SelectItem>
                                      <SelectItem value="Cash+Bank">Cash + Bank</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                {duePaymentStatus === "Partial" && (
                                  <div className="space-y-1">
                                    <Label className="text-[9.5px] font-semibold uppercase tracking-wider text-amber-700">Amount (₹)</Label>
                                    <Input
                                      type="number"
                                      placeholder={`Max ₹${totalDueAmt}`}
                                      className="h-8 text-[11px] font-bold bg-background"
                                      value={duePaidAmount}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setDuePaidAmount(val);
                                        const nVal = Math.min(totalDueAmt, Math.max(0, cleanNum(val)));
                                        if (duePaymentMode === "Cash+Bank") {
                                          const cAmt = Math.round(nVal / 2);
                                          setDueCashAmount(cAmt.toString());
                                          setDueBankAmount((nVal - cAmt).toString());
                                        }
                                      }}
                                    />
                                  </div>
                                )}
                              </div>

                              <div className="space-y-1">
                                <Label className="text-[9.5px] font-semibold uppercase tracking-wider text-muted-foreground">Txn / Ref No. (Optional)</Label>
                                <Input
                                  placeholder="e.g. UPI Ref / Bank Txn ID"
                                  className="h-8 text-[11px] bg-background"
                                  value={dueTxRef}
                                  onChange={(e) => setDueTxRef(e.target.value)}
                                />
                              </div>

                              {duePaymentMode === "Cash+Bank" && (
                                <div className="grid grid-cols-2 gap-2 p-1.5 bg-background rounded-lg border border-border">
                                  <div className="space-y-0.5">
                                    <Label className="text-[9px] font-bold uppercase tracking-wider text-emerald-700">Cash Amount</Label>
                                    <Input
                                      type="number"
                                      className="h-7 text-[11px] bg-emerald-50/20 border-emerald-200"
                                      value={dueCashAmount}
                                      onChange={(e) => {
                                        const cVal = e.target.value;
                                        setDueCashAmount(cVal);
                                        const cNum = Math.max(0, cleanNum(cVal));
                                        setDueBankAmount(Math.max(0, currentPaidVal - cNum).toString());
                                      }}
                                    />
                                  </div>
                                  <div className="space-y-0.5">
                                    <Label className="text-[9px] font-bold uppercase tracking-wider text-blue-700">Bank Amount</Label>
                                    <Input
                                      type="number"
                                      className="h-7 text-[11px] bg-blue-50/20 border-blue-200"
                                      value={dueBankAmount}
                                      onChange={(e) => {
                                        const bVal = e.target.value;
                                        setDueBankAmount(bVal);
                                        const bNum = Math.max(0, cleanNum(bVal));
                                        setDueCashAmount(Math.max(0, currentPaidVal - bNum).toString());
                                      }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[10.5px]">
                              Collectible dues of <strong>₹{totalDueAmt.toLocaleString("en-IN")}</strong> will be recorded as <strong>Unpaid Pending Due</strong>.
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Remarks & Collector */}
                  <div className="grid gap-2.5 grid-cols-2 bg-muted/10 p-3 rounded-xl border border-border/40">
                    <div className="space-y-1">
                      <Label className="text-[9.5px] font-semibold uppercase tracking-wider text-muted-foreground">Collected By</Label>
                      <div className="relative">
                        <Input
                          placeholder="Collector name"
                          className="h-8 text-[11.5px] pl-7"
                          value={collectedBy}
                          onChange={(e) => setCollectedBy(e.target.value)}
                        />
                        <User className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground/60" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[9.5px] font-semibold uppercase tracking-wider text-muted-foreground">Remarks</Label>
                      <Input
                        placeholder="Condition, accessories, etc."
                        className="h-8 text-[11.5px]"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Right Column: WhatsApp Message & Payment Ledger (col-span-5) */}
                <div className="lg:col-span-5 space-y-4 font-semibold">
                  {/* WhatsApp Preview Box */}
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-50/10 p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2 border-b border-emerald-500/20 pb-1.5">
                      <span className="text-[10px] font-bold text-emerald-950 uppercase tracking-wide flex items-center gap-1">
                        <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                        WhatsApp Message
                      </span>
                      <div className="flex gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const msg = generateWhatsAppPickupMessage({
                              customerName: selectedRental.customer,
                              rentDate: selectedRental.start,
                              phone: selectedCustomer?.phone || (selectedRental as any)?.phone,
                              altPhone: selectedCustomer?.altPhone || (selectedRental as any)?.altPhone,
                              equipment: returnedNames || selectedRental.equipment,
                              serial: selectedRental.serial,
                              model: selectedRental.model,
                              area: selectedCustomer?.area || (selectedRental as any)?.area,
                              address: selectedCustomer?.address || (selectedRental as any)?.address,
                              locationAddress: (selectedRental as any)?.locationAddress || (selectedCustomer as any)?.locationAddress,
                              latitude: (selectedRental as any)?.latitude,
                              longitude: (selectedRental as any)?.longitude,
                              collectAmount: netRefund < 0 ? Math.abs(netRefund) : 0,
                              refundAmount: netRefund > 0 ? netRefund : 0,
                              rental: selectedRental,
                              customer: selectedCustomer,
                              equipmentIds: selectedEquipmentIds,
                            });
                            navigator.clipboard.writeText(msg);
                            toast.success("WhatsApp message copied!");
                          }}
                          className="h-6 px-2 text-[9.5px] font-bold gap-1 border-emerald-300"
                        >
                          <Copy className="h-2.5 w-2.5 text-primary" /> Copy
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            const msg = generateWhatsAppPickupMessage({
                              customerName: selectedRental.customer,
                              rentDate: selectedRental.start,
                              phone: selectedCustomer?.phone || (selectedRental as any)?.phone,
                              altPhone: selectedCustomer?.altPhone || (selectedRental as any)?.altPhone,
                              equipment: returnedNames || selectedRental.equipment,
                              serial: selectedRental.serial,
                              model: selectedRental.model,
                              area: selectedCustomer?.area || (selectedRental as any)?.area,
                              address: selectedCustomer?.address || (selectedRental as any)?.address,
                              locationAddress: (selectedRental as any)?.locationAddress || (selectedCustomer as any)?.locationAddress,
                              latitude: (selectedRental as any)?.latitude,
                              longitude: (selectedRental as any)?.longitude,
                              collectAmount: netRefund < 0 ? Math.abs(netRefund) : 0,
                              refundAmount: netRefund > 0 ? netRefund : 0,
                              rental: selectedRental,
                              customer: selectedCustomer,
                              equipmentIds: selectedEquipmentIds,
                            });
                            const cleanPhone = (selectedCustomer?.phone || (selectedRental as any)?.phone || "").replace(/\D/g, "");
                            const text = encodeURIComponent(msg);
                            const targetUrl = cleanPhone ? `https://wa.me/91${cleanPhone}?text=${text}` : `https://wa.me/?text=${text}`;
                            window.open(targetUrl, "_blank");
                          }}
                          className="h-6 px-2 text-[9.5px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                        >
                          <MessageCircle className="h-2.5 w-2.5" /> Send
                        </Button>
                      </div>
                    </div>

                    {(() => {
                      const waMsgText = generateWhatsAppPickupMessage({
                        customerName: selectedRental.customer,
                        rentDate: selectedRental.start,
                        phone: selectedCustomer?.phone || (selectedRental as any)?.phone,
                        altPhone: selectedCustomer?.altPhone || (selectedRental as any)?.altPhone,
                        equipment: returnedNames || selectedRental.equipment,
                        serial: selectedRental.serial,
                        model: selectedRental.model,
                        area: selectedCustomer?.area || (selectedRental as any)?.area,
                        address: selectedCustomer?.address || (selectedRental as any)?.address,
                        locationAddress: (selectedRental as any)?.locationAddress || (selectedCustomer as any)?.locationAddress,
                        latitude: (selectedRental as any)?.latitude,
                        longitude: (selectedRental as any)?.longitude,
                        collectAmount: netRefund < 0 ? Math.abs(netRefund) : 0,
                        refundAmount: netRefund > 0 ? netRefund : 0,
                        rental: selectedRental,
                        customer: selectedCustomer,
                        equipmentIds: selectedEquipmentIds,
                      });
                      const lineCount = (waMsgText.match(/\n/g) || []).length + 1;
                      return (
                        <Textarea
                          readOnly
                          rows={Math.max(8, lineCount)}
                          value={waMsgText}
                          className="font-mono text-[11px] bg-background border-emerald-200 leading-normal p-2 resize-none w-full"
                        />
                      );
                    })()}
                  </div>

                  {/* Payment Ledger card (compact scrollable) */}
                  <Card className="border border-border/50 bg-card/65 shadow-soft flex flex-col overflow-hidden max-h-[180px]">
                    <div className="p-3 border-b border-border/40 pb-2 flex items-center gap-1.5 bg-muted/10 shrink-0">
                      <Receipt className="h-3.5 w-3.5 text-primary" />
                      <div>
                        <h4 className="text-[11.5px] font-bold text-foreground">Payment Ledger</h4>
                      </div>
                    </div>
                    <div className="overflow-y-auto flex-1 bg-background text-[11px]">
                      {agreementPayments.length === 0 ? (
                        <div className="py-6 text-center text-muted-foreground px-4">
                          <p className="font-bold text-foreground/75">No payments found</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-border/40">
                          {agreementPayments.map((p) => {
                            const isDeposit = p.type?.toLowerCase().includes("deposit");
                            return (
                              <div key={p.id} className="p-2 flex items-start justify-between gap-3 hover:bg-muted/10 transition-colors">
                                <div className="space-y-0.5 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className={`px-1 py-0.2 rounded text-[8.5px] font-black ${
                                      isDeposit 
                                        ? "bg-blue-50 text-blue-700 border border-blue-200" 
                                        : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    }`}>
                                      {p.type || "Rent"}
                                    </span>
                                    <span className="font-mono text-[9.5px] font-bold text-muted-foreground/70">{p.id}</span>
                                    <span className="text-[9.5px] text-muted-foreground/60">{formatDateDDMMYYYY(p.date)}</span>
                                  </div>
                                  <p className="text-[10px] text-muted-foreground truncate">{p.notes || "Rent payment"}</p>
                                </div>
                                <span className="font-bold text-foreground text-[11.5px]">
                                  ₹{cleanNum(p.amount).toLocaleString("en-IN")}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {/* Footer buttons row */}
            <div className="flex items-center justify-between border-t border-border/50 pt-4 shrink-0">
              <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>Processing automatically sets returning serials to Available / Maintenance.</span>
              </p>
              <div className="flex gap-2">
                <Button variant="outline" type="button" size="sm" onClick={handleGenerateReceipt} disabled={!selectedAgreement} className="h-8.5 text-[11px] font-bold">
                  <Receipt className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
                  Print Receipt
                </Button>
                <Button type="button" size="sm" onClick={handleProcessReturn} disabled={!selectedAgreement || isSubmitting} className="h-8.5 text-[11px] font-bold">
                  <RotateCcw className="mr-1 h-3.5 w-3.5" />
                  {isSubmitting ? "Processing..." : "Process Return"}
                </Button>
              </div>
            </div>
            
          </CardContent>
        </Card>

        {/* Return History Section */}
        <Card className="shadow-card border-border/50 overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-muted/15 px-6 py-4.5">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="metric-icon h-9 w-9 bg-accent/10 text-accent border-accent/20 rounded-lg">
                  <History className="h-4.5 w-4.5" />
                </div>
                <div>
                  <CardTitle className="text-[15px] font-bold">Return Ledger History</CardTitle>
                  <p className="text-[12px] text-muted-foreground mt-0.5">Audit log of all equipment returns processed</p>
                </div>
              </div>

              {/* Advanced search and filters */}
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto">
                <div className="relative w-full sm:w-[220px]">
                  <Input
                    placeholder="Search returns..."
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    className="h-8.5 pl-8.5 text-[12px]"
                  />
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground/60" />
                </div>

                <Select value={historyOwnerFilter} onValueChange={setHistoryOwnerFilter}>
                  <SelectTrigger className="w-full sm:w-[140px] h-8.5 text-[11.5px] bg-background"><SelectValue placeholder="Owner" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-owners">All Owners</SelectItem>
                    {activeOwners.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>

                <Select value={historyCategoryFilter} onValueChange={setHistoryCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-[150px] h-8.5 text-[11.5px] bg-background"><SelectValue placeholder="Category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-categories">All Categories</SelectItem>
                    {activeCategories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>


          <CardContent className="p-0">
            {/* Desktop Table — hidden on mobile */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/10">
                    {/* Return history table matching the requested spreadsheet layout */}
                    <TableHead className="w-[180px]">Customer</TableHead>
                    <TableHead className="w-[200px]">Address</TableHead>
                    <TableHead>Equipment</TableHead>
                    <TableHead className="w-[105px]">Rent Date</TableHead>
                    <TableHead className="text-right w-[110px]">Rent Amount</TableHead>
                    <TableHead className="text-right w-[110px]">Deposit</TableHead>
                    <TableHead className="text-right w-[110px]">Due</TableHead>
                    <TableHead className="w-[105px]">Return Date</TableHead>
                    <TableHead className="text-right w-[140px]">Final Settlement</TableHead>
                    <TableHead className="w-[110px] text-center">Status</TableHead>
                    <TableHead className="w-[120px] text-right pr-6">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReturns.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="py-14 text-center text-muted-foreground text-[13px]">
                        <RotateCcw className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                        <p className="font-semibold text-foreground/75">No return records match filters</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Try widening search criteria or selecting another tab.</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    visibleReturns.map((ret) => {
                      const info = getReturnOwnerAndCategory(ret);
                      const rental = rentals.find((r) => r.id === ret.agreement);
                      const cust = customers.find((c) => c.id === ret.customerId || c.name === ret.customer || c.id === rental?.customerId);
                      const fullAddress = cust
                        ? [cust.address, cust.area, cust.city, cust.state, cust.pincode].filter(Boolean).join(", ")
                        : rental?.address || "No address provided";
                      return (
                        <TableRow key={ret.id} className="group hover:bg-muted/15 transition-colors">
                          {/* 1. Customer name with contact numbers */}
                          <TableCell>
                            <div className="font-bold text-[13px] text-foreground">{ret.customer}</div>
                            {cust && (cust.phone || cust.altPhone) && (
                              <div className="text-[11px] text-muted-foreground mt-0.5 font-medium">
                                {[cust.phone, cust.altPhone].filter(Boolean).join(" / ")}
                              </div>
                            )}
                            <div className="text-[9.5px] text-muted-foreground font-mono mt-0.5">Agr: {ret.agreement}</div>
                          </TableCell>

                          {/* 2. Customer full address */}
                          <TableCell className="max-w-[200px] text-[12px] text-foreground/80 leading-normal">
                            {fullAddress}
                          </TableCell>

                          {/* 3. Equipment name */}
                          <TableCell className="text-[12.5px] text-foreground/80">
                            {(() => {
                              const ids: string[] = Array.isArray(ret.returnedEquipmentIds) ? ret.returnedEquipmentIds : [];
                              const labels = ids
                                .map((id) => {
                                  const eq = eqInventory.find((e) => e.id === id);
                                  if (!eq) return "";
                                  return formatEquipmentLabel(eq);
                                })
                                .filter(Boolean);
                              if (labels.length === 0) {
                                return <p className="font-semibold text-[13px]">{ret.equipment}</p>;
                              }
                              return (
                                <div className="space-y-0.5">
                                  {labels.map((label, i) => (
                                    <p key={i} className="font-semibold text-[13px] leading-tight">{label}</p>
                                  ))}
                                </div>
                              );
                            })()}
                            <p className="text-[10.5px] text-muted-foreground mt-0.5 flex flex-wrap gap-x-1.5">
                              <span>Owner: <strong className="text-foreground/70 font-medium">{info.owner}</strong></span>
                              {info.category && info.category !== ret.equipment && (
                                <>
                                  <span>·</span>
                                  <span>Cat: <strong className="text-foreground/70 font-medium">{info.category}</strong></span>
                                </>
                              )}
                              {ret.collectedBy && (
                                <>
                                  <span>·</span>
                                  <span>Coll. By: <strong className="text-foreground/70 font-medium">{ret.collectedBy}</strong></span>
                                </>
                              )}
                            </p>
                          </TableCell>

                          {/* 4. Rent Date */}
                          <TableCell className="text-[11.5px] text-muted-foreground whitespace-nowrap">
                            {rental?.start ? formatDateDDMMYY(rental.start) : "—"}
                          </TableCell>

                          {/* 5. Rent amount */}
                          <TableCell className="text-right text-[12.5px] font-semibold whitespace-nowrap">
                            {(() => {
                              if (rental) {
                                const ids = Array.isArray(ret.returnedEquipmentIds) ? ret.returnedEquipmentIds : [];
                                const eqItems = rental.equipmentItems || [];
                                let monthlyRentSum = 0;
                                let dailyRentSum = 0;
                                let hasDaily = false;
                                
                                ids.forEach((id: string) => {
                                  const item = eqItems.find((it: any) => it.equipmentId === id);
                                  if (item) {
                                    if (item.rentCycle === "Daily") {
                                      dailyRentSum += Number(item.rentRate || item.dailyRent) || 0;
                                      hasDaily = true;
                                    } else {
                                      monthlyRentSum += Number(item.rentRate || item.monthlyRent) || 0;
                                    }
                                  }
                                });
                                
                                if (monthlyRentSum > 0 || dailyRentSum > 0) {
                                  if (hasDaily && dailyRentSum > 0) {
                                    return `₹${dailyRentSum.toLocaleString("en-IN")}/day`;
                                  }
                                  return `₹${monthlyRentSum.toLocaleString("en-IN")}/mo`;
                                }
                              }
                              return `₹${cleanNum(ret.finalRent).toLocaleString("en-IN")}`;
                            })()}
                          </TableCell>

                          {/* 6. Deposit */}
                          <TableCell className="text-right text-[12.5px] font-semibold text-muted-foreground">
                            ₹{cleanNum(ret.deposit).toLocaleString("en-IN")}
                          </TableCell>

                          {/* 7. Due */}
                          <TableCell className="text-right text-[12.5px]">
                            {(() => {
                              const totalDue = cleanNum(ret.pendingBalance) + cleanNum(ret.damageCharges) + cleanNum(ret.unpaidAccessoryTotal);
                              if (totalDue === 0) return <span className="text-muted-foreground">—</span>;
                              return (
                                <div>
                                  <p className="font-bold text-rose-600">₹{totalDue.toLocaleString("en-IN")}</p>
                                  <p className="text-[9.5px] text-muted-foreground mt-0.5 leading-tight">
                                    {[
                                      ret.pendingBalance > 0 && `Rent: ₹${ret.pendingBalance}`,
                                      ret.damageCharges > 0 && `Dmg: ₹${ret.damageCharges}`,
                                      ret.unpaidAccessoryTotal > 0 && `Acc: ₹${ret.unpaidAccessoryTotal}`
                                    ].filter(Boolean).join(", ")}
                                  </p>
                                </div>
                              );
                            })()}
                          </TableCell>

                          {/* 8. Return date */}
                          <TableCell className="text-[11.5px] text-muted-foreground whitespace-nowrap">
                            {formatDateDDMMYY(ret.date)}
                          </TableCell>

                          <TableCell className="text-right font-bold text-[12.5px] whitespace-nowrap">
                            {ret.refund >= 0 ? (
                              <span className="text-emerald-600 font-bold">₹{Math.abs(ret.refund).toLocaleString("en-IN")} (Refund)</span>
                            ) : (() => {
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

                              if (status === "Paid") {
                                return (
                                  <div>
                                    <p className="text-emerald-600 font-bold">₹{totalDue.toLocaleString("en-IN")}</p>
                                    <span className="inline-flex items-center rounded-md px-1.5 py-0.2 text-[9.5px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-200 mt-0.5">
                                      Paid
                                    </span>
                                  </div>
                                );
                              }

                              if (status === "Partial") {
                                return (
                                  <div>
                                    <p className="text-amber-600 font-extrabold">₹{pendingDue.toLocaleString("en-IN")} (Pending)</p>
                                    <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Paid ₹{paidAmt.toLocaleString("en-IN")} of ₹{totalDue.toLocaleString("en-IN")}</p>
                                    <span className="inline-flex items-center rounded-md px-1.5 py-0.2 text-[9.5px] font-bold border bg-amber-50 text-amber-700 border-amber-200 mt-0.5">
                                      Partial Paid
                                    </span>
                                  </div>
                                );
                              }

                              return (
                                <div>
                                  <p className="text-rose-600 font-bold">₹{totalDue.toLocaleString("en-IN")} (Collect)</p>
                                  <span className="inline-flex items-center rounded-md px-1.5 py-0.2 text-[9.5px] font-bold border bg-rose-50 text-rose-700 border-rose-200 mt-0.5">
                                    Not Paid
                                  </span>
                                </div>
                              );
                            })()}
                          </TableCell>

                          <TableCell className="text-center">
                            <span className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-[10.5px] font-bold border ${
                              ret.status === "Pending Approval"
                                ? "bg-warning/10 text-warning border-warning/25 animate-pulse"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200/50"
                            }`}>
                              {ret.status || "Completed"}
                            </span>
                          </TableCell>

                          <TableCell className="text-right pr-6">
                            <div className="flex items-center justify-end gap-1.5">
                              <WhatsAppReturnMessageModal
                                ret={ret}
                                rental={rentals.find((r) => r.id === ret.agreement)}
                                customer={customers.find((c) => c.name === ret.customer || c.id === rentals.find((r) => r.id === ret.agreement)?.customerId)}
                              />
                              {ret.refund < 0 && ret.duePaymentStatus !== "Paid" && (
                                <PayReturnDueDialog ret={ret} onSave={refresh} />
                              )}
                              {!isStaff && ret.status === "Pending Approval" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-2 text-[11.5px] font-bold text-emerald-600 border-emerald-500/20 bg-emerald-50/10 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-500/40"
                                  onClick={() => {
                                    const updatedReturn = { ...ret, status: "Completed" };
                                    saveReturn(updatedReturn);
                                    setMockReturns(getReturns());
                                    toast.success(`Return ${ret.id} approved successfully!`);
                                    if (typeof window !== "undefined") {
                                      window.dispatchEvent(new CustomEvent("medirent-db-updated"));
                                    }
                                  }}
                                >
                                  Approve
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                onClick={() => {
                                  printReturnReceipt(ret);
                                  toast.success(`Receipt printed for ${ret.customer}`);
                                }}
                              >
                                <Receipt className="h-4 w-4" />
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
            <div className="md:hidden">
              {filteredReturns.length === 0 ? (
                <div className="py-14 text-center text-[13px] text-muted-foreground">
                  <RotateCcw className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="font-semibold text-foreground/75">No return records match filters</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Try widening search criteria or selecting another tab.</p>
                </div>
              ) : (
                <div className="divide-y divide-border/60">
                  {visibleReturns.map((ret) => {
                    const settlement = getReturnSettlementDisplay(ret);
                    return (
                      <div
                        key={ret.id}
                        className="flex items-center gap-3 px-4 py-3.5"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-semibold text-[13.5px] truncate">{ret.customer}</p>
                            <span className={`inline-flex items-center shrink-0 rounded-md px-2 py-0.5 text-[10.5px] font-bold border ${
                              ret.status === "Pending Approval"
                                ? "bg-warning/10 text-warning border-warning/25 animate-pulse"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200/50"
                            }`}>
                              {ret.status || "Completed"}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="info-row min-w-0">
                              <Package className="h-3 w-3 shrink-0" />
                              <span className="truncate">{ret.equipment}</span>
                            </span>
                            <span className="info-row shrink-0">
                              <ShieldCheck className="h-3 w-3 shrink-0" />
                              {ret.condition}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-[10.5px] font-mono text-muted-foreground/60">{ret.id} · {formatDateDDMMYYYY(ret.date)}</p>
                            <p className={`text-[12px] font-bold ${settlement.className}`}>{settlement.text}</p>
                          </div>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-11 w-11 shrink-0 text-muted-foreground"
                              title="Return actions"
                            >
                              <MoreVertical className="h-4.5 w-4.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuItem onSelect={() => setMobileWaReturn(ret)}>
                              <MessageCircle className="h-4 w-4 text-emerald-600" /> WhatsApp Message
                            </DropdownMenuItem>
                            {ret.refund < 0 && ret.duePaymentStatus !== "Paid" && (
                              <DropdownMenuItem onSelect={() => setMobilePayDueReturn(ret)}>
                                <CreditCard className="h-4 w-4 text-emerald-600" /> Pay Due
                              </DropdownMenuItem>
                            )}
                            {!isStaff && ret.status === "Pending Approval" && (
                              <DropdownMenuItem
                                onSelect={() => {
                                  const updatedReturn = { ...ret, status: "Completed" };
                                  saveReturn(updatedReturn);
                                  setMockReturns(getReturns());
                                  toast.success(`Return ${ret.id} approved successfully!`);
                                  if (typeof window !== "undefined") {
                                    window.dispatchEvent(new CustomEvent("medirent-db-updated"));
                                  }
                                }}
                              >
                                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Approve
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onSelect={() => {
                                printReturnReceipt(ret);
                                toast.success(`Receipt printed for ${ret.customer}`);
                              }}
                            >
                              <Receipt className="h-4 w-4" /> Print Receipt
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* PERF: incremental rendering - only a page of history rows mounts */}
            {hasMoreReturns && (
              <div className="flex items-center justify-center gap-3 border-t border-border/60 py-4">
                <span className="text-[12px] text-muted-foreground">
                  Showing {visibleReturns.length} of {filteredReturns.length}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setHistoryVisibleCount((n) => n + RETURNS_PAGE_SIZE)}
                >
                  Load more
                </Button>
              </div>
            )}

            {/* Controlled dialogs opened from the mobile card kebab menu above.
                Rendered once, outside the row loop and outside the DropdownMenu tree, so they
                aren't unmounted when their triggering dropdown closes. */}
            {mobileWaReturn && (
              <WhatsAppReturnMessageModal
                ret={mobileWaReturn}
                rental={rentals.find((r) => r.id === mobileWaReturn.agreement)}
                customer={customers.find((c) => c.name === mobileWaReturn.customer || c.id === rentals.find((r) => r.id === mobileWaReturn.agreement)?.customerId)}
                hideTrigger
                controlledOpen={!!mobileWaReturn}
                onControlledOpenChange={(v) => { if (!v) setMobileWaReturn(null); }}
              />
            )}
            {mobilePayDueReturn && (
              <PayReturnDueDialog
                ret={mobilePayDueReturn}
                onSave={() => { refresh(); setMobilePayDueReturn(null); }}
                hideTrigger
                controlledOpen={!!mobilePayDueReturn}
                onControlledOpenChange={(v) => { if (!v) setMobilePayDueReturn(null); }}
              />
            )}
          </CardContent>
        </Card>

      </div>
    </AppShell>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <Label className="text-[11.5px] font-bold uppercase tracking-wider text-muted-foreground">
      {children}
    </Label>
  );
}