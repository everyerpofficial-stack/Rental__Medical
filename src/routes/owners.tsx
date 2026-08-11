import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppShell, StatusBadge } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Plus, Search, Edit, Trash2, Phone, Mail, Handshake, ShieldCheck,
  Package, Percent, MapPin, Calendar, FileText, Check, ExternalLink, Activity,
  Printer, Download
} from "lucide-react";
import {
  getOwners,
  saveOwner,
  deleteOwner,
  getEquipment,
  getRentals,
  getReturns,
  getPayments,
  OwnerItem,
  useDatabaseTrigger,
  downloadExcel,
  getNextOwnerNumber,
  formatDateDDMMYYYY,
  getLocalYYYYMMDD,
  parseLocalDate,
} from "@/lib/data-store";

export const Route = createFileRoute("/owners")({
  head: () => ({ meta: [{ title: "Equipment Owners — Relife" }] }),
  component: OwnersPage,
});


function OwnerFormDialog({
  title,
  owner,
  trigger,
  onSave,
}: {
  title: string;
  owner?: OwnerItem;
  trigger: React.ReactNode;
  onSave?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(owner?.name || "");
  const [ownerName, setOwnerName] = useState(owner?.ownerName || "");
  const [inventorySeries, setInventorySeries] = useState(owner?.inventorySeries || "");
  const [phone, setPhone] = useState(owner?.phone || "");
  const [email, setEmail] = useState(owner?.email || "");
  const [address, setAddress] = useState(owner?.address || "");
  const [commissionRate, setCommissionRate] = useState(owner?.commissionRate?.toString() || "100");
  // Status is auto-computed based on equipment availability — not manually settable

  // Keep state sync'd when dialog opens or owner prop changes
  useEffect(() => {
    if (open && owner) {
      setName(owner.name);
      setOwnerName(owner.ownerName || "");
      setInventorySeries(owner.inventorySeries);
      setPhone(owner.phone);
      setEmail(owner.email);
      setAddress(owner.address || "");
      setCommissionRate(owner.commissionRate.toString());
    }
  }, [open, owner]);

  const handleSave = () => {
    if (!name) {
      toast.error("Organization Name is required.");
      return;
    }
    if (!ownerName) {
      toast.error("Owner Name is required.");
      return;
    }

    if (phone.trim()) {
      const isValidPhone = (p: string) => {
        const digits = p.replace(/\D/g, "");
        return digits.length === 10;
      };

      if (!isValidPhone(phone)) {
        toast.error("Contact Phone Number must be exactly 10 digits.");
        return;
      }
    }

    const id = owner?.id || getNextOwnerNumber();
    // Default new owners to Active
    const currentStatus = owner?.status || "Active";
    saveOwner({
      id,
      name,
      ownerName,
      inventorySeries: inventorySeries || "",
      phone,
      email,
      address,
      commissionRate: parseFloat(commissionRate) || 100,
      status: currentStatus,
    });

    toast.success(
      owner ? `Owner "${name}" details updated successfully.` : "New equipment owner registered successfully."
    );
    if (onSave) onSave();
    // Only close after successful save
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Handshake className="h-5 w-5 text-primary" /> {title}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2 sm:grid-cols-2">
          <Field
            label="Organization Name *"
            placeholder="e.g. Zenith Medtech Solutions"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Field
            label="Owner Name *"
            placeholder="e.g. Dr. Amit Vyas"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
          />

          <Field
            label="Contact Phone"
            placeholder="10-digit phone number"
            value={phone}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, "");
              if (digits.length > 10) {
                if (digits.startsWith("91")) setPhone(digits.slice(-10));
                else if (digits.startsWith("0")) setPhone(digits.slice(-10));
                else setPhone(digits.slice(0, 10));
              } else {
                setPhone(digits);
              }
            }}
            maxLength={14}
          />
          <Field
            label="Contact Email"
            placeholder="e.g. partner@zenith.com"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="sm:col-span-2"
          />
          <div className="sm:col-span-2 space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Office / Billing Address</Label>
            <Textarea
              placeholder="Full business address..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="min-h-[70px] resize-none text-[13px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button>
          <Button type="button" onClick={handleSave}>Save Owner</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteOwnerDialog({
  owner,
  trigger,
  onDelete,
}: {
  owner: OwnerItem;
  trigger: React.ReactNode;
  onDelete?: () => void;
}) {
  const handleDelete = () => {
    deleteOwner(owner.id);
    toast.success(`Owner "${owner.name}" has been deleted.`);
    if (onDelete) onDelete();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-destructive flex items-center gap-2">
            <Trash2 className="h-4 w-4" /> Delete Owner Partner
          </DialogTitle>
        </DialogHeader>
        <div className="py-2 space-y-3">
          <p className="text-[13px] text-muted-foreground">
            Are you sure you want to delete <strong className="text-foreground">{owner.name}</strong>?
          </p>
          <p className="text-[12px] text-amber-600 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 p-2.5 rounded-lg leading-relaxed font-medium">
            Warning: This does not delete any associated equipment, but the equipment items will no longer be linked to an active partner record.
          </p>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" type="button">Cancel</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button variant="destructive" type="button" onClick={handleDelete}>Delete</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function OwnerDetailsSheet({
  owner,
  open,
  onClose,
}: {
  owner: OwnerItem | null;
  open: boolean;
  onClose: () => void;
}) {
  const [stmtFromDate, setStmtFromDate] = useState("");
  const [stmtToDate, setStmtToDate] = useState("");
  const [stmtPerDayRate, setStmtPerDayRate] = useState("100");
  const [stmtCategory, setStmtCategory] = useState("all");

  if (!owner) return null;

  const equipment = getEquipment();
  const rentals = getRentals();
  const allReturns = getReturns();

  // Find equipment owned by this partner
  const ownedEquipment = equipment.filter(
    (e) => e.owner?.toLowerCase() === owner.name.toLowerCase()
  );

  // Build Monthly Rental Statement data per equipment item
  const buildStatement = () => {
    const perDayRate = parseFloat(stmtPerDayRate) || 0;
    const rows: any[] = [];

    ownedEquipment.forEach((eq) => {
      if (stmtCategory !== "all" && eq.category !== stmtCategory) return;

      // Find all rentals for this equipment
      const eqRentals = rentals.filter((r: any) => {
        if (r.equipmentItems && r.equipmentItems.length > 0) {
          return r.equipmentItems.some((ei: any) => ei.equipmentId === eq.id);
        }
        const ids = (r.equipmentId || "").split(",").map((s: string) => s.trim());
        return ids.includes(eq.id);
      });

      if (eqRentals.length === 0) return;

      // Sort by start date
      const sorted = [...eqRentals].sort((a: any, b: any) => {
        return parseLocalDate(a.start || "").getTime() - parseLocalDate(b.start || "").getTime();
      });

      // Build per-rental-period breakdown (cumulative days: "10 + 5")
      let periodParts: string[] = [];
      let totalDays = 0;
      let totalAmount = 0;

      sorted.forEach((r: any) => {
        const start = parseLocalDate(r.start);
        if (isNaN(start.getTime())) return;

        // Filter by date range if set
        if (stmtFromDate && start < parseLocalDate(stmtFromDate)) return;
        if (stmtToDate && start > parseLocalDate(stmtToDate)) return;

        // Find return date
        const retRecord = allReturns.find((ret: any) =>
          ret.agreement === r.id &&
          (ret.returnedEquipmentIds || []).includes(eq.id)
        );
        const endDateStr = retRecord?.date || retRecord?.returnDate || null;
        const endDate = endDateStr ? parseLocalDate(endDateStr) : new Date();
        const isReturned = !!retRecord || r.status === "Completed";

        const diffMs = endDate.getTime() - start.getTime();
        const days = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
        const amount = days * perDayRate;

        periodParts.push(days.toString());
        totalDays += days;
        totalAmount += amount;

        rows.push({
          eqSerial: eq.serial,
          eqCategory: eq.category,
          customerName: r.customer || "Unknown",
          agreementId: r.id,
          dateTaken: r.start,
          periodFrom: r.start,
          periodTo: endDateStr || null,
          returnDate: isReturned ? (endDateStr || r.end || "—") : "Not Returned",
          daysLabel: periodParts.join(" + "),
          totalDaysUpToNow: totalDays,
          perDayRate,
          totalAmount,
          isLatest: true, // overwritten below
        });
      });

      // Only show the last row per equipment (summary of all periods)
      // Or show each individually — show each with running total
    });

    return rows;
  };

  const stmtRows = buildStatement();
  const uniqueCategories = Array.from(new Set(ownedEquipment.map(e => e.category).filter(Boolean)));

  const handleDownloadStatement = () => {
    if (!owner) return;
    
    const allEquipment = getEquipment();
    const allRentals = getRentals();
    const allReturns = getReturns();
    const allPayments = getPayments();

    const ownedEquip = allEquipment.filter(
      (e) => e.owner?.toLowerCase() === owner.name.toLowerCase()
    );
    const ownedIds = new Set(ownedEquip.map((e) => e.id));
    const ownedMap = new Map(ownedEquip.map((e) => [e.id, e]));

    // Build chronological transaction log
    const txLog: any[] = [];
    allRentals.forEach((r: any) => {
      let itemsList = r.equipmentItems || [];
      if (itemsList.length === 0 && r.equipmentId) {
        const ids = r.equipmentId.split(",").map((s: string) => s.trim()).filter(Boolean);
        const serials = (r.serial || "").split(",").map((s: string) => s.trim()).filter(Boolean);
        itemsList = ids.map((id: string, idx: number) => ({
          equipmentId: id,
          serial: serials[idx] || "XXXX",
          returned: r.status === "Completed"
        }));
      }

      itemsList.forEach((item: any) => {
        if (ownedIds.has(item.equipmentId)) {
          txLog.push({
            rental: r,
            equipmentId: item.equipmentId,
            serial: item.serial,
            returned: item.returned
          });
        }
      });
    });

    // Sort chronologically by start date
    txLog.sort((a, b) => {
      const dateA = parseLocalDate(a.rental.startDate || a.rental.start || "").getTime();
      const dateB = parseLocalDate(b.rental.startDate || b.rental.start || "").getTime();
      return dateA - dateB;
    });

    // Clean date function
    const cleanDate = (dateStr: string) => {
      if (!dateStr || dateStr === "—" || dateStr === "-") return "";
      return dateStr.split("T")[0];
    };

    // Generate CSV content
    const headers = [
      "M/c Sl.No",
      "Agr. No",
      "Agr. Date",
      "Return Date",
      "Model",
      "Customer Name",
      "Given Again To",
      "Refund",
      "Pay",
      "Status",
      "Remarks"
    ];

    const rows = txLog.map((tx) => {
      const eq = ownedMap.get(tx.equipmentId);
      
      // Calculate Return Date
      const retRecord = allReturns.find(
        (ret: any) =>
          ret.agreement === tx.rental.id &&
          (ret.returnedEquipmentIds || []).includes(tx.equipmentId)
      );
      const returnDateRaw = retRecord?.date || retRecord?.returnDate || (tx.returned ? tx.rental.endDate || tx.rental.end || "" : "");
      const returnDate = cleanDate(returnDateRaw);

      // Calculate Given Again To (next customer who rented the same equipmentId)
      const sameEqTx = txLog.filter((t) => t.equipmentId === tx.equipmentId);
      const curIdx = sameEqTx.findIndex((t) => t.rental.id === tx.rental.id);
      let givenAgainTo = "";
      if (curIdx !== -1 && curIdx + 1 < sameEqTx.length) {
        const nextTx = sameEqTx[curIdx + 1];
        givenAgainTo = `${nextTx.rental.customer || nextTx.rental.customerName || ""} (${nextTx.rental.id})`;
      }

      // Calculate Refund
      const refund = retRecord?.refundAmount || retRecord?.refund || "";

      // Calculate Pay (total rent paid/received for this rental)
      const rentalPayments = allPayments.filter(
        (p: any) => p.agreement === tx.rental.id && p.status === "Paid"
      );
      const totalPaid = rentalPayments.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
      const payVal = totalPaid > 0 ? totalPaid.toString() : "";

      const statusVal = tx.returned ? "IN" : "OUT";
      const remarks = retRecord?.remarks || tx.rental.remarks || "";

      return [
        eq?.serial || tx.serial || "",
        tx.rental.id,
        cleanDate(tx.rental.startDate || tx.rental.start || ""),
        returnDate,
        eq?.category || eq?.name || "",
        tx.rental.customer || tx.rental.customerName || "",
        givenAgainTo,
        refund ? `Rs. ${Number(refund).toLocaleString("en-IN")}` : "",
        payVal ? `Rs. ${Number(payVal).toLocaleString("en-IN")}` : "",
        statusVal,
        remarks
      ];
    });

    const exportFilename = `${owner.name.replace(/\s+/g, "_")}_statement.xls`;
    downloadExcel(exportFilename, headers, rows, [110, 150, 110, 110, 180, 180, 220, 100, 100, 80, 200]);
    toast.success("Statement downloaded successfully!");
  };

  const handlePrintStatement = () => {
    if (!owner) return;

    const allEquipment = getEquipment();
    const allRentals = getRentals();
    const allReturns = getReturns();
    const allPayments = getPayments();

    const ownedEquip = allEquipment.filter(
      (e) => e.owner?.toLowerCase() === owner.name.toLowerCase()
    );
    const ownedIds = new Set(ownedEquip.map((e) => e.id));
    const ownedMap = new Map(ownedEquip.map((e) => [e.id, e]));

    const txLog: any[] = [];
    allRentals.forEach((r: any) => {
      let itemsList = r.equipmentItems || [];
      if (itemsList.length === 0 && r.equipmentId) {
        const ids = r.equipmentId.split(",").map((s: string) => s.trim()).filter(Boolean);
        const serials = (r.serial || "").split(",").map((s: string) => s.trim()).filter(Boolean);
        itemsList = ids.map((id: string, idx: number) => ({
          equipmentId: id,
          serial: serials[idx] || "XXXX",
          returned: r.status === "Completed"
        }));
      }

      itemsList.forEach((item: any) => {
        if (ownedIds.has(item.equipmentId)) {
          txLog.push({
            rental: r,
            equipmentId: item.equipmentId,
            serial: item.serial,
            returned: item.returned
          });
        }
      });
    });

    txLog.sort((a, b) => {
      const dateA = parseLocalDate(a.rental.startDate || a.rental.start || "").getTime();
      const dateB = parseLocalDate(b.rental.startDate || b.rental.start || "").getTime();
      return dateA - dateB;
    });

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Popup blocked! Please allow popups to print statements.");
      return;
    }

    const rowsHtml = txLog.map((tx) => {
      const eq = ownedMap.get(tx.equipmentId);
      const retRecord = allReturns.find(
        (ret: any) =>
          ret.agreement === tx.rental.id &&
          (ret.returnedEquipmentIds || []).includes(tx.equipmentId)
      );
      const returnDate = retRecord?.date || retRecord?.returnDate || (tx.returned ? tx.rental.endDate || tx.rental.end || "—" : "—");

      const sameEqTx = txLog.filter((t) => t.equipmentId === tx.equipmentId);
      const curIdx = sameEqTx.findIndex((t) => t.rental.id === tx.rental.id);
      let givenAgainTo = "";
      if (curIdx !== -1 && curIdx + 1 < sameEqTx.length) {
        const nextTx = sameEqTx[curIdx + 1];
        givenAgainTo = `${nextTx.rental.customer || nextTx.rental.customerName || ""} & ${nextTx.rental.id}`;
      }

      const refund = retRecord?.refundAmount || retRecord?.refund || "";
      
      const rentalPayments = allPayments.filter(
        (p: any) => p.agreement === tx.rental.id && p.status === "Paid"
      );
      const totalPaid = rentalPayments.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
      const payVal = totalPaid > 0 ? `₹${totalPaid.toLocaleString("en-IN")}` : "—";
      
      const statusVal = tx.returned ? "IN" : "OUT";
      const remarks = retRecord?.remarks || tx.rental.remarks || "—";

      return `
        <tr>
          <td>${eq?.serial || tx.serial || "—"}</td>
          <td>${tx.rental.id}</td>
          <td>${tx.rental.startDate || tx.rental.start || "—"}</td>
          <td>${returnDate}</td>
          <td>${eq?.category || eq?.name || "—"}</td>
          <td>${tx.rental.customer || tx.rental.customerName || "—"}</td>
          <td>${givenAgainTo || "—"}</td>
          <td>${refund ? `₹${Number(refund).toLocaleString("en-IN")}` : "—"}</td>
          <td>${payVal}</td>
          <td class="status-${statusVal.toLowerCase()}">${statusVal}</td>
          <td>${remarks}</td>
        </tr>
      `;
    }).join("");

    const htmlContent = `
<html>
<head>
  <title>Owner Statement - ${owner.name}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; padding: 30px; color: #1e293b; }
    .header { margin-bottom: 30px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; }
    .header h1 { margin: 0; font-size: 24px; color: #0f172a; }
    .header p { margin: 5px 0 0 0; font-size: 14px; color: #64748b; }
    .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 30px; font-size: 13px; }
    .info-item span { font-weight: 600; color: #475569; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
    th { background-color: #f1f5f9; font-weight: bold; color: #334155; text-transform: uppercase; font-size: 9px; letter-spacing: 0.5px; }
    tr:nth-child(even) { background-color: #f8fafc; }
    .status-in { color: #16a34a; font-weight: bold; }
    .status-out { color: #d97706; font-weight: bold; }
    .footer { margin-top: 50px; font-size: 11px; text-align: center; color: #94a3b8; }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Owner Transaction Statement</h1>
    <p>Partner: ${owner.name}</p>
  </div>
  <div class="info-grid">
    <div class="info-item"><span>Owner Contact Name:</span> ${owner.ownerName || "—"}</div>
    <div class="info-item"><span>Phone:</span> ${owner.phone}</div>
    <div class="info-item"><span>Email:</span> ${owner.email}</div>
    <div class="info-item"><span>Commission Rate:</span> ${owner.commissionRate}%</div>
  </div>
  <table>
    <thead>
      <tr>
        <th>M/c Sl.No</th>
        <th>Agr.</th>
        <th>Agr. Date</th>
        <th>Return Date</th>
        <th>Model</th>
        <th>Customer Name</th>
        <th>Given Again To</th>
        <th>Refund</th>
        <th>Pay</th>
        <th>Status</th>
        <th>Remarks</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml || '<tr><td colspan="11" style="text-align:center;padding:20px;">No rental transactions found for this owner\'s equipment.</td></tr>'}
    </tbody>
  </table>
  <div class="footer">
    Generated on ${new Date().toLocaleDateString("en-IN")} · Relife ERP System
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
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="pb-4 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="metric-icon h-12 w-12 border bg-primary/10 text-primary border-transparent">
              <Handshake className="h-6 w-6" />
            </div>
            <div>
              <SheetTitle className="text-lg font-bold">{owner.name}</SheetTitle>
              {owner.ownerName && (
                <p className="text-[13px] font-medium text-foreground mt-0.5">
                  Owner: <span className="font-semibold text-primary">{owner.ownerName}</span>
                </p>
              )}
              <p className="text-[11px] font-mono text-muted-foreground mt-0.5">{owner.id}</p>
              <div className="mt-1.5">
                <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold border ${
                  owner.status === "Active"
                    ? "bg-success/10 text-success border-success/20"
                    : "bg-muted text-muted-foreground border-border/50"
                }`}>
                  {owner.status}
                </span>
              </div>
            </div>
          </div>
        </SheetHeader>

        <Tabs defaultValue="details" className="mt-5">
          <TabsList className="w-full">
            <TabsTrigger value="details" className="flex-1">Details &amp; Inventory</TabsTrigger>
            <TabsTrigger value="statement" className="flex-1">Monthly Rental Statement</TabsTrigger>
          </TabsList>

          {/* === Details Tab === */}
          <TabsContent value="details">
            {/* Action buttons for Statement */}
            <div className="flex gap-2.5">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-9 text-[12px] font-semibold border-primary/20 text-primary hover:bg-primary/5 flex items-center justify-center gap-1.5"
                onClick={handlePrintStatement}
              >
                <Printer className="h-4 w-4" /> Print Statement
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-9 text-[12px] font-semibold border-success/20 text-success hover:bg-success/5 flex items-center justify-center gap-1.5"
                onClick={handleDownloadStatement}
              >
                <Download className="h-4 w-4" /> Download Statement
              </Button>
            </div>


          {/* Contact Details */}
          <div className="mt-4 space-y-6">
          <div className="space-y-2.5">
            <h3 className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">Contact Information</h3>
            <div className="space-y-1.5 text-[13px]">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-3.5 w-3.5" />
                <span className="text-foreground">{owner.phone || "No phone added"}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />
                <span className="text-foreground">{owner.email || "No email added"}</span>
              </div>
              {owner.address && (
                <div className="flex items-start gap-2 text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 mt-0.5" />
                  <span className="text-foreground">{owner.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Owned Inventory items list */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-border/60 pb-2">
              <h3 className="text-[14px] font-bold">Owned Inventory ({ownedEquipment.length})</h3>
            </div>
            {ownedEquipment.length === 0 ? (
              <p className="text-[12px] text-muted-foreground text-center py-8 bg-muted/10 rounded-xl border border-dashed border-border/60">
                No inventory assigned to this owner yet. Add equipment in the inventory page and choose this owner to map.
              </p>
            ) : (
              <div className="space-y-2.5">
                {ownedEquipment.map((eq) => {
                  const activeRental = rentals.find((r) => r.equipmentId === eq.id && r.status !== "Completed");
                  return (
                    <div
                      key={eq.id}
                      className="rounded-xl border border-border/60 p-3 bg-card hover:bg-muted/10 transition-colors flex flex-col gap-1.5"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-[13px] font-bold text-foreground leading-snug">{eq.name}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {eq.category} · SN: <span className="font-mono font-semibold">{eq.serial}</span>
                          </p>
                        </div>
                        <StatusBadge status={eq.status} />
                      </div>
                      {activeRental && (
                        <div className="mt-1 pt-1.5 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground bg-primary/5 p-1.5 rounded">
                          <span className="flex items-center gap-1.5 text-primary font-medium">
                            <FileText className="h-3 w-3" /> Active Rental
                          </span>
                          <span className="font-medium text-foreground">
                            {activeRental.customer} ({activeRental.id})
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          </div>
          </TabsContent>

          {/* === Monthly Rental Statement Tab === */}
          <TabsContent value="statement" className="pt-4 space-y-4">
            {/* Filters */}
            <div className="rounded-xl border border-border/60 bg-muted/10 p-4 space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Statement Filters</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Category</Label>
                  <select
                    value={stmtCategory}
                    onChange={(e) => setStmtCategory(e.target.value)}
                    className="w-full h-9 rounded-md border border-border/60 bg-background px-3 text-[13px] focus:outline-none focus:ring-1 focus:ring-primary/40"
                  >
                    <option value="all">All Categories</option>
                    {uniqueCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Per Day Rate (₹)</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 100"
                    value={stmtPerDayRate}
                    onChange={(e) => setStmtPerDayRate(e.target.value)}
                    className="h-9 text-[13px]"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">From Date</Label>
                  <Input type="date" value={stmtFromDate} onChange={(e) => setStmtFromDate(e.target.value)} className="h-9 text-[13px]" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">To Date</Label>
                  <Input type="date" value={stmtToDate} onChange={(e) => setStmtToDate(e.target.value)} className="h-9 text-[13px]" />
                </div>
              </div>
            </div>

            {/* Statement Table */}
            {stmtRows.length === 0 ? (
              <p className="text-[12px] text-muted-foreground text-center py-10 border border-dashed border-border/60 rounded-xl bg-muted/10">
                No rental activity found for this owner's equipment with the selected filters.
              </p>
            ) : (
              <div className="rounded-xl border border-border/60 overflow-hidden">
                <div className="px-4 py-2.5 bg-muted/20 border-b border-border/50">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    {owner.name} — Monthly Rental Statement
                    {stmtFromDate && stmtToDate ? ` (${stmtFromDate} to ${stmtToDate})` : ""}
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[11.5px]">
                    <thead className="bg-muted/30 border-b border-border/50">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Sr.</th>
                        <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Owner</th>
                        <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Category</th>
                        <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Machine / S.No</th>
                        <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Customer</th>
                        <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Date Taken</th>
                        <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Return Date</th>
                        <th className="px-3 py-2 text-right font-semibold text-muted-foreground">Days Used</th>
                        <th className="px-3 py-2 text-right font-semibold text-muted-foreground">Per Day (₹)</th>
                        <th className="px-3 py-2 text-right font-semibold text-muted-foreground">Total (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {stmtRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-muted/10">
                          <td className="px-3 py-2 font-mono text-muted-foreground">{idx + 1}</td>
                          <td className="px-3 py-2 font-semibold">{owner.name}</td>
                          <td className="px-3 py-2 text-muted-foreground">{row.eqCategory}</td>
                          <td className="px-3 py-2 font-mono text-[11px]">{row.eqSerial}</td>
                          <td className="px-3 py-2">{row.customerName}</td>
                          <td className="px-3 py-2 text-muted-foreground">{row.dateTaken ? formatDateDDMMYYYY(row.dateTaken) : "—"}</td>
                          <td className="px-3 py-2">
                            <span className={row.returnDate === "Not Returned" ? "text-warning-foreground font-semibold" : "text-muted-foreground"}>
                              {row.returnDate === "Not Returned" ? "Not Returned" : formatDateDDMMYYYY(row.returnDate)}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right font-bold text-foreground">{row.daysLabel}</td>
                          <td className="px-3 py-2 text-right text-muted-foreground">{row.perDayRate}</td>
                          <td className="px-3 py-2 text-right font-bold text-primary">₹{row.totalAmount.toLocaleString("en-IN")}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-muted/20 border-t border-border/50 font-bold">
                      <tr>
                        <td colSpan={7} className="px-3 py-2.5 text-right text-[12px]">Grand Total</td>
                        <td className="px-3 py-2.5 text-right text-[12px]">
                          {stmtRows[stmtRows.length - 1]?.totalDaysUpToNow || 0} days
                        </td>
                        <td className="px-3 py-2.5" />
                        <td className="px-3 py-2.5 text-right text-[13px] text-primary">
                          ₹{stmtRows.reduce((s, r) => s + r.totalAmount, 0).toLocaleString("en-IN")}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>

        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

function OwnersPage() {
  const dbVersion = useDatabaseTrigger();
  const [owners, setOwners] = useState<OwnerItem[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState("all");
  const [selectedOwner, setSelectedOwner] = useState<OwnerItem | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const isStaff = typeof window !== "undefined" && localStorage.getItem("medirent-user-role") === "Staff";

  const refreshData = () => {
    setOwners(getOwners());
    setEquipment(getEquipment());
  };

  useEffect(() => {
    refreshData();
  }, [dbVersion]);

  const filteredOwners = owners.filter((o) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      o.name.toLowerCase().includes(q) ||
      (o.ownerName || "").toLowerCase().includes(q) ||
      o.phone.toLowerCase().includes(q);

    const matchesStatus =
      statusTab === "all" || o.status.toLowerCase() === statusTab.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  // Calculate KPIs
  const totalOwners = owners.length;
  const activeOwnersCount = owners.filter((o) => o.status === "Active").length;

  // Calculate items owned by partners (non-MediRent)
  const partnerOwnedCount = equipment.filter(
    (e) => e.owner && e.owner.toLowerCase() !== "medirent" && e.owner.toLowerCase() !== "medirent healthcare"
  ).length;

  // Calculate items currently rented out of partner-owned equipment
  const partnerRentedCount = equipment.filter(
    (e) => e.owner && e.owner.toLowerCase() !== "medirent" && e.owner.toLowerCase() !== "medirent healthcare" && (e.status === "Rented" || e.status === "Active")
  ).length;

  return (
    <AppShell
      title="Equipment Owners"
      subtitle="Manage partner contracts, commissions, and owned inventories"
      actions={
        <OwnerFormDialog
          title="Add New Owner"
          onSave={refreshData}
          trigger={
            <Button size="sm">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add Owner
            </Button>
          }
        />
      }
    >
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 mb-6">
        <Card className="relative overflow-hidden hover:shadow-[var(--shadow-elevated)] hover:-translate-y-0.5 transition-all">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground/65">
                  Total Owners
                </p>
                <p className="mt-2 font-display text-[26px] font-bold tracking-tight">
                  {totalOwners}
                </p>
              </div>
              <div className="metric-icon h-10 w-10 shrink-0">
                <Handshake className="h-4.5 w-4.5 text-muted-foreground" />
              </div>
            </div>
            <div className="mt-3 text-[12px] text-muted-foreground/70">
              {activeOwnersCount} Active / {totalOwners - activeOwnersCount} Inactive agreements
            </div>
          </CardContent>
          <div className="absolute inset-x-0 bottom-0 h-[2px] bg-primary/50" />
        </Card>

        <Card className="relative overflow-hidden hover:shadow-[var(--shadow-elevated)] hover:-translate-y-0.5 transition-all">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground/65">
                  Active Owners
                </p>
                <p className="mt-2 font-display text-[26px] font-bold tracking-tight text-success">
                  {activeOwnersCount}
                </p>
              </div>
              <div className="metric-icon h-10 w-10 shrink-0">
                <ShieldCheck className="h-4.5 w-4.5 text-success" />
              </div>
            </div>
            <div className="mt-3 text-[12px] text-muted-foreground/70">
              Live active agreements ({totalOwners - activeOwnersCount} inactive)
            </div>
          </CardContent>
          <div className="absolute inset-x-0 bottom-0 h-[2px] bg-success/50" />
        </Card>

        <Card className="relative overflow-hidden hover:shadow-[var(--shadow-elevated)] hover:-translate-y-0.5 transition-all">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground/65">
                  Partner Inventory
                </p>
                <p className="mt-2 font-display text-[26px] font-bold tracking-tight text-primary">
                  {partnerOwnedCount} <span className="text-[14px] text-muted-foreground font-normal">items</span>
                </p>
              </div>
              <div className="metric-icon h-10 w-10 shrink-0">
                <Package className="h-4.5 w-4.5 text-primary" />
              </div>
            </div>
            <div className="mt-3 text-[12px] text-muted-foreground/70">
              Devices supplied by partners
            </div>
          </CardContent>
          <div className="absolute inset-x-0 bottom-0 h-[2px] bg-primary/50" />
        </Card>

        <Card className="relative overflow-hidden hover:shadow-[var(--shadow-elevated)] hover:-translate-y-0.5 transition-all">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground/65">
                  Rented Units
                </p>
                <p className="mt-2 font-display text-[26px] font-bold tracking-tight text-warning-foreground">
                  {partnerRentedCount} <span className="text-[14px] text-muted-foreground font-normal">items</span>
                </p>
              </div>
              <div className="metric-icon h-10 w-10 shrink-0">
                <Activity className="h-4.5 w-4.5 text-warning-foreground" />
              </div>
            </div>
            <div className="mt-3 text-[12px] text-muted-foreground/70">
              Partner devices currently rented
            </div>
          </CardContent>
          <div className="absolute inset-x-0 bottom-0 h-[2px] bg-warning/50" />
        </Card>
      </div>

      {/* Filter strip */}
      <div className="mb-5 flex flex-wrap items-center gap-3 border-b border-border/60 pb-5">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
          <Input
            placeholder="Search by owner name or agreement number…"
            className="pl-9 h-9 text-[13px]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusTab} onValueChange={setStatusTab}>
          <SelectTrigger className="w-[150px] h-9 text-[12px]"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table Card */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Owner Details</TableHead>
                <TableHead>Contact Info</TableHead>
                <TableHead className="text-right">Owned Items</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[120px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOwners.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-muted-foreground text-[13px]">
                    No equipment owners match your search filter.
                  </TableCell>
                </TableRow>
              ) : (
                filteredOwners.map((owner) => {
                  const ownedCount = equipment.filter(
                    (e) => e.owner?.toLowerCase() === owner.name.toLowerCase()
                  ).length;
                  return (
                    <TableRow key={owner.id} className="group">
                      <TableCell>
                        <div>
                          <p className="font-bold text-[14px] text-foreground">{owner.name}</p>
                          {owner.ownerName && (
                            <p className="text-[12px] text-muted-foreground mt-0.5">
                              Owner: <span className="font-medium text-foreground/80">{owner.ownerName}</span>
                            </p>
                          )}
                          <p className="text-[11px] font-mono text-muted-foreground/60 mt-0.5">{owner.id}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-[12px] space-y-0.5">
                          <p className="text-foreground">{owner.phone}</p>
                          <p className="text-muted-foreground font-mono">{owner.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-[12px] font-semibold px-2 hover:bg-primary/10 hover:text-primary rounded-md"
                          onClick={() => {
                            setSelectedOwner(owner);
                            setDetailsOpen(true);
                          }}
                        >
                          {ownedCount} items
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${
                          owner.status === "Active"
                            ? "bg-success/10 text-success border-success/20"
                            : "bg-muted text-muted-foreground border-border/50"
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full bg-current ${owner.status === "Active" ? "animate-[pulse-dot_2.5s_ease-in-out_infinite]" : "opacity-50"}`} />
                          {owner.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isStaff && (
                            <>
                              <OwnerFormDialog
                                title="Edit Owner Details"
                                owner={owner}
                                onSave={refreshData}
                                trigger={
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                    title="Edit"
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                  </Button>
                                }
                              />
                              <DeleteOwnerDialog
                                owner={owner}
                                onDelete={refreshData}
                                trigger={
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                    title="Delete"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                }
                              />
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail drawer sheet */}
      <OwnerDetailsSheet
        owner={selectedOwner}
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
      />
    </AppShell>
  );
}

function Field({
  label,
  placeholder,
  type = "text",
  className,
  value,
  onChange,
  maxLength,
}: {
  label: string;
  placeholder?: string;
  type?: string;
  className?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  maxLength?: number;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</Label>
      <Input type={type} placeholder={placeholder} value={value} onChange={onChange} maxLength={maxLength} className="h-10 text-[13px]" />
    </div>
  );
}
