import { useState, useEffect, useMemo } from "react";
import { Combobox } from "@/components/ui/combobox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { getOwners, getEquipment, saveEquipment, getNextEquipmentNumber, EQUIPMENT_CATEGORIES, saveOwner, getNextOwnerNumber } from "@/lib/data-store";
import { cn, capitalizeWords } from "@/lib/utils";

export const isOwnOwner = (ownerName?: any) => {
  if (!ownerName) return false;
  const val = String(ownerName).toLowerCase().trim();
  if (val === "deepak" || val === "relife" || val.includes("relife")) return true;
  
  try {
    const ownersList = getOwners();
    const match = ownersList.find(o => String(o.name || "").toLowerCase().trim() === val);
    if (match && match.ownerName && String(match.ownerName).toLowerCase().trim() === "deepak") {
      return true;
    }
  } catch (e) {
    // fallthrough
  }
  return false;
};

export type Equipment = {
  id: string;
  name: string;
  category: string;
  serial: string;
  model: string;
  manufacturer: string;
  owner: string;
  status: string;
  purchaseDate: string;
  purchaseCost: number;
  agreementNumber?: string;
  agreementDate?: string;
  ownerDailyRate?: number;
  ownerHistory?: { date: string; action: "returned" | "received"; notes?: string }[];
};

const ensureYYYYMMDD = (dateStr?: string) => {
  if (!dateStr) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  
  const parts = dateStr.split("T")[0].split(/[-/]/);
  if (parts.length === 3) {
    let y = parts[0];
    let m = parts[1];
    let d = parts[2];
    if (parts[2].length === 4) {
      y = parts[2];
      m = parts[1];
      d = parts[0];
    }
    const pad = (s: string) => s.length === 1 ? `0${s}` : s;
    return `${y}-${pad(m)}-${pad(d)}`;
  }
  return dateStr;
};


function Field({ label, placeholder, type = "text", className, value, onChange }: {
  label: string; placeholder?: string; type?: string; className?: string; value?: string; onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</Label>
      <Input type={type} placeholder={placeholder} value={value} onChange={onChange} className="bg-background h-10" />
    </div>
  );
}

