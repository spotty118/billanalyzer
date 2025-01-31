import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Plan } from "@/types";
import { plans } from "@/data/verizonPlans";
import { useQuoteCalculator } from "@/hooks/use-quote-calculator";
import { ErrorBoundary } from "@/components/ui/error-boundary";

const PlanSelector = ({
  selectedPlan,
  onPlanChange,
}: {
  selectedPlan: string;
  onPlanChange: (value: string) => void;
}) => (
  <div>
    <label className="text-sm font-medium">Select Plan</label>
    <Select onValueChange={onPlanChange} value={selectedPlan}>
      <SelectTrigger>
        <SelectValue placeholder="Choose a plan" />
      </SelectTrigger>
      <SelectContent>
        {plans.map((plan) => (
          <SelectItem key={plan.id} value={plan.id}>
            {plan.name} - ${plan.basePrice}/mo
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

const QuoteResult = ({
  linePrice,
  total,
  hasDiscount,
  lines,
}: {
  linePrice: number;
  total: number;
  hasDiscount: boolean;
  lines: number;
}) => (
  <div className="mt-4 text-center space-y-2">
    <div>
      <p className="text-sm text-gray-500">Price Per Line</p>
      <p className="text-xl font-bold text-verizon-red">
        ${linePrice.toFixed(2)}/mo
      </p>
    </div>
    <div>
      <p className="text-sm text-gray-500">Total Monthly Cost</p>
      <p className="text-2xl font-bold text-verizon-red">
        ${total.toFixed(2)}/mo
      </p>
    </div>
    {hasDiscount && parseInt(lines.toString()) >= 2 && (
      <p className="text-sm text-green-600">
        Includes multi-line discount!
      </p>
    )}
  </div>
);

export function QuoteCalculator() {
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [lines, setLines] = useState("");
  
  const selectedPlan = plans.find(p => p.id === selectedPlanId) || null;
  const calculation = useQuoteCalculator(selectedPlan, parseInt(lines) || 0);

  const handleLineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numValue = parseInt(value);
    
    if (value === "" || (numValue >= 1 && numValue <= 12)) {
      setLines(value);
    }
  };

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
            />
            <div>
              <label className="text-sm font-medium">Number of Lines</label>
              <Input
                type="number"
                min="1"
                max="12"
                value={lines}
                onChange={handleLineChange}
                placeholder="Enter number of lines"
                className="mt-1"
              />
            </div>
            {calculation && (
              <QuoteResult
                linePrice={calculation.linePrice}
                total={calculation.total}
                hasDiscount={calculation.hasDiscount}
                lines={parseInt(lines)}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </ErrorBoundary>
  );
}