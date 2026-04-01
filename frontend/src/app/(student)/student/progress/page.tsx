"use client";

import { useQuery } from "@tanstack/react-query";
import { studentPortalApi } from "@/lib/api";
import type { ProgressRecord } from "@/types";
import { masteryLabel, masteryColour } from "@/lib/utils";
import { MasteryBadge } from "@/components/ui/MasteryBadge";
import { BookOpen } from "lucide-react";

export default function StudentProgressPage() {
  const { data: progress = [], isLoading } = useQuery<ProgressRecord[]>({
    queryKey: ["student-progress"],
    queryFn: () => studentPortalApi.progress().then((r) => r.data),
  });

  // Group by subject
  const grouped = progress.reduce<Record<string, ProgressRecord[]>>((acc, p) => {
    if (!acc[p.subject_name]) acc[p.subject_name] = [];
    acc[p.subject_name].push(p);
    return acc;
  }, {});

  const secureCount = progress.filter((p) => p.mastery_status === "secure" || p.mastery_status === "exceeded").length;
  const totalTracked = progress.length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Progress</h1>
        <p className="text-gray-500 text-sm mt-1">Topic-by-topic mastery across all subjects</p>
      </div>

      {/* Overall summary */}
      {totalTracked > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-700">Overall progress</p>
            <p className="text-sm text-gray-500">{secureCount}/{totalTracked} topics secure</p>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-500 rounded-full transition-all"
              style={{ width: `${totalTracked > 0 ? (secureCount / totalTracked) * 100 : 0}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {totalTracked > 0 ? Math.round((secureCount / totalTracked) * 100) : 0}% of tracked topics are secure or exceeded
          </p>
        </div>
      )}

      {/* Mastery legend */}
      <div className="flex flex-wrap gap-2">
        {(["not_started", "taught", "practising", "developing", "secure", "needs_reteach", "exceeded"] as const).map((s) => (
          <MasteryBadge key={s} status={s} size="sm" />
        ))}
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 bg-white rounded-xl border border-gray-200 animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && progress.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 py-12 text-center">
          <BookOpen className="h-8 w-8 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No progress recorded yet.</p>
          <p className="text-gray-400 text-xs mt-1">Progress is updated automatically after assessments.</p>
        </div>
      )}

      {Object.entries(grouped).map(([subject, topics]) => (
        <div key={subject} className="bg-white rounded-xl border border-gray-200">
          <p className="font-semibold text-gray-900 px-5 py-4 border-b border-gray-100">{subject}</p>
          <div className="px-5 py-3 space-y-2">
            {topics.map((p) => (
              <div key={p.id} className="flex items-center gap-3 py-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-sm text-gray-700 truncate">{p.topic_name}</p>
                    <div className="flex items-center gap-2 flex-shrink-0 text-xs text-gray-400">
                      {p.average_score !== null && p.average_score !== undefined && (
                        <span>{p.average_score.toFixed(0)}%</span>
                      )}
                      {p.sessions_on_topic > 0 && (
                        <span>{p.sessions_on_topic} session{p.sessions_on_topic !== 1 ? "s" : ""}</span>
                      )}
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        p.mastery_status === "secure" ? "bg-green-500" :
                        p.mastery_status === "exceeded" ? "bg-purple-500" :
                        p.mastery_status === "developing" ? "bg-orange-400" :
                        p.mastery_status === "practising" ? "bg-yellow-400" :
                        p.mastery_status === "taught" ? "bg-blue-300" :
                        p.mastery_status === "needs_reteach" ? "bg-red-400" :
                        "bg-gray-200"
                      }`}
                      style={{
                        width: {
                          not_started: "4%",
                          taught: "20%",
                          practising: "40%",
                          developing: "60%",
                          secure: "100%",
                          needs_reteach: "100%",
                          exceeded: "100%",
                        }[p.mastery_status] ?? "0%",
                      }}
                    />
                  </div>
                </div>
                <MasteryBadge status={p.mastery_status} size="sm" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
