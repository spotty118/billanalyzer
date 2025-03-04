import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckIcon, XIcon } from "lucide-react";
import { NetworkPreference } from './VerizonBillAnalyzer';
import { alternativeCarrierPlans } from '@/config/alternativeCarriers';

interface RecommendationsTabProps {
  billData: any;
  formatCurrency: (value: number) => string;
  calculateCarrierSavings: (carrierId: string) => {
    monthlySavings: number;
    annualSavings: number;
    planName: string;
    price: number;
  };
  networkPreference?: NetworkPreference;
}

// Only include US Mobile sub-brands
const carriers = [
  { id: "warp", name: "US Mobile Warp", logo: "🌀", network: "verizon" },
  { id: "lightspeed", name: "US Mobile LightSpeed", logo: "⚡", network: "tmobile" },
  { id: "darkstar", name: "US Mobile DarkStar", logo: "★", network: "att" },
];

const networkToCarrierMap = {
  verizon: "warp",
  tmobile: "lightspeed",
  att: "darkstar"
};

// Define a type for the features array
type FeaturesList = string[];

export function RecommendationsTab({ 
  billData, 
  formatCurrency, 
  calculateCarrierSavings,
  networkPreference
}: RecommendationsTabProps) {
  const [recommendations, setRecommendations] = useState<any[]>([]);

  useEffect(() => {
    if (billData) {
      let carriersForRecommendation = [...carriers];
      
      if (networkPreference && networkToCarrierMap[networkPreference]) {
        const preferredCarrierId = networkToCarrierMap[networkPreference];
        const preferredCarrierIndex = carriersForRecommendation.findIndex(c => c.id === preferredCarrierId);
        
        if (preferredCarrierIndex !== -1) {
          const preferredCarrier = carriersForRecommendation[preferredCarrierIndex];
          carriersForRecommendation.splice(preferredCarrierIndex, 1);
          carriersForRecommendation.unshift(preferredCarrier);
        }
      }
      
      // Find all premium plans to ensure price consistency
      const premiumPlans = alternativeCarrierPlans.filter(plan => plan.name.includes('Premium'));
      // Ensure all Premium plans have the same base price
      const consistentBasePrice = premiumPlans[0]?.basePrice || 44;
      
      const allRecommendations = carriersForRecommendation.map(carrier => {
        const savings = calculateCarrierSavings(carrier.id);
        
        let reasons: string[] = [];
        let pros: string[] = [];
        let cons: string[] = [];
        
        // Find the carrier's plans in the alternativeCarrierPlans data
        const carrierPlans = alternativeCarrierPlans.filter(plan => plan.carrierId === carrier.id);
        const premiumPlan = carrierPlans.find(plan => plan.name.includes('Premium'));
        
        // Get features for this carrier from the alternativeCarrierPlans data
        let features: FeaturesList = [];
        if (premiumPlan) {
          features = premiumPlan.features;
        }
        
        if (carrier.id === "warp") {
          reasons.push("Unlimited data with no speed caps on Verizon's network");
          pros.push("No contracts or hidden fees");
          pros.push("Uses Verizon's reliable nationwide network");
          if (networkPreference === 'verizon') {
            pros.push("Optimized for your preferred network coverage");
          }
          cons.push("May have different coverage in some rural areas");
        } else if (carrier.id === "lightspeed") {
          reasons.push("Fast 5G speeds on T-Mobile's network");
          pros.push("Great international options");
          pros.push("Affordable pricing with premium features");
          if (networkPreference === 'tmobile') {
            pros.push("Optimized for your preferred network coverage");
          }
          cons.push("Coverage may vary in rural areas");
        } else if (carrier.id === "darkstar") {
          reasons.push("Reliable coverage on AT&T's network");
          pros.push("Premium data priority");
          pros.push("Extensive hotspot data");
          if (networkPreference === 'att') {
            pros.push("Optimized for your preferred network coverage");
          }
          cons.push("Limited international roaming compared to other options");
        }
        
        if (networkPreference && carrier.network === networkPreference) {
          reasons.unshift(`Recommended for ${networkPreference.toUpperCase()} coverage in your area`);
        }
        
        return {
          carrier: carrier.name,
          carrierId: carrier.id,
          logo: carrier.logo,
          planName: savings.planName,
          monthlySavings: savings.monthlySavings,
          annualSavings: savings.annualSavings,
          monthlyPrice: consistentBasePrice,
          preferred: networkPreference && carrier.network === networkPreference,
          reasons,
          pros,
          cons,
          features
        };
      });
      
      const sortedRecommendations = allRecommendations.sort((a, b) => {
        if (a.preferred && !b.preferred) return -1;
        if (!a.preferred && b.preferred) return 1;
        return b.annualSavings - a.annualSavings;
      }).filter(rec => rec.annualSavings > 0 || rec.preferred);
      
      setRecommendations(sortedRecommendations.length > 0 ? sortedRecommendations : [
        {
          carrier: "Current Plan",
          carrierId: "current",
          logo: "✓",
          planName: billData.phoneLines?.[0]?.planName || "Current Plan",
          monthlySavings: 0,
          annualSavings: 0,
          monthlyPrice: billData.totalAmount || 0,
          reasons: ["Your current plan appears to be competitive"],
          pros: ["No need to switch carriers", "Familiar billing"],
          cons: ["You may be missing perks from other carriers"],
          features: [] // Empty array of features for current plan
        }
      ]);
    }
  }, [billData, calculateCarrierSavings, networkPreference]);

  if (!billData) return <div>No bill data available</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-bold mb-4">Personalized Recommendations</h3>
        <p className="text-gray-600 mb-6">
          Based on your current bill, usage patterns, and network preferences, here are our recommendations to help you save:
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {recommendations.map((rec, index) => (
            <Card key={index} className={`border ${index === 0 ? 'border-blue-400 shadow-md' : 'border-gray-200'}`}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{rec.logo}</span>
                    <CardTitle>{rec.carrier}</CardTitle>
                  </div>
                  <div className="flex gap-2">
                    {rec.preferred && (
                      <Badge className="bg-green-500">Best Network Match</Badge>
                    )}
                    {index === 0 && !rec.preferred && (
                      <Badge className="bg-blue-500">Best Value</Badge>
                    )}
                  </div>
                </div>
                <CardDescription>{rec.planName}</CardDescription>
              </CardHeader>
              <CardContent className="py-2">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Monthly Price</p>
                    <p className="text-lg font-bold">{formatCurrency(rec.monthlyPrice)}</p>
                  </div>
                  
                  {rec.annualSavings > 0 && (
                    <div>
                      <p className="text-sm text-gray-500">Potential Savings</p>
                      <p className="text-lg font-bold text-green-600">
                        {formatCurrency(rec.monthlySavings)}/mo ({formatCurrency(rec.annualSavings)}/yr)
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-sm font-medium">Why we recommend this:</p>
                    <ul className="mt-1 space-y-1 text-sm">
                      {rec.reasons.map((reason: string, i: number) => (
                        <li key={i} className="flex items-start">
                          <span className="mr-1.5 text-blue-500">•</span>
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Added section to display included features */}
                  {rec.features && rec.features.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-blue-600">Included Features</p>
                      <ul className="mt-1 space-y-1 text-sm">
                        {rec.features.map((feature: string, i: number) => (
                          <li key={i} className="flex items-start">
                            <span className="mr-1.5 text-blue-500">→</span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-green-600">Pros</p>
                      <ul className="mt-1 space-y-1 text-sm">
                        {rec.pros.map((pro: string, i: number) => (
                          <li key={i} className="flex items-start">
                            <CheckIcon className="h-4 w-4 mr-1.5 text-green-500 flex-shrink-0" />
                            <span>{pro}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-red-600">Cons</p>
                      <ul className="mt-1 space-y-1 text-sm">
                        {rec.cons.map((con: string, i: number) => (
                          <li key={i} className="flex items-start">
                            <XIcon className="h-4 w-4 mr-1.5 text-red-500 flex-shrink-0" />
                            <span>{con}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" variant={index === 0 ? "default" : "outline"}>
                  Get More Details
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
