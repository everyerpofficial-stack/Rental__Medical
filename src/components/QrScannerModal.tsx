import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/layout/AppShell";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import {
  QrCode,
  Camera,
  Upload,
  Search,
  X,
  History,
  FileText,
  RotateCcw,
  RefreshCw,
  AlertTriangle,
  Info,
  Calendar,
  User,
  ExternalLink,
} from "lucide-react";
import { getEquipment, getRentals, getReturns, getExchanges } from "@/lib/data-store";

interface QrScannerModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onScanSuccess?: (serialNumber: string) => void;
  // If true, just calls onScanSuccess and doesn't show detail dashboard (useful for inline fields)
  inlineMode?: boolean;
  bulkMode?: boolean;
  title?: string;
}

export function QrScannerModal({
  isOpen,
  onOpenChange,
  onScanSuccess,
  inlineMode = false,
  bulkMode = false,
  title = "QR Code Scanner",
}: QrScannerModalProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"camera" | "upload" | "manual">("camera");
  const [manualSerial, setManualSerial] = useState("");
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  const [bulkScannedSerials, setBulkScannedSerials] = useState<string[]>([]);

  // Product & Rental info
  const [matchedProduct, setMatchedProduct] = useState<any | null>(null);
  const [activeRental, setActiveRental] = useState<any | null>(null);
  const [productRentals, setProductRentals] = useState<any[]>([]);
  const [productExchanges, setProductExchanges] = useState<any[]>([]);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const lastScanTimeRef = useRef<{ [code: string]: number }>({});
  const scannerContainerId = "qr-scanner-element";

  // Reset states when opening/closing
  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      setScannedResult(null);
      setMatchedProduct(null);
      setActiveRental(null);
      setProductRentals([]);
      setProductExchanges([]);
      setManualSerial("");
      setCameraError(null);
      setBulkScannedSerials([]);
    } else {
      setActiveTab("camera");
      setCameraError(null);
    }
  }, [isOpen]);

  // BUG-6 FIX: Clean up camera resources on component unmount.
  // Without this, navigating away while the camera is active leaves the
  // scanner running and leaking device camera resources.
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        if (html5QrCodeRef.current.isScanning) {
          html5QrCodeRef.current.stop().catch(() => {});
        }
        html5QrCodeRef.current = null;
      }
    };
  }, []);

  // Handle switching tabs
  useEffect(() => {
    if (isOpen) {
      if (activeTab === "camera") {
        startScanner();
      } else {
        stopScanner();
      }
    }
  }, [activeTab, isOpen]);

  const startScanner = async () => {
    setCameraError(null);
    setIsCameraActive(false);

    // Wait a brief tick for the DOM container to render
    setTimeout(async () => {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (!devices || devices.length === 0) {
          setCameraError("No cameras found on your device.");
          return;
        }

        setCameras(devices);

        // Pick back camera if available, otherwise first one
        let cameraId = selectedCameraId;
        // What we actually hand to scanner.start() — normally the resolved device id,
        // but falls back to a facingMode constraint when label-matching can't
        // confidently identify the back camera (e.g. generic/non-English labels),
        // so we don't silently default to the front/selfie camera.
        let startTarget: string | MediaTrackConstraints = cameraId;
        if (!cameraId) {
          const backCamera = devices.find((device) =>
            device.label.toLowerCase().includes("back") ||
            device.label.toLowerCase().includes("environment")
          );
          if (backCamera) {
            cameraId = backCamera.id;
            startTarget = cameraId;
          } else if (devices.length > 1) {
            cameraId = devices[0].id;
            startTarget = { facingMode: "environment" };
          } else {
            cameraId = devices[0].id;
            startTarget = cameraId;
          }
          setSelectedCameraId(cameraId);
        }

        // Initialize scanner if not already created
        if (!html5QrCodeRef.current) {
          html5QrCodeRef.current = new Html5Qrcode(scannerContainerId);
        }

        const scanner = html5QrCodeRef.current;
        if (scanner.isScanning) {
          await scanner.stop();
        }

        await scanner.start(
          startTarget,
          {
            fps: 10,
            qrbox: (width, height) => {
              const size = Math.min(width, height) * 0.65;
              return { width: size, height: size };
            },
          },
          (decodedText) => {
            handleScanSuccess(decodedText);
          },
          (errorMessage) => {
            // Quiet log for frame-by-frame scanner updates
          }
        );

        setIsCameraActive(true);
      } catch (err: any) {
        console.error("Camera startup failed:", err);
        setCameraError(
          err.message || "Failed to start camera. Please verify camera permissions."
        );
      }
    }, 150);
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }
    setIsCameraActive(false);
  };

  const handleCameraChange = async (cameraId: string) => {
    setSelectedCameraId(cameraId);
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      await stopScanner();
      // Restart with new ID
      setTimeout(() => {
        startScanner();
      }, 200);
    }
  };

  // Process file upload scan
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    toast.loading("Scanning image file...");
    
    // Ensure scanner element exists in DOM
    let element = document.getElementById(scannerContainerId);
    let createdTemp = false;
    if (!element) {
      element = document.createElement("div");
      element.id = scannerContainerId;
      element.style.display = "none";
      document.body.appendChild(element);
      createdTemp = true;
    }

    try {
      const html5QrCode = new Html5Qrcode(scannerContainerId);
      const decodedText = await html5QrCode.scanFile(file, true);
      toast.dismiss();
      handleScanSuccess(decodedText);
    } catch (err: any) {
      toast.dismiss();
      console.error("QR Scan file error details:", err);
      const errMsg = err?.message || String(err);
      toast.error(`Could not read QR code: ${errMsg}`);
    } finally {
      if (createdTemp && element && element.parentNode) {
        element.parentNode.removeChild(element);
      }
      // Reset input element value to allow uploading same file again
      e.target.value = "";
    }
  };

  // Perform search / lookup
  const lookupProduct = (serialOrId: string) => {
    const term = serialOrId.trim();
    if (!term) return;

    const equipment = getEquipment();
    // Search by exact serial, exact ID, or exact case-insensitive match
    const product = equipment.find(
      (e) =>
        String(e.serial || "").toLowerCase() === term.toLowerCase() ||
        String(e.id || "").toLowerCase() === term.toLowerCase()
    );

    if (!product) {
      toast.error(`No equipment found with serial/ID: "${term}"`);
      return;
    }

    setMatchedProduct(product);
    setScannedResult(product.serial);

    // Look up rentals
    const rentals = getRentals();
    
    // Find active rental
    const active = rentals.find(
      (r) =>
        (r.status === "Active" || r.status === "Overdue") &&
        (r.equipmentItems?.some((ei: any) => ei.equipmentId === product.id && !ei.returned) ||
          r.equipmentId?.split(",").map((s: string) => s.trim()).includes(product.id))
    );
    setActiveRental(active || null);

    // Find all rental history for this product
    const history = rentals.filter(
      (r) =>
        r.equipmentItems?.some((ei: any) => ei.equipmentId === product.id) ||
        r.equipmentId?.split(",").map((s: string) => s.trim()).includes(product.id)
    );
    setProductRentals(history);

    // Find exchange history
    const exchanges = getExchanges();
    const productExcs = exchanges.filter(
      (exc) =>
        exc.currentEquipmentId === product.id || exc.newEquipmentId === product.id
    );
    setProductExchanges(productExcs);

    toast.success(`Identified: ${product.name}`);
  };

  const handleScanSuccess = async (decodedText: string) => {
    if (bulkMode) {
      const now = Date.now();
      const lastTime = lastScanTimeRef.current[decodedText] || 0;
      if (now - lastTime < 3000) {
        // Ignore duplicate scan within 3 seconds
        return;
      }
      lastScanTimeRef.current[decodedText] = now;
      
      setBulkScannedSerials(prev => {
        if (prev.includes(decodedText)) return prev;
        return [...prev, decodedText];
      });

      if (onScanSuccess) {
        onScanSuccess(decodedText);
      }
      return;
    }

    // If in inline mode, bypass details dashboard and return value immediately
    if (inlineMode && onScanSuccess) {
      await stopScanner();
      onScanSuccess(decodedText);
      onOpenChange(false);
      return;
    }

    await stopScanner();
    lookupProduct(decodedText);
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const term = manualSerial.trim();
    if (!term) return;

    if (bulkMode) {
      setBulkScannedSerials(prev => {
        if (prev.includes(term)) return prev;
        return [...prev, term];
      });
      if (onScanSuccess) {
        onScanSuccess(term);
      }
      setManualSerial("");
      return;
    }

    if (inlineMode && onScanSuccess) {
      onScanSuccess(term);
      onOpenChange(false);
      return;
    }
    lookupProduct(term);
  };

  // Navigation callbacks
  const handleProcessReturn = () => {
    if (!activeRental || !matchedProduct) return;
    onOpenChange(false);
    navigate({
      to: "/returns",
      search: {
        agreementId: activeRental.id,
        equipmentId: matchedProduct.id,
      } as any,
    });
  };

  const handleProcessExchange = () => {
    if (!activeRental || !matchedProduct) return;
    onOpenChange(false);
    navigate({
      to: "/exchanges",
      search: {
        agreementId: activeRental.id,
        equipmentId: matchedProduct.id,
      } as any,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl bg-background border border-border shadow-elevated rounded-[16px] sm:rounded-[20px] p-4 sm:p-6 max-h-[92vh] overflow-y-auto">
        <DialogHeader className="border-b border-border/60 pb-3 flex flex-row items-center justify-between">
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" /> {title}
          </DialogTitle>
        </DialogHeader>

        {/* Tab selection */}
        {!scannedResult && (
          <div className="flex bg-muted/60 p-1.5 rounded-xl mt-4 gap-1.5">
            <Button
              type="button"
              variant={activeTab === "camera" ? "secondary" : "ghost"}
              className={`flex-1 h-9 text-[12px] font-semibold rounded-lg ${activeTab === "camera" ? "bg-white shadow-soft" : ""}`}
              onClick={() => setActiveTab("camera")}
            >
              <Camera className="h-3.5 w-3.5 mr-1.5" /> Camera Scan
            </Button>
            <Button
              type="button"
              variant={activeTab === "upload" ? "secondary" : "ghost"}
              className={`flex-1 h-9 text-[12px] font-semibold rounded-lg ${activeTab === "upload" ? "bg-white shadow-soft" : ""}`}
              onClick={() => setActiveTab("upload")}
            >
              <Upload className="h-3.5 w-3.5 mr-1.5" /> Upload Code
            </Button>
            <Button
              type="button"
              variant={activeTab === "manual" ? "secondary" : "ghost"}
              className={`flex-1 h-9 text-[12px] font-semibold rounded-lg ${activeTab === "manual" ? "bg-white shadow-soft" : ""}`}
              onClick={() => setActiveTab("manual")}
            >
              <Search className="h-3.5 w-3.5 mr-1.5" /> Manual Search
            </Button>
          </div>
        )}

        <div className="py-4">
          {/* Dashboard Panel (After Match) */}
          {scannedResult && matchedProduct ? (
            <div className="space-y-5">
              {/* Product Header */}
              <div className="flex gap-4 p-4 rounded-2xl bg-muted/20 border border-border/40">
                <div className="h-16 w-16 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/10">
                  <QrCode className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary/80">
                    {matchedProduct.category}
                  </span>
                  <h3 className="text-base font-bold text-foreground leading-snug">
                    {matchedProduct.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-0.5">
                    <code className="text-[11px] font-mono font-bold px-1.5 py-0.5 bg-muted text-muted-foreground rounded">
                      {matchedProduct.serial}
                    </code>
                    <StatusBadge status={matchedProduct.status} />
                  </div>
                </div>
              </div>

              {/* Product Specification grid */}
              <div className="grid grid-cols-2 gap-3.5 text-[12px]">
                <div className="bg-card/50 border border-border/50 p-3 rounded-xl">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Manufacturer & Model</p>
                  <p className="font-semibold mt-1 text-foreground">{matchedProduct.manufacturer} · {matchedProduct.model}</p>
                </div>
                <div className="bg-card/50 border border-border/50 p-3 rounded-xl">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Device Owner</p>
                  <p className="font-semibold mt-1 text-foreground">{matchedProduct.owner}</p>
                </div>
              </div>

              {/* ACTIVE AGREEMENT DETAILS */}
              <div className="space-y-2.5">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Active Lease / Rental Agreement
                </h4>
                {activeRental ? (
                  <Card className="border border-primary/20 bg-primary/5 shadow-soft rounded-2xl">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[10px] text-primary font-bold uppercase tracking-wider">Agreement Number</p>
                          <p className="text-sm font-bold text-foreground font-mono mt-0.5">{activeRental.id}</p>
                        </div>
                        <StatusBadge status={activeRental.status} />
                      </div>

                      <div className="grid grid-cols-2 gap-2 border-t border-primary/10 pt-3 text-[12px]">
                        <div>
                          <p className="text-muted-foreground flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-muted-foreground/60" /> Customer</p>
                          <p className="font-bold text-foreground mt-0.5">{activeRental.customer}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-muted-foreground/60" /> Start Date</p>
                          <p className="font-bold text-foreground mt-0.5">
                            {new Date(activeRental.start).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                          </p>
                        </div>
                        <div className="mt-2">
                          <p className="text-muted-foreground">Monthly Rent</p>
                          <p className="font-bold text-foreground mt-0.5">₹{activeRental.monthlyRent?.toLocaleString("en-IN")}</p>
                        </div>
                        <div className="mt-2">
                          <p className="text-muted-foreground">Security Deposit</p>
                          <p className="font-bold text-foreground mt-0.5">₹{activeRental.deposit?.toLocaleString("en-IN")}</p>
                        </div>
                      </div>

                      {/* Return / Exchange Quick Actions */}
                      <div className="flex gap-2.5 border-t border-primary/10 pt-3.5 mt-1">
                        <Button
                          type="button"
                          className="flex-1 h-9 text-[12px] bg-primary text-primary-foreground hover:bg-primary/95 flex items-center justify-center gap-1.5 rounded-lg border-0 shadow-sm"
                          onClick={handleProcessReturn}
                        >
                          <RotateCcw className="h-3.5 w-3.5" /> Return Equipment
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          className="flex-1 h-9 text-[12px] flex items-center justify-center gap-1.5 rounded-lg border border-border bg-background shadow-soft"
                          onClick={handleProcessExchange}
                        >
                          <RefreshCw className="h-3.5 w-3.5" /> Exchange Swap
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="p-4 border border-dashed border-border/80 rounded-2xl text-center">
                    <Info className="h-5 w-5 text-muted-foreground/60 mx-auto mb-2" />
                    <p className="text-[12px] text-muted-foreground">This equipment is not currently leased out.</p>
                    <div className="mt-3 flex justify-center">
                      <Button
                        type="button"
                        size="sm"
                        className="h-8 text-[11px] font-semibold flex items-center gap-1"
                        onClick={() => {
                          onOpenChange(false);
                          window.location.href = `/rentals?addNew=true&equipmentId=${matchedProduct.id}`;
                        }}
                      >
                        Create Rental Agreement <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* RENTAL HISTORY */}
              {productRentals.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <History className="h-3.5 w-3.5 text-muted-foreground/60" /> Rental & Return History ({productRentals.length})
                  </h4>
                  <div className="max-h-36 overflow-y-auto space-y-1.5 border border-border/50 rounded-xl p-2 bg-muted/5">
                    {productRentals.map((r, i) => (
                      <div key={i} className="flex justify-between items-center text-[11.5px] p-2 hover:bg-muted/30 rounded-lg border border-border/20 bg-background/50">
                        <div>
                          <p className="font-semibold text-foreground">{r.customer}</p>
                          <p className="text-muted-foreground text-[10px]">
                            {r.start} → {r.end || "Ongoing"}
                          </p>
                        </div>
                        <div className="text-right">
                          <code className="font-mono text-muted-foreground block text-[10px]">{r.id}</code>
                          <StatusBadge status={r.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* EXCHANGE HISTORY */}
              {productExchanges.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <RefreshCw className="h-3.5 w-3.5 text-muted-foreground/60" /> Exchange History ({productExchanges.length})
                  </h4>
                  <div className="max-h-36 overflow-y-auto space-y-1.5 border border-border/50 rounded-xl p-2 bg-muted/5">
                    {productExchanges.map((exc, i) => (
                      <div key={i} className="flex justify-between items-center text-[11.5px] p-2 hover:bg-muted/30 rounded-lg border border-border/20 bg-background/50">
                        <div>
                          <p className="font-semibold text-foreground">
                            {exc.currentEquipmentId === matchedProduct.id ? "Swapped Out (Returned)" : "Swapped In (Assigned)"}
                          </p>
                          <p className="text-muted-foreground text-[10px]">
                            Reason: {exc.reason}
                          </p>
                        </div>
                        <div className="text-right">
                          <code className="font-mono text-muted-foreground block text-[10px]">{exc.id}</code>
                          <p className="text-muted-foreground text-[10px] mt-0.5">{exc.exchangeDate}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Scan Another Button */}
              <div className="flex gap-2 pt-2 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-10 text-[12px] font-semibold"
                  onClick={() => {
                    setScannedResult(null);
                    setMatchedProduct(null);
                    setActiveRental(null);
                    setProductRentals([]);
                    setProductExchanges([]);
                    if (activeTab === "camera") {
                      startScanner();
                    }
                  }}
                >
                  Scan Another Product
                </Button>
                <DialogClose asChild>
                  <Button type="button" className="flex-1 h-10 text-[12px] font-semibold">Done</Button>
                </DialogClose>
              </div>
            </div>
          ) : null}

          {/* Scanning Panel (Camera / File / Manual) - Keep mounted to avoid html5-qrcode video dangling elements */}
          <div className="space-y-4" style={{ display: (scannedResult && matchedProduct && !bulkMode) ? "none" : "block" }}>
            {/* Tab contents */}
            <div style={{ display: activeTab === "camera" ? "block" : "none" }}>
              <div className="space-y-4">
                {/* Camera Select dropdown */}
                {cameras.length > 1 && (
                  <div className="flex items-center justify-between text-[12px]">
                    <Label className="text-muted-foreground">Active Camera:</Label>
                    <select
                      className="h-9 border border-border/60 rounded-md px-2 bg-background focus:outline-none text-sm max-w-[200px]"
                      value={selectedCameraId}
                      onChange={(e) => handleCameraChange(e.target.value)}
                    >
                      {cameras.map((cam) => (
                        <option key={cam.id} value={cam.id}>
                          {cam.label || `Camera ${cameras.indexOf(cam) + 1}`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Camera view container */}
                <div className="relative overflow-hidden rounded-2xl bg-black aspect-square max-h-[300px] mx-auto border-2 border-border/60">
                  <div id={scannerContainerId} className="w-full h-full object-cover [&>video]:object-cover" />
                  
                  {/* Glowing Scanning Frame Overlay */}
                  {isCameraActive && (
                    <div className="absolute inset-0 border border-white/20 pointer-events-none flex items-center justify-center">
                      <div className="w-[65%] h-[65%] border-2 border-primary/80 rounded-2xl relative shadow-[0_0_15px_rgba(59,130,246,0.15)] flex flex-col justify-between p-0">
                        {/* Inner glowing corner ticks */}
                        <span className="absolute -top-1.5 -left-1.5 h-4 w-4 border-t-4 border-l-4 border-primary rounded-tl" />
                        <span className="absolute -top-1.5 -right-1.5 h-4 w-4 border-t-4 border-r-4 border-primary rounded-tr" />
                        <span className="absolute -bottom-1.5 -left-1.5 h-4 w-4 border-b-4 border-l-4 border-primary rounded-bl" />
                        <span className="absolute -bottom-1.5 -right-1.5 h-4 w-4 border-b-4 border-r-4 border-primary rounded-br" />
                        
                        {/* Glowing Animated Laser line */}
                        <div className="w-full h-[2.5px] bg-primary animate-[scan-line_3.5s_ease-in-out_infinite] shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                      </div>
                    </div>
                  )}

                  {!isCameraActive && !cameraError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-muted-foreground/60 p-4 gap-2 bg-muted/10">
                      <LoaderIcon className="h-6 w-6 text-primary animate-spin" />
                      <p className="text-[12px] font-medium">Initializing camera feed...</p>
                    </div>
                  )}

                  {cameraError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-destructive p-4 gap-3 bg-destructive/5">
                      <AlertTriangle className="h-8 w-8 text-destructive animate-bounce" />
                      <div>
                        <p className="text-[13px] font-bold">Camera Access Error</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed max-w-[220px] mx-auto">
                          {cameraError}
                        </p>
                      </div>
                      <Button type="button" size="sm" variant="outline" className="h-8 text-[11px]" onClick={startScanner}>
                        Retry Camera
                      </Button>
                    </div>
                  )}
                </div>
                <p className="text-center text-[11.5px] text-muted-foreground mt-2">
                  Align the device's QR code within the focus frame to scan automatically.
                </p>
              </div>
            </div>

            <div style={{ display: activeTab === "upload" ? "block" : "none" }}>
              <div className="space-y-4 py-3">
                <div className="border-2 border-dashed border-border/80 rounded-2xl p-6 text-center hover:bg-muted/10 hover:border-primary/45 transition-colors cursor-pointer relative">
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={handleFileUpload}
                  />
                  <Upload className="h-8 w-8 text-muted-foreground/60 mx-auto mb-2" />
                  <p className="text-[13px] font-semibold text-foreground">Select QR Code Image</p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Upload a photo of the QR code sticker taken from the equipment
                  </p>
                </div>
              </div>
            </div>

            <div style={{ display: activeTab === "manual" ? "block" : "none" }}>
              <form onSubmit={handleManualSearch} className="space-y-4 py-3">
                <div className="space-y-1.5">
                  <Label htmlFor="serial-search" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Equipment Serial Number / Device ID
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="serial-search"
                      placeholder="e.g. PHE-77821, OXY-3392, EQ-OXY-834"
                      value={manualSerial}
                      onChange={(e) => setManualSerial(e.target.value)}
                      className="h-10 text-[13px]"
                      required
                    />
                    <Button type="submit" className="h-10 px-4 bg-primary text-primary-foreground hover:bg-primary/95 font-semibold text-[13px] border-0 shrink-0">
                      Look Up
                    </Button>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Use manual search if the QR code sticker on the device is damaged, smudged, or if camera permissions are blocked.
                </p>
              </form>
            </div>

            {bulkMode && bulkScannedSerials.length > 0 && (
              <div className="border border-border/80 rounded-xl p-3 bg-muted/5 space-y-2 mt-2">
                <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <span>Scanned Items ({bulkScannedSerials.length})</span>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-5 px-1.5 text-[10px] text-destructive hover:bg-destructive/10"
                    onClick={() => setBulkScannedSerials([])}
                  >
                    Clear List
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-[80px] overflow-y-auto">
                  {bulkScannedSerials.map((ser, index) => (
                    <span key={index} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary font-mono text-[10px] font-bold">
                      {ser}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Dialog Footer close button */}
            <div className="flex justify-end pt-3 border-t border-sidebar-border/40">
              <DialogClose asChild>
                <Button type="button" variant="outline" className="h-9 px-4 text-[12px] font-semibold">
                  Close Scanner
                </Button>
              </DialogClose>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LoaderIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
