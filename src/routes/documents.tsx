import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { AppShell, StatusBadge } from "@/components/layout/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  FileText, FileImage, FileCheck2, Upload, Download, Search,
  Folder, FolderOpen, Trash2, Eye, ArrowLeft,
  Plus, FileDigit, ShieldAlert, MapPin, Calendar, Receipt, ScanLine
} from "lucide-react";
import { toast } from "sonner";
import {
  getDocuments,
  saveDocument,
  deleteDocument,
  DocumentItem,
  getRentals,
  getCustomers,
  getReturns,
  downloadAgreementFile,
  printReturnReceipt,
  printDocumentFile,
  downloadBase64File,
  formatDateDDMMYYYY,
  useDatabaseTrigger,
  getDocumentPreviewUrl,
  getDocumentWithFile,
} from "@/lib/data-store";

export const Route = createFileRoute("/documents")({
  head: () => ({ meta: [{ title: "Documents — MediRent" }] }),
  component: DocsPage,
});

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
        color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
        dotColor: "bg-blue-500",
      };
    case "Receipt":
      return {
        icon: Receipt,
        color: "text-green-500 bg-green-500/10 border-green-500/20",
        dotColor: "bg-green-500",
      };
    default:
      return {
        icon: FileDigit,
        color: "text-warning bg-warning/10 border-warning/20",
        dotColor: "bg-warning",
      };
  }
};

// Auto-scans an uploaded file's name (and falls back to its MIME type) to guess
// whether it's a KYC ID Proof or a Rental Agreement, so the uploader doesn't
// have to pick the type manually. Users can still override the detected value.
const ID_PROOF_KEYWORDS = [
  "aadhaar", "aadhar", "adhaar", "adhar", "uidai", "pan", "pancard",
  "voter", "epic", "license", "licence", "driving", "passport", "kyc", "idproof",
];
const AGREEMENT_KEYWORDS = ["agreement", "contract", "rental", "rent", "lease", "signed", "terms"];

const detectDocumentType = (fileName: string, mimeType: string): string | null => {
  const normalized = fileName.toLowerCase();
  const words = normalized.split(/[^a-z0-9]+/).filter(Boolean);

  if (words.some((w) => ID_PROOF_KEYWORDS.includes(w))) return "ID Proof";
  if (words.some((w) => AGREEMENT_KEYWORDS.includes(w))) return "Agreement";

  // No keyword match — fall back to a sensible default by file type:
  // KYC docs are usually photos/scans, agreements are usually PDFs.
  if (mimeType.startsWith("image/")) return "ID Proof";
  if (mimeType === "application/pdf") return "Agreement";

  return null;
};

