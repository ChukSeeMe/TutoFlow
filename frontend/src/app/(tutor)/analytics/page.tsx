"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { studentsApi, analyticsApi } from "@/lib/api";
import type { Student, StudentAnalytics } from "@/types";
import { attendancePercent, priorityColour } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";

function StudentAnalyticsCard({ student }: { student: Student }) {
  const [expanded, setExpanded] = useState(false);

  const { data: analytics, isLoading } = useQuery<StudentAnalytics>({
    queryKey: ["analytics", student.id],
    queryFn: () => analyticsApi.studentSummary(student.id).then((r) => r.data),
    enabled: expanded,
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors rounded-xl"
      >
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-semibold">
            {student.first_name[0]}{student.last_name[0]}
          </div>
          <div>
            <p className="font-medium text-gray-900">{student.full_name}</p>
            <p className="text-xs text-gray-500">{student.year_group} · {student.ability_band}</p>
          </div>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
      </button>

      {expanded && (
        <div className="border-t border-gray-100 p-5">
          {isLoading && <p className="text-gray-400 text-sm text-center py-4">Loading analytics...</p>}
          {analytics && (
            <div className="space-y-5">
              {/* Summary stats */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "Sessions", value: analytics.total_sessions },
                  { label: "Attendance", value: attendancePercent(analytics.attendance_rate) },
                  { label: "Avg Score", value: analytics.average_quiz_score ? `${analytics.average_quiz_score}%` : "—" },
                  { label: "Engagement", value: analytics.average_engagement ? `${analytics.average_engagement.toFixed(1)}/5` : "—" },
                ].map(({ label, value }) => (
                  <div key={label} className="text-center bg-gray-50 rounded-lg p-3">
                    <p className="text-lg font-bold text-gray-900">{value}</p>
                    <p className="text-xs text-gray-500">{label}</p>
                  </div>
                ))}
              </div>

              {/* Mastery summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-green-700">{analytics.topics_secure}</p>
                  <p className="text-xs text-green-600">Secure</p>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-red-700">{analytics.topics_needs_reteach}</p>
                  <p className="text-xs text-red-600">Needs Reteach</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-gray-700">{analytics.topics_not_started}</p>
                  <p className="text-xs text-gray-500">Not Started</p>
                </div>
              </div>

              {/* Recommendations */}
              {analytics.recommendations.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    Teaching Recommendations ({analytics.recommendations.length})
                  </p>
                  <div className="space-y-2">
                    {analytics.recommendations.slice(0, 3).map((rec) => (
                      <div key={rec.rule_id} className={`border rounded-lg px-4 py-3 ${priorityColour(rec.priority)}`}>
                        <p className="font-medium text-sm">{rec.title}</p>
                        <p className="text-xs mt-1 opacity-80">{rec.action}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {analytics.recommendations.length === 0 && (
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-green-700 font-medium">No recommendations — student is on track</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  const { data: students = [], isLoading } = useQuery<Student[]>({
    queryKey: ["students"],
    queryFn: () => studentsApi.list().then((r) => r.data),
  });

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">
          Rule-based recommendations. All suggestions require your professional judgment.
        </p>
      </div>

      <div className="space-y-3">
        {isLoading && <p className="text-gray-400 text-sm text-center py-8">Loading...</p>}
        {students.map((student) => (
          <StudentAnalyticsCard key={student.id} student={student} />
        ))}
        {!isLoading && students.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 py-12 text-center">
            <p className="text-gray-400 text-sm">Add students to see analytics</p>
          </div>
        )}
      </div>
    </div>
  );
}
