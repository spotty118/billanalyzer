
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

    // Call the Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('analyze-bill', {
      body: formData,
    })

    if (error) {
      console.error('Error analyzing bill:', error)
      return { error }
    }

    return { data }
  } catch (error) {
    console.error('Error analyzing bill:', error)
    return { error }
  }
}
