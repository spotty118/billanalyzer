
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
import { prepareLineItemsData } from './utils/dataUtils';

interface LineItemsTabProps {
  billData: any;
  formatCurrency: (value: number) => string;
}

export function LineItemsTab({ billData, formatCurrency }: LineItemsTabProps) {
  if (!billData) return <div>No bill data available</div>;

  // Use the prepareLineItemsData utility to get data properly formatted
  const lineItemsData = prepareLineItemsData(billData.phoneLines);
  
  // Make sure each line has the correct total, either directly from the data or calculated
  const lineItemsWithTotal = lineItemsData.map(item => {
    // If total already exists from prepareLineItemsData and is valid, use it
    if (item.total && typeof item.total === 'number' && item.total > 0) {
      return item;
    }
    
    // Otherwise calculate the total
    const calculatedTotal = item.plan + item.device + item.protection + item.perks + item.taxes;
    return {
      ...item,
      total: calculatedTotal
    };
  });
  
  // Calculate totals for each category
  const totalsByCategory = lineItemsWithTotal.reduce(
    (acc, curr) => {
      acc.plan += curr.plan;
      acc.device += curr.device;
      acc.protection += curr.protection;
      acc.perks += curr.perks;
      acc.taxes += curr.taxes;
      acc.total += curr.total;
      return acc;
    },
    { name: 'Total', plan: 0, device: 0, protection: 0, perks: 0, taxes: 0, total: 0 }
  );
  
  // Add total row
  const finalData = [...lineItemsWithTotal, totalsByCategory];

  // Add console log to debug the data
  console.log('LineItemsTab - Prepared data:', {
    originalLines: billData.phoneLines,
    preparedData: lineItemsData,
    lineItemsWithTotal,
    finalData
  });

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
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">Device</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">Protection</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">Perks</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">Taxes & Fees</th>
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{formatCurrency(item.device)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{formatCurrency(item.protection)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{formatCurrency(item.perks)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{formatCurrency(item.taxes)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold mb-5 text-gray-800">Line Items Visualization</h3>
        <div className="h-96 mt-6">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={lineItemsWithTotal.filter(item => item.name !== 'Total')}
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
              <Bar dataKey="device" name="Device" fill="#30A2FF" radius={[4, 4, 0, 0]} />
              <Bar dataKey="protection" name="Protection" fill="#8F43EE" radius={[4, 4, 0, 0]} />
              <Bar dataKey="perks" name="Perks" fill="#2B9348" radius={[4, 4, 0, 0]} />
              <Bar dataKey="taxes" name="Taxes & Fees" fill="#F9A620" radius={[4, 4, 0, 0]} />
              <Bar dataKey="total" name="Total" fill="#000000" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Display Promotions & Credits */}
      {billData.promotions && billData.promotions.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold mb-5 text-gray-800">Promotions & Credits</h3>
          <div className="overflow-x-auto ring-1 ring-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200 modern-table">
              <thead>
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 rounded-tl-lg">Name</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">Description</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">Value</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">Remaining Months</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 rounded-tr-lg">Applied To</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {billData.promotions.map((promo: any, index: number) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">{promo.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{promo.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">-{formatCurrency(promo.monthlyValue || 0)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {promo.remainingMonths ? `${promo.remainingMonths} months` : 'Ongoing'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{promo.appliedTo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Display Perks */}
      {billData.perks && billData.perks.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold mb-5 text-gray-800">Included Perks</h3>
          <div className="overflow-x-auto ring-1 ring-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200 modern-table">
              <thead>
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 rounded-tl-lg">Name</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">Description</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">Value</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 rounded-tr-lg">Included With</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {billData.perks.map((perk: any, index: number) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{perk.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{perk.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{formatCurrency(perk.monthlyValue || 0)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{perk.includedWith}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