function DocsPage() {
  const dbVersion = useDatabaseTrigger();
  
  // Storage lists
  const [docsList, setDocsList] = useState<DocumentItem[]>(() => getDocuments());
  const [rentalsList, setRentalsList] = useState(() => getRentals());
  const [customersList, setCustomersList] = useState(() => getCustomers());
  const [returnsList, setReturnsList] = useState(() => getReturns());

  // Navigation and filters
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null); // rentalId or "general"

  const changeFolder = (folderId: string | null) => {
    setSelectedFolderId(folderId);
    if (typeof window !== "undefined") {
      const newUrl = folderId 
        ? `${window.location.pathname}?folder=${folderId}` 
        : window.location.pathname;
      window.history.replaceState(null, "", newUrl);
    }
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [deleteDoc, setDeleteDoc] = useState<DocumentItem | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const isStaff = typeof window !== "undefined" && localStorage.getItem("medirent-user-role") === "Staff";

  // Form states for uploads
  const [newDocName, setNewDocName] = useState("");
  const [newDocType, setNewDocType] = useState("Agreement");
  const [newDocSize, setNewDocSize] = useState("120 KB");
  const [newDocFileData, setNewDocFileData] = useState("");
  const [typeAutoDetected, setTypeAutoDetected] = useState(false);

  useEffect(() => {
    setDocsList(getDocuments());
    setRentalsList(getRentals());
    setCustomersList(getCustomers());
    setReturnsList(getReturns());
    
    // Auto-select folder if present in URL search parameters (?folder=AGR-xxxx)
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const folderParam = params.get("folder");
      if (folderParam) {
        setSelectedFolderId(folderParam);
      }
    }
  }, [dbVersion]);

  // Load heavy file content from IndexedDB when a document is opened in preview
  useEffect(() => {
    if (previewDoc && !previewDoc.fileData) {
      setIsPreviewLoading(true);
      getDocumentWithFile(previewDoc).then((fullDoc) => {
        setPreviewDoc(fullDoc);
        setIsPreviewLoading(false);
      }).catch(() => setIsPreviewLoading(false));
    } else {
      setIsPreviewLoading(false);
    }
  }, [previewDoc?.id]);

  // Find the selected agreement (if any)
  const currentRental = useMemo(() => {
    if (!selectedFolderId || selectedFolderId === "general") return null;
    return rentalsList.find(r => r.id === selectedFolderId) || null;
  }, [selectedFolderId, rentalsList]);

  // Location Tag fileData loading state
  const [locDocFileData, setLocDocFileData] = useState<string | null>(null);

  useEffect(() => {
    if (currentRental) {
      const locDoc = docsList.find(d => d.type === "Location Tag" && (d.rentalId === currentRental.id || d.name.includes(currentRental.id)));
      if (locDoc) {
        if (locDoc.fileData) {
          setLocDocFileData(locDoc.fileData);
        } else {
          getDocumentWithFile(locDoc).then((fullDoc) => {
            setLocDocFileData(fullDoc.fileData || "");
          });
        }
      } else {
        setLocDocFileData(null);
      }
    } else {
      setLocDocFileData(null);
    }
  }, [currentRental, docsList]);

  // Find customer of the current agreement
  const currentCustomer = useMemo(() => {
    if (!currentRental) return null;
    return customersList.find(c => c.id === currentRental.customerId) || null;
  }, [currentRental, customersList]);

  // Find return records of the current agreement
  const currentReturns = useMemo(() => {
    if (!selectedFolderId) return [];
    return returnsList.filter(ret => ret.agreement === selectedFolderId);
  }, [selectedFolderId, returnsList]);

  // Unassociated files (files with no rentalId)
  const generalDocsCount = useMemo(() => {
    return docsList.filter(d => !d.rentalId).length;
  }, [docsList]);

  // Get dynamic file count inside each agreement folder
  // Only counts: Rental Agreement, Customer KYC (ID Proof), Location Tag, Return Agreement
  const getFolderFileCount = (rental: any) => {
    // 1. Uploaded or Signed Agreement and Delivery Photo files for this rental
    const agreementFiles = docsList.filter(d => d.rentalId === rental.id && (d.type === "Agreement" || d.type === "Signed Agreement" || d.type === "Delivery Photo")).length;
    // 2. Customer KYC (ID Proofs) of the rental's customer
    const kycFiles = docsList.filter(d => d.customerId === rental.customerId && d.type === "ID Proof").length;
    
    let systemFiles = 0;
    // 3. Dynamic system agreement (only if no uploaded agreement exists)
    if (agreementFiles === 0) systemFiles += 1;
    
    // 4. Return agreement (if returned)
    const returnCount = returnsList.filter(ret => ret.agreement === rental.id).length;
    systemFiles += returnCount;
    
    // 5. Dynamic Location Tag card (only if location tag doc exists for this agreement or coordinates exist in metadata)
    const hasLocation = docsList.some(d => d.type === "Location Tag" && (d.rentalId === rental.id || d.name.includes(rental.id))) || ((rental as any).latitude && (rental as any).longitude);
    if (hasLocation) systemFiles += 1;

    return agreementFiles + kycFiles + systemFiles;
  };

  // Agreements search and filter
  const filteredRentals = useMemo(() => {
    return rentalsList.filter((r) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      const customer = customersList.find(c => c.id === r.customerId);
      return (
        r.id.toLowerCase().includes(q) ||
        r.customer.toLowerCase().includes(q) ||
        String(r.equipment || "").toLowerCase().includes(q) ||
        String(r.serial || "").toLowerCase().includes(q) ||
        (r.equipmentItems && r.equipmentItems.some((ei: any) => String(ei.serial || "").toLowerCase().includes(q))) ||
        (customer && (
          String(customer.phone || "").toLowerCase().includes(q) ||
          String(customer.altPhone || "").toLowerCase().includes(q) ||
          String(customer.contactNumber3 || "").toLowerCase().includes(q)
        ))
      );
    });
  }, [rentalsList, customersList, searchQuery]);

  // Documents inside the currently opened folder.
  // Only shows: Rental Agreement (type=Agreement/Signed Agreement), Customer KYC (type=ID Proof), and Delivery Photos.
  // Location Tag and Return Agreement are shown as separate system cards.
  // Exchange Slips, Invoices, Receipts are intentionally excluded from this view.
  const folderDocuments = useMemo(() => {
    if (!selectedFolderId) return [];

    if (selectedFolderId === "general") {
      return docsList.filter(d => !d.rentalId && (d.type === "Agreement" || d.type === "Signed Agreement" || d.type === "ID Proof" || d.type === "Delivery Photo"));
    }

    const rental = rentalsList.find(r => r.id === selectedFolderId);
    if (!rental) return [];

    // Only include: uploaded/signed Agreement or Delivery Photo files for this rental + customer KYC ID Proofs
    return docsList.filter(d => {
      const isUploadedAgreement = d.rentalId === selectedFolderId && (d.type === "Agreement" || d.type === "Signed Agreement" || d.type === "Delivery Photo");
      const isKYC = d.customerId === rental.customerId && d.type === "ID Proof";
      return isUploadedAgreement || isKYC;
    });
  }, [selectedFolderId, docsList, rentalsList]);

  const handleUpload = () => {
    if (!newDocName) return;

    const newDoc: DocumentItem = {
      id: `doc-${Date.now()}`,
      name: newDocName.endsWith(".pdf") || newDocName.endsWith(".jpg") || newDocName.endsWith(".png")
        ? newDocName
        : `${newDocName}.pdf`,
      type: newDocType,
      size: newDocSize,
      date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      rentalId: selectedFolderId && selectedFolderId !== "general" ? selectedFolderId : undefined,
      customerId: currentRental?.customerId || undefined,
      fileData: newDocFileData || undefined,
    };

    saveDocument(newDoc);
    setDocsList(getDocuments());
    setNewDocName("");
    setNewDocFileData("");
    setTypeAutoDetected(false);
    setUploadOpen(false);
    toast.success(`Document "${newDoc.name}" uploaded inside folder.`);
  };

  const handleDelete = () => {
    if (!deleteDoc) return;
    deleteDocument(deleteDoc.id);
    setDocsList(getDocuments());
    toast.success(`Document "${deleteDoc.name}" deleted successfully.`);
    setDeleteDoc(null);
  };

  return (
    <AppShell
      title="Agreement Documents"
      subtitle="Browse agreement folders with rental agreement, customer KYC, location tag and return agreement"
    >
      {/* ─── 1. ROOT VIEW: LIST OF AGREEMENT FOLDERS ─── */}
      {!selectedFolderId && (
        <div className="space-y-6">
          {/* Toolbar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
              <Input
                placeholder="Search agreement, customer or equipment folder…"
                className="pl-9 h-9 text-[13px] bg-card"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Folders Grid */}
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 pt-4">
            {filteredRentals.map((r, i) => {
              const fileCount = getFolderFileCount(r);
              const kycFiles = docsList.filter(d => d.customerId === r.customerId && d.type === "ID Proof").length;
              const hasLocation = docsList.some(d => d.type === "Location Tag" && (d.rentalId === r.id || d.name.includes(r.id))) || ((r as any).latitude && (r as any).longitude);
              const isReturned = r.status === "Completed" || r.status === "Returned";
              
              return (
                <div key={r.id} className="mt-4 animate-[fade-in_0.35s_ease-out_both] flex flex-col">
                  <Card
                    onClick={() => { changeFolder(r.id); setSearchQuery(""); }}
                    className="group relative border border-border/75 bg-card hover:border-primary/50 hover:shadow-elevated transition-all duration-300 rounded-b-2xl rounded-tr-2xl cursor-pointer flex-1 mt-1.5"
                  >
                    {/* Folder Tab Cutout */}
                    <div className="absolute top-0 left-0 -translate-y-[21px] h-[22px] w-28 bg-card border-t border-x border-border/80 rounded-t-xl flex items-center justify-center gap-1.5 text-[9px] font-bold text-muted-foreground/80 tracking-wider">
                      <Folder className="h-3 w-3 fill-amber-500/20 text-amber-500" />
                      <span>{r.id}</span>
                    </div>
                    {/* Border Cover-up to blend tab with card */}
                    <div className="absolute -top-[1px] left-[1px] w-[110px] h-[2px] bg-card z-10" />

                    <CardContent className="p-4 flex flex-col justify-between h-[180px] pt-4.5">
                      {/* Top: Label & Status */}
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/50">
                          Rental Binder
                        </span>
                        <StatusBadge status={r.status} />
                      </div>

                      {/* Middle: Customer Name & Equipment */}
                      <div className="mt-3.5 flex-1">
                        <h4 className="font-bold text-[14.5px] text-foreground tracking-tight truncate leading-tight group-hover:text-primary transition-colors duration-200">
                          {r.customer}
                        </h4>
                        <p className="text-[11.5px] text-muted-foreground truncate mt-1">
                          {r.equipment}
                        </p>

                        {/* Contents Status Badges */}
                        <div className="flex flex-wrap gap-1 mt-3">
                          <span className="inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-wider bg-emerald-500/8 text-emerald-600 border border-emerald-500/18 shadow-sm">
                            📄 Agreement
                          </span>
                          {kycFiles > 0 ? (
                            <span className="inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-wider bg-emerald-500/8 text-emerald-600 border border-emerald-500/18 shadow-sm">
                              🪪 KYC ID
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-wider bg-amber-500/8 text-amber-600 border border-amber-500/18 shadow-sm">
                              ⚠️ No KYC
                            </span>
                          )}
                          {hasLocation && (
                            <span className="inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-wider bg-blue-500/8 text-blue-600 border border-blue-500/18 shadow-sm">
                              📍 Location
                            </span>
                          )}
                          {isReturned && (
                            <span className="inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-wider bg-purple-500/8 text-purple-600 border border-purple-500/18 shadow-sm">
                              🔄 Return
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Footer: Date & File count */}
                      <div className="flex items-center justify-between border-t border-border/40 mt-4 pt-3 text-[11px] text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground/60" />
                          <span>Started {formatDateDDMMYYYY(r.start)}</span>
                        </div>
                        <span className="font-bold text-primary bg-primary/8 px-2 py-0.5 rounded-full border border-primary/18 shadow-sm text-[10px]">
                          {fileCount} {fileCount === 1 ? 'file' : 'files'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}

            {filteredRentals.length === 0 && (
              <div className="col-span-full py-16 text-center">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/30 text-muted-foreground mb-4">
                  <Folder className="h-8 w-8" />
                </div>
                <p className="text-[14px] font-semibold">No folders found</p>
                <p className="text-[12px] text-muted-foreground mt-1">Add a rental agreement to create a folder.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── 2. FOLDER DETAIL VIEW ─── */}
      {selectedFolderId && (
        <div className="space-y-6">
          {/* Breadcrumb Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 rounded-lg p-0"
                onClick={() => { changeFolder(null); setSearchQuery(""); }}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-muted-foreground">Agreements</span>
                  <span className="text-[10px] text-muted-foreground">/</span>
                  <span className="text-[12px] font-mono font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-md border border-primary/10">
                    {selectedFolderId === "general" ? "General Files" : selectedFolderId}
                  </span>
                </div>
                <h3 className="font-bold text-[16px] text-foreground mt-0.5">
                  {selectedFolderId === "general" ? "General Documents Cabinet" : `Agreement Folder: ${currentRental?.customer}`}
                </h3>
              </div>
            </div>

            {/* Folder Actions */}
            <div className="flex items-center gap-2">
              <Dialog open={uploadOpen} onOpenChange={(open) => { setUploadOpen(open); if (!open) setTypeAutoDetected(false); }}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Upload File
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Upload File to Folder</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">File Name</Label>
                      <Input
                        placeholder="e.g. Customer KYC ID Proof"
                        value={newDocName}
                        onChange={(e) => setNewDocName(e.target.value)}
                        className="text-[13px]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">File Type</Label>
                      <Select value={newDocType} onValueChange={(v) => { setNewDocType(v); setTypeAutoDetected(false); }}>
                        <SelectTrigger className="text-[13px]">
                          <SelectValue placeholder="Select Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Agreement">Rental Agreement Doc</SelectItem>
                          <SelectItem value="ID Proof">KYC ID Proof (Aadhaar / PAN / Photo)</SelectItem>
                        </SelectContent>
                      </Select>
                      {typeAutoDetected && (
                        <p className="flex items-center gap-1 text-[10.5px] text-primary/80">
                          <ScanLine className="h-3 w-3" /> Auto-detected from file name — change if incorrect
                        </p>
                      )}
                    </div>
                    <div className="border border-dashed border-border/80 rounded-xl p-6 text-center bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer relative overflow-hidden">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground/60 mb-3" />
                      <p className="text-[12px] text-muted-foreground">Drag & drop file here, or <span className="text-primary font-semibold">click to browse</span></p>
                      <input
                        type="file"
                        accept=".pdf,image/*,.jpg,.png,.jpeg"
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setNewDocName(file.name.replace(/\.[^/.]+$/, ""));
                            const kb = Math.round(file.size / 1024);
                            setNewDocSize(kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`);

                            const detectedType = detectDocumentType(file.name, file.type);
                            if (detectedType) {
                              setNewDocType(detectedType);
                              setTypeAutoDetected(true);
                              toast.info(`Auto-scanned file — detected type: ${detectedType === "ID Proof" ? "KYC ID Proof" : "Rental Agreement"}`);
                            } else {
                              setTypeAutoDetected(false);
                            }

                            const reader = new FileReader();
                            reader.onloadend = () => setNewDocFileData(reader.result as string);
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setUploadOpen(false)}>Cancel</Button>
                    <Button onClick={handleUpload} disabled={!newDocName}>Upload</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
                   {/* Quick Agreement Summary Card */}
          {currentRental && (
            <Card className="border border-border/60 bg-muted/5 shadow-[var(--shadow-soft)] animate-[fade-in_0.3s_ease-out]">
              <CardContent className="p-4 sm:p-5">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-[12.5px] text-muted-foreground">
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-0.5 block">Customer Details</span>
                    <p className="text-foreground font-semibold text-[13px]">{currentRental.customer}</p>
                    <p className="text-muted-foreground text-[11px] font-mono mt-0.5">{currentRental.customerId}</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-0.5 block">Equipment & Model</span>
                    <p className="text-foreground font-semibold text-[13px] truncate">{currentRental.equipment}</p>
                    <p className="text-muted-foreground text-[11px] font-mono mt-0.5">{currentRental.serial || "No Serial"}</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-0.5 block">Agreement Period</span>
                    <p className="text-foreground font-semibold text-[13px]">
                      {formatDateDDMMYYYY(currentRental.start)} to {currentRental.end ? formatDateDDMMYYYY(currentRental.end) : "Ongoing"}
                    </p>
                    <p className="text-muted-foreground text-[11px] mt-0.5">Cycle: {currentRental.monthlyRent > 0 ? "Monthly" : "Daily"}</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-0.5 block">Customer KYC Info</span>
                    {currentCustomer ? (
                      <div className="space-y-0.5 mt-0.5">
                        {currentCustomer.aadhaar && <p className="text-[11px] text-foreground"><strong className="text-muted-foreground">Aadhaar:</strong> {currentCustomer.aadhaar}</p>}
                        {currentCustomer.pan && <p className="text-[11px] text-foreground"><strong className="text-muted-foreground">PAN:</strong> {currentCustomer.pan}</p>}
                        {!currentCustomer.aadhaar && !currentCustomer.pan && <p className="text-muted-foreground text-[11px]">No KYC info registered</p>}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-[11px] mt-0.5">No customer profile details</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Folder Contents Document Grid */}
          <div className="space-y-3">
            <h4 className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/75 px-1 flex items-center gap-1.5">
              <FolderOpen className="h-3.5 w-3.5 text-warning-foreground" />
              Folder Contents ({
                folderDocuments.length +
                (currentRental && !folderDocuments.some(d => d.type === "Agreement") ? 1 : 0) +
                (currentRental && (docsList.some(d => d.type === "Location Tag" && (d.rentalId === currentRental.id || d.name.includes(currentRental.id))) || ((currentRental as any).latitude && (currentRental as any).longitude)) ? 1 : 0) +
                (currentRental ? currentReturns.length : 0)
              } files)
            </h4>

            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {/* DYNAMIC SYSTEM FILE: LOCATION & DIRECTIONS TAG */}
              {currentRental && (docsList.some(d => d.type === "Location Tag" && (d.rentalId === currentRental.id || d.name.includes(currentRental.id))) || ((currentRental as any).latitude && ((currentRental as any).longitude))) && (() => {
                const locDoc = docsList.find(d => d.type === "Location Tag" && (d.rentalId === currentRental.id || d.name.includes(currentRental.id)));
                let coords = "";
                let address = "";
                let mapsUrl = "";

                const fileData = locDocFileData || locDoc?.fileData;
                if (fileData) {
                  // Try multiple decode strategies to extract latitude/longitude
                  const tryDecode = (): string => {
                    try {
                      // Strategy 1: base64 encoded with data:text/plain;base64, prefix
                      if (fileData.startsWith("data:text/plain;base64,")) {
                        return decodeURIComponent(escape(atob(fileData.replace("data:text/plain;base64,", ""))));
                      }
                      // Strategy 2: any data:...;base64, prefix
                      const b64Match = fileData.match(/^data:[^;]+;base64,(.+)$/);
                      if (b64Match) {
                        return decodeURIComponent(escape(atob(b64Match[1])));
                      }
                      // Strategy 3: plain text (not base64)
                      return fileData;
                    } catch {
                      try {
                        // Strategy 4: raw atob without URI decoding
                        const b64Match = fileData.match(/^data:[^;]+;base64,(.+)$/);
                        return b64Match ? atob(b64Match[1]) : fileData;
                      } catch {
                        return fileData;
                      }
                    }
                  };

                  const decoded = tryDecode();
                  const latMatch = decoded.match(/Latitude[:\s]+([-\d.]+)/i);
                  const lngMatch = decoded.match(/Longitude[:\s]+([-\d.]+)/i);
                  const addrMatch = decoded.match(/Address[:\s]+(.+?)(?:\n|$)/i);

                  if (latMatch && lngMatch) {
                    coords = `${latMatch[1]}, ${lngMatch[1]}`;
                    mapsUrl = `https://www.google.com/maps?q=${latMatch[1]},${lngMatch[1]}`;
                  }
                  if (addrMatch) {
                    address = addrMatch[1].trim();
                  }
                }

                // Fallback to coordinates directly saved in the rental agreement
                if (!coords && ((currentRental as any).latitude || (currentRental as any).longitude)) {
                  const lat = Number((currentRental as any).latitude) || 0;
                  const lng = Number((currentRental as any).longitude) || 0;
                  if (lat !== 0 || lng !== 0) {
                    coords = `${lat}, ${lng}`;
                    mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
                  }
                  if ((currentRental as any).locationAddress) {
                    address = (currentRental as any).locationAddress;
                  }
                }

                // Fallback if no coords/mapsUrl: check locationAddress directly
                if ((!mapsUrl || mapsUrl.includes("query=" + currentRental.customer)) && (currentRental as any).locationAddress) {
                  const locAddr = String((currentRental as any).locationAddress).trim();
                  if (locAddr.startsWith("http://") || locAddr.startsWith("https://")) {
                    mapsUrl = locAddr;
                  } else {
                    mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locAddr)}`;
                  }
                  if (!address || address === "Location Tagged") {
                    address = locAddr;
                  }
                }

                // Fallback: default to customer search if still no mapsUrl
                if (!mapsUrl) {
                  mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(currentRental.customer || "Location")}`;
                }

                return (
                  <Card className="relative border border-emerald-500/25 hover:border-emerald-500/45 hover:shadow-[var(--shadow-elevated)] bg-emerald-500/5 transition-all duration-200">
                    <CardContent className="p-4 flex flex-col justify-between h-[160px]">
                      <div className="flex items-start gap-3">
                        <div className="metric-icon h-11 w-11 bg-emerald-500/15 text-emerald-600 border border-emerald-500/20">
                          <MapPin className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-[13px] text-foreground leading-snug truncate">Location Tag</h4>
                          <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-600 mt-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            GPS Captured
                          </span>
                          {coords && (
                            <p className="text-[10px] text-muted-foreground mt-1.5 font-mono leading-tight" title={coords}>
                              {coords}
                            </p>
                          )}
                          {address && !coords && (
                            <p className="text-[10px] text-muted-foreground mt-1.5 line-clamp-2 leading-tight" title={address}>
                              {address}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between border-t border-border/40 pt-2 mt-2">
                        <span className="text-[11px] text-muted-foreground">Delivery Location</span>
                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 text-[11px] font-bold transition-colors"
                        >
                          <MapPin className="h-3 w-3" /> Get Directions
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}

              {/* DYNAMIC SYSTEM FILE: RENTAL AGREEMENT PDF */}
              {currentRental && !folderDocuments.some(d => d.type === "Agreement") && (
                <Card className="relative border border-primary/20 hover:border-primary/45 hover:shadow-[var(--shadow-elevated)] bg-primary/5/5 transition-all duration-200">
                  <CardContent className="p-4 flex flex-col justify-between h-[160px]">
                    <div className="flex items-start gap-3">
                      <div className="metric-icon h-11 w-11 bg-accent/15 text-accent border border-accent/20">
                        <FileCheck2 className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-[13px] text-foreground leading-snug truncate">Agreement_{currentRental.id}.pdf</h4>
                        <span className="inline-flex items-center gap-1.5 rounded-md border border-accent/18 bg-accent/10 px-2 py-0.5 text-[9px] font-bold text-accent mt-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                          System Agreement
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-border/40 pt-2 mt-4">
                      <span className="text-[11px] text-muted-foreground">Auto-generated</span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2.5 text-[11px] gap-1 hover:bg-primary/5 hover:text-primary"
                        onClick={() => {
                          downloadAgreementFile(currentRental);
                          toast.success("Downloading rental agreement PDF...");
                        }}
                      >
                        <Download className="h-3 w-3" /> Get PDF
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* DYNAMIC SYSTEM FILE: RETURN AGREEMENTS */}
              {currentRental && currentReturns.map((ret) => (
                <Card key={ret.id} className="relative border border-orange-500/25 hover:border-orange-500/45 hover:shadow-[var(--shadow-elevated)] bg-orange-500/5 transition-all duration-200">
                  <CardContent className="p-4 flex flex-col justify-between h-[160px]">
                    <div className="flex items-start gap-3">
                      <div className="metric-icon h-11 w-11 bg-orange-500/15 text-orange-600 border border-orange-500/20">
                        <FileCheck2 className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-[13px] text-foreground leading-snug truncate">Return_Agreement_{ret.id}.pdf</h4>
                        <span className="inline-flex items-center gap-1.5 rounded-md border border-orange-500/20 bg-orange-500/10 px-2 py-0.5 text-[9px] font-bold text-orange-600 mt-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                          Return Agreement
                        </span>
                        <p className="text-[10px] text-muted-foreground mt-1.5">Returned on {formatDateDDMMYYYY(ret.date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-border/40 pt-2 mt-2">
                      <span className="text-[11px] text-muted-foreground">{ret.id}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2.5 text-[11px] gap-1 hover:bg-orange-500/10 hover:text-orange-600 hover:border-orange-500/30"
                        onClick={() => {
                          printReturnReceipt(ret);
                          toast.success("Generating return agreement PDF...");
                        }}
                      >
                        <Download className="h-3 w-3" /> Get PDF
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* UPLOADED FILES LIST */}
              {folderDocuments.map((d, i) => {
                const { icon: DocIcon, color, dotColor } = getDocDetails(d.type);
                return (
                  <Card
                    key={d.id}
                    className="relative border border-border/60 hover:border-primary/30 hover:shadow-[var(--shadow-elevated)] transition-all duration-200"
                  >
                    <CardContent className="p-4 flex flex-col justify-between h-[160px]">
                      <div className="flex items-start gap-3">
                        <div className={`metric-icon h-11 w-11 ${color}`}>
                          <DocIcon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-[13px] text-foreground leading-snug truncate" title={d.name}>{d.name}</h4>
                          <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[9px] font-bold mt-1.5 ${color}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
                            {d.type}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between border-t border-border/40 pt-2 mt-4">
                        <span className="text-[11px] text-muted-foreground">{d.size} · {formatDateDDMMYYYY(d.date)}</span>
                        <div className="flex gap-1.5">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            title="Preview File"
                            onClick={() => {
                              setIsPreviewLoading(true);
                              setPreviewDoc(d);
                            }}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            title="Download / Print File"
                            onClick={async () => {
                              const ok = await printDocumentFile(d);
                              if (ok) {
                                toast.success(`Opening download file: ${d.name}`);
                              } else {
                                toast.error(`"${d.name}" isn't available on this device and hasn't been backed up to Google Sheets yet.`);
                              }
                            }}
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                          {!isStaff && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-destructive hover:bg-destructive/5"
                              title="Delete File"
                              onClick={() => setDeleteDoc(d)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {folderDocuments.length === 0 && !currentRental && (
                <div className="col-span-full py-16 text-center">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/30 text-muted-foreground mb-4">
                    <FileDigit className="h-8 w-8" />
                  </div>
                  <p className="text-[14px] font-semibold">No files inside folder</p>
                  <p className="text-[12px] text-muted-foreground mt-1">Upload a document file to get started.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── 3. DIALOGS (PREVIEW, DELETE CONFIRMATION) ─── */}
      <Dialog open={!!previewDoc} onOpenChange={(open) => { if (!open) { setPreviewDoc(null); setIsPreviewLoading(false); } }}>
        <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-5 overflow-hidden">
          <DialogHeader className="pb-2 border-b border-border/50">
            <DialogTitle>Document Preview</DialogTitle>
          </DialogHeader>
          {previewDoc && (
            <div className="flex-1 min-h-0 flex flex-col space-y-3 mt-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-[14px] text-foreground">{previewDoc.name}</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{previewDoc.type} · {previewDoc.size} · Uploaded {formatDateDDMMYYYY(previewDoc.date)}</p>
                </div>
              </div>
              <div className="flex-1 min-h-0 border border-border/60 rounded-xl overflow-hidden bg-muted/10 w-full relative">
                {isPreviewLoading ? (
                  <div className="flex flex-col items-center justify-center w-full h-full gap-4">
                    <div className="h-10 w-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                    <p className="text-[13px] text-muted-foreground font-medium">Loading document preview…</p>
                  </div>
                ) : previewDoc.fileData && previewDoc.fileData !== "NOT_FOUND" && (previewDoc.fileData.startsWith("data:image/") || (previewDoc.fileData.startsWith("data:") && previewDoc.name.toLowerCase().match(/\.(png|jpe?g|gif|webp|svg)$/))) ? (
                  <div className="flex items-center justify-center w-full h-full p-2 bg-white">
                    <img
                      src={previewDoc.fileData}
                      className="max-h-full max-w-full object-contain rounded-lg shadow-sm"
                      alt={previewDoc.name}
                    />
                  </div>
                ) : previewDoc.fileData && previewDoc.fileData !== "NOT_FOUND" && previewDoc.fileData.startsWith("data:application/pdf") ? (
                  <iframe
                    src={previewDoc.fileData}
                    className="w-full h-full border-0 bg-white"
                    title={previewDoc.name}
                  />
                ) : previewDoc.fileData === "NOT_FOUND" ? (
                  <div className="flex flex-col items-center justify-center bg-muted/5 border border-border/40 rounded-xl p-8 h-full text-center">
                    <ShieldAlert className="h-10 w-10 text-destructive mb-3" />
                    <h5 className="font-bold text-[14px] text-foreground">File Content Not Available</h5>
                    <p className="text-[12px] text-muted-foreground mt-1 max-w-md">
                      This file was not found on this device's storage. Files uploaded on another device
                      may not be available here unless Google Sheets sync is enabled.
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
            </div>
          )}
          <DialogFooter className="sm:justify-between border-t border-border/50 pt-4 mt-4">
            {previewDoc && !isStaff && (
              <Button
                variant="ghost"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive text-[13px] h-9"
                onClick={() => {
                  setDeleteDoc(previewDoc);
                  setPreviewDoc(null);
                }}
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
              </Button>
            )}
            <div className="flex gap-2">
              <Button variant="outline" className="h-9 text-[13px]" onClick={() => setPreviewDoc(null)}>Close</Button>
              {previewDoc && (
                <Button
                  className="h-9 text-[13px]"
                  disabled={previewDoc.fileData === "NOT_FOUND"}
                  title={previewDoc.fileData === "NOT_FOUND" ? "Not available on this device or in Google Sheets" : undefined}
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteDoc} onOpenChange={(open) => !open && setDeleteDoc(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <ShieldAlert className="h-4 w-4" /> Delete Document
            </DialogTitle>
          </DialogHeader>
          {deleteDoc && (
            <div className="py-2 space-y-3">
              <p className="text-[13px] text-muted-foreground">
                Are you sure you want to delete <strong className="text-foreground">{deleteDoc.name}</strong>?
              </p>
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-[12px] text-destructive">
                ⚠️ This will permanently delete the document from the cloud servers. This action is irreversible.
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDoc(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Permanently Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
