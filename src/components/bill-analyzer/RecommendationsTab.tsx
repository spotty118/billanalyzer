
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, Zap, Star, Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { alternativeCarrierPlans } from "@/config/alternativeCarriers";

type ValidNetworkPreference = 'verizon' | 'tmobile' | 'att' | 'usmobile';

interface RecommendationsTabProps {
  billData: any;
  formatCurrency: (value: number) => string;
  calculateCarrierSavings: (carrierId: string) => {
    monthlySavings: number;
    annualSavings: number;
    planName: string;
    price: number;
  };
  networkPreference?: any;
  carrierType?: string;
}

export function RecommendationsTab({ 
  billData, 
  formatCurrency, 
  calculateCarrierSavings, 
  networkPreference,
  carrierType = "verizon"
}: RecommendationsTabProps) {
  const networkToCarrierMap: Record<ValidNetworkPreference, string> = {
    verizon: 'Verizon',
    tmobile: 'T-Mobile',
    att: 'AT&T',
    usmobile: 'US Mobile'
  };
  
  // Check if there's bill data available
  if (!billData || !billData.phoneLines || billData.phoneLines.length === 0) {
    return (
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Personalized Recommendations</CardTitle>
          <CardDescription>
            Suggestions to optimize your {carrierType.charAt(0).toUpperCase() + carrierType.slice(1)} plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-muted-foreground">
              No bill data available. Please upload a bill or enter line details to see recommendations.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate savings for different carriers
  const networkIcons: Record<string, any> = {
    warp: <Zap className="h-5 w-5" />,
    darkstar: <Star className="h-5 w-5" />,
    lightspeed: <Lightbulb className="h-5 w-5" />
  };

  // Find matching carrier plans
  const getRecommendedCarrier = () => {
    const currentNetworkPreference = networkPreference || 'verizon';
    
    // Based on network preference, suggest the appropriate US Mobile network
    let recommendedCarrierId = 'warp'; // Default to Warp (Verizon)
    if (currentNetworkPreference === 'att') {
      recommendedCarrierId = 'darkstar';
    } else if (currentNetworkPreference === 'tmobile') {
      recommendedCarrierId = 'lightspeed';
    }
    
    const savings = calculateCarrierSavings(recommendedCarrierId);
    
    // Find the carrier plan details
    const plan = alternativeCarrierPlans.find(p => p.carrierId === recommendedCarrierId);
    
    return {
      carrierId: recommendedCarrierId,
      savings,
      plan
    };
  };
  
  const recommendedCarrier = getRecommendedCarrier();
  const numberOfLines = billData.phoneLines?.length || 1;
  
  // Check if any lines have device payments
  const hasDevicePayments = billData.phoneLines.some(
    (line: any) => (line.details?.devicePayment || 0) > 0
  );
  
  // Find any unused perks
  const unusedPerks = billData.perks 
    ? billData.perks.filter((perk: any) => perk.unused)
    : [];

  return (
    <div className="space-y-6">
      {/* Main recommendations card */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Personalized Recommendations</CardTitle>
          <CardDescription>
            Based on your {carrierType.charAt(0).toUpperCase() + carrierType.slice(1)} bill analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* US Mobile Plan Recommendation */}
          <div className="rounded-lg border p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-primary/10 p-2">
                  {networkIcons[recommendedCarrier.carrierId] || <Zap className="h-5 w-5" />}
                </div>
                <div>
                  <h3 className="font-medium">
                    {recommendedCarrier.plan?.carrierName || 'US Mobile'} {recommendedCarrier.plan?.name || 'Premium Plan'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {networkPreference === 'att' 
                      ? 'AT&T network' 
                      : networkPreference === 'tmobile' 
                        ? 'T-Mobile network' 
                        : 'Verizon network'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-primary">
                  Save {formatCurrency(recommendedCarrier.savings.monthlySavings)}/mo
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatCurrency(recommendedCarrier.savings.annualSavings)}/year
                </div>
              </div>
            </div>
            <div className="mt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">{numberOfLines} {numberOfLines === 1 ? 'line' : 'lines'} at {formatCurrency(recommendedCarrier.plan?.basePrice || 0)}/mo each</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">No contracts or hidden fees</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Premium network access</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Customizable plans</span>
                </div>
              </div>
            </div>
            <Button className="w-full mt-2">View Plan Details</Button>
          </div>

          {/* Additional Recommendations */}
          <div className="space-y-4">
            <h3 className="font-medium">Additional Recommendations</h3>
            
            {/* Device payment recommendations */}
            {hasDevicePayments && (
              <div className="rounded-lg border p-4">
                <h4 className="font-medium">Device Payment</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  You're currently paying for device installments. Consider bringing your own device to US Mobile to save more.
                </p>
              </div>
            )}
            
            {/* Optimize plan recommendations */}
            <div className="rounded-lg border p-4">
              <h4 className="font-medium">Optimize Your Plan</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Based on your usage, you could save by switching to {recommendedCarrier.plan?.carrierName || 'US Mobile'}'s {recommendedCarrier.plan?.name || 'Premium Plan'}.
              </p>
            </div>

            {/* Unused perks */}
            {unusedPerks.length > 0 && (
              <div className="rounded-lg border p-4">
                <h4 className="font-medium">Unused Benefits</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  You're paying for perks you're not using. Consider a simpler plan without these extras.
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {unusedPerks.map((perk: any, index: number) => (
                    <Badge key={index} variant="outline">{perk.name}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
