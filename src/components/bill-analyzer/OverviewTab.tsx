
import { verizonPlansData, getPlanPrice } from "@/data/verizonPlans";

interface OverviewTabProps {
  billData: any;
  formatCurrency: (value: number) => string;
  carrierType?: string;
}

export function OverviewTab({ billData, formatCurrency, carrierType = "verizon" }: OverviewTabProps) {
  if (!billData) return <div>No bill data available</div>;

  // Helper function to get plan details using the plan name
  const getPlanDetails = (planName: string) => {
    const planId = Object.keys(verizonPlansData).find(
      key => verizonPlansData[key].name === planName
    );
    
    if (!planId) return null;
    return { id: planId, ...verizonPlansData[planId] };
  };

  // Correct features for Verizon plans
  const getCorrectPlanFeatures = (planName: string) => {
    switch(planName) {
      case 'Unlimited Welcome':
        return [
          'Unlimited talk, text & data', 
          '5G access', 
          'Mobile hotspot 5GB'
        ];
      case 'Unlimited Plus':
        return [
          'Unlimited talk, text & data', 
          '5G Ultra Wideband', 
          'Mobile hotspot 30GB'
        ];
      case 'Unlimited Ultimate':
        return [
          'Unlimited Premium Data', 
          '5G Ultra Wideband', 
          'Mobile hotspot 60GB'
        ];
      default:
        return ['Unlimited talk, text & data'];
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
        <h3 className="text-xl font-bold mb-5 text-gray-800">Bill Overview</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gray-50 p-5 rounded-lg">
            <h4 className="font-semibold text-gray-700 mb-4 text-lg">Billing Information</h4>
            <ul className="space-y-3">
              <li className="flex justify-between items-center border-b border-gray-200 pb-2">
                <span className="text-gray-600">Billing Period:</span>
                <span className="font-medium text-gray-800">
                  {billData.billingPeriod || billData.billingPeriodStart} 
                  {billData.billingPeriodEnd && ` - ${billData.billingPeriodEnd}`}
                </span>
              </li>
              <li className="flex justify-between items-center border-b border-gray-200 pb-2">
                <span className="text-gray-600">Bill Date:</span>
                <span className="font-medium text-gray-800">{billData.billDate || 'Not available'}</span>
              </li>
              <li className="flex justify-between items-center border-b border-gray-200 pb-2">
                <span className="text-gray-600">Account Number:</span>
                <span className="font-medium text-gray-800">{billData.accountNumber || 'Not available'}</span>
              </li>
              <li className="flex justify-between items-center">
                <span className="text-gray-600">Carrier:</span>
                <span className="font-medium text-gray-800">{billData.carrier || billData.carrierName || 'Verizon'}</span>
              </li>
            </ul>
          </div>
          
          <div className="bg-gray-50 p-5 rounded-lg">
            <h4 className="font-semibold text-gray-700 mb-4 text-lg">Cost Summary</h4>
            <ul className="space-y-3">
              <li className="flex justify-between items-center border-b border-gray-200 pb-2">
                <span className="text-gray-600">Total Amount:</span>
                <span className="font-bold text-primary text-lg">{formatCurrency(billData.totalAmount || 0)}</span>
              </li>
              <li className="flex justify-between items-center border-b border-gray-200 pb-2">
                <span className="text-gray-600">Previous Balance:</span>
                <span className="font-medium text-gray-800">{formatCurrency(billData.previousBalance || 0)}</span>
              </li>
              <li className="flex justify-between items-center border-b border-gray-200 pb-2">
                <span className="text-gray-600">New Charges:</span>
                <span className="font-medium text-gray-800">{formatCurrency(billData.newCharges || 0)}</span>
              </li>
              <li className="flex justify-between items-center">
                <span className="text-gray-600">Number of Lines:</span>
                <span className="font-medium text-gray-800 flex items-center">
                  <span className="inline-flex items-center justify-center w-7 h-7 bg-primary text-white rounded-full mr-2 text-xs font-bold">
                    {billData.phoneLines?.length || 0}
                  </span>
                  Lines
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
        <h3 className="text-xl font-bold mb-5 text-gray-800">Plan Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {billData.phoneLines?.map((line: any, index: number) => {
            const planDetails = getPlanDetails(line.planName);
            const lineCount = billData.phoneLines?.length || 1;
            const price = planDetails ? getPlanPrice(planDetails.id, lineCount) : line.monthlyTotal || 0;
            const correctFeatures = getCorrectPlanFeatures(line.planName);
            
            return (
              <div key={index} className="p-5 border border-gray-100 rounded-lg hover:shadow-md transition-shadow bg-gray-50">
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center mr-3 font-bold">
                    {index + 1}
                  </div>
                  <h4 className="font-semibold text-lg">{line.phoneNumber || 'Unknown'}</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="bg-white p-3 rounded-md shadow-sm">
                    <p className="text-sm text-gray-500 mb-1">Plan Name</p>
                    <p className="font-semibold text-gray-800">{line.planName || 'Not specified'}</p>
                  </div>
                  <div className="bg-white p-3 rounded-md shadow-sm">
                    <p className="text-sm text-gray-500 mb-1">Monthly Cost</p>
                    <p className="font-semibold text-primary">{formatCurrency(price)}</p>
                  </div>
                  <div className="bg-white p-3 rounded-md shadow-sm">
                    <p className="text-sm text-gray-500 mb-1">Device</p>
                    <p className="font-semibold text-gray-800">{line.deviceName || 'Not specified'}</p>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-white rounded-md shadow-sm">
                  <p className="text-sm font-medium text-gray-700 mb-2">Features:</p>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {correctFeatures.map((feature, idx) => (
                      <li key={idx} className="flex items-start text-sm">
                        <span className="text-primary mr-2 font-bold">•</span> {feature}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-500 italic">Note: Streaming services like Disney+, Hulu, and ESPN+ are available as optional $10/month perks and are not included with plans.</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
