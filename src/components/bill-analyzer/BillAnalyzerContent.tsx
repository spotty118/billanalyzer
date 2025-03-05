
import { useState, useCallback } from 'react';
import { BillTabs } from "@/components/bill-analyzer/BillTabs";
import { NetworkPreference } from './VerizonBillAnalyzer';
import { useMediaQuery } from '@/hooks/use-media-query';

interface BillAnalyzerContentProps {
  billData: any;
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
  calculateCarrierSavings,
  networkPreference,
}: BillAnalyzerContentProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const isMobile = useMediaQuery("(max-width: 640px)");

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  // Ensure we're properly handling the carrier savings calculation by memoizing it
  const memoizedCalculateCarrierSavings = useCallback(
    (carrierId: string) => {
      console.log(`Calling calculateCarrierSavings for ${carrierId}`);
      // Call the provided function directly 
      return calculateCarrierSavings(carrierId);
    },
    [calculateCarrierSavings]
  );

  if (!billData) {
    return (
      <div className="bg-white p-4 sm:p-8 rounded-xl shadow-sm border border-gray-100 text-center">
        <p className="text-gray-500 text-lg">No bill data available.</p>
        <p className="text-gray-400 mt-2">Please upload a bill to analyze.</p>
      </div>
    );
  }

  return (
    <div className={`container mx-auto py-4 ${isMobile ? 'px-1' : 'py-8'} max-w-7xl animate-fade-in`}>
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
