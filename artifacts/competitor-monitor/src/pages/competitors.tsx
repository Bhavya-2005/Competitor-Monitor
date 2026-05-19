import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link } from "wouter";
import { format, parseISO } from "date-fns";
import { 
  useListCompetitors, 
  useCreateCompetitor, 
  useUpdateCompetitor, 
  useDeleteCompetitor,
  getListCompetitorsQueryKey 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  Plus, 
  MoreHorizontal, 
  Trash2, 
  Edit, 
  ExternalLink,
  Target,
  Search,
  CheckCircle2,
  XCircle,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const competitorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  url: z.string().url("Must be a valid URL"),
  description: z.string().optional(),
  monitorPricing: z.boolean().default(true),
  monitorFeatures: z.boolean().default(true),
  monitorBlog: z.boolean().default(true),
  monitorJobs: z.boolean().default(true),
});

type CompetitorFormValues = z.infer<typeof competitorSchema>;

export default function Competitors() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  
  const { data: competitors, isLoading } = useListCompetitors();
  const createCompetitor = useCreateCompetitor();
  const updateCompetitor = useUpdateCompetitor();
  const deleteCompetitor = useDeleteCompetitor();
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<CompetitorFormValues>({
    resolver: zodResolver(competitorSchema),
    defaultValues: {
      name: "",
      url: "",
      description: "",
      monitorPricing: true,
      monitorFeatures: true,
      monitorBlog: true,
      monitorJobs: true,
    },
  });

  const onSubmit = (values: CompetitorFormValues) => {
    if (editingId) {
      updateCompetitor.mutate(
        { id: editingId, data: values },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListCompetitorsQueryKey() });
            setIsCreateOpen(false);
            setEditingId(null);
            toast({ title: "Target updated" });
          },
          onError: () => {
            toast({ title: "Failed to update target", variant: "destructive" });
          }
        }
      );
    } else {
      createCompetitor.mutate(
        { data: values },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListCompetitorsQueryKey() });
            setIsCreateOpen(false);
            form.reset();
            toast({ title: "Target added" });
          },
          onError: () => {
            toast({ title: "Failed to add target", variant: "destructive" });
          }
        }
      );
    }
  };

  const handleEdit = (competitor: any) => {
    form.reset({
      name: competitor.name,
      url: competitor.url,
      description: competitor.description || "",
      monitorPricing: competitor.monitorPricing,
      monitorFeatures: competitor.monitorFeatures,
      monitorBlog: competitor.monitorBlog,
      monitorJobs: competitor.monitorJobs,
    });
    setEditingId(competitor.id);
    setIsCreateOpen(true);
  };

  const handleOpenCreate = (open: boolean) => {
    if (open) {
      form.reset({
        name: "",
        url: "",
        description: "",
        monitorPricing: true,
        monitorFeatures: true,
        monitorBlog: true,
        monitorJobs: true,
      });
      setEditingId(null);
    }
    setIsCreateOpen(open);
  };

  const handleDelete = () => {
    if (!deletingId) return;
    deleteCompetitor.mutate(
      { id: deletingId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListCompetitorsQueryKey() });
          setDeletingId(null);
          toast({ title: "Target removed" });
        },
        onError: () => {
          toast({ title: "Failed to remove target", variant: "destructive" });
        }
      }
    );
  };

  const toggleStatus = (id: number, currentStatus: boolean) => {
    updateCompetitor.mutate(
      { id, data: { isActive: !currentStatus } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListCompetitorsQueryKey() });
          toast({ title: currentStatus ? "Monitoring paused" : "Monitoring resumed" });
        }
      }
    );
  };

  const filteredCompetitors = competitors?.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.url.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground" data-testid="page-title">Targets</h1>
          <p className="text-muted-foreground mt-2">Manage competitors being monitored by Overwatch.</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={handleOpenCreate}>
          <DialogTrigger asChild>
            <Button data-testid="btn-add-target" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Target
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Target" : "Add Target"}</DialogTitle>
              <DialogDescription>
                Configure tracking for a competitor's web properties.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Acme Corp" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Brief note about this competitor..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="space-y-4 pt-4 border-t border-border/40">
                  <h4 className="text-sm font-medium">Monitoring Categories</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="monitorPricing"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border/40 p-3">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Pricing</FormLabel>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="monitorFeatures"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border/40 p-3">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Features</FormLabel>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="monitorBlog"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border/40 p-3">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Blog</FormLabel>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="monitorJobs"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border/40 p-3">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Jobs</FormLabel>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <DialogFooter className="pt-4">
                  <Button type="submit" disabled={createCompetitor.isPending || updateCompetitor.isPending}>
                    {editingId ? "Save Changes" : "Add Target"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search targets..." 
            className="pl-9 bg-card/50 backdrop-blur"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : filteredCompetitors.length === 0 ? (
        <div className="text-center py-20 bg-card/30 backdrop-blur rounded-xl border border-border/40 border-dashed">
          <Target className="h-10 w-10 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-medium text-foreground mb-1">No targets found</h3>
          <p className="text-muted-foreground max-w-sm mx-auto">
            {searchQuery ? "No targets match your search criteria." : "Start monitoring your competitors by adding a new target."}
          </p>
          {!searchQuery && (
            <Button variant="outline" className="mt-6" onClick={() => handleOpenCreate(true)}>
              Add First Target
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCompetitors.map((competitor) => (
            <div 
              key={competitor.id} 
              className={`group relative flex flex-col justify-between rounded-xl border border-border/40 bg-card/50 backdrop-blur p-5 transition-all hover:border-primary/50 ${!competitor.isActive && "opacity-60 grayscale-[0.5]"}`}
              data-testid={`card-competitor-${competitor.id}`}
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {competitor.faviconUrl ? (
                      <img src={competitor.faviconUrl} alt="" className="h-8 w-8 rounded bg-background p-1" />
                    ) : (
                      <div className="h-8 w-8 rounded bg-secondary flex items-center justify-center text-secondary-foreground font-bold">
                        {competitor.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <Link href={`/competitors/${competitor.id}`} className="font-semibold text-lg hover:text-primary transition-colors">
                        {competitor.name}
                      </Link>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <a href={competitor.url} target="_blank" rel="noopener noreferrer" className="hover:text-foreground hover:underline flex items-center gap-1">
                          {new URL(competitor.url).hostname}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link href={`/competitors/${competitor.id}`}>View Details</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEdit(competitor)}>
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleStatus(competitor.id, competitor.isActive)}>
                        {competitor.isActive ? (
                          <><XCircle className="mr-2 h-4 w-4" /> Pause Monitoring</>
                        ) : (
                          <><CheckCircle2 className="mr-2 h-4 w-4" /> Resume Monitoring</>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-destructive focus:text-destructive" 
                        onClick={() => setDeletingId(competitor.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                {competitor.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {competitor.description}
                  </p>
                )}
                
                <div className="flex flex-wrap gap-1 mb-4">
                  {competitor.monitorPricing && <Badge variant="secondary" className="text-[10px]">Pricing</Badge>}
                  {competitor.monitorFeatures && <Badge variant="secondary" className="text-[10px]">Features</Badge>}
                  {competitor.monitorBlog && <Badge variant="secondary" className="text-[10px]">Blog</Badge>}
                  {competitor.monitorJobs && <Badge variant="secondary" className="text-[10px]">Jobs</Badge>}
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-border/40 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {competitor.lastCheckedAt 
                    ? format(parseISO(competitor.lastCheckedAt), 'MMM d, HH:mm') 
                    : 'Never checked'}
                </div>
                <div className="font-mono">
                  {competitor.changesCount || 0} changes
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Target</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this target? All historical data and checks will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeletingId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteCompetitor.isPending}>
              {deleteCompetitor.isPending ? "Deleting..." : "Delete Target"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
