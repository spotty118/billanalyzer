import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckIcon, XIcon, RefreshCw } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NetworkPreference } from './VerizonBillAnalyzer';
import { alternativeCarrierPlans, supportedCarriers } from '@/config/alternativeCarriers';
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
type ValidNetworkPreference = Exclude<NetworkPreference, null>;
const networkToCarrierMap: Record<ValidNetworkPreference, string> = {
  verizon: "warp",
  tmobile: "lightspeed",
  att: "darkstar"
};
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
  const getOrdinalSuffix = (n: number): string => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };
  const fetchAIRecommendations = async () => {
    setIsLoadingAI(true);
    setProgress(10);
    try {
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
  const sortRecommendations = (recommendations: any[]) => {
    return [...recommendations].sort((a, b) => {
      if (a.preferred && !b.preferred) return -1;
      if (!a.preferred && b.preferred) return 1;
      if (a.preferred === b.preferred) {
        const aScore = a.pros.length * 2 - a.cons.length;
        const bScore = b.pros.length * 2 - b.cons.length;
        if (aScore !== bScore) {
          return bScore - aScore;
        }
        return b.annualSavings - a.annualSavings;
      }
      return 0;
    });
  };
  const getCarrierNetwork = (carrierId: string): string => {
    const networkMap: Record<string, string> = {
      "warp": "verizon",
      "lightspeed": "tmobile",
      "darkstar": "att",
      "visible": "verizon",
      "cricket": "att",
      "straighttalk": "multi",
      "total": "verizon"
    };
    return networkMap[carrierId] || "";
  };
  const getCarrierRank = (rec: any, recommendations: any[]): number => {
    if (rec.preferred) {
      let preferredRank = 1;
      const prefCarriers = recommendations.filter(r => r.preferred);
      if (prefCarriers.length > 1) {
        const sortedPrefCarriers = [...prefCarriers].sort((a, b) => {
          const aScore = a.pros.length * 2 - a.cons.length;
          const bScore = b.pros.length * 2 - b.cons.length;
          if (aScore !== bScore) {
            return bScore - aScore;
          }
          return b.annualSavings - a.annualSavings;
        });
        preferredRank = sortedPrefCarriers.findIndex(c => c.carrierId === rec.carrierId) + 1;
      }
      return preferredRank;
    } else {
      const nonPrefCarriers = recommendations.filter(r => !r.preferred);
      let rank = 1;
      const sortedNonPrefCarriers = [...nonPrefCarriers].sort((a, b) => {
        const aScore = a.pros.length * 2 - a.cons.length;
        const bScore = b.pros.length * 2 - b.cons.length;
        if (aScore !== bScore) {
          return bScore - aScore;
        }
        return b.annualSavings - a.annualSavings;
      });
      rank = sortedNonPrefCarriers.findIndex(c => c.carrierId === rec.carrierId) + 1;
      return rank;
    }
  };
  const renderStandardRecommendations = () => <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {recommendations.map((rec, index) => {
      const actualRank = getCarrierRank(rec, recommendations);
      return <Card key={index} className={`border ${rec.preferred ? 'border-green-400 shadow-md' : 'border-gray-200'}`}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{rec.logo}</span>
                <CardTitle>{rec.carrier}</CardTitle>
              </div>
              <div className="flex gap-2">
                {rec.preferred ? <Badge className="bg-green-500 hover:bg-green-600">
                    {actualRank === 1 ? "Best Network Match" : `${getOrdinalSuffix(actualRank)} Best Match`}
                  </Badge> : <Badge className={actualRank === 1 ? "bg-blue-700 hover:bg-blue-800" : actualRank === 2 ? "bg-blue-600 hover:bg-blue-700" : actualRank === 3 ? "bg-blue-500 hover:bg-blue-600" : actualRank === 4 ? "bg-blue-400 hover:bg-blue-500" : "bg-blue-300 hover:bg-blue-400"}>
                    {getOrdinalSuffix(actualRank)} Best Value
                  </Badge>}
              </div>
            </div>
            <CardDescription>{rec.planName}</CardDescription>
          </CardHeader>
          <CardContent className="py-2">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Price per Line</p>
                <p className="text-lg font-bold">{formatCurrency(rec.monthlyPrice)}</p>
                {rec.lineCount > 1 && <p className="text-sm text-gray-500">
                    Total for {rec.lineCount} lines: {formatCurrency(rec.totalMonthlyPrice)}
                  </p>}
              </div>
              
              {rec.annualSavings > 0 && <div>
                  <p className="text-sm text-gray-500">Potential Savings</p>
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(rec.monthlySavings)}/mo ({formatCurrency(rec.annualSavings)}/yr)
                  </p>
                </div>}
              
              <div>
                <p className="text-sm font-medium">Why we recommend this:</p>
                <ul className="mt-1 space-y-1 text-sm">
                  {rec.reasons.map((reason: string, i: number) => <li key={i} className="flex items-start">
                      <span className="mr-1.5 text-blue-500">•</span>
                      <span>{reason}</span>
                    </li>)}
                </ul>
              </div>
              
              {rec.features && rec.features.length > 0 && <div>
                  <p className="text-sm font-medium text-blue-600">Included Features</p>
                  <ul className="mt-1 space-y-1 text-sm">
                    {rec.features.map((feature: string, i: number) => <li key={i} className="flex items-start">
                        <span className="mr-1.5 text-blue-500">→</span>
                        <span>{feature}</span>
                      </li>)}
                  </ul>
                </div>}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-green-600">Pros</p>
                  <ul className="mt-1 space-y-1 text-sm">
                    {rec.pros.map((pro: string, i: number) => <li key={i} className="flex items-start">
                        <CheckIcon className="h-4 w-4 mr-1.5 text-green-500 flex-shrink-0" />
                        <span>{pro}</span>
                      </li>)}
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-medium text-red-600">Cons</p>
                  <ul className="mt-1 space-y-1 text-sm">
                    {rec.cons.map((con: string, i: number) => <li key={i} className="flex items-start">
                        <XIcon className="h-4 w-4 mr-1.5 text-red-500 flex-shrink-0" />
                        <span>{con}</span>
                      </li>)}
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" variant={rec.preferred ? "default" : "outline"}>
              Get More Details
            </Button>
          </CardFooter>
        </Card>;
    })}
    </div>;
  const renderAIRecommendations = () => {
    if (isLoadingAI) {
      return <div className="flex flex-col items-center justify-center p-10 space-y-4">
          <Progress value={progress} className="w-full" />
          <p className="text-gray-500">Getting the latest carrier data and generating recommendations...</p>
        </div>;
    }
    if (!aiRecommendations) {
      return <div className="flex flex-col items-center justify-center p-10 space-y-4">
          <p className="text-gray-500">No AI recommendations available. Click refresh to get the latest data.</p>
          <Button onClick={fetchAIRecommendations} className="mt-4">
            <RefreshCw className="mr-2 h-4 w-4" />
            Get AI Recommendations
          </Button>
        </div>;
    }
    return <div className="space-y-8">
        
        
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">Personalized Advice</h3>
          <p className="text-gray-700">{aiRecommendations.personalizedAdvice}</p>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">AI-Powered Recommendations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {aiRecommendations.recommendations.map((rec, index) => {
            const isPreferred = networkPreference === rec.network;
            const aiRecs = aiRecommendations.recommendations.map(r => ({
              preferred: networkPreference === r.network,
              pros: r.pros,
              cons: r.cons,
              carrierId: r.carrier,
              annualSavings: billData.totalAmount * 12 - r.monthlyPrice * 12
            }));
            const actualRec = {
              ...rec,
              preferred: isPreferred,
              carrierId: rec.carrier
            };
            const actualRank = getCarrierRank(actualRec, aiRecs);
            return <Card key={index} className={`border ${isPreferred ? 'border-green-400 shadow-md' : 'border-gray-200'}`}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{rec.network === 'verizon' ? '🌀' : rec.network === 'tmobile' ? '⚡' : rec.network === 'att' ? '★' : '📱'}</span>
                        <CardTitle>{rec.carrier}</CardTitle>
                      </div>
                      <div className="flex gap-2">
                        {isPreferred ? <Badge className="bg-green-500 hover:bg-green-600">
                            {actualRank === 1 ? "Best Network Match" : `${getOrdinalSuffix(actualRank)} Best Match`}
                          </Badge> : <Badge className={actualRank === 1 ? "bg-blue-700 hover:bg-blue-800" : actualRank === 2 ? "bg-blue-600 hover:bg-blue-700" : actualRank === 3 ? "bg-blue-500 hover:bg-blue-600" : actualRank === 4 ? "bg-blue-400 hover:bg-blue-500" : "bg-blue-300 hover:bg-blue-400"}>
                            {getOrdinalSuffix(actualRank)} Best Value
                          </Badge>}
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
                      
                      {billData.totalAmount > rec.monthlyPrice && <div>
                          <p className="text-sm text-gray-500">Potential Monthly Savings</p>
                          <p className="text-lg font-bold text-green-600">
                            {formatCurrency(billData.totalAmount - rec.monthlyPrice)}/mo
                          </p>
                        </div>}
                      
                      <div>
                        <p className="text-sm font-medium">Why AI recommends this:</p>
                        <ul className="mt-1 space-y-1 text-sm">
                          {rec.reasons.map((reason: string, i: number) => <li key={i} className="flex items-start">
                              <span className="mr-1.5 text-blue-500">•</span>
                              <span>{reason}</span>
                            </li>)}
                        </ul>
                      </div>
                      
                      {rec.features && rec.features.length > 0 && <div>
                          <p className="text-sm font-medium text-blue-600">Included Features</p>
                          <ul className="mt-1 space-y-1 text-sm">
                            {rec.features.map((feature: string, i: number) => <li key={i} className="flex items-start">
                                <span className="mr-1.5 text-blue-500">→</span>
                                <span>{feature}</span>
                              </li>)}
                          </ul>
                        </div>}
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-green-600">Pros</p>
                          <ul className="mt-1 space-y-1 text-sm">
                            {rec.pros.map((pro: string, i: number) => <li key={i} className="flex items-start">
                                <CheckIcon className="h-4 w-4 mr-1.5 text-green-500 flex-shrink-0" />
                                <span>{pro}</span>
                              </li>)}
                          </ul>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-red-600">Cons</p>
                          <ul className="mt-1 space-y-1 text-sm">
                            {rec.cons.map((con: string, i: number) => <li key={i} className="flex items-start">
                                <XIcon className="h-4 w-4 mr-1.5 text-red-500 flex-shrink-0" />
                                <span>{con}</span>
                              </li>)}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" variant={isPreferred ? "default" : "outline"}>
                      Get More Details
                    </Button>
                  </CardFooter>
                </Card>;
          })}
          </div>
        </div>
        
        {aiRecommendations.meta && <div className="text-xs text-gray-400 text-right mt-4">
            Data updated: {new Date(aiRecommendations.meta.generatedAt).toLocaleString()}
          </div>}
      </div>;
  };
  useEffect(() => {
    if (billData) {
      let carriersForRecommendation = [...supportedCarriers];
      if (networkPreference && networkToCarrierMap[networkPreference as ValidNetworkPreference]) {
        carriersForRecommendation.sort((a, b) => {
          const aMatchesPreference = getCarrierNetwork(a.id) === networkPreference;
          const bMatchesPreference = getCarrierNetwork(b.id) === networkPreference;
          if (aMatchesPreference && !bMatchesPreference) return -1;
          if (!aMatchesPreference && bMatchesPreference) return 1;
          return 0;
        });
      }
      const currentBillAmount = billData.totalAmount || 0;
      const lineCount = billData.phoneLines?.length || 1;
      console.log(`Generating recommendations for ${lineCount} lines from imported bill data`);
      const allRecommendations = carriersForRecommendation.map(carrier => {
        const plans = alternativeCarrierPlans.filter(plan => plan.carrierId === carrier.id);
        let selectedPlan;
        if (carrier.id === "visible") {
          selectedPlan = plans.find(plan => plan.id === "visible-plus") || plans[0];
        } else if (carrier.id === "cricket") {
          selectedPlan = plans.find(plan => plan.id === "cricket-unlimited") || plans[0];
        } else if (carrier.id === "straighttalk") {
          selectedPlan = plans.find(plan => plan.id === "straighttalk-unlimited-plus") || plans[0];
        } else if (carrier.id === "total") {
          selectedPlan = plans.find(plan => plan.id === "total-unlimited") || plans[0];
        } else {
          selectedPlan = plans.find(plan => plan.name.includes('Premium')) || plans[0];
        }
        if (!selectedPlan) return null;
        const planBasePrice = selectedPlan.basePrice;
        const totalPlanPrice = planBasePrice * lineCount;
        const monthlySavings = currentBillAmount - totalPlanPrice;
        const annualSavings = monthlySavings * 12;
        let features: FeaturesList = [];
        if (selectedPlan) {
          features = selectedPlan.features;
        }
        let reasons: string[] = [];
        let pros: string[] = [];
        let cons: string[] = [];
        const networkMap: Record<string, string> = {
          "warp": "verizon",
          "lightspeed": "tmobile",
          "darkstar": "att",
          "visible": "verizon",
          "cricket": "att",
          "straighttalk": "multi",
          "total": "verizon"
        };
        const carrierNetwork = networkMap[carrier.id] || "verizon";
        const carrierLogoMap: Record<string, string> = {
          "warp": "🌀",
          "lightspeed": "⚡",
          "darkstar": "★",
          "visible": "👁️",
          "cricket": "🦗",
          "straighttalk": "💬",
          "total": "📱"
        };
        const carrierLogo = carrierLogoMap[carrier.id] || "📱";
        if (lineCount > 1) {
          reasons.push(`Calculated for your ${lineCount} lines`);
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
        } else if (carrier.id === "cricket") {
          reasons.push("AT&T network with HBO Max included");
          pros.push("HBO Max streaming service included");
          pros.push("Mexico & Canada usage included");
          if (networkPreference === 'att') {
            pros.push("Uses your preferred AT&T network");
          }
          cons.push("Speed capped at 8Mbps");
          cons.push("SD video streaming by default");
        } else if (carrier.id === "straighttalk") {
          reasons.push("Choose your network (Verizon, AT&T, or T-Mobile)");
          pros.push("Network flexibility - use the best in your area");
          pros.push("Available at Walmart and other retailers");
          if (networkPreference) {
            pros.push(`Can use your preferred ${networkPreference.toUpperCase()} network`);
          }
          cons.push("Higher per-line cost than some alternatives");
          cons.push("Limited international features");
        } else if (carrier.id === "total") {
          reasons.push("Verizon network with competitive pricing");
          pros.push("Widely available at retail stores");
          pros.push("International calling included");
          if (networkPreference === 'verizon') {
            pros.push("Uses your preferred Verizon network");
          }
          cons.push("Fewer premium features than postpaid plans");
          cons.push("Limited customer service options");
        }
        if (networkPreference && carrierNetwork === networkPreference) {
          reasons.unshift(`Recommended for ${networkPreference.toUpperCase()} coverage in your area`);
        }
        return {
          carrier: carrier.name,
          carrierId: carrier.id,
          logo: carrierLogo,
          planName: selectedPlan.name,
          monthlySavings,
          annualSavings,
          monthlyPrice: planBasePrice,
          totalMonthlyPrice: totalPlanPrice,
          lineCount,
          network: carrierNetwork,
          preferred: networkPreference && carrierNetwork === networkPreference,
          reasons,
          pros,
          cons,
          features,
          score: pros.length * 2 - cons.length
        };
      }).filter(rec => rec !== null);
      const sortedRecommendations = sortRecommendations(allRecommendations);
      const topRecommendations = sortedRecommendations.slice(0, 5);
      setRecommendations(topRecommendations.length > 0 ? topRecommendations : [{
        carrier: "Current Plan",
        carrierId: "current",
        logo: "✓",
        network: "verizon",
        planName: billData.phoneLines?.[0]?.planName || "Current Plan",
        monthlySavings: 0,
        annualSavings: 0,
        monthlyPrice: (billData.totalAmount || 0) / lineCount,
        totalMonthlyPrice: billData.totalAmount || 0,
        lineCount,
        reasons: ["Your current plan appears to be competitive"],
        pros: ["No need to switch carriers", "Familiar billing"],
        cons: ["You may be missing perks from other carriers"],
        features: []
      }]);
      if (!aiRecommendations && !isLoadingAI) {
        fetchAIRecommendations();
      }
    }
  }, [billData, calculateCarrierSavings, networkPreference, aiRecommendations, isLoadingAI]);
  if (!billData) return <div>No bill data available</div>;
  return <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          
          <Button variant="outline" size="sm" onClick={fetchAIRecommendations} disabled={isLoadingAI}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoadingAI ? 'animate-spin' : ''}`} />
            {isLoadingAI ? 'Updating...' : 'Refresh Data'}
          </Button>
        </div>
        
        
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto mb-6">
            
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
    </div>;
}