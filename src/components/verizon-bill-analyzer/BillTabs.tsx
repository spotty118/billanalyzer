
import React, { useState } from 'react';
import { BillAnalysis } from './types';
import ChartSection from './ChartSection';

interface BillTabsProps {
  billAnalysis: BillAnalysis;
}

const BillTabs: React.FC<BillTabsProps> = ({ billAnalysis }) => {
  const [activeTab, setActiveTab] = useState('summary');

  return (
    <div>
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
      
      <div className="p-6">
        {activeTab === 'summary' && (
          <ChartSection summary={billAnalysis.summary} />
        )}
        {activeTab === 'lines' && (
          <div>
            <h3 className="text-xl font-bold mb-4">Line Details</h3>
            <div className="space-y-4">
              {billAnalysis.lineItems.map((line, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex justify-between mb-2">
                    <h4 className="font-semibold">{line.phoneNumber}</h4>
                    <span className="font-bold">${line.totalCharge.toFixed(2)}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>Plan: {line.planName}</p>
                    <p>Device Payment: ${line.devicePayment.toFixed(2)}</p>
                    <p>Plan Charges: ${line.planCharge.toFixed(2)}</p>
                    <p>Data Usage: {line.dataUsage.used} {line.dataUsage.units} / {line.dataUsage.included} {line.dataUsage.units}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {activeTab === 'recommendations' && (
          <div>
            <h3 className="text-xl font-bold mb-4">Recommendations</h3>
            <div className="space-y-4">
              {billAnalysis.recommendations.map((recommendation, index) => (
                <div key={index} className="p-4 border rounded-lg bg-blue-50">
                  <div className="flex justify-between mb-2">
                    <h4 className="font-semibold">{recommendation.title}</h4>
                    <span className="font-bold text-green-600">Save ${recommendation.potentialSavings.toFixed(2)}</span>
                  </div>
                  <p className="text-sm text-gray-700">{recommendation.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BillTabs;
