import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Mail, Lock, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sendOtpEmail, isGSheetsEnabled, syncRowToSheet, SHEETS } from "@/lib/google-sheets";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">The page you're looking for doesn't exist.</p>
        <div className="mt-6">
          <Link to="/" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">Go home</Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => { reportLovableError(error, { boundary: "tanstack_root_error_component" }); }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-foreground">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">Something went wrong on our end.</p>
        {error?.message && (
          <p className="mt-2 text-xs font-mono text-destructive/80 bg-destructive/5 p-2 rounded border border-destructive/10 max-w-sm mx-auto overflow-auto max-h-24">
            {error.message}
          </p>
        )}
        <div className="mt-6 flex justify-center gap-2">
          <button onClick={() => { router.invalidate(); reset(); }} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">Try again</button>
          <a href="/" className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent">Go home</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" },
      { title: "Relife — Medical Equipment Rental ERP" },
      { name: "description", content: "ERP for managing medical equipment rentals, customers, payments and analytics." },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "theme-color", content: "#ffffff" },
      { name: "format-detection", content: "telephone=no" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body className="overscroll-none">{children}<Scripts /></body>
    </html>
  );
}

// ─── Security helpers ──────────────────────────────────────────────────────

/** SHA-256 hash using browser's built-in Web Crypto API */
async function hashPassword(plain: string): Promise<string> {
  const encoded = new TextEncoder().encode(plain);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Create a session with 8-hour expiry */
function createSession(user: { name: string; email: string; role: string }) {
  if (typeof window === "undefined") return;
  const token = crypto.randomUUID();
  const expiry = Date.now() + 8 * 60 * 60 * 1000;
  localStorage.setItem("medirent-authenticated", "true");
  localStorage.setItem("medirent-session-token", token);
  localStorage.setItem("medirent-session-expiry", expiry.toString());
  localStorage.setItem("medirent-user-email", user.email);
  localStorage.setItem("medirent-user-name", user.name);
  localStorage.setItem("medirent-user-role", user.role);
}

/** Persistent rate-limit helpers (survive page refresh) */
const RATE_LIMIT_KEY = "medirent-login-attempts";
const LOCKOUT_KEY = "medirent-login-lockout";
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

function getLoginAttempts(): number {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem(RATE_LIMIT_KEY) || "0", 10);
}
function incrementLoginAttempts(): number {
  if (typeof window === "undefined") return 0;
  const next = getLoginAttempts() + 1;
  localStorage.setItem(RATE_LIMIT_KEY, String(next));
  if (next >= MAX_LOGIN_ATTEMPTS) {
    localStorage.setItem(LOCKOUT_KEY, String(Date.now() + LOCKOUT_DURATION_MS));
  }
  return next;
}
function resetLoginAttempts() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(RATE_LIMIT_KEY);
  localStorage.removeItem(LOCKOUT_KEY);
}
function getLockoutRemainingMs(): number {
  if (typeof window === "undefined") return 0;
  const lockoutUntil = parseInt(localStorage.getItem(LOCKOUT_KEY) || "0", 10);
  return Math.max(0, lockoutUntil - Date.now());
}

// ─── First-Run Setup ────────────────────────────────────────────────────────

