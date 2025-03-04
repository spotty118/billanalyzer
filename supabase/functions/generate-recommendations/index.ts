
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
    console.log("Received recommendation request");
    
    // Parse request body
    const billData = await req.json();
    
    if (!billData) {
      throw new Error('No bill data provided in the request');
    }
    
    console.log("Processing bill data for recommendations");
    console.log("Bill total amount:", billData.totalAmount);
    console.log("Number of lines:", billData.phoneLines?.length || 0);
    console.log("Network preference:", billData.networkPreference);
    
    // For demo purposes, we'll generate some sample recommendations
    // In a real implementation, this would call an AI service with the bill data
    const sampleRecommendations = generateSampleRecommendations(billData);
    
    return new Response(JSON.stringify(sampleRecommendations), {
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
      service: 'generate-recommendations'
    }), {
      status: 500,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json'
      }
    });
  }
});

function generateSampleRecommendations(billData: any) {
  const totalAmount = billData.totalAmount || 0;
  const numberOfLines = billData.phoneLines?.length || 1;
  const networkPreference = billData.networkPreference || null;
  
  // Generate carriers based on preference (if any)
  let carriers = ['verizon', 'tmobile', 'att', 'usmobile', 'visible'];
  
  // Filter carriers based on network preference if specified
  if (networkPreference) {
    // Ensure the preferred network is first in the list
    carriers = carriers.filter(c => c !== networkPreference);
    carriers.unshift(networkPreference);
  }
  
  // Generate recommendations
  const recommendations = carriers.slice(0, 3).map((carrier, index) => {
    // Calculate random savings (in a real app, this would be based on actual calculations)
    const savingsPercentage = 10 + Math.floor(Math.random() * 30);
    const monthlySavings = (totalAmount * savingsPercentage / 100);
    const annualSavings = monthlySavings * 12;
    
    return {
      carrier,
      planName: getPlanNameForCarrier(carrier),
      monthlySavings,
      annualSavings,
      price: totalAmount - monthlySavings
    };
  }).sort((a, b) => b.monthlySavings - a.monthlySavings);
  
  // Generate plan details for the top recommendation
  const planDetails = {
    title: `${recommendations[0].carrier.charAt(0).toUpperCase() + recommendations[0].carrier.slice(1)} ${recommendations[0].planName}`,
    description: `A premium plan designed for multi-line users with significant data needs and premium features.`,
    features: [
      { name: 'Unlimited Premium Data', included: true },
      { name: 'Hotspot 30GB+', included: recommendations[0].carrier !== 'visible' },
      { name: 'HD Streaming', included: recommendations[0].carrier !== 'visible' },
      { name: 'International Features', included: recommendations[0].carrier === 'tmobile' || recommendations[0].carrier === 'usmobile' },
      { name: 'Entertainment Perks', included: recommendations[0].carrier === 'verizon' || recommendations[0].carrier === 'tmobile' },
      { name: 'Multi-line Discounts', included: recommendations[0].carrier !== 'usmobile' && recommendations[0].carrier !== 'visible' }
    ]
  };
  
  return {
    recommendations,
    planDetails
  };
}

function getPlanNameForCarrier(carrier: string): string {
  switch (carrier) {
    case 'verizon':
      return 'Unlimited Plus';
    case 'tmobile':
      return 'Go5G Plus';
    case 'att':
      return 'Unlimited Premium';
    case 'usmobile':
      return 'Warp 5G Premium';
    case 'visible':
      return 'Visible+';
    default:
      return 'Premium Plan';
  }
}
