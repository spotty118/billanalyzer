
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Get Claude API key from environment variable
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

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

async function sendPdfToClaude(fileContent: ArrayBuffer) {
  if (!ANTHROPIC_API_KEY) {
    console.error("Missing Anthropic API key");
    throw new Error("Claude API key not configured");
  }
  
  try {
    console.log("Sending PDF to Claude API...");
    
    // Convert the ArrayBuffer to base64 using the chunking function
    const base64Content = arrayBufferToBase64(fileContent);
    
    console.log(`PDF converted to base64, length: ${base64Content.length}`);
    console.log(`Using Claude API with key length: ${ANTHROPIC_API_KEY.length}`);
    
    // Send to Claude using the document API approach
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-opus-20240229",
        max_tokens: 4000,
        system: `You are an expert Verizon bill analyzer. Extract and organize the key information from the bill, including account info, billing period, total amount due, and details for each phone line (number, plan, device, charges). Format your response as a clean JSON object that can be directly parsed.`,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "This is a Verizon bill PDF. Please analyze it and extract all the information into a structured JSON format."
              },
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: "application/pdf; charset=utf-8",
                  data: base64Content
                }
              }
            ]
          }
        ]
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Claude API error response:", errorText);
      console.error("Claude API status:", response.status, response.statusText);
      
      // Parse the error if possible to provide more detail
      try {
        const errorData = JSON.parse(errorText);
        console.error("Claude API error details:", JSON.stringify(errorData));
        throw new Error(`Claude API error: ${response.status} ${response.statusText} - ${errorData.error?.message || errorData.error || 'Unknown error'}`);
      } catch (parseError) {
        throw new Error(`Claude API error: ${response.status} ${response.statusText} - ${errorText.substring(0, 200)}`);
      }
    }
    
    // Get the response data
    const responseData = await response.json();
    console.log("Claude API response received successfully");
    
    // Return the raw Claude response
    return responseData;
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
    
    // Process the form data
    const formData = await req.formData();
    const file = formData.get('file');
    
    if (!file || !(file instanceof File)) {
      console.error("No file provided in request");
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'application/json'
        }
      });
    }
    
    console.log(`Received file: ${file.name}, size: ${file.size} bytes, type: ${file.type}`);
    
    // Read up to 5MB max to prevent memory issues
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      console.error(`File too large: ${file.size} bytes (max 5MB)`);
      return new Response(JSON.stringify({ error: 'File too large (max 5MB)' }), {
        status: 400,
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Read the file content as ArrayBuffer
    const fileContent = await file.arrayBuffer();
    console.log(`File content read successfully, size: ${fileContent.byteLength} bytes`);
    
    // Send directly to Claude and get raw response
    console.log("Sending to Claude for analysis...");
    const claudeResponse = await sendPdfToClaude(fileContent);
    console.log("Claude analysis complete");
    
    // Return Claude's raw response
    return new Response(JSON.stringify(claudeResponse), {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json'
      }
    });
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
