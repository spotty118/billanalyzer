
// Enhanced bill analysis module
const analyzeUsagePatterns = (billData) => {
  const { usage_details } = billData;
  const lines = Object.entries(usage_details);

  // Calculate trends
  const trendAnalysis = {
    trend: 'stable',
    percentageChange: 0,
    seasonalFactors: {
      highUsageMonths: ['December', 'January'],  // Placeholder - would be calculated from historical data
      lowUsageMonths: ['June', 'July']
    },
    avg_data_usage_gb: 0,
    avg_talk_minutes: 0,
    avg_text_count: 0,
    high_data_users: [],
    high_talk_users: [],
    high_text_users: []
  };

  // Analyze month-over-month changes if available
  if (lines.length > 0) {
    const monthlyUsage = lines.map(([phoneNumber, details]) => {
      const usage = details[0];
      
      // Extract data usage value (assuming it's in format like "15 GB")
      let dataUsage = 0;
      if (usage.data_usage) {
        const dataMatch = /(\d+(?:\.\d+)?)\s*(?:GB|MB)/i.exec(usage.data_usage);
        if (dataMatch) {
          dataUsage = parseFloat(dataMatch[1]);
          // Convert MB to GB if needed
          if (usage.data_usage.toUpperCase().includes('MB')) {
            dataUsage /= 1024;
          }
        }
      }
      
      return {
        phoneNumber,
        data: dataUsage,
        minutes: parseInt(usage.talk_minutes) || 0,
        texts: parseInt(usage.text_count) || 0
      };
    });
    
    // Calculate averages
    const totalData = monthlyUsage.reduce((sum, item) => sum + item.data, 0);
    const totalMinutes = monthlyUsage.reduce((sum, item) => sum + item.minutes, 0);
    const totalTexts = monthlyUsage.reduce((sum, item) => sum + item.texts, 0);
    
    trendAnalysis.avg_data_usage_gb = totalData / monthlyUsage.length;
    trendAnalysis.avg_talk_minutes = totalMinutes / monthlyUsage.length;
    trendAnalysis.avg_text_count = totalTexts / monthlyUsage.length;
    
    // Identify high users
    trendAnalysis.high_data_users = monthlyUsage
      .filter(item => item.data > trendAnalysis.avg_data_usage_gb * 1.5)
      .map(item => item.phoneNumber);
      
    trendAnalysis.high_talk_users = monthlyUsage
      .filter(item => item.minutes > trendAnalysis.avg_talk_minutes * 1.5)
      .map(item => item.phoneNumber);
      
    trendAnalysis.high_text_users = monthlyUsage
      .filter(item => item.texts > trendAnalysis.avg_text_count * 1.5)
      .map(item => item.phoneNumber);

    // Simple trend analysis
    if (monthlyUsage.length >= 2) {
      const currentUsage = monthlyUsage[monthlyUsage.length - 1].data;
      const previousUsage = monthlyUsage[monthlyUsage.length - 2].data;
      const percentChange = ((currentUsage - previousUsage) / previousUsage) * 100;

      trendAnalysis.percentageChange = Math.round(percentChange);
      trendAnalysis.trend = percentChange > 5 ? 'increasing' : 
                           percentChange < -5 ? 'decreasing' : 'stable';
    }
  }

  return trendAnalysis;
};

const analyzeCosts = (billData) => {
  const analysis = {
    averageMonthlyBill: 0,
    projectedNextBill: 0,
    unusualCharges: [],
    potentialSavings: []
  };

  // Calculate average monthly bill
  analysis.averageMonthlyBill = billData.bill_summary.total_due;
  analysis.projectedNextBill = analysis.averageMonthlyBill * 1.05; // Simple 5% increase projection

  // Analyze charges for unusual patterns
  const allCharges = [
    ...billData.plan_charges,
    ...billData.equipment_charges,
    ...billData.taxes_and_fees
  ];

  // Look for unusual or high charges
  allCharges.forEach(charge => {
    if (charge.amount > 100) { // Threshold for unusual charges
      analysis.unusualCharges.push({
        description: charge.description,
        amount: charge.amount,
        reason: 'Higher than usual charge'
      });
    }
  });

  // Identify potential savings
  const totalPlanCharges = billData.plan_charges.reduce((sum, charge) => sum + charge.amount, 0);
  if (totalPlanCharges > 200) {
    analysis.potentialSavings.push({
      description: 'Consider a family plan for multiple lines',
      estimatedSaving: totalPlanCharges * 0.2, // Estimate 20% savings
      confidence: 0.85
    });
  }

  return analysis;
};

const recommendPlan = (billData) => {
  const currentTotal = billData.bill_summary.total_due;
  const usage = Object.values(billData.usage_details)[0]?.[0] || { data_usage: '0 GB' };
  
  // Extract data usage value (assuming it's in format like "15 GB")
  let dataUsage = 0;
  if (usage.data_usage) {
    const dataMatch = /(\d+(?:\.\d+)?)\s*(?:GB|MB)/i.exec(usage.data_usage);
    if (dataMatch) {
      dataUsage = parseFloat(dataMatch[1]);
      // Convert MB to GB if needed
      if (usage.data_usage.toUpperCase().includes('MB')) {
        dataUsage /= 1024;
      }
    }
  }

  const recommendation = {
    recommendedPlan: '',
    reasons: [],
    estimatedMonthlySavings: 0,
    confidenceScore: 0.8,
    alternativePlans: []
  };

  // Simple logic for plan recommendations
  if (dataUsage > 50) {
    recommendation.recommendedPlan = '5G Do More Unlimited';
    recommendation.reasons = [
      'High data usage pattern',
      'Premium features available',
      'Better value for heavy data users'
    ];
    recommendation.estimatedMonthlySavings = currentTotal * 0.15;
    recommendation.alternativePlans = [
      {
        planName: '5G Play More Unlimited',
        pros: ['Lower monthly cost', 'Gaming perks included'],
        cons: ['Less premium data', 'No mobile hotspot'],
        estimatedSavings: currentTotal * 0.10
      }
    ];
  } else if (dataUsage > 25) {
    recommendation.recommendedPlan = '5G Play More Unlimited';
    recommendation.reasons = [
      'Moderate to high data usage',
      'Entertainment benefits included',
      'Good balance of features and cost'
    ];
    recommendation.estimatedMonthlySavings = currentTotal * 0.20;
    recommendation.alternativePlans = [
      {
        planName: '5G Start Unlimited',
        pros: ['Lower monthly cost', 'Still includes unlimited data'],
        cons: ['Data may be slowed during congestion', 'Fewer premium features'],
        estimatedSavings: currentTotal * 0.25
      }
    ];
  } else {
    recommendation.recommendedPlan = '5G Start Unlimited';
    recommendation.reasons = [
      'Moderate data usage',
      'Cost-effective for your needs',
      'Basic features included'
    ];
    recommendation.estimatedMonthlySavings = currentTotal * 0.25;
    recommendation.alternativePlans = [
      {
        planName: 'Welcome Unlimited',
        pros: ['Lowest price point', 'Unlimited talk and text'],
        cons: ['No premium features', 'Basic data speeds'],
        estimatedSavings: currentTotal * 0.30
      }
    ];
  }

  return recommendation;
};

export const enhancedAnalysis = (billData) => {
  return {
    usageAnalysis: analyzeUsagePatterns(billData),
    costAnalysis: analyzeCosts(billData),
    planRecommendation: recommendPlan(billData)
  };
};
