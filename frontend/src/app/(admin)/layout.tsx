"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { Menu, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, role } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    if (!isAuthenticated || role !== "admin") router.replace("/login");
  }, [mounted, isAuthenticated, role, router]);

  if (!mounted) return null;
  if (!isAuthenticated || role !== "admin") return null;

  return (
    <div className="flex min-h-screen bg-[rgb(var(--bg))]">

      {/* ── Fixed mobile top bar (out of flex flow) ────────────────────── */}
      <div className={cn(
        "fixed top-0 inset-x-0 z-30 h-14 md:hidden",
        "flex items-center justify-between px-4",
        "bg-[rgb(var(--bg-card))] border-b border-white/8",
      )}>
        <button
          onClick={() => setMobileOpen(true)}
          className="h-9 w-9 flex items-center justify-center rounded-xl text-[rgb(var(--text-secondary))] hover:bg-white/5 hover:text-[rgb(var(--text))] transition-colors"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-600 shadow shadow-brand-500/30">
            <Brain className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-bold">Teach Harbour</span>
        </div>
        <div className="w-9" />
      </div>

      <AdminSidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      <main className="flex-1 overflow-auto pt-14 md:pt-0">
        {children}
      </main>
    </div>
  );
}
