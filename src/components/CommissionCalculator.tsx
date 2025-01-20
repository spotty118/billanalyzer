import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { plans } from "@/data/verizonPlans";

export function CommissionCalculator() {
  const [selectedPlan, setSelectedPlan] = useState("");
  const [lines, setLines] = useState("");
  const [commission, setCommission] = useState(0);

  const calculateCommission = () => {
    const linesNum = parseInt(lines) || 0;
    const plan = plans.find(p => p.id === selectedPlan);
    
    if (plan) {
      // Commission rates vary by plan
      let commissionRate;
      switch (plan.name) {
        case 'Unlimited Ultimate':
          commissionRate = 15; // 15% commission
          break;
        case 'Unlimited Plus':
          commissionRate = 12; // 12% commission
          break;
        default:
          commissionRate = 10; // 10% commission
      }
      
      setCommission((plan.price * linesNum * commissionRate) / 100);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Commission Calculator</CardTitle>
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
                    {plan.name}
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
          <Button onClick={calculateCommission} className="w-full">
            Calculate Commission
          </Button>
          {commission > 0 && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">Estimated Commission</p>
              <p className="text-2xl font-bold text-verizon-red">
                ${commission.toFixed(2)}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}