import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Users, ClipboardList, Clock, TrendingUp, CheckCircle, XCircle, Loader2, ArrowLeft, BarChart3 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { fetchCarrierIntelligence, fetchAdjusters, fetchClaims } from "@/lib/api";
import { Link } from "wouter";

export default function CarrierDetail() {
  const { name } = useParams();
  const carrierName = decodeURIComponent(name || '');

  const { data: intel, isLoading } = useQuery({
    queryKey: ['carrier-intelligence', carrierName],
    queryFn: () => fetchCarrierIntelligence(carrierName),
    enabled: !!carrierName,
  });

  const { data: allAdjusters = [] } = useQuery({
    queryKey: ['adjusters'],
    queryFn: fetchAdjusters,
  });

  const { data: allClaims = [] } = useQuery({
    queryKey: ['claims'],
    queryFn: fetchClaims,
  });

  const carrierAdjusters = allAdjusters.filter(a => a.carrier === carrierName);
  const carrierClaims = allClaims.filter(c => c.carrier === carrierName);

  const getFrictionBadge = (level: string | null) => {
    if (!level) return null;
    const colors: Record<string, string> = {
      'Low': 'bg-green-500/10 text-green-600 border-green-500/20',
      'Normal': 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
      'High': 'bg-red-500/10 text-red-600 border-red-500/20',
    };
    return <Badge variant="outline" className={colors[level]}>{level} Friction</Badge>;
  };

  const getResolutionBadge = (tendency: string | null) => {
    if (!tendency) return null;
    const colors: Record<string, string> = {
      'Fast': 'bg-green-500/10 text-green-600 border-green-500/20',
      'Normal': 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
      'Slow': 'bg-red-500/10 text-red-600 border-red-500/20',
    };
    return <Badge variant="outline" className={colors[tendency]}>{tendency} Resolution</Badge>;
  };

  return (
    <Layout>
      <div className="p-6 md:p-8 space-y-8 animate-in fade-in duration-500">
        <div className="flex items-center gap-4">
          <Link href="/carriers">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3" data-testid="carrier-name">
              <Building2 className="w-8 h-8 text-primary" />
              {carrierName}
            </h1>
            <p className="text-muted-foreground mt-1">Carrier Intelligence Snapshot</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : intel ? (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              {getFrictionBadge(intel.frictionLevel)}
              {getResolutionBadge(intel.resolutionTendency)}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-card/50 border-border/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Avg Resolution Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="stat-avg-resolution">
                    {intel.avgDaysToResolution !== null ? `${intel.avgDaysToResolution} days` : '—'}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Escalation Effectiveness
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="stat-escalation-effectiveness">
                    {intel.escalationEffectiveness !== null ? `${intel.escalationEffectiveness}%` : '—'}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <ClipboardList className="w-4 h-4" />
                    Claims Tracked
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="stat-claims-tracked">
                    {intel.totalClaims}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Avg Interactions/Claim
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="stat-avg-interactions">
                    {intel.avgInteractionsPerClaim !== null ? intel.avgInteractionsPerClaim : '—'}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-card/50 border-border/60">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Outcomes Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-6">
                  <div className="flex items-center gap-2" data-testid="outcome-resolved">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-lg font-semibold">{intel.outcomesResolved}</span>
                    <span className="text-muted-foreground">Resolved</span>
                  </div>
                  <div className="flex items-center gap-2" data-testid="outcome-stalled">
                    <XCircle className="w-5 h-5 text-red-500" />
                    <span className="text-lg font-semibold">{intel.outcomesStalled}</span>
                    <span className="text-muted-foreground">Stalled/Denied</span>
                  </div>
                  <div className="flex items-center gap-2" data-testid="outcome-open">
                    <Loader2 className="w-5 h-5 text-yellow-500" />
                    <span className="text-lg font-semibold">{intel.outcomesOpen}</span>
                    <span className="text-muted-foreground">Open</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-card/50 border-border/60">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Adjusters ({carrierAdjusters.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {carrierAdjusters.length > 0 ? (
                    <div className="space-y-2">
                      {carrierAdjusters.slice(0, 5).map(adj => (
                        <Link key={adj.id} href={`/adjuster/${adj.id}`}>
                          <div className="p-2 rounded hover:bg-muted/50 cursor-pointer transition-colors">
                            <span className="text-sm font-medium">{adj.name}</span>
                            {adj.region && <span className="text-xs text-muted-foreground ml-2">{adj.region}</span>}
                          </div>
                        </Link>
                      ))}
                      {carrierAdjusters.length > 5 && (
                        <p className="text-xs text-muted-foreground">+{carrierAdjusters.length - 5} more</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No adjusters linked yet</p>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border/60">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="w-5 h-5" />
                    Recent Claims ({carrierClaims.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {carrierClaims.length > 0 ? (
                    <div className="space-y-2">
                      {carrierClaims.slice(0, 5).map(claim => (
                        <Link key={claim.id} href={`/claims/${claim.id}`}>
                          <div className="p-2 rounded hover:bg-muted/50 cursor-pointer transition-colors flex justify-between items-center">
                            <span className="text-sm font-mono">#{claim.maskedId}</span>
                            <Badge variant="outline" className="text-xs">{claim.status}</Badge>
                          </div>
                        </Link>
                      ))}
                      {carrierClaims.length > 5 && (
                        <p className="text-xs text-muted-foreground">+{carrierClaims.length - 5} more</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No claims tracked yet</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <Card className="bg-card/50 border-border/60">
            <CardContent className="py-16 text-center">
              <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-muted-foreground">No data found for this carrier.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
