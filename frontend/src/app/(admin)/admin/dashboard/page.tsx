"use client";

import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";
import {
  Users, GraduationCap, UserCheck, Shield,
  CalendarCheck, BookOpen, UserPlus, Activity,
} from "lucide-react";

interface Stats {
  total_users: number; tutors: number; students: number;
  parents: number; admins: number; active_users: number;
  total_sessions: number; total_lessons: number;
  total_students: number; new_users_this_month: number;
}

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: number | string;
  sub?: string; color: string;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-[rgb(var(--bg-card))] p-5">
      <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="mt-0.5 text-sm text-[rgb(var(--text-secondary))]">{label}</p>
      {sub && <p className="mt-1 text-xs text-green-400">{sub}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const { data, isLoading } = useQuery<Stats>({
    queryKey: ["admin-stats"],
    queryFn: () => adminApi.stats().then(r => r.data),
    refetchInterval: 30_000,
  });

  if (isLoading || !data) {
    return (
      <div className="flex h-full items-center justify-center p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  const cards = [
    { icon: Users,        label: "Total Users",          value: data.total_users,         color: "bg-indigo-500/15 text-indigo-400",  sub: `+${data.new_users_this_month} this month` },
    { icon: GraduationCap,label: "Tutors",               value: data.tutors,               color: "bg-violet-500/15 text-violet-400" },
    { icon: BookOpen,     label: "Students (profiles)",  value: data.total_students,       color: "bg-blue-500/15 text-blue-400" },
    { icon: UserCheck,    label: "Parents",              value: data.parents,              color: "bg-emerald-500/15 text-emerald-400" },
    { icon: Activity,     label: "Active Users",         value: data.active_users,         color: "bg-cyan-500/15 text-cyan-400" },
    { icon: CalendarCheck,label: "Total Sessions",       value: data.total_sessions,       color: "bg-amber-500/15 text-amber-400" },
    { icon: BookOpen,     label: "Lesson Plans",         value: data.total_lessons,        color: "bg-pink-500/15 text-pink-400" },
    { icon: Shield,       label: "Admins",               value: data.admins,               color: "bg-red-500/15 text-red-400" },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
          Platform-wide overview — live stats
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(c => <StatCard key={c.label} {...c} />)}
      </div>

      {/* Breakdown */}
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {/* User breakdown */}
        <div className="rounded-2xl border border-white/8 bg-[rgb(var(--bg-card))] p-6">
          <h2 className="mb-4 font-semibold">User breakdown</h2>
          <div className="space-y-3">
            {[
              { label: "Tutors",   count: data.tutors,     total: data.total_users, color: "bg-violet-500" },
              { label: "Students", count: data.students,   total: data.total_users, color: "bg-blue-500" },
              { label: "Parents",  count: data.parents,    total: data.total_users, color: "bg-emerald-500" },
              { label: "Admins",   count: data.admins,     total: data.total_users, color: "bg-red-500" },
            ].map(({ label, count, total, color }) => (
              <div key={label}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-[rgb(var(--text-secondary))]">{label}</span>
                  <span className="font-medium">{count}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/8">
                  <div
                    className={`h-full rounded-full ${color}`}
                    style={{ width: total ? `${(count / total) * 100}%` : "0%" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="rounded-2xl border border-white/8 bg-[rgb(var(--bg-card))] p-6">
          <h2 className="mb-4 font-semibold">Quick actions</h2>
          <div className="space-y-3">
            {[
              { href: "/admin/users",  label: "Manage users",     desc: "Activate, deactivate or change roles" },
              { href: "/admin/audit",  label: "View audit logs",  desc: "See all system activity" },
            ].map(({ href, label, desc }) => (
              <a
                key={href}
                href={href}
                className="flex items-center justify-between rounded-xl border border-white/8 bg-[rgb(var(--bg))]/50 px-4 py-3 hover:border-indigo-500/30 hover:bg-[rgb(var(--bg-card))] transition-all group"
              >
                <div>
                  <p className="text-sm font-medium group-hover:text-indigo-400 transition-colors">{label}</p>
                  <p className="text-xs text-[rgb(var(--text-secondary))]">{desc}</p>
                </div>
                <span className="text-[rgb(var(--text-tertiary))] group-hover:text-indigo-400 transition-colors">→</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
