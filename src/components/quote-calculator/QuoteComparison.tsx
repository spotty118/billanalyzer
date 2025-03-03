
import { Button } from "@/components/ui/button";
import { ArrowLeftRight } from "lucide-react";
import { useState } from "react";
import { PlanComparison } from "./PlanComparison";
import { Plan } from "@/types";

interface QuoteComparisonProps {
  hasQuoteData: boolean;
  verizonPlans: Array<{
    plan: string;
    planObject?: Plan;
    price: number;
    perks?: string[];
  }>;
  totalVerizonPrice: number;
  streamingCost: number;
}

export function QuoteComparison({
  hasQuoteData,
  verizonPlans,
  totalVerizonPrice,
  streamingCost
}: QuoteComparisonProps) {
  const [showComparison, setShowComparison] = useState(false);

  if (!hasQuoteData) return null;

  return (
    <>
      <Button 
        variant="outline" 
        className="w-full mt-6 border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-800 py-6 rounded-lg shadow-sm transition-all duration-300"
        onClick={() => setShowComparison(!showComparison)}
      >
        <ArrowLeftRight className="h-5 w-5 mr-2" />
        {showComparison ? "Hide Comparison" : "Compare with Alternative Carriers"}
      </Button>
      
      {showComparison && (
        <div className="mt-4 animate-in fade-in duration-300">
          <PlanComparison 
            verizonPlans={verizonPlans}
            totalVerizonPrice={totalVerizonPrice}
            streamingCost={streamingCost}
            onClose={() => setShowComparison(false)}
          />
        </div>
      )}
    </>
  );
}
