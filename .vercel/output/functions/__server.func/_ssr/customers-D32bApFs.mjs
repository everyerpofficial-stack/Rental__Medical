import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { A as getNextDocumentNumber, C as getDocuments, D as getLocalYYYYMMDD, K as printDocumentFile, P as getNextPaymentNumber, R as getPayments, S as getDocumentWithFile, V as getReturns, X as saveCustomer, Z as saveDocument, b as getCustomers, d as downloadAgreementFile, f as downloadBase64File, g as formatDateDDMMYYYY, it as sortLatestFirst, k as getNextCustomerNumber, o as deleteCustomer, p as downloadExcel, q as printReceipt, rt as saveReturn, st as useDatabaseTrigger, tt as savePayment, x as getDocumentPreviewUrl, y as getCustomerDueBalance, z as getRentals } from "./data-store-BXBhFJro.mjs";
import { c as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { B as Mail, Ct as CircleCheck, Dt as ChevronRight, M as Phone, O as Receipt, R as MapPinned, X as Hash, at as FileText, bt as Clock, d as UserCheck, et as FolderOpen, gt as CreditCard, h as Trash2, j as Plus, l as UserX, lt as FileCheckCorner, mt as Download, o as Users, p as TriangleAlert, st as FileImage, ut as Eye, v as SquarePen, w as Search, z as MapPin } from "../_libs/lucide-react.mjs";
import { a as DialogFooter, c as DialogTrigger, i as DialogContent, l as Input, n as Dialog, o as DialogHeader, r as DialogClose, s as DialogTitle, t as Button, u as Label } from "./dialog-BHa0LWsH.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as AgreementPreviewDialog } from "./rentals-Wmde1g9_.mjs";
import { t as Textarea } from "./textarea-DE2ysOZI.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-C2rs2HGz.mjs";
import { a as CardContent, h as StatusBadge, i as Card, n as Avatar, o as CardHeader, r as AvatarFallback, t as AppShell } from "./AppShell-ABaTd-bJ.mjs";
import { a as TableHeader, i as TableHead, n as TableBody, o as TableRow, r as TableCell, t as Table } from "./table-DDeHIPcn.mjs";
import { i as TabsTrigger, n as TabsContent, r as TabsList, t as Tabs } from "./tabs-BoOa83d5.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/customers-D32bApFs.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var avatarHues = [
	"bg-primary/15 text-primary",
	"bg-accent/15 text-accent",
	"bg-success/12 text-success",
	"bg-warning/15 text-warning-foreground",
	"bg-destructive/12 text-destructive",
	"bg-muted text-muted-foreground"
];
function CustomerFormDialog({ trigger, title, customer, onSave }) {
	const [open, setOpen] = (0, import_react.useState)(false);
	const [name, setName] = (0, import_react.useState)(customer?.name || "");
	const [phone, setPhone] = (0, import_react.useState)(customer?.phone || "");
	const [altPhone, setAltPhone] = (0, import_react.useState)(customer?.altPhone || "");
	const [contactNumber3, setContactNumber3] = (0, import_react.useState)(customer?.contactNumber3 || "");
	const [email, setEmail] = (0, import_react.useState)(customer?.email || "");
	const [aadhaar, setAadhaar] = (0, import_react.useState)(customer?.aadhaar || "");
	const [pan, setPan] = (0, import_react.useState)(customer?.pan || "");
	const [address, setAddress] = (0, import_react.useState)(customer?.address || "");
	const [area, setArea] = (0, import_react.useState)(customer?.area || "");
	const [city, setCity] = (0, import_react.useState)(customer?.city || "Mysore");
	const [state, setState] = (0, import_react.useState)(customer?.state || "Karnataka");
	const [pincode, setPincode] = (0, import_react.useState)(customer?.pincode || "");
	const [notes, setNotes] = (0, import_react.useState)(customer?.notes || "");
	const [selectedFiles, setSelectedFiles] = (0, import_react.useState)([]);
	const [isSubmitting, setIsSubmitting] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (open) {
			setName(customer?.name || "");
			setPhone(customer?.phone || "");
			setAltPhone(customer?.altPhone || "");
			setContactNumber3(customer?.contactNumber3 || "");
			setEmail(customer?.email || "");
			setAadhaar(customer?.aadhaar || "");
			setPan(customer?.pan || "");
			setAddress(customer?.address || "");
			setArea(customer?.area || "");
			setCity(customer?.city || "Mysore");
			setState(customer?.state || "Karnataka");
			setPincode(customer?.pincode || "");
			setNotes(customer?.notes || "");
			setSelectedFiles([]);
			if (customer?.id) try {
				const docs = getDocuments().filter((d) => d.customerId === customer.id && d.type === "ID Proof");
				Promise.all(docs.map((d) => getDocumentWithFile(d))).then((fullDocs) => {
					setSelectedFiles(fullDocs.map((d) => ({
						id: d.id,
						name: d.name,
						size: d.size,
						fileData: d.fileData !== "NOT_FOUND" ? d.fileData : void 0,
						isExisting: true
					})));
				});
			} catch (_e) {}
		}
	}, [open, customer]);
	const handleSave = () => {
		if (isSubmitting) return;
		setIsSubmitting(true);
		if (!name.trim()) {
			toast.error("Please enter the customer's full name.");
			setIsSubmitting(false);
			return;
		}
		if (!phone.trim()) {
			toast.error("Please enter a primary phone number.");
			setIsSubmitting(false);
			return;
		}
		const isValidPhone = (p) => {
			return p.replace(/\D/g, "").length === 10;
		};
		if (!isValidPhone(phone)) {
			toast.error("Primary Phone Number must be exactly 10 digits.");
			setIsSubmitting(false);
			return;
		}
		if (altPhone.trim() && !isValidPhone(altPhone)) {
			toast.error("Alternative Phone Number must be exactly 10 digits.");
			setIsSubmitting(false);
			return;
		}
		if (contactNumber3.trim() && !isValidPhone(contactNumber3)) {
			toast.error("Alternative Phone 1 must be exactly 10 digits.");
			setIsSubmitting(false);
			return;
		}
		if (aadhaar.trim()) {
			if (aadhaar.replace(/\D/g, "").length !== 12) {
				toast.error("Aadhaar Number must contain exactly 12 digits.");
				setIsSubmitting(false);
				return;
			}
		}
		if (!city.trim()) {
			toast.error("Please enter the customer's city.");
			setIsSubmitting(false);
			return;
		}
		if (!state) {
			toast.error("Please select the customer's state.");
			setIsSubmitting(false);
			return;
		}
		const id = customer?.id || getNextCustomerNumber();
		saveCustomer({
			id,
			name: name.trim(),
			phone: phone.trim(),
			altPhone,
			contactNumber3,
			email,
			city: city.trim(),
			state,
			pincode,
			address: address || "No address provided",
			area: area.trim(),
			aadhaar,
			pan,
			rentals: customer?.rentals || 0,
			status: customer?.status || "Active",
			notes
		});
		selectedFiles.forEach((file) => {
			if (!file.isExisting && file.fileData) saveDocument({
				id: getNextDocumentNumber(),
				name: file.name,
				type: "ID Proof",
				size: file.size,
				date: getLocalYYYYMMDD(),
				customerId: id,
				fileData: file.fileData
			});
		});
		toast.success(customer ? `Customer details for "${name}" saved successfully.` : "New customer created successfully.");
		setIsSubmitting(false);
		setOpen(false);
		if (onSave) onSave();
	};
	const handleFilesAdded = (files) => {
		if (!files || files.length === 0) return;
		Array.from(files).forEach((file) => {
			const sizeKB = (file.size / 1024).toFixed(1);
			const reader = new FileReader();
			reader.onloadend = () => {
				setSelectedFiles((prev) => [...prev, {
					name: file.name,
					size: `${sizeKB} KB`,
					fileData: reader.result,
					isExisting: false
				}]);
			};
			reader.readAsDataURL(file);
		});
	};
	const removeFile = (index) => {
		setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, {
		open,
		onOpenChange: setOpen,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
			asChild: true,
			children: trigger
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "max-w-2xl max-h-[90vh] overflow-y-auto",
			onPointerDownOutside: (e) => e.preventDefault(),
			onEscapeKeyDown: (e) => e.preventDefault(),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: title }) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-4 py-2 sm:grid-cols-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Full Name",
							placeholder: "Patient or guardian name",
							className: "sm:col-span-2",
							value: name,
							onChange: (e) => setName(e.target.value)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "sm:col-span-2 border-b border-border/40 pb-1 mt-2",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
								className: "text-[11px] font-bold uppercase tracking-wider text-primary",
								children: "Address Details"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Address",
							placeholder: "Full address",
							value: address,
							onChange: (e) => setAddress(e.target.value)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Area",
							placeholder: "Area / Locality",
							value: area,
							onChange: (e) => setArea(e.target.value)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "City",
							value: city,
							onChange: (e) => setCity(e.target.value)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								className: "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
								children: "State"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
								value: state,
								onValueChange: setState,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Select state" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: ["Karnataka"].map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: s,
									children: s
								}, s)) })]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Pincode",
							value: pincode,
							onChange: (e) => setPincode(e.target.value)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "sm:col-span-2 border-b border-border/40 pb-1 mt-2",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
								className: "text-[11px] font-bold uppercase tracking-wider text-primary",
								children: "Contact Details"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Primary Number",
							placeholder: "10-digit phone number",
							value: phone,
							onChange: (e) => {
								const digits = e.target.value.replace(/\D/g, "");
								if (digits.length > 10) if (digits.startsWith("91")) setPhone(digits.slice(-10));
								else if (digits.startsWith("0")) setPhone(digits.slice(-10));
								else setPhone(digits.slice(0, 10));
								else setPhone(digits);
							},
							maxLength: 14
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Alternative Phone",
							placeholder: "optional (10 digits)",
							value: altPhone,
							onChange: (e) => {
								const digits = e.target.value.replace(/\D/g, "");
								if (digits.length > 10) if (digits.startsWith("91")) setAltPhone(digits.slice(-10));
								else if (digits.startsWith("0")) setAltPhone(digits.slice(-10));
								else setAltPhone(digits.slice(0, 10));
								else setAltPhone(digits);
							},
							maxLength: 14
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Alternative Phone 1",
							placeholder: "optional (10 digits)",
							value: contactNumber3,
							onChange: (e) => {
								const digits = e.target.value.replace(/\D/g, "");
								if (digits.length > 10) if (digits.startsWith("91")) setContactNumber3(digits.slice(-10));
								else if (digits.startsWith("0")) setContactNumber3(digits.slice(-10));
								else setContactNumber3(digits.slice(0, 10));
								else setContactNumber3(digits);
							},
							maxLength: 14
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Email",
							placeholder: "email@domain.com",
							value: email,
							onChange: (e) => setEmail(e.target.value)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "sm:col-span-2 border-b border-border/40 pb-1 mt-2",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
								className: "text-[11px] font-bold uppercase tracking-wider text-primary",
								children: "Government Verification"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Aadhaar Number",
							placeholder: "12-digit Aadhaar number",
							value: aadhaar,
							onChange: (e) => setAadhaar(e.target.value.replace(/\D/g, "").slice(0, 12)),
							maxLength: 12
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "PAN Number",
							placeholder: "ABCDE1234F",
							value: pan,
							onChange: (e) => setPan(e.target.value)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "sm:col-span-2 space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, {
									className: "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
									children: ["ID Proof Uploads ", selectedFiles.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-primary font-bold normal-case",
										children: [
											"(",
											selectedFiles.length,
											" file",
											selectedFiles.length === 1 ? "" : "s",
											")"
										]
									})]
								}), selectedFiles.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "text-[11px] font-medium text-primary hover:underline cursor-pointer flex items-center gap-1",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "h-3 w-3" }),
										" Add More Files",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "file",
											multiple: true,
											accept: ".pdf,.jpg,.jpeg,.png,application/pdf,image/*",
											className: "hidden",
											onChange: (e) => handleFilesAdded(e.target.files)
										})
									]
								})]
							}), selectedFiles.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[160px] overflow-y-auto p-1 border border-border/40 rounded-xl bg-muted/10",
								children: selectedFiles.map((file, idx) => {
									return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between gap-2 p-2 border border-border/60 rounded-lg bg-background shadow-xs hover:border-primary/40 transition-colors group",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-2 min-w-0 flex-1",
											children: [(file.fileData?.startsWith("data:image/") || /\.(jpg|jpeg|png|webp)$/i.test(file.name)) && file.fileData ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
												src: file.fileData,
												alt: "Preview",
												className: "h-8 w-8 rounded object-cover border border-border shrink-0"
											}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "h-8 w-8 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0",
												children: file.name.toLowerCase().endsWith(".pdf") ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "h-4 w-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileImage, { className: "h-4 w-4" })
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "min-w-0 flex-1",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-[12px] font-medium truncate text-foreground leading-tight",
													title: file.name,
													children: file.name
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
													className: "text-[10px] text-muted-foreground",
													children: [
														file.size,
														" ",
														file.isExisting && "· Saved"
													]
												})]
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											type: "button",
											variant: "ghost",
											size: "icon",
											className: "h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full shrink-0",
											onClick: () => removeFile(idx),
											title: "Remove file",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-3.5 w-3.5" })
										})]
									}, idx);
								})
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								htmlFor: "customer-id-proof-upload",
								className: "flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-border/70 rounded-xl cursor-pointer bg-muted/20 hover:bg-primary/5 hover:border-primary/40 transition-all duration-200 group relative overflow-hidden",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-col items-center gap-1 text-muted-foreground group-hover:text-primary transition-colors",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileImage, { className: "h-6 w-6 mb-0.5" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[13px] font-medium",
											children: "Click or Drag to upload ID Proofs"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[11px]",
											children: "Multiple Aadhaar, PAN, Photo — PDF or image files supported"
										})
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									id: "customer-id-proof-upload",
									type: "file",
									multiple: true,
									accept: ".pdf,.jpg,.jpeg,.png,application/pdf,image/*",
									className: "absolute inset-0 opacity-0 cursor-pointer w-full h-full",
									onChange: (e) => handleFilesAdded(e.target.files)
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "sm:col-span-2 space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								className: "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
								children: "Notes"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
								placeholder: "Any special notes about this customer…",
								className: "resize-none min-h-[70px]",
								value: notes,
								onChange: (e) => setNotes(e.target.value)
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogClose, {
					asChild: true,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						type: "button",
						children: "Cancel"
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					onClick: handleSave,
					disabled: isSubmitting,
					children: "Save Customer"
				})] })
			]
		})]
	});
}
function DeleteCustomerDialog({ customer, trigger, onDelete }) {
	const handleDelete = () => {
		deleteCustomer(customer.id);
		toast.success(`Customer "${customer.name}" successfully deleted.`);
		if (onDelete) onDelete();
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
		asChild: true,
		children: trigger
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
		className: "max-w-md",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, {
				className: "text-destructive flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-4 w-4" }), " Delete Customer"]
			}) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "py-2 space-y-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm text-muted-foreground",
					children: [
						"Are you sure you want to delete ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
							className: "text-foreground",
							children: customer.name
						}),
						"?"
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "rounded-lg border border-destructive/18 bg-destructive/5 p-3 text-[12px] text-destructive",
					children: "This will permanently remove the customer and all associated data. This action cannot be undone."
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogClose, {
				asChild: true,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "outline",
					type: "button",
					children: "Cancel"
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogClose, {
				asChild: true,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "destructive",
					type: "button",
					onClick: handleDelete,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "mr-1.5 h-3.5 w-3.5" }), "Delete"]
				})
			})] })
		]
	})] });
}
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
			color: "text-success bg-success/10 border-success/20",
			dotColor: "bg-success"
		};
		case "Receipt": return {
			icon: Receipt,
			color: "text-warning-foreground bg-warning/10 border-warning/20",
			dotColor: "bg-warning-foreground"
		};
		default: return {
			icon: FileText,
			color: "text-muted-foreground bg-muted/10 border-border/60",
			dotColor: "bg-muted-foreground"
		};
	}
};
function CustomerProfileDialog({ customer, open, onClose }) {
	if (!customer) return null;
	const rentals = getRentals();
	const payments = getPayments();
	const documents = getDocuments();
	const returns = getReturns();
	const [previewDoc, setPreviewDoc] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		if (previewDoc && !previewDoc.fileData && previewDoc.type !== "Agreement" && !previewDoc.id.startsWith("doc-ret-") && !previewDoc.id.startsWith("doc-pay-")) getDocumentWithFile(previewDoc).then((fullDoc) => {
			setPreviewDoc(fullDoc);
		});
	}, [previewDoc]);
	const custRentals = rentals.filter((r) => r.customerId === customer.id);
	const custPayments = payments.filter((p) => p.customerId === customer.id);
	const custDocs = documents.filter((d) => d.customerId === customer.id || d.rentalId && custRentals.some((r) => r.id === d.rentalId));
	const custKYCDocs = custDocs.filter((d) => d.type === "ID Proof");
	const initials = customer.name.split(" ").map((n) => n[0]).slice(0, 2).join("");
	const totalPaid = custPayments.filter((p) => p.status === "Paid").reduce((sum, p) => sum + p.amount, 0);
	const totalPending = getCustomerDueBalance(customer.id, customer.name).totalDue;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange: (val) => !val && onClose(),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-2xl border border-border/80 shadow-[0_20px_50px_rgba(0,0,0,0.15)] bg-background",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "bg-gradient-to-r from-primary/10 via-accent/5 to-card p-6 border-b border-border/60 relative",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Avatar, {
								className: "h-16 w-16 border-2 border-background shadow-sm",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarFallback, {
									className: "bg-primary/15 text-primary font-bold text-xl",
									children: initials
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2.5 flex-wrap",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "font-display text-[20px] font-bold text-foreground leading-tight",
										children: customer.name
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, { status: customer.status })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-[11px] font-mono text-muted-foreground/80 mt-1",
									children: ["Customer ID: ", customer.id]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-[12.5px] text-muted-foreground mt-0.5",
									children: [
										customer.city,
										", ",
										customer.state
									]
								})
							] })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-2 self-start sm:self-center",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "outline",
								size: "sm",
								className: "h-8.5 rounded-lg text-[12px] gap-1.5",
								onClick: () => window.open(`tel:${customer.phone}`),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, { className: "h-3.5 w-3.5" }), "Call Customer"]
							}), customer.email && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "outline",
								size: "sm",
								className: "h-8.5 rounded-lg text-[12px] gap-1.5",
								onClick: () => window.open(`mailto:${customer.email}`),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mail, { className: "h-3.5 w-3.5" }), "Email"]
							})]
						})]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
					defaultValue: "overview",
					className: "w-full flex flex-col",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "border-b border-border/50 bg-muted/15 px-6",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, {
							className: "bg-transparent border-0 gap-2 h-11 p-0 justify-start",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
									value: "overview",
									className: "data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-11 px-4 text-[12.5px] font-semibold",
									children: "Overview & KYC"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsTrigger, {
									value: "rentals",
									className: "data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-11 px-4 text-[12.5px] font-semibold",
									children: [
										"Rentals (",
										custRentals.length,
										")"
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsTrigger, {
									value: "payments",
									className: "data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-11 px-4 text-[12.5px] font-semibold",
									children: [
										"Payments & Dues (",
										custPayments.length,
										")"
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsTrigger, {
									value: "documents",
									className: "data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-11 px-4 text-[12.5px] font-semibold",
									children: [
										"Documents (",
										custKYCDocs.length,
										")"
									]
								})
							]
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "p-6",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
								value: "overview",
								className: "mt-0 focus-visible:ring-0 focus-visible:outline-none",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid gap-6 md:grid-cols-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "md:col-span-2 space-y-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "rounded-xl border border-border/60 bg-card p-4 space-y-3.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
												className: "text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-2",
												children: "Demographics & Address"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "grid gap-x-4 gap-y-3 sm:grid-cols-2 text-[13px]",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InfoRow, {
														icon: Phone,
														label: "Primary Phone",
														value: customer.phone
													}),
													customer.altPhone && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InfoRow, {
														icon: Phone,
														label: "Alt Phone",
														value: customer.altPhone
													}),
													customer.contactNumber3 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InfoRow, {
														icon: Phone,
														label: "Alt Phone 1",
														value: customer.contactNumber3
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InfoRow, {
														icon: Mail,
														label: "Email",
														value: customer.email || "—"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InfoRow, {
														icon: MapPin,
														label: "City / State",
														value: `${customer.city}, ${customer.state}`
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InfoRow, {
														icon: Hash,
														label: "Pincode",
														value: customer.pincode || "—"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InfoRow, {
														icon: MapPin,
														label: "Area",
														value: customer.area || "—"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InfoRow, {
														icon: MapPinned,
														label: "Full Address",
														value: customer.address
													})
												]
											})]
										}), customer.notes && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "rounded-xl border border-border/60 bg-muted/15 p-4",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 mb-1.5",
												children: "Internal Notes"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[13px] text-foreground/80 leading-relaxed",
												children: customer.notes
											})]
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "rounded-xl border border-border/60 bg-card p-4 space-y-3.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
												className: "text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-2",
												children: "Government Verification"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "space-y-3",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "rounded-lg bg-muted/30 p-2.5 border border-border/40",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "text-[10px] font-semibold text-muted-foreground uppercase tracking-wider",
														children: "Aadhaar (KYC)"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "font-mono font-bold text-[13px] text-foreground mt-0.5",
														children: customer.aadhaar || "Pending Upload"
													})]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "rounded-lg bg-muted/30 p-2.5 border border-border/40",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "text-[10px] font-semibold text-muted-foreground uppercase tracking-wider",
														children: "PAN Card"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "font-mono font-bold text-[13px] text-foreground mt-0.5",
														children: customer.pan || "Pending Upload"
													})]
												})]
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "rounded-xl border border-border/60 bg-card p-4",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
												className: "text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-2",
												children: "KYC Documents"
											}), custDocs.filter((d) => d.type === "ID Proof").length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[12px] text-muted-foreground py-2 italic",
												children: "No ID Proof uploaded yet."
											}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "space-y-2",
												children: custDocs.filter((d) => d.type === "ID Proof").map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center justify-between gap-2 rounded-lg border border-border/50 p-2 hover:bg-muted/15 transition-all",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "min-w-0 flex-1",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
															className: "text-[12.5px] font-semibold truncate text-foreground",
															children: d.name
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
															className: "text-[10px] text-muted-foreground",
															children: [
																d.size,
																" · ",
																formatDateDDMMYYYY(d.date)
															]
														})]
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
														variant: "outline",
														size: "sm",
														className: "h-7 text-[11px] px-2 rounded-md shrink-0",
														onClick: () => setPreviewDoc(d),
														children: "View"
													})]
												}, d.id))
											})]
										})]
									})]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
								value: "rentals",
								className: "mt-0 focus-visible:ring-0 focus-visible:outline-none",
								children: custRentals.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "text-center py-12 border border-dashed rounded-2xl bg-muted/10 border-border/60",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FolderOpen, { className: "h-8 w-8 mx-auto text-muted-foreground/45 mb-2.5" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[13px] font-semibold text-foreground",
											children: "No Rentals Found"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[12px] text-muted-foreground mt-0.5",
											children: "This customer has no active or past agreements."
										})
									]
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "grid gap-4 md:grid-cols-2",
									children: custRentals.map((r) => {
										const returnDetails = returns.find((ret) => ret.agreement === r.id);
										return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
											className: "hover:border-primary/30 transition-all border-border/60 overflow-hidden shadow-sm hover:shadow-md",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, {
												className: "bg-muted/15 px-4.5 py-3 border-b border-border/50 flex flex-row items-center justify-between gap-2.5 space-y-0",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "font-mono text-[11.5px] font-bold text-primary",
													children: r.id
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, { status: r.status })]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
												className: "p-4 space-y-3.5",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
															className: "text-[10px] font-semibold text-muted-foreground uppercase tracking-wider",
															children: "Rented Equipment"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
															className: "text-[14px] font-bold text-foreground mt-0.5",
															children: r.equipment
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
															className: "text-[10.5px] font-mono text-muted-foreground mt-0.5",
															children: ["Serial: ", r.serial]
														})
													] }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "grid grid-cols-2 gap-3.5 bg-muted/15 p-3 rounded-lg border border-border/40 text-[12px]",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "text-muted-foreground",
																children: "Monthly Rent"
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
																className: "font-bold text-[13.5px] text-foreground mt-0.5",
																children: [
																	"₹",
																	r.monthlyRent.toLocaleString("en-IN"),
																	"/mo"
																]
															})] }),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "text-muted-foreground",
																children: "Security Deposit"
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
																className: "font-semibold text-[13px] text-foreground mt-0.5",
																children: ["₹", r.deposit.toLocaleString("en-IN")]
															})] }),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "col-span-2 border-t border-border/40 pt-2 flex items-center justify-between text-[11px] text-muted-foreground",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Period" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																	className: "font-medium text-foreground",
																	children: [
																		r.start,
																		" → ",
																		r.end
																	]
																})]
															})
														]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "grid grid-cols-3 gap-2 text-[11px] border-b border-border/40 pb-2.5",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "text-muted-foreground",
																children: "Delivery"
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
																className: "font-semibold mt-0.5",
																children: ["₹", r.deliveryCharges]
															})] }),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "text-muted-foreground",
																children: "Installation"
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
																className: "font-semibold mt-0.5",
																children: ["₹", r.installationCharges]
															})] }),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "text-muted-foreground",
																children: "Additional"
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
																className: "font-semibold mt-0.5",
																children: ["₹", r.additionalCharges]
															})] })
														]
													}),
													r.remarks && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "text-[12px] bg-amber-50/20 dark:bg-amber-950/10 border border-amber-200/40 p-2.5 rounded-md text-foreground/80",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Remarks:" }),
															" ",
															r.remarks
														]
													}),
													returnDetails && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "text-[12px] bg-green-50/20 dark:bg-green-950/10 border border-green-200/40 p-2.5 rounded-md text-foreground/80",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Returned:" }),
															" ",
															formatDateDDMMYYYY(returnDetails.date),
															" (",
															returnDetails.condition,
															" Condition)",
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
																className: "text-[10px] text-muted-foreground mt-0.5",
																children: [
																	"Refund: ₹",
																	returnDetails.refund,
																	" · Balance: ₹",
																	returnDetails.pendingBalance
																]
															})
														]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex gap-2 pt-1 border-t border-border/30 justify-between items-center",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "text-[10px] text-muted-foreground",
															children: "Digital Agreement"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "flex gap-1.5",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AgreementPreviewDialog, {
																rental: r,
																trigger: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
																	variant: "outline",
																	size: "sm",
																	className: "h-7 text-[11px] px-2 rounded-md",
																	children: "Preview"
																})
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
																variant: "outline",
																size: "sm",
																className: "h-7 text-[11px] px-2 rounded-md",
																onClick: () => {
																	downloadAgreementFile(r);
																	toast.success(`Agreement downloaded for ${r.id}`);
																},
																children: "Download"
															})]
														})]
													})
												]
											})]
										}, r.id);
									})
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
								value: "payments",
								className: "mt-0 focus-visible:ring-0 focus-visible:outline-none",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-6",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "grid gap-4 sm:grid-cols-3",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "rounded-xl border border-border/60 bg-success/5 p-4.5",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "text-[11px] font-bold text-success uppercase tracking-wider",
															children: "Total Amount Paid"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h5", {
															className: "font-display text-[22px] font-bold text-success mt-1",
															children: ["₹", totalPaid.toLocaleString("en-IN")]
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
															className: "text-[10.5px] text-muted-foreground mt-1",
															children: [
																"Received from ",
																custPayments.filter((p) => p.status === "Paid").length,
																" payments"
															]
														})
													]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "rounded-xl border border-border/60 bg-destructive/5 p-4.5",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "text-[11px] font-bold text-destructive uppercase tracking-wider",
															children: "Pending Dues"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h5", {
															className: "font-display text-[22px] font-bold text-destructive mt-1",
															children: ["₹", totalPending.toLocaleString("en-IN")]
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
															className: "text-[10.5px] text-muted-foreground mt-1",
															children: "Includes overdue rentals & balances"
														})
													]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "rounded-xl border border-border/60 bg-card p-4.5 flex flex-col justify-between",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "text-[11px] font-bold text-muted-foreground uppercase tracking-wider",
														children: "Payment Standing"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "text-[13px] font-semibold text-foreground mt-1.5",
														children: customer.status === "Active" ? "🟢 Good Standing" : customer.status === "Overdue" ? "🔴 Balance Overdue" : "🟡 Action Required"
													})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "text-[10.5px] text-muted-foreground mt-1.5 leading-snug",
														children: "Requires attention when tracking monthly billing cycles"
													})]
												})
											]
										}),
										customer.status === "Overdue" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "rounded-xl border border-destructive/20 bg-destructive/5 p-4 flex gap-3.5 items-start",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "h-5 w-5 text-destructive shrink-0 mt-0.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h5", {
												className: "font-bold text-[13.5px] text-destructive leading-tight",
												children: "Payment Overdue Notice"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "text-[12.5px] text-destructive/80 mt-1 leading-relaxed",
												children: [
													"This customer has rentals marked as **Overdue** (e.g. ",
													custRentals.filter((r) => r.status === "Overdue").map((r) => r.id).join(", "),
													"). Please contact the customer to clear the pending balance of **₹",
													totalPending.toLocaleString("en-IN"),
													"** at the earliest."
												]
											})] })]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "rounded-xl border border-border/60 bg-card overflow-hidden",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "px-4.5 py-3 border-b border-border/50 bg-muted/20",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
													className: "text-[12.5px] font-bold text-foreground",
													children: "Transaction & Invoicing History"
												})
											}), custPayments.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[12.5px] text-muted-foreground text-center py-8",
												children: "No payments recorded."
											}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "overflow-x-auto",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, {
													className: "bg-muted/5",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
															className: "text-[11.5px] h-9",
															children: "Date"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
															className: "text-[11.5px] h-9",
															children: "Transaction ID"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
															className: "text-[11.5px] h-9",
															children: "Agreement"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
															className: "text-[11.5px] h-9",
															children: "Type"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
															className: "text-[11.5px] h-9",
															children: "Mode"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
															className: "text-[11.5px] h-9 text-right",
															children: "Amount"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
															className: "text-[11.5px] h-9",
															children: "Status"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
															className: "text-[11.5px] h-9 text-right",
															children: "Invoice"
														})
													] })
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableBody, { children: custPayments.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, {
													className: "text-[12.5px]",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
															className: "py-2.5 font-medium",
															children: formatDateDDMMYYYY(p.date)
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
															className: "py-2.5 font-mono text-[11px] text-muted-foreground",
															children: p.id
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
															className: "py-2.5 font-mono text-[11px] text-primary",
															children: p.agreement
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
															className: "py-2.5",
															children: p.type
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, {
															className: "py-2.5 text-muted-foreground",
															children: [
																p.mode,
																" ",
																p.txRef ? `(${p.txRef})` : ""
															]
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, {
															className: "py-2.5 text-right font-bold",
															children: ["₹", p.amount.toLocaleString("en-IN")]
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
															className: "py-2.5",
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, { status: p.status })
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
															className: "py-2.5 text-right",
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
																variant: "ghost",
																size: "sm",
																className: "h-6.5 text-[10px] px-1.5 rounded",
																onClick: () => {
																	printReceipt(p, customer.name);
																	toast.success(`Receipt PDF for ${p.id} generated successfully.`);
																},
																children: "Download"
															})
														})
													]
												}, p.id)) })] })
											})]
										})
									]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
								value: "documents",
								className: "mt-0 focus-visible:ring-0 focus-visible:outline-none",
								children: custKYCDocs.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "text-center py-12 border border-dashed rounded-2xl bg-muted/10 border-border/60",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FolderOpen, { className: "h-8 w-8 mx-auto text-muted-foreground/45 mb-2.5" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[13px] font-semibold text-foreground",
											children: "No Documents Found"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[12px] text-muted-foreground mt-0.5",
											children: "No contract or identity document is uploaded yet."
										})
									]
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "grid gap-4 sm:grid-cols-2 md:grid-cols-3",
									children: custKYCDocs.map((d) => {
										const isKYC = d.type === "ID Proof";
										const isAgreement = d.type === "Agreement";
										return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "group rounded-xl border border-border/60 bg-card p-3.5 hover:border-primary/30 transition-all shadow-sm",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-start gap-3",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: `metric-icon h-10 w-10 shrink-0 flex items-center justify-center rounded-lg ${isKYC ? "bg-primary/10 text-primary" : isAgreement ? "bg-accent/10 text-accent" : "bg-success/10 text-success"}`,
													children: isKYC ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileImage, { className: "h-4.5 w-4.5" }) : isAgreement ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileCheckCorner, { className: "h-4.5 w-4.5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "h-4.5 w-4.5" })
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "min-w-0 flex-1",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
															className: "font-semibold text-[13px] leading-tight truncate text-foreground",
															children: d.name
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: `inline-flex rounded px-1.5 py-0.2 text-[8.5px] font-bold uppercase tracking-wider mt-1 ${isKYC ? "bg-primary/10 text-primary" : isAgreement ? "bg-accent/10 text-accent" : "bg-success/10 text-success"}`,
															children: d.type
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
															className: "text-[10px] text-muted-foreground mt-1",
															children: [
																d.size,
																" · ",
																formatDateDDMMYYYY(d.date)
															]
														})
													]
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "mt-3 flex items-center gap-1.5 border-t border-border/40 pt-2 transition-opacity",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
													variant: "ghost",
													size: "sm",
													className: "h-6.5 text-[11px] px-2 rounded-md text-muted-foreground hover:text-foreground",
													onClick: () => setPreviewDoc(d),
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { className: "h-3.5 w-3.5 mr-1" }), " View"]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
													variant: "ghost",
													size: "sm",
													className: "h-6.5 text-[11px] px-2 rounded-md text-muted-foreground hover:text-foreground ml-auto",
													onClick: async () => {
														if (await printDocumentFile(d)) toast.success(`Opening print view for ${d.name}...`);
														else toast.error(`"${d.name}" isn't available on this device and hasn't been backed up to Google Sheets yet.`);
													},
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "h-3 w-3 mr-1" }), " Download"]
												})]
											})]
										}, d.id);
									})
								})
							})
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "border-t border-border/60 bg-muted/20 px-6 py-4 flex justify-end gap-2.5 rounded-b-2xl",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						className: "h-9.5 text-[13px] font-medium",
						onClick: onClose,
						children: "Close Window"
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
					open: !!previewDoc,
					onOpenChange: (open) => !open && setPreviewDoc(null),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
						className: "max-w-lg max-h-[92vh] overflow-y-auto p-5 md:p-6",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Document Preview" }) }),
							previewDoc && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "flex items-center gap-3 border-b border-border/50 pb-4",
										children: (() => {
											const { icon: DocIcon, color } = getDocDetails(previewDoc.type);
											return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: `metric-icon h-10 w-10 shrink-0 ${color}`,
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DocIcon, { className: "h-4.5 w-4.5" })
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "font-semibold text-[14px]",
												children: previewDoc.name
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "text-[12px] text-muted-foreground mt-0.5",
												children: [
													previewDoc.type,
													" · ",
													previewDoc.size,
													" · Uploaded ",
													formatDateDDMMYYYY(previewDoc.date)
												]
											})] })] });
										})()
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "flex items-center justify-center border border-border/60 rounded-xl overflow-hidden bg-muted/10 h-[280px] w-full",
										children: previewDoc.fileData && previewDoc.fileData !== "NOT_FOUND" && (previewDoc.fileData.startsWith("data:image/") || previewDoc.fileData.startsWith("data:") && previewDoc.name.toLowerCase().match(/\.(png|jpe?g|gif|webp|svg)$/)) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
											src: previewDoc.fileData,
											className: "max-h-full max-w-full object-contain rounded-lg shadow-sm",
											alt: previewDoc.name
										}) : previewDoc.fileData && previewDoc.fileData !== "NOT_FOUND" && previewDoc.fileData.startsWith("data:application/pdf") ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("iframe", {
											src: previewDoc.fileData,
											className: "w-full h-full border-0 bg-white",
											title: previewDoc.name
										}) : previewDoc.fileData === "NOT_FOUND" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex flex-col items-center justify-center bg-muted/5 border border-border/40 rounded-xl p-8 h-full text-center w-full",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "h-10 w-10 text-destructive mb-3" }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h5", {
													className: "font-bold text-[14px] text-foreground",
													children: "File Content Not Available"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-[12px] text-muted-foreground mt-1 max-w-md",
													children: "The file data could not be retrieved from IndexedDB or Google Sheets. If this file was uploaded from another browser/device, please ensure that GSheets sync is complete."
												})
											]
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("iframe", {
											src: getDocumentPreviewUrl(previewDoc),
											className: "w-full h-full border-0 bg-white",
											title: previewDoc.name
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-2 gap-3 text-[12px] bg-muted/20 p-4 rounded-xl border border-border/40",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-muted-foreground",
											children: "Document ID"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "font-mono font-bold mt-1 text-[13px] text-primary",
											children: previewDoc.id
										})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-muted-foreground",
											children: "Verified By"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "font-semibold mt-1 text-[13px]",
											children: "System Auditor"
										})] })]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogFooter, {
								className: "sm:justify-end border-t border-border/50 pt-4 mt-4",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
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
								})
							})
						]
					})
				})
			]
		})
	});
}
function InfoRow({ icon: Icon, label, value, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `flex items-start gap-2.5 py-2 border-b border-border/40 last:border-0 ${className ?? ""}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground/60" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground w-20 shrink-0",
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-[13px] text-foreground/80 flex-1",
				children: value
			})
		]
	});
}
function CustomerPayDueDialog({ customer, onSave }) {
	const [open, setOpen] = (0, import_react.useState)(false);
	const dueInfo = (0, import_react.useMemo)(() => getCustomerDueBalance(customer.id, customer.name), [customer, open]);
	const [payAmount, setPayAmount] = (0, import_react.useState)(dueInfo.totalDue.toString());
	const [paymentMode, setPaymentMode] = (0, import_react.useState)("Cash");
	const [paymentDate, setPaymentDate] = (0, import_react.useState)(() => getLocalYYYYMMDD());
	const [txRef, setTxRef] = (0, import_react.useState)("");
	const [cashAmount, setCashAmount] = (0, import_react.useState)("");
	const [bankAmount, setBankAmount] = (0, import_react.useState)("");
	const [isSubmitting, setIsSubmitting] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
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
			dueInfo.unpaidReturns.forEach((ret) => {
				const retDue = Math.abs(ret.refund || 0);
				if (remainingPayment >= retDue) {
					saveReturn({
						...ret,
						duePaymentStatus: "Paid",
						duePaymentMode: paymentMode,
						dueTxRef: txRef,
						status: "Completed"
					});
					remainingPayment -= retDue;
				}
			});
		}
		if (paymentMode === "Cash+Bank") {
			let cAmt = Number(cashAmount) || 0;
			let bAmt = Number(bankAmount) || 0;
			if (cAmt + bAmt !== amt) bAmt = Math.max(0, amt - cAmt);
			if (cAmt > 0) savePayment({
				id: getNextPaymentNumber(),
				date: paymentDate,
				customer: customer.name,
				customerId: customer.id,
				amount: cAmt,
				mode: "Cash",
				type: "Rent",
				notes: `Customer Due Balance Payment for ${customer.name} (Cash portion of ₹${amt.toLocaleString("en-IN")})`,
				status: "Paid"
			});
			if (bAmt > 0) savePayment({
				id: getNextPaymentNumber(),
				date: paymentDate,
				customer: customer.name,
				customerId: customer.id,
				amount: bAmt,
				mode: "Bank",
				type: "Rent",
				txRef,
				notes: `Customer Due Balance Payment for ${customer.name} (Bank portion of ₹${amt.toLocaleString("en-IN")})`,
				status: "Paid"
			});
		} else savePayment({
			id: getNextPaymentNumber(),
			date: paymentDate,
			customer: customer.name,
			customerId: customer.id,
			amount: amt,
			mode: paymentMode,
			type: "Rent",
			txRef,
			notes: `Customer Due Balance Payment for ${customer.name}`,
			status: "Paid"
		});
		toast.success(`₹${amt.toLocaleString("en-IN")} payment recorded for ${customer.name}! Customer dues updated.`);
		setIsSubmitting(false);
		setOpen(false);
		if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("medirent-db-updated"));
		onSave();
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
		variant: "outline",
		size: "sm",
		className: "h-7 px-2 text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border-rose-200 gap-1",
		onClick: () => setOpen(true),
		title: "Pay Customer Due",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CreditCard, { className: "h-3 w-3" }), " Pay Due"]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange: setOpen,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "max-w-md",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, {
					className: "flex items-center gap-2 text-rose-700",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CreditCard, { className: "h-4 w-4" }), " Settle Customer Due Balance"]
				}) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-4 py-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-xl border border-rose-200 bg-rose-50/50 p-3.5 space-y-2 text-[12.5px]",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between font-bold text-foreground",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: customer.name }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-mono text-muted-foreground",
									children: customer.id
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "space-y-1 border-t border-rose-200/60 pt-2 text-[11.5px]",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between text-[13.5px] font-black text-rose-800 pt-0.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "After Return Due Balance:" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["₹", dueInfo.totalDue.toLocaleString("en-IN")] })]
								})
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-2 gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									className: "text-[11px] font-bold uppercase tracking-wider text-muted-foreground",
									children: "Amount to Pay (₹)"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									type: "number",
									value: payAmount,
									onChange: (e) => setPayAmount(e.target.value),
									className: "h-9 font-bold text-foreground"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									className: "text-[11px] font-bold uppercase tracking-wider text-muted-foreground",
									children: "Payment Date"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									type: "date",
									value: paymentDate,
									onChange: (e) => setPaymentDate(e.target.value),
									className: "h-9 text-[13px]"
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								className: "text-[11px] font-bold uppercase tracking-wider text-muted-foreground",
								children: "Payment Mode"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
								value: paymentMode,
								onValueChange: (m) => {
									setPaymentMode(m);
									if (m === "Cash+Bank") {
										const amt = Number(payAmount) || 0;
										const cAmt = Math.round(amt / 2);
										setCashAmount(cAmt.toString());
										setBankAmount((amt - cAmt).toString());
									}
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
									className: "h-9 text-[13px] bg-background",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
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
										children: "Cash + Bank"
									})
								] })]
							})]
						}),
						paymentMode === "Cash+Bank" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-2 gap-3 p-3 bg-muted/20 rounded-lg border border-border",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									className: "text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400",
									children: "Cash Amount (₹)"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									type: "number",
									placeholder: "Cash portion",
									className: "h-9 text-[13px] font-semibold bg-emerald-50/20",
									value: cashAmount,
									onChange: (e) => {
										const val = e.target.value;
										setCashAmount(val);
										const amt = Number(payAmount) || 0;
										const cNum = Math.max(0, Number(val) || 0);
										setBankAmount(Math.max(0, amt - cNum).toString());
									}
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									className: "text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400",
									children: "Bank Amount (₹)"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									type: "number",
									placeholder: "Bank portion",
									className: "h-9 text-[13px] font-semibold bg-blue-50/20",
									value: bankAmount,
									onChange: (e) => {
										const val = e.target.value;
										setBankAmount(val);
										const amt = Number(payAmount) || 0;
										const bNum = Math.max(0, Number(val) || 0);
										setCashAmount(Math.max(0, amt - bNum).toString());
									}
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								className: "text-[11px] font-bold uppercase tracking-wider text-muted-foreground",
								children: "Transaction Reference (Optional)"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								placeholder: "UPI ref, cheque no, bank ref",
								value: txRef,
								onChange: (e) => setTxRef(e.target.value),
								className: "h-9 text-[13px]"
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogClose, {
					asChild: true,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						type: "button",
						children: "Cancel"
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					type: "button",
					className: "bg-emerald-600 hover:bg-emerald-700 text-white font-bold",
					onClick: handlePay,
					disabled: isSubmitting,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "mr-1.5 h-3.5 w-3.5" }), " Record Payment"]
				})] })
			]
		})
	})] });
}
function CustomersPage() {
	const dbVersion = useDatabaseTrigger();
	const [customers, setCustomers] = (0, import_react.useState)(() => getCustomers());
	const [profileCustomer, setProfileCustomer] = (0, import_react.useState)(null);
	const [profileOpen, setProfileOpen] = (0, import_react.useState)(false);
	const [search, setSearch] = (0, import_react.useState)("");
	const [cityFilter, setCityFilter] = (0, import_react.useState)("all");
	const [statusFilter, setStatusFilter] = (0, import_react.useState)("all-status");
	const isStaff = typeof window !== "undefined" && localStorage.getItem("medirent-user-role") === "Staff";
	const refresh = () => setCustomers(getCustomers());
	(0, import_react.useEffect)(() => {
		setCustomers(getCustomers());
	}, [dbVersion]);
	const rentalsList = (0, import_react.useMemo)(() => getRentals(), [dbVersion]);
	const filteredCustomers = sortLatestFirst(customers.filter((c) => {
		const q = search.toLowerCase().trim();
		const custRentals = rentalsList.filter((r) => r.customerId === c.id);
		const matchesSearch = !q || c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q) || String(c.phone || "").toLowerCase().includes(q) || String(c.altPhone || "").toLowerCase().includes(q) || String(c.contactNumber3 || "").toLowerCase().includes(q) || String(c.area || "").toLowerCase().includes(q) || String(c.address || "").toLowerCase().includes(q) || String(c.aadhaar || "").toLowerCase().includes(q) || String(c.pan || "").toLowerCase().includes(q) || custRentals.some((r) => String(r.serial || "").toLowerCase().includes(q) || String(r.equipment || "").toLowerCase().includes(q) || r.equipmentItems && r.equipmentItems.some((ei) => String(ei.serial || "").toLowerCase().includes(q)));
		const matchesCity = cityFilter === "all" || c.city.toLowerCase() === cityFilter.toLowerCase();
		const matchesStatus = statusFilter === "all-status" || c.status.toLowerCase() === statusFilter.toLowerCase();
		return matchesSearch && matchesCity && matchesStatus;
	}));
	const totalCount = customers.length;
	const activeCount = customers.filter((c) => c.status === "Active").length;
	const pendingCount = customers.filter((c) => c.status === "Pending").length;
	const overdueCount = customers.filter((c) => c.status === "Overdue").length;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "Customers",
		subtitle: "Manage your customer database and rental history",
		actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
			variant: "outline",
			size: "sm",
			onClick: () => {
				downloadExcel("customers_export.xls", [
					"Customer ID",
					"Name",
					"Primary Number",
					"Alternative Phone",
					"Alternative Phone 1",
					"Email",
					"City",
					"State",
					"Active Rentals",
					"Status"
				], customers.map((c) => [
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
				]), [
					110,
					200,
					120,
					120,
					120,
					220,
					120,
					120,
					110,
					100
				]);
				toast.success("Customer list exported successfully.");
			},
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "mr-1.5 h-3.5 w-3.5" }), "Export"]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CustomerFormDialog, {
			title: "New Customer",
			onSave: refresh,
			trigger: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				size: "sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "mr-1.5 h-3.5 w-3.5" }), "Add Customer"]
			})
		})] }),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mb-5 grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-4",
				children: [
					{
						l: "Total Customers",
						v: totalCount.toString(),
						icon: UserCheck,
						color: "text-primary",
						border: "border-border/60"
					},
					{
						l: "Active",
						v: activeCount.toString(),
						icon: UserCheck,
						color: "text-success",
						border: "border-border/60"
					},
					{
						l: "Pending KYC",
						v: pendingCount.toString(),
						icon: Clock,
						color: "text-warning-foreground",
						border: "border-border/60"
					},
					{
						l: "Overdue",
						v: overdueCount.toString(),
						icon: UserX,
						color: "text-destructive",
						border: "border-border/60"
					}
				].map((s, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
					className: `hover:shadow-[var(--shadow-elevated)] hover:-translate-y-0.5 transition-all animate-[fade-in_0.35s_ease-out_both] stagger-${i + 1}`,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
						className: "p-3.5 sm:p-5",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "metric-icon h-8 w-8 sm:h-9 sm:w-9",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(s.icon, { className: `h-3.5 w-3.5 sm:h-4 sm:w-4 ${s.color}` })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground/65 leading-tight",
								children: s.l
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: `mt-0.5 font-display text-[20px] sm:text-[22px] font-bold ${s.color}`,
								children: s.v
							})] })]
						})
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
								className: "relative flex-1 min-w-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									placeholder: "Search by name, phone, ID…",
									className: "pl-9 h-9 text-[13px] bg-card border-border/50 w-full",
									value: search,
									onChange: (e) => setSearch(e.target.value)
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2 overflow-x-auto pb-0.5 sm:pb-0",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-1.5 text-[12px] text-muted-foreground shrink-0",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "h-3.5 w-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
											className: "text-foreground",
											children: filteredCustomers.length
										}), " customers"] })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "flex-1" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
										value: cityFilter,
										onValueChange: setCityFilter,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
											className: "w-[120px] h-8 text-[12px] shrink-0",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: "all",
												children: "All Cities"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: "Mysore",
												children: "Mysore"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: "Bengaluru",
												children: "Bengaluru"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: "Chennai",
												children: "Chennai"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: "Mumbai",
												children: "Mumbai"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: "Hyderabad",
												children: "Hyderabad"
											})
										] })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
										value: statusFilter,
										onValueChange: setStatusFilter,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
											className: "w-[110px] h-8 text-[12px] shrink-0",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: "all-status",
												children: "All Status"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: "Active",
												children: "Active"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: "Pending",
												children: "Pending"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: "Overdue",
												children: "Overdue"
											})
										] })]
									})
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "hidden sm:block",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Customer" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Contact" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "City" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Rentals" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Due Balance" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Status" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
									className: "w-32 text-right",
									children: "Actions"
								})
							] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableBody, { children: [filteredCustomers.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableRow, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
								colSpan: 6,
								className: "py-12 text-center text-[13px] text-muted-foreground",
								children: "No customers match your search or filter."
							}) }), filteredCustomers.map((c, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, {
								className: "group",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Avatar, {
											className: "h-8 w-8",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarFallback, {
												className: `${avatarHues[idx % avatarHues.length]} text-[11px] font-bold`,
												children: c.name.split(" ").map((n) => n[0]).slice(0, 2).join("")
											})
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "font-semibold text-[13px]",
											children: c.name
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[11px] font-mono text-muted-foreground/70",
											children: c.id
										})] })]
									}) }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-0.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-1.5 text-[12px] text-muted-foreground",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, { className: "h-3 w-3" }), c.phone]
										}), c.email && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-1.5 text-[11px] text-muted-foreground/60",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mail, { className: "h-2.5 w-2.5" }), c.email]
										})]
									}) }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-1.5 text-[12px] text-muted-foreground",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "h-3 w-3" }), c.city]
									}) }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "inline-flex items-center rounded-md bg-primary/8 border border-primary/18 px-2 py-0.5 text-[11px] font-semibold text-primary",
										children: [c.rentals, " active"]
									}) }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: (() => {
										const dueInfo = getCustomerDueBalance(c.id, c.name);
										return dueInfo.totalDue > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "font-bold text-[13px] text-rose-600",
											children: ["₹", dueInfo.totalDue.toLocaleString("en-IN")]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "inline-flex rounded px-1.5 py-0.2 text-[9.5px] font-bold bg-rose-50 text-rose-700 border border-rose-200",
											children: "Pending"
										})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "font-semibold text-[13px] text-emerald-600",
											children: "₹0"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "inline-flex rounded px-1.5 py-0.2 text-[9.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200",
											children: "Paid"
										})] });
									})() }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, { status: c.status }) }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
										className: "text-right",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-end gap-1 transition-opacity",
											children: [
												(() => {
													return getCustomerDueBalance(c.id, c.name).totalDue > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CustomerPayDueDialog, {
														customer: c,
														onSave: refresh
													}) : null;
												})(),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
													variant: "ghost",
													size: "icon",
													className: "h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10",
													onClick: () => {
														setProfileCustomer(c);
														setProfileOpen(true);
													},
													title: "View Profile",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { className: "h-3.5 w-3.5" })
												}),
												!isStaff && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CustomerFormDialog, {
													title: "Edit Customer",
													customer: c,
													onSave: refresh,
													trigger: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
														variant: "ghost",
														size: "icon",
														className: "h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10",
														title: "Edit",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SquarePen, { className: "h-3.5 w-3.5" })
													})
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DeleteCustomerDialog, {
													customer: c,
													onDelete: refresh,
													trigger: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
														variant: "ghost",
														size: "icon",
														className: "h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10",
														title: "Delete",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-3.5 w-3.5" })
													})
												})] })
											]
										})
									})
								]
							}, c.id))] })] })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "sm:hidden",
							children: filteredCustomers.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "py-12 text-center text-[13px] text-muted-foreground",
								children: "No customers match your search or filter."
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "divide-y divide-border/60",
								children: filteredCustomers.map((c, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-3 px-4 py-3.5 active:bg-muted/40 transition-colors",
									onClick: () => {
										setProfileCustomer(c);
										setProfileOpen(true);
									},
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Avatar, {
											className: "h-10 w-10 shrink-0",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarFallback, {
												className: `${avatarHues[idx % avatarHues.length]} text-[12px] font-bold`,
												children: c.name.split(" ").map((n) => n[0]).slice(0, 2).join("")
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex-1 min-w-0",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center justify-between gap-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "font-semibold text-[13.5px] truncate",
														children: c.name
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, { status: c.status })]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center gap-3 mt-1",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "info-row",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, { className: "h-3 w-3 shrink-0" }), c.phone]
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "info-row",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "h-3 w-3 shrink-0" }), c.city]
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
													className: "text-[10.5px] font-mono text-muted-foreground/60 mt-0.5",
													children: [
														c.id,
														" · ",
														c.rentals,
														" rental",
														c.rentals !== 1 ? "s" : ""
													]
												}),
												(() => {
													const dueInfo = getCustomerDueBalance(c.id, c.name);
													return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
														className: "text-[11px] font-medium mt-1",
														children: [
															"Due Balance:",
															" ",
															dueInfo.totalDue > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", {
																className: "text-rose-600",
																children: [
																	"₹",
																	dueInfo.totalDue.toLocaleString("en-IN"),
																	" (Pending)"
																]
															}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "text-emerald-600 font-semibold",
																children: "₹0 (Paid)"
															})
														]
													});
												})()
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "h-4 w-4 text-muted-foreground/40 shrink-0" })
									]
								}, c.id))
							})
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CustomerProfileDialog, {
				customer: profileCustomer,
				open: profileOpen,
				onClose: () => setProfileOpen(false)
			})
		]
	});
}
function Field({ label, placeholder, type = "text", className, value, onChange, maxLength }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `space-y-1.5 ${className ?? ""}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
			className: "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
			type,
			placeholder,
			value,
			onChange,
			maxLength
		})]
	});
}
//#endregion
export { CustomersPage as component };
