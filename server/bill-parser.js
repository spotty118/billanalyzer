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
