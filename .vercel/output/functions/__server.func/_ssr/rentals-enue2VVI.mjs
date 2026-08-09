import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { A as getNextDocumentNumber, B as getReturnCalculatedRentPerItem, C as getDocuments, D as getLocalYYYYMMDD, H as parseLocalDate, I as getOwners, O as getNextAgreementNumber, R as getPayments, S as getDocumentWithFile, T as getEquipment, U as peekNextAgreementNumber, X as saveCustomer, Z as saveDocument, b as getCustomers, d as downloadAgreementFile, g as formatDateDDMMYYYY, i as cleanNum, it as sortLatestFirst, k as getNextCustomerNumber, n as approveRental, nt as saveRental, p as downloadExcel, r as cancelRental, st as useDatabaseTrigger, z as getRentals } from "./data-store-BQmZefNN.mjs";
import { c as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { B as Mail, Ct as CircleCheck, I as MessageCircle, N as PenTool, Nt as CalendarDays, St as CircleX, at as FileText, bt as Clock, h as Trash2, j as Plus, jt as Camera, k as QrCode, lt as FileCheckCorner, mt as Download, nt as FingerprintPattern, p as TriangleAlert, rt as FileUp, t as X, v as SquarePen, w as Search, x as ShieldCheck, z as MapPin } from "../_libs/lucide-react.mjs";
import { a as DialogFooter, c as DialogTrigger, i as DialogContent, l as Input, n as Dialog, o as DialogHeader, r as DialogClose, s as DialogTitle, t as Button, u as Label } from "./dialog-BHa0LWsH.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Textarea } from "./textarea-DE2ysOZI.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-C2rs2HGz.mjs";
import { a as CardContent, h as StatusBadge, i as Card, m as QrScannerModal, t as AppShell } from "./AppShell-BtlnpavN.mjs";
import { a as TableHeader, i as TableHead, n as TableBody, o as TableRow, r as TableCell, t as Table } from "./table-DDeHIPcn.mjs";
import { i as TabsTrigger, n as TabsContent, r as TabsList, t as Tabs } from "./tabs-BoOa83d5.mjs";
import { t as Combobox } from "./combobox-B5tEY2ML.mjs";
import { t as EquipmentFormDialog } from "./EquipmentFormDialog-BgCezUAS.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/rentals-enue2VVI.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function sendWhatsAppDocument(rental, customersList = []) {
	if (!rental) return;
	const cust = customersList.find((c) => c.id === rental.customerId || c.name === rental.customer);
	const rawPhone = cust?.phone || rental.phone || rental.customerPhone || "";
	const cleanPhone = String(rawPhone).replace(/\D/g, "");
	const startDateFormatted = formatDateDDMMYYYY(rental.start);
	const endDateFormatted = rental.end ? formatDateDDMMYYYY(rental.end) : "Ongoing";
	const rentDisplay = rental.rentRate || (rental.monthlyRent ? `₹${rental.monthlyRent.toLocaleString("en-IN")}/mo` : "—");
	const depositDisplay = `₹${(rental.deposit || 0).toLocaleString("en-IN")}`;
	const message = `*Rental Agreement Document - MediRent*\n\n📄 *Agreement ID:* ${rental.id}\n👤 *Customer:* ${rental.customer}\n📦 *Equipment:* ${rental.equipment || "Medical Equipment"}\n🔢 *Serial:* ${rental.serial || "N/A"}\n🗓️ *Start Date:* ${startDateFormatted}\n🗓️ *End Date:* ${endDateFormatted}\n💰 *Rent Rate:* ${rentDisplay}\n💵 *Security Deposit:* ${depositDisplay}\n📌 *Status:* ${rental.status}\n\nThank you for choosing MediRent! Please contact us if you need any assistance.`;
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
function getDirectionsUrl(lat, lon, address) {
	const cleanAddr = address?.trim() || "";
	if (cleanAddr.startsWith("http://") || cleanAddr.startsWith("https://")) return cleanAddr;
	if (lat !== 0 || lon !== 0) return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
	if (cleanAddr) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanAddr)}`;
	return "";
}
function parseManualLocationInput(input) {
	const trimmed = input.trim();
	if (!trimmed) return {
		latitude: 0,
		longitude: 0,
		address: ""
	};
	const coordsMatch = trimmed.match(/^(-?\d+\.\d+)\s*[, \t]\s*(-?\d+\.\d+)$/);
	if (coordsMatch) {
		const lat = parseFloat(coordsMatch[1]);
		const lon = parseFloat(coordsMatch[2]);
		return {
			latitude: lat,
			longitude: lon,
			address: `GPS: ${lat}, ${lon}`
		};
	}
	const urlMatch = trimmed.match(/(?:@|loc:|\?q=|\/place\/|\/search\/|\/dir\/|\!3d|query=)(-?\d+\.\d+)[,\/!4d\s]+(-?\d+\.\d+)/i);
	if (urlMatch) return {
		latitude: parseFloat(urlMatch[1]),
		longitude: parseFloat(urlMatch[2]),
		address: trimmed
	};
	const anyMatch = trimmed.match(/(-?\d+\.\d{3,})\s*,\s*(-?\d+\.\d{3,})/);
	if (anyMatch) return {
		latitude: parseFloat(anyMatch[1]),
		longitude: parseFloat(anyMatch[2]),
		address: trimmed
	};
	return {
		latitude: 0,
		longitude: 0,
		address: trimmed
	};
}
function CreateRentalDialog({ trigger, title = "New Rental Agreement", rental, onSave }) {
	const [open, setOpen] = (0, import_react.useState)(false);
	const isStaff = typeof window !== "undefined" && localStorage.getItem("medirent-user-role") === "Staff";
	const [equipmentList, setEquipmentList] = (0, import_react.useState)(() => getEquipment());
	(0, import_react.useEffect)(() => {
		if (open) setEquipmentList(getEquipment());
	}, [open]);
	(0, import_react.useEffect)(() => {
		const handleUpdate = () => {
			setEquipmentList(getEquipment());
		};
		window.addEventListener("medirent-db-updated", handleUpdate);
		return () => window.removeEventListener("medirent-db-updated", handleUpdate);
	}, []);
	const prevOpenRef = (0, import_react.useRef)(false);
	const prevNeededAutoItemsRef = (0, import_react.useRef)(/* @__PURE__ */ new Set());
	const [agreementId, setAgreementId] = (0, import_react.useState)(rental?.id || peekNextAgreementNumber());
	const [agreementDate, setAgreementDate] = (0, import_react.useState)(rental?.start ? getLocalYYYYMMDD(rental.start) : getLocalYYYYMMDD());
	const [endDate, setEndDate] = (0, import_react.useState)(rental?.end ? getLocalYYYYMMDD(rental.end) : "");
	const [isNewCustomer, setIsNewCustomer] = (0, import_react.useState)(false);
	const [selectedCustomerId, setSelectedCustomerId] = (0, import_react.useState)(rental?.customerId);
	const [signatureUrl, setSignatureUrl] = (0, import_react.useState)(rental?.signatureUrl || null);
	const [thumbprintUrl, setThumbprintUrl] = (0, import_react.useState)(rental?.thumbprintUrl || null);
	const [deliveryPhotos, setDeliveryPhotos] = (0, import_react.useState)([]);
	const [signedDocUrl, setSignedDocUrl] = (0, import_react.useState)(null);
	const [signedDocName, setSignedDocName] = (0, import_react.useState)("");
	const [isDeliveryPhotoChanged, setIsDeliveryPhotoChanged] = (0, import_react.useState)(false);
	const [isSignedDocChanged, setIsSignedDocChanged] = (0, import_react.useState)(false);
	const [isLocationChanged, setIsLocationChanged] = (0, import_react.useState)(false);
	const [scannerTargetIdx, setScannerTargetIdx] = (0, import_react.useState)(null);
	const [isScannerOpen, setIsScannerOpen] = (0, import_react.useState)(false);
	const [isBulkScannerOpen, setIsBulkScannerOpen] = (0, import_react.useState)(false);
	const [capturedLocation, setCapturedLocation] = (0, import_react.useState)(null);
	const [isCapturingLocation, setIsCapturingLocation] = (0, import_react.useState)(false);
	const [isLocationDialogOpen, setIsLocationDialogOpen] = (0, import_react.useState)(false);
	const [manualLocationInput, setManualLocationInput] = (0, import_react.useState)("");
	const [custName, setCustName] = (0, import_react.useState)("");
	const [custPhone, setCustPhone] = (0, import_react.useState)("");
	const [custAltPhone, setCustAltPhone] = (0, import_react.useState)("");
	const [custContactNumber3, setCustContactNumber3] = (0, import_react.useState)("");
	const [custEmail, setCustEmail] = (0, import_react.useState)("");
	const [custAadhaar, setCustAadhaar] = (0, import_react.useState)("");
	const [custPan, setCustPan] = (0, import_react.useState)("");
	const [custAddress, setCustAddress] = (0, import_react.useState)("");
	const [custArea, setCustArea] = (0, import_react.useState)("");
	const [custCity, setCustCity] = (0, import_react.useState)("");
	const [custState, setCustState] = (0, import_react.useState)("Karnataka");
	const [custPincode, setCustPincode] = (0, import_react.useState)("");
	const [custNotes, setCustNotes] = (0, import_react.useState)("");
	const [custFiles, setCustFiles] = (0, import_react.useState)([]);
	const [selectedEquipments, setSelectedEquipments] = (0, import_react.useState)(() => {
		if (rental) {
			if (rental.equipmentItems && rental.equipmentItems.length > 0) return rental.equipmentItems.map((item) => {
				const isMonthly = item.rentCycle ? item.rentCycle === "Monthly" : (item.monthlyRent || 0) > 0 && (item.dailyRent || 0) === 0;
				return {
					equipmentId: item.equipmentId || "",
					serial: item.serial || "",
					rentCycle: item.rentCycle || (isMonthly ? "Monthly" : "Daily"),
					rentRate: isMonthly ? item.monthlyRent?.toString() || "" : item.dailyRent?.toString() || "",
					monthlyRent: item.monthlyRent?.toString() || "",
					dailyRent: item.dailyRent?.toString() || "",
					deposit: item.deposit?.toString() || ""
				};
			});
			const isMonthlyLegacy = rental.rentCycle ? rental.rentCycle === "Monthly" : (rental.monthlyRent || 0) > 0 && (rental.dailyRent || 0) === 0;
			return [{
				equipmentId: rental.equipmentId || "",
				serial: rental.serial || "",
				rentCycle: rental.rentCycle || (isMonthlyLegacy ? "Monthly" : "Daily"),
				rentRate: isMonthlyLegacy ? rental.monthlyRent?.toString() || "" : rental.dailyRent?.toString() || "",
				monthlyRent: rental.monthlyRent?.toString() || "",
				dailyRent: rental.dailyRent?.toString() || "",
				deposit: rental.deposit?.toString() || ""
			}];
		}
		return [{
			equipmentId: "",
			serial: "",
			rentCycle: "Monthly",
			rentRate: "",
			monthlyRent: "",
			dailyRent: "",
			deposit: ""
		}];
	});
	const [deliveryCharges, setDeliveryCharges] = (0, import_react.useState)(rental?.deliveryCharges?.toString() || "0");
	const [removalCharges, setRemovalCharges] = (0, import_react.useState)(rental?.removalCharges?.toString() || "0");
	const [installationCharges, setInstallationCharges] = (0, import_react.useState)(rental?.installationCharges?.toString() || "0");
	const [additionalCharges, setAdditionalCharges] = (0, import_react.useState)(rental?.additionalCharges?.toString() || "0");
	const [remarks, setRemarks] = (0, import_react.useState)(rental?.remarks || "");
	const [consultingHospital, setConsultingHospital] = (0, import_react.useState)(rental?.consultingHospital || "");
	const [referredBy, setReferredBy] = (0, import_react.useState)(rental?.referredBy || "");
	const [owners] = (0, import_react.useState)(() => getOwners());
	const [rentalPaymentStatus, setRentalPaymentStatus] = (0, import_react.useState)(rental?.rentalPaymentStatus || "Not Paid");
	const [depositPaymentStatus, setDepositPaymentStatus] = (0, import_react.useState)(rental?.depositPaymentStatus || "Not Paid");
	const [rentPaidAmount, setRentPaidAmount] = (0, import_react.useState)(rental?.rentPaidAmount?.toString() || "");
	const [depositPaidAmount, setDepositPaidAmount] = (0, import_react.useState)(rental?.depositPaidAmount?.toString() || "");
	const [cashPaidAmount, setCashPaidAmount] = (0, import_react.useState)(rental?.cashPaidAmount?.toString() || "");
	const [bankUpiPaidAmount, setBankUpiPaidAmount] = (0, import_react.useState)(rental?.bankUpiPaidAmount?.toString() || "");
	const [paymentMode, setPaymentMode] = (0, import_react.useState)(rental?.paymentMode || "Cash");
	const [paymentDate, setPaymentDate] = (0, import_react.useState)(rental?.paymentDate ? getLocalYYYYMMDD(rental.paymentDate) : getLocalYYYYMMDD());
	const [paymentCollectedBy, setPaymentCollectedBy] = (0, import_react.useState)(rental?.paymentCollectedBy || "");
	const [isSubmitting, setIsSubmitting] = (0, import_react.useState)(false);
	const [hasDraft, setHasDraft] = (0, import_react.useState)(false);
	const [approvalStatus, setApprovalStatus] = (0, import_react.useState)("Active");
	const handleRentPaidAmountChange = (val) => {
		setRentPaidAmount(val);
	};
	const handleRentalPaymentStatusChange = (val) => {
		setRentalPaymentStatus(val);
		const target = getDurationDetails().totalRent;
		if (val === "Paid") setRentPaidAmount(target.toString());
		else if (val === "Not Paid") setRentPaidAmount("0");
		else if (val === "Partial") setRentPaidAmount("");
		else if (val === "Free of Cost") setRentPaidAmount("0");
	};
	const handleDepositPaidAmountChange = (val) => {
		setDepositPaidAmount(val);
	};
	const handleDepositPaymentStatusChange = (val) => {
		setDepositPaymentStatus(val);
		const target = selectedEquipments.reduce((sum, item) => sum + (Number(item.deposit) || 0), 0);
		if (val === "Paid") setDepositPaidAmount(target.toString());
		else if (val === "Not Paid") setDepositPaidAmount("0");
		else if (val === "Partial") setDepositPaidAmount("");
		else if (val === "Free of Cost") setDepositPaidAmount("0");
	};
	(0, import_react.useEffect)(() => {
		const targetRent = getDurationDetails().totalRent;
		if (rentalPaymentStatus === "Paid") setRentPaidAmount(targetRent.toString());
		else if (rentalPaymentStatus === "Not Paid" || rentalPaymentStatus === "Free of Cost") setRentPaidAmount("0");
		const targetDeposit = selectedEquipments.reduce((sum, item) => sum + (Number(item.deposit) || 0), 0);
		if (depositPaymentStatus === "Paid") setDepositPaidAmount(targetDeposit.toString());
		else if (depositPaymentStatus === "Not Paid" || depositPaymentStatus === "Free of Cost") setDepositPaidAmount("0");
	}, [selectedEquipments]);
	const handleRestoreDraft = (e) => {
		e.preventDefault();
		const savedDraft = localStorage.getItem("medirent_new_agreement_draft");
		if (savedDraft) try {
			const draft = JSON.parse(savedDraft);
			setAgreementId(draft.agreementId || peekNextAgreementNumber());
			setAgreementDate(draft.agreementDate || getLocalYYYYMMDD());
			setEndDate(draft.endDate || getLocalYYYYMMDD(new Date(Date.now() + 720 * 60 * 60 * 1e3)));
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
			setSelectedEquipments(draft.selectedEquipments || [{
				equipmentId: "",
				serial: "",
				rentCycle: "Monthly",
				rentRate: "",
				monthlyRent: "",
				dailyRent: "",
				deposit: ""
			}]);
			setDeliveryCharges(draft.deliveryCharges || "0");
			setRemovalCharges(draft.removalCharges || "0");
			setInstallationCharges(draft.installationCharges || "0");
			setAdditionalCharges(draft.additionalCharges || "0");
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
	};
	const handleDiscardDraft = (e) => {
		e.preventDefault();
		localStorage.removeItem("medirent_new_agreement_draft");
		setHasDraft(false);
		toast.success("Draft agreement details discarded.");
	};
	(0, import_react.useEffect)(() => {
		if (typeof window !== "undefined" && !rental) {
			if (new URLSearchParams(window.location.search).get("addNew") === "true") setOpen(true);
		}
	}, [rental]);
	(0, import_react.useEffect)(() => {
		const justOpened = open && !prevOpenRef.current;
		prevOpenRef.current = open;
		if (open && justOpened) {
			if (localStorage.getItem("medirent_new_agreement_draft")) setHasDraft(true);
			else setHasDraft(false);
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
			if (rental) try {
				const docs = getDocuments();
				const existingSignedDoc = docs.find((d) => d.rentalId === rental.id && d.type === "Signed Agreement");
				const existingDeliveryPhotos = docs.filter((d) => d.rentalId === rental.id && d.type === "Delivery Photo");
				if (existingSignedDoc) {
					setSignedDocName(existingSignedDoc.name);
					getDocumentWithFile(existingSignedDoc).then((fullDoc) => {
						if (fullDoc.fileData && fullDoc.fileData !== "NOT_FOUND") setSignedDocUrl(fullDoc.fileData);
					});
				}
				if (existingDeliveryPhotos.length > 0) Promise.all(existingDeliveryPhotos.map((d) => getDocumentWithFile(d))).then((fullDocs) => {
					setDeliveryPhotos(fullDocs.filter((d) => d.fileData && d.fileData !== "NOT_FOUND").map((d) => ({
						url: d.fileData,
						name: d.name,
						size: d.size,
						id: d.id
					})));
				});
			} catch (err) {
				console.warn("Failed to load existing files for editing agreement:", err);
			}
			if (rental && (rental.latitude || rental.longitude || rental.locationAddress)) setCapturedLocation({
				latitude: Number(rental.latitude) || 0,
				longitude: Number(rental.longitude) || 0,
				address: rental.locationAddress || "",
				accuracy: Number(rental.locationAccuracy || 0),
				timestamp: rental.locationTimestamp || (/* @__PURE__ */ new Date()).toLocaleString()
			});
			else setCapturedLocation(null);
			setIsCapturingLocation(false);
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
			setDeliveryCharges(rental?.deliveryCharges?.toString() || "0");
			setRemovalCharges(rental?.removalCharges?.toString() || "0");
			setInstallationCharges(rental?.installationCharges?.toString() || "0");
			setAdditionalCharges(rental?.additionalCharges?.toString() || "0");
			setRemarks(rental?.remarks || "");
			setConsultingHospital(rental?.consultingHospital || "");
			setReferredBy(rental?.referredBy || "");
			setRentalPaymentStatus(rental?.rentalPaymentStatus || "Not Paid");
			setDepositPaymentStatus(rental?.depositPaymentStatus || "Not Paid");
			setRentPaidAmount(rental?.rentPaidAmount?.toString() || "");
			setDepositPaidAmount(rental?.depositPaidAmount?.toString() || "");
			setCashPaidAmount(rental?.cashPaidAmount?.toString() || "");
			setBankUpiPaidAmount(rental?.bankUpiPaidAmount?.toString() || "");
			setPaymentMode(rental?.paymentMode || "Cash");
			setPaymentDate(rental?.paymentDate ? getLocalYYYYMMDD(rental.paymentDate) : getLocalYYYYMMDD());
			setPaymentCollectedBy(rental?.paymentCollectedBy || "");
			if (rental) if (rental.equipmentItems && rental.equipmentItems.length > 0) setSelectedEquipments(rental.equipmentItems.map((item) => {
				const isMonthly = item.rentCycle ? item.rentCycle === "Monthly" : (item.monthlyRent || 0) > 0 && (item.dailyRent || 0) === 0;
				return {
					equipmentId: item.equipmentId || "",
					serial: item.serial || "",
					rentCycle: item.rentCycle || (isMonthly ? "Monthly" : "Daily"),
					rentRate: isMonthly ? item.monthlyRent?.toString() || "" : item.dailyRent?.toString() || "",
					monthlyRent: item.monthlyRent?.toString() || "",
					dailyRent: item.dailyRent?.toString() || "",
					deposit: item.deposit?.toString() || ""
				};
			}));
			else {
				const isMonthlyLegacy = rental.rentCycle ? rental.rentCycle === "Monthly" : (rental.monthlyRent || 0) > 0 && (rental.dailyRent || 0) === 0;
				setSelectedEquipments([{
					equipmentId: rental.equipmentId || "",
					serial: rental.serial || "",
					rentCycle: rental.rentCycle || (isMonthlyLegacy ? "Monthly" : "Daily"),
					rentRate: isMonthlyLegacy ? rental.monthlyRent?.toString() || "" : rental.dailyRent?.toString() || "",
					monthlyRent: rental.monthlyRent?.toString() || "",
					dailyRent: rental.dailyRent?.toString() || "",
					deposit: rental.deposit?.toString() || ""
				}]);
			}
			else {
				let initialEq = {
					equipmentId: "",
					serial: "",
					rentCycle: "Monthly",
					rentRate: "",
					monthlyRent: "",
					dailyRent: "",
					deposit: ""
				};
				if (typeof window !== "undefined") {
					const searchEqId = new URLSearchParams(window.location.search).get("equipmentId");
					if (searchEqId) {
						const eq = getEquipment().find((e) => e.id === searchEqId);
						if (eq) initialEq = {
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
				setSelectedEquipments([initialEq]);
			}
			const defaultItems = [
				{
					name: "Humidifier Bottle",
					amount: 0,
					status: "Not Paid",
					selected: false
				},
				{
					name: "Bipap Mask",
					amount: 0,
					status: "Not Paid",
					selected: false
				},
				{
					name: "Bipap Hose Pipe",
					amount: 0,
					status: "Not Paid",
					selected: false
				},
				{
					name: "Oxygen Nasal Cannula",
					amount: 0,
					status: "Not Paid",
					selected: false
				},
				{
					name: "Installation Charge",
					amount: 0,
					status: "Not Paid",
					selected: rental?.installationCharges ? true : false
				},
				{
					name: "One Side Transport",
					amount: 0,
					status: "Not Paid",
					selected: false
				},
				{
					name: "Another Side Transport",
					amount: 0,
					status: "Not Paid",
					selected: false
				},
				{
					name: "Nebulizer",
					amount: 0,
					status: "Not Paid",
					selected: false
				},
				{
					name: "Pulse Oximeter",
					amount: 0,
					status: "Not Paid",
					selected: false
				},
				{
					name: "10mtr Oxygen Cannula",
					amount: 0,
					status: "Not Paid",
					selected: false
				}
			];
			let initialAdditionalItems = defaultItems;
			if (typeof window !== "undefined" && !rental) {
				const searchEqId = new URLSearchParams(window.location.search).get("equipmentId");
				if (searchEqId) {
					const eq = getEquipment().find((e) => e.id === searchEqId);
					if (eq) {
						const autoSelectedNames = getAutoSelectItems(eq.name || "", eq.category || "");
						initialAdditionalItems = defaultItems.map((item) => {
							if (autoSelectedNames.includes(item.name)) return {
								...item,
								selected: true
							};
							return item;
						});
						setTimeout(() => {
							updateCalculatedCharges(initialAdditionalItems);
						}, 0);
					}
				}
			}
			if (rental?.additionalItems) setAdditionalItems(rental.additionalItems);
			else setAdditionalItems(initialAdditionalItems);
			prevNeededAutoItemsRef.current = getNeededAutoItemsForEquipments(rental ? rental.equipmentItems || [{
				equipmentId: rental.equipmentId || "",
				serial: rental.serial || ""
			}] : typeof window !== "undefined" && new URLSearchParams(window.location.search).get("equipmentId") ? [{ equipmentId: new URLSearchParams(window.location.search).get("equipmentId") }] : []);
			if (typeof window !== "undefined") {
				if (new URLSearchParams(window.location.search).get("addNew") === "true") {
					const newUrl = window.location.pathname;
					window.history.replaceState({}, document.title, newUrl);
				}
			}
		}
	}, [open, rental]);
	const [additionalItems, setAdditionalItems] = (0, import_react.useState)(() => {
		const defaultItems = [
			{
				name: "Humidifier Bottle",
				amount: 0,
				status: "Not Paid",
				selected: false
			},
			{
				name: "Bipap Mask",
				amount: 0,
				status: "Not Paid",
				selected: false
			},
			{
				name: "Bipap Hose Pipe",
				amount: 0,
				status: "Not Paid",
				selected: false
			},
			{
				name: "Oxygen Nasal Cannula",
				amount: 0,
				status: "Not Paid",
				selected: false
			},
			{
				name: "Installation Charge",
				amount: 0,
				status: "Not Paid",
				selected: rental?.installationCharges ? true : false
			},
			{
				name: "One Side Transport",
				amount: 0,
				status: "Not Paid",
				selected: false
			},
			{
				name: "Another Side Transport",
				amount: 0,
				status: "Not Paid",
				selected: false
			},
			{
				name: "Nebulizer",
				amount: 0,
				status: "Not Paid",
				selected: false
			},
			{
				name: "Pulse Oximeter",
				amount: 0,
				status: "Not Paid",
				selected: false
			},
			{
				name: "10mtr Oxygen Cannula",
				amount: 0,
				status: "Not Paid",
				selected: false
			}
		];
		if (rental?.additionalItems) return rental.additionalItems;
		if (rental) {
			if (rental.installationCharges) {
				const inst = defaultItems.find((i) => i.name === "Installation Charge");
				if (inst) {
					inst.amount = rental.installationCharges;
					inst.selected = true;
				}
			}
			if (rental.additionalCharges) {
				const transport = defaultItems.find((i) => i.name === "One Side Transport");
				if (transport) {
					transport.amount = rental.additionalCharges;
					transport.selected = true;
				}
			}
		}
		return defaultItems;
	});
	const updateCalculatedCharges = (items, changedItemName) => {
		if (!changedItemName || changedItemName === "Installation Charge") {
			const instItem = items.find((i) => i.name === "Installation Charge" && i.selected);
			setInstallationCharges((instItem ? instItem.status === "Free of Cost" ? 0 : instItem.amount : 0).toString());
		}
		if (!changedItemName || changedItemName === "One Side Transport" || changedItemName === "Another Side Transport") {
			const oneSide = items.find((i) => i.name === "One Side Transport" && i.selected);
			const anotherSide = items.find((i) => i.name === "Another Side Transport" && i.selected);
			const oneSideVal = oneSide ? oneSide.status === "Free of Cost" ? 0 : oneSide.amount : 0;
			const anotherSideVal = anotherSide ? anotherSide.status === "Free of Cost" ? 0 : anotherSide.amount : 0;
			if (oneSide || anotherSide) setDeliveryCharges((oneSideVal + anotherSideVal).toString());
			else if (!changedItemName) setDeliveryCharges(rental?.deliveryCharges?.toString() || "0");
			else setDeliveryCharges("0");
		}
		if (!changedItemName || changedItemName !== "Installation Charge" && changedItemName !== "One Side Transport" && changedItemName !== "Another Side Transport") setAdditionalCharges(items.filter((i) => i.selected && i.name !== "Installation Charge" && i.name !== "One Side Transport" && i.name !== "Another Side Transport").reduce((sum, i) => sum + (i.status === "Free of Cost" ? 0 : i.amount), 0).toString());
	};
	const getDurationDetails = () => {
		if (!agreementDate) return {
			text: "Select start date",
			totalRent: 0,
			months: 0,
			days: 0,
			totalDays: 0
		};
		const start = parseLocalDate(agreementDate);
		if (isNaN(start.getTime())) return {
			text: "Invalid start date",
			totalRent: 0,
			months: 0,
			days: 0,
			totalDays: 0
		};
		let end;
		let isOngoing = false;
		if (!endDate) {
			isOngoing = true;
			const parts = agreementDate.split("-");
			if (parts.length === 3) {
				const year = parseInt(parts[0], 10);
				const month = parseInt(parts[1], 10) - 1;
				const day = parseInt(parts[2], 10);
				if (selectedEquipments.some((e) => e.rentCycle === "Daily")) end = new Date(year, month, day + 30);
				else end = new Date(year, month + 1, day);
			} else end = new Date(start.getTime() + 720 * 60 * 60 * 1e3);
		} else end = parseLocalDate(endDate);
		if (isNaN(end.getTime()) || end < start) return {
			text: "Invalid date range",
			totalRent: 0,
			months: 0,
			days: 0,
			totalDays: 0
		};
		const diffTime = end.getTime() - start.getTime();
		const totalDays = Math.max(1, Math.ceil(diffTime / (1e3 * 60 * 60 * 24)));
		let months = end.getFullYear() - start.getFullYear();
		months = months * 12 + (end.getMonth() - start.getMonth());
		let days = end.getDate() - start.getDate();
		if (days < 0) {
			months--;
			const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
			days += prevMonth.getDate();
		}
		let durationText = "";
		if (isOngoing) durationText = "Ongoing (Upfront: 1 Month)";
		else if (months > 0 && days > 0) durationText = `${months} month${months > 1 ? "s" : ""} and ${days} day${days > 1 ? "s" : ""} (${totalDays} days)`;
		else if (months > 0) durationText = `${months} month${months > 1 ? "s" : ""} (${totalDays} days)`;
		else durationText = `${totalDays} day${totalDays !== 1 ? "s" : ""}`;
		let totalRent = 0;
		selectedEquipments.forEach((eqItem) => {
			const rate = Number(eqItem.rentRate) || 0;
			if (eqItem.rentCycle === "Monthly") if (isOngoing) totalRent += rate;
			else totalRent += Math.round(totalDays * (rate / 30));
			else if (isOngoing) totalRent += rate;
			else totalRent += totalDays * rate;
		});
		return {
			text: durationText,
			totalRent,
			months,
			days,
			totalDays
		};
	};
	const durationDetails = getDurationDetails();
	const customersList = getCustomers();
	const selectedCustomer = customersList.find((c) => c.id === selectedCustomerId);
	const getAutoSelectItems = (eqName, eqCategory, eqModel) => {
		const fullStr = `${eqName || ""} ${eqCategory || ""} ${eqModel || ""}`.toLowerCase().trim();
		const matches = (keywords) => keywords.some((k) => fullStr.includes(k.toLowerCase().trim()));
		const result = [];
		if (matches([
			"5lp",
			"5l",
			"10lpm",
			"10l",
			"concentrator",
			"oxygen"
		])) result.push("Humidifier Bottle", "Oxygen Nasal Cannula");
		if (matches([
			"bipap",
			"cpap",
			"auto cpap",
			"bi-pap",
			"c-pap"
		])) result.push("Bipap Mask", "Bipap Hose Pipe");
		if (matches([
			"cot",
			"mattress",
			"wheel chair",
			"wheelchair",
			"surgical cot",
			"foldable wheel"
		])) result.push("One Side Transport", "Another Side Transport");
		if (matches([
			"monitor",
			"syringe",
			"infusion",
			"nebulizer",
			"ventilator"
		])) result.push("Installation Charge");
		return result;
	};
	const getNeededAutoItemsForEquipments = (eqs) => {
		const needed = /* @__PURE__ */ new Set();
		if (!eqs || !Array.isArray(eqs)) return needed;
		eqs.forEach((eqItem) => {
			if (!eqItem) return;
			const itemEq = equipmentList.find((e) => eqItem.equipmentId && e.id === eqItem.equipmentId || eqItem.serial && e.serial && String(e.serial).toLowerCase().trim() === String(eqItem.serial || "").toLowerCase().trim());
			if (itemEq) getAutoSelectItems(itemEq.name || "", itemEq.category || "", itemEq.model || "").forEach((item) => needed.add(item.toLowerCase().trim()));
		});
		return needed;
	};
	const syncAdditionalItemsWithEquipments = (eqs) => {
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
		const newlyNeeded = /* @__PURE__ */ new Set();
		currentNeededAutoItems.forEach((item) => {
			if (!prevNeeded.has(item)) newlyNeeded.add(item);
		});
		const noLongerNeeded = /* @__PURE__ */ new Set();
		prevNeeded.forEach((item) => {
			if (!currentNeededAutoItems.has(item)) noLongerNeeded.add(item);
		});
		prevNeededAutoItemsRef.current = currentNeededAutoItems;
		if (newlyNeeded.size === 0 && noLongerNeeded.size === 0) return;
		setAdditionalItems((prev) => {
			const updated = prev.map((item) => {
				const itemNorm = (item.name || "").toLowerCase().trim();
				if (autoSelectableChecklist.includes(itemNorm)) {
					if (newlyNeeded.has(itemNorm)) return {
						...item,
						selected: true
					};
					if (noLongerNeeded.has(itemNorm)) return {
						...item,
						selected: false
					};
				}
				return item;
			});
			setTimeout(() => {
				updateCalculatedCharges(updated);
			}, 0);
			return updated;
		});
	};
	(0, import_react.useEffect)(() => {
		if (open) syncAdditionalItemsWithEquipments(selectedEquipments);
	}, [
		open,
		selectedEquipments.map((e) => `${e.equipmentId}_${e.serial}`).join("|"),
		equipmentList
	]);
	const handleQrScanSuccess = (scannedText) => {
		const targetIdx = scannerTargetIdx;
		setScannerTargetIdx(null);
		setIsScannerOpen(false);
		const newEquipments = [...selectedEquipments];
		const row = newEquipments[targetIdx ?? 0];
		if (!row) return;
		const eq = equipmentList.find((eItem) => {
			const s = String(eItem.serial || "").trim().toLowerCase();
			return s !== "" && s === scannedText.trim().toLowerCase();
		});
		if (eq) if (eq.status === "Available" || row.equipmentId === eq.id || rental?.equipmentItems?.some((ri) => ri.equipmentId === eq.id)) {
			row.equipmentId = eq.id;
			row.serial = eq.serial;
			toast.success(`Equipment scanned: ${eq.name} (${eq.serial})`);
		} else {
			row.serial = scannedText;
			toast.warning(`Equipment "${eq.name}" is currently "${eq.status}" — serial filled but equipment not selected.`);
		}
		else {
			row.serial = scannedText;
			toast.info(`Serial "${scannedText}" filled — select the equipment from the dropdown.`);
		}
		setSelectedEquipments(newEquipments);
		syncAdditionalItemsWithEquipments(newEquipments);
		if (eq && row.equipmentId && row.equipmentId !== eq.id) setSelectedEquipments((prev) => [...prev, {
			equipmentId: "",
			serial: "",
			rentCycle: "Monthly",
			rentRate: "",
			monthlyRent: "",
			dailyRent: "",
			deposit: ""
		}]);
	};
	const handleBulkScanSuccess = (scannedText) => {
		const term = scannedText.trim().toLowerCase();
		if (!term) return;
		const eq = equipmentList.find((eItem) => {
			const s = String(eItem.serial || "").trim().toLowerCase();
			return s !== "" && s === term;
		});
		if (!eq) {
			toast.error(`Equipment with serial "${scannedText}" not found in database.`);
			return;
		}
		if (!(eq.status === "Available" || rental?.equipmentItems?.some((ri) => ri.equipmentId === eq.id))) {
			toast.warning(`Equipment "${eq.name}" (${eq.serial}) is currently "${eq.status}" and cannot be rented.`);
			return;
		}
		if (selectedEquipments.some((item) => item.equipmentId === eq.id)) {
			toast.info(`Equipment "${eq.name}" (${eq.serial}) is already in the list.`);
			return;
		}
		setSelectedEquipments((prev) => {
			const updated = [...prev];
			const newItem = {
				equipmentId: eq.id,
				serial: eq.serial || "",
				rentCycle: "Monthly",
				rentRate: (eq.monthlyRent || eq.rentRate || 0).toString(),
				monthlyRent: (eq.monthlyRent || eq.rentRate || 0).toString(),
				dailyRent: (eq.dailyRent || Math.round((eq.monthlyRent || eq.rentRate || 0) / 30)).toString(),
				deposit: (eq.deposit || 0).toString()
			};
			if (updated.length === 1 && updated[0].equipmentId === "") updated[0] = newItem;
			else updated.push(newItem);
			toast.success(`Added: ${eq.name} (${eq.serial})`);
			setTimeout(() => {
				syncAdditionalItemsWithEquipments(updated);
			}, 0);
			return updated;
		});
	};
	const handleCaptureLocation = () => {
		if (!navigator.geolocation) {
			toast.error("Geolocation is not supported by your browser.");
			return;
		}
		setIsCapturingLocation(true);
		navigator.geolocation.getCurrentPosition(async (position) => {
			const { latitude, longitude, accuracy } = position.coords;
			let address = `GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
			try {
				const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
				if (res.ok) {
					const data = await res.json();
					if (data && data.display_name) address = data.display_name;
				}
			} catch (e) {}
			setCapturedLocation({
				latitude,
				longitude,
				accuracy,
				address,
				timestamp: (/* @__PURE__ */ new Date()).toLocaleString()
			});
			setIsLocationChanged(true);
			setIsCapturingLocation(false);
			toast.success("Current location details captured!");
		}, (error) => {
			console.error(error);
			setIsCapturingLocation(false);
			toast.error(`Location capture failed: ${error.message}`);
		}, {
			enableHighAccuracy: true,
			timeout: 8e3
		});
	};
	const handleSave = () => {
		if (isSubmitting) return;
		setIsSubmitting(true);
		let customerId = selectedCustomerId;
		selectedCustomer?.name;
		const startD = parseLocalDate(agreementDate);
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
			const isValidPhone = (p) => {
				return p.replace(/\D/g, "").length === 10;
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
				if (custAadhaar.replace(/\D/g, "").length !== 12) {
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
				status: "Active",
				notes: custNotes
			};
			saveCustomer(newCust);
			customerId = newCustId;
			newCust.name;
			if (custFiles.length > 0) custFiles.forEach((file) => {
				saveDocument({
					id: getNextDocumentNumber(),
					customerId: newCustId,
					name: file.name,
					type: "ID Proof",
					size: file.size,
					date: agreementDate || getLocalYYYYMMDD(),
					fileData: file.fileData
				});
			});
		}
		if (!customerId) {
			toast.error("Please select or add a customer.");
			setIsSubmitting(false);
			return;
		}
		if (selectedEquipments.some((eq) => !eq.equipmentId)) {
			toast.error("Please select an equipment for all items.");
			setIsSubmitting(false);
			return;
		}
		const compiledEquipmentNames = selectedEquipments.map((item) => equipmentList.find((e) => e.id === item.equipmentId)?.name || "Unknown").join(", ");
		const compiledSerials = selectedEquipments.map((item) => item.serial || "XXXX").join(", ");
		const compiledIds = selectedEquipments.map((item) => item.equipmentId).join(", ");
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
		const rentToAdd = Number(rentPaidAmount) || 0;
		const depositToAdd = depositPaymentStatus === "Paid" ? totalDeposit : depositPaymentStatus === "Partial" ? Number(depositPaidAmount) || 0 : 0;
		const additionalItemsCollectedTotal = additionalItems.filter((i) => i.selected).reduce((sum, i) => sum + (i.status === "Paid" ? i.amount : 0), 0);
		const totalUpfrontPaid = rentToAdd + depositToAdd + additionalItemsCollectedTotal;
		let finalCashPaid = 0;
		let finalBankUpiPaid = 0;
		if (paymentMode === "Cash") finalCashPaid = totalUpfrontPaid;
		else if (paymentMode === "Bank") finalBankUpiPaid = totalUpfrontPaid;
		else if (paymentMode === "Cash+Bank") {
			finalCashPaid = Number(cashPaidAmount) || 0;
			finalBankUpiPaid = Number(bankUpiPaidAmount) || 0;
		}
		const finalAgreementId = rental ? agreementId : getNextAgreementNumber();
		if (!rental) setAgreementId(finalAgreementId);
		const primaryCycle = selectedEquipments.some((e) => e.rentCycle === "Daily") ? "Daily" : "Monthly";
		saveRental({
			id: finalAgreementId,
			customerId,
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
			status: rental ? rental.status : "Pending Approval",
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
			totalRent: 0,
			latitude: capturedLocation?.latitude || null,
			longitude: capturedLocation?.longitude || null,
			locationAddress: capturedLocation?.address || null,
			locationAccuracy: capturedLocation?.accuracy || null,
			locationTimestamp: capturedLocation?.timestamp || null,
			totalInitialCharges: totalDeposit + (Number(deliveryCharges) || 0) + (Number(removalCharges) || 0) + (Number(installationCharges) || 0) + (Number(additionalCharges) || 0),
			equipmentItems: selectedEquipments.map((item) => {
				const isMonthly = item.rentCycle === "Monthly";
				const rate = Number(item.rentRate) || 0;
				return {
					equipmentId: item.equipmentId,
					name: equipmentList.find((e) => e.id === item.equipmentId)?.name || "Unknown",
					serial: item.serial || "XXXX",
					rentCycle: item.rentCycle || "Monthly",
					monthlyRent: isMonthly ? rate : 0,
					dailyRent: !isMonthly ? rate : Math.round(rate / 30),
					deposit: Number(item.deposit) || 0,
					returned: false
				};
			})
		});
		if (signedDocUrl && signedDocName && (!rental || isSignedDocChanged)) saveDocument({
			id: getNextDocumentNumber(),
			customerId,
			rentalId: finalAgreementId,
			name: signedDocName,
			type: "Signed Agreement",
			size: signedDocUrl === "PDF" ? "N/A" : `${(signedDocUrl.length / 1024 * .75).toFixed(1)} KB`,
			date: agreementDate,
			fileData: signedDocUrl
		});
		if (deliveryPhotos.length > 0 && (!rental || isDeliveryPhotoChanged)) deliveryPhotos.forEach((photo, i) => {
			if (!photo.id) saveDocument({
				id: getNextDocumentNumber(),
				customerId,
				rentalId: finalAgreementId,
				name: photo.name || `Delivery_Photo_${finalAgreementId}_${i + 1}.jpg`,
				type: "Delivery Photo",
				size: photo.size || `${(photo.url.length / 1024 * .75).toFixed(1)} KB`,
				date: agreementDate,
				fileData: photo.url
			});
		});
		if (capturedLocation && (!rental || isLocationChanged)) {
			const docId = getNextDocumentNumber();
			const locationText = `Latitude: ${capturedLocation.latitude}\nLongitude: ${capturedLocation.longitude}\nAccuracy: ${capturedLocation.accuracy || "N/A"}m\nAddress: ${capturedLocation.address}\nTimestamp: ${capturedLocation.timestamp}`;
			let locationFileData;
			try {
				locationFileData = "data:text/plain;base64," + btoa(unescape(encodeURIComponent(locationText)));
			} catch {
				locationFileData = "data:text/plain;charset=utf-8," + encodeURIComponent(locationText);
			}
			saveDocument({
				id: docId,
				customerId,
				rentalId: finalAgreementId,
				name: `Location_Tag_${finalAgreementId}.txt`,
				type: "Location Tag",
				size: `${(locationText.length / 1024).toFixed(2)} KB`,
				date: agreementDate,
				fileData: locationFileData
			});
		}
		toast.success(rental ? `Agreement details for "${agreementId}" updated successfully.` : "New rental agreement saved successfully.");
		setIsSubmitting(false);
		setOpen(false);
		if (onSave) onSave();
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, {
		open,
		onOpenChange: setOpen,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
				asChild: true,
				children: trigger
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
				className: "max-w-3xl max-h-[90vh] overflow-y-auto",
				onPointerDownOutside: (e) => e.preventDefault(),
				onEscapeKeyDown: (e) => e.preventDefault(),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: title }) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-4 py-2 sm:grid-cols-2",
						children: [
							hasDraft && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "sm:col-span-2 flex items-center justify-between bg-primary/10 border border-primary/20 text-primary p-3 rounded-lg text-xs font-semibold mb-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "We found a saved draft. Would you like to restore your progress?" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										size: "sm",
										variant: "outline",
										className: "h-7 text-[11px] bg-background text-primary border-primary/20 hover:bg-primary/5",
										onClick: handleRestoreDraft,
										children: "Restore Draft"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										size: "sm",
										variant: "ghost",
										className: "h-7 text-[11px] text-muted-foreground hover:text-destructive",
										onClick: handleDiscardDraft,
										children: "Discard"
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									className: "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
									children: "Agreement Number (Auto-Generated)"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									placeholder: "Auto-generated",
									value: agreementId,
									readOnly: true,
									className: "bg-muted/30 cursor-not-allowed font-mono font-bold text-primary"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									className: "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
									children: "Agreement Date (Rent Start Date)"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									type: "date",
									value: agreementDate,
									max: endDate,
									onChange: (e) => setAgreementDate(e.target.value)
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									className: "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
									children: "Consulting Hospital Name"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									placeholder: "e.g. Apollo Hospitals",
									value: consultingHospital,
									onChange: (e) => setConsultingHospital(e.target.value)
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									className: "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
									children: "Referred By"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									placeholder: "e.g. Dr. Sharma",
									value: referredBy,
									onChange: (e) => setReferredBy(e.target.value)
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1.5 sm:col-span-2 rounded-lg border border-border/60 bg-muted/20 p-3 mb-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between mb-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										className: "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
										children: isNewCustomer ? "New Customer Details" : "Customer Selection"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "ghost",
										size: "sm",
										className: "h-6 text-[11px] text-primary hover:bg-primary/10 px-2",
										onClick: (e) => {
											e.preventDefault();
											setIsNewCustomer(!isNewCustomer);
										},
										children: isNewCustomer ? "Choose Existing Customer" : "+ Add New Customer"
									})]
								}), isNewCustomer ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid gap-3 sm:grid-cols-2 mt-3 pt-3 border-t border-border/50",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "sm:col-span-2 space-y-1.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												className: "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
												children: "Full Name *"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												placeholder: "Patient or guardian name",
												value: custName,
												onChange: (e) => setCustName(e.target.value)
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-1.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												className: "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
												children: "Address"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												placeholder: "Full address",
												value: custAddress,
												onChange: (e) => setCustAddress(e.target.value)
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-1.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												className: "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
												children: "Area"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												placeholder: "Area / Locality",
												value: custArea,
												onChange: (e) => setCustArea(e.target.value)
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-1.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												className: "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
												children: "City"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												value: custCity,
												onChange: (e) => setCustCity(e.target.value)
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-1.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												className: "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
												children: "State"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
												value: custState,
												onValueChange: setCustState,
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
													className: "bg-background",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Select state" })
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: ["Karnataka"].map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: s,
													children: s
												}, s)) })]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-1.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												className: "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
												children: "Pincode"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												value: custPincode,
												onChange: (e) => setCustPincode(e.target.value)
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-1.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												className: "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
												children: "Primary Number *"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												placeholder: "10-digit phone number",
												value: custPhone,
												onChange: (e) => {
													const digits = e.target.value.replace(/\D/g, "");
													if (digits.length > 10) if (digits.startsWith("91")) setCustPhone(digits.slice(-10));
													else if (digits.startsWith("0")) setCustPhone(digits.slice(-10));
													else setCustPhone(digits.slice(0, 10));
													else setCustPhone(digits);
												},
												maxLength: 14
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-1.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												className: "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
												children: "Alternative Phone"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												placeholder: "optional (10 digits)",
												value: custAltPhone,
												onChange: (e) => {
													const digits = e.target.value.replace(/\D/g, "");
													if (digits.length > 10) if (digits.startsWith("91")) setCustAltPhone(digits.slice(-10));
													else if (digits.startsWith("0")) setCustAltPhone(digits.slice(-10));
													else setCustAltPhone(digits.slice(0, 10));
													else setCustAltPhone(digits);
												},
												maxLength: 14
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-1.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												className: "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
												children: "Alternative Phone 1"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												placeholder: "optional (10 digits)",
												value: custContactNumber3,
												onChange: (e) => {
													const digits = e.target.value.replace(/\D/g, "");
													if (digits.length > 10) if (digits.startsWith("91")) setCustContactNumber3(digits.slice(-10));
													else if (digits.startsWith("0")) setCustContactNumber3(digits.slice(-10));
													else setCustContactNumber3(digits.slice(0, 10));
													else setCustContactNumber3(digits);
												},
												maxLength: 14
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-1.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												className: "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
												children: "Email"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												placeholder: "email@domain.com",
												value: custEmail,
												onChange: (e) => setCustEmail(e.target.value)
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-1.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												className: "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
												children: "Aadhaar Number"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												placeholder: "12-digit Aadhaar number",
												value: custAadhaar,
												onChange: (e) => setCustAadhaar(e.target.value.replace(/\D/g, "").slice(0, 12)),
												maxLength: 12
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-1.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												className: "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
												children: "PAN Number"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												placeholder: "ABCDE1234F",
												value: custPan,
												onChange: (e) => setCustPan(e.target.value)
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "sm:col-span-2 space-y-1.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, {
												className: "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "ID Proof Upload" }), custFiles.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "text-primary font-bold",
													children: [
														"(",
														custFiles.length,
														" file",
														custFiles.length === 1 ? "" : "s",
														")"
													]
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CustomerIDProofDialog, {
												initialFiles: custFiles,
												onSave: (files) => {
													setCustFiles(files);
												},
												trigger: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "border-2 border-dashed border-border/60 hover:bg-muted/10 transition-colors rounded-xl p-3 text-center cursor-pointer flex flex-col items-center justify-center min-h-[70px] bg-background/50",
													children: custFiles.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
														className: "text-[12px] font-bold text-primary truncate max-w-[280px]",
														children: [
															custFiles.length,
															" ID Proof File",
															custFiles.length === 1 ? "" : "s",
															" Selected"
														]
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
														className: "text-[10px] text-muted-foreground",
														children: [custFiles.map((f) => f.name).join(", "), " · Click to change/add"]
													})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex flex-col items-center text-muted-foreground hover:text-primary transition-colors",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileUp, { className: "h-5 w-5 mb-0.5 text-muted-foreground/60" }),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
																className: "text-[12px] font-semibold",
																children: "Click to upload ID Proofs"
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
																className: "text-[10px] text-muted-foreground/80",
																children: "Multiple Aadhaar, PAN, Photo — PDF or image files"
															})
														]
													})
												})
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "sm:col-span-2 space-y-1.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												className: "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
												children: "Notes"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
												placeholder: "Any special notes about this customer…",
												className: "resize-none min-h-[70px] bg-background",
												value: custNotes,
												onChange: (e) => setCustNotes(e.target.value)
											})]
										})
									]
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Combobox, {
										value: selectedCustomerId,
										onValueChange: setSelectedCustomerId,
										placeholder: "Select existing customer",
										searchPlaceholder: "Search customer by name or ID...",
										emptyText: "No customer found.",
										options: customersList.map((c) => ({
											value: c.id,
											label: `${c.name} — ${c.id}`,
											searchTerms: `${c.phone} ${c.altPhone || ""} ${c.contactNumber3 || ""} ${c.area || ""}`
										}))
									}), selectedCustomer && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid gap-x-4 gap-y-3 sm:grid-cols-2 rounded-lg border border-border/50 bg-background/50 p-4 mt-3",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReadOnlyField, {
												label: "Full Name",
												value: selectedCustomer.name
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReadOnlyField, {
												label: "Primary Number",
												value: selectedCustomer.phone
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReadOnlyField, {
												label: "Alternative Phone",
												value: selectedCustomer.altPhone || "—"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReadOnlyField, {
												label: "Alternative Phone 1",
												value: selectedCustomer.contactNumber3 || "—"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReadOnlyField, {
												label: "Email",
												value: selectedCustomer.email || "—"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReadOnlyField, {
												label: "Aadhaar Number",
												value: selectedCustomer.aadhaar || "—"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReadOnlyField, {
												label: "PAN Number",
												value: selectedCustomer.pan || "—"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReadOnlyField, {
												label: "Address",
												value: selectedCustomer.address
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReadOnlyField, {
												label: "Area",
												value: selectedCustomer.area || "—"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReadOnlyField, {
												label: "City",
												value: selectedCustomer.city
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReadOnlyField, {
												label: "State",
												value: selectedCustomer.state
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReadOnlyField, {
												label: "Pincode",
												value: selectedCustomer.pincode
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReadOnlyField, {
												label: "Notes",
												value: selectedCustomer.notes || "—",
												className: "sm:col-span-2"
											})
										]
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "sm:col-span-2 flex items-center justify-between border-b border-border pb-1.5 mt-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex flex-col",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										className: "text-[11.5px] font-bold uppercase tracking-wider text-foreground",
										children: "Equipment Items Selection"
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex gap-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EquipmentFormDialog, {
											title: "Register New Equipment",
											trigger: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
												variant: "outline",
												size: "sm",
												type: "button",
												className: "h-7 text-[11px] text-primary border-primary/20 hover:bg-primary/5 px-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "mr-1.5 h-3.5 w-3.5" }), " Register New Equipment"]
											}),
											onSave: (newEq) => {
												setEquipmentList(getEquipment());
												if (newEq) setSelectedEquipments((prev) => {
													const newItem = {
														equipmentId: newEq.id,
														serial: newEq.serial,
														rentCycle: "Monthly",
														rentRate: "",
														monthlyRent: "",
														dailyRent: "",
														deposit: ""
													};
													const updated = prev.length === 1 && !prev[0].equipmentId ? [newItem] : [...prev, newItem];
													setTimeout(() => {
														syncAdditionalItemsWithEquipments(updated);
													}, 0);
													return updated;
												});
											}
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											variant: "outline",
											size: "sm",
											type: "button",
											className: "h-7 text-[11px] text-primary border-primary/20 hover:bg-primary/5 px-2",
											onClick: (e) => {
												e.preventDefault();
												const updated = [...selectedEquipments, {
													equipmentId: "",
													serial: "",
													rentCycle: "Monthly",
													rentRate: "",
													monthlyRent: "",
													dailyRent: "",
													deposit: ""
												}];
												setSelectedEquipments(updated);
												syncAdditionalItemsWithEquipments(updated);
											},
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "mr-1 h-3.5 w-3.5" }), " Add Equipment"]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											variant: "outline",
											size: "sm",
											type: "button",
											className: "h-7 text-[11px] text-primary border-primary/20 hover:bg-primary/5 px-2",
											onClick: (e) => {
												e.preventDefault();
												setIsBulkScannerOpen(true);
											},
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QrCode, { className: "mr-1 h-3.5 w-3.5" }), " Scan Equipment"]
										})
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "sm:col-span-2 space-y-4",
								children: selectedEquipments.map((eqItem, idx) => {
									const isSelectedElsewhere = (id) => selectedEquipments.some((item, i) => i !== idx && item.equipmentId === id);
									const itemsForSelect = equipmentList.filter((e) => (e.status === "Available" || e.id === eqItem.equipmentId || rental?.equipmentItems?.some((ri) => ri.equipmentId === e.id)) && !isSelectedElsewhere(e.id));
									return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid gap-3 sm:grid-cols-6 items-end p-3 rounded-lg border border-border bg-card/50 relative group",
										children: [
											selectedEquipments.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												variant: "ghost",
												size: "icon",
												type: "button",
												className: "absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-destructive",
												onClick: (e) => {
													e.preventDefault();
													const filtered = selectedEquipments.filter((_, i) => i !== idx);
													setSelectedEquipments(filtered);
													syncAdditionalItemsWithEquipments(filtered);
												},
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-3.5 w-3.5" })
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "space-y-1.5 sm:col-span-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
													className: "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground",
													children: "Equipment"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Combobox, {
													value: eqItem.equipmentId,
													onValueChange: (val) => {
														const newEquipments = [...selectedEquipments];
														newEquipments[idx].equipmentId = val;
														if (!val) {
															newEquipments[idx].serial = "";
															newEquipments[idx].monthlyRent = "";
															newEquipments[idx].dailyRent = "";
															newEquipments[idx].deposit = "";
															newEquipments[idx].rentRate = "";
														} else {
															const eq = equipmentList.find((e) => e.id === val);
															if (eq) {
																newEquipments[idx].serial = eq.serial || "";
																const cycle = newEquipments[idx].rentCycle || "Monthly";
																const defaultMonthly = (eq.monthlyRent || eq.rentRate || 0).toString();
																const defaultDaily = (eq.dailyRent || (eq.monthlyRent ? Math.round(eq.monthlyRent / 30) : 0)).toString();
																newEquipments[idx].monthlyRent = defaultMonthly !== "0" ? defaultMonthly : "";
																newEquipments[idx].dailyRent = defaultDaily !== "0" ? defaultDaily : "";
																newEquipments[idx].deposit = (eq.deposit || 0).toString();
																if (cycle === "Daily") newEquipments[idx].rentRate = defaultDaily !== "0" ? defaultDaily : defaultMonthly !== "0" ? Math.round(Number(defaultMonthly) / 30).toString() : "";
																else newEquipments[idx].rentRate = defaultMonthly !== "0" ? defaultMonthly : "";
															}
														}
														setSelectedEquipments(newEquipments);
														syncAdditionalItemsWithEquipments(newEquipments);
													},
													placeholder: "Select equipment",
													searchPlaceholder: "Search equipment by name, serial, owner...",
													emptyText: "No equipment found.",
													options: itemsForSelect.map((e) => {
														const displayName = e.name || e.category || "Equipment";
														const serialNum = e.serial || "No Serial";
														return {
															value: e.id,
															label: serialNum !== "No Serial" ? `${displayName} — ${serialNum}` : displayName
														};
													}),
													className: "h-9"
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "space-y-1.5",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
													className: "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground",
													children: "Serial Number"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													placeholder: "Type serial...",
													value: eqItem.serial || "",
													onChange: (e) => {
														const val = e.target.value;
														const newEquipments = selectedEquipments.map((item, i) => {
															if (i === idx) {
																const updated = {
																	...item,
																	serial: val
																};
																if (!val.trim()) updated.equipmentId = "";
																else {
																	const eq = equipmentList.find((eItem) => {
																		const s = String(eItem.serial || "").trim().toLowerCase();
																		return s !== "" && s === val.trim().toLowerCase();
																	});
																	if (eq) if (eq.status === "Available" || eq.id === item.equipmentId || rental?.equipmentItems?.some((ri) => ri.equipmentId === eq.id)) {
																		updated.equipmentId = eq.id;
																		updated.serial = eq.serial;
																	} else toast.warning(`Equipment with serial "${val}" is currently "${eq.status}"`);
																}
																return updated;
															}
															return item;
														});
														setSelectedEquipments(newEquipments);
														syncAdditionalItemsWithEquipments(newEquipments);
													},
													className: "h-9 font-mono text-[12px] w-full"
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "space-y-1.5",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
													className: "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground",
													children: "Rent Cycle"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
													value: eqItem.rentCycle || "Monthly",
													onValueChange: (val) => {
														const newEquipments = [...selectedEquipments];
														newEquipments[idx].rentCycle = val;
														const mRentNum = Number(newEquipments[idx].monthlyRent) || 0;
														const dRentNum = Number(newEquipments[idx].dailyRent) || 0;
														const currRate = Number(newEquipments[idx].rentRate) || 0;
														if (val === "Monthly") {
															const newM = mRentNum > 0 ? mRentNum : dRentNum > 0 ? dRentNum * 30 : currRate > 0 ? currRate * 30 : 0;
															newEquipments[idx].rentRate = newM > 0 ? newM.toString() : "";
															newEquipments[idx].monthlyRent = newEquipments[idx].rentRate;
															newEquipments[idx].dailyRent = newM > 0 ? Math.round(newM / 30).toString() : "";
														} else {
															const newD = dRentNum > 0 ? dRentNum : mRentNum > 0 ? Math.round(mRentNum / 30) : currRate > 0 ? currRate : 0;
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
																if (val === "Daily") setEndDate(getLocalYYYYMMDD(new Date(year, month, day)));
																else setEndDate(getLocalYYYYMMDD(new Date(year, month + 1, day)));
															}
														}
													},
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
														className: "h-9",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
														value: "Monthly",
														children: "Monthly"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
														value: "Daily",
														children: "Daily"
													})] })]
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "space-y-1.5",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
													className: "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground",
													children: eqItem.rentCycle === "Daily" ? "Daily Rent (₹)" : "Monthly Rent (₹)"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													placeholder: eqItem.rentCycle === "Daily" ? "e.g. 120" : "e.g. 3500",
													value: eqItem.rentRate || "",
													className: "h-9",
													onChange: (e) => {
														const val = e.target.value;
														const newEquipments = [...selectedEquipments];
														newEquipments[idx].rentRate = val;
														const numeric = Number(val);
														if (!isNaN(numeric) && numeric > 0) if (newEquipments[idx].rentCycle === "Daily") {
															newEquipments[idx].dailyRent = val;
															newEquipments[idx].monthlyRent = (numeric * 30).toString();
														} else {
															newEquipments[idx].monthlyRent = val;
															newEquipments[idx].dailyRent = Math.round(numeric / 30).toString();
														}
														setSelectedEquipments(newEquipments);
													}
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "space-y-1.5",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
													className: "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground",
													children: "Deposit (₹)"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													placeholder: "e.g. 7000",
													value: eqItem.deposit,
													className: "h-9",
													onChange: (e) => {
														const newEquipments = [...selectedEquipments];
														newEquipments[idx].deposit = e.target.value;
														setSelectedEquipments(newEquipments);
													}
												})]
											})
										]
									}, idx);
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "sm:col-span-2 space-y-3 rounded-xl border border-border/60 bg-muted/5 p-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-col sm:flex-row sm:items-center justify-between pb-1.5 border-b border-border/50 gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										className: "text-[11.5px] font-bold uppercase tracking-wider text-foreground",
										children: "Additional Amount Items Checklist"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											type: "button",
											variant: "outline",
											size: "sm",
											className: "h-7 text-[11px] text-primary border-dashed border-primary/40 hover:border-primary hover:bg-primary/5 px-3",
											onClick: (e) => {
												e.preventDefault();
												setAdditionalItems([{
													name: "",
													amount: 0,
													status: "Not Paid",
													selected: true,
													isCustom: true
												}, ...additionalItems]);
											},
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "mr-1 h-3 w-3" }), " Add Custom Item"]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[10px] text-muted-foreground font-mono",
											children: "Select to include item"
										})]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "rounded-lg border border-border/50 overflow-hidden bg-background",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "max-h-[250px] overflow-y-auto",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
											className: "w-full text-left text-[12.5px]",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
												className: "bg-muted/40 text-[10px] uppercase font-bold text-muted-foreground border-b border-border/50 sticky top-0",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
														className: "p-2.5 w-12 text-center",
														children: "Use"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
														className: "p-2.5",
														children: "Item Name"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
														className: "p-2.5 w-28 text-right",
														children: "Cost (₹)"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
														className: "p-2.5 w-36",
														children: "Status"
													})
												] })
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
												className: "divide-y divide-border/40",
												children: additionalItems.map((item, index) => ({
													item,
													index
												})).sort((a, b) => {
													if (a.item.isCustom && !b.item.isCustom) return -1;
													if (!a.item.isCustom && b.item.isCustom) return 1;
													if (a.item.selected && !b.item.selected) return -1;
													if (!a.item.selected && b.item.selected) return 1;
													return 0;
												}).map(({ item, index }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
													className: `hover:bg-muted/10 transition-colors ${item.selected ? "bg-primary/5" : ""}`,
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
															className: "p-2.5 text-center",
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
																type: "checkbox",
																checked: item.selected,
																onChange: (e) => {
																	const newItems = [...additionalItems];
																	newItems[index].selected = e.target.checked;
																	setAdditionalItems(newItems);
																	updateCalculatedCharges(newItems, item.name);
																},
																className: "h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
															})
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
															className: "p-2.5 font-medium text-foreground",
															children: item.isCustom ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "flex items-center gap-1.5 w-full",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																	placeholder: "Enter item name...",
																	value: item.name,
																	onChange: (e) => {
																		const newItems = [...additionalItems];
																		newItems[index].name = e.target.value;
																		setAdditionalItems(newItems);
																	},
																	className: "h-7 text-[12px] p-1.5 flex-1 bg-card border-border/80 focus-visible:ring-primary/20"
																}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
																	size: "icon",
																	variant: "ghost",
																	type: "button",
																	className: "h-7 w-7 text-muted-foreground hover:text-destructive shrink-0",
																	onClick: (e) => {
																		e.preventDefault();
																		const newItems = additionalItems.filter((_, i) => i !== index);
																		setAdditionalItems(newItems);
																		updateCalculatedCharges(newItems);
																	},
																	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-3.5 w-3.5" })
																})]
															}) : item.name
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
															className: "p-2.5 text-right",
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																type: "number",
																disabled: !item.selected,
																value: item.amount === 0 ? "" : item.amount,
																onChange: (e) => {
																	const newItems = [...additionalItems];
																	newItems[index].amount = Number(e.target.value) || 0;
																	setAdditionalItems(newItems);
																	updateCalculatedCharges(newItems, item.name);
																},
																className: "h-7 w-20 text-[12px] p-1.5 text-right ml-auto bg-card disabled:opacity-50 disabled:bg-muted/30"
															})
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
															className: "p-2.5",
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
																disabled: !item.selected,
																value: item.status,
																onValueChange: (val) => {
																	const newItems = [...additionalItems];
																	newItems[index].status = val;
																	setAdditionalItems(newItems);
																	updateCalculatedCharges(newItems, item.name);
																},
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
																	className: "h-7 text-[11px] bg-background disabled:opacity-50 disabled:bg-muted/30",
																	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Status" })
																}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
																		value: "Paid",
																		children: "Paid"
																	}),
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
																		value: "Not Paid",
																		children: "Not Paid"
																	}),
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
																		value: "Free of Cost",
																		children: "Free of Cost"
																	})
																] })]
															})
														})
													]
												}, item.name || `custom-${index}`))
											})]
										})
									})
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "sm:col-span-2 space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									className: "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
									children: "Remarks"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
									placeholder: "Special delivery instructions, patient condition notes, etc.",
									className: "resize-none min-h-[80px]",
									value: remarks,
									onChange: (e) => setRemarks(e.target.value)
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "sm:col-span-2 space-y-3 rounded-lg border border-border/60 bg-muted/10 p-4 mt-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2 mb-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "h-4 w-4 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
											className: "text-[13px] font-semibold text-foreground",
											children: "Security & Verification"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-5",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "space-y-1.5",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, {
													className: "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1 h-8",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FingerprintPattern, { className: "h-3.5 w-3.5" }), " Thumbprint Scan"]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThumbprintCaptureDialog, {
													onSave: setThumbprintUrl,
													trigger: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "flex flex-col items-center justify-center border-2 border-dashed border-border/60 rounded-lg p-3 bg-background hover:bg-muted/30 transition-colors cursor-pointer h-24 overflow-hidden relative",
														children: thumbprintUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
															src: thumbprintUrl,
															alt: "Thumbprint",
															className: "h-full w-full object-contain bg-white rounded p-1"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
															className: "absolute inset-0 bg-background/80 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity",
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "text-[10px] font-medium text-foreground",
																children: "Click to re-scan"
															})
														})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FingerprintPattern, { className: "h-6 w-6 text-muted-foreground/50 mb-2" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "text-[10px] font-medium text-muted-foreground",
															children: "Click to capture"
														})] })
													})
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "space-y-1.5",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, {
													className: "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1 h-8",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PenTool, { className: "h-3.5 w-3.5" }), " Digital Signature"]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SignaturePadDialog, {
													onSave: setSignatureUrl,
													trigger: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "flex flex-col items-center justify-center border-2 border-dashed border-border/60 rounded-lg p-3 bg-background hover:bg-muted/30 transition-colors cursor-pointer h-24 overflow-hidden relative",
														children: signatureUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
															src: signatureUrl,
															alt: "Signature",
															className: "h-full w-full object-contain bg-white rounded p-1"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
															className: "absolute inset-0 bg-background/80 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity",
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "text-[10px] font-medium text-foreground",
																children: "Click to re-sign"
															})
														})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PenTool, { className: "h-6 w-6 text-muted-foreground/50 mb-2" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "text-[10px] font-medium text-muted-foreground",
															children: "Sign agreement"
														})] })
													})
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "space-y-1.5",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
													className: "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between h-8",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "flex items-center gap-1",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, { className: "h-3.5 w-3.5" }),
															" Delivery Photo ",
															deliveryPhotos.length > 0 && `(${deliveryPhotos.length})`
														]
													})
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DeliveryPhotoCaptureDialog, {
													initialPhotos: deliveryPhotos,
													onSave: (photos) => {
														setDeliveryPhotos(photos);
														setIsDeliveryPhotoChanged(true);
													},
													trigger: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "border-2 border-dashed border-border/60 bg-background rounded-lg h-24 overflow-hidden relative hover:bg-muted/10 transition-colors cursor-pointer flex flex-col items-center justify-center",
														children: deliveryPhotos.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "w-full h-full flex flex-col items-center justify-center space-y-1 p-1",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
																className: "flex items-center justify-center gap-1.5 max-w-full overflow-hidden",
																children: deliveryPhotos.slice(0, 3).map((photo, i) => {
																	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
																		className: "h-11 w-11 rounded overflow-hidden border border-border bg-muted/20 shrink-0",
																		children: photo.url.startsWith("data:image/") || /\.(jpg|jpeg|png|webp)$/i.test(photo.name) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
																			src: photo.url,
																			alt: `Delivery ${i}`,
																			className: "w-full h-full object-cover"
																		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
																			className: "w-full h-full flex flex-col items-center justify-center p-0.5 text-[8px] text-primary bg-primary/10",
																			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "h-4 w-4" })
																		})
																	}, i);
																})
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
																className: "text-[10px] text-center text-primary font-bold",
																children: [
																	deliveryPhotos.length,
																	" File",
																	deliveryPhotos.length === 1 ? "" : "s",
																	" Attached · Click to manage"
																]
															})]
														}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "flex flex-col items-center justify-center w-full h-full p-2 text-center",
															children: [
																/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, { className: "h-6 w-6 text-muted-foreground/50 mb-1" }),
																/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																	className: "text-[10px] font-semibold text-muted-foreground leading-tight",
																	children: "Take Photo / Upload"
																}),
																/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																	className: "text-[9px] text-muted-foreground/60 mt-0.5",
																	children: "Click to open & upload multiple"
																})
															]
														})
													})
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "space-y-1.5",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, {
													className: "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1 h-8",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileUp, { className: "h-3.5 w-3.5" }), " Signed Document"]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SignedDocumentCaptureDialog, {
													onSave: (url, name) => {
														setSignedDocUrl(url);
														setSignedDocName(name);
														setIsSignedDocChanged(true);
													},
													trigger: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "border-2 border-dashed border-border/60 bg-background rounded-lg h-24 overflow-hidden relative hover:bg-muted/10 transition-colors cursor-pointer",
														children: signedDocUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "relative w-full h-full group bg-muted/20 flex items-center justify-center",
															children: [signedDocUrl.startsWith("data:application/pdf") || signedDocUrl === "PDF" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "flex flex-col items-center justify-center w-full h-full p-2",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "h-8 w-8 text-primary mb-1" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																	className: "text-[10px] font-bold text-primary truncate max-w-full px-2",
																	children: signedDocName || "PDF Uploaded"
																})]
															}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
																src: signedDocUrl,
																alt: "Signed Doc",
																className: "w-full h-full object-cover"
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
																className: "absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity",
																children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																	className: "text-[10px] font-bold text-foreground",
																	children: "Click to change"
																})
															})]
														}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "flex flex-col items-center justify-center w-full h-full p-2 text-center",
															children: [
																/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileUp, { className: "h-6 w-6 text-muted-foreground/50 mb-1" }),
																/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																	className: "text-[10px] font-semibold text-muted-foreground leading-tight",
																	children: "Upload PDF / Image"
																}),
																/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																	className: "text-[9px] text-muted-foreground/60 mt-0.5",
																	children: "Click anywhere to open"
																})
															]
														})
													})
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "space-y-1.5",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, {
													className: "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1 h-8",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "h-3.5 w-3.5" }), " Location Tag"]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, {
													open: isLocationDialogOpen,
													onOpenChange: setIsLocationDialogOpen,
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
														asChild: true,
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
															className: "flex flex-col items-center justify-center border-2 border-dashed border-border/60 rounded-lg p-2 bg-background hover:bg-muted/30 transition-colors cursor-pointer h-24 overflow-hidden relative text-center",
															children: capturedLocation ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "flex flex-col items-center justify-center w-full h-full p-1",
																children: [
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "h-5 w-5 text-success mb-1" }),
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																		className: "text-[9px] font-bold text-success",
																		children: "Location Tagged"
																	}),
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																		className: "text-[8px] text-muted-foreground truncate w-full px-2",
																		title: capturedLocation.address,
																		children: capturedLocation.latitude !== 0 ? `${capturedLocation.latitude.toFixed(4)}, ${capturedLocation.longitude.toFixed(4)}` : capturedLocation.address
																	})
																]
															}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "h-6 w-6 text-muted-foreground/50 mb-1" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "text-[10px] font-medium text-muted-foreground leading-tight",
																children: isCapturingLocation ? "Tagging..." : "Tag Location"
															})] })
														})
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
														className: "sm:max-w-[420px] p-6",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, {
															className: "flex items-center gap-2 text-[15px] font-bold",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "h-4.5 w-4.5 text-primary" }), " Location Tagging & Directions"]
														}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "space-y-4 py-3",
															children: [capturedLocation && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "rounded-lg bg-muted/40 border border-border p-3.5 space-y-2 text-[12.5px]",
																children: [
																	/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
																		className: "font-bold text-emerald-600 flex items-center gap-1.5",
																		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "h-4 w-4" }), " Location Tagged"]
																	}),
																	capturedLocation.latitude !== 0 || capturedLocation.longitude !== 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
																		className: "font-mono text-[11px] text-muted-foreground",
																		children: [
																			"GPS Coordinates: ",
																			capturedLocation.latitude.toFixed(6),
																			", ",
																			capturedLocation.longitude.toFixed(6)
																		]
																	}) : null,
																	/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
																		className: "text-[11.5px] text-foreground/80 break-all font-medium",
																		children: ["Address/Details: ", capturedLocation.address]
																	}),
																	/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
																		className: "text-[9.5px] text-muted-foreground",
																		children: ["Tagged at: ", capturedLocation.timestamp]
																	}),
																	/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																		className: "flex gap-2 pt-1.5",
																		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
																			type: "button",
																			variant: "default",
																			size: "sm",
																			className: "w-full text-[11.5px] h-8 bg-emerald-600 hover:bg-emerald-700",
																			onClick: () => {
																				const url = getDirectionsUrl(capturedLocation.latitude, capturedLocation.longitude, capturedLocation.address);
																				if (url) window.open(url, "_blank");
																			},
																			children: "Direct to Directions"
																		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
																			type: "button",
																			variant: "outline",
																			size: "sm",
																			className: "w-full text-destructive border-destructive/20 hover:bg-destructive/10 text-[11.5px] h-8",
																			onClick: () => setCapturedLocation(null),
																			children: "Remove Tag"
																		})]
																	})
																]
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "space-y-3",
																children: [
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
																		className: "text-[12px] text-muted-foreground",
																		children: "Tag the location of this delivery/agreement:"
																	}),
																	/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
																		type: "button",
																		variant: "outline",
																		className: "w-full h-9.5 text-[12px] font-bold border-primary/20 hover:bg-primary/5 hover:text-primary flex justify-center items-center",
																		disabled: isCapturingLocation,
																		onClick: () => {
																			handleCaptureLocation();
																			setIsLocationDialogOpen(false);
																		},
																		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "mr-2 h-4 w-4 shrink-0" }), isCapturingLocation ? "Capturing Location..." : "Capture GPS Location Automatically"]
																	}),
																	/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																		className: "relative flex py-1 items-center",
																		children: [
																			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "flex-grow border-t border-border/60" }),
																			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																				className: "flex-shrink mx-3 text-muted-foreground text-[9px] font-bold uppercase tracking-wider",
																				children: "or Enter Manually"
																			}),
																			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "flex-grow border-t border-border/60" })
																		]
																	}),
																	/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																		className: "space-y-2",
																		children: [
																			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
																				className: "text-[11px] font-bold text-muted-foreground",
																				children: "Google Maps URL / Coordinates / Address"
																			}),
																			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
																				placeholder: "Paste Google Maps URL (e.g. https://maps.app.goo.gl/...), raw lat/long coordinates (e.g. 12.9716,77.5946), or address...",
																				value: manualLocationInput,
																				onChange: (e) => setManualLocationInput(e.target.value),
																				className: "text-[12px] min-h-[70px] bg-background border-border/70"
																			}),
																			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
																				type: "button",
																				className: "w-full h-8.5 text-[11.5px] font-bold",
																				onClick: () => {
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
																						timestamp: (/* @__PURE__ */ new Date()).toLocaleString()
																					});
																					setManualLocationInput("");
																					setIsLocationDialogOpen(false);
																					toast.success("Manual location tagged successfully!");
																				},
																				children: "Tag Manual Location"
																			})
																		]
																	})
																]
															})]
														})]
													})]
												})]
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[11px] text-muted-foreground",
										children: "These verification methods add a layer of security to the rental agreement. At least one method is recommended."
									})
								]
							})
						]
					}),
					(() => {
						const totalDepositVal = selectedEquipments.reduce((sum, item) => sum + (Number(item.deposit) || 0), 0);
						const totalMonthlyRentVal = selectedEquipments.reduce((sum, item) => sum + (Number(item.monthlyRent) || 0), 0);
						const totalDays = durationDetails?.totalDays || 30;
						const isOngoing = !endDate;
						const totalRentVal = selectedEquipments.reduce((sum, item) => {
							if (item.rentCycle === "Monthly") return sum + (Number(item.monthlyRent) || 0);
							else if (isOngoing) return sum + (Number(item.dailyRent) || 0);
							else return sum + totalDays * (Number(item.dailyRent) || 0);
						}, 0);
						const totalSerialsVal = selectedEquipments.map((item) => item.serial || "XXXX").join(", ");
						const totalNamesVal = selectedEquipments.map((item) => equipmentList.find((e) => e.id === item.equipmentId)?.name || "Unknown").join(", ");
						const rentToAdd = Number(rentPaidAmount) || 0;
						const depositToAdd = depositPaymentStatus === "Paid" ? totalDepositVal : depositPaymentStatus === "Partial" ? Number(depositPaidAmount) || 0 : 0;
						const selectedAdditionalItems = additionalItems.filter((i) => i.selected);
						const additionalItemsTotal = selectedAdditionalItems.reduce((sum, i) => sum + (i.status === "Free of Cost" ? 0 : i.amount), 0);
						const additionalItemsCollectedTotal = selectedAdditionalItems.reduce((sum, i) => sum + (i.status === "Paid" ? i.amount : 0), 0);
						const totalCharges = totalRentVal + totalDepositVal + additionalItemsTotal;
						const totalUpfrontPaid = rentToAdd + depositToAdd + additionalItemsCollectedTotal;
						const cashAmt = Number(cashPaidAmount) || 0;
						const bankAmt = Number(bankUpiPaidAmount) || 0;
						const splitTotal = cashAmt + bankAmt;
						const splitMismatch = paymentMode === "Cash+Bank" && splitTotal !== totalUpfrontPaid && splitTotal > 0;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-xl border border-border/60 bg-muted/10 overflow-hidden",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "px-4 py-2.5 border-b border-border/50 bg-muted/20",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[11px] font-bold uppercase tracking-wider text-muted-foreground",
											children: "Total Upfront Charges — Itemized Breakdown"
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("table", {
										className: "w-full text-[13px]",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", {
											className: "divide-y divide-border/40",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
													className: "px-4 py-2 text-muted-foreground",
													children: [
														"Rent (",
														rentalPaymentStatus,
														")"
													]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
													className: "px-4 py-2 text-right font-semibold text-foreground",
													children: ["₹", totalRentVal.toLocaleString("en-IN")]
												})] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
													className: "px-4 py-2 text-muted-foreground",
													children: [
														"Security Deposit (",
														depositPaymentStatus,
														")"
													]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
													className: "px-4 py-2 text-right font-semibold text-foreground",
													children: ["₹", totalDepositVal.toLocaleString("en-IN")]
												})] }),
												selectedAdditionalItems.map((item, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
													className: "px-4 py-2 text-muted-foreground",
													children: [
														item.name,
														" ",
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: `ml-1 text-[10px] px-1.5 py-0.5 rounded font-semibold ${item.status === "Paid" ? "bg-success/10 text-success" : item.status === "Free of Cost" ? "bg-primary/10 text-primary" : "bg-warning/10 text-warning-foreground"}`,
															children: item.status
														})
													]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
													className: "px-4 py-2 text-right font-semibold text-foreground",
													children: item.status === "Free of Cost" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "text-primary",
														children: "Free"
													}) : `₹${item.amount.toLocaleString("en-IN")}`
												})] }, i)),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
													className: "bg-muted/5",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
														className: "px-4 py-2 text-muted-foreground font-semibold",
														children: "Total Upfront Charges"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
														className: "px-4 py-2 text-right font-bold text-foreground",
														children: ["₹", totalCharges.toLocaleString("en-IN")]
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
													className: "bg-muted/30 font-bold",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
														className: "px-4 py-2.5 text-foreground font-bold",
														children: "Total Collected"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
														className: "px-4 py-2.5 text-right text-primary font-display text-[15px]",
														children: ["₹", totalUpfrontPaid.toLocaleString("en-IN")]
													})]
												})
											]
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "px-4 py-2 border-t border-border/50 text-[11px] text-muted-foreground flex flex-wrap gap-x-4 gap-y-1",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: ["Mode: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
												className: "text-foreground",
												children: String(paymentMode)
											})] }),
											paymentMode === "Cash+Bank" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: ["Cash: ", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", {
												className: "text-success",
												children: ["₹", cashAmt.toLocaleString("en-IN")]
											})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: ["Bank/UPI: ", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", {
												className: "text-primary",
												children: ["₹", bankAmt.toLocaleString("en-IN")]
											})] })] }),
											paymentCollectedBy && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: ["Collected by: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
												className: "text-foreground",
												children: String(paymentCollectedBy)
											})] })
										]
									}),
									splitMismatch && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "px-4 py-2 bg-destructive/10 text-destructive text-[11.5px] font-semibold border-t border-destructive/20 flex items-center gap-1",
										children: [
											"⚠️ Total cash + bank payments (₹",
											splitTotal.toLocaleString("en-IN"),
											") does not match total upfront charges (₹",
											totalUpfrontPaid.toLocaleString("en-IN"),
											")."
										]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-4 sm:grid-cols-2 items-end rounded-xl border border-border/60 bg-muted/10 p-4 mt-4 animate-in fade-in duration-200",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-1.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											className: "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
											children: "Rent Payment Option"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
											value: rentalPaymentStatus,
											onValueChange: handleRentalPaymentStatusChange,
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
												className: "bg-background h-10 text-[12.5px] border-border/50",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Select Option" })
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "Paid",
													children: "Paid"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "Not Paid",
													children: "Not Paid"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "Partial",
													children: "Partial"
												})
											] })]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-1.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											className: "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
											children: "Deposit Payment Option"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
											value: depositPaymentStatus,
											onValueChange: handleDepositPaymentStatusChange,
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
												className: "bg-background h-10 text-[12.5px] border-border/50",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Select Option" })
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "Paid",
													children: "Paid"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "Not Paid",
													children: "Not Paid"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "Partial",
													children: "Partial"
												})
											] })]
										})]
									}),
									rentalPaymentStatus === "Partial" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											className: "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
											children: "Rent Paid Amount (₹)"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											type: "number",
											placeholder: "Enter amount",
											value: rentPaidAmount,
											onChange: (e) => handleRentPaidAmountChange(e.target.value),
											className: "bg-background h-10"
										})]
									}),
									depositPaymentStatus === "Partial" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											className: "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
											children: "Deposit Paid Amount (₹)"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											type: "number",
											placeholder: "Enter amount",
											value: depositPaidAmount,
											onChange: (e) => handleDepositPaidAmountChange(e.target.value),
											className: "bg-background h-10"
										})]
									}),
									(rentalPaymentStatus === "Paid" || rentalPaymentStatus === "Partial" || Number(rentPaidAmount) > 0 || depositPaymentStatus === "Paid" || depositPaymentStatus === "Partial" || Number(depositPaidAmount) > 0) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-1.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												className: "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
												children: "Payment Mode"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
												value: paymentMode,
												onValueChange: (val) => setPaymentMode(val),
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
													className: "bg-background h-10 text-[12.5px] border-border/50",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Select Mode" })
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
														value: "Cash",
														children: "Cash"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
														value: "Bank",
														children: "Bank"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
														value: "Cash+Bank",
														children: "Cash+Bank"
													})
												] })]
											})]
										}),
										paymentMode === "Cash+Bank" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												className: "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
												children: "Cash Paid Amount (₹)"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												type: "number",
												placeholder: "Cash amount",
												value: cashPaidAmount,
												onChange: (e) => setCashPaidAmount(e.target.value),
												className: "bg-background h-10"
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												className: "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
												children: "Bank/UPI Paid Amount (₹)"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												type: "number",
												placeholder: "Bank/UPI amount",
												value: bankUpiPaidAmount,
												onChange: (e) => setBankUpiPaidAmount(e.target.value),
												className: "bg-background h-10"
											})]
										})] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-1.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												className: "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
												children: "Payment Date"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												type: "date",
												value: paymentDate,
												onChange: (e) => setPaymentDate(e.target.value),
												className: "bg-background h-10"
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-1.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												className: "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
												children: "Payment Collected By"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												placeholder: "Collector Name",
												value: paymentCollectedBy,
												onChange: (e) => setPaymentCollectedBy(e.target.value),
												className: "bg-background h-10"
											})]
										})
									] })
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
								className: "flex-wrap gap-2 mt-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AgreementPreviewDialog, {
										rental: rental ? {
											...rental,
											id: agreementId,
											customer: isNewCustomer ? custName : selectedCustomer?.name || "",
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
											cashPaidAmount: paymentMode === "Cash" ? totalUpfrontPaid : paymentMode === "Bank" ? 0 : Number(cashPaidAmount) || 0,
											bankUpiPaidAmount: paymentMode === "Bank" ? totalUpfrontPaid : paymentMode === "Cash" ? 0 : Number(bankUpiPaidAmount) || 0,
											additionalItems,
											rentalDuration: durationDetails.text,
											totalRent: durationDetails.totalRent,
											totalInitialCharges: totalUpfrontPaid,
											removalCharges: Number(removalCharges) || 0,
											equipmentItems: selectedEquipments.map((item) => {
												const oldItem = rental?.equipmentItems?.find((oi) => oi.equipmentId === item.equipmentId);
												return {
													equipmentId: item.equipmentId,
													name: equipmentList.find((e) => e.id === item.equipmentId)?.name || "Unknown",
													serial: item.serial || "XXXX",
													monthlyRent: Number(item.monthlyRent) || 0,
													dailyRent: Number(item.dailyRent) || 0,
													deposit: Number(item.deposit) || 0,
													returned: oldItem ? !!oldItem.returned : false
												};
											})
										} : {
											id: agreementId,
											customer: isNewCustomer ? custName : selectedCustomer?.name || "",
											equipment: totalNamesVal,
											serial: totalSerialsVal,
											deposit: totalDepositVal,
											monthlyRent: totalMonthlyRentVal,
											customerId: "",
											equipmentId: selectedEquipments.map((item) => item.equipmentId).join(", "),
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
											cashPaidAmount: paymentMode === "Cash" ? totalUpfrontPaid : paymentMode === "Bank" ? 0 : Number(cashPaidAmount) || 0,
											bankUpiPaidAmount: paymentMode === "Bank" ? totalUpfrontPaid : paymentMode === "Cash" ? 0 : Number(bankUpiPaidAmount) || 0,
											additionalItems,
											rentalDuration: durationDetails.text,
											totalRent: durationDetails.totalRent,
											totalInitialCharges: totalUpfrontPaid,
											equipmentItems: selectedEquipments.map((item) => ({
												equipmentId: item.equipmentId,
												name: equipmentList.find((e) => e.id === item.equipmentId)?.name || "Unknown",
												serial: item.serial || "XXXX",
												monthlyRent: Number(item.monthlyRent) || 0,
												dailyRent: Number(item.dailyRent) || 0,
												deposit: Number(item.deposit) || 0,
												returned: false
											}))
										},
										signatureUrl,
										thumbprintUrl,
										trigger: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											variant: "outline",
											type: "button",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "mr-1.5 h-3.5 w-3.5" }), "Preview Agreement"]
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										variant: "outline",
										type: "button",
										onClick: () => toast.success(`Agreement emailed successfully to customer.`),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mail, { className: "mr-1.5 h-3.5 w-3.5" }), "Email Agreement"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogClose, {
										asChild: true,
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											variant: "outline",
											type: "button",
											children: "Cancel"
										})
									}),
									!isStaff && rental && rental.status === "Pending Approval" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										type: "button",
										className: "bg-emerald-600 hover:bg-emerald-700 text-white",
										onClick: () => {
											approveRental(rental.id);
											toast.success(`Agreement ${rental.id} approved successfully!`);
											setOpen(false);
											if (onSave) onSave();
										},
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "mr-1.5 h-3.5 w-3.5" }), "Approve Agreement"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										type: "button",
										onClick: handleSave,
										disabled: isSubmitting,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "mr-1.5 h-3.5 w-3.5" }), "Save Agreement"]
									})
								]
							})
						] });
					})()
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QrScannerModal, {
				isOpen: isScannerOpen,
				onOpenChange: (open) => {
					setIsScannerOpen(open);
					if (!open) setScannerTargetIdx(null);
				},
				inlineMode: true,
				onScanSuccess: handleQrScanSuccess,
				title: "Scan Equipment Barcode / QR Code"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QrScannerModal, {
				isOpen: isBulkScannerOpen,
				onOpenChange: setIsBulkScannerOpen,
				bulkMode: true,
				onScanSuccess: handleBulkScanSuccess,
				title: "Bulk Scan Equipment Serials"
			})
		]
	});
}
function CancelRentalDialog({ rental, trigger, onCancel }) {
	const [reason, setReason] = (0, import_react.useState)("");
	const handleCancel = () => {
		cancelRental(rental.id);
		toast.success(`Agreement ${rental.id} has been cancelled.`);
		if (onCancel) onCancel();
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
		asChild: true,
		children: trigger
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
		className: "max-w-md",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, {
				className: "text-destructive flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleX, { className: "h-4 w-4" }), " Cancel Agreement"]
			}) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "py-2 space-y-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-[13px] text-muted-foreground",
						children: [
							"Cancel agreement ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
								className: "text-foreground font-mono",
								children: rental.id
							}),
							" for ",
							rental.customer,
							"?"
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "rounded-lg border border-destructive/18 bg-destructive/5 p-3 text-[12px] text-destructive",
						children: "⚠️ Cancelling will mark the equipment as Available and freeze billing. Security deposit refund must be processed separately."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							className: "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
							children: "Cancellation Reason"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
							placeholder: "Reason for cancellation...",
							className: "resize-none min-h-[70px]",
							value: reason,
							onChange: (e) => setReason(e.target.value)
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogClose, {
				asChild: true,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "outline",
					type: "button",
					children: "Keep Active"
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogClose, {
				asChild: true,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "destructive",
					type: "button",
					onClick: handleCancel,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleX, { className: "mr-1.5 h-3.5 w-3.5" }), "Cancel Agreement"]
				})
			})] })
		]
	})] });
}
function LiveWebcam({ onCapture }) {
	const videoRef = (0, import_react.useRef)(null);
	const [stream, setStream] = (0, import_react.useState)(null);
	const [error, setError] = (0, import_react.useState)(null);
	const [devices, setDevices] = (0, import_react.useState)([]);
	const [selectedDeviceId, setSelectedDeviceId] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => {
		let activeStream = null;
		async function startCamera() {
			try {
				const constraints = { video: selectedDeviceId ? { deviceId: { exact: selectedDeviceId } } : { facingMode: "environment" } };
				const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
				activeStream = mediaStream;
				setStream(mediaStream);
				if (videoRef.current) videoRef.current.srcObject = mediaStream;
				const videoDevices = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === "videoinput");
				setDevices(videoDevices);
				if (videoDevices.length > 0 && !selectedDeviceId) setSelectedDeviceId(videoDevices[0].deviceId);
			} catch (err) {
				console.error("Webcam access error:", err);
				setError(err.message || "Could not access camera. Please check permissions.");
			}
		}
		startCamera();
		return () => {
			if (activeStream) activeStream.getTracks().forEach((track) => track.stop());
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
				onCapture(canvas.toDataURL("image/jpeg"));
			}
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col items-center w-full space-y-3",
		children: [error ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col items-center p-4 border border-destructive/20 bg-destructive/5 rounded-xl text-center w-full",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "h-6 w-6 text-destructive mb-2" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[12px] font-semibold text-destructive",
					children: error
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[10px] text-muted-foreground mt-1",
					children: "Please use the Upload option or verify camera permission in your browser."
				})
			]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative overflow-hidden rounded-xl bg-black aspect-video w-full border border-border flex items-center justify-center",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
				ref: videoRef,
				autoPlay: true,
				playsInline: true,
				className: "w-full h-full object-cover"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute bottom-3 left-0 right-0 flex justify-center gap-2 px-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					type: "button",
					size: "sm",
					className: "bg-primary hover:bg-primary/90 h-8 text-[11px] font-bold",
					onClick: capture,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, { className: "h-3.5 w-3.5 mr-1" }), " Capture Photo"]
				})
			})]
		}), devices.length > 1 && !error && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between w-full text-[11px]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-muted-foreground",
				children: "Switch Camera:"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
				className: "h-7 border border-border/60 rounded px-1.5 bg-background text-[11px] max-w-[150px]",
				value: selectedDeviceId,
				onChange: (e) => setSelectedDeviceId(e.target.value),
				children: devices.map((device, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
					value: device.deviceId,
					children: device.label || `Camera ${idx + 1}`
				}, device.deviceId))
			})]
		})]
	});
}
function SignaturePadDialog({ trigger, onSave }) {
	const [isOpen, setIsOpen] = (0, import_react.useState)(false);
	const [activeTab, setActiveTab] = (0, import_react.useState)("draw");
	const canvasRef = (0, import_react.useRef)(null);
	const [isDrawing, setIsDrawing] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (isOpen && activeTab === "draw" && canvasRef.current) {
			const ctx = canvasRef.current.getContext("2d");
			if (ctx) {
				ctx.strokeStyle = "#020817";
				ctx.lineWidth = 3;
				ctx.lineCap = "round";
				ctx.lineJoin = "round";
			}
		}
	}, [isOpen, activeTab]);
	const startDrawing = (e) => {
		setIsDrawing(true);
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		const rect = canvas.getBoundingClientRect();
		const scaleX = canvas.width / rect.width;
		const scaleY = canvas.height / rect.height;
		let clientX, clientY;
		if ("touches" in e) {
			clientX = e.touches[0].clientX;
			clientY = e.touches[0].clientY;
		} else {
			clientX = e.clientX;
			clientY = e.clientY;
		}
		ctx.beginPath();
		ctx.moveTo((clientX - rect.left) * scaleX, (clientY - rect.top) * scaleY);
	};
	const draw = (e) => {
		if (!isDrawing) return;
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		const rect = canvas.getBoundingClientRect();
		const scaleX = canvas.width / rect.width;
		const scaleY = canvas.height / rect.height;
		let clientX, clientY;
		if ("touches" in e) {
			clientX = e.touches[0].clientX;
			clientY = e.touches[0].clientY;
		} else {
			clientX = e.clientX;
			clientY = e.clientY;
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
		const ctx = canvas.getContext("2d");
		if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
	};
	const saveSignature = () => {
		const canvas = canvasRef.current;
		if (canvas) {
			onSave(canvas.toDataURL("image/png"));
			setIsOpen(false);
		}
	};
	const handleFileUpload = (e) => {
		if (e.target.files && e.target.files[0]) {
			const file = e.target.files[0];
			const reader = new FileReader();
			reader.onloadend = () => {
				onSave(reader.result);
				setIsOpen(false);
			};
			reader.readAsDataURL(file);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, {
		open: isOpen,
		onOpenChange: setIsOpen,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
			asChild: true,
			children: trigger
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "sm:max-w-md",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Digital Signature" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "py-2",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
					value: activeTab,
					onValueChange: setActiveTab,
					className: "w-full",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, {
							className: "grid w-full grid-cols-3 mb-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
									value: "draw",
									children: "Draw"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
									value: "camera",
									children: "Take Photo"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
									value: "upload",
									children: "Upload"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
							value: "draw",
							className: "space-y-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[12px] text-muted-foreground mb-2",
									children: "Please sign below using your mouse, finger, or stylus."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "border-2 border-dashed border-border/60 rounded-xl overflow-hidden bg-white shadow-inner",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
										ref: canvasRef,
										width: 420,
										height: 200,
										className: "w-full h-[200px] touch-none cursor-crosshair",
										onMouseDown: startDrawing,
										onMouseMove: draw,
										onMouseUp: stopDrawing,
										onMouseOut: stopDrawing,
										onTouchStart: startDrawing,
										onTouchMove: draw,
										onTouchEnd: stopDrawing
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
									className: "flex justify-between w-full sm:justify-between items-center mt-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "outline",
										size: "sm",
										onClick: clearCanvas,
										children: "Clear"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											variant: "outline",
											size: "sm",
											onClick: () => setIsOpen(false),
											children: "Cancel"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											size: "sm",
											onClick: saveSignature,
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PenTool, { className: "h-3.5 w-3.5 mr-1.5" }), "Save Signature"]
										})]
									})]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
							value: "camera",
							className: "flex flex-col items-center justify-center py-4 space-y-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[12px] text-muted-foreground text-center",
									children: "Capture a photo of a physical signature using your live webcam or your device's camera."
								}),
								isOpen && activeTab === "camera" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LiveWebcam, { onCapture: (url) => {
									onSave(url);
									setIsOpen(false);
								} }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "relative border-2 border-dashed border-border/80 rounded-xl p-4 text-center bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer w-full flex flex-col items-center justify-center h-16",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, { className: "h-4 w-4 text-muted-foreground/60 mb-0.5" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[11px] font-medium text-foreground leading-none",
											children: "Use Native Camera"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[8px] text-muted-foreground",
											children: "Standard native camera capture"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "file",
											className: "absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50",
											accept: "image/*",
											capture: "environment",
											onChange: handleFileUpload
										})
									]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
							value: "upload",
							className: "flex flex-col items-center justify-center py-4 space-y-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[12px] text-muted-foreground text-center",
								children: "Upload an image file of the signature from your device."
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative border-2 border-dashed border-border/80 rounded-xl p-6 text-center bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer w-full flex flex-col items-center justify-center",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileUp, { className: "h-8 w-8 text-muted-foreground/60 mb-2" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[12px] font-medium text-foreground",
										children: "Choose Image File"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[10px] text-muted-foreground mt-1",
										children: "Supports PNG, JPG, JPEG"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "file",
										className: "absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50",
										accept: "image/*",
										onChange: handleFileUpload
									})
								]
							})]
						})
					]
				})
			})]
		})]
	});
}
function ThumbprintCaptureDialog({ trigger, onSave }) {
	const [isOpen, setIsOpen] = (0, import_react.useState)(false);
	const [activeTab, setActiveTab] = (0, import_react.useState)("sensor");
	const [scanProgress, setScanProgress] = (0, import_react.useState)(0);
	const [isScanning, setIsScanning] = (0, import_react.useState)(false);
	const scanIntervalRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		return () => {
			if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
		};
	}, []);
	const startScanning = (e) => {
		e.preventDefault();
		setIsScanning(true);
		setScanProgress(0);
		if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
		scanIntervalRef.current = window.setInterval(() => {
			setScanProgress((prev) => {
				if (prev >= 100) {
					if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
					setIsScanning(false);
					onSave(`data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%230284c7" stroke-width="1.2" stroke-linecap="round"><path d="M12 22a7 7 0 0 0 7-7c0-4.3-3-7-7-7s-7 2.7-7 7a7 7 0 0 0 7 7z"/><path d="M12 2a10 10 0 0 1 10 10c0 5.5-4.5 10-10 10S2 17.5 2 12A10 10 0 0 1 12 2z"/><path d="M8 12a4 4 0 0 1 8 0c0 2.2-1.8 4-4 4s-4-1.8-4-4z"/><path d="M10 12a2 2 0 0 1 4 0"/></svg>`);
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
	const handleFileUpload = (e) => {
		if (e.target.files && e.target.files[0]) {
			const file = e.target.files[0];
			const reader = new FileReader();
			reader.onloadend = () => {
				onSave(reader.result);
				setIsOpen(false);
			};
			reader.readAsDataURL(file);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, {
		open: isOpen,
		onOpenChange: setIsOpen,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
			asChild: true,
			children: trigger
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "sm:max-w-md",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Biometric Thumbprint Scan" }) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "py-4 flex flex-col items-center",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
						value: activeTab,
						onValueChange: setActiveTab,
						className: "w-full",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, {
								className: "grid w-full grid-cols-3 mb-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
										value: "sensor",
										children: "Touch Screen"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
										value: "camera",
										children: "Take Photo"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
										value: "upload",
										children: "Upload"
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
								value: "sensor",
								className: "flex flex-col items-center justify-center py-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[12px] text-muted-foreground text-center mb-6",
										children: "Press and hold your thumb on the scanner icon below to simulate a fingerprint verification."
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: `relative h-28 w-28 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all ${isScanning ? "border-primary bg-primary/5 scale-105 shadow-[0_0_15px_rgba(37,99,235,0.2)]" : "border-border/80 bg-muted/10 hover:bg-muted/20"}`,
										onMouseDown: startScanning,
										onMouseUp: stopScanning,
										onMouseLeave: stopScanning,
										onTouchStart: startScanning,
										onTouchEnd: stopScanning,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FingerprintPattern, { className: `h-16 w-16 transition-colors ${isScanning ? "text-primary animate-pulse" : "text-muted-foreground/60"}` }), isScanning && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute left-4 right-4 h-0.5 bg-primary shadow-[0_0_8px_#2563eb] animate-[bounce_1.5s_infinite]" })]
									}),
									isScanning && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "w-48 mt-6 space-y-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex justify-between text-[10px] text-muted-foreground font-mono",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Scanning..." }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [scanProgress, "%"] })]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "h-1.5 w-full bg-muted rounded-full overflow-hidden",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "h-full bg-primary transition-all duration-150",
												style: { width: `${scanProgress}%` }
											})
										})]
									}),
									!isScanning && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[11px] text-muted-foreground font-medium mt-4",
										children: "Press and hold to scan"
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
								value: "camera",
								className: "flex flex-col items-center justify-center py-4 space-y-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[12px] text-muted-foreground text-center",
										children: "Use your webcam or device's camera to take a photo of the customer's thumbprint."
									}),
									isOpen && activeTab === "camera" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LiveWebcam, { onCapture: (url) => {
										onSave(url);
										setIsOpen(false);
									} }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "relative border-2 border-dashed border-border/80 rounded-xl p-4 text-center bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer w-full flex flex-col items-center justify-center h-16",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, { className: "h-4 w-4 text-muted-foreground/60 mb-0.5" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-[11px] font-medium text-foreground leading-none",
												children: "Use Native Camera"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-[8px] text-muted-foreground",
												children: "Standard native camera capture"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												type: "file",
												className: "absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50",
												accept: "image/*",
												capture: "environment",
												onChange: handleFileUpload
											})
										]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
								value: "upload",
								className: "flex flex-col items-center justify-center py-6",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[12px] text-muted-foreground text-center mb-4",
									children: "Upload a scanned fingerprint image file from your computer or device."
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "relative border-2 border-dashed border-border/80 rounded-xl p-6 text-center bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer w-full flex flex-col items-center justify-center",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileUp, { className: "h-8 w-8 text-muted-foreground/60 mb-2" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[12px] font-medium text-foreground",
											children: "Choose Image File"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[10px] text-muted-foreground mt-1",
											children: "Supports PNG, JPG, JPEG"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "file",
											className: "absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50",
											accept: "image/*",
											onChange: handleFileUpload
										})
									]
								})]
							})
						]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogFooter, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "outline",
					size: "sm",
					onClick: () => setIsOpen(false),
					children: "Cancel"
				}) })
			]
		})]
	});
}
function DeliveryPhotoCaptureDialog({ trigger, initialPhotos = [], onSave }) {
	const [isOpen, setIsOpen] = (0, import_react.useState)(false);
	const [activeTab, setActiveTab] = (0, import_react.useState)("camera");
	const [photos, setPhotos] = (0, import_react.useState)([]);
	(0, import_react.useEffect)(() => {
		if (isOpen) setPhotos(initialPhotos || []);
	}, [isOpen, initialPhotos]);
	const handleFileUpload = (e) => {
		if (e.target.files && e.target.files.length > 0) Array.from(e.target.files).forEach((file) => {
			const sizeKB = (file.size / 1024).toFixed(1);
			const reader = new FileReader();
			reader.onloadend = () => {
				setPhotos((prev) => [...prev, {
					url: reader.result,
					name: file.name,
					size: `${sizeKB} KB`
				}]);
			};
			reader.readAsDataURL(file);
		});
	};
	const handleCameraCapture = (url) => {
		const photoName = `Delivery_Photo_${photos.length + 1}.jpg`;
		const sizeKB = (url.length / 1024 * .75).toFixed(1);
		setPhotos((prev) => [...prev, {
			url,
			name: photoName,
			size: `${sizeKB} KB`
		}]);
		toast.success("Delivery photo captured!");
	};
	const removePhoto = (index) => {
		setPhotos((prev) => prev.filter((_, i) => i !== index));
	};
	const handleConfirmSave = () => {
		onSave(photos);
		setIsOpen(false);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, {
		open: isOpen,
		onOpenChange: setIsOpen,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
			asChild: true,
			children: trigger
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "sm:max-w-lg",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Delivery Photos & Documents" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "py-2 space-y-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
						value: activeTab,
						onValueChange: setActiveTab,
						className: "w-full",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, {
								className: "grid w-full grid-cols-2 mb-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
									value: "camera",
									children: "Take Photo"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
									value: "upload",
									children: "Upload File"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
								value: "camera",
								className: "flex flex-col items-center justify-center py-2 space-y-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[12px] text-muted-foreground text-center",
										children: "Use webcam or device camera to take photos of delivery."
									}),
									isOpen && activeTab === "camera" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LiveWebcam, { onCapture: handleCameraCapture }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "relative border-2 border-dashed border-border/80 rounded-xl p-3 text-center bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer w-full flex flex-col items-center justify-center h-14",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, { className: "h-4 w-4 text-muted-foreground/60 mb-0.5" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-[11px] font-medium text-foreground leading-none",
												children: "Native Camera Photo"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												type: "file",
												className: "absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50",
												accept: "image/*",
												capture: "environment",
												onChange: handleFileUpload
											})
										]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
								value: "upload",
								className: "flex flex-col items-center justify-center py-2 space-y-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[12px] text-muted-foreground text-center",
									children: "Upload delivery photos or delivery slip PDFs from your device."
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "relative border-2 border-dashed border-border/80 rounded-xl p-5 text-center bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer w-full flex flex-col items-center justify-center",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileUp, { className: "h-7 w-7 text-muted-foreground/60 mb-1" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[12px] font-medium text-foreground",
											children: "Choose Image / PDF Files"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[10px] text-muted-foreground mt-0.5",
											children: "Supports PNG, JPG, JPEG, PDF (Multiple allowed)"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "file",
											multiple: true,
											className: "absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50",
											accept: ".pdf,.jpg,.jpeg,.png,application/pdf,image/*",
											onChange: handleFileUpload
										})
									]
								})]
							})
						]
					}),
					photos.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-2 border-t border-border/50 pt-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
							children: [
								"Selected Photos / Files (",
								photos.length,
								")"
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto p-1 bg-muted/10 rounded-lg border border-border/40",
							children: photos.map((item, idx) => {
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between gap-2 p-1.5 border border-border/60 rounded-md bg-background shadow-xs",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2 min-w-0 flex-1",
										children: [item.url.startsWith("data:image/") || /\.(jpg|jpeg|png|webp)$/i.test(item.name) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
											src: item.url,
											alt: "Preview",
											className: "h-8 w-8 rounded object-cover border shrink-0"
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "h-8 w-8 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "h-4 w-4" })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "min-w-0 flex-1",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[11px] font-medium truncate text-foreground leading-tight",
												title: item.name,
												children: item.name
											}), item.size && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[9px] text-muted-foreground",
												children: item.size
											})]
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										type: "button",
										variant: "ghost",
										size: "icon",
										className: "h-5 w-5 text-muted-foreground hover:text-destructive shrink-0",
										onClick: () => removePhoto(idx),
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-3 w-3" })
									})]
								}, idx);
							})
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex justify-end gap-2 border-t border-border/40 pt-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							size: "sm",
							type: "button",
							onClick: () => setIsOpen(false),
							children: "Cancel"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							size: "sm",
							type: "button",
							onClick: handleConfirmSave,
							children: [
								"Save ",
								photos.length,
								" File",
								photos.length === 1 ? "" : "s"
							]
						})]
					})
				]
			})]
		})]
	});
}
function SignedDocumentCaptureDialog({ trigger, onSave }) {
	const [isOpen, setIsOpen] = (0, import_react.useState)(false);
	const [activeTab, setActiveTab] = (0, import_react.useState)("upload");
	const handleFileUpload = (e) => {
		if (e.target.files && e.target.files[0]) {
			const file = e.target.files[0];
			const reader = new FileReader();
			reader.onloadend = () => {
				onSave(reader.result, file.name);
				setIsOpen(false);
			};
			reader.readAsDataURL(file);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, {
		open: isOpen,
		onOpenChange: setIsOpen,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
			asChild: true,
			children: trigger
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "sm:max-w-md",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Signed Document" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "py-2",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
					value: activeTab,
					onValueChange: setActiveTab,
					className: "w-full",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, {
							className: "grid w-full grid-cols-2 mb-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
								value: "camera",
								children: "Take Photo"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
								value: "upload",
								children: "Upload File"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
							value: "camera",
							className: "flex flex-col items-center justify-center py-4 space-y-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[12px] text-muted-foreground text-center",
									children: "Use your webcam or native device camera to photograph the signed agreement document."
								}),
								isOpen && activeTab === "camera" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LiveWebcam, { onCapture: (url) => {
									onSave(url, "Signed_Agreement_Photo.jpg");
									setIsOpen(false);
								} }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "relative border-2 border-dashed border-border/80 rounded-xl p-4 text-center bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer w-full flex flex-col items-center justify-center h-16",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, { className: "h-4 w-4 text-muted-foreground/60 mb-0.5" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[11px] font-medium text-foreground leading-none",
											children: "Use Native Camera"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[8px] text-muted-foreground",
											children: "Standard native camera capture"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "file",
											className: "absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50",
											accept: "image/*",
											capture: "environment",
											onChange: handleFileUpload
										})
									]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
							value: "upload",
							className: "flex flex-col items-center justify-center py-4 space-y-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[12px] text-muted-foreground text-center",
								children: "Upload a scanned PDF or photo of the signed agreement."
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative border-2 border-dashed border-border/80 rounded-xl p-6 text-center bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer w-full flex flex-col items-center justify-center",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileUp, { className: "h-8 w-8 text-muted-foreground/60 mb-2" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[12px] font-medium text-foreground",
										children: "Choose PDF or Image File"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[10px] text-muted-foreground mt-1",
										children: "Supports PDF, PNG, JPG, JPEG"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "file",
										className: "absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50",
										accept: ".pdf,image/*",
										onChange: handleFileUpload
									})
								]
							})]
						})
					]
				})
			})]
		})]
	});
}
function CustomerIDProofDialog({ trigger, initialFiles = [], onSave }) {
	const [isOpen, setIsOpen] = (0, import_react.useState)(false);
	const [activeTab, setActiveTab] = (0, import_react.useState)("upload");
	const [files, setFiles] = (0, import_react.useState)([]);
	(0, import_react.useEffect)(() => {
		if (isOpen) setFiles(initialFiles || []);
	}, [isOpen, initialFiles]);
	const handleFileUpload = (e) => {
		if (e.target.files && e.target.files.length > 0) Array.from(e.target.files).forEach((file) => {
			const sizeKB = (file.size / 1024).toFixed(1);
			const reader = new FileReader();
			reader.onloadend = () => {
				setFiles((prev) => [...prev, {
					fileData: reader.result,
					name: file.name,
					size: `${sizeKB} KB`
				}]);
			};
			reader.readAsDataURL(file);
		});
	};
	const handleCameraCapture = (url) => {
		const fileName = `KYC_ID_Photo_${files.length + 1}.jpg`;
		const sizeKB = (url.length / 1024 * .75).toFixed(1);
		setFiles((prev) => [...prev, {
			fileData: url,
			name: fileName,
			size: `${sizeKB} KB`
		}]);
		toast.success("ID Photo captured!");
	};
	const removeFile = (index) => {
		setFiles((prev) => prev.filter((_, i) => i !== index));
	};
	const handleConfirmSave = () => {
		onSave(files);
		setIsOpen(false);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, {
		open: isOpen,
		onOpenChange: setIsOpen,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
			asChild: true,
			children: trigger
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "sm:max-w-lg",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Upload KYC ID Proofs" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "py-2 space-y-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
						value: activeTab,
						onValueChange: setActiveTab,
						className: "w-full",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, {
								className: "grid w-full grid-cols-2 mb-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
									value: "camera",
									children: "Take Photo"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
									value: "upload",
									children: "Upload File"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
								value: "camera",
								className: "flex flex-col items-center justify-center py-2 space-y-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[12px] text-muted-foreground text-center",
										children: "Use webcam or device camera to photograph Aadhaar / PAN card."
									}),
									isOpen && activeTab === "camera" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LiveWebcam, { onCapture: handleCameraCapture }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "relative border-2 border-dashed border-border/80 rounded-xl p-3 text-center bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer w-full flex flex-col items-center justify-center h-14",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, { className: "h-4 w-4 text-muted-foreground/60 mb-0.5" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-[11px] font-medium text-foreground leading-none",
												children: "Native Camera Photo"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												type: "file",
												className: "absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50",
												accept: "image/*",
												capture: "environment",
												onChange: handleFileUpload
											})
										]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
								value: "upload",
								className: "flex flex-col items-center justify-center py-2 space-y-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[12px] text-muted-foreground text-center",
									children: "Upload scanned PDF or photo files of Aadhaar, PAN, or other ID cards."
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "relative border-2 border-dashed border-border/80 rounded-xl p-5 text-center bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer w-full flex flex-col items-center justify-center",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileUp, { className: "h-7 w-7 text-muted-foreground/60 mb-1" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[12px] font-medium text-foreground",
											children: "Choose PDF or Image Files"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[10px] text-muted-foreground mt-0.5",
											children: "Supports PDF, PNG, JPG, JPEG (Multiple allowed)"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "file",
											multiple: true,
											className: "absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50",
											accept: ".pdf,.jpg,.jpeg,.png,application/pdf,image/*",
											onChange: handleFileUpload
										})
									]
								})]
							})
						]
					}),
					files.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-2 border-t border-border/50 pt-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
							children: [
								"Selected ID Proofs (",
								files.length,
								")"
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto p-1 bg-muted/10 rounded-lg border border-border/40",
							children: files.map((item, idx) => {
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between gap-2 p-1.5 border border-border/60 rounded-md bg-background shadow-xs",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2 min-w-0 flex-1",
										children: [item.fileData?.startsWith("data:image/") || /\.(jpg|jpeg|png|webp)$/i.test(item.name) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
											src: item.fileData,
											alt: "Preview",
											className: "h-8 w-8 rounded object-cover border shrink-0"
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "h-8 w-8 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "h-4 w-4" })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "min-w-0 flex-1",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[11px] font-medium truncate text-foreground leading-tight",
												title: item.name,
												children: item.name
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[9px] text-muted-foreground",
												children: item.size
											})]
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										type: "button",
										variant: "ghost",
										size: "icon",
										className: "h-5 w-5 text-muted-foreground hover:text-destructive shrink-0",
										onClick: () => removeFile(idx),
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-3 w-3" })
									})]
								}, idx);
							})
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex justify-end gap-2 border-t border-border/40 pt-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							size: "sm",
							type: "button",
							onClick: () => setIsOpen(false),
							children: "Cancel"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							size: "sm",
							type: "button",
							onClick: handleConfirmSave,
							children: [
								"Save ",
								files.length,
								" File",
								files.length === 1 ? "" : "s"
							]
						})]
					})
				]
			})]
		})]
	});
}
function AgreementPreviewDialog({ rental, signatureUrl, thumbprintUrl, trigger }) {
	const convertNumberToWords = (amount) => {
		if (amount <= 0 || isNaN(amount)) return "N/A";
		const ones = [
			"",
			"One",
			"Two",
			"Three",
			"Four",
			"Five",
			"Six",
			"Seven",
			"Eight",
			"Nine",
			"Ten",
			"Eleven",
			"Twelve",
			"Thirteen",
			"Fourteen",
			"Fifteen",
			"Sixteen",
			"Seventeen",
			"Eighteen",
			"Nineteen"
		];
		const tens = [
			"",
			"",
			"Twenty",
			"Thirty",
			"Forty",
			"Fifty",
			"Sixty",
			"Seventy",
			"Eighty",
			"Ninety"
		];
		function convert(n) {
			if (n < 20) return ones[n];
			if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + ones[n % 10] : "");
			if (n < 1e3) return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " and " + convert(n % 100) : "");
			if (n < 1e5) return convert(Math.floor(n / 1e3)) + " Thousand" + (n % 1e3 !== 0 ? " " + convert(n % 1e3) : "");
			if (n < 1e7) return convert(Math.floor(n / 1e5)) + " Lakh" + (n % 1e5 !== 0 ? " " + convert(n % 1e5) : "");
			return convert(Math.floor(n / 1e7)) + " Crore" + (n % 1e7 !== 0 ? " " + convert(n % 1e7) : "");
		}
		return convert(amount) + " only";
	};
	const calculateDurationBetween = (startDateStr, endDateStr) => {
		const start = parseLocalDate(startDateStr);
		const end = parseLocalDate(endDateStr);
		if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return "0 days";
		const diffTime = end.getTime() - start.getTime();
		const totalDays = Math.ceil(diffTime / (1e3 * 60 * 60 * 24));
		let months = end.getFullYear() - start.getFullYear();
		months = months * 12 + (end.getMonth() - start.getMonth());
		let days = end.getDate() - start.getDate();
		if (days < 0) {
			months--;
			const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
			days += prevMonth.getDate();
		}
		if (months > 0 && days > 0) return `${months} month${months > 1 ? "s" : ""} and ${days} day${days > 1 ? "s" : ""}`;
		else if (months > 0) return `${months} month${months > 1 ? "s" : ""}`;
		else return `${totalDays} day${totalDays !== 1 ? "s" : ""}`;
	};
	const calculateRentForDuration = (startDateStr, endDateStr, monthlyRent, dailyRent) => {
		const start = parseLocalDate(startDateStr);
		const end = parseLocalDate(endDateStr);
		if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return 0;
		const diffTime = end.getTime() - start.getTime();
		const daysUsed = Math.ceil(diffTime / (1e3 * 60 * 60 * 24));
		if (rental?.equipmentItems && rental.equipmentItems.length > 0) return rental.equipmentItems.reduce((sum, item) => {
			if (!(cleanNum(item.monthlyRent) > 0)) return sum + daysUsed * cleanNum(item.dailyRent || item.rentRate);
			else return sum + getReturnCalculatedRentPerItem(item.monthlyRent, daysUsed, startDateStr, endDateStr);
		}, 0);
		if (!(monthlyRent > 0)) return daysUsed * dailyRent;
		return getReturnCalculatedRentPerItem(monthlyRent, daysUsed, startDateStr, endDateStr);
	};
	const customers = getCustomers();
	const customerObj = customers.find((c) => c.id === rental?.customerId);
	const customerName = rental?.customer || customerObj?.name || "Valued Customer";
	const customerAddress = customerObj?.address || "No address on file";
	const customerArea = customerObj?.area || "";
	const customerCity = customerObj?.city || "Mysore";
	const customerState = customerObj?.state || "Karnataka";
	const customerPincode = customerObj?.pincode || "";
	const customerPhone = customerObj?.phone || "N/A";
	const customerAltPhone = customerObj?.altPhone || "";
	const formattedStartDate = rental?.start ? formatDateDDMMYYYY(rental.start) : formatDateDDMMYYYY((/* @__PURE__ */ new Date()).toISOString());
	let finalEquipRows = null;
	if (rental?.equipmentItems && rental.equipmentItems.length > 0) {
		const eqList = getEquipment();
		finalEquipRows = rental.equipmentItems.map((item, idx) => {
			const eqObj = eqList.find((e) => e.id === item.equipmentId);
			const name = eqObj?.name || item.name || "Equipment";
			const model = eqObj?.model || "Standard";
			const serial = item.serial || eqObj?.serial || "XXXX";
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
				className: "border-b border-slate-800 text-[11.5px]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "p-1 px-2 border-r border-slate-800 font-bold",
						children: name
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: `p-1 px-2 border-r border-slate-800 text-center font-bold ${item.returned ? "text-red-600" : "text-emerald-600"}`,
						children: item.returned ? "NO (Returned)" : "YES"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "p-1 px-2 border-r border-slate-800",
						children: model
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "p-1 px-2 border-r border-slate-800 font-mono text-[11px]",
						children: serial
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { className: "p-1 px-2 border-r border-slate-800" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { className: "p-1 px-2" })
				]
			}, idx);
		});
	} else {
		const hiredEquipments = [
			{
				name: "Oxygen Concentrator",
				key: "oxygen"
			},
			{
				name: "Bipap",
				key: "bipap"
			},
			{
				name: "Auto Cpap",
				key: "cpap"
			},
			{
				name: "Patient Monitor",
				key: "monitor"
			},
			{
				name: "Surgical Cot",
				key: "cot"
			},
			{
				name: "Wheel Chair",
				key: "chair"
			}
		].filter((eq) => rental?.equipment?.toLowerCase().includes(eq.key));
		if (hiredEquipments.length > 0) finalEquipRows = hiredEquipments.map((eq) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
			className: "border-b border-slate-800 text-[11.5px]",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					className: "p-1 px-2 border-r border-slate-800",
					children: eq.name
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					className: "p-1 px-2 border-r border-slate-800 text-center font-bold text-emerald-600",
					children: "YES"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					className: "p-1 px-2 border-r border-slate-800",
					children: rental?.model || "BMC-D"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					className: "p-1 px-2 border-r border-slate-800 font-mono text-[11px]",
					children: rental?.serial || "XXXX"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { className: "p-1 px-2 border-r border-slate-800" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { className: "p-1 px-2" })
			]
		}, eq.key));
		else if (rental?.equipment) finalEquipRows = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
			className: "border-b border-slate-800 text-[11.5px] bg-slate-50 font-bold",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					className: "p-1 px-2 border-r border-slate-800",
					children: rental.equipment
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					className: "p-1 px-2 border-r border-slate-800 text-center font-bold text-emerald-600",
					children: "YES"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					className: "p-1 px-2 border-r border-slate-800",
					children: rental.model || "Standard"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					className: "p-1 px-2 border-r border-slate-800 font-mono text-[11px]",
					children: rental.serial || "XXXX"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { className: "p-1 px-2 border-r border-slate-800" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { className: "p-1 px-2" })
			]
		});
	}
	const isMonthly = rental?.monthlyRent > 0;
	const rentVal = isMonthly ? rental?.monthlyRent || 0 : rental?.dailyRent || 0;
	const rentLabel = isMonthly ? "Monthly Rent Rate" : "Daily Rent Rate";
	convertNumberToWords(rentVal);
	const depositVal = rental?.deposit || 0;
	convertNumberToWords(depositVal);
	let rentPaidAmount = 0;
	if (rental?.rentalPaymentStatus === "Paid") rentPaidAmount = rentVal;
	else if (rental?.rentalPaymentStatus === "Partial") rentPaidAmount = Number(rental?.rentPaidAmount) || 0;
	let depositPaidAmount = 0;
	if (rental?.depositPaymentStatus === "Paid") depositPaidAmount = depositVal;
	else if (rental?.depositPaymentStatus === "Partial") depositPaidAmount = Number(rental?.depositPaidAmount) || 0;
	const selectedAddons = (rental?.additionalItems || []).filter((item) => item.selected);
	let totalDue = depositVal + rentVal;
	let totalPaid = depositPaidAmount + rentPaidAmount;
	selectedAddons.forEach((item) => {
		if (item.status !== "Free of Cost") totalDue += Number(item.amount) || 0;
		if (item.status === "Paid") totalPaid += Number(item.amount) || 0;
	});
	const balanceDue = totalDue - totalPaid;
	const totalDueWords = convertNumberToWords(totalDue);
	const totalPaidWords = convertNumberToWords(totalPaid);
	const balanceDueWords = convertNumberToWords(balanceDue);
	const paymentsList = getPayments().filter((p) => p.agreement === rental?.id && p.status === "Paid");
	let totalRentPaidWithoutDeposit = paymentsList.filter((p) => p.type === "Rent" || p.type === "Rent Payment").reduce((sum, p) => sum + p.amount, 0);
	if (totalRentPaidWithoutDeposit === 0 && (rental?.rentalPaymentStatus === "Paid" || rental?.rentalPaymentStatus === "Partial")) totalRentPaidWithoutDeposit = rental?.rentPaidAmount || rental?.totalRent || rental?.monthlyRent || 0;
	let depositPaid = paymentsList.filter((p) => p.type === "Deposit" || p.type === "Security Deposit").reduce((sum, p) => sum + p.amount, 0);
	if (depositPaid === 0 && (rental?.depositPaymentStatus === "Paid" || rental?.depositPaymentStatus === "Partial")) depositPaid = rental?.depositPaidAmount || rental?.deposit || 0;
	const overallPaid = totalRentPaidWithoutDeposit + depositPaid;
	const todayStr = getLocalYYYYMMDD();
	const reportEndDate = rental?.status === "Completed" ? rental?.end || todayStr : todayStr;
	rental?.start && calculateDurationBetween(rental.start, reportEndDate);
	const totalRentToBePaid = rental?.start ? calculateRentForDuration(rental.start, reportEndDate, rental.monthlyRent || 0, rental.dailyRent || 0) : 0;
	if (overallPaid > totalRentToBePaid) overallPaid - totalRentToBePaid;
	else totalRentToBePaid - overallPaid;
	const leftRows = [];
	const rightRows = [];
	for (let i = 0; i <= 36; i++) {
		const leftPay = paymentsList[i];
		const rightPay = paymentsList[i + 37];
		leftRows.push(/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
			className: "border-b border-slate-800",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					className: "border-r border-slate-800 p-1 text-center text-[10.5px] font-medium",
					children: i
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					className: "border-r border-slate-800 p-1 text-right text-[10.5px]",
					children: leftPay ? `₹${leftPay.amount.toLocaleString("en-IN")}` : "\xA0"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					className: "p-1 text-center text-[10.5px]",
					children: leftPay ? parseLocalDate(leftPay.date).toLocaleDateString("en-IN") : "\xA0"
				})
			]
		}, `left-${i}`));
		rightRows.push(/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
			className: "border-b border-slate-800",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					className: "border-r border-slate-800 p-1 text-center text-[10.5px] font-medium",
					children: i + 37
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					className: "border-r border-slate-800 p-1 text-right text-[10.5px]",
					children: rightPay ? `₹${rightPay.amount.toLocaleString("en-IN")}` : "\xA0"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					className: "p-1 text-center text-[10.5px]",
					children: rightPay ? parseLocalDate(rightPay.date).toLocaleDateString("en-IN") : "\xA0"
				})
			]
		}, `right-${i}`));
	}
	const finalSignatureUrl = signatureUrl || rental?.signatureUrl || null;
	thumbprintUrl || rental?.thumbprintUrl;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
		asChild: true,
		children: trigger
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
		className: "max-w-4xl max-h-[90vh] overflow-y-auto bg-muted/20",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-row items-center justify-between mb-4 mt-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
				className: "text-lg font-bold",
				children: "Agreement Preview"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "outline",
						size: "sm",
						onClick: () => {
							downloadAgreementFile(rental);
							toast.success(`Agreement PDF downloaded successfully.`);
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "mr-1.5 h-3.5 w-3.5" }), " PDF / Download"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						size: "sm",
						className: "bg-emerald-600 hover:bg-emerald-700 text-white",
						onClick: () => sendWhatsAppDocument(rental, customers),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { className: "mr-1.5 h-3.5 w-3.5" }), " Send to WhatsApp"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogClose, {
						asChild: true,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "outline",
							size: "sm",
							className: "hover:bg-destructive hover:text-destructive-foreground",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "mr-1.5 h-3.5 w-3.5" }), " Close"]
						})
					})
				]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col gap-8 select-none p-1",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto w-full max-w-[794px] bg-white text-slate-900 p-10 shadow-lg border border-slate-200 flex flex-col text-[12.5px] relative font-sans leading-relaxed",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex justify-between items-center mb-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: "/images/logo.png",
							alt: "Relife Logo",
							className: "h-[65px] w-auto object-contain"
						}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-right",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
									className: "text-[26px] font-black text-red-600 m-0 leading-none",
									children: "Relife Medical Technologies"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-[11px] text-blue-600 font-semibold mt-1 leading-tight",
									children: [
										"Behind House No.MIG-15, Left to Prasanna Lingeshwara Temple,",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
										"Near Vijaya Bank Circle, Kuvempunagar, Mysore-570023."
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-[10px] text-slate-600 mt-1 leading-tight",
									children: [
										"Mob No-8660095261, 8951585261, 8123828442",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
										"GSTIN-29DCVPS6218E1ZX, Drug Licence No-KA-MY1-233278/79"
									]
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "border-b-[2.5px] border-blue-600 mb-4 w-full" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex justify-between font-bold text-red-600 text-[13px] mb-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Agreement No: ", rental?.id || "N/A"] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Date: ", formattedStartDate] })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-center font-bold text-[15px] text-red-600 underline tracking-wider mb-4 uppercase",
						children: "EQUIPMENT RENTAL AGREEMENT"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-justify mb-4",
						children: [
							"This Equipment Rental Agreement dated ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: formattedStartDate }),
							" between the Lessor of the first party ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "\"M/s Relife Medical Technologies, Mysore\"" }),
							" and the Lessee of the second party"
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-4 space-y-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-bold inline-block w-[140px]",
								children: "Customer Name:"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: customerName })] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-bold inline-block w-[140px]",
								children: "Customer Address:"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
								customerAddress,
								", ",
								customerArea ? `${customerArea}, ` : "",
								customerCity,
								", ",
								customerState,
								" ",
								customerPincode ? `- ${customerPincode}` : ""
							] })] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-bold inline-block w-[140px]",
								children: "Mobile Numbers:"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [customerPhone, customerAltPhone ? `, ${customerAltPhone}` : ""] })] })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-justify mb-4",
						children: "The lessor and the Lessee are collectively the parties in consideration of the mutual convenient are promises in this agreement the sufficiency of which the parties acknowledge the Lessor has rented the below equipment to Lessee. The Lessee has hired the equipment from the Lessor on the following terms and conditions."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "font-bold text-[13px] text-red-600 underline uppercase mb-2",
						children: "EQUIPMENT DETAILS ARE AS FOLLOWS: -"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full border-collapse border border-slate-800 text-[12px] mb-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "bg-slate-100 border-b border-slate-800 text-left font-bold text-[11.5px]",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "border-r border-slate-800 p-1.5",
									children: "Equipment Name"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "border-r border-slate-800 p-1.5 text-center",
									children: "Hired"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "border-r border-slate-800 p-1.5",
									children: "Model"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "border-r border-slate-800 p-1.5",
									children: "M/C Sr.No"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "border-r border-slate-800 p-1.5",
									children: "Ref.No"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "p-1.5",
									children: "Ref.Date"
								})
							]
						}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: finalEquipRows })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "font-bold text-[13px] text-red-600 underline uppercase mb-2",
						children: "RENT AND DEPOSIT DETAILS: -"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full border-collapse border border-slate-800 text-[12px] mb-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "bg-slate-100 border-b border-slate-800 text-left font-bold text-[11px]",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "border-r border-slate-800 p-1.5 w-[220px]",
									children: "Upfront Charge Details"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "border-r border-slate-800 p-1.5 w-[120px] text-right",
									children: "Amount Due"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "border-r border-slate-800 p-1.5 w-[120px] text-right",
									children: "Amount Paid"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "p-1.5",
									children: "Payment Status"
								})
							]
						}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "border-b border-slate-800",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "border-r border-slate-800 p-1.5 font-bold",
										children: rentLabel
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
										className: "border-r border-slate-800 p-1.5 text-right",
										children: ["Rs. ", rentVal.toLocaleString("en-IN")]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
										className: "border-r border-slate-800 p-1.5 text-right",
										children: ["Rs. ", rentPaidAmount.toLocaleString("en-IN")]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
										className: "p-1.5",
										children: ["Status: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: rental?.rentalPaymentStatus || "Not Paid" })]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "border-b border-slate-800",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "border-r border-slate-800 p-1.5 font-bold",
										children: "Security Deposit"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
										className: "border-r border-slate-800 p-1.5 text-right",
										children: ["Rs. ", depositVal.toLocaleString("en-IN")]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
										className: "border-r border-slate-800 p-1.5 text-right",
										children: ["Rs. ", depositPaidAmount.toLocaleString("en-IN")]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
										className: "p-1.5",
										children: ["Status: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: rental?.depositPaymentStatus || "Not Paid" })]
									})
								]
							}),
							selectedAddons.map((item, idx) => {
								const itemDue = item.status === "Free of Cost" ? 0 : item.amount;
								const itemPaid = item.status === "Paid" ? item.amount : 0;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
									className: "border-b border-slate-800",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "border-r border-slate-800 p-1.5 font-bold",
											children: item.name
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
											className: "border-r border-slate-800 p-1.5 text-right",
											children: ["Rs. ", itemDue.toLocaleString("en-IN")]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
											className: "border-r border-slate-800 p-1.5 text-right",
											children: ["Rs. ", itemPaid.toLocaleString("en-IN")]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
											className: "p-1.5",
											children: ["Status: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: item.status })]
										})
									]
								}, `addon-${idx}`);
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "border-b border-slate-800 font-bold bg-slate-50",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "border-r border-slate-800 p-1.5 font-bold",
										children: "Total Upfront Amount Due"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
										className: "border-r border-slate-800 p-1.5 text-right",
										children: ["Rs. ", totalDue.toLocaleString("en-IN")]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
										colSpan: 2,
										className: "p-1.5 text-[11px] text-muted-foreground font-normal",
										children: ["Rs. ", totalDueWords]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "border-b border-slate-800 font-bold bg-slate-100/50 text-emerald-800",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "border-r border-slate-800 p-1.5 font-bold",
										children: "Total Amount Paid"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
										colSpan: 2,
										className: "border-r border-slate-800 p-1.5 text-right pr-4",
										children: ["Rs. ", totalPaid.toLocaleString("en-IN")]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
										className: "p-1.5 text-[11px] font-normal",
										children: ["Rs. ", totalPaidWords]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: `border-b border-slate-800 font-bold ${balanceDue > 0 ? "bg-red-50 text-red-800" : "bg-emerald-50 text-emerald-800"}`,
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "border-r border-slate-800 p-1.5 font-bold",
										children: "Remaining Balance Due"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
										colSpan: 2,
										className: "border-r border-slate-800 p-1.5 text-right pr-4",
										children: ["Rs. ", balanceDue.toLocaleString("en-IN")]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "p-1.5 text-[11px] font-normal",
										children: balanceDue > 0 ? `Rs. ${balanceDueWords}` : "Fully Paid"
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "border-b border-slate-800",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "border-r border-slate-800 p-1.5 font-bold",
									children: "Payment Mode"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									colSpan: 3,
									className: "p-1.5",
									children: totalPaid > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
										rental?.paymentMode || "Cash",
										rental?.paymentMode === "Cash+Bank" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "font-semibold",
											children: [
												" (Cash: ₹",
												(rental.cashPaidAmount || 0).toLocaleString("en-IN"),
												", Bank/UPI: ₹",
												(rental.bankUpiPaidAmount || 0).toLocaleString("en-IN"),
												")"
											]
										}),
										rental?.paymentCollectedBy ? ` (Collected By: ${rental.paymentCollectedBy})` : ""
									] }) : "N/A"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "border-b border-slate-800",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "border-r border-slate-800 p-1.5 font-bold valign-top",
									children: "Note:-"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									colSpan: 3,
									className: "p-1.5",
									children: "Extra payment is for one-time accessory or personal purchases, non-returnable and non-refundable."
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "border-r border-slate-800 p-1.5 font-bold",
								children: "Remarks"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								colSpan: 3,
								className: "p-1.5",
								children: rental?.remarks || "N/A"
							})] })
						] })]
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto w-full max-w-[794px] bg-white text-slate-900 p-10 shadow-lg border border-slate-200 flex flex-col text-[12px] relative font-sans leading-relaxed",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "font-bold text-[13px] text-red-600 underline uppercase mb-3",
						children: "HIRING TERMS & CONDITIONS: -"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", {
						className: "list-[lower-alpha] pl-5 space-y-2 mb-6 text-justify",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "The Lessor agrees to rent the above equipment to the Lessee, and the Lessee agrees to hire the above equipment from the Lessor in accordance with the terms set out in this agreement." }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "This rental term commences from the date of rental agreement and will continue on a month-to-month or day-to-day basis until Lessor or the Lessee terminates this agreement." }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Lessee will have to carry out the machine from the Lessor office at the time of hiring and then Lessee must have to return the equipment to Lessor office on Lessee's own expense after completion of the term." }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Minimum one month rent will be applicable even if machine has returned early in between the rental term." }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Monthly rent should be paid from the Lessee on the term date for each month in advance based." }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "First month rent will be taken in advance with the deposit amount." }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "The Lessor will refund the deposit amount to Lessee at the end of the rental term." }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "If the equipment is not returned or rent not paid from the Lessee, the Lessor has the fully authority to take legal action on Lessee." }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "The equipment should be used under the supervision of a licensed physician." }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "The Lessor shall not be responsible for any consequential loss directly or indirectly due to sudden cause of device fault / due to faulty operation." })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "font-bold text-[13px] text-red-600 underline uppercase mb-3",
						children: "REPAIR OF THE EQUIPMENT: -"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", {
						className: "list-[lower-alpha] pl-5 space-y-2 mb-10 text-justify",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "The Lessee must have to carry out the monthly preventive maintenance to keep the equipment in good working condition from the Lessee's own expense." }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "The Lessee must have to bear their own expense if any fault/damage occurred due to mishandling of the equipment / due to power fluctuation in the house." }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "The Lessor will not carry out any kind of service at Lessee's location / at patient location. The Lessee must have to bring the equipment for service/replacement purpose during the office hours only from 10am to 6pm except Sunday and holidays." }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "The Lessee must have to keep one backup Oxygen cylinder / Ups for uninterrupted usage of the equipment on their own expense." }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Lessor shall not be able to provide service 24/7." })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex justify-between items-end mt-auto pt-6 border-t border-slate-100",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "w-[45%] text-left",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-bold text-red-600 text-[13px]",
									children: "For Relife Medical Technologies"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "h-16 flex items-end mb-2",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
										src: "/images/logo.png",
										alt: "Relife Logo",
										className: "h-[38px] w-auto object-contain -rotate-[5deg] opacity-85"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-bold text-red-600 text-[12px]",
									children: "(Authorized Signatory)"
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "w-[45%] text-right",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-bold text-[13px]",
									children: "I agree to the above terms & conditions."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "h-16 flex items-end justify-end mb-2 pr-4",
									children: finalSignatureUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
										src: finalSignatureUrl,
										alt: "Customer Signature",
										className: "max-h-[50px] max-w-[150px] object-contain bg-white border border-slate-100 p-0.5 rounded"
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "border-b border-dotted border-slate-600 w-[150px] inline-block h-6" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "font-bold text-[12.5px]",
									children: ["Customer Name: ", customerName]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-bold text-[11px] text-slate-500",
									children: "Customer Signature"
								})
							]
						})]
					})
				]
			})]
		})]
	})] });
}
function RentalsPage() {
	const dbVersion = useDatabaseTrigger();
	const [search, setSearch] = (0, import_react.useState)("");
	const [statusFilter, setStatusFilter] = (0, import_react.useState)("all");
	const [rentalsList, setRentalsList] = (0, import_react.useState)(() => getRentals());
	const isStaff = typeof window !== "undefined" && localStorage.getItem("medirent-user-role") === "Staff";
	const refresh = () => setRentalsList(getRentals());
	const pageScrollRef = (0, import_react.useRef)(0);
	(0, import_react.useEffect)(() => {
		const onScroll = () => {
			pageScrollRef.current = window.scrollY;
		};
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);
	(0, import_react.useEffect)(() => {
		const saved = pageScrollRef.current;
		setRentalsList(getRentals());
		requestAnimationFrame(() => {
			window.scrollTo({
				top: saved,
				behavior: "instant"
			});
		});
	}, [dbVersion]);
	const customersList = (0, import_react.useMemo)(() => getCustomers(), [dbVersion]);
	const filteredRentals = sortLatestFirst(rentalsList.filter((r) => {
		const q = search.toLowerCase().trim();
		const customer = customersList.find((c) => c.id === r.customerId);
		const matchesSearch = !q || r.id.toLowerCase().includes(q) || r.customer.toLowerCase().includes(q) || String(r.equipment || "").toLowerCase().includes(q) || String(r.serial || "").toLowerCase().includes(q) || r.equipmentItems && r.equipmentItems.some((ei) => String(ei.serial || "").toLowerCase().includes(q)) || customer && (String(customer.phone || "").toLowerCase().includes(q) || String(customer.altPhone || "").toLowerCase().includes(q) || String(customer.contactNumber3 || "").toLowerCase().includes(q) || String(customer.area || "").toLowerCase().includes(q) || String(customer.address || "").toLowerCase().includes(q));
		const matchesStatus = statusFilter === "all" || r.status.toLowerCase() === statusFilter.toLowerCase();
		return matchesSearch && matchesStatus;
	}), "start");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "Rental Agreements",
		subtitle: "Create, track and manage all equipment rental contracts",
		actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
			variant: "outline",
			size: "sm",
			onClick: () => {
				downloadExcel("rental_agreements_export.xls", [
					"Agreement ID",
					"Customer",
					"Equipment",
					"Serial",
					"Period",
					"Monthly Rent",
					"Deposit",
					"Status"
				], rentalsList.map((r) => [
					r.id,
					r.customer,
					r.equipment,
					r.serial,
					`${r.start} to ${r.end}`,
					(r.monthlyRent ?? 0).toString(),
					(r.deposit ?? 0).toString(),
					r.status
				]), [
					120,
					200,
					250,
					150,
					200,
					110,
					110,
					100
				]);
				toast.success("Rental agreements log exported successfully.");
			},
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "mr-1.5 h-3.5 w-3.5" }), "Export"]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CreateRentalDialog, {
			onSave: refresh,
			trigger: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				size: "sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "mr-1.5 h-3.5 w-3.5" }), "New Agreement"]
			})
		})] }),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mb-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4",
				children: [
					{
						l: "Total Agreements",
						v: rentalsList.length.toString(),
						icon: FileText,
						c: "text-primary",
						bg: "bg-primary/10 border-primary/20"
					},
					{
						l: "Active",
						v: rentalsList.filter((r) => r.status === "Active").length.toString(),
						icon: FileCheckCorner,
						c: "text-success",
						bg: "bg-success/10 border-success/20"
					},
					{
						l: "Pending Approval",
						v: rentalsList.filter((r) => r.status === "Pending Approval").length.toString(),
						icon: Clock,
						c: "text-warning",
						bg: "bg-warning/10 border-warning/20"
					},
					{
						l: "Overdue",
						v: rentalsList.filter((r) => r.status === "Overdue").length.toString(),
						icon: TriangleAlert,
						c: "text-destructive",
						bg: "bg-destructive/10 border-destructive/20"
					}
				].map((s, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
					className: `hover:shadow-[var(--shadow-elevated)] hover:-translate-y-0.5 transition-all animate-[fade-in_0.4s_ease-out_both] stagger-${i + 1}`,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
						className: "flex items-center gap-2.5 sm:gap-4 p-3.5 sm:p-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: `metric-icon h-8 w-8 sm:h-10 sm:w-10 shrink-0 ${s.bg}`,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(s.icon, { className: `h-3.5 w-3.5 sm:h-4.5 sm:w-4.5 ${s.c}` })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 leading-tight",
							children: s.l
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: `mt-0.5 font-display text-[18px] sm:text-[22px] font-bold ${s.c}`,
							children: s.v
						})] })]
					})
				}, s.l))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
				className: "overflow-hidden",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
					className: "p-0",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-2 border-b border-border/60 bg-muted/20 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative flex-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									placeholder: "Search agreement, customer, equipment…",
									className: "pl-9 h-9 text-[13px] bg-card border-border/50 w-full",
									value: search,
									onChange: (e) => setSearch(e.target.value)
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
								value: statusFilter,
								onValueChange: setStatusFilter,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
									className: "w-full sm:w-[130px] h-9 text-[12px]",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "all",
										children: "All Status"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "active",
										children: "Active"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "pending approval",
										children: "Pending Approval"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "overdue",
										children: "Overdue"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "returned",
										children: "Returned"
									})
								] })]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "hidden sm:block overflow-x-auto",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Agreement" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Customer" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Equipment" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Start Date" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
									className: "text-right",
									children: "Rent Rate"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
									className: "text-right",
									children: "Deposit"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Status" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
									className: "w-40 text-right",
									children: "Actions"
								})
							] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableBody, { children: [filteredRentals.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableRow, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
								colSpan: 8,
								className: "py-12 text-center text-[13px] text-muted-foreground",
								children: "No agreements match your search or filter."
							}) }), filteredRentals.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, {
								className: "group",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "inline-flex items-center rounded-md bg-primary/8 border border-primary/18 px-2 py-0.5 font-mono text-[11px] font-bold text-primary",
										children: r.id
									}) }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-semibold text-[13px]",
										children: r.customer
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[10px] font-mono text-muted-foreground",
										children: r.customerId
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[13px] text-foreground/80",
										children: r.equipment
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[10px] font-mono text-muted-foreground",
										children: r.serial
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-1.5 text-[12px] text-muted-foreground",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarDays, { className: "h-3.5 w-3.5 text-muted-foreground/60" }), formatDateDDMMYYYY(r.start)]
									}) }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
										className: "text-right",
										children: r.rentCycle === "Daily" || r.monthlyRent === 0 && (r.dailyRent ?? 0) > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "font-display text-[14px] font-bold text-muted-foreground",
											children: [
												"₹",
												(r.dailyRent ?? 0).toLocaleString("en-IN"),
												"/day"
											]
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "font-display text-[14px] font-bold",
											children: [
												"₹",
												r.monthlyRent.toLocaleString("en-IN"),
												"/mo"
											]
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
										className: "text-right",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "text-[13px] font-semibold text-muted-foreground",
											children: ["₹", (r.deposit ?? 0).toLocaleString("en-IN")]
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, { status: r.status }) }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
										className: "text-right",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-end gap-1 transition-opacity",
											children: [
												(r.latitude || r.locationAddress) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
													variant: "ghost",
													size: "icon",
													className: "h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50/50",
													title: "Directions / Map Link",
													onClick: () => {
														const url = getDirectionsUrl(Number(r.latitude) || 0, Number(r.longitude) || 0, r.locationAddress || "");
														if (url) window.open(url, "_blank");
														else toast.error("No valid map directions link available.");
													},
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "h-3.5 w-3.5" })
												}),
												!isStaff && r.status !== "Cancelled" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CreateRentalDialog, {
													title: "Edit Rental Agreement",
													rental: r,
													onSave: refresh,
													trigger: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
														variant: "ghost",
														size: "icon",
														className: "h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10",
														title: "Edit Agreement",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SquarePen, { className: "h-3.5 w-3.5" })
													})
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
													variant: "ghost",
													size: "icon",
													className: "h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10",
													title: "Download PDF",
													onClick: () => {
														downloadAgreementFile(r);
														toast.success(`PDF agreement for ${r.id} downloaded.`);
													},
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "h-3.5 w-3.5" })
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
													variant: "ghost",
													size: "icon",
													className: "h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50",
													title: `Send WhatsApp to ${r.customer}`,
													onClick: () => sendWhatsAppDocument(r, customersList),
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { className: "h-3.5 w-3.5" })
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
													variant: "ghost",
													size: "icon",
													className: "h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10",
													title: "Email",
													onClick: () => toast.success(`Agreement emailed successfully to ${r.customer}.`),
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mail, { className: "h-3.5 w-3.5" })
												}),
												!isStaff && r.status === "Pending Approval" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
													variant: "ghost",
													size: "icon",
													className: "h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border border-emerald-200",
													title: "Approve Agreement",
													onClick: () => {
														approveRental(r.id);
														refresh();
														toast.success(`Agreement ${r.id} approved successfully!`);
													},
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "h-3.5 w-3.5" })
												}),
												!isStaff && r.status !== "Completed" && r.status !== "Returned" && r.status !== "Cancelled" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CancelRentalDialog, {
													rental: r,
													onCancel: refresh,
													trigger: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
														variant: "ghost",
														size: "icon",
														className: "h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10",
														title: "Cancel",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleX, { className: "h-3.5 w-3.5" })
													})
												})
											]
										})
									})
								]
							}, r.id))] })] })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "sm:hidden",
							children: filteredRentals.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "py-12 text-center text-[13px] text-muted-foreground",
								children: "No agreements match your search or filter."
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "divide-y divide-border/60",
								children: filteredRentals.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "px-4 py-3.5 active:bg-muted/30 transition-colors",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-start justify-between gap-2 mb-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "inline-flex items-center rounded-md bg-primary/8 border border-primary/18 px-2 py-0.5 font-mono text-[11px] font-bold text-primary",
												children: r.id
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "font-semibold text-[13.5px] mt-1",
												children: r.customer
											})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, { status: r.status })]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[12px] text-muted-foreground truncate mb-2",
											children: r.equipment
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-3",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "info-row",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarDays, { className: "h-3 w-3 shrink-0" }), formatDateDDMMYYYY(r.start)]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "info-row font-semibold text-foreground",
												children: r.rentCycle === "Daily" || r.monthlyRent === 0 && (r.dailyRent ?? 0) > 0 ? `₹${(r.dailyRent ?? 0).toLocaleString("en-IN")}/day` : `₹${r.monthlyRent.toLocaleString("en-IN")}/mo`
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-2 mt-2.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
												variant: "outline",
												size: "sm",
												className: "h-7 text-[11px] px-2.5",
												onClick: () => {
													downloadAgreementFile(r);
													toast.success(`PDF for ${r.id} downloaded.`);
												},
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "h-3 w-3 mr-1" }), " PDF"]
											}), !isStaff && r.status === "Pending Approval" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
												variant: "outline",
												size: "sm",
												className: "h-7 text-[11px] px-2.5 text-emerald-600 border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50",
												onClick: () => {
													approveRental(r.id);
													refresh();
													toast.success(`Agreement ${r.id} approved successfully!`);
												},
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "h-3 w-3 mr-1" }), " Approve"]
											})]
										})
									]
								}, r.id))
							})
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CreateRentalDialog, {
				onSave: refresh,
				trigger: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					className: "fab md:hidden",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "h-5 w-5" }), "New Agreement"]
				})
			})
		]
	});
}
function ReadOnlyField({ label, value, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `space-y-1 ${className ?? ""}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-[13px] font-medium text-foreground",
			children: value
		})]
	});
}
//#endregion
export { AgreementPreviewDialog, RentalsPage as component, getDirectionsUrl, parseManualLocationInput, sendWhatsAppDocument };
