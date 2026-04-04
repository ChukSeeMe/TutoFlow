"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";

import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer,
} from "recharts";
import Link from "next/link";
import {
  Users, CalendarCheck, TrendingUp, AlertTriangle,
  ArrowRight, Wand2, Plus, Brain, ChevronRight, Clock,
  CheckCircle2, Layers,
} from "lucide-react";
import { studentsApi, sessionsApi, analyticsApi } from "@/lib/api";
import type { Student, LessonSession, StudentAnalytics } from "@/types";
import { formatDatetime, getInitials, cn } from "@/lib/utils";
import { GlassCard } from "@/components/ui/GlassCard";

// ── Animation variants ───────────────────────────────────────────────────────

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.07, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1, y: 0,
    transition: { type: "spring", stiffness: 360, damping: 26 },
  },
};


// ── Floating Sparkle ─────────────────────────────────────────────────────────

function Sparkle({ x, y, size, delay, color }: {
  x: string; y: string; size: number; delay: number; color: string;
}) {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ left: x, top: y }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0, 1, 0.6, 0],
        scale: [0, 1, 0.8, 0],
        y: [0, -24, -40],
      }}
      transition={{ duration: 2.8, delay, repeat: Infinity, repeatDelay: 1.6 + delay }}
    >
      <svg width={size} height={size} viewBox="0 0 16 16" fill={color}>
        <path d="M8 0 L9 6 L15 8 L9 10 L8 16 L7 10 L1 8 L7 6 Z" />
      </svg>
    </motion.div>
  );
}

// ── Floating Orb ─────────────────────────────────────────────────────────────

function Orb({ x, y, size, color, delay }: {
  x: string; y: string; size: number; color: string; delay: number;
}) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none blur-3xl"
      style={{ left: x, top: y, width: size, height: size, background: color }}
      animate={{ scale: [1, 1.15, 1], opacity: [0.35, 0.55, 0.35] }}
      transition={{ duration: 5 + delay, repeat: Infinity, ease: "easeInOut", delay }}
    />
  );
}

// ── Animated Educational SVG Icons ───────────────────────────────────────────

function FloatingBook({ className }: { className?: string }) {
  return (
    <motion.svg
      className={className}
      viewBox="0 0 64 64" fill="none"
      xmlns="http://www.w3.org/2000/svg"
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
    >
      {/* Book cover */}
      <rect x="8" y="10" width="38" height="48" rx="4" fill="#6366f1" opacity="0.9" />
      <rect x="8" y="10" width="6" height="48" rx="4" fill="#4f46e5" />
      {/* Pages */}
      <rect x="14" y="10" width="32" height="48" rx="3" fill="#f0f1ff" />
      {/* Lines */}
      <rect x="20" y="22" width="20" height="2.5" rx="1.25" fill="#a5b4fc" />
      <rect x="20" y="30" width="16" height="2.5" rx="1.25" fill="#a5b4fc" />
      <rect x="20" y="38" width="18" height="2.5" rx="1.25" fill="#a5b4fc" />
      <rect x="20" y="46" width="12" height="2.5" rx="1.25" fill="#c7d2fe" />
      {/* Star on cover */}
      <path d="M32 14 L33.2 17.6 L37 17.6 L34 19.8 L35.2 23.4 L32 21.2 L28.8 23.4 L30 19.8 L27 17.6 L30.8 17.6 Z"
        fill="#fbbf24" />
    </motion.svg>
  );
}

