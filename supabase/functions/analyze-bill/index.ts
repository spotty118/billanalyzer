
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

// Create a single supabase client for interacting with your database
const supabase = createClient(supabaseUrl, supabaseKey)

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        ...corsHeaders,
      },
    })
  }

  try {
    // Make sure this is a POST request with a file
    if (req.method !== 'POST') {
      throw new Error('Method not allowed. Please use POST.')
    }

    // Get multipart form data
    const formData = await req.formData()
    const billFile = formData.get('bill')

    if (!billFile || !(billFile instanceof File)) {
      throw new Error('No bill file provided or invalid file format')
    }

    // Read file content
    const fileContent = await billFile.text()
    console.log(`Received bill file: ${billFile.name}, size: ${fileContent.length} bytes`)

    // Process the bill data
    // This is a placeholder for actual bill analysis logic
    // In a real implementation, you'd likely use a more sophisticated parser or AI service
    const billData = analyzeBill(fileContent, billFile.name)

    // Store the analysis in the database if needed
    /* 
    await supabase
      .from('bill_analyses')
      .insert({
        bill_content: fileContent,
        analysis_result: billData,
        file_name: billFile.name
      })
    */

    // Return the analysis
    return new Response(JSON.stringify({
      data: billData,
      success: true,
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error('Error processing bill:', error.message)
    return new Response(JSON.stringify({
      error: error.message,
      success: false,
    }), {
      status: 400,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    })
  }
})

/**
 * Simple bill analyzer function
 * This is a placeholder implementation. In a real app, you'd have a more sophisticated parser.
 */
function analyzeBill(fileContent: string, fileName: string) {
  console.log(`Analyzing bill: ${fileName}`)
  
  // Very basic detection of bill properties
  const lines = fileContent.split('\n')
  
  // Try to extract account number (looking for patterns like "Account: 123456789")
  const accountNumberMatch = fileContent.match(/account(?:\s|#|:)+([a-z0-9-]{5,12})/i)
  const accountNumber = accountNumberMatch ? accountNumberMatch[1] : 'XXX-XXX-XXXX'
  
  // Try to extract billing period (looking for date patterns)
  const billingPeriodMatch = fileContent.match(/(?:bill|billing|statement)(?:\s|period|date|:)+(\w+\s+\d{1,2}(?:st|nd|rd|th)?(?:\s*[-,]\s*\w+\s+\d{1,2}(?:st|nd|rd|th)?)?(?:\s*,?\s*\d{4})?)/i)
  const billingPeriod = billingPeriodMatch ? billingPeriodMatch[1] : 'Current Billing Period'
  
  // Try to extract total amount due
  const totalMatch = fileContent.match(/(?:total|amount|due|balance)(?:\s|:)+\$?(\d{1,3}(?:,\d{3})*\.\d{2})/i)
  const totalAmount = totalMatch ? parseFloat(totalMatch[1].replace(/,/g, '')) : 150.00
  
  // Extract phone lines (very basic approach)
  const phoneLineMatches = [...fileContent.matchAll(/(\d{3}[-\s]?\d{3}[-\s]?\d{4})/g)]
  
  // Create phone lines with mock data
  const phoneLines = phoneLineMatches.map((match, index) => {
    const phoneNumber = match[1]
    const deviceTypes = ['iPhone 15', 'iPhone 14', 'Samsung Galaxy S23', 'Google Pixel 7', 'iPad Pro']
    const planTypes = ['Unlimited Plus', '5G Start', '5G Get More', '5G Do More', '5G Play More']
    
    // Generate random but realistic costs
    const planCost = 50 + Math.floor(Math.random() * 30)
    const devicePayment = Math.random() > 0.3 ? 20 + Math.floor(Math.random() * 20) : 0
    const protection = Math.random() > 0.5 ? 7 + Math.floor(Math.random() * 8) : 0
    const taxes = 5 + Math.floor(Math.random() * 10)
    
    return {
      phoneNumber,
      deviceName: deviceTypes[Math.floor(Math.random() * deviceTypes.length)],
      planName: planTypes[Math.floor(Math.random() * planTypes.length)],
      monthlyTotal: planCost + devicePayment + protection + taxes,
      details: {
        planCost,
        planDiscount: Math.random() > 0.7 ? Math.floor(Math.random() * 10) : 0,
        devicePayment,
        deviceCredit: Math.random() > 0.8 ? Math.floor(Math.random() * 5) : 0,
        protection,
        surcharges: 3 + Math.floor(Math.random() * 5),
        taxes: 2 + Math.floor(Math.random() * 3),
        perks: Math.random() > 0.6 ? 5 + Math.floor(Math.random() * 5) : 0,
        perksDiscount: Math.random() > 0.9 ? Math.floor(Math.random() * 3) : 0
      }
    }
  })
  
  // If no phone lines were found, create at least one mock phone line
  if (phoneLines.length === 0) {
    phoneLines.push({
      phoneNumber: "555-123-4567",
      deviceName: "iPhone 15",
      planName: "Unlimited Plus",
      monthlyTotal: 95.99,
      details: {
        planCost: 60,
        planDiscount: 0,
        devicePayment: 25,
        deviceCredit: 0,
        protection: 7,
        surcharges: 5,
        taxes: 3.99,
        perks: 0,
        perksDiscount: 0
      }
    })
  }
  
  // Generate charges by category
  const chargesByCategory = {
    plans: 0,
    devices: 0,
    protection: 0,
    surcharges: 0,
    taxes: 0,
    other: 0
  }
  
  // Sum up charges by category
  phoneLines.forEach(line => {
    if (line.details) {
      chargesByCategory.plans += (line.details.planCost || 0) - (line.details.planDiscount || 0)
      chargesByCategory.devices += (line.details.devicePayment || 0) - (line.details.deviceCredit || 0)
      chargesByCategory.protection += line.details.protection || 0
      chargesByCategory.surcharges += line.details.surcharges || 0
      chargesByCategory.taxes += line.details.taxes || 0
      chargesByCategory.other += (line.details.perks || 0) - (line.details.perksDiscount || 0)
    }
  })
  
  // Generate usage analysis
  const usageAnalysis = {
    avg_data_usage_gb: 5 + Math.floor(Math.random() * 8),
    avg_talk_minutes: 100 + Math.floor(Math.random() * 300),
    avg_text_messages: 200 + Math.floor(Math.random() * 500),
    trend: ['stable', 'increasing', 'decreasing'][Math.floor(Math.random() * 3)]
  }
  
  // Generate potential savings
  const potentialSavings = []
  if (Math.random() > 0.3) {
    potentialSavings.push({
      description: "Switch to a more appropriate data plan",
      estimatedSaving: 10 + Math.floor(Math.random() * 20),
      confidence: 0.7 + Math.random() * 0.2
    })
  }
  if (Math.random() > 0.4) {
    potentialSavings.push({
      description: "Remove underutilized premium services",
      estimatedSaving: 5 + Math.floor(Math.random() * 10),
      confidence: 0.6 + Math.random() * 0.3
    })
  }
  if (Math.random() > 0.5) {
    potentialSavings.push({
      description: "Apply available device promotions",
      estimatedSaving: 15 + Math.floor(Math.random() * 25),
      confidence: 0.5 + Math.random() * 0.4
    })
  }
  
  // Generate cost analysis
  const costAnalysis = {
    averageMonthlyBill: totalAmount,
    projectedNextBill: totalAmount * (0.95 + Math.random() * 0.1),
    potentialSavings
  }
  
  // Generate plan recommendation
  const planRecommendation = {
    recommendedPlan: ['Unlimited Plus', '5G Start Unlimited', '5G Do More Unlimited'][Math.floor(Math.random() * 3)],
    estimatedMonthlySavings: 15 + Math.floor(Math.random() * 35),
    confidenceScore: 0.7 + Math.random() * 0.25,
    reasons: [
      'Better value for your typical usage',
      'Includes premium features like HD streaming and mobile hotspot',
      'Eligible for device upgrade promotions',
      'Simplified billing with no overage charges'
    ],
    alternativePlans: [
      {
        name: '5G Start Unlimited',
        monthlyCost: 120 + Math.floor(Math.random() * 20),
        pros: ['Lower monthly cost', 'Unlimited data with no overage charges', 'Includes 5G access'],
        cons: ['Slower speeds during network congestion', 'Limited mobile hotspot', 'SD streaming only']
      },
      {
        name: '5G Do More Unlimited',
        monthlyCost: 150 + Math.floor(Math.random() * 30),
        pros: ['600GB cloud storage', '50GB premium network access', 'Unlimited mobile hotspot (25GB at 5G speeds)'],
        cons: ['Higher monthly cost', 'May be more features than needed based on your usage']
      }
    ]
  }
  
  // Return complete bill data
  return {
    accountNumber,
    billingPeriod,
    totalAmount,
    phoneLines,
    chargesByCategory,
    usageAnalysis,
    costAnalysis,
    planRecommendation
  }
}
