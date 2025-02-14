export interface Plan {
  id: string;
  name: string;
  basePrice: number;
  price_1_line: number;
  price_2_line: number;
  price_3_line: number;
  price_4_line: number;
  price_5plus_line: number;
  features: string[];
  type: 'consumer' | 'business';
  dataAllowance: {
    premium: number | 'unlimited';
    hotspot?: number;
  };
  streamingQuality: '480p' | '720p' | '1080p' | '4K';
  autopayDiscount?: number;
  paperlessDiscount?: number;
  planLevel?: 'welcome' | 'plus' | 'unlimited';
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
    streamingSavings?: number;
    totalSavings?: number;
  };
  selectedPerks?: string[];
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

export interface Database {
  public: {
    Tables: {
      verizon_plans: {
        Row: {
          id: string;
          external_id: string;
          name: string;
          base_price: number;
          type: 'consumer' | 'business';
          multi_line_discounts: {
            lines2: number;
            lines3: number;
            lines4: number;
            lines5Plus: number;
          };
          data_allowance: {
            premium: number | 'unlimited';
            hotspot?: number;
          };
          streaming_quality: '480p' | '720p' | '1080p' | '4K';
          autopay_discount?: number;
          paperless_discount?: number;
          features: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['verizon_plans']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['verizon_plans']['Insert']>;
      };
    };
  };
}
