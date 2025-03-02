
import React from 'react';
import { Wifi, PhoneCall, Clock } from 'lucide-react';
import { BillData } from './types';

interface UsageInsightsProps {
  billData: BillData;
}

const UsageInsights: React.FC<UsageInsightsProps> = ({ billData }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg">Usage Insights</h3>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          billData.usageAnalysis?.trend === 'stable' ? 'bg-green-100 text-green-800' :
          billData.usageAnalysis?.trend === 'increasing' ? 'bg-yellow-100 text-yellow-800' :
          'bg-blue-100 text-blue-800'
        }`}>
          {billData.usageAnalysis?.trend === 'stable' ? 'Stable Usage' :
           billData.usageAnalysis?.trend === 'increasing' ? 'Increasing Usage' :
           'Decreasing Usage'}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center p-4 bg-gray-50 rounded-lg">
          <Wifi className="w-10 h-10 text-blue-500 mr-4" />
          <div>
            <p className="text-sm text-gray-500">Avg. Data Usage</p>
            <p className="text-xl font-semibold">{billData.usageAnalysis?.avg_data_usage_gb} GB</p>
          </div>
        </div>
        <div className="flex items-center p-4 bg-gray-50 rounded-lg">
          <PhoneCall className="w-10 h-10 text-blue-500 mr-4" />
          <div>
            <p className="text-sm text-gray-500">Avg. Talk Minutes</p>
            <p className="text-xl font-semibold">{billData.usageAnalysis?.avg_talk_minutes} mins</p>
          </div>
        </div>
        <div className="flex items-center p-4 bg-gray-50 rounded-lg">
          <Clock className="w-10 h-10 text-blue-500 mr-4" />
          <div>
            <p className="text-sm text-gray-500">Avg. Text Messages</p>
            <p className="text-xl font-semibold">{billData.usageAnalysis?.avg_text_messages}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsageInsights;
