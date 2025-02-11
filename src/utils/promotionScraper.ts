
import axios from 'axios';
import type { Promotion } from './types';
import { supabase } from '@/integrations/supabase/client';

/**
 * Scrapes and updates promotions using the Grid API
 */
export async function scrapeGridPromotions(): Promise<Promotion[]> {
  try {
    console.log('Starting promotion scraping...');
    const { data, status } = await axios.get('/api/grid');
    
    if (status !== 200 || !data?.html) {
      console.error('Invalid response from grid API:', { status, data });
      throw new Error('Failed to fetch grid data');
    }
    
    // Extract promotions from the page content
    const promotions: Promotion[] = [];
    const promoElements = data.html.match(/<div[^>]*class="[^"]*promo[^"]*"[^>]*>[\s\S]*?<\/div>/g) || [];
    
    console.log(`Found ${promoElements.length} potential promotion elements`);
    
    for (const element of promoElements) {
      try {
        // Extract promotion details using regex patterns
        const titleMatch = element.match(/<h\d[^>]*>(.*?)<\/h\d>/);
        const descMatch = element.match(/<p[^>]*>(.*?)<\/p>/);
        const valueMatch = element.match(/\$[\d,]+(\.\d{2})?/);
        
        if (!titleMatch?.[1]) {
          console.log('Skipping promotion without valid title');
          continue;
        }

        const title = titleMatch[1].trim();
        const promo_id = `promo-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
        
        const promotionData: Promotion = {
          id: '', // Will be set by Supabase
          external_id: promo_id,
          title,
          description: descMatch?.[1]?.trim() || '',
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          type: determinePromotionType(title, descMatch?.[1] || ''),
          value: valueMatch?.[0] || 'Contact for details',
          stackable: false,
          terms: [],
          eligiblePlans: []
        };

        console.log('Processing promotion:', { 
          external_id: promo_id, 
          title, 
          type: promotionData.type 
        });

        try {
          // Update promotion in database
          const { data: existingPromo, error: selectError } = await supabase
            .from('verizon_promotions')
            .select('id')
            .eq('external_id', promo_id)
            .maybeSingle();

          if (selectError) {
            console.error('Error checking existing promotion:', selectError);
            continue;
          }

          const { id, ...dataToUpsert } = promotionData;

          if (existingPromo) {
            const { error: updateError } = await supabase
              .from('verizon_promotions')
              .update(dataToUpsert)
              .eq('external_id', promo_id);

            if (updateError) {
              console.error('Error updating promotion:', updateError);
              continue;
            }
          } else {
            const { error: insertError } = await supabase
              .from('verizon_promotions')
              .insert(dataToUpsert);

            if (insertError) {
              console.error('Error inserting promotion:', insertError);
              continue;
            }
          }

          promotions.push(promotionData);
          console.log('Successfully processed promotion:', promo_id);
        } catch (dbError) {
          console.error('Database operation failed:', dbError);
          continue;
        }
      } catch (promoError) {
        console.error('Error processing promotion:', promoError);
        continue;
      }
    }

    console.log(`Successfully processed ${promotions.length} promotions`);
    return promotions;

  } catch (error) {
    console.error('Error scraping Grid promotions:', error);
    throw new Error('Failed to scrape promotions');
  }
}

/**
 * Determines the promotion type based on title and description
 */
function determinePromotionType(title: string, description: string): 'device' | 'plan' | 'trade-in' {
  const text = `${title} ${description}`.toLowerCase();
  
  if (text.includes('trade') || text.includes('upgrade')) {
    return 'trade-in';
  }
  if (text.includes('device') || text.includes('phone') || text.includes('tablet')) {
    return 'device';
  }
  return 'plan';
}

/** @deprecated Use scrapeGridPromotions instead */
export async function scrapeVerizonPromotions(): Promise<Promotion[]> {
  return scrapeGridPromotions();
}
