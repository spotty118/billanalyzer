import { AppSidebar } from "@/components/AppSidebar";
import { QuoteCalculator } from "@/components/QuoteCalculator";
import { CommissionCalculator } from "@/components/CommissionCalculator";
import { PromotionsOverview } from "@/components/PromotionsOverview";
import { NumberLookup } from "@/components/NumberLookup";
import { BillAnalyzer } from "@/components/BillAnalyzer";

const Index = () => {
  return (
    <div className="min-h-screen flex w-full">
      <AppSidebar />
      <main className="flex-1 p-6 bg-gray-50">
        <h1 className="text-3xl font-bold mb-6">Welcome, Employee</h1>
        <div className="w-full max-w-2xl mx-auto">
          <QuoteCalculator />
        </div>
      </main>
    </div>
  );
};

export default Index;
