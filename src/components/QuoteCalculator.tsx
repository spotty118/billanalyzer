
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { Plan, ApiError } from "@/types";
import { getPlans, formatCurrency } from "@/data/verizonPlans";
import { useQuoteCalculator } from "@/hooks/use-quote-calculator";
import { ErrorBoundary } from "@/components/ui/error-boundary";

interface PlanSelectorProps {
  selectedPlan: string;
  onPlanChange: (value: string) => void;
  plans: Plan[];
  currentLines: number;
}

const PlanSelector = ({
  selectedPlan,
  onPlanChange,
  plans,
  currentLines,
}: PlanSelectorProps) => {
  const myPlans = plans.filter(plan => {
    const planName = plan.name.toLowerCase();
    return plan.type === 'consumer' && 
           (planName.includes('welcome') || 
            planName.includes('plus') || 
            planName.includes('ultimate'));
  });

  const getLinePrice = (plan: Plan, lines: number) => {
    let basePrice;
    if (lines <= 1) basePrice = plan.basePrice;
    else if (lines === 2) basePrice = plan.multiLineDiscounts.lines2;
    else if (lines === 3) basePrice = plan.multiLineDiscounts.lines3;
    else if (lines === 4) basePrice = plan.multiLineDiscounts.lines4;
    else basePrice = plan.multiLineDiscounts.lines5Plus;

    // Apply autopay discount if available
    return basePrice - (plan.autopayDiscount || 0);
  };

  const getDisplayPrice = (plan: Plan) => {
    // Always show single line price in dropdown
    const singleLinePrice = getLinePrice(plan, 1);
    
    // If current lines are selected, show as additional info
    if (currentLines > 1) {
      const multiLinePrice = getLinePrice(plan, currentLines);
      const totalPrice = multiLinePrice * currentLines;
      return `${plan.name} - ${formatCurrency(singleLinePrice)}/line with autopay (${formatCurrency(totalPrice)} total for ${currentLines} lines)`;
    }
    
    return `${plan.name} - ${formatCurrency(singleLinePrice)}/line with autopay`;
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Select Plan</label>
      <Select onValueChange={onPlanChange} value={selectedPlan}>
        <SelectTrigger>
          <SelectValue placeholder="Choose a plan">
            {selectedPlan && getDisplayPrice(plans.find(p => p.id === selectedPlan)!)}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {myPlans.map((plan) => (
            <SelectItem key={plan.id} value={plan.id}>
              {getDisplayPrice(plan)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selectedPlan && (
        <div className="text-xs text-gray-500">
          {plans.find(p => p.id === selectedPlan)?.features.join(' • ')}
        </div>
      )}
    </div>
  );
};

interface QuoteResultProps {
  linePrice: number;
  total: number;
  hasDiscount: boolean;
  lines: number;
  annualSavings: number;
  breakdown: {
    subtotal: number;
    discount: number;
    total: number;
  };
}

const QuoteResult = ({
  linePrice,
  total,
  hasDiscount,
  lines,
  annualSavings,
  breakdown,
}: QuoteResultProps) => (
  <div className="mt-4 space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <div className="text-center">
        <p className="text-sm text-gray-500">Price Per Line</p>
        <p className="text-xl font-bold text-verizon-red">
          {formatCurrency(linePrice)}/mo
        </p>
      </div>
      <div className="text-center">
        <p className="text-sm text-gray-500">Total Monthly Cost</p>
        <p className="text-2xl font-bold text-verizon-red">
          {formatCurrency(total)}/mo
        </p>
      </div>
    </div>

    {hasDiscount && lines >= 2 && (
      <Alert>
        <AlertDescription>
          <div className="space-y-1">
            <p className="font-medium text-green-600">
              Multi-line discount applied!
            </p>
            <p className="text-sm">
              Monthly savings: {formatCurrency(breakdown.discount)}
            </p>
            <p className="text-sm">
              Annual savings: {formatCurrency(annualSavings)}
            </p>
          </div>
        </AlertDescription>
      </Alert>
    )}

    <div className="text-sm space-y-1 border-t pt-2">
      <div className="flex justify-between">
        <span>Subtotal</span>
        <span>{formatCurrency(breakdown.subtotal)}</span>
      </div>
      {hasDiscount && (
        <div className="flex justify-between text-green-600">
          <span>Multi-line Discount</span>
          <span>-{formatCurrency(breakdown.discount)}</span>
        </div>
      )}
      <div className="flex justify-between font-medium">
        <span>Total</span>
        <span>{formatCurrency(breakdown.total)}</span>
      </div>
    </div>
  </div>
);

export function QuoteCalculator() {
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [lines, setLines] = useState("");
  const [availablePlans, setAvailablePlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const plans = await getPlans();
        
        if (!Array.isArray(plans)) {
          throw new Error('Invalid response format');
        }
        
        setAvailablePlans(plans);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching plans:', err);
        const apiError: ApiError = {
          message: 'Failed to load plans. Please try again later.',
          details: err instanceof Error ? err.message : 'Unknown error occurred'
        };
        setError(apiError);
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const selectedPlan = availablePlans.find(p => p.id === selectedPlanId) || null;
  const { calculation, error: calculationError } = useQuoteCalculator(selectedPlan, parseInt(lines) || 0);

  const handleLineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numValue = parseInt(value);
    
    if (value === "" || (numValue >= 1 && numValue <= 12)) {
      setLines(value);
    }
  };

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

  return (
    <ErrorBoundary>
      <Card>
        <CardHeader>
          <CardTitle>Plan Quote Calculator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <PlanSelector
              selectedPlan={selectedPlanId}
              onPlanChange={setSelectedPlanId}
              plans={availablePlans}
              currentLines={parseInt(lines) || 1}
            />
            <div className="space-y-2">
              <label className="text-sm font-medium">Number of Lines</label>
              <Input
                type="number"
                min="1"
                max="12"
                value={lines}
                onChange={handleLineChange}
                placeholder="Enter number of lines (1-12)"
                className="mt-1"
              />
            </div>

            {calculationError && (
              <Alert variant="destructive">
                <AlertDescription>{calculationError.message}</AlertDescription>
              </Alert>
            )}

            {calculation && parseInt(lines) > 0 && (
              <QuoteResult
                linePrice={calculation.linePrice}
                total={calculation.total}
                hasDiscount={calculation.hasDiscount}
                lines={parseInt(lines)}
                annualSavings={calculation.annualSavings}
                breakdown={calculation.breakdown}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </ErrorBoundary>
  );
}
