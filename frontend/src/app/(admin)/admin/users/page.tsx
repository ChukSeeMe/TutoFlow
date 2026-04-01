"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";
import { Search, CheckCircle2, XCircle, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserRow {
  id: number; email: string; role: string;
  is_active: boolean; is_verified: boolean;
  created_at: string; last_login: string | null;
}

const ROLE_COLORS: Record<string, string> = {
  tutor:   "bg-violet-500/15 text-violet-400",
  student: "bg-blue-500/15 text-blue-400",
  parent:  "bg-emerald-500/15 text-emerald-400",
  admin:   "bg-red-500/15 text-red-400",
};

export default function AdminUsers() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const { data: users = [], isLoading } = useQuery<UserRow[]>({
    queryKey: ["admin-users", search, roleFilter],
    queryFn: () => adminApi.users({ search: search || undefined, role: roleFilter || undefined, limit: 100 }).then(r => r.data),
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      adminApi.updateUser(id, { is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const changeRole = useMutation({
    mutationFn: ({ id, role }: { id: number; role: string }) =>
      adminApi.updateUser(id, { role }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
        <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
          View, activate, deactivate, and change roles for all platform users.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgb(var(--text-tertiary))]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by email…"
            className="rounded-xl border border-white/10 bg-[rgb(var(--bg-card))] py-2 pl-9 pr-4 text-sm outline-none focus:border-indigo-500/50 w-64"
          />
        </div>

        <div className="relative">
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="appearance-none rounded-xl border border-white/10 bg-[rgb(var(--bg-card))] py-2 pl-3 pr-8 text-sm outline-none focus:border-indigo-500/50"
          >
            <option value="">All roles</option>
            <option value="tutor">Tutor</option>
            <option value="student">Student</option>
            <option value="parent">Parent</option>
            <option value="admin">Admin</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[rgb(var(--text-tertiary))]" />
        </div>

        <span className="ml-auto text-sm text-[rgb(var(--text-secondary))]">
          {users.length} users
        </span>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-white/8 bg-[rgb(var(--bg-card))]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/8 text-left text-xs text-[rgb(var(--text-secondary))]">
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 font-medium">Last login</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="py-12 text-center text-[rgb(var(--text-tertiary))]">Loading…</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6} className="py-12 text-center text-[rgb(var(--text-tertiary))]">No users found</td></tr>
            ) : users.map(user => (
              <tr key={user.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                <td className="px-4 py-3">
                  <span className="font-medium">{user.email}</span>
                  {!user.is_verified && (
                    <span className="ml-2 text-[10px] text-amber-400">unverified</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium capitalize", ROLE_COLORS[user.role] ?? "bg-white/10 text-white")}>
                      {user.role}
                    </span>
                    <select
                      value={user.role}
                      onChange={e => changeRole.mutate({ id: user.id, role: e.target.value })}
                      className="rounded-lg border border-white/10 bg-[rgb(var(--bg))] px-1.5 py-0.5 text-xs outline-none focus:border-indigo-500/50"
                    >
                      <option value="tutor">tutor</option>
                      <option value="student">student</option>
                      <option value="parent">parent</option>
                      <option value="admin">admin</option>
                    </select>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={cn(
                    "flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                    user.is_active ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"
                  )}>
                    {user.is_active ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    {user.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3 text-[rgb(var(--text-secondary))]">
                  {new Date(user.created_at).toLocaleDateString("en-GB")}
                </td>
                <td className="px-4 py-3 text-[rgb(var(--text-secondary))]">
                  {user.last_login ? new Date(user.last_login).toLocaleDateString("en-GB") : "—"}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleActive.mutate({ id: user.id, is_active: !user.is_active })}
                    className={cn(
                      "rounded-lg px-3 py-1 text-xs font-medium transition-colors",
                      user.is_active
                        ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                        : "bg-green-500/10 text-green-400 hover:bg-green-500/20"
                    )}
                  >
                    {user.is_active ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
