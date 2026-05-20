import { useGetDashboardSummary, useListActivity, useListChecks } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, parseISO, subDays, startOfDay } from "date-fns";
import {
  Target,
  Activity,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  Brain,
  Bell,
  GitCompare,
  Zap,
} from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useMemo } from "react";

const CHANGE_COLORS: Record<string, string> = {
  pricing: "#f59e0b",
  features: "#0ea5e9",
  blog: "#10b981",
  jobs: "#a855f7",
};

const PIE_COLORS = ["#0ea5e9", "#f59e0b", "#10b981", "#a855f7"];

function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  title: string;
  value: string | number;
  sub: string;
  icon: React.ElementType;
  accent?: string;
}) {
  return (
    <Card className="bg-card/50 backdrop-blur border-border/40 hover:border-primary/40 transition-all hover:shadow-lg hover:shadow-primary/5 group">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
          <Icon className={`h-4 w-4 ${accent ?? "text-primary"}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-black font-mono ${accent ?? "text-foreground"}`}>{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{sub}</p>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary();
  const { data: activity, isLoading: loadingActivity } = useListActivity({ limit: 8 });
  const { data: checks } = useListChecks({ limit: 200 });

  const trendData = useMemo(() => {
    const days = 7;
    const buckets: Record<string, { date: string; changes: number; checks: number }> = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = format(subDays(new Date(), i), "MMM d");
      buckets[d] = { date: d, changes: 0, checks: 0 };
    }
    (checks ?? []).forEach((c) => {
      const d = format(parseISO(c.checkedAt), "MMM d");
      if (buckets[d]) {
        buckets[d].checks += 1;
        if (c.hasChanges) buckets[d].changes += 1;
      }
    });
    return Object.values(buckets);
  }, [checks]);

  const pieData = useMemo(() => {
    if (!summary?.changesByType) return [];
    return [
      { name: "Pricing", value: summary.changesByType.pricing || 0 },
      { name: "Features", value: summary.changesByType.features || 0 },
      { name: "Blog", value: summary.changesByType.blog || 0 },
      { name: "Jobs", value: summary.changesByType.jobs || 0 },
    ].filter((d) => d.value > 0);
  }, [summary]);

  const changeTypeLabel: Record<string, { label: string; color: string }> = {
    pricing: { label: "Pricing", color: "text-amber-400" },
    features: { label: "Features", color: "text-sky-400" },
    blog: { label: "Blog", color: "text-emerald-400" },
    jobs: { label: "Jobs", color: "text-purple-400" },
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground" data-testid="page-title">
            Command Center
          </h1>
          <p className="text-muted-foreground mt-1">System overview and real-time intelligence.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/ai-insights">
            <Button variant="outline" size="sm" className="gap-2 border-primary/30 text-primary hover:bg-primary/10">
              <Brain className="h-4 w-4" /> AI Insights
            </Button>
          </Link>
          <Link href="/alerts">
            <Button variant="outline" size="sm" className="gap-2">
              <Bell className="h-4 w-4" /> Alerts
            </Button>
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      {loadingSummary ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      ) : summary ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Active Targets"
            value={`${summary.activeCompetitors}/${summary.totalCompetitors}`}
            sub="Competitors monitored"
            icon={Target}
          />
          <StatCard
            title="Checks Today"
            value={summary.checksToday}
            sub="Across all targets"
            icon={Activity}
            accent="text-sky-400"
          />
          <StatCard
            title="Changes This Week"
            value={summary.changesThisWeek}
            sub="Detected changes"
            icon={AlertTriangle}
            accent="text-amber-400"
          />
          <StatCard
            title="Last Digest"
            value={summary.lastDigestSentAt ? format(parseISO(summary.lastDigestSentAt), "HH:mm") : "None"}
            sub={summary.lastDigestSentAt ? format(parseISO(summary.lastDigestSentAt), "MMM d, yyyy") : "No digests sent"}
            icon={CheckCircle2}
            accent="text-emerald-400"
          />
        </div>
      ) : null}

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Activity trend - area chart */}
        <Card className="lg:col-span-2 border-border/40 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Activity Trend
            </CardTitle>
            <CardDescription>Changes and checks detected over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            {checks ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={trendData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="gChanges" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gChecks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#64748b" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#64748b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: "#0f1117", border: "1px solid #1e293b", borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: "#f1f5f9", fontWeight: 600 }}
                    itemStyle={{ color: "#94a3b8" }}
                  />
                  <Area type="monotone" dataKey="checks" name="Checks" stroke="#334155" fill="url(#gChecks)" strokeWidth={1.5} />
                  <Area type="monotone" dataKey="changes" name="Changes" stroke="#0ea5e9" fill="url(#gChanges)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <Skeleton className="h-[220px]" />
            )}
          </CardContent>
        </Card>

        {/* Change distribution - pie */}
        <Card className="border-border/40 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" /> Change Breakdown
            </CardTitle>
            <CardDescription>Distribution by category</CardDescription>
          </CardHeader>
          <CardContent>
            {summary?.changesByType ? (
              pieData.length > 0 ? (
                <div className="space-y-4">
                  <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={42}
                        outerRadius={62}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieData.map((_, index) => (
                          <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: "#0f1117", border: "1px solid #1e293b", borderRadius: 8, fontSize: 12 }}
                        itemStyle={{ color: "#94a3b8" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2">
                    {pieData.map((d, i) => (
                      <div key={d.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                          <span className="text-muted-foreground">{d.name}</span>
                        </div>
                        <span className="font-mono font-semibold text-foreground">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground/50 text-sm">
                  <Zap className="h-8 w-8 mb-2 opacity-30" />
                  No changes yet
                </div>
              )
            ) : (
              <Skeleton className="h-40" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent intelligence */}
        <Card className="lg:col-span-2 border-border/40 bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Intelligence</CardTitle>
              <CardDescription>Latest changes across monitored targets.</CardDescription>
            </div>
            <Link href="/checks">
              <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground text-xs">
                All <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loadingActivity ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
              </div>
            ) : activity && activity.length > 0 ? (
              <div className="space-y-4">
                {activity.map((item) => {
                  const cfg = changeTypeLabel[item.changeType];
                  return (
                    <div key={item.id} className="flex gap-3 group p-2 rounded-lg hover:bg-muted/20 transition-colors">
                      <div className="flex-none mt-1.5">
                        <div className="h-2 w-2 rounded-full bg-primary ring-4 ring-primary/15" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <p className="text-sm font-medium text-foreground">
                            <span className="text-primary">{item.competitorName}</span>
                            {cfg && <Badge variant="outline" className={`ml-2 text-[10px] h-4 ${cfg.color} border-current/20`}>{cfg.label}</Badge>}
                          </p>
                          <span className="text-xs text-muted-foreground font-mono flex-none">
                            {format(parseISO(item.detectedAt), "MMM d, HH:mm")}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{item.summary}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                <Target className="h-8 w-8 mx-auto mb-3 opacity-20" />
                <p className="text-sm">No changes detected yet.</p>
                <Link href="/competitors">
                  <Button variant="link" size="sm" className="mt-2 text-primary text-xs">
                    Add competitors →
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick actions */}
        <Card className="border-border/40 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-sm">Quick Actions</CardTitle>
            <CardDescription>Jump to key features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { href: "/ai-insights", icon: Brain, label: "Generate AI Insights", color: "text-primary", bg: "bg-primary/10 border-primary/20" },
              { href: "/ai-chat", icon: Activity, label: "Ask AI Assistant", color: "text-sky-400", bg: "bg-sky-400/10 border-sky-400/20" },
              { href: "/service-compare", icon: GitCompare, label: "Compare Services", color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/20" },
              { href: "/alerts", icon: Bell, label: "View Alert Center", color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/20" },
              { href: "/competitors", icon: Target, label: "Manage Competitors", color: "text-purple-400", bg: "bg-purple-400/10 border-purple-400/20" },
            ].map(({ href, icon: Icon, label, color, bg }) => (
              <Link key={href} href={href}>
                <button className={`w-full flex items-center gap-3 p-3 rounded-xl border ${bg} hover:opacity-80 transition-opacity text-left`}>
                  <div className={`w-7 h-7 rounded-lg ${bg} flex items-center justify-center flex-none`}>
                    <Icon className={`h-3.5 w-3.5 ${color}`} />
                  </div>
                  <span className="text-sm font-medium text-foreground">{label}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
                </button>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