function FirstRunSetup({ onComplete }: { onComplete: () => void }) {
  const [name, setName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error("Please enter your name"); return; }
    if (!adminEmail.includes("@")) { toast.error("Please enter a valid email"); return; }
    if (pass.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    if (!/[A-Z]/.test(pass)) { toast.error("Password must contain at least one uppercase letter"); return; }
    if (!/[0-9]/.test(pass)) { toast.error("Password must contain at least one number"); return; }
    if (!/[^A-Za-z0-9]/.test(pass)) { toast.error("Password must contain at least one special character"); return; }
    if (pass !== confirm) { toast.error("Passwords do not match"); return; }

    setIsSaving(true);
    const passwordHash = await hashPassword(pass);
    const adminUser = { id: "1", name: name.trim(), email: adminEmail.toLowerCase().trim(), passwordHash, role: "Admin", firstAdmin: true };
    localStorage.setItem("medirent-staff-users", JSON.stringify([adminUser]));
    localStorage.setItem("medirent-setup-done", "true");
    toast.success("Admin account created! Please log in.");
    setIsSaving(false);
    onComplete();
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0] px-4 py-12 font-sans overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-blue-100/30 blur-[130px] -z-10 animate-pulse duration-[8000ms]" />
      <div className="w-full max-w-[440px] bg-white border border-slate-100/80 rounded-[28px] p-8 shadow-[0_20px_50px_rgba(15,23,42,0.06)] text-slate-800 flex flex-col items-center">
        <div className="flex h-16 w-full items-center justify-center mb-6">
          <img src="/images/logo.png" alt="Relife Logo" className="max-h-full max-w-full object-contain" />
        </div>
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center mb-3">
          <ShieldCheck className="h-4 w-4 text-white" />
        </div>
        <h2 className="text-[22px] font-bold tracking-tight text-slate-900 text-center">First-Time Setup</h2>
        <p className="text-[13px] text-slate-400 mt-2 text-center mb-6">Create your administrator account to get started</p>
        <form onSubmit={handleSetup} className="w-full space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400 block">Full Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Your name" className="w-full px-4 py-3 bg-white border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl text-slate-800 text-[14px] placeholder-slate-400/80 outline-none transition-all" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400 block">Email Address</label>
            <input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required placeholder="admin@yourcompany.com" className="w-full px-4 py-3 bg-white border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl text-slate-800 text-[14px] placeholder-slate-400/80 outline-none transition-all" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400 block">Password</label>
            <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} required placeholder="Min 8 chars, uppercase, number, symbol" className="w-full px-4 py-3 bg-white border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl text-slate-800 text-[14px] placeholder-slate-400/80 outline-none transition-all" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400 block">Confirm Password</label>
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required placeholder="Re-enter password" className="w-full px-4 py-3 bg-white border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl text-slate-800 text-[14px] placeholder-slate-400/80 outline-none transition-all" />
          </div>
          <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-3 text-[12px] text-blue-700 space-y-1">
            <p className="font-semibold">Password requirements:</p>
            <ul className="space-y-0.5 list-disc list-inside text-blue-600">
              <li className={pass.length >= 8 ? "text-emerald-600" : ""}>At least 8 characters</li>
              <li className={/[A-Z]/.test(pass) ? "text-emerald-600" : ""}>One uppercase letter</li>
              <li className={/[0-9]/.test(pass) ? "text-emerald-600" : ""}>One number</li>
              <li className={/[^A-Za-z0-9]/.test(pass) ? "text-emerald-600" : ""}>One special character</li>
            </ul>
          </div>
          <Button type="submit" disabled={isSaving} className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-[0_4px_12px_rgba(37,99,235,0.15)] transition-all flex items-center justify-center gap-2 border-0 cursor-pointer text-[14px]">
            {isSaving ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</> : <><ShieldCheck className="h-4 w-4" /> Create Admin Account</>}
          </Button>
        </form>
      </div>
    </div>
  );
}

// ─── Login Interface ────────────────────────────────────────────────────────

