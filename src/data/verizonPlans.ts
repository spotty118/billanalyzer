
import { Plan } from './types/verizonTypes';
import { verizonData } from './managers/VerizonDataManager';
export { formatCurrency } from './utils/verizonUtils';
export * from './types/verizonTypes';

// Define the types for our plan data structure
interface PlanPrices {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
  [key: number]: number; // This allows indexes like 6, 7, etc.
}

interface VerizonPlan {
  name: string;
  prices: PlanPrices;
  data: string;
  features: string[];
}

// Define type for the entire plan data object with index signature
interface VerizonPlansData {
  [key: string]: VerizonPlan;
}

// Verizon MyPlan pricing (per line)
export const verizonPlansData: VerizonPlansData = {
  'unlimited-welcome': {
    name: 'Unlimited Welcome',
    prices: {
      1: 75,
      2: 65,
      3: 50,
      4: 40,
      5: 35,
    },
    data: 'Unlimited',
    features: ['Unlimited talk, text & data', '5G access', 'Mobile hotspot 5GB', 'Disney+ (6 months)']
  },
  'unlimited-plus': {
    name: 'Unlimited Plus',
    prices: {
      1: 90,
      2: 80,
      3: 65,
      4: 55,
      5: 45,
    },
    data: 'Unlimited',
    features: ['Unlimited talk, text & data', '5G Ultra Wideband', 'Mobile hotspot 30GB', 'Disney+, Hulu, ESPN+']
  },
  'unlimited-ultimate': {
    name: 'Unlimited Ultimate',
    prices: {
      1: 100,
      2: 90,
      3: 75,
      4: 65,
      5: 55,
    },
    data: 'Unlimited Premium',
    features: ['Unlimited Premium Data', '5G Ultra Wideband', 'Mobile hotspot 60GB', 'Disney+, Hulu, ESPN+, Netflix, Apple Music']
  }
};

// Export async functions for easier usage
export async function getPlans(): Promise<Plan[]> {
  return verizonData.getPlans();
}

export async function getPlanById(planId: string): Promise<Plan | null> {
  return verizonData.getPlanById(planId);
}

// Get the price for a plan based on the number of lines
export function getPlanPrice(planId: string, lineCount: number): number {
  const plan = verizonPlansData[planId];
  if (!plan) return 0;
  
  // If lineCount is more than 5, use the 5+ price
  const key = lineCount > 5 ? 5 : lineCount;
  return plan.prices[key] || 0;
}

// Calculate total price for multiple lines on the same plan
export function calculatePlanTotal(planId: string, lineCount: number): number {
  const pricePerLine = getPlanPrice(planId, lineCount);
  return pricePerLine * lineCount;
}
