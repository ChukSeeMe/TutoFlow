"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/auth";
import { authApi } from "@/lib/api";
import {
  LogOut, LayoutDashboard, FileText, Brain,
  Clock, MessageSquare, Receipt, Activity, Menu, X,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const NAV = [
  { href: "/parent/dashboard",  label: "Overview",  icon: LayoutDashboard },
  { href: "/parent/timeline",   label: "Timeline",  icon: Activity },
  { href: "/parent/sessions",   label: "Sessions",  icon: Clock },
  { href: "/parent/reports",    label: "Reports",   icon: FileText },
  { href: "/parent/messages",   label: "Messages",  icon: MessageSquare },
  { href: "/parent/invoice",    label: "Invoice",   icon: Receipt },
];

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, role, clearAuth } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    if (!isAuthenticated) router.replace("/login");
    else if (role === "tutor")   router.replace("/dashboard");
    else if (role === "student") router.replace("/student/dashboard");
    else if (role === "admin")   router.replace("/admin/dashboard");
  }, [mounted, isAuthenticated, role, router]);

  useEffect(() => { setMobileNavOpen(false); }, [pathname]);

  async function handleLogout() {
    try { await authApi.logout(); } catch {}
    clearAuth();
    router.push("/login");
  }

  if (!mounted) return null;
  if (!isAuthenticated || role !== "parent") return null;

  return (
    <div className="min-h-screen bg-[rgb(237_239_248)] dark:bg-[#0a0a10]">
      <header className={cn(
        "sticky top-0 z-20 border-b px-4 py-3 flex items-center justify-between gap-4",
        "bg-white dark:bg-[#12121c]",
        "border-gray-200 dark:border-white/[0.07]",
        "shadow-sm dark:shadow-glass-dark",
      )}>
        {/* Brand */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="h-6 w-6 rounded-lg bg-brand-gradient flex items-center justify-center">
            <Brain className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-brand-600 dark:text-brand-400 font-bold text-sm">Teach Harbour</span>
          <span className="text-xs text-gray-400 dark:text-zinc-600 ml-1 hidden sm:inline">Parent</span>
        </div>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-0.5 overflow-x-auto flex-1 justify-center scrollbar-none">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={cn(
              "flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0",
              pathname === href
                ? "bg-brand-50 dark:bg-brand-500/15 text-brand-700 dark:text-brand-300"
                : "text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-white/[0.05]",
            )}>
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden md:inline">{label}</span>
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleLogout}
            className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500 dark:text-zinc-500 hover:text-gray-900 dark:hover:text-zinc-200 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden lg:inline">Log out</span>
          </button>
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileNavOpen((o) => !o)}
            className="sm:hidden h-8 w-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:text-zinc-400 dark:hover:bg-white/[0.05] transition-colors"
            aria-label="Toggle navigation"
          >
            {mobileNavOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* Mobile nav dropdown */}
      <AnimatePresence>
        {mobileNavOpen && (
          <motion.div
            className="sm:hidden fixed top-[57px] inset-x-0 z-10 bg-white dark:bg-[#12121c] border-b border-gray-200 dark:border-white/[0.07] shadow-lg"
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            <nav className="p-3 grid grid-cols-2 gap-1">
              {NAV.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                  pathname === href
                    ? "bg-brand-50 dark:bg-brand-500/15 text-brand-700 dark:text-brand-300"
                    : "text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-white/[0.05]",
                )}>
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {label}
                </Link>
              ))}
            </nav>
            <div className="px-3 pb-3">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-500 dark:text-zinc-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-3xl mx-auto p-4 sm:p-6">{children}</main>
    </div>
  );
}
