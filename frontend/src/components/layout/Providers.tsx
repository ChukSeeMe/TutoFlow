"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/auth";
import { CookieConsent } from "@/components/ui/CookieConsent";

export function Providers({ children }: { children: React.ReactNode }) {
  // Trigger Zustand rehydration from sessionStorage after mount so the server
  // render and initial client render both start from the same default state.
  useEffect(() => {
    useAuthStore.persist.rehydrate();
  }, []);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            // Only retry on network failures (no response), never on HTTP errors (4xx/5xx)
            retry: (failureCount, error) => {
              const status = (error as { response?: { status?: number } })?.response?.status;
              if (status !== undefined) return false; // got a response — don't retry
              return failureCount < 1; // retry once on true network failure
            },
          },
        },
      })
  );

  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >
        <QueryClientProvider client={queryClient}>
          {children}
          <CookieConsent />
        </QueryClientProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
