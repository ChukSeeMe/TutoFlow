"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { studentsApi, progressApi } from "@/lib/api";
import type { StudentSummary, ProgressRecord } from "@/types";
import { masteryColour, masteryLabel, cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";

type MasteryStatus = ProgressRecord["mastery_status"];

const MASTERY_ORDER: MasteryStatus[] = [
  "not_started","taught","practising","developing","secure","needs_reteach","exceeded",
];

export default function MasteryHeatmapPage() {
  const { data: students = [], isLoading } = useQuery<StudentSummary[]>({
    queryKey: ["students"],
    queryFn: () => studentsApi.list().then((r) => r.data),
  });

  const progressQueries = useQuery({
    queryKey: ["mastery-heatmap", students.map((s) => s.id)],
    queryFn: async () => {
      const results = await Promise.all(
        students.map((s) =>
          progressApi.get(s.id).then((r) => ({ studentId: s.id, records: r.data as ProgressRecord[] }))
        )
      );
      return results;
    },
    enabled: students.length > 0,
  });

  const progressByStudent = new Map<number, ProgressRecord[]>(
    (progressQueries.data ?? []).map(({ studentId, records }) => [studentId, records])
  );

  const topicMap = new Map<number, { id: number; name: string; subject: string }>();
  for (const records of progressByStudent.values()) {
    for (const rec of records) {
      if (!topicMap.has(rec.topic_id)) {
        topicMap.set(rec.topic_id, {
          id: rec.topic_id,
          name: rec.topic_name ?? `Topic ${rec.topic_id}`,
          subject: rec.subject_name ?? "Unknown",
        });
      }
    }
  }

  const topics = Array.from(topicMap.values()).sort((a, b) =>
    a.subject.localeCompare(b.subject) || a.name.localeCompare(b.name)
  );

  const subjectTopics = new Map<string, typeof topics>();
  for (const t of topics) {
    if (!subjectTopics.has(t.subject)) subjectTopics.set(t.subject, []);
    subjectTopics.get(t.subject)!.push(t);
  }

  const masteryForCell = (studentId: number, topicId: number): MasteryStatus => {
    const records = progressByStudent.get(studentId) ?? [];
    return (records.find((r) => r.topic_id === topicId)?.mastery_status as MasteryStatus) ?? "not_started";
  };

  if (isLoading) {
    return <div className="p-8 text-gray-400 dark:text-zinc-500">Loading heatmap…</div>;
  }

  if (students.length === 0) {
    return (
      <div className="p-8">
        <PageHeader title="Mastery Heatmap" subtitle="Topic mastery status across all active students" />
        <p className="text-gray-500 dark:text-zinc-500 text-sm">No students yet.</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <PageHeader
        title="Mastery Heatmap"
        subtitle="Topic mastery status across all active students"
        actions={
          <div className="hidden md:flex items-center gap-3 flex-wrap justify-end">
            {MASTERY_ORDER.map((status) => (
              <div key={status} className="flex items-center gap-1.5">
                <div className={cn("w-3 h-3 rounded-sm", masteryColour(status))} />
                <span className="text-xs text-gray-600 dark:text-zinc-400">{masteryLabel(status)}</span>
              </div>
            ))}
          </div>
        }
      />

      {topics.length === 0 ? (
        <div className={cn(
          "rounded-xl p-8 text-center text-sm",
          "bg-gray-50 dark:bg-white/[0.03]",
          "border border-gray-200 dark:border-white/[0.07]",
          "text-gray-400 dark:text-zinc-500",
        )}>
          No progress records yet. Progress is updated automatically after sessions.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-white/[0.07]">
          <table className="text-xs border-collapse w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-white/[0.03]">
                <th className={cn(
                  "text-left font-medium px-4 py-3 sticky left-0 min-w-[160px]",
                  "bg-gray-50 dark:bg-[#0d0d12]",
                  "border-b border-r border-gray-200 dark:border-white/[0.07]",
                  "text-gray-500 dark:text-zinc-400",
                )}>
                  Student
                </th>
                {Array.from(subjectTopics.entries()).map(([subject, subTopics]) =>
                  subTopics.map((topic, i) => (
                    <th
                      key={topic.id}
                      className={cn(
                        "text-center font-medium px-1 py-2 min-w-[40px] max-w-[60px]",
                        "border-b border-gray-200 dark:border-white/[0.07]",
                        "text-gray-600 dark:text-zinc-400",
                      )}
                    >
                      {i === 0 && (
                        <div className="text-gray-400 dark:text-zinc-600 text-[10px] font-normal mb-1 whitespace-nowrap overflow-hidden text-ellipsis">
                          {subject}
                        </div>
                      )}
                      <div
                        className="writing-vertical text-[10px] whitespace-nowrap overflow-hidden text-ellipsis"
                        title={topic.name}
                        style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", maxHeight: "80px" }}
                      >
                        {topic.name}
                      </div>
                    </th>
                  ))
                )}
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50/60 dark:hover:bg-white/[0.02] transition-colors">
                  <td className={cn(
                    "sticky left-0 px-4 py-2.5",
                    "bg-white dark:bg-[#0d0d12]",
                    "border-b border-r border-gray-100 dark:border-white/[0.05]",
                  )}>
                    <Link
                      href={`/students/${student.id}`}
                      className="text-brand-600 dark:text-brand-400 hover:underline font-medium"
                    >
                      {student.full_name}
                    </Link>
                    <p className="text-gray-400 dark:text-zinc-600 text-[10px]">{student.year_group}</p>
                  </td>
                  {topics.map((topic) => {
                    const status = masteryForCell(student.id, topic.id);
                    return (
                      <td
                        key={topic.id}
                        className="border-b border-gray-100 dark:border-white/[0.04] px-1 py-1 text-center"
                      >
                        <Link href={`/students/${student.id}`}>
                          <div
                            title={`${student.full_name} — ${topic.name}: ${masteryLabel(status)}`}
                            className={cn(
                              "w-7 h-7 rounded-sm mx-auto transition-opacity hover:opacity-70 cursor-pointer",
                              masteryColour(status),
                            )}
                          />
                        </Link>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
