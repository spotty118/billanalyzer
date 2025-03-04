
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Get Claude API key from environment variable
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

// In EdgeRuntime, use the waitUntil function to continue processing after response is sent
const isEdgeRuntime = typeof EdgeRuntime !== 'undefined';

// Safely convert ArrayBuffer to base64 in chunks to avoid call stack issues
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const uint8Array = new Uint8Array(buffer);
  const chunkSize = 8192; // Process in 8KB chunks to avoid stack overflow
  let base64 = '';
  
  // Process the array in chunks
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.slice(i, Math.min(i + chunkSize, uint8Array.length));
    const binaryString = Array.from(chunk)
      .map(byte => String.fromCharCode(byte))
      .join('');
    base64 += btoa(binaryString);
  }
  
  return base64;
}

async function sendToClaude(fileContent: ArrayBuffer) {
  if (!ANTHROPIC_API_KEY) {
    console.error("Missing Anthropic API key");
    throw new Error("Claude API key not configured");
  }
  
  try {
    console.log("Sending content to Claude API...");
    
    // Convert the ArrayBuffer to base64 using the chunking function
    const base64Content = arrayBufferToBase64(fileContent);
    console.log(`Content converted to base64, length: ${base64Content.length}`);
    
    const systemPrompt = `You are an expert Verizon bill analyzer. Extract and organize the key information from the bill, including account info, billing period, total amount due, and details for each phone line (number, plan, device, charges). Format your response as a clean JSON object that can be directly parsed.

IMPORTANT: Your response must be a valid JSON object that can be parsed with JSON.parse(). Structure it like this:
{
  "accountInfo": {
    "customerName": string,
    "accountNumber": string,
    "billingPeriod": string,
    "billDate": string,
    "dueDate": string
  },
  "totalAmount": number,
  "phoneLines": [
    {
      "phoneNumber": string,
      "ownerName": string,
      "deviceName": string,
      "planName": string,
      "monthlyTotal": number,
      "details": {
        "planCost": number,
        "planDiscount": number,
        "devicePayment": number,
        "deviceCredit": number,
        "protection": number
      }
    }
  ],
  "chargesByCategory": {
    "Plan Charges": number,
    "Device Payments": number,
    "Services & Add-ons": number,
    "Taxes & Fees": number
  }
}

Extract all values directly from the bill and DO NOT make up or guess ANY information. If you cannot find a specific value in the document, use an empty string or 0 for numbers.`;

    // Set up the Claude API request
    const claudeRequest = {
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 4000,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Here is a Verizon bill I need analyzed. Please extract all relevant information and format it according to the structure specified. Don't guess or make up any information - only extract what you can definitively identify in the document."
            },
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: base64Content
              }
            }
          ]
        }
      ]
    };
    
    console.log("Sending request to Claude API...");
    
    // Send request to Claude API
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify(claudeRequest)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Claude API error response:", errorText);
      console.error("Claude API status:", response.status, response.statusText);
      
      // Try to parse the error for more detailed information
      try {
        const errorData = JSON.parse(errorText);
        console.error("Claude API error details:", JSON.stringify(errorData));
        throw new Error(`Claude API error: ${response.status} ${response.statusText} - ${errorData.error?.message || errorData.error || 'Unknown error'}`);
      } catch (parseError) {
        throw new Error(`Claude API error: ${response.status} ${response.statusText} - ${errorText.substring(0, 200)}`);
      }
    }
    
    // Parse the response from Claude
    const claudeResponse = await response.json();
    console.log("Claude API response received successfully");
    
    return claudeResponse;
  } catch (error) {
    console.error("Error using Claude for analysis:", error);
    throw new Error(`Claude analysis failed: ${error.message}`);
  }
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: CORS_HEADERS
    });
  }
  
  // Check that request is POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json'
      }
    });
  }
  
  try {
    console.log("Received bill analysis request");
    
    // Get the form data from the request
    const formData = await req.formData();
    const file = formData.get('file');
    
    if (!file || !(file instanceof File)) {
      throw new Error('No file provided or invalid file format');
    }
    
    console.log(`Processing file: ${file.name}, type: ${file.type}, size: ${file.size} bytes`);
    
    // Read the file content as an ArrayBuffer
    const fileContent = await file.arrayBuffer();
    console.log(`File read as ArrayBuffer, length: ${fileContent.byteLength}`);
    
    // Define an async function for bill analysis
    const analyzeBill = async () => {
      try {
        // Send the file content to Claude for analysis
        const analysisResult = await sendToClaude(fileContent);
        console.log("Analysis complete");
        return analysisResult;
      } catch (error) {
        console.error("Error in background task:", error);
        throw error;
      }
    };
    
    // For Deno Deploy Edge Runtime, use waitUntil to continue processing in the background
    if (isEdgeRuntime) {
      // @ts-ignore: EdgeRuntime is available in Deno Deploy
      const analysisPromise = analyzeBill();
      // @ts-ignore: EdgeRuntime is available in Deno Deploy
      EdgeRuntime.waitUntil(analysisPromise);
      
      // Return a quick response
      return new Response(JSON.stringify({ 
        status: "processing",
        message: "Bill analysis started, check logs for results"
      }), {
        status: 202,
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'application/json'
        }
      });
    } else {
      // For standard Deno runtime, complete the analysis before responding
      const analysisResult = await analyzeBill();
      
      return new Response(JSON.stringify(analysisResult), {
        status: 200,
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'application/json'
        }
      });
    }
  } catch (error) {
    console.error('Error processing file:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      timestamp: new Date().toISOString(),
      service: 'analyze-verizon-bill'
    }), {
      status: 500,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json'
      }
    });
  }
});
