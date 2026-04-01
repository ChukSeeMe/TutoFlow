"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { sessionsApi, studentsApi, lessonsApi } from "@/lib/api";
import type { Student, LessonPlan } from "@/types";
import { PageHeader } from "@/components/ui/PageHeader";

const schema = z.object({
  student_id: z.string().min(1, "Select a student"),
  lesson_plan_id: z.string().optional(),
  scheduled_at: z.string().min(1, "Set a date and time"),
});
type FormData = z.infer<typeof schema>;

export default function NewSessionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedStudent = searchParams.get("student") ?? "";
  const [apiError, setApiError] = useState<string | null>(null);

  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ["students"],
    queryFn: () => studentsApi.list().then((r) => r.data),
  });

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { student_id: preselectedStudent },
  });

  const watchedStudent = watch("student_id");

  const { data: lessonPlans = [] } = useQuery({
    queryKey: ["lessons", watchedStudent],
    queryFn: () => lessonsApi.list(Number(watchedStudent)).then((r) => r.data),
    enabled: !!watchedStudent,
  });

  async function onSubmit(data: FormData) {
    setApiError(null);
    try {
      const res = await sessionsApi.create({
        student_id: Number(data.student_id),
        lesson_plan_id: data.lesson_plan_id ? Number(data.lesson_plan_id) : null,
        scheduled_at: new Date(data.scheduled_at).toISOString(),
      });
      router.push(`/sessions/${res.data.id}`);
    } catch (err: unknown) {
      setApiError(
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "Failed to create session"
      );
    }
  }

  return (
    <div className="p-8 max-w-xl mx-auto">
      <PageHeader title="Schedule Session" backHref="/sessions" backLabel="Back to sessions" />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Student *</label>
            <select {...register("student_id")} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none">
              <option value="">Select student...</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.full_name} — {s.year_group}</option>
              ))}
            </select>
            {errors.student_id && <p className="text-red-600 text-xs mt-1">{errors.student_id.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date and time *</label>
            <input
              type="datetime-local"
              {...register("scheduled_at")}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
            {errors.scheduled_at && <p className="text-red-600 text-xs mt-1">{errors.scheduled_at.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lesson plan (optional)</label>
            <select
              {...register("lesson_plan_id")}
              disabled={!watchedStudent}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none disabled:bg-gray-50"
            >
              <option value="">No lesson plan attached</option>
              {(lessonPlans as LessonPlan[]).map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">You can also link a lesson plan after creating the session.</p>
          </div>
        </div>

        {apiError && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            <p className="text-red-700 text-sm">{apiError}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-brand-600 text-white font-medium py-2.5 rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-60"
        >
          {isSubmitting ? "Scheduling..." : "Schedule Session"}
        </button>
      </form>
    </div>
  );
}
