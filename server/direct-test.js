import fs from 'fs';
import path from 'path';

// Path to a sample bill text file
const sampleBillPath = process.argv[2] || '../sample-bill.txt';

// Simple price pattern detection
const pricePatterns = [
  {
    pattern: /(.+?)\$\s*(-?\d+\.\d{2})/,               // Standard price format: "Description $XX.XX"
    descGroup: 1,
    amountGroup: 2
  },
  {
    pattern: /\$\s*(-?\d+\.\d{2})\s*(.+)/,            // Reversed format: "$XX.XX Description"
    descGroup: 2,
    amountGroup: 1
  },
  {
    pattern: /(.+?)(-?\d+\.\d{2})\s*dollars/i,        // "dollars" format: "Description XX.XX dollars"
    descGroup: 1,
    amountGroup: 2
  },
  {
    pattern: /(.+?)(?:[@\-]|\s+)\$?\s*(-?\d+\.\d{2})/, // Description with separator: "Description - $XX.XX"
    descGroup: 1,
    amountGroup: 2
  }
];

// Common Verizon charge patterns
const chargePatterns = {
  lineAccess: /(Line Access( Charge)?|Access Fee|Monthly Line|Line Monthly|Line Charge)/i,
  devicePayment: /(Device Payment|Equipment Charge|Phone Payment|Device Installment|Equipment Installment|Phone Installment)/i,
  surcharge: /(Federal|State|County|City|Municipal|Regulatory|Universal Service|E911|Emergency|Admin|Recovery|Fee)/i,
  promotion: /(Promotion|Discount|Credit|Adjustment|Loyalty|Bundle|Auto Pay|Paperless|Promo)/i,
  plan: /(Plan( Charge)?|Data( Plan)?|Unlimited( Plan)?|5G|LTE|Premium|Play More|Do More|Get More)/i,
  usage: /(Overage|Extra Data|Pay Per Use|International|Roaming|Additional Data|Usage)/i
};

