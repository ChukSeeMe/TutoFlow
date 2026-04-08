"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { studentsApi, usersApi } from "@/lib/api";
import {
  Brain, User, Users, BookOpen, CheckCircle2,
  ArrowRight, ArrowLeft, GraduationCap, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Step definitions ──────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: "Your Profile",    icon: User },
  { id: 2, label: "First Student",   icon: Users },
  { id: 3, label: "Subjects",        icon: BookOpen },
  { id: 4, label: "All Set",         icon: CheckCircle2 },
];

const YEAR_GROUPS = ["Year 7","Year 8","Year 9","Year 10","Year 11","Year 12","Year 13","Adult"];
const KEY_STAGES  = ["KS3","KS4","KS5","College"];
const SUBJECTS    = ["Maths","English","Science","Biology","Chemistry","Physics","History","Geography","French","Spanish","German","Computer Science","Art","Music","RS","Business","Economics","Psychology"];

// ── Input helpers ─────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text" }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full border border-gray-300 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-[#0f0f17] text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
    />
  );
}

function Select({ value, onChange, options, placeholder }: {
  value: string; onChange: (v: string) => void; options: string[]; placeholder?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border border-gray-300 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-[#0f0f17] text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none"
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function SubjectToggle({ subjects, selected, onToggle }: {
  subjects: string[]; selected: string[]; onToggle: (s: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {subjects.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onToggle(s)}
          className={cn(
            "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
            selected.includes(s)
              ? "bg-brand-600 text-white"
              : "bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-white/10"
          )}
        >
          {s}
        </button>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");

  // Step 1 — Tutor profile
  const [bio, setBio] = useState("");

  // Step 2 — First student
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [yearGroup, setYearGroup] = useState("");
  const [keyStage, setKeyStage] = useState("");
  const [skipStudent, setSkipStudent] = useState(false);

  // Step 3 — Subjects
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  const toggleSubject = (s: string) =>
    setSelectedSubjects((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);

  const profileMutation = useMutation({
    mutationFn: () => usersApi.updateProfile({ bio: bio || undefined, subjects_json: selectedSubjects }),
  });

  const studentMutation = useMutation({
    mutationFn: () => studentsApi.create({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      year_group: yearGroup || undefined,
      key_stage: keyStage || undefined,
    }),
  });

  async function handleNext() {
    setError("");

    if (step === 1) {
      setStep(2);
      return;
    }

    if (step === 2) {
      if (!skipStudent) {
        if (!firstName.trim() || !lastName.trim()) {
          setError("Please enter the student's first and last name.");
          return;
        }
        try {
          await studentMutation.mutateAsync();
        } catch {
          setError("Failed to create student. Please try again.");
          return;
        }
      }
      setStep(3);
      return;
    }

    if (step === 3) {
      try {
        await profileMutation.mutateAsync();
      } catch {
        // Non-fatal — profile update optional
      }
      setStep(4);
      return;
    }

    // Step 4 — finish
    router.push("/dashboard");
  }

  const canProceed =
    step === 1 ? true :
    step === 2 ? (skipStudent || (firstName.trim().length > 0 && lastName.trim().length > 0)) :
    step === 3 ? true :
    true;

  const isLoading = studentMutation.isPending || profileMutation.isPending;

  return (
    <div className="min-h-screen bg-[rgb(237_239_248)] dark:bg-[#09090b] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Brand */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="h-8 w-8 rounded-xl bg-brand-gradient flex items-center justify-center shadow-glow-sm">
            <Brain className="h-4.5 w-4.5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900 dark:text-zinc-100">Teach Harbour</span>
        </div>

        {/* Progress strip */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => {
            const done = step > s.id;
            const active = step === s.id;
            return (
              <div key={s.id} className="flex items-center gap-2 flex-1">
                <div className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold transition-all",
                  done ? "bg-brand-600 text-white" :
                  active ? "bg-brand-100 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300 ring-2 ring-brand-500" :
                  "bg-gray-200 dark:bg-white/[0.08] text-gray-400 dark:text-zinc-600"
                )}>
                  {done ? <CheckCircle2 className="h-4 w-4" /> : s.id}
                </div>
                <span className={cn(
                  "text-xs font-medium hidden sm:block",
                  active ? "text-gray-900 dark:text-zinc-100" : "text-gray-400 dark:text-zinc-600"
                )}>
                  {s.label}
                </span>
                {i < STEPS.length - 1 && (
                  <div className={cn("h-px flex-1 mx-1 transition-colors", done ? "bg-brand-400" : "bg-gray-200 dark:bg-white/10")} />
                )}
              </div>
            );
          })}
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-[#16161f] rounded-2xl border border-gray-200 dark:border-white/[0.07] shadow-sm p-8">

          {/* Step 1 — Profile */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-100">Welcome to Teach Harbour</h2>
                <p className="text-sm text-gray-500 dark:text-zinc-500 mt-1">
                  Let&apos;s get you set up in under 2 minutes.
                </p>
              </div>
              <Field label="A short bio (optional)">
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  placeholder="e.g. Experienced Maths tutor specialising in GCSE and A-Level..."
                  className="w-full border border-gray-300 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-[#0f0f17] text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                />
              </Field>
              <div className="bg-brand-50 dark:bg-brand-500/[0.08] rounded-xl p-4 border border-brand-100 dark:border-brand-500/20">
                <p className="text-xs text-brand-700 dark:text-brand-400 font-medium mb-1">What you get</p>
                <ul className="text-xs text-brand-600 dark:text-brand-500 space-y-1">
                  <li>✓ AI-generated lesson plans and homework</li>
                  <li>✓ Automated progress tracking and mastery heatmaps</li>
                  <li>✓ Parent portal with tutor-approved reports</li>
                  <li>✓ Intervention flags and predictive insights</li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 2 — First student */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-100">Add your first student</h2>
                <p className="text-sm text-gray-500 dark:text-zinc-500 mt-1">
                  You can add more students from the Students page later.
                </p>
              </div>
              {!skipStudent && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="First name">
                      <Input value={firstName} onChange={setFirstName} placeholder="e.g. Emily" />
                    </Field>
                    <Field label="Last name">
                      <Input value={lastName} onChange={setLastName} placeholder="e.g. Clarke" />
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Year group">
                      <Select value={yearGroup} onChange={setYearGroup} options={YEAR_GROUPS} placeholder="Select…" />
                    </Field>
                    <Field label="Key stage">
                      <Select value={keyStage} onChange={setKeyStage} options={KEY_STAGES} placeholder="Select…" />
                    </Field>
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={() => setSkipStudent(!skipStudent)}
                className="text-sm text-gray-500 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300 underline"
              >
                {skipStudent ? "Add a student instead" : "Skip for now — I'll add students later"}
              </button>
            </div>
          )}

          {/* Step 3 — Subjects */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-100">What do you teach?</h2>
                <p className="text-sm text-gray-500 dark:text-zinc-500 mt-1">
                  Select all subjects you tutor. This helps with AI lesson generation.
                </p>
              </div>
              <SubjectToggle subjects={SUBJECTS} selected={selectedSubjects} onToggle={toggleSubject} />
              {selectedSubjects.length > 0 && (
                <p className="text-xs text-brand-600 dark:text-brand-400">
                  {selectedSubjects.length} subject{selectedSubjects.length > 1 ? "s" : ""} selected
                </p>
              )}
            </div>
          )}

          {/* Step 4 — Done */}
          {step === 4 && (
            <div className="text-center space-y-4 py-4">
              <div className="h-16 w-16 rounded-full bg-brand-gradient flex items-center justify-center mx-auto shadow-glow">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-100">You&apos;re all set!</h2>
                <p className="text-sm text-gray-500 dark:text-zinc-500 mt-1">
                  Your workspace is ready. Start by planning a lesson or adding more students.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                {[
                  { href: "/students/new", label: "Add student", sub: "Start your roster" },
                  { href: "/lessons/new", label: "Plan a lesson", sub: "AI-powered in seconds" },
                ].map(({ href, label, sub }) => (
                  <a
                    key={href}
                    href={href}
                    className="bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.07] rounded-xl p-4 text-left hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
                  >
                    <p className="font-semibold text-gray-900 dark:text-zinc-100 text-sm">{label}</p>
                    <p className="text-xs text-gray-500 dark:text-zinc-500 mt-0.5">{sub}</p>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-3">{error}</p>
          )}

          {/* Navigation */}
          <div className={cn("flex mt-6 pt-5 border-t border-gray-100 dark:border-white/[0.06]", step > 1 && step < 4 ? "justify-between" : "justify-end")}>
            {step > 1 && step < 4 && (
              <button
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-zinc-500 hover:text-gray-800 dark:hover:text-zinc-200"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
            )}
            {step < 4 && (
              <button
                onClick={handleNext}
                disabled={!canProceed || isLoading}
                className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
              >
                {isLoading ? "Saving…" : step === 3 ? "Finish setup" : "Continue"}
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
            {step === 4 && (
              <button
                onClick={() => router.push("/dashboard")}
                className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                Go to dashboard <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 dark:text-zinc-600 mt-4">
          You can update all of this later from Settings and your Profile.
        </p>
      </div>
    </div>
  );
}
