
import type { VerizonBill, LineItem, CallActivity } from './types';

// Supported date formats for flexible parsing
const DATE_FORMATS = [
  // Standard US format: Jan 15, 2023
  /([A-Za-z]+)\s+(\d{1,2})(?:,|\s)\s*(\d{4})/,
  // Short format: Jan 15
  /([A-Za-z]+)\s+(\d{1,2})/,
  // Numeric format: MM/DD/YYYY
  /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
  // Numeric short format: MM/DD
  /(\d{1,2})\/(\d{1,2})/
];

// Trim memory usage by processing chunks of the document
const PROCESSING_CHUNK_SIZE = 1000; // lines per chunk

export class VerizonBillParser {
  private pdfText: string[];
  private bill: VerizonBill;
  private memoryUsage: number = 0;

  constructor(pdfText: string[]) {
    this.pdfText = pdfText;
    this.bill = {
      accountInfo: {
        accountNumber: '',
        customerName: '',
        billingPeriod: {
          start: '',
          end: '',
        },
        billDate: '',
        invoiceNumber: '',
      },
      billSummary: {
        previousBalance: 0,
        payments: 0,
        lateFee: 0,
        currentCharges: 0,
        totalDue: 0,
        dueDate: '',
      },
      lineItems: [],
      callActivity: [],
    };
  }

  private parseAmount(amountStr: string): number {
    if (!amountStr) {
      return 0;
    }
    
    try {
      // Remove currency symbols, commas, and handle both period and comma as decimal separators
      // This accommodates various international currency formats
      
      // First, identify if we're dealing with European format (e.g., 1.234,56 €)
      const isEuropeanFormat = /\d+\.\d+,\d+/.test(amountStr) || amountStr.includes('€');
      
      if (isEuropeanFormat) {
        // European format: replace dots with empty string (for thousands) and commas with dots (for decimals)
        return parseFloat(amountStr.replace(/[^0-9,.]/g, '')
                                  .replace(/\./g, '')
                                  .replace(/,/g, '.'));
      } else {
        // US/Standard format: simply remove currency symbols and commas
        return parseFloat(amountStr.replace(/[^0-9.]/g, ''));
      }
    } catch (error) {
      console.error(`Error parsing amount string: "${amountStr}"`, error);
      return 0;
    }
  }
  
  /**
   * Parse date strings in various formats and standardize the output
   * @param dateStr - The date string to parse
   * @returns A standardized date string in the format "Month DD, YYYY" or the original if parsing fails
   */
  private parseDate(dateStr: string): string {
    if (!dateStr) {
      return '';
    }
    
    try {
      // Try to create a Date object from the string and format it consistently
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('en-US', { 
          month: 'long', 
          day: 'numeric', 
          year: 'numeric' 
        });
      }
      return dateStr; // Return original string if parsing fails
    } catch {
      return dateStr; // Return original string on error
    }
  }

  private parseAccountInfo(): void {
    for (let i = 0; i < Math.min(3, this.pdfText.length); i++) {
      const pageText = this.pdfText[i];
      
      const accountNumberMatch = /Account(?:\s+number|:)\s*(\d+-\d+)/i.exec(pageText);
      if (accountNumberMatch) {
        this.bill.accountInfo.accountNumber = accountNumberMatch[1];
      }
      
      const invoiceMatch = /Invoice(?:\s+number|:)\s*(\d+)/i.exec(pageText);
      if (invoiceMatch) {
        this.bill.accountInfo.invoiceNumber = invoiceMatch[1];
      }

      // Updated regex to capture more date format variations
      const billingPeriodMatch = /Bill(?:ing)?\s+period(?::)?\s*((?:[A-Za-z]+\s+\d{1,2}|\d{1,2}\/\d{1,2})(?:,|\s)?\s*(?:\d{4})?)\s*(?:[-–—]|to)\s*((?:[A-Za-z]+\s+\d{1,2}|\d{1,2}\/\d{1,2})(?:,|\s)?\s*\d{4})/i.exec(pageText);
      
      if (billingPeriodMatch) {
        this.bill.accountInfo.billingPeriod.start = this.parseDate(billingPeriodMatch[1]);
        this.bill.accountInfo.billingPeriod.end = this.parseDate(billingPeriodMatch[2]);
      } else {
        // Try alternative formats if standard pattern fails
        const altPeriodMatch = /(?:cycle|period|dates)(?:\s+from|:)?\s*((?:[A-Za-z]+\s+\d{1,2}|\d{1,2}\/\d{1,2})(?:,|\s)?\s*(?:\d{4})?)\s*(?:through|to|[–—]|-)\s*((?:[A-Za-z]+\s+\d{1,2}|\d{1,2}\/\d{1,2})(?:,|\s)?\s*\d{4})/i.exec(pageText);
        if (altPeriodMatch) {
          this.bill.accountInfo.billingPeriod.start = this.parseDate(altPeriodMatch[1]);
          this.bill.accountInfo.billingPeriod.end = this.parseDate(altPeriodMatch[2]);
        }
      }
      
      const billDateMatch = /Bill date(?::)?\s*((?:[A-Za-z]+\s+\d{1,2}|\d{1,2}\/\d{1,2})(?:,|\s)?\s*\d{4})/i.exec(pageText);
      if (billDateMatch) {
        this.bill.accountInfo.billDate = this.parseDate(billDateMatch[1]);
      }

      if (!this.bill.accountInfo.customerName) {
        const lines = pageText.split('\n');
        for (let j = 0; j < 20 && j < lines.length; j++) {
          if (/^[A-Z][A-Z\s]+$/.test(lines[j].trim()) && 
              !/(ACCOUNT|INVOICE|BILL|VERIZON|PO BOX|KEYLINE)/i.test(lines[j])) {
            this.bill.accountInfo.customerName = lines[j].trim();
            break;
          }
        }
      }
    }
  }

  private parseBillSummary(): void {
    for (let i = 0; i < Math.min(3, this.pdfText.length); i++) {
      const pageText = this.pdfText[i];
      
      const previousBalanceMatch = /Balance from last bill\s*\$\s*([\d,.]+)/i.exec(pageText);
      if (previousBalanceMatch) {
        this.bill.billSummary.previousBalance = this.parseAmount(previousBalanceMatch[1]);
      }
      
      const lateFeesMatch = /Late fee\s*\$\s*([\d,\.]+)/i.exec(pageText);
      if (lateFeesMatch) {
        this.bill.billSummary.lateFee = this.parseAmount(lateFeesMatch[1]);
      }
      
      const currentChargesMatch = /This month(?:'s)? charges\s*\$\s*([\d,.]+)/i.exec(pageText);
      if (currentChargesMatch) {
        this.bill.billSummary.currentCharges = this.parseAmount(currentChargesMatch[1]);
      }
      
      const totalDueMatch = /Total due(?: on ([A-Za-z]+ \d+))?\s*\$\s*([\d,.]+)/i.exec(pageText);
      if (totalDueMatch) {
        if (totalDueMatch[1]) {
          this.bill.billSummary.dueDate = totalDueMatch[1];
        }
        this.bill.billSummary.totalDue = this.parseAmount(totalDueMatch[2]);
      }
    }
  }

  private parseLineItems(): void {
    // Find the bill summary by line section
    let billSummarySection = '';
    for (let i = 0; i < this.pdfText.length; i++) {
      if (this.pdfText[i]?.includes('Bill summary by line')) {
        billSummarySection = this.pdfText[i];
        break;
      }
    }
    
    if (!billSummarySection) return;
    
    const lines = billSummarySection.split('\n');
    let currentItem: LineItem | null = null;
    let lineIndex = 0;
    
    // Process the file in chunks to manage memory better
    while (lineIndex < lines.length) {
      const endIndex = Math.min(lineIndex + PROCESSING_CHUNK_SIZE, lines.length);
      const chunk = lines.slice(lineIndex, endIndex);
      
      currentItem = this.processLineItemsChunk(chunk, currentItem);
      
      // Free processed chunk from memory
      chunk.length = 0;
      this.memoryUsage++;
      
      // Allow optional GC hint on very large files
      if (this.memoryUsage % 10 === 0) {
        setTimeout(() => {}, 0);
      }
      
      lineIndex = endIndex;
    }
    
    // Add final item if exists
    if (currentItem) {
      this.bill.lineItems.push(currentItem);
    }
    
    // Clear original lines from memory
    lines.length = 0;
  }
  
  /**
   * Process a chunk of text lines to extract line items
   */
  private processLineItemsChunk(lines: string[], currentItem: LineItem | null): LineItem | null {
    let result = currentItem;
    
    for (const line of lines) {
      const lineItemMatch = /^([A-Za-z\s]+)?\s*(Apple\s+[^\s]+)?\s*\((\d{3}-\d{3}-\d{4})(?: - Number Share)?\)\s*\$\s*([\d,\.]+)$/.exec(line.trim());
      
      if (standardMatch) {
        if (result) {
          this.bill.lineItems.push(result);
        }
        
        result = {
          owner: (standardMatch[1] || '').trim(),
          deviceType: (standardMatch[2] || '').trim(),
          phoneNumber: `${standardMatch[3]}-${standardMatch[4]}-${standardMatch[5]}`,
          totalAmount: this.parseAmount(standardMatch[6] || '0'),
          planCharges: [],
          deviceCharges: [],
          servicesCharges: [],
          surcharges: [],
          taxes: []
        };
      }
    }
    
    if (currentItem) {
      this.bill.lineItems.push(currentItem);
    }
  }

  private parseCallActivity(): void {
    for (let i = 0; i < this.pdfText.length; i++) {
      const pageText = this.pdfText[i];
      if (!pageText?.includes('Talk activity')) continue;

      const phoneMatch = /(\d{3}-\d{3}-\d{4})\s+(Apple\s+[^\n]+)/i.exec(pageText);
      if (!phoneMatch) continue;

      const activity: CallActivity = {
        phoneNumber: phoneMatch[1],
        deviceType: phoneMatch[2].trim(),
        calls: []
      };

      const callLines = pageText.split('\n');
      for (const line of callLines) {
        const callMatch = /^([A-Za-z]+ \d+(?:,?\s*\d{4})?)\s+(\d+:\d+(?:\s*[AP]M)?)\s+(\+?1?\d+[^\s]*)\s+([^-]+)\s+([^-]+)\s+(\d+)\s*/
          .exec(line.trim());
        
        if (callMatch) {
          const [, dateStr, timeStr, number, origination, destination, minutes] = callMatch;
          const callDate = this.parseDate(dateStr);
          const timeText = timeStr.includes('M') ? timeStr : 
            `${timeStr} ${parseInt(timeStr.split(':')[0]) >= 12 ? 'PM' : 'AM'}`;
          
          activity.calls.push({
            date: callDate,
            time: timeText,
            number,
            origination: origination?.trim() || 'Unknown',
            destination: destination.trim(),
            minutes: parseInt(minutes, 10)
          });
        }
      }

      if (activity.calls.length > 0) {
        this.bill.callActivity.push(activity);
      }
    }
  }

  public parse(): VerizonBill {
    this.parseAccountInfo();
    this.parseBillSummary();
    this.parseLineItems();
    this.parseCallActivity();
    return this.bill;
  }
}

export function parseVerizonBill(pdfText: string[]): VerizonBill {
  const parser = new VerizonBillParser(pdfText);
  return parser.parse();
}
