import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Brain,
  TrendingUp,
  Shield,
  AlertTriangle,
  Zap,
  Target,
  ChevronRight,
  RefreshCw,
  Lightbulb,
  BarChart3,
  Eye,
} from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";

interface InsightData {
  threatLevel: number;
  threatLabel: string;
  marketOpportunity: string;
  swot: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  trendSummary: string;
  predictedMoves: string[];
  recommendations: string[];
  competitorScores: { name: string; activityScore: number; threatScore: number }[];
}

const THREAT_COLORS: Record<string, string> = {
  Low: "text-emerald-400",
  Medium: "text-amber-400",
  High: "text-orange-400",
  Critical: "text-red-400",
};

const THREAT_BG: Record<string, string> = {
  Low: "bg-emerald-400/10 border-emerald-400/30",
  Medium: "bg-amber-400/10 border-amber-400/30",
  High: "bg-orange-400/10 border-orange-400/30",
  Critical: "bg-red-400/10 border-red-400/30",
};

export default function AIInsights() {
  const [data, setData] = useState<InsightData | null>(null);

  const generate = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/ai/insights", { method: "POST", headers: { "Content-Type": "application/json" } });
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<InsightData>;
    },
    onSuccess: (d) => setData(d),
  });

  const swotItems = data
    ? [
        { label: "Strengths", items: data.swot.strengths, color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/20", icon: Shield },
        { label: "Weaknesses", items: data.swot.weaknesses, color: "text-red-400", bg: "bg-red-400/10 border-red-400/20", icon: AlertTriangle },
        { label: "Opportunities", items: data.swot.opportunities, color: "text-sky-400", bg: "bg-sky-400/10 border-sky-400/20", icon: TrendingUp },
        { label: "Threats", items: data.swot.threats, color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/20", icon: Zap },
      ]
    : [];

  const radarData = data?.competitorScores?.map((c) => ({
    name: c.name.length > 12 ? c.name.slice(0, 12) + "…" : c.name,
    activity: c.activityScore,
    threat: c.threatScore,
  })) ?? [];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Brain className="h-8 w-8 text-primary" />
            AI Insights
          </h1>
          <p className="text-muted-foreground mt-2">
            AI-generated SWOT analysis, threat scores, and market intelligence.
          </p>
        </div>
        <Button
          onClick={() => generate.mutate()}
          disabled={generate.isPending}
          className="gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
        >
          {generate.isPending ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Brain className="h-4 w-4" />
          )}
          {data ? "Regenerate" : "Generate Insights"}
        </Button>
      </div>

      {!data && !generate.isPending && (
        <div className="flex flex-col items-center justify-center py-24 border border-dashed border-border/40 rounded-2xl bg-card/30 backdrop-blur">
          <Brain className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No insights generated yet</h3>
          <p className="text-muted-foreground text-sm max-w-sm text-center">
            Click "Generate Insights" to run AI analysis across your competitor data and get strategic intelligence.
          </p>
        </div>
      )}

      {generate.isPending && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
          </div>
        </div>
      )}

      {data && (
        <div className="space-y-6">
          {/* Top row: threat level + opportunity + trend */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className={`border ${THREAT_BG[data.threatLabel] ?? "border-border/40"} bg-card/50 backdrop-blur`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <Shield className="h-4 w-4" /> Threat Level
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-4xl font-black font-mono ${THREAT_COLORS[data.threatLabel] ?? "text-foreground"}`}>
                  {data.threatLevel}<span className="text-lg">/10</span>
                </div>
                <Badge className={`mt-2 ${THREAT_COLORS[data.threatLabel]}`} variant="outline">
                  {data.threatLabel}
                </Badge>
                <Progress value={data.threatLevel * 10} className="mt-3 h-1.5" />
              </CardContent>
            </Card>

            <Card className="border-border/40 bg-card/50 backdrop-blur col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <Eye className="h-4 w-4" /> Market Opportunity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground leading-relaxed">{data.marketOpportunity}</p>
              </CardContent>
            </Card>
          </div>

          {/* SWOT */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" /> SWOT Analysis
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {swotItems.map(({ label, items, color, bg, icon: Icon }) => (
                <Card key={label} className={`border ${bg} bg-card/50 backdrop-blur`}>
                  <CardHeader className="pb-2">
                    <CardTitle className={`text-sm font-semibold flex items-center gap-2 ${color}`}>
                      <Icon className="h-4 w-4" /> {label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <ChevronRight className={`h-3 w-3 mt-0.5 flex-none ${color}`} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Competitor radar + bar chart */}
          {radarData.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-border/40 bg-card/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-sm">Competitor Radar</CardTitle>
                  <CardDescription>Activity vs threat score per competitor</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={240}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#1e293b" />
                      <PolarAngleAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} />
                      <Radar name="Activity" dataKey="activity" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.2} />
                      <Radar name="Threat" dataKey="threat" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-border/40 bg-card/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-sm">Threat Scores</CardTitle>
                  <CardDescription>Ranked by competitive threat level</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={radarData} layout="vertical">
                      <XAxis type="number" domain={[0, 10]} tick={{ fill: "#64748b", fontSize: 11 }} />
                      <YAxis type="category" dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} width={80} />
                      <Tooltip
                        contentStyle={{ background: "#0f1117", border: "1px solid #1e293b", borderRadius: 8 }}
                        labelStyle={{ color: "#f1f5f9" }}
                      />
                      <Bar dataKey="threat" radius={[0, 4, 4, 0]}>
                        {radarData.map((_, index) => (
                          <Cell key={index} fill={`hsl(${200 + index * 20}, 80%, 60%)`} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Trend + predicted moves + recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-border/40 bg-card/50 backdrop-blur">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" /> Trend Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{data.trendSummary}</p>
              </CardContent>
            </Card>

            <Card className="border-border/40 bg-card/50 backdrop-blur">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="h-4 w-4 text-amber-400" /> Predicted Moves
                </CardTitle>
                <CardDescription>Next 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {data.predictedMoves.map((move, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="font-mono text-amber-400 text-xs mt-0.5 flex-none">0{i + 1}</span>
                      {move}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-primary/5 backdrop-blur">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-primary" /> Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {data.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                      <ChevronRight className="h-3 w-3 mt-0.5 flex-none text-primary" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
