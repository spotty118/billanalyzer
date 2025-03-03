
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract API key from request in multiple formats
    const apiKey = req.headers.get('apikey') || 
                  req.headers.get('Authorization')?.replace('Bearer ', '') || 
                  '';
    
    console.log("Auth headers received:", {
      apikey: req.headers.get('apikey') ? 'Present' : 'Missing',
      authorization: req.headers.get('Authorization') ? 'Present' : 'Missing'
    });
    
    // Validate the API key exists
    if (!apiKey) {
      console.error("Missing authorization header - no apikey or Authorization header found");
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 401 
        }
      );
    }

    // Handle different content types
    const contentType = req.headers.get('content-type') || '';
    let fileContent = '';
    
    if (contentType.includes('multipart/form-data')) {
      // Process form data with file
      try {
        const formData = await req.formData();
        const file = formData.get('file');

        if (!file || !(file instanceof File)) {
          return new Response(
            JSON.stringify({ error: 'No valid file uploaded' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        // Read the file content
        fileContent = await file.text();
        console.log("Received file with size:", fileContent.length);
        
      } catch (error) {
        console.error('Error processing form data:', error);
        return new Response(
          JSON.stringify({ error: `Error processing form data: ${error.message}` }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
    } else if (contentType.includes('application/json')) {
      // Process JSON data (for testing or alternate input)
      try {
        const jsonData = await req.json();
        // Allow sample text to be passed for testing
        fileContent = jsonData.sampleText || jsonData.text || 'Sample Verizon bill content for testing';
        console.log('Using sample text for analysis:', fileContent.substring(0, 50) + '...');
      } catch (error) {
        console.error('Error processing JSON data:', error);
        return new Response(
          JSON.stringify({ error: `Error processing JSON data: ${error.message}` }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
    } else {
      return new Response(
        JSON.stringify({ error: 'Unsupported content type' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Basic validation of file content
    if (!fileContent || fileContent.length < 10) {
      return new Response(
        JSON.stringify({ error: 'File content is too small or empty' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Process the file content
    const analysisResult = await analyzeVerizonBill(fileContent);
    console.log("Analysis completed successfully");

    // Return the analysis result
    return new Response(
      JSON.stringify(analysisResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing request:', error);
    
    return new Response(
      JSON.stringify({ error: `Error processing request: ${error.message}` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

async function analyzeVerizonBill(fileContent: string) {
  console.log("Analyzing Verizon bill...");
  
  // Extract account number with simpler regex patterns (safer approach)
  let accountNumber = "Unknown";
  try {
    const accountNumberPattern = /Account\s*(?:#|number|\w*)[:\s-]*(\d[\d-]{5,15})/i;
    const accountNumberMatch = fileContent.match(accountNumberPattern);
    if (accountNumberMatch && accountNumberMatch[1]) {
      accountNumber = accountNumberMatch[1];
    }
  } catch (error) {
    console.error("Error extracting account number:", error);
  }
  
  // Extract billing period with simplified regex
  let billingPeriod = "Current Billing Period";
  try {
    const monthNames = "(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*";
    const datePattern = `${monthNames}\\s+\\d{1,2}[,\\s]+\\d{4}`;
    const billingPeriodPattern = new RegExp(`${datePattern}\\s+(?:to|through|[-])\\s+${datePattern}`, 'i');
    
    const billingPeriodMatch = fileContent.match(billingPeriodPattern);
    if (billingPeriodMatch) {
      billingPeriod = billingPeriodMatch[0];
    }
  } catch (error) {
    console.error("Error extracting billing period:", error);
  }
  
  // Extract total amount with safer regex
  let totalAmount = 0;
  try {
    const totalAmountPattern = /(?:total|amount due|pay this amount):?\s*\$?(\d+(?:[,.]\d+)?)/i;
    const totalAmountMatch = fileContent.match(totalAmountPattern);
    if (totalAmountMatch && totalAmountMatch[1]) {
      totalAmount = parseFloat(totalAmountMatch[1].replace(',', ''));
    }
  } catch (error) {
    console.error("Error extracting total amount:", error);
  }
  
  // Extract phone numbers with simpler pattern
  const phoneNumbers: string[] = [];
  try {
    // Breaking the phone number regex into smaller chunks for safety
    const phonePatterns = [
      /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g,  // Basic format: 555-555-5555
      /\b\(\d{3}\)[-.\s]?\d{3}[-.\s]?\d{4}\b/g  // Format with parentheses: (555) 555-5555
    ];
    
    let matches: string[] = [];
    for (const pattern of phonePatterns) {
      const patternMatches = fileContent.match(pattern) || [];
      matches = [...matches, ...patternMatches];
    }
    
    // Deduplicate phone numbers
    if (matches && matches.length > 0) {
      const uniquePhones = [...new Set(matches)];
      phoneNumbers.push(...uniquePhones);
    }
  } catch (error) {
    console.error("Error extracting phone numbers:", error);
  }
  
  // Try to extract device information with safer patterns
  const devices: string[] = [];
  const phoneLines: any[] = [];
  
  try {
    // Common device patterns - broken into smaller, safer patterns
    const devicePatterns = [
      /iPhone\s+\d+/g,
      /iPhone\s+\d+\s+Pro\b/g,
      /iPhone\s+\d+\s+Pro\s+Max\b/g,
      /iPad\s+\w+/g,
      /iPad\s+\w+\s+Generation/g, 
      /Apple\s+Watch\s+Series\s+\d+/g,
      /Samsung\s+Galaxy\s+\w+\d+/g
    ];
    
    // Extract devices with multiple simpler patterns
    for (const pattern of devicePatterns) {
      try {
        const matches = fileContent.match(pattern) || [];
        devices.push(...matches);
      } catch (err) {
        console.error(`Error with device pattern ${pattern}:`, err);
      }
    }
  } catch (error) {
    console.error("Error extracting devices:", error);
  }
  
  // Match phone numbers with devices (simplified approach)
  try {
    for (let i = 0; i < phoneNumbers.length; i++) {
      const phoneNumber = phoneNumbers[i].replace(/[^\d]/g, '');
      const deviceName = i < devices.length ? devices[i] : "Unknown device";
      
      phoneLines.push({
        phoneNumber,
        deviceName,
        planName: "Unknown plan",
        monthlyTotal: 0,
        charges: []
      });
    }
  } catch (error) {
    console.error("Error mapping phones to devices:", error);
  }
  
  if (phoneLines.length === 0 && phoneNumbers.length > 0) {
    // Fallback if no matching was successful
    for (const phone of phoneNumbers) {
      phoneLines.push({
        phoneNumber: phone.replace(/[^\d]/g, ''),
        deviceName: "Unknown device",
        planName: "Unknown plan",
        monthlyTotal: 0,
        charges: []
      });
    }
  }
  
  return {
    accountNumber,
    billingPeriod,
    totalAmount,
    phoneLines,
    charges: []
  };
}
