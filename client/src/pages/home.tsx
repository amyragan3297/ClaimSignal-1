import { Layout } from "@/components/layout";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Search, ArrowRight, FileSearch, Bot, Plus, Upload, Loader2, CheckCircle, Sparkles, BarChart3, Target, Users, Building2, BookOpen, LayoutDashboard, XCircle, ChevronRight, Shield, FileUp, AlertCircle, Clock } from "lucide-react";
import logoImage from '@assets/generated_images/modern_geometric_logo_for_claimsignal.png';
import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
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
  const [isStartingTrial, setIsStartingTrial] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { getUploadParameters } = useUpload();
  const { startTrial } = useAuth();

  const handleStartTrial = async () => {
    setIsStartingTrial(true);
    try {
      const result = await startTrial();
      if (result.success) {
        toast({
          title: "Trial Started",
          description: "You have 12 hours of viewer access. Upgrade anytime for full features!",
        });
        setLocation('/adjusters');
      } else {
        toast({
          title: "Trial Failed",
          description: result.error || "Could not start trial. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsStartingTrial(false);
    }
  };
  
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
                <Button 
                  variant="secondary" 
                  className="gap-2 bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300"
                  onClick={handleStartTrial}
                  disabled={isStartingTrial}
                  data-testid="button-start-trial"
                >
                  {isStartingTrial ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Clock className="w-4 h-4" />
                  )}
                  {isStartingTrial ? "Starting..." : "12-Hour Free Trial"}
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
                onClick={() => setLocation('/demo')}
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
