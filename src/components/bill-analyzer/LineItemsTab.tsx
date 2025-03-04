
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { verizonPlansData, getPlanPrice } from '@/data/verizonPlans';

interface LineItemsTabProps {
  billData: any;
  formatCurrency: (value: number) => string;
}

export function LineItemsTab({ billData, formatCurrency }: LineItemsTabProps) {
  if (!billData) return <div>No bill data available</div>;

  // Prepare line items data with accurate pricing
  const prepareAccurateLineItemsData = (phoneLines: any[]) => {
    if (!phoneLines || phoneLines.length === 0) return [];
    
    const lineCount = phoneLines.length;
    
    return phoneLines.map(line => {
      const details = line.details || {};
      
      // Get the correct plan price based on the plan name
      let planPrice = details.planCost || 0;
      if (line.planName) {
        const planId = Object.keys(verizonPlansData).find(
          key => verizonPlansData[key].name === line.planName
        );
        
        if (planId) {
          planPrice = getPlanPrice(planId, lineCount);
        }
      }
      
      return {
        name: line.phoneNumber || 'Unknown',
        plan: planPrice - (details.planDiscount || 0)
      };
    });
  };
  
  const lineItemsData = prepareAccurateLineItemsData(billData.phoneLines);
  
  // Calculate total for each line
  const lineItemsWithTotal = lineItemsData.map(item => ({
    ...item,
    total: item.plan
  }));
  
  // Calculate totals for each category
  const totalsByCategory = lineItemsWithTotal.reduce(
    (acc, curr) => {
      acc.plan += curr.plan;
      acc.total += curr.total;
      return acc;
    },
    { name: 'Total', plan: 0, total: 0 }
  );
  
  // Add total row
  const finalData = [...lineItemsWithTotal, totalsByCategory];

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold mb-5 text-gray-800">Detailed Line Items</h3>
        
        <div className="overflow-x-auto ring-1 ring-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200 modern-table">
            <thead>
              <tr>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 rounded-tl-lg">Phone Number</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">Plan</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 rounded-tr-lg">Total</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {finalData.map((item, index) => (
                <tr 
                  key={index}
                  className={index === finalData.length - 1 ? 'bg-gray-50 font-medium' : 'hover:bg-gray-50 transition-colors'}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{item.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{formatCurrency(item.plan)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold mb-5 text-gray-800">Line Items Visualization</h3>
        <div className="h-80 mt-6">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={lineItemsWithTotal}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="name" tick={{ fill: '#666' }} />
              <YAxis tickFormatter={(value) => `$${value}`} tick={{ fill: '#666' }} />
              <Tooltip 
                formatter={(value) => [`$${value}`, '']} 
                contentStyle={{ 
                  borderRadius: '8px', 
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  border: 'none'
                }} 
              />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              <Bar dataKey="plan" name="Plan" fill="#CD040B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
