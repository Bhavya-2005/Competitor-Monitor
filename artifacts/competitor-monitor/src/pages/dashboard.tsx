import { useGetDashboardSummary, useListActivity } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { 
  Target, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight,
  TrendingUp
} from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary();
  const { data: activity, isLoading: loadingActivity } = useListActivity({ limit: 10 });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground" data-testid="page-title">Command Center</h1>
        <p className="text-muted-foreground mt-2">System overview and recent intelligence.</p>
      </div>

      {loadingSummary ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : summary ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-card/50 backdrop-blur border-border/40 hover:border-primary/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Targets</CardTitle>
              <Target className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">{summary.activeCompetitors} <span className="text-sm text-muted-foreground font-sans">/ {summary.totalCompetitors}</span></div>
              <p className="text-xs text-muted-foreground mt-1">Competitors monitored</p>
            </CardContent>
          </Card>
          
          <Card className="bg-card/50 backdrop-blur border-border/40 hover:border-primary/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Checks Today</CardTitle>
              <Activity className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">{summary.checksToday}</div>
              <p className="text-xs text-muted-foreground mt-1">Across all targets</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur border-border/40 hover:border-primary/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Changes Detected</CardTitle>
              <AlertTriangle className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">{summary.changesThisWeek}</div>
              <p className="text-xs text-muted-foreground mt-1">In the last 7 days</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur border-border/40 hover:border-primary/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Last Digest</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono text-lg">
                {summary.lastDigestSentAt ? format(parseISO(summary.lastDigestSentAt), 'HH:mm') : 'None'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {summary.lastDigestSentAt ? format(parseISO(summary.lastDigestSentAt), 'MMM d, yyyy') : 'No digests sent'}
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-2 md:col-span-1 border-border/40 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle>Recent Intelligence</CardTitle>
            <CardDescription>Latest changes detected across monitored sites.</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingActivity ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : activity && activity.length > 0 ? (
              <div className="space-y-6">
                {activity.map((item) => (
                  <div key={item.id} className="flex gap-4 group">
                    <div className="flex-none mt-1">
                      <div className="h-2 w-2 rounded-full bg-primary ring-4 ring-primary/20" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground">
                          <span className="text-primary">{item.competitorName}</span> updated {item.changeType}
                        </p>
                        <span className="text-xs text-muted-foreground font-mono">
                          {format(parseISO(item.detectedAt), 'MMM d, HH:mm')}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {item.summary}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="h-8 w-8 mx-auto mb-3 opacity-20" />
                <p>No changes detected yet.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-2 md:col-span-1 border-border/40 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle>Change Distribution</CardTitle>
            <CardDescription>Breakdown of changes by category.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col justify-center min-h-[300px]">
             {summary?.changesByType ? (
               <div className="space-y-6">
                 {[
                   { label: 'Pricing', value: summary.changesByType.pricing || 0, color: 'bg-primary' },
                   { label: 'Features', value: summary.changesByType.features || 0, color: 'bg-chart-2' },
                   { label: 'Blog', value: summary.changesByType.blog || 0, color: 'bg-chart-3' },
                   { label: 'Jobs', value: summary.changesByType.jobs || 0, color: 'bg-chart-4' },
                 ].map((stat) => (
                   <div key={stat.label} className="space-y-2">
                     <div className="flex items-center justify-between text-sm">
                       <span className="font-medium">{stat.label}</span>
                       <span className="font-mono text-muted-foreground">{stat.value}</span>
                     </div>
                     <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                       <div 
                         className={`h-full ${stat.color}`} 
                         style={{ width: `${Math.max(2, (stat.value / Math.max(1, summary.totalChanges)) * 100)}%` }}
                       />
                     </div>
                   </div>
                 ))}
               </div>
             ) : (
               <div className="text-center text-muted-foreground">No data available</div>
             )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