// Direct implementation of charge detection
function findChargesInText(text) {
  const charges = [];
  console.log('Processing text for charges...');
  
  const lines = text.split('\n');
  let currentSection = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Try each price pattern
    for (const { pattern, descGroup, amountGroup } of pricePatterns) {
      const match = line.match(pattern);
      if (match) {
        console.log('Found price match:', line);
        const description = match[descGroup].trim();
        const amount = parseFloat(match[amountGroup]);

        // Determine charge type
        let chargeType = 'other';
        for (const [type, typePattern] of Object.entries(chargePatterns)) {
          if (description.match(typePattern)) {
            chargeType = type;
            break;
          }
        }

        // Look for line numbers
        const lineMatch = description.match(/(?:Line|Phone|Device)\s*(?:#|Number)?\s*(\d+)/i);
        const lineNumber = lineMatch ? lineMatch[1] : null;

        charges.push({
          description,
          amount,
          type: chargeType,
          lineNumber,
          category: currentSection || 'other'
        });

        console.log('Added charge:', {
          description,
          amount,
          type: chargeType,
          lineNumber
        });
        break;
      }
    }
  }

  console.log(`Found ${charges.length} charges in text`);
  return charges;
}

async function testDirectParser() {
  console.log(`Testing direct parser with file: ${sampleBillPath}`);
  
  try {
    // Check if file exists
    if (!fs.existsSync(sampleBillPath)) {
      console.error(`Error: File not found at ${sampleBillPath}`);
      console.log('Usage: node direct-test.js [path-to-bill.txt]');
      process.exit(1);
    }
    
    // Read the text file
    const textContent = fs.readFileSync(sampleBillPath, 'utf8');
    console.log(`Read ${textContent.length} characters from file`);
    
    // Extract key information
    const accountMatch = textContent.match(/Account\s*(?:number|#)?[:.]?\s*(\d{3}[-.]?\d{3}[-.]?\d{4})/i);
    const accountNumber = accountMatch ? accountMatch[1] : 'Unknown';
    console.log('Account Number:', accountNumber);
    
    const periodMatch = textContent.match(/(?:Billing period|Bill cycle)[:.]?\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}\s*-\s*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},\s*\d{4})/i);
    const billingPeriod = periodMatch ? periodMatch[1] : 'Unknown';
    console.log('Billing Period:', billingPeriod);
    
    const amountMatch = textContent.match(/Total\s+amount\s+due[:.]?\s*\$?\s*(\d+\.\d{2})/i);
    const totalAmount = amountMatch ? parseFloat(amountMatch[1]) : 0;
    console.log('Total Amount:', totalAmount);
    
    // Find charges
    const allCharges = findChargesInText(textContent);
    
    // Filter and clean up charges
    const cleanedCharges = allCharges.filter(charge => {
      // Skip summary totals and duplicates
      if (charge.description.toLowerCase().includes('total') || 
          charge.description.toLowerCase().includes('account-wide') ||
          charge.description.toLowerCase().includes('one-time charges') ||
          charge.description.toLowerCase().includes('this month') ||
          charge.description.toLowerCase().includes('remaining') ||
          charge.description.toLowerCase().includes('total due') ||
          charge.description.toLowerCase().includes('unpaid balance') ||
          charge.description.toLowerCase().includes('the total amount due')) {
        console.log('Skipping summary charge:', charge.description, charge.amount);
        return false;
      }
      
      // Fix incorrect device payment amounts
      if (charge.description.includes('Payment') && 
          charge.description.includes('remaining') && 
          charge.amount > 100) {
        console.log('Fixing device payment amount:', charge.description, charge.amount);
        // Extract the correct amount from the description if possible
        const paymentMatch = charge.description.match(/Payment\s+\d+\s+of\s+\d+\s+\(\$[\d\.]+\s+remaining\)\s*-\s*Agreement\s+\d+:\s+\$(\d+\.\d{2})/);
        if (paymentMatch) {
          charge.amount = parseFloat(paymentMatch[1]);
          console.log('Corrected amount:', charge.amount);
        }
        return true;
      }
      
      return true;
    });
    
    // Remove duplicates
    const uniqueCharges = new Map();
    cleanedCharges.forEach(charge => {
      // Use description as a unique key (ignore amount for deduplication)
      const key = charge.description;
      if (!uniqueCharges.has(key)) {
        uniqueCharges.set(key, charge);
      }
    });
    
    const charges = Array.from(uniqueCharges.values());
    console.log(`After cleaning and removing duplicates, found ${charges.length} unique charges`);
    
    // Categorize charges
    const lineItems = [];
    const otherCharges = [];
    
    charges.forEach(charge => {
      
      if (charge.lineNumber || 
          charge.type === 'lineAccess' || 
          charge.type === 'devicePayment' ||
          charge.description.toLowerCase().includes('line') ||
          charge.description.toLowerCase().includes('phone') ||
          charge.description.toLowerCase().includes('iphone') ||
          charge.description.toLowerCase().includes('ipad') ||
          charge.description.toLowerCase().includes('watch')) {
        lineItems.push(charge);
      } else {
        otherCharges.push(charge);
      }
    });
    
    console.log(`\nFound ${lineItems.length} line items and ${otherCharges.length} other charges`);
    
    // Print sample line items
    if (lineItems.length > 0) {
      console.log('\n--- SAMPLE LINE ITEMS ---');
      lineItems.slice(0, 5).forEach((item, i) => {
        console.log(`${i+1}. ${item.description}: $${item.amount} (${item.type})`);
      });
    }
    
    // Print sample other charges
    if (otherCharges.length > 0) {
      console.log('\n--- SAMPLE OTHER CHARGES ---');
      otherCharges.slice(0, 5).forEach((charge, i) => {
        console.log(`${i+1}. ${charge.description}: $${charge.amount} (${charge.type})`);
      });
    }
    
    // Calculate subtotals
    const lineItemsTotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
    const otherChargesTotal = otherCharges.reduce((sum, charge) => sum + charge.amount, 0);
    
    console.log('\n--- SUBTOTALS ---');
    console.log(`Line Items: $${lineItemsTotal.toFixed(2)}`);
    console.log(`Other Charges: $${otherChargesTotal.toFixed(2)}`);
    console.log(`Total: $${(lineItemsTotal + otherChargesTotal).toFixed(2)}`);
    
    // Write results to file
    const result = {
      accountNumber,
      billingPeriod,
      totalAmount,
      lineItems,
      otherCharges,
      subtotals: {
        lineItems: lineItemsTotal,
        otherCharges: otherChargesTotal,
        total: lineItemsTotal + otherChargesTotal
      }
    };
    
    fs.writeFileSync('direct-test-result.json', JSON.stringify(result, null, 2));
    console.log('\nFull result written to direct-test-result.json');
    
  } catch (error) {
    console.error('Error testing parser:', error);
  }
}

testDirectParser();
