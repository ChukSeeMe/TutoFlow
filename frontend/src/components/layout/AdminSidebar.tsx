"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Brain, LayoutDashboard, Users, ScrollText,
  LogOut, Shield, BarChart3, HeartPulse, Cpu,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth";
import { authApi } from "@/lib/api";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/admin/dashboard",  icon: LayoutDashboard, label: "Overview"    },
  { href: "/admin/insights",   icon: BarChart3,        label: "Insights"    },
  { href: "/admin/health",     icon: HeartPulse,       label: "Health"      },
  { href: "/admin/users",      icon: Users,            label: "Users"       },
  { href: "/admin/audit",      icon: ScrollText,       label: "Audit Logs"  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const { clearAuth } = useAuthStore();

  async function handleLogout() {
    try { await authApi.logout(); } catch {}
    clearAuth();
    router.push("/login");
  }

  return (
    <aside className="flex h-screen w-56 flex-col border-r border-white/8 bg-[rgb(var(--bg-card))]">
      {/* Logo */}
      <div className="flex items-center gap-2.5 border-b border-white/8 px-5 py-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 shadow shadow-indigo-500/30">
          <Brain className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold leading-none">TutorFlow</p>
          <p className="mt-0.5 text-[10px] text-[rgb(var(--text-secondary))]">Admin Panel</p>
        </div>
      </div>

      {/* Badge */}
      <div className="mx-4 mt-4 flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2">
        <Shield className="h-3.5 w-3.5 text-red-400" />
        <span className="text-xs font-semibold text-red-400">Administrator</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {nav.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-indigo-500/15 text-indigo-400"
                  : "text-[rgb(var(--text-secondary))] hover:bg-white/5 hover:text-[rgb(var(--text))]",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-white/8 p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-[rgb(var(--text-secondary))] hover:bg-white/5 hover:text-red-400 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
