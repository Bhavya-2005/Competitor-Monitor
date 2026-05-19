import { Link, useLocation } from "wouter";
import { useClerk, useUser } from "@clerk/react";
import {
  Radar,
  Target,
  Activity,
  Mail,
  Settings as SettingsIcon,
  ChevronRight,
  LogOut,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
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

const NAV_ITEMS = [
  { title: "Dashboard", href: "/dashboard", icon: Radar },
  { title: "Competitors", href: "/competitors", icon: Target },
  { title: "All Checks", href: "/checks", icon: Activity },
  { title: "Digests", href: "/digests", icon: Mail },
  { title: "Settings", href: "/settings", icon: SettingsIcon },
];

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { signOut } = useClerk();
  const { user } = useUser();

  const initials = user?.firstName
    ? `${user.firstName[0]}${user.lastName?.[0] ?? ""}`.toUpperCase()
    : (user?.emailAddresses?.[0]?.emailAddress?.[0] ?? "U").toUpperCase();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background selection:bg-primary/30">
        <Sidebar className="border-r border-border/40">
          <div className="flex h-16 items-center px-6 border-b border-border/40">
            <div className="flex items-center gap-2 font-bold tracking-tight text-primary">
              <Radar className="h-5 w-5" />
              <span>OVERWATCH</span>
            </div>
          </div>
          <SidebarContent className="flex flex-col h-[calc(100%-4rem)]">
            <SidebarGroup className="flex-1">
              <SidebarGroupContent className="pt-4">
                <SidebarMenu>
                  {NAV_ITEMS.map((item) => {
                    const isActive =
                      location === item.href ||
                      (item.href !== "/dashboard" && location.startsWith(item.href));
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          className="group transition-all"
                        >
                          <Link
                            href={item.href}
                            data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                          >
                            <item.icon
                              className={`h-4 w-4 mr-2 ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`}
                            />
                            <span className="font-medium">{item.title}</span>
                            {isActive && (
                              <ChevronRight className="ml-auto h-4 w-4 text-primary" />
                            )}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* User section at bottom */}
            <div className="border-t border-border/40 p-3">
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
