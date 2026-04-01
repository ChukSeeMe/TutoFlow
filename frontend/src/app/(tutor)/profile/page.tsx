"use client";

import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "@/lib/api";
import type { TutorProfile } from "@/types";
import { useForm, useFieldArray } from "react-hook-form";
import { PageHeader } from "@/components/ui/PageHeader";
import { Save, Plus, Trash2, User } from "lucide-react";

interface Qualification {
  title: string;
  institution: string;
}

interface FormValues {
  first_name: string;
  last_name: string;
  bio: string;
  phone: string;
  subjects: string;          // comma-separated input
  qualifications: Qualification[];
}

export default function ProfilePage() {
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery<TutorProfile>({
    queryKey: ["tutor-profile"],
    queryFn: () => usersApi.myProfile().then((r) => r.data),
  });

  const { register, handleSubmit, reset, control, formState: { isDirty, errors } } = useForm<FormValues>({
    defaultValues: { qualifications: [] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "qualifications" });

  useEffect(() => {
    if (profile) {
      reset({
        first_name: profile.first_name,
        last_name: profile.last_name,
        bio: profile.bio ?? "",
        phone: profile.phone ?? "",
        subjects: (profile.subjects_json ?? []).join(", "),
        qualifications: (profile.qualifications_json ?? []) as Qualification[],
      });
    }
  }, [profile, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<TutorProfile>) => usersApi.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tutor-profile"] });
    },
  });

  function onSubmit(values: FormValues) {
    const subjects = values.subjects
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    updateMutation.mutate({
      first_name: values.first_name,
      last_name: values.last_name,
      bio: values.bio || undefined,
      phone: values.phone || undefined,
      subjects_json: subjects.length > 0 ? subjects : undefined,
      qualifications_json: values.qualifications.filter((q) => q.title),
    });
  }

  if (isLoading) {
    return (
      <div className="p-8 max-w-2xl mx-auto space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse w-48" />
        {[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-white rounded-xl border animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <PageHeader
        title="My Profile"
        subtitle="Your public tutor information and qualifications."
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Personal info */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center">
              <User className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold text-gray-700">Personal information</p>
          </div>

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
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
            <input
              type="tel"
              {...register("phone")}
              placeholder="+44 7700 900000"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Bio</label>
            <textarea
              {...register("bio")}
              rows={4}
              placeholder="A short description of your teaching experience and approach…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
            />
          </div>
        </div>

        {/* Subjects */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <p className="text-sm font-semibold text-gray-700">Subjects taught</p>
          <div>
            <input
              {...register("subjects")}
              placeholder="e.g. Mathematics, Physics, Chemistry"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
            <p className="text-xs text-gray-400 mt-1.5">Separate subjects with commas</p>
          </div>
        </div>

        {/* Qualifications */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700">Qualifications</p>
            <button
              type="button"
              onClick={() => append({ title: "", institution: "" })}
              className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 font-medium"
            >
              <Plus className="h-3.5 w-3.5" /> Add
            </button>
          </div>

          {fields.length === 0 && (
            <p className="text-xs text-gray-400">No qualifications added yet.</p>
          )}

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-3 items-start">
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <input
                    {...register(`qualifications.${index}.title`)}
                    placeholder="e.g. QTS, BSc Mathematics"
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                  />
                  <input
                    {...register(`qualifications.${index}.institution`)}
                    placeholder="e.g. University of Leeds"
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="text-gray-400 hover:text-red-500 mt-2 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {updateMutation.isSuccess && (
          <div className="bg-green-50 text-green-700 rounded-lg px-4 py-3 text-sm border border-green-200">
            Profile updated successfully.
          </div>
        )}

        {updateMutation.isError && (
          <div className="bg-red-50 text-red-700 rounded-lg px-4 py-3 text-sm border border-red-200">
            Failed to save. Please try again.
          </div>
        )}

        <button
          type="submit"
          disabled={updateMutation.isPending || !isDirty}
          className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white rounded-xl py-3 font-medium hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Save className="h-4 w-4" />
          {updateMutation.isPending ? "Saving…" : "Save profile"}
        </button>
      </form>
    </div>
  );
}
