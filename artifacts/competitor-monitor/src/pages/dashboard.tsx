import { useGetDashboardSummary, useListActivity, useListChecks } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, parseISO, subDays } from "date-fns";
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
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>

        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
          <Icon className={`h-4 w-4 ${accent ?? "text-primary"}`} />
        </div>
      </CardHeader>

      <CardContent>
        <div className={`text-2xl font-black font-mono ${accent ?? "text-foreground"}`}>
          {value}
        </div>

        <p className="text-xs text-muted-foreground mt-1">{sub}</p>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data: summary, isLoading: loadingSummary } =
    useGetDashboardSummary();

  const { data: activity, isLoading: loadingActivity } =
    useListActivity({ limit: 8 });

  const { data: checks } = useListChecks({ limit: 200 });

  // SAFE ARRAY FIX
  const safeChecks = useMemo(() => {
    if (Array.isArray(checks)) return checks;

    if (Array.isArray((checks as any)?.data)) {
      return (checks as any).data;
    }

    return [];
  }, [checks]);

  const trendData = useMemo(() => {
    const days = 7;

    const buckets: Record<
      string,
      { date: string; changes: number; checks: number }
    > = {};

    for (let i = days - 1; i >= 0; i--) {
      const d = format(subDays(new Date(), i), "MMM d");

      buckets[d] = {
        date: d,
        changes: 0,
        checks: 0,
      };
    }

    safeChecks.forEach((c: any) => {
      if (!c?.checkedAt) return;

      const d = format(parseISO(c.checkedAt), "MMM d");

      if (buckets[d]) {
        buckets[d].checks += 1;

        if (c.hasChanges) {
          buckets[d].changes += 1;
        }
      }
    });

    return Object.values(buckets);
  }, [safeChecks]);

  const pieData = useMemo(() => {
    if (!summary?.changesByType) return [];

    return [
      {
        name: "Pricing",
        value: summary.changesByType.pricing || 0,
      },
      {
        name: "Features",
        value: summary.changesByType.features || 0,
      },
      {
        name: "Blog",
        value: summary.changesByType.blog || 0,
      },
      {
        name: "Jobs",
        value: summary.changesByType.jobs || 0,
      },
    ].filter((d) => d.value > 0);
  }, [summary]);

  const changeTypeLabel: Record<
    string,
    { label: string; color: string }
  > = {
    pricing: {
      label: "Pricing",
      color: "text-amber-400",
    },

    features: {
      label: "Features",
      color: "text-sky-400",
    },

    blog: {
      label: "Blog",
      color: "text-emerald-400",
    },

    jobs: {
      label: "Jobs",
      color: "text-purple-400",
    },
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1
            className="text-3xl font-bold tracking-tight text-foreground"
            data-testid="page-title"
          >
            Command Center
          </h1>

          <p className="text-muted-foreground mt-1">
            System overview and real-time intelligence.
          </p>
        </div>

        <div className="flex gap-2">
          <Link href="/ai-insights">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-primary/30 text-primary hover:bg-primary/10"
            >
              <Brain className="h-4 w-4" />
              AI Insights
            </Button>
          </Link>

          <Link href="/alerts">
            <Button variant="outline" size="sm" className="gap-2">
              <Bell className="h-4 w-4" />
              Alerts
            </Button>
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      {loadingSummary ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
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
            value={
              summary.lastDigestSentAt
                ? format(parseISO(summary.lastDigestSentAt), "HH:mm")
                : "None"
            }
            sub={
              summary.lastDigestSentAt
                ? format(parseISO(summary.lastDigestSentAt), "MMM d, yyyy")
                : "No digests sent"
            }
            icon={CheckCircle2}
            accent="text-emerald-400"
          />
        </div>
      ) : null}

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border/40 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Activity Trend
            </CardTitle>

            <CardDescription>
              Changes and checks detected over the last 7 days
            </CardDescription>
          </CardHeader>

          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart
                data={trendData}
                margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
              >
                <defs>
                  <linearGradient id="gChanges" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="#0ea5e9"
                      stopOpacity={0.3}
                    />

                    <stop
                      offset="95%"
                      stopColor="#0ea5e9"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1e293b"
                />

                <XAxis
                  dataKey="date"
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip />

                <Area
                  type="monotone"
                  dataKey="changes"
                  stroke="#0ea5e9"
                  fill="url(#gChanges)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card className="border-border/40 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Change Breakdown
            </CardTitle>

            <CardDescription>
              Distribution by category
            </CardDescription>
          </CardHeader>

          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
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
                      <Cell
                        key={index}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>

                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[180px] text-muted-foreground">
                No data
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}