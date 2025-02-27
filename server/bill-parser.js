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

const extractVerizonBillData = async (buffer) => {
  try {
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

    // Common Verizon bill sections
    const sectionPatterns = {
      monthly: /^#+\s*(Monthly\s+(Charges|Service)|Account\s+Charges)/i,
      equipment: /^#+\s*(Equipment\s+Charges|Devices\s*&\s*Equipment)/i,
      lines: /^#+\s*(Breakdown\s+by\s+Line|Line\s+Details|Phone\s+Lines)/i,
      onetime: /^#+\s*One[-\s]time\s+Charges/i,
      taxes: /^#+\s*(Taxes|Fees|Surcharges)/i,
      credits: /^#+\s*(Credits|Adjustments|Discounts)/i
    };

    // Extract line items and charges from markdown structure
    const lines = markdown.split('\n');
    let currentSection = null;
    let inChargesTable = false;
    let tableHeaders = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip empty lines
      if (!line) continue;

      // Detect section headers
      for (const [section, pattern] of Object.entries(sectionPatterns)) {
        if (line.match(pattern)) {
          currentSection = section;
          continue;
        }
      }

      // Detect table start
      if (line.includes('|')) {
        if (!inChargesTable) {
          // This might be a header row
          tableHeaders = line.split('|')
            .map(header => header.trim().toLowerCase())
            .filter(Boolean);
          inChargesTable = true;
          continue;
        }

        // Skip separator row
        if (line.includes('---')) continue;

        // Process table row
        const cells = line.split('|')
          .map(cell => cell.trim())
          .filter(Boolean);

        if (cells.length > 1) {
          // Try to find price and details in any cell
          let description = '';
          let amount = null;
          let lineNumber = null;
          let chargeType = currentSection || 'other';

          // Common Verizon charge patterns
          const chargePatterns = {
            lineAccess: /(Line Access( Charge)?|Access Fee)/i,
            devicePayment: /(Device Payment|Equipment Charge|Phone Payment)/i,
            surcharge: /(Federal|State|County|City|Municipal|Regulatory|Universal Service|E911|Emergency)/i,
            promotion: /(Promotion|Discount|Credit|Adjustment)/i,
            plan: /(Plan( Charge)?|Data( Plan)?|Unlimited( Plan)?)/i
          };

          for (let cell of cells) {
            const priceMatch = cell.match(/\$\s*(\d+\.\d{2})/);
            const lineMatch = cell.match(/(?:Line|Phone|Device)\s*(?:#|Number)?\s*(\d+)/i);

            if (priceMatch) {
              amount = parseFloat(priceMatch[1]);
            } else if (lineMatch) {
              lineNumber = lineMatch[1];
              description = cell;
            } else if (!description && cell.length > 0) {
              description = cell;
              
              // Determine charge type from description
              for (const [type, pattern] of Object.entries(chargePatterns)) {
                if (cell.match(pattern)) {
                  chargeType = type;
                  break;
                }
              }
            }
          }

          // Handle multi-line descriptions (look ahead for continuation)
          let nextIndex = i + 1;
          while (nextIndex < lines.length) {
            const nextLine = lines[nextIndex].trim();
            if (nextLine && !nextLine.includes('|') && !nextLine.match(/^#+/) && !nextLine.includes('$')) {
              description += ' ' + nextLine;
              i = nextIndex;
            } else {
              break;
            }
            nextIndex++;
          }

          if (amount !== null) {
            const charge = {
              description: description,
              amount: amount,
              type: chargeType,
              lineNumber: lineNumber,
              category: currentSection
            };

            const isLineItem = lineNumber || 
                             description.toLowerCase().includes('line') || 
                             description.toLowerCase().includes('phone') ||
                             chargeType === 'lineAccess' ||
                             chargeType === 'devicePayment';

            if (isLineItem) {
              billData.lineItems.push(charge);
            } else {
              billData.charges.push(charge);
            }
          }
        }
      } else {
        // Check for non-table price listings
        const priceMatch = line.match(/(.+?)\$\s*(-?\d+\.\d{2})/);
        if (priceMatch) {
          const [_, desc, amt] = priceMatch;
          let chargeType = currentSection || 'other';
          let description = desc.trim();

          // Look for percentage calculations in description
          const percentageMatch = description.match(/(\d+(?:\.\d+)?)\s*%/);
          let percentage = percentageMatch ? parseFloat(percentageMatch[1]) : null;

          // Determine charge type using same patterns as table processing
          for (const [type, pattern] of Object.entries(chargePatterns)) {
            if (description.match(pattern)) {
              chargeType = type;
              break;
            }
          }

          // Handle multi-line descriptions
          let nextIndex = i + 1;
          while (nextIndex < lines.length) {
            const nextLine = lines[nextIndex].trim();
            if (nextLine && !nextLine.includes('|') && !nextLine.match(/^#+/) && !nextLine.includes('$')) {
              description += ' ' + nextLine;
              i = nextIndex;
            } else {
              break;
            }
            nextIndex++;
          }

          // Extract line number if present
          const lineMatch = description.match(/(?:Line|Phone|Device)\s*(?:#|Number)?\s*(\d+)/i);
          const lineNumber = lineMatch ? lineMatch[1] : null;

          const charge = {
            description: description,
            amount: parseFloat(amt),
            type: chargeType,
            lineNumber: lineNumber,
            category: currentSection,
            percentage: percentage
          };

          const isLineItem = lineNumber || 
                           description.toLowerCase().includes('line') || 
                           description.toLowerCase().includes('phone') ||
                           chargeType === 'lineAccess' ||
                           chargeType === 'devicePayment';

          if (isLineItem) {
            billData.lineItems.push(charge);
          } else {
            billData.charges.push(charge);
          }
        }
        inChargesTable = false;
      }
    }

    // Validate total amount
    const calculatedTotal = calculateSubtotal(billData.lineItems) + calculateSubtotal(billData.charges);
    if (billData.totalAmount && Math.abs(calculatedTotal - billData.totalAmount) > 0.01) {
      console.warn(`Warning: Calculated total (${calculatedTotal}) doesn't match bill total (${billData.totalAmount})`);
      // Use sequential thinking to analyze discrepancy
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
    const insights = sequentialAnalysis[3]?.result || {}; // Last step contains insights

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
        tables: sequentialAnalysis[1]?.result || {}, // Table parsing results
        charges: sequentialAnalysis[2]?.result || {}, // Charge analysis results
        summary: insights // Final insights and recommendations
      }
    };

    return result;

  } catch (error) {
    throw new Error(`Failed to parse PDF: ${error.message}`);
  }
};

export { extractVerizonBillData };
