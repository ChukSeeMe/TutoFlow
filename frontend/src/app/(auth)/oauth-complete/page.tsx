"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth";
import { Brain, AlertCircle } from "lucide-react";
import Link from "next/link";
import type { UserRole } from "@/types";

/**
 * After a successful Google/Microsoft OAuth sign-in NextAuth redirects here.
 * We read the Teach Harbour JWT out of the NextAuth session and put it in
 * the Zustand store, then navigate to the correct portal.
 */
export default function OAuthComplete() {
  const { data: session, status } = useSession();
  const { setAuth } = useAuthStore();
  const router = useRouter();
  const [timedOut, setTimedOut] = useState(false);

  // If we're still stuck after 8 seconds, the backend sync likely failed.
  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 8_000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (status === "loading") return;

    if (status === "authenticated" && session?.teachHarbourToken && session?.teachHarbourRole) {
      setAuth(session.teachHarbourToken, session.teachHarbourRole as UserRole);
      const role = (session.teachHarbourRole as string).toLowerCase();
      if (role === "tutor")        router.replace("/dashboard");
      else if (role === "student") router.replace("/student/dashboard");
      else if (role === "parent")  router.replace("/parent/dashboard");
      else router.replace("/login");
    } else if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, session, setAuth, router]);

  // Show error state: authenticated with NextAuth but backend token missing
  const backendFailed =
    timedOut && status === "authenticated" && !session?.teachHarbourToken;

  if (backendFailed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[rgb(237_239_248)] dark:bg-[#09090b] p-4">
        <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.07] p-8 text-center shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 dark:bg-red-500/10 mx-auto mb-4">
            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-zinc-100 mb-2">
            Sign-in incomplete
          </h2>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mb-6">
            We verified your identity with Google/Microsoft but couldn&apos;t
            reach the Teach Harbour server to issue your session token. Please
            make sure the backend is running and try again.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 transition-colors"
          >
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[rgb(237_239_248)] dark:bg-[#09090b]">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 shadow-lg shadow-brand-500/30 animate-pulse">
          <Brain className="h-6 w-6 text-white" />
        </div>
        <p className="text-sm text-gray-500 dark:text-zinc-400">Signing you in…</p>
      </div>
    </div>
  );
}
