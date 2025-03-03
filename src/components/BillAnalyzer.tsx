
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useFileUpload } from "@/hooks/use-file-upload";
import { analyzeBill } from "@/services/api";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { formatCurrency } from "@/data/verizonPlans";
import { useToast } from "@/components/ui/use-toast";

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
  usageAnalysis?: {
    trend: 'increasing' | 'decreasing' | 'stable';
    percentageChange: number;
    seasonalFactors?: {
      highUsageMonths: string[];
      lowUsageMonths: string[];
    };
    avg_data_usage_gb: number;
    avg_talk_minutes: number;
    avg_text_count: number;
    high_data_users: string[];
    high_talk_users: string[];
    high_text_users: string[];
  };
  costAnalysis?: {
    averageMonthlyBill: number;
    projectedNextBill: number;
    unusualCharges: Array<{
      description: string;
      amount: number;
      reason: string;
    }>;
    potentialSavings: Array<{
      description: string;
      estimatedSaving: number;
      confidence: number;
    }>;
  };
  planRecommendation?: {
    recommendedPlan: string;
    reasons: string[];
    estimatedMonthlySavings: number;
    confidenceScore: number;
    alternativePlans: Array<{
      planName: string;
      pros: string[];
      cons: string[];
      estimatedSavings: number;
    }>;
  };
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
  <div className="mt-4 space-y-6">
    {/* Account Details */}
    {/* Smart Analysis */}
    <div className="bg-gray-50 rounded-lg p-6">
      {/* Usage Patterns */}
      {analysis.usageAnalysis && (
        <div className="mb-6">
          <h4 className="font-medium mb-3">Usage Analysis</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Usage Trend</span>
              <span className="font-medium">{analysis.usageAnalysis.trend} ({analysis.usageAnalysis.percentageChange}% change)</span>
            </div>
            {analysis.usageAnalysis.seasonalFactors && (
              <>
                <div className="flex justify-between text-sm">
                  <span>Peak Usage Months</span>
                  <span>{analysis.usageAnalysis.seasonalFactors.highUsageMonths.join(', ')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Low Usage Months</span>
                  <span>{analysis.usageAnalysis.seasonalFactors.lowUsageMonths.join(', ')}</span>
                </div>
              </>
            )}
            <div className="flex justify-between text-sm">
              <span>Average Data Usage</span>
              <span>{analysis.usageAnalysis.avg_data_usage_gb.toFixed(1)} GB/month</span>
            </div>
          </div>
        </div>
      )}

      {/* Cost Analysis */}
      {analysis.costAnalysis && (
        <div className="mb-6">
          <h4 className="font-medium mb-3">Cost Analysis</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Average Monthly Bill</span>
              <span>{formatCurrency(analysis.costAnalysis.averageMonthlyBill)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Projected Next Bill</span>
              <span>{formatCurrency(analysis.costAnalysis.projectedNextBill)}</span>
            </div>
            {analysis.costAnalysis.unusualCharges.length > 0 && (
              <div className="mt-3">
                <h5 className="text-sm font-medium mb-2">Unusual Charges</h5>
                {analysis.costAnalysis.unusualCharges.map((charge, i) => (
                  <div key={i} className="flex justify-between text-sm text-gray-600">
                    <span>{charge.description}</span>
                    <span>{formatCurrency(charge.amount)}</span>
                  </div>
                ))}
              </div>
            )}
            {analysis.costAnalysis.potentialSavings.length > 0 && (
              <div className="mt-3">
                <h5 className="text-sm font-medium mb-2">Potential Savings</h5>
                {analysis.costAnalysis.potentialSavings.map((saving, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span>{saving.description}</span>
                    <span className="text-green-600">{formatCurrency(saving.estimatedSaving)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Plan Recommendations */}
      {analysis.planRecommendation && (
        <div>
          <h4 className="font-medium mb-3">Plan Recommendations</h4>
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-md">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-blue-900">{analysis.planRecommendation.recommendedPlan}</span>
                <span className="text-green-600 font-medium">
                  Save {formatCurrency(analysis.planRecommendation.estimatedMonthlySavings)}/mo
                </span>
              </div>
              <div className="text-sm text-blue-800 mb-2">
                {analysis.planRecommendation.reasons.map((reason, i) => (
                  <div key={i}>• {reason}</div>
                ))}
              </div>
              <div className="text-xs text-blue-700">
                Confidence Score: {(analysis.planRecommendation.confidenceScore * 100).toFixed(0)}%
              </div>
            </div>

            {analysis.planRecommendation.alternativePlans.length > 0 && (
              <div className="mt-4">
                <h5 className="text-sm font-medium mb-2">Alternative Plans</h5>
                {analysis.planRecommendation.alternativePlans.map((plan, i) => (
                  <div key={i} className="bg-gray-100 p-3 rounded-md mb-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium">{plan.planName}</span>
                      <span className="text-green-600">
                        Save {formatCurrency(plan.estimatedSavings)}/mo
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-green-600 font-medium">Pros:</span>
                        {plan.pros.map((pro, j) => (
                          <div key={j} className="text-gray-600">• {pro}</div>
                        ))}
                      </div>
                      <div>
                        <span className="text-red-600 font-medium">Cons:</span>
                        {plan.cons.map((con, j) => (
                          <div key={j} className="text-gray-600">• {con}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>

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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();
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
      setIsAnalyzing(true);
      console.log('Starting bill analysis...');
      
      const result = await analyzeBill(file);
      console.log('Analysis result:', result);
      
      if (result.error) {
        console.error('API returned error:', result.error);
        toast({
          variant: "destructive",
          title: "Error analyzing bill",
          description: result.error.message || "An unexpected error occurred"
        });
        throw new Error(result.error.message);
      }

      if (!result.data) {
        console.error('No data in analysis result');
        toast({
          variant: "destructive",
          title: "Error analyzing bill",
          description: "No analysis data received"
        });
        throw new Error('No analysis data received');
      }

      // Check if we have valid data with the required fields
      if (typeof result.data.totalAmount === 'undefined' && result.data.totalAmount !== 0) {
        console.error('Invalid analysis data - missing totalAmount');
        toast({
          variant: "destructive",
          title: "Error analyzing bill",
          description: "The bill data could not be properly analyzed"
        });
        throw new Error('Invalid analysis data structure');
      }

      setAnalysisResult(result.data);
      console.log('Analysis successful:', result.data);
      
      toast({
        title: "Analysis Complete",
        description: "Your bill has been successfully analyzed."
      });
    } catch (error) {
      console.error('Bill analysis error:', error);
      reset();
      // Toast notification for error already shown above
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <ErrorBoundary>
      <Card>
        <CardHeader>
          <CardTitle>Bill Analyzer</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading || isAnalyzing ? (
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
                disabled={!file || isLoading || isAnalyzing}
              >
                {isAnalyzing ? "Analyzing..." : "Analyze Bill"}
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
