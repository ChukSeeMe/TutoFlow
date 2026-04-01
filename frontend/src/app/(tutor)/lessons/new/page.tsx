"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { studentsApi, curriculumApi, lessonsApi } from "@/lib/api";
import type { Student, Subject, Topic } from "@/types";
import Link from "next/link";
import { ArrowLeft, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

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

export default function NewLessonPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedStudent = searchParams.get("student");

  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

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
    setApiError(null);
    setIsGenerating(true);
    try {
      const res = await lessonsApi.generate({
        student_id: Number(data.student_id),
        topic_id: Number(data.topic_id),
        lesson_type: data.lesson_type,
        duration_minutes: data.duration_minutes,
        difficulty_level: data.difficulty_level,
        learning_objective: data.learning_objective,
        send_context: data.send_context || null,
        prior_knowledge: data.prior_knowledge || null,
        additional_notes: data.additional_notes || null,
      });
      router.push(`/lessons/${res.data.id}`);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "Could not generate lesson. Please try again.";
      setApiError(message);
    } finally {
      setIsGenerating(false);
    }
  }

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

        {apiError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-lg px-4 py-3">
            <p className="text-red-700 dark:text-red-400 text-sm">{apiError}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isGenerating}
          className="w-full flex items-center justify-center gap-2 bg-brand-gradient text-white font-medium py-3 rounded-xl shadow-glow-sm hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating lesson plan...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate Lesson Plan
            </>
          )}
        </button>
      </form>
    </div>
  );
}
