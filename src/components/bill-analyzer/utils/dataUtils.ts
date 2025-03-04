
import { verizonPlansData, getPlanPrice } from "@/data/verizonPlans";

// Format currency with $ symbol and 2 decimal places
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

// Prepare line items data for charts with accurate pricing
export const prepareLineItemsData = (phoneLines: any[] = []) => {
  if (!phoneLines || phoneLines.length === 0) return [];
  
  const lineCount = phoneLines.length;
  
  return phoneLines.map(line => {
    const details = line.details || {};
    
    // Get the correct plan price based on the plan name
    let planPrice = details.planCost || 0;
    if (line.planName) {
      const planId = Object.keys(verizonPlansData).find(
        key => verizonPlansData[key].name === line.planName
      );
      
      if (planId) {
        planPrice = getPlanPrice(planId, lineCount);
      }
    }
    
    // Calculate perks total
    const perksTotal = Array.isArray(details.perks) 
      ? details.perks.reduce((sum: number, perk: any) => sum + (perk.cost || 0), 0)
      : 0;
    
    return {
      name: line.phoneNumber || 'Unknown',
      plan: planPrice - (details.planDiscount || 0),
      device: (details.devicePayment || 0) - (details.deviceCredit || 0),
      protection: details.protection || 0,
      perks: perksTotal,
      taxes: (details.surcharges || 0) + (details.taxes || 0)
    };
  });
};

// Prepare category data for charts
export const prepareCategoryData = (chargesByCategory: any = {}) => {
  if (!chargesByCategory) {
    // Default categories if none are provided
    return [
      { name: 'Plan Charges', value: 65 },
      { name: 'Device Payments', value: 15 },
      { name: 'Services & Add-ons', value: 10 },
      { name: 'Taxes & Fees', value: 10 }
    ];
  }
  
  const result = [];
  
  for (const [key, value] of Object.entries(chargesByCategory)) {
    if (typeof value === 'number' && value > 0) {
      result.push({
        name: key,
        value: value
      });
    }
  }
  
  // Add a small value for empty categories to ensure chart displays properly
  if (result.length === 0) {
    return [
      { name: 'Plan Charges', value: 65 },
      { name: 'Device Payments', value: 15 },
      { name: 'Services & Add-ons', value: 10 },
      { name: 'Taxes & Fees', value: 10 }
    ];
  }
  
  return result;
};

// Helper function to extract perks and promotional credits
export const extractPerksAndCredits = (billData: any = {}) => {
  const perks = billData.perks || [];
  const promotions = billData.promotions || [];
  
  // Extract perks from phone lines if not present at top level
  if (perks.length === 0 && billData.phoneLines) {
    billData.phoneLines.forEach((line: any) => {
      if (line.details && Array.isArray(line.details.perks)) {
        line.details.perks.forEach((perk: any) => {
          perks.push({
            name: perk.name,
            description: perk.description || `Included with ${line.phoneNumber}`,
            monthlyValue: perk.cost || 0,
            includedWith: line.phoneNumber
          });
        });
      }
    });
  }
  
  return {
    perks,
    promotions
  };
};

// Calculate carrier savings
export const calculateCarrierSavings = (
  carrierId: string, 
  billData: any, 
  getCarrierPlanPrice: Function, 
  findBestCarrierMatch: Function, 
  alternativeCarrierPlans: any[]
) => {
  if (!billData) {
    return {
      monthlySavings: 0,
      annualSavings: 0,
      planName: "N/A",
      price: 0
    };
  }
  
  // Find the number of lines in the bill
  const numberOfLines = billData.phoneLines?.length || 1;

  // Find the best matching plan from the alternative carrier
  const matchingPlanId = findBestCarrierMatch(
    billData.phoneLines[0]?.planName || 'Unlimited Plus',
    carrierId
  );
  
  // Get the alternative carrier plan details
  const carrierPlan = alternativeCarrierPlans.find(plan => plan.id === matchingPlanId);
  
  if (!carrierPlan) {
    return {
      monthlySavings: 0,
      annualSavings: 0,
      planName: "No matching plan",
      price: 0
    };
  }
  
  // Calculate the price for the alternative carrier plan
  const alternativePrice = getCarrierPlanPrice(carrierPlan, numberOfLines);
  
  // Calculate savings
  const monthlySavings = billData.totalAmount - alternativePrice;
  const annualSavings = monthlySavings * 12;
  
  return {
    monthlySavings,
    annualSavings,
    planName: carrierPlan.name,
    price: alternativePrice
  };
};
