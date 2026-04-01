"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { analyticsApi } from "@/lib/api";
import { AlertTriangle, TrendingDown, RefreshCw, ClipboardList, Eye, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface InterventionFlag {
  student_id: number;
  student_name: string;
  flag_type: string;
  priority: string;
  message: string;
}

interface InterventionsDashboard {
  total_students: number;
  high_priority_flags: number;
  flags: InterventionFlag[];
}

const FLAG_CONFIG: Record<string, { icon: React.ComponentType<{ className?: string }>; label: string; colour: string }> = {
  attendance: { icon: TrendingDown, label: "Attendance", colour: "red" },
  engagement: { icon: TrendingDown, label: "Engagement", colour: "orange" },
  reteach: { icon: RefreshCw, label: "Reteach needed", colour: "amber" },
  homework: { icon: ClipboardList, label: "Homework", colour: "blue" },
  observation: { icon: Eye, label: "Flagged observation", colour: "red" },
};

const PRIORITY_COLOUR: Record<string, string> = {
  high: "bg-red-100 text-red-700 border-red-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  low: "bg-gray-100 text-gray-600 border-gray-200",
};

export default function InterventionsPage() {
  const { data, isLoading, error } = useQuery<InterventionsDashboard>({
    queryKey: ["interventions-dashboard"],
    queryFn: () => analyticsApi.interventionsDashboard().then((r) => r.data),
  });

  if (isLoading) return <div className="p-8 text-gray-400">Loading interventions...</div>;
  if (error) return <div className="p-8 text-red-500">Failed to load interventions data.</div>;

  const grouped = new Map<string, InterventionFlag[]>();
  for (const flag of data?.flags ?? []) {
    if (!grouped.has(flag.student_name)) grouped.set(flag.student_name, []);
    grouped.get(flag.student_name)!.push(flag);
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Interventions</h1>
        <p className="text-sm text-gray-500 mt-1">
          Rule-based intelligence across all students. Every flag has an explicit reason.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-3xl font-bold text-gray-900">{data?.total_students ?? 0}</p>
          <p className="text-xs text-gray-500 mt-0.5">Active students</p>
        </div>
        <div className={cn(
          "border rounded-xl p-4",
          (data?.high_priority_flags ?? 0) > 0
            ? "bg-red-50 border-red-200"
            : "bg-green-50 border-green-200"
        )}>
          <p className={cn(
            "text-3xl font-bold",
            (data?.high_priority_flags ?? 0) > 0 ? "text-red-700" : "text-green-700"
          )}>
            {data?.high_priority_flags ?? 0}
          </p>
          <p className={cn(
            "text-xs mt-0.5",
            (data?.high_priority_flags ?? 0) > 0 ? "text-red-600" : "text-green-600"
          )}>
            High-priority flags
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-3xl font-bold text-gray-900">{data?.flags.length ?? 0}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total flags</p>
        </div>
      </div>

      {/* No flags state */}
      {(data?.flags.length ?? 0) === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
          <p className="text-green-700 font-medium">All students are on track</p>
          <p className="text-green-600 text-sm mt-1">No intervention flags at this time.</p>
        </div>
      )}

      {/* Flags grouped by student */}
      <div className="space-y-4">
        {Array.from(grouped.entries()).map(([studentName, flags]) => {
          const studentId = flags[0].student_id;
          const highestPriority = flags.some((f) => f.priority === "high") ? "high" : "medium";

          return (
            <div
              key={studentName}
              className={cn(
                "bg-white border rounded-xl overflow-hidden",
                highestPriority === "high" ? "border-red-200" : "border-amber-200"
              )}
            >
              <div className={cn(
                "flex items-center justify-between px-5 py-3 border-b",
                highestPriority === "high" ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"
              )}>
                <div className="flex items-center gap-2">
                  <AlertTriangle className={cn(
                    "h-4 w-4",
                    highestPriority === "high" ? "text-red-500" : "text-amber-500"
                  )} />
                  <span className="font-semibold text-gray-900 text-sm">{studentName}</span>
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full font-medium border",
                    PRIORITY_COLOUR[highestPriority]
                  )}>
                    {flags.length} flag{flags.length > 1 ? "s" : ""}
                  </span>
                </div>
                <Link
                  href={`/students/${studentId}`}
                  className="flex items-center gap-1 text-xs text-brand-600 hover:underline"
                >
                  View profile <ChevronRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="divide-y divide-gray-100">
                {flags.map((flag, i) => {
                  const config = FLAG_CONFIG[flag.flag_type] ?? {
                    icon: AlertTriangle,
                    label: flag.flag_type,
                    colour: "gray",
                  };
                  const Icon = config.icon;

                  return (
                    <div key={i} className="flex items-start gap-3 px-5 py-3">
                      <Icon className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-600">{config.label}</span>
                          <span className={cn(
                            "text-xs px-1.5 py-0.5 rounded font-medium border",
                            PRIORITY_COLOUR[flag.priority]
                          )}>
                            {flag.priority}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mt-0.5">{flag.message}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex gap-3">
                <Link
                  href={`/students/${studentId}`}
                  className="text-xs text-brand-600 hover:underline"
                >
                  View full profile
                </Link>
                <Link
                  href={`/students/${studentId}/passport`}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Learning Passport
                </Link>
                <Link
                  href={`/sessions/new?student=${studentId}`}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Log session
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-400 text-center mt-8">
        Flags are rule-based and updated each time this page loads. Every flag has an explicit cause shown above.
      </p>
    </div>
  );
}
