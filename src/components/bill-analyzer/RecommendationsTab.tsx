import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowDown, ArrowDownRight, CheckCircle, Clock, DollarSign, PhoneCall, Smartphone, Wifi } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { NetworkPreference } from '@/hooks/use-verizon-bill-analyzer';

interface RecommendationsTabProps {
  billData: any;
  formatCurrency: (value: number) => string;
  calculateCarrierSavings: (carrierId: string) => {
    monthlySavings: number;
    annualSavings: number;
    planName: string;
    price: number;
  };
  networkPreference: NetworkPreference;
  aiRecommendationsFetched: boolean;
  setAiRecommendationsFetched: (fetched: boolean) => void;
}

interface Recommendation {
  carrier: string;
  planName: string;
  monthlySavings: number;
  annualSavings: number;
  price: number;
}

interface Feature {
  name: string;
  included: boolean;
}

interface PlanDetail {
  title: string;
  description: string;
  features: Feature[];
}

const carrierLogos: Record<string, string> = {
  verizon: '/verizon-logo.png',
  tmobile: '/tmobile-logo.png',
  att: '/att-logo.png',
  usmobile: '/usmobile-logo.png',
  visible: '/visible-logo.png'
};

export function RecommendationsTab({ 
  billData, 
  formatCurrency, 
  calculateCarrierSavings,
  networkPreference,
  aiRecommendationsFetched,
  setAiRecommendationsFetched
}: RecommendationsTabProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [planDetails, setPlanDetails] = useState<PlanDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCarrier, setSelectedCarrier] = useState<string | null>(null);
  
  useEffect(() => {
    if (!aiRecommendationsFetched) {
      fetchAIRecommendations();
    }
  }, [billData, aiRecommendationsFetched]);
  
  const fetchAIRecommendations = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!billData?.accountNumber) {
        throw new Error("Account number is missing from bill data.");
      }
      
      const { data, error } = await supabase
        .from('ai_recommendations')
        .select('*')
        .eq('account_number', billData.accountNumber)
        .single();
      
      if (error) {
        console.error("Supabase error fetching AI recommendations:", error);
        throw new Error(`Failed to fetch AI recommendations: ${error.message}`);
      }
      
      if (data && data.recommendations) {
        setRecommendations(data.recommendations);
        setPlanDetails(data.planDetails);
        setAiRecommendationsFetched(true);
        toast.success("AI recommendations loaded successfully!");
      } else {
        console.warn("No AI recommendations found in Supabase, generating...");
        await generateAIRecommendations();
      }
    } catch (err: any) {
      console.error("Error fetching AI recommendations:", err);
      setError(err.message || "Failed to fetch AI recommendations.");
      toast.error(`Error fetching AI recommendations: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const generateAIRecommendations = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!billData) {
        throw new Error("Bill data is missing.");
      }
      
      const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nemZpb3VhbWlkYXFjdG5xbnJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkyMzE3NjQsImV4cCI6MjA1NDgwNzc2NH0._0hxm1UlSMt3wPx8JwaFDvGmpfjI3p5m0HDm6YfaL6Q';
      
      const response = await fetch('https://mgzfiouamidaqctnqnre.supabase.co/functions/v1/generate-recommendations', {
        method: 'POST',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(billData)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Function error response:", errorText);
        throw new Error(`Failed to generate recommendations: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      
      if (!result || !result.recommendations || !result.planDetails) {
        console.error("Invalid response from function:", result);
        throw new Error("Invalid response format from recommendations service.");
      }
      
      setRecommendations(result.recommendations);
      setPlanDetails(result.planDetails);
      setAiRecommendationsFetched(true);
      
      // Save the recommendations to Supabase
      try {
        const { data: savedData, error: saveError } = await supabase
          .from('ai_recommendations')
          .upsert([
            {
              account_number: billData.accountNumber,
              recommendations: result.recommendations,
              plan_details: result.planDetails
            }
          ], { onConflict: 'account_number' });
        
        if (saveError) {
          console.error("Supabase error saving AI recommendations:", saveError);
          toast.error(`Failed to save AI recommendations: ${saveError.message}`);
        } else {
          console.log("AI recommendations saved to Supabase:", savedData);
          toast.success("AI recommendations generated and saved successfully!");
        }
      } catch (saveErr: any) {
        console.error("Error saving AI recommendations to Supabase:", saveErr);
        toast.error(`Error saving AI recommendations: ${saveErr.message}`);
      }
    } catch (err: any) {
      console.error("Error generating AI recommendations:", err);
      setError(err.message || "Failed to generate AI recommendations.");
      toast.error(`Error generating AI recommendations: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCarrierSelection = (carrier: string) => {
    setSelectedCarrier(carrier);
  };
  
  const renderRecommendationCards = () => {
    if (loading) {
      return (
        <>
          {[...Array(3)].map((_, i) => (
            <Card key={`skeleton-${i}`} className="w-full">
              <CardHeader>
                <CardTitle><Skeleton className="h-5 w-4/5" /></CardTitle>
                <CardDescription><Skeleton className="h-4 w-3/5" /></CardDescription>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-1/4" />
              </CardFooter>
            </Card>
          ))}
        </>
      );
    }
    
    if (error) {
      return (
        <div className="text-red-500 p-4">
          Error: {error}
        </div>
      );
    }
    
    if (!recommendations || recommendations.length === 0) {
      return (
        <div className="text-gray-500 p-4">
          No recommendations found.
        </div>
      );
    }
    
    return recommendations.map((rec, index) => (
      <Card 
        key={index} 
        className={`w-full ${selectedCarrier === rec.carrier ? 'border-2 border-blue-500' : ''}`}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {rec.carrier && carrierLogos[rec.carrier] && (
              <img src={carrierLogos[rec.carrier]} alt={`${rec.carrier} Logo`} className="h-6 w-auto" />
            )}
            {rec.planName}
          </CardTitle>
          <CardDescription>
            Potential Savings with {rec.carrier}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-xl font-semibold">
              Monthly Savings: {formatCurrency(rec.monthlySavings)}
            </p>
            <p className="text-gray-500">
              Annual Savings: {formatCurrency(rec.annualSavings)}
            </p>
            <p className="text-sm">
              Estimated Plan Price: {formatCurrency(rec.price)}
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={() => handleCarrierSelection(rec.carrier)}>
            {selectedCarrier === rec.carrier ? "Selected" : "Select"}
          </Button>
        </CardFooter>
      </Card>
    ));
  };
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">AI-Powered Recommendations</h2>
        <p className="text-gray-500">
          Based on your bill analysis, here are some potential savings opportunities.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {renderRecommendationCards()}
      </div>
      
      {planDetails && (
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Recommended Plan Details</CardTitle>
            <CardDescription>
              Here's a breakdown of the recommended plan features.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <h3 className="text-lg font-semibold">{planDetails.title}</h3>
            <p className="text-gray-600">{planDetails.description}</p>
            
            <ul className="list-none space-y-2">
              {planDetails.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2">
                  {feature.included ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <ArrowDownRight className="h-5 w-5 text-red-500" />
                  )}
                  <span>{feature.name}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
