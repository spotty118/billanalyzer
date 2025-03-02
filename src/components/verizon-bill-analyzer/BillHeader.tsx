
import React from 'react';
import { BillData } from './types';
import { formatCurrency } from './utils';

interface BillHeaderProps {
  billData: BillData;
}

const BillHeader: React.FC<BillHeaderProps> = ({ billData }) => {
  return (
    <div className="bg-blue-600 p-6 rounded-t-lg text-white">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Verizon Bill Analysis</h1>
          <p className="text-blue-100">
            Account: {billData.accountNumber} | Billing Period: {billData.billingPeriod}
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold">{formatCurrency(billData.totalAmount)}</div>
          <p className="text-blue-100">Total Amount Due</p>
        </div>
      </div>
    </div>
  );
};

export default BillHeader;
