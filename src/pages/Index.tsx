
import { QuoteCalculator } from "@/components/QuoteCalculator";

const Index = () => {
  return (
    <div className="min-h-screen flex w-full">
      <main className="flex-1 p-6 bg-gray-50">
        <h1 className="text-3xl font-bold mb-6">Welcome, Employee</h1>
        <div className="w-full max-w-2xl mx-auto">
          <QuoteCalculator />
        </div>
      </main>
    </div>
  );
};

export default Index;
