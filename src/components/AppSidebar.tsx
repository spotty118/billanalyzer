import { Link, useLocation } from "react-router-dom";
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
import { Calculator, DollarSign, Percent, Home, User, List } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  {
    title: "Dashboard",
    icon: Home,
    url: "/",
  },
  {
    title: "Plan Quotes",
    icon: Calculator,
    url: "/quotes",
  },
  {
    title: "Commissions",
    icon: DollarSign,
    url: "/commissions",
  },
  {
    title: "Promotions",
    icon: Percent,
    url: "/promotions",
  },
  {
    title: "Admin Login",
    icon: User,
    url: "/admin-login",
  },
  {
    title: "Admin Dashboard",
    icon: List,
    url: "/admin-dashboard",
  },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Menu</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild
                      isActive={location.pathname === item.url}
                      tooltip={item.title}
                    >
                      <Link to={item.url} className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  );
}
