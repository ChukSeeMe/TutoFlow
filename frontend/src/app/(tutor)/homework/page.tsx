"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { homeworkApi, studentsApi } from "@/lib/api";
import type { HomeworkTask, Student } from "@/types";
import { formatDate, cn } from "@/lib/utils";
import Link from "next/link";
import { Plus, CheckCircle, Clock } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";

const STATUS_COLOUR: Record<string, string> = {
  set:         "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  in_progress: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  submitted:   "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  marked:      "bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300",
  overdue:     "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

const selectCn = cn(
  "rounded-xl px-3 py-2 text-sm",
  "bg-white dark:bg-[#1e1e28]",
  "border border-gray-300 dark:border-white/[0.1]",
  "text-gray-800 dark:text-zinc-200",
  "focus:outline-none focus:ring-2 focus:ring-brand-500/50",
  "[color-scheme:light] dark:[color-scheme:dark]",
);

export default function HomeworkPage() {
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const queryClient = useQueryClient();

  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ["students"],
    queryFn: () => studentsApi.list().then((r) => r.data),
  });

  const { data: homework = [], isLoading } = useQuery<HomeworkTask[]>({
    queryKey: ["homework", selectedStudent],
    queryFn: () => homeworkApi.list(Number(selectedStudent)).then((r) => r.data),
    enabled: !!selectedStudent,
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => homeworkApi.update(id, { tutor_approved: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["homework", selectedStudent] }),
  });

  const filtered = homework.filter(
    (h) => statusFilter === "all" || h.status === statusFilter
  );

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <PageHeader
        title="Homework"
        subtitle="Manage and review homework tasks for your students"
        actions={
          <Link
            href="/homework/new"
            className="flex items-center gap-2 bg-brand-gradient text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-glow-sm hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" /> Generate Homework
          </Link>
        }
      />

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <select
          value={selectedStudent}
          onChange={(e) => setSelectedStudent(e.target.value)}
          className={selectCn}
        >
          <option value="">Select student…</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>{s.full_name}</option>
          ))}
        </select>

        {selectedStudent && (
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={selectCn}
          >
            <option value="all">All statuses</option>
            {["set","in_progress","submitted","marked","overdue"].map((s) => (
              <option key={s} value={s}>{s.replace("_", " ")}</option>
            ))}
          </select>
        )}
      </div>

      {!selectedStudent && (
        <div className={cn(
          "rounded-xl border py-12 text-center",
          "bg-white dark:bg-white/[0.03]",
          "border-gray-200 dark:border-white/[0.07]",
        )}>
          <p className="text-gray-400 dark:text-zinc-500 text-sm">
            Select a student to view their homework tasks
          </p>
        </div>
      )}

      {selectedStudent && (
        <div className={cn(
          "rounded-xl border divide-y",
          "bg-white dark:bg-white/[0.03]",
          "border-gray-200 dark:border-white/[0.07]",
          "divide-gray-100 dark:divide-white/[0.05]",
        )}>
          {isLoading && (
            <div className="py-8 text-center text-gray-400 dark:text-zinc-500 text-sm">Loading…</div>
          )}
          {!isLoading && filtered.length === 0 && (
            <div className="py-8 text-center text-gray-400 dark:text-zinc-500 text-sm">
              No homework tasks found
            </div>
          )}
          {filtered.map((hw) => (
            <div key={hw.id} className="px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-gray-900 dark:text-zinc-100">{hw.title}</p>
                    {hw.ai_generated && !hw.tutor_approved && (
                      <span className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 px-2 py-0.5 rounded-full">
                        Needs approval
                      </span>
                    )}
                    {hw.ai_generated && hw.tutor_approved && (
                      <span className="text-xs bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300 px-2 py-0.5 rounded-full">
                        AI generated
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-zinc-400 mt-0.5 line-clamp-1">{hw.description}</p>
                  <div className="flex items-center gap-3 mt-1">
                    {hw.due_date && (
                      <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-zinc-500">
                        <Clock className="h-3 w-3" /> Due {formatDate(hw.due_date)}
                      </span>
                    )}
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-medium",
                      STATUS_COLOUR[hw.status] ?? "bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400"
                    )}>
                      {hw.status.replace("_", " ")}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {!hw.tutor_approved && (
                    <button
                      onClick={() => approveMutation.mutate(hw.id)}
                      className="flex items-center gap-1 text-xs bg-green-600 dark:bg-green-700 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 dark:hover:bg-green-600"
                    >
                      <CheckCircle className="h-3 w-3" /> Approve
                    </button>
                  )}
                </div>
              </div>

              {hw.tutor_approved && hw.task_content_json && (
                <details className="mt-3">
                  <summary className="text-xs text-brand-600 dark:text-brand-400 cursor-pointer hover:underline">
                    View task content
                  </summary>
                  <div className={cn(
                    "mt-2 rounded-lg p-3",
                    "bg-gray-50 dark:bg-white/[0.04]",
                    "border border-gray-100 dark:border-white/[0.05]",
                  )}>
                    {((hw.task_content_json as { tasks?: Array<{ instruction: string }> }).tasks ?? []).map((t, i) => (
                      <div key={i} className="text-xs text-gray-700 dark:text-zinc-300 py-1 border-b border-gray-100 dark:border-white/[0.05] last:border-0">
                        <span className="font-medium">Task {i + 1}:</span> {t.instruction}
                      </div>
                    ))}
                  </div>
                </details>
              )}

              {hw.status === "submitted" && !hw.tutor_feedback && (
                <FeedbackForm hwId={hw.id} studentId={selectedStudent} queryClient={queryClient} />
              )}
              {hw.tutor_feedback && (
                <div className="mt-2 rounded-lg px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30">
                  <p className="text-xs font-medium text-green-700 dark:text-green-400">Your feedback:</p>
                  <p className="text-xs text-green-600 dark:text-green-500 mt-0.5">{hw.tutor_feedback}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FeedbackForm({
  hwId, studentId, queryClient,
}: {
  hwId: number;
  studentId: string;
  queryClient: ReturnType<typeof useQueryClient>;
}) {
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);
  const [show, setShow] = useState(false);

  async function submit() {
    if (!feedback.trim()) return;
    setSaving(true);
    await homeworkApi.update(hwId, { tutor_feedback: feedback, status: "marked" });
    queryClient.invalidateQueries({ queryKey: ["homework", studentId] });
    setSaving(false);
  }

  if (!show) {
    return (
      <button onClick={() => setShow(true)} className="mt-2 text-xs text-brand-600 dark:text-brand-400 hover:underline">
        + Add feedback and mark
      </button>
    );
  }

  return (
    <div className="mt-2 space-y-2">
      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        rows={2}
        placeholder="Feedback for the student…"
        className={cn(
          "w-full rounded-xl px-3 py-2 text-xs resize-none",
          "bg-white dark:bg-[#1e1e28]",
          "border border-gray-300 dark:border-white/[0.1]",
          "text-gray-800 dark:text-zinc-200",
          "placeholder:text-gray-400 dark:placeholder:text-zinc-600",
          "focus:outline-none focus:ring-2 focus:ring-brand-500/50",
          "[color-scheme:light] dark:[color-scheme:dark]",
        )}
      />
      <div className="flex gap-2">
        <button
          onClick={submit}
          disabled={saving || !feedback.trim()}
          className="text-xs bg-brand-600 text-white px-3 py-1.5 rounded-lg hover:bg-brand-700 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save feedback"}
        </button>
        <button onClick={() => setShow(false)} className="text-xs text-gray-500 dark:text-zinc-400 hover:underline">
          Cancel
        </button>
      </div>
    </div>
  );
}
