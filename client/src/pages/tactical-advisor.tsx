import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, Lightbulb, AlertTriangle, CheckCircle, Loader2, Zap, Target, Shield } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { fetchAdjusters, fetchClaims } from "@/lib/api";

interface TacticalAdvice {
  strategy: string;
  keyPoints: string[];
  riskLevel: 'low' | 'medium' | 'high';
  suggestedActions: string[];
}

export default function TacticalAdvisor() {
  const [selectedAdjuster, setSelectedAdjuster] = useState<string>("");
  const [selectedClaim, setSelectedClaim] = useState<string>("");
  const [situation, setSituation] = useState("");
  const [advice, setAdvice] = useState<TacticalAdvice | null>(null);

  const { data: adjusters = [] } = useQuery({
    queryKey: ['adjusters'],
    queryFn: fetchAdjusters,
  });

  const { data: claims = [] } = useQuery({
    queryKey: ['claims'],
    queryFn: fetchClaims,
  });

  const getAdviceMutation = useMutation({
    mutationFn: async ({ adjusterId, claimId, situation }: { adjusterId?: string; claimId?: string; situation: string }) => {
      const res = await fetch('/api/tactical-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adjusterId, claimId, situation }),
      });
      if (!res.ok) throw new Error('Failed to get advice');
      return res.json();
    },
    onSuccess: (data) => {
      setAdvice(data.advice);
    },
  });

  const handleGetAdvice = () => {
    if (!situation.trim()) return;
    getAdviceMutation.mutate({
      adjusterId: selectedAdjuster && selectedAdjuster !== 'none' ? selectedAdjuster : undefined,
      claimId: selectedClaim && selectedClaim !== 'none' ? selectedClaim : undefined,
      situation,
    });
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-emerald-500/20 text-emerald-400';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400';
      case 'high': return 'bg-red-500/20 text-red-400';
      default: return 'bg-muted';
    }
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Bot className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Tactical Advisor</h1>
            <p className="text-muted-foreground">AI-powered claim strategy recommendations</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Situation Analysis
              </CardTitle>
              <CardDescription>
                Describe your current situation for strategic advice
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Adjuster (Optional)</label>
                  <Select value={selectedAdjuster} onValueChange={setSelectedAdjuster}>
                    <SelectTrigger data-testid="select-adjuster">
                      <SelectValue placeholder="Select adjuster..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {adjusters.map((adj: any) => (
                        <SelectItem key={adj.id} value={adj.id}>{adj.name} - {adj.carrier}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Claim (Optional)</label>
                  <Select value={selectedClaim} onValueChange={setSelectedClaim}>
                    <SelectTrigger data-testid="select-claim">
                      <SelectValue placeholder="Select claim..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {claims.map((claim: any) => (
                        <SelectItem key={claim.id} value={claim.id}>{claim.maskedId} - {claim.carrier}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Describe Your Situation</label>
                <Textarea
                  placeholder="Example: The adjuster denied my roof claim citing pre-existing damage, but I have photos from before the storm..."
                  value={situation}
                  onChange={(e) => setSituation(e.target.value)}
                  className="min-h-[150px]"
                  data-testid="input-situation"
                />
              </div>

              <Button 
                onClick={handleGetAdvice} 
                disabled={!situation.trim() || getAdviceMutation.isPending}
                className="w-full"
                data-testid="button-get-advice"
              >
                {getAdviceMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Get Tactical Advice
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                Strategic Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {advice ? (
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-6">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Risk Assessment:</span>
                      <Badge className={getRiskColor(advice.riskLevel)}>
                        {advice.riskLevel === 'high' && <AlertTriangle className="w-3 h-3 mr-1" />}
                        {advice.riskLevel === 'low' && <CheckCircle className="w-3 h-3 mr-1" />}
                        {advice.riskLevel.toUpperCase()} RISK
                      </Badge>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Strategy Overview
                      </h4>
                      <p className="text-muted-foreground text-sm leading-relaxed">{advice.strategy}</p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Key Points</h4>
                      <ul className="space-y-2">
                        {advice.keyPoints.map((point, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                            <span className="text-muted-foreground">{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Suggested Actions</h4>
                      <div className="space-y-2">
                        {advice.suggestedActions.map((action, i) => (
                          <div key={i} className="flex items-start gap-2 bg-primary/5 p-3 rounded-lg text-sm">
                            <span className="bg-primary text-primary-foreground w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0">
                              {i + 1}
                            </span>
                            <span>{action}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              ) : (
                <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Bot className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>Describe your situation to get AI-powered tactical advice</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quick Scenarios</CardTitle>
            <CardDescription>Common situations - click to get instant advice</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                "Adjuster denied claim, how do I appeal?",
                "Low initial estimate, need supplement strategy",
                "Adjuster not responding to communications",
                "Preparing for re-inspection",
                "Carrier offering unfair settlement",
                "Need to escalate to supervisor",
              ].map((scenario, i) => (
                <Button
                  key={i}
                  variant="outline"
                  className="h-auto py-3 text-left justify-start"
                  onClick={() => {
                    setSituation(scenario);
                  }}
                  data-testid={`button-scenario-${i}`}
                >
                  {scenario}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
