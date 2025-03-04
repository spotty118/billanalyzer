
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// We'll use the carrierLogos in our implementation
const carrierLogos = {
  verizon: "https://logodownload.org/wp-content/uploads/2014/02/verizon-logo-1.png",
  tmobile: "https://1000logos.net/wp-content/uploads/2021/05/T-Mobile-logo.png",
  att: "https://logodownload.org/wp-content/uploads/2014/04/att-logo-4.png",
  usmobile: "https://www.usmobile.com/assets/images/US-Mobile-Logo.svg",
  visible: "https://www.visible.com/static/images/favicon.png"
};

interface RecommendationsTabProps {
  billData: any;
  formatCurrency: (value: number) => string;
  calculateCarrierSavings: (carrierId: string) => {
    monthlySavings: number;
    annualSavings: number;
    planName: string;
    price: number;
  };
  networkPreference?: string | null;
  aiRecommendationsFetched: boolean;
  setAiRecommendationsFetched: (fetched: boolean) => void;
}

export const RecommendationsTab = ({ 
  billData, 
  formatCurrency, 
  calculateCarrierSavings,
  networkPreference,
  aiRecommendationsFetched,
  setAiRecommendationsFetched
}: RecommendationsTabProps) => {
  // Calculate savings for each carrier
  const verizonSavings = calculateCarrierSavings('verizon');
  const tmobileSavings = calculateCarrierSavings('tmobile');
  const attSavings = calculateCarrierSavings('att');
  
  const [aiRecommendations, setAiRecommendations] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch AI recommendations if not already done
  useEffect(() => {
    const fetchAiRecommendations = async () => {
      if (!aiRecommendationsFetched) {
        setLoading(true);
        setError(null);
        
        try {
          const { data, error } = await supabase.functions.invoke('ai-plan-recommendations', {
            body: { billData, networkPreference }
          });
          
          if (error) throw new Error(error.message);
          setAiRecommendations(data);
          setAiRecommendationsFetched(true);
        } catch (err) {
          console.error('Error fetching AI recommendations:', err);
          setError('Unable to fetch AI recommendations. Please try again later.');
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchAiRecommendations();
  }, [billData, networkPreference, aiRecommendationsFetched, setAiRecommendationsFetched]);
  
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Plan Recommendations</h2>
      <p className="text-gray-600">
        Based on your current plan and usage with {billData?.carrierName || "your carrier"}, 
        here are recommended plans that could save you money.
        {networkPreference && <span> Prioritizing {networkPreference} network coverage.</span>}
      </p>
      
      {/* Traditional Carrier Recommendations */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Traditional Carriers</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Verizon Plan Card */}
          <div className="border rounded-lg p-6 shadow-sm">
            <div className="flex justify-center mb-4">
              <img 
                src={carrierLogos.verizon} 
                alt="Verizon" 
                className="h-12 object-contain" 
              />
            </div>
            <h3 className="font-bold text-lg text-center mb-2">Verizon Recommendation</h3>
            <div className="space-y-2">
              <p className="font-medium">{verizonSavings.planName}</p>
              <p>Monthly cost: {formatCurrency(verizonSavings.price)}</p>
              <p className="text-green-600 font-bold">
                Potential savings: {formatCurrency(verizonSavings.monthlySavings)}/month
              </p>
              <p className="text-sm text-gray-500">
                {formatCurrency(verizonSavings.annualSavings)} annual savings
              </p>
            </div>
          </div>
          
          {/* T-Mobile Plan Card */}
          <div className="border rounded-lg p-6 shadow-sm">
            <div className="flex justify-center mb-4">
              <img 
                src={carrierLogos.tmobile} 
                alt="T-Mobile" 
                className="h-12 object-contain" 
              />
            </div>
            <h3 className="font-bold text-lg text-center mb-2">T-Mobile Recommendation</h3>
            <div className="space-y-2">
              <p className="font-medium">{tmobileSavings.planName}</p>
              <p>Monthly cost: {formatCurrency(tmobileSavings.price)}</p>
              <p className="text-green-600 font-bold">
                Potential savings: {formatCurrency(tmobileSavings.monthlySavings)}/month
              </p>
              <p className="text-sm text-gray-500">
                {formatCurrency(tmobileSavings.annualSavings)} annual savings
              </p>
            </div>
          </div>
          
          {/* AT&T Plan Card */}
          <div className="border rounded-lg p-6 shadow-sm">
            <div className="flex justify-center mb-4">
              <img 
                src={carrierLogos.att} 
                alt="AT&T" 
                className="h-12 object-contain" 
              />
            </div>
            <h3 className="font-bold text-lg text-center mb-2">AT&T Recommendation</h3>
            <div className="space-y-2">
              <p className="font-medium">{attSavings.planName}</p>
              <p>Monthly cost: {formatCurrency(attSavings.price)}</p>
              <p className="text-green-600 font-bold">
                Potential savings: {formatCurrency(attSavings.monthlySavings)}/month
              </p>
              <p className="text-sm text-gray-500">
                {formatCurrency(attSavings.annualSavings)} annual savings
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* AI-Powered Recommendations */}
      <div>
        <h3 className="text-xl font-semibold mb-2">AI-Recommended Alternative Carriers</h3>
        {loading && <p className="text-gray-500">Analyzing your bill for personalized recommendations...</p>}
        {error && <p className="text-red-500">{error}</p>}
        
        {aiRecommendations && (
          <div className="space-y-6">
            {/* Market Insights */}
            {aiRecommendations.marketInsights && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Market Insights</h4>
                {aiRecommendations.marketInsights.currentPromos && aiRecommendations.marketInsights.currentPromos.length > 0 && (
                  <div className="mb-2">
                    <p className="text-sm font-medium">Current Promotions:</p>
                    <ul className="list-disc list-inside text-sm ml-2">
                      {aiRecommendations.marketInsights.currentPromos.map((promo: string, i: number) => (
                        <li key={i}>{promo}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            
            {/* Personalized Advice */}
            {aiRecommendations.personalizedAdvice && (
              <div className="bg-green-50 p-4 rounded-lg mb-4">
                <p className="italic">{aiRecommendations.personalizedAdvice}</p>
              </div>
            )}
            
            {/* Recommendation Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {aiRecommendations.recommendations && aiRecommendations.recommendations.map((rec: any, i: number) => {
                // Determine which logo to use based on carrier name
                let logoUrl = "";
                if (rec.carrier.toLowerCase().includes("us mobile")) {
                  logoUrl = carrierLogos.usmobile;
                } else if (rec.carrier.toLowerCase().includes("visible")) {
                  logoUrl = carrierLogos.visible;
                } else if (rec.carrier.toLowerCase().includes("verizon")) {
                  logoUrl = carrierLogos.verizon;
                } else if (rec.carrier.toLowerCase().includes("tmobile") || rec.carrier.toLowerCase().includes("t-mobile")) {
                  logoUrl = carrierLogos.tmobile;
                } else if (rec.carrier.toLowerCase().includes("att") || rec.carrier.toLowerCase().includes("at&t")) {
                  logoUrl = carrierLogos.att;
                }
                
                return (
                  <div key={i} className="border rounded-lg p-6 shadow-sm">
                    <div className="flex justify-center mb-4">
                      {logoUrl && <img src={logoUrl} alt={rec.carrier} className="h-12 object-contain" />}
                      {!logoUrl && <div className="h-12 flex items-center justify-center font-bold">{rec.carrier}</div>}
                    </div>
                    <h3 className="font-bold text-lg text-center mb-2">{rec.carrier}</h3>
                    <div className="space-y-3">
                      <p className="font-medium">{rec.planName}</p>
                      <p>Monthly cost: {formatCurrency(rec.monthlyPrice)}</p>
                      
                      {/* Features */}
                      {rec.features && rec.features.length > 0 && (
                        <div>
                          <p className="font-medium text-sm">Features:</p>
                          <ul className="list-disc list-inside text-sm ml-2">
                            {rec.features.map((feature: string, j: number) => (
                              <li key={j}>{feature}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* Pros & Cons */}
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        {rec.pros && rec.pros.length > 0 && (
                          <div>
                            <p className="font-medium text-sm text-green-600">Pros:</p>
                            <ul className="list-disc list-inside text-sm ml-2">
                              {rec.pros.map((pro: string, j: number) => (
                                <li key={j} className="text-green-600">{pro}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {rec.cons && rec.cons.length > 0 && (
                          <div>
                            <p className="font-medium text-sm text-red-600">Cons:</p>
                            <ul className="list-disc list-inside text-sm ml-2">
                              {rec.cons.map((con: string, j: number) => (
                                <li key={j} className="text-red-600">{con}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
