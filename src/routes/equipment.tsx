import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef, useMemo } from "react";
import { AppShell, StatusBadge } from "@/components/layout/AppShell";
import { EquipmentFormDialog, Equipment, isOwnOwner } from "../components/EquipmentFormDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plus, Search, QrCode, Package, Wrench, AlertTriangle, CheckCircle2,
  Trash2, History, Edit, Wind, Activity, Bed,
  Droplets, Stethoscope, Filter, IndianRupee, Calendar, RefreshCw, ArrowUpRight, ArrowDownLeft, Home,
  Download, FileSpreadsheet, Printer
} from "lucide-react";
import {
  getEquipment,
  saveEquipment,
  deleteEquipment,
  getRentals,
  getCustomers,
  downloadFile,
  getOwners,
  useDatabaseTrigger,
  formatDateDDMMYYYY,
  getReturns,
  getExchanges,
  downloadExcel,
  getLocalYYYYMMDD,
  parseLocalDate,
} from "@/lib/data-store";

export const Route = createFileRoute("/equipment")({
  head: () => ({ meta: [{ title: "Equipment — Relife" }] }),
  component: EquipmentPage,
});



const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "Oxygen Concentrator 5LP": Wind,
  "Oxygen Concentrator 10LPM": Wind,
  "Bipap Machine":           Filter,
  "Auto CPAP Machine":       Activity,
  "Surgical Cot With Mattress": Bed,
  "Foldable Wheel Chair":     Package,
  "Patient Monitor":         Activity,
  "Syringe Pump":            Droplets,
  "Infusion Pump":           Droplets,
  "Nebulizer":               Wind,
  "Patient Ventilator":      Wind,
};

const categoryColors: Record<string, string> = {
  "Oxygen Concentrator 5LP": "text-primary bg-primary/10",
  "Oxygen Concentrator 10LPM": "text-primary bg-primary/10",
  "Bipap Machine":           "text-primary bg-primary/10",
  "Auto CPAP Machine":       "text-primary bg-primary/10",
  "Surgical Cot With Mattress": "text-accent bg-accent/10",
  "Foldable Wheel Chair":     "text-accent bg-accent/10",
  "Patient Monitor":         "text-success bg-success/10",
  "Syringe Pump":            "text-warning-foreground bg-warning/10",
  "Infusion Pump":           "text-warning-foreground bg-warning/10",
  "Nebulizer":               "text-primary bg-primary/10",
  "Patient Ventilator":      "text-primary bg-primary/10",
};

