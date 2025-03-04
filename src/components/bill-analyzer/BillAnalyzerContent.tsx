
import { useState, useCallback } from 'react';
import { BillTabs } from "@/components/bill-analyzer/BillTabs";

interface BillAnalyzerContentProps {
  billData: any;
  alternativeCarrierPlans?: any[];
  getCarrierPlanPrice?: (plan: any, numberOfLines: number) => number;
  findBestCarrierMatch?: (planName: string, carrierId: string) => string;
  calculateCarrierSavings: (carrierId: string) => {
    monthlySavings: number;
    annualSavings: number;
    planName: string;
    price: number;
  };
}

const CustomBillTabs = ({ billData, calculateCarrierSavings, activeTab, onTabChange }: any) => {
  return (
    <BillTabs 
      billData={billData}
      calculateCarrierSavings={calculateCarrierSavings}
      activeTab={activeTab}
      onTabChange={onTabChange}
    />
  );
};

export function BillAnalyzerContent({
  billData,
  alternativeCarrierPlans,
  getCarrierPlanPrice,
  findBestCarrierMatch,
  calculateCarrierSavings,
}: BillAnalyzerContentProps) {
  const [activeTab, setActiveTab] = useState("overview");

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const memoizedCalculateCarrierSavings = useCallback(
    (carrierId: string) => {
      if (alternativeCarrierPlans && getCarrierPlanPrice && findBestCarrierMatch) {
        return calculateCarrierSavings(
          carrierId
        );
      }
      return calculateCarrierSavings(carrierId);
    },
    [billData, alternativeCarrierPlans, getCarrierPlanPrice, findBestCarrierMatch, calculateCarrierSavings]
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
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
    </div>
  );
}
