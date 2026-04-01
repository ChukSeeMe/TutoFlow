"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { sessionsApi, studentsApi } from "@/lib/api";
import type { LessonSession, Student } from "@/types";
import { formatDatetime } from "@/lib/utils";
import Link from "next/link";
import { Plus, ChevronRight, CalendarCheck } from "lucide-react";

type FilterStatus = "all" | "scheduled" | "delivered" | "cancelled";

export default function SessionsPage() {
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [studentFilter, setStudentFilter] = useState<string>("");

  const { data: sessions = [], isLoading } = useQuery<LessonSession[]>({
    queryKey: ["sessions"],
    queryFn: () => sessionsApi.list().then((r) => r.data),
  });

  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ["students"],
    queryFn: () => studentsApi.list().then((r) => r.data),
  });

  const studentMap = Object.fromEntries(students.map((s) => [s.id, s]));

  const filtered = sessions.filter((s) => {
    if (filter !== "all" && s.status !== filter) return false;
    if (studentFilter && String(s.student_id) !== studentFilter) return false;
    return true;
  });

  const counts = {
    all: sessions.length,
    scheduled: sessions.filter((s) => s.status === "scheduled").length,
    delivered: sessions.filter((s) => s.status === "delivered").length,
    cancelled: sessions.filter((s) => s.status === "cancelled").length,
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sessions</h1>
          <p className="text-gray-500 text-sm mt-1">{sessions.length} total sessions</p>
        </div>
        <Link
          href="/sessions/new"
          className="flex items-center gap-2 bg-brand-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" /> Schedule Session
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          {(["all", "scheduled", "delivered", "cancelled"] as FilterStatus[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                filter === f
                  ? "bg-brand-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}{" "}
              <span className="ml-1 text-xs opacity-70">({counts[f]})</span>
            </button>
          ))}
        </div>

        <select
          value={studentFilter}
          onChange={(e) => setStudentFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white"
        >
          <option value="">All students</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>{s.full_name}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {isLoading && <div className="py-12 text-center text-gray-400 text-sm">Loading...</div>}
        {!isLoading && filtered.length === 0 && (
          <div className="py-12 text-center">
            <CalendarCheck className="h-8 w-8 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No sessions found</p>
            <Link href="/sessions/new" className="mt-2 inline-block text-brand-600 text-sm hover:underline">
              Schedule your first session
            </Link>
          </div>
        )}
        {filtered.map((session) => {
          const student = studentMap[session.student_id];
          const statusColour = {
            scheduled: "bg-blue-100 text-blue-700",
            delivered: "bg-green-100 text-green-700",
            cancelled: "bg-gray-100 text-gray-500",
            no_show: "bg-red-100 text-red-600",
          }[session.status] ?? "bg-gray-100 text-gray-500";

          return (
            <Link
              key={session.id}
              href={`/sessions/${session.id}`}
              className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
            >
              {/* Date block */}
              <div className="w-12 text-center flex-shrink-0">
                <p className="text-xs text-gray-400">
                  {new Date(session.scheduled_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                </p>
                <p className="text-xs font-medium text-gray-600">
                  {new Date(session.scheduled_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">
                  {student?.full_name ?? `Student #${session.student_id}`}
                </p>
                <p className="text-xs text-gray-400">
                  {student?.year_group} {session.lesson_plan_id ? "· Has lesson plan" : ""}
                </p>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColour}`}>
                  {session.status}
                </span>
                {session.status === "delivered" && session.attendance_status && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    session.attendance_status === "present" ? "bg-green-50 text-green-600" :
                    session.attendance_status === "absent" ? "bg-red-50 text-red-600" :
                    "bg-gray-50 text-gray-500"
                  }`}>
                    {session.attendance_status}
                  </span>
                )}
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
