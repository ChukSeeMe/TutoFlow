"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sessionsApi, studentsApi, lessonsApi, observationsApi, homeworkApi } from "@/lib/api";
import type { LessonSession, StudentDetail, LessonPlan } from "@/types";
import { formatDatetime } from "@/lib/utils";
import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import Link from "next/link";
import {
  CheckCircle, Clock, User, BookOpen, MessageSquare,
  AlertCircle, ClipboardList, Plus, Loader2, Brain,
  Sparkles, ChevronDown, ChevronUp, Copy,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SessionInsights {
  highlights: string[];
  follow_up: string[];
  recommended_actions: string[];
  homework_suggestion: string | null;
  parent_summary_draft: string | null;
}

const ENGAGEMENT_OPTIONS = [
  { value: 1, label: "1 — Disengaged" },
  { value: 2, label: "2 — Low" },
  { value: 3, label: "3 — Moderate" },
  { value: 4, label: "4 — Good" },
  { value: 5, label: "5 — Excellent" },
];

const ATTENDANCE_OPTIONS = [
  { value: "present", label: "Present" },
  { value: "late", label: "Late" },
  { value: "absent", label: "Absent" },
  { value: "cancelled", label: "Cancelled" },
];

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const sessionId = Number(id);
  const queryClient = useQueryClient();

  const [notes, setNotes] = useState("");
  const [summary, setSummary] = useState("");
  const [attendance, setAttendance] = useState("present");
  const [engagement, setEngagement] = useState<number>(3);
  const [isSaving, setIsSaving] = useState(false);
  const [isDelivering, setIsDelivering] = useState(false);

  // Observation form state
  const [obsContent, setObsContent] = useState("");
  const [obsType, setObsType] = useState("observation");
  const [obsFlagged, setObsFlagged] = useState(false);
  const [obsAdding, setObsAdding] = useState(false);
  const [showObsForm, setShowObsForm] = useState(false);

  const { data: session, isLoading } = useQuery<LessonSession>({
    queryKey: ["session", sessionId],
    queryFn: () => sessionsApi.get(sessionId).then((r) => r.data),
  });

  // Seed form state from loaded data (runs once when session first loads)
  const [seeded, setSeeded] = useState(false);
  if (session && !seeded) {
    if (session.tutor_notes) setNotes(session.tutor_notes);
    if (session.session_summary) setSummary(session.session_summary);
    if (session.attendance_status) setAttendance(session.attendance_status);
    if (session.engagement_score) setEngagement(session.engagement_score);
    setSeeded(true);
  }

  const { data: student } = useQuery<StudentDetail>({
    queryKey: ["student", session?.student_id],
    queryFn: () => studentsApi.get(session!.student_id).then((r) => r.data),
    enabled: !!session,
  });

  const { data: lessonPlan } = useQuery<LessonPlan>({
    queryKey: ["lesson", session?.lesson_plan_id],
    queryFn: () => lessonsApi.get(session!.lesson_plan_id!).then((r) => r.data),
    enabled: !!session?.lesson_plan_id,
  });

  const [showInsights, setShowInsights] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const { data: insights, isFetching: insightsFetching } = useQuery<SessionInsights>({
    queryKey: ["session-insights", sessionId],
    queryFn: () => sessionsApi.insights(sessionId).then((r) => r.data),
    enabled: showInsights && !!session && session.status === "delivered",
    staleTime: Infinity,
  });

  const updateMutation = useMutation({
    mutationFn: (data: object) => sessionsApi.update(sessionId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["session", sessionId] }),
  });

  async function handleSaveNotes() {
    setIsSaving(true);
    await updateMutation.mutateAsync({
      tutor_notes: notes,
      session_summary: summary,
      attendance_status: attendance,
      engagement_score: engagement,
    });
    setIsSaving(false);
  }

  async function handleMarkDelivered() {
    setIsDelivering(true);
    const now = new Date().toISOString();
    await updateMutation.mutateAsync({
      status: "delivered",
      attendance_status: attendance,
      engagement_score: engagement,
      tutor_notes: notes,
      session_summary: summary,
      ended_at: now,
    });
    setIsDelivering(false);
  }

  async function handleAddObservation() {
    if (!obsContent.trim() || !session) return;
    setObsAdding(true);
    try {
      await observationsApi.create({
        student_id: session.student_id,
        session_id: sessionId,
        note_type: obsType,
        content: obsContent.trim(),
        is_flagged: obsFlagged,
      });
      setObsContent("");
      setObsType("observation");
      setObsFlagged(false);
      setShowObsForm(false);
    } finally {
      setObsAdding(false);
    }
  }

  if (isLoading) return <div className="p-8 text-gray-400">Loading session...</div>;
  if (!session) return <div className="p-8 text-gray-400">Session not found.</div>;

  const isDelivered = session.status === "delivered";
  const content = lessonPlan?.content_json as Record<string, unknown> | undefined;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <PageHeader
        title={student ? `Session — ${student.full_name}` : "Session"}
        subtitle={formatDatetime(session.scheduled_at)}
        backHref="/sessions"
        backLabel="Back to sessions"
        actions={
          !isDelivered ? (
            <button
              onClick={handleMarkDelivered}
              disabled={isDelivering}
              className="flex items-center gap-2 bg-green-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-60"
            >
              {isDelivering ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              {isDelivering ? "Marking..." : "Mark Delivered"}
            </button>
          ) : (
            <span className="flex items-center gap-2 text-sm text-green-600 font-medium">
              <CheckCircle className="h-4 w-4" /> Delivered
            </span>
          )
        }
      />

      {/* Status bar */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <span className={`text-xs px-3 py-1 rounded-full font-medium ${
          session.status === "delivered" ? "bg-green-100 text-green-700" :
          session.status === "scheduled" ? "bg-blue-100 text-blue-700" :
          "bg-gray-100 text-gray-600"
        }`}>
          {session.status}
        </span>
        {isDelivered && (
          <span className={`text-xs px-3 py-1 rounded-full ${
            session.attendance_status === "present" ? "bg-green-50 text-green-700" :
            session.attendance_status === "absent" ? "bg-red-50 text-red-600" :
            "bg-gray-50 text-gray-600"
          }`}>
            {session.attendance_status}
          </span>
        )}
        {isDelivered && session.engagement_score && (
          <span className="text-xs px-3 py-1 rounded-full bg-purple-50 text-purple-700">
            Engagement: {session.engagement_score}/5
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left — recording form */}
        <div className="col-span-2 space-y-5">
          {/* Attendance & Engagement */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="h-4 w-4 text-brand-600" /> Attendance & Engagement
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Attendance</label>
                <select
                  value={attendance}
                  onChange={(e) => setAttendance(e.target.value)}
                  disabled={isDelivered}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white disabled:bg-gray-50"
                >
                  {ATTENDANCE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Engagement (1–5)</label>
                <select
                  value={engagement}
                  onChange={(e) => setEngagement(Number(e.target.value))}
                  disabled={isDelivered}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white disabled:bg-gray-50"
                >
                  {ENGAGEMENT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Tutor notes */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-brand-600" /> Session Notes
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
                  In-session notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={isDelivered}
                  rows={4}
                  placeholder="What happened in this session? Key moments, questions asked, difficulties observed..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
                  Session summary (parent-facing optional)
                </label>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  disabled={isDelivered}
                  rows={3}
                  placeholder="Brief summary suitable for parent communication if needed..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-gray-50"
                />
              </div>
            </div>
            {!isDelivered && (
              <button
                onClick={handleSaveNotes}
                disabled={isSaving}
                className="mt-3 flex items-center gap-2 bg-gray-100 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-200 disabled:opacity-60"
              >
                {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                {isSaving ? "Saving..." : "Save notes"}
              </button>
            )}
          </div>

          {/* Observation notes */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-brand-600" /> Observation Notes
              </h2>
              <button
                onClick={() => setShowObsForm(true)}
                className="flex items-center gap-1 text-xs text-brand-600 hover:underline"
              >
                <Plus className="h-3 w-3" /> Add observation
              </button>
            </div>

            {showObsForm && (
              <div className="mb-4 border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
                    <select
                      value={obsType}
                      onChange={(e) => setObsType(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white"
                    >
                      {["observation","strength","misconception","concern","engagement","behaviour","general"].map((t) => (
                        <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end pb-1">
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={obsFlagged}
                        onChange={(e) => setObsFlagged(e.target.checked)}
                        className="rounded"
                      />
                      <span className="flex items-center gap-1 text-amber-700">
                        <AlertCircle className="h-3.5 w-3.5" /> Flag this note
                      </span>
                    </label>
                  </div>
                </div>
                <textarea
                  value={obsContent}
                  onChange={(e) => setObsContent(e.target.value)}
                  rows={3}
                  placeholder="Record your observation..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAddObservation}
                    disabled={!obsContent.trim() || obsAdding}
                    className="flex items-center gap-2 bg-brand-600 text-white text-sm font-medium px-4 py-1.5 rounded-lg hover:bg-brand-700 disabled:opacity-60"
                  >
                    {obsAdding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                    Add note
                  </button>
                  <button
                    onClick={() => setShowObsForm(false)}
                    className="px-4 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <p className="text-xs text-gray-400">
              Observation notes are saved to the student&apos;s profile and inform future recommendations.
              {" "}<Link href={`/students/${session.student_id}`} className="text-brand-600 hover:underline">
                View all notes for this student →
              </Link>
            </p>
          </div>
        </div>

        {/* Right — lesson plan + quick links */}
        <div className="space-y-5">
          {/* Lesson plan reference */}
          {lessonPlan && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                <BookOpen className="h-4 w-4 text-brand-600" /> Lesson Plan
              </h2>
              <p className="font-medium text-sm text-gray-800">{lessonPlan.title}</p>
              <p className="text-xs text-gray-500 mt-0.5 capitalize">
                {lessonPlan.lesson_type.replace("_", " ")} · {lessonPlan.duration_minutes}min
              </p>
              <p className="text-xs text-gray-600 mt-2 line-clamp-2">{lessonPlan.learning_objective}</p>

              {/* Exit ticket from lesson plan */}
              {content && (content.exit_ticket as { questions?: string[] })?.questions && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-500 mb-1.5">Exit ticket questions:</p>
                  <ul className="space-y-1">
                    {((content.exit_ticket as { questions?: string[] }).questions ?? []).slice(0, 3).map((q, i) => (
                      <li key={i} className="text-xs text-gray-600">• {q}</li>
                    ))}
                  </ul>
                </div>
              )}

              <Link
                href={`/lessons/${lessonPlan.id}`}
                className="mt-3 inline-block text-xs text-brand-600 hover:underline"
              >
                Open full lesson plan →
              </Link>
            </div>
          )}

          {/* Student support notes */}
          {student && (student.send_notes || student.support_strategies) && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-amber-800 mb-2">Support Reminders</p>
              {student.support_strategies && (
                <p className="text-xs text-amber-700">{student.support_strategies}</p>
              )}
              {student.preferred_scaffolds && (
                <p className="text-xs text-amber-600 mt-1">{student.preferred_scaffolds}</p>
              )}
            </div>
          )}

          {/* Quick actions */}
          <div className="bg-white dark:bg-[#16161f] rounded-xl border border-gray-200 dark:border-white/[0.07] p-5">
            <h2 className="font-semibold text-gray-900 dark:text-zinc-100 text-sm mb-3">After this session</h2>
            <div className="space-y-2">
              <Link href={`/homework/new?student=${session.student_id}&session=${sessionId}`} className="block text-xs text-brand-600 dark:text-brand-400 hover:underline">→ Generate homework task</Link>
              <Link href={`/assessments/new?student=${session.student_id}&session=${sessionId}`} className="block text-xs text-brand-600 dark:text-brand-400 hover:underline">→ Create quiz or exit ticket</Link>
              <Link href="/reports" className="block text-xs text-brand-600 dark:text-brand-400 hover:underline">→ Generate parent report</Link>
              <Link href={`/students/${session.student_id}`} className="block text-xs text-brand-600 dark:text-brand-400 hover:underline">→ View student profile</Link>
            </div>
          </div>

          {/* AI Session Insights */}
          {isDelivered && (
            <div className="bg-white dark:bg-[#16161f] rounded-xl border border-brand-200 dark:border-brand-500/30 overflow-hidden">
              <button
                onClick={() => setShowInsights(!showInsights)}
                className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-brand-50 dark:hover:bg-brand-500/[0.08] transition-colors"
              >
                <div className="h-6 w-6 rounded-lg bg-brand-gradient flex items-center justify-center flex-shrink-0">
                  <Brain className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-sm font-semibold text-brand-700 dark:text-brand-300 flex-1">AI Session Insights</span>
                {insightsFetching
                  ? <Loader2 className="h-4 w-4 animate-spin text-brand-500" />
                  : showInsights
                  ? <ChevronUp className="h-4 w-4 text-gray-400" />
                  : <ChevronDown className="h-4 w-4 text-gray-400" />
                }
              </button>

              {showInsights && insights && (
                <div className="px-4 pb-4 space-y-3 border-t border-brand-100 dark:border-brand-500/20 pt-3">
                  {/* Highlights */}
                  {insights.highlights.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1.5 uppercase tracking-wide">What went well</p>
                      <ul className="space-y-1">
                        {insights.highlights.map((h, i) => (
                          <li key={i} className="text-xs text-gray-700 dark:text-zinc-300 flex gap-1.5">
                            <span className="text-green-500 flex-shrink-0">✓</span>{h}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Follow-up */}
                  {insights.follow_up.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1.5 uppercase tracking-wide">To review</p>
                      <ul className="space-y-1">
                        {insights.follow_up.map((f, i) => (
                          <li key={i} className="text-xs text-gray-700 dark:text-zinc-300 flex gap-1.5">
                            <span className="text-amber-500 flex-shrink-0">→</span>{f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recommended actions */}
                  {insights.recommended_actions.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1.5 uppercase tracking-wide">Suggested actions</p>
                      <ul className="space-y-1">
                        {insights.recommended_actions.map((a, i) => (
                          <li key={i} className="text-xs text-gray-700 dark:text-zinc-300 flex gap-1.5">
                            <span className="text-blue-500 flex-shrink-0">•</span>{a}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Homework suggestion */}
                  {insights.homework_suggestion && (
                    <div className="bg-brand-50 dark:bg-brand-500/10 rounded-lg p-3 border border-brand-100 dark:border-brand-500/20">
                      <p className="text-xs font-semibold text-brand-700 dark:text-brand-400 mb-1 flex items-center gap-1">
                        <Sparkles className="h-3 w-3" /> Homework suggestion
                      </p>
                      <p className="text-xs text-brand-700 dark:text-brand-300">{insights.homework_suggestion}</p>
                    </div>
                  )}

                  {/* Parent summary draft */}
                  {insights.parent_summary_draft && (
                    <div className="bg-gray-50 dark:bg-white/[0.03] rounded-lg p-3 border border-gray-100 dark:border-white/[0.06]">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-semibold text-gray-600 dark:text-zinc-400">Parent summary draft</p>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(insights.parent_summary_draft!);
                            setCopiedSummary(true);
                            setTimeout(() => setCopiedSummary(false), 2000);
                          }}
                          className="text-[10px] flex items-center gap-1 text-gray-400 dark:text-zinc-600 hover:text-gray-600 dark:hover:text-zinc-400"
                        >
                          <Copy className="h-3 w-3" />
                          {copiedSummary ? "Copied!" : "Copy"}
                        </button>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-zinc-400 italic">&ldquo;{insights.parent_summary_draft}&rdquo;</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
