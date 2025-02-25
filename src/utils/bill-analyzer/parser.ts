
import type { VerizonBill } from './types';

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

  // ... paste the rest of the parser methods here, from the VerizonBillParser class

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
