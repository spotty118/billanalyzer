
import type { VerizonBill, LineItem, CallActivity } from './types';

export class VerizonBillParser {
  private pdfText: string[];
  private bill: VerizonBill;

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
    if (!amountStr) return 0;
    return parseFloat(amountStr.replace(/[$,]/g, ''));
  }

  private parseAccountInfo(): void {
    for (let i = 0; i < Math.min(3, this.pdfText.length); i++) {
      const pageText = this.pdfText[i];
      
      const accountNumberMatch = /Account(?:\s+number|\:)\s*(\d+\-\d+)/i.exec(pageText);
      if (accountNumberMatch) {
        this.bill.accountInfo.accountNumber = accountNumberMatch[1];
      }
      
      const invoiceMatch = /Invoice(?:\s+number|\:)\s*(\d+)/i.exec(pageText);
      if (invoiceMatch) {
        this.bill.accountInfo.invoiceNumber = invoiceMatch[1];
      }

      const billingPeriodMatch = /Bill(?:ing)?\s+period(?:\:)?\s*([A-Za-z]+\s+\d+)\s*\-\s*([A-Za-z]+\s+\d+,?\s*\d{4})/i.exec(pageText);
      if (billingPeriodMatch) {
        this.bill.accountInfo.billingPeriod.start = billingPeriodMatch[1];
        this.bill.accountInfo.billingPeriod.end = billingPeriodMatch[2];
      }
      
      const billDateMatch = /Bill date(?:\:)?\s*([A-Za-z]+\s+\d+,?\s*\d{4})/i.exec(pageText);
      if (billDateMatch) {
        this.bill.accountInfo.billDate = billDateMatch[1];
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
      
      const previousBalanceMatch = /Balance from last bill\s*\$\s*([\d,\.]+)/i.exec(pageText);
      if (previousBalanceMatch) {
        this.bill.billSummary.previousBalance = this.parseAmount(previousBalanceMatch[1]);
      }
      
      const lateFeeMatch = /Late fee\s*\$\s*([\d,\.]+)/i.exec(pageText);
      if (lateFeeMatch) {
        this.bill.billSummary.lateFee = this.parseAmount(lateFeeMatch[1]);
      }
      
      const currentChargesMatch = /This month(?:'s)? charges\s*\$\s*([\d,\.]+)/i.exec(pageText);
      if (currentChargesMatch) {
        this.bill.billSummary.currentCharges = this.parseAmount(currentChargesMatch[1]);
      }
      
      const totalDueMatch = /Total due(?: on ([A-Za-z]+ \d+))?\s*\$\s*([\d,\.]+)/i.exec(pageText);
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
      if (this.pdfText[i].includes('Bill summary by line')) {
        billSummarySection = this.pdfText[i];
        break;
      }
    }
    
    if (!billSummarySection) return;
    
    const lines = billSummarySection.split('\n');
    let currentItem: LineItem | null = null;
    
    for (const line of lines) {
      // Match lines like: "Christopher Adams Apple iPhone 15 Pro Max (251-747-0017) $40.78"
      const lineItemMatch = /^([A-Za-z\s]+)?\s*(Apple\s+[^\s]+)?\s*\((\d{3}-\d{3}-\d{4})(?: - Number Share)?\)\s*\$\s*([\d,\.]+)$/.exec(line.trim());
      
      if (lineItemMatch) {
        if (currentItem) {
          this.bill.lineItems.push(currentItem);
        }
        
        currentItem = {
          owner: lineItemMatch[1]?.trim() || '',
          deviceType: lineItemMatch[2]?.trim() || '',
          phoneNumber: lineItemMatch[3],
          totalAmount: this.parseAmount(lineItemMatch[4]),
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
    
    // Now parse detailed charges for each line item
    for (let i = 0; i < this.pdfText.length; i++) {
      if (this.pdfText[i].includes('Charges by line details')) {
        const detailsText = this.pdfText.slice(i).join(' ');
        
        // Process each line item
        for (const lineItem of this.bill.lineItems) {
          // Find section for this phone number
          const phoneRegex = new RegExp(`${lineItem.phoneNumber}[\\s\\S]*?(?=\\d{3}-\\d{3}-\\d{4}|$)`, 'i');
          const phoneSection = phoneRegex.exec(detailsText);
          
          if (phoneSection) {
            const sectionText = phoneSection[0];
            
            // Parse plan charges
            const planMatch = /Plan\s*([^\$]+)\s*\$\s*([\d,\.]+)/ig;
            let match;
            while ((match = planMatch.exec(sectionText)) !== null) {
              lineItem.planCharges.push({
                description: match[1].trim(),
                amount: this.parseAmount(match[2]),
              });
            }
            
            // Parse device charges
            const deviceMatch = /Devices\s*([^\$]+)Payment\s+\d+\s+of\s+\d+\s+\(\$[\d,\.]+\s+remaining\)(?:[^\$]*)\$\s*([\d,\.]+)/ig;
            while ((match = deviceMatch.exec(sectionText)) !== null) {
              lineItem.deviceCharges.push({
                description: match[1].trim(),
                amount: this.parseAmount(match[2]),
              });
            }
            
            // Parse services charges
            const serviceMatch = /Services\s+&\s+perks\s*([^\$]+)\s*\$\s*([\d,\.]+)/ig;
            while ((match = serviceMatch.exec(sectionText)) !== null) {
              lineItem.servicesCharges.push({
                description: match[1].trim(),
                amount: this.parseAmount(match[2]),
              });
            }
            
            // Parse surcharges
            const surchargeMatch = /Surcharges\s*([^\$]+)\s*\$\s*([\d,\.]+)/ig;
            while ((match = surchargeMatch.exec(sectionText)) !== null) {
              lineItem.surcharges.push({
                description: match[1].trim(),
                amount: this.parseAmount(match[2]),
              });
            }
            
            // Parse taxes
            const taxMatch = /Taxes\s+&\s+gov\s+fees\s*([^\$]+)\s*\$\s*([\d,\.]+)/ig;
            while ((match = taxMatch.exec(sectionText)) !== null) {
              lineItem.taxes.push({
                description: match[1].trim(),
                amount: this.parseAmount(match[2]),
              });
            }
          }
        }
        
        break;
      }
    }
  }

  private parseCallActivity(): void {
    for (let i = 0; i < this.pdfText.length; i++) {
      if (this.pdfText[i].includes('Talk activity')) {
        const phoneMatch = /(\d{3}-\d{3}-\d{4})\s+(Apple\s+[^\n]+)/i.exec(this.pdfText[i]);
        if (phoneMatch) {
          const activity: CallActivity = {
            phoneNumber: phoneMatch[1],
            deviceType: phoneMatch[2].trim(),
            calls: []
          };

          const callLines = this.pdfText[i].split('\n');
          for (const line of callLines) {
            const callMatch = /^([A-Za-z]+ \d+)\s+(\d+:\d+ [AP]M)\s+(\d+[^\s]*)\s+([^-]+)\s+([^-]+)\s+(\d+)\s+/.exec(line.trim());
            if (callMatch) {
              activity.calls.push({
                date: callMatch[1],
                time: callMatch[2],
                number: callMatch[3],
                origination: callMatch[4].trim(),
                destination: callMatch[5].trim(),
                minutes: parseInt(callMatch[6], 10)
              });
            }
          }

          if (activity.calls.length > 0) {
            this.bill.callActivity.push(activity);
          }
        }
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
