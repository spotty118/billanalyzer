
import { BillAnalysisHeader } from './BillAnalysisHeader';
import { BillTabs } from './BillTabs';
import type { NetworkPreference } from '@/hooks/use-verizon-bill-analyzer';

interface BillAnalyzerContentProps {
  billData: any;
  ocrProvider?: string | null;
  resetBillData?: () => void;
  formatCurrency: (value: number) => string;
  calculateCarrierSavings: (carrierId: string) => {
    monthlySavings: number;
    annualSavings: number;
    planName: string;
    price: number;
  };
  networkPreference?: NetworkPreference;
  aiRecommendationsFetched: boolean;
  setAiRecommendationsFetched: (fetched: boolean) => void;
}

export const BillAnalyzerContent = ({ 
  billData, 
  formatCurrency,
  calculateCarrierSavings,
  networkPreference,
  aiRecommendationsFetched,
  setAiRecommendationsFetched
}: BillAnalyzerContentProps) => {
  return (
    <div className="space-y-6">
      <BillAnalysisHeader
        accountNumber={billData.accountNumber || billData.accountInfo?.accountNumber || 'Unknown'}
        billingPeriod={billData.billingPeriod || billData.accountInfo?.billingPeriod || 'Current period'}
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
