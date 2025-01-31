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
  const [pricePerLine, setPricePerLine] = useState(0);

  const calculateQuote = () => {
    const linesNum = parseInt(lines) || 0;
    const plan = plans.find(p => p.id === selectedPlan);
    
    if (plan && linesNum > 0) {
      let linePrice;
      
      if (linesNum === 1) {
        linePrice = plan.basePrice;
      } else if (linesNum === 2) {
        linePrice = plan.multiLineDiscounts.lines2;
      } else if (linesNum === 3) {
        linePrice = plan.multiLineDiscounts.lines3;
      } else if (linesNum === 4) {
        linePrice = plan.multiLineDiscounts.lines4;
      } else {
        linePrice = plan.multiLineDiscounts.lines5Plus;
      }

      setPricePerLine(linePrice);
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
                    {plan.name} - ${plan.basePrice}/mo
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Number of Lines</label>
            <Input
              type="number"
              min="1"
              max="12"
              value={lines}
              onChange={(e) => setLines(e.target.value)}
              placeholder="Enter number of lines"
            />
          </div>
          <Button onClick={calculateQuote} className="w-full">
            Calculate Quote
          </Button>
          {total > 0 && (
            <div className="mt-4 text-center space-y-2">
              <div>
                <p className="text-sm text-gray-500">Price Per Line</p>
                <p className="text-xl font-bold text-verizon-red">
                  ${pricePerLine.toFixed(2)}/mo
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Monthly Cost</p>
                <p className="text-2xl font-bold text-verizon-red">
                  ${total.toFixed(2)}/mo
                </p>
              </div>
              {parseInt(lines) >= 2 && (
                <p className="text-sm text-green-600">
                  Includes multi-line discount!
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}