"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sessionsApi, studentsApi, lessonsApi, observationsApi } from "@/lib/api";
import type { LessonSession, StudentDetail, LessonPlan } from "@/types";
import { formatDatetime } from "@/lib/utils";
import { useState, useEffect, useRef, useCallback } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import Link from "next/link";
import {
  CheckCircle, Clock, User, BookOpen, MessageSquare,
  AlertCircle, ClipboardList, Plus, Loader2, Brain,
  Sparkles, ChevronDown, ChevronUp, Copy, Play,
  Timer, Star, Zap, ChevronRight, SkipForward,
  Flag, CheckSquare, Square,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface SessionInsights {
  highlights: string[];
  follow_up: string[];
  recommended_actions: string[];
  homework_suggestion: string | null;
  parent_summary_draft: string | null;
}

type LessonSection = {
  title?: string;
  duration_mins?: number;
  content?: string;
  teacher_notes?: string;
  activity_type?: string;
};

type LessonContent = {
  sections?: LessonSection[];
  key_vocabulary?: { term?: string; definition?: string }[];
  objective?: string;
  [key: string]: unknown;
};

/* ─── Constants ──────────────────────────────────────────────────────────── */

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

const ACTIVITY_COLORS: Record<string, string> = {
  explain:  "bg-blue-50 text-blue-700 border-blue-200",
  practice: "bg-green-50 text-green-700 border-green-200",
  discuss:  "bg-amber-50 text-amber-700 border-amber-200",
  assess:   "bg-brand-50 text-brand-700 border-brand-200",
};

const ENGAGEMENT_COLORS = ["", "bg-red-500", "bg-orange-400", "bg-yellow-400", "bg-lime-500", "bg-green-500"];
const ENGAGEMENT_LABELS = ["", "Disengaged", "Low", "Moderate", "Good", "Excellent"];

/* ─── Timer hook ─────────────────────────────────────────────────────────── */

function useStopwatch(running: boolean) {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (running) {
      startRef.current = Date.now() - elapsed * 1000;
      const id = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startRef.current!) / 1000));
      }, 1000);
      return () => clearInterval(id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  function reset() { setElapsed(0); startRef.current = null; }
  return { elapsed, reset };
}

