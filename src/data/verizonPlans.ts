import { z } from 'zod';

export const StreamingQuality = z.enum(['480p', '720p', '1080p', '4K']);
export type StreamingQuality = z.infer<typeof StreamingQuality>;

export const PlanType = z.enum(['consumer', 'business']);
export type PlanType = z.infer<typeof PlanType>;

export const PromotionType = z.enum(['device', 'plan', 'trade-in']);
export type PromotionType = z.infer<typeof PromotionType>;

export const PlanSchema = z.object({
  id: z.string(),
  name: z.string(),
  basePrice: z.number(),
  multiLineDiscounts: z.object({
    lines2: z.number(),
    lines3: z.number(),
    lines4: z.number(),
    lines5Plus: z.number(),
  }),
  features: z.array(z.string()),
  type: PlanType,
  dataAllowance: z.object({
    premium: z.number(),
    hotspot: z.number().optional(),
  }),
  streamingQuality: StreamingQuality,
});

export type Plan = z.infer<typeof PlanSchema>;

export const PromotionSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  value: z.string(),
  expires: z.string(),
  type: PromotionType,
  terms: z.array(z.string()).optional(),
  eligiblePlans: z.array(z.string()).optional(),
  stackable: z.boolean().optional(),
  version: z.string().optional(),
});

export type Promotion = z.infer<typeof PromotionSchema>;

class VerizonDataManager {
  private static instance: VerizonDataManager;
  private plans: Plan[] | null = null;
  private promotions: Promotion[] | null = null;

  private constructor() {}

  public static getInstance(): VerizonDataManager {
    if (!VerizonDataManager.instance) {
      VerizonDataManager.instance = new VerizonDataManager();
    }
    return VerizonDataManager.instance;
  }

  private async fetchPlans(): Promise<Plan[]> {
    const response = await fetch('/api/mcp/verizon-data-server/fetch_plans');
    const data = await response.json();
    return data.map((plan: unknown) => PlanSchema.parse(plan));
  }

  private async fetchPromotions(): Promise<Promotion[]> {
    const response = await fetch('/api/mcp/verizon-data-server/fetch_promotions');
    const data = await response.json();
    return data.map((promo: unknown) => PromotionSchema.parse(promo));
  }

  public async getPlans(): Promise<Plan[]> {
    if (!this.plans) {
      this.plans = await this.fetchPlans();
    }
    return this.plans;
  }

  public async getPromotions(): Promise<Promotion[]> {
    if (!this.promotions) {
      this.promotions = await this.fetchPromotions();
    }
    return this.promotions;
  }

  public async getPlanById(planId: string): Promise<Plan | null> {
    const plans = await this.getPlans();
    return plans.find(p => p.id === planId) || null;
  }

  public clearCache(): void {
    this.plans = null;
    this.promotions = null;
  }
}

export const verizonData = VerizonDataManager.getInstance();

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

// Utility function to format currency
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};
