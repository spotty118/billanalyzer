import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Get Claude API key from environment variable
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

// In EdgeRuntime, use the waitUntil function to continue processing after response is sent
const isEdgeRuntime = typeof EdgeRuntime !== 'undefined';

// Function to extract text from PDF
async function extractTextFromPdf(pdfBuffer: ArrayBuffer): Promise<string> {
  try {
    console.log("Extracting text from PDF...");
    
    // Convert buffer to base64 for transmission
    const base64Pdf = arrayBufferToBase64(pdfBuffer);
    
    // Use Claude to extract text from the PDF first
    const textExtractionRequest = {
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 4000,
      system: "You are a document OCR specialist. Extract ALL text from the PDF document. Return ONLY the raw text content, with no commentary, analysis, or formatting. Preserve paragraph breaks with newlines. This is for a bill parsing system, so all text is important.",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please extract all text from this PDF document. Return only the raw text content with no additional commentary."
            },
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: base64Pdf
              }
            }
          ]
        }
      ]
    };
    
    console.log("Sending PDF for text extraction to Claude API...");
    
    // Send request to Claude API for text extraction
    const textExtractionResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify(textExtractionRequest)
    });
    
    if (!textExtractionResponse.ok) {
      const errorText = await textExtractionResponse.text();
      console.error("Claude API error during text extraction:", errorText);
      throw new Error(`Text extraction failed: ${textExtractionResponse.status} ${textExtractionResponse.statusText}`);
    }
    
    // Parse the response from Claude
    const extractionResult = await textExtractionResponse.json();
    console.log("Text extraction completed successfully");
    
    // Get the extracted text from Claude's response
    const extractedText = extractionResult.content[0].text;
    console.log(`Extracted text length: ${extractedText.length} characters`);
    
    return extractedText;
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    throw new Error(`PDF text extraction failed: ${error.message}`);
  }
}

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

// Function to sanitize sensitive information from text
function sanitizeSensitiveData(text: string): string {
  if (!text) return text;
  
  // Replace account numbers (various formats)
  text = text.replace(/Account:?\s*\d+-\d+/gi, "Account: XXXX-XXXXX");
  text = text.replace(/Account number:?\s*\d+-\d+/gi, "Account number: XXXX-XXXXX");
  text = text.replace(/Account:?\s*\d{10}/gi, "Account: XXXXXXXXXX");
  
  // Replace phone numbers
  text = text.replace(/(\d{3})[-.]\d{3}[-.]\d{4}/g, "$1-XXX-XXXX");
  text = text.replace(/\b\d{10}\b/g, "XXX-XXX-XXXX");
  
  // Replace names and addresses (common patterns in bills)
  text = text.replace(/([A-Z][a-z]+\s[A-Z][a-z]+)\s+\d+\s+([A-Z][a-z]+\s+[A-Za-z]+)/g, "NAME REMOVED ADDRESS REMOVED");
  text = text.replace(/\b[A-Z][A-Za-z]+ [A-Z][A-Za-z]+\b/g, "NAME REMOVED");
  
  // Replace full addresses with street numbers
  text = text.replace(/\d+\s+[A-Za-z\s]+(?:Road|Rd|Street|St|Avenue|Ave|Lane|Ln|Drive|Dr|Circle|Cir|Boulevard|Blvd|Highway|Hwy|Way|Court|Ct|Plaza|Plz|Terrace|Ter)\b[,\s\w]+\d{5}(?:-\d{4})?/gi, "ADDRESS REMOVED");
  
  // Replace city, state zip formats
  text = text.replace(/[A-Z][A-Za-z\s]+,\s+[A-Z]{2}\s+\d{5}(?:-\d{4})?/g, "CITY, ST ZIPCODE");
  
  // Replace email addresses
  text = text.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "EMAIL@REMOVED.COM");
  
  return text;
}

