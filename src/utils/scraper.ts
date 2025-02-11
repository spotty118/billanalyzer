import axios from 'axios';
import * as cheerio from 'cheerio';

interface TableStructure {
  rows: number;
  cells: number;
  headers: string[];
  firstRowText: string;
}

interface TableAnalysis {
  tag: string;
  id: string;
  className: string;
  role: string | null;
  structure: TableStructure;
}

export interface Promotion {
  id: string;
  title: string;  // Added title field
  startDate: string;
  keyPoints: string[];
  eligibility: string[];
  partnerType: string;
  promoType: string;
  promotionCode?: string;
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
