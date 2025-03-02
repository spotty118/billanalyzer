
import { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent';

// Define the data structures for bill analysis
export interface BillLineDetails {
  planCost?: number;
  planDiscount?: number;
  devicePayment?: number;
  deviceCredit?: number;
  protection?: number;
  perks?: number;
  perksDiscount?: number;
  surcharges?: number;
  taxes?: number;
}

export interface PhoneLine {
  phoneNumber: string;
  deviceName: string;
  planName: string;
  monthlyTotal: number;
  details: BillLineDetails;
  charges?: any[];
}

export interface PotentialSaving {
  description: string;
  estimatedSaving: number;
}

export interface AlternativePlan {
  name: string;
  monthlyCost: number;
  pros: string[];
  cons: string[];
  estimatedSavings: number;
}

export interface BillData {
  accountNumber: string;
  billingPeriod: string;
  totalAmount: number;
  usageAnalysis?: {
    trend: string;
    percentageChange: number;
    avg_data_usage_gb: number;
    avg_talk_minutes: number;
    avg_text_messages: number;
  };
  costAnalysis?: {
    averageMonthlyBill: number;
    projectedNextBill: number;
    unusualCharges: any[];
    potentialSavings: PotentialSaving[];
  };
  planRecommendation?: {
    recommendedPlan: string;
    reasons: string[];
    estimatedMonthlySavings: number;
    confidenceScore: number;
    alternativePlans: AlternativePlan[];
  };
  phoneLines: PhoneLine[];
  chargesByCategory: {
    plans: number;
    devices: number;
    protection: number;
    surcharges: number;
    taxes: number;
    other: number;
  };
}

export interface BillAnalysisResponse {
  accountNumber: string;
  totalAmount: number;
  billingPeriod: string;
  phoneLines: PhoneLine[];
  chargesByCategory: {
    plans: number;
    devices: number;
    protection: number;
    surcharges: number;
    taxes: number;
    other: number;
  };
}

export interface ChartDataItem {
  name: string;
  total: number;
  plan: number;
  device: number;
  protection: number;
  taxes: number;
}

export interface CategoryDataItem {
  name: string;
  value: number;
}
