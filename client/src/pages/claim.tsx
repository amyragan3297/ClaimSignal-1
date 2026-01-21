import { Layout } from "@/components/layout";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchClaim, fetchAdjusters, updateClaim, linkAdjusterToClaim, fetchAttachments, createAttachment } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Calendar, Building2, MapPin, User, Phone, Mail, ClipboardList, Plus, CheckCircle2, XCircle, AlertCircle, FileText, Paperclip, Send, Inbox } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { differenceInDays, differenceInMonths, format } from "date-fns";
import { useState } from "react";
import { useUpload } from "@/hooks/use-upload";
import type { Attachment } from "@shared/schema";

export default function ClaimDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isEditingOutcome, setIsEditingOutcome] = useState(false);
  const [editNotes, setEditNotes] = useState('');
  const [editOutcome, setEditOutcome] = useState('');
  const [isLinkAdjusterOpen, setIsLinkAdjusterOpen] = useState(false);
  const [selectedAdjusterId, setSelectedAdjusterId] = useState('');
  const [isAddAttachmentOpen, setIsAddAttachmentOpen] = useState(false);
  const [attachmentType, setAttachmentType] = useState<'file' | 'email'>('file');
  const [viewingAttachment, setViewingAttachment] = useState<Attachment | null>(null);
  const [newAttachment, setNewAttachment] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    description: '',
    direction: 'received' as 'sent' | 'received',
    subject: '',
    body: '',
    notes: '',
  });
  const { openFilePicker, uploading } = useUpload();

  const { data: claim, isLoading } = useQuery({
    queryKey: ['claim', id],
    queryFn: () => fetchClaim(id!),
    enabled: !!id,
  });

  const { data: allAdjusters = [] } = useQuery({
    queryKey: ['adjusters'],
    queryFn: fetchAdjusters,
  });

  const { data: attachments = [] } = useQuery({
    queryKey: ['attachments', id],
    queryFn: () => fetchAttachments(id!),
    enabled: !!id,
  });

  const createAttachmentMutation = useMutation({
    mutationFn: (data: Parameters<typeof createAttachment>[1]) => createAttachment(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments', id] });
      toast({ title: "Added", description: "Attachment saved successfully" });
      setIsAddAttachmentOpen(false);
      setNewAttachment({
        date: format(new Date(), 'yyyy-MM-dd'),
        description: '',
        direction: 'received',
        subject: '',
        body: '',
        notes: '',
      });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save attachment", variant: "destructive" });
    },
  });

  const updateClaimMutation = useMutation({
    mutationFn: ({ data }: { data: any }) => updateClaim(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claim', id] });
      toast({ title: "Saved", description: "Changes saved successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save changes", variant: "destructive" });
    },
  });

  const linkAdjusterMutation = useMutation({
    mutationFn: (adjusterId: string) => linkAdjusterToClaim(id!, adjusterId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claim', id] });
      toast({ title: "Linked", description: "Adjuster linked to claim" });
      setIsLinkAdjusterOpen(false);
      setSelectedAdjusterId('');
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to link adjuster", variant: "destructive" });
    },
  });

  const handleSaveNotes = () => {
    updateClaimMutation.mutate({ data: { notes: editNotes } });
    setIsEditingNotes(false);
  };

  const handleSaveOutcome = () => {
    updateClaimMutation.mutate({ data: { outcomeNotes: editOutcome } });
    setIsEditingOutcome(false);
  };

  const handleStatusChange = (newStatus: string) => {
    updateClaimMutation.mutate({ data: { status: newStatus } });
  };

  const handleLinkAdjuster = () => {
    if (selectedAdjusterId) {
      linkAdjusterMutation.mutate(selectedAdjusterId);
    }
  };

  const handleFileUpload = async () => {
    try {
      const result = await openFilePicker({
        allowedFileTypes: ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg', '.gif'],
        maxFiles: 1,
      });
      if (result && result.length > 0) {
        const file = result[0];
        createAttachmentMutation.mutate({
          type: 'file',
          date: newAttachment.date,
          objectPath: file.objectPath,
          filename: file.name,
          contentType: file.type,
          size: file.size,
          description: newAttachment.description || undefined,
        });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to upload file", variant: "destructive" });
    }
  };

  const handleSaveEmail = () => {
    if (!newAttachment.subject || !newAttachment.body) {
      toast({ title: "Error", description: "Subject and body are required", variant: "destructive" });
      return;
    }
    createAttachmentMutation.mutate({
      type: 'email',
      date: newAttachment.date,
      direction: newAttachment.direction,
      subject: newAttachment.subject,
      body: newAttachment.body,
      notes: newAttachment.notes || undefined,
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="p-8 text-center text-muted-foreground">Loading...</div>
      </Layout>
    );
  }

  if (!claim) {
    return (
      <Layout>
        <div className="p-8 text-center text-muted-foreground">Claim not found</div>
      </Layout>
    );
  }

  const getDuration = (dateOfLoss: string) => {
    try {
      const dol = new Date(dateOfLoss);
      const days = differenceInDays(new Date(), dol);
      const months = differenceInMonths(new Date(), dol);
      if (months >= 1) {
        return `${months} month${months > 1 ? 's' : ''} (${days} days)`;
      }
      return `${days} days`;
    } catch {
      return 'Unknown';
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

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case 'Call': return <Phone className="w-4 h-4" />;
      case 'Email': return <Mail className="w-4 h-4" />;
      case 'Inspection':
      case 'Reinspection': return <ClipboardList className="w-4 h-4" />;
      case 'Escalation': return <AlertCircle className="w-4 h-4 text-destructive" />;
      default: return <ClipboardList className="w-4 h-4" />;
    }
  };

  const linkedAdjusterIds = claim.adjusters?.map(a => a.id) || [];
  const availableAdjusters = allAdjusters.filter(a => !linkedAdjusterIds.includes(a.id));

  return (
    <Layout>
      <div className="p-6 md:p-8 space-y-6 animate-in fade-in duration-500">
        <Button 
          variant="ghost" 
          className="gap-2 -ml-2" 
          onClick={() => setLocation('/claims')}
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Claims
        </Button>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-1/3 space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="font-mono text-2xl" data-testid="text-claim-id">
                    #{claim.maskedId}
                  </CardTitle>
                  <Select value={claim.status} onValueChange={handleStatusChange}>
                    <SelectTrigger className={`w-auto ${getStatusColor(claim.status)}`} data-testid="select-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="denied">Denied</SelectItem>
                      <SelectItem value="in_litigation">In Litigation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <span data-testid="text-carrier">{claim.carrier}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <span data-testid="text-dol">DOL: {claim.dateOfLoss}</span>
                    <span className="text-muted-foreground ml-2 text-xs font-mono" data-testid="text-duration">
                      ({getDuration(claim.dateOfLoss)})
                    </span>
                  </div>
                </div>
                {claim.homeownerName && (
                  <div className="flex items-center gap-3 text-sm">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span data-testid="text-homeowner">{claim.homeownerName}</span>
                  </div>
                )}
                {claim.propertyAddress && (
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span data-testid="text-address">{claim.propertyAddress}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Linked Adjusters</CardTitle>
                <Dialog open={isLinkAdjusterOpen} onOpenChange={setIsLinkAdjusterOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="h-7" data-testid="button-link-adjuster">
                      <Plus className="w-3 h-3 mr-1" />
                      Link
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Link Adjuster</DialogTitle>
                      <DialogDescription>
                        Add an adjuster to this claim to track their involvement.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <Select value={selectedAdjusterId} onValueChange={setSelectedAdjusterId}>
                        <SelectTrigger data-testid="select-link-adjuster">
                          <SelectValue placeholder="Select adjuster" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableAdjusters.map((adj) => (
                            <SelectItem key={adj.id} value={adj.id}>
                              {adj.name} ({adj.carrier})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button 
                        className="w-full" 
                        onClick={handleLinkAdjuster}
                        disabled={!selectedAdjusterId || linkAdjusterMutation.isPending}
                        data-testid="button-confirm-link"
                      >
                        {linkAdjusterMutation.isPending ? 'Linking...' : 'Link Adjuster'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {claim.adjusters && claim.adjusters.length > 0 ? (
                  <div className="space-y-2">
                    {claim.adjusters.map((adj) => (
                      <div 
                        key={adj.id} 
                        className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => setLocation(`/adjuster/${adj.id}`)}
                        data-testid={`adjuster-${adj.id}`}
                      >
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{adj.name}</p>
                          <p className="text-xs text-muted-foreground">{adj.carrier}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No adjusters linked yet</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                {isEditingNotes ? (
                  <div className="space-y-3">
                    <Textarea 
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      className="min-h-[100px]"
                      data-testid="textarea-notes"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveNotes} disabled={updateClaimMutation.isPending}>Save</Button>
                      <Button size="sm" variant="ghost" onClick={() => setIsEditingNotes(false)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div 
                    className="cursor-pointer hover:bg-muted/30 p-2 -m-2 rounded transition-colors min-h-[60px]"
                    onClick={() => { setEditNotes(claim.notes || ''); setIsEditingNotes(true); }}
                    data-testid="text-notes"
                  >
                    {claim.notes ? (
                      <p className="text-sm whitespace-pre-wrap">{claim.notes}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">Click to add notes...</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {(claim.status === 'resolved' || claim.status === 'denied' || claim.outcomeNotes) && (
              <Card className={claim.status === 'resolved' ? 'border-green-500/30' : claim.status === 'denied' ? 'border-red-500/30' : ''}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    {claim.status === 'resolved' ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : claim.status === 'denied' ? (
                      <XCircle className="w-4 h-4 text-red-500" />
                    ) : null}
                    Outcome Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditingOutcome ? (
                    <div className="space-y-3">
                      <Textarea 
                        value={editOutcome}
                        onChange={(e) => setEditOutcome(e.target.value)}
                        placeholder="Won after 14 months of fighting..."
                        className="min-h-[100px]"
                        data-testid="textarea-outcome"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSaveOutcome} disabled={updateClaimMutation.isPending}>Save</Button>
                        <Button size="sm" variant="ghost" onClick={() => setIsEditingOutcome(false)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      className="cursor-pointer hover:bg-muted/30 p-2 -m-2 rounded transition-colors min-h-[60px]"
                      onClick={() => { setEditOutcome(claim.outcomeNotes || ''); setIsEditingOutcome(true); }}
                      data-testid="text-outcome"
                    >
                      {claim.outcomeNotes ? (
                        <p className="text-sm whitespace-pre-wrap">{claim.outcomeNotes}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">Click to add outcome notes... (e.g., "Won after 14 months")</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:w-2/3">
            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="w-5 h-5" />
                    Timeline
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">The complete story of this claim</p>
                </div>
                <Dialog open={isAddAttachmentOpen} onOpenChange={setIsAddAttachmentOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" data-testid="button-add-attachment">
                      <Plus className="w-4 h-4 mr-1" />
                      Add Attachment
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Add Attachment</DialogTitle>
                      <DialogDescription>
                        Upload a file or paste an email to attach to this claim.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <Tabs value={attachmentType} onValueChange={(v) => setAttachmentType(v as 'file' | 'email')}>
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="file" data-testid="tab-file">
                            <Paperclip className="w-4 h-4 mr-2" />
                            File Upload
                          </TabsTrigger>
                          <TabsTrigger value="email" data-testid="tab-email">
                            <Mail className="w-4 h-4 mr-2" />
                            Email
                          </TabsTrigger>
                        </TabsList>
                        <TabsContent value="file" className="space-y-4 mt-4">
                          <div className="space-y-2">
                            <Label>Date</Label>
                            <Input 
                              type="date" 
                              value={newAttachment.date}
                              onChange={(e) => setNewAttachment({...newAttachment, date: e.target.value})}
                              data-testid="input-file-date"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Description (optional)</Label>
                            <Input 
                              placeholder="What is this file?"
                              value={newAttachment.description}
                              onChange={(e) => setNewAttachment({...newAttachment, description: e.target.value})}
                              data-testid="input-file-description"
                            />
                          </div>
                          <Button 
                            className="w-full" 
                            onClick={handleFileUpload}
                            disabled={uploading || createAttachmentMutation.isPending}
                            data-testid="button-upload-file"
                          >
                            <Paperclip className="w-4 h-4 mr-2" />
                            {uploading ? 'Uploading...' : 'Select & Upload File'}
                          </Button>
                        </TabsContent>
                        <TabsContent value="email" className="space-y-4 mt-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Direction</Label>
                              <Select 
                                value={newAttachment.direction}
                                onValueChange={(v) => setNewAttachment({...newAttachment, direction: v as 'sent' | 'received'})}
                              >
                                <SelectTrigger data-testid="select-email-direction">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="received">Received</SelectItem>
                                  <SelectItem value="sent">Sent</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Date</Label>
                              <Input 
                                type="date" 
                                value={newAttachment.date}
                                onChange={(e) => setNewAttachment({...newAttachment, date: e.target.value})}
                                data-testid="input-email-date"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Subject *</Label>
                            <Input 
                              placeholder="Email subject line"
                              value={newAttachment.subject}
                              onChange={(e) => setNewAttachment({...newAttachment, subject: e.target.value})}
                              data-testid="input-email-subject"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Body *</Label>
                            <Textarea 
                              placeholder="Paste email content here..."
                              value={newAttachment.body}
                              onChange={(e) => setNewAttachment({...newAttachment, body: e.target.value})}
                              className="min-h-[150px]"
                              data-testid="textarea-email-body"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Notes (optional)</Label>
                            <Input 
                              placeholder="Any notes about this email"
                              value={newAttachment.notes}
                              onChange={(e) => setNewAttachment({...newAttachment, notes: e.target.value})}
                              data-testid="input-email-notes"
                            />
                          </div>
                          <Button 
                            className="w-full" 
                            onClick={handleSaveEmail}
                            disabled={createAttachmentMutation.isPending}
                            data-testid="button-save-email"
                          >
                            <Mail className="w-4 h-4 mr-2" />
                            {createAttachmentMutation.isPending ? 'Saving...' : 'Save Email'}
                          </Button>
                        </TabsContent>
                      </Tabs>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] pr-4">
                  {(() => {
                    const allItems = [
                      ...(claim.interactions || []).map(i => ({ ...i, itemType: 'interaction' as const })),
                      ...attachments.map(a => ({ ...a, itemType: 'attachment' as const })),
                    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                    
                    if (allItems.length === 0) {
                      return (
                        <div className="text-center py-16 text-muted-foreground">
                          <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-20" />
                          <p className="mb-2">No timeline items yet</p>
                          <p className="text-sm">
                            Log interactions from an adjuster's profile or add attachments.
                          </p>
                        </div>
                      );
                    }
                    
                    return (
                      <div className="relative">
                        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                        <div className="space-y-4 pl-10">
                          {allItems.map((item) => (
                            <div key={item.id} className="relative" data-testid={`timeline-${item.id}`}>
                              <div className={`absolute -left-[26px] top-3 w-3 h-3 rounded-full border-2 border-background ${
                                item.itemType === 'attachment' ? 'bg-amber-500' : 'bg-primary'
                              }`} />
                              {item.itemType === 'interaction' ? (
                                <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                                    <div className="bg-primary/10 p-1.5 rounded">
                                      {getInteractionIcon(item.type)}
                                    </div>
                                    <Badge variant="secondary" className="text-xs">
                                      {item.type}
                                    </Badge>
                                    <span className="text-sm font-mono text-muted-foreground">
                                      {item.date}
                                    </span>
                                  </div>
                                  <p className="text-sm">{item.description}</p>
                                  {item.outcome && (
                                    <p className="text-sm text-muted-foreground mt-2 italic">
                                      Outcome: {item.outcome}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <div 
                                  className="bg-amber-500/5 rounded-lg p-4 border border-amber-500/20 cursor-pointer hover:bg-amber-500/10 transition-colors"
                                  onClick={() => setViewingAttachment(item)}
                                >
                                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                                    <div className="bg-amber-500/20 p-1.5 rounded">
                                      {item.type === 'email' ? (
                                        item.direction === 'sent' ? <Send className="w-4 h-4 text-amber-600" /> : <Inbox className="w-4 h-4 text-amber-600" />
                                      ) : (
                                        <FileText className="w-4 h-4 text-amber-600" />
                                      )}
                                    </div>
                                    <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-600">
                                      {item.type === 'email' ? (item.direction === 'sent' ? 'Email Sent' : 'Email Received') : 'File'}
                                    </Badge>
                                    <span className="text-sm font-mono text-muted-foreground">
                                      {item.date}
                                    </span>
                                  </div>
                                  {item.type === 'email' ? (
                                    <p className="text-sm font-medium">{item.subject}</p>
                                  ) : (
                                    <p className="text-sm">{item.filename}{item.description && ` - ${item.description}`}</p>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          <Dialog open={!!viewingAttachment} onOpenChange={() => setViewingAttachment(null)}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {viewingAttachment?.type === 'email' ? (
                    <>
                      {viewingAttachment.direction === 'sent' ? <Send className="w-5 h-5" /> : <Inbox className="w-5 h-5" />}
                      {viewingAttachment.direction === 'sent' ? 'Email Sent' : 'Email Received'}
                    </>
                  ) : (
                    <>
                      <FileText className="w-5 h-5" />
                      File Attachment
                    </>
                  )}
                </DialogTitle>
                <DialogDescription>
                  {viewingAttachment?.date}
                </DialogDescription>
              </DialogHeader>
              {viewingAttachment && (
                <div className="space-y-4">
                  {viewingAttachment.type === 'email' ? (
                    <>
                      <div>
                        <Label className="text-muted-foreground">Subject</Label>
                        <p className="font-medium">{viewingAttachment.subject}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Body</Label>
                        <div className="bg-muted/30 p-4 rounded-lg mt-1 whitespace-pre-wrap text-sm">
                          {viewingAttachment.body}
                        </div>
                      </div>
                      {viewingAttachment.notes && (
                        <div>
                          <Label className="text-muted-foreground">Notes</Label>
                          <p className="text-sm italic">{viewingAttachment.notes}</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div>
                        <Label className="text-muted-foreground">Filename</Label>
                        <p className="font-medium">{viewingAttachment.filename}</p>
                      </div>
                      {viewingAttachment.description && (
                        <div>
                          <Label className="text-muted-foreground">Description</Label>
                          <p className="text-sm">{viewingAttachment.description}</p>
                        </div>
                      )}
                      {viewingAttachment.size && (
                        <div>
                          <Label className="text-muted-foreground">Size</Label>
                          <p className="text-sm">{(viewingAttachment.size / 1024).toFixed(1)} KB</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </Layout>
  );
}
