import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  CreditCard,
  RotateCcw,
  BarChart3,
  Settings,
  Bell,
  Search,
  Moon,
  Sun,
  Menu,
  Stethoscope,
  CalendarClock,
  FolderArchive,
  ChevronRight,
  X,
  CheckCircle,
  Handshake,
  LogOut,
  RefreshCw,
  Wifi,
  WifiOff,
  QrCode,
  MoreHorizontal,
  Home,
  Banknote,
} from "lucide-react";
import { useEffect, useState, useRef, type ReactNode } from "react";
import { isGSheetsEnabled } from "@/lib/google-sheets";
import { syncFromSheetsToLocalStorage, syncMissingFileChunks, flushPendingStatusCorrections } from "@/lib/data-store";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { QrScannerModal } from "@/components/QrScannerModal";

const navSections = [
  {
    label: "Operations",
    items: [
      { to: "/", label: "Dashboard", icon: LayoutDashboard },
      { to: "/customers", label: "Customers", icon: Users },
      { to: "/equipment", label: "Equipment", icon: Package },
      { to: "/owners", label: "Owners", icon: Handshake },
      { to: "/rentals", label: "Rentals", icon: FileText },
      { to: "/exchanges", label: "Exchanges", icon: RefreshCw },
      { to: "#scan", label: "QR Scanner", icon: QrCode, isAction: true },
    ],
  },
  {
    label: "Finance",
    items: [
      { to: "/payments", label: "Payments", icon: CreditCard },
      { to: "/dues", label: "Rent Dues", icon: CalendarClock },
      { to: "/returns", label: "Returns", icon: RotateCcw },
    ],
  },
  {
    label: "Insights",
    items: [
      { to: "/reports", label: "Reports", icon: BarChart3 },
      { to: "/documents", label: "Documents", icon: FolderArchive },
      { to: "/settings", label: "Settings", icon: Settings },
    ],
  },
] as const;

// Primary 4 items shown in bottom nav — most-used
const bottomNavPrimary = [
  { to: "/", label: "Home", icon: LayoutDashboard },
  { to: "/rentals", label: "Rentals", icon: FileText },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/equipment", label: "Equipment", icon: Package },
] as const;

type NavItem = { to: string; label: string; icon: React.ComponentType<{ className?: string }> };

