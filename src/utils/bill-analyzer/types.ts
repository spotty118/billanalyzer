export interface AccountInfo {
  account_number?: string;
  customer_name?: string;
  billing_period_start?: string;
  billing_period_end?: string;
}

export interface BillSummary {
  previous_balance?: number;
  payments?: number;
  current_charges?: number;
  total_due?: number;
  [key: string]: number | undefined;
}

export interface ChargeItem {
  description: string;
  amount: number;
}

export interface UsageDetail {
  data_usage: string;
  talk_minutes: string;
  text_count?: string;
}

export interface BillData {
  account_info: AccountInfo;
  bill_summary: BillSummary;
  plan_charges: ChargeItem[];
  equipment_charges: ChargeItem[];
  one_time_charges: ChargeItem[];
  taxes_and_fees: ChargeItem[];
  usage_details: Record<string, UsageDetail[]>;
}

export interface PlanCharges {
  description: string;
  amount: number;
  period?: string;
}

export interface DeviceCharges {
  description: string;
  amount: number;
  payment?: string;
  agreement?: string;
  remaining?: number;
}

export interface ServiceCharges {
  description: string;
  amount: number;
  period?: string;
}

export interface Surcharge {
  description: string;
  amount: number;
}

export interface Tax {
  description: string;
  amount: number;
}

export interface LineItem {
  phoneNumber: string;
  deviceType: string;
  owner: string;
  totalAmount: number;
  planCharges: PlanCharges[];
  deviceCharges: DeviceCharges[];
  servicesCharges: ServiceCharges[];
  surcharges: Surcharge[];
  taxes: Tax[];
}

export interface CallActivity {
  phoneNumber: string;
  deviceType: string;
  calls: Call[];
}

export interface Call {
  date: string;
  time: string;
  number: string;
  origination: string;
  destination: string;
  minutes: number;
}

export interface VerizonBill {
  accountInfo: {
    accountNumber: string;
    customerName: string;
    billingPeriod: {
      start: string;
      end: string;
    };
    billDate: string;
    invoiceNumber: string;
  };
  billSummary: {
    previousBalance: number;
    payments: number;
    lateFee: number;
    currentCharges: number;
    totalDue: number;
    dueDate: string;
  };
  lineItems: LineItem[];
  callActivity: CallActivity[];
}

export interface UsageAnalysisResult {
  avg_data_usage_gb: number;
  avg_talk_minutes: number;
  avg_text_count: number;
  high_data_users: string[];
  high_talk_users: string[];
  high_text_users: string[];
  monthly_data_growth_rate?: number;
  monthly_talk_growth_rate?: number;
  monthly_text_growth_rate?: number;
}

export interface UsageSegment {
  segment_id: number;
  line_count: number;
  avg_data_gb: number;
  avg_talk_min: number;
  avg_text_count: number;
  phone_numbers: string[];
  primary_usage: 'data' | 'talk' | 'text';
}

export interface LineRecommendation {
  phone_number: string;
  recommendation: string;
  potential_savings: string;
}

export interface PlanOptimizationResult {
  current_line_count: number;
  avg_monthly_bill: number;
  line_recommendations: LineRecommendation[];
}
