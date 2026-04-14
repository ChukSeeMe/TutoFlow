"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth";
import { TutorSidebar } from "@/components/layout/TutorSidebar";
import { Menu, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

export default function TutorLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, role } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    if (!isAuthenticated || role !== "tutor") router.replace("/login");
  }, [mounted, isAuthenticated, role, router]);

  if (!mounted) return null;
  if (!isAuthenticated || role !== "tutor") return null;

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-[#09090b]">

      {/* ── Fixed mobile top bar (out of flex flow, only visible < md) ───── */}
      <div className={cn(
        "fixed top-0 inset-x-0 z-30 h-14 md:hidden",
        "flex items-center justify-between px-4",
        "bg-white dark:bg-[#0d0d12]",
        "border-b border-gray-200/80 dark:border-white/[0.06] shadow-sm",
      )}>
        <button
          onClick={() => setMobileOpen(true)}
          className="h-9 w-9 flex items-center justify-center rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-white/[0.05] transition-colors"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-lg flex items-center justify-center bg-brand-gradient shadow-glow-sm">
            <Brain className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="font-bold text-sm tracking-tight text-gray-900 dark:text-zinc-50">
            Teach Harbour
          </span>
        </div>
        <div className="w-9" />
      </div>

      {/* ── Sidebar (hidden on mobile, overlay drawer handles mobile) ────── */}
      <TutorSidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      {/* ── Main — identical to original, only adds top-padding on mobile ── */}
      <main className="flex-1 overflow-auto min-w-0 scrollbar-thin pt-14 md:pt-0">
        {children}
      </main>
    </div>
  );
}
