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

          <DialogFooter className="flex-row items-center justify-between sm:justify-between gap-2">
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

  const [payAmount, setPayAmount] = useState(currentPending.toString());
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [paymentDate, setPaymentDate] = useState(() => getLocalYYYYMMDD());
  const [txRef, setTxRef] = useState("");
  const [cashAmount, setCashAmount] = useState("");
  const [bankAmount, setBankAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
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
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3 text-[12.5px] space-y-1">
              <div className="flex justify-between font-bold text-foreground">
                <span>Return ID: {ret.id}</span>
                <span className="font-mono text-primary">{ret.agreement}</span>
              </div>
              <p className="text-muted-foreground">Customer: <strong>{ret.customer}</strong></p>
              <p className="text-muted-foreground">Equipment: {ret.equipment}</p>
              <div className="border-t border-amber-200/60 pt-1.5 flex justify-between font-bold text-rose-700 text-[13.5px]">
                <span>Outstanding Return Due:</span>
                <span>₹{currentPending.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Amount Collected (₹)</Label>
                <Input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="h-9 font-bold text-foreground"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Payment Date</Label>
                <Input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="h-9"
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
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Record & Mark Paid
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
    return customers.find((c) => c.id === selectedRental.customerId);
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
        ret.id.toLowerCase().includes(searchLower) ||
        ret.customer.toLowerCase().includes(searchLower) ||
        ret.equipment.toLowerCase().includes(searchLower) ||
        ret.agreement.toLowerCase().includes(searchLower) ||
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
          r.id,
          r.customer,
          phone1,
          rentDateStr ? `Rent Date: ${rentDateStr}` : "",
          equipmentSummary,
        ].filter(Boolean);

        return {
          value: r.id,
          label: parts.join(" · "),
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
        setSelectedEquipmentIds(activeIds);
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

  const isDateInvalid = selectedRental && returnDate ? parseLocalDate(returnDate) < parseLocalDate(selectedRental.start) : false;

  const handleProcessReturn = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    if (!selectedAgreement || !returnDate || !condition) {
      toast.error("Please fill in Agreement, Return Date, and Condition before processing.");
      setIsSubmitting(false);
      return;
    }

    if (isDateInvalid) {
      toast.error("Return date cannot be earlier than the rental start date.");
      setIsSubmitting(false);
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
    setIsSubmitting(false);
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
      toast.error("Return date cannot be earlier than the rental start date.");
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
              <div className="grid gap-5 lg:grid-cols-3 items-start animate-[slide-up_0.3s_ease-out]">
                {/* Left Columns: Customer summary & checklist */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Agreement Customer Profile Summary */}
                  <div className="rounded-xl border border-border/40 bg-muted/5 p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-soft shrink-0">
                        {getCustomerInitials(selectedRental.customer)}
                      </div>
                      <div>
                        <h4 className="text-[14px] font-bold text-foreground leading-tight flex items-center gap-2">
                          {selectedRental.customer}
                          <StatusBadge status={selectedRental.status} />
                        </h4>
                        {(() => {
                          const p1 = selectedCustomer?.phone || (selectedRental as any)?.phone || "";
                          const p2 = selectedCustomer?.altPhone || (selectedRental as any)?.altPhone || "";
                          const p3 = selectedCustomer?.contactNumber3 || (selectedRental as any)?.contactNumber3 || "";
                          return (
                            <div className="text-[11.5px] text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                              <span>Agreement ID: <span className="font-mono font-bold text-foreground/80">{selectedRental.id}</span></span>
                              {p1 && (
                                <span className="flex items-center gap-1">
                                  · Contact: <a href={`tel:${p1}`} className="hover:underline font-semibold text-foreground/80">{p1}</a>
                                </span>
                              )}
                              {p2 && (
                                <span className="flex items-center gap-1">
                                  · Alt: <a href={`tel:${p2}`} className="hover:underline text-foreground/80">{p2}</a>
                                </span>
                              )}
                              {p3 && (
                                <span className="flex items-center gap-1">
                                  · Alt 1: <a href={`tel:${p3}`} className="hover:underline text-foreground/80">{p3}</a>
                                </span>
                              )}
                              {!p1 && !p2 && !p3 && (
                                <span>· No phone registered</span>
                              )}
                            </div>
                          );
                        })()}
                        {(() => {
                          const custAddr = selectedCustomer?.address || (selectedRental as any)?.address || "";
                          const custArea = selectedCustomer?.area || (selectedRental as any)?.area || "";
                          const custCity = selectedCustomer?.city || (selectedRental as any)?.city || "";
                          const fullAddr = [custAddr, custArea, custCity].filter(Boolean).join(", ");
                          return fullAddr ? (
                            <p className="text-[11.5px] text-muted-foreground mt-0.5 flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 shrink-0 text-primary opacity-80" />
                              <span><strong>Address:</strong> {fullAddr}</span>
                            </p>
                          ) : null;
                        })()}
                        <p className="text-[11px] text-muted-foreground mt-0.5">Period: <span className="font-semibold text-foreground/70">{formatDateDDMMYYYY(selectedRental.start)}</span> to <span className="font-semibold text-foreground/70">{returnDate ? formatDateDDMMYYYY(returnDate) : (selectedRental.end ? formatDateDDMMYYYY(selectedRental.end) : "Ongoing")}</span></p>
                      </div>
                    </div>
                  </div>

                  {/* Select Equipment Checklist Grid */}
                  <div className="space-y-3.5 border border-border/60 bg-muted/10 p-4.5 rounded-xl">
                    <div className="flex items-center justify-between">
                      <Label className="text-[11.5px] font-bold uppercase tracking-wider text-muted-foreground">
                        Select Equipment to Return
                      </Label>
                      <span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
                        {selectedEquipmentIds.length} of {rentalEquipments.filter((it: any) => !it.returned).length || rentalEquipments.length} Selected
                      </span>
                    </div>
                    
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
                            className={`group flex items-start gap-3 p-3.5 rounded-xl border text-[12px] transition-all cursor-pointer relative overflow-hidden select-none ${
                              isReturned 
                                ? "bg-muted/15 border-border/30 opacity-55 cursor-not-allowed" 
                                : isChecked
                                  ? "bg-primary/5 border-primary/50 shadow-soft ring-1 ring-primary/10"
                                  : "bg-background border-border hover:border-primary/40 hover:shadow-soft"
                            }`}
                          >
                            {/* Selector Tick Box */}
                            {!isReturned && (
                              <div className={`h-4.5 w-4.5 rounded-md border flex items-center justify-center mt-0.5 shrink-0 transition-all ${
                                isChecked 
                                  ? "bg-primary border-primary text-primary-foreground" 
                                  : "border-border bg-background group-hover:border-primary/50"
                              }`}>
                                {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                              </div>
                            )}

                            <div className="flex-1 min-w-0 space-y-1">
                              <span className={`block font-bold text-[12.5px] tracking-tight leading-tight ${isReturned ? "text-muted-foreground line-through" : "text-foreground"}`}>
                                {eqName}
                              </span>
                              
                              <div className="space-y-0.5 text-[11.5px] text-muted-foreground mt-1">
                                <div className="flex items-center justify-between gap-1 overflow-hidden">
                                  <span className="shrink-0 font-medium text-muted-foreground">Serial:</span>
                                  <span className="font-mono font-bold text-foreground/90 truncate">{item.serial || "Not Set"}</span>
                                </div>
                                <div className="flex items-center justify-between gap-1 overflow-hidden">
                                  <span className="shrink-0 font-medium text-muted-foreground">Model:</span>
                                  <span className="font-semibold text-foreground/90 truncate">{modelNo}</span>
                                </div>
                                <div className="flex items-center justify-between gap-1 overflow-hidden">
                                  <span className="shrink-0 font-medium text-muted-foreground">Owner:</span>
                                  <span className="font-semibold text-foreground/90 truncate">{ownerName}</span>
                                </div>
                              </div>

                              <div className="mt-2.5 pt-2 border-t border-border/40 space-y-1 text-[11px]">
                                <div className="flex justify-between items-center">
                                  <span className="text-muted-foreground">Rent: <span className="font-bold text-foreground/80">₹{rentRate.toLocaleString("en-IN")}/{rentCycleLabel}</span></span>
                                  <span className={`px-1.5 py-0.2 rounded-[4px] text-[9.5px] font-black ${isRentPaid ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"}`}>
                                    {rentPaidText}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-muted-foreground">Deposit: <span className="font-bold text-foreground/80">₹{cleanNum(item.deposit).toLocaleString("en-IN")}</span></span>
                                  <span className={`px-1.5 py-0.2 rounded-[4px] text-[9.5px] font-black ${isDepositPaid ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"}`}>
                                    {depositPaidText}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Top corner indicator badge for already returned items */}
                            {isReturned && (() => {
                              const retRecord = mockReturns.find(r => 
                                (r.returnedEquipmentIds && r.returnedEquipmentIds.includes(item.equipmentId)) ||
                                (r.agreement === selectedRental.id)
                              );
                              const retDateRaw = item.returnedDate || item.returnDate || retRecord?.date || selectedRental.end;
                              const formattedRetDate = retDateRaw ? formatDateDDMMYYYY(retDateRaw) : "";
                              return (
                                <span className="absolute top-1.5 right-1.5 text-[9.5px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded shadow-2xs">
                                  Returned {formattedRetDate ? `on ${formattedRetDate}` : ""}
                                </span>
                              );
                            })()}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Right Column: Payment History */}
                <Card className="border border-border/50 bg-card/65 shadow-soft backdrop-blur-xs flex flex-col h-full overflow-hidden max-h-[385px] lg:mt-0">
                  <CardHeader className="p-4 border-b border-border/40 pb-3 flex flex-row items-center gap-2 shrink-0">
                    <Receipt className="h-4 w-4 text-primary" />
                    <div>
                      <CardTitle className="text-[13.5px] font-bold text-foreground">Payment Ledger</CardTitle>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Agreement transactions list</p>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0 flex-1 overflow-y-auto min-h-[180px]">
                    {agreementPayments.length === 0 ? (
                      <div className="py-16 text-center text-muted-foreground text-[12px] px-4">
                        <Receipt className="h-6 w-6 mx-auto text-muted-foreground/20 mb-2" />
                        <p className="font-bold text-foreground/75">No payments found</p>
                        <p className="text-[10.5px] text-muted-foreground/60 mt-0.5">No logged transactions found for this agreement.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-border/40">
                        {agreementPayments.map((p) => {
                          const isDeposit = p.type?.toLowerCase().includes("deposit");
                          return (
                            <div key={p.id} className="p-3 text-[12px] hover:bg-muted/10 transition-colors flex items-start justify-between gap-3">
                              <div className="space-y-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className={`px-1.5 py-0.2 rounded-[4px] text-[9.5px] font-black tracking-tight ${
                                    isDeposit 
                                      ? "bg-blue-50 text-blue-700 border border-blue-200" 
                                      : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  }`}>
                                    {p.type || "Rent"}
                                  </span>
                                  <span className="font-mono text-[10.5px] font-bold text-muted-foreground/70">{p.id}</span>
                                </div>
                                <p className="text-[11px] text-muted-foreground/90 truncate font-medium">{p.notes || "Rent payment"}</p>
                                <div className="flex items-center gap-2 text-[10.5px] text-muted-foreground/60 mt-1">
                                  <span>{formatDateDDMMYYYY(p.date)}</span>
                                  <span>·</span>
                                  <span>Mode: <strong className="text-foreground/70 font-semibold">{p.mode}</strong></span>
                                  {p.txRef && (
                                    <>
                                      <span>·</span>
                                      <span className="truncate max-w-[80px] font-mono">Ref: {p.txRef}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <span className="font-extrabold text-foreground text-[12.5px] whitespace-nowrap shrink-0">
                                ₹{cleanNum(p.amount).toLocaleString("en-IN")}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Live Audit Dues & Adjustments Adjustment Rows */}
            {selectedRental && (
              <div className="space-y-4">
                <div className="flex items-center gap-2.5">
                  <Sliders className="h-4 w-4 text-primary" />
                  <Label className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">
                    Adjustment Controls
                  </Label>
                </div>
                
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 bg-muted/20 p-4.5 rounded-xl border border-border/40">
                  {/* Column 1, Row 1: Rental Duration */}
                  <div className="space-y-1.5 bg-background rounded-lg p-3.5 border border-border flex flex-col justify-between">
                    <FieldLabel>Total Rental Duration</FieldLabel>
                    <div className="text-[13.5px] font-bold text-foreground h-9 flex items-center">
                      {selectedRental ? formatRentalDuration(selectedRental.start, returnDate, rentalEquipments[0]?.rentCycle) : "0 Days"}
                    </div>
                  </div>

                  {/* Column 2, Row 1: Total Rent Payable */}
                  <div className="space-y-1.5 bg-background rounded-lg p-3.5 border border-border">
                    <FieldLabel>Total Rent Payable</FieldLabel>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-2 text-[12px] font-bold text-muted-foreground">₹</span>
                      <Input
                        placeholder="0.00"
                        className="h-8 pl-7 text-[13px] font-semibold border-border focus-visible:ring-primary/20"
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

                  {/* Column 3, Row 1: Total Rent Paid */}
                  <div className="space-y-1.5 bg-background rounded-lg p-3.5 border border-border">
                    <FieldLabel>Total Rent Paid</FieldLabel>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-2 text-[12px] font-bold text-muted-foreground">₹</span>
                      <Input
                        placeholder="0.00"
                        className="h-8 pl-7 text-[13px] font-semibold border-border focus-visible:ring-primary/20"
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

                  {/* Column 4, Row 1: Outstanding Rent Due */}
                  <div className="space-y-1.5 bg-background rounded-lg p-3.5 border border-border">
                    <FieldLabel>Outstanding Rent Due</FieldLabel>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-2 text-[12px] font-bold text-muted-foreground">₹</span>
                      <Input
                        placeholder="0.00"
                        className={`h-8 pl-7 text-[13px] font-semibold ${cleanNum(pendingBalance) > 0 ? "text-rose-600 bg-rose-50/20 border-rose-200" : "text-foreground"}`}
                        value={pendingBalance}
                        onChange={(e) => setPendingBalance(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Column 1, Row 2: Damage Charges */}
                  <div className="space-y-1.5 bg-background rounded-lg p-3.5 border border-border">
                    <FieldLabel>Damage Charges</FieldLabel>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-2 text-[12px] font-bold text-muted-foreground">₹</span>
                      <Input
                        placeholder="0.00"
                        className="h-8 pl-7 text-[13px] font-semibold text-rose-600 bg-rose-50/20 border-rose-200 focus-visible:ring-rose-500"
                        value={damageCharges}
                        onChange={(e) => setDamageCharges(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Column 2, Row 2: Return Discount */}
                  <div className="space-y-1.5 bg-background rounded-lg p-3.5 border border-border">
                    <FieldLabel>Return Discount</FieldLabel>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-2 text-[12px] font-bold text-muted-foreground">₹</span>
                      <Input
                        placeholder="0.00"
                        className="h-8 pl-7 text-[13px] font-semibold text-emerald-600 bg-emerald-50/20 border-emerald-200 focus-visible:ring-emerald-500"
                        value={discount}
                        onChange={(e) => setDiscount(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Column 3, Row 2: Unpaid Additional Accessories */}
                  <div className="space-y-1.5 bg-background rounded-lg p-3.5 border border-border flex flex-col justify-between min-h-[64px]">
                    <FieldLabel>Unpaid Accessories</FieldLabel>
                    <div className="text-[11.5px] font-semibold text-foreground leading-tight mt-1">
                      {unpaidItems.length > 0 ? (
                        <div className="max-h-[36px] overflow-y-auto space-y-0.5">
                          {unpaidItems.map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between text-rose-600 text-[10px]">
                              <span className="truncate max-w-[110px]">{item.name}</span>
                              <span>₹{cleanNum(item.amount)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">₹0</span>
                      )}
                    </div>
                  </div>

                  {/* Column 4, Row 2: Security Deposit */}
                  <div className="space-y-1.5 bg-background rounded-lg p-3.5 border border-border flex flex-col justify-between">
                    <FieldLabel>Security Deposit</FieldLabel>
                    <div className="text-[14px] font-bold text-blue-600 h-9 flex items-center">
                      ₹{deposit.toLocaleString("en-IN")}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Detailed Return & Reconciliation Summary Grid Panel */}
            {selectedRental ? (
              (() => {
                // ITEM-10: read the shared settlement values rather than
                // recomputing them - the ledger and the saved record must never
                // be able to drift apart again.
                const dmgCharges = dmg;
                const unpaidAccessoriesTotal = unpaidAccessoryTotal;
                const totalDueVal = totalDueBeforeDiscount;
                const returnDiscountVal = effectiveDiscount;
                const afterDiscountTotalDueVal = afterDiscountTotalDue;
                const totalDepositVal = deposit;

                return (
                  <div className="rounded-xl border border-border/60 bg-muted/5 overflow-hidden">
                    <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border/60 bg-muted/20">
                      <div className="metric-icon h-7 w-7 shrink-0 bg-primary/10 text-primary border-primary/20">
                        <Receipt className="h-4 w-4" />
                      </div>
                      <span className="text-[12px] font-bold uppercase tracking-wider text-foreground">
                        Reconciliation Ledger Details
                      </span>
                    </div>
                    
                    <div className="p-0">
                      <Table>
                        <TableHeader className="bg-muted/10">
                          <TableRow>
                            <TableHead className="font-bold text-[11px] text-muted-foreground uppercase pl-6">Ledger Line Item</TableHead>
                            <TableHead className="font-bold text-[11px] text-muted-foreground uppercase">Calculation Details</TableHead>
                            <TableHead className="text-right font-bold text-[11px] text-muted-foreground uppercase pr-6">Amount (₹)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow className="hover:bg-muted/5 transition-colors">
                            <TableCell className="font-semibold text-[13px] text-foreground pl-6">Total Due</TableCell>
                            <TableCell className="text-[11.5px] text-muted-foreground">
                              Remaining Rent Dues (₹{remainingRentDues.toLocaleString("en-IN")}) 
                              {dmgCharges > 0 && ` + Damage Charges (₹${dmgCharges.toLocaleString("en-IN")})`}
                              {unpaidAccessoriesTotal > 0 && ` + Unpaid Accessories (₹${unpaidAccessoriesTotal.toLocaleString("en-IN")})`}
                            </TableCell>
                            <TableCell className="text-right font-bold text-[13px] pr-6">
                              ₹{totalDueVal.toLocaleString("en-IN")}
                            </TableCell>
                          </TableRow>

                          {rentOverpaid > 0 && (
                            <TableRow className="hover:bg-muted/5 transition-colors bg-blue-50/10">
                              <TableCell className="font-semibold text-[13px] text-blue-700 pl-6">Rent Advance Credit</TableCell>
                              <TableCell className="text-[11.5px] text-blue-600">Customer paid ₹{rentOverpaid.toLocaleString("en-IN")} more than rent due — credited against deposit</TableCell>
                              <TableCell className="text-right font-bold text-blue-600 text-[13px] pr-6">
                                + ₹{rentOverpaid.toLocaleString("en-IN")}
                              </TableCell>
                            </TableRow>
                          )}

                          <TableRow className="hover:bg-muted/5 transition-colors">
                            <TableCell className="font-semibold text-[13px] text-foreground pl-6">Return Discount</TableCell>
                            <TableCell className="text-[11.5px] text-muted-foreground">Discount applied on return</TableCell>
                            <TableCell className="text-right font-bold text-emerald-600 text-[13px] pr-6">
                              - ₹{returnDiscountVal.toLocaleString("en-IN")}
                            </TableCell>
                          </TableRow>

                          <TableRow className="hover:bg-muted/5 transition-colors bg-muted/5 font-semibold">
                            <TableCell className="text-[13px] text-foreground font-bold pl-6">After Discount Total Due</TableCell>
                            <TableCell className="text-[11.5px] text-muted-foreground">Total Due - Return Discount</TableCell>
                            <TableCell className="text-right font-bold text-[13px] pr-6">
                              ₹{afterDiscountTotalDueVal.toLocaleString("en-IN")}
                            </TableCell>
                          </TableRow>

                          <TableRow className="hover:bg-muted/5 transition-colors">
                            <TableCell className="font-semibold text-[13px] text-foreground pl-6">Security Deposit Offset</TableCell>
                            <TableCell className="text-[11.5px] text-muted-foreground">Total security deposit paid under agreement</TableCell>
                            <TableCell className="text-right font-bold text-blue-600 text-[13px] pr-6">
                              ₹{totalDepositVal.toLocaleString("en-IN")}
                            </TableCell>
                          </TableRow>

                          <TableRow className={`font-black text-[13.5px] ${netRefund >= 0 ? "bg-emerald-50/20 text-emerald-700" : "bg-rose-50/20 text-rose-700"}`}>
                            <TableCell className="py-3.5 pl-6 font-bold">Final Settlement</TableCell>
                            <TableCell className="text-[11.5px] font-medium">
                              {netRefund >= 0 
                                ? "Security Deposit Offset - After Discount Total Due (Refundable to Customer)" 
                                : "After Discount Total Due - Security Deposit Offset (Collect from Customer)"
                              }
                            </TableCell>
                            <TableCell className="text-right py-3.5 pr-6">
                              {netRefund >= 0 
                                ? `₹${Math.abs(netRefund).toLocaleString("en-IN")} (Refundable)` 
                                : `₹${Math.abs(netRefund).toLocaleString("en-IN")} (Collect Dues)`
                              }
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>

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
                        <div className="m-4 rounded-xl border border-amber-500/30 bg-amber-50/20 dark:bg-amber-950/20 p-4 space-y-4">
                          <div className="flex items-center justify-between flex-wrap gap-2 border-b border-amber-500/20 pb-2.5">
                            <div className="flex items-center gap-2">
                              <CreditCard className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                              <span className="text-[12.5px] font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wide">
                                Due Amount Payment Settlement (Total Collectible: ₹{totalDueAmt.toLocaleString("en-IN")})
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {duePaymentStatus === "Partial" && (
                                <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 px-2.5 py-0.5 rounded-full">
                                  Pending Due: ₹{remainingDueVal.toLocaleString("en-IN")}
                                </span>
                              )}
                              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-700 px-2.5 py-0.5 rounded-full">
                                Settlement Options
                              </span>
                            </div>
                          </div>

                          <div className="space-y-4">
                            {/* Status Buttons: Full Payment / Partial Payment / Not Paid */}
                            <div className="space-y-1.5">
                              <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Due Payment Status</Label>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 bg-background p-1.5 rounded-lg border border-border h-auto sm:h-11">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDuePaymentStatus("Paid");
                                    setDuePaidAmount(totalDueAmt.toString());
                                    setDueCashAmount(Math.round(totalDueAmt / 2).toString());
                                    setDueBankAmount((totalDueAmt - Math.round(totalDueAmt / 2)).toString());
                                  }}
                                  className={`flex items-center justify-center gap-1.5 rounded-md py-2 sm:py-0 text-[12px] font-bold transition-all ${
                                    duePaymentStatus === "Paid"
                                      ? "bg-emerald-600 text-white shadow-xs"
                                      : "text-muted-foreground hover:text-foreground"
                                  }`}
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  <span>Full Payment</span>
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
                                  className={`flex items-center justify-center gap-1.5 rounded-md py-2 sm:py-0 text-[12px] font-bold transition-all ${
                                    duePaymentStatus === "Partial"
                                      ? "bg-amber-600 text-white shadow-xs"
                                      : "text-muted-foreground hover:text-foreground"
                                  }`}
                                >
                                  <Clock className="h-3.5 w-3.5" />
                                  <span>Partial Payment</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setDuePaymentStatus("Not Paid")}
                                  className={`flex items-center justify-center gap-1.5 rounded-md py-2 sm:py-0 text-[12px] font-bold transition-all ${
                                    duePaymentStatus === "Not Paid"
                                      ? "bg-rose-600 text-white shadow-xs"
                                      : "text-muted-foreground hover:text-foreground"
                                  }`}
                                >
                                  <XCircle className="h-3.5 w-3.5" />
                                  <span>Not Paid (Due)</span>
                                </button>
                              </div>
                            </div>

                            {/* Sub-controls when Paid or Partial */}
                            {duePaymentStatus !== "Not Paid" ? (
                              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 items-end">
                                {/* Option 2: Payment Mode */}
                                <div className="space-y-1.5">
                                  <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Payment Mode</Label>
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
                                    <SelectTrigger className="h-10 text-[13px] bg-background font-medium">
                                      <SelectValue placeholder="Select mode" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Cash">Cash</SelectItem>
                                      <SelectItem value="Bank">Bank</SelectItem>
                                      <SelectItem value="Cash+Bank">Cash + Bank</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                {/* Partial Amount Input */}
                                {duePaymentStatus === "Partial" && (
                                  <div className="space-y-1.5">
                                    <Label className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                                      Payment Amount Received (₹)
                                    </Label>
                                    <Input
                                      type="number"
                                      placeholder={`Max ₹${totalDueAmt}`}
                                      className="h-10 text-[13px] font-bold bg-background text-foreground border-amber-300 dark:border-amber-700"
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

                                {/* Transaction Reference Number (Optional for Bank) */}
                                <div className="space-y-1.5">
                                  <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                    Txn / Ref No. (Optional)
                                  </Label>
                                  <Input
                                    placeholder="e.g. UPI Ref / Bank Txn ID"
                                    className="h-10 text-[13px] bg-background"
                                    value={dueTxRef}
                                    onChange={(e) => setDueTxRef(e.target.value)}
                                  />
                                </div>

                                {/* Split Cash + Bank Inputs */}
                                {duePaymentMode === "Cash+Bank" && (
                                  <div className="sm:col-span-2 lg:col-span-3 grid grid-cols-2 gap-3 p-3 bg-background rounded-lg border border-border mt-1">
                                    <div className="space-y-1.5">
                                      <Label className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                                        Cash Amount (₹)
                                      </Label>
                                      <Input
                                        type="number"
                                        placeholder="Cash part"
                                        className="h-9 text-[13px] font-semibold bg-emerald-50/20 border-emerald-300 dark:border-emerald-800"
                                        value={dueCashAmount}
                                        onChange={(e) => {
                                          const cVal = e.target.value;
                                          setDueCashAmount(cVal);
                                          const cNum = Math.max(0, cleanNum(cVal));
                                          setDueBankAmount(Math.max(0, currentPaidVal - cNum).toString());
                                        }}
                                      />
                                    </div>
                                    <div className="space-y-1.5">
                                      <Label className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                                        Bank Amount (₹)
                                      </Label>
                                      <Input
                                        type="number"
                                        placeholder="Bank part"
                                        className="h-9 text-[13px] font-semibold bg-blue-50/20 border-blue-300 dark:border-blue-800"
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
                              <div className="p-3 rounded-lg bg-rose-100/60 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-[11.5px] flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                                <span>
                                  Full due amount of <strong>₹{totalDueAmt.toLocaleString("en-IN")}</strong> will be recorded as an <strong>Unpaid Pending Due</strong> in Rent Dues & Payments Ledger.
                                </span>
                              </div>
                            )}

                            {/* Summary Card for Partial Payment */}
                            {duePaymentStatus === "Partial" && (
                              <div className="p-3 rounded-lg bg-amber-100/40 dark:bg-amber-900/20 border border-amber-300/60 dark:border-amber-800/60 flex items-center justify-between text-[12px] flex-wrap gap-2">
                                <div className="flex items-center gap-2 font-medium text-amber-900 dark:text-amber-200">
                                  <span>Total Dues: <strong>₹{totalDueAmt.toLocaleString("en-IN")}</strong></span>
                                  <span>·</span>
                                  <span className="text-emerald-700 dark:text-emerald-400">Received Now: <strong>₹{currentPaidVal.toLocaleString("en-IN")}</strong></span>
                                </div>
                                <span className="font-bold text-rose-700 dark:text-rose-300 bg-background px-2.5 py-1 rounded border border-rose-200 dark:border-rose-900">
                                  Remaining Pending Due: ₹{remainingDueVal.toLocaleString("en-IN")}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                );
              })()
            ) : (
              <div className="rounded-xl border border-dashed border-border/80 p-8 text-center text-muted-foreground text-[12.5px] flex-1 flex flex-col items-center justify-center bg-muted/5 min-h-[160px]">
                <Package className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="font-semibold text-foreground/75">No agreement selected</p>
                <p className="text-muted-foreground text-[11px] mt-0.5">Select a rental agreement above to generate calculations & pro-rata details.</p>
              </div>
            )}

            {/* Return Collected By & Inspection Notes */}
            <div className="grid gap-5 sm:grid-cols-3">
              <div className="space-y-1.5">
                <FieldLabel>Return Collected By</FieldLabel>
                <div className="relative">
                  <Input
                    placeholder="Enter collector's name"
                    className="h-10 text-[13px] pl-9"
                    value={collectedBy}
                    onChange={(e) => setCollectedBy(e.target.value)}
                  />
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/60" />
                </div>
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <FieldLabel>Audit & Inspection Remarks</FieldLabel>
                <Textarea
                  placeholder="Describe condition details, listing of accessories returned, audit adjustments details..."
                  className="min-h-[75px] resize-none text-[13px] focus-visible:ring-primary/20"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            {/* Auto-Generated WhatsApp Pickup Message Box */}
            {selectedRental && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/20 p-4 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2 border-b border-emerald-500/20 pb-2">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-[12.5px] font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wide">
                      WhatsApp Pickup / Collection Message Preview
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
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
                          equipmentIds: selectedEquipmentIds,   // ITEM-5
                        });
                        navigator.clipboard.writeText(msg);
                        toast.success("WhatsApp pickup message copied to clipboard!");
                      }}
                      className="h-7 px-2.5 text-[11.5px] font-bold gap-1.5 border-emerald-300"
                    >
                      <Copy className="h-3.5 w-3.5 text-primary" /> Copy Message
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
                          equipmentIds: selectedEquipmentIds,   // ITEM-5
                        });
                        const cleanPhone = (selectedCustomer?.phone || (selectedRental as any)?.phone || "").replace(/\D/g, "");
                        const text = encodeURIComponent(msg);
                        const targetUrl = cleanPhone 
                          ? `https://wa.me/91${cleanPhone}?text=${text}` 
                          : `https://wa.me/?text=${text}`;
                        window.open(targetUrl, "_blank");
                      }}
                      className="h-7 px-2.5 text-[11.5px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                    >
                      <MessageCircle className="h-3.5 w-3.5" /> Send to WhatsApp
                    </Button>
                  </div>
                </div>

                <Textarea
                  readOnly
                  rows={6}
                  value={generateWhatsAppPickupMessage({
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
                    equipmentIds: selectedEquipmentIds,   // ITEM-5
                  })}
                  className="font-mono text-[12.5px] bg-background border-emerald-300 dark:border-emerald-800 leading-relaxed font-semibold cursor-text text-foreground"
                />
              </div>
            )}

            {/* Footer buttons row */}
            <div className="flex items-center justify-between border-t border-border/50 pt-5">
              <p className="text-[11.5px] text-muted-foreground flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Processing automatically sets returning serials to Available / Maintenance.</span>
              </p>
              <div className="flex gap-2.5">
                <Button variant="outline" type="button" onClick={handleGenerateReceipt} disabled={!selectedAgreement}>
                  <Receipt className="mr-1.5 h-4 w-4 text-muted-foreground" />
                  Print Receipt
                </Button>
                <Button type="button" onClick={handleProcessReturn} disabled={!selectedAgreement || isSubmitting}>
                  <RotateCcw className="mr-1.5 h-4 w-4" />
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
                  <SelectTrigger className="w-[140px] h-8.5 text-[11.5px] bg-background"><SelectValue placeholder="Owner" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-owners">All Owners</SelectItem>
                    {activeOwners.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>

                <Select value={historyCategoryFilter} onValueChange={setHistoryCategoryFilter}>
                  <SelectTrigger className="w-[150px] h-8.5 text-[11.5px] bg-background"><SelectValue placeholder="Category" /></SelectTrigger>
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
            <div className="hidden sm:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/10">
                    {/* ITEM-18: Return Date, Customer, Equipment & S/N, Condition,
                        Rent Collected, Deposit Refunded, then Actions. */}
                    <TableHead className="w-[110px]">Return ID</TableHead>
                    <TableHead className="w-[100px]">Return Date</TableHead>
                    <TableHead className="w-[180px]">Customer</TableHead>
                    <TableHead>Equipment &amp; S/N</TableHead>
                    <TableHead className="w-[110px]">Condition</TableHead>
                    <TableHead className="text-right w-[120px]">Rent Collected</TableHead>
                    <TableHead className="text-right w-[120px]">Deposit Refunded</TableHead>
                    <TableHead className="text-right w-[110px]">Damages/Dues</TableHead>
                    <TableHead className="text-right w-[110px]">Final Settlement</TableHead>
                    <TableHead className="w-[120px] text-center">Status</TableHead>
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
                      return (
                        <TableRow key={ret.id} className="group hover:bg-muted/15 transition-colors">
                          <TableCell className="font-mono text-[11.5px] font-black text-primary">{ret.id}</TableCell>
                          <TableCell className="text-[11.5px] text-muted-foreground">{formatDateDDMMYYYY(ret.date)}</TableCell>
                          
                          <TableCell>
                            <div className="font-semibold text-[13px] text-foreground">{ret.customer}</div>
                            <div className="text-[10px] text-muted-foreground font-mono mt-0.5">Agr: {ret.agreement}</div>
                          </TableCell>

                          <TableCell className="text-[12.5px] text-foreground/80">
                            {/* ITEM-18/ITEM-7: identify the physical unit, not just
                                the category - a return record names which serial
                                actually came back. */}
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

                          <TableCell>
                            <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10.5px] font-bold border ${
                              (() => {
                                const c = (ret.condition || "").toLowerCase();
                                if (c.includes("good") || c.includes("available")) {
                                  return "bg-emerald-50 text-emerald-700 border-emerald-200/50";
                                } else if (c.includes("maint") || c.includes("fair")) {
                                  return "bg-amber-50 text-amber-700 border-amber-200/50";
                                }
                                return "bg-rose-50 text-rose-700 border-rose-200/50";
                              })()
                            }`}>
                              {ret.condition}
                            </span>
                          </TableCell>

                          {/* ITEM-18: rent actually recovered on this return, and
                              what the customer got back from their deposit. */}
                          <TableCell className="text-right text-[12.5px]">
                            {(() => {
                              const rentCharged = cleanNum(ret.finalRent);
                              const stillOwed = cleanNum(ret.pendingBalance);
                              const collected = Math.max(0, rentCharged - stillOwed);
                              return (
                                <div>
                                  <p className="font-bold text-emerald-600">₹{collected.toLocaleString("en-IN")}</p>
                                  <p className="text-[10px] text-muted-foreground mt-0.5">
                                    of ₹{rentCharged.toLocaleString("en-IN")} rent
                                  </p>
                                </div>
                              );
                            })()}
                          </TableCell>

                          <TableCell className="text-right text-[12.5px]">
                            {(() => {
                              const depositHeld = cleanNum(ret.deposit);
                              // A positive settlement is money handed back; a
                              // negative one means the deposit was consumed by
                              // dues and nothing was refunded.
                              const refunded = cleanNum(ret.refund) > 0 ? Math.min(cleanNum(ret.refund), depositHeld) : 0;
                              return (
                                <div>
                                  <p className={`font-bold ${refunded > 0 ? "text-emerald-600" : "text-muted-foreground"}`}>
                                    ₹{refunded.toLocaleString("en-IN")}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground mt-0.5">
                                    of ₹{depositHeld.toLocaleString("en-IN")} held
                                  </p>
                                </div>
                              );
                            })()}
                          </TableCell>
                          
                          <TableCell className="text-right text-[12px] space-y-0.5">
                            {ret.damageCharges > 0 && (
                              <p className="text-rose-600 font-semibold">Dmg: ₹{ret.damageCharges.toLocaleString("en-IN")}</p>
                            )}
                            {ret.pendingBalance > 0 && (
                              <p className="text-amber-600 font-semibold">Dues: ₹{ret.pendingBalance.toLocaleString("en-IN")}</p>
                            )}
                            {ret.unpaidAccessoryTotal > 0 && (
                              <p className="text-amber-500 font-semibold">Acc: ₹{ret.unpaidAccessoryTotal.toLocaleString("en-IN")}</p>
                            )}
                            {ret.damageCharges === 0 && ret.pendingBalance === 0 && (ret.unpaidAccessoryTotal || 0) === 0 && (
                              <span className="text-muted-foreground">—</span>
                            )}
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
            <div className="sm:hidden">
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

