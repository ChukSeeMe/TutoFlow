"use client";

import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";
import { CheckCircle2, XCircle, Activity, Database, Clock, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface HealthStatus {
  db_ok: boolean;
  db_latency_ms: number;
  total_audit_logs: number;
  failed_logins_last_hour: number;
  last_event_at: string | null;
  table_counts: Record<string, number>;
  uptime_note: string;
}

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
      ok ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"
    )}>
      {ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
      {label}
    </span>
  );
}

export default function AdminHealth() {
  const { data, isLoading, dataUpdatedAt } = useQuery<HealthStatus>({
    queryKey: ["admin-health"],
    queryFn: () => adminApi.health().then(r => r.data),
    refetchInterval: 30_000,
  });

  if (isLoading || !data) {
    return (
      <div className="flex h-full items-center justify-center p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  const lastChecked = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString("en-GB") : "—";

  return (
    <div className="p-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">System Health</h1>
          <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
            {data.uptime_note} — auto-refreshes every 30s
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[rgb(var(--text-tertiary))]">
          <Clock className="h-3.5 w-3.5" />
          Last checked: {lastChecked}
        </div>
      </div>

      {/* Status cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-white/8 bg-[rgb(var(--bg-card))] p-5">
          <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/15 text-brand-400">
            <Database className="h-5 w-5" />
          </div>
          <div className="flex items-center gap-2">
            <StatusPill ok={data.db_ok} label={data.db_ok ? "Database OK" : "DB Error"} />
          </div>
          <p className="mt-2 text-xs text-[rgb(var(--text-secondary))]">
            Latency: <span className={cn("font-medium", data.db_latency_ms > 100 ? "text-amber-400" : "text-green-400")}>
              {data.db_latency_ms} ms
            </span>
          </p>
        </div>

        <div className="rounded-2xl border border-white/8 bg-[rgb(var(--bg-card))] p-5">
          <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/15 text-brand-400">
            <Activity className="h-5 w-5" />
          </div>
          <p className="text-2xl font-bold">{data.total_audit_logs.toLocaleString()}</p>
          <p className="mt-0.5 text-sm text-[rgb(var(--text-secondary))]">Audit log entries</p>
        </div>

        <div className="rounded-2xl border border-white/8 bg-[rgb(var(--bg-card))] p-5">
          <div className={cn(
            "mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl",
            data.failed_logins_last_hour > 5 ? "bg-red-500/15 text-red-400" : "bg-green-500/15 text-green-400"
          )}>
            <ShieldAlert className="h-5 w-5" />
          </div>
          <p className={cn("text-2xl font-bold", data.failed_logins_last_hour > 5 ? "text-red-400" : "")}>
            {data.failed_logins_last_hour}
          </p>
          <p className="mt-0.5 text-sm text-[rgb(var(--text-secondary))]">Failed logins (1h)</p>
          {data.failed_logins_last_hour > 5 && (
            <p className="mt-1 text-xs text-red-400">Elevated — possible brute force</p>
          )}
        </div>

        <div className="rounded-2xl border border-white/8 bg-[rgb(var(--bg-card))] p-5">
          <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-400">
            <Clock className="h-5 w-5" />
          </div>
          <p className="text-sm font-medium">
            {data.last_event_at
              ? new Date(data.last_event_at).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "medium" })
              : "No events yet"}
          </p>
          <p className="mt-0.5 text-sm text-[rgb(var(--text-secondary))]">Last audit event</p>
        </div>
      </div>

      {/* Table counts */}
      <div className="rounded-2xl border border-white/8 bg-[rgb(var(--bg-card))] p-6">
        <h2 className="mb-4 font-semibold">Database table counts</h2>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Object.entries(data.table_counts).map(([table, count]) => (
            <div key={table} className="flex items-center justify-between rounded-xl border border-white/8 bg-[rgb(var(--bg))]/50 px-4 py-3">
              <span className="capitalize text-sm text-[rgb(var(--text-secondary))]">
                {table.replace("_", " ")}
              </span>
              <span className="text-sm font-semibold">{count.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
