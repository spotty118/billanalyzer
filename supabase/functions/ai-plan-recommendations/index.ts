
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Get OpenRouter API key from environment variable
const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');

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
    console.log("Received AI plan recommendation request");
    
    // Parse request body
    const { billData, networkPreference } = await req.json();
    
    if (!billData) {
      throw new Error('No bill data provided in the request');
    }
    
    console.log("Processing bill data for recommendations");
    console.log("Bill total amount:", billData.totalAmount);
    console.log("Number of lines:", billData.phoneLines?.length || 0);
    console.log("Network preference:", networkPreference);
    
    // Get up-to-date carrier information via OpenRouter with Gemini
    const aiRecommendations = await getAIRecommendations(billData, networkPreference);
    
    return new Response(JSON.stringify(aiRecommendations), {
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
      service: 'ai-plan-recommendations'
    }), {
      status: 500,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json'
      }
    });
  }
});

async function getAIRecommendations(billData: any, networkPreference: string | null) {
  if (!OPENROUTER_API_KEY) {
    console.error("Missing OpenRouter API key");
    throw new Error("OpenRouter API key not configured");
  }
  
  try {
    console.log("Sending bill data to OpenRouter API for Gemini recommendations...");
    
    const systemPrompt = `You are an expert in cellphone plans and wireless carriers. You provide detailed, accurate, and up-to-date recommendations based on customer's current wireless bill and preferences.

Your task is to analyze a customer's bill data and recommend the best carriers and plans for their needs, focusing on value and features.

IMPORTANT NOTES ABOUT CURRENT MARKET CONDITIONS (OCTOBER 2024):
- US Mobile offers Warp 5G (on Verizon), Lightspeed 5G (on T-Mobile), and DarkStar 5G (on AT&T)
- US Mobile has flat pricing with NO multi-line discounts: $44/month for Premium, $25/month for Starter
- Visible Basic costs $25/mo and Visible+ costs $45/mo with NO multi-line discounts
- Verizon's latest plans are Unlimited Welcome, Unlimited Plus, and Unlimited Ultimate
- T-Mobile offers Go5G, Go5G Plus, and Go5G Next plans
- AT&T offers Value Plus, Unlimited Starter, Unlimited Extra, and Unlimited Premium

IMPORTANT: Your response must be a valid JSON object that can be parsed with JSON.parse(). Structure it like this:
{
  "recommendations": [
    {
      "carrier": "US Mobile Warp 5G",
      "planName": "Premium Unlimited",
      "network": "verizon",
      "monthlyPrice": 44,
      "features": ["Unlimited Premium Data", "100GB Hotspot", "International Data"],
      "reasons": ["Best value on Verizon's network", "Lower price than current plan"],
      "pros": ["No contracts", "Lower monthly cost", "All premium features included"],
      "cons": ["May require new SIM card", "Different customer service experience"]
    }
  ],
  "marketInsights": {
    "currentPromos": ["US Mobile offering $10 off for 3 months", "Verizon offering BOGO iPhone deals"],
    "trendingPlans": ["US Mobile Premium Unlimited", "Visible+"],
    "networkPerformance": {
      "verizon": "Strong coverage but congested in urban areas",
      "tmobile": "Fast 5G speeds, improving rural coverage",
      "att": "Consistent performance, strong rural coverage"
    }
  },
  "personalizedAdvice": "Based on your usage pattern with multiple lines and high data usage, you would benefit most from a premium unlimited plan with proper hotspot allocation."
}

Include Visible and Visible+ in your recommendations if they would be a good fit for the customer. Remember that:
- US Mobile has NO multi-line discounts - price is the same for each line
- Visible has NO multi-line discounts - price is the same for each line
- Visible Basic is $25/mo for unlimited data but deprioritized
- Visible+ is $45/mo with 50GB of premium data

Base your recommendations on:
1. The number of lines they have
2. Their current monthly cost
3. Their network preference (if provided)
4. Special features they might need (hotspot, international)
5. Latest promotions and deals from carriers

Recommend AT LEAST 2 different carriers with appropriate plans, prioritizing their preferred network if specified.

YOU MUST ensure your response contains ONLY valid JSON that can be parsed with JSON.parse(). Do not include any explanatory text, markdown formatting, or code blocks before or after the JSON.`;

    // Prepare the bill summary to send to OpenRouter
    const numberOfLines = billData.phoneLines?.length || 1;
    const currentMonthlyTotal = billData.totalAmount || 0;
    const averagePerLine = currentMonthlyTotal / numberOfLines;
    
    // Create a simplified summary of the bill data
    const billSummary = {
      totalAmount: currentMonthlyTotal,
      numberOfLines,
      averagePerLine,
      networkPreference,
      lineDetails: billData.phoneLines?.map((line: any) => ({
        planName: line.planName,
        deviceName: line.deviceName,
        monthlyTotal: line.monthlyTotal,
        planCost: line.details?.planCost || 0,
        devicePayment: line.details?.devicePayment || 0,
        protection: line.details?.protection || 0
      })) || []
    };
    
    // Set up the OpenRouter API request using Gemini
    const openRouterRequest = {
      model: "google/gemini-2.0-flash-001",
      max_tokens: 4000,
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: "Please analyze this customer's bill data and provide plan recommendations:" + 
                  `\n\n${JSON.stringify(billSummary, null, 2)}`
        }
      ]
    };
    
    console.log("Sending recommendation request to OpenRouter API with Gemini model...");
    
    // Send request to OpenRouter API
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://mgzfiouamidaqctnqnre.supabase.co",
        "X-Title": "Mobile Plan Recommendations"
      },
      body: JSON.stringify(openRouterRequest)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter API error response:", errorText);
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
    }
    
    // Parse the response from OpenRouter
    const openRouterResponse = await response.json();
    console.log("OpenRouter Gemini recommendations response received successfully");
    
    // Extract the JSON content from Gemini's response
    const recommendationsText = openRouterResponse.choices[0].message.content;
    console.log("Recommendations text length:", recommendationsText.length);
    console.log("Recommendations sample:", recommendationsText.substring(0, 500));
    
    try {
      // Try to parse the response as JSON
      const jsonData = JSON.parse(recommendationsText);
      
      // Add metadata about the recommendations
      const enrichedData = {
        ...jsonData,
        meta: {
          generatedAt: new Date().toISOString(),
          source: "gemini-2.0-flash-001",
          billDataTimestamp: billData.extractionDate || new Date().toISOString()
        }
      };
      
      console.log("Successfully parsed recommendations from Gemini's response");
      return enrichedData;
    } catch (jsonError) {
      console.error("Error parsing JSON from Gemini response:", jsonError);
      console.error("Gemini response content:", recommendationsText.substring(0, 500) + "...");
      throw new Error("Failed to parse JSON from Gemini's response");
    }
  } catch (error) {
    console.error("Error using OpenRouter/Gemini for recommendations:", error);
    throw new Error(`AI recommendations failed: ${error.message}`);
  }
}
