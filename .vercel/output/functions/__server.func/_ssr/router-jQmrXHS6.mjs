import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { ct as SHEETS, ft as isGSheetsEnabled, gt as syncRowToSheet, pt as sendOtpEmail } from "./data-store-BXBhFJro.mjs";
import { c as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { B as Mail, Bt as ArrowRight, H as Lock, U as LoaderCircle, x as ShieldCheck } from "../_libs/lucide-react.mjs";
import { t as Button } from "./dialog-BHa0LWsH.mjs";
import { c as HeadContent, d as createRouter, f as Outlet, g as Link, h as createRootRouteWithContext, m as createFileRoute, p as lazyRouteComponent, s as Scripts, v as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as toast, t as Toaster } from "../_libs/sonner.mjs";
import { n as Route$12 } from "./rentals-Wmde1g9_.mjs";
import { t as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { t as QueryClientProvider } from "../_libs/tanstack__react-query.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/router-jQmrXHS6.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var styles_default = "/assets/styles-BNc4UnFz.css";
function reportLovableError(error, context = {}) {
	if (typeof window === "undefined") return;
	window.__lovableEvents?.captureException?.(error, {
		source: "react_error_boundary",
		route: window.location.pathname,
		...context
	}, {
		mechanism: "react_error_boundary",
		handled: false,
		severity: "error"
	});
}
var Toaster$1 = ({ ...props }) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
		className: "toaster group",
		toastOptions: { classNames: {
			toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
			description: "group-[.toast]:text-muted-foreground",
			actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
			cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground"
		} },
		...props
	});
};
function NotFoundComponent() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-7xl font-bold text-foreground",
					children: "404"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-4 text-xl font-semibold text-foreground",
					children: "Page not found"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "The page you're looking for doesn't exist."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90",
						children: "Go home"
					})
				})
			]
		})
	});
}
function ErrorComponent({ error, reset }) {
	console.error(error);
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		reportLovableError(error, { boundary: "tanstack_root_error_component" });
	}, [error]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl font-semibold text-foreground",
					children: "This page didn't load"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "Something went wrong on our end."
				}),
				error?.message && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-xs font-mono text-destructive/80 bg-destructive/5 p-2 rounded border border-destructive/10 max-w-sm mx-auto overflow-auto max-h-24",
					children: error.message
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 flex justify-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => {
							router.invalidate();
							reset();
						},
						className: "rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90",
						children: "Try again"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "/",
						className: "rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent",
						children: "Go home"
					})]
				})
			]
		})
	});
}
var Route$11 = createRootRouteWithContext()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
			},
			{ title: "MediRent — Medical Equipment Rental ERP" },
			{
				name: "description",
				content: "Premium ERP for managing medical equipment rentals, customers, payments and analytics."
			},
			{
				name: "apple-mobile-web-app-capable",
				content: "yes"
			},
			{
				name: "apple-mobile-web-app-status-bar-style",
				content: "default"
			},
			{
				name: "mobile-web-app-capable",
				content: "yes"
			},
			{
				name: "theme-color",
				content: "#ffffff"
			},
			{
				name: "format-detection",
				content: "telephone=no"
			}
		],
		links: [
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap"
			}
		]
	}),
	shellComponent: RootShell,
	component: RootComponent,
	notFoundComponent: NotFoundComponent,
	errorComponent: ErrorComponent
});
function RootShell({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", {
			className: "overscroll-none",
			children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})]
		})]
	});
}
/** SHA-256 hash using browser's built-in Web Crypto API */
async function hashPassword(plain) {
	const encoded = new TextEncoder().encode(plain);
	const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
	return Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
/** Create a session with 8-hour expiry */
function createSession(user) {
	const token = crypto.randomUUID();
	const expiry = Date.now() + 480 * 60 * 1e3;
	localStorage.setItem("medirent-authenticated", "true");
	localStorage.setItem("medirent-session-token", token);
	localStorage.setItem("medirent-session-expiry", expiry.toString());
	localStorage.setItem("medirent-user-email", user.email);
	localStorage.setItem("medirent-user-name", user.name);
	localStorage.setItem("medirent-user-role", user.role);
}
/** Persistent rate-limit helpers (survive page refresh) */
var RATE_LIMIT_KEY = "medirent-login-attempts";
var LOCKOUT_KEY = "medirent-login-lockout";
var MAX_LOGIN_ATTEMPTS = 5;
var LOCKOUT_DURATION_MS = 900 * 1e3;
function getLoginAttempts() {
	return parseInt(localStorage.getItem(RATE_LIMIT_KEY) || "0", 10);
}
function incrementLoginAttempts() {
	const next = getLoginAttempts() + 1;
	localStorage.setItem(RATE_LIMIT_KEY, String(next));
	if (next >= MAX_LOGIN_ATTEMPTS) localStorage.setItem(LOCKOUT_KEY, String(Date.now() + LOCKOUT_DURATION_MS));
	return next;
}
function resetLoginAttempts() {
	localStorage.removeItem(RATE_LIMIT_KEY);
	localStorage.removeItem(LOCKOUT_KEY);
}
function getLockoutRemainingMs() {
	const lockoutUntil = parseInt(localStorage.getItem(LOCKOUT_KEY) || "0", 10);
	return Math.max(0, lockoutUntil - Date.now());
}
function FirstRunSetup({ onComplete }) {
	const [name, setName] = (0, import_react.useState)("");
	const [adminEmail, setAdminEmail] = (0, import_react.useState)("");
	const [pass, setPass] = (0, import_react.useState)("");
	const [confirm, setConfirm] = (0, import_react.useState)("");
	const [isSaving, setIsSaving] = (0, import_react.useState)(false);
	const handleSetup = async (e) => {
		e.preventDefault();
		if (!name.trim()) {
			toast.error("Please enter your name");
			return;
		}
		if (!adminEmail.includes("@")) {
			toast.error("Please enter a valid email");
			return;
		}
		if (pass.length < 8) {
			toast.error("Password must be at least 8 characters");
			return;
		}
		if (!/[A-Z]/.test(pass)) {
			toast.error("Password must contain at least one uppercase letter");
			return;
		}
		if (!/[0-9]/.test(pass)) {
			toast.error("Password must contain at least one number");
			return;
		}
		if (!/[^A-Za-z0-9]/.test(pass)) {
			toast.error("Password must contain at least one special character");
			return;
		}
		if (pass !== confirm) {
			toast.error("Passwords do not match");
			return;
		}
		setIsSaving(true);
		const passwordHash = await hashPassword(pass);
		const adminUser = {
			id: "1",
			name: name.trim(),
			email: adminEmail.toLowerCase().trim(),
			passwordHash,
			role: "Admin",
			firstAdmin: true
		};
		localStorage.setItem("medirent-staff-users", JSON.stringify([adminUser]));
		localStorage.setItem("medirent-setup-done", "true");
		toast.success("Admin account created! Please log in.");
		setIsSaving(false);
		onComplete();
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative flex min-h-screen items-center justify-center bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0] px-4 py-12 font-sans overflow-hidden",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-blue-100/30 blur-[130px] -z-10 animate-pulse duration-[8000ms]" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-[440px] bg-white border border-slate-100/80 rounded-[28px] p-8 shadow-[0_20px_50px_rgba(15,23,42,0.06)] text-slate-800 flex flex-col items-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex h-16 w-full items-center justify-center mb-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: "/images/logo.png",
						alt: "Relife Logo",
						className: "max-h-full max-w-full object-contain"
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center mb-3",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "h-4 w-4 text-white" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-[22px] font-bold tracking-tight text-slate-900 text-center",
					children: "First-Time Setup"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[13px] text-slate-400 mt-2 text-center mb-6",
					children: "Create your administrator account to get started"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					onSubmit: handleSetup,
					className: "w-full space-y-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400 block",
								children: "Full Name"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "text",
								value: name,
								onChange: (e) => setName(e.target.value),
								required: true,
								placeholder: "Your name",
								className: "w-full px-4 py-3 bg-white border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl text-slate-800 text-[14px] placeholder-slate-400/80 outline-none transition-all"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400 block",
								children: "Email Address"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "email",
								value: adminEmail,
								onChange: (e) => setAdminEmail(e.target.value),
								required: true,
								placeholder: "admin@yourcompany.com",
								className: "w-full px-4 py-3 bg-white border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl text-slate-800 text-[14px] placeholder-slate-400/80 outline-none transition-all"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400 block",
								children: "Password"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "password",
								value: pass,
								onChange: (e) => setPass(e.target.value),
								required: true,
								placeholder: "Min 8 chars, uppercase, number, symbol",
								className: "w-full px-4 py-3 bg-white border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl text-slate-800 text-[14px] placeholder-slate-400/80 outline-none transition-all"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400 block",
								children: "Confirm Password"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "password",
								value: confirm,
								onChange: (e) => setConfirm(e.target.value),
								required: true,
								placeholder: "Re-enter password",
								className: "w-full px-4 py-3 bg-white border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl text-slate-800 text-[14px] placeholder-slate-400/80 outline-none transition-all"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-lg border border-blue-100 bg-blue-50/60 p-3 text-[12px] text-blue-700 space-y-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-semibold",
								children: "Password requirements:"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
								className: "space-y-0.5 list-disc list-inside text-blue-600",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
										className: pass.length >= 8 ? "text-emerald-600" : "",
										children: "At least 8 characters"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
										className: /[A-Z]/.test(pass) ? "text-emerald-600" : "",
										children: "One uppercase letter"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
										className: /[0-9]/.test(pass) ? "text-emerald-600" : "",
										children: "One number"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
										className: /[^A-Za-z0-9]/.test(pass) ? "text-emerald-600" : "",
										children: "One special character"
									})
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "submit",
							disabled: isSaving,
							className: "w-full py-5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-[0_4px_12px_rgba(37,99,235,0.15)] transition-all flex items-center justify-center gap-2 border-0 cursor-pointer text-[14px]",
							children: isSaving ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" }), " Creating..."] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "h-4 w-4" }), " Create Admin Account"] })
						})
					]
				})
			]
		})]
	});
}
function LoginInterface({ onLoginSuccess }) {
	const [email, setEmail] = (0, import_react.useState)("");
	const [password, setPassword] = (0, import_react.useState)("");
	const [otp, setOtp] = (0, import_react.useState)("");
	const [generatedOtp, setGeneratedOtp] = (0, import_react.useState)("");
	const [step, setStep] = (0, import_react.useState)("credentials");
	const [isVerifying, setIsVerifying] = (0, import_react.useState)(false);
	const [matchedUser, setMatchedUser] = (0, import_react.useState)(null);
	const [timer, setTimer] = (0, import_react.useState)(60);
	const [otpAttempts, setOtpAttempts] = (0, import_react.useState)(0);
	const MAX_OTP_ATTEMPTS = 5;
	const [lockoutRemaining, setLockoutRemaining] = (0, import_react.useState)(0);
	(0, import_react.useEffect)(() => {
		let interval;
		if (step === "otp" && timer > 0) interval = setInterval(() => {
			setTimer((t) => t - 1);
		}, 1e3);
		return () => clearInterval(interval);
	}, [step, timer]);
	(0, import_react.useEffect)(() => {
		if (step !== "credentials") return;
		const tick = () => setLockoutRemaining(Math.ceil(getLockoutRemainingMs() / 1e3));
		tick();
		const id = setInterval(tick, 1e3);
		return () => clearInterval(id);
	}, [step]);
	const handleVerifyCredentials = async (e) => {
		e.preventDefault();
		const remainingMs = getLockoutRemainingMs();
		if (remainingMs > 0) {
			const mins = Math.ceil(remainingMs / 6e4);
			toast.error(`Account temporarily locked. Try again in ${mins} minute${mins !== 1 ? "s" : ""}.`);
			return;
		}
		if (!email || !email.includes("@")) {
			toast.error("Please enter a valid email address");
			return;
		}
		if (!password) {
			toast.error("Please enter your password");
			return;
		}
		setIsVerifying(true);
		await new Promise((resolve) => setTimeout(resolve, 800));
		let staffList = [];
		const saved = localStorage.getItem("medirent-staff-users");
		if (saved) try {
			staffList = JSON.parse(saved);
		} catch (err) {
			console.error(err);
		}
		const enteredHash = await hashPassword(password);
		let foundUser = staffList.find((u) => u.email.toLowerCase().trim() === email.toLowerCase().trim() && (u.passwordHash ? u.passwordHash === enteredHash : u.password === password));
		if (!foundUser && isGSheetsEnabled()) try {
			const { syncFromSheetsToLocalStorage } = await import("./data-store-BXBhFJro.mjs").then((n) => n.a);
			await syncFromSheetsToLocalStorage(true);
			const savedAgain = localStorage.getItem("medirent-staff-users");
			if (savedAgain) staffList = JSON.parse(savedAgain);
			foundUser = staffList.find((u) => u.email.toLowerCase().trim() === email.toLowerCase().trim() && (u.passwordHash ? u.passwordHash === enteredHash : u.password === password));
		} catch (err) {
			console.warn("[GSheets] Login fallback sync failed:", err);
		}
		if (!foundUser && email.toLowerCase().trim() === "relifemedicaltechnologies.mys@gmail.com") {
			const defaultHash = "2d8b2a1ff89a8b02e74a88a7fba7304e1724aa45324dd82ce7da2f9d4d3b0cec";
			if (enteredHash === defaultHash || password === "Relife@806709") {
				foundUser = {
					id: "1",
					name: "Relife Admin",
					email: "relifemedicaltechnologies.mys@gmail.com",
					passwordHash: defaultHash,
					role: "Admin",
					firstAdmin: true
				};
				const updatedList = [foundUser, ...staffList.filter((u) => u.email !== foundUser.email && u.id !== "1")];
				localStorage.setItem("medirent-staff-users", JSON.stringify(updatedList));
				if (isGSheetsEnabled()) syncRowToSheet(SHEETS.STAFF, foundUser);
			}
		}
		if (foundUser) {
			resetLoginAttempts();
			if (!foundUser.passwordHash && foundUser.password) {
				foundUser.passwordHash = enteredHash;
				delete foundUser.password;
				const updatedList = staffList.map((u) => u.email === foundUser.email ? foundUser : u);
				localStorage.setItem("medirent-staff-users", JSON.stringify(updatedList));
				if (isGSheetsEnabled()) syncRowToSheet(SHEETS.STAFF, foundUser);
			}
			setMatchedUser(foundUser);
			const randomBytes = new Uint32Array(1);
			crypto.getRandomValues(randomBytes);
			const code = String(1e5 + randomBytes[0] % 9e5);
			setGeneratedOtp(code);
			setTimer(60);
			setOtpAttempts(0);
			setIsVerifying(true);
			try {
				const result = await sendOtpEmail(email, code);
				if (result.success) {
					setStep("otp");
					toast.success("OTP Sent!", {
						description: `Verification code sent to ${email}. Check your inbox and spam folder.`,
						duration: 1e4
					});
				} else toast.error("Failed to send verification email", {
					description: result.error || "Please check your internet connection and try again.",
					duration: 1e4
				});
			} catch (err) {
				console.error("Failed to send OTP email:", err);
				toast.error("Could not send verification email", {
					description: "Please check your internet connection and try again.",
					duration: 1e4
				});
			} finally {
				setIsVerifying(false);
			}
			return;
		} else {
			const remaining = MAX_LOGIN_ATTEMPTS - incrementLoginAttempts();
			if (remaining <= 0) toast.error("Too many failed attempts. Account locked for 15 minutes.");
			else toast.error(`Invalid email or password. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`);
		}
		setIsVerifying(false);
	};
	const handleVerifyOtp = async (e) => {
		e.preventDefault();
		if (otp.length !== 6) {
			toast.error("Please enter a 6-digit verification code");
			return;
		}
		if (otpAttempts >= MAX_OTP_ATTEMPTS) {
			toast.error("Too many incorrect attempts. Please go back and request a new OTP.");
			return;
		}
		setIsVerifying(true);
		await new Promise((resolve) => setTimeout(resolve, 800));
		if (otp === generatedOtp) if (matchedUser) {
			createSession(matchedUser);
			toast.success(`Welcome back, ${matchedUser.name}!`);
			onLoginSuccess();
		} else toast.error("An error occurred during authentication.");
		else {
			const newAttempts = otpAttempts + 1;
			setOtpAttempts(newAttempts);
			const remaining = MAX_OTP_ATTEMPTS - newAttempts;
			if (remaining <= 0) toast.error("Too many incorrect attempts. Please go back and request a new OTP.");
			else toast.error(`Invalid verification code. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`);
		}
		setIsVerifying(false);
	};
	const handleResendOtp = async () => {
		if (timer > 0) return;
		const randomBytes = new Uint32Array(1);
		crypto.getRandomValues(randomBytes);
		const code = String(1e5 + randomBytes[0] % 9e5);
		setGeneratedOtp(code);
		setTimer(60);
		setOtpAttempts(0);
		setIsVerifying(true);
		try {
			const result = await sendOtpEmail(email, code);
			if (result.success) toast.success("OTP Resent successfully!", {
				description: `Verification code resent to ${email}. Check your inbox.`,
				duration: 1e4
			});
			else toast.error("Failed to resend OTP email", {
				description: result.error || "Please check your internet connection and try again.",
				duration: 15e3
			});
		} catch (err) {
			console.error("Failed to resend OTP email:", err);
			toast.error("Network error while resending OTP", {
				description: err instanceof Error ? err.message : String(err),
				duration: 15e3
			});
		} finally {
			setIsVerifying(false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative flex min-h-screen items-center justify-center bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0] px-4 py-12 font-sans overflow-hidden",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-blue-100/30 blur-[130px] -z-10 animate-pulse duration-[8000ms]" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full bg-slate-200/40 blur-[130px] -z-10" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "w-full max-w-[420px] bg-white border border-slate-100/80 rounded-[28px] p-8 sm:p-10 shadow-[0_20px_50px_rgba(15,23,42,0.06)] text-slate-800 relative z-10 flex flex-col items-center animate-[slide-up_0.45s_cubic-bezier(0.22,1,0.36,1)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex h-16 w-full items-center justify-center mb-6 transition-transform hover:scale-[1.02] duration-300",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: "/images/logo.png",
							alt: "Relife Logo",
							className: "max-h-full max-w-full object-contain"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-[26px] font-bold tracking-tight text-slate-900 text-center leading-none",
						children: "Relife"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[13px] font-medium text-slate-400 mt-2 text-center mb-8",
						children: "Medical Equipment Rental ERP"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "w-full",
						children: step === "credentials" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
							onSubmit: handleVerifyCredentials,
							className: "space-y-6",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										className: "text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400 block",
										children: "Email Address"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "relative",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mail, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400/80" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "email",
											placeholder: "Enter your email",
											value: email,
											onChange: (e) => setEmail(e.target.value),
											required: true,
											className: "w-full pl-10 pr-4 py-3 bg-white border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl text-slate-800 text-[14px] placeholder-slate-400/80 outline-none transition-all duration-200"
										})]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										className: "text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400 block",
										children: "Password"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "relative",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400/80" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "password",
											placeholder: "Enter your password",
											value: password,
											onChange: (e) => setPassword(e.target.value),
											required: true,
											className: "w-full pl-10 pr-4 py-3 bg-white border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl text-slate-800 text-[14px] placeholder-slate-400/80 outline-none transition-all duration-200"
										})]
									})]
								}),
								lockoutRemaining > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[12px] font-semibold text-red-700",
											children: "Account temporarily locked"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-[22px] font-bold text-red-600 mt-1 font-mono",
											children: [
												Math.floor(lockoutRemaining / 60),
												":",
												String(lockoutRemaining % 60).padStart(2, "0")
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[11px] text-red-500 mt-0.5",
											children: "Too many failed attempts. Try again after the timer."
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									type: "submit",
									disabled: isVerifying || lockoutRemaining > 0,
									className: "w-full py-5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-[0_4px_12px_rgba(37,99,235,0.15)] transition-all flex items-center justify-center gap-2 border-0 cursor-pointer text-[14px]",
									children: isVerifying ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin text-white" }), "Checking..."] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: ["Continue ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "h-4 w-4 ml-1" })] })
								})
							]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
							onSubmit: handleVerifyOtp,
							className: "space-y-6",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex justify-between items-center mb-1",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
												className: "text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400 block",
												children: "Verification Code"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												onClick: () => setStep("credentials"),
												className: "text-[11px] font-bold text-blue-600 hover:underline hover:text-blue-700 border-0 bg-transparent cursor-pointer transition-colors",
												children: "Back to Login"
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "text",
											maxLength: 6,
											placeholder: "Enter 6-digit OTP",
											value: otp,
											onChange: (e) => setOtp(e.target.value.replace(/\D/g, "")),
											required: true,
											className: "w-full px-4 py-3 bg-white border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl text-center tracking-[0.25em] font-semibold text-slate-800 text-[15px] placeholder-slate-400/80 outline-none transition-all duration-200"
										}),
										(isGSheetsEnabled(), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[12px] text-slate-400 leading-normal text-center mt-2",
											children: "OTP code sent to your email. Check your inbox and spam folder."
										}))
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									type: "submit",
									disabled: isVerifying,
									className: "w-full py-5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-[0_4px_12px_rgba(37,99,235,0.15)] transition-all flex items-center justify-center gap-2 border-0 cursor-pointer text-[14px]",
									children: isVerifying ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin text-white" }), "Verifying..."] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: "Verify & Login" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-center pt-1",
									children: timer > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-[12px] text-slate-400 font-medium",
										children: ["Resend code in ", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "font-semibold text-slate-600",
											children: [timer, "s"]
										})]
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: handleResendOtp,
										className: "text-[12px] font-bold text-blue-600 hover:underline hover:text-blue-700 transition-colors border-0 bg-transparent cursor-pointer",
										children: "Resend OTP Code"
									})
								})
							]
						})
					})
				]
			})
		]
	});
}
function RootComponent() {
	const context = Route$11.useRouteContext();
	const [fallbackQueryClient] = (0, import_react.useState)(() => new QueryClient());
	const queryClient = context?.queryClient || fallbackQueryClient;
	const [isAuthenticated, setIsAuthenticated] = (0, import_react.useState)(false);
	const [isLoading, setIsLoading] = (0, import_react.useState)(true);
	const [needsSetup, setNeedsSetup] = (0, import_react.useState)(false);
	const checkSetupAndAuth = () => {
		if (typeof window === "undefined") return;
		const staffRaw = localStorage.getItem("medirent-staff-users");
		let hasUsers = false;
		if (staffRaw) try {
			const users = JSON.parse(staffRaw);
			hasUsers = Array.isArray(users) && users.length > 0;
		} catch (_) {}
		setNeedsSetup(!hasUsers);
		if (hasUsers) {
			const auth = localStorage.getItem("medirent-authenticated");
			const token = localStorage.getItem("medirent-session-token");
			const expiryStr = localStorage.getItem("medirent-session-expiry");
			if (auth === "true" && token && expiryStr) {
				const expiry = parseInt(expiryStr, 10);
				if (!isNaN(expiry) && Date.now() < expiry) setIsAuthenticated(true);
				else {
					localStorage.removeItem("medirent-authenticated");
					localStorage.removeItem("medirent-session-token");
					localStorage.removeItem("medirent-session-expiry");
					localStorage.removeItem("medirent-user-email");
					localStorage.removeItem("medirent-user-name");
					localStorage.removeItem("medirent-user-role");
					setIsAuthenticated(false);
				}
			}
		}
		if (isGSheetsEnabled()) import("./data-store-BXBhFJro.mjs").then((n) => n.a).then(({ syncFromSheetsToLocalStorage }) => {
			syncFromSheetsToLocalStorage();
		});
		setIsLoading(false);
	};
	(0, import_react.useEffect)(() => {
		checkSetupAndAuth();
	}, []);
	if (isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-slate-950",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" })
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(QueryClientProvider, {
		client: queryClient,
		children: [needsSetup ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FirstRunSetup, { onComplete: () => {
			setNeedsSetup(false);
		} }) : isAuthenticated ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoginInterface, { onLoginSuccess: () => setIsAuthenticated(true) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster$1, {})]
	});
}
var $$splitComponentImporter$10 = () => import("./settings-SUwDUG0s.mjs");
var Route$10 = createFileRoute("/settings")({
	head: () => ({ meta: [{ title: "Settings — MediRent" }] }),
	component: lazyRouteComponent($$splitComponentImporter$10, "component")
});
var $$splitComponentImporter$9 = () => import("./returns-BNIvw4l_.mjs");
var Route$9 = createFileRoute("/returns")({
	head: () => ({ meta: [{ title: "Returns — MediRent" }] }),
	component: lazyRouteComponent($$splitComponentImporter$9, "component")
});
var $$splitComponentImporter$8 = () => import("./reports-KKFzZigL.mjs");
var Route$8 = createFileRoute("/reports")({
	head: () => ({ meta: [{ title: "Statements & Analytics — MediRent" }] }),
	component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
var $$splitComponentImporter$7 = () => import("./payments-ZQhr70WB.mjs");
var Route$7 = createFileRoute("/payments")({
	head: () => ({ meta: [{ title: "Payments — MediRent" }] }),
	component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
var $$splitComponentImporter$6 = () => import("./owners-CM3FScH5.mjs");
var Route$6 = createFileRoute("/owners")({
	head: () => ({ meta: [{ title: "Equipment Owners — MediRent" }] }),
	component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
var $$splitComponentImporter$5 = () => import("./exchanges-C5dAVlOF.mjs");
var Route$5 = createFileRoute("/exchanges")({
	head: () => ({ meta: [{ title: "Exchanges — MediRent" }] }),
	component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
var $$splitComponentImporter$4 = () => import("./equipment-CMThWvup.mjs");
var Route$4 = createFileRoute("/equipment")({
	head: () => ({ meta: [{ title: "Equipment — MediRent" }] }),
	component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
var $$splitComponentImporter$3 = () => import("./dues-Bc8riBf1.mjs");
var Route$3 = createFileRoute("/dues")({
	head: () => ({ meta: [{ title: "Rent Dues — MediRent" }] }),
	component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
var $$splitComponentImporter$2 = () => import("./documents-2ctvfHDZ.mjs");
var Route$2 = createFileRoute("/documents")({
	head: () => ({ meta: [{ title: "Documents — MediRent" }] }),
	component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
var $$splitComponentImporter$1 = () => import("./customers-D32bApFs.mjs");
var Route$1 = createFileRoute("/customers")({
	head: () => ({ meta: [{ title: "Customers — MediRent" }] }),
	component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
var $$splitComponentImporter = () => import("./routes-CCGVZqbQ.mjs");
var Route = createFileRoute("/")({
	head: () => ({ meta: [{ title: "Dashboard — MediRent ERP" }] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
var SettingsRoute = Route$10.update({
	id: "/settings",
	path: "/settings",
	getParentRoute: () => Route$11
});
var ReturnsRoute = Route$9.update({
	id: "/returns",
	path: "/returns",
	getParentRoute: () => Route$11
});
var ReportsRoute = Route$8.update({
	id: "/reports",
	path: "/reports",
	getParentRoute: () => Route$11
});
var RentalsRoute = Route$12.update({
	id: "/rentals",
	path: "/rentals",
	getParentRoute: () => Route$11
});
var PaymentsRoute = Route$7.update({
	id: "/payments",
	path: "/payments",
	getParentRoute: () => Route$11
});
var OwnersRoute = Route$6.update({
	id: "/owners",
	path: "/owners",
	getParentRoute: () => Route$11
});
var ExchangesRoute = Route$5.update({
	id: "/exchanges",
	path: "/exchanges",
	getParentRoute: () => Route$11
});
var EquipmentRoute = Route$4.update({
	id: "/equipment",
	path: "/equipment",
	getParentRoute: () => Route$11
});
var DuesRoute = Route$3.update({
	id: "/dues",
	path: "/dues",
	getParentRoute: () => Route$11
});
var DocumentsRoute = Route$2.update({
	id: "/documents",
	path: "/documents",
	getParentRoute: () => Route$11
});
var CustomersRoute = Route$1.update({
	id: "/customers",
	path: "/customers",
	getParentRoute: () => Route$11
});
var rootRouteChildren = {
	IndexRoute: Route.update({
		id: "/",
		path: "/",
		getParentRoute: () => Route$11
	}),
	CustomersRoute,
	DocumentsRoute,
	DuesRoute,
	EquipmentRoute,
	ExchangesRoute,
	OwnersRoute,
	PaymentsRoute,
	RentalsRoute,
	ReportsRoute,
	ReturnsRoute,
	SettingsRoute
};
var routeTree = Route$11._addFileChildren(rootRouteChildren)._addFileTypes();
var getRouter = () => {
	return createRouter({
		routeTree,
		context: { queryClient: new QueryClient() },
		scrollRestoration: true,
		defaultPreloadStaleTime: 0
	});
};
//#endregion
export { getRouter };
