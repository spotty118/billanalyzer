
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { prepareLineItemsData } from '@/components/bill-analyzer/utils/dataUtils';

interface LineItemsTabProps {
  billData: any;
  formatCurrency: (value: number) => string;
}

export function LineItemsTab({ billData, formatCurrency }: LineItemsTabProps) {
  if (!billData) return <div>No bill data available</div>;

  const lineItemsData = prepareLineItemsData(billData.phoneLines);
  
  // Calculate total for each line
  const lineItemsWithTotal = lineItemsData.map(item => ({
    ...item,
    total: item.plan + item.device + item.protection + item.taxes
  }));
  
  // Sort by total cost (highest first)
  const sortedLineItems = [...lineItemsWithTotal].sort((a, b) => b.total - a.total);
  
  // Colors for the stacked bars
  const colors = {
    plan: '#3b82f6',       // blue
    device: '#10b981',     // green
    protection: '#f59e0b',  // amber
    taxes: '#ef4444'       // red
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-bold mb-4">Line Items Summary</h3>
        
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={sortedLineItems}
              margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end"
                height={70}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                tickFormatter={(value) => formatCurrency(value)}
                width={80}
              />
              <Tooltip 
                formatter={(value, name) => [formatCurrency(value as number), name]}
                labelFormatter={(label) => `Phone: ${label}`}
              />
              <Bar dataKey="plan" stackId="a" name="Plan Charges" fill={colors.plan} />
              <Bar dataKey="device" stackId="a" name="Device Payments" fill={colors.device} />
              <Bar dataKey="protection" stackId="a" name="Protection" fill={colors.protection} />
              <Bar dataKey="taxes" stackId="a" name="Taxes & Fees" fill={colors.taxes} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-bold mb-4">Detailed Line Items</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left font-medium text-gray-600">Phone Number</th>
                <th className="px-4 py-2 text-right font-medium text-gray-600">Plan</th>
                <th className="px-4 py-2 text-right font-medium text-gray-600">Device</th>
                <th className="px-4 py-2 text-right font-medium text-gray-600">Protection</th>
                <th className="px-4 py-2 text-right font-medium text-gray-600">Taxes & Fees</th>
                <th className="px-4 py-2 text-right font-medium text-gray-600">Total</th>
              </tr>
            </thead>
            <tbody>
              {sortedLineItems.map((item, index) => (
                <tr key={index} className="border-b border-gray-100">
                  <td className="px-4 py-3 font-medium">{item.name}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(item.plan)}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(item.device)}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(item.protection)}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(item.taxes)}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(item.total)}</td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-semibold">
                <td className="px-4 py-3">Total</td>
                <td className="px-4 py-3 text-right">
                  {formatCurrency(sortedLineItems.reduce((sum, item) => sum + item.plan, 0))}
                </td>
                <td className="px-4 py-3 text-right">
                  {formatCurrency(sortedLineItems.reduce((sum, item) => sum + item.device, 0))}
                </td>
                <td className="px-4 py-3 text-right">
                  {formatCurrency(sortedLineItems.reduce((sum, item) => sum + item.protection, 0))}
                </td>
                <td className="px-4 py-3 text-right">
                  {formatCurrency(sortedLineItems.reduce((sum, item) => sum + item.taxes, 0))}
                </td>
                <td className="px-4 py-3 text-right">
                  {formatCurrency(sortedLineItems.reduce((sum, item) => sum + item.total, 0))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
