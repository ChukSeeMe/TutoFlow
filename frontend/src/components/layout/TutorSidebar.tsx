"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, BookOpen, CalendarCheck, BarChart2,
  FileText, ClipboardList, BookMarked, LogOut, GraduationCap,
  UserCheck, CircleUser, Layers, Wand2, AlertTriangle, Settings,
  Brain, ChevronRight, ChevronLeft, X,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import { authApi, usersApi } from "@/lib/api";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useQuery } from "@tanstack/react-query";
import type { TutorProfile } from "@/types";
import { TutorPlanningScene } from "@/components/ui/PortalScenes";

// ── Navigation structure ─────────────────────────────────────────────────────

const NAV_SECTIONS = [
  {
    label: "Workspace",
    items: [
      { href: "/dashboard",     icon: LayoutDashboard, label: "Dashboard" },
      { href: "/students",      icon: Users,           label: "Students" },
      { href: "/lessons",       icon: BookOpen,        label: "Lesson Plans" },
      { href: "/sessions",      icon: CalendarCheck,   label: "Sessions" },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { href: "/interventions", icon: AlertTriangle,   label: "Interventions", alert: true },
      { href: "/insights",      icon: Brain,           label: "AI Insights" },
      { href: "/mastery",       icon: Layers,          label: "Mastery Heatmap" },
      { href: "/analytics",     icon: ClipboardList,   label: "Analytics" },
      { href: "/progress",      icon: BarChart2,       label: "Progress" },
    ],
  },
  {
    label: "Resources",
    items: [
      { href: "/homework",      icon: BookMarked,      label: "Homework" },
      { href: "/reports",       icon: FileText,        label: "Reports" },
      { href: "/resources",     icon: Wand2,           label: "Resource Studio" },
      { href: "/curriculum",    icon: GraduationCap,   label: "Curriculum" },
    ],
  },
  {
    label: "People",
    items: [{ href: "/parents", icon: UserCheck, label: "Parents" }],
  },
  {
    label: "Account",
    items: [
      { href: "/profile",  icon: CircleUser, label: "My Profile" },
      { href: "/settings", icon: Settings,   label: "Settings" },
    ],
  },
];

// ── Single nav item ───────────────────────────────────────────────────────────

