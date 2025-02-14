
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatCurrency } from "@/data/verizonPlans";

interface QuoteResultProps {
  linePrices: Array<{
    plan: string;
    price: number;
    perks?: string[]; // Add perks to the interface
  }>;
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

export function QuoteResult({
  linePrices,
  total,
  hasDiscount,
  annualSavings,
  breakdown,
}: QuoteResultProps) {
  return (
    <div className="mt-4 space-y-4">
      <div className="space-y-2">
        {linePrices.map((line, index) => {
          const basePlanPrice = line.price - (line.perks?.length || 0) * 10;
          const perksPrice = (line.perks?.length || 0) * 10;
          
          return (
            <div key={index} className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Line {index + 1} ({line.plan})</span>
                <span className="text-sm font-bold text-verizon-red">{formatCurrency(basePlanPrice)}/mo</span>
              </div>
              {perksPrice > 0 && (
                <div className="flex justify-between items-center pl-4">
                  <span className="text-sm text-gray-400">Perks ({line.perks?.length} selected)</span>
                  <span className="text-sm text-gray-500">+{formatCurrency(perksPrice)}/mo</span>
                </div>
              )}
            </div>
          );
        })}
        <div className="border-t pt-2 flex justify-between items-center">
          <span className="text-sm font-medium">Total Monthly Cost</span>
          <span className="text-xl font-bold text-verizon-red">{formatCurrency(total)}/mo</span>
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
}