function FloatingGradCap({ className }: { className?: string }) {
  return (
    <motion.svg
      className={className}
      viewBox="0 0 64 64" fill="none"
      xmlns="http://www.w3.org/2000/svg"
      animate={{ y: [0, -9, 0], rotate: [-2, 2, -2] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
    >
      {/* Board */}
      <ellipse cx="32" cy="28" rx="26" ry="9" fill="#8b5cf6" opacity="0.9" />
      {/* Cap top */}
      <rect x="14" y="16" width="36" height="14" rx="4" fill="#6366f1" />
      <ellipse cx="32" cy="16" rx="18" ry="5" fill="#7c3aed" />
      {/* Tassel */}
      <line x1="50" y1="28" x2="54" y2="44" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="54" cy="45" r="3" fill="#fbbf24" />
      {/* Shine */}
      <ellipse cx="24" cy="19" rx="5" ry="2" fill="white" opacity="0.3" />
    </motion.svg>
  );
}

function FloatingPencil({ className }: { className?: string }) {
  return (
    <motion.svg
      className={className}
      viewBox="0 0 64 64" fill="none"
      xmlns="http://www.w3.org/2000/svg"
      animate={{ y: [0, -7, 0], rotate: [10, 14, 10] }}
      transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 1.4 }}
    >
      {/* Pencil body */}
      <rect x="12" y="10" width="16" height="40" rx="3" fill="#fbbf24" />
      <rect x="12" y="10" width="7" height="40" rx="3" fill="#f59e0b" />
      {/* Tip */}
      <path d="M12 50 L20 50 L16 60 Z" fill="#d4a574" />
      <path d="M16 55 L16 60" stroke="#374151" strokeWidth="2" strokeLinecap="round" />
      {/* Eraser */}
      <rect x="12" y="8" width="16" height="6" rx="2" fill="#f9a8d4" />
      {/* Metal band */}
      <rect x="12" y="44" width="16" height="4" fill="#d1d5db" />
      {/* Lines on pencil */}
      <line x1="22" y1="14" x2="22" y2="44" stroke="#f59e0b" strokeWidth="1" opacity="0.5" />
    </motion.svg>
  );
}

function FloatingStar({ className, delay = 0 }: { className?: string; delay?: number }) {
  return (
    <motion.svg
      className={className}
      viewBox="0 0 32 32" fill="none"
      xmlns="http://www.w3.org/2000/svg"
      animate={{ y: [0, -8, 0], rotate: [0, 15, 0], scale: [1, 1.1, 1] }}
      transition={{ duration: 2.8 + delay, repeat: Infinity, ease: "easeInOut", delay }}
    >
      <path d="M16 2 L19.1 11.8 L29.5 11.8 L21.2 17.9 L24.3 27.7 L16 21.6 L7.7 27.7 L10.8 17.9 L2.5 11.8 L12.9 11.8 Z"
        fill="#fbbf24" opacity="0.95" />
    </motion.svg>
  );
}

// ── Hero Banner ───────────────────────────────────────────────────────────────

const heroWords = ["Learn.", "Grow.", "Excel."];

