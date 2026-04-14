"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi, type AuditParams } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  ChevronDown, ChevronRight, Download, FileText,
  Filter, RefreshCw, Shield, X,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface AuditRowFull {
  id: number;
  user_id: number | null;
  user_email: string | null;
  user_role: string | null;
  student_id: number | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  ip_address: string | null;
  created_at: string;
  detail_json: Record<string, unknown> | null;
}

interface AuditPage {
  items: AuditRowFull[];
  total: number;
  page: number;
  pages: number;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const ACTION_COLOURS: Record<string, string> = {
  login:           "bg-green-500/15 text-green-400",
  login_failed:    "bg-red-500/15 text-red-400",
  logout:          "bg-slate-500/15 text-slate-400",
  register:        "bg-brand-500/15 text-brand-400",
  oauth_login:     "bg-blue-500/15 text-blue-400",
  oauth_register:  "bg-brand-500/15 text-brand-400",
  create:          "bg-emerald-500/15 text-emerald-400",
  update:          "bg-amber-500/15 text-amber-400",
  delete:          "bg-red-500/15 text-red-400",
  ai_generate:     "bg-brand-500/15 text-brand-400",
};

const KNOWN_ACTIONS = [
  "login", "login_failed", "logout", "register",
  "oauth_login", "oauth_register", "create", "update", "delete", "ai_generate",
];

const PAGE_SIZE = 50;

// ── Helpers ────────────────────────────────────────────────────────────────────

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "medium" });
}

// ── JSON Viewer ────────────────────────────────────────────────────────────────

