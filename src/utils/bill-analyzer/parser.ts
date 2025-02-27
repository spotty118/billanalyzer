import type { VerizonBill, LineItem, CallActivity } from './types';

// Constants for parsing
const PROCESSING_CHUNK_SIZE = 1000; // lines per chunk
const MAX_PAGES_TO_SCAN = 100; // Prevent infinite loops on corrupted files
const PROCESSING_TIMEOUT = 30000; // 30 seconds timeout for processing

export class VerizonBillParser {
  private pdfText: string[];
  private bill: VerizonBill;
  private memoryUsage: number = 0;

  constructor(pdfText: string[]) {
    if (!Array.isArray(pdfText)) {
      throw new Error('Invalid PDF text input');
    }
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
      const isEuropeanFormat = /\d+\.\d+,\d+/.test(amountStr) || amountStr.includes('€');
      
      if (isEuropeanFormat) {
        // European format: replace dots with empty string (for thousands) and commas with dots (for decimals)
        return parseFloat(amountStr.replace(/[^0-9,.]/g, '')
                                  .replace(/\./g, '')
                                  .replace(/,/g, '.')) || 0;
      } else {
        // US/Standard format: simply remove currency symbols and commas
        return parseFloat(amountStr.replace(/[^0-9.]/g, '')) || 0;
      }
    } catch (error) {
      console.error(`Error parsing amount string: "${amountStr}"`, error);
      return 0;
    }
  }

  private parseDate(dateStr: string): string {
    if (!dateStr?.trim()) {
      return '';
    }

    const patterns: Array<{ regex: RegExp; parse: (match: RegExpExecArray) => Date | null }> = [
      {
        // Jan 15, 2023
        regex: /([A-Za-z]+)\s+(\d{1,2})(?:,|\s)\s*(\d{4})/,
        parse: (match) => {
          try {
            const month = new Date(`${match[1]} 1, 2000`).getMonth();
            const day = parseInt(match[2], 10);
            const year = parseInt(match[3], 10);
            return new Date(year, month, day);
          } catch {
            return null;
          }
        }
      },
      {
        // 01/15/2023
        regex: /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
        parse: (match) => {
          try {
            const month = parseInt(match[1], 10) - 1;
            const day = parseInt(match[2], 10);
            const year = parseInt(match[3], 10);
            return new Date(year, month, day);
          } catch {
            return null;
          }
        }
      },
      {
        // Jan 15
        regex: /([A-Za-z]+)\s+(\d{1,2})/,
        parse: (match) => {
          try {
            const month = new Date(`${match[1]} 1, 2000`).getMonth();
            const day = parseInt(match[2], 10);
            const year = new Date().getFullYear();
            return new Date(year, month, day);
          } catch {
            return null;
          }
        }
      }
    ];

    try {
      // Try each pattern
      for (const { regex, parse } of patterns) {
        const match = regex.exec(dateStr);
        if (match) {
          const date = parse(match);
          if (date && !isNaN(date.getTime())) {
            return date.toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            });
          }
        }
      }

      // Last resort: try native Date parsing
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        });
      }
    } catch (error) {
      console.warn(`Error parsing date "${dateStr}":`, error);
    }

    return ''; // Return empty string for unparseable dates
  }

  private safeExec(text: string | undefined | null, regex: RegExp): RegExpExecArray | null {
    try {
      return text ? regex.exec(text.toString()) : null;
    } catch {
      return null;
    }
  }

  private parseAccountInfo(): void {
    try {
      // Only process first few pages for efficiency
      const pagesToCheck = Math.min(3, this.pdfText.length);
      for (let i = 0; i < pagesToCheck; i++) {
        const pageText = this.pdfText[i];
        if (!pageText) continue;
        
        const accountNumberMatch = this.safeExec(pageText, /Account(?:\s+number|:)\s*(\d+-\d+)/i);
        if (accountNumberMatch?.[1]) {
          this.bill.accountInfo.accountNumber = accountNumberMatch[1];
        }
        
        const invoiceMatch = this.safeExec(pageText, /Invoice(?:\s+number|:)\s*(\d+)/i);
        if (invoiceMatch?.[1]) {
          this.bill.accountInfo.invoiceNumber = invoiceMatch[1];
        }

        const billingPeriodMatch = this.safeExec(
          pageText,
          /Bill(?:ing)?\s+period(?::)?\s*((?:[A-Za-z]+\s+\d{1,2}|\d{1,2}\/\d{1,2})(?:,|\s)?\s*(?:\d{4})?)\s*(?:[-–—]|to)\s*((?:[A-Za-z]+\s+\d{1,2}|\d{1,2}\/\d{1,2})(?:,|\s)?\s*\d{4})/i
        );
        
        if (billingPeriodMatch) {
          this.bill.accountInfo.billingPeriod.start = this.parseDate(billingPeriodMatch[1]);
          this.bill.accountInfo.billingPeriod.end = this.parseDate(billingPeriodMatch[2]);
        }

        const billDateMatch = this.safeExec(
          pageText,
          /Bill date(?::)?\s*((?:[A-Za-z]+\s+\d{1,2}|\d{1,2}\/\d{1,2})(?:,|\s)?\s*\d{4})/i
        );
        if (billDateMatch?.[1]) {
          this.bill.accountInfo.billDate = this.parseDate(billDateMatch[1]);
        }

        if (!this.bill.accountInfo.customerName) {
          let lines: string[] = [];
          try {
            lines = pageText.split('\n');
            const linesToCheck = Math.min(20, lines.length);
            for (let j = 0; j < linesToCheck; j++) {
              const line = lines[j]?.trim();
              if (line && /^[A-Z][A-Z\s]+$/.test(line) && 
                  !/(ACCOUNT|INVOICE|BILL|VERIZON|PO BOX|KEYLINE)/i.test(line)) {
                this.bill.accountInfo.customerName = line;
                break;
              }
            }
          } finally {
            lines.length = 0; // Clear array reference
          }
        }
      }
    } catch (error) {
      console.error('Error parsing account info:', error);
    }
  }

  private parseBillSummary(): void {
    try {
      const pagesToCheck = Math.min(3, this.pdfText.length);
      for (let i = 0; i < pagesToCheck; i++) {
        const pageText = this.pdfText[i];
        if (!pageText) continue;
        
        const previousBalanceMatch = this.safeExec(pageText, /Balance from last bill\s*\$\s*([\d,.]+)/i);
        if (previousBalanceMatch?.[1]) {
          this.bill.billSummary.previousBalance = this.parseAmount(previousBalanceMatch[1]);
        }
        
        const lateFeesMatch = this.safeExec(pageText, /Late fee\s*\$\s*([\d,.]+)/i);
        if (lateFeesMatch?.[1]) {
          this.bill.billSummary.lateFee = this.parseAmount(lateFeesMatch[1]);
        }
        
        const currentChargesMatch = this.safeExec(pageText, /This month(?:'s)? charges\s*\$\s*([\d,.]+)/i);
        if (currentChargesMatch?.[1]) {
          this.bill.billSummary.currentCharges = this.parseAmount(currentChargesMatch[1]);
        }
        
        const totalDueMatch = this.safeExec(pageText, /Total due(?: on ([A-Za-z]+ \d+))?\s*\$\s*([\d,.]+)/i);
        if (totalDueMatch) {
          if (totalDueMatch[1]) {
            this.bill.billSummary.dueDate = totalDueMatch[1];
          }
          if (totalDueMatch[2]) {
            this.bill.billSummary.totalDue = this.parseAmount(totalDueMatch[2]);
          }
        }
      }
    } catch (error) {
      console.error('Error parsing bill summary:', error);
    }
  }

  private findBillSummarySection(): string {
    let result = '';
    for (let i = 0; i < Math.min(MAX_PAGES_TO_SCAN, this.pdfText.length); i++) {
      if (this.pdfText[i]?.includes('Bill summary by line')) {
        result = this.pdfText[i];
        break;
      }
    }
    return result;
  }

  private async parseLineItems(): Promise<void> {
    const startTime = Date.now();
    try {
      const billSummarySection = this.findBillSummarySection();
      if (!billSummarySection) return;
      
      const lines = billSummarySection.split('\n');
      let currentItem: LineItem | null = null;
      let lineIndex = 0;
      
      while (lineIndex < lines.length) {
        // Check for timeout
        if (Date.now() - startTime > PROCESSING_TIMEOUT) {
          console.warn('Line item processing timeout');
          break;
        }

        const endIndex = Math.min(lineIndex + PROCESSING_CHUNK_SIZE, lines.length);
        const chunk = lines.slice(lineIndex, endIndex);
        
        currentItem = this.processLineItemsChunk(chunk, currentItem);
        
        chunk.length = 0; // Clear processed chunk
        this.memoryUsage++;
        
        if (this.memoryUsage % 10 === 0) {
          // Use setTimeout for GC opportunity
          await new Promise(resolve => setTimeout(resolve, 0));
        }
        
        lineIndex = endIndex;
      }
      
      if (currentItem) {
        this.bill.lineItems.push(currentItem);
      }
      
      lines.length = 0; // Clear original array
    } catch (error) {
      console.error('Error parsing line items:', error);
    }
  }

  private processLineItemsChunk(lines: string[], currentItem: LineItem | null): LineItem | null {
    let result = currentItem;
    
    for (const line of lines) {
      const trimmedLine = line?.trim();
      if (!trimmedLine) continue;

      // Match standard format with owner and device info
      const standardMatch = this.safeExec(
        trimmedLine,
        /^(?:([A-Za-z][A-Za-z\s]+?)\s+)?(?:([A-Za-z]+(?:\s+[A-Za-z0-9]+)+)\s+)?(?:\+?1\s*)?(?:\()?(\d{3})(?:\)|[-\s])?(\d{3})[-\s]?(\d{4})\s*(?:-\s*(?:Number Share|Mobile Share|Additional Line))?\s*(?:\$\s*|:)?\s*([\d,.]+)$/
      );

      // Match alternative format for line numbers
      const altMatch = !standardMatch && this.safeExec(
        trimmedLine,
        /(?:Line|Phone|Number)(?:\s*#)?\s*(?:\d+)?\s*:?\s*(\d{3})[-.\s]?(\d{3})[-.\s]?(\d{4})\s*(?:\$\s*([\d,.]+))?/i
      );

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
      } else if (altMatch && !result) {
        result = {
          owner: '',
          deviceType: '',
          phoneNumber: `${altMatch[1]}-${altMatch[2]}-${altMatch[3]}`,
          totalAmount: altMatch[4] ? this.parseAmount(altMatch[4]) : 0,
          planCharges: [],
          deviceCharges: [],
          servicesCharges: [],
          surcharges: [],
          taxes: []
        };
      }
    }

    return result;
  }

  private parseCallActivity(): void {
    const startTime = Date.now();
    try {
      for (let i = 0; i < Math.min(MAX_PAGES_TO_SCAN, this.pdfText.length); i++) {
        if (Date.now() - startTime > PROCESSING_TIMEOUT) {
          console.warn('Call activity processing timeout');
          break;
        }

        const pageText = this.pdfText[i];
        if (!pageText?.includes('Talk activity')) continue;

        const phoneMatch = this.safeExec(pageText, /(\d{3}-\d{3}-\d{4})\s+(Apple\s+[^\n]+)/i);
        if (!phoneMatch?.[1] || !phoneMatch?.[2]) continue;

        const activity: CallActivity = {
          phoneNumber: phoneMatch[1],
          deviceType: phoneMatch[2].trim(),
          calls: []
        };

        const callLines = pageText.split('\n');
        try {
          for (const line of callLines) {
            const callMatch = this.safeExec(
              line.trim(),
              /^([A-Za-z]+ \d+(?:,?\s*\d{4})?)\s+(\d+:\d+(?:\s*[AP]M)?)\s+(\+?1?\d+[^\s]*)\s+([^-]+)\s+([^-]+)\s+(\d+)\s*/
            );
            
            if (callMatch) {
              const [, dateStr, timeStr, number, origination, destination, minutes] = callMatch;
              if (!dateStr || !timeStr || !number || !minutes) continue;

              const callDate = this.parseDate(dateStr);
              if (!callDate) continue;

              const timeText = timeStr.includes('M') ? timeStr : 
                `${timeStr} ${parseInt(timeStr.split(':')[0]) >= 12 ? 'PM' : 'AM'}`;
              
              activity.calls.push({
                date: callDate,
                time: timeText,
                number,
                origination: origination?.trim() || 'Unknown',
                destination: destination?.trim() || 'Unknown',
                minutes: parseInt(minutes, 10) || 0
              });
            }
          }
        } finally {
          callLines.length = 0; // Clear array reference
        }

        if (activity.calls.length > 0) {
          this.bill.callActivity.push(activity);
        }
      }
    } catch (error) {
      console.error('Error parsing call activity:', error);
    }
  }

  public async parse(): Promise<VerizonBill> {
    try {
      this.parseAccountInfo();
      this.parseBillSummary();
      await this.parseLineItems();
      this.parseCallActivity();
      return this.bill;
    } catch (error) {
      console.error('Error parsing bill:', error);
      throw new Error('Failed to parse bill: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }
}

export async function parseVerizonBill(pdfText: string[]): Promise<VerizonBill> {
  const parser = new VerizonBillParser(pdfText);
  return parser.parse();
}
