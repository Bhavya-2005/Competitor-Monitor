import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useListChecks, useGetDashboardSummary } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from "date-fns";
import {
  ShieldCheck,
  Users,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Crown,
  UserIcon,
  BarChart3,
  Database,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: number;
  clerkId: string;
  email: string;
  displayName: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export default function Admin() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: users, isLoading: loadingUsers } = useQuery<User[]>({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users`);
      if (!res.ok) throw new Error("Unauthorized");
      return res.json();
    },
  });

  const { data: checks, isLoading: loadingChecks } = useListChecks({ limit: 50 });
  const { data: summary } = useGetDashboardSummary();

  const changeRole = useMutation({
    mutationFn: async ({ id, role }: { id: number; role: string }) => {
      const res = await fetch(`/api/users/${id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      toast({ title: "Role updated" });
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: () => toast({ title: "Failed to update role", variant: "destructive" }),
  });

  const statusCfg = {
    completed: { icon: CheckCircle2, color: "text-emerald-400" },
    failed: { icon: XCircle, color: "text-red-400" },
    running: { icon: Activity, color: "text-sky-400 animate-pulse" },
    pending: { icon: Clock, color: "text-muted-foreground" },
  };

  const totalChecks = checks?.length ?? 0;
  const failedChecks = checks?.filter((c) => c.status === "failed").length ?? 0;
  const successRate = totalChecks > 0 ? Math.round(((totalChecks - failedChecks) / totalChecks) * 100) : 100;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <ShieldCheck className="h-8 w-8 text-primary" />
          Admin Panel
        </h1>
        <p className="text-muted-foreground mt-2">System overview, user management, and job monitoring.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Total Users",
            value: users?.length ?? "—",
            icon: Users,
            color: "text-primary",
          },
          {
            label: "Total Checks",
            value: summary?.totalChecks ?? "—",
            icon: Activity,
            color: "text-sky-400",
          },
          {
            label: "Success Rate",
            value: `${successRate}%`,
            icon: TrendingUp,
            color: "text-emerald-400",
          },
          {
            label: "Active Competitors",
            value: summary?.activeCompetitors ?? "—",
            icon: Database,
            color: "text-amber-400",
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="border-border/40 bg-card/50 backdrop-blur">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between mb-2">
                <Icon className={`h-4 w-4 ${color}`} />
                <span className={`text-2xl font-black font-mono ${color}`}>{value}</span>
              </div>
              <p className="text-xs text-muted-foreground font-medium">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User management */}
        <Card className="border-border/40 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" /> User Management
            </CardTitle>
            <CardDescription>Manage roles and access for all registered users.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loadingUsers ? (
              <div className="p-4 space-y-3">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
              </div>
            ) : !users || users.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                No users found. Access requires admin role.
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-none">
                      {user.role === "admin" ? (
                        <Crown className="h-4 w-4 text-primary" />
                      ) : (
                        <UserIcon className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {user.displayName ?? user.email}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-none">
                      <Badge
                        variant={user.role === "admin" ? "default" : "secondary"}
                        className="capitalize text-xs"
                      >
                        {user.role}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() =>
                          changeRole.mutate({ id: user.id, role: user.role === "admin" ? "user" : "admin" })
                        }
                      >
                        {user.role === "admin" ? "Demote" : "Promote"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Scraping jobs log */}
        <Card className="border-border/40 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" /> Scraping Job Log
            </CardTitle>
            <CardDescription>Most recent 50 competitor check runs.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loadingChecks ? (
              <div className="p-4 space-y-2">
                {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-10 rounded" />)}
              </div>
            ) : (
              <div className="divide-y divide-border/20 max-h-[420px] overflow-y-auto">
                {(checks ?? []).map((check) => {
                  const cfg = statusCfg[check.status as keyof typeof statusCfg] ?? statusCfg.pending;
                  return (
                    <div key={check.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/20 transition-colors">
                      <cfg.icon className={`h-4 w-4 flex-none ${cfg.color}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{check.competitorName}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {check.hasChanges ? (
                            <span className="text-primary">↑ {check.changeType} change detected</span>
                          ) : (
                            "No changes"
                          )}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground font-mono flex-none">
                        {format(parseISO(check.checkedAt), "MM/dd HH:mm")}
                      </span>
                      {check.errorMessage && (
                        <AlertTriangle className="h-3 w-3 text-red-400 flex-none" />
                      )}
                    </div>
                  );
                })}
                {(!checks || checks.length === 0) && (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    No checks run yet.
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* API usage analytics */}
      <Card className="border-border/40 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" /> API Usage Analytics
          </CardTitle>
          <CardDescription>Check volume and change detection metrics.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Checks Today", value: summary?.checksToday ?? 0, icon: Activity, color: "text-sky-400" },
              { label: "Changes This Week", value: summary?.changesThisWeek ?? 0, icon: TrendingUp, color: "text-amber-400" },
              { label: "Total Changes", value: summary?.totalChanges ?? 0, icon: AlertTriangle, color: "text-orange-400" },
              { label: "Digests This Month", value: summary?.digestsThisMonth ?? 0, icon: CheckCircle2, color: "text-emerald-400" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-background rounded-xl p-4 border border-border/40 text-center">
                <Icon className={`h-5 w-5 ${color} mx-auto mb-2`} />
                <p className={`text-2xl font-black font-mono ${color}`}>{value}</p>
                <p className="text-xs text-muted-foreground mt-1">{label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
