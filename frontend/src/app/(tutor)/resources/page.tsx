"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { curriculumApi, resourcesApi } from "@/lib/api";
import type { Subject, Topic } from "@/types";
import {
  Copy, Download, Loader2, Wand2, ChevronDown, FileText,
  BookOpen, ClipboardList, Layers, BookMarked, LayoutGrid, Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

const RESOURCE_TYPES = [
  { value: "worksheet",           label: "Worksheet",                   icon: FileText,      desc: "Structured practice questions" },
  { value: "retrieval_quiz",      label: "Retrieval Quiz",              icon: ClipboardList, desc: "Low-stakes recall questions" },
  { value: "revision_card",       label: "Revision Card",               icon: BookOpen,      desc: "Compact summary for revision" },
  { value: "worked_example",      label: "Worked Example",              icon: Layers,        desc: "Step-by-step model solution" },
  { value: "homework",            label: "Homework Sheet",              icon: BookMarked,    desc: "Independent practice task" },
  { value: "differentiated_task", label: "Differentiated Task (3 lvls)", icon: LayoutGrid,  desc: "Foundation, Core & Higher versions" },
];

const YEAR_GROUPS  = ["Year 7","Year 8","Year 9","Year 10","Year 11","Year 12","Year 13","Adult"];
const ABILITY_BANDS = ["Foundation","Core","Higher","Extension"];

interface GeneratedResource {
  resource_type: string;
  topic: string;
  subject: string;
  year_group: string;
  ability_band: string;
  content: string;
  generatedAt: string;
}

function SelectInput({ value, onChange, disabled, children }: {
  value: string | number; onChange: (v: string) => void; disabled?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full border border-gray-300 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-[#0f0f17] text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none disabled:opacity-50"
      >
        {children}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
    </div>
  );
}

function ResourceTypeGrid({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {RESOURCE_TYPES.map(({ value: v, label, icon: Icon, desc }) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={cn(
            "flex items-start gap-2 p-3 rounded-xl border text-left transition-all",
            value === v
              ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10"
              : "border-gray-200 dark:border-white/[0.07] hover:border-brand-300 dark:hover:border-brand-500/30 hover:bg-gray-50 dark:hover:bg-white/[0.03]"
          )}
        >
          <Icon className={cn("h-4 w-4 mt-0.5 flex-shrink-0", value === v ? "text-brand-600 dark:text-brand-400" : "text-gray-400 dark:text-zinc-600")} />
          <div>
            <p className={cn("text-xs font-semibold leading-tight", value === v ? "text-brand-700 dark:text-brand-300" : "text-gray-700 dark:text-zinc-300")}>{label}</p>
            <p className="text-[10px] text-gray-400 dark:text-zinc-600 mt-0.5 leading-tight">{desc}</p>
          </div>
        </button>
      ))}
    </div>
  );
}

function RecentBadge({ resource, onLoad }: { resource: GeneratedResource; onLoad: () => void }) {
  return (
    <button
      onClick={onLoad}
      className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-white/[0.06] hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg text-xs text-gray-600 dark:text-zinc-400 transition-colors max-w-full text-left"
    >
      <Clock className="h-3 w-3 flex-shrink-0 text-gray-400 dark:text-zinc-600" />
      <span className="truncate">{resource.topic} — {resource.resource_type.replace("_", " ")}</span>
    </button>
  );
}

export default function ResourceStudioPage() {
  const [selectedSubject, setSelectedSubject] = useState<number | "">("");
  const [selectedTopic, setSelectedTopic] = useState<number | "">("");
  const [resourceType, setResourceType] = useState("worksheet");
  const [yearGroup, setYearGroup] = useState("Year 10");
  const [abilityBand, setAbilityBand] = useState("Core");
  const [context, setContext] = useState("");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<GeneratedResource | null>(null);
  const [history, setHistory] = useState<GeneratedResource[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: ["subjects"],
    queryFn: () => curriculumApi.subjects().then((r) => r.data),
  });

  const { data: topics = [] } = useQuery<Topic[]>({
    queryKey: ["topics", selectedSubject],
    queryFn: () => curriculumApi.topics(selectedSubject as number).then((r) => r.data),
    enabled: !!selectedSubject,
  });

  async function handleGenerate() {
    if (!selectedTopic) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await resourcesApi.generate({
        topic_id: selectedTopic,
        resource_type: resourceType,
        year_group: yearGroup,
        ability_band: abilityBand,
        context: context || undefined,
      });
      const generated: GeneratedResource = {
        ...res.data,
        generatedAt: new Date().toISOString(),
      };
      setResult(generated);
      setHistory((prev) => [generated, ...prev].slice(0, 5));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
        ?? "Generation failed. Check your API key is configured.";
      setError(msg);
    } finally {
      setGenerating(false);
    }
  }

  function handleCopy() {
    if (!result) return;
    navigator.clipboard.writeText(result.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    if (!result) return;
    const blob = new Blob([result.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${result.resource_type}_${result.topic.replace(/\s+/g, "_")}_${result.year_group.replace(" ", "")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const canGenerate = !!selectedTopic && !generating;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-7 w-7 rounded-lg bg-brand-gradient flex items-center justify-center">
            <Wand2 className="h-4 w-4 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">Resource Studio</h1>
        </div>
        <p className="text-sm text-gray-500 dark:text-zinc-500">
          AI-generated teaching resources — differentiated, curriculum-aligned. Always review before use.
        </p>
      </div>

      {/* Recent history */}
      {history.length > 0 && (
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <span className="text-xs text-gray-400 dark:text-zinc-600">Recent:</span>
          {history.map((r, i) => (
            <RecentBadge key={i} resource={r} onLoad={() => setResult(r)} />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Config panel */}
        <div className="bg-white dark:bg-[#16161f] border border-gray-200 dark:border-white/[0.07] rounded-xl p-5 space-y-5">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-zinc-300">Resource type</h2>
          <ResourceTypeGrid value={resourceType} onChange={setResourceType} />

          <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-white/[0.05]">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1.5">Subject</label>
              <SelectInput
                value={selectedSubject}
                onChange={(v) => { setSelectedSubject(Number(v) || ""); setSelectedTopic(""); }}
              >
                <option value="">Select subject…</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </SelectInput>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1.5">Topic</label>
              <SelectInput value={selectedTopic} onChange={(v) => setSelectedTopic(Number(v) || "")} disabled={!selectedSubject}>
                <option value="">Select topic…</option>
                {topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </SelectInput>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1.5">Year group</label>
                <SelectInput value={yearGroup} onChange={setYearGroup}>
                  {YEAR_GROUPS.map((y) => <option key={y} value={y}>{y}</option>)}
                </SelectInput>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1.5">Ability</label>
                <SelectInput value={abilityBand} onChange={setAbilityBand}>
                  {ABILITY_BANDS.map((b) => <option key={b} value={b}>{b}</option>)}
                </SelectInput>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1.5">
                Extra context <span className="text-gray-400 dark:text-zinc-600">(optional)</span>
              </label>
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="e.g. student has dyslexia, prefers visual examples…"
                rows={2}
                className="w-full border border-gray-300 dark:border-white/10 rounded-xl px-3 py-2 text-sm bg-white dark:bg-[#0f0f17] text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              />
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
          >
            {generating
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</>
              : <><Wand2 className="h-4 w-4" /> Generate Resource</>
            }
          </button>
        </div>

        {/* Output panel */}
        <div className="lg:col-span-2 bg-white dark:bg-[#16161f] border border-gray-200 dark:border-white/[0.07] rounded-xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-700 dark:text-zinc-300">Generated resource</h2>
              {result && (
                <p className="text-xs text-gray-400 dark:text-zinc-600 mt-0.5">
                  {result.topic} · {result.year_group} · {result.ability_band}
                </p>
              )}
            </div>
            {result && (
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 border border-gray-300 dark:border-white/10 rounded-lg px-3 py-1.5 transition-colors"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copied ? "Copied!" : "Copy"}
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 border border-gray-300 dark:border-white/10 rounded-lg px-3 py-1.5 transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  .txt
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-4 text-sm text-red-700 dark:text-red-400 mb-4">
              {error}
            </div>
          )}

          {!result && !generating && !error && (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-16 text-gray-400 dark:text-zinc-600">
              <Wand2 className="h-10 w-10 mb-3 opacity-20" />
              <p className="text-sm">Configure your resource and click Generate.</p>
              <p className="text-xs mt-1 opacity-70">Generation takes 15–30 seconds.</p>
            </div>
          )}

          {generating && (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-brand-500 mb-3" />
              <p className="text-sm text-gray-500 dark:text-zinc-500">Generating resource…</p>
              <p className="text-xs text-gray-400 dark:text-zinc-600 mt-1">This may take 15–30 seconds</p>
            </div>
          )}

          {result && !generating && (
            <div className="flex-1 flex flex-col">
              <pre className="text-sm text-gray-800 dark:text-zinc-200 whitespace-pre-wrap font-mono leading-relaxed bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.04] rounded-xl p-4 overflow-auto flex-1 max-h-[600px]">
                {result.content}
              </pre>
              <p className="text-xs text-gray-400 dark:text-zinc-600 mt-3">
                AI-generated draft. Review all content for accuracy before sharing with students.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
