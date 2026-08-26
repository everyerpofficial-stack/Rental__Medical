import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
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
import { Combobox } from "@/components/ui/combobox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Plus, Search, Download, FileText, Mail, CalendarDays, MessageCircle,
  MoreHorizontal, Edit, Trash2, XCircle, FileCheck2, Clock, AlertTriangle,
  ShieldCheck, Fingerprint, PenTool, Camera, FileUp, CheckCircle2, MapPin,
  X, QrCode, Phone, Info, Eye
} from "lucide-react";
import {
  getRentals,
  saveRental,
  cancelRental,
  approveRental,
  getCustomers,
  getEquipment,
  saveCustomer,
  downloadAgreementFile,
  downloadBase64File,
  downloadFile,
  downloadExcel,
  getPayments,
  getOwners,
  getDocuments,
  getDocumentWithFile,
  getNextAgreementNumber,
  peekNextAgreementNumber,
  formatDateDDMMYYYY,
  formatDateDDMMYY,
  getReturnCalculatedRentPerItem,
  useDatabaseTrigger,
  saveDocument,
  deleteDocument,
  getNextCustomerNumber,
  getNextDocumentNumber,
  getLocalYYYYMMDD,
  parseLocalDate,
  sortLatestFirst,
  extractIdNumber,
  cleanNum,
  formatEquipmentLabel,
  getRentalEquipmentLabels,
  getRentalEquipmentDetailedItems,
  getReturns,
  getRentalOutstandingBalance,
  savePayment,
  getNextPaymentNumber,
  getPaidForEquipment,
} from "@/lib/data-store";
import { useDebounce } from "@/hooks/use-debounce";
import { EquipmentFormDialog } from "@/components/EquipmentFormDialog";
import { isOwnOwner } from "@/components/EquipmentFormDialog";
import { QrScannerModal } from "@/components/QrScannerModal";
import { capitalizeWords, numericInputGuard } from "@/lib/utils";

export const Route = createFileRoute("/rentals")({
  head: () => ({ meta: [{ title: "Rentals — Relife" }] }),
  component: RentalsPage,
});

// Bug fix #6: Proper Rental interface instead of typeof rentals[number] (was `any`)
export interface Rental {
  id: string;
  customer: string;
  customerId: string;
  equipment: string;
  equipmentId: string;
  serial: string;
  start: string;
  end: string;
  monthlyRent: number;
  dailyRent?: number;
  deposit: number;
  status: "Active" | "Overdue" | "Completed" | "Cancelled" | "Pending Approval";
  signatureUrl?: string | null;
  thumbprintUrl?: string | null;
  deliveryCharges?: number;
  removalCharges?: number;
  installationCharges?: number;
  additionalCharges?: number;
  equipmentItems?: any[];
  notes?: string;
  consultingHospital?: string;
  referredBy?: string;
  paymentDate?: string;
  paymentCollectedBy?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  locationAddress?: string | null;
  [key: string]: unknown;
}

export function sendWhatsAppDocument(rental: any, customersList: any[] = []) {
  if (!rental) return;
  const cust = customersList.find((c: any) => c.id === rental.customerId || c.name === rental.customer);
  const rawPhone = cust?.phone || rental.phone || rental.customerPhone || "";
  const cleanPhone = String(rawPhone).replace(/\D/g, "");

  const startDateFormatted = formatDateDDMMYYYY(rental.start);
  const endDateFormatted = rental.end ? formatDateDDMMYYYY(rental.end) : "Ongoing";
  const rentDisplay = rental.rentRate || (rental.monthlyRent ? `₹${rental.monthlyRent.toLocaleString("en-IN")}/mo` : "—");
  const depositDisplay = `₹${(rental.deposit || 0).toLocaleString("en-IN")}`;

  // ITEM-5 FIX: this template printed only `rental.equipment` (the category
  // name) plus the legacy top-level serial, so the model never appeared and a
  // multi-item agreement showed only one serial. Build the lines from the
  // rental's real equipment items, each as `Name - Model (S/N: Serial)`.
  const equipmentLabels = getRentalEquipmentLabels(rental);
  const equipmentBlock = equipmentLabels.length > 0
    ? equipmentLabels.map((label) => `📦 *Equipment:* ${label}\n`).join("")
    : `📦 *Equipment:* Medical Equipment\n`;

  const message = `*Rental Agreement Document - MediRent*\n\n` +
    `📄 *Agreement ID:* ${rental.id}\n` +
    `👤 *Customer:* ${rental.customer}\n` +
    equipmentBlock +
    `🗓️ *Start Date:* ${startDateFormatted}\n` +
    `🗓️ *End Date:* ${endDateFormatted}\n` +
    `💰 *Rent Rate:* ${rentDisplay}\n` +
    `💵 *Security Deposit:* ${depositDisplay}\n` +
    `📌 *Status:* ${rental.status}\n\n` +
    `Thank you for choosing MediRent! Please contact us if you need any assistance.`;

  const textEncoded = encodeURIComponent(message);

  if (cleanPhone) {
    const targetPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    window.open(`https://wa.me/${targetPhone}?text=${textEncoded}`, "_blank");
    toast.success(`Opening WhatsApp to send document for ${rental.id} to ${cust?.name || rental.customer} (${rawPhone})`);
  } else {
    window.open(`https://wa.me/?text=${textEncoded}`, "_blank");
    toast.info(`Opening WhatsApp to share document for ${rental.id}.`);
  }
}

