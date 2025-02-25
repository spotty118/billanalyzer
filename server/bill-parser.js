import { extractPdfText } from './pdf-parser.js';

const extractVerizonBillData = async (buffer) => {
  try {
    const { text } = await extractPdfText(buffer);

    // Initialize bill data structure
    const billData = {
      totalAmount: null,
      accountNumber: null,
      billingPeriod: null,
      charges: [],
      lineItems: []
    };

    // Extract account number (format: XXX-XXX-XXXX)
    const accountMatch = text.match(/Account\s*(?:number|#)?[:.]?\s*(\d{3}[-.]?\d{3}[-.]?\d{4})/i);
    if (accountMatch) {
      billData.accountNumber = accountMatch[1];
    }

    // Extract billing period (format: MMM DD - MMM DD, YYYY)
    const periodMatch = text.match(/(?:Billing period|Bill cycle)[:.]?\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}\s*-\s*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},\s*\d{4})/i);
    if (periodMatch) {
      billData.billingPeriod = periodMatch[1];
    }

    // Extract total amount
    const amountMatch = text.match(/Total\s+amount\s+due[:.]?\s*\$?\s*(\d+\.\d{2})/i);
    if (amountMatch) {
      billData.totalAmount = parseFloat(amountMatch[1]);
    }

    // Extract line items and charges
    const lines = text.split('\n');
    let currentSection = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip empty lines
      if (!line) continue;

      // Look for section headers
      if (line.match(/Monthly\s+charges/i)) {
        currentSection = 'monthly';
        continue;
      } else if (line.match(/One[-\s]time\s+charges/i)) {
        currentSection = 'onetime';
        continue;
      }

      // Extract charge items
      const chargeMatch = line.match(/([^$]+)\$\s*(\d+\.\d{2})/);
      if (chargeMatch) {
        const [_, description, amount] = chargeMatch;
        const charge = {
          description: description.trim(),
          amount: parseFloat(amount),
          type: currentSection || 'other'
        };

        // Identify line-specific charges
        if (description.match(/line\s+\d+/i) || description.match(/phone\s+number/i)) {
          billData.lineItems.push(charge);
        } else {
          billData.charges.push(charge);
        }
      }
    }

    // Calculate subtotals
    const calculateSubtotal = (items) => {
      return items.reduce((sum, item) => sum + item.amount, 0);
    };

    const analysis = {
      ...billData,
      subtotals: {
        lineItems: calculateSubtotal(billData.lineItems),
        otherCharges: calculateSubtotal(billData.charges)
      },
      summary: `Bill analysis for account ${billData.accountNumber || 'Unknown'}\n` +
               `Billing Period: ${billData.billingPeriod || 'Unknown'}\n` +
               `Total Amount Due: $${billData.totalAmount || '0.00'}\n` +
               `Number of Line Items: ${billData.lineItems.length}\n` +
               `Number of Other Charges: ${billData.charges.length}`
    };

    return analysis;

  } catch (error) {
    throw new Error(`Failed to parse PDF: ${error.message}`);
  }
};

export { extractVerizonBillData };