function HeroBanner({ name, today }: { name?: string; today: string }) {

  return (
    <motion.div
      variants={item}
      className="relative overflow-hidden rounded-3xl min-h-[200px] flex items-center"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700" />
      {/* Mesh overlay */}
      <div className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: "radial-gradient(circle at 20% 80%, rgba(251,191,36,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(99,102,241,0.4) 0%, transparent 50%)",
        }}
      />

      {/* Orbs */}
      <Orb x="5%" y="-30%" size={220} color="rgba(139,92,246,0.5)" delay={0} />
      <Orb x="65%" y="40%" size={180} color="rgba(251,191,36,0.25)" delay={2} />
      <Orb x="80%" y="-20%" size={160} color="rgba(99,102,241,0.4)" delay={1} />

      {/* Sparkles */}
      <Sparkle x="12%" y="15%" size={10} delay={0}    color="rgba(251,191,36,0.9)" />
      <Sparkle x="30%" y="75%" size={7}  delay={0.8}  color="rgba(255,255,255,0.7)" />
      <Sparkle x="55%" y="20%" size={8}  delay={1.5}  color="rgba(251,191,36,0.8)" />
      <Sparkle x="70%" y="65%" size={6}  delay={0.4}  color="rgba(255,255,255,0.6)" />
      <Sparkle x="88%" y="25%" size={9}  delay={2.0}  color="rgba(251,191,36,0.75)" />

      {/* Floating illustrations — right side */}
      <div className="absolute right-4 top-0 bottom-0 hidden sm:flex items-center gap-2 pr-4">
        <FloatingBook className="w-14 h-14 drop-shadow-xl opacity-90" />
        <FloatingGradCap className="w-16 h-16 drop-shadow-xl opacity-90 mt-6" />
        <FloatingPencil className="w-10 h-10 drop-shadow-xl opacity-90 -mt-4" />
        <FloatingStar className="w-8 h-8 drop-shadow-lg opacity-80 mt-4" delay={0} />
        <FloatingStar className="w-6 h-6 drop-shadow-lg opacity-70 -mt-6" delay={1.2} />
      </div>

      {/* Text */}
      <div className="relative z-10 px-7 py-8 max-w-lg">
        <motion.p
          className="text-indigo-200 text-sm font-medium mb-1"
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          {today}
        </motion.p>

        <motion.h1
          className="text-3xl sm:text-4xl font-extrabold text-white leading-tight tracking-tight"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          {name ? `Welcome back` : "Welcome to TutorFlow"}
          {name && (
            <motion.span
              className="block text-yellow-300"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              {name} 👋
            </motion.span>
          )}
        </motion.h1>

        {/* Cycling tagline */}
        <div className="mt-3 h-7 overflow-hidden">
          {heroWords.map((word, i) => (
            <motion.p
              key={word}
              className="text-lg font-semibold text-white/80"
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: [0, 1, 1, 0],
                y: [20, 0, 0, -20],
              }}
              transition={{
                duration: 2.4,
                delay: i * 2.4,
                repeat: Infinity,
                repeatDelay: heroWords.length * 2.4 - 2.4,
              }}
              style={{ position: i === 0 ? "relative" : "absolute" }}
            >
              {word}
            </motion.p>
          ))}
        </div>

        <motion.div
          className="mt-4 flex gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
        >
          <Link
            href="/sessions/new"
            className="flex items-center gap-1.5 bg-white text-indigo-700 font-semibold text-sm px-4 py-2 rounded-xl shadow-lg hover:bg-yellow-50 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Log Session
          </Link>
          <Link
            href="/lessons/new"
            className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm text-white font-semibold text-sm px-4 py-2 rounded-xl border border-white/20 hover:bg-white/25 transition-colors"
          >
            <Wand2 className="h-3.5 w-3.5" /> Plan Lesson
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
}

// ── Glassmorphic Chart Tooltip ───────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number; name: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className={cn(
      "px-3 py-2 rounded-xl text-xs",
      "bg-white/90 dark:bg-zinc-900/90",
      "backdrop-blur-xl",
      "border border-gray-200/80 dark:border-white/[0.08]",
      "shadow-glass-light dark:shadow-glass-dark",
    )}>
      <p className="font-semibold text-gray-700 dark:text-zinc-300 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-brand-600 dark:text-brand-400 font-medium num">
          {p.value}%
        </p>
      ))}
    </div>
  );
}

// ── Stat Card ────────────────────────────────────────────────────────────────

type GlowColor = "brand" | "rose" | "emerald" | "amber";

const glowColorMap: Record<GlowColor, string> = {
  brand:   "text-brand-500 dark:text-brand-400",
  rose:    "text-rose-500 dark:text-rose-400",
  emerald: "text-emerald-500 dark:text-emerald-400",
  amber:   "text-amber-500 dark:text-amber-400",
};

const iconBgMap: Record<GlowColor, string> = {
  brand:   "bg-brand-50 dark:bg-brand-500/10",
  rose:    "bg-rose-50 dark:bg-rose-500/10",
  emerald: "bg-emerald-50 dark:bg-emerald-500/10",
  amber:   "bg-amber-50 dark:bg-amber-500/10",
};

