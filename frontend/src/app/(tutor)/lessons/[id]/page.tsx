"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { lessonsApi } from "@/lib/api";
import type { LessonPlan } from "@/types";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, CheckCircle, Clock, BookOpen, Sparkles } from "lucide-react";
import { useState } from "react";
import { LessonVisual } from "@/components/lessons/LessonVisual";

// ── New schema (AI generates this from 2026-04-05 onwards) ───────────────────
type LessonSection = {
  title?: string;
  duration_mins?: number;
  content?: string;
  teacher_notes?: string;
  activity_type?: string;
};
type WorkedExample = { problem?: string; solution?: string; steps?: string[] };
type PracticeQuestion = { question?: string; answer?: string; marks?: number; difficulty?: string };
type VocabItem = { term?: string; definition?: string };

type NewLessonContent = {
  title?: string;
  subject?: string;
  topic?: string;
  year_group?: string;
  duration_mins?: number;
  difficulty?: string;
  objective?: string;
  curriculum_links?: string[];
  sections?: LessonSection[];
  worked_examples?: WorkedExample[];
  practice_questions?: PracticeQuestion[];
  key_vocabulary?: VocabItem[];
  homework?: { task?: string; instructions?: string; estimated_time_mins?: number };
  assessment_criteria?: string[];
  differentiation?: { support?: string; core?: string; extension?: string };
  image_url?: string;
};

// ── Legacy schema (plans generated before the update) ────────────────────────
type LegacyContent = {
  title?: string;
  learning_objectives?: string[];
  success_criteria?: string[];
  prior_knowledge_check?: { questions?: string[]; purpose?: string };
  starter_activity?: { title?: string; description?: string; duration_minutes?: number };
  teacher_explanation?: { outline?: string[]; key_vocabulary?: string[]; teaching_notes?: string };
  worked_examples?: Array<{ problem?: string; solution_steps?: string[]; teaching_point?: string }>;
  guided_practice?: { tasks?: string[]; scaffolding?: string };
  independent_tasks?: { tasks?: string[] };
  differentiated_tasks?: { foundation?: string[]; core?: string[]; higher?: string[]; extension?: string[] };
  misconceptions?: Array<{ misconception?: string; how_to_address?: string }>;
  exit_ticket?: { questions?: string[] };
  homework_suggestion?: { title?: string; description?: string; estimated_time_minutes?: number };
  parent_summary_draft?: string;
  image_url?: string;
};

type Tab = "plan" | "visual";

