
import { cn } from "@/lib/utils";
import { useSidebar } from "@/contexts/SidebarContext";

interface MainContentProps {
  children: React.ReactNode;
  className?: string;
}

export function MainContent({ children, className }: MainContentProps) {
  const { isCollapsed } = useSidebar();
  
  return (
    <main className={cn(
      "flex-1 overflow-auto transition-all duration-300", 
      isCollapsed ? "ml-20" : "ml-0",
      className
    )}>
      <div className="container mx-auto py-6 px-4 md:p-6 space-y-8">
        {children}
      </div>
    </main>
  );
}
