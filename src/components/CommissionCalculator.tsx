import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function CommissionCalculator() {
  const [sales, setSales] = useState("");
  const [rate, setRate] = useState("");
  const [commission, setCommission] = useState(0);

  const calculateCommission = () => {
    const salesAmount = parseFloat(sales) || 0;
    const commissionRate = parseFloat(rate) || 0;
    setCommission((salesAmount * commissionRate) / 100);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Commission Calculator</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Total Sales Amount</label>
            <Input
              type="number"
              value={sales}
              onChange={(e) => setSales(e.target.value)}
              placeholder="Enter sales amount"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Commission Rate (%)</label>
            <Input
              type="number"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              placeholder="Enter commission rate"
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