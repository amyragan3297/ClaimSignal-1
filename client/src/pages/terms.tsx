import { Layout } from "@/components/layout";
import { motion } from "framer-motion";

export default function Terms() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Terms of Service</h1>
          <p className="text-muted-foreground mb-8">ClaimSignal</p>
          <div className="h-1 w-24 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full mb-8" />
        </motion.div>

        <div className="prose prose-invert prose-amber max-w-none space-y-8">
          <Section title="1. Acceptance of Terms">
            <p>By accessing or using ClaimSignal, you agree to be bound by these Terms of Service. If you do not agree, do not use the platform.</p>
          </Section>

          <Section title="2. Description of Service">
            <p>ClaimSignal is an informational intelligence platform providing aggregated insights, risk indicators, and decision-support tools related to insurance claim handling patterns.</p>
            <p className="font-medium">ClaimSignal does not act as a public adjuster, legal representative, insurer, or third-party negotiator.</p>
          </Section>

          <Section title="3. Informational Use Only">
            <p>All content is provided for informational and decision-support purposes only.</p>
            <p>ClaimSignal does not provide:</p>
            <ul>
              <li>Legal advice</li>
              <li>Insurance advice</li>
              <li>Claim representation</li>
              <li>Outcome guarantees</li>
            </ul>
            <p className="font-medium">Users remain solely responsible for all decisions and actions.</p>
          </Section>

          <Section title="4. Risk Scores and Analytics">
            <p>Risk Scores and intelligence outputs:</p>
            <ul>
              <li>Are derived from historical behavioral patterns</li>
              <li>Reflect trends, not facts or predictions</li>
              <li>Do not assert intent, fault, or misconduct</li>
            </ul>
            <p>Scores are subject to data limitations and continuous updates.</p>
          </Section>

          <Section title="5. User Responsibilities">
            <p>Users agree to:</p>
            <ul>
              <li>Use the platform lawfully and ethically</li>
              <li>Maintain accurate information where provided</li>
              <li>Exercise independent professional judgment</li>
            </ul>
            <p>Users agree not to misuse platform intelligence for harassment, deception, or unlawful conduct.</p>
          </Section>

          <Section title="6. Limitation of Liability">
            <p>To the maximum extent permitted by law, ClaimSignal shall not be liable for:</p>
            <ul>
              <li>Claim denials or delays</li>
              <li>Financial losses</li>
              <li>Business interruptions</li>
              <li>Indirect or consequential damages</li>
            </ul>
            <p className="font-medium">Use of the platform is at the user's own risk.</p>
          </Section>

          <Section title="7. Intellectual Property">
            <p>All content, methodologies, scoring frameworks, and platform features are proprietary to ClaimSignal.</p>
            <p>Unauthorized copying, reverse engineering, or redistribution is prohibited.</p>
          </Section>

          <Section title="8. Termination">
            <p>ClaimSignal reserves the right to suspend or terminate access for violations of these terms.</p>
          </Section>

          <Section title="9. Modifications">
            <p>Terms may be updated periodically. Continued use constitutes acceptance of the current version.</p>
          </Section>

          <Section title="10. Governing Law">
            <p>These Terms are governed by applicable state law without regard to conflict-of-law principles.</p>
          </Section>
        </div>
      </div>
    </Layout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.section
      initial={{ y: 20, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4 }}
      className="border-b border-border/50 pb-8 last:border-0"
    >
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      <div className="text-muted-foreground space-y-3 [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:space-y-1">
        {children}
      </div>
    </motion.section>
  );
}
