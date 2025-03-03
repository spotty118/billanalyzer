
interface CarrierPlanDetailsProps {
  numberOfLines: number;
  mainVerizonPlan: {
    plan: string;
    planObject?: any;
  };
  carrierPlan: {
    name: string;
    dataAllowance: {
      premium: string | number;
      hotspot?: number | 'unlimited';
    };
  };
  streamingCost: number;
  formatCurrency: (value: number) => string;
  pricePerLine?: number;
  annualPrice?: number;
}

export function CarrierPlanDetails({ 
  numberOfLines,
  mainVerizonPlan,
  carrierPlan,
  streamingCost,
  formatCurrency,
  pricePerLine,
  annualPrice
}: CarrierPlanDetailsProps) {
  return (
    <div className="col-span-3 sm:col-span-1">
      <h3 className="font-semibold text-md mb-2">Plan Details</h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Verizon Plan:</span>
          <span className="font-medium">{mainVerizonPlan.plan}</span>
        </div>
        <div className="flex justify-between">
          <span>Carrier Plan:</span>
          <span className="font-medium">{carrierPlan.name}</span>
        </div>
        <div className="flex justify-between">
          <span>Number of Lines:</span>
          <span className="font-medium">{numberOfLines}</span>
        </div>
        {pricePerLine && (
          <div className="flex justify-between">
            <span>Price per Line:</span>
            <span className="font-medium">{formatCurrency(pricePerLine)}/mo</span>
          </div>
        )}
        {annualPrice && (
          <div className="flex justify-between">
            <span>Annual Option:</span>
            <span className="font-medium">{formatCurrency(annualPrice)}/yr</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Verizon Data:</span>
          <span className="font-medium">
            {typeof mainVerizonPlan.planObject?.dataAllowance.premium === 'number' 
              ? `${mainVerizonPlan.planObject?.dataAllowance.premium}GB` 
              : 'Unlimited'}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Carrier Data:</span>
          <span className="font-medium">
            {typeof carrierPlan.dataAllowance.premium === 'number' 
              ? `${carrierPlan.dataAllowance.premium}GB` 
              : 'Unlimited'}
          </span>
        </div>
        {streamingCost > 0 && (
          <div className="flex justify-between">
            <span>Your Streaming Cost:</span>
            <span className="font-medium">{formatCurrency(streamingCost)}/mo</span>
          </div>
        )}
      </div>
    </div>
  );
}
