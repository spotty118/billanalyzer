
import React from 'react';
import { BillData } from './types';
import ChartSection from './ChartSection';
import UsageInsights from './UsageInsights';
import CostAnalysis from './CostAnalysis';

interface BillSummaryTabProps {
  billData: BillData;
  expandedSection: string;
  toggleSectionExpansion: (section: string) => void;
}

const BillSummaryTab: React.FC<BillSummaryTabProps> = ({ 
  billData, 
  expandedSection, 
  toggleSectionExpansion 
}) => {
  // Create a compatible summary object for ChartSection
  const billSummary = {
    totalDevicePayments: billData.chargesByCategory.devices,
    totalPlanCharges: billData.chargesByCategory.plans,
    totalFees: billData.chargesByCategory.surcharges,
    totalTaxes: billData.chargesByCategory.taxes,
    grandTotal: billData.totalAmount
  };

  return (
    <div className="space-y-8">
      <ChartSection summary={billSummary} />
      <UsageInsights billData={billData} />
      <CostAnalysis 
        billData={billData} 
        expandedSection={expandedSection} 
        toggleSectionExpansion={toggleSectionExpansion} 
      />
    </div>
  );
};

export default BillSummaryTab;