export function getDirectionsUrl(lat: number, lon: number, address?: string): string {
  const cleanAddr = address?.trim() || "";
  if (cleanAddr.startsWith("http://") || cleanAddr.startsWith("https://")) {
    return cleanAddr;
  }
  if (lat !== 0 || lon !== 0) {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
  }
  if (cleanAddr) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanAddr)}`;
  }
  return "";
}

export function parseManualLocationInput(input: string): { latitude: number; longitude: number; address: string } {
  const trimmed = input.trim();
  if (!trimmed) {
    return { latitude: 0, longitude: 0, address: "" };
  }

  // 1. Direct coordinates (e.g. "12.971598, 77.594562" or "12.971598,77.594562" or "12.971598 77.594562")
  const coordsRegex = /^(-?\d+\.\d+)\s*[, \t]\s*(-?\d+\.\d+)$/;
  const coordsMatch = trimmed.match(coordsRegex);
  if (coordsMatch) {
    const lat = parseFloat(coordsMatch[1]);
    const lon = parseFloat(coordsMatch[2]);
    return { latitude: lat, longitude: lon, address: `GPS: ${lat}, ${lon}` };
  }

  // 2. Google Maps URLs containing lat/lng pattern
  // Matches @lat,lon, ?q=lat,lon, ?q=loc:lat,lon, /place/lat,lon, !3dlat!4dlon, /search/lat,lon, /dir//lat,lon
  const urlLatLonRegex = /(?:@|loc:|\?q=|\/place\/|\/search\/|\/dir\/|\!3d|query=)(-?\d+\.\d+)[,\/!4d\s]+(-?\d+\.\d+)/i;
  const urlMatch = trimmed.match(urlLatLonRegex);
  if (urlMatch) {
    const lat = parseFloat(urlMatch[1]);
    const lon = parseFloat(urlMatch[2]);
    return {
      latitude: lat,
      longitude: lon,
      address: trimmed
    };
  }

  // 3. Simple lat/lng anywhere in text (e.g. "Location at 12.971598, 77.594562 near hospital")
  const anyLatLonRegex = /(-?\d+\.\d{3,})\s*,\s*(-?\d+\.\d{3,})/;
  const anyMatch = trimmed.match(anyLatLonRegex);
  if (anyMatch) {
    const lat = parseFloat(anyMatch[1]);
    const lon = parseFloat(anyMatch[2]);
    return {
      latitude: lat,
      longitude: lon,
      address: trimmed
    };
  }

  // 4. Fallback: URL or text string without extractable numeric coordinates
  return {
    latitude: 0,
    longitude: 0,
    address: trimmed
  };
}

interface AdditionalItem {
  id?: string;
  name: string;
  amount: number;
  status: "Paid" | "Not Paid" | "Free of Cost";
  selected: boolean;
  isCustom?: boolean;
}

function CreateRentalDialog({ trigger, title = "New Rental Agreement", rental, onSave, inline, onClose }: {
  trigger?: React.ReactNode; title?: string; rental?: Rental; onSave?: () => void; inline?: boolean; onClose?: () => void;
}) {
  // BUG FIX: In inline mode the component is already visible, so `open` must
  // start as `true` — otherwise the useEffect that loads existing documents
  // (delivery photos, signed docs, location tag) never fires, leaving the
  // Security & Verification section blank when editing an agreement.
  const [open, setOpen] = useState(!!inline);
  const isStaff = typeof window !== "undefined" && localStorage.getItem("medirent-user-role") === "Staff";
  const [equipmentList, setEquipmentList] = useState(() => getEquipment());
  // BUG-FIX: customersList used to be recomputed via a bare getCustomers() call
  // in the render body, which re-runs on every keystroke/selection in this
  // dialog. getCustomers() -> getRentals() carries a self-healing repair pass
  // plus a live status-correction sync to Google Sheets, so re-running it on
  // every render made routine actions like picking equipment feel like they
  // took 10-20s to register (the checkbox state itself updated instantly —
  // the browser just couldn't paint until that heavy work finished). Load it
  // like equipmentList: once on open, and again on remote db updates.
  const [customersList, setCustomersList] = useState(() => getCustomers());
  // Bumped on every database update so the customer's saved KYC documents are
  // re-read after an upload elsewhere (Customers page, Documents page).
  const [docsRefresh, setDocsRefresh] = useState(0);

  useEffect(() => {
    if (open) {
      setEquipmentList(getEquipment());
      setCustomersList(getCustomers());
    }
  }, [open]);

  useEffect(() => {
    const handleUpdate = () => {
      setEquipmentList(getEquipment());
      setCustomersList(getCustomers());
      setDocsRefresh((v) => v + 1);
    };
    window.addEventListener("medirent-db-updated", handleUpdate);
    return () => window.removeEventListener("medirent-db-updated", handleUpdate);
  }, []);
  const prevOpenRef = useRef(false);
  const prevNeededAutoItemsRef = useRef<Set<string>>(new Set());
  // For new agreements: peek (don't increment) the counter for display — counter is consumed only on actual save.
  // For edits: keep existing ID.
  const [agreementId, setAgreementId] = useState(rental?.id || peekNextAgreementNumber());
  const [agreementDate, setAgreementDate] = useState(rental?.start ? getLocalYYYYMMDD(rental.start) : getLocalYYYYMMDD());
  const [endDate, setEndDate] = useState(rental?.end ? getLocalYYYYMMDD(rental.end) : "");

  const [isNewCustomer, setIsNewCustomer] = useState(false);
  // ITEM-15: see phoneMatches below - real-time duplicate-contact detection.
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>(rental?.customerId);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(rental?.signatureUrl || null);
  const [thumbprintUrl, setThumbprintUrl] = useState<string | null>(rental?.thumbprintUrl || null);
  const [deliveryPhotos, setDeliveryPhotos] = useState<Array<{ url: string; name: string; size?: string; id?: string }>>([]);
  const [signedDocUrl, setSignedDocUrl] = useState<string | null>(null);
  const [signedDocName, setSignedDocName] = useState<string>("");
  const [isDeliveryPhotoChanged, setIsDeliveryPhotoChanged] = useState(false);
  const [isSignedDocChanged, setIsSignedDocChanged] = useState(false);
  const [isLocationChanged, setIsLocationChanged] = useState(false);
  // Ids of documents already persisted for this rental, so save can reconcile
  // removals/replacements instead of leaving orphaned document records behind.
  const [initialDeliveryPhotoIds, setInitialDeliveryPhotoIds] = useState<string[]>([]);
  const [existingSignedDocId, setExistingSignedDocId] = useState<string | null>(null);
  const [existingLocationDocId, setExistingLocationDocId] = useState<string | null>(null);
  // Bug 8/9: QR scanner state — which equipment row index is being scanned
  const [scannerTargetIdx, setScannerTargetIdx] = useState<number | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isBulkScannerOpen, setIsBulkScannerOpen] = useState(false);
  const [capturedLocation, setCapturedLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy?: number;
    address?: string;
    timestamp: string;
  } | null>(null);
  const [isCapturingLocation, setIsCapturingLocation] = useState(false);
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false);
  const [manualLocationInput, setManualLocationInput] = useState("");

  // New Customer states
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custAltPhone, setCustAltPhone] = useState("");
  const [custContactNumber3, setCustContactNumber3] = useState("");

  // ITEM-15: warn the moment a typed number is already on file, so the operator
  // picks the existing customer instead of creating a second record for them.
  // Matching is on the normalised 10 digits and covers all three stored numbers,
  // because a person's "alternate" number is often someone else's primary.
  const findPhoneOwner = useCallback(
    (value: string) => {
      const digits = String(value || "").replace(/\D/g, "");
      if (digits.length !== 10) return null;
      return (
        customersList.find((c: any) =>
          [c.phone, c.altPhone, c.contactNumber3].some(
            (p: any) => String(p || "").replace(/\D/g, "") === digits
          )
        ) || null
      );
    },
    [customersList]
  );

  const custPhoneOwner = useMemo(() => findPhoneOwner(custPhone), [findPhoneOwner, custPhone]);
  const custAltPhoneOwner = useMemo(() => findPhoneOwner(custAltPhone), [findPhoneOwner, custAltPhone]);
  const custContact3Owner = useMemo(() => findPhoneOwner(custContactNumber3), [findPhoneOwner, custContactNumber3]);
  const [custEmail, setCustEmail] = useState("");
  const [custAadhaar, setCustAadhaar] = useState("");
  const [custPan, setCustPan] = useState("");
  const [custAddress, setCustAddress] = useState("");
  const [custArea, setCustArea] = useState("");
  const [custCity, setCustCity] = useState("");
  const [custState, setCustState] = useState("Karnataka");
  const [custPincode, setCustPincode] = useState("");
  const [custNotes, setCustNotes] = useState("");
  const [custFiles, setCustFiles] = useState<Array<{ fileData: string; name: string; size: string }>>([]);

  // KYC ID proofs already on file for the selected customer. These live in the
  // Documents collection keyed by customerId (not rentalId), which is why the
  // Documents page listed them inside the agreement folder while this dialog
  // showed nothing at all. Loaded separately from `custFiles`, which only ever
  // holds files newly attached in this dialog and still waiting to be saved.
  const [existingCustDocs, setExistingCustDocs] = useState<Array<{
    id: string; name: string; size: string; fileData?: string; missing?: boolean;
  }>>([]);
  const [isLoadingCustDocs, setIsLoadingCustDocs] = useState(false);
  const custDocLoadTokenRef = useRef(0);
  // Resolved file payloads keyed by document id, so re-runs of the loader
  // effect reuse what is already in memory instead of re-reading IndexedDB.
  const resolvedCustDocsRef = useRef<Map<string, { fileData?: string; missing?: boolean }>>(new Map());
  const [previewCustDoc, setPreviewCustDoc] = useState<{ id: string; name: string; size: string; fileData?: string } | null>(null);

  // Equipment and commercials
  const [selectedEquipments, setSelectedEquipments] = useState<any[]>(() => {
    if (rental) {
      if (rental.equipmentItems && rental.equipmentItems.length > 0) {
        return rental.equipmentItems.map((item: any) => {
          const isMonthly = item.rentCycle ? item.rentCycle === "Monthly" : ((item.monthlyRent || 0) > 0 && (item.dailyRent || 0) === 0);
          return {
            equipmentId: item.equipmentId || "",
            serial: item.serial || "",
            rentCycle: item.rentCycle || (isMonthly ? "Monthly" : "Daily"),
            rentRate: isMonthly ? (item.monthlyRent?.toString() || "") : (item.dailyRent?.toString() || ""),
            monthlyRent: item.monthlyRent?.toString() || "",
            dailyRent: item.dailyRent?.toString() || "",
            deposit: item.deposit?.toString() || "",
          };
        });
      }
      const isMonthlyLegacy = (rental as any).rentCycle ? (rental as any).rentCycle === "Monthly" : ((rental.monthlyRent || 0) > 0 && (rental.dailyRent || 0) === 0);
      return [{
        equipmentId: rental.equipmentId || "",
        serial: rental.serial || "",
        rentCycle: (rental as any).rentCycle || (isMonthlyLegacy ? "Monthly" : "Daily"),
        rentRate: isMonthlyLegacy ? (rental.monthlyRent?.toString() || "") : (rental.dailyRent?.toString() || ""),
        monthlyRent: rental.monthlyRent?.toString() || "",
        dailyRent: rental.dailyRent?.toString() || "",
        deposit: rental.deposit?.toString() || "",
      }];
    }
    return [{ equipmentId: "", serial: "", rentCycle: "Monthly", rentRate: "", monthlyRent: "", dailyRent: "", deposit: "" }];
  });

  const [deliveryCharges, setDeliveryCharges] = useState(rental?.deliveryCharges?.toString() || "0");
  const [removalCharges, setRemovalCharges] = useState(rental?.removalCharges?.toString() || "0");
  const [installationCharges, setInstallationCharges] = useState(rental?.installationCharges?.toString() || "0");
  const [additionalCharges, setAdditionalCharges] = useState(rental?.additionalCharges?.toString() || "0");
  // ITEM-14: a negotiated reduction on the rent, recorded on the agreement so
  // it flows into the printed agreement, the receipt and every later balance
  // rather than being hidden by hand-editing the monthly rate.
  const [rentalDiscount, setRentalDiscount] = useState(rental?.rentalDiscount?.toString() || "0");
  const [rentalDiscountMode, setRentalDiscountMode] = useState<"amount" | "percent">(
    (rental?.rentalDiscountMode as "amount" | "percent") || "amount"
  );
  const [remarks, setRemarks] = useState((rental?.remarks as string) || "");
  const [consultingHospital, setConsultingHospital] = useState((rental?.consultingHospital as string) || "");
  const [referredBy, setReferredBy] = useState((rental?.referredBy as string) || "");

  const [owners] = useState(() => getOwners());

  const [rentalPaymentStatus, setRentalPaymentStatus] = useState<"Paid" | "Not Paid" | "Partial" | "Free of Cost">(
    (rental?.rentalPaymentStatus as "Paid" | "Not Paid" | "Partial" | "Free of Cost") || "Not Paid"
  );
  const [depositPaymentStatus, setDepositPaymentStatus] = useState<"Paid" | "Not Paid" | "Partial" | "Free of Cost">(
    (rental?.depositPaymentStatus as "Paid" | "Not Paid" | "Partial" | "Free of Cost") || "Not Paid"
  );
  const [rentPaidAmount, setRentPaidAmount] = useState(rental?.rentPaidAmount?.toString() || "");
  const [depositPaidAmount, setDepositPaidAmount] = useState(rental?.depositPaidAmount?.toString() || "");
  const [cashPaidAmount, setCashPaidAmount] = useState((rental as any)?.cashPaidAmount?.toString() || "");
  const [bankUpiPaidAmount, setBankUpiPaidAmount] = useState((rental as any)?.bankUpiPaidAmount?.toString() || "");
  const [paymentMode, setPaymentMode] = useState((rental?.paymentMode as string) || "Cash");
  const [paymentDate, setPaymentDate] = useState(rental?.paymentDate ? getLocalYYYYMMDD(rental.paymentDate as string) : getLocalYYYYMMDD());
  const [paymentCollectedBy, setPaymentCollectedBy] = useState((rental?.paymentCollectedBy as string) || "");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState<"Active">("Active");

  const handleRentPaidAmountChange = (val: string) => {
    setRentPaidAmount(val);
  };

  const handleRentalPaymentStatusChange = (val: "Paid" | "Not Paid" | "Partial" | "Free of Cost") => {
    setRentalPaymentStatus(val);
    const target = getDurationDetails().totalRent;
    if (val === "Paid") {
      setRentPaidAmount(target.toString());
    } else if (val === "Not Paid") {
      setRentPaidAmount("0");
    } else if (val === "Partial") {
      setRentPaidAmount("");
    } else if (val === "Free of Cost") {
      setRentPaidAmount("0");
    }
  };

  const handleDepositPaidAmountChange = (val: string) => {
    setDepositPaidAmount(val);
  };

  const handleDepositPaymentStatusChange = (val: "Paid" | "Not Paid" | "Partial" | "Free of Cost") => {
    setDepositPaymentStatus(val);
    const target = selectedEquipments.reduce((sum, item) => sum + (Number(item.deposit) || 0), 0);
    if (val === "Paid") {
      setDepositPaidAmount(target.toString());
    } else if (val === "Not Paid") {
      setDepositPaidAmount("0");
    } else if (val === "Partial") {
      setDepositPaidAmount("");
    } else if (val === "Free of Cost") {
      setDepositPaidAmount("0");
    }
  };

  useEffect(() => {
    const targetRent = getDurationDetails().totalRent;
    if (rentalPaymentStatus === "Paid") {
      setRentPaidAmount(targetRent.toString());
    } else if (rentalPaymentStatus === "Not Paid" || rentalPaymentStatus === "Free of Cost") {
      setRentPaidAmount("0");
    }

    const targetDeposit = selectedEquipments.reduce((sum, item) => sum + (Number(item.deposit) || 0), 0);
    if (depositPaymentStatus === "Paid") {
      setDepositPaidAmount(targetDeposit.toString());
    } else if (depositPaymentStatus === "Not Paid" || depositPaymentStatus === "Free of Cost") {
      setDepositPaidAmount("0");
    }
  }, [selectedEquipments]);

  const handleSaveDraftAndAddEquipment = (e: React.MouseEvent) => {
    e.preventDefault();
    const draft = {
      agreementId,
      agreementDate,
      endDate,
      consultingHospital,
      referredBy,
      isNewCustomer,
      selectedCustomerId,
      custName,
      custPhone,
      custAltPhone,
      custContactNumber3,
      custEmail,
      custAadhaar,
      custPan,
      custAddress,
      custArea,
      custCity,
      custState,
      custPincode,
      custNotes,
      custFiles,
      selectedEquipments,
      deliveryCharges,
      removalCharges,
      installationCharges,
      additionalCharges,
      rentalDiscount,
      rentalDiscountMode,
      remarks,
      rentalPaymentStatus,
      depositPaymentStatus,
      rentPaidAmount,
      depositPaidAmount,
      cashPaidAmount,
      bankUpiPaidAmount,
      paymentMode,
      paymentDate,
      paymentCollectedBy,
      approvalStatus,
      additionalItems,
      signatureUrl,
      thumbprintUrl,
    };
        localStorage.setItem("medirent_new_agreement_draft", JSON.stringify(draft));
    toast.success("Current agreement details saved to draft.");
    setOpen(false);
    if (onClose) onClose();
    window.location.href = "/equipment?addNew=true";
  };

  const handleRestoreDraft = (e: React.MouseEvent) => {
    e.preventDefault();
    const savedDraft = localStorage.getItem("medirent_new_agreement_draft");
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setAgreementId(draft.agreementId || peekNextAgreementNumber());
        setAgreementDate(draft.agreementDate || getLocalYYYYMMDD());
        setEndDate(draft.endDate || getLocalYYYYMMDD(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)));
        setConsultingHospital(draft.consultingHospital || "");
        setReferredBy(draft.referredBy || "");
        setIsNewCustomer(draft.isNewCustomer || false);
        setSelectedCustomerId(draft.selectedCustomerId);
        setCustName(draft.custName || "");
        setCustPhone(draft.custPhone || "");
        setCustAltPhone(draft.custAltPhone || "");
        setCustContactNumber3(draft.custContactNumber3 || "");
        setCustEmail(draft.custEmail || "");
        setCustAadhaar(draft.custAadhaar || "");
        setCustPan(draft.custPan || "");
        setCustAddress(draft.custAddress || "");
        setCustArea(draft.custArea || "");
        setCustCity(draft.custCity || "Mysore");
        setCustState(draft.custState || "Karnataka");
        setCustPincode(draft.custPincode || "");
        setCustNotes(draft.custNotes || "");
        setCustFiles(draft.custFiles || []);
        setSelectedEquipments(draft.selectedEquipments || [{ equipmentId: "", serial: "", rentCycle: "Monthly", rentRate: "", monthlyRent: "", dailyRent: "", deposit: "" }]);
        setDeliveryCharges(draft.deliveryCharges || "0");
        setRemovalCharges(draft.removalCharges || "0");
        setInstallationCharges(draft.installationCharges || "0");
        setAdditionalCharges(draft.additionalCharges || "0");
        setRentalDiscount(draft.rentalDiscount || "0");
        setRentalDiscountMode(draft.rentalDiscountMode || "amount");
        setRemarks(draft.remarks || "");
        setRentalPaymentStatus(draft.rentalPaymentStatus || "Not Paid");
        setDepositPaymentStatus(draft.depositPaymentStatus || "Not Paid");
        setRentPaidAmount(draft.rentPaidAmount || "");
        setDepositPaidAmount(draft.depositPaidAmount || "");
        setCashPaidAmount(draft.cashPaidAmount || "");
        setBankUpiPaidAmount(draft.bankUpiPaidAmount || "");
        setPaymentMode(draft.paymentMode || "Cash");
        setPaymentDate(draft.paymentDate || getLocalYYYYMMDD());
        setPaymentCollectedBy(draft.paymentCollectedBy || "");
        setApprovalStatus("Active");
        setAdditionalItems(draft.additionalItems || []);
        prevNeededAutoItemsRef.current = getNeededAutoItemsForEquipments(draft.selectedEquipments || []);
        setSignatureUrl(draft.signatureUrl || null);
        setThumbprintUrl(draft.thumbprintUrl || null);

        toast.success("Draft agreement details restored!");
        setHasDraft(false);
      } catch (err) {
        toast.error("Failed to restore draft.");
      }
    }
  };

  const handleDiscardDraft = (e: React.MouseEvent) => {
    e.preventDefault();
    localStorage.removeItem("medirent_new_agreement_draft");
    setHasDraft(false);
    toast.success("Draft agreement details discarded.");
  };

  useEffect(() => {
    if (typeof window !== "undefined" && !rental) {
      const params = new URLSearchParams(window.location.search);
      if (params.get("addNew") === "true") {
        setOpen(true);
      }
    }
  }, [rental]);

  useEffect(() => {
    // Only reset form state when the dialog transitions from closed → open.
    // This prevents user edits from being undone by re-renders while the dialog is open.
    const justOpened = open && !prevOpenRef.current;
    prevOpenRef.current = open;
    if (open && justOpened) {
      setIsSubmitting(false);
      const savedDraft = localStorage.getItem("medirent_new_agreement_draft");
      if (savedDraft) {
        setHasDraft(true);
      } else {
        setHasDraft(false);
      }
      setAgreementId(rental?.id || peekNextAgreementNumber());
      setAgreementDate(rental?.start ? getLocalYYYYMMDD(rental.start) : getLocalYYYYMMDD());
      setEndDate(rental?.end ? getLocalYYYYMMDD(rental.end) : "");
      setIsNewCustomer(false);
      setSelectedCustomerId(rental?.customerId);
      setSignatureUrl(rental?.signatureUrl || null);
      setThumbprintUrl(rental?.thumbprintUrl || null);
      setDeliveryPhotos([]);
      setSignedDocUrl(null);
      setSignedDocName("");
      setIsDeliveryPhotoChanged(false);
      setIsSignedDocChanged(false);
      setIsLocationChanged(false);
      setInitialDeliveryPhotoIds([]);
      setExistingSignedDocId(null);
      setExistingLocationDocId(null);

      if (rental) {
        try {
          const docs = getDocuments();
          // A signed agreement uploaded from the Documents page is auto-typed
          // "Agreement" (detectDocumentType maps every PDF there), so matching
          // only "Signed Agreement" left those uploads invisible here even
          // though the Documents folder listed them. `doc-agr-*` is excluded:
          // that is the placeholder record saveRental() creates for the
          // system-generated agreement PDF and carries no uploaded file.
          const existingSignedDoc = docs.find((d: any) =>
            d.rentalId === rental.id &&
            (d.type === "Signed Agreement" ||
              (d.type === "Agreement" && !String(d.id).startsWith("doc-agr-")))
          );
          const existingDeliveryPhotos = docs.filter((d: any) => d.rentalId === rental.id && d.type === "Delivery Photo");
          const existingLocationDoc = docs.find((d: any) => d.rentalId === rental.id && d.type === "Location Tag");

          if (existingSignedDoc) {
            setSignedDocName(existingSignedDoc.name);
            setExistingSignedDocId(existingSignedDoc.id);
            getDocumentWithFile(existingSignedDoc).then((fullDoc: any) => {
              if (fullDoc.fileData && fullDoc.fileData !== "NOT_FOUND") {
                setSignedDocUrl(fullDoc.fileData);
              }
            }).catch((err: any) => console.warn("Failed to load signed document:", err));
          }
          if (existingDeliveryPhotos.length > 0) {
            setInitialDeliveryPhotoIds(existingDeliveryPhotos.map((d: any) => d.id));
            Promise.all(existingDeliveryPhotos.map((d: any) => getDocumentWithFile(d))).then((fullDocs: any[]) => {
              const loadedPhotos = fullDocs
                .filter((d) => d.fileData && d.fileData !== "NOT_FOUND")
                .map((d) => ({
                  url: d.fileData,
                  name: d.name,
                  size: d.size,
                  id: d.id,
                }));
              setDeliveryPhotos(loadedPhotos);
            }).catch((err: any) => console.warn("Failed to load delivery photos:", err));
          }
          if (existingLocationDoc) {
            setExistingLocationDocId(existingLocationDoc.id);
          }

          // ALWAYS load signatureUrl/thumbprintUrl from the Documents collection
          // (IndexedDB), even when the rental object has a value. The rental
          // object's inline base64 may have been truncated or lost during Google
          // Sheets sync (cell-size limits), so the document store in IndexedDB is
          // the authoritative, uncorrupted source for these files.
          const sigDoc = docs.find((d: any) => d.rentalId === rental.id && d.type === "Digital Signature");
          if (sigDoc) {
            getDocumentWithFile(sigDoc).then((fullDoc: any) => {
              if (fullDoc.fileData && fullDoc.fileData !== "NOT_FOUND") {
                setSignatureUrl(fullDoc.fileData);
              }
            }).catch((err: any) => console.warn("Failed to load signature from documents:", err));
          }
          const tpDoc = docs.find((d: any) => d.rentalId === rental.id && d.type === "Thumbprint Scan");
          if (tpDoc) {
            getDocumentWithFile(tpDoc).then((fullDoc: any) => {
              if (fullDoc.fileData && fullDoc.fileData !== "NOT_FOUND") {
                setThumbprintUrl(fullDoc.fileData);
              }
            }).catch((err: any) => console.warn("Failed to load thumbprint from documents:", err));
          }
        } catch (err) {
          console.warn("Failed to load existing files for editing agreement:", err);
        }
      }
      if (rental && ((rental as any).latitude || (rental as any).longitude || (rental as any).locationAddress)) {
        setCapturedLocation({
          latitude: Number((rental as any).latitude) || 0,
          longitude: Number((rental as any).longitude) || 0,
          address: (rental as any).locationAddress || "",
          accuracy: Number((rental as any).locationAccuracy || 0),
          timestamp: (rental as any).locationTimestamp || new Date().toLocaleString(),
        });
      } else {
        setCapturedLocation(null);
      }
      setIsCapturingLocation(false);
      
      // New Customer states
      setCustName("");
      setCustPhone("");
      setCustAltPhone("");
      setCustContactNumber3("");
      setCustEmail("");
      setCustAadhaar("");
      setCustPan("");
      setCustAddress("");
      setCustArea("");
      setCustCity("Mysore");
      setCustState("Karnataka");
      setCustPincode("");
      setCustNotes("");
      setCustFiles([]);

      // Charges
      setDeliveryCharges(rental?.deliveryCharges?.toString() || "0");
      setRemovalCharges(rental?.removalCharges?.toString() || "0");
      setInstallationCharges(rental?.installationCharges?.toString() || "0");
      setAdditionalCharges(rental?.additionalCharges?.toString() || "0");
      setRentalDiscount(rental?.rentalDiscount?.toString() || "0");
      setRentalDiscountMode((rental?.rentalDiscountMode as "amount" | "percent") || "amount");
      setRemarks((rental?.remarks as string) || "");
      setConsultingHospital((rental?.consultingHospital as string) || "");
      setReferredBy((rental?.referredBy as string) || "");

      // Rental and deposit payment status
      setRentalPaymentStatus((rental?.rentalPaymentStatus as "Paid" | "Not Paid" | "Partial" | "Free of Cost") || "Not Paid");
      setDepositPaymentStatus((rental?.depositPaymentStatus as "Paid" | "Not Paid" | "Partial" | "Free of Cost") || "Not Paid");
      setRentPaidAmount(rental?.rentPaidAmount?.toString() || "");
      setDepositPaidAmount((rental as any)?.depositPaidAmount?.toString() || "");
      setCashPaidAmount((rental as any)?.cashPaidAmount?.toString() || "");
      setBankUpiPaidAmount((rental as any)?.bankUpiPaidAmount?.toString() || "");
      setPaymentMode((rental?.paymentMode as string) || "Cash");
      setPaymentDate(rental?.paymentDate ? getLocalYYYYMMDD(rental.paymentDate as string) : getLocalYYYYMMDD());
      setPaymentCollectedBy((rental?.paymentCollectedBy as string) || "");

      // Selected equipment
      if (rental) {
        if (rental.equipmentItems && rental.equipmentItems.length > 0) {
          setSelectedEquipments(rental.equipmentItems.map((item: any) => {
            const isMonthly = item.rentCycle ? item.rentCycle === "Monthly" : ((item.monthlyRent || 0) > 0 && (item.dailyRent || 0) === 0);
            return {
              equipmentId: item.equipmentId || "",
              serial: item.serial || "",
              rentCycle: item.rentCycle || (isMonthly ? "Monthly" : "Daily"),
              rentRate: isMonthly ? (item.monthlyRent?.toString() || "") : (item.dailyRent?.toString() || ""),
              monthlyRent: item.monthlyRent?.toString() || "",
              dailyRent: item.dailyRent?.toString() || "",
              deposit: item.deposit?.toString() || "",
            };
          }));
        } else {
          const isMonthlyLegacy = (rental as any).rentCycle ? (rental as any).rentCycle === "Monthly" : ((rental.monthlyRent || 0) > 0 && (rental.dailyRent || 0) === 0);
          setSelectedEquipments([{
            equipmentId: rental.equipmentId || "",
            serial: rental.serial || "",
            rentCycle: (rental as any).rentCycle || (isMonthlyLegacy ? "Monthly" : "Daily"),
            rentRate: isMonthlyLegacy ? (rental.monthlyRent?.toString() || "") : (rental.dailyRent?.toString() || ""),
            monthlyRent: rental.monthlyRent?.toString() || "",
            dailyRent: rental.dailyRent?.toString() || "",
            deposit: rental.deposit?.toString() || "",
          }]);
        }
      } else {
        // Pre-select equipment from URL parameters if present
        let initialEq = { equipmentId: "", serial: "", rentCycle: "Monthly", rentRate: "", monthlyRent: "", dailyRent: "", deposit: "" };
        if (typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search);
          const searchEqId = params.get("equipmentId");
          if (searchEqId) {
            const eq = getEquipment().find(e => e.id === searchEqId);
            if (eq) {
              initialEq = {
                equipmentId: eq.id,
                serial: eq.serial,
                rentCycle: "Monthly",
                rentRate: "",
                monthlyRent: "",
                dailyRent: "",
                deposit: ""
              };
            }
          }
        }
        setSelectedEquipments([initialEq]);
      }

      // Reset additional items
      const defaultItems: AdditionalItem[] = [
        { name: "Humidifier Bottle", amount: 0, status: "Not Paid", selected: false },
        { name: "Bipap Mask", amount: 0, status: "Not Paid", selected: false },
        { name: "Bipap Hose Pipe", amount: 0, status: "Not Paid", selected: false },
        { name: "Oxygen Nasal Cannula", amount: 0, status: "Not Paid", selected: false },
        { name: "Installation Charge", amount: 0, status: "Not Paid", selected: rental?.installationCharges ? true : false },
        { name: "One Side Transport", amount: 0, status: "Not Paid", selected: false },
        { name: "Another Side Transport", amount: 0, status: "Not Paid", selected: false },
        { name: "Nebulizer", amount: 0, status: "Not Paid", selected: false },
        { name: "Pulse Oximeter", amount: 0, status: "Not Paid", selected: false },
        { name: "10mtr Oxygen Cannula", amount: 0, status: "Not Paid", selected: false },
      ];
      let initialAdditionalItems = defaultItems;
      if (typeof window !== "undefined" && !rental) {
        const params = new URLSearchParams(window.location.search);
        const searchEqId = params.get("equipmentId");
        if (searchEqId) {
          const eq = getEquipment().find(e => e.id === searchEqId);
          if (eq) {
            const autoSelectedNames = getAutoSelectItems(eq.name || "", eq.category || "");
            initialAdditionalItems = defaultItems.map(item => {
              if (autoSelectedNames.includes(item.name)) {
                return { ...item, selected: true };
              }
              return item;
            });
            setTimeout(() => {
              updateCalculatedCharges(initialAdditionalItems);
            }, 0);
          }
        }
      }

      if (rental?.additionalItems) {
        setAdditionalItems(rental.additionalItems as AdditionalItem[]);
      } else {
        setAdditionalItems(initialAdditionalItems);
      }

      const initialEqs = rental
        ? (rental.equipmentItems || [{ equipmentId: rental.equipmentId || "", serial: rental.serial || "" }])
        : (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("equipmentId") 
          ? [{ equipmentId: new URLSearchParams(window.location.search).get("equipmentId") }] 
          : []);
      prevNeededAutoItemsRef.current = getNeededAutoItemsForEquipments(initialEqs);

      // Cleanup query params
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        if (params.get("addNew") === "true") {
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
        }
      }
    }
  }, [open, rental]);
  
  const [additionalItems, setAdditionalItems] = useState<AdditionalItem[]>(() => {
    const defaultItems: AdditionalItem[] = [
      { name: "Humidifier Bottle", amount: 0, status: "Not Paid", selected: false },
      { name: "Bipap Mask", amount: 0, status: "Not Paid", selected: false },
      { name: "Bipap Hose Pipe", amount: 0, status: "Not Paid", selected: false },
      { name: "Oxygen Nasal Cannula", amount: 0, status: "Not Paid", selected: false },
      { name: "Installation Charge", amount: 0, status: "Not Paid", selected: rental?.installationCharges ? true : false },
      { name: "One Side Transport", amount: 0, status: "Not Paid", selected: false },
      { name: "Another Side Transport", amount: 0, status: "Not Paid", selected: false },
      { name: "Nebulizer", amount: 0, status: "Not Paid", selected: false },
      { name: "Pulse Oximeter", amount: 0, status: "Not Paid", selected: false },
      { name: "10mtr Oxygen Cannula", amount: 0, status: "Not Paid", selected: false },
    ];

    if (rental?.additionalItems) {
      return rental.additionalItems as AdditionalItem[];
    }
    
    // For legacy edit support
    if (rental) {
      if (rental.installationCharges) {
        const inst = defaultItems.find(i => i.name === "Installation Charge");
        if (inst) {
          inst.amount = rental.installationCharges;
          inst.selected = true;
        }
      }
      if (rental.additionalCharges) {
        const transport = defaultItems.find(i => i.name === "One Side Transport");
        if (transport) {
          transport.amount = rental.additionalCharges;
          transport.selected = true;
        }
      }
    }
    return defaultItems;
  });

  const updateCalculatedCharges = (items: AdditionalItem[], changedItemName?: string) => {
    // Only update installation charges if that item specifically changed, or if no specific item was passed (e.g. initialization)
    if (!changedItemName || changedItemName === "Installation Charge") {
      const instItem = items.find(i => i.name === "Installation Charge" && i.selected);
      const instVal = instItem ? (instItem.status === "Free of Cost" ? 0 : instItem.amount) : 0;
      setInstallationCharges(instVal.toString());
    }

    // Only update delivery charges if transport items changed, or if no specific item was passed
    if (!changedItemName || changedItemName === "One Side Transport" || changedItemName === "Another Side Transport") {
      const oneSide = items.find(i => i.name === "One Side Transport" && i.selected);
      const anotherSide = items.find(i => i.name === "Another Side Transport" && i.selected);
      const oneSideVal = oneSide ? (oneSide.status === "Free of Cost" ? 0 : oneSide.amount) : 0;
      const anotherSideVal = anotherSide ? (anotherSide.status === "Free of Cost" ? 0 : anotherSide.amount) : 0;
      
      if (oneSide || anotherSide) {
        setDeliveryCharges((oneSideVal + anotherSideVal).toString());
      } else {
        if (!changedItemName) {
          setDeliveryCharges(rental?.deliveryCharges?.toString() || "0");
        } else {
          setDeliveryCharges("0");
        }
      }
    }

    // Only update additional charges if non-installation and non-transport items changed, or if no specific item was passed
    if (!changedItemName || (
      changedItemName !== "Installation Charge" && 
      changedItemName !== "One Side Transport" && 
      changedItemName !== "Another Side Transport"
    )) {
      const otherItems = items.filter(i => 
        i.selected && 
        i.name !== "Installation Charge" && 
        i.name !== "One Side Transport" && 
        i.name !== "Another Side Transport"
      );
      const addVal = otherItems.reduce((sum, i) => sum + (i.status === "Free of Cost" ? 0 : i.amount), 0);
      setAdditionalCharges(addVal.toString());
    }
  };

  const getDurationDetails = () => {
    if (!agreementDate) return { text: "Select start date", totalRent: 0, months: 0, days: 0, totalDays: 0 };
    const start = parseLocalDate(agreementDate);
    if (isNaN(start.getTime())) {
      return { text: "Invalid start date", totalRent: 0, months: 0, days: 0, totalDays: 0 };
    }

    let end: Date;
    let isOngoing = false;
    if (!endDate) {
      isOngoing = true;
      const parts = agreementDate.split("-");
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // 0-indexed
        const day = parseInt(parts[2], 10);
        const hasDaily = selectedEquipments.some(e => e.rentCycle === "Daily");
        if (hasDaily) {
          end = new Date(year, month, day + 30);
        } else {
          end = new Date(year, month + 1, day);
        }
      } else {
        end = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);
      }
    } else {
      end = parseLocalDate(endDate);
    }

    if (isNaN(end.getTime()) || end < start) {
      return { text: "Invalid date range", totalRent: 0, months: 0, days: 0, totalDays: 0 };
    }

    const diffTime = end.getTime() - start.getTime();
    const totalDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    // Calculate months & remaining days
    let months = end.getFullYear() - start.getFullYear();
    months = months * 12 + (end.getMonth() - start.getMonth());
    
    let days = end.getDate() - start.getDate();
    if (days < 0) {
      months--;
      const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
      days += prevMonth.getDate();
    }

    // Determine duration text
    let durationText = "";
    if (isOngoing) {
      durationText = "Ongoing (Upfront: 1 Month)";
    } else if (months > 0 && days > 0) {
      durationText = `${months} month${months > 1 ? 's' : ''} and ${days} day${days > 1 ? 's' : ''} (${totalDays} days)`;
    } else if (months > 0) {
      durationText = `${months} month${months > 1 ? 's' : ''} (${totalDays} days)`;
    } else {
      durationText = `${totalDays} day${totalDays !== 1 ? 's' : ''}`;
    }

    // Calculate total rent across all selected equipment
    let totalRent = 0;
    selectedEquipments.forEach((eqItem) => {
      const rate = Number(eqItem.rentRate) || 0;
      if (eqItem.rentCycle === "Monthly") {
        if (isOngoing) {
          totalRent += rate; // Exactly 1 month upfront rate
        } else {
          totalRent += Math.round(totalDays * (rate / 30));
        }
      } else {
        if (isOngoing) {
          totalRent += rate; // Exactly 1 day upfront rate for daily cycle
        } else {
          totalRent += totalDays * rate;
        }
      }
    });

    return { text: durationText, totalRent, months, days, totalDays };
  };

  const durationDetails = getDurationDetails();

  // ITEM-12: show both contact numbers on every row. Namesakes are common here
  // (and now explicitly allowed - see ITEM-4), so the name alone is not enough
  // to tell two customers apart at selection time; the phone numbers are.
  const customerOptions = useMemo(
    () =>
      customersList.map((c: any) => {
        const primary = String(c.phone || "").trim();
        const alt = String(c.altPhone || "").trim();
        const parts = [c.name];
        if (primary) parts.push(`Ph: ${primary}`);
        if (alt) parts.push(`Alt: ${alt}`);
        return {
          value: c.id,
          label: parts.join(" | "),
          searchTerms: `${c.phone || ""} ${c.altPhone || ""} ${c.contactNumber3 || ""} ${c.area || ""}`,
        };
      }),
    [customersList]
  );

  const selectedCustomer = customersList.find(c => c.id === selectedCustomerId);

  // Load the selected customer's saved KYC ID proofs whenever the dialog is
  // open and the selection changes. Files live in IndexedDB (and are pulled
  // back from the Google Sheets chunk store on a fresh device), so metadata is
  // rendered immediately and each file fills in as it resolves. A load token
  // drops responses from a previous selection that land out of order.
  useEffect(() => {
    if (!open || isNewCustomer || !selectedCustomerId) {
      setExistingCustDocs([]);
      setIsLoadingCustDocs(false);
      return;
    }

    const loadToken = ++custDocLoadTokenRef.current;
    let metadata: any[] = [];
    try {
      metadata = getDocuments().filter(
        (d: any) => d.customerId === selectedCustomerId && d.type === "ID Proof"
      );
    } catch (err) {
      console.warn("Failed to read customer KYC documents:", err);
    }

    if (metadata.length === 0) {
      setExistingCustDocs([]);
      setIsLoadingCustDocs(false);
      return;
    }

    // This effect re-runs on every database update, so already-resolved files
    // are carried over instead of being re-fetched — otherwise saving anything
    // else while the form is open would blank the thumbnails and pull every
    // file back out of IndexedDB (or off Google Sheets) again.
    const resolved = resolvedCustDocsRef.current;
    setExistingCustDocs(
      metadata.map((d: any) => ({ id: d.id, name: d.name, size: d.size, ...(resolved.get(d.id) || {}) }))
    );

    const pending = metadata.filter((d: any) => !resolved.has(d.id));
    if (pending.length === 0) {
      setIsLoadingCustDocs(false);
      return;
    }
    setIsLoadingCustDocs(true);

    Promise.all(
      // One unreadable file must not blank the whole list — fall back to
      // metadata-only so the document is still visible as "file unavailable".
      pending.map((d: any) => getDocumentWithFile(d).catch(() => ({ ...d, fileData: "NOT_FOUND" })))
    )
      .then((fullDocs: any[]) => {
        fullDocs.forEach((d) => {
          resolved.set(d.id, {
            fileData: d.fileData !== "NOT_FOUND" ? d.fileData : undefined,
            missing: d.fileData === "NOT_FOUND",
          });
        });
        if (custDocLoadTokenRef.current !== loadToken) return;
        setExistingCustDocs((prev) =>
          prev.map((doc) => ({ ...doc, ...(resolved.get(doc.id) || {}) }))
        );
      })
      .catch((err: any) => console.warn("Failed to load customer KYC documents:", err))
      .finally(() => {
        if (custDocLoadTokenRef.current === loadToken) setIsLoadingCustDocs(false);
      });
  }, [open, isNewCustomer, selectedCustomerId, docsRefresh]);

  const getAutoSelectItems = (eqName: string, eqCategory: string, eqModel?: string): string[] => {
    const fullStr = `${eqName || ""} ${eqCategory || ""} ${eqModel || ""}`.toLowerCase().trim();

    const matches = (keywords: string[]) => 
      keywords.some(k => fullStr.includes(k.toLowerCase().trim()));

    const result: string[] = [];

    // 1. Oxygen Concentrator 5LP & 10LPM -> Humidifier bottle, Oxygen Nasal Cannula
    if (matches(["5lp", "5l", "10lpm", "10l", "concentrator", "oxygen"])) {
      result.push("Humidifier Bottle", "Oxygen Nasal Cannula");
    }
    // 2. Bipap Machine & Auto CPAP Machine -> Bipap Mask, Bipap Hose Pipe
    if (matches(["bipap", "cpap", "auto cpap", "bi-pap", "c-pap"])) {
      result.push("Bipap Mask", "Bipap Hose Pipe");
    }
    // 3. Surgical Cot With Mattress & Foldable Wheel Chair -> One side transport, Another side transport
    if (matches(["cot", "mattress", "wheel chair", "wheelchair", "surgical cot", "foldable wheel"])) {
      result.push("One Side Transport", "Another Side Transport");
    }
    // 4. Patient Monitor, Syringe Pump, Infusion Pump, Nebulizer, Patient Ventilator -> Installation charge
    if (matches(["monitor", "syringe", "infusion", "nebulizer", "ventilator"])) {
      result.push("Installation Charge");
    }
    return result;
  };

  const getNeededAutoItemsForEquipments = (eqs: any[]): Set<string> => {
    const needed = new Set<string>();
    if (!eqs || !Array.isArray(eqs)) return needed;
    eqs.forEach(eqItem => {
      if (!eqItem) return;
      const itemEq = equipmentList.find(e => 
        (eqItem.equipmentId && e.id === eqItem.equipmentId) || 
        (eqItem.serial && e.serial && String(e.serial).toLowerCase().trim() === String(eqItem.serial || "").toLowerCase().trim())
      );
      if (itemEq) {
        const autoItems = getAutoSelectItems(itemEq.name || "", itemEq.category || "", (itemEq as any).model || "");
        autoItems.forEach(item => needed.add(item.toLowerCase().trim()));
      }
    });
    return needed;
  };

  const syncAdditionalItemsWithEquipments = (eqs: any[]) => {
    const currentNeededAutoItems = getNeededAutoItemsForEquipments(eqs);

    const autoSelectableChecklist = [
      "humidifier bottle", 
      "oxygen nasal cannula", 
      "bipap mask", 
      "bipap hose pipe", 
      "one side transport", 
      "another side transport", 
      "installation charge"
    ];

    const prevNeeded = prevNeededAutoItemsRef.current;

    const newlyNeeded = new Set<string>();
    currentNeededAutoItems.forEach(item => {
      if (!prevNeeded.has(item)) {
        newlyNeeded.add(item);
      }
    });

    const noLongerNeeded = new Set<string>();
    prevNeeded.forEach(item => {
      if (!currentNeededAutoItems.has(item)) {
        noLongerNeeded.add(item);
      }
    });

    // Update reference to current needed set
    prevNeededAutoItemsRef.current = currentNeededAutoItems;

    // If auto-item requirements haven't changed, preserve user's manual selection/deselection
    if (newlyNeeded.size === 0 && noLongerNeeded.size === 0) {
      return;
    }

    setAdditionalItems(prev => {
      const updated = prev.map(item => {
        const itemNorm = (item.name || "").toLowerCase().trim();
        if (autoSelectableChecklist.includes(itemNorm)) {
          if (newlyNeeded.has(itemNorm)) {
            return { ...item, selected: true };
          }
          if (noLongerNeeded.has(itemNorm)) {
            return { ...item, selected: false };
          }
        }
        return item;
      });

      // Defer updating calculated charges to avoid stale state in one cycle
      setTimeout(() => {
        updateCalculatedCharges(updated);
      }, 0);
      return updated;
    });
  };

  const equipmentsKey = selectedEquipments.map(e => `${e.equipmentId}_${e.serial}`).join("|");

  useEffect(() => {
    if (open) {
      syncAdditionalItemsWithEquipments(selectedEquipments);
    }
  }, [open, equipmentsKey, equipmentList]);

  // Bug 8/9 fix: Handle scanned QR/barcode — fill serial, auto-match equipment, add next row
  const handleQrScanSuccess = (scannedText: string) => {
    const targetIdx = scannerTargetIdx;
    setScannerTargetIdx(null);
    setIsScannerOpen(false);

    const newEquipments = [...selectedEquipments];
    const row = newEquipments[targetIdx ?? 0];
    if (!row) return;

    // Try to find equipment by serial number
    const eq = equipmentList.find(eItem => {
      const s = String(eItem.serial || "").trim().toLowerCase();
      return s !== "" && s === scannedText.trim().toLowerCase();
    });

    if (eq) {
      const isAvailable = eq.status === "Available" || row.equipmentId === eq.id || rental?.equipmentItems?.some((ri: any) => ri.equipmentId === eq.id);
      if (isAvailable) {
        row.equipmentId = eq.id;
        row.serial = eq.serial;
        row.model = eq.model || "";            // ITEM-7
        row.equipment = eq.name || eq.category || "";
        toast.success(`Equipment scanned: ${formatEquipmentLabel(eq)}`);
      } else {
        row.serial = scannedText;
        toast.warning(`Equipment "${eq.name}" is currently "${eq.status}" — serial filled but equipment not selected.`);
      }
    } else {
      row.serial = scannedText;
      toast.info(`Serial "${scannedText}" filled — select the equipment from the dropdown.`);
    }

    setSelectedEquipments(newEquipments);
    syncAdditionalItemsWithEquipments(newEquipments);

    // Bug 9 fix: If row already had equipment, add a new empty row for next scan
    const rowWasAlreadyFilled = eq && row.equipmentId && row.equipmentId !== eq.id;
    if (rowWasAlreadyFilled) {
      setSelectedEquipments(prev => [...prev, { equipmentId: "", serial: "", rentCycle: "Monthly", rentRate: "", monthlyRent: "", dailyRent: "", deposit: "" }]);
    }
  };

  const handleBulkScanSuccess = (scannedText: string) => {
    const term = scannedText.trim().toLowerCase();
    if (!term) return;

    const eq = equipmentList.find(eItem => {
      const s = String(eItem.serial || "").trim().toLowerCase();
      return s !== "" && s === term;
    });

    if (!eq) {
      toast.error(`Equipment with serial "${scannedText}" not found in database.`);
      return;
    }

    const isAvailable = eq.status === "Available" || rental?.equipmentItems?.some((ri: any) => ri.equipmentId === eq.id);
    if (!isAvailable) {
      toast.warning(`Equipment "${eq.name}" (${eq.serial}) is currently "${eq.status}" and cannot be rented.`);
      return;
    }

    const isAlreadyAdded = selectedEquipments.some(item => item.equipmentId === eq.id);
    if (isAlreadyAdded) {
      toast.info(`Equipment "${eq.name}" (${eq.serial}) is already in the list.`);
      return;
    }

    setSelectedEquipments(prev => {
      const updated = [...prev];
      const newItem = {
        equipmentId: eq.id,
        serial: eq.serial || "",
        model: eq.model || "",                 // ITEM-7
        equipment: eq.name || eq.category || "",
        rentCycle: "Monthly",
        rentRate: (eq.monthlyRent || eq.rentRate || 0).toString(),
        monthlyRent: (eq.monthlyRent || eq.rentRate || 0).toString(),
        dailyRent: (eq.dailyRent || Math.round((eq.monthlyRent || eq.rentRate || 0) / 30)).toString(),
        deposit: (eq.deposit || 0).toString(),
      };
      
      if (updated.length === 1 && updated[0].equipmentId === "") {
        updated[0] = newItem;
      } else {
        updated.push(newItem);
      }
      toast.success(`Added: ${formatEquipmentLabel(eq)}`);
      setTimeout(() => {
        syncAdditionalItemsWithEquipments(updated);
      }, 0);
      return updated;
    });
  };

  const handleDeliveryPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setDeliveryPhotos((prev) => [
          ...prev,
          {
            url: reader.result as string,
            name: file.name,
            size: `${(file.size / 1024).toFixed(1)} KB`,
          },
        ]);
        setIsDeliveryPhotoChanged(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignedDoc = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSignedDocName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSignedDocUrl(reader.result as string);
        setIsSignedDocChanged(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCaptureLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }
    setIsCapturingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        let address = `GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
          if (res.ok) {
            const data = await res.json();
            if (data && data.display_name) {
              address = data.display_name;
            }
          }
        } catch (e) {
          // ignore lookup error and retain exact GPS coordinates string
        }
        setCapturedLocation({
          latitude,
          longitude,
          accuracy,
          address,
          timestamp: new Date().toLocaleString(),
        });
        setIsLocationChanged(true);
        setIsCapturingLocation(false);
        toast.success("Current location details captured!");
      },
      (error) => {
        console.error(error);
        setIsCapturingLocation(false);
        toast.error(`Location capture failed: ${error.message}`);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const totalDepositVal = selectedEquipments.reduce((sum, item) => sum + (Number(item.deposit) || 0), 0);
  const totalMonthlyRentVal = selectedEquipments.reduce((sum, item) => sum + (Number(item.monthlyRent) || 0), 0);
  const totalDays = durationDetails?.totalDays || 30;
  const isOngoing = !endDate;
  const totalRentVal = selectedEquipments.reduce((sum, item) => {
    if (item.rentCycle === "Monthly") {
      return sum + (Number(item.monthlyRent) || 0);
    } else {
      if (isOngoing) {
        return sum + (Number(item.dailyRent) || 0); // Exactly 1 day upfront rate for daily cycle
      } else {
        return sum + (totalDays * (Number(item.dailyRent) || 0));
      }
    }
  }, 0);
  const totalSerialsVal = selectedEquipments.map(item => item.serial || "XXXX").join(", ");
  const totalNamesVal = selectedEquipments.map(item => equipmentList.find(e => e.id === item.equipmentId)?.name || "Unknown").join(", ");

  const rentToAdd = Number(rentPaidAmount) || 0;
  const depositToAdd = depositPaymentStatus === "Paid" ? totalDepositVal : (depositPaymentStatus === "Partial" ? (Number(depositPaidAmount) || 0) : 0);

  // Each selected additional item individually
  const selectedAdditionalItems = additionalItems.filter(i => i.selected);
  const additionalItemsTotal = selectedAdditionalItems.reduce((sum, i) => sum + (i.status === "Free of Cost" ? 0 : i.amount), 0);
  const additionalItemsCollectedTotal = selectedAdditionalItems.reduce((sum, i) => sum + (i.status === "Paid" ? i.amount : 0), 0);

  // ITEM-14: the discount applies to the rent line only (a deposit is refundable
  // and accessories are billed at cost), and can never exceed the rent itself.
  const rentalDiscountInput = Number(rentalDiscount) || 0;
  const rentalDiscountVal = Math.min(
    totalRentVal,
    Math.max(
      0,
      rentalDiscountMode === "percent"
        ? Math.round((totalRentVal * Math.min(100, rentalDiscountInput)) / 100)
        : rentalDiscountInput
    )
  );
  const netRentVal = Math.max(0, totalRentVal - rentalDiscountVal);

  const totalCharges = netRentVal + totalDepositVal + additionalItemsTotal;
  const totalUpfrontPaid = rentToAdd + depositToAdd + additionalItemsCollectedTotal;

  // Payment split display
  const cashAmt = Number(cashPaidAmount) || 0;
  const bankAmt = Number(bankUpiPaidAmount) || 0;
  const splitTotal = cashAmt + bankAmt;
  const splitMismatch = paymentMode === "Cash+Bank" && splitTotal !== totalUpfrontPaid && splitTotal > 0;

  const handleSave = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
    let customerId = selectedCustomerId;
    let customerName = selectedCustomer?.name || "";

    const startD = parseLocalDate(agreementDate);
    // Bug 3 fix: End date is optional — only validate if provided
    if (endDate) {
      const endD = parseLocalDate(endDate);
      if (!isNaN(startD.getTime()) && !isNaN(endD.getTime()) && endD < startD) {
        toast.error("End date cannot be earlier than start date.");
        setIsSubmitting(false);
        return;
      }
    }

    if (isNewCustomer) {
      if (!custName) {
        toast.error("Please enter a customer name.");
        setIsSubmitting(false);
        return;
      }
      if (!custPhone) {
        toast.error("Please enter a customer phone number.");
        setIsSubmitting(false);
        return;
      }

      const isValidPhone = (p: string) => {
        const digits = p.replace(/\D/g, "");
        return digits.length === 10;
      };

      if (!isValidPhone(custPhone)) {
        toast.error("Customer Phone Number must be exactly 10 digits.");
        setIsSubmitting(false);
        return;
      }

      if (custAltPhone.trim() && !isValidPhone(custAltPhone)) {
        toast.error("Alternative Phone Number must be exactly 10 digits.");
        setIsSubmitting(false);
        return;
      }

      if (custContactNumber3.trim() && !isValidPhone(custContactNumber3)) {
        toast.error("Alternative Phone 1 must be exactly 10 digits.");
        setIsSubmitting(false);
        return;
      }

      if (custAadhaar.trim()) {
        const aadhaarDigits = custAadhaar.replace(/\D/g, "");
        if (aadhaarDigits.length !== 12) {
          toast.error("Aadhaar Number must be exactly 12 digits.");
          setIsSubmitting(false);
          return;
        }
      }
      if (!custCity) {
        toast.error("Please enter a customer city.");
        setIsSubmitting(false);
        return;
      }
      if (!custState) {
        toast.error("Please select a customer state.");
        setIsSubmitting(false);
        return;
      }

      // ITEM-4 / ITEM-15: a repeated name is fine - customers are identified by
      // their CUST-XXXX id and phone number. Only a phone number already on file
      // blocks, since that is a genuine second record for the same person.
      const normalizedName = custName.trim().toLowerCase();
      const existingCustomers = getCustomers();
      const phoneOwner = findPhoneOwner(custPhone);
      if (phoneOwner) {
        toast.error(
          `This phone number is already registered to "${phoneOwner.name}" (${phoneOwner.id}). Select them from the customer list instead of adding new.`
        );
        setIsSubmitting(false);
        return;
      }

      const nameTwin = existingCustomers.find(
        (c) => (c.name || "").trim().toLowerCase() === normalizedName
      );
      if (nameTwin) {
        toast.info(`Customer with this name already exists (${nameTwin.id}). Saving as a separate record.`);
      }

      // Create new customer
      const newCustId = getNextCustomerNumber();
      const newCust = {
        id: newCustId,
        name: custName,
        phone: custPhone || "+91 99999 99999",
        altPhone: custAltPhone,
        contactNumber3: custContactNumber3,
        email: custEmail,
        city: custCity,
        state: custState,
        pincode: custPincode,
        address: custAddress || "No address provided",
        area: custArea,
        aadhaar: custAadhaar,
        pan: custPan,
        rentals: 1,
        status: "Active" as const,
        notes: custNotes,
      };
      saveCustomer(newCust);
      customerId = newCustId;
      customerName = newCust.name;
    }

    if (!customerId) {
      toast.error("Please select or add a customer.");
      setIsSubmitting(false);
      return;
    }

    // Persist KYC ID proofs attached in this dialog. `custFiles` only ever
    // holds newly attached files (documents already on record are listed
    // separately as `existingCustDocs`), so this never duplicates them — and
    // it now covers existing customers too, not just newly created ones.
    if (custFiles.length > 0) {
      const kycCustomerId = customerId;
      custFiles.forEach((file) => {
        saveDocument({
          id: getNextDocumentNumber(),
          customerId: kycCustomerId,
          name: file.name,
          type: "ID Proof",
          size: file.size,
          date: agreementDate || getLocalYYYYMMDD(),
          fileData: file.fileData,
        });
      });
    }

    // Validate equipment entries
    const invalidEq = selectedEquipments.some(eq => !eq.equipmentId);
    if (invalidEq) {
      toast.error("Please select an equipment for all items.");
      setIsSubmitting(false);
      return;
    }

    const compiledEquipmentNames = selectedEquipments
      .map(item => equipmentList.find(e => e.id === item.equipmentId)?.name || "Unknown")
      .join(", ");
    
    const compiledSerials = selectedEquipments.map(item => item.serial || "XXXX").join(", ");
    const compiledIds = selectedEquipments.map(item => item.equipmentId).join(", ");
    
    const totalMonthlyRent = selectedEquipments.reduce((sum, item) => {
      const isMonthly = item.rentCycle === "Monthly";
      const rate = Number(item.rentRate) || 0;
      return sum + (isMonthly ? rate : 0);
    }, 0);
    const totalDailyRent = selectedEquipments.reduce((sum, item) => {
      const isMonthly = item.rentCycle === "Monthly";
      const rate = Number(item.rentRate) || 0;
      return sum + (isMonthly ? Math.round(rate / 30) : rate);
    }, 0);
    const totalDeposit = selectedEquipments.reduce((sum, item) => sum + (Number(item.deposit) || 0), 0);

    // Compute upfront charges total to auto-populate payment modes if purely Cash or Bank
    const rentToAdd = Number(rentPaidAmount) || 0;
    const depositToAdd = depositPaymentStatus === "Paid" ? totalDeposit : (depositPaymentStatus === "Partial" ? (Number(depositPaidAmount) || 0) : 0);
    const selectedAdditionalItems = additionalItems.filter(i => i.selected);
    const additionalItemsCollectedTotal = selectedAdditionalItems.reduce((sum, i) => sum + (i.status === "Paid" ? i.amount : 0), 0);
    const totalUpfrontPaid = rentToAdd + depositToAdd + additionalItemsCollectedTotal;

    let finalCashPaid = 0;
    let finalBankUpiPaid = 0;

    if (paymentMode === "Cash") {
      finalCashPaid = totalUpfrontPaid;
    } else if (paymentMode === "Bank") {
      finalBankUpiPaid = totalUpfrontPaid;
    } else if (paymentMode === "Cash+Bank") {
      finalCashPaid = Number(cashPaidAmount) || 0;
      finalBankUpiPaid = Number(bankUpiPaidAmount) || 0;
    }

    // For new rentals, consume the agreement number counter only at save time
    const finalAgreementId = rental ? agreementId : getNextAgreementNumber();
    if (!rental) setAgreementId(finalAgreementId);

    const hasDaily = selectedEquipments.some(e => e.rentCycle === "Daily");
    const primaryCycle = hasDaily ? "Daily" : "Monthly";

    const newRental = {
      id: finalAgreementId,
      // BUG-2 FIX: Use local `customerId` variable, not `selectedCustomerId` state.
      // For new customers, the state isn't updated yet at this point, so using the
      // state would result in customerId: undefined and an orphaned rental record.
      customerId: customerId,
      customer: isNewCustomer ? custName : selectedCustomer?.name || "",
      equipment: compiledEquipmentNames,
      model: rental?.model || "Standard",
      serial: compiledSerials,
      equipmentId: compiledIds,
      start: agreementDate,
      end: endDate,
      rentCycle: primaryCycle,
      monthlyRent: totalMonthlyRent,
      dailyRent: totalDailyRent,
      deposit: totalDeposit,
      deliveryCharges: Number(deliveryCharges) || 0,
      removalCharges: Number(removalCharges) || 0,
      installationCharges: Number(installationCharges) || 0,
      additionalCharges: Number(additionalCharges) || 0,
      remarks,
      consultingHospital,
      referredBy,
      status: rental ? (rental.status as any) : "Pending Approval",
      signatureUrl,
      thumbprintUrl,
      rentalPaymentStatus,
      depositPaymentStatus,
      rentPaidAmount: Number(rentPaidAmount) || 0,
      depositPaidAmount: Number(depositPaidAmount) || 0,
      cashPaidAmount: finalCashPaid,
      bankUpiPaidAmount: finalBankUpiPaid,
      paymentMode,
      paymentDate,
      paymentCollectedBy,
      additionalItems,
      rentalDuration: durationDetails.text,
      // ITEM-14: persist the discount and how it was expressed, so an
      // edit reopens with the same terms and the agreement/receipt can
      // print "was X, now Y".
      rentalDiscount: rentalDiscountVal,
      rentalDiscountMode,
      netRent: netRentVal,
      totalRent: 0,
      latitude: capturedLocation?.latitude || null,
      longitude: capturedLocation?.longitude || null,
      locationAddress: capturedLocation?.address || null,
      locationAccuracy: capturedLocation?.accuracy || null,
      locationTimestamp: capturedLocation?.timestamp || null,
      totalInitialCharges: totalDeposit + (Number(deliveryCharges) || 0) + (Number(removalCharges) || 0) + (Number(installationCharges) || 0) + (Number(additionalCharges) || 0),
      equipmentItems: selectedEquipments.map(item => {
        const isMonthly = item.rentCycle === "Monthly";
        const rate = Number(item.rentRate) || 0;
        return {
          equipmentId: item.equipmentId,
          name: equipmentList.find(e => e.id === item.equipmentId)?.name || "Unknown",
          // ITEM-7: carry the model onto the saved line item so agreements,
          // receipts and return records can print Name - Model (S/N: Serial).
          model: item.model || equipmentList.find(e => e.id === item.equipmentId)?.model || "",
          serial: item.serial || "XXXX",
          rentCycle: item.rentCycle || "Monthly",
          monthlyRent: isMonthly ? rate : 0,
          dailyRent: !isMonthly ? rate : Math.round(rate / 30),
          deposit: Number(item.deposit) || 0,
          returned: false,
        };
      }),
    };

    saveRental(newRental);

    // Save Payment records in paymentsList for initial collected amounts (Rent & Deposit)
    // so they appear in Payments ledger, receipts, and revenue reports.
    if (!rental) {
      if (rentToAdd > 0) {
        savePayment({
          id: getNextPaymentNumber(),
          date: paymentDate || agreementDate || getLocalYYYYMMDD(),
          customer: isNewCustomer ? custName : selectedCustomer?.name || "",
          customerId: customerId,
          agreement: finalAgreementId,
          equipmentId: compiledIds,
          amount: rentToAdd,
          mode: paymentMode || "Cash",
          type: "Rent Payment",
          notes: `Advance rent payment collected at agreement creation (${finalAgreementId})`,
          status: "Paid" as const,
          collectedBy: paymentCollectedBy || "Admin",
        });
      }

      if (depositToAdd > 0) {
        savePayment({
          id: getNextPaymentNumber(),
          date: paymentDate || agreementDate || getLocalYYYYMMDD(),
          customer: isNewCustomer ? custName : selectedCustomer?.name || "",
          customerId: customerId,
          agreement: finalAgreementId,
          equipmentId: compiledIds,
          amount: depositToAdd,
          mode: paymentMode || "Cash",
          type: "Deposit",
          notes: `Security deposit collected at agreement creation (${finalAgreementId})`,
          status: "Paid" as const,
          collectedBy: paymentCollectedBy || "Admin",
        });
      }
    }

    // Save Signed Document if present — reuse the existing doc id when
    // replacing so it updates in place instead of leaving an orphaned record.
    if (signedDocUrl && signedDocName && (!rental || isSignedDocChanged)) {
      const docId = existingSignedDocId || getNextDocumentNumber();
      saveDocument({
        id: docId,
        customerId: customerId,
        rentalId: finalAgreementId,
        name: signedDocName,
        type: "Signed Agreement",
        size: signedDocUrl === "PDF" ? "N/A" : `${(signedDocUrl.length / 1024 * 0.75).toFixed(1)} KB`,
        date: agreementDate,
        fileData: signedDocUrl,
      });
    }

    // Save Delivery Photos if present
    if (deliveryPhotos.length > 0 && (!rental || isDeliveryPhotoChanged)) {
      deliveryPhotos.forEach((photo, i) => {
        if (!photo.id) {
          const docId = getNextDocumentNumber();
          saveDocument({
            id: docId,
            customerId: customerId,
            rentalId: finalAgreementId,
            name: photo.name || `Delivery_Photo_${finalAgreementId}_${i + 1}.jpg`,
            type: "Delivery Photo",
            size: photo.size || `${(photo.url.length / 1024 * 0.75).toFixed(1)} KB`,
            date: agreementDate,
            fileData: photo.url,
          });
        }
      });
    }
    // Remove delivery photos the user deleted from the capture dialog
    if (isDeliveryPhotoChanged) {
      const keptIds = new Set(deliveryPhotos.map((p) => p.id).filter(Boolean));
      initialDeliveryPhotoIds.forEach((docId) => {
        if (!keptIds.has(docId)) deleteDocument(docId);
      });
    }

    // Save Location Tag if present — reuse the existing doc id when
    // replacing so it updates in place instead of leaving an orphaned record.
    if (capturedLocation && (!rental || isLocationChanged)) {
      const docId = existingLocationDocId || getNextDocumentNumber();
      const locationText = `Latitude: ${capturedLocation.latitude}\nLongitude: ${capturedLocation.longitude}\nAccuracy: ${capturedLocation.accuracy || "N/A"}m\nAddress: ${capturedLocation.address}\nTimestamp: ${capturedLocation.timestamp}`;
      // BUG-3 FIX: btoa() throws InvalidCharacterError on non-Latin1 characters
      // (e.g. Hindi/Kannada place names returned by Nominatim geocoding).
      // Use encodeURIComponent-based URI data instead, which is universally safe.
      let locationFileData: string;
      try {
        // Try safe btoa — only works for pure ASCII/Latin-1
        locationFileData = "data:text/plain;base64," + btoa(unescape(encodeURIComponent(locationText)));
      } catch {
        // Fallback: store as plain text data URI (no base64 encoding needed)
        locationFileData = "data:text/plain;charset=utf-8," + encodeURIComponent(locationText);
      }
      saveDocument({
        id: docId,
        customerId: customerId,
        rentalId: finalAgreementId,
        name: `Location_Tag_${finalAgreementId}.txt`,
        type: "Location Tag",
        size: `${(locationText.length / 1024).toFixed(2)} KB`,
        date: agreementDate,
        fileData: locationFileData,
      });
    }

    // Persist Digital Signature as a document so it survives Google Sheets
    // sync truncation of the rental object's inline signatureUrl field.
    if (signatureUrl) {
      const existingDocs = getDocuments();
      const existingSigDoc = existingDocs.find((d: any) => d.rentalId === finalAgreementId && d.type === "Digital Signature");
      const sigDocId = existingSigDoc?.id || getNextDocumentNumber();
      saveDocument({
        id: sigDocId,
        customerId: customerId,
        rentalId: finalAgreementId,
        name: `Signature_${finalAgreementId}.png`,
        type: "Digital Signature",
        size: `${(signatureUrl.length / 1024 * 0.75).toFixed(1)} KB`,
        date: agreementDate,
        fileData: signatureUrl,
      });
    }

    // Persist Thumbprint Scan as a document (same resilience rationale).
    if (thumbprintUrl) {
      const existingDocs = getDocuments();
      const existingTpDoc = existingDocs.find((d: any) => d.rentalId === finalAgreementId && d.type === "Thumbprint Scan");
      const tpDocId = existingTpDoc?.id || getNextDocumentNumber();
      saveDocument({
        id: tpDocId,
        customerId: customerId,
        rentalId: finalAgreementId,
        name: `Thumbprint_${finalAgreementId}.png`,
        type: "Thumbprint Scan",
        size: `${(thumbprintUrl.length / 1024 * 0.75).toFixed(1)} KB`,
        date: agreementDate,
        fileData: thumbprintUrl,
      });
    }

        toast.success(rental ? `Agreement details for "${agreementId}" updated successfully.` : "New rental agreement saved successfully.");
    setOpen(false);
    if (onClose) onClose();
    if (onSave) onSave();
    } catch (error) {
      console.error("[Save Agreement] Failed:", error);
      // Only show generic error toast if it's not a quota error
      // (setStorageItem already shows a specific toast for quota errors)
      const isQuota = error instanceof DOMException && (
        error.name === "QuotaExceededError" ||
        error.code === 22 ||
        error.code === 1014
      );
      if (!isQuota) {
        toast.error("Failed to save the agreement. Please try again. If the problem persists, export your data from Settings and contact support.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

    return (
    <div className="space-y-4 animate-[fade-in_0.3s_ease-out]">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-border bg-gradient-to-r from-muted/30 via-background to-muted/20 px-4 py-3 rounded-xl border">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0 border border-primary/20">
            <PenTool className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-foreground leading-tight">{title}</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Process and register rental agreement details</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onClose} className="h-8.5 text-xs font-semibold gap-1.5 shadow-sm">
          <X className="h-3.5 w-3.5 text-muted-foreground" /> Back to Rentals
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 mt-4 items-start relative">
        {/* Left Column: Scrollable Form */}
        <div className="flex-1 space-y-4">
            {hasDraft && (
              <div className="flex items-center justify-between bg-primary/10 border border-primary/20 text-primary p-3 rounded-lg text-xs font-semibold mb-2">
                <span>We found a saved draft. Would you like to restore your progress?</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="h-7 text-[11px] bg-background text-primary border-primary/20 hover:bg-primary/5" onClick={handleRestoreDraft}>
                    Restore Draft
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-[11px] text-muted-foreground hover:text-destructive" onClick={handleDiscardDraft}>
                    Discard
                  </Button>
                </div>
              </div>
            )}

            <div className="grid gap-4 py-2 sm:grid-cols-2">
              {/* Agreement Info & Dates */}
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Agreement Number (Auto-Generated)</Label>
                <Input
                  placeholder="Auto-generated"
                  value={agreementId}
                  readOnly
                  className="bg-muted/30 cursor-not-allowed font-mono font-bold text-primary"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Agreement Date (Rent Start Date)</Label>
                <Input type="date" value={agreementDate} max={endDate} onChange={(e) => setAgreementDate(e.target.value)} />
              </div>

              {/* Customer Selection or Creation */}
              <div className="space-y-1.5 sm:col-span-2 rounded-lg border border-border/60 bg-muted/20 p-3 mb-2">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {isNewCustomer ? "New Customer Details" : "Customer Selection"}
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[11px] text-primary hover:bg-primary/10 px-2"
                    onClick={(e) => { e.preventDefault(); setIsNewCustomer(!isNewCustomer); }}
                  >
                    {isNewCustomer ? "Choose Existing Customer" : "+ Add New Customer"}
                  </Button>
                </div>
                
                {isNewCustomer ? (
                  <div className="grid gap-3 sm:grid-cols-2 mt-3 pt-3 border-t border-border/50">
                    <div className="sm:col-span-2 space-y-1.5">
                      <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Full Name *</Label>
                      <Input placeholder="Patient or guardian name" value={custName} onChange={(e) => setCustName(capitalizeWords(e.target.value))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Address</Label>
                      <Input placeholder="Full address" value={custAddress} onChange={(e) => setCustAddress(capitalizeWords(e.target.value))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Area</Label>
                      <Input placeholder="Area / Locality" value={custArea} onChange={(e) => setCustArea(capitalizeWords(e.target.value))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">City</Label>
                      <Input value={custCity} onChange={(e) => setCustCity(capitalizeWords(e.target.value))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">State</Label>
                      <Select value={custState} onValueChange={setCustState}>
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          {["Karnataka"].map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Pincode</Label>
                      <Input value={custPincode} onChange={(e) => setCustPincode(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Primary Number *</Label>
                      <Input 
                        placeholder="10-digit phone number" 
                        value={custPhone} 
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, "");
                          if (digits.length > 10) {
                            if (digits.startsWith("91")) setCustPhone(digits.slice(-10));
                            else if (digits.startsWith("0")) setCustPhone(digits.slice(-10));
                            else setCustPhone(digits.slice(0, 10));
                          } else {
                            setCustPhone(digits);
                          }
                        }} 
                        maxLength={14}
                      />
                      {custPhoneOwner && (
                        <p className="flex items-start gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-500">
                          <AlertTriangle className="h-3 w-3 shrink-0 mt-[1px]" />
                          <span>Phone number already registered to {custPhoneOwner.name} ({custPhoneOwner.id})</span>
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Alternative Phone</Label>
                      <Input 
                        placeholder="optional (10 digits)" 
                        value={custAltPhone} 
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, "");
                          if (digits.length > 10) {
                             if (digits.startsWith("91")) setCustAltPhone(digits.slice(-10));
                             else if (digits.startsWith("0")) setCustAltPhone(digits.slice(-10));
                             else setCustAltPhone(digits.slice(0, 10));
                          } else {
                            setCustAltPhone(digits);
                          }
                        }} 
                        maxLength={14}
                      />
                      {custAltPhoneOwner && (
                        <p className="flex items-start gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-500">
                          <AlertTriangle className="h-3 w-3 shrink-0 mt-[1px]" />
                          <span>Phone number already registered to {custAltPhoneOwner.name} ({custAltPhoneOwner.id})</span>
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Alternative Phone 1</Label>
                      <Input 
                        placeholder="optional (10 digits)" 
                        value={custContactNumber3} 
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, "");
                          if (digits.length > 10) {
                             if (digits.startsWith("91")) setCustContactNumber3(digits.slice(-10));
                             else if (digits.startsWith("0")) setCustContactNumber3(digits.slice(-10));
                             else setCustContactNumber3(digits.slice(0, 10));
                          } else {
                            setCustContactNumber3(digits);
                          }
                        }} 
                        maxLength={14}
                      />
                      {custContact3Owner && (
                        <p className="flex items-start gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-500">
                          <AlertTriangle className="h-3 w-3 shrink-0 mt-[1px]" />
                          <span>Phone number already registered to {custContact3Owner.name} ({custContact3Owner.id})</span>
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Email</Label>
                      <Input placeholder="email@domain.com" value={custEmail} onChange={(e) => setCustEmail(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Aadhaar Number</Label>
                      <Input 
                        placeholder="12-digit Aadhaar number" 
                        value={custAadhaar} 
                        onChange={(e) => setCustAadhaar(e.target.value.replace(/\D/g, "").slice(0, 12))} 
                        maxLength={12}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">PAN Number</Label>
                      <Input placeholder="ABCDE1234F" value={custPan} onChange={(e) => setCustPan(e.target.value)} />
                    </div>
                    <div className="sm:col-span-2 space-y-1.5">
                      <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                        <span>ID Proof Upload</span>
                        {custFiles.length > 0 && <span className="text-primary font-bold">({custFiles.length} file{custFiles.length === 1 ? "" : "s"})</span>}
                      </Label>
                      <CustomerIDProofDialog
                        initialFiles={custFiles}
                        onSave={(files) => {
                          setCustFiles(files);
                        }}
                        trigger={
                          <div className="border-2 border-dashed border-border/60 hover:bg-muted/10 transition-colors rounded-xl p-3 text-center cursor-pointer flex flex-col items-center justify-center min-h-[70px] bg-background/50">
                            {custFiles.length > 0 ? (
                              <div>
                                <p className="text-[12px] font-bold text-primary truncate max-w-[280px]">{custFiles.length} ID Proof File{custFiles.length === 1 ? "" : "s"} Selected</p>
                                <p className="text-[10px] text-muted-foreground">{custFiles.map((f) => f.name).join(", ")} · Click to change/add</p>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center text-muted-foreground hover:text-primary transition-colors">
                                <FileUp className="h-5 w-5 mb-0.5 text-muted-foreground/60" />
                                <p className="text-[12px] font-semibold">Click to upload ID Proofs</p>
                                <p className="text-[10px] text-muted-foreground/80">Multiple Aadhaar, PAN, Photo — PDF or image files</p>
                              </div>
                            )}
                          </div>
                        }
                      />
                    </div>
                    <div className="sm:col-span-2 space-y-1.5">
                      <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Notes</Label>
                      <Textarea placeholder="Any special notes about this customer…" className="resize-none min-h-[70px] bg-background" value={custNotes} onChange={(e) => setCustNotes(e.target.value)} />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Combobox
                      value={selectedCustomerId}
                      onValueChange={setSelectedCustomerId}
                      placeholder="Select existing customer"
                      searchPlaceholder="Search customer by name, ID or phone number..."
                      emptyText="No customer found."
                      options={customerOptions}
                    />
                    {selectedCustomer && (
                      <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2 rounded-lg border border-border/50 bg-background/50 p-4 mt-3">
                        <ReadOnlyField label="Full Name" value={selectedCustomer.name} />
                        <ReadOnlyField label="Primary Number" value={selectedCustomer.phone} />
                        <ReadOnlyField label="Alternative Phone" value={selectedCustomer.altPhone || "—"} />
                        <ReadOnlyField label="Alternative Phone 1" value={selectedCustomer.contactNumber3 || "—"} />
                        <ReadOnlyField label="Email" value={selectedCustomer.email || "—"} />
                        <ReadOnlyField label="Aadhaar Number" value={selectedCustomer.aadhaar || "—"} />
                        <ReadOnlyField label="PAN Number" value={selectedCustomer.pan || "—"} />
                        <ReadOnlyField label="Address" value={selectedCustomer.address} />
                        <ReadOnlyField label="Area" value={selectedCustomer.area || "—"} />
                        <ReadOnlyField label="City" value={selectedCustomer.city} />
                        <ReadOnlyField label="State" value={selectedCustomer.state} />
                        <ReadOnlyField label="Pincode" value={selectedCustomer.pincode} />
                        <ReadOnlyField label="Notes" value={selectedCustomer.notes || "—"} className="sm:col-span-2" />

                        {/* Uploaded KYC documents already on file for this
                            customer. Previously only the Documents page showed
                            these, so editing an agreement looked as if nothing
                            had ever been uploaded. */}
                        <div className="sm:col-span-2 space-y-1.5 border-t border-border/50 pt-3">
                          <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between gap-2">
                            <span className="flex items-center gap-1.5">
                              <FileCheck2 className="h-3.5 w-3.5 text-primary" /> Uploaded KYC Documents
                              {existingCustDocs.length > 0 && (
                                <span className="text-primary font-bold normal-case">({existingCustDocs.length})</span>
                              )}
                            </span>
                            {isLoadingCustDocs && (
                              <span className="text-[10px] font-medium normal-case text-muted-foreground">Loading files…</span>
                            )}
                          </Label>

                          {existingCustDocs.length === 0 ? (
                            <p className="text-[11px] text-muted-foreground italic">
                              No ID proof uploaded for this customer yet.
                            </p>
                          ) : (
                            <div className="grid gap-2 sm:grid-cols-2">
                              {existingCustDocs.map((doc) => {
                                const isImg = doc.fileData?.startsWith("data:image/") || /\.(jpg|jpeg|png|webp)$/i.test(doc.name);
                                return (
                                  <div
                                    key={doc.id}
                                    className="flex items-center gap-2 rounded-md border border-border/60 bg-background p-1.5 shadow-xs"
                                  >
                                    {isImg && doc.fileData ? (
                                      <img src={doc.fileData} alt={doc.name} className="h-9 w-9 rounded object-cover border shrink-0" />
                                    ) : (
                                      <div className="h-9 w-9 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                        <FileText className="h-4 w-4" />
                                      </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                      <p className="text-[11px] font-medium truncate text-foreground leading-tight" title={doc.name}>{doc.name}</p>
                                      <p className="text-[9px] text-muted-foreground">
                                        {doc.missing ? "File unavailable on this device" : doc.size}
                                      </p>
                                    </div>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 px-2 text-[10px] font-semibold text-primary hover:bg-primary/10 shrink-0"
                                      disabled={!doc.fileData}
                                      onClick={(e) => {
                                        e.preventDefault();
                                        if (doc.fileData) setPreviewCustDoc(doc);
                                      }}
                                    >
                                      View
                                    </Button>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          <CustomerIDProofDialog
                            initialFiles={custFiles}
                            onSave={(files) => setCustFiles(files)}
                            trigger={
                              <div className="border-2 border-dashed border-border/60 hover:bg-muted/10 transition-colors rounded-xl p-2.5 text-center cursor-pointer flex flex-col items-center justify-center min-h-[60px] bg-background/50">
                                {custFiles.length > 0 ? (
                                  <div>
                                    <p className="text-[12px] font-bold text-primary truncate max-w-[280px]">{custFiles.length} New ID Proof File{custFiles.length === 1 ? "" : "s"} — saved with this agreement</p>
                                    <p className="text-[10px] text-muted-foreground">{custFiles.map((f) => f.name).join(", ")} · Click to change/add</p>
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center text-muted-foreground hover:text-primary transition-colors">
                                    <FileUp className="h-4.5 w-4.5 mb-0.5 text-muted-foreground/60" />
                                    <p className="text-[12px] font-semibold">Click to upload more ID Proofs</p>
                                  </div>
                                )}
                              </div>
                            }
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Equipment Items Header & Add button */}
              <div className="sm:col-span-2 flex items-center justify-between border-b border-border pb-1.5 mt-2">
                <div className="flex flex-col">
                  <Label className="text-[11.5px] font-bold uppercase tracking-wider text-foreground">
                    Equipment Items Selection
                  </Label>
                </div>
                <div className="flex gap-2">
                  <EquipmentFormDialog
                    title="Register New Equipment"
                    trigger={
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        className="h-7 text-[11px] text-primary border-primary/20 hover:bg-primary/5 px-2"
                      >
                        <Plus className="mr-1.5 h-3.5 w-3.5" /> Register New Equipment
                      </Button>
                    }
                    onSave={(newEq) => {
                      const updatedList = getEquipment();
                      setEquipmentList(updatedList);
                      if (newEq) {
                        setSelectedEquipments(prev => {
                          const eqAny = newEq as any;
                          const defaultMonthly = (eqAny.monthlyRent || eqAny.rentRate || 0).toString();
                          const defaultDaily = (eqAny.dailyRent || (eqAny.monthlyRent ? Math.round(eqAny.monthlyRent / 30) : 0)).toString();
                          const defaultDeposit = (eqAny.deposit || 0).toString();

                          const newItem = {
                            equipmentId: newEq.id,
                            serial: newEq.serial || "",
                            rentCycle: "Monthly" as const,
                            rentRate: defaultMonthly !== "0" ? defaultMonthly : "",
                            monthlyRent: defaultMonthly !== "0" ? defaultMonthly : "",
                            dailyRent: defaultDaily !== "0" ? defaultDaily : "",
                            deposit: defaultDeposit !== "0" ? defaultDeposit : "",
                          };
                          const updated = (prev.length === 1 && !prev[0].equipmentId) ? [newItem] : [...prev, newItem];
                          setTimeout(() => {
                            syncAdditionalItemsWithEquipments(updated);
                          }, 0);
                          return updated;
                        });
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    className="h-7 text-[11px] text-primary border-primary/20 hover:bg-primary/5 px-2"
                    onClick={(e) => {
                      e.preventDefault();
                      const updated = [...selectedEquipments, { equipmentId: "", serial: "", rentCycle: "Monthly", rentRate: "", monthlyRent: "", dailyRent: "", deposit: "" }];
                      setSelectedEquipments(updated);
                      syncAdditionalItemsWithEquipments(updated);
                    }}
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" /> Add Equipment
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    className="h-7 text-[11px] text-primary border-primary/20 hover:bg-primary/5 px-2"
                    onClick={(e) => {
                      e.preventDefault();
                      setIsBulkScannerOpen(true);
                    }}
                  >
                    <QrCode className="mr-1 h-3.5 w-3.5" /> Scan Equipment
                  </Button>
                </div>
              </div>

              <div className="sm:col-span-2 space-y-4">
                {selectedEquipments.map((eqItem, idx) => {
                  const isSelectedElsewhere = (id: string) => selectedEquipments.some((item, i) => i !== idx && item.equipmentId === id);
                  const itemsForSelect = equipmentList.filter(e => 
                    (e.status === "Available" || e.id === eqItem.equipmentId || rental?.equipmentItems?.some((ri: any) => ri.equipmentId === e.id)) 
                    && !isSelectedElsewhere(e.id)
                  );

                  return (
                    <div key={idx} className="grid gap-3 sm:grid-cols-6 items-end p-3 rounded-lg border border-border bg-card/50 relative group">
                      {selectedEquipments.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          type="button"
                          className="absolute top-2 right-2 h-9 w-9 text-muted-foreground hover:text-destructive"
                          onClick={(e) => {
                            e.preventDefault();
                            const filtered = selectedEquipments.filter((_, i) => i !== idx);
                            setSelectedEquipments(filtered);
                            syncAdditionalItemsWithEquipments(filtered);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      
                      {/* Select Equipment */}
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Equipment</Label>
                        <Combobox
                          value={eqItem.equipmentId}
                          onValueChange={(val) => {
                            const newEquipments = [...selectedEquipments];
                            newEquipments[idx].equipmentId = val;
                            if (!val) {
                              newEquipments[idx].serial = "";
                              newEquipments[idx].model = "";
                              newEquipments[idx].equipment = "";
                              newEquipments[idx].monthlyRent = "";
                              newEquipments[idx].dailyRent = "";
                              newEquipments[idx].deposit = "";
                              newEquipments[idx].rentRate = "";
                            } else {
                              const eq = equipmentList.find(e => e.id === val);
                              if (eq) {
                                newEquipments[idx].serial = eq.serial || "";
                                newEquipments[idx].model = eq.model || "";
                                newEquipments[idx].owner = eq.owner || "";
                                newEquipments[idx].equipment = eq.name || eq.category || "";
                                const cycle = newEquipments[idx].rentCycle || "Monthly";
                                const defaultMonthly = (eq.monthlyRent || eq.rentRate || 0).toString();
                                const defaultDaily = (eq.dailyRent || (eq.monthlyRent ? Math.round(eq.monthlyRent / 30) : 0)).toString();
                                
                                newEquipments[idx].monthlyRent = defaultMonthly !== "0" ? defaultMonthly : "";
                                newEquipments[idx].dailyRent = defaultDaily !== "0" ? defaultDaily : "";
                                newEquipments[idx].deposit = (eq.deposit || 0).toString();
                                
                                if (cycle === "Daily") {
                                  newEquipments[idx].rentRate = defaultDaily !== "0" ? defaultDaily : (defaultMonthly !== "0" ? Math.round(Number(defaultMonthly) / 30).toString() : "");
                                } else {
                                  newEquipments[idx].rentRate = defaultMonthly !== "0" ? defaultMonthly : "";
                                }
                              }
                            }
                            setSelectedEquipments(newEquipments);
                            syncAdditionalItemsWithEquipments(newEquipments);
                          }}
                          placeholder="Select equipment"
                          searchPlaceholder="Search equipment by series number, name, owner..."
                          emptyText="No equipment found."
                          options={itemsForSelect.map((e) => ({
                            value: e.id,
                            label: formatEquipmentLabel({ name: e.name || e.category, serial: e.serial, model: e.model }),
                            selectedLabel: e.name || e.category,
                            searchTerms: `${e.serial || ""} ${e.name || ""} ${e.category || ""} ${e.model || ""} ${e.owner || ""}`,
                          }))}
                          className="h-9"
                        />
                      </div>

                      {/* Serial Number */}
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Serial Number</Label>
                        <Input 
                          placeholder="Type serial..." 
                          value={eqItem.serial || ""} 
                          onChange={(e) => {
                            const val = e.target.value;
                            
                            const newEquipments = selectedEquipments.map((item, i) => {
                              if (i === idx) {
                                const updated = { ...item, serial: val };
                                if (!val.trim()) {
                                  updated.equipmentId = "";
                                } else {
                                  const eq = equipmentList.find(eItem => {
                                    const s = String(eItem.serial || "").trim().toLowerCase();
                                    return s !== "" && s === val.trim().toLowerCase();
                                  });
                                  
                                  if (eq) {
                                    const isAvailable = eq.status === "Available" || eq.id === item.equipmentId || rental?.equipmentItems?.some((ri: any) => ri.equipmentId === eq.id);
                                    if (isAvailable) {
                                      updated.equipmentId = eq.id;
                                      updated.serial = eq.serial;
                                      updated.model = eq.model || "";
                                      updated.owner = eq.owner || "";
                                      updated.equipment = eq.name || eq.category || "";
                                    } else {
                                      toast.warning(`Equipment with serial "${val}" is currently "${eq.status}"`);
                                    }
                                  }
                                }
                                return updated;
                              }
                              return item;
                            });
                            
                            setSelectedEquipments(newEquipments);
                            syncAdditionalItemsWithEquipments(newEquipments);
                          }}
                          className="h-9 font-mono text-[12px] w-full"
                        />
                      </div>

                      {/* Rent Cycle */}
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Rent Cycle</Label>
                        <Select
                          value={eqItem.rentCycle || "Monthly"}
                          onValueChange={(val: "Monthly" | "Daily") => {
                            const newEquipments = [...selectedEquipments];
                            newEquipments[idx].rentCycle = val;
                            const mRentNum = Number(newEquipments[idx].monthlyRent) || 0;
                            const dRentNum = Number(newEquipments[idx].dailyRent) || 0;
                            const currRate = Number(newEquipments[idx].rentRate) || 0;

                            if (val === "Monthly") {
                              const newM = mRentNum > 0 ? mRentNum : (dRentNum > 0 ? dRentNum * 30 : (currRate > 0 ? currRate * 30 : 0));
                              newEquipments[idx].rentRate = newM > 0 ? newM.toString() : "";
                              newEquipments[idx].monthlyRent = newEquipments[idx].rentRate;
                              newEquipments[idx].dailyRent = newM > 0 ? Math.round(newM / 30).toString() : "";
                            } else {
                              const newD = dRentNum > 0 ? dRentNum : (mRentNum > 0 ? Math.round(mRentNum / 30) : (currRate > 0 ? currRate : 0));
                              newEquipments[idx].rentRate = newD > 0 ? newD.toString() : "";
                              newEquipments[idx].dailyRent = newEquipments[idx].rentRate;
                              newEquipments[idx].monthlyRent = newD > 0 ? (newD * 30).toString() : "";
                            }
                            setSelectedEquipments(newEquipments);
                            if (agreementDate) {
                              const parts = agreementDate.split("-");
                              if (parts.length === 3) {
                                const year = parseInt(parts[0], 10);
                                const month = parseInt(parts[1], 10) - 1;
                                const day = parseInt(parts[2], 10);
                                if (val === "Daily") {
                                  setEndDate(getLocalYYYYMMDD(new Date(year, month, day)));
                                } else {
                                  setEndDate(getLocalYYYYMMDD(new Date(year, month + 1, day)));
                                }
                              }
                            }
                          }}
                        >
                          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Monthly">Monthly</SelectItem>
                            <SelectItem value="Daily">Daily</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Rent Rate */}
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {eqItem.rentCycle === "Daily" ? "Daily Rent (₹)" : "Monthly Rent (₹)"}
                        </Label>
                        <Input 
                          placeholder={eqItem.rentCycle === "Daily" ? "e.g. 120" : "e.g. 3500"} 
                          value={eqItem.rentRate || ""} 
                          className="h-9"
                          onChange={(e) => {
                            const val = e.target.value;
                            const newEquipments = [...selectedEquipments];
                            newEquipments[idx].rentRate = val;
                            const numeric = Number(val);
                            if (!isNaN(numeric) && numeric > 0) {
                              if (newEquipments[idx].rentCycle === "Daily") {
                                newEquipments[idx].dailyRent = val;
                                newEquipments[idx].monthlyRent = (numeric * 30).toString();
                              } else {
                                newEquipments[idx].monthlyRent = val;
                                newEquipments[idx].dailyRent = Math.round(numeric / 30).toString();
                              }
                            }
                            setSelectedEquipments(newEquipments);
                          }}
                        />
                      </div>

                      {/* Security Deposit */}
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Deposit (₹)</Label>
                        <Input 
                          placeholder="e.g. 7000" 
                          value={eqItem.deposit} 
                          className="h-9"
                          onChange={(e) => {
                            const newEquipments = [...selectedEquipments];
                            newEquipments[idx].deposit = e.target.value;
                            setSelectedEquipments(newEquipments);
                          }}
                        />
                      </div>

                      {/* Selected Equipment Details Bar (Model Number, S/N, Owner Name) */}
                      {(() => {
                        const selectedEq = equipmentList.find(e => e.id === eqItem.equipmentId || (e.serial && e.serial === eqItem.serial));
                        const serialVal = eqItem.serial || selectedEq?.serial || "";
                        const modelVal = eqItem.model || selectedEq?.model || "";
                        const ownerVal = selectedEq?.owner || eqItem.owner || "";

                        if (!eqItem.equipmentId && !serialVal && !modelVal && !ownerVal) return null;

                        return (
                          <div className="sm:col-span-6 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[11.5px] bg-primary/5 border border-primary/15 rounded-lg px-3.5 py-2 mt-0.5 font-medium animate-[fade-in_0.2s_ease-out]">
                            <span className="text-foreground">
                              <span className="text-muted-foreground font-semibold">Model Number:</span> <span className="font-bold text-foreground bg-background px-2 py-0.5 rounded border border-border text-[11px]">{modelVal || "—"}</span>
                            </span>
                            <span className="text-foreground">
                              <span className="text-muted-foreground font-semibold">S/N:</span> <code className="font-bold text-primary font-mono bg-background px-2 py-0.5 rounded border border-primary/25 text-[11px]">{serialVal || "—"}</code>
                            </span>
                            <span className="text-foreground">
                              <span className="text-muted-foreground font-semibold">Owner Name:</span> <span className="font-bold text-foreground bg-background px-2 py-0.5 rounded border border-border text-[11px]">{ownerVal || "—"}</span>
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>

              {/* Predefined Additional Amount Checklist */}
              <div className="sm:col-span-2 space-y-3 rounded-xl border border-border/60 bg-muted/5 p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-1.5 border-b border-border/50 gap-2">
                  <Label className="text-[11.5px] font-bold uppercase tracking-wider text-foreground">
                    Additional Amount Items Checklist
                  </Label>
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-[11px] text-primary border-dashed border-primary/40 hover:border-primary hover:bg-primary/5 px-3"
                      onClick={(e) => {
                        e.preventDefault();
                        const newItems = [
                          {
                            id: `custom-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                            name: "",
                            amount: 0,
                            status: "Not Paid" as const,
                            selected: true,
                            isCustom: true
                          },
                          ...additionalItems
                        ];
                        setAdditionalItems(newItems);
                      }}
                    >
                      <Plus className="mr-1 h-3 w-3" /> Add Custom Item
                    </Button>
                    <span className="text-[10px] text-muted-foreground font-mono">Select to include item</span>
                  </div>
                </div>
                
                {/* Mobile Card List — Predefined Additional Amount Checklist */}
                <div className="md:hidden space-y-2.5 max-h-[420px] overflow-y-auto pr-0.5">
                  {additionalItems
                    .map((item, index) => ({ item, index }))
                    .sort((a, b) => {
                      if (a.item.isCustom && !b.item.isCustom) return -1;
                      if (!a.item.isCustom && b.item.isCustom) return 1;
                      if (a.item.selected && !b.item.selected) return -1;
                      if (!a.item.selected && b.item.selected) return 1;
                      return 0;
                    })
                    .map(({ item, index }) => (
                      <div
                        key={item.id || item.name || `mrow-${index}`}
                        className={`rounded-lg border shadow-soft p-3 flex flex-col gap-2.5 transition-colors ${item.selected ? 'bg-primary/5 border-primary/30' : 'bg-card border-border/60'}`}
                      >
                        <div className="flex items-center gap-2">
                          <label className="flex items-center justify-center h-9 w-9 -m-1 shrink-0 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={item.selected}
                              onChange={(e) => {
                                const newItems = [...additionalItems];
                                newItems[index].selected = e.target.checked;
                                setAdditionalItems(newItems);
                                updateCalculatedCharges(newItems, item.name);
                              }}
                              className="h-5 w-5 rounded border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                            />
                          </label>
                          {item.isCustom ? (
                            <div className="flex items-center gap-1.5 flex-1 min-w-0">
                              <Input
                                placeholder="Enter item name..."
                                value={item.name}
                                onChange={(e) => {
                                  const newItems = [...additionalItems];
                                  newItems[index].name = capitalizeWords(e.target.value);
                                  setAdditionalItems(newItems);
                                }}
                                className="h-9 text-[12.5px] p-2 flex-1 bg-background border-border/80 focus-visible:ring-primary/20"
                              />
                              <Button
                                size="icon"
                                variant="ghost"
                                type="button"
                                className="h-9 w-9 text-muted-foreground hover:text-destructive shrink-0"
                                onClick={(e) => {
                                  e.preventDefault();
                                  const newItems = additionalItems.filter((_, i) => i !== index);
                                  setAdditionalItems(newItems);
                                  updateCalculatedCharges(newItems);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <span className="font-medium text-foreground text-[13px] flex-1 min-w-0 truncate">{item.name}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 pl-9">
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] uppercase tracking-wide font-bold text-muted-foreground mb-1 block">Cost (₹)</span>
                            <Input
                              type="number"
                              disabled={!item.selected}
                              value={item.amount === 0 ? "" : item.amount}
                              onChange={(e) => {
                                const newItems = [...additionalItems];
                                newItems[index].amount = Number(e.target.value) || 0;
                                setAdditionalItems(newItems);
                                updateCalculatedCharges(newItems, item.name);
                              }}
                              className="h-9 text-[12.5px] p-2 bg-background disabled:opacity-50 disabled:bg-muted/30"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] uppercase tracking-wide font-bold text-muted-foreground mb-1 block">Status</span>
                            <Select
                              disabled={!item.selected}
                              value={item.status}
                              onValueChange={(val: any) => {
                                const newItems = [...additionalItems];
                                newItems[index].status = val;
                                setAdditionalItems(newItems);
                                updateCalculatedCharges(newItems, item.name);
                              }}
                            >
                              <SelectTrigger className="h-9 text-[12px] bg-background disabled:opacity-50 disabled:bg-muted/30">
                                <SelectValue placeholder="Status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Paid">Paid</SelectItem>
                                <SelectItem value="Not Paid">Not Paid</SelectItem>
                                <SelectItem value="Free of Cost">Free of Cost</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>

                <div className="hidden md:block rounded-lg border border-border/50 overflow-hidden bg-background">
                  <div className="max-h-[250px] overflow-y-auto">
                    <table className="w-full text-left text-[12.5px]">
                      <thead className="bg-muted/40 text-[10px] uppercase font-bold text-muted-foreground border-b border-border/50 sticky top-0">
                        <tr>
                          <th className="p-2.5 w-12 text-center">Use</th>
                          <th className="p-2.5">Item Name</th>
                          <th className="p-2.5 w-28 text-right">Cost (₹)</th>
                          <th className="p-2.5 w-36">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {additionalItems
                          .map((item, index) => ({ item, index }))
                          .sort((a, b) => {
                            if (a.item.isCustom && !b.item.isCustom) return -1;
                            if (!a.item.isCustom && b.item.isCustom) return 1;
                            if (a.item.selected && !b.item.selected) return -1;
                            if (!a.item.selected && b.item.selected) return 1;
                            return 0;
                          })
                          .map(({ item, index }) => (
                            <tr key={item.id || item.name || `row-${index}`} className={`hover:bg-muted/10 transition-colors ${item.selected ? 'bg-primary/5' : ''}`}>
                              <td className="p-2.5 text-center">
                                <input
                                  type="checkbox"
                                  checked={item.selected}
                                  onChange={(e) => {
                                    const newItems = [...additionalItems];
                                    newItems[index].selected = e.target.checked;
                                    setAdditionalItems(newItems);
                                    updateCalculatedCharges(newItems, item.name);
                                  }}
                                  className="h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                                />
                              </td>
                              <td className="p-2.5 font-medium text-foreground">
                                {item.isCustom ? (
                                  <div className="flex items-center gap-1.5 w-full">
                                    <Input
                                      placeholder="Enter item name..."
                                      value={item.name}
                                      onChange={(e) => {
                                        const newItems = [...additionalItems];
                                        newItems[index].name = capitalizeWords(e.target.value);
                                        setAdditionalItems(newItems);
                                      }}
                                      className="h-7 text-[12px] p-1.5 flex-1 bg-card border-border/80 focus-visible:ring-primary/20"
                                    />
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      type="button"
                                      className="h-9 w-9 text-muted-foreground hover:text-destructive shrink-0"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        const newItems = additionalItems.filter((_, i) => i !== index);
                                        setAdditionalItems(newItems);
                                        updateCalculatedCharges(newItems);
                                      }}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                ) : (
                                  item.name
                                )}
                              </td>
                              <td className="p-2.5 text-right">
                                <Input
                                  type="number"
                                  disabled={!item.selected}
                                  value={item.amount === 0 ? "" : item.amount}
                                  onChange={(e) => {
                                    const newItems = [...additionalItems];
                                    newItems[index].amount = Number(e.target.value) || 0;
                                    setAdditionalItems(newItems);
                                    updateCalculatedCharges(newItems, item.name);
                                  }}
                                  className="h-7 w-20 text-[12px] p-1.5 text-right ml-auto bg-card disabled:opacity-50 disabled:bg-muted/30"
                                />
                              </td>
                              <td className="p-2.5">
                                <Select
                                  disabled={!item.selected}
                                  value={item.status}
                                  onValueChange={(val: any) => {
                                    const newItems = [...additionalItems];
                                    newItems[index].status = val;
                                    setAdditionalItems(newItems);
                                    updateCalculatedCharges(newItems, item.name);
                                  }}
                                >
                                  <SelectTrigger className="h-7 text-[11px] bg-background disabled:opacity-50 disabled:bg-muted/30">
                                    <SelectValue placeholder="Status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Paid">Paid</SelectItem>
                                    <SelectItem value="Not Paid">Not Paid</SelectItem>
                                    <SelectItem value="Free of Cost">Free of Cost</SelectItem>
                                  </SelectContent>
                                </Select>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Commercial Payment Options (Global to Agreement) */}
              <div className="sm:col-span-2 grid gap-4 sm:grid-cols-2 items-end rounded-xl border border-border/60 bg-muted/10 p-4 animate-in fade-in duration-200">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Rent Payment Option</Label>
                  <Select value={rentalPaymentStatus} onValueChange={handleRentalPaymentStatusChange}>
                    <SelectTrigger className="bg-background h-10 text-[12.5px] border-border/50">
                      <SelectValue placeholder="Select Option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Paid">Paid</SelectItem>
                      <SelectItem value="Not Paid">Not Paid</SelectItem>
                      <SelectItem value="Partial">Partial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Deposit Payment Option</Label>
                  <Select value={depositPaymentStatus} onValueChange={handleDepositPaymentStatusChange}>
                    <SelectTrigger className="bg-background h-10 text-[12.5px] border-border/50">
                      <SelectValue placeholder="Select Option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Paid">Paid</SelectItem>
                      <SelectItem value="Not Paid">Not Paid</SelectItem>
                      <SelectItem value="Partial">Partial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Show rent paid amount only if status is Partial */}
                {rentalPaymentStatus === "Partial" && (
                  <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                    <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Rent Paid Amount (₹)</Label>
                    <Input type="number" placeholder="Enter amount" value={rentPaidAmount} onChange={(e) => handleRentPaidAmountChange(e.target.value)} className="bg-background h-10" />
                  </div>
                )}

                {/* Show deposit paid amount only if status is Partial */}
                {depositPaymentStatus === "Partial" && (
                  <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                    <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Deposit Paid Amount (₹)</Label>
                    <Input type="number" placeholder="Enter amount" value={depositPaidAmount} onChange={(e) => handleDepositPaidAmountChange(e.target.value)} className="bg-background h-10" />
                  </div>
                )}

                {(rentalPaymentStatus === "Paid" || rentalPaymentStatus === "Partial" || Number(rentPaidAmount) > 0 || depositPaymentStatus === "Paid" || depositPaymentStatus === "Partial" || Number(depositPaidAmount) > 0) && (
                  <>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Payment Mode</Label>
                      <Select value={paymentMode} onValueChange={(val: any) => setPaymentMode(val)}>
                        <SelectTrigger className="bg-background h-10 text-[12.5px] border-border/50">
                          <SelectValue placeholder="Select Mode" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Cash">Cash</SelectItem>
                          <SelectItem value="Bank">Bank</SelectItem>
                          <SelectItem value="Cash+Bank">Cash+Bank</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {paymentMode === "Cash+Bank" && (
                      <>
                        <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                          <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Cash Paid Amount (₹)</Label>
                          <Input
                            type="number"
                            placeholder="Cash amount"
                            value={cashPaidAmount}
                            onChange={(e) => setCashPaidAmount(e.target.value)}
                            className="bg-background h-10"
                          />
                        </div>
                        <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                          <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Bank/UPI Paid Amount (₹)</Label>
                          <Input
                            type="number"
                            placeholder="Bank/UPI amount"
                            value={bankUpiPaidAmount}
                            onChange={(e) => setBankUpiPaidAmount(e.target.value)}
                            className="bg-background h-10"
                          />
                        </div>
                      </>
                    )}
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Payment Date</Label>
                      <Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className="bg-background h-10" />
                    </div>
                  </>
                )}
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Installed By/Payment Collected by</Label>
                  <Input placeholder="Installer / Collector Name" value={paymentCollectedBy} onChange={(e) => setPaymentCollectedBy(capitalizeWords(e.target.value))} className="bg-background h-10" />
                </div>
              </div>

              {/* Hospital Name & Referred By */}
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Consulting Hospital Name</Label>
                <Input placeholder="e.g. Apollo Hospitals" value={consultingHospital} onChange={(e) => setConsultingHospital(capitalizeWords(e.target.value))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Referred By</Label>
                <Input placeholder="e.g. Dr. Sharma" value={referredBy} onChange={(e) => setReferredBy(capitalizeWords(e.target.value))} />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Remarks</Label>
                <Textarea
                  placeholder="Special delivery instructions, patient condition notes, etc."
                  className="resize-none min-h-[80px]"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </div>

              {/* Security & Verification */}
              <div className="sm:col-span-2 space-y-3 rounded-lg border border-border/60 bg-muted/10 p-4 mt-2">
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <h4 className="text-[13px] font-semibold text-foreground">Security & Verification</h4>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1 h-8">
                      <Fingerprint className="h-3.5 w-3.5" /> Thumbprint Scan
                    </Label>
                    <ThumbprintCaptureDialog
                      onSave={setThumbprintUrl}
                      trigger={
                        <div className="flex flex-col items-center justify-center border-2 border-dashed border-border/60 rounded-lg p-3 bg-background hover:bg-muted/30 transition-colors cursor-pointer h-24 overflow-hidden relative">
                          {thumbprintUrl ? (
                            <>
                              <img src={thumbprintUrl} alt="Thumbprint" className="h-full w-full object-contain bg-white rounded p-1" />
                              <div className="absolute inset-0 bg-background/80 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                                <span className="text-[10px] font-medium text-foreground">Click to re-scan</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <Fingerprint className="h-6 w-6 text-muted-foreground/50 mb-2" />
                              <span className="text-[10px] font-medium text-muted-foreground">Click to capture</span>
                            </>
                          )}
                        </div>
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1 h-8">
                      <PenTool className="h-3.5 w-3.5" /> Digital Signature
                    </Label>
                    <SignaturePadDialog
                      onSave={setSignatureUrl}
                      trigger={
                        <div className="flex flex-col items-center justify-center border-2 border-dashed border-border/60 rounded-lg p-3 bg-background hover:bg-muted/30 transition-colors cursor-pointer h-24 overflow-hidden relative">
                          {signatureUrl ? (
                            <>
                              <img src={signatureUrl} alt="Signature" className="h-full w-full object-contain bg-white rounded p-1" />
                              <div className="absolute inset-0 bg-background/80 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                                <span className="text-[10px] font-medium text-foreground">Click to re-sign</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <PenTool className="h-6 w-6 text-muted-foreground/50 mb-2" />
                              <span className="text-[10px] font-medium text-muted-foreground">Sign agreement</span>
                            </>
                          )}
                        </div>
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between h-8">
                      <span className="flex items-center gap-1">
                        <Camera className="h-3.5 w-3.5" /> Delivery Photo {deliveryPhotos.length > 0 && `(${deliveryPhotos.length})`}
                      </span>
                    </Label>
                    <DeliveryPhotoCaptureDialog
                      initialPhotos={deliveryPhotos}
                      onSave={(photos) => {
                        setDeliveryPhotos(photos);
                        setIsDeliveryPhotoChanged(true);
                      }}
                      trigger={
                        <div className="border-2 border-dashed border-border/60 bg-background rounded-lg h-24 overflow-hidden relative hover:bg-muted/10 transition-colors cursor-pointer flex flex-col items-center justify-center">
                          {deliveryPhotos.length > 0 ? (
                            <div className="w-full h-full flex flex-col items-center justify-center space-y-1 p-1">
                              <div className="flex items-center justify-center gap-1.5 max-w-full overflow-hidden">
                                {deliveryPhotos.slice(0, 3).map((photo, i) => {
                                  const isImg = photo.url.startsWith("data:image/") || /\.(jpg|jpeg|png|webp)$/i.test(photo.name);
                                  return (
                                    <div key={i} className="h-11 w-11 rounded overflow-hidden border border-border bg-muted/20 shrink-0">
                                      {isImg ? (
                                        <img src={photo.url} alt={`Delivery ${i}`} className="w-full h-full object-cover" />
                                      ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center p-0.5 text-[8px] text-primary bg-primary/10">
                                          <FileText className="h-4 w-4" />
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                              <p className="text-[10px] text-center text-primary font-bold">
                                {deliveryPhotos.length} File{deliveryPhotos.length === 1 ? "" : "s"} Attached · Click to manage
                              </p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center w-full h-full p-2 text-center">
                              <Camera className="h-6 w-6 text-muted-foreground/50 mb-1" />
                              <span className="text-[10px] font-semibold text-muted-foreground leading-tight">Take Photo / Upload</span>
                              <span className="text-[9px] text-muted-foreground/60 mt-0.5">Click to open & upload multiple</span>
                            </div>
                          )}
                        </div>
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1 h-8">
                      <FileUp className="h-3.5 w-3.5" /> Signed Document
                    </Label>
                    <SignedDocumentCaptureDialog
                      onSave={(url, name) => {
                        setSignedDocUrl(url);
                        setSignedDocName(name);
                        setIsSignedDocChanged(true);
                      }}
                      trigger={
                        <div className="border-2 border-dashed border-border/60 bg-background rounded-lg h-24 overflow-hidden relative hover:bg-muted/10 transition-colors cursor-pointer">
                          {signedDocUrl ? (
                            <div className="relative w-full h-full group bg-muted/20 flex items-center justify-center">
                              {signedDocUrl.startsWith("data:application/pdf") ||
                              signedDocUrl.startsWith("data:application/x-pdf") ||
                              signedDocUrl.startsWith("data:application/octet-stream") ||
                              signedDocUrl === "PDF" ||
                              (signedDocName && signedDocName.toLowerCase().endsWith(".pdf")) ? (
                                <div className="flex flex-col items-center justify-center w-full h-full p-2">
                                  <FileText className="h-8 w-8 text-primary mb-1" />
                                  <span className="text-[10px] font-bold text-primary truncate max-w-full px-2">{signedDocName || "PDF Uploaded"}</span>
                                </div>
                              ) : (
                                <img src={signedDocUrl} alt="Signed Doc" className="w-full h-full object-cover" />
                              )}
                              <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity">
                                <span className="text-[10px] font-bold text-foreground">Click to change</span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center w-full h-full p-2 text-center">
                              <FileUp className="h-6 w-6 text-muted-foreground/50 mb-1" />
                              <span className="text-[10px] font-semibold text-muted-foreground leading-tight">Upload PDF / Image</span>
                              <span className="text-[9px] text-muted-foreground/60 mt-0.5">Click anywhere to open</span>
                            </div>
                          )}
                        </div>
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1 h-8">
                      <MapPin className="h-3.5 w-3.5" /> Location Tag
                    </Label>
                    <Dialog open={isLocationDialogOpen} onOpenChange={setIsLocationDialogOpen}>
                      <DialogTrigger asChild>
                        <div className="flex flex-col items-center justify-center border-2 border-dashed border-border/60 rounded-lg p-2 bg-background hover:bg-muted/30 transition-colors cursor-pointer h-24 overflow-hidden relative text-center">
                          {capturedLocation ? (
                            <div className="flex flex-col items-center justify-center w-full h-full p-1">
                              <CheckCircle2 className="h-5 w-5 text-success mb-1" />
                              <span className="text-[9px] font-bold text-success">Location Tagged</span>
                              <span className="text-[8px] text-muted-foreground truncate w-full px-2" title={capturedLocation.address}>
                                {capturedLocation.latitude !== 0 ? `${capturedLocation.latitude.toFixed(4)}, ${capturedLocation.longitude.toFixed(4)}` : capturedLocation.address}
                              </span>
                            </div>
                          ) : (
                            <>
                              <MapPin className="h-6 w-6 text-muted-foreground/50 mb-1" />
                              <span className="text-[10px] font-medium text-muted-foreground leading-tight">
                                {isCapturingLocation ? "Tagging..." : "Tag Location"}
                              </span>
                            </>
                          )}
                        </div>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[420px] p-6">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2 text-[15px] font-bold"><MapPin className="h-4.5 w-4.5 text-primary" /> Location Tagging & Directions</DialogTitle>
                        </DialogHeader>
                        
                        <div className="space-y-4 py-3">
                          {capturedLocation && (
                            <div className="rounded-lg bg-muted/40 border border-border p-3.5 space-y-2 text-[12.5px]">
                              <p className="font-bold text-emerald-600 flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> Location Tagged</p>
                              {capturedLocation.latitude !== 0 || capturedLocation.longitude !== 0 ? (
                                <p className="font-mono text-[11px] text-muted-foreground">GPS Coordinates: {capturedLocation.latitude.toFixed(6)}, {capturedLocation.longitude.toFixed(6)}</p>
                              ) : null}
                              <p className="text-[11.5px] text-foreground/80 break-all font-medium">Address/Details: {capturedLocation.address}</p>
                              <p className="text-[9.5px] text-muted-foreground">Tagged at: {capturedLocation.timestamp}</p>
                              
                              <div className="flex gap-2 pt-1.5">
                                <Button 
                                  type="button" 
                                  variant="default" 
                                  size="sm" 
                                  className="w-full text-[11.5px] h-8 bg-emerald-600 hover:bg-emerald-700"
                                  onClick={() => {
                                    const url = getDirectionsUrl(capturedLocation.latitude, capturedLocation.longitude, capturedLocation.address);
                                    if (url) window.open(url, "_blank");
                                  }}
                                >
                                  Direct to Directions
                                </Button>
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  size="sm" 
                                  className="w-full text-destructive border-destructive/20 hover:bg-destructive/10 text-[11.5px] h-8"
                                  onClick={() => setCapturedLocation(null)}
                                >
                                  Remove Tag
                                </Button>
                              </div>
                            </div>
                          )}

                          <div className="space-y-3">
                            <p className="text-[12px] text-muted-foreground">Tag the location of this delivery/agreement:</p>
                            
                            <Button 
                              type="button" 
                              variant="outline" 
                              className="w-full h-9.5 text-[12px] font-bold border-primary/20 hover:bg-primary/5 hover:text-primary flex justify-center items-center"
                              disabled={isCapturingLocation}
                              onClick={() => {
                                handleCaptureLocation();
                                setIsLocationDialogOpen(false);
                              }}
                            >
                              <MapPin className="mr-2 h-4 w-4 shrink-0" />
                              {isCapturingLocation ? "Capturing Location..." : "Capture GPS Location Automatically"}
                            </Button>
                            
                            <div className="relative flex py-1 items-center">
                              <div className="flex-grow border-t border-border/60"></div>
                              <span className="flex-shrink mx-3 text-muted-foreground text-[9px] font-bold uppercase tracking-wider">or Enter Manually</span>
                              <div className="flex-grow border-t border-border/60"></div>
                            </div>

                            <div className="space-y-2">
                              <Label className="text-[11px] font-bold text-muted-foreground">Coordinates / Address</Label>
                              <Textarea 
                                placeholder="Enter coordinates or address..." 
                                value={manualLocationInput}
                                onChange={(e) => setManualLocationInput(e.target.value)}
                                className="text-[12px] min-h-[70px] bg-background border-border/70"
                              />
                              <Button 
                                type="button" 
                                className="w-full h-8.5 text-[11.5px] font-bold"
                                onClick={() => {
                                  if (!manualLocationInput.trim()) {
                                    toast.error("Please enter a link, coordinates, or address first.");
                                    return;
                                  }
                                  const parsed = parseManualLocationInput(manualLocationInput);
                                  setCapturedLocation({
                                    latitude: parsed.latitude,
                                    longitude: parsed.longitude,
                                    address: parsed.address,
                                    accuracy: 0,
                                    timestamp: new Date().toLocaleString()
                                  });
                                  setManualLocationInput("");
                                  setIsLocationDialogOpen(false);
                                  toast.success("Manual location tagged successfully!");
                                }}
                              >
                                Tag Manual Location
                              </Button>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  These verification methods add a layer of security to the rental agreement. At least one method is recommended.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Sticky Summary & Actions */}
          <div className="w-full lg:w-[340px] shrink-0 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-border pt-4 lg:pt-0 lg:pl-6 gap-4 min-h-0 lg:sticky lg:top-4 lg:self-start">
            {/* ITEM-11: pin the breakdown to the top of the summary column. The
                column scrolls independently (lg:overflow-y-auto), so once the
                agreement had a few accessories the Total Collected row slid out
                of view exactly when the operator needed to check it. */}
            <div className="rounded-xl border border-border/60 bg-muted/10 overflow-hidden lg:sticky lg:top-4 lg:z-10 lg:bg-card shadow-sm">
              <div className="px-4 py-2.5 border-b border-border/50 bg-muted/20">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Total Upfront Charges — Itemized Breakdown</span>
              </div>
              <table className="w-full text-[13px]">
                <tbody className="divide-y divide-border/40">
                  <tr>
                    <td className="px-4 py-2 text-muted-foreground">Rent ({rentalPaymentStatus})</td>
                    <td className="px-4 py-2 text-right font-semibold text-foreground">₹{totalRentVal.toLocaleString("en-IN")}</td>
                  </tr>
                  {/* ITEM-14: the negotiated reduction, shown on its own line so
                      the customer can see what the rent was before the discount. */}
                  {rentalDiscountVal > 0 && (
                    <tr>
                      <td className="px-4 py-2 text-emerald-700">
                        Rental Discount
                        {rentalDiscountMode === "percent" && (
                          <span className="ml-1 text-[10px] font-semibold text-muted-foreground">
                            ({Math.min(100, rentalDiscountInput)}%)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right font-semibold text-emerald-700">
                        − ₹{rentalDiscountVal.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td className="px-4 py-2 text-muted-foreground">Security Deposit ({depositPaymentStatus})</td>
                    <td className="px-4 py-2 text-right font-semibold text-foreground">₹{totalDepositVal.toLocaleString("en-IN")}</td>
                  </tr>
                  {selectedAdditionalItems.map((item, i) => (
                    <tr key={i}>
                      <td className="px-4 py-2 text-muted-foreground">{item.name} <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded font-semibold ${item.status === 'Paid' ? 'bg-success/10 text-success' : item.status === 'Free of Cost' ? 'bg-primary/10 text-primary' : 'bg-warning/10 text-warning-foreground'}`}>{item.status}</span></td>
                      <td className="px-4 py-2 text-right font-semibold text-foreground">{item.status === 'Free of Cost' ? <span className="text-primary">Free</span> : `₹${item.amount.toLocaleString('en-IN')}`}</td>
                    </tr>
                  ))}
                  <tr className="bg-muted/5">
                    <td className="px-4 py-2 text-muted-foreground font-semibold">Total Upfront Charges</td>
                    <td className="px-4 py-2 text-right font-bold text-foreground">₹{totalCharges.toLocaleString("en-IN")}</td>
                  </tr>
                  <tr className="bg-muted/30 font-bold">
                    <td className="px-4 py-2.5 text-foreground font-bold">Total Collected</td>
                    <td className="px-4 py-2.5 text-right text-primary font-display text-[15px]">₹{totalUpfrontPaid.toLocaleString("en-IN")}</td>
                  </tr>
                </tbody>
              </table>
              <div className="px-4 py-2 border-t border-border/50 text-[11px] text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                <div>Mode: <strong className="text-foreground">{String(paymentMode)}</strong></div>
                {paymentMode === "Cash+Bank" && (
                  <>
                    <div>Cash: <strong className="text-success">₹{cashAmt.toLocaleString("en-IN")}</strong></div>
                    <div>Bank/UPI: <strong className="text-primary">₹{bankAmt.toLocaleString("en-IN")}</strong></div>
                  </>
                )}
                {paymentCollectedBy && <div>Installed/Collected by: <strong className="text-foreground">{String(paymentCollectedBy)}</strong></div>}
              </div>
              {splitMismatch && (
                <div className="px-4 py-2 bg-destructive/10 text-destructive text-[11.5px] font-semibold border-t border-destructive/20 flex items-center gap-1">
                  ⚠️ Total cash + bank payments (₹{splitTotal.toLocaleString("en-IN")}) does not match total upfront charges (₹{totalUpfrontPaid.toLocaleString("en-IN")}).
                </div>
              )}
            </div>

            {/* Dialog Footer Actions */}
            <div className="flex flex-col gap-2 mt-auto border-t pt-4">
              <AgreementPreviewDialog
                rental={rental ? {
                  ...rental,
                  id: agreementId,
                  customer: isNewCustomer ? custName : (selectedCustomer?.name || ""),
                  equipment: totalNamesVal,
                  serial: totalSerialsVal,
                  deposit: totalDepositVal,
                  monthlyRent: totalMonthlyRentVal,
                  rentalPaymentStatus,
                  depositPaymentStatus,
                  rentPaidAmount: Number(rentPaidAmount) || 0,
                  paymentMode,
                  paymentDate,
                  paymentCollectedBy,
                  cashPaidAmount: paymentMode === "Cash" ? totalUpfrontPaid : (paymentMode === "Bank" ? 0 : (Number(cashPaidAmount) || 0)),
                  bankUpiPaidAmount: paymentMode === "Bank" ? totalUpfrontPaid : (paymentMode === "Cash" ? 0 : (Number(bankUpiPaidAmount) || 0)),
                  additionalItems,
                  rentalDuration: durationDetails.text,
                  rentalDiscount: rentalDiscountVal,
                  rentalDiscountMode,
                  netRent: netRentVal,
                  totalRent: durationDetails.totalRent,
                  totalInitialCharges: totalUpfrontPaid,
                  removalCharges: Number(removalCharges) || 0,
                  equipmentItems: selectedEquipments.map(item => {
                    const oldItem = rental?.equipmentItems?.find((oi: any) => oi.equipmentId === item.equipmentId);
                    return {
                      equipmentId: item.equipmentId,
                      name: equipmentList.find(e => e.id === item.equipmentId)?.name || "Unknown",
                      // ITEM-7: carry the model onto the saved line item so agreements,
                      // receipts and return records can print Name - Model (S/N: Serial).
                      model: item.model || equipmentList.find(e => e.id === item.equipmentId)?.model || "",
                      serial: item.serial || "XXXX",
                      // ITEM-10 FIX: the cycle has to be saved on the line item. Without it,
                      // editing an agreement erased how it bills, and the downstream
                      // `monthlyRent > 0 && dailyRent === 0` guess then read a monthly
                      // rental (which carries both figures) as a daily one.
                      rentCycle: item.rentCycle || "Monthly",
                      monthlyRent: Number(item.monthlyRent) || 0,
                      dailyRent: Number(item.dailyRent) || 0,
                      deposit: Number(item.deposit) || 0,
                      returned: oldItem ? !!oldItem.returned : false,
                    };
                  }),
                } : {
                  id: agreementId,
                  customer: isNewCustomer ? custName : (selectedCustomer?.name || ""),
                  equipment: totalNamesVal,
                  serial: totalSerialsVal,
                  deposit: totalDepositVal,
                  monthlyRent: totalMonthlyRentVal,
                  customerId: "",
                  equipmentId: selectedEquipments.map(item => item.equipmentId).join(", "),
                  start: agreementDate,
                  end: endDate,
                  dailyRent: selectedEquipments.reduce((sum, item) => sum + (Number(item.dailyRent) || 0), 0),
                  deliveryCharges: Number(deliveryCharges) || 0,
                  removalCharges: Number(removalCharges) || 0,
                  installationCharges: Number(installationCharges) || 0,
                  additionalCharges: Number(additionalCharges) || 0,
                  remarks: "",
                  status: "Active",
                  rentalPaymentStatus,
                  depositPaymentStatus,
                  rentPaidAmount: Number(rentPaidAmount) || 0,
                  paymentMode,
                  paymentDate,
                  paymentCollectedBy,
                  cashPaidAmount: paymentMode === "Cash" ? totalUpfrontPaid : (paymentMode === "Bank" ? 0 : (Number(cashPaidAmount) || 0)),
                  bankUpiPaidAmount: paymentMode === "Bank" ? totalUpfrontPaid : (paymentMode === "Cash" ? 0 : (Number(bankUpiPaidAmount) || 0)),
                  additionalItems,
                  rentalDuration: durationDetails.text,
                  rentalDiscount: rentalDiscountVal,
                  rentalDiscountMode,
                  netRent: netRentVal,
                  totalRent: durationDetails.totalRent,
                  totalInitialCharges: totalUpfrontPaid,
                  equipmentItems: selectedEquipments.map(item => ({
                    equipmentId: item.equipmentId,
                    name: equipmentList.find(e => e.id === item.equipmentId)?.name || "Unknown",
                    // ITEM-7: carry the model onto the saved line item so agreements,
                    // receipts and return records can print Name - Model (S/N: Serial).
                    model: item.model || equipmentList.find(e => e.id === item.equipmentId)?.model || "",
                    serial: item.serial || "XXXX",
                    // ITEM-10 FIX: the cycle has to be saved on the line item. Without it,
                    // editing an agreement erased how it bills, and the downstream
                    // `monthlyRent > 0 && dailyRent === 0` guess then read a monthly
                    // rental (which carries both figures) as a daily one.
                    rentCycle: item.rentCycle || "Monthly",
                    monthlyRent: Number(item.monthlyRent) || 0,
                    dailyRent: Number(item.dailyRent) || 0,
                    deposit: Number(item.deposit) || 0,
                    returned: false,
                  })),
                }}
                signatureUrl={signatureUrl}
                thumbprintUrl={thumbprintUrl}
                trigger={<Button variant="outline" type="button" className="w-full justify-start"><FileText className="mr-1.5 h-3.5 w-3.5" />Preview Agreement</Button>}
              />
              <Button variant="outline" type="button" className="w-full justify-start" onClick={() => toast.success(`Agreement emailed successfully to customer.`)}><Mail className="mr-1.5 h-3.5 w-3.5" />Email Agreement</Button>
              
              <div className="flex gap-2 w-full mt-2">
                                <Button variant="outline" type="button" className="flex-1" onClick={onClose}>Cancel</Button>
                {!isStaff && rental && rental.status === "Pending Approval" && (
                  <Button 
                    type="button" 
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] px-2" 
                    onClick={() => {
                                            approveRental(rental.id);
                      toast.success(`Agreement ${rental.id} approved successfully!`);
                      setOpen(false);
                      if (onClose) onClose();
                      if (onSave) onSave();
                    }}
                  >
                    <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                    Approve
                  </Button>
                )}
                <Button type="button" className="flex-1" onClick={handleSave} disabled={isSubmitting}><FileText className="mr-1.5 h-3.5 w-3.5" />Save</Button>
              </div>
                        </div>
          </div>
        </div>

        {/* Continuous Bulk QR Scanner modal */}
        <QrScannerModal
          isOpen={isBulkScannerOpen}
          onOpenChange={setIsBulkScannerOpen}
          bulkMode={true}
          onScanSuccess={handleBulkScanSuccess}
          title="Bulk Scan Equipment Serials"
        />

        {/* QR Scanner modal */}
        <QrScannerModal
          isOpen={isScannerOpen}
          onOpenChange={(open) => {
            setIsScannerOpen(open);
            if (!open) setScannerTargetIdx(null);
          }}
          inlineMode={true}
          onScanSuccess={handleQrScanSuccess}
          title="Scan Equipment Barcode / QR Code"
        />

        {/* Preview of an already-uploaded customer KYC document */}
        <Dialog open={!!previewCustDoc} onOpenChange={(o) => { if (!o) setPreviewCustDoc(null); }}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-[15px] font-bold truncate">{previewCustDoc?.name}</DialogTitle>
            </DialogHeader>
            <div className="py-2">
              {previewCustDoc?.fileData?.startsWith("data:image/") ? (
                <img src={previewCustDoc.fileData} alt={previewCustDoc.name} className="w-full max-h-[70vh] object-contain rounded-lg border border-border/60 bg-muted/20" />
              ) : previewCustDoc?.fileData ? (
                <iframe src={previewCustDoc.fileData} title={previewCustDoc.name} className="w-full h-[70vh] rounded-lg border border-border/60 bg-muted/20" />
              ) : (
                <p className="text-[13px] text-muted-foreground py-6 text-center">This file is not available on this device.</p>
              )}
            </div>
            <DialogFooter>
              {previewCustDoc?.fileData && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => downloadBase64File(previewCustDoc.fileData!, previewCustDoc.name)}
                >
                  <Download className="mr-1.5 h-3.5 w-3.5" /> Download
                </Button>
              )}
              <Button type="button" onClick={() => setPreviewCustDoc(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
}

function CancelRentalDialog({ rental, trigger, onCancel }: { rental: Rental; trigger: React.ReactNode; onCancel?: () => void }) {
  const [reason, setReason] = useState("");
  
  const handleCancel = () => {
    cancelRental(rental.id);
    toast.success(`Agreement ${rental.id} has been cancelled.`);
    if (onCancel) onCancel();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-destructive flex items-center gap-2">
            <XCircle className="h-4 w-4" /> Cancel Agreement
          </DialogTitle>
        </DialogHeader>
        <div className="py-2 space-y-3">
          <p className="text-[13px] text-muted-foreground">
            Cancel agreement <strong className="text-foreground font-mono">{rental.id}</strong> for {rental.customer}?
          </p>
          <div className="rounded-lg border border-destructive/18 bg-destructive/5 p-3 text-[12px] text-destructive">
            ⚠️ Cancelling will mark the equipment as Available and freeze billing. Security deposit refund must be processed separately.
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Cancellation Reason</Label>
            <Textarea placeholder="Reason for cancellation..." className="resize-none min-h-[70px]" value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" type="button">Keep Active</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button variant="destructive" type="button" onClick={handleCancel}><XCircle className="mr-1.5 h-3.5 w-3.5" />Cancel Agreement</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LiveWebcam({ onCapture }: { onCapture: (dataUrl: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");

  useEffect(() => {
    let activeStream: MediaStream | null = null;
    
    async function startCamera() {
      try {
        const constraints: MediaStreamConstraints = {
          video: selectedDeviceId ? { deviceId: { exact: selectedDeviceId } } : { facingMode: "environment" }
        };
        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        activeStream = mediaStream;
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        
        // Enumerate video devices
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = allDevices.filter(d => d.kind === "videoinput");
        setDevices(videoDevices);
        if (videoDevices.length > 0 && !selectedDeviceId) {
          setSelectedDeviceId(videoDevices[0].deviceId);
        }
      } catch (err: any) {
        console.error("Webcam access error:", err);
        setError(err.message || "Could not access camera. Please check permissions.");
      }
    }
    
    startCamera();
    
    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [selectedDeviceId]);

  const capture = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg");
        onCapture(dataUrl);
      }
    }
  };

  return (
    <div className="flex flex-col items-center w-full space-y-3">
      {error ? (
        <div className="flex flex-col items-center p-4 border border-destructive/20 bg-destructive/5 rounded-xl text-center w-full">
          <AlertTriangle className="h-6 w-6 text-destructive mb-2" />
          <p className="text-[12px] font-semibold text-destructive">{error}</p>
          <p className="text-[10px] text-muted-foreground mt-1">Please use the Upload option or verify camera permission in your browser.</p>
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-xl bg-black aspect-video w-full border border-border flex items-center justify-center">
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2 px-4">
            <Button type="button" size="sm" className="bg-primary hover:bg-primary/90 h-8 text-[11px] font-bold" onClick={capture}>
              <Camera className="h-3.5 w-3.5 mr-1" /> Capture Photo
            </Button>
          </div>
        </div>
      )}
      
      {devices.length > 1 && !error && (
        <div className="flex items-center justify-between w-full text-[11px]">
          <span className="text-muted-foreground">Switch Camera:</span>
          <select
            className="h-9 border border-border/60 rounded px-1.5 bg-background text-[11px] max-w-[150px]"
            value={selectedDeviceId}
            onChange={(e) => setSelectedDeviceId(e.target.value)}
          >
            {devices.map((device, idx) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Camera ${idx + 1}`}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

function SignaturePadDialog({ trigger, onSave }: { trigger: React.ReactNode, onSave: (url: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("draw");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (isOpen && activeTab === "draw" && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#020817';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [isOpen, activeTab]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    // Account for CSS scaling: canvas internal size vs displayed size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    ctx.beginPath();
    ctx.moveTo((clientX - rect.left) * scaleX, (clientY - rect.top) * scaleY);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    // Account for CSS scaling
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    ctx.lineTo((clientX - rect.left) * scaleX, (clientY - rect.top) * scaleY);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      onSave(canvas.toDataURL('image/png'));
      setIsOpen(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        onSave(reader.result as string);
        setIsOpen(false);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Digital Signature</DialogTitle>
        </DialogHeader>
        <div className="py-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="draw">Draw</TabsTrigger>
              <TabsTrigger value="camera">Take Photo</TabsTrigger>
              <TabsTrigger value="upload">Upload</TabsTrigger>
            </TabsList>

            <TabsContent value="draw" className="space-y-3">
              <p className="text-[12px] text-muted-foreground mb-2">Please sign below using your mouse, finger, or stylus.</p>
              <div className="border-2 border-dashed border-border/60 rounded-xl overflow-hidden bg-white shadow-inner">
                <canvas
                  ref={canvasRef}
                  width={420}
                  height={200}
                  className="w-full h-[200px] touch-none cursor-crosshair"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseOut={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
              </div>
              <DialogFooter className="flex justify-between w-full sm:justify-between items-center mt-2">
                <Button variant="outline" size="sm" onClick={clearCanvas}>Clear</Button>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>Cancel</Button>
                  <Button size="sm" onClick={saveSignature}><PenTool className="h-3.5 w-3.5 mr-1.5" />Save Signature</Button>
                </div>
              </DialogFooter>
            </TabsContent>

            <TabsContent value="camera" className="flex flex-col items-center justify-center py-4 space-y-4">
              <p className="text-[12px] text-muted-foreground text-center">
                Capture a photo of a physical signature using your live webcam or your device's camera.
              </p>
              {isOpen && activeTab === "camera" && (
                <LiveWebcam onCapture={(url) => {
                  onSave(url);
                  setIsOpen(false);
                }} />
              )}
              <div className="relative border-2 border-dashed border-border/80 rounded-xl p-4 text-center bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer w-full flex flex-col items-center justify-center h-16">
                <Camera className="h-4 w-4 text-muted-foreground/60 mb-0.5" />
                <span className="text-[11px] font-medium text-foreground leading-none">Use Native Camera</span>
                <span className="text-[8px] text-muted-foreground">Standard native camera capture</span>
                <input 
                  type="file" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50" 
                  accept="image/*" 
                  capture="environment" 
                  onChange={handleFileUpload} 
                />
              </div>
            </TabsContent>

            <TabsContent value="upload" className="flex flex-col items-center justify-center py-4 space-y-4">
              <p className="text-[12px] text-muted-foreground text-center">
                Upload an image file of the signature from your device.
              </p>
              <div className="relative border-2 border-dashed border-border/80 rounded-xl p-6 text-center bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer w-full flex flex-col items-center justify-center">
                <FileUp className="h-8 w-8 text-muted-foreground/60 mb-2" />
                <span className="text-[12px] font-medium text-foreground">Choose Image File</span>
                <span className="text-[10px] text-muted-foreground mt-1">Supports PNG, JPG, JPEG</span>
                <input 
                  type="file" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50" 
                  accept="image/*" 
                  onChange={handleFileUpload} 
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ThumbprintCaptureDialog({ trigger, onSave }: { trigger: React.ReactNode, onSave: (url: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("sensor");
  const [scanProgress, setScanProgress] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const scanIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    };
  }, []);

  const startScanning = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsScanning(true);
    setScanProgress(0);
    
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    
    scanIntervalRef.current = window.setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
          setIsScanning(false);
          // Generate simulated fingerprint SVG image
          const simulatedFingerprint = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%230284c7" stroke-width="1.2" stroke-linecap="round"><path d="M12 22a7 7 0 0 0 7-7c0-4.3-3-7-7-7s-7 2.7-7 7a7 7 0 0 0 7 7z"/><path d="M12 2a10 10 0 0 1 10 10c0 5.5-4.5 10-10 10S2 17.5 2 12A10 10 0 0 1 12 2z"/><path d="M8 12a4 4 0 0 1 8 0c0 2.2-1.8 4-4 4s-4-1.8-4-4z"/><path d="M10 12a2 2 0 0 1 4 0"/></svg>`;
          onSave(simulatedFingerprint);
          setIsOpen(false);
          return 100;
        }
        return prev + 10;
      });
    }, 150);
  };

  const stopScanning = () => {
    setIsScanning(false);
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        onSave(reader.result as string);
        setIsOpen(false);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Biometric Thumbprint Scan</DialogTitle>
        </DialogHeader>
        <div className="py-4 flex flex-col items-center">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="sensor">Touch Screen</TabsTrigger>
              <TabsTrigger value="camera">Take Photo</TabsTrigger>
              <TabsTrigger value="upload">Upload</TabsTrigger>
            </TabsList>
            
            <TabsContent value="sensor" className="flex flex-col items-center justify-center py-4">
              <p className="text-[12px] text-muted-foreground text-center mb-6">
                Press and hold your thumb on the scanner icon below to simulate a fingerprint verification.
              </p>
              
              <div 
                className={`relative h-28 w-28 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all ${
                  isScanning 
                    ? "border-primary bg-primary/5 scale-105 shadow-[0_0_15px_rgba(37,99,235,0.2)]" 
                    : "border-border/80 bg-muted/10 hover:bg-muted/20"
                }`}
                onMouseDown={startScanning}
                onMouseUp={stopScanning}
                onMouseLeave={stopScanning}
                onTouchStart={startScanning}
                onTouchEnd={stopScanning}
              >
                <Fingerprint className={`h-16 w-16 transition-colors ${isScanning ? "text-primary animate-pulse" : "text-muted-foreground/60"}`} />
                {isScanning && (
                  <div className="absolute left-4 right-4 h-0.5 bg-primary shadow-[0_0_8px_#2563eb] animate-[bounce_1.5s_infinite]" />
                )}
              </div>
              
              {isScanning && (
                <div className="w-48 mt-6 space-y-1">
                  <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                    <span>Scanning...</span>
                    <span>{scanProgress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-150" style={{ width: `${scanProgress}%` }} />
                  </div>
                </div>
              )}
              
              {!isScanning && (
                <span className="text-[11px] text-muted-foreground font-medium mt-4">
                  Press and hold to scan
                </span>
              )}
            </TabsContent>
            
            <TabsContent value="camera" className="flex flex-col items-center justify-center py-4 space-y-4">
              <p className="text-[12px] text-muted-foreground text-center">
                Use your webcam or device's camera to take a photo of the customer's thumbprint.
              </p>
              {isOpen && activeTab === "camera" && (
                <LiveWebcam onCapture={(url) => {
                  onSave(url);
                  setIsOpen(false);
                }} />
              )}
              <div className="relative border-2 border-dashed border-border/80 rounded-xl p-4 text-center bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer w-full flex flex-col items-center justify-center h-16">
                <Camera className="h-4 w-4 text-muted-foreground/60 mb-0.5" />
                <span className="text-[11px] font-medium text-foreground leading-none">Use Native Camera</span>
                <span className="text-[8px] text-muted-foreground">Standard native camera capture</span>
                <input 
                  type="file" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50" 
                  accept="image/*" 
                  capture="environment" 
                  onChange={handleFileUpload} 
                />
              </div>
            </TabsContent>
            
            <TabsContent value="upload" className="flex flex-col items-center justify-center py-6">
              <p className="text-[12px] text-muted-foreground text-center mb-4">
                Upload a scanned fingerprint image file from your computer or device.
              </p>
              <div className="relative border-2 border-dashed border-border/80 rounded-xl p-6 text-center bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer w-full flex flex-col items-center justify-center">
                <FileUp className="h-8 w-8 text-muted-foreground/60 mb-2" />
                <span className="text-[12px] font-medium text-foreground">Choose Image File</span>
                <span className="text-[10px] text-muted-foreground mt-1">Supports PNG, JPG, JPEG</span>
                <input 
                  type="file" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50" 
                  accept="image/*" 
                  onChange={handleFileUpload} 
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeliveryPhotoCaptureDialog({
  trigger,
  initialPhotos = [],
  onSave,
}: {
  trigger: React.ReactNode;
  initialPhotos?: Array<{ url: string; name: string; size?: string; id?: string }>;
  onSave: (photos: Array<{ url: string; name: string; size?: string; id?: string }>) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("camera");
  const [photos, setPhotos] = useState<Array<{ url: string; name: string; size?: string; id?: string }>>([]);

  useEffect(() => {
    if (isOpen) {
      setPhotos(initialPhotos || []);
    }
  }, [isOpen, initialPhotos]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      files.forEach((file) => {
        const sizeKB = (file.size / 1024).toFixed(1);
        const reader = new FileReader();
        reader.onloadend = () => {
          setPhotos((prev) => [
            ...prev,
            { url: reader.result as string, name: file.name, size: `${sizeKB} KB` },
          ]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleCameraCapture = (url: string) => {
    const photoName = `Delivery_Photo_${photos.length + 1}.jpg`;
    const sizeKB = ((url.length / 1024) * 0.75).toFixed(1);
    setPhotos((prev) => [...prev, { url, name: photoName, size: `${sizeKB} KB` }]);
    toast.success("Delivery photo captured!");
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirmSave = () => {
    onSave(photos);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Delivery Photos & Documents</DialogTitle>
        </DialogHeader>
        <div className="py-2 space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="camera">Take Photo</TabsTrigger>
              <TabsTrigger value="upload">Upload File</TabsTrigger>
            </TabsList>

            <TabsContent value="camera" className="flex flex-col items-center justify-center py-2 space-y-3">
              <p className="text-[12px] text-muted-foreground text-center">
                Use webcam or device camera to take photos of delivery.
              </p>
              {isOpen && activeTab === "camera" && (
                <LiveWebcam onCapture={handleCameraCapture} />
              )}
              <div className="relative border-2 border-dashed border-border/80 rounded-xl p-3 text-center bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer w-full flex flex-col items-center justify-center h-14">
                <Camera className="h-4 w-4 text-muted-foreground/60 mb-0.5" />
                <span className="text-[11px] font-medium text-foreground leading-none">Native Camera Photo</span>
                <input 
                  type="file" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50" 
                  accept="image/*" 
                  capture="environment" 
                  onChange={handleFileUpload} 
                />
              </div>
            </TabsContent>

            <TabsContent value="upload" className="flex flex-col items-center justify-center py-2 space-y-3">
              <p className="text-[12px] text-muted-foreground text-center">
                Upload delivery photos or delivery slip PDFs from your device.
              </p>
              <div className="relative border-2 border-dashed border-border/80 rounded-xl p-5 text-center bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer w-full flex flex-col items-center justify-center">
                <FileUp className="h-7 w-7 text-muted-foreground/60 mb-1" />
                <span className="text-[12px] font-medium text-foreground">Choose Image / PDF Files</span>
                <span className="text-[10px] text-muted-foreground mt-0.5">Supports PNG, JPG, JPEG, PDF (Multiple allowed)</span>
                <input 
                  type="file" 
                  multiple
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50" 
                  accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/*" 
                  onChange={handleFileUpload} 
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* Photos list preview */}
          {photos.length > 0 && (
            <div className="space-y-2 border-t border-border/50 pt-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Selected Photos / Files ({photos.length})
              </span>
              <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto p-1 bg-muted/10 rounded-lg border border-border/40">
                {photos.map((item, idx) => {
                  const isImg = item.url.startsWith("data:image/") || /\.(jpg|jpeg|png|webp)$/i.test(item.name);
                  return (
                    <div key={idx} className="flex items-center justify-between gap-2 p-1.5 border border-border/60 rounded-md bg-background shadow-xs">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {isImg ? (
                          <img src={item.url} alt="Preview" className="h-8 w-8 rounded object-cover border shrink-0" />
                        ) : (
                          <div className="h-8 w-8 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <FileText className="h-4 w-4" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-medium truncate text-foreground leading-tight" title={item.name}>{item.name}</p>
                          {item.size && <p className="text-[9px] text-muted-foreground">{item.size}</p>}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => removePhoto(idx)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 border-t border-border/40 pt-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button size="sm" type="button" onClick={handleConfirmSave}>Save {photos.length} File{photos.length === 1 ? "" : "s"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SignedDocumentCaptureDialog({ trigger, onSave }: { trigger: React.ReactNode, onSave: (url: string, name: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("upload");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        onSave(reader.result as string, file.name);
        setIsOpen(false);
      };
      reader.readAsDataURL(file);
      e.target.value = "";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Signed Document</DialogTitle>
        </DialogHeader>
        <div className="py-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="camera">Take Photo</TabsTrigger>
              <TabsTrigger value="upload">Upload File</TabsTrigger>
            </TabsList>

            <TabsContent value="camera" className="flex flex-col items-center justify-center py-4 space-y-4">
              <p className="text-[12px] text-muted-foreground text-center">
                Use your webcam or native device camera to photograph the signed agreement document.
              </p>
              {isOpen && activeTab === "camera" && (
                <LiveWebcam onCapture={(url) => {
                  onSave(url, "Signed_Agreement_Photo.jpg");
                  setIsOpen(false);
                }} />
              )}
              <div className="relative border-2 border-dashed border-border/80 rounded-xl p-4 text-center bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer w-full flex flex-col items-center justify-center h-16">
                <Camera className="h-4 w-4 text-muted-foreground/60 mb-0.5" />
                <span className="text-[11px] font-medium text-foreground leading-none">Use Native Camera</span>
                <span className="text-[8px] text-muted-foreground">Standard native camera capture</span>
                <input 
                  type="file" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50" 
                  accept="image/*" 
                  capture="environment" 
                  onChange={handleFileUpload} 
                />
              </div>
            </TabsContent>

            <TabsContent value="upload" className="flex flex-col items-center justify-center py-4 space-y-4">
              <p className="text-[12px] text-muted-foreground text-center">
                Upload a scanned PDF or photo of the signed agreement.
              </p>
              <div className="relative border-2 border-dashed border-border/80 rounded-xl p-6 text-center bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer w-full flex flex-col items-center justify-center">
                <FileUp className="h-8 w-8 text-muted-foreground/60 mb-2" />
                <span className="text-[12px] font-medium text-foreground">Choose PDF or Image File</span>
                <span className="text-[10px] text-muted-foreground mt-1">Supports PDF, PNG, JPG, JPEG</span>
                <input 
                  type="file" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50" 
                  accept=".pdf,image/*" 
                  onChange={handleFileUpload} 
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CustomerIDProofDialog({
  trigger,
  initialFiles = [],
  onSave,
}: {
  trigger: React.ReactNode;
  initialFiles?: Array<{ fileData: string; name: string; size: string }>;
  onSave: (files: Array<{ fileData: string; name: string; size: string }>) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("upload");
  const [files, setFiles] = useState<Array<{ fileData: string; name: string; size: string }>>([]);

  useEffect(() => {
    if (isOpen) {
      setFiles(initialFiles || []);
    }
  }, [isOpen, initialFiles]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files);
      selected.forEach((file) => {
        const sizeKB = (file.size / 1024).toFixed(1);
        const reader = new FileReader();
        reader.onloadend = () => {
          setFiles((prev) => [
            ...prev,
            { fileData: reader.result as string, name: file.name, size: `${sizeKB} KB` },
          ]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleCameraCapture = (url: string) => {
    const fileName = `KYC_ID_Photo_${files.length + 1}.jpg`;
    const sizeKB = ((url.length / 1024) * 0.75).toFixed(1);
    setFiles((prev) => [...prev, { fileData: url, name: fileName, size: `${sizeKB} KB` }]);
    toast.success("ID Photo captured!");
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirmSave = () => {
    onSave(files);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload KYC ID Proofs</DialogTitle>
        </DialogHeader>
        <div className="py-2 space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="camera">Take Photo</TabsTrigger>
              <TabsTrigger value="upload">Upload File</TabsTrigger>
            </TabsList>

            <TabsContent value="camera" className="flex flex-col items-center justify-center py-2 space-y-3">
              <p className="text-[12px] text-muted-foreground text-center">
                Use webcam or device camera to photograph Aadhaar / PAN card.
              </p>
              {isOpen && activeTab === "camera" && (
                <LiveWebcam onCapture={handleCameraCapture} />
              )}
              <div className="relative border-2 border-dashed border-border/80 rounded-xl p-3 text-center bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer w-full flex flex-col items-center justify-center h-14">
                <Camera className="h-4 w-4 text-muted-foreground/60 mb-0.5" />
                <span className="text-[11px] font-medium text-foreground leading-none">Native Camera Photo</span>
                <input 
                  type="file" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50" 
                  accept="image/*" 
                  capture="environment" 
                  onChange={handleFileUpload} 
                />
              </div>
            </TabsContent>

            <TabsContent value="upload" className="flex flex-col items-center justify-center py-2 space-y-3">
              <p className="text-[12px] text-muted-foreground text-center">
                Upload scanned PDF or photo files of Aadhaar, PAN, or other ID cards.
              </p>
              <div className="relative border-2 border-dashed border-border/80 rounded-xl p-5 text-center bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer w-full flex flex-col items-center justify-center">
                <FileUp className="h-7 w-7 text-muted-foreground/60 mb-1" />
                <span className="text-[12px] font-medium text-foreground">Choose PDF or Image Files</span>
                <span className="text-[10px] text-muted-foreground mt-0.5">Supports PDF, PNG, JPG, JPEG (Multiple allowed)</span>
                <input 
                  type="file" 
                  multiple
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50" 
                  accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/*" 
                  onChange={handleFileUpload} 
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* Selected Files preview */}
          {files.length > 0 && (
            <div className="space-y-2 border-t border-border/50 pt-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Selected ID Proofs ({files.length})
              </span>
              <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto p-1 bg-muted/10 rounded-lg border border-border/40">
                {files.map((item, idx) => {
                  const isImg = item.fileData?.startsWith("data:image/") || /\.(jpg|jpeg|png|webp)$/i.test(item.name);
                  return (
                    <div key={idx} className="flex items-center justify-between gap-2 p-1.5 border border-border/60 rounded-md bg-background shadow-xs">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {isImg ? (
                          <img src={item.fileData} alt="Preview" className="h-8 w-8 rounded object-cover border shrink-0" />
                        ) : (
                          <div className="h-8 w-8 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <FileText className="h-4 w-4" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-medium truncate text-foreground leading-tight" title={item.name}>{item.name}</p>
                          <p className="text-[9px] text-muted-foreground">{item.size}</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => removeFile(idx)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 border-t border-border/40 pt-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button size="sm" type="button" onClick={handleConfirmSave}>Save {files.length} File{files.length === 1 ? "" : "s"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AgreementPreviewDialog({ rental, signatureUrl, thumbprintUrl, trigger, onApproveSuccess }: {
  rental?: any;
  signatureUrl?: string | null;
  thumbprintUrl?: string | null;
  trigger: React.ReactNode;
  onApproveSuccess?: () => void;
}) {
  const isStaff = typeof window !== "undefined" && localStorage.getItem("medirent-user-role") === "Staff";
  // Helper to convert numbers to words (Indian numbering format)
  const convertNumberToWords = (amount: number): string => {
    if (amount <= 0 || isNaN(amount)) return "N/A";
    const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    
    function convert(n: number): string {
      if (n < 20) return ones[n];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + ones[n % 10] : "");
      if (n < 1000) return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " and " + convert(n % 100) : "");
      if (n < 100000) return convert(Math.floor(n / 1000)) + " Thousand" + (n % 1000 !== 0 ? " " + convert(n % 1000) : "");
      if (n < 10000000) return convert(Math.floor(n / 100000)) + " Lakh" + (n % 100000 !== 0 ? " " + convert(n % 100000) : "");
      return convert(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 !== 0 ? " " + convert(n % 10000000) : "");
    }
    
    return convert(amount) + " only";
  };

  // Helper to calculate dynamic duration
  const calculateDurationBetween = (startDateStr: string, endDateStr: string) => {
    const start = parseLocalDate(startDateStr);
    const end = parseLocalDate(endDateStr);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
      return "0 days";
    }

    const diffTime = end.getTime() - start.getTime();
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let months = end.getFullYear() - start.getFullYear();
    months = months * 12 + (end.getMonth() - start.getMonth());
    
    let days = end.getDate() - start.getDate();
    if (days < 0) {
      months--;
      const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
      days += prevMonth.getDate();
    }

    if (months > 0 && days > 0) {
      return `${months} month${months > 1 ? 's' : ''} and ${days} day${days > 1 ? 's' : ''}`;
    } else if (months > 0) {
      return `${months} month${months > 1 ? 's' : ''}`;
    } else {
      return `${totalDays} day${totalDays !== 1 ? 's' : ''}`;
    }
  };

  // Helper to calculate rent
  const calculateRentForDuration = (startDateStr: string, endDateStr: string, monthlyRent: number, dailyRent: number) => {
    const start = parseLocalDate(startDateStr);
    const end = parseLocalDate(endDateStr);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return 0;

    const diffTime = end.getTime() - start.getTime();
    const daysUsed = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (rental?.equipmentItems && rental.equipmentItems.length > 0) {
      return rental.equipmentItems.reduce((sum: number, item: any) => {
        const isMonthly = cleanNum(item.monthlyRent) > 0;
        if (!isMonthly) {
          const dailyRate = cleanNum(item.dailyRent || item.rentRate);
          return sum + (daysUsed * dailyRate);
        } else {
          return sum + getReturnCalculatedRentPerItem(item.monthlyRent, daysUsed, startDateStr, endDateStr);
        }
      }, 0);
    }
    const isRentalMonthly = monthlyRent > 0;
    if (!isRentalMonthly) {
      return daysUsed * dailyRent;
    }
    return getReturnCalculatedRentPerItem(monthlyRent, daysUsed, startDateStr, endDateStr);
  };

  const customers = getCustomers();
  const customerObj = customers.find(c => c.id === rental?.customerId);

  const customerName = rental?.customer || customerObj?.name || "Valued Customer";
  const customerAddress = customerObj?.address || "No address on file";
  const customerArea = customerObj?.area || "";
  const customerCity = customerObj?.city || "Mysore";
  const customerState = customerObj?.state || "Karnataka";
  const customerPincode = customerObj?.pincode || "";
  const customerPhone = customerObj?.phone || "N/A";
  const customerAltPhone = customerObj?.altPhone || "";

  const formattedStartDate = rental?.start ? formatDateDDMMYYYY(rental.start) : formatDateDDMMYYYY(new Date().toISOString());

  // Build Hired Equipment rows
  let finalEquipRows = null;
  if (rental?.equipmentItems && rental.equipmentItems.length > 0) {
    const eqList = getEquipment();
    finalEquipRows = rental.equipmentItems.map((item: any, idx: number) => {
      const eqObj = eqList.find(e => e.id === item.equipmentId);
      // ITEM-5/7: prefer the agreement's own line item over the (mutable)
      // equipment master, matching getAgreementHtmlContent().
      const name = item.name || eqObj?.name || eqObj?.category || "Equipment";
      const model = item.model || eqObj?.model || "Standard";
      const serial = item.serial || eqObj?.serial || "XXXX";
      return (
        <tr key={idx} className="border-b border-slate-800 text-[11.5px]">
          <td className={`p-1 px-2 border-r border-slate-800 font-bold ${item.returned ? 'line-through text-slate-400' : ''}`}>{name}</td>
          <td className={`p-1 px-2 border-r border-slate-800 text-center font-bold ${item.returned ? 'text-red-600' : 'text-emerald-600'}`}>
            {item.returned ? `NO (Returned ${item.returnedDate ? formatDateDDMMYYYY(item.returnedDate) : ''})` : 'YES'}
          </td>
          <td className="p-1 px-2 border-r border-slate-800">{model}</td>
          <td className="p-1 px-2 border-r border-slate-800 font-mono text-[11px]">{serial}</td>
          <td className="p-1 px-2 border-r border-slate-800"></td>
          <td className="p-1 px-2"></td>
        </tr>
      );
    });
  } else {
    // Build Hired Equipment rows (only the ones they have taken) (fallback for legacy single equipment)
    const standardEquipments = [
      { name: "Oxygen Concentrator", key: "oxygen" },
      { name: "Bipap", key: "bipap" },
      { name: "Auto Cpap", key: "cpap" },
      { name: "Patient Monitor", key: "monitor" },
      { name: "Surgical Cot", key: "cot" },
      { name: "Wheel Chair", key: "chair" }
    ];

    const hiredEquipments = standardEquipments.filter(eq => 
      rental?.equipment?.toLowerCase().includes(eq.key)
    );

    if (hiredEquipments.length > 0) {
      finalEquipRows = hiredEquipments.map(eq => (
        <tr key={eq.key} className="border-b border-slate-800 text-[11.5px]">
          <td className="p-1 px-2 border-r border-slate-800">{eq.name}</td>
          <td className="p-1 px-2 border-r border-slate-800 text-center font-bold text-emerald-600">YES</td>
          <td className="p-1 px-2 border-r border-slate-800">{rental?.model || 'BMC-D'}</td>
          <td className="p-1 px-2 border-r border-slate-800 font-mono text-[11px]">{rental?.serial || 'XXXX'}</td>
          <td className="p-1 px-2 border-r border-slate-800"></td>
          <td className="p-1 px-2"></td>
        </tr>
      ));
    } else if (rental?.equipment) {
      finalEquipRows = (
        <tr className="border-b border-slate-800 text-[11.5px] bg-slate-50 font-bold">
          <td className="p-1 px-2 border-r border-slate-800">{rental.equipment}</td>
          <td className="p-1 px-2 border-r border-slate-800 text-center font-bold text-emerald-600">YES</td>
          <td className="p-1 px-2 border-r border-slate-800">{rental.model || 'Standard'}</td>
          <td className="p-1 px-2 border-r border-slate-800 font-mono text-[11px]">{rental.serial || 'XXXX'}</td>
          <td className="p-1 px-2 border-r border-slate-800"></td>
          <td className="p-1 px-2"></td>
        </tr>
      );
    }
  }

  // Calculate rent and deposit details
  const isMonthly = rental?.monthlyRent > 0;
  const rentVal = isMonthly ? (rental?.monthlyRent || 0) : (rental?.dailyRent || 0);
  const rentLabel = isMonthly ? "Monthly Rent Rate" : "Daily Rent Rate";
  const rentWords = convertNumberToWords(rentVal);

  const depositVal = rental?.deposit || 0;
  const depositWords = convertNumberToWords(depositVal);

  // Rent paid
  let rentPaidAmount = 0;
  if (rental?.rentalPaymentStatus === "Paid") {
    rentPaidAmount = rentVal;
  } else if (rental?.rentalPaymentStatus === "Partial") {
    rentPaidAmount = Number(rental?.rentPaidAmount) || 0;
  }

  // Deposit paid
  let depositPaidAmount = 0;
  if (rental?.depositPaymentStatus === "Paid") {
    depositPaidAmount = depositVal;
  } else if (rental?.depositPaymentStatus === "Partial") {
    depositPaidAmount = Number(rental?.depositPaidAmount) || 0;
  }

  // Additional items
  const selectedAddons = (rental?.additionalItems || []).filter((item: any) => item.selected);
  
  // Calculate totals
  let totalDue = depositVal + rentVal;
  let totalPaid = depositPaidAmount + rentPaidAmount;

  selectedAddons.forEach((item: any) => {
    if (item.status !== "Free of Cost") {
      totalDue += Number(item.amount) || 0;
    }
    if (item.status === "Paid") {
      totalPaid += Number(item.amount) || 0;
    }
  });

  const balanceDue = totalDue - totalPaid;

  const totalDueWords = convertNumberToWords(totalDue);
  const totalPaidWords = convertNumberToWords(totalPaid);
  const balanceDueWords = convertNumberToWords(balanceDue);

  // Calculate dynamic logs for page 3
  const paymentsList = getPayments().filter(p => p.agreement === rental?.id && p.status === "Paid");
  let totalRentPaidWithoutDeposit = paymentsList
    .filter(p => p.type === "Rent" || p.type === "Rent Payment")
    .reduce((sum, p) => sum + p.amount, 0);
  
  if (totalRentPaidWithoutDeposit === 0 && (rental?.rentalPaymentStatus === "Paid" || rental?.rentalPaymentStatus === "Partial")) {
    // ITEM-10: `totalRent` is the rent charged over the term, not money
    // received - including it here reported unpaid agreements as paid.
    totalRentPaidWithoutDeposit = rental?.rentalPaymentStatus === "Partial"
      ? (Number(rental?.rentPaidAmount) || 0)
      : (Number(rental?.rentPaidAmount) || Number(rental?.monthlyRent) || 0);
  }

  let depositPaid = paymentsList
    .filter(p => p.type === "Deposit" || p.type === "Security Deposit")
    .reduce((sum, p) => sum + p.amount, 0);
  if (depositPaid === 0 && (rental?.depositPaymentStatus === "Paid" || rental?.depositPaymentStatus === "Partial")) {
    depositPaid = rental?.depositPaidAmount || rental?.deposit || 0;
  }

  const overallPaid = totalRentPaidWithoutDeposit + depositPaid;
  
  const todayStr = getLocalYYYYMMDD();
  const reportEndDate = rental?.status === "Completed" ? (rental?.end || todayStr) : todayStr;
  const actualDurationText = rental?.start ? calculateDurationBetween(rental.start, reportEndDate) : "0 days";
  const totalRentToBePaid = rental?.start ? calculateRentForDuration(rental.start, reportEndDate, rental.monthlyRent || 0, rental.dailyRent || 0) : 0;

  let dueFromCustomer = 0;
  let refundFromRelife = 0;
  if (overallPaid > totalRentToBePaid) {
    refundFromRelife = overallPaid - totalRentToBePaid;
  } else {
    dueFromCustomer = totalRentToBePaid - overallPaid;
  }

  // Format payments log table (side-by-side columns up to 72 payments)
  const leftRows = [];
  const rightRows = [];
  
  for (let i = 0; i <= 36; i++) {
    const leftPay = paymentsList[i];
    const rightPay = paymentsList[i + 37];
    
    leftRows.push(
      <tr key={`left-${i}`} className="border-b border-slate-800">
        <td className="border-r border-slate-800 p-1 text-center text-[10.5px] font-medium">{i}</td>
        <td className="border-r border-slate-800 p-1 text-right text-[10.5px]">
          {leftPay ? `₹${leftPay.amount.toLocaleString("en-IN")}` : '\u00A0'}
        </td>
        <td className="p-1 text-center text-[10.5px]">
          {leftPay ? parseLocalDate(leftPay.date).toLocaleDateString('en-IN') : '\u00A0'}
        </td>
      </tr>
    );
    
    rightRows.push(
      <tr key={`right-${i}`} className="border-b border-slate-800">
        <td className="border-r border-slate-800 p-1 text-center text-[10.5px] font-medium">{i + 37}</td>
        <td className="border-r border-slate-800 p-1 text-right text-[10.5px]">
          {rightPay ? `₹${rightPay.amount.toLocaleString("en-IN")}` : '\u00A0'}
        </td>
        <td className="p-1 text-center text-[10.5px]">
          {rightPay ? parseLocalDate(rightPay.date).toLocaleDateString('en-IN') : '\u00A0'}
        </td>
      </tr>
    );
  }

  const finalSignatureUrl = signatureUrl || rental?.signatureUrl || null;
  const finalThumbprintUrl = thumbprintUrl || rental?.thumbprintUrl || null;

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-muted/20">
        <div className="flex flex-row items-center justify-between mb-4 mt-2">
          <DialogTitle className="text-lg font-bold">Agreement Preview</DialogTitle>
          <div className="flex gap-2 font-semibold">
            {!isStaff && rental?.id && rental?.status === "Pending Approval" && (
              <DialogClose asChild>
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                  onClick={() => {
                    approveRental(rental.id);
                    if (onApproveSuccess) onApproveSuccess();
                    toast.success(`Agreement ${rental.id} approved successfully!`);
                  }}
                >
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Approve
                </Button>
              </DialogClose>
            )}
            <Button variant="outline" size="sm" onClick={() => { downloadAgreementFile(rental); toast.success(`Agreement PDF downloaded successfully.`); }}>
              <Download className="mr-1.5 h-3.5 w-3.5" /> PDF / Download
            </Button>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => sendWhatsAppDocument(rental, customers)}>
              <MessageCircle className="mr-1.5 h-3.5 w-3.5" /> Send to WhatsApp
            </Button>
            <DialogClose asChild>
              <Button variant="outline" size="sm" className="hover:bg-destructive hover:text-destructive-foreground">
                <X className="mr-1.5 h-3.5 w-3.5" /> Close
              </Button>
            </DialogClose>
          </div>
        </div>

        {/*
          ITEM-11 FIX: the money totals sit near the end of a multi-page
          document inside a 90vh scroll container, so the operator had to scroll
          the whole agreement to find out what had been collected - the "total
          collected amount is hiding" report. This bar pins the three figures
          that actually get checked to the top of the dialog, so they stay on
          screen no matter how far down the document is scrolled. The full
          itemised breakdown remains in the document body below.
        */}
        <div className="sticky top-0 z-20 -mx-1 mb-4 rounded-xl border border-border/70 bg-card/95 px-3 py-2.5 shadow-soft backdrop-blur-sm supports-[backdrop-filter]:bg-card/80">
          <div className="grid grid-cols-3 gap-2">
            <div className="min-w-0 rounded-lg border border-emerald-200 bg-emerald-50/70 px-2.5 py-1.5 dark:border-emerald-900/50 dark:bg-emerald-950/30">
              <p className="truncate text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Total Amount Collected</p>
              <p className="font-display text-[15px] font-black tabular-nums text-emerald-800 dark:text-emerald-300">
                ₹{totalPaid.toLocaleString("en-IN")}
              </p>
            </div>
            <div className="min-w-0 rounded-lg border border-blue-200 bg-blue-50/70 px-2.5 py-1.5 dark:border-blue-900/50 dark:bg-blue-950/30">
              <p className="truncate text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">Security Deposit Paid</p>
              <p className="font-display text-[15px] font-black tabular-nums text-blue-800 dark:text-blue-300">
                ₹{depositPaidAmount.toLocaleString("en-IN")}
              </p>
            </div>
            <div className={`min-w-0 rounded-lg border px-2.5 py-1.5 ${
              balanceDue > 0
                ? "border-rose-200 bg-rose-50/70 dark:border-rose-900/50 dark:bg-rose-950/30"
                : "border-border bg-muted/40"
            }`}>
              <p className={`truncate text-[10px] font-bold uppercase tracking-wider ${
                balanceDue > 0 ? "text-rose-700 dark:text-rose-400" : "text-muted-foreground"
              }`}>
                Pending Balance
              </p>
              <p className={`font-display text-[15px] font-black tabular-nums ${
                balanceDue > 0 ? "text-rose-800 dark:text-rose-300" : "text-muted-foreground"
              }`}>
                {balanceDue > 0 ? `₹${balanceDue.toLocaleString("en-IN")}` : "Fully Paid"}
              </p>
            </div>
          </div>
        </div>

        {/* Paper Container - Stacked Pages */}
        <div className="flex flex-col gap-8 select-none p-1">
          
          {/* ════════════════ PAGE 1 ════════════════ */}
          <div className="mx-auto w-full max-w-[794px] bg-white text-slate-900 p-10 shadow-lg border border-slate-200 flex flex-col text-[12.5px] relative font-sans leading-relaxed">
            {/* Header */}
            <div className="flex justify-between items-center mb-3">
              <div>
                <img src="/images/logo.png" alt="Relife Logo" className="h-[65px] w-auto object-contain" />
              </div>
              <div className="text-right">
                <h1 className="text-[26px] font-black text-red-600 m-0 leading-none">Relife Medical Technologies</h1>
                <p className="text-[11px] text-blue-600 font-semibold mt-1 leading-tight">
                  Behind House No.MIG-15, Left to Prasanna Lingeshwara Temple,<br />
                  Near Vijaya Bank Circle, Kuvempunagar, Mysore-570023.
                </p>
                <p className="text-[10px] text-slate-600 mt-1 leading-tight">
                  Mob No-8660095261, 8951585261, 8123828442<br />
                  GSTIN-29DCVPS6218E1ZX, Drug Licence No-KA-MY1-233278/79
                </p>
              </div>
            </div>
            
            {/* Blue Divider */}
            <div className="border-b-[2.5px] border-blue-600 mb-4 w-full"></div>
            
            {/* Agreement details */}
            <div className="flex justify-between font-bold text-red-600 text-[13px] mb-4">
              <span>Agreement No: {rental?.id || "N/A"}</span>
              <span>Date: {formattedStartDate}</span>
            </div>
            
            {/* Document Title */}
            <div className="text-center font-bold text-[15px] text-red-600 underline tracking-wider mb-4 uppercase">
              EQUIPMENT RENTAL AGREEMENT
            </div>
            
            <p className="text-justify mb-4">
              This Equipment Rental Agreement dated <strong>{formattedStartDate}</strong> between the Lessor of the first party <strong>"M/s Relife Medical Technologies, Mysore"</strong> and the Lessee of the second party
            </p>
            
            {/* Customer Details */}
            <div className="mb-4 space-y-1">
              <div>
                <span className="font-bold inline-block w-[140px]">Customer Name:</span>
                <span>{customerName}</span>
              </div>
              <div>
                <span className="font-bold inline-block w-[140px]">Customer Address:</span>
                <span>{customerAddress}, {customerArea ? `${customerArea}, ` : ''}{customerCity}, {customerState} {customerPincode ? `- ${customerPincode}` : ''}</span>
              </div>
              <div>
                <span className="font-bold inline-block w-[140px]">Mobile Numbers:</span>
                <span>{customerPhone}{customerAltPhone ? `, ${customerAltPhone}` : ''}</span>
              </div>
            </div>
            
            <p className="text-justify mb-4">
              The lessor and the Lessee are collectively the parties in consideration of the mutual convenient are promises in this agreement the sufficiency of which the parties acknowledge the Lessor has rented the below equipment to Lessee. The Lessee has hired the equipment from the Lessor on the following terms and conditions.
            </p>
            
            {/* Section 1: Equipment details */}
            <div className="font-bold text-[13px] text-red-600 underline uppercase mb-2">
              EQUIPMENT DETAILS ARE AS FOLLOWS: -
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-slate-800 text-[12px] mb-4">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-800 text-left font-bold text-[11.5px]">
                    <th className="border-r border-slate-800 p-1.5">Equipment Name</th>
                    <th className="border-r border-slate-800 p-1.5 text-center">Hired</th>
                    <th className="border-r border-slate-800 p-1.5">Model</th>
                    <th className="border-r border-slate-800 p-1.5">M/C Sr.No</th>
                    <th className="border-r border-slate-800 p-1.5">Ref.No</th>
                    <th className="p-1.5">Ref.Date</th>
                  </tr>
                </thead>
                <tbody>
                  {finalEquipRows}
                </tbody>
              </table>
            </div>
            
            {/* Section 2: Rent and Deposit details */}
            <div className="font-bold text-[13px] text-red-600 underline uppercase mb-2">
              RENT AND DEPOSIT DETAILS: -
            </div>
            
            <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-slate-800 text-[12px] mb-2">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-800 text-left font-bold text-[11px]">
                  <th className="border-r border-slate-800 p-1.5 w-[220px]">Upfront Charge Details</th>
                  <th className="border-r border-slate-800 p-1.5 w-[120px] text-right">Amount Due</th>
                  <th className="border-r border-slate-800 p-1.5 w-[120px] text-right">Amount Paid</th>
                  <th className="p-1.5">Payment Status</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-800">
                  <td className="border-r border-slate-800 p-1.5 font-bold">{rentLabel}</td>
                  <td className="border-r border-slate-800 p-1.5 text-right">Rs. {rentVal.toLocaleString("en-IN")}</td>
                  <td className="border-r border-slate-800 p-1.5 text-right">Rs. {rentPaidAmount.toLocaleString("en-IN")}</td>
                  <td className="p-1.5">Status: <strong>{rental?.rentalPaymentStatus || 'Not Paid'}</strong></td>
                </tr>
                <tr className="border-b border-slate-800">
                  <td className="border-r border-slate-800 p-1.5 font-bold">Security Deposit</td>
                  <td className="border-r border-slate-800 p-1.5 text-right">Rs. {depositVal.toLocaleString("en-IN")}</td>
                  <td className="border-r border-slate-800 p-1.5 text-right">Rs. {depositPaidAmount.toLocaleString("en-IN")}</td>
                  <td className="p-1.5">Status: <strong>{rental?.depositPaymentStatus || 'Not Paid'}</strong></td>
                </tr>
                
                {selectedAddons.map((item: any, idx: number) => {
                  const itemDue = item.status === "Free of Cost" ? 0 : item.amount;
                  const itemPaid = item.status === "Paid" ? item.amount : 0;
                  return (
                    <tr key={`addon-${idx}`} className="border-b border-slate-800">
                      <td className="border-r border-slate-800 p-1.5 font-bold">{item.name}</td>
                      <td className="border-r border-slate-800 p-1.5 text-right">Rs. {itemDue.toLocaleString("en-IN")}</td>
                      <td className="border-r border-slate-800 p-1.5 text-right">Rs. {itemPaid.toLocaleString("en-IN")}</td>
                      <td className="p-1.5">Status: <strong>{item.status}</strong></td>
                    </tr>
                  );
                })}

                <tr className="border-b border-slate-800 font-bold bg-slate-50">
                  <td className="border-r border-slate-800 p-1.5 font-bold">Total Upfront Amount Due</td>
                  <td className="border-r border-slate-800 p-1.5 text-right">Rs. {totalDue.toLocaleString("en-IN")}</td>
                  <td colSpan={2} className="p-1.5 text-[11px] text-muted-foreground font-normal">Rs. {totalDueWords}</td>
                </tr>
                <tr className="border-b border-slate-800 font-bold bg-slate-100/50 text-emerald-800">
                  <td className="border-r border-slate-800 p-1.5 font-bold">Total Amount Paid</td>
                  <td colSpan={2} className="border-r border-slate-800 p-1.5 text-right pr-4">Rs. {totalPaid.toLocaleString("en-IN")}</td>
                  <td className="p-1.5 text-[11px] font-normal">Rs. {totalPaidWords}</td>
                </tr>
                <tr className={`border-b border-slate-800 font-bold ${balanceDue > 0 ? 'bg-red-50 text-red-800' : 'bg-emerald-50 text-emerald-800'}`}>
                  <td className="border-r border-slate-800 p-1.5 font-bold">Remaining Balance Due</td>
                  <td colSpan={2} className="border-r border-slate-800 p-1.5 text-right pr-4">Rs. {balanceDue.toLocaleString("en-IN")}</td>
                  <td className="p-1.5 text-[11px] font-normal">{balanceDue > 0 ? `Rs. ${balanceDueWords}` : 'Fully Paid'}</td>
                </tr>
                
                <tr className="border-b border-slate-800">
                  <td className="border-r border-slate-800 p-1.5 font-bold">Payment Mode</td>
                  <td colSpan={3} className="p-1.5">
                    {totalPaid > 0 ? (
                      <>
                        {rental?.paymentMode || 'Cash'}
                        {rental?.paymentMode === 'Cash+Bank' && (
                          <span className="font-semibold"> (Cash: ₹{(rental.cashPaidAmount || 0).toLocaleString("en-IN")}, Bank/UPI: ₹{(rental.bankUpiPaidAmount || 0).toLocaleString("en-IN")})</span>
                        )}
                        {rental?.paymentCollectedBy ? ` (Installed By/Payment Collected by: ${rental.paymentCollectedBy})` : ''}
                      </>
                    ) : 'N/A'}
                  </td>
                </tr>
                <tr className="border-b border-slate-800">
                  <td className="border-r border-slate-800 p-1.5 font-bold valign-top">Note:-</td>
                  <td colSpan={3} className="p-1.5">Extra payment is for one-time accessory or personal purchases, non-returnable and non-refundable.</td>
                </tr>
                <tr>
                  <td className="border-r border-slate-800 p-1.5 font-bold">Remarks</td>
                  <td colSpan={3} className="p-1.5">{rental?.remarks || 'N/A'}</td>
                </tr>
              </tbody>
            </table>
            </div>
          </div>

          {/* ════════════════ PAGE 2 ════════════════ */}
          <div className="mx-auto w-full max-w-[794px] bg-white text-slate-900 p-10 shadow-lg border border-slate-200 flex flex-col text-[12px] relative font-sans leading-relaxed">
            <div className="font-bold text-[13px] text-red-600 underline uppercase mb-3">
              HIRING TERMS & CONDITIONS: -
            </div>
            
            <ol className="list-[lower-alpha] pl-5 space-y-2 mb-6 text-justify">
              <li>The Lessor agrees to rent the above equipment to the Lessee, and the Lessee agrees to hire the above equipment from the Lessor in accordance with the terms set out in this agreement.</li>
              <li>This rental term commences from the date of rental agreement and will continue on a month-to-month or day-to-day basis until Lessor or the Lessee terminates this agreement.</li>
              <li>Lessee will have to carry out the machine from the Lessor office at the time of hiring and then Lessee must have to return the equipment to Lessor office on Lessee's own expense after completion of the term.</li>
              <li>Minimum one month rent will be applicable even if machine has returned early in between the rental term.</li>
              <li>Monthly rent should be paid from the Lessee on the term date for each month in advance based.</li>
              <li>First month rent will be taken in advance with the deposit amount.</li>
              <li>The Lessor will refund the deposit amount to Lessee at the end of the rental term.</li>
              <li>If the equipment is not returned or rent not paid from the Lessee, the Lessor has the fully authority to take legal action on Lessee.</li>
              <li>The equipment should be used under the supervision of a licensed physician.</li>
              <li>The Lessor shall not be responsible for any consequential loss directly or indirectly due to sudden cause of device fault / due to faulty operation.</li>
            </ol>
            
            <div className="font-bold text-[13px] text-red-600 underline uppercase mb-3">
              REPAIR OF THE EQUIPMENT: -
            </div>
            
            <ol className="list-[lower-alpha] pl-5 space-y-2 mb-10 text-justify">
              <li>The Lessee must have to carry out the monthly preventive maintenance to keep the equipment in good working condition from the Lessee's own expense.</li>
              <li>The Lessee must have to bear their own expense if any fault/damage occurred due to mishandling of the equipment / due to power fluctuation in the house.</li>
              <li>The Lessor will not carry out any kind of service at Lessee's location / at patient location. The Lessee must have to bring the equipment for service/replacement purpose during the office hours only from 10am to 6pm except Sunday and holidays.</li>
              <li>The Lessee must have to keep one backup Oxygen cylinder / Ups for uninterrupted usage of the equipment on their own expense.</li>
              <li>Lessor shall not be able to provide service 24/7.</li>
            </ol>
            
            {/* Signatures */}
            <div className="flex justify-between items-end mt-auto pt-6 border-t border-slate-100">
              <div className="w-[45%] text-left">
                <span className="font-bold text-red-600 text-[13px]">For Relife Medical Technologies</span>
                <div className="h-16 flex items-end mb-2">
                  <img src="/images/logo.png" alt="Relife Logo" className="h-[38px] w-auto object-contain -rotate-[5deg] opacity-85" />
                </div>
                <span className="font-bold text-red-600 text-[12px]">(Authorized Signatory)</span>
              </div>
              <div className="w-[45%] text-right">
                <span className="font-bold text-[13px]">I agree to the above terms & conditions.</span>
                <div className="h-16 flex items-end justify-end mb-2 pr-4">
                  {finalSignatureUrl ? (
                    <img src={finalSignatureUrl} alt="Customer Signature" className="max-h-[50px] max-w-[150px] object-contain bg-white border border-slate-100 p-0.5 rounded" />
                  ) : (
                    <span className="border-b border-dotted border-slate-600 w-[150px] inline-block h-6"></span>
                  )}
                </div>
                <span className="font-bold text-[12.5px]">Customer Name: {customerName}</span><br />
                <span className="font-bold text-[11px] text-slate-500">Customer Signature</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Rows rendered per page in the rentals history before "Load more". */
const RENTALS_PAGE_SIZE = 50;

function RentalsPage() {
  const dbVersion = useDatabaseTrigger();
  const [search, setSearch] = useState("");
  // PERF: field stays bound to `search`; the filter below runs off the debounced copy.
  const debouncedSearch = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = useState("all");
  // ITEM-16: quick filters over the history - "All / Active / Completed /
  // Pending Dues". These cut across the raw status label (Pending Dues spans
  // Active and Overdue agreements that carry a real unpaid balance), so they
  // are a separate control from the status dropdown rather than more options in it.
  const [quickFilter, setQuickFilter] = useState<"all" | "active" | "completed" | "dues" | "cancelled" | "pending">("all");
  const [activeView, setActiveView] = useState<"list" | "new" | "edit">("list");
  const [editingRental, setEditingRental] = useState<Rental | null>(null);
  // PERF: render the first page only; the rest load on demand.
  const [visibleCount, setVisibleCount] = useState(RENTALS_PAGE_SIZE);
  const [rentalsList, setRentalsList] = useState(() => getRentals());

  const isStaff = typeof window !== "undefined" && localStorage.getItem("medirent-user-role") === "Staff";

  const refresh = () => setRentalsList(getRentals());

  // Scroll position preservation — prevent page jumping to top after dbVersion re-renders
  const pageScrollRef = useRef(0);
  useEffect(() => {
    const onScroll = () => { pageScrollRef.current = window.scrollY; };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const saved = pageScrollRef.current;
    setRentalsList(getRentals());
    // Restore scroll position after React re-renders the updated list
    requestAnimationFrame(() => { window.scrollTo({ top: saved, behavior: "instant" as ScrollBehavior }); });
  }, [dbVersion]);

  const customersList = useMemo(() => getCustomers(), [dbVersion]);

  // PERF: one map lookup per row instead of scanning every customer per row.
  const customersById = useMemo(
    () => new Map<string, any>(customersList.map((c: any) => [c.id, c])),
    [customersList]
  );
  const paymentsForDues = useMemo(() => getPayments(), [dbVersion]);
  const returnsList = useMemo(() => getReturns(), [dbVersion]);
  const equipmentMasterList = useMemo(() => getEquipment(), [dbVersion]);

  /** ITEM-16: real unpaid balance, used by the "Pending Dues" quick filter and
   *  by the Overdue badge - the stored status label alone can be stale. */
  const outstandingByRental = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of rentalsList) {
      map.set(r.id, getRentalOutstandingBalance(r, paymentsForDues));
    }
    return map;
  }, [rentalsList, paymentsForDues]);

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

    const rows = rentalsList.filter((r) => {
      const customer = customersById.get(r.customerId);

      // Same precision fix as the Rent Dues search (ITEM-8): names and places
      // match on word prefix so a name query stops hitting unrelated addresses,
      // while serials and phone digits keep their exact/substring matching.
      const matchesSearch = !q || tokens.every((token) => {
        const tokenDigits = token.replace(/\D/g, "");

        if (wordStartsWith(r.customer, token)) return true;

        const idLower = String(r.id || "").toLowerCase();
        if (idLower.startsWith(token) || (tokenDigits.length >= 2 && idLower.includes(tokenDigits))) return true;

        if (String(r.serial || "").toLowerCase().includes(token)) return true;
        if (Array.isArray(r.equipmentItems) && r.equipmentItems.some((ei: any) => String(ei.serial || "").toLowerCase().includes(token))) return true;
        if (wordStartsWith(r.equipment, token)) return true;

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

      const statusLower = String(r.status || "").toLowerCase().trim();
      const targetFilter = statusFilter.toLowerCase().trim();
      const matchesStatus =
        statusFilter === "all" ||
        (targetFilter === "returned" || targetFilter === "completed"
          ? statusLower === "completed" || statusLower === "returned"
          : statusLower === targetFilter);
      if (!matchesStatus) return false;

      // ITEM-16 quick filters
      if (quickFilter === "active") {
        return r.status === "Active" || r.status === "Overdue";
      }
      if (quickFilter === "completed") {
        return r.status === "Completed" || r.status === "Returned";
      }
      if (quickFilter === "cancelled") {
        return r.status === "Cancelled";
      }
      if (quickFilter === "pending") {
        return r.status === "Pending Approval";
      }
      if (quickFilter === "dues") {
        return (outstandingByRental.get(r.id) || 0) > 0;
      }
      return true;
    });

    // ITEM-16: newest start date first by default. sortLatestFirst() leads on
    // the numeric agreement id and only tie-breaks on the date, which put a
    // back-dated agreement created today above one that actually started later.
    return [...rows].sort((a, b) => {
      const aTime = parseLocalDate(a.start).getTime();
      const bTime = parseLocalDate(b.start).getTime();
      const aValid = !isNaN(aTime);
      const bValid = !isNaN(bTime);
      if (aValid && bValid && aTime !== bTime) return bTime - aTime;
      if (aValid !== bValid) return aValid ? -1 : 1;
      return extractIdNumber(b.id) - extractIdNumber(a.id);
    });
  }, [rentalsList, debouncedSearch, statusFilter, quickFilter, customersById, outstandingByRental]);

  useEffect(() => {
    setVisibleCount(RENTALS_PAGE_SIZE);
  }, [debouncedSearch, statusFilter, quickFilter]);

  const visibleRentals = useMemo(
    () => filteredRentals.slice(0, visibleCount),
    [filteredRentals, visibleCount]
  );
  const hasMoreRentals = filteredRentals.length > visibleCount;

    return (
    <AppShell
      title={activeView === "new" ? "New Rental Agreement" : activeView === "edit" ? "Edit Rental Agreement" : "Rental Agreements"}
      subtitle={activeView === "new" ? "Create a new rental contract" : activeView === "edit" ? "Modify agreement details" : "Create, track and manage all equipment rental contracts"}
      actions={
        activeView === "list" ? (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const headers = ["Customer", "Address", "Equipment", "Rent Date", "Rent Rate", "Deposit", "Return Date", "Status"];
                const rows = rentalsList.map(r => {
                  const cust = customersList.find(c => c.id === r.customerId || (c.name && r.customer && c.name.toLowerCase() === r.customer.toLowerCase()));
                  const fullAddress = cust ? [cust.address, cust.area, cust.city, cust.state, cust.pincode].filter(Boolean).join(", ") : "—";
                  const eqNameWithModel = getRentalEquipmentLabels(r).join(" | ");
                  const rentRateDisplay = (r as any).rentCycle === "Daily" || (r.monthlyRent === 0 && (r.dailyRent ?? 0) > 0)
                    ? `₹${(r.dailyRent ?? 0).toLocaleString("en-IN")}/day`
                    : `₹${(r.monthlyRent ?? 0).toLocaleString("en-IN")}/mo`;

                  return [
                    `${r.customer} (${r.id})`,
                    fullAddress || "—",
                    eqNameWithModel || r.equipment,
                    formatDateDDMMYYYY(r.start),
                    rentRateDisplay,
                    (r.deposit ?? 0).toString(),
                    r.end ? formatDateDDMMYYYY(r.end) : "Ongoing",
                    r.status
                  ];
                });
                downloadExcel("rental_agreements_export.xls", headers, rows, [200, 250, 250, 100, 110, 100, 100, 100]);
                toast.success("Rental agreements log exported successfully.");
              }}
            >
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Export
            </Button>
            <Button size="sm" onClick={() => setActiveView("new")}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              New Agreement
            </Button>
          </>
        ) : null
      }
    >
      {activeView === "new" ? (
        <CreateRentalDialog
          inline
          title="New Rental Agreement"
          onSave={refresh}
          onClose={() => setActiveView("list")}
        />
      ) : activeView === "edit" ? (
        <CreateRentalDialog
          inline
          title="Edit Rental Agreement"
          rental={editingRental!}
          onSave={refresh}
          onClose={() => {
            setActiveView("list");
            setEditingRental(null);
          }}
        />
      ) : (
        <>
          {/* Stats */}
          <div className="mb-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {[
          { l: "Total Agreements", v: rentalsList.length.toString(), icon: FileText,     c: "text-primary",           bg: "bg-primary/10 border-primary/20" },
          { l: "Active",           v: rentalsList.filter(r => r.status === "Active").length.toString(), icon: FileCheck2,   c: "text-success",            bg: "bg-success/10 border-success/20" },
          { l: "Pending Approval", v: rentalsList.filter(r => r.status === "Pending Approval").length.toString(), icon: Clock,      c: "text-warning",            bg: "bg-warning/10 border-warning/20" },
          { l: "Overdue",          v: rentalsList.filter(r => r.status === "Overdue").length.toString(),  icon: AlertTriangle,c: "text-destructive",        bg: "bg-destructive/10 border-destructive/20" },
        ].map((s, i) => (
          <Card key={s.l} className={`hover:shadow-[var(--shadow-elevated)] hover:-translate-y-0.5 transition-all animate-[fade-in_0.4s_ease-out_both] stagger-${i + 1}`}>
            <CardContent className="flex items-center gap-2.5 sm:gap-4 p-3.5 sm:p-5">
              <div className={`metric-icon h-8 w-8 sm:h-10 sm:w-10 shrink-0 ${s.bg}`}>
                <s.icon className={`h-3.5 w-3.5 sm:h-4.5 sm:w-4.5 ${s.c}`} />
              </div>
              <div>
                <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 leading-tight">{s.l}</p>
                <p className={`mt-0.5 font-display text-[18px] sm:text-[22px] font-bold ${s.c}`}>{s.v}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {/* Toolbar */}
          <div className="flex flex-col gap-2 border-b border-border/60 bg-muted/20 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
              <Input
                placeholder="Search agreement, customer, equipment…"
                className="pl-9 h-9 text-[13px] bg-card border-border/50 w-full"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px] h-9 text-[12px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending approval">Pending Approval</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="completed">Completed / Returned</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* ITEM-16: quick filters across the history. Counts are live so the
              operator can see at a glance how much is still open or owing. */}
          <div className="flex gap-1.5 overflow-x-auto border-b border-border/60 bg-muted/10 px-4 py-2">
            {[
              { key: "all",       label: "All",           count: rentalsList.length },
              { key: "active",    label: "Active",        count: rentalsList.filter((r) => r.status === "Active" || r.status === "Overdue").length },
              { key: "completed", label: "Completed",     count: rentalsList.filter((r) => r.status === "Completed" || r.status === "Returned").length },
              { key: "dues",      label: "Pending Dues",  count: rentalsList.filter((r) => (outstandingByRental.get(r.id) || 0) > 0).length },
              ...(rentalsList.some((r) => r.status === "Pending Approval")
                ? [{ key: "pending", label: "Pending Approval", count: rentalsList.filter((r) => r.status === "Pending Approval").length }]
                : []),
              ...(rentalsList.some((r) => r.status === "Cancelled")
                ? [{ key: "cancelled", label: "Cancelled", count: rentalsList.filter((r) => r.status === "Cancelled").length }]
                : []),
            ].map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setQuickFilter(f.key as any)}
                aria-pressed={quickFilter === f.key}
                className={`shrink-0 rounded-full border px-3 py-1 text-[11.5px] font-semibold transition-colors ${
                  quickFilter === f.key
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >
                {f.label}
                <span className={`ml-1.5 tabular-nums ${quickFilter === f.key ? "opacity-80" : "opacity-60"}`}>
                  {f.count}
                </span>
              </button>
            ))}
          </div>

          {/* Desktop Table — hidden on mobile */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Equipment</TableHead>
                  <TableHead>Rent Date</TableHead>
                  <TableHead className="text-right">Rent Rate</TableHead>
                  <TableHead className="text-right">Deposit</TableHead>
                  <TableHead>Return Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-40 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRentals.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="py-12 text-center text-[13px] text-muted-foreground">
                      No agreements match your search or filter.
                    </TableCell>
                  </TableRow>
                )}
                {visibleRentals.map((r) => (
                  <TableRow key={r.id} className="group">
                    <TableCell>
                      <div className="space-y-1">
                        <span className="inline-flex items-center rounded-md bg-primary/8 border border-primary/18 px-2 py-0.5 font-mono text-[11px] font-bold text-primary mb-1">
                          {r.id}
                        </span>
                        <p className="font-semibold text-[13px]">{r.customer}</p>
                        {(() => {
                          const cust = customersList.find(c => c.id === r.customerId || (c.name && r.customer && c.name.toLowerCase() === r.customer.toLowerCase()));
                          const p1 = r.phone || cust?.phone || "";
                          const p2 = r.altPhone || cust?.altPhone || "";
                          const p3 = r.contactNumber3 || cust?.contactNumber3 || "";
                          return (
                            <div className="space-y-0.5 mt-0.5 max-w-[200px]">
                              {(p1 || p2 || p3) && (
                                <div className="flex items-center flex-wrap gap-x-1.5 gap-y-0.5 text-[11px] text-muted-foreground">
                                  {p1 && (
                                    <span className="flex items-center gap-0.5 text-foreground/80">
                                      <Phone className="h-2.5 w-2.5 text-primary shrink-0" />
                                      <a href={`tel:${p1}`} className="hover:underline hover:text-primary">{p1}</a>
                                    </span>
                                  )}
                                  {p2 && (
                                    <span className="text-[11px] text-foreground/80">
                                      <a href={`tel:${p2}`} className="hover:underline hover:text-primary">{p2}</a>
                                    </span>
                                  )}
                                  {p3 && (
                                    <span className="text-[11px] text-foreground/80">
                                      <a href={`tel:${p3}`} className="hover:underline hover:text-primary">{p3}</a>
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const cust = customersList.find(c => c.id === r.customerId || (c.name && r.customer && c.name.toLowerCase() === r.customer.toLowerCase()));
                        if (!cust) return <span className="text-muted-foreground text-[12px]">—</span>;
                        const fullAddress = [cust.address, cust.area, cust.city, cust.state, cust.pincode].filter(Boolean).join(", ");
                        return <p className="text-[12px] text-foreground/80 max-w-[180px] break-words whitespace-normal leading-normal">{fullAddress || "—"}</p>;
                      })()}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const items = getRentalEquipmentDetailedItems(r, equipmentMasterList, returnsList, false);
                        const isCompleted = r.status === "Completed" || (items.length > 0 && items.every(it => it.returned));
                        return (
                          <div className="space-y-1.5 max-w-[220px]">
                            {items.map((it, idx) => {
                              const strikeItem = it.returned && !isCompleted;
                              return (
                                <div key={idx} className="flex items-center gap-1.5 flex-wrap">
                                  <span className={strikeItem ? "line-through text-muted-foreground/60 text-[12px] font-medium" : "text-[12.5px] text-foreground/80 leading-normal font-medium"}>
                                    {it.label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground whitespace-nowrap">
                        <CalendarDays className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                        {formatDateDDMMYY(r.start)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {(() => {
                        const items = getRentalEquipmentDetailedItems(r, equipmentMasterList, returnsList, false);
                        const hasPartialReturn = items.length > 1 && items.some(it => it.returned) && !items.every(it => it.returned);

                        if (!hasPartialReturn) {
                          return (r as any).rentCycle === "Daily" || (r.monthlyRent === 0 && (r.dailyRent ?? 0) > 0) ? (
                            <p className="font-display text-[14px] font-bold">₹{(r.dailyRent ?? 0).toLocaleString("en-IN")}/day</p>
                          ) : (
                            <p className="font-display text-[14px] font-bold">₹{r.monthlyRent.toLocaleString("en-IN")}/mo</p>
                          );
                        }

                        const isCompleted = r.status === "Completed" || (items.length > 0 && items.every(it => it.returned));
                        const eqItems = Array.isArray(r.equipmentItems) ? r.equipmentItems : [];

                        return (
                          <div className="space-y-1 font-display text-[13px] font-bold">
                            {items.map((it, idx) => {
                              const eqItem = eqItems.find((e: any) => e.equipmentId === it.equipmentId);
                              const isDaily = (eqItem?.rentCycle === "Daily") || ((r as any).rentCycle === "Daily") || (r.monthlyRent === 0 && (r.dailyRent ?? 0) > 0);
                              
                              let itemRate: number | undefined = undefined;
                              if (eqItem) {
                                itemRate = isDaily ? (eqItem.dailyRent || eqItem.rentRate) : (eqItem.monthlyRent || eqItem.rentRate);
                              }
                              
                              const finalRate = itemRate !== undefined && itemRate !== null && !isNaN(Number(itemRate)) && Number(itemRate) > 0
                                ? Number(itemRate)
                                : (isDaily ? Math.round((r.dailyRent ?? 0) / items.length) : Math.round(r.monthlyRent / items.length));
                                
                              const rateLabel = isDaily ? `₹${finalRate.toLocaleString("en-IN")}/day` : `₹${finalRate.toLocaleString("en-IN")}/mo`;
                              const strikeItem = it.returned && !isCompleted;

                              return (
                                <div key={idx} className={strikeItem ? "line-through text-muted-foreground/60 text-[12px] font-medium" : "text-foreground font-bold"}>
                                  {rateLabel}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="text-right">
                      {(() => {
                        const items = getRentalEquipmentDetailedItems(r, equipmentMasterList, returnsList, false);
                        const hasPartialReturn = items.length > 1 && items.some(it => it.returned) && !items.every(it => it.returned);

                        if (!hasPartialReturn) {
                          return (
                            <span className="text-[13px] font-semibold text-muted-foreground">₹{(r.deposit ?? 0).toLocaleString("en-IN")}</span>
                          );
                        }

                        const isCompleted = r.status === "Completed" || (items.length > 0 && items.every(it => it.returned));
                        const eqItems = Array.isArray(r.equipmentItems) ? r.equipmentItems : [];

                        return (
                          <div className="space-y-1 text-[13px] font-semibold">
                            {items.map((it, idx) => {
                              const eqItem = eqItems.find((e: any) => e.equipmentId === it.equipmentId);
                              let itemDep: number | undefined = undefined;
                              if (eqItem) {
                                itemDep = eqItem.deposit !== undefined ? eqItem.deposit : eqItem.securityDeposit;
                              }
                              const finalDep = itemDep !== undefined && itemDep !== null && !isNaN(Number(itemDep))
                                ? Number(itemDep)
                                : Math.round((r.deposit ?? 0) / items.length);

                              const strikeItem = it.returned && !isCompleted;

                              return (
                                <div key={idx} className={strikeItem ? "line-through text-muted-foreground/60 text-[12px] font-medium" : "text-muted-foreground font-semibold"}>
                                  ₹{finalDep.toLocaleString("en-IN")}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {(() => {
                        const items = getRentalEquipmentDetailedItems(r, equipmentMasterList, returnsList, false);
                        const isCompleted = r.status === "Completed" || (items.length > 0 && items.every(it => it.returned));
                        if (items.length <= 1) {
                          const single = items[0];
                          if (single?.returned) {
                            const retDate = single.returnedDate || r.end;
                            return (
                              <span className="text-[12px] font-semibold text-rose-600 whitespace-nowrap">
                                {retDate ? formatDateDDMMYY(retDate) : (r.end ? formatDateDDMMYY(r.end) : "Completed")}
                              </span>
                            );
                          }
                          return (
                            <span className="text-[12px] font-semibold text-emerald-600 whitespace-nowrap">
                              {r.end ? formatDateDDMMYY(r.end) : "Ongoing"}
                            </span>
                          );
                        }

                        // If all equipments are ongoing, show single Ongoing in green
                        const allOngoing = items.every(it => !it.returned);
                        if (allOngoing) {
                          return (
                            <span className="text-[12px] font-semibold text-emerald-600 whitespace-nowrap">
                              {r.end ? formatDateDDMMYY(r.end) : "Ongoing"}
                            </span>
                          );
                        }

                        // If all equipments are returned and have the same date, show single return date in red
                        const allReturned = items.every(it => it.returned);
                        if (allReturned) {
                          const dates = items.map(it => it.returnedDate ? formatDateDDMMYY(it.returnedDate) : (r.end ? formatDateDDMMYY(r.end) : "Completed"));
                          const firstDate = dates[0];
                          if (dates.every(d => d === firstDate)) {
                            return (
                              <span className="text-[12px] font-semibold text-rose-600 whitespace-nowrap">
                                {firstDate}
                              </span>
                            );
                          }
                        }

                        return (
                          <div className="space-y-1">
                            {items.map((it, idx) => (
                              <div key={idx} className="text-[12px]">
                                {it.returned ? (
                                  <span className="font-semibold text-rose-600 whitespace-nowrap">
                                    {it.returnedDate ? formatDateDDMMYY(it.returnedDate) : (r.end ? formatDateDDMMYY(r.end) : "Returned")}
                                  </span>
                                ) : (
                                  <span className="font-semibold text-emerald-600 whitespace-nowrap">
                                    Ongoing
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </TableCell>
                    <TableCell><StatusBadge status={r.status} /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 transition-opacity">
                        {(r.latitude || r.locationAddress) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50/50"
                            title="Directions / Map Link"
                            onClick={() => {
                              const lat = Number(r.latitude) || 0;
                              const lon = Number(r.longitude) || 0;
                              const addr = (r.locationAddress as string) || "";
                              const url = getDirectionsUrl(lat, lon, addr);
                              if (url) {
                                window.open(url, "_blank");
                              } else {
                                toast.error("No valid map directions link available.");
                              }
                            }}
                          >
                            <MapPin className="h-3.5 w-3.5" />
                          </Button>
                        )}
                                                {/* Bug 7 fix: Edit button for each rental agreement */}
                        {!isStaff && r.status !== "Cancelled" && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10" 
                            title="Edit Agreement"
                            onClick={() => {
                              setEditingRental(r);
                              setActiveView("edit");
                            }}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <AgreementPreviewDialog
                          rental={r}
                          onApproveSuccess={refresh}
                          trigger={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
                              title="View/Preview Agreement"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          }
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
                          title="Download PDF"
                          onClick={() => {
                            downloadAgreementFile(r);
                            toast.success(`PDF agreement for ${r.id} downloaded.`);
                          }}
                        >
                          <FileText className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                          title={`Send WhatsApp to ${r.customer}`}
                          onClick={() => sendWhatsAppDocument(r, customersList)}
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10" title="Email" onClick={() => toast.success(`Agreement emailed successfully to ${r.customer}.`)}>
                          <Mail className="h-3.5 w-3.5" />
                        </Button>
                        {!isStaff && r.status === "Pending Approval" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border border-emerald-200"
                            title="Approve Agreement"
                            onClick={() => {
                              approveRental(r.id);
                              refresh();
                              toast.success(`Agreement ${r.id} approved successfully!`);
                            }}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {!isStaff && r.status !== "Completed" && r.status !== "Returned" && r.status !== "Cancelled" && (
                          <CancelRentalDialog
                            rental={r}
                            onCancel={refresh}
                            trigger={
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10" title="Cancel">
                                <XCircle className="h-3.5 w-3.5" />
                              </Button>
                            }
                          />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card List */}
          <div className="md:hidden">
            {filteredRentals.length === 0 ? (
              <div className="py-12 text-center text-[13px] text-muted-foreground">
                No agreements match your search or filter.
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {visibleRentals.map((r) => (
                  <div key={r.id} className="px-4 py-3.5 active:bg-muted/30 transition-colors">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <span className="inline-flex items-center rounded-md bg-primary/8 border border-primary/18 px-2 py-0.5 font-mono text-[11px] font-bold text-primary">
                          {r.id}
                        </span>
                        <p className="font-semibold text-[13.5px] mt-1">{r.customer}</p>
                        {(() => {
                          const cust = customersList.find(c => c.id === r.customerId || (c.name && r.customer && c.name.toLowerCase() === r.customer.toLowerCase()));
                          const p1 = r.phone || cust?.phone || "";
                          const p2 = r.altPhone || cust?.altPhone || "";
                          const p3 = r.contactNumber3 || cust?.contactNumber3 || "";
                          return (p1 || p2 || p3) ? (
                            <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 mt-0.5 text-[11px] text-muted-foreground">
                              {p1 && (
                                <span className="flex items-center gap-0.5 text-foreground/80">
                                  <Phone className="h-2.5 w-2.5 text-primary shrink-0" />
                                  <a href={`tel:${p1}`} className="hover:underline">{p1}</a>
                                </span>
                              )}
                              {p2 && (
                                <span className="text-foreground/80">
                                  <a href={`tel:${p2}`} className="hover:underline">{p2}</a>
                                </span>
                              )}
                              {p3 && (
                                <span className="text-foreground/80">
                                  <a href={`tel:${p3}`} className="hover:underline">{p3}</a>
                                </span>
                              )}
                            </div>
                          ) : null;
                        })()}
                      </div>
                      <StatusBadge status={r.status} />
                    </div>
                    <div className="space-y-1 mb-2">
                      {(() => {
                        const items = getRentalEquipmentDetailedItems(r, equipmentMasterList, returnsList, false);
                        const isCompleted = r.status === "Completed" || (items.length > 0 && items.every(it => it.returned));
                        return items.map((it, idx) => {
                          const strikeItem = it.returned && !isCompleted;
                          return (
                            <div key={idx} className="flex items-center gap-1.5 flex-wrap">
                              <span className={strikeItem ? "line-through text-muted-foreground/60 text-[12px]" : "text-[12px] text-muted-foreground font-medium"}>
                                {it.label}
                              </span>
                            </div>
                          );
                        });
                      })()}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="info-row whitespace-nowrap">
                        <CalendarDays className="h-3 w-3 shrink-0" />
                        {formatDateDDMMYY(r.start)}
                      </span>
                      <span className="info-row font-semibold text-foreground">
                        {(r as any).rentCycle === "Daily" || (r.monthlyRent === 0 && (r.dailyRent ?? 0) > 0) ? `₹${(r.dailyRent ?? 0).toLocaleString("en-IN")}/day` : `₹${r.monthlyRent.toLocaleString("en-IN")}/mo`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2.5">
                      <AgreementPreviewDialog
                        rental={r}
                        onApproveSuccess={refresh}
                        trigger={
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-[11px] px-2 text-slate-600 hover:text-slate-800 border-slate-200 bg-slate-50/50 hover:bg-slate-50 shrink-0"
                            title="View Agreement"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" /> View
                          </Button>
                        }
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-[11px] px-2.5"
                        onClick={() => {
                          downloadAgreementFile(r);
                          toast.success(`PDF for ${r.id} downloaded.`);
                        }}
                      >
                        <FileText className="h-3 w-3 mr-1" /> PDF
                      </Button>
                      {!isStaff && r.status === "Pending Approval" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[11px] px-2.5 text-emerald-600 border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50"
                          onClick={() => {
                            approveRental(r.id);
                            refresh();
                            toast.success(`Agreement ${r.id} approved successfully!`);
                          }}
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Approve
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* PERF: incremental rendering - only a page of rows mounts at a time */}
          {hasMoreRentals && (
            <div className="flex items-center justify-center gap-3 border-t border-border/60 py-4">
              <span className="text-[12px] text-muted-foreground">
                Showing {visibleRentals.length} of {filteredRentals.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setVisibleCount((n) => n + RENTALS_PAGE_SIZE)}
              >
                Load more
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

              </>
      )}

      {/* Mobile FAB */}
      {activeView === "list" && (
        <button className="fab md:hidden" onClick={() => setActiveView("new")}>
          <Plus className="h-5 w-5" />
          New Agreement
        </button>
      )}
    </AppShell>
  );
}

function Field({ label, placeholder, type = "text", className, defaultValue }: {
  label: string; placeholder?: string; type?: string; className?: string; defaultValue?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</Label>
      <Input type={type} placeholder={placeholder} defaultValue={defaultValue} />
    </div>
  );
}

function ReadOnlyField({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={`space-y-1 ${className ?? ""}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-[13px] font-medium text-foreground">{value}</p>
    </div>
  );
}