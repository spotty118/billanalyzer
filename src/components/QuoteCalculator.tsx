
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Minus } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { Plan, ApiError } from "@/types";
import { getPlans, formatCurrency } from "@/data/verizonPlans";
import { ErrorBoundary } from "@/components/ui/error-boundary";

interface LinePlan {
  plan: string;
  perks: string[];
}

interface PlanSelectorProps {
  selectedPlan: string;
  onPlanChange: (value: string) => void;
  onPerksChange: (perks: string[]) => void;
  plans: Plan[];
  selectedPerks: string[];
}

const PlanSelector = ({
  selectedPlan,
  onPlanChange,
  onPerksChange,
  plans,
  selectedPerks,
}: PlanSelectorProps) => {
  const myPlans = plans.filter(plan => {
    const planName = plan.name.toLowerCase();
    return plan.type === 'consumer' && 
           (planName.includes('welcome') || 
            planName.includes('plus') || 
            planName.includes('ultimate'));
  });

  const getPlanBasePrice = (plan: Plan) => {
    const planName = plan.name.toLowerCase();
    if (planName.includes('ultimate')) return 90;
    if (planName.includes('plus')) return 80;
    if (planName.includes('welcome')) return 65;
    return plan.basePrice;
  };

  const getDisplayPrice = (plan: Plan) => {
    const basePrice = getPlanBasePrice(plan);
    return `${plan.name} - ${formatCurrency(basePrice)}/line`;
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Select Plan</label>
        <Select onValueChange={onPlanChange} value={selectedPlan}>
          <SelectTrigger className="bg-white">
            <SelectValue placeholder="Choose a plan">
              {selectedPlan && getDisplayPrice(plans.find(p => p.id === selectedPlan)!)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-white">
            {myPlans.map((plan) => (
              <SelectItem key={plan.id} value={plan.id}>
                {getDisplayPrice(plan)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Select Perks</label>
        <div className="space-y-2 border rounded-md p-4">
          {['apple_music', 'apple_one', 'disney', 'google', 'netflix', 'cloud', 'youtube', 'hotspot', 'travel'].map((perk) => (
            <div key={perk} className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={perk}
                checked={selectedPerks.includes(perk)}
                onChange={(e) => {
                  const newPerks = e.target.checked 
                    ? [...selectedPerks, perk]
                    : selectedPerks.filter(p => p !== perk);
                  onPerksChange(newPerks);
                }}
              />
              <label htmlFor={perk} className="text-sm">
                {perk.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

interface QuoteResultProps {
  linePrice: number;
  total: number;
  hasDiscount: boolean;
  annualSavings: number;
  breakdown: {
    subtotal: number;
    discount: number;
    total: number;
    streamingSavings?: number;
    totalSavings?: number;
  };
}

const QuoteResult = ({
  linePrice,
  total,
  hasDiscount,
  annualSavings,
  breakdown,
}: QuoteResultProps) => (
  <div className="mt-4 space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <div className="text-center">
        <p className="text-sm text-gray-500">Average Price Per Line</p>
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

    {hasDiscount && (
      <Alert>
        <AlertDescription>
          <div className="space-y-1">
            <p className="font-medium text-green-600">
              Price includes autopay discount!
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
        <span>Without autopay</span>
        <span>{formatCurrency(breakdown.subtotal)}</span>
      </div>
      {hasDiscount && (
        <div className="flex justify-between text-green-600">
          <span>Autopay Discount</span>
          <span>-{formatCurrency(breakdown.discount)}</span>
        </div>
      )}
      <div className="flex justify-between font-medium">
        <span>Total with autopay</span>
        <span>{formatCurrency(breakdown.total)}</span>
      </div>
    </div>
  </div>
);

export function QuoteCalculator() {
  const [linePlans, setLinePlans] = useState<LinePlan[]>([{ plan: "", perks: [] }]);
  const [streamingBill, setStreamingBill] = useState("");
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

  const addLine = () => {
    setLinePlans([...linePlans, { plan: "", perks: [] }]);
  };

  const removeLine = (index: number) => {
    setLinePlans(linePlans.filter((_, i) => i !== index));
  };

  const updateLinePlan = (index: number, plan: string) => {
    const newLinePlans = [...linePlans];
    newLinePlans[index] = { ...newLinePlans[index], plan };
    setLinePlans(newLinePlans);
  };

  const updateLinePerks = (index: number, perks: string[]) => {
    const newLinePlans = [...linePlans];
    newLinePlans[index] = { ...newLinePlans[index], perks };
    setLinePlans(newLinePlans);
  };

  const getLinePriceForPlan = (planName: string, totalLines: number): number => {
    if (planName.includes('ultimate')) {
      if (totalLines === 1) return 90;
      if (totalLines === 2) return 80;
      if (totalLines === 3) return 65;
      if (totalLines === 4) return 55;
      return 52; // 5+ lines
    }
    if (planName.includes('plus')) {
      if (totalLines === 1) return 80;
      if (totalLines === 2) return 70;
      if (totalLines === 3) return 55;
      if (totalLines === 4) return 45;
      return 42; // 5+ lines
    }
    if (planName.includes('welcome')) {
      if (totalLines === 1) return 65;
      if (totalLines === 2) return 55;
      if (totalLines === 3) return 40;
      if (totalLines === 4) return 30;
      return 27; // 5+ lines
    }
    return 0;
  };

  const totalCalculation = useMemo(() => {
    const selectedPlans = linePlans
      .filter(lp => lp.plan)
      .map(lp => ({
        plan: availablePlans.find(p => p.id === lp.plan)!,
        perks: lp.perks
      }));

    if (selectedPlans.length === 0) return null;

    let totalMonthly = 0;
    let totalWithoutAutopay = 0;
    const streamingBillValue = parseFloat(streamingBill) || 0;
    const totalLines = selectedPlans.length; // This determines the tier for all lines

    // Calculate for each line using the total number of lines for tier pricing
    selectedPlans.forEach(({ plan }) => {
      const planName = plan.name.toLowerCase();
      // Each line gets priced according to the total number of lines
      const linePrice = getLinePriceForPlan(planName, totalLines);
      totalMonthly += linePrice;
      totalWithoutAutopay += linePrice + 10; // Add $10 for without autopay
    });

    const perksValue = linePlans.reduce((acc, lp) => acc + (lp.perks.length * 10), 0);
    const discount = totalWithoutAutopay - totalMonthly;
    const annualSavings = (streamingBillValue * 12) + (perksValue * 12) + (discount * 12);

    return {
      linePrice: totalMonthly / selectedPlans.length,
      total: totalMonthly,
      hasDiscount: true,
      annualSavings,
      selectedPerks: linePlans.flatMap(lp => lp.perks),
      breakdown: {
        subtotal: totalWithoutAutopay,
        discount,
        total: totalMonthly,
        streamingSavings: streamingBillValue,
        totalSavings: annualSavings,
      },
    };
  }, [linePlans, availablePlans, streamingBill]);

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
          <div className="space-y-6">
            <div className="space-y-4">
              {linePlans.map((linePlan, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Line {index + 1}</h3>
                    {linePlans.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeLine(index)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <PlanSelector
                    selectedPlan={linePlan.plan}
                    onPlanChange={(value) => updateLinePlan(index, value)}
                    onPerksChange={(perks) => updateLinePerks(index, perks)}
                    plans={availablePlans}
                    selectedPerks={linePlan.perks}
                  />
                </div>
              ))}

              <Button
                variant="outline"
                onClick={addLine}
                className="w-full"
                disabled={linePlans.length >= 12}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Line
              </Button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Current Monthly Streaming Cost</label>
              <Input
                type="number"
                value={streamingBill}
                onChange={(e) => setStreamingBill(e.target.value)}
                placeholder="Enter monthly streaming cost"
                className="mt-1"
              />
            </div>

            {totalCalculation && (
              <QuoteResult
                linePrice={totalCalculation.linePrice}
                total={totalCalculation.total}
                hasDiscount={totalCalculation.hasDiscount}
                annualSavings={totalCalculation.annualSavings}
                breakdown={totalCalculation.breakdown}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </ErrorBoundary>
  );
}
