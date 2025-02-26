/**
 * Utility functions for pricing calculations
 */

// Constants for plan types and perks
export const PLAN_TYPES = {
  ULTIMATE: 'ultimate',
  PLUS: 'plus',
  WELCOME: 'welcome'
};

export const ENTERTAINMENT_PERKS = ['disney', 'netflix', 'apple_music', 'youtube'];

/**
 * Calculates the price per line based on the plan name and total number of lines
 * @param planName - The name of the plan (lowercase)
 * @param totalLines - The total number of lines
 * @returns The price per line
 */
export const calculateLinePriceForPosition = (planName: string, totalLines: number): number => {
  // Input validation
  if (!planName || totalLines <= 0) {
    return 0;
  }
  
  // Convert to lowercase for case insensitivity
  const planNameLower = planName.toLowerCase();
  
  // Use the price tier based on total number of lines
  const priceTier = Math.min(totalLines, 5); // Cap at 5+ lines pricing

  if (planNameLower.includes(PLAN_TYPES.ULTIMATE)) {
    switch (priceTier) {
      case 1: return 90;
      case 2: return 80;
      case 3: return 65;
      case 4: return 55;
      default: return 52; // 5+ lines
    }
  }
  if (planNameLower.includes(PLAN_TYPES.PLUS)) {
    switch (priceTier) {
      case 1: return 80;
      case 2: return 70;
      case 3: return 55;
      case 4: return 45;
      default: return 42; // 5+ lines
    }
  }
  if (planNameLower.includes(PLAN_TYPES.WELCOME)) {
    switch (priceTier) {
      case 1: return 65;
      case 2: return 55;
      case 3: return 40;
      case 4: return 30;
      default: return 27; // 5+ lines
    }
  }
  return 0;
};

/**
 * Calculates the savings and discount breakdowns for a quote
 * @param linePrice - The price per line
 * @param totalLines - The total number of lines
 * @param perksCount - The number of perks selected
 * @param streamingCost - The monthly streaming cost
 * @returns The breakdown of savings and discounts
 */
export const calculateSavingsBreakdown = (
  linePrice: number, 
  totalLines: number, 
  perksCount: number,
  streamingCost: number
) => {
  const perksValue = perksCount * 10;
  const subtotal = (linePrice * totalLines) + (10 * totalLines) + perksValue;
  const total = (linePrice * totalLines) + perksValue;
  const discount = subtotal - total;
  const annualSavings = (streamingCost * 12) + (perksValue * 12) + (discount * 12);

  return {
    subtotal,
    discount,
    total,
    streamingSavings: streamingCost,
    totalSavings: annualSavings,
    annualSavings
  };
};

/**
 * Validates if the perks selection is valid
 * - Some perks can only be selected once across all lines
 * @param allSelectedPerks - All perks selected across all lines
 * @param currentLinePerks - Perks selected for the current line
 * @param perk - The perk to validate
 * @returns Whether the perk can be selected
 */
export const isPerkSelectionValid = (
  allSelectedPerks: string[],
  currentLinePerks: string[],
  perk: string
): boolean => {
  // Entertainment perks that can only be selected once across all lines
  if (ENTERTAINMENT_PERKS.includes(perk) && !currentLinePerks.includes(perk)) {
    // Check if the perk is already selected on another line
    return !allSelectedPerks.includes(perk);
  }
  
  return true;
};
