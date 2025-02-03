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
  private promotions: Promotion[] | null = null;
  private lastFetch: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly BASE_URL = '/api/mcp/verizon-data';
  private isRetrying: boolean = false;

  private constructor() {}

  public static getInstance(): VerizonDataManager {
    if (!VerizonDataManager.instance) {
      VerizonDataManager.instance = new VerizonDataManager();
    }
    return VerizonDataManager.instance;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async fetchWithRetry<T>(endpoint: string, retries = 3, initialDelay = 1000): Promise<T> {
    const url = `${this.BASE_URL}/${endpoint}`;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`[Attempt ${attempt}/${retries}] Fetching ${url}`);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        console.log(`Response status: ${response.status}`);
        
        if (!response.ok) {
          const text = await response.text();
          console.error(`HTTP error! status: ${response.status}, body:`, text);
          throw new Error(`HTTP ${response.status}: ${text}`);
        }
        
        const contentType = response.headers.get('content-type');
        console.log('Content-Type:', contentType);
        
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error(`Unexpected content type: ${contentType}`);
        }
        
        const data = await response.json();
        console.log('Response data:', data);
        return data;
      } catch (error) {
        console.error(`Attempt ${attempt} failed:`, error);
        
        if (attempt === retries) {
          throw error;
        }
        
        const delayMs = initialDelay * Math.pow(2, attempt - 1);
        console.log(`Waiting ${delayMs}ms before retry...`);
        await this.delay(delayMs);
      }
    }
    throw new Error('All retry attempts failed');
  }

  private shouldRefetch(): boolean {
    return !this.lastFetch || Date.now() - this.lastFetch > this.CACHE_DURATION;
  }

  private async fetchPlans(): Promise<Plan[]> {
    if (this.isRetrying) {
      console.log('Already retrying, waiting...');
      await this.delay(1000);
      return this.getPlans();
    }

    try {
      this.isRetrying = true;
      console.log('Fetching plans from MCP server...');
      const data = await this.fetchWithRetry<unknown[]>('fetch_plans');
      
      if (!Array.isArray(data)) {
        console.error('Invalid response format:', data);
        throw new Error('Invalid response format: expected an array of plans');
      }

      const plans = data.map((plan, index) => {
        try {
          return PlanSchema.parse(plan);
        } catch (err) {
          console.error(`Invalid plan data at index ${index}:`, err);
          throw new Error('Invalid plan data received from server');
        }
      });

      console.log('Successfully fetched and parsed plans:', plans);
      return plans;
    } catch (error) {
      console.error('Error fetching plans:', error);
      throw new Error('Failed to fetch plans. Please try again later.');
    } finally {
      this.isRetrying = false;
    }
  }

  private async fetchPromotions(): Promise<Promotion[]> {
    if (this.isRetrying) {
      console.log('Already retrying, waiting...');
      await this.delay(1000);
      return this.getPromotions();
    }

    try {
      this.isRetrying = true;
      console.log('Fetching promotions from MCP server...');
      const data = await this.fetchWithRetry<unknown[]>('fetch_promotions');
      
      if (!Array.isArray(data)) {
        console.error('Invalid response format:', data);
        throw new Error('Invalid response format: expected an array of promotions');
      }

      const promotions = data.map((promo, index) => {
        try {
          return PromotionSchema.parse(promo);
        } catch (err) {
          console.error(`Invalid promotion data at index ${index}:`, err);
          throw new Error('Invalid promotion data received from server');
        }
      });

      console.log('Successfully fetched and parsed promotions:', promotions);
      return promotions;
    } catch (error) {
      console.error('Error fetching promotions:', error);
      throw new Error('Failed to fetch promotions. Please try again later.');
    } finally {
      this.isRetrying = false;
    }
  }

  public async getPlans(): Promise<Plan[]> {
    if (!this.plans || this.shouldRefetch()) {
      try {
        this.plans = await this.fetchPlans();
        this.lastFetch = Date.now();
      } catch (error) {
        console.error('Error in getPlans:', error);
        throw error;
      }
    }
    return this.plans;
  }

  public async getPromotions(): Promise<Promotion[]> {
    if (!this.promotions || this.shouldRefetch()) {
      try {
        this.promotions = await this.fetchPromotions();
        this.lastFetch = Date.now();
      } catch (error) {
        console.error('Error in getPromotions:', error);
        throw error;
      }
    }
    return this.promotions;
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
    this.lastFetch = 0;
    this.isRetrying = false;
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
