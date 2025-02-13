import express from 'express';
import * as cheerio from 'cheerio';
import fetch from 'node-fetch';

const app = express();
const port = process.env.PORT || 4000; // Default port for Verizon MCP Server

app.use(express.json());

// Endpoint to simulate Verizon plans lookup
app.get('/plans', (req, res) => {
  // Simulated plans data; in a real-world scenario, this data might be retrieved from a database or external API
  const plans = [
    { id: 1, name: 'Basic Plan', minutes: 500, data: '2GB', price: '$40' },
    { id: 2, name: 'Premium Plan', minutes: 'Unlimited', data: '10GB', price: '$70' },
    { id: 3, name: 'Unlimited Plan', minutes: 'Unlimited', data: 'Unlimited', price: '$90' }
  ];
  res.json(plans);
});

// Endpoint to simulate price lookup for a specific plan
app.get('/price', (req, res) => {
  const planId = parseInt(req.query.plan, 10);
  // Dummy data for price details based on plan id
  const pricingDetails = {
    1: { price: '$40', details: 'Basic plan pricing details' },
    2: { price: '$70', details: 'Premium plan pricing details' },
    3: { price: '$90', details: 'Unlimited plan pricing details' }
  };

  if (pricingDetails[planId]) {
    res.json(pricingDetails[planId]);
  } else {
    res.status(404).json({ error: 'Plan not found' });
  }
});

