
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, ArrowRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RecommendationsTabProps {
  billData: any;
  formatCurrency: (value: number) => string;
  networkPreference?: string | null;
  carrierType?: string;
}

export function RecommendationsTab({ 
  billData,
  formatCurrency,
  networkPreference,
  carrierType = "verizon"
}: RecommendationsTabProps) {
  const recommendations = billData?.recommendations || [];
  const insights = billData?.marketInsights || {};
  const advice = billData?.personalizedAdvice || '';
  
  if (!billData || recommendations.length === 0) {
    return (
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Recommended Plans</CardTitle>
          <CardDescription>
            Based on your {carrierType.charAt(0).toUpperCase() + carrierType.slice(1)} usage patterns and preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-muted-foreground">
              {billData ? 
                "We're still analyzing your bill to generate personalized recommendations." :
                "No bill data available. Please upload a bill or enter line details to see recommendations."}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const handleViewPlan = (planName: string, carrier: string) => {
    console.log(`Viewing plan: ${planName} from ${carrier}`);
    // Open a new tab with the plan details
    const carrierUrls: Record<string, string> = {
      "US Mobile Warp 5G": "https://www.usmobile.com/plans",
      "US Mobile Lightspeed 5G": "https://www.usmobile.com/plans",
      "US Mobile DarkStar 5G": "https://www.usmobile.com/plans",
      "Visible+": "https://www.visible.com/plans",
      "Cricket Wireless": "https://www.cricketwireless.com/cell-phone-plans",
      "Total Wireless": "https://www.totalwireless.com/plans",
      "verizon": "https://www.verizon.com/plans/",
      "att": "https://www.att.com/plans/wireless/",
      "tmobile": "https://www.t-mobile.com/cell-phone-plans",
      "xfinity": "https://www.xfinity.com/mobile/plans",
      "visible": "https://www.visible.com/plans",
      "cricket": "https://www.cricketwireless.com/cell-phone-plans",
      "metropcs": "https://www.metrobyt-mobile.com/cell-phone-plans",
      "boost": "https://www.boostmobile.com/plans"
    };
    
    const url = carrierUrls[carrier] || `https://www.google.com/search?q=${encodeURIComponent(`${carrier} ${planName} plan`)}`;
    window.open(url, '_blank');
  };
  
  const handleComparePlans = (planName: string, carrier: string) => {
    console.log(`Comparing plan: ${planName} from ${carrier} with other plans`);
    // For now, we'll just open the carrier's plan comparison page
    const compareUrls: Record<string, string> = {
      "US Mobile Warp 5G": "https://www.usmobile.com/plans",
      "US Mobile Lightspeed 5G": "https://www.usmobile.com/plans",
      "US Mobile DarkStar 5G": "https://www.usmobile.com/plans",
      "Visible+": "https://www.visible.com/plans",
      "Cricket Wireless": "https://www.cricketwireless.com/cell-phone-plans",
      "Total Wireless": "https://www.totalwireless.com/plans"
    };
    
    const url = compareUrls[carrier] || `https://www.whistleout.com/CellPhones/Search?mins=0&sms=0&data=0&simonly=true`;
    window.open(url, '_blank');
  };
  
  const handleLearnMore = (carrier: string) => {
    console.log(`Learning more about: ${carrier}`);
    // Open carrier's website in a new tab
    const learnMoreUrls: Record<string, string> = {
      "US Mobile Warp 5G": "https://www.usmobile.com/about",
      "US Mobile Lightspeed 5G": "https://www.usmobile.com/about",
      "US Mobile DarkStar 5G": "https://www.usmobile.com/about",
      "Visible+": "https://www.visible.com/about",
      "Cricket Wireless": "https://www.cricketwireless.com/why-cricket",
      "Total Wireless": "https://www.totalwireless.com/why-total-wireless",
      "Verizon": "https://www.verizon.com/about",
      "AT&T": "https://www.att.com/about",
      "T-Mobile": "https://www.t-mobile.com/about-us"
    };
    
    const url = learnMoreUrls[carrier] || `https://www.google.com/search?q=${encodeURIComponent(`${carrier} wireless carrier`)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Recommended Plans</CardTitle>
          <CardDescription>
            Based on your {carrierType.charAt(0).toUpperCase() + carrierType.slice(1)} usage patterns and preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {recommendations.map((recommendation: any, index: number) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold">{recommendation.carrier}</h3>
                    <p className="text-sm text-muted-foreground">{recommendation.planName} Plan</p>
                    <div className="flex items-center text-sm text-blue-600 mt-1">
                      <span>{recommendation.network?.charAt(0).toUpperCase() + recommendation.network?.slice(1) || 'Unknown'} Network</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">${recommendation.monthlyPrice}/mo</div>
                    {recommendation.originalPrice && recommendation.originalPrice > recommendation.monthlyPrice && (
                      <div className="text-sm line-through text-gray-400">${recommendation.originalPrice}/mo</div>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {recommendation.features && recommendation.features.map((feature: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
                
                {recommendation.reasons && recommendation.reasons.length > 0 && (
                  <div className="bg-blue-50 p-3 rounded-md">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">Why this plan is recommended for you:</h4>
                    <ul className="space-y-1">
                      {recommendation.reasons.map((reason: string, idx: number) => (
                        <li key={idx} className="text-sm text-blue-700 flex items-start gap-2">
                          <ArrowRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {(recommendation.pros?.length > 0 || recommendation.cons?.length > 0) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recommendation.pros?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-green-800 mb-1">Pros</h4>
                        <ul className="space-y-1">
                          {recommendation.pros.map((pro: string, idx: number) => (
                            <li key={idx} className="text-sm flex items-start gap-2">
                              <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span>{pro}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {recommendation.cons?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-red-800 mb-1">Cons</h4>
                        <ul className="space-y-1">
                          {recommendation.cons.map((con: string, idx: number) => (
                            <li key={idx} className="text-sm flex items-start gap-2">
                              <span className="text-red-500 font-medium mt-0.5 flex-shrink-0">•</span>
                              <span>{con}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="pt-2 flex flex-wrap gap-2">
                  <Button 
                    variant="default" 
                    onClick={() => handleViewPlan(recommendation.planName, recommendation.carrier)}
                    className="flex-1"
                  >
                    View Plan
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleComparePlans(recommendation.planName, recommendation.carrier)}
                    className="flex-1"
                  >
                    Compare Plans
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={() => handleLearnMore(recommendation.carrier)}
                    className="flex items-center gap-1"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Learn More
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          {advice && (
            <div className="bg-amber-50 p-4 rounded-lg mt-6 border border-amber-200">
              <h3 className="font-medium text-amber-800 mb-2">Personalized Advice</h3>
              <p className="text-sm text-amber-700">{advice}</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {Object.keys(insights).length > 0 && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Market Insights</CardTitle>
            <CardDescription>
              Latest trends and promotions in the wireless market
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights.currentPromos && insights.currentPromos.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Current Promotions</h3>
                  <ul className="space-y-1">
                    {insights.currentPromos.map((promo: string, idx: number) => (
                      <li key={idx} className="text-sm flex items-start gap-2">
                        <span className="text-blue-500 font-medium mt-0.5 flex-shrink-0">•</span>
                        <span>{promo}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {insights.trendingPlans && insights.trendingPlans.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Trending Plans</h3>
                  <ul className="space-y-1">
                    {insights.trendingPlans.map((plan: string, idx: number) => (
                      <li key={idx} className="text-sm flex items-start gap-2">
                        <span className="text-purple-500 font-medium mt-0.5 flex-shrink-0">•</span>
                        <span>{plan}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {insights.networkPerformance && Object.keys(insights.networkPerformance).length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Network Performance</h3>
                  <div className="space-y-2">
                    {Object.entries(insights.networkPerformance).map(([network, performance]) => (
                      <div key={network} className="text-sm">
                        <span className="font-medium">{network.charAt(0).toUpperCase() + network.slice(1)}:</span> {performance}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