export function EquipmentFormDialog({ title, eq, trigger, onSave }: { title: string; eq?: Equipment; trigger: React.ReactNode; onSave?: (savedEq?: Equipment) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [owners, setOwners] = useState<any[]>([]);
  const [category, setCategory] = useState(eq?.category || "");
  const [customCategory, setCustomCategory] = useState("");
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [serial, setSerial] = useState(eq?.serial || "");
  const [model, setModel] = useState(eq?.model || "");
  const [manufacturer, setManufacturer] = useState(eq?.manufacturer || "");
  const [owner, setOwner] = useState(eq?.owner || "");
  const [purchaseDate, setPurchaseDate] = useState(eq?.purchaseDate ? ensureYYYYMMDD(eq.purchaseDate) : "");
  const [purchaseCost, setPurchaseCost] = useState(eq?.purchaseCost?.toString() || "");
  const [status, setStatus] = useState(eq?.status || "Available");
  const [ownerDailyRate, setOwnerDailyRate] = useState(eq?.ownerDailyRate?.toString() || "");

  // New Owner Quick-Add States
  const [isAddingNewOwner, setIsAddingNewOwner] = useState(false);
  const [newOwnerOrg, setNewOwnerOrg] = useState("");
  const [newOwnerIndividual, setNewOwnerIndividual] = useState("");
  const [newOwnerPhone, setNewOwnerPhone] = useState("");
  const [newOwnerEmail, setNewOwnerEmail] = useState("");
  const [newOwnerAddress, setNewOwnerAddress] = useState("");

  const ownerOptions = useMemo(() => {
    const list = owners.map((o) => ({
      value: o.name,
      label: o.ownerName ? `${o.ownerName} (${o.name})` : o.name,
    }));
    const hasOwn = list.some((item) => isOwnOwner(item.value));
    const baseList = hasOwn ? list : [{ value: "ReLife", label: "ReLife (Self Owned)" }, ...list];
    return [
      ...baseList,
      { value: "Add New Owner", label: "✨ Add New Owner..." }
    ];
  }, [owners]);

  const categoryOptions = useMemo(() => {
    const list = EQUIPMENT_CATEGORIES.map((c) => ({
      value: c,
      label: c,
    }));
    return [
      ...list,
      { value: "Custom", label: "✨ Other / Add New Category..." }
    ];
  }, []);

  useEffect(() => {
    if (isOpen) {
      const fetchedOwners = getOwners();
      setOwners(fetchedOwners);
      const isPredefined = eq?.category ? EQUIPMENT_CATEGORIES.includes(eq.category) : true;
      setCategory(isPredefined ? (eq?.category || "") : "Custom");
      setCustomCategory(isPredefined ? "" : (eq?.category || ""));
      setIsCustomCategory(!isPredefined);
      setSerial(eq?.serial || "");
      setModel(eq?.model || "");
      setManufacturer(eq?.manufacturer || "");
      
      if (eq?.owner) {
        setOwner(eq.owner);
      } else {
        const defaultOwn = fetchedOwners.find((o) => isOwnOwner(o.name))?.name || fetchedOwners[0]?.name || "ReLife";
        setOwner(defaultOwn);
      }

      setPurchaseDate(eq?.purchaseDate ? ensureYYYYMMDD(eq.purchaseDate) : "");
      setPurchaseCost(eq?.purchaseCost?.toString() || "");
      setStatus(eq?.status || "Available");
      setOwnerDailyRate(eq?.ownerDailyRate?.toString() || "");

      // Reset new owner states
      setIsAddingNewOwner(false);
      setNewOwnerOrg("");
      setNewOwnerIndividual("");
      setNewOwnerPhone("");
      setNewOwnerEmail("");
      setNewOwnerAddress("");
    }
  }, [isOpen, eq]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("addNew") === "true" && !eq) {
        setIsOpen(true);
        // Clean query param
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }
    }
  }, [eq]);

  const handleSave = (): boolean => {
    const finalCategory = isCustomCategory ? customCategory.trim() : category;
    if (!finalCategory) {
      toast.error(isCustomCategory ? "Please enter a custom category name." : "Please select a category.");
      return false;
    }
    if (!serial) {
      toast.error("Please enter a serial number.");
      return false;
    }
    const duplicate = getEquipment().find(
      (e) => e.id !== eq?.id && String(e.serial || "").trim().toLowerCase() === String(serial || "").trim().toLowerCase()
    );
    if (duplicate) {
      toast.error(`Serial number "${String(serial || "").trim()}" is already used by "${duplicate.name}" (${duplicate.id}). Each equipment must have a unique serial number.`);
      return false;
    }
    if (!status) {
      toast.error("Please select a status.");
      return false;
    }

    let finalOwnerName = owner;
    if (isAddingNewOwner) {
      const orgName = newOwnerOrg.trim();
      const indName = newOwnerIndividual.trim();
      if (!orgName) {
        toast.error("Please enter the new owner's organization name.");
        return false;
      }
      if (!indName) {
        toast.error("Please enter the new owner's individual name.");
        return false;
      }
      if (newOwnerPhone.trim()) {
        const digits = newOwnerPhone.replace(/\D/g, "");
        if (digits.length !== 10) {
          toast.error("New Owner Phone Number must be exactly 10 digits.");
          return false;
        }
      }

      // Save the new owner
      const newOwnerId = getNextOwnerNumber();
      saveOwner({
        id: newOwnerId,
        name: orgName,
        ownerName: indName,
        inventorySeries: "",
        phone: newOwnerPhone.trim(),
        email: newOwnerEmail.trim(),
        address: newOwnerAddress.trim(),
        commissionRate: 100,
        status: "Active",
      });

      finalOwnerName = orgName;
    } else {
      if (!owner) {
        toast.error("Please select an owner.");
        return false;
      }
    }

    const id = eq?.id || getNextEquipmentNumber(finalCategory);
    
    // If it's my own equipment, it should not be returned to owner
    const finalStatus = isOwnOwner(finalOwnerName) && status === "Returned to Owner" ? "Available" : status;

    const isOwn = isOwnOwner(finalOwnerName);
    const savedEq = {
      id,
      name: finalCategory,
      category: finalCategory,
      serial,
      model,
      manufacturer,
      owner: finalOwnerName,
      status: finalStatus,
      purchaseDate: isOwn ? "" : purchaseDate,
      purchaseCost: isOwn ? 0 : (parseFloat(purchaseCost) || 0),
      ownerDailyRate: isOwn ? 0 : (parseFloat(ownerDailyRate) || 0),
      ownerHistory: eq?.ownerHistory || [],
    } as any;
    saveEquipment(savedEq);
    toast.success(eq ? `Equipment "${finalCategory}" updated successfully.` : "New equipment item created successfully.");
    if (onSave) onSave(savedEq);
    setIsOpen(false);
    return true;
  };

  const duplicateEq = useMemo(() => {
    const cleanSerial = String(serial || "").trim().toLowerCase();
    if (!cleanSerial) return null;
    return getEquipment().find(
      (e) => e.id !== eq?.id && String(e.serial || "").trim().toLowerCase() === cleanSerial
    );
  }, [serial, eq]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild onClick={() => setIsOpen(true)}>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {duplicateEq && (
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[12.5px] font-semibold animate-[fade-in_0.2s_ease-out] mb-1">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>
              Serial number <strong>"{String(serial || "").trim()}"</strong> already exists in inventory for <strong>{duplicateEq.name}</strong> ({duplicateEq.id})!
            </span>
          </div>
        )}

        <div className="grid gap-4 py-2 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2 flex flex-col justify-end">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Category</Label>
            <Combobox
              options={categoryOptions}
              value={category}
              onValueChange={(val) => {
                setCategory(val);
                if (val === "Custom") {
                  setIsCustomCategory(true);
                } else {
                  setIsCustomCategory(false);
                }
              }}
              placeholder="Select category..."
              searchPlaceholder="Search categories..."
              emptyText="No category found."
            />
          </div>
          {isCustomCategory && (
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Custom Category Name</Label>
              <Input 
                placeholder="Enter custom category name" 
                value={customCategory} 
                onChange={(e) => setCustomCategory(capitalizeWords(e.target.value))} 
                className="bg-background h-10" 
              />
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Serial Number *</span>
              {duplicateEq && <span className="text-rose-600 font-bold text-[10.5px]">DUPLICATE SERIAL</span>}
            </Label>
            <Input
              placeholder="e.g. PHE-77821"
              value={serial}
              onChange={(e) => setSerial(e.target.value)}
              className={cn("bg-background h-10 transition-colors", duplicateEq && "border-rose-500 focus-visible:ring-rose-500 bg-rose-50/20 text-rose-900 font-semibold")}
            />
            {duplicateEq && (
              <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1 mt-0.5">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 text-rose-600" /> Duplicate serial number found in inventory!
              </p>
            )}
          </div>
          <Field label="Model Number"     placeholder="e.g. EverFlo Q"        value={model} onChange={(e) => setModel(capitalizeWords(e.target.value))} />
          <Field label="Manufacturer"     placeholder="e.g. Philips"          value={manufacturer} onChange={(e) => setManufacturer(capitalizeWords(e.target.value))} />
          <div className="space-y-1.5 flex flex-col justify-end">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Owner</Label>
            <Combobox
              options={ownerOptions}
              value={isAddingNewOwner ? "Add New Owner" : owner}
              onValueChange={(val) => {
                if (val === "Add New Owner") {
                  setIsAddingNewOwner(true);
                } else {
                  setIsAddingNewOwner(false);
                  setOwner(val);
                }
              }}
              placeholder="Select owner..."
              searchPlaceholder="Search owners..."
              emptyText="No owner found."
            />
          </div>
          {isAddingNewOwner && (
            <div className="sm:col-span-2 border border-dashed border-primary/40 bg-primary/5 rounded-xl p-4 space-y-3 mt-1 animate-[fade-in_0.2s_ease-out]">
              <div className="flex items-center justify-between border-b border-primary/20 pb-1.5 mb-1">
                <span className="text-[11px] font-bold text-primary uppercase tracking-wider">New Owner Details</span>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="h-6.5 text-[10px] text-muted-foreground hover:text-foreground px-1.5"
                  onClick={() => {
                    setIsAddingNewOwner(false);
                    setOwner("");
                  }}
                >
                  Cancel / Select Existing Owner
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 text-[13px]">
                <Field 
                  label="Organization Name *" 
                  placeholder="e.g. Zenith Medtech Solutions" 
                  value={newOwnerOrg} 
                  onChange={(e) => setNewOwnerOrg(capitalizeWords(e.target.value))} 
                />
                <Field 
                  label="Owner Name *" 
                  placeholder="e.g. Dr. Amit Vyas" 
                  value={newOwnerIndividual} 
                  onChange={(e) => setNewOwnerIndividual(capitalizeWords(e.target.value))} 
                />
                <Field 
                  label="Contact Phone" 
                  placeholder="10-digit phone number" 
                  value={newOwnerPhone} 
                  onChange={(e) => setNewOwnerPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} 
                />
                <Field 
                  label="Contact Email" 
                  placeholder="e.g. partner@zenith.com" 
                  value={newOwnerEmail} 
                  onChange={(e) => setNewOwnerEmail(e.target.value)} 
                />
                <Field 
                  label="Office / Billing Address" 
                  placeholder="Full business address..." 
                  className="sm:col-span-2" 
                  value={newOwnerAddress} 
                  onChange={(e) => setNewOwnerAddress(capitalizeWords(e.target.value))} 
                />
              </div>
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</Label>
            <Select value={status} onValueChange={setStatus} disabled={eq?.status === "Rented"}>
              <SelectTrigger className="h-10 text-[13px]"><SelectValue placeholder="Select status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Available">Available</SelectItem>
                <SelectItem value="UnderMaintenance">Under Maintenance</SelectItem>
                {!isOwnOwner(isAddingNewOwner ? newOwnerOrg : owner) && <SelectItem value="Returned to Owner">Returned to Owner</SelectItem>}
                {eq?.status === "Rented" && <SelectItem value="Rented">Rented (Active Rental)</SelectItem>}
              </SelectContent>
            </Select>
          </div>
          {!isOwnOwner(isAddingNewOwner ? newOwnerOrg : owner) && (
            <>
              <Field label="Purchase Date"    type="date"   value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
              <Field label="Daily Rate to Owner (₹)" placeholder="e.g. 50" value={ownerDailyRate} onChange={(e) => setOwnerDailyRate(e.target.value)} />
            </>
          )}

        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" type="button">Cancel</Button>
          </DialogClose>
          <Button
            type="button"
            onClick={() => {
              handleSave();
            }}
          >
            Save Equipment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
