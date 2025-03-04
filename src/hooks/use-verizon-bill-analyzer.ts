
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { NetworkPreference } from '@/components/bill-analyzer/VerizonBillAnalyzer';

export const useVerizonBillAnalyzer = () => {
  const [billData, setBillData] = useState<any>(null);
  const [fileSelected, setFileSelected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [ocrProvider, setOcrProvider] = useState<string | null>(null);

  const calculateCarrierSavings = (carrierId: string) => {
    const numberOfLines = billData?.phoneLines?.length || 1;
    const currentMonthlyTotal = billData?.totalAmount || 0;
    
    let savings = 0;
    let price = currentMonthlyTotal;
    
    // Calculate savings based on number of lines and carrier
    if (carrierId === 'usmobile') {
      savings = currentMonthlyTotal * (numberOfLines > 3 ? 0.45 : 0.4);
      price = currentMonthlyTotal - savings;
    }
    
    return {
      monthlySavings: savings,
      annualSavings: savings * 12,
      planName: `US Mobile ${carrierId === 'usmobile' ? 'Unlimited' : 'Premium'} Plan`,
      price: price
    };
  };

  const addManualLineCharges = (data: any) => {
    if (!data.networkPreference) {
      toast.error('Network preference is required');
      return;
    }
    
    const formattedData = {
      accountNumber: data.accountNumber || `ACCT-${Date.now().toString().substring(0, 8)}`,
      billingPeriod: data.billingPeriod || new Date().toLocaleDateString(),
      totalAmount: data.totalAmount || 0,
      networkPreference: data.networkPreference,
      phoneLines: data.lines || [],
      manualEntry: true
    };
    
    setBillData(formattedData);
    
    try {
      saveBillAnalysis(formattedData);
      toast.success('Manual bill data saved successfully');
    } catch (error) {
      console.error('Error saving manual bill data:', error);
      toast.error('Failed to save manual bill data');
    }
  };

  const resetBillData = () => {
    setBillData(null);
    setFileSelected(false);
    setErrorMessage(null);
    setOcrProvider(null);
  };

  const processVerizonBill = async (file: File): Promise<any> => {
    try {
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
      if (file.size > MAX_FILE_SIZE) {
        throw new Error("File too large (max 10MB)");
      }
      
      const formData = new FormData();
      formData.append('file', file);
      
      const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nemZpb3VhbWlkYXFjdG5xbnJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkyMzE3NjQsImV4cCI6MjA1NDgwNzc2NH0._0hxm1UlSMt3wPx8JwaFDvGmpfjI3p5m0HDm6YfaL6Q';
      
      console.log('Sending request to analyze bill with Claude OCR...');
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
      
      const analysisResponse = await response.json();
      console.log('Analysis response received:', analysisResponse);
      
      if (analysisResponse.status === "processing") {
        console.log("Bill is being processed asynchronously");
        return {
          status: "processing",
          message: "Your bill is being analyzed. This may take a moment.",
          timestamp: new Date().toISOString(),
          accountNumber: `PROC-${Date.now().toString().substring(0, 6)}`,
          totalAmount: 0,
          phoneLines: [],
          processingMethod: "direct-text-input"
        };
      }
      
      if (analysisResponse.error) {
        throw new Error(analysisResponse.error);
      }
      
      if (!analysisResponse.totalAmount && !analysisResponse.accountInfo) {
        throw new Error("Invalid response format from analysis service");
      }
      
      setOcrProvider(analysisResponse.analysisSource || 'claude');
      
      return analysisResponse;
    } catch (error) {
      console.error('Error processing file:', error);
      throw error;
    }
  };

  const processBillText = async (text: string, networkPreference: NetworkPreference): Promise<any> => {
    try {
      const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nemZpb3VhbWlkYXFjdG5xbnJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkyMzE3NjQsImV4cCI6MjA1NDgwNzc2NH0._0hxm1UlSMt3wPx8JwaFDvGmpfjI3p5m0HDm6YfaL6Q';
      
      console.log('Sending text to analyze with Claude...', text.substring(0, 100) + '...');
      const response = await fetch('https://mgzfiouamidaqctnqnre.supabase.co/functions/v1/analyze-verizon-bill', {
        method: 'POST',
        body: JSON.stringify({ text, networkPreference }),
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
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
      
      const analysisResponse = await response.json();
      console.log('Analysis response received:', analysisResponse);
      
      // If processing asynchronously, return a placeholder
      if (analysisResponse.status === "processing") {
        console.log("Bill is being processed asynchronously");
        return {
          status: "processing",
          message: "Your bill is being analyzed. This may take a moment.",
          timestamp: new Date().toISOString(),
          accountNumber: `PROC-${Date.now().toString().substring(0, 6)}`,
          totalAmount: 0,
          phoneLines: [],
          networkPreference,
          processingMethod: "direct-text-input"
        };
      }
      
      // Handle error in response
      if (analysisResponse.error) {
        throw new Error(analysisResponse.error);
      }
      
      // Validate response format
      if (!analysisResponse.totalAmount && !analysisResponse.accountInfo) {
        console.error("Invalid response format:", analysisResponse);
        throw new Error("Invalid response format from analysis service");
      }
      
      // Ensure the response has the network preference
      const enrichedResponse = {
        ...analysisResponse,
        networkPreference
      };
      
      return enrichedResponse;
    } catch (error) {
      console.error('Error processing bill text:', error);
      throw error;
    }
  };

  const saveBillAnalysis = async (analysis: any) => {
    try {
      if (!analysis.accountNumber && analysis.accountInfo?.accountNumber) {
        analysis.accountNumber = analysis.accountInfo.accountNumber;
      }
      
      if (!analysis.accountNumber) {
        analysis.accountNumber = `ACCT-${Date.now().toString().substring(0, 8)}`;
        console.log('Generated fallback account number:', analysis.accountNumber);
      }
      
      const billingPeriod = analysis.billingPeriod || 
                           analysis.accountInfo?.billingPeriod || 
                           new Date().toLocaleDateString();
      
      const totalAmount = analysis.totalAmount || 
                         (analysis.phoneLines && analysis.phoneLines.length > 0 ? 
                          analysis.phoneLines.reduce((sum: number, line: any) => sum + (line.monthlyTotal || 0), 0) : 
                          0);
      
      const { error } = await supabase
        .from('bill_analyses')
        .insert({
          account_number: analysis.accountNumber,
          billing_period: billingPeriod,
          total_amount: totalAmount,
          analysis_data: analysis
        });
        
      if (error) {
        console.error('Error details from Supabase:', error);
        throw error;
      }
      
      console.log('Successfully saved bill analysis to database');
    } catch (error) {
      console.error('Error saving bill analysis:', error);
    }
  };

  const analyzeBillText = async (text: string, networkPreference: NetworkPreference) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      toast.info("Analyzing bill text with Claude AI...");
      const analysisResult = await processBillText(text, networkPreference);
      
      if (!analysisResult || typeof analysisResult !== 'object') {
        throw new Error('Invalid analysis result received');
      }
      
      // Add network preference to analysis result
      const resultWithNetwork = {
        ...analysisResult,
        networkPreference
      };
      
      setBillData(resultWithNetwork);
      
      try {
        await saveBillAnalysis(resultWithNetwork);
        console.log("Bill text analysis saved to database");
      } catch (dbError) {
        console.error("Error saving to database, but analysis completed:", dbError);
      }
      
      toast.success('Bill analysis completed successfully');
      return resultWithNetwork;
    } catch (error) {
      console.error('Error processing bill text:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setErrorMessage(errorMsg);
      toast.error(`Failed to analyze bill text: ${errorMsg}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
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
      toast.info("Analyzing bill with Claude AI...");
      const analysisResult = await processVerizonBill(file);
      
      if (!analysisResult || typeof analysisResult !== 'object') {
        throw new Error('Invalid analysis result received');
      }
      
      setBillData(analysisResult);
      
      try {
        await saveBillAnalysis(analysisResult);
        console.log("Bill analysis saved to database");
      } catch (dbError) {
        console.error("Error saving to database, but analysis completed:", dbError);
      }
      
      toast.success('Bill analysis completed successfully');
    } catch (error) {
      console.error('Error processing file:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setErrorMessage(errorMsg);
      toast.error(`Failed to analyze bill: ${errorMsg}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    billData,
    fileSelected,
    isLoading,
    errorMessage,
    ocrProvider,
    handleFileChange,
    analyzeBillText,
    resetBillData,
    calculateCarrierSavings,
    addManualLineCharges
  };
};
