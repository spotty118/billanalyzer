
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RecommendationsTab } from "./RecommendationsTab";
import { CarrierComparison } from "./CarrierComparison";
import { formatCurrency } from "./utils/dataUtils";
import { OverviewTab } from "./OverviewTab";
import { LineItemsTab } from "./LineItemsTab";

interface BillTabsProps {
  billData: any;
  calculateCarrierSavings: (carrierId: string) => {
    monthlySavings: number;
    annualSavings: number;
    planName: string;
    price: number;
  };
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function BillTabs({ billData, calculateCarrierSavings, activeTab, onTabChange }: BillTabsProps) {
  const [activeCarrierTab, setActiveCarrierTab] = useState("warp");
  
  const handleTabChange = (value: string) => {
    if (onTabChange) {
      onTabChange(value);
    }
  };

  return (
    <Tabs 
      defaultValue="overview" 
      className="w-full space-y-4"
      value={activeTab}
      onValueChange={handleTabChange}
    >
      <TabsList>
        <div className="flex space-x-2">
          <TabsTrigger value="overview" className="data-[state=active]:bg-blue-100">
            Overview
          </TabsTrigger>
          <TabsTrigger value="line-items" className="data-[state=active]:bg-blue-100">
            Line Items
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="data-[state=active]:bg-blue-100">
            Recommendations
          </TabsTrigger>
          <TabsTrigger value="carrier-comparison" className="data-[state=active]:bg-blue-100">
            Carrier Comparison
          </TabsTrigger>
        </div>
      </TabsList>
      <TabsContent value="overview">
        <OverviewTab billData={billData} formatCurrency={formatCurrency} />
      </TabsContent>
      <TabsContent value="line-items">
        <LineItemsTab billData={billData} formatCurrency={formatCurrency} />
      </TabsContent>
      <TabsContent value="recommendations">
        <RecommendationsTab 
          billData={billData} 
          formatCurrency={formatCurrency}
          calculateCarrierSavings={calculateCarrierSavings}
        />
      </TabsContent>
      <TabsContent value="carrier-comparison">
        <CarrierComparison
          billData={billData}
          activeCarrierTab={activeCarrierTab}
          setActiveCarrierTab={setActiveCarrierTab}
          calculateCarrierSavings={calculateCarrierSavings}
          formatCurrency={formatCurrency}
        />
      </TabsContent>
    </Tabs>
  );
}
