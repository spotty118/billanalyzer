
/**
 * Types for the Verizon Bill Analyzer components
 */

export interface CategoryDataItem {
  name: string;
  value: number;
  percentage?: string;
}

export interface BillSummary {
  totalAmount: number;
  chargesByCategory: {
    [key: string]: number;
  };
  topExpenses: Array<{
    name: string;
    amount: number;
  }>;
  accountNumber?: string;
  billingPeriod?: string;
  dueDate?: string;
}
