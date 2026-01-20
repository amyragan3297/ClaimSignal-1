import { Layout } from "@/components/layout";
import { Input } from "@/components/ui/input";
import { Search, ArrowRight, ShieldAlert, FileSearch, Bot, Sparkles } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { useStore } from "@/lib/store";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const adjusters = useStore((state) => state.adjusters);

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
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-2 h-12 rounded-full ${
                          adj.riskLevel === 'Severe' ? 'bg-destructive' :
                          adj.riskLevel === 'High' ? 'bg-orange-500' :
                          adj.riskLevel === 'Medium' ? 'bg-yellow-500' : 'bg-emerald-500'
                        }`} />
                        <div>
                          <h3 className="font-semibold text-lg">{adj.name}</h3>
                          <p className="text-sm text-muted-foreground">{adj.carrier}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                         <div className="text-right hidden sm:block">
                            <span className="text-xs uppercase tracking-wider text-muted-foreground block">Risk Level</span>
                            <span className={`font-mono font-bold ${
                              adj.riskLevel === 'Severe' ? 'text-destructive' :
                              adj.riskLevel === 'High' ? 'text-orange-500' :
                              adj.riskLevel === 'Medium' ? 'text-yellow-500' : 'text-emerald-500'
                            }`}>{adj.riskLevel.toUpperCase()}</span>
                         </div>
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
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div 
                className="bg-card/50 backdrop-blur-sm border border-border/50 p-6 rounded-xl hover:bg-card/80 transition-all cursor-pointer group"
                onClick={() => setLocation('/chat')}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="bg-primary/10 p-2.5 rounded-lg">
                    <Bot className="w-6 h-6 text-primary" />
                  </div>
                  <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                </div>
                <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">Tactical Advisor</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Get AI-powered strategy recommendations for your current claims.
                </p>
                <div className="flex items-center text-sm text-primary font-medium">
                  Start Session <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              <div className="bg-card/30 border border-border/30 p-6 rounded-xl opacity-60">
                <div className="flex items-start justify-between mb-4">
                  <div className="bg-muted p-2.5 rounded-lg">
                    <FileSearch className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <span className="text-[10px] uppercase font-mono bg-muted px-2 py-0.5 rounded text-muted-foreground">Coming Soon</span>
                </div>
                <h3 className="text-lg font-semibold mb-2 text-muted-foreground">Pattern Analysis</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Deep dive analytics into carrier denial trends.
                </p>
              </div>
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
