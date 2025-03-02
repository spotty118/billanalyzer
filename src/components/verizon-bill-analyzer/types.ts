
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
