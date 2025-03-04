import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckIcon, XIcon, RefreshCw } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NetworkPreference } from './VerizonBillAnalyzer';
import { alternativeCarrierPlans } from '@/config/alternativeCarriers';
import { toast } from "sonner";

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

// Updated to include Visible plans
const carriers = [
  { id: "warp", name: "US Mobile Warp", logo: "🌀", network: "verizon" },
  { id: "lightspeed", name: "US Mobile LightSpeed", logo: "⚡", network: "tmobile" },
  { id: "darkstar", name: "US Mobile DarkStar", logo: "★", network: "att" },
  { id: "visible", name: "Visible", logo: "👁️", network: "verizon" },
];

const networkToCarrierMap = {
  verizon: "warp",
  tmobile: "lightspeed",
  att: "darkstar"
};

// Define a type for the features array
type FeaturesList = string[];

interface AIRecommendation {
  carrier: string;
  planName: string;
  network: string;
  monthlyPrice: number;
  features: string[];
  reasons: string[];
  pros: string[];
  cons: string[];
}

interface AIRecommendationsData {
  recommendations: AIRecommendation[];
  marketInsights: {
    currentPromos: string[];
    trendingPlans: string[];
    networkPerformance: {
      verizon: string;
      tmobile: string;
      att: string;
    };
  };
  personalizedAdvice: string;
  meta?: {
    generatedAt: string;
    source: string;
    billDataTimestamp: string;
  };
}

