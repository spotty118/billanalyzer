
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
}

export const BillAnalyzerContent = ({ 
  billData, 
  ocrProvider,
  resetBillData,
  formatCurrency,
  calculateCarrierSavings,
  aiRecommendationsFetched,
  setAiRecommendationsFetched
}: BillAnalyzerContentProps) => {
  return (
    <div className="space-y-6">
      <BillAnalysisHeader
        accountNumber={billData.accountNumber || 'Unknown'}
        billingPeriod={billData.billingPeriod || 'Current period'}
        totalAmount={billData.totalAmount || 0}
        formatCurrency={formatCurrency}
      />
      
      <BillTabs
        billData={billData}
        formatCurrency={formatCurrency}
        calculateCarrierSavings={calculateCarrierSavings}
        aiRecommendationsFetched={aiRecommendationsFetched}
        setAiRecommendationsFetched={setAiRecommendationsFetched}
      />
    </div>
  );
};
