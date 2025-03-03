
import { cn } from "@/lib/utils";
import { useSidebar } from "@/contexts/SidebarContext";

interface DashboardLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function DashboardLayout({ children, className }: DashboardLayoutProps) {
  const { isCollapsed } = useSidebar();
  
  return (
    <div className={cn("min-h-screen bg-background", className)}>
      <div className={cn(
        "flex min-h-screen transition-all duration-300",
        isCollapsed ? "sidebar-collapsed" : "sidebar-expanded"
      )}>
        {children}
      </div>
    </div>
  );
}
