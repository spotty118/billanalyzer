
import axios from 'axios';
import * as cheerio from 'cheerio';
import type { VerizonPlanDetails } from './types';
import { supabase } from '@/integrations/supabase/client';

// Helper functions
function extractPrice($element: cheerio.Cheerio<cheerio.Element>): number {
  const priceText = $element.text().trim();
  return parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;
}

function extractHotspotData($element: cheerio.Cheerio<cheerio.Element>): number | undefined {
  const hotspotEl = $element.find('.hotspot-data, .mobile-hotspot').first();
  if (!hotspotEl.length) return undefined;
  const hotspotText = hotspotEl.text().trim();
  const hotspotGB = parseInt(hotspotText.match(/\d+/)?.[0] || '0');
  return hotspotGB || undefined;
}

function determineStreamingQuality(text: string): '480p' | '720p' | '1080p' | '4K' {
  if (text.includes('4k') || text.includes('uhd')) return '4K';
  if (text.includes('1080p') || text.includes('fhd')) return '1080p';
  if (text.includes('720p') || text.includes('hd')) return '720p';
  return '480p';
}

function extractDiscount($element: cheerio.Cheerio<cheerio.Element>, type: 'autopay' | 'paperless'): number | undefined {
  const discountEl = $element.find(`.${type}-discount, .${type}-billing`).first();
  if (!discountEl.length) return undefined;
  const discountText = discountEl.text().trim();
  const discount = parseFloat(discountText.replace(/[^0-9.]/g, ''));
  return discount || undefined;
}

/**
 * Scrapes and updates Verizon plan information
 */
export async function scrapeVerizonPlans(): Promise<VerizonPlanDetails[]> {
  try {
    console.log('Starting Verizon plan scraping...');
    const { data } = await axios.get('/api/grid');
    
    if (!data.html) {
      console.log('No HTML content found in response');
      return [];
    }
    
    const $ = cheerio.load(data.html);
    const plans: VerizonPlanDetails[] = [];

    // Plan selectors based on Verizon's structure
    const planSelectors = [
      '.plan-card',
      '.vz-plan-card',
      '.plan-details',
      '[data-testid="plan-card"]',
      '.plan-pricing-table tr'
    ];

    planSelectors.forEach(selector => {
      $(selector).each((_, element) => {
        const $el = $(element);
        
        // Extract plan name
        const nameEl = $el.find('.plan-name, .plan-title, h2, h3').first();
        const name = nameEl.length ? nameEl.text().trim() : '';
        
        // Extract base price
        const priceEl = $el.find('.price, .base-price').first();
        const basePriceText = priceEl.length ? priceEl.text().trim() : '0';
        const basePrice = parseFloat(basePriceText.replace(/[^0-9.]/g, '')) || 0;

        // Extract multi-line discounts
        const multiLineDiscounts = {
          lines2: extractPrice($el.find('[data-lines="2"]')),
          lines3: extractPrice($el.find('[data-lines="3"]')),
          lines4: extractPrice($el.find('[data-lines="4"]')),
          lines5Plus: extractPrice($el.find('[data-lines="5"]'))
        };

        // Extract features
        const features = $el.find('.features li, .plan-features li')
          .map((_, feature) => $(feature).text().trim())
          .get()
          .filter(Boolean);

        // Extract data allowance and handle unlimited case
        const dataEl = $el.find('.data-allowance, .data-details').first();
        const dataText = dataEl.length ? dataEl.text().trim().toLowerCase() : '';
        const dataAllowance = {
          premium: dataText.includes('unlimited') ? 'unlimited' as const : parseInt(dataText) || 0,
          hotspot: extractHotspotData($el)
        };

        // Extract streaming quality
        const streamingEl = $el.find('.streaming-quality, .video-quality').first();
        const streamingText = streamingEl.length ? streamingEl.text().trim().toLowerCase() : '';
        const streamingQuality = determineStreamingQuality(streamingText);

        // Extract autopay and paperless discounts
        const autopayDiscount = extractDiscount($el, 'autopay');
        const paperlessDiscount = extractDiscount($el, 'paperless');

        if (name) {
          plans.push({
            external_id: $el.attr('id') || `plan-${name.toLowerCase().replace(/\s+/g, '-')}`,
            name,
            base_price: basePrice,
            multi_line_discounts: multiLineDiscounts,
            features,
            type: 'consumer',
            data_allowance: dataAllowance,
            streaming_quality: streamingQuality,
            ...(autopayDiscount && { autopay_discount: autopayDiscount }),
            ...(paperlessDiscount && { paperless_discount: paperlessDiscount })
          });
        }
      });
    });

    // Update plans in database
    if (plans.length > 0) {
      for (const plan of plans) {
        const { data: existingPlan, error: selectError } = await supabase
          .from('verizon_plans')
          .select('id')
          .eq('external_id', plan.external_id)
          .maybeSingle();

        if (selectError) {
          console.error('Error checking existing plan:', selectError);
          continue;
        }

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
      }
    }

    console.log(`Found and updated ${plans.length} Verizon plans`);
    return plans;

  } catch (error) {
    console.error('Error scraping Verizon plans:', error);
    return [];
  }
}
