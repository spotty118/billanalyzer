import express from 'express';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

app.get('/search-plans', (req, res) => {
  const pricingData = {
    standardPricing: {
      metadata: {
        lastUpdated: '2025-02-12',
        notes: [
          'Standard pricing without Auto Pay & paper-free billing discount',
          'Prices are per line per month',
          'Additional taxes and fees apply'
        ]
      },
      plans: [
        {
          name: 'Unlimited Ultimate',
          prices: {
            '5+': 62,
            '4': 65,
            '3': 75,
            '2': 90,
            '1': 100
          }
        },
        {
          name: 'Unlimited Plus',
          prices: {
            '5+': 52,
            '4': 55,
            '3': 65,
            '2': 80,
            '1': 90
          }
        },
        {
          name: 'Unlimited Welcome',
          prices: {
            '5+': 37,
            '4': 40,
            '3': 50,
            '2': 65,
            '1': 75
          }
        }
      ]
    },
    autoPayPricing: {
      metadata: {
        lastUpdated: '2025-02-12',
        notes: [
          'Prices shown with Auto Pay & paper-free billing discount',
          'Prices are per line per month',
          'Additional taxes and fees apply',
          'Save $10/line per month with Auto Pay & paper-free billing'
        ]
      },
      plans: [
        {
          name: 'Unlimited Ultimate',
          prices: {
            '5+': 52,
            '4': 55,
            '3': 65,
            '2': 80,
            '1': 90
          }
        },
        {
          name: 'Unlimited Plus',
          prices: {
            '5+': 42,
            '4': 45,
            '3': 55,
            '2': 70,
            '1': 80
          }
        },
        {
          name: 'Unlimited Welcome',
          prices: {
            '5+': 27,
            '4': 30,
            '3': 40,
            '2': 55,
            '1': 65
          }
        }
      ]
    }
  };

  res.json(pricingData);
});

app.listen(PORT, () => {
  console.log(`MCP Fetch Server listening on port ${PORT}`);
});
