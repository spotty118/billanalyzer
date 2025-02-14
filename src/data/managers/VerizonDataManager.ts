
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

  private validatePlanLevel(level: string | null): "unlimited" | "welcome" | "plus" | undefined {
    if (level === "unlimited" || level === "welcome" || level === "plus") {
      return level;
    }
    return undefined;
  }

  public async getPlans(withAutopay: boolean = true): Promise<Plan[]> {
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

        this.plans = uniquePlans.map(plan => {
          const basePlan = {
            id: plan.external_id,
            name: plan.name,
            basePrice: withAutopay && plan.autopay_discount ? 
              plan.base_price - (plan.autopay_discount ?? 0) : 
              plan.base_price,
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
            paperlessDiscount: plan.paperless_discount ?? undefined,
            planLevel: this.validatePlanLevel(plan.plan_level)
          };

          return basePlan;
        });
        
        this.lastPlansFetch = Date.now();
      } catch (error) {
        console.error('Error in getPlans:', error);
        throw error;
      }
    }

    // Apply autopay filter to the cached plans
    return (this.plans || []).map(plan => ({
      ...plan,
      basePrice: withAutopay && plan.autopayDiscount ? 
        plan.basePrice - (plan.autopayDiscount ?? 0) : 
        plan.basePrice
    }));
  }

  public async getPlanById(planId: string, withAutopay: boolean = true): Promise<Plan | null> {
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
        basePrice: withAutopay && plan.autopay_discount ? 
          plan.base_price - (plan.autopay_discount ?? 0) : 
          plan.base_price,
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
