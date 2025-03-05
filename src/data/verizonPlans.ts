
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

interface CarrierPlan {
  name: string;
  prices: PlanPrices;
  data: string;
  features: string[];
}

// Define type for the entire plan data object with index signature
interface CarrierPlansData {
  [key: string]: CarrierPlan;
}

// Verizon MyPlan pricing (per line)
export const verizonPlansData: CarrierPlansData = {
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
  },
  'more-unlimited': {
    name: 'More Unlimited',
    prices: {
      1: 20,
      2: 20,
      3: 20,
      4: 20,
      5: 20,
    },
    data: 'Unlimited',
    features: ['Number Share', 'For tablets and watches', 'Mobile hotspot included', 'Shared with main line']
  }
};

// T-Mobile plans
export const tmobilePlansData: CarrierPlansData = {
  'go5g': {
    name: 'Go5G',
    prices: {
      1: 70,
      2: 60,
      3: 45,
      4: 35,
      5: 30,
    },
    data: 'Unlimited',
    features: ['Unlimited talk, text & data', '5G access', 'Mobile hotspot 5GB', 'Netflix Basic (with 2+ lines)']
  },
  'go5g-plus': {
    name: 'Go5G Plus',
    prices: {
      1: 85,
      2: 75,
      3: 55,
      4: 45,
      5: 40,
    },
    data: 'Unlimited',
    features: ['Unlimited talk, text & data', '5G Ultra Capacity', 'Mobile hotspot 40GB', 'Netflix Standard (with 2+ lines)']
  },
  'go5g-next': {
    name: 'Go5G Next',
    prices: {
      1: 95,
      2: 85,
      3: 65,
      4: 55,
      5: 50,
    },
    data: 'Unlimited Premium',
    features: ['Unlimited Premium Data', '5G Ultra Capacity', 'Mobile hotspot 50GB', 'Netflix Standard (with 2+ lines)', 'Annual phone upgrades']
  }
};

// AT&T plans
export const attPlansData: CarrierPlansData = {
  'unlimited-starter': {
    name: 'Unlimited Starter',
    prices: {
      1: 65,
      2: 60,
      3: 45,
      4: 35,
      5: 30,
    },
    data: 'Unlimited',
    features: ['Unlimited talk, text & data', '5G access', 'Standard definition streaming']
  },
  'unlimited-extra': {
    name: 'Unlimited Extra',
    prices: {
      1: 75,
      2: 65,
      3: 50,
      4: 40,
      5: 35,
    },
    data: 'Unlimited',
    features: ['Unlimited talk, text & data', '5G access', 'Mobile hotspot 50GB', 'HD streaming']
  },
  'unlimited-premium': {
    name: 'Unlimited Premium',
    prices: {
      1: 85,
      2: 75,
      3: 60,
      4: 50,
      5: 45,
    },
    data: 'Unlimited Premium',
    features: ['Unlimited Premium Data', '5G access', 'Mobile hotspot 100GB', 'HD streaming', 'HBO Max included']
  }
};

// US Mobile plans
export const usmobilePlansData: CarrierPlansData = {
  'unlimited-basic': {
    name: 'Unlimited Basic',
    prices: {
      1: 35,
      2: 30,
      3: 25,
      4: 20,
      5: 15,
    },
    data: 'Unlimited',
    features: ['Unlimited talk, text & data', '5G access', 'Mobile hotspot 5GB']
  },
  'unlimited-premium': {
    name: 'Unlimited Premium',
    prices: {
      1: 45,
      2: 40,
      3: 35,
      4: 30,
      5: 25,
    },
    data: 'Unlimited Premium',
    features: ['Unlimited Premium Data', '5G Ultra Wideband', 'Mobile hotspot 100GB', 'One streaming perk']
  }
};

// Get carrier-specific plans
export function getCarrierPlans(carrierType: string = 'verizon'): CarrierPlansData {
  switch (carrierType.toLowerCase()) {
    case 'tmobile':
      return tmobilePlansData;
    case 'att':
      return attPlansData;
    case 'usmobile':
      return usmobilePlansData;
    case 'verizon':
    default:
      return verizonPlansData;
  }
}

// Export async functions for easier usage
export async function getPlans(): Promise<Plan[]> {
  return verizonData.getPlans();
}

export async function getPlanById(planId: string): Promise<Plan | null> {
  return verizonData.getPlanById(planId);
}

// Get the price for a plan based on carrier type, plan ID, and the number of lines
export function getPlanPrice(planId: string, lineCount: number, carrierType: string = 'verizon'): number {
  const plansData = getCarrierPlans(carrierType);
  const plan = plansData[planId];
  if (!plan) return 0;
  
  // If lineCount is more than 5, use the 5+ price
  const key = lineCount > 5 ? 5 : lineCount;
  return plan.prices[key] || 0;
}

// Calculate total price for multiple lines on the same plan
export function calculatePlanTotal(planId: string, lineCount: number, carrierType: string = 'verizon'): number {
  const pricePerLine = getPlanPrice(planId, lineCount, carrierType);
  return pricePerLine * lineCount;
}
