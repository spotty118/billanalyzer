
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
      try {
        if (!planData.structure?.name) {
          console.log('Skipping invalid plan data:', planData);
          continue;
        }

        // Extract and validate the price
        const rawPrice = planData.structure.price?.replace(/[^0-9.]/g, '') || '0';
        const basePrice = parseFloat(rawPrice);
        if (isNaN(basePrice)) {
          console.log('Invalid price format:', planData.structure.price);
          continue;
        }

        const plan: VerizonPlanDetails = {
          external_id: planData.id || `plan-${planData.structure.name.toLowerCase().replace(/\s+/g, '-')}`,
          name: planData.structure.name,
          base_price: basePrice,
          multi_line_discounts: {
            lines2: 0,
            lines3: 0,
            lines4: 0,
            lines5Plus: 0
          },
          features: Array.isArray(planData.structure.features) ? planData.structure.features : [],
          type: 'consumer' as const,
          data_allowance: {
            premium: 'unlimited',
            hotspot: undefined
          },
          streaming_quality: '480p' as const
        };

        // Update the plan in the database
        try {
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
        } catch (dbError) {
          console.error('Database operation failed:', dbError);
          continue;
        }
      } catch (planError) {
        console.error('Error processing plan:', planError);
        continue;
      }
    }

    console.log(`Found and updated ${plans.length} Verizon plans`);
    return plans;

  } catch (error) {
    console.error('Error scraping Verizon plans:', error);
    return [];
  }
}
