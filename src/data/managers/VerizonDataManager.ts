
import { Plan, PlanType, StreamingQuality } from '../types/verizonTypes';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';

class VerizonDataManager {
  private static instance: VerizonDataManager;
  private plans: Plan[] | null = null;
  private lastPlansFetch: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  public static getInstance(): VerizonDataManager {
    if (!VerizonDataManager.instance) {
      VerizonDataManager.instance = new VerizonDataManager();
    }
    return VerizonDataManager.instance;
  }

  private transformFeatures(features: Json): string[] {
    if (Array.isArray(features)) {
      return features.filter((feature): feature is string => typeof feature === 'string');
    }
    return [];
  }

  private transformDataAllowance(data: Json): { premium: number | 'unlimited'; hotspot?: number } {
    const defaultAllowance = { premium: 0 };
    
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return defaultAllowance;
    }

    const typedData = data as Record<string, Json>;
    
    // Handle premium data
    let premium: number | 'unlimited' = 0;
    if (typedData.premium === 'unlimited') {
      premium = 'unlimited';
    } else if (typeof typedData.premium === 'number') {
      premium = typedData.premium;
    }

    // Create result object
    const result: { premium: number | 'unlimited'; hotspot?: number } = { premium };

    // Handle optional hotspot data
    if (typeof typedData.hotspot === 'number') {
      result.hotspot = typedData.hotspot;
    }

    return result;
  }

  public async getPlans(): Promise<Plan[]> {
    if (!this.plans || this.shouldRefetch(this.lastPlansFetch)) {
      try {
        const { data: plans, error } = await supabase
          .from('verizon_plans')
          .select('*')
          .order('base_price');

        if (error) {
          console.error('Error fetching plans:', error);
          throw error;
        }

        if (!plans) {
          return [];
        }

        // Remove duplicates based on external_id
        const uniquePlans = plans.reduce((acc: typeof plans, plan) => {
          const existingPlan = acc.find(p => p.external_id === plan.external_id);
          if (!existingPlan) {
            acc.push(plan);
          }
          return acc;
        }, []);

        this.plans = uniquePlans.map(plan => ({
          id: plan.external_id,
          name: plan.name,
          basePrice: plan.base_price,
          price_1_line: plan.price_1_line || plan.base_price,
          price_2_line: plan.price_2_line || plan.base_price,
          price_3_line: plan.price_3_line || plan.base_price,
          price_4_line: plan.price_4_line || plan.base_price,
          price_5plus_line: plan.price_5plus_line || plan.base_price,
          features: this.transformFeatures(plan.features),
          type: plan.type as PlanType,
          dataAllowance: this.transformDataAllowance(plan.data_allowance),
          streamingQuality: plan.streaming_quality as StreamingQuality,
          autopayDiscount: plan.autopay_discount ?? undefined,
          paperlessDiscount: plan.paperless_discount ?? undefined,
          planLevel: this.validatePlanLevel(plan.plan_level)
        }));
        
        this.lastPlansFetch = Date.now();
      } catch (error) {
        console.error('Error in getPlans:', error);
        throw error;
      }
    }

    return this.plans || [];
  }

  private validatePlanLevel(level: string | null): "unlimited" | "welcome" | "plus" | undefined {
    if (level === "unlimited" || level === "welcome" || level === "plus") {
      return level;
    }
    return undefined;
  }

  public async getPlanById(planId: string): Promise<Plan | null> {
    try {
      const { data: plan, error } = await supabase
        .from('verizon_plans')
        .select('*')
        .eq('external_id', planId)
        .single();

      if (error) {
        console.error('Error fetching plan by ID:', error);
        return null;
      }

      if (!plan) return null;

      return {
        id: plan.external_id,
        name: plan.name,
        basePrice: plan.base_price,
        price_1_line: plan.price_1_line || plan.base_price,
        price_2_line: plan.price_2_line || plan.base_price,
        price_3_line: plan.price_3_line || plan.base_price,
        price_4_line: plan.price_4_line || plan.base_price,
        price_5plus_line: plan.price_5plus_line || plan.base_price,
        features: this.transformFeatures(plan.features),
        type: plan.type as PlanType,
        dataAllowance: this.transformDataAllowance(plan.data_allowance),
        streamingQuality: plan.streaming_quality as StreamingQuality,
        autopayDiscount: plan.autopay_discount ?? undefined,
        paperlessDiscount: plan.paperless_discount ?? undefined,
        planLevel: this.validatePlanLevel(plan.plan_level)
      };
    } catch (error) {
      console.error('Error in getPlanById:', error);
      throw error;
    }
  }

  private shouldRefetch(lastFetch: number): boolean {
    return !lastFetch || Date.now() - lastFetch > this.CACHE_DURATION;
  }

  public clearCache(): void {
    this.plans = null;
    this.lastPlansFetch = 0;
    console.log('Cache cleared');
  }
}

export const verizonData = VerizonDataManager.getInstance();
