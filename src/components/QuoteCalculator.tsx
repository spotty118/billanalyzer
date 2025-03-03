
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Info, ArrowLeftRight } from "lucide-react";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { LineItem } from "./quote-calculator/LineItem";
import { QuoteResult } from "./quote-calculator/QuoteResult";
import { PlanComparison } from "./quote-calculator/PlanComparison";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuoteState, MAX_ALLOWED_LINES } from "@/hooks/use-quote-state";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { useState } from "react";

/**
 * Quote Calculator component for calculating plan prices with perks
 * Uses the useQuoteState hook for state management and calculations
 */
export function QuoteCalculator() {
  const {
    linePlans,
    streamingBill,
    availablePlans,
    loading,
    error,
    totalCalculation,
    allSelectedPerks,
    addLine,
    removeLine,
    updateLinePlan,
    updateLinePerks,
    setStreamingBill
  } = useQuoteState();
  
  // Add state for showing/hiding the comparison
  const [showComparison, setShowComparison] = useState(false);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <div 
              className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"
              data-testid="loading-spinner"
            ></div>
            <div>Loading plans...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertDescription>
              <div className="space-y-2">
                <p>{error.message}</p>
                {error.details && (
                  <p className="text-sm text-gray-500">{error.details}</p>
                )}
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Create verizon plan data for comparison
  const verizonPlansForComparison = totalCalculation?.linePrices.map(line => ({
    plan: line.plan,
    planObject: availablePlans.find(p => p.name === line.plan),
    price: line.price,
    perks: line.perks
  })) || [];

  const handleToggleComparison = () => {
    setShowComparison(!showComparison);
  };

  const streamingBillValue = parseFloat(streamingBill) || 0;

  return (
    <ErrorBoundary>
      <Card>
        <CardHeader>
          <CardTitle>Plan Quote Calculator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center">
              <Button 
                variant="outline" 
                className="w-full text-gray-400 cursor-not-allowed bg-gray-50"
                disabled
              >
                Military Discount (Coming Soon)
              </Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="ml-2 h-4 w-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Military discount feature is currently under development</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="mt-6 space-y-4">
              {linePlans.map((linePlan, index) => (
                <LineItem
                  key={index}
                  index={index}
                  linePlan={linePlan}
                  plans={availablePlans}
                  allSelectedPerks={allSelectedPerks}
                  onRemove={() => removeLine(index)}
                  onPlanChange={(value) => updateLinePlan(index, value)}
                  onPerksChange={(perks) => updateLinePerks(index, perks)}
                  showRemoveButton={linePlans.length > 1}
                />
              ))}

              <Button
                variant="outline"
                onClick={addLine}
                className="w-full border-dashed"
                disabled={linePlans.length >= MAX_ALLOWED_LINES}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Line {linePlans.length >= MAX_ALLOWED_LINES && `(Maximum ${MAX_ALLOWED_LINES} lines)`}
              </Button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Current Monthly Streaming Cost</label>
              <Input
                type="number"
                value={streamingBill}
                onChange={(e) => setStreamingBill(e.target.value)}
                placeholder="Enter monthly streaming cost"
                min="0"
                step="0.01"
                className="mt-1"
              />
            </div>

            {totalCalculation && totalCalculation.linePrices && totalCalculation.linePrices.length > 0 && (
              <>
                <QuoteResult
                  linePrices={totalCalculation.linePrices}
                  total={totalCalculation.total}
                  hasDiscount={totalCalculation.hasDiscount}
                  annualSavings={totalCalculation.annualSavings || 0}
                  breakdown={totalCalculation.breakdown}
                />
                
                {/* Update compare button with alternative carriers */}
                <Button 
                  variant="outline" 
                  className="w-full mt-4 border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800"
                  onClick={handleToggleComparison}
                >
                  <ArrowLeftRight className="h-4 w-4 mr-2" />
                  {showComparison ? "Hide Comparison" : "Compare with Alternative Carriers"}
                </Button>
                
                {/* Show comparison if toggled */}
                {showComparison && (
                  <PlanComparison 
                    verizonPlans={verizonPlansForComparison}
                    totalVerizonPrice={totalCalculation.total}
                    streamingCost={streamingBillValue}
                    onClose={() => setShowComparison(false)}
                  />
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </ErrorBoundary>
  );
}
