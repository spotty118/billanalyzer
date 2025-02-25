import { 
  AxiosError
} from 'axios';
import { ApiResponse, ApiError } from '@/types';
import * as pdfjsLib from 'pdfjs-dist';
import { VerizonBillAnalyzer } from '@/utils/bill-analyzer/analyzer';
import type { BillData } from '@/utils/bill-analyzer/types';

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

  private extractBillData(pages: string[]): BillData {
    return {
      account_info: {
        account_number: pages[0].match(/Account Number:\s*(\d+)/)?.[1] || 'Unknown',
        billing_period_start: pages[0].match(/Billing Period:\s*([\w\s,]+\d{4})/)?.[1] || 'Unknown',
        billing_period_end: pages[0].match(/to\s*([\w\s,]+\d{4})/)?.[1] || 'Unknown'
      },
      bill_summary: {
        total_due: parseFloat(pages[0].match(/Total Due[^\d]*(\d+\.\d{2})/)?.[1] || '0'),
        current_charges: parseFloat(pages[0].match(/Current Charges[^\d]*(\d+\.\d{2})/)?.[1] || '0')
      },
      plan_charges: [],
      equipment_charges: [],
      one_time_charges: [],
      taxes_and_fees: [],
      usage_details: {}
    };
  }

  public async analyzeBill(file: File): Promise<ApiResponse<BillAnalysis>> {
    try {
      if (!file.type.includes('pdf')) {
        throw new Error('Invalid file type');
      }

      const buffer = await file.arrayBuffer();
      const pages = await convertPdfToText(buffer);
      
      const billData = this.extractBillData(pages);
      
      const analyzer = new VerizonBillAnalyzer(billData);
      
      const summary = analyzer.getBillSummary();
      
      const optimization = analyzer.optimizePlan();
      
      const usageAnalysis = analyzer.getUsageAnalysis();

      const analysis: BillAnalysis = {
        totalAmount: summary.total_charges.total_due || 0,
        accountNumber: summary.account_number || 'Unknown',
        billingPeriod: `${summary.billing_period.start} to ${summary.billing_period.end}`,
        charges: [],
        lineItems: [],
        subtotals: {
          lineItems: summary.total_charges.current_charges || 0,
          otherCharges: 0
        },
        summary: `Bill analysis for ${summary.billing_period.start}`,
        recommendations: optimization.line_recommendations,
        usageAnalysis
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
