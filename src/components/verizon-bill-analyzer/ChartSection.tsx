
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { BillData, ChartDataItem, CategoryDataItem } from './types';
import { prepareLineItemsData, prepareCategoryData, COLORS } from './utils';
import { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent';

interface ChartSectionProps {
  billData: BillData | null;
}

const ChartSection: React.FC<ChartSectionProps> = ({ billData }) => {
  // Custom tooltip formatter to handle different value types
  const customTooltipFormatter = (value: ValueType, name: NameType) => {
    if (typeof value === 'number') {
      return [`$${value.toFixed(2)}`, name];
    }
    return [value, name];
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Line Items Chart */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <h3 className="font-bold text-lg mb-4">Charges by Line</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={prepareLineItemsData(billData)}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tickFormatter={value => `$${value}`} />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip formatter={customTooltipFormatter} />
              <Legend />
              <Bar dataKey="plan" name="Plan" stackId="a" fill="#0088FE" />
              <Bar dataKey="device" name="Device" stackId="a" fill="#00C49F" />
              <Bar dataKey="protection" name="Protection" stackId="a" fill="#FFBB28" />
              <Bar dataKey="taxes" name="Taxes & Fees" stackId="a" fill="#FF8042" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Pie Chart */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <h3 className="font-bold text-lg mb-4">Breakdown by Category</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={prepareCategoryData(billData)}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
                label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {prepareCategoryData(billData).map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={customTooltipFormatter} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ChartSection;
