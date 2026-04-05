import { Shield, AlertCircle } from "lucide-react";

export const metadata = {
  title: "Privacy Policy — TutorFlow",
  description: "TutorFlow Privacy Policy — how we collect, use, and protect your personal data under UK GDPR.",
};

const LAST_UPDATED = "1 April 2025";

export default function PrivacyPage() {
  return (
    <article className="prose-legal">

      {/* Header */}
      <div className="mb-10 flex items-start gap-4 rounded-2xl border border-[rgb(var(--border)/0.15)] bg-[rgb(var(--bg-card))] p-6">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-brand-gradient shadow-glow-sm">
          <Shield className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="mb-1 text-2xl font-extrabold tracking-tight text-[rgb(var(--text))]">Privacy Policy</h1>
          <p className="text-sm text-[rgb(var(--text-secondary))]">
            Last updated: <strong>{LAST_UPDATED}</strong>
          </p>
        </div>
      </div>

      {/* Notice */}
      <div className="mb-8 flex gap-3 rounded-xl border border-brand-500/25 bg-brand-50 dark:bg-brand-500/10 p-4">
        <AlertCircle className="h-5 w-5 flex-shrink-0 text-brand-600 dark:text-brand-400 mt-0.5" />
        <p className="text-sm text-brand-800 dark:text-brand-300">
          TutorFlow Ltd is registered with the Information Commissioner&apos;s Office (ICO) as a Data Controller. This Policy explains how we collect, use, share, and protect your personal data in accordance with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.
        </p>
      </div>

      <Section id="1" title="1. Who We Are">
        <p>TutorFlow Ltd ("<strong>TutorFlow</strong>", "<strong>we</strong>", "<strong>us</strong>") is the Data Controller for personal data collected through the TutorFlow platform ("<strong>Platform</strong>"). Our ICO registration number is available on request.</p>
        <p>Our Data Protection contact: <a href="mailto:privacy@tutorflow.co.uk">privacy@tutorflow.co.uk</a></p>
      </Section>

      <Section id="2" title="2. Data We Collect">
        <p>We collect different categories of personal data depending on your role:</p>

        <p><strong>Tutors</strong></p>
        <ul>
          <li>Name, email address, and password (hashed)</li>
          <li>Profile information (bio, subjects, qualifications)</li>
          <li>Payment and billing information (processed by Stripe — we do not store card details)</li>
          <li>Session and lesson data you create on the Platform</li>
          <li>Platform usage data and audit logs</li>
          <li>Communications with us (support tickets, email)</li>
        </ul>

        <p><strong>Students</strong></p>
        <ul>
          <li>Name, year group, and key stage (provided by the Tutor)</li>
          <li>Academic progress data, homework records, and session notes (entered by the Tutor)</li>
          <li>Login credentials if a Student account is enabled</li>
          <li>Quiz responses and self-reflection entries</li>
        </ul>

        <p><strong>Parents / Guardians</strong></p>
        <ul>
          <li>Name and email address</li>
          <li>Relationship to the Student</li>
          <li>Communications received via the Parent Portal</li>
        </ul>

        <p><strong>Automatically collected data (all users)</strong></p>
        <ul>
          <li>IP address, browser type, and device information</li>
          <li>Pages visited, features used, and time spent on the Platform</li>
          <li>Cookie identifiers (see our <a href="/cookies">Cookie Policy</a>)</li>
        </ul>
      </Section>

      <Section id="3" title="3. How We Use Your Data">
        <DataTable rows={[
          ["Provide and maintain the Platform", "Tutor, Student, Parent data", "Performance of contract (Art. 6(1)(b))"],
          ["Process payments and manage subscriptions", "Tutor billing data", "Performance of contract (Art. 6(1)(b))"],
          ["Send service notifications and updates", "Email address", "Legitimate interests (Art. 6(1)(f))"],
          ["Improve Platform features and AI models (anonymised/aggregated)", "Usage data", "Legitimate interests (Art. 6(1)(f))"],
          ["Comply with legal obligations (e.g. tax, safeguarding)", "As required", "Legal obligation (Art. 6(1)(c))"],
          ["Send marketing emails (opt-in only)", "Email address", "Consent (Art. 6(1)(a))"],
          ["Detect fraud and maintain security", "Log data, IP address", "Legitimate interests (Art. 6(1)(f))"],
        ]} />
      </Section>

      <Section id="4" title="4. Student Data — Special Considerations">
        <p>Student data frequently relates to children under 18 years old. We treat this data with the highest level of care:</p>
        <ul>
          <li>Student profiles are created and managed exclusively by the Tutor.</li>
          <li>The Tutor is responsible for obtaining parental or guardian consent before adding a student under 18 to the Platform.</li>
          <li>Student data is only shared with the Parent Portal for that specific student, at the Tutor's discretion.</li>
          <li>We never use Student personal data for marketing or advertising purposes.</li>
          <li>Student data is encrypted at rest and in transit.</li>
          <li>We apply additional access restrictions — Student data cannot be accessed by other Tutors or third parties without explicit permission.</li>
        </ul>
      </Section>

      <Section id="5" title="5. Data Sharing">
        <p>We do not sell your personal data. We share data only as described below:</p>
        <ul>
          <li><strong>Service providers (sub-processors)</strong>: Microsoft Azure (cloud hosting, UK/EU data centres), Anthropic (AI features — only anonymised prompt data), Stripe (payment processing), SendGrid (transactional email). All sub-processors are bound by data processing agreements.</li>
          <li><strong>Other users</strong>: Tutors can share progress reports and session summaries with the linked Parent. Students see only their own data.</li>
          <li><strong>Legal requirements</strong>: We may disclose data if required by law, court order, or to protect the safety of a child.</li>
          <li><strong>Business transfer</strong>: If TutorFlow is acquired or merged, data may be transferred to the successor entity, subject to the same privacy protections.</li>
        </ul>
      </Section>

      <Section id="6" title="6. International Data Transfers">
        <p>Your data is stored in UK and European Economic Area (EEA) data centres operated by Microsoft Azure. Where data is transferred outside the UK/EEA (e.g. to Anthropic in the USA), we rely on Standard Contractual Clauses (SCCs) and the UK International Data Transfer Agreement (IDTA) as the appropriate transfer mechanism.</p>
      </Section>

      <Section id="7" title="7. Data Retention">
        <DataTable rows={[
          ["Active Account data", "For the duration of the Account + 30 days after closure"],
          ["Billing and payment records", "7 years (UK legal requirement)"],
          ["Session and lesson records", "Until you delete them, or 3 years after Account closure"],
          ["Audit logs", "12 months"],
          ["Marketing preferences", "Until you withdraw consent"],
          ["Anonymised/aggregated analytics", "Indefinitely"],
        ]} cols={["Data Type", "Retention Period"]} />
      </Section>

      <Section id="8" title="8. Your Rights Under UK GDPR">
        <p>You have the following rights regarding your personal data:</p>
        <ul>
          <li><strong>Right of access</strong> — request a copy of the data we hold about you.</li>
          <li><strong>Right to rectification</strong> — ask us to correct inaccurate data.</li>
          <li><strong>Right to erasure</strong> ("right to be forgotten") — request deletion of your data, subject to legal retention obligations.</li>
          <li><strong>Right to restrict processing</strong> — ask us to pause processing while a dispute is resolved.</li>
          <li><strong>Right to data portability</strong> — receive your data in a structured, machine-readable format.</li>
          <li><strong>Right to object</strong> — object to processing based on legitimate interests or for direct marketing.</li>
          <li><strong>Rights related to automated decision-making</strong> — we do not make solely automated decisions with legal or similarly significant effects about you.</li>
          <li><strong>Right to withdraw consent</strong> — where processing is based on consent, you may withdraw it at any time without affecting the lawfulness of prior processing.</li>
        </ul>
        <p>To exercise any right, email <a href="mailto:privacy@tutorflow.co.uk">privacy@tutorflow.co.uk</a>. We will respond within 30 days. We may request identity verification before processing your request.</p>
      </Section>

      <Section id="9" title="9. Cookies">
        <p>We use cookies and similar technologies to operate and improve the Platform. Please see our <a href="/cookies">Cookie Policy</a> for full details including how to manage your preferences.</p>
      </Section>

      <Section id="10" title="10. Security">
        <p>We implement appropriate technical and organisational measures to protect your data, including:</p>
        <ul>
          <li>TLS 1.3 encryption in transit and AES-256 encryption at rest.</li>
          <li>Password hashing using bcrypt.</li>
          <li>Role-based access controls — each user sees only the data relevant to their role.</li>
          <li>Regular security audits and penetration testing.</li>
          <li>Incident response procedures compliant with the UK GDPR 72-hour breach notification requirement.</li>
        </ul>
      </Section>

      <Section id="11" title="11. Complaints">
        <p>If you have a concern about how we handle your data, please contact us first at <a href="mailto:privacy@tutorflow.co.uk">privacy@tutorflow.co.uk</a> and we will endeavour to resolve it promptly.</p>
        <p>You also have the right to lodge a complaint with the <strong>Information Commissioner's Office (ICO)</strong>:</p>
        <div className="not-prose rounded-xl border border-[rgb(var(--border)/0.15)] bg-[rgb(var(--bg-card))] p-5 text-sm">
          <p className="font-semibold text-[rgb(var(--text))] mb-2">Information Commissioner&apos;s Office</p>
          <p className="text-[rgb(var(--text-secondary))]">Website: <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="text-brand-500 hover:underline">ico.org.uk</a></p>
          <p className="text-[rgb(var(--text-secondary))]">Telephone: 0303 123 1113</p>
          <p className="text-[rgb(var(--text-secondary))]">Address: Wycliffe House, Water Lane, Wilmslow, Cheshire, SK9 5AF</p>
        </div>
      </Section>

      <Section id="12" title="12. Changes to This Policy">
        <p>We may update this Privacy Policy from time to time. We will notify you of material changes via email or in-Platform notice at least 14 days before they take effect. The "last updated" date at the top of this page always reflects the most recent revision.</p>
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

function DataTable({ rows, cols }: { rows: string[][]; cols?: string[] }) {
  const headers = cols ?? ["Purpose", "Data Used", "Legal Basis (UK GDPR)"];
  return (
    <div className="not-prose overflow-x-auto rounded-xl border border-[rgb(var(--border)/0.15)] bg-[rgb(var(--bg-card))]">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-[rgb(var(--border)/0.12)] bg-[rgb(var(--bg-elevated))]">
            {headers.map((h) => (
              <th key={h} className="px-4 py-3 text-left font-semibold text-[rgb(var(--text))]">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-[rgb(var(--border)/0.08)] last:border-0">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 text-[rgb(var(--text-secondary))]">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
