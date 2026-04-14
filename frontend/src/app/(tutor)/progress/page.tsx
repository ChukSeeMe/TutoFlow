"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { studentsApi, progressApi } from "@/lib/api";
import type { Student, ProgressRecord, MasteryStatus } from "@/types";
import { masteryLabel, masteryColour, formatDate, cn } from "@/lib/utils";
import { MasteryBadge } from "@/components/ui/MasteryBadge";
import { PageHeader } from "@/components/ui/PageHeader";
import { ChevronDown, ChevronUp } from "lucide-react";

const MASTERY_ORDER: MasteryStatus[] = [
  "not_started","taught","practising","developing","secure","needs_reteach","exceeded"
];

const BAR_WIDTH: Record<MasteryStatus, string> = {
  not_started:  "4%",
  taught:       "20%",
  practising:   "40%",
  developing:   "60%",
  secure:       "100%",
  needs_reteach:"100%",
  exceeded:     "100%",
};

const BAR_COLOR: Record<MasteryStatus, string> = {
  not_started:  "bg-gray-300 dark:bg-zinc-600",
  taught:       "bg-blue-300 dark:bg-blue-500",
  practising:   "bg-yellow-400 dark:bg-yellow-500",
  developing:   "bg-orange-400 dark:bg-orange-500",
  secure:       "bg-green-500 dark:bg-green-400",
  needs_reteach:"bg-red-400 dark:bg-red-500",
  exceeded:     "bg-brand-500 dark:bg-brand-400",
};

