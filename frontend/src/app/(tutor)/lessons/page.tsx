"use client";

import { useQuery } from "@tanstack/react-query";
import { lessonsApi, studentsApi } from "@/lib/api";
import type { LessonPlan, Student } from "@/types";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { Plus, CheckCircle, Clock } from "lucide-react";

export default function LessonsPage() {
  const { data: plans = [], isLoading } = useQuery<LessonPlan[]>({
    queryKey: ["lessons"],
    queryFn: () => lessonsApi.list().then((r) => r.data),
  });

  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ["students"],
    queryFn: () => studentsApi.list().then((r) => r.data),
  });

  const studentMap = Object.fromEntries(students.map((s) => [s.id, s]));

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lesson Plans</h1>
          <p className="text-gray-500 text-sm mt-1">{plans.length} plan{plans.length !== 1 ? "s" : ""}</p>
        </div>
        <Link
          href="/lessons/new"
          className="flex items-center gap-2 bg-brand-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" /> Plan a Lesson
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {isLoading && <div className="py-12 text-center text-gray-400 text-sm">Loading...</div>}
        {!isLoading && plans.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-gray-400 text-sm">No lesson plans yet.</p>
            <Link href="/lessons/new" className="mt-2 inline-block text-brand-600 text-sm hover:underline">
              Create your first lesson plan
            </Link>
          </div>
        )}
        {plans.map((plan) => {
          const student = studentMap[plan.student_id];
          return (
            <Link key={plan.id} href={`/lessons/${plan.id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{plan.title}</p>
                <p className="text-sm text-gray-500">
                  {student?.full_name ?? `Student #${plan.student_id}`} ·{" "}
                  {plan.lesson_type.replace("_", " ")} · {plan.difficulty_level}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="h-3 w-3" /> {plan.duration_minutes}m
                </span>
                {plan.tutor_approved ? (
                  <span className="flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle className="h-3 w-3" /> Approved
                  </span>
                ) : (
                  <span className="text-xs text-amber-600">Draft</span>
                )}
                <span className="text-xs text-gray-400">{formatDate(plan.created_at)}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
