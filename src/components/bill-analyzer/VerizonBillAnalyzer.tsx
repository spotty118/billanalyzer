import { BillUploader } from './BillUploader';
import { BillAnalyzerContent } from './BillAnalyzerContent';
import { useVerizonBillAnalyzer } from '@/hooks/use-verizon-bill-analyzer';

const VerizonBillAnalyzer = () => {
  const { 
    billData,
    fileSelected,
    isLoading,
    errorMessage,
    handleFileChange,
    calculateCarrierSavings
  } = useVerizonBillAnalyzer();

  return (
    <div className="flex flex-col w-full max-w-6xl mx-auto bg-white rounded-lg shadow">
      {!billData ? (
        <BillUploader 
          fileSelected={fileSelected} 
          isLoading={isLoading} 
          onFileChange={handleFileChange}
          errorMessage={errorMessage}
        />
      ) : (
        <BillAnalyzerContent 
          billData={billData}
          calculateCarrierSavings={calculateCarrierSavings}
        />
      )}
    </div>
  );
};

export default VerizonBillAnalyzer;