function NavItem({
  href,
  icon: Icon,
  label,
  alert,
  collapsed,
  onClick,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  alert?: boolean;
  collapsed?: boolean;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href + "/"));

  return (
    <Link
      href={href}
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={cn(
        "group relative flex items-center rounded-xl text-sm font-medium transition-all duration-150",
        collapsed ? "justify-center px-2 py-2" : "gap-2.5 px-3 py-1.5",
        active
          ? "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
          : "text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 hover:bg-gray-100/80 dark:hover:bg-white/[0.05]",
      )}
    >
      {active && (
        <motion.span
          layoutId="sidebar-indicator"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r-full bg-brand-500 dark:bg-brand-400"
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}
      <Icon className={cn(
        "h-3.5 w-3.5 flex-shrink-0 transition-colors",
        active ? "text-brand-600 dark:text-brand-400" : "text-gray-400 dark:text-zinc-500 group-hover:text-gray-600 dark:group-hover:text-zinc-300",
      )} />
      {!collapsed && <span className="flex-1 truncate">{label}</span>}
      {!collapsed && alert && <span className="h-1.5 w-1.5 rounded-full bg-rose-500 flex-shrink-0 animate-pulse-slow" />}
      {collapsed && alert && <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse-slow" />}
    </Link>
  );
}

// ── Sidebar body (reused for desktop and mobile drawer) ───────────────────────

function SidebarBody({
  collapsed,
  isDrawer,
  onClose,
  displayName,
  onLogout,
}: {
  collapsed: boolean;
  isDrawer: boolean;
  onClose: () => void;
  displayName: string;
  onLogout: () => void;
}) {
  const show = isDrawer ? true : !collapsed; // in drawer, always expanded

  return (
    <>
      {/* ── Brand ──────────────────────────────────────────────────────── */}
      <div className={cn(
        "h-14 flex items-center border-b border-gray-100/80 dark:border-white/[0.05] flex-shrink-0",
        show ? "px-5 gap-2.5" : "justify-center px-2",
      )}>
        <div className="h-6 w-6 rounded-lg flex items-center justify-center flex-shrink-0 bg-brand-gradient shadow-glow-sm">
          <Brain className="h-3.5 w-3.5 text-white" />
        </div>
        {show && (
          <>
            <span className="font-bold text-sm tracking-tight text-gray-900 dark:text-zinc-50 flex-1 truncate">
              Teach Harbour
            </span>
            {isDrawer && (
              <button
                onClick={onClose}
                className="h-7 w-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:text-zinc-500 dark:hover:text-zinc-200 dark:hover:bg-white/[0.05] transition-colors flex-shrink-0"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </>
        )}
      </div>

      {/* ── Scene illustration ─────────────────────────────────────────── */}
      {show && (
        <div className="relative overflow-hidden mx-3 mt-3 rounded-xl flex-shrink-0">
          <TutorPlanningScene className="w-full" />
          <div className="absolute inset-0 flex flex-col justify-end p-3 bg-gradient-to-t from-[#0d0726]/90 via-[#0d0726]/30 to-transparent rounded-xl">
            <p className="text-white/50 text-[9px] font-semibold uppercase tracking-widest">Tutor workspace</p>
            <p className="text-white text-xs font-bold leading-tight mt-0.5">Plan. Teach. Inspire.</p>
          </div>
        </div>
      )}

      {/* ── Navigation ─────────────────────────────────────────────────── */}
      <nav className={cn(
        "flex-1 py-3 space-y-4 overflow-y-auto scrollbar-none",
        show ? "px-3" : "px-1.5",
      )}>
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            {show ? (
              <p className="px-3 mb-1 text-2xs font-semibold uppercase tracking-widest text-gray-400 dark:text-zinc-600 select-none">
                {section.label}
              </p>
            ) : (
              <div className="mb-1.5 mx-1 border-t border-gray-100 dark:border-white/[0.06]" />
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavItem
                  key={item.href}
                  {...item}
                  collapsed={!show}
                  onClick={isDrawer ? onClose : undefined}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <div className={cn(
        "border-t border-gray-100/80 dark:border-white/[0.05]",
        show ? "p-3 flex flex-col gap-2" : "p-2 flex flex-col items-center gap-2",
      )}>
        {show ? (
          <>
            <div className="flex items-center justify-between px-1">
              <ThemeToggle />
              <button
                onClick={onLogout}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-400 dark:text-zinc-500 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-gray-200/80 dark:border-white/[0.07] transition-colors"
                title="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
            <Link
              href="/profile"
              onClick={isDrawer ? onClose : undefined}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-gray-100/80 dark:hover:bg-white/[0.04] transition-colors group"
            >
              <div className="h-7 w-7 rounded-lg flex-shrink-0 flex items-center justify-center bg-brand-gradient text-white font-semibold text-xs shadow-glow-sm">
                {getInitials(displayName)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-800 dark:text-zinc-200 truncate leading-tight">{displayName}</p>
                <p className="text-2xs text-gray-400 dark:text-zinc-600 truncate">Tutor</p>
              </div>
              <ChevronRight className="h-3 w-3 text-gray-300 dark:text-zinc-600 flex-shrink-0 group-hover:text-gray-500 transition-colors" />
            </Link>
          </>
        ) : (
          <>
            <ThemeToggle />
            <button
              onClick={onLogout}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-400 dark:text-zinc-500 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-gray-200/80 dark:border-white/[0.07] transition-colors"
              title="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
            <Link href="/profile" title={displayName}
              className="h-7 w-7 rounded-lg flex items-center justify-center bg-brand-gradient text-white font-semibold text-xs shadow-glow-sm"
            >
              {getInitials(displayName)}
            </Link>
          </>
        )}
      </div>
    </>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function TutorSidebar({
  mobileOpen,
  onMobileClose,
}: {
  mobileOpen: boolean;
  onMobileClose: () => void;
}) {
  const router = useRouter();
  const { clearAuth, accessToken } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  const { data: profile } = useQuery<TutorProfile>({
    queryKey: ["tutor-profile"],
    queryFn: () => usersApi.myProfile().then((r) => r.data),
    enabled: !!accessToken,
  });

  async function handleLogout() {
    try { await authApi.logout(); } catch {}
    clearAuth();
    router.push("/login");
  }

  const displayName = profile ? `${profile.first_name} ${profile.last_name}` : "Tutor";
  const bodyProps = { displayName, onLogout: handleLogout, onClose: onMobileClose };

  return (
    <>
      {/* ── Desktop sidebar — direct flex child, always in flow ─────────── */}
      <aside className={cn(
        "relative hidden md:flex flex-col flex-shrink-0 min-h-screen",
        "bg-white border-r border-gray-200/80",
        "dark:bg-[#0d0d12] dark:border-white/[0.06]",
        "transition-[width] duration-200 ease-in-out",
        collapsed ? "w-14" : "w-56",
      )}>
        <SidebarBody {...bodyProps} collapsed={collapsed} isDrawer={false} />

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="absolute -right-3 top-[4.75rem] z-10 h-6 w-6 rounded-full bg-white dark:bg-[#0d0d12] border border-gray-200 dark:border-white/[0.10] flex items-center justify-center text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300 shadow-sm transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft className={cn("h-3 w-3 transition-transform duration-200", collapsed && "rotate-180")} />
        </button>
      </aside>

      {/* ── Mobile overlay drawer ────────────────────────────────────────── */}
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
              className="fixed inset-y-0 left-0 z-50 md:hidden flex flex-col w-56 bg-white dark:bg-[#0d0d12] border-r border-gray-200/80 dark:border-white/[0.06]"
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <SidebarBody {...bodyProps} collapsed={false} isDrawer={true} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
