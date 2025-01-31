import { AppSidebar } from "@/components/AppSidebar";
import { PromotionsOverview } from "@/components/PromotionsOverview";

export default function Promotions() {
  return (
    <div className="flex h-screen">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <h1 className="text-3xl font-bold mb-6">Promotions</h1>
        <PromotionsOverview />
      </main>
    </div>
  );
}
