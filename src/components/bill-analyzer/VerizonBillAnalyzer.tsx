import { useState } from 'react';
import { BillUploader } from './BillUploader';
import { BillAnalyzerContent } from './BillAnalyzerContent';
import { ManualEntryForm } from './ManualEntryForm';
import { useVerizonBillAnalyzer } from '@/hooks/use-verizon-bill-analyzer';
import { Button } from '@/components/ui/button';
import { Upload, PencilLine, RefreshCw } from 'lucide-react';
import { toast } from "sonner";

const VerizonBillAnalyzer = () => {
  const { 
    billData,
    fileSelected,
    isLoading,
    errorMessage,
    handleFileChange,
    calculateCarrierSavings,
    addManualLineCharges,
    resetBillData
  } = useVerizonBillAnalyzer();

  const [inputMethod, setInputMethod] = useState<'upload' | 'manual' | null>(null);

  const handleStartOver = () => {
    resetBillData();
    setInputMethod(null);
    toast.success("Analysis reset. You can start over.");
  };

  if (billData) {
    return (
      <div className="flex flex-col w-full max-w-6xl mx-auto bg-white rounded-lg shadow">
        <div className="flex justify-between items-center px-6 pt-6">
          <h1 className="text-2xl font-bold">Bill Analysis</h1>
          <Button 
            onClick={handleStartOver}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Start Over
          </Button>
        </div>
        <BillAnalyzerContent 
          billData={billData}
          calculateCarrierSavings={calculateCarrierSavings}
        />
        
        {billData?.billVersion && (
          <div className="text-xs text-gray-500 p-2 text-right">
            Bill Format Version: {billData.billVersion}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full max-w-6xl mx-auto bg-white rounded-lg shadow">
      {!inputMethod ? (
        <div className="flex flex-col items-center justify-center p-10 space-y-8">
          <h2 className="text-2xl font-semibold text-gray-800">Choose Input Method</h2>
          <p className="text-gray-600 text-center max-w-md">
            You can either upload your Verizon bill PDF or manually enter your line charges.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
            <Button 
              onClick={() => setInputMethod('upload')}
              className="flex-1 h-32 flex-col space-y-3 p-6"
              variant="outline"
            >
              <Upload className="h-10 w-10 text-blue-500" />
              <span className="font-medium">Upload Verizon Bill</span>
            </Button>
            
            <Button 
              onClick={() => setInputMethod('manual')}
              className="flex-1 h-32 flex-col space-y-3 p-6"
              variant="outline"
            >
              <PencilLine className="h-10 w-10 text-green-500" />
              <span className="font-medium">Enter Manually</span>
            </Button>
          </div>
          
          <p className="text-xs text-gray-400 mt-6">
            Both methods will provide you with a detailed analysis and potential savings
          </p>
        </div>
      ) : inputMethod === 'upload' ? (
        <div>
          <Button 
            onClick={() => setInputMethod(null)} 
            variant="ghost" 
            className="m-4"
          >
            ← Back to selection
          </Button>
          <BillUploader 
            fileSelected={fileSelected} 
            isLoading={isLoading} 
            onFileChange={handleFileChange}
            errorMessage={errorMessage}
          />
        </div>
      ) : (
        <div>
          <Button 
            onClick={() => setInputMethod(null)} 
            variant="ghost" 
            className="m-4"
          >
            ← Back to selection
          </Button>
          <ManualEntryForm onSubmit={addManualLineCharges} />
        </div>
      )}
    </div>
  );
};

export default VerizonBillAnalyzer;
