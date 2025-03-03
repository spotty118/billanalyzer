import { 
  ArrowLeftRight, 
  Star,
  Zap,
  Lightbulb
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { CarrierTabContent } from "./comparison/CarrierTabContent";

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
  
  const getCarrierIcon = (iconName: string) => {
    switch (iconName) {
      case 'ArrowLeftRight': return <ArrowLeftRight className="h-5 w-5 inline-block mr-2" />;
      case 'Star': return <Star className="h-5 w-5 inline-block mr-2" />;
      case 'Zap': return <Zap className="h-5 w-5 inline-block mr-2" />;
      case 'Lightbulb': return <Lightbulb className="h-5 w-5 inline-block mr-2" />;
      default: return <ArrowLeftRight className="h-5 w-5 inline-block mr-2" />;
    }
  };

  const activeCarrierName = supportedCarriers.find(c => c.id === activeCarrier)?.name || 'US Mobile';

  return (
    <Card className="mt-6 bg-gradient-to-r from-sky-50 to-indigo-50 border-2 border-blue-100">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-bold text-blue-800">
            <ArrowLeftRight className="h-5 w-5 inline-block mr-2" />
            Verizon vs {activeCarrierName} Comparison
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="usmobile" onValueChange={setActiveCarrier}>
          <TabsList className="mb-4 w-full">
            <div className="grid grid-cols-4 gap-2 w-full">
              {supportedCarriers.map(carrier => (
                <TabsTrigger 
                  key={carrier.id} 
                  value={carrier.id} 
                  className="flex items-center justify-center px-2 py-2 text-sm whitespace-normal text-center h-auto"
                >
                  {getCarrierIcon(carrier.icon)}
                  <span className="ml-1">{carrier.name}</span>
                </TabsTrigger>
              ))}
            </div>
          </TabsList>
          
          {supportedCarriers.map(carrier => {
            const mainVerizonPlan = verizonPlans[0];
            const matchedCarrierPlanId = findBestCarrierMatch(mainVerizonPlan.plan, carrier.id);
            const carrierPlan = alternativeCarrierPlans.find(p => p.id === matchedCarrierPlanId) || alternativeCarrierPlans[0];
            
            const carrierTotalPrice = getCarrierPlanPrice(carrierPlan, numberOfLines);
            
            const monthlySavings = totalVerizonPrice - carrierTotalPrice;
            const annualSavings = monthlySavings * 12;
            
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
              <TabsContent key={carrier.id} value={carrier.id}>
                <CarrierTabContent
                  carrier={carrier}
                  numberOfLines={numberOfLines}
                  mainVerizonPlan={mainVerizonPlan}
                  carrierPlan={carrierPlan}
                  totalVerizonPrice={totalVerizonPrice}
                  carrierTotalPrice={carrierTotalPrice}
                  streamingCost={streamingCost}
                  monthlySavings={monthlySavings}
                  annualSavings={annualSavings}
                  priceBetter={priceBetter}
                  dataBetter={dataBetter}
                  hotspotBetter={hotspotBetter}
                  perksBetter={perksBetter}
                  formatCurrency={formatCurrency}
                />
              </TabsContent>
            );
          })}
        </Tabs>
      </CardContent>
    </Card>
  );
}
