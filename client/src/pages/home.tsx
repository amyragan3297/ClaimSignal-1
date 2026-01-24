import { Layout } from "@/components/layout";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Search, ArrowRight, ShieldAlert, FileSearch, Bot, Plus, Upload, FileUp } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchAdjusters, createAdjuster, fetchClaims } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ObjectUploader } from "@/components/ObjectUploader";
import { useUpload } from "@/hooks/use-upload";

export default function Home() {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedClaimForUpload, setSelectedClaimForUpload] = useState<string>("");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { getUploadParameters } = useUpload();

  const { data: claims = [] } = useQuery({
    queryKey: ['claims'],
    queryFn: fetchClaims,
  });
  
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
        {/* Background Texture */}
        <div 
          className="absolute inset-0 z-0 opacity-20 pointer-events-none" 
          style={{ 
            backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)`, 
            backgroundSize: '30px 30px',
            backgroundPosition: 'center'
          }} 
        />
        
        {/* Radial Gradient Overlay */}
        <div className="absolute inset-0 z-0 bg-radial-[at_center_center] from-transparent to-background to-90% pointer-events-none" />

        <div className="relative z-10 w-full max-w-2xl space-y-8">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
              <ShieldAlert className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Know Your <span className="text-primary">Opponent</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-lg mx-auto">
              Intelligence on insurance adjusters. Search by name or carrier to see risk profiles, denial patterns, and negotiation history.
            </p>
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
                onComplete={(result) => {
                  toast({
                    title: "Upload complete",
                    description: `Successfully uploaded ${result.successful?.length || 0} file(s)`,
                  });
                }}
                maxNumberOfFiles={10}
                maxFileSize={50 * 1024 * 1024}
                buttonClassName="bg-card/50 border border-border/50 p-6 rounded-xl cursor-pointer hover:bg-card/70 hover:border-amber-500/30 transition-all h-auto flex flex-col items-start text-left w-full"
              >
                <div className="flex items-start justify-between mb-4 w-full">
                  <div className="bg-amber-500/20 p-2.5 rounded-lg">
                    <Upload className="w-6 h-6 text-amber-500" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-2">Upload Documents</h3>
                <p className="text-sm text-muted-foreground mb-4 font-normal">
                  Upload claim documents, photos, and evidence files.
                </p>
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
