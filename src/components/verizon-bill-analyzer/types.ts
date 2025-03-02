
export interface BillAnalysis {
  accountNumber: string;
  billingPeriod: string;
  totalAmount: number;
  lineItems: LineItem[];
  summary: BillSummary;
  fees: Fee[];
  recommendations: Recommendation[];
}

export interface LineItem {
  lineNumber: string;
  phoneNumber: string;
  planName: string;
  devicePayment: number;
  planCharge: number;
  totalCharge: number;
  dataUsage: {
    used: number;
    included: number;
    units: string;
  };
}

export interface BillSummary {
  totalDevicePayments: number;
  totalPlanCharges: number;
  totalFees: number;
  totalTaxes: number;
  grandTotal: number;
}

export interface Fee {
  name: string;
  amount: number;
}

export interface Recommendation {
  title: string;
  description: string;
  potentialSavings: number;
}

export interface ChartDataItem {
  name: string;
  value: number;
}

export interface CategoryDataItem {
  name: string;
  value: number;
  percentage: number;
}

// Additional types needed for components
export interface BillData {
  accountNumber: string;
  billingPeriod: string;
  totalAmount: number;
  phoneLines: PhoneLine[];
  chargesByCategory: {
    plans: number;
    devices: number;
    protection: number;
    surcharges: number;
    taxes: number;
    other: number;
  };
  usageAnalysis?: {
    trend: 'stable' | 'increasing' | 'decreasing';
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
    alternativePlans: Array<{
      name: string;
      monthlyCost: number;
      pros: string[];
      cons: string[];
      estimatedSavings: number;
    }>;
  };
}

export interface PhoneLine {
  deviceName: string;
  phoneNumber: string;
  planName: string; // Added planName property
  monthlyTotal: number;
  details: {
    planCost?: number;
    planDiscount?: number;
    devicePayment?: number;
    deviceCredit?: number;
    protection?: number;
    perks?: number; // Added perks property
    perksDiscount?: number; // Added perksDiscount property
    surcharges?: number;
    taxes?: number;
  };
}

export interface PotentialSaving {
  description: string;
  estimatedSaving: number;
}

export interface BillAnalysisResponse {
  accountNumber: string;
  billingPeriod: string;
  totalAmount: number;
  phoneLines: PhoneLine[];
}

// Add ChartSectionProps interface to fix type error
export interface ChartSectionProps {
  billData: BillData;
  billAnalysis?: BillAnalysis;
}
