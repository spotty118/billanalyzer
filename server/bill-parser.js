import { extractPdfText } from './pdf-parser.js';
import { parseMarkdownTable, findTablesWithPrices, extractChargesFromTable } from './table-parser.js';


// Price detection patterns
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

const sectionKeywords = [
  'monthly', 'charges', 'service', 'equipment', 'devices', 'one-time', 'taxes',
  'fees', 'surcharges', 'credits', 'adjustments', 'discounts', 'plan', 'lines',
  'account', 'summary', 'total', 'payment', 'balance', 'due'
].join('|');

async function use_mcp_tool({ serverName, toolName, arguments: args }) {
  try {
    const result = await fetch(`http://localhost:1337/tool/${toolName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        serverName: serverName,
        toolName: toolName,
        arguments: args,
      }),
    });

    const data = await result.json();
    if (data.error) {
      return { error: data.error };
    }
    return data;
  } catch (error) {
    console.error(`Error calling ${toolName} tool on ${serverName}:`, error);
    return { error: error.message };
  }
}

function findChargesInText(text) {
  const charges = [];
  console.log('Processing text for charges:', text.slice(0, 200) + '...');
  
  const lines = text.split('\n');
  let currentSection = null;
  let isInChargesSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Check for section headers using broader pattern
    if (new RegExp(`(${sectionKeywords})`, 'i').test(line)) {
      currentSection = line.toLowerCase();
      isInChargesSection = /(?:charge|fee|payment|credit|adjustment)/i.test(line);
      console.log('Found section:', currentSection);
      continue;
    }

    // Try each price pattern
    for (const { pattern, descGroup, amountGroup } of pricePatterns) {
      const match = line.match(pattern);
      if (match) {
        console.log('Found price match:', line);
        const description = match[descGroup].trim();
        const amount = parseFloat(match[amountGroup]);

        // Skip summary totals and duplicates
        if (description.toLowerCase().includes('total') || 
            description.toLowerCase().includes('account-wide') ||
            description.toLowerCase().includes('one-time charges') ||
            description.toLowerCase().includes('this month') ||
            description.toLowerCase().includes('remaining') ||
            description.toLowerCase().includes('total due') ||
            description.toLowerCase().includes('unpaid balance') ||
            description.toLowerCase().includes('the total amount due')) {
          console.log('Skipping summary charge:', description, amount);
          continue;
        }

        // Fix incorrect device payment amounts
        let correctedAmount = amount;
        if (description.includes('Payment') && 
            description.includes('remaining') && 
            amount > 100) {
          console.log('Fixing device payment amount:', description, amount);
          // Extract the correct amount from the description if possible
          const paymentMatch = line.match(/Payment\s+\d+\s+of\s+\d+\s+\(\$[\d\.]+\s+remaining\)\s*-\s*Agreement\s+\d+:\s+\$(\d+\.\d{2})/);
          if (paymentMatch) {
            correctedAmount = parseFloat(paymentMatch[1]);
            console.log('Corrected amount:', correctedAmount);
          }
        }

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

        // Look for percentages
        const percentageMatch = description.match(/(\d+(?:\.\d+)?)\s*%/);
        const percentage = percentageMatch ? parseFloat(percentageMatch[1]) : null;

        // Determine if this is a device-related charge
        const isDeviceCharge = 
          description.toLowerCase().includes('iphone') ||
          description.toLowerCase().includes('ipad') ||
          description.toLowerCase().includes('watch') ||
          description.toLowerCase().includes('device') ||
          description.toLowerCase().includes('phone');

        charges.push({
          description,
          amount: correctedAmount,
          type: chargeType,
          lineNumber,
          category: currentSection || 'other',
          percentage,
          isDeviceCharge,
          raw: line // Store original line for debugging
        });

        console.log('Added charge:', {
          description,
          amount: correctedAmount,
          type: chargeType,
          lineNumber,
          category: currentSection
        });
        break;
      }
    }
  }

  console.log(`Found ${charges.length} charges in text`);
  return charges;
}

function processTableRow(cells, currentSection, tableHeaders) {
  console.log('Processing table row:', cells);
  let description = '';
  let amount = null;
  let lineNumber = null;
  
  for (let cell of cells) {
    // Try all price patterns
    for (const { pattern, descGroup, amountGroup } of pricePatterns) {
      const match = cell.match(pattern);
      if (match) {
        if (!amount) { // Only take first amount found
          amount = parseFloat(match[amountGroup]);
          if (!description) {
            description = match[descGroup].trim();
          }
        }
        break;
      }
    }

    // Look for line numbers
    const lineMatch = cell.match(/(?:Line|Phone|Device)\s*(?:#|Number)?\s*(\d+)/i);
    if (lineMatch) {
      lineNumber = lineMatch[1];
      if (!description) {
        description = cell;
      }
    }

    // Use cell as description if we don't have one yet
    if (!description && cell.length > 0 && !cell.match(/^\s*\$?-?\d+\.\d{2}\s*$/)) {
      description = cell;
    }
  }

  if (amount !== null) {
    let chargeType = currentSection || 'other';
    for (const [type, pattern] of Object.entries(chargePatterns)) {
      if (description.match(pattern)) {
        chargeType = type;
        break;
      }
    }

    const result = {
      description: description.trim(),
      amount,
      type: chargeType,
      lineNumber,
      category: currentSection || 'other'
    };
    console.log('Processed table charge:', result);
    return result;
  }

  return null;
}

const extractVerizonBillData = async (buffer) => {
  try {
    console.log('Starting bill analysis...');
    let text, markdown;
    // Check if it's a text file by trying to convert to utf8
    try {
      text = buffer.toString('utf8');
      markdown = text; // For text files, use the content directly
      console.log('Detected text file, using content directly');
    } catch (e) {
      // If not a valid text file, try PDF extraction
      const result = await extractPdfText(buffer);
      text = result.text;
      markdown = result.markdown;
    }

    // Use sequential thinking to analyze the bill over multiple steps
    let sequentialAnalysis = [];
    
    // Try to use MCP tool, but continue if it fails
    try {
      // Step 1: Initial markdown analysis
      let analysisStep = await use_mcp_tool({
        serverName: "github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking",
        toolName: "sequentialthinking",
        arguments: {
          thought: "Analyzing structure and format of the Verizon bill markdown",
          thoughtNumber: 1,
          totalThoughts: 4,
          nextThoughtNeeded: true
        }
      });
      sequentialAnalysis.push(analysisStep.result);
    } catch (error) {
      console.log("MCP tool call failed, continuing without sequential analysis:", error.message);
      // Add placeholder analysis
      sequentialAnalysis.push({
        result: { analysis: "Sequential analysis not available" }
      });
    }

    // Initialize bill data structure
    const billData = {
      totalAmount: null,
      accountNumber: null,
      billingPeriod: null,
      charges: [],
      lineItems: [],
      markdown: markdown,
      analysis: sequentialAnalysis
    };

    // Extract account number (format: XXX-XXX-XXXX)
    const accountMatch = text.match(/Account\s*(?:number|#)?[:.]?\s*(\d{3}[-.]?\d{3}[-.]?\d{4})/i);
    if (accountMatch) {
      billData.accountNumber = accountMatch[1];
      console.log('Found account number:', billData.accountNumber);
    }

    // Extract billing period (format: MMM DD - MMM DD, YYYY)
    const periodMatch = text.match(/(?:Billing period|Bill cycle)[:.]?\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}\s*-\s*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},\s*\d{4})/i);
    if (periodMatch) {
      billData.billingPeriod = periodMatch[1];
      console.log('Found billing period:', billData.billingPeriod);
    }

    // Extract total amount
    const amountMatch = text.match(/Total\s+amount\s+due[:.]?\s*\$?\s*(\d+\.\d{2})/i);
    if (amountMatch) {
      billData.totalAmount = parseFloat(amountMatch[1]);
      console.log('Found total amount:', billData.totalAmount);
    }

    // First try to find charges in the raw text
    console.log('Analyzing raw text for charges...');
    const rawCharges = findChargesInText(text);
    console.log(`Found ${rawCharges.length} charges in raw text`);

    // Find and parse tables in the markdown
    console.log('Looking for tables in markdown...');
    const tablesWithPrices = findTablesWithPrices(markdown);
    console.log(`Found ${tablesWithPrices.length} tables with prices`);

    const tableCharges = [];
    tablesWithPrices.forEach((table, index) => {
      console.log(`Processing table ${index + 1}:`);
      console.log('Headers:', table.headers);
      console.log('Sample row:', table.rows[0]);
      
      const charges = extractChargesFromTable(table);
      console.log(`Found ${charges.length} charges in table`);
      tableCharges.push(...charges);
    });

    // Then analyze the markdown for additional non-table content
    console.log('Parsing markdown for non-table content...');
    const markdownCharges = findChargesInText(markdown);
    console.log(`Found ${markdownCharges.length} charges in non-table content`);

    // Combine all charges and remove duplicates
    const allCharges = [...rawCharges, ...markdownCharges, ...tableCharges];
    
    // Filter out summary charges and duplicates
    const filteredCharges = allCharges.filter(charge => {
      // Skip summary totals and duplicates
      return !(charge.description.toLowerCase().includes('total') || 
          charge.description.toLowerCase().includes('account-wide') ||
          charge.description.toLowerCase().includes('one-time charges') ||
          charge.description.toLowerCase().includes('this month') ||
          charge.description.toLowerCase().includes('remaining') ||
          charge.description.toLowerCase().includes('total due') ||
          charge.description.toLowerCase().includes('unpaid balance') ||
          charge.description.toLowerCase().includes('the total amount due'));
    });
    
    // Remove duplicates
    const uniqueCharges = new Map();
    filteredCharges.forEach(charge => {
      // Use description as a unique key (ignore amount for deduplication)
      const key = charge.description;
      if (!uniqueCharges.has(key)) {
        uniqueCharges.set(key, charge);
      }
    });

    // Categorize charges
    uniqueCharges.forEach(charge => {
      if (charge.lineNumber || 
          charge.type === 'lineAccess' || 
          charge.type === 'devicePayment' ||
          charge.description.toLowerCase().includes('line') ||
          charge.description.toLowerCase().includes('phone') ||
          charge.isDeviceCharge) {
        billData.lineItems.push(charge);
      } else {
        billData.charges.push(charge);
      }
    });

    console.log('Final charge counts:', {
      lineItems: billData.lineItems.length,
      otherCharges: billData.charges.length
    });

    // Calculate subtotals and validate table totals
    const calculateSubtotal = (items) => {
      return items.reduce((sum, item) => sum + item.amount, 0);
    };

    const validateTableTotals = (charges) => {
      const tableGroups = new Map();
      charges
        .filter(c => c.source === 'table')
        .forEach(charge => {
          if (!tableGroups.has(charge.tableType)) {
            tableGroups.set(charge.tableType, []);
          }
          tableGroups.get(charge.tableType).push(charge);
        });

      const validations = [];
      tableGroups.forEach((charges, tableType) => {
        const items = charges.filter(c => !c.hasTotal);
        const totals = charges.filter(c => c.hasTotal);
        const calculatedTotal = calculateSubtotal(items);

        totals.forEach(total => {
          const difference = Math.abs(calculatedTotal - total.amount);
          if (difference > 0.01) {
            validations.push({
              tableType,
              calculatedTotal,
              declaredTotal: total.amount,
              difference,
              description: total.description,
              status: 'mismatch'
            });
          } else {
            validations.push({
              tableType,
              calculatedTotal,
              declaredTotal: total.amount,
              difference: 0,
              description: total.description,
              status: 'match'
            });
          }
        });
      });

      return validations;
    };

    const result = {
      ...billData,
      subtotals: {
        lineItems: calculateSubtotal(billData.lineItems),
        otherCharges: calculateSubtotal(billData.charges),
        bySource: {
          rawText: calculateSubtotal(rawCharges),
          markdown: calculateSubtotal(markdownCharges),
          tables: calculateSubtotal(tableCharges)
        },
        byTableType: Object.fromEntries(
          [...new Set(tableCharges.map(c => c.tableType))]
            .map(type => [type, calculateSubtotal(tableCharges.filter(c => c.tableType === type))])
        )
      },
      tableValidations: validateTableTotals([...billData.lineItems, ...billData.charges]),
      summary: `Bill analysis for account ${billData.accountNumber || 'Unknown'}\n` +
               `Billing Period: ${billData.billingPeriod || 'Unknown'}\n` +
               `Total Amount Due: $${billData.totalAmount || '0.00'}\n` +
               `Number of Line Items: ${billData.lineItems.length}\n` +
               `Number of Other Charges: ${billData.charges.length}`,
      insights: {
        tables: sequentialAnalysis[1]?.result || {},
        charges: sequentialAnalysis[2]?.result || {},
        summary: sequentialAnalysis[3]?.result || {}
      }
    };

    return result;
  } catch (error) {
    console.error('Error in bill analysis:', error);
    throw new Error(`Failed to parse PDF: ${error.message}`);
  }
};

export { extractVerizonBillData, findChargesInText };
