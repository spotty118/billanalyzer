
import { Plan, Promotion } from './types/verizonTypes';
import { verizonData } from './managers/VerizonDataManager';
export { formatCurrency } from './utils/verizonUtils';
export * from './types/verizonTypes';

// Export async functions for easier usage
export async function getPlans(): Promise<Plan[]> {
  return verizonData.getPlans();
}

export async function getPromotions(): Promise<Promotion[]> {
  return verizonData.getPromotions();
}

export async function getPlanById(planId: string): Promise<Plan | null> {
  return verizonData.getPlanById(planId);
}
