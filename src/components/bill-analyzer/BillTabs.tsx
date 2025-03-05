
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OverviewTab } from "./OverviewTab";
import { LineItemsTab } from "./LineItemsTab";
import { RecommendationsTab } from "./RecommendationsTab";
import { CarrierComparison } from "./CarrierComparison";
import { NetworkPreference } from './VerizonBillAnalyzer';
import { useMediaQuery } from "@/hooks/use-media-query";

interface BillTabsProps {
  billData: any;
  calculateCarrierSavings: (carrierId: string) => {
    monthlySavings: number;
    annualSavings: number;
    planName: string;
    price: number;
  };
  networkPreference?: NetworkPreference;
  carrierType?: string;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  formatCurrency: (value: number) => string;
}

export function BillTabs({ 
  billData, 
  calculateCarrierSavings, 
  networkPreference,
  carrierType = "verizon",
  activeTab = "overview", 
  onTabChange,
  formatCurrency 
}: BillTabsProps) {
  const [activeCarrierTab, setActiveCarrierTab] = useState("warp");
  const isMobile = useMediaQuery("(max-width: 640px)");
  
  const handleTabChange = (value: string) => {
    if (onTabChange) {
      onTabChange(value);
    }
  };

  const getCarrierName = () => {
    if (billData?.carrierType) return billData.carrierType;
    if (carrierType) return carrierType.charAt(0).toUpperCase() + carrierType.slice(1);
    return "Carrier";
  };

  return (
    <Tabs 
      defaultValue="overview" 
      className="w-full space-y-6"
      value={activeTab}
      onValueChange={handleTabChange}
    >
      <div className="custom-tabs-container">
        <TabsList className={`${isMobile ? 'flex flex-wrap gap-1' : 'grid grid-cols-4'} custom-tabs-list`}>
          <TabsTrigger 
            value="overview" 
            className={`${isMobile ? 'flex-1 text-sm' : 'py-3'} custom-tab`}
          >
            Overview
          </TabsTrigger>
          <TabsTrigger 
            value="line-items" 
            className={`${isMobile ? 'flex-1 text-sm' : 'py-3'} custom-tab`}
          >
            Line Items
          </TabsTrigger>
          <TabsTrigger 
            value="recommendations" 
            className={`${isMobile ? 'flex-1 text-sm' : 'py-3'} custom-tab`}
          >
            Recommendations
          </TabsTrigger>
          <TabsTrigger 
            value="carrier-comparison" 
            className={`${isMobile ? 'flex-1 text-sm' : 'py-3'} custom-tab`}
          >
            Carrier Comparison
          </TabsTrigger>
        </TabsList>
      </div>
      
      <div className="card-gradient">
        <TabsContent value="overview" className="mt-0 space-y-6 animate-fade-in">
          <OverviewTab 
            billData={billData} 
            formatCurrency={formatCurrency} 
            carrierType={carrierType}
          />
        </TabsContent>
        <TabsContent value="line-items" className="mt-0 space-y-6 animate-fade-in">
          <LineItemsTab 
            billData={billData} 
            formatCurrency={formatCurrency} 
            carrierType={carrierType}
          />
        </TabsContent>
        <TabsContent value="recommendations" className="mt-0 space-y-6 animate-fade-in">
          <RecommendationsTab 
            billData={billData} 
            formatCurrency={formatCurrency}
            calculateCarrierSavings={calculateCarrierSavings}
            networkPreference={networkPreference}
            carrierType={carrierType}
          />
        </TabsContent>
        <TabsContent value="carrier-comparison" className="mt-0 space-y-6 animate-fade-in">
          <CarrierComparison
            billData={billData}
            activeCarrierTab={activeCarrierTab}
            setActiveCarrierTab={setActiveCarrierTab}
            calculateCarrierSavings={calculateCarrierSavings}
            formatCurrency={formatCurrency}
            carrierType={getCarrierName()}
          />
        </TabsContent>
      </div>
    </Tabs>
  );
}
