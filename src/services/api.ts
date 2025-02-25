
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

      const buffer = await file.arrayBuffer();
      
      console.log('Starting bill analysis...');
      const verizonBill = await extractVerizonBill(buffer);
      const billAnalysis = analyzeVerizonBill(verizonBill);
      
      const billData = this.convertVerizonBillToBillData(verizonBill);
      const analyzer = new VerizonBillAnalyzer(billData);
      
      const summary = analyzer.getBillSummary();
      const optimization = analyzer.optimizePlan();
      const usageAnalysis = analyzer.getUsageAnalysis();

      const analysis: BillAnalysis = {
        totalAmount: billAnalysis.totalAmount,
        accountNumber: billAnalysis.accountNumber,
        billingPeriod: `${verizonBill.accountInfo.billingPeriod.start} to ${verizonBill.accountInfo.billingPeriod.end}`,
        charges: billAnalysis.linesBreakdown.map(item => ({
          description: `${item.phoneNumber} - ${item.deviceType}`,
          amount: item.totalCharges,
          type: 'line'
        })),
        lineItems: [],
        subtotals: {
          lineItems: summary.total_charges.current_charges || 0,
          otherCharges: 0
        },
        summary: `Bill analysis for account ${billAnalysis.accountNumber}`,
        recommendations: optimization.line_recommendations,
        usageAnalysis
      };

      console.log('Analysis successful:', analysis);
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
