
import axios from 'axios';
import * as cheerio from 'cheerio';
import type { Cheerio } from 'cheerio';
import type { Element } from 'domhandler';
import type { Promotion } from '@/types';
import { supabase } from '@/integrations/supabase/client';

// Define VerizonPlanDetails interface locally since it's specific to the scraper
export interface VerizonPlanDetails {
  external_id: string;
  name: string;
  base_price: number;
  multi_line_discounts: {
    lines2: number;
    lines3: number;
    lines4: number;
    lines5Plus: number;
  };
  features: string[];
  type: 'consumer' | 'business';
  data_allowance: {
    premium: number | 'unlimited';
    hotspot?: number;
  };
  streaming_quality: '480p' | '720p' | '1080p' | '4K';
  autopay_discount?: number;
  paperless_discount?: number;
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
        const priceEl = $el.find('.price', '.base-price').first();
        const basePriceText = priceEl.length ? priceEl.text().trim() : '0';
        const basePrice = parseFloat(basePriceText.replace(/[^0-9.]/g, '')) || 0;

        // Extract multi-line discounts
        const multiLineDiscounts = {
          lines2: extractPrice($el.find('[data-lines="2"]') as Cheerio<Element>),
          lines3: extractPrice($el.find('[data-lines="3"]') as Cheerio<Element>),
          lines4: extractPrice($el.find('[data-lines="4"]') as Cheerio<Element>),
          lines5Plus: extractPrice($el.find('[data-lines="5"]') as Cheerio<Element>)
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
          hotspot: extractHotspotData($el as Cheerio<Element>)
        };

        // Extract streaming quality
        const streamingEl = $el.find('.streaming-quality, .video-quality').first();
        const streamingText = streamingEl.length ? streamingEl.text().trim().toLowerCase() : '';
        const streamingQuality = determineStreamingQuality(streamingText);

        // Extract autopay and paperless discounts
        const autopayDiscount = extractDiscount($el as Cheerio<Element>, 'autopay');
        const paperlessDiscount = extractDiscount($el as Cheerio<Element>, 'paperless');

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

// Helper functions
function extractPrice($element: Cheerio<Element>): number {
  if (!$element.length) return 0;
  const priceText = $element.text().trim();
  return parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;
}

function extractHotspotData($element: Cheerio<Element>): number | undefined {
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

function extractDiscount($element: Cheerio<Element>, type: 'autopay' | 'paperless'): number | undefined {
  const discountEl = $element.find(`.${type}-discount, .${type}-billing`).first();
  if (!discountEl.length) return undefined;
  const discountText = discountEl.text().trim();
  const discount = parseFloat(discountText.replace(/[^0-9.]/g, ''));
  return discount || undefined;
}

/**
 * Scrapes and updates promotions from grid
 */
export async function scrapeGridPromotions(): Promise<Promotion[]> {
  try {
    const { data } = await axios.get('/api/grid');
    console.log('Parsing response...');
    
    if (!data.html) {
      console.log('No HTML content found in response');
      return [];
    }
    
    const $ = cheerio.load(data.html);
    const promotions: Promotion[] = [];

    // Look for promotion elements with different selectors
    const promoSelectors = [
      '.promo-grid .promo-item',
      '.deals-grid .deal-item',
      '.promotion-card',
      '[data-testid="promotion-item"]',
      'table tr:not(:first-child)',
      '[role="row"]:not([role="columnheader"])'
    ];

    promoSelectors.forEach(selector => {
      $(selector).each((_, element) => {
        const $el = $(element);
        
        // Extract data from element using helper functions that handle Element type
        const titleEl = $el.find('.title, .promo-title, .deal-title, h2, h3').first();
        const title = titleEl.length ? titleEl.text().trim() : 
                     $el.find('td').eq(1).text().trim();

        const descriptionEl = $el.find('.details, .description, td').first();
        const description = descriptionEl.length ? descriptionEl.text().trim() : '';
        
        const terms = extractTerms($el as Cheerio<Element>);
        
        const expiresEl = $el.find('.date, .expiration, time').first();
        const expires = expiresEl.length ? expiresEl.text().trim() :
                       new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
                       
        const valueEl = $el.find('.value, .savings').first();
        const value = valueEl.length ? valueEl.text().trim() : 'Contact for details';
        
        const type = determinePromotionType($el as Cheerio<Element>);

        if (title) {
          const promo_id = $el.attr('id') || `promo-${title.toLowerCase().replace(/\s+/g, '-')}`;
          
          const promotionData = {
            id: '', // Will be set by Supabase
            external_id: promo_id,
            title,
            description,
            expires,
            type,
            value,
            terms: terms.length > 0 ? terms : undefined,
            stackable: false
          };

          promotions.push(promotionData);

          // Update promotion in database
          supabase
            .from('verizon_promotions')
            .select('id')
            .eq('external_id', promo_id)
            .maybeSingle()
            .then(({ data: existingPromo, error: selectError }) => {
              if (selectError) {
                console.error('Error checking existing promotion:', selectError);
                return;
              }

              const { id, ...dataToUpsert } = promotionData;

              if (existingPromo) {
                return supabase
                  .from('verizon_promotions')
                  .update(dataToUpsert)
                  .eq('external_id', promo_id);
              } else {
                return supabase
                  .from('verizon_promotions')
                  .insert(dataToUpsert);
              }
            })
            .then(result => {
              if (result?.error) {
                console.error('Error upserting promotion:', result.error);
              }
            });
        }
      });
    });

    console.log(`Found ${promotions.length} promotions`);
    return promotions;

  } catch (error) {
    console.error('Error scraping Grid promotions:', error);
    return [];
  }
}

// Helper functions for promotions
function extractTerms($el: Cheerio<Element>): string[] {
  const termsEl = $el.find('.terms, .requirements, td').eq(4);
  return termsEl.length ? 
    termsEl.text()
      .split(/[•\n]/)
      .map(item => item.trim())
      .filter(item => item.length > 0) : 
    [];
}

function determinePromotionType($el: Cheerio<Element>): 'device' | 'plan' | 'trade-in' {
  const typeEl = $el.find('.type, .category, td').first();
  const typeText = typeEl.length ? typeEl.text().trim().toLowerCase() : '';
  if (typeText.includes('device')) return 'device';
  if (typeText.includes('plan')) return 'plan';
  return 'trade-in';
}

/** @deprecated Use scrapeGridPromotions instead */
export async function scrapeVerizonPromotions(): Promise<Promotion[]> {
  return scrapeGridPromotions();
}
