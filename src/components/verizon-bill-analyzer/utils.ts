
import { BillAnalysisResponse, BillData, PhoneLine, PotentialSaving } from './types';

// Transform the API response into the format expected by the component
export const transformAnalysisData = (analysisResult: BillAnalysisResponse): BillData => {
  // Generate usage analysis based on phone lines
  const usageAnalysis = {
    trend: 'stable',
    percentageChange: 0,
    avg_data_usage_gb: 15, // Estimated value based on plan types
    avg_talk_minutes: 250,
    avg_text_messages: 500
  };
  
  // Generate cost analysis based on total amount
  const costAnalysis = {
    averageMonthlyBill: analysisResult.totalAmount,
    projectedNextBill: analysisResult.totalAmount * 1.05, // Simple projection
    unusualCharges: [],
    potentialSavings: generatePotentialSavings(analysisResult.phoneLines, analysisResult.totalAmount)
  };
  
  // Generate plan recommendation
  const planRecommendation = generatePlanRecommendation(analysisResult.phoneLines, analysisResult.totalAmount);
  
  return {
    ...analysisResult,
    usageAnalysis,
    costAnalysis,
    planRecommendation
  };
};

// Generate potential savings recommendations
export const generatePotentialSavings = (phoneLines: PhoneLine[], totalAmount: number): PotentialSaving[] => {
  const potentialSavings: PotentialSaving[] = [];
  
  // Check for protection plans that might be redundant
  const protectionCosts = phoneLines.reduce((sum, line) => sum + (line.details.protection || 0), 0);
  if (protectionCosts > 0) {
    potentialSavings.push({
      description: "Optimize device protection plans",
      estimatedSaving: protectionCosts * 0.4
    });
  }
  
  // Check for plan optimization opportunities
  potentialSavings.push({
    description: "Switch to a more appropriate plan based on your usage",
    estimatedSaving: totalAmount * 0.15
  });
  
  // Check for autopay and paperless billing discounts
  potentialSavings.push({
    description: "Enable autopay and paperless billing",
    estimatedSaving: phoneLines.length * 10
  });
  
  return potentialSavings;
};

// Generate plan recommendations
export const generatePlanRecommendation = (phoneLines: PhoneLine[], totalAmount: number): BillData["planRecommendation"] => {
  // Calculate best plan based on number of lines and usage patterns
  const numLines = phoneLines.length;
  let recommendedPlan = "Unlimited Plus";
  let estimatedSavings = totalAmount * 0.15;
  
  // Adjust recommendation based on number of lines
  if (numLines >= 4) {
    recommendedPlan = "Unlimited Ultimate";
    estimatedSavings = totalAmount * 0.2;
  } else if (numLines <= 2) {
    recommendedPlan = "Unlimited Welcome";
    estimatedSavings = totalAmount * 0.1;
  }
  
  return {
    recommendedPlan,
    reasons: [
      `Optimized for ${numLines} device lines`,
      "Includes premium features with better value",
      "Best price-to-feature ratio for your usage"
    ],
    estimatedMonthlySavings: estimatedSavings,
    confidenceScore: 0.8,
    alternativePlans: [
      {
        name: "Unlimited Welcome",
        monthlyCost: totalAmount - estimatedSavings - 20,
        pros: [
          "Lower cost",
          "Unlimited data"
        ],
        cons: [
          "Fewer premium features",
          "Lower priority data"
        ],
        estimatedSavings: estimatedSavings + 20
      },
      {
        name: "Unlimited Ultimate",
        monthlyCost: totalAmount - estimatedSavings + 30,
        pros: [
          "Premium streaming quality",
          "Maximum mobile hotspot data",
          "All available perks included"
        ],
        cons: [
          "Higher monthly cost",
          "May include features you don't need"
        ],
        estimatedSavings: estimatedSavings - 30
      }
    ]
  };
};

export const formatCurrency = (value: number): string => {
  return `$${value.toFixed(2)}`;
};

// Chart data preparation utilities
export const prepareLineItemsData = (billData: BillData | null) => {
  if (!billData?.phoneLines) return [];
  
  return billData.phoneLines.map((line) => ({
    name: line.deviceName.split(' ').slice(0, 3).join(' '), // Shorten device name
    total: line.monthlyTotal,
    plan: line.details.planCost ? line.details.planCost - (line.details.planDiscount || 0) : 0,
    device: (line.details.devicePayment || 0) - (line.details.deviceCredit || 0),
    protection: line.details.protection || 0,
    taxes: (line.details.surcharges || 0) + (line.details.taxes || 0)
  }));
};

export const prepareCategoryData = (billData: BillData | null) => {
  if (!billData?.chargesByCategory) return [];
  
  return [
    { name: 'Plans', value: billData.chargesByCategory.plans },
    { name: 'Devices', value: billData.chargesByCategory.devices },
    { name: 'Protection', value: billData.chargesByCategory.protection },
    { name: 'Surcharges', value: billData.chargesByCategory.surcharges },
    { name: 'Taxes', value: billData.chargesByCategory.taxes },
    { name: 'Other', value: billData.chargesByCategory.other }
  ];
};

export const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28DFF', '#FF6B6B'];
