
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { BillSummary } from './types';
import { ValueType } from 'recharts/types/component/DefaultTooltipContent';

interface ChartSectionProps {
  summary: BillSummary;
}

// Custom formatter to safely handle non-numeric values
const safeNumberFormatter = (value: ValueType) => {
  if (typeof value === 'number') {
    return value.toFixed(2);
  }
  return String(value);
};

const ChartSection: React.FC<ChartSectionProps> = ({ summary }) => {
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
  
  const costBreakdownData = [
    { name: 'Plan Charges', value: summary.totalPlanCharges },
    { name: 'Device Payments', value: summary.totalDevicePayments },
    { name: 'Fees', value: summary.totalFees },
    { name: 'Taxes', value: summary.totalTaxes }
  ];
  
  const customTooltip = ({ active, payload }: { active?: boolean, payload?: Array<any> }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-gray-200 shadow-sm rounded-md">
          <p className="font-medium">{`${payload[0].name}: $${safeNumberFormatter(payload[0].value)}`}</p>
          <p className="text-sm text-gray-500">
            {`${((payload[0].value / summary.grandTotal) * 100).toFixed(1)}% of total`}
          </p>
        </div>
      );
    }
    return null;
  };
  
  // Calculate percentages for the bar chart
  const percentageData = costBreakdownData.map(item => ({
    name: item.name,
    percentage: (item.value / summary.grandTotal) * 100
  }));
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Cost Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={costBreakdownData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
              >
                {costBreakdownData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={customTooltip} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Bill Composition (%)</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={percentageData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
              <YAxis type="category" dataKey="name" width={100} />
              <Tooltip formatter={(value) => [`${safeNumberFormatter(value)}%`, 'Percentage']} />
              <Bar dataKey="percentage" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChartSection;
