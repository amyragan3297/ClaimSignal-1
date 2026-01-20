import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BehaviorRadarProps {
  metrics: {
    aggressiveness: number;
    responsiveness: number;
    fairness: number;
    knowledge: number;
    negotiation: number;
  };
}

export function BehaviorRadar({ metrics }: BehaviorRadarProps) {
  const data = [
    { subject: 'Aggressive', A: metrics.aggressiveness, fullMark: 100 },
    { subject: 'Responsive', A: metrics.responsiveness, fullMark: 100 },
    { subject: 'Fairness', A: metrics.fairness, fullMark: 100 },
    { subject: 'Knowledge', A: metrics.knowledge, fullMark: 100 },
    { subject: 'Negotiation', A: metrics.negotiation, fullMark: 100 },
  ];

  return (
    <Card className="h-full border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Behavioral Profile</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
            <PolarGrid stroke="hsl(var(--muted-foreground))" strokeOpacity={0.2} />
            <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            <Radar
              name="Adjuster"
              dataKey="A"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              fillOpacity={0.3}
            />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
