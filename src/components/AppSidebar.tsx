import { Link } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Calculator, DollarSign, Percent, Home, User, List, FileText } from "lucide-react";

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
  return (
    <Sidebar>
      <SidebarContent>
        <div className="p-4">
          <h1 className="text-2xl font-bold text-verizon-red">Verizon</h1>
          <p className="text-sm text-gray-500">Employee Portal</p>
        </div>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
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
  );
}
