
import { ArrowLeftRight, AlertCircle, Check, Star, Zap, Lightbulb } from 'lucide-react';
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
      default: return <ArrowLeftRight className="h-5 w-5 inline-block mr-2" />;
    }
  };

  // Generate price comparison data for charts
  const generateComparisonData = () => {
    const data = [];
    const lineCount = billData.phoneLines?.length || 1;
    
    // Generate data for 1-5 lines regardless of user's actual line count
    // to show potential savings for different family sizes
    for (let i = 1; i <= 5; i++) {
      const carriers = supportedCarriers.map(carrier => {
        const savings = calculateCarrierSavings(carrier.id);
        // Scale prices based on line count
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
      
      const entry = {
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

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-sky-50 to-indigo-50 border-2 border-blue-100 rounded-lg p-6">
        <h3 className="text-xl font-bold text-blue-800 mb-4">
          <ArrowLeftRight className="h-5 w-5 inline-block mr-2" />
          US Mobile Alternative Plans
        </h3>
        
        <Tabs defaultValue={activeCarrierTab} value={activeCarrierTab} onValueChange={setActiveCarrierTab}>
          <TabsList className="mb-6 w-full">
            <div className="grid grid-cols-3 gap-2 w-full">
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
            const { monthlySavings, annualSavings, price: carrierPrice } = carrierSavings;
            const matchedPlanId = findBestCarrierMatch(carrier.id);
            const carrierPlan = alternativeCarrierPlans.find(p => p.id === matchedPlanId);
            
            if (!carrierPlan) return null;
            
            const annualMonthlyEquivalent = carrierPlan.annualPrice ? carrierPlan.annualPrice / 12 : 0;
            
            return (
              <TabsContent key={carrier.id} value={carrier.id} forceMount>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
                      <h4 className="text-lg font-semibold mb-4">{carrier.name} {carrierPlan.name}</h4>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-500">Monthly Cost</p>
                          <p className="text-xl font-bold">{formatCurrency(carrierPrice)}</p>
                          {carrierPlan.annualPrice && (
                            <>
                              <p className="text-sm text-gray-500 mt-2">Annual Option</p>
                              <p className="text-md">
                                {formatCurrency(carrierPlan.annualPrice)}/yr
                                <span className="text-sm text-gray-500 ml-1">
                                  (≈{formatCurrency(annualMonthlyEquivalent)}/mo)
                                </span>
                              </p>
                            </>
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Your Current Bill</p>
                          <p className="text-xl font-bold">{formatCurrency(billData.totalAmount)}</p>
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
                    
                    {carrierPlan && (
                      <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100 mt-4">
                        <h4 className="font-semibold mb-3">Plan Features</h4>
                        <ul className="space-y-2">
                          <li className="flex items-start">
                            <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                            <span>
                              {carrierPlan.dataAllowance.premium === 'unlimited' 
                                ? 'Unlimited premium data' 
                                : `${carrierPlan.dataAllowance.premium}GB premium data`}
                            </span>
                          </li>
                          {carrierPlan.dataAllowance.hotspot && (
                            <li className="flex items-start">
                              <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                              <span>
                                {typeof carrierPlan.dataAllowance.hotspot === 'string' 
                                  ? carrierPlan.dataAllowance.hotspot 
                                  : `${carrierPlan.dataAllowance.hotspot}GB hotspot data`}
                              </span>
                            </li>
                          )}
                          <li className="flex items-start">
                            <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                            <span>{carrierPlan.streamingQuality} streaming quality</span>
                          </li>
                          <li className="flex items-start">
                            <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                            <span>{carrierPlan.network} network</span>
                          </li>
                          {carrierPlan.dataPriorityLevel && (
                            <li className="flex items-start">
                              <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                              <span>Data Priority: {carrierPlan.dataPriorityLevel}</span>
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    {carrierPlan && (
                      <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
                        <h4 className="font-semibold mb-3">Included Features</h4>
                        {carrierPlan.features.length > 0 ? (
                          <ul className="space-y-2">
                            {carrierPlan.features.map((feature, idx) => (
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
                        {carrierPlan.streamingPerks.length > 0 ? (
                          <ul className="space-y-2">
                            {carrierPlan.streamingPerks.map((perk, idx) => (
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
                            <li>• All US Mobile sub-brands run on different networks</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      className="w-full mt-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 border-0"
                      onClick={() => window.open('https://www.usmobile.com', '_blank')}
                    >
                      Visit US Mobile Website
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
                        <Tooltip formatter={(value) => [`$${Math.round(value * 100) / 100}`, 'Monthly Savings']} />
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
                        <Tooltip formatter={(value) => [`$${Math.round(value * 100) / 100}`, '']} />
                        <Legend />
                        <Line type="monotone" dataKey="current" stroke="#0052CC" name="Your Current Plan" />
                        <Line type="monotone" dataKey={carrier.id} stroke="#00A36C" name={carrier.name} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <p className="mt-4 text-sm text-blue-700">
                  Showing plan details for {carrier.name} {carrierPlan.name} (alternative carrier #{supportedCarriers.findIndex(c => c.id === activeCarrierTab) + 1} of {supportedCarriers.length})
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
                <Tooltip formatter={(value) => [`$${Math.round(value * 100) / 100}`, 'Annual Savings']} />
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
              <h3 className="text-md font-medium mb-2">US Mobile Highlights</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Three network options to choose from</li>
                <li>All prices include taxes and fees</li>
                <li>No contracts, easy online activation</li>
                <li>Customizable plans for your needs</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
