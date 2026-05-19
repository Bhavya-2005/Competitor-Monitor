import { useParams, Link } from "wouter";
import { format, parseISO } from "date-fns";
import { 
  useGetCompetitor, 
  useListCompetitorChecks, 
  useRunCheck,
  getGetCompetitorQueryKey,
  getListCompetitorChecksQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  ArrowLeft,
  ExternalLink,
  Play,
  Activity,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  Body,
  Cell,
  Head,
  Header,
  Row,
} from "@/components/ui/table"; // Assuming standard table components if any, wait, using basic HTML table with tailwind is safer.

export default function CompetitorDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  
  const { data: competitor, isLoading: loadingCompetitor } = useGetCompetitor(id, { 
    query: { enabled: !!id, queryKey: getGetCompetitorQueryKey(id) } 
  });
  
  const { data: checks, isLoading: loadingChecks } = useListCompetitorChecks(id, {
    query: { enabled: !!id, queryKey: getListCompetitorChecksQueryKey(id) }
  });
  
  const runCheck = useRunCheck();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleRunCheck = () => {
    runCheck.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: "Scan initiated", description: "Agent is now scanning the target." });
          // In a real app we'd poll or wait, here we just invalidate
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: getGetCompetitorQueryKey(id) });
            queryClient.invalidateQueries({ queryKey: getListCompetitorChecksQueryKey(id) });
          }, 3000);
        },
        onError: () => {
          toast({ title: "Failed to start scan", variant: "destructive" });
        }
      }
    );
  };

  if (loadingCompetitor) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in">
        <Skeleton className="h-8 w-32 mb-6" />
        <div className="flex gap-6">
          <Skeleton className="h-32 w-32 rounded-xl" />
          <div className="space-y-4 flex-1">
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-6 w-1/4" />
          </div>
        </div>
      </div>
    );
  }

  if (!competitor) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="text-center py-20">
          <AlertCircle className="h-10 w-10 mx-auto mb-4 text-destructive" />
          <h3 className="text-lg font-medium text-foreground">Target not found</h3>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/competitors">Return to Targets</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
        <Link href="/competitors" className="hover:text-foreground flex items-center gap-1 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Targets
        </Link>
        <span>/</span>
        <span className="text-foreground">{competitor.name}</span>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="flex items-start gap-6">
          {competitor.faviconUrl ? (
            <img src={competitor.faviconUrl} alt="" className="h-16 w-16 rounded-xl bg-background p-2 border border-border/40 shadow-sm" />
          ) : (
            <div className="h-16 w-16 rounded-xl bg-secondary flex items-center justify-center text-secondary-foreground font-bold text-2xl border border-border/40">
              {competitor.name.charAt(0)}
            </div>
          )}
          
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-foreground" data-testid="page-title">{competitor.name}</h1>
              {!competitor.isActive && <Badge variant="secondary">Paused</Badge>}
            </div>
            
            <a href={competitor.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary flex items-center gap-1 mt-1 transition-colors">
              {competitor.url}
              <ExternalLink className="h-3 w-3" />
            </a>
            
            {competitor.description && (
              <p className="text-sm mt-3 max-w-2xl">{competitor.description}</p>
            )}
          </div>
        </div>
        
        <div className="flex gap-3">
          <Button 
            onClick={handleRunCheck} 
            disabled={runCheck.isPending || !competitor.isActive}
            className="gap-2 shadow-primary/20 shadow-lg"
          >
            {runCheck.isPending ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Run Scan Now
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-card/50 backdrop-blur border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Scans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{competitor.checksCount || 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Changes Found</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-primary">{competitor.changesCount || 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Last Scan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold font-mono">
              {competitor.lastCheckedAt ? format(parseISO(competitor.lastCheckedAt), 'HH:mm') : '--'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {competitor.lastCheckedAt ? format(parseISO(competitor.lastCheckedAt), 'MMM d, yyyy') : 'Never'}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monitored Vectors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1 mt-1">
              {competitor.monitorPricing && <Badge variant="outline" className="text-[10px]">Pricing</Badge>}
              {competitor.monitorFeatures && <Badge variant="outline" className="text-[10px]">Features</Badge>}
              {competitor.monitorBlog && <Badge variant="outline" className="text-[10px]">Blog</Badge>}
              {competitor.monitorJobs && <Badge variant="outline" className="text-[10px]">Jobs</Badge>}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/40 bg-card/50 backdrop-blur overflow-hidden">
        <CardHeader>
          <CardTitle>Scan History</CardTitle>
          <CardDescription>Chronological log of AI agent check-ins.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loadingChecks ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !checks || checks.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Activity className="h-10 w-10 mx-auto mb-4 opacity-20" />
              <p>No scans recorded yet.</p>
              <Button variant="outline" className="mt-4" onClick={handleRunCheck} disabled={runCheck.isPending}>
                Initiate first scan
              </Button>
            </div>
          ) : (
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b bg-muted/50">
                  <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Time</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Vector</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Findings</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {checks.map((check) => (
                    <tr key={check.id} className="border-b border-border/40 transition-colors hover:bg-muted/20 data-[state=selected]:bg-muted group">
                      <td className="p-4 align-middle font-mono text-xs whitespace-nowrap">
                        {format(parseISO(check.checkedAt), 'MMM d, HH:mm')}
                      </td>
                      <td className="p-4 align-middle">
                        <div className="flex items-center gap-2">
                          {check.status === 'completed' && <CheckCircle2 className="h-4 w-4 text-primary" />}
                          {check.status === 'failed' && <XCircle className="h-4 w-4 text-destructive" />}
                          {check.status === 'running' && <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />}
                          {check.status === 'pending' && <Clock className="h-4 w-4 text-muted-foreground" />}
                          <span className="capitalize">{check.status}</span>
                        </div>
                      </td>
                      <td className="p-4 align-middle">
                        {check.changeType ? (
                          <Badge variant="outline" className="capitalize">{check.changeType}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-4 align-middle">
                        {check.hasChanges ? (
                          <div>
                            <p className="font-medium text-foreground">{check.summary}</p>
                            {check.details && (
                              <p className="text-muted-foreground text-xs line-clamp-1 mt-1 max-w-md group-hover:line-clamp-none transition-all">{check.details}</p>
                            )}
                          </div>
                        ) : check.status === 'completed' ? (
                          <span className="text-muted-foreground flex items-center gap-1"><Info className="h-3 w-3" /> No changes detected</span>
                        ) : check.status === 'failed' ? (
                          <span className="text-destructive text-xs">{check.errorMessage || "Unknown error"}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
