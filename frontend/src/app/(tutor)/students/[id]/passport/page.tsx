"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  ArrowLeft, Brain, Heart, AlertTriangle, Lightbulb,
  MessageCircle, Eye, BookOpen, Shield, ExternalLink,
  TrendingUp, Star, Target, CheckCircle2,
} from "lucide-react";
import { studentsApi, observationsApi, analyticsApi, reflectionsApi } from "@/lib/api";
import type { StudentDetail, ObservationNote, StudentAnalytics } from "@/types";
import { getInitials, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

function MasteryBar({ value, max = 100, colour = "brand" }: { value: number; max?: number; colour?: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const colourClass =
    colour === "green" ? "bg-green-500" :
    colour === "amber" ? "bg-amber-400" :
    colour === "red"   ? "bg-red-500"   :
    "bg-brand-500";
  return (
    <div className="w-full h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
      <div className={cn("h-full rounded-full transition-all", colourClass)} style={{ width: `${pct}%` }} />
    </div>
  );
}

function ConfidenceDot({ value }: { value: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1,2,3,4,5].map((i) => (
        <span
          key={i}
          className={cn(
            "h-2.5 w-2.5 rounded-full",
            i <= value ? "bg-brand-500" : "bg-gray-200 dark:bg-white/10"
          )}
        />
      ))}
    </span>
  );
}

function StatCard({ label, value, sub, icon: Icon, colour }: {
  label: string; value: string | number; sub?: string;
  icon: React.ComponentType<{ className?: string }>; colour: string;
}) {
  const bg = colour === "blue" ? "bg-blue-500/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400" :
             colour === "green" ? "bg-green-500/10 dark:bg-green-500/15 text-green-600 dark:text-green-400" :
             colour === "amber" ? "bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400" :
             "bg-brand-500/10 dark:bg-brand-500/15 text-brand-600 dark:text-brand-400";
  return (
    <div className="bg-white dark:bg-[#16161f] border border-gray-200 dark:border-white/[0.07] rounded-xl p-4">
      <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center mb-3", bg)}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-zinc-100">{value}</p>
      <p className="text-xs text-gray-500 dark:text-zinc-500 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-gray-400 dark:text-zinc-600 mt-1">{sub}</p>}
    </div>
  );
}

