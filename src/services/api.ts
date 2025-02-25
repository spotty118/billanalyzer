import axios, { 
  AxiosError, 
  AxiosInstance, 
  AxiosResponse, 
  InternalAxiosRequestConfig,
  AxiosHeaders
} from 'axios';
import { ApiResponse, ApiError } from '@/types';

interface ErrorResponse {
  message?: string;
}

interface RequestConfig extends Omit<InternalAxiosRequestConfig, 'headers'> {
  retry?: boolean;
  retryCount?: number;
  retryDelay?: number;
  cache?: boolean;
  cacheKey?: string;
  cacheDuration?: number;
  headers?: AxiosHeaders;
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

interface Cache {
  [key: string]: {
    data: unknown;
    timestamp: number;
  };
}

class ApiService {
  private static instance: ApiService;
  private api: AxiosInstance;
  private cache: Cache = {};
  private readonly CACHE_TTL = 3600000; // 1 hour
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000;
  private readonly SERVER_STARTUP_DELAY = 500;
  private readonly SERVER_STARTUP_MAX_RETRIES = 5;

  private constructor() {
    this.api = axios.create({
      baseURL: '/api',
      timeout: 10000,
      headers: new AxiosHeaders({
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      }),
      withCredentials: true,
    });

    this.setupInterceptors();
  }

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  private setupInterceptors(): void {
    this.api.interceptors.request.use(
      (config: RequestConfig) => {
        if (config.cache && config.cacheKey) {
          const cachedData = this.getCachedData(config.cacheKey);
          if (cachedData) {
            return Promise.reject({ cachedData });
          }
        }
        return config as InternalAxiosRequestConfig;
      },
      (error: Error) => Promise.reject(error)
    );

    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        const config = response.config as RequestConfig;
        if (config.cache && config.cacheKey) {
          this.setCachedData(config.cacheKey, response.data);
        }
        return response;
      },
      async (error: AxiosError | { cachedData: unknown }) => {
        if ('cachedData' in error) {
          return Promise.resolve({ data: error.cachedData });
        }

        const config = (error as AxiosError).config as RequestConfig;
        const currentRetryCount = config?.retryCount || 0;
        
        if (error.response?.status === 503) {
          if (currentRetryCount < this.SERVER_STARTUP_MAX_RETRIES) {
            config.retryCount = currentRetryCount + 1;
            const delay = this.SERVER_STARTUP_DELAY * Math.pow(2, currentRetryCount);
            console.log(`Server starting up, waiting ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return this.api.request(config);
          }
        }
        
        if (config?.retry && currentRetryCount < this.MAX_RETRIES) {
          config.retryCount = currentRetryCount + 1;
          const delay = config.retryDelay || this.RETRY_DELAY * Math.pow(2, currentRetryCount);
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.api.request(config);
        }

        return Promise.reject(error);
      }
    );
  }

  private getCachedData(key: string): unknown | null {
    const cached = this.cache[key];
    if (!cached || Date.now() - cached.timestamp > this.CACHE_TTL) {
      return null;
    }
    return cached.data;
  }

  private setCachedData(key: string, data: unknown): void {
    this.cache[key] = {
      data,
      timestamp: Date.now(),
    };
  }

  private handleError(error: AxiosError<ErrorResponse>): ApiError {
    if (error.response) {
      return {
        message: error.response.data.message || 'An error occurred',
        status: error.response.status,
        code: error.code || 'API_ERROR',
      };
    }
    if (error.request) {
      return {
        message: 'No response received from server. Please ensure the server is running on port 3001.',
        code: 'NETWORK_ERROR',
      };
    }
    return {
      message: error.message || 'Unknown error occurred',
      code: 'UNKNOWN_ERROR',
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
      
      const headers = new AxiosHeaders();
      headers.delete('Content-Type');

      const config: RequestConfig = {
        headers,
        retry: true,
        retryDelay: this.RETRY_DELAY,
      };

      const response = await this.api.post<BillAnalysis>(
        '/analyze-bill',
        formData,
        config
      );

      console.log('Raw API response:', response);

      if (!response.data || typeof response.data !== 'object') {
        console.error('Invalid response format:', response.data);
        throw new Error('Invalid response format from server');
      }

      const analyzedData: BillAnalysis = {
        totalAmount: response.data.totalAmount ?? 0,
        accountNumber: response.data.accountNumber || null,
        billingPeriod: response.data.billingPeriod || null,
        charges: Array.isArray(response.data.charges) ? response.data.charges : [],
        lineItems: Array.isArray(response.data.lineItems) ? response.data.lineItems : [],
        subtotals: {
          lineItems: response.data.subtotals?.lineItems || 0,
          otherCharges: response.data.subtotals?.otherCharges || 0,
        },
        summary: response.data.summary || ''
      };

      return { data: analyzedData };
    } catch (error) {
      console.error('API Error:', error);
      
      if (error instanceof AxiosError) {
        console.error('Response data:', error.response?.data);
        console.error('Response status:', error.response?.status);
        return { error: this.handleError(error) };
      }
      
      if (error instanceof Error) {
        return {
          error: {
            message: error.message,
            code: 'VALIDATION_ERROR',
          },
        };
      }
      
      return {
        error: {
          message: 'An unexpected error occurred',
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
