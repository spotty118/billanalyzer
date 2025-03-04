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
        value: Math.abs(value) // Use absolute value to ensure positive display values
      });
    } else if (typeof value === 'number' && value < 0) {
      // Add a separate entry for discounts
      result.push({
        name: key.includes('Discounts') ? key : 'Discounts & Credits',
        value: Math.abs(value)
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

// Define interfaces for perks and promotions
interface Perk {
  name: string;
  description: string;
  monthlyValue: number;
  includedWith: string;
}

interface Promotion {
  name: string;
  description: string;
  monthlyValue: number;
  remainingMonths: number;
  appliedTo: string;
}

// Helper function to extract perks and promotional credits
export const extractPerksAndCredits = (billData: any = {}): { perks: Perk[]; promotions: Promotion[] } => {
  const perks: Perk[] = [];
  const promotions: Promotion[] = [];
  
  // Extract perks from parsed bill data
  if (billData.perks && Array.isArray(billData.perks) && billData.perks.length > 0) {
    billData.perks.forEach((perk: any) => {
      perks.push({
        name: perk.name,
        description: perk.description || `Included with ${perk.includedWith || 'your plan'}`,
        monthlyValue: perk.monthlyValue || 0,
        includedWith: perk.includedWith || 'Plan'
      });
    });
  }
  
  // Extract promotions from parsed bill data
  if (billData.promotions && Array.isArray(billData.promotions) && billData.promotions.length > 0) {
    billData.promotions.forEach((promo: any) => {
      promotions.push({
        name: promo.name,
        description: promo.description || '',
        monthlyValue: promo.monthlyValue || 0,
        remainingMonths: promo.remainingMonths || 0,
        appliedTo: promo.appliedTo || ''
      });
    });
  }
  
  // If no perks found at top level, check in phone lines
  if (perks.length === 0 && billData.phoneLines) {
    billData.phoneLines.forEach((line: any) => {
      if (line.details && Array.isArray(line.details.perks)) {
        line.details.perks.forEach((perk: any) => {
          if (perk.name) {
            perks.push({
              name: perk.name,
              description: perk.description || `Included with ${line.phoneNumber}`,
              monthlyValue: perk.cost || 0,
              includedWith: line.phoneNumber
            });
          }
        });
      }
    });
  }
  
  // If no promotions found at top level, look for credits in the bill details
  if (promotions.length === 0 && billData.phoneLines) {
    billData.phoneLines.forEach((line: any) => {
      if (line.details && line.details.deviceCredit && line.details.deviceCredit > 0) {
        promotions.push({
          name: "Device Credit",
          description: `Credit for ${line.deviceName || 'device'}`,
          monthlyValue: line.details.deviceCredit,
          remainingMonths: 0, // We don't have this info
          appliedTo: line.phoneNumber
        });
      }
      
      if (line.details && line.details.planDiscount && line.details.planDiscount > 0) {
        promotions.push({
          name: "Plan Discount",
          description: `Discount on ${line.planName || 'plan'}`,
          monthlyValue: line.details.planDiscount,
          remainingMonths: 0, // We don't have this info
          appliedTo: line.phoneNumber
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
): {
  monthlySavings: number;
  annualSavings: number;
  planName: string;
  price: number;
} => {
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
    billData.phoneLines?.[0]?.planName || 'Unlimited Plus',
    carrierId
  );
  
  // Get the alternative carrier plan details
  const carrierPlan = alternativeCarrierPlans.find(plan => plan.id === matchingPlanId);
  
  if (!carrierPlan) {
    console.error(`No matching plan found for carrier ID: ${carrierId}, matching plan ID: ${matchingPlanId}`);
    return {
      monthlySavings: 0,
      annualSavings: 0,
      planName: "No matching plan",
      price: 0
    };
  }
  
  console.log(`Found matching plan: ${carrierPlan.name} for carrier ID: ${carrierId}`);
  
  // Calculate the price for the alternative carrier plan
  const alternativePrice = getCarrierPlanPrice(carrierPlan, numberOfLines);
  console.log(`Alternative price for ${numberOfLines} lines: ${alternativePrice}`);
  
  // Calculate savings
  const currentBillAmount = billData.totalAmount || 0;
  console.log(`Current bill amount: ${currentBillAmount}, Alternative price: ${alternativePrice}`);
  
  const monthlySavings = currentBillAmount - alternativePrice;
  const annualSavings = monthlySavings * 12;
  
  return {
    monthlySavings,
    annualSavings,
    planName: carrierPlan.name,
    price: alternativePrice
  };
};
