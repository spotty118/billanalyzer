
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Get Claude API key from environment variable
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

async function sendPdfToClaude(fileContent: ArrayBuffer) {
  if (!ANTHROPIC_API_KEY) {
    console.error("Missing Anthropic API key");
    throw new Error("Claude API key not configured");
  }
  
  try {
    console.log("Sending PDF directly to Claude for analysis...");
    
    // Convert ArrayBuffer to base64
    const buffer = new Uint8Array(fileContent);
    const base64Content = btoa(String.fromCharCode(...buffer));
    
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3.7-sonnet-20240229",
        max_tokens: 4000,
        system: `You are an expert Verizon bill analyzer. Extract and organize the key information from the bill, including account info, billing period, total amount due, and details for each phone line (number, plan, device, charges). Format your response as a clean JSON object that can be directly parsed.`,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this Verizon bill PDF and extract all the information into a JSON format."
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
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Claude API error:", errorText);
      throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
    }
    
    // Return the raw Claude response
    return await response.json();
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
    // Process the form data
    const formData = await req.formData();
    const file = formData.get('file');
    
    if (!file || !(file instanceof File)) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Read up to 5MB max to prevent memory issues
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
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
    
    // Send directly to Claude and get raw response
    const claudeResponse = await sendPdfToClaude(fileContent);
    
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
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json'
      }
    });
  }
});
