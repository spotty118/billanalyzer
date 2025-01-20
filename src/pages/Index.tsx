import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { QuoteCalculator } from "@/components/QuoteCalculator";
import { CommissionCalculator } from "@/components/CommissionCalculator";
import { PromotionsOverview } from "@/components/PromotionsOverview";
import { NumberLookup } from "@/components/NumberLookup";
import { BillAnalyzer } from "@/components/BillAnalyzer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 p-6 bg-gray-50">
          <h1 className="text-3xl font-bold mb-6">Welcome, Employee</h1>
          
          <Tabs defaultValue="plans" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="plans">Plan Quotes</TabsTrigger>
              <TabsTrigger value="commission">Commission</TabsTrigger>
              <TabsTrigger value="tools">Customer Tools</TabsTrigger>
              <TabsTrigger value="promos">Promotions</TabsTrigger>
            </TabsList>

            <TabsContent value="plans">
              <div className="w-full max-w-2xl mx-auto">
                <QuoteCalculator />
              </div>
            </TabsContent>

            <TabsContent value="commission">
              <div className="w-full max-w-2xl mx-auto">
                <CommissionCalculator />
              </div>
            </TabsContent>

            <TabsContent value="tools">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <NumberLookup />
                <BillAnalyzer />
              </div>
            </TabsContent>

            <TabsContent value="promos">
              <div className="w-full max-w-2xl mx-auto">
                <PromotionsOverview />
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Index;