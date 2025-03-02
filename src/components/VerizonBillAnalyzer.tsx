
import React, { useState } from 'react';
import { toast } from 'sonner';
import { BillData, BillAnalysisResponse } from './verizon-bill-analyzer/types';
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
      // Read the file and create a FormData object to send to the server
      const formData = new FormData();
      formData.append('billFile', file);
      
      // Check if file type is supported
      if (file.type !== 'application/pdf' && file.type !== 'text/plain') {
        throw new Error('Unsupported file format. Please upload a PDF or text file.');
      }
      
      // Send the file to the server for processing
      const response = await fetch('/api/analyze-bill', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Error analyzing bill: ${errorData.error || response.statusText}`);
      }
      
      // Get the analysis results from the server
      const analysisResult: BillAnalysisResponse = await response.json();
      
      // Transform the analysis result into the BillData format
      const processedData = transformAnalysisData(analysisResult);
      
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
