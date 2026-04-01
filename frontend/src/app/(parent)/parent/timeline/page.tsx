"use client";

import { useQuery } from "@tanstack/react-query";
import { parentsApi } from "@/lib/api";
import { Calendar, BookOpen, FileText, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface TimelineEvent {
  type: "session" | "homework" | "report";
  date: string;
  student_name: string;
  student_id: number;
  id: number;
  // session fields
  attendance?: string;
  engagement?: number | null;
  summary?: string | null;
  duration_min?: number | null;
  // homework fields
  title?: string;
  status?: string;
  due_date?: string | null;
  // report fields
  report_type?: string;
}

function attendanceColor(status: string) {
  if (status === "present") return "text-green-600 dark:text-green-400";
  if (status === "late") return "text-amber-600 dark:text-amber-400";
  if (status === "absent") return "text-red-600 dark:text-red-400";
  return "text-gray-500 dark:text-zinc-500";
}

function EngagementDots({ score }: { score: number | null | undefined }) {
  if (!score) return null;
  return (
    <span className="flex gap-0.5 items-center ml-2">
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={`h-1.5 w-1.5 rounded-full ${n <= score ? "bg-brand-500" : "bg-gray-200 dark:bg-white/10"}`}
        />
      ))}
    </span>
  );
}

function EventCard({ event }: { event: TimelineEvent }) {
  if (event.type === "session") {
    return (
      <div className="flex gap-4">
        <div className="flex flex-col items-center">
          <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-500/15 flex items-center justify-center flex-shrink-0">
            <Clock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="w-px flex-1 bg-gray-200 dark:bg-white/[0.06] mt-2" />
        </div>
        <div className="pb-6 flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div>
              <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">
                Session — {event.student_name}
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-xs font-medium capitalize ${attendanceColor(event.attendance || "")}`}>
                  {event.attendance}
                </span>
                {event.duration_min && (
                  <span className="text-xs text-gray-400 dark:text-zinc-600">{event.duration_min} min</span>
                )}
                <EngagementDots score={event.engagement} />
              </div>
            </div>
            <span className="text-xs text-gray-400 dark:text-zinc-600 flex-shrink-0">
              {formatDate(event.date)}
            </span>
          </div>
          {event.summary && (
            <p className="text-sm text-gray-600 dark:text-zinc-400 bg-gray-50 dark:bg-white/[0.03] rounded-lg px-3 py-2 mt-2 border border-gray-100 dark:border-white/[0.04]">
              {event.summary}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (event.type === "homework") {
    const isOverdue = event.status === "overdue";
    const isSubmitted = event.status === "submitted" || event.status === "marked";
    return (
      <div className="flex gap-4">
        <div className="flex flex-col items-center">
          <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center flex-shrink-0">
            {isSubmitted
              ? <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              : isOverdue
              ? <AlertCircle className="h-4 w-4 text-red-500" />
              : <BookOpen className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            }
          </div>
          <div className="w-px flex-1 bg-gray-200 dark:bg-white/[0.06] mt-2" />
        </div>
        <div className="pb-6 flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">
                Homework — {event.student_name}
              </span>
              <p className="text-xs text-gray-600 dark:text-zinc-400 mt-0.5">{event.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs capitalize font-medium ${isSubmitted ? "text-green-600 dark:text-green-400" : isOverdue ? "text-red-500" : "text-amber-600 dark:text-amber-400"}`}>
                  {event.status?.replace("_", " ")}
                </span>
                {event.due_date && (
                  <span className="text-xs text-gray-400 dark:text-zinc-600">
                    Due {formatDate(event.due_date)}
                  </span>
                )}
              </div>
            </div>
            <span className="text-xs text-gray-400 dark:text-zinc-600 flex-shrink-0">
              {formatDate(event.date)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // report
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center flex-shrink-0">
          <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="w-px flex-1 bg-gray-200 dark:bg-white/[0.06] mt-2" />
      </div>
      <div className="pb-6 flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">
              Report approved — {event.student_name}
            </span>
            <p className="text-xs text-gray-600 dark:text-zinc-400 mt-0.5">{event.title}</p>
            <span className="text-xs text-blue-600 dark:text-blue-400 capitalize">
              {event.report_type?.replace(/_/g, " ")}
            </span>
          </div>
          <span className="text-xs text-gray-400 dark:text-zinc-600 flex-shrink-0">
            {formatDate(event.date)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function ParentTimeline() {
  const { data: events = [], isLoading } = useQuery<TimelineEvent[]>({
    queryKey: ["parent-timeline"],
    queryFn: () => parentsApi.myTimeline().then((r) => r.data),
  });

  // Group by month
  const grouped: Record<string, TimelineEvent[]> = {};
  for (const event of events) {
    const d = new Date(event.date);
    const key = d.toLocaleString("default", { month: "long", year: "numeric" });
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(event);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">Activity Timeline</h1>
        <p className="text-gray-500 dark:text-zinc-500 text-sm mt-1">
          All recent sessions, homework, and reports in one place.
        </p>
      </div>

      {isLoading && (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-white/[0.06] animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-3 bg-gray-200 dark:bg-white/[0.06] rounded animate-pulse w-1/2" />
                <div className="h-2 bg-gray-100 dark:bg-white/[0.04] rounded animate-pulse w-3/4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && events.length === 0 && (
        <div className="bg-white dark:bg-[#16161f] rounded-xl border border-gray-200 dark:border-white/[0.07] py-12 text-center">
          <Calendar className="h-8 w-8 text-gray-300 dark:text-zinc-700 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-zinc-500 text-sm">No activity to show yet.</p>
        </div>
      )}

      {Object.entries(grouped).map(([month, monthEvents]) => (
        <div key={month}>
          <p className="text-xs font-semibold text-gray-400 dark:text-zinc-600 uppercase tracking-wide mb-4">
            {month}
          </p>
          <div>
            {monthEvents.map((event, i) => (
              <EventCard key={`${event.type}-${event.id}-${i}`} event={event} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
