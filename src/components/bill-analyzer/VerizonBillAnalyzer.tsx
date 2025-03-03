
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
      
      // Call the bill analyzer function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-verizon-bill`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze bill');
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
      // Process the actual file instead of using mock data
      const analysisResult = await processVerizonBill(file);
      setBillData(analysisResult);
      
      // Save the analysis to Supabase
      await saveBillAnalysis(analysisResult);
      
      toast.success("Bill analysis completed successfully!");
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error("Failed to analyze bill. Please try again.");
      
      // If actual processing fails, we can use mock data as a fallback for development
      if (process.env.NODE_ENV === 'development') {
        console.log('Using mock data as fallback in development mode');
        
        // This is just for development fallback
        const mockData = {
          accountNumber: "526905159-00001",
          billingPeriod: "December 12, 2024 to January 11, 2025",
          totalAmount: 646.30,
          usageAnalysis: {
            trend: "stable",
            percentageChange: 0,
            avg_data_usage_gb: 25.4,
            avg_talk_minutes: 120,
            avg_text_messages: 85
          },
          costAnalysis: {
            averageMonthlyBill: 646.30,
            projectedNextBill: 678.62,
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
                monthlyCost: 581.67,
                pros: ["Lower cost", "Unlimited data"],
                cons: ["Fewer premium features", "Lower priority data"],
                estimatedSavings: 64.63
              }
            ]
          },
          phoneLines: [
            {
              phoneNumber: "251-747-0017",
              deviceName: "Apple iPhone 15 Pro Max",
              planName: "Unlimited Plus",
              monthlyTotal: 40.78,
              details: {
                planCost: 52.00,
                planDiscount: 26.00,
                devicePayment: 0,
                protection: 7.95,
                perks: 10.00,
                perksDiscount: 5.00,
                surcharges: 4.25,
                taxes: 2.58
              }
            },
            {
              phoneNumber: "251-215-3255",
              deviceName: "Apple iPad (8TH Generation)",
              planName: "More Unlimited",
              monthlyTotal: 15.34,
              details: {
                planCost: 30.00,
                planDiscount: 22.50,
                devicePayment: 12.77,
                deviceCredit: 12.77,
                protection: 4.95,
                surcharges: 1.62,
                taxes: 1.27
              }
            },
            {
              phoneNumber: "251-747-0017",
              deviceName: "Apple Watch Ultra 2 (Number Share)",
              planName: "Number Share",
              monthlyTotal: 10.37,
              details: {
                planCost: 4.13,
                surcharges: 4.25,
                taxes: 2.49
              }
            }
          ],
          chargesByCategory: {
            plans: 190.13,
            devices: 245.22,
            protection: 28.80,
            surcharges: 18.37,
            taxes: 15.57,
            other: 148.21
          }
        };
        
        setBillData(mockData);
      }
    } finally {
      setIsLoading(false);
    }
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
