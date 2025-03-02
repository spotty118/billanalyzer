
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { COLORS } from './utils';
import { BillSummary, CategoryDataItem } from './types';

interface ChartSectionProps {
  summary: BillSummary;
}

const ChartSection: React.FC<ChartSectionProps> = ({ summary }) => {
  const categoryData = [
    { name: 'Plans', value: summary.totalPlanCharges },
    { name: 'Devices', value: summary.totalDevicePayments },
    { name: 'Fees', value: summary.totalFees },
    { name: 'Taxes', value: summary.totalTaxes }
  ].filter(item => item.value > 0);

  const total = categoryData.reduce((sum, item) => sum + item.value, 0);
  
  const categoryDataWithPercentage: CategoryDataItem[] = categoryData.map(item => ({
    ...item,
    percentage: Math.round((item.value / total) * 100)
  }));

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h3 className="font-bold text-lg mb-4">Bill Breakdown</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryDataWithPercentage}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percentage }) => `${name}: ${percentage}%`}
                labelLine={false}
              >
                {categoryDataWithPercentage.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number, name: string) => [`$${value.toFixed(2)}`, name]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div>
          <h4 className="font-medium text-base mb-4">Charge Categories</h4>
          <div className="space-y-3">
            {categoryDataWithPercentage.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span>{item.name}</span>
                </div>
                <div className="text-right">
                  <p className="font-medium">${item.value.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">{item.percentage}% of bill</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartSection;
