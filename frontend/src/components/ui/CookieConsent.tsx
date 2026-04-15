"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ConsentPreferences {
  functional: boolean;
  analytics: boolean;
}

interface StoredConsent {
  version: number;
  decided: boolean;
  preferences: ConsentPreferences;
  timestamp: string;
}

const STORAGE_KEY  = "th_cookie_consent";
const CONSENT_VER  = 1; // bump when categories change

function loadConsent(): StoredConsent | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: StoredConsent = JSON.parse(raw);
    if (parsed.version !== CONSENT_VER) return null; // stale — re-ask
    return parsed;
  } catch {
    return null;
  }
}

function saveConsent(prefs: ConsentPreferences) {
  const stored: StoredConsent = {
    version:     CONSENT_VER,
    decided:     true,
    preferences: prefs,
    timestamp:   new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
}

// ── Toggle switch ─────────────────────────────────────────────────────────────

function Toggle({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange?: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
        checked ? "bg-brand-600" : "bg-gray-300 dark:bg-zinc-600",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <span
        className={cn(
          "inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform duration-200",
          checked ? "translate-x-[18px]" : "translate-x-[3px]",
        )}
      />
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function CookieConsent() {
  const [show,      setShow]      = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [managing,  setManaging]  = useState(false);
  const [prefs, setPrefs] = useState<ConsentPreferences>({
    functional: true,
    analytics:  true,
  });

  // Mount: check localStorage
  useEffect(() => {
    const stored = loadConsent();
    if (!stored?.decided) {
      // Small delay so it doesn't flash before hydration settles
      const t = setTimeout(() => setShow(true), 800);
      return () => clearTimeout(t);
    }
    // Already decided — show the small settings cog (bottom-left)
  }, []);

  function acceptAll() {
    saveConsent({ functional: true, analytics: true });
    setShow(false);
    setManaging(false);
    setShowPanel(false);
  }

  function rejectNonEssential() {
    saveConsent({ functional: false, analytics: false });
    setShow(false);
    setManaging(false);
    setShowPanel(false);
  }

  function savePreferences() {
    saveConsent(prefs);
    setShow(false);
    setManaging(false);
    setShowPanel(false);
  }

  function openSettings() {
    const stored = loadConsent();
    if (stored) setPrefs(stored.preferences);
    setShowPanel((v) => !v);
  }

  const CATEGORIES = [
    {
      id:       "necessary" as const,
      label:    "Strictly Necessary",
      desc:     "Required for authentication, session management, and CSRF protection. Cannot be disabled.",
      required: true,
      checked:  true,
    },
    {
      id:       "functional" as const,
      label:    "Functional & Preferences",
      desc:     "Remembers your light/dark mode preference and sidebar state across visits.",
      required: false,
      checked:  prefs.functional,
    },
    {
      id:       "analytics" as const,
      label:    "Analytics",
      desc:     "Anonymous, aggregated usage data to help us improve the platform. No cross-site tracking.",
      required: false,
      checked:  prefs.analytics,
    },
  ];

  return (
    <>
      {/* ── Main banner ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {show && (
          <motion.div
            role="dialog"
            aria-label="Cookie consent"
            aria-modal="true"
            className={cn(
              "fixed bottom-4 left-4 right-4 z-[9999] sm:left-auto sm:right-6 sm:bottom-6 sm:w-[420px]",
              "rounded-2xl border shadow-2xl",
              "bg-white dark:bg-[#13131f]",
              "border-gray-200 dark:border-white/[0.09]",
            )}
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={  { opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            style={{ boxShadow: "0 16px 64px -12px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.04)" }}
          >
            {/* Header */}
            <div className="flex items-start gap-3 p-5 pb-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-600 shadow-sm">
                <Cookie className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100 leading-tight">
                  Cookie preferences
                </p>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-zinc-400 leading-relaxed">
                  We use cookies to keep you signed in and improve your experience.{" "}
                  <Link href="/cookies" className="text-brand-600 dark:text-brand-400 hover:underline">Cookie policy</Link>
                  {" · "}
                  <Link href="/privacy" className="text-brand-600 dark:text-brand-400 hover:underline">Privacy policy</Link>
                </p>
              </div>
              <button
                onClick={rejectNonEssential}
                className="shrink-0 h-6 w-6 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors"
                aria-label="Reject non-essential cookies"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Manage preferences accordion */}
            {managing && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22 }}
                className="overflow-hidden border-t border-gray-100 dark:border-white/[0.06]"
              >
                <div className="px-5 py-3 space-y-3">
                  {CATEGORIES.map((cat) => (
                    <div key={cat.id} className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 dark:text-zinc-200 leading-tight">
                          {cat.label}
                          {cat.required && (
                            <span className="ml-1.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                              Always on
                            </span>
                          )}
                        </p>
                        <p className="mt-0.5 text-[11px] text-gray-500 dark:text-zinc-500 leading-relaxed">
                          {cat.desc}
                        </p>
                      </div>
                      <Toggle
                        checked={cat.checked}
                        disabled={cat.required}
                        onChange={(v) => {
                          if (cat.id === "functional") setPrefs((p) => ({ ...p, functional: v }));
                          if (cat.id === "analytics")  setPrefs((p) => ({ ...p, analytics:  v }));
                        }}
                      />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Actions */}
            <div className="px-5 pb-5 pt-3 flex flex-col gap-2">
              <div className="flex gap-2">
                <button
                  onClick={acceptAll}
                  className="flex-1 rounded-lg bg-brand-600 py-2 text-xs font-semibold text-white hover:bg-brand-700 transition-colors"
                >
                  Accept all
                </button>
                {managing ? (
                  <button
                    onClick={savePreferences}
                    className="flex-1 rounded-lg border border-gray-200 dark:border-white/[0.09] py-2 text-xs font-semibold text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors"
                  >
                    Save preferences
                  </button>
                ) : (
                  <button
                    onClick={() => setManaging(true)}
                    className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-gray-200 dark:border-white/[0.09] py-2 text-xs font-semibold text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors"
                  >
                    Manage preferences
                    <ChevronDown className="h-3 w-3" />
                  </button>
                )}
              </div>
              <button
                onClick={rejectNonEssential}
                className="text-center text-[11px] text-gray-400 dark:text-zinc-600 hover:text-gray-600 dark:hover:text-zinc-400 transition-colors"
              >
                Reject non-essential
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Persistent settings cog (shown after decision is made) ──────── */}
      <AnimatePresence>
        {!show && (
          <motion.button
            onClick={openSettings}
            aria-label="Cookie settings"
            title="Cookie settings"
            className={cn(
              "fixed bottom-5 left-5 z-[9998] h-9 w-9",
              "flex items-center justify-center rounded-full",
              "bg-white dark:bg-[#13131f]",
              "border border-gray-200 dark:border-white/[0.09]",
              "text-gray-400 dark:text-zinc-500",
              "hover:text-brand-600 dark:hover:text-brand-400",
              "shadow-md hover:shadow-lg",
              "transition-all duration-150",
            )}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={  { opacity: 0, scale: 0.7 }}
            transition={{ delay: 0.4, type: "spring", stiffness: 300, damping: 24 }}
          >
            <Cookie className="h-4 w-4" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Settings panel (opened from the cog) ────────────────────────── */}
      <AnimatePresence>
        {showPanel && (
          <>
            <motion.div
              className="fixed inset-0 z-[9997] bg-black/30 backdrop-blur-sm"
              onClick={() => setShowPanel(false)}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            />
            <motion.div
              role="dialog"
              aria-label="Cookie settings"
              className={cn(
                "fixed bottom-16 left-5 z-[9998] w-80 rounded-2xl border shadow-2xl",
                "bg-white dark:bg-[#13131f]",
                "border-gray-200 dark:border-white/[0.09]",
              )}
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0,  scale: 1 }}
              exit={  { opacity: 0, y: 8,  scale: 0.96 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <Cookie className="h-4 w-4 text-brand-600" />
                  <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Cookie settings</p>
                </div>
                <button
                  onClick={() => setShowPanel(false)}
                  className="h-6 w-6 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="px-5 py-4 space-y-3">
                {CATEGORIES.map((cat) => (
                  <div key={cat.id} className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 dark:text-zinc-200">
                        {cat.label}
                        {cat.required && (
                          <span className="ml-1.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                            Always on
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 text-[11px] text-gray-500 dark:text-zinc-500 leading-relaxed">{cat.desc}</p>
                    </div>
                    <Toggle
                      checked={cat.checked}
                      disabled={cat.required}
                      onChange={(v) => {
                        if (cat.id === "functional") setPrefs((p) => ({ ...p, functional: v }));
                        if (cat.id === "analytics")  setPrefs((p) => ({ ...p, analytics:  v }));
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className="px-5 pb-5 flex gap-2">
                <button
                  onClick={() => { savePreferences(); setShowPanel(false); }}
                  className="flex-1 rounded-lg bg-brand-600 py-2 text-xs font-semibold text-white hover:bg-brand-700 transition-colors"
                >
                  Save & close
                </button>
                <Link
                  href="/cookies"
                  className="flex items-center justify-center px-3 rounded-lg border border-gray-200 dark:border-white/[0.09] text-xs text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors"
                  onClick={() => setShowPanel(false)}
                >
                  Policy
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
