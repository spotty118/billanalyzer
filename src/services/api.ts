
import { AxiosError } from 'axios';
import { ApiResponse, ApiError } from '@/types';
import * as pdfjsLib from 'pdfjs-dist';
import { VerizonBillAnalyzer } from '@/utils/bill-analyzer/analyzer';
import { parseVerizonBill } from '@/utils/bill-analyzer/parser';
import type { BillData, VerizonBill } from '@/utils/bill-analyzer/types';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

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

async function convertPdfToText(pdfBuffer: ArrayBuffer): Promise<string[]> {
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: pdfBuffer,
      useWorkerFetch: false,
      isEvalSupported: false
    });
    
    const pdf = await loadingTask.promise;
    const pages: string[] = [];
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item: any) => item.str)
        .join(' ');
      pages.push(pageText);
    }
    
    if (pages.length === 0) {
      throw new Error('No text content found in PDF');
    }
    
    return pages;
  } catch (error) {
    console.error('Error converting PDF to text:', error);
    throw error;
  }
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
    const sumMinutes = (activity: { calls: { minutes: number }[] }): number => 
      activity.calls.reduce((sum: number, call) => sum + call.minutes, 0);

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
      const pages = await convertPdfToText(buffer);
      
      // Parse the bill using the new parser
      console.log('Starting bill analysis...');
      const verizonBill = parseVerizonBill(pages);
      
      // Convert to BillData format
      const billData = this.convertVerizonBillToBillData(verizonBill);
      
      // Create analyzer instance
      const analyzer = new VerizonBillAnalyzer(billData);
      
      // Get analysis results
      const summary = analyzer.getBillSummary();
      const optimization = analyzer.optimizePlan();
      const usageAnalysis = analyzer.getUsageAnalysis();

      const analysis: BillAnalysis = {
        totalAmount: summary.total_charges.total_due || 0,
        accountNumber: summary.account_number || 'Unknown',
        billingPeriod: `${summary.billing_period.start} to ${summary.billing_period.end}`,
        charges: verizonBill.lineItems.map(item => ({
          description: `${item.owner} (${item.phoneNumber})`,
          amount: item.totalAmount,
          type: 'line'
        })),
        lineItems: [],
        subtotals: {
          lineItems: summary.total_charges.current_charges || 0,
          otherCharges: 0
        },
        summary: `Bill analysis for ${summary.billing_period.start}`,
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
