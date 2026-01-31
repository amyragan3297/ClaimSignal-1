import { Layout } from "@/components/layout";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Search, ArrowRight, FileSearch, Bot, Plus, Upload, Loader2, CheckCircle, Sparkles, BarChart3, Target, Users, Building2, BookOpen, LayoutDashboard, XCircle, ChevronRight, Shield, FileUp, AlertCircle } from "lucide-react";
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
          {/* LOGIN OPTIONS - First */}
          <section className="px-6 pt-10 pb-4">
            <div className="max-w-md mx-auto">
              <motion.div 
                className="flex flex-col sm:flex-row gap-3 justify-center"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4 }}
              >
                <Button 
                  variant="outline" 
                  className="flex-1 gap-2"
                  onClick={() => setLocation('/login?type=team')}
                  data-testid="button-team-login"
                >
                  <Users className="w-4 h-4" />
                  Team Login
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1 gap-2"
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

          {/* HERO SECTION */}
          <section className="px-6 py-8">
            <div className="max-w-3xl mx-auto text-center space-y-5">
              <motion.h1 
                className="text-3xl md:text-5xl font-black tracking-tight text-foreground leading-tight"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                Insurance Adjuster Intelligence.
              </motion.h1>
              
              <motion.p 
                className="text-base md:text-lg text-foreground/90 max-w-xl mx-auto leading-relaxed"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.35, duration: 0.5 }}
              >
                Risk scores, denial patterns, and negotiation history built from real claim outcomes.
              </motion.p>

              <motion.p 
                className="text-sm text-muted-foreground max-w-xl mx-auto"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                Search by adjuster or carrier to anticipate resistance, escalate faster, and recover what is owed.
              </motion.p>

              <motion.p
                className="text-lg font-semibold text-amber-500"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.45, duration: 0.5 }}
              >
                Level the playing field.
              </motion.p>
            </div>
          </section>

          {/* SAMPLE PREVIEW - Full Feature Showcase */}
          <section className="px-6 py-8">
            <div className="max-w-lg mx-auto">
              <motion.div
                className="text-center mb-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Sample Adjuster Profile</p>
              </motion.div>
              <motion.div 
                className="bg-card/80 border border-border/50 rounded-xl overflow-hidden"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.55, duration: 0.5 }}
              >
                {/* Header */}
                <div className="p-5 border-b border-border/50">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-lg">Marcus Thompson</h4>
                      <p className="text-sm text-muted-foreground">State Farm • Southeast Region</p>
                    </div>
                    <div className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-semibold">
                      Risk: 72
                    </div>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="p-4 bg-card/40 border-b border-border/50">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Performance Metrics</p>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="bg-card/60 rounded-lg p-2">
                      <p className="text-base font-bold text-amber-500">34%</p>
                      <p className="text-[9px] text-muted-foreground">Supplement Approval</p>
                    </div>
                    <div className="bg-card/60 rounded-lg p-2">
                      <p className="text-base font-bold text-orange-500">12</p>
                      <p className="text-[9px] text-muted-foreground">Avg Days to Respond</p>
                    </div>
                    <div className="bg-card/60 rounded-lg p-2">
                      <p className="text-base font-bold text-red-400">High</p>
                      <p className="text-[9px] text-muted-foreground">Friction Level</p>
                    </div>
                    <div className="bg-card/60 rounded-lg p-2">
                      <p className="text-base font-bold text-green-500">3</p>
                      <p className="text-[9px] text-muted-foreground">Claims Overturned</p>
                    </div>
                  </div>
                </div>

                {/* Behavioral Intel */}
                <div className="p-4 border-b border-border/50">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Behavioral Intelligence</p>
                  <p className="text-xs text-foreground/80 italic">
                    "Known to push back on supplemental requests. Responds better to documented re-inspections. Escalates quickly when challenged directly."
                  </p>
                </div>

                {/* Interaction History */}
                <div className="p-4 border-b border-border/50">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Recent Interactions</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      <span className="text-muted-foreground">Jan 15</span>
                      <span>Email - Supplement denied, requested re-inspection</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      <span className="text-muted-foreground">Jan 22</span>
                      <span>Call - Re-inspection approved after escalation</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-muted-foreground">Jan 28</span>
                      <span>Claim overturned - Full settlement approved</span>
                    </div>
                  </div>
                </div>

                {/* Linked Claims */}
                <div className="p-4 border-b border-border/50">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Linked Claims</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-card/60 border border-border/50 rounded px-2 py-1 text-xs">***-4902</span>
                    <span className="bg-card/60 border border-border/50 rounded px-2 py-1 text-xs">***-1156</span>
                    <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded px-2 py-1 text-xs">***-7834 (Overturned)</span>
                  </div>
                </div>

                {/* AI Tactics */}
                <div className="p-4 bg-amber-500/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Bot className="w-4 h-4 text-amber-500" />
                    <p className="text-[10px] uppercase tracking-widest text-amber-500">AI Tactical Advice</p>
                  </div>
                  <p className="text-xs text-foreground/80">
                    "Based on this adjuster's pattern, recommend documenting all communications in writing. Request re-inspection within 48 hours of denial. Prepare escalation letter referencing policy Section 4.2."
                  </p>
                </div>
              </motion.div>
            </div>
          </section>

          {/* FEATURE CARDS - Side by Side */}
          <section className="px-6 py-8">
            <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Risk Scores */}
              <motion.div 
                className="bg-card/60 border border-border/50 rounded-xl p-5 hover:border-amber-500/40 cursor-pointer transition-all group"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                onClick={() => setLocation('/risk-alerts')}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Live Intel</span>
                </div>
                <div className="bg-amber-500/10 p-2.5 rounded-lg w-fit mb-3">
                  <BarChart3 className="w-5 h-5 text-amber-500" />
                </div>
                <h3 className="text-lg font-bold mb-1 group-hover:text-amber-500 transition-colors">Adjuster Risk Scores</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Composite scoring based on denial patterns and escalation outcomes.
                </p>
              </motion.div>

              {/* AI Tactics */}
              <motion.div 
                className="bg-card/60 border border-border/50 rounded-xl p-5 hover:border-amber-500/40 cursor-pointer transition-all group"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                onClick={() => setLocation('/tactical-advisor')}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">AI-Powered</span>
                </div>
                <div className="bg-amber-500/10 p-2.5 rounded-lg w-fit mb-3">
                  <Bot className="w-5 h-5 text-amber-500" />
                </div>
                <h3 className="text-lg font-bold mb-1 group-hover:text-amber-500 transition-colors">Negotiation Intelligence</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  AI-generated strategies informed by adjuster behavior patterns.
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
