import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  User, 
  Building2, 
  MapPin, 
  FileText, 
  AlertTriangle,
  Loader2,
  Plus
} from "lucide-react";
import { fetchAdjusters } from "@/lib/api";
import type { Adjuster } from "@shared/schema";

export default function Adjusters() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: adjusters, isLoading } = useQuery({
    queryKey: ["/api/adjusters"],
    queryFn: fetchAdjusters,
  });

  const filteredAdjusters = adjusters?.filter((adjuster: Adjuster) => {
    const query = searchQuery.toLowerCase();
    return (
      adjuster.name.toLowerCase().includes(query) ||
      adjuster.carrier.toLowerCase().includes(query) ||
      (adjuster.region?.toLowerCase().includes(query) ?? false)
    );
  }) ?? [];

  const getRiskColor = (impression: string | null | undefined) => {
    if (!impression) return "bg-slate-500/20 text-slate-400";
    const lower = impression.toLowerCase();
    if (lower.includes("difficult") || lower.includes("aggressive") || lower.includes("denied")) {
      return "bg-red-500/20 text-red-400";
    }
    if (lower.includes("fair") || lower.includes("reasonable") || lower.includes("cooperative")) {
      return "bg-green-500/20 text-green-400";
    }
    return "bg-amber-500/20 text-amber-400";
  };

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" data-testid="page-title">Adjusters</h1>
            <p className="text-muted-foreground">
              View and manage insurance adjusters in your database
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-full md:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search adjusters..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full md:w-[250px]"
                data-testid="search-input"
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredAdjusters.length === 0 ? (
          <Card className="bg-card/50">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <User className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No adjusters found</h3>
              <p className="text-muted-foreground text-center max-w-md">
                {searchQuery 
                  ? "No adjusters match your search criteria. Try a different search term."
                  : "Start by adding adjusters through the smart upload feature or manually."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredAdjusters.map((adjuster: Adjuster) => (
              <Link key={adjuster.id} href={`/adjuster/${adjuster.id}`}>
                <Card 
                  className="bg-card/50 hover:bg-card/80 transition-colors cursor-pointer h-full"
                  data-testid={`adjuster-card-${adjuster.id}`}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <User className="w-5 h-5 text-primary" />
                        <span className="text-lg">{adjuster.name}</span>
                      </div>
                      {adjuster.riskImpression && (
                        <Badge className={getRiskColor(adjuster.riskImpression)} variant="secondary">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Risk
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building2 className="w-4 h-4" />
                      <span>{adjuster.carrier}</span>
                    </div>
                    {adjuster.region && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span>{adjuster.region}</span>
                      </div>
                    )}
                    {adjuster.internalNotes && (
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-2">{adjuster.internalNotes}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        <div className="text-sm text-muted-foreground text-center">
          {filteredAdjusters.length} adjuster{filteredAdjusters.length !== 1 ? 's' : ''} total
        </div>
      </div>
    </Layout>
  );
}
