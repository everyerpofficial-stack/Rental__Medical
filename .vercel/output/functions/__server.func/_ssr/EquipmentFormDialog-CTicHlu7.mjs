import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { I as getOwners, N as getNextOwnerNumber, Q as saveEquipment, et as saveOwner, j as getNextEquipmentNumber, t as EQUIPMENT_CATEGORIES } from "./data-store-BXBhFJro.mjs";
import { c as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { a as DialogFooter, c as DialogTrigger, i as DialogContent, l as Input, n as Dialog, o as DialogHeader, r as DialogClose, s as DialogTitle, t as Button, u as Label } from "./dialog-BHa0LWsH.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-C2rs2HGz.mjs";
import { t as Combobox } from "./combobox-DmZUdRIE.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/EquipmentFormDialog-CTicHlu7.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var isOwnOwner = (ownerName) => {
	if (!ownerName) return false;
	const val = ownerName.toLowerCase().trim();
	if (val === "deepak" || val === "relife" || val.includes("relife")) return true;
	try {
		const match = getOwners().find((o) => o.name.toLowerCase().trim() === val);
		if (match && match.ownerName && match.ownerName.toLowerCase().trim() === "deepak") return true;
	} catch (e) {}
	return false;
};
var ensureYYYYMMDD = (dateStr) => {
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
		const pad = (s) => s.length === 1 ? `0${s}` : s;
		return `${y}-${pad(m)}-${pad(d)}`;
	}
	return dateStr;
};
function Field({ label, placeholder, type = "text", className, value, onChange }) {
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
			className: "bg-background h-10"
		})]
	});
}
function EquipmentFormDialog({ title, eq, trigger, onSave }) {
	const [isOpen, setIsOpen] = (0, import_react.useState)(false);
	const [owners, setOwners] = (0, import_react.useState)([]);
	const [category, setCategory] = (0, import_react.useState)(eq?.category || "");
	const [customCategory, setCustomCategory] = (0, import_react.useState)("");
	const [isCustomCategory, setIsCustomCategory] = (0, import_react.useState)(false);
	const [serial, setSerial] = (0, import_react.useState)(eq?.serial || "");
	const [model, setModel] = (0, import_react.useState)(eq?.model || "");
	const [manufacturer, setManufacturer] = (0, import_react.useState)(eq?.manufacturer || "");
	const [owner, setOwner] = (0, import_react.useState)(eq?.owner || "");
	const [purchaseDate, setPurchaseDate] = (0, import_react.useState)(eq?.purchaseDate ? ensureYYYYMMDD(eq.purchaseDate) : "");
	const [purchaseCost, setPurchaseCost] = (0, import_react.useState)(eq?.purchaseCost?.toString() || "");
	const [status, setStatus] = (0, import_react.useState)(eq?.status || "Available");
	const [ownerDailyRate, setOwnerDailyRate] = (0, import_react.useState)(eq?.ownerDailyRate?.toString() || "");
	const [isAddingNewOwner, setIsAddingNewOwner] = (0, import_react.useState)(false);
	const [newOwnerOrg, setNewOwnerOrg] = (0, import_react.useState)("");
	const [newOwnerIndividual, setNewOwnerIndividual] = (0, import_react.useState)("");
	const [newOwnerPhone, setNewOwnerPhone] = (0, import_react.useState)("");
	const [newOwnerEmail, setNewOwnerEmail] = (0, import_react.useState)("");
	const [newOwnerAddress, setNewOwnerAddress] = (0, import_react.useState)("");
	const ownerOptions = (0, import_react.useMemo)(() => {
		return [...owners.map((o) => ({
			value: o.name,
			label: o.ownerName ? `${o.ownerName} (${o.name})` : o.name
		})), {
			value: "Add New Owner",
			label: "✨ Add New Owner..."
		}];
	}, [owners]);
	const categoryOptions = (0, import_react.useMemo)(() => {
		return [...EQUIPMENT_CATEGORIES.map((c) => ({
			value: c,
			label: c
		})), {
			value: "Custom",
			label: "✨ Other / Add New Category..."
		}];
	}, []);
	(0, import_react.useEffect)(() => {
		if (isOpen) {
			setOwners(getOwners());
			const isPredefined = eq?.category ? EQUIPMENT_CATEGORIES.includes(eq.category) : true;
			setCategory(isPredefined ? eq?.category || "" : "Custom");
			setCustomCategory(isPredefined ? "" : eq?.category || "");
			setIsCustomCategory(!isPredefined);
			setSerial(eq?.serial || "");
			setModel(eq?.model || "");
			setManufacturer(eq?.manufacturer || "");
			setOwner(eq?.owner || "");
			setPurchaseDate(eq?.purchaseDate ? ensureYYYYMMDD(eq.purchaseDate) : "");
			setPurchaseCost(eq?.purchaseCost?.toString() || "");
			setStatus(eq?.status || "Available");
			setOwnerDailyRate(eq?.ownerDailyRate?.toString() || "");
			setIsAddingNewOwner(false);
			setNewOwnerOrg("");
			setNewOwnerIndividual("");
			setNewOwnerPhone("");
			setNewOwnerEmail("");
			setNewOwnerAddress("");
		}
	}, [isOpen, eq]);
	(0, import_react.useEffect)(() => {
		if (typeof window !== "undefined") {
			if (new URLSearchParams(window.location.search).get("addNew") === "true" && !eq) {
				setIsOpen(true);
				const newUrl = window.location.pathname;
				window.history.replaceState({}, document.title, newUrl);
			}
		}
	}, [eq]);
	const handleSave = () => {
		const finalCategory = isCustomCategory ? customCategory.trim() : category;
		if (!finalCategory) {
			toast.error(isCustomCategory ? "Please enter a custom category name." : "Please select a category.");
			return;
		}
		if (!serial) {
			toast.error("Please enter a serial number.");
			return;
		}
		if (!status) {
			toast.error("Please select a status.");
			return;
		}
		let finalOwnerName = owner;
		if (isAddingNewOwner) {
			const orgName = newOwnerOrg.trim();
			const indName = newOwnerIndividual.trim();
			if (!orgName) {
				toast.error("Please enter the new owner's organization name.");
				return;
			}
			if (!indName) {
				toast.error("Please enter the new owner's individual name.");
				return;
			}
			if (newOwnerPhone.trim()) {
				if (newOwnerPhone.replace(/\D/g, "").length !== 10) {
					toast.error("New Owner Phone Number must be exactly 10 digits.");
					return;
				}
			}
			saveOwner({
				id: getNextOwnerNumber(),
				name: orgName,
				ownerName: indName,
				inventorySeries: "",
				phone: newOwnerPhone.trim(),
				email: newOwnerEmail.trim(),
				address: newOwnerAddress.trim(),
				commissionRate: 100,
				status: "Active"
			});
			finalOwnerName = orgName;
		} else if (!owner) {
			toast.error("Please select an owner.");
			return;
		}
		const id = eq?.id || getNextEquipmentNumber(finalCategory);
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
			purchaseCost: isOwn ? 0 : parseFloat(purchaseCost) || 0,
			ownerDailyRate: isOwn ? 0 : parseFloat(ownerDailyRate) || 0,
			ownerHistory: eq?.ownerHistory || []
		};
		saveEquipment(savedEq);
		toast.success(eq ? `Equipment "${finalCategory}" updated successfully.` : "New equipment item created successfully.");
		if (onSave) onSave(savedEq);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, {
		open: isOpen,
		onOpenChange: setIsOpen,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
			asChild: true,
			onClick: () => setIsOpen(true),
			children: trigger
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "max-w-2xl max-h-[90vh] overflow-y-auto",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: title }) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-4 py-2 sm:grid-cols-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5 sm:col-span-2 flex flex-col justify-end",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								className: "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5",
								children: "Category"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Combobox, {
								options: categoryOptions,
								value: category,
								onValueChange: (val) => {
									setCategory(val);
									if (val === "Custom") setIsCustomCategory(true);
									else setIsCustomCategory(false);
								},
								placeholder: "Select category...",
								searchPlaceholder: "Search categories...",
								emptyText: "No category found."
							})]
						}),
						isCustomCategory && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5 sm:col-span-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								className: "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
								children: "Custom Category Name"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								placeholder: "Enter custom category name",
								value: customCategory,
								onChange: (e) => setCustomCategory(e.target.value),
								className: "bg-background h-10"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Serial Number",
							placeholder: "e.g. PHE-77821",
							value: serial,
							onChange: (e) => setSerial(e.target.value)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Model Number",
							placeholder: "e.g. EverFlo Q",
							value: model,
							onChange: (e) => setModel(e.target.value)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Manufacturer",
							placeholder: "e.g. Philips",
							value: manufacturer,
							onChange: (e) => setManufacturer(e.target.value)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5 flex flex-col justify-end",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								className: "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5",
								children: "Owner"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Combobox, {
								options: ownerOptions,
								value: isAddingNewOwner ? "Add New Owner" : owner,
								onValueChange: (val) => {
									if (val === "Add New Owner") setIsAddingNewOwner(true);
									else {
										setIsAddingNewOwner(false);
										setOwner(val);
									}
								},
								placeholder: "Select owner...",
								searchPlaceholder: "Search owners...",
								emptyText: "No owner found."
							})]
						}),
						isAddingNewOwner && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "sm:col-span-2 border border-dashed border-primary/40 bg-primary/5 rounded-xl p-4 space-y-3 mt-1 animate-[fade-in_0.2s_ease-out]",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between border-b border-primary/20 pb-1.5 mb-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[11px] font-bold text-primary uppercase tracking-wider",
									children: "New Owner Details"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									type: "button",
									variant: "ghost",
									size: "sm",
									className: "h-6.5 text-[10px] text-muted-foreground hover:text-foreground px-1.5",
									onClick: () => {
										setIsAddingNewOwner(false);
										setOwner("");
									},
									children: "Cancel / Select Existing Owner"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-3 sm:grid-cols-2 text-[13px]",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
										label: "Organization Name *",
										placeholder: "e.g. Zenith Medtech Solutions",
										value: newOwnerOrg,
										onChange: (e) => setNewOwnerOrg(e.target.value)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
										label: "Owner Name *",
										placeholder: "e.g. Dr. Amit Vyas",
										value: newOwnerIndividual,
										onChange: (e) => setNewOwnerIndividual(e.target.value)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
										label: "Contact Phone",
										placeholder: "10-digit phone number",
										value: newOwnerPhone,
										onChange: (e) => setNewOwnerPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
										label: "Contact Email",
										placeholder: "e.g. partner@zenith.com",
										value: newOwnerEmail,
										onChange: (e) => setNewOwnerEmail(e.target.value)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
										label: "Office / Billing Address",
										placeholder: "Full business address...",
										className: "sm:col-span-2",
										value: newOwnerAddress,
										onChange: (e) => setNewOwnerAddress(e.target.value)
									})
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								className: "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
								children: "Status"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
								value: status,
								onValueChange: setStatus,
								disabled: eq?.status === "Rented",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
									className: "h-10 text-[13px]",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Select status" })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "Available",
										children: "Available"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "UnderMaintenance",
										children: "Under Maintenance"
									}),
									!isOwnOwner(isAddingNewOwner ? newOwnerOrg : owner) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "Returned to Owner",
										children: "Returned to Owner"
									}),
									eq?.status === "Rented" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "Rented",
										children: "Rented (Active Rental)"
									})
								] })]
							})]
						}),
						!isOwnOwner(isAddingNewOwner ? newOwnerOrg : owner) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Purchase Date",
							type: "date",
							value: purchaseDate,
							onChange: (e) => setPurchaseDate(e.target.value)
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Daily Rate to Owner (₹)",
							placeholder: "e.g. 50",
							value: ownerDailyRate,
							onChange: (e) => setOwnerDailyRate(e.target.value)
						})] })
					]
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
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						onClick: handleSave,
						children: "Save Equipment"
					})
				})] })
			]
		})]
	});
}
//#endregion
export { isOwnOwner as n, EquipmentFormDialog as t };
