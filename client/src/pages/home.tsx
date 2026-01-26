import { Layout } from "@/components/layout";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Search, ArrowRight, FileSearch, Bot, Plus, Upload, Loader2, CheckCircle, Sparkles, BarChart3, Target, Users, Building2, BookOpen, LayoutDashboard, XCircle, ChevronRight, Shield } from "lucide-react";
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
          {/* HERO SECTION */}
          <section className="px-6 py-12 md:py-20">
            <div className="max-w-4xl mx-auto text-center space-y-6">
              <motion.h1 
                className="text-4xl md:text-6xl font-black tracking-tight text-foreground leading-tight"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                Insurance Adjuster Intelligence.
              </motion.h1>
              
              <motion.p 
                className="text-lg md:text-xl text-foreground/90 max-w-2xl mx-auto leading-relaxed"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.5 }}
              >
                Risk scores, denial patterns, and negotiation history built from real claim outcomes.
              </motion.p>
              
              <motion.p 
                className="text-base text-muted-foreground max-w-xl mx-auto"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                Search by adjuster or carrier to anticipate resistance, escalate faster, and recover what is owed.
              </motion.p>

              {/* CTAs */}
              <motion.div 
                className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold px-8"
                  onClick={() => document.getElementById('search-section')?.scrollIntoView({ behavior: 'smooth' })}
                  data-testid="button-search-adjuster"
                >
                  <Search className="w-5 h-5 mr-2" />
                  Search an Adjuster
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => adjusters.length > 0 && setLocation(`/adjuster/${adjusters[0].id}`)}
                  data-testid="button-view-sample"
                >
                  View a Sample Risk Profile
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </motion.div>
            </div>
          </section>

          {/* AUDIENCE STRIP */}
          <section className="px-6 py-8 border-y border-border/50 bg-card/30">
            <div className="max-w-4xl mx-auto text-center">
              <p className="text-lg font-medium text-foreground">
                Built for contractors, claim professionals, and property advocates.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Used on real claims. Designed for real outcomes.
              </p>
            </div>
          </section>

          {/* FEATURE TRIAD */}
          <section className="px-6 py-16">
            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left - Risk Scores */}
              <motion.div 
                className="bg-card/60 border border-border/50 rounded-xl p-6 hover:border-amber-500/40 transition-all"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Live Intel</span>
                </div>
                <div className="bg-amber-500/10 p-3 rounded-lg w-fit mb-4">
                  <BarChart3 className="w-6 h-6 text-amber-500" />
                </div>
                <h3 className="text-xl font-bold mb-2">Adjuster Risk Scores</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Composite scoring based on denial frequency, supplement resistance, escalation outcomes, and response behavior across claims.
                </p>
              </motion.div>

              {/* Center - Gateway */}
              <motion.div 
                className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-card border border-amber-500/30 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-amber-500/50 transition-all"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                onClick={() => setLocation('/adjusters')}
                data-testid="button-open-dashboard"
              >
                <div className="relative mb-4">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500/30 to-orange-500/30 blur-xl rounded-full" />
                  <div className="relative bg-gradient-to-br from-amber-500/20 to-orange-500/20 p-4 rounded-2xl border border-amber-500/30">
                    <img src={logoImage} alt="ClaimSignal" className="w-12 h-12 object-contain" />
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2">Enter Claim Signal</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Access adjuster profiles, carrier behavior data, and escalation intelligence.
                </p>
                <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
                  Open Dashboard
                </Button>
              </motion.div>

              {/* Right - AI Tactics */}
              <motion.div 
                className="bg-card/60 border border-border/50 rounded-xl p-6 hover:border-amber-500/40 transition-all"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">AI-Powered</span>
                </div>
                <div className="bg-amber-500/10 p-3 rounded-lg w-fit mb-4">
                  <Bot className="w-6 h-6 text-amber-500" />
                </div>
                <h3 className="text-xl font-bold mb-2">Negotiation Intelligence</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  AI-generated claim strategies informed by historical adjuster behavior and carrier response patterns.
                </p>
              </motion.div>
            </div>
          </section>

          {/* RISK SCORE FRAMEWORK */}
          <section className="px-6 py-16 bg-card/30 border-y border-border/50">
            <div className="max-w-3xl mx-auto">
              <motion.div 
                className="text-center mb-8"
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
              >
                <h2 className="text-2xl md:text-3xl font-bold mb-4">Claim Signal Risk Score</h2>
                <p className="text-muted-foreground">A weighted composite score derived from:</p>
              </motion.div>
              
              <motion.div 
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex items-center gap-3 bg-card/60 border border-border/50 rounded-lg p-4">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-sm">Denial frequency</span>
                </div>
                <div className="flex items-center gap-3 bg-card/60 border border-border/50 rounded-lg p-4">
                  <div className="w-2 h-2 rounded-full bg-orange-500" />
                  <span className="text-sm">Supplement approval resistance</span>
                </div>
                <div className="flex items-center gap-3 bg-card/60 border border-border/50 rounded-lg p-4">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-sm">Time-to-response behavior</span>
                </div>
                <div className="flex items-center gap-3 bg-card/60 border border-border/50 rounded-lg p-4">
                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
                  <span className="text-sm">Escalation outcomes</span>
                </div>
                <div className="flex items-center gap-3 bg-card/60 border border-border/50 rounded-lg p-4 sm:col-span-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm">Historical negotiation patterns</span>
                </div>
              </motion.div>
              
              <p className="text-center text-sm text-muted-foreground mt-6">
                Scores update as new claim data is logged.
              </p>
            </div>
          </section>

          {/* SEARCH SECTION */}
          <section id="search-section" className="px-6 py-16">
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">Search Adjuster Database</h2>
                <p className="text-muted-foreground">Find adjuster profiles by name or carrier</p>
              </div>

              <div className="flex justify-end mb-4">
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                  <DialogTrigger asChild>
                    <Button variant="secondary" size="sm" className="gap-2" data-testid="button-add-adjuster">
                      <Plus className="w-4 h-4" />
                      Add Adjuster
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Adjuster</DialogTitle>
                      <DialogDescription>
                        Enter the adjuster's basic information to start building their intelligence profile.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Name *</Label>
                        <Input 
                          placeholder="e.g., John Smith"
                          value={newAdjuster.name}
                          onChange={(e) => setNewAdjuster({...newAdjuster, name: e.target.value})}
                          data-testid="input-adjuster-name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Carrier *</Label>
                        <Input 
                          placeholder="e.g., State Farm"
                          value={newAdjuster.carrier}
                          onChange={(e) => setNewAdjuster({...newAdjuster, carrier: e.target.value})}
                          data-testid="input-adjuster-carrier"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Region</Label>
                        <Input 
                          placeholder="e.g., Southeast, Texas, National"
                          value={newAdjuster.region}
                          onChange={(e) => setNewAdjuster({...newAdjuster, region: e.target.value})}
                          data-testid="input-adjuster-region"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Phone</Label>
                          <Input 
                            placeholder="(555) 123-4567"
                            value={newAdjuster.phone}
                            onChange={(e) => setNewAdjuster({...newAdjuster, phone: e.target.value})}
                            data-testid="input-adjuster-phone"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Email</Label>
                          <Input 
                            placeholder="adjuster@carrier.com"
                            value={newAdjuster.email}
                            onChange={(e) => setNewAdjuster({...newAdjuster, email: e.target.value})}
                            data-testid="input-adjuster-email"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Internal Notes</Label>
                        <Textarea 
                          placeholder="Any initial observations about this adjuster..."
                          value={newAdjuster.internalNotes}
                          onChange={(e) => setNewAdjuster({...newAdjuster, internalNotes: e.target.value})}
                          data-testid="input-adjuster-notes"
                        />
                      </div>
                      <Button 
                        className="w-full" 
                        onClick={handleAddAdjuster}
                        disabled={!newAdjuster.name || !newAdjuster.carrier || createAdjusterMutation.isPending}
                        data-testid="button-save-adjuster"
                      >
                        {createAdjusterMutation.isPending ? 'Adding...' : 'Add Adjuster'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="relative group">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-lg group-hover:bg-primary/30 transition-all opacity-0 group-hover:opacity-100" />
                <div className="relative flex items-center">
                  <Search className="absolute left-4 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input 
                    className="h-14 pl-12 pr-4 text-lg bg-card/80 backdrop-blur-md border-primary/20 hover:border-primary/40 focus:border-primary shadow-lg transition-all rounded-xl"
                    placeholder="Search adjuster name or carrier..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    data-testid="input-search"
                  />
                </div>
              </div>

              {query.length > 1 && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card/90 backdrop-blur-md border border-border rounded-xl shadow-xl overflow-hidden divide-y divide-border/50"
                >
                  {filteredAdjusters.length > 0 ? (
                    filteredAdjusters.map((adj) => (
                      <div 
                        key={adj.id} 
                        className="p-4 hover:bg-white/5 cursor-pointer flex items-center justify-between group transition-colors"
                        onClick={() => setLocation(`/adjuster/${adj.id}`)}
                        data-testid={`card-adjuster-${adj.id}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-2 h-12 rounded-full bg-primary/60" />
                          <div>
                            <h3 className="font-semibold text-lg" data-testid={`text-adjuster-name-${adj.id}`}>{adj.name}</h3>
                            <p className="text-sm text-muted-foreground" data-testid={`text-adjuster-carrier-${adj.id}`}>{adj.carrier}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                           {adj.region && (
                             <div className="text-right hidden sm:block">
                                <span className="text-xs uppercase tracking-wider text-muted-foreground block">Region</span>
                                <span className="text-sm">{adj.region}</span>
                             </div>
                           )}
                           <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-1" />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      <FileSearch className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p>No adjusters found matching "{query}"</p>
                      <p className="text-sm mt-2">Try searching by carrier name (e.g., "State Farm")</p>
                    </div>
                  )}
                </motion.div>
              )}
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

          {/* CTA REPEAT */}
          <section className="px-6 py-16">
            <div className="max-w-2xl mx-auto text-center space-y-6">
              <h2 className="text-2xl font-bold">Ready to level the field?</h2>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold px-8"
                  onClick={() => setLocation('/adjusters')}
                >
                  <Search className="w-5 h-5 mr-2" />
                  Search an Adjuster
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => setLocation('/tactical-advisor')}
                >
                  <Bot className="w-5 h-5 mr-2" />
                  Try Tactical Advisor
                </Button>
              </div>
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
                  <button onClick={() => setLocation('/methodology')} className="hover:text-foreground transition-colors">Methodology</button>
                </div>
              </div>
              <div className="text-center text-xs text-muted-foreground border-t border-border/50 pt-6">
                <p>Claim Signal provides decision-support intelligence based on historical data. Outcomes may vary by claim, jurisdiction, and documentation.</p>
                <p className="mt-2">&copy; {new Date().getFullYear()} ClaimSignal. All rights reserved.</p>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </Layout>
  );
}
