
import axios from 'axios';
import type { VerizonPlanDetails } from './types';
import { supabase } from '@/integrations/supabase/client';

/**
 * Scrapes and updates Verizon plan information using Puppeteer
 */
export async function scrapeVerizonPlans(): Promise<VerizonPlanDetails[]> {
  try {
    console.log('Starting Verizon plan scraping...');
    const { data } = await axios.get('/api/grid');
    
    if (!data?.planAnalysis?.length) {
      console.log('No plan data found in response');
      return [];
    }

    const plans: VerizonPlanDetails[] = [];
    
    for (const planData of data.planAnalysis) {
      if (planData.structure?.name) {
        const plan = {
          external_id: planData.id || `plan-${planData.structure.name.toLowerCase().replace(/\s+/g, '-')}`,
          name: planData.structure.name,
          base_price: parseFloat(planData.structure.price?.replace(/[^0-9.]/g, '') || '0'),
          multi_line_discounts: {
            lines2: 0,
            lines3: 0,
            lines4: 0,
            lines5Plus: 0
          },
          features: planData.structure.features || [],
          type: 'consumer',
          data_allowance: {
            premium: 'unlimited',
            hotspot: undefined
          },
          streaming_quality: '480p' as const
        };

        // Update the plan in the database
        const { data: existingPlan } = await supabase
          .from('verizon_plans')
          .select('id')
          .eq('external_id', plan.external_id)
          .maybeSingle();

        if (existingPlan) {
          const { error: updateError } = await supabase
            .from('verizon_plans')
            .update(plan)
            .eq('external_id', plan.external_id);

          if (updateError) {
            console.error('Error updating plan:', updateError);
          }
        } else {
          const { error: insertError } = await supabase
            .from('verizon_plans')
            .insert(plan);

          if (insertError) {
            console.error('Error inserting plan:', insertError);
          }
        }

        plans.push(plan);
      }
    }

    console.log(`Found and updated ${plans.length} Verizon plans`);
    return plans;

  } catch (error) {
    console.error('Error scraping Verizon plans:', error);
    return [];
  }
}

