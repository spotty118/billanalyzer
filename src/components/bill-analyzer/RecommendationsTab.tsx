
import { Check, AlertCircle, Zap, Star, Lightbulb } from 'lucide-react';
import { supportedCarriers, alternativeCarrierPlans, findBestCarrierMatch } from "@/config/alternativeCarriers";

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

export function RecommendationsTab({ billData, formatCurrency, calculateCarrierSavings }: RecommendationsTabProps) {
  if (!billData) return <div>No bill data available</div>;
  
  // Calculate savings for each carrier to determine the best recommendation
  const carrierSavings = supportedCarriers.map(carrier => {
    const savings = calculateCarrierSavings(carrier.id);
    return {
      carrierId: carrier.id,
      carrierName: carrier.name,
      icon: carrier.icon,
      ...savings
    };
  });
  
  // Sort by highest monthly savings
  const sortedSavings = [...carrierSavings].sort((a, b) => b.monthlySavings - a.monthlySavings);
  
  // Get best recommendation (carrier with highest savings)
  const bestRecommendation = sortedSavings[0];
  
  // Get alternative plans (the other carriers)
  const alternativeSavings = sortedSavings.slice(1);
  
  // Generate reasons for recommendation based on plan features
  const matchedPlanId = findBestCarrierMatch(bestRecommendation.carrierId);
  const recommendedPlan = alternativeCarrierPlans.find(p => p.id === matchedPlanId);
  
  // Generate reasons based on real plan features
  const generateReasons = (plan: any) => {
    const reasons = [];
    
    if (plan.dataAllowance.premium === 'unlimited' || plan.dataAllowance.premium >= 100) {
      reasons.push("Generous high-speed data allocation");
    }
    
    if (plan.dataAllowance.hotspot && 
        (plan.dataAllowance.hotspot === 'unlimited' || 
         plan.dataAllowance.hotspot >= 30 || 
         typeof plan.dataAllowance.hotspot === 'string' && plan.dataAllowance.hotspot.includes('GB'))) {
      reasons.push("Substantial hotspot data included");
    }
    
    if (plan.streamingPerks && plan.streamingPerks.length > 0) {
      reasons.push("Includes valuable streaming perks");
    }
    
    if (plan.streamingQuality && plan.streamingQuality !== '480p') {
      reasons.push(`High-quality ${plan.streamingQuality} video streaming`);
    }
    
    if (plan.annualPrice) {
      reasons.push(`Annual payment option saves ${formatCurrency(plan.basePrice * 12 - plan.annualPrice)} per year`);
    }
    
    if (bestRecommendation.monthlySavings > 0) {
      reasons.push(`Save ${formatCurrency(bestRecommendation.monthlySavings)} monthly compared to current bill`);
    }
    
    if (plan.features && plan.features.length > 0) {
      const priorityFeatures = plan.features.filter(f => 
        f.toLowerCase().includes('priority') || 
        f.toLowerCase().includes('qci') || 
        f.toLowerCase().includes('premium')
      );
      
      if (priorityFeatures.length > 0) {
        reasons.push("Premium network priority for fast data speeds");
      }
    }
    
    // Add network-specific reason
    if (plan.network) {
      reasons.push(`Utilizes the ${plan.network} network for coverage`);
    }
    
    return reasons.slice(0, 4); // Limit to 4 reasons
  };
  
  // Generate pros and cons for alternative plans
  const generateProsAndCons = (plan: any, carrier: any) => {
    const pros = [];
    const cons = [];
    
    // Add savings as pro if positive
    if (carrier.monthlySavings > 0) {
      pros.push(`Save ${formatCurrency(carrier.monthlySavings)} monthly`);
    } else {
      cons.push(`Costs ${formatCurrency(Math.abs(carrier.monthlySavings))} more monthly`);
    }
    
    // Add network as pro or con based on perception (simplified for demo)
    if (plan.network === 'Verizon') {
      pros.push("Verizon network coverage");
    } else if (plan.network === 'T-Mobile') {
      pros.push("Fast T-Mobile 5G speeds");
      cons.push("Coverage may vary in rural areas");
    } else if (plan.network === 'AT&T') {
      pros.push("Reliable AT&T network");
    }
    
    // Add data-related pros/cons
    if (plan.dataAllowance.premium === 'unlimited') {
      pros.push("Unlimited premium data");
    } else if (typeof plan.dataAllowance.premium === 'number') {
      if (plan.dataAllowance.premium >= 50) {
        pros.push(`${plan.dataAllowance.premium}GB premium data`);
      } else {
        cons.push(`Limited to ${plan.dataAllowance.premium}GB premium data`);
      }
    }
    
    // Add hotspot as pro/con
    if (plan.dataAllowance.hotspot) {
      if (plan.dataAllowance.hotspot === 'unlimited' || 
          typeof plan.dataAllowance.hotspot === 'string' && plan.dataAllowance.hotspot.includes('GB')) {
        pros.push(`Generous hotspot data`);
      } else if (typeof plan.dataAllowance.hotspot === 'number' && plan.dataAllowance.hotspot >= 15) {
        pros.push(`${plan.dataAllowance.hotspot}GB hotspot data`);
      } else {
        cons.push(`Limited hotspot data`);
      }
    } else {
      cons.push("No hotspot data included");
    }
    
    // Add streaming quality as pro/con
    if (plan.streamingQuality === '4K' || plan.streamingQuality === 'QHD' || plan.streamingQuality === '1080p') {
      pros.push(`${plan.streamingQuality} streaming quality`);
    } else {
      cons.push(`Limited to ${plan.streamingQuality} streaming quality`);
    }
    
    // Add annual option as pro if available
    if (plan.annualPrice) {
      pros.push("Annual payment option for greater savings");
    }
    
    // Ensure we have at least 2 pros and 2 cons
    while (pros.length < 2) pros.push(plan.features?.[pros.length] || "Flexible plan structure");
    while (cons.length < 2) cons.push("May require network adjustment" || "New carrier onboarding process");
    
    return {
      pros: pros.slice(0, 3),
      cons: cons.slice(0, 3)
    };
  };
  
  const getCarrierIcon = (iconName: string) => {
    switch (iconName) {
      case 'Star': return <Star className="w-5 h-5 text-blue-600" />;
      case 'Zap': return <Zap className="w-5 h-5 text-blue-600" />;
      case 'Lightbulb': return <Lightbulb className="w-5 h-5 text-blue-600" />;
      default: return null;
    }
  };
  
  // Create the real recommendation data
  const planRecommendation = {
    recommendedPlan: `${bestRecommendation.carrierName} ${bestRecommendation.planName}`,
    reasons: recommendedPlan ? generateReasons(recommendedPlan) : [
      "Best overall value", 
      "Compatible with your usage patterns",
      "Significant cost savings"
    ],
    estimatedMonthlySavings: bestRecommendation.monthlySavings,
    confidenceScore: bestRecommendation.monthlySavings > 0 ? 0.85 : 0.65,
    alternativePlans: alternativeSavings.map(carrier => {
      const planId = findBestCarrierMatch(carrier.carrierId);
      const plan = alternativeCarrierPlans.find(p => p.id === planId);
      
      const { pros, cons } = plan ? generateProsAndCons(plan, carrier) : {
        pros: ["Competitive pricing", "Flexible plan structure"],
        cons: ["May require network adjustment", "Different coverage area"]
      };
      
      return {
        name: `${carrier.carrierName} ${carrier.planName}`,
        monthlyCost: carrier.price,
        pros,
        cons,
        estimatedSavings: carrier.monthlySavings
      };
    })
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center mb-4">
          <div className="p-2 rounded-full bg-blue-100 mr-4">
            {getCarrierIcon(bestRecommendation.icon) || <Check className="w-6 h-6 text-blue-600" />}
          </div>
          <h3 className="font-bold text-xl">Recommended Plan</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="col-span-2">
            <h4 className="text-lg font-semibold mb-2">{planRecommendation.recommendedPlan}</h4>
            
            <h5 className="font-medium text-gray-700 mt-4 mb-2">Why this plan?</h5>
            <ul className="space-y-2">
              {planRecommendation.reasons.map((reason: string, index: number) => (
                <li key={index} className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="flex flex-col justify-center items-center p-6 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700 mb-2">Estimated Monthly Savings</p>
            <p className={`text-3xl font-bold ${planRecommendation.estimatedMonthlySavings > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {planRecommendation.estimatedMonthlySavings > 0 
                ? formatCurrency(planRecommendation.estimatedMonthlySavings) 
                : `-${formatCurrency(Math.abs(planRecommendation.estimatedMonthlySavings))}`}
            </p>
            <div className="w-full mt-4 bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${planRecommendation.confidenceScore * 100}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {Math.round(planRecommendation.confidenceScore * 100)}% confidence
            </p>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="font-bold text-lg mb-4">Alternative Plans</h3>
        
        {planRecommendation.alternativePlans.map((plan: any, index: number) => (
          <div key={index} className="mb-4 p-4 border border-gray-200 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-semibold text-lg">{plan.name}</h4>
              <div className="text-right">
                <p className="text-sm text-gray-500">Monthly Cost</p>
                <p className="font-semibold">{formatCurrency(plan.monthlyCost)}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <h5 className="font-medium text-green-700 mb-2">Pros</h5>
                <ul className="space-y-1">
                  {plan.pros.map((pro: string, i: number) => (
                    <li key={i} className="flex items-start">
                      <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>{pro}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h5 className="font-medium text-red-700 mb-2">Cons</h5>
                <ul className="space-y-1">
                  {plan.cons.map((con: string, i: number) => (
                    <li key={i} className="flex items-start">
                      <AlertCircle className="w-4 h-4 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>{con}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="mt-3 pt-2 border-t border-gray-100">
              <p className={`text-right ${plan.estimatedSavings > 0 ? 'text-green-600' : 'text-red-600'} font-medium`}>
                {plan.estimatedSavings > 0 
                  ? `Save ${formatCurrency(plan.estimatedSavings)} monthly` 
                  : `Costs ${formatCurrency(Math.abs(plan.estimatedSavings))} more monthly`}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
