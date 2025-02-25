import { 
  AxiosError
} from 'axios';
import { ApiResponse, ApiError } from '@/types';
import * as pdfjsLib from 'pdfjs-dist';
import { VerizonBillAnalyzer } from '@/utils/bill-analyzer/analyzer';
import type { BillData, ChargeItem, UsageDetail } from '@/utils/bill-analyzer/types';

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
    const extractAmount = (text: string): number => {
      const match = text.match(/\$?([\d,]+\.\d{2})/);
      return match ? parseFloat(match[1].replace(',', '')) : 0;
    };

    // Find account number - usually in format (XXX-XXX-XXXX)
    const accountNumMatch = pages[0].match(/Account number[:\s]*([0-9-]+)/i);
    const accountNumber = accountNumMatch ? accountNumMatch[1] : 'Unknown';

    // Extract bill summary information
    let currentCharges = 0;
    let totalDue = 0;
    let previousBalance = 0;
    let payments = 0;

    // Look for bill summary section in first few pages
    const summaryText = pages.slice(0, 3).join(' ');
    
    // Match "Total:" followed by amount
    const totalMatch = summaryText.match(/Total:?\s*\$?([\d,]+\.\d{2})/i);
    if (totalMatch) {
      totalDue = extractAmount(totalMatch[1]);
    }

    // Match "You paid" or "Payment" amounts
    const paymentMatch = summaryText.match(/You paid \$?([\d,]+\.\d{2})/i);
    if (paymentMatch) {
      payments = extractAmount(paymentMatch[1]);
    }

    // Extract billing period
    const periodMatch = summaryText.match(/Bill period:?\s*([A-Za-z]+\s+\d{1,2},\s*\d{4})\s*(?:to|through|-)\s*([A-Za-z]+\s+\d{1,2},\s*\d{4})/i);
    const startDate = periodMatch ? periodMatch[1] : 'Unknown';
    const endDate = periodMatch ? periodMatch[2] : 'Unknown';

    // Create charges arrays
    const planCharges: ChargeItem[] = [];
    const equipmentCharges: ChargeItem[] = [];
    const oneTimeCharges: ChargeItem[] = [];
    const taxesAndFees: ChargeItem[] = [];

    // Extract line items from the bill
    const lines = pages.join(' ').split('\n');
    lines.forEach(line => {
      const chargeMatch = line.match(/(.+?)\s+\$?([\d,]+\.\d{2})\s*$/);
      if (chargeMatch) {
        const [_, description, amount] = chargeMatch;
        const charge = {
          description: description.trim(),
          amount: extractAmount(amount)
        };

        // Categorize charges based on description
        if (description.toLowerCase().includes('equipment') || description.toLowerCase().includes('device')) {
          equipmentCharges.push(charge);
        } else if (description.toLowerCase().includes('tax') || description.toLowerCase().includes('fee')) {
          taxesAndFees.push(charge);
        } else if (description.toLowerCase().includes('one-time')) {
          oneTimeCharges.push(charge);
        } else {
          planCharges.push(charge);
        }
      }
    });

    // Extract usage details
    const usageDetails: Record<string, UsageDetail[]> = {};
    
    // Look for phone numbers and their usage
    const phoneMatches = pages.join(' ').match(/\(\d{3}-\d{3}-\d{4}\)/g) || [];
    phoneMatches.forEach(phone => {
      const cleanPhone = phone.replace(/[()-]/g, '');
      usageDetails[cleanPhone] = [{
        data_usage: '0 GB', // You'll need to find actual usage data
        talk_minutes: '0:00',
        text_count: '0'
      }];
    });

    return {
      account_info: {
        account_number: accountNumber,
        billing_period_start: startDate,
        billing_period_end: endDate
      },
      bill_summary: {
        previous_balance: previousBalance,
        payments: payments,
        current_charges: currentCharges,
        total_due: totalDue
      },
      plan_charges: planCharges,
      equipment_charges: equipmentCharges,
      one_time_charges: oneTimeCharges,
      taxes_and_fees: taxesAndFees,
      usage_details: usageDetails
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
