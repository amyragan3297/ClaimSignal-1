import { Layout } from "@/components/layout";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Search, ArrowRight, FileSearch, Bot, Plus, Upload, Loader2, CheckCircle, Sparkles } from "lucide-react";
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

  // Filter adjusters based on search
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
      <div className="relative min-h-[calc(100vh-4rem)] md:min-h-screen flex flex-col justify-center items-center p-6 overflow-hidden">
        {/* Animated Gradient Orbs */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          {/* Large ambient orb - top right */}
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-transparent blur-3xl animate-float" />
          {/* Medium orb - bottom left */}
          <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-red-500/15 via-orange-500/10 to-transparent blur-3xl animate-float-delayed" />
          {/* Small accent orb - center */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-radial from-amber-500/5 via-transparent to-transparent blur-2xl" />
        </div>

        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
          style={{ 
            backgroundImage: `linear-gradient(rgba(255, 255, 255, 1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 1) 1px, transparent 1px)`, 
            backgroundSize: '60px 60px',
            backgroundPosition: 'center'
          }} 
        />
        
        {/* Radial Gradient Overlay */}
        <div className="absolute inset-0 z-0 bg-gradient-radial from-transparent via-background/50 to-background pointer-events-none" />
        
        {/* Top fade */}
        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-background to-transparent z-0 pointer-events-none" />

        <div className="relative z-10 w-full max-w-3xl space-y-8">
          <div className="text-center space-y-6">
            {/* ClaimSignal Logo with Feature Badges */}
            <motion.div 
              className="relative inline-flex items-center justify-center"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, type: "spring" }}
            >
              {/* Floating Feature Badges */}
              <motion.div 
                className="absolute -left-32 md:-left-44 top-1/2 -translate-y-1/2"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl px-4 py-3 shadow-xl">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-medium text-muted-foreground">Live Intel</span>
                  </div>
                  <p className="text-lg font-bold text-foreground mt-1">Risk Scores</p>
                </div>
              </motion.div>
              
              <motion.div 
                className="absolute -right-32 md:-right-44 top-1/2 -translate-y-1/2"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.5 }}
              >
                <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl px-4 py-3 shadow-xl">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-xs font-medium text-muted-foreground">AI-Powered</span>
                  </div>
                  <p className="text-lg font-bold text-foreground mt-1">Tactics</p>
                </div>
              </motion.div>

              {/* Outer glow rings - larger */}
              <div className="absolute w-48 h-48 -m-8">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-500/40 via-orange-500/30 to-red-500/40 blur-2xl animate-pulse" />
                <div className="absolute inset-4 rounded-full bg-gradient-to-r from-amber-400/30 to-orange-500/30 blur-xl animate-pulse" style={{ animationDelay: '0.5s' }} />
                <div className="absolute inset-8 rounded-full bg-gradient-to-r from-orange-500/20 to-amber-400/20 blur-lg animate-pulse" style={{ animationDelay: '1s' }} />
              </div>
              
              {/* Logo container - bigger */}
              <div className="relative p-6 bg-gradient-to-br from-amber-500/30 via-orange-500/20 to-red-500/30 rounded-3xl border-2 border-amber-500/40 backdrop-blur-sm shadow-2xl shadow-amber-500/20">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-transparent rounded-3xl" />
                <img 
                  src={logoImage} 
                  alt="ClaimSignal" 
                  className="relative w-20 h-20 object-contain drop-shadow-[0_0_25px_rgba(251,191,36,0.6)]" 
                />
              </div>
            </motion.div>
            
            {/* Animated Title - Line 1 */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <h1 className="text-5xl md:text-7xl font-black tracking-tight">
                <span className="bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent">Level the Field.</span>
              </h1>
            </motion.div>
            
            {/* Animated Title - Line 2 */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.6 }}
            >
              <h2 className="text-5xl md:text-7xl font-black tracking-tight">
                <span className="relative">
                  <span className="bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
                    Claim the Advantage.
                  </span>
                  {/* Underline glow effect */}
                  <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 rounded-full blur-sm opacity-60" />
                  <div className="absolute -bottom-2 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 rounded-full" />
                </span>
              </h2>
            </motion.div>
            
            {/* Subtitle with stagger animation */}
            <motion.p 
              className="text-lg md:text-xl text-muted-foreground max-w-lg mx-auto leading-relaxed"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <span className="text-foreground/90 font-medium">Intelligence on insurance adjusters.</span>{" "}
              Search by name or carrier to see risk profiles, denial patterns, and negotiation history.
            </motion.p>
            
            {/* Stats Row */}
            <motion.div 
              className="flex flex-wrap justify-center gap-6 md:gap-10 pt-4"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                  {adjusters.length || '—'}
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Adjusters Tracked</div>
              </div>
              <div className="w-px h-12 bg-border/50 hidden md:block" />
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
                  {new Set(adjusters.map(a => a.carrier)).size || '—'}
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Carriers Monitored</div>
              </div>
              <div className="w-px h-12 bg-border/50 hidden md:block" />
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                  AI
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Powered Insights</div>
              </div>
            </motion.div>
          </div>

          <div className="space-y-4">
            {/* Add Adjuster Button */}
            <div className="flex justify-end">
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
                  className="h-16 pl-12 pr-4 text-lg bg-card/80 backdrop-blur-md border-primary/20 hover:border-primary/40 focus:border-primary shadow-2xl transition-all rounded-xl"
                  placeholder="Search adjuster name or carrier..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  data-testid="input-search"
                />
              </div>
            </div>

            {/* Live Search Results */}
            {query.length > 1 && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card/90 backdrop-blur-md border border-border rounded-xl shadow-2xl overflow-hidden divide-y divide-border/50"
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

          {!query && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              <div 
                className="bg-card/50 border border-border/50 p-6 rounded-xl cursor-pointer hover:bg-card/70 hover:border-amber-500/30 transition-all"
                data-testid="button-tactical-advisor"
                onClick={() => setLocation("/tactical-advisor")}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="bg-amber-500/20 p-2.5 rounded-lg">
                    <Bot className="w-6 h-6 text-amber-500" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-2">Tactical Advisor</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Get AI-powered strategy recommendations for your current claims.
                </p>
              </div>

              <div 
                className="bg-card/50 border border-border/50 p-6 rounded-xl cursor-pointer hover:bg-card/70 hover:border-amber-500/30 transition-all"
                onClick={() => setLocation("/analytics")}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="bg-amber-500/20 p-2.5 rounded-lg">
                    <FileSearch className="w-6 h-6 text-amber-500" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-2">Pattern Analysis</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Deep dive analytics into carrier denial trends.
                </p>
              </div>

              <ObjectUploader
                onGetUploadParameters={getUploadParameters}
                onComplete={async (result) => {
                  const files = result.successful || [];
                  if (files.length === 0) return;
                  
                  setIsAnalyzing(true);
                  setAnalysisResults(files.map(f => ({ name: f.name, status: 'pending' as const })));
                  
                  let successCount = 0;
                  let errorCount = 0;
                  
                  for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    setAnalysisResults(prev => prev.map((r, idx) => 
                      idx === i ? { ...r, status: 'analyzing' as const } : r
                    ));
                    
                    try {
                      // Get objectPath from file meta (set during getUploadParameters)
                      const objectPath = file.meta?.objectPath as string | undefined;
                      
                      if (!objectPath) {
                        throw new Error('File path not available');
                      }
                      
                      const response = await fetch('/api/analyze-and-save', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          documentUrl: objectPath,
                          documentName: file.name,
                        }),
                      });
                      
                      const data = await response.json();
                      
                      if (data.success) {
                        successCount++;
                        setAnalysisResults(prev => prev.map((r, idx) => 
                          idx === i ? { ...r, status: 'done' as const, message: data.message } : r
                        ));
                      } else {
                        errorCount++;
                        setAnalysisResults(prev => prev.map((r, idx) => 
                          idx === i ? { ...r, status: 'error' as const, message: data.error } : r
                        ));
                      }
                    } catch (error) {
                      errorCount++;
                      setAnalysisResults(prev => prev.map((r, idx) => 
                        idx === i ? { ...r, status: 'error' as const, message: error instanceof Error ? error.message : 'Analysis failed' } : r
                      ));
                    }
                  }
                  
                  queryClient.invalidateQueries({ queryKey: ['adjusters'] });
                  queryClient.invalidateQueries({ queryKey: ['claims'] });
                  
                  if (errorCount === 0) {
                    toast({
                      title: "Documents processed",
                      description: `AI analyzed ${successCount} document(s) and sorted them into claims`,
                    });
                  } else if (successCount > 0) {
                    toast({
                      title: "Partial success",
                      description: `Processed ${successCount} file(s), ${errorCount} failed`,
                      variant: "destructive",
                    });
                  } else {
                    toast({
                      title: "Analysis failed",
                      description: `Could not process ${errorCount} file(s)`,
                      variant: "destructive",
                    });
                  }
                  
                  setTimeout(() => {
                    setIsAnalyzing(false);
                    setAnalysisResults([]);
                  }, 5000);
                }}
                maxNumberOfFiles={10}
                maxFileSize={50 * 1024 * 1024}
                buttonClassName="bg-card/50 border border-border/50 p-6 rounded-xl cursor-pointer hover:bg-card/70 hover:border-amber-500/30 transition-all h-auto flex flex-col items-start text-left w-full"
              >
                <div className="flex items-start justify-between mb-4 w-full">
                  <div className="bg-amber-500/20 p-2.5 rounded-lg">
                    {isAnalyzing ? (
                      <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
                    ) : (
                      <Upload className="w-6 h-6 text-amber-500" />
                    )}
                  </div>
                  {isAnalyzing && (
                    <div className="flex items-center gap-1 text-xs text-amber-500">
                      <Sparkles className="w-3 h-3" />
                      AI Processing
                    </div>
                  )}
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  {isAnalyzing ? 'Processing...' : 'Smart Upload'}
                </h3>
                <p className="text-sm text-muted-foreground mb-4 font-normal">
                  {isAnalyzing 
                    ? 'AI is extracting claim info and sorting documents...' 
                    : 'AI automatically extracts claim data and sorts into the right claim'}
                </p>
                {analysisResults.length > 0 && (
                  <div className="w-full space-y-1 text-xs">
                    {analysisResults.map((result, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        {result.status === 'pending' && <div className="w-3 h-3 rounded-full bg-muted" />}
                        {result.status === 'analyzing' && <Loader2 className="w-3 h-3 animate-spin text-amber-500" />}
                        {result.status === 'done' && <CheckCircle className="w-3 h-3 text-green-500" />}
                        {result.status === 'error' && <div className="w-3 h-3 rounded-full bg-red-500" />}
                        <span className="truncate flex-1">{result.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </ObjectUploader>
            </motion.div>
          )}
          
          <div className="text-center">
            <p className="text-xs text-muted-foreground/50 uppercase tracking-widest font-mono">
              Confidential Internal System • Version 1.0
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