const categoryImages: Record<string, string> = {
  "Oxygen Concentrator 5LP": "/images/oxygen_concentrator_5lp.png",
  "Oxygen Concentrator 10LPM": "/images/oxygen_concentrator_10lpm.png",
  "Bipap Machine": "/images/bipap_machine.png",
  "Auto CPAP Machine": "/images/auto_cpap_machine.png",
  "Surgical Cot With Mattress": "/images/surgical_cot_mattress.png",
  "Foldable Wheel Chair": "/images/foldable_wheel_chair.png",
  "Patient Monitor": "/images/patient_monitor.png",
  "Syringe Pump": "/images/syringe_pump.png",
  "Infusion Pump": "/images/infusion_pump.png",
  "Nebulizer": "/images/nebulizer_device.png",
  "Patient Ventilator": "/images/patient_ventilator.png",
};
function DeleteEquipmentDialog({ eq, trigger, onDelete }: { eq: Equipment; trigger: React.ReactNode; onDelete?: () => void }) {
  const handleDelete = () => {
    deleteEquipment(eq.id);
    toast.success(`Equipment "${eq.name}" has been deleted.`);
    if (onDelete) onDelete();
  };
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-destructive flex items-center gap-2">
            <Trash2 className="h-4 w-4" /> Delete Equipment
          </DialogTitle>
        </DialogHeader>
        <div className="py-2 space-y-3">
          <p className="text-[13px] text-muted-foreground">
            Delete <strong className="text-foreground">{eq.name}</strong> (SN: {eq.serial})?
          </p>
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

function OwnerActionDialog({
  eq,
  actionType,
  trigger,
  onSave,
}: {
  eq: Equipment;
  actionType: "return" | "receive";
  trigger: React.ReactNode;
  onSave?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(getLocalYYYYMMDD());
  const [dailyRate, setDailyRate] = useState(eq.ownerDailyRate?.toString() || "");
  const [notes, setNotes] = useState("");

  // Get previous receive/purchase date if we are doing a return
  const startDate = useMemo(() => {
    if (actionType !== "return") return "";
    if (eq.ownerHistory && Array.isArray(eq.ownerHistory)) {
      const receives = eq.ownerHistory.filter((h: any) => h.action === "received");
      if (receives.length > 0) {
        const sorted = [...receives].sort((a: any, b: any) => parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime());
        return sorted[0].date;
      }
    }
    return eq.purchaseDate || getLocalYYYYMMDD();
  }, [eq, actionType, open]);

  // Calculate days and cost
  const calculation = useMemo(() => {
    if (actionType !== "return" || !startDate || !date) return null;
    const startD = parseLocalDate(startDate);
    const endD = parseLocalDate(date);
    if (isNaN(startD.getTime()) || isNaN(endD.getTime())) return null;
    const diff = endD.getTime() - startD.getTime();
    const days = Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    const rate = eq.ownerDailyRate || 0;
    const totalCost = days * rate;
    return { days, totalCost };
  }, [startDate, date, eq.ownerDailyRate, actionType]);

  // Reset dialog state when opened
  useEffect(() => {
    if (open) {
      setDate(getLocalYYYYMMDD());
      setDailyRate(eq.ownerDailyRate?.toString() || "");
      setNotes("");
    }
  }, [open, eq]);

  const handleSave = () => {
    if (!date) {
      toast.error("Please select a date.");
      return;
    }
    const rateVal = actionType === "return" ? (eq.ownerDailyRate || 0) : (parseFloat(dailyRate) || 0);
    if (actionType === "receive" && rateVal < 0) {
      toast.error("Rate cannot be negative.");
      return;
    }

    const histEntry: any = {
      date,
      action: actionType === "return" ? "returned" : "received",
      dailyRate: rateVal,
      notes: notes.trim(),
    };

    if (actionType === "return" && calculation) {
      histEntry.startDate = startDate;
      histEntry.days = calculation.days;
      histEntry.totalCost = calculation.totalCost;
    }

    const updatedHistory = [...(eq.ownerHistory || []), histEntry];

    const savedEq = {
      ...eq,
      status: actionType === "return" ? "Returned to Owner" : "Available",
      ownerDailyRate: actionType === "return" ? (eq.ownerDailyRate || 0) : rateVal,
      ownerHistory: updatedHistory,
    };

    try {
      saveEquipment(savedEq);
    } catch (err) {
      // setStorageItem re-throws on QuotaExceededError; surface it instead of
      // letting the throw escape and leaving the dialog looking inert.
      toast.error("Could not save this equipment change — nothing was recorded.", {
        description: err instanceof Error ? err.message : String(err),
        duration: 12000,
      });
      return;
    }

    toast.success(
      actionType === "return"
        ? `"${eq.name}" returned to owner. Total payout calculated: ₹${calculation?.totalCost?.toLocaleString("en-IN")}`
        : `"${eq.name}" received from owner. Daily rate set to ₹${rateVal}/day.`
    );
    setOpen(false);
    if (onSave) onSave();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md bg-white border border-slate-100 rounded-[16px] sm:rounded-[20px] p-4 sm:p-6 shadow-[0_20px_50px_rgba(15,23,42,0.06)]">
        <DialogHeader className="border-b border-slate-100 pb-3">
          <DialogTitle className="text-md font-bold text-slate-800 flex items-center gap-2">
            {actionType === "return" ? "🔄 Return to Owner" : "📥 Receive from Owner"}
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="bg-slate-50 p-3.5 rounded-xl text-[12.5px] space-y-1.5 border border-slate-100">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Equipment:</span>
              <strong className="text-slate-700">{eq.name}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Serial Number:</span>
              <span className="font-mono text-slate-600">{eq.serial}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Owner:</span>
              <span className="font-semibold text-slate-700">{eq.owner || "Company"}</span>
            </div>
            {actionType === "return" && startDate && (
              <div className="flex justify-between pt-1 border-t border-slate-200/60 mt-1">
                <span className="text-muted-foreground">Received Date:</span>
                <span className="font-semibold text-slate-700">{formatDateDDMMYYYY(startDate)}</span>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {actionType === "return" ? "Return Date" : "Receive Date"}
            </Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-white border-slate-200 h-10 text-[13px] rounded-lg focus-visible:ring-1 focus-visible:ring-primary/45"
            />
          </div>

          {actionType === "receive" && (
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Daily Rate to Owner (₹)
              </Label>
              <Input
                type="number"
                min="0"
                value={dailyRate}
                onChange={(e) => setDailyRate(e.target.value)}
                placeholder="e.g. 50"
                className="bg-white border-slate-200 h-10 text-[13px] rounded-lg focus-visible:ring-1 focus-visible:ring-primary/45"
              />
            </div>
          )}
          {actionType === "return" && (
            <div className="space-y-1.5 bg-slate-50/80 p-3 rounded-xl border border-slate-100/60 flex justify-between items-center text-[12.5px]">
              <span className="text-muted-foreground font-semibold">Daily Rate to Owner:</span>
              <strong className="text-slate-700">₹{(eq.ownerDailyRate || 0).toLocaleString("en-IN")}/day</strong>
            </div>
          )}

          {actionType === "return" && calculation && (
            <div className="bg-amber-50/60 border border-amber-100 p-3.5 rounded-xl text-[12.5px] space-y-1.5">
              <div className="flex justify-between">
                <span className="text-amber-800">Total Duration:</span>
                <strong className="text-amber-900">{calculation.days} day(s)</strong>
              </div>
              <div className="flex justify-between pt-1 border-t border-amber-200/40">
                <span className="text-amber-800 font-medium">Total Payout due to Owner:</span>
                <strong className="text-amber-900 text-[14px]">₹{calculation.totalCost.toLocaleString("en-IN")}</strong>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Notes / Remarks</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any comments regarding device condition or transfer..."
              className="bg-white border-slate-200 h-10 text-[13px] rounded-lg focus-visible:ring-1 focus-visible:ring-primary/45"
            />
          </div>
        </div>

        <DialogFooter className="border-t border-slate-100 pt-4 flex gap-2 justify-end">
          <DialogClose asChild>
            <Button variant="outline" type="button" className="h-10 rounded-lg text-[13px] border-slate-200 hover:bg-slate-50 cursor-pointer">
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="button"
            onClick={handleSave}
            className="h-10 px-5 bg-primary text-primary-foreground hover:bg-primary/95 rounded-lg text-[13px] font-medium cursor-pointer border-0 shadow-sm"
          >
            {actionType === "return" ? "Return to Owner" : "Receive & Mark Available"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function QrCodeDialog({ eq }: { eq: Equipment }) {
  const [imgError, setImgError] = useState(false);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground" title="QR Code">
          <QrCode className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xs text-center bg-background border border-border shadow-elevated rounded-[16px] sm:rounded-[20px] p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-sm font-bold text-foreground">QR Code — {eq.name}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-48 w-48 items-center justify-center rounded-2xl border border-border/60 bg-white p-3.5 shadow-soft">
              {!imgError ? (
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(eq.serial)}`}
                  alt={`QR Code for ${eq.serial}`}
                  className="h-full w-full object-contain"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="text-center">
                  <QrCode className="mx-auto h-16 w-16 text-muted-foreground/30" />
                  <p className="text-[11px] text-muted-foreground mt-2 font-semibold">Offline QR Preview</p>
                </div>
              )}
            </div>
            <p className="text-[12px] font-mono font-bold text-foreground">{eq.serial}</p>
          </div>
        </div>
        <DialogFooter className="grid grid-cols-2 gap-2 mt-2">
          <Button variant="outline" className="text-[12px] h-9 w-full" onClick={() => toast.success("QR Code sent to printer successfully.")}>Print QR</Button>
          <Button
            variant="outline"
            className="text-[12px] h-9 w-full"
            onClick={async () => {
              toast.loading("Generating real QR Code SVG...");
              try {
                const response = await fetch(
                  `https://api.qrserver.com/v1/create-qr-code/?size=300x300&format=svg&data=${encodeURIComponent(eq.serial)}`
                );
                if (!response.ok) throw new Error("Network response was not ok");
                const svgText = await response.text();
                downloadFile(`QR_Code_${eq.serial}.svg`, svgText, "image/svg+xml");
                toast.dismiss();
                toast.success("QR Code SVG downloaded successfully.");
              } catch (err) {
                toast.dismiss();
                toast.error("Failed to download QR code. Running offline?");
                const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="200" height="200" fill="#ffffff">
  <rect width="100" height="100" fill="#ffffff" />
  <rect x="5" y="5" width="90" height="90" fill="none" stroke="#000000" stroke-width="2" />
  <text x="50" y="54" font-family="monospace" font-size="10" font-weight="bold" text-anchor="middle" fill="#000000">${eq.serial}</text>
</svg>`;
                downloadFile(`QR_Code_${eq.serial}.svg`, fallbackSvg, "image/svg+xml");
              }
            }}
          >
            Download SVG
          </Button>
          <Button
            className="col-span-2 text-[12px] h-9 w-full font-semibold"
            onClick={async () => {
              toast.loading("Generating QR Code PNG...");
              try {
                const response = await fetch(
                  `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(eq.serial)}`
                );
                if (!response.ok) throw new Error("Network response was not ok");
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `QR_Code_${eq.serial}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                toast.dismiss();
                toast.success("QR Code PNG downloaded successfully.");
              } catch (err) {
                toast.dismiss();
                toast.error("Failed to download PNG. Running offline?");
              }
            }}
          >
            Download PNG (Recommended for scan upload)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EquipmentHistorySheet({ eq, open, onClose }: { eq: Equipment | null; open: boolean; onClose: () => void }) {
  if (!eq) return null;
  const rentals = getRentals();
  const returns = getReturns();
  const exchanges = getExchanges();
  const Icon = categoryIcons[eq.category] ?? Stethoscope;

  const events: {
    date: string;
    type: string;
    section: "rental" | "owner";
    title: string;
    description: string;
    meta?: string;
  }[] = [];

  // 1. Purchase / Sourcing Event
  if (eq.purchaseDate) {
    events.push({
      date: eq.purchaseDate,
      type: "purchase",
      section: "owner",
      title: "Equipment Purchased & Sourced",
      description: `Brought into inventory from owner "${eq.owner || "Unknown Owner"}"`,
      meta: `Daily Rate to Owner: ₹${(Number(eq.ownerDailyRate) || 0).toLocaleString("en-IN")}/day`
    });
  }

  // 2. Rental Agreements History
  const eqRentals = rentals.filter((r) => {
    if (r.equipmentId === eq.id) return true;
    if (r.equipmentId && r.equipmentId.split(", ").includes(eq.id)) return true;
    if (r.equipmentItems && r.equipmentItems.some((item: any) => item.equipmentId === eq.id)) return true;
    return false;
  });

  eqRentals.forEach((r) => {
    if (r.start) {
      events.push({
        date: r.start.split("T")[0],
        type: "rent_start",
        section: "rental",
        title: "Dispatched (Rented Out)",
        description: `Delivered to customer "${r.customer}"`,
        meta: `Agreement ID: ${r.id}`
      });
    }

    // A return is linked to this rental agreement and contains this equipment
    const matchingReturn = returns.find((ret) => {
      const isSameAgreement = ret.agreement === r.id;
      const returnedIds = ret.returnedEquipmentIds || [];
      const hasThisEq = returnedIds.includes(eq.id) || (r.equipmentId && r.equipmentId.split(", ").includes(eq.id));
      return isSameAgreement && hasThisEq;
    });

    if (matchingReturn) {
      events.push({
        date: matchingReturn.date,
        type: "rent_return",
        section: "rental",
        title: "Returned to Stock",
        description: `Returned by customer "${r.customer}". Condition: ${matchingReturn.condition || "Good"}`,
        meta: `Return ID: ${matchingReturn.id}`
      });
    }
  });

  // 3. Exchanges History
  const eqExchanges = exchanges.filter((exc) => {
    return exc.currentEquipmentId === eq.id || exc.newEquipmentId === eq.id;
  });

  eqExchanges.forEach((exc) => {
    if (exc.status === "Completed") {
      if (exc.currentEquipmentId === eq.id) {
        // Exchanged Out (returned by customer)
        const isToOwner = exc.releaseCondition === "Returned to Owner";
        let destination = "Stock";
        if (isToOwner) {
          destination = `Returned to Owner ("${eq.owner || "Unknown"}")`;
        } else if (exc.releaseCondition === "UnderMaintenance") {
          destination = "Maintenance";
        }
        
        events.push({
          date: exc.exchangeDate,
          type: "exchange_out",
          section: isToOwner ? "owner" : "rental",
          title: isToOwner ? "Returned to Owner (via Exchange)" : "Returned via Exchange",
          description: isToOwner 
            ? `Returned to owner "${eq.owner || "Unknown"}" after being exchanged out from customer "${exc.customer}".`
            : `Exchanged out from customer "${exc.customer}". Action: Released to ${destination}.`,
          meta: `Exchange ID: ${exc.id} (Reason: ${exc.reason || "None"})`
        });
      }

      if (exc.newEquipmentId === eq.id) {
        // Exchanged In (assigned to customer as replacement)
        events.push({
          date: exc.exchangeDate,
          type: "exchange_in",
          section: "rental",
          title: "Delivered via Exchange",
          description: `Assigned to customer "${exc.customer}" as a replacement device`,
          meta: `Exchange ID: ${exc.id}`
        });
      }
    }
  });

  // 4. Manual Owner History Events
  if (eq.ownerHistory && Array.isArray(eq.ownerHistory)) {
    eq.ownerHistory.forEach((hist: any) => {
      const isReturn = hist.action === "returned";
      events.push({
        date: hist.date,
        type: isReturn ? "owner_return" : "owner_receive",
        section: "owner",
        title: isReturn ? "Returned to Owner (Taken)" : "Received from Owner (Stock)",
        description: hist.notes || (isReturn 
          ? `Returned directly to owner "${eq.owner || "Company"}" after being held from ${formatDateDDMMYYYY(hist.startDate)} to ${formatDateDDMMYYYY(hist.date)}.`
          : `Received from owner "${eq.owner || "Company"}" and brought into available inventory.`),
        meta: isReturn 
          ? `Payout: ₹${(hist.totalCost || 0).toLocaleString("en-IN")} (${hist.days || 0} days @ ₹${hist.dailyRate || 0}/day)`
          : `Rate: ₹${(hist.dailyRate || 0).toLocaleString("en-IN")}/day`
      });
    });
  }

  // Sort events (newest first)
  events.sort((a, b) => parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime());

  const rentalEvents = events.filter(e => e.section === "rental");
  const ownerEvents = events.filter(e => e.section === "owner");

  const downloadPDF = () => {
    if (typeof window === "undefined") return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to print/download the PDF statement.");
      return;
    }

    const rentalRowsHtml = rentalEvents.length === 0
      ? `<tr><td colspan="3" style="text-align: center; color: #64748b; font-style: italic; padding: 15px;">No rental activities on record.</td></tr>`
      : rentalEvents.map(ev => `
        <tr>
          <td style="font-weight: 600; font-family: monospace; padding: 12px; border-bottom: 1px solid #e2e8f0;">${formatDateDDMMYYYY(ev.date)}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">
            <div style="font-weight: 700; color: #1e293b; font-size: 13px;">${ev.title}</div>
            <div style="color: #475569; font-size: 11.5px; margin-top: 2px; line-height: 1.4;">${ev.description}</div>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">
            <span style="font-family: monospace; font-size: 11px; color: #0f766e; background: #f0fdfa; padding: 4px 8px; border-radius: 4px; border: 1px solid #ccfbf1; font-weight: 600;">
              ${ev.meta || "—"}
            </span>
          </td>
        </tr>
      `).join("");

    const ownerRowsHtml = ownerEvents.length === 0
      ? `<tr><td colspan="3" style="text-align: center; color: #64748b; font-style: italic; padding: 15px;">No owner transfers on record.</td></tr>`
      : ownerEvents.map(ev => `
        <tr>
          <td style="font-weight: 600; font-family: monospace; padding: 12px; border-bottom: 1px solid #e2e8f0;">${formatDateDDMMYYYY(ev.date)}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">
            <div style="font-weight: 700; color: #b45309; font-size: 13px;">${ev.title}</div>
            <div style="color: #475569; font-size: 11.5px; margin-top: 2px; line-height: 1.4;">${ev.description}</div>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">
            <span style="font-family: monospace; font-size: 11px; color: #7c2d12; background: #fff7ed; padding: 4px 8px; border-radius: 4px; border: 1px solid #ffedd5; font-weight: 600;">
              ${ev.meta || "—"}
            </span>
          </td>
        </tr>
      `).join("");

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Equipment Statement - ${eq.serial}</title>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #1e293b;
      margin: 0;
      padding: 40px;
      line-height: 1.5;
    }
    .header {
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 20px;
      margin-bottom: 25px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .brand {
      font-size: 24px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.5px;
    }
    .brand span {
      color: #2563eb;
    }
    .title {
      font-size: 14px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 700;
    }
    .device-info {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 30px;
    }
    .device-grid {
      display: grid;
      grid-template-cols: repeat(2, 1fr);
      gap: 15px 25px;
    }
    .info-item {
      font-size: 13px;
    }
    .info-label {
      color: #64748b;
      font-size: 10px;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    .info-value {
      font-weight: 700;
      color: #334155;
      margin-top: 2px;
    }
    h3 {
      font-size: 15px;
      font-weight: 800;
      border-bottom: 2px solid #cbd5e1;
      padding-bottom: 6px;
      margin-top: 35px;
      margin-bottom: 15px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .rental-header {
      color: #2563eb;
      border-bottom-color: #bfdbfe;
    }
    .owner-header {
      color: #d97706;
      border-bottom-color: #fde68a;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    th {
      padding: 10px 12px;
      text-align: left;
      border-bottom: 2px solid #cbd5e1;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      background-color: #f1f5f9;
      color: #475569;
    }
    .footer {
      margin-top: 60px;
      text-align: center;
      font-size: 11px;
      color: #94a3b8;
      border-top: 1px dashed #e2e8f0;
      padding-top: 15px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">Medi<span>Rent</span></div>
    <div style="text-align: right">
      <div class="title">Equipment Statement</div>
      <div style="font-size: 11.5px; color: #64748b; margin-top: 3px;">Generated on ${new Date().toLocaleDateString("en-IN")}</div>
    </div>
  </div>

  <div class="device-info">
    <div style="font-size: 15px; font-weight: 800; color: #0f172a; margin-bottom: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Device Specifications</div>
    <div class="device-grid">
      <div class="info-item">
        <div class="info-label">Equipment Name</div>
        <div class="info-value">${eq.name}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Serial Number</div>
        <div class="info-value" style="font-family: monospace;">${eq.serial}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Category / Model</div>
        <div class="info-value">${eq.category} (Model: ${eq.model || "—"})</div>
      </div>
      <div class="info-item">
        <div class="info-label">Current Status / Owner</div>
        <div class="info-value">${eq.status} (Owner: ${eq.owner || "Company"})</div>
      </div>
      <div class="info-item">
        <div class="info-label">Purchase Date</div>
        <div class="info-value">${eq.purchaseDate ? formatDateDDMMYYYY(eq.purchaseDate) : "—"}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Daily Rate to Owner</div>
        <div class="info-value">₹${(Number(eq.ownerDailyRate) || 0).toLocaleString("en-IN")}/day</div>
      </div>
    </div>
  </div>

  <h3 class="rental-header">1. Rental Statement History</h3>
  <table>
    <thead>
      <tr>
        <th style="width: 120px;">Date</th>
        <th>Activity Details</th>
        <th style="width: 180px; text-align: right;">Reference ID</th>
      </tr>
    </thead>
    <tbody>
      ${rentalRowsHtml}
    </tbody>
  </table>

  <h3 class="owner-header">2. Owner Return & Taken Statement</h3>
  <table>
    <thead>
      <tr>
        <th style="width: 120px;">Date</th>
        <th>Activity Details</th>
        <th style="width: 180px; text-align: right;">Reference ID</th>
      </tr>
    </thead>
    <tbody>
      ${ownerRowsHtml}
    </tbody>
  </table>

  <div class="footer">
    This is a computer-generated statement from MediRent ERP.
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

  const downloadExcelFile = () => {
    const excelHeaders = ["Date", "Statement Section", "Event Title", "Description / Details", "Reference ID"];
    const rows = events.map(ev => [
      formatDateDDMMYYYY(ev.date),
      ev.section === "rental" ? "Rental Statement" : "Owner return & taken statement",
      ev.title,
      ev.description,
      ev.meta || ""
    ]);
    downloadExcel(`equipment_statement_${eq.serial}`, excelHeaders, rows, [110, 180, 180, 300, 185]);
    toast.success("Excel statement downloaded successfully.");
  };

  // Helper functions for timeline decorations
  const getEventIcon = (type: string) => {
    switch (type) {
      case "purchase":
        return <Package className="h-3.5 w-3.5 text-amber-600" />;
      case "rent_start":
        return <ArrowUpRight className="h-3.5 w-3.5 text-blue-600" />;
      case "rent_return":
        return <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-600" />;
      case "exchange_out":
        return <RefreshCw className="h-3.5 w-3.5 text-purple-600" />;
      case "exchange_in":
        return <RefreshCw className="h-3.5 w-3.5 text-violet-600" />;
      default:
        return <History className="h-3.5 w-3.5 text-slate-500" />;
    }
  };

  const getEventBg = (type: string) => {
    switch (type) {
      case "purchase":
        return "bg-amber-100 border-amber-200";
      case "rent_start":
        return "bg-blue-100 border-blue-200";
      case "rent_return":
        return "bg-emerald-100 border-emerald-200";
      case "exchange_out":
      case "exchange_in":
        return "bg-purple-100 border-purple-200";
      default:
        return "bg-slate-100 border-slate-200";
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto bg-slate-50/90 backdrop-blur">
        <SheetHeader className="pb-4 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className={`metric-icon h-12 w-12 border ${categoryColors[eq.category] ?? "text-primary bg-primary/10"} border-transparent`}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <SheetTitle className="text-base font-bold text-slate-800">{eq.name}</SheetTitle>
              <p className="text-[11px] font-mono text-muted-foreground">{eq.serial}</p>
              <div className="mt-1 flex items-center gap-2">
                <StatusBadge status={eq.status} />
                <span className="text-[11px] text-slate-500">Owner: <strong>{eq.owner || "Company"}</strong></span>
              </div>
            </div>
          </div>
        </SheetHeader>
        
        {/* Purchase details card at the top */}
        <div className="mt-4 p-3.5 bg-white border border-slate-200/80 rounded-xl shadow-sm">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Purchase & Sourcing Information</h4>
          <div className="grid grid-cols-2 gap-3 text-[13px]">
            <div className="space-y-0.5">
              <span className="text-slate-400 text-[11px]">Purchase Date</span>
              <p className="font-semibold text-slate-700 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                {eq.purchaseDate ? formatDateDDMMYYYY(eq.purchaseDate) : "—"}
              </p>
            </div>
            <div className="space-y-0.5">
              <span className="text-slate-400 text-[11px]">Daily Rate to Owner</span>
              <p className="font-semibold text-slate-700 flex items-center gap-0.5">
                <IndianRupee className="h-3.5 w-3.5 text-slate-400" />
                ₹{(Number(eq.ownerDailyRate) || 0).toLocaleString("en-IN")}/day
              </p>
            </div>
          </div>
        </div>

        {/* Actions bar for PDF & Excel downloads */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" onClick={downloadPDF} className="h-9 text-xs flex items-center justify-center gap-1.5 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm rounded-lg font-medium">
            <Printer className="h-3.5 w-3.5 text-slate-500" />
            Download PDF
          </Button>
          <Button variant="outline" size="sm" onClick={downloadExcelFile} className="h-9 text-xs flex items-center justify-center gap-1.5 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm rounded-lg font-medium">
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
            Download Excel
          </Button>
        </div>

        {/* Section 1: Rental Statement History */}
        <div className="mt-6">
          <h3 className="mb-4 text-[13.5px] font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-200 pb-1">
            <History className="h-4 w-4 text-primary" /> Rental Statement History
          </h3>
          {rentalEvents.length === 0 ? (
            <p className="text-[12px] text-muted-foreground text-center py-6 bg-white border border-dashed rounded-xl">No rental activities on record.</p>
          ) : (
            <div className="relative pl-6 border-l-2 border-slate-200/80 space-y-4 ml-3">
              {rentalEvents.map((ev, index) => (
                <div key={index} className="relative">
                  <span className={`absolute -left-[35px] top-0.5 flex h-6 w-6 items-center justify-center rounded-full border shadow-sm ${getEventBg(ev.type)}`}>
                    {getEventIcon(ev.type)}
                  </span>
                  <div className="bg-white border border-slate-200/60 rounded-xl p-3 shadow-sm space-y-1 hover:border-slate-300 transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[12.5px] font-bold text-slate-800 leading-snug">{ev.title}</span>
                      <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
                        {formatDateDDMMYYYY(ev.date)}
                      </span>
                    </div>
                    <p className="text-[12px] text-slate-600 leading-normal">{ev.description}</p>
                    {ev.meta && (
                      <div className="pt-1 mt-1 border-t border-slate-100 flex items-center justify-between text-[10.5px]">
                        <span className="font-semibold font-mono text-primary/80 bg-primary/5 px-1.5 py-0.5 rounded">{ev.meta}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Owner return & taken statement */}
        <div className="mt-8">
          <h3 className="mb-4 text-[13.5px] font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-200 pb-1">
            <Home className="h-4 w-4 text-amber-600" /> Owner return and taken statement
          </h3>
          {ownerEvents.length === 0 ? (
            <p className="text-[12px] text-muted-foreground text-center py-6 bg-white border border-dashed rounded-xl">No owner transfers on record.</p>
          ) : (
            <div className="relative pl-6 border-l-2 border-slate-200/80 space-y-4 ml-3">
              {ownerEvents.map((ev, index) => (
                <div key={index} className="relative">
                  <span className={`absolute -left-[35px] top-0.5 flex h-6 w-6 items-center justify-center rounded-full border shadow-sm ${getEventBg(ev.type)}`}>
                    {getEventIcon(ev.type)}
                  </span>
                  <div className="bg-white border border-slate-200/60 rounded-xl p-3 shadow-sm space-y-1 hover:border-slate-300 transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[12.5px] font-bold text-slate-800 leading-snug">{ev.title}</span>
                      <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
                        {formatDateDDMMYYYY(ev.date)}
                      </span>
                    </div>
                    <p className="text-[12px] text-slate-600 leading-normal">{ev.description}</p>
                    {ev.meta && (
                      <div className="pt-1 mt-1 border-t border-slate-100 flex items-center justify-between text-[10.5px]">
                        <span className="font-semibold font-mono text-primary/80 bg-primary/5 px-1.5 py-0.5 rounded">{ev.meta}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function EquipmentPage() {
  const dbVersion = useDatabaseTrigger();
  const [equipment, setEquipment] = useState(() => getEquipment());
  const [historyEq, setHistoryEq] = useState<Equipment | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all-cat");
  const [ownerFilter, setOwnerFilter] = useState("all-owners");

  const isStaff = typeof window !== "undefined" && localStorage.getItem("medirent-user-role") === "Staff";

  const refresh = () => setEquipment(getEquipment());

  // Scroll position preservation — prevent page jumping to top after dbVersion re-renders
  const pageScrollRef = useRef(0);
  useEffect(() => {
    const onScroll = () => { pageScrollRef.current = window.scrollY; };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const saved = pageScrollRef.current;
    setEquipment(getEquipment());
    requestAnimationFrame(() => { window.scrollTo({ top: saved, behavior: "instant" as ScrollBehavior }); });
  }, [dbVersion]);

  const activeCategories = Array.from(new Set(equipment.map((e) => e.category).filter(Boolean)));
  const activeOwners = Array.from(new Set(equipment.map((e) => e.owner).filter(Boolean)));

  const rentalsList = useMemo(() => getRentals(), [dbVersion]);
  const customersList = useMemo(() => getCustomers(), [dbVersion]);
  const ownersList = useMemo(() => getOwners(), [dbVersion]);

  const filteredEquipment = equipment.filter((e) => {
    const q = search.toLowerCase().trim();
    const activeRental = rentalsList.find(r => (r.equipmentId === e.id || (r.equipmentItems && r.equipmentItems.some((ei: any) => ei.equipmentId === e.id))) && r.status === "Active");
    const activeCustomer = activeRental ? customersList.find((c: any) => c.id === activeRental.customerId) : null;

    const matchesSearch = !q ||
      String(e.name || "").toLowerCase().includes(q) ||
      String(e.serial || "").toLowerCase().includes(q) ||
      String(e.model || "").toLowerCase().includes(q) ||
      String(e.owner || "").toLowerCase().includes(q) ||
      (activeCustomer && (
        String(activeCustomer.name || "").toLowerCase().includes(q) ||
        String(activeCustomer.phone || "").toLowerCase().includes(q) ||
        String(activeCustomer.altPhone || "").toLowerCase().includes(q) ||
        String(activeCustomer.contactNumber3 || "").toLowerCase().includes(q)
      ));

    const matchesStatus = statusTab === "all" || 
      (statusTab === "available" && e.status === "Available") ||
      (statusTab === "rented" && e.status === "Rented") ||
      (statusTab === "undermaintenance" && e.status === "UnderMaintenance") ||
      (statusTab === "returnedtoowner" && e.status === "Returned to Owner");
    const matchesCategory = categoryFilter === "all-cat" || e.category === categoryFilter;
    const matchesOwner = ownerFilter === "all-owners" || e.owner === ownerFilter;
    return matchesSearch && matchesStatus && matchesCategory && matchesOwner;
  });

  return (
    <AppShell
      title="Equipment Inventory"
      subtitle="Track every device, status, and serial in real time"
      actions={
        <EquipmentFormDialog
          title="Add New Equipment"
          onSave={refresh}
          trigger={
            <Button size="sm">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add Equipment
            </Button>
          }
        />
      }
    >
      <div className="mb-5 flex flex-col gap-3 border-b border-border/60 pb-5">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
            <Input placeholder="Search by name, serial, model…" className="pl-9 h-9 text-[13px]" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[150px] md:w-[180px] h-9 text-[12px] sm:shrink-0"><SelectValue placeholder="All Categories" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all-cat">All Categories</SelectItem>
              {activeCategories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
          <Select value={ownerFilter} onValueChange={setOwnerFilter}>
            <SelectTrigger className="w-[200px] h-8 text-[12px] shrink-0"><SelectValue placeholder="All Owners" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all-owners">All Owners</SelectItem>
              {activeOwners.map((o) => {
                const ownerRecord = ownersList.find(ow => ow.name.toLowerCase() === o.toLowerCase());
                const displayLabel = ownerRecord?.ownerName ? `${o} (${ownerRecord.ownerName})` : o;
                return <SelectItem key={o} value={o}>{displayLabel}</SelectItem>;
              })}
            </SelectContent>
          </Select>
          <div className="flex gap-1 shrink-0">
            {["all", "available", "rented", "undermaintenance", "returnedtoowner"].map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusTab(tab)}
                className={`mobile-chip shrink-0 ${statusTab === tab ? "active" : ""}`}
              >
                {tab === "all" ? "All" :
                 tab === "available" ? "Available" :
                 tab === "rented" ? "Rented" :
                 tab === "undermaintenance" ? "Maintenance" : "To Owner"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile FAB — Add Equipment */}
      <EquipmentFormDialog
        title="Add New Equipment"
        onSave={refresh}
        trigger={
          <button className="fab md:hidden">
            <Plus className="h-5 w-5" />
            Add Equipment
          </button>
        }
      />

      {(() => {
        const allOwnerNames = Array.from(new Set(filteredEquipment.map(e => e.owner || "Unassigned").filter(Boolean)));
        const sortedOwners = allOwnerNames.sort((a, b) => a === "Unassigned" ? 1 : b === "Unassigned" ? -1 : a.localeCompare(b));

        if (filteredEquipment.length === 0) {
          return (
            <div className="py-16 text-center">
              <p className="text-[14px] font-semibold text-foreground">No equipment found</p>
              <p className="text-[12px] text-muted-foreground mt-1">Try adjusting your search or filters.</p>
            </div>
          );
        }

        return sortedOwners.map(ownerName => {
          const ownerItems = filteredEquipment.filter(e => (e.owner || "Unassigned") === ownerName);
          if (ownerItems.length === 0) return null;
          return (
            <div key={ownerName} className="mb-8">
              <div className="flex items-center gap-3 mb-4 pb-2 border-b border-border/60">
                <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-[13px] font-bold">
                  {ownerName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-[14px] font-bold text-foreground">{ownerName}</h3>
                  <p className="text-[11px] text-muted-foreground">{ownerItems.length} item{ownerItems.length !== 1 ? "s" : ""}</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {ownerItems.map((item) => {
                  const Icon = categoryIcons[item.category] ?? Stethoscope;
                  return (
                    <Card
                      key={item.id}
                      className="group overflow-hidden hover:-translate-y-1 hover:shadow-[var(--shadow-elevated)] transition-all duration-200"
                    >
                      <div className="relative flex h-40 items-center justify-center bg-white border-b border-border/50 overflow-hidden p-3">
                        {categoryImages[item.category] ? (
                          <img
                            src={categoryImages[item.category]}
                            alt={item.name}
                            className="h-full w-full object-contain transition-transform duration-305 group-hover:scale-105"
                            style={{ filter: "brightness(1.08) contrast(1.06)" }}
                          />
                        ) : (
                          <div className={`metric-icon h-14 w-14 border ${categoryColors[item.category] ?? "bg-muted text-muted-foreground"}`}>
                            <Icon className="h-7 w-7" />
                          </div>
                        )}
                        {categoryImages[item.category] && (
                          <div className={`absolute left-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg border border-border/60 bg-background/80 backdrop-blur-sm ${categoryColors[item.category] ?? "text-muted-foreground"}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                        )}
                        <div className="absolute right-3 top-3"><StatusBadge status={item.status} /></div>
                      </div>

                      <CardContent className="p-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.10em] text-primary/80">{item.category}</p>
                        <h3 className="mt-1 font-display text-[15px] font-semibold leading-snug">{item.name}</h3>
                        <p className="text-[12px] text-muted-foreground mt-0.5">{item.manufacturer} · {item.model}</p>

                        <div className="mt-4 space-y-1.5 text-[11px]">
                          <div className="flex justify-between border-b border-border/40 pb-1.5">
                            <span className="text-muted-foreground">Serial Number</span>
                            <span className="font-mono font-medium text-foreground">{item.serial}</span>
                          </div>
                          {(item as any).agreementNumber && (
                            <div className="flex justify-between border-b border-border/40 pb-1.5">
                              <span className="text-muted-foreground">Agreement No.</span>
                              <span className="font-mono font-medium text-foreground">{(item as any).agreementNumber}</span>
                            </div>
                          )}
                          {(item as any).agreementDate && (
                            <div className="flex justify-between border-b border-border/40 pb-1.5">
                              <span className="text-muted-foreground">Agreement Date</span>
                              <span className="font-medium text-foreground">{formatDateDDMMYYYY((item as any).agreementDate)}</span>
                            </div>
                          )}
                          <div className="flex justify-between border-b border-border/40 pb-1.5">
                            <span className="text-muted-foreground">Purchased</span>
                            <span className="font-medium text-foreground">{formatDateDDMMYYYY(item.purchaseDate) || "—"}</span>
                          </div>
                          <div className="flex justify-between pb-1.5">
                            <span className="text-muted-foreground">Daily Rate to Owner</span>
                            <span className="font-medium text-foreground">₹{(item.ownerDailyRate || 0).toLocaleString("en-IN")}/day</span>
                          </div>
                        </div>

                        <div className="mt-4 flex gap-1.5 items-center flex-wrap">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="flex-1 h-8 text-[12px]"
                            onClick={() => { setHistoryEq(item); setHistoryOpen(true); }}
                          >
                            <History className="mr-1.5 h-3.5 w-3.5" />History
                          </Button>
                          {item.status === "UnderMaintenance" && (
                            <Button
                              variant="default"
                              size="sm"
                              className="flex-1 h-8 text-[11.5px] bg-success hover:bg-success/95 text-white font-semibold cursor-pointer"
                              onClick={() => {
                                saveEquipment({ ...item, status: "Available" });
                                toast.success(`"${item.name}" marked as Available.`);
                                refresh();
                              }}
                            >
                              Mark Available
                            </Button>
                          )}
                          {!isOwnOwner(item.owner) && item.status === "Returned to Owner" && (
                            <OwnerActionDialog
                              eq={item}
                              actionType="receive"
                              onSave={refresh}
                              trigger={
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="flex-1 h-8 text-[11.5px] bg-success hover:bg-success/95 text-white font-semibold cursor-pointer"
                                >
                                  Receive from Owner
                                </Button>
                              }
                            />
                          )}
                          {!isOwnOwner(item.owner) && (item.status === "Available" || item.status === "UnderMaintenance") && (
                            <OwnerActionDialog
                              eq={item}
                              actionType="return"
                              onSave={refresh}
                              trigger={
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 h-8 text-[11.5px] border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800 cursor-pointer"
                                >
                                  Return to Owner
                                </Button>
                              }
                            />
                          )}
                          <QrCodeDialog eq={item} />
                          {!isStaff && (
                            <>
                              <EquipmentFormDialog
                                title="Edit Equipment"
                                eq={item}
                                onSave={refresh}
                                trigger={
                                  <Button variant="outline" size="icon" className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10" title="Edit">
                                    <Edit className="h-3.5 w-3.5" />
                                  </Button>
                                }
                              />
                              <DeleteEquipmentDialog
                                eq={item}
                                onDelete={refresh}
                                trigger={
                                  <Button variant="outline" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10" title="Delete">
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                }
                              />
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        });
      })()}

      <EquipmentHistorySheet
        eq={historyEq}
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
      />
    </AppShell>
  );
}
