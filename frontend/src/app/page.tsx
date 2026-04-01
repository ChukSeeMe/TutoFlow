"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import {
  Brain, BookOpen, Users, BarChart3, ArrowRight,
  GraduationCap, Sparkles, CheckCircle2, Star,
  TrendingUp, FileText, MessageSquare, Zap, Moon, Sun,
  Mail, Phone, MapPin, Shield, Clock, ChevronDown,
  Award, Cpu, Lock,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth";

/* ── Theme toggle (inline, no extra import weight) ─────────────────────── */
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

/* ── FAQ accordion ──────────────────────────────────────────────────────── */
const FAQS = [
  { q: "Who is TutorFlow designed for?", a: "TutorFlow is built for UK-based tutors — from sole traders running a handful of students to small tutoring businesses. It covers KS1 through A-Level across all major subjects." },
  { q: "Is my data safe and GDPR compliant?", a: "Yes. TutorFlow is hosted in the UK/EU and built with privacy-first principles. Student data is encrypted at rest, access is role-restricted, and you can export or delete data at any time." },
  { q: "Do I need to pay extra for AI features?", a: "AI lesson planning, homework generation, and report writing are included in all plans. There are no hidden per-usage fees." },
  { q: "Can parents and students access their own portal?", a: "Yes. Each user gets a dedicated portal. Students can view homework, take assessments, and track progress. Parents can read session summaries and download reports." },
  { q: "What curriculum does TutorFlow support?", a: "The platform is aligned to the English National Curriculum from KS1 through KS5, including GCSE and A-Level specifications for the major UK exam boards." },
  { q: "Can I try it before committing?", a: "Get in touch via our contact page and we'll set up a guided demo at a time that suits you." },
];

