
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// Define CORS headers for our function
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

// Function to extract and parse the PDF bill
async function processBill(formData: FormData) {
  try {
    // Get the uploaded bill file from the form data
    const billFile = formData.get('bill') as File
    
    if (!billFile) {
      console.error('No bill file found in request')
      return { error: 'No bill file uploaded' }
    }
    
    console.log(`Received bill file: ${billFile.name}, size: ${billFile.size} bytes, type: ${billFile.type}`)
    
    // Basic bill data extraction
    // In a real implementation, this would involve PDF parsing logic
    const billData = {
      totalAmount: 129.99,
      accountNumber: 'VZ-123456789',
      billingPeriod: 'June 1 - June 30, 2023',
      charges: [
        {
          description: 'Monthly service charge',
          amount: 89.99,
          type: 'service'
        },
        {
          description: 'Device payment',
          amount: 30.00,
          type: 'device'
        },
        {
          description: 'Taxes and fees',
          amount: 10.00,
          type: 'tax'
        }
      ],
      lineItems: [
        {
          description: 'Unlimited Plan - 555-123-4567',
          amount: 45.00,
          type: 'service'
        },
        {
          description: 'Unlimited Plan - 555-987-6543',
          amount: 44.99,
          type: 'service'
        }
      ],
      subtotals: {
        lineItems: 89.99,
        otherCharges: 40.00
      },
      summary: 'Your bill includes charges for 2 lines with unlimited data plans, and a device payment for one line.',
      phoneLines: []
    }
    
    return billData
  } catch (error) {
    console.error('Error processing bill:', error)
    return { 
      error: error.message || 'Failed to process bill file',
      totalAmount: 0
    }
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    })
  }
  
  // Log the request method and URL
  console.log(`Request method: ${req.method}, URL: ${req.url}`)
  
  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405,
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          }
        }
      )
    }
    
    // Get form data from the request
    const formData = await req.formData()
    
    // Process the bill file
    const result = await processBill(formData)
    
    // Return the result
    return new Response(
      JSON.stringify(result),
      { 
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  } catch (error) {
    console.error('Error in edge function:', error)
    
    // Return error response with totalAmount to satisfy the API contract
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred',
        totalAmount: 0  // Include a default totalAmount to prevent frontend errors
      }),
      { 
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  }
})
