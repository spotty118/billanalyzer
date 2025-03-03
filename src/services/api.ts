
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

    // Check if the data has totalAmount (both undefined and 0 are valid possibilities)
    if (data.totalAmount === undefined) {
      console.error('Invalid response format - missing totalAmount field', data)
      return { error: { message: 'Invalid response format from bill analysis service' } }
    }

    console.log('Bill analysis successful, returning data')
    return { data }
  } catch (error) {
    console.error('Error analyzing bill:', error)
    return { error: { message: 'An unexpected error occurred during bill analysis' } }
  }
}
