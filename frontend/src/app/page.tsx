"use client";

/**
 * Teach Harbour — Home Page
 * Visual reference: deep dark navy bg, large morphing purple/fuchsia blob shapes,
 * floating dashboard mockup with 3D-style icons, violet→fuchsia gradient text,
 * glassmorphic feature cards with coloured borders, pill CTA with glow.
 *
 * npm install framer-motion lucide-react clsx tailwind-merge
 * (all already present in package.json)
 */

import { useEffect, useState, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  motion,
  useInView,
  AnimatePresence,
  type Variants,
} from "framer-motion";
import {
  Brain, BookOpen, BarChart3, ArrowRight,
  GraduationCap, Sparkles, CheckCircle2, Star,
  TrendingUp, FileText, MessageSquare, Moon, Sun,
  Mail, Phone, MapPin, Shield, ChevronDown,
  Cpu, Lock, Calendar, Users, Zap,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth";
import { cn } from "@/lib/utils";
import {
  TutorPlanningScene,
  StudentNightScene,
  ParentReviewScene,
} from "@/components/ui/PortalScenes";

/** motion-enhanced Link — preserves Framer Motion variant staggering */
const MotionLink = motion.create(Link);

/* ═══════════════════════════════════════════════════════════════════════════
   ANIMATION VARIANTS
═══════════════════════════════════════════════════════════════════════════ */

/** Hero — staggered on page load (not scroll) */
const heroWrap: Variants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.13, delayChildren: 0.25 } },
};
const heroItem: Variants = {
  hidden:  { opacity: 0, y: 36 },
  visible: { opacity: 1, y: 0,  transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] } },
};

/** Generic scroll-triggered grid */
const scrollGrid: Variants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};
const scrollCard: Variants = {
  hidden:  { opacity: 0, y: 24, scale: 0.97 },
  visible: { opacity: 1, y: 0,  scale: 1, transition: { duration: 0.58, ease: [0.22, 1, 0.36, 1] } },
};

/* ═══════════════════════════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════════════════════════ */

const FAQS = [
  { q: "Who is Teach Harbour designed for?",        a: "Teach Harbour is built for UK-based tutors — from sole traders to small tutoring businesses. It covers KS1 through A-Level across all major subjects." },
  { q: "Is my data safe and GDPR compliant?",   a: "Yes. Teach Harbour is hosted in the UK/EU with privacy-first principles. Student data is encrypted at rest, access is role-restricted, and you can export or delete data at any time." },
  { q: "Do I need to pay extra for AI features?",a: "AI lesson planning, homework generation, and report writing are included in all plans. No hidden per-usage fees." },
  { q: "Can parents and students access their own portal?", a: "Yes. Each user gets a dedicated portal. Students can view homework and track progress. Parents can read session summaries and download reports." },
  { q: "What curriculum does Teach Harbour support?",a: "Aligned to the English National Curriculum from KS1 through KS5, including GCSE and A-Level for major UK exam boards." },
  { q: "Can I try it before committing?",        a: "Get in touch via our contact page and we'll set up a guided demo at a time that suits you." },
];

const FEATURES = [
  { icon: Brain,         title: "AI Lesson Planning",   desc: "Generate structured, curriculum-aligned lesson plans in seconds. Every output awaits your approval.",                    border: "border-violet-500/25",  glow: "rgba(139,92,246,0.28)",  grad: "from-violet-500/12 to-purple-500/5",  ic: "text-violet-400"  },
  { icon: BarChart3,     title: "Progress Analytics",   desc: "Track mastery across topics with visual dashboards. Identify knowledge gaps before they become exam problems.",          border: "border-fuchsia-500/25", glow: "rgba(217,70,239,0.28)",  grad: "from-fuchsia-500/12 to-purple-500/5", ic: "text-fuchsia-400" },
  { icon: FileText,      title: "Automated Reports",    desc: "One-click progress reports personalised for each student. Professional, detailed, and parent-ready instantly.",          border: "border-purple-500/25",  glow: "rgba(168,85,247,0.28)",  grad: "from-purple-500/12 to-violet-500/5",  ic: "text-purple-400"  },
  { icon: MessageSquare, title: "Parent Communication", desc: "Keep parents informed with automatic session summaries. Secure, auditable messaging built right in.",                   border: "border-indigo-500/25",  glow: "rgba(99,102,241,0.28)",  grad: "from-indigo-500/12 to-violet-500/5",  ic: "text-indigo-400"  },
  { icon: Calendar,      title: "Session Management",   desc: "Schedule and track lessons, attendance, and homework from one clean interface. Never lose track of a session again.",   border: "border-violet-500/25",  glow: "rgba(139,92,246,0.28)",  grad: "from-violet-500/12 to-fuchsia-500/5", ic: "text-violet-400"  },
  { icon: TrendingUp,    title: "Intervention Engine",  desc: "Rule-based recommendations flag students who need extra support — triggered automatically before grades drop.",          border: "border-fuchsia-500/25", glow: "rgba(217,70,239,0.28)",  grad: "from-fuchsia-500/12 to-purple-500/5", ic: "text-fuchsia-400" },
];

const STEPS = [
  { icon: GraduationCap, step: "01", title: "Set up your students",   desc: "Add students, link parents, and configure subjects aligned to the UK curriculum in minutes." },
  { icon: Brain,         step: "02", title: "Plan with AI assistance", desc: "Generate lesson plans and homework with Claude AI — every suggestion awaits your approval before use." },
  { icon: TrendingUp,    step: "03", title: "Track and communicate",   desc: "Monitor progress, run assessments, and send polished reports to parents automatically." },
];

const TESTIMONIALS = [
  { name: "Sarah M.", role: "Maths & Science Tutor",    loc: "London",     text: "Teach Harbour has completely transformed how I run my tutoring business. The AI lesson plans alone save me hours every week, and the parent reports are genuinely impressive.", stars: 5 },
  { name: "James K.", role: "English & History Tutor",  loc: "Manchester", text: "The student progress tracking is exceptional. I can see at a glance which topics need more work before exams — something I could never do manually.", stars: 5 },
  { name: "Priya D.", role: "Chemistry & Biology Tutor",loc: "Birmingham", text: "Parents love the automated updates. I've had three new referrals just from parents sharing the professional reports Teach Harbour generates.", stars: 5 },
];

const STATS = [
  { value: 2400, suffix: "+", label: "Sessions tracked"   },
  { value: 98,   suffix: "%", label: "Tutor satisfaction" },
  { value: 12,   suffix: "",  label: "Subjects covered"   },
  { value: 100,  suffix: "%", label: "GDPR compliant"     },
];

const PORTALS = [
  { role: "Tutor",   href: "/dashboard",         icon: GraduationCap, scene: TutorPlanningScene,  border: "border-violet-500/20",  bg: "from-violet-500/8 to-purple-500/4",  glow: "rgba(139,92,246,0.2)",  accent: "text-violet-400",  ctaBg: "bg-violet-500/10 hover:bg-violet-500/20 border-violet-500/20",
    features: ["AI lesson & homework generation", "Student progress heatmaps", "One-click PDF reports", "Parent communication hub", "Curriculum-aligned planning", "Intervention alerts"] },
  { role: "Student", href: "/student/dashboard", icon: BookOpen,       scene: StudentNightScene,   border: "border-fuchsia-500/20", bg: "from-fuchsia-500/8 to-purple-500/4", glow: "rgba(217,70,239,0.2)", accent: "text-fuchsia-400", ctaBg: "bg-fuchsia-500/10 hover:bg-fuchsia-500/20 border-fuchsia-500/20",
    features: ["Personal learning dashboard", "Assigned homework tracker", "Interactive quizzes", "Mastery progress tracking", "Session reflections", "Achievement badges"] },
  { role: "Parent",  href: "/parent/dashboard",  icon: Users,          scene: ParentReviewScene,   border: "border-purple-500/20",  bg: "from-purple-500/8 to-violet-500/4",  glow: "rgba(168,85,247,0.2)",  accent: "text-purple-400",  ctaBg: "bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/20",
    features: ["Live session summaries", "Download progress reports", "Homework status updates", "Attendance timeline", "Secure messaging", "Invoice tracking"] },
];

