
import { AxiosError } from 'axios';
import { ApiResponse, ApiError } from '@/types';
import { VerizonBillAnalyzer } from '@/utils/bill-analyzer/analyzer';
import { extractVerizonBill } from '@/utils/bill-analyzer/extractor';
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
  private apiBaseUrl: string;

  private constructor() {
    // Get the API base URL from environment or use fallback
    this.apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
  }

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  private handleError(error: AxiosError<ErrorResponse> | Error): ApiError {
    console.error('API Error:', error);
    
    if ('response' in error && error.response?.data) {
      return {
        message: error.response.data.message || error.message || 'An error occurred',
        code: 'API_ERROR',
      };
    }
    
    return {
      message: error.message || 'An error occurred',
      code: 'UNKNOWN_ERROR',
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
      
      // First attempt to use the server API
      try {
        const response = await fetch(`${this.apiBaseUrl}/api/analyze-bill`, {
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
      } catch (serverError) {
        console.warn('Server analysis failed, falling back to client-side analysis:', serverError);
        
        // Fallback to client-side analysis
        try {
          // Get the text content from the PDF file
          const fileContent = await file.arrayBuffer();
          const verizonBill = await extractVerizonBill(new Uint8Array(fileContent));
          
          if (!verizonBill) {
            throw new Error('Failed to extract bill data');
          }
          
          // Create a bill analyzer and analyze the bill
          const billData = this.convertVerizonBillToBillData(verizonBill);
          const analyzer = new VerizonBillAnalyzer(billData);
          const analysisResult = analyzer.getUsageAnalysis();
          const optimizationResult = analyzer.optimizePlan();
          
          // Format the analysis result
          const analysis: BillAnalysis = {
            totalAmount: verizonBill.billSummary.totalDue,
            accountNumber: verizonBill.accountInfo.accountNumber,
            billingPeriod: `${verizonBill.accountInfo.billingPeriod.start} to ${verizonBill.accountInfo.billingPeriod.end}`,
            charges: [], // Verizon bill structure doesn't have standalone charges
            lineItems: verizonBill.lineItems.flatMap(line => [
              ...line.planCharges.map(charge => ({
                description: `${line.phoneNumber} - ${charge.description}`,
                amount: charge.amount,
                type: 'plan'
              })),
              ...line.deviceCharges.map(charge => ({
                description: `${line.phoneNumber} - ${charge.description}`,
                amount: charge.amount,
                type: 'device'
              }))
            ]),
            subtotals: {
              lineItems: verizonBill.lineItems.reduce((sum: number, line) => 
                sum + line.planCharges.reduce((s: number, c) => s + c.amount, 0) + 
                      line.deviceCharges.reduce((s: number, c) => s + c.amount, 0), 0),
              otherCharges: 0 // No other charges in our structure
            },
            summary: `Bill analysis for account ${verizonBill.accountInfo.accountNumber}`,
            usageAnalysis: analysisResult,
            recommendations: optimizationResult.line_recommendations
          };
          
          console.log('Client-side analysis successful:', analysis);
          return { data: analysis };
        } catch (clientError) {
          console.error('Client-side analysis failed:', clientError);
          throw clientError;
        }
      }
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
