
export interface VerizonPlanDetails {
  external_id: string;
  name: string;
  base_price: number;
  multi_line_discounts: {
    lines2: number;
    lines3: number;
    lines4: number;
    lines5Plus: number;
  };
  features: string[];
  type: 'consumer' | 'business';
  data_allowance: {
    premium: number | 'unlimited';
    hotspot?: number;
  };
  streaming_quality: '480p' | '720p' | '1080p' | '4K';
  autopay_discount?: number;
  paperless_discount?: number;
}

export interface Promotion {
  id: string;
  external_id: string;
  title: string;
  description: string;
  expires: string;
  type: 'device' | 'plan' | 'trade-in';
  value: string;
  terms?: string[];
  stackable: boolean;
}
