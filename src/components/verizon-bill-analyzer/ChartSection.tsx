
import React from 'react';
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { BillData } from './types';
import { COLORS, prepareCategoryData, prepareLineItemsData } from './utils';

interface ChartSectionProps {
  billData: BillData;
}

const ChartSection: React.FC<ChartSectionProps> = ({ billData }) => {
  const lineData = prepareLineItemsData(billData);
  const categoryData = prepareCategoryData(billData);

  // Custom formatter for tooltip values to handle various types that might come from recharts
  const currencyFormatter = (value: any) => {
    // Make sure the value is a number before using toFixed
    return typeof value === 'number' ? `$${value.toFixed(2)}` : `$${value}`;
  };

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-4">Bill Breakdown</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Charges by Line</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={lineData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={currencyFormatter} />
                <Legend />
                <Bar dataKey="plan" name="Plan" stackId="a" fill={COLORS[0]} />
                <Bar dataKey="device" name="Device" stackId="a" fill={COLORS[1]} />
                <Bar dataKey="protection" name="Protection" stackId="a" fill={COLORS[2]} />
                <Bar dataKey="taxes" name="Taxes & Fees" stackId="a" fill={COLORS[3]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Charges by Category</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={currencyFormatter} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartSection;
