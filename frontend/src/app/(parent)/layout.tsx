"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/auth";
import { authApi } from "@/lib/api";
import {
  LogOut, LayoutDashboard, FileText, Brain,
  Clock, MessageSquare, Receipt, Activity,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

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

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    if (!isAuthenticated) {
      router.replace("/login");
    } else if (role === "tutor") {
      router.replace("/dashboard");
    } else if (role === "student") {
      router.replace("/student/dashboard");
    } else if (role === "admin") {
      router.replace("/admin/dashboard");
    }
  }, [mounted, isAuthenticated, role, router]);

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
        "sticky top-0 z-10 border-b px-4 py-3 flex items-center justify-between gap-4",
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

        {/* Nav — scrollable on small screens */}
        <nav className="flex items-center gap-0.5 overflow-x-auto flex-1 justify-center scrollbar-none">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0",
                pathname === href
                  ? "bg-brand-50 dark:bg-brand-500/15 text-brand-700 dark:text-brand-300"
                  : "text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-white/[0.05]"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-zinc-500 hover:text-gray-900 dark:hover:text-zinc-200 transition-colors flex-shrink-0"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Log out</span>
        </button>
      </header>

      <main className="max-w-3xl mx-auto p-6">{children}</main>
    </div>
  );
}
