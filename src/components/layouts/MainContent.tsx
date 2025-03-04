
import { cn } from "@/lib/utils";

interface MainContentProps {
  children: React.ReactNode;
  className?: string;
}

export function MainContent({ children, className }: MainContentProps) {
  return (
    <main className={cn(
      "flex-1 overflow-auto w-full",
      className
    )}>
      <div className="container mx-auto py-6 px-4 md:p-6 space-y-8">
        {children}
      </div>
    </main>
  );
}
