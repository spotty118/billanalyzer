
import { CarrierPlanDetails } from "./CarrierPlanDetails";
import { MonthlyCostComparison } from "./MonthlyCostComparison";
import { FeatureComparison } from "./FeatureComparison";
import { PlanFeatures } from "./PlanFeatures";
import { ComparisonFootnote } from "./ComparisonFootnote";

interface CarrierTabContentProps {
  carrier: {
    id: string;
    name: string;
    icon: string;
  };
  numberOfLines: number;
  mainVerizonPlan: {
    plan: string;
    planObject?: any;
  };
  carrierPlan: {
    name: string;
    features: string[];
    streamingPerks: string[];
    dataAllowance: {
      premium: string | number;
      hotspot?: number | 'unlimited';
    };
    basePrice?: number;
    pricePerLine?: {
      line1: number;
      line2: number;
      line3: number;
      line4: number;
      line5Plus: number;
    };
    annualPrice?: number;
  };
  totalVerizonPrice: number;
  carrierTotalPrice: number;
  streamingCost: number;
  monthlySavings: number;
  annualSavings: number;
  priceBetter: 'carrier' | 'verizon' | 'equal';
  dataBetter: 'carrier' | 'verizon' | 'equal';
  hotspotBetter: 'carrier' | 'verizon' | 'equal';
  perksBetter: 'carrier' | 'verizon' | 'equal';
  formatCurrency: (value: number) => string;
}

export function CarrierTabContent({
  carrier,
  numberOfLines,
  mainVerizonPlan,
  carrierPlan,
  totalVerizonPrice,
  carrierTotalPrice,
  streamingCost,
  monthlySavings,
  annualSavings,
  priceBetter,
  dataBetter,
  hotspotBetter,
  perksBetter,
  formatCurrency
}: CarrierTabContentProps) {
  // Calculate the price per line for display purposes
  const pricePerLine = carrierPlan.pricePerLine ? 
    (numberOfLines <= 1 ? carrierPlan.pricePerLine.line1 : 
     numberOfLines === 2 ? carrierPlan.pricePerLine.line2 :
     numberOfLines === 3 ? carrierPlan.pricePerLine.line3 :
     numberOfLines === 4 ? carrierPlan.pricePerLine.line4 :
     carrierPlan.pricePerLine.line5Plus) : 0;

  return (
    <>
      <div className="grid grid-cols-3 gap-4">
        <CarrierPlanDetails 
          numberOfLines={numberOfLines}
          mainVerizonPlan={mainVerizonPlan}
          carrierPlan={carrierPlan}
          streamingCost={streamingCost}
          formatCurrency={formatCurrency}
          pricePerLine={pricePerLine}
          annualPrice={carrierPlan.annualPrice}
        />
        
        <MonthlyCostComparison
          totalVerizonPrice={totalVerizonPrice}
          carrierTotalPrice={carrierTotalPrice}
          monthlySavings={monthlySavings}
          annualSavings={annualSavings}
          formatCurrency={formatCurrency}
          carrierName={carrier.name}
        />
        
        <FeatureComparison
          priceBetter={priceBetter}
          dataBetter={dataBetter}
          hotspotBetter={hotspotBetter}
          perksBetter={perksBetter}
          carrierName={carrier.name}
        />
      </div>
      
      <PlanFeatures
        features={carrierPlan.features}
        streamingPerks={carrierPlan.streamingPerks}
        carrierName={carrier.name}
      />
      
      <ComparisonFootnote carrierName={carrier.name} />
    </>
  );
}
