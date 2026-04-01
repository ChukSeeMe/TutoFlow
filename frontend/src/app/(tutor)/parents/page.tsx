"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { parentsApi } from "@/lib/api";
import type { ParentGuardian } from "@/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { Users, Plus, Phone, Mail } from "lucide-react";
import Link from "next/link";

function ParentRow({ parent }: { parent: ParentGuardian }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-center justify-between hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-9 w-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-semibold flex-shrink-0">
          {parent.first_name[0]}{parent.last_name[0]}
        </div>
        <div className="min-w-0">
          <p className="font-medium text-gray-900">{parent.full_name}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {parent.relationship_label} · {parent.communication_preference}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4 flex-shrink-0">
        {parent.phone && (
          <a href={`tel:${parent.phone}`} className="text-gray-400 hover:text-gray-600" title={parent.phone}>
            <Phone className="h-4 w-4" />
          </a>
        )}
        <span className="text-xs text-gray-400">
          {parent.linked_student_ids?.length ?? 0} linked
        </span>
      </div>
    </div>
  );
}

export default function ParentsPage() {
  const [search, setSearch] = useState("");

  const { data: parents = [], isLoading } = useQuery<ParentGuardian[]>({
    queryKey: ["parents"],
    queryFn: () => parentsApi.list().then((r) => r.data),
  });

  const filtered = parents.filter(
    (p) =>
      !search ||
      p.full_name.toLowerCase().includes(search.toLowerCase()) ||
      p.relationship_label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <PageHeader
        title="Parents & Guardians"
        subtitle="Manage parent accounts and their links to students."
        actions={
          <Link
            href="/parents/new"
            className="flex items-center gap-2 bg-brand-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            <Plus className="h-4 w-4" /> Add parent
          </Link>
        }
      />

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or relationship…"
          className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
        />
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-white rounded-xl border border-gray-200 animate-pulse" />
          ))}
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((parent) => <ParentRow key={parent.id} parent={parent} />)}
      </div>

      {!isLoading && filtered.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 py-12 text-center">
          <Users className="h-8 w-8 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">
            {search ? "No parents match your search." : "No parents added yet."}
          </p>
          {!search && (
            <Link
              href="/parents/new"
              className="inline-flex items-center gap-1.5 mt-3 text-sm text-brand-600 hover:underline"
            >
              <Plus className="h-4 w-4" /> Add your first parent
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
