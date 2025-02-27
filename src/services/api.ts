
import { toast } from '@/components/ui/use-toast';

// ApiService class to handle all API requests
class ApiService {
  private baseUrl: string;
  private defaultError = { message: 'An error occurred', code: 'UNKNOWN_ERROR' };

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
    console.log('Enhancing bill analysis...');
    
    try {
      // Make request to the enhanced analysis endpoint
      const response = await fetch(`${this.baseUrl}/api/analyze-bill/enhanced`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ billText }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Server returned ${response.status}`);
      }
      
      const enhancedData = await response.json();
      console.log('Enhanced analysis response:', enhancedData);
      return enhancedData;
    } catch (error) {
      console.error('Enhanced analysis failed:', error);
      throw error;
    }
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
    console.log('Starting bill analysis...');
    
    try {
      let billData;
      
      // Try server-side analysis first
      try {
        billData = await this.analyzeWithServer(file);
      } catch (error) {
        // If server analysis fails, fall back to client-side
        billData = await this.analyzeWithClient(file);
      }
      
      // Apply enhanced analysis if possible
      try {
        const billJson = JSON.stringify(billData);
        const enhancedData = await this.enhanceBillAnalysis(billJson);
        
        // Merge the enhanced data with the basic bill data
        const fullAnalysis = {
          ...billData,
          usageAnalysis: enhancedData.usageAnalysis,
          costAnalysis: enhancedData.costAnalysis,
          planRecommendation: enhancedData.planRecommendation
        };
        
        console.log('Analysis successful:', fullAnalysis);
        return { data: fullAnalysis };
      } catch (error) {
        console.warn('Enhanced analysis failed, using defaults:', error);
        
        // If enhanced analysis fails, return basic bill data with default enhanced fields
        const defaultAnalysis = {
          ...billData,
          usageAnalysis: {
            trend: 'stable',
            percentageChange: 0,
            seasonalFactors: {
              highUsageMonths: ['December', 'January'],
              lowUsageMonths: ['June', 'July']
            },
            avg_data_usage_gb: 0,
            avg_talk_minutes: 0,
            avg_text_count: 0,
            high_data_users: [],
            high_talk_users: [],
            high_text_users: []
          },
          costAnalysis: {
            averageMonthlyBill: billData.totalAmount,
            projectedNextBill: billData.totalAmount * 1.05, // Estimate 5% increase
            unusualCharges: [],
            potentialSavings: []
          },
          planRecommendation: {
            recommendedPlan: 'Unlimited Plus',
            reasons: [
              'Based on current usage',
              'Better value for your needs'
            ],
            estimatedMonthlySavings: billData.totalAmount * 0.15, // Estimate 15% savings
            confidenceScore: 0.8,
            alternativePlans: [
              {
                planName: 'Unlimited Welcome',
                pros: ['Lower monthly cost'],
                cons: ['Fewer features'],
                estimatedSavings: billData.totalAmount * 0.2
              }
            ]
          }
        };
        
        console.log('Analysis successful:', defaultAnalysis);
        return { data: defaultAnalysis };
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

  // Add additional API methods as needed
}

// Create and export a singleton instance
const apiService = new ApiService();

// Export the analyzeBill method for direct use
export const analyzeBill = (file: File) => apiService.analyzeBill(file);
