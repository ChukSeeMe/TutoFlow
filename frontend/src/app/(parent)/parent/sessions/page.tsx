"use client";

import { useQuery } from "@tanstack/react-query";
import { parentsApi } from "@/lib/api";
import { Clock, ChevronDown, ChevronUp } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useState } from "react";

interface SessionNote {
  id: number;
  student_id: number;
  student_name: string;
  scheduled_at: string;
  attendance: string;
  engagement: number | null;
  summary: string | null;
  duration_min: number | null;
}

function attendanceBadge(status: string) {
  const base = "text-xs font-medium px-2 py-0.5 rounded-full capitalize";
  if (status === "present") return `${base} bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400`;
  if (status === "late") return `${base} bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400`;
  if (status === "absent") return `${base} bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400`;
  return `${base} bg-gray-100 dark:bg-white/[0.05] text-gray-500 dark:text-zinc-500`;
}

function EngagementBar({ score }: { score: number | null }) {
  if (!score) return null;
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-gray-500 dark:text-zinc-500">Engagement</span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <div
            key={n}
            className={`h-2 w-3 rounded-sm ${n <= score ? "bg-brand-500" : "bg-gray-200 dark:bg-white/10"}`}
          />
        ))}
      </div>
      <span className="text-xs text-gray-400 dark:text-zinc-600">{score}/5</span>
    </div>
  );
}

function SessionCard({ session }: { session: SessionNote }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white dark:bg-[#16161f] rounded-xl border border-gray-200 dark:border-white/[0.07] overflow-hidden">
      <button
        className="w-full flex items-start justify-between px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-full bg-brand-100 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
            {session.student_name[0]}
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-zinc-100 text-sm">
              {session.student_name}
            </p>
            <p className="text-xs text-gray-500 dark:text-zinc-500 mt-0.5">
              {formatDate(session.scheduled_at)}
              {session.duration_min && ` · ${session.duration_min} min`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={attendanceBadge(session.attendance)}>{session.attendance}</span>
          {open ? (
            <ChevronUp className="h-4 w-4 text-gray-400 dark:text-zinc-600" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400 dark:text-zinc-600" />
          )}
        </div>
      </button>

      {open && (
        <div className="px-5 pb-4 border-t border-gray-100 dark:border-white/[0.04] pt-3 space-y-3">
          <EngagementBar score={session.engagement} />
          {session.summary ? (
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-zinc-500 mb-1">Session summary</p>
              <p className="text-sm text-gray-700 dark:text-zinc-300 leading-relaxed bg-gray-50 dark:bg-white/[0.03] rounded-lg px-3 py-2 border border-gray-100 dark:border-white/[0.04]">
                {session.summary}
              </p>
            </div>
          ) : (
            <p className="text-xs text-gray-400 dark:text-zinc-600 italic">
              No summary shared for this session.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function ParentSessions() {
  const { data: sessions = [], isLoading } = useQuery<SessionNote[]>({
    queryKey: ["parent-sessions"],
    queryFn: () => parentsApi.mySessions().then((r) => r.data),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">Session Notes</h1>
        <p className="text-gray-500 dark:text-zinc-500 text-sm mt-1">
          What happened in each tutoring session.
        </p>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-white dark:bg-[#16161f] rounded-xl border border-gray-200 dark:border-white/[0.07] animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && sessions.length === 0 && (
        <div className="bg-white dark:bg-[#16161f] rounded-xl border border-gray-200 dark:border-white/[0.07] py-12 text-center">
          <Clock className="h-8 w-8 text-gray-300 dark:text-zinc-700 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-zinc-500 text-sm">No sessions recorded yet.</p>
        </div>
      )}

      <div className="space-y-3">
        {sessions.map((session) => (
          <SessionCard key={session.id} session={session} />
        ))}
      </div>

      {sessions.length > 0 && (
        <p className="text-xs text-center text-gray-400 dark:text-zinc-600">
          Showing {sessions.length} session{sessions.length > 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
