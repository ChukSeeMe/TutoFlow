"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { studentsApi } from "@/lib/api";
import type { StudentDetail, KeyStage, AbilityBand } from "@/types";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

interface FormValues {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  year_group: string;
  key_stage: KeyStage | "";
  ability_band: AbilityBand | "";
  send_notes: string;
  support_strategies: string;
  preferred_scaffolds: string;
  literacy_notes: string;
  communication_preferences: string;
}

const KEY_STAGES: KeyStage[] = ["KS3", "KS4", "KS5", "College"];
const ABILITY_BANDS: AbilityBand[] = ["Foundation", "Core", "Higher", "Extension"];

export default function EditStudentPage() {
  const { id } = useParams<{ id: string }>();
  const studentId = Number(id);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: student, isLoading } = useQuery<StudentDetail>({
    queryKey: ["student", studentId],
    queryFn: () => studentsApi.get(studentId).then((r) => r.data),
  });

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<FormValues>();

  useEffect(() => {
    if (student) {
      reset({
        first_name: student.first_name,
        last_name: student.last_name,
        date_of_birth: student.date_of_birth ?? "",
        year_group: student.year_group ?? "",
        key_stage: student.key_stage ?? "",
        ability_band: student.ability_band ?? "",
        send_notes: student.send_notes ?? "",
        support_strategies: student.support_strategies ?? "",
        preferred_scaffolds: student.preferred_scaffolds ?? "",
        literacy_notes: student.literacy_notes ?? "",
        communication_preferences: student.communication_preferences ?? "",
      });
    }
  }, [student, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<FormValues>) =>
      studentsApi.update(studentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student", studentId] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      router.push(`/students/${studentId}`);
    },
  });

  function onSubmit(values: FormValues) {
    const payload: Record<string, unknown> = {
      first_name: values.first_name,
      last_name: values.last_name,
      year_group: values.year_group || null,
      key_stage: values.key_stage || null,
      ability_band: values.ability_band || null,
      date_of_birth: values.date_of_birth || null,
      send_notes: values.send_notes || null,
      support_strategies: values.support_strategies || null,
      preferred_scaffolds: values.preferred_scaffolds || null,
      literacy_notes: values.literacy_notes || null,
      communication_preferences: values.communication_preferences || null,
    };
    updateMutation.mutate(payload as Partial<FormValues>);
  }

  if (isLoading) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="h-8 bg-gray-200 rounded animate-pulse w-48 mb-6" />
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-12 bg-white rounded-xl border border-gray-200 animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!student) return null;

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/students/${studentId}`} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit profile</h1>
          <p className="text-gray-500 text-sm">{student.full_name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic info */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <p className="text-sm font-semibold text-gray-700">Basic information</p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">First name *</label>
              <input
                {...register("first_name", { required: "Required" })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
              {errors.first_name && <p className="text-xs text-red-500 mt-1">{errors.first_name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Last name *</label>
              <input
                {...register("last_name", { required: "Required" })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
              {errors.last_name && <p className="text-xs text-red-500 mt-1">{errors.last_name.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Date of birth</label>
            <input
              type="date"
              {...register("date_of_birth")}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Year group</label>
              <input
                {...register("year_group")}
                placeholder="e.g. Year 11"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Key stage</label>
              <select
                {...register("key_stage")}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              >
                <option value="">Select…</option>
                {KEY_STAGES.map((ks) => <option key={ks} value={ks}>{ks}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Ability band</label>
              <select
                {...register("ability_band")}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              >
                <option value="">Select…</option>
                {ABILITY_BANDS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* SEND & support notes */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <div>
            <p className="text-sm font-semibold text-gray-700">SEND & support notes</p>
            <p className="text-xs text-gray-400 mt-0.5">Tutor-only. Never shared with parents or AI systems by name.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">SEND notes</label>
            <textarea
              {...register("send_notes")}
              rows={3}
              placeholder="Diagnoses, EHC plan details, adjustments required…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Support strategies</label>
            <textarea
              {...register("support_strategies")}
              rows={2}
              placeholder="Strategies that work well for this student…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Preferred scaffolds</label>
            <textarea
              {...register("preferred_scaffolds")}
              rows={2}
              placeholder="e.g. visual aids, step-by-step guides, worked examples…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Literacy notes</label>
            <textarea
              {...register("literacy_notes")}
              rows={2}
              placeholder="Reading level, writing support needs…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Communication preferences</label>
            <textarea
              {...register("communication_preferences")}
              rows={2}
              placeholder="Preferred communication style, sensory considerations…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
            />
          </div>
        </div>

        {updateMutation.isError && (
          <div className="bg-red-50 text-red-700 rounded-lg px-4 py-3 text-sm border border-red-200">
            Failed to save changes. Please try again.
          </div>
        )}

        <div className="flex gap-3">
          <Link
            href={`/students/${studentId}`}
            className="flex-1 text-center border border-gray-300 text-gray-700 rounded-xl py-3 font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={updateMutation.isPending || !isDirty}
            className="flex-1 flex items-center justify-center gap-2 bg-brand-600 text-white rounded-xl py-3 font-medium hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="h-4 w-4" />
            {updateMutation.isPending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
