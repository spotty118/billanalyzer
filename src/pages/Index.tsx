
import { AppSidebar } from "@/components/AppSidebar";
import { QuoteCalculator } from "@/components/QuoteCalculator";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { MainContent } from "@/components/layouts/MainContent";
import { ContentArea } from "@/components/layouts/ContentArea";

const Index = () => {
  return (
    <DashboardLayout>
      <AppSidebar />
      <MainContent>
        <h1 className="text-3xl font-bold tracking-tight mb-6">Welcome, Employee</h1>
        <ContentArea>
          <QuoteCalculator />
        </ContentArea>
      </MainContent>
    </DashboardLayout>
  );
};

export default Index;
