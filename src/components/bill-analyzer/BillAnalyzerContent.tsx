import React, { useState, useCallback } from 'react';
import { BillTabs } from "@/components/bill-analyzer/BillTabs";
import { calculateCarrierSavings } from "@/components/bill-analyzer/utils/dataUtils";

interface BillAnalyzerContentProps {
  billData: any;
  alternativeCarrierPlans: any[];
  getCarrierPlanPrice: (plan: any, numberOfLines: number) => number;
  findBestCarrierMatch: (planName: string, carrierId: string) => string;
}

const CustomBillTabs = ({ billData, calculateCarrierSavings }: any) => {
  const [activeTab, setActiveTab] = useState("overview");
  
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };
  
  return (
    <BillTabs 
      billData={billData}
      calculateCarrierSavings={calculateCarrierSavings}
      activeTab={activeTab}
      onTabChange={handleTabChange}
    />
  );
};

export function BillAnalyzerContent({
  billData,
  alternativeCarrierPlans,
  getCarrierPlanPrice,
  findBestCarrierMatch,
}: BillAnalyzerContentProps) {

  const memoizedCalculateCarrierSavings = useCallback(
    (carrierId: string) =>
      calculateCarrierSavings(
        carrierId,
        billData,
        getCarrierPlanPrice,
        findBestCarrierMatch,
        alternativeCarrierPlans
      ),
    [billData, alternativeCarrierPlans, getCarrierPlanPrice, findBestCarrierMatch]
  );

  if (!billData) {
    return <div>No bill data available.</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Bill Analysis</h1>
      <CustomBillTabs 
        billData={billData} 
        calculateCarrierSavings={memoizedCalculateCarrierSavings} 
      />
    </div>
  );
}
