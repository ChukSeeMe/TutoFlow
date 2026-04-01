"use client";

import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";
import { cn } from "@/lib/utils";

interface DailyPoint { date: string; new_users: number; sessions: number; lessons: number; }
interface StatusBreakdown { status: string; count: number; }
interface PlatformInsights {
  daily_activity: DailyPoint[];
  session_status_breakdown: StatusBreakdown[];
  homework_breakdown: StatusBreakdown[];
  ai_usage: { lessons: number; homework: number; reports: number };
  pending_approvals: { lessons: number; homework: number; reports: number };
}

const SESSION_COLORS: Record<string, string> = {
  delivered:  "bg-green-500",
  scheduled:  "bg-indigo-500",
  cancelled:  "bg-red-500",
  no_show:    "bg-amber-500",
};

const HW_COLORS: Record<string, string> = {
  set:        "bg-indigo-500",
  submitted:  "bg-green-500",
  overdue:    "bg-red-500",
  marked:     "bg-violet-500",
};

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/8">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-6 text-right text-xs text-[rgb(var(--text-secondary))]">{value}</span>
    </div>
  );
}

function SparkBars({ data, field, color }: {
  data: DailyPoint[];
  field: keyof DailyPoint;
  color: string;
}) {
  const max = Math.max(...data.map(d => d[field] as number), 1);
  return (
    <div className="flex h-16 items-end gap-0.5">
      {data.map((d, i) => {
        const h = Math.max(((d[field] as number) / max) * 100, 2);
        return (
          <div key={i} className="group relative flex-1">
            <div
              className={`w-full rounded-sm ${color} opacity-70 group-hover:opacity-100 transition-opacity`}
              style={{ height: `${h}%` }}
            />
            <div className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:block">
              <span className="rounded bg-black/80 px-1.5 py-0.5 text-[10px] text-white whitespace-nowrap">
                {d.date}: {d[field]}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminInsights() {
  const { data, isLoading } = useQuery<PlatformInsights>({
    queryKey: ["admin-insights"],
    queryFn: () => adminApi.insights().then(r => r.data),
    refetchInterval: 60_000,
  });

  if (isLoading || !data) {
    return (
      <div className="flex h-full items-center justify-center p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  const totalSessions = data.session_status_breakdown.reduce((s, r) => s + r.count, 0);
  const totalHw       = data.homework_breakdown.reduce((s, r) => s + r.count, 0);
  const totalAi       = data.ai_usage.lessons + data.ai_usage.homework + data.ai_usage.reports;
  const totalPending  = data.pending_approvals.lessons + data.pending_approvals.homework + data.pending_approvals.reports;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Platform Insights</h1>
        <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
          Activity trends and AI usage — last 14 days
        </p>
      </div>

      {/* Daily activity charts */}
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        {([
          { label: "New Users",  field: "new_users" as const, color: "bg-indigo-500" },
          { label: "Sessions",   field: "sessions"  as const, color: "bg-violet-500" },
          { label: "Lessons",    field: "lessons"   as const, color: "bg-cyan-500"   },
        ] as const).map(({ label, field, color }) => {
          const total = data.daily_activity.reduce((s, d) => s + d[field], 0);
          return (
            <div key={label} className="rounded-2xl border border-white/8 bg-[rgb(var(--bg-card))] p-5">
              <div className="mb-1 flex items-baseline justify-between">
                <p className="text-sm text-[rgb(var(--text-secondary))]">{label}</p>
                <p className="text-lg font-bold">{total}</p>
              </div>
              <p className="mb-3 text-xs text-[rgb(var(--text-tertiary))]">14-day total</p>
              <SparkBars data={data.daily_activity} field={field} color={color} />
              <div className="mt-2 flex justify-between text-[10px] text-[rgb(var(--text-tertiary))]">
                <span>{data.daily_activity[0]?.date}</span>
                <span>{data.daily_activity[data.daily_activity.length - 1]?.date}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Session breakdown */}
        <div className="rounded-2xl border border-white/8 bg-[rgb(var(--bg-card))] p-6">
          <h2 className="mb-4 font-semibold">Session status</h2>
          <div className="space-y-3">
            {data.session_status_breakdown.map(r => (
              <div key={r.status}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="capitalize text-[rgb(var(--text-secondary))]">{r.status.replace("_", " ")}</span>
                  <span className="font-medium">{r.count}</span>
                </div>
                <MiniBar value={r.count} max={totalSessions} color={SESSION_COLORS[r.status] ?? "bg-white/30"} />
              </div>
            ))}
            {data.session_status_breakdown.length === 0 && (
              <p className="text-sm text-[rgb(var(--text-tertiary))]">No sessions yet</p>
            )}
          </div>
        </div>

        {/* Homework breakdown */}
        <div className="rounded-2xl border border-white/8 bg-[rgb(var(--bg-card))] p-6">
          <h2 className="mb-4 font-semibold">Homework status</h2>
          <div className="space-y-3">
            {data.homework_breakdown.map(r => (
              <div key={r.status}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="capitalize text-[rgb(var(--text-secondary))]">{r.status}</span>
                  <span className="font-medium">{r.count}</span>
                </div>
                <MiniBar value={r.count} max={totalHw} color={HW_COLORS[r.status] ?? "bg-white/30"} />
              </div>
            ))}
            {data.homework_breakdown.length === 0 && (
              <p className="text-sm text-[rgb(var(--text-tertiary))]">No homework yet</p>
            )}
          </div>
        </div>

        {/* AI usage */}
        <div className="rounded-2xl border border-white/8 bg-[rgb(var(--bg-card))] p-6">
          <h2 className="mb-1 font-semibold">AI usage</h2>
          <p className="mb-4 text-xs text-[rgb(var(--text-tertiary))]">{totalAi} AI-generated items total</p>
          <div className="space-y-3">
            {([
              { label: "Lessons",   value: data.ai_usage.lessons,  color: "bg-cyan-500" },
              { label: "Homework",  value: data.ai_usage.homework, color: "bg-violet-500" },
              { label: "Reports",   value: data.ai_usage.reports,  color: "bg-pink-500" },
            ] as const).map(({ label, value, color }) => (
              <div key={label}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-[rgb(var(--text-secondary))]">{label}</span>
                  <span className="font-medium">{value}</span>
                </div>
                <MiniBar value={value} max={Math.max(totalAi, 1)} color={color} />
              </div>
            ))}
          </div>
        </div>

        {/* Pending approvals */}
        <div className="rounded-2xl border border-white/8 bg-[rgb(var(--bg-card))] p-6">
          <h2 className="mb-1 font-semibold">Pending approvals</h2>
          <p className="mb-4 text-xs text-[rgb(var(--text-tertiary))]">{totalPending} items awaiting tutor sign-off</p>
          <div className="space-y-3">
            {([
              { label: "Lessons",  value: data.pending_approvals.lessons,  color: "bg-amber-500" },
              { label: "Homework", value: data.pending_approvals.homework, color: "bg-orange-500" },
              { label: "Reports",  value: data.pending_approvals.reports,  color: "bg-red-500" },
            ] as const).map(({ label, value, color }) => (
              <div key={label}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-[rgb(var(--text-secondary))]">{label}</span>
                  <span className={cn("font-medium", value > 0 ? "text-amber-400" : "")}>{value}</span>
                </div>
                <MiniBar value={value} max={Math.max(totalPending, 1)} color={color} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
