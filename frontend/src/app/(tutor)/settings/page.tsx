"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "@/lib/api";
import { Save, CheckCircle } from "lucide-react";

const profileSchema = z.object({
  first_name: z.string().min(1, "Required"),
  last_name: z.string().min(1, "Required"),
  phone: z.string().optional(),
  bio: z.string().optional(),
  subjects: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

interface TutorProfile {
  id: number;
  first_name: string;
  last_name: string;
  phone?: string;
  bio?: string;
  subjects_json?: string[];
  qualifications_json?: Array<{ title: string; institution: string }>;
}

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);

  const { data: profile, isLoading } = useQuery<TutorProfile>({
    queryKey: ["tutor-profile"],
    queryFn: () => usersApi.myProfile().then((r) => r.data),
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<ProfileForm>({ resolver: zodResolver(profileSchema) });

  useEffect(() => {
    if (profile) {
      reset({
        first_name: profile.first_name,
        last_name: profile.last_name,
        phone: profile.phone ?? "",
        bio: profile.bio ?? "",
        subjects: (profile.subjects_json ?? []).join(", "),
      });
    }
  }, [profile, reset]);

  const mutation = useMutation({
    mutationFn: (data: ProfileForm) =>
      usersApi.updateProfile({
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone || null,
        bio: data.bio || null,
        subjects_json: data.subjects
          ? data.subjects.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tutor-profile"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  if (isLoading) return <div className="p-8 text-gray-400">Loading settings...</div>;

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your tutor profile and preferences.</p>
      </div>

      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
        {/* Profile section */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Tutor Profile</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">First name</label>
              <input
                {...register("first_name")}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              {errors.first_name && (
                <p className="text-red-500 text-xs mt-1">{errors.first_name.message}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Last name</label>
              <input
                {...register("last_name")}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              {errors.last_name && (
                <p className="text-red-500 text-xs mt-1">{errors.last_name.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
            <input
              {...register("phone")}
              type="tel"
              placeholder="+44 7xxx xxxxxx"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Bio</label>
            <textarea
              {...register("bio")}
              rows={3}
              placeholder="A short professional bio visible to parents..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Subjects <span className="text-gray-400">(comma-separated)</span>
            </label>
            <input
              {...register("subjects")}
              placeholder="Mathematics, English Language, Science"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>

        {/* App info */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">About Teach Harbour</h2>
          <div className="text-sm text-gray-600 space-y-1">
            <p>Version: <span className="font-mono">1.0.0-mvp</span></p>
            <p>Environment: <span className="font-mono text-green-600">development</span></p>
            <p className="text-xs text-gray-400 pt-2">
              Teach Harbour is a tutor-led operating system for private tutors in England.
              All AI outputs are drafts and require tutor review before use.
              Student data is never used to train AI models.
            </p>
          </div>
        </div>

        {/* Save */}
        <div className="flex items-center justify-between">
          {saved && (
            <div className="flex items-center gap-2 text-green-600 text-sm">
              <CheckCircle className="h-4 w-4" />
              Profile saved
            </div>
          )}
          {!saved && <div />}

          <button
            type="submit"
            disabled={isSubmitting || mutation.isPending}
            className="flex items-center gap-2 bg-brand-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors"
          >
            <Save className="h-4 w-4" />
            Save changes
          </button>
        </div>

        {mutation.isError && (
          <p className="text-sm text-red-600">
            Failed to save. Please try again.
          </p>
        )}
      </form>
    </div>
  );
}
