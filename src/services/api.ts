
import axios, { 
  AxiosError, 
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosHeaders
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
        'Accept': 'application/json'
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

      const response = await this.api.post<BillAnalysis>(
        '/analyze-bill',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (!response.data) {
        throw new Error('No response data received');
      }

      return { data: response.data };
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
