"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { lessonsApi } from "@/lib/api";
import type { LessonPlan } from "@/types";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, CheckCircle, Edit3, Clock, BookOpen } from "lucide-react";
import { useState } from "react";

type LessonContent = {
  title?: string;
  learning_objectives?: string[];
  success_criteria?: string[];
  prior_knowledge_check?: { questions?: string[]; purpose?: string };
  starter_activity?: { title?: string; description?: string; duration_minutes?: number; purpose?: string };
  teacher_explanation?: { outline?: string[]; key_vocabulary?: string[]; teaching_notes?: string };
  worked_examples?: Array<{ problem?: string; solution_steps?: string[]; teaching_point?: string }>;
  guided_practice?: { tasks?: string[]; scaffolding?: string; duration_minutes?: number };
  independent_tasks?: { tasks?: string[]; duration_minutes?: number };
  differentiated_tasks?: { foundation?: string[]; core?: string[]; higher?: string[]; extension?: string[] };
  scaffolded_support?: string[];
  challenge_tasks?: string[];
  misconceptions?: Array<{ misconception?: string; how_to_address?: string }>;
  exit_ticket?: { questions?: string[]; purpose?: string };
  homework_suggestion?: { title?: string; description?: string; estimated_time_minutes?: number };
  parent_summary_draft?: string;
  materials_needed?: string[];
  image_url?: string;
};

