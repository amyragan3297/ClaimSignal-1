import { Layout } from "@/components/layout";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Search, ArrowRight, FileSearch, Bot, Plus, Upload, Loader2, CheckCircle, Sparkles, BarChart3, Target, Users, Building2, BookOpen, LayoutDashboard, XCircle, ChevronRight, Shield, FileUp, AlertCircle, User, MapPin, Phone, Mail } from "lucide-react";
import logoImage from '@assets/generated_images/modern_geometric_logo_for_claimsignal.png';
import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchAdjusters, createAdjuster } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ObjectUploader } from "@/components/ObjectUploader";
import { useUpload } from "@/hooks/use-upload";

interface SmartUploadResult {
  fileName: string;
  status: 'pending' | 'uploading' | 'analyzing' | 'done' | 'error';
  message?: string;
  extracted?: {
    adjusterName?: string;
    carrier?: string;
    claimId?: string;
    homeownerName?: string;
    propertyAddress?: string;
  };
  createdAdjusterId?: string;
  createdClaimId?: string;
}

export default function Home() {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<Array<{ name: string; status: 'pending' | 'analyzing' | 'done' | 'error'; message?: string }>>([]);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { getUploadParameters } = useUpload();
  
  const { data: adjusters = [] } = useQuery({
    queryKey: ['adjusters'],
    queryFn: fetchAdjusters,
  });

  const [newAdjuster, setNewAdjuster] = useState({
    name: '',
    carrier: '',
    region: '',
    phone: '',
    email: '',
    internalNotes: '',
  });

  const createAdjusterMutation = useMutation({
    mutationFn: createAdjuster,
    onSuccess: (adjuster) => {
      queryClient.invalidateQueries({ queryKey: ['adjusters'] });
      toast({
        title: "Adjuster Added",
        description: `${adjuster.name} has been added to the database.`,
      });
      setIsAddOpen(false);
      setNewAdjuster({ name: '', carrier: '', region: '', phone: '', email: '', internalNotes: '' });
      setLocation(`/adjuster/${adjuster.id}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add adjuster. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAddAdjuster = () => {
    if (!newAdjuster.name || !newAdjuster.carrier) return;
    
    createAdjusterMutation.mutate({
      name: newAdjuster.name,
      carrier: newAdjuster.carrier,
      region: newAdjuster.region || null,
      phone: newAdjuster.phone || null,
      email: newAdjuster.email || null,
      internalNotes: newAdjuster.internalNotes || null,
      riskImpression: null,
    });
  };

  const filteredAdjusters = query.length > 1 
    ? adjusters.filter(a => 
        a.name.toLowerCase().includes(query.toLowerCase()) || 
        a.carrier.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && filteredAdjusters.length > 0) {
      setLocation(`/adjuster/${filteredAdjusters[0].id}`);
    }
  };

  return (
    <Layout>
      <div className="relative min-h-[calc(100vh-4rem)]">
        {/* Background Elements */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[400px] h-[400px] rounded-full bg-gradient-to-br from-amber-500/15 via-orange-500/8 to-transparent blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-[350px] h-[350px] rounded-full bg-gradient-to-tr from-red-500/10 via-orange-500/8 to-transparent blur-3xl" />
        </div>

        <div className="relative z-10">
          {/* HERO - What is ClaimSignal */}
          <section className="px-6 pt-10 pb-6">
            <div className="max-w-lg mx-auto text-center space-y-4">
              <motion.h1 
                className="text-3xl md:text-4xl font-black tracking-tight text-foreground leading-tight"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                Insurance Adjuster Intelligence.
              </motion.h1>
              <motion.p 
                className="text-base text-foreground/90"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.5 }}
              >
                Risk scores, denial patterns, and negotiation history built from real claim outcomes.
              </motion.p>
              <motion.p 
                className="text-sm text-muted-foreground"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.5 }}
              >
                Search by adjuster or carrier to anticipate resistance, escalate faster, and recover what is owed.
              </motion.p>
              <motion.p
                className="text-lg font-semibold text-amber-500"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                Level the playing field.
              </motion.p>

              {/* Action Buttons */}
              <motion.div 
                className="flex flex-col gap-3 pt-2"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.25, duration: 0.5 }}
              >
                <Button 
                  size="lg" 
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold"
                  onClick={() => setLocation('/adjusters')}
                  data-testid="button-search-adjuster"
                >
                  <Search className="w-5 h-5 mr-2" />
                  Search an Adjuster
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="w-full"
                  onClick={() => document.getElementById('sample-profile')?.scrollIntoView({ behavior: 'smooth' })}
                  data-testid="button-view-sample"
                >
                  View a Sample Risk Profile
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </motion.div>
            </div>
          </section>

          {/* LOGIN OPTIONS - Side by Side */}
          <section className="px-6 py-4">
            <div className="max-w-sm mx-auto">
              <motion.div 
                className="grid grid-cols-2 gap-3"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.4 }}
              >
                <Button 
                  variant="outline" 
                  className="gap-2"
                  onClick={() => setLocation('/login?type=team')}
                  data-testid="button-team-login"
                >
                  <Users className="w-4 h-4" />
                  Team Login
                </Button>
                <Button 
                  variant="outline" 
                  className="gap-2"
                  onClick={() => setLocation('/login?type=individual')}
                  data-testid="button-individual-login"
                >
                  <Shield className="w-4 h-4" />
                  Individual Login
                </Button>
              </motion.div>
            </div>
          </section>

          {/* ENTER CLAIMSIGNAL - Gateway */}
          <section className="px-6 py-6">
            <div className="max-w-md mx-auto">
              <motion.div 
                className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-card border border-amber-500/30 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-amber-500/50 transition-all"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                onClick={() => setLocation('/adjusters')}
                data-testid="button-open-dashboard"
              >
                <div className="relative mb-4">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500/30 to-orange-500/30 blur-xl rounded-full" />
                  <div className="relative bg-gradient-to-br from-amber-500/20 to-orange-500/20 p-4 rounded-2xl border border-amber-500/30">
                    <img src={logoImage} alt="ClaimSignal" className="w-12 h-12 object-contain" />
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2">Enter ClaimSignal</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Access adjuster profiles, carrier behavior data, and escalation intelligence.
                </p>
                <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
                  Open Dashboard
                </Button>
              </motion.div>
            </div>
          </section>

          {/* SAMPLE PREVIEW - Full App Showcase */}
          <section id="sample-profile" className="px-6 py-8">
            <div className="max-w-2xl mx-auto">
              <motion.div
                className="text-center mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">What You Get</p>
                <p className="text-sm text-foreground/70">Real adjuster profile from the ClaimSignal database</p>
              </motion.div>
              
              <motion.div 
                className="bg-card/80 border border-border/50 rounded-xl overflow-hidden"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.55, duration: 0.5 }}
              >
                {/* Profile Header - Like the real app */}
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

                {/* Internal Notes - Like the real app */}
                <div className="p-4 bg-muted/20 border-b border-border/50">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">Internal Notes</p>
                  <p className="text-sm text-foreground/80">
                    Adjuster since 2019. Handles residential claims in FL, GA, AL. Known to lowball initial estimates. Works under Regional Manager Susan Chen. Best reached by email before 10am.
                  </p>
                </div>

                {/* Stats Grid - Like the real app */}
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
            </div>
          </section>

          {/* FEATURE CARDS - Always Side by Side */}
          <section className="px-6 py-8">
            <div className="max-w-lg mx-auto grid grid-cols-2 gap-3">
              {/* Risk Scores */}
              <motion.div 
                className="bg-card/60 border border-border/50 rounded-xl p-4 hover:border-amber-500/40 cursor-pointer transition-all group"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                onClick={() => setLocation('/risk-alerts')}
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Live Intel</span>
                </div>
                <div className="bg-amber-500/10 p-2 rounded-lg w-fit mb-2">
                  <BarChart3 className="w-4 h-4 text-amber-500" />
                </div>
                <h3 className="text-sm font-bold mb-1 group-hover:text-amber-500 transition-colors">Adjuster Risk Scores</h3>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Scoring based on denial patterns and outcomes.
                </p>
              </motion.div>

              {/* AI Tactics */}
              <motion.div 
                className="bg-card/60 border border-border/50 rounded-xl p-4 hover:border-amber-500/40 cursor-pointer transition-all group"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                onClick={() => setLocation('/tactical-advisor')}
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">AI-Powered</span>
                </div>
                <div className="bg-amber-500/10 p-2 rounded-lg w-fit mb-2">
                  <Bot className="w-4 h-4 text-amber-500" />
                </div>
                <h3 className="text-sm font-bold mb-1 group-hover:text-amber-500 transition-colors">Negotiation Intelligence</h3>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  AI strategies from adjuster behavior patterns.
                </p>
              </motion.div>
            </div>
          </section>

          {/* TRUST SECTION */}
          <section className="px-6 py-12 bg-card/30 border-t border-border/50">
            <div className="max-w-3xl mx-auto text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Shield className="w-6 h-6 text-amber-500" />
              </div>
              <p className="text-lg font-medium text-foreground">
                Built on real claim outcomes and field-tested negotiation data.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Designed by professionals who work claims daily.
              </p>
            </div>
          </section>

          {/* FOOTER */}
          <footer className="px-6 py-8 border-t border-border/50 bg-card/20">
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <img src={logoImage} alt="ClaimSignal" className="w-6 h-6" />
                  <span className="font-bold">CLAIM<span className="text-primary">SIGNAL</span></span>
                </div>
                <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
                  <button onClick={() => setLocation('/adjusters')} className="hover:text-foreground transition-colors">Adjuster Intel</button>
                  <button onClick={() => setLocation('/carriers')} className="hover:text-foreground transition-colors">Carrier Profiles</button>
                  <button onClick={() => setLocation('/tactical-advisor')} className="hover:text-foreground transition-colors">Tactics Library</button>
                  <button onClick={() => setLocation('/analytics')} className="hover:text-foreground transition-colors">Dashboard</button>
                </div>
              </div>
              
              <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground mb-6">
                <button onClick={() => setLocation('/methodology')} className="hover:text-foreground transition-colors">Methodology</button>
                <span className="text-border">|</span>
                <button onClick={() => setLocation('/legal')} className="hover:text-foreground transition-colors">Legal</button>
                <span className="text-border">|</span>
                <button onClick={() => setLocation('/terms')} className="hover:text-foreground transition-colors">Terms of Service</button>
                <span className="text-border">|</span>
                <button onClick={() => setLocation('/privacy')} className="hover:text-foreground transition-colors">Privacy Policy</button>
              </div>

              <div className="text-center text-xs text-muted-foreground border-t border-border/50 pt-6 space-y-2">
                <p>ClaimSignal provides informational intelligence based on historical claim patterns. Scores and insights are not guarantees or predictions. Professional judgment remains essential. ClaimSignal does not provide legal or insurance advice.</p>
                <p className="mt-4">&copy; {new Date().getFullYear()} ClaimSignal. All rights reserved.</p>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </Layout>
  );
}
