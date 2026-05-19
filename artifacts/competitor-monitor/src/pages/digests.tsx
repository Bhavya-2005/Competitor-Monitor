import { format, parseISO } from "date-fns";
import { useListDigests, useSendDigest, getListDigestsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Mail, Send, CheckCircle2, XCircle, Slack, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function Digests() {
  const { data: digests, isLoading } = useListDigests();
  const sendDigest = useSendDigest();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleSendDigest = () => {
    sendDigest.mutate(
      {},
      {
        onSuccess: () => {
          toast({ title: "Digest dispatched", description: "The daily intelligence report is on its way to Slack." });
          queryClient.invalidateQueries({ queryKey: getListDigestsQueryKey() });
        },
        onError: () => {
          toast({ title: "Transmission failed", variant: "destructive" });
        }
      }
    );
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground" data-testid="page-title">Dispatches</h1>
          <p className="text-muted-foreground mt-2">Log of intelligence reports sent to Slack.</p>
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

      {isLoading ? (
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-xl" />
          ))}
        </div>
      ) : !digests || digests.length === 0 ? (
        <div className="text-center py-20 bg-card/30 backdrop-blur rounded-xl border border-border/40 border-dashed">
          <Mail className="h-10 w-10 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-medium text-foreground mb-1">No dispatches sent</h3>
          <p className="text-muted-foreground max-w-sm mx-auto">
            When the agent finds changes, it compiles them into a digest and sends them here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {digests.map((digest) => (
            <Card key={digest.id} className="border-border/40 bg-card/50 backdrop-blur overflow-hidden">
              <div className="bg-muted/50 px-6 py-3 border-b border-border/40 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  {digest.status === 'sent' && <CheckCircle2 className="h-5 w-5 text-primary" />}
                  {digest.status === 'failed' && <XCircle className="h-5 w-5 text-destructive" />}
                  {digest.status === 'skipped' && <Clock className="h-5 w-5 text-muted-foreground" />}
                  <span className="font-mono font-medium">{format(parseISO(digest.sentAt), 'MMM d, yyyy - HH:mm')}</span>
                </div>
                <Badge variant={digest.status === 'sent' ? 'default' : 'secondary'} className="capitalize">
                  {digest.status}
                </Badge>
              </div>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-background rounded-lg p-4 border border-border/40">
                    <p className="text-sm text-muted-foreground mb-1">Targets Scanned</p>
                    <p className="text-2xl font-bold font-mono">{digest.competitorsChecked}</p>
                  </div>
                  <div className="bg-background rounded-lg p-4 border border-border/40">
                    <p className="text-sm text-muted-foreground mb-1">Changes Found</p>
                    <p className="text-2xl font-bold font-mono text-primary">{digest.changesFound}</p>
                  </div>
                </div>
                
                {digest.content && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 text-muted-foreground flex items-center gap-2">
                      <Slack className="h-4 w-4" /> Message Payload
                    </h4>
                    <div className="bg-background rounded-lg p-4 border border-border/40 font-mono text-xs whitespace-pre-wrap overflow-x-auto text-muted-foreground">
                      {digest.content}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
