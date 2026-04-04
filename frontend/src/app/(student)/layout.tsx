"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/auth";
import { authApi } from "@/lib/api";
import { LogOut, LayoutDashboard, ClipboardList, BookOpen, Brain } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/student/dashboard", label: "Home",     icon: LayoutDashboard },
  { href: "/student/tasks",     label: "Tasks",    icon: ClipboardList },
  { href: "/student/progress",  label: "Progress", icon: BookOpen },
  { href: "/student/reflect",   label: "Reflect",  icon: Brain },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
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
    } else if (role === "parent") {
      router.replace("/parent/dashboard");
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
  if (!isAuthenticated || role !== "student") return null;

  return (
    <div className="min-h-screen bg-[rgb(237_239_248)] dark:bg-[#0a0a10]">
      <header className={cn(
        "sticky top-0 z-10 border-b px-6 py-3 flex items-center justify-between",
        "bg-white dark:bg-[#12121c]",
        "border-gray-200 dark:border-white/[0.07]",
        "shadow-sm dark:shadow-glass-dark",
      )}>
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-lg bg-brand-gradient flex items-center justify-center">
            <Brain className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-brand-600 dark:text-brand-400 font-bold text-sm">TutorFlow</span>
          <span className="text-xs text-gray-400 dark:text-zinc-600 ml-1">Student</span>
        </div>

        <nav className="flex items-center gap-1">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors",
                pathname === href || pathname.startsWith(href + "/")
                  ? "bg-brand-50 dark:bg-brand-500/15 text-brand-700 dark:text-brand-300"
                  : "text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-white/[0.05]"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Link>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-zinc-500 hover:text-gray-900 dark:hover:text-zinc-200 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Log out</span>
        </button>
      </header>

      <main className="max-w-3xl mx-auto p-6">{children}</main>
    </div>
  );
}