function JsonViewer({ data }: { data: Record<string, unknown> }) {
  return (
    <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-[rgb(var(--bg))] p-3 text-[10px] leading-relaxed text-[rgb(var(--text-secondary))] scrollbar-thin">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

// ── Compliance Modal ───────────────────────────────────────────────────────────

function ComplianceModal({ onClose }: { onClose: () => void }) {
  const [studentId, setStudentId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleExport() {
    const id = parseInt(studentId);
    if (!id || isNaN(id)) { setError("Enter a valid numeric student ID"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await adminApi.auditCompliancePDF(id);
      triggerDownload(res.data as Blob, `student-${id}-audit-trail.pdf`);
      onClose();
    } catch {
      setError("Export failed — check the student ID and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[rgb(var(--bg-card))] p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-brand-400" />
            <h2 className="font-semibold">GDPR Compliance Export</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-white/8 transition-colors">
            <X className="h-4 w-4 text-[rgb(var(--text-secondary))]" />
          </button>
        </div>
        <p className="mb-5 text-sm text-[rgb(var(--text-secondary))]">
          Generates a full PDF audit trail for a single student — all events where that
          student's data was accessed or modified. Use for GDPR Subject Access Requests.
        </p>
        <label className="mb-1.5 block text-sm font-medium">Student ID</label>
        <input
          type="number"
          value={studentId}
          onChange={e => setStudentId(e.target.value)}
          placeholder="e.g. 12"
          className="w-full rounded-xl border border-white/10 bg-[rgb(var(--bg-elevated))] px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/50"
        />
        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
        <div className="mt-5 flex gap-3">
          <button
            onClick={handleExport}
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-500 transition-colors disabled:opacity-60"
          >
            {loading ? (
              <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Generating…</>
            ) : (
              <><Download className="h-4 w-4" /> Download PDF</>
            )}
          </button>
          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 px-5 py-2.5 text-sm hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function AdminAudit() {
  // Filter state
  const [page, setPage]             = useState(1);
  const [actionFilter, setAction]   = useState("");
  const [userIdFilter, setUserId]   = useState("");
  const [studentFilter, setStudent] = useState("");
  const [ipFilter, setIp]           = useState("");
  const [dateFrom, setDateFrom]     = useState("");
  const [dateTo, setDateTo]         = useState("");

  // UI state
  const [expandedRow, setExpanded]      = useState<number | null>(null);
  const [showCompliance, setCompliance] = useState(false);
  const [exporting, setExporting]       = useState<"csv" | "pdf" | null>(null);

  const params: AuditParams = {
    page,
    limit: PAGE_SIZE,
    action:     actionFilter  || undefined,
    user_id:    userIdFilter  ? parseInt(userIdFilter)  : undefined,
    student_id: studentFilter ? parseInt(studentFilter) : undefined,
    ip_address: ipFilter      || undefined,
    date_from:  dateFrom      || undefined,
    date_to:    dateTo        || undefined,
  };

  const { data, isLoading, refetch, isFetching } = useQuery<AuditPage>({
    queryKey: ["admin-audit", params],
    queryFn: () => adminApi.audit(params).then(r => r.data),
    refetchInterval: 30_000,
  });

  const logs   = data?.items ?? [];
  const total  = data?.total ?? 0;
  const pages  = data?.pages ?? 1;

  function resetFilters() {
    setAction(""); setUserId(""); setStudent("");
    setIp(""); setDateFrom(""); setDateTo(""); setPage(1);
  }

  function hasFilters() {
    return !!(actionFilter || userIdFilter || studentFilter || ipFilter || dateFrom || dateTo);
  }

  async function handleExportCSV() {
    setExporting("csv");
    try {
      const exportParams = { action: actionFilter || undefined, user_id: userIdFilter ? parseInt(userIdFilter) : undefined, student_id: studentFilter ? parseInt(studentFilter) : undefined, ip_address: ipFilter || undefined, date_from: dateFrom || undefined, date_to: dateTo || undefined };
      const res = await adminApi.auditExportCSV(exportParams);
      triggerDownload(res.data as Blob, `teach-harbour-audit-${new Date().toISOString().slice(0,10)}.csv`);
    } finally { setExporting(null); }
  }

  async function handleExportPDF() {
    setExporting("pdf");
    try {
      const exportParams = { action: actionFilter || undefined, user_id: userIdFilter ? parseInt(userIdFilter) : undefined, student_id: studentFilter ? parseInt(studentFilter) : undefined, ip_address: ipFilter || undefined, date_from: dateFrom || undefined, date_to: dateTo || undefined };
      const res = await adminApi.auditExportPDF(exportParams);
      triggerDownload(res.data as Blob, `teach-harbour-audit-${new Date().toISOString().slice(0,10)}.pdf`);
    } finally { setExporting(null); }
  }

  return (
    <>
      {showCompliance && <ComplianceModal onClose={() => setCompliance(false)} />}

      <div className="p-8">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
            <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
              Full platform activity trail — {total.toLocaleString()} total records
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportCSV}
              disabled={!!exporting}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-[rgb(var(--bg-card))] px-4 py-2 text-sm font-medium hover:bg-[rgb(var(--bg-elevated))] transition-colors disabled:opacity-60"
            >
              {exporting === "csv" ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <Download className="h-4 w-4" />}
              Export CSV
            </button>
            <button
              onClick={handleExportPDF}
              disabled={!!exporting}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-[rgb(var(--bg-card))] px-4 py-2 text-sm font-medium hover:bg-[rgb(var(--bg-elevated))] transition-colors disabled:opacity-60"
            >
              {exporting === "pdf" ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <FileText className="h-4 w-4" />}
              Export PDF
            </button>
            <button
              onClick={() => setCompliance(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-brand-500/30 bg-brand-500/10 px-4 py-2 text-sm font-medium text-brand-400 hover:bg-brand-500/15 transition-colors"
            >
              <Shield className="h-4 w-4" /> Compliance Export
            </button>
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-[rgb(var(--bg-card))] hover:bg-[rgb(var(--bg-elevated))] transition-colors disabled:opacity-60"
              title="Refresh"
            >
              <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-5 rounded-2xl border border-white/8 bg-[rgb(var(--bg-card))] p-4">
          <div className="mb-3 flex items-center gap-2">
            <Filter className="h-4 w-4 text-[rgb(var(--text-secondary))]" />
            <span className="text-sm font-medium">Filters</span>
            {hasFilters() && (
              <button
                onClick={resetFilters}
                className="ml-auto flex items-center gap-1 text-xs text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text))] transition-colors"
              >
                <X className="h-3 w-3" /> Clear all
              </button>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            {/* Action */}
            <div className="relative">
              <label className="mb-1 block text-xs text-[rgb(var(--text-tertiary))]">Action</label>
              <select
                value={actionFilter}
                onChange={e => { setAction(e.target.value); setPage(1); }}
                className="w-full rounded-xl border border-white/10 bg-[rgb(var(--bg-elevated))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500/50"
              >
                <option value="">All actions</option>
                {KNOWN_ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            {/* User ID */}
            <div>
              <label className="mb-1 block text-xs text-[rgb(var(--text-tertiary))]">User ID</label>
              <input
                type="number"
                value={userIdFilter}
                onChange={e => { setUserId(e.target.value); setPage(1); }}
                placeholder="e.g. 5"
                className="w-full rounded-xl border border-white/10 bg-[rgb(var(--bg-elevated))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500/50"
              />
            </div>
            {/* Student ID */}
            <div>
              <label className="mb-1 block text-xs text-[rgb(var(--text-tertiary))]">Student ID</label>
              <input
                type="number"
                value={studentFilter}
                onChange={e => { setStudent(e.target.value); setPage(1); }}
                placeholder="e.g. 12"
                className="w-full rounded-xl border border-white/10 bg-[rgb(var(--bg-elevated))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500/50"
              />
            </div>
            {/* IP Address */}
            <div>
              <label className="mb-1 block text-xs text-[rgb(var(--text-tertiary))]">IP Address</label>
              <input
                type="text"
                value={ipFilter}
                onChange={e => { setIp(e.target.value); setPage(1); }}
                placeholder="e.g. 192.168"
                className="w-full rounded-xl border border-white/10 bg-[rgb(var(--bg-elevated))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500/50"
              />
            </div>
            {/* Date From */}
            <div>
              <label className="mb-1 block text-xs text-[rgb(var(--text-tertiary))]">From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={e => { setDateFrom(e.target.value); setPage(1); }}
                className="w-full rounded-xl border border-white/10 bg-[rgb(var(--bg-elevated))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500/50"
              />
            </div>
            {/* Date To */}
            <div>
              <label className="mb-1 block text-xs text-[rgb(var(--text-tertiary))]">To</label>
              <input
                type="date"
                value={dateTo}
                onChange={e => { setDateTo(e.target.value); setPage(1); }}
                className="w-full rounded-xl border border-white/10 bg-[rgb(var(--bg-elevated))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500/50"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-white/8 bg-[rgb(var(--bg-card))]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8 text-left text-xs text-[rgb(var(--text-secondary))]">
                <th className="w-5 px-4 py-3" />
                <th className="px-4 py-3 font-medium">Timestamp</th>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Entity</th>
                <th className="px-4 py-3 font-medium">IP Address</th>
                <th className="px-4 py-3 font-medium">Details</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-[rgb(var(--text-tertiary))]">
                    <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-[rgb(var(--text-tertiary))]">
                    No audit records match the current filters
                  </td>
                </tr>
              ) : (
                logs.map(log => {
                  const isExpanded = expandedRow === log.id;
                  return (
                    <React.Fragment key={log.id}>
                      <tr
                        className="border-b border-white/5 transition-colors hover:bg-white/[0.02] cursor-pointer"
                        onClick={() => setExpanded(isExpanded ? null : log.id)}
                      >
                        {/* Expand toggle */}
                        <td className="px-4 py-3 text-[rgb(var(--text-tertiary))]">
                          {log.detail_json ? (
                            isExpanded
                              ? <ChevronDown className="h-3.5 w-3.5" />
                              : <ChevronRight className="h-3.5 w-3.5" />
                          ) : null}
                        </td>
                        {/* Timestamp */}
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-[rgb(var(--text-secondary))]">
                          {fmtDate(log.created_at)}
                        </td>
                        {/* User */}
                        <td className="px-4 py-3">
                          {log.user_email ? (
                            <span className="text-xs">{log.user_email}</span>
                          ) : log.user_id ? (
                            <span className="text-xs text-[rgb(var(--text-tertiary))]">uid:{log.user_id}</span>
                          ) : (
                            <span className="text-xs text-[rgb(var(--text-tertiary))]">system</span>
                          )}
                        </td>
                        {/* Role */}
                        <td className="px-4 py-3 capitalize text-xs text-[rgb(var(--text-secondary))]">
                          {log.user_role ?? "—"}
                        </td>
                        {/* Action */}
                        <td className="px-4 py-3">
                          <span className={cn(
                            "rounded-full px-2 py-0.5 text-xs font-medium",
                            ACTION_COLOURS[log.action] ?? "bg-white/10 text-white"
                          )}>
                            {log.action}
                          </span>
                        </td>
                        {/* Entity */}
                        <td className="px-4 py-3 text-xs">
                          <span className="text-[rgb(var(--text-secondary))]">{log.resource_type}</span>
                          {log.resource_id && (
                            <span className="ml-1 text-[rgb(var(--text-tertiary))]">#{log.resource_id}</span>
                          )}
                          {log.student_id && (
                            <span className="ml-1.5 rounded bg-brand-500/15 px-1 py-0.5 text-[10px] text-brand-300">
                              student:{log.student_id}
                            </span>
                          )}
                        </td>
                        {/* IP */}
                        <td className="px-4 py-3 font-mono text-xs text-[rgb(var(--text-secondary))]">
                          {log.ip_address ?? "—"}
                        </td>
                        {/* Detail preview */}
                        <td className="max-w-[200px] truncate px-4 py-3 text-xs text-[rgb(var(--text-tertiary))]">
                          {log.detail_json
                            ? JSON.stringify(log.detail_json).slice(0, 60) + "…"
                            : "—"}
                        </td>
                      </tr>
                      {/* Expanded JSON viewer */}
                      {isExpanded && log.detail_json && (
                        <tr className="border-b border-white/5 bg-[rgb(var(--bg))]/40">
                          <td colSpan={8} className="px-8 pb-4 pt-1">
                            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[rgb(var(--text-tertiary))]">
                              Full payload
                            </p>
                            <JsonViewer data={log.detail_json} />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm text-[rgb(var(--text-secondary))]">
            <span>
              Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, total)} of {total.toLocaleString()}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-xs hover:bg-white/5 transition-colors disabled:opacity-40"
              >
                ← Prev
              </button>
              <span className="text-xs">
                Page {page} of {pages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-xs hover:bg-white/5 transition-colors disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
