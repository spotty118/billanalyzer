import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Get API keys from environment variables
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');

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

// Function to analyze bill using Claude
async function analyzeBillWithClaude(extractedText: string, networkPreference?: string, carrierType?: string) {
  if (!ANTHROPIC_API_KEY) {
    console.error("Missing Anthropic API key");
    throw new Error("Claude API key not configured");
  }
  
  try {
    console.log("Sending extracted text to Claude API for analysis...");
    console.log("Text sample (first 200 chars):", extractedText.substring(0, 200));
    console.log("Carrier type:", carrierType || "verizon");
    
    const systemPrompt = `You are an expert mobile carrier bill analyzer. Analyze the provided ${carrierType || "mobile carrier"} bill text and extract key information into a structured JSON format.

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
              text: `Here is the text extracted from a ${carrierType || "mobile carrier"} bill. Please analyze it and extract the structured information according to the format specified:` + 
                  (networkPreference ? `\n\nThe customer's preferred network is: ${networkPreference}.\n\n` : "\n\n") + 
                  extractedText
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
      
      // Ensure proper structure for phoneLines and details
      if (jsonData.phoneLines) {
        jsonData.phoneLines = jsonData.phoneLines.map((line: any) => {
          if (!line.details) {
            line.details = {};
          }
          
          // Ensure all required properties exist with defaults
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
      
      // Add carrier type if provided
      if (carrierType) {
        jsonData.carrierType = carrierType;
      }
      
      // Add source information
      jsonData.analysisSource = "claude";
      jsonData.processingMethod = "text-extraction";
      jsonData.extractionDate = new Date().toISOString();
      jsonData.meta = {
        source: "claude-ai"
      };
      
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

// Function to analyze bill using Gemini (via OpenRouter) as a fallback
async function analyzeBillWithGemini(extractedText: string, networkPreference?: string, carrierType?: string) {
  if (!OPENROUTER_API_KEY) {
    console.error("Missing OpenRouter API key");
    throw new Error("OpenRouter API key not configured for Gemini access");
  }
  
  try {
    console.log("Attempting fallback with Gemini via OpenRouter...");
    console.log("Text sample (first 200 chars):", extractedText.substring(0, 200));
    console.log("Carrier type:", carrierType || "verizon");
    
    const systemPrompt = `You are an expert mobile carrier bill analyzer. Analyze the provided ${carrierType || "mobile carrier"} bill text and extract key information into a structured JSON format, following these guidelines exactly.

Your response must be a valid JSON object that can be parsed with JSON.parse(). Structure it like this:
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
  "recommendations": [
    {
      "carrier": string,
      "planName": string,
      "monthlyPrice": number,
      "originalPrice": number,
      "network": string,
      "features": [string],
      "reasons": [string],
      "pros": [string],
      "cons": [string]
    }
  ],
  "marketInsights": {
    "currentPromos": [string],
    "trendingPlans": [string],
    "networkPerformance": {
      "verizon": string,
      "tmobile": string,
      "att": string
    }
  },
  "personalizedAdvice": string,
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
}`;

    // Set up the OpenRouter API request for Gemini
    const openRouterRequest = {
      model: "google/gemini-2.0-flash-thinking-exp:free",
      messages: [
        {
          role: "system", 
          content: systemPrompt
        },
        {
          role: "user",
          content: `Here is the text extracted from a ${carrierType || "mobile carrier"} bill. Please analyze it and extract the structured information according to the format specified:` + 
              (networkPreference ? `\n\nThe customer's preferred network is: ${networkPreference}.\n\n` : "\n\n") + 
              extractedText
        }
      ],
      temperature: 0.1,
      max_tokens: 4000
    };
    
    console.log("Sending text to OpenRouter with model: google/gemini-2.0-flash-thinking-exp:free");
    
    // Send request to OpenRouter API
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://mgzfiouamidaqctnqnre.supabase.co",
        "X-Title": "Wireless Bill Analyzer"
      },
      body: JSON.stringify(openRouterRequest)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter API error response:", errorText);
      console.error("OpenRouter API status:", response.status);
      console.error("OpenRouter API statusText:", response.statusText);
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
    }
    
    // Parse the response from OpenRouter
    const openRouterResponse = await response.json();
    console.log("OpenRouter analysis response received successfully");
    console.log("Model used:", openRouterResponse.model || "Model info not available");
    
    // Extract the text content from OpenRouter's response
    const analysisText = openRouterResponse.choices[0].message.content;
    console.log("Analysis text length:", analysisText.length);
    console.log("Analysis text sample:", analysisText.substring(0, 500));
    
    try {
      // Try to parse the response as JSON
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
          throw new Error("Unable to extract JSON from Gemini's response");
        }
      }
      
      // Add recommendations if they don't exist
      if (!jsonData.recommendations) {
        // Generate some generic recommendations based on the bill data
        jsonData.recommendations = generateRecommendations(jsonData, networkPreference, carrierType);
      }
      
      // Add market insights if they don't exist
      if (!jsonData.marketInsights) {
        jsonData.marketInsights = {
          currentPromos: [
            "New customer discount: $300 off when switching to US Mobile",
            "BYOD credit: $200 per line when you bring your own device",
            "Family plan discount: 20% off for 4+ lines",
          ],
          trendingPlans: [
            "US Mobile Warp 5G Unlimited",
            "US Mobile Custom Plan",
            "US Mobile Family Plans",
          ],
          networkPerformance: {
            verizon: "Excellent coverage but higher cost",
            tmobile: "Good urban coverage with improved rural service",
            att: "Strong overall network with good rural coverage",
          }
        };
      }
      
      // Add personalized advice if it doesn't exist
      if (!jsonData.personalizedAdvice) {
        jsonData.personalizedAdvice = generatePersonalizedAdvice(jsonData, networkPreference);
      }
      
      // Ensure proper structure for phoneLines and details
      if (jsonData.phoneLines) {
        jsonData.phoneLines = jsonData.phoneLines.map((line: any) => {
          if (!line.details) {
            line.details = {};
          }
          
          // Ensure all required properties exist with defaults
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
      
      // Add carrier type if provided
      if (carrierType) {
        jsonData.carrierType = carrierType;
      }
      
      // Add source information
      jsonData.analysisSource = "gemini-2.0-flash-thinking";
      jsonData.processingMethod = "text-extraction";
      jsonData.extractionDate = new Date().toISOString();
      jsonData.meta = {
        source: "gemini-flash-thinking-ai"
      };
      
      console.log("Successfully parsed JSON data from Gemini's response");
      console.log("JSON data keys:", Object.keys(jsonData));
      
      return jsonData;
    } catch (jsonError) {
      console.error("Error parsing JSON from Gemini response:", jsonError);
      console.error("Gemini response content:", analysisText.substring(0, 500) + "...");
      throw new Error("Failed to parse JSON from Gemini's response");
    }
  } catch (error) {
    console.error("Error using Gemini for analysis:", error);
    throw new Error(`Gemini analysis failed: ${error.message}`);
  }
}

// Helper function to generate recommendations based on bill data
function generateRecommendations(billData: any, networkPreference?: string, carrierType?: string) {
  const linesCount = billData.phoneLines?.length || 1;
  const totalAmount = billData.totalAmount || 0;
  const avgLinePrice = linesCount > 0 ? totalAmount / linesCount : 0;
  
  const recommendations = [
    {
      carrier: "US Mobile",
      planName: "Warp 5G",
      monthlyPrice: 18.99,
      originalPrice: 25,
      network: networkPreference || "verizon",
      features: [
        "Unlimited talk & text",
        "10GB high-speed data",
        "Hotspot capability",
        "No contract required",
        "Premium network access"
      ],
      reasons: [
        `Save approximately $${(avgLinePrice - 18.99).toFixed(2)} per line monthly`,
        "No activation fees or hidden charges",
        "Flexible data options to match your usage"
      ],
      pros: [
        "Lower monthly cost",
        "Same network quality",
        "No contract required",
        "Customer-first support"
      ],
      cons: [
        "New carrier adjustment",
        "May need to port your number"
      ]
    },
    {
      carrier: "US Mobile",
      planName: "Lightspeed 5G",
      monthlyPrice: 29.99,
      originalPrice: 35,
      network: networkPreference || "verizon",
      features: [
        "Unlimited talk & text",
        "Unlimited high-speed data",
        "25GB hotspot data",
        "1 premium perk included",
        "Premium network access"
      ],
      reasons: [
        "Unlimited data with no slowdowns",
        "Premium streaming included",
        `Save approximately $${(avgLinePrice - 29.99).toFixed(2)} per line monthly`
      ],
      pros: [
        "Lower monthly cost",
        "Same network coverage",
        "Premium perks included",
        "Unlimited high-speed data"
      ],
      cons: [
        "New carrier transition",
        "May need physical SIM card"
      ]
    },
    {
      carrier: "US Mobile",
      planName: "DarkStar 5G",
      monthlyPrice: 39.99,
      originalPrice: 45,
      network: networkPreference || "verizon",
      features: [
        "Unlimited talk & text",
        "Truly unlimited premium data",
        "50GB hotspot data",
        "3 premium perks included",
        "International roaming included",
        "Priority network access"
      ],
      reasons: [
        "Maximum value with premium perks",
        "International features included",
        "No throttling or deprioritization",
        `Save approximately $${(avgLinePrice - 39.99).toFixed(2)} per line monthly`
      ],
      pros: [
        "Premium perks included",
        "Lower overall cost",
        "Same network quality",
        "International features"
      ],
      cons: [
        "Requires switching carriers",
        "Higher price than basic plans"
      ]
    }
  ];
  
  // Add carrier-specific recommendation
  if (carrierType && carrierType !== "verizon") {
    recommendations.push({
      carrier: carrierType.charAt(0).toUpperCase() + carrierType.slice(1),
      planName: "Value Plan",
      monthlyPrice: avgLinePrice * 0.8, // 20% less than current average
      originalPrice: avgLinePrice,
      network: carrierType,
      features: [
        "Unlimited talk & text",
        "Unlimited data",
        "5G access where available",
        "Mobile hotspot",
        "No contract required"
      ],
      reasons: [
        "Stay with your current carrier",
        "Simplified bill structure",
        "Potential savings with new customer promo"
      ],
      pros: [
        "No need to change carriers",
        "Familiar billing and support",
        "Possible loyalty discounts"
      ],
      cons: [
        "May not offer best overall value",
        "Limited premium perks"
      ]
    });
  }
  
  return recommendations;
}

// Helper function to generate personalized advice
function generatePersonalizedAdvice(billData: any, networkPreference?: string) {
  const linesCount = billData.phoneLines?.length || 1;
  const totalAmount = billData.totalAmount || 0;
  
  if (linesCount >= 4) {
    return "With your family plan of 4+ lines, you could benefit significantly from US Mobile's multi-line discounts. Their family plans offer premium network access at a fraction of the cost, with potential savings of 30-40% compared to traditional carriers.";
  } else if (linesCount >= 2) {
    return "For your 2-3 line account, US Mobile offers competitive pricing with the same premium network you currently use. Consider their Warp 5G or Lightspeed plans which include features like unlimited data and hotspot capabilities at lower prices.";
  } else {
    return "As a single line user, you're likely paying a premium with your current carrier. US Mobile's plans offer the same network quality with potential savings of $15-25 per month, plus no hidden fees or taxes.";
  }
}

// Main function to analyze bill text using the best available API
async function analyzeBillText(extractedText: string, networkPreference?: string, carrierType?: string) {
  // Try Claude first
  try {
    console.log("Attempting bill analysis with Claude...");
    return await analyzeBillWithClaude(extractedText, networkPreference, carrierType);
  } catch (claudeError) {
    console.error("Claude analysis failed, trying Gemini as fallback:", claudeError);
    
    // If Claude fails, try Gemini
    try {
      console.log("Attempting bill analysis with Gemini...");
      return await analyzeBillWithGemini(extractedText, networkPreference, carrierType);
    } catch (geminiError) {
      console.error("Both Claude and Gemini analyses failed:", geminiError);
      
      // As a last resort, return a structured error response that includes partial data
      const errorMessage = `AI analysis failed: ${claudeError.message}. Gemini fallback also failed: ${geminiError.message}`;
      throw new Error(errorMessage);
    }
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
    let carrierType = "verizon"; // Default to Verizon
    
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
      
      // Check if carrier type was provided
      if (jsonData.carrierType) {
        carrierType = jsonData.carrierType;
        console.log(`Carrier type provided: ${carrierType}`);
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
      
      // Check if carrier type was provided in form data
      const carrierPref = formData.get('carrierType');
      if (carrierPref && typeof carrierPref === 'string') {
        carrierType = carrierPref;
        console.log(`Carrier type provided: ${carrierType}`);
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
    
    // Analyze the bill using the best available AI
    const analysisResult = await analyzeBillText(extractedText, networkPreference, carrierType);
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
