
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuoteState, MAX_ALLOWED_LINES } from "@/hooks/use-quote-state";
import { QuoteResult } from "./quote-calculator/QuoteResult";
import { MilitaryDiscountBanner } from "./quote-calculator/MilitaryDiscountBanner";
import { LineItemsList } from "./quote-calculator/LineItemsList";
import { StreamingCostInput } from "./quote-calculator/StreamingCostInput";
import { QuoteComparison } from "./quote-calculator/QuoteComparison";

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

  const streamingBillValue = parseFloat(streamingBill) || 0;
  const hasQuoteData = totalCalculation && totalCalculation.linePrices && totalCalculation.linePrices.length > 0;

  return (
    <ErrorBoundary>
      <Card>
        <CardHeader>
          <CardTitle>Plan Quote Calculator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <MilitaryDiscountBanner />

            <LineItemsList 
              linePlans={linePlans}
              availablePlans={availablePlans}
              allSelectedPerks={allSelectedPerks}
              onAddLine={addLine}
              onRemoveLine={removeLine}
              onUpdatePlan={updateLinePlan}
              onUpdatePerks={updateLinePerks}
              maxLines={MAX_ALLOWED_LINES}
            />

            <StreamingCostInput 
              value={streamingBill}
              onChange={setStreamingBill}
            />

            {hasQuoteData && (
              <>
                <QuoteResult
                  linePrices={totalCalculation.linePrices}
                  total={totalCalculation.total}
                  hasDiscount={totalCalculation.hasDiscount}
                  annualSavings={totalCalculation.annualSavings || 0}
                  breakdown={totalCalculation.breakdown}
                />
                
                <QuoteComparison 
                  hasQuoteData={hasQuoteData}
                  verizonPlans={verizonPlansForComparison}
                  totalVerizonPrice={totalCalculation.total}
                  streamingCost={streamingBillValue}
                />
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </ErrorBoundary>
  );
}
