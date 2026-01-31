import { Layout } from "@/components/layout";
import { motion } from "framer-motion";

export default function Privacy() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground mb-6">ClaimSignal</p>
          <div className="h-1 w-24 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full mb-6" />
        </motion.div>

        <div className="prose prose-invert prose-amber max-w-none space-y-8">
          <Section title="1. Overview">
            <p>ClaimSignal respects user privacy and is committed to responsible data handling.</p>
          </Section>

          <Section title="2. Information Collected">
            <p>ClaimSignal may collect:</p>
            <ul>
              <li>Account information voluntarily provided</li>
              <li>Usage data and interaction metadata</li>
              <li>Aggregated claim behavior data</li>
            </ul>
            <p>No personal consumer insurance data is required to use core intelligence features.</p>
          </Section>

          <Section title="3. Use of Information">
            <p>Information is used to:</p>
            <ul>
              <li>Operate and improve platform functionality</li>
              <li>Generate aggregated intelligence and analytics</li>
              <li>Maintain system integrity and security</li>
            </ul>
          </Section>

          <Section title="4. Data Aggregation">
            <p>ClaimSignal analyzes data in aggregate form.</p>
            <p>Individual claims or users are not publicly identifiable through platform outputs.</p>
          </Section>

          <Section title="5. Data Sharing">
            <p className="font-medium">ClaimSignal does not sell personal data.</p>
            <p>Information may be shared only:</p>
            <ul>
              <li>To comply with legal obligations</li>
              <li>To protect platform integrity</li>
              <li>With service providers necessary for operation</li>
            </ul>
          </Section>

          <Section title="6. Data Security">
            <p>Reasonable administrative and technical safeguards are used to protect information.</p>
            <p>No system is completely secure. Users acknowledge inherent risks.</p>
          </Section>

          <Section title="7. User Choices">
            <p>Users may request account access, correction, or deletion where applicable.</p>
          </Section>

          <Section title="8. Policy Updates">
            <p>Privacy practices may change over time. Continued use constitutes acceptance.</p>
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
      <h2 className="text-base font-semibold mb-3">{title}</h2>
      <div className="text-muted-foreground text-sm space-y-2 [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:space-y-1">
        {children}
      </div>
    </motion.section>
  );
}
