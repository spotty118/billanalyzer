
import { LinePlan, Plan } from "@/types";
import { calculateLinePriceForPosition } from "@/utils/pricing-calculator";

// Maximum number of lines allowed in a quote
export const MAX_ALLOWED_LINES = 12;

/**
 * Calculate all selected perks across all lines
 */
export const getAllSelectedPerks = (linePlans: LinePlan[]): string[] => {
  return linePlans.flatMap(lp => lp.perks);
};

/**
 * Calculates the pricing details for a list of line plans
 */
export const calculateTotalPrice = (
  linePlans: LinePlan[], 
  availablePlans: Plan[], 
  streamingBillValue: number
) => {
  const selectedPlans = linePlans
    .filter(lp => lp.plan)
    .map(lp => {
      const plan = availablePlans.find(p => p.id === lp.plan);
      if (!plan) return null;
      
      return {
        plan,
        perks: lp.perks
      };
    })
    .filter(item => item !== null) as { plan: Plan; perks: string[] }[];

  if (selectedPlans.length === 0) return null;

  let totalMonthly = 0;
  let totalWithoutAutopay = 0;
  const totalLines = selectedPlans.length;
  
  // Count the actual number of perks across all selected lines
  const totalPerksCount = selectedPlans.reduce((count, item) => count + item.perks.length, 0);

  // Calculate line prices
  const linePrices = selectedPlans.map(({ plan, perks }) => {
    const planName = plan.name.toLowerCase();
    const linePrice = calculateLinePriceForPosition(planName, totalLines);
    const perksPrice = perks.length * 10;
    
    // Add to running totals
    totalMonthly += linePrice + perksPrice;
    // Add $10 autopay discount per line to the without-discount total
    totalWithoutAutopay += linePrice + 10 + perksPrice;
    
    return {
      plan: plan.name,
      price: linePrice + perksPrice,
      perks
    };
  });

  // Get the base price from the first line without perks
  const baseLinePrice = selectedPlans.length > 0 ? 
    calculateLinePriceForPosition(selectedPlans[0].plan.name.toLowerCase(), totalLines) : 0;
    
  const breakdown = calculateSavingsBreakdown(
    baseLinePrice,
    totalLines,
    totalPerksCount,
    streamingBillValue
  );

  const allSelectedPerks = getAllSelectedPerks(linePlans);

  return {
    linePrices,
    total: breakdown.total,
    hasDiscount: breakdown.discount > 0,
    selectedPerks: allSelectedPerks,
    annualSavings: breakdown.annualSavings,
    breakdown
  };
};

/**
 * Calculates the savings breakdown for a plan
 */
export const calculateSavingsBreakdown = (
  baseLinePrice: number,
  totalLines: number,
  totalPerksCount: number,
  streamingBillValue: number
) => {
  // Import the original function to maintain exact same behavior
  const { calculateSavingsBreakdown } = require("@/utils/pricing-calculator");
  return calculateSavingsBreakdown(baseLinePrice, totalLines, totalPerksCount, streamingBillValue);
};
