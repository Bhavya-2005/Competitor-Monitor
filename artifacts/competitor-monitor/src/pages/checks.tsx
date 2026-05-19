import { useState } from "react";
import { format, parseISO } from "date-fns";
import { useListChecks } from "@workspace/api-client-react";
import { Link } from "wouter";
import { 
  Activity, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  RefreshCw,
  ExternalLink,
  Target
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Checks() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  
  const { data: checks, isLoading } = useListChecks({ limit: 100 });

  const filteredChecks = checks?.filter(c => {
    const matchesSearch = c.competitorName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (c.summary?.toLowerCase() || "").includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || 
                        (filterType === "changes" && c.hasChanges) || 
                        (filterType === c.changeType);
    return matchesSearch && matchesType;
  }) || [];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground" data-testid="page-title">Global Activity</h1>
          <p className="text-muted-foreground mt-2">All surveillance scans across the network.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search activity..." 
            className="pl-9 h-10 bg-card/50 backdrop-blur"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px] h-10 bg-card/50">
            <SelectValue placeholder="Filter by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Scans</SelectItem>
            <SelectItem value="changes">Changes Only</SelectItem>
            <SelectItem value="pricing">Pricing Changes</SelectItem>
            <SelectItem value="features">Feature Changes</SelectItem>
            <SelectItem value="blog">Blog Posts</SelectItem>
            <SelectItem value="jobs">Job Listings</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredChecks.length === 0 ? (
        <div className="text-center py-20 bg-card/30 backdrop-blur rounded-xl border border-border/40 border-dashed">
          <Activity className="h-10 w-10 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-medium text-foreground mb-1">No activity found</h3>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Adjust your filters or wait for the next scan cycle.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredChecks.map((check) => (
            <Card key={check.id} className="border-border/40 bg-card/50 backdrop-blur hover:bg-card/80 transition-colors">
              <CardContent className="p-5 flex flex-col md:flex-row gap-4 items-start md:items-center">
                <div className="flex items-center gap-3 w-48 shrink-0">
                  {check.status === 'completed' && <CheckCircle2 className={`h-5 w-5 ${check.hasChanges ? 'text-primary' : 'text-muted-foreground'}`} />}
                  {check.status === 'failed' && <XCircle className="h-5 w-5 text-destructive" />}
                  {check.status === 'running' && <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />}
                  {check.status === 'pending' && <Clock className="h-5 w-5 text-muted-foreground" />}
                  <div>
                    <div className="font-mono text-xs text-muted-foreground">
                      {format(parseISO(check.checkedAt), 'MMM d, HH:mm')}
                    </div>
                    <Link href={`/competitors/${check.competitorId}`} className="font-semibold hover:text-primary transition-colors flex items-center gap-1">
                      {check.competitorName}
                    </Link>
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  {check.hasChanges ? (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-[10px] capitalize bg-primary/10 text-primary border-primary/20">
                          {check.changeType}
                        </Badge>
                        <span className="font-medium truncate">{check.summary}</span>
                      </div>
                      {check.details && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{check.details}</p>
                      )}
                    </div>
                  ) : check.status === 'failed' ? (
                    <span className="text-sm text-destructive">{check.errorMessage}</span>
                  ) : (
                    <span className="text-sm text-muted-foreground italic">No changes detected during this cycle.</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
