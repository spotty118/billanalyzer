
import { 
  ArrowLeftRight, 
  AlertCircle, 
  CheckCircle, 
  Star,
  Zap,
  Lightbulb
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Plan } from "@/types";
import { 
  alternativeCarrierPlans, 
  findBestCarrierMatch, 
  getCarrierPlanPrice,
  supportedCarriers 
} from "@/config/alternativeCarriers";
import { formatCurrency } from "@/data/verizonPlans";
import { useState } from "react";

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
  const [activeCarrier, setActiveCarrier] = useState('usmobile');
  
  if (!verizonPlans.length) return null;

  const numberOfLines = verizonPlans.length;
  
  // Get icon component for the carrier
  const getCarrierIcon = (iconName: string) => {
    switch (iconName) {
      case 'ArrowLeftRight': return <ArrowLeftRight className="h-5 w-5 inline-block mr-2" />;
      case 'Star': return <Star className="h-5 w-5 inline-block mr-2" />;
      case 'Zap': return <Zap className="h-5 w-5 inline-block mr-2" />;
      case 'Lightbulb': return <Lightbulb className="h-5 w-5 inline-block mr-2" />;
      default: return <ArrowLeftRight className="h-5 w-5 inline-block mr-2" />;
    }
  };
  
  // Find the best matching carrier plan based on the first Verizon plan
  const mainVerizonPlan = verizonPlans[0];
  const matchedCarrierPlanId = findBestCarrierMatch(mainVerizonPlan.plan, activeCarrier);
  const carrierPlan = alternativeCarrierPlans.find(p => p.id === matchedCarrierPlanId) || alternativeCarrierPlans[0];
  
  // Calculate carrier total price
  const carrierTotalPrice = getCarrierPlanPrice(carrierPlan, numberOfLines);
  
  // Calculate savings
  const monthlySavings = totalVerizonPrice - carrierTotalPrice;
  const annualSavings = monthlySavings * 12;
  
  // Determine if carrier or Verizon is better for different factors
  const priceBetter = monthlySavings > 0 ? 'carrier' : 'verizon';
  const dataBetter = 
    carrierPlan.dataAllowance.premium === 'unlimited' && 
    mainVerizonPlan.planObject?.dataAllowance.premium === 'unlimited'
      ? 'equal'
      : carrierPlan.dataAllowance.premium === 'unlimited'
        ? 'carrier'
        : 'verizon';
  
  const hotspotBetter = 
    (carrierPlan.dataAllowance.hotspot || 0) > (mainVerizonPlan.planObject?.dataAllowance.hotspot || 0)
      ? 'carrier'
      : 'verizon';
  
  const perksCount = verizonPlans.reduce((acc, line) => acc + (line.perks?.length || 0), 0);
  const perksBetter = carrierPlan.streamingPerks.length > perksCount ? 'carrier' : 'verizon';
  
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
        <Tabs defaultValue="usmobile" onValueChange={setActiveCarrier}>
          <TabsList className="grid grid-cols-4 mb-4">
            {supportedCarriers.map(carrier => (
              <TabsTrigger key={carrier.id} value={carrier.id} className="flex items-center">
                {getCarrierIcon(carrier.icon)}
                <span className="ml-1">{carrier.name}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          
          {supportedCarriers.map(carrier => (
            <TabsContent key={carrier.id} value={carrier.id}>
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
                      <span>{carrier.name} Plan:</span>
                      <span className="font-medium">{carrierPlan.name}</span>
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
                      <span>{carrier.name}:</span>
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
                
                <div className="col-span-3 sm:col-span-1">
                  <h3 className="font-semibold text-md mb-2">Feature Comparison</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span>Price:</span>
                      <ComparisonIndicator winner={priceBetter} carrierName={carrier.name} />
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Data:</span>
                      <ComparisonIndicator winner={dataBetter} carrierName={carrier.name} />
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Hotspot:</span>
                      <ComparisonIndicator winner={hotspotBetter} carrierName={carrier.name} />
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Streaming Perks:</span>
                      <ComparisonIndicator winner={perksBetter} carrierName={carrier.name} />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <h3 className="font-semibold mb-2">{carrier.name} Plan Features:</h3>
                <ul className="text-sm grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
                  {carrierPlan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <h3 className="font-semibold mt-3 mb-2">Streaming Perks Included:</h3>
                <ul className="text-sm grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
                  {carrierPlan.streamingPerks.map((perk, idx) => (
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
                    <p>This is an estimate only. {carrier.name} plans offer different coverage and features. Visit the US Mobile website for the most current plan information.</p>
                  </div>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}

function ComparisonIndicator({ 
  winner, 
  carrierName 
}: { 
  winner: 'carrier' | 'verizon' | 'equal';
  carrierName: string;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger className="flex items-center">
          {winner === 'carrier' ? (
            <span className="flex items-center text-green-600 font-medium">
              {carrierName} <CheckCircle className="h-4 w-4 ml-1" />
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
          {winner === 'carrier' 
            ? `${carrierName} offers better value` 
            : winner === 'verizon' 
              ? "Verizon has an advantage here" 
              : "Both options are comparable"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
