
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

export function MilitaryDiscountBanner() {
  return (
    <div className="flex items-center">
      <Button 
        variant="outline" 
        className="w-full text-gray-400 cursor-not-allowed bg-gray-50"
        disabled
      >
        Military Discount (Coming Soon)
      </Button>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="ml-2 h-4 w-4 text-gray-400" />
          </TooltipTrigger>
          <TooltipContent>
            <p>Military discount feature is currently under development</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
