"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { studentPortalApi } from "@/lib/api";
import type { HomeworkTask, HomeworkStatus } from "@/types";
import { formatDate } from "@/lib/utils";
import { ClipboardList, CheckCircle } from "lucide-react";

const STATUS_TABS: { label: string; value: HomeworkStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "To do", value: "set" },
  { label: "In progress", value: "in_progress" },
  { label: "Overdue", value: "overdue" },
  { label: "Submitted", value: "submitted" },
  { label: "Marked", value: "marked" },
];

const statusColour: Record<HomeworkStatus, string> = {
  set: "bg-blue-100 text-blue-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  submitted: "bg-green-100 text-green-700",
  marked: "bg-purple-100 text-purple-700",
  overdue: "bg-red-100 text-red-700",
};

const statusLabel: Record<HomeworkStatus, string> = {
  set: "To do",
  in_progress: "In progress",
  submitted: "Submitted",
  marked: "Marked",
  overdue: "Overdue",
};

function TaskCard({ task, onSubmit }: { task: HomeworkTask; onSubmit: (id: number) => void }) {
  const [expanded, setExpanded] = useState(false);
  const canSubmit = task.status === "set" || task.status === "in_progress" || task.status === "overdue";

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-5 py-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-medium text-gray-900">{task.title}</p>
            {task.due_date && (
              <p className={`text-xs mt-0.5 ${task.status === "overdue" ? "text-red-500 font-medium" : "text-gray-400"}`}>
                {task.status === "overdue" ? "Was due" : "Due"} {formatDate(task.due_date)}
              </p>
            )}
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full flex-shrink-0 ${statusColour[task.status]}`}>
            {statusLabel[task.status]}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 px-5 py-4 space-y-3">
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{task.description}</p>

          {/* Task content */}
          {task.task_content_json && Object.keys(task.task_content_json).length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              {(task.task_content_json.tasks as string[] | undefined)?.map((t, i) => (
                <div key={i} className="flex gap-3">
                  <span className="text-xs font-semibold text-brand-600 mt-0.5">{i + 1}.</span>
                  <p className="text-sm text-gray-700">{t}</p>
                </div>
              ))}
            </div>
          )}

          {/* Tutor feedback (once marked) */}
          {task.status === "marked" && task.tutor_feedback && (
            <div className="bg-green-50 rounded-lg p-3 border border-green-100">
              <p className="text-xs font-semibold text-green-700 mb-1">Tutor feedback</p>
              <p className="text-sm text-green-800">{task.tutor_feedback}</p>
            </div>
          )}

          {canSubmit && (
            <button
              onClick={() => onSubmit(task.id)}
              className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-brand-700 transition-colors"
            >
              <CheckCircle className="h-4 w-4" />
              Mark as submitted
            </button>
          )}

          {task.status === "submitted" && (
            <p className="text-xs text-center text-gray-400">
              Submitted — your tutor will review and mark this soon.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function StudentTasksPage() {
  const [activeTab, setActiveTab] = useState<HomeworkStatus | "all">("all");
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery<HomeworkTask[]>({
    queryKey: ["student-homework"],
    queryFn: () => studentPortalApi.homework().then((r) => r.data),
  });

  const submitMutation = useMutation({
    mutationFn: (id: number) => studentPortalApi.submitHomework(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["student-homework"] }),
  });

  const filtered = activeTab === "all" ? tasks : tasks.filter((t) => t.status === activeTab);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
        <p className="text-gray-500 text-sm mt-1">Homework and tasks set by your tutor</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_TABS.map((tab) => {
          const count = tab.value === "all" ? tasks.length : tasks.filter((t) => t.status === tab.value).length;
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                activeTab === tab.value
                  ? "bg-brand-600 text-white border-brand-600"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {tab.label} {count > 0 && <span className="ml-1 opacity-75">({count})</span>}
            </button>
          );
        })}
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-white rounded-xl border border-gray-200 animate-pulse" />
          ))}
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onSubmit={(id) => submitMutation.mutate(id)}
          />
        ))}
      </div>

      {!isLoading && filtered.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 py-12 text-center">
          <ClipboardList className="h-8 w-8 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">
            {activeTab === "all" ? "No tasks yet — your tutor will add them here." : `No ${activeTab.replace("_", " ")} tasks.`}
          </p>
        </div>
      )}
    </div>
  );
}
