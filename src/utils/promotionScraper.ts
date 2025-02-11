
import axios from 'axios';
import * as cheerio from 'cheerio';
import type { Promotion } from './types';
import { supabase } from '@/integrations/supabase/client';

function extractTerms($el: cheerio.Cheerio<cheerio.Element>): string[] {
  const termsEl = $el.find('.terms, .requirements, td').eq(4);
  return termsEl.length ? 
    termsEl.text()
      .split(/[•\n]/)
      .map((item: string) => item.trim())
      .filter((item: string) => item.length > 0) : 
    [];
}

function determinePromotionType($el: cheerio.Cheerio<cheerio.Element>): 'device' | 'plan' | 'trade-in' {
  const typeEl = $el.find('.type, .category, td').first();
  const typeText = typeEl.length ? typeEl.text().trim().toLowerCase() : '';
  if (typeText.includes('device')) return 'device';
  if (typeText.includes('plan')) return 'plan';
  return 'trade-in';
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
        
        const terms = extractTerms($el);
        
        const expiresEl = $el.find('.date, .expiration, time').first();
        const expires = expiresEl.length ? expiresEl.text().trim() :
                       new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
                       
        const valueEl = $el.find('.value, .savings').first();
        const value = valueEl.length ? valueEl.text().trim() : 'Contact for details';
        
        const type = determinePromotionType($el);

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

/** @deprecated Use scrapeGridPromotions instead */
export async function scrapeVerizonPromotions(): Promise<Promotion[]> {
  return scrapeGridPromotions();
}
