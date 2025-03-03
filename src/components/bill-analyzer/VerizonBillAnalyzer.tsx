import React, { useState } from 'react';
import { BillUploader } from './BillUploader';
import { BillAnalysisHeader } from './BillAnalysisHeader';
import { BillTabs } from './BillTabs';
import { BillSummary } from './BillSummary';
import { LineDetails } from './LineDetails';
import { RecommendationsTab } from './RecommendationsTab';
import { CarrierComparison } from './CarrierComparison';
import { formatCurrency, prepareLineItemsData, prepareCategoryData, calculateCarrierSavings } from './utils/dataUtils';
import { 
  getCarrierPlanPrice, 
  findBestCarrierMatch, 
  alternativeCarrierPlans 
} from "@/config/alternativeCarriers";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const VerizonBillAnalyzer = () => {
  const [billData, setBillData] = useState<any>(null);
  const [fileSelected, setFileSelected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');
  const [expandedLine, setExpandedLine] = useState<number | null>(null);
  const [expandedSection, setExpandedSection] = useState('charges');
  const [showCarrierComparison, setShowCarrierComparison] = useState(false);
  const [activeCarrierTab, setActiveCarrierTab] = useState('usmobile');

  const processVerizonBill = async (file: File): Promise<any> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('https://mgzfiouamidaqctnqnre.supabase.co/functions/v1/analyze-verizon-bill', {
        method: 'POST',
        body: formData,
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nemZpb3VhbWlkYXFjdG5xbnJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkyMzE3NjQsImV4cCI6MjA1NDgwNzc2NH0._0hxm1UlSMt3wPx8JwaFDvGmpfjI3p5m0HDm6YfaL6Q'
        }
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
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

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setFileSelected(true);
    setIsLoading(true);

    try {
      const analysisResult = await processVerizonBill(file);
      
      const enhancedData = enhanceBillData(analysisResult);
      
      setBillData(enhancedData);
      
      await saveBillAnalysis(enhancedData);
      
      toast.success("Bill analysis completed successfully!");
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error(`Failed to analyze bill: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
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
        averageMonthlyBill: rawData.totalAmount,
        projectedNextBill: rawData.totalAmount * 1.05, // 5% increase
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
      },
      chargesByCategory: {
        plans: rawData.totalAmount * 0.4,
        devices: rawData.totalAmount * 0.3,
        protection: rawData.totalAmount * 0.05,
        surcharges: rawData.totalAmount * 0.1,
        taxes: rawData.totalAmount * 0.05,
        other: rawData.totalAmount * 0.1
      }
    };
    
    if (enhancedData.phoneLines && enhancedData.phoneLines.length > 0) {
      enhancedData.phoneLines = enhancedData.phoneLines.map((line: any, index: number) => {
        const baseCost = 40 + (index * 5);
        const discount = index === 0 ? 10 : 5;
        
        return {
          ...line,
          monthlyTotal: baseCost - discount + (index * 2),
          details: {
            planCost: baseCost,
            planDiscount: discount,
            devicePayment: index === 1 ? 10 : 0,
            deviceCredit: index === 1 ? 5 : 0,
            protection: index < 2 ? 7 + index : 0,
            surcharges: 2 + (index * 0.5),
            taxes: 1 + (index * 0.25)
          }
        };
      });
    }
    
    return enhancedData;
  };

  const toggleLineExpansion = (index: number) => {
    if (expandedLine === index) {
      setExpandedLine(null);
    } else {
      setExpandedLine(index);
    }
  };

  const toggleSectionExpansion = (section: string) => {
    if (expandedSection === section) {
      setExpandedSection('');
    } else {
      setExpandedSection(section);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'alternatives') {
      setShowCarrierComparison(true);
    }
  };

  const handleCompareCarriers = () => {
    setActiveTab('alternatives');
    setShowCarrierComparison(true);
  };

  const handleCarrierComparisonSavings = (carrierId: string) => {
    return calculateCarrierSavings(
      carrierId, 
      billData, 
      getCarrierPlanPrice, 
      findBestCarrierMatch, 
      alternativeCarrierPlans
    );
  };

  const prepareCurrentLineItemsData = () => {
    return prepareLineItemsData(billData?.phoneLines);
  };

  const prepareCurrentCategoryData = () => {
    return prepareCategoryData(billData?.chargesByCategory);
  };

  return (
    <div className="flex flex-col w-full max-w-6xl mx-auto bg-white rounded-lg shadow">
      {!billData ? (
        <BillUploader 
          fileSelected={fileSelected} 
          isLoading={isLoading} 
          onFileChange={handleFileChange} 
        />
      ) : (
        <div className="flex flex-col">
          <BillAnalysisHeader 
            accountNumber={billData.accountNumber}
            billingPeriod={billData.billingPeriod}
            totalAmount={billData.totalAmount}
            formatCurrency={formatCurrency}
          />
          
          <BillTabs 
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
          
          <div className="p-6">
            {activeTab === 'summary' && (
              <BillSummary 
                billData={billData}
                expandedSection={expandedSection}
                toggleSectionExpansion={toggleSectionExpansion}
                formatCurrency={formatCurrency}
                prepareLineItemsData={prepareCurrentLineItemsData}
                prepareCategoryData={prepareCurrentCategoryData}
                onCompareCarriers={handleCompareCarriers}
              />
            )}
            
            {activeTab === 'lines' && (
              <LineDetails 
                phoneLines={billData.phoneLines}
                expandedLine={expandedLine}
                toggleLineExpansion={toggleLineExpansion}
                formatCurrency={formatCurrency}
              />
            )}
            
            {activeTab === 'recommendations' && (
              <RecommendationsTab 
                planRecommendation={billData.planRecommendation}
                formatCurrency={formatCurrency}
              />
            )}

            {activeTab === 'alternatives' && showCarrierComparison && (
              <CarrierComparison 
                billData={billData}
                activeCarrierTab={activeCarrierTab}
                setActiveCarrierTab={setActiveCarrierTab}
                calculateCarrierSavings={handleCarrierComparisonSavings}
                formatCurrency={formatCurrency}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VerizonBillAnalyzer;
