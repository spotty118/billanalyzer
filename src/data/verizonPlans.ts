import { z } from 'zod';
import { scrapeVerizonPlans, scrapeGridPromotions } from '@/utils/scraper';

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
    premium: z.union([z.number(), z.literal('unlimited')]),
    hotspot: z.number().optional(),
  }),
  streamingQuality: StreamingQuality,
});

export type Plan = z.infer<typeof PlanSchema>;

export const PromotionSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  expires: z.string(),
  type: PromotionType,
  value: z.string(),
  terms: z.array(z.string()).optional(),
  eligiblePlans: z.array(z.string()).optional(),
  stackable: z.boolean().optional(),
  version: z.string().optional(),
});

export type Promotion = z.infer<typeof PromotionSchema>;

class VerizonDataManager {
  private static instance: VerizonDataManager;
  private plans: Plan[] | null = null;
  private lastPlansFetch: number = 0;
  private promotions: Promotion[] | null = null;
  private lastPromotionsFetch: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private retryPromise: Promise<Plan[]> | null = null;
  private retryPromotionsPromise: Promise<Promotion[]> | null = null;

  private constructor() {}

  public static getInstance(): VerizonDataManager {
    if (!VerizonDataManager.instance) {
      VerizonDataManager.instance = new VerizonDataManager();
    }
    return VerizonDataManager.instance;
  }

  private async fetchPlans(): Promise<Plan[]> {
    if (this.retryPromise) {
      return this.retryPromise;
    }

    try {
      this.retryPromise = (async () => {
        console.log('Fetching plans from Grid API...');
        const plans = await scrapeVerizonPlans();
        
        if (!Array.isArray(plans)) {
          console.error('Invalid response format:', plans);
          throw new Error('Invalid response format: expected an array of plans');
        }

        const validatedPlans = plans.map((plan, index) => {
          try {
            return PlanSchema.parse({
              ...plan,
              id: plan.external_id,
              basePrice: plan.base_price,
              multiLineDiscounts: plan.multi_line_discounts,
              dataAllowance: plan.data_allowance,
              streamingQuality: plan.streaming_quality
            });
          } catch (err) {
            console.error(`Invalid plan data at index ${index}:`, err);
            throw new Error('Invalid plan data received from server');
          }
        });

        console.log('Successfully fetched and parsed plans');
        return validatedPlans;
      })();
      return await this.retryPromise;
    } finally {
      this.retryPromise = null;
    }
  }

  private async fetchPromotions(): Promise<Promotion[]> {
    if (this.retryPromotionsPromise) {
      return this.retryPromotionsPromise;
    }

    try {
      this.retryPromotionsPromise = (async () => {
        console.log('Fetching promotions from Grid API...');
        const promotions = await scrapeGridPromotions();
        
        if (!Array.isArray(promotions)) {
          console.error('Invalid response format:', promotions);
          throw new Error('Invalid response format: expected an array of promotions');
        }

        const validatedPromotions = promotions.map((promo, index) => {
          try {
            return PromotionSchema.parse({
              ...promo,
              id: promo.external_id,
              stackable: promo.stackable || false,
              terms: promo.terms || [],
              eligiblePlans: promo.eligible_plans || []
            });
          } catch (err) {
            console.error(`Invalid promotion data at index ${index}:`, err);
            throw new Error('Invalid promotion data received from server');
          }
        });

        console.log('Successfully fetched and parsed promotions');
        return validatedPromotions;
      })();
      return await this.retryPromotionsPromise;
    } finally {
      this.retryPromotionsPromise = null;
    }
  }

  public async getPlans(): Promise<Plan[]> {
    if (!this.plans || this.shouldRefetch(this.lastPlansFetch)) {
      try {
        this.plans = await this.fetchPlans();
        this.lastPlansFetch = Date.now();
      } catch (error) {
        console.error('Error in getPlans:', error);
        throw error;
      }
    }
    return this.plans;
  }

  public async getPromotions(): Promise<Promotion[]> {
    if (!this.promotions || this.shouldRefetch(this.lastPromotionsFetch)) {
      try {
        this.promotions = await this.fetchPromotions();
        this.lastPromotionsFetch = Date.now();
      } catch (error) {
        console.error('Error in getPromotions:', error);
        throw error;
      }
    }
    return this.promotions;
  }

  private shouldRefetch(lastFetch: number): boolean {
    return !lastFetch || Date.now() - lastFetch > this.CACHE_DURATION;
  }

  public async getPlanById(planId: string): Promise<Plan | null> {
    try {
      const plans = await this.getPlans();
      return plans.find(p => p.id === planId) || null;
    } catch (error) {
      console.error('Error in getPlanById:', error);
      throw error;
    }
  }

  public clearCache(): void {
    this.plans = null;
    this.promotions = null;
    this.lastPlansFetch = 0;
    this.lastPromotionsFetch = 0;
    this.retryPromise = null;
    this.retryPromotionsPromise = null;
    console.log('Cache cleared');
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
