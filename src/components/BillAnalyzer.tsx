
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useFileUpload } from "@/hooks/use-file-upload";
import { analyzeBill } from "@/services/api";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { formatCurrency } from "@/data/verizonPlans";

interface BillAnalysis {
  totalAmount: number | null;
  accountNumber: string | null;
  billingPeriod: string | null;
  charges: Array<{
    description: string;
    amount: number;
    type: string;
  }>;
  lineItems: Array<{
    description: string;
    amount: number;
    type: string;
  }>;
  subtotals: {
    lineItems: number;
    otherCharges: number;
  };
  summary: string;
}

const FileUploadArea = ({ onFileChange, file, isLoading }: {
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  file: File | null;
  isLoading: boolean;
}) => (
  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
    <input
      type="file"
      accept=".pdf"
      onChange={onFileChange}
      className="hidden"
      id="bill-upload"
      disabled={isLoading}
    />
    <label
      htmlFor="bill-upload"
      className="cursor-pointer flex flex-col items-center"
    >
      <Upload className="h-8 w-8 text-gray-400 mb-2" />
      <span className="text-sm text-gray-600">
        {file ? file.name : "Upload Verizon PDF Bill"}
      </span>
    </label>
  </div>
);

const LoadingState = () => (
  <div className="space-y-4">
    <Skeleton className="h-[100px] w-full" />
    <Skeleton className="h-[40px] w-full" />
  </div>
);

const AnalysisResults = ({ analysis }: { analysis: BillAnalysis }) => (
  <div className="mt-4 space-y-4">
    <div className="bg-gray-50 rounded-lg p-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="font-medium">Account Details</h4>
          <span className="text-sm text-gray-500">Account #{analysis.accountNumber}</span>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Billing Period</span>
            <span>{analysis.billingPeriod}</span>
          </div>
          <div className="flex justify-between text-sm font-medium">
            <span>Total Amount Due</span>
            <span>{analysis.totalAmount ? formatCurrency(analysis.totalAmount) : '$0.00'}</span>
          </div>
        </div>

        <div className="border-t pt-4 mt-4">
          <h4 className="font-medium mb-3">Line Items</h4>
          <div className="space-y-2">
            {analysis.lineItems.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span>{item.description}</span>
                <span>{formatCurrency(item.amount)}</span>
              </div>
            ))}
            {analysis.lineItems.length === 0 && (
              <p className="text-sm text-gray-500">No line items found</p>
            )}
          </div>
        </div>

        <div className="border-t pt-4 mt-4">
          <h4 className="font-medium mb-3">Other Charges</h4>
          <div className="space-y-2">
            {analysis.charges.map((charge, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span>{charge.description}</span>
                <span>{formatCurrency(charge.amount)}</span>
              </div>
            ))}
            {analysis.charges.length === 0 && (
              <p className="text-sm text-gray-500">No additional charges found</p>
            )}
          </div>
        </div>

        <div className="border-t pt-4 mt-4">
          <div className="flex justify-between text-sm font-medium">
            <span>Subtotal (Line Items)</span>
            <span>{formatCurrency(analysis.subtotals.lineItems)}</span>
          </div>
          <div className="flex justify-between text-sm font-medium mt-2">
            <span>Subtotal (Other Charges)</span>
            <span>{formatCurrency(analysis.subtotals.otherCharges)}</span>
          </div>
          <div className="flex justify-between text-base font-bold mt-4">
            <span>Total</span>
            <span>{analysis.totalAmount ? formatCurrency(analysis.totalAmount) : '$0.00'}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export function BillAnalyzer() {
  const [analysisResult, setAnalysisResult] = useState<BillAnalysis | null>(null);
  const {
    file,
    isLoading,
    error,
    handleFileChange,
    reset
  } = useFileUpload({
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['application/pdf'],
  });

  const handleAnalyze = async () => {
    if (!file) return;

    try {
      const result = await analyzeBill(file);
      
      if (result.error) {
        throw new Error(result.error.message);
      }

      setAnalysisResult(result.data as BillAnalysis);
    } catch (error) {
      reset();
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to analyze bill');
    }
  };

  return (
    <ErrorBoundary>
      <Card>
        <CardHeader>
          <CardTitle>Bill Analyzer</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingState />
          ) : (
            <div className="space-y-4">
              <FileUploadArea
                onFileChange={handleFileChange}
                file={file}
                isLoading={isLoading}
              />
              {error && (
                <p className="text-sm text-red-500 mt-2">{error}</p>
              )}
              <Button
                onClick={handleAnalyze}
                className="w-full"
                disabled={!file || isLoading}
              >
                {isLoading ? "Analyzing..." : "Analyze Bill"}
              </Button>
              {analysisResult && (
                <AnalysisResults analysis={analysisResult} />
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </ErrorBoundary>
  );
}
