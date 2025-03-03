
import { CheckCircle, AlertCircle } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from "@/components/ui/tooltip";

interface ComparisonIndicatorProps { 
  winner: 'carrier' | 'verizon' | 'equal';
  carrierName: string;
}

export function ComparisonIndicator({ winner, carrierName }: ComparisonIndicatorProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger className="flex items-center">
          {winner === 'carrier' ? (
            <span className="flex items-center text-green-600 font-medium">
              {carrierName} <CheckCircle className="h-4 w-4 ml-1" />
            </span>
          ) : winner === 'verizon' ? (
            <span className="flex items-center text-red-600 font-medium">
              Verizon <CheckCircle className="h-4 w-4 ml-1" />
            </span>
          ) : (
            <span className="flex items-center text-gray-600 font-medium">
              Equal <AlertCircle className="h-4 w-4 ml-1" />
            </span>
          )}
        </TooltipTrigger>
        <TooltipContent>
          {winner === 'carrier' 
            ? `${carrierName} offers better value` 
            : winner === 'verizon' 
              ? "Verizon has an advantage here" 
              : "Both options are comparable"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
