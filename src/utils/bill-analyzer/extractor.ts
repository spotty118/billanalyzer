
import { VerizonBill } from './types';
import { parseVerizonBill } from './parser';

/**
 * Extract text from a PDF file and parse the Verizon bill
 */
export async function extractVerizonBill(pdfData: ArrayBuffer): Promise<VerizonBill> {
  try {
    const { PDFDocumentProxy } = await import('pdfjs-dist');
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
        .map((item: any) => item.str)
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
    billingPeriod: bill.accountInfo.billingPeriod,
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
    }>,
    callActivity: {
      totalCalls: 0,
      totalMinutes: 0,
      topCalledNumbers: [] as Array<{
        number: string;
        callCount: number;
        totalMinutes: number;
      }>
    }
  };
  
  // Analyze each line
  for (const line of bill.lineItems) {
    // Skip account-wide charges
    if (!line.phoneNumber) continue;
    
    const lineSummary = {
      phoneNumber: line.phoneNumber,
      deviceType: line.deviceType,
      totalCharges: line.totalAmount,
      planCharges: line.planCharges.reduce((sum, charge) => sum + charge.amount, 0),
      deviceCharges: line.deviceCharges.reduce((sum, charge) => sum + charge.amount, 0),
      servicesCharges: line.servicesCharges.reduce((sum, charge) => sum + charge.amount, 0),
      surcharges: line.surcharges.reduce((sum, charge) => sum + charge.amount, 0),
      taxes: line.taxes.reduce((sum, charge) => sum + charge.amount, 0)
    };
    
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

