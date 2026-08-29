import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo, useRef } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { AppShell, StatusBadge } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Plus, Search, Download, Upload, Phone, MapPin,
  UserCheck, UserX, Edit, Eye, Trash2,
  Mail, MapPinned, Hash, Users, Clock, Filter,
  AlertTriangle, FolderOpen, FileCheck2, FileImage, FileText,
  FileDigit, Receipt, ChevronRight, CreditCard, CheckCircle2,
  ShieldCheck, ShieldAlert,
} from "lucide-react";
import { ImportCsvDialog, type ImportColumn } from "@/components/ImportCsvDialog";
import { customers } from "@/lib/mock-data";
import {
  getCustomers,
  saveCustomer,
  deleteCustomer,
  getRentals,
  getPayments,
  getDocuments,
  getReturns,
  downloadAgreementFile,
  downloadFile,
  downloadExcel,
  printReceipt,
  printDocumentFile,
  downloadBase64File,
  saveDocument,
  deleteDocument,
  useDatabaseTrigger,
  getNextCustomerNumber,
  getNextDocumentNumber,
  getDocumentWithFile,
  getCustomerDueBalance,
  savePayment,
  saveReturn,
  getNextPaymentNumber,
  getLocalYYYYMMDD,
  formatDateDDMMYYYY,
  getDocumentPreviewUrl,
  getGeneratedDocumentHtml,
  sortLatestFirst,
  extractIdNumber,
  getRentalEquipmentDetailedItems,
  getEquipment,
} from "@/lib/data-store";
import { asText, capitalizeWords } from "@/lib/utils";
import { AgreementPreviewDialog } from "./rentals";

export const Route = createFileRoute("/customers")({
  head: () => ({ meta: [{ title: "Customers — Relife" }] }),
  component: CustomersPage,
});

type Customer = typeof customers[number];

/** Rows rendered per page in the customer list before "Load more". */
const PAGE_SIZE = 50;

// Derive avatar color from index — unified hues from design system
const avatarHues = [
  "bg-primary/15 text-primary",
  "bg-accent/15 text-accent",
  "bg-success/12 text-success",
  "bg-warning/15 text-warning-foreground",
  "bg-destructive/12 text-destructive",
  "bg-muted text-muted-foreground",
];

// Bulk-import column mapping — mirrors the fields on CustomerFormDialog
const customerImportColumns: ImportColumn[] = [
  { key: "name", label: "Name", required: true, aliases: ["Customer Name", "Full Name"] },
  { key: "phone", label: "Primary Number", required: true, aliases: ["Phone", "Primary Phone", "Mobile"] },
  { key: "altPhone", label: "Alternative Phone", aliases: ["Alt Phone"] },
  { key: "contactNumber3", label: "Alternative Phone 1", aliases: ["Alt Phone 1"] },
  { key: "email", label: "Email" },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "pincode", label: "Pincode" },
  { key: "area", label: "Area" },
  { key: "address", label: "Address" },
  { key: "aadhaar", label: "Aadhaar" },
  { key: "pan", label: "PAN" },
  { key: "notes", label: "Notes" },
];

function importCustomerRow(row: Record<string, string>): { ok: boolean; error?: string } {
  const name = (row.name || "").trim();
  if (!name) return { ok: false, error: "Missing customer name" };

  const phoneDigits = String(row.phone || "").replace(/\D/g, "");
  if (phoneDigits.length !== 10) return { ok: false, error: `${name}: Primary Number must be exactly 10 digits` };

  const altPhoneDigits = String(row.altPhone || "").replace(/\D/g, "");
  if (altPhoneDigits && altPhoneDigits.length !== 10) return { ok: false, error: `${name}: Alternative Phone must be exactly 10 digits` };

  const contactNumber3Digits = String(row.contactNumber3 || "").replace(/\D/g, "");
  if (contactNumber3Digits && contactNumber3Digits.length !== 10) return { ok: false, error: `${name}: Alternative Phone 1 must be exactly 10 digits` };

  // ITEM-4: names may repeat across customers - only the phone number is unique.
  const phoneOwner = getCustomers().find(
    (c) => String(c.phone || "").replace(/\D/g, "") === phoneDigits
  );
  if (phoneOwner) {
    return { ok: false, error: `${name}: phone number already registered to "${phoneOwner.name}" (${phoneOwner.id})` };
  }

  saveCustomer({
    id: getNextCustomerNumber(),
    name,
    phone: phoneDigits,
    altPhone: altPhoneDigits,
    contactNumber3: contactNumber3Digits,
    email: row.email || "",
    city: (row.city || "Mysore").trim(),
    state: (row.state || "Karnataka").trim(),
    pincode: row.pincode || "",
    address: row.address || "No address provided",
    area: row.area || "",
    aadhaar: row.aadhaar || "",
    pan: row.pan || "",
    rentals: 0,
    status: "Active",
    notes: row.notes || "",
  });
  return { ok: true };
}