export default function LessonPlanPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [approving, setApproving] = useState(false);
  const [tab, setTab] = useState<Tab>("plan");

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

  const raw = plan.content_json;
  // Detect schema: new schema has "sections" array, legacy has "starter_activity"
  const isNewSchema = Array.isArray((raw as NewLessonContent).sections);
  const newContent = isNewSchema ? (raw as NewLessonContent) : null;
  const legacy = !isNewSchema ? (raw as LegacyContent) : null;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
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
              onClick={() => { setApproving(true); approveMutation.mutate(); }}
              disabled={approving}
              className="flex-shrink-0 flex items-center gap-2 bg-green-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-60"
            >
              <CheckCircle className="h-4 w-4" />
              {approving ? "Approving..." : "Approve Plan"}
            </button>
          )}
        </div>

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
      {(raw as { image_url?: string }).image_url && (
        <div className="relative w-full h-48 rounded-xl overflow-hidden mb-4">
          <Image
            src={(raw as { image_url: string }).image_url}
            alt={plan.title}
            fill
            className="object-cover"
            sizes="(max-width: 896px) 100vw, 896px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <p className="absolute bottom-2 right-3 text-[10px] text-white/60">Photo via Unsplash</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {(["plan", "visual"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              tab === t
                ? "border-brand-600 text-brand-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "visual" ? (
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> Visual
              </span>
            ) : (
              "Plan"
            )}
          </button>
        ))}
      </div>

      {/* ── Visual tab ─────────────────────────────────────────────────────── */}
      {tab === "visual" && (
        <LessonVisual
          lessonId={plan.id}
          initialStatus={plan.visual_status}
          initialHtml={plan.visual_html}
        />
      )}

      {/* ── Plan tab ───────────────────────────────────────────────────────── */}
      {tab === "plan" && (
        <>
          {/* Learning objective */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
            <h2 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-brand-600" /> Learning Objective
            </h2>
            <p className="text-gray-700">{plan.learning_objective}</p>
          </div>

          {/* ── NEW SCHEMA rendering ── */}
          {newContent && (
            <>
              {/* Curriculum links */}
              {newContent.curriculum_links && newContent.curriculum_links.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
                  <h2 className="font-semibold text-gray-900 mb-2">Curriculum Links</h2>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                    {newContent.curriculum_links.map((l, i) => <li key={i}>{l}</li>)}
                  </ul>
                </div>
              )}

              {/* Lesson sections */}
              {newContent.sections && newContent.sections.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
                  <h2 className="font-semibold text-gray-900 mb-4">Lesson Sections</h2>
                  <div className="space-y-4">
                    {newContent.sections.map((s, i) => (
                      <div key={i} className="border-l-2 border-brand-200 pl-4">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-gray-800">{s.title}</p>
                          {s.duration_mins && (
                            <span className="text-xs text-gray-400">{s.duration_mins} min</span>
                          )}
                          {s.activity_type && (
                            <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded capitalize">
                              {s.activity_type}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700">{s.content}</p>
                        {s.teacher_notes && (
                          <p className="text-xs text-gray-500 italic mt-1">Teacher note: {s.teacher_notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Worked examples */}
              {newContent.worked_examples && newContent.worked_examples.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
                  <h2 className="font-semibold text-gray-900 mb-4">Worked Examples</h2>
                  <div className="space-y-4">
                    {newContent.worked_examples.map((ex, i) => (
                      <div key={i} className="border-l-2 border-brand-200 pl-4">
                        <p className="font-medium text-sm text-gray-800">Problem: {ex.problem}</p>
                        {ex.steps && ex.steps.length > 0 && (
                          <ol className="mt-2 space-y-1 list-decimal list-inside text-sm text-gray-700">
                            {ex.steps.map((step, j) => <li key={j}>{step}</li>)}
                          </ol>
                        )}
                        {ex.solution && (
                          <p className="mt-2 text-sm text-green-700 font-medium">Answer: {ex.solution}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Practice questions */}
              {newContent.practice_questions && newContent.practice_questions.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
                  <h2 className="font-semibold text-gray-900 mb-4">Practice Questions</h2>
                  <div className="space-y-3">
                    {newContent.practice_questions.map((q, i) => (
                      <div key={i} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm text-gray-800 font-medium">{i + 1}. {q.question}</p>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {q.difficulty && (
                              <span className={`text-xs px-1.5 py-0.5 rounded capitalize ${
                                q.difficulty === "foundation" ? "bg-green-50 text-green-700" :
                                q.difficulty === "extension" ? "bg-purple-50 text-purple-700" :
                                "bg-blue-50 text-blue-700"
                              }`}>{q.difficulty}</span>
                            )}
                            {q.marks && (
                              <span className="text-xs text-gray-400">{q.marks}m</span>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Answer: {q.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Key vocabulary */}
              {newContent.key_vocabulary && newContent.key_vocabulary.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
                  <h2 className="font-semibold text-gray-900 mb-3">Key Vocabulary</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {newContent.key_vocabulary.map((v, i) => (
                      <div key={i} className="bg-blue-50 rounded-lg p-3">
                        <p className="text-sm font-semibold text-blue-800">{v.term}</p>
                        <p className="text-xs text-blue-700 mt-0.5">{v.definition}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Differentiation */}
              {newContent.differentiation && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
                  <h2 className="font-semibold text-gray-900 mb-4">Differentiation</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(["support", "core", "extension"] as const).map((level) => {
                      const text = newContent.differentiation?.[level];
                      if (!text) return null;
                      return (
                        <div key={level} className="border border-gray-100 rounded-lg p-3">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 capitalize">{level}</p>
                          <p className="text-sm text-gray-700">{text}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Assessment criteria */}
              {newContent.assessment_criteria && newContent.assessment_criteria.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
                  <h2 className="font-semibold text-gray-900 mb-2">Assessment Criteria</h2>
                  <ul className="space-y-1">
                    {newContent.assessment_criteria.map((c, i) => (
                      <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">✓</span> {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Homework */}
              {newContent.homework && (newContent.homework.task || newContent.homework.instructions) && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
                  <h2 className="font-semibold text-gray-900 mb-2">Homework</h2>
                  {newContent.homework.task && (
                    <p className="font-medium text-sm text-gray-800">{newContent.homework.task}</p>
                  )}
                  {newContent.homework.instructions && (
                    <p className="text-sm text-gray-600 mt-1">{newContent.homework.instructions}</p>
                  )}
                  {newContent.homework.estimated_time_mins && (
                    <p className="text-xs text-gray-400 mt-1">
                      Estimated time: {newContent.homework.estimated_time_mins} min
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          {/* ── LEGACY SCHEMA rendering ── */}
          {legacy && (
            <>
              {legacy.success_criteria && legacy.success_criteria.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
                  <h2 className="font-semibold text-gray-900 mb-2">Success Criteria</h2>
                  <ul className="space-y-1">
                    {legacy.success_criteria.map((sc, i) => (
                      <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">✓</span> {sc}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {[
                {
                  title: "Prior Knowledge Check",
                  content: legacy.prior_knowledge_check?.questions?.length ? (
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                      {legacy.prior_knowledge_check.questions.map((q, i) => <li key={i}>{q}</li>)}
                    </ul>
                  ) : null,
                },
                {
                  title: "Starter Activity",
                  content: legacy.starter_activity ? (
                    <div className="space-y-2 text-sm text-gray-700">
                      <p className="font-medium">{legacy.starter_activity.title}</p>
                      <p>{legacy.starter_activity.description}</p>
                    </div>
                  ) : null,
                },
                {
                  title: "Teacher Explanation",
                  content: legacy.teacher_explanation ? (
                    <div className="space-y-3 text-sm text-gray-700">
                      {legacy.teacher_explanation.outline?.length ? (
                        <ul className="list-disc list-inside space-y-1">
                          {legacy.teacher_explanation.outline.map((pt, i) => <li key={i}>{pt}</li>)}
                        </ul>
                      ) : null}
                      {legacy.teacher_explanation.key_vocabulary?.length ? (
                        <div className="flex flex-wrap gap-1">
                          {legacy.teacher_explanation.key_vocabulary.map((v, i) => (
                            <span key={i} className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded">{v}</span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : null,
                },
                {
                  title: "Worked Examples",
                  content: legacy.worked_examples?.length ? (
                    <div className="space-y-4">
                      {legacy.worked_examples.map((ex, i) => (
                        <div key={i} className="border-l-2 border-brand-200 pl-4">
                          <p className="font-medium text-sm text-gray-800">Problem: {ex.problem}</p>
                          <ol className="mt-2 space-y-1 list-decimal list-inside text-sm text-gray-700">
                            {ex.solution_steps?.map((step, j) => <li key={j}>{step}</li>)}
                          </ol>
                        </div>
                      ))}
                    </div>
                  ) : null,
                },
                {
                  title: "Guided Practice",
                  content: legacy.guided_practice?.tasks?.length ? (
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                      {legacy.guided_practice.tasks.map((t, i) => <li key={i}>{t}</li>)}
                    </ul>
                  ) : null,
                },
                {
                  title: "Independent Tasks",
                  content: legacy.independent_tasks?.tasks?.length ? (
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                      {legacy.independent_tasks.tasks.map((t, i) => <li key={i}>{t}</li>)}
                    </ul>
                  ) : null,
                },
              ].map(({ title, content: sc }) =>
                sc ? (
                  <div key={title} className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
                    <h2 className="font-semibold text-gray-900 mb-3">{title}</h2>
                    {sc}
                  </div>
                ) : null
              )}

              {legacy.misconceptions?.length ? (
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
                  <h2 className="font-semibold text-gray-900 mb-3">Watch for These Misconceptions</h2>
                  <div className="space-y-3">
                    {legacy.misconceptions.map((m, i) => (
                      <div key={i} className="bg-amber-50 rounded-lg p-3">
                        <p className="text-sm font-medium text-amber-800">{m.misconception}</p>
                        <p className="text-xs text-amber-700 mt-1">{m.how_to_address}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {legacy.homework_suggestion && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
                  <h2 className="font-semibold text-gray-900 mb-2">Homework Suggestion</h2>
                  <p className="font-medium text-sm text-gray-800">{legacy.homework_suggestion.title}</p>
                  <p className="text-sm text-gray-600 mt-1">{legacy.homework_suggestion.description}</p>
                </div>
              )}

              {legacy.parent_summary_draft && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 mb-4">
                  <h2 className="font-semibold text-blue-900 mb-2">Parent Summary Draft</h2>
                  <p className="text-xs text-blue-600 mb-2">AI-drafted — review before use.</p>
                  <p className="text-sm text-blue-800">{legacy.parent_summary_draft}</p>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
