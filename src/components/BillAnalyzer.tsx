import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useFileUpload } from "@/hooks/use-file-upload";
import { analyzeBill } from "@/services/api";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

interface AnalysisResult {
  analysis: string;
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

export function BillAnalyzer() {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
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

      setAnalysisResult(result.data);
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
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium mb-2">Analysis Results</h3>
                  <p className="text-sm text-gray-600">
                    {analysisResult.analysis}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </ErrorBoundary>
  );
}