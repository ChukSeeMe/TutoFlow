"use client";

import { useQuery } from "@tanstack/react-query";
import { studentsApi, analyticsApi } from "@/lib/api";
import type { Student } from "@/types";
import Link from "next/link";
import { UserPlus, Search, ChevronRight, AlertTriangle, CalendarX } from "lucide-react";
import { useState } from "react";
import { getInitials } from "@/lib/utils";

interface InterventionFlag {
  student_id: number;
  flag_type: string;
  priority: string;
}

export default function StudentsPage() {
  const [search, setSearch] = useState("");

  const { data: students = [], isLoading } = useQuery<Student[]>({
    queryKey: ["students"],
    queryFn: () => studentsApi.list().then((r) => r.data),
  });

  const { data: interventions } = useQuery<{ flags: InterventionFlag[] }>({
    queryKey: ["interventions-dashboard"],
    queryFn: () => analyticsApi.interventionsDashboard().then((r) => r.data),
  });

  // Build a map: student_id → set of flag types
  const flagMap = new Map<number, Set<string>>();
  for (const flag of interventions?.flags ?? []) {
    if (!flagMap.has(flag.student_id)) flagMap.set(flag.student_id, new Set());
    flagMap.get(flag.student_id)!.add(flag.flag_type);
  }

  const filtered = students.filter(
    (s) =>
      s.full_name.toLowerCase().includes(search.toLowerCase()) ||
      s.year_group?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-500 text-sm mt-1">{students.length} student{students.length !== 1 ? "s" : ""} on your register</p>
        </div>
        <Link
          href="/students/new"
          className="flex items-center gap-2 bg-brand-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors"
        >
          <UserPlus className="h-4 w-4" />
          Add Student
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name or year group..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-gray-300 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {/* Student list */}
      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {isLoading && (
          <div className="py-12 text-center text-gray-400 text-sm">Loading students...</div>
        )}
        {!isLoading && filtered.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-gray-400 text-sm">
              {search ? "No students match your search" : "No students yet. Add your first student."}
            </p>
            {!search && (
              <Link
                href="/students/new"
                className="mt-3 inline-block text-brand-600 text-sm hover:underline"
              >
                Add a student
              </Link>
            )}
          </div>
        )}
        {filtered.map((student) => {
          const flags = flagMap.get(student.id);
          const hasMissed = flags?.has("attendance");
          const hasEngagement = flags?.has("engagement");
          const hasReteach = flags?.has("reteach");
          return (
            <Link
              key={student.id}
              href={`/students/${student.id}`}
              className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
            >
              {/* Avatar */}
              <div className="h-10 w-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-semibold text-sm flex-shrink-0">
                {getInitials(student.full_name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{student.full_name}</p>
                <p className="text-sm text-gray-500">
                  {[student.year_group, student.key_stage, student.ability_band]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                {hasMissed && (
                  <span className="flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                    <CalendarX className="h-3 w-3" /> Missed sessions
                  </span>
                )}
                {hasEngagement && (
                  <span className="flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                    <AlertTriangle className="h-3 w-3" /> Low engagement
                  </span>
                )}
                {hasReteach && (
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                    Needs reteach
                  </span>
                )}
                {!student.is_active && (
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Inactive</span>
                )}
                <ChevronRight className="h-4 w-4 text-gray-400 ml-1" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
