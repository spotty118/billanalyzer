import axios, { AxiosError } from 'axios';
import { ApiResponse, ApiError } from '@/types';

interface ErrorResponse {
  message?: string;
}

const api = axios.create({
  baseURL: '/api',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const handleError = (error: AxiosError<ErrorResponse>): ApiError => {
  if (error.response) {
    return {
      message: error.response.data.message || 'An error occurred',
      status: error.response.status,
      code: error.code,
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
};

export const analyzeBill = async (file: File): Promise<ApiResponse<{ analysis: string }>> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<{ analysis: string }>('/analyze-bill', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return { data: response.data };
  } catch (error) {
    if (error instanceof AxiosError) {
      return { error: handleError(error) };
    }
    return {
      error: {
        message: 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR',
      },
    };
  }
};

// Add retry capability for failed requests
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config } = error;
    
    if (!config || !config.retry) {
      return Promise.reject(error);
    }

    config.retryCount = config.retryCount || 0;

    if (config.retryCount >= config.retry) {
      return Promise.reject(error);
    }

    config.retryCount += 1;

    const backoff = new Promise((resolve) => {
      setTimeout(() => {
        resolve(null);
      }, config.retryDelay || 1000);
    });

    await backoff;
    return api(config);
  }
);