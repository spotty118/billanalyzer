
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

// Sample bill data structure for reference
interface BillAnalysis {
  totalAmount: number;
  accountNumber: string;
  billingPeriod: string;
  charges: Array<{
    description: string;
    amount: number;
    type: string;
  }>;
  lineItems: Array<{
    description: string;
    amount: number;
    type: string;
  }>;
  subtotals: {
    lineItems: number;
    otherCharges: number;
  };
  summary: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Analyze bill function called");
    
    // Only accept POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get the form data from the request
    const formData = await req.formData();
    const billFile = formData.get('bill');

    if (!billFile || !(billFile instanceof File)) {
      return new Response(
        JSON.stringify({ error: 'No file provided or invalid file' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Received bill file: ${billFile.name}, size: ${billFile.size} bytes`);

    // Read the file content
    const fileContent = await billFile.text();
    
    // Very basic text parsing to extract key information
    // This is a minimal implementation - in a real scenario, you'd use a more sophisticated parser
    const accountNumberMatch = fileContent.match(/Account.*?[:#]\s*([A-Z0-9-]+)/i);
    const accountNumber = accountNumberMatch ? accountNumberMatch[1].trim() : 'Unknown';
    
    const billingPeriodMatch = fileContent.match(/Billing\s+period.*?:\s*([A-Za-z0-9\s-]+)/i);
    const billingPeriod = billingPeriodMatch ? billingPeriodMatch[1].trim() : 'Unknown';
    
    const totalAmountMatch = fileContent.match(/Total.*?due.*?[\$]?([0-9,.]+)/i);
    const totalAmount = totalAmountMatch ? parseFloat(totalAmountMatch[1].replace(/,/g, '')) : 0;

    // Extract line items (simplified)
    const lineItems = [];
    // Match patterns like "Service: $50.00" or "Device payment: $25.99"
    const lineItemMatches = fileContent.matchAll(/([A-Za-z\s-]+):\s*\$?([0-9,.]+)/g);
    for (const match of lineItemMatches) {
      if (match[1] && match[2]) {
        lineItems.push({
          description: match[1].trim(),
          amount: parseFloat(match[2].replace(/,/g, '')),
          type: 'service' // Default type
        });
      }
    }

    // Calculate subtotals
    let lineItemsTotal = 0;
    let otherChargesTotal = 0;
    
    // Simple classification of line items into regular charges vs other charges
    const charges = [];
    const regularLineItems = [];
    
    for (const item of lineItems) {
      if (item.description.toLowerCase().includes('fee') || 
          item.description.toLowerCase().includes('tax') || 
          item.description.toLowerCase().includes('surcharge')) {
        charges.push(item);
        otherChargesTotal += item.amount;
      } else {
        regularLineItems.push(item);
        lineItemsTotal += item.amount;
      }
    }
    
    // Create the analysis result
    const analysisResult: BillAnalysis = {
      accountNumber,
      billingPeriod,
      totalAmount,
      lineItems: regularLineItems,
      charges: charges,
      subtotals: {
        lineItems: lineItemsTotal,
        otherCharges: otherChargesTotal
      },
      summary: `Bill analysis for account ${accountNumber} with billing period ${billingPeriod}. Total amount: $${totalAmount.toFixed(2)}.`
    };

    console.log("Bill analysis completed successfully");
    
    return new Response(
      JSON.stringify(analysisResult),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error("Error in analyze-bill function:", error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to analyze bill',
        message: error.message || 'Unknown error',
        totalAmount: 0, // Include a default totalAmount to prevent the client-side validation error
        accountNumber: 'Error',
        billingPeriod: 'Error',
        charges: [],
        lineItems: [],
        subtotals: { lineItems: 0, otherCharges: 0 },
        summary: 'Error analyzing bill'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
