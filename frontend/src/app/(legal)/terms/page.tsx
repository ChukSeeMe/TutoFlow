import { Scale, AlertCircle } from "lucide-react";

export const metadata = {
  title: "Terms of Use — Teach Harbour",
  description: "Teach Harbour Terms of Use — the legal agreement governing your use of the Teach Harbour platform.",
};

const LAST_UPDATED = "1 April 2025";
const EFFECTIVE    = "1 April 2025";

export default function TermsPage() {
  return (
    <article className="prose-legal">

      {/* Header */}
      <div className="mb-10 flex items-start gap-4 rounded-2xl border border-[rgb(var(--border)/0.15)] bg-[rgb(var(--bg-card))] p-6">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-brand-gradient shadow-glow-sm">
          <Scale className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="mb-1 text-2xl font-extrabold tracking-tight text-[rgb(var(--text))]">Terms of Use</h1>
          <p className="text-sm text-[rgb(var(--text-secondary))]">
            Last updated: <strong>{LAST_UPDATED}</strong> · Effective from: <strong>{EFFECTIVE}</strong>
          </p>
        </div>
      </div>

      {/* Notice */}
      <div className="mb-8 flex gap-3 rounded-xl border border-amber-500/25 bg-amber-50 dark:bg-amber-500/10 p-4">
        <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
        <p className="text-sm text-amber-800 dark:text-amber-300">
          Please read these Terms carefully before using Teach Harbour. By creating an account or using our services you agree to be bound by these Terms. If you do not agree, you must not use Teach Harbour.
        </p>
      </div>

      <Section id="1" title="1. Who We Are">
        <p>Teach Harbour Ltd ("<strong>Teach Harbour</strong>", "<strong>we</strong>", "<strong>us</strong>" or "<strong>our</strong>") is a company registered in England and Wales. Our registered office is in London, United Kingdom. We operate the tutoring management platform available at <strong>teachharbour.co.uk</strong> (the "<strong>Platform</strong>").</p>
        <p>Questions about these Terms should be sent to <a href="mailto:legal@teachharbour.co.uk">legal@teachharbour.co.uk</a>.</p>
      </Section>

      <Section id="2" title="2. Definitions">
        <ul>
          <li><strong>Account</strong> — a registered user profile on the Platform.</li>
          <li><strong>Tutor</strong> — an individual who uses the Platform to manage their tutoring practice.</li>
          <li><strong>Student</strong> — a learner whose profile is managed by a Tutor.</li>
          <li><strong>Parent / Guardian</strong> — an adult with parental responsibility who accesses the Platform via the Parent Portal.</li>
          <li><strong>Content</strong> — any text, data, files, or materials uploaded to or generated on the Platform.</li>
          <li><strong>AI Features</strong> — AI-assisted tools including lesson plan generation, homework creation, and report drafting.</li>
          <li><strong>Subscription</strong> — a paid plan giving access to Platform features.</li>
          <li><strong>UK GDPR</strong> — the UK General Data Protection Regulation as retained in UK law.</li>
        </ul>
      </Section>

      <Section id="3" title="3. Eligibility">
        <p>To register as a Tutor you must be at least 18 years old and legally authorised to work in the United Kingdom in a tutoring capacity. You represent that you hold any DBS checks or other qualifications required by applicable law or your own professional obligations.</p>
        <p>Students under 18 must have a parent or guardian who has consented to the creation and use of their profile. By creating a Student profile, the Tutor warrants that appropriate parental consent has been obtained.</p>
        <p>Parents and Guardians must be 18 or over and must have parental responsibility for the Student in question.</p>
      </Section>

      <Section id="4" title="4. Account Registration and Security">
        <p>You must provide accurate, current, and complete information when creating an Account and keep it up to date. You are responsible for maintaining the confidentiality of your login credentials and for all activity that occurs under your Account.</p>
        <p>You must notify us immediately at <a href="mailto:support@teachharbour.co.uk">support@teachharbour.co.uk</a> if you suspect any unauthorised use of your Account. We are not liable for any loss resulting from unauthorised access to your Account caused by your failure to keep credentials secure.</p>
        <p>You may not create more than one Account per person, transfer your Account to another person, or use another person's Account without their consent.</p>
      </Section>

      <Section id="5" title="5. Your Licence to Use the Platform">
        <p>Subject to your compliance with these Terms, we grant you a limited, non-exclusive, non-transferable, revocable licence to access and use the Platform for your personal, professional tutoring purposes.</p>
        <p>You may not: (a) copy, adapt, or reverse-engineer any part of the Platform; (b) use automated tools, scrapers, or bots to access the Platform; (c) resell or sub-licence access to any third party; (d) use the Platform to develop a competing product or service; or (e) use the Platform in any way that violates applicable law.</p>
      </Section>

      <Section id="6" title="6. Acceptable Use">
        <p>You agree not to use the Platform to:</p>
        <ul>
          <li>Upload, transmit, or share any Content that is unlawful, harmful, harassing, defamatory, obscene, or otherwise objectionable.</li>
          <li>Infringe any third-party intellectual property, privacy, or other rights.</li>
          <li>Share personal data of Students or Parents beyond what is necessary for the provision of tutoring services.</li>
          <li>Impersonate any person or misrepresent your qualifications or identity.</li>
          <li>Introduce viruses, trojans, or other malicious code.</li>
          <li>Engage in any activity that disrupts or interferes with the Platform's operation.</li>
        </ul>
        <p>We reserve the right to remove Content that violates this policy and to suspend or terminate Accounts in breach.</p>
      </Section>

      <Section id="7" title="7. AI Features">
        <p>Teach Harbour provides AI-powered tools to assist Tutors with lesson planning, homework generation, and progress report drafting (collectively, "<strong>AI Features</strong>"). These tools are designed to augment, not replace, professional tutor judgement.</p>
        <p>All outputs from AI Features must be reviewed and approved by the Tutor before use. Teach Harbour does not warrant that AI-generated Content is accurate, complete, appropriate for a particular student, or aligned to any specific examination board's requirements.</p>
        <p>You are solely responsible for any Content you use, adapt, share, or send based on AI Feature outputs. Curriculum alignment, factual accuracy, and suitability remain the Tutor's professional responsibility.</p>
      </Section>

      <Section id="8" title="8. Intellectual Property">
        <p><strong>Our IP.</strong> The Platform, including its design, software, branding, and all Teach Harbour-created content, is owned by Teach Harbour Ltd and protected by copyright, trademark, and other intellectual property laws. Nothing in these Terms transfers any ownership of our IP to you.</p>
        <p><strong>Your Content.</strong> You retain ownership of Content you upload to the Platform. By uploading Content you grant us a worldwide, royalty-free licence to host, store, and display that Content solely to provide the Platform to you.</p>
        <p><strong>AI Outputs.</strong> To the extent AI Feature outputs are capable of copyright protection, we assign any such rights to you. We retain a licence to use anonymised, aggregated data derived from AI interactions to improve our models and services.</p>
      </Section>

      <Section id="9" title="9. Subscription, Payment, and Refunds">
        <p>Access to certain features requires a paid Subscription. Subscription fees, billing cycles, and included features are set out on our Pricing page and may be updated with 30 days' notice.</p>
        <p>All fees are quoted in Pounds Sterling (GBP) and are inclusive of VAT where applicable. Payments are processed by our third-party payment provider (Stripe). We do not store payment card details.</p>
        <p>Subscriptions renew automatically unless cancelled before the renewal date. You may cancel at any time via your Account settings; cancellation takes effect at the end of the current billing period with no partial refunds, except where required by law.</p>
        <p>Under the Consumer Contracts Regulations 2013, if you are a consumer, you have a 14-day right to cancel a new Subscription and receive a full refund, provided you have not materially used the paid features during that period.</p>
      </Section>

      <Section id="10" title="10. Data Protection">
        <p>Teach Harbour processes personal data in accordance with UK GDPR and the Data Protection Act 2018. Please read our <a href="/privacy">Privacy Policy</a> and <a href="/cookies">Cookie Policy</a> for full details.</p>
        <p>Tutors act as independent Data Controllers in respect of their Students' and Parents' data. Teach Harbour acts as a Data Processor on your behalf. Our Data Processing terms form part of this agreement and are available on request.</p>
      </Section>

      <Section id="11" title="11. Safeguarding">
        <p>Teach Harbour is committed to child safety. Tutors are responsible for complying with all applicable safeguarding legislation, including the Children Act 1989 and the Education Act 2011, and for holding appropriate DBS certificates where required.</p>
        <p>Any safeguarding concern you become aware of through use of the Platform should be reported to the relevant local safeguarding authority. You must not use the Platform to document or communicate details of safeguarding incidents beyond what is strictly necessary.</p>
      </Section>

      <Section id="12" title="12. Disclaimers and Limitation of Liability">
        <p>The Platform is provided "as is" and "as available". We do not warrant that it will be uninterrupted, error-free, or free of viruses. We disclaim all implied warranties to the maximum extent permitted by law.</p>
        <p>Nothing in these Terms excludes or limits our liability for: (a) death or personal injury caused by our negligence; (b) fraud or fraudulent misrepresentation; (c) any liability that cannot be limited by law.</p>
        <p>Subject to the above, our aggregate liability to you for any claim arising from your use of the Platform shall not exceed the greater of (i) the total Subscription fees paid by you in the 12 months preceding the claim, or (ii) £100.</p>
        <p>We are not liable for: indirect or consequential losses; loss of profits, data, or business opportunity; or loss caused by third-party services (including AI model providers) integrated into the Platform.</p>
      </Section>

      <Section id="13" title="13. Third-Party Services">
        <p>The Platform integrates third-party services including cloud hosting (Microsoft Azure), AI model providers (Anthropic), and payment processing (Stripe). Your use of these services is also subject to their respective terms and privacy policies. We are not responsible for the acts or omissions of third-party providers.</p>
      </Section>

      <Section id="14" title="14. Termination">
        <p>You may close your Account at any time via Account Settings. We may suspend or terminate your Account immediately if: (a) you breach these Terms materially; (b) we are required to do so by law; (c) continued access would create risk for Teach Harbour, other users, or third parties.</p>
        <p>On termination, your licence to use the Platform ends. We will retain your data in accordance with our Privacy Policy and applicable law. You may request an export of your data before closing your Account.</p>
      </Section>

      <Section id="15" title="15. Changes to These Terms">
        <p>We may update these Terms from time to time. We will notify you of material changes by email or in-Platform notification at least 14 days before they take effect. Your continued use of the Platform after that date constitutes acceptance of the updated Terms.</p>
        <p>If you do not agree with any changes, you may close your Account before the changes take effect.</p>
      </Section>

      <Section id="16" title="16. Governing Law and Disputes">
        <p>These Terms are governed by the laws of England and Wales. Any dispute arising from or related to these Terms or the Platform shall be subject to the exclusive jurisdiction of the courts of England and Wales, unless you are a consumer in another part of the UK, in which case you may have additional rights.</p>
        <p>We encourage you to contact us at <a href="mailto:legal@teachharbour.co.uk">legal@teachharbour.co.uk</a> before commencing any formal legal proceedings. Many disputes can be resolved quickly and informally.</p>
      </Section>

      <Section id="17" title="17. Contact Us">
        <p>For questions about these Terms, please contact:</p>
        <div className="not-prose rounded-xl border border-[rgb(var(--border)/0.15)] bg-[rgb(var(--bg-card))] p-5 text-sm">
          <p className="font-semibold text-[rgb(var(--text))] mb-2">Teach Harbour Ltd — Legal Team</p>
          <p className="text-[rgb(var(--text-secondary))]">Email: <a href="mailto:legal@teachharbour.co.uk" className="text-brand-500 hover:underline">legal@teachharbour.co.uk</a></p>
          <p className="text-[rgb(var(--text-secondary))]">Post: Legal Department, Teach Harbour Ltd, London, United Kingdom</p>
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
