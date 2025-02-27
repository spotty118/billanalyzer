
import { parseVerizonBill } from './parser';
import { BillData, VerizonBill } from './types';
import * as pdfjs from 'pdfjs-dist';

// Set the worker source for PDF.js
async function setupPdfWorker() {
  try {
    const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.mjs');
    pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;
  } catch (error) {
    console.error('Error loading PDF.js worker:', error);
    // Fallback to CDN if local worker fails
    pdfjs.GlobalWorkerOptions.workerSrc = 
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }
}

// Initialize the worker
setupPdfWorker();

/**
 * Extracts text content from a PDF file buffer
 */
async function extractTextFromPdf(pdfBuffer: Uint8Array): Promise<string[]> {
  try {
    // Load the PDF document
    const loadingTask = pdfjs.getDocument({ data: pdfBuffer });
    const pdf = await loadingTask.promise;
    
    const numPages = pdf.numPages;
    const pages: string[] = [];
    
    // Extract text from each page
    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      pages.push(pageText);
    }
    
    return pages;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    return [];
  }
}

/**
 * Convert a text representation of a bill (like a plain text file) to structured bill data
 */
export async function extractVerizonBillData(billText: Buffer): Promise<BillData | null> {
  try {
    const text = billText.toString('utf-8');
    
    // Extract account information
    const accountNumberMatch = /Account(?:\s+(?:number|#))?:?\s*(\d+[-\s]\d+(?:[-\s]\d+)?)/i.exec(text);
    const customerNameMatch = /(?:Customer(?:\s+Information)?|CUSTOMER)\s*:?\s*([A-Z][A-Z\s]+)(?=\n)/i.exec(text);
    const billingPeriodMatch = /Billing(?:\s+period|:)?\s*:?\s*([A-Za-z]+\s+\d+)\s*(?:-|to)\s*([A-Za-z]+\s+\d+,?\s*\d{4})/i.exec(text);
    
    // Extract bill summary
    const previousBalanceMatch = /Balance(?:\s+from)?\s+last\s+bill:?\s+\$?([\d,]+\.\d{2})/i.exec(text);
    const currentChargesMatch = /(?:This month(?:'s)?\s+charges|Current\s+charges):?\s+\$?([\d,]+\.\d{2})/i.exec(text);
    const totalDueMatch = /(?:Total\s+due|Total\s+Amount\s+Due)(?:\s+on\s+[A-Za-z]+\s+\d+)?:?\s+\$?([\d,]+\.\d{2})/i.exec(text);
    
    // Extract plan charges
    const planCharges: { description: string; amount: number }[] = [];
    const planChargeRegex = /([A-Za-z\s]+(?:Unlimited|Plan))\s+(?:[\w\s-]+\s+)?\$([\d,]+\.\d{2})/ig;
    let planMatch;
    while ((planMatch = planChargeRegex.exec(text)) !== null) {
      planCharges.push({
        description: planMatch[1].trim(),
        amount: parseFloat(planMatch[2].replace(/,/g, ''))
      });
    }
    
    // Extract equipment charges
    const equipmentCharges: { description: string; amount: number }[] = [];
    const equipmentChargeRegex = /((?:IPHONE|IPAD|Watch|Device(?:s)?)[^$\n]+)(?:.*?)Payment\s+\d+\s+of\s+\d+\s+\(\$[\d,\.]+\s+remaining\)(?:.*?)\$([\d,]+\.\d{2})/ig;
    let equipmentMatch;
    while ((equipmentMatch = equipmentChargeRegex.exec(text)) !== null) {
      equipmentCharges.push({
        description: equipmentMatch[1].trim(),
        amount: parseFloat(equipmentMatch[2].replace(/,/g, ''))
      });
    }
    
    // Extract taxes and fees
    const taxesAndFees: { description: string; amount: number }[] = [];
    const taxFeeRegex = /((?:AL State|Fed|Federal|Regulatory|Admin|Telco|County|City)[^$\n]+)(?:.*?)\$([\d,]+\.\d{2})/ig;
    let taxMatch;
    while ((taxMatch = taxFeeRegex.exec(text)) !== null) {
      taxesAndFees.push({
        description: taxMatch[1].trim(),
        amount: parseFloat(taxMatch[2].replace(/,/g, ''))
      });
    }
    
    // Extract phone numbers and usage data
    const usage: Record<string, any[]> = {};
    const phoneLineRegex = /(\d{3}-\d{3}-\d{4})/g;
    let phoneMatch;
    while ((phoneMatch = phoneLineRegex.exec(text)) !== null) {
      const phoneNumber = phoneMatch[1];
      // For each phone number, we'll assume a default usage
      // In a real implementation, you would extract actual usage data
      usage[phoneNumber] = [{
        data_usage: '15 GB', // Default value
        talk_minutes: '120',  // Default value
        text_count: '500'     // Default value
      }];
    }
    
    // Construct the bill data object
    const billData: BillData = {
      account_info: {
        account_number: accountNumberMatch ? accountNumberMatch[1].replace(/\s+/g, '-') : '',
        customer_name: customerNameMatch ? customerNameMatch[1].trim() : '',
        billing_period_start: billingPeriodMatch ? billingPeriodMatch[1] : '',
        billing_period_end: billingPeriodMatch ? billingPeriodMatch[2] : ''
      },
      bill_summary: {
        previous_balance: previousBalanceMatch ? parseFloat(previousBalanceMatch[1].replace(/,/g, '')) : 0,
        payments: 0, // This would need to be extracted
        current_charges: currentChargesMatch ? parseFloat(currentChargesMatch[1].replace(/,/g, '')) : 0,
        total_due: totalDueMatch ? parseFloat(totalDueMatch[1].replace(/,/g, '')) : 0
      },
      plan_charges: planCharges,
      equipment_charges: equipmentCharges,
      one_time_charges: [],
      taxes_and_fees: taxesAndFees,
      usage_details: usage
    };
    
    return billData;
  } catch (error) {
    console.error('Error parsing bill text:', error);
    return null;
  }
}

/**
 * Extract Verizon bill data from a PDF buffer
 */
export async function extractVerizonBill(pdfBuffer: Uint8Array): Promise<VerizonBill | null> {
  try {
    // Extract text from the PDF
    const pageTexts = await extractTextFromPdf(pdfBuffer);
    
    if (pageTexts.length === 0) {
      throw new Error('Failed to extract text from PDF.');
    }
    
    // Parse the bill
    const verizonBill = parseVerizonBill(pageTexts);
    
    return verizonBill;
  } catch (error) {
    console.error('Error extracting Verizon bill:', error);
    return null;
  }
}

/**
 * Analyze a bill using local parsing logic
 */
export async function analyzeBill(pdfBuffer: Uint8Array): Promise<BillData | null> {
  try {
    const pageTexts = await extractTextFromPdf(pdfBuffer);
    const billText = pageTexts.join(' ');
    
    return extractVerizonBillData(Buffer.from(billText));
  } catch (error) {
    console.error('Error analyzing bill:', error);
    return null;
  }
}
