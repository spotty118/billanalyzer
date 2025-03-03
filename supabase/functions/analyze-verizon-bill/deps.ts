// Interface definitions for bill analysis
export interface BillAnalysisResult {
  phoneLines: PhoneLine[];
  accountNumber: string;
  billingPeriod: string;
  totalAmount: number;
}

export interface PhoneLine {
  phoneNumber: string;
  deviceName: string;
  ownerName: string;
  planName: string;
  monthlyTotal: number;
  details: PlanDetails;
}

export interface PlanDetails {
  planCost: number;
  planDiscount: number;
  devicePayment: number;
  deviceCredit: number;
  protection: number;
  surcharges: number;
  taxes: number;
}

// Export HTTP server types
export { serve } from "https://deno.land/std@0.177.0/http/server.ts";