
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Zap, Star, Lightbulb, Eye, CircleDot, Smartphone, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { alternativeCarrierPlans, supportedCarriers } from "@/config/alternativeCarriers";

interface CarrierComparisonProps {
  billData: any;
  activeCarrierTab: string;
  setActiveCarrierTab: React.Dispatch<React.SetStateAction<string>>;
  calculateCarrierSavings: (carrierId: string) => {
    monthlySavings: number;
    annualSavings: number;
    planName: string;
    price: number;
  };
  formatCurrency: (value: number) => string;
  carrierType?: string;
}

export function CarrierComparison({
  billData,
  activeCarrierTab,
  setActiveCarrierTab,
  calculateCarrierSavings,
  formatCurrency,
  carrierType = "verizon"
}: CarrierComparisonProps) {
  if (!billData || !billData.phoneLines || billData.phoneLines.length === 0) {
    return (
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Carrier Comparison</CardTitle>
          <CardDescription>
            See how different carriers compare to your {carrierType.charAt(0).toUpperCase() + carrierType.slice(1)} plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-muted-foreground">
              No bill data available. Please upload a bill or enter line details to see carrier comparisons.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getCarrierIcon = (iconName: string) => {
    const iconMap: Record<string, JSX.Element> = {
      'Zap': <Zap className="h-5 w-5" />,
      'Star': <Star className="h-5 w-5" />,
      'Lightbulb': <Lightbulb className="h-5 w-5" />,
      'Eye': <Eye className="h-5 w-5" />,
      'CircleDot': <CircleDot className="h-5 w-5" />,
      'Smartphone': <Smartphone className="h-5 w-5" />
    };

    return iconMap[iconName] || <Zap className="h-5 w-5" />;
  };

  const numberOfLines = billData.phoneLines?.length || 1;
  const currentMonthlyTotal = billData?.totalAmount || 0;

  const handleTabChange = (value: string) => {
    setActiveCarrierTab(value);
  };

  const renderCarrierTabs = () => {
    return supportedCarriers.map(carrier => (
      <TabsTrigger key={carrier.id} value={carrier.id} className="flex items-center gap-2">
        {getCarrierIcon(carrier.icon)}
        <span className="hidden sm:inline">{carrier.name}</span>
      </TabsTrigger>
    ));
  };

  const handleViewPlan = (planName: string, carrierId: string) => {
    console.log(`Viewing plan: ${planName} from ${carrierId}`);
    // Open carrier's website in a new tab
    const carrierUrls: Record<string, string> = {
      "usmobile": "https://www.usmobile.com/plans",
      "visible": "https://www.visible.com/plans",
      "cricket": "https://www.cricketwireless.com/cell-phone-plans",
      "total": "https://www.totalwireless.com/plans",
      "verizon": "https://www.verizon.com/plans/",
      "att": "https://www.att.com/plans/wireless/",
      "tmobile": "https://www.t-mobile.com/cell-phone-plans",
      "xfinity": "https://www.xfinity.com/mobile/plans",
      "metropcs": "https://www.metrobyt-mobile.com/cell-phone-plans",
      "boost": "https://www.boostmobile.com/plans"
    };
    
    const url = carrierUrls[carrierId] || `https://www.google.com/search?q=${encodeURIComponent(`${carrierId} ${planName} plan`)}`;
    window.open(url, '_blank');
  };

  const renderCarrierContent = () => {
    const carrier = supportedCarriers.find(c => c.id === activeCarrierTab);
    if (!carrier) return null;

    // Get savings for this carrier
    const savings = calculateCarrierSavings(carrier.id);
    
    // Get all plans for this carrier
    const carrierPlans = alternativeCarrierPlans.filter(plan => plan.carrierId === carrier.id);
    
    if (carrierPlans.length === 0) {
      return (
        <div className="text-center py-6">
          <p className="text-muted-foreground">No plans available for this carrier.</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        {/* Savings summary */}
        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-primary/10 p-2">
                {getCarrierIcon(carrier.icon)}
              </div>
              <div>
                <h3 className="font-medium">{carrier.name}</h3>
                <p className="text-sm text-muted-foreground">
                  Estimated savings compared to your {carrierType.charAt(0).toUpperCase() + carrierType.slice(1)} bill
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-primary">
                Save {formatCurrency(savings.monthlySavings)}/mo
              </div>
              <div className="text-sm text-muted-foreground">
                {formatCurrency(savings.annualSavings)}/year
              </div>
            </div>
          </div>
        </div>
        
        {/* Plan comparison */}
        <div className="space-y-4">
          <h3 className="font-medium">Available Plans</h3>
          
          {carrierPlans.map(plan => {
            // Calculate price based on number of lines
            const planPrice = plan.basePrice * numberOfLines;
            // Calculate savings
            const planSavings = currentMonthlyTotal - planPrice;
            
            return (
              <div key={plan.id} className="rounded-lg border p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{plan.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {plan.network} network
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">
                      {formatCurrency(planPrice)}/mo
                    </div>
                    <div className="text-sm text-green-500">
                      Save {formatCurrency(planSavings)}/mo
                    </div>
                  </div>
                </div>
                
                <div className="mt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {plan.features.slice(0, 4).map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {plan.streamingPerks.length > 0 && (
                  <div className="mt-2">
                    <h5 className="text-sm font-medium mb-1">Included Perks:</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {plan.streamingPerks.map((perk, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="text-sm">{perk}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex flex-wrap gap-2">
                  <Button 
                    onClick={() => handleViewPlan(plan.name, carrier.id)}
                    className="flex items-center gap-1"
                  >
                    View Plan <ExternalLink className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Carrier Comparison</CardTitle>
        <CardDescription>
          See how different carriers compare to your {carrierType.charAt(0).toUpperCase() + carrierType.slice(1)} plan
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeCarrierTab} onValueChange={handleTabChange}>
          <TabsList className="grid grid-cols-3 sm:grid-cols-7 mb-4">
            {renderCarrierTabs()}
          </TabsList>
          <TabsContent value={activeCarrierTab}>
            {renderCarrierContent()}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
