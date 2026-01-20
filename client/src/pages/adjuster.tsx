import { Layout } from "@/components/layout";
import { useParams } from "wouter";
import { useStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BehaviorRadar } from "@/components/ui/behavior-radar";
import { AlertTriangle, Clock, ThumbsDown, User, Activity, FileText, Plus, Phone, Mail, MapPin, File, Download, Search } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";

export default function AdjusterProfile() {
  const { id } = useParams();
  const adjuster = useStore((state) => state.adjusters.find(a => a.id === id));
  const addInteraction = useStore((state) => state.addInteraction);
  const [isLogOpen, setIsLogOpen] = useState(false);
  
  // New interaction state
  const [newLog, setNewLog] = useState({
    type: 'Email' as const,
    description: '',
    outcome: '',
    date: format(new Date(), 'yyyy-MM-dd')
  });

  const handleAddLog = () => {
    if (adjuster && newLog.description) {
      addInteraction(adjuster.id, newLog);
      setNewLog({ type: 'Email', description: '', outcome: '', date: format(new Date(), 'yyyy-MM-dd') });
      setIsLogOpen(false);
    }
  };

  if (!adjuster) return <div className="p-8 text-center text-muted-foreground">Adjuster not found</div>;

  const riskColor = 
    adjuster.riskLevel === 'Severe' ? 'bg-destructive/10 text-destructive border-destructive/20' :
    adjuster.riskLevel === 'High' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
    adjuster.riskLevel === 'Medium' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
    'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';

  return (
    <Layout>
      <div className="p-6 md:p-8 space-y-8 animate-in fade-in duration-500">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center border-2 border-border">
              <User className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{adjuster.name}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-lg text-muted-foreground">{adjuster.carrier}</span>
                <Badge variant="outline" className={`ml-2 px-3 py-1 font-mono uppercase tracking-wider ${riskColor}`}>
                  {adjuster.riskLevel} RISK
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
             <Dialog open={isLogOpen} onOpenChange={setIsLogOpen}>
               <DialogTrigger asChild>
                 <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                   <Plus className="w-4 h-4 mr-2" />
                   Log Interaction
                 </Button>
               </DialogTrigger>
               <DialogContent>
                 <DialogHeader>
                   <DialogTitle>Log New Interaction</DialogTitle>
                   <DialogDescription>
                     Record details of your communication with the adjuster.
                   </DialogDescription>
                 </DialogHeader>
                 <div className="space-y-4 py-4">
                   <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                       <Label>Type</Label>
                       <Select 
                        value={newLog.type} 
                        onValueChange={(v: any) => setNewLog({...newLog, type: v})}
                       >
                         <SelectTrigger>
                           <SelectValue />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="Email">Email</SelectItem>
                           <SelectItem value="Phone">Phone</SelectItem>
                           <SelectItem value="Settlement Offer">Settlement Offer</SelectItem>
                           <SelectItem value="Letter">Letter</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>
                     <div className="space-y-2">
                       <Label>Date</Label>
                       <Input 
                        type="date" 
                        value={newLog.date} 
                        onChange={(e) => setNewLog({...newLog, date: e.target.value})} 
                       />
                     </div>
                   </div>
                   <div className="space-y-2">
                     <Label>Description</Label>
                     <Textarea 
                      placeholder="What happened?" 
                      value={newLog.description}
                      onChange={(e) => setNewLog({...newLog, description: e.target.value})}
                     />
                   </div>
                   <div className="space-y-2">
                     <Label>Outcome (Optional)</Label>
                     <Input 
                      placeholder="Result of interaction" 
                      value={newLog.outcome}
                      onChange={(e) => setNewLog({...newLog, outcome: e.target.value})}
                     />
                   </div>
                   <Button className="w-full" onClick={handleAddLog}>Save Log</Button>
                 </div>
               </DialogContent>
             </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Intelligence Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* At a Glance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-card/50 border-border/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Behavior Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold font-mono">{adjuster.behaviorScore}/100</div>
                  <p className="text-xs text-muted-foreground mt-1">Based on interaction analysis</p>
                </CardContent>
              </Card>
              
              <Card className="bg-card/50 border-border/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Responsiveness
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{adjuster.responsivenessRating}</div>
                  <p className="text-xs text-muted-foreground mt-1">Average reply time</p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <ThumbsDown className="w-4 h-4" />
                    Top Denial Style
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-medium leading-tight">{adjuster.commonDenialStyles[0]}</div>
                </CardContent>
              </Card>
            </div>

            {/* Narrative & Tactics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Intelligence Brief
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-2">Narrative Summary</h4>
                  <p className="leading-relaxed text-foreground/90">{adjuster.narrative}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                     <h4 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
                       <AlertTriangle className="w-4 h-4" /> Known Tactics
                     </h4>
                     <ul className="space-y-2">
                       {adjuster.commonDenialStyles.map((style, i) => (
                         <li key={i} className="flex items-start gap-2 text-sm">
                           <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-1.5 shrink-0" />
                           {style}
                         </li>
                       ))}
                     </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-2">Recommended Strategy</h4>
                    <p className="text-sm text-muted-foreground italic">
                      "Document all phone calls immediately. Do not rely on verbal agreements. Escalate if no response within 5 days."
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Interactions Log */}
            <Card>
               <CardHeader>
                 <CardTitle>Recent Activity</CardTitle>
               </CardHeader>
               <CardContent>
                 <ScrollArea className="h-[300px] pr-4">
                   <div className="space-y-6">
                     {adjuster.interactions.map((interaction) => (
                       <div key={interaction.id} className="relative pl-6 border-l border-border pb-1 last:pb-0">
                         <div className="absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-background" />
                         <div className="flex flex-col gap-1">
                           <div className="flex items-center justify-between">
                             <span className="text-sm font-mono text-muted-foreground">{interaction.date}</span>
                             <Badge variant="secondary" className="text-xs">{interaction.type}</Badge>
                           </div>
                           <p className="text-sm font-medium mt-1">{interaction.description}</p>
                           {interaction.outcome && (
                             <p className="text-xs text-emerald-500 mt-1 flex items-center gap-1">
                               Outcome: {interaction.outcome}
                             </p>
                           )}
                           {interaction.claimId && (
                             <p className="text-[10px] text-muted-foreground font-mono mt-1">Ref: {interaction.claimId}</p>
                           )}
                         </div>
                       </div>
                     ))}
                     {adjuster.interactions.length === 0 && (
                       <p className="text-sm text-muted-foreground text-center py-8">No interactions logged yet.</p>
                     )}
                   </div>
                 </ScrollArea>
               </CardContent>
            </Card>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-6">
            
            {/* Radar Chart */}
            <div className="h-[350px]">
              <BehaviorRadar metrics={adjuster.metrics} />
            </div>

            {/* Long Running Claims Spotlight */}
            <Card className="border-amber-500/20 bg-amber-500/5">
              <CardHeader>
                <CardTitle className="text-amber-500 flex items-center gap-2 text-base">
                  <Clock className="w-4 h-4" />
                  Long-Running Claims
                </CardTitle>
                <CardDescription className="text-xs">
                  Learn from difficult past cases.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {adjuster.claims.filter(c => c.duration).map((claim) => (
                  <div key={claim.publicId} className="bg-background/50 p-3 rounded-lg border border-border">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                        {claim.publicId}
                      </span>
                      <span className="text-xs text-muted-foreground">{claim.duration}</span>
                    </div>
                    <div className="space-y-2">
                       <div>
                         <span className="text-[10px] uppercase text-muted-foreground font-bold">Outcome</span>
                         <p className="text-sm font-medium">{claim.outcome}</p>
                       </div>
                       {claim.whatWorked && (
                         <div>
                            <span className="text-[10px] uppercase text-muted-foreground font-bold">What Worked</span>
                            <p className="text-xs text-muted-foreground leading-snug">{claim.whatWorked}</p>
                         </div>
                       )}
                    </div>
                  </div>
                ))}
                {adjuster.claims.filter(c => c.duration).length === 0 && (
                  <p className="text-xs text-muted-foreground text-center">No long-running claims on file.</p>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions Panel */}
            <Card className="bg-sidebar">
               <CardHeader>
                 <CardTitle className="text-sm">Contact Details</CardTitle>
               </CardHeader>
               <CardContent className="space-y-3">
                 <div className="flex items-center gap-3 text-sm">
                   <Phone className="w-4 h-4 text-muted-foreground" />
                   <span className="text-muted-foreground">Main Line:</span>
                   <span className="ml-auto font-mono text-xs">800-555-0192</span>
                 </div>
                 <div className="flex items-center gap-3 text-sm">
                   <Mail className="w-4 h-4 text-muted-foreground" />
                   <span className="text-muted-foreground">Email:</span>
                   <span className="ml-auto font-mono text-xs truncate max-w-[120px]">s.jenkins@ins.com</span>
                 </div>
                 <div className="flex items-center gap-3 text-sm">
                   <MapPin className="w-4 h-4 text-muted-foreground" />
                   <span className="text-muted-foreground">Office:</span>
                   <span className="ml-auto text-xs">Chicago, IL</span>
                 </div>
               </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </Layout>
  );
}
