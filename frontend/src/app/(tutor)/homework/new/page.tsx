"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { homeworkApi, studentsApi, curriculumApi } from "@/lib/api";
import type { Student, Subject, Topic } from "@/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { Sparkles, Loader2 } from "lucide-react";

const schema = z.object({
  student_id: z.string().min(1, "Select a student"),
  subject_id: z.string().min(1, "Select a subject"),
  topic_id: z.string().min(1, "Select a topic"),
  difficulty_level: z.enum(["foundation","core","higher","extension"]),
  num_tasks: z.coerce.number().min(1).max(10),
  due_date: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function NewHomeworkPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preStudent = searchParams.get("student") ?? "";
  const preSession = searchParams.get("session") ?? "";

  const [selectedSubject, setSelectedSubject] = useState<string>("");
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
    queryKey: ["topics", selectedSubject],
    queryFn: () => curriculumApi.topics(Number(selectedSubject)).then((r) => r.data),
    enabled: !!selectedSubject,
  });

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { student_id: preStudent, num_tasks: 3, difficulty_level: "core" },
  });

  async function onSubmit(data: FormData) {
    setApiError(null);
    setIsGenerating(true);
    try {
      await homeworkApi.generate({
        student_id: Number(data.student_id),
        session_id: preSession ? Number(preSession) : null,
        topic_id: Number(data.topic_id),
        difficulty_level: data.difficulty_level,
        num_tasks: data.num_tasks,
        due_date: data.due_date || null,
      });
      router.push(`/homework?student=${data.student_id}`);
    } catch (err: unknown) {
      setApiError(
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "Failed to generate homework"
      );
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="p-8 max-w-xl mx-auto">
      <PageHeader title="Generate Homework" backHref="/homework" backLabel="Back to homework" />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Student *</label>
            <select {...register("student_id")} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
              <option value="">Select student...</option>
              {students.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
            </select>
            {errors.student_id && <p className="text-red-600 text-xs mt-1">{errors.student_id.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
            <select
              {...register("subject_id")}
              onChange={(e) => { setValue("subject_id", e.target.value); setValue("topic_id", ""); setSelectedSubject(e.target.value); }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="">Select subject...</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            {errors.subject_id && <p className="text-red-600 text-xs mt-1">{errors.subject_id.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Topic *</label>
            <select {...register("topic_id")} disabled={!selectedSubject} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white disabled:bg-gray-50">
              <option value="">Select topic...</option>
              {(topics as Topic[]).map((t) => <option key={t.id} value={t.id}>{t.name} {t.year_group ? `(${t.year_group})` : ""}</option>)}
            </select>
            {errors.topic_id && <p className="text-red-600 text-xs mt-1">{errors.topic_id.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
              <select {...register("difficulty_level")} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                {["foundation","core","higher","extension"].map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Number of tasks</label>
              <input type="number" {...register("num_tasks")} min={1} max={10} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due date (optional)</label>
            <input type="date" {...register("due_date")} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>

        {apiError && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3"><p className="text-red-700 text-sm">{apiError}</p></div>}

        <button
          type="submit"
          disabled={isGenerating}
          className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white font-medium py-3 rounded-xl hover:bg-brand-700 disabled:opacity-60"
        >
          {isGenerating ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</> : <><Sparkles className="h-4 w-4" /> Generate Homework</>}
        </button>

        <p className="text-xs text-gray-400 text-center">
          AI-generated homework requires your approval before the student can see it.
        </p>
      </form>
    </div>
  );
}
