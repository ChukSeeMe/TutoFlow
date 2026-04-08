import { Cookie, AlertCircle } from "lucide-react";

export const metadata = {
  title: "Cookie Policy — Teach Harbour",
  description: "Teach Harbour Cookie Policy — how we use cookies and how you can manage your preferences.",
};

const LAST_UPDATED = "1 April 2025";

export default function CookiePage() {
  return (
    <article className="prose-legal">

      {/* Header */}
      <div className="mb-10 flex items-start gap-4 rounded-2xl border border-[rgb(var(--border)/0.15)] bg-[rgb(var(--bg-card))] p-6">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-brand-gradient shadow-glow-sm">
          <Cookie className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="mb-1 text-2xl font-extrabold tracking-tight text-[rgb(var(--text))]">Cookie Policy</h1>
          <p className="text-sm text-[rgb(var(--text-secondary))]">
            Last updated: <strong>{LAST_UPDATED}</strong>
          </p>
        </div>
      </div>

      {/* Notice */}
      <div className="mb-8 flex gap-3 rounded-xl border border-emerald-500/25 bg-emerald-50 dark:bg-emerald-500/10 p-4">
        <AlertCircle className="h-5 w-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
        <p className="text-sm text-emerald-800 dark:text-emerald-300">
          This policy explains how Teach Harbour uses cookies and similar technologies in compliance with the UK Privacy and Electronic Communications Regulations (PECR) and UK GDPR. You can manage your cookie preferences at any time.
        </p>
      </div>

      <Section id="1" title="1. What Are Cookies?">
        <p>Cookies are small text files that are placed on your device when you visit a website. They allow the website to recognise your device, remember your preferences, and provide functionality that improves your experience.</p>
        <p>We also use related technologies including <strong>local storage</strong> (browser-based storage used for your authentication session and UI preferences) and <strong>session tokens</strong> (secure HTTP-only cookies used to maintain your login state).</p>
      </Section>

      <Section id="2" title="2. How We Use Cookies">
        <p>Teach Harbour uses cookies for the following purposes:</p>
        <ul>
          <li><strong>Authentication</strong> — to keep you logged in securely during your session and across page loads.</li>
          <li><strong>Preferences</strong> — to remember your settings such as light/dark mode.</li>
          <li><strong>Security</strong> — to protect against cross-site request forgery (CSRF) and session hijacking.</li>
          <li><strong>Analytics</strong> — to understand how users navigate the Platform so we can improve it.</li>
        </ul>
        <p>We do not use cookies for targeted advertising or third-party retargeting.</p>
      </Section>

      <Section id="3" title="3. Cookie Categories">
        <p>We classify our cookies into four categories:</p>

        <div className="not-prose space-y-4 mt-3">
          {[
            {
              label: "Strictly Necessary",
              color: "bg-emerald-500/10 border-emerald-500/25 text-emerald-700 dark:text-emerald-400",
              desc: "Required for the Platform to function. These cannot be disabled. They include your authentication token, CSRF protection, and session management cookies.",
              consent: "No consent required (PECR exempt)",
            },
            {
              label: "Functional / Preferences",
              color: "bg-blue-500/10 border-blue-500/25 text-blue-700 dark:text-blue-400",
              desc: "Remember your UI preferences such as light/dark mode and sidebar state. Disabling these means your preferences reset on each visit.",
              consent: "Opt-in consent required",
            },
            {
              label: "Analytics",
              color: "bg-violet-500/10 border-violet-500/25 text-violet-700 dark:text-violet-400",
              desc: "Help us understand how users interact with the Platform using anonymised, aggregated data. We use privacy-preserving analytics that do not track you across other websites.",
              consent: "Opt-in consent required",
            },
            {
              label: "Marketing",
              color: "bg-amber-500/10 border-amber-500/25 text-amber-700 dark:text-amber-400",
              desc: "Teach Harbour does not currently use marketing or advertising cookies on the Platform.",
              consent: "N/A — not used",
            },
          ].map(({ label, color, desc, consent }) => (
            <div key={label} className={`rounded-xl border p-4 ${color.split(" ").slice(0,2).join(" ")}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-bold uppercase tracking-wider ${color.split(" ").slice(2).join(" ")}`}>{label}</span>
                <span className="text-[10px] text-[rgb(var(--text-tertiary))]">{consent}</span>
              </div>
              <p className="text-xs leading-relaxed text-[rgb(var(--text-secondary))]">{desc}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section id="4" title="4. Cookie Reference Table">
        <p>The following table lists the specific cookies we set:</p>
        <div className="not-prose overflow-x-auto rounded-xl border border-[rgb(var(--border)/0.15)] bg-[rgb(var(--bg-card))] mt-3">
          <table className="w-full text-xs min-w-[540px]">
            <thead>
              <tr className="border-b border-[rgb(var(--border)/0.12)] bg-[rgb(var(--bg-elevated))]">
                {["Name", "Purpose", "Type", "Duration"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-[rgb(var(--text))]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgb(var(--border)/0.08)]">
              {[
                ["refresh_token",    "Maintains your login session securely",                          "Strictly Necessary", "7 days (httpOnly, Secure)"],
                ["__Host-csrf",      "Protects against cross-site request forgery attacks",            "Strictly Necessary", "Session"],
                ["next-auth.session-token", "NextAuth.js session identifier",                         "Strictly Necessary", "30 days"],
                ["theme",            "Remembers your light/dark mode preference",                      "Functional",         "1 year (localStorage)"],
                ["sidebar_state",    "Remembers sidebar open/closed state",                           "Functional",         "Session (localStorage)"],
                ["_th_analytics",    "Anonymous usage analytics (no PII, no cross-site tracking)",    "Analytics",          "30 days"],
              ].map(([name, purpose, type, duration]) => (
                <tr key={name}>
                  <td className="px-4 py-3 font-mono text-[rgb(var(--text))]">{name}</td>
                  <td className="px-4 py-3 text-[rgb(var(--text-secondary))]">{purpose}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      type === "Strictly Necessary" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" :
                      type === "Functional"         ? "bg-blue-500/10 text-blue-700 dark:text-blue-400" :
                      "bg-violet-500/10 text-violet-700 dark:text-violet-400"
                    }`}>{type}</span>
                  </td>
                  <td className="px-4 py-3 text-[rgb(var(--text-secondary))]">{duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section id="5" title="5. Third-Party Cookies">
        <p>We use the following third-party services that may set their own cookies:</p>
        <ul>
          <li><strong>Google OAuth / Microsoft OAuth</strong> — if you choose to sign in with Google or Microsoft, those providers may set cookies on their own domains during the authentication flow. Please refer to <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google's Privacy Policy</a> and <a href="https://privacy.microsoft.com" target="_blank" rel="noopener noreferrer">Microsoft's Privacy Statement</a> for details.</li>
          <li><strong>Stripe</strong> — our payment provider sets cookies to prevent fraud and ensure secure payment processing. See <a href="https://stripe.com/gb/privacy" target="_blank" rel="noopener noreferrer">Stripe's Privacy Policy</a>.</li>
        </ul>
        <p>We do not control third-party cookies and are not responsible for their use.</p>
      </Section>

      <Section id="6" title="6. Managing Your Cookie Preferences">
        <p>You can manage or withdraw consent for non-essential cookies at any time:</p>
        <ul>
          <li><strong>Cookie banner</strong> — when you first visit Teach Harbour, you can set your preferences via the cookie consent banner.</li>
          <li><strong>Browser settings</strong> — most browsers allow you to block or delete cookies. Note that disabling strictly necessary cookies will prevent the Platform from functioning correctly.</li>
          <li><strong>Email request</strong> — contact <a href="mailto:privacy@teachharbour.co.uk">privacy@teachharbour.co.uk</a> to withdraw consent for analytics cookies at any time.</li>
        </ul>
        <p>For guidance on managing cookies in specific browsers, visit <a href="https://www.aboutcookies.org" target="_blank" rel="noopener noreferrer">aboutcookies.org</a>.</p>
      </Section>

      <Section id="7" title="7. Do Not Track">
        <p>Some browsers send a "Do Not Track" signal. We honour the intent of this signal by not using cross-site tracking technologies. Our analytics are privacy-preserving and do not track you across other websites regardless of your browser's DNT setting.</p>
      </Section>

      <Section id="8" title="8. Changes to This Policy">
        <p>We may update this Cookie Policy from time to time to reflect changes in the cookies we use or applicable regulations. We will notify you of significant changes via the cookie banner or in-Platform notification. The "last updated" date at the top always reflects the most recent revision.</p>
      </Section>

      <Section id="9" title="9. Contact Us">
        <p>If you have questions about our use of cookies, please contact:</p>
        <div className="not-prose rounded-xl border border-[rgb(var(--border)/0.15)] bg-[rgb(var(--bg-card))] p-5 text-sm">
          <p className="font-semibold text-[rgb(var(--text))] mb-2">Teach Harbour Ltd — Privacy Team</p>
          <p className="text-[rgb(var(--text-secondary))]">Email: <a href="mailto:privacy@teachharbour.co.uk" className="text-brand-500 hover:underline">privacy@teachharbour.co.uk</a></p>
        </div>
      </Section>

    </article>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={`section-${id}`} className="mb-8 scroll-mt-24">
      <h2 className="mb-3 text-lg font-bold text-[rgb(var(--text))] border-b border-[rgb(var(--border)/0.12)] pb-2">
        {title}
      </h2>
      <div className="space-y-3 text-sm leading-relaxed text-[rgb(var(--text-secondary))] [&_a]:text-brand-500 [&_a]:hover:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_strong]:text-[rgb(var(--text))] [&_strong]:font-semibold">
        {children}
      </div>
    </section>
  );
}
