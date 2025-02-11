import axios from 'axios';
import * as cheerio from 'cheerio';
import { Plan, Promotion } from '@/types';

interface TableStructure {
  rows: number;
  cells: number;
  headers: string[];
  firstRowText: string;
}

export interface VerizonPlanDetails {
  id: string;
  name: string;
  basePrice: number;
  multiLineDiscounts: {
    lines2: number;
    lines3: number;
    lines4: number;
    lines5Plus: number;
  };
  features: string[];
  type: 'consumer' | 'business';
  dataAllowance: {
    premium: number | 'unlimited';
    hotspot?: number;
  };
  streamingQuality: '480p' | '720p' | '1080p' | '4K';
  autopayDiscount?: number;
  paperlessDiscount?: number;
}

/**
 * Scrapes real-time Verizon consumer plan information
 */
export async function scrapeVerizonPlans(): Promise<VerizonPlanDetails[]> {
  try {
    console.log('Starting Verizon plan scraping...');
    const { data } = await axios.get('http://localhost:3001/api/grid');
    
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
      $(selector).each((index, element) => {
        const $el = $(element);
        
        // Extract plan name
        const name = $el.find('.plan-name, .plan-title, h2, h3').first().text().trim();
        
        // Extract base price
        const basePriceText = $el.find('.price, .base-price').first().text().trim();
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

        // Extract data allowance
        const dataText = $el.find('.data-allowance, .data-details').first().text().trim();
        const dataAllowance = {
          premium: dataText.toLowerCase().includes('unlimited') ? 'unlimited' : parseInt(dataText) || 0,
          hotspot: extractHotspotData($el)
        };

        // Extract streaming quality
        const streamingText = $el.find('.streaming-quality, .video-quality').first().text().trim().toLowerCase();
        const streamingQuality = determineStreamingQuality(streamingText);

        // Extract autopay and paperless discounts
        const autopayDiscount = extractDiscount($el, 'autopay');
        const paperlessDiscount = extractDiscount($el, 'paperless');

        if (name) {
          plans.push({
            id: $el.attr('id') || `plan-${index}`,
            name,
            basePrice,
            multiLineDiscounts,
            features,
            type: 'consumer',
            dataAllowance,
            streamingQuality,
            ...(autopayDiscount && { autopayDiscount }),
            ...(paperlessDiscount && { paperlessDiscount })
          });
        }
      });
    });

    console.log(`Found ${plans.length} Verizon plans`);
    return plans;

  } catch (error) {
    console.error('Error scraping Verizon plans:', error);
    return [];
  }
}

// Helper functions
function extractPrice($element: cheerio.Cheerio): number {
  const priceText = $element.text().trim();
  return parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;
}

function extractHotspotData($element: cheerio.Cheerio): number | undefined {
  const hotspotText = $element.find('.hotspot-data, .mobile-hotspot').first().text().trim();
  const hotspotGB = parseInt(hotspotText.match(/\d+/)?.[0] || '0');
  return hotspotGB || undefined;
}

function determineStreamingQuality(text: string): '480p' | '720p' | '1080p' | '4K' {
  if (text.includes('4k') || text.includes('uhd')) return '4K';
  if (text.includes('1080p') || text.includes('fhd')) return '1080p';
  if (text.includes('720p') || text.includes('hd')) return '720p';
  return '480p';
}

function extractDiscount($element: cheerio.Cheerio, type: 'autopay' | 'paperless'): number | undefined {
  const discountText = $element.find(`.${type}-discount, .${type}-billing`).first().text().trim();
  const discount = parseFloat(discountText.replace(/[^0-9.]/g, ''));
  return discount || undefined;
}

/**
 * Scrapes promotions from vzdaily.com
 */
export async function scrapeGridPromotions(): Promise<Promotion[]> {
  try {
    const { data } = await axios.get('http://localhost:3001/api/grid');
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
      $(selector).each((index, element) => {
        const $el = $(element);
        
        // Extract title from various possible elements
        const title = $el.find('.title, .promo-title, .deal-title, h2, h3').first().text().trim() ||
                     $el.find('td').eq(1).text().trim();

        // Extract date from various possible elements
        const startDate = $el.find('.date, .start-date, time').first().text().trim() ||
                         $el.find('td').eq(2).text().trim() ||
                         new Date().toISOString();

        // Extract key points
        const keyPoints = $el.find('.details, .description, .key-points, td').eq(3)
          .text()
          .split(/[•\n]/)
          .map(point => point.trim())
          .filter(point => point.length > 0);

        // Extract eligibility
        const eligibility = $el.find('.eligibility, .requirements, td').eq(4)
          .text()
          .split(/[•\n]/)
          .map(item => item.trim())
          .filter(item => item.length > 0);

        // Extract promo type
        const promoType = $el.find('.type, .category, td').first()
          .text()
          .split(/[/\n]/)
          .map(type => type.trim())
          .filter(Boolean)
          .join('/') || 'Other';

        if (title) {
          promotions.push({
            id: $el.attr('id') || String(index),
            title,
            startDate,
            keyPoints,
            eligibility,
            partnerType: 'Verizon',
            promoType
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
  try {
    const { data } = await axios.get('https://www.verizon.com/promotions');
    const $ = cheerio.load(data);
    const promotions: Promotion[] = [];

    $('.promotion-item').each((index, element) => {
      const $el = $(element);
      promotions.push({
        id: $el.attr('data-id') || String(index),
        title: $el.find('.promotion-title').text().trim(),
        startDate: new Date().toISOString(),
        keyPoints: [$el.find('.promotion-description').text().trim()],
        eligibility: [],
        partnerType: 'Verizon',
        promoType: $el.find('.promotion-type').text().trim() || 'Other'
      });
    });

    return promotions;
  } catch (error) {
    console.error('Error scraping Verizon promotions:', error);
    return [];
  }
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  features: string[];
  type: string;
}

export async function fetchVerizonPlans(): Promise<Plan[]> {
  try {
    const { data } = await axios.get('https://www.verizon.com/plans');
    const $ = cheerio.load(data);
    const plans: Plan[] = [];

    $('.plan-item').each((index, element) => {
      const $el = $(element);
      plans.push({
        id: $el.attr('data-id') || String(index),
        name: $el.find('.plan-name').text().trim(),
        price: parseFloat($el.find('.plan-price').text().replace('$', '').trim()),
        features: $el.find('.plan-features').text().trim().split('\n').map(f => f.trim()),
        type: $el.find('.plan-type').text().trim()
      });
    });

    return plans;
  } catch (error) {
    console.error('Error fetching Verizon plans:', error);
    return [];
  }
}
