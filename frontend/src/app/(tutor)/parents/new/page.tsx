"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { parentsApi, studentsApi } from "@/lib/api";
import type { Student } from "@/types";
import { useForm } from "react-hook-form";
import { ArrowLeft, UserPlus, Copy, Check } from "lucide-react";
import Link from "next/link";

interface FormValues {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  relationship_label: string;
  communication_preference: string;
  student_id: string;
}

const RELATIONSHIPS = ["Mother", "Father", "Guardian", "Carer", "Grandparent", "Other"];
const COMMUNICATION_PREFS = ["email", "phone", "sms", "any"];

export default function NewParentPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [createdParent, setCreatedParent] = useState<{ id: number; full_name: string; temp_password?: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ["students"],
    queryFn: () => studentsApi.list().then((r) => r.data),
  });

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      communication_preference: "email",
      relationship_label: "Guardian",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const res = await parentsApi.create({
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,
        phone: values.phone || undefined,
        relationship_label: values.relationship_label,
        communication_preference: values.communication_preference,
      });
      const parent = res.data;
      // Link student if selected
      if (values.student_id) {
        await parentsApi.linkStudent(parent.id, Number(values.student_id), {
          relationship_label: values.relationship_label,
        });
      }
      return parent;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["parents"] });
      setCreatedParent(data);
    },
  });

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (createdParent) {
    return (
      <div className="p-8 max-w-lg mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center space-y-4">
          <div className="h-12 w-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
            <UserPlus className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Parent account created</h2>
          <p className="text-sm text-gray-600">
            <strong>{createdParent.full_name}</strong> can now log in to the parent portal.
          </p>

          {createdParent.temp_password && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left">
              <p className="text-xs font-semibold text-amber-700 mb-2">Temporary password — share securely</p>
              <div className="flex items-center justify-between gap-3">
                <code className="text-sm font-mono text-amber-900 bg-amber-100 px-2 py-1 rounded">
                  {createdParent.temp_password}
                </code>
                <button
                  onClick={() => handleCopy(createdParent.temp_password!)}
                  className="flex items-center gap-1 text-xs text-amber-700 hover:text-amber-900"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <p className="text-xs text-amber-600 mt-2">
                The parent should change this on their first login. Do not send over unencrypted channels.
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Link
              href="/parents"
              className="flex-1 text-center border border-gray-300 text-gray-700 rounded-lg py-2.5 text-sm hover:bg-gray-50 transition-colors"
            >
              Back to parents
            </Link>
            <Link
              href={`/parents/new`}
              className="flex-1 text-center bg-brand-600 text-white rounded-lg py-2.5 text-sm hover:bg-brand-700 transition-colors"
              onClick={() => setCreatedParent(null)}
            >
              Add another
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/parents" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add parent / guardian</h1>
          <p className="text-gray-500 text-sm mt-0.5">Creates a portal account for the parent</p>
        </div>
      </div>

      <form onSubmit={handleSubmit((v) => createMutation.mutate(v))} className="space-y-5">
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <p className="text-sm font-semibold text-gray-700">Contact details</p>

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
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address *</label>
            <input
              type="email"
              {...register("email", { required: "Required" })}
              placeholder="parent@example.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
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
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <p className="text-sm font-semibold text-gray-700">Relationship & preferences</p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Relationship *</label>
              <select
                {...register("relationship_label", { required: "Required" })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              >
                {RELATIONSHIPS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Contact preference</label>
              <select
                {...register("communication_preference")}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              >
                {COMMUNICATION_PREFS.map((p) => (
                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Link to student (optional)</label>
            <select
              {...register("student_id")}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            >
              <option value="">— Select student —</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.full_name} ({s.year_group ?? "No year"})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-xs text-amber-700 font-medium">Account creation</p>
          <p className="text-xs text-amber-600 mt-1">
            A portal account will be created with a temporary password. You must share this securely with the parent.
            They will see only tutor-approved information about their linked child.
          </p>
        </div>

        {createMutation.isError && (
          <div className="bg-red-50 text-red-700 rounded-lg px-4 py-3 text-sm border border-red-200">
            Failed to create parent account. The email address may already be in use.
          </div>
        )}

        <div className="flex gap-3">
          <Link
            href="/parents"
            className="flex-1 text-center border border-gray-300 text-gray-700 rounded-xl py-3 font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="flex-1 flex items-center justify-center gap-2 bg-brand-600 text-white rounded-xl py-3 font-medium hover:bg-brand-700 disabled:opacity-40 transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            {createMutation.isPending ? "Creating…" : "Create account"}
          </button>
        </div>
      </form>
    </div>
  );
}
