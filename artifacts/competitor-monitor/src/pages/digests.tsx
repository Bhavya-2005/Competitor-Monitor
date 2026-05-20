import { useState } from "react";
import { format, parseISO } from "date-fns";
import { useListDigests, useSendDigest, getListDigestsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Mail,
  Send,
  CheckCircle2,
  XCircle,
  Slack,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Info,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type DigestStatus = "sent" | "failed" | "skipped";

const STATUS_CONFIG: Record<DigestStatus, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  sent: { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/20", label: "Delivered" },
  failed: { icon: XCircle, color: "text-red-400", bg: "bg-red-400/10 border-red-400/20", label: "Failed" },
  skipped: { icon: Clock, color: "text-muted-foreground", bg: "bg-muted/30 border-border/40", label: "Skipped" },
};

function getSeverity(changesFound: number): { label: string; color: string; bg: string } {
  if (changesFound === 0) return { label: "Quiet", color: "text-muted-foreground", bg: "bg-muted/30" };
  if (changesFound <= 2) return { label: "Low", color: "text-emerald-400", bg: "bg-emerald-400/10" };
  if (changesFound <= 5) return { label: "Medium", color: "text-amber-400", bg: "bg-amber-400/10" };
  return { label: "High", color: "text-red-400", bg: "bg-red-400/10" };
}

export default function Digests() {
  const { data: digests, isLoading } = useListDigests();
  const sendDigest = useSendDigest();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const handleSendDigest = () => {
    sendDigest.mutate(undefined, {
      onSuccess: () => {
        toast({ title: "Digest dispatched", description: "The daily intelligence report is on its way to Slack." });
        queryClient.invalidateQueries({ queryKey: getListDigestsQueryKey() });
      },
      onError: () => {
        toast({ title: "Transmission failed", variant: "destructive" });
      },
    });
  };

  const toggleExpanded = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const totalSent = (digests ?? []).filter((d) => d.status === "sent").length;
  const totalChanges = (digests ?? []).reduce((acc, d) => acc + d.changesFound, 0);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground" data-testid="page-title">
            Dispatches
          </h1>
          <p className="text-muted-foreground mt-1">Intelligence reports sent to Slack.</p>
        </div>
        <Button
          onClick={handleSendDigest}
          disabled={sendDigest.isPending}
          className="gap-2 bg-[#4A154B] hover:bg-[#4A154B]/90 text-white shadow-lg"
          data-testid="btn-trigger-digest"
        >
          {sendDigest.isPending ? <Clock className="h-4 w-4 animate-spin" /> : <Slack className="h-4 w-4" />}
          Force Dispatch Now
        </Button>
      </div>

      {/* Summary row */}
      {!isLoading && digests && digests.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Dispatched", value: totalSent, icon: Send, color: "text-primary" },
            { label: "Competitors Scanned", value: (digests[0]?.competitorsChecked ?? 0), icon: BarChart3, color: "text-sky-400" },
            { label: "Total Changes Logged", value: totalChanges, icon: TrendingUp, color: "text-amber-400" },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="border-border/40 bg-card/50 backdrop-blur">
              <CardContent className="pt-4 pb-4">
                <Icon className={`h-4 w-4 ${color} mb-2`} />
                <p className={`text-2xl font-black font-mono ${color}`}>{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
        </div>
      ) : !digests || digests.length === 0 ? (
        <div className="text-center py-20 bg-card/30 backdrop-blur rounded-2xl border border-dashed border-border/40">
          <Mail className="h-10 w-10 mx-auto mb-4 text-muted-foreground opacity-30" />
          <h3 className="text-lg font-medium text-foreground mb-1">No dispatches yet</h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            When the agent finds changes, it compiles them into a digest and dispatches to Slack.
          </p>
          <Button onClick={handleSendDigest} variant="outline" size="sm" className="mt-4 gap-2">
            <Send className="h-4 w-4" /> Send test dispatch
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {digests.map((digest) => {
            const status = digest.status as DigestStatus;
            const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.skipped;
            const severity = getSeverity(digest.changesFound);
            const isOpen = expanded.has(digest.id);

            return (
              <Card key={digest.id} className={`border ${cfg.bg} bg-card/50 backdrop-blur overflow-hidden transition-all`}>
                {/* Header row */}
                <CardHeader className="p-0">
                  <div className="flex items-center justify-between px-5 py-4 gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-lg ${cfg.bg} border flex items-center justify-center flex-none`}>
                        <cfg.icon className={`h-4 w-4 ${cfg.color}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-mono font-medium text-foreground text-sm">
                          {format(parseISO(digest.sentAt), "EEEE, MMM d, yyyy")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(digest.sentAt), "HH:mm 'UTC'")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-none">
                      <Badge variant="outline" className={`text-xs ${severity.color} ${severity.bg} border-current/20`}>
                        {severity.label} activity
                      </Badge>
                      <Badge variant={status === "sent" ? "default" : "secondary"} className="capitalize text-xs">
                        {cfg.label}
                      </Badge>
                      {digest.content && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpanded(digest.id)}
                          className="h-7 gap-1 text-xs text-muted-foreground"
                        >
                          {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                          {isOpen ? "Collapse" : "Expand"}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>

                {/* Stats */}
                <CardContent className="px-5 pb-4 pt-0 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-background rounded-lg p-3 border border-border/40">
                      <p className="text-xs text-muted-foreground mb-0.5">Targets Scanned</p>
                      <p className="text-xl font-bold font-mono">{digest.competitorsChecked}</p>
                    </div>
                    <div className="bg-background rounded-lg p-3 border border-border/40">
                      <p className="text-xs text-muted-foreground mb-0.5">Changes Found</p>
                      <p className={`text-xl font-bold font-mono ${digest.changesFound > 0 ? "text-primary" : "text-muted-foreground"}`}>
                        {digest.changesFound}
                      </p>
                    </div>
                  </div>

                  {/* AI recommendation inline */}
                  {digest.changesFound > 0 && (
                    <div className="flex items-start gap-2 bg-primary/5 border border-primary/10 rounded-lg p-3">
                      <Info className="h-4 w-4 text-primary flex-none mt-0.5" />
                      <p className="text-xs text-muted-foreground">
                        {digest.changesFound === 1
                          ? "1 change detected — review and respond quickly to stay competitive."
                          : `${digest.changesFound} changes detected — high competitor activity. Consider scheduling a strategy review.`}
                      </p>
                    </div>
                  )}

                  {/* Expandable content */}
                  {digest.content && (
                    <div className={cn("overflow-hidden transition-all duration-300", isOpen ? "max-h-[600px]" : "max-h-0")}>
                      <div>
                        <h4 className="text-xs font-medium mb-2 text-muted-foreground flex items-center gap-2">
                          <Slack className="h-3.5 w-3.5" /> Slack Message Payload
                        </h4>
                        <div className="bg-background rounded-lg p-4 border border-border/40 font-mono text-xs whitespace-pre-wrap overflow-x-auto text-muted-foreground leading-relaxed max-h-80 overflow-y-auto">
                          {digest.content}
                        </div>
                      </div>
                    </div>
                  )}

                  {status === "skipped" && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                      Configure a Slack webhook in Settings to enable delivery.
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
