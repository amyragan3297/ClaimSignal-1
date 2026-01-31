import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { User, MapPin, Phone, Mail, BarChart3, Bot, CheckCircle, AlertCircle, ArrowLeft, Users, Shield } from "lucide-react";
import { useLocation } from "wouter";

export default function Demo() {
  const [, setLocation] = useLocation();

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="px-6 py-6 border-b border-border/50">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setLocation('/')}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setLocation('/login?type=team')}
                className="gap-1"
              >
                <Users className="w-3 h-3" />
                Team Login
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setLocation('/login?type=individual')}
                className="gap-1"
              >
                <Shield className="w-3 h-3" />
                Individual
              </Button>
            </div>
          </div>
        </div>

        {/* Demo Content */}
        <div className="px-6 py-8">
          <div className="max-w-2xl mx-auto">
            <motion.div
              className="text-center mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <p className="text-xs uppercase tracking-widest text-amber-500 mb-1">Demo Preview</p>
              <h1 className="text-2xl font-bold mb-2">Sample Adjuster Profile</h1>
              <p className="text-sm text-muted-foreground">This is what you get with ClaimSignal access</p>
            </motion.div>
            
            <motion.div 
              className="bg-card/80 border border-border/50 rounded-xl overflow-hidden"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              {/* Profile Header */}
              <div className="p-5 border-b border-border/50 flex items-start gap-4">
                <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center border-2 border-border">
                  <User className="w-7 h-7 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-xl">Marcus Thompson</h4>
                      <p className="text-sm text-primary">State Farm</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="bg-muted text-xs px-2 py-0.5 rounded flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> Southeast
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg text-sm font-bold">
                        Risk Score: 72
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">HIGH FRICTION</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Internal Notes */}
              <div className="p-4 bg-muted/20 border-b border-border/50">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">Internal Notes</p>
                <p className="text-sm text-foreground/80">
                  Adjuster since 2019. Handles residential claims in FL, GA, AL. Known to lowball initial estimates. Works under Regional Manager Susan Chen. Best reached by email before 10am.
                </p>
              </div>

              {/* Stats Grid */}
              <div className="p-4 border-b border-border/50">
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-card/60 border border-border/40 rounded-lg p-3 text-center">
                    <p className="text-[10px] text-muted-foreground mb-1">First Contact</p>
                    <p className="text-sm font-bold">Mar 2024</p>
                  </div>
                  <div className="bg-card/60 border border-border/40 rounded-lg p-3 text-center">
                    <p className="text-[10px] text-muted-foreground mb-1">Interactions</p>
                    <p className="text-sm font-bold">47</p>
                  </div>
                  <div className="bg-card/60 border border-border/40 rounded-lg p-3 text-center">
                    <p className="text-[10px] text-muted-foreground mb-1">Claims</p>
                    <p className="text-sm font-bold">12</p>
                  </div>
                  <div className="bg-card/60 border border-border/40 rounded-lg p-3 text-center">
                    <p className="text-[10px] text-muted-foreground mb-1">Documents</p>
                    <p className="text-sm font-bold">8</p>
                  </div>
                </div>
              </div>

              {/* Behavioral Intelligence Panel */}
              <div className="p-4 border-b border-border/50">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  <p className="text-sm font-semibold">Behavioral Intelligence</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Supplement Approval</span>
                      <span className="font-semibold text-amber-500">34%</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Re-inspection Win Rate</span>
                      <span className="font-semibold text-green-500">67%</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Avg Days to Respond</span>
                      <span className="font-semibold text-orange-500">12 days</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Escalation Success</span>
                      <span className="font-semibold text-green-500">78%</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Cooperation Level</span>
                      <span className="font-semibold text-red-400">Low</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Claims Overturned</span>
                      <span className="font-semibold text-emerald-500">3</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Risk Impression & What Worked */}
              <div className="grid grid-cols-2 border-b border-border/50">
                <div className="p-4 border-r border-border/50">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Your Risk Impression</p>
                  <p className="text-xs text-foreground/80 italic">
                    "Difficult but predictable. Always denies first supplement. Push back firmly with documentation."
                  </p>
                </div>
                <div className="p-4">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">What Worked</p>
                  <p className="text-xs text-foreground/80 italic">
                    "Citing policy Section 4.2 got immediate response. CC his manager on third follow-up."
                  </p>
                </div>
              </div>

              {/* Interaction Log Preview */}
              <div className="p-4 border-b border-border/50">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Recent Interaction Log</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 bg-card/40 rounded-lg p-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-xs font-medium">Call - Re-inspection scheduled</p>
                      <p className="text-[10px] text-muted-foreground">Claim #***-7834 • Jan 22, 2026</p>
                    </div>
                    <span className="bg-green-500/20 text-green-400 text-[10px] px-2 py-0.5 rounded">Success</span>
                  </div>
                  <div className="flex items-center gap-3 bg-card/40 rounded-lg p-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-xs font-medium">Email - Supplement denied</p>
                      <p className="text-[10px] text-muted-foreground">Claim #***-7834 • Jan 15, 2026</p>
                    </div>
                    <span className="bg-red-500/20 text-red-400 text-[10px] px-2 py-0.5 rounded">Denied</span>
                  </div>
                  <div className="flex items-center gap-3 bg-card/40 rounded-lg p-2">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    <div className="flex-1">
                      <p className="text-xs font-medium">Escalation - Manager contacted</p>
                      <p className="text-[10px] text-muted-foreground">Claim #***-4902 • Jan 10, 2026</p>
                    </div>
                    <span className="bg-amber-500/20 text-amber-400 text-[10px] px-2 py-0.5 rounded">Escalated</span>
                  </div>
                </div>
              </div>

              {/* Linked Claims */}
              <div className="p-4 border-b border-border/50">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Linked Claims</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between bg-card/40 rounded-lg p-2">
                    <div>
                      <p className="text-xs font-medium">Claim #***-7834</p>
                      <p className="text-[10px] text-muted-foreground">Wind/Hail • $47,500</p>
                    </div>
                    <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-1 rounded font-semibold">OVERTURNED</span>
                  </div>
                  <div className="flex items-center justify-between bg-card/40 rounded-lg p-2">
                    <div>
                      <p className="text-xs font-medium">Claim #***-4902</p>
                      <p className="text-[10px] text-muted-foreground">Water Damage • $22,100</p>
                    </div>
                    <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-1 rounded">Open</span>
                  </div>
                  <div className="flex items-center justify-between bg-card/40 rounded-lg p-2">
                    <div>
                      <p className="text-xs font-medium">Claim #***-1156</p>
                      <p className="text-[10px] text-muted-foreground">Roof Replacement • $38,200</p>
                    </div>
                    <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded">Resolved</span>
                  </div>
                </div>
              </div>

              {/* Case Study Highlight */}
              <div className="p-4 border-b border-border/50 bg-emerald-500/5">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <p className="text-sm font-semibold text-emerald-400">Case Study: Overturned Denial</p>
                </div>
                <div className="bg-card/60 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Initial Denial</span>
                    <span>$0 approved of $47,500 claim</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Friction Signals</span>
                    <div className="flex gap-1">
                      <span className="bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded text-[10px]">Lowball</span>
                      <span className="bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded text-[10px]">Delayed</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Actions Taken</span>
                    <div className="flex gap-1">
                      <span className="bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded text-[10px]">Re-inspection</span>
                      <span className="bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded text-[10px]">Escalation</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs pt-2 border-t border-border/50">
                    <span className="text-muted-foreground">Final Outcome</span>
                    <span className="text-emerald-400 font-semibold">$47,500 approved (100%)</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground italic pt-1">
                    Turning Point: Re-inspection with detailed photo documentation triggered full reversal.
                  </p>
                </div>
              </div>

              {/* AI Tactical Advice */}
              <div className="p-4 bg-amber-500/5">
                <div className="flex items-center gap-2 mb-3">
                  <Bot className="w-4 h-4 text-amber-500" />
                  <p className="text-sm font-semibold text-amber-500">AI Tactical Advisor</p>
                </div>
                <div className="bg-card/60 rounded-lg p-3 space-y-2">
                  <p className="text-xs text-foreground/80">
                    <strong>Recommended Strategy:</strong> Based on 47 interactions with this adjuster, the most effective approach is:
                  </p>
                  <ul className="text-xs text-foreground/80 space-y-1 ml-4">
                    <li>• Document all communications in writing</li>
                    <li>• Request re-inspection within 48 hours of any denial</li>
                    <li>• Cite policy Section 4.2 for supplement disputes</li>
                    <li>• CC Regional Manager Susan Chen on third follow-up</li>
                    <li>• Prepare escalation letter if no response in 5 days</li>
                  </ul>
                  <p className="text-[10px] text-amber-400 pt-2 border-t border-border/50">
                    Success probability with this strategy: 78% based on historical patterns
                  </p>
                </div>
              </div>
            </motion.div>

            {/* CTA to Login */}
            <motion.div 
              className="mt-8 text-center space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <p className="text-sm text-muted-foreground">
                Ready to access real adjuster intelligence?
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-sm mx-auto">
                <Button 
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                  onClick={() => setLocation('/login?type=team')}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Team Login
                </Button>
                <Button 
                  variant="outline"
                  className="flex-1"
                  onClick={() => setLocation('/login?type=individual')}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Individual Login
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