export default function LessonPlanPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [approving, setApproving] = useState(false);

  const { data: plan, isLoading } = useQuery<LessonPlan>({
    queryKey: ["lesson", id],
    queryFn: () => lessonsApi.get(Number(id)).then((r) => r.data),
  });

  const approveMutation = useMutation({
    mutationFn: () => lessonsApi.update(Number(id), { tutor_approved: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lesson", id] });
      setApproving(false);
    },
  });

  if (isLoading) return <div className="p-8 text-gray-400">Loading lesson plan...</div>;
  if (!plan) return <div className="p-8 text-gray-400">Lesson plan not found.</div>;

  const content = plan.content_json as LessonContent;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href="/lessons" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to lessons
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{plan.title}</h1>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="h-3.5 w-3.5" /> {plan.duration_minutes} min
              </span>
              <span className="text-xs text-gray-500 capitalize">{plan.lesson_type.replace("_", " ")}</span>
              <span className="text-xs text-gray-500 capitalize">{plan.difficulty_level}</span>
              <span className="text-xs text-gray-500">{formatDate(plan.created_at)}</span>
              {plan.ai_generated && (
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">AI generated</span>
              )}
              {plan.tutor_approved ? (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" /> Approved
                </span>
              ) : (
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Pending review</span>
              )}
            </div>
          </div>

          {!plan.tutor_approved && (
            <button
              onClick={() => {
                setApproving(true);
                approveMutation.mutate();
              }}
              disabled={approving}
              className="flex-shrink-0 flex items-center gap-2 bg-green-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-60"
            >
              <CheckCircle className="h-4 w-4" />
              {approving ? "Approving..." : "Approve Plan"}
            </button>
          )}
        </div>

        {/* AI draft notice */}
        {plan.ai_generated && !plan.tutor_approved && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-amber-800 text-sm font-medium">This is an AI-generated draft</p>
            <p className="text-amber-700 text-xs mt-1">
              Review all sections carefully before using in a session. Edit as needed then click Approve.
            </p>
          </div>
        )}
      </div>

      {/* Topic image */}
      {content.image_url && (
        <div className="relative w-full h-48 rounded-xl overflow-hidden mb-4">
          <Image
            src={content.image_url}
            alt={plan.title}
            fill
            className="object-cover"
            sizes="(max-width: 896px) 100vw, 896px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <p className="absolute bottom-2 right-3 text-[10px] text-white/60">Photo via Unsplash</p>
        </div>
      )}

      {/* Learning objective */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
        <h2 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-brand-600" /> Learning Objective
        </h2>
        <p className="text-gray-700">{plan.learning_objective}</p>

        {content.success_criteria && content.success_criteria.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Success Criteria</p>
            <ul className="space-y-1">
              {content.success_criteria.map((sc, i) => (
                <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span> {sc}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Lesson sections */}
      {[
        {
          title: "Prior Knowledge Check",
          content: content.prior_knowledge_check && (
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
              {content.prior_knowledge_check.questions?.map((q, i) => <li key={i}>{q}</li>)}
            </ul>
          ),
        },
        {
          title: "Starter Activity",
          content: content.starter_activity && (
            <div className="space-y-2 text-sm text-gray-700">
              <p className="font-medium">{content.starter_activity.title}</p>
              <p>{content.starter_activity.description}</p>
              {content.starter_activity.duration_minutes && (
                <p className="text-gray-400 text-xs">Duration: {content.starter_activity.duration_minutes} min</p>
              )}
            </div>
          ),
        },
        {
          title: "Teacher Explanation",
          content: content.teacher_explanation && (
            <div className="space-y-3 text-sm text-gray-700">
              {content.teacher_explanation.outline?.length && (
                <ul className="list-disc list-inside space-y-1">
                  {content.teacher_explanation.outline.map((pt, i) => <li key={i}>{pt}</li>)}
                </ul>
              )}
              {content.teacher_explanation.key_vocabulary?.length && (
                <div>
                  <p className="font-medium text-gray-600 mb-1">Key vocabulary:</p>
                  <div className="flex flex-wrap gap-1">
                    {content.teacher_explanation.key_vocabulary.map((v, i) => (
                      <span key={i} className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded">{v}</span>
                    ))}
                  </div>
                </div>
              )}
              {content.teacher_explanation.teaching_notes && (
                <p className="text-gray-500 italic">{content.teacher_explanation.teaching_notes}</p>
              )}
            </div>
          ),
        },
        {
          title: "Worked Examples",
          content: content.worked_examples?.length && (
            <div className="space-y-4">
              {content.worked_examples.map((ex, i) => (
                <div key={i} className="border-l-2 border-brand-200 pl-4">
                  <p className="font-medium text-sm text-gray-800">Problem: {ex.problem}</p>
                  <ol className="mt-2 space-y-1 list-decimal list-inside text-sm text-gray-700">
                    {ex.solution_steps?.map((step, j) => <li key={j}>{step}</li>)}
                  </ol>
                  {ex.teaching_point && (
                    <p className="mt-1 text-xs text-brand-600 font-medium">→ {ex.teaching_point}</p>
                  )}
                </div>
              ))}
            </div>
          ),
        },
        {
          title: "Guided Practice",
          content: content.guided_practice && (
            <div className="space-y-2 text-sm text-gray-700">
              <ul className="list-disc list-inside space-y-1">
                {content.guided_practice.tasks?.map((t, i) => <li key={i}>{t}</li>)}
              </ul>
              {content.guided_practice.scaffolding && (
                <p className="text-gray-500 text-xs">Scaffold: {content.guided_practice.scaffolding}</p>
              )}
            </div>
          ),
        },
        {
          title: "Independent Tasks",
          content: content.independent_tasks && (
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
              {content.independent_tasks.tasks?.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          ),
        },
      ].map(({ title, content: sectionContent }) =>
        sectionContent ? (
          <div key={title} className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
            <h2 className="font-semibold text-gray-900 mb-3">{title}</h2>
            {sectionContent}
          </div>
        ) : null
      )}

      {/* Differentiation */}
      {content.differentiated_tasks && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
          <h2 className="font-semibold text-gray-900 mb-4">Differentiated Tasks</h2>
          <div className="grid grid-cols-2 gap-4">
            {(["foundation","core","higher","extension"] as const).map((level) => {
              const tasks = content.differentiated_tasks?.[level];
              if (!tasks?.length) return null;
              return (
                <div key={level} className="border border-gray-100 rounded-lg p-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 capitalize">{level}</p>
                  <ul className="list-disc list-inside space-y-1 text-xs text-gray-700">
                    {tasks.map((t, i) => <li key={i}>{t}</li>)}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Misconceptions */}
      {content.misconceptions?.length && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
          <h2 className="font-semibold text-gray-900 mb-3">Watch for These Misconceptions</h2>
          <div className="space-y-3">
            {content.misconceptions.map((m, i) => (
              <div key={i} className="bg-amber-50 rounded-lg p-3">
                <p className="text-sm font-medium text-amber-800">{m.misconception}</p>
                <p className="text-xs text-amber-700 mt-1">{m.how_to_address}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Exit ticket */}
      {content.exit_ticket && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
          <h2 className="font-semibold text-gray-900 mb-3">Exit Ticket</h2>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
            {content.exit_ticket.questions?.map((q, i) => <li key={i}>{q}</li>)}
          </ul>
        </div>
      )}

      {/* Homework suggestion */}
      {content.homework_suggestion && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
          <h2 className="font-semibold text-gray-900 mb-2">Homework Suggestion</h2>
          <p className="font-medium text-sm text-gray-800">{content.homework_suggestion.title}</p>
          <p className="text-sm text-gray-600 mt-1">{content.homework_suggestion.description}</p>
          {content.homework_suggestion.estimated_time_minutes && (
            <p className="text-xs text-gray-400 mt-1">
              Estimated time: {content.homework_suggestion.estimated_time_minutes} min
            </p>
          )}
        </div>
      )}

      {/* Parent summary draft */}
      {content.parent_summary_draft && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 mb-4">
          <h2 className="font-semibold text-blue-900 mb-2">Parent Summary Draft</h2>
          <p className="text-xs text-blue-600 mb-2">
            AI-drafted — review and edit before using in any parent communication.
          </p>
          <p className="text-sm text-blue-800">{content.parent_summary_draft}</p>
        </div>
      )}
    </div>
  );
}