export default function LearningPassportPage() {
  const { id } = useParams<{ id: string }>();
  const studentId = Number(id);

  const { data: student, isLoading } = useQuery<StudentDetail>({
    queryKey: ["student", studentId],
    queryFn: () => studentsApi.get(studentId).then((r) => r.data),
  });

  const { data: observations = [] } = useQuery<ObservationNote[]>({
    queryKey: ["observations", studentId],
    queryFn: () => observationsApi.list(studentId).then((r) => r.data),
    enabled: !!studentId,
  });

  const { data: analytics } = useQuery<StudentAnalytics>({
    queryKey: ["analytics", studentId],
    queryFn: () => analyticsApi.studentSummary(studentId).then((r) => r.data),
    enabled: !!studentId,
  });

  const { data: reflections = [] } = useQuery({
    queryKey: ["reflections", studentId],
    queryFn: () => reflectionsApi.listForStudent(studentId).then((r) => r.data),
    enabled: !!studentId,
  });

  if (isLoading) return (
    <div className="p-8 flex items-center justify-center text-gray-400 dark:text-zinc-600">
      Loading passport…
    </div>
  );
  if (!student) return (
    <div className="p-8 text-gray-400 dark:text-zinc-600">Student not found.</div>
  );

  const strengths      = observations.filter((o) => o.note_type === "strength");
  const misconceptions = observations.filter((o) => o.note_type === "misconception");
  const flagged        = observations.filter((o) => o.is_flagged);

  const attendancePct  = analytics ? Math.round(analytics.attendance_rate * 100) : null;
  const engagementPct  = analytics?.average_engagement ? Math.round((analytics.average_engagement / 5) * 100) : null;

  const recentReflections = (reflections as Array<{
    id: number; confidence_before?: number; confidence_after?: number;
    found_hard?: string; what_helped?: string; what_next?: string; created_at: string;
  }>).slice(0, 3);

  const hasSend = !!(
    student.send_notes || student.support_strategies ||
    student.preferred_scaffolds || student.literacy_notes ||
    student.communication_preferences
  );

  const sendSections = [
    { title: "SEND Notes",                icon: Shield,        colour: "blue",   field: student.send_notes },
    { title: "Support Strategies",        icon: Lightbulb,     colour: "amber",  field: student.support_strategies },
    { title: "Preferred Scaffolds",       icon: Brain,         colour: "brand",  field: student.preferred_scaffolds },
    { title: "Literacy Notes",            icon: BookOpen,      colour: "green",  field: student.literacy_notes },
    { title: "Communication Prefs",       icon: MessageCircle, colour: "teal",   field: student.communication_preferences },
  ];

  const iconColour: Record<string, string> = {
    blue:   "text-blue-600 dark:text-blue-400",
    amber:  "text-amber-600 dark:text-amber-400",
    brand: "text-brand-600 dark:text-brand-400",
    green:  "text-green-600 dark:text-green-400",
    teal:   "text-teal-600 dark:text-teal-400",
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/students/${studentId}`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-zinc-500 hover:text-gray-800 dark:hover:text-zinc-200 mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to student profile
        </Link>

        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-brand-100 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300 flex items-center justify-center font-bold text-lg flex-shrink-0">
            {getInitials(student.full_name)}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">
              {student.full_name}
              <span className="ml-2 text-lg font-normal text-gray-400 dark:text-zinc-500">— Learning Passport</span>
            </h1>
            <p className="text-sm text-gray-500 dark:text-zinc-500 mt-0.5">
              {[student.year_group, student.key_stage, student.ability_band].filter(Boolean).join(" · ")}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href={`/students/${studentId}/send`}
              className="flex items-center gap-1.5 text-xs text-brand-600 dark:text-brand-400 border border-brand-300 dark:border-brand-500/40 hover:bg-brand-50 dark:hover:bg-brand-500/10 rounded-lg px-3 py-1.5 transition-colors"
            >
              <Shield className="h-3.5 w-3.5" />
              SEND & Support
              <ExternalLink className="h-3 w-3 opacity-60" />
            </Link>
            <Link
              href={`/students/${studentId}/edit`}
              className="text-xs text-brand-600 dark:text-brand-400 border border-brand-300 dark:border-brand-500/40 hover:bg-brand-50 dark:hover:bg-brand-500/10 rounded-lg px-3 py-1.5 transition-colors"
            >
              Edit profile
            </Link>
          </div>
        </div>
      </div>

      {/* Flagged alerts */}
      {flagged.length > 0 && (
        <div className="mb-6 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/25 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-red-500 dark:text-red-400 flex-shrink-0" />
            <span className="text-sm font-semibold text-red-700 dark:text-red-400">
              {flagged.length} Flagged Observation{flagged.length > 1 ? "s" : ""}
            </span>
          </div>
          <ul className="space-y-1 ml-6">
            {flagged.map((note) => (
              <li key={note.id} className="text-sm text-red-600 dark:text-red-400 list-disc">
                {note.content}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Analytics snapshot */}
      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard label="Sessions" value={analytics.total_sessions} icon={Target} colour="blue" />
          <StatCard
            label="Attendance"
            value={attendancePct !== null ? `${attendancePct}%` : "—"}
            icon={CheckCircle2}
            colour={attendancePct !== null && attendancePct >= 80 ? "green" : "amber"}
          />
          <StatCard
            label="Avg Engagement"
            value={analytics.average_engagement ? `${analytics.average_engagement}/5` : "—"}
            icon={Star}
            colour="amber"
          />
          <StatCard
            label="Topics Secure"
            value={analytics.topics_secure}
            icon={TrendingUp}
            colour="green"
          />
        </div>
      )}

      {/* Progress bars */}
      {analytics && (attendancePct !== null || engagementPct !== null) && (
        <div className="bg-white dark:bg-[#16161f] border border-gray-200 dark:border-white/[0.07] rounded-xl p-5 mb-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-zinc-300">Progress Overview</h2>
          {attendancePct !== null && (
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-gray-500 dark:text-zinc-500">Attendance rate</span>
                <span className="text-xs font-semibold text-gray-700 dark:text-zinc-300">{attendancePct}%</span>
              </div>
              <MasteryBar
                value={attendancePct}
                colour={attendancePct >= 80 ? "green" : attendancePct >= 60 ? "amber" : "red"}
              />
            </div>
          )}
          {engagementPct !== null && (
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-gray-500 dark:text-zinc-500">Avg engagement</span>
                <span className="text-xs font-semibold text-gray-700 dark:text-zinc-300">
                  {analytics!.average_engagement}/5
                </span>
              </div>
              <MasteryBar
                value={engagementPct}
                colour={engagementPct >= 70 ? "green" : engagementPct >= 40 ? "amber" : "red"}
              />
            </div>
          )}
          {analytics.topics_secure > 0 && (
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-gray-500 dark:text-zinc-500">Topics secured</span>
                <span className="text-xs font-semibold text-gray-700 dark:text-zinc-300">
                  {analytics.topics_secure} topic{analytics.topics_secure !== 1 ? "s" : ""}
                </span>
              </div>
              <MasteryBar value={Math.min(analytics.topics_secure * 10, 100)} colour="brand" />
            </div>
          )}
        </div>
      )}

      {/* SEND & Support */}
      <div className="bg-white dark:bg-[#16161f] border border-gray-200 dark:border-white/[0.07] rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-zinc-300">SEND & Support Profile</h2>
          {!hasSend && (
            <Link
              href={`/students/${studentId}/send`}
              className="text-xs text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
            >
              Add SEND notes <ExternalLink className="h-3 w-3" />
            </Link>
          )}
        </div>
        <div className="space-y-3">
          {sendSections.map(({ title, icon: Icon, colour, field }) => (
            <div key={title} className="flex gap-3">
              <div className={cn("flex-shrink-0 mt-0.5", iconColour[colour])}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-600 dark:text-zinc-400 mb-0.5">{title}</p>
                {field ? (
                  <p className="text-sm text-gray-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed">{field}</p>
                ) : (
                  <p className="text-sm text-gray-400 dark:text-zinc-600 italic">Not recorded</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Strengths & Misconceptions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-white dark:bg-[#16161f] border border-gray-200 dark:border-white/[0.07] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Heart className="h-4 w-4 text-green-500 dark:text-green-400" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
              Observed Strengths
              <span className="ml-1.5 text-xs font-normal text-gray-400 dark:text-zinc-600">({strengths.length})</span>
            </h3>
          </div>
          {strengths.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-zinc-600 italic">No strengths recorded yet.</p>
          ) : (
            <ul className="space-y-2">
              {strengths.slice(0, 6).map((note) => (
                <li key={note.id} className="flex gap-2 text-sm text-gray-700 dark:text-zinc-300">
                  <span className="text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5">✓</span>
                  <span>{note.content}</span>
                </li>
              ))}
              {strengths.length > 6 && (
                <li className="text-xs text-gray-400 dark:text-zinc-600 pl-5">
                  +{strengths.length - 6} more
                </li>
              )}
            </ul>
          )}
        </div>

        <div className="bg-white dark:bg-[#16161f] border border-gray-200 dark:border-white/[0.07] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Eye className="h-4 w-4 text-amber-500 dark:text-amber-400" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
              Misconceptions
              <span className="ml-1.5 text-xs font-normal text-gray-400 dark:text-zinc-600">({misconceptions.length})</span>
            </h3>
          </div>
          {misconceptions.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-zinc-600 italic">No misconceptions recorded yet.</p>
          ) : (
            <ul className="space-y-2">
              {misconceptions.slice(0, 6).map((note) => (
                <li key={note.id} className="flex gap-2 text-sm text-gray-700 dark:text-zinc-300">
                  <span className="text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5">!</span>
                  <span>{note.content}</span>
                </li>
              ))}
              {misconceptions.length > 6 && (
                <li className="text-xs text-gray-400 dark:text-zinc-600 pl-5">
                  +{misconceptions.length - 6} more
                </li>
              )}
            </ul>
          )}
        </div>
      </div>

      {/* Student Self-Reflections */}
      <div className="bg-white dark:bg-[#16161f] border border-gray-200 dark:border-white/[0.07] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100 mb-4">
          Recent Student Reflections
        </h3>
        {recentReflections.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-zinc-600 italic">
            No reflections submitted yet. Student can submit via their portal.
          </p>
        ) : (
          <div className="space-y-5">
            {recentReflections.map((r) => (
              <div key={r.id} className="border-l-2 border-brand-200 dark:border-brand-500/30 pl-4 py-1">
                <p className="text-xs text-gray-400 dark:text-zinc-600 mb-2">{formatDate(r.created_at)}</p>
                {(r.confidence_before || r.confidence_after) && (
                  <div className="flex flex-wrap gap-4 mb-2">
                    {r.confidence_before && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-zinc-500">Before</span>
                        <ConfidenceDot value={r.confidence_before} />
                        <span className="text-xs font-semibold text-gray-700 dark:text-zinc-300">{r.confidence_before}/5</span>
                      </div>
                    )}
                    {r.confidence_after && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-zinc-500">After</span>
                        <ConfidenceDot value={r.confidence_after} />
                        <span className="text-xs font-semibold text-gray-700 dark:text-zinc-300">{r.confidence_after}/5</span>
                      </div>
                    )}
                  </div>
                )}
                <div className="space-y-1">
                  {r.found_hard && (
                    <p className="text-sm text-gray-700 dark:text-zinc-300">
                      <span className="font-medium text-gray-900 dark:text-zinc-100">Found hard:</span>{" "}
                      {r.found_hard}
                    </p>
                  )}
                  {r.what_helped && (
                    <p className="text-sm text-gray-700 dark:text-zinc-300">
                      <span className="font-medium text-gray-900 dark:text-zinc-100">Helped by:</span>{" "}
                      {r.what_helped}
                    </p>
                  )}
                  {r.what_next && (
                    <p className="text-sm text-gray-700 dark:text-zinc-300">
                      <span className="font-medium text-gray-900 dark:text-zinc-100">Wants next:</span>{" "}
                      {r.what_next}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