async function analyzeBillText(extractedText: string, networkPreference?: string) {
  if (!ANTHROPIC_API_KEY) {
    console.error("Missing Anthropic API key");
    throw new Error("Claude API key not configured");
  }
  
  // Sanitize the text before sending to analysis
  const sanitizedText = sanitizeSensitiveData(extractedText);
  
  try {
    console.log("Sending extracted text to Claude API for analysis...");
    console.log("Text sample (first 200 chars):", sanitizedText.substring(0, 200));
    
    const systemPrompt = `You are an expert Verizon bill analyzer. Analyze the provided Verizon bill text and extract key information into a structured JSON format.

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
        "protection": number,
        "perks": [
          {
            "name": string,
            "cost": number
          }
        ],
        "surcharges": number,
        "taxes": number,
        "prorated": boolean,
        "activationFee": number
      }
    }
  ],
  "chargesByCategory": {
    "Plan Charges": number,
    "Device Payments": number,
    "Services & Add-ons": number,
    "Taxes & Fees": number,
    "Discounts & Credits": number
  },
  "perks": [
    {
      "name": string,
      "description": string,
      "monthlyValue": number,
      "includedWith": string
    }
  ],
  "promotions": [
    {
      "name": string,
      "description": string,
      "monthlyValue": number,
      "remainingMonths": number,
      "appliedTo": string
    }
  ]
}

DO NOT include any actual customer names, addresses, or full account numbers in the output, use placeholders instead. For example, use "Customer" for names, "XXX-XXX-XXXX" for partial phone numbers, and "XXXX1234" for partial account numbers.

Extract all values directly from the bill text. If you cannot find a specific value in the document, use an empty string for strings or 0 for numbers. Make sure to identify all discounts, credits, device payments, protection plans, and perks, even if they have $0 cost.

Pay special attention to:
1. Device payments and their associated credits
2. Plan discounts (such as autopay, loyalty, or multi-line discounts)
3. Perks included with plans (like streaming services)
4. Protection plans and insurance
5. Taxes and regulatory fees
6. Promotional credits and their remaining duration

YOU MUST ensure your response contains ONLY valid JSON that can be parsed with JSON.parse(). Do not include any explanatory text, markdown formatting, or code blocks before or after the JSON.`;

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
              text: "Here is the text extracted from a Verizon bill. Please analyze it and extract the structured information according to the format specified:" + 
                  (networkPreference ? `\n\nThe customer's preferred network is: ${networkPreference}.\n\n` : "\n\n") + 
                  sanitizedText
            }
          ]
        }
      ]
    };
    
    console.log("Sending text to Claude API...");
    
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
      throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
    }
    
    // Parse the response from Claude
    const claudeResponse = await response.json();
    console.log("Claude API analysis response received successfully");
    
    // Extract the JSON content from Claude's response
    const analysisText = claudeResponse.content[0].text;
    console.log("Analysis text length:", analysisText.length);
    console.log("Analysis text sample:", analysisText.substring(0, 500));
    
    try {
      // Try to parse the response as JSON directly
      let jsonData;
      
      // First attempt: direct parsing
      try {
        jsonData = JSON.parse(analysisText);
      } catch (parseError) {
        console.log("Direct JSON parsing failed, attempting to extract JSON from text");
        
        // Second attempt: find JSON in the text with regex
        const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("Unable to extract JSON from Claude's response");
        }
      }
      
      // Final sanitization check for any missed PII
      if (jsonData.accountInfo) {
        if (jsonData.accountInfo.customerName && !jsonData.accountInfo.customerName.includes("REMOVED")) {
          jsonData.accountInfo.customerName = "Customer";
        }
        
        if (jsonData.accountInfo.accountNumber && !jsonData.accountInfo.accountNumber.includes("X")) {
          jsonData.accountInfo.accountNumber = "ACCOUNT-XXXXX";
        }
      }
      
      // Sanitize phone numbers in phoneLines
      if (jsonData.phoneLines) {
        jsonData.phoneLines = jsonData.phoneLines.map((line: any) => {
          // Sanitize phone number if it doesn't already contain X's
          if (line.phoneNumber && !line.phoneNumber.includes("X")) {
            const lastFour = line.phoneNumber.slice(-4);
            line.phoneNumber = `XXX-XXX-${lastFour}`;
          }
          
          // Sanitize owner name
          if (line.ownerName && !line.ownerName.includes("REMOVED")) {
            line.ownerName = "User";
          }
          
          // Ensure all required properties exist with defaults
          if (!line.details) {
            line.details = {};
          }
          
          line.details = {
            planCost: line.details.planCost || 0,
            planDiscount: line.details.planDiscount || 0,
            devicePayment: line.details.devicePayment || 0,
            deviceCredit: line.details.deviceCredit || 0,
            protection: line.details.protection || 0,
            perks: line.details.perks || [],
            surcharges: line.details.surcharges || 0,
            taxes: line.details.taxes || 0,
            prorated: line.details.prorated || false,
            activationFee: line.details.activationFee || 0,
            ...line.details
          };
          
          // Ensure monthlyTotal is calculated correctly
          if (!line.monthlyTotal || typeof line.monthlyTotal !== 'number') {
            const details = line.details;
            line.monthlyTotal = (
              (details.planCost || 0) - 
              (details.planDiscount || 0) + 
              (details.devicePayment || 0) - 
              (details.deviceCredit || 0) + 
              (details.protection || 0) + 
              (details.surcharges || 0) + 
              (details.taxes || 0) + 
              (details.activationFee || 0)
            );
          }
          
          return line;
        });
      }
      
      // Ensure chargesByCategory exists
      if (!jsonData.chargesByCategory) {
        jsonData.chargesByCategory = {
          "Plan Charges": 0,
          "Device Payments": 0,
          "Services & Add-ons": 0,
          "Taxes & Fees": 0,
          "Discounts & Credits": 0
        };
      }
      
      // Add network preference if provided
      if (networkPreference) {
        jsonData.networkPreference = networkPreference;
      }
      
      // Add source information
      jsonData.analysisSource = "our-ai";
      jsonData.processingMethod = "text-extraction";
      jsonData.extractionDate = new Date().toISOString();
      jsonData.privacyProtected = true;
      
      console.log("Successfully parsed JSON data from Claude's response");
      console.log("JSON data keys:", Object.keys(jsonData));
      
      return jsonData;
    } catch (jsonError) {
      console.error("Error parsing JSON from Claude response:", jsonError);
      console.error("Claude response content:", analysisText.substring(0, 500) + "...");
      throw new Error("Failed to parse JSON from Claude's response");
    }
  } catch (error) {
    console.error("Error using Claude for analysis:", error);
    throw new Error(`AI analysis failed: ${error.message}`);
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
    
    let extractedText = "";
    let isDirectTextInput = false;
    let networkPreference = null;
    
    // Check if this is a JSON request or form data
    const contentType = req.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      // Handle direct text input case
      console.log("Processing direct text input");
      const jsonData = await req.json();
      
      if (!jsonData.text) {
        throw new Error('No text provided in the request');
      }
      
      extractedText = jsonData.text;
      
      // Check if network preference was provided
      if (jsonData.networkPreference) {
        networkPreference = jsonData.networkPreference;
        console.log(`Network preference provided: ${networkPreference}`);
      }
      
      isDirectTextInput = true;
      console.log(`Received text input, length: ${extractedText.length} characters`);
      
    } else {
      // Handle file upload case
      console.log("Processing file upload");
      const formData = await req.formData();
      const file = formData.get('file');
      
      // Check if network preference was provided in form data
      const networkPref = formData.get('networkPreference');
      if (networkPref && typeof networkPref === 'string') {
        networkPreference = networkPref;
        console.log(`Network preference provided: ${networkPreference}`);
      }
      
      if (!file || !(file instanceof File)) {
        throw new Error('No file provided or invalid file format');
      }
      
      console.log(`Processing file: ${file.name}, type: ${file.type}, size: ${file.size} bytes`);
      
      // Read the file content as an ArrayBuffer
      const fileContent = await file.arrayBuffer();
      console.log(`File read as ArrayBuffer, length: ${fileContent.byteLength}`);
      
      // Extract text from the PDF
      extractedText = await extractTextFromPdf(fileContent);
      console.log("Text extracted successfully from PDF");
    }
    
    // Analyze the bill using Our AI
    const analysisResult = await analyzeBillText(extractedText, networkPreference);
    console.log("Analysis complete");
    
    // Include the processing method in the result
    if (isDirectTextInput) {
      analysisResult.processingMethod = "direct-text-input";
    }
    
    // Return the analysis result
    return new Response(JSON.stringify(analysisResult), {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json'
      }
    });
    
  } catch (error) {
    console.error('Error processing request:', error);
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
