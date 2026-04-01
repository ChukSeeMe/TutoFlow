"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Brain, Mail, Phone, MapPin, Clock, ArrowLeft, CheckCircle2, Send, Twitter, Linkedin } from "lucide-react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

function NavThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-9 w-9 rounded-lg skeleton" />;
  const isDark = theme === "dark";
  function toggle() {
    const html = document.documentElement;
    html.classList.add("transitioning");
    setTheme(isDark ? "light" : "dark");
    setTimeout(() => html.classList.remove("transitioning"), 220);
  }
  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-[rgb(var(--border))/40] bg-[rgb(var(--bg-card))]/60 text-[rgb(var(--text-secondary))] transition-colors hover:bg-[rgb(var(--bg-card))] hover:text-[rgb(var(--text))]"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add("visible"); obs.disconnect(); } },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useReveal();
  return (
    <div ref={ref} className={`reveal ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

const CONTACT_METHODS = [
  {
    icon: Mail,
    label: "Email",
    value: "hello@tutorflow.co.uk",
    detail: "We aim to reply within one business day.",
    href: "mailto:hello@tutorflow.co.uk",
    color: "bg-indigo-500/15 text-indigo-400",
  },
  {
    icon: Phone,
    label: "Phone / WhatsApp",
    value: "+44 7700 000000",
    detail: "Mon – Fri, 9am – 6pm GMT.",
    href: "tel:+447700000000",
    color: "bg-violet-500/15 text-violet-400",
  },
  {
    icon: MapPin,
    label: "Location",
    value: "United Kingdom",
    detail: "Serving tutors across England, Wales & Scotland.",
    href: undefined,
    color: "bg-emerald-500/15 text-emerald-400",
  },
  {
    icon: Clock,
    label: "Response time",
    value: "< 24 hours",
    detail: "We read every message personally.",
    href: undefined,
    color: "bg-amber-500/15 text-amber-400",
  },
];

const REASONS = [
  "Request a free guided demo",
  "Ask about pricing & plans",
  "Report a bug or technical issue",
  "Feature request or feedback",
  "Partnership or press enquiry",
  "General question",
];

type FormState = "idle" | "submitting" | "success" | "error";

export default function ContactPage() {
  const [reason, setReason] = useState(REASONS[0]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [formState, setFormState] = useState<FormState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormState("submitting");
    setErrorMsg("");

    // Basic validation
    if (!name.trim() || !email.trim() || !message.trim()) {
      setErrorMsg("Please fill in all fields.");
      setFormState("error");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg("Please enter a valid email address.");
      setFormState("error");
      return;
    }
    if (message.trim().length < 10) {
      setErrorMsg("Please write a bit more in your message.");
      setFormState("error");
      return;
    }

    // Simulate submission (replace with real API call when backend endpoint exists)
    await new Promise(r => setTimeout(r, 1000));
    setFormState("success");
  }

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))] text-[rgb(var(--text))]">

      {/* Animated background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="bg-dot-grid absolute inset-0 opacity-30" />
        <div className="blob blob-1 -left-40 -top-40 h-[500px] w-[500px] bg-indigo-500/[0.06]" />
        <div className="blob blob-2 -right-20 bottom-20 h-[400px] w-[400px] bg-violet-500/[0.06]" />
      </div>

      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-[rgb(var(--border))/15] bg-[rgb(var(--bg))]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3.5">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 shadow-lg shadow-indigo-500/30">
              <Brain className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">TutorFlow</span>
          </Link>
          <div className="flex items-center gap-3">
            <NavThemeToggle />
            <Link
              href="/"
              className="hidden items-center gap-1.5 text-sm text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text))] transition-colors sm:flex"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to home
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-24 pt-16">

        {/* Header */}
        <Reveal>
          <div className="mb-14 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-400/25 bg-indigo-500/10 px-4 py-1.5 text-sm font-medium text-indigo-400">
              <Mail className="h-3.5 w-3.5" /> We&apos;d love to hear from you
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">Contact TutorFlow</h1>
            <p className="mx-auto mt-4 max-w-lg text-lg leading-relaxed text-[rgb(var(--text-secondary))]">
              Whether you want a demo, have a question, or just want to say hello — we&apos;re a small UK team and we personally read every message.
            </p>
          </div>
        </Reveal>

        {/* Contact method cards */}
        <Reveal>
          <div className="mb-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CONTACT_METHODS.map(({ icon: Icon, label, value, detail, href, color }) => (
              <div key={label} className="rounded-2xl border border-[rgb(var(--border))/15] bg-[rgb(var(--bg-card))] p-5">
                <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl ${color}`}>
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--text-tertiary))]">{label}</p>
                {href ? (
                  <a href={href} className="mt-1 block text-sm font-semibold text-indigo-400 hover:underline">{value}</a>
                ) : (
                  <p className="mt-1 text-sm font-semibold">{value}</p>
                )}
                <p className="mt-1.5 text-xs leading-relaxed text-[rgb(var(--text-tertiary))]">{detail}</p>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Main grid: form + info */}
        <div className="grid gap-8 lg:grid-cols-5">

          {/* Contact form */}
          <Reveal className="lg:col-span-3">
            <div className="rounded-3xl border border-[rgb(var(--border))/15] bg-[rgb(var(--bg-card))] p-8">
                <h2 className="mb-6 text-xl font-bold">Send us a message</h2>

                {formState === "success" ? (
                  <div className="flex flex-col items-center py-12 text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/15">
                      <CheckCircle2 className="h-8 w-8 text-green-400" />
                    </div>
                    <h3 className="text-xl font-bold">Message sent!</h3>
                    <p className="mt-2 text-sm text-[rgb(var(--text-secondary))]">
                      Thank you, {name.split(" ")[0]}. We&apos;ll get back to you at <span className="font-medium text-indigo-400">{email}</span> within one business day.
                    </p>
                    <button
                      onClick={() => { setFormState("idle"); setName(""); setEmail(""); setMessage(""); }}
                      className="mt-6 rounded-xl border border-[rgb(var(--border))/20] px-5 py-2 text-sm font-medium hover:bg-[rgb(var(--bg-elevated))] transition-colors"
                    >
                      Send another message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                    {/* Reason */}
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">Reason for contact</label>
                      <select
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        className="w-full rounded-xl border border-[rgb(var(--border))/20] bg-[rgb(var(--bg-elevated))] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      >
                        {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>

                    {/* Name + email */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-sm font-medium">Full name</label>
                        <input
                          type="text"
                          value={name}
                          onChange={e => setName(e.target.value)}
                          placeholder="Jane Smith"
                          className="w-full rounded-xl border border-[rgb(var(--border))/20] bg-[rgb(var(--bg-elevated))] px-4 py-2.5 text-sm placeholder:text-[rgb(var(--text-tertiary))] focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                          required
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium">Email address</label>
                        <input
                          type="email"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          placeholder="jane@example.co.uk"
                          className="w-full rounded-xl border border-[rgb(var(--border))/20] bg-[rgb(var(--bg-elevated))] px-4 py-2.5 text-sm placeholder:text-[rgb(var(--text-tertiary))] focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                          required
                        />
                      </div>
                    </div>

                    {/* Message */}
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">Message</label>
                      <textarea
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        rows={5}
                        placeholder="Tell us what you're working on or what you'd like to know…"
                        className="w-full resize-none rounded-xl border border-[rgb(var(--border))/20] bg-[rgb(var(--bg-elevated))] px-4 py-3 text-sm placeholder:text-[rgb(var(--text-tertiary))] focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        required
                      />
                    </div>

                    {/* Error */}
                    {formState === "error" && (
                      <p className="rounded-lg bg-red-500/10 px-4 py-2.5 text-sm text-red-400">{errorMsg}</p>
                    )}

                    <button
                      type="submit"
                      disabled={formState === "submitting"}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {formState === "submitting" ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Sending…
                        </>
                      ) : (
                        <><Send className="h-4 w-4" /> Send message</>
                      )}
                    </button>
                  </form>
                )}
              </div>
          </Reveal>

          {/* Right column */}
          <Reveal delay={100} className="lg:col-span-2">
            <div className="space-y-5">

              {/* What to expect */}
              <div className="rounded-2xl border border-[rgb(var(--border))/15] bg-[rgb(var(--bg-card))] p-6">
                <h3 className="mb-4 font-semibold">What to expect</h3>
                <ul className="space-y-3">
                  {[
                    "Personal reply within one business day",
                    "Guided demo booked at your convenience",
                    "No sales pressure — just honest conversation",
                    "UK-based support team who know tutoring",
                  ].map(item => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-[rgb(var(--text-secondary))]">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Find us online */}
              <div className="rounded-2xl border border-[rgb(var(--border))/15] bg-[rgb(var(--bg-card))] p-6">
                <h3 className="mb-4 font-semibold">Find us online</h3>
                <div className="space-y-3">
                  <a
                    href="https://twitter.com/tutorflow_uk"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-xl border border-[rgb(var(--border))/15] px-4 py-3 text-sm hover:border-indigo-500/30 hover:bg-[rgb(var(--bg-elevated))] transition-all group"
                  >
                    <Twitter className="h-4 w-4 text-sky-400" />
                    <span className="flex-1 font-medium">@tutorflow_uk</span>
                    <span className="text-xs text-[rgb(var(--text-tertiary))] group-hover:text-indigo-400 transition-colors">Twitter / X →</span>
                  </a>
                  <a
                    href="https://linkedin.com/company/tutorflow"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-xl border border-[rgb(var(--border))/15] px-4 py-3 text-sm hover:border-indigo-500/30 hover:bg-[rgb(var(--bg-elevated))] transition-all group"
                  >
                    <Linkedin className="h-4 w-4 text-blue-400" />
                    <span className="flex-1 font-medium">TutorFlow</span>
                    <span className="text-xs text-[rgb(var(--text-tertiary))] group-hover:text-indigo-400 transition-colors">LinkedIn →</span>
                  </a>
                </div>
              </div>

              {/* Quick links */}
              <div className="rounded-2xl border border-[rgb(var(--border))/15] bg-[rgb(var(--bg-card))] p-6">
                <h3 className="mb-4 font-semibold">Quick links</h3>
                <div className="space-y-2">
                  {[
                    { label: "Sign in to TutorFlow", href: "/login" },
                    { label: "View features",        href: "/#features" },
                    { label: "See the portals",      href: "/#portals" },
                    { label: "FAQ",                  href: "/#faq" },
                  ].map(({ label, href }) => (
                    <Link
                      key={label}
                      href={href}
                      className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-elevated))] hover:text-[rgb(var(--text))] transition-all"
                    >
                      {label}
                      <span className="text-[rgb(var(--text-tertiary))]">→</span>
                    </Link>
                  ))}
                </div>
              </div>

            </div>
          </Reveal>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[rgb(var(--border))/15] px-6 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 text-sm text-[rgb(var(--text-tertiary))] md:flex-row md:justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-indigo-600">
              <Brain className="h-3 w-3 text-white" />
            </div>
            <span className="font-semibold text-[rgb(var(--text))]">TutorFlow</span>
            <span>· UK Tutoring Operating System</span>
          </div>
          <span>© {new Date().getFullYear()} TutorFlow. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