export function RecommendationsTab({ 
  billData, 
  formatCurrency, 
  calculateCarrierSavings,
  networkPreference
}: RecommendationsTabProps) {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [aiRecommendations, setAiRecommendations] = useState<AIRecommendationsData | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [activeTab, setActiveTab] = useState("standard");
  const [progress, setProgress] = useState(0);

  // Function to fetch AI recommendations
  const fetchAIRecommendations = async () => {
    setIsLoadingAI(true);
    setProgress(10);
    
    try {
      // Get the anon key from environment or use a default
      const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nemZpb3VhbWlkYXFjdG5xbnJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkyMzE3NjQsImV4cCI6MjA1NDgwNzc2NH0._0hxm1UlSMt3wPx8JwaFDvGmpfjI3p5m0HDm6YfaL6Q';
      
      setProgress(30);
      toast.info("Getting fresh carrier data and recommendations...");
      
      const response = await fetch('https://mgzfiouamidaqctnqnre.supabase.co/functions/v1/ai-plan-recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`
        },
        body: JSON.stringify({
          billData,
          networkPreference
        })
      });
      
      setProgress(70);
      
      if (!response.ok) {
        throw new Error(`Failed to get AI recommendations: ${response.status}`);
      }
      
      const data = await response.json();
      setProgress(90);
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setAiRecommendations(data);
      setActiveTab("ai");
      toast.success("Got fresh carrier recommendations!");
      
    } catch (error) {
      console.error("Error fetching AI recommendations:", error);
      toast.error("Failed to get AI recommendations. Using standard recommendations instead.");
    } finally {
      setIsLoadingAI(false);
      setProgress(100);
    }
  };

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
      
      // Find all premium plans to ensure price consistency for each carrier
      const premiumPlans = alternativeCarrierPlans.filter(plan => plan.name.includes('Premium'));
      
      // Calculate savings amounts for all carriers
      const currentBillAmount = billData.totalAmount || 0;
      
      const allRecommendations = carriersForRecommendation.map(carrier => {
        // Get the carrier's savings (we'll only use this for the plan name)
        const carrierData = calculateCarrierSavings(carrier.id);
        
        let reasons: string[] = [];
        let pros: string[] = [];
        let cons: string[] = [];
        
        // Find the carrier's plans in the alternativeCarrierPlans data
        const carrierPlans = alternativeCarrierPlans.filter(plan => plan.carrierId === carrier.id);
        
        // For Visible, select Visible+ as default, for others select Premium plans
        let selectedPlan;
        if (carrier.id === "visible") {
          selectedPlan = carrierPlans.find(plan => plan.id === "visible-plus") || carrierPlans[0];
        } else {
          selectedPlan = carrierPlans.find(plan => plan.name.includes('Premium')) || carrierPlans[0];
        }
        
        if (!selectedPlan) return null;
        
        // Calculate savings based on selected plan's base price
        const planBasePrice = selectedPlan.basePrice;
        const lineCount = billData.phoneLines?.length || 1;
        const totalPlanPrice = planBasePrice * lineCount; // No multi-line discounts
        const monthlySavings = currentBillAmount - totalPlanPrice;
        const annualSavings = monthlySavings * 12;
        
        // Get features for this carrier from the alternativeCarrierPlans data
        let features: FeaturesList = [];
        if (selectedPlan) {
          features = selectedPlan.features;
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
        } else if (carrier.id === "visible") {
          reasons.push("Simple, all-inclusive pricing on Verizon's network");
          pros.push("No contracts, taxes and fees included");
          pros.push("Party Pay available for multi-line discounts");
          if (networkPreference === 'verizon') {
            pros.push("Uses your preferred Verizon network");
          }
          cons.push("Customer service is app/chat based");
          cons.push("Deprioritized during network congestion");
        }
        
        if (networkPreference && carrier.network === networkPreference) {
          reasons.unshift(`Recommended for ${networkPreference.toUpperCase()} coverage in your area`);
        }
        
        return {
          carrier: carrier.name,
          carrierId: carrier.id,
          logo: carrier.logo,
          planName: selectedPlan.name,
          monthlySavings,
          annualSavings,
          monthlyPrice: totalPlanPrice / lineCount, // Price per line
          preferred: networkPreference && carrier.network === networkPreference,
          reasons,
          pros,
          cons,
          features
        };
      }).filter(rec => rec !== null);
      
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
      
      // Auto-fetch AI recommendations if we have bill data
      if (!aiRecommendations && !isLoadingAI) {
        fetchAIRecommendations();
      }
    }
  }, [billData, calculateCarrierSavings, networkPreference, aiRecommendations, isLoadingAI]);

  const renderStandardRecommendations = () => (
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
  );

  const renderAIRecommendations = () => {
    if (isLoadingAI) {
      return (
        <div className="flex flex-col items-center justify-center p-10 space-y-4">
          <Progress value={progress} className="w-full" />
          <p className="text-gray-500">Getting the latest carrier data and generating recommendations...</p>
        </div>
      );
    }

    if (!aiRecommendations) {
      return (
        <div className="flex flex-col items-center justify-center p-10 space-y-4">
          <p className="text-gray-500">No AI recommendations available. Click refresh to get the latest data.</p>
          <Button onClick={fetchAIRecommendations} className="mt-4">
            <RefreshCw className="mr-2 h-4 w-4" />
            Get AI Recommendations
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        {/* Market Insights Panel */}
        <Card className="border border-blue-200 bg-blue-50/30">
          <CardHeader>
            <CardTitle className="text-blue-800">Market Insights</CardTitle>
            <CardDescription>
              Latest trends and promotions from our AI analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-blue-800 mb-2">Current Promotions</h4>
                <ul className="space-y-1">
                  {aiRecommendations.marketInsights.currentPromos.map((promo, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="mr-1.5 text-blue-500">•</span>
                      <span>{promo}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-blue-800 mb-2">Trending Plans</h4>
                  <ul className="space-y-1">
                    {aiRecommendations.marketInsights.trendingPlans.map((plan, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="mr-1.5 text-blue-500">→</span>
                        <span>{plan}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-blue-800 mb-2">Network Performance</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <Badge className="mr-2 bg-red-100 text-red-800 hover:bg-red-200">Verizon</Badge>
                      <span className="text-sm">{aiRecommendations.marketInsights.networkPerformance.verizon}</span>
                    </li>
                    <li className="flex items-start">
                      <Badge className="mr-2 bg-pink-100 text-pink-800 hover:bg-pink-200">T-Mobile</Badge>
                      <span className="text-sm">{aiRecommendations.marketInsights.networkPerformance.tmobile}</span>
                    </li>
                    <li className="flex items-start">
                      <Badge className="mr-2 bg-blue-100 text-blue-800 hover:bg-blue-200">AT&T</Badge>
                      <span className="text-sm">{aiRecommendations.marketInsights.networkPerformance.att}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Personalized Advice */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">Personalized Advice</h3>
          <p className="text-gray-700">{aiRecommendations.personalizedAdvice}</p>
        </div>

        {/* AI Recommendations */}
        <div>
          <h3 className="text-lg font-semibold mb-4">AI-Powered Recommendations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {aiRecommendations.recommendations.map((rec, index) => (
              <Card key={index} className={`border ${index === 0 ? 'border-blue-400 shadow-md' : 'border-gray-200'}`}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{
                        rec.network === 'verizon' ? '🌀' : 
                        rec.network === 'tmobile' ? '⚡' : 
                        rec.network === 'att' ? '★' : '📱'
                      }</span>
                      <CardTitle>{rec.carrier}</CardTitle>
                    </div>
                    <div className="flex gap-2">
                      {networkPreference === rec.network && (
                        <Badge className="bg-green-500">Best Network Match</Badge>
                      )}
                      {index === 0 && networkPreference !== rec.network && (
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
                    
                    {billData.totalAmount > rec.monthlyPrice && (
                      <div>
                        <p className="text-sm text-gray-500">Potential Monthly Savings</p>
                        <p className="text-lg font-bold text-green-600">
                          {formatCurrency(billData.totalAmount - rec.monthlyPrice)}/mo
                        </p>
                      </div>
                    )}
                    
                    <div>
                      <p className="text-sm font-medium">Why AI recommends this:</p>
                      <ul className="mt-1 space-y-1 text-sm">
                        {rec.reasons.map((reason: string, i: number) => (
                          <li key={i} className="flex items-start">
                            <span className="mr-1.5 text-blue-500">•</span>
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
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
        
        {/* Generated timestamp */}
        {aiRecommendations.meta && (
          <div className="text-xs text-gray-400 text-right mt-4">
            Data updated: {new Date(aiRecommendations.meta.generatedAt).toLocaleString()}
          </div>
        )}
      </div>
    );
  };

  if (!billData) return <div>No bill data available</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Personalized Recommendations</h3>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchAIRecommendations}
            disabled={isLoadingAI}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoadingAI ? 'animate-spin' : ''}`} />
            {isLoadingAI ? 'Updating...' : 'Refresh Data'}
          </Button>
        </div>
        
        <p className="text-gray-600 mb-6">
          Based on your current bill, usage patterns, and network preferences, here are our recommendations to help you save:
        </p>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-6">
            <TabsTrigger value="standard">Standard Recommendations</TabsTrigger>
            <TabsTrigger value="ai" disabled={isLoadingAI && !aiRecommendations}>
              AI-Powered Analysis
              {isLoadingAI && <RefreshCw className="ml-2 h-3 w-3 animate-spin" />}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="standard" className="mt-0">
            {renderStandardRecommendations()}
          </TabsContent>
          
          <TabsContent value="ai" className="mt-0">
            {renderAIRecommendations()}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
