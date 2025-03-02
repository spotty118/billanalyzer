
import React from 'react';
import { formatCurrency } from './utils';

interface BillHeaderProps {
  accountNumber: string;
  billingPeriod: string;
  totalAmount: number;
}

const BillHeader: React.FC<BillHeaderProps> = ({ accountNumber, billingPeriod, totalAmount }) => {
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
};

export default BillHeader;
