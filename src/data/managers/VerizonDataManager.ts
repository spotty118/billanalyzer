
import { Plan, Promotion, PlanSchema, PromotionSchema } from '../types/verizonTypes';
import { scrapeVerizonPlans, scrapeGridPromotions } from '@/utils/scraper';

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
              eligiblePlans: promo.eligiblePlans || []
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
