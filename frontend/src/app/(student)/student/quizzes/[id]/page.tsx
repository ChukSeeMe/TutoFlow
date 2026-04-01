"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { studentPortalApi } from "@/lib/api";
import type { QuizQuestion } from "@/types";
import { CheckCircle, XCircle, ChevronRight, RotateCcw } from "lucide-react";

interface AssessmentData {
  id: number;
  title?: string;
  topic_name?: string;
  subject_name?: string;
  questions: QuizQuestion[];
}

type AnswerMap = Record<number, string>;

function QuestionCard({
  question,
  index,
  answer,
  onChange,
  submitted,
}: {
  question: QuizQuestion;
  index: number;
  answer: string;
  onChange: (val: string) => void;
  submitted: boolean;
}) {
  const isCorrect = submitted && answer.trim().toLowerCase() === question.answer.trim().toLowerCase();
  const isWrong = submitted && !isCorrect;

  return (
    <div className={`bg-white rounded-xl border p-5 transition-colors ${
      submitted ? (isCorrect ? "border-green-300" : "border-red-200") : "border-gray-200"
    }`}>
      <div className="flex items-start gap-3 mb-4">
        <span className="flex-shrink-0 h-6 w-6 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center">
          {index + 1}
        </span>
        <p className="text-sm font-medium text-gray-900">{question.question}</p>
      </div>

      {question.question_type === "mcq" && question.options ? (
        <div className="space-y-2 ml-9">
          {question.options.map((opt) => {
            const selected = answer === opt;
            const correct = submitted && opt.trim().toLowerCase() === question.answer.trim().toLowerCase();
            return (
              <label
                key={opt}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  submitted
                    ? correct
                      ? "border-green-400 bg-green-50"
                      : selected
                      ? "border-red-300 bg-red-50"
                      : "border-gray-100 bg-gray-50"
                    : selected
                    ? "border-brand-400 bg-brand-50"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name={`q-${index}`}
                  value={opt}
                  checked={selected}
                  onChange={() => !submitted && onChange(opt)}
                  disabled={submitted}
                  className="sr-only"
                />
                <div className={`h-4 w-4 rounded-full border-2 flex-shrink-0 ${
                  selected ? "border-brand-500 bg-brand-500" : "border-gray-300"
                }`} />
                <span className="text-sm text-gray-700">{opt}</span>
                {submitted && correct && <CheckCircle className="h-4 w-4 text-green-500 ml-auto flex-shrink-0" />}
                {submitted && selected && !correct && <XCircle className="h-4 w-4 text-red-400 ml-auto flex-shrink-0" />}
              </label>
            );
          })}
        </div>
      ) : question.question_type === "true_false" ? (
        <div className="flex gap-3 ml-9">
          {["True", "False"].map((opt) => {
            const selected = answer === opt;
            const correct = submitted && opt.toLowerCase() === question.answer.trim().toLowerCase();
            return (
              <button
                key={opt}
                type="button"
                onClick={() => !submitted && onChange(opt)}
                disabled={submitted}
                className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                  submitted
                    ? correct
                      ? "border-green-400 bg-green-50 text-green-700"
                      : selected
                      ? "border-red-300 bg-red-50 text-red-600"
                      : "border-gray-200 text-gray-400"
                    : selected
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-gray-200 hover:bg-gray-50 text-gray-700"
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="ml-9">
          <input
            type="text"
            value={answer}
            onChange={(e) => !submitted && onChange(e.target.value)}
            disabled={submitted}
            placeholder="Type your answer..."
            className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 ${
              submitted
                ? isCorrect
                  ? "border-green-400 bg-green-50"
                  : "border-red-300 bg-red-50"
                : "border-gray-300"
            }`}
          />
        </div>
      )}

      {submitted && (
        <div className={`ml-9 mt-3 flex items-start gap-2 ${isCorrect ? "text-green-700" : "text-red-600"}`}>
          {isCorrect ? <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" /> : <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />}
          <div>
            {!isCorrect && (
              <p className="text-xs font-medium">Correct answer: <span className="font-semibold">{question.answer}</span></p>
            )}
            {question.explanation && (
              <p className="text-xs mt-0.5 opacity-80">{question.explanation}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function QuizPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  const { data: assessment, isLoading, error } = useQuery<AssessmentData>({
    queryKey: ["student-assessment", id],
    queryFn: () => studentPortalApi.getAssessment(Number(id)).then((r) => r.data),
  });

  const submitMutation = useMutation({
    mutationFn: (data: { answers: Record<string, string> }) =>
      studentPortalApi.submitAttempt(Number(id), data),
    onSuccess: (res) => {
      setScore(res.data.percentage_score ?? null);
      setSubmitted(true);
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse w-64" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-white rounded-xl border border-gray-200 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 py-12 text-center">
        <p className="text-gray-500">Quiz not found or no longer available.</p>
      </div>
    );
  }

  const questions = assessment.questions ?? [];
  const allAnswered = questions.every((_, i) => (answers[i] ?? "").trim().length > 0);

  function handleSubmit() {
    const answersPayload: Record<string, string> = {};
    questions.forEach((_, i) => {
      answersPayload[String(i)] = answers[i] ?? "";
    });
    submitMutation.mutate({ answers: answersPayload });
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {assessment.title ?? assessment.topic_name ?? "Quiz"}
        </h1>
        {assessment.subject_name && (
          <p className="text-gray-500 text-sm mt-1">{assessment.subject_name}</p>
        )}
      </div>

      {submitted && score !== null && (
        <div className={`rounded-xl p-5 border ${score >= 75 ? "bg-green-50 border-green-200" : score >= 55 ? "bg-yellow-50 border-yellow-200" : "bg-red-50 border-red-200"}`}>
          <p className={`text-2xl font-bold ${score >= 75 ? "text-green-700" : score >= 55 ? "text-yellow-700" : "text-red-600"}`}>
            {score.toFixed(0)}%
          </p>
          <p className={`text-sm mt-1 ${score >= 75 ? "text-green-700" : score >= 55 ? "text-yellow-700" : "text-red-600"}`}>
            {score >= 75 ? "Great work! You've shown strong understanding of this topic." :
             score >= 55 ? "Good effort — review the topics you found tricky." :
             "Keep practising — have a look at the correct answers below."}
          </p>
        </div>
      )}

      <div className="space-y-4">
        {questions.map((q, i) => (
          <QuestionCard
            key={i}
            question={q}
            index={i}
            answer={answers[i] ?? ""}
            onChange={(val) => setAnswers((prev) => ({ ...prev, [i]: val }))}
            submitted={submitted}
          />
        ))}
      </div>

      {!submitted ? (
        <button
          onClick={handleSubmit}
          disabled={!allAnswered || submitMutation.isPending}
          className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white rounded-xl py-3 font-medium hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {submitMutation.isPending ? "Submitting..." : "Submit answers"}
          <ChevronRight className="h-4 w-4" />
        </button>
      ) : (
        <button
          onClick={() => router.push("/dashboard")}
          className="w-full flex items-center justify-center gap-2 border border-gray-300 text-gray-700 rounded-xl py-3 font-medium hover:bg-gray-50 transition-colors"
        >
          <RotateCcw className="h-4 w-4" />
          Back to dashboard
        </button>
      )}

      {!allAnswered && !submitted && (
        <p className="text-xs text-center text-gray-400">Answer all {questions.length} questions to submit</p>
      )}
    </div>
  );
}