// Seeding this form straight from the stored record put a *number* where every
// save validation expects a string (see asText), so `phone.trim()` threw a
// TypeError after setIsSubmitting(true) and outside any catch: "Save Customer"
// did nothing, raised no error, and stayed greyed out - which also meant the
// ID-proof adds/removes queued in the dialog were never applied.
function CustomerFormDialog({
  trigger,
  title,
  customer,
  onSave,
}: {
  trigger: React.ReactNode;
  title: string;
  customer?: Customer;
  onSave?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(asText(customer?.name));
  const [phone, setPhone] = useState(asText(customer?.phone));
  const [altPhone, setAltPhone] = useState(asText(customer?.altPhone));
  const [contactNumber3, setContactNumber3] = useState(asText(customer?.contactNumber3));
  const [email, setEmail] = useState(asText(customer?.email));
  const [aadhaar, setAadhaar] = useState(asText(customer?.aadhaar).replace(/\D/g, "").slice(0, 12));
  const [pan, setPan] = useState(asText(customer?.pan));
  const [address, setAddress] = useState(asText(customer?.address));
  const [area, setArea] = useState(asText(customer?.area));
  const [city, setCity] = useState(asText(customer?.city) || "Mysore");
  const [state, setState] = useState(asText(customer?.state) || "Karnataka");
  const [pincode, setPincode] = useState(asText(customer?.pincode));
  const [notes, setNotes] = useState(asText(customer?.notes));
  const [selectedFiles, setSelectedFiles] = useState<Array<{ id?: string; name: string; size: string; fileData?: string; isExisting?: boolean; missing?: boolean }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // ID proofs the user removed in this dialog. Held in a ref, not state: it is
  // never rendered, and the async ID-proof loader below has to read the *live*
  // value from inside a promise callback without a stale closure.
  const removedDocIdsRef = useRef<Set<string>>(new Set());
  // Bumped on every open so a slow load from a previous open can be discarded.
  const docLoadTokenRef = useRef(0);
  const [loadingDocs, setLoadingDocs] = useState(false);
  // FileReader is async. Selecting a file and immediately hitting Save used to
  // drop it silently, because it had not been read into `selectedFiles` yet.
  const [pendingReads, setPendingReads] = useState(0);

  useEffect(() => {
    if (open) {
      setName(asText(customer?.name));
      setPhone(asText(customer?.phone));
      setAltPhone(asText(customer?.altPhone));
      setContactNumber3(asText(customer?.contactNumber3));
      setEmail(asText(customer?.email));
      setAadhaar(asText(customer?.aadhaar).replace(/\D/g, "").slice(0, 12));
      setPan(asText(customer?.pan));
      setAddress(asText(customer?.address));
      setArea(asText(customer?.area));
      setCity(asText(customer?.city) || "Mysore");
      setState(asText(customer?.state) || "Karnataka");
      setPincode(asText(customer?.pincode));
      setNotes(asText(customer?.notes));
      setSelectedFiles([]);
      removedDocIdsRef.current = new Set();
      setIsSubmitting(false);
      setPendingReads(0);
      setLoadingDocs(false);

      // KYC-EDIT FIX: saved ID proofs load asynchronously, and for customers
      // whose files are not cached in this browser's IndexedDB yet (i.e. every
      // older record on a fresh device) getDocumentWithFile() has to pull the
      // file chunks back from Google Sheets - seconds, sometimes longer while
      // the 15s row sync and the background file backup are using the same
      // Apps Script endpoint. The old code showed an *empty* upload zone for
      // that whole window and then hard-replaced `selectedFiles` when the
      // download landed, throwing away every file the user had attached or
      // deleted in the meantime. That is why adding/removing KYC documents on
      // older customers looked like it did nothing.
      //
      // Now: the dialog says it is still loading (so nothing looks empty), the
      // arriving documents are *merged* instead of replacing the list, entries
      // the user already deleted are not resurrected, and a response from a
      // previous open is dropped via the token.
      const loadToken = ++docLoadTokenRef.current;
      if (customer?.id) {
        const custId = customer.id;
        try {
          const docs = getDocuments().filter((d: any) => d.customerId === custId && d.type === "ID Proof");
          if (docs.length > 0) {
            setLoadingDocs(true);
            Promise.all(
              docs.map((d: any) =>
                // One unreadable file must not blank the whole list: fall back
                // to metadata-only so it still renders (and can be deleted).
                getDocumentWithFile(d).catch(() => ({ ...d, fileData: "NOT_FOUND" }))
              )
            )
              .then((fullDocs) => {
                if (docLoadTokenRef.current !== loadToken) return;
                setSelectedFiles((prev) => {
                  const alreadyListed = new Set(prev.map((f) => f.id).filter(Boolean) as string[]);
                  const loaded = (fullDocs as any[])
                    .filter((d) => !alreadyListed.has(d.id) && !removedDocIdsRef.current.has(d.id))
                    .map((d) => ({
                      id: d.id,
                      name: d.name,
                      size: d.size,
                      fileData: d.fileData !== "NOT_FOUND" ? d.fileData : undefined,
                      isExisting: true,
                      missing: d.fileData === "NOT_FOUND",
                    }));
                  // Saved documents first, then anything attached while loading.
                  return [...loaded, ...prev];
                });
              })
              .catch((err) => {
                console.error("[Customers] Failed to load saved ID proofs:", err);
                toast.error("Could not load this customer's saved ID proofs. Check your connection before deleting or replacing them.");
              })
              .finally(() => {
                if (docLoadTokenRef.current === loadToken) setLoadingDocs(false);
              });
          }
        } catch (_e) { /* ignore */ }
      }
    }
    // ITEM-3 FIX: depend on the customer's *id*, not the object identity.
    // getCustomers() re-parses from localStorage on every call, so each parent
    // render handed down a brand-new object; with `customer` in the dep array
    // this effect re-fired mid-edit and reset every field (and re-fetched the
    // ID proofs, discarding files the user had just attached).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, customer?.id]);

  // The actual save. Split out of handleSave so the in-flight flag is owned by
  // a single finally: every early return below is then safe by construction,
  // and an unexpected throw can no longer strand the Save button as disabled.
  const commitCustomer = () => {
    if (!name.trim()) {
      toast.error("Please enter the customer's full name.");
      return;
    }
    if (!phone.trim()) {
      toast.error("Please enter a primary phone number.");
      return;
    }

    const isValidPhone = (p: string) => {
      const digits = p.replace(/\D/g, "");
      return digits.length === 10;
    };

    if (!isValidPhone(phone)) {
      toast.error("Primary Phone Number must be exactly 10 digits.");
      return;
    }

    if (altPhone.trim() && !isValidPhone(altPhone)) {
      toast.error("Alternative Phone Number must be exactly 10 digits.");
      return;
    }

    if (contactNumber3.trim() && !isValidPhone(contactNumber3)) {
      toast.error("Alternative Phone 1 must be exactly 10 digits.");
      return;
    }

    if (aadhaar.trim()) {
      const aadhaarDigits = aadhaar.replace(/\D/g, "").slice(0, 12);
      if (aadhaarDigits.length > 0 && aadhaarDigits.length !== 12) {
        toast.error("Aadhaar Number must contain exactly 12 digits.");
        return;
      }
    }

    if (!city.trim()) {
      toast.error("Please enter the customer's city.");
      return;
    }
    if (!state) {
      toast.error("Please select the customer's state.");
      return;
    }

    // ITEM-4: a shared name is legitimate (families, common names) - customers
    // are identified by their CUST-XXXX id and phone number, not their name.
    // So a name clash is informational only; only an exact phone clash blocks.
    const normalizedName = name.trim().toLowerCase();
    const normalizedPhone = phone.replace(/\D/g, "");
    const others = getCustomers().filter((c) => c.id !== customer?.id);

    const phoneOwner = others.find(
      (c) => String(c.phone || "").replace(/\D/g, "") === normalizedPhone
    );
    if (phoneOwner) {
      toast.error(
        `This phone number is already registered to "${phoneOwner.name}" (${phoneOwner.id}). Please use a different number.`
      );
      return;
    }

    const nameTwin = others.find(
      (c) => (c.name || "").trim().toLowerCase() === normalizedName
    );
    if (nameTwin) {
      toast.info(
        `Customer with this name already exists (${nameTwin.id}). Saving as a separate record.`
      );
    }

    const id = customer?.id || getNextCustomerNumber();
    const newCustomer = {
      // ITEM-3 FIX: spread the existing record first so fields this form does
      // not render (createdAt, sheet-sync metadata, future columns) survive an
      // edit instead of being silently dropped on save.
      ...(customer || {}),
      id,
      name: name.trim(),
      phone: phone.trim(),
      altPhone,
      contactNumber3,
      email,
      city: city.trim(),
      state: state,
      pincode: pincode,
      address: address || "No address provided",
      area: area.trim(),
      aadhaar: aadhaar.replace(/\D/g, "").slice(0, 12),
      pan,
      rentals: customer?.rentals || 0,
      status: customer?.status || "Active",
      notes,
    };
    // ITEM-3 FIX: setStorageItem re-throws on QuotaExceededError. Without this
    // guard the throw escaped handleSave, so isSubmitting stayed true and the
    // Save button stayed disabled forever - the "edit silently does nothing"
    // symptom. Now the failure surfaces and the form stays usable.
    try {
      saveCustomer(newCustomer);
    } catch (err) {
      console.error("[Customers] Failed to save customer:", err);
      toast.error("Could not save the customer. Storage may be full - export a backup from Settings and try again.");
      return;
    }

    // Remove ID proofs the user deleted from this dialog. A failure here used
    // to be console-only, so a delete that did not happen still reported
    // "saved successfully" - it is counted and surfaced now.
    let failedDeletes = 0;
    removedDocIdsRef.current.forEach((docId) => {
      try {
        deleteDocument(docId);
      } catch (err) {
        failedDeletes++;
        console.error("[Customers] Failed to remove ID proof", docId, err);
      }
    });
    removedDocIdsRef.current = new Set();

    // Save newly uploaded ID proofs. A failure here must not roll back the
    // customer record that already saved - report it and keep the rest.
    let failedUploads = 0;
    selectedFiles.forEach((file) => {
      if (!file.isExisting && file.fileData) {
        try {
          const docId = getNextDocumentNumber();
          saveDocument({
            id: docId,
            name: file.name,
            type: "ID Proof",
            size: file.size,
            date: getLocalYYYYMMDD(),
            customerId: id,
            fileData: file.fileData,
          });
        } catch (err) {
          failedUploads++;
          console.error("[Customers] Failed to save ID proof", file.name, err);
        }
      }
    });

    if (failedUploads > 0) {
      toast.error(`Customer saved, but ${failedUploads} ID proof file(s) could not be stored. Storage may be full.`);
    } else if (failedDeletes > 0) {
      toast.error(`Customer saved, but ${failedDeletes} ID proof file(s) could not be deleted. Please try again.`);
    } else {
      toast.success(customer ? `Customer details for "${name}" saved successfully.` : "New customer created successfully.");
    }
    setOpen(false);
    if (onSave) onSave();
  };

  const handleSave = () => {
    if (isSubmitting) return;

    // KYC-EDIT FIX: FileReader had not finished yet, so the attachment is not
    // in `selectedFiles`. Saving now would silently drop it.
    if (pendingReads > 0) {
      toast.info("Still reading the selected file(s) - please try again in a moment.");
      return;
    }
    // Saving before the customer's saved ID proofs have loaded would let a
    // half-known document list drive the delete/keep decisions below.
    if (loadingDocs) {
      toast.info("Still loading this customer's saved ID proofs - please wait a moment.");
      return;
    }

    setIsSubmitting(true);
    try {
      commitCustomer();
    } catch (err) {
      // A throw escaping here used to leave isSubmitting stuck at true, which
      // disables the Save button for as long as the dialog stays open - an edit
      // that silently refuses to save and gives the operator nothing to act on.
      console.error("[Customers] Unexpected failure while saving customer:", err);
      toast.error("Something went wrong while saving this customer - nothing was changed.", {
        description: err instanceof Error ? err.message : String(err),
        duration: 12000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFilesAdded = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);

    setPendingReads((n) => n + fileArray.length);

    fileArray.forEach((file) => {
      const sizeKB = (file.size / 1024).toFixed(1);
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedFiles((prev) => [
          ...prev,
          {
            name: file.name,
            size: `${sizeKB} KB`,
            fileData: reader.result as string,
            isExisting: false,
          },
        ]);
      };
      // A read that fails must not leave Save blocked forever on a pending
      // counter that never comes back down.
      reader.onerror = () => {
        console.error("[Customers] Failed to read ID proof file", file.name, reader.error);
        toast.error(`Could not read "${file.name}". Please try selecting it again.`);
      };
      reader.onloadend = () => setPendingReads((n) => Math.max(0, n - 1));
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index: number) => {
    const fileToRemove = selectedFiles[index];
    if (fileToRemove?.isExisting && fileToRemove.id) {
      removedDocIdsRef.current.add(fileToRemove.id);
    }
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <Field label="Full Name" required placeholder="Patient or guardian name" className="sm:col-span-2" value={name} onChange={(e) => setName(capitalizeWords(e.target.value))} />
            
            <div className="sm:col-span-2 border-b border-border/40 pb-1 mt-2">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-primary">Address Details</h4>
            </div>
            <Field label="Address" placeholder="Full address" value={address} onChange={(e) => setAddress(capitalizeWords(e.target.value))} />
            <Field label="Area" placeholder="Area / Locality" value={area} onChange={(e) => setArea(capitalizeWords(e.target.value))} />
            <Field label="City" value={city} onChange={(e) => setCity(capitalizeWords(e.target.value))} />
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">State</Label>
              <Select value={state} onValueChange={setState}>
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {["Karnataka"].map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Field label="Pincode" value={pincode} onChange={(e) => setPincode(e.target.value)} />

            <div className="sm:col-span-2 border-b border-border/40 pb-1 mt-2">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-primary">Contact Details</h4>
            </div>
            <Field 
              label="Primary Number"
              required      
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
              label="Alternative Phone" 
              placeholder="optional (10 digits)"                
              value={altPhone} 
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "");
                if (digits.length > 10) {
                  if (digits.startsWith("91")) setAltPhone(digits.slice(-10));
                  else if (digits.startsWith("0")) setAltPhone(digits.slice(-10));
                  else setAltPhone(digits.slice(0, 10));
                } else {
                  setAltPhone(digits);
                }
              }} 
              maxLength={14}
            />
            <Field 
              label="Alternative Phone 1"  
              placeholder="optional (10 digits)"                
              value={contactNumber3} 
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "");
                if (digits.length > 10) {
                  if (digits.startsWith("91")) setContactNumber3(digits.slice(-10));
                  else if (digits.startsWith("0")) setContactNumber3(digits.slice(-10));
                  else setContactNumber3(digits.slice(0, 10));
                } else {
                  setContactNumber3(digits);
                }
              }} 
              maxLength={14}
            />
            <Field label="Email" placeholder="email@domain.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            
            <div className="sm:col-span-2 border-b border-border/40 pb-1 mt-2">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-primary">Government Verification</h4>
            </div>
            <Field 
              label="Aadhaar Number"    
              placeholder="12-digit Aadhaar number"         
              value={aadhaar} 
              onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, "").slice(0, 12))} 
              maxLength={12}
            />
            <Field label="PAN Number" placeholder="ABCDE1234F" value={pan} onChange={(e) => setPan(e.target.value)} />
            
            <div className="sm:col-span-2 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  ID Proof Uploads {selectedFiles.length > 0 && <span className="text-primary font-bold normal-case">({selectedFiles.length} file{selectedFiles.length === 1 ? "" : "s"})</span>}
                  {loadingDocs && <span className="text-muted-foreground font-medium normal-case"> · loading saved files…</span>}
                </Label>
                {(selectedFiles.length > 0 || loadingDocs) && (
                  <label className="text-[11px] font-medium text-primary hover:underline cursor-pointer flex items-center gap-1">
                    <Plus className="h-3 w-3" /> Add More Files
                    {/* Clearing the value is what makes re-picking the *same*
                        file work: without it the input's value is unchanged so
                        the browser never fires change again - deleting a
                        document and re-uploading it did nothing at all. */}
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/*"
                      className="hidden"
                      onChange={(e) => { handleFilesAdded(e.target.files); e.target.value = ""; }}
                    />
                  </label>
                )}
              </div>

              {selectedFiles.length === 0 && loadingDocs ? (
                <div className="flex items-center justify-center gap-2 w-full h-24 border-2 border-dashed border-border/70 rounded-xl bg-muted/20 text-muted-foreground">
                  <Clock className="h-4 w-4 animate-pulse" />
                  <p className="text-[12.5px] font-medium">Loading saved ID proofs…</p>
                </div>
              ) : selectedFiles.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[160px] overflow-y-auto p-1 border border-border/40 rounded-xl bg-muted/10">
                  {selectedFiles.map((file, idx) => {
                    const isImage = file.fileData?.startsWith("data:image/") || /\.(jpg|jpeg|png|webp)$/i.test(file.name);
                    return (
                      <div key={idx} className="flex items-center justify-between gap-2 p-2 border border-border/60 rounded-lg bg-background shadow-xs hover:border-primary/40 transition-colors group">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {isImage && file.fileData ? (
                            <img src={file.fileData} alt="Preview" className="h-8 w-8 rounded object-cover border border-border shrink-0" />
                          ) : (
                            <div className="h-8 w-8 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0">
                              {file.name.toLowerCase().endsWith(".pdf") ? <FileText className="h-4 w-4" /> : <FileImage className="h-4 w-4" />}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-[12px] font-medium truncate text-foreground leading-tight" title={file.name}>{file.name}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {file.size}
                              {file.isExisting && !file.missing && " · Saved"}
                              {file.missing && <span className="text-destructive font-semibold"> · File unavailable</span>}
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full shrink-0"
                          onClick={() => removeFile(idx)}
                          title="Remove file"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <label
                  htmlFor="customer-id-proof-upload"
                  className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-border/70 rounded-xl cursor-pointer bg-muted/20 hover:bg-primary/5 hover:border-primary/40 transition-all duration-200 group relative overflow-hidden"
                >
                  <div className="flex flex-col items-center gap-1 text-muted-foreground group-hover:text-primary transition-colors">
                    <FileImage className="h-6 w-6 mb-0.5" />
                    <p className="text-[13px] font-medium">Click or Drag to upload ID Proofs</p>
                    <p className="text-[11px]">Multiple Aadhaar, PAN, Photo — PDF or image files supported</p>
                  </div>
                  <input
                    id="customer-id-proof-upload"
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    onChange={(e) => { handleFilesAdded(e.target.files); e.target.value = ""; }}
                  />
                </label>
              )}
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Notes</Label>
              <Textarea placeholder="Any special notes about this customer…" className="resize-none min-h-[70px]" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button variant="outline" type="button">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting || pendingReads > 0 || loadingDocs}>
              {loadingDocs ? "Loading ID proofs…" : pendingReads > 0 ? "Reading files…" : "Save Customer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteCustomerDialog({ customer, trigger, onDelete }: { customer: Customer; trigger: React.ReactNode; onDelete?: () => void }) {
  const handleDelete = () => {
    deleteCustomer(customer.id);
    toast.success(`Customer "${customer.name}" successfully deleted.`);
    if (onDelete) onDelete();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-destructive flex items-center gap-2">
            <Trash2 className="h-4 w-4" /> Delete Customer
          </DialogTitle>
        </DialogHeader>
        <div className="py-2 space-y-3">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <strong className="text-foreground">{customer.name}</strong>?
          </p>
          <div className="rounded-lg border border-destructive/18 bg-destructive/5 p-3 text-[12px] text-destructive">
            This will permanently remove the customer and all associated data. This action cannot be undone.
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

const getDocDetails = (type: string) => {
  switch (type) {
    case "ID Proof":
      return {
        icon: FileImage,
        color: "text-primary bg-primary/10 border-primary/20",
        dotColor: "bg-primary",
      };
    case "Agreement":
      return {
        icon: FileCheck2,
        color: "text-accent bg-accent/10 border-accent/20",
        dotColor: "bg-accent",
      };
    case "Invoice":
      return {
        icon: FileText,
        color: "text-success bg-success/10 border-success/20",
        dotColor: "bg-success",
      };
    case "Receipt":
      return {
        icon: Receipt,
        color: "text-warning-foreground bg-warning/10 border-warning/20",
        dotColor: "bg-warning-foreground",
      };
    default:
      return {
        icon: FileText,
        color: "text-muted-foreground bg-muted/10 border-border/60",
        dotColor: "bg-muted-foreground",
      };
  }
};

function CustomerProfileDialog({ customer: initialCustomer, open, onClose, onSave }: { customer: Customer | null; open: boolean; onClose: () => void; onSave?: () => void }) {
  const [customer, setCustomer] = useState<Customer | null>(initialCustomer);

  useEffect(() => {
    setCustomer(initialCustomer);
  }, [initialCustomer]);

  if (!customer) return null;
  const isStaff = typeof window !== "undefined" && localStorage.getItem("medirent-user-role") === "Staff";
  const rentals = getRentals();
  const payments = getPayments();
  const documents = getDocuments();
  const returns = getReturns();

  const [previewDoc, setPreviewDoc] = useState<any | null>(null);

  // Load heavy file content from IndexedDB when a document is opened in preview.
  // System-generated rows (doc-agr-/doc-ret-/doc-pay-) never carry uploaded
  // bytes — they're rebuilt from their source record below — but an uploaded
  // agreement PDF has its own doc id and must still be fetched.
  const isSystemGeneratedDoc = (doc: any) =>
    String(doc.id).startsWith("doc-agr-") || String(doc.id).startsWith("doc-ret-") || String(doc.id).startsWith("doc-pay-");

  useEffect(() => {
    if (previewDoc && !previewDoc.fileData && !isSystemGeneratedDoc(previewDoc)) {
      getDocumentWithFile(previewDoc).then((fullDoc) => {
        setPreviewDoc(fullDoc);
      });
    }
  }, [previewDoc]);

  // Agreements / return receipts / payment receipts render from their source
  // record, so they preview even when no file is stored on this device.
  const previewGeneratedHtml = useMemo(
    () => (previewDoc && previewDoc.fileData !== "PDF" && !String(previewDoc.fileData ?? "").startsWith("data:")
      ? getGeneratedDocumentHtml(previewDoc)
      : null),
    [previewDoc?.id, previewDoc?.fileData]
  );

  const custRentals  = rentals.filter((r) => r.customerId === customer.id);
  const custPayments = payments.filter((p) => p.customerId === customer.id);
  const custDocs = documents.filter((d) => d.customerId === customer.id || (d.rentalId && custRentals.some(r => r.id === d.rentalId)));
  const custKYCDocs = custDocs.filter((d) => d.type === "ID Proof");

  const initials = customer.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("");

  // Calculate totals
  const totalPaid = custPayments.filter(p => p.status === "Paid").reduce((sum, p) => sum + p.amount, 0);
  
  // Pending dues calculation (includes active rental dues and return dues)
  const dueBalanceInfo = getCustomerDueBalance(customer.id, customer.name);
  const totalPending = dueBalanceInfo.totalDue;

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-2xl border border-border/80 shadow-[0_20px_50px_rgba(0,0,0,0.15)] bg-background">
        {/* Banner header */}
        <div className="bg-gradient-to-r from-primary/10 via-accent/5 to-card p-3 sm:p-6 border-b border-border/60 relative">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-background shadow-sm">
                <AvatarFallback className="bg-primary/15 text-primary font-bold text-xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="font-display text-[20px] font-bold text-foreground leading-tight">{customer.name}</h3>
                  <StatusBadge status={customer.status} />
                </div>
                <p className="text-[11px] font-mono text-muted-foreground/80 mt-1">Customer ID: {customer.id}</p>
                <p className="text-[12.5px] text-muted-foreground mt-0.5">{customer.city}, {customer.state}</p>
              </div>
            </div>
            
            {/* Quick action buttons */}
            <div className="flex gap-2 flex-wrap self-start sm:self-center">
              {!isStaff && (
                <CustomerFormDialog
                  title="Edit Customer"
                  customer={customer}
                  onSave={() => {
                    const updated = getCustomers().find((c) => c.id === customer.id);
                    if (updated) setCustomer(updated);
                    if (onSave) onSave();
                  }}
                  trigger={
                    <Button
                      variant="default"
                      size="sm"
                      className="h-8.5 rounded-lg text-[12px] gap-1.5 font-bold shadow-xs bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      Edit Customer
                    </Button>
                  }
                />
              )}
              <Button
                variant="outline"
                size="sm"
                className="h-8.5 rounded-lg text-[12px] gap-1.5"
                onClick={() => window.open(`tel:${customer.phone}`)}
              >
                <Phone className="h-3.5 w-3.5" />
                Call Customer
              </Button>
              {customer.email && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8.5 rounded-lg text-[12px] gap-1.5"
                  onClick={() => window.open(`mailto:${customer.email}`)}
                >
                  <Mail className="h-3.5 w-3.5" />
                  Email
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="overview" className="w-full flex flex-col">
          <div className="border-b border-border/50 bg-muted/15 px-3 sm:px-6 overflow-x-auto">
            <TabsList className="bg-transparent border-0 gap-2 h-11 p-0 justify-start flex-nowrap w-max min-w-full">
              <TabsTrigger value="overview" className="data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-11 px-4 text-[12.5px] font-semibold whitespace-nowrap">Overview & KYC</TabsTrigger>
              <TabsTrigger value="rentals" className="data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-11 px-4 text-[12.5px] font-semibold whitespace-nowrap">Rentals ({custRentals.length})</TabsTrigger>
              <TabsTrigger value="payments" className="data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-11 px-4 text-[12.5px] font-semibold whitespace-nowrap">Payments & Dues ({custPayments.length})</TabsTrigger>
              <TabsTrigger value="documents" className="data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-11 px-4 text-[12.5px] font-semibold whitespace-nowrap">Documents ({custKYCDocs.length})</TabsTrigger>
            </TabsList>
          </div>

          <div className="p-3 sm:p-6">
            {/* Overview & KYC Tab */}
            <TabsContent value="overview" className="mt-0 focus-visible:ring-0 focus-visible:outline-none">
              <div className="grid gap-6 md:grid-cols-3">
                {/* Contact information card */}
                <div className="md:col-span-2 space-y-4">
                  <div className="rounded-xl border border-border/60 bg-card p-4 space-y-3.5">
                    <h4 className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Demographics & Address</h4>
                    <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2 text-[13px]">
                      <InfoRow icon={Phone} label="Primary Phone" value={customer.phone} />
                      {customer.altPhone && <InfoRow icon={Phone} label="Alt Phone" value={customer.altPhone} />}
                      {customer.contactNumber3 && <InfoRow icon={Phone} label="Alt Phone 1" value={customer.contactNumber3} />}
                      <InfoRow icon={Mail} label="Email" value={customer.email || "—"} />
                      <InfoRow icon={MapPin} label="City / State" value={`${customer.city}, ${customer.state}`} />
                      <InfoRow icon={Hash} label="Pincode" value={customer.pincode || "—"} />
                      <InfoRow icon={MapPin} label="Area" value={customer.area || "—"} />
                      <InfoRow icon={MapPinned} label="Full Address" value={customer.address} />
                    </div>
                  </div>

                  {customer.notes && (
                    <div className="rounded-xl border border-border/60 bg-muted/15 p-4">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 mb-1.5">Internal Notes</p>
                      <p className="text-[13px] text-foreground/80 leading-relaxed">{customer.notes}</p>
                    </div>
                  )}
                </div>

                {/* Identity Verification Info */}
                <div className="space-y-4">
                  <div className="rounded-xl border border-border/60 bg-card p-4 space-y-3.5">
                    <h4 className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Government Verification</h4>
                    <div className="space-y-3">
                      <div className="rounded-lg bg-muted/30 p-2.5 border border-border/40">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Aadhaar (KYC)</span>
                        <p className="font-mono font-bold text-[13px] text-foreground mt-0.5">{customer.aadhaar || "Pending Upload"}</p>
                      </div>
                      <div className="rounded-lg bg-muted/30 p-2.5 border border-border/40">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">PAN Card</span>
                        <p className="font-mono font-bold text-[13px] text-foreground mt-0.5">{customer.pan || "Pending Upload"}</p>
                      </div>
                    </div>
                  </div>

                  {/* KYC Documents Panel */}
                  <div className="rounded-xl border border-border/60 bg-card p-4">
                    <h4 className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-2">KYC Documents</h4>
                    {custDocs.filter(d => d.type === "ID Proof").length === 0 ? (
                      <p className="text-[12px] text-muted-foreground py-2 italic">No ID Proof uploaded yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {custDocs.filter(d => d.type === "ID Proof").map(d => (
                          <div key={d.id} className="flex items-center justify-between gap-2 rounded-lg border border-border/50 p-2 hover:bg-muted/15 transition-all">
                            <div className="min-w-0 flex-1">
                              <p className="text-[12.5px] font-semibold truncate text-foreground">{d.name}</p>
                              <p className="text-[10px] text-muted-foreground">{d.size} · {formatDateDDMMYYYY(d.date)}</p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <Button variant="outline" size="sm" className="h-7 text-[11px] px-2 rounded-md" onClick={() => setPreviewDoc(d)}>
                                View
                              </Button>
                              {!isStaff && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md"
                                  onClick={() => {
                                    if (window.confirm(`Are you sure you want to delete "${d.name}"?`)) {
                                      deleteDocument(d.id);
                                      toast.success(`Document "${d.name}" deleted successfully.`);
                                    }
                                  }}
                                  title="Delete Document"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Rentals & Agreements Tab */}
            <TabsContent value="rentals" className="mt-0 focus-visible:ring-0 focus-visible:outline-none">
              {custRentals.length === 0 ? (
                <div className="text-center py-12 border border-dashed rounded-2xl bg-muted/10 border-border/60">
                  <FolderOpen className="h-8 w-8 mx-auto text-muted-foreground/45 mb-2.5" />
                  <p className="text-[13px] font-semibold text-foreground">No Rentals Found</p>
                  <p className="text-[12px] text-muted-foreground mt-0.5">This customer has no active or past agreements.</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {custRentals.map((r) => {
                    const returnDetails = returns.find(ret => ret.agreement === r.id);
                    return (
                      <Card key={r.id} className="hover:border-primary/30 transition-all border-border/60 overflow-hidden shadow-sm hover:shadow-md">
                        <CardHeader className="bg-muted/15 px-4.5 py-3 border-b border-border/50 flex flex-row items-center justify-between gap-2.5 space-y-0">
                          <span className="font-mono text-[11.5px] font-bold text-primary">{r.id}</span>
                          <StatusBadge status={r.status} />
                        </CardHeader>
                        <CardContent className="p-4 space-y-3.5">
                          <div>
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Rented Equipment</p>
                            {(() => {
                              const items = getRentalEquipmentDetailedItems(r, getEquipment(), returns, true);
                              const isCompleted = r.status === "Completed" || (items.length > 0 && items.every(it => it.returned));
                              return (
                                <div className="space-y-1">
                                  {items.map((it, idx) => {
                                    const strikeItem = it.returned && !isCompleted;
                                    return (
                                      <div key={idx} className="flex items-center gap-1.5 flex-wrap">
                                        <span className={strikeItem ? "line-through text-muted-foreground/60 text-[13px] font-bold" : "text-[14px] font-bold text-foreground"}>
                                          {it.label}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })()}
                          </div>

                          <div className="grid grid-cols-2 gap-3.5 bg-muted/15 p-3 rounded-lg border border-border/40 text-[12px]">
                            <div>
                              <span className="text-muted-foreground">Monthly Rent</span>
                              <p className="font-bold text-[13.5px] text-foreground mt-0.5">₹{r.monthlyRent.toLocaleString("en-IN")}/mo</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Security Deposit</span>
                              <p className="font-semibold text-[13px] text-foreground mt-0.5">₹{r.deposit.toLocaleString("en-IN")}</p>
                            </div>
                            <div className="col-span-2 border-t border-border/40 pt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                              <span>Period</span>
                              <span className="font-medium text-foreground">{formatDateDDMMYYYY(r.start)} → {formatDateDDMMYYYY(r.end)}</span>
                            </div>
                          </div>

                          {/* Logistics / Charges */}
                          <div className="grid grid-cols-3 gap-2 text-[11px] border-b border-border/40 pb-2.5">
                            <div>
                              <span className="text-muted-foreground">Delivery</span>
                              <p className="font-semibold mt-0.5">₹{r.deliveryCharges}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Installation</span>
                              <p className="font-semibold mt-0.5">₹{r.installationCharges}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Additional</span>
                              <p className="font-semibold mt-0.5">₹{r.additionalCharges}</p>
                            </div>
                          </div>

                          {r.remarks && (
                            <div className="text-[12px] bg-amber-50/20 dark:bg-amber-950/10 border border-amber-200/40 p-2.5 rounded-md text-foreground/80">
                              <strong>Remarks:</strong> {r.remarks}
                            </div>
                          )}

                          {returnDetails && (
                            <div className="text-[12px] bg-green-50/20 dark:bg-green-950/10 border border-green-200/40 p-2.5 rounded-md text-foreground/80">
                              <strong>Returned:</strong> {formatDateDDMMYYYY(returnDetails.date)} ({returnDetails.condition} Condition)
                              <p className="text-[10px] text-muted-foreground mt-0.5">Refund: ₹{returnDetails.refund} · Balance: ₹{returnDetails.pendingBalance}</p>
                            </div>
                          )}

                          {/* Rental Actions */}
                          <div className="flex gap-2 pt-1 border-t border-border/30 justify-between items-center">
                            <span className="text-[10px] text-muted-foreground">Digital Agreement</span>
                            <div className="flex gap-1.5">
                              <AgreementPreviewDialog
                                rental={r}
                                trigger={
                                  <Button variant="outline" size="sm" className="h-7 text-[11px] px-2 rounded-md">
                                    Preview
                                  </Button>
                                }
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-[11px] px-2 rounded-md"
                                onClick={() => {
                                  downloadAgreementFile(r);
                                  toast.success(`Agreement downloaded for ${r.id}`);
                                }}
                              >
                                Download
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Payments & Billing Tab */}
            <TabsContent value="payments" className="mt-0 focus-visible:ring-0 focus-visible:outline-none">
              <div className="space-y-6">
                {/* Billing KPI Cards */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-border/60 bg-success/5 p-4.5">
                    <span className="text-[11px] font-bold text-success uppercase tracking-wider">Total Amount Paid</span>
                    <h5 className="font-display text-[22px] font-bold text-success mt-1">₹{totalPaid.toLocaleString("en-IN")}</h5>
                    <p className="text-[10.5px] text-muted-foreground mt-1">Received from {custPayments.filter(p => p.status === "Paid").length} payments</p>
                  </div>
                  
                  <div className="rounded-xl border border-border/60 bg-destructive/5 p-4.5">
                    <span className="text-[11px] font-bold text-destructive uppercase tracking-wider">Pending Dues</span>
                    <h5 className="font-display text-[22px] font-bold text-destructive mt-1">₹{totalPending.toLocaleString("en-IN")}</h5>
                    <p className="text-[10.5px] text-muted-foreground mt-1">Includes overdue rentals & balances</p>
                  </div>

                  <div className="rounded-xl border border-border/60 bg-card p-4.5 flex flex-col justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Payment Standing</span>
                      <p className="text-[13px] font-semibold text-foreground mt-1.5">
                        {customer.status === "Active" ? "🟢 Good Standing" : customer.status === "Overdue" ? "🔴 Balance Overdue" : "🟡 Action Required"}
                      </p>
                    </div>
                    <p className="text-[10.5px] text-muted-foreground mt-1.5 leading-snug">Requires attention when tracking monthly billing cycles</p>
                  </div>
                </div>

                {/* Overdue Alert Panel if there is outstanding amount */}
                {customer.status === "Overdue" && (
                  <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 flex gap-3.5 items-start">
                    <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-bold text-[13.5px] text-destructive leading-tight">Payment Overdue Notice</h5>
                      <p className="text-[12.5px] text-destructive/80 mt-1 leading-relaxed">
                        This customer has rentals marked as **Overdue** (e.g. {custRentals.filter(r => r.status === "Overdue").map(r => r.id).join(", ")}).
                        Please contact the customer to clear the pending balance of **₹{totalPending.toLocaleString("en-IN")}** at the earliest.
                      </p>
                    </div>
                  </div>
                )}

                {/* Transaction history table */}
                <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
                  <div className="px-4.5 py-3 border-b border-border/50 bg-muted/20">
                    <h4 className="text-[12.5px] font-bold text-foreground">Transaction & Invoicing History</h4>
                  </div>
                  {custPayments.length === 0 ? (
                    <p className="text-[12.5px] text-muted-foreground text-center py-8">No payments recorded.</p>
                  ) : (
                    <>
                      {/* Desktop table — hidden on mobile */}
                      <div className="hidden md:block overflow-x-auto">
                        <Table>
                          <TableHeader className="bg-muted/5">
                            <TableRow>
                              <TableHead className="text-[11.5px] h-9">Date</TableHead>
                              <TableHead className="text-[11.5px] h-9">Transaction ID</TableHead>
                              <TableHead className="text-[11.5px] h-9">Agreement</TableHead>
                              <TableHead className="text-[11.5px] h-9">Type</TableHead>
                              <TableHead className="text-[11.5px] h-9">Mode</TableHead>
                              <TableHead className="text-[11.5px] h-9 text-right">Amount</TableHead>
                              <TableHead className="text-[11.5px] h-9">Status</TableHead>
                              <TableHead className="text-[11.5px] h-9 text-right">Invoice</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {custPayments.map((p) => (
                              <TableRow key={p.id} className="text-[12.5px]">
                                <TableCell className="py-2.5 font-medium">{formatDateDDMMYYYY(p.date)}</TableCell>
                                <TableCell className="py-2.5 font-mono text-[11px] text-muted-foreground">{p.id}</TableCell>
                                <TableCell className="py-2.5 font-mono text-[11px] text-primary">{p.agreement}</TableCell>
                                <TableCell className="py-2.5">{p.type}</TableCell>
                                <TableCell className="py-2.5 text-muted-foreground">{p.mode} {p.txRef ? `(${p.txRef})` : ""}</TableCell>
                                <TableCell className="py-2.5 text-right font-bold">₹{p.amount.toLocaleString("en-IN")}</TableCell>
                                <TableCell className="py-2.5"><StatusBadge status={p.status} /></TableCell>
                                <TableCell className="py-2.5 text-right">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6.5 text-[10px] px-1.5 rounded"
                                    onClick={() => {
                                      printReceipt(p, customer.name);
                                      toast.success(`Receipt PDF for ${p.id} generated successfully.`);
                                    }}
                                  >
                                    Download
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Mobile card list — visible only on mobile */}
                      <div className="md:hidden p-2 space-y-2">
                        {custPayments.map((p) => (
                          <div
                            key={p.id}
                            className="mobile-card-item cursor-pointer"
                            onClick={() => {
                              printReceipt(p, customer.name);
                              toast.success(`Receipt PDF for ${p.id} generated successfully.`);
                            }}
                          >
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className="font-bold text-[14px] text-foreground">₹{p.amount.toLocaleString("en-IN")}</p>
                                <StatusBadge status={p.status} />
                              </div>
                              <div className="info-row">
                                <Clock className="h-3 w-3 shrink-0" />
                                <span>{formatDateDDMMYYYY(p.date)}</span>
                                <span className="text-muted-foreground/40">·</span>
                                <span>{p.type} · {p.mode}{p.txRef ? ` (${p.txRef})` : ""}</span>
                              </div>
                              <div className="info-row">
                                <Receipt className="h-3 w-3 shrink-0" />
                                <span className="font-mono text-primary">{p.agreement}</span>
                                <span className="text-muted-foreground/40">·</span>
                                <span className="font-mono">{p.id}</span>
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="mt-0 focus-visible:ring-0 focus-visible:outline-none">
              {custKYCDocs.length === 0 ? (
                <div className="text-center py-12 border border-dashed rounded-2xl bg-muted/10 border-border/60">
                  <FolderOpen className="h-8 w-8 mx-auto text-muted-foreground/45 mb-2.5" />
                  <p className="text-[13px] font-semibold text-foreground">No Documents Found</p>
                  <p className="text-[12px] text-muted-foreground mt-0.5">No contract or identity document is uploaded yet.</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                  {custKYCDocs.map((d) => {
                    const isKYC = d.type === "ID Proof";
                    const isAgreement = d.type === "Agreement";
                    
                    return (
                      <div key={d.id} className="group rounded-xl border border-border/60 bg-card p-3.5 hover:border-primary/30 transition-all shadow-sm">
                        <div className="flex items-start gap-3">
                          <div className={`metric-icon h-10 w-10 shrink-0 flex items-center justify-center rounded-lg ${
                            isKYC ? "bg-primary/10 text-primary" :
                            isAgreement ? "bg-accent/10 text-accent" : "bg-success/10 text-success"
                          }`}>
                            {isKYC ? <FileImage className="h-4.5 w-4.5" /> :
                             isAgreement ? <FileCheck2 className="h-4.5 w-4.5" /> : <FileText className="h-4.5 w-4.5" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-[13px] leading-tight truncate text-foreground">{d.name}</p>
                            <span className={`inline-flex rounded px-1.5 py-0.2 text-[8.5px] font-bold uppercase tracking-wider mt-1 ${
                              isKYC ? "bg-primary/10 text-primary" :
                              isAgreement ? "bg-accent/10 text-accent" : "bg-success/10 text-success"
                            }`}>
                              {d.type}
                            </span>
                            <p className="text-[10px] text-muted-foreground mt-1">{d.size} · {formatDateDDMMYYYY(d.date)}</p>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center gap-1.5 border-t border-border/40 pt-2 transition-opacity">
                          <Button variant="ghost" size="sm" className="h-6.5 text-[11px] px-2 rounded-md text-muted-foreground hover:text-foreground" onClick={() => setPreviewDoc(d)}>
                            <Eye className="h-3.5 w-3.5 mr-1" /> View
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6.5 text-[11px] px-2 rounded-md text-muted-foreground hover:text-foreground ml-auto"
                            onClick={async () => {
                              const ok = await printDocumentFile(d);
                              if (ok) {
                                toast.success(`Opening print view for ${d.name}...`);
                              } else {
                                toast.error(`"${d.name}" isn't available on this device and hasn't been backed up to Google Sheets yet.`);
                              }
                            }}
                          >
                            <Download className="h-3 w-3 mr-1" /> Download
                          </Button>
                          {!isStaff && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6.5 text-[11px] px-2 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to delete "${d.name}"?`)) {
                                  deleteDocument(d.id);
                                  toast.success(`Document "${d.name}" deleted.`);
                                }
                              }}
                              title="Delete Document"
                            >
                              <Trash2 className="h-3 w-3 mr-1" /> Delete
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
        
        {/* Footer */}
        <div className="border-t border-border/60 bg-muted/20 px-3 sm:px-6 py-3 sm:py-4 flex justify-end gap-2.5 rounded-b-2xl">
          <Button variant="outline" className="h-9.5 text-[13px] font-medium" onClick={onClose}>
            Close Window
          </Button>
        </div>

        <Dialog open={!!previewDoc} onOpenChange={(open) => !open && setPreviewDoc(null)}>
          <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto p-5 md:p-6">
            <DialogHeader>
              <DialogTitle>Document Preview</DialogTitle>
            </DialogHeader>
            {previewDoc && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 border-b border-border/50 pb-4">
                  {(() => {
                    const { icon: DocIcon, color } = getDocDetails(previewDoc.type);
                    return (
                      <>
                        <div className={`metric-icon h-10 w-10 shrink-0 ${color}`}>
                          <DocIcon className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <p className="font-semibold text-[14px]">{previewDoc.name}</p>
                          <p className="text-[12px] text-muted-foreground mt-0.5">{previewDoc.type} · {previewDoc.size} · Uploaded {formatDateDDMMYYYY(previewDoc.date)}</p>
                        </div>
                        {previewGeneratedHtml && (
                          <span className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-accent/20 bg-accent/10 px-2 py-1 text-[10px] font-bold text-accent shrink-0">
                            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                            Generated from record
                          </span>
                        )}
                      </>
                    );
                  })()}
                </div>
                <div className="flex items-center justify-center border border-border/60 rounded-xl overflow-hidden bg-muted/10 h-[280px] w-full">
                  {previewDoc.fileData && previewDoc.fileData !== "NOT_FOUND" && (previewDoc.fileData.startsWith("data:image/") || (previewDoc.fileData.startsWith("data:") && previewDoc.name.toLowerCase().match(/\.(png|jpe?g|gif|webp|svg)$/))) ? (
                    <img 
                      src={previewDoc.fileData} 
                      className="max-h-full max-w-full object-contain rounded-lg shadow-sm" 
                      alt={previewDoc.name} 
                    />
                  ) : previewDoc.fileData && previewDoc.fileData !== "NOT_FOUND" && previewDoc.fileData.startsWith("data:application/pdf") ? (
                    <iframe
                      src={previewDoc.fileData}
                      className="w-full h-full border-0 bg-white"
                      title={previewDoc.name}
                    />
                  ) : previewGeneratedHtml ? (
                    <iframe
                      srcDoc={previewGeneratedHtml}
                      className="w-full h-full border-0 bg-white"
                      title={previewDoc.name}
                    />
                  ) : previewDoc.fileData === "NOT_FOUND" ? (
                    <div className="flex flex-col items-center justify-center bg-muted/5 border border-border/40 rounded-xl p-8 h-full text-center w-full">
                      <AlertTriangle className="h-10 w-10 text-destructive mb-3" />
                      <h5 className="font-bold text-[14px] text-foreground">File Content Not Available</h5>
                      <p className="text-[12px] text-muted-foreground mt-1 max-w-md">
                        The file data could not be retrieved from IndexedDB or Google Sheets. 
                        If this file was uploaded from another browser/device, please ensure that GSheets sync is complete.
                      </p>
                    </div>
                  ) : (
                    <iframe 
                      src={getDocumentPreviewUrl(previewDoc)} 
                      className="w-full h-full border-0 bg-white" 
                      title={previewDoc.name} 
                    />
                  )}
                </div>
                 <div className="grid grid-cols-2 gap-3 text-[12px] bg-muted/20 p-4 rounded-xl border border-border/40">
                  <div>
                    <span className="text-muted-foreground">Document ID</span>
                    <p className="font-mono font-bold mt-1 text-[13px] text-primary">{previewDoc.id}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Verified By</span>
                    <p className="font-semibold mt-1 text-[13px]">System Auditor</p>
                  </div>
                </div>

              </div>
            )}
            <DialogFooter className="sm:justify-end border-t border-border/50 pt-4 mt-4">
              <div className="flex gap-2">
                <Button variant="outline" className="h-9 text-[13px]" onClick={() => setPreviewDoc(null)}>Close</Button>
                {previewDoc && (
                  <Button
                    className="h-9 text-[13px]"
                    disabled={previewDoc.fileData === "NOT_FOUND" && !previewGeneratedHtml}
                    title={previewDoc.fileData === "NOT_FOUND" && !previewGeneratedHtml ? "Not available on this device or in Google Sheets" : undefined}
                    onClick={async () => {
                      if (previewDoc.fileData && previewDoc.fileData !== "NOT_FOUND" && previewDoc.fileData.startsWith("data:")) {
                        downloadBase64File(previewDoc.fileData, previewDoc.name);
                        toast.success(`Downloading file: ${previewDoc.name}`);
                      } else {
                        const ok = await printDocumentFile(previewDoc);
                        if (ok) {
                          toast.success(`Opening download file: ${previewDoc.name}`);
                        } else {
                          toast.error(`"${previewDoc.name}" isn't available on this device and hasn't been backed up to Google Sheets yet.`);
                        }
                      }
                    }}
                  >
                    <Download className="mr-1.5 h-3.5 w-3.5" /> Download File
                  </Button>
                )}
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}

function InfoRow({ icon: Icon, label, value, className }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; className?: string }) {
  return (
    <div className={`flex items-start gap-2.5 py-2 border-b border-border/40 last:border-0 ${className ?? ""}`}>
      <Icon className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground/60" />
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground w-20 shrink-0">{label}</span>
      <span className="text-[13px] text-foreground/80 flex-1">{value}</span>
    </div>
  );
}

function CustomerPayDueDialog({
  customer,
  onSave,
}: {
  customer: Customer;
  onSave: () => void;
}) {
  const [open, setOpen] = useState(false);
  const dueInfo = useMemo(() => getCustomerDueBalance(customer.id, customer.name), [customer, open]);
  const [payAmount, setPayAmount] = useState(dueInfo.totalDue.toString());
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [paymentDate, setPaymentDate] = useState(() => getLocalYYYYMMDD());
  const [txRef, setTxRef] = useState("");
  const [cashAmount, setCashAmount] = useState("");
  const [bankAmount, setBankAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      const currentDue = getCustomerDueBalance(customer.id, customer.name).totalDue;
      setPayAmount(currentDue.toString());
      setPaymentMode("Cash");
      setPaymentDate(getLocalYYYYMMDD());
      setTxRef("");
      const cAmt = Math.round(currentDue / 2);
      setCashAmount(cAmt.toString());
      setBankAmount((currentDue - cAmt).toString());
    }
  }, [open, customer]);

  const handlePay = () => {
    const amt = Number(payAmount) || 0;
    if (amt <= 0) {
      toast.error("Please enter a valid payment amount.");
      return;
    }
    setIsSubmitting(true);

    if (dueInfo.unpaidReturns.length > 0) {
      let remainingPayment = amt;
      dueInfo.unpaidReturns.forEach((ret: any) => {
        const retDue = Math.abs(ret.refund || 0);
        if (remainingPayment >= retDue) {
          saveReturn({
            ...ret,
            duePaymentStatus: "Paid",
            duePaymentMode: paymentMode,
            dueTxRef: txRef,
            status: "Completed",
          });
          remainingPayment -= retDue;
        }
      });
    }

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
          customer: customer.name,
          customerId: customer.id,
          amount: cAmt,
          mode: "Cash",
          type: "Rent" as const,
          notes: `Customer Due Balance Payment for ${customer.name} (Cash portion of ₹${amt.toLocaleString("en-IN")})`,
          status: "Paid" as const,
        });
      }
      if (bAmt > 0) {
        savePayment({
          id: getNextPaymentNumber(),
          date: paymentDate,
          customer: customer.name,
          customerId: customer.id,
          amount: bAmt,
          mode: "Bank",
          type: "Rent" as const,
          txRef,
          notes: `Customer Due Balance Payment for ${customer.name} (Bank portion of ₹${amt.toLocaleString("en-IN")})`,
          status: "Paid" as const,
        });
      }
    } else {
      savePayment({
        id: getNextPaymentNumber(),
        date: paymentDate,
        customer: customer.name,
        customerId: customer.id,
        amount: amt,
        mode: paymentMode as any,
        type: "Rent" as const,
        txRef,
        notes: `Customer Due Balance Payment for ${customer.name}`,
        status: "Paid" as const,
      });
    }

    toast.success(`₹${amt.toLocaleString("en-IN")} payment recorded for ${customer.name}! Customer dues updated.`);
    setIsSubmitting(false);
    setOpen(false);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("medirent-db-updated"));
    }
    onSave();
  };

  if (dueInfo.totalDue <= 0) return null;

  return (
    <>
      <Button
        size="sm"
        className="h-7 px-2.5 text-[11px] font-bold gap-1 transition-all bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        title="Pay / Record Payment"
      >
        <CreditCard className="h-3.5 w-3.5" /> Pay
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-700">
              <CreditCard className="h-4 w-4" /> Settle Customer Due Balance
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3.5 space-y-2 text-[12.5px]">
              <div className="flex justify-between font-bold text-foreground">
                <span>{customer.name}</span>
                <span className="font-mono text-muted-foreground">{customer.id}</span>
              </div>

              <div className="space-y-1 border-t border-rose-200/60 pt-2 text-[11.5px]">
                <div className="flex justify-between text-[13.5px] font-black text-rose-800 pt-0.5">
                  <span>After Return Due Balance:</span>
                  <span>₹{dueInfo.totalDue.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Amount to Pay (₹)</Label>
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
                  className="h-9 text-[13px]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Payment Mode</Label>
              <Select 
                value={paymentMode} 
                onValueChange={(m) => {
                  setPaymentMode(m);
                  if (m === "Cash+Bank") {
                    const amt = Number(payAmount) || 0;
                    const cAmt = Math.round(amt / 2);
                    setCashAmount(cAmt.toString());
                    setBankAmount((amt - cAmt).toString());
                  }
                }}
              >
                <SelectTrigger className="h-9 text-[13px] bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Bank">Bank</SelectItem>
                  <SelectItem value="Cash+Bank">Cash + Bank</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {paymentMode === "Cash+Bank" && (
              <div className="grid grid-cols-2 gap-3 p-3 bg-muted/20 rounded-lg border border-border">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Cash Amount (₹)</Label>
                  <Input
                    type="number"
                    placeholder="Cash portion"
                    className="h-9 text-[13px] font-semibold bg-emerald-50/20"
                    value={cashAmount}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCashAmount(val);
                      const amt = Number(payAmount) || 0;
                      const cNum = Math.max(0, Number(val) || 0);
                      setBankAmount(Math.max(0, amt - cNum).toString());
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">Bank Amount (₹)</Label>
                  <Input
                    type="number"
                    placeholder="Bank portion"
                    className="h-9 text-[13px] font-semibold bg-blue-50/20"
                    value={bankAmount}
                    onChange={(e) => {
                      const val = e.target.value;
                      setBankAmount(val);
                      const amt = Number(payAmount) || 0;
                      const bNum = Math.max(0, Number(val) || 0);
                      setCashAmount(Math.max(0, amt - bNum).toString());
                    }}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Transaction Reference (Optional)</Label>
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
            <Button type="button" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold" onClick={handlePay} disabled={isSubmitting}>
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function CustomersPage() {
  const dbVersion = useDatabaseTrigger();
  const [customers, setCustomers] = useState(() => getCustomers());
  const [profileCustomer, setProfileCustomer] = useState<Customer | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [search, setSearch] = useState("");
  // PERF: the input stays bound to `search` so typing is instant, while the
  // expensive filter below runs off `debouncedSearch` (300ms idle).
  const debouncedSearch = useDebounce(search, 300);
  const [cityFilter, setCityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all-status");

  const isStaff = typeof window !== "undefined" && localStorage.getItem("medirent-user-role") === "Staff";

  const refresh = () => setCustomers(getCustomers());

  useEffect(() => {
    setCustomers(getCustomers());
  }, [dbVersion]);

  const rentalsList = useMemo(() => getRentals(), [dbVersion]);
  const documentsList = useMemo(() => getDocuments(), [dbVersion]);

  // Build a set of customer IDs that have KYC pending (no aadhaar, no PAN, no ID Proof docs)
  const kycPendingSet = useMemo(() => {
    const set = new Set<string>();
    for (const c of customers) {
      const hasAadhaar = !!(c as any).aadhaar;
      const hasPan = !!(c as any).pan;
      const hasIdProofDoc = documentsList.some((d: any) => d.customerId === c.id && d.type === "ID Proof");
      if (!hasAadhaar && !hasPan && !hasIdProofDoc) {
        set.add(c.id);
      }
    }
    return set;
  }, [customers, documentsList]);

  // PERF: index rentals by customerId once instead of scanning the whole
  // rentals array for every customer on every keystroke (was O(customers x rentals)).
  const rentalsByCustomer = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const r of rentalsList) {
      const list = map.get(r.customerId);
      if (list) list.push(r);
      else map.set(r.customerId, [r]);
    }
    return map;
  }, [rentalsList]);

  // Build a set of customer IDs that have Return Due balances (totalDue > 0 from getCustomerDueBalance)
  const returnDueMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of customers) {
      const dueInfo = getCustomerDueBalance(c.id, c.name);
      if (dueInfo.totalDue > 0) {
        map.set(c.id, dueInfo.totalDue);
      }
    }
    return map;
  }, [customers, dbVersion]);

  const returnDueSet = useMemo(() => new Set(returnDueMap.keys()), [returnDueMap]);
  const totalReturnDueAmount = useMemo(() => {
    let sum = 0;
    for (const amt of returnDueMap.values()) sum += amt;
    return sum;
  }, [returnDueMap]);

  const filteredCustomers = useMemo(() => sortLatestFirst(
    customers.filter((c) => {
      const q = debouncedSearch.toLowerCase().trim();
      const tokens = q.split(/\s+/).filter(Boolean);
      const custRentals = rentalsByCustomer.get(c.id) || [];

      const wordStartsWith = (text: unknown, token: string) => {
        if (!text) return false;
        const words = String(text).toLowerCase().split(/[\s,./\\()-]+/).filter(Boolean);
        return words.some(w => w.startsWith(token));
      };

      const matchesSearch = !q || tokens.every((token) => {
        // Name: word prefix match (e.g. "Srinivas" starts with "srini")
        if (wordStartsWith(c.name, token)) return true;

        // Customer ID (e.g. CUS-0061 or 0061)
        if (String(c.id || "").toLowerCase().includes(token)) return true;

        // Phone numbers
        const tokenDigits = token.replace(/\D/g, "");
        if (tokenDigits.length >= 2) {
          if (String(c.phone || "").replace(/\D/g, "").includes(tokenDigits)) return true;
          if (String(c.altPhone || "").replace(/\D/g, "").includes(tokenDigits)) return true;
          if (String(c.contactNumber3 || "").replace(/\D/g, "").includes(tokenDigits)) return true;
        } else {
          if (String(c.phone || "").toLowerCase().includes(token)) return true;
          if (String(c.altPhone || "").toLowerCase().includes(token)) return true;
          if (String(c.contactNumber3 || "").toLowerCase().includes(token)) return true;
        }

        // Area & City (word prefix match)
        if (wordStartsWith(c.area || "", token)) return true;
        if (wordStartsWith(c.city || "", token)) return true;

        // Aadhaar & PAN
        if (c.aadhaar && String(c.aadhaar).toLowerCase().includes(token)) return true;
        if (c.pan && String(c.pan).toLowerCase().includes(token)) return true;

        // Active Rental Serials / Equipment names
        const hasRentalMatch = custRentals.some(r =>
          (r.serial && wordStartsWith(r.serial, token)) ||
          (r.equipment && wordStartsWith(r.equipment, token)) ||
          (r.equipmentItems && r.equipmentItems.some((ei: any) => ei.serial && wordStartsWith(ei.serial, token)))
        );
        if (hasRentalMatch) return true;

        return false;
      });

      const matchesCity =
        cityFilter === "all" || String(c.city || "").toLowerCase() === cityFilter.toLowerCase();
      const matchesStatus =
        statusFilter === "all-status"
          ? true
          : statusFilter === "KYC Pending"
            ? kycPendingSet.has(c.id)
            : statusFilter === "Return Due" || statusFilter === "Return Due (Pay)"
              ? returnDueSet.has(c.id)
              : String(c.status || "").toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesCity && matchesStatus;
    })
  ), [customers, debouncedSearch, cityFilter, statusFilter, kycPendingSet, returnDueSet, rentalsByCustomer]);

  // PERF: render the first page only; the rest load on demand. Large customer
  // books used to mount every row at once, which froze the tab on each filter change.
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [debouncedSearch, cityFilter, statusFilter]);
  const visibleCustomers = useMemo(
    () => filteredCustomers.slice(0, visibleCount),
    [filteredCustomers, visibleCount]
  );
  const hasMore = filteredCustomers.length > visibleCount;

  // Dynamic stats
  const stats = useMemo(() => ({
    totalCount: customers.length,
    activeCount: customers.filter(c => c.status === "Active").length,
    overdueCount: customers.filter(c => c.status === "Overdue").length,
  }), [customers]);
  const { totalCount, activeCount, overdueCount } = stats;
  const pendingKycCount = kycPendingSet.size;

  return (
    <AppShell
      title="Customers"
      subtitle="Manage your customer database and rental history"
      actions={
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const headers = ["Customer ID", "Name", "Primary Number", "Alternative Phone", "Alternative Phone 1", "Email", "City", "State", "Active Rentals", "Status"];
              const rows = customers.map(c => [
                c.id,
                c.name,
                c.phone,
                c.altPhone || "",
                c.contactNumber3 || "",
                c.email || "",
                c.city,
                c.state,
                c.rentals.toString(),
                c.status
              ]);
              downloadExcel("customers_export.xls", headers, rows, [110, 200, 120, 120, 120, 220, 120, 120, 110, 100]);
              toast.success("Customer list exported successfully.");
            }}
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Export
          </Button>
          <ImportCsvDialog
            entityLabel="Customers"
            columns={customerImportColumns}
            onImportRow={importCustomerRow}
            onComplete={refresh}
            trigger={
              <Button variant="outline" size="sm">
                <Upload className="mr-1.5 h-3.5 w-3.5" />
                Import
              </Button>
            }
          />
          <CustomerFormDialog
            title="New Customer"
            onSave={refresh}
            trigger={
              <Button size="sm">
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add Customer
              </Button>
            }
          />
        </>
      }
    >
      {/* Stat cards */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {[
          { l: "Total Customers", v: totalCount.toString(), icon: UserCheck, color: "text-primary", key: "all-status" },
          { l: "Active",          v: activeCount.toString(),   icon: UserCheck, color: "text-success", key: "Active" },
          { l: "Return Due",      v: returnDueSet.size.toString(), sub: `₹${totalReturnDueAmount.toLocaleString("en-IN")}`, icon: CreditCard, color: "text-emerald-600 dark:text-emerald-400", key: "Return Due" },
          { l: "Pending KYC",     v: pendingKycCount.toString(),    icon: ShieldAlert,     color: "text-warning-foreground", key: "KYC Pending" },
          { l: "Overdue",         v: overdueCount.toString(),    icon: UserX,     color: "text-destructive", key: "Overdue" },
        ].map((s, i) => {
          const isSelected = statusFilter === s.key;
          return (
            <Card 
              key={s.l} 
              className={`cursor-pointer transition-all hover:shadow-[var(--shadow-elevated)] hover:-translate-y-0.5 animate-[fade-in_0.35s_ease-out_both] stagger-${i + 1} ${
                isSelected ? "ring-2 ring-primary/60 border-primary bg-primary/5" : "border-border/60"
              }`}
              onClick={() => setStatusFilter(isSelected ? "all-status" : s.key)}
            >
              <CardContent className="p-3.5 sm:p-4">
                <div className="flex items-center gap-2.5">
                  <div className="metric-icon h-8 w-8 sm:h-9 sm:w-9 shrink-0">
                    <s.icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${s.color}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground/65 leading-tight truncate">{s.l}</p>
                    <div className="flex items-baseline gap-1.5 flex-wrap">
                      <p className={`mt-0.5 font-display text-[18px] sm:text-[20px] font-bold ${s.color}`}>{s.v}</p>
                      {s.sub && <span className="text-[10px] font-mono font-bold text-muted-foreground/80">{s.sub}</span>}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Table card */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {/* Toolbar */}
          <div className="flex flex-col gap-2 border-b border-border/60 bg-muted/20 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
            <div className="relative flex-1 min-w-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50" />
              <Input
                placeholder="Search by name, phone, ID…"
                className="pl-9 h-9 text-[13px] bg-card border-border/50 w-full"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground shrink-0">
                <Users className="h-3.5 w-3.5" />
                <span><strong className="text-foreground">{filteredCustomers.length}</strong> customers</span>
              </div>
              <Button
                variant={statusFilter === "Return Due" ? "default" : "outline"}
                size="sm"
                className={`h-8 text-[12px] font-bold gap-1.5 shrink-0 transition-all ${
                  statusFilter === "Return Due"
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                    : "border-emerald-600/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                }`}
                onClick={() => setStatusFilter(statusFilter === "Return Due" ? "all-status" : "Return Due")}
                title="Filter customers with Return Due balance"
              >
                <CreditCard className="h-3.5 w-3.5" />
                Return Due ({returnDueSet.size})
              </Button>
              <div className="flex-1" />
              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger className="w-[120px] h-8 text-[12px] shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  <SelectItem value="Mysore">Mysore</SelectItem>
                  <SelectItem value="Bengaluru">Bengaluru</SelectItem>
                  <SelectItem value="Chennai">Chennai</SelectItem>
                  <SelectItem value="Mumbai">Mumbai</SelectItem>
                  <SelectItem value="Hyderabad">Hyderabad</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px] h-8 text-[12px] shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-status">All Status</SelectItem>
                  <SelectItem value="Return Due">Return Due (Pay)</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Overdue">Overdue</SelectItem>
                  <SelectItem value="KYC Pending">KYC Pending</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Desktop Table — hidden on mobile */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Rentals</TableHead>
                  <TableHead>Due Balance</TableHead>
                  <TableHead>KYC</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-32 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-12 text-center text-[13px] text-muted-foreground">
                      No customers match your search or filter.
                    </TableCell>
                  </TableRow>
                )}
                {visibleCustomers.map((c, idx) => (
                  <TableRow key={c.id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className={`${avatarHues[idx % avatarHues.length]} text-[11px] font-bold`}>
                            {c.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-[13px]">{c.name}</p>
                          <p className="text-[11px] font-mono text-muted-foreground/70">{c.id}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5 max-w-[220px]">
                        <div className="flex items-center gap-1.5 text-[12px] text-foreground font-medium">
                          <Phone className="h-3 w-3 text-primary shrink-0" />
                          <a href={`tel:${c.phone}`} className="hover:underline hover:text-primary">{c.phone}</a>
                        </div>
                        {c.altPhone && (
                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <span className="text-[9.5px] font-bold uppercase text-muted-foreground/60">Alt:</span>
                            <a href={`tel:${c.altPhone}`} className="hover:underline hover:text-primary">{c.altPhone}</a>
                          </div>
                        )}
                        {c.contactNumber3 && (
                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <span className="text-[9.5px] font-bold uppercase text-muted-foreground/60">Alt 1:</span>
                            <a href={`tel:${c.contactNumber3}`} className="hover:underline hover:text-primary">{c.contactNumber3}</a>
                          </div>
                        )}
                        {c.email && (
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60 truncate">
                            <Mail className="h-2.5 w-2.5 shrink-0" />
                            <span className="truncate">{c.email}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                        <MapPin className="h-3 w-3" />{c.city}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-md bg-primary/8 border border-primary/18 px-2 py-0.5 text-[11px] font-semibold text-primary">
                        {c.rentals} active
                      </span>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const dueInfo = getCustomerDueBalance(c.id, c.name);
                        return dueInfo.totalDue > 0 ? (
                          <div>
                            <p className="font-bold text-[13px] text-rose-600">₹{dueInfo.totalDue.toLocaleString("en-IN")}</p>
                            <span className="inline-flex rounded px-1.5 py-0.2 text-[9.5px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              Pending
                            </span>
                          </div>
                        ) : (
                          <div>
                            <p className="font-semibold text-[13px] text-emerald-600">₹0</p>
                            <span className="inline-flex rounded px-1.5 py-0.2 text-[9.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Paid
                            </span>
                          </div>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      {kycPendingSet.has(c.id) ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10.5px] font-bold text-amber-700">
                          <ShieldAlert className="h-3 w-3" /> Pending
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10.5px] font-bold text-emerald-700">
                          <ShieldCheck className="h-3 w-3" /> Verified
                        </span>
                      )}
                    </TableCell>
                    <TableCell><StatusBadge status={c.status} /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 transition-opacity">
                        <CustomerPayDueDialog customer={c} onSave={refresh} />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10"
                          onClick={() => { setProfileCustomer(c); setProfileOpen(true); }}
                          title="View Profile"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        {!isStaff && (
                          <>
                            <CustomerFormDialog
                              title="Edit Customer"
                              customer={c}
                              onSave={refresh}
                              trigger={
                                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10" title="Edit">
                                  <Edit className="h-3.5 w-3.5" />
                                </Button>
                              }
                            />
                            <DeleteCustomerDialog
                              customer={c}
                              onDelete={refresh}
                              trigger={
                                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10" title="Delete">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              }
                            />
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card List — visible only on mobile */}
          <div className="md:hidden divide-y divide-border/60">
            {filteredCustomers.length === 0 ? (
              <div className="py-12 text-center text-[13px] text-muted-foreground">
                No customers match your search or filter.
              </div>
            ) : (
              visibleCustomers.map((c, idx) => (
                <div 
                  key={c.id} 
                  className="px-4 py-3.5 active:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => { setProfileCustomer(c); setProfileOpen(true); }}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-9 w-9 shrink-0 mt-0.5">
                      <AvatarFallback className={`${avatarHues[idx % avatarHues.length]} text-[12px] font-bold`}>
                        {c.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-[13.5px] text-foreground">{c.name}</p>
                        <div className="flex items-center gap-1.5">
                          {kycPendingSet.has(c.id) && (
                            <span className="inline-flex items-center gap-0.5 rounded bg-amber-50 border border-amber-200 px-1.5 py-0.5 text-[9px] font-bold text-amber-700">
                              <ShieldAlert className="h-2.5 w-2.5" /> KYC
                            </span>
                          )}
                          <StatusBadge status={c.status} />
                        </div>
                      </div>
                      <div className="flex items-center flex-wrap gap-x-2.5 gap-y-1 mt-1 text-[11.5px] text-muted-foreground">
                        <span className="flex items-center gap-1 text-foreground font-medium">
                          <Phone className="h-3 w-3 text-primary shrink-0" />
                          <a href={`tel:${c.phone}`} className="hover:underline" onClick={(e) => e.stopPropagation()}>{c.phone}</a>
                        </span>
                        {c.altPhone && (
                          <span className="flex items-center gap-1 text-[11px]">
                            <span className="text-[9px] font-bold uppercase text-muted-foreground/60">Alt:</span>
                            <a href={`tel:${c.altPhone}`} className="hover:underline text-foreground/80" onClick={(e) => e.stopPropagation()}>{c.altPhone}</a>
                          </span>
                        )}
                        {c.contactNumber3 && (
                          <span className="flex items-center gap-1 text-[11px]">
                            <span className="text-[9px] font-bold uppercase text-muted-foreground/60">Alt 1:</span>
                            <a href={`tel:${c.contactNumber3}`} className="hover:underline text-foreground/80" onClick={(e) => e.stopPropagation()}>{c.contactNumber3}</a>
                          </span>
                        )}
                        <span className="flex items-center gap-1 ml-auto">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {c.city}
                        </span>
                      </div>
                      <p className="text-[10.5px] font-mono text-muted-foreground/60 mt-0.5">{c.id} · {c.rentals} rental{c.rentals !== 1 ? "s" : ""}</p>
                      {(() => {
                        const dueInfo = getCustomerDueBalance(c.id, c.name);
                        return (
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/40 gap-2">
                            <p className="text-[11px] font-medium min-w-0 truncate">
                              Due Balance:{" "}
                              {dueInfo.totalDue > 0 ? (
                                <strong className="text-rose-600">₹{dueInfo.totalDue.toLocaleString("en-IN")}</strong>
                              ) : (
                                <span className="text-emerald-600 font-semibold">₹0</span>
                              )}
                            </p>
                            <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                              <CustomerPayDueDialog customer={c} onSave={refresh} />
                              {!isStaff && (
                                <CustomerFormDialog
                                  title="Edit Customer"
                                  customer={c}
                                  onSave={refresh}
                                  trigger={
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-7 text-[11px] font-semibold gap-1 px-2.5 text-primary border-primary/30 hover:bg-primary/10 shadow-xs"
                                      title="Edit Customer"
                                    >
                                      <Edit className="h-3 w-3" /> Edit
                                    </Button>
                                  }
                                />
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* PERF: incremental rendering - only PAGE_SIZE rows mount at a time */}
          {hasMore && (
            <div className="flex items-center justify-center gap-3 border-t border-border/60 py-4">
              <span className="text-[12px] text-muted-foreground">
                Showing {visibleCustomers.length} of {filteredCustomers.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
              >
                Load more
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Profile Dialog */}
      <CustomerProfileDialog
        customer={profileCustomer}
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        onSave={refresh}
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
  required,
}: {
  label: string;
  placeholder?: string;
  type?: string;
  className?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  maxLength?: number;
  required?: boolean;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label} {required && <span className="text-destructive font-bold">*</span>}
      </Label>
      <Input type={type} placeholder={placeholder} value={value} onChange={onChange} maxLength={maxLength} />
    </div>
  );
}
