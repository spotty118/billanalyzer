
import { ArrowLeftRight, AlertCircle, Check, Star, Zap, Lightbulb, Eye, CircleDot, Smartphone, BarChart2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  supportedCarriers, 
  findBestCarrierMatch, 
  alternativeCarrierPlans
} from "@/config/alternativeCarriers";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { verizonPlansData } from "@/data/verizonPlans";

interface CarrierComparisonProps {
  billData: any;
  activeCarrierTab: string;
  setActiveCarrierTab: (carrier: string) => void;
  calculateCarrierSavings: (carrierId: string) => {
    monthlySavings: number;
    annualSavings: number;
    planName: string;
    price: number;
  };
  formatCurrency: (value: number) => string;
}

interface ComparisonDataPoint {
  lines: number;
  current: number;
  [key: string]: number;
}

export function CarrierComparison({
  billData,
  activeCarrierTab,
  setActiveCarrierTab,
  calculateCarrierSavings,
  formatCurrency
}: CarrierComparisonProps) {
  const getCarrierIcon = (iconName: string) => {
    switch (iconName) {
      case 'Star': return <Star className="h-5 w-5 inline-block mr-2" />;
      case 'Zap': return <Zap className="h-5 w-5 inline-block mr-2" />;
      case 'Lightbulb': return <Lightbulb className="h-5 w-5 inline-block mr-2" />;
      case 'Eye': return <Eye className="h-5 w-5 inline-block mr-2" />;
      case 'CircleDot': return <CircleDot className="h-5 w-5 inline-block mr-2" />;
      case 'Smartphone': return <Smartphone className="h-5 w-5 inline-block mr-2" />;
      case 'BarChart2': return <BarChart2 className="h-5 w-5 inline-block mr-2" />;
      default: return <ArrowLeftRight className="h-5 w-5 inline-block mr-2" />;
    }
  };

  const generateComparisonData = (): ComparisonDataPoint[] => {
    const data: ComparisonDataPoint[] = [];
    const lineCount = billData.phoneLines?.length || 1;
    
    for (let i = 1; i <= 5; i++) {
      const carriers = supportedCarriers.map(carrier => {
        const savings = calculateCarrierSavings(carrier.id);
        const scaleFactor = i / lineCount;
        const price = savings.price * scaleFactor;
        const currentPrice = billData.totalAmount * scaleFactor;
        
        return {
          id: carrier.id,
          name: carrier.name,
          price: price,
          saving: currentPrice - price
        };
      });
      
      const entry: ComparisonDataPoint = {
        lines: i,
        current: billData.totalAmount * (i / lineCount)
      };
      
      carriers.forEach(carrier => {
        entry[carrier.id] = carrier.price;
        entry[`${carrier.id}Saving`] = carrier.saving;
      });
      
      data.push(entry);
    }
    
    return data;
  };

  const carrierSavingsData = supportedCarriers.map(carrier => {
    const savings = calculateCarrierSavings(carrier.id);
    return {
      id: carrier.id,
      name: carrier.name,
      monthly: savings.monthlySavings,
      annual: savings.annualSavings,
      price: savings.price
    };
  }).sort((a, b) => b.annual - a.annual);

  const priceComparisonData = generateComparisonData();

  const standardizeCarrierPricing = (carrierId: string) => {
    const matchedPlanId = findBestCarrierMatch(carrierId);
    const carrierPlan = alternativeCarrierPlans.find(p => p.id === matchedPlanId);
    
    if (!carrierPlan) return null;
    
    return {
      basePrice: carrierPlan.basePrice,
      annualPrice: carrierPlan.annualPrice || 0,
      name: carrierPlan.name,
      features: carrierPlan.features,
      streamingPerks: carrierPlan.streamingPerks,
      dataAllowance: carrierPlan.dataAllowance,
      streamingQuality: carrierPlan.streamingQuality,
      network: carrierPlan.network,
      dataPriorityLevel: carrierPlan.dataPriorityLevel
    };
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-sky-50 to-indigo-50 border-2 border-blue-100 rounded-lg p-6">
        <h3 className="text-xl font-bold text-blue-800 mb-4">
          <ArrowLeftRight className="h-5 w-5 inline-block mr-2" />
          Alternative Carrier Plans
        </h3>
        
        <div className="mb-4 text-sm text-gray-600">
          <p>Comparison based on current Verizon plans: {Object.keys(verizonPlansData).length} plans available</p>
        </div>
        
        <Tabs defaultValue={activeCarrierTab} value={activeCarrierTab} onValueChange={setActiveCarrierTab}>
          <TabsList className="mb-6 w-full">
            <div className="grid grid-cols-7 gap-2 w-full">
              {supportedCarriers.map(carrier => (
                <TabsTrigger 
                  key={carrier.id} 
                  value={carrier.id} 
                  className="flex items-center justify-center px-2 py-2 text-sm whitespace-normal text-center h-auto"
                >
                  {getCarrierIcon(carrier.icon)}
                  <span className="ml-1">{carrier.name}</span>
                </TabsTrigger>
              ))}
            </div>
          </TabsList>
          
          {supportedCarriers.map(carrier => {
            if (carrier.id !== activeCarrierTab) return null;
            
            const carrierSavings = calculateCarrierSavings(carrier.id);
            const { monthlySavings, annualSavings } = carrierSavings;
            
            const standardPlan = standardizeCarrierPricing(carrier.id);
            if (!standardPlan) return null;
            
            const annualPrice = standardPlan.annualPrice || 0;
            const annualMonthlyEquivalent = annualPrice > 0 ? annualPrice / 12 : 0;
            
            const lineCount = billData.phoneLines?.length || 1;
            const perLinePrice = standardPlan.basePrice;
            const totalMonthlyPrice = perLinePrice * lineCount;
            
            return (
              <TabsContent key={carrier.id} value={carrier.id} forceMount>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
                      <h4 className="text-lg font-semibold mb-4">{carrier.name} {standardPlan.name}</h4>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-500">Cost Per Line</p>
                          <p className="text-xl font-bold">{formatCurrency(standardPlan.basePrice)}</p>
                          
                          {lineCount > 1 && (
                            <>
                              <p className="text-sm text-gray-500 mt-2">Total for {lineCount} Lines</p>
                              <p className="text-lg font-bold text-blue-700">{formatCurrency(totalMonthlyPrice)}</p>
                            </>
                          )}
                          
                          {standardPlan.annualPrice > 0 && carrier.id !== 'visible' && (
                            <>
                              <p className="text-sm text-gray-500 mt-2">Annual Option</p>
                              <p className="text-md">
                                {formatCurrency(annualPrice)}/yr
                                <span className="text-sm text-gray-500 ml-1">
                                  (≈{formatCurrency(annualMonthlyEquivalent)}/mo)
                                </span>
                              </p>
                            </>
                          )}
                          <p className="text-sm text-gray-500 mt-2">No multi-line discounts</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Your Current Bill</p>
                          <p className="text-xl font-bold">{formatCurrency(billData.totalAmount)}</p>
                          <p className="text-sm text-gray-500 mt-2">
                            {lineCount} {lineCount === 1 ? 'line' : 'lines'}
                          </p>
                          {lineCount > 1 && (
                            <p className="text-sm text-gray-500">
                              (≈{formatCurrency(billData.totalAmount / lineCount)}/line)
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2 border-t pt-4 mt-2">
                        <div className="flex justify-between items-center">
                          <span>Monthly Savings:</span>
                          <span className={`font-bold text-lg ${monthlySavings > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {monthlySavings > 0 ? formatCurrency(monthlySavings) : `-${formatCurrency(Math.abs(monthlySavings))}`}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Annual Savings:</span>
                          <span className={`font-bold text-lg ${annualSavings > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {annualSavings > 0 ? formatCurrency(annualSavings) : `-${formatCurrency(Math.abs(annualSavings))}`}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {standardPlan && (
                      <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100 mt-4">
                        <h4 className="font-semibold mb-3">Plan Features</h4>
                        <ul className="space-y-2">
                          <li className="flex items-start">
                            <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                            <span>
                              {standardPlan.dataAllowance.premium === 'unlimited' 
                                ? 'Unlimited premium data' 
                                : `${standardPlan.dataAllowance.premium}GB premium data`}
                            </span>
                          </li>
                          {standardPlan.dataAllowance.hotspot && (
                            <li className="flex items-start">
                              <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                              <span>
                                {typeof standardPlan.dataAllowance.hotspot === 'string' 
                                  ? standardPlan.dataAllowance.hotspot 
                                  : `${standardPlan.dataAllowance.hotspot}GB hotspot data`}
                              </span>
                            </li>
                          )}
                          <li className="flex items-start">
                            <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                            <span>{standardPlan.streamingQuality} streaming quality</span>
                          </li>
                          <li className="flex items-start">
                            <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                            <span>{standardPlan.network} network</span>
                          </li>
                          {standardPlan.dataPriorityLevel && (
                            <li className="flex items-start">
                              <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                              <span>Data Priority: {standardPlan.dataPriorityLevel}</span>
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    {standardPlan && (
                      <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
                        <h4 className="font-semibold mb-3">Included Features</h4>
                        {standardPlan.features.length > 0 ? (
                          <ul className="space-y-2">
                            {standardPlan.features.map((feature, idx) => (
                              <li key={idx} className="flex items-start">
                                <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-gray-500 italic">No additional features listed for this plan</p>
                        )}
                        
                        <h4 className="font-semibold mb-3 mt-4">Streaming Perks</h4>
                        {standardPlan.streamingPerks.length > 0 ? (
                          <ul className="space-y-2">
                            {standardPlan.streamingPerks.map((perk, idx) => (
                              <li key={idx} className="flex items-start">
                                <Check className="w-4 h-4 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                                <span>{perk}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-gray-500 italic">No streaming perks included with this plan</p>
                        )}
                      </div>
                    )}
                    
                    <div className="bg-blue-50 p-4 rounded-lg mt-4 border border-blue-100">
                      <div className="flex items-start">
                        <AlertCircle className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-blue-800">Important Notes:</p>
                          <ul className="mt-1 space-y-1 text-sm text-blue-700">
                            <li>• Savings estimates are based on your current bill total</li>
                            <li>• Device payments may not be included in carrier switch</li>
                            <li>• Visit carrier website for most current details</li>
                            <li>• No multi-line discounts available on these plans</li>
                            {carrier.id === 'visible' && <li>• Visible offers Party Pay for multi-line households</li>}
                            {carrier.id === 'cricket' && <li>• Cricket offers discounted multi-line plans not shown here</li>}
                            {carrier.id === 'straighttalk' && <li>• Straight Talk offers 365-day plans for additional savings</li>}
                            {carrier.id === 'total' && <li>• Total Wireless offers family plans with shared data</li>}
                          </ul>
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      className="w-full mt-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 border-0"
                      onClick={() => {
                        let websiteUrl = '';
                        switch(carrier.id) {
                          case 'visible':
                            websiteUrl = 'https://www.visible.com';
                            break;
                          case 'cricket':
                            websiteUrl = 'https://www.cricketwireless.com';
                            break;
                          case 'straighttalk':
                            websiteUrl = 'https://www.straighttalk.com';
                            break;
                          case 'total':
                            websiteUrl = 'https://www.totalwireless.com';
                            break;
                          default:
                            websiteUrl = 'https://www.usmobile.com';
                        }
                        window.open(websiteUrl, '_blank');
                      }}
                    >
                      Visit {carrier.name} Website
                    </Button>
                  </div>
                </div>
                
                <div className="mt-8">
                  <h4 className="font-semibold mb-3">Savings with Different Line Counts</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    See how your savings would change with more or fewer lines:
                  </p>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={priceComparisonData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="lines" label={{ value: 'Number of Lines', position: 'insideBottom', offset: -5 }} />
                        <YAxis label={{ value: 'Monthly Savings ($)', angle: -90, position: 'insideLeft' }} />
                        <Tooltip formatter={(value) => [`$${Math.round(Number(value) * 100) / 100}`, 'Monthly Savings']} />
                        <Bar dataKey={`${carrier.id}Saving`} fill="#38B0DE" name={`${carrier.name} Savings`} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div className="mt-8">
                  <h4 className="font-semibold mb-3">Cost Comparison</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Comparing your current plan with {carrier.name} for different family sizes:
                  </p>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={priceComparisonData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="lines" label={{ value: 'Number of Lines', position: 'insideBottom', offset: -5 }} />
                        <YAxis label={{ value: 'Monthly Cost ($)', angle: -90, position: 'insideLeft' }} />
                        <Tooltip 
                          formatter={(value) => [`$${Math.round(Number(value) * 100) / 100}`, '']}
                          labelFormatter={(value) => `${value} ${value === 1 ? 'Line' : 'Lines'} - Total Cost`}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="current" stroke="#0052CC" name="Your Current Plan" />
                        <Line type="monotone" dataKey={carrier.id} stroke="#00A36C" name={carrier.name} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <p className="mt-4 text-sm text-blue-700">
                  Showing plan details for {carrier.name} {standardPlan.name} (alternative carrier #{supportedCarriers.findIndex(c => c.id === activeCarrierTab) + 1} of {supportedCarriers.length})
                </p>
              </TabsContent>
            );
          })}
        </Tabs>
        
        <div className="mt-10">
          <h3 className="text-lg font-semibold mb-4">All Carriers Comparison</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={carrierSavingsData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" label={{ value: 'Annual Savings ($)', position: 'insideBottom', offset: -5 }} />
                <YAxis type="category" dataKey="name" width={100} />
                <Tooltip formatter={(value) => [`$${Math.round(Number(value) * 100) / 100}`, 'Annual Savings']} />
                <Bar dataKey="annual" fill="#4CAF50" name="Annual Savings" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="border p-4 rounded-md bg-white">
              <h3 className="text-md font-medium mb-2">Your Current Plan</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Current monthly cost: {formatCurrency(billData.totalAmount)}</li>
                <li>Carrier: {billData.carrierName || 'Verizon'}</li>
                <li>{billData.phoneLines?.length || 0} lines on your account</li>
                <li>Primary plan: {billData.phoneLines?.[0]?.planName || 'Unknown'}</li>
              </ul>
            </div>
            <div className="border p-4 rounded-md bg-white">
              <h3 className="text-md font-medium mb-2">Prepaid Carrier Highlights</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>No contracts or credit checks required</li>
                <li>Many include taxes and fees in advertised price</li>
                <li>Most offer multi-line family plans with discounts</li>
                <li>May have different coverage than postpaid plans</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
