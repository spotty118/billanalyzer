
interface OverviewTabProps {
  billData: any;
  formatCurrency: (value: number) => string;
}

export function OverviewTab({ billData, formatCurrency }: OverviewTabProps) {
  if (!billData) return <div>No bill data available</div>;

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
                  {billData.billingPeriodStart} - {billData.billingPeriodEnd}
                </span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-600">Bill Date:</span>
                <span className="font-medium">{billData.billDate}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-600">Account Number:</span>
                <span className="font-medium">{billData.accountNumber || 'Not available'}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-600">Carrier:</span>
                <span className="font-medium">{billData.carrier || 'Not specified'}</span>
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
          {billData.phoneLines?.map((line: any, index: number) => (
            <div key={index} className="p-4 border border-gray-100 rounded-lg">
              <h4 className="font-medium mb-2">Line {index + 1}: {line.phoneNumber}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <p className="text-sm text-gray-600">Plan Name:</p>
                  <p className="font-medium">{line.planName || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Monthly Cost:</p>
                  <p className="font-medium">{formatCurrency(line.monthlyCost || 0)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