function formatTime(secs: number) {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

/* ─── Delivery Dashboard ─────────────────────────────────────────────────── */

interface DeliveryDashboardProps {
  lessonPlan: LessonPlan;
  onFinish: (engagement: number, notes: string) => void;
}

function DeliveryDashboard({ lessonPlan, onFinish }: DeliveryDashboardProps) {
  const content = lessonPlan.content_json as LessonContent | undefined;
  const sections: LessonSection[] = content?.sections ?? [];

  const [sessionRunning, setSessionRunning] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const [completedSections, setCompletedSections] = useState<Set<number>>(new Set());
  const [engagementRating, setEngagementRating] = useState<number | null>(null);
  const [quickNote, setQuickNote] = useState("");
  const [savedNotes, setSavedNotes] = useState<{ time: string; text: string }[]>([]);
  const [expandedSection, setExpandedSection] = useState<number | null>(0);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [finalEngagement, setFinalEngagement] = useState(4);
  const [finalNotes, setFinalNotes] = useState("");

  const { elapsed: sessionElapsed } = useStopwatch(sessionRunning);
  const { elapsed: sectionElapsed, reset: resetSection } = useStopwatch(sessionRunning);

  const totalPlannedMins = sections.reduce((sum, s) => sum + (s.duration_mins ?? 0), 0)
    || lessonPlan.duration_minutes;

  function startSession() {
    setSessionRunning(true);
    setCurrentSection(0);
    setExpandedSection(0);
  }

  function completeSection(idx: number) {
    setCompletedSections((prev) => new Set([...prev, idx]));
    resetSection();
    if (idx < sections.length - 1) {
      setCurrentSection(idx + 1);
      setExpandedSection(idx + 1);
    }
  }

  function saveQuickNote() {
    if (!quickNote.trim()) return;
    setSavedNotes((prev) => [...prev, {
      time: formatTime(sessionElapsed),
      text: quickNote.trim(),
    }]);
    setQuickNote("");
  }

  function handleFinish() {
    const allNotes = savedNotes.map((n) => `[${n.time}] ${n.text}`).join("\n");
    onFinish(finalEngagement, allNotes);
    setShowFinishModal(false);
  }

  const sessionProgress = sections.length > 0
    ? (completedSections.size / sections.length) * 100
    : 0;

  const currentSec = sections[currentSection];
  const plannedSecs = (currentSec?.duration_mins ?? 0) * 60;
  const isOverTime = sessionRunning && plannedSecs > 0 && sectionElapsed > plannedSecs;

  return (
    <div className="space-y-4">
      {/* Session timer bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl",
              sessionRunning ? "bg-green-100" : "bg-gray-100",
            )}>
              <Timer className={cn("h-5 w-5", sessionRunning ? "text-green-600" : "text-gray-400")} />
            </div>
            <div>
              <p className="text-2xl font-mono font-bold text-gray-900">{formatTime(sessionElapsed)}</p>
              <p className="text-xs text-gray-500">of {totalPlannedMins} min planned</p>
            </div>
          </div>

          {/* Progress */}
          <div className="flex-1 max-w-xs">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>{completedSections.size}/{sections.length} sections</span>
              <span>{Math.round(sessionProgress)}%</span>
            </div>
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-green-500 transition-all duration-500"
                style={{ width: `${sessionProgress}%` }}
              />
            </div>
          </div>

          {/* Engagement pulse */}
          <div className="flex flex-col items-center gap-1">
            <p className="text-xs text-gray-500">Engagement</p>
            <div className="flex gap-1">
              {[1,2,3,4,5].map((v) => (
                <button
                  key={v}
                  onClick={() => setEngagementRating(v)}
                  className={cn(
                    "h-6 w-6 rounded-full border-2 transition-all",
                    engagementRating === v
                      ? cn(ENGAGEMENT_COLORS[v], "border-transparent scale-110")
                      : "border-gray-200 bg-white hover:border-gray-400",
                  )}
                  title={ENGAGEMENT_LABELS[v]}
                />
              ))}
            </div>
            {engagementRating && (
              <p className="text-[10px] text-gray-500">{ENGAGEMENT_LABELS[engagementRating]}</p>
            )}
          </div>

          {/* Controls */}
          {!sessionRunning ? (
            <button
              onClick={startSession}
              className="flex items-center gap-2 bg-green-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-green-700 transition-colors"
            >
              <Play className="h-4 w-4" /> Start Delivery
            </button>
          ) : (
            <button
              onClick={() => setShowFinishModal(true)}
              className="flex items-center gap-2 bg-brand-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-brand-700 transition-colors"
            >
              <CheckCircle className="h-4 w-4" /> Finish Session
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Left — sections */}
        <div className="col-span-2 space-y-3">
          {/* Section header */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 text-sm">Lesson Sections</h3>
            {sessionRunning && currentSec && (
              <div className={cn(
                "flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full",
                isOverTime
                  ? "bg-red-100 text-red-700"
                  : "bg-blue-50 text-blue-700",
              )}>
                <Clock className="h-3 w-3" />
                Section: {formatTime(sectionElapsed)}
                {plannedSecs > 0 && ` / ${currentSec.duration_mins}min`}
                {isOverTime && " ⚠ overtime"}
              </div>
            )}
          </div>

          {sections.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
              <BookOpen className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">This lesson plan has no structured sections.</p>
              <p className="text-xs text-gray-400 mt-1">Use the Notes panel to record session activity.</p>
            </div>
          )}

          {sections.map((sec, i) => {
            const isActive = sessionRunning && currentSection === i;
            const isDone = completedSections.has(i);
            const isExpanded = expandedSection === i;

            return (
              <div
                key={i}
                className={cn(
                  "rounded-xl border transition-all",
                  isActive ? "border-brand-300 shadow-sm ring-1 ring-brand-200" :
                  isDone ? "border-green-200 bg-green-50/50" :
                  "border-gray-200 bg-white",
                )}
              >
                {/* Section header row */}
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 text-left"
                  onClick={() => setExpandedSection(isExpanded ? null : i)}
                >
                  {/* Status icon */}
                  <div className={cn(
                    "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                    isDone ? "bg-green-500 text-white" :
                    isActive ? "bg-brand-600 text-white" :
                    "bg-gray-100 text-gray-500",
                  )}>
                    {isDone ? "✓" : i + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-semibold truncate",
                      isDone ? "text-green-800" : isActive ? "text-brand-900" : "text-gray-800",
                    )}>
                      {sec.title ?? `Section ${i + 1}`}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {sec.duration_mins && (
                        <span className="text-xs text-gray-400">{sec.duration_mins} min</span>
                      )}
                      {sec.activity_type && (
                        <span className={cn(
                          "text-[10px] font-medium px-1.5 py-0.5 rounded border capitalize",
                          ACTIVITY_COLORS[sec.activity_type] ?? "bg-gray-50 text-gray-600 border-gray-200",
                        )}>
                          {sec.activity_type}
                        </span>
                      )}
                      {isActive && <span className="text-[10px] text-brand-600 font-semibold animate-pulse">● Active</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isActive && !isDone && (
                      <button
                        onClick={(e) => { e.stopPropagation(); completeSection(i); }}
                        className="flex items-center gap-1 bg-green-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-green-700"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        Complete
                      </button>
                    )}
                    {isExpanded
                      ? <ChevronUp className="h-4 w-4 text-gray-400" />
                      : <ChevronDown className="h-4 w-4 text-gray-400" />
                    }
                  </div>
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-100">
                    {sec.content && (
                      <p className="text-sm text-gray-700 mt-3 leading-relaxed">{sec.content}</p>
                    )}
                    {sec.teacher_notes && (
                      <div className="mt-3 bg-amber-50 rounded-lg px-3 py-2.5 border border-amber-100">
                        <p className="text-xs font-semibold text-amber-700 mb-1">Teacher note</p>
                        <p className="text-xs text-amber-800">{sec.teacher_notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right — quick notes + vocab */}
        <div className="space-y-4">
          {/* Quick note capture */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-brand-600" /> Quick Notes
            </h3>
            <textarea
              value={quickNote}
              onChange={(e) => setQuickNote(e.target.value)}
              rows={3}
              placeholder="Jot observations mid-session…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
              onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) saveQuickNote(); }}
            />
            <button
              onClick={saveQuickNote}
              disabled={!quickNote.trim()}
              className="mt-2 w-full flex items-center justify-center gap-1 bg-gray-100 text-gray-700 text-xs font-medium py-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-40"
            >
              <Plus className="h-3 w-3" /> Save note (Ctrl+Enter)
            </button>

            {savedNotes.length > 0 && (
              <div className="mt-3 space-y-2">
                {savedNotes.map((n, i) => (
                  <div key={i} className="flex gap-2 text-xs">
                    <span className="font-mono text-gray-400 flex-shrink-0">{n.time}</span>
                    <span className="text-gray-700">{n.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Key vocabulary */}
          {content?.key_vocabulary && content.key_vocabulary.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">
                <Brain className="h-4 w-4 text-brand-600" /> Key Vocab
              </h3>
              <div className="space-y-2">
                {content.key_vocabulary.slice(0, 6).map((v, i) => (
                  <div key={i} className="bg-blue-50 rounded-lg px-3 py-2">
                    <p className="text-xs font-semibold text-blue-800">{v.term}</p>
                    <p className="text-[11px] text-blue-700 mt-0.5">{v.definition}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Finish modal */}
      {showFinishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Wrap up session</h2>
            <p className="text-sm text-gray-500 mb-5">Record your final observations before marking the session as delivered.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Overall engagement</label>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map((v) => (
                    <button
                      key={v}
                      onClick={() => setFinalEngagement(v)}
                      className={cn(
                        "flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all",
                        finalEngagement === v
                          ? cn(ENGAGEMENT_COLORS[v], "border-transparent text-white shadow-sm")
                          : "border-gray-200 text-gray-500 hover:border-gray-300",
                      )}
                    >
                      {v}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 text-center mt-1">{ENGAGEMENT_LABELS[finalEngagement]}</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Session notes</label>
                <textarea
                  value={finalNotes}
                  onChange={(e) => setFinalNotes(e.target.value)}
                  rows={4}
                  placeholder="Key moments, breakthroughs, areas needing follow-up…"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
                  defaultValue={savedNotes.map((n) => `[${n.time}] ${n.text}`).join("\n")}
                />
              </div>

              {savedNotes.length > 0 && finalNotes === "" && (
                <button
                  onClick={() => setFinalNotes(savedNotes.map((n) => `[${n.time}] ${n.text}`).join("\n"))}
                  className="text-xs text-brand-600 hover:underline"
                >
                  Import {savedNotes.length} quick note{savedNotes.length !== 1 ? "s" : ""} captured during delivery
                </button>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowFinishModal(false)}
                className="flex-1 border border-gray-300 rounded-xl py-2.5 text-sm text-gray-600 hover:bg-gray-50"
              >
                Continue session
              </button>
              <button
                onClick={handleFinish}
                className="flex-1 bg-green-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-green-700"
              >
                Mark Delivered
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────────────────────────── */

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const sessionId = Number(id);
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"review" | "deliver">("review");
  const [notes, setNotes] = useState("");
  const [summary, setSummary] = useState("");
  const [attendance, setAttendance] = useState("present");
  const [engagement, setEngagement] = useState<number>(3);
  const [isSaving, setIsSaving] = useState(false);
  const [isDelivering, setIsDelivering] = useState(false);

  const [obsContent, setObsContent] = useState("");
  const [obsType, setObsType] = useState("observation");
  const [obsFlagged, setObsFlagged] = useState(false);
  const [obsAdding, setObsAdding] = useState(false);
  const [showObsForm, setShowObsForm] = useState(false);

  const { data: session, isLoading } = useQuery<LessonSession>({
    queryKey: ["session", sessionId],
    queryFn: () => sessionsApi.get(sessionId).then((r) => r.data),
  });

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

  async function handleMarkDelivered(engagementScore?: number, deliveryNotes?: string) {
    setIsDelivering(true);
    const now = new Date().toISOString();
    await updateMutation.mutateAsync({
      status: "delivered",
      attendance_status: attendance,
      engagement_score: engagementScore ?? engagement,
      tutor_notes: deliveryNotes ?? notes,
      session_summary: summary,
      ended_at: now,
    });
    setIsDelivering(false);
    setActiveTab("review");
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

  if (isLoading) return <div className="p-8 text-gray-400">Loading session…</div>;
  if (!session) return <div className="p-8 text-gray-400">Session not found.</div>;

  const isDelivered = session.status === "delivered";
  const content = lessonPlan?.content_json as Record<string, unknown> | undefined;
  const hasSections = Array.isArray((content as { sections?: unknown })?.sections)
    && ((content as { sections: unknown[] }).sections).length > 0;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <PageHeader
        title={student ? `Session — ${student.full_name}` : "Session"}
        subtitle={formatDatetime(session.scheduled_at)}
        backHref="/sessions"
        backLabel="Back to sessions"
        actions={
          !isDelivered ? (
            <button
              onClick={() => handleMarkDelivered()}
              disabled={isDelivering}
              className="flex items-center gap-2 bg-green-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-60"
            >
              {isDelivering ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              {isDelivering ? "Marking…" : "Mark Delivered"}
            </button>
          ) : (
            <span className="flex items-center gap-2 text-sm text-green-600 font-medium">
              <CheckCircle className="h-4 w-4" /> Delivered
            </span>
          )
        }
      />

      {/* Status chips */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <span className={cn("text-xs px-3 py-1 rounded-full font-medium", {
          "bg-green-100 text-green-700": session.status === "delivered",
          "bg-blue-100 text-blue-700": session.status === "scheduled",
          "bg-gray-100 text-gray-600": !["delivered","scheduled"].includes(session.status),
        })}>
          {session.status}
        </span>
        {isDelivered && (
          <span className={cn("text-xs px-3 py-1 rounded-full", {
            "bg-green-50 text-green-700": session.attendance_status === "present",
            "bg-red-50 text-red-600": session.attendance_status === "absent",
            "bg-gray-50 text-gray-600": !["present","absent"].includes(session.attendance_status ?? ""),
          })}>
            {session.attendance_status}
          </span>
        )}
        {isDelivered && session.engagement_score && (
          <span className="text-xs px-3 py-1 rounded-full bg-brand-50 text-brand-700">
            Engagement: {session.engagement_score}/5
          </span>
        )}
      </div>

      {/* Tabs — hide delivery tab if already delivered or no lesson plan */}
      {!isDelivered && lessonPlan && hasSections && (
        <div className="flex gap-1 mb-6 border-b border-gray-200">
          {(["review", "deliver"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={cn(
                "px-5 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px flex items-center gap-1.5",
                activeTab === t
                  ? "border-brand-600 text-brand-700"
                  : "border-transparent text-gray-500 hover:text-gray-700",
              )}
            >
              {t === "deliver" && <Play className="h-3.5 w-3.5" />}
              {t === "review" ? "Review" : "Deliver Live"}
            </button>
          ))}
        </div>
      )}

      {/* ── Deliver Tab ─────────────────────────────────────────────────────── */}
      {activeTab === "deliver" && lessonPlan && (
        <DeliveryDashboard
          lessonPlan={lessonPlan}
          onFinish={(eng, deliveryNotes) => handleMarkDelivered(eng, deliveryNotes)}
        />
      )}

      {/* ── Review Tab ──────────────────────────────────────────────────────── */}
      {activeTab === "review" && (
        <div className="grid grid-cols-3 gap-6">
          {/* Left — recording form */}
          <div className="col-span-2 space-y-5">
            {/* Attendance & Engagement */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="h-4 w-4 text-brand-600" /> Attendance &amp; Engagement
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

            {/* Session notes */}
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
                Observation notes are saved to the student&apos;s profile and inform future recommendations.{" "}
                <Link href={`/students/${session.student_id}`} className="text-brand-600 hover:underline">
                  View all notes for this student →
                </Link>
              </p>
            </div>

            {/* AI Insights — delivered sessions only */}
            {isDelivered && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <button
                  onClick={() => setShowInsights(!showInsights)}
                  className="flex items-center justify-between w-full"
                >
                  <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-brand-600" /> AI Session Insights
                  </h2>
                  {showInsights ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                </button>

                {showInsights && (
                  <div className="mt-4">
                    {insightsFetching ? (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Loader2 className="h-4 w-4 animate-spin" /> Generating insights…
                      </div>
                    ) : insights ? (
                      <div className="space-y-4">
                        {insights.highlights?.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Highlights</p>
                            <ul className="space-y-1">
                              {insights.highlights.map((h, i) => (
                                <li key={i} className="text-sm text-gray-700 flex gap-2">
                                  <span className="text-green-500 flex-shrink-0">✓</span>{h}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {insights.follow_up?.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Follow-up areas</p>
                            <ul className="space-y-1">
                              {insights.follow_up.map((f, i) => (
                                <li key={i} className="text-sm text-gray-700 flex gap-2">
                                  <span className="text-amber-500 flex-shrink-0">→</span>{f}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {insights.parent_summary_draft && (
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Parent summary draft</p>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(insights.parent_summary_draft!);
                                  setCopiedSummary(true);
                                  setTimeout(() => setCopiedSummary(false), 2000);
                                }}
                                className="flex items-center gap-1 text-xs text-brand-600 hover:underline"
                              >
                                <Copy className="h-3 w-3" />
                                {copiedSummary ? "Copied!" : "Copy"}
                              </button>
                            </div>
                            <p className="text-sm text-gray-700 bg-blue-50 rounded-lg p-3">{insights.parent_summary_draft}</p>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right — lesson plan + quick links */}
          <div className="space-y-5">
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

                {!isDelivered && hasSections && (
                  <button
                    onClick={() => setActiveTab("deliver")}
                    className="mt-3 flex items-center gap-1.5 w-full justify-center bg-brand-50 border border-brand-200 text-brand-700 text-xs font-semibold px-3 py-2 rounded-lg hover:bg-brand-100 transition-colors"
                  >
                    <Play className="h-3.5 w-3.5" /> Switch to Deliver mode
                  </button>
                )}

                <Link
                  href={`/lessons/${lessonPlan.id}`}
                  className="mt-2 inline-block text-xs text-brand-600 hover:underline"
                >
                  Open full lesson plan →
                </Link>
              </div>
            )}

            {student && (student.send_notes || student.support_strategies) && (
              <div className="bg-amber-50 rounded-xl border border-amber-100 p-4">
                <h2 className="font-semibold text-amber-900 mb-2 text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600" /> Support Notes
                </h2>
                {student.send_notes && (
                  <p className="text-xs text-amber-800 mb-2">{student.send_notes}</p>
                )}
                {student.support_strategies && (
                  <p className="text-xs text-amber-700">{student.support_strategies}</p>
                )}
              </div>
            )}

            {/* Quick actions */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h2 className="font-semibold text-gray-700 text-xs uppercase tracking-wide mb-3">Quick Actions</h2>
              <div className="space-y-2">
                <Link href="/reports" className="flex items-center gap-2 text-sm text-gray-700 hover:text-brand-600 transition-colors">
                  <ChevronRight className="h-4 w-4 text-gray-400" /> → Generate parent report
                </Link>
                <Link href={`/homework/new?student=${session.student_id}`} className="flex items-center gap-2 text-sm text-gray-700 hover:text-brand-600 transition-colors">
                  <ChevronRight className="h-4 w-4 text-gray-400" /> → Set homework
                </Link>
                <Link href={`/lessons/new?student=${session.student_id}`} className="flex items-center gap-2 text-sm text-gray-700 hover:text-brand-600 transition-colors">
                  <ChevronRight className="h-4 w-4 text-gray-400" /> → Plan next lesson
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
