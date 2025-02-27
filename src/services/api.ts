
import { AxiosError } from 'axios';
import { ApiResponse, ApiError } from '@/types';
import { VerizonBillAnalyzer } from '@/utils/bill-analyzer/analyzer';
import { extractVerizonBill } from '@/utils/bill-analyzer/extractor';
import type { BillData, VerizonBill, UsageAnalysisResult } from '@/utils/bill-analyzer/types';

interface ErrorResponse {
  message?: string;
}

interface UsagePatternResponse {
  trend: 'increasing' | 'decreasing' | 'stable';
  percentageChange: number;
  seasonalFactors?: {
    highUsageMonths: string[];
    lowUsageMonths: string[];
  };
}

interface CostAnalysisResponse {
  averageMonthlyBill: number;
  projectedNextBill: number;
  unusualCharges: Array<{
    description: string;
    amount: number;
    reason: string;
  }>;
  potentialSavings: Array<{
    description: string;
    estimatedSaving: number;
    confidence: number;
  }>;
}

interface PlanRecommendationResponse {
  recommendedPlan: string;
  reasons: string[];
  estimatedMonthlySavings: number;
  confidenceScore: number;
  alternativePlans: Array<{
    planName: string;
    pros: string[];
    cons: string[];
    estimatedSavings: number;
  }>;
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
  usageAnalysis?: {
    trend: 'increasing' | 'decreasing' | 'stable';
    percentageChange: number;
    seasonalFactors?: {
      highUsageMonths: string[];
      lowUsageMonths: string[];
    };
    avg_data_usage_gb: number;
    avg_talk_minutes: number;
    avg_text_count: number;
    high_data_users: string[];
    high_talk_users: string[];
    high_text_users: string[];
  };
  costAnalysis?: {
    averageMonthlyBill: number;
    projectedNextBill: number;
    unusualCharges: Array<{
      description: string;
      amount: number;
      reason: string;
    }>;
    potentialSavings: Array<{
      description: string;
      estimatedSaving: number;
      confidence: number;
    }>;
  };
  planRecommendation?: {
    recommendedPlan: string;
    reasons: string[];
    estimatedMonthlySavings: number;
    confidenceScore: number;
    alternativePlans: Array<{
      planName: string;
      pros: string[];
      cons: string[];
      estimatedSavings: number;
    }>;
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

  private async extractTextFromPDF(pdfBuffer: ArrayBuffer): Promise<string> {
    // Create a copy of the ArrayBuffer to prevent detachment
    const buffer = new Uint8Array(pdfBuffer.slice(0));
    const textContent = await extractVerizonBill(buffer);
    if (!textContent) {
      throw new Error('Failed to extract text from PDF');
    }
    return JSON.stringify(textContent);
  }

  private async analyzeWithServer(pdfText: string): Promise<{
    usageAnalysis?: UsagePatternResponse;
    costAnalysis?: CostAnalysisResponse;
    planRecommendation?: PlanRecommendationResponse;
  }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/analyze-bill/enhanced`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ billText: pdfText }),
      });

      if (!response.ok) {
        throw new Error('Failed to get enhanced analysis');
      }

      return await response.json();
    } catch (error) {
      console.error('Enhanced analysis failed:', error);
      throw error;
    }
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
          // Get the text content from the PDF file - clone the ArrayBuffer to prevent detachment
          const fileContent = await file.arrayBuffer();
          const fileContentCopy = new Uint8Array(fileContent.slice(0));
          const verizonBill = await extractVerizonBill(fileContentCopy);
          
          if (!verizonBill) {
            throw new Error('Failed to extract bill data');
          }
          
          // Convert PDF to text - use a fresh copy of the ArrayBuffer
          const pdfText = await this.extractTextFromPDF(fileContent.slice(0));
          
          // Get enhanced analysis from server
          const defaultAnalysis = {
            usageAnalysis: {
              trend: 'stable' as const,
              percentageChange: 0,
              seasonalFactors: {
                highUsageMonths: ['December', 'January'],
                lowUsageMonths: ['June', 'July']
              }
            },
            costAnalysis: {
              averageMonthlyBill: verizonBill.billSummary.totalDue,
              projectedNextBill: verizonBill.billSummary.totalDue * 1.05,
              unusualCharges: [] as Array<{
                description: string;
                amount: number;
                reason: string;
              }>,
              potentialSavings: [] as Array<{
                description: string;
                estimatedSaving: number;
                confidence: number;
              }>
            },
            planRecommendation: {
              recommendedPlan: 'Unlimited Plus',
              reasons: ['Based on current usage', 'Better value for your needs'],
              estimatedMonthlySavings: verizonBill.billSummary.totalDue * 0.15,
              confidenceScore: 0.8,
              alternativePlans: [{
                planName: 'Unlimited Welcome',
                pros: ['Lower monthly cost'],
                cons: ['Fewer features'],
                estimatedSavings: verizonBill.billSummary.totalDue * 0.2
              }]
            }
          };
          
          let enhancedAnalysis = { ...defaultAnalysis };
          
          try {
            const serverEnhanced = await this.analyzeWithServer(pdfText);
            if (serverEnhanced.usageAnalysis) {
              enhancedAnalysis.usageAnalysis = {
                ...defaultAnalysis.usageAnalysis,
                ...serverEnhanced.usageAnalysis
              };
            }
            if (serverEnhanced.costAnalysis) {
              enhancedAnalysis.costAnalysis = {
                ...defaultAnalysis.costAnalysis,
                ...serverEnhanced.costAnalysis
              };
            }
            if (serverEnhanced.planRecommendation) {
              enhancedAnalysis.planRecommendation = {
                ...defaultAnalysis.planRecommendation,
                ...serverEnhanced.planRecommendation
              };
            }
          } catch (err) {
            console.warn('Enhanced analysis failed, using defaults:', err);
          }
          
          // Create a bill analyzer and analyze the bill
          const billData = this.convertVerizonBillToBillData(verizonBill);
          const analyzer = new VerizonBillAnalyzer(billData);
          const baseAnalysis = analyzer.getUsageAnalysis();
          
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
            usageAnalysis: {
              trend: enhancedAnalysis.usageAnalysis.trend,
              percentageChange: enhancedAnalysis.usageAnalysis.percentageChange,
              seasonalFactors: enhancedAnalysis.usageAnalysis.seasonalFactors,
              avg_data_usage_gb: (baseAnalysis as UsageAnalysisResult).avg_data_usage_gb,
              avg_talk_minutes: (baseAnalysis as UsageAnalysisResult).avg_talk_minutes,
              avg_text_count: (baseAnalysis as UsageAnalysisResult).avg_text_count,
              high_data_users: (baseAnalysis as UsageAnalysisResult).high_data_users,
              high_talk_users: (baseAnalysis as UsageAnalysisResult).high_talk_users,
              high_text_users: (baseAnalysis as UsageAnalysisResult).high_text_users
            },
            costAnalysis: enhancedAnalysis.costAnalysis,
            planRecommendation: enhancedAnalysis.planRecommendation
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
