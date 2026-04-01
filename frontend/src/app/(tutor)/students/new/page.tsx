"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { studentsApi } from "@/lib/api";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const schema = z.object({
  first_name: z.string().min(1, "Required"),
  last_name: z.string().min(1, "Required"),
  year_group: z.string().optional(),
  key_stage: z.enum(["KS3", "KS4", "KS5", "College"]).optional(),
  ability_band: z.enum(["Foundation", "Core", "Higher", "Extension"]).optional(),
  date_of_birth: z.string().optional(),
  send_notes: z.string().optional(),
  support_strategies: z.string().optional(),
  preferred_scaffolds: z.string().optional(),
  literacy_notes: z.string().optional(),
  communication_preferences: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const YEAR_GROUPS = ["Year 7","Year 8","Year 9","Year 10","Year 11","Year 12","Year 13","Adult/College"];

export default function NewStudentPage() {
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setApiError(null);
    try {
      const res = await studentsApi.create({
        ...data,
        date_of_birth: data.date_of_birth || null,
      });
      router.push(`/students/${res.data.id}`);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "Failed to create student. Please try again.";
      setApiError(message);
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/students" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to students
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Add New Student</h1>
        <p className="text-gray-500 text-sm mt-1">
          Student profiles are only visible to you. SEND notes are kept secure.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First name *</label>
              <input {...register("first_name")} className="input-field" />
              {errors.first_name && <p className="error-text">{errors.first_name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last name *</label>
              <input {...register("last_name")} className="input-field" />
              {errors.last_name && <p className="error-text">{errors.last_name.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year group</label>
              <select {...register("year_group")} className="input-field">
                <option value="">Select...</option>
                {YEAR_GROUPS.map((yg) => <option key={yg} value={yg}>{yg}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Key stage</label>
              <select {...register("key_stage")} className="input-field">
                <option value="">Select...</option>
                {["KS3","KS4","KS5","College"].map((ks) => <option key={ks} value={ks}>{ks}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ability band</label>
              <select {...register("ability_band")} className="input-field">
                <option value="">Select...</option>
                {["Foundation","Core","Higher","Extension"].map((ab) => <option key={ab} value={ab}>{ab}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of birth</label>
              <input type="date" {...register("date_of_birth")} className="input-field" />
            </div>
          </div>
        </div>

        {/* SEND / Support notes */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start gap-3 mb-4">
            <div>
              <h2 className="font-semibold text-gray-900">Support & SEND Notes</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                These notes inform your teaching. They are never shared automatically and require your approval before any parent communication.
                Do not include medical diagnoses — record pedagogical strategies only.
              </p>
            </div>
          </div>

          {[
            { key: "send_notes", label: "SEND / Support notes" },
            { key: "support_strategies", label: "Effective support strategies" },
            { key: "preferred_scaffolds", label: "Preferred scaffolds" },
            { key: "literacy_notes", label: "Literacy support notes" },
            { key: "communication_preferences", label: "Communication preferences" },
          ].map(({ key, label }) => (
            <div key={key} className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <textarea
                {...register(key as keyof FormData)}
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                placeholder="Optional..."
              />
            </div>
          ))}
        </div>

        {apiError && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            <p className="text-red-700 text-sm">{apiError}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-brand-600 text-white font-medium py-2.5 rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-60"
          >
            {isSubmitting ? "Saving..." : "Add Student"}
          </button>
          <Link
            href="/students"
            className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>

      <style jsx>{`
        .input-field {
          width: 100%;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          outline: none;
          background: white;
        }
        .input-field:focus {
          ring: 2px solid #3b82f6;
        }
        .error-text {
          color: #dc2626;
          font-size: 0.75rem;
          margin-top: 0.25rem;
        }
      `}</style>
    </div>
  );
}
