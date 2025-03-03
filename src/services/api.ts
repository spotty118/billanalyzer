import { ApiResponse } from '../types';

class ApiService {
  private apiKey: string | undefined;
  private apiUrl: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    this.apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  }

  async getPlans(): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${this.apiUrl}/api/plans`);
      if (!response.ok) {
        const errorData = await response.json();
        return { error: { message: errorData.message || 'Failed to fetch plans', status: response.status } };
      }
      const data = await response.json();
      return { data };
    } catch (error: any) {
      return { error: { message: error.message || 'Failed to fetch plans' } };
    }
  }

  async getPromotions(): Promise<ApiResponse<any>> {
     try {
      const response = await fetch(`${this.apiUrl}/api/promotions`);
      if (!response.ok) {
        const errorData = await response.json();
        return { error: { message: errorData.message || 'Failed to fetch promotions', status: response.status } };
      }
      const data = await response.json();
      return { data };
    } catch (error: any) {
      return { error: { message: error.message || 'Failed to fetch promotions' } };
    }
  }

  async contactUs(payload: any): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${this.apiUrl}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { error: { message: errorData.message || 'Failed to submit form', status: response.status } };
      }

      const data = await response.json();
      return { data };
    } catch (error: any) {
      return { error: { message: error.message || 'Failed to submit form' } };
    }
  }
  
  analyzeVerizonBill = async (fileData: string, fileName: string): Promise<any> => {
    try {
      // Production: Use the server API
      if (import.meta.env.PROD) {
        const response = await fetch(`${this.apiUrl}/api/analyze-verizon-bill`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey || '',
          },
          body: JSON.stringify({ fileData, fileName }),
        });

        if (!response.ok) {
          const error = await response.json();
          console.error('Server analysis failed:', error);
          throw new Error(error.message || 'Bill analysis failed');
        }

        const result = await response.json();
        console.log('Server analysis data:', result);
        return result;
      } else {
        // Development: Skip server call and use local files
        console.info('Skipping server call in development environment, using local file');
      }
      
      // Fallback to local file data for development
      try {
        // In development, we'll use both the improved and line items data
        const improvedResult = await import('../../server/verizon-improved-result.json');
        const lineItemsResult = await import('../../server/verizon-analyzer-result.json');
        
        // Merge the two results to get all phone lines
        const mergedResult = {
          ...improvedResult.default,
          devices: improvedResult.default.devices || [],
          phoneLines: this.mergePhoneLines(
            improvedResult.default.phoneLines || [], 
            lineItemsResult.default.enhancedBill?.phoneLines || []
          ),
          // Add line items and charges from the line items result
          lineItems: lineItemsResult.default.enhancedBill?.lineItems || [],
          charges: lineItemsResult.default.enhancedBill?.charges || []
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

  async analyzeTmobileBill(fileData: string, fileName: string): Promise<any> {
    try {
      const response = await fetch(`${this.apiUrl}/api/analyze-tmobile-bill`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey || '',
        },
        body: JSON.stringify({ fileData, fileName }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Server analysis failed:', error);
        throw new Error(error.message || 'Bill analysis failed');
      }

      const result = await response.json();
      console.log('Server analysis data:', result);
      return result;
    } catch (error) {
      console.error('T-Mobile analysis failed completely:', error);
      throw error;
    }
  }
}

export default new ApiService();
