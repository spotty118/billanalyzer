
import { useState, useCallback } from 'react';
import { BillTabs } from "@/components/bill-analyzer/BillTabs";
import { NetworkPreference } from './VerizonBillAnalyzer';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

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
  console.log("CustomBillTabs - calculateCarrierSavings available:", !!calculateCarrierSavings);
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
  console.log("BillAnalyzerContent - calculateCarrierSavings available:", !!calculateCarrierSavings);

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
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
        <p className="text-gray-500 text-lg">No bill data available.</p>
        <p className="text-gray-400 mt-2">Please upload a bill to analyze.</p>
      </div>
    );
  }

  // Check if bill data is in processing state
  if (billData.status === "processing") {
    return (
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
        <h3 className="text-xl font-bold mb-4 text-gray-800">Processing Your Bill</h3>
        <Progress value={75} className="h-2 mb-6" />
        <p className="text-gray-500">Your bill is being analyzed with advanced AI technology.</p>
        <p className="text-gray-400 mt-2">This may take a moment...</p>
        <div className="mt-4 text-xs text-gray-400 max-w-md mx-auto">
          <Badge variant="outline" className="mb-2 flex items-center gap-1 text-green-600 bg-green-50 border-green-200 mx-auto">
            <ShieldCheck size={12} />
            Privacy Protected
          </Badge>
          <p>Your bill data is encrypted and will be automatically deleted after analysis.</p>
        </div>
      </div>
    );
  }

  // Check if the bill data has been privacy-protected
  const isPrivacyProtected = billData.privacyProtected || 
    (billData.accountInfo?.customerName === "Customer") || 
    (billData.accountInfo?.accountNumber?.includes("X"));

  return (
    <div className="container mx-auto py-8 max-w-7xl animate-fade-in">
      {isPrivacyProtected && (
        <div className="mb-4 flex justify-end">
          <Badge variant="outline" className="flex items-center gap-1 text-green-600 bg-green-50 border-green-200">
            <ShieldCheck size={12} />
            Personal Information Protected
          </Badge>
        </div>
      )}
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
