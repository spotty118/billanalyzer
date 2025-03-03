
interface CarrierPlanDetailsProps {
  numberOfLines: number;
  mainVerizonPlan: {
    plan: string;
  };
  carrierPlan: {
    name: string;
  };
  streamingCost: number;
  formatCurrency: (value: number) => string;
}

export function CarrierPlanDetails({ 
  numberOfLines, 
  mainVerizonPlan, 
  carrierPlan, 
  streamingCost, 
  formatCurrency 
}: CarrierPlanDetailsProps) {
  return (
    <div className="col-span-3 sm:col-span-1">
      <h3 className="font-semibold text-md mb-2">Plan Details</h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Lines:</span>
          <span className="font-medium">{numberOfLines}</span>
        </div>
        <div className="flex justify-between">
          <span>Verizon Plan:</span>
          <span className="font-medium">{mainVerizonPlan.plan}</span>
        </div>
        <div className="flex justify-between">
          <span>Carrier Plan:</span>
          <span className="font-medium">{carrierPlan.name}</span>
        </div>
        <div className="flex justify-between">
          <span>Current Streaming:</span>
          <span className="font-medium">{formatCurrency(streamingCost)}/mo</span>
        </div>
      </div>
    </div>
  );
}
