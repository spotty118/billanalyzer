
import { CheckCircle } from "lucide-react";

interface PlanFeaturesProps {
  features: string[];
  streamingPerks: string[];
  carrierName: string;
}

export function PlanFeatures({ features, streamingPerks, carrierName }: PlanFeaturesProps) {
  return (
    <div className="mt-4 pt-4 border-t">
      <h3 className="font-semibold mb-2">{carrierName} Plan Features:</h3>
      <ul className="text-sm grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
        {features.map((feature, idx) => (
          <li key={idx} className="flex items-start">
            <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      
      <h3 className="font-semibold mt-3 mb-2">Streaming Perks Included:</h3>
      <ul className="text-sm grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
        {streamingPerks.map((perk, idx) => (
          <li key={idx} className="flex items-start">
            <CheckCircle className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
            <span>{perk}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