// Start the Verizon catered MCP server
// Endpoint to scrape HTML tags from Verizon's plan page
app.get('/scrape-tags', async (req, res) => {
  console.log('Received request to /scrape-tags');
  const url = req.query.url || 'https://www.verizon.com/plans/unlimited/';
  try {
    console.log('Fetching URL:', url);
    const response = await fetch(url);
    console.log('Response status:', response.status);
    const html = await response.text();
    console.log('Received HTML length:', html.length);
    const $ = cheerio.load(html);
    
    // Initialize structured results
    const plans = [];
    
    // Helper function to extract clean text content with better error handling
    const extractText = ($el) => {
      try {
        if (!$el || !$el.length) return '';
        const clone = $el.clone();
        clone.find('script, style, [class*="hidden"], [aria-hidden="true"]').remove();
        return clone.text()
          .trim()
          .replace(/\s+/g, ' ')
          .replace(/Slide \d+ of \d+ /g, '')
          .replace(/\*+$/, '')
          .replace(/^\s*[•·-]\s*/, '') // Remove leading bullets
          .replace(/\(see terms\)/i, '') // Remove common marketing text
          .replace(/\s*\([^)]*\)\s*$/, ''); // Remove trailing parentheticals
      } catch (error) {
        console.error('Error in extractText:', error);
        return '';
      }
    };

    // Helper function to clean price text
    const cleanPrice = (text) => {
      const priceMatch = text.match(/\$\d+(?:\.\d{2})?/);
      return priceMatch ? priceMatch[0] : null;
    };

    // Helper function to extract features
    const extractFeatures = ($el) => {
      const features = [];
      $el.find('li.StyledLi-VDS__sc-1vrtxhi-0').each((_, el) => {
        const text = $(el).text().trim();
        if (text && !text.includes('$')) {
          features.push(text);
        }
      });
      return features;
    };

    // Helper function to extract perks
    const extractPerks = ($el) => {
      const perks = [];
      $el.find('.PerkWrapper-VDS__sc-ui2utw-2').each((_, el) => {
        const $perk = $(el);
        const title = $perk.find('.TitleWrapper-VDS__sc-1w6xyf3-11').text().trim();
        const price = cleanPrice($perk.find('.StyledNumber-VDS__sc-6vasdc-3').text().trim());
        if (title) {
          perks.push({ title, price });
        }
      });
      return perks;
    };

    // Helper function to clean plan names
    const cleanPlanName = (name) => {
      return name
        .replace(/The .* plan,? with/, '')
        .replace(/\$\d+(\.\d{2})?\/?line\*? and.*$/, '')
        .replace(/\s+/g, ' ')
        .trim();
    };

    // Helper function to extract price with improved parsing
    const extractPrice = (text) => {
      try {
        if (!text) return null;
        
        // Handle common price formats
        const pricePatterns = [
          /\$\d+(?:\.\d{2})?(?:\/(?:mo|line|month))?/i,  // Basic price with optional /mo or /line
          /\d+(?:\.\d{2})?\s*(?:dollars|USD)/i,           // Price with 'dollars' or 'USD'
          /(?:starting at|from)\s*\$\d+(?:\.\d{2})?/i    // 'Starting at' prices
        ];

        for (const pattern of pricePatterns) {
          const match = text.match(pattern);
          if (match) {
            const price = parseFloat(match[0].replace(/[^\d.]/g, ''));
            return isNaN(price) ? null : price;
          }
        }

        // Fallback to basic price extraction
        const priceMatches = text.match(/\$\d+(?:\.\d{2})?/g) || [];
        const prices = priceMatches
          .map(price => parseFloat(price.replace('$', '')))
          .filter(price => !isNaN(price));
        
        return prices.length ? Math.min(...prices) : null;
      } catch (error) {
        console.error('Error in extractPrice:', error, 'Text:', text);
        return null;
      }
    };

    // Helper function to clean feature text
    const cleanFeatureText = (text) => {
      return text
        .replace(/^[\s•·-]+/, '') // Remove leading bullets and spaces
        .replace(/\s+/g, ' ') // Normalize spaces
        .trim();
    };

    // Find all plan cards/sections
    const planSelectors = [
      '.plan-card',
      '[class*="plan"]',
      '[class*="Plan"]',
      '.popular-plan-name-container',
      '[class*="unlimited"]',
      '[class*="Unlimited"]'
    ];

    // Log the number of elements found for each selector
    planSelectors.forEach(selector => {
      console.log(`Found ${$(selector).length} elements for selector: ${selector}`);
    });

    // Process each plan section with improved logging
    console.log('Starting plan extraction...');
    let totalPlansFound = 0;
    
    planSelectors.forEach(selector => {
      const elements = $(selector);
      console.log(`Processing ${elements.length} elements for selector: ${selector}`);
      
      elements.each((_, planElement) => {
        totalPlansFound++;
        const $plan = $(planElement);
        let planName = extractText($plan.find('[class*="plan-name"], [class*="planName"], [class*="popular-plan-name"], h3, h4, span').first());
        planName = cleanPlanName(planName);
        
        if (!planName) return;

        // Extract prices
        const prices = {};
        $plan.find('[class*="price"], [class*="cost"], [data-price], [class*="Price"], [class*="Cost"]').each((_, priceEl) => {
          const $price = $(priceEl);
          const priceText = extractText($price);
          const price = extractPrice(priceText);
          if (price) {
            const priceKey = 
              priceText.toLowerCase().includes('line') ? 'perLine' :
              priceText.toLowerCase().includes('month') ? 'monthly' :
              'base';
            
            // Only update if the new price is lower (better deal)
            if (!prices[priceKey] || price < prices[priceKey]) {
              prices[priceKey] = price;
            }
          }
        });

        // Extract features and perks
        const features = [];
        $plan.find('[class*="feature"], [class*="perk"], [class*="benefit"], [class*="Feature"], [class*="Perk"], [class*="Benefit"], li').each((_, featureEl) => {
          const featureText = cleanFeatureText(extractText($(featureEl)));
          if (featureText.length > 3 && 
              !featureText.includes('$') && 
              !featureText.toLowerCase().includes('slide') &&
              !featureText.toLowerCase().includes('close')) {
            features.push(featureText);
          }
        });

        // Extract perks
        const perks = extractPerks($plan);

        // Create structured plan object with validation
        const plan = {
          name: planName,
          prices: Object.keys(prices).length > 0 ? prices : null,
          features: features.length > 0 ? [...new Set(features)] : null, // Remove duplicates
          perks: perks.length > 0 ? perks : null,
          savings: prices.withoutAutoPay && prices.monthly ? {
            amount: prices.withoutAutoPay - prices.monthly,
            description: 'with Auto Pay & paper-free billing'
          } : null,
          metadata: {
            extractedAt: new Date().toISOString(),
            source: url,
            selector: selector
          }
        };

        // Only add if we have meaningful data
        if (plan.name && plan.prices && (Object.keys(plan.prices).length > 0 || (plan.features && plan.features.length > 0))) {
          plans.push(plan);
        }
      });
    });

    // Remove duplicate plans and invalid entries
    const validPlans = plans.filter(plan => plan && plan.name && plan.prices);
    const uniquePlans = validPlans.filter((plan, index, self) =>
      index === self.findIndex((p) => p && p.name === plan.name)
    );
    
    // Format prices as strings with dollar signs
    uniquePlans.forEach(plan => {
      if (plan && plan.prices) {
        const formattedPrices = {};
        Object.entries(plan.prices).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            formattedPrices[key] = `$${value.toFixed(2)}`;
          }
        });
        plan.prices = formattedPrices;
      }
    });

    res.json({
      plans: uniquePlans,
      timestamp: new Date().toISOString(),
      url: url
    });
  } catch (error) {
    console.error('Error scraping tags:', error);
    res.status(500).json({ error: 'Failed to scrape tags' });
  }
});

app.listen(port, () => {
  console.log(`Verizon MCP Server running on port ${port}`);
});
