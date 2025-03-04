
import { verizonPlansData, getPlanPrice } from "@/data/verizonPlans";

interface OverviewTabProps {
  billData: any;
  formatCurrency: (value: number) => string;
}

export function OverviewTab({ billData, formatCurrency }: OverviewTabProps) {
  if (!billData) return <div>No bill data available</div>;

  // Helper function to get plan details using the plan name
  const getPlanDetails = (planName: string) => {
    const planId = Object.keys(verizonPlansData).find(
      key => verizonPlansData[key].name === planName
    );
    
    if (!planId) return null;
    return { id: planId, ...verizonPlansData[planId] };
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-bold mb-4">Bill Overview</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Billing Information</h4>
            <ul className="space-y-2">
              <li className="flex justify-between">
                <span className="text-gray-600">Billing Period:</span>
                <span className="font-medium">
                  {billData.billingPeriod || billData.billingPeriodStart} 
                  {billData.billingPeriodEnd && ` - ${billData.billingPeriodEnd}`}
                </span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-600">Bill Date:</span>
                <span className="font-medium">{billData.billDate || 'Not available'}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-600">Account Number:</span>
                <span className="font-medium">{billData.accountNumber || 'Not available'}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-600">Carrier:</span>
                <span className="font-medium">{billData.carrier || billData.carrierName || 'Verizon'}</span>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Cost Summary</h4>
            <ul className="space-y-2">
              <li className="flex justify-between">
                <span className="text-gray-600">Total Amount:</span>
                <span className="font-medium">{formatCurrency(billData.totalAmount || 0)}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-600">Previous Balance:</span>
                <span className="font-medium">{formatCurrency(billData.previousBalance || 0)}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-600">New Charges:</span>
                <span className="font-medium">{formatCurrency(billData.newCharges || 0)}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-600">Number of Lines:</span>
                <span className="font-medium">{billData.phoneLines?.length || 0}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-bold mb-4">Plan Details</h3>
        <div className="space-y-4">
          {billData.phoneLines?.map((line: any, index: number) => {
            const planDetails = getPlanDetails(line.planName);
            const lineCount = billData.phoneLines?.length || 1;
            const price = planDetails ? getPlanPrice(planDetails.id, lineCount) : line.monthlyTotal || 0;
            
            return (
              <div key={index} className="p-4 border border-gray-100 rounded-lg">
                <h4 className="font-medium mb-2">Line {index + 1}: {line.phoneNumber || 'Unknown'}</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <p className="text-sm text-gray-600">Plan Name:</p>
                    <p className="font-medium">{line.planName || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Monthly Cost:</p>
                    <p className="font-medium">{formatCurrency(price)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Device:</p>
                    <p className="font-medium">{line.deviceName || 'Not specified'}</p>
                  </div>
                </div>
                {planDetails && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <p className="text-sm text-gray-600">Features:</p>
                    <ul className="mt-1 text-sm">
                      {planDetails.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start">
                          <span className="text-green-500 mr-1">•</span> {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