/** Floating 3D-style icons around the dashboard mockup */
const FLOAT_ICONS = [
  { emoji: "📖", key: "book",   floatLeft: "-9%",  floatTop: "18%",  size: 56, delay: 0,   dur: 4.4, glow: "rgba(99,102,241,0.55)"  },
  { emoji: "🌍", key: "globe",  floatLeft: "97%",  floatTop: "6%",   size: 48, delay: 1.1, dur: 5.0, glow: "rgba(16,185,129,0.55)"  },
  { emoji: "✏️", key: "pencil", floatLeft: "101%", floatTop: "48%",  size: 40, delay: 0.7, dur: 5.7, glow: "rgba(245,158,11,0.55)"  },
  { emoji: "🧠", key: "brain",  floatLeft: "-11%", floatTop: "62%",  size: 54, delay: 0.3, dur: 5.2, glow: "rgba(217,70,239,0.55)"  },
  { emoji: "⚛️", key: "atom",   floatLeft: "99%",  floatTop: "76%",  size: 44, delay: 1.4, dur: 4.8, glow: "rgba(59,130,246,0.55)"  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   HELPER COMPONENTS
═══════════════════════════════════════════════════════════════════════════ */

/** Violet → Fuchsia gradient text — matches image exactly */
function VF({ children }: { children: ReactNode }) {
  return (
    <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
      {children}
    </span>
  );
}

/** Scroll-triggered section reveal */
function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-70px 0px" });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: delay / 1000 }}
    >
      {children}
    </motion.div>
  );
}

/** Count-up number when it scrolls into view */
function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const steps = 60;
    const inc = value / steps;
    let cur = 0;
    const t = setInterval(() => {
      cur = Math.min(cur + inc, value);
      setN(Math.round(cur));
      if (cur >= value) clearInterval(t);
    }, 1400 / steps);
    return () => clearInterval(t);
  }, [inView, value]);
  return <span ref={ref}>{n.toLocaleString()}{suffix}</span>;
}