function FAQ() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="space-y-2">
      {FAQS.map((faq, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-[rgb(var(--border))/20] bg-[rgb(var(--bg-card))]">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between px-6 py-4 text-left text-sm font-semibold text-[rgb(var(--text))] hover:bg-[rgb(var(--bg-elevated))] transition-colors"
          >
            {faq.q}
            <ChevronDown className={`h-4 w-4 shrink-0 text-[rgb(var(--text-secondary))] transition-transform duration-200 ${open === i ? "rotate-180" : ""}`} />
          </button>
          {open === i && (
            <div className="border-t border-[rgb(var(--border))/10] px-6 py-4 text-sm leading-relaxed text-[rgb(var(--text-secondary))]">
              {faq.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Scroll-reveal hook ─────────────────────────────────────────────────── */
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

/* ── Reveal wrapper ─────────────────────────────────────────────────────── */
function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useReveal();
  return (
    <div ref={ref} className="reveal" style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
export default function Home() {
  const { isAuthenticated, role } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!mounted) return;
    if (isAuthenticated) {
      if (role === "tutor")        router.replace("/dashboard");
      else if (role === "student") router.replace("/student/dashboard");
      else if (role === "parent")  router.replace("/parent/dashboard");
      else if (role === "admin")   router.replace("/admin/dashboard");
    }
  }, [mounted, isAuthenticated, role, router]);

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))] text-[rgb(var(--text))]">

      {/* ── ANIMATED BACKGROUND ───────────────────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        {/* Dot grid — visible in both themes */}
        <div className="bg-dot-grid absolute inset-0" />
        {/* Floating blobs — high enough opacity to be clearly visible */}
        <div className="blob blob-1 -left-52 -top-52 h-[750px] w-[750px]" style={{ background: "rgba(99,102,241,0.28)" }} />
        <div className="blob blob-2 -right-40 top-20 h-[650px] w-[650px]"  style={{ background: "rgba(139,92,246,0.22)" }} />
        <div className="blob blob-3 bottom-0 left-1/3 h-[550px] w-[550px]" style={{ background: "rgba(59,130,246,0.18)" }} />
        {/* Top hairline glow */}
        <div className="absolute left-1/2 top-0 h-[2px] w-[700px] -translate-x-1/2 bg-gradient-to-r from-transparent via-indigo-500/80 to-transparent" />
      </div>

      {/* ── NAV ───────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-[rgb(var(--border))/15] bg-[rgb(var(--bg))]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 shadow-lg shadow-indigo-500/30">
              <Brain className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">TutorFlow</span>
          </div>

          <nav className="hidden items-center gap-7 text-sm font-medium text-[rgb(var(--text-secondary))] md:flex">
            <a href="#features"     className="hover:text-[rgb(var(--text))] transition-colors">Features</a>
            <a href="#portals"      className="hover:text-[rgb(var(--text))] transition-colors">Portals</a>
            <a href="#how-it-works" className="hover:text-[rgb(var(--text))] transition-colors">How it works</a>
            <a href="#faq"          className="hover:text-[rgb(var(--text))] transition-colors">FAQ</a>
            <Link href="/contact"   className="hover:text-[rgb(var(--text))] transition-colors">Contact</Link>
          </nav>

          <div className="flex items-center gap-2">
            <NavThemeToggle />
            <Link
              href="/login"
              className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow shadow-indigo-500/30 hover:bg-indigo-500 transition-all hover:-translate-y-px"
            >
              Sign in
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 pb-0 pt-20 text-center">
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-400/25 bg-indigo-500/10 px-4 py-1.5 text-sm font-medium text-indigo-400">
              <Sparkles className="h-3.5 w-3.5" />
              Built for UK tutors &amp; tutoring businesses
            </div>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="mt-2 text-5xl font-extrabold leading-[1.12] tracking-tight md:text-[3.75rem]">
              The smarter way{" "}
              <span className="text-gradient">to tutor</span>
              <br />in the UK
            </h1>
          </Reveal>

          <Reveal delay={160}>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-[rgb(var(--text-secondary))]">
              AI lesson planning, student progress tracking, parent communication
              and session management — all in one platform aligned to the UK curriculum.
            </p>
          </Reveal>

          <Reveal delay={240}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-7 py-3.5 text-sm font-semibold text-white shadow-xl shadow-indigo-500/30 hover:bg-indigo-500 transition-all hover:-translate-y-0.5 hover:shadow-indigo-500/40"
              >
                Get started free <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center gap-2 rounded-xl border border-[rgb(var(--border))/30] bg-[rgb(var(--bg-card))]/60 px-7 py-3.5 text-sm font-semibold backdrop-blur hover:bg-[rgb(var(--bg-card))] transition-colors"
              >
                See how it works
              </a>
            </div>
          </Reveal>

          <Reveal delay={300}>
            <div className="mt-6 flex items-center justify-center gap-1.5">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-sm text-[rgb(var(--text-secondary))]">
                Loved by tutors across England &amp; Wales
              </span>
            </div>
          </Reveal>
        </div>

        {/* Browser mockup */}
        <Reveal delay={200}>
          <div className="relative mx-auto mt-14 max-w-5xl">
            <div className="absolute -bottom-10 left-1/2 h-40 w-3/4 -translate-x-1/2 rounded-full bg-indigo-500/20 blur-3xl" />
            <div className="relative overflow-hidden rounded-2xl border border-white/10 shadow-2xl shadow-black/40">
              <div className="flex items-center gap-2 border-b border-white/8 bg-[rgb(var(--bg-card))] px-4 py-3">
                <span className="h-3 w-3 rounded-full bg-red-400/80" />
                <span className="h-3 w-3 rounded-full bg-amber-400/80" />
                <span className="h-3 w-3 rounded-full bg-green-400/80" />
                <div className="mx-auto flex items-center gap-2 rounded-md bg-[rgb(var(--bg-subtle))]/60 px-4 py-1 text-xs text-[rgb(var(--text-tertiary))]">
                  <span className="h-2 w-2 rounded-full bg-green-400" />
                  app.tutorflow.co.uk/dashboard
                </div>
              </div>
              {/* ── Illustrated TutorFlow dashboard mockup ── */}
              <div className="relative flex h-72 w-full overflow-hidden bg-[#0e0e1a] md:h-[420px]">

                {/* Sidebar */}
                <div className="hidden w-40 flex-shrink-0 flex-col border-r border-white/[0.06] bg-[#09090f] md:flex">
                  <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
                    <div className="flex h-5 w-5 items-center justify-center rounded-md bg-indigo-600">
                      <Brain className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-[11px] font-bold text-white">TutorFlow</span>
                  </div>
                  <nav className="flex-1 space-y-0.5 px-2 py-3">
                    {[
                      { label: "Dashboard",  active: true  },
                      { label: "Students",   active: false },
                      { label: "Lessons",    active: false },
                      { label: "Sessions",   active: false },
                      { label: "Progress",   active: false },
                      { label: "Reports",    active: false },
                    ].map(({ label, active }) => (
                      <div key={label} className={`rounded-lg px-3 py-1.5 text-[10px] font-medium ${active ? "bg-indigo-600/20 text-indigo-300" : "text-zinc-500 hover:text-zinc-300"}`}>
                        {label}
                      </div>
                    ))}
                  </nav>
                  <div className="border-t border-white/[0.06] p-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[9px] font-bold text-white">SM</div>
                      <div>
                        <p className="text-[10px] font-semibold text-zinc-200">Sarah M.</p>
                        <p className="text-[9px] text-zinc-500">Tutor</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main content */}
                <div className="flex flex-1 flex-col overflow-hidden p-4 md:p-5">

                  {/* Header */}
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <p className="text-sm font-bold text-white">Good morning, Sarah 👋</p>
                      <p className="text-[10px] text-zinc-400">You have 3 sessions today · 2 homework to review</p>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-[10px] font-medium text-indigo-300">
                      <Sparkles className="h-3 w-3" /> AI ready
                    </div>
                  </div>

                  {/* Stat cards */}
                  <div className="mb-4 grid grid-cols-3 gap-2 md:gap-3">
                    {[
                      { label: "Students",  value: "12",  sub: "+2 this term",   color: "text-indigo-400",  dot: "bg-indigo-500" },
                      { label: "Sessions",  value: "47",  sub: "This term",       color: "text-violet-400", dot: "bg-violet-500" },
                      { label: "Reports",   value: "8",   sub: "Ready to send",   color: "text-emerald-400",dot: "bg-emerald-500" },
                    ].map(({ label, value, sub, color, dot }) => (
                      <div key={label} className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-3">
                        <div className={`flex items-center gap-1.5 text-[9px] font-medium text-zinc-500`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${dot}`} /> {label}
                        </div>
                        <p className={`mt-1 text-xl font-bold ${color}`}>{value}</p>
                        <p className="text-[9px] text-zinc-500">{sub}</p>
                      </div>
                    ))}
                  </div>

                  {/* Bottom row */}
                  <div className="grid flex-1 grid-cols-2 gap-3 min-h-0">

                    {/* Students */}
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-3 flex flex-col">
                      <p className="mb-2 text-[10px] font-semibold text-zinc-300">My students</p>
                      <div className="flex-1 space-y-2 overflow-hidden">
                        {[
                          { name: "Amara J.",  age: "Y9",  pct: 82, color: "bg-indigo-500" },
                          { name: "Leo K.",    age: "Y11", pct: 65, color: "bg-violet-500" },
                          { name: "Priya S.",  age: "Y7",  pct: 91, color: "bg-emerald-500" },
                          { name: "Daniel O.", age: "Y10", pct: 48, color: "bg-amber-500" },
                        ].map(({ name, age, pct, color }) => (
                          <div key={name} className="flex items-center gap-2">
                            <div className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full ${color} text-[8px] font-bold text-white`}>
                              {name[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] font-medium text-zinc-200 truncate">{name}</span>
                                <span className="text-[8px] text-zinc-500 ml-1">{age}</span>
                              </div>
                              <div className="mt-0.5 h-1 w-full overflow-hidden rounded-full bg-white/10">
                                <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                            <span className="text-[9px] text-zinc-400">{pct}%</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Today's sessions */}
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-3 flex flex-col">
                      <p className="mb-2 text-[10px] font-semibold text-zinc-300">Today&apos;s sessions</p>
                      <div className="flex-1 space-y-2 overflow-hidden">
                        {[
                          { name: "Amara J.",  time: "9:00 am",  subject: "Maths GCSE",     status: "bg-green-500" },
                          { name: "Leo K.",    time: "11:30 am", subject: "English Lit",     status: "bg-amber-500" },
                          { name: "Priya S.",  time: "2:00 pm",  subject: "Science KS3",     status: "bg-indigo-500" },
                        ].map(({ name, time, subject, status }) => (
                          <div key={name} className="flex items-start gap-2 rounded-lg bg-white/[0.03] px-2 py-1.5">
                            <span className={`mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full ${status}`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-[9px] font-semibold text-zinc-200 truncate">{name}</p>
                              <p className="text-[8px] text-zinc-500">{subject}</p>
                            </div>
                            <span className="text-[8px] text-zinc-400 whitespace-nowrap">{time}</span>
                          </div>
                        ))}
                        {/* AI lesson prompt */}
                        <div className="mt-1 flex items-center gap-1.5 rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-2 py-1.5">
                          <Zap className="h-2.5 w-2.5 flex-shrink-0 text-indigo-400" />
                          <p className="text-[8px] text-indigo-300">Generate today&apos;s lesson plans with AI →</p>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── TRUST BADGES ─────────────────────────────────────────────────── */}
      <section className="mx-auto mt-20 max-w-5xl px-6">
        <Reveal>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-[rgb(var(--text-secondary))]">
            {[
              { icon: Shield,   text: "GDPR compliant" },
              { icon: Award,    text: "UK National Curriculum aligned" },
              { icon: Lock,     text: "Data encrypted at rest" },
              { icon: Cpu,      text: "AI-powered workflows" },
              { icon: Clock,    text: "Real-time sync" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-1.5">
                <Icon className="h-4 w-4 text-indigo-400" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ── STATS BAR ─────────────────────────────────────────────────────── */}
      <section className="mx-auto mt-10 max-w-5xl px-6">
        <Reveal>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { value: "3 portals",  label: "Tutor, Student & Parent" },
              { value: "AI-powered", label: "Lesson & report generation" },
              { value: "UK aligned", label: "KS1 – KS5 curriculum" },
              { value: "Real-time",  label: "Progress & analytics" },
            ].map(({ value, label }) => (
              <div key={label} className="glass rounded-2xl p-5 text-center">
                <p className="text-xl font-bold text-indigo-400">{value}</p>
                <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">{label}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────────────────── */}
      <section id="features" className="mx-auto mt-28 max-w-6xl px-6">
        <Reveal>
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Everything in one place</h2>
            <p className="mt-3 text-[rgb(var(--text-secondary))]">
              Designed around how UK tutors actually work — from first session to end-of-term report.
            </p>
          </div>
        </Reveal>

        <Reveal>
          <div className="mb-6 overflow-hidden rounded-3xl border border-white/8 bg-[rgb(var(--bg-card))]">
            <div className="grid md:grid-cols-2">
              <div className="flex flex-col justify-center p-10">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15">
                  <Zap className="h-5 w-5 text-indigo-400" />
                </div>
                <h3 className="text-2xl font-bold">AI-powered lesson planning</h3>
                <p className="mt-3 leading-relaxed text-[rgb(var(--text-secondary))]">
                  Generate a fully structured, UK-curriculum-aligned lesson plan in seconds.
                  Just pick the subject, year group, and topic — TutorFlow does the rest.
                </p>
                <ul className="mt-5 space-y-2">
                  {["KS1–KS5 aligned topics", "Differentiated by student level", "Export to PDF instantly"].map(t => (
                    <li key={t} className="flex items-center gap-2 text-sm text-[rgb(var(--text-secondary))]">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-green-400" /> {t}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative min-h-[260px] overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=80&auto=format&fit=crop"
                  alt="Lesson planning"
                  fill
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[rgb(var(--bg-card))] via-transparent to-transparent md:from-transparent" />
              </div>
            </div>
          </div>
        </Reveal>

        <div className="grid gap-6 md:grid-cols-3">
          {[
            { icon: BarChart3,    title: "Progress analytics",     desc: "Track every student's growth with gap analysis, session history, and intervention alerts.", img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80&auto=format&fit=crop", color: "text-violet-400", bg: "bg-violet-500/15" },
            { icon: FileText,     title: "Automated reports",      desc: "Generate professional end-of-term reports for parents with one click. Edit, approve, and share as PDF.", img: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=600&q=80&auto=format&fit=crop", color: "text-blue-400", bg: "bg-blue-500/15" },
            { icon: MessageSquare,title: "Parent communication",   desc: "Keep families updated with session summaries, homework status, and progress milestones.", img: "https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=600&q=80&auto=format&fit=crop", color: "text-emerald-400", bg: "bg-emerald-500/15" },
          ].map(({ icon: Icon, title, desc, img, color, bg }, i) => (
            <Reveal key={title} delay={i * 80}>
              <div className="group flex flex-col overflow-hidden rounded-2xl border border-white/8 bg-[rgb(var(--bg-card))]">
                <div className="relative h-44 overflow-hidden">
                  <Image src={img} alt={title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" unoptimized />
                  <div className="absolute inset-0 bg-gradient-to-t from-[rgb(var(--bg-card))] via-[rgb(var(--bg-card))]/20 to-transparent" />
                </div>
                <div className="p-6">
                  <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl ${bg}`}>
                    <Icon className={`h-4 w-4 ${color}`} />
                  </div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[rgb(var(--text-secondary))]">{desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="mx-auto mt-28 max-w-5xl px-6">
        <Reveal>
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">How it works</h2>
            <p className="mt-3 text-[rgb(var(--text-secondary))]">Up and running in minutes.</p>
          </div>
        </Reveal>
        <div className="relative grid gap-8 md:grid-cols-3">
          <div className="absolute left-0 right-0 top-10 hidden h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent md:block" />
          {[
            { step: "01", icon: Users,     title: "Add your students",   desc: "Set up student profiles with year group, subjects, and learning goals." },
            { step: "02", icon: BookOpen,  title: "Plan & run sessions",  desc: "Generate AI lessons, log observations, and set homework — all in one flow." },
            { step: "03", icon: TrendingUp,title: "Track & report",       desc: "Watch progress charts fill in. Send polished reports to parents at term end." },
          ].map(({ step, icon: Icon, title, desc }, i) => (
            <Reveal key={step} delay={i * 100}>
              <div className="flex flex-col items-center text-center">
                <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full border border-indigo-500/30 bg-[rgb(var(--bg-card))] shadow-lg shadow-indigo-500/10">
                  <Icon className="h-8 w-8 text-indigo-400" />
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">{step}</span>
                </div>
                <h3 className="mt-5 font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[rgb(var(--text-secondary))]">{desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────────── */}
      <section className="mx-auto mt-28 max-w-6xl px-6">
        <Reveal>
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Trusted by UK tutors</h2>
            <p className="mt-3 text-[rgb(var(--text-secondary))]">Real feedback from tutors already using TutorFlow.</p>
          </div>
        </Reveal>
        <div className="grid gap-5 md:grid-cols-3">
          {[
            { name: "Sarah M.", role: "GCSE Maths Tutor, London", quote: "I used to spend 2 hours per week on lesson plans and reports. TutorFlow halved that immediately. The AI doesn't just generate generic content — it actually knows the UK spec.", stars: 5 },
            { name: "James T.", role: "A-Level Biology Tutor, Manchester", quote: "The parent portal is brilliant. Families can see exactly what their child worked on and what's coming up. It's saved me so many WhatsApp messages.", stars: 5 },
            { name: "Priya K.", role: "Primary & KS3 Tutor, Birmingham", quote: "Having a dedicated student portal means my students can complete homework and see their progress independently. They're more motivated than ever.", stars: 5 },
          ].map(({ name, role, quote, stars }, i) => (
            <Reveal key={name} delay={i * 80}>
              <div className="flex flex-col rounded-2xl border border-white/8 bg-[rgb(var(--bg-card))] p-6">
                <div className="mb-3 flex">
                  {[...Array(stars)].map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="flex-1 text-sm leading-relaxed text-[rgb(var(--text-secondary))]">"{quote}"</p>
                <div className="mt-5 border-t border-[rgb(var(--border))/10] pt-4">
                  <p className="text-sm font-semibold">{name}</p>
                  <p className="text-xs text-[rgb(var(--text-tertiary))]">{role}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── PORTALS ──────────────────────────────────────────────────────── */}
      <section id="portals" className="mx-auto mt-28 max-w-6xl px-6">
        <Reveal>
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Three portals. One platform.</h2>
            <p className="mt-3 text-[rgb(var(--text-secondary))]">Every person in the tutoring relationship gets exactly the view they need.</p>
          </div>
        </Reveal>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { label: "Tutor Portal",   role: "For tutors & businesses", img: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=700&q=80&auto=format&fit=crop", perks: ["Lesson & homework builder", "Student progress dashboard", "AI report generation", "Session scheduling"], accent: "indigo" },
            { label: "Student Portal", role: "For learners of all ages",  img: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=700&q=80&auto=format&fit=crop", perks: ["View upcoming homework", "Take quizzes & assessments", "Track personal progress", "Submit reflections"], accent: "violet" },
            { label: "Parent Portal",  role: "For parents & guardians",   img: "https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=700&q=80&auto=format&fit=crop", perks: ["Read session summaries", "Download term reports", "Track child's milestones", "Stay informed"], accent: "emerald" },
          ].map(({ label, role, img, perks, accent }, i) => (
            <Reveal key={label} delay={i * 80}>
              <Link
                href="/login"
                className="group relative flex flex-col overflow-hidden rounded-3xl border border-white/8 bg-[rgb(var(--bg-card))] transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/30"
              >
                <div className="relative h-52 overflow-hidden">
                  <Image src={img} alt={label} fill className="object-cover transition-transform duration-500 group-hover:scale-105" unoptimized />
                  <div className="absolute inset-0 bg-gradient-to-t from-[rgb(var(--bg-card))] via-[rgb(var(--bg-card))]/30 to-transparent" />
                  <div className={`absolute bottom-4 left-4 rounded-full border border-${accent}-400/30 bg-${accent}-500/20 px-3 py-1 text-xs font-semibold text-${accent}-300`}>
                    {role}
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="text-lg font-bold">{label}</h3>
                  <ul className="mt-4 flex-1 space-y-2">
                    {perks.map(p => (
                      <li key={p} className="flex items-center gap-2 text-sm text-[rgb(var(--text-secondary))]">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-green-400" /> {p}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-5 flex items-center gap-1 text-sm font-semibold text-indigo-400 transition-all group-hover:gap-2">
                    Sign in <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section id="faq" className="mx-auto mt-28 max-w-3xl px-6">
        <Reveal>
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Frequently asked questions</h2>
            <p className="mt-3 text-[rgb(var(--text-secondary))]">Everything you need to know before getting started.</p>
          </div>
        </Reveal>
        <Reveal>
          <FAQ />
        </Reveal>
      </section>

      {/* ── CONTACT SECTION ──────────────────────────────────────────────── */}
      <section id="contact" className="mx-auto mt-28 max-w-5xl px-6">
        <Reveal>
          <div className="overflow-hidden rounded-3xl border border-white/8 bg-[rgb(var(--bg-card))]">
            <div className="grid md:grid-cols-2">
              {/* Left — details */}
              <div className="p-10">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15">
                  <Mail className="h-5 w-5 text-indigo-400" />
                </div>
                <h2 className="text-2xl font-bold">Get in touch</h2>
                <p className="mt-3 text-[rgb(var(--text-secondary))] leading-relaxed">
                  Have a question, want a demo, or need support? We're a small UK-based team and always happy to hear from tutors.
                </p>
                <div className="mt-8 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10">
                      <Mail className="h-4 w-4 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Email us</p>
                      <a href="mailto:hello@tutorflow.co.uk" className="text-sm text-indigo-400 hover:underline">hello@tutorflow.co.uk</a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10">
                      <Phone className="h-4 w-4 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Call or WhatsApp</p>
                      <a href="tel:+447700000000" className="text-sm text-indigo-400 hover:underline">+44 7700 000000</a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10">
                      <MapPin className="h-4 w-4 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Based in</p>
                      <p className="text-sm text-[rgb(var(--text-secondary))]">United Kingdom</p>
                    </div>
                  </div>
                </div>
              </div>
              {/* Right — CTA */}
              <div className="flex flex-col items-start justify-center bg-gradient-to-br from-indigo-500/10 via-transparent to-violet-500/10 p-10">
                <h3 className="text-xl font-bold">Book a free demo</h3>
                <p className="mt-3 text-sm leading-relaxed text-[rgb(var(--text-secondary))]">
                  See TutorFlow in action with a guided walkthrough tailored to your tutoring practice. No commitment required.
                </p>
                <Link
                  href="/contact"
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-500 transition-all hover:-translate-y-px"
                >
                  Contact us <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="mx-auto mt-20 max-w-4xl px-6 pb-28">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-600/20 via-[rgb(var(--bg-card))] to-violet-600/15 p-12 text-center">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
              <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" />
            </div>
            <div className="relative">
              <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 shadow-xl shadow-indigo-500/40">
                <GraduationCap className="h-7 w-7 text-white" />
              </div>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Ready to transform your tutoring?
              </h2>
              <p className="mx-auto mt-4 max-w-lg leading-relaxed text-[rgb(var(--text-secondary))]">
                Sign in to your TutorFlow account and experience a smarter, more organised approach to tutoring.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-3.5 font-semibold text-white shadow-xl shadow-indigo-500/30 hover:bg-indigo-500 transition-all hover:-translate-y-0.5"
                >
                  Get started <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-xl border border-[rgb(var(--border))/30] px-8 py-3.5 font-semibold transition-colors hover:bg-[rgb(var(--bg-card))]"
                >
                  Request a demo
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-[rgb(var(--border))/15] px-6 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-600">
                <Brain className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="font-bold">TutorFlow</span>
              <span className="text-sm text-[rgb(var(--text-tertiary))]">· UK Tutoring Operating System</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-[rgb(var(--text-secondary))]">
              <Link href="/login"   className="hover:text-[rgb(var(--text))] transition-colors">Sign in</Link>
              <Link href="/contact" className="hover:text-[rgb(var(--text))] transition-colors">Contact</Link>
              <a href="#faq"        className="hover:text-[rgb(var(--text))] transition-colors">FAQ</a>
              <a href="#features"   className="hover:text-[rgb(var(--text))] transition-colors">Features</a>
            </div>
          </div>
          <div className="mt-6 border-t border-[rgb(var(--border))/10] pt-6 flex flex-col items-center gap-2 md:flex-row md:justify-between text-xs text-[rgb(var(--text-tertiary))]">
            <span>© {new Date().getFullYear()} TutorFlow. All rights reserved.</span>
            <span>Built for tutors, by tutors. 🇬🇧</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
