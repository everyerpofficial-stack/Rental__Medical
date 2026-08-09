import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { C as getDocuments, J as printReturnReceipt, K as printDocumentFile, S as getDocumentWithFile, V as getReturns, Z as saveDocument, b as getCustomers, d as downloadAgreementFile, f as downloadBase64File, g as formatDateDDMMYYYY, s as deleteDocument, st as useDatabaseTrigger, x as getDocumentPreviewUrl, z as getRentals } from "./data-store-BQmZefNN.mjs";
import { c as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { $ as Folder, Mt as Calendar, O as Receipt, S as ShieldAlert, T as ScanLine, Vt as ArrowLeft, at as FileText, ct as FileDigit, et as FolderOpen, f as Upload, h as Trash2, j as Plus, lt as FileCheckCorner, mt as Download, st as FileImage, ut as Eye, w as Search, z as MapPin } from "../_libs/lucide-react.mjs";
import { a as DialogFooter, c as DialogTrigger, i as DialogContent, l as Input, n as Dialog, o as DialogHeader, s as DialogTitle, t as Button, u as Label } from "./dialog-BHa0LWsH.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-C2rs2HGz.mjs";
import { a as CardContent, h as StatusBadge, i as Card, t as AppShell } from "./AppShell-BtlnpavN.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/documents-SGfwO_Vu.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var getDocDetails = (type) => {
	switch (type) {
		case "ID Proof": return {
			icon: FileImage,
			color: "text-primary bg-primary/10 border-primary/20",
			dotColor: "bg-primary"
		};
		case "Agreement": return {
			icon: FileCheckCorner,
			color: "text-accent bg-accent/10 border-accent/20",
			dotColor: "bg-accent"
		};
		case "Invoice": return {
			icon: FileText,
			color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
			dotColor: "bg-blue-500"
		};
		case "Receipt": return {
			icon: Receipt,
			color: "text-green-500 bg-green-500/10 border-green-500/20",
			dotColor: "bg-green-500"
		};
		default: return {
			icon: FileDigit,
			color: "text-warning bg-warning/10 border-warning/20",
			dotColor: "bg-warning"
		};
	}
};
var ID_PROOF_KEYWORDS = [
	"aadhaar",
	"aadhar",
	"adhaar",
	"adhar",
	"uidai",
	"pan",
	"pancard",
	"voter",
	"epic",
	"license",
	"licence",
	"driving",
	"passport",
	"kyc",
	"idproof"
];
var AGREEMENT_KEYWORDS = [
	"agreement",
	"contract",
	"rental",
	"rent",
	"lease",
	"signed",
	"terms"
];
var detectDocumentType = (fileName, mimeType) => {
	const words = fileName.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
	if (words.some((w) => ID_PROOF_KEYWORDS.includes(w))) return "ID Proof";
	if (words.some((w) => AGREEMENT_KEYWORDS.includes(w))) return "Agreement";
	if (mimeType.startsWith("image/")) return "ID Proof";
	if (mimeType === "application/pdf") return "Agreement";
	return null;
};
function DocsPage() {
	const dbVersion = useDatabaseTrigger();
	const [docsList, setDocsList] = (0, import_react.useState)(() => getDocuments());
	const [rentalsList, setRentalsList] = (0, import_react.useState)(() => getRentals());
	const [customersList, setCustomersList] = (0, import_react.useState)(() => getCustomers());
	const [returnsList, setReturnsList] = (0, import_react.useState)(() => getReturns());
	const [selectedFolderId, setSelectedFolderId] = (0, import_react.useState)(null);
	const changeFolder = (folderId) => {
		setSelectedFolderId(folderId);
		if (typeof window !== "undefined") {
			const newUrl = folderId ? `${window.location.pathname}?folder=${folderId}` : window.location.pathname;
			window.history.replaceState(null, "", newUrl);
		}
	};
	const [searchQuery, setSearchQuery] = (0, import_react.useState)("");
	const [previewDoc, setPreviewDoc] = (0, import_react.useState)(null);
	const [isPreviewLoading, setIsPreviewLoading] = (0, import_react.useState)(false);
	const [deleteDoc, setDeleteDoc] = (0, import_react.useState)(null);
	const [uploadOpen, setUploadOpen] = (0, import_react.useState)(false);
	const isStaff = typeof window !== "undefined" && localStorage.getItem("medirent-user-role") === "Staff";
	const [newDocName, setNewDocName] = (0, import_react.useState)("");
	const [newDocType, setNewDocType] = (0, import_react.useState)("Agreement");
	const [newDocSize, setNewDocSize] = (0, import_react.useState)("120 KB");
	const [newDocFileData, setNewDocFileData] = (0, import_react.useState)("");
	const [typeAutoDetected, setTypeAutoDetected] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		setDocsList(getDocuments());
		setRentalsList(getRentals());
		setCustomersList(getCustomers());
		setReturnsList(getReturns());
		if (typeof window !== "undefined") {
			const folderParam = new URLSearchParams(window.location.search).get("folder");
			if (folderParam) setSelectedFolderId(folderParam);
		}
	}, [dbVersion]);
	(0, import_react.useEffect)(() => {
		if (previewDoc && !previewDoc.fileData) {
			setIsPreviewLoading(true);
			getDocumentWithFile(previewDoc).then((fullDoc) => {
				setPreviewDoc(fullDoc);
				setIsPreviewLoading(false);
			}).catch(() => setIsPreviewLoading(false));
		} else setIsPreviewLoading(false);
	}, [previewDoc?.id]);
	const currentRental = (0, import_react.useMemo)(() => {
		if (!selectedFolderId || selectedFolderId === "general") return null;
		return rentalsList.find((r) => r.id === selectedFolderId) || null;
	}, [selectedFolderId, rentalsList]);
	const [locDocFileData, setLocDocFileData] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		if (currentRental) {
			const locDoc = docsList.find((d) => d.type === "Location Tag" && (d.rentalId === currentRental.id || d.name.includes(currentRental.id)));
			if (locDoc) if (locDoc.fileData) setLocDocFileData(locDoc.fileData);
			else getDocumentWithFile(locDoc).then((fullDoc) => {
				setLocDocFileData(fullDoc.fileData || "");
			});
			else setLocDocFileData(null);
		} else setLocDocFileData(null);
	}, [currentRental, docsList]);
	const currentCustomer = (0, import_react.useMemo)(() => {
		if (!currentRental) return null;
		return customersList.find((c) => c.id === currentRental.customerId) || null;
	}, [currentRental, customersList]);
	const currentReturns = (0, import_react.useMemo)(() => {
		if (!selectedFolderId) return [];
		return returnsList.filter((ret) => ret.agreement === selectedFolderId);
	}, [selectedFolderId, returnsList]);
	(0, import_react.useMemo)(() => {
		return docsList.filter((d) => !d.rentalId).length;
	}, [docsList]);
	const getFolderFileCount = (rental) => {
		const agreementFiles = docsList.filter((d) => d.rentalId === rental.id && (d.type === "Agreement" || d.type === "Signed Agreement" || d.type === "Delivery Photo")).length;
		const kycFiles = docsList.filter((d) => d.customerId === rental.customerId && d.type === "ID Proof").length;
		let systemFiles = 0;
		if (agreementFiles === 0) systemFiles += 1;
		const returnCount = returnsList.filter((ret) => ret.agreement === rental.id).length;
		systemFiles += returnCount;
		if (docsList.some((d) => d.type === "Location Tag" && (d.rentalId === rental.id || d.name.includes(rental.id))) || rental.latitude && rental.longitude) systemFiles += 1;
		return agreementFiles + kycFiles + systemFiles;
	};
	const filteredRentals = (0, import_react.useMemo)(() => {
		return rentalsList.filter((r) => {
			const q = searchQuery.toLowerCase().trim();
			if (!q) return true;
			const customer = customersList.find((c) => c.id === r.customerId);
			return r.id.toLowerCase().includes(q) || r.customer.toLowerCase().includes(q) || String(r.equipment || "").toLowerCase().includes(q) || String(r.serial || "").toLowerCase().includes(q) || r.equipmentItems && r.equipmentItems.some((ei) => String(ei.serial || "").toLowerCase().includes(q)) || customer && (String(customer.phone || "").toLowerCase().includes(q) || String(customer.altPhone || "").toLowerCase().includes(q) || String(customer.contactNumber3 || "").toLowerCase().includes(q));
		});
	}, [
		rentalsList,
		customersList,
		searchQuery
	]);
	const folderDocuments = (0, import_react.useMemo)(() => {
		if (!selectedFolderId) return [];
		if (selectedFolderId === "general") return docsList.filter((d) => !d.rentalId && (d.type === "Agreement" || d.type === "Signed Agreement" || d.type === "ID Proof" || d.type === "Delivery Photo"));
		const rental = rentalsList.find((r) => r.id === selectedFolderId);
		if (!rental) return [];
		return docsList.filter((d) => {
			const isUploadedAgreement = d.rentalId === selectedFolderId && (d.type === "Agreement" || d.type === "Signed Agreement" || d.type === "Delivery Photo");
			const isKYC = d.customerId === rental.customerId && d.type === "ID Proof";
			return isUploadedAgreement || isKYC;
		});
	}, [
		selectedFolderId,
		docsList,
		rentalsList
	]);
	const handleUpload = () => {
		if (!newDocName) return;
		const newDoc = {
			id: `doc-${Date.now()}`,
			name: newDocName.endsWith(".pdf") || newDocName.endsWith(".jpg") || newDocName.endsWith(".png") ? newDocName : `${newDocName}.pdf`,
			type: newDocType,
			size: newDocSize,
			date: (/* @__PURE__ */ new Date()).toLocaleDateString("en-IN", {
				day: "2-digit",
				month: "short",
				year: "numeric"
			}),
			rentalId: selectedFolderId && selectedFolderId !== "general" ? selectedFolderId : void 0,
			customerId: currentRental?.customerId || void 0,
			fileData: newDocFileData || void 0
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "Agreement Documents",
		subtitle: "Browse agreement folders with rental agreement, customer KYC, location tag and return agreement",
		children: [
			!selectedFolderId && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative flex-1 max-w-md",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							placeholder: "Search agreement, customer or equipment folder…",
							className: "pl-9 h-9 text-[13px] bg-card",
							value: searchQuery,
							onChange: (e) => setSearchQuery(e.target.value)
						})]
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 pt-4",
					children: [filteredRentals.map((r, i) => {
						const fileCount = getFolderFileCount(r);
						const kycFiles = docsList.filter((d) => d.customerId === r.customerId && d.type === "ID Proof").length;
						const hasLocation = docsList.some((d) => d.type === "Location Tag" && (d.rentalId === r.id || d.name.includes(r.id))) || r.latitude && r.longitude;
						const isReturned = r.status === "Completed" || r.status === "Returned";
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-4 animate-[fade-in_0.35s_ease-out_both] flex flex-col",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
								onClick: () => {
									changeFolder(r.id);
									setSearchQuery("");
								},
								className: "group relative border border-border/75 bg-card hover:border-primary/50 hover:shadow-elevated transition-all duration-300 rounded-b-2xl rounded-tr-2xl cursor-pointer flex-1 mt-1.5",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "absolute top-0 left-0 -translate-y-[21px] h-[22px] w-28 bg-card border-t border-x border-border/80 rounded-t-xl flex items-center justify-center gap-1.5 text-[9px] font-bold text-muted-foreground/80 tracking-wider",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Folder, { className: "h-3 w-3 fill-amber-500/20 text-amber-500" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: r.id })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute -top-[1px] left-[1px] w-[110px] h-[2px] bg-card z-10" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
										className: "p-4 flex flex-col justify-between h-[180px] pt-4.5",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center justify-between",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-[9px] font-bold uppercase tracking-wider text-muted-foreground/50",
													children: "Rental Binder"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, { status: r.status })]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "mt-3.5 flex-1",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
														className: "font-bold text-[14.5px] text-foreground tracking-tight truncate leading-tight group-hover:text-primary transition-colors duration-200",
														children: r.customer
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "text-[11.5px] text-muted-foreground truncate mt-1",
														children: r.equipment
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex flex-wrap gap-1 mt-3",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-wider bg-emerald-500/8 text-emerald-600 border border-emerald-500/18 shadow-sm",
																children: "📄 Agreement"
															}),
															kycFiles > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-wider bg-emerald-500/8 text-emerald-600 border border-emerald-500/18 shadow-sm",
																children: "🪪 KYC ID"
															}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-wider bg-amber-500/8 text-amber-600 border border-amber-500/18 shadow-sm",
																children: "⚠️ No KYC"
															}),
															hasLocation && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-wider bg-blue-500/8 text-blue-600 border border-blue-500/18 shadow-sm",
																children: "📍 Location"
															}),
															isReturned && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-wider bg-purple-500/8 text-purple-600 border border-purple-500/18 shadow-sm",
																children: "🔄 Return"
															})
														]
													})
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center justify-between border-t border-border/40 mt-4 pt-3 text-[11px] text-muted-foreground",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center gap-1",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Calendar, { className: "h-3.5 w-3.5 text-muted-foreground/60" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Started ", formatDateDDMMYYYY(r.start)] })]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "font-bold text-primary bg-primary/8 px-2 py-0.5 rounded-full border border-primary/18 shadow-sm text-[10px]",
													children: [
														fileCount,
														" ",
														fileCount === 1 ? "file" : "files"
													]
												})]
											})
										]
									})
								]
							})
						}, r.id);
					}), filteredRentals.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "col-span-full py-16 text-center",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/30 text-muted-foreground mb-4",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Folder, { className: "h-8 w-8" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[14px] font-semibold",
								children: "No folders found"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[12px] text-muted-foreground mt-1",
								children: "Add a rental agreement to create a folder."
							})
						]
					})]
				})]
			}),
			selectedFolderId && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "outline",
								size: "sm",
								className: "h-8 w-8 rounded-lg p-0",
								onClick: () => {
									changeFolder(null);
									setSearchQuery("");
								},
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "h-4 w-4" })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[12px] text-muted-foreground",
										children: "Agreements"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[10px] text-muted-foreground",
										children: "/"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[12px] font-mono font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-md border border-primary/10",
										children: selectedFolderId === "general" ? "General Files" : selectedFolderId
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "font-bold text-[16px] text-foreground mt-0.5",
								children: selectedFolderId === "general" ? "General Documents Cabinet" : `Agreement Folder: ${currentRental?.customer}`
							})] })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex items-center gap-2",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, {
								open: uploadOpen,
								onOpenChange: (open) => {
									setUploadOpen(open);
									if (!open) setTypeAutoDetected(false);
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
									asChild: true,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										size: "sm",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "mr-1.5 h-3.5 w-3.5" }), "Upload File"]
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
									className: "max-w-md",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Upload File to Folder" }) }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-4 py-2",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "space-y-1.5",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
														className: "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
														children: "File Name"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														placeholder: "e.g. Customer KYC ID Proof",
														value: newDocName,
														onChange: (e) => setNewDocName(e.target.value),
														className: "text-[13px]"
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "space-y-1.5",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
															className: "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
															children: "File Type"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
															value: newDocType,
															onValueChange: (v) => {
																setNewDocType(v);
																setTypeAutoDetected(false);
															},
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
																className: "text-[13px]",
																children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Select Type" })
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
																value: "Agreement",
																children: "Rental Agreement Doc"
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
																value: "ID Proof",
																children: "KYC ID Proof (Aadhaar / PAN / Photo)"
															})] })]
														}),
														typeAutoDetected && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
															className: "flex items-center gap-1 text-[10.5px] text-primary/80",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScanLine, { className: "h-3 w-3" }), " Auto-detected from file name — change if incorrect"]
														})
													]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "border border-dashed border-border/80 rounded-xl p-6 text-center bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer relative overflow-hidden",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "h-8 w-8 mx-auto text-muted-foreground/60 mb-3" }),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
															className: "text-[12px] text-muted-foreground",
															children: ["Drag & drop file here, or ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "text-primary font-semibold",
																children: "click to browse"
															})]
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
															type: "file",
															accept: ".pdf,image/*,.jpg,.png,.jpeg",
															className: "absolute inset-0 opacity-0 cursor-pointer w-full h-full",
															onChange: (e) => {
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
																	} else setTypeAutoDetected(false);
																	const reader = new FileReader();
																	reader.onloadend = () => setNewDocFileData(reader.result);
																	reader.readAsDataURL(file);
																}
															}
														})
													]
												})
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											variant: "outline",
											onClick: () => setUploadOpen(false),
											children: "Cancel"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											onClick: handleUpload,
											disabled: !newDocName,
											children: "Upload"
										})] })
									]
								})]
							})
						})]
					}),
					currentRental && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
						className: "border border-border/60 bg-muted/5 shadow-[var(--shadow-soft)] animate-[fade-in_0.3s_ease-out]",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
							className: "p-4 sm:p-5",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-[12.5px] text-muted-foreground",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-0.5 block",
											children: "Customer Details"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-foreground font-semibold text-[13px]",
											children: currentRental.customer
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-muted-foreground text-[11px] font-mono mt-0.5",
											children: currentRental.customerId
										})
									] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-0.5 block",
											children: "Equipment & Model"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-foreground font-semibold text-[13px] truncate",
											children: currentRental.equipment
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-muted-foreground text-[11px] font-mono mt-0.5",
											children: currentRental.serial || "No Serial"
										})
									] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-0.5 block",
											children: "Agreement Period"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-foreground font-semibold text-[13px]",
											children: [
												formatDateDDMMYYYY(currentRental.start),
												" to ",
												currentRental.end ? formatDateDDMMYYYY(currentRental.end) : "Ongoing"
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-muted-foreground text-[11px] mt-0.5",
											children: ["Cycle: ", currentRental.monthlyRent > 0 ? "Monthly" : "Daily"]
										})
									] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-0.5 block",
										children: "Customer KYC Info"
									}), currentCustomer ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-0.5 mt-0.5",
										children: [
											currentCustomer.aadhaar && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "text-[11px] text-foreground",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
														className: "text-muted-foreground",
														children: "Aadhaar:"
													}),
													" ",
													currentCustomer.aadhaar
												]
											}),
											currentCustomer.pan && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "text-[11px] text-foreground",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
														className: "text-muted-foreground",
														children: "PAN:"
													}),
													" ",
													currentCustomer.pan
												]
											}),
											!currentCustomer.aadhaar && !currentCustomer.pan && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-muted-foreground text-[11px]",
												children: "No KYC info registered"
											})
										]
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-muted-foreground text-[11px] mt-0.5",
										children: "No customer profile details"
									})] })
								]
							})
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h4", {
							className: "text-[12px] font-bold uppercase tracking-wider text-muted-foreground/75 px-1 flex items-center gap-1.5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FolderOpen, { className: "h-3.5 w-3.5 text-warning-foreground" }),
								"Folder Contents (",
								folderDocuments.length + (currentRental && !folderDocuments.some((d) => d.type === "Agreement") ? 1 : 0) + (currentRental && (docsList.some((d) => d.type === "Location Tag" && (d.rentalId === currentRental.id || d.name.includes(currentRental.id))) || currentRental.latitude && currentRental.longitude) ? 1 : 0) + (currentRental ? currentReturns.length : 0),
								" files)"
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
							children: [
								currentRental && (docsList.some((d) => d.type === "Location Tag" && (d.rentalId === currentRental.id || d.name.includes(currentRental.id))) || currentRental.latitude && currentRental.longitude) && (() => {
									const locDoc = docsList.find((d) => d.type === "Location Tag" && (d.rentalId === currentRental.id || d.name.includes(currentRental.id)));
									let coords = "";
									let address = "";
									let mapsUrl = "";
									const fileData = locDocFileData || locDoc?.fileData;
									if (fileData) {
										const tryDecode = () => {
											try {
												if (fileData.startsWith("data:text/plain;base64,")) return decodeURIComponent(escape(atob(fileData.replace("data:text/plain;base64,", ""))));
												const b64Match = fileData.match(/^data:[^;]+;base64,(.+)$/);
												if (b64Match) return decodeURIComponent(escape(atob(b64Match[1])));
												return fileData;
											} catch {
												try {
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
										if (addrMatch) address = addrMatch[1].trim();
									}
									if (!coords && (currentRental.latitude || currentRental.longitude)) {
										const lat = Number(currentRental.latitude) || 0;
										const lng = Number(currentRental.longitude) || 0;
										if (lat !== 0 || lng !== 0) {
											coords = `${lat}, ${lng}`;
											mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
										}
										if (currentRental.locationAddress) address = currentRental.locationAddress;
									}
									if ((!mapsUrl || mapsUrl.includes("query=" + currentRental.customer)) && currentRental.locationAddress) {
										const locAddr = String(currentRental.locationAddress).trim();
										if (locAddr.startsWith("http://") || locAddr.startsWith("https://")) mapsUrl = locAddr;
										else mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locAddr)}`;
										if (!address || address === "Location Tagged") address = locAddr;
									}
									if (!mapsUrl) mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(currentRental.customer || "Location")}`;
									return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
										className: "relative border border-emerald-500/25 hover:border-emerald-500/45 hover:shadow-[var(--shadow-elevated)] bg-emerald-500/5 transition-all duration-200",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
											className: "p-4 flex flex-col justify-between h-[160px]",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-start gap-3",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "metric-icon h-11 w-11 bg-emerald-500/15 text-emerald-600 border border-emerald-500/20",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "h-5 w-5" })
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex-1 min-w-0",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
															className: "font-semibold text-[13px] text-foreground leading-snug truncate",
															children: "Location Tag"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
															className: "inline-flex items-center gap-1.5 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-600 mt-1.5",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-1.5 w-1.5 rounded-full bg-emerald-500" }), "GPS Captured"]
														}),
														coords && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
															className: "text-[10px] text-muted-foreground mt-1.5 font-mono leading-tight",
															title: coords,
															children: coords
														}),
														address && !coords && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
															className: "text-[10px] text-muted-foreground mt-1.5 line-clamp-2 leading-tight",
															title: address,
															children: address
														})
													]
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center justify-between border-t border-border/40 pt-2 mt-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-[11px] text-muted-foreground",
													children: "Delivery Location"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
													href: mapsUrl,
													target: "_blank",
													rel: "noopener noreferrer",
													className: "inline-flex items-center gap-1 h-7 px-2.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 text-[11px] font-bold transition-colors",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "h-3 w-3" }), " Get Directions"]
												})]
											})]
										})
									});
								})(),
								currentRental && !folderDocuments.some((d) => d.type === "Agreement") && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
									className: "relative border border-primary/20 hover:border-primary/45 hover:shadow-[var(--shadow-elevated)] bg-primary/5/5 transition-all duration-200",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
										className: "p-4 flex flex-col justify-between h-[160px]",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-start gap-3",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "metric-icon h-11 w-11 bg-accent/15 text-accent border border-accent/20",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileCheckCorner, { className: "h-5 w-5" })
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex-1 min-w-0",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h4", {
													className: "font-semibold text-[13px] text-foreground leading-snug truncate",
													children: [
														"Agreement_",
														currentRental.id,
														".pdf"
													]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "inline-flex items-center gap-1.5 rounded-md border border-accent/18 bg-accent/10 px-2 py-0.5 text-[9px] font-bold text-accent mt-1.5",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-1.5 w-1.5 rounded-full bg-accent" }), "System Agreement"]
												})]
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-between border-t border-border/40 pt-2 mt-4",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-[11px] text-muted-foreground",
												children: "Auto-generated"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
												size: "sm",
												variant: "outline",
												className: "h-7 px-2.5 text-[11px] gap-1 hover:bg-primary/5 hover:text-primary",
												onClick: () => {
													downloadAgreementFile(currentRental);
													toast.success("Downloading rental agreement PDF...");
												},
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "h-3 w-3" }), " Get PDF"]
											})]
										})]
									})
								}),
								currentRental && currentReturns.map((ret) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
									className: "relative border border-orange-500/25 hover:border-orange-500/45 hover:shadow-[var(--shadow-elevated)] bg-orange-500/5 transition-all duration-200",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
										className: "p-4 flex flex-col justify-between h-[160px]",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-start gap-3",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "metric-icon h-11 w-11 bg-orange-500/15 text-orange-600 border border-orange-500/20",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileCheckCorner, { className: "h-5 w-5" })
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex-1 min-w-0",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h4", {
														className: "font-semibold text-[13px] text-foreground leading-snug truncate",
														children: [
															"Return_Agreement_",
															ret.id,
															".pdf"
														]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "inline-flex items-center gap-1.5 rounded-md border border-orange-500/20 bg-orange-500/10 px-2 py-0.5 text-[9px] font-bold text-orange-600 mt-1.5",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-1.5 w-1.5 rounded-full bg-orange-500" }), "Return Agreement"]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
														className: "text-[10px] text-muted-foreground mt-1.5",
														children: ["Returned on ", formatDateDDMMYYYY(ret.date)]
													})
												]
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-between border-t border-border/40 pt-2 mt-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-[11px] text-muted-foreground",
												children: ret.id
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
												size: "sm",
												variant: "outline",
												className: "h-7 px-2.5 text-[11px] gap-1 hover:bg-orange-500/10 hover:text-orange-600 hover:border-orange-500/30",
												onClick: () => {
													printReturnReceipt(ret);
													toast.success("Generating return agreement PDF...");
												},
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "h-3 w-3" }), " Get PDF"]
											})]
										})]
									})
								}, ret.id)),
								folderDocuments.map((d, i) => {
									const { icon: DocIcon, color, dotColor } = getDocDetails(d.type);
									return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
										className: "relative border border-border/60 hover:border-primary/30 hover:shadow-[var(--shadow-elevated)] transition-all duration-200",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
											className: "p-4 flex flex-col justify-between h-[160px]",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-start gap-3",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: `metric-icon h-11 w-11 ${color}`,
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DocIcon, { className: "h-5 w-5" })
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex-1 min-w-0",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
														className: "font-semibold text-[13px] text-foreground leading-snug truncate",
														title: d.name,
														children: d.name
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: `inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[9px] font-bold mt-1.5 ${color}`,
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `h-1.5 w-1.5 rounded-full ${dotColor}` }), d.type]
													})]
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center justify-between border-t border-border/40 pt-2 mt-4",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "text-[11px] text-muted-foreground",
													children: [
														d.size,
														" · ",
														formatDateDDMMYYYY(d.date)
													]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex gap-1.5",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
															size: "icon",
															variant: "ghost",
															className: "h-7 w-7 text-muted-foreground hover:text-foreground",
															title: "Preview File",
															onClick: () => {
																setIsPreviewLoading(true);
																setPreviewDoc(d);
															},
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { className: "h-3.5 w-3.5" })
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
															size: "icon",
															variant: "ghost",
															className: "h-7 w-7 text-muted-foreground hover:text-foreground",
															title: "Download / Print File",
															onClick: async () => {
																if (await printDocumentFile(d)) toast.success(`Opening download file: ${d.name}`);
																else toast.error(`"${d.name}" isn't available on this device and hasn't been backed up to Google Sheets yet.`);
															},
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "h-3.5 w-3.5" })
														}),
														!isStaff && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
															size: "icon",
															variant: "ghost",
															className: "h-7 w-7 text-destructive hover:bg-destructive/5",
															title: "Delete File",
															onClick: () => setDeleteDoc(d),
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-3.5 w-3.5" })
														})
													]
												})]
											})]
										})
									}, d.id);
								}),
								folderDocuments.length === 0 && !currentRental && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "col-span-full py-16 text-center",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/30 text-muted-foreground mb-4",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileDigit, { className: "h-8 w-8" })
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[14px] font-semibold",
											children: "No files inside folder"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[12px] text-muted-foreground mt-1",
											children: "Upload a document file to get started."
										})
									]
								})
							]
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: !!previewDoc,
				onOpenChange: (open) => {
					if (!open) {
						setPreviewDoc(null);
						setIsPreviewLoading(false);
					}
				},
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
					className: "max-w-4xl h-[85vh] flex flex-col p-5 overflow-hidden",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, {
							className: "pb-2 border-b border-border/50",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Document Preview" })
						}),
						previewDoc && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex-1 min-h-0 flex flex-col space-y-3 mt-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex items-center justify-between",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
									className: "font-bold text-[14px] text-foreground",
									children: previewDoc.name
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-[11px] text-muted-foreground mt-0.5",
									children: [
										previewDoc.type,
										" · ",
										previewDoc.size,
										" · Uploaded ",
										formatDateDDMMYYYY(previewDoc.date)
									]
								})] })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex-1 min-h-0 border border-border/60 rounded-xl overflow-hidden bg-muted/10 w-full relative",
								children: isPreviewLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-col items-center justify-center w-full h-full gap-4",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-10 w-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[13px] text-muted-foreground font-medium",
										children: "Loading document preview…"
									})]
								}) : previewDoc.fileData && previewDoc.fileData !== "NOT_FOUND" && (previewDoc.fileData.startsWith("data:image/") || previewDoc.fileData.startsWith("data:") && previewDoc.name.toLowerCase().match(/\.(png|jpe?g|gif|webp|svg)$/)) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex items-center justify-center w-full h-full p-2 bg-white",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
										src: previewDoc.fileData,
										className: "max-h-full max-w-full object-contain rounded-lg shadow-sm",
										alt: previewDoc.name
									})
								}) : previewDoc.fileData && previewDoc.fileData !== "NOT_FOUND" && previewDoc.fileData.startsWith("data:application/pdf") ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("iframe", {
									src: previewDoc.fileData,
									className: "w-full h-full border-0 bg-white",
									title: previewDoc.name
								}) : previewDoc.fileData === "NOT_FOUND" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-col items-center justify-center bg-muted/5 border border-border/40 rounded-xl p-8 h-full text-center",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldAlert, { className: "h-10 w-10 text-destructive mb-3" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h5", {
											className: "font-bold text-[14px] text-foreground",
											children: "File Content Not Available"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[12px] text-muted-foreground mt-1 max-w-md",
											children: "This file was not found on this device's storage. Files uploaded on another device may not be available here unless Google Sheets sync is enabled."
										})
									]
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("iframe", {
									src: getDocumentPreviewUrl(previewDoc),
									className: "w-full h-full border-0 bg-white",
									title: previewDoc.name
								})
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
							className: "sm:justify-between border-t border-border/50 pt-4 mt-4",
							children: [previewDoc && !isStaff && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "ghost",
								className: "text-destructive hover:bg-destructive/10 hover:text-destructive text-[13px] h-9",
								onClick: () => {
									setDeleteDoc(previewDoc);
									setPreviewDoc(null);
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "mr-1.5 h-3.5 w-3.5" }), " Delete"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "outline",
									className: "h-9 text-[13px]",
									onClick: () => setPreviewDoc(null),
									children: "Close"
								}), previewDoc && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									className: "h-9 text-[13px]",
									disabled: previewDoc.fileData === "NOT_FOUND",
									title: previewDoc.fileData === "NOT_FOUND" ? "Not available on this device or in Google Sheets" : void 0,
									onClick: async () => {
										if (previewDoc.fileData && previewDoc.fileData !== "NOT_FOUND" && previewDoc.fileData.startsWith("data:")) {
											downloadBase64File(previewDoc.fileData, previewDoc.name);
											toast.success(`Downloading file: ${previewDoc.name}`);
										} else if (await printDocumentFile(previewDoc)) toast.success(`Opening download file: ${previewDoc.name}`);
										else toast.error(`"${previewDoc.name}" isn't available on this device and hasn't been backed up to Google Sheets yet.`);
									},
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "mr-1.5 h-3.5 w-3.5" }), " Download File"]
								})]
							})]
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: !!deleteDoc,
				onOpenChange: (open) => !open && setDeleteDoc(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
					className: "max-w-md",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, {
							className: "text-destructive flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldAlert, { className: "h-4 w-4" }), " Delete Document"]
						}) }),
						deleteDoc && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "py-2 space-y-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-[13px] text-muted-foreground",
								children: [
									"Are you sure you want to delete ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
										className: "text-foreground",
										children: deleteDoc.name
									}),
									"?"
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-[12px] text-destructive",
								children: "⚠️ This will permanently delete the document from the cloud servers. This action is irreversible."
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							onClick: () => setDeleteDoc(null),
							children: "Cancel"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "destructive",
							onClick: handleDelete,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "mr-1.5 h-3.5 w-3.5" }), " Permanently Delete"]
						})] })
					]
				})
			})
		]
	});
}
//#endregion
export { DocsPage as component };
