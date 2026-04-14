"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, LayoutDashboard, Users, ScrollText,
  LogOut, Shield, BarChart3, HeartPulse,
  ChevronLeft, X,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth";
import { authApi } from "@/lib/api";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin/dashboard",  icon: LayoutDashboard, label: "Overview"   },
  { href: "/admin/insights",   icon: BarChart3,        label: "Insights"   },
  { href: "/admin/health",     icon: HeartPulse,       label: "Health"     },
  { href: "/admin/users",      icon: Users,            label: "Users"      },
  { href: "/admin/audit",      icon: ScrollText,       label: "Audit Logs" },
];

// ── Shared sidebar body ───────────────────────────────────────────────────────

function AdminSidebarBody({
  collapsed,
  isDrawer,
  onClose,
  onLogout,
  pathname,
}: {
  collapsed: boolean;
  isDrawer: boolean;
  onClose: () => void;
  onLogout: () => void;
  pathname: string;
}) {
  const show = isDrawer ? true : !collapsed;

  return (
    <>
      {/* Logo */}
      <div className={cn(
        "flex items-center border-b border-white/8 px-4 py-4",
        show ? "gap-2.5" : "justify-center",
      )}>
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 shadow shadow-brand-500/30 flex-shrink-0">
          <Brain className="h-4 w-4 text-white" />
        </div>
        {show && (
          <>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold leading-none truncate">Teach Harbour</p>
              <p className="mt-0.5 text-[10px] text-[rgb(var(--text-secondary))]">Admin Panel</p>
            </div>
            {isDrawer && (
              <button
                onClick={onClose}
                className="h-7 w-7 flex items-center justify-center rounded-lg text-[rgb(var(--text-secondary))] hover:bg-white/5 hover:text-[rgb(var(--text))] transition-colors flex-shrink-0"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </>
        )}
      </div>

      {/* Admin badge */}
      {show ? (
        <div className="mx-4 mt-4 flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2">
          <Shield className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />
          <span className="text-xs font-semibold text-red-400">Administrator</span>
        </div>
      ) : (
        <div className="mx-auto mt-4 flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/10" title="Administrator">
          <Shield className="h-3.5 w-3.5 text-red-400" />
        </div>
      )}

      {/* Nav */}
      <nav className={cn("flex-1 space-y-0.5 py-4 overflow-y-auto scrollbar-none", show ? "px-3" : "px-1.5")}>
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={isDrawer ? onClose : undefined}
              title={!show ? label : undefined}
              className={cn(
                "flex items-center rounded-lg text-sm font-medium transition-colors",
                show ? "gap-3 px-3 py-2" : "justify-center px-2 py-2",
                active
                  ? "bg-brand-500/15 text-brand-400"
                  : "text-[rgb(var(--text-secondary))] hover:bg-white/5 hover:text-[rgb(var(--text))]",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {show && label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className={cn("border-t border-white/8", show ? "p-3" : "p-2 flex justify-center")}>
        <button
          onClick={onLogout}
          title={!show ? "Sign out" : undefined}
          className={cn(
            "flex items-center rounded-lg text-sm text-[rgb(var(--text-secondary))] hover:bg-white/5 hover:text-red-400 transition-colors",
            show ? "gap-3 w-full px-3 py-2" : "justify-center h-9 w-9",
          )}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {show && "Sign out"}
        </button>
      </div>
    </>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function AdminSidebar({
  mobileOpen,
  onMobileClose,
}: {
  mobileOpen: boolean;
  onMobileClose: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { clearAuth } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  async function handleLogout() {
    try { await authApi.logout(); } catch {}
    clearAuth();
    router.push("/login");
  }

  const bodyProps = { pathname, onLogout: handleLogout, onClose: onMobileClose };

  return (
    <>
      {/* Desktop sidebar — direct flex child */}
      <aside className={cn(
        "relative hidden md:flex flex-col flex-shrink-0 min-h-screen",
        "border-r border-white/8 bg-[rgb(var(--bg-card))]",
        "transition-[width] duration-200 ease-in-out",
        collapsed ? "w-14" : "w-56",
      )}>
        <AdminSidebarBody {...bodyProps} collapsed={collapsed} isDrawer={false} />

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="absolute -right-3 top-20 z-10 h-6 w-6 rounded-full bg-[rgb(var(--bg-card))] border border-white/10 flex items-center justify-center text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text))] shadow-sm transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft className={cn("h-3 w-3 transition-transform duration-200", collapsed && "rotate-180")} />
        </button>
      </aside>

      {/* Mobile overlay drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
              onClick={onMobileClose}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            />
            <motion.div
              className="fixed inset-y-0 left-0 z-50 md:hidden flex flex-col w-56 border-r border-white/8 bg-[rgb(var(--bg-card))]"
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <AdminSidebarBody {...bodyProps} collapsed={false} isDrawer={true} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
