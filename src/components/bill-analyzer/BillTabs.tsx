
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OverviewTab } from "./OverviewTab";
import { LineItemsTab } from "./LineItemsTab";
import { RecommendationsTab } from "./RecommendationsTab";
import { CarrierComparison } from "./CarrierComparison";
import { formatCurrency } from "./utils/dataUtils";
import { NetworkPreference } from './VerizonBillAnalyzer';

interface BillTabsProps {
  billData: any;
  calculateCarrierSavings: (carrierId: string) => {
    monthlySavings: number;
    annualSavings: number;
    planName: string;
    price: number;
  };
  networkPreference?: NetworkPreference;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function BillTabs({ 
  billData, 
  calculateCarrierSavings, 
  networkPreference,
  activeTab = "overview", 
  onTabChange 
}: BillTabsProps) {
  const [activeCarrierTab, setActiveCarrierTab] = useState("warp");
  
  const handleTabChange = (value: string) => {
    if (onTabChange) {
      onTabChange(value);
    }
  };

  return (
    <Tabs 
      defaultValue="overview" 
      className="w-full space-y-6"
      value={activeTab}
      onValueChange={handleTabChange}
    >
      <div className="bg-white rounded-xl shadow-sm p-1 border border-gray-100">
        <TabsList className="grid grid-cols-4 w-full h-auto p-1 bg-gray-50 rounded-lg">
          <TabsTrigger 
            value="overview" 
            className="py-3 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-md transition-all"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger 
            value="line-items" 
            className="py-3 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-md transition-all"
          >
            Line Items
          </TabsTrigger>
          <TabsTrigger 
            value="recommendations" 
            className="py-3 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-md transition-all"
          >
            Recommendations
          </TabsTrigger>
          <TabsTrigger 
            value="carrier-comparison" 
            className="py-3 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-md transition-all"
          >
            Carrier Comparison
          </TabsTrigger>
        </TabsList>
      </div>
      
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <TabsContent value="overview" className="mt-0 space-y-6 animate-fade-in">
          <OverviewTab billData={billData} formatCurrency={formatCurrency} />
        </TabsContent>
        <TabsContent value="line-items" className="mt-0 space-y-6 animate-fade-in">
          <LineItemsTab billData={billData} formatCurrency={formatCurrency} />
        </TabsContent>
        <TabsContent value="recommendations" className="mt-0 space-y-6 animate-fade-in">
          <RecommendationsTab 
            billData={billData} 
            formatCurrency={formatCurrency}
            calculateCarrierSavings={calculateCarrierSavings}
            networkPreference={networkPreference}
          />
        </TabsContent>
        <TabsContent value="carrier-comparison" className="mt-0 space-y-6 animate-fade-in">
          <CarrierComparison
            billData={billData}
            activeCarrierTab={activeCarrierTab}
            setActiveCarrierTab={setActiveCarrierTab}
            calculateCarrierSavings={calculateCarrierSavings}
            formatCurrency={formatCurrency}
          />
        </TabsContent>
      </div>
    </Tabs>
  );
}
