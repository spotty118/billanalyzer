
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
    // Extract API key from request
    const apiKey = req.headers.get('apikey') || 
                  req.headers.get('Authorization')?.replace('Bearer ', '') || 
                  '';
    
    // Validate the API key exists
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Missing API key' }),
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
        fileContent = jsonData.sampleText || 'Sample Verizon bill content for testing';
        console.log('Using sample text for analysis');
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
  
  // Extract account number (looking for patterns like "Account #: XXXXXXXXX")
  const accountNumberMatch = fileContent.match(/Account\s*(?:#|number|\w*)[:\s-]*(\d+[-\d]*)/i);
  const accountNumber = accountNumberMatch ? accountNumberMatch[1] : "Unknown";
  
  // Extract billing period (looking for dates)
  const billingPeriodMatch = fileContent.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}[,\s]+\d{4}\s+(?:to|through|[-])\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}[,\s]+\d{4}/i);
  const billingPeriod = billingPeriodMatch ? billingPeriodMatch[0] : "Current Billing Period";
  
  // Extract total amount (looking for dollar amounts near "total" or "amount due")
  const totalAmountMatch = fileContent.match(/(?:total|amount due|pay this amount):?\s*\$?(\d+(?:[,.]\d+)?)/i);
  const totalAmount = totalAmountMatch ? parseFloat(totalAmountMatch[1].replace(',', '')) : 0;
  
  // Extract phone numbers (simplified, just looking for patterns)
  const phoneNumberRegex = /(?:\()?\d{3}(?:\))?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const phoneMatches = fileContent.match(phoneNumberRegex) || [];
  const phoneNumbers = [...new Set(phoneMatches)];
  
  // Try to extract device information
  const devices = [];
  const phoneLines = [];
  
  // Common device patterns
  const devicePatterns = [
    /iPhone\s+\d+(?:\s+Pro)?(?:\s+Max)?/g,
    /iPad\s+(?:\w+\s+)?(?:Generation|\d+)/g,
    /Apple\s+Watch\s+(?:Series\s+)?\d+/g,
    /Samsung\s+Galaxy\s+\w+\d+/g
  ];
  
  // Extract devices
  for (const pattern of devicePatterns) {
    const matches = fileContent.matchAll(pattern);
    for (const match of matches) {
      devices.push(match[0]);
    }
  }
  
  // Match phone numbers with devices (simplified approach)
  const phoneLineRegex = new RegExp(`(${phoneNumbers.join('|')}).*?(?:device|phone|equipment).*?(${devices.join('|')})`, 'gi');
  const phoneLineMatches = fileContent.matchAll(phoneLineRegex);
  
  for (const match of Array.from(phoneLineMatches)) {
    const phoneNumber = match[1].replace(/[^\d]/g, '');
    const deviceName = match[2];
    
    phoneLines.push({
      phoneNumber,
      deviceName,
      planName: "Unknown plan",
      monthlyTotal: 0,
      charges: []
    });
  }
  
  // If no specific phone-device matches found, create entries based on extracted numbers
  if (phoneLines.length === 0) {
    for (let i = 0; i < phoneNumbers.length; i++) {
      const phone = phoneNumbers[i].replace(/[^\d]/g, '');
      const device = i < devices.length ? devices[i] : "Unknown device";
      
      phoneLines.push({
        phoneNumber: phone,
        deviceName: device,
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
