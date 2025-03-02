
import React from 'react';
import { BillData, ChartSectionProps } from './types';
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
  return (
    <div className="space-y-8">
      <ChartSection billData={billData} />
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
