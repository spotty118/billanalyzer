
import { useState, useCallback } from 'react';
import { BillTabs } from "@/components/bill-analyzer/BillTabs";
import { NetworkPreference } from './VerizonBillAnalyzer';

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
  networkPreference?: NetworkPreference;
}

const CustomBillTabs = ({ billData, calculateCarrierSavings, networkPreference, activeTab, onTabChange }: any) => {
  return (
    <BillTabs 
      billData={billData}
      calculateCarrierSavings={calculateCarrierSavings}
      networkPreference={networkPreference}
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
  networkPreference,
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
      {/* Removed the duplicate "Bill Analysis" heading that was here */}
      <CustomBillTabs 
        billData={billData} 
        calculateCarrierSavings={memoizedCalculateCarrierSavings}
        networkPreference={networkPreference}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
    </div>
  );
}
