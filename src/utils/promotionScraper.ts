
import axios from 'axios';
import type { Promotion } from './types';
import { supabase } from '@/integrations/supabase/client';

/**
 * Scrapes and updates promotions using Puppeteer
 */
export async function scrapeGridPromotions(): Promise<Promotion[]> {
  try {
    console.log('Starting promotion scraping...');
    const { data } = await axios.get('/api/grid');
    
    if (!data?.html) {
      console.log('No HTML content found in response');
      return [];
    }
    
    // Extract promotions from the page content
    const promotions: Promotion[] = [];
    const promoElements = data.html.match(/<div[^>]*class="[^"]*promo[^"]*"[^>]*>[\s\S]*?<\/div>/g) || [];
    
    for (const element of promoElements) {
      // Extract promotion details using regex patterns
      const titleMatch = element.match(/<h\d[^>]*>(.*?)<\/h\d>/);
      const descMatch = element.match(/<p[^>]*>(.*?)<\/p>/);
      const valueMatch = element.match(/\$[\d,]+(\.\d{2})?/);
      
      if (titleMatch) {
        const title = titleMatch[1].trim();
        const promo_id = `promo-${title.toLowerCase().replace(/\s+/g, '-')}`;
        
        const promotionData = {
          id: '', // Will be set by Supabase
          external_id: promo_id,
          title,
          description: descMatch ? descMatch[1].trim() : '',
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          type: 'device' as const,
          value: valueMatch ? valueMatch[0] : 'Contact for details',
          stackable: false
        };

        // Update promotion in database
        const { data: existingPromo } = await supabase
          .from('verizon_promotions')
          .select('id')
          .eq('external_id', promo_id)
          .maybeSingle();

        const { id, ...dataToUpsert } = promotionData;

        if (existingPromo) {
          const { error: updateError } = await supabase
            .from('verizon_promotions')
            .update(dataToUpsert)
            .eq('external_id', promo_id);

          if (updateError) {
            console.error('Error updating promotion:', updateError);
          }
        } else {
          const { error: insertError } = await supabase
            .from('verizon_promotions')
            .insert(dataToUpsert);

          if (insertError) {
            console.error('Error inserting promotion:', insertError);
          }
        }

        promotions.push(promotionData);
      }
    }

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
