
import { Button } from "@/components/ui/button";

export interface BillAnalysisHeaderProps {
  bill: any;
  onReset: () => void;
}

export function BillAnalysisHeader({ bill, onReset }: BillAnalysisHeaderProps) {
  return (
    <div className="flex justify-between items-center p-4 bg-white shadow-md rounded-lg">
      <div>
        <h2 className="text-xl font-bold">Bill Analysis</h2>
        <p className="text-gray-600">Billing Period: {bill.billingPeriod}</p>
        <p className="text-gray-600">Total Amount: {bill.totalAmount}</p>
      </div>
      <Button variant="outline" onClick={onReset}>
        Reset Analysis
      </Button>
    </div>
  );
}
