
interface MonthlyCostComparisonProps {
  totalVerizonPrice: number;
  carrierTotalPrice: number;
  monthlySavings: number;
  annualSavings: number;
  formatCurrency: (value: number) => string;
  carrierName: string;
}

export function MonthlyCostComparison({ 
  totalVerizonPrice,
  carrierTotalPrice,
  monthlySavings,
  annualSavings,
  formatCurrency,
  carrierName
}: MonthlyCostComparisonProps) {
  return (
    <div className="col-span-3 sm:col-span-1">
      <h3 className="font-semibold text-md mb-2">Monthly Cost</h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Verizon Monthly:</span>
          <span className="font-medium">{formatCurrency(totalVerizonPrice)}</span>
        </div>
        <div className="flex justify-between">
          <span>{carrierName} Monthly:</span>
          <span className="font-medium">{formatCurrency(carrierTotalPrice)}</span>
        </div>
        <div className="flex justify-between border-t pt-1 mt-1">
          <span>Monthly Savings:</span>
          <span className={`font-bold ${monthlySavings > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {monthlySavings > 0 ? `${formatCurrency(monthlySavings)}` : `-${formatCurrency(Math.abs(monthlySavings))}`}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Annual Savings:</span>
          <span className={`font-bold ${annualSavings > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {annualSavings > 0 ? `${formatCurrency(annualSavings)}` : `-${formatCurrency(Math.abs(annualSavings))}`}
          </span>
        </div>
      </div>
    </div>
  );
}
