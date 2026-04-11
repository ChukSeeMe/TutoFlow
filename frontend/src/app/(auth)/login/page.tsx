"use client";

import { useEffect, useState } from "react";
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
import { signIn } from "next-auth/react";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { setAuth, isAuthenticated, role } = useAuthStore();
  const [apiError, setApiError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  // After hydration, if already logged in send to the right portal
  useEffect(() => {
    if (!mounted) return;
    if (isAuthenticated && role) {
      if (role === "tutor")        router.replace("/dashboard");
      else if (role === "student") router.replace("/student/dashboard");
      else if (role === "parent")  router.replace("/parent/dashboard");
      else if (role === "admin")   router.replace("/admin/dashboard");
    }
  }, [mounted, isAuthenticated, role, router]);

  async function onSubmit(data: FormData) {
    setApiError(null);
    try {
      const res = await authApi.login(data.email, data.password);
      const tokens: AuthTokens = res.data;
      setAuth(tokens.access_token, tokens.role);
      const role = (tokens.role as string).toLowerCase();
      if (role === "tutor")        router.push("/dashboard");
      else if (role === "student") router.push("/student/dashboard");
      else if (role === "parent")  router.push("/parent/dashboard");
      else if (role === "admin")   router.push("/admin/dashboard");
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setApiError(detail ?? "Login failed. Please check your credentials.");
    }
  }

  return (
    <div className={cn(
      "min-h-screen flex items-center justify-center",
      "bg-[rgb(237_239_248)] dark:bg-[#09090b]",
      "px-4",
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
          <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50 tracking-tight">Teach Harbour</h1>
          <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">UK Tutoring Operating System</p>
        </div>

        <h2 className="text-base font-semibold text-gray-800 dark:text-zinc-200 mb-5">
          Sign in to your account
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5">
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              {...register("email")}
              className={cn(
                "w-full rounded-xl px-3.5 py-2.5 text-sm",
                "bg-white dark:bg-white/[0.06]",
                "border border-gray-300 dark:border-white/[0.12]",
                "text-gray-900 dark:text-zinc-100",
                "placeholder:text-gray-400 dark:placeholder:text-zinc-600",
                "focus:outline-none focus:ring-2 focus:ring-brand-500/50",
                "[color-scheme:light] dark:[color-scheme:dark]",
              )}
              placeholder="you@example.com"
            />
            {errors.email && (
              <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              {...register("password")}
              className={cn(
                "w-full rounded-xl px-3.5 py-2.5 text-sm",
                "bg-white dark:bg-white/[0.06]",
                "border border-gray-300 dark:border-white/[0.12]",
                "text-gray-900 dark:text-zinc-100",
                "placeholder:text-gray-400 dark:placeholder:text-zinc-600",
                "focus:outline-none focus:ring-2 focus:ring-brand-500/50",
                "[color-scheme:light] dark:[color-scheme:dark]",
              )}
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.password.message}</p>
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
            {isSubmitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        {/* Divider */}
        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-200 dark:bg-white/10" />
          <span className="text-xs text-gray-400 dark:text-zinc-600">or continue with</span>
          <div className="h-px flex-1 bg-gray-200 dark:bg-white/10" />
        </div>

        {/* OAuth buttons */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: "/oauth-complete" })}
            className={cn(
              "w-full flex items-center justify-center gap-3 py-2.5 rounded-xl text-sm font-medium",
              "bg-white dark:bg-white/[0.06] border border-gray-300 dark:border-white/[0.12]",
              "text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-white/[0.10]",
              "transition-colors",
            )}
          >
            {/* Google SVG */}
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </button>

          <button
            type="button"
            onClick={() => signIn("azure-ad", { callbackUrl: "/oauth-complete" })}
            className={cn(
              "w-full flex items-center justify-center gap-3 py-2.5 rounded-xl text-sm font-medium",
              "bg-white dark:bg-white/[0.06] border border-gray-300 dark:border-white/[0.12]",
              "text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-white/[0.10]",
              "transition-colors",
            )}
          >
            {/* Microsoft SVG */}
            <svg className="h-4 w-4" viewBox="0 0 23 23">
              <path fill="#f3f3f3" d="M0 0h23v23H0z"/>
              <path fill="#f35325" d="M1 1h10v10H1z"/>
              <path fill="#81bc06" d="M12 1h10v10H12z"/>
              <path fill="#05a6f0" d="M1 12h10v10H1z"/>
              <path fill="#ffba08" d="M12 12h10v10H12z"/>
            </svg>
            Sign in with Microsoft
          </button>
        </div>

        <p className="mt-5 text-center text-sm text-gray-500 dark:text-zinc-500">
          New tutor?{" "}
          <Link href="/register" className="text-brand-600 dark:text-brand-400 hover:underline font-medium">
            Create an account
          </Link>
        </p>

      </div>
    </div>
  );
}
