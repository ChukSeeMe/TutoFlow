"use client";

import { useQuery } from "@tanstack/react-query";
import { parentsApi } from "@/lib/api";
import type { ChildSummary } from "@/types";
import { formatDate } from "@/lib/utils";
import {
  BookOpen, Calendar, Activity, Clock,
  MessageSquare, Receipt, FileText, ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { ParentReviewScene } from "@/components/ui/PortalScenes";

function ChildCard({ child }: { child: ChildSummary }) {
  const attendancePct = child.attendance_rate != null
    ? Math.round(child.attendance_rate * 100)
    : null;
  const totalTopics = child.topics_secure + child.topics_needs_reteach;
  const masteryPct = totalTopics > 0 ? Math.round((child.topics_secure / totalTopics) * 100) : 0;

  return (
    <div className="bg-white dark:bg-[#16161f] rounded-xl border border-gray-200 dark:border-white/[0.07] p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-11 w-11 rounded-full bg-brand-100 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300 flex items-center justify-center text-sm font-bold flex-shrink-0">
          {child.first_name[0]}
        </div>
        <div>
          <p className="font-semibold text-gray-900 dark:text-zinc-100">{child.first_name}</p>
          <p className="text-xs text-gray-500 dark:text-zinc-500">
            {[child.year_group, child.key_stage].filter(Boolean).join(" · ")}
          </p>
        </div>
        {child.outstanding_homework > 0 && (
          <span className="ml-auto text-xs font-medium bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 px-2 py-0.5 rounded-full">
            {child.outstanding_homework} task{child.outstanding_homework > 1 ? "s" : ""} due
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-gray-50 dark:bg-white/[0.03] rounded-lg p-3 text-center">
          <Calendar className="h-3.5 w-3.5 text-gray-400 dark:text-zinc-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-gray-900 dark:text-zinc-100">{child.total_sessions}</p>
          <p className="text-[10px] text-gray-500 dark:text-zinc-500">Sessions</p>
        </div>
        <div className="bg-gray-50 dark:bg-white/[0.03] rounded-lg p-3 text-center">
          <BookOpen className="h-3.5 w-3.5 text-gray-400 dark:text-zinc-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-gray-900 dark:text-zinc-100">{child.topics_secure}</p>
          <p className="text-[10px] text-gray-500 dark:text-zinc-500">Secure</p>
        </div>
        <div className="bg-gray-50 dark:bg-white/[0.03] rounded-lg p-3 text-center">
          <Activity className="h-3.5 w-3.5 text-gray-400 dark:text-zinc-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-gray-900 dark:text-zinc-100">
            {attendancePct !== null ? `${attendancePct}%` : "—"}
          </p>
          <p className="text-[10px] text-gray-500 dark:text-zinc-500">Attend.</p>
        </div>
      </div>

      {totalTopics > 0 && (
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-500 dark:text-zinc-500">Topic mastery</span>
            <span className="text-gray-700 dark:text-zinc-300 font-medium">{masteryPct}%</span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-500 rounded-full transition-all"
              style={{ width: `${masteryPct}%` }}
            />
          </div>
          {child.topics_needs_reteach > 0 && (
            <p className="text-xs text-red-500 dark:text-red-400 mt-1">
              {child.topics_needs_reteach} topic{child.topics_needs_reteach > 1 ? "s" : ""} need review
            </p>
          )}
        </div>
      )}

      {child.last_session_date && (
        <p className="text-xs text-gray-400 dark:text-zinc-600">
          Last session: {formatDate(child.last_session_date)}
        </p>
      )}
    </div>
  );
}

const QUICK_LINKS = [
  { href: "/parent/timeline",  icon: Activity,      label: "Activity Timeline", desc: "See everything in one feed" },
  { href: "/parent/sessions",  icon: Clock,         label: "Session Notes",     desc: "What happened in each lesson" },
  { href: "/parent/reports",   icon: FileText,      label: "Progress Reports",  desc: "Tutor-approved summaries" },
  { href: "/parent/messages",  icon: MessageSquare, label: "Messages",          desc: "Communicate with the tutor" },
  { href: "/parent/invoice",   icon: Receipt,       label: "Invoice",           desc: "Session billing summary" },
];

export default function ParentDashboard() {
  const { data: children = [], isLoading } = useQuery<ChildSummary[]>({
    queryKey: ["parent-children"],
    queryFn: () => parentsApi.myChildren().then((r) => r.data),
  });

  return (
    <div className="space-y-6">

      {/* ── Hero scene banner ─────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl shadow-lg">
        <ParentReviewScene className="w-full" />
        <div className="absolute inset-0 flex flex-col justify-end p-5 bg-gradient-to-t from-[#04091a]/85 via-[#04091a]/20 to-transparent">
          <p className="text-white/55 text-xs font-medium tracking-widest uppercase mb-1">Family portal</p>
          <h1 className="text-2xl font-extrabold text-white leading-tight">Parent Overview</h1>
          <p className="text-sky-300 text-sm mt-1">
            Your child&apos;s progress, approved and shared by their tutor.
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-52 bg-white dark:bg-[#16161f] rounded-xl border border-gray-200 dark:border-white/[0.07] animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && children.length === 0 && (
        <div className="bg-white dark:bg-[#16161f] rounded-xl border border-gray-200 dark:border-white/[0.07] py-12 text-center">
          <BookOpen className="h-8 w-8 text-gray-300 dark:text-zinc-700 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-zinc-500 text-sm">No children linked to your account yet.</p>
          <p className="text-gray-400 dark:text-zinc-600 text-xs mt-1">Your tutor will link your child&apos;s profile.</p>
        </div>
      )}

      {children.map((child) => (
        <ChildCard key={child.student_id} child={child} />
      ))}

      {children.length > 0 && (
        <>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-zinc-300 uppercase tracking-wide">
            Quick Access
          </h2>
          <div className="bg-white dark:bg-[#16161f] rounded-xl border border-gray-200 dark:border-white/[0.07] divide-y divide-gray-100 dark:divide-white/[0.04]">
            {QUICK_LINKS.map(({ href, icon: Icon, label, desc }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="inline-flex p-2 rounded-lg bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-zinc-100 text-sm">{label}</p>
                    <p className="text-xs text-gray-500 dark:text-zinc-500">{desc}</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400 dark:text-zinc-600" />
              </Link>
            ))}
          </div>
        </>
      )}

      <div className="bg-blue-50 dark:bg-blue-500/[0.08] rounded-xl p-4 border border-blue-100 dark:border-blue-500/20">
        <p className="text-xs text-blue-700 dark:text-blue-400 font-medium mb-1">Privacy notice</p>
        <p className="text-xs text-blue-600 dark:text-blue-500">
          All information shown here has been personally reviewed and approved by your child&apos;s tutor.
          Sensitive learning support notes are not included.
        </p>
      </div>
    </div>
  );
}
