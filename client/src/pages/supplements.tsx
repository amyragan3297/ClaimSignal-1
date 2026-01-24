import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, DollarSign, FileText, Loader2, AlertCircle, TrendingUp, Clock, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import type { Supplement, Claim } from "@shared/schema";

function formatCurrency(cents: number | null | undefined): string {
  if (!cents) return "$0.00";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function getStatusBadge(status: string) {
  const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
    pending: { variant: "secondary", label: "Pending" },
    submitted: { variant: "default", label: "Submitted" },
    approved: { variant: "outline", label: "Approved" },
    denied: { variant: "destructive", label: "Denied" },
    negotiating: { variant: "default", label: "Negotiating" },
  };
  const config = variants[status] || { variant: "secondary", label: status };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export default function SupplementsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSupplement, setEditingSupplement] = useState<Supplement | null>(null);
  const [newSupplement, setNewSupplement] = useState({
    claimId: "",
    title: "",
    description: "",
    status: "pending",
  });

  const { data: supplementsData, isLoading } = useQuery({
    queryKey: ["/api/supplements"],
    queryFn: async () => {
      const res = await fetch("/api/supplements", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load supplements");
      return res.json();
    },
  });

  const { data: claimsData } = useQuery({
    queryKey: ["/api/claims"],
    queryFn: async () => {
      const res = await fetch("/api/claims", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load claims");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof newSupplement) => {
      const res = await fetch("/api/supplements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create supplement");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/supplements"] });
      setIsCreateOpen(false);
      setNewSupplement({ claimId: "", title: "", description: "", status: "pending" });
      toast({ title: "Supplement Created", description: "The supplement has been added successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create supplement", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Supplement> }) => {
      const res = await fetch(`/api/supplements/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update supplement");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/supplements"] });
      setEditingSupplement(null);
      toast({ title: "Supplement Updated", description: "Changes saved successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update supplement", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/supplements/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete supplement");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/supplements"] });
      toast({ title: "Supplement Deleted", description: "The supplement has been removed." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete supplement", variant: "destructive" });
    },
  });

  const supplements: Supplement[] = supplementsData?.supplements || [];
  const claims: Claim[] = claimsData?.claims || [];

  const totalRequested = supplements.reduce((sum, s) => sum + (s.requestedAmount || 0), 0);
  const totalApproved = supplements.reduce((sum, s) => sum + (s.approvedAmount || 0), 0);
  const pendingCount = supplements.filter(s => s.status === "pending" || s.status === "submitted").length;

  const handleCreate = () => {
    if (!newSupplement.claimId || !newSupplement.title) {
      toast({ title: "Missing Fields", description: "Please select a claim and enter a title", variant: "destructive" });
      return;
    }
    createMutation.mutate(newSupplement);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6" data-testid="supplements-page">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Supplements</h1>
            <p className="text-muted-foreground">Track additional damage claims and negotiations</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button data-testid="create-supplement-btn">
                <Plus className="h-4 w-4 mr-2" />
                New Supplement
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Supplement</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Claim</Label>
                  <Select
                    value={newSupplement.claimId}
                    onValueChange={(v) => setNewSupplement(prev => ({ ...prev, claimId: v }))}
                  >
                    <SelectTrigger data-testid="select-claim">
                      <SelectValue placeholder="Select a claim" />
                    </SelectTrigger>
                    <SelectContent>
                      {claims.map((claim) => (
                        <SelectItem key={claim.id} value={claim.id}>
                          {claim.maskedId || claim.id} - {claim.carrier}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    placeholder="e.g., Roof Supplement - Additional Damage"
                    value={newSupplement.title}
                    onChange={(e) => setNewSupplement(prev => ({ ...prev, title: e.target.value }))}
                    data-testid="input-supplement-title"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Describe the additional damage discovered..."
                    value={newSupplement.description}
                    onChange={(e) => setNewSupplement(prev => ({ ...prev, description: e.target.value }))}
                    data-testid="input-supplement-description"
                  />
                </div>
                <Button onClick={handleCreate} disabled={createMutation.isPending} className="w-full">
                  {createMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Create Supplement
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Edit Dialog */}
        <Dialog open={!!editingSupplement} onOpenChange={(open) => !open && setEditingSupplement(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Supplement</DialogTitle>
            </DialogHeader>
            {editingSupplement && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={editingSupplement.title}
                    onChange={(e) => setEditingSupplement(prev => prev ? { ...prev, title: e.target.value } : null)}
                    data-testid="edit-supplement-title"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={editingSupplement.description || ""}
                    onChange={(e) => setEditingSupplement(prev => prev ? { ...prev, description: e.target.value } : null)}
                    data-testid="edit-supplement-description"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={editingSupplement.status}
                    onValueChange={(v) => setEditingSupplement(prev => prev ? { ...prev, status: v } : null)}
                  >
                    <SelectTrigger data-testid="edit-supplement-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="denied">Denied</SelectItem>
                      <SelectItem value="negotiating">Negotiating</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Requested Amount ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={(editingSupplement.requestedAmount || 0) / 100}
                      onChange={(e) => setEditingSupplement(prev => prev ? { ...prev, requestedAmount: Math.round(parseFloat(e.target.value || "0") * 100) } : null)}
                      data-testid="edit-supplement-requested"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Approved Amount ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={(editingSupplement.approvedAmount || 0) / 100}
                      onChange={(e) => setEditingSupplement(prev => prev ? { ...prev, approvedAmount: Math.round(parseFloat(e.target.value || "0") * 100) } : null)}
                      data-testid="edit-supplement-approved"
                    />
                  </div>
                </div>
                <Button 
                  onClick={() => updateMutation.mutate({ id: editingSupplement.id, data: editingSupplement })} 
                  disabled={updateMutation.isPending} 
                  className="w-full"
                  data-testid="save-supplement-btn"
                >
                  {updateMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Save Changes
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Supplements</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{supplements.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Requested</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalRequested)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Approved</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{formatCurrency(totalApproved)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-500">{pendingCount}</div>
            </CardContent>
          </Card>
        </div>

        {supplements.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No Supplements Yet</h3>
              <p className="text-muted-foreground text-center max-w-md mt-2">
                Supplements track additional damage discovered after the initial claim. Create your first supplement to get started.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {supplements.map((supplement) => {
              const claim = claims.find(c => c.id === supplement.claimId);
              return (
                <Card key={supplement.id} className="hover:border-primary/50 transition-colors" data-testid={`supplement-card-${supplement.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {supplement.title}
                          {getStatusBadge(supplement.status)}
                        </CardTitle>
                        <CardDescription>
                          {claim ? (
                            <Link href={`/claims/${claim.id}`} className="hover:underline">
                              Claim: {claim.maskedId || claim.id} - {claim.carrier}
                            </Link>
                          ) : (
                            "Unknown Claim"
                          )}
                        </CardDescription>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">Requested</div>
                          <div className="text-lg font-bold">{formatCurrency(supplement.requestedAmount)}</div>
                          {supplement.approvedAmount ? (
                            <>
                              <div className="text-sm text-muted-foreground mt-1">Approved</div>
                              <div className="text-lg font-bold text-green-500">{formatCurrency(supplement.approvedAmount)}</div>
                            </>
                          ) : null}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingSupplement(supplement)}
                            data-testid={`edit-supplement-${supplement.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this supplement?")) {
                                deleteMutation.mutate(supplement.id);
                              }
                            }}
                            data-testid={`delete-supplement-${supplement.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  {supplement.description && (
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{supplement.description}</p>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
