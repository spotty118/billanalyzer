
import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, TooltipProps } from 'recharts';
import { DollarSign, PhoneCall, Wifi, Clock, Tag, ChevronRight, ChevronDown, Smartphone, Tablet, AlertCircle, Check } from 'lucide-react';
import { toast } from 'sonner';
import { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent';

// Define the data structures for bill analysis
interface BillLineDetails {
  planCost?: number;
  planDiscount?: number;
  devicePayment?: number;
  deviceCredit?: number;
  protection?: number;
  perks?: number;
  perksDiscount?: number;
  surcharges?: number;
  taxes?: number;
}

interface PhoneLine {
  phoneNumber: string;
  deviceName: string;
  planName: string;
  monthlyTotal: number;
  details: BillLineDetails;
  charges?: any[];
}

interface PotentialSaving {
  description: string;
  estimatedSaving: number;
}

interface AlternativePlan {
  name: string;
  monthlyCost: number;
  pros: string[];
  cons: string[];
  estimatedSavings: number;
}

interface BillData {
  accountNumber: string;
  billingPeriod: string;
  totalAmount: number;
  usageAnalysis: {
    trend: string;
    percentageChange: number;
    avg_data_usage_gb: number;
    avg_talk_minutes: number;
    avg_text_messages: number;
  };
  costAnalysis: {
    averageMonthlyBill: number;
    projectedNextBill: number;
    unusualCharges: any[];
    potentialSavings: PotentialSaving[];
  };
  planRecommendation: {
    recommendedPlan: string;
    reasons: string[];
    estimatedMonthlySavings: number;
    confidenceScore: number;
    alternativePlans: AlternativePlan[];
  };
  phoneLines: PhoneLine[];
  chargesByCategory: {
    plans: number;
    devices: number;
    protection: number;
    surcharges: number;
    taxes: number;
    other: number;
  };
}

interface BillAnalysisResponse {
  accountNumber: string;
  totalAmount: number;
  billingPeriod: string;
  devices: Array<{
    device: string;
    deviceType: string;
    phoneNumber: string;
    planType: string;
  }>;
  phoneLines: PhoneLine[];
  charges: any[];
}

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
      
      // Send the file to the server for processing
      const response = await fetch('/api/analyze-bill', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Error analyzing bill: ${response.statusText}`);
      }
      
      // Get the analysis results from the server
      const analysisResult: BillAnalysisResponse = await response.json();
      
      // Transform the analysis result into the BillData format
      const processedData = transformAnalysisData(analysisResult);
      
      setBillData(processedData);
    } catch (error) {
      console.error('Error processing file:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred while processing the bill');
      toast.error('Failed to analyze the bill. Please try again or use a different file format.');
    } finally {
      setIsLoading(false);
    }
  };

  // Transform the API response into the format expected by the component
  const transformAnalysisData = (analysisResult: BillAnalysisResponse): BillData => {
    // Extract phone lines and calculate monthly totals
    const phoneLines = analysisResult.phoneLines.map(line => {
      // Calculate the total for this line based on the details
      const details = {
        planCost: 0,
        planDiscount: 0,
        devicePayment: 0,
        deviceCredit: 0,
        protection: 0,
        perks: 0,
        perksDiscount: 0,
        surcharges: 0,
        taxes: 0,
        ...line.details
      };
      
      // Calculate monthly total from details
      const monthlyTotal = (details.planCost || 0) - 
                          (details.planDiscount || 0) + 
                          (details.devicePayment || 0) - 
                          (details.deviceCredit || 0) + 
                          (details.protection || 0) + 
                          (details.perks || 0) - 
                          (details.perksDiscount || 0) + 
                          (details.surcharges || 0) + 
                          (details.taxes || 0);
      
      return {
        ...line,
        monthlyTotal,
        details
      };
    });
    
    // Calculate charges by category
    const chargesByCategory = {
      plans: phoneLines.reduce((sum, line) => sum + (line.details.planCost || 0) - (line.details.planDiscount || 0), 0),
      devices: phoneLines.reduce((sum, line) => sum + (line.details.devicePayment || 0) - (line.details.deviceCredit || 0), 0),
      protection: phoneLines.reduce((sum, line) => sum + (line.details.protection || 0), 0),
      surcharges: phoneLines.reduce((sum, line) => sum + (line.details.surcharges || 0), 0),
      taxes: phoneLines.reduce((sum, line) => sum + (line.details.taxes || 0), 0),
      other: phoneLines.reduce((sum, line) => sum + (line.details.perks || 0) - (line.details.perksDiscount || 0), 0)
    };
    
    // Generate usage analysis based on the data
    const usageAnalysis = {
      trend: 'stable',  // This would come from comparing historical usage
      percentageChange: 0,
      avg_data_usage_gb: 15, // Placeholder values - would be derived from usage data
      avg_talk_minutes: 250,
      avg_text_messages: 500
    };
    
    // Cost analysis - would be derived from historical bill data
    const costAnalysis = {
      averageMonthlyBill: analysisResult.totalAmount,
      projectedNextBill: analysisResult.totalAmount * 1.05, // Sample projection
      unusualCharges: [],
      potentialSavings: generatePotentialSavings(phoneLines, analysisResult.totalAmount)
    };
    
    // Plan recommendation based on usage and cost
    const planRecommendation = generatePlanRecommendation(phoneLines, analysisResult.totalAmount);
    
    return {
      accountNumber: analysisResult.accountNumber,
      billingPeriod: analysisResult.billingPeriod,
      totalAmount: analysisResult.totalAmount,
      usageAnalysis,
      costAnalysis,
      planRecommendation,
      phoneLines,
      chargesByCategory
    };
  };

  // Generate potential savings recommendations
  const generatePotentialSavings = (phoneLines: PhoneLine[], totalAmount: number): PotentialSaving[] => {
    const potentialSavings: PotentialSaving[] = [];
    
    // Check for protection plans that might be redundant
    const protectionCosts = phoneLines.reduce((sum, line) => sum + (line.details.protection || 0), 0);
    if (protectionCosts > 0) {
      potentialSavings.push({
        description: "Optimize device protection plans",
        estimatedSaving: protectionCosts * 0.4
      });
    }
    
    // Check for plan optimization opportunities
    potentialSavings.push({
      description: "Switch to a more appropriate plan based on your usage",
      estimatedSaving: totalAmount * 0.15
    });
    
    // Check for autopay and paperless billing discounts
    potentialSavings.push({
      description: "Enable autopay and paperless billing",
      estimatedSaving: phoneLines.length * 10
    });
    
    return potentialSavings;
  };

  // Generate plan recommendations
  const generatePlanRecommendation = (phoneLines: PhoneLine[], totalAmount: number): BillData["planRecommendation"] => {
    // Sample recommendation - would be based on detailed usage analysis
    const estimatedSavings = totalAmount * 0.15;
    
    return {
      recommendedPlan: "Unlimited Plus",
      reasons: [
        "Based on your multiple device lines",
        "Includes premium features with better value",
        "Optimized for your average data usage"
      ],
      estimatedMonthlySavings: estimatedSavings,
      confidenceScore: 0.8,
      alternativePlans: [
        {
          name: "Unlimited Welcome",
          monthlyCost: totalAmount - estimatedSavings - 20,
          pros: [
            "Lower cost",
            "Unlimited data"
          ],
          cons: [
            "Fewer premium features",
            "Lower priority data"
          ],
          estimatedSavings: estimatedSavings + 20
        },
        {
          name: "Unlimited Ultimate",
          monthlyCost: totalAmount - estimatedSavings + 30,
          pros: [
            "Premium streaming quality",
            "Maximum mobile hotspot data",
            "All available perks included"
          ],
          cons: [
            "Higher monthly cost",
            "May include features you don't need"
          ],
          estimatedSavings: estimatedSavings - 30
        }
      ]
    };
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

  const prepareLineItemsData = () => {
    if (!billData?.phoneLines) return [];
    
    return billData.phoneLines.map((line) => ({
      name: line.deviceName.split(' ').slice(0, 3).join(' '), // Shorten device name
      total: line.monthlyTotal,
      plan: line.details.planCost ? line.details.planCost - (line.details.planDiscount || 0) : 0,
      device: (line.details.devicePayment || 0) - (line.details.deviceCredit || 0),
      protection: line.details.protection || 0,
      taxes: (line.details.surcharges || 0) + (line.details.taxes || 0)
    }));
  };

  const prepareCategoryData = () => {
    if (!billData?.chargesByCategory) return [];
    
    return [
      { name: 'Plans', value: billData.chargesByCategory.plans },
      { name: 'Devices', value: billData.chargesByCategory.devices },
      { name: 'Protection', value: billData.chargesByCategory.protection },
      { name: 'Surcharges', value: billData.chargesByCategory.surcharges },
      { name: 'Taxes', value: billData.chargesByCategory.taxes },
      { name: 'Other', value: billData.chargesByCategory.other }
    ];
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28DFF', '#FF6B6B'];

  const formatCurrency = (value: number) => {
    return `$${value.toFixed(2)}`;
  };

  // Custom tooltip formatter to handle different value types
  const customTooltipFormatter = (value: ValueType, name: NameType) => {
    if (typeof value === 'number') {
      return [`$${value.toFixed(2)}`, name];
    }
    return [value, name];
  };

  return (
    <div className="flex flex-col w-full max-w-6xl mx-auto bg-white rounded-lg shadow">
      {!billData ? (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-blue-50">
            <DollarSign className="w-8 h-8 text-blue-500" />
          </div>
          <h2 className="mb-2 text-2xl font-bold">Verizon Bill Analyzer</h2>
          <p className="mb-6 text-gray-600">
            Upload your Verizon bill to analyze charges, get insights, and find potential savings.
          </p>
          <div className="flex flex-col items-center w-full max-w-md p-6 border-2 border-dashed rounded-lg border-gray-300 hover:border-blue-500">
            <label className="flex flex-col items-center w-full cursor-pointer">
              <span className="text-blue-600 font-medium mb-2">
                {fileSelected ? "File selected" : "Choose a bill file"}
              </span>
              <span className="text-sm text-gray-500">
                {fileSelected ? "Click to change file" : "PDF or text file supported"}
              </span>
              <input 
                type="file" 
                className="hidden" 
                accept=".pdf,.txt" 
                onChange={handleFileChange} 
              />
            </label>
          </div>
          {isLoading && (
            <div className="mt-6 flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-2 text-gray-600">Analyzing your bill...</p>
            </div>
          )}
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <p className="font-medium">Error analyzing bill</p>
              <p className="text-sm">{error}</p>
              <p className="mt-2 text-sm">Try uploading a different file format or contact support.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col">
          {/* Header */}
          <div className="bg-blue-600 p-6 rounded-t-lg text-white">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold">Verizon Bill Analysis</h1>
                <p className="text-blue-100">
                  Account: {billData.accountNumber} | Billing Period: {billData.billingPeriod}
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{formatCurrency(billData.totalAmount)}</div>
                <p className="text-blue-100">Total Amount Due</p>
              </div>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex border-b">
            <button 
              className={`px-6 py-3 font-medium ${activeTab === 'summary' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
              onClick={() => setActiveTab('summary')}
            >
              Summary
            </button>
            <button 
              className={`px-6 py-3 font-medium ${activeTab === 'lines' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
              onClick={() => setActiveTab('lines')}
            >
              Line Details
            </button>
            <button 
              className={`px-6 py-3 font-medium ${activeTab === 'recommendations' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
              onClick={() => setActiveTab('recommendations')}
            >
              Recommendations
            </button>
          </div>
          
          {/* Content */}
          <div className="p-6">
            {activeTab === 'summary' && (
              <div className="space-y-8">
                {/* Charts Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Line Items Chart */}
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="font-bold text-lg mb-4">Charges by Line</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={prepareLineItemsData()}
                          layout="vertical"
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" tickFormatter={value => `$${value}`} />
                          <YAxis dataKey="name" type="category" width={100} />
                          <Tooltip formatter={customTooltipFormatter} />
                          <Legend />
                          <Bar dataKey="plan" name="Plan" stackId="a" fill="#0088FE" />
                          <Bar dataKey="device" name="Device" stackId="a" fill="#00C49F" />
                          <Bar dataKey="protection" name="Protection" stackId="a" fill="#FFBB28" />
                          <Bar dataKey="taxes" name="Taxes & Fees" stackId="a" fill="#FF8042" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  {/* Pie Chart */}
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="font-bold text-lg mb-4">Breakdown by Category</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={prepareCategoryData()}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                            label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {prepareCategoryData().map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={customTooltipFormatter} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
                
                {/* Usage Insights */}
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg">Usage Insights</h3>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      billData.usageAnalysis.trend === 'stable' ? 'bg-green-100 text-green-800' :
                      billData.usageAnalysis.trend === 'increasing' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {billData.usageAnalysis.trend === 'stable' ? 'Stable Usage' :
                       billData.usageAnalysis.trend === 'increasing' ? 'Increasing Usage' :
                       'Decreasing Usage'}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                      <Wifi className="w-10 h-10 text-blue-500 mr-4" />
                      <div>
                        <p className="text-sm text-gray-500">Avg. Data Usage</p>
                        <p className="text-xl font-semibold">{billData.usageAnalysis.avg_data_usage_gb} GB</p>
                      </div>
                    </div>
                    <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                      <PhoneCall className="w-10 h-10 text-blue-500 mr-4" />
                      <div>
                        <p className="text-sm text-gray-500">Avg. Talk Minutes</p>
                        <p className="text-xl font-semibold">{billData.usageAnalysis.avg_talk_minutes} mins</p>
                      </div>
                    </div>
                    <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                      <Clock className="w-10 h-10 text-blue-500 mr-4" />
                      <div>
                        <p className="text-sm text-gray-500">Avg. Text Messages</p>
                        <p className="text-xl font-semibold">{billData.usageAnalysis.avg_text_messages}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Cost Analysis */}
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <h3 className="font-bold text-lg mb-4">Cost Analysis</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500">Average Monthly Bill</p>
                      <p className="text-xl font-semibold">{formatCurrency(billData.costAnalysis.averageMonthlyBill)}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500">Projected Next Bill</p>
                      <p className="text-xl font-semibold">{formatCurrency(billData.costAnalysis.projectedNextBill)}</p>
                    </div>
                  </div>
                  
                  {/* Potential Savings */}
                  <div 
                    className="flex justify-between items-center p-4 bg-green-50 rounded-lg cursor-pointer"
                    onClick={() => toggleSectionExpansion('savings')}
                  >
                    <div className="flex items-center">
                      <Tag className="w-6 h-6 text-green-600 mr-2" />
                      <h4 className="font-semibold text-green-800">Potential Savings</h4>
                    </div>
                    {expandedSection === 'savings' ? (
                      <ChevronDown className="w-5 h-5 text-green-600" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                  
                  {expandedSection === 'savings' && (
                    <div className="mt-2 pl-12">
                      {billData.costAnalysis.potentialSavings.map((saving, index) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span>{saving.description}</span>
                          <span className="font-semibold text-green-600">{formatCurrency(saving.estimatedSaving)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {activeTab === 'lines' && (
              <div className="space-y-4">
                <h3 className="font-bold text-lg mb-4">Line Details</h3>
                
                {billData.phoneLines.map((line, index) => (
                  <div 
                    key={index} 
                    className="border border-gray-200 rounded-lg overflow-hidden"
                  >
                    <div 
                      className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50"
                      onClick={() => toggleLineExpansion(index)}
                    >
                      <div className="flex items-center">
                        {line.deviceName.toLowerCase().includes('iphone') ? (
                          <Smartphone className="w-8 h-8 text-blue-500 mr-3" />
                        ) : line.deviceName.toLowerCase().includes('ipad') ? (
                          <Tablet className="w-8 h-8 text-blue-500 mr-3" />
                        ) : (
                          <Wifi className="w-8 h-8 text-blue-500 mr-3" />
                        )}
                        <div>
                          <p className="font-medium">{line.deviceName}</p>
                          <p className="text-sm text-gray-500">{line.phoneNumber} | {line.planName}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className="font-semibold text-lg mr-2">{formatCurrency(line.monthlyTotal)}</span>
                        {expandedLine === index ? (
                          <ChevronDown className="w-5 h-5 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-500" />
                        )}
                      </div>
                    </div>
                    
                    {expandedLine === index && (
                      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {line.details.planCost && line.details.planCost > 0 && (
                            <div className="flex justify-between items-center py-2">
                              <span>Plan Cost</span>
                              <span className="font-medium">{formatCurrency(line.details.planCost)}</span>
                            </div>
                          )}
                          
                          {line.details.planDiscount && line.details.planDiscount > 0 && (
                            <div className="flex justify-between items-center py-2">
                              <span>Plan Discount</span>
                              <span className="font-medium text-green-600">-{formatCurrency(line.details.planDiscount)}</span>
                            </div>
                          )}
                          
                          {line.details.devicePayment && line.details.devicePayment > 0 && (
                            <div className="flex justify-between items-center py-2">
                              <span>Device Payment</span>
                              <span className="font-medium">{formatCurrency(line.details.devicePayment)}</span>
                            </div>
                          )}
                          
                          {line.details.deviceCredit && line.details.deviceCredit > 0 && (
                            <div className="flex justify-between items-center py-2">
                              <span>Device Credit</span>
                              <span className="font-medium text-green-600">-{formatCurrency(line.details.deviceCredit)}</span>
                            </div>
                          )}
                          
                          {line.details.protection && line.details.protection > 0 && (
                            <div className="flex justify-between items-center py-2">
                              <span>Protection Plan</span>
                              <span className="font-medium">{formatCurrency(line.details.protection)}</span>
                            </div>
                          )}
                          
                          {line.details.perks && line.details.perks > 0 && (
                            <div className="flex justify-between items-center py-2">
                              <span>Premium Services</span>
                              <span className="font-medium">{formatCurrency(line.details.perks)}</span>
                            </div>
                          )}
                          
                          {line.details.perksDiscount && line.details.perksDiscount > 0 && (
                            <div className="flex justify-between items-center py-2">
                              <span>Services Discount</span>
                              <span className="font-medium text-green-600">-{formatCurrency(line.details.perksDiscount)}</span>
                            </div>
                          )}
                          
                          {line.details.surcharges && line.details.surcharges > 0 && (
                            <div className="flex justify-between items-center py-2">
                              <span>Surcharges</span>
                              <span className="font-medium">{formatCurrency(line.details.surcharges)}</span>
                            </div>
                          )}
                          
                          {line.details.taxes && line.details.taxes > 0 && (
                            <div className="flex justify-between items-center py-2">
                              <span>Taxes & Fees</span>
                              <span className="font-medium">{formatCurrency(line.details.taxes)}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                          <span className="font-semibold">Monthly Total</span>
                          <span className="font-bold text-lg">{formatCurrency(line.monthlyTotal)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {activeTab === 'recommendations' && (
              <div className="space-y-6">
                {/* Plan Recommendation */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-center mb-4">
                    <div className="p-2 rounded-full bg-blue-100 mr-4">
                      <Check className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="font-bold text-xl">Recommended Plan</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="col-span-2">
                      <h4 className="text-lg font-semibold mb-2">{billData.planRecommendation.recommendedPlan}</h4>
                      
                      <h5 className="font-medium text-gray-700 mt-4 mb-2">Why this plan?</h5>
                      <ul className="space-y-2">
                        {billData.planRecommendation.reasons.map((reason, index) => (
                          <li key={index} className="flex items-start">
                            <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="flex flex-col justify-center items-center p-6 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-700 mb-2">Estimated Monthly Savings</p>
                      <p className="text-3xl font-bold text-blue-700">{formatCurrency(billData.planRecommendation.estimatedMonthlySavings)}</p>
                      <div className="w-full mt-4 bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full" 
                          style={{ width: `${billData.planRecommendation.confidenceScore * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {Math.round(billData.planRecommendation.confidenceScore * 100)}% confidence
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Alternative Plans */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h3 className="font-bold text-lg mb-4">Alternative Plans</h3>
                  
                  {billData.planRecommendation.alternativePlans.map((plan, index) => (
                    <div key={index} className="mb-4 p-4 border border-gray-200 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold text-lg">{plan.name}</h4>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Monthly Cost</p>
                          <p className="font-semibold">{formatCurrency(plan.monthlyCost)}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                          <h5 className="font-medium text-green-700 mb-2">Pros</h5>
                          <ul className="space-y-1">
                            {plan.pros.map((pro, i) => (
                              <li key={i} className="flex items-start">
                                <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                                <span>{pro}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <h5 className="font-medium text-red-700 mb-2">Cons</h5>
                          <ul className="space-y-1">
                            {plan.cons.map((con, i) => (
                              <li key={i} className="flex items-start">
                                <AlertCircle className="w-4 h-4 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                                <span>{con}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VerizonBillAnalyzer;
