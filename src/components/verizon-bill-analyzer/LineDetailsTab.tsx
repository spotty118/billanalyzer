
import React from 'react';
import { Smartphone, Tablet, Wifi, ChevronRight, ChevronDown } from 'lucide-react';
import { BillData, PhoneLine } from './types';
import { formatCurrency } from './utils';

interface LineDetailsTabProps {
  billData: BillData;
  expandedLine: number | null;
  toggleLineExpansion: (index: number) => void;
}

const LineDetailsTab: React.FC<LineDetailsTabProps> = ({ 
  billData, 
  expandedLine, 
  toggleLineExpansion 
}) => {
  return (
    <div className="space-y-4">
      <h3 className="font-bold text-lg mb-4">Line Details</h3>
      
      {billData.phoneLines.map((line: PhoneLine, index: number) => (
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
                {line.details.planCost && line.details.planCost > 0 && (
                  <div className="flex justify-between items-center py-2">
                    <span>Plan Cost</span>
                    <span className="font-medium">{formatCurrency(line.details.planCost)}</span>
                  </div>
                )}
                
                {line.details.planDiscount && line.details.planDiscount > 0 && (
                  <div className="flex justify-between items-center py-2">
                    <span>Plan Discount</span>
                    <span className="font-medium text-green-600">-{formatCurrency(line.details.planDiscount)}</span>
                  </div>
                )}
                
                {line.details.devicePayment && line.details.devicePayment > 0 && (
                  <div className="flex justify-between items-center py-2">
                    <span>Device Payment</span>
                    <span className="font-medium">{formatCurrency(line.details.devicePayment)}</span>
                  </div>
                )}
                
                {line.details.deviceCredit && line.details.deviceCredit > 0 && (
                  <div className="flex justify-between items-center py-2">
                    <span>Device Credit</span>
                    <span className="font-medium text-green-600">-{formatCurrency(line.details.deviceCredit)}</span>
                  </div>
                )}
                
                {line.details.protection && line.details.protection > 0 && (
                  <div className="flex justify-between items-center py-2">
                    <span>Protection Plan</span>
                    <span className="font-medium">{formatCurrency(line.details.protection)}</span>
                  </div>
                )}
                
                {line.details.perks && line.details.perks > 0 && (
                  <div className="flex justify-between items-center py-2">
                    <span>Premium Services</span>
                    <span className="font-medium">{formatCurrency(line.details.perks)}</span>
                  </div>
                )}
                
                {line.details.perksDiscount && line.details.perksDiscount > 0 && (
                  <div className="flex justify-between items-center py-2">
                    <span>Services Discount</span>
                    <span className="font-medium text-green-600">-{formatCurrency(line.details.perksDiscount)}</span>
                  </div>
                )}
                
                {line.details.surcharges && line.details.surcharges > 0 && (
                  <div className="flex justify-between items-center py-2">
                    <span>Surcharges</span>
                    <span className="font-medium">{formatCurrency(line.details.surcharges)}</span>
                  </div>
                )}
                
                {line.details.taxes && line.details.taxes > 0 && (
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
  );
};

export default LineDetailsTab;
