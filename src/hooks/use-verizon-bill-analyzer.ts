import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  alternativeCarrierPlans, 
  getCarrierPlanPrice, 
  findBestCarrierMatch 
} from "@/config/alternativeCarriers";

export type NetworkPreference = 'verizon' | 'tmobile' | 'att' | 'usmobile' | null;

export const useVerizonBillAnalyzer = () => {
  const [billData, setBillData] = useState<any>(null);
  const [fileSelected, setFileSelected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [ocrProvider, setOcrProvider] = useState<string | null>(null);

  const calculateCarrierSavings = (carrierId: string) => {
    const numberOfLines = billData?.phoneLines?.length || 1;
    const currentMonthlyTotal = billData?.totalAmount || 0;
    
    console.log(`Calculating savings for carrier ${carrierId} with ${numberOfLines} lines`);
    console.log(`Current monthly total: ${currentMonthlyTotal}`);
    
    // Find the matching carrier plan
    const matchingPlanId = findBestCarrierMatch(carrierId);
    const carrierPlan = alternativeCarrierPlans.find(plan => plan.id === matchingPlanId);
    
    if (!carrierPlan) {
      console.error(`No matching plan found for carrier ID: ${carrierId}`);
      return {
        monthlySavings: 0,
        annualSavings: 0,
        planName: "No matching plan",
        price: 0
      };
    }
    
    // Calculate the price for the carrier plan using the imported function
    const carrierPrice = getCarrierPlanPrice(carrierPlan, numberOfLines);
    console.log(`Carrier: ${carrierId}, Plan: ${carrierPlan.name}, Price: ${carrierPrice}`);
    
    // Calculate savings (current bill - carrier price)
    const monthlySavings = currentMonthlyTotal - carrierPrice;
    const annualSavings = monthlySavings * 12;
    
    console.log(`Monthly savings: ${monthlySavings}, Annual savings: ${annualSavings}`);
    
    return {
      monthlySavings,
      annualSavings,
      planName: carrierPlan.name,
      price: carrierPrice
    };
  };

  const addManualLineCharges = (data: any) => {
    if (!data.networkPreference) {
      toast.error('Network preference is required');
      return;
    }
    
    // Format the line details properly
    const formattedLines = data.lines?.map((line: any) => {
      return {
        phoneNumber: line.phoneNumber || '',
        ownerName: line.ownerName || '',
        deviceName: line.deviceName || '',
        planName: line.planName || 'Unlimited Plus',
        monthlyTotal: parseFloat(line.monthlyTotal) || 0,
        details: {
          planCost: parseFloat(line.planCost) || 0,
          planDiscount: parseFloat(line.discount) || 0,
          devicePayment: parseFloat(line.devicePayment) || 0,
          deviceCredit: parseFloat(line.deviceCredit) || 0,
          protection: parseFloat(line.protection) || 0,
          perks: line.perks || [],
          surcharges: parseFloat(line.surcharges) || 0,
          taxes: parseFloat(line.taxes) || 0
        }
      };
    }) || [];
    
    // Calculate total amount from line totals
    const totalAmount = formattedLines.reduce(
      (sum: number, line: any) => sum + (line.monthlyTotal || 0), 
      0
    );
    
    // Create category breakdown
    const planCharges = formattedLines.reduce(
      (sum: number, line: any) => sum + ((line.details.planCost || 0) - (line.details.planDiscount || 0)), 
      0
    );
    
    const devicePayments = formattedLines.reduce(
      (sum: number, line: any) => sum + ((line.details.devicePayment || 0) - (line.details.deviceCredit || 0)), 
      0
    );
    
    const servicesAndAddons = formattedLines.reduce(
      (sum: number, line: any) => sum + (line.details.protection || 0), 
      0
    );
    
    const taxesAndFees = formattedLines.reduce(
      (sum: number, line: any) => sum + ((line.details.surcharges || 0) + (line.details.taxes || 0)), 
      0
    );
    
    const formattedData = {
      accountInfo: {
        customerName: data.accountNumber || 'Manual Entry',
        accountNumber: data.accountNumber || `ACCT-${Date.now().toString().substring(0, 8)}`,
        billingPeriod: data.billingPeriod || new Date().toLocaleDateString(),
        billDate: new Date().toLocaleDateString(),
        dueDate: ''
      },
      totalAmount: totalAmount,
      networkPreference: data.networkPreference,
      phoneLines: formattedLines,
      chargesByCategory: {
        "Plan Charges": planCharges,
        "Device Payments": devicePayments,
        "Services & Add-ons": servicesAndAddons,
        "Taxes & Fees": taxesAndFees,
        "Discounts & Credits": 0
      },
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

  const processVerizonBill = async (file: File, networkPreference?: NetworkPreference): Promise<any> => {
    try {
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
      if (file.size > MAX_FILE_SIZE) {
        throw new Error("File too large (max 10MB)");
      }
      
      const formData = new FormData();
      formData.append('file', file);
      
      // Add network preference if provided
      if (networkPreference) {
        formData.append('networkPreference', networkPreference);
      }
      
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
      
      // Validate the response structure
      if (!analysisResponse.totalAmount && !analysisResponse.accountInfo) {
        throw new Error("Invalid response format from analysis service");
      }
      
      // Ensure all phone lines have the required details properties
      if (analysisResponse.phoneLines) {
        analysisResponse.phoneLines = analysisResponse.phoneLines.map((line: any) => {
          if (!line.details) {
            line.details = {};
          }
          
          // Ensure all required details exist
          line.details = {
            planCost: parseFloat(line.details.planCost) || 0,
            planDiscount: parseFloat(line.details.planDiscount) || 0,
            devicePayment: parseFloat(line.details.devicePayment) || 0,
            deviceCredit: parseFloat(line.details.deviceCredit) || 0,
            protection: parseFloat(line.details.protection) || 0,
            perks: line.details.perks || [],
            surcharges: parseFloat(line.details.surcharges) || 0,
            taxes: parseFloat(line.details.taxes) || 0
          };
          
          return line;
        });
      }
      
      // Store OCR provider info
      setOcrProvider(analysisResponse.analysisSource || 'claude');
      
      // Include network preference if provided
      if (networkPreference) {
        analysisResponse.networkPreference = networkPreference;
      }
      
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
        body: JSON.stringify({ 
          text, 
          networkPreference 
        }),
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
      
      // Ensure proper structure for phoneLines and details
      if (analysisResponse.phoneLines) {
        analysisResponse.phoneLines = analysisResponse.phoneLines.map((line: any) => {
          if (!line.details) {
            line.details = {};
          }
          
          // Ensure all required properties exist with defaults
          line.details = {
            planCost: parseFloat(line.details.planCost) || 0,
            planDiscount: parseFloat(line.details.planDiscount) || 0,
            devicePayment: parseFloat(line.details.devicePayment) || 0,
            deviceCredit: parseFloat(line.details.deviceCredit) || 0,
            protection: parseFloat(line.details.protection) || 0,
            perks: line.details.perks || [],
            surcharges: parseFloat(line.details.surcharges) || 0,
            taxes: parseFloat(line.details.taxes) || 0,
            ...line.details
          };
          
          return line;
        });
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
      toast.info("Analyzing bill text with Our AI...");
      const analysisResult = await processBillText(text, networkPreference);
      
      if (!analysisResult || typeof analysisResult !== 'object') {
        throw new Error('Invalid analysis result received');
      }
      
      // Add network preference to analysis result
      const resultWithNetwork = {
        ...analysisResult,
        networkPreference
      };
      
      // Ensure each phone line has proper details structure and calculated monthly total
      if (resultWithNetwork.phoneLines && resultWithNetwork.phoneLines.length > 0) {
        resultWithNetwork.phoneLines = resultWithNetwork.phoneLines.map((line: any) => {
          if (!line.details) {
            line.details = {};
          }
          
          // Ensure all properties exist
          const details = {
            planCost: parseFloat(line.details.planCost) || 0,
            planDiscount: parseFloat(line.details.planDiscount) || 0,
            devicePayment: parseFloat(line.details.devicePayment) || 0,
            deviceCredit: parseFloat(line.details.deviceCredit) || 0,
            protection: parseFloat(line.details.protection) || 0,
            perks: line.details.perks || [],
            surcharges: parseFloat(line.details.surcharges) || 0,
            taxes: parseFloat(line.details.taxes) || 0
          };
          
          // Calculate monthly total if missing
          const total = 
            details.planCost - 
            details.planDiscount + 
            details.devicePayment - 
            details.deviceCredit + 
            details.protection + 
            details.surcharges + 
            details.taxes;
          
          return {
            ...line,
            details,
            monthlyTotal: line.monthlyTotal || total
          };
        });
      }
      
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
      toast.info("Analyzing bill with Our AI...");
      const networkPreference = billData?.networkPreference || null;
      const analysisResult = await processVerizonBill(file, networkPreference);
      
      if (!analysisResult || typeof analysisResult !== 'object') {
        throw new Error('Invalid analysis result received');
      }
      
      // Ensure each phone line has proper details structure and calculated monthly total
      if (analysisResult.phoneLines && analysisResult.phoneLines.length > 0) {
        analysisResult.phoneLines = analysisResult.phoneLines.map((line: any) => {
          if (!line.details) {
            line.details = {};
          }
          
          // Ensure all properties exist
          const details = {
            planCost: parseFloat(line.details.planCost) || 0,
            planDiscount: parseFloat(line.details.planDiscount) || 0,
            devicePayment: parseFloat(line.details.devicePayment) || 0,
            deviceCredit: parseFloat(line.details.deviceCredit) || 0,
            protection: parseFloat(line.details.protection) || 0,
            perks: line.details.perks || [],
            surcharges: parseFloat(line.details.surcharges) || 0,
            taxes: parseFloat(line.details.taxes) || 0
          };
          
          // Calculate monthly total if missing
          const total = 
            details.planCost - 
            details.planDiscount + 
            details.devicePayment - 
            details.deviceCredit + 
            details.protection + 
            details.surcharges + 
            details.taxes;
          
          return {
            ...line,
            details,
            monthlyTotal: line.monthlyTotal || total
          };
        });
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
