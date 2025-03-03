
import React, { useState } from 'react';
import { BillAnalysisHeader } from './BillAnalysisHeader';
import { BillTabs } from './BillTabs';
import { BillSummary } from './BillSummary';
import { LineDetails } from './LineDetails';
import { RecommendationsTab } from './RecommendationsTab';
import { CarrierComparison } from './CarrierComparison';
import { prepareLineItemsData, prepareCategoryData } from './utils/chartDataUtils';
import { formatCurrency } from './utils/dataUtils';

interface BillAnalyzerContentProps {
  billData: any;
  calculateCarrierSavings: (carrierId: string) => any;
}

export function BillAnalyzerContent({ 
  billData, 
  calculateCarrierSavings 
}: BillAnalyzerContentProps) {
  const [activeTab, setActiveTab] = useState('summary');
  const [expandedLine, setExpandedLine] = useState<number | null>(null);
  const [expandedSection, setExpandedSection] = useState('charges');
  const [showCarrierComparison, setShowCarrierComparison] = useState(false);
  const [activeCarrierTab, setActiveCarrierTab] = useState('usmobile');

  const toggleLineExpansion = (index: number) => {
    if (expandedLine === index) {
      setExpandedLine(null);
    } else {
      setExpandedLine(index);
    }
  };

  const toggleSectionExpansion = (section: string) => {
    if (expandedSection === section) {
      setExpandedSection('');
    } else {
      setExpandedSection(section);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'alternatives') {
      setShowCarrierComparison(true);
    }
  };

  const handleCompareCarriers = () => {
    setActiveTab('alternatives');
    setShowCarrierComparison(true);
  };

  function prepareCurrentLineItemsData() {
    return prepareLineItemsData(billData?.phoneLines);
  }

  function prepareCurrentCategoryData() {
    return prepareCategoryData(billData?.chargesByCategory);
  }

  return (
    <div className="flex flex-col">
      <BillAnalysisHeader 
        accountNumber={billData.accountNumber}
        billingPeriod={billData.billingPeriod}
        totalAmount={billData.totalAmount}
        formatCurrency={formatCurrency}
      />
      
      <BillTabs 
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
      
      <div className="p-6">
        {activeTab === 'summary' && (
          <BillSummary 
            billData={billData}
            expandedSection={expandedSection}
            toggleSectionExpansion={toggleSectionExpansion}
            formatCurrency={formatCurrency}
            prepareLineItemsData={prepareCurrentLineItemsData}
            prepareCategoryData={prepareCurrentCategoryData}
            onCompareCarriers={handleCompareCarriers}
          />
        )}
        
        {activeTab === 'lines' && (
          <LineDetails 
            phoneLines={billData.phoneLines}
            expandedLine={expandedLine}
            toggleLineExpansion={toggleLineExpansion}
            formatCurrency={formatCurrency}
          />
        )}
        
        {activeTab === 'recommendations' && (
          <RecommendationsTab 
            planRecommendation={billData.planRecommendation}
            formatCurrency={formatCurrency}
          />
        )}

        {activeTab === 'alternatives' && showCarrierComparison && (
          <CarrierComparison 
            billData={billData}
            activeCarrierTab={activeCarrierTab}
            setActiveCarrierTab={setActiveCarrierTab}
            calculateCarrierSavings={calculateCarrierSavings}
            formatCurrency={formatCurrency}
          />
        )}
      </div>
    </div>
  );
}
