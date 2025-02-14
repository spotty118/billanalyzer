
import { Plan, PlanType, StreamingQuality } from '../types/verizonTypes';
import { supabase } from '@/integrations/supabase/client';

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

        // Remove duplicates based on external_id
        const uniquePlans = plans.reduce((acc: any[], plan) => {
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
          features: plan.features || [],
          type: plan.type as PlanType,
          dataAllowance: plan.data_allowance as {
            premium: number | 'unlimited';
            hotspot?: number;
          },
          streamingQuality: plan.streaming_quality as StreamingQuality,
          autopayDiscount: plan.autopay_discount ?? undefined,
          paperlessDiscount: plan.paperless_discount ?? undefined,
          planLevel: plan.plan_level ?? undefined
        }));
        
        this.lastPlansFetch = Date.now();
      } catch (error) {
        console.error('Error in getPlans:', error);
        throw error;
      }
    }

    return this.plans || [];
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
        features: plan.features || [],
        type: plan.type as PlanType,
        dataAllowance: plan.data_allowance as {
          premium: number | 'unlimited';
          hotspot?: number;
        },
        streamingQuality: plan.streaming_quality as StreamingQuality,
        autopayDiscount: plan.autopay_discount ?? undefined,
        paperlessDiscount: plan.paperless_discount ?? undefined,
        planLevel: plan.plan_level ?? undefined
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