function LoginInterface({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [isVerifying, setIsVerifying] = useState(false);
  const [matchedUser, setMatchedUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [timer, setTimer] = useState(60);
  // OTP attempt counter — lock after 5 failures (in-memory, complements credential lockout)
  const [otpAttempts, setOtpAttempts] = useState(0);
  const MAX_OTP_ATTEMPTS = 5;
  // Lockout display state
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  // Build-time DEV flag — cannot be spoofed at runtime
  const isDevMode = import.meta.env.DEV === true;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === "otp" && timer > 0) {
      interval = setInterval(() => {
        setTimer((t) => t - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  // Poll lockout state every second so countdown updates
  useEffect(() => {
    if (step !== "credentials") return;
    const tick = () => setLockoutRemaining(Math.ceil(getLockoutRemainingMs() / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [step]);

  const handleVerifyCredentials = async (e: React.FormEvent) => {
    e.preventDefault();

    // Security: Check persistent rate limit before doing anything
    const remainingMs = getLockoutRemainingMs();
    if (remainingMs > 0) {
      const mins = Math.ceil(remainingMs / 60000);
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

    // Retrieve staff list from localStorage
    let staffList: any[] = [];
    const saved = localStorage.getItem("medirent-staff-users");
    if (saved) {
      try {
        staffList = JSON.parse(saved);
      } catch (err) {
        console.error(err);
      }
    }

    // Hash the entered password for comparison
    const enteredHash = await hashPassword(password);
    let foundUser = staffList.find(
      (u: any) =>
        u.email.toLowerCase().trim() === email.toLowerCase().trim() &&
        // Compare hashed passwords only — plaintext support is legacy-only
        (u.passwordHash ? u.passwordHash === enteredHash : u.password === password)
    );

    // Fallback sync: if login fails and Google Sheets is enabled, trigger a force sync and retry
    if (!foundUser && isGSheetsEnabled()) {
      try {
        const { syncFromSheetsToLocalStorage } = await import("@/lib/data-store");
        await syncFromSheetsToLocalStorage(true);
        const savedAgain = localStorage.getItem("medirent-staff-users");
        if (savedAgain) {
          staffList = JSON.parse(savedAgain);
        }
        foundUser = staffList.find(
          (u: any) =>
            u.email.toLowerCase().trim() === email.toLowerCase().trim() &&
            (u.passwordHash ? u.passwordHash === enteredHash : u.password === password)
        );
      } catch (err) {
        console.warn("[GSheets] Login fallback sync failed:", err);
      }
    }

    if (foundUser) {
      // Reset rate-limit counter on successful credential verification
      resetLoginAttempts();

      // Migrate legacy plaintext password to hash on successful login
      if (!foundUser.passwordHash && foundUser.password) {
        foundUser.passwordHash = enteredHash;
        delete foundUser.password;
        const updatedList = staffList.map((u: any) => u.email === foundUser.email ? foundUser : u);
        localStorage.setItem("medirent-staff-users", JSON.stringify(updatedList));
        if (isGSheetsEnabled()) {
          syncRowToSheet(SHEETS.STAFF, foundUser);
        }
      }

      setMatchedUser(foundUser);
      // Generate cryptographically random 6-digit OTP
      const randomBytes = new Uint32Array(1);
      crypto.getRandomValues(randomBytes);
      const code = String(100000 + (randomBytes[0] % 900000));
      setGeneratedOtp(code);
      setTimer(60);
      setOtpAttempts(0);

      // Always attempt to send OTP via Google Sheets / Apps Script
      setIsVerifying(true);
      try {
        const result = await sendOtpEmail(email, code);
        if (result.success) {
          setStep("otp");
          toast.success("OTP Sent!", {
            description: `Verification code sent to ${email}. Check your inbox and spam folder.`,
            duration: 10000,
          });
        } else {
          if (isDevMode) {
            // DEV fallback: show OTP in console if email fails
            console.warn("[DEV] OTP email failed. Code:", code);
            setStep("otp");
            toast.warning("Email failed — OTP in console (DEV only)", {
              description: result.error || "Email delivery failed",
              duration: 30000,
            });
          } else {
            toast.error("Failed to send verification email", {
              description: result.error || "Please check your internet connection and try again.",
              duration: 10000,
            });
          }
        }
      } catch (err) {
        console.error("Failed to send OTP email:", err);
        if (isDevMode) {
          console.warn("[DEV] OTP (email error):", code);
          setStep("otp");
          toast.warning("Network error — OTP in console (DEV only)", { duration: 30000 });
        } else {
          toast.error("Could not send verification email", {
            description: "Please check your internet connection and try again.",
            duration: 10000,
          });
        }
      } finally {
        setIsVerifying(false);
      }
      return;

    } else {
      // Increment persistent rate-limit counter
      const attempts = incrementLoginAttempts();
      const remaining = MAX_LOGIN_ATTEMPTS - attempts;
      if (remaining <= 0) {
        toast.error("Too many failed attempts. Account locked for 15 minutes.");
      } else {
        toast.error(`Invalid email or password. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`);
      }
    }
    setIsVerifying(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error("Please enter a 6-digit verification code");
      return;
    }

    // Security: Block after max attempts
    if (otpAttempts >= MAX_OTP_ATTEMPTS) {
      toast.error("Too many incorrect attempts. Please go back and request a new OTP.");
      return;
    }

    setIsVerifying(true);
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Only accept the exact OTP that was generated and sent to email
    const isValidOtp = otp === generatedOtp;

    if (isValidOtp) {
      if (matchedUser) {
        // BUG-5 FIX: Create a real session token with 8-hour expiry
        createSession(matchedUser);
        toast.success(`Welcome back, ${matchedUser.name}!`);
        onLoginSuccess();
      } else {
        toast.error("An error occurred during authentication.");
      }
    } else {
      const newAttempts = otpAttempts + 1;
      setOtpAttempts(newAttempts);
      const remaining = MAX_OTP_ATTEMPTS - newAttempts;
      if (remaining <= 0) {
        toast.error("Too many incorrect attempts. Please go back and request a new OTP.");
      } else {
        toast.error(`Invalid verification code. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`);
      }
    }
    setIsVerifying(false);
  };

  const handleResendOtp = async () => {
    if (timer > 0) return;
    const randomBytes = new Uint32Array(1);
    crypto.getRandomValues(randomBytes);
    const code = String(100000 + (randomBytes[0] % 900000));
    setGeneratedOtp(code);
    setTimer(60);
    setOtpAttempts(0);

    // Always attempt to resend OTP
    setIsVerifying(true);
    try {
      const result = await sendOtpEmail(email, code);
      if (result.success) {
        toast.success("OTP Resent successfully!", {
          description: `Verification code resent to ${email}. Check your inbox.`,
          duration: 10000,
        });
      } else {
        if (isDevMode) {
          console.warn("[DEV] Resent OTP:", code);
          toast.warning("Email failed — OTP in console (DEV only)", { duration: 30000 });
        } else {
          toast.error("Failed to resend OTP email", {
            description: result.error || "Please check your internet connection and try again.",
            duration: 15000,
          });
        }
      }
    } catch (err) {
      console.error("Failed to resend OTP email:", err);
      toast.error("Network error while resending OTP", {
        description: err instanceof Error ? err.message : String(err),
        duration: 15000,
      });
    } finally {
      setIsVerifying(false);
    }
  };



  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0] px-4 py-12 font-sans overflow-hidden">
      {/* Background decoration elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-blue-100/30 blur-[130px] -z-10 animate-pulse duration-[8000ms]" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full bg-slate-200/40 blur-[130px] -z-10" />

      <div className="w-full max-w-[420px] bg-white border border-slate-100/80 rounded-[28px] p-8 sm:p-10 shadow-[0_20px_50px_rgba(15,23,42,0.06)] text-slate-800 relative z-10 flex flex-col items-center animate-[slide-up_0.45s_cubic-bezier(0.22,1,0.36,1)]">
        {/* Logo container - horizontal banner style for high visibility */}
        <div className="flex h-16 w-full items-center justify-center mb-6 transition-transform hover:scale-[1.02] duration-300">
          <img src="/images/logo.png" alt="Relife Logo" className="max-h-full max-w-full object-contain" />
        </div>
        
        {/* Title & Subtitle */}
        <h2 className="text-[26px] font-bold tracking-tight text-slate-900 text-center leading-none">Relife</h2>
        <p className="text-[13px] font-medium text-slate-400 mt-2 text-center mb-8">Medical Equipment Rental ERP</p>

        {/* Login Form */}
        <div className="w-full">
          {step === "credentials" ? (
            <form onSubmit={handleVerifyCredentials} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400 block">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400/80" />
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl text-slate-800 text-[14px] placeholder-slate-400/80 outline-none transition-all duration-200"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400 block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400/80" />
                  <input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl text-slate-800 text-[14px] placeholder-slate-400/80 outline-none transition-all duration-200"
                  />
                </div>
              </div>

              {lockoutRemaining > 0 && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center">
                  <p className="text-[12px] font-semibold text-red-700">Account temporarily locked</p>
                  <p className="text-[22px] font-bold text-red-600 mt-1 font-mono">{Math.floor(lockoutRemaining / 60)}:{String(lockoutRemaining % 60).padStart(2, "0")}</p>
                  <p className="text-[11px] text-red-500 mt-0.5">Too many failed attempts. Try again after the timer.</p>
                </div>
              )}
              <Button
                type="submit"
                disabled={isVerifying || lockoutRemaining > 0}
                className="w-full py-5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-[0_4px_12px_rgba(37,99,235,0.15)] transition-all flex items-center justify-center gap-2 border-0 cursor-pointer text-[14px]"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    Checking...
                  </>
                ) : (
                  <>
                    Continue <ArrowRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400 block">Verification Code</label>
                  <button
                    type="button"
                    onClick={() => setStep("credentials")}
                    className="text-[11px] font-bold text-blue-600 hover:underline hover:text-blue-700 border-0 bg-transparent cursor-pointer transition-colors"
                  >
                    Back to Login
                  </button>
                </div>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  required
                  className="w-full px-4 py-3 bg-white border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl text-center tracking-[0.25em] font-semibold text-slate-800 text-[15px] placeholder-slate-400/80 outline-none transition-all duration-200"
                />
                {!isGSheetsEnabled() && isDevMode ? (
                  <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600 mb-1">DEV MODE — Check Console</p>
                    <p className="text-[12px] text-amber-600 mt-1">OTP is printed in browser DevTools console only</p>
                  </div>
                ) : (
                  <p className="text-[12px] text-slate-400 leading-normal text-center mt-2">
                    OTP code sent to your email. Check your inbox and spam folder.
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isVerifying}
                className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-[0_4px_12px_rgba(37,99,235,0.15)] transition-all flex items-center justify-center gap-2 border-0 cursor-pointer text-[14px]"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    Verifying...
                  </>
                ) : (
                  <>
                    Verify & Login
                  </>
                )}
              </Button>

              <div className="text-center pt-1">
                {timer > 0 ? (
                  <p className="text-[12px] text-slate-400 font-medium">
                    Resend code in <span className="font-semibold text-slate-600">{timer}s</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="text-[12px] font-bold text-blue-600 hover:underline hover:text-blue-700 transition-colors border-0 bg-transparent cursor-pointer"
                  >
                    Resend OTP Code
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
function RootComponent() {
  const context = Route.useRouteContext() as { queryClient?: QueryClient } | undefined;
  const [fallbackQueryClient] = useState(() => new QueryClient());
  const queryClient = context?.queryClient || fallbackQueryClient;
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  // First-run: true when no staff users have been created yet
  const [needsSetup, setNeedsSetup] = useState(false);

  const checkSetupAndAuth = () => {
    if (typeof window === "undefined") return;

    // Check if setup has been done (any staff user accounts exist)
    const staffRaw = localStorage.getItem("medirent-staff-users");
    let hasUsers = false;
    if (staffRaw) {
      try {
        const users = JSON.parse(staffRaw);
        hasUsers = Array.isArray(users) && users.length > 0;
      } catch (_) { /* ignore */ }
    }
    setNeedsSetup(!hasUsers);

    if (hasUsers) {
      // Validate existing session
      const auth = localStorage.getItem("medirent-authenticated");
      const token = localStorage.getItem("medirent-session-token");
      const expiryStr = localStorage.getItem("medirent-session-expiry");

      if (auth === "true" && token && expiryStr) {
        const expiry = parseInt(expiryStr, 10);
        if (!isNaN(expiry) && Date.now() < expiry) {
          setIsAuthenticated(true);
        } else {
          // Session expired — clear everything
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

    // Asynchronously trigger database sync so logins are pulled on startup
    if (isGSheetsEnabled()) {
      import("@/lib/data-store").then(({ syncFromSheetsToLocalStorage }) => {
        syncFromSheetsToLocalStorage();
      });
    }

    setIsLoading(false);
  };

  useEffect(() => {
    checkSetupAndAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      {needsSetup ? (
        // First-run: no admin account exists — force setup before login
        <FirstRunSetup onComplete={() => { setNeedsSetup(false); }} />
      ) : isAuthenticated ? (
        <Outlet />
      ) : (
        <LoginInterface onLoginSuccess={() => setIsAuthenticated(true)} />
      )}
      <Toaster />
    </QueryClientProvider>
  );
}