function StudentMasteryPanel({ student }: { student: Student }) {
  const [open, setOpen] = useState(false);
  const [overriding, setOverriding] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const { data: progress = [], isLoading } = useQuery<ProgressRecord[]>({
    queryKey: ["progress", student.id],
    queryFn: () => progressApi.get(student.id).then((r) => r.data),
    enabled: open,
  });

  const overrideMutation = useMutation({
    mutationFn: ({ topicId, status }: { topicId: number; status: MasteryStatus }) =>
      progressApi.override(student.id, { topic_id: topicId, mastery_status: status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["progress", student.id] });
      setOverriding(null);
    },
  });

  const grouped = progress.reduce<Record<string, ProgressRecord[]>>((acc, p) => {
    const key = p.subject_name;
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  const secureCount = progress.filter((p) => p.mastery_status === "secure").length;
  const reteachCount = progress.filter((p) => p.mastery_status === "needs_reteach").length;

  return (
    <div className={cn(
      "rounded-xl border",
      "bg-white dark:bg-white/[0.03]",
      "border-gray-200 dark:border-white/[0.07]",
      "shadow-card dark:shadow-glass-dark",
    )}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full flex items-center justify-between px-5 py-4 text-left rounded-xl transition-colors",
          "hover:bg-gray-50 dark:hover:bg-white/[0.03]",
        )}
      >
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
            {student.first_name[0]}{student.last_name[0]}
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-zinc-100">{student.full_name}</p>
            <p className="text-xs text-gray-500 dark:text-zinc-500">{student.year_group} · {student.ability_band}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {progress.length > 0 && (
            <div className="flex gap-2 text-xs">
              <span className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 px-2 py-0.5 rounded-full">
                {secureCount} secure
              </span>
              {reteachCount > 0 && (
                <span className="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 px-2 py-0.5 rounded-full">
                  {reteachCount} reteach
                </span>
              )}
            </div>
          )}
          {open
            ? <ChevronUp className="h-4 w-4 text-gray-400 dark:text-zinc-500" />
            : <ChevronDown className="h-4 w-4 text-gray-400 dark:text-zinc-500" />
          }
        </div>
      </button>

      {open && (
        <div className="border-t border-gray-100 dark:border-white/[0.05] px-5 py-4">
          {isLoading && (
            <p className="text-gray-400 dark:text-zinc-500 text-sm text-center py-4">Loading progress…</p>
          )}

          {!isLoading && progress.length === 0 && (
            <div className="text-center py-6">
              <p className="text-gray-400 dark:text-zinc-500 text-sm">No progress recorded yet.</p>
              <p className="text-gray-400 dark:text-zinc-600 text-xs mt-1">
                Progress is calculated automatically from assessment attempts.
              </p>
            </div>
          )}

          {Object.entries(grouped).map(([subject, topics]) => (
            <div key={subject} className="mb-6 last:mb-0">
              <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wide mb-3">
                {subject}
              </p>
              <div className="space-y-1.5">
                {topics
                  .sort((a, b) => MASTERY_ORDER.indexOf(a.mastery_status) - MASTERY_ORDER.indexOf(b.mastery_status))
                  .map((p) => (
                    <div key={p.id} className="flex items-center gap-3 py-1.5">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm text-gray-700 dark:text-zinc-300 truncate">{p.topic_name}</p>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {p.average_score != null && (
                              <span className="text-xs text-gray-400 dark:text-zinc-500 num">{p.average_score.toFixed(0)}%</span>
                            )}
                            {p.sessions_on_topic > 0 && (
                              <span className="text-xs text-gray-400 dark:text-zinc-500">
                                {p.sessions_on_topic} session{p.sessions_on_topic !== 1 ? "s" : ""}
                              </span>
                            )}
                            {p.last_assessed && (
                              <span className="text-xs text-gray-300 dark:text-zinc-600">{formatDate(p.last_assessed)}</span>
                            )}
                          </div>
                        </div>
                        <div className="mt-1 h-1.5 rounded-full bg-gray-100 dark:bg-white/[0.06] overflow-hidden">
                          <div
                            className={cn("h-full rounded-full transition-all", BAR_COLOR[p.mastery_status])}
                            style={{ width: BAR_WIDTH[p.mastery_status] ?? "0%" }}
                          />
                        </div>
                      </div>

                      {overriding === p.topic_id ? (
                        <select
                          className={cn(
                            "text-xs rounded-lg px-2 py-1",
                            "border border-gray-300 dark:border-white/[0.1]",
                            "bg-white dark:bg-zinc-800",
                            "text-gray-800 dark:text-zinc-200",
                          )}
                          defaultValue={p.mastery_status}
                          onChange={(e) =>
                            overrideMutation.mutate({ topicId: p.topic_id, status: e.target.value as MasteryStatus })
                          }
                          onBlur={() => setOverriding(null)}
                          autoFocus
                        >
                          {MASTERY_ORDER.map((s) => (
                            <option key={s} value={s}>{masteryLabel(s)}</option>
                          ))}
                        </select>
                      ) : (
                        <button
                          onClick={() => setOverriding(p.topic_id)}
                          title="Click to override mastery status"
                          className="flex-shrink-0 flex items-center gap-1"
                        >
                          <MasteryBadge status={p.mastery_status} size="sm" />
                          {p.tutor_override && (
                            <span className="text-xs text-gray-400 dark:text-zinc-500" title="Tutor override">✎</span>
                          )}
                        </button>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          ))}

          <p className="text-xs text-gray-400 dark:text-zinc-600 mt-4">
            Click any mastery badge to override it. Overrides are marked with ✎.
          </p>
        </div>
      )}
    </div>
  );
}

export default function ProgressPage() {
  const { data: students = [], isLoading } = useQuery<Student[]>({
    queryKey: ["students"],
    queryFn: () => studentsApi.list().then((r) => r.data),
  });

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <PageHeader
        title="Mastery Tracker"
        subtitle="Topic-by-topic mastery for each student. Click a badge to override."
      />

      <div className="flex flex-wrap gap-2 mb-6">
        {(["not_started","taught","practising","developing","secure","needs_reteach","exceeded"] as MasteryStatus[]).map((s) => (
          <MasteryBadge key={s} status={s} size="sm" />
        ))}
      </div>

      <div className="space-y-3">
        {isLoading && <p className="text-gray-400 dark:text-zinc-500 text-sm text-center py-8">Loading…</p>}
        {students.map((student) => (
          <StudentMasteryPanel key={student.id} student={student} />
        ))}
        {!isLoading && students.length === 0 && (
          <div className={cn(
            "rounded-xl border py-12 text-center",
            "bg-white dark:bg-white/[0.03]",
            "border-gray-200 dark:border-white/[0.07]",
          )}>
            <p className="text-gray-400 dark:text-zinc-500 text-sm">No students yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
