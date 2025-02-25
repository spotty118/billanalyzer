
import axios, { 
  AxiosError, 
  AxiosInstance
} from 'axios';
import { ApiResponse, ApiError } from '@/types';
import * as pdfParse from 'pdf-parse';

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

function normalizeText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function extractMatch(pattern: RegExp, text: string): string | null {
  const match = pattern.exec(text);
  return match ? match[1] : null;
}

async function convertPdfToText(pdfBuffer: Buffer): Promise<string> {
  const data = await pdfParse(pdfBuffer);
  return data.text;
}

function parseLineItems(text: string): Array<{ device: string; charge: string }> {
  const lineItems: Array<{ device: string; charge: string }> = [];
  const sectionMatch = text.match(/Bill summary by line(.*?)Charges by line details/i);
  
  if (sectionMatch) {
    const sectionText = sectionMatch[1];
    const entries = sectionText.split(/\n/);
    
    for (const entry of entries) {
      const deviceMatch = entry.match(/(.*?)\s+\$\s*([\d,.]+)/);
      if (deviceMatch) {
        lineItems.push({
          device: deviceMatch[1].trim(),
          charge: deviceMatch[2].trim()
        });
      }
    }
  }
  
  return lineItems;
}

async function parseVerizonBill(pdfBuffer: Buffer): Promise<BillData> {
  const rawText = await convertPdfToText(pdfBuffer);
  const text = normalizeText(rawText);
  
  const billDate = extractMatch(/Bill date\s*(\w+\s+\d{1,2},\s+\d{4})/i, text) || '';
  const accountNumber = extractMatch(/Account number\s*([\d-]+)/i, text) || '';
  const invoiceNumber = extractMatch(/Invoice number\s*([\d]+)/i, text) || '';
  const totalDue = extractMatch(/Total Amount Due\s*\$\s*([\d,.]+)/i, text) || '';
  const billingPeriod = extractMatch(/Billing period:\s*(.+?)(?:\s+Account|$)/i, text) || '';
  
  const lineItems = parseLineItems(text);
  
  return {
    billDate,
    accountNumber,
    invoiceNumber,
    totalDue,
    billingPeriod,
    lineItems
  };
}

class ApiService {
  private static instance: ApiService;
  private api: AxiosInstance;

  private constructor() {
    this.api = axios.create({
      baseURL: '/api',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      validateStatus: (status) => {
        return status >= 200 && status < 300;
      }
    });
  }

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
      const pdfBuffer = Buffer.from(buffer);
      
      const billData = await parseVerizonBill(pdfBuffer);
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
