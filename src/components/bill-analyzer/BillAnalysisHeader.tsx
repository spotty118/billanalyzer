
import React from 'react';

interface BillAnalysisHeaderProps {
  accountNumber: string;
  billingPeriod: string;
  totalAmount: number;
  formatCurrency: (value: number) => string;
}

export function BillAnalysisHeader({ 
  accountNumber, 
  billingPeriod, 
  totalAmount, 
  formatCurrency 
}: BillAnalysisHeaderProps) {
  return (
    <div className="bg-blue-600 p-6 rounded-t-lg text-white">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Verizon Bill Analysis</h1>
          <p className="text-blue-100">
            Account: {accountNumber} | Billing Period: {billingPeriod}
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold">{formatCurrency(totalAmount)}</div>
          <p className="text-blue-100">Total Amount Due</p>
        </div>
      </div>
    </div>
  );
}
