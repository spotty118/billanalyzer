
import { Json } from '@/integrations/supabase/types';

export interface VerizonPlanDetails {
  external_id: string;
  name: string;
  base_price: number;
  price_1_line: number;
  price_2_line: number;
  price_3_line: number;
  price_4_line: number;
  price_5plus_line: number;
  type: 'consumer' | 'business';
  data_allowance: Json;
  features: Json;
  streaming_quality: '480p' | '720p' | '1080p' | '4K';
  autopay_discount?: number | null;
  paperless_discount?: number | null;
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
