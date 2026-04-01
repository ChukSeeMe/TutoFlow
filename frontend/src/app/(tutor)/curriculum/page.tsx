"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { curriculumApi } from "@/lib/api";
import type { Subject, Topic } from "@/types";
import { PageHeader } from "@/components/ui/PageHeader";
import Link from "next/link";
import { ChevronDown, ChevronUp, BookOpen } from "lucide-react";

function SubjectPanel({ subject }: { subject: Subject }) {
  const [open, setOpen] = useState(false);
  const [ksFilter, setKsFilter] = useState<string>("");

  const { data: topics = [], isLoading } = useQuery<Topic[]>({
    queryKey: ["topics", subject.id],
    queryFn: () => curriculumApi.topics(subject.id).then((r) => r.data),
    enabled: open,
  });

  const filtered = topics.filter((t) => !ksFilter || t.key_stage === ksFilter);

  // Group by key stage
  const grouped = filtered.reduce<Record<string, Topic[]>>((acc, t) => {
    const k = t.key_stage ?? "Other";
    if (!acc[k]) acc[k] = [];
    acc[k].push(t);
    return acc;
  }, {});

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 rounded-xl"
      >
        <div className="flex items-center gap-3">
          <BookOpen className="h-4 w-4 text-brand-600" />
          <div>
            <p className="font-medium text-gray-900">{subject.name}</p>
            {subject.key_stage && (
              <p className="text-xs text-gray-500">{subject.key_stage}</p>
            )}
          </div>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
      </button>

      {open && (
        <div className="border-t border-gray-100 px-5 py-4">
          {/* KS filter */}
          <div className="flex gap-2 mb-4">
            {["", "KS3", "KS4", "KS5"].map((ks) => (
              <button
                key={ks}
                onClick={() => setKsFilter(ks)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                  ksFilter === ks
                    ? "bg-brand-600 text-white border-brand-600"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {ks || "All"}
              </button>
            ))}
          </div>

          {isLoading && <p className="text-gray-400 text-sm">Loading topics...</p>}

          {Object.entries(grouped).map(([ks, ksTopics]) => (
            <div key={ks} className="mb-5 last:mb-0">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{ks}</p>
              <div className="grid grid-cols-2 gap-1.5">
                {ksTopics.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between gap-2 bg-gray-50 rounded-lg px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-gray-700 truncate">{t.name}</p>
                      {t.year_group && <p className="text-xs text-gray-400">{t.year_group}</p>}
                    </div>
                    <Link
                      href={`/lessons/new?topic=${t.id}`}
                      className="text-xs text-brand-600 hover:underline flex-shrink-0"
                    >
                      Plan →
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {!isLoading && filtered.length === 0 && (
            <p className="text-gray-400 text-sm">No topics for this filter</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function CurriculumPage() {
  const { data: subjects = [], isLoading } = useQuery<Subject[]>({
    queryKey: ["subjects"],
    queryFn: () => curriculumApi.subjects().then((r) => r.data),
  });

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <PageHeader
        title="Curriculum"
        subtitle="England National Curriculum — KS3, KS4, KS5. Click a topic to plan a lesson."
      />

      <div className="space-y-3">
        {isLoading && <p className="text-gray-400 text-sm text-center py-8">Loading...</p>}
        {subjects.map((s) => <SubjectPanel key={s.id} subject={s} />)}
      </div>
    </div>
  );
}
