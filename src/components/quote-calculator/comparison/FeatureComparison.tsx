
import { ComparisonIndicator } from "./ComparisonIndicator";

interface FeatureComparisonProps {
  priceBetter: 'carrier' | 'verizon' | 'equal';
  dataBetter: 'carrier' | 'verizon' | 'equal';
  hotspotBetter: 'carrier' | 'verizon' | 'equal';
  perksBetter: 'carrier' | 'verizon' | 'equal';
  carrierName: string;
}

export function FeatureComparison({
  priceBetter,
  dataBetter,
  hotspotBetter,
  perksBetter,
  carrierName
}: FeatureComparisonProps) {
  return (
    <div className="col-span-3 sm:col-span-1">
      <h3 className="font-semibold text-md mb-2">Feature Comparison</h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between items-center">
          <span>Price:</span>
          <ComparisonIndicator winner={priceBetter} carrierName={carrierName} />
        </div>
        <div className="flex justify-between items-center">
          <span>Data:</span>
          <ComparisonIndicator winner={dataBetter} carrierName={carrierName} />
        </div>
        <div className="flex justify-between items-center">
          <span>Hotspot:</span>
          <ComparisonIndicator winner={hotspotBetter} carrierName={carrierName} />
        </div>
        <div className="flex justify-between items-center">
          <span>Streaming Perks:</span>
          <ComparisonIndicator winner={perksBetter} carrierName={carrierName} />
        </div>
      </div>
    </div>
  );
}
