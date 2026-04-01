"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "@/lib/api";
import type { Report } from "@/types";
import { formatDate } from "@/lib/utils";
import { FileText, Download, ChevronDown, ChevronUp } from "lucide-react";

function ReportCard({ report }: { report: Report }) {
  const [expanded, setExpanded] = useState(false);

  async function handleDownload() {
    try {
      const res = await reportsApi.downloadPdf(report.id);
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${report.title.replace(/\s+/g, "_")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // PDF may not be generated; fallback gracefully
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 rounded-xl transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="inline-flex p-2 rounded-lg bg-blue-50 text-blue-600 flex-shrink-0">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{report.title}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {report.report_type.replace("_", " ")} ·{" "}
              {report.approved_at ? formatDate(report.approved_at) : formatDate(report.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {report.pdf_path && (
            <button
              onClick={(e) => { e.stopPropagation(); handleDownload(); }}
              className="flex items-center gap-1 text-xs text-brand-600 hover:underline"
            >
              <Download className="h-3.5 w-3.5" />
              PDF
            </button>
          )}
          {expanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 px-5 py-4">
          {/* Period */}
          {(report.period_start || report.period_end) && (
            <p className="text-xs text-gray-500 mb-4">
              Period:{" "}
              {report.period_start ? formatDate(report.period_start) : "—"} to{" "}
              {report.period_end ? formatDate(report.period_end) : "—"}
            </p>
          )}

          {/* Final text (tutor-approved narrative) */}
          {report.final_text ? (
            <div className="prose prose-sm max-w-none">
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{report.final_text}</p>
            </div>
          ) : report.ai_draft ? (
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{report.ai_draft}</p>
          ) : (
            <p className="text-sm text-gray-400">No narrative content in this report.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function ParentReportsPage() {
  const { data: reports = [], isLoading } = useQuery<Report[]>({
    queryKey: ["parent-reports"],
    queryFn: () => reportsApi.list().then((r) => r.data),
  });

  // Only show tutor-approved reports
  const approvedReports = reports.filter((r) => r.tutor_approved);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Progress Reports</h1>
        <p className="text-gray-500 text-sm mt-1">
          Reports reviewed and approved by your child&apos;s tutor.
        </p>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-white rounded-xl border border-gray-200 animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && approvedReports.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 py-12 text-center">
          <FileText className="h-8 w-8 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No approved reports yet.</p>
          <p className="text-gray-400 text-xs mt-1">
            Reports will appear here once your child&apos;s tutor has reviewed and approved them.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {approvedReports.map((report) => (
          <ReportCard key={report.id} report={report} />
        ))}
      </div>
    </div>
  );
}
