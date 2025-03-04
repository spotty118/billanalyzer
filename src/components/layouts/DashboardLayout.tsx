
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function DashboardLayout({ children, className }: DashboardLayoutProps) {
  return (
    <div className={cn("min-h-screen bg-background", className)}>
      <div className={cn("flex min-h-screen")}>
        {children}
      </div>
    </div>
  );
}
