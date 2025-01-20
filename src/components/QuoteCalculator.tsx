import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function QuoteCalculator() {
  const [lines, setLines] = useState("");
  const [plan, setPlan] = useState("");
  const [total, setTotal] = useState(0);

  const calculateQuote = () => {
    const linesNum = parseInt(lines) || 0;
    const planPrice = parseInt(plan) || 0;
    setTotal(linesNum * planPrice);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Plan Quote Calculator</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Number of Lines</label>
            <Input
              type="number"
              value={lines}
              onChange={(e) => setLines(e.target.value)}
              placeholder="Enter number of lines"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Plan Price per Line</label>
            <Input
              type="number"
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              placeholder="Enter plan price"
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
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}