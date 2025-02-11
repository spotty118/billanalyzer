import { AppSidebar } from "@/components/AppSidebar";
import { QuoteCalculator } from "@/components/QuoteCalculator";

export default function PlanQuotes() {
  return (
    <div className="flex h-screen">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <h1 className="text-3xl font-bold mb-6">Plan Quotes</h1>
        <QuoteCalculator />
      </main>
    </div>
  );
}
