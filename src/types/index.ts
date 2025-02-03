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
  dataAllowance: {
    premium: number | 'unlimited';
    hotspot?: number;
  };
  streamingQuality: '480p' | '720p' | '1080p' | '4K';
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  expires: string;
  type: 'device' | 'plan' | 'trade-in';
  value: string;
  terms?: string[];
  eligiblePlans?: string[];
  stackable?: boolean;
  version?: string;
}

export interface QuoteCalculation {
  linePrice: number;
  total: number;
  hasDiscount: boolean;
  annualSavings: number;
  breakdown: {
    subtotal: number;
    discount: number;
    total: number;
  };
}

export interface ApiError {
  message: string;
  details?: string;
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