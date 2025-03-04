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
        plan: planPrice - (details.planDiscount || 0),
        device: (details.devicePayment || 0) - (details.deviceCredit || 0),
        protection: details.protection || 0,
        taxes: (details.surcharges || 0) + (details.taxes || 0)
      };
    });
  };
  
  const lineItemsData = prepareAccurateLineItemsData(billData.phoneLines);
  
  // Calculate total for each line
  const lineItemsWithTotal = lineItemsData.map(item => ({
    ...item,
    total: item.plan + item.device + item.protection + item.taxes
  }));
  
  // Calculate totals for each category
  const totalsByCategory = lineItemsWithTotal.reduce(
    (acc, curr) => {
      acc.plan += curr.plan;
      acc.device += curr.device;
      acc.protection += curr.protection;
      acc.taxes += curr.taxes;
      acc.total += curr.total;
      return acc;
    },
    { name: 'Total', plan: 0, device: 0, protection: 0, taxes: 0, total: 0 }
  );
  
  // Add total row
  const finalData = [...lineItemsWithTotal, totalsByCategory];

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-bold mb-4">Detailed Line Items</h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Device</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Protection</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Taxes & Fees</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {finalData.map((item, index) => (
                <tr 
                  key={index}
                  className={index === finalData.length - 1 ? 'bg-gray-50 font-medium' : ''}
                >
                  <td className="px-6 py-4 whitespace-nowrap">{item.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(item.plan)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(item.device)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(item.protection)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(item.taxes)}</td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-bold mb-4">Line Items Visualization</h3>
        <div className="h-80">
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
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => `$${value}`} />
              <Tooltip formatter={(value) => [`$${value}`, '']} />
              <Legend />
              <Bar dataKey="plan" name="Plan" fill="#3b82f6" />
              <Bar dataKey="device" name="Device" fill="#10b981" />
              <Bar dataKey="protection" name="Protection" fill="#8b5cf6" />
              <Bar dataKey="taxes" name="Taxes & Fees" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
