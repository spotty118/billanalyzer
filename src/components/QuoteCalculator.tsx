import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { plans } from "@/data/verizonPlans";

export function QuoteCalculator() {
  const [selectedPlan, setSelectedPlan] = useState("");
  const [lines, setLines] = useState("");
  const [total, setTotal] = useState(0);

  const calculateQuote = () => {
    const linesNum = parseInt(lines) || 0;
    const plan = plans.find(p => p.id === selectedPlan);
    if (plan) {
      let linePrice = plan.price;
      // Apply multi-line discount
      if (linesNum >= 4) {
        linePrice -= 25; // $25 off per line for 4+ lines
      }
      setTotal(linesNum * linePrice);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Plan Quote Calculator</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Select Plan</label>
            <Select onValueChange={setSelectedPlan} value={selectedPlan}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a plan" />
              </SelectTrigger>
              <SelectContent>
                {plans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name} - ${plan.price}/mo
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Number of Lines</label>
            <Input
              type="number"
              value={lines}
              onChange={(e) => setLines(e.target.value)}
              placeholder="Enter number of lines"
            />
          </div>
          <Button onClick={calculateQuote} className="w-full">
            Calculate Quote
          </Button>
          {total > 0 && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">Total Monthly Cost</p>
              <p className="text-2xl font-bold text-verizon-red">
                ${total.toFixed(2)}
              </p>
              {parseInt(lines) >= 4 && (
                <p className="text-sm text-green-600 mt-2">
                  Includes multi-line discount of $25/line!
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}