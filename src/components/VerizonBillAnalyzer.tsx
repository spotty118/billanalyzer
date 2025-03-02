
import React, { useState } from 'react';
import BillUploader from './verizon-bill-analyzer/BillUploader';
import { Card } from './ui/card';
import BillTabs from './verizon-bill-analyzer/BillTabs';
import BillHeader from './verizon-bill-analyzer/BillHeader';
import { BillAnalysis } from './verizon-bill-analyzer/types';

const VerizonBillAnalyzer: React.FC = () => {
  const [billAnalysis, setBillAnalysis] = useState<BillAnalysis | null>(null);

  const handleBillAnalyzed = (analysis: any) => {
    // Transform the data from the Edge Function into the format expected by our components
    const transformedData: BillAnalysis = {
      accountNumber: analysis.accountNumber,
      billingPeriod: analysis.billingPeriod,
      totalAmount: analysis.totalAmount,
      lineItems: analysis.lineItems.map((item: any) => ({
        lineNumber: item.lineNumber,
        phoneNumber: item.phoneNumber || 'Unknown',
        planName: item.planName || 'Unknown Plan',
        devicePayment: item.devicePayment || 0,
        planCharge: item.charges - (item.devicePayment || 0),
        totalCharge: item.charges,
        dataUsage: {
          used: item.dataUsage || 0,
          included: item.dataUsage ? (item.dataUsage + 2) : 10, // Simplified assumption
          units: 'GB'
        }
      })),
      summary: {
        totalDevicePayments: analysis.totalDevicePayments,
        totalPlanCharges: analysis.totalPlanCharges, 
        totalFees: analysis.totalFees,
        totalTaxes: analysis.totalTaxes,
        grandTotal: analysis.totalAmount
      },
      fees: analysis.fees,
      recommendations: generateRecommendations(analysis)
    };

    setBillAnalysis(transformedData);
  };

  // Generate recommendations based on the bill analysis
  const generateRecommendations = (analysis: any) => {
    const recommendations = [];

    // Check if they could benefit from a family plan
    if (analysis.lineItems.length > 1) {
      recommendations.push({
        title: "Family Plan Savings",
        description: "You have multiple lines. Switching to our family plan could save you up to $20 per line.",
        potentialSavings: analysis.lineItems.length * 20
      });
    }

    // Check for device payment recommendations
    const hasDevicePayments = analysis.lineItems.some((item: any) => (item.devicePayment || 0) > 0);
    if (hasDevicePayments) {
      recommendations.push({
        title: "Device Payment Options",
        description: "Save on your device payments by trading in your old device or switching to a different payment plan.",
        potentialSavings: analysis.totalDevicePayments * 0.2 // Assume 20% savings
      });
    }

    // Check for plan optimization
    recommendations.push({
      title: "Plan Optimization",
      description: "Based on your usage patterns, you might benefit from switching to our new Unlimited plan.",
      potentialSavings: analysis.totalPlanCharges * 0.15 // Assume 15% savings
    });

    // Add more recommendations as needed
    recommendations.push({
      title: "Paperless Billing & AutoPay",
      description: "Sign up for paperless billing and AutoPay to save $10 per month.",
      potentialSavings: 10
    });

    return recommendations;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Verizon Bill Analyzer</h1>
      
      {!billAnalysis ? (
        <BillUploader onBillAnalyzed={handleBillAnalyzed} />
      ) : (
        <Card className="w-full">
          <BillHeader 
            accountNumber={billAnalysis.accountNumber}
            billingPeriod={billAnalysis.billingPeriod}
            totalAmount={billAnalysis.totalAmount}
          />
          <BillTabs billAnalysis={billAnalysis} />
        </Card>
      )}
    </div>
  );
};

export default VerizonBillAnalyzer;
