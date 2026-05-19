import { Link, useLocation } from "wouter";
import { 
  Radar, 
  Target, 
  Activity, 
  Mail, 
  Settings as SettingsIcon,
  ChevronRight
} from "lucide-react";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem, 
  SidebarProvider 
} from "@/components/ui/sidebar";

const NAV_ITEMS = [
  { title: "Dashboard", href: "/", icon: Radar },
  { title: "Competitors", href: "/competitors", icon: Target },
  { title: "All Checks", href: "/checks", icon: Activity },
  { title: "Digests", href: "/digests", icon: Mail },
  { title: "Settings", href: "/settings", icon: SettingsIcon },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

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
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent className="pt-4">
                <SidebarMenu>
                  {NAV_ITEMS.map((item) => {
                    const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton asChild isActive={isActive} className="group transition-all">
                          <Link href={item.href} data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}>
                            <item.icon className={`h-4 w-4 mr-2 ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
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
          </SidebarContent>
        </Sidebar>
        
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
