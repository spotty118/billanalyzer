
import { supabase } from '@/integrations/supabase/client'

/**
 * Analyze a Verizon bill file
 * @param file Bill file (PDF, CSV, or text)
 * @returns Analysis result
 */
export const analyzeBill = async (file: File) => {
  try {
    // Create form data to send the file
    const formData = new FormData()
    formData.append('bill', file)

    console.log('Sending bill for analysis, file size:', file.size)

    // Call the Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('analyze-bill', {
      body: formData,
    })

    if (error) {
      console.error('Error from Supabase function:', error)
      return { error: { message: error.message || 'Failed to analyze bill' } }
    }

    // Validate the response data
    if (!data) {
      console.error('No data returned from bill analysis')
      return { error: { message: 'No data returned from bill analysis' } }
    }

    // Log the raw response to help with debugging
    console.log('Raw response from bill analysis:', data)

    // Check if the data has the expected structure
    // We need at minimum the totalAmount field
    if (data.totalAmount === undefined) {
      console.error('Invalid response format - missing totalAmount field', data)
      
      // If we have some valid parts of the response, try to return what we can
      if (typeof data === 'object' && data !== null) {
        // Try to find totalAmount in a nested object
        let extractedTotalAmount = undefined
        
        // Check common nested paths where totalAmount might be
        if (data.data && data.data.totalAmount !== undefined) {
          extractedTotalAmount = data.data.totalAmount
        } else if (data.billSummary && data.billSummary.totalAmount !== undefined) {
          extractedTotalAmount = data.billSummary.totalAmount
        } else if (data.enhancedBill && data.enhancedBill.totalAmount !== undefined) {
          extractedTotalAmount = data.enhancedBill.totalAmount
        }
        
        if (extractedTotalAmount !== undefined) {
          console.log('Found totalAmount in nested structure:', extractedTotalAmount)
          // Construct a minimal valid response
          return { 
            data: {
              totalAmount: extractedTotalAmount,
              accountNumber: data.accountNumber || 'Unknown',
              billingPeriod: data.billingPeriod || 'Unknown',
              charges: data.charges || [],
              lineItems: data.lineItems || [],
              subtotals: data.subtotals || { lineItems: 0, otherCharges: 0 },
              summary: data.summary || '',
              phoneLines: []
            } 
          }
        }
      }
      
      return { error: { message: 'Invalid response format from bill analysis service' } }
    }

    console.log('Bill analysis successful, returning data')
    return { data }
  } catch (error) {
    console.error('Error analyzing bill:', error)
    return { error: { message: 'An unexpected error occurred during bill analysis' } }
  }
}
