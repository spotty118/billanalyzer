
import { BillAnalysis } from './types';

// Simplify the utils file to just include what we actually need
export const formatCurrency = (value: number): string => {
  return `$${value.toFixed(2)}`;
};

// Chart data preparation utilities
export const prepareLineItemsData = (billAnalysis: BillAnalysis | null) => {
  if (!billAnalysis?.lineItems) return [];
  
  return billAnalysis.lineItems.map((line) => ({
    name: line.phoneNumber,
    total: line.totalCharge,
    plan: line.planCharge,
    device: line.devicePayment,
    taxes: 0 // We don't have this breakdown in our current LineItem type
  }));
};

export const prepareCategoryData = (billAnalysis: BillAnalysis | null) => {
  if (!billAnalysis?.summary) return [];
  
  return [
    { name: 'Plans', value: billAnalysis.summary.totalPlanCharges },
    { name: 'Devices', value: billAnalysis.summary.totalDevicePayments },
    { name: 'Fees', value: billAnalysis.summary.totalFees },
    { name: 'Taxes', value: billAnalysis.summary.totalTaxes }
  ];
};

export const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28DFF', '#FF6B6B'];
