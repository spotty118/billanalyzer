
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
        className="w-full mt-4 border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800"
        onClick={() => setShowComparison(!showComparison)}
      >
        <ArrowLeftRight className="h-4 w-4 mr-2" />
        {showComparison ? "Hide Comparison" : "Compare with Alternative Carriers"}
      </Button>
      
      {showComparison && (
        <PlanComparison 
          verizonPlans={verizonPlans}
          totalVerizonPrice={totalVerizonPrice}
          streamingCost={streamingCost}
          onClose={() => setShowComparison(false)}
        />
      )}
    </>
  );
}
