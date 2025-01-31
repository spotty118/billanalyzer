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

    // Wait longer for dynamic content to load
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Fixed column indices based on actual table structure
    const COLUMNS = {
      PROMO_TYPE: 0,
      TITLE: 1,
      START_DATE: 2,
      KEY_POINTS: 3,
      ELIGIBILITY: 4
    };

    // Use table analysis to find promotion tables
    let $rows;
    if (data.tableAnalysis) {
      // Find tables with promotion-related headers
      const promotionTables = data.tableAnalysis.filter(table => 
        table.structure.headers.some(header => 
          header.toLowerCase().includes('promotion') ||
          header.toLowerCase().includes('promo') ||
          header.toLowerCase().includes('key points')
        )
      );

      if (promotionTables.length > 0) {
        const table = promotionTables[0];
        const tableSelector = table.id ? `#${table.id}` : 
                            table.className ? `.${table.className.split(' ')[0]}` : 
                            `${table.tag}[role="${table.role}"]`;
        
        console.log('Found promotion table with selector:', tableSelector);
        $rows = $(tableSelector).find('tr, [role="row"]');
      }
    }

    // If no rows found through table analysis, fall back to DOM searching
    if (!$rows || $rows.length === 0) {
      const $tables = $('table, [role="grid"], [role="table"], .grid, .table').filter((_, el) => {
        const $el = $(el);
        const headers = $el.find('th').map((_, th) => $(th).text().toLowerCase()).get();
        return headers.some(header => 
          header.includes('promotion') ||
          header.includes('key points')
        );
      });

      $rows = $tables.find('tr, [role="row"]');
    }

    console.log(`Found ${$rows?.length || 0} potential promotion rows`);
    
    // Process each row
    $rows?.each((index, row) => {
      const $row = $(row);
      const $cells = $row.find('td');

      // Skip header row and rows without enough cells
      if ($cells.length < 4) return;

      const cellTexts = $cells.map((_, cell) => $(cell).text().trim()).get();
      
      // Extract title and remove any OST numbers
      const title = cellTexts[COLUMNS.TITLE].replace(/\s*\([^)]*\)\s*$/, '').trim();
      
      // Parse key points, handling nested bullet points
      const keyPointsText = cellTexts[COLUMNS.KEY_POINTS];
      const keyPoints = keyPointsText
        .split(/(?=•)/)  // Split on bullet points while keeping the bullet
        .map(point => point.replace(/^[•\s-]+/, '').trim()) // Remove bullet and whitespace
        .filter(point => point.length > 0);

      // Parse eligibility, handling multiple formats
      const eligibilityText = cellTexts[COLUMNS.ELIGIBILITY];
      const eligibility = eligibilityText
        .split(/\n/)
        .map(item => item.replace(/^[•\s-]+/, '').trim())
        .filter(item => item.length > 0);

      // Parse promo type, handling multiple values
      const promoType = cellTexts[COLUMNS.PROMO_TYPE]
        .split(/[/\n]/)
        .map(type => type.trim())
        .filter(Boolean)
        .join('/');

      const promotion: Promotion = {
        id: String(index),
        title,
        startDate: cellTexts[COLUMNS.START_DATE],
        keyPoints,
        eligibility,
        partnerType: 'Verizon',  // Default since not explicitly in table
        promoType
      };

      console.log('Extracted promotion:', promotion);
      promotions.push(promotion);
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
