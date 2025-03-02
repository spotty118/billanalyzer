
import React, { useState } from 'react';
import { toast } from 'sonner';
import { BillData } from './verizon-bill-analyzer/types';
import BillUploader from './verizon-bill-analyzer/BillUploader';
import BillHeader from './verizon-bill-analyzer/BillHeader';
import BillTabs from './verizon-bill-analyzer/BillTabs';
import BillSummaryTab from './verizon-bill-analyzer/BillSummaryTab';
import LineDetailsTab from './verizon-bill-analyzer/LineDetailsTab';
import RecommendationsTab from './verizon-bill-analyzer/RecommendationsTab';
import { supabase } from "@/integrations/supabase/client";

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
      
      // Create form data to send the file
      const formData = new FormData();
      formData.append('file', file);
      
      console.log('Uploading bill for analysis...');
      
      // Call the Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('analyze-bill', {
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (error) {
        throw new Error(`API error: ${error.message}`);
      }
      
      if (!data) {
        throw new Error('No data returned from analysis');
      }
      
      console.log('Analysis data received:', data);
      
      // Set the bill data from the response
      setBillData(data);
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
