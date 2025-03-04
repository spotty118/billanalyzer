
import { BillAnalysisHeader } from './BillAnalysisHeader';
import { BillTabs } from './BillTabs';

interface BillAnalyzerContentProps {
  billData: any;
  ocrProvider: string | null;
  resetBillData: () => void;
  formatCurrency: (value: number) => string;
  calculateCarrierSavings: (carrierId: string) => {
    monthlySavings: number;
    annualSavings: number;
    planName: string;
    price: number;
  };
  aiRecommendationsFetched: boolean;
  setAiRecommendationsFetched: (fetched: boolean) => void;
  networkPreference?: string | null;
}

export const BillAnalyzerContent = ({ 
  billData, 
  ocrProvider, 
  resetBillData, 
  formatCurrency,
  calculateCarrierSavings,
  aiRecommendationsFetched,
  setAiRecommendationsFetched,
  networkPreference
}: BillAnalyzerContentProps) => {
  return (
    <div className="space-y-6">
      <BillAnalysisHeader
        billData={billData}
        resetBillData={resetBillData}
        formatCurrency={formatCurrency}
        ocrProvider={ocrProvider}
      />
      
      <BillTabs
        billData={billData}
        formatCurrency={formatCurrency}
        calculateCarrierSavings={calculateCarrierSavings}
        aiRecommendationsFetched={aiRecommendationsFetched}
        setAiRecommendationsFetched={setAiRecommendationsFetched}
        networkPreference={networkPreference}
      />
    </div>
  );
};
