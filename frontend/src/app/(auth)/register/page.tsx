"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import type { AuthTokens } from "@/types";
import Link from "next/link";
import { Brain } from "lucide-react";
import { cn } from "@/lib/utils";

const schema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Minimum 8 characters")
    .regex(/[A-Z]/, "Must include an uppercase letter")
    .regex(/[0-9]/, "Must include a number"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof schema>;

const inputCn = cn(
  "w-full rounded-xl px-3.5 py-2.5 text-sm",
  "bg-white dark:bg-white/[0.04]",
  "border border-gray-300 dark:border-white/[0.1]",
  "text-gray-900 dark:text-zinc-100",
  "placeholder:text-gray-400 dark:placeholder:text-zinc-600",
  "focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 dark:focus:border-brand-400",
  "transition-colors",
);

const labelCn = "block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5";

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setApiError(null);
    try {
      const res = await authApi.register({
        email: data.email,
        password: data.password,
        first_name: data.first_name,
        last_name: data.last_name,
      });
      const tokens: AuthTokens = res.data;
      setAuth(tokens.access_token, tokens.role);
      router.push("/dashboard");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "Registration failed. Please try again.";
      setApiError(message);
    }
  }

  return (
    <div className={cn(
      "min-h-screen flex items-center justify-center",
      "bg-gray-50 dark:bg-[#09090b]",
      "px-4 py-8",
    )}>
      <div className={cn(
        "w-full max-w-md rounded-2xl p-8",
        "bg-white dark:bg-white/[0.03]",
        "border border-gray-200/80 dark:border-white/[0.07]",
        "shadow-glass-light dark:shadow-glass-dark",
      )}>
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-10 w-10 rounded-xl bg-brand-gradient flex items-center justify-center shadow-glow-sm mb-3">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50 tracking-tight">TutorFlow</h1>
          <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">Create your tutor account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCn}>First name</label>
              <input {...register("first_name")} className={inputCn} />
              {errors.first_name && (
                <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.first_name.message}</p>
              )}
            </div>
            <div>
              <label className={labelCn}>Last name</label>
              <input {...register("last_name")} className={inputCn} />
              {errors.last_name && (
                <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.last_name.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className={labelCn}>Email address</label>
            <input type="email" {...register("email")} className={inputCn} placeholder="you@example.com" />
            {errors.email && (
              <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className={labelCn}>Password</label>
            <input type="password" {...register("password")} className={inputCn} placeholder="Min. 8 chars, 1 uppercase, 1 number" />
            {errors.password && (
              <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label className={labelCn}>Confirm password</label>
            <input type="password" {...register("confirmPassword")} className={inputCn} placeholder="••••••••" />
            {errors.confirmPassword && (
              <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>

          {apiError && (
            <div className="rounded-xl px-4 py-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
              <p className="text-red-700 dark:text-red-400 text-sm">{apiError}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              "w-full py-2.5 rounded-xl text-sm font-semibold text-white",
              "bg-brand-gradient shadow-glow-sm",
              "hover:opacity-90 transition-opacity",
              "disabled:opacity-50 disabled:cursor-not-allowed",
            )}
          >
            {isSubmitting ? "Creating account…" : "Create tutor account"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-gray-500 dark:text-zinc-500">
          Already have an account?{" "}
          <Link href="/login" className="text-brand-600 dark:text-brand-400 hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
