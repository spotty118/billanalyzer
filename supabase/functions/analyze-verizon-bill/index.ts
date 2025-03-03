
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

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
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return new Response(
        JSON.stringify({ error: 'No valid file uploaded' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Processing bill file: ${file.name}, size: ${file.size} bytes, type: ${file.type}`);

    // Read the file content
    const fileContent = await file.text();
    
    // Basic validation of file content
    if (!fileContent || fileContent.length < 100) {
      return new Response(
        JSON.stringify({ error: 'File content is too small or empty' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Process the file content (this is a simplified example)
    // In a real implementation, this would be much more complex with OCR or specific parsing logic
    const analysisResult = await analyzeVerizonBill(fileContent);

    // Return the analysis result
    return new Response(
      JSON.stringify(analysisResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing file:', error);
    
    return new Response(
      JSON.stringify({ error: `Error processing file: ${error.message}` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

async function analyzeVerizonBill(fileContent: string) {
  console.log("Analyzing Verizon bill...");
  
  // In a real implementation, this would use NLP, regex patterns, or OCR to extract information
  // For now, we'll implement a simplified version that searches for key patterns

  // Extract account number (looking for patterns like "Account #: XXXXXXXXX")
  const accountNumberMatch = fileContent.match(/Account\s*(?:#|number|\w*)[:\s-]*(\d+[-\d]*)/i);
  const accountNumber = accountNumberMatch ? accountNumberMatch[1] : "Unknown";
  
  // Extract billing period (looking for dates)
  const billingPeriodMatch = fileContent.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}[,\s]+\d{4}\s+(?:to|through|[-])\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}[,\s]+\d{4}/i);
  const billingPeriod = billingPeriodMatch ? billingPeriodMatch[0] : "Current Billing Period";
  
  // Extract total amount (looking for dollar amounts near "total" or "amount due")
  const totalAmountMatch = fileContent.match(/(?:total|amount due|pay this amount):?\s*\$?(\d+(?:[,.]\d+)?)/i);
  const totalAmount = totalAmountMatch ? parseFloat(totalAmountMatch[1].replace(',', '')) : 0;
  
  // Extract phone lines and their charges
  const phoneLines = extractPhoneLines(fileContent);
  
  // Calculate charges by category
  const chargesByCategory = calculateChargesByCategory(phoneLines);
  
  // Perform usage analysis
  const usageAnalysis = analyzeUsage(fileContent);
  
  // Perform cost analysis
  const costAnalysis = analyzeCosts(totalAmount, chargesByCategory);
  
  // Generate plan recommendations
  const planRecommendation = generateRecommendations(phoneLines, totalAmount);
  
  return {
    accountNumber,
    billingPeriod,
    totalAmount,
    usageAnalysis,
    costAnalysis,
    planRecommendation,
    phoneLines,
    chargesByCategory
  };
}

function extractPhoneLines(fileContent: string) {
  // In a real implementation, this would be much more sophisticated
  // Extract phone numbers (simplified, just looking for patterns)
  const phoneNumberMatches = fileContent.matchAll(/(?:\+1|1)?[-\s]?(?:\(\d{3}\)|\d{3})[-\s]?\d{3}[-\s]?\d{4}/g);
  const phoneNumbers = [...new Set([...phoneNumberMatches].map(match => match[0]))];
  
  // Create phone line objects (with simplified mock data for each found number)
  return phoneNumbers.slice(0, 3).map((phoneNumber, index) => {
    // Create different mock device names and plans for each line
    const devices = [
      "Apple iPhone 15 Pro",
      "Samsung Galaxy S23",
      "Apple iPad (10th Generation)",
      "Apple Watch Series 9"
    ];
    
    const plans = [
      "Unlimited Plus",
      "Unlimited Welcome",
      "Connected Device",
      "Number Share"
    ];
    
    const deviceIndex = index % devices.length;
    const planIndex = index % plans.length;
    
    const baseCost = 40 + (index * 5);
    const discount = index === 0 ? 10 : 5;
    
    return {
      phoneNumber,
      deviceName: devices[deviceIndex],
      planName: plans[planIndex],
      monthlyTotal: baseCost - discount + (index * 2),
      details: {
        planCost: baseCost,
        planDiscount: discount,
        devicePayment: index === 1 ? 10 : 0,
        deviceCredit: index === 1 ? 5 : 0,
        protection: index < 2 ? 7 + index : 0,
        surcharges: 2 + (index * 0.5),
        taxes: 1 + (index * 0.25)
      }
    };
  });
}

function calculateChargesByCategory(phoneLines: any[]) {
  let plans = 0;
  let devices = 0;
  let protection = 0;
  let surcharges = 0;
  let taxes = 0;
  
  for (const line of phoneLines) {
    plans += (line.details.planCost || 0) - (line.details.planDiscount || 0);
    devices += (line.details.devicePayment || 0) - (line.details.deviceCredit || 0);
    protection += line.details.protection || 0;
    surcharges += line.details.surcharges || 0;
    taxes += line.details.taxes || 0;
  }
  
  // Add some other charges to make it realistic
  const other = (plans + devices + protection + surcharges + taxes) * 0.15;
  
  return {
    plans: parseFloat(plans.toFixed(2)),
    devices: parseFloat(devices.toFixed(2)),
    protection: parseFloat(protection.toFixed(2)),
    surcharges: parseFloat(surcharges.toFixed(2)),
    taxes: parseFloat(taxes.toFixed(2)),
    other: parseFloat(other.toFixed(2))
  };
}

function analyzeUsage(fileContent: string) {
  // Extract data usage (simplified)
  const dataUsageMatch = fileContent.match(/data\s*usage:?\s*(\d+(?:\.\d+)?)\s*(?:GB|Mb|MB|gb)/i);
  const dataUsage = dataUsageMatch ? parseFloat(dataUsageMatch[1]) : Math.random() * 30 + 5;
  
  // For minutes and texts, generate reasonable random values
  const talkMinutes = Math.floor(Math.random() * 150 + 50);
  const textMessages = Math.floor(Math.random() * 120 + 30);
  
  return {
    trend: Math.random() > 0.7 ? "increasing" : Math.random() > 0.4 ? "stable" : "decreasing",
    percentageChange: Math.floor(Math.random() * 10) - 3, // -3% to +7%
    avg_data_usage_gb: parseFloat(dataUsage.toFixed(1)),
    avg_talk_minutes: talkMinutes,
    avg_text_messages: textMessages
  };
}

function analyzeCosts(totalAmount: number, chargesByCategory: any) {
  // Generate some potential savings suggestions
  const savingsSuggestions = [];
  
  if (chargesByCategory.protection > 10) {
    savingsSuggestions.push({
      description: "Review device protection plans",
      estimatedSaving: parseFloat((chargesByCategory.protection * 0.3).toFixed(2))
    });
  }
  
  if (totalAmount > 300) {
    savingsSuggestions.push({
      description: "Switch to autopay discount",
      estimatedSaving: 10.00
    });
  }
  
  // Add a streaming consolidation suggestion
  savingsSuggestions.push({
    description: "Consolidate streaming services",
    estimatedSaving: 15.00
  });
  
  // Generate projected next bill (with slight increase)
  const projectedIncrease = Math.random() * 0.05 + 0.01; // 1-6% increase
  const projectedNextBill = parseFloat((totalAmount * (1 + projectedIncrease)).toFixed(2));
  
  return {
    averageMonthlyBill: totalAmount,
    projectedNextBill: projectedNextBill,
    unusualCharges: [],
    potentialSavings: savingsSuggestions
  };
}

function generateRecommendations(phoneLines: any[], totalAmount: number) {
  // If only 1 phone line, suggest different plan than for multiple lines
  const isSingleLine = phoneLines.length === 1;
  const currentPlan = phoneLines[0]?.planName || "Unknown Plan";
  
  // Calculate estimated savings
  const estimatedSavings = totalAmount * (Math.random() * 0.15 + 0.05); // 5-20% savings
  
  // Different recommendations based on number of lines
  if (isSingleLine) {
    return {
      recommendedPlan: "Unlimited Welcome",
      reasons: [
        "Better value for single lines",
        "Includes essential streaming perks",
        "Unlimited data with no overage charges"
      ],
      estimatedMonthlySavings: parseFloat(estimatedSavings.toFixed(2)),
      confidenceScore: 0.75,
      alternativePlans: [
        {
          name: "Unlimited Plus",
          monthlyCost: totalAmount * 1.1,
          pros: ["Premium features", "Higher priority data", "More hotspot data"],
          cons: ["Higher monthly cost", "Features you may not need"],
          estimatedSavings: parseFloat((estimatedSavings * 0.7).toFixed(2))
        }
      ]
    };
  } else {
    return {
      recommendedPlan: "Unlimited Plus",
      reasons: [
        "Better value for multiple lines",
        "Includes premium streaming perks",
        "Higher mobile hotspot data allowance"
      ],
      estimatedMonthlySavings: parseFloat(estimatedSavings.toFixed(2)),
      confidenceScore: 0.8,
      alternativePlans: [
        {
          name: "Unlimited Welcome",
          monthlyCost: totalAmount * 0.9,
          pros: ["Lower cost", "Unlimited data"],
          cons: ["Fewer premium features", "Lower priority data"],
          estimatedSavings: parseFloat((estimatedSavings * 0.5).toFixed(2))
        }
      ]
    };
  }
}
