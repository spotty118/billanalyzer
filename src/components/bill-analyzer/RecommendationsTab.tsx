
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, ArrowDown, Smartphone, Layout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NetworkPreference } from './VerizonBillAnalyzer';

interface Recommendation {
  title: string;
  description: string;
  savingsMonthly?: number;
  savingsAnnual?: number;
  action?: string;
  priority: 'high' | 'medium' | 'low';
}

interface RecommendationsTabProps {
  billData: any;
  formatCurrency: (value: number) => string;
  calculateCarrierSavings: (carrierId: string) => {
    monthlySavings: number;
    annualSavings: number;
    planName: string;
    price: number;
  };
  networkPreference?: NetworkPreference;
  carrierType?: string;
}

export function RecommendationsTab({ 
  billData, 
  formatCurrency, 
  calculateCarrierSavings,
  networkPreference,
  carrierType = "verizon"
}: RecommendationsTabProps) {
  // If there's no bill data, display a message
  if (!billData || !billData.phoneLines || billData.phoneLines.length === 0) {
    return (
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Personalized Recommendations</CardTitle>
          <CardDescription>
            We'll analyze your {carrierType.charAt(0).toUpperCase() + carrierType.slice(1)} bill to find potential savings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-muted-foreground">
              No bill data available. Please upload a bill or enter line details to receive personalized recommendations.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get savings information
  let warpSavings;
  let prioritySavings;
  
  if (networkPreference && calculateCarrierSavings) {
    if (networkPreference === 'verizon') {
      warpSavings = calculateCarrierSavings('warp');
      prioritySavings = calculateCarrierSavings('priority');
    } else if (networkPreference === 'tmobile') {
      warpSavings = calculateCarrierSavings('warp');
      prioritySavings = calculateCarrierSavings('priority');
    } else if (networkPreference === 'att') {
      warpSavings = calculateCarrierSavings('warp');
      prioritySavings = calculateCarrierSavings('priority');
    }
  }

  // Check if any of the phone lines has a premium plan
  const hasPremiumPlans = billData.phoneLines?.some((line: any) => {
    // This logic can be adjusted based on your plan identification method
    const planName = line.planName?.toLowerCase() || '';
    return planName.includes('unlimited') && (
      planName.includes('premium') || 
      planName.includes('plus') || 
      planName.includes('pro') || 
      planName.includes('elite') ||
      planName.includes('do more') ||
      planName.includes('get more') ||
      planName.includes('play more')
    );
  });

  // Check if any lines have device payments
  const hasDevicePayments = billData.phoneLines?.some((line: any) => 
    line.details?.devicePayment && line.details.devicePayment > 0
  );

  // Number of lines
  const numberOfLines = billData.phoneLines?.length || 0;
  const totalMonthlyAmount = billData.totalAmount || 0;
  const averagePerLine = totalMonthlyAmount / (numberOfLines || 1);
  
  // Build recommendations
  const recommendations: Recommendation[] = [];
  
  // Carrier switch recommendation (if we have savings data)
  if (warpSavings && warpSavings.monthlySavings > 0) {
    recommendations.push({
      title: `Switch to a more affordable carrier`,
      description: `Based on your usage, switching to US Mobile's ${warpSavings.planName} plan could save you ${formatCurrency(warpSavings.monthlySavings)} per month while providing similar features.`,
      savingsMonthly: warpSavings.monthlySavings,
      savingsAnnual: warpSavings.annualSavings,
      action: "View Plan",
      priority: warpSavings.monthlySavings > 30 ? 'high' : 'medium'
    });
  }

  // Premium plan recommendation
  if (hasPremiumPlans) {
    recommendations.push({
      title: "Downgrade premium-tier plans",
      description: `Some of your lines have premium unlimited plans. Consider downgrading to a basic unlimited plan if you don't use the premium features.`,
      savingsMonthly: 10 * numberOfLines,
      savingsAnnual: 10 * 12 * numberOfLines,
      action: "Compare Plans",
      priority: 'medium'
    });
  }

  // Device payment recommendation
  if (hasDevicePayments) {
    recommendations.push({
      title: "Consider BYOD discounts",
      description: "When your device payments end, consider keeping your phone longer and taking advantage of bring-your-own-device discounts.",
      savingsMonthly: 5 * numberOfLines,
      savingsAnnual: 5 * 12 * numberOfLines,
      priority: 'low'
    });
  }

  // Autopay recommendation
  recommendations.push({
    title: "Enable autopay for discounts",
    description: `Most carriers offer $5-10 per line discounts when using autopay with a debit card or checking account.`,
    savingsMonthly: 5 * numberOfLines,
    savingsAnnual: 5 * 12 * numberOfLines,
    action: "Learn More",
    priority: 'medium'
  });

  // Multi-line discount recommendation (if there are less than 4 lines)
  if (numberOfLines < 4 && numberOfLines > 1) {
    recommendations.push({
      title: "Add lines for better value",
      description: `${carrierType.charAt(0).toUpperCase() + carrierType.slice(1)} plans typically offer the best value with 4+ lines. Consider adding lines for family members to lower your per-line cost.`,
      savingsMonthly: averagePerLine * 0.15 * numberOfLines,
      savingsAnnual: averagePerLine * 0.15 * 12 * numberOfLines,
      priority: 'low'
    });
  }

  // Sort recommendations by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  // Render individual recommendation cards
  const renderRecommendationCard = (rec: Recommendation, index: number) => (
    <div key={index} className={`rounded-lg border p-4 ${rec.priority === 'high' ? 'border-primary/30 bg-primary/5' : ''}`}>
      <div className="flex flex-col space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={`rounded-full p-2 ${
              rec.priority === 'high' ? 'bg-primary/20 text-primary' : 
              rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 
              'bg-blue-100 text-blue-700'
            }`}>
              {rec.priority === 'high' ? (
                <ArrowDown className="h-4 w-4" />
              ) : (
                <Smartphone className="h-4 w-4" />
              )}
            </div>
            <div>
              <h3 className="font-medium">{rec.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{rec.description}</p>
            </div>
          </div>
          
          {rec.savingsMonthly && rec.savingsAnnual && (
            <div className="text-right">
              <div className="text-sm font-semibold text-green-600">
                Save {formatCurrency(rec.savingsMonthly)}/mo
              </div>
              <div className="text-xs text-muted-foreground">
                {formatCurrency(rec.savingsAnnual)}/yr
              </div>
            </div>
          )}
        </div>
        
        {rec.action && (
          <Button variant="outline" size="sm" className="self-start mt-2">
            {rec.action}
          </Button>
        )}
      </div>
    </div>
  );

  const totalPotentialSavings = recommendations.reduce((total, rec) => total + (rec.savingsMonthly || 0), 0);
  const totalAnnualSavings = recommendations.reduce((total, rec) => total + (rec.savingsAnnual || 0), 0);

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-3">
        <CardTitle>Personalized Recommendations</CardTitle>
        <CardDescription>
          Based on your {carrierType.charAt(0).toUpperCase() + carrierType.slice(1)} bill, we've found potential savings for you
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="rounded-lg bg-green-50 border border-green-100 p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-green-100 p-2 text-green-700">
                  <Layout className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium">Total Potential Savings</h3>
                  <p className="text-sm text-muted-foreground">If you implement all recommendations</p>
                </div>
              </div>
              <div className="mt-3 md:mt-0 text-right">
                <div className="text-xl font-bold text-green-600">
                  {formatCurrency(totalPotentialSavings)}/mo
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatCurrency(totalAnnualSavings)}/yr
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Recommended Actions</h3>
            <div className="space-y-3">
              {recommendations.map(renderRecommendationCard)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
