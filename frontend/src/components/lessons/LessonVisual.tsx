"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { lessonsApi } from "@/lib/api";
import type { LessonVisualResponse, VisualStatus } from "@/types";

interface LessonVisualProps {
  lessonId: number;
  initialStatus: VisualStatus;
  initialHtml?: string | null;
}

export function LessonVisual({ lessonId, initialStatus, initialHtml }: LessonVisualProps) {
  const queryClient = useQueryClient();

  const { data } = useQuery<LessonVisualResponse>({
    queryKey: ["lesson-visual", lessonId],
    queryFn: () => lessonsApi.getVisual(lessonId).then((r) => r.data),
    initialData: { lesson_id: lessonId, visual_status: initialStatus, visual_html: initialHtml },
    refetchInterval: (query) => {
      const status = query.state.data?.visual_status;
      return status === "generating" ? 3000 : false;
    },
  });

  const generateMutation = useMutation({
    mutationFn: () => lessonsApi.generateVisual(lessonId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lesson-visual", lessonId] });
    },
  });

  const status = data?.visual_status ?? "none";
  const visualHtml = data?.visual_html;
  const isGenerating = status === "generating" || generateMutation.isPending;

  return (
    <div className="space-y-4">
      {status === "none" && !generateMutation.isPending && (
        <div className="flex flex-col items-center justify-center py-16 gap-4 border border-dashed border-gray-200 rounded-xl text-center">
          <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center">
            <svg className="w-6 h-6 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21a48.25 48.25 0 01-8.135-.687c-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">No visual yet</p>
            <p className="text-xs text-gray-500 mt-1 max-w-xs">
              Generate an interactive diagram students can explore during or after the session.
            </p>
          </div>
          <button
            onClick={() => generateMutation.mutate()}
            className="bg-brand-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors"
          >
            Generate visual
          </button>
        </div>
      )}

      {isGenerating && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
          <p className="text-sm text-gray-500">Generating interactive visual...</p>
        </div>
      )}

      {status === "failed" && !generateMutation.isPending && (
        <div className="rounded-lg bg-red-50 border border-red-100 p-4 flex items-center justify-between">
          <p className="text-sm text-red-700">Visual generation failed.</p>
          <button
            onClick={() => generateMutation.mutate()}
            className="text-sm text-red-600 underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      )}

      {status === "ready" && visualHtml && !generateMutation.isPending && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">Interactive visual — students can click to explore</p>
            <button
              onClick={() => generateMutation.mutate()}
              className="text-xs text-gray-400 hover:text-gray-600 underline"
            >
              Regenerate
            </button>
          </div>
          <iframe
            srcDoc={visualHtml}
            sandbox="allow-scripts"
            style={{
              width: "100%",
              minHeight: "520px",
              border: "none",
              borderRadius: "12px",
              backgroundColor: "#ffffff",
            }}
            title={`Lesson visual ${lessonId}`}
          />
        </div>
      )}
    </div>
  );
}
