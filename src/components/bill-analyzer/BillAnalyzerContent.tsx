
import { useState, useCallback } from 'react';
import { BillTabs } from "@/components/bill-analyzer/BillTabs";
import { NetworkPreference } from './VerizonBillAnalyzer';
import { useMediaQuery } from '@/hooks/use-media-query';
import { formatCurrency } from './utils/dataUtils';

interface BillAnalyzerContentProps {
  billData: any;
  calculateCarrierSavings: (carrierId: string) => {
    monthlySavings: number;
    annualSavings: number;
    planName: string;
    price: number;
  };
  networkPreference?: NetworkPreference;
  carrierType?: string;
}

const CustomBillTabs = ({ billData, calculateCarrierSavings, networkPreference, carrierType, activeTab, onTabChange }: any) => {
  return (
    <BillTabs 
      billData={billData}
      calculateCarrierSavings={calculateCarrierSavings}
      networkPreference={networkPreference}
      carrierType={carrierType}
      activeTab={activeTab}
      onTabChange={onTabChange}
      formatCurrency={formatCurrency}
    />
  );
};

export function BillAnalyzerContent({
  billData,
  calculateCarrierSavings,
  networkPreference,
  carrierType = "verizon",
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
      <div className="card-gradient text-center">
        <p className="text-gray-500 text-lg">No bill data available.</p>
        <p className="text-gray-400 mt-2">Please upload a bill to analyze.</p>
      </div>
    );
  }

  return (
    <div className={`app-container ${isMobile ? 'px-1 py-2' : 'py-6 px-4'} animate-fade-in`}>
      <CustomBillTabs 
        billData={billData} 
        calculateCarrierSavings={memoizedCalculateCarrierSavings}
        networkPreference={networkPreference}
        carrierType={carrierType}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
    </div>
  );
}