export function AppShell({
  children,
  title,
  subtitle,
  actions,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  // Seeded empty, not with a placeholder name and "Admin": the optimistic
  // "Admin" default flashed the Settings nav item to Staff users on every load
  // before the mount effect corrected it.
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [, setDbVersion] = useState(0);
  // Mobile "More" drawer state
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const name = localStorage.getItem("medirent-user-name");
      const role = localStorage.getItem("medirent-user-role");
      if (name) setUserName(name);
      if (role) setUserRole(role);
    }
  }, []);

  // Listen to database update events from sync routine
  useEffect(() => {
    const handleDbUpdate = () => {
      setDbVersion((v) => v + 1);
    };
    window.addEventListener("medirent-db-updated", handleDbUpdate);
    return () => window.removeEventListener("medirent-db-updated", handleDbUpdate);
  }, []);

  // C-6: getRentals() runs during render, so when its status-correction pass
  // fixes a rental it only *queues* the row. Draining that queue is a network
  // write and belongs in an effect — doing it inline meant one POST per
  // corrected rental on every render pass. Runs after each render commit, which
  // is also after each sync-driven re-render, so corrections reach Sheets
  // promptly without ever firing from render.
  useEffect(() => {
    flushPendingStatusCorrections();
  });

  // Auto-sync loop (every 15 seconds) if Google Sheets is enabled
  useEffect(() => {
    if (isGSheetsEnabled()) {
      // Run initial sync on mount
      syncFromSheetsToLocalStorage();

      const interval = setInterval(() => {
        syncFromSheetsToLocalStorage();
      }, 15000);

      return () => clearInterval(interval);
    }
  }, []);

  // Background file-backup loop: automatically pushes any document files held
  // only in this device's IndexedDB (upload that never made it to Sheets —
  // tab closed early, network blip, rate-limited chunk) up to Google Sheets,
  // so every device can preview/download them. No manual "Sync Missing Files"
  // click required. Runs shortly after mount, then again periodically so a
  // transient failure gets retried automatically instead of staying stuck.
  const isFileSyncRunningRef = useRef(false);
  useEffect(() => {
    if (!isGSheetsEnabled()) return;

    const runBackgroundFileSync = async () => {
      if (isFileSyncRunningRef.current) return;
      isFileSyncRunningRef.current = true;
      try {
        const result = await syncMissingFileChunks();
        if (result.uploaded > 0) {
          toast.success(
            `Backed up ${result.uploaded} document file${result.uploaded === 1 ? "" : "s"} to Google Sheets — now available on every device.`
          );
        }
      } catch (e) {
        console.warn("[GSheets] Background file backup scan failed:", e);
      } finally {
        isFileSyncRunningRef.current = false;
      }
    };

    // Delay the first run so it doesn't compete with the initial row sync above.
    const initialTimeout = setTimeout(runBackgroundFileSync, 8000);
    // Then keep retrying periodically — covers files that failed to upload
    // (rate limits, offline moments) and newly-created ones on this device.
    const interval = setInterval(runBackgroundFileSync, 5 * 60 * 1000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
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

  const getInitials = (name: string) => {
    if (!name.trim()) return "";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };
  const [dark, setDark] = useState(() => {
    if (typeof window !== "undefined") {
      return (
        localStorage.getItem("medirent-theme") === "dark" ||
        (!localStorage.getItem("medirent-theme") &&
          window.matchMedia("(prefers-color-scheme: dark)").matches)
      );
    }
    return false;
  });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
      localStorage.setItem("medirent-theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("medirent-theme", "light");
    }
  }, [dark]);

  // Close more drawer when navigating
  useEffect(() => {
    setMoreOpen(false);
    setOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-background">
      {/* ══════════════════════════════════════
          SIDEBAR (desktop only)
          ══════════════════════════════════════ */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 flex flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand accent line on left edge */}
        <div className="absolute inset-y-0 left-0 w-[2px] bg-gradient-to-b from-primary/60 via-primary/30 to-transparent pointer-events-none" />

        {/* Logo Header */}
        <div className="relative flex h-[60px] items-center gap-3 border-b border-sidebar-border px-4 bg-sidebar">
          <img src="/images/logo.png" alt="Relife Medical Technologies" className="h-11 w-auto max-w-[200px] object-contain" />
          {/* Mobile close */}
          <button
            onClick={() => setOpen(false)}
            className="ml-auto flex h-7 w-7 items-center justify-center rounded-md text-slate-700 hover:bg-slate-100 md:hidden transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
          {navSections.map((section) => {
            const filteredItems = section.items.filter(
              (item) => !(userRole === "Staff" && item.to === "/settings")
            );
            if (filteredItems.length === 0) return null;
            return (
              <div key={section.label}>
                <p className="mb-1 px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/40">
                  {section.label}
                </p>
                <div className="flex flex-col gap-0.5">
                  {(filteredItems as readonly NavItem[]).map((item) => {
                    const active =
                      item.to === "/"
                        ? pathname === "/"
                        : pathname.startsWith(item.to);
                    const Icon = item.icon;
                    return (item as any).isAction ? (
                      <button
                        key={item.label}
                        onClick={() => {
                          setOpen(false);
                          setQrOpen(true);
                        }}
                        className="group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-sidebar-foreground/65 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-all duration-150 cursor-pointer text-left w-full"
                      >
                        <span className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground/60 group-hover:text-sidebar-foreground">
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <span className="flex-1 truncate">{item.label}</span>
                      </button>
                    ) : (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setOpen(false)}
                        className={`group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-all duration-150 ${
                          active
                            ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-[var(--shadow-soft)]"
                            : "text-sidebar-foreground/65 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                        }`}
                      >
                        {/* Active indicator — subtle left bar */}
                        {active && (
                          <span className="absolute left-0 inset-y-1.5 w-[2.5px] rounded-full bg-primary" />
                        )}
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-md transition-all ${
                            active
                              ? "bg-primary/12 text-primary"
                              : "text-muted-foreground/60 group-hover:text-sidebar-foreground"
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <span className="flex-1 truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Logout Sidebar Item */}
          <div className="pt-2 border-t border-sidebar-border/50">
            <button
              onClick={() => {
                localStorage.removeItem("medirent-authenticated");
                localStorage.removeItem("medirent-session-token");
                localStorage.removeItem("medirent-session-expiry");
                localStorage.removeItem("medirent-user-email");
                localStorage.removeItem("medirent-user-name");
                localStorage.removeItem("medirent-user-role");
                window.location.reload();
              }}
              className="w-full group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-destructive hover:bg-destructive/10 hover:text-destructive transition-all duration-150 cursor-pointer"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-md text-destructive group-hover:text-destructive">
                <LogOut className="h-3.5 w-3.5" />
              </span>
              <span className="flex-1 text-left truncate">Logout</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Mobile overlay (sidebar) */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-[2px] md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ══════════════════════════════════════
          MOBILE "MORE" DRAWER
          ══════════════════════════════════════ */}
      {moreOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
            onClick={() => setMoreOpen(false)}
          />
          {/* Drawer panel */}
          <div className="fixed bottom-[env(safe-area-inset-bottom,0px)] left-0 right-0 z-50 md:hidden animate-[slide-up_0.35s_cubic-bezier(0.22,1,0.36,1)]">
            <div className="bg-card border-t border-border rounded-t-2xl shadow-elevated overflow-hidden">
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-border" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 pb-3">
                <p className="text-[13px] font-bold text-foreground">All Sections</p>
                <button
                  onClick={() => setMoreOpen(false)}
                  className="h-7 w-7 flex items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Nav grid */}
              <div className="px-4 pb-5 grid grid-cols-4 gap-2">
                {navSections.flatMap((section) =>
                  section.items
                    .filter((item) => !(userRole === "Staff" && item.to === "/settings"))
                    .map((item) => {
                      const active =
                        item.to === "/"
                          ? pathname === "/"
                          : pathname.startsWith(item.to);
                      const Icon = item.icon;
                      if ((item as any).isAction) {
                        return (
                          <button
                            key={item.label}
                            onClick={() => {
                              setMoreOpen(false);
                              setQrOpen(true);
                            }}
                            className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl text-muted-foreground hover:bg-muted/60 transition-colors active:scale-95"
                          >
                            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted border border-border">
                              <Icon className="h-5 w-5" />
                            </span>
                            <span className="text-[10px] font-medium text-center leading-tight line-clamp-1">{item.label}</span>
                          </button>
                        );
                      }
                      return (
                        <Link
                          key={item.to}
                          to={item.to as any}
                          onClick={() => setMoreOpen(false)}
                          className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl transition-colors active:scale-95 ${
                            active ? "text-primary" : "text-muted-foreground hover:bg-muted/60"
                          }`}
                        >
                          <span
                            className={`flex h-11 w-11 items-center justify-center rounded-xl border transition-all ${
                              active
                                ? "bg-primary/10 border-primary/20 text-primary"
                                : "bg-muted border-border"
                            }`}
                          >
                            <Icon className="h-5 w-5" />
                          </span>
                          <span className="text-[10px] font-medium text-center leading-tight line-clamp-1">{item.label}</span>
                        </Link>
                      );
                    })
                )}
              </div>

              {/* Logout row */}
              <div className="border-t border-border mx-4 mb-2 pt-3 pb-2">
                <button
                  onClick={() => {
                    localStorage.removeItem("medirent-authenticated");
                    localStorage.removeItem("medirent-session-token");
                    localStorage.removeItem("medirent-session-expiry");
                    localStorage.removeItem("medirent-user-email");
                    localStorage.removeItem("medirent-user-name");
                    localStorage.removeItem("medirent-user-role");
                    window.location.reload();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-destructive hover:bg-destructive/8 transition-colors active:scale-95"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10">
                    <LogOut className="h-4 w-4" />
                  </span>
                  <span className="text-[13px] font-semibold">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════
          MAIN CONTENT
          ══════════════════════════════════════ */}
      <div className="md:pl-64 flex flex-col min-h-screen">
        {/* ── Topbar ── */}
        <header
          className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/90 backdrop-blur-md backdrop-saturate-150 sm:px-6 shadow-[var(--shadow-topbar)]"
          style={{
            height: "calc(56px + env(safe-area-inset-top, 0px))",
            paddingTop: "env(safe-area-inset-top, 0px)",
            paddingLeft: "max(1rem, env(safe-area-inset-left, 0px))",
            paddingRight: "max(1rem, env(safe-area-inset-right, 0px))",
          }}
        >
          {/* inner flex row */}
          <div className="flex items-center gap-3 w-full h-[56px]">
          {/* Mobile: hamburger (only shows sidebar on md+ via hamburger too — hidden on mobile since we have bottom nav) */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 md:hidden"
            onClick={() => setOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </Button>

          {/* Desktop hamburger (lg breakpoint for very narrow desktops) */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hidden md:flex lg:hidden"
            onClick={() => setOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </Button>

          {/* Mobile: Logo centered */}
          <div className="md:hidden flex-1 flex items-center justify-center">
            <img src="/images/logo.png" alt="Relife" className="h-8 w-auto object-contain max-w-[140px]" />
          </div>

          {/* Desktop: Search with keyboard shortcut hint */}
          <div
            onClick={() => setSearchOpen(true)}
            className="relative hidden flex-1 max-w-[340px] md:flex items-center cursor-pointer"
          >
            <Search className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-muted-foreground/50" />
            <input
              placeholder="Search customers, equipment, agreements…"
              readOnly
              className="w-full h-8 pl-9 pr-14 rounded-lg text-[13px] bg-muted/60 border border-border/50 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:bg-card focus:border-primary/40 transition-all cursor-pointer"
            />
            <kbd className="pointer-events-none absolute right-2.5 flex h-5 items-center gap-0.5 rounded border border-border/60 bg-card px-1.5 text-[10px] font-semibold text-muted-foreground/60">
              ⌘K
            </kbd>
          </div>

          {/* Right actions */}
          <div className="ml-auto md:ml-0 flex items-center gap-1">
            {/* Mobile: Search icon only */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 md:hidden"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="h-4 w-4 text-muted-foreground" />
            </Button>

            {/* Database Status Badge — desktop only */}
            {isGSheetsEnabled() ? (
              <div
                className="hidden sm:flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold border bg-success/10 text-success border-success/20 mr-1.5 shadow-sm"
                title="Google Sheets Database is Connected."
              >
                <Wifi className="h-3 w-3 text-success animate-pulse" />
                <span className="hidden sm:inline">DB Connected</span>
              </div>
            ) : (
              <div
                className="hidden sm:flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold border bg-destructive/10 text-destructive border-destructive/20 mr-1.5 shadow-sm"
                title="No database URL configured (Running Offline)."
              >
                <WifiOff className="h-3 w-3 text-destructive animate-pulse" />
                <span>DB Offline</span>
              </div>
            )}

            {/* Manual Sync Button */}
            {isGSheetsEnabled() && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-md text-muted-foreground hover:text-foreground mr-1"
                onClick={handleManualSync}
                disabled={isSyncing}
                title="Sync with Google Sheets"
              >
                <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin text-primary" : ""}`} />
              </Button>
            )}

            {/* QR Scanner Trigger */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-md text-muted-foreground hover:text-foreground mr-1"
              onClick={() => setQrOpen(true)}
              title="Scan Product QR Code"
            >
              <QrCode className="h-4 w-4 text-primary" />
            </Button>

            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-md text-muted-foreground hover:text-foreground"
              onClick={() => setDark((d) => !d)}
              aria-label="Toggle theme"
            >
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            {/* Notifications — desktop only.
                Routes to Rent Dues, which is what the badge is actually about;
                it previously rendered an unread dot with no click handler. */}
            <Button
              onClick={() => navigate({ to: "/dues" })}
              title="Rent dues needing attention"
              variant="ghost"
              size="icon"
              className="relative hidden sm:flex h-8 w-8 rounded-md text-muted-foreground hover:text-foreground"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-[7px] w-[7px] rounded-full bg-destructive border-2 border-background" />
            </Button>

            {/* Divider — desktop only */}
            <div className="mx-1.5 h-5 w-px bg-border hidden sm:block" />

            {/* User pill — desktop only */}
            <div className="hidden sm:flex items-center gap-2 rounded-lg border border-border/60 bg-card/90 pl-1.5 pr-2.5 py-1 shadow-[var(--shadow-soft)] hover:border-border transition-colors cursor-pointer">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="bg-primary text-primary-foreground text-[9px] font-bold">
                  {getInitials(userName)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-left leading-tight sm:block">
                <p className="text-[12px] font-semibold text-foreground">{userName}</p>
                <p className="text-[10px] font-medium text-muted-foreground/70">{userRole}</p>
              </div>
              <ChevronRight className="h-3 w-3 text-muted-foreground/50 rotate-90 ml-0.5 hidden sm:block" />
            </div>

            {/* Logout button — desktop only */}
            <Button
              variant="ghost"
              size="icon"
              className="hidden sm:flex h-8 w-8 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 ml-1.5"
              title="Logout"
              onClick={() => {
                localStorage.removeItem("medirent-authenticated");
                localStorage.removeItem("medirent-session-token");
                localStorage.removeItem("medirent-session-expiry");
                localStorage.removeItem("medirent-user-email");
                localStorage.removeItem("medirent-user-name");
                localStorage.removeItem("medirent-user-role");
                window.location.reload();
              }}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
          </div>
        </header>

        {/* ── Page Content ── */}
        {/* pb-24 on mobile to clear bottom nav bar + home indicator */}
        <main
          className="px-3 py-5 sm:px-7 lg:px-8 pb-32 md:pb-8"
          style={{
            minHeight: "calc(100vh - 56px - env(safe-area-inset-top, 0px))",
            paddingBottom: "calc(5rem + env(safe-area-inset-bottom, 0px))",
          }}
        >
          {/* Page Header */}
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3 animate-[fade-in_0.35s_ease-out]">
            <div className="flex items-start gap-3">
              {/* Accent bar */}
              <div className="mt-1 h-6 w-[3px] rounded-full bg-primary shrink-0" />
              <div>
                {/* Breadcrumb */}
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground/60 mb-1">
                  <span className="font-medium hover:text-muted-foreground transition-colors cursor-pointer">
                    Relife
                  </span>
                  <ChevronRight className="h-2.5 w-2.5 opacity-50" />
                  <span className="font-semibold text-muted-foreground/80">{title}</span>
                </div>
                <h1 className="text-[20px] sm:text-[22px] font-bold tracking-tight text-foreground">
                  {title}
                </h1>
                {subtitle && (
                  <p className="mt-0.5 text-[12px] sm:text-[13px] text-muted-foreground leading-relaxed">{subtitle}</p>
                )}
              </div>
            </div>
            {actions && (
              <div className="flex flex-wrap items-center gap-2">{actions}</div>
            )}
          </div>

          {/* Children */}
          <div className="animate-[slide-up_0.45s_cubic-bezier(0.22,1,0.36,1)]">
            {children}
          </div>
        </main>
      </div>

      {/* ══════════════════════════════════════
          MOBILE BOTTOM NAVIGATION BAR
          ══════════════════════════════════════ */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-card/95 backdrop-blur-xl border-t border-border shadow-elevated"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="flex items-stretch">
          {bottomNavPrimary.map((item) => {
            const active =
              item.to === "/"
                ? pathname === "/"
                : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 min-h-[60px] transition-all duration-150 active:scale-95 ${
                  active ? "text-primary" : "text-muted-foreground/60"
                }`}
              >
                <span
                  className={`flex items-center justify-center h-7 w-7 rounded-xl transition-all duration-200 ${
                    active ? "bg-primary/12 scale-110" : ""
                  }`}
                >
                  <Icon className={`h-[22px] w-[22px] transition-all ${active ? "stroke-[2.2px]" : "stroke-[1.6px]"}`} />
                </span>
                <span className={`text-[10px] font-semibold leading-none transition-all ${active ? "text-primary" : "text-muted-foreground/50"}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* "More" trigger */}
          <button
            onClick={() => setMoreOpen(true)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 min-h-[60px] transition-all duration-150 active:scale-95 ${
              moreOpen ? "text-primary" : "text-muted-foreground/60"
            }`}
          >
            <span className={`flex items-center justify-center h-7 w-7 rounded-xl transition-all duration-200 ${moreOpen ? "bg-primary/12 scale-110" : ""}`}>
              <MoreHorizontal className={`h-[22px] w-[22px] transition-all ${moreOpen ? "stroke-[2.2px]" : "stroke-[1.6px]"}`} />
            </span>
            <span className={`text-[10px] font-semibold leading-none ${moreOpen ? "text-primary" : "text-muted-foreground/50"}`}>
              More
            </span>
          </button>
        </div>
      </nav>

      <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Operations">
            <CommandItem onSelect={() => { navigate({ to: "/" }); setSearchOpen(false); }}>
              <LayoutDashboard className="mr-2 h-4.5 w-4.5 text-muted-foreground" />
              <span>Dashboard</span>
            </CommandItem>
            <CommandItem onSelect={() => { navigate({ to: "/customers" }); setSearchOpen(false); }}>
              <Users className="mr-2 h-4.5 w-4.5 text-muted-foreground" />
              <span>Customers</span>
            </CommandItem>
            <CommandItem onSelect={() => { navigate({ to: "/equipment" }); setSearchOpen(false); }}>
              <Package className="mr-2 h-4.5 w-4.5 text-muted-foreground" />
              <span>Equipment Inventory</span>
            </CommandItem>
            <CommandItem onSelect={() => { navigate({ to: "/owners" }); setSearchOpen(false); }}>
              <Handshake className="mr-2 h-4.5 w-4.5 text-muted-foreground" />
              <span>Equipment Owners</span>
            </CommandItem>
            <CommandItem onSelect={() => { navigate({ to: "/rentals" }); setSearchOpen(false); }}>
              <FileText className="mr-2 h-4.5 w-4.5 text-muted-foreground" />
              <span>Rental Agreements</span>
            </CommandItem>
            <CommandItem onSelect={() => { navigate({ to: "/exchanges" }); setSearchOpen(false); }}>
              <RefreshCw className="mr-2 h-4.5 w-4.5 text-muted-foreground" />
              <span>Exchanges</span>
            </CommandItem>
          </CommandGroup>
          <CommandGroup heading="Finance">
            <CommandItem onSelect={() => { navigate({ to: "/payments" }); setSearchOpen(false); }}>
              <CreditCard className="mr-2 h-4.5 w-4.5 text-muted-foreground" />
              <span>Payments Ledger</span>
            </CommandItem>
            <CommandItem onSelect={() => { navigate({ to: "/dues" }); setSearchOpen(false); }}>
              <CalendarClock className="mr-2 h-4.5 w-4.5 text-muted-foreground" />
              <span>Rent Dues & Reminders</span>
            </CommandItem>
            <CommandItem onSelect={() => { navigate({ to: "/returns" }); setSearchOpen(false); }}>
              <RotateCcw className="mr-2 h-4.5 w-4.5 text-muted-foreground" />
              <span>Equipment Returns</span>
            </CommandItem>
          </CommandGroup>
          <CommandGroup heading="Insights">
            <CommandItem onSelect={() => { navigate({ to: "/reports" }); setSearchOpen(false); }}>
              <BarChart3 className="mr-2 h-4.5 w-4.5 text-muted-foreground" />
              <span>Reports & Analytics</span>
            </CommandItem>
            <CommandItem onSelect={() => { navigate({ to: "/documents" }); setSearchOpen(false); }}>
              <FolderArchive className="mr-2 h-4.5 w-4.5 text-muted-foreground" />
              <span>Document Repository</span>
            </CommandItem>
            {userRole !== "Staff" && (
              <CommandItem onSelect={() => { navigate({ to: "/settings" }); setSearchOpen(false); }}>
                <Settings className="mr-2 h-4.5 w-4.5 text-muted-foreground" />
                <span>Settings & Rules</span>
              </CommandItem>
            )}
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      <QrScannerModal isOpen={qrOpen} onOpenChange={setQrOpen} />
    </div>
  );
}

/* ══════════════════════════════════════
   StatusBadge — refined enterprise variant
   ══════════════════════════════════════ */
const statusMap: Record<string, { classes: string; pulse?: boolean }> = {
  Available:          { classes: "bg-success/10 text-success border-success/25",          pulse: true },
  Active:             { classes: "bg-success/10 text-success border-success/25" },
  Good:               { classes: "bg-success/10 text-success border-success/25" },
  Rented:             { classes: "bg-primary/10 text-primary border-primary/25" },
  Returned:           { classes: "bg-muted text-muted-foreground border-border/60" },
  Maintenance:        { classes: "bg-warning/12 text-warning-foreground border-warning/30" },
  "Under Maintenance":{ classes: "bg-warning/12 text-warning-foreground border-warning/30" },
  UnderMaintenance:   { classes: "bg-warning/12 text-warning-foreground border-warning/30" },
  Damaged:            { classes: "bg-destructive/10 text-destructive border-destructive/25" },
  Pending:            { classes: "bg-warning/12 text-warning-foreground border-warning/30" },
  "Pending Approval":  { classes: "bg-warning/10 text-warning border-warning/25", pulse: true },
  Overdue:            { classes: "bg-destructive/10 text-destructive border-destructive/25", pulse: true },
  Paid:               { classes: "bg-success/10 text-success border-success/25" },
  Partial:            { classes: "bg-warning/12 text-warning-foreground border-warning/30" },
  Completed:          { classes: "bg-destructive/10 text-destructive border-destructive/25" },
  // Bug fix: Added Cancelled status (was missing — showed as unstyled fallback)
  Cancelled:          { classes: "bg-destructive/8 text-destructive/70 border-destructive/20" },
  "Returned to Owner": { classes: "bg-amber-500/10 text-amber-700 border-amber-500/20" },
  ReturnedToOwner:     { classes: "bg-amber-500/10 text-amber-700 border-amber-500/20" },
};

export function StatusBadge({ status }: { status: string }) {
  const cfg = statusMap[status] ?? { classes: "bg-muted text-muted-foreground border-border/50" };
  return (
    <Badge variant="outline" className={`gap-1.5 font-semibold ${cfg.classes}`}>
      <span
        className={`h-1.5 w-1.5 rounded-full bg-current ${cfg.pulse ? "animate-[pulse-dot_2.5s_ease-in-out_infinite]" : "opacity-70"}`}
      />
      {status}
    </Badge>
  );
}
