
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

// PDF extraction imports
import { PDFExtract } from "https://esm.sh/pdf.js-extract@0.2.1";

// Create a Supabase client with the service role key (for admin operations)
const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
const supabase = createClient(supabaseUrl, supabaseKey);

interface BillData {
  accountNumber: string;
  billingPeriod: string;
  totalAmount: number;
  lineItems: Array<{
    lineNumber: string;
    phoneNumber?: string;
    charges: number;
    planName?: string;
    devicePayment?: number;
    dataUsage?: number;
  }>;
  fees: Array<{
    name: string;
    amount: number;
  }>;
  totalDevicePayments: number;
  totalPlanCharges: number;
  totalFees: number;
  totalTaxes: number;
}

serve(async (req: Request) => {
  try {
    // CORS headers
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Content-Type": "application/json"
    };

    // Handle preflight OPTIONS request
    if (req.method === "OPTIONS") {
      return new Response(null, { headers, status: 204 });
    }

    // Only allow POST requests
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { headers, status: 405 }
      );
    }

    // Extract the form data (PDF file)
    const formData = await req.formData();
    const pdfFile = formData.get("bill") as File;
    
    if (!pdfFile) {
      return new Response(
        JSON.stringify({ error: "No PDF file provided" }),
        { headers, status: 400 }
      );
    }

    // Convert the file to ArrayBuffer for processing
    const pdfArrayBuffer = await pdfFile.arrayBuffer();

    // Extract text from PDF
    const pdfExtract = new PDFExtract();
    const extractOptions = {};
    const data = await pdfExtract.extractBuffer(new Uint8Array(pdfArrayBuffer), extractOptions);
    
    // Process the extracted text to analyze the bill
    const billAnalysis = analyzeBill(data);

    // Store the analysis in the database
    const { data: insertedData, error } = await supabase
      .from("bill_analyses")
      .insert({
        account_number: billAnalysis.accountNumber,
        billing_period: billAnalysis.billingPeriod,
        total_amount: billAnalysis.totalAmount,
        analysis_data: billAnalysis
      })
      .select()
      .single();

    if (error) {
      console.error("Error storing bill analysis:", error);
      return new Response(
        JSON.stringify({ error: "Failed to store bill analysis" }),
        { headers, status: 500 }
      );
    }

    // Return the analysis
    return new Response(
      JSON.stringify({ 
        success: true, 
        data: billAnalysis,
        stored: insertedData 
      }),
      { headers, status: 200 }
    );
  } catch (error) {
    console.error("Error processing bill:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process bill", details: error.message }),
      { 
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json"
        }, 
        status: 500 
      }
    );
  }
});

