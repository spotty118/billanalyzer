
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { CategoryDataItem, BillSummary } from './types';

interface ChartSectionProps {
  summary: BillSummary;
}

// Colors for the pie chart
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28DFF', '#FF6B6B'];

// Format tooltip values for the pie chart
const formatTooltipValue = (value: number) => [`$${value.toFixed(2)}`, null];

export function ChartSection({ summary }: ChartSectionProps) {
  // Convert charges by category to format needed by the pie chart
  const categoryData: CategoryDataItem[] = Object.entries(summary.chargesByCategory || {}).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1), // Capitalize first letter
    value: value || 0
  }));

  // Calculate total for percentage calculation
  const total = categoryData.reduce((sum, item) => sum + item.value, 0);

  // Add percentage to each category
  const categoryDataWithPercentage = categoryData.map(item => ({
    ...item,
    percentage: total > 0 ? `${((item.value / total) * 100).toFixed(0)}%` : '0%'
  }));

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <h3 className="font-bold text-lg mb-4">Breakdown by Category</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={categoryDataWithPercentage}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              fill="#8884d8"
              paddingAngle={5}
              dataKey="value"
              label={({ name, percentage }) => `${name}: ${percentage}`}
              labelLine={false}
            >
              {categoryDataWithPercentage.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => formatTooltipValue(value)} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
