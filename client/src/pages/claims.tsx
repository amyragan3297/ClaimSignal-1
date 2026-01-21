import { Layout } from "@/components/layout";
import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchClaims, fetchAdjusters, createClaim, linkAdjusterToClaim } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, ClipboardList, Calendar, ArrowRight, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { differenceInDays, format } from "date-fns";

export default function Claims() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);

  const { data: claims = [] } = useQuery({
    queryKey: ['claims'],
    queryFn: fetchClaims,
  });

  const { data: adjusters = [] } = useQuery({
    queryKey: ['adjusters'],
    queryFn: fetchAdjusters,
  });

  const [newClaim, setNewClaim] = useState({
    maskedId: '',
    carrier: '',
    dateOfLoss: '',
    homeownerName: '',
    propertyAddress: '',
    notes: '',
    adjusterId: '',
  });

  const createClaimMutation = useMutation({
    mutationFn: async () => {
      const claim = await createClaim({
        maskedId: newClaim.maskedId,
        carrier: newClaim.carrier,
        dateOfLoss: newClaim.dateOfLoss,
        homeownerName: newClaim.homeownerName || null,
        propertyAddress: newClaim.propertyAddress || null,
        notes: newClaim.notes || null,
        status: 'open',
        outcomeNotes: null,
      });
      if (newClaim.adjusterId) {
        await linkAdjusterToClaim(claim.id, newClaim.adjusterId);
      }
      return claim;
    },
    onSuccess: (claim) => {
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      toast({
        title: "Claim Created",
        description: `Claim #${claim.maskedId} has been added.`,
      });
      setIsAddOpen(false);
      setNewClaim({ maskedId: '', carrier: '', dateOfLoss: '', homeownerName: '', propertyAddress: '', notes: '', adjusterId: '' });
      setLocation(`/claims/${claim.id}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create claim. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateClaim = () => {
    if (!newClaim.maskedId || !newClaim.carrier || !newClaim.dateOfLoss) return;
    createClaimMutation.mutate();
  };

  const getDaysSinceDOL = (dateOfLoss: string) => {
    try {
      const dol = new Date(dateOfLoss);
      return differenceInDays(new Date(), dol);
    } catch {
      return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'resolved': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'denied': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'in_litigation': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Layout>
      <div className="p-6 md:p-8 space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Claims</h1>
            <p className="text-muted-foreground">Track your claims from start to finish</p>
          </div>

          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" data-testid="button-add-claim">
                <Plus className="w-4 h-4" />
                New Claim
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Claim</DialogTitle>
                <DialogDescription>
                  Enter the claim details to start tracking it.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Claim ID *</Label>
                    <Input 
                      placeholder="e.g., 0000001"
                      value={newClaim.maskedId}
                      onChange={(e) => setNewClaim({...newClaim, maskedId: e.target.value})}
                      data-testid="input-claim-id"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Date of Loss *</Label>
                    <Input 
                      type="date"
                      value={newClaim.dateOfLoss}
                      onChange={(e) => setNewClaim({...newClaim, dateOfLoss: e.target.value})}
                      data-testid="input-date-of-loss"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Carrier *</Label>
                  <Input 
                    placeholder="e.g., State Farm"
                    value={newClaim.carrier}
                    onChange={(e) => setNewClaim({...newClaim, carrier: e.target.value})}
                    data-testid="input-claim-carrier"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Homeowner Name</Label>
                  <Input 
                    placeholder="e.g., John Smith"
                    value={newClaim.homeownerName}
                    onChange={(e) => setNewClaim({...newClaim, homeownerName: e.target.value})}
                    data-testid="input-homeowner-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Property Address</Label>
                  <Input 
                    placeholder="e.g., 123 Main St, City, State"
                    value={newClaim.propertyAddress}
                    onChange={(e) => setNewClaim({...newClaim, propertyAddress: e.target.value})}
                    data-testid="input-property-address"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Link Adjuster</Label>
                  <Select 
                    value={newClaim.adjusterId} 
                    onValueChange={(v) => setNewClaim({...newClaim, adjusterId: v})}
                  >
                    <SelectTrigger data-testid="select-adjuster">
                      <SelectValue placeholder="Select adjuster (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {adjusters.map((adj) => (
                        <SelectItem key={adj.id} value={adj.id}>
                          {adj.name} ({adj.carrier})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea 
                    placeholder="Initial notes about this claim..."
                    value={newClaim.notes}
                    onChange={(e) => setNewClaim({...newClaim, notes: e.target.value})}
                    data-testid="input-claim-notes"
                  />
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleCreateClaim}
                  disabled={!newClaim.maskedId || !newClaim.carrier || !newClaim.dateOfLoss || createClaimMutation.isPending}
                  data-testid="button-save-claim"
                >
                  {createClaimMutation.isPending ? 'Creating...' : 'Create Claim'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {claims.length > 0 ? (
          <ScrollArea className="h-[calc(100vh-12rem)]">
            <div className="grid gap-4">
              {claims.map((claim) => {
                const days = getDaysSinceDOL(claim.dateOfLoss);
                return (
                  <Card 
                    key={claim.id} 
                    className="cursor-pointer hover:bg-muted/30 transition-colors group"
                    onClick={() => setLocation(`/claims/${claim.id}`)}
                    data-testid={`card-claim-${claim.id}`}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="bg-primary/10 p-2.5 rounded-lg">
                            <ClipboardList className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-3">
                              <span className="font-mono font-semibold text-lg" data-testid={`text-claim-id-${claim.id}`}>
                                #{claim.maskedId}
                              </span>
                              <Badge variant="outline" className={getStatusColor(claim.status)}>
                                {claim.status.replace('_', ' ')}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                              <span className="flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                {claim.carrier}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                DOL: {claim.dateOfLoss}
                              </span>
                              {days !== null && (
                                <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">
                                  {days} days
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-1" />
                      </div>
                      {claim.homeownerName && (
                        <p className="text-sm text-muted-foreground mt-3 ml-14">
                          {claim.homeownerName}{claim.propertyAddress && ` • ${claim.propertyAddress}`}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <ClipboardList className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
              <h3 className="text-lg font-medium mb-2">No claims yet</h3>
              <p className="text-muted-foreground mb-6">
                Start tracking your claims to build your intelligence database.
              </p>
              <Button onClick={() => setIsAddOpen(true)} data-testid="button-add-first-claim">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Claim
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
