"use client";

import Link from "next/link";
import { Brain, ArrowLeft, FileText, Shield, Cookie } from "lucide-react";
import { cn } from "@/lib/utils";

const LEGAL_NAV = [
  { href: "/terms",   label: "Terms of Use",    icon: FileText },
  { href: "/privacy", label: "Privacy Policy",  icon: Shield   },
  { href: "/cookies", label: "Cookie Policy",   icon: Cookie   },
];

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[rgb(var(--bg))] text-[rgb(var(--text))]">

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-[rgb(var(--border)/0.12)] bg-[rgb(var(--bg-card)/0.92)] backdrop-blur-lg">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-gradient shadow-glow-sm">
              <Brain className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-sm text-[rgb(var(--text))]">TutorFlow</span>
          </Link>

          <nav className="flex items-center gap-1">
            {LEGAL_NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  "text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text))] hover:bg-[rgb(var(--bg-subtle)/0.5)]"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            ))}
          </nav>

          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text))] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to site
          </Link>
        </div>
      </header>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <main className="mx-auto max-w-3xl px-6 py-12">
        {children}
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-[rgb(var(--border)/0.12)] mt-16">
        <div className="mx-auto max-w-5xl px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[rgb(var(--text-tertiary))]">
          <p>© {new Date().getFullYear()} TutorFlow Ltd. Registered in England &amp; Wales. All rights reserved.</p>
          <div className="flex gap-4">
            {LEGAL_NAV.map(({ href, label }) => (
              <Link key={href} href={href} className="hover:text-[rgb(var(--text-secondary))] transition-colors">{label}</Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