/** AnimatePresence FAQ accordion */
function FAQ() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="space-y-2">
      {FAQS.map((faq, i) => (
        <motion.div
          key={i}
          className="overflow-hidden rounded-2xl border bg-white/[0.02] backdrop-blur-sm"
          animate={{ borderColor: open === i ? "rgba(168,85,247,0.45)" : "rgba(255,255,255,0.07)" }}
          transition={{ duration: 0.2 }}
        >
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between px-6 py-4 text-left text-sm font-semibold text-gray-100 transition-colors hover:text-white"
          >
            {faq.q}
            <motion.span
              animate={{ rotate: open === i ? 180 : 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="ml-4 shrink-0"
            >
              <ChevronDown className="h-4 w-4 text-gray-500" />
            </motion.span>
          </button>
          <AnimatePresence initial={false}>
            {open === i && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              >
                <p className="border-t border-white/[0.06] px-6 pb-5 pt-4 text-sm leading-relaxed text-gray-400">{faq.a}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
}

/** Theme toggle with AnimatePresence icon swap */
function NavThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-9 w-9 rounded-lg bg-white/5 animate-pulse" />;
  const isDark = theme === "dark";
  function toggle() {
    const html = document.documentElement;
    html.classList.add("transitioning");
    setTheme(isDark ? "light" : "dark");
    setTimeout(() => html.classList.remove("transitioning"), 220);
  }
  return (
    <motion.button
      onClick={toggle}
      aria-label="Toggle theme"
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-gray-400"
      whileHover={{ scale: 1.08, backgroundColor: "rgba(255,255,255,0.10)" }}
      whileTap={{ scale: 0.93 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={isDark ? "sun" : "moon"}
          initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
          animate={{ rotate: 0,   opacity: 1, scale: 1   }}
          exit={  { rotate:  90, opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.18 }}
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </motion.div>
      </AnimatePresence>
    </motion.button>
  );
}

/** Single floating 3D-style icon around the dashboard */
function FloatIcon({ emoji, floatLeft, floatTop, size, delay, dur, glow }: typeof FLOAT_ICONS[0]) {
  return (
    <motion.div
      className="absolute z-20 flex items-center justify-center rounded-2xl pointer-events-none"
      style={{
        left: floatLeft,
        top: floatTop,
        width: size,
        height: size,
        fontSize: size * 0.48,
        background: "rgba(255,255,255,0.055)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        border: "1px solid rgba(255,255,255,0.13)",
        boxShadow: `0 0 28px -4px ${glow}, 0 4px 16px rgba(0,0,0,0.4)`,
      }}
      animate={{ y: [0, -16, 0] }}
      transition={{ duration: dur, delay, repeat: Infinity, ease: "easeInOut" }}
    >
      {emoji}
    </motion.div>
  );
}

/** Full faux-dashboard browser mockup — floats on Y axis */
function DashboardMockup() {
  return (
    <div className="relative mx-auto max-w-5xl" style={{ overflow: "visible" }}>
      {/* Floating 3D icons around the mockup */}
      {FLOAT_ICONS.map(({ key, ...fi }) => <FloatIcon key={key} {...fi} />)}

      {/* Glow pool underneath */}
      <div
        className="pointer-events-none absolute -bottom-14 left-1/2 h-48 w-3/4 -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: "radial-gradient(ellipse, rgba(139,92,246,0.28) 0%, transparent 70%)" }}
      />

      {/* Y-axis continuous float wrapper */}
      <motion.div
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 5.8, repeat: Infinity, ease: "easeInOut" }}
        style={{ willChange: "transform" }}
      >
        {/* Browser chrome + window — dark-surface keeps all inner text white */}
        <div
          className="relative overflow-hidden rounded-2xl dark-surface"
          style={{
            border: "1px solid rgba(168,85,247,0.28)",
            boxShadow: [
              "0 40px 130px -20px rgba(0,0,0,0.95)",
              "0 0 0 1px rgba(255,255,255,0.04)",
              "0 0 80px -20px rgba(139,92,246,0.35)",
              "inset 0 1px 0 rgba(255,255,255,0.08)",
            ].join(", "),
          }}
        >
          {/* Traffic-light bar */}
          <div className="flex items-center gap-2 border-b border-white/[0.055] bg-[#0B0B1E] px-4 py-3">
            {(["bg-red-500/75", "bg-yellow-500/75", "bg-green-500/75"] as const).map((c, i) => (
              <span key={i} className={`h-3 w-3 rounded-full ${c}`} />
            ))}
            <div className="mx-auto flex items-center gap-2 rounded-md bg-white/[0.05] px-4 py-1 text-xs text-gray-500">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              app.teachharbour.co.uk/dashboard
            </div>
          </div>

          {/* App content */}
          <div className="relative flex h-72 w-full overflow-hidden bg-[#090916] md:h-[430px]">

            {/* Sidebar */}
            <div className="hidden w-44 flex-shrink-0 flex-col border-r border-white/[0.048] bg-[#060612] md:flex">
              <div className="flex items-center gap-2 border-b border-white/[0.048] px-4 py-3">
                <div className="flex h-5 w-5 items-center justify-center rounded-md" style={{ background: "linear-gradient(135deg,#7C3AED,#C026D3)" }}>
                  <Brain className="h-3 w-3 text-white" />
                </div>
                <span className="text-[11px] font-bold text-white">Teach Harbour</span>
              </div>

              <nav className="flex-1 space-y-0.5 px-2 py-3">
                {[
                  { label: "Dashboard", active: true  },
                  { label: "Students",  active: false },
                  { label: "Lessons",   active: false },
                  { label: "Sessions",  active: false },
                  { label: "Progress",  active: false },
                  { label: "Reports",   active: false },
                ].map(({ label, active }, i) => (
                  <motion.div
                    key={label}
                    className={`rounded-lg px-3 py-1.5 text-[10px] font-medium ${active ? "bg-violet-600/22 text-violet-300" : "text-zinc-600"}`}
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.5 + i * 0.055 }}
                  >
                    {label}
                  </motion.div>
                ))}
              </nav>

              <div className="border-t border-white/[0.048] p-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
                    style={{ background: "linear-gradient(135deg,#7C3AED,#C026D3)" }}>SM</div>
                  <div>
                    <p className="text-[10px] font-semibold text-zinc-200">Sarah M.</p>
                    <p className="text-[9px] text-zinc-600">Tutor</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Main dashboard area */}
            <div className="flex flex-1 flex-col overflow-hidden p-4 md:p-5">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold text-white">Good morning, Sarah 👋</p>
                  <p className="text-[10px] text-zinc-500">3 sessions today · 2 homework to review</p>
                </div>
                <div className="flex items-center gap-1.5 rounded-full border border-violet-500/28 bg-violet-500/10 px-3 py-1 text-[10px] font-medium text-violet-300">
                  <Sparkles className="h-3 w-3" /> AI ready
                </div>
              </div>

              {/* Metric cards */}
              <div className="mb-4 grid grid-cols-3 gap-2 md:gap-3">
                {[
                  { label: "Students", value: "12", sub: "+2 this term",  c: "text-violet-400",  d: "bg-violet-500"  },
                  { label: "Sessions", value: "47", sub: "This term",     c: "text-fuchsia-400", d: "bg-fuchsia-500" },
                  { label: "Reports",  value: "8",  sub: "Ready to send", c: "text-emerald-400", d: "bg-emerald-500" },
                ].map(({ label, value, sub, c, d }, i) => (
                  <motion.div
                    key={label}
                    className="rounded-xl border border-white/[0.048] bg-white/[0.025] p-3"
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.62 + i * 0.08 }}
                  >
                    <div className="flex items-center gap-1.5 text-[9px] font-medium text-zinc-500">
                      <span className={`h-1.5 w-1.5 rounded-full ${d}`} />{label}
                    </div>
                    <p className={`mt-1 text-xl font-bold ${c}`}>{value}</p>
                    <p className="text-[9px] text-zinc-600">{sub}</p>
                  </motion.div>
                ))}
              </div>

              {/* Bottom row */}
              <div className="grid min-h-0 flex-1 grid-cols-2 gap-3">
                {/* Students list */}
                <div className="flex flex-col overflow-hidden rounded-xl border border-white/[0.048] bg-white/[0.025] p-3">
                  <p className="mb-2 text-[10px] font-semibold text-zinc-300">My students</p>
                  <div className="flex-1 space-y-2 overflow-hidden">
                    {[
                      { name: "Amara J.", age: "Y9",  pct: 82, c: "bg-violet-500"  },
                      { name: "Leo K.",   age: "Y11", pct: 65, c: "bg-fuchsia-500" },
                      { name: "Priya S.", age: "Y7",  pct: 91, c: "bg-emerald-500" },
                      { name: "Daniel O.",age: "Y10", pct: 48, c: "bg-amber-500"   },
                    ].map(({ name, age, pct, c }, i) => (
                      <motion.div
                        key={name}
                        className="flex items-center gap-2"
                        initial={{ x: -8, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.82 + i * 0.06 }}
                      >
                        <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${c} text-[8px] font-bold text-white`}>
                          {name[0]}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="mb-0.5 flex items-center justify-between">
                            <span className="truncate text-[9px] font-medium text-zinc-300">{name}</span>
                            <span className="ml-1 shrink-0 text-[9px] text-zinc-500">{age} · {pct}%</span>
                          </div>
                          <div className="h-1 w-full rounded-full bg-white/[0.05]">
                            <motion.div
                              className={`h-1 rounded-full ${c}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ delay: 0.92 + i * 0.07, duration: 0.85, ease: "easeOut" }}
                            />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Upcoming sessions */}
                <div className="flex flex-col gap-2 overflow-hidden rounded-xl border border-white/[0.048] bg-white/[0.025] p-3">
                  <p className="text-[10px] font-semibold text-zinc-300">Upcoming sessions</p>
                  {[
                    { name: "Amara J.", sub: "Maths",   time: "2:00 PM", c: "bg-violet-500"  },
                    { name: "Leo K.",   sub: "Physics",  time: "4:30 PM", c: "bg-fuchsia-500" },
                    { name: "Priya S.", sub: "English",  time: "6:00 PM", c: "bg-emerald-500" },
                  ].map(({ name, sub, time, c }, i) => (
                    <motion.div
                      key={name}
                      className="flex items-center gap-2 rounded-lg bg-white/[0.025] px-2 py-1.5"
                      initial={{ x: 8, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.87 + i * 0.06 }}
                    >
                      <span className={`h-2 w-2 shrink-0 rounded-full ${c}`} />
                      <span className="flex-1 truncate text-[9px] text-zinc-300">{name} — {sub}</span>
                      <span className="shrink-0 text-[9px] text-zinc-500">{time}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/** Glassmorphic feature card — coloured border, glow on hover, gradient wash */
function FeatureCard({ f }: { f: typeof FEATURES[0] }) {
  const Icon = f.icon;
  const [hov, setHov] = useState(false);
  return (
    <motion.div
      variants={scrollCard}
      className={cn("group relative overflow-hidden rounded-2xl border p-6 backdrop-blur-sm", f.border, "bg-white/[0.02]")}
      onHoverStart={() => setHov(true)}
      onHoverEnd={() => setHov(false)}
      whileHover={{ scale: 1.02, y: -5 }}
      transition={{ type: "spring", stiffness: 280, damping: 24 }}
      style={{ boxShadow: hov ? `0 0 36px -6px ${f.glow}` : "none" }}
    >
      <motion.div
        className={cn("absolute inset-0 bg-gradient-to-br opacity-0", f.grad)}
        animate={{ opacity: hov ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />
      <div className="relative z-10">
        <div className={cn("mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border bg-white/[0.04]", f.border)}>
          <Icon className={cn("h-5 w-5", f.ic)} />
        </div>
        <h3 className="mb-2 text-[0.95rem] font-semibold text-white">{f.title}</h3>
        <p className="text-sm leading-relaxed text-gray-400">{f.desc}</p>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   BACKGROUND FLOATING SVG ILLUSTRATIONS
   Matching the reference image: book, globe, brain, pencil, atom
═══════════════════════════════════════════════════════════════════════════ */

function BgBook() {
  return (
    <svg viewBox="0 0 120 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <radialGradient id="bk-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#a78bfa" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="bk-cover-l" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>
        <linearGradient id="bk-cover-r" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#6d28d9" />
        </linearGradient>
        <linearGradient id="bk-page" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#f5f3ff" />
          <stop offset="100%" stopColor="#ede9fe" />
        </linearGradient>
      </defs>
      {/* Ambient glow */}
      <ellipse cx="60" cy="55" rx="52" ry="40" fill="url(#bk-glow)" opacity="0.55" />
      {/* LEFT cover (angled back) */}
      <path d="M8 20 Q10 18 28 15 L28 88 Q10 90 8 88 Z" fill="url(#bk-cover-l)" />
      {/* RIGHT cover (angled back) */}
      <path d="M92 20 Q110 18 112 20 L112 88 Q110 90 92 88 Z" fill="url(#bk-cover-r)" />
      {/* LEFT page spread */}
      <path d="M28 15 Q45 10 60 14 L60 88 Q45 90 28 88 Z" fill="url(#bk-page)" />
      {/* RIGHT page spread */}
      <path d="M60 14 Q75 10 92 15 L92 88 Q75 90 60 88 Z" fill="url(#bk-page)" />
      {/* Spine highlight */}
      <rect x="58" y="14" width="4" height="74" rx="2" fill="#c4b5fd" opacity="0.6" />
      {/* Lines on left page */}
      <line x1="35" y1="30" x2="56" y2="28" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      <line x1="35" y1="38" x2="56" y2="37" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <line x1="35" y1="46" x2="56" y2="45" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" opacity="0.45" />
      <line x1="35" y1="54" x2="50" y2="53" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      {/* Lines on right page */}
      <line x1="64" y1="28" x2="86" y2="30" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      <line x1="64" y1="37" x2="86" y2="38" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <line x1="64" y1="45" x2="86" y2="46" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" opacity="0.45" />
      <line x1="64" y1="53" x2="80" y2="54" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      {/* Gold star on left cover */}
      <path d="M18 50 L19.4 54.3 L24 54.3 L20.3 56.9 L21.7 61.2 L18 58.5 L14.3 61.2 L15.7 56.9 L12 54.3 L16.6 54.3 Z" fill="#fbbf24" opacity="0.9" />
      {/* Sparkle dots above */}
      <circle cx="40"  cy="6" r="2"   fill="#c4b5fd" opacity="0.8" />
      <circle cx="60"  cy="3" r="1.5" fill="#e879f9" opacity="0.7" />
      <circle cx="80"  cy="7" r="2"   fill="#c4b5fd" opacity="0.6" />
      <circle cx="52" cy="2" r="1"   fill="#fbbf24"  opacity="0.8" />
      <circle cx="72" cy="2" r="1"   fill="#fbbf24"  opacity="0.6" />
    </svg>
  );
}

function BgGlobe() {
  return (
    <svg viewBox="0 0 110 110" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <radialGradient id="gl-body" cx="40%" cy="35%" r="60%">
          <stop offset="0%"   stopColor="#5eead4" />
          <stop offset="50%"  stopColor="#0d9488" />
          <stop offset="100%" stopColor="#0f766e" />
        </radialGradient>
        <radialGradient id="gl-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#2dd4bf" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#14b8a6" stopOpacity="0" />
        </radialGradient>
        <clipPath id="gl-clip"><circle cx="55" cy="52" r="36" /></clipPath>
      </defs>
      {/* Ambient glow */}
      <ellipse cx="55" cy="55" rx="50" ry="46" fill="url(#gl-glow)" opacity="0.5" />
      {/* Globe sphere */}
      <circle cx="55" cy="52" r="36" fill="url(#gl-body)" />
      {/* Grid lines clipped to globe */}
      <g clipPath="url(#gl-clip)" opacity="0.35">
        {/* Latitude lines */}
        <ellipse cx="55" cy="52" rx="36" ry="12" fill="none" stroke="white" strokeWidth="1.2" />
        <ellipse cx="55" cy="52" rx="36" ry="24" fill="none" stroke="white" strokeWidth="1.2" />
        {/* Longitude lines */}
        <line x1="55" y1="16" x2="55" y2="88" stroke="white" strokeWidth="1.2" />
        <line x1="24" y1="16" x2="24" y2="88" stroke="white" strokeWidth="1.2" />
        <line x1="86" y1="16" x2="86" y2="88" stroke="white" strokeWidth="1.2" />
        <line x1="36" y1="16" x2="36" y2="88" stroke="white" strokeWidth="1.2" />
        <line x1="74" y1="16" x2="74" y2="88" stroke="white" strokeWidth="1.2" />
      </g>
      {/* Highlight spot */}
      <ellipse cx="44" cy="38" rx="10" ry="7" fill="white" opacity="0.22" />
      {/* Orbital ring (ellipse around globe) */}
      <ellipse cx="55" cy="52" rx="48" ry="14" fill="none" stroke="#5eead4" strokeWidth="2.5" opacity="0.85"
        strokeDasharray="none" />
      {/* Ring shadow behind globe */}
      <ellipse cx="55" cy="52" rx="48" ry="14" fill="none" stroke="#0d9488" strokeWidth="3" opacity="0.3"
        strokeDasharray="60 150" />
      {/* Electron/dot on ring */}
      <circle cx="103" cy="52" r="4" fill="#5eead4" />
      <circle cx="103" cy="52" r="6" fill="#5eead4" opacity="0.3" />
      {/* Stars */}
      <circle cx="10" cy="20" r="1.5" fill="#a7f3d0" opacity="0.7" />
      <circle cx="100" cy="15" r="1" fill="#a7f3d0" opacity="0.6" />
      <circle cx="8"  cy="90" r="2" fill="#a7f3d0" opacity="0.5" />
    </svg>
  );
}

function BgBrain() {
  return (
    <svg viewBox="0 0 110 105" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <radialGradient id="br-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#f0abfc" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#d946ef" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="br-body" cx="40%" cy="35%" r="65%">
          <stop offset="0%"   stopColor="#f5d0fe" />
          <stop offset="50%"  stopColor="#d946ef" />
          <stop offset="100%" stopColor="#a21caf" />
        </radialGradient>
      </defs>
      {/* Glow */}
      <ellipse cx="55" cy="55" rx="50" ry="44" fill="url(#br-glow)" opacity="0.55" />
      {/* Brain body — left hemisphere */}
      <path d="M55 25 Q35 20 26 33 Q16 46 20 58 Q18 72 30 78 Q40 85 55 82 Z"
        fill="url(#br-body)" />
      {/* Brain body — right hemisphere */}
      <path d="M55 25 Q75 20 84 33 Q94 46 90 58 Q92 72 80 78 Q70 85 55 82 Z"
        fill="url(#br-body)" />
      {/* Center fold */}
      <path d="M55 25 Q53 54 55 82" stroke="#f0abfc" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.7" />
      {/* Brain fold lines — left */}
      <path d="M32 40 Q40 36 42 44 Q44 52 36 54" stroke="#f0abfc" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.65" />
      <path d="M26 55 Q34 50 36 58 Q38 65 30 68" stroke="#f0abfc" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.55" />
      {/* Brain fold lines — right */}
      <path d="M78 40 Q70 36 68 44 Q66 52 74 54" stroke="#f0abfc" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.65" />
      <path d="M84 55 Q76 50 74 58 Q72 65 80 68" stroke="#f0abfc" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.55" />
      {/* Highlight */}
      <ellipse cx="40" cy="34" rx="9" ry="5" fill="white" opacity="0.2" />
      {/* Neural connection dots */}
      {[
        [20,45],[18,65],[40,88],[70,90],[92,65],[90,42],[60,18],[50,18]
      ].map(([x,y],i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="3.5" fill="#f0abfc" opacity="0.7" />
          <circle cx={x} cy={y} r="6" fill="#f0abfc" opacity="0.2" />
        </g>
      ))}
      {/* Spark lines from brain */}
      <line x1="20" y1="45" x2="10" y2="35" stroke="#f0abfc" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <line x1="18" y1="65" x2="6"  y2="68" stroke="#f0abfc" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      <line x1="90" y1="42" x2="102" y2="34" stroke="#f0abfc" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      {/* Gold star sparks */}
      <path d="M10 26 L11 29 L14 29 L12 31 L13 34 L10 32 L7 34 L8 31 L6 29 L9 29 Z" fill="#fbbf24" opacity="0.85" />
      <path d="M98 75 L99 77 L101 77 L100 79 L101 81 L98 79 L95 81 L96 79 L94 77 L96 77 Z" fill="#fbbf24" opacity="0.7" />
    </svg>
  );
}

function BgPencil() {
  return (
    <svg viewBox="0 0 50 140" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="pc-body" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#fde68a" />
          <stop offset="50%"  stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
        <linearGradient id="pc-eraser" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#fca5a5" />
          <stop offset="100%" stopColor="#f87171" />
        </linearGradient>
        <radialGradient id="pc-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#fbbf24" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Ambient glow */}
      <ellipse cx="25" cy="70" rx="24" ry="60" fill="url(#pc-glow)" opacity="0.4" />
      {/* Eraser (top) */}
      <rect x="13" y="2"  width="24" height="12" rx="4" fill="url(#pc-eraser)" />
      {/* Metal band */}
      <rect x="13" y="13" width="24" height="5"  rx="1" fill="#d1d5db" />
      <rect x="13" y="15" width="24" height="1"  fill="#9ca3af" />
      {/* Pencil body */}
      <rect x="13" y="18" width="24" height="96" fill="url(#pc-body)" />
      {/* Body side shadows for 3D */}
      <rect x="13" y="18" width="4"  height="96" fill="#f59e0b" opacity="0.4" />
      <rect x="33" y="18" width="4"  height="96" fill="#fde68a" opacity="0.6" />
      {/* Wood tip */}
      <path d="M13 114 L37 114 L25 136 Z" fill="#d4a373" />
      {/* Graphite tip */}
      <path d="M21 124 L29 124 L25 136 Z" fill="#374151" />
      {/* Shine stripe on body */}
      <rect x="16" y="18" width="3" height="96" rx="1.5" fill="white" opacity="0.25" />
      {/* Sparkle dots */}
      <circle cx="8"  cy="30" r="2" fill="#fde68a" opacity="0.7" />
      <circle cx="42" cy="50" r="1.5" fill="#fbbf24" opacity="0.6" />
      <circle cx="6"  cy="80" r="1.5" fill="#fde68a" opacity="0.5" />
    </svg>
  );
}

function BgAtom() {
  return (
    <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <radialGradient id="at-nucleus" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#7dd3fc" />
          <stop offset="100%" stopColor="#2563eb" />
        </radialGradient>
        <radialGradient id="at-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#60a5fa" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Outer glow */}
      <ellipse cx="60" cy="60" rx="56" ry="52" fill="url(#at-glow)" opacity="0.5" />
      {/* Orbit 1 — horizontal */}
      <ellipse cx="60" cy="60" rx="50" ry="16" fill="none" stroke="#60a5fa" strokeWidth="2" opacity="0.85" />
      {/* Orbit 2 — rotated 60° */}
      <ellipse cx="60" cy="60" rx="50" ry="16" fill="none" stroke="#818cf8" strokeWidth="2" opacity="0.85"
        transform="rotate(60 60 60)" />
      {/* Orbit 3 — rotated 120° */}
      <ellipse cx="60" cy="60" rx="50" ry="16" fill="none" stroke="#a78bfa" strokeWidth="2" opacity="0.85"
        transform="rotate(120 60 60)" />
      {/* Nucleus */}
      <circle cx="60" cy="60" r="11" fill="url(#at-nucleus)" />
      <circle cx="60" cy="60" r="13" fill="#60a5fa" opacity="0.2" />
      <circle cx="60" cy="60" r="16" fill="#60a5fa" opacity="0.1" />
      {/* Nucleus highlight */}
      <circle cx="56" cy="56" r="4" fill="white" opacity="0.35" />
      {/* Electrons — one per orbit */}
      <circle cx="110" cy="60" r="5" fill="#7dd3fc" />
      <circle cx="110" cy="60" r="7" fill="#7dd3fc" opacity="0.3" />
      {/* Electron on orbit 2 */}
      <circle cx="35"  cy="17" r="5" fill="#818cf8" transform="rotate(60 60 60)" />
      <circle cx="35"  cy="17" r="7" fill="#818cf8" opacity="0.3" transform="rotate(60 60 60)" />
      {/* Electron on orbit 3 */}
      <circle cx="85"  cy="17" r="5" fill="#a78bfa" transform="rotate(120 60 60)" />
      <circle cx="85"  cy="17" r="7" fill="#a78bfa" opacity="0.3" transform="rotate(120 60 60)" />
      {/* Star sparkles */}
      <circle cx="6"  cy="30" r="2"   fill="#bae6fd" opacity="0.7" />
      <circle cx="112" cy="22" r="1.5" fill="#bae6fd" opacity="0.6" />
      <circle cx="8"   cy="95" r="1.5" fill="#bae6fd" opacity="0.5" />
      <circle cx="114" cy="88" r="2"   fill="#bae6fd" opacity="0.6" />
    </svg>
  );
}

/** Large background floating illustrations — scattered across the full viewport */
function HeroBgFloats() {
  const items = [
    // Book — top left, large
    { C: BgBook,   w: 150, left: "3%",  top: "8%",  dur: 6.5, delay: 0,   rotRange: 0,  glow: "rgba(139,92,246,0.45)"  },
    // Globe — top right
    { C: BgGlobe,  w: 136, left: "80%", top: "5%",  dur: 7.2, delay: 1.2, rotRange: 0,  glow: "rgba(16,185,129,0.45)"  },
    // Brain — bottom left
    { C: BgBrain,  w: 144, left: "1%",  top: "62%", dur: 6.0, delay: 0.6, rotRange: 0,  glow: "rgba(217,70,239,0.45)"  },
    // Pencil — right center (rotated)
    { C: BgPencil, w: 60,  left: "89%", top: "40%", dur: 5.5, delay: 1.8, rotRange: 12, glow: "rgba(251,191,36,0.45)"  },
    // Atom — bottom right
    { C: BgAtom,   w: 138, left: "78%", top: "72%", dur: 8.0, delay: 0.4, rotRange: 0,  glow: "rgba(59,130,246,0.45)"  },
  ];

  return (
    <>
      {items.map(({ C, w, left, top, dur, delay, rotRange, glow }, i) => (
        <motion.div
          key={i}
          className="pointer-events-none absolute"
          style={{
            left, top, width: w,
            filter: `drop-shadow(0 0 32px ${glow})`,
          }}
          animate={rotRange
            ? { y: [0, -28, 0], rotate: [-rotRange, rotRange, -rotRange] }
            : { y: [0, -28, 0] }
          }
          transition={{ duration: dur, delay, repeat: Infinity, ease: "easeInOut" }}
        >
          <C />
        </motion.div>
      ))}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   HOME PAGE
═══════════════════════════════════════════════════════════════════════════ */

export default function Home() {
  const { isAuthenticated, role } = useAuthStore();
  const { theme } = useTheme();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const isDark = !mounted || theme !== "light";

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!mounted) return;
    if (isAuthenticated) {
      if      (role === "tutor")   router.replace("/dashboard");
      else if (role === "student") router.replace("/student/dashboard");
      else if (role === "parent")  router.replace("/parent/dashboard");
      else if (role === "admin")   router.replace("/admin/dashboard");
    }
  }, [mounted, isAuthenticated, role, router]);

  return (
    <div
      data-hp=""
      className="min-h-screen overflow-x-hidden transition-colors duration-300"
      style={{
        background: isDark ? "#07071A" : "#D9D5D4",
        color:      isDark ? "#F2F2FA" : "#0C0C16",
      }}
    >

      {/* ══════════════════════════════════════════════════════════════
          FIXED ANIMATED BACKGROUND
          Large morphing blob shapes + floating SVG illustrations
      ══════════════════════════════════════════════════════════════ */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">

        {/* Blobs — full opacity in dark, very subtle in light */}
        <div style={{ opacity: isDark ? 1 : 0.07, transition: "opacity 0.4s" }}>

        {/* ── LEFT blob — rich violet/purple ──────────────────────── */}
        <motion.div
          style={{
            position: "absolute",
            left: "-18%",
            top: "-8%",
            width: "68%",
            height: "90%",
            background: "radial-gradient(ellipse at 38% 38%, rgba(124,58,237,0.88) 0%, rgba(109,40,217,0.6) 35%, rgba(76,29,149,0.25) 65%, transparent 80%)",
            borderRadius: "63% 37% 54% 46% / 55% 48% 52% 45%",
            willChange: "border-radius, transform",
          }}
          animate={{
            borderRadius: [
              "63% 37% 54% 46% / 55% 48% 52% 45%",
              "40% 60% 30% 70% / 60% 40% 70% 30%",
              "55% 45% 48% 52% / 50% 55% 45% 58%",
              "63% 37% 54% 46% / 55% 48% 52% 45%",
            ],
            scale: [1, 1.055, 0.97, 1],
            x: [0, 18, -10, 0],
            y: [0, -14, 12, 0],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", times: [0, 0.33, 0.66, 1] }}
        />

        {/* ── RIGHT blob — fuchsia/magenta ────────────────────────── */}
        <motion.div
          style={{
            position: "absolute",
            right: "-16%",
            top: "3%",
            width: "64%",
            height: "82%",
            background: "radial-gradient(ellipse at 60% 42%, rgba(192,38,211,0.82) 0%, rgba(162,28,175,0.55) 35%, rgba(134,25,143,0.22) 65%, transparent 80%)",
            borderRadius: "37% 63% 46% 54% / 45% 52% 48% 55%",
            willChange: "border-radius, transform",
          }}
          animate={{
            borderRadius: [
              "37% 63% 46% 54% / 45% 52% 48% 55%",
              "60% 40% 70% 30% / 55% 45% 55% 45%",
              "45% 55% 55% 45% / 60% 40% 60% 40%",
              "37% 63% 46% 54% / 45% 52% 48% 55%",
            ],
            scale: [1, 0.96, 1.05, 1],
            x: [0, -18, 12, 0],
            y: [0, 16, -10, 0],
          }}
          transition={{ duration: 22, delay: 2.5, repeat: Infinity, ease: "easeInOut", times: [0, 0.33, 0.66, 1] }}
        />

        {/* ── BOTTOM blob — deeper purple, anchors the floor ──────── */}
        <motion.div
          style={{
            position: "absolute",
            left: "10%",
            bottom: "-18%",
            width: "80%",
            height: "55%",
            background: "radial-gradient(ellipse at 50% 30%, rgba(76,29,149,0.65) 0%, rgba(109,40,217,0.35) 45%, transparent 72%)",
            borderRadius: "50% 50% 30% 70% / 50% 50% 70% 30%",
            willChange: "border-radius, transform",
          }}
          animate={{
            borderRadius: [
              "50% 50% 30% 70% / 50% 50% 70% 30%",
              "30% 70% 50% 50% / 70% 30% 50% 50%",
              "50% 50% 30% 70% / 50% 50% 70% 30%",
            ],
            scale: [1, 1.04, 1],
          }}
          transition={{ duration: 20, delay: 5, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Subtle dot grid over the blobs */}
        <div className="bg-dot-grid absolute inset-0 opacity-[0.18]" />

        {/* Top hairline */}
        <div className="absolute left-1/2 top-0 h-px w-[900px] -translate-x-1/2 bg-gradient-to-r from-transparent via-violet-400/50 to-transparent" />

        {/* Scattered star points */}
        {[...Array(14)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: i % 3 === 0 ? 2 : 1.5,
              height: i % 3 === 0 ? 2 : 1.5,
              left: `${8 + (i * 6.7) % 84}%`,
              top: `${4 + (i * 9.3) % 68}%`,
              opacity: isDark ? undefined : 0,
            }}
            animate={isDark ? { opacity: [0.2, 0.9, 0.2], scale: [0.8, 1.6, 0.8] } : {}}
            transition={{ duration: 2 + (i % 3) * 0.6, delay: (i * 0.38) % 3.2, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}

        </div>{/* end blobs opacity wrapper */}

        {/* ── Large floating SVG illustrations ─────────────────────────── */}
        {/* Dimmed in light mode but still visible as subtle decoration */}
        <div style={{ opacity: isDark ? 1 : 0.18, transition: "opacity 0.3s" }}>
          <HeroBgFloats />
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          STICKY HEADER
      ══════════════════════════════════════════════════════════════ */}
      <motion.header
        className="sticky top-0 z-50"
        style={{
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          background: isDark ? "rgba(7,7,26,0.72)" : "rgba(217,213,212,0.92)",
          borderBottom: isDark ? "1px solid rgba(255,255,255,0.055)" : "1px solid rgba(0,0,0,0.08)",
          transition: "background 0.3s, border-color 0.3s",
        }}
        initial={{ y: -64, opacity: 0 }}
        animate={{ y: 0,   opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          {/* Wordmark */}
          <motion.div
            className="flex items-center gap-2.5"
            whileHover={{ scale: 1.03 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg shadow-lg shadow-violet-500/30" style={{ background: "linear-gradient(135deg,#7C3AED,#C026D3)" }}>
              <Brain className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">Teach Harbour</span>
          </motion.div>

          {/* Nav links */}
          <nav className="hidden items-center gap-7 text-sm font-medium text-gray-400 md:flex">
            {[
              { label: "Features",     href: "#features"     },
              { label: "Portals",      href: "#portals"      },
              { label: "How it works", href: "#how-it-works" },
              { label: "FAQ",          href: "#faq"          },
              { label: "Contact",      href: "/contact"      },
            ].map(({ label, href }) => (
              <motion.a
                key={label}
                href={href}
                className="transition-colors hover:text-white"
                whileHover={{ y: -1 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                {label}
              </motion.a>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <NavThemeToggle />
            <Link href="/login">
              <motion.span
                className="hidden text-sm font-medium text-gray-300 transition-colors hover:text-white md:inline"
                whileHover={{ y: -1 }}
              >
                Login
              </motion.span>
            </Link>
            <Link href="/login">
              <motion.span
                className="keep-white inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-semibold text-white"
                style={{ background: "linear-gradient(135deg,#7C3AED,#C026D3)", boxShadow: "0 0 22px -4px rgba(192,38,211,0.55)" }}
                whileHover={{ scale: 1.05, boxShadow: "0 0 32px -4px rgba(192,38,211,0.75)" }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                Get Started
              </motion.span>
            </Link>
          </div>
        </div>
      </motion.header>

      {/* ══════════════════════════════════════════════════════════════
          HERO — page-load staggered entrance
      ══════════════════════════════════════════════════════════════ */}
      <section className="relative px-6 pb-10 pt-20 text-center" style={{ overflow: "visible" }}>
        <motion.div
          className="mx-auto max-w-4xl"
          variants={heroWrap}
          initial="hidden"
          animate="visible"
        >
          {/* Badge */}
          <motion.div variants={heroItem}>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-400/22 bg-violet-500/10 px-4 py-1.5 text-sm font-medium text-violet-300">
              <motion.span
                animate={{ rotate: [0, 20, -20, 0] }}
                transition={{ duration: 2.8, repeat: Infinity, repeatDelay: 4 }}
              >
                <Sparkles className="h-3.5 w-3.5" />
              </motion.span>
              Built for UK tutors &amp; tutoring businesses
            </div>
          </motion.div>

          {/* Headline — "Unlock Your Potential" style from image */}
          <motion.div variants={heroItem}>
            <h1 className="text-[2.8rem] font-extrabold leading-[1.07] tracking-[-0.04em] text-white md:text-[4.2rem]">
              The smarter way{" "}
              <VF>to tutor</VF>
              <br />
              <span className="text-white/88">in the UK</span>
            </h1>
          </motion.div>

          {/* Subtitle */}
          <motion.div variants={heroItem}>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-gray-400 md:text-[1.05rem]">
              Expert personalised tutoring, aligned to the UK curriculum. AI lesson planning,
              progress tracking, and parent communication — all in one platform.
            </p>
          </motion.div>

          {/* CTA row */}
          <motion.div variants={heroItem} className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <Link href="/login">
              <motion.span
                className="keep-white inline-flex items-center gap-2 rounded-full px-9 py-3.5 text-sm font-semibold text-white"
                style={{
                  background: "linear-gradient(135deg,#7C3AED,#C026D3)",
                  boxShadow: "0 0 44px -8px rgba(192,38,211,0.7), 0 0 88px -16px rgba(124,58,237,0.45)",
                }}
                whileHover={{ scale: 1.05, boxShadow: "0 0 60px -8px rgba(192,38,211,0.85), 0 0 110px -16px rgba(124,58,237,0.6)" }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                Get started free
                <motion.span animate={{ x: [0, 4, 0] }} transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 2 }}>
                  <ArrowRight className="h-4 w-4" />
                </motion.span>
              </motion.span>
            </Link>
            <motion.a
              href="#features"
              className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.05] px-9 py-3.5 text-sm font-semibold text-gray-200 backdrop-blur"
              whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.09)", borderColor: "rgba(255,255,255,0.2)" }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              See how it works
            </motion.a>
          </motion.div>

          {/* Stars */}
          <motion.div variants={heroItem} className="mt-6 flex items-center justify-center gap-2">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <motion.span key={i} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.9 + i * 0.06, type: "spring", stiffness: 300 }}>
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                </motion.span>
              ))}
            </div>
            <span className="text-sm text-gray-500">Loved by tutors across England &amp; Wales</span>
          </motion.div>
        </motion.div>

        {/* Floating dashboard mockup */}
        <motion.div
          className="mt-16"
          initial={{ opacity: 0, y: 48, scale: 0.95 }}
          animate={{ opacity: 1, y: 0,  scale: 1 }}
          transition={{ duration: 1.0, delay: 0.75, ease: [0.22, 1, 0.36, 1] }}
        >
          <DashboardMockup />
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          HERO FEATURE CARDS  (Elite Tutors / Flexible Learning / Progress)
      ══════════════════════════════════════════════════════════════ */}
      <section className="mx-auto mt-12 max-w-5xl px-6">
        <motion.div
          className="grid gap-4 md:grid-cols-3"
          variants={scrollGrid}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          {[
            { icon: GraduationCap, title: "Elite Tutors",      desc: "Access top qualified UK tutors",          border: "border-violet-500/25",  glow: "rgba(139,92,246,0.22)", ic: "text-violet-400"  },
            { icon: Calendar,      title: "Flexible Learning",  desc: "Learn anytime, at your own pace",         border: "border-fuchsia-500/25", glow: "rgba(217,70,239,0.22)", ic: "text-fuchsia-400" },
            { icon: BarChart3,     title: "Progress Tracking",  desc: "Monitor and celebrate every achievement", border: "border-purple-500/25",  glow: "rgba(168,85,247,0.22)", ic: "text-purple-400"  },
          ].map(({ icon: Icon, title, desc, border, glow, ic }) => (
            <motion.div
              key={title}
              variants={scrollCard}
              className={cn("rounded-2xl border p-6 backdrop-blur-sm", border, "bg-white/[0.02]")}
              whileHover={{ scale: 1.02, y: -5, boxShadow: `0 0 40px -8px ${glow}` }}
              transition={{ type: "spring", stiffness: 280, damping: 24 }}
            >
              <div className={cn("mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border bg-white/[0.04]", border)}>
                <Icon className={cn("h-5 w-5", ic)} />
              </div>
              <h3 className="mb-1.5 text-base font-semibold text-white">{title}</h3>
              <p className="text-sm text-gray-400">{desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* "Find Your Tutor" pill CTA — matching image */}
        <Reveal className="mt-10 text-center">
          <Link href="/login">
            <motion.span
              className="keep-white inline-flex items-center gap-2 rounded-full px-10 py-4 text-base font-semibold text-white"
              style={{ background: "linear-gradient(135deg,#7C3AED,#C026D3)", boxShadow: "0 0 40px -8px rgba(192,38,211,0.6)" }}
              whileHover={{ scale: 1.05, boxShadow: "0 0 60px -8px rgba(192,38,211,0.82)" }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              Get started with Teach Harbour <ArrowRight className="h-5 w-5" />
            </motion.span>
          </Link>
        </Reveal>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          TRUST BADGES
      ══════════════════════════════════════════════════════════════ */}
      <Reveal className="mx-auto mt-20 max-w-5xl px-6">
        <div className="flex flex-wrap items-center justify-center gap-3">
          {[
            { icon: Shield,        label: "GDPR Compliant"    },
            { icon: GraduationCap, label: "UK Curriculum"     },
            { icon: Lock,          label: "Data Encrypted"    },
            { icon: Cpu,           label: "Claude AI Powered" },
            { icon: Zap,           label: "Real-time Sync"    },
          ].map(({ icon: Icon, label }, i) => (
            <motion.div
              key={label}
              className="flex items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.02] px-4 py-2 text-xs font-medium text-gray-400 backdrop-blur-sm"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              whileHover={{ borderColor: "rgba(168,85,247,0.4)", color: "#C084FC" }}
            >
              <Icon className="h-3.5 w-3.5 text-violet-400" />
              {label}
            </motion.div>
          ))}
        </div>
      </Reveal>

      {/* ══════════════════════════════════════════════════════════════
          ANIMATED STATS BAR
      ══════════════════════════════════════════════════════════════ */}
      <section className="mx-auto mt-20 max-w-5xl px-6">
        <motion.div
          className="grid grid-cols-2 gap-4 rounded-3xl border border-white/[0.055] bg-white/[0.018] p-8 backdrop-blur md:grid-cols-4"
          style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)" }}
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        >
          {STATS.map(({ value, suffix, label }, i) => (
            <motion.div
              key={label}
              className="text-center"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <p
                className="num text-3xl font-extrabold tracking-tight md:text-[2.6rem]"
                style={{ background: "linear-gradient(135deg,#A78BFA 0%,#F0ABFC 100%)", WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent" }}
              >
                <AnimatedCounter value={value} suffix={suffix} />
              </p>
              <p className="mt-1 text-sm text-gray-500">{label}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          FULL FEATURES GRID  (6 cards)
      ══════════════════════════════════════════════════════════════ */}
      <section id="features" className="mx-auto mt-28 max-w-6xl px-6">
        <Reveal className="mb-12 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.13em] text-violet-400">Platform features</p>
          <h2 className="text-3xl font-extrabold tracking-[-0.03em] text-white md:text-4xl">
            Everything a tutor needs,{" "}
            <VF>nothing they don&apos;t</VF>
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base text-gray-400">
            Designed for UK tutors who want professional results without the admin overhead.
          </p>
        </Reveal>
        <motion.div
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
          variants={scrollGrid}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          {FEATURES.map((f) => <FeatureCard key={f.title} f={f} />)}
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          HOW IT WORKS  (3 steps)
      ══════════════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="mx-auto mt-28 max-w-5xl px-6">
        <Reveal className="mb-12 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.13em] text-violet-400">Simple workflow</p>
          <h2 className="text-3xl font-extrabold tracking-[-0.03em] text-white md:text-4xl">Up and running in minutes</h2>
          <p className="mx-auto mt-4 max-w-md text-base text-gray-400">Three simple steps to transform how you run your tutoring practice.</p>
        </Reveal>
        <div className="grid gap-5 md:grid-cols-3">
          {STEPS.map(({ icon: Icon, step, title, desc }, i) => (
            <motion.div
              key={step}
              className="relative rounded-2xl border border-violet-500/22 bg-white/[0.02] p-6 backdrop-blur-sm"
              style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)" }}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.14, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -5, borderColor: "rgba(168,85,247,0.45)", boxShadow: "0 0 32px -6px rgba(168,85,247,0.25), inset 0 1px 0 rgba(255,255,255,0.07)" }}
            >
              {i < 2 && (
                <div className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 md:block">
                  <ArrowRight className="h-5 w-5 text-violet-500/38" />
                </div>
              )}
              <motion.div
                className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-violet-500/25 bg-violet-500/10"
                whileInView={{ scale: [0.55, 1.12, 1] }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.14 + 0.28, duration: 0.5 }}
              >
                <Icon className="h-5 w-5 text-violet-400" />
              </motion.div>
              <p className="mb-1 font-mono text-xs font-bold text-violet-400">{step}</p>
              <h3 className="mb-2 text-[0.95rem] font-bold text-white">{title}</h3>
              <p className="text-sm leading-relaxed text-gray-400">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          TESTIMONIALS
      ══════════════════════════════════════════════════════════════ */}
      <section className="mx-auto mt-28 max-w-6xl px-6">
        <Reveal className="mb-12 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.13em] text-violet-400">Testimonials</p>
          <h2 className="text-3xl font-extrabold tracking-[-0.03em] text-white md:text-4xl">Trusted by tutors nationwide</h2>
        </Reveal>
        <motion.div
          className="grid gap-5 md:grid-cols-3"
          variants={scrollGrid}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          {TESTIMONIALS.map(({ name, role, loc, text, stars }) => (
            <motion.div
              key={name}
              variants={scrollCard}
              className="rounded-2xl border border-violet-500/20 bg-white/[0.02] p-6 backdrop-blur-sm"
              whileHover={{ y: -5, borderColor: "rgba(168,85,247,0.38)", boxShadow: "0 0 36px -8px rgba(139,92,246,0.22)" }}
              transition={{ type: "spring", stiffness: 280, damping: 24 }}
            >
              <div className="mb-4 flex">
                {[...Array(stars)].map((_, i) => <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />)}
              </div>
              <p className="mb-5 text-sm leading-relaxed text-gray-300">&ldquo;{text}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div
                  className="dark-surface flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ background: "linear-gradient(135deg,#7C3AED,#C026D3)" }}
                >
                  {name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{name}</p>
                  <p className="text-xs text-gray-500">{role} · {loc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          PORTALS
      ══════════════════════════════════════════════════════════════ */}
      <section id="portals" className="mx-auto mt-28 max-w-6xl px-6">
        <Reveal className="mb-12 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.13em] text-violet-400">Role-based portals</p>
          <h2 className="text-3xl font-extrabold tracking-[-0.03em] text-white md:text-4xl">
            A dedicated experience <VF>for everyone</VF>
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base text-gray-400">
            Three tailored portals — each designed for the people who use it every day.
          </p>
        </Reveal>
        <motion.div
          className="grid gap-5 md:grid-cols-3"
          variants={scrollGrid}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          {PORTALS.map(({ role, href, icon: Icon, scene: Scene, border, bg, glow, accent, ctaBg, features }) => (
            <MotionLink
              key={role}
              href={href}
              variants={scrollCard}
              className={cn(
                "group block rounded-2xl border overflow-hidden backdrop-blur-sm bg-gradient-to-br cursor-pointer",
                border, bg,
              )}
              whileHover={{ y: -6, boxShadow: `0 0 52px -8px ${glow}` }}
              transition={{ type: "spring", stiffness: 280, damping: 24 }}
            >
              {/* Scene illustration header */}
              <div className="relative overflow-hidden">
                <Scene className="w-full transition-transform duration-500 group-hover:scale-[1.03]" />
                {/* Gradient fade into card body */}
                <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#07071a] to-transparent" />
                {/* Portal label overlay */}
                <div className="absolute bottom-3 left-4 flex items-center gap-2">
                  <div className={cn("inline-flex h-7 w-7 items-center justify-center rounded-lg border bg-white/[0.06]", border)}>
                    <Icon className={cn("h-3.5 w-3.5", accent)} />
                  </div>
                  <span className="text-sm font-bold text-white">{role} Portal</span>
                </div>
              </div>

              {/* Features list */}
              <div className="p-5 pt-4">
                <ul className="space-y-2.5 mb-5">
                  {features.map((feat) => (
                    <li key={feat} className="flex items-center gap-2.5 text-sm text-gray-400">
                      <CheckCircle2 className={cn("h-4 w-4 shrink-0", accent)} />
                      {feat}
                    </li>
                  ))}
                </ul>

                {/* CTA row */}
                <div className={cn(
                  "flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm font-semibold transition-colors duration-200",
                  ctaBg, accent,
                )}>
                  <span>Open {role} Portal</span>
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </div>
              </div>
            </MotionLink>
          ))}
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          FAQ
      ══════════════════════════════════════════════════════════════ */}
      <section id="faq" className="mx-auto mt-28 max-w-3xl px-6">
        <Reveal className="mb-10 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.13em] text-violet-400">FAQ</p>
          <h2 className="text-3xl font-extrabold tracking-[-0.03em] text-white md:text-4xl">Common questions</h2>
        </Reveal>
        <Reveal><FAQ /></Reveal>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          CONTACT
      ══════════════════════════════════════════════════════════════ */}
      <section className="mx-auto mt-28 max-w-4xl px-6">
        <Reveal>
          <div
            className="rounded-3xl border border-violet-500/20 bg-white/[0.018] p-10 backdrop-blur"
            style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.055)" }}
          >
            <div className="mb-8 text-center">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.13em] text-violet-400">Get in touch</p>
              <h2 className="text-2xl font-extrabold text-white md:text-3xl">We&apos;d love to hear from you</h2>
              <p className="mt-3 text-sm text-gray-400">Questions about pricing, features, or a custom demo? Reach out.</p>
            </div>
            <div className="flex flex-col items-center justify-center gap-6 md:flex-row">
              {[
                { icon: Mail,   label: "hello@teachharbour.co.uk" },
                { icon: Phone,  label: "+44 20 7946 0000"      },
                { icon: MapPin, label: "London, United Kingdom" },
              ].map(({ icon: Icon, label }) => (
                <motion.div
                  key={label}
                  className="flex items-center gap-3 text-sm text-gray-400"
                  whileHover={{ color: "#C084FC", x: 2 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <Icon className="h-4 w-4 shrink-0 text-violet-400" />
                  {label}
                </motion.div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════════════════════════════ */}
      <section className="relative mx-auto mt-20 max-w-4xl overflow-hidden px-6 py-20 text-center">
        <div className="absolute inset-0 -z-10 rounded-3xl border border-violet-500/20 bg-white/[0.018]"
          style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)" }} />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%)" }} />
        <Reveal className="relative z-10">
          <h2 className="text-3xl font-extrabold tracking-[-0.03em] text-white md:text-[2.6rem]">
            Ready to <VF>transform your tutoring</VF>?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base text-gray-400">
            Join tutors across England and Wales who already use Teach Harbour to save time and deliver better results.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <Link href="/login">
              <motion.span
                className="inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-semibold text-white"
                style={{ background: "linear-gradient(135deg,#7C3AED,#C026D3)", boxShadow: "0 0 38px -8px rgba(192,38,211,0.65)" }}
                whileHover={{ scale: 1.05, boxShadow: "0 0 55px -8px rgba(192,38,211,0.85)" }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                Get started free <ArrowRight className="h-4 w-4" />
              </motion.span>
            </Link>
            <Link href="/contact">
              <motion.span
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-8 py-3.5 text-sm font-semibold text-gray-200 backdrop-blur"
                whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.09)" }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                Request a demo
              </motion.span>
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          FOOTER — matching image style
      ══════════════════════════════════════════════════════════════ */}
      <footer className="mt-20 border-t border-white/[0.07]">
        <div className="mx-auto max-w-6xl px-6 pt-12 pb-8">

          {/* ── Main grid ── */}
          <div className="grid grid-cols-2 gap-10 md:grid-cols-4 mb-12">

            {/* Brand column */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: "linear-gradient(135deg,#7C3AED,#C026D3)" }}>
                  <Brain className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-sm font-bold text-white">Teach Harbour</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed mb-4">
                The UK&apos;s tutoring operating system. AI-powered lesson planning, progress tracking, and parent communication — all in one place.
              </p>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="text-[10px] text-gray-600">GDPR compliant · UK hosted</span>
              </div>
            </div>

            {/* Product */}
            <FooterCol title="Product" links={[
              { label: "Features",    href: "#features"    },
              { label: "Portals",     href: "#portals"     },
              { label: "How it works",href: "#how-it-works"},
              { label: "Pricing",     href: "/login"       },
              { label: "Sign in",     href: "/login"       },
              { label: "Get started", href: "/login"       },
            ]} />

            {/* Support */}
            <FooterCol title="Support" links={[
              { label: "Contact us",  href: "/contact"  },
              { label: "FAQ",         href: "#faq"      },
              { label: "hello@teachharbour.co.uk", href: "mailto:hello@teachharbour.co.uk" },
            ]} />

            {/* Legal */}
            <FooterCol title="Legal" links={[
              { label: "Terms of Use",   href: "/terms"   },
              { label: "Privacy Policy", href: "/privacy" },
              { label: "Cookie Policy",  href: "/cookies" },
              { label: "legal@teachharbour.co.uk", href: "mailto:legal@teachharbour.co.uk" },
            ]} />
          </div>

          {/* ── Bottom bar ── */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-t border-white/[0.06] pt-6 text-[11px] text-gray-600">
            <p>© {new Date().getFullYear()} Teach Harbour Ltd. Registered in England &amp; Wales. All rights reserved.</p>
            <p>Governed by the laws of England &amp; Wales · ICO registered · UK GDPR compliant</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FooterCol({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-500">{title}</p>
      <ul className="space-y-2">
        {links.map(({ label, href }) => (
          <li key={label}>
            <Link href={href} className="text-xs text-gray-500 transition-colors hover:text-gray-300">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
