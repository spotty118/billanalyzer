
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckIcon, XIcon, RefreshCw } from "lucide-react";
import { Progress } from "@/components/ui/progress";
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
  const [topRecommendation, setTopRecommendation] = useState<any | null>(null);
  const [aiRecommendations, setAiRecommendations] = useState<AIRecommendationsData | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
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
      toast.success("Got fresh carrier recommendations!");
      
    } catch (error) {
      console.error("Error fetching AI recommendations:", error);
      toast.error("Failed to get AI recommendations. Using standard recommendations instead.");
    } finally {
      setIsLoadingAI(false);
      setProgress(100);
    }
  };

  const generateQCIRecommendation = () => {
    if (billData) {
      const lineCount = billData.phoneLines?.length || 1;
      console.log(`Generating QCI-8 recommendation for ${lineCount} lines from imported bill data`);
      
      // First, determine the best carrier based on network preference
      let bestCarrierId: string;
      
      if (networkPreference && networkToCarrierMap[networkPreference as ValidNetworkPreference]) {
        bestCarrierId = networkToCarrierMap[networkPreference as ValidNetworkPreference];
      } else {
        // Default to the first supported carrier if no preference
        bestCarrierId = supportedCarriers[0].id;
      }
      
      const carrier = supportedCarriers.find(c => c.id === bestCarrierId) || supportedCarriers[0];
      const plans = alternativeCarrierPlans.filter(plan => plan.carrierId === carrier.id);
      const selectedPlan = plans.find(plan => plan.name.includes('Premium')) || plans[0];
      
      if (!selectedPlan) return null;
      
      const currentBillAmount = billData.totalAmount || 0;
      const planBasePrice = selectedPlan.basePrice;
      const totalPlanPrice = planBasePrice * lineCount;
      const monthlySavings = currentBillAmount - totalPlanPrice;
      const annualSavings = monthlySavings * 12;
      
      const features: FeaturesList = selectedPlan.features || [];
      
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
      
      // Generate default reasons, pros, and cons
      let reasons: string[] = [];
      let pros: string[] = [];
      let cons: string[] = [];
      
      if (lineCount > 1) {
        reasons.push(`Calculated for your ${lineCount} lines`);
      }
      
      if (carrier.id === "warp") {
        reasons.push("QCI 8 Priority Data on Verizon's network");
        reasons.push("Unlimited premium data with no speed caps");
        pros.push("QCI 8 Priority Data (same as Verizon postpaid)");
        pros.push("No contracts or hidden fees");
        pros.push("Uses Verizon's reliable nationwide network");
        if (networkPreference === 'verizon') {
          pros.push("Optimized for your preferred network coverage");
        }
        cons.push("May have different coverage in some rural areas");
      } else if (carrier.id === "lightspeed") {
        reasons.push("QCI 7 Priority Data on T-Mobile's network");
        reasons.push("Fast 5G speeds with premium data priority");
        pros.push("QCI 7 Priority Data (higher than T-Mobile prepaid)");
        pros.push("Great international options");
        pros.push("Affordable pricing with premium features");
        if (networkPreference === 'tmobile') {
          pros.push("Optimized for your preferred network coverage");
        }
        cons.push("Coverage may vary in rural areas");
      } else if (carrier.id === "darkstar") {
        reasons.push("QCI 8 Priority Data on AT&T's network");
        reasons.push("Reliable coverage with premium data priority");
        pros.push("QCI 8 Priority Data (same as AT&T postpaid)");
        pros.push("Premium data priority");
        pros.push("Extensive hotspot data");
        if (networkPreference === 'att') {
          pros.push("Optimized for your preferred network coverage");
        }
        cons.push("Limited international roaming compared to other options");
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
        score: (pros.length * 2) - cons.length,
        isQCI: true
      };
    }
    
    return null;
  };

  useEffect(() => {
    // Generate the top QCI recommendation
    const qciRec = generateQCIRecommendation();
    if (qciRec) {
      setTopRecommendation(qciRec);
    }
    
    // Fetch AI recommendations on initial load
    if (!aiRecommendations && !isLoadingAI) {
      fetchAIRecommendations();
    }
  }, [billData, calculateCarrierSavings, networkPreference, aiRecommendations, isLoadingAI]);

  const getCarrierRank = (rec: any, recommendations: any[]): number => {
    if (rec.preferred) {
      let preferredRank = 1;
      const prefCarriers = recommendations.filter(r => r.preferred);
      
      if (prefCarriers.length > 1) {
        const sortedPrefCarriers = [...prefCarriers].sort((a, b) => {
          const aScore = (a.pros.length * 2) - a.cons.length;
          const bScore = (b.pros.length * 2) - b.cons.length;
          
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
        const aScore = (a.pros.length * 2) - a.cons.length;
        const bScore = (b.pros.length * 2) - b.cons.length;
        
        if (aScore !== bScore) {
          return bScore - aScore;
        }
        
        return b.annualSavings - a.annualSavings;
      });
      
      rank = sortedNonPrefCarriers.findIndex(c => c.carrierId === rec.carrierId) + 1;
      return rank;
    }
  };

  const renderQCIRecommendation = () => {
    if (!topRecommendation) return null;
    
    return (
      <Card className="border-2 border-blue-500 shadow-lg mb-6">
        <CardHeader className="pb-2 bg-blue-50">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{topRecommendation.logo}</span>
              <CardTitle>{topRecommendation.carrier}</CardTitle>
            </div>
            <Badge className="bg-blue-600 hover:bg-blue-700">
              QCI Priority Data Plan
            </Badge>
          </div>
          <CardDescription className="font-medium">{topRecommendation.planName}</CardDescription>
        </CardHeader>
        <CardContent className="py-2">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Price per Line</p>
              <p className="text-lg font-bold">{formatCurrency(topRecommendation.monthlyPrice)}</p>
              {topRecommendation.lineCount > 1 && (
                <p className="text-sm text-gray-500">
                  Total for {topRecommendation.lineCount} lines: {formatCurrency(topRecommendation.totalMonthlyPrice)}
                </p>
              )}
            </div>
            
            {topRecommendation.annualSavings > 0 && (
              <div>
                <p className="text-sm text-gray-500">Potential Savings</p>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(topRecommendation.monthlySavings)}/mo ({formatCurrency(topRecommendation.annualSavings)}/yr)
                </p>
              </div>
            )}
            
            <div>
              <p className="text-sm font-medium">Why we recommend this:</p>
              <ul className="mt-1 space-y-1 text-sm">
                {topRecommendation.reasons.map((reason: string, i: number) => (
                  <li key={i} className="flex items-start">
                    <span className="mr-1.5 text-blue-500">•</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            {topRecommendation.features && topRecommendation.features.length > 0 && (
              <div>
                <p className="text-sm font-medium text-blue-600">Included Features</p>
                <ul className="mt-1 space-y-1 text-sm">
                  {topRecommendation.features.map((feature: string, i: number) => (
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
                  {topRecommendation.pros.map((pro: string, i: number) => (
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
                  {topRecommendation.cons.map((con: string, i: number) => (
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
        <CardFooter className="bg-blue-50">
          <Button className="w-full">
            Get More Details
          </Button>
        </CardFooter>
      </Card>
    );
  };

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
        {/* Personal Advice Card at the top */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold mb-2">Personalized Advice</h3>
          <p className="text-gray-700">{aiRecommendations.personalizedAdvice}</p>
        </div>
        
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
                annualSavings: billData.totalAmount * 12 - (r.monthlyPrice * 12)
              }));
              
              const actualRec = {
                ...rec,
                preferred: isPreferred,
                carrierId: rec.carrier
              };
              
              const actualRank = getCarrierRank(actualRec, aiRecs);
              
              return (
                <Card key={index} className={`border ${isPreferred ? 'border-green-400 shadow-md' : 'border-gray-200'}`}>
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
                        {isPreferred ? (
                          <Badge className="bg-green-500 hover:bg-green-600">
                            {actualRank === 1 ? "Best Network Match" : `${getOrdinalSuffix(actualRank)} Best Match`}
                          </Badge>
                        ) : (
                          <Badge className={
                            actualRank === 1 ? "bg-blue-700 hover:bg-blue-800" : 
                            actualRank === 2 ? "bg-blue-600 hover:bg-blue-700" : 
                            actualRank === 3 ? "bg-blue-500 hover:bg-blue-600" : 
                            actualRank === 4 ? "bg-blue-400 hover:bg-blue-500" : "bg-blue-300 hover:bg-blue-400"
                          }>
                            {getOrdinalSuffix(actualRank)} Best Value
                          </Badge>
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
                    <Button className="w-full" variant={isPreferred ? "default" : "outline"}>
                      Get More Details
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
        
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
          Based on your current bill with {billData.phoneLines?.length || 1} lines, usage patterns, and network preferences, here are our recommendations to help you save:
        </p>
        
        {/* Always show the QCI recommendation at the top */}
        {renderQCIRecommendation()}
        
        {/* Show AI recommendations */}
        {renderAIRecommendations()}
      </div>
    </div>
  );
}
