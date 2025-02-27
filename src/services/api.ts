
import { AxiosError } from 'axios';
import { ApiResponse, ApiError } from '@/types';
import { VerizonBillAnalyzer } from '@/utils/bill-analyzer/analyzer';
import { extractVerizonBill, analyzeBill as analyzeVerizonBill } from '@/utils/bill-analyzer/extractor';
import type { BillData, VerizonBill } from '@/utils/bill-analyzer/types';

interface ErrorResponse {
  message?: string;
}

interface BillAnalysis {
  totalAmount: number;
  accountNumber: string;
  billingPeriod: string;
  charges: Array<{
    description: string;
    amount: number;
    type: string;
  }>;
  lineItems: Array<{
    description: string;
    amount: number;
    type: string;
  }>;
  subtotals: {
    lineItems: number;
    otherCharges: number;
  };
  summary: string;
  recommendations?: Array<{
    phone_number: string;
    recommendation: string;
    potential_savings: string;
  }>;
  usageAnalysis?: {
    avg_data_usage_gb: number;
    avg_talk_minutes: number;
    avg_text_count: number;
    high_data_users: string[];
    high_talk_users: string[];
    high_text_users: string[];
  };
}

class ApiService {
  private static instance: ApiService;

  private constructor() {}

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  private handleError(error: AxiosError<ErrorResponse>): ApiError {
    console.error('API Error:', error.response?.data || error.message);
    return {
      message: error.response?.data?.message || error.message || 'An error occurred',
      code: 'API_ERROR',
    };
  }

  private convertVerizonBillToBillData(verizonBill: VerizonBill): BillData {
    return {
      account_info: {
        account_number: verizonBill.accountInfo.accountNumber,
        customer_name: verizonBill.accountInfo.customerName,
        billing_period_start: verizonBill.accountInfo.billingPeriod.start,
        billing_period_end: verizonBill.accountInfo.billingPeriod.end
      },
      bill_summary: {
        previous_balance: verizonBill.billSummary.previousBalance,
        payments: verizonBill.billSummary.payments,
        current_charges: verizonBill.billSummary.currentCharges,
        total_due: verizonBill.billSummary.totalDue
      },
      plan_charges: verizonBill.lineItems.flatMap(item => 
        item.planCharges.map(charge => ({
          description: charge.description,
          amount: charge.amount
        }))
      ),
      equipment_charges: verizonBill.lineItems.flatMap(item => 
        item.deviceCharges.map(charge => ({
          description: charge.description,
          amount: charge.amount
        }))
      ),
      one_time_charges: [],
      taxes_and_fees: verizonBill.lineItems.flatMap(item => [
        ...item.surcharges.map(charge => ({
          description: charge.description,
          amount: charge.amount
        })),
        ...item.taxes.map(tax => ({
          description: tax.description,
          amount: tax.amount
        }))
      ]),
      usage_details: Object.fromEntries(
        verizonBill.lineItems.map(item => [
          item.phoneNumber,
          [{
            data_usage: '0 GB',
            talk_minutes: (
              verizonBill.callActivity
                .find(a => a.phoneNumber === item.phoneNumber)
                ?.calls?.reduce((sum: number, call) => sum + call.minutes, 0) || 0
            ).toString(),
            text_count: '0'
          }]
        ])
      )
    };
  }

  public async analyzeBill(file: File): Promise<ApiResponse<BillAnalysis>> {
    try {
      if (!file.type.includes('pdf')) {
        throw new Error('Invalid file type');
      }
      
      console.log('Starting bill analysis...');
      
      // Create form data to send the file
      const formData = new FormData();
      formData.append('file', file);
      
      // Send the file to the server for analysis
      const response = await fetch('http://localhost:3001/api/analyze-bill', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze bill');
      }
      
      const result = await response.json();
      console.log('Analysis successful:', result);
      
      // Convert the server response to the expected format
      const analysis: BillAnalysis = {
        totalAmount: result.totalAmount || 0,
        accountNumber: result.accountNumber || 'Unknown',
        billingPeriod: result.billingPeriod || 'Unknown',
        charges: result.charges || [],
        lineItems: result.lineItems || [],
        subtotals: {
          lineItems: result.subtotals?.lineItems || 0,
          otherCharges: result.subtotals?.otherCharges || 0
        },
        summary: result.summary || 'Bill analysis completed'
      };
      
      return { data: analysis };
    } catch (error) {
      console.error('Error analyzing bill:', error);
      
      if (error instanceof AxiosError) {
        return { error: this.handleError(error) };
      }
      
      return {
        error: {
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
          code: 'UNKNOWN_ERROR',
        },
      };
    }
  }
}

export const apiService = ApiService.getInstance();

export const analyzeBill = (file: File): Promise<ApiResponse<BillAnalysis>> => {
  return apiService.analyzeBill(file);
};
