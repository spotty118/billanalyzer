
import { ArrowLeftRight, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { Plan } from "@/types";
import { usMobilePlans, findBestUSMobileMatch, getUSMobilePlanPrice } from "@/config/usMobilePlans";
import { formatCurrency } from "@/data/verizonPlans";

interface PlanComparisonProps {
  verizonPlans: Array<{
    plan: string;
    planObject?: Plan;
    price: number;
    perks?: string[];
  }>;
  totalVerizonPrice: number;
  streamingCost: number;
  onClose: () => void;
}

export function PlanComparison({ 
  verizonPlans, 
  totalVerizonPrice, 
  streamingCost, 
  onClose 
}: PlanComparisonProps) {
  if (!verizonPlans.length) return null;

  const numberOfLines = verizonPlans.length;
  
  // Find the best US Mobile match for the first Verizon plan
  const mainVerizonPlan = verizonPlans[0];
  const matchedUSMobilePlanId = findBestUSMobileMatch(mainVerizonPlan.plan);
  const usMobilePlan = usMobilePlans.find(p => p.id === matchedUSMobilePlanId) || usMobilePlans[0];
  
  // Calculate US Mobile total price
  const usMobileTotalPrice = getUSMobilePlanPrice(usMobilePlan, numberOfLines);
  
  // Calculate savings
  const monthlySavings = totalVerizonPrice - usMobileTotalPrice;
  const annualSavings = monthlySavings * 12;
  
  // Determine if US Mobile or Verizon is better for different factors
  const priceBetter = monthlySavings > 0 ? 'usmobile' : 'verizon';
  const dataBetter = 
    usMobilePlan.dataAllowance.premium === 'unlimited' && 
    mainVerizonPlan.planObject?.dataAllowance.premium === 'unlimited'
      ? 'equal'
      : usMobilePlan.dataAllowance.premium === 'unlimited'
        ? 'usmobile'
        : 'verizon';
  
  const hotspotBetter = 
    (usMobilePlan.dataAllowance.hotspot || 0) > (mainVerizonPlan.planObject?.dataAllowance.hotspot || 0)
      ? 'usmobile'
      : 'verizon';
  
  const perksCount = verizonPlans.reduce((acc, line) => acc + (line.perks?.length || 0), 0);
  const perksBetter = usMobilePlan.streamingPerks.length > perksCount ? 'usmobile' : 'verizon';
  
  return (
    <Card className="mt-6 bg-gradient-to-r from-sky-50 to-indigo-50 border-2 border-blue-100">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-bold text-blue-800">
            <ArrowLeftRight className="h-5 w-5 inline-block mr-2" />
            Verizon vs US Mobile Comparison
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-3 sm:col-span-1">
            <h3 className="font-semibold text-md mb-2">Plan Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Lines:</span>
                <span className="font-medium">{numberOfLines}</span>
              </div>
              <div className="flex justify-between">
                <span>Verizon Plan:</span>
                <span className="font-medium">{mainVerizonPlan.plan}</span>
              </div>
              <div className="flex justify-between">
                <span>US Mobile Plan:</span>
                <span className="font-medium">{usMobilePlan.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Current Streaming:</span>
                <span className="font-medium">{formatCurrency(streamingCost)}/mo</span>
              </div>
            </div>
          </div>
          
          <div className="col-span-3 sm:col-span-1">
            <h3 className="font-semibold text-md mb-2">Monthly Cost</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Verizon:</span>
                <span className="font-medium">{formatCurrency(totalVerizonPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span>US Mobile:</span>
                <span className="font-medium">{formatCurrency(usMobileTotalPrice)}</span>
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
          
          <div className="col-span-3 sm:col-span-1">
            <h3 className="font-semibold text-md mb-2">Feature Comparison</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span>Price:</span>
                <ComparisonIndicator winner={priceBetter} />
              </div>
              <div className="flex justify-between items-center">
                <span>Data:</span>
                <ComparisonIndicator winner={dataBetter} />
              </div>
              <div className="flex justify-between items-center">
                <span>Hotspot:</span>
                <ComparisonIndicator winner={hotspotBetter} />
              </div>
              <div className="flex justify-between items-center">
                <span>Streaming Perks:</span>
                <ComparisonIndicator winner={perksBetter} />
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t">
          <h3 className="font-semibold mb-2">US Mobile Plan Features:</h3>
          <ul className="text-sm grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
            {usMobilePlan.features.map((feature, idx) => (
              <li key={idx} className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          
          <h3 className="font-semibold mt-3 mb-2">Streaming Perks Included:</h3>
          <ul className="text-sm grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
            {usMobilePlan.streamingPerks.map((perk, idx) => (
              <li key={idx} className="flex items-start">
                <CheckCircle className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>{perk}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="mt-6 bg-blue-50 p-3 rounded-md border border-blue-100">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">Note:</p>
              <p>This is an estimate only. US Mobile plans on Verizon's network offer comparable coverage and reliability. Visit US Mobile's website for the most current plan information.</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ComparisonIndicator({ winner }: { winner: 'verizon' | 'usmobile' | 'equal' }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger className="flex items-center">
          {winner === 'usmobile' ? (
            <span className="flex items-center text-green-600 font-medium">
              US Mobile <CheckCircle className="h-4 w-4 ml-1" />
            </span>
          ) : winner === 'verizon' ? (
            <span className="flex items-center text-red-600 font-medium">
              Verizon <CheckCircle className="h-4 w-4 ml-1" />
            </span>
          ) : (
            <span className="flex items-center text-gray-600 font-medium">
              Equal <AlertCircle className="h-4 w-4 ml-1" />
            </span>
          )}
        </TooltipTrigger>
        <TooltipContent>
          {winner === 'usmobile' 
            ? "US Mobile offers better value" 
            : winner === 'verizon' 
              ? "Verizon has an advantage here" 
              : "Both options are comparable"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
