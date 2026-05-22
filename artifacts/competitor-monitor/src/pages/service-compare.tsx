import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  GitCompare,
  Plus,
  X,
  Star,
  Trophy,
  Zap,
  DollarSign,
  Users,
  HeartHandshake,
  Lock,
  CheckCircle2,
  XCircle,
  Minus,
  Sparkles,
} from "lucide-react";

interface ServiceData {
  name: string;
  category: string;
  tagline: string;
  pricingModel: string;
  freeTier: boolean;
  keyFeatures: string[];
  proscons: { pros: string[]; cons: string[] };
  targetAudience: string;
  aiSentiment: string;
  reliabilityScore: number;
  valueScore: number;
  easeOfUse: number;
  supportQuality: number;
  marketPosition: string;
}

interface CompareResult {
  services: ServiceData[];
  winner: { overall: string; bestValue: string; easiest: string; mostFeatures: string };
  recommendation: string;
  comparisonTable: { feature: string; values: Record<string, string> }[];
}

const PRESET_GROUPS = [
  { label: "AI Writing Tools", services: ["Notion AI", "Jasper AI", "Copy.ai"] },
  { label: "Cloud Providers", services: ["AWS", "Google Cloud", "Microsoft Azure"] },
  { label: "Project Management", services: ["Linear", "Jira", "Asana"] },
  { label: "CRM Tools", services: ["HubSpot", "Salesforce", "Pipedrive"] },
  { label: "Analytics", services: ["Mixpanel", "Amplitude", "PostHog"] },
];

const SENTIMENT_COLOR: Record<string, string> = {
  Positive: "text-emerald-400",
  Mixed: "text-amber-400",
  Negative: "text-red-400",
};

const POSITION_COLOR: Record<string, string> = {
  Leader: "bg-primary/20 text-primary border-primary/30",
  Challenger: "bg-amber-400/20 text-amber-400 border-amber-400/30",
  Niche: "bg-purple-400/20 text-purple-400 border-purple-400/30",
  Emerging: "bg-emerald-400/20 text-emerald-400 border-emerald-400/30",
};

function ScoreBar({ label, value, icon: Icon }: { label: string; value: number; icon: React.ElementType }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1 text-muted-foreground">
          <Icon className="h-3 w-3" /> {label}
        </span>
        <span className="font-mono font-semibold text-foreground">{value}/10</span>
      </div>
      <Progress value={value * 10} className="h-1.5" />
    </div>
  );
}

