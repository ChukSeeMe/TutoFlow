"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { studentPortalApi } from "@/lib/api";
import type { StudentDashboardData, HomeworkStatus } from "@/types";
import { formatDate, formatDatetime } from "@/lib/utils";
import { BookOpen, CheckCircle, Calendar, ClipboardList, ChevronRight } from "lucide-react";
import Link from "next/link";
import { StudentNightScene } from "@/components/ui/PortalScenes";

const statusColour: Record<HomeworkStatus, string> = {
  set: "bg-blue-100 text-blue-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  submitted: "bg-green-100 text-green-700",
  marked: "bg-purple-100 text-purple-700",
  overdue: "bg-red-100 text-red-700",
};

const statusLabel: Record<HomeworkStatus, string> = {
  set: "To do",
  in_progress: "In progress",
  submitted: "Submitted",
  marked: "Marked",
  overdue: "Overdue",
};

export default function StudentDashboard() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<StudentDashboardData>({
    queryKey: ["student-dashboard"],
    queryFn: () => studentPortalApi.dashboard().then((r) => r.data),
  });

  const submitMutation = useMutation({
    mutationFn: (id: number) => studentPortalApi.submitHomework(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["student-dashboard"] }),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse w-48" />
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-white rounded-xl border border-gray-200 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const pendingHomework = data.homework.filter(
    (h) => h.status === "set" || h.status === "in_progress" || h.status === "overdue"
  );

  return (
    <div className="space-y-6">

      {/* ── Hero scene banner ────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl shadow-lg">
        <StudentNightScene className="w-full" />
        {/* Overlay text */}
        <div className="absolute inset-0 flex flex-col justify-end p-5 bg-gradient-to-t from-[#07071a]/80 via-[#07071a]/20 to-transparent">
          <p className="text-white/60 text-xs font-medium tracking-widest uppercase mb-1">Your learning journey</p>
          <h1 className="text-2xl font-extrabold text-white leading-tight">
            Welcome back{data.student_name ? `, ${data.student_name.split(" ")[0]}` : ""}!
          </h1>
          {data.year_group && (
            <p className="text-indigo-300 text-sm mt-1">{data.year_group}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="inline-flex p-2 rounded-lg bg-blue-50 text-blue-600 mb-2"><Calendar className="h-4 w-4" /></div>
          <p className="text-xl font-bold text-gray-900">{data.upcoming_sessions}</p>
          <p className="text-xs text-gray-500 mt-0.5">Upcoming sessions</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="inline-flex p-2 rounded-lg bg-green-50 text-green-600 mb-2"><CheckCircle className="h-4 w-4" /></div>
          <p className="text-xl font-bold text-gray-900">{data.topics_secure}</p>
          <p className="text-xs text-gray-500 mt-0.5">Topics secure</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="inline-flex p-2 rounded-lg bg-purple-50 text-purple-600 mb-2"><BookOpen className="h-4 w-4" /></div>
          <p className="text-xl font-bold text-gray-900">{data.total_topics_tracked}</p>
          <p className="text-xs text-gray-500 mt-0.5">Topics tracked</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className={`inline-flex p-2 rounded-lg mb-2 ${data.outstanding_homework > 0 ? "bg-red-50 text-red-600" : "bg-gray-50 text-gray-600"}`}>
            <ClipboardList className="h-4 w-4" />
          </div>
          <p className="text-xl font-bold text-gray-900">{data.outstanding_homework}</p>
          <p className="text-xs text-gray-500 mt-0.5">Outstanding tasks</p>
        </div>
      </div>

      {pendingHomework.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <p className="font-semibold text-gray-900">Tasks to complete</p>
            <Link href="/student/tasks" className="text-xs text-brand-600 hover:underline flex items-center gap-1">
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {pendingHomework.slice(0, 4).map((hw) => (
              <div key={hw.id} className="flex items-center justify-between px-5 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{hw.title}</p>
                  {hw.due_date && (
                    <p className={`text-xs mt-0.5 ${hw.status === "overdue" ? "text-red-500" : "text-gray-400"}`}>
                      Due {formatDate(hw.due_date)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColour[hw.status]}`}>
                    {statusLabel[hw.status]}
                  </span>
                  {(hw.status === "set" || hw.status === "in_progress" || hw.status === "overdue") && (
                    <button onClick={() => submitMutation.mutate(hw.id)} disabled={submitMutation.isPending}
                      className="text-xs text-brand-600 hover:underline font-medium">
                      Submit
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.recent_sessions.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200">
          <p className="font-semibold text-gray-900 px-5 py-4 border-b border-gray-100">Recent sessions</p>
          <div className="divide-y divide-gray-50">
            {data.recent_sessions.slice(0, 3).map((s) => (
              <div key={s.id} className="flex items-center justify-between px-5 py-3">
                <p className="text-sm text-gray-700">{formatDatetime(s.scheduled_at)}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  s.attendance_status === "present" ? "bg-green-100 text-green-700" :
                  s.attendance_status === "late" ? "bg-yellow-100 text-yellow-700" :
                  s.attendance_status === "absent" ? "bg-red-100 text-red-700" :
                  "bg-gray-100 text-gray-600"}`}>
                  {s.attendance_status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Link href="/student/tasks" className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow flex items-center gap-3">
          <ClipboardList className="h-5 w-5 text-brand-600" />
          <span className="text-sm font-medium text-gray-800">My tasks</span>
        </Link>
        <Link href="/student/progress" className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow flex items-center gap-3">
          <BookOpen className="h-5 w-5 text-brand-600" />
          <span className="text-sm font-medium text-gray-800">My progress</span>
        </Link>
      </div>
    </div>
  );
}
