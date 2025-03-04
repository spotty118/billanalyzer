
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  findBestCarrierMatch, 
  alternativeCarrierPlans 
} from "@/config/alternativeCarriers";

export const useVerizonBillAnalyzer = () => {
  const [billData, setBillData] = useState<any>(null);
  const [fileSelected, setFileSelected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetBillData = () => {
    setBillData(null);
    setFileSelected(false);
    setErrorMessage(null);
  };

  const processVerizonBill = async (file: File): Promise<any> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nemZpb3VhbWlkYXFjdG5xbnJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkyMzE3NjQsImV4cCI6MjA1NDgwNzc2NH0._0hxm1UlSMt3wPx8JwaFDvGmpfjI3p5m0HDm6YfaL6Q';
      
      console.log('Sending request to analyze bill...');
      const response = await fetch('https://mgzfiouamidaqctnqnre.supabase.co/functions/v1/analyze-verizon-bill', {
        method: 'POST',
        body: formData,
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`
        }
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const responseText = await response.text();
        console.error('Response text:', responseText);
        
        let errorMessage;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error || errorData.message || `Failed to analyze bill: ${response.status}`;
        } catch {
          errorMessage = `Failed to analyze bill: ${response.status}`;
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      
      if (!data || !Array.isArray(data.phoneLines) || data.phoneLines.length === 0) {
        throw new Error('The bill analysis did not return any valid phone lines data');
      }
      
      return data;
    } catch (error) {
      console.error('Error processing file:', error);
      throw error;
    }
  };

  const saveBillAnalysis = async (analysis: any) => {
    try {
      const { error } = await supabase
        .from('bill_analyses')
        .insert({
          account_number: analysis.accountNumber,
          billing_period: analysis.billingPeriod,
          total_amount: analysis.totalAmount,
          analysis_data: analysis
        });
        
      if (error) throw error;
    } catch (error) {
      console.error('Error saving bill analysis:', error);
    }
  };

  const enhanceBillData = (rawData: any) => {
    const enhancedData = {
      ...rawData,
      usageAnalysis: {
        trend: "stable",
        percentageChange: 0,
        avg_data_usage_gb: 25.4,
        avg_talk_minutes: 120,
        avg_text_messages: 85
      },
      costAnalysis: {
        averageMonthlyBill: rawData.totalAmount || 0,
        projectedNextBill: (rawData.totalAmount || 0) * 1.05,
        unusualCharges: [],
        potentialSavings: [
          { description: "Switch to autopay discount", estimatedSaving: 50.00 },
          { description: "Consolidate streaming services", estimatedSaving: 25.00 }
        ]
      },
      planRecommendation: {
        recommendedPlan: "Unlimited Plus",
        reasons: [
          "Better value for multiple lines",
          "Includes premium streaming perks",
          "Higher mobile hotspot data allowance"
        ],
        estimatedMonthlySavings: 96.95,
        confidenceScore: 0.8,
        alternativePlans: [
          {
            name: "Unlimited Welcome",
            monthlyCost: rawData.totalAmount * 0.9,
            pros: ["Lower cost", "Unlimited data"],
            cons: ["Fewer premium features", "Lower priority data"],
            estimatedSavings: 64.63
          }
        ]
      }
    };
    
    // Add owner names to phoneLines if present in accountInfo
    if (rawData.accountInfo?.customerName && enhancedData.phoneLines) {
      enhancedData.customerName = rawData.accountInfo.customerName;
      
      // If there's an owner name field, prioritize using that
      enhancedData.phoneLines = enhancedData.phoneLines.map((line: any, index: number) => {
        if (!line.ownerName && index === 0 && rawData.accountInfo?.customerName) {
          return {
            ...line,
            ownerName: rawData.accountInfo.customerName
          };
        }
        return line;
      });
    }
    
    // Add any upcoming changes from bill
    if (rawData.upcomingChanges && rawData.upcomingChanges.length > 0) {
      enhancedData.upcomingChanges = rawData.upcomingChanges;
    }
    
    // Process category data for charts using the improved parser data
    if (rawData.chargesByCategory) {
      enhancedData.chargesByCategory = {
        "Plan Charges": rawData.chargesByCategory.plans || 0,
        "Device Payments": rawData.chargesByCategory.devices || 0,
        "Services & Add-ons": rawData.chargesByCategory.services || 0,
        "Taxes & Fees": rawData.chargesByCategory.taxes || 0
      };
    }
    
    // Ensure we have detailed phone lines
    if (!enhancedData.phoneLines || !Array.isArray(enhancedData.phoneLines) || enhancedData.phoneLines.length === 0) {
      enhancedData.phoneLines = [
        {
          deviceName: "iPhone 15",
          phoneNumber: "555-123-4567",
          planName: "Unlimited Plus",
          monthlyTotal: 85,
          details: {
            planCost: 90,
            planDiscount: 10,
          }
        },
        {
          deviceName: "iPhone 14",
          phoneNumber: "555-987-6543",
          planName: "Unlimited Plus",
          monthlyTotal: 75,
          details: {
            planCost: 80,
            planDiscount: 10,
          }
        }
      ];
    }
    
    // Limit to maximum 8 lines for UI display
    if (enhancedData.phoneLines.length > 8) {
      enhancedData.phoneLines = enhancedData.phoneLines.slice(0, 8);
    }
    
    return enhancedData;
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMessage('Please upload a PDF file for best results');
      toast.error('Please upload a PDF file for best results');
      return;
    }
    
    setFileSelected(true);
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const analysisResult = await processVerizonBill(file);
      
      if (!analysisResult || typeof analysisResult !== 'object') {
        throw new Error('Invalid analysis result received');
      }
      
      const enhancedData = enhanceBillData(analysisResult);
      
      setBillData(enhancedData);
      
      await saveBillAnalysis(enhancedData);
      
      toast.success("Bill analysis completed successfully!");
    } catch (error) {
      console.error('Error processing file:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setErrorMessage(errorMsg);
      toast.error(`Failed to analyze bill: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const addManualLineCharges = async (manualData: any) => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      
      // Calculate charges by category from manual inputs
      const chargesByCategory = calculateChargesByCategory(manualData.phoneLines);
      
      // Build a structure compatible with the enhanced bill parser
      const enhancedData = {
        ...manualData,
        accountNumber: 'Manual Entry',
        billingPeriod: new Date().toLocaleDateString(),
        billVersion: 'Manual Entry v1.0',
        usageAnalysis: {
          trend: "stable",
          percentageChange: 0,
          avg_data_usage_gb: 15.2,
          avg_talk_minutes: 110,
          avg_text_messages: 75
        },
        costAnalysis: {
          averageMonthlyBill: manualData.totalAmount,
          projectedNextBill: manualData.totalAmount * 1.05,
          unusualCharges: [],
          potentialSavings: [
            { description: "Switch to autopay discount", estimatedSaving: 10.00 },
            { description: "Consolidate streaming services", estimatedSaving: 15.00 }
          ]
        },
        planRecommendation: {
          recommendedPlan: "Unlimited Plus",
          reasons: [
            "Better value for multiple lines",
            "Includes premium streaming perks",
            "Higher mobile hotspot data allowance"
          ],
          estimatedMonthlySavings: 45.95,
          confidenceScore: 0.7,
          alternativePlans: [
            {
              name: "Unlimited Welcome",
              monthlyCost: manualData.totalAmount * 0.85,
              pros: ["Lower cost", "Unlimited data"],
              cons: ["Fewer premium features", "Lower priority data"],
              estimatedSavings: 35.50
            }
          ]
        },
        chargesByCategory,
        networkPreference: manualData.networkPreference || null,
        accountInfo: {
          customerName: "Manual Entry User",
          accountNumber: "Manual-" + Date.now().toString().substring(0, 6),
          billingPeriod: new Date().toLocaleDateString()
        }
      };
      
      setBillData(enhancedData);
      
      await saveBillAnalysis(enhancedData);
      
      toast.success("Manual bill data analyzed successfully!");
    } catch (error) {
      console.error('Error processing manual data:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setErrorMessage(errorMsg);
      toast.error(`Failed to process manual data: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateChargesByCategory = (phoneLines: any[]) => {
    let planCharges = 0;
    let devicePayments = 0;
    let services = 0;
    
    phoneLines.forEach(line => {
      if (line.details) {
        let planDiscount = line.details.planDiscount || 0;
        planCharges += (line.details.planCost || 0) - planDiscount;
        
        devicePayments += (line.details.devicePayment || 0) - (line.details.deviceCredit || 0);
        services += (line.details.protection || 0);
      }
    });
    
    return {
      "Plan Charges": planCharges,
      "Device Payments": devicePayments,
      "Services & Add-ons": services,
      "Taxes & Fees": (planCharges + devicePayments + services) * 0.08 // Estimate taxes at 8%
    };
  };

  const calculateCarrierSavings = (carrierId: string) => {
    if (!billData) {
      return {
        monthlySavings: 0,
        annualSavings: 0,
        planName: "N/A",
        price: 0
      };
    }
    
    const numberOfLines = billData.phoneLines?.length || 1;
    
    const premiumPlans: Record<string, string> = {
      'darkstar': 'darkstar-premium',
      'warp': 'warp-premium',
      'lightspeed': 'lightspeed-premium'
    };
    
    const matchingPlanId = premiumPlans[carrierId as keyof typeof premiumPlans] || findBestCarrierMatch(carrierId);
    
    const carrierPlan = alternativeCarrierPlans.find(plan => plan.id === matchingPlanId);
    
    if (!carrierPlan) {
      return {
        monthlySavings: 0,
        annualSavings: 0,
        planName: "No matching plan",
        price: 0
      };
    }
    
    const basePricePerLine = 44; // Standard pricing for all premium plans
    const finalPrice = basePricePerLine * numberOfLines;
    
    const monthlySavings = billData.totalAmount - finalPrice;
    const annualSavings = monthlySavings * 12;
    
    return {
      monthlySavings,
      annualSavings,
      planName: carrierPlan.name,
      price: finalPrice
    };
  };

  return {
    billData,
    fileSelected,
    isLoading,
    errorMessage,
    handleFileChange,
    calculateCarrierSavings,
    addManualLineCharges,
    resetBillData
  };
};
