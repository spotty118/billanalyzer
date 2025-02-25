
import { VerizonBill } from './types';
import { parseVerizonBill } from './parser';
import type { TextItem, TextMarkedContent } from 'pdfjs-dist/types/src/display/api';

/**
 * Extract text from a PDF file and parse the Verizon bill
 */
export async function extractVerizonBill(pdfData: ArrayBuffer): Promise<VerizonBill> {
  try {
    const pdfjsLib = await import('pdfjs-dist');
    
    // Set up pdf.js worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.mjs',
      import.meta.url
    ).toString();

    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({
      data: pdfData,
      useWorkerFetch: false,
      isEvalSupported: false
    });
    
    const pdf = await loadingTask.promise;
    const pages: string[] = [];
    
    // Extract text from each page
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .filter((item: TextItem | TextMarkedContent): item is TextItem => 
          !('type' in item) && 'str' in item
        )
        .map(item => item.str)
        .join(' ');
      pages.push(pageText);
    }
    
    if (pages.length === 0) {
      throw new Error('No text content found in PDF');
    }
    
    // Parse the bill using the Verizon bill parser
    return parseVerizonBill(pages);
  } catch (error) {
    console.error('Error extracting Verizon bill:', error);
    throw error;
  }
}

/**
 * Process and analyze a Verizon bill
 */
export function analyzeBill(bill: VerizonBill) {
  const analysis = {
    accountNumber: bill.accountInfo.accountNumber,
    billingPeriod: `${bill.accountInfo.billingPeriod.start} to ${bill.accountInfo.billingPeriod.end}`,
    totalAmount: bill.billSummary.totalDue,
    lineCount: bill.lineItems.length,
    linesBreakdown: [] as Array<{
      phoneNumber: string;
      deviceType: string;
      totalCharges: number;
      planCharges: number;
      deviceCharges: number;
      servicesCharges: number;
      surcharges: number;
      taxes: number;
      planDetails: Array<{description: string; amount: number}>;
      deviceDetails: Array<{description: string; amount: number; remaining?: number}>;
      serviceDetails: Array<{description: string; amount: number}>;
      surchargeDetails: Array<{description: string; amount: number}>;
      taxDetails: Array<{description: string; amount: number}>;
    }>,
    callActivity: {
      totalCalls: 0,
      totalMinutes: 0,
      topCalledNumbers: [] as Array<{
        number: string;
        callCount: number;
        totalMinutes: number;
      }>
    },
    summary: {
      planChargesTotal: 0,
      deviceChargesTotal: 0,
      servicesChargesTotal: 0,
      surchargesTotal: 0,
      taxesTotal: 0
    }
  };
  
  // Analyze each line
  for (const line of bill.lineItems) {
    // Skip account-wide charges
    if (!line.phoneNumber) continue;
    
    const planChargesAmount = line.planCharges.reduce((sum, charge) => sum + charge.amount, 0);
    const deviceChargesAmount = line.deviceCharges.reduce((sum, charge) => sum + charge.amount, 0);
    const servicesChargesAmount = line.servicesCharges.reduce((sum, charge) => sum + charge.amount, 0);
    const surchargesAmount = line.surcharges.reduce((sum, charge) => sum + charge.amount, 0);
    const taxesAmount = line.taxes.reduce((sum, charge) => sum + charge.amount, 0);
    
    const lineSummary = {
      phoneNumber: line.phoneNumber,
      deviceType: line.deviceType || 'Unknown Device',
      totalCharges: line.totalAmount,
      planCharges: planChargesAmount,
      deviceCharges: deviceChargesAmount,
      servicesCharges: servicesChargesAmount,
      surcharges: surchargesAmount,
      taxes: taxesAmount,
      planDetails: line.planCharges.map(charge => ({
        description: charge.description,
        amount: charge.amount
      })),
      deviceDetails: line.deviceCharges.map(charge => ({
        description: charge.description,
        amount: charge.amount,
        remaining: charge.remaining
      })),
      serviceDetails: line.servicesCharges.map(charge => ({
        description: charge.description,
        amount: charge.amount
      })),
      surchargeDetails: line.surcharges.map(charge => ({
        description: charge.description,
        amount: charge.amount
      })),
      taxDetails: line.taxes.map(tax => ({
        description: tax.description,
        amount: tax.amount
      }))
    };
    
    // Update totals
    analysis.summary.planChargesTotal += planChargesAmount;
    analysis.summary.deviceChargesTotal += deviceChargesAmount;
    analysis.summary.servicesChargesTotal += servicesChargesAmount;
    analysis.summary.surchargesTotal += surchargesAmount;
    analysis.summary.taxesTotal += taxesAmount;
    
    analysis.linesBreakdown.push(lineSummary);
  }
  
  // Analyze call activity
  const callsByNumber: Record<string, { count: number; minutes: number }> = {};
  
  for (const activity of bill.callActivity) {
    for (const call of activity.calls) {
      analysis.callActivity.totalCalls++;
      analysis.callActivity.totalMinutes += call.minutes;
      
      // Track calls by number
      if (!callsByNumber[call.number]) {
        callsByNumber[call.number] = { count: 0, minutes: 0 };
      }
      
      callsByNumber[call.number].count++;
      callsByNumber[call.number].minutes += call.minutes;
    }
  }
  
  // Get top called numbers
  analysis.callActivity.topCalledNumbers = Object.entries(callsByNumber)
    .map(([number, stats]) => ({
      number,
      callCount: stats.count,
      totalMinutes: stats.minutes
    }))
    .sort((a, b) => b.callCount - a.callCount)
    .slice(0, 10);
  
  return analysis;
}
