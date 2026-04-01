import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { MasteryStatus } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDatetime(dateStr: string | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function masteryLabel(status: MasteryStatus): string {
  const labels: Record<MasteryStatus, string> = {
    not_started: "Not Started",
    taught: "Taught",
    practising: "Practising",
    developing: "Developing",
    secure: "Secure",
    needs_reteach: "Needs Reteach",
    exceeded: "Exceeded",
  };
  return labels[status] ?? status;
}

export function masteryColour(status: MasteryStatus): string {
  const colours: Record<MasteryStatus, string> = {
    not_started: "bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400",
    taught:       "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    practising:   "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
    developing:   "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
    secure:       "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    needs_reteach:"bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    exceeded:     "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  };
  return colours[status] ?? "bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400";
}

export function priorityColour(priority: "high" | "medium" | "low"): string {
  return {
    high: "bg-red-50 border-red-200 text-red-800",
    medium: "bg-amber-50 border-amber-200 text-amber-800",
    low: "bg-blue-50 border-blue-200 text-blue-800",
  }[priority];
}

export function engagementLabel(score: number | undefined): string {
  if (!score) return "—";
  const labels: Record<number, string> = {
    1: "Disengaged",
    2: "Low",
    3: "Moderate",
    4: "Good",
    5: "Excellent",
  };
  return labels[score] ?? String(score);
}

export function attendancePercent(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
