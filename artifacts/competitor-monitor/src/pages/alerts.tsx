import { useListChecks, useListCompetitors } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO, formatDistanceToNow } from "date-fns";
import {
  Bell,
  DollarSign,
  Zap,
  FileText,
  Briefcase,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const CHANGE_TYPE_CONFIG = {
  pricing: { icon: DollarSign, color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/20", label: "Pricing" },
  features: { icon: Zap, color: "text-sky-400", bg: "bg-sky-400/10 border-sky-400/20", label: "Features" },
  blog: { icon: FileText, color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/20", label: "Blog" },
  jobs: { icon: Briefcase, color: "text-purple-400", bg: "bg-purple-400/10 border-purple-400/20", label: "Jobs" },
} as const;

type ChangeType = keyof typeof CHANGE_TYPE_CONFIG;
type FilterType = ChangeType | "all";

export default function Alerts() {
  const { data: checks, isLoading: loadingChecks } = useListChecks({ limit: 100 });
  const { data: competitors } = useListCompetitors();
  const [filter, setFilter] = useState<FilterType>("all");

  const alerts = (checks ?? []).filter((c) => c.hasChanges && c.status === "completed");
  const filtered = filter === "all" ? alerts : alerts.filter((a) => a.changeType === filter);

  const counts = {
    all: alerts.length,
    pricing: alerts.filter((a) => a.changeType === "pricing").length,
    features: alerts.filter((a) => a.changeType === "features").length,
    blog: alerts.filter((a) => a.changeType === "blog").length,
    jobs: alerts.filter((a) => a.changeType === "jobs").length,
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <Bell className="h-8 w-8 text-primary" />
          Alert Center
        </h1>
        <p className="text-muted-foreground mt-2">
          All changes detected across your monitored competitors.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(["pricing", "features", "blog", "jobs"] as ChangeType[]).map((type) => {
          const cfg = CHANGE_TYPE_CONFIG[type];
          return (
            <Card
              key={type}
              className={`border ${cfg.bg} bg-card/50 backdrop-blur cursor-pointer transition-all hover:scale-[1.02] ${filter === type ? "ring-1 ring-primary/50" : ""}`}
              onClick={() => setFilter(filter === type ? "all" : type)}
            >
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <cfg.icon className={`h-4 w-4 ${cfg.color}`} />
                  <span className={`text-2xl font-black font-mono ${cfg.color}`}>{counts[type]}</span>
                </div>
                <p className="text-xs text-muted-foreground font-medium">{cfg.label} Alerts</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filter pills */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-4 w-4 text-muted-foreground" />
        {(["all", "pricing", "features", "blog", "jobs"] as FilterType[]).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
            className="h-7 text-xs capitalize"
          >
            {f === "all" ? `All (${counts.all})` : `${f} (${counts[f as ChangeType]})`}
          </Button>
        ))}
      </div>

      {/* Alerts list */}
      {loadingChecks ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border/40 rounded-2xl bg-card/30">
          <Bell className="h-10 w-10 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-1">No alerts yet</h3>
          <p className="text-muted-foreground text-sm max-w-sm text-center">
            {filter === "all"
              ? "Run checks on your competitors to start detecting changes."
              : `No ${filter} changes detected yet.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((alert) => {
            const changeType = (alert.changeType ?? "features") as ChangeType;
            const cfg = CHANGE_TYPE_CONFIG[changeType] ?? CHANGE_TYPE_CONFIG.features;
            return (
              <Card
                key={alert.id}
                className={`border ${cfg.bg} bg-card/50 backdrop-blur hover:bg-card/80 transition-all`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-9 h-9 rounded-lg ${cfg.bg} border ${cfg.bg} flex items-center justify-center flex-none`}>
                      <cfg.icon className={`h-4 w-4 ${cfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground text-sm">{alert.competitorName}</span>
                          <Badge variant="outline" className={`text-xs ${cfg.color} border-current/30`}>
                            {cfg.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-none">
                          <Clock className="h-3 w-3" />
                          <span title={format(parseISO(alert.checkedAt), "PPP p")}>
                            {formatDistanceToNow(parseISO(alert.checkedAt), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-foreground mt-1">{alert.summary}</p>
                      {alert.details && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{alert.details}</p>
                      )}
                    </div>
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-none mt-0.5" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
