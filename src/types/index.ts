export interface Plan {
  id: string;
  name: string;
  basePrice: number;
  multiLineDiscounts: {
    lines2: number;
    lines3: number;
    lines4: number;
    lines5Plus: number;
  };
  features: string[];
  type: 'consumer' | 'business';
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  expires: string;
  type: 'device' | 'plan' | 'trade-in';
  value: string;
}

export interface QuoteCalculation {
  linePrice: number;
  total: number;
  hasDiscount: boolean;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

export type ApiResponse<T> = {
  data: T;
  error?: never;
} | {
  data?: never;
  error: ApiError;
}