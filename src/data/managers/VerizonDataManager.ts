
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

        this.plans = plans.map(plan => ({
          id: plan.external_id,
          name: plan.name,
          basePrice: plan.base_price,
          multiLineDiscounts: plan.multi_line_discounts as {
            lines2: number;
            lines3: number;
            lines4: number;
            lines5Plus: number;
          },
          features: plan.features,
          type: plan.type as PlanType,
          dataAllowance: plan.data_allowance as {
            premium: number | 'unlimited';
            hotspot?: number;
          },
          streamingQuality: plan.streaming_quality as StreamingQuality,
          autopayDiscount: plan.autopay_discount ?? undefined,
          paperlessDiscount: plan.paperless_discount ?? undefined
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
        multiLineDiscounts: plan.multi_line_discounts as {
          lines2: number;
          lines3: number;
          lines4: number;
          lines5Plus: number;
        },
        features: plan.features,
        type: plan.type as PlanType,
        dataAllowance: plan.data_allowance as {
          premium: number | 'unlimited';
          hotspot?: number;
        },
        streamingQuality: plan.streaming_quality as StreamingQuality,
        autopayDiscount: plan.autopay_discount ?? undefined,
        paperlessDiscount: plan.paperless_discount ?? undefined
      };
    } catch (error) {
      console.error('Error in getPlanById:', error);
      throw error;
    }
  }

  public async getPlansByType(type: PlanType): Promise<Plan[]> {
    try {
      const { data: plans, error } = await supabase
        .from('verizon_plans')
        .select('*')
        .eq('type', type)
        .order('base_price');

      if (error) {
        console.error('Error fetching plans by type:', error);
        throw error;
      }

      return plans.map(plan => ({
        id: plan.external_id,
        name: plan.name,
        basePrice: plan.base_price,
        multiLineDiscounts: plan.multi_line_discounts as {
          lines2: number;
          lines3: number;
          lines4: number;
          lines5Plus: number;
        },
        features: plan.features,
        type: plan.type as PlanType,
        dataAllowance: plan.data_allowance as {
          premium: number | 'unlimited';
          hotspot?: number;
        },
        streamingQuality: plan.streaming_quality as StreamingQuality,
        autopayDiscount: plan.autopay_discount ?? undefined,
        paperlessDiscount: plan.paperless_discount ?? undefined
      }));
    } catch (error) {
      console.error('Error in getPlansByType:', error);
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
