import { B as getReturnCalculatedRentPerItem, D as getLocalYYYYMMDD, H as parseLocalDate, R as getPayments, T as getEquipment, b as getCustomers, d as downloadAgreementFile, g as formatDateDDMMYYYY, i as cleanNum } from "./data-store-BQmZefNN.mjs";
import { c as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { I as MessageCircle, mt as Download, t as X } from "../_libs/lucide-react.mjs";
import { c as DialogTrigger, i as DialogContent, n as Dialog, r as DialogClose, s as DialogTitle, t as Button } from "./dialog-BHa0LWsH.mjs";
import { m as createFileRoute, p as lazyRouteComponent } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/rentals-BPcVrQON.js
var import_jsx_runtime = require_jsx_runtime();
var $$splitComponentImporter = () => import("./rentals-enue2VVI.mjs");
var Route = createFileRoute("/rentals")({
	head: () => ({ meta: [{ title: "Rentals — MediRent" }] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
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
//#endregion
export { Route as n, AgreementPreviewDialog as t };