export default function ServiceCompare() {
  const [services, setServices] = useState<string[]>(["", ""]);
  const [result, setResult] = useState<CompareResult | null>(null);

  const compare = useMutation({
    mutationFn: async (svcs: string[]) => {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/ai/compare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ services: svcs }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed");
      }
      return res.json() as Promise<CompareResult>;
    },
    onSuccess: (d) => setResult(d),
  });

  const addService = () => setServices((s) => [...s, ""]);
  const removeService = (i: number) => setServices((s) => s.filter((_, j) => j !== i));
  const setService = (i: number, val: string) =>
    setServices((s) => s.map((x, j) => (j === i ? val : x)));

  const handleCompare = () => {
    const filtered = services.map((s) => s.trim()).filter(Boolean);
    if (filtered.length < 2) return;
    compare.mutate(filtered);
  };

  const loadPreset = (preset: string[]) => {
    setServices(preset);
    setResult(null);
    compare.mutate(preset);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <GitCompare className="h-8 w-8 text-primary" />
          Service Comparison
        </h1>
        <p className="text-muted-foreground mt-2">
          AI-powered comparison of SaaS tools, AI products, cloud providers, and more.
        </p>
      </div>

      {/* Input */}
      <Card className="border-border/40 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-base">Select Services to Compare</CardTitle>
          <CardDescription>Enter 2–5 service or product names</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {services.map((s, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={s}
                  onChange={(e) => setService(i, e.target.value)}
                  placeholder={`Service ${i + 1} (e.g. Notion)`}
                  onKeyDown={(e) => e.key === "Enter" && handleCompare()}
                />
                {services.length > 2 && (
                  <Button variant="ghost" size="icon" onClick={() => removeService(i)} className="shrink-0 text-muted-foreground">
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            {services.length < 5 && (
              <Button variant="outline" onClick={addService} className="gap-2 border-dashed">
                <Plus className="h-4 w-4" /> Add another
              </Button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-muted-foreground self-center">Quick compare:</span>
            {PRESET_GROUPS.map((pg) => (
              <Button
                key={pg.label}
                variant="secondary"
                size="sm"
                onClick={() => loadPreset(pg.services)}
                className="text-xs h-7"
              >
                {pg.label}
              </Button>
            ))}
          </div>

          <Button
            onClick={handleCompare}
            disabled={compare.isPending || services.filter((s) => s.trim()).length < 2}
            className="gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
          >
            {compare.isPending ? (
              <Sparkles className="h-4 w-4 animate-pulse" />
            ) : (
              <GitCompare className="h-4 w-4" />
            )}
            {compare.isPending ? "Comparing…" : "Compare with AI"}
          </Button>

          {compare.isError && (
            <p className="text-sm text-red-400">
              {compare.error instanceof Error ? compare.error.message : "Comparison failed"}
            </p>
          )}
        </CardContent>
      </Card>

      {compare.isPending && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-80 rounded-xl" />)}
        </div>
      )}

      {result && (
        <div className="space-y-8">
          {/* Winner badges */}
          <Card className="border-primary/20 bg-primary/5 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" /> AI Verdict
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Overall Winner", value: result.winner.overall, icon: Trophy },
                  { label: "Best Value", value: result.winner.bestValue, icon: DollarSign },
                  { label: "Easiest to Use", value: result.winner.easiest, icon: Zap },
                  { label: "Most Features", value: result.winner.mostFeatures, icon: Star },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="bg-background rounded-xl p-3 border border-border/40 text-center">
                    <Icon className="h-4 w-4 text-primary mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground mb-1">{label}</p>
                    <p className="text-sm font-semibold text-foreground">{value}</p>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed border-t border-border/40 pt-4">
                {result.recommendation}
              </p>
            </CardContent>
          </Card>

          {/* Service cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {result.services.map((svc) => (
              <Card key={svc.name} className="border-border/40 bg-card/50 backdrop-blur">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">{svc.name}</CardTitle>
                      <CardDescription className="text-xs mt-0.5">{svc.tagline}</CardDescription>
                    </div>
                    <Badge variant="outline" className={`text-xs shrink-0 ${POSITION_COLOR[svc.marketPosition] ?? ""}`}>
                      {svc.marketPosition}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <Badge variant="secondary" className="text-xs">{svc.category}</Badge>
                    {svc.freeTier && <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-400/30">Free tier</Badge>}
                    <span className={`text-xs font-medium self-center ml-1 ${SENTIMENT_COLOR[svc.aiSentiment] ?? ""}`}>
                      {svc.aiSentiment} sentiment
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-background rounded-lg p-3 border border-border/40">
                    <p className="text-xs text-muted-foreground mb-1">Pricing</p>
                    <p className="text-sm font-medium text-foreground">{svc.pricingModel}</p>
                  </div>

                  <div className="space-y-2">
                    <ScoreBar label="Reliability" value={svc.reliabilityScore} icon={Lock} />
                    <ScoreBar label="Value for Money" value={svc.valueScore} icon={DollarSign} />
                    <ScoreBar label="Ease of Use" value={svc.easeOfUse} icon={Zap} />
                    <ScoreBar label="Support" value={svc.supportQuality} icon={HeartHandshake} />
                  </div>

                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                      <Users className="h-3 w-3" /> Target Audience
                    </p>
                    <p className="text-xs text-foreground">{svc.targetAudience}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-medium text-emerald-400 mb-1">Pros</p>
                      <ul className="space-y-1">
                        {svc.proscons.pros.map((p, i) => (
                          <li key={i} className="flex items-start gap-1 text-xs text-muted-foreground">
                            <CheckCircle2 className="h-3 w-3 text-emerald-400 mt-0.5 flex-none" />
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-red-400 mb-1">Cons</p>
                      <ul className="space-y-1">
                        {svc.proscons.cons.map((p, i) => (
                          <li key={i} className="flex items-start gap-1 text-xs text-muted-foreground">
                            <XCircle className="h-3 w-3 text-red-400 mt-0.5 flex-none" />
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1.5">Key Features</p>
                    <ul className="space-y-1">
                      {svc.keyFeatures.slice(0, 4).map((f, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                          <span className="w-1 h-1 rounded-full bg-primary mt-1.5 flex-none" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Comparison table */}
          {result.comparisonTable && result.comparisonTable.length > 0 && (
            <Card className="border-border/40 bg-card/50 backdrop-blur overflow-hidden">
              <CardHeader>
                <CardTitle className="text-base">Feature Comparison Table</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/40 bg-muted/30">
                        <th className="text-left p-4 font-medium text-muted-foreground w-40">Feature</th>
                        {result.services.map((s) => (
                          <th key={s.name} className="text-left p-4 font-medium text-foreground">{s.name}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.comparisonTable.map((row, i) => (
                        <tr key={i} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                          <td className="p-4 text-muted-foreground text-xs font-medium">{row.feature}</td>
                          {result.services.map((s) => {
                            const val = row.values[s.name] ?? "—";
                            const isYes = val.toLowerCase() === "yes" || val === "✓";
                            const isNo = val.toLowerCase() === "no" || val === "✗";
                            return (
                              <td key={s.name} className="p-4 text-xs">
                                {isYes ? (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                ) : isNo ? (
                                  <Minus className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <span className="text-muted-foreground">{val}</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
