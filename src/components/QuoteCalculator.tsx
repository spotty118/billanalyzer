
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { Plan, ApiError } from "@/types";
import { getPlans } from "@/data/verizonPlans";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { LineItem } from "./quote-calculator/LineItem";
import { QuoteResult } from "./quote-calculator/QuoteResult";

interface LinePlan {
  plan: string;
  perks: string[];
}

const getLinePriceForPosition = (planName: string, linePosition: number): number => {
  if (planName.includes('ultimate')) {
    if (linePosition === 1) return 90;
    if (linePosition === 2) return 80;
    if (linePosition === 3) return 65;
    if (linePosition === 4) return 55;
    return 52; // 5+ lines
  }
  if (planName.includes('plus')) {
    if (linePosition === 1) return 80;
    if (linePosition === 2) return 70;
    if (linePosition === 3) return 55;
    if (linePosition === 4) return 45;
    return 42; // 5+ lines
  }
  if (planName.includes('welcome')) {
    if (linePosition === 1) return 65;
    if (linePosition === 2) return 55;
    if (linePosition === 3) return 40;
    if (linePosition === 4) return 30;
    return 27; // 5+ lines
  }
  return 0;
};

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

    const linePrices = selectedPlans.map(({ plan }, index) => {
      const linePosition = index + 1;
      const planName = plan.name.toLowerCase();
      const linePrice = getLinePriceForPosition(planName, linePosition);
      totalMonthly += linePrice;
      totalWithoutAutopay += linePrice + 10;
      return {
        plan: plan.name,
        price: linePrice
      };
    });

    const perksValue = linePlans.reduce((acc, lp) => acc + (lp.perks.length * 10), 0);
    const discount = totalWithoutAutopay - totalMonthly;
    const annualSavings = (streamingBillValue * 12) + (perksValue * 12) + (discount * 12);

    return {
      linePrices,
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

  const allSelectedPerks = linePlans.flatMap(lp => lp.perks);

  return (
    <ErrorBoundary>
      <Card>
        <CardHeader>
          <CardTitle>Plan Quote Calculator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <Button 
              variant="outline" 
              className="w-full text-gray-400 cursor-not-allowed bg-gray-50"
              disabled
            >
              Military Discount (Coming Soon)
            </Button>

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
                disabled={linePlans.length >= 12}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Line
              </Button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Current Monthly Streaming Cost</label>
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
                linePrices={totalCalculation.linePrices}
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
