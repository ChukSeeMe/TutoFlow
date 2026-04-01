"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { reflectionsApi } from "@/lib/api";
import { CheckCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const schema = z.object({
  confidence_before: z.number().min(1).max(5).optional(),
  confidence_after: z.number().min(1).max(5).optional(),
  found_hard: z.string().optional(),
  what_helped: z.string().optional(),
  what_next: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const CONFIDENCE_LABELS: Record<number, string> = {
  1: "Very unsure",
  2: "Unsure",
  3: "Okay",
  4: "Confident",
  5: "Very confident",
};

function ConfidenceSelector({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | undefined;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-2">{label}</p>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={cn(
              "flex-1 py-3 rounded-xl text-sm font-medium border transition-all",
              value === n
                ? "bg-brand-600 text-white border-brand-600"
                : "bg-white text-gray-600 border-gray-300 hover:border-brand-400"
            )}
          >
            <div className="text-lg mb-0.5">{n}</div>
            <div className="text-[10px] leading-tight opacity-80">
              {CONFIDENCE_LABELS[n]}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ReflectPage() {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const [confidenceBefore, setConfidenceBefore] = useState<number | undefined>();
  const [confidenceAfter, setConfidenceAfter] = useState<number | undefined>();
  const [apiError, setApiError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setApiError(null);
    try {
      await reflectionsApi.create({
        confidence_before: confidenceBefore,
        confidence_after: confidenceAfter,
        found_hard: data.found_hard || undefined,
        what_helped: data.what_helped || undefined,
        what_next: data.what_next || undefined,
      });
      setSubmitted(true);
    } catch {
      setApiError("Could not save your reflection. Please try again.");
    }
  }

  if (submitted) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="h-14 w-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-7 w-7 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Reflection saved!</h2>
          <p className="text-gray-500 text-sm mb-6">
            Your tutor can see this. Thank you for taking the time to reflect.
          </p>
          <Link
            href="/student/dashboard"
            className="bg-brand-600 text-white text-sm font-medium px-6 py-2.5 rounded-lg hover:bg-brand-700 transition-colors"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <Link
        href="/student/dashboard"
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Back to dashboard
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">How did it go?</h1>
      <p className="text-sm text-gray-500 mb-6">
        Take a moment to reflect on your last lesson. Your answers help your tutor understand how to help you best.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-5">
          <ConfidenceSelector
            label="How confident were you BEFORE the session?"
            value={confidenceBefore}
            onChange={setConfidenceBefore}
          />
          <ConfidenceSelector
            label="How confident do you feel NOW?"
            value={confidenceAfter}
            onChange={setConfidenceAfter}
          />
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              What did you find hard?
            </label>
            <textarea
              {...register("found_hard")}
              rows={2}
              placeholder="e.g. I found it hard to remember which formula to use..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              What helped you most?
            </label>
            <textarea
              {...register("what_helped")}
              rows={2}
              placeholder="e.g. The worked example really helped me understand the steps..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              What do you want to work on next?
            </label>
            <textarea
              {...register("what_next")}
              rows={2}
              placeholder="e.g. I want to practise more questions on trigonometry..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
            />
          </div>
        </div>

        {apiError && (
          <p className="text-sm text-red-600">{apiError}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-brand-600 text-white text-sm font-medium py-3 rounded-xl hover:bg-brand-700 disabled:opacity-50 transition-colors"
        >
          {isSubmitting ? "Saving..." : "Save reflection"}
        </button>
      </form>
    </div>
  );
}
