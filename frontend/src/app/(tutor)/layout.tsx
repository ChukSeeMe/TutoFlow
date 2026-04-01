"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth";
import { TutorSidebar } from "@/components/layout/TutorSidebar";

export default function TutorLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, role } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    if (!isAuthenticated || role !== "tutor") {
      router.replace("/login");
    }
  }, [mounted, isAuthenticated, role, router]);

  if (!mounted) return null;
  if (!isAuthenticated || role !== "tutor") return null;

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-[#09090b]">
      <TutorSidebar />
      <main className="flex-1 overflow-auto min-w-0 scrollbar-thin">
        {children}
      </main>
    </div>
  );
}
