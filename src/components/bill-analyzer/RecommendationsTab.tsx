
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckIcon, XIcon } from "lucide-react";

interface RecommendationsTabProps {
  billData: any;
  formatCurrency: (value: number) => string;
  calculateCarrierSavings: (carrierId: string) => {
    monthlySavings: number;
    annualSavings: number;
    planName: string;
    price: number;
  };
}

const carriers = [
  { id: "warp", name: "Warp", logo: "🌀" },
  { id: "usmobile", name: "US Mobile", logo: "🇺🇸" },
  { id: "verizon", name: "Verizon", logo: "✓" },
  { id: "tmobile", name: "T-Mobile", logo: "📱" },
  { id: "att", name: "AT&T", logo: "🔵" },
];

export function RecommendationsTab({ 
  billData, 
  formatCurrency, 
  calculateCarrierSavings 
}: RecommendationsTabProps) {
  const [recommendations, setRecommendations] = useState<any[]>([]);

  useEffect(() => {
    if (billData) {
      // Calculate recommendations based on savings from each carrier
      const allRecommendations = carriers.map(carrier => {
        const savings = calculateCarrierSavings(carrier.id);
        
        // Generate meaningful reasons and pros/cons for each carrier
        let reasons = [];
        let pros = [];
        let cons = [];
        
        if (carrier.id === "warp") {
          reasons.push("Unlimited data with no speed caps");
          pros.push("No contracts or hidden fees");
          pros.push("Simple billing structure");
          cons.push("Newer carrier in the market");
        } else if (carrier.id === "usmobile") {
          reasons.push("Customizable plans to fit your needs");
          pros.push("Affordable pricing");
          pros.push("Works on multiple networks");
          cons.push("May not have as many perks as major carriers");
        } else if (carrier.id === "verizon") {
          reasons.push("Excellent coverage nationwide");
          pros.push("Premium network quality");
          pros.push("Many entertainment perks");
          cons.push("Generally higher pricing");
        } else if (carrier.id === "tmobile") {
          reasons.push("Aggressive pricing on family plans");
          pros.push("Free international data");
          pros.push("Netflix included in some plans");
          cons.push("Coverage may vary in rural areas");
        } else if (carrier.id === "att") {
          reasons.push("Wide network coverage");
          pros.push("HBO Max included with elite plans");
          pros.push("Strong rural coverage");
          cons.push("Higher prices compared to some alternatives");
        }
        
        return {
          carrier: carrier.name,
          carrierId: carrier.id,
          logo: carrier.logo,
          planName: savings.planName,
          monthlySavings: savings.monthlySavings,
          annualSavings: savings.annualSavings,
          monthlyPrice: savings.price,
          reasons,
          pros,
          cons
        };
      });
      
      // Sort by savings (highest first) and filter out negative savings
      const sortedRecommendations = allRecommendations
        .sort((a, b) => b.annualSavings - a.annualSavings)
        .filter(rec => rec.annualSavings > 0);
      
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
          cons: ["You may be missing perks from other carriers"]
        }
      ]);
    }
  }, [billData, calculateCarrierSavings]);

  if (!billData) return <div>No bill data available</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-bold mb-4">Personalized Recommendations</h3>
        <p className="text-gray-600 mb-6">
          Based on your current bill and usage patterns, here are our recommendations to help you save:
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
                  {index === 0 && <Badge className="bg-blue-500">Best Match</Badge>}
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
