
import axios, { 
  AxiosError, 
  AxiosInstance
} from 'axios';
import { ApiResponse, ApiError } from '@/types';

interface ErrorResponse {
  message?: string;
}

interface BillAnalysis {
  totalAmount: number | null;
  accountNumber: string | null;
  billingPeriod: string | null;
  charges: Array<{
    description: string;
    amount: number;
    type: string;
  }>;
  lineItems: Array<{
    description: string;
    amount: number;
    type: string;
  }>;
  subtotals: {
    lineItems: number;
    otherCharges: number;
  };
  summary: string;
}

class ApiService {
  private static instance: ApiService;
  private api: AxiosInstance;

  private constructor() {
    this.api = axios.create({
      baseURL: '/api',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      validateStatus: (status) => {
        return status >= 200 && status < 300;
      }
    });
  }

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  private handleError(error: AxiosError<ErrorResponse>): ApiError {
    console.error('API Error:', error.response?.data || error.message);
    return {
      message: error.response?.data?.message || error.message || 'An error occurred',
      code: 'API_ERROR',
    };
  }

  private validateBillAnalysis(data: any): data is BillAnalysis {
    if (!data || typeof data !== 'object') return false;
    
    // Check required number fields
    if (typeof data.totalAmount !== 'number' && data.totalAmount !== null) return false;
    if (!data.subtotals || typeof data.subtotals.lineItems !== 'number' || typeof data.subtotals.otherCharges !== 'number') return false;
    
    // Check array fields
    if (!Array.isArray(data.charges) || !Array.isArray(data.lineItems)) return false;
    
    // Check string fields
    if (typeof data.accountNumber !== 'string' && data.accountNumber !== null) return false;
    if (typeof data.billingPeriod !== 'string' && data.billingPeriod !== null) return false;
    if (typeof data.summary !== 'string') return false;

    return true;
  }

  private sanitizeFile(file: File): boolean {
    const allowedTypes = ['application/pdf', 'text/plain', 'image/jpeg', 'image/png'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type');
    }

    if (file.size > maxSize) {
      throw new Error('File size too large');
    }

    return true;
  }

  public async analyzeBill(file: File): Promise<ApiResponse<BillAnalysis>> {
    try {
      this.sanitizeFile(file);

      const formData = new FormData();
      formData.append('file', file);

      console.log('Sending request to analyze bill...');

      const response = await this.api.post<any>(
        '/analyze-bill',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Accept': 'application/json'
          }
        }
      );

      const responseData = response.data;

      if (!responseData) {
        throw new Error('No response data received');
      }

      if (!this.validateBillAnalysis(responseData)) {
        console.error('Invalid response data structure:', responseData);
        throw new Error('Invalid response data structure');
      }

      return { data: responseData };
    } catch (error) {
      console.error('Error analyzing bill:', error);
      
      if (error instanceof AxiosError) {
        return { error: this.handleError(error) };
      }
      
      return {
        error: {
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
          code: 'UNKNOWN_ERROR',
        },
      };
    }
  }
}

export const apiService = ApiService.getInstance();

export const analyzeBill = (file: File): Promise<ApiResponse<BillAnalysis>> => {
  return apiService.analyzeBill(file);
};
