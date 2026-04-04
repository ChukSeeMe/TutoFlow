"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth";
import { Brain } from "lucide-react";
import type { UserRole } from "@/types";

/**
 * After a successful Google/Microsoft OAuth sign-in NextAuth redirects here.
 * We read the TutorFlow JWT out of the NextAuth session and put it in
 * the Zustand store, then navigate to the correct portal.
 */
export default function OAuthComplete() {
  const { data: session, status } = useSession();
  const { setAuth } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (status === "authenticated" && session?.tutorflowToken && session?.tutorflowRole) {
      setAuth(session.tutorflowToken, session.tutorflowRole as UserRole);
      const role = (session.tutorflowRole as string).toLowerCase();
      if (role === "tutor")        router.replace("/dashboard");
      else if (role === "student") router.replace("/student/dashboard");
      else if (role === "parent")  router.replace("/parent/dashboard");
      else router.replace("/login");
    } else if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, session, setAuth, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[rgb(var(--bg))]">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-500/30 animate-pulse">
          <Brain className="h-6 w-6 text-white" />
        </div>
        <p className="text-sm text-[rgb(var(--text-secondary))]">Signing you in…</p>
      </div>
    </div>
  );
}
