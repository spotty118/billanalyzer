
import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Check, DollarSign, AlertCircle, PhoneCall, Smartphone, Tablet, Wifi, Clock, Tag, ChevronRight, ChevronDown } from 'lucide-react';

const VerizonBillAnalyzer = () => {
  const [billData, setBillData] = useState<any>(null);
  const [fileSelected, setFileSelected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');
  const [expandedLine, setExpandedLine] = useState<number | null>(null);
  const [expandedSection, setExpandedSection] = useState('charges');

  // Handle file selection
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setFileSelected(true);
    setIsLoading(true);

    try {
      // Simulate loading
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Get mock data
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
    } catch (error) {
      console.error('Error processing file:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle line expansion
  const toggleLineExpansion = (index: number) => {
    if (expandedLine === index) {
      setExpandedLine(null);
    } else {
      setExpandedLine(index);
    }
  };

  // Toggle section expansion
  const toggleSectionExpansion = (section: string) => {
    if (expandedSection === section) {
      setExpandedSection('');
    } else {
      setExpandedSection(section);
    }
  };

  // Prepare line items data for visualization
  const prepareLineItemsData = () => {
    if (!billData?.phoneLines) return [];
    
    return billData.phoneLines.map((line: any) => ({
      name: line.deviceName.split(' ').slice(0, 3).join(' '), // Shorten device name
      total: line.monthlyTotal,
      plan: line.details.planCost - (line.details.planDiscount || 0),
      device: (line.details.devicePayment || 0) - (line.details.deviceCredit || 0),
      protection: line.details.protection || 0,
      taxes: (line.details.surcharges || 0) + (line.details.taxes || 0)
    }));
  };

  // Prepare category data for pie chart
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

  // Colors for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28DFF', '#FF6B6B'];

  // Format currency
  const formatCurrency = (value: number) => {
    return `$${value.toFixed(2)}`;
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
                          <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, null]} />
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
                            label={({name, percent}) => `${name} ${(Number(percent) * 100).toFixed(0)}%`}
                          >
                            {prepareCategoryData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, null]} />
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
                      {billData.costAnalysis.potentialSavings.map((saving: any, index: number) => (
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
                
                {billData.phoneLines.map((line: any, index: number) => (
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
                          {line.details.planCost > 0 && (
                            <div className="flex justify-between items-center py-2">
                              <span>Plan Cost</span>
                              <span className="font-medium">{formatCurrency(line.details.planCost)}</span>
                            </div>
                          )}
                          
                          {line.details.planDiscount > 0 && (
                            <div className="flex justify-between items-center py-2">
                              <span>Plan Discount</span>
                              <span className="font-medium text-green-600">-{formatCurrency(line.details.planDiscount)}</span>
                            </div>
                          )}
                          
                          {line.details.devicePayment > 0 && (
                            <div className="flex justify-between items-center py-2">
                              <span>Device Payment</span>
                              <span className="font-medium">{formatCurrency(line.details.devicePayment)}</span>
                            </div>
                          )}
                          
                          {line.details.deviceCredit > 0 && (
                            <div className="flex justify-between items-center py-2">
                              <span>Device Credit</span>
                              <span className="font-medium text-green-600">-{formatCurrency(line.details.deviceCredit)}</span>
                            </div>
                          )}
                          
                          {line.details.protection > 0 && (
                            <div className="flex justify-between items-center py-2">
                              <span>Protection Plan</span>
                              <span className="font-medium">{formatCurrency(line.details.protection)}</span>
                            </div>
                          )}
                          
                          {line.details.perks > 0 && (
                            <div className="flex justify-between items-center py-2">
                              <span>Premium Services</span>
                              <span className="font-medium">{formatCurrency(line.details.perks)}</span>
                            </div>
                          )}
                          
                          {line.details.perksDiscount > 0 && (
                            <div className="flex justify-between items-center py-2">
                              <span>Services Discount</span>
                              <span className="font-medium text-green-600">-{formatCurrency(line.details.perksDiscount)}</span>
                            </div>
                          )}
                          
                          {line.details.surcharges > 0 && (
                            <div className="flex justify-between items-center py-2">
                              <span>Surcharges</span>
                              <span className="font-medium">{formatCurrency(line.details.surcharges)}</span>
                            </div>
                          )}
                          
                          {line.details.taxes > 0 && (
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
                        {billData.planRecommendation.reasons.map((reason: string, index: number) => (
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
                  
                  {billData.planRecommendation.alternativePlans.map((plan: any, index: number) => (
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
                            {plan.pros.map((pro: string, i: number) => (
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
                            {plan.cons.map((con: string, i: number) => (
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
