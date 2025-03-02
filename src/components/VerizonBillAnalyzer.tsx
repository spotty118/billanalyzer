
import React, { useState } from 'react';
import { toast } from 'sonner';
import { BillData } from './verizon-bill-analyzer/types';
import { transformAnalysisData } from './verizon-bill-analyzer/utils';
import BillUploader from './verizon-bill-analyzer/BillUploader';
import BillHeader from './verizon-bill-analyzer/BillHeader';
import BillTabs from './verizon-bill-analyzer/BillTabs';
import BillSummaryTab from './verizon-bill-analyzer/BillSummaryTab';
import LineDetailsTab from './verizon-bill-analyzer/LineDetailsTab';
import RecommendationsTab from './verizon-bill-analyzer/RecommendationsTab';

const VerizonBillAnalyzer: React.FC = () => {
  const [billData, setBillData] = useState<BillData | null>(null);
  const [fileSelected, setFileSelected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('summary');
  const [expandedLine, setExpandedLine] = useState<number | null>(null);
  const [expandedSection, setExpandedSection] = useState<string>('charges');
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setFileSelected(true);
    setIsLoading(true);
    setError(null);

    try {
      // Check if file type is supported
      if (file.type !== 'application/pdf' && file.type !== 'text/plain') {
        throw new Error('Unsupported file format. Please upload a PDF or text file.');
      }
      
      // For now, we'll provide sample data as we don't have a server-side component
      // In a production environment, you would send this to a real server endpoint
      
      // Simulate API response with sample data
      const sampleData = {
        accountNumber: "123456789",
        totalAmount: 185.99,
        billingPeriod: "May 1 - May 31, 2023",
        phoneLines: [
          {
            phoneNumber: "555-123-4567",
            deviceName: "iPhone 13 Pro",
            planName: "Unlimited Plus",
            monthlyTotal: 90.99,
            details: {
              planCost: 80,
              planDiscount: 10,
              devicePayment: 29.99,
              deviceCredit: 15,
              protection: 15,
              perks: 5,
              perksDiscount: 5,
              surcharges: 4,
              taxes: 2
            }
          },
          {
            phoneNumber: "555-987-6543",
            deviceName: "Samsung Galaxy S22",
            planName: "Unlimited Welcome",
            monthlyTotal: 75,
            details: {
              planCost: 65,
              planDiscount: 5,
              devicePayment: 25,
              deviceCredit: 10,
              protection: 12,
              perks: 0,
              perksDiscount: 0,
              surcharges: 3.5,
              taxes: 4.5
            }
          }
        ],
        chargesByCategory: {
          plans: 130,
          devices: 30,
          protection: 27,
          surcharges: 7.5,
          taxes: 6.5,
          other: 0
        }
      };
      
      // Transform the sample data into the BillData format
      const processedData = transformAnalysisData(sampleData);
      
      setBillData(processedData);
      toast.success("Bill successfully analyzed!");
    } catch (error) {
      console.error('Error processing file:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred while processing the bill');
      toast.error('Failed to analyze the bill. Please try again or use a different file format.');
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

  return (
    <div className="flex flex-col w-full max-w-6xl mx-auto bg-white rounded-lg shadow">
      {!billData ? (
        <BillUploader 
          fileSelected={fileSelected}
          isLoading={isLoading}
          error={error}
          handleFileChange={handleFileChange}
        />
      ) : (
        <div className="flex flex-col">
          <BillHeader billData={billData} />
          <BillTabs activeTab={activeTab} setActiveTab={setActiveTab} />
          
          <div className="p-6">
            {activeTab === 'summary' && (
              <BillSummaryTab 
                billData={billData} 
                expandedSection={expandedSection}
                toggleSectionExpansion={toggleSectionExpansion}
              />
            )}
            
            {activeTab === 'lines' && (
              <LineDetailsTab 
                billData={billData}
                expandedLine={expandedLine}
                toggleLineExpansion={toggleLineExpansion}
              />
            )}
            
            {activeTab === 'recommendations' && (
              <RecommendationsTab billData={billData} />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VerizonBillAnalyzer;
