const express = require('express');
const cheerio = require('cheerio');
const fetch = require('node-fetch');

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

// New endpoint to build combined plan and pricing information
app.get('/build', (req, res) => {
  const plans = [
    { id: 1, name: 'Basic Plan', minutes: 500, data: '2GB' },
    { id: 2, name: 'Premium Plan', minutes: 'Unlimited', data: '10GB' },
    { id: 3, name: 'Unlimited Plan', minutes: 'Unlimited', data: 'Unlimited' }
  ];
  const pricingDetails = {
    1: { price: '$40', details: 'Basic plan pricing details' },
    2: { price: '$70', details: 'Premium plan pricing details' },
    3: { price: '$90', details: 'Unlimited plan pricing details' }
  };
  const builtPlans = plans.map(plan => ({ ...plan, ...pricingDetails[plan.id] }));
  res.json(builtPlans);
});

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
    
    // Find elements with class names containing 'plan' or 'price'
    const planElements = [];
    const priceElements = [];
    
    $('*').each((_, element) => {
      const className = $(element).attr('class');
      if (className) {
        if (className.toLowerCase().includes('plan')) {
          planElements.push({
            tag: element.name,
            class: className,
            text: $(element).text().trim()
          });
        }
        if (className.toLowerCase().includes('price')) {
          priceElements.push({
            tag: element.name,
            class: className,
            text: $(element).text().trim()
          });
        }
      }
    });
    
    res.json({
      planElements,
      priceElements
    });
  } catch (error) {
    console.error('Error scraping tags:', error);
    res.status(500).json({ error: 'Failed to scrape tags' });
  }
});

// Start the Verizon catered MCP server
app.listen(port, () => {
  console.log(`Verizon MCP Server running on port ${port}`);
});