function analyzeBill(pdfData: any): BillData {
  // Extract all the text content from the PDF
  const textContent = pdfData.pages
    .map((page: any) => page.content.map((item: any) => item.str).join(' '))
    .join('\n');
  
  // Parse Verizon bill data
  // These are regex patterns to extract key information
  const accountNumberMatch = textContent.match(/Account Number:?\s*(\d{10})/i) || 
                             textContent.match(/Account #:?\s*(\d{10})/i);
  const billingPeriodMatch = textContent.match(/Billing period:?\s*([A-Za-z]+\s+\d{1,2},\s+\d{4}\s+to\s+[A-Za-z]+\s+\d{1,2},\s+\d{4})/i) ||
                             textContent.match(/(\w+ \d{1,2}, \d{4}) - (\w+ \d{1,2}, \d{4})/);
  const totalAmountMatch = textContent.match(/Total due:?\s*\$?(\d+\.\d{2})/i) ||
                           textContent.match(/Amount due:?\s*\$?(\d+\.\d{2})/i);

  // Extract line items (this would be more complex in a real implementation)
  const lineItems = extractLineItems(textContent);
  
  // Extract fees (more complex in a real implementation)
  const fees = extractFees(textContent);
  
  // Calculate totals
  const totalDevicePayments = lineItems.reduce((sum, item) => sum + (item.devicePayment || 0), 0);
  const totalPlanCharges = lineItems.reduce((sum, item) => sum + (item.charges - (item.devicePayment || 0)), 0);
  const totalFees = fees.reduce((sum, fee) => sum + fee.amount, 0);
  
  // Taxes are often listed separately in the bill
  const totalTaxesMatch = textContent.match(/Total taxes:?\s*\$?(\d+\.\d{2})/i) ||
                          textContent.match(/Taxes:?\s*\$?(\d+\.\d{2})/i);
  const totalTaxes = totalTaxesMatch ? parseFloat(totalTaxesMatch[1]) : 0;

  return {
    accountNumber: accountNumberMatch ? accountNumberMatch[1] : "Unknown",
    billingPeriod: billingPeriodMatch ? billingPeriodMatch[0] : "Unknown",
    totalAmount: totalAmountMatch ? parseFloat(totalAmountMatch[1]) : 0,
    lineItems,
    fees,
    totalDevicePayments,
    totalPlanCharges,
    totalFees,
    totalTaxes
  };
}

function extractLineItems(textContent: string): Array<{
  lineNumber: string;
  phoneNumber?: string;
  charges: number;
  planName?: string;
  devicePayment?: number;
  dataUsage?: number;
}> {
  const lineItems = [];
  
  // Look for sections that typically contain line item information
  // This is a simplified example and would need to be customized based on the actual bill format
  const lineItemRegex = /(\d{3}-\d{3}-\d{4}|\(\d{3}\)\s*\d{3}-\d{4})\s+.*?(\$\d+\.\d{2})/g;
  
  let match;
  while ((match = lineItemRegex.exec(textContent)) !== null) {
    // Extract phone number and charges
    const phoneNumber = match[1].replace(/[()-\s]/g, '');
    const charges = parseFloat(match[2].replace('$', ''));
    
    // Try to extract plan name (this would need more sophisticated parsing in a real implementation)
    const planNameMatch = textContent.substring(match.index, match.index + 300).match(/plan:?\s*([\w\s]+)/i);
    
    // Try to extract device payment (simplified)
    const devicePaymentMatch = textContent.substring(match.index, match.index + 300).match(/device payment:?\s*\$?(\d+\.\d{2})/i);
    
    // Try to extract data usage (simplified)
    const dataUsageMatch = textContent.substring(match.index, match.index + 300).match(/(\d+(\.\d+)?)\s*GB/i);
    
    lineItems.push({
      lineNumber: `Line ${lineItems.length + 1}`,
      phoneNumber,
      charges,
      planName: planNameMatch ? planNameMatch[1].trim() : undefined,
      devicePayment: devicePaymentMatch ? parseFloat(devicePaymentMatch[1]) : undefined,
      dataUsage: dataUsageMatch ? parseFloat(dataUsageMatch[1]) : undefined
    });
  }
  
  // If no line items were found, we'll add a placeholder
  if (lineItems.length === 0) {
    // Try looking for plan charges
    const planChargesMatch = textContent.match(/Plan charges:?\s*\$?(\d+\.\d{2})/i);
    if (planChargesMatch) {
      lineItems.push({
        lineNumber: "Line 1",
        charges: parseFloat(planChargesMatch[1]),
        planName: "Unknown Plan"
      });
    }
  }
  
  return lineItems;
}

function extractFees(textContent: string): Array<{
  name: string;
  amount: number;
}> {
  const fees = [];
  
  // Common fee patterns in Verizon bills
  const feePatterns = [
    { name: "Administrative Charge", regex: /Administrative\s+Charge:?\s*\$?(\d+\.\d{2})/i },
    { name: "Federal Universal Service Charge", regex: /Federal\s+Universal\s+Service\s+Charge:?\s*\$?(\d+\.\d{2})/i },
    { name: "Regulatory Charge", regex: /Regulatory\s+Charge:?\s*\$?(\d+\.\d{2})/i },
    { name: "911 Fee", regex: /911\s+Fee:?\s*\$?(\d+\.\d{2})/i }
  ];
  
  // Extract fees based on known patterns
  for (const pattern of feePatterns) {
    const match = textContent.match(pattern.regex);
    if (match) {
      fees.push({
        name: pattern.name,
        amount: parseFloat(match[1])
      });
    }
  }
  
  // Generic fee pattern (could capture other fees not explicitly defined)
  const genericFeeRegex = /([A-Za-z\s]+\b(?:fee|charge|recovery|assessment)):?\s*\$?(\d+\.\d{2})/gi;
  let match;
  while ((match = genericFeeRegex.exec(textContent)) !== null) {
    // Check if this fee was already captured by our specific patterns
    const feeName = match[1].trim();
    if (!fees.some(fee => fee.name.toLowerCase() === feeName.toLowerCase())) {
      fees.push({
        name: feeName,
        amount: parseFloat(match[2])
      });
    }
  }
  
  return fees;
}
