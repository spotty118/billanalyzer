
// ApiService class to handle all API requests
class ApiService {
  private baseUrl: string;

  constructor() {
    // Use environment variable or default to localhost for development
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  }

  /**
   * Analyze bill data using the server-side analyzer with enhanced capabilities
   */
  private async analyzeWithServer(file: File): Promise<any> {
    console.log('Analyzing bill with server...');
    
    try {
      // Create FormData and append the file
      const formData = new FormData();
      formData.append('file', file);
      
      // Make the API request to the bill analysis endpoint
      const response = await fetch(`${this.baseUrl}/api/analyze-bill`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Server returned ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Server analysis response:', data);
      return data;
    } catch (error) {
      console.warn('Server analysis failed, falling back to client-side analysis:', error);
      throw error;
    }
  }

  /**
   * Perform enhanced analysis of bill data
   */
  private async enhanceBillAnalysis(billText: string): Promise<any> {
    console.log('Enhancing bill analysis with improved analyzer...');
    
    try {
      // Try to use the server endpoint if available
      if (window.location.hostname !== 'localhost') { // Skip server call in dev environment
        try {
          // Make request to the enhanced analysis endpoint
          const response = await fetch(`${this.baseUrl}/api/analyze-bill/enhanced`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ billText }),
            // Add a timeout to fail faster in case server is not responding
            signal: AbortSignal.timeout(5000) // 5 second timeout
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `Server returned ${response.status}`);
          }
          
          const enhancedData = await response.json();
          console.log('Enhanced analysis response:', enhancedData);
          return enhancedData;
        } catch (error) {
          console.info('Enhanced server analysis failed, using local file fallback:', error);
          // Continue to fallback
        }
      } else {
        console.info('Skipping server call in development environment, using local file');
      }
      
      // Fallback to local file data for development
      try {
        // In development, we'll use both the improved and line items data
        const improvedResult = await import('../../server/verizon-improved-result.json');
        const lineItemsResult = await import('../../server/verizon-line-items-result.json');
        
        // Merge the two results to get all phone lines
        const mergedResult = {
          ...improvedResult,
          devices: improvedResult.devices || [],
          phoneLines: this.mergePhoneLines(
            improvedResult.phoneLines || [], 
            lineItemsResult.enhancedBill?.phoneLines || []
          ),
          // Add line items and charges from the line items result
          lineItems: lineItemsResult.enhancedBill?.lineItems || improvedResult.lineItems || [],
          charges: lineItemsResult.enhancedBill?.charges || improvedResult.charges || []
        };

        console.log('Merged analysis data:', mergedResult);
        return mergedResult;
      } catch (fallbackError) {
        console.error('Could not load local bill analysis file:', fallbackError);
        throw new Error('Failed to perform bill analysis');
      }
    } catch (error) {
      console.error('Enhanced analysis failed completely:', error);
      throw error;
    }
  }

  /**
   * Helper method to merge phone lines from different sources
   */
  private mergePhoneLines(primaryLines: any[], secondaryLines: any[]): any[] {
    const phoneNumbers = new Set();
    const mergedLines = [...primaryLines];
    
    // Add phone numbers from primary lines to the set
    primaryLines.forEach(line => {
      if (line.phoneNumber) {
        phoneNumbers.add(line.phoneNumber);
      }
    });
    
    // Add unique lines from secondary source
    secondaryLines.forEach(line => {
      if (line.phoneNumber && !phoneNumbers.has(line.phoneNumber)) {
        phoneNumbers.add(line.phoneNumber);
        mergedLines.push(line);
      }
    });
    
    console.log(`Merged ${mergedLines.length} phone lines from ${primaryLines.length} primary and ${secondaryLines.length} secondary`);
    return mergedLines;
  }

  /**
   * Client-side bill analysis as a fallback
   */
  private async analyzeWithClient(file: File): Promise<any> {
    console.log('Analyzing bill with client-side fallback...');
    
    try {
      // Read the file as ArrayBuffer
      const arrayBuffer = await this.readFileAsArrayBuffer(file);
      
      // Dynamically import the necessary modules
      const { extractVerizonBill } = await import('@/utils/bill-analyzer/extractor');
      
      // Extract and parse the bill
      const bill = await extractVerizonBill(arrayBuffer);
      
      if (!bill) {
        throw new Error('Failed to extract bill data');
      }
      
      console.log('Client-side analysis successful:', bill);
      
      // Create a default analysis response
      return {
        totalAmount: bill.billSummary.totalDue,
        accountNumber: bill.accountInfo.accountNumber,
        billingPeriod: `${bill.accountInfo.billingPeriod.start} to ${bill.accountInfo.billingPeriod.end}`,
        charges: [],
        lineItems: [],
        subtotals: {
          lineItems: 0,
          otherCharges: 0
        },
        summary: `Bill analysis for account ${bill.accountInfo.accountNumber}`
      };
    } catch (error) {
      console.error('Client-side analysis failed:', error);
      throw error;
    }
  }

  /**
   * Helper method to read file as ArrayBuffer
   */
  private async readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Main method to analyze a bill file
   * Uses server-side analysis first, then falls back to client-side
   */
  public async analyzeBill(file: File): Promise<{ data?: any; error?: any }> {
    console.log('Starting bill analysis with improved analyzer...');
    
    try {
      let billData;
      
      // Try server-side analysis first
      try {
        billData = await this.analyzeWithServer(file);
      } catch (error) {
        // If server analysis fails, fall back to client-side
        console.warn('Server analysis failed, falling back to client-side');
        billData = await this.analyzeWithClient(file);
      }
      
      // Apply enhanced analysis
      try {
        const billJson = JSON.stringify(billData);
        const enhancedData = await this.enhanceBillAnalysis(billJson);
        
        // Use the enhanced data directly since it contains all the necessary fields
        console.log('Improved analysis successful:', enhancedData);
        return { data: enhancedData };
      } catch (error) {
        console.warn('Enhanced analysis failed, using basic data:', error);
        
        // Return the basic bill data as a fallback
        return { data: billData };
      }
    } catch (error) {
      console.error('Error analyzing bill:', error);
      return { 
        error: {
          message: error instanceof Error ? error.message : 'Failed to analyze bill',
          code: 'UNKNOWN_ERROR'
        }
      };
    }
  }
}

// Create and export a singleton instance
const apiService = new ApiService();

// Export the analyzeBill method for direct use
export const analyzeBill = (file: File) => apiService.analyzeBill(file);
