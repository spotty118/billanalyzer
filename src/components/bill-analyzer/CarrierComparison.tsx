
import { ArrowLeftRight, AlertCircle, Check, Star, Zap, Lightbulb, Eye, CircleDot, Smartphone, BarChart2, BadgePercent, Wallet, Shield, Wifi } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supportedCarriers, findBestCarrierMatch, alternativeCarrierPlans } from "@/config/alternativeCarriers";
import { verizonPlansData } from "@/data/verizonPlans";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

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
      case 'Star':
        return <Star className="h-5 w-5 inline-block mr-2 text-amber-400" />;
      case 'Zap':
        return <Zap className="h-5 w-5 inline-block mr-2 text-purple-500" />;
      case 'Lightbulb':
        return <Lightbulb className="h-5 w-5 inline-block mr-2 text-yellow-500" />;
      case 'Eye':
        return <Eye className="h-5 w-5 inline-block mr-2 text-blue-500" />;
      case 'CircleDot':
        return <CircleDot className="h-5 w-5 inline-block mr-2 text-green-500" />;
      case 'Smartphone':
        return <Smartphone className="h-5 w-5 inline-block mr-2 text-indigo-500" />;
      case 'BarChart2':
        return <BarChart2 className="h-5 w-5 inline-block mr-2 text-pink-500" />;
      default:
        return <ArrowLeftRight className="h-5 w-5 inline-block mr-2 text-blue-600" />;
    }
  };

  const getOrdinalSuffix = (n: number): string => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };
  
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
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-6 shadow-sm">
        <h3 className="text-xl font-bold text-blue-800 mb-4 flex items-center">
          <ArrowLeftRight className="h-6 w-6 mr-3 text-blue-600" />
          Alternative Carrier Plans
        </h3>
        
        <div className="mb-6 text-sm text-gray-600 bg-white/60 p-3 rounded-lg inline-block">
          <p className="flex items-center">
            <BadgePercent className="h-4 w-4 mr-2 text-blue-500" />
            Comparison based on {Object.keys(verizonPlansData).length} Verizon plans
          </p>
        </div>
        
        <Tabs defaultValue={activeCarrierTab} value={activeCarrierTab} onValueChange={setActiveCarrierTab}>
          <TabsList className="mb-6 w-full bg-white/80 p-1 shadow-sm">
            <div className="grid grid-cols-7 gap-2 w-full">
              {supportedCarriers.map(carrier => (
                <TabsTrigger 
                  key={carrier.id} 
                  value={carrier.id} 
                  className="flex flex-col items-center justify-center px-2 py-3 text-sm whitespace-normal text-center h-auto transition-all data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-md rounded-md"
                >
                  {getCarrierIcon(carrier.icon)}
                  <span className="mt-1 font-medium">{carrier.name}</span>
                </TabsTrigger>
              ))}
            </div>
          </TabsList>
          
          {supportedCarriers.map((carrier, carrierIndex) => {
            if (carrier.id !== activeCarrierTab) return null;
            const carrierSavings = calculateCarrierSavings(carrier.id);
            const {
              monthlySavings,
              annualSavings
            } = carrierSavings;
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
                  <div className="space-y-4">
                    <Card className="overflow-hidden border-0 shadow-md">
                      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4">
                        <div className="flex justify-between items-center">
                          <h4 className="text-lg font-semibold text-white">{carrier.name} {standardPlan.name}</h4>
                          <Badge className="bg-white/20 text-white hover:bg-white/30">{standardPlan.network} Network</Badge>
                        </div>
                      </div>
                      <CardContent className="p-5">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-gray-500">Cost Per Line</p>
                            <p className="text-2xl font-bold text-blue-700">{formatCurrency(standardPlan.basePrice)}</p>
                            
                            {lineCount > 1 && (
                              <>
                                <p className="text-sm text-gray-500 mt-3">Total for {lineCount} Lines</p>
                                <p className="text-xl font-bold text-blue-700">{formatCurrency(totalMonthlyPrice)}</p>
                              </>
                            )}
                            
                            {standardPlan.annualPrice > 0 && carrier.id !== 'visible' && (
                              <>
                                <p className="text-sm text-gray-500 mt-3">Annual Option</p>
                                <p className="text-md flex items-center">
                                  <span className="font-semibold">{formatCurrency(annualPrice)}/yr</span>
                                  <span className="text-sm text-gray-500 ml-2">
                                    (≈{formatCurrency(annualMonthlyEquivalent)}/mo)
                                  </span>
                                </p>
                              </>
                            )}
                            <div className="mt-2">
                              <Badge variant="outline" className="bg-gray-50">No multi-line discounts</Badge>
                            </div>
                          </div>
                          <div className="border-l pl-4">
                            <p className="text-sm text-gray-500">Your Current Bill</p>
                            <p className="text-2xl font-bold text-gray-800">{formatCurrency(billData.totalAmount)}</p>
                            <p className="text-sm text-gray-500 mt-3">
                              {lineCount} {lineCount === 1 ? 'line' : 'lines'}
                            </p>
                            {lineCount > 1 && (
                              <p className="text-sm text-gray-500">
                                (≈{formatCurrency(billData.totalAmount / lineCount)}/line)
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-3 border-t pt-4 mt-2">
                          <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                            <span className="font-medium flex items-center">
                              <Wallet className="h-4 w-4 mr-2 text-gray-500" />
                              Monthly Savings:
                            </span>
                            <span className={`font-bold text-lg ${monthlySavings > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {monthlySavings > 0 ? formatCurrency(monthlySavings) : `-${formatCurrency(Math.abs(monthlySavings))}`}
                            </span>
                          </div>
                          <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                            <span className="font-medium flex items-center">
                              <Wallet className="h-4 w-4 mr-2 text-gray-500" />
                              Annual Savings:
                            </span>
                            <span className={`font-bold text-lg ${annualSavings > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {annualSavings > 0 ? formatCurrency(annualSavings) : `-${formatCurrency(Math.abs(annualSavings))}`}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    {standardPlan && (
                      <Card className="shadow-md border-0">
                        <CardContent className="p-5">
                          <h4 className="font-semibold mb-4 flex items-center">
                            <Shield className="h-4 w-4 mr-2 text-blue-600" />
                            Plan Features
                          </h4>
                          <ul className="space-y-3">
                            <li className="flex items-start bg-gray-50 p-2 rounded-lg">
                              <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                              <span>
                                {standardPlan.dataAllowance.premium === 'unlimited' ? 
                                  'Unlimited premium data' : 
                                  `${standardPlan.dataAllowance.premium}GB premium data`}
                              </span>
                            </li>
                            {standardPlan.dataAllowance.hotspot && (
                              <li className="flex items-start bg-gray-50 p-2 rounded-lg">
                                <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                                <span>
                                  {typeof standardPlan.dataAllowance.hotspot === 'string' ? 
                                    standardPlan.dataAllowance.hotspot : 
                                    `${standardPlan.dataAllowance.hotspot}GB hotspot data`}
                                </span>
                              </li>
                            )}
                            <li className="flex items-start bg-gray-50 p-2 rounded-lg">
                              <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                              <span>{standardPlan.streamingQuality} streaming quality</span>
                            </li>
                            <li className="flex items-start bg-gray-50 p-2 rounded-lg">
                              <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                              <span className="flex items-center">
                                <Wifi className="h-4 w-4 mr-1 text-blue-500" />
                                {standardPlan.network} network
                              </span>
                            </li>
                            {standardPlan.dataPriorityLevel && (
                              <li className="flex items-start bg-gray-50 p-2 rounded-lg">
                                <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                                <span>Data Priority: {standardPlan.dataPriorityLevel}</span>
                              </li>
                            )}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    {standardPlan && (
                      <Card className="shadow-md border-0">
                        <CardContent className="p-5">
                          <h4 className="font-semibold mb-4 flex items-center">
                            <Star className="h-4 w-4 mr-2 text-amber-500" />
                            Included Features
                          </h4>
                          {standardPlan.features.length > 0 ? (
                            <ul className="space-y-3">
                              {standardPlan.features.map((feature, idx) => (
                                <li key={idx} className="flex items-start bg-gray-50 p-2 rounded-lg">
                                  <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                                  <span>{feature}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-gray-500 italic p-2 bg-gray-50 rounded-lg">No additional features listed for this plan</p>
                          )}
                          
                          <h4 className="font-semibold mb-4 mt-6 flex items-center">
                            <Zap className="h-4 w-4 mr-2 text-purple-500" />
                            Streaming Perks
                          </h4>
                          {standardPlan.streamingPerks.length > 0 ? (
                            <ul className="space-y-3">
                              {standardPlan.streamingPerks.map((perk, idx) => (
                                <li key={idx} className="flex items-start bg-blue-50 p-2 rounded-lg">
                                  <Check className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                                  <span>{perk}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-gray-500 italic p-2 bg-gray-50 rounded-lg">No streaming perks included with this plan</p>
                          )}
                        </CardContent>
                      </Card>
                    )}
                    
                    <div className="bg-blue-50 p-5 rounded-lg border border-blue-100 shadow-sm">
                      <div className="flex items-start">
                        <AlertCircle className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-blue-800 mb-2">Important Notes:</p>
                          <ul className="space-y-2 text-sm text-blue-700">
                            <li className="flex items-start">
                              <span className="text-blue-500 mr-2">•</span> 
                              Savings estimates are based on your current bill total
                            </li>
                            <li className="flex items-start">
                              <span className="text-blue-500 mr-2">•</span> 
                              Device payments may not be included in carrier switch
                            </li>
                            <li className="flex items-start">
                              <span className="text-blue-500 mr-2">•</span> 
                              Visit carrier website for most current details
                            </li>
                            <li className="flex items-start">
                              <span className="text-blue-500 mr-2">•</span> 
                              No multi-line discounts available on these plans
                            </li>
                            {carrier.id === 'visible' && (
                              <li className="flex items-start">
                                <span className="text-blue-500 mr-2">•</span> 
                                Visible offers Party Pay for multi-line households
                              </li>
                            )}
                            {carrier.id === 'cricket' && (
                              <li className="flex items-start">
                                <span className="text-blue-500 mr-2">•</span> 
                                Cricket offers discounted multi-line plans not shown here
                              </li>
                            )}
                            {carrier.id === 'straighttalk' && (
                              <li className="flex items-start">
                                <span className="text-blue-500 mr-2">•</span> 
                                Straight Talk offers 365-day plans for additional savings
                              </li>
                            )}
                            {carrier.id === 'total' && (
                              <li className="flex items-start">
                                <span className="text-blue-500 mr-2">•</span> 
                                Total Wireless offers family plans with shared data
                              </li>
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow transition-all py-6 text-base" 
                      onClick={() => {
                        let websiteUrl = '';
                        switch (carrier.id) {
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
                
                <div className="mt-4 text-sm text-blue-700 bg-blue-50 p-2 rounded-lg inline-block">
                  Showing plan details for {carrier.name} {standardPlan.name} (alternative carrier #{getOrdinalSuffix(carrierIndex + 1)} of {supportedCarriers.length})
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </div>
  );
}
