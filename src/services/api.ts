import axios, { 
  AxiosError, 
  AxiosInstance, 
  AxiosRequestConfig, 
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
        
        if (config?.retry && currentRetryCount < this.MAX_RETRIES) {
          config.retryCount = currentRetryCount + 1;
          
          await new Promise(resolve => 
            setTimeout(resolve, config.retryDelay || this.RETRY_DELAY * config.retryCount!)
          );
          
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
        message: 'No response received from server',
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

  public async analyzeBill(file: File): Promise<ApiResponse<{ analysis: string }>> {
    try {
      this.sanitizeFile(file);

      const formData = new FormData();
      formData.append('file', file);

      const headers = new AxiosHeaders();
      headers.set('Content-Type', 'multipart/form-data');

      const config: RequestConfig = {
        headers,
        retry: true,
        retryDelay: this.RETRY_DELAY,
      };

      const response = await this.api.post<{ analysis: string }>(
        '/analyze-bill',
        formData,
        config
      );

      return { data: response.data };
    } catch (error) {
      if (error instanceof AxiosError) {
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

// Export singleton instance and its methods
export const apiService = ApiService.getInstance();

export const analyzeBill = (file: File): Promise<ApiResponse<{ analysis: string }>> => {
  return apiService.analyzeBill(file);
};