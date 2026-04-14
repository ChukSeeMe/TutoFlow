"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { reportsApi, studentsApi } from "@/lib/api";
import type { Report, Student } from "@/types";
import { formatDate } from "@/lib/utils";
import { FileText, Plus, CheckCircle, Download, Loader2, AlertCircle } from "lucide-react";

function GenerateReportModal({
  students,
  onClose,
  onGenerated,
}: {
  students: Student[];
  onClose: () => void;
  onGenerated: () => void;
}) {
  const [studentId, setStudentId] = useState("");
  const [reportType, setReportType] = useState("weekly_update");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    if (!studentId) return;
    setIsGenerating(true);
    setError(null);
    try {
      await reportsApi.generate({ student_id: Number(studentId), report_type: reportType });
      onGenerated();
      onClose();
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "Failed to generate report"
      );
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Generate Report</h2>
        <p className="text-xs text-gray-500 mb-4">
          AI will draft a report using session data. You review and approve before it can be downloaded.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="">Select student...</option>
              {students.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Report type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
            >
              {["weekly_update","monthly_summary","term_report","progress_snapshot","parent_letter"].map((t) => (
                <option key={t} value={t}>{t.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</option>
              ))}
            </select>
          </div>

          {error && <p className="text-red-600 text-xs">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleGenerate}
              disabled={!studentId || isGenerating}
              className="flex-1 flex items-center justify-center gap-2 bg-brand-600 text-white font-medium py-2.5 rounded-lg hover:bg-brand-700 disabled:opacity-60"
            >
              {isGenerating ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</> : "Generate Draft"}
            </button>
            <button onClick={onClose} className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 text-sm hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [approveErrors, setApproveErrors] = useState<Record<number, string>>({});
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [finalTexts, setFinalTexts] = useState<Record<number, string>>({});

  const { data: reports = [], isLoading } = useQuery<Report[]>({
    queryKey: ["reports"],
    queryFn: () => reportsApi.list().then((r) => r.data),
  });

  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ["students"],
    queryFn: () => studentsApi.list().then((r) => r.data),
  });

  const studentMap = Object.fromEntries(students.map((s) => [s.id, s]));

  async function approveReport(report: Report) {
    setApprovingId(report.id);
    setApproveErrors((prev) => { const n = { ...prev }; delete n[report.id]; return n; });
    try {
      const finalText = finalTexts[report.id] ?? report.ai_draft ?? "";
      await reportsApi.approve(report.id, finalText);
      await queryClient.invalidateQueries({ queryKey: ["reports"] });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "Approval failed — please try again.";
      setApproveErrors((prev) => ({ ...prev, [report.id]: msg }));
    } finally {
      setApprovingId(null);
    }
  }

  async function downloadPdf(reportId: number) {
    setDownloadingId(reportId);
    try {
      const res = await reportsApi.downloadPdf(reportId);
      const blob = res.data instanceof Blob
        ? res.data
        : new Blob([res.data as BlobPart], { type: res.headers?.["content-type"] ?? "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `report_${reportId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // ignore — browser will show its own error
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500 text-sm mt-1">AI-drafted, tutor-approved parent reports</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-brand-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" /> Generate Report
        </button>
      </div>

      {showModal && (
        <GenerateReportModal
          students={students}
          onClose={() => setShowModal(false)}
          onGenerated={() => queryClient.invalidateQueries({ queryKey: ["reports"] })}
        />
      )}

      <div className="space-y-4">
        {isLoading && <p className="text-gray-400 text-sm text-center py-8">Loading...</p>}
        {reports.map((report) => {
          const student = studentMap[report.student_id];
          const isApproving = approvingId === report.id;

          return (
            <div key={report.id} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-brand-600 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">{report.title}</p>
                    <p className="text-sm text-gray-500">
                      {student?.full_name ?? `Student #${report.student_id}`} · {formatDate(report.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {report.tutor_approved ? (
                    <>
                      <span className="flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle className="h-3 w-3" /> Approved
                      </span>
                      <button
                        onClick={() => downloadPdf(report.id)}
                        disabled={downloadingId === report.id}
                        className="flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-60"
                      >
                        {downloadingId === report.id
                          ? <Loader2 className="h-3 w-3 animate-spin" />
                          : <Download className="h-3 w-3" />}
                        {downloadingId === report.id ? "Downloading..." : "Download PDF"}
                      </button>
                    </>
                  ) : (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">Pending review</span>
                  )}
                </div>
              </div>

              {/* AI draft for review */}
              {!report.tutor_approved && report.ai_draft && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2">Draft — review and edit before approving:</p>
                  <textarea
                    defaultValue={report.ai_draft}
                    onChange={(e) => setFinalTexts((prev) => ({ ...prev, [report.id]: e.target.value }))}
                    rows={6}
                    className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                  />
                  {approveErrors[report.id] && (
                    <div className="mt-2 flex items-center gap-2 text-red-600 text-xs">
                      <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                      {approveErrors[report.id]}
                    </div>
                  )}
                  <button
                    onClick={() => approveReport(report)}
                    disabled={isApproving}
                    className="mt-3 flex items-center gap-2 bg-green-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-60"
                  >
                    {isApproving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                    {isApproving ? "Approving..." : "Approve & Save as PDF"}
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {!isLoading && reports.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 py-12 text-center">
            <p className="text-gray-400 text-sm">No reports yet. Generate your first report above.</p>
          </div>
        )}
      </div>
    </div>
  );
}
