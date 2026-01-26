import { Layout } from "@/components/layout";
import { Shield, Database, BarChart3, Eye, Bot, AlertCircle, RefreshCw, Scale, Target } from "lucide-react";
import { motion } from "framer-motion";

export default function Methodology() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-2">ClaimSignal Methodology</h1>
          <div className="h-1 w-24 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full mb-8" />
        </motion.div>

        <div className="space-y-12">
          <Section 
            icon={<Target className="w-5 h-5" />}
            title="Purpose"
          >
            <p className="text-muted-foreground leading-relaxed">
              ClaimSignal is a decision-support intelligence platform designed to help claim professionals anticipate adjuster behavior and carrier response patterns. The system aggregates historical claim interactions to identify risk signals that impact negotiation strategy, timing, and escalation decisions.
            </p>
            <p className="text-foreground font-medium mt-4">
              ClaimSignal does not predict outcomes. It surfaces patterns.
            </p>
          </Section>

          <Section 
            icon={<Database className="w-5 h-5" />}
            title="Data Sources"
          >
            <p className="text-muted-foreground leading-relaxed mb-4">
              ClaimSignal intelligence is derived from real-world claim activity, including but not limited to:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                <span>Adjuster communications and responses</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                <span>Denial and partial denial outcomes</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                <span>Supplement submission and approval timelines</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                <span>Escalation events and resolutions</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                <span>Claim handling notes and behavioral markers</span>
              </li>
            </ul>
            <p className="text-foreground font-medium mt-4">
              All data is analyzed at the pattern level. No single claim determines a score.
            </p>
          </Section>

          <Section 
            icon={<BarChart3 className="w-5 h-5" />}
            title="Risk Score Framework"
          >
            <p className="text-muted-foreground leading-relaxed mb-4">
              Each adjuster profile includes a proprietary ClaimSignal Risk Score.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              The Risk Score is a weighted composite derived from multiple behavioral indicators, including:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0" />
                <span>Denial frequency trends</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 shrink-0" />
                <span>Supplement resistance patterns</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                <span>Time-to-response behavior</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-2 shrink-0" />
                <span>Escalation outcomes</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                <span>Historical negotiation behavior</span>
              </li>
            </ul>
            <p className="text-muted-foreground mt-4">
              Scores are continuously updated as new claim data is logged.
            </p>
            <p className="text-foreground font-medium mt-4">
              ClaimSignal does not disclose scoring weights or formulas to preserve system integrity.
            </p>
          </Section>

          <Section 
            icon={<Eye className="w-5 h-5" />}
            title="Behavioral Analysis"
          >
            <p className="text-foreground font-medium mb-4">
              ClaimSignal focuses on observable behavior, not intent.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              The platform identifies repeatable tendencies such as:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                <span>Consistent denial thresholds</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                <span>Delay patterns</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                <span>Approval sensitivity after escalation</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                <span>Documentation requirements beyond baseline norms</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                <span>Carrier-specific handling tendencies</span>
              </li>
            </ul>
            <p className="text-muted-foreground mt-4">
              These signals help users adjust strategy proactively rather than reactively.
            </p>
          </Section>

          <Section 
            icon={<Bot className="w-5 h-5" />}
            title="AI-Assisted Intelligence"
          >
            <p className="text-muted-foreground leading-relaxed mb-4">
              AI-powered tactics are generated using historical pattern recognition across similar adjuster and carrier profiles.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              The system provides:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                <span>Negotiation guidance informed by prior outcomes</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                <span>Escalation timing recommendations</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                <span>Documentation emphasis suggestions</span>
              </li>
            </ul>
            <p className="text-foreground font-medium mt-4">
              AI output is advisory only and intended to support professional judgment.
            </p>
          </Section>

          <Section 
            icon={<AlertCircle className="w-5 h-5" />}
            title="Limitations and Scope"
          >
            <p className="text-muted-foreground leading-relaxed mb-4">
              ClaimSignal does not:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0" />
                <span>Guarantee claim outcomes</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0" />
                <span>Replace professional judgment</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0" />
                <span>Provide legal advice</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0" />
                <span>Override carrier or jurisdictional requirements</span>
              </li>
            </ul>
            <p className="text-muted-foreground mt-4">
              Results may vary based on documentation quality, jurisdiction, policy language, and claim specifics.
            </p>
          </Section>

          <Section 
            icon={<RefreshCw className="w-5 h-5" />}
            title="Data Integrity and Updates"
          >
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                <span>Scores and insights update as new data becomes available</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                <span>Anomalous or incomplete data is weighted accordingly</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                <span>Patterns require sufficient data volume to influence scoring</span>
              </li>
            </ul>
            <p className="text-foreground font-medium mt-4">
              ClaimSignal prioritizes accuracy over speed.
            </p>
          </Section>

          <Section 
            icon={<Scale className="w-5 h-5" />}
            title="Ethical Use"
          >
            <p className="text-muted-foreground leading-relaxed">
              ClaimSignal is designed to promote informed, ethical claim handling. The platform does not encourage misrepresentation, improper conduct, or abuse of process.
            </p>
          </Section>

          <Section 
            icon={<Shield className="w-5 h-5" />}
            title="Summary"
          >
            <p className="text-foreground font-medium text-lg mb-4">
              ClaimSignal equips professionals with intelligence, not shortcuts.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              The goal is clarity, preparedness, and strategic efficiency in an environment where information asymmetry traditionally exists.
            </p>
          </Section>
        </div>
      </div>
    </Layout>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <motion.section
      initial={{ y: 20, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4 }}
      className="border-b border-border/50 pb-10 last:border-0"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-amber-500/10 p-2 rounded-lg text-amber-500">
          {icon}
        </div>
        <h2 className="text-xl font-bold">{title}</h2>
      </div>
      <div className="pl-0 md:pl-12">
        {children}
      </div>
    </motion.section>
  );
}
