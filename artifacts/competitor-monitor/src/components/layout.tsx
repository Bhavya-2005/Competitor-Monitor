import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useClerk, useUser } from "@clerk/react";
import { useListChecks } from "@workspace/api-client-react";
import {
  Radar,
  Target,
  Activity,
  Mail,
  Settings as SettingsIcon,
  ChevronRight,
  LogOut,
  Brain,
  MessageSquare,
  GitCompare,
  Bell,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDistanceToNow, parseISO } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";

const CORE_NAV = [
  { title: "Dashboard", href: "/dashboard", icon: Radar },
  { title: "Competitors", href: "/competitors", icon: Target },
  { title: "All Checks", href: "/checks", icon: Activity },
  { title: "Digests", href: "/digests", icon: Mail },
];

const AI_NAV = [
  { title: "AI Insights", href: "/ai-insights", icon: Brain },
  { title: "AI Assistant", href: "/ai-chat", icon: MessageSquare },
  { title: "Service Compare", href: "/service-compare", icon: GitCompare },
];

const SYSTEM_NAV = [
  { title: "Alert Center", href: "/alerts", icon: Bell },
  { title: "Admin", href: "/admin", icon: ShieldCheck },
  { title: "Settings", href: "/settings", icon: SettingsIcon },
];

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function NavGroup({ label, items }: { label?: string; items: typeof CORE_NAV }) {
  const [location] = useLocation();
  return (
    <SidebarGroup className={label ? "pt-2" : ""}>
      {label && (
        <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/50 px-3 mb-1">
          {label}
        </SidebarGroupLabel>
      )}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const isActive =
              location === item.href ||
              (item.href !== "/dashboard" && location.startsWith(item.href));
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={isActive} className="group transition-all">
                  <Link href={item.href} data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}>
                    <item.icon
                      className={`h-4 w-4 mr-2 ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`}
                    />
                    <span className="font-medium">{item.title}</span>
                    {isActive && <ChevronRight className="ml-auto h-4 w-4 text-primary" />}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function NotificationBell() {
  const { data: checks } = useListChecks({ limit: 30 });
  const [open, setOpen] = useState(false);

  const alerts = (checks ?? []).filter((c) => c.hasChanges && c.status === "completed").slice(0, 10);
  const unread = alerts.length;

  const changeColors: Record<string, string> = {
    pricing: "text-amber-400",
    features: "text-sky-400",
    blog: "text-emerald-400",
    jobs: "text-purple-400",
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative flex items-center justify-center w-8 h-8 rounded-lg hover:bg-accent/50 transition-colors text-muted-foreground hover:text-foreground">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent side="right" align="end" className="w-80 p-0 bg-background border-border/60">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
          <p className="text-sm font-semibold text-foreground">Recent Alerts</p>
          {unread > 0 && (
            <Badge className="text-xs h-5">{unread} new</Badge>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {alerts.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No alerts yet. Run checks to monitor competitors.
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {alerts.map((a) => (
                <div key={a.id} className="px-4 py-3 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="text-sm font-medium text-foreground truncate">{a.competitorName}</span>
                    <span className={`text-xs font-medium capitalize flex-none ${changeColors[a.changeType ?? ""] ?? "text-muted-foreground"}`}>
                      {a.changeType}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">{a.summary}</p>
                  <p className="text-xs text-muted-foreground/60 mt-0.5">
                    {formatDistanceToNow(parseISO(a.checkedAt), { addSuffix: true })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        <div className="border-t border-border/40 p-2">
          <Link href="/alerts" onClick={() => setOpen(false)}>
            <button className="w-full text-xs text-primary hover:text-primary/80 py-1.5 transition-colors">
              View all alerts →
            </button>
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const { signOut } = useClerk();
  const { user } = useUser();

  const initials = user?.firstName
    ? `${user.firstName[0]}${user.lastName?.[0] ?? ""}`.toUpperCase()
    : (user?.emailAddresses?.[0]?.emailAddress?.[0] ?? "U").toUpperCase();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background selection:bg-primary/30">
        <Sidebar className="border-r border-border/40">
          {/* Logo */}
          <div className="flex h-16 items-center px-4 border-b border-border/40">
            <div className="flex items-center gap-2 font-bold tracking-tight text-primary">
              <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Radar className="h-4 w-4" />
              </div>
              <span className="text-sm">OVERWATCH</span>
            </div>
            <div className="ml-auto">
              <NotificationBell />
            </div>
          </div>

          <SidebarContent className="flex flex-col h-[calc(100%-4rem)] pt-2">
            <div className="flex-1 overflow-y-auto">
              <NavGroup items={CORE_NAV} />

              <div className="mx-3 my-2 border-t border-border/30" />

              <NavGroup label="AI Intelligence" items={AI_NAV} />

              <div className="mx-3 my-2 border-t border-border/30" />

              <NavGroup label="System" items={SYSTEM_NAV} />
            </div>

            {/* User section at bottom */}
            <div className="border-t border-border/40 p-3 flex-none">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-accent/50 transition-colors"
                    data-testid="user-menu-trigger"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.imageUrl} />
                      <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-xs font-medium text-foreground truncate">
                        {user?.firstName
                          ? `${user.firstName} ${user.lastName ?? ""}`.trim()
                          : user?.emailAddresses?.[0]?.emailAddress ?? "Account"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user?.emailAddresses?.[0]?.emailAddress ?? ""}
                      </p>
                    </div>
                    <Sparkles className="h-3.5 w-3.5 text-muted-foreground/50 flex-none" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" side="top" className="w-48">
                  <DropdownMenuItem
                    onClick={() => signOut({ redirectUrl: basePath || "/" })}
                    className="text-red-400 focus:text-red-400 cursor-pointer"
                    data-testid="sign-out-button"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </SidebarContent>
        </Sidebar>

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="flex-1 overflow-auto">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
}
