"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { parentsApi, studentsApi } from "@/lib/api";
import type { ParentGuardian, Student } from "@/types";
import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  Phone, Mail, Edit2, Save, X, Send,
  GraduationCap, Link as LinkIcon, Loader2, Unlink, CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const inputCn = cn(
  "w-full border rounded-lg px-3 py-2 text-sm",
  "focus:outline-none focus:ring-2 focus:ring-brand-500/50",
  "border-gray-300 bg-white text-gray-800",
  "placeholder:text-gray-400",
);

const RELATIONSHIP_LABELS = ["Mother", "Father", "Guardian", "Carer", "Step-parent", "Grandparent", "Other"];
const COMM_PREFS = ["email", "sms", "phone", "app"];

interface EditForm {
  first_name: string;
  last_name: string;
  phone: string;
  relationship_label: string;
  communication_preference: string;
}

export default function ParentProfilePage() {
  const { id } = useParams<{ id: string }>();
  const parentId = Number(id);
  const router = useRouter();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<EditForm | null>(null);
  const [linkStudentId, setLinkStudentId] = useState("");
  const [linkSaving, setLinkSaving] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  const { data: parent, isLoading } = useQuery<ParentGuardian>({
    queryKey: ["parent", parentId],
    queryFn: () => parentsApi.get(parentId).then((r) => r.data),
  });

  const { data: allStudents = [] } = useQuery<Student[]>({
    queryKey: ["students"],
    queryFn: () => studentsApi.list().then((r) => r.data),
  });

  const { data: linkedStudents = [] } = useQuery<Student[]>({
    queryKey: ["parent-students", parentId, parent?.linked_student_ids],
    queryFn: async () => {
      if (!parent?.linked_student_ids?.length) return [];
      const results = await Promise.all(
        parent.linked_student_ids.map((sid) => studentsApi.get(sid).then((r) => r.data))
      );
      return results;
    },
    enabled: !!parent?.linked_student_ids?.length,
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<EditForm>) => parentsApi.update(parentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parent", parentId] });
      queryClient.invalidateQueries({ queryKey: ["parents"] });
      setIsEditing(false);
    },
  });

  const unlinkMutation = useMutation({
    mutationFn: (studentId: number) => parentsApi.unlinkStudent(parentId, studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parent", parentId] });
      queryClient.invalidateQueries({ queryKey: ["parents"] });
    },
  });

  const emailMutation = useMutation({
    mutationFn: (data: { subject: string; body: string }) =>
      parentsApi.sendEmail(parentId, data),
    onSuccess: () => {
      setEmailSent(true);
      setEmailSubject("");
      setEmailBody("");
      setTimeout(() => {
        setShowEmailModal(false);
        setEmailSent(false);
      }, 2000);
    },
  });

  function startEdit() {
    if (!parent) return;
    setForm({
      first_name: parent.first_name,
      last_name: parent.last_name,
      phone: parent.phone ?? "",
      relationship_label: parent.relationship_label,
      communication_preference: parent.communication_preference,
    });
    setIsEditing(true);
  }

  function cancelEdit() {
    setIsEditing(false);
    setForm(null);
  }

  function handleSave() {
    if (!form) return;
    updateMutation.mutate(form);
  }

  async function handleLinkStudent() {
    if (!linkStudentId) return;
    setLinkSaving(true);
    setLinkError(null);
    try {
      await parentsApi.linkStudent(parentId, Number(linkStudentId), { is_primary: false });
      queryClient.invalidateQueries({ queryKey: ["parent", parentId] });
      queryClient.invalidateQueries({ queryKey: ["parents"] });
      setLinkStudentId("");
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
        ?? "Could not link student.";
      setLinkError(msg);
    } finally {
      setLinkSaving(false);
    }
  }

  if (isLoading) return <div className="p-8 text-gray-400">Loading parent profile…</div>;
  if (!parent) return <div className="p-8 text-gray-400">Parent not found.</div>;

  const linkedIds = new Set(parent.linked_student_ids ?? []);
  const unlinkableStudents = linkedStudents;
  const linkableStudents = allStudents.filter((s) => !linkedIds.has(s.id) && s.is_active !== false);

  const displayForm = isEditing && form ? form : null;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <PageHeader
        title={parent.full_name}
        subtitle={`${parent.relationship_label} · ${parent.communication_preference} preferred`}
        backHref="/parents"
        backLabel="Back to parents"
        actions={
          isEditing ? (
            <div className="flex items-center gap-2">
              <button
                onClick={cancelEdit}
                className="flex items-center gap-1.5 border border-gray-300 text-gray-600 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50"
              >
                <X className="h-4 w-4" /> Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="flex items-center gap-1.5 bg-brand-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-brand-700 disabled:opacity-60"
              >
                {updateMutation.isPending
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Save className="h-4 w-4" />}
                {updateMutation.isPending ? "Saving…" : "Save changes"}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowEmailModal(true)}
                className="flex items-center gap-1.5 bg-brand-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-brand-700"
              >
                <Mail className="h-4 w-4" /> Send email
              </button>
              <button
                onClick={startEdit}
                className="flex items-center gap-1.5 border border-gray-300 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50"
              >
                <Edit2 className="h-4 w-4" /> Edit profile
              </button>
            </div>
          )
        }
      />

      <div className="space-y-6">
        {/* Profile card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start gap-5">
            {/* Avatar */}
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-brand-700 text-xl font-bold">
              {parent.first_name[0]}{parent.last_name[0]}
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-gray-900">{parent.full_name}</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {parent.relationship_label} · Joined {new Date(parent.created_at).toLocaleDateString("en-GB", { year: "numeric", month: "long" })}
              </p>
            </div>
          </div>

          {/* Details grid */}
          <div className="mt-6 grid grid-cols-2 gap-6">
            {/* First name */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                First name
              </label>
              {displayForm ? (
                <input
                  value={form!.first_name}
                  onChange={(e) => setForm({ ...form!, first_name: e.target.value })}
                  className={inputCn}
                />
              ) : (
                <p className="text-sm text-gray-900">{parent.first_name}</p>
              )}
            </div>

            {/* Last name */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Last name
              </label>
              {displayForm ? (
                <input
                  value={form!.last_name}
                  onChange={(e) => setForm({ ...form!, last_name: e.target.value })}
                  className={inputCn}
                />
              ) : (
                <p className="text-sm text-gray-900">{parent.last_name}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Phone number
              </label>
              {displayForm ? (
                <input
                  value={form!.phone}
                  onChange={(e) => setForm({ ...form!, phone: e.target.value })}
                  placeholder="e.g. 07700 900000"
                  className={inputCn}
                />
              ) : (
                <p className="text-sm text-gray-900 flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-gray-400" />
                  {parent.phone ? (
                    <a href={`tel:${parent.phone}`} className="text-brand-600 hover:underline">{parent.phone}</a>
                  ) : (
                    <span className="text-gray-400 italic">Not recorded</span>
                  )}
                </p>
              )}
            </div>

            {/* Relationship */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Relationship
              </label>
              {displayForm ? (
                <select
                  value={form!.relationship_label}
                  onChange={(e) => setForm({ ...form!, relationship_label: e.target.value })}
                  className={inputCn}
                >
                  {RELATIONSHIP_LABELS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              ) : (
                <p className="text-sm text-gray-900">{parent.relationship_label}</p>
              )}
            </div>

            {/* Communication preference */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Communication preference
              </label>
              {displayForm ? (
                <select
                  value={form!.communication_preference}
                  onChange={(e) => setForm({ ...form!, communication_preference: e.target.value })}
                  className={inputCn}
                >
                  {COMM_PREFS.map((c) => (
                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
              ) : (
                <p className="text-sm text-gray-900 capitalize">{parent.communication_preference}</p>
              )}
            </div>

            {/* User ID (read-only) */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Portal account
              </label>
              <p className="text-sm text-gray-900 flex items-center gap-1.5">
                {parent.user_id ? (
                  <span className="flex items-center gap-1 text-green-700 bg-green-50 px-2 py-0.5 rounded-full text-xs font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Active portal account
                  </span>
                ) : (
                  <span className="text-gray-400 italic text-xs">No portal account</span>
                )}
              </p>
            </div>
          </div>

          {updateMutation.isError && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <p className="text-sm text-red-700">
                {(updateMutation.error as { response?: { data?: { detail?: string } } })?.response?.data?.detail
                  ?? "Failed to save changes."}
              </p>
            </div>
          )}
        </div>

        {/* Contact details card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Mail className="h-4 w-4 text-brand-600" /> Contact Details
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="font-medium">Email</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-900">{parent.user_id ? "Registered" : "Not available"}</span>
                <button
                  onClick={() => setShowEmailModal(true)}
                  className="text-xs text-brand-600 hover:text-brand-700 font-medium hover:underline"
                >
                  Send message →
                </button>
              </div>
            </div>
            {parent.phone && (
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">Phone</span>
                </div>
                <a href={`tel:${parent.phone}`} className="text-sm text-brand-600 hover:underline">
                  {parent.phone}
                </a>
              </div>
            )}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-medium">Preferred contact</span>
              </div>
              <span className="text-sm text-gray-900 capitalize">{parent.communication_preference}</span>
            </div>
          </div>
        </div>

        {/* Linked students */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-brand-600" /> Linked Students
          </h2>

          {unlinkableStudents.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No students linked yet.</p>
          ) : (
            <div className="space-y-2 mb-4">
              {unlinkableStudents.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {s.first_name?.[0]}{s.last_name?.[0] ?? ""}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{s.full_name}</p>
                      <p className="text-xs text-gray-500">{s.year_group} {s.key_stage ? `· ${s.key_stage}` : ""}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <a
                      href={`/students/${s.id}`}
                      className="text-xs text-brand-600 hover:underline"
                    >
                      View profile →
                    </a>
                    <button
                      onClick={() => unlinkMutation.mutate(s.id)}
                      disabled={unlinkMutation.isPending}
                      className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                      title="Unlink this student"
                    >
                      <Unlink className="h-3.5 w-3.5" /> Unlink
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Link new student */}
          {linkableStudents.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Link another student</p>
              <div className="flex gap-2">
                <select
                  value={linkStudentId}
                  onChange={(e) => setLinkStudentId(e.target.value)}
                  className={cn(inputCn, "flex-1")}
                >
                  <option value="">Select student…</option>
                  {linkableStudents.map((s) => (
                    <option key={s.id} value={s.id}>{s.full_name} — {s.year_group}</option>
                  ))}
                </select>
                <button
                  onClick={handleLinkStudent}
                  disabled={!linkStudentId || linkSaving}
                  className="flex items-center gap-1.5 bg-brand-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-brand-700 disabled:opacity-60 flex-shrink-0"
                >
                  {linkSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <LinkIcon className="h-4 w-4" />}
                  Link
                </button>
              </div>
              {linkError && <p className="text-xs text-red-600 mt-1">{linkError}</p>}
            </div>
          )}
        </div>
      </div>

      {/* Email compose modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Send className="h-5 w-5 text-brand-600" />
                Email {parent.first_name}
              </h2>
              <button
                onClick={() => { setShowEmailModal(false); setEmailSent(false); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {emailSent ? (
              <div className="flex flex-col items-center justify-center py-8 gap-3">
                <CheckCircle className="h-12 w-12 text-brand-500" />
                <p className="text-gray-700 font-medium">Email sent successfully!</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="e.g. Update on this week's sessions"
                    className={inputCn}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Message
                  </label>
                  <textarea
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    placeholder="Write your message here…"
                    rows={6}
                    className={cn(inputCn, "resize-none")}
                  />
                </div>

                {emailMutation.isError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                    <p className="text-sm text-red-700">Failed to send email. Please try again.</p>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowEmailModal(false)}
                    className="border border-gray-300 text-gray-600 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => emailMutation.mutate({ subject: emailSubject, body: emailBody })}
                    disabled={!emailSubject.trim() || !emailBody.trim() || emailMutation.isPending}
                    className="flex items-center gap-1.5 bg-brand-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-brand-700 disabled:opacity-60"
                  >
                    {emailMutation.isPending
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <Send className="h-4 w-4" />}
                    {emailMutation.isPending ? "Sending…" : "Send email"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
