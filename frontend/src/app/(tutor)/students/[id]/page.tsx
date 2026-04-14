"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  studentsApi, progressApi, analyticsApi, observationsApi, sessionsApi, homeworkApi,
} from "@/lib/api";
import type { StudentDetail, ProgressRecord, StudentAnalytics, ObservationNote, LessonSession, HomeworkTask } from "@/types";
import { formatDate, formatDatetime, masteryLabel, masteryColour, priorityColour, attendancePercent, getInitials } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, BookOpen, AlertTriangle, Target, ClipboardList, Trash2, Loader2, CalendarX, Star } from "lucide-react";

export default function StudentProfilePage() {
  const { id } = useParams<{ id: string }>();
  const studentId = Number(id);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => studentsApi.deactivate(studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      router.push("/students");
    },
  });

  const { data: student, isLoading } = useQuery<StudentDetail>({
    queryKey: ["student", studentId],
    queryFn: () => studentsApi.get(studentId).then((r) => r.data),
  });

  const { data: progress = [] } = useQuery<ProgressRecord[]>({
    queryKey: ["progress", studentId],
    queryFn: () => progressApi.get(studentId).then((r) => r.data),
    enabled: !!studentId,
  });

  const { data: analytics } = useQuery<StudentAnalytics>({
    queryKey: ["analytics", studentId],
    queryFn: () => analyticsApi.studentSummary(studentId).then((r) => r.data),
    enabled: !!studentId,
  });

  const { data: observations = [] } = useQuery<ObservationNote[]>({
    queryKey: ["observations", studentId],
    queryFn: () => observationsApi.list(studentId).then((r) => r.data),
    enabled: !!studentId,
  });

  const { data: sessions = [] } = useQuery<LessonSession[]>({
    queryKey: ["sessions", studentId],
    queryFn: () => sessionsApi.list(studentId).then((r) => r.data),
    enabled: !!studentId,
  });

  const { data: homework = [] } = useQuery<HomeworkTask[]>({
    queryKey: ["homework", studentId],
    queryFn: () => homeworkApi.list(studentId).then((r) => r.data),
    enabled: !!studentId,
  });

  if (isLoading) return <div className="p-8 text-gray-400">Loading student profile...</div>;
  if (!student) return <div className="p-8 text-gray-400">Student not found.</div>;

  const flaggedNotes = observations.filter((n) => n.is_flagged);
  const recentSessions = sessions.slice(0, 5);

  // Missed / no-show sessions
  const missedSessions = sessions.filter(
    (s) => s.attendance_status === "absent" || s.status === "no_show"
  );
  const recentMissed = missedSessions.slice(0, 3);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link href="/students" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to students
        </Link>
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-lg flex-shrink-0">
            {getInitials(student.full_name)}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{student.full_name}</h1>
            <p className="text-gray-500 text-sm">
              {[student.year_group, student.key_stage, student.ability_band].filter(Boolean).join(" · ")}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link
              href={`/students/${studentId}/passport`}
              className="border border-brand-300 text-brand-700 dark:border-brand-500/40 dark:text-brand-400 text-sm font-medium px-4 py-2 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"
            >
              Learning Passport
            </Link>
            <Link
              href={`/students/${studentId}/send`}
              className="border border-brand-300 text-brand-700 dark:border-brand-500/40 dark:text-brand-400 text-sm font-medium px-4 py-2 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"
            >
              SEND & Support
            </Link>
            <Link
              href={`/lessons/new?student=${studentId}`}
              className="bg-brand-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors"
            >
              Plan Lesson
            </Link>
            <Link
              href={`/sessions/new?student=${studentId}`}
              className="border border-gray-300 dark:border-white/10 text-gray-700 dark:text-zinc-300 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors"
            >
              Schedule Session
            </Link>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="border border-red-300 text-red-600 text-sm font-medium px-4 py-2 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" /> Remove Student
            </button>
          </div>

          {/* Delete confirmation modal */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Remove student?</h3>
                <p className="text-sm text-gray-500 mb-5">
                  <strong>{student.full_name}</strong> will be removed from your register. Their session history and progress data will be retained for your records. This can be undone by contacting support.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => deleteMutation.mutate()}
                    disabled={deleteMutation.isPending}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white font-medium py-2.5 rounded-lg hover:bg-red-700 disabled:opacity-60"
                  >
                    {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    {deleteMutation.isPending ? "Removing…" : "Yes, remove"}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 text-sm hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Flagged notes alert */}
      {flaggedNotes.length > 0 && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800 text-sm">
              {flaggedNotes.length} flagged observation{flaggedNotes.length > 1 ? "s" : ""} on record
            </p>
            <p className="text-amber-700 text-xs mt-0.5">Review the observations tab for details.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Left column — analytics + sessions */}
        <div className="col-span-2 space-y-6">
          {/* Analytics cards */}
          {analytics && (
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{analytics.total_sessions}</p>
                <p className="text-xs text-gray-500 mt-0.5">Sessions</p>
              </div>
              <div className={`bg-white rounded-xl border p-4 text-center ${analytics.attendance_rate < 0.8 ? "border-red-200 bg-red-50" : "border-gray-200"}`}>
                <p className={`text-2xl font-bold ${analytics.attendance_rate < 0.8 ? "text-red-600" : "text-green-700"}`}>
                  {attendancePercent(analytics.attendance_rate)}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Attendance</p>
                {analytics.attendance_rate < 0.8 && (
                  <p className="text-[10px] text-red-500 mt-0.5 font-medium">Below 80% target</p>
                )}
              </div>
              <div className={`bg-white rounded-xl border p-4 text-center ${missedSessions.length > 0 ? "border-orange-200" : "border-gray-200"}`}>
                <p className={`text-2xl font-bold ${missedSessions.length > 0 ? "text-orange-600" : "text-gray-900"}`}>
                  {missedSessions.length}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Missed Sessions</p>
                {missedSessions.length > 0 && (
                  <p className="text-[10px] text-orange-500 mt-0.5 font-medium">Needs follow-up</p>
                )}
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                <p className="text-2xl font-bold text-brand-700">
                  {analytics.average_quiz_score ? `${analytics.average_quiz_score}%` : "—"}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Avg Quiz Score</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {analytics.average_engagement ? `${analytics.average_engagement.toFixed(1)}/5` : "—"}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Avg Engagement</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {analytics.topics_secure}
                  <span className="text-sm text-gray-400 ml-1">secure</span>
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{analytics.topics_needs_reteach} need reteach</p>
              </div>
            </div>
          )}

          {/* Mastery map */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Target className="h-4 w-4 text-brand-600" /> Mastery Tracker
              </h2>
              <Link href={`/progress?student=${studentId}`} className="text-xs text-brand-600 hover:underline">
                Full view
              </Link>
            </div>
            <div className="p-5">
              {progress.length === 0 && (
                <p className="text-gray-400 text-sm text-center py-4">No progress data yet</p>
              )}
              <div className="space-y-2">
                {progress.slice(0, 8).map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 truncate">{p.topic_name}</p>
                      <p className="text-xs text-gray-400">{p.subject_name}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${masteryColour(p.mastery_status)}`}>
                      {masteryLabel(p.mastery_status)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recommendations */}
          {analytics && analytics.recommendations.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-brand-600" /> Teaching Recommendations
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">Rule-based — all recommendations require your judgment</p>
              </div>
              <div className="divide-y divide-gray-50">
                {analytics.recommendations.slice(0, 4).map((rec) => (
                  <div key={rec.rule_id} className={`px-5 py-4 border-l-4 ${priorityColour(rec.priority)}`}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm">{rec.title}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white bg-opacity-70 font-medium capitalize flex-shrink-0">
                        {rec.priority}
                      </span>
                    </div>
                    <p className="text-xs mt-1 opacity-80">{rec.description}</p>
                    <p className="text-xs mt-1.5 font-medium opacity-90">→ {rec.action}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Missed sessions */}
          {missedSessions.length > 0 && (
            <div className="bg-white rounded-xl border border-orange-200">
              <div className="flex items-center justify-between px-5 py-4 border-b border-orange-100 bg-orange-50 rounded-t-xl">
                <h2 className="font-semibold text-orange-800 flex items-center gap-2">
                  <CalendarX className="h-4 w-4 text-orange-600" /> Missed Sessions
                  <span className="ml-1 text-xs font-normal bg-orange-200 text-orange-800 px-2 py-0.5 rounded-full">
                    {missedSessions.length} total
                  </span>
                </h2>
                <Link href={`/sessions?student=${studentId}`} className="text-xs text-orange-600 hover:underline">
                  All sessions
                </Link>
              </div>
              <div className="divide-y divide-orange-50">
                {recentMissed.map((s) => (
                  <Link
                    key={s.id}
                    href={`/sessions/${s.id}`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-orange-50 transition-colors"
                  >
                    <div>
                      <p className="text-sm text-gray-800">{formatDatetime(s.scheduled_at)}</p>
                      <p className="text-xs text-gray-400 capitalize">{s.status.replace(/_/g, " ")}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
                        {s.attendance_status === "absent" ? "Absent" : "No show"}
                      </span>
                    </div>
                  </Link>
                ))}
                {missedSessions.length > 3 && (
                  <p className="px-5 py-2 text-xs text-orange-500">
                    + {missedSessions.length - 3} more missed session{missedSessions.length - 3 !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Recent sessions */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-brand-600" /> Recent Sessions
              </h2>
              <Link href={`/sessions?student=${studentId}`} className="text-xs text-brand-600 hover:underline">
                All sessions
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {recentSessions.length === 0 && (
                <p className="text-gray-400 text-sm text-center py-6">No sessions recorded</p>
              )}
              {recentSessions.map((s) => (
                <Link
                  key={s.id}
                  href={`/sessions/${s.id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-gray-50"
                >
                  <div>
                    <p className="text-sm text-gray-800">{formatDatetime(s.scheduled_at)}</p>
                    <p className="text-xs text-gray-400 capitalize">{s.status.replace(/_/g, " ")}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      s.attendance_status === "present" ? "bg-green-100 text-green-700" :
                      s.attendance_status === "absent" ? "bg-red-100 text-red-700" :
                      s.attendance_status === "late" ? "bg-amber-100 text-amber-700" :
                      "bg-gray-100 text-gray-600"
                    }`}>
                      {s.attendance_status}
                    </span>
                    {s.engagement_score && (
                      <span className="text-xs text-gray-400 flex items-center gap-0.5">
                        <Star className="h-3 w-3" />{s.engagement_score}/5
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Right column — SEND notes, homework */}
        <div className="space-y-6">
          {/* SEND / Support */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-3 text-sm">Support Notes</h2>
            <div className="space-y-3">
              {student.send_notes && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">SEND Notes</p>
                  <p className="text-sm text-gray-700 mt-0.5">{student.send_notes}</p>
                </div>
              )}
              {student.support_strategies && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Strategies</p>
                  <p className="text-sm text-gray-700 mt-0.5">{student.support_strategies}</p>
                </div>
              )}
              {student.preferred_scaffolds && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Scaffolds</p>
                  <p className="text-sm text-gray-700 mt-0.5">{student.preferred_scaffolds}</p>
                </div>
              )}
              {student.literacy_notes && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Literacy</p>
                  <p className="text-sm text-gray-700 mt-0.5">{student.literacy_notes}</p>
                </div>
              )}
              {!student.send_notes && !student.support_strategies && (
                <p className="text-gray-400 text-xs">No support notes recorded</p>
              )}
            </div>
            <Link
              href={`/students/${studentId}/edit`}
              className="mt-3 inline-block text-xs text-brand-600 hover:underline"
            >
              Edit notes
            </Link>
          </div>

          {/* Homework */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900 text-sm">Homework</h2>
              <Link href={`/homework?student=${studentId}`} className="text-xs text-brand-600 hover:underline">
                All
              </Link>
            </div>
            {homework.slice(0, 4).map((hw) => (
              <div key={hw.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <p className="text-xs text-gray-700 truncate flex-1 pr-2">{hw.title}</p>
                <span className={`text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                  hw.status === "marked" ? "bg-green-100 text-green-700" :
                  hw.status === "submitted" ? "bg-blue-100 text-blue-700" :
                  hw.status === "overdue" ? "bg-red-100 text-red-700" :
                  "bg-gray-100 text-gray-600"
                }`}>
                  {hw.status}
                </span>
              </div>
            ))}
            {homework.length === 0 && (
              <p className="text-gray-400 text-xs text-center py-2">No homework set</p>
            )}
          </div>

          {/* Quick links */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 text-sm mb-3">Actions</h2>
            <div className="space-y-2">
              {[
                { label: "Generate lesson plan", href: `/lessons/new?student=${studentId}` },
                { label: "Generate homework", href: `/homework/new?student=${studentId}` },
                { label: "Add observation note", href: `/observations/new?student=${studentId}` },
                { label: "Generate report", href: `/reports/new?student=${studentId}` },
              ].map(({ label, href }) => (
                <Link
                  key={href}
                  href={href}
                  className="block text-xs text-brand-600 hover:underline py-0.5"
                >
                  → {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
