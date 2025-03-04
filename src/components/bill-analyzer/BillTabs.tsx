
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OverviewTab } from "./OverviewTab";
import { LineItemsTab } from "./LineItemsTab";
import { RecommendationsTab } from "./RecommendationsTab";

interface BillTabsProps {
  billData: any;
  formatCurrency: (value: number) => string;
  calculateCarrierSavings: (carrierId: string) => {
    monthlySavings: number;
    annualSavings: number;
    planName: string;
    price: number;
  };
  aiRecommendationsFetched: boolean;
  setAiRecommendationsFetched: (fetched: boolean) => void;
}

export function BillTabs({ 
  billData, 
  formatCurrency, 
  calculateCarrierSavings,
  aiRecommendationsFetched,
  setAiRecommendationsFetched 
}: BillTabsProps) {
  
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-8">
        <TabsTrigger value="overview">Bill Overview</TabsTrigger>
        <TabsTrigger value="lines">Line Details</TabsTrigger>
        <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
      </TabsList>
      
      <TabsContent value="overview">
        <OverviewTab billData={billData} formatCurrency={formatCurrency} />
      </TabsContent>
      
      <TabsContent value="lines">
        <LineItemsTab billData={billData} formatCurrency={formatCurrency} />
      </TabsContent>
      
      <TabsContent value="recommendations">
        <RecommendationsTab 
          billData={billData} 
          formatCurrency={formatCurrency} 
          calculateCarrierSavings={calculateCarrierSavings}
          networkPreference={billData?.networkPreference}
          aiRecommendationsFetched={aiRecommendationsFetched}
          setAiRecommendationsFetched={setAiRecommendationsFetched}
        />
      </TabsContent>
    </Tabs>
  );
}