function StatCard({
  label, value, icon: Icon, href, glow, sub,
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  glow: GlowColor;
  sub?: string;
}) {
  return (
    <Link href={href} className="block group">
      <GlassCard className="p-4 h-full" interactive>
        <div className="flex items-start justify-between mb-3">
          <div className={cn("p-2 rounded-xl", iconBgMap[glow])}>
            <Icon className={cn("h-4 w-4", glowColorMap[glow])} />
          </div>
          <ChevronRight className="h-3.5 w-3.5 text-gray-300 dark:text-zinc-700 group-hover:text-gray-500 dark:group-hover:text-zinc-400 transition-colors mt-0.5" />
        </div>
        <p className={cn("text-2xl font-bold num", glowColorMap[glow])}>{value}</p>
        <p className="text-xs font-medium text-gray-600 dark:text-zinc-400 mt-0.5">{label}</p>
        {sub && <p className="text-2xs text-gray-400 dark:text-zinc-600 mt-0.5">{sub}</p>}
      </GlassCard>
    </Link>
  );
}

// ── Greeting helpers ──────────────────────────────────────────────────────────

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function todayLabel() {
  return new Date().toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long",
  });
}

// ── Dashboard ────────────────────────────────────────────────────────────────

export default function TutorDashboard() {
  const { data: students = [], isLoading: studentsLoading, isError: studentsError } = useQuery<Student[]>({
    queryKey: ["students"],
    queryFn: () => studentsApi.list().then((r) => r.data),
  });

  const { data: sessions = [], isLoading: sessionsLoading, isError: sessionsError } = useQuery<LessonSession[]>({
    queryKey: ["sessions"],
    queryFn: () => sessionsApi.list().then((r) => r.data),
  });

  const { data: interventionsData } = useQuery({
    queryKey: ["interventions-dashboard"],
    queryFn: () => analyticsApi.interventionsDashboard().then((r) => r.data),
  });

  const isLoading = studentsLoading || sessionsLoading;
  const isError = studentsError && sessionsError;

  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const upcomingSessions = sessions
    .filter((s) => s.status === "scheduled" && new Date(s.scheduled_at) > now)
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
    .slice(0, 4);

  const sessionsThisMonth = sessions.filter((s) => {
    const d = new Date(s.scheduled_at);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });

  const deliveredThisMonth = sessionsThisMonth.filter((s) => s.status === "delivered");

  const attendanceRate = deliveredThisMonth.length === 0
    ? 0
    : Math.round(
        (deliveredThisMonth.filter((s) => s.attendance_status === "present").length /
          deliveredThisMonth.length) * 100
      );

  const attendanceChartData = Array.from({ length: 8 }, (_, i) => {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - (7 - i) * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    const weekSessions = sessions.filter((s) => {
      const d = new Date(s.scheduled_at);
      return d >= weekStart && d < weekEnd && s.status === "delivered";
    });
    const present = weekSessions.filter((s) => s.attendance_status === "present").length;
    return { week: `W${i + 1}`, attendance: weekSessions.length === 0 ? 0 : Math.round((present / weekSessions.length) * 100) };
  });

  const flaggedStudents: Array<{ name: string; flags: string[] }> =
    interventionsData?.students
      ?.filter((s: StudentAnalytics) =>
        s.attendance_rate < 0.6 ||
        (s.average_engagement !== undefined && s.average_engagement < 2.5) ||
        s.topics_needs_reteach > 0 ||
        s.outstanding_homework >= 3 ||
        s.flagged_observations > 0
      )
      .slice(0, 4)
      .map((s: StudentAnalytics) => ({
        name: s.student_name,
        flags: [
          s.attendance_rate < 0.6 && "Low attendance",
          s.average_engagement !== undefined && s.average_engagement < 2.5 && "Low engagement",
          s.topics_needs_reteach > 0 && `${s.topics_needs_reteach} topic${s.topics_needs_reteach > 1 ? "s" : ""} to reteach`,
          s.outstanding_homework >= 3 && `${s.outstanding_homework} overdue tasks`,
          s.flagged_observations > 0 && "Flagged observations",
        ].filter(Boolean) as string[],
      })) ?? [];

  const alertCount = flaggedStudents.length;

  if (isError) {
    return (
      <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
        <div className="rounded-2xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 p-8 text-center space-y-3">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto" />
          <p className="text-sm font-semibold text-red-700 dark:text-red-400">Unable to load dashboard</p>
          <p className="text-xs text-red-600 dark:text-red-500">
            Could not connect to the server. Please refresh the page or try again in a moment.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 text-xs font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
          >
            Reload page
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto">
        <div className="h-48 rounded-3xl skeleton" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-2xl skeleton" />)}
        </div>
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 lg:col-span-5 h-64 rounded-2xl skeleton" />
          <div className="col-span-12 lg:col-span-7 h-64 rounded-2xl skeleton" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto"
    >
      {/* ── Animated Hero Banner ─────────────────────────────────────────── */}
      <HeroBanner today={`${greeting()} · ${todayLabel()}`} />

      {/* ── Stat Cards ──────────────────────────────────────────────────── */}
      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Active Students" value={students.filter((s) => s.is_active).length}
          icon={Users} href="/students" glow="brand" sub="across all year groups"
        />
        <StatCard
          label="Sessions This Month" value={sessionsThisMonth.length}
          icon={CalendarCheck} href="/sessions" glow="emerald"
          sub={`${deliveredThisMonth.length} delivered`}
        />
        <StatCard
          label="Attendance Rate" value={`${attendanceRate}%`}
          icon={TrendingUp} href="/analytics"
          glow={attendanceRate < 70 ? "rose" : attendanceRate < 85 ? "amber" : "emerald"}
          sub="this month"
        />
        <StatCard
          label="Needs Attention" value={alertCount}
          icon={AlertTriangle} href="/interventions"
          glow={alertCount > 0 ? "rose" : "brand"}
          sub={alertCount > 0 ? "students flagged" : "all on track"}
        />
      </motion.div>

      {/* ── Bento row 1: Interventions + Attendance Chart ───────────────── */}
      <div className="grid grid-cols-12 gap-4">
        <motion.div variants={item} className="col-span-12 lg:col-span-5">
          <GlassCard glow={alertCount > 0 ? "rose" : "none"} gradient={alertCount > 0} className="h-full">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100/60 dark:border-white/[0.05]">
              <div className="flex items-center gap-2">
                <AlertTriangle className={cn("h-3.5 w-3.5", alertCount > 0 ? "text-rose-500" : "text-gray-400 dark:text-zinc-500")} />
                <h2 className="text-sm font-semibold text-gray-800 dark:text-zinc-200">Intervention Alerts</h2>
                {alertCount > 0 && (
                  <motion.span
                    className="h-4 min-w-[1rem] px-1 rounded-full bg-rose-500 text-white text-2xs font-bold flex items-center justify-center num"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    {alertCount}
                  </motion.span>
                )}
              </div>
              <Link href="/interventions" className="text-2xs text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-0.5">
                View all <ArrowRight className="h-2.5 w-2.5" />
              </Link>
            </div>
            <div className="divide-y divide-gray-50/60 dark:divide-white/[0.03]">
              {flaggedStudents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 px-5 text-center">
                  <motion.div
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <CheckCircle2 className="h-8 w-8 text-emerald-400 dark:text-emerald-500 mb-2 opacity-70" />
                  </motion.div>
                  <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">All students on track</p>
                  <p className="text-2xs text-gray-400 dark:text-zinc-600 mt-0.5">No flags triggered this week</p>
                </div>
              ) : (
                flaggedStudents.map((s, idx) => (
                  <div key={idx} className="px-5 py-3 flex items-start gap-3">
                    <div className="h-7 w-7 rounded-lg flex-shrink-0 flex items-center justify-center text-2xs font-bold bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400">
                      {getInitials(s.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 dark:text-zinc-200 leading-tight">{s.name}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {s.flags.map((flag) => (
                          <span key={flag} className="text-2xs px-1.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 font-medium">
                            {flag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={item} className="col-span-12 lg:col-span-7">
          <GlassCard className="h-full" glow="brand">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100/60 dark:border-white/[0.05]">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-3.5 w-3.5 text-brand-500 dark:text-brand-400" />
                <h2 className="text-sm font-semibold text-gray-800 dark:text-zinc-200">Attendance Trend</h2>
              </div>
              <span className="text-2xs text-gray-400 dark:text-zinc-600">Last 8 weeks</span>
            </div>
            <div className="px-2 pb-4 pt-4 h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={attendanceChartData} margin={{ top: 4, right: 8, bottom: 0, left: -24 }}>
                  <defs>
                    <linearGradient id="attendanceGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="week" tick={{ fontSize: 10, fill: "currentColor" }} className="text-gray-400 dark:text-zinc-600" axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "currentColor" }} className="text-gray-400 dark:text-zinc-600" axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotoneX" dataKey="attendance" stroke="#6366f1" strokeWidth={2} fill="url(#attendanceGrad)" dot={false} activeDot={{ r: 4, fill: "#6366f1", stroke: "none" }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* ── Upcoming Sessions ────────────────────────────────────────────── */}
      <motion.div variants={item}>
        <GlassCard>
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100/60 dark:border-white/[0.05]">
            <div className="flex items-center gap-2">
              <CalendarCheck className="h-3.5 w-3.5 text-emerald-500" />
              <h2 className="text-sm font-semibold text-gray-800 dark:text-zinc-200">Upcoming Sessions</h2>
            </div>
            <Link href="/sessions" className="text-2xs text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-0.5">
              View all <ArrowRight className="h-2.5 w-2.5" />
            </Link>
          </div>
          {upcomingSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Clock className="h-7 w-7 text-gray-300 dark:text-zinc-700 mb-2" />
              <p className="text-sm text-gray-400 dark:text-zinc-500">No upcoming sessions</p>
              <Link href="/sessions/new" className="mt-3 text-2xs text-brand-600 dark:text-brand-400 hover:underline">Schedule one now</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-gray-50/60 dark:divide-white/[0.03]">
              {upcomingSessions.map((session) => {
                const student = students.find((s) => s.id === session.student_id);
                const name = student?.full_name ?? `Student #${session.student_id}`;
                return (
                  <Link key={session.id} href={`/sessions/${session.id}`}
                    className="group px-5 py-4 hover:bg-gray-50/60 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <div className="h-7 w-7 rounded-lg bg-brand-gradient flex items-center justify-center text-2xs font-bold text-white shadow-glow-sm flex-shrink-0">
                        {getInitials(name)}
                      </div>
                      <p className="text-xs font-semibold text-gray-800 dark:text-zinc-200 truncate">{name}</p>
                    </div>
                    <p className="text-2xs text-gray-400 dark:text-zinc-600 flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5 flex-shrink-0" />
                      {formatDatetime(session.scheduled_at)}
                    </p>
                  </Link>
                );
              })}
            </div>
          )}
        </GlassCard>
      </motion.div>

      {/* ── Bento row 3: Students + Mastery + Resource Studio ───────────── */}
      <div className="grid grid-cols-12 gap-4">
        <motion.div variants={item} className="col-span-12 lg:col-span-4">
          <GlassCard className="h-full">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100/60 dark:border-white/[0.05]">
              <div className="flex items-center gap-2">
                <Users className="h-3.5 w-3.5 text-brand-500 dark:text-brand-400" />
                <h2 className="text-sm font-semibold text-gray-800 dark:text-zinc-200">Students</h2>
              </div>
              <Link href="/students" className="text-2xs text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-0.5">
                View all <ArrowRight className="h-2.5 w-2.5" />
              </Link>
            </div>
            <div className="divide-y divide-gray-50/60 dark:divide-white/[0.03]">
              {students.filter((s) => s.is_active).slice(0, 5).map((student) => (
                <Link key={student.id} href={`/students/${student.id}`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/60 dark:hover:bg-white/[0.02] transition-colors group"
                >
                  <div className="h-7 w-7 rounded-lg bg-brand-gradient flex-shrink-0 flex items-center justify-center text-2xs font-bold text-white shadow-glow-sm">
                    {getInitials(student.full_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 dark:text-zinc-200 truncate">{student.full_name}</p>
                    <p className="text-2xs text-gray-400 dark:text-zinc-600">{student.year_group ?? student.key_stage ?? "—"}</p>
                  </div>
                  <ChevronRight className="h-3 w-3 text-gray-300 dark:text-zinc-700 group-hover:text-brand-500 dark:group-hover:text-brand-400 transition-colors flex-shrink-0" />
                </Link>
              ))}
              {students.filter((s) => s.is_active).length === 0 && (
                <div className="px-5 py-6 text-center">
                  <p className="text-xs text-gray-400 dark:text-zinc-500">No students yet</p>
                  <Link href="/students/new" className="mt-2 text-2xs text-brand-600 dark:text-brand-400 hover:underline block">Add your first student</Link>
                </div>
              )}
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={item} className="col-span-12 lg:col-span-5">
          <GlassCard className="h-full">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100/60 dark:border-white/[0.05]">
              <div className="flex items-center gap-2">
                <Layers className="h-3.5 w-3.5 text-violet-500" />
                <h2 className="text-sm font-semibold text-gray-800 dark:text-zinc-200">Mastery Overview</h2>
              </div>
              <Link href="/mastery" className="text-2xs text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-0.5">
                Heatmap <ArrowRight className="h-2.5 w-2.5" />
              </Link>
            </div>
            <div className="px-5 py-4 space-y-3">
              {[
                { label: "Secure",        color: "bg-emerald-500", pct: 38 },
                { label: "Practising",    color: "bg-amber-400",   pct: 27 },
                { label: "Needs Reteach", color: "bg-rose-500",    pct: 18 },
                { label: "Taught",        color: "bg-blue-400",    pct: 12 },
                { label: "Not Started",   color: "bg-gray-300 dark:bg-zinc-700", pct: 5 },
              ].map(({ label, color, pct }, i) => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-2xs text-gray-500 dark:text-zinc-400 font-medium">{label}</span>
                    <span className="text-2xs text-gray-400 dark:text-zinc-600 num">{pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 dark:bg-white/[0.06] overflow-hidden">
                    <motion.div
                      className={cn("h-full rounded-full", color)}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.9, delay: 0.3 + i * 0.1, ease: "easeOut" }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="px-5 pb-4">
              <p className="text-2xs text-gray-400 dark:text-zinc-600 italic">
                Aggregate across all active students · updated in real-time
              </p>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={item} className="col-span-12 lg:col-span-3">
          <GlassCard className="h-full" glow="brand" gradient>
            <div className="flex flex-col h-full px-5 py-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-xl bg-brand-gradient shadow-glow-sm">
                  <Wand2 className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-xs font-bold text-gray-800 dark:text-zinc-200">Resource Studio</span>
              </div>
              <p className="text-2xs text-gray-500 dark:text-zinc-400 leading-relaxed flex-1">
                Generate worksheets, retrieval quizzes, revision cards, and worked examples — tailored to your student's ability band and year group.
              </p>
              <Link href="/resources"
                className="mt-4 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-white bg-brand-gradient shadow-glow-sm hover:opacity-90 transition-opacity"
              >
                <Brain className="h-3 w-3" /> Open Studio
              </Link>
              <div className="mt-3 space-y-1.5">
                {[
                  { label: "New Lesson Plan", href: "/lessons/new" },
                  { label: "Add Student", href: "/students/new" },
                  { label: "Generate Report", href: "/reports" },
                ].map(({ label, href }) => (
                  <Link key={href} href={href}
                    className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-gray-50/80 dark:bg-white/[0.04] hover:bg-gray-100/80 dark:hover:bg-white/[0.07] border border-gray-200/60 dark:border-white/[0.06] transition-colors group"
                  >
                    <span className="text-2xs font-medium text-gray-600 dark:text-zinc-400">{label}</span>
                    <ArrowRight className="h-2.5 w-2.5 text-gray-300 dark:text-zinc-600 group-hover:text-brand-500 dark:group-hover:text-brand-400 transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </motion.div>
  );
}
