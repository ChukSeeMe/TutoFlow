"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { analyticsApi } from "@/lib/api";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, CartesianGrid, Legend,
} from "recharts";
import {
  Brain, AlertTriangle, TrendingUp, TrendingDown, Minus,
  Target, GraduationCap, Clock, ChevronRight, ArrowUpDown,
  Sparkles, Loader2, X, BookOpen, Activity, CheckSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StudentInsight {
  student_id: number;
  student_name: string;
  year_group: string | null;
  key_stage: string | null;
  risk_score: number;
  risk_level: "critical" | "at_risk" | "monitoring" | "on_track";
  risk_factors: string[];
  predicted_grade: string;
  weeks_to_target: number | null;
  topics_secure: number;
  total_topics: number;
  attendance_rate: number;
  average_engagement: number | null;
  average_quiz_score: number | null;
  trend: "improving" | "stable" | "declining";
  total_sessions: number;
}

// ── Risk configuration ─────────────────────────────────────────────────────────

const RISK_CONFIG = {
  critical:   { label: "Critical",   bg: "bg-red-50 dark:bg-red-500/10",    border: "border-red-200 dark:border-red-500/30",    badge: "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400",    dot: "bg-red-500",    gauge: "bg-red-500" },
  at_risk:    { label: "At Risk",    bg: "bg-amber-50 dark:bg-amber-500/10", border: "border-amber-200 dark:border-amber-500/30", badge: "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400", dot: "bg-amber-500", gauge: "bg-amber-500" },
  monitoring: { label: "Monitoring", bg: "bg-blue-50 dark:bg-blue-500/10",   border: "border-blue-200 dark:border-blue-500/30",   badge: "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400",   dot: "bg-blue-400",   gauge: "bg-blue-400" },
  on_track:   { label: "On Track",   bg: "bg-green-50 dark:bg-green-500/10", border: "border-green-200 dark:border-green-500/30", badge: "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400", dot: "bg-green-500", gauge: "bg-green-500" },
};

// ── Risk gauge ─────────────────────────────────────────────────────────────────

function RiskGauge({ score, level }: { score: number; level: string }) {
  const cfg = RISK_CONFIG[level as keyof typeof RISK_CONFIG];
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-16 h-9 overflow-hidden">
        <svg viewBox="0 0 64 36" className="w-full h-full">
          <path d="M 4 32 A 28 28 0 0 1 60 32" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" className="text-gray-200 dark:text-white/10" />
          <path
            d="M 4 32 A 28 28 0 0 1 60 32"
            fill="none"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${(score / 100) * 87.96} 87.96`}
            className={cn(
              "transition-all duration-700",
              level === "critical" ? "stroke-red-500" :
              level === "at_risk" ? "stroke-amber-500" :
              level === "monitoring" ? "stroke-blue-400" :
              "stroke-green-500"
            )}
          />
        </svg>
        <span className="absolute inset-0 flex items-end justify-center pb-0.5 text-xs font-bold text-gray-700 dark:text-zinc-200">
          {score}
        </span>
      </div>
      <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", cfg.badge)}>
        {cfg.label}
      </span>
    </div>
  );
}

// ── Trend icon ─────────────────────────────────────────────────────────────────

function TrendIcon({ trend }: { trend: string }) {
  if (trend === "improving") return <TrendingUp className="h-3.5 w-3.5 text-green-500" />;
  if (trend === "declining") return <TrendingDown className="h-3.5 w-3.5 text-red-500" />;
  return <Minus className="h-3.5 w-3.5 text-gray-400 dark:text-zinc-600" />;
}

// ── Mastery bar ────────────────────────────────────────────────────────────────

function MasteryBar({ secure, total }: { secure: number; total: number }) {
  const pct = total > 0 ? Math.round((secure / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-[10px] text-gray-400 dark:text-zinc-600 mb-1">
        <span>{secure}/{total} topics secure</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 bg-gray-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
        <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ── Student radar chart ────────────────────────────────────────────────────────

function StudentRadar({ insight }: { insight: StudentInsight }) {
  const radarData = [
    { subject: "Attendance", value: Math.round(insight.attendance_rate * 100) },
    { subject: "Engagement", value: insight.average_engagement ? Math.round((insight.average_engagement / 5) * 100) : 0 },
    { subject: "Quiz Score", value: insight.average_quiz_score ? Math.round(insight.average_quiz_score) : 0 },
    { subject: "Mastery", value: insight.total_topics > 0 ? Math.round((insight.topics_secure / insight.total_topics) * 100) : 0 },
    { subject: "Progress", value: Math.max(0, 100 - insight.risk_score) },
  ];

  return (
    <ResponsiveContainer width="100%" height={200}>
      <RadarChart data={radarData} margin={{ top: 8, right: 16, bottom: 8, left: 16 }}>
        <PolarGrid stroke="#e5e7eb" />
        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "#6b7280" }} />
        <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
        <Radar
          name="Student"
          dataKey="value"
          stroke="#1c660c"
          fill="#1c660c"
          fillOpacity={0.18}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}

// ── AI Advice Panel ────────────────────────────────────────────────────────────

function AIAdvicePanel({ studentId, studentName }: { studentId: number; studentName: string }) {
  const [advice, setAdvice] = useState<string | null>(null);

  const { mutate, isPending, isError } = useMutation({
    mutationFn: () => analyticsApi.aiAdvice(studentId).then((r) => r.data.advice),
    onSuccess: (data) => setAdvice(data),
  });

  return (
    <div className="border border-brand-200 dark:border-brand-500/20 bg-brand-50 dark:bg-brand-500/5 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-brand-700 dark:text-brand-400 uppercase tracking-wide flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5" /> AI Teaching Advice
        </p>
        {!advice && (
          <button
            onClick={() => mutate()}
            disabled={isPending}
            className="flex items-center gap-1.5 text-xs bg-brand-600 text-white px-3 py-1.5 rounded-lg hover:bg-brand-700 disabled:opacity-60"
          >
            {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            {isPending ? "Generating…" : "Get AI advice"}
          </button>
        )}
        {advice && (
          <button onClick={() => setAdvice(null)} className="text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isError && (
        <p className="text-xs text-red-600">Failed to generate advice. Check AI configuration.</p>
      )}

      {!advice && !isPending && !isError && (
        <p className="text-xs text-brand-600 dark:text-brand-400 opacity-70">
          Click "Get AI advice" to generate personalised teaching strategies for {studentName.split(" ")[0]}.
        </p>
      )}

      {isPending && (
        <div className="flex items-center gap-2 text-xs text-brand-600 dark:text-brand-400">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Analysing student data and generating suggestions…
        </div>
      )}

      {advice && (
        <div className="text-sm text-gray-700 dark:text-zinc-300 whitespace-pre-line leading-relaxed">
          {advice}
        </div>
      )}
    </div>
  );
}

// ── Behavior & learning breakdown ──────────────────────────────────────────────

function BehaviorBreakdown({ insight }: { insight: StudentInsight }) {
  const attendance = Math.round(insight.attendance_rate * 100);
  const engagement = insight.average_engagement
    ? Math.round((insight.average_engagement / 5) * 100)
    : null;
  const homeworkCompletion = null; // placeholder — could be derived from analytics

  const bars = [
    {
      label: "Attendance",
      value: attendance,
      icon: <Activity className="h-3.5 w-3.5" />,
      color: attendance >= 85 ? "bg-green-500" : attendance >= 70 ? "bg-amber-500" : "bg-red-500",
    },
    {
      label: "Engagement",
      value: engagement,
      icon: <Brain className="h-3.5 w-3.5" />,
      color: engagement == null ? "bg-gray-200" : engagement >= 60 ? "bg-brand-500" : engagement >= 40 ? "bg-amber-500" : "bg-red-500",
    },
    {
      label: "Quiz Avg",
      value: insight.average_quiz_score ? Math.round(insight.average_quiz_score) : null,
      icon: <BookOpen className="h-3.5 w-3.5" />,
      color: !insight.average_quiz_score ? "bg-gray-200"
        : insight.average_quiz_score >= 70 ? "bg-green-500"
        : insight.average_quiz_score >= 50 ? "bg-amber-500"
        : "bg-red-500",
    },
    {
      label: "Mastery",
      value: insight.total_topics > 0
        ? Math.round((insight.topics_secure / insight.total_topics) * 100)
        : null,
      icon: <CheckSquare className="h-3.5 w-3.5" />,
      color: "bg-brand-500",
    },
  ];

  return (
    <div className="space-y-2.5">
      {bars.map(({ label, value, icon, color }) => (
        <div key={label} className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 w-24 flex-shrink-0 text-xs text-gray-500 dark:text-zinc-500">
            {icon} {label}
          </div>
          <div className="flex-1 h-2 bg-gray-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", color)}
              style={{ width: `${value ?? 0}%` }}
            />
          </div>
          <span className="text-xs font-medium text-gray-700 dark:text-zinc-300 w-8 text-right">
            {value != null ? `${value}%` : "—"}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Student insight card ───────────────────────────────────────────────────────

function InsightCard({ insight }: { insight: StudentInsight }) {
  const cfg = RISK_CONFIG[insight.risk_level];
  const [expanded, setExpanded] = useState(false);
  const [showRadar, setShowRadar] = useState(false);

  return (
    <div className={cn("rounded-xl border overflow-hidden transition-all", cfg.border, "bg-white dark:bg-[#16161f]")}>
      {/* Header row */}
      <div
        className={cn("flex items-center gap-4 px-5 py-4 cursor-pointer hover:opacity-90 transition-opacity", cfg.bg)}
        onClick={() => setExpanded(!expanded)}
      >
        {/* Avatar */}
        <div className="h-10 w-10 rounded-full bg-white dark:bg-[#0f0f17] border border-gray-200 dark:border-white/10 flex items-center justify-center text-sm font-bold text-gray-700 dark:text-zinc-300 flex-shrink-0">
          {insight.student_name.split(" ").map(n => n[0]).join("").slice(0, 2)}
        </div>

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 dark:text-zinc-100 text-sm truncate">{insight.student_name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {insight.year_group && <span className="text-xs text-gray-500 dark:text-zinc-500">{insight.year_group}</span>}
            {insight.key_stage && <span className="text-xs text-gray-400 dark:text-zinc-600">{insight.key_stage}</span>}
            <TrendIcon trend={insight.trend} />
          </div>
        </div>

        {/* Risk gauge */}
        <RiskGauge score={insight.risk_score} level={insight.risk_level} />

        {/* Key metrics */}
        <div className="hidden sm:grid grid-cols-3 gap-3 text-center flex-shrink-0">
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-zinc-100">{insight.predicted_grade}</p>
            <p className="text-[10px] text-gray-400 dark:text-zinc-600 flex items-center gap-0.5 justify-center">
              <GraduationCap className="h-2.5 w-2.5" /> Grade
            </p>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-zinc-100">
              {insight.weeks_to_target !== null ? `${insight.weeks_to_target}w` : "—"}
            </p>
            <p className="text-[10px] text-gray-400 dark:text-zinc-600 flex items-center gap-0.5 justify-center">
              <Target className="h-2.5 w-2.5" /> Target
            </p>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-zinc-100">
              {Math.round(insight.attendance_rate * 100)}%
            </p>
            <p className="text-[10px] text-gray-400 dark:text-zinc-600">Attend.</p>
          </div>
        </div>

        <ChevronRight className={cn("h-4 w-4 text-gray-400 dark:text-zinc-600 flex-shrink-0 transition-transform", expanded && "rotate-90")} />
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-5 pb-5 pt-4 border-t border-gray-100 dark:border-white/[0.04] space-y-4">
          <MasteryBar secure={insight.topics_secure} total={insight.total_topics} />

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Sessions", value: insight.total_sessions },
              { label: "Engagement", value: insight.average_engagement ? `${insight.average_engagement.toFixed(1)}/5` : "—" },
              { label: "Quiz avg", value: insight.average_quiz_score ? `${Math.round(insight.average_quiz_score)}%` : "—" },
              { label: "Predicted", value: insight.predicted_grade },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-50 dark:bg-white/[0.03] rounded-lg p-3 text-center border border-gray-100 dark:border-white/[0.04]">
                <p className="text-sm font-bold text-gray-900 dark:text-zinc-100">{value}</p>
                <p className="text-[10px] text-gray-400 dark:text-zinc-600 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Behavior & Learning breakdown */}
          <div>
            <p className="text-xs font-semibold text-gray-600 dark:text-zinc-400 mb-2 uppercase tracking-wide">
              Behavior & Learning Breakdown
            </p>
            <BehaviorBreakdown insight={insight} />
          </div>

          {/* Toggle: radar chart */}
          <div>
            <button
              onClick={() => setShowRadar(!showRadar)}
              className="text-xs text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
            >
              {showRadar ? "Hide" : "Show"} multi-dimensional profile
            </button>
            {showRadar && (
              <div className="mt-3 border border-gray-100 dark:border-white/[0.06] rounded-xl p-2 bg-gray-50 dark:bg-white/[0.02]">
                <StudentRadar insight={insight} />
              </div>
            )}
          </div>

          {/* Risk factors */}
          {insight.risk_factors.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-600 dark:text-zinc-400 mb-2 uppercase tracking-wide">
                Risk factors
              </p>
              <div className="flex flex-wrap gap-2">
                {insight.risk_factors.map((factor, i) => (
                  <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-500/20">
                    {factor}
                  </span>
                ))}
              </div>
            </div>
          )}

          {insight.risk_factors.length === 0 && (
            <p className="text-xs text-green-600 dark:text-green-400 font-medium">
              No risk factors detected — student is performing well.
            </p>
          )}

          {/* Weeks to target */}
          {insight.weeks_to_target !== null && insight.total_topics > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-zinc-400">
              <Clock className="h-4 w-4 text-brand-500 flex-shrink-0" />
              {insight.weeks_to_target === 0
                ? "All tracked topics secure — no remaining time estimate needed."
                : `Estimated ${insight.weeks_to_target} week${insight.weeks_to_target !== 1 ? "s" : ""} to full topic mastery at current pace.`
              }
            </div>
          )}

          {/* AI Advice */}
          <AIAdvicePanel studentId={insight.student_id} studentName={insight.student_name} />

          {/* Actions */}
          <div className="flex items-center gap-3 pt-1">
            <Link
              href={`/students/${insight.student_id}`}
              className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline"
            >
              View profile
            </Link>
            <Link
              href={`/interventions`}
              className="text-xs text-gray-500 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300"
            >
              Interventions
            </Link>
            <Link
              href={`/sessions/new?student=${insight.student_id}`}
              className="text-xs text-gray-500 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300"
            >
              Log session
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Summary strip ──────────────────────────────────────────────────────────────

function SummaryStrip({ insights }: { insights: StudentInsight[] }) {
  const critical = insights.filter(i => i.risk_level === "critical").length;
  const atRisk   = insights.filter(i => i.risk_level === "at_risk").length;
  const onTrack  = insights.filter(i => i.risk_level === "on_track").length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[
        { label: "Total students", value: insights.length, colour: "text-gray-900 dark:text-zinc-100" },
        { label: "Critical",       value: critical,         colour: critical > 0 ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-zinc-100" },
        { label: "At risk",        value: atRisk,           colour: atRisk > 0 ? "text-amber-600 dark:text-amber-400" : "text-gray-900 dark:text-zinc-100" },
        { label: "On track",       value: onTrack,          colour: "text-green-600 dark:text-green-400" },
      ].map(({ label, value, colour }) => (
        <div key={label} className="bg-white dark:bg-[#16161f] border border-gray-200 dark:border-white/[0.07] rounded-xl p-4 text-center">
          <p className={cn("text-2xl font-bold", colour)}>{value}</p>
          <p className="text-xs text-gray-500 dark:text-zinc-500 mt-0.5">{label}</p>
        </div>
      ))}
    </div>
  );
}

// ── Overview charts ────────────────────────────────────────────────────────────

function OverviewCharts({ insights }: { insights: StudentInsight[] }) {
  // Bar chart: quiz avg per student
  const quizData = insights
    .filter(i => i.average_quiz_score != null)
    .map(i => ({
      name: i.student_name.split(" ")[0],
      score: Math.round(i.average_quiz_score!),
      level: i.risk_level,
    }));

  // Scatter-style: attendance vs engagement
  const profileData = insights.map(i => ({
    name: i.student_name.split(" ")[0],
    attendance: Math.round(i.attendance_rate * 100),
    engagement: i.average_engagement ? Math.round((i.average_engagement / 5) * 100) : 0,
    mastery: i.total_topics > 0 ? Math.round((i.topics_secure / i.total_topics) * 100) : 0,
  }));

  const riskColors: Record<string, string> = {
    critical: "#ef4444",
    at_risk: "#f59e0b",
    monitoring: "#60a5fa",
    on_track: "#22c55e",
  };

  if (quizData.length === 0 && profileData.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
      {/* Quiz score bar chart */}
      {quizData.length > 0 && (
        <div className="bg-white dark:bg-[#16161f] border border-gray-200 dark:border-white/[0.07] rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wide mb-3">
            Quiz Score by Student
          </p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={quizData} margin={{ top: 4, right: 8, bottom: 4, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#9ca3af" }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#9ca3af" }} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
                formatter={(v: number) => [`${v}%`, "Score"]}
              />
              <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                {quizData.map((entry, i) => (
                  <Cell key={i} fill={riskColors[entry.level] ?? "#1c660c"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Attendance vs Engagement line */}
      {profileData.length > 0 && (
        <div className="bg-white dark:bg-[#16161f] border border-gray-200 dark:border-white/[0.07] rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wide mb-3">
            Attendance, Engagement & Mastery
          </p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={profileData} margin={{ top: 4, right: 8, bottom: 4, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#9ca3af" }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#9ca3af" }} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
                formatter={(v: number) => [`${v}%`]}
              />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Line type="monotone" dataKey="attendance" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="Attendance" />
              <Line type="monotone" dataKey="engagement" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} name="Engagement" />
              <Line type="monotone" dataKey="mastery" stroke="#1c660c" strokeWidth={2} dot={{ r: 3 }} name="Mastery" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

type SortKey = "risk" | "grade" | "name";

export default function InsightsPage() {
  const [sortKey, setSortKey] = useState<SortKey>("risk");
  const [filter, setFilter] = useState<string>("all");

  const { data: insights = [], isLoading, error } = useQuery<StudentInsight[]>({
    queryKey: ["insights"],
    queryFn: () => analyticsApi.insights().then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const filtered = insights.filter(i =>
    filter === "all" || i.risk_level === filter
  );

  const sorted = [...filtered].sort((a, b) => {
    if (sortKey === "name") return a.student_name.localeCompare(b.student_name);
    if (sortKey === "grade") return a.predicted_grade.localeCompare(b.predicted_grade);
    const levelOrder = { critical: 0, at_risk: 1, monitoring: 2, on_track: 3 };
    const lo = levelOrder[a.risk_level] - levelOrder[b.risk_level];
    if (lo !== 0) return lo;
    return b.risk_score - a.risk_score;
  });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-7 w-7 rounded-lg bg-brand-gradient flex items-center justify-center">
              <Brain className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">AI Insight Engine</h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-zinc-500 max-w-xl">
            Risk scores, predicted grades, behavior breakdown, and AI-generated teaching strategies for every student.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-zinc-600 bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.06] px-3 py-1.5 rounded-lg">
          <AlertTriangle className="h-3.5 w-3.5" />
          Rule-based · Explainable
        </div>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-white dark:bg-[#16161f] rounded-xl border border-gray-200 dark:border-white/[0.07] animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-4 text-red-700 dark:text-red-400 text-sm">
          Failed to load insights. Make sure your students have session data.
        </div>
      )}

      {!isLoading && insights.length > 0 && (
        <>
          <SummaryStrip insights={insights} />

          {/* Overview charts */}
          <div className="mt-5">
            <OverviewCharts insights={insights} />
          </div>

          {/* Filter + Sort toolbar */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="flex gap-1">
              {[
                { key: "all", label: "All" },
                { key: "critical", label: "Critical" },
                { key: "at_risk", label: "At Risk" },
                { key: "monitoring", label: "Monitoring" },
                { key: "on_track", label: "On Track" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                    filter === key
                      ? "bg-brand-600 text-white"
                      : "bg-white dark:bg-[#16161f] border border-gray-200 dark:border-white/[0.07] text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <ArrowUpDown className="h-3.5 w-3.5 text-gray-400 dark:text-zinc-600" />
              <span className="text-xs text-gray-400 dark:text-zinc-600">Sort:</span>
              {([["risk", "Risk"], ["name", "Name"], ["grade", "Grade"]] as [SortKey, string][]).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setSortKey(key)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-medium transition-colors",
                    sortKey === key
                      ? "bg-gray-200 dark:bg-white/10 text-gray-800 dark:text-zinc-200"
                      : "text-gray-500 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-white/[0.04]"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {sorted.map((insight) => (
              <InsightCard key={insight.student_id} insight={insight} />
            ))}
          </div>

          <p className="text-xs text-gray-400 dark:text-zinc-600 text-center mt-6">
            Risk scores update each page load. Grade predictions use quiz averages + topic mastery ratio.
            Expand any card to view behavior breakdown, radar profile, and get AI advice.
          </p>
        </>
      )}

      {!isLoading && !error && insights.length === 0 && (
        <div className="bg-white dark:bg-[#16161f] border border-gray-200 dark:border-white/[0.07] rounded-xl py-16 text-center mt-6">
          <Brain className="h-10 w-10 text-gray-300 dark:text-zinc-700 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-zinc-500 text-sm font-medium">No student data yet</p>
          <p className="text-gray-400 dark:text-zinc-600 text-xs mt-1">
            Add students and log sessions to generate insights.
          </p>
        </div>
      )}
    </div>
  );
}
