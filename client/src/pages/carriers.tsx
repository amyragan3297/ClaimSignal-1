import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, ClipboardList, Clock, TrendingUp, CheckCircle, XCircle, Loader2, BarChart3, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchCarriers, fetchCarrierIntelligence, type CarrierIntelligence } from "@/lib/api";
import { Link } from "wouter";

function CarrierCard({ carrier }: { carrier: string }) {
  const { data: intel, isLoading } = useQuery({
    queryKey: ['carrier-intelligence', carrier],
    queryFn: () => fetchCarrierIntelligence(carrier),
  });

  const getFrictionBadge = (level: CarrierIntelligence['frictionLevel']) => {
    if (!level) return null;
    const colors = {
      'Low': 'bg-green-500/10 text-green-600 border-green-500/20',
      'Normal': 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
      'High': 'bg-red-500/10 text-red-600 border-red-500/20',
    };
    return <Badge variant="outline" className={colors[level]}>{level} Friction</Badge>;
  };

  const getResolutionBadge = (tendency: CarrierIntelligence['resolutionTendency']) => {
    if (!tendency) return null;
    const colors = {
      'Fast': 'bg-green-500/10 text-green-600 border-green-500/20',
      'Normal': 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
      'Slow': 'bg-red-500/10 text-red-600 border-red-500/20',
    };
    return <Badge variant="outline" className={colors[tendency]}>{tendency} Resolution</Badge>;
  };

  return (
    <Card className="bg-card/50 border-border/60 hover:border-primary/30 transition-colors" data-testid={`card-carrier-${carrier}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            {carrier}
          </CardTitle>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : intel ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {getFrictionBadge(intel.frictionLevel)}
              {getResolutionBadge(intel.resolutionTendency)}
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span>{intel.totalAdjusters} Adjusters</span>
              </div>
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-muted-foreground" />
                <span>{intel.totalClaims} Claims</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>{intel.avgDaysToResolution !== null ? `${intel.avgDaysToResolution}d avg` : '—'}</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                <span>{intel.escalationEffectiveness !== null ? `${intel.escalationEffectiveness}% esc. success` : '—'}</span>
              </div>
            </div>

            <div className="flex gap-3 text-xs border-t border-border/50 pt-3">
              <div className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-green-500" />
                <span>{intel.outcomesResolved} resolved</span>
              </div>
              <div className="flex items-center gap-1">
                <XCircle className="w-3 h-3 text-red-500" />
                <span>{intel.outcomesStalled} stalled</span>
              </div>
              <div className="flex items-center gap-1">
                <Loader2 className="w-3 h-3 text-yellow-500" />
                <span>{intel.outcomesOpen} open</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No data available</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function Carriers() {
  const { data: carriers = [], isLoading } = useQuery({
    queryKey: ['carriers'],
    queryFn: fetchCarriers,
  });

  return (
    <Layout>
      <div className="p-6 md:p-8 space-y-8 animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" data-testid="page-title">Carrier Intelligence</h1>
            <p className="text-muted-foreground mt-1">Aggregated insights across all adjusters by carrier</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : carriers.length === 0 ? (
          <Card className="bg-card/50 border-border/60">
            <CardContent className="py-16 text-center">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-muted-foreground">No carriers found yet.</p>
              <p className="text-sm text-muted-foreground mt-1">Add adjusters and claims to see carrier-level analytics.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {carriers.map((carrier) => (
              <CarrierCard key={carrier} carrier={carrier} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
