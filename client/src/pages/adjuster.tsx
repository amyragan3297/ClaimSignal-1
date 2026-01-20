import { Layout } from "@/components/layout";
import { useParams, useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User, Plus, MapPin, Calendar, FileText, ClipboardList, Phone, Mail, Camera, AlertCircle, Trash2, Paperclip, Upload, File, Image, Mic } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchAdjuster, createInteraction, updateAdjuster } from "@/lib/api";
import { useUpload } from "@/hooks/use-upload";
import { useToast } from "@/hooks/use-toast";

export default function AdjusterProfile() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isEditingRisk, setIsEditingRisk] = useState(false);
  
  const { data: adjuster, isLoading } = useQuery({
    queryKey: ['adjuster', id],
    queryFn: () => fetchAdjuster(id!),
    enabled: !!id,
  });

  const createInteractionMutation = useMutation({
    mutationFn: ({ adjusterId, interaction }: { adjusterId: string; interaction: any }) =>
      createInteraction(adjusterId, interaction),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adjuster', id] });
      toast({
        title: "Success",
        description: "Interaction logged successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to log interaction",
        variant: "destructive",
      });
    },
  });

  const updateAdjusterMutation = useMutation({
    mutationFn: ({ adjusterId, data }: { adjusterId: string; data: any }) =>
      updateAdjuster(adjusterId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adjuster', id] });
      toast({
        title: "Saved",
        description: "Changes saved successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive",
      });
    },
  });

  const [newLog, setNewLog] = useState<{
    type: 'Call' | 'Email' | 'Inspection' | 'Reinspection' | 'Escalation';
    description: string;
    date: string;
    claimRef: string;
  }>({
    type: 'Call',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    claimRef: ''
  });

  const [editNotes, setEditNotes] = useState('');
  const [editRisk, setEditRisk] = useState('');
  const [editWhatWorked, setEditWhatWorked] = useState('');
  const [isEditingWhatWorked, setIsEditingWhatWorked] = useState(false);

  const deleteAdjusterMutation = useMutation({
    mutationFn: (adjusterId: string) =>
      fetch(`/api/adjusters/${adjusterId}`, { method: 'DELETE' }).then(res => {
        if (!res.ok) throw new Error('Failed to delete');
        return res.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adjusters'] });
      toast({
        title: "Deleted",
        description: "Adjuster profile removed",
      });
      setLocation('/');
    },
  });

  const { uploadFile, isUploading } = useUpload({
    onSuccess: async (response) => {
      if (adjuster) {
        await fetch(`/api/adjusters/${adjuster.id}/documents`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: response.metadata.name,
            objectPath: response.objectPath,
            contentType: response.metadata.contentType,
            size: response.metadata.size,
          }),
        });
        queryClient.invalidateQueries({ queryKey: ['adjuster', id] });
        toast({ title: "Uploaded", description: "Document added successfully" });
      }
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to upload document", variant: "destructive" });
    }
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: (docId: string) =>
      fetch(`/api/documents/${docId}`, { method: 'DELETE' }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adjuster', id] });
      toast({ title: "Deleted", description: "Document removed" });
    },
  });

  const getDocumentIcon = (contentType: string) => {
    if (contentType.startsWith('image/')) return <Image className="w-5 h-5" />;
    if (contentType.startsWith('audio/')) return <Mic className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  };

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case 'Call': return <Phone className="w-4 h-4" />;
      case 'Email': return <Mail className="w-4 h-4" />;
      case 'Inspection':
      case 'Reinspection': return <Camera className="w-4 h-4" />;
      case 'Escalation': return <AlertCircle className="w-4 h-4 text-destructive" />;
      default: return <ClipboardList className="w-4 h-4" />;
    }
  };

  const handleAddLog = () => {
    if (adjuster && newLog.description) {
      createInteractionMutation.mutate({
        adjusterId: adjuster.id,
        interaction: {
          date: newLog.date,
          type: newLog.type,
          description: newLog.description,
          claimId: newLog.claimRef || undefined,
        }
      });
      setNewLog({ type: 'Call', description: '', date: format(new Date(), 'yyyy-MM-dd'), claimRef: '' });
      setIsLogOpen(false);
    }
  };

  const handleSaveNotes = () => {
    if (adjuster) {
      updateAdjusterMutation.mutate({
        adjusterId: adjuster.id,
        data: { internalNotes: editNotes }
      });
      setIsEditingNotes(false);
    }
  };

  const handleSaveRisk = () => {
    if (adjuster) {
      updateAdjusterMutation.mutate({
        adjusterId: adjuster.id,
        data: { riskImpression: editRisk }
      });
      setIsEditingRisk(false);
    }
  };

  const handleSaveWhatWorked = () => {
    if (adjuster) {
      updateAdjusterMutation.mutate({
        adjusterId: adjuster.id,
        data: { whatWorked: editWhatWorked }
      });
      setIsEditingWhatWorked(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="p-8 text-center text-muted-foreground">Loading...</div>
      </Layout>
    );
  }

  if (!adjuster) {
    return (
      <Layout>
        <div className="p-8 text-center text-muted-foreground">Adjuster not found</div>
      </Layout>
    );
  }

  const firstInteractionDate = adjuster.interactions.length > 0 
    ? adjuster.interactions.reduce((earliest, int) => 
        int.date < earliest ? int.date : earliest, adjuster.interactions[0].date)
    : null;

  const totalClaims = adjuster.claims.length;

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
              <h1 className="text-3xl font-bold tracking-tight" data-testid="text-adjuster-name">{adjuster.name}</h1>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="text-lg text-muted-foreground" data-testid="text-adjuster-carrier">{adjuster.carrier}</span>
                {adjuster.region && (
                  <Badge variant="outline" className="gap-1">
                    <MapPin className="w-3 h-3" />
                    {adjuster.region}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
             <Button 
               variant="outline" 
               size="icon" 
               className="text-muted-foreground hover:text-destructive transition-colors"
               onClick={() => {
                 if (confirm('Are you sure you want to delete this adjuster profile? This cannot be undone.')) {
                   deleteAdjusterMutation.mutate(adjuster.id);
                 }
               }}
               data-testid="button-delete-adjuster"
             >
               <Trash2 className="w-4 h-4" />
             </Button>
             <Dialog open={isLogOpen} onOpenChange={setIsLogOpen}>
               <DialogTrigger asChild>
                 <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" data-testid="button-log-interaction">
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
                         <SelectTrigger data-testid="select-interaction-type">
                           <SelectValue />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="Call">Call</SelectItem>
                           <SelectItem value="Email">Email</SelectItem>
                           <SelectItem value="Inspection">Inspection</SelectItem>
                           <SelectItem value="Reinspection">Reinspection</SelectItem>
                           <SelectItem value="Escalation">Escalation</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>
                     <div className="space-y-2">
                       <Label>Date</Label>
                       <Input 
                        type="date" 
                        value={newLog.date} 
                        onChange={(e) => setNewLog({...newLog, date: e.target.value})}
                        data-testid="input-interaction-date"
                       />
                     </div>
                   </div>
                   <div className="space-y-2">
                     <Label>Claim Reference (optional)</Label>
                     <Input 
                      placeholder="e.g., 0000001" 
                      value={newLog.claimRef}
                      onChange={(e) => setNewLog({...newLog, claimRef: e.target.value})}
                      data-testid="input-claim-ref"
                     />
                   </div>
                   <div className="space-y-2">
                     <Label>Notes</Label>
                     <Textarea 
                      placeholder="What happened?" 
                      value={newLog.description}
                      onChange={(e) => setNewLog({...newLog, description: e.target.value})}
                      data-testid="input-interaction-description"
                     />
                   </div>
                   <Button 
                     className="w-full" 
                     onClick={handleAddLog}
                     disabled={!newLog.description || createInteractionMutation.isPending}
                     data-testid="button-save-interaction"
                   >
                     {createInteractionMutation.isPending ? 'Saving...' : 'Save Log'}
                   </Button>
                 </div>
               </DialogContent>
             </Dialog>
          </div>
        </div>

        {/* Internal Notes */}
        {(adjuster.internalNotes || isEditingNotes) && (
          <Card className="bg-muted/30 border-border/50">
            <CardContent className="pt-4">
              {isEditingNotes ? (
                <div className="space-y-3">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Internal Notes</Label>
                  <Textarea 
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="min-h-[100px]"
                    data-testid="textarea-internal-notes"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveNotes} disabled={updateAdjusterMutation.isPending}>
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setIsEditingNotes(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div 
                  className="cursor-pointer hover:bg-muted/50 p-2 -m-2 rounded transition-colors"
                  onClick={() => { setEditNotes(adjuster.internalNotes || ''); setIsEditingNotes(true); }}
                >
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Internal Notes</p>
                  <p className="text-sm text-foreground/80">{adjuster.internalNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="interactions" data-testid="tab-interactions">Interaction Log</TabsTrigger>
            <TabsTrigger value="documents" data-testid="tab-documents">
              <Paperclip className="w-4 h-4 mr-1" />
              Documents
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* First Interaction Date */}
              <Card className="bg-card/50 border-border/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    First Interaction
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-first-interaction">
                    {firstInteractionDate || 'None yet'}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Date of first recorded contact</p>
                </CardContent>
              </Card>
              
              {/* Total Claims */}
              <Card className="bg-card/50 border-border/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <ClipboardList className="w-4 h-4" />
                    Claims Dealt With
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-total-claims">{totalClaims}</div>
                  <p className="text-xs text-muted-foreground mt-1">Total claims involving this adjuster</p>
                </CardContent>
              </Card>

              {/* Risk Impression */}
              <Card className="bg-card/50 border-border/60 md:col-span-2 lg:col-span-1">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Your Risk Impression
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditingRisk ? (
                    <div className="space-y-3">
                      <Textarea 
                        value={editRisk}
                        onChange={(e) => setEditRisk(e.target.value)}
                        placeholder="Your personal assessment of working with this adjuster..."
                        className="min-h-[80px]"
                        data-testid="textarea-risk-impression"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSaveRisk} disabled={updateAdjusterMutation.isPending}>
                          Save
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setIsEditingRisk(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      className="cursor-pointer hover:bg-muted/30 p-2 -m-2 rounded transition-colors min-h-[60px]"
                      onClick={() => { setEditRisk(adjuster.riskImpression || ''); setIsEditingRisk(true); }}
                      data-testid="text-risk-impression"
                    >
                      {adjuster.riskImpression ? (
                        <p className="text-sm">{adjuster.riskImpression}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">Click to add your risk impression...</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* What Worked - Your Playbook */}
              <Card className="bg-card/50 border-border/60 md:col-span-2 lg:col-span-3">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    What Worked (Your Playbook)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditingWhatWorked ? (
                    <div className="space-y-3">
                      <Textarea 
                        value={editWhatWorked}
                        onChange={(e) => setEditWhatWorked(e.target.value)}
                        placeholder="Arguments that worked, code citations, tone that got results, escalation paths..."
                        className="min-h-[120px]"
                        data-testid="input-what-worked"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSaveWhatWorked} data-testid="button-save-what-worked">Save</Button>
                        <Button size="sm" variant="outline" onClick={() => setIsEditingWhatWorked(false)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      className="cursor-pointer hover:bg-muted/30 p-2 -m-2 rounded transition-colors min-h-[80px]"
                      onClick={() => { setEditWhatWorked(adjuster.whatWorked || ''); setIsEditingWhatWorked(true); }}
                      data-testid="text-what-worked"
                    >
                      {adjuster.whatWorked ? (
                        <p className="text-sm whitespace-pre-wrap">{adjuster.whatWorked}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">Click to add what worked with this adjuster... Arguments, code citations, tone, escalation paths that got results.</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="interactions">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Interaction Log</CardTitle>
                <Button size="sm" variant="outline" onClick={() => setIsLogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4">
                    {adjuster.interactions.length > 0 ? (
                      adjuster.interactions.map((interaction) => (
                        <div 
                          key={interaction.id} 
                          className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg border border-border/50"
                          data-testid={`interaction-${interaction.id}`}
                        >
                          <div className="bg-primary/10 p-2 rounded-md shrink-0">
                            {getInteractionIcon(interaction.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                              <Badge variant="secondary" className="text-xs" data-testid={`badge-type-${interaction.id}`}>
                                {interaction.type}
                              </Badge>
                              <span className="text-sm font-mono text-muted-foreground" data-testid={`text-date-${interaction.id}`}>
                                {interaction.date}
                              </span>
                              {interaction.claimId && (
                                <Badge variant="outline" className="text-xs font-mono" data-testid={`badge-claim-${interaction.id}`}>
                                  Claim #{interaction.claimId}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm" data-testid={`text-description-${interaction.id}`}>
                              {interaction.description}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>No interactions logged yet.</p>
                        <p className="text-sm mt-1">Click "Log Interaction" to record your first contact.</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Documents & Files</CardTitle>
                <label htmlFor="file-upload">
                  <Button size="sm" variant="outline" disabled={isUploading} asChild>
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      {isUploading ? 'Uploading...' : 'Upload File'}
                    </span>
                  </Button>
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    accept="image/*,application/pdf,audio/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadFile(file);
                      e.target.value = '';
                    }}
                    data-testid="input-file-upload"
                  />
                </label>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-3">
                    {adjuster.documents && adjuster.documents.length > 0 ? (
                      adjuster.documents.map((doc: any) => (
                        <div 
                          key={doc.id} 
                          className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg border border-border/50 group"
                          data-testid={`document-${doc.id}`}
                        >
                          <div className="bg-primary/10 p-2 rounded-md shrink-0">
                            {getDocumentIcon(doc.contentType)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate" data-testid={`text-doc-name-${doc.id}`}>
                              {doc.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {doc.size ? `${Math.round(doc.size / 1024)} KB` : ''} 
                              {doc.createdAt && ` • ${format(new Date(doc.createdAt), 'MMM d, yyyy')}`}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => window.open(doc.objectPath, '_blank')}
                              data-testid={`button-view-${doc.id}`}
                            >
                              View
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => {
                                if (confirm('Delete this document?')) {
                                  deleteDocumentMutation.mutate(doc.id);
                                }
                              }}
                              data-testid={`button-delete-doc-${doc.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <Paperclip className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>No documents attached yet.</p>
                        <p className="text-sm mt-1">Upload PDFs, photos, or voice recordings.</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
