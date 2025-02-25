
import { 
  AxiosError
} from 'axios';
import { ApiResponse, ApiError } from '@/types';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry';

// Set up PDF.js worker properly
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface ErrorResponse {
  message?: string;
}

interface BillAnalysis {
  totalAmount: number | null;
  accountNumber: string | null;
  billingPeriod: string | null;
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
}

interface BillData {
  billDate: string;
  accountNumber: string;
  invoiceNumber: string;
  totalDue: string;
  billingPeriod: string;
  lineItems: Array<{
    device: string;
    charge: string;
  }>;
}

interface AccountInfo {
  account_number?: string;
  customer_name?: string;
  billing_period_start?: string;
  billing_period_end?: string;
}

interface BillSummary {
  previous_balance?: number;
  payments?: number;
  current_charges?: number;
  total_due?: number;
}

interface ChargeItem {
  description: string;
  amount: number;
}

interface UsageDetail {
  data_usage: string;
  talk_minutes: string;
  text_count?: string;
}

interface DetailedBillData {
  account_info: AccountInfo;
  bill_summary: BillSummary;
  plan_charges: ChargeItem[];
  equipment_charges: ChargeItem[];
  one_time_charges: ChargeItem[];
  taxes_and_fees: ChargeItem[];
  usage_details: Record<string, UsageDetail[]>;
}

async function convertPdfToText(pdfBuffer: ArrayBuffer): Promise<string[]> {
  try {
    // Load the document with explicit worker configuration
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
    
    return pages;
  } catch (error) {
    console.error('Error converting PDF to text:', error);
    throw error;
  }
}

class VerizonBillParser {
  private textPages: string[];
  private billData: DetailedBillData;

  constructor(textPages: string[]) {
    this.textPages = textPages;
    this.billData = {
      account_info: {},
      bill_summary: {},
      plan_charges: [],
      equipment_charges: [],
      one_time_charges: [],
      taxes_and_fees: [],
      usage_details: {}
    };
  }

  private parseAccountInfo(): void {
    const accountPattern = /Account Number:\s*(\d{10})/;
    const billingPeriodPattern = /Bill Period:\s*([\w\s,]+\d{4})\s*to\s*([\w\s,]+\d{4})/;
    
    for (const page of this.textPages.slice(0, 2)) {
      const accountMatch = page.match(accountPattern);
      if (accountMatch) {
        this.billData.account_info.account_number = accountMatch[1];
      }
      
      const billingPeriodMatch = page.match(billingPeriodPattern);
      if (billingPeriodMatch) {
        this.billData.account_info.billing_period_start = billingPeriodMatch[1].trim();
        this.billData.account_info.billing_period_end = billingPeriodMatch[2].trim();
      }
    }
  }

  private parseBillSummary(): void {
    const summaryPatterns = {
      previous_balance: /Previous Balance\s*\$\s*([\d,]+\.\d{2})/,
      payments: /Payments\s*-\s*\$\s*([\d,]+\.\d{2})/,
      current_charges: /Current Charges\s*\$\s*([\d,]+\.\d{2})/,
      total_due: /Total Due\s*\$\s*([\d,]+\.\d{2})/
    };
    
    for (const page of this.textPages.slice(0, 3)) {
      for (const [key, pattern] of Object.entries(summaryPatterns)) {
        const match = page.match(pattern);
        if (match) {
          const amount = parseFloat(match[1].replace(',', ''));
          this.billData.bill_summary[key as keyof BillSummary] = amount;
        }
      }
    }
  }

  public parseAll(): DetailedBillData {
    this.parseAccountInfo();
    this.parseBillSummary();
    return this.billData;
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

  private convertBillDataToAnalysis(billData: BillData): BillAnalysis {
    const totalAmount = parseFloat(billData.totalDue.replace(/[^0-9.]/g, '')) || null;
    
    const lineItems = billData.lineItems.map(item => ({
      description: item.device,
      amount: parseFloat(item.charge.replace(/[^0-9.]/g, '')) || 0,
      type: 'line'
    }));

    const lineItemsTotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
    const otherChargesTotal = totalAmount ? totalAmount - lineItemsTotal : 0;

    return {
      totalAmount,
      accountNumber: billData.accountNumber || null,
      billingPeriod: billData.billingPeriod || null,
      charges: [{
        description: 'Other Charges and Credits',
        amount: otherChargesTotal,
        type: 'other'
      }],
      lineItems,
      subtotals: {
        lineItems: lineItemsTotal,
        otherCharges: otherChargesTotal
      },
      summary: `Bill analysis for ${billData.billDate}`
    };
  }

  private validateBillAnalysis(data: any): data is BillAnalysis {
    if (!data || typeof data !== 'object') return false;
    
    if (typeof data.totalAmount !== 'number' && data.totalAmount !== null) return false;
    if (!data.subtotals || typeof data.subtotals.lineItems !== 'number' || typeof data.subtotals.otherCharges !== 'number') return false;
    
    if (!Array.isArray(data.charges) || !Array.isArray(data.lineItems)) return false;
    
    if (typeof data.accountNumber !== 'string' && data.accountNumber !== null) return false;
    if (typeof data.billingPeriod !== 'string' && data.billingPeriod !== null) return false;
    if (typeof data.summary !== 'string') return false;

    return true;
  }

  private sanitizeFile(file: File): boolean {
    const allowedTypes = ['application/pdf', 'text/plain', 'image/jpeg', 'image/png'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type');
    }

    if (file.size > maxSize) {
      throw new Error('File size too large');
    }

    return true;
  }

  public async analyzeBill(file: File): Promise<ApiResponse<BillAnalysis>> {
    try {
      this.sanitizeFile(file);
      const buffer = await file.arrayBuffer();
      
      const textPages = await convertPdfToText(buffer);
      const parser = new VerizonBillParser(textPages);
      const detailedData = parser.parseAll();
      
      const billData: BillData = {
        billDate: detailedData.account_info.billing_period_start || '',
        accountNumber: detailedData.account_info.account_number || '',
        invoiceNumber: '',
        totalDue: detailedData.bill_summary.total_due?.toString() || '0',
        billingPeriod: `${detailedData.account_info.billing_period_start || ''} to ${detailedData.account_info.billing_period_end || ''}`,
        lineItems: []
      };

      const analysis = this.convertBillDataToAnalysis(billData);

      if (!this.validateBillAnalysis(analysis)) {
        console.error('Invalid bill analysis structure:', analysis);
        throw new Error('Invalid bill analysis structure');
      }

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
