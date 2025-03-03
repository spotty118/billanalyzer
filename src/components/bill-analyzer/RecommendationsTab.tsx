
import React from 'react';
import { Check, AlertCircle } from 'lucide-react';

interface RecommendationsTabProps {
  planRecommendation: any;
  formatCurrency: (value: number) => string;
}

export function RecommendationsTab({ planRecommendation, formatCurrency }: RecommendationsTabProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center mb-4">
          <div className="p-2 rounded-full bg-blue-100 mr-4">
            <Check className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="font-bold text-xl">Recommended Plan</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="col-span-2">
            <h4 className="text-lg font-semibold mb-2">{planRecommendation.recommendedPlan}</h4>
            
            <h5 className="font-medium text-gray-700 mt-4 mb-2">Why this plan?</h5>
            <ul className="space-y-2">
              {planRecommendation.reasons.map((reason: string, index: number) => (
                <li key={index} className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="flex flex-col justify-center items-center p-6 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700 mb-2">Estimated Monthly Savings</p>
            <p className="text-3xl font-bold text-blue-700">{formatCurrency(planRecommendation.estimatedMonthlySavings)}</p>
            <div className="w-full mt-4 bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${planRecommendation.confidenceScore * 100}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {Math.round(planRecommendation.confidenceScore * 100)}% confidence
            </p>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="font-bold text-lg mb-4">Alternative Plans</h3>
        
        {planRecommendation.alternativePlans.map((plan: any, index: number) => (
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
  );
}
