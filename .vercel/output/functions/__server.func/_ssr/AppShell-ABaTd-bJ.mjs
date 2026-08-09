import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { E as getExchanges, T as getEquipment, at as syncFromSheetsToLocalStorage, ft as isGSheetsEnabled, z as getRentals } from "./data-store-BXBhFJro.mjs";
import { c as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { At as ChartColumn, C as Settings, D as RefreshCw, Dt as ChevronRight, E as RotateCcw, F as Moon, G as LayoutDashboard, It as Bell, K as Info, L as Menu, Mt as Calendar, P as Package, Pt as CalendarClock, V as LogOut, Y as History, Z as Handshake, at as FileText, c as User, dt as ExternalLink, f as Upload, ft as Ellipsis, g as Sun, gt as CreditCard, i as WifiOff, jt as Camera, k as QrCode, o as Users, p as TriangleAlert, r as Wifi, t as X, tt as FolderArchive, w as Search } from "../_libs/lucide-react.mjs";
import { t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { n as AvatarFallback$1, r as AvatarImage$1, t as Avatar$1 } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { d as cn, i as DialogContent, l as Input, n as Dialog, o as DialogHeader, r as DialogClose, s as DialogTitle, t as Button, u as Label } from "./dialog-BHa0LWsH.mjs";
import { _ as useNavigate, g as Link, l as useRouterState } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as _e } from "../_libs/cmdk.mjs";
import { t as Html5Qrcode } from "../_libs/html5-qrcode.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/AppShell-ABaTd-bJ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var Avatar = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Avatar$1, {
	ref,
	className: cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className),
	...props
}));
Avatar.displayName = Avatar$1.displayName;
var AvatarImage = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarImage$1, {
	ref,
	className: cn("aspect-square h-full w-full", className),
	...props
}));
AvatarImage.displayName = AvatarImage$1.displayName;
var AvatarFallback = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarFallback$1, {
	ref,
	className: cn("flex h-full w-full items-center justify-center rounded-full bg-muted", className),
	...props
}));
AvatarFallback.displayName = AvatarFallback$1.displayName;
var badgeVariants = cva("inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-semibold tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", {
	variants: { variant: {
		default: "border-transparent bg-primary text-primary-foreground shadow-sm hover:bg-primary/85",
		secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/75",
		destructive: "border-transparent bg-destructive/12 text-destructive border-destructive/22 hover:bg-destructive/18",
		outline: "text-foreground border-border/70 bg-transparent"
	} },
	defaultVariants: { variant: "default" }
});
function Badge({ className, variant, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn(badgeVariants({ variant }), className),
		...props
	});
}
var Command$1 = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(_e, {
	ref,
	className: cn("flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground", className),
	...props
}));
Command$1.displayName = _e.displayName;
var CommandDialog = ({ children, ...props }) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		...props,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogContent, {
			className: "overflow-hidden p-0",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Command$1, {
				className: "[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5",
				children
			})
		})
	});
};
var CommandInput = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
	className: "flex items-center border-b px-3",
	"cmdk-input-wrapper": "",
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "mr-2 h-4 w-4 shrink-0 opacity-50" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(_e.Input, {
		ref,
		className: cn("flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50", className),
		...props
	})]
}));
CommandInput.displayName = _e.Input.displayName;
var CommandList = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(_e.List, {
	ref,
	className: cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className),
	...props
}));
CommandList.displayName = _e.List.displayName;
var CommandEmpty = import_react.forwardRef((props, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(_e.Empty, {
	ref,
	className: "py-6 text-center text-sm",
	...props
}));
CommandEmpty.displayName = _e.Empty.displayName;
var CommandGroup = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(_e.Group, {
	ref,
	className: cn("overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground", className),
	...props
}));
CommandGroup.displayName = _e.Group.displayName;
var CommandSeparator = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(_e.Separator, {
	ref,
	className: cn("-mx-1 h-px bg-border", className),
	...props
}));
CommandSeparator.displayName = _e.Separator.displayName;
var CommandItem = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(_e.Item, {
	ref,
	className: cn("relative flex cursor-default gap-2 select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled=true]:pointer-events-none data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0", className),
	...props
}));
CommandItem.displayName = _e.Item.displayName;
var CommandShortcut = ({ className, ...props }) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("ml-auto text-xs tracking-widest text-muted-foreground", className),
		...props
	});
};
CommandShortcut.displayName = "CommandShortcut";
var Card = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	ref,
	className: cn("rounded-xl border border-border/70 bg-card text-card-foreground shadow-[var(--shadow-card)] transition-all duration-200", className),
	...props
}));
Card.displayName = "Card";
var CardHeader = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	ref,
	className: cn("flex flex-col space-y-1 p-5 pb-3", className),
	...props
}));
CardHeader.displayName = "CardHeader";
var CardTitle = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	ref,
	className: cn("font-display text-[15px] font-semibold leading-snug tracking-tight", className),
	...props
}));
CardTitle.displayName = "CardTitle";
var CardDescription = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	ref,
	className: cn("text-[13px] text-muted-foreground leading-relaxed mt-0.5", className),
	...props
}));
CardDescription.displayName = "CardDescription";
var CardContent = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	ref,
	className: cn("p-5 pt-0", className),
	...props
}));
CardContent.displayName = "CardContent";
var CardFooter = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	ref,
	className: cn("flex items-center p-5 pt-0", className),
	...props
}));
CardFooter.displayName = "CardFooter";
function QrScannerModal({ isOpen, onOpenChange, onScanSuccess, inlineMode = false, bulkMode = false, title = "QR Code Scanner" }) {
	const navigate = useNavigate();
	const [activeTab, setActiveTab] = (0, import_react.useState)("camera");
	const [manualSerial, setManualSerial] = (0, import_react.useState)("");
	const [scannedResult, setScannedResult] = (0, import_react.useState)(null);
	const [cameraError, setCameraError] = (0, import_react.useState)(null);
	const [isCameraActive, setIsCameraActive] = (0, import_react.useState)(false);
	const [cameras, setCameras] = (0, import_react.useState)([]);
	const [selectedCameraId, setSelectedCameraId] = (0, import_react.useState)("");
	const [bulkScannedSerials, setBulkScannedSerials] = (0, import_react.useState)([]);
	const [matchedProduct, setMatchedProduct] = (0, import_react.useState)(null);
	const [activeRental, setActiveRental] = (0, import_react.useState)(null);
	const [productRentals, setProductRentals] = (0, import_react.useState)([]);
	const [productExchanges, setProductExchanges] = (0, import_react.useState)([]);
	const html5QrCodeRef = (0, import_react.useRef)(null);
	const lastScanTimeRef = (0, import_react.useRef)({});
	const scannerContainerId = "qr-scanner-element";
	(0, import_react.useEffect)(() => {
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
	(0, import_react.useEffect)(() => {
		return () => {
			if (html5QrCodeRef.current) {
				if (html5QrCodeRef.current.isScanning) html5QrCodeRef.current.stop().catch(() => {});
				html5QrCodeRef.current = null;
			}
		};
	}, []);
	(0, import_react.useEffect)(() => {
		if (isOpen) if (activeTab === "camera") startScanner();
		else stopScanner();
	}, [activeTab, isOpen]);
	const startScanner = async () => {
		setCameraError(null);
		setIsCameraActive(false);
		setTimeout(async () => {
			try {
				const devices = await Html5Qrcode.getCameras();
				if (!devices || devices.length === 0) {
					setCameraError("No cameras found on your device.");
					return;
				}
				setCameras(devices);
				let cameraId = selectedCameraId;
				if (!cameraId) {
					const backCamera = devices.find((device) => device.label.toLowerCase().includes("back") || device.label.toLowerCase().includes("environment"));
					cameraId = backCamera ? backCamera.id : devices[0].id;
					setSelectedCameraId(cameraId);
				}
				if (!html5QrCodeRef.current) html5QrCodeRef.current = new Html5Qrcode(scannerContainerId);
				const scanner = html5QrCodeRef.current;
				if (scanner.isScanning) await scanner.stop();
				await scanner.start(cameraId, {
					fps: 10,
					qrbox: (width, height) => {
						const size = Math.min(width, height) * .65;
						return {
							width: size,
							height: size
						};
					}
				}, (decodedText) => {
					handleScanSuccess(decodedText);
				}, (errorMessage) => {});
				setIsCameraActive(true);
			} catch (err) {
				console.error("Camera startup failed:", err);
				setCameraError(err.message || "Failed to start camera. Please verify camera permissions.");
			}
		}, 150);
	};
	const stopScanner = async () => {
		if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) try {
			await html5QrCodeRef.current.stop();
		} catch (err) {
			console.error("Error stopping scanner:", err);
		}
		setIsCameraActive(false);
	};
	const handleCameraChange = async (cameraId) => {
		setSelectedCameraId(cameraId);
		if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
			await stopScanner();
			setTimeout(() => {
				startScanner();
			}, 200);
		}
	};
	const handleFileUpload = async (e) => {
		const file = e.target.files?.[0];
		if (!file) return;
		toast.loading("Scanning image file...");
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
			const decodedText = await new Html5Qrcode(scannerContainerId).scanFile(file, true);
			toast.dismiss();
			handleScanSuccess(decodedText);
		} catch (err) {
			toast.dismiss();
			console.error("QR Scan file error details:", err);
			const errMsg = err?.message || String(err);
			toast.error(`Could not read QR code: ${errMsg}`);
		} finally {
			if (createdTemp && element && element.parentNode) element.parentNode.removeChild(element);
			e.target.value = "";
		}
	};
	const lookupProduct = (serialOrId) => {
		const term = serialOrId.trim();
		if (!term) return;
		const product = getEquipment().find((e) => String(e.serial || "").toLowerCase() === term.toLowerCase() || String(e.id || "").toLowerCase() === term.toLowerCase());
		if (!product) {
			toast.error(`No equipment found with serial/ID: "${term}"`);
			return;
		}
		setMatchedProduct(product);
		setScannedResult(product.serial);
		const rentals = getRentals();
		setActiveRental(rentals.find((r) => (r.status === "Active" || r.status === "Overdue") && (r.equipmentItems?.some((ei) => ei.equipmentId === product.id && !ei.returned) || r.equipmentId?.split(",").map((s) => s.trim()).includes(product.id))) || null);
		setProductRentals(rentals.filter((r) => r.equipmentItems?.some((ei) => ei.equipmentId === product.id) || r.equipmentId?.split(",").map((s) => s.trim()).includes(product.id)));
		setProductExchanges(getExchanges().filter((exc) => exc.currentEquipmentId === product.id || exc.newEquipmentId === product.id));
		toast.success(`Identified: ${product.name}`);
	};
	const handleScanSuccess = async (decodedText) => {
		if (bulkMode) {
			const now = Date.now();
			if (now - (lastScanTimeRef.current[decodedText] || 0) < 3e3) return;
			lastScanTimeRef.current[decodedText] = now;
			setBulkScannedSerials((prev) => {
				if (prev.includes(decodedText)) return prev;
				return [...prev, decodedText];
			});
			if (onScanSuccess) onScanSuccess(decodedText);
			return;
		}
		if (inlineMode && onScanSuccess) {
			await stopScanner();
			onScanSuccess(decodedText);
			onOpenChange(false);
			return;
		}
		await stopScanner();
		lookupProduct(decodedText);
	};
	const handleManualSearch = (e) => {
		e.preventDefault();
		const term = manualSerial.trim();
		if (!term) return;
		if (bulkMode) {
			setBulkScannedSerials((prev) => {
				if (prev.includes(term)) return prev;
				return [...prev, term];
			});
			if (onScanSuccess) onScanSuccess(term);
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
	const handleProcessReturn = () => {
		if (!activeRental || !matchedProduct) return;
		onOpenChange(false);
		navigate({
			to: "/returns",
			search: {
				agreementId: activeRental.id,
				equipmentId: matchedProduct.id
			}
		});
	};
	const handleProcessExchange = () => {
		if (!activeRental || !matchedProduct) return;
		onOpenChange(false);
		navigate({
			to: "/exchanges",
			search: {
				agreementId: activeRental.id,
				equipmentId: matchedProduct.id
			}
		});
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open: isOpen,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "max-w-xl bg-background border border-border shadow-elevated rounded-[16px] sm:rounded-[20px] p-4 sm:p-6 max-h-[92vh] overflow-y-auto",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, {
					className: "border-b border-border/60 pb-3 flex flex-row items-center justify-between",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, {
						className: "text-base font-bold flex items-center gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QrCode, { className: "h-5 w-5 text-primary" }),
							" ",
							title
						]
					})
				}),
				!scannedResult && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex bg-muted/60 p-1.5 rounded-xl mt-4 gap-1.5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							type: "button",
							variant: activeTab === "camera" ? "secondary" : "ghost",
							className: `flex-1 h-9 text-[12px] font-semibold rounded-lg ${activeTab === "camera" ? "bg-white shadow-soft" : ""}`,
							onClick: () => setActiveTab("camera"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, { className: "h-3.5 w-3.5 mr-1.5" }), " Camera Scan"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							type: "button",
							variant: activeTab === "upload" ? "secondary" : "ghost",
							className: `flex-1 h-9 text-[12px] font-semibold rounded-lg ${activeTab === "upload" ? "bg-white shadow-soft" : ""}`,
							onClick: () => setActiveTab("upload"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "h-3.5 w-3.5 mr-1.5" }), " Upload Code"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							type: "button",
							variant: activeTab === "manual" ? "secondary" : "ghost",
							className: `flex-1 h-9 text-[12px] font-semibold rounded-lg ${activeTab === "manual" ? "bg-white shadow-soft" : ""}`,
							onClick: () => setActiveTab("manual"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "h-3.5 w-3.5 mr-1.5" }), " Manual Search"]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "py-4",
					children: [scannedResult && matchedProduct ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex gap-4 p-4 rounded-2xl bg-muted/20 border border-border/40",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "h-16 w-16 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/10",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QrCode, { className: "h-8 w-8" })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-1",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[10px] font-bold uppercase tracking-wider text-primary/80",
											children: matchedProduct.category
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "text-base font-bold text-foreground leading-snug",
											children: matchedProduct.name
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex flex-wrap items-center gap-2 mt-0.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
												className: "text-[11px] font-mono font-bold px-1.5 py-0.5 bg-muted text-muted-foreground rounded",
												children: matchedProduct.serial
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, { status: matchedProduct.status })]
										})
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-2 gap-3.5 text-[12px]",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "bg-card/50 border border-border/50 p-3 rounded-xl",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[10px] text-muted-foreground uppercase font-bold tracking-wider",
										children: "Manufacturer & Model"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "font-semibold mt-1 text-foreground",
										children: [
											matchedProduct.manufacturer,
											" · ",
											matchedProduct.model
										]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "bg-card/50 border border-border/50 p-3 rounded-xl",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[10px] text-muted-foreground uppercase font-bold tracking-wider",
										children: "Device Owner"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-semibold mt-1 text-foreground",
										children: matchedProduct.owner
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
									className: "text-[11px] font-bold uppercase tracking-wider text-muted-foreground",
									children: "Active Lease / Rental Agreement"
								}), activeRental ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
									className: "border border-primary/20 bg-primary/5 shadow-soft rounded-2xl",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
										className: "p-4 space-y-3",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex justify-between items-start",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-[10px] text-primary font-bold uppercase tracking-wider",
													children: "Agreement Number"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-sm font-bold text-foreground font-mono mt-0.5",
													children: activeRental.id
												})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, { status: activeRental.status })]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "grid grid-cols-2 gap-2 border-t border-primary/10 pt-3 text-[12px]",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
														className: "text-muted-foreground flex items-center gap-1.5",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, { className: "h-3.5 w-3.5 text-muted-foreground/60" }), " Customer"]
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "font-bold text-foreground mt-0.5",
														children: activeRental.customer
													})] }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
														className: "text-muted-foreground flex items-center gap-1.5",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Calendar, { className: "h-3.5 w-3.5 text-muted-foreground/60" }), " Start Date"]
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "font-bold text-foreground mt-0.5",
														children: new Date(activeRental.start).toLocaleDateString("en-IN", {
															day: "2-digit",
															month: "short",
															year: "numeric"
														})
													})] }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "mt-2",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
															className: "text-muted-foreground",
															children: "Monthly Rent"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
															className: "font-bold text-foreground mt-0.5",
															children: ["₹", activeRental.monthlyRent?.toLocaleString("en-IN")]
														})]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "mt-2",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
															className: "text-muted-foreground",
															children: "Security Deposit"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
															className: "font-bold text-foreground mt-0.5",
															children: ["₹", activeRental.deposit?.toLocaleString("en-IN")]
														})]
													})
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex gap-2.5 border-t border-primary/10 pt-3.5 mt-1",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
													type: "button",
													className: "flex-1 h-9 text-[12px] bg-primary text-primary-foreground hover:bg-primary/95 flex items-center justify-center gap-1.5 rounded-lg border-0 shadow-sm",
													onClick: handleProcessReturn,
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "h-3.5 w-3.5" }), " Return Equipment"]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
													type: "button",
													variant: "secondary",
													className: "flex-1 h-9 text-[12px] flex items-center justify-center gap-1.5 rounded-lg border border-border bg-background shadow-soft",
													onClick: handleProcessExchange,
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "h-3.5 w-3.5" }), " Exchange Swap"]
												})]
											})
										]
									})
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "p-4 border border-dashed border-border/80 rounded-2xl text-center",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, { className: "h-5 w-5 text-muted-foreground/60 mx-auto mb-2" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[12px] text-muted-foreground",
											children: "This equipment is not currently leased out."
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "mt-3 flex justify-center",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
												type: "button",
												size: "sm",
												className: "h-8 text-[11px] font-semibold flex items-center gap-1",
												onClick: () => {
													onOpenChange(false);
													window.location.href = `/rentals?addNew=true&equipmentId=${matchedProduct.id}`;
												},
												children: ["Create Rental Agreement ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { className: "h-3 w-3" })]
											})
										})
									]
								})]
							}),
							productRentals.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h4", {
									className: "text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(History, { className: "h-3.5 w-3.5 text-muted-foreground/60" }),
										" Rental & Return History (",
										productRentals.length,
										")"
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "max-h-36 overflow-y-auto space-y-1.5 border border-border/50 rounded-xl p-2 bg-muted/5",
									children: productRentals.map((r, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex justify-between items-center text-[11.5px] p-2 hover:bg-muted/30 rounded-lg border border-border/20 bg-background/50",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "font-semibold text-foreground",
											children: r.customer
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-muted-foreground text-[10px]",
											children: [
												r.start,
												" → ",
												r.end || "Ongoing"
											]
										})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "text-right",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
												className: "font-mono text-muted-foreground block text-[10px]",
												children: r.id
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, { status: r.status })]
										})]
									}, i))
								})]
							}),
							productExchanges.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h4", {
									className: "text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "h-3.5 w-3.5 text-muted-foreground/60" }),
										" Exchange History (",
										productExchanges.length,
										")"
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "max-h-36 overflow-y-auto space-y-1.5 border border-border/50 rounded-xl p-2 bg-muted/5",
									children: productExchanges.map((exc, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex justify-between items-center text-[11.5px] p-2 hover:bg-muted/30 rounded-lg border border-border/20 bg-background/50",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "font-semibold text-foreground",
											children: exc.currentEquipmentId === matchedProduct.id ? "Swapped Out (Returned)" : "Swapped In (Assigned)"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-muted-foreground text-[10px]",
											children: ["Reason: ", exc.reason]
										})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "text-right",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
												className: "font-mono text-muted-foreground block text-[10px]",
												children: exc.id
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-muted-foreground text-[10px] mt-0.5",
												children: exc.exchangeDate
											})]
										})]
									}, i))
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex gap-2 pt-2 border-t border-border/60",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									type: "button",
									variant: "outline",
									className: "flex-1 h-10 text-[12px] font-semibold",
									onClick: () => {
										setScannedResult(null);
										setMatchedProduct(null);
										setActiveRental(null);
										setProductRentals([]);
										setProductExchanges([]);
										if (activeTab === "camera") startScanner();
									},
									children: "Scan Another Product"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogClose, {
									asChild: true,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										type: "button",
										className: "flex-1 h-10 text-[12px] font-semibold",
										children: "Done"
									})
								})]
							})
						]
					}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-4",
						style: { display: scannedResult && matchedProduct && !bulkMode ? "none" : "block" },
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								style: { display: activeTab === "camera" ? "block" : "none" },
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-4",
									children: [
										cameras.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-between text-[12px]",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												className: "text-muted-foreground",
												children: "Active Camera:"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
												className: "h-8 border border-border/60 rounded-md px-2 bg-background focus:outline-none text-[11.5px] max-w-[200px]",
												value: selectedCameraId,
												onChange: (e) => handleCameraChange(e.target.value),
												children: cameras.map((cam) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: cam.id,
													children: cam.label || `Camera ${cameras.indexOf(cam) + 1}`
												}, cam.id))
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "relative overflow-hidden rounded-2xl bg-black aspect-square max-h-[300px] mx-auto border-2 border-border/60",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													id: scannerContainerId,
													className: "w-full h-full object-cover [&>video]:object-cover"
												}),
												isCameraActive && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "absolute inset-0 border border-white/20 pointer-events-none flex items-center justify-center",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "w-[65%] h-[65%] border-2 border-primary/80 rounded-2xl relative shadow-[0_0_15px_rgba(59,130,246,0.15)] flex flex-col justify-between p-0",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute -top-1.5 -left-1.5 h-4 w-4 border-t-4 border-l-4 border-primary rounded-tl" }),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute -top-1.5 -right-1.5 h-4 w-4 border-t-4 border-r-4 border-primary rounded-tr" }),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute -bottom-1.5 -left-1.5 h-4 w-4 border-b-4 border-l-4 border-primary rounded-bl" }),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute -bottom-1.5 -right-1.5 h-4 w-4 border-b-4 border-r-4 border-primary rounded-br" }),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-full h-[2.5px] bg-primary animate-[scan-line_3.5s_ease-in-out_infinite] shadow-[0_0_8px_rgba(59,130,246,0.8)]" })
														]
													})
												}),
												!isCameraActive && !cameraError && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "absolute inset-0 flex flex-col items-center justify-center text-center text-muted-foreground/60 p-4 gap-2 bg-muted/10",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderIcon, { className: "h-6 w-6 text-primary animate-spin" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "text-[12px] font-medium",
														children: "Initializing camera feed..."
													})]
												}),
												cameraError && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "absolute inset-0 flex flex-col items-center justify-center text-center text-destructive p-4 gap-3 bg-destructive/5",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "h-8 w-8 text-destructive animate-bounce" }),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
															className: "text-[13px] font-bold",
															children: "Camera Access Error"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
															className: "text-[11px] text-muted-foreground mt-0.5 leading-relaxed max-w-[220px] mx-auto",
															children: cameraError
														})] }),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
															type: "button",
															size: "sm",
															variant: "outline",
															className: "h-8 text-[11px]",
															onClick: startScanner,
															children: "Retry Camera"
														})
													]
												})
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-center text-[11.5px] text-muted-foreground mt-2",
											children: "Align the device's QR code within the focus frame to scan automatically."
										})
									]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								style: { display: activeTab === "upload" ? "block" : "none" },
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "space-y-4 py-3",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "border-2 border-dashed border-border/80 rounded-2xl p-6 text-center hover:bg-muted/10 hover:border-primary/45 transition-colors cursor-pointer relative",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												type: "file",
												accept: "image/*",
												className: "absolute inset-0 opacity-0 cursor-pointer",
												onChange: handleFileUpload
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "h-8 w-8 text-muted-foreground/60 mx-auto mb-2" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[13px] font-semibold text-foreground",
												children: "Select QR Code Image"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[11px] text-muted-foreground mt-1",
												children: "Upload a photo of the QR code sticker taken from the equipment"
											})
										]
									})
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								style: { display: activeTab === "manual" ? "block" : "none" },
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
									onSubmit: handleManualSearch,
									className: "space-y-4 py-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-1.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "serial-search",
											className: "text-[11px] font-bold uppercase tracking-wider text-muted-foreground",
											children: "Equipment Serial Number / Device ID"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												id: "serial-search",
												placeholder: "e.g. PHE-77821, OXY-3392, EQ-OXY-834",
												value: manualSerial,
												onChange: (e) => setManualSerial(e.target.value),
												className: "h-10 text-[13px]",
												required: true
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												type: "submit",
												className: "h-10 px-4 bg-primary text-primary-foreground hover:bg-primary/95 font-semibold text-[13px] border-0 shrink-0",
												children: "Look Up"
											})]
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[11px] text-muted-foreground",
										children: "Use manual search if the QR code sticker on the device is damaged, smudged, or if camera permissions are blocked."
									})]
								})
							}),
							bulkMode && bulkScannedSerials.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "border border-border/80 rounded-xl p-3 bg-muted/5 space-y-2 mt-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between items-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
										"Scanned Items (",
										bulkScannedSerials.length,
										")"
									] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										type: "button",
										variant: "ghost",
										className: "h-5 px-1.5 text-[10px] text-destructive hover:bg-destructive/10",
										onClick: () => setBulkScannedSerials([]),
										children: "Clear List"
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex flex-wrap gap-1.5 max-h-[80px] overflow-y-auto",
									children: bulkScannedSerials.map((ser, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary font-mono text-[10px] font-bold",
										children: ser
									}, index))
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex justify-end pt-3 border-t border-sidebar-border/40",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogClose, {
									asChild: true,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										type: "button",
										variant: "outline",
										className: "h-9 px-4 text-[12px] font-semibold",
										children: "Close Scanner"
									})
								})
							})
						]
					})]
				})
			]
		})
	});
}
function LoaderIcon({ className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
		xmlns: "http://www.w3.org/2000/svg",
		width: "24",
		height: "24",
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: "2",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		className,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M21 12a9 9 0 1 1-6.219-8.56" })
	});
}
var navSections = [
	{
		label: "Operations",
		items: [
			{
				to: "/",
				label: "Dashboard",
				icon: LayoutDashboard
			},
			{
				to: "/customers",
				label: "Customers",
				icon: Users
			},
			{
				to: "/equipment",
				label: "Equipment",
				icon: Package
			},
			{
				to: "/owners",
				label: "Owners",
				icon: Handshake
			},
			{
				to: "/rentals",
				label: "Rentals",
				icon: FileText
			},
			{
				to: "/exchanges",
				label: "Exchanges",
				icon: RefreshCw
			},
			{
				to: "#scan",
				label: "QR Scanner",
				icon: QrCode,
				isAction: true
			}
		]
	},
	{
		label: "Finance",
		items: [
			{
				to: "/payments",
				label: "Payments",
				icon: CreditCard
			},
			{
				to: "/dues",
				label: "Rent Dues",
				icon: CalendarClock
			},
			{
				to: "/returns",
				label: "Returns",
				icon: RotateCcw
			}
		]
	},
	{
		label: "Insights",
		items: [
			{
				to: "/reports",
				label: "Reports",
				icon: ChartColumn
			},
			{
				to: "/documents",
				label: "Documents",
				icon: FolderArchive
			},
			{
				to: "/settings",
				label: "Settings",
				icon: Settings
			}
		]
	}
];
var bottomNavPrimary = [
	{
		to: "/",
		label: "Home",
		icon: LayoutDashboard
	},
	{
		to: "/rentals",
		label: "Rentals",
		icon: FileText
	},
	{
		to: "/customers",
		label: "Customers",
		icon: Users
	},
	{
		to: "/equipment",
		label: "Equipment",
		icon: Package
	}
];
function AppShell({ children, title, subtitle, actions }) {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const navigate = useNavigate();
	const [searchOpen, setSearchOpen] = (0, import_react.useState)(false);
	const [qrOpen, setQrOpen] = (0, import_react.useState)(false);
	const [userName, setUserName] = (0, import_react.useState)("Dr. Rao");
	const [userRole, setUserRole] = (0, import_react.useState)("Admin");
	const [isSyncing, setIsSyncing] = (0, import_react.useState)(false);
	const [, setDbVersion] = (0, import_react.useState)(0);
	const [moreOpen, setMoreOpen] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (typeof window !== "undefined") {
			const name = localStorage.getItem("medirent-user-name");
			const role = localStorage.getItem("medirent-user-role");
			if (name) setUserName(name);
			if (role) setUserRole(role);
		}
	}, []);
	(0, import_react.useEffect)(() => {
		const handleDbUpdate = () => {
			setDbVersion((v) => v + 1);
		};
		window.addEventListener("medirent-db-updated", handleDbUpdate);
		return () => window.removeEventListener("medirent-db-updated", handleDbUpdate);
	}, []);
	(0, import_react.useEffect)(() => {
		if (isGSheetsEnabled()) {
			syncFromSheetsToLocalStorage();
			const interval = setInterval(() => {
				syncFromSheetsToLocalStorage();
			}, 15e3);
			return () => clearInterval(interval);
		}
	}, []);
	const handleManualSync = async () => {
		setIsSyncing(true);
		toast.info("Syncing data with Google Sheets...");
		try {
			await syncFromSheetsToLocalStorage(true);
			toast.success("Database synced successfully!");
		} catch (e) {
			toast.error("Sync failed: " + String(e));
		} finally {
			setIsSyncing(false);
		}
	};
	const getInitials = (name) => {
		const parts = name.trim().split(/\s+/);
		if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
		return name.slice(0, 2).toUpperCase();
	};
	const [dark, setDark] = (0, import_react.useState)(() => {
		if (typeof window !== "undefined") return localStorage.getItem("medirent-theme") === "dark" || !localStorage.getItem("medirent-theme") && window.matchMedia("(prefers-color-scheme: dark)").matches;
		return false;
	});
	const [open, setOpen] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const down = (e) => {
			if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				setSearchOpen((o) => !o);
			}
		};
		document.addEventListener("keydown", down);
		return () => document.removeEventListener("keydown", down);
	}, []);
	(0, import_react.useEffect)(() => {
		const root = document.documentElement;
		if (dark) {
			root.classList.add("dark");
			localStorage.setItem("medirent-theme", "dark");
		} else {
			root.classList.remove("dark");
			localStorage.setItem("medirent-theme", "light");
		}
	}, [dark]);
	(0, import_react.useEffect)(() => {
		setMoreOpen(false);
		setOpen(false);
	}, [pathname]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
				className: `fixed inset-y-0 left-0 z-40 w-64 flex flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-y-0 left-0 w-[2px] bg-gradient-to-b from-primary/60 via-primary/30 to-transparent pointer-events-none" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative flex h-[60px] items-center gap-3 border-b border-sidebar-border px-4 bg-white",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: "/images/logo.png",
							alt: "Relife Medical Technologies",
							className: "h-11 w-auto max-w-[200px] object-contain"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setOpen(false),
							className: "ml-auto flex h-7 w-7 items-center justify-center rounded-md text-slate-700 hover:bg-slate-100 md:hidden transition-colors",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-4 w-4" })
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
						className: "flex-1 overflow-y-auto py-4 px-3 space-y-5",
						children: [navSections.map((section) => {
							const filteredItems = section.items.filter((item) => !(userRole === "Staff" && item.to === "/settings"));
							if (filteredItems.length === 0) return null;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mb-1 px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/40",
								children: section.label
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex flex-col gap-0.5",
								children: filteredItems.map((item) => {
									const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
									const Icon = item.icon;
									return item.isAction ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										onClick: () => {
											setOpen(false);
											setQrOpen(true);
										},
										className: "group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-sidebar-foreground/65 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-all duration-150 cursor-pointer text-left w-full",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground/60 group-hover:text-sidebar-foreground",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "h-3.5 w-3.5" })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "flex-1 truncate",
											children: item.label
										})]
									}, item.label) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
										to: item.to,
										onClick: () => setOpen(false),
										className: `group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-all duration-150 ${active ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-[var(--shadow-soft)]" : "text-sidebar-foreground/65 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"}`,
										children: [
											active && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute left-0 inset-y-1.5 w-[2.5px] rounded-full bg-primary" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: `flex h-6 w-6 items-center justify-center rounded-md transition-all ${active ? "bg-primary/12 text-primary" : "text-muted-foreground/60 group-hover:text-sidebar-foreground"}`,
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "h-3.5 w-3.5" })
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "flex-1 truncate",
												children: item.label
											})
										]
									}, item.to);
								})
							})] }, section.label);
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "pt-2 border-t border-sidebar-border/50",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: () => {
									localStorage.removeItem("medirent-authenticated");
									localStorage.removeItem("medirent-session-token");
									localStorage.removeItem("medirent-session-expiry");
									localStorage.removeItem("medirent-user-email");
									localStorage.removeItem("medirent-user-name");
									localStorage.removeItem("medirent-user-role");
									window.location.reload();
								},
								className: "w-full group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-destructive hover:bg-destructive/10 hover:text-destructive transition-all duration-150 cursor-pointer",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "flex h-6 w-6 items-center justify-center rounded-md text-destructive group-hover:text-destructive",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { className: "h-3.5 w-3.5" })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "flex-1 text-left truncate",
									children: "Logout"
								})]
							})
						})]
					})
				]
			}),
			open && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 z-30 bg-black/40 backdrop-blur-[2px] md:hidden",
				onClick: () => setOpen(false)
			}),
			moreOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden",
				onClick: () => setMoreOpen(false)
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "fixed bottom-[env(safe-area-inset-bottom,0px)] left-0 right-0 z-50 md:hidden animate-[slide-up_0.35s_cubic-bezier(0.22,1,0.36,1)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pb-[68px]" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-card border-t border-border rounded-t-2xl shadow-elevated overflow-hidden",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex justify-center pt-3 pb-2",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-10 h-1 rounded-full bg-border" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between px-5 pb-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[13px] font-bold text-foreground",
								children: "All Sections"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setMoreOpen(false),
								className: "h-7 w-7 flex items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition-colors",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-3.5 w-3.5" })
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "px-4 pb-5 grid grid-cols-4 gap-2",
							children: navSections.flatMap((section) => section.items.filter((item) => !(userRole === "Staff" && item.to === "/settings")).map((item) => {
								const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
								const Icon = item.icon;
								if (item.isAction) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									onClick: () => {
										setMoreOpen(false);
										setQrOpen(true);
									},
									className: "flex flex-col items-center gap-1.5 p-2.5 rounded-xl text-muted-foreground hover:bg-muted/60 transition-colors active:scale-95",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "flex h-11 w-11 items-center justify-center rounded-xl bg-muted border border-border",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "h-5 w-5" })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[10px] font-medium text-center leading-tight line-clamp-1",
										children: item.label
									})]
								}, item.label);
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
									to: item.to,
									onClick: () => setMoreOpen(false),
									className: `flex flex-col items-center gap-1.5 p-2.5 rounded-xl transition-colors active:scale-95 ${active ? "text-primary" : "text-muted-foreground hover:bg-muted/60"}`,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: `flex h-11 w-11 items-center justify-center rounded-xl border transition-all ${active ? "bg-primary/10 border-primary/20 text-primary" : "bg-muted border-border"}`,
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "h-5 w-5" })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[10px] font-medium text-center leading-tight line-clamp-1",
										children: item.label
									})]
								}, item.to);
							}))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "border-t border-border mx-4 mb-2 pt-3 pb-2",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: () => {
									localStorage.removeItem("medirent-authenticated");
									localStorage.removeItem("medirent-session-token");
									localStorage.removeItem("medirent-session-expiry");
									localStorage.removeItem("medirent-user-email");
									localStorage.removeItem("medirent-user-name");
									localStorage.removeItem("medirent-user-role");
									window.location.reload();
								},
								className: "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-destructive hover:bg-destructive/8 transition-colors active:scale-95",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { className: "h-4 w-4" })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[13px] font-semibold",
									children: "Logout"
								})]
							})
						})
					]
				})]
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "md:pl-64 flex flex-col min-h-screen",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
					className: "sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/90 backdrop-blur-md backdrop-saturate-150 sm:px-6 shadow-[var(--shadow-topbar)]",
					style: {
						height: "calc(56px + env(safe-area-inset-top, 0px))",
						paddingTop: "env(safe-area-inset-top, 0px)",
						paddingLeft: "max(1rem, env(safe-area-inset-left, 0px))",
						paddingRight: "max(1rem, env(safe-area-inset-right, 0px))"
					},
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3 w-full h-[56px]",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "ghost",
								size: "icon",
								className: "h-8 w-8 md:hidden",
								onClick: () => setOpen(true),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, { className: "h-4 w-4" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "ghost",
								size: "icon",
								className: "h-8 w-8 hidden md:flex lg:hidden",
								onClick: () => setOpen(true),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, { className: "h-4 w-4" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "md:hidden flex-1 flex items-center justify-center",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: "/images/logo.png",
									alt: "Relife",
									className: "h-8 w-auto object-contain max-w-[140px]"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								onClick: () => setSearchOpen(true),
								className: "relative hidden flex-1 max-w-[340px] md:flex items-center cursor-pointer",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "pointer-events-none absolute left-3 h-3.5 w-3.5 text-muted-foreground/50" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										placeholder: "Search customers, equipment, agreements…",
										readOnly: true,
										className: "w-full h-8 pl-9 pr-14 rounded-lg text-[13px] bg-muted/60 border border-border/50 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:bg-card focus:border-primary/40 transition-all cursor-pointer"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("kbd", {
										className: "pointer-events-none absolute right-2.5 flex h-5 items-center gap-0.5 rounded border border-border/60 bg-card px-1.5 text-[10px] font-semibold text-muted-foreground/60",
										children: "⌘K"
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "ml-auto md:ml-0 flex items-center gap-1",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "ghost",
										size: "icon",
										className: "h-8 w-8 md:hidden",
										onClick: () => setSearchOpen(true),
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "h-4 w-4 text-muted-foreground" })
									}),
									isGSheetsEnabled() ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "hidden sm:flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold border bg-success/10 text-success border-success/20 mr-1.5 shadow-sm",
										title: "Google Sheets Database is Connected.",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wifi, { className: "h-3 w-3 text-success animate-pulse" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "hidden sm:inline",
											children: "DB Connected"
										})]
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "hidden sm:flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold border bg-destructive/10 text-destructive border-destructive/20 mr-1.5 shadow-sm",
										title: "No database URL configured (Running Offline).",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WifiOff, { className: "h-3 w-3 text-destructive animate-pulse" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "DB Offline" })]
									}),
									isGSheetsEnabled() && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "ghost",
										size: "icon",
										className: "h-8 w-8 rounded-md text-muted-foreground hover:text-foreground mr-1",
										onClick: handleManualSync,
										disabled: isSyncing,
										title: "Sync with Google Sheets",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: `h-4 w-4 ${isSyncing ? "animate-spin text-primary" : ""}` })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "ghost",
										size: "icon",
										className: "h-8 w-8 rounded-md text-muted-foreground hover:text-foreground mr-1",
										onClick: () => setQrOpen(true),
										title: "Scan Product QR Code",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QrCode, { className: "h-4 w-4 text-primary" })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "ghost",
										size: "icon",
										className: "h-8 w-8 rounded-md text-muted-foreground hover:text-foreground",
										onClick: () => setDark((d) => !d),
										"aria-label": "Toggle theme",
										children: dark ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sun, { className: "h-4 w-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Moon, { className: "h-4 w-4" })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										variant: "ghost",
										size: "icon",
										className: "relative hidden sm:flex h-8 w-8 rounded-md text-muted-foreground hover:text-foreground",
										"aria-label": "Notifications",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bell, { className: "h-4 w-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute top-1.5 right-1.5 h-[7px] w-[7px] rounded-full bg-destructive border-2 border-background" })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mx-1.5 h-5 w-px bg-border hidden sm:block" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "hidden sm:flex items-center gap-2 rounded-lg border border-border/60 bg-card/90 pl-1.5 pr-2.5 py-1 shadow-[var(--shadow-soft)] hover:border-border transition-colors cursor-pointer",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Avatar, {
												className: "h-6 w-6",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarFallback, {
													className: "bg-primary text-primary-foreground text-[9px] font-bold",
													children: getInitials(userName)
												})
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "hidden text-left leading-tight sm:block",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-[12px] font-semibold text-foreground",
													children: userName
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-[10px] font-medium text-muted-foreground/70",
													children: userRole
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "h-3 w-3 text-muted-foreground/50 rotate-90 ml-0.5 hidden sm:block" })
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "ghost",
										size: "icon",
										className: "hidden sm:flex h-8 w-8 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 ml-1.5",
										title: "Logout",
										onClick: () => {
											localStorage.removeItem("medirent-authenticated");
											localStorage.removeItem("medirent-user-email");
											localStorage.removeItem("medirent-user-name");
											localStorage.removeItem("medirent-user-role");
											window.location.reload();
										},
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { className: "h-4 w-4" })
									})
								]
							})
						]
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
					className: "px-4 py-5 sm:px-7 lg:px-8 pb-32 md:pb-8",
					style: {
						minHeight: "calc(100vh - 56px - env(safe-area-inset-top, 0px))",
						paddingBottom: "calc(5rem + env(safe-area-inset-bottom, 0px))"
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-5 flex flex-wrap items-end justify-between gap-3 animate-[fade-in_0.35s_ease-out]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mt-1 h-6 w-[3px] rounded-full bg-primary shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-1 text-[11px] text-muted-foreground/60 mb-1",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-medium hover:text-muted-foreground transition-colors cursor-pointer",
											children: "MediRent"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "h-2.5 w-2.5 opacity-50" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-semibold text-muted-foreground/80",
											children: title
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
									className: "text-[20px] sm:text-[22px] font-bold tracking-tight text-foreground",
									children: title
								}),
								subtitle && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-0.5 text-[12px] sm:text-[13px] text-muted-foreground leading-relaxed",
									children: subtitle
								})
							] })]
						}), actions && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex flex-wrap items-center gap-2",
							children: actions
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "animate-[slide-up_0.45s_cubic-bezier(0.22,1,0.36,1)]",
						children
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
				className: "fixed bottom-0 left-0 right-0 z-30 md:hidden bg-card/95 backdrop-blur-xl border-t border-border shadow-elevated",
				style: { paddingBottom: "env(safe-area-inset-bottom, 0px)" },
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-stretch",
					children: [bottomNavPrimary.map((item) => {
						const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
						const Icon = item.icon;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: item.to,
							className: `flex-1 flex flex-col items-center justify-center gap-1 py-3 min-h-[60px] transition-all duration-150 active:scale-95 ${active ? "text-primary" : "text-muted-foreground/60"}`,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: `flex items-center justify-center h-7 w-7 rounded-xl transition-all duration-200 ${active ? "bg-primary/12 scale-110" : ""}`,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: `h-[22px] w-[22px] transition-all ${active ? "stroke-[2.2px]" : "stroke-[1.6px]"}` })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: `text-[10px] font-semibold leading-none transition-all ${active ? "text-primary" : "text-muted-foreground/50"}`,
									children: item.label
								}),
								active && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute top-1.5 h-1 w-1 rounded-full bg-primary" })
							]
						}, item.to);
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => setMoreOpen(true),
						className: `flex-1 flex flex-col items-center justify-center gap-1 py-3 min-h-[60px] transition-all duration-150 active:scale-95 ${moreOpen ? "text-primary" : "text-muted-foreground/60"}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: `flex items-center justify-center h-7 w-7 rounded-xl transition-all duration-200 ${moreOpen ? "bg-primary/12 scale-110" : ""}`,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ellipsis, { className: `h-[22px] w-[22px] transition-all ${moreOpen ? "stroke-[2.2px]" : "stroke-[1.6px]"}` })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: `text-[10px] font-semibold leading-none ${moreOpen ? "text-primary" : "text-muted-foreground/50"}`,
							children: "More"
						})]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CommandDialog, {
				open: searchOpen,
				onOpenChange: setSearchOpen,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CommandInput, { placeholder: "Type a command or search..." }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CommandList, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CommandEmpty, { children: "No results found." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CommandGroup, {
						heading: "Operations",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CommandItem, {
								onSelect: () => {
									navigate({ to: "/" });
									setSearchOpen(false);
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LayoutDashboard, { className: "mr-2 h-4.5 w-4.5 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Dashboard" })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CommandItem, {
								onSelect: () => {
									navigate({ to: "/customers" });
									setSearchOpen(false);
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "mr-2 h-4.5 w-4.5 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Customers" })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CommandItem, {
								onSelect: () => {
									navigate({ to: "/equipment" });
									setSearchOpen(false);
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { className: "mr-2 h-4.5 w-4.5 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Equipment Inventory" })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CommandItem, {
								onSelect: () => {
									navigate({ to: "/owners" });
									setSearchOpen(false);
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Handshake, { className: "mr-2 h-4.5 w-4.5 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Equipment Owners" })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CommandItem, {
								onSelect: () => {
									navigate({ to: "/rentals" });
									setSearchOpen(false);
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "mr-2 h-4.5 w-4.5 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Rental Agreements" })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CommandItem, {
								onSelect: () => {
									navigate({ to: "/exchanges" });
									setSearchOpen(false);
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "mr-2 h-4.5 w-4.5 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Exchanges" })]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CommandGroup, {
						heading: "Finance",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CommandItem, {
								onSelect: () => {
									navigate({ to: "/payments" });
									setSearchOpen(false);
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CreditCard, { className: "mr-2 h-4.5 w-4.5 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Payments Ledger" })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CommandItem, {
								onSelect: () => {
									navigate({ to: "/dues" });
									setSearchOpen(false);
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarClock, { className: "mr-2 h-4.5 w-4.5 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Rent Dues & Reminders" })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CommandItem, {
								onSelect: () => {
									navigate({ to: "/returns" });
									setSearchOpen(false);
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "mr-2 h-4.5 w-4.5 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Equipment Returns" })]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CommandGroup, {
						heading: "Insights",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CommandItem, {
								onSelect: () => {
									navigate({ to: "/reports" });
									setSearchOpen(false);
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChartColumn, { className: "mr-2 h-4.5 w-4.5 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Reports & Analytics" })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CommandItem, {
								onSelect: () => {
									navigate({ to: "/documents" });
									setSearchOpen(false);
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FolderArchive, { className: "mr-2 h-4.5 w-4.5 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Document Repository" })]
							}),
							userRole !== "Staff" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CommandItem, {
								onSelect: () => {
									navigate({ to: "/settings" });
									setSearchOpen(false);
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings, { className: "mr-2 h-4.5 w-4.5 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Settings & Rules" })]
							})
						]
					})
				] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QrScannerModal, {
				isOpen: qrOpen,
				onOpenChange: setQrOpen
			})
		]
	});
}
var statusMap = {
	Available: {
		classes: "bg-success/10 text-success border-success/25",
		pulse: true
	},
	Active: { classes: "bg-success/10 text-success border-success/25" },
	Good: { classes: "bg-success/10 text-success border-success/25" },
	Rented: { classes: "bg-primary/10 text-primary border-primary/25" },
	Returned: { classes: "bg-muted text-muted-foreground border-border/60" },
	Maintenance: { classes: "bg-warning/12 text-warning-foreground border-warning/30" },
	"Under Maintenance": { classes: "bg-warning/12 text-warning-foreground border-warning/30" },
	UnderMaintenance: { classes: "bg-warning/12 text-warning-foreground border-warning/30" },
	Damaged: { classes: "bg-destructive/10 text-destructive border-destructive/25" },
	Pending: { classes: "bg-warning/12 text-warning-foreground border-warning/30" },
	"Pending Approval": {
		classes: "bg-warning/10 text-warning border-warning/25",
		pulse: true
	},
	Overdue: {
		classes: "bg-destructive/10 text-destructive border-destructive/25",
		pulse: true
	},
	Paid: { classes: "bg-success/10 text-success border-success/25" },
	Partial: { classes: "bg-warning/12 text-warning-foreground border-warning/30" },
	Completed: { classes: "bg-muted text-muted-foreground border-border/60" },
	Cancelled: { classes: "bg-destructive/8 text-destructive/70 border-destructive/20" },
	"Returned to Owner": { classes: "bg-amber-500/10 text-amber-700 border-amber-500/20" },
	ReturnedToOwner: { classes: "bg-amber-500/10 text-amber-700 border-amber-500/20" }
};
function StatusBadge({ status }) {
	const cfg = statusMap[status] ?? { classes: "bg-muted text-muted-foreground border-border/50" };
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
		variant: "outline",
		className: `gap-1.5 font-semibold ${cfg.classes}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `h-1.5 w-1.5 rounded-full bg-current ${cfg.pulse ? "animate-[pulse-dot_2.5s_ease-in-out_infinite]" : "opacity-70"}` }), status]
	});
}
//#endregion
export { CardContent as a, Command$1 as c, CommandInput as d, CommandItem as f, StatusBadge as h, Card as i, CommandEmpty as l, QrScannerModal as m, Avatar as n, CardHeader as o, CommandList as p, AvatarFallback as r, CardTitle as s, AppShell as t, CommandGroup as u };
