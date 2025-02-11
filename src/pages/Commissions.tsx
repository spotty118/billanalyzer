import { AppSidebar } from "@/components/AppSidebar";
import { CommissionCalculator } from "@/components/CommissionCalculator";

export default function Commissions() {
  return (
    <div className="flex h-screen">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <h1 className="text-3xl font-bold mb-6">Commissions</h1>
        <CommissionCalculator />
      </main>
    </div>
  );
}
