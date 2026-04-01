"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { studentsApi } from "@/lib/api";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Brain, Lightbulb, Save, ChevronDown, ChevronUp,
  BookOpen, Eye, Zap, MessageSquare, Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AiStrategy {
  category: string;
  strategy: string;
  rationale: string;
  source: string;
}

interface SendProfile {
  student_id: number;
  send_notes: string | null;
  support_strategies: string | null;
  preferred_scaffolds: string | null;
  literacy_notes: string | null;
  communication_preferences: string | null;
  additional_considerations: Record<string, string> | null;
  ai_strategies: AiStrategy[];
}

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "Literacy Support": BookOpen,
  "Literacy": BookOpen,
  "Attention & Focus": Zap,
  "Communication & Routine": MessageSquare,
  "Sensory": Eye,
  "Scaffolding": Lightbulb,
  "General": Shield,
};

function StrategyCard({ strategy }: { strategy: AiStrategy }) {
  const [open, setOpen] = useState(false);
  const Icon = CATEGORY_ICONS[strategy.category] ?? Lightbulb;

  return (
    <div className="border border-gray-200 dark:border-white/[0.07] rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors"
      >
        <div className="h-8 w-8 rounded-lg bg-brand-50 dark:bg-brand-500/15 text-brand-600 dark:text-brand-400 flex items-center justify-center flex-shrink-0">
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-semibold text-brand-700 dark:text-brand-400 uppercase tracking-wide">
            {strategy.category}
          </span>
          <p className="text-sm text-gray-800 dark:text-zinc-200 mt-0.5 leading-snug">{strategy.strategy}</p>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-4 pb-3 pt-1 bg-gray-50 dark:bg-white/[0.02] border-t border-gray-100 dark:border-white/[0.04]">
          <p className="text-xs text-gray-500 dark:text-zinc-500 mb-1">
            <span className="font-medium">Why:</span> {strategy.rationale}
          </p>
          <p className="text-xs text-gray-400 dark:text-zinc-600">
            <span className="font-medium">Source:</span> {strategy.source}
          </p>
        </div>
      )}
    </div>
  );
}

function TextArea({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        placeholder={placeholder}
        className="w-full border border-gray-300 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-[#0f0f17] text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
      />
    </div>
  );
}

export default function SendPage() {
  const { id } = useParams<{ id: string }>();
  const studentId = Number(id);
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery<SendProfile>({
    queryKey: ["send", studentId],
    queryFn: () => studentsApi.getSend(studentId).then((r) => r.data),
  });

  const [form, setForm] = useState({
    send_notes: "",
    support_strategies: "",
    preferred_scaffolds: "",
    literacy_notes: "",
    communication_preferences: "",
  });
  const [initialised, setInitialised] = useState(false);
  const [saved, setSaved] = useState(false);

  if (profile && !initialised) {
    setForm({
      send_notes: profile.send_notes ?? "",
      support_strategies: profile.support_strategies ?? "",
      preferred_scaffolds: profile.preferred_scaffolds ?? "",
      literacy_notes: profile.literacy_notes ?? "",
      communication_preferences: profile.communication_preferences ?? "",
    });
    setInitialised(true);
  }

  const saveMutation = useMutation({
    mutationFn: () => studentsApi.updateSend(studentId, {
      send_notes: form.send_notes || null,
      support_strategies: form.support_strategies || null,
      preferred_scaffolds: form.preferred_scaffolds || null,
      literacy_notes: form.literacy_notes || null,
      communication_preferences: form.communication_preferences || null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["send", studentId] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href={`/students/${studentId}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-zinc-500 hover:text-gray-800 dark:hover:text-zinc-200 mb-3">
          <ArrowLeft className="h-4 w-4" /> Back to profile
        </Link>
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-brand-gradient flex items-center justify-center">
            <Brain className="h-4 w-4 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">SEND & Support Notes</h1>
        </div>
        <p className="text-sm text-gray-500 dark:text-zinc-500 mt-1">
          Record support needs and get AI-generated teaching strategies based on the student&apos;s profile.
        </p>
      </div>

      {isLoading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-white dark:bg-[#16161f] rounded-xl border border-gray-200 dark:border-white/[0.07] animate-pulse" />)}
        </div>
      )}

      {!isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Notes form */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-[#16161f] rounded-xl border border-gray-200 dark:border-white/[0.07] p-5">
              <h2 className="font-semibold text-gray-900 dark:text-zinc-100 mb-4">Support Profile</h2>
              <div className="space-y-4">
                <TextArea
                  label="SEND Notes"
                  value={form.send_notes}
                  onChange={(v) => setForm({ ...form, send_notes: v })}
                  placeholder="e.g. Diagnosed ADHD, attends CAMHS. Struggles with sustained attention beyond 15 minutes..."
                />
                <TextArea
                  label="Support Strategies"
                  value={form.support_strategies}
                  onChange={(v) => setForm({ ...form, support_strategies: v })}
                  placeholder="e.g. Regular check-ins, chunked tasks, verbal processing..."
                />
                <TextArea
                  label="Preferred Scaffolds"
                  value={form.preferred_scaffolds}
                  onChange={(v) => setForm({ ...form, preferred_scaffolds: v })}
                  placeholder="e.g. Worked examples, visual diagrams, oral response..."
                />
                <TextArea
                  label="Literacy Notes"
                  value={form.literacy_notes}
                  onChange={(v) => setForm({ ...form, literacy_notes: v })}
                  placeholder="e.g. Dyslexia diagnosis, phonics gaps, reluctant reader..."
                />
                <TextArea
                  label="Communication Preferences"
                  value={form.communication_preferences}
                  onChange={(v) => setForm({ ...form, communication_preferences: v })}
                  placeholder="e.g. Prefers direct questions, needs processing time, avoids cold-calling..."
                />
              </div>

              <div className="flex items-center gap-3 mt-5">
                <button
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <Save className="h-4 w-4" />
                  {saveMutation.isPending ? "Saving…" : "Save notes"}
                </button>
                {saved && <span className="text-sm text-green-600 dark:text-green-400 font-medium">Saved</span>}
              </div>
            </div>
          </div>

          {/* AI Strategies panel */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Lightbulb className="h-4 w-4 text-brand-500" />
              <h2 className="font-semibold text-gray-900 dark:text-zinc-100">AI Strategy Suggestions</h2>
              <span className="text-xs text-gray-400 dark:text-zinc-600 ml-auto">Rule-based · Explainable</span>
            </div>

            {profile?.ai_strategies.length === 0 && (
              <div className="bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.07] rounded-xl p-6 text-center">
                <Lightbulb className="h-8 w-8 text-gray-300 dark:text-zinc-700 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-zinc-500">
                  Add SEND notes to generate strategy suggestions.
                </p>
                <p className="text-xs text-gray-400 dark:text-zinc-600 mt-1">
                  Strategies are generated from keywords in the notes above.
                </p>
              </div>
            )}

            {profile?.ai_strategies.map((s, i) => (
              <StrategyCard key={i} strategy={s} />
            ))}

            <p className="text-xs text-gray-400 dark:text-zinc-600 pt-1">
              Strategies update when you save new notes. All suggestions require your professional judgment.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
