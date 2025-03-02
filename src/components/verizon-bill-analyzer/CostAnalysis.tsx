
import React from 'react';
import { Tag, ChevronRight, ChevronDown } from 'lucide-react';
import { BillData } from './types';
import { formatCurrency } from './utils';

interface CostAnalysisProps {
  billData: BillData;
  expandedSection: string;
  toggleSectionExpansion: (section: string) => void;
}

const CostAnalysis: React.FC<CostAnalysisProps> = ({ 
  billData, 
  expandedSection, 
  toggleSectionExpansion 
}) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <h3 className="font-bold text-lg mb-4">Cost Analysis</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">Average Monthly Bill</p>
          <p className="text-xl font-semibold">{formatCurrency(billData.costAnalysis?.averageMonthlyBill || 0)}</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">Projected Next Bill</p>
          <p className="text-xl font-semibold">{formatCurrency(billData.costAnalysis?.projectedNextBill || 0)}</p>
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
      
      {expandedSection === 'savings' && billData.costAnalysis?.potentialSavings && (
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
  );
};

export default CostAnalysis;
