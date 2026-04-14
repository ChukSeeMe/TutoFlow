"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { studentsApi, curriculumApi, getAccessToken } from "@/lib/api";
import type { Student, Subject, Topic } from "@/types";
import Link from "next/link";
import { ArrowLeft, Sparkles, Loader2, CheckCircle, Brain, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api/backend";

const schema = z.object({
  student_id: z.string().min(1, "Select a student"),
  subject_id: z.string().min(1, "Select a subject"),
  topic_id: z.string().min(1, "Select a topic"),
  lesson_type: z.enum(["introduction","revision","exam_prep","intervention","catch_up","consolidation","assessment"]),
  duration_minutes: z.coerce.number().min(15).max(180),
  difficulty_level: z.enum(["foundation","core","higher","extension"]),
  learning_objective: z.string().min(10, "Describe what the student will learn"),
  send_context: z.string().optional(),
  prior_knowledge: z.string().optional(),
  additional_notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const inputCn = cn(
  "w-full border rounded-lg px-3 py-2 text-sm",
  "focus:outline-none focus:ring-2 focus:ring-brand-500/50",
  "bg-white dark:bg-[#1e1e28]",
  "border-gray-300 dark:border-white/[0.1]",
  "text-gray-800 dark:text-zinc-200",
  "placeholder:text-gray-400 dark:placeholder:text-zinc-600",
  "[color-scheme:light] dark:[color-scheme:dark]",
);

const labelCn = "block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1";

const sectionCn = cn(
  "rounded-xl border p-6 space-y-4",
  "bg-white dark:bg-white/[0.03]",
  "border-gray-200 dark:border-white/[0.07]",
);

/* ─── Streaming generation state ──────────────────────────────────────────── */
type StreamPhase =
  | { kind: "idle" }
  | { kind: "streaming"; status: string; chunks: string }
  | { kind: "done"; lessonId: number; title: string }
  | { kind: "error"; message: string };

const PHASE_LABELS = [
  "Loading curriculum data…",
  "Structuring lesson framework…",
  "Generating with AI…",
  "Validating and saving…",
];

function StreamingPanel({ phase, onReset }: { phase: StreamPhase; onReset: () => void }) {
  const router = useRouter();
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (textRef.current) {
      textRef.current.scrollTop = textRef.current.scrollHeight;
    }
  }, [phase.kind === "streaming" && (phase as { chunks: string }).chunks]);

  useEffect(() => {
    if (phase.kind === "done") {
      const timer = setTimeout(() => {
        router.push(`/lessons/${(phase as { lessonId: number }).lessonId}`);
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [phase, router]);

  const currentStep = phase.kind === "streaming"
    ? PHASE_LABELS.indexOf((phase as { status: string }).status)
    : phase.kind === "done" ? PHASE_LABELS.length : -1;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-4">
        <div className={cn(
          "flex h-9 w-9 items-center justify-center rounded-xl",
          phase.kind === "done" ? "bg-green-100" : "bg-brand-100",
        )}>
          {phase.kind === "done"
            ? <CheckCircle className="h-5 w-5 text-green-600" />
            : <Brain className="h-5 w-5 text-brand-600 animate-pulse" />
          }
        </div>
        <div>
          <p className="font-semibold text-gray-900 text-sm">
            {phase.kind === "done" ? "Lesson plan ready" : "Generating lesson plan"}
          </p>
          <p className="text-xs text-gray-500">
            {phase.kind === "streaming"
              ? (phase as { status: string }).status
              : phase.kind === "done"
              ? "Redirecting you to review the plan…"
              : ""}
          </p>
        </div>
        {phase.kind === "error" && (
          <button
            onClick={onReset}
            className="ml-auto text-xs text-red-600 hover:underline"
          >
            Try again
          </button>
        )}
      </div>

      {/* Progress steps */}
      <div className="flex items-center gap-2 px-6 py-3 border-b border-gray-100">
        {PHASE_LABELS.map((label, i) => (
          <div key={label} className="flex items-center gap-2 flex-1 min-w-0">
            <div className={cn(
              "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
              i < currentStep
                ? "bg-green-500 text-white"
                : i === currentStep
                ? "bg-brand-600 text-white animate-pulse"
                : "bg-gray-100 text-gray-400",
            )}>
              {i < currentStep ? "✓" : i + 1}
            </div>
            {i < PHASE_LABELS.length - 1 && (
              <div className={cn(
                "h-px flex-1",
                i < currentStep ? "bg-green-400" : "bg-gray-200",
              )} />
            )}
          </div>
        ))}
      </div>

      {/* Streaming text preview */}
      {phase.kind === "streaming" && (phase as { chunks: string }).chunks && (
        <div
          ref={textRef}
          className="h-64 overflow-y-auto px-6 py-4 font-mono text-xs leading-relaxed text-gray-600 bg-gray-50"
        >
          {(phase as { chunks: string }).chunks}
          <span className="inline-block h-3 w-1 bg-brand-500 animate-pulse ml-0.5 align-middle" />
        </div>
      )}

      {phase.kind === "error" && (
        <div className="px-6 py-4 bg-red-50">
          <p className="text-sm text-red-700">{(phase as { message: string }).message}</p>
        </div>
      )}

      {phase.kind === "done" && (
        <div className="px-6 py-4 flex items-center gap-3 bg-green-50">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-800">
              {(phase as { title: string }).title}
            </p>
            <p className="text-xs text-green-700 mt-0.5">Opening lesson plan now…</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NewLessonPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedStudent = searchParams.get("student");

  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [phase, setPhase] = useState<StreamPhase>({ kind: "idle" });

  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ["students"],
    queryFn: () => studentsApi.list().then((r) => r.data),
  });

  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: ["subjects"],
    queryFn: () => curriculumApi.subjects().then((r) => r.data),
  });

  const { data: topics = [] } = useQuery<Topic[]>({
    queryKey: ["topics", selectedSubjectId],
    queryFn: () => curriculumApi.topics(selectedSubjectId!).then((r) => r.data),
    enabled: !!selectedSubjectId,
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      student_id: preselectedStudent || "",
      duration_minutes: 60,
      lesson_type: "introduction",
      difficulty_level: "core",
    },
  });

  async function onSubmit(data: FormData) {
    setPhase({ kind: "streaming", status: "Loading curriculum data…", chunks: "" });

    const token = getAccessToken();
    let response: Response;

    try {
      response = await fetch(`${API_URL}/lessons/generate/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          student_id: Number(data.student_id),
          topic_id: Number(data.topic_id),
          lesson_type: data.lesson_type,
          duration_minutes: data.duration_minutes,
          difficulty_level: data.difficulty_level,
          learning_objective: data.learning_objective,
          send_context: data.send_context || null,
          prior_knowledge: data.prior_knowledge || null,
          additional_notes: data.additional_notes || null,
        }),
      });
    } catch {
      setPhase({ kind: "error", message: "Network error — please check your connection and try again." });
      return;
    }

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      let detail = "Could not generate lesson. Please try again.";
      try {
        detail = JSON.parse(errText)?.detail ?? detail;
      } catch { /* ignore */ }
      setPhase({ kind: "error", message: detail });
      return;
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        try {
          const event = JSON.parse(line.slice(6)) as {
            type: "status" | "chunk" | "done" | "error";
            message?: string;
            text?: string;
            lesson_id?: number;
            title?: string;
          };

          if (event.type === "status") {
            setPhase((p) => ({
              ...(p as { kind: "streaming"; chunks: string }),
              status: event.message ?? "",
            }));
          } else if (event.type === "chunk") {
            setPhase((p) => {
              if (p.kind !== "streaming") return p;
              return { ...p, chunks: p.chunks + (event.text ?? "") };
            });
          } else if (event.type === "done") {
            setPhase({
              kind: "done",
              lessonId: event.lesson_id!,
              title: event.title ?? "Lesson Plan",
            });
          } else if (event.type === "error") {
            setPhase({ kind: "error", message: event.message ?? "An error occurred." });
          }
        } catch { /* malformed SSE line — skip */ }
      }
    }
  }

  const isGenerating = phase.kind === "streaming" || phase.kind === "done";

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href="/lessons"
          className="flex items-center gap-1 text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200 mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Back to lessons
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-50">Plan a Lesson</h1>
        <p className="text-gray-500 dark:text-zinc-400 text-sm mt-1">
          AI will generate a structured lesson plan. You review and edit it before use.
        </p>
      </div>

      {/* Streaming panel — shown while generating */}
      {phase.kind !== "idle" && (
        <div className="mb-6">
          <StreamingPanel phase={phase} onReset={() => setPhase({ kind: "idle" })} />
        </div>
      )}

      {/* Form — hidden while streaming/done */}
      {!isGenerating && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Student + curriculum */}
          <div className={sectionCn}>
            <h2 className="font-semibold text-gray-900 dark:text-zinc-100">Student &amp; Topic</h2>

            <div>
              <label className={labelCn}>Student *</label>
              <select {...register("student_id")} className={inputCn}>
                <option value="">Select student...</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.full_name} — {s.year_group}</option>
                ))}
              </select>
              {errors.student_id && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.student_id.message}</p>}
            </div>

            <div>
              <label className={labelCn}>Subject *</label>
              <select
                {...register("subject_id")}
                onChange={(e) => {
                  setValue("subject_id", e.target.value);
                  setValue("topic_id", "");
                  setSelectedSubjectId(Number(e.target.value) || null);
                }}
                className={inputCn}
              >
                <option value="">Select subject...</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              {errors.subject_id && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.subject_id.message}</p>}
            </div>

            <div>
              <label className={labelCn}>Topic *</label>
              <select
                {...register("topic_id")}
                disabled={!selectedSubjectId}
                className={cn(inputCn, "disabled:opacity-50 disabled:cursor-not-allowed")}
              >
                <option value="">Select topic...</option>
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} {t.year_group ? `(${t.year_group})` : ""}
                  </option>
                ))}
              </select>
              {errors.topic_id && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.topic_id.message}</p>}
            </div>
          </div>

          {/* Lesson parameters */}
          <div className={sectionCn}>
            <h2 className="font-semibold text-gray-900 dark:text-zinc-100">Lesson Parameters</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCn}>Lesson type</label>
                <select {...register("lesson_type")} className={inputCn}>
                  {["introduction","revision","exam_prep","intervention","catch_up","consolidation","assessment"].map((t) => (
                    <option key={t} value={t}>{t.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCn}>Duration (minutes)</label>
                <input
                  type="number"
                  {...register("duration_minutes")}
                  min={15} max={180} step={15}
                  className={inputCn}
                />
              </div>
            </div>

            <div>
              <label className={labelCn}>Difficulty level</label>
              <select {...register("difficulty_level")} className={inputCn}>
                {["foundation","core","higher","extension"].map((d) => (
                  <option key={d} value={d}>{d.replace(/\b\w/g, l => l.toUpperCase())}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelCn}>Learning objective *</label>
              <textarea
                {...register("learning_objective")}
                rows={2}
                placeholder="e.g. Students will be able to solve quadratic equations by factorisation"
                className={cn(inputCn, "resize-none")}
              />
              {errors.learning_objective && (
                <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.learning_objective.message}</p>
              )}
            </div>
          </div>

          {/* Optional context */}
          <div className={sectionCn}>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-zinc-100">Optional Context for AI</h2>
              <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
                Do not include student names or identifying information. Describe strategies and context only.
              </p>
            </div>

            <div>
              <label className={labelCn}>Support needs context</label>
              <textarea
                {...register("send_context")}
                rows={2}
                placeholder="e.g. Student benefits from step-by-step worked examples and sentence starters"
                className={cn(inputCn, "resize-none")}
              />
            </div>

            <div>
              <label className={labelCn}>Prior knowledge</label>
              <textarea
                {...register("prior_knowledge")}
                rows={2}
                placeholder="e.g. Student has covered expanding brackets and knows the quadratic formula"
                className={cn(inputCn, "resize-none")}
              />
            </div>

            <div>
              <label className={labelCn}>Additional notes</label>
              <textarea
                {...register("additional_notes")}
                rows={2}
                placeholder="Any other context for the lesson generator..."
                className={cn(inputCn, "resize-none")}
              />
            </div>
          </div>

          {phase.kind === "error" && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-lg px-4 py-3">
              <p className="text-red-700 dark:text-red-400 text-sm">{(phase as { message: string }).message}</p>
            </div>
          )}

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-brand-gradient text-white font-medium py-3 rounded-xl shadow-glow-sm hover:opacity-90 transition-opacity"
          >
            <Sparkles className="h-4 w-4" />
            Generate Lesson Plan
          </button>

          {/* Speed info */}
          <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1">
            <Zap className="h-3 w-3 text-yellow-500" />
            Streams live — typically ready in 20–40 seconds
          </p>
        </form>
      )}
    </div>
  );
}
