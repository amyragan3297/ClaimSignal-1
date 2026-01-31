import { Layout } from "@/components/layout";
import { motion } from "framer-motion";
import { Shield, AlertTriangle, Scale, Lock, Ban, Building2, Brain, FileText, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function Legal() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl font-bold mb-2">Legal Disclosure</h1>
          <p className="text-sm text-muted-foreground mb-2">Use Restrictions and Protective Notice</p>
          <p className="text-xs text-muted-foreground mb-6">ClaimSignal</p>
          <div className="h-1 w-24 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full mb-8" />
        </motion.div>

        <div className="space-y-10">
          <Section icon={<FileText className="w-5 h-5" />} title="1. Informational Platform Only">
            <p className="font-medium text-foreground mb-3">ClaimSignal is an informational and decision-support platform.</p>
            <p className="mb-3">ClaimSignal does not:</p>
            <ul>
              <li>Provide legal advice</li>
              <li>Provide insurance advice</li>
              <li>Act as a public adjuster</li>
              <li>Represent insureds or carriers</li>
              <li>Negotiate or direct claim handling</li>
              <li>Predict or guarantee claim outcomes</li>
            </ul>
            <p className="mt-3">All information is provided for general informational purposes only. Users remain solely responsible for their professional decisions.</p>
          </Section>

          <Section icon={<AlertTriangle className="w-5 h-5" />} title="2. No Reliance or Guarantee">
            <p className="mb-3">Any scores, insights, analytics, or AI-assisted outputs:</p>
            <ul>
              <li>Are based on aggregated historical patterns</li>
              <li>Reflect trends, not facts or predictions</li>
              <li>May be incomplete, delayed, or subject to change</li>
            </ul>
            <p className="mt-3 font-medium text-foreground">ClaimSignal makes no warranties, express or implied, regarding accuracy, completeness, or suitability for any purpose.</p>
          </Section>

          <Section icon={<Brain className="w-5 h-5" />} title="3. Professional Judgment Required">
            <p className="font-medium text-foreground mb-3">Use of ClaimSignal does not replace independent professional judgment.</p>
            <p className="mb-3">Users are expected to:</p>
            <ul>
              <li>Comply with all applicable laws and regulations</li>
              <li>Follow carrier, policy, and jurisdictional requirements</li>
              <li>Seek licensed professionals where appropriate</li>
            </ul>
            <p className="mt-3">ClaimSignal is a support tool, not a substitute for expertise.</p>
          </Section>

          <Section icon={<Ban className="w-5 h-5" />} title="4. No Assertion of Intent or Misconduct">
            <p className="mb-3">ClaimSignal does not assert, imply, or allege:</p>
            <ul>
              <li>Bad faith</li>
              <li>Improper conduct</li>
              <li>Negligence</li>
              <li>Intentional delay</li>
              <li>Regulatory violations</li>
            </ul>
            <p className="mt-3">All references to adjusters, carriers, or entities are contextual and informational only.</p>
          </Section>

          <Section icon={<Lock className="w-5 h-5" />} title="5. Data Privacy and Aggregation">
            <p className="mb-3">ClaimSignal:</p>
            <ul>
              <li>Analyzes data in aggregated and de-identified form</li>
              <li>Does not require consumer policyholder personal information for core functionality</li>
              <li>Does not sell personal data</li>
            </ul>
            <p className="mt-3">Outputs do not identify individual policyholders or expose protected personal information.</p>
            <p className="mt-3">No system is completely secure. Users acknowledge inherent risks associated with digital platforms.</p>
          </Section>

          <Section icon={<FileText className="w-5 h-5" />} title="6. Document Retention Policy">
            <p className="font-medium text-foreground mb-3">All documents uploaded to ClaimSignal are retained for data and analytical purposes.</p>
            <p className="mb-3">By uploading documents to ClaimSignal, users acknowledge and agree that:</p>
            <ul>
              <li>Uploaded documents become part of ClaimSignal's data repository</li>
              <li>Documents may be retained indefinitely for platform improvement, analytics, and research purposes</li>
              <li>Document data may be used to enhance risk scoring, behavioral analysis, and pattern recognition</li>
              <li>Documents are stored securely but users retain no expectation of deletion upon account termination</li>
              <li>Aggregated and de-identified insights derived from documents may be used across the platform</li>
            </ul>
            <p className="mt-3">Users are responsible for ensuring they have proper authorization to upload any documents and that uploads do not violate third-party rights or confidentiality obligations.</p>
            <p className="mt-3 font-medium text-foreground">Do not upload documents you do not wish to be retained by ClaimSignal.</p>
          </Section>

          <Section icon={<Shield className="w-5 h-5" />} title="7. Limitation of Liability">
            <p className="mb-3">To the fullest extent permitted by law, ClaimSignal and its operators shall not be liable for:</p>
            <ul>
              <li>Claim denials or delays</li>
              <li>Financial or business losses</li>
              <li>Indirect, incidental, or consequential damages</li>
              <li>Reliance on platform outputs</li>
            </ul>
            <p className="mt-3 font-medium text-foreground">Use of the platform is at the user's own risk.</p>
          </Section>

          <Section icon={<Scale className="w-5 h-5" />} title="8. Ethical and Lawful Use">
            <p className="mb-3">Users agree not to use ClaimSignal to:</p>
            <ul>
              <li>Misrepresent facts</li>
              <li>Engage in deceptive or unlawful conduct</li>
              <li>Harass or intimidate any party</li>
              <li>Circumvent laws, regulations, or contractual obligations</li>
            </ul>
            <p className="mt-3">ClaimSignal reserves the right to restrict or terminate access for misuse.</p>
          </Section>

          <Section icon={<Building2 className="w-5 h-5" />} title="9. Non-Affiliation Statement">
            <p>ClaimSignal is not affiliated with, endorsed by, or sponsored by any insurance carrier, adjusting firm, regulator, or governmental entity.</p>
            <p className="mt-3">All names are used for identification purposes only.</p>
          </Section>

          <Section title="10. Intellectual Property Protection">
            <p className="mb-3">All content, methodologies, scoring frameworks, analytics, and platform elements are proprietary to ClaimSignal.</p>
            <p className="mb-3">Users may not:</p>
            <ul>
              <li>Copy, scrape, reverse engineer, or redistribute content</li>
              <li>Use outputs to create competing products</li>
              <li>Share access credentials or proprietary materials</li>
            </ul>
            <p className="mt-3">Unauthorized use may result in legal action.</p>
          </Section>

          <Section title="11. Non-Compete and Non-Circumvention Notice">
            <p className="mb-3">By accessing ClaimSignal, users acknowledge that:</p>
            <ul>
              <li>Platform methodologies, scoring logic, and intelligence frameworks are proprietary</li>
              <li>Use of the platform does not grant rights to replicate, commercialize, or compete using ClaimSignal concepts</li>
              <li>Users may not use ClaimSignal outputs to build or assist competing intelligence, analytics, or claim-profiling systems</li>
            </ul>
            <p className="mt-3">Nothing in this platform authorizes circumvention of ClaimSignal for competitive purposes.</p>
          </Section>

          <Section title="12. Governing Law">
            <p>This agreement is governed by applicable state law, without regard to conflict-of-law principles.</p>
          </Section>

          <div className="bg-card/50 border border-amber-500/30 rounded-xl p-6 mt-10">
            <h3 className="text-lg font-bold mb-3">Acceptance</h3>
            <p className="text-muted-foreground">By continuing to use ClaimSignal, you acknowledge that you have read, understood, and agreed to these terms.</p>
          </div>

          <div className="flex flex-wrap gap-4 mt-8 pt-6 border-t border-border/50">
            <Link href="/terms" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              Terms of Service <ArrowRight className="w-3 h-3" />
            </Link>
            <Link href="/privacy" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              Privacy Policy <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function Section({ icon, title, children }: { icon?: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <motion.section
      initial={{ y: 20, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4 }}
      className="border-b border-border/50 pb-8 last:border-0"
    >
      <div className="flex items-center gap-3 mb-4">
        {icon && (
          <div className="bg-amber-500/10 p-2 rounded-lg text-amber-500">
            {icon}
          </div>
        )}
        <h2 className="text-base font-semibold">{title}</h2>
      </div>
      <div className="text-muted-foreground text-sm space-y-2 pl-0 md:pl-12 [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:space-y-1">
        {children}
      </div>
    </motion.section>
  );
}
