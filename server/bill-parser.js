import { extractPdfText } from './pdf-parser.js';

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

// Common Verizon charge patterns with more variations
const chargePatterns = {
  lineAccess: /(Line Access( Charge)?|Access Fee|Monthly Line|Line Monthly|Line Charge)/i,
  devicePayment: /(Device Payment|Equipment Charge|Phone Payment|Device Installment|Equipment Installment|Phone Installment)/i,
  surcharge: /(Federal|State|County|City|Municipal|Regulatory|Universal Service|E911|Emergency|Admin|Recovery|Fee)/i,
  promotion: /(Promotion|Discount|Credit|Adjustment|Loyalty|Bundle|Auto Pay|Paperless|Promo)/i,
  plan: /(Plan( Charge)?|Data( Plan)?|Unlimited( Plan)?|5G|LTE|Premium|Play More|Do More|Get More)/i,
  usage: /(Overage|Extra Data|Pay Per Use|International|Roaming|Additional Data|Usage)/i
};

// Function to find charges in raw text
function findChargesInText(text) {
  const charges = [];
  const lines = text.split('\n');
  
  // Various price patterns
  const pricePatterns = [
    /(.+?)\$\s*(-?\d+\.\d{2})/,                    // Standard price format
    /(.+?)(\d+\.\d{2})\s*dollars/i,                // "dollars" format
    /(.+?)[^\d](\d+\.\d{2})\s*(?:per|each|\/)/i   // per/each format
  ];

  let currentSection = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Check for section headers
    const sectionMatch = line.match(/^(?:Monthly|Equipment|One[-\s]time|Taxes?|Fees|Surcharges|Credits?|Usage)/i);
    if (sectionMatch) {
      currentSection = sectionMatch[0].toLowerCase();
      continue;
    }

    // Try each price pattern
    for (const pattern of pricePatterns) {
      const match = line.match(pattern);
      if (match) {
        const [_, desc, amt] = match;
        const description = desc.trim();
        const amount = parseFloat(amt);

        // Determine charge type
        let chargeType = 'other';
        for (const [type, pattern] of Object.entries(chargePatterns)) {
          if (description.match(pattern)) {
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

        charges.push({
          description,
          amount,
          type: chargeType,
          lineNumber,
          category: currentSection || 'other',
          percentage
        });
        break;
      }
    }
  }

  return charges;
}

const extractVerizonBillData = async (buffer) => {
  try {
    console.log('Starting bill analysis...');
    const { text, markdown } = await extractPdfText(buffer);

    // Use sequential thinking to analyze the bill over multiple steps
    let sequentialAnalysis = [];
    
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

    // Step 2: Extract tables from markdown
    analysisStep = await use_mcp_tool({
      serverName: "github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking",
      toolName: "sequentialthinking",
      arguments: {
        thought: "Identifying and parsing tables in the bill for charges and line items",
        thoughtNumber: 2,
        totalThoughts: 4,
        nextThoughtNeeded: true,
        branchFromThought: 1
      }
    });
    sequentialAnalysis.push(analysisStep.result);

    // Step 3: Analyze charges and calculate totals
    analysisStep = await use_mcp_tool({
      serverName: "github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking",
      toolName: "sequentialthinking",
      arguments: {
        thought: "Analyzing charges, categorizing them, and validating totals",
        thoughtNumber: 3,
        totalThoughts: 4,
        nextThoughtNeeded: true,
        branchFromThought: 2
      }
    });
    sequentialAnalysis.push(analysisStep.result);

    // Step 4: Generate insights and summary
    analysisStep = await use_mcp_tool({
      serverName: "github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking",
      toolName: "sequentialthinking",
      arguments: {
        thought: "Generating insights and summary from the analyzed bill data",
        thoughtNumber: 4,
        totalThoughts: 4,
        nextThoughtNeeded: false,
        branchFromThought: 3
      }
    });
    sequentialAnalysis.push(analysisStep.result);

    // Initialize bill data structure with enhanced fields
    const billData = {
      totalAmount: null,
      accountNumber: null,
      billingPeriod: null,
      charges: [],
      lineItems: [],
      markdown: markdown, // Store the original markdown for reference
      analysis: sequentialAnalysis // Store all steps of sequential thinking analysis
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

    // Helper function for calculating subtotals
    const calculateSubtotal = (items) => {
      return items.reduce((sum, item) => sum + item.amount, 0);
    };

    // First try to find charges in the raw text
    console.log('Analyzing raw text for charges...');
    const rawCharges = findChargesInText(text);
    console.log(`Found ${rawCharges.length} charges in raw text`);

    // Categorize raw charges
    for (const charge of rawCharges) {
      if (charge.lineNumber || 
          charge.type === 'lineAccess' || 
          charge.type === 'devicePayment' ||
          charge.description.toLowerCase().includes('line') ||
          charge.description.toLowerCase().includes('phone')) {
        billData.lineItems.push(charge);
      } else {
        billData.charges.push(charge);
      }
    }

    // Then parse the markdown for additional structured content
    console.log('Parsing markdown for structured content...');
    const lines = markdown.split('\n');
    let currentSection = null;
    let inChargesTable = false;
    let tableHeaders = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Process tables and structured content
      if (line.includes('|')) {
        if (!inChargesTable) {
          tableHeaders = line.split('|')
            .map(header => header.trim().toLowerCase())
            .filter(Boolean);
          inChargesTable = true;
          continue;
        }

        if (line.includes('---')) continue;

        const cells = line.split('|')
          .map(cell => cell.trim())
          .filter(Boolean);

        if (cells.length > 1) {
          const charge = processTableRow(cells, currentSection, tableHeaders);
          if (charge) {
            if (charge.lineNumber || 
                charge.type === 'lineAccess' || 
                charge.type === 'devicePayment') {
              billData.lineItems.push(charge);
            } else {
              billData.charges.push(charge);
            }
          }
        }
      } else {
        // Check for section headers
        for (const [type, pattern] of Object.entries(chargePatterns)) {
          if (line.match(pattern)) {
            currentSection = type;
            break;
          }
        }

        // Process non-table lines for charges
        const priceMatch = line.match(/(.+?)\$\s*(-?\d+\.\d{2})/);
        if (priceMatch) {
          const charge = processChargeLine(priceMatch, line, currentSection);
          if (charge) {
            if (charge.lineNumber || 
                charge.type === 'lineAccess' || 
                charge.type === 'devicePayment') {
              billData.lineItems.push(charge);
            } else {
              billData.charges.push(charge);
            }
          }
        }
        inChargesTable = false;
      }
    }

    // Remove duplicates based on description and amount
    const uniqueCharges = new Map();
    [...billData.lineItems, ...billData.charges].forEach(charge => {
      const key = `${charge.description}-${charge.amount}`;
      if (!uniqueCharges.has(key)) {
        uniqueCharges.set(key, charge);
      }
    });

    billData.lineItems = Array.from(uniqueCharges.values())
      .filter(charge => charge.lineNumber || 
                       charge.type === 'lineAccess' || 
                       charge.type === 'devicePayment');
    
    billData.charges = Array.from(uniqueCharges.values())
      .filter(charge => !(charge.lineNumber || 
                         charge.type === 'lineAccess' || 
                         charge.type === 'devicePayment'));

    // Validate total amount
    const calculatedTotal = calculateSubtotal(billData.lineItems) + calculateSubtotal(billData.charges);
    console.log(`Calculated total: ${calculatedTotal}, Bill total: ${billData.totalAmount}`);
    
    if (billData.totalAmount && Math.abs(calculatedTotal - billData.totalAmount) > 0.01) {
      console.warn(`Warning: Calculated total (${calculatedTotal}) doesn't match bill total (${billData.totalAmount})`);
      const validationAnalysis = await use_mcp_tool({
        serverName: "github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking",
        toolName: "sequentialthinking",
        arguments: {
          thought: "Analyzing discrepancy between calculated and actual bill total",
          thoughtNumber: 1,
          totalThoughts: 1,
          nextThoughtNeeded: false
        }
      });
      if (!validationAnalysis.error) {
        billData.validation = validationAnalysis.result;
      }
    }

    // Get insights from sequential analysis
    const insights = sequentialAnalysis[3]?.result || {};

    const result = {
      ...billData,
      subtotals: {
        lineItems: calculateSubtotal(billData.lineItems),
        otherCharges: calculateSubtotal(billData.charges)
      },
      summary: `Bill analysis for account ${billData.accountNumber || 'Unknown'}\n` +
               `Billing Period: ${billData.billingPeriod || 'Unknown'}\n` +
               `Total Amount Due: $${billData.totalAmount || '0.00'}\n` +
               `Number of Line Items: ${billData.lineItems.length}\n` +
               `Number of Other Charges: ${billData.charges.length}`,
      insights: {
        tables: sequentialAnalysis[1]?.result || {},
        charges: sequentialAnalysis[2]?.result || {},
        summary: insights
      }
    };

    return result;

  } catch (error) {
    console.error('Error in bill analysis:', error);
    throw new Error(`Failed to parse PDF: ${error.message}`);
  }
};

function processTableRow(cells, currentSection, tableHeaders) {
  let description = '';
  let amount = null;
  let lineNumber = null;
  
  for (let cell of cells) {
    const priceMatch = cell.match(/\$\s*(-?\d+\.\d{2})/);
    const lineMatch = cell.match(/(?:Line|Phone|Device)\s*(?:#|Number)?\s*(\d+)/i);
    
    if (priceMatch) {
      amount = parseFloat(priceMatch[1]);
    } else if (lineMatch) {
      lineNumber = lineMatch[1];
      description = cell;
    } else if (!description && cell.length > 0) {
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

    return {
      description: description.trim(),
      amount,
      type: chargeType,
      lineNumber,
      category: currentSection || 'other'
    };
  }

  return null;
}

function processChargeLine(priceMatch, line, currentSection) {
  const [_, desc, amt] = priceMatch;
  let description = desc.trim();
  
  const lineMatch = description.match(/(?:Line|Phone|Device)\s*(?:#|Number)?\s*(\d+)/i);
  const lineNumber = lineMatch ? lineMatch[1] : null;
  
  const percentageMatch = description.match(/(\d+(?:\.\d+)?)\s*%/);
  const percentage = percentageMatch ? parseFloat(percentageMatch[1]) : null;

  let chargeType = currentSection || 'other';
  for (const [type, pattern] of Object.entries(chargePatterns)) {
    if (description.match(pattern)) {
      chargeType = type;
      break;
    }
  }

  return {
    description,
    amount: parseFloat(amt),
    type: chargeType,
    lineNumber,
    category: currentSection,
    percentage
  };
}

export { extractVerizonBillData };
